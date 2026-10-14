# Ko'kcha — desktop pet 🌱

Ish stolida, taskbar ustida yashaydigan kichik yordamchi.

## Nimalar qila oladi
- **Yuradi, o'tiradi, yotadi:** o'zi nima qilishni tanlaydi — yurib qo'yadi, charchasa o'tiradi, zerikkanda yoyilib yotadi, atrofga qaraydi. Sichqoncha ustida tursa, joyidan qimirlamaydi.
- **Oynalar ustida yashaydi** 🪟: yaqindagi oyna ustiga sakrab chiqadi va uning ustida yuradi. Oynani sursangiz — birga ko'chadi; yopsangiz, yig'sangiz yoki ustini boshqa oyna bilan yopsangiz — yiqilib tushadi. Qirraga yetsa buriladi, oyog'ini osiltirib o'tiradi yoki sakrab tushadi.
- **Devorga tirmashadi** 🧗: ekran chetiga tirmashib chiqadi. Devor yonida oyna bo'lsa — uning ustiga chiqib oladi, bo'lmasa biroz osilib turib, "Uuuu!" deb tushib ketadi.
- **Uxlaydi:** klaviatura va sichqoncha 3 daqiqa tinch tursa, ko'zini yumib "Zzz" bilan uxlab qoladi. Qaytib kelsangiz, kerishib uyg'onadi.
- **Gapiradi:** ustiga bossangiz sakrab gapiradi. Soatga qarab salomlashadi. O'zi ham vaqti-vaqti bilan gapiradi, lekin faqat siz yozishdan to'xtaganingizda.
- **Raqs tushadi:** ikki marta bossangiz.
- **Silashni yaxshi ko'radi:** kursorni ustida u yoq-bu yoqqa yurgizsangiz, yurakchalar chiqadi.
- **Jonli:** vaqti-vaqti bilan esnaydi, qo'l silkitadi. Uzoq yo'q bo'lsangiz, qaytganingizda kutib oladi.
- **Dam olishni eslatadi:** uzluksiz ishlagan vaqtingizni sanaydi (5 daqiqadan uzoq tanaffusdan keyin hisob noldan boshlanadi).
- **Kursorga qaraydi:** ko'zlari sichqonchangizni kuzatib turadi.
- **Sudraladi:** ushlab istalgan joyga olib boring. Qo'yib yuborsangiz pastga tushadi — ostida oyna bo'lsa, o'sha oyna ustiga qo'nadi.
- **Xalaqit bermaydi:** shaffof joylar va gap pufakchasi orqali bemalol bosish mumkin. Ko'kchaning orqasidagi narsani bosish uchun **Ctrl** ni bosib turing. To'liq ekranli video, o'yin yoki prezentatsiya ochilsa, o'zi yashirinadi.
- **Eslab qoladi:** joylashuvi va sozlamalari qayta ochilganda saqlanib qoladi.

## Tray menyu
Ko'kchaning ustida yoki soat yonidagi belgida **o'ng tugma** bosilsa, menyu ochiladi. Belgini chap tugma bilan bossangiz, Ko'kcha gapiradi (yashirin bo'lsa ko'rinadi).

| Band | Vazifasi |
|---|---|
| Gapir / Uxlat / Uyg'ot | — |
| Yashirish / Ko'rsatish | vaqtincha olib turish |
| Personaj | Ko'kcha, Mushukcha, Kuchukcha, Pingvin yoki **O'z rasmim...** |
| Rang | asl rang, yashil, pushti, sariq, binafsha, ko'k |
| O'zi harakat qilsin | yurish, o'tirish, sakrash va hokazolarni yoqish/o'chirish |
| Oynalar ustiga chiqsin | oynalar ustida yurish va devorga tirmashishni yoqish/o'chirish |
| Jim rejim | o'zi gapirmaydi, faqat eslatmalar va bosilganda javob beradi |
| O'lcham | Kichik / O'rta / Katta |
| Dam olish eslatmasi | har 30 / 45 / 60 daqiqada yoki o'chiq |
| Windows bilan birga ishga tushsin | faqat exe holatida |

## O'rnatish
[Releases](https://github.com/ShaxzodRuziqulov/kokcha-pet/releases/latest) sahifasidan yuklab oling:

| Fayl | Kimga |
|---|---|
| **Kokcha-Setup-X.Y.Z.exe** | tavsiya etiladi — bir bosishda o'rnatiladi, ish stoli va Start menyuga yorliq qo'yadi, **o'zi yangilanib turadi** |
| Kokcha-X.Y.Z-portable.exe | o'rnatmasdan ishlatish uchun; yangi versiya chiqsa aytadi, lekin o'zi yangilanmaydi |

Hammasi bitta faylning ichida — internet, Node.js yoki boshqa narsa kerak emas.
Windows SmartScreen "noma'lum dastur" desa: **Batafsil → Baribir ishga tushirish**.
O'chirish: Windows **Sozlamalar → Ilovalar → Kokcha**.

## Yangilanish
O'rnatilgan dastur GitHub'dan yangi versiyani o'zi tekshiradi (ochilgandan 30 soniya keyin va har 6 soatda). Topsa — fonda yuklab oladi, personaj aytadi va dastur keyingi safar yopilganda o'zi yangilanadi. Darhol yangilash: o'ng tugma → **✨ Yangilash**.

## Dasturchilar uchun
Node.js 20+ kerak.

```bash
npm install
npm start
```

| Buyruq | Vazifasi |
|---|---|
| `npm start` | dasturlash rejimida ishga tushirish |
| `npm run build` | `dist/` ga o'rnatuvchi va portable exe yig'ish |
| `npm run release` | GitHub Release yaratib, fayllarni yuklash (tavsif — `CHANGELOG.md` dan) |

Yangi versiya chiqarish: `package.json` dagi `version` ni oshiring → `CHANGELOG.md` ga bo'lim qo'shing → commit, `git tag vX.Y.Z`, push → `npm run build` → `npm run release`.

### Tuzilma
```
main.js              kirish nuqtasi
src/main/            asosiy jarayon
  context.js           umumiy holat va geometriya
  settings.js          sozlamalar
  window.js            personaj oynasi
  appearance.js        personajlar, ranglar, "O'z rasmim"
  motion.js            yurish, sakrash, oynalar ustida yurish, tirmashish
  surfaces.js          ochiq oynalarning qirralarini topish (Windows)
  activity.js          uyqu, eslatmalar, kursor, silash
  native.js            to'liq ekran va Ctrl (Windows)
  menu.js              menyu va tray
  updater.js           avtomatik yangilanish
  ipc.js               renderer bilan aloqa
src/preload.js       xavfsiz ko'prik
src/renderer/        ko'rinish: index.html, style.css, renderer.js, characters.js
scripts/release.mjs  release chiqarish
```

## Personajni almashtirish

**Yangi Yashil qizcha:** tayyor PNG rasmlardan chiziladi; yurish, o'tirish, uyqu/yotish,
osilish, sakrash va yiqilish pozalari hamda yuz ifodalari mavjud. Menyu → **Personaj → Yashil qizcha**.
Eski standart Ko'kcha ilk ochishda yangi qiyofaga o'tadi; keyin tanlagan personajingiz eslab qolinadi.
Ranglar original rasmga mos qoladi. Bu birinchi variantda yurish bitta poza va yengil tebranishdan iborat;
oyoq-qo'llari qadamlab o'zgaradigan animatsiya uchun alohida yurish kadrlari kerak.
Ko'kcha ustida o'ng tugma → **Personaj**:
- **Tayyor personajlar:** Ko'kcha 🌱, Mushukcha 🐱, Kuchukcha 🐶, Pingvin 🐧. Hammasi to'liq animatsiyali.
- **Rang:** har bir tayyor personajni 5 xil rangda qilish mumkin.
- **O'z rasmim...:** kompyuterdan istalgan rasmni tanlang (PNG, GIF, WebP yoki JPG). Rasm dastur ichiga nusxalanadi, asl faylni o'chirsangiz ham qoladi.

### Personajning o'zi yordam beradi
Rasm tanlayotganingizda personaj qanday rasm yaxshi chiqishini aytib turadi. Tanlaganingizdan keyin rasmni tekshiradi:

| Tekshiruv | Natija |
|---|---|
| Atrofida bo'sh joy ko'p | o'zi qirqib oladi ✂️ |
| Juda katta (600 px dan ortiq) | o'zi kichraytiradi |
| Foni bor yoki JPG | ogohlantiradi va fonni olib tashlashni maslahat beradi |
| Juda kichik (150 px dan kam) | xira ko'rinishini aytadi |
| Juda cho'zinchoq | kvadratga yaqinini tanlashni maslahat beradi |

**Eng yaxshi natija uchun:** foni shaffof PNG yoki GIF, kvadratga yaqin, kamida 256×256 piksel, personaj o'rtada va pastga tegib tursin.

Har holat uchun alohida rasm qo'ymoqchi bo'lsangiz (ilg'or usul), quyidagi nomlar bilan saqlang:

| Fayl | Qachon ko'rinadi |
|---|---|
| `idle.png` | turganda (qolganlari bo'lmasa shu ishlatiladi) |
| `walk.png` | yurganda (GIF bo'lsa yaxshi) |
| `sleep.png` | uxlaganda |
| `talk.png` | gapirganda |

Qayerga: o'rnatilgan dasturda — **`%APPDATA%\kokcha-desktop-pet\custom\`**, portable exe'da — exe yonidagi **`custom\`**, `npm start` bilan — **`assets/custom/`**. Keyin menyudan **O'z rasmim** ni tanlang.

## Sozlash
- Gaplar: `src/renderer/renderer.js` boshidagi `PHRASES`, `MOVE_PHRASES`, `greeting()`
- Uyqu, eslatmalar: `src/main/activity.js` boshidagi `SLEEP_AFTER_MS`, `RANDOM_CHAT_MS`
- Harakat tezligi, sakrash balandligi: `src/main/motion.js` boshidagi `WALK_SPEED`, `JUMP_REACH`
- Ko'rinish va animatsiyalar: `src/renderer/style.css`, personajlar: `src/renderer/characters.js`
- Sozlamalar fayli: `%APPDATA%/kokcha-desktop-pet/settings.json`
