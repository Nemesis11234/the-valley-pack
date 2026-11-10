'use strict';
const $ = (id) => document.getElementById(id);
const v = window.valley;

let playing = false;

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function renderNotices(notices) {
  const list = $('notice-list');
  list.replaceChildren();
  if (!notices || notices.length === 0) {
    list.append(el('li', '', '공지가 없어요'));
    return;
  }
  for (const n of notices.slice(0, 6)) {
    const li = el('li', n.highlight ? 'hl' : '');
    li.append(el('span', 'tag', n.tag || '안내'), el('span', 'notice-text', n.text || ''), el('span', 'notice-date', n.date || ''));
    list.append(li);
  }
}

function renderAccount(account) {
  if (account && account.name) {
    $('acc-name').textContent = account.name;
    $('acc-sub').textContent = 'Microsoft 계정 연결됨';
    $('avatar').textContent = account.name.slice(0, 1).toUpperCase();
  } else {
    $('acc-name').textContent = '로그인 전';
    $('acc-sub').textContent = '처음 실행할 때 로그인해요';
    $('avatar').textContent = '?';
  }
}

async function refreshStatus() {
  const box = $('srv-state');
  try {
    const s = await v.status();
    if (s.online) {
      box.className = 'online on';
      $('srv-state-text').textContent = '온라인';
      $('srv-players').textContent = `${s.count} / ${s.max}`;
      $('srv-ping').textContent = `${s.ping} ms`;
      $('srv-names').textContent = s.names.length ? s.names.join(', ') : (s.count ? `${s.count}명` : '아무도 없어요');
    } else {
      box.className = 'online off';
      $('srv-state-text').textContent = '오프라인';
      $('srv-players').textContent = '-';
      $('srv-ping').textContent = '-';
      $('srv-names').textContent = '서버가 꺼져 있어요';
    }
  } catch (_) {
    box.className = 'online off';
    $('srv-state-text').textContent = '확인 실패';
  }
}

function setProgress(p) {
  $('progress').hidden = false;
  $('prog-step').textContent = p.step || '';
  $('prog-detail').textContent = p.detail || '';
  const fill = $('prog-fill');
  if (typeof p.ratio === 'number') {
    fill.classList.remove('indet');
    fill.style.width = `${Math.max(2, Math.min(100, p.ratio * 100))}%`;
  } else {
    fill.style.width = '';
    fill.classList.add('indet');
  }
}

function showError(msg) {
  $('error-text').textContent = msg;
  $('error-modal').hidden = false;
}

function renderManual(payload) {
  const modal = $('manual-modal');
  if (!payload.mods || payload.mods.length === 0) { modal.hidden = true; return; }
  const list = $('manual-list');
  list.replaceChildren();
  for (const m of payload.mods) {
    const li = el('li');
    const name = el('div', 'mname');
    name.append(el('span', '', m.name || m.fileName), el('span', 'mfile', m.fileName));
    const btn = el('button', 'small', '페이지 열기');
    btn.addEventListener('click', () => v.openUrl(m.url));
    li.append(name, btn);
    list.append(li);
  }
  modal.hidden = false;
}

async function play() {
  if (playing) return;
  playing = true;
  $('btn-play').disabled = true;
  $('play-label').textContent = '준비 중';
  setProgress({ step: '시작하는 중', ratio: null });
  const res = await v.play();
  if (!res.ok) {
    playing = false;
    $('btn-play').disabled = false;
    $('play-label').textContent = '실행하기';
    $('progress').hidden = true;
    $('manual-modal').hidden = true;
    showError(res.error || '알 수 없는 오류');
  }
}

async function init() {
  $('btn-min').addEventListener('click', () => v.minimize());
  $('btn-close').addEventListener('click', () => v.close());
  $('btn-play').addEventListener('click', play);
  $('btn-account').addEventListener('click', async () => {
    const r = await v.openPrism();
    if (!r.ok) showError(r.error);
  });
  $('btn-open-dl').addEventListener('click', () => v.openDownloads());
  $('btn-manual-cancel').addEventListener('click', () => v.cancelManual());
  $('btn-error-ok').addEventListener('click', () => { $('error-modal').hidden = true; });
  $('btn-logs').addEventListener('click', () => v.openLogs());

  v.onProgress(setProgress);
  v.onManual(renderManual);
  v.onLaunched(({ account }) => {
    $('play-label').textContent = '게임 실행됨';
    if (account) renderAccount(account);
    $('hint').textContent = '게임 창이 뜨면 런처는 자동으로 닫혀요';
  });

  try {
    const data = await v.init();
    $('server-name').textContent = data.config.serverName || 'The Valley';
    renderNotices(data.config.notices);
    renderAccount(data.local.account);
    const ver = data.remote ? data.remote.version : data.local.packVersion;
    $('pack-version').textContent = `모드팩 ${ver || '-'}`;
    const st = $('pack-state');
    if (!data.local.instanceInstalled) { st.textContent = '설치 필요'; st.className = 'warn'; }
    else if (data.updateAvailable) { st.textContent = '업데이트 있음'; st.className = 'warn'; }
    else { st.textContent = '최신 버전'; st.className = 'ok'; }
  } catch (e) {
    renderNotices([]);
  }
  refreshStatus();
  setInterval(refreshStatus, 15000);
}

init();
