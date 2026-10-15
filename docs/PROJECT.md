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
- 2 ta: `chibi-girl` (Yashil qizcha, PNG kadrlar — `src/renderer/chibi/`) va `kokcha` (SVG). `cat`/`dog`/`penguin` 1.8.0 da olib tashlangan; tanlaganlar Ko'kchaga o'tadi.
- **Gaplar:** `src/renderer/phrases.js` — ovozlar: `default`, Midori fe'llari `cheerful/shy/tsundere/playful` (main `persona` kanali, 3–4 soatda navbat bilan), Ko'kcha `curious`. Kalitlar: `greet.*`, `random`, `time.*`, `wake.*`, `welcomeBack`, `petted`, `breakTime`, `here`, `angry.1–3`, `move.*`, `newLook`, `intro`. Yo'q kalit `default` dan olinadi; `{name}` — ism. renderer.js'da `line(key)`.
- Ko'kcha skeleti: `pose > body-group`, `arm-l/arm-r`, `foot-l/foot-r`, `eyes-open/happy/closed/angry`, `#pupils`, og'iz, `zzz`.
- **Tezlik qoidasi:** SVG'dagi CSS animatsiyalar GPU'ga berilmaydi va silliq rejimda 60 fps qayta bo'yaladi. Abadiy animatsiyalar `steps()` bilan (~10–13 fps), ko'z qisish JS taymeri bilan. O'lchov: Ko'kcha tinch holatda 66% → ~20% bir yadro.
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

## 1.7.0 tayyorgarligi (2026-10-15)
- `src/main/reminders.js`: bir martalik shaxsiy eslatmalar; `settings.reminders` da epoch ms. Menyu → Eslatmalar alohida sandbox oynani ochadi (`reminders-preload.js`, renderer/reminders.*). IPC faqat shu oynaning asosiy frame'idan qabul qilinadi. `remind {text}` pufakchasi uyqu/jim rejimda ko'rinadi; yashirin/to'liq ekran holatida main yetkazishni kutadi. Ilova yopiq bo'lsa keyingi ochilishda; OS alarm yo'q. settings.save(true) endi muvaffaqiyat bool qiymatini qaytaradi; eski chaqiruvlar o'zgarishsiz.
- `motion.beginDrag/sampleDrag/finishDrag`: IPC host kursordan oxirgi 120 ms tezlikni o'lchaydi; 700/1400/2200 DIP/s (personaj o'lchamiga nisbatan), angry level 1/2/3. To'xtab qo'yish/shovqin/takroriy drag-end filtrlanadi.
- Qizchaning bosh ifodalari `frames/manifest.json` dagi har poza `face` anchor'i orqali tanlanadi. Eski SVG personajlar va `claude/c1-2.5d` branch'i bu topshiriqda o'zgartirilmadi/qo'shilmadi. Claude review kutiladi; versiya ko'tarilmagan.

## 1.8.0 pilot integratsiyasi (2026-10-15)
- **Joriy yurish (Claude cutout):** `chibi/walk-rig.js` — asl walk-a/walk-b qismlari, ustki qism bitta bo'lak, oyoqlar ikki asl pozadan, tana 12 px bob, qo'llar ±5°, 20 fps / 1 s. Shaxzod tanlagan. Oldingi: **Tarix — walk tuzatishi:** oldingi8AIatlas fazalari takrorlangani uchun12WebP/20fps/0.6s original yuqori tana + koddagi ikki bo'g'imli oyoq rig'i bilan almashtirildi. Builder: `scripts/build-chibi-walk.py` (faqat asset tayyorlashda Pillow), runtime taymer/skaner qo'shilmagan. Tayanchbaseline398, footmotion98.4DIP/s≈main100; blink originalwalk-a x14/y(2+bob). Barcha45asset1.22MB, walkdecode5.49MiB (+1.83MiB). CPU qayta o'lchanmadi. Electron ikki yo'nalish, tabiiy blink/ifoda/holat va main/preload smoke o'tdi. Batafsil chibi/README.md. Quyidagi8kadr bandlari avvalgi integratsiya tarixi.
- Shaxzod tasdiqlagan qatlamli idle20fps va 8WebP walk10fps runtime'ga ulandi. `chibi/sequence.js`: manifestv2 `{frames,slots}`, fps/loop/next va pauzali monotonic soat; eski tekis manifest ham o'qiladi. `index.html` rig/sequence'ni chibi.js'dan oldin yuklaydi.
- A–D: faqat neytral animatsiya; boshqa yuzlar va blink eski bitta poza+overlay, keyin sequence davom etadi. 2-kadrli climb4fps. Renderer faqat dancing flag yuboradi; eski4SVG, style.css va main o'zgarmagan. Faol slotda CSS breath/step o'chiriladi.
- 8WebP eager decode tanlandi: qo'shimcha3.66MiB; lokal all qaytish0.1ms vs active qayta11.9ms. Idle5layer1.82MiB. 41rasm jami1396541bayt (<3MB), alfa/<=400px; runtime piksel skaneri yo'q. Batafsil o'lchov va kontrakt: chibi/README.md. Bu qisqa pilot namuna, X4 mezoni emas.
- Haqiqiy Electron58tekshiruv + asset-failure fallback/tabiiy blink; npm start alohida Temp profil bilan ishladi. Sinov vaqtinchalik fayllari o'chiriladi; versiya1.7.0 o'zgarmaydi. Claude review, haqiqiy sichqoncha/fullscreen/OS sleep-resume va release ruxsati keyin.
