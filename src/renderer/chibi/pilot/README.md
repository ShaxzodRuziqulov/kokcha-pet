# 1.8.0 — tasdiqlangan pilot va runtime integratsiyasi

A–D kelishuvi: qatlamli idle; 8 walk kadr / 10 fps; erta GIF ko'rigi; neutral-only animatsiya, boshqa ifodalarda eski poza + overlay. d513816 review'dan keyingi 4 sifat tuzatishi 8eb8033'da. Shaxzod 'ha, integratsiya qil' degach ushbu assetlar runtime'ga ulandi. Quyidagi manba va sifat auditi 8eb8033 holatiga tegishli; runtime kontrakti va o'lchovi [../README.md](../README.md)'da.

## Manba va idle
- Original stand.png (239×400), walk-a.png va walk-b.png; boshlang'ich repo 1ecb5b9, birinchi pilot d513816.
- idle-rig.js: original rasm pastki qism/oyoq, tana, bosh va ikki soch uchiga ajratiladi. Yangi rasm generatsiyasi yo'q; draw(ctx,seconds,x,y,width,height) taymer yaratmaydi.
- Soch tip maskalari yuqorida y=146 dan yumshoq boshlanadi; boshdagi ichki kesim y=177 dan. Ichki ildiz bo'yicha ham overlap bor. Maskalarning 2.5 px blur'i faqat alfaga qo'llanadi; original rang piksellari xiralashtirilmaydi. Eski y=158 qattiq kesim va to'g'ri to'rtburchak 'patch' olib tashlandi.
- Harakat 2.5× oshirildi: nafas 0–3.5 source px, bosh ±0.015 rad, soch uchlari ±0.035 rad. 3.2 s sikl. 180 px canvasda nafasning peak siljishi taxminan 1.5 px. Yoqa overlap'i saqlandi; oyoqlar statik qatlamda.
- 5 saqlanadigan layer canvas nazariy 1 912 000 bayt (1.82 MiB); maskalar faqat konstruktor vaqtida tayyorlanadi. Runtime idle20fps, o'z taymeri yo'q. CPU/process working set integratsiyada qisqa namuna bilan o'lchandi; tafsilot yuqoridagi README'da.

## Walk manbasi va qayta ishlov
- Birinchi pilotdagi AYNI 4×2 atlas: built-in image_gen exec-66826a8c-d2f0-43c3-bc2b-2933a5e05709.png. Prompt va references walk-prompt.json'da. Yangi generatsiya, Higgsfield, video, MaoMao resurslari yo'q.
- Neytral bosh original walk-a.png'dan olinadi; y=228 da to'g'ri qirqish YO'Q. walk.json headContour soch uchlari va yoqa chizig'ini kuzatadi; Gaussian radius 1 px bilan taxminan 2–3 px yumshoq alfa o'tishi. Tana raw atlasning to'liq bo'yidan saqlanib, ayni konturdan 5 px yuqoriga siljitilgan complement mask bilan bosh/sochdan ajratiladi. Body mask butun canvas kengligini qoplaydi: eski generatsiya sochidan chetda parcha qolmaydi. Yoqa/kofta konturi overlap ichida tutashadi.
- Bosh x=14, y=2 + [2,0,-2,0,2,0,-2,0] source px. Contact 1/5 pastda, passing 3/7 yuqorida. 4 source px peak farq 176/400 masshtabda 1.76 ekran px. Tana/oyoq ko'tarilmaydi.
- 8 distinct lossless WebP, 300×400, alfa; oyoq baseline (opacity>24) hammasida y=398. Jami 540 572 bayt. Bitmap nazariy 3 840 000 bayt (3.66 MiB). Eski pilot 501 504 bayt edi.

## Tekshiruv va GIF
- Alohida Electron oynasida d513816 va yangi revision bir xil vaqt/180px ko'rinishda yonma-yon: 64 vaqt nuqtasi, 20 fps GIF, 3.2 s. Walk har ikkala variantda 10 fps. Konsol xatosi yo'q.
- Soch ildizi coverage audit: original alpha>240 maskasi 9×9 MinFilter bilan 4 px ichkariga olinadi; ROI y=148..183, x<80 yoki x>=159; rendered alpha<200 sanaladi. Eski 64 kadrda max65 (t0=11, t1.6=32), yangi hammasida0. Bu review'dagi 89 soni bilan bir xil algoritm deb ko'rsatilmaydi. Shu eroded ichki maskada yangi alpha<24 piksel ham0.
- Idle y>=310 oyoq hududi 64 kadrda aynan teng. Walk tepasi [6,4,2,4,6,4,2,4], baseline398, barcha 8 faza distinct. Kontur/yoqa/soch uchlari source va ekran o'lchamida ko'z bilan ko'rildi. JS sintaksis/git diff --check o'tdi.
- Yangi review artifactlar: Codex visualizations/2026/10/15/01a13ddf-7f4b-7ba0-b41c-5c9bd0801c9f/chibi-180-revision2/{comparison,idle,walk}.gif. Umumiy 256 rangli palitra ishlatilgan, har GIF 3200 ms. Oldingi GIF'lar chibi-180-quality papkasida saqlangan.
- Sinov script/profil/capture/metrics faqat tizim Temp'ida yaratildi va yakunda o'chirildi. Review GIF'lar foydalanuvchiga topshiriladigan saqlanadigan artifactlar.

## Holat
Sequence, neutral-only fallback, CSS takroriy harakatini o'chirish, yashirilganda pauza va bir martalik decode integratsiya qilindi. Claude review va Shaxzodning jonli ilovadagi bahosi kutiladi. Versiya/build/push/release alohida ruxsat bilan.
