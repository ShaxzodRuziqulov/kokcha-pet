# O'zgarishlar

## Keyingi versiya
- Personajlar o'z fe'li bilan gapiradi: Midori'ning 4 kayfiyati (quvnoq, uyatchan, injiq, hazilkash) navbat bilan almashadi; Ko'kcha — bolalarcha qiziquvchan. Salomlashish, harakat, jahl, uyg'onish, silash va tanaffus gaplari fe'lga mos.

## 1.8.0
- Mushukcha, Kuchukcha va Pingvin olib tashlandi — ularni tanlaganlar avtomatik Ko'kchaga o'tadi. Menyuda: Yashil qizcha, Ko'kcha va "O'z rasmim".
- Ko'kcha: otib yuborilganda jahl (qosh, og'iz, g'azab belgisi, kuchiga qarab silkinish); chapga burilishda "varaq ag'darilishi" yo'q.
- Ko'kcha va "O'z rasmim" ancha yengil: tinch turganda CPU ~57% → ~20% bir yadro (abadiy SVG animatsiyalari qadamli, ko'z qisish taymer bilan).
- Yashil qizcha: neytral holatda nafas, bosh va soch harakati; yangi yurish — asl rasm qismlaridan: tana qadamga mos ko'tariladi, qo'llar siltanadi, bosh va tana doim mos. Boshqa yuz ifodalari va pozalar saqlanadi.
- Ko'z qisish turganda ham, yurganda ham harakatni to'xtatmaydi. Animatsiya yashirin oynada va boshqa personaj tanlanganda to'xtaydi; qizcha tinch turganda CPU ~25% → ~7%.

## 1.7.0
- Qizcha ifodalari ¾/yon ko'rinish, o'tirish, yurish va qirrada o'tirishda ham almashadi; ko'z pirpirashi shu holatlarda ham ishlaydi.
- Qizcha tirmashayotganda qo'l va oyoqlari ikki alohida kadrda almashadi.
- Shaxsiy eslatmalar: menyudan matn va vaqt kiriting; saqlanadi, vaqti kelganda eslatadi. Yashirin holatda qolgan eslatmalar qaytgach ko'rsatiladi.
- Yashil qizcha: tez sudrab qo'yib yuborilganda otish kuchiga qarab jahlning uch darajasi (boshqa personajlarda keyingi versiyada). Oddiy sudrash va oxirida to'xtab qo'yish jahlni yoqmaydi.

## 1.6.1
- Yashil qizcha kadrlari alohida, 400 px gacha PNG'larga ajratildi; qo'shni kadrdan soch kirishi va osilishdagi taxta olib tashlandi. Rasmlar jami 6.54 MB dan 0.55 MB ga tushdi, ochilishdagi alfa skaneri olib tashlandi.
- Yurishda ikki kadr, qirrada oyoq osiltirib o'tirish, ko'z pirpiratish va old/¾/yon orqali chapga burilish qo'shildi. Kursor chegarasida burilish titramaydi.
- Xafa/hayron ifodalari ulandi. Qizcha 180 px bo'ldi; ushlash sohasi va harakat geometriyasi moslandi.

## 1.6.0
- 👧 **Yangi personaj — Yashil qizcha:** yurish, o'tirish, yotish, osilish, sakrash va yiqilish pozalari; kulish, jahl, uyqu, gapirish va uyalish ifodalari; kursor tomonga burilish. Menyu → Personaj → Yashil qizcha.
- ⌨️ **Ctrl+Alt+M:** bir tugma bilan yashirish va ko'rsatish (tray menyusida ham ko'rinadi). Tugma boshqa dastur tomonidan band bo'lsa, menyuda aytiladi.

## 1.5.0
### O'rnatish va yangilanish
- 📦 **Haqiqiy o'rnatuvchi:** `Kokcha-Setup-1.5.0.exe` — bir bosishda o'rnatiladi, ish stoli va Start menyuga yorliq qo'yadi, Windows "Ilovalar" ro'yxatidan o'chirsa bo'ladi
- 🔄 **Avtomatik yangilanish:** yangi versiya fonda yuklanadi, personaj aytadi va keyingi safar o'zi yangilanadi (yoki menyudan "Yangilash" — darhol)
- Portable versiya yangi versiya chiqqanini aytadi va yuklab olish sahifasini ochadi
- Menyuda joriy versiya ko'rinadi

### Ichki
- Kod modullarga ajratildi (`src/main`, `src/renderer`)
- `npm run release` — release'ni bitta buyruq bilan chiqarish

### Qaysi faylni yuklab olish kerak?
- **Kokcha-Setup-1.5.0.exe** — tavsiya etiladi: o'rnatiladi va o'zi yangilanib turadi
- **Kokcha-1.5.0-portable.exe** — o'rnatmasdan ishlatish uchun (flesh, ish kompyuteri)

> Windows SmartScreen "noma'lum dastur" deb ogohlantirsa: **Batafsil → Baribir ishga tushirish**.

## 1.4.0
- Personaj oynalar ustida yashaydi: sakrab chiqadi, oyna bilan birga ko'chadi, oyna yopilsa yiqiladi
- Qirrada: buriladi, oyog'ini osiltirib o'tiradi yoki sakrab tushadi
- Ekran chetiga tirmashadi, osilib turadi
- Yangi pozalar: o'tirish, yotish, sakrash, yiqilish; atrofga qaraydi

## 1.3.0
- "O'z rasmim" tanlanganda personaj maslahat beradi, rasm tekshiriladi va avtomatik qirqiladi

## 1.2.0
- Yangi personajlar: Mushukcha, Kuchukcha, Pingvin; rang tanlash; o'z rasmini tanlash

## 1.1.0
- Tanishtirish, o'ng tugma menyusi, Ctrl bilan orqasini bosish, raqs, silash, esnash

## 1.0.0
- Birinchi versiya
