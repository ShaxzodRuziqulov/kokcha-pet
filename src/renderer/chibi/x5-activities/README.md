# Midori · X5 qolgan to'rtta harakat

Ko'rikka tayyor, `codex/x5-midori-tea` branch'ida. Shaxzod 2026-10-22 qolgan
harakatlarni ham boshlash va tugatishni so'radi. **Main integratsiyasi hali yo'q.**
Production index, chibi.js, manifest, IPC va o'rnatilgan EXE o'zgartirilmagan.
Choyning oldingi P1 tuzatishlari saqlanadi. Versiya/build/push/release yo'q.

| Harakat | Jami | Asosiy qism |
|---|---:|---|
| Qo'l silkitish | 3 s | 2 s davomida 3 marta silkitadi |
| Kitob o'qish | 13 s | 11.5 s o'qish, 2 sahifa almashishi, nigoh satr bo'ylab yuradi |
| Gul sug'orish | 6.5 s | 4.9 s oqim, oqayotgan rastr tomchilar, gul tebranishi |
| Cho'zilish | 4.5 s | Qo'llar ko'tariladi, tepada aynan 1 s turadi, tushadi |

`preview.html`ni brauzerda ochish mumkin: harakatni tanlang, Qayta ko'rish yoki
To'xtatish tugmasidan foydalaning. Personajni bosish va sahifani yashirish ham
ijroni bekor qiladi. Bu sahifa ishlab turgan desktop petning activity sloti emas.

## Rasmlar

Built-in `image_gen` ishlatildi, CLI/API kaliti ishlatilmadi. Vosita alohida
maska inputini olmaydi; promptdagi lokal tahrirdan keyin Pillow/numpy bilan
feather maskali compositing qilindi. Kodda yangi yeng, qo'l, kitob, sahifa, suv
yoki gul chizilmadi. 4 asosiy poza, sahifa varianti va 2 to'liq qo'l komponenti
uchun jami 7 rasm tahriri ishlatildi. Xom natijalarning fayl nomlari va aniq
promptlar `scripts/x5-activities/prompts.json`da.

`keys/`dagi yakuniy PNGlar 399×400. Original 239×400 `stand.png` x80ga joylandi;
qo'llar uchun yonlarida shaffof joy bor. Ekranda canvas180×180, asl bo'y176px
bo'lib qoladi. Bosh, gavda, yubka va oyoqlar original rastrdan. Ko'z va yuz
uchun original ko'z crop'i yoki mavjud happy/sleeping overlay ishlatiladi.
Tayyorlash skripti, promptlar va maskalar `scripts/x5-activities/`
ichida, `src/**/*` packaging ro'yxatidan tashqarida.

`prepare.py --sources <Codex generated_images papkasi>` qayta tayyorlaydi va
auditni stdout'ga chiqaradi. Hisobot final ko'rik dalillari yonida saqlangan.
Statik `*-key.png`larda maska tashqarisidagi RGBA farqi0; oyoqlar aynan teng.
Bu audit statik kompozitga tegishli: runtime qatlamlar nafas/qo'l harakati/yuz
bilan siljiydi. Rastr qatlam harakati pozalar orasidagi opacity/crossfade emas.

## Player

To'liq qo'l komponentlarida soch ortida yashirin yeng ham bor. Ular avval
buriladi, keyin original bosh/gavda ustidan chiziladi. Soch maskasini qo'lga
avval qo'llash yengni kesib, qo'l tushganda uzilish berishi aniqlandi va tuzatildi.
Cho'zilishda rastr qo'llar yelkaga nisbatan ochiladi; tepada to'liq o'lchamda.
Tana bitta uzluksiz qatlam, y398ga tayangan, y300da bo'linmaydi. Nafas0–1.1
sourcepx. Boshning original burchagi saqlanadi: sun'iy yelka to'ldirish patch'i
yo'q. Yoqa va o'qish yenglari original rastr bilan overlap qiladi.

O'qishda kitob qo'lda tez ko'tarilib, oxirida tushadi. Sahifa bitta rasm
vositasi yaratgan raster leaf; markaziy buklamaga nisbatan ochilib yopiladi.
Nigoh asl ko'z crop'i orqali chapdan o'ngga, so'ng satr boshiga qaytadi;
mavjud sleeping overlay bilan qisqa blink bor.

Sug'orishda tuvak o'ngdan kirib chiqadi, gul tuproq nuqtasiga tayangan holda
tebranadi. AI chizgan oq tomchi qatlamlari mavjud oqim alpha'si ichida pastga
siljiydi; oqimning yuqori nuqtasi idishning nafas siljishiga bog'langan.
Qo'l/buyumlar fade bilan paydo bo'lmaydi.

`play()` 20fps soati va 750ms intervalda1500ms `onBusy` bilan ishlaydi.
Tugash, cancel, pointerdown, visibilitychange intervalni tozalaydi. Bir vaqtning
o'zida shu playerning ikkinchi ijrosi boshlanmaydi. Asosiy ilovaga ulanayotganda
production activity/drag/hidden lifecycle'iga alohida ulash va review kerak.

## Tekshiruv va ko'rik dalillari

### 2026-10-23: kitob va cho'zilish P1

`prepare.py`dan keyin `repair-p1.py --sources <01a166f0 generated_images>`
ishlatiladi. Ikki yangi AI tahriri va aniq promptlar `p1-prompts.json`da.
Kitobning to'liq yeng/qo'l komponenti tabiiy alpha konturida ajratildi va
1.2px feather maska bilan olinadi; katta chiqqan komponent kitob tayanchlariga
qayta joylandi. To'rtburchak yeng crop'lari olib tashlandi. Qo'llar gavdadan
keyin, original yoqa/sochdan avval chiziladi. Yubka cheti kitob qatlamiga kirmaydi.

O'qish va cho'zilish gavdalarining yon konturi AI rastrdan; kontur kodda
chizilmaydi. Original yoqa va yubka/oyoqlar qayta yopishtiriladi. Eski yengga
tegib turgan yubka yuqorisi asl rastr konturi bo'yicha ajratiladi; y295dan
past original to'liq saqlanadi. Shu sabab etak ostidagi ilk teri qatorlari ham
kesilmaydi. Qolgan ikki harakat va choy o'zgartirilmagan.

Yangi dalillar: Codex visualizations/2026/10/23/
`01a166f0-92e4-7442-8b8f-f4b80086a68e/x5-p1/`.
`{read,stretch}-before-after-{native,2x}.gif` va
`*-details-before-after-4x.png`, `read-both-page-turns-before-after-4x.png`.
Chapda shu tuzatishdan avvalgi player, o'ngda keyingi. Electron37 player.js
ratio1/2/4dan har50ms: o'qish261 va cho'zilish91faza har ratio uchun.
4x etakROI barcha352fazada min alpha250, alpha<245 soni0; baseline716.
Talab qilingan vaqtlar, ikkala varaq aylanishi va barcha fazalar ko'z bilan
tekshirildi. Quyidagi eski dalillar avvalgi ko'rik tarixidir.

Electron37 player.js'dan har50ms native ratio1/2/4 chiqish olindi: wave61,
read261, water131, stretch91 — jami544faza. GIFning yangi180/360canvas kadrlari
alohida chizilgan; 4×PNGni shunchaki kichraytirish emas. Eski taqqoslash
1.11.0dagi12fps wave1.333s va qolganlari2s, hozirgi6fps slot emas.

Barcha544fazada hemROI x326/y539/68×10 ichida alpha<245 soni0, min250;
original rastrning o'z alpha'si250–253. Oyoq baseline716..716. Kalit kirish,
asosiy va chiqish pozalari, ikkala sahifa varianti 4× tasvirlarda ko'rildi.
Play/repeat/cancel, pointerdown va hide/show o'tdi; konsolerror0.

Haqiqiy main.js + preload faqat alohida Temp profil/preview oynasida tekshirildi:
13s o'qish paytida18 pet-busy, o'rtada motion=null va himoya>0; oxirida
heartbeat to'xtagan va himoya muddati o'tgan. Native hide bekor qildi, show
visible holatini tikladi. Sinov oynasida backgroundThrottling=false bilan
visibility yashirin bo'lmagani uchun native hide tekshiruvida standart truega
qaytarildi. Fizik sichqoncha, OS sleep, CPU/RAM benchmark qilinmadi.

Dalillar: Codex visualizations/2026/10/21/
`01a15ced-b7c7-75b3-b878-1fbc4995d032/x5-activities/`:
`{wave,read,water,stretch}-comparison-{medium,2x}.gif`,
`*-details-4x.png`, `*-<time>s-4x.png`, `key-poses-4x.png`,
`render-validation.json`. Shaxzodning ko'rinish bo'yicha bahosi kutiladi.
