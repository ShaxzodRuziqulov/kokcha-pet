// Ochiq oynalarning yuqori qirralari — personaj ular ustida yura oladi (faqat Windows).
//
// Oynalar yuqoridan pastga (z-tartibda) ko'rib chiqiladi. Har bir oynaning yuqori qirrasidan
// ustidagi oynalar yopib turgan qismlari olib tashlanadi — qolgani "sirt" bo'ladi.
// Koordinatalar Electron'dagi kabi DIP'da qaytariladi.

const { screen } = require('electron');

const GW_HWNDNEXT = 2;
const GWL_EXSTYLE = -20;
const WS_EX_TOOLWINDOW = 0x80;
const WS_EX_TRANSPARENT = 0x20;
const WS_EX_NOACTIVATE = 0x08000000;   // fokus olmaydigan qatlamlar (overlay, bildirishnomalar)
const DWMWA_EXTENDED_FRAME_BOUNDS = 9; // soyasiz, ko'rinadigan chegaralar
const DWMWA_CLOAKED = 14;              // boshqa virtual ish stolida yoki yashirin
const MIN_SEGMENT = 60;                // bundan qisqa qirralar hisobga olinmaydi
const SKIP_CLASSES = new Set(['Progman', 'WorkerW', 'Shell_TrayWnd', 'Shell_SecondaryTrayWnd']);

// selfHandle — personaj oynasining HWND'i (win.getNativeWindowHandle()).
// Qaytaradi: getSurfaces() funksiyasi yoki null (Windows emas / yuklanmadi).
function createSurfaceFinder(selfHandle) {
  if (process.platform !== 'win32') return null;

  let api;
  try {
    const koffi = require('koffi');
    const user32 = koffi.load('user32.dll');
    const dwmapi = koffi.load('dwmapi.dll');
    api = {
      koffi,
      GetTopWindow: user32.func('void * __stdcall GetTopWindow(void *hWnd)'),
      GetWindow: user32.func('void * __stdcall GetWindow(void *hWnd, uint32_t uCmd)'),
      IsWindowVisible: user32.func('bool __stdcall IsWindowVisible(void *hWnd)'),
      IsIconic: user32.func('bool __stdcall IsIconic(void *hWnd)'),
      GetWindowLongPtrW: user32.func('intptr_t __stdcall GetWindowLongPtrW(void *hWnd, int nIndex)'),
      GetWindowTextLengthW: user32.func('int __stdcall GetWindowTextLengthW(void *hWnd)'),
      GetClassNameW: user32.func('int __stdcall GetClassNameW(void *hWnd, _Out_ void *buf, int max)'),
      DwmGetWindowAttribute: dwmapi.func('long __stdcall DwmGetWindowAttribute(void *hWnd, uint32_t attr, _Out_ void *pv, uint32_t cb)'),
    };
  } catch {
    return null;
  }

  const self = String(selfHandle.readBigUInt64LE(0));
  const rectBuf = Buffer.alloc(16);
  const intBuf = Buffer.alloc(4);
  const classBuf = Buffer.alloc(512);

  // Oyna sirt bo'la oladimi; bo'lsa — uning DIP'dagi chegaralari
  function windowRect(h, id) {
    if (id === self) return null;
    if (!api.IsWindowVisible(h) || api.IsIconic(h)) return null;
    const ex = Number(api.GetWindowLongPtrW(h, GWL_EXSTYLE));
    if (ex & (WS_EX_TOOLWINDOW | WS_EX_TRANSPARENT | WS_EX_NOACTIVATE)) return null;
    if (api.GetWindowTextLengthW(h) === 0) return null;

    const n = api.GetClassNameW(h, classBuf, 256);
    if (SKIP_CLASSES.has(classBuf.toString('utf16le', 0, n * 2))) return null;

    if (api.DwmGetWindowAttribute(h, DWMWA_CLOAKED, intBuf, 4) === 0 && intBuf.readInt32LE(0) !== 0) return null;
    if (api.DwmGetWindowAttribute(h, DWMWA_EXTENDED_FRAME_BOUNDS, rectBuf, 16) !== 0) return null;

    const l = rectBuf.readInt32LE(0);
    const t = rectBuf.readInt32LE(4);
    const r = rectBuf.readInt32LE(8);
    const b = rectBuf.readInt32LE(12);
    if (r - l < 120 || b - t < 60) return null;

    const d = screen.screenToDipRect(null, { x: l, y: t, width: r - l, height: b - t });

    // Butun monitorni qoplagan oyna — to'liq ekranli dastur yoki ko'rinmas tizim qatlami
    // (masalan, "Backstop Window"). Na sirt, na to'siq sifatida hisobga olinmaydi.
    const mon = screen.getDisplayMatching(d).bounds;
    if (d.x <= mon.x + 2 && d.y <= mon.y + 2
      && d.x + d.width >= mon.x + mon.width - 2 && d.y + d.height >= mon.y + mon.height - 2) return null;

    return { left: d.x, top: d.y, right: d.x + d.width, bottom: d.y + d.height };
  }

  // Qirraning ustidagi oynalar yopmagan qismlari
  function visibleSegments(r, above) {
    let segs = [[r.left, r.right]];
    for (const a of above) {
      if (!(a.top <= r.top && a.bottom > r.top)) continue; // bu oyna qirrani yopmaydi
      segs = segs.flatMap(([x1, x2]) => {
        if (a.right <= x1 || a.left >= x2) return [[x1, x2]];
        const out = [];
        if (a.left > x1) out.push([x1, a.left]);
        if (a.right < x2) out.push([a.right, x2]);
        return out;
      });
      if (!segs.length) break;
    }
    return segs.filter(([x1, x2]) => x2 - x1 >= MIN_SEGMENT);
  }

  return function getSurfaces() {
    const result = [];
    const above = [];
    let h = api.GetTopWindow(null);
    for (let guard = 0; h && guard < 2000; guard++) {
      const id = String(api.koffi.address(h));
      const r = windowRect(h, id);
      if (r) {
        for (const [x1, x2] of visibleSegments(r, above)) {
          result.push({ hwnd: id, x1, x2, y: r.top, left: r.left });
        }
        above.push(r);
      }
      h = api.GetWindow(h, GW_HWNDNEXT);
    }
    return result;
  };
}

module.exports = { createSurfaceFinder };
