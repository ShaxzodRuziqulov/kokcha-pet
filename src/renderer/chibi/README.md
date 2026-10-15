# Chibi kadrlar

Runtime: `frames/*.png` va `frames/manifest.json`. 19 alohida, shaffof, eng katta tomoni 400 px PNG; jami 550 298 bayt. RGBA bitmaplarning nazariy hajmi 9 347 200 bayt (8.91 MiB), Chromium/GPU overhead'i bundan tashqari. Runtime'da atlas yoki alfa skaneri yo'q. `head` — kadr masshtabi uchun bosh kengligi; `neck` — turish kadridagi yuz almashtirish chegarasi. Chetda shaffof gutter bor.

Oldingi 4 atlas Git tarixida (`8fd6fb3`, `src/renderer/chibi/`) saqlangan. Kadrlar alfa siluet komponentlari bo'yicha ajratildi: ¾ va yon ko'rinishlar qo'shni soch bo'laklarini olmaydi, o'tirish katagiga pastdagi sakrashning sochi kirmaydi. Ranglar 256 rangli RGBA PNG palitrasiga tushirilgan.

Yangi rasmlar built-in `image_gen` orqali yaratildi, keyin alfa bo'yicha qirqildi va kichraytirildi. Asos: oldingi `standing.png` (personaj identifikatsiyasi), `poses.png` (poza/uslub). Yakuniy promptlar (mazmun va cheklovlar):

- `hang.png`: ayni yashil sochli chibi, ikki qo'li tepada ko'rinmas qirrani ushlaydi, oyoqlari pastga osilgan; yog'och taxtani butunlay olib tashlash; sviter/yubka/paypoq/etik/soch va yuz izchil; bitta to'liq personaj, shaffof fon; predmet, soya, matn yo'q.
- `walk-b.png`: o'ngga qaragan ayni personaj, yurishning o'tish qadami; oyoqlar bir-biriga yaqin, biri tekis pastga tayangan, ikkinchisining tizzasi bukilgan va tovoni boldir ortiga ko'tarilgan; old qo'l yoniga tushirilgan; bosh, soch, yuz, kiyim va uslub saqlanadi; shaffof fon, to'liq bitta personaj. Dastlabki keng qadam varianti ishlatilmaydi.
- `ledge.png`: o'ng ¾ ko'rinish, ko'rinmas qirrada o'tirgan ayni personaj; kaftlar ikki yonida, sonlar gorizontal, tizzalar birga, boldirlar va etiklar vertikal pastga osilgan; tagcharm kameraga qaramaydi; stol, qirra, taxta, soya yoki matn chizilmaydi; shaffof fon.

Animatsiya: faqat yurishda 250 ms kadr almashuvi; neytral old ko'rinishda 3.2–6 s oralig'ida 135 ms pirpirash; burilishda 95 ms oraliqdagi old/¾/yon kadrlar; kursor uchun 300/190 va 1050/880 px histerezis. Boshqa personaj yoki yashirin hujjatda taymerlar to'xtatiladi. Qizcha 180 px, eski personajlar 150 px. Qirrada yangi kadrning oyoqlari uchun 46 px pastga siljish.
