# Ko'kcha — desktop pet 🌱

Ish stolida, taskbar ustida yashaydigan kichik yordamchi.

## Nimalar qila oladi
- **Yuradi:** har 8–18 soniyada ekran bo'ylab o'zi yurib qo'yadi, chetga yetsa burilib ketadi. Sichqoncha ustida tursa, yurmaydi.
- **Uxlaydi:** klaviatura va sichqoncha 3 daqiqa tinch tursa, ko'zini yumib "Zzz" bilan uxlab qoladi. Qaytib kelsangiz, kerishib uyg'onadi.
- **Gapiradi:** ustiga bossangiz sakrab gapiradi. Soatga qarab salomlashadi. O'zi ham vaqti-vaqti bilan gapiradi, lekin faqat siz yozishdan to'xtaganingizda.
- **Raqs tushadi:** ikki marta bossangiz.
- **Silashni yaxshi ko'radi:** kursorni ustida u yoq-bu yoqqa yurgizsangiz, yurakchalar chiqadi.
- **Jonli:** vaqti-vaqti bilan esnaydi, qo'l silkitadi. Uzoq yo'q bo'lsangiz, qaytganingizda kutib oladi.
- **Dam olishni eslatadi:** uzluksiz ishlagan vaqtingizni sanaydi (5 daqiqadan uzoq tanaffusdan keyin hisob noldan boshlanadi).
- **Kursorga qaraydi:** ko'zlari sichqonchangizni kuzatib turadi.
- **Sudraladi:** ushlab istalgan joyga olib boring, qo'yib yuborsangiz taskbar ustiga tushadi.
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
| O'zi yursin | avtomatik yurishni yoqish/o'chirish |
| Jim rejim | o'zi gapirmaydi, faqat eslatmalar va bosilganda javob beradi |
| O'lcham | Kichik / O'rta / Katta |
| Dam olish eslatmasi | har 30 / 45 / 60 daqiqada yoki o'chiq |
| Windows bilan birga ishga tushsin | faqat exe holatida |

## Ishga tushirish
Node.js 20+ kerak.

```bash
npm install
npm start
```

## Exe qilish
```bash
npm run build
```
`dist/` papkasida bitta portable `Kokcha.exe` paydo bo'ladi. O'rnatish talab qilinmaydi.

## Personajni almashtirish
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

Qayerga: `npm start` bilan — **`assets/custom/`**, exe bilan — exe yonidagi **`custom/`** papkaga. Keyin menyudan **O'z rasmim** ni tanlang.

## Sozlash
- Gaplar: `renderer.js` boshidagi `PHRASES`, `greeting()`, `timePhrases()`
- Uyqu vaqti, yurish tezligi, eslatma variantlari: `main.js` boshidagi `SLEEP_AFTER_MS`, `WALK_SPEED`, `BREAK_OPTIONS`
- Sozlamalar fayli: `%APPDATA%/kokcha-desktop-pet/settings.json`
- Ko'rinish va animatsiyalar: `style.css`
- Personajlar (SVG): `characters.js`
