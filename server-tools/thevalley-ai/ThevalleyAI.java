// The Valley AI 시청자 채팅 도우미
// 서버 폴더에서 실행: java -jar thevalley_ai/thevalley-ai.jar
// thevalley_ai/out.json(요청)을 읽어 Claude API를 부르고, thevalley_ai/in.json(답)에 쓴다.
// API 키는 thevalley_ai/config.json의 apiKey 또는 환경 변수 ANTHROPIC_API_KEY.
// 하루·한 달 한도(달러)를 넘으면 더 부르지 않는다. 사용량은 thevalley_ai/usage.json에 남는다.

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

public class ThevalleyAI {
    static final Path DIR = Paths.get("thevalley_ai");
    static final ZoneId ZONE = ZoneId.of("Asia/Tokyo");
    static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    static Map<String, Object> config;
    static Map<String, Object> usage;
    static String lastError = "";
    static String session = "";
    static long lastSeq = 0;
    static final Deque<Map<String, Object>> responses = new ArrayDeque<>();

    static final String SYSTEM = String.join("\n",
        "너는 한국 인터넷 방송(치지직·트위치) 채팅창의 시청자 여러 명을 연기한다.",
        "방송은 마인크래프트 농사·생활 모드팩(스타듀밸리 비슷함) 플레이 방송이다. 시청자들은 이 게임을 잘 아는 편이다.",
        "규칙:",
        "- 2~4줄. 한 줄은 25자 이내. 실제 채팅처럼 짧고 가볍게, 반말과 인터넷 말투(ㅋㅋ, ㄷㄷ, ㄹㅇ, ?, ㅠㅠ)를 섞는다.",
        "- 방금 일어난 일에 구체적으로 반응한다. 같은 말을 반복하지 않고, 최근 채팅과 겹치지 않게 한다.",
        "- 사람마다 성격이 다르게: 감탄, 놀림, 훈수, 딴소리, 질문 등을 섞는다. 가끔 스트리머 이름을 부른다.",
        "- 스트리머가 채팅을 쳤으면 그 말에 대답하는 줄을 포함한다.",
        "- 욕설·혐오·성적인 말·실존 인물 언급·개인정보 요구 금지. 후원 금액이나 명령어 언급 금지.",
        "- 이름은 주어진 시청자 이름 목록에서 고른다.",
        "- 출력은 JSON 배열만: [{\"n\":\"시청자이름\",\"m\":\"채팅\"}] 다른 글자는 쓰지 않는다.");

    public static void main(String[] args) throws Exception {
        Files.createDirectories(DIR);
        System.out.println("[The Valley AI] 시작. 폴더: " + DIR.toAbsolutePath());
        loadConfig();
        usage = readMap(DIR.resolve("usage.json"));
        while (true) {
            try {
                loadConfig();
                tick();
            } catch (Exception e) {
                lastError = shortErr(e);
            }
            writeStatus();
            Thread.sleep(500);
        }
    }

    static void loadConfig() throws IOException {
        Path p = DIR.resolve("config.json");
        if (!Files.exists(p)) {
            Map<String, Object> def = new LinkedHashMap<>();
            def.put("apiKey", "");
            def.put("model", "claude-haiku-5-5");
            def.put("dailyLimitUsd", 1.5);
            def.put("monthlyLimitUsd", 25.0);
            def.put("inputUsdPerMTok", 0.10);
            def.put("outputUsdPerMTok", 0.50);
            def.put("maxTokens", 300);
            writeAtomic(p, Json.write(def, true));
            System.out.println("[The Valley AI] config.json을 만들었어요. apiKey에 Claude API 키를 넣어 주세요.");
        }
        config = readMap(p);
    }

    static String apiKey() {
        String k = str(config.get("apiKey"));
        if (k.isEmpty()) k = Optional.ofNullable(System.getenv("ANTHROPIC_API_KEY")).orElse("");
        return k.trim();
    }

    @SuppressWarnings("unchecked")
    static void tick() throws Exception {
        Map<String, Object> out = readMap(DIR.resolve("out.json"));
        String s = str(out.get("session"));
        if (s.isEmpty()) return;
        if (!s.equals(session)) {
            session = s;
            lastSeq = 0;
            responses.clear();
        }
        Object reqs = out.get("requests");
        if (!(reqs instanceof List)) return;
        for (Object o : (List<Object>) reqs) {
            Map<String, Object> req = (Map<String, Object>) o;
            long seq = num(req.get("seq")).longValue();
            if (seq <= lastSeq) continue;
            lastSeq = seq;
            if (System.currentTimeMillis() - num(req.get("at")).longValue() > 30000) continue; // 너무 오래된 요청
            if (apiKey().isEmpty()) { lastError = "API 키 없음"; continue; }
            if (overBudget()) { lastError = "사용 한도 도달"; continue; }
            List<Object> lines = callClaude(req);
            if (lines == null) continue;
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("seq", seq);
            r.put("uuid", req.get("uuid"));
            r.put("lines", lines);
            responses.addLast(r);
            while (responses.size() > 40) responses.removeFirst();
            Map<String, Object> in = new LinkedHashMap<>();
            in.put("session", session);
            in.put("responses", new ArrayList<>(responses));
            writeAtomic(DIR.resolve("in.json"), Json.write(in, false));
        }
    }

    @SuppressWarnings("unchecked")
    static List<Object> callClaude(Map<String, Object> req) throws Exception {
        String kind = str(req.get("kind"));
        String what = switch (kind) {
            case "chat" -> "스트리머가 채팅을 침: \"" + str(req.get("text")) + "\"";
            case "idle" -> "특별한 일 없이 평범하게 플레이 중 (잡담해도 됨)";
            default -> "방금 일어난 일: " + str(req.get("text"));
        };
        StringBuilder u = new StringBuilder();
        u.append("스트리머: ").append(str(req.get("streamer"))).append('\n');
        u.append("시청자 수: ").append(num(req.get("viewers")).intValue()).append(", 구독자: ").append(num(req.get("subs")).intValue()).append('\n');
        u.append("장소: ").append(str(req.get("dimension"))).append('\n');
        u.append(what).append('\n');
        Object recent = req.get("recent");
        if (recent instanceof List && !((List<Object>) recent).isEmpty()) {
            u.append("최근 채팅:\n");
            for (Object l : (List<Object>) recent) u.append("  ").append(str(l)).append('\n');
        }
        u.append("시청자 이름 목록: ").append(String.join(", ", strList(req.get("names"))));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", str(config.get("model")));
        body.put("max_tokens", num(config.getOrDefault("maxTokens", 300)).intValue());
        body.put("system", SYSTEM);
        body.put("messages", List.of(Map.of("role", "user", "content", u.toString())));

        HttpRequest http = HttpRequest.newBuilder(URI.create(Optional.ofNullable(System.getenv("THEVALLEY_AI_URL")).orElse("https://api.anthropic.com/v1/messages")))
            .timeout(Duration.ofSeconds(25))
            .header("x-api-key", apiKey())
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(Json.write(body, false), StandardCharsets.UTF_8))
            .build();
        HttpResponse<String> res = HTTP.send(http, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (res.statusCode() != 200) {
            lastError = "API 오류 " + res.statusCode();
            System.out.println("[The Valley AI] " + lastError + ": " + res.body().substring(0, Math.min(300, res.body().length())));
            return null;
        }
        Map<String, Object> data = (Map<String, Object>) Json.parse(res.body());
        Map<String, Object> use = (Map<String, Object>) data.getOrDefault("usage", Map.of());
        long inTok = num(use.get("input_tokens")).longValue() + num(use.get("cache_creation_input_tokens")).longValue()
            + num(use.get("cache_read_input_tokens")).longValue();
        long outTok = num(use.get("output_tokens")).longValue();
        addUsage(inTok, outTok);
        lastError = "";

        StringBuilder text = new StringBuilder();
        for (Object c : (List<Object>) data.getOrDefault("content", List.of())) {
            Map<String, Object> cm = (Map<String, Object>) c;
            if ("text".equals(cm.get("type"))) text.append(str(cm.get("text")));
        }
        String t = text.toString();
        int a = t.indexOf('['), b = t.lastIndexOf(']');
        if (a < 0 || b <= a) return null;
        Object parsed = Json.parse(t.substring(a, b + 1));
        if (!(parsed instanceof List)) return null;
        List<Object> lines = new ArrayList<>();
        for (Object o : (List<Object>) parsed) {
            if (!(o instanceof Map)) continue;
            Map<String, Object> m = (Map<String, Object>) o;
            Map<String, Object> l = new LinkedHashMap<>();
            l.put("n", str(m.get("n")));
            l.put("m", str(m.get("m")));
            lines.add(l);
            if (lines.size() >= 5) break;
        }
        return lines;
    }

    // ───── 사용량·한도 ─────

    @SuppressWarnings("unchecked")
    static Map<String, Object> bucket(String key, String id) {
        Map<String, Object> b = (Map<String, Object>) usage.get(key);
        if (b == null || !id.equals(str(b.get("id")))) {
            b = new LinkedHashMap<>();
            b.put("id", id);
            b.put("calls", 0L);
            b.put("inTok", 0L);
            b.put("outTok", 0L);
            b.put("usd", 0.0);
            usage.put(key, b);
        }
        return b;
    }

    static String today() { return LocalDate.now(ZONE).toString(); }
    static String month() { return today().substring(0, 7); }

    static void addUsage(long inTok, long outTok) throws IOException {
        double usd = inTok / 1e6 * num(config.get("inputUsdPerMTok")).doubleValue()
            + outTok / 1e6 * num(config.get("outputUsdPerMTok")).doubleValue();
        for (Map<String, Object> b : List.of(bucket("today", today()), bucket("month", month()))) {
            b.put("calls", num(b.get("calls")).longValue() + 1);
            b.put("inTok", num(b.get("inTok")).longValue() + inTok);
            b.put("outTok", num(b.get("outTok")).longValue() + outTok);
            b.put("usd", num(b.get("usd")).doubleValue() + usd);
        }
        writeAtomic(DIR.resolve("usage.json"), Json.write(usage, true));
    }

    static boolean overBudget() {
        return num(bucket("today", today()).get("usd")).doubleValue() >= num(config.get("dailyLimitUsd")).doubleValue()
            || num(bucket("month", month()).get("usd")).doubleValue() >= num(config.get("monthlyLimitUsd")).doubleValue();
    }

    static void writeStatus() {
        try {
            Map<String, Object> st = new LinkedHashMap<>();
            st.put("heartbeat", System.currentTimeMillis());
            st.put("ok", !apiKey().isEmpty() && !overBudget() && !lastError.startsWith("API 오류 401"));
            st.put("lastError", lastError);
            st.put("today", bucket("today", today()));
            st.put("month", bucket("month", month()));
            st.put("dailyLimitUsd", config.get("dailyLimitUsd"));
            st.put("monthlyLimitUsd", config.get("monthlyLimitUsd"));
            writeAtomic(DIR.resolve("status.json"), Json.write(st, false));
        } catch (Exception ignored) {
        }
    }

    // ───── 파일·값 도우미 ─────

    @SuppressWarnings("unchecked")
    static Map<String, Object> readMap(Path p) {
        try {
            if (!Files.exists(p)) return new LinkedHashMap<>();
            Object o = Json.parse(Files.readString(p, StandardCharsets.UTF_8));
            return o instanceof Map ? (Map<String, Object>) o : new LinkedHashMap<>();
        } catch (Exception e) {
            return new LinkedHashMap<>(); // 쓰는 도중에 읽었으면 다음에 다시
        }
    }

    static void writeAtomic(Path p, String s) throws IOException {
        Path tmp = p.resolveSibling(p.getFileName() + ".tmp");
        Files.writeString(tmp, s, StandardCharsets.UTF_8);
        try {
            Files.move(tmp, p, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (AtomicMoveNotSupportedException e) {
            Files.move(tmp, p, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    static String str(Object o) { return o == null ? "" : String.valueOf(o); }
    static Number num(Object o) {
        if (o instanceof Number n) return n;
        try { return Double.parseDouble(str(o)); } catch (Exception e) { return 0; }
    }
    @SuppressWarnings("unchecked")
    static List<String> strList(Object o) {
        List<String> r = new ArrayList<>();
        if (o instanceof List) for (Object x : (List<Object>) o) r.add(str(x));
        return r;
    }
    static String shortErr(Exception e) {
        String m = e.getClass().getSimpleName() + (e.getMessage() == null ? "" : ": " + e.getMessage());
        return m.length() > 80 ? m.substring(0, 80) : m;
    }

    // ───── 작은 JSON 파서/작성기 (외부 라이브러리 없이) ─────
    static final class Json {
        private final String s;
        private int i;
        private Json(String s) { this.s = s; }

        static Object parse(String s) {
            Json j = new Json(s);
            j.ws();
            Object v = j.value();
            return v;
        }

        private void ws() { while (i < s.length() && Character.isWhitespace(s.charAt(i))) i++; }

        private Object value() {
            ws();
            if (i >= s.length()) throw new IllegalArgumentException("JSON 끝");
            char c = s.charAt(i);
            if (c == '{') return obj();
            if (c == '[') return arr();
            if (c == '"') return string();
            if (s.startsWith("true", i)) { i += 4; return Boolean.TRUE; }
            if (s.startsWith("false", i)) { i += 5; return Boolean.FALSE; }
            if (s.startsWith("null", i)) { i += 4; return null; }
            int st = i;
            while (i < s.length() && "+-0123456789.eE".indexOf(s.charAt(i)) >= 0) i++;
            String n = s.substring(st, i);
            if (n.isEmpty()) throw new IllegalArgumentException("JSON 값 오류 " + st);
            if (n.contains(".") || n.contains("e") || n.contains("E")) return Double.parseDouble(n);
            return Long.parseLong(n);
        }

        private Map<String, Object> obj() {
            Map<String, Object> m = new LinkedHashMap<>();
            i++;
            ws();
            if (s.charAt(i) == '}') { i++; return m; }
            while (true) {
                ws();
                String k = string();
                ws();
                i++; // :
                m.put(k, value());
                ws();
                char c = s.charAt(i++);
                if (c == '}') return m;
            }
        }

        private List<Object> arr() {
            List<Object> l = new ArrayList<>();
            i++;
            ws();
            if (s.charAt(i) == ']') { i++; return l; }
            while (true) {
                l.add(value());
                ws();
                char c = s.charAt(i++);
                if (c == ']') return l;
            }
        }

        private String string() {
            StringBuilder b = new StringBuilder();
            i++;
            while (true) {
                char c = s.charAt(i++);
                if (c == '"') return b.toString();
                if (c == '\\') {
                    char e = s.charAt(i++);
                    switch (e) {
                        case 'n' -> b.append('\n');
                        case 't' -> b.append('\t');
                        case 'r' -> b.append('\r');
                        case 'b' -> b.append('\b');
                        case 'f' -> b.append('\f');
                        case 'u' -> { b.append((char) Integer.parseInt(s.substring(i, i + 4), 16)); i += 4; }
                        default -> b.append(e);
                    }
                } else b.append(c);
            }
        }

        static String write(Object o, boolean pretty) {
            StringBuilder b = new StringBuilder();
            write(b, o, pretty, 0);
            return b.toString();
        }

        @SuppressWarnings("unchecked")
        private static void write(StringBuilder b, Object o, boolean pretty, int depth) {
            String nl = pretty ? "\n" + "  ".repeat(depth + 1) : "";
            String end = pretty ? "\n" + "  ".repeat(depth) : "";
            if (o == null) b.append("null");
            else if (o instanceof String str) quote(b, str);
            else if (o instanceof Number || o instanceof Boolean) b.append(o);
            else if (o instanceof Map) {
                Map<String, Object> m = (Map<String, Object>) o;
                b.append('{');
                int n = 0;
                for (Map.Entry<String, Object> e : m.entrySet()) {
                    if (n++ > 0) b.append(',');
                    b.append(nl);
                    quote(b, e.getKey());
                    b.append(pretty ? ": " : ":");
                    write(b, e.getValue(), pretty, depth + 1);
                }
                if (n > 0) b.append(end);
                b.append('}');
            } else if (o instanceof Collection) {
                b.append('[');
                int n = 0;
                for (Object x : (Collection<Object>) o) {
                    if (n++ > 0) b.append(',');
                    b.append(nl);
                    write(b, x, pretty, depth + 1);
                }
                if (n > 0) b.append(end);
                b.append(']');
            } else quote(b, String.valueOf(o));
        }

        private static void quote(StringBuilder b, String s) {
            b.append('"');
            for (char c : s.toCharArray()) {
                switch (c) {
                    case '"' -> b.append("\\\"");
                    case '\\' -> b.append("\\\\");
                    case '\n' -> b.append("\\n");
                    case '\r' -> b.append("\\r");
                    case '\t' -> b.append("\\t");
                    default -> {
                        if (c < 0x20) b.append(String.format("\\u%04x", (int) c));
                        else b.append(c);
                    }
                }
            }
            b.append('"');
        }
    }
}
