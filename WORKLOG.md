# Ish jurnali

Claude va Codex shu yerga yozadi. Yangi yozuv **eng yuqoriga** qo'shiladi.
Qoidalar: [AGENTS.md](AGENTS.md).

## Hozir band
- **Claude:** `src/renderer/` (characters.js, renderer.js, style.css, index.html) va yangi `src/renderer/3d/`
- **Codex:** `src/main/`, `src/preload.js`, `main.js`, yangi `src/reminders/`
- Umumiy fayllar (`package.json`, `CHANGELOG.md`): o'zgartirishdan oldin Shaxzod orqali kelishiladi.

## Kontrakt: main → renderer kanallari
Ikki tomon faqat shu orqali bog'lanadi. Kanal yoki ma'lumot shakli o'zgarsa, avval ikkinchi agent bilan Shaxzod orqali kelishiladi.

| Kanal | Kim yuboradi | Ma'lumot | Renderer nima qiladi |
|---|---|---|---|
| `mood` | Codex (motion.js) | `{ mood: 'angry', level: 1 \| 2 \| 3 }` | Claude: jahl animatsiyasi; level = otish kuchi |
| `remind` | Codex (eslatmalar) | `{ text: string }` | Claude: pufakchada eslatmani maxsus ko'rinishda ko'rsatadi |

Codex `preload.js` dagi `EVENTS` ro'yxatiga `'mood'` va `'remind'` ni qo'shadi; bu birinchi qilinadi.

## Vazifalar
Holat: `ochiq` → `ishlanmoqda` → `review` → `tayyor`. Har ishni ikkinchi agent review qiladi.

| # | Vazifa | Kim | Holat | Izoh |
|---|---|---|---|---|
| X0 | `preload.js`: `mood`, `remind` kanallarini qo'shish | Codex | ochiq | **birinchi**, kichik |
| X1 | Ctrl+Alt+M: bir tugma bilan yashirish/ko'rsatish | Codex | ochiq | `globalShortcut`; tray menyusida ham ko'rinsin |
| X2 | Tez otib yuborishni aniqlash → `mood` yuborish | Codex | ochiq | `motion.js`, drag-end tezligi; renderer qismi C2 da |
| X3 | Eslatmalar: qo'shish oynasi, saqlash, vaqtida `remind` yuborish | Codex | ochiq | sozlamalarda saqlansin, qayta ochilganda yo'qolmasin |
| X4 | Tezlikni o'lchash: CPU/RAM (tinch, yurish, sudrash) | Codex | ochiq | **hozirgi holatni oldin o'lchash**, keyin C1/C3 bilan solishtirish |
| C1 | 2.5D: barcha personajlarga hajm, yorug'lik, soya, kursorga qarab egilish | Claude | ochiq | GPU'siz, yengil bo'lishi shart |
| C2 | Kayfiyat animatsiyalari: jahl (`mood`), eslatma pufakchasi (`remind`), cho'zilib-siqilish | Claude | ochiq | X0 dan keyin |
| C3 | 3D tajriba: bitta personaj Three.js'da, harakatsiz turganda chizish to'xtaydi | Claude | ochiq | **Three.js o'rnatish uchun Shaxzod ruxsati kerak**; X4 bilan o'lchanadi |
| 3 | `dist/` ni tozalash (500 MB) | | ochiq | ixtiyoriy |
| — | AI bilan suhbat | — | kerak emas | Shaxzod qarori (2026-10-14) |

**Yo'nalish (Shaxzod, 2026-10-14):** Ko'kchani yaxshi darajaga olib chiqish, 2D dan 3D gacha. MaoMao'dan nusxa olinmaydi, lekin undan yaxshiroq va yengilroq bo'lishi kerak.

---

## 2026-10-14 · Claude · Ikki agentli ish tartibi yo'lga qo'yildi
- Fayllar: AGENTS.md, CLAUDE.md, WORKLOG.md (yangi)
- Tekshirildi: kod o'zgarmadi
- Keyingi agentga: endi har ish shu jurnal orqali boshlanadi va tugaydi.

## 2026-10-13 · Claude · Ko'kcha 1.5.0 chiqarildi
- O'rnatuvchi (`Kokcha-Setup-1.5.0.exe`), avtomatik yangilanish, kod `src/main` va `src/renderer` ga ajratildi.
- Commit: 2f5817d, teg v1.5.0, GitHub release chiqarilgan.
- Qolgan ish: `dist/` 500 MB joy egallaydi (o'chirsa bo'ladi, `npm run build` qayta yaratadi).
