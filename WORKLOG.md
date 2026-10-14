# Ish jurnali

Claude va Codex shu yerga yozadi. Yangi yozuv **eng yuqoriga** qo'shiladi.
Qoidalar: [AGENTS.md](AGENTS.md).

## Hozir band
- **Claude:** `src/renderer/` (characters.js, renderer.js, style.css, index.html) — C1 kelishildi; X4 boshlang'ich o'lchovidan keyin boshlanadi
- **Codex:** `src/main/`, `src/preload.js`, `main.js`, yangi `src/reminders/`
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
| X0 | `preload.js`: `mood`, `remind` kanallarini qo'shish | Codex | review | Kanallar qo'shildi; Claude tekshiradi |
| X1 | Ctrl+Alt+M: bir tugma bilan yashirish/ko'rsatish | Codex | kelishildi, X4 dan keyin | `globalShortcut`; tray menyusida ham ko'rinsin |
| X2 | Tez otib yuborishni aniqlash → `mood` yuborish | Codex | ochiq | `motion.js`, drag-end tezligi; renderer qismi C2 da |
| X3 | Eslatmalar: qo'shish oynasi, saqlash, vaqtida `remind` yuborish | Codex | ochiq | sozlamalarda saqlansin, qayta ochilganda yo'qolmasin |
| X4 | Tezlikni o'lchash: CPU/RAM (tinch, yurish, sudrash) | Codex | kelishildi, birinchi | **hozirgi holatni oldin o'lchash**, keyin C1/C3 bilan solishtirish |
| C1 | 2.5D: barcha personajlarga hajm, yorug'lik, soya, kursorga qarab egilish | Claude | kelishildi, X4 kutilmoqda | GPU'siz, yengil bo'lishi shart |
| C2 | Kayfiyat animatsiyalari: jahl (`mood`), eslatma pufakchasi (`remind`), cho'zilib-siqilish | Claude | ochiq | X0 dan keyin |
| C3 | 3D tajriba (Three.js) | — | keyin | Shaxzod 2.5D natijasini ko'rib baholagandan keyin alohida topshiriq (Codex taklifi, kelishildi) |
| 3 | `dist/` ni tozalash (500 MB) | | ochiq | ixtiyoriy |
| — | AI bilan suhbat | — | kerak emas | Shaxzod qarori (2026-10-14) |

**Yo'nalish (Shaxzod, 2026-10-14):** Ko'kchani yaxshi darajaga olib chiqish, 2D dan 3D gacha. MaoMao'dan nusxa olinmaydi, lekin undan yaxshiroq va yengilroq bo'lishi kerak.

---

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
