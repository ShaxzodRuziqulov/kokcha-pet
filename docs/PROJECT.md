# Ko'kcha — loyiha bo'yicha umumiy bilim

Bu fayl Claude va Codex uchun: loyiha haqida bilinadigan hamma narsa shu yerda.
Yangi muhim narsa aniqlansa (xato, qaror, cheklov), shu faylga qo'shiladi.
Ish tartibi: [AGENTS.md](../AGENTS.md). Joriy ishlar: [WORKLOG.md](../WORKLOG.md).

## Nima bu
- Windows ish stolida yashaydigan kichik personaj (desktop pet). Electron 37, sof JS, framework yo'q.
- Muallif va egasi: Shaxzod. Foydalanuvchiga ko'rinadigan barcha matn **o'zbekcha (lotin)**, samimiy ohangda.
- Repo: https://github.com/ShaxzodRuziqulov/kokcha-pet (public). Joriy versiya: **1.5.0**.
- Nomi: "ko'k" + "-cha" — kichkina moviy-yashil, boshida nihol. Fayl/exe nomlarida apostrofsiz `Kokcha`.

## Arxitektura
```
main.js                 kirish nuqtasi: modullarni ulaydi, single-instance lock
src/main/               asosiy jarayon (Node)        — Codex egaligida (WORKLOG "Hozir band")
  context.js            umumiy holat `ctx`, send(), geometriya, SIZES (small .75 / medium 1 / large 1.3)
  settings.js           %APPDATA%/kokcha-desktop-pet/settings.json
  window.js             personaj oynasi, yashirish/ko'rsatish (setUserHidden), ekranga qaytarish
  motion.js             yurish, o'tirish, yotish, sakrash, yiqilish, oynalar ustida yurish, tirmashish
  surfaces.js           ochiq oynalarning yuqori qirralari (koffi orqali Win32)
  native.js             to'liq ekran va Ctrl tugmasini aniqlash (koffi); yuklanmasa — o'chadi, qolgani ishlaydi
  activity.js           uyqu/uyg'onish, dam olish eslatmasi, o'zi gapirishi, kursor (hover, silash, ko'z qarashi)
  appearance.js         personaj, rang, "O'z rasmim" (tekshirish, qirqish, nusxalash)
  menu.js               tray va o'ng tugma menyusi (bir xil), Windows bilan birga ishga tushish
  ipc.js                renderer'dan kelgan xabarlar: bosish, sudrash, menyu, raqs
  updater.js            electron-updater, GitHub Releases
src/preload.js          xavfsiz ko'prik: window.pet; renderer faqat EVENTS ro'yxatidagi kanallarni oladi
src/renderer/           ko'rinish                       — Claude egaligida
  index.html            CSP qat'iy: faqat 'self'
  characters.js         4 ta SVG personaj, bitta umumiy "skelet" (build())
  style.css             barcha animatsiya, pozalar, ranglar (CSS o'zgaruvchilari)
  renderer.js           gap pufakchasi, matnlar, sudrash/bosish, main xabarlariga javob
scripts/release.mjs     GitHub Release yaratish (CHANGELOG'dan tavsif oladi)
```
- **Modullar aylanma bog'liqligi:** `Object.assign(module.exports, ...)` bilan eksport qilinadi; boshqa modul funksiyasi faqat chaqiruv paytida olinadi (`motion.fall()`), yuklanishda emas. Yangi modul ham shunday yozilsin.
- **Bir vaqtda bitta harakat:** `ctx.motion`. Yangi harakat qo'shilsa, eskisini to'xtatib keyin boshlanadi.

## main ↔ renderer
- main → renderer: `C.send(kanal, ma'lumot)` (context.js). Renderer faqat `preload.js` dagi `EVENTS` ro'yxatini oladi:
  `state, woke, welcome, say, hover, ghost, look, clicked, landed, petted, settings, appearance, bubble-shift, update, mood, remind` (`mood`/`remind` — X0, `d87f5c0`).
- renderer → main: `getInit, dragStart, dragMove, dragEnd, click, menu, dance`.
- `state` = `{ state: idle|walk|sleep, dir, pose: stand|sit|ledge|lie|climb|hang|jump|fall, side }` → renderer `body` klasslariga aylantiradi (`pose-sit`, `side-left`...).
- `look` = `{ dx, dy }` — kursorning personajga nisbatan joyi; ko'zlar shunga qaraydi.
- `say` = matn turi (`'random'`, `'break'`, `'here'`, harakat turlari, `'image-*'`). **Matnning o'zi renderer'da** — main faqat turini yuboradi.
- Yangi kanallar kontrakti: WORKLOG.md "Kontrakt" jadvali (`mood`, `remind`).

## Personajlar va ko'rinish
- 4 ta: `kokcha` (nihol), `cat`, `dog`, `penguin`. Hammasi bir xil skelet: `pose > body-group`, `arm-l/arm-r`, `foot-l/foot-r`, `eyes-open/happy/closed`, `#pupils`, og'iz, `zzz`. Shuning uchun har bir animatsiya to'rttalasiga ishlaydi — yangi personaj ham shu skeletda qilinsin.
- Ranglar: `--body`, `--line`, `--belly`, `--accent`, `--feet`. Rang variantlari: original, green, pink, yellow, purple, blue (`body[data-color]`).
- "O'z rasmim": PNG/GIF/WebP/JPG; tekshiriladi (fon, o'lcham, shakl), bo'sh joy avtomatik qirqiladi, 600 px gacha kichraytiriladi. Holat bo'yicha rasmlar (`idle/walk/sleep/talk`) papkasi:
  o'rnatilganda `%APPDATA%\kokcha-desktop-pet\custom`, portable'da exe yonidagi `custom\` (`PORTABLE_EXECUTABLE_DIR`). O'z rasmida ko'z kuzatishi va SVG animatsiyalari yo'q.

## Imkoniyatlar (1.5.0 holati)
- Yurish, o'tirish, yotish, sakrash, oynalar ustida yurish (oyna surilsa — birga ko'chadi, yopilsa — yiqiladi), qirrada oyoq osiltirish, devorga tirmashish va osilish.
- Bosish → "boing" + gap; ikki marta → raqs ♪; silash → ♥; sudrash; Ctrl → shaffof (orqasini bosish mumkin).
- Uyqu klaviaturani ham hisobga oladi (`powerMonitor.getSystemIdleTime()`); 20+ daqiqadan keyin qaytsangiz kutib oladi; ertalab "Xayrli tong".
- Dam olish eslatmasi: uzluksiz ishlagan vaqtni sanaydi (30/45/60 yoki o'chiq). Yozayotganda gapirmaydi.
- To'liq ekranli dastur ochilsa — o'zi yashirinadi. Monitor uzilsa — ekranga qaytadi.
- Menyu: Gapir, Uxlat/Uyg'ot, **Yashirish/Ko'rsatish** (`win.setUserHidden`), Personaj, Rang, O'lcham, Jim rejim, Dam olish eslatmasi, O'zi harakat qilsin, Oynalar ustiga chiqsin, Windows bilan birga ishga tushish, Versiya, Chiqish.
- Sozlamalar (`settings.js` DEFAULTS): `autoWalk, climb, quiet, size, breakMinutes, position, character, color, customImage, onboarded, lastSeenDay`.

## Yig'ish va chiqarish
- `npm start` — ishga tushirish. `npm run build` — `dist/` ga `Kokcha-Setup-X.exe` (NSIS, bir bosishda, admin'siz) va `Kokcha-X-portable.exe`.
- Release tartibi (**faqat Shaxzod ruxsati bilan**): versiya oshiriladi → CHANGELOG'ga `## X` bo'limi → commit → `vX` teg → push → `npm run build` → `npm run release`.
- Avtomatik yangilanish: o'rnatilgan versiya 30 s keyin va har 6 soatda tekshiradi, fonda yuklaydi, yopilganda o'rnatadi. Portable faqat xabar beradi.
- Exe imzosiz: SmartScreen "Batafsil → Baribir ishga tushirish". Exe ~89 MB, shundan ~85 MB Electron'ning o'zi.

## Muhim saboqlar (qayta xato qilmaslik uchun)
- **koffi** 26 MB boshqa platforma fayllarini olib kelardi — `package.json` `build.files` da faqat win32_x64 qoldirilgan. Yangi native paket qo'shilsa, shunga o'xshash tekshirilsin.
- **Ko'rinmas tizim oynalari** ("Backstop Window" va h.k.) butun ekranni qoplab, barcha oynalarni "yopib" qo'yardi — surfaces.js ularni filtrlaydi.
- **DPI:** oyna joyi `setBounds` bilan beriladi (`setPosition` emas) — aks holda masshtabda o'lcham buziladi. Koordinatalar DIP'da.
- **Portable exe** o'zini Temp'ga ochadi: asl joy `PORTABLE_EXECUTABLE_DIR` / `PORTABLE_EXECUTABLE_FILE`.
- Renderer'da `window.pet` nomi band (preload) — global `pet` o'zgaruvchi yaratilmasin (bir marta shu sababli hammasi ishlamay qolgan).
- Ekran chetida titrash: burilish faqat chetga **qarab** yurganda bo'lishi kerak.
- Avtomatik test yo'q. Tekshiruv: `npm start` + qo'lda; harakat mantiqi o'zgarsa, sinov oynasi ochib tekshirish. Haqiqiy sichqoncha talab qiladigan narsalarni (o'ng tugma, silash, Ctrl) Shaxzod tekshiradi — buni WORKLOG'da "tekshirilmadi" deb aniq yozish kerak.

## Yo'nalish va qarorlar
- **Maqsad (2026-10-14):** Ko'kchani yuqori darajaga olib chiqish, 2D → 2.5D → 3D. MaoMao (djurayev-ab.itch.io/maomao) — o'xshash loyiha; undan nusxa olinmaydi, lekin undan yengilroq va chiroyliroq bo'lishi kerak.
- Avval 2.5D (SVG gradientlar; Three.js/WebGL qo'shilmaydi, SVG filtrlar ishlatilmaydi, resurs sarfi X4 tartibida o'lchanadi — Electron SVG/CSS'ni chizishda GPU'dan foydalanishi mumkin). Haqiqiy 3D (Three.js) — Shaxzod 2.5D natijasini baholagandan keyin alohida qaror.
- AI bilan suhbat — hozircha qilinmaydi.
- Ish tartibi: har qaror ikkala agent rozi bo'lgandan keyin boshlanadi (bir agent taklif qiladi, ikkinchisi har bandga "roziman/qarshiman + sabab"; 3 raundda kelishilmasa — Shaxzod hal qiladi).
- Hajm: ~89 MB normal (MaoMao zip ~78 MB). Tauri'ga o'tish (~5–10 MB) hozir arzimaydi.

## Tarix
| Versiya | Asosiy o'zgarish |
|---|---|
| 1.0.0 | Birinchi versiya, portable exe |
| 1.1.0 | Tanishtirish, o'ng tugma menyusi, raqs, silash, esnash, Ctrl-shaffoflik |
| 1.2.0 | Mushukcha, Kuchukcha, Pingvin; ranglar; "O'z rasmim" |
| 1.3.0 | O'z rasmini tekshirish va avtomatik qirqish, personaj maslahat beradi |
| 1.4.0 | Oynalar ustida yashash, tirmashish, yangi pozalar |
| 1.5.0 | O'rnatuvchi, avtomatik yangilanish, kod modullarga ajratildi |
