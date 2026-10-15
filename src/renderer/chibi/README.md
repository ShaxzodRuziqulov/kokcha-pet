# Chibi kadrlar

Runtime: `frames/*.png` va `frames/manifest.json`. 33 alohida, shaffof, eng katta tomoni 400 px PNG; jami 855 969 bayt. RGBA bitmaplarning nazariy hajmi 14 737 920 bayt (14.06 MiB), Chromium/GPU overhead'i bundan tashqari. Runtime'da atlas yoki alfa skaneri yo'q. `head` — kadr masshtabi uchun bosh kengligi; `neck` — turish kadridagi yuz almashtirish chegarasi. Chetda shaffof gutter bor.

Oldingi 4 atlas Git tarixida (`8fd6fb3`, `src/renderer/chibi/`) saqlangan. Kadrlar alfa siluet komponentlari bo'yicha ajratildi: ¾ va yon ko'rinishlar qo'shni soch bo'laklarini olmaydi, o'tirish katagiga pastdagi sakrashning sochi kirmaydi. Ranglar 256 rangli RGBA PNG palitrasiga tushirilgan.

Yangi rasmlar built-in `image_gen` orqali yaratildi, keyin alfa bo'yicha qirqildi va kichraytirildi. Asos: oldingi `standing.png` (personaj identifikatsiyasi), `poses.png` (poza/uslub). Yakuniy promptlar (mazmun va cheklovlar):

- `hang.png`: ayni yashil sochli chibi, ikki qo'li tepada ko'rinmas qirrani ushlaydi, oyoqlari pastga osilgan; yog'och taxtani butunlay olib tashlash; sviter/yubka/paypoq/etik/soch va yuz izchil; bitta to'liq personaj, shaffof fon; predmet, soya, matn yo'q.
- `walk-b.png`: o'ngga qaragan ayni personaj, yurishning o'tish qadami; oyoqlar bir-biriga yaqin, biri tekis pastga tayangan, ikkinchisining tizzasi bukilgan va tovoni boldir ortiga ko'tarilgan; old qo'l yoniga tushirilgan; bosh, soch, yuz, kiyim va uslub saqlanadi; shaffof fon, to'liq bitta personaj. Dastlabki keng qadam varianti ishlatilmaydi.
- `ledge.png`: o'ng ¾ ko'rinish, ko'rinmas qirrada o'tirgan ayni personaj; kaftlar ikki yonida, sonlar gorizontal, tizzalar birga, boldirlar va etiklar vertikal pastga osilgan; tagcharm kameraga qaramaydi; stol, qirra, taxta, soya yoki matn chizilmaydi; shaffof fon.

Animatsiya: faqat yurishda 250 ms kadr almashuvi; neytral old ko'rinishda 3.2–6 s oralig'ida 135 ms pirpirash; burilishda 95 ms oraliqdagi old/¾/yon kadrlar; kursor uchun 300/190 va 1050/880 px histerezis. Boshqa personaj yoki yashirin hujjatda taymerlar to'xtatiladi. Qizcha 180 px, eski personajlar 150 px. Qirrada yangi kadrning oyoqlari uchun 46 px pastga siljish.

## 1.7.0 uchun

- 33 kadr: asosiy pozalar, 2 climb va 3 yo'nalishdagi yuzlar. PNG jami 855 969 bayt; dekodlangan RGBA nazariy 14 737 920 bayt (14.06 MiB), process/GPU overhead'i kirmaydi. Yangi yuzlar 320 px gacha; tana/climb 400 px gacha.
- `manifest.json` dagi `face` — har poza uchun bosh/yoqa joyi (`x/y/w/h/cut`, `join` esa eski boshni tozalagandan keyin yoqa ostini tananing o‘z PNG bo‘lagi bilan tutashtiradi) va yo'nalishi (`front/quarter/profile`). Stand, quarter, profile, sit, walk-a, walk-b, ledge uchun happy/angry/sad/surprised/talking/sleeping. Tana va yurish fazasi o'zgarmaydi; chapga qaraganda yuz ham birga akslanadi. Quarter/profile holatida ifoda personajni oldinga majburan burmaydi.
- Neutral holatda shu pozalarning barchasi ko'z pirpirata oladi. `sleeping` yuz ifodasi ko'zlarni yumadi; haqiqiy `state:sleep` avvalgidek yotish kadrini tanlaydi. Embarrassed hozir faqat front guruhida bor; boshqa yo'nalishlar neytralga qaytadi.
- Climb haqiqiy orqa ko'rinishdagi ikkita poza bilan 250 ms almashadi; yurish bilan bitta faza taymeridan foydalanadi va harakat tugaganda/yashirilganda to'xtaydi.
- Yangi rasmlar built-in `image_gen` bilan yaratildi. Aniq promptlar: `expression-prompts.json`, `climb-prompts.json`. 3x2 yuz atlasi builddan oldin alohida PNG'larga kesildi; runtime atlas/skaner ishlatmaydi.
