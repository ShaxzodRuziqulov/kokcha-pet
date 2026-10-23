# X6 · qolgan to'rtta harakat

`codex/x6-midori-tea`da alohida preview. X5 namunalari va X6 choy o'zgarmagan.
Production index/main/manifest/IPCga ulanish yo'q; versiya/build/push qilinmagan.

`preview.html`da harakatni tanlang va Qayta ko'rish tugmasini bosing. Chap X5,
o'ng X6. Stop, personajni bosish, boshqa harakatni tanlash yoki sahifani yashirish
ijroni bekor qiladi. Bu desktop petning production activity sloti emas.

`new X6Activities.ActivityPreview(canvas,name,{ratio:1,size:1,onBusy})`:
`wave`3s, `read`13s, `water`6.5s, `stretch`4.5s. Ratio1..4, size.75/1/1.3.
`ready`, `renderAt(t)`, `play()`, `cancel()`, `setVisible()` APIlari bor.

Yangi rasm generatsiyasi kerak bo'lmadi. X6 choyning oldindan AI bilan to'ldirilgan
bo'yin/yoqa/yelka/torso/sclera qatlamlari va original bosh/soch/yuz/iris ishlatildi.
Qolgan qo'l/buyumlar X5ning ko'rilgan rastrlaridir; kitobda P1 tuzatilgan yenglar.
Anatomiya yoki kontur kodda chizilmagan. `scripts/x6-activities/prepare.py`
239x400 choy qatlamlarini399x400ga x80da joylaydi va original osilgan qo'llarni
chap/o'ngga ajratadi. Manbalar `scripts/x6-activities/provenance.json`da.

Gavda bel199.5/251dan, bosh bo'yin199.5/184dan aylanadi. Qo'l/buyum gavdaning
child matritsasida. Bosh/ko'z/yuz bitta transform;20ta asl iris gaze keshi sclera
ichida clip qilinadi. Orqa soch diagonal original maska/8px overlap bilan100ms
kechikadi. Ko'z/head anticipation, tana nafas/sway, shoulder va qo'lning boshlanishi
bir necha bosqichga surilgan; curve hammasida bir xil emas. Yubka va oyoqlar
son tayanchida qoladi. Yangi torso scale<=3%, head<=10°, body<=4°.

X5ning tasdiqlangan gesture geometriyasi saqlangan: wave yengi.85..1 va stretch
yenglari.58..1 masshtablanadi. Bu avvalgi qo'l yoyilishi, yangi torso3%limitiga
aralashtirilmaydi. Yangi yeng cho'zish patch'i/skew yo'q. Read/water qo'llari1:1.

Wave: gavda va bosh silkitishga ergashadi, ko'z avval chap qo'lga qaraydi,
asosiy qismda mamnun yuz. Read: bosh kitobga egiladi, asl iris satrni kuzatadi;
ikkala page turn vaqtida kichik nod bor, kitob/kaft/page bir parentda. Water:
gavda va bosh gulga egiladi, nigoh pastga, blink davom etadi; oqimning tepasi
harakatdagi jo'mrakka, pasti o'zgarmaydigan tuproqqa bog'langan. Pot entry20pxga
qisqartirildi, yon canvasdan kesilmaydi. Stretch: gavda<=2.6%cho'ziladi,
yelka ko'tariladi, bosh biroz orqaga, yopiq ko'z va qaytishda bo'shashgan yuz.

Stand bir marta maqsad o'lchamiga chizilib1:1ko'chiriladi. Asl oyoqning x150..250
zonasi y300dan past butun device-piksel chegarasida himoyalanadi. Bu native
canvasning DPR orqali kattalashishida etak osti qatorini aralashtirmaydi; tashqaridagi
idish/qo'llar etakdan past tushganda kesilmaydi. Alpha sinovi original AA, suv
shaffofligi va sochdagi tabiiy bo'sh joylarni nuqson deb hisoblamaydi: source
alpha>=245 material yadrosi4sourcepx ichkariga olinadi, bo'yin/gavda alohida probalanadi.

Dalillar: Codex visualizations/2026/10/23/
`01a166f0-92e4-7442-8b8f-f4b80086a68e/x6-activities/`.
Har harakat papkasida X5/X6 native va2xGIF, key4xPNG, joint4xPNG, barcha
fazalar contact-sheet, haqiqiy oyna screenshotlari va adjacent/jointCSV bor.
Umumiy `render-validation.json`, `size-dpr-validation.json`, `screen-validation.json`,
`cpu-summary.json`, `lifecycle.json`, `playback.json`, `gaze.json`,
`preview-smoke.json`, `X6-CHECKS.md` tekshiruv usuli/natijalarini yozadi.

1632ta50ms runtime kadr: source material yadrosida alpha<245 soni0,
bo'yin/gavda probalari min255, original oyoq RGBA farqi0, endpointlar standga teng.
9size/DPR×544=4896fazada yangi canvas kesilishi0, oyoq farqi0 va endpointlar teng.
26ta haqiqiy BrowserWindow screenshotida ham oyoq RGB farqi0. Gaze20variantida
sclera tashqarisida iris0. Cancel/hidden/duplicate/play/heartbeat sinovlari o'tdi.
CPU X5ga nisbatan+0.035..0.325foizpunkt (+0.91..8.92%nisbiy), bir yadroga;
har activity uchun bitta yakuniy paired round. Har10xavfning qanday tekshirilgani,
aniq natijalar va o'lchov chegaralari dalillardagi X6-CHECKS.md hisobotida.
