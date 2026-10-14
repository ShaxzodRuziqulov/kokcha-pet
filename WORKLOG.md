# Ish jurnali

Claude va Codex shu yerga yozadi. Yangi yozuv **eng yuqoriga** qo'shiladi.
Qoidalar: [AGENTS.md](AGENTS.md).

## Hozir band
- **Claude:** `src/renderer/` (characters.js, renderer.js, style.css, index.html) — C1 kelishildi; X4 boshlang'ich o'lchovidan keyin boshlanadi
- **Codex:** X4 — `../x4-comparison/` o'lchov skriptlari va hisobotlari; keyin d9d38c2 review (renderer'ga faqat o'qish)
- Umumiy fayllar (`package.json`, `CHANGELOG.md`): o'zgartirishdan oldin Shaxzod orqali kelishiladi.

## Kontrakt: main → renderer kanallari
Ikki tomon faqat shu orqali bog'lanadi. Kanal yoki ma'lumot shakli o'zgarsa, avval ikkinchi agent bilan Shaxzod orqali kelishiladi.

| Kanal | Kim yuboradi | Ma'lumot | Renderer nima qiladi |
|---|---|---|---|
| `mood` | Codex (motion.js) | `{ mood: 'angry', level: 1 \| 2 \| 3 }` | Claude: jahl animatsiyasi; level = otish kuchi |
| `remind` | Codex (eslatmalar) | `{ text: string }` | Claude: pufakchada eslatmani maxsus ko'rinishda ko'rsatadi |

Codex `preload.js` dagi `EVENTS` ro'yxatiga `'mood'` va `'remind'` ni qo'shadi; bu birinchi qilinadi.

## Kelishuvlar
### 2026-10-14 · C1 va X1 · Kelishildi (Claude ↔ Codex, 2 raund)
**Tartib:** 1) Codex X4 boshlang'ich o'lchovini oladi va qayd etadi → 2) parallel: Codex X1, Claude C1 → 3) X4 qayta o'lchov → 4) o'zaro review. Hammasi Shaxzodning "boshlang" buyrug'idan keyin.

**C1 (2.5D), Claude:**
1. Hajm faqat SVG gradientlar bilan; SVG filtrlar va Three.js/WebGL yo'q. Ranglar CSS o'zgaruvchilaridan (color-mix); personaj almashtirilganda va barcha rang variantlarida tekshiriladi.
2. "Bosh burilishi" mavjud `look` asosida; main o'zgarmaydi; ko'z harakatiga qo'shiladi, haddan oshmaydi; chapga qaragan personajda yo'nalish to'g'ri.
3. Yurish/qo'nish animatsiyalari yaxshilanadi; raqs, sudrash, uyqu, pozalar buzilmaydi; effektdan keyin asl holatga qaytadi.
4. Jahl: `{ mood: 'angry', level: 1|2|3 }` (kontrakt o'zgarmaydi); ko'rinish tayyorlanadi, X2 tayyor bo'lgach ulanadi.
5. Faqat `src/renderer/`; yangi paket yo'q; `sprite-mode` (o'z rasmi) ga 2.5D qo'llanmaydi.
6. O'lchov (Codex tartibi): bir xil kompyuter/personaj/o'lcham/sozlamalar; main+renderer+GPU jarayonlari jami; 15 s tayyorlanish, keyin tinch, yurish, sudrash — har biri 60 s, 3 martadan; CPU bir yadroga nisbatan; **tinch holatda o'rtacha CPU +2 foiz punktidan oshmasin**; RAM oldin/keyin qayd etiladi; o'lchab bo'lmasa — "o'lchanmadi", X4 tugamagan hisoblanadi.

**X1 (Ctrl+Alt+M), Codex:**
1. Fayllar: `main.js`, yangi `src/main/shortcuts.js`, `src/main/menu.js`; renderer/preload o'zgarmaydi.
2. `app.whenReady()` da oyna yaratilgach `globalShortcut.register('Control+Alt+M')`.
3. Ko'rinishga qarab: ko'rinsa → `setUserHidden(true)`, ko'rinmasa → `setUserHidden(false)`; `fullscreenHidden` o'zgartirilmaydi.
4. Menyu: mavjud Yashirish/Ko'rsatish bandi, `accelerator: 'Ctrl+Alt+M'`, `registerAccelerator: false`.
5. Tugma band bo'lsa: ilova ishlayveradi, accelerator ko'rsatilmaydi, faol bo'lmagan izoh "Ctrl+Alt+M band yoki mavjud emas"; boshqa tugma tanlanmaydi.
6. Chiqishda yorliq bo'shatiladi; takroriy bosish, menyu bilan bir xil holat, band tugma, to'liq ekran tekshiriladi.

**Review:** X0 (`d87f5c0`) — Claude tasdiqladi.

## Vazifalar
Holat: `ochiq` → `kelishilmoqda` → `ishlanmoqda` → `review` → `tayyor`. Har ishni ikkinchi agent review qiladi.
Boshlash tartibi (kelishildi): Claude — C1, Codex — X1; keyin eslatmalar va jahl.

| # | Vazifa | Kim | Holat | Izoh |
|---|---|---|---|---|
| X0 | `preload.js`: `mood`, `remind` kanallarini qo'shish | Codex | tayyor | Claude d87f5c0 ni tasdiqladi |
| X1 | Ctrl+Alt+M: bir tugma bilan yashirish/ko'rsatish | Codex | tayyor | Claude 0bdee6e ni tasdiqladi; jismoniy tugma Shaxzodda |
| X2 | Tez otib yuborishni aniqlash → `mood` yuborish | Codex | ochiq | `motion.js`, drag-end tezligi; renderer qismi C2 da |
| X3 | Eslatmalar: qo'shish oynasi, saqlash, vaqtida `remind` yuborish | Codex | ochiq | sozlamalarda saqlansin, qayta ochilganda yo'qolmasin |
| X4 | Tezlikni o'lchash: CPU/RAM (tinch, yurish, sudrash) | Codex | ishlanmoqda | a37dc14 va d9d38c2 bir xil tuzatilgan skript bilan ketma-ket; Shaxzod haqiqiy sudrashga rozi |
| C1 | 2.5D: barcha personajlarga hajm, yorug'lik, soya, kursorga qarab egilish | Claude | kelishildi, X4 kutilmoqda | GPU'siz, yengil bo'lishi shart |
| C2 | Kayfiyat animatsiyalari: jahl (`mood`), eslatma pufakchasi (`remind`), cho'zilib-siqilish | Claude | ochiq | X0 dan keyin |
| C3 | 3D tajriba (Three.js) | — | keyin | Shaxzod 2.5D natijasini ko'rib baholagandan keyin alohida topshiriq (Codex taklifi, kelishildi) |
| 3 | `dist/` ni tozalash (500 MB) | | ochiq | ixtiyoriy |
| — | AI bilan suhbat | — | kerak emas | Shaxzod qarori (2026-10-14) |

**Yo'nalish (Shaxzod, 2026-10-14):** Ko'kchani yaxshi darajaga olib chiqish, 2D dan 3D gacha. MaoMao'dan nusxa olinmaydi, lekin undan yaxshiroq va yengilroq bo'lishi kerak.

---

## 2026-10-14 · Codex · Yangi yashil sochli chibi personaj rasmi
- Fayl: assets/characters/green-girl-v1.png.
- Shaxzodning alohida topshirig'i: old ko'rinish, yashil soch/ko'z/sviter, qora yubka/etik, shaffof fon, matnsiz original personaj.
- Tekshirildi: rasm ko'z bilan ko'rildi; PNG 1254×1254, RGBA, haqiqiy alpha kanali mavjud.
- Commit: e5c21d4.
- Faqat rasm tayyorlandi; ilovaga personaj sifatida ulash va animatsiyalar ushbu topshiriqda bajarilmadi.

## 2026-10-14 · Codex · X4: o'lchov tugadi, qabul mezoni hali bajarilmadi
- Dalil: `../x4-baseline-report.json`; source a37dc14, Electron 37.10.3, alohida test profil.
- 15s warm-up va 60s × 3 takror bajarildi. Tinch #1: CPU 69.34% bir yadroga nisbatan, o'rtacha working set 559.1 MiB; #3: 75.26%, 820.7 MiB. #2 oyna 3 namunada yashirilgani sabab yaroqsiz. RAM barcha app jarayonlari working set yig'indisi, umumiy xotira ikki marta sanalishi mumkin. Bu ikkita takror to'liq uch takrorli baseline o'rnini bosmaydi.
- Yurish #1–#3 YAROQSIZ: motion.startWalk() 3–7s da tabiiy tugaydi; 15s warm-up o'tgach motion=null bo'lgan. Ular yurish CPU/RAM natijasi sifatida ishlatilmaydi. Bu measurement harness cheklovi, ilovaning yurish xatosi emas.
- Qolgan ish: yurish sikllarini test harness'da takroran boshlash orqali to'liq 60s walking holatini tekshirish; yaroqsiz tinch takrorni qaytarish; haqiqiy sudrash 3×60s; keyin C1 bilan bir xil sharoitda taqqoslash. C1 +2 foiz punkt mezoni hali baholanmagan.
- X1 commit: 0bdee6e. Claude review; Shaxzod jismoniy Ctrl+Alt+M va haqiqiy fullscreen sinovi.

## 2026-10-14 · Codex · X1: Ctrl+Alt+M va X4 boshlang'ich nusxa
- Fayllar: main.js, src/main/menu.js, yangi src/main/shortcuts.js, WORKLOG.md.
- X1: global yorliq va mavjud menyu bir callback orqali haqiqiy ko'rinishni almashtiradi; fullscreenHidden o'zgarmaydi. Band yorliqda accelerator yashiriladi, izoh ko'rsatiladi. Faqat o'z ro'yxatidan o'tgan yorliq chiqishda bo'shatiladi.
- Tekshirildi: 3 fayl `node --check`; 7 izolyatsiyalangan mantiq sinovi; alohida profilli haqiqiy Electron normal/band globalShortcut, haqiqiy oynada yashirish/ko'rsatish, fullscreen bayrog'i simulyatsiyasi, unregister sinovlari o'tdi.
- Dalillar (lokal, repo tashqarisida): `../verify-x1.cjs`, `../probe-x1.cjs`, `../x1-live-report.json`, `../x1-blocked-report.json`.
- Tekshirilmadi: jismoniy Ctrl+Alt+M bosilishi va haqiqiy o'yin/to'liq ekran; Shaxzod sinaydi.
- X4: C1'dan oldingi a37dc14 arxivi `../x4-baseline/` da saqlandi; alohida profil, Ko'kcha/original/medium, autoWalk=false, climb=false, quiet=true. Main+renderer+GPU va boshqa app jarayonlari hisoblanadi. `../x4-baseline-report.json` yozilmoqda. Oyna yashirilgan takrorlar `valid=false`; haqiqiy sudrash o'lchanmagan. To'liq X4 tugadi yoki C1 +2 punkt mezoni o'tdi deb hisoblanmaydi.
- Keyingi agentga: X1 review qiling. C1 uchun boshlang'ich renderer nusxasi saqlandi; keyingi taqqoslash bir xil profil/tartibda bo'lishi kerak. CHANGELOG umumiy fayl bo'lgani uchun X1 yozuvi egalik kelishilgach qo'shiladi.
- Commit: shu yozuv bilan birga "X1: toggle pet visibility with Ctrl+Alt+M" (`git log` orqali SHA).

## 2026-10-14 · Codex · X0: renderer kanallari ochildi
- Fayllar: src/preload.js, AGENTS.md, WORKLOG.md.
- Tekshirildi: `node --check src/preload.js`; faqat allowlist kengaytirildi.
- Keyingi agentga: `pet.on('mood', cb)` va `pet.on('remind', cb)` mavjud; ma'lumot shakli kontrakt bo'yicha o'zgarishsiz.
- Commit: ushbu yozuv bilan birga `git log` dagi "X0: expose mood and remind events".

## 2026-10-14 · Claude · Ikki agentli ish tartibi yo'lga qo'yildi
- Fayllar: AGENTS.md, CLAUDE.md, WORKLOG.md (yangi)
- Tekshirildi: kod o'zgarmadi
- Keyingi agentga: endi har ish shu jurnal orqali boshlanadi va tugaydi.

## 2026-10-13 · Claude · Ko'kcha 1.5.0 chiqarildi
- O'rnatuvchi (`Kokcha-Setup-1.5.0.exe`), avtomatik yangilanish, kod `src/main` va `src/renderer` ga ajratildi.
- Commit: 2f5817d, teg v1.5.0, GitHub release chiqarilgan.
- Qolgan ish: `dist/` 500 MB joy egallaydi (o'chirsa bo'ladi, `npm run build` qayta yaratadi).
