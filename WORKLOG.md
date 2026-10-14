# Ish jurnali

Claude va Codex shu yerga yozadi. Yangi yozuv **eng yuqoriga** qo'shiladi.
Qoidalar: [AGENTS.md](AGENTS.md).

## Hozir band
_Hech kim._ <!-- Masalan: Codex — src/main/motion.js (yangi sakrash animatsiyasi) -->

## Vazifalar
Holat: `ochiq` → `ishlanmoqda` → `review` → `tayyor`. "Kim" ustunini Shaxzod belgilaydi; bo'sh bo'lsa, agent o'zi olmasdan oldin so'raydi.

| # | Vazifa | Kim | Holat | Izoh |
|---|---|---|---|---|
| 1 | Ctrl+Alt+M: bir tugma bilan yoqish va o'chirish | | ochiq | kichik, `src/main/` |
| 2 | Tez otib yuborilsa, personajning jahli chiqadi | | ochiq | `motion.js` + renderer animatsiyasi |
| 3 | Vazifalar va eslatmalar ("soat 6 da eslat") | | ochiq | o'rta hajm, sozlamalarda saqlash kerak |
| 4 | AI bilan suhbat | — | kerak emas | Shaxzod qarori (2026-10-14): hozircha qilinmaydi |
| 5 | Codex rasm yarata oladimi, aniqlash | Shaxzod | ochiq | javob AGENTS.md jadvaliga yoziladi |
| 6 | `dist/` ni tozalash (500 MB) | | ochiq | ixtiyoriy |

Manba: 1–4 MaoMao'dan olingan g'oyalar.

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
