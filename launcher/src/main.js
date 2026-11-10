'use strict';
// The Valley 런처 — 메인 프로세스
// 실행하기: Java 17 → Prism(포터블) → 인스턴스 → 모드 동기화(packwiz) → 수동 모드 → 게임 실행 + 서버 자동 접속

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const net = require('net');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const extract = require('extract-zip');

const DEFAULT_CONFIG = require('./default-config.json');
const CONFIG_URL = 'https://raw.githubusercontent.com/Nemesis11234/the-valley-pack/main/launcher-config.json';
const INSTANCE_ID = 'TheValley';
const UA = 'TheValleyLauncher/1.0 (+https://github.com/Nemesis11234/the-valley-pack)';

const BASE = path.join(process.env.LOCALAPPDATA || app.getPath('userData'), 'TheValleyLauncher');
const JAVA_DIR = path.join(BASE, 'java');
const PRISM_DIR = path.join(BASE, 'prism');
const INST_DIR = path.join(PRISM_DIR, 'instances', INSTANCE_ID);
const GAME_DIR = path.join(INST_DIR, 'minecraft');
const STATE_FILE = path.join(BASE, 'state.json');
const LOG_FILE = path.join(BASE, 'launcher.log');

let win = null;
let config = { ...DEFAULT_CONFIG };
let busy = false;
let manualWaiter = null; // { cancel() }

// ───────────────────────── 공용 유틸 ─────────────────────────

function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(' ')}\n`;
  try { fs.mkdirSync(BASE, { recursive: true }); fs.appendFileSync(LOG_FILE, line); } catch (_) { /* 로그 실패는 무시 */ }
}

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function progress(step, detail, ratio) {
  send('progress', { step, detail: detail || '', ratio: typeof ratio === 'number' ? ratio : null });
  log('progress', step, detail || '');
}

const exists = (p) => fs.existsSync(p);
const toSlash = (p) => p.replace(/\\/g, '/');

async function readJson(p, fallback) {
  try { return JSON.parse(await fsp.readFile(p, 'utf8')); } catch (_) { return fallback; }
}

async function writeJson(p, data) {
  await fsp.mkdir(path.dirname(p), { recursive: true });
  await fsp.writeFile(p, JSON.stringify(data, null, 2), 'utf8');
}

async function fetchText(url, timeoutMs = 15000) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) { const e = new Error(`HTTP ${res.status} ${url}`); e.status = res.status; throw e; }
  return res.text();
}

async function fetchJson(url, timeoutMs) {
  return JSON.parse(await fetchText(url, timeoutMs));
}

// 진행률을 보내면서 파일 다운로드
async function download(url, dest, label) {
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok || !res.body) throw new Error(`다운로드 실패 (HTTP ${res.status}): ${label}`);
  const total = Number(res.headers.get('content-length')) || 0;
  let got = 0;
  let lastSent = 0;
  const body = Readable.fromWeb(res.body);
  body.on('data', (chunk) => {
    got += chunk.length;
    const now = Date.now();
    if (now - lastSent > 150) {
      lastSent = now;
      const mb = (got / 1048576).toFixed(1);
      const detail = total ? `${mb} / ${(total / 1048576).toFixed(1)} MB` : `${mb} MB`;
      progress(label, detail, total ? got / total : null);
    }
  });
  const tmp = dest + '.part';
  await pipeline(body, fs.createWriteStream(tmp));
  await fsp.rename(tmp, dest);
}

async function sha1File(p) {
  const hash = crypto.createHash('sha1');
  await pipeline(fs.createReadStream(p), hash);
  return hash.digest('hex');
}

// INI(키=값) 파일 병합 — Prism 설정 파일 형식
async function mergeIni(p, values) {
  const map = new Map();
  try {
    const text = await fsp.readFile(p, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const i = line.indexOf('=');
      if (i > 0) map.set(line.slice(0, i), line.slice(i + 1));
    }
  } catch (_) { /* 새 파일 */ }
  for (const [k, v] of Object.entries(values)) map.set(k, String(v));
  const out = [...map.entries()].map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
  await fsp.mkdir(path.dirname(p), { recursive: true });
  await fsp.writeFile(p, out, 'utf8');
}

// dir 아래(최대 depth 단계)에서 파일 찾기
function findFile(dir, name, depth = 3) {
  if (!exists(dir)) return null;
  const direct = path.join(dir, name);
  if (exists(direct)) return direct;
  if (depth <= 0) return null;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      const hit = findFile(path.join(dir, ent.name), name, depth - 1);
      if (hit) return hit;
    }
  }
  return null;
}

// pack.toml에서 필요한 값만 읽기 (간단한 TOML 파서)
function parsePackToml(text) {
  const out = { name: '', version: '', versions: {} };
  let section = '';
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const sec = line.match(/^\[(.+)\]$/);
    if (sec) { section = sec[1].trim(); continue; }
    const kv = line.match(/^([A-Za-z0-9_-]+)\s*=\s*"(.*)"\s*$/);
    if (!kv) continue;
    if (section === '' && kv[1] === 'name') out.name = kv[2];
    if (section === '' && kv[1] === 'version') out.version = kv[2];
    if (section === 'versions') out.versions[kv[1]] = kv[2];
  }
  return out;
}

// ───────────────────────── 설정 / 상태 ─────────────────────────

async function loadConfig() {
  try {
    const remote = await fetchJson(CONFIG_URL, 8000);
    config = { ...DEFAULT_CONFIG, ...remote, server: { ...DEFAULT_CONFIG.server, ...(remote.server || {}) } };
    await writeJson(path.join(BASE, 'config-cache.json'), config);
  } catch (e) {
    log('원격 설정 실패, 캐시 사용:', e.message);
    const cached = await readJson(path.join(BASE, 'config-cache.json'), null);
    config = cached ? { ...DEFAULT_CONFIG, ...cached } : { ...DEFAULT_CONFIG };
  }
  return config;
}

function findJava() {
  return findFile(JAVA_DIR, path.join('bin', 'javaw.exe'), 2) ||
    (exists(JAVA_DIR) ? (() => {
      for (const ent of fs.readdirSync(JAVA_DIR, { withFileTypes: true })) {
        const p = path.join(JAVA_DIR, ent.name, 'bin', 'javaw.exe');
        if (ent.isDirectory() && exists(p)) return p;
      }
      return null;
    })() : null);
}

const prismExe = () => path.join(PRISM_DIR, 'prismlauncher.exe');

async function readAccount() {
  const data = await readJson(path.join(PRISM_DIR, 'accounts.json'), null);
  const list = (data && Array.isArray(data.accounts)) ? data.accounts : [];
  const acc = list.find((a) => a.active) || list[0];
  if (!acc) return null;
  const name = (acc.profile && acc.profile.name) || acc.name || null;
  return name ? { name } : null;
}

async function localState() {
  const state = await readJson(STATE_FILE, {});
  return {
    javaInstalled: !!findJava(),
    prismInstalled: exists(prismExe()),
    instanceInstalled: exists(path.join(INST_DIR, 'instance.cfg')) && !!state.packHash,
    packVersion: state.packVersion || null,
    packHash: state.packHash || null,
    account: await readAccount(),
  };
}

async function remotePack() {
  try {
    const text = await fetchText(config.packUrl, 10000);
    return { ok: true, info: parsePackToml(text), hash: crypto.createHash('sha1').update(text).digest('hex') };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ───────────────────────── 서버 상태 (Server List Ping) ─────────────────────────

function varInt(n) {
  const out = [];
  let v = n >>> 0;
  do {
    let b = v & 0x7f;
    v >>>= 7;
    if (v !== 0) b |= 0x80;
    out.push(b);
  } while (v !== 0);
  return Buffer.from(out);
}

function readVarInt(buf, offset) {
  let result = 0;
  let shift = 0;
  let pos = offset;
  while (true) {
    if (pos >= buf.length) return null;
    const b = buf[pos++];
    result |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) return [result, pos];
    shift += 7;
    if (shift > 35) throw new Error('VarInt too big');
  }
}

function pingServer(host, port, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const started = Date.now();
    let buf = Buffer.alloc(0);
    let done = false;
    const sock = net.createConnection({ host, port });
    // 연결 단계에서 응답이 없는 주소도 확실히 끝나도록 별도 타이머
    const timer = setTimeout(() => finish({ online: false }), timeoutMs);
    const finish = (r) => { if (!done) { done = true; clearTimeout(timer); sock.destroy(); resolve(r); } };
    sock.setTimeout(timeoutMs, () => finish({ online: false }));
    sock.on('error', () => finish({ online: false }));
    sock.on('connect', () => {
      const hostBuf = Buffer.from(host, 'utf8');
      const portBuf = Buffer.alloc(2);
      portBuf.writeUInt16BE(port);
      const hs = Buffer.concat([varInt(0x00), varInt(-1), varInt(hostBuf.length), hostBuf, portBuf, varInt(1)]);
      sock.write(Buffer.concat([varInt(hs.length), hs]));
      sock.write(Buffer.from([0x01, 0x00]));
    });
    sock.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      try {
        const len = readVarInt(buf, 0); if (!len) return;
        if (buf.length < len[1] + len[0]) return;
        const id = readVarInt(buf, len[1]); if (!id) return;
        const slen = readVarInt(buf, id[1]); if (!slen) return;
        const json = JSON.parse(buf.slice(slen[1], slen[1] + slen[0]).toString('utf8'));
        const players = json.players || {};
        finish({
          online: true,
          ping: Date.now() - started,
          max: players.max || 0,
          count: players.online || 0,
          names: (players.sample || []).map((p) => p.name).slice(0, 8),
          version: (json.version && json.version.name) || '',
        });
      } catch (_) { finish({ online: false }); }
    });
  });
}

// 이 PC에서 서버가 돌고 있으면 localhost로 접속 (공유기가 자기 공인 IP 접속을 막는 경우 대비)
async function resolveTarget() {
  const port = Number(config.server.port) || 25565;
  if (config.preferLocalServer !== false && config.server.host !== 'localhost' && config.server.host !== '127.0.0.1') {
    const local = await pingServer('127.0.0.1', port, 1500);
    if (local.online) return { host: '127.0.0.1', port, local: true, status: local };
  }
  return { host: config.server.host, port, local: false };
}

// ───────────────────────── 설치 단계 ─────────────────────────

async function ensureJava() {
  let java = findJava();
  if (java) return java;
  progress('Java 17 설치 중', '다운로드 준비', 0);
  const zip = path.join(BASE, 'downloads', 'java17.zip');
  await download('https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jre/hotspot/normal/eclipse', zip, 'Java 17 다운로드 중');
  progress('Java 17 설치 중', '압축 푸는 중', null);
  await fsp.rm(JAVA_DIR, { recursive: true, force: true });
  await extract(zip, { dir: JAVA_DIR });
  await fsp.rm(zip, { force: true });
  java = findJava();
  if (!java) throw new Error('Java 설치 후에도 javaw.exe를 찾지 못했어요.');
  return java;
}

async function ensurePrism() {
  if (exists(prismExe())) return prismExe();
  progress('Prism 설치 중', '최신 버전 확인', null);
  const rel = await fetchJson('https://api.github.com/repos/PrismLauncher/PrismLauncher/releases/latest');
  const assets = rel.assets || [];
  const pick = (re) => assets.find((a) => re.test(a.name) && !/arm64|aarch64/i.test(a.name));
  // MinGW 빌드는 Visual C++ 재배포 패키지가 필요 없음 → 우선 사용
  const asset = pick(/Windows-MinGW-w64-Portable.*\.zip$/i) || pick(/Windows-MSVC-Portable.*\.zip$/i) || pick(/Windows.*Portable.*\.zip$/i);
  if (!asset) throw new Error('Prism 포터블 파일을 찾지 못했어요.');
  const zip = path.join(BASE, 'downloads', asset.name);
  await download(asset.browser_download_url, zip, 'Prism 다운로드 중');
  progress('Prism 설치 중', '압축 푸는 중', null);
  const tmp = path.join(BASE, 'prism_tmp');
  await fsp.rm(tmp, { recursive: true, force: true });
  await extract(zip, { dir: tmp });
  const exe = findFile(tmp, 'prismlauncher.exe', 2);
  if (!exe) throw new Error('Prism 실행 파일을 찾지 못했어요.');
  await fsp.rm(PRISM_DIR, { recursive: true, force: true });
  await fsp.rename(path.dirname(exe), PRISM_DIR);
  await fsp.rm(tmp, { recursive: true, force: true });
  await fsp.rm(zip, { force: true });
  return prismExe();
}

async function configurePrism(java) {
  // portable.txt → 데이터를 Prism 폴더 안에 저장 (다른 런처와 섞이지 않음)
  if (!exists(path.join(PRISM_DIR, 'portable.txt'))) await fsp.writeFile(path.join(PRISM_DIR, 'portable.txt'), '');
  await mergeIni(path.join(PRISM_DIR, 'prismlauncher.cfg'), {
    Language: 'ko',
    ApplicationTheme: 'dark',
    IconTheme: 'flat_white',
    JavaPath: toSlash(java),
    IgnoreJavaWizard: 'true',
    AutomaticJavaDownload: 'false',
    AutomaticJavaSwitch: 'false',
    UserAskedAboutAutomaticJavaDownload: 'true',
    CloseAfterLaunch: 'true',
    QuitAfterGameStop: 'true',
    MaxMemAlloc: config.memoryMB || 8192,
    MinMemAlloc: 2048,
  });
}

async function ensureInstance(java, packInfo, target) {
  await fsp.mkdir(GAME_DIR, { recursive: true });
  const mc = packInfo.versions.minecraft || '1.20.1';
  const components = [{ uid: 'net.minecraft', version: mc, important: true }];
  if (packInfo.versions.forge) components.push({ uid: 'net.minecraftforge', version: packInfo.versions.forge });
  if (packInfo.versions.neoforge) components.push({ uid: 'net.neoforged', version: packInfo.versions.neoforge });
  if (packInfo.versions.fabric) components.push({ uid: 'net.fabricmc.fabric-loader', version: packInfo.versions.fabric });

  const packPath = path.join(INST_DIR, 'mmc-pack.json');
  const existing = await readJson(packPath, null);
  const same = existing && Array.isArray(existing.components) && components.every((c) =>
    existing.components.some((e) => e.uid === c.uid && e.version === c.version));
  if (!same) await writeJson(packPath, { components, formatVersion: 1 });

  const { host, port } = target;
  await mergeIni(path.join(INST_DIR, 'instance.cfg'), {
    InstanceType: 'OneSix',
    name: config.serverName || 'The Valley',
    OverrideJavaLocation: 'true',
    JavaPath: toSlash(java),
    AutomaticJava: 'false',
    OverrideMemory: 'true',
    MaxMemAlloc: config.memoryMB || 8192,
    MinMemAlloc: 2048,
    JoinServerOnLaunch: 'true',
    JoinServerOnLaunchAddress: `${host}:${port}`,
  });
}

async function ensureBootstrap() {
  const jar = path.join(BASE, 'packwiz-installer-bootstrap.jar');
  if (exists(jar)) return jar;
  progress('업데이트 도구 준비 중', '', null);
  const rel = await fetchJson('https://api.github.com/repos/packwiz/packwiz-installer-bootstrap/releases/latest');
  const asset = (rel.assets || []).find((a) => a.name === 'packwiz-installer-bootstrap.jar');
  if (!asset) throw new Error('packwiz 설치 도구를 찾지 못했어요.');
  await download(asset.browser_download_url, jar, '업데이트 도구 다운로드 중');
  return jar;
}

function runPackwiz(java, jar) {
  const javaCli = path.join(path.dirname(java), 'java.exe');
  const exe = exists(javaCli) ? javaCli : java;
  return new Promise((resolve, reject) => {
    const args = ['-jar', jar, '-g', '-s', 'client', config.packUrl];
    log('packwiz', exe, args.join(' '));
    const child = spawn(exe, args, { cwd: GAME_DIR, windowsHide: true });
    let tail = [];
    const onLine = (line) => {
      line = line.trim();
      if (!line) return;
      log('[packwiz]', line);
      tail.push(line); if (tail.length > 30) tail.shift();
      const m = line.match(/\((\d+)\/(\d+)\)/);
      if (m) progress('모드 업데이트 중', `${m[1]} / ${m[2]}`, Number(m[1]) / Number(m[2]));
      else progress('모드 업데이트 중', line.slice(0, 90), null);
    };
    let buf = '';
    const feed = (d) => { buf += d.toString('utf8'); const parts = buf.split(/\r?\n/); buf = parts.pop(); parts.forEach(onLine); };
    child.stdout.on('data', feed);
    child.stderr.on('data', feed);
    child.on('error', reject);
    child.on('close', (code) => {
      if (buf) onLine(buf);
      if (code === 0) resolve();
      else reject(new Error(`모드 업데이트 실패 (코드 ${code})\n` + tail.slice(-6).join('\n')));
    });
  });
}

// CurseForge에서 자동 다운로드가 막힌 모드: 직접 받게 안내하고 다운로드 폴더를 지켜봄
async function ensureManualMods() {
  let list = [];
  try { list = await fetchJson(config.manualModsUrl, 10000); } catch (e) {
    if (e.status !== 404) log('manual-mods 불러오기 실패:', e.message);
    return;
  }
  if (!Array.isArray(list) || list.length === 0) return;

  const check = async () => {
    const missing = [];
    for (const m of list) {
      const dest = path.join(GAME_DIR, m.path || 'mods', m.fileName);
      if (exists(dest) && (!m.sha1 || (await sha1File(dest)) === m.sha1)) continue;
      missing.push(m);
    }
    return missing;
  };

  let missing = await check();
  if (missing.length === 0) return;

  const downloads = app.getPath('downloads');
  const tryImport = async () => {
    for (const m of missing) {
      const found = path.join(downloads, m.fileName);
      if (!exists(found)) continue;
      if (m.sha1 && (await sha1File(found)) !== m.sha1) continue;
      const dest = path.join(GAME_DIR, m.path || 'mods', m.fileName);
      await fsp.mkdir(path.dirname(dest), { recursive: true });
      await fsp.copyFile(found, dest);
    }
    missing = await check();
  };

  await tryImport();
  if (missing.length === 0) return;

  progress('직접 받아야 하는 모드가 있어요', `${missing.length}개`, null);
  await new Promise((resolve, reject) => {
    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      try {
        await tryImport();
        send('manual', { mods: missing, downloads });
        if (missing.length === 0) { stopped = true; manualWaiter = null; send('manual', { mods: [], done: true }); resolve(); return; }
      } catch (e) { log('manual tick', e.message); }
      setTimeout(tick, 2000);
    };
    manualWaiter = { cancel: () => { stopped = true; manualWaiter = null; reject(new Error('취소했어요.')); } };
    send('manual', { mods: missing, downloads });
    tick();
  });
}

function launchGame(target) {
  const { host, port } = target;
  const args = ['-l', INSTANCE_ID, '-s', `${host}:${port}`];
  log('launch', prismExe(), args.join(' '));
  const child = spawn(prismExe(), args, { cwd: PRISM_DIR, detached: true, stdio: 'ignore' });
  child.unref();
}

async function play() {
  if (busy) return { ok: false, error: '이미 진행 중이에요.' };
  busy = true;
  try {
    await fsp.mkdir(BASE, { recursive: true });
    await loadConfig();

    progress('업데이트 확인 중', '', null);
    const remote = await remotePack();
    const state = await readJson(STATE_FILE, {});
    let packInfo;
    if (remote.ok) packInfo = remote.info;
    else if (state.packInfo) packInfo = state.packInfo; // 오프라인이면 마지막 정보로
    else throw new Error('모드팩 정보를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.\n' + remote.error);

    const java = await ensureJava();
    await ensurePrism();
    await configurePrism(java);
    progress('게임 준비 중', '인스턴스 설정', null);
    const target = await resolveTarget();
    log('접속 대상', `${target.host}:${target.port}`, target.local ? '(이 PC의 서버)' : '');
    await ensureInstance(java, packInfo, target);

    if (remote.ok) {
      const jar = await ensureBootstrap();
      progress('모드 업데이트 중', '확인 중', null);
      await runPackwiz(java, jar);
      await ensureManualMods();
      await writeJson(STATE_FILE, { ...state, packHash: remote.hash, packVersion: packInfo.version, packInfo, updatedAt: new Date().toISOString() });
    }

    const account = await readAccount();
    progress('게임 실행 중', account ? `${account.name}(으)로 접속` : '처음이면 마이크로소프트 로그인 창이 떠요', 1);
    launchGame(target);
    send('launched', { account });
    if (config.closeOnLaunch) setTimeout(() => app.quit(), 6000);
    return { ok: true };
  } catch (e) {
    log('play error', e.stack || e.message);
    return { ok: false, error: e.message };
  } finally {
    busy = false;
  }
}

// ───────────────────────── 창 / IPC ─────────────────────────

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 620,
    resizable: false,
    frame: false,
    backgroundColor: '#12201B',
    title: 'The Valley',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'index.html'));
  win.once('ready-to-show', () => win.show());
  // 외부 링크는 기본 브라우저로
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e) => e.preventDefault());
}

ipcMain.handle('init', async () => {
  await loadConfig();
  const local = await localState();
  const remote = await remotePack();
  const updateAvailable = remote.ok ? (!local.instanceInstalled || local.packHash !== remote.hash) : false;
  return {
    config: { serverName: config.serverName, server: config.server, notices: config.notices || [] },
    local,
    remote: remote.ok ? { version: remote.info.version, name: remote.info.name } : null,
    updateAvailable,
  };
});

ipcMain.handle('status', async () => {
  const target = await resolveTarget();
  if (target.status) return target.status;
  return pingServer(target.host, target.port);
});

ipcMain.handle('play', () => play());

ipcMain.handle('open-url', (_e, url) => {
  if (typeof url === 'string' && /^https:\/\//.test(url)) shell.openExternal(url);
});

ipcMain.handle('open-downloads', () => shell.openPath(app.getPath('downloads')));

ipcMain.handle('cancel-manual', () => { if (manualWaiter) manualWaiter.cancel(); });

ipcMain.handle('open-prism', async () => {
  // 계정 관리용으로 Prism 창 열기 (설치되어 있을 때만)
  if (!exists(prismExe())) return { ok: false, error: '아직 설치 전이에요. 실행하기를 먼저 눌러 주세요.' };
  spawn(prismExe(), [], { cwd: PRISM_DIR, detached: true, stdio: 'ignore' }).unref();
  return { ok: true };
});

ipcMain.handle('open-logs', () => shell.openPath(BASE));

ipcMain.on('win-minimize', () => win && win.minimize());
ipcMain.on('win-close', () => app.quit());

const single = app.requestSingleInstanceLock();
if (!single) {
  app.quit();
} else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => app.quit());
}
