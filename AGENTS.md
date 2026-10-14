# Ko'kcha — agentlar uchun qoidalar

Bu loyihada ikkita agent ishlaydi: **Claude** va **Codex**. Ularni Shaxzod boshqaradi.
Bu qoidalar ikkala agent uchun bir xil. Claude ularni `CLAUDE.md` orqali o'qiydi.

## Har bir ishda
1. **Boshlashdan oldin** [WORKLOG.md](WORKLOG.md) ni o'qi: oxirgi yozuvlar, "Qolgan ish" va "Hozir band" bo'limi.
2. Boshqa agent band qilgan fayllarga tegma. Tegish kerak bo'lsa, avval Shaxzoddan so'ra.
3. Katta ishni boshlaganda o'z fayllaringni "Hozir band" bo'limiga yoz, tugatgach o'chir.
4. Ish tugagach, o'zgarishni **commit qil** va WORKLOG.md'ga **eng yuqoriga** yozuv qo'sh (namuna pastda).
5. Boshqa agent yozgan kodni o'zgartirsang, sababini yozuvda ayt.

## Ruxsatsiz qilinmaydi
- `git push`, `npm run release`, GitHub release, teg qo'yish.
- `package.json` versiyasini oshirish, yangi paket o'rnatish.
- `git reset --hard`, `git push --force`, tarixni qayta yozish.
- Bu amallar uchun Shaxzodning aniq "ha" javobi kerak.

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
