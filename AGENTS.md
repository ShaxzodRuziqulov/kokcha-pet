# Ko'kcha — agentlar uchun qoidalar

Bu loyihada ikkita agent ishlaydi: **Claude** va **Codex**. Ularni Shaxzod boshqaradi.
Bu qoidalar ikkala agent uchun bir xil. Claude ularni `CLAUDE.md` orqali o'qiydi.

## Har bir ishda
0. Yangi sessiyada avval [docs/PROJECT.md](docs/PROJECT.md) ni o'qi: arxitektura, kanallar, saboqlar, qarorlar.
1. **Boshlashdan oldin** [WORKLOG.md](WORKLOG.md) ni o'qi: oxirgi yozuvlar, "Qolgan ish" va "Hozir band" bo'limi.
2. Boshqa agent band qilgan fayllarga tegma. Tegish kerak bo'lsa, avval Shaxzoddan so'ra.
3. Katta ishni boshlaganda o'z fayllaringni "Hozir band" bo'limiga yoz, tugatgach o'chir.
4. Ish tugagach, o'zgarishni **commit qil** va WORKLOG.md'ga **eng yuqoriga** yozuv qo'sh (namuna pastda).
5. Boshqa agent yozgan kodni o'zgartirsang, sababini yozuvda ayt.
6. **Toza papka:** sinov profillari, o'lchov skriptlari, hisobotlar va vaqtinchalik worktree'lar loyiha papkasida ham, uning ota papkasida (`D:\projects\kokcha-pet`) ham yaratilmaydi — faqat tizim Temp'ida. Ish tugagach ular o'chiriladi, birlashtirilgan branch'lar ham o'chiriladi.

## Ruxsatsiz qilinmaydi
- `git push`, `npm run release`, GitHub release, teg qo'yish.
- `package.json` versiyasini oshirish, yangi paket o'rnatish.
- `git reset --hard`, `git push --force`, tarixni qayta yozish.
- Bu amallar uchun Shaxzodning aniq "ha" javobi kerak.

## Kim nimani qila oladi
Vazifa berishdan oldin shu jadvalga qarang. Yangi narsa aniqlansa, jadval yangilanadi.

| Ish | Claude | Codex |
|---|---|---|
| Kod: JS, Electron, CSS | ✅ | ✅ |
| SVG personaj, ikonka, animatsiya (kod orqali chizish) | ✅ hozirgi personajlarni shu usulda chizgan | ✅ |
| Murakkab PNG rasm, foto, rassom uslubidagi rasm | ⚠️ o'zi chiza olmaydi; Higgsfield orqali qila oladi, lekin bu **kredit sarflaydi**, shuning uchun Shaxzoddan so'raladi | ✅ AI rasm vositasi orqali yangi PNG, shaffof fon va rasm tahriri; natija ko'z bilan tekshiriladi, bir xil personaj kadrlari izchilligi kafolatlanmaydi |
| **Personaj ko'rinishini rasm (PNG) asosida chiqarish** | ⚠️ SVG'da qayta chizish sinab ko'rildi — Shaxzodga yoqmadi | ✅ **ustun** — Yashil qizcha (1.6.0) Codex'niki; Shaxzod fikri: Codex yaxshiroq qiladi |
| Boshqaning kodini review qilish | ✅ | ✅ (2-bosqichda 4 ta haqiqiy xato topgan) |
| Exe yig'ish va release | faqat Shaxzod ruxsati bilan | faqat Shaxzod ruxsati bilan |
| Ilovani ko'z bilan tekshirish (`npm start`) | ⚠️ ishga tushira oladi, ekranni har doim ham ko'ra olmaydi | ⚠️ Windows sandbox'i buyruqlarni ishga tushirmasligi mumkin |
| Haqiqiy foydalanuvchi sinovi, ovoz, his | ❌ Shaxzod | ❌ Shaxzod |

## Loyiha
- Electron desktop pet. Windows. Foydalanuvchi matnlari **o'zbek tilida** (lotin).
- `main.js`: kirish nuqtasi. `src/main/`: asosiy jarayon (harakat, menyu, oynalar, yangilanish). `src/renderer/`: ko'rinish va personajlar. `src/preload.js`: ko'prik.
- Ishga tushirish: `npm start`. Yig'ish: `npm run build` (natija `dist/` ga tushadi, Git'ga kirmaydi).
- O'zgarishlar ro'yxati: [CHANGELOG.md](CHANGELOG.md). Yangi funksiya qo'shilsa, "Keyingi versiya" bo'limiga yoz.
- Avtomatik testlar yo'q: o'zgarishni `npm start` bilan tekshir va nimani tekshirganingni WORKLOG'ga yoz.

## WORKLOG yozuvi namunasi
```markdown
## 2026-10-14 · Codex · Qisqa sarlavha
- Fayllar: src/main/menu.js
- Commit: a1b2c3d
- Tekshirildi: npm start, menyudan sinaldi
- Qolgan ish: ...
- Keyingi agentga: ...
```
