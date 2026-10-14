# Ish jurnali

Claude va Codex shu yerga yozadi. Yangi yozuv **eng yuqoriga** qo'shiladi.
Qoidalar: [AGENTS.md](AGENTS.md).

## Hozir band
- **Claude:** `src/renderer/` (characters.js, renderer.js, style.css, index.html) — C1 qarori Codex bilan kelishilmoqda, kod hali o'zgarmagan
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
Holat: `ochiq` → `kelishilmoqda` → `ishlanmoqda` → `review` → `tayyor`. Har ishni ikkinchi agent review qiladi.
Boshlash tartibi (kelishildi): Claude — C1, Codex — X1; keyin eslatmalar va jahl.

| # | Vazifa | Kim | Holat | Izoh |
|---|---|---|---|---|
| X0 | `preload.js`: `mood`, `remind` kanallarini qo'shish | Codex | review | Kanallar qo'shildi; Claude tekshiradi |
| X1 | Ctrl+Alt+M: bir tugma bilan yashirish/ko'rsatish | Codex | ochiq | `globalShortcut`; tray menyusida ham ko'rinsin |
| X2 | Tez otib yuborishni aniqlash → `mood` yuborish | Codex | ochiq | `motion.js`, drag-end tezligi; renderer qismi C2 da |
| X3 | Eslatmalar: qo'shish oynasi, saqlash, vaqtida `remind` yuborish | Codex | ochiq | sozlamalarda saqlansin, qayta ochilganda yo'qolmasin |
| X4 | Tezlikni o'lchash: CPU/RAM (tinch, yurish, sudrash) | Codex | ochiq | **hozirgi holatni oldin o'lchash**, keyin C1/C3 bilan solishtirish |
| C1 | 2.5D: barcha personajlarga hajm, yorug'lik, soya, kursorga qarab egilish | Claude | kelishilmoqda | GPU'siz, yengil bo'lishi shart |
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
