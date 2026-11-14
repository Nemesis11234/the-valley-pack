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
        "너는 한국 인터넷 방송(치지직·숲·트위치) 채팅창의 시청자 여러 명을 연기한다.",
        "방송은 마인크래프트 농사·생활 모드팩(스타듀밸리 비슷함) 플레이 방송이다. 시청자들은 이 게임을 잘 아는 편이다.",
        "",
        "[말투: 진짜 한국 방송 채팅처럼]",
        "- 반말, 짧게(대부분 3~15자, 길어도 25자). 마침표 거의 안 씀. 띄어쓰기 대충, 가끔 오타.",
        "- 초성·줄임말: ㅋㅋ(길이 다양하게 ㅋㅋㅋㅋㅋ), ㄷㄷ, ㄹㅇ, ㅇㅈ, ㅇㅇ, ㄴㄴ, ㅁㅊ, ㄹㅈㄷ, ㄱㄱ, ㅂㅂ, ㅠㅠ, ㅎㅇ, ㄱㅅ",
        "- 자주 쓰는 표현: 미쳤다, 무친, 개웃기네, 아니 ㅋㅋ, 와 진짜, 실화냐, 레전드, 찢었다, 폼 미쳤다, 감다살(감 다 살았네), 킹받네,",
        "  억까, 억빠, 뇌절, 국룰, 각(클립각·방종각·사망각), 가보자고, 오히려 좋아, 이게 맞나, 어케함, 개추, 박제, 꿀잼/노잼, 갓겜, 고인물, 뉴비, 훈수, 존버",
        "- 강조: 개-(개웃김, 개쩜), 찐-, 핵-, 같은 글자 반복(제발제발, 가자가자), 물음표·느낌표만 치기(?, ???, !!)",
        "- 채팅창 느낌: 누군가 웃기면 여러 명이 ㅋㅋ만 치기, 다른 사람 채팅에 대꾸하기, 딴소리, 뜬금 질문, 훈수, 놀림, 응원이 섞임.",
        "- 이모지·이모티콘 쓰지 않는다. 어색한 존댓말·설명조·번역투 금지 (나쁜 예: \"정말 대단하네요!\" → 좋은 예: \"ㄷㄷ 미쳤네\", \"와 이걸 하네 ㅋㅋ\").",
        "",
        "[내용]",
        "- 줄 수는 요청에 적힌 만큼.",
        "- 화면 상황(장소·시간·날씨·체력·화면에 보이는 것·최근 행동)을 보고 있는 것처럼 구체적으로 언급한다. 예: 밤인데 크리퍼 옆, 체력 낮은데 싸움, 비 오는 날 낚시.",
        "- 몹·동물·다른 플레이어는 '화면에 보이는 것'에 적힌 것만 말한다. 적혀 있지 않은 몹을 미리 알거나(\"뒤에 좀비 있음\") 숫자를 지어내지 않는다.",
        "- 방금 일어난 일에 구체적으로 반응한다. 같은 말을 반복하지 않고, 최근 채팅과 겹치지 않게 한다.",
        "- [가장 중요] 화면에 보이는 걸 그대로 읽어 주는 중계·묘사 채팅 금지. 나쁜 예: \"평원이네\", \"검은색 양털 들고 뭐 함?\", \"나무 베는 중\", \"12개째 캐는 중\", \"밤이다\", \"비 온다\".",
        "  대신 그 상황에 대한 감정(웃김·긴장·감탄·걱정)·훈수·드립·스트리머 놀리기·다른 채팅에 대꾸로 쓴다. 좋은 예: \"나무 다 밀어버리네 ㅋㅋ\", \"밤에 맨몸으로 나가는 거 실화냐\", \"비 오는데 낚시 안 감?\".",
        "- 손에 든 평범한 아이템(양털·흙·씨앗 등)이나 바이옴 이름은 말하지 않는다. 의미 있을 때만(크리퍼 앞, 체력 낮음, 첫 다이아, 보스 등).",
        "- 가끔 스트리머 이름(또는 줄여서)을 부른다. 스트리머가 채팅을 쳤으면 그 말에 대답하는 줄을 포함한다.",
        "- 상황에 '단골 시청자'가 있으면 줄의 절반쯤은 단골 닉네임으로 쓴다 (단골은 스트리머와 친한 말투). '지난 방송 명장면'은 잡담일 때 가끔만 꺼낸다 (예: 어제 터진 거 아직도 웃김).",
        "",
        "- 짓궂은 놀림도 자주 섞는다 (친한 시청자가 장난치듯): 실력 이슈, 발컨, 똥손, 또 죽었어? ㅋㅋ, 이게 집이라고?, 방장 길치임?, 클립 따놨다. 상처 주는 인신공격·외모·실제 개인 얘기는 하지 않는다.",
        "- 아주 가벼운 표현만 가끔 쓴다: 개-(개웃김, 개쩜), 미친, 미쳤냐, ㅁㅊ, 뒤졌다(죽었을 때). ㅅㅂ·시바·ㅈㄴ·존나·ㅈ됐다·ㅈㄹ 같은 욕은 절대 쓰지 않는다.",
        "- 진짜 치지직 채팅 느낌: 스트리머를 '방장'이라고도 부름, '?'만 치기, 웃기면 여러 명이 ㅋㅋ 따라 치기, 놀림(발컨 ㅋㅋ), 응원, 밈(럭키비키, 감다살, 중꺾마, 알잘딱깔센, 가보자고), 방종 ㄴㄴ, 클립각.",
        "[금지] 병신 같은 장애 비하, 패드립(부모 욕), 혐오·차별 표현, 성적인 말·드립·밈(은근한 성적 암시나 야한 이중 의미도 전부 금지), 실존 인물 언급, 개인정보 요구, 후원 금액이나 명령어 언급.",
        "",
        "[예시] 상황: 밤, 체력 4/20, 화면에 보이는 것: 적:크리퍼 2 →",
        "[{\"n\":\"광산노예\",\"m\":\"앞에 크리퍼!!\"},{\"n\":\"ㅇㅇ\",\"m\":\"크리퍼 2마리 ㅁㅊ\"},{\"n\":\"훈수두는고양이\",\"m\":\"체력 4칸인데 왜 거깄음\"},{\"n\":\"새벽세시\",\"m\":\"사망각 ㅋㅋㅋㅋ\"}]",
        "[예시] 잡담 / 상황: 낮, 바깥, 최근 1분 동안: 벤 나무 참나무 원목 9 →",
        "[{\"n\":\"자취3년차\",\"m\":\"숲 다 밀어버리네 ㅋㅋ\"},{\"n\":\"훈수두는고양이\",\"m\":\"방장 집은 언제 지음\"},{\"n\":\"새벽세시\",\"m\":\"ㄹㅇ 노숙 3일차\"},{\"n\":\"감자러버\",\"m\":\"ㅋㅋㅋㅋ\"}]",
        "[예시] 방금: 생애 첫 다이아몬드 →",
        "[{\"n\":\"감자러버\",\"m\":\"헐 다이아\"},{\"n\":\"마크고수123\",\"m\":\"옆에 더 있음 파봐\"},{\"n\":\"닉값하는중\",\"m\":\"폼 미쳤다 ㄷㄷ\"}]",
        "",
        "- 이름은 주어진 시청자 이름 목록에서 고른다. 목록의 괄호는 그 시청자 성격이다 (리액션러: 짧은 반응, 장난꾸러기: 놀림, 훈수꾼: 훈수, 질문러: 질문, 응원러: 응원, 고인물: 게임 정보, 힐링러: 잔잔한 말, 눈팅족: 거의 말 안 함). 성격대로 말하고, n에는 괄호 없이 닉네임만 쓴다.",
        "- 시청자 수가 많을수록(busy 값이 클수록) 처음 온 사람, 시청자끼리 @닉네임 대꾸, 같은 반응 도배(ㅋㅋㅋ, ????)가 늘어난다. 적을 땐 단골끼리 잔잔하게.",
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

    @SuppressWarnings("unchecked")
    static void loadConfig() throws IOException {
        Path p = DIR.resolve("config.json");
        if (!Files.exists(p)) {
            Map<String, Object> def = new LinkedHashMap<>();
            def.put("apiKey", "");
            def.put("model", "claude-haiku-5-5");
            def.put("dailyLimitUsd", 2.5);
            def.put("monthlyLimitUsd", 40.0);
            def.put("inputUsdPerMTok", 0.10);
            def.put("outputUsdPerMTok", 0.50);
            def.put("maxTokens", 300);
            writeAtomic(p, Json.write(def, true));
            System.out.println("[The Valley AI] config.json을 만들었어요. apiKey에 Claude API 키를 넣어 주세요.");
        }
        Map<String, Object> raw;
        try {
            Object o = Json.parse(Files.readString(p, StandardCharsets.UTF_8).replace("\uFEFF", ""));
            raw = o instanceof Map ? (Map<String, Object>) o : null;
        } catch (Exception e) {
            raw = null;
        }
        configBroken = raw == null;
        if (raw == null) raw = new LinkedHashMap<>();
        // 빠진 값은 기본값으로
        Map<String, Object> merged = new LinkedHashMap<>(defaults());
        for (Map.Entry<String, Object> e : raw.entrySet()) if (e.getValue() != null) merged.put(e.getKey(), e.getValue());
        // AWS 서버: 저장소의 한도 파일이 있으면 그 값이 우선 (/opt/valley/repo/server-control/ai-limits.json)
        Path limits = Paths.get("..", "repo", "server-control", "ai-limits.json");
        if (Files.exists(limits)) {
            try {
                Object o = Json.parse(Files.readString(limits, StandardCharsets.UTF_8));
                if (o instanceof Map) {
                    Map<String, Object> lm = (Map<String, Object>) o;
                    for (String k : List.of("dailyLimitUsd", "monthlyLimitUsd")) if (lm.get(k) != null) merged.put(k, lm.get(k));
                }
            } catch (Exception ignored) {
            }
        }
        config = merged;
    }

    static boolean configBroken = false;

    static Map<String, Object> defaults() {
        Map<String, Object> def = new LinkedHashMap<>();
        def.put("apiKey", "");
        def.put("model", "claude-haiku-5-5");
        def.put("dailyLimitUsd", 2.5);
        def.put("monthlyLimitUsd", 40.0);
        def.put("inputUsdPerMTok", 0.10);
        def.put("outputUsdPerMTok", 0.50);
        def.put("maxTokens", 300);
        return def;
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
            case "idle" -> "평범하게 플레이 중. 진짜 방송 채팅창처럼: 지금 상황을 보고 드는 감정·훈수·드립·방장 놀리기·다른 시청자 채팅에 대꾸 위주로 쓴다. 화면을 그대로 읽는 묘사는 금지. 상황과 상관없는 밥·학교·회사 얘기는 쓰지 않는다";
            case "donation" -> "시청자 '" + str(extra(req).get("donor")) + "'가 " + num(extra(req).get("amount")).intValue()
                + "원을 후원함. 상황: " + str(req.get("text"))
                + ". 첫 줄은 반드시 이름 '" + str(extra(req).get("donor")) + "'로, 후원과 함께 보내는 메시지(35자 이내, 방금 상황이나 스트리머를 구체적으로 언급, 재치있게)."
                + " 나머지 줄은 다른 시청자들이 후원에 놀라는 반응";
            case "recap" -> "방송이 끝남. 오늘 방송 기록: " + str(req.get("text"))
                + ". 이번엔 시청자 채팅이 아니라 '오늘 방송 한 줄 평' 딱 1줄만 작성 (40자 이내, 기록을 바탕으로 재치있게, 이름은 '한줄평')";
            default -> "방금 일어난 일: " + str(req.get("text"));
        };
        StringBuilder u = new StringBuilder();
        u.append("스트리머: ").append(str(req.get("streamer"))).append('\n');
        u.append("시청자 수: ").append(num(req.get("viewers")).intValue()).append(", 구독자: ").append(num(req.get("subs")).intValue()).append('\n');
        String ctx = str(req.get("context"));
        if (!ctx.isEmpty()) u.append("지금 화면 상황 (시청자들이 화면으로 보고 있는 것):\n").append(ctx).append('\n');
        else u.append("장소: ").append(str(req.get("dimension"))).append('\n');
        double busy = Math.max(0, Math.min(1, num(req.get("busy")).doubleValue()));
        int lineCount = 2 + (int) Math.round(busy * 4);
        if ("recap".equals(kind)) lineCount = 1;
        if ("donation".equals(kind)) lineCount = Math.min(lineCount, 3);
        String mood = busy < 0.4 ? "조용함 (시청자 적음)" : busy < 0.7 ? "보통" : busy < 0.9 ? "북적임" : "난리남 (시청자 아주 많음)";
        u.append("채팅 분위기: ").append(mood).append(" → ").append(lineCount).append("줄 작성\n");
        u.append(what).append('\n');
        Object recent = req.get("recent");
        if (recent instanceof List && !((List<Object>) recent).isEmpty()) {
            u.append("최근 채팅:\n");
            for (Object l : (List<Object>) recent) u.append("  ").append(str(l)).append('\n');
        }
        u.append("시청자 이름 목록: ").append(String.join(", ", strList(req.get("names"))));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", str(config.get("model")));
        // 생각(thinking) 끄기: 채팅 몇 줄에는 필요 없고 토큰만 씀
        Map<String, Object> thinking = new LinkedHashMap<>();
        thinking.put("type", "disabled");
        body.put("thinking", thinking);
        body.put("max_tokens", Math.max(num(config.getOrDefault("maxTokens", 300)).intValue(), 120 + lineCount * 50));
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
            if (lines.size() >= 7) break;
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
            String err = configBroken ? "config.json 형식 오류 (따옴표·쉼표 확인)" : apiKey().isEmpty() ? "API 키 없음" : lastError;
            st.put("lastError", err);
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
    @SuppressWarnings("unchecked")
    static Map<String, Object> extra(Map<String, Object> req) {
        Object e = req.get("extra");
        return e instanceof Map ? (Map<String, Object>) e : new LinkedHashMap<>();
    }
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
