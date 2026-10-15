# Chibi kadrlar

Runtime: `frames/*.png`, `pilot/walk/*.webp` va `frames/manifest.json`. 33 PNG + 8 WebP; jami 1 396 541 bayt. Eng katta tomoni 400 px, shaffof alfa. Bitmaplarning nazariy hajmi 18 577 920 bayt (17.72 MiB), idle qatlamlari yana 1.82 MiB; Chromium/GPU overhead'i bundan tashqari. Runtime'da atlas yoki alfa skaneri yo'q. `head` — kadr masshtabi uchun bosh kengligi. Chetda shaffof gutter bor.

Oldingi 4 atlas Git tarixida (`8fd6fb3`, `src/renderer/chibi/`) saqlangan. Kadrlar alfa siluet komponentlari bo'yicha ajratildi: ¾ va yon ko'rinishlar qo'shni soch bo'laklarini olmaydi, o'tirish katagiga pastdagi sakrashning sochi kirmaydi. Ranglar 256 rangli RGBA PNG palitrasiga tushirilgan.

Yangi rasmlar built-in `image_gen` orqali yaratildi, keyin alfa bo'yicha qirqildi va kichraytirildi. Asos: oldingi `standing.png` (personaj identifikatsiyasi), `poses.png` (poza/uslub). Yakuniy promptlar (mazmun va cheklovlar):

- `hang.png`: ayni yashil sochli chibi, ikki qo'li tepada ko'rinmas qirrani ushlaydi, oyoqlari pastga osilgan; yog'och taxtani butunlay olib tashlash; sviter/yubka/paypoq/etik/soch va yuz izchil; bitta to'liq personaj, shaffof fon; predmet, soya, matn yo'q.
- `walk-b.png`: o'ngga qaragan ayni personaj, yurishning o'tish qadami; oyoqlar bir-biriga yaqin, biri tekis pastga tayangan, ikkinchisining tizzasi bukilgan va tovoni boldir ortiga ko'tarilgan; old qo'l yoniga tushirilgan; bosh, soch, yuz, kiyim va uslub saqlanadi; shaffof fon, to'liq bitta personaj. Dastlabki keng qadam varianti ishlatilmaydi.
- `ledge.png`: o'ng ¾ ko'rinish, ko'rinmas qirrada o'tirgan ayni personaj; kaftlar ikki yonida, sonlar gorizontal, tizzalar birga, boldirlar va etiklar vertikal pastga osilgan; tagcharm kameraga qaramaydi; stol, qirra, taxta, soya yoki matn chizilmaydi; shaffof fon.

Animatsiya: qatlamli idle 20 fps, 8 kadrli yurish 10 fps, climb 4 fps; 3.2–6 s oralig'ida 135 ms pirpirash; burilishda 95 ms oraliqdagi old/¾/yon kadrlar; kursor uchun 300/190 va 1050/880 px histerezis. Boshqa personaj yoki yashirin hujjatda taymerlar to'xtatiladi. Qizcha 180 px, eski personajlar 150 px. Qirrada yangi kadrning oyoqlari uchun 46 px pastga siljish.

## 1.7.0 uchun

- 33 kadr: asosiy pozalar, 2 climb va 3 yo'nalishdagi yuzlar. PNG jami 855 969 bayt; dekodlangan RGBA nazariy 14 737 920 bayt (14.06 MiB), process/GPU overhead'i kirmaydi. Yangi yuzlar 320 px gacha; tana/climb 400 px gacha.
- `manifest.json` dagi `face` — har poza uchun bosh/yoqa joyi (`x/y/w/h/cut`, `join` esa eski boshni tozalagandan keyin yoqa ostini tananing o‘z PNG bo‘lagi bilan tutashtiradi) va yo'nalishi (`front/quarter/profile`). Stand, quarter, profile, sit, walk-a, walk-b, ledge uchun happy/angry/sad/surprised/talking/sleeping. Tana va yurish fazasi o'zgarmaydi; chapga qaraganda yuz ham birga akslanadi. Quarter/profile holatida ifoda personajni oldinga majburan burmaydi.
- Neutral holatda shu pozalarning barchasi ko'z pirpirata oladi. `sleeping` yuz ifodasi ko'zlarni yumadi; haqiqiy `state:sleep` avvalgidek yotish kadrini tanlaydi. Embarrassed hozir faqat front guruhida bor; boshqa yo'nalishlar neytralga qaytadi.
- Climb haqiqiy orqa ko'rinishdagi ikkita poza bilan 250 ms almashadi; yurish bilan bitta faza taymeridan foydalanadi va harakat tugaganda/yashirilganda to'xtaydi.
- Yangi rasmlar built-in `image_gen` bilan yaratildi. Aniq promptlar: `expression-prompts.json`, `climb-prompts.json`. 3x2 yuz atlasi builddan oldin alohida PNG'larga kesildi; runtime atlas/skaner ishlatmaydi.

## 1.8.0 sifat sinovi

Claude bilan A–D kelishuvi asosida qatlamli idle va 8 kadr / 10 fps walk pilot tayyorlandi. GIF ko'rigidan keyin Shaxzod integratsiyani tasdiqladi. Manba, aniq prompt, qatlamlar va tekshiruvlar: [pilot/README.md](pilot/README.md).

## 1.8.0 pilot review tuzatishlari

Shaxzod davom dedi; integratsiya oldidan walk soch/yoqa konturi 2–3px feather + overlap bilan, idle soch ildizi yumshoq maska/overlap bilan tuzatildi. Walk boshiga fazaga mos tebranish, idle amplitudalariga 2.5× qo‘shildi. Yangi rasm generatsiyasi yo‘q. Yangi GIF’lar chibi-180-revision2 artifact papkasida. Aniq parametr/tekshiruvlar [pilot/README.md](pilot/README.md) va walk.json’da.

## 1.8.0 runtime integratsiyasi

Manifest v2: `{version:2, frames:{id:{width,height,head,...}}, slots:{name:{frames:[id,...],fps,loop,next}}}`. `sequence.js` eski tekis manifestni ham o'qiydi; v2 dagi eski poza/face metadata aynan saqlangan. WebP kadrlar `src` (chibi ildizidan) va `sequenceOnly:true` bilan belgilanadi. Idle uchun `procedural:"idle",duration:3.2`, kadr `stand`; uning fps'i protsedural chizish tezligi. Non-loop slot oxirgi kadrda to'xtaydi yoki `next` slotga qolgan vaqt bilan o'tadi.

`SequenceClock` monotonic vaqtdan fazani hisoblaydi: paint/look uni qayta boshlamaydi; navbatdagi kadr chegarasigacha bitta timeout bor. `setActive(false)` va hujjat visibility holati soatni pauza qiladi, animatsiya/burilish/pirpirash timeoutlarini tozalaydi. Qaytganda yashirin vaqt hisoblanmaydi. Protsedural rig taymer yaratmaydi. CSS breath/step yangi animatsiya ishlaganda o'chadi; raqs avvalgidek ishlaydi.

Yangi idle faqat old neytral stand, walk faqat neytral yurishda. Happy/angry/sad/surprised/talking/sleeping va pirpirash paytida mavjud bitta poza + face-overlay; tugagach sequence davom etadi. ¾/yon, sit, ledge, sleep va boshqa pozalar saqlangan. Climb 2 eski PNG bilan 4 fps slot. Walk WebP yuklanmasa ready ishlaydi, eski walk-a fallback chiqadi (ogohlantirish konsolda).

8 WebP bir marta `createImageBitmap` orqali decode qilinadi va cache'da turadi. Temp profilli Electron'da: all birinchi 11.2 ms/qaytish0.1 ms/8decode; active birinchi11.8 ms/qaytish11.9 ms/16decode. Shuning uchun pilot uchun all tanlandi: 3.66 MiB saqlash evaziga slot almashishda qayta decode yo'q. Bu bitta lokal iliq fayl-kesh namunasi, umumiy benchmark emas. Kattaroq pack uchun active strategiyani qayta o'lchash kerak.

Qisqa nazoratli Electron namunasi (har holatda350ms kutish + 2s): renderer CPU static0.364%, idle0.276%, walk0.117%, hidden0.002%; renderer working set107.5–108.4MiB, barcha app process working set yig'indisi367.7–370.3MiB (shared xotira takror sanalishi mumkin). Bu X4/60s×3 benchmark emas, sababiy tezlik yaxshilanishi deb talqin qilinmaydi. 58 mantiq/live tekshiruv, asset-failure fallback, tabiiy walk blink,41 asset o'lcham/alfa/byudjet va npm start smoke o'tdi. Haqiqiy sichqoncha hissi/fullscreen/sleep-resume Shaxzodda.
