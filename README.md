# Ko'kcha — desktop pet 🌱

Ish stolida, taskbar ustida yashaydigan kichik yordamchi.

## Nimalar qila oladi
- **Yuradi:** har 8–18 soniyada ekran bo'ylab o'zi yurib qo'yadi, chetga yetsa burilib ketadi. Sichqoncha ustida tursa, yurmaydi.
- **Uxlaydi:** klaviatura va sichqoncha 3 daqiqa tinch tursa, ko'zini yumib "Zzz" bilan uxlab qoladi. Qaytib kelsangiz, kerishib uyg'onadi.
- **Gapiradi:** ustiga bossangiz sakrab gapiradi. Soatga qarab salomlashadi, vaqti-vaqti bilan o'zi ham gapiradi.
- **Dam olishni eslatadi:** uzluksiz ishlagan vaqtingizni sanaydi (5 daqiqadan uzoq tanaffusdan keyin hisob noldan boshlanadi).
- **Kursorga qaraydi:** ko'zlari sichqonchangizni kuzatib turadi.
- **Sudraladi:** ushlab istalgan joyga olib boring, qo'yib yuborsangiz taskbar ustiga tushadi.
- **Xalaqit bermaydi:** shaffof joylar va gap pufakchasi orqali bemalol bosish mumkin. To'liq ekranli video, o'yin yoki prezentatsiya ochilsa, o'zi yashirinadi.
- **Eslab qoladi:** joylashuvi va sozlamalari qayta ochilganda saqlanib qoladi.

## Tray menyu
Soat yonidagi belgini **chap tugma** bilan bossangiz, Ko'kcha gapiradi (yashirin bo'lsa ko'rinadi). **O'ng tugma** bilan menyu ochiladi:

| Band | Vazifasi |
|---|---|
| Gapir / Uxlat / Uyg'ot | — |
| Yashirish / Ko'rsatish | vaqtincha olib turish |
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

## O'z rasmlaringizni qo'yish
Rasmlarni quyidagi nomlar bilan saqlang (PNG, GIF yoki WebP, foni shaffof bo'lsin):

| Fayl | Qachon ko'rinadi |
|---|---|
| `idle.png` | turganda (majburiy, qolganlari bo'lmasa shu ishlatiladi) |
| `walk.png` | yurganda (GIF bo'lsa yaxshi) |
| `sleep.png` | uxlaganda |
| `talk.png` | gapirganda |

Qayerga qo'yish kerak:
- `npm start` bilan ishlatsangiz: **`assets/custom/`** papkasiga
- exe bilan ishlatsangiz: exe yonida **`custom/`** papka ochib, o'shanga

Keyin dasturni qayta ishga tushiring. Rasm bo'lmasa, standart Ko'kcha ko'rinadi.

## Sozlash
- Gaplar: `renderer.js` boshidagi `PHRASES`, `greeting()`, `timePhrases()`
- Uyqu vaqti, yurish tezligi, eslatma variantlari: `main.js` boshidagi `SLEEP_AFTER_MS`, `WALK_SPEED`, `BREAK_OPTIONS`
- Sozlamalar fayli: `%APPDATA%/kokcha-desktop-pet/settings.json`
- Ko'rinish va animatsiyalar: `style.css`
