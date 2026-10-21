# X5 · Midori choy ichishi — faqat ko'rik uchun

**Status: Shaxzodning GIF bo'yicha tasdig'i kutiladi. Main'ga ulash mumkin emas.**
Branch: `codex/x5-midori-tea`. Production `index.html`, `chibi.js`, manifest yoki main IPC bu preview'ni import qilmaydi. `preview.html` alohida Electron oynasida ochiladi; `npm start` yangi namuna emas, oldingi tasdiqlangan slotni ochadi.

Rad etilgan 59bce30 rig'i main'da `64e86e7` bilan o'chirilgan: tea slot eski kadrga qaytgan va tea-rig script tag olib tashlangan. X5 yangi versiya/build/release/push emas.

## Rasmlar va maska chegarasi

Imagegen built-in rasm tahriri ishlatildi. Alohida maska fayli parametri unda **yo'q**; bu cheklov ish boshlanishidan oldin Shaxzodga aytildi. Shuning uchun bu API orqali haqiqiy maskali inpainting emas: rasm vositasida lokal tahrir so'raldi, so'ng `build-assets.py` faqat oldindan belgilangan qo'l/yeng/piyola/bug' maskalarini original ustiga ko'chirdi. Yangi yeng, kaft, piyola yoki bug' kodda chizilmadi. Maska tashqarisidagi RGBA original `stand.png` dan aynan saqlangan. Yuz uchun faqat mavjud face-sleeping/face-happy qatlamlaridan ko'z/og'iz hududi olindi.

`keys/K1.png`, `side.png`, `K2.png`, `K3.png`, `K4.png`, `K5.png`: 239×400, neytral original yuzli asosiy pozalar. `masks/<key>.png` — har pozaning aniq ruxsat etilgan o'zgarish hududi. Oldingi yon qo'llarni olib tashlash uchun ham maska bor; yubka, oyoqlar va boshning ochiq hududi originaldan tiklanadi. Feather faqat bitta pozaning yelka tutashuviga ishlatiladi. Pozalar orasida crossfade, opacity tween yoki IK yo'q.

`K4` qo'l/piyolasi aynan K3'dan; faqat rasm vositasi yaratgan boshqa bug' fazasi qo'shilgan. K4 yelkalari ijroda 1 source px ko'tariladi. Bug'ni ajratishda yuz/ko'zning oq piksellari chiqarib tashlangan. Shaffoflik bug'ning o'z alpha kanaliga tegishli; piyola va qo'l fade bilan paydo bo'lmaydi.

`build-assets.py --sources <image_gen output directory>` asset tayyorlash vositasi; Pillow va numpy runtime dependency emas. Asl AI chiqishlari `prompts.json` da qayd etilgan Codex generated_images papkasida saqlanadi. Yakuniy ishlatiladigan PNG/maskalar shu branch ichida.

## Vaqt va asl qatlam harakati

`player.js` dagi `TEA_SIP_SECONDS = 2.4` yagona ho'plash sozlamasi. Standart jami 6.5 s:

| Bosqich | Vaqt |
|---|---:|
| K1 → piyola yon tomonda → K2 | 0.5 s |
| K2, qisqa kutish | 0.6 s |
| K2 → K3 | 0.4 s |
| K3/K4 ho'plash | 2.4 s |
| K3 → K5 | 0.4 s |
| K5, mamnun yuz | 0.7 s |
| K2 → yon → K1 | 0.6 s |
| Yakuniy K1 | 0.9 s |

Limited-animation usuli: pozalar darhol almashadi. Kod faqat PNG qatlamlarini chizadi: nafas 0–1.5 source px, original bosh maksimal 2.2°, K4 yelka 1 px. Oyoq/baseline siljimaydi. Bosh hech qachon AI qayta chizgan boshga almashtirilmaydi. Cup/hands alohida foreground bo'lib boshning oldida qoladi. K1 bosh/oxir butun original rasmning o'zi.

## Tekshiruv

- Asosiy 6 key PNG: maska tashqarisida o'zgargan piksel **0**. Face overlay va ruxsat etilgan nafas/nod render transformlari bu statik-asset auditidan alohida; GIF palitra kvantizatsiyasi bilan zero-pixel da'vosi qilinmaydi.
- Electron37 preview: real ijro 6519.7 ms, tugash true, takror true; cancel va native hide true; heartbeat to'xtadi; konsol 0 xato.
- Preview DOM pointerdown hodisasi haqiqatan o'yinni to'xtatdi; Electron oynasini hide qilish `document.hidden=true`, player stopped, visible=false; qayta show visible=true. Fizik sichqoncha gesture'i bajarilmadi.
- To'liq main/preload IPC faqat vaqtinchalik sinov oynasida: haqiqiy pet-busy 9 marta, ijro o'rtasida danceUntil kelajakda va motion=null; tugagach heartbeat to'xtagan, konsol0. Bu production activity slotiga ulash emas.
- Medium: production formula, canvas180×180, personaj176px; 2×: canvas360×360. 1.11.0 eski choy: 24 kadr/12fps/2s, boshqa sekinlashtirilgan oraliq variant emas.
- 131 olingan kadrdan tayyorlangan medium/2× GIF (77 takrorsiz GIF kadr, 6.55s) va barcha kalitning alohida 2× PNG'si Codex visualizations/2026/10/21/01a15ced-b7c7-75b3-b878-1fbc4995d032/x5-tea/ da. Sinov skript/profillar faqat Temp'da va ish oxirida tozalanadi.

GIF'ni ko'rish sifatni qabul qilish o'rnini bosmaydi. Shaxzod aniq **ha** degandan keyingina integratsiya alohida ish sifatida bajariladi. Qolgan 4 harakat bu topshiriqda o'zgarmadi.
