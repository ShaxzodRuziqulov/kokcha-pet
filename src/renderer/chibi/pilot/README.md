# 1.8.0 — sifat sinovi, integratsiya qilinmagan

Shaxzod va Claude bilan A–D kelishilgan: qatlamli idle; avval 8 walk kadr / 10 fps; GIF bilan erta qaror; neutral-only animatsiya, boshqa ifodalarda eski poza + overlay. C bandi bo'yicha foydalanuvchi bahosi kutiladi. Runtime chibi.js/manifest/CSS/renderer o'zgarmagan.

## Manba va usul
- Original manbalar: frames/stand.png (239×400), walk-a.png va walk-b.png; repo boshlang'ich holati 1ecb5b9 (1.7.0).
- Idle: idle-rig.js original stand.png'ni canvas'da pastki qism/oyoq, tana, bosh, chap va o'ng soch uchlariga ajratadi. 3.2 s sikl; nafas 0–1.4 source px, bosh ±0.006 rad, uchlar ±0.014 rad. Yoqa/ildiz overlaplari yoriqlarni yopadi. Original rasm qayta chizilmagan. Ushbu modul taymer boshlamaydi; draw(ctx, seconds, x, y, width, height) qabul qiladi. Runtime'ga ulanmaguncha normal ilova uni yuklamaydi.
- Walk: built-in image_gen'da 4×2 sakkiz fazali atlas. Aniq prompt va uch reference walk-prompt.json'da. Generatsiya exec-66826a8c-d2f0-43c3-bc2b-2933a5e05709.png; raw nusxa Codex generated_images'da qolgan, buildga kiritilmagan. Higgsfield, video va MaoMao resurslari ishlatilmagan.
- Generatsiyada bosh/soch biroz farqlangani uchun barcha kadrda ORIGINAL walk-a.png'dan aynan bir xil neytral bosh ishlatilgan: crop (0,0,271,228), o'lcham o'zgarmasdan (14,2) da. Yangi atlasdagi tana/qo'l/oyoq fazalari qoldirilgan (384×512 katakdan y=288 dan past). Tana 300×174 qilib, (0,224) da; yoqa overlap bilan. Bu crossfade yoki takrorlangan kadrlar emas; 8 tana fazasi alohida.
- Natija: 8 lossless WebP + alfa, har biri 300×400; opacity>24 bo'yicha tayanch chiziq y=398. Jami 501 504 bayt. Walk bitmaplari nazariy 3 840 000 bayt (3.66 MiB). Idle 5 vaqtinchalik canvas uchun nazariy 1 912 000 bayt (1.82 MiB); GPU/renderer overhead bu hisobga kirmaydi. Idle uchun qo'shimcha rasm fayli yo'q.

## Sifat ko'rigi
- Alohida Electron oynasida old idle/qatlamli idle va eski 2 kadrli yurish/yangi 8 kadrli yurish yonma-yon chizildi. 64 render kadr, 20 fps GIF, 3.2 s idle sikl; walk 10 fps. Qadam ko'rsatkichi GIF'da bor. Eski walk haqiqiy 4 fps, yangi 10 fps — taqqoslashda bir xil ekran masshtabi va tayanch chiziq.
- 8 fazaning pixel hash'i turlicha; yuqori neytral boshning ko'rinadigan piksellari hammasida aynan teng; barcha oyoq baseline teng; idle oyoq hududi 64 kadrda o'zgarmaydi. WebP'ning to'liq shaffof piksellaridagi ko'rinmas RGB kodlash farqlari bahoga kiritilmagan.
- Electron konsoli toza. Siluet/yoqa/idle fazalaridan suratlar ko'z bilan tekshirildi. CPU/RAM benchmark va lazy/all-decode tanlovi hali bajarilmagan — C sifat qaroridan keyingi integratsiya bosqichi.
- Yakuniy review GIF'lar Codex visualizations/2026/10/15/01a13ddf-7f4b-7ba0-b41c-5c9bd0801c9f/chibi-180-quality/ ichida: comparison.gif, idle.gif, walk.gif. Ular foydalanuvchiga topshiriladigan review artifactlari; vaqtinchalik test script/profil/capture PNG'lari tizim Temp'ida bo'ldi va o'chirildi.

## Keyingi qadam — faqat C tasdig'idan keyin
Qabul qilingan assetlarni runtime slots'ga ulash, neutral-only fallback, CSS ikki marta harakatini o'chirish, yashirilganda timer to'xtashi va decode strategiyasini o'lchash. Mavjud ifodalar/pozalar uchun regressiya sinovi. Bu sifat sinovi 1.8.0 tayyor degani emas.
