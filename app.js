const API_BASE = 'https://script.google.com/macros/s/AKfycbzviCcF_UrPTfNPH00HNr9b0rHGnRh65nPlp9sopmXRdLhu-Vd-7GjtFR_9r8KMwu-uhg/exec';

let pendingPunch = null;

// PWAとして認識してもらうためのService Worker登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      /* 登録できなくても通常利用には影響しないので無視 */
    });
  });
}

function detectOS() {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

// ---------- スマホ画面(上半分)のモックアップ ----------

const FRAME_W = 300;
const FRAME_H = 300;

function frameOpen(extraBg) {
  return `
    <svg width="100%" viewBox="0 0 ${FRAME_W} ${FRAME_H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="screenClip"><rect x="6" y="6" width="${FRAME_W - 12}" height="${FRAME_H - 12}" rx="22"/></clipPath>
      </defs>
      <rect x="0" y="0" width="${FRAME_W}" height="${FRAME_H}" rx="28" fill="#111"/>
      <g clip-path="url(#screenClip)">
        <rect x="6" y="6" width="${FRAME_W - 12}" height="${FRAME_H - 12}" fill="${extraBg || '#e3f2fd'}"/>`;
}
function frameClose() {
  return `
      </g>
      <rect x="0" y="0" width="${FRAME_W}" height="${FRAME_H}" rx="28" fill="none" stroke="#333" stroke-width="6"/>
    </svg>`;
}

function statusBarAndroid() {
  return `
    <rect x="6" y="6" width="${FRAME_W - 12}" height="26" fill="#111"/>
    <text x="20" y="24" font-size="12" fill="white" font-family="sans-serif">9:41</text>
    <circle cx="${FRAME_W - 52}" cy="19" r="4" fill="white"/>
    <path d="M${FRAME_W - 40} 22 l4 -10 l4 10 z" fill="white"/>
    <rect x="${FRAME_W - 26}" y="14" width="14" height="9" rx="2" fill="none" stroke="white" stroke-width="1.5"/>`;
}

function statusBarIos() {
  return `
    <rect x="6" y="6" width="${FRAME_W - 12}" height="30" fill="#fafafa"/>
    <text x="24" y="26" font-size="13" fill="#111" font-weight="bold" font-family="sans-serif">9:41</text>
    <path d="M${FRAME_W - 44} 24 l3 -8 l3 3 l3 -10 l3 15" stroke="#111" stroke-width="1.5" fill="none"/>
    <rect x="${FRAME_W - 26}" y="15" width="15" height="9" rx="2.5" fill="none" stroke="#111" stroke-width="1.5"/>`;
}

function continuedHint() {
  return `
    <line x1="30" y1="${FRAME_H - 22}" x2="${FRAME_W - 30}" y2="${FRAME_H - 22}" stroke="#999" stroke-width="2" stroke-dasharray="4 5"/>
    <text x="${FRAME_W / 2}" y="${FRAME_H - 8}" font-size="10" fill="#888" text-anchor="middle" font-family="sans-serif">(画面はこの下に続く)</text>`;
}

function fingerArrow(x, yStart, yEnd) {
  return `
    <line x1="${x}" y1="${yStart}" x2="${x}" y2="${yEnd}" stroke="#e53935" stroke-width="4" stroke-linecap="round"/>
    <path d="M${x - 8} ${yEnd - 10} L${x} ${yEnd} L${x + 8} ${yEnd - 10}" stroke="#e53935" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${x}" cy="${yStart}" r="6" fill="#e53935"/>`;
}

function androidPhase1() {
  return frameOpen('#e8eaf6') +
    statusBarAndroid() +
    `<rect x="6" y="32" width="${FRAME_W - 12}" height="34" rx="0" fill="#37474f"/>
     <rect x="20" y="42" width="120" height="6" rx="3" fill="#78909c"/>
     <rect x="20" y="54" width="80" height="6" rx="3" fill="#78909c"/>
     ${fingerArrow(FRAME_W / 2, 90, 40)}
     <rect x="20" y="120" width="60" height="60" rx="14" fill="#90a4ae" opacity="0.5"/>
     <rect x="100" y="120" width="60" height="60" rx="14" fill="#90a4ae" opacity="0.5"/>
     <rect x="180" y="120" width="60" height="60" rx="14" fill="#90a4ae" opacity="0.5"/>
     ${continuedHint()}` +
    frameClose();
}

function androidPhase2() {
  return frameOpen('#37474f') +
    statusBarAndroid() +
    `<rect x="6" y="32" width="${FRAME_W - 12}" height="${FRAME_H - 60}" fill="#37474f"/>
     ${quickTile(30, 60, 'wifi', false, 'Wi-Fi')}
     ${quickTile(120, 60, 'bt', false, 'Bluetooth')}
     ${quickTile(210, 60, 'flash', false, 'ライト')}
     ${quickTile(30, 140, 'plane', false, '機内モード')}
     ${quickTile(120, 140, 'dnd', false, 'マナー')}
     ${quickTile(210, 140, 'loc', false, '位置情報')}
     ${fingerArrow(210 + 24, 210, 175)}` +
    frameClose();
}

function androidPhase3() {
  return frameOpen('#37474f') +
    statusBarAndroid() +
    `<rect x="6" y="32" width="${FRAME_W - 12}" height="${FRAME_H - 60}" fill="#37474f"/>
     ${quickTile(30, 60, 'wifi', false, 'Wi-Fi')}
     ${quickTile(120, 60, 'bt', false, 'Bluetooth')}
     ${quickTile(210, 60, 'flash', false, 'ライト')}
     ${quickTile(30, 140, 'plane', false, '機内モード')}
     ${quickTile(120, 140, 'dnd', false, 'マナー')}
     ${quickTile(210, 140, 'loc', true, '位置情報')}
     <circle cx="234" cy="164" r="26" fill="none" stroke="#a5d6a7" stroke-width="3" opacity="0.7"/>` +
    frameClose();
}

function androidPhase4() {
  return frameOpen('#e3f2fd') +
    statusBarAndroid() +
    `<rect x="6" y="32" width="${FRAME_W - 12}" height="30" fill="white"/>
     <rect x="20" y="40" width="${FRAME_W - 60}" height="16" rx="8" fill="#eee"/>
     <text x="28" y="52" font-size="9" fill="#666" font-family="sans-serif">script.google.com/…/exec</text>
     <rect x="24" y="90" width="${FRAME_W - 48}" height="120" rx="12" fill="white" stroke="#ccc"/>
     <text x="${FRAME_W / 2}" y="115" font-size="11" fill="#222" text-anchor="middle" font-family="sans-serif">現在地の使用を</text>
     <text x="${FRAME_W / 2}" y="130" font-size="11" fill="#222" text-anchor="middle" font-family="sans-serif">許可しますか?</text>
     <rect x="40" y="150" width="90" height="30" rx="6" fill="white" stroke="#999"/>
     <text x="85" y="169" font-size="10" fill="#666" text-anchor="middle" font-family="sans-serif">ブロック</text>
     <rect x="150" y="150" width="90" height="30" rx="6" fill="#1565c0"/>
     <text x="195" y="169" font-size="10" fill="white" text-anchor="middle" font-family="sans-serif" font-weight="bold">許可</text>` +
    frameClose();
}

function quickTile(x, y, type, active, label) {
  const bg = active ? '#a5d6a7' : '#546e7a';
  const iconColor = active ? '#1b5e20' : '#eceff1';
  let icon = '';
  if (type === 'wifi') icon = `<path d="M${x+30-10} ${y+30+4} a14 14 0 0 1 20 0" stroke="${iconColor}" stroke-width="2.5" fill="none"/><circle cx="${x+30}" cy="${y+30+6}" r="2" fill="${iconColor}"/>`;
  if (type === 'bt') icon = `<path d="M${x+30-4} ${y+30-8} l8 6 l-8 6 l0 -12 l8 6 l-8 6" stroke="${iconColor}" stroke-width="2" fill="none"/>`;
  if (type === 'flash') icon = `<path d="M${x+34} ${y+18} l-10 14 h6 l-4 12 l12 -16 h-6 z" fill="${iconColor}"/>`;
  if (type === 'plane') icon = `<path d="M${x+18} ${y+34} l24 -4 l-8 -10 l4 -2 l10 8 l6 -1 l-2 6 l-6 4 l-10 -2 l4 8 l-4 2 l-6 -8z" fill="${iconColor}"/>`;
  if (type === 'dnd') icon = `<path d="M${x+34} ${y+18} a12 12 0 1 0 8 20 a10 10 0 0 1 -8 -20z" fill="${iconColor}"/>`;
  if (type === 'loc') icon = `<path d="M${x+30} ${y+16} c-6 0 -11 5 -11 11 c0 8 11 19 11 19 s11 -11 11 -19 c0 -6 -5 -11 -11 -11z" fill="${iconColor}"/><circle cx="${x+30}" cy="${y+27}" r="4" fill="${bg}"/>`;
  return `
    <circle cx="${x + 30}" cy="${y + 30}" r="28" fill="${bg}"/>
    ${icon}
    <text x="${x + 30}" y="${y + 70}" font-size="9" fill="#cfd8dc" text-anchor="middle" font-family="sans-serif">${label}</text>`;
}

function iosPhase1() {
  return frameOpen('#dbe9ff') +
    statusBarIos() +
    `<rect x="20" y="60" width="60" height="60" rx="16" fill="#8e8e93"/>
     <path d="M50 78 v8 M50 90 v8 M40 84 h8 M52 84 h8" stroke="white" stroke-width="3"/>
     <circle cx="50" cy="84" r="10" fill="none" stroke="white" stroke-width="3"/>
     <text x="50" y="135" font-size="10" fill="#333" text-anchor="middle" font-family="sans-serif">設定</text>
     <rect x="100" y="60" width="60" height="60" rx="16" fill="#90a4ae" opacity="0.6"/>
     <rect x="180" y="60" width="60" height="60" rx="16" fill="#90a4ae" opacity="0.6"/>
     <circle cx="50" cy="90" r="34" fill="none" stroke="#e53935" stroke-width="3" opacity="0.8"/>` +
    frameClose();
}

function iosPhase2() {
  return frameOpen('#f2f2f7') +
    statusBarIos() +
    `<text x="20" y="55" font-size="16" fill="#111" font-weight="bold" font-family="sans-serif">設定</text>
     ${settingsRow(70, '一般', false)}
     ${settingsRow(110, 'アクセシビリティ', false)}
     ${settingsRow(150, 'プライバシーとセキュリティ', true)}
     ${settingsRow(190, 'App Store', false)}` +
    frameClose();
}

function iosPhase3() {
  return frameOpen('#f2f2f7') +
    statusBarIos() +
    `<text x="20" y="55" font-size="14" fill="#111" font-weight="bold" font-family="sans-serif">位置情報サービス</text>
     <rect x="20" y="75" width="${FRAME_W - 40}" height="40" rx="10" fill="white"/>
     <text x="30" y="100" font-size="12" fill="#111" font-family="sans-serif">位置情報サービス</text>
     <rect x="${FRAME_W - 70}" y="85" width="40" height="20" rx="10" fill="#4caf50"/>
     <circle cx="${FRAME_W - 40}" cy="95" r="8" fill="white"/>` +
    frameClose();
}

function iosPhase4() {
  return frameOpen('#f2f2f7') +
    statusBarIos() +
    `<text x="20" y="55" font-size="14" fill="#111" font-weight="bold" font-family="sans-serif">Safari Webサイト</text>
     <rect x="20" y="75" width="${FRAME_W - 40}" height="140" rx="10" fill="white"/>
     <text x="30" y="100" font-size="11" fill="#999" font-family="sans-serif">許可しない</text>
     <text x="30" y="135" font-size="11" fill="#999" font-family="sans-serif">確認</text>
     <text x="30" y="170" font-size="12" fill="#1565c0" font-weight="bold" font-family="sans-serif">このAppの使用中のみ許可</text>
     <path d="M${FRAME_W - 45} 165 l6 6 l10 -14" stroke="#1565c0" stroke-width="2.5" fill="none"/>` +
    frameClose();
}

function settingsRow(y, label, highlight) {
  return `
    <rect x="20" y="${y}" width="${FRAME_W - 40}" height="34" rx="8" fill="${highlight ? '#d7e8fc' : 'white'}"/>
    <text x="32" y="${y + 22}" font-size="12" fill="#111" font-family="sans-serif">${label}</text>
    <text x="${FRAME_W - 34}" y="${y + 22}" font-size="12" fill="#c7c7cc" font-family="sans-serif">›</text>`;
}

function iosSteps() {
  return [
    { icon: iosPhase1(), text: 'ホーム画面の「設定」アプリ(歯車アイコン)をタップする' },
    { icon: iosPhase2(), text: '一覧から「プライバシーとセキュリティ」をタップする' },
    { icon: iosPhase3(), text: '「位置情報サービス」の一番上のスイッチをタップしてオン(緑色)にする' },
    { icon: iosPhase4(), text: '下の一覧で「Safari Webサイト」を選び、「このAppの使用中のみ許可」を選ぶ' }
  ];
}

function androidSteps() {
  return [
    { icon: androidPhase1(), text: '画面のどこでもいいので、上から下に指を1回スワイプする(通知欄が少し開く)' },
    { icon: androidPhase2(), text: 'もう一度、上から下にスワイプする(2回目。アイコンが並んだクイック設定パネル全体が開く)' },
    { icon: androidPhase3(), text: '「位置情報」のアイコンをタップする。緑色になればオンの状態' },
    { icon: androidPhase4(), text: 'このページに戻り、「現在地の使用を許可しますか?」と出たら「許可」をタップする' }
  ];
}

function showLocationGuide() {
  const os = detectOS();
  const steps = os === 'ios' ? iosSteps() : (os === 'android' ? androidSteps() : iosSteps());
  const guide = document.getElementById('locGuide');

  let html = '<h2>📍 位置情報がオフになっています</h2>';
  html += '<p class="desc">庁舎内かどうかを確認するために、スマホの位置情報をオンにする必要があります。下の手順の通りに操作してください。</p>';

  steps.forEach((s, i) => {
    html += `
      <div class="guide-step">
        <div class="num-row">
          <div class="num">${i + 1}</div>
          <div class="desc-text">${s.text}</div>
        </div>
        <div class="screen-img">${s.icon}</div>
      </div>`;
  });

  html += '<button class="btn-retry" onclick="retryPunch()">設定したので、もう一度試す</button>';

  guide.innerHTML = html;
  guide.style.display = 'block';
}

function hideLocationGuide() {
  document.getElementById('locGuide').style.display = 'none';
}

function retryPunch() {
  if (pendingPunch) {
    punch(pendingPunch);
  }
}

async function loadStaffList() {
  const select = document.getElementById('name');
  try {
    const res = await fetch(`${API_BASE}?action=staff`);
    const data = await res.json();
    if (data.success && Array.isArray(data.staffList)) {
      data.staffList.forEach((name) => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
      });
    } else {
      showStatus('職員名簿の取得に失敗しました', 'warn');
    }
  } catch (e) {
    showStatus('職員名簿の取得に失敗しました(通信エラー)', 'warn');
  }
}

function showStatus(text, cls) {
  const statusEl = document.getElementById('status');
  statusEl.style.display = 'block';
  statusEl.textContent = text;
  statusEl.className = cls || '';
}

function punch(type) {
  const name = document.getElementById('name').value;
  if (!name) { alert('氏名を選択してください'); return; }

  pendingPunch = type;
  hideLocationGuide();

  const isFieldWork = document.getElementById('fieldWork').checked;

  if (isFieldWork) {
    showStatus('記録しています...', 'info');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendPunch(name, type, pos.coords.latitude, pos.coords.longitude, true),
        () => sendPunch(name, type, null, null, true),
        { timeout: 4000 }
      );
    } else {
      sendPunch(name, type, null, null, true);
    }
    return;
  }

  showStatus('位置情報を確認中...', 'info');

  if (!navigator.geolocation) {
    sendPunch(name, type, null, null, false);
    return;
  }

  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'denied') {
        document.getElementById('status').style.display = 'none';
        showLocationGuide();
        return;
      }
      requestLocation(name, type);
    }).catch(() => {
      requestLocation(name, type);
    });
  } else {
    requestLocation(name, type);
  }
}

function requestLocation(name, type) {
  // enableHighAccuracy は指定しない(false扱い)。
  // trueにすると端末によって「正確な位置情報/おおよその位置情報」の
  // 選択画面が追加で出ることがあるため、そのひと手間を省く目的で外している。
  navigator.geolocation.getCurrentPosition(
    (pos) => sendPunch(name, type, pos.coords.latitude, pos.coords.longitude, false),
    (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        document.getElementById('status').style.display = 'none';
        showLocationGuide();
      } else {
        sendPunch(name, type, null, null, false);
      }
    },
    { timeout: 8000 }
  );
}

async function sendPunch(name, type, lat, lng, isFieldWork) {
  const params = new URLSearchParams({ action: 'punch', name, type });
  if (lat != null && lng != null) {
    params.set('lat', lat);
    params.set('lng', lng);
  }
  if (isFieldWork) params.set('isFieldWork', '1');

  try {
    const res = await fetch(`${API_BASE}?${params.toString()}`);
    const data = await res.json();
    hideLocationGuide();
    if (data.success) {
      showStatus(data.message, data.withinRange === false ? 'warn' : 'ok');
    } else {
      showStatus(data.message || '打刻に失敗しました', 'warn');
    }
  } catch (err) {
    showStatus('送信エラー: ' + (err && err.message ? err.message : err), 'warn');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadStaffList();
  document.getElementById('punchIn').addEventListener('click', () => punch('出勤'));
  document.getElementById('punchOut').addEventListener('click', () => punch('退勤'));
});
