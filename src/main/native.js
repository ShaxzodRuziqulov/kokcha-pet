// Windows funksiyalari (koffi orqali): to'liq ekranni va Ctrl tugmasini aniqlash.
// Yuklanmasa — bu imkoniyatlar o'chadi, qolgani odatdagidek ishlaydi.

const { ctx } = require('./context');
const win = require('./window');

const VK_CONTROL = 0x11;

let fullscreenQuery = null;
let keyState = null;

function init() {
  if (process.platform !== 'win32') return;
  try {
    const koffi = require('koffi');
    const shell32 = koffi.load('shell32.dll');
    fullscreenQuery = shell32.func('int __stdcall SHQueryUserNotificationState(_Out_ int *pquns)');
    const user32 = koffi.load('user32.dll');
    keyState = user32.func('short __stdcall GetAsyncKeyState(int vKey)');
  } catch {
    fullscreenQuery = null;
    keyState = null;
  }
}

// 2 — to'liq ekranli dastur, 3 — Direct3D o'yin, 4 — prezentatsiya rejimi
function isFullscreenApp() {
  if (!fullscreenQuery) return false;
  const out = [0];
  return fullscreenQuery(out) === 0 && [2, 3, 4].includes(out[0]);
}

function isCtrlDown() {
  return !!keyState && (keyState(VK_CONTROL) & 0x8000) !== 0;
}

// To'liq ekranli video, o'yin yoki prezentatsiya ochilsa — personaj yashirinadi
function watchFullscreen() {
  if (!fullscreenQuery) return;
  setInterval(() => {
    const full = isFullscreenApp();
    if (full !== ctx.fullscreenHidden) {
      ctx.fullscreenHidden = full;
      win.updateVisibility();
    }
  }, 1500);
}

Object.assign(module.exports, { init, isCtrlDown, watchFullscreen });
