# X6 · Butun tana bilan choy

Faqat alohida preview. `codex/x6-midori-tea`; production index/main/manifestga
ulanmagan. Boshqa to'rt harakat hamda X5 namunalari o'zgarmagan.

`preview.html` X5 va X6ni yonma-yon ko'rsatadi. Qayta ko'rish6.5s, canvas180px,
personaj bo'yi176px. Bosish, Stop va yashirish cancel qiladi.
`new X6Tea.TeaPreview(canvas,{ratio:1,size:1,onBusy})`; ratio1..4, size.75/1/1.3.

Rastr manbalari: original stand/bosh/soch/yuz/iris/yubka/oyoqlar, X5 yeng
pozalari va bug'i. Yashirin bo'yin/yoqa/yelka, bo'sh sclera va toza piyola/kaft/
manjet uchun3ta built-in image_gen tahriri ishlatilgan. Kod yangi anatomiya yoki
kontur chizmaydi. Tayyorlash: `scripts/x6-tea/prepare.py --sources <generated_images>`;
aniq promptlar va tayanchlarni qayta joylash `scripts/x6-tea/prompts.json`da.
Asbob/maskalar `src`dan tashqarida.

Bosh markazi bo'yin119.5/184da, gavda bel119.5/251da. Yuz ifodasi bosh bitmapiga
oldindan birlashtiriladi; alohida yuz transformi yo'q. Qorachiq asl rastrdan,
13ta sclera ichida clip qilingan nigoh keshi. Orqa sochlar100ms kechikadi;
diagonal ildiz chegaralari8px overlap bilan asl old soch ortida yashirinadi.
Bo'yin va yelkadagi ochilishlar AI ost-qatlam bilan to'ldiriladi.

Gavda va yenglar parent-child matritsada. Ho'plashda cup-rim y167 manba nuqtasi
asl pastki lab y164ga inverse-parent orqali qulflanadi. Piyola/kaft/manjet bitta
rastr komponenti, qo'shimcha chizilgan patch yoki cho'zilgan yeng yo'q.
Ko'z.035sdan, bosh/gavda tayyorlanishi.07sdan, qo'l.15sdan; ho'plashga bosh1.1s,
yelka1.2s, yangi qo'l kaliti1.22sda ergashadi. Gavda va bosh turli egri chiziqda;
nafas, oldindan tayyorlanish, boshning mayda ortiqcha harakati va soch follow-through
birga ishlaydi. Oyoq va yubka son/bel tayanchida qoladi, yubka burmalari buzilmaydi.

Stand bir marta maqsad o'lchamidagi bitmapga chiziladi. Shu bitmap har kadrda1:1
ko'chiriladi; yuqori qatlamlar oyoqdan yuqoridagi butun device-piksel qatorida clip
qilinadi. Bu kichik o'lchamda qayta downsampling/readback yaxlitlashidan oyoq
ranglari qaltirashini va ikki alpha kesigi orasida tirqish chiqishini oldini oladi.
PNG stand asl nusxaning baytma-bayt ko'chirmasi. Alpha testida antialias chegaralari,
bug' va sochdagi tabiiy bo'sh joylar shaffof teshik deb hisoblanmaydi; manba alpha>=245
material yadrosi4sourcepx ichkariga olinadi, bo'yin/gavdada alohida uzluksiz probalar bor.

Dalillar: Codex visualizations/2026/10/23/
`01a166f0-92e4-7442-8b8f-f4b80086a68e/x6-tea/`:
`x5-x6-comparison-{native,2x}.gif`, har bosqich4xPNG, `all-stage-joints-4x.png`,
`actual-window-screen-phases.png`, `render-validation.json`,
`adjacent-motion-and-joints.csv`, `size-dpr-validation.json`, `cpu-summary.json`,
`gaze-playback.json`, `X6-CHECKS.md`.

Har50ms ratio1/2/4dagi393kadr: material alpha<245 soni0, bo'yin/gavda probasi
min255; oyoq farqi0; boshlanish/yakun native stand referensiga aynan teng.
9ta size/DPR kombinatsiyasi1179kadrda yangi canvas-chegara kesilishi0, oyoq farqi0.
Asl bitmapdagi oyoq tagining eng past qatori ayrim native o'lchamda chekkaga tegadi;
u boshlang'ich stand bilan bir xil, yangi bosh/soch kesilishi yo'q.
Boshmax8.696°, gavda1.480°, squash3%, headDown3.1sourcepx, shoulder1.7sourcepx.
Ho'plashdagi cup–mouth masofasimax1.2e-7sourcepx (float aniqligi).

CPU: bir xil Electron37 ko'rinadigan oyna,20fps, ikki yaroqli juft o'lchov:
X5 2.009%, X6 2.230% bir yadro; +.222foizpunkt, taxminan+11% nisbiy.
Render mean.122→.265ms, P95.3→.6ms. Birinchi o'lchovdagi manfiy native CPU
counter delta bekor qilingan; xom o'lchov va usul dalillarda. Bu hostdagi qisqa
taqqoslash, umumiy tizim yoki boshqa qurilmalar benchmarki emas.

6505ms haqiqiy play tugadi; duplicate/cancel/hidden/heartbeat-stop/stand-return
tekshirildi. Claude mustaqil review va Shaxzod bahosi hali kutiladi.
