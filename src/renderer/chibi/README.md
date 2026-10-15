# Chibi kadrlar

Runtime: `frames/*.png` va `frames/manifest.json` (33 PNG, jami 855 969 bayt) + kod bilan jonlantirish: `pilot/idle-rig.js` (idle), `walk-rig.js` (yurish). Yurish uchun alohida rasm fayli yo'q.

Oldingi 4 atlas Git tarixida (`8fd6fb3`, `src/renderer/chibi/`) saqlangan. Kadrlar alfa siluet komponentlari bo'yicha ajratildi: ¾ va yon ko'rinishlar qo'shni soch bo'laklarini olmaydi, o'tirish katagiga pastdagi sakrashning sochi kirmaydi. Ranglar 256 rangli RGBA PNG palitrasiga tushirilgan.

Yangi rasmlar built-in `image_gen` orqali yaratildi, keyin alfa bo'yicha qirqildi va kichraytirildi. Asos: oldingi `standing.png` (personaj identifikatsiyasi), `poses.png` (poza/uslub). Yakuniy promptlar (mazmun va cheklovlar):

- `hang.png`: ayni yashil sochli chibi, ikki qo'li tepada ko'rinmas qirrani ushlaydi, oyoqlari pastga osilgan; yog'och taxtani butunlay olib tashlash; sviter/yubka/paypoq/etik/soch va yuz izchil; bitta to'liq personaj, shaffof fon; predmet, soya, matn yo'q.
- `walk-b.png`: o'ngga qaragan ayni personaj, yurishning o'tish qadami; oyoqlar bir-biriga yaqin, biri tekis pastga tayangan, ikkinchisining tizzasi bukilgan va tovoni boldir ortiga ko'tarilgan; old qo'l yoniga tushirilgan; bosh, soch, yuz, kiyim va uslub saqlanadi; shaffof fon, to'liq bitta personaj. Dastlabki keng qadam varianti ishlatilmaydi.
- `ledge.png`: o'ng ¾ ko'rinish, ko'rinmas qirrada o'tirgan ayni personaj; kaftlar ikki yonida, sonlar gorizontal, tizzalar birga, boldirlar va etiklar vertikal pastga osilgan; tagcharm kameraga qaramaydi; stol, qirra, taxta, soya yoki matn chizilmaydi; shaffof fon.

Animatsiya: qatlamli idle 12 fps, cutout yurish (`walk-rig.js`) 20 fps (1 s sikl), climb 4 fps; 3.2–6 s oralig'ida 135 ms pirpirash; burilishda 95 ms oraliqdagi old/¾/yon kadrlar; kursor uchun 300/190 va 1050/880 px histerezis. Boshqa personaj yoki yashirin hujjatda taymerlar to'xtatiladi. Qizcha 180 px. Qirrada yangi kadrning oyoqlari uchun 46 px pastga siljish.

## Yurish — cutout (joriy, Claude)

Shaxzod uch variantni (eski 2 kadr, Codex 12 kadr, Claude cutout) jonli solishtirib, cutout'ni tanladi. `walk-rig.js` faqat asl `walk-a.png` / `walk-b.png` piksellaridan foydalanadi:
- Ustki qism (bosh, gavda, yubka) doim walk-a — bosh/tana nomuvofiqligi bo'lmaydi.
- Oyoqlar: yerga tegish fazasida walk-a, oraliqda walk-b (B_DX=-4). Oyoqlar yerda qoladi; tana `12·sin²` bilan ko'tariladi, son yuqorisi yubka ostiga cho'zilgan (bo'shliq ochilmaydi).
- Qo'llar ±0.09 rad siltanadi; tanadan faqat fon ustidagi yeng o'chiriladi, orqa yeng ostiga yubka rangidagi taglik.
- Blink: `blinkPatches['walk-a']` tana transformida chiziladi. Manifest: `slots.walk = { frames: ['walk-a'], procedural: 'walk', fps: 20, duration: 1 }`.
- Cheklov: oyoq uchun asl rasmda faqat 2 poza — oyoqlar siklda 4 marta almashadi (tana/qo'llar silliq).

## Tarix: 12 kadrli kod-oyoq yurishi (olib tashlangan)

Oldingi 8 kadrli atlasda oyoq fazalari takrorlangan, qo'l/kofta/yubka shakli kadrlar orasida keskin o'zgargan. Shaxzod yurishni tuzatishni topshirdi. Yangi built-in image_gen atlasida ham fazalar takrorlandi; u rad etildi va runtime'ga kiritilmadi. Prompt va qaror `pilot/walk-prompt.json` da.

Yakuniy 12 kadr `scripts/build-chibi-walk.py` orqali oldindan yig'iladi (faqat asset tayyorlashda Pillow kerak). Bosh, soch, yuz, kofta, qo'llar va yubka original `walk-a.png` piksellari; pastki tana ikki bo'g'imli kod rig'i, yumaloq tizza, paypoq va etik bilan chiziladi. Qo'llar bu siklda asl pozada qoladi; to'liq yangi qo'l animatsiyasi da'vo qilinmaydi. Bu AI video yoki yangi generatsiya kadrlari emas.

Yaqin va uzoq oyoq fazalari yarim sikl farq qiladi; chizish tartibi far → near → original tana. Har kadrda bitta tayanch oyoq, max alfa>24 baseline398. Tayanch oyoq 50ms da12 source px orqaga yuradi: 180px runtime masshtabida98.4DIP/s, main yurishi100DIP/s ga yaqin. Ko'tarilgan oyoq24px yoy bo'ylab oldinga qaytadi; bosh/tana bob[2,1,0,-1,0,1] ikki marta. Blink anchor x14/y(2+bob); nafas, ifoda fallback va soat kodi saqlandi.

12 lossless WebP300×400 jami363488bayt, decode5.49MiB (oldingi8kadrga nisbatan+1.83MiB). Umumiy45asset1.22MB. Yangi runtime taymeri yoki piksel skaneri qo'shilmadi. Yurish fps10→20: CPU qayta o'lchanmadi, tezlashish da'vosi yo'q; quyidagi CPU jadvali eski10fps yurish holatiga tegishli.

Tekshiruv: haqiqiy Electron'da har yo'nalishda12distinct faza (24capture), baseline/bounds va tayanch oyoq tezligi auditi, bob tekislanganda bosh/kofta piksellari aynan teng. Haqiqiy blink146ms davomida06→07→08walk fazalari davom etdi; ko'zdan past tasvir ayni fazadagi ochiq ko'zga teng. Idle/climb/sleep,6ifoda fallback, deactivate'da canvas muzlashi va konsol0xato. Asosiy ilova main/preload/renderer bilan Temp profilda ochildi, main→renderer o'ng/chap walkslot o'tdi. Installed EXE/build/push/release va jismoniy drag/fullscreen/OS sleep-resume tekshirilmadi. Review GIF'lari Codex visualizations/.../walk-fix/{comparison,walking}.gif; sinov skript/profil/capturelar Temp'da yaratilib o'chirildi.

Quyidagi 8 kadrli pilot va uning o'lchovlari tarixiy ma'lumotdir.

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

Yangi idle faqat old neytral stand, walk faqat neytral yurishda. Happy/angry/sad/surprised/talking/sleeping paytida mavjud bitta poza + face-overlay; tugagach sequence davom etadi. Tabiiy pirpirash sequence'ni to'xtatmaydi: quyidagi B yo'li tuzatishi. ¾/yon, sit, ledge, sleep va boshqa pozalar saqlangan. Climb 2 eski PNG bilan 4 fps slot. Walk WebP yuklanmasa ready ishlaydi, eski walk-a fallback chiqadi (ogohlantirish konsolda).

8 WebP bir marta `createImageBitmap` orqali decode qilinadi va cache'da turadi. Temp profilli Electron'da: all birinchi 11.2 ms/qaytish0.1 ms/8decode; active birinchi11.8 ms/qaytish11.9 ms/16decode. Shuning uchun pilot uchun all tanlandi: 3.66 MiB saqlash evaziga slot almashishda qayta decode yo'q. Bu bitta lokal iliq fayl-kesh namunasi, umumiy benchmark emas. Kattaroq pack uchun active strategiyani qayta o'lchash kerak.

935ee60 dagi qisqa nazoratli Electron namunasi (har holatda350ms kutish + 2s): renderer CPU static0.364%, idle0.276%, walk0.117%, hidden0.002%; renderer working set107.5–108.4MiB, barcha app process working set yig'indisi367.7–370.3MiB (shared xotira takror sanalishi mumkin). Bu X4/60s×3 benchmark emas, sababiy tezlik yaxshilanishi deb talqin qilinmaydi. 58 mantiq/live tekshiruv, asset-failure fallback, tabiiy walk blink,41 asset o'lcham/alfa/byudjet va npm start smoke o'tdi. Haqiqiy sichqoncha hissi/fullscreen/sleep-resume Shaxzodda.

## B yo'li: uzluksiz blink, 12 fps idle

Tabiiy blink slot tanlashdan ajratildi; clock soati, yurish fazasi, procedural nafas/bosh/soch harakati 135 ms davomida ham ishlaydi. `dataset.blink` sequence ichidagi yopiq ko'zni bildiradi; `expression` neytral bo'lib qoladi. Boshqa ifodalar va sequence'siz pozalarning mavjud face-overlay yo'li saqlangan.

Ikki kichik ko'z patch'i ishga tushishda canvas'da bir marta tayyorlanadi: original stand va walk-a koordinatalaridagi ko'z maskalari, 0.6px feather, original teri palitrasidan ranglar (#fbe3d2 / #fbe2d4), yopiq qovoq va kiprik Bezier chiziqlari. Soch, og'iz va butun bosh almashtirilmaydi. Rig patch'ni boshning ayni translate/rotate transformida, soch uchlaridan oldin chizadi. Har walk kadridagi `blink:{source:"walk-a",x:14,y:2+headBobPx}` kanonik bosh joyini ko'rsatadi; chapga akslantirish tanaga birga qo'llanadi. Rasm generatsiyasi yoki yangi raster asset yo'q, runtime piksel skaneri yo'q. Ikki doimiy patch canvas nazariy qo'shimcha 816000 bayt (0.78MiB); mask canvaslari vaqtinchalik.

Idle 20 → 12 fps, sikl 3.2s va harakat amplitudalari saqlandi; walk 10fps. Deterministik Electron sinovi: 66 tekshiruv; 12 idle fazasi va har yo'nalishdagi 8 walk fazasida open/closed ayni kadr/slot, blink ichida yurish davomi, 6 ifoda fallback va inactive blink bekor bo'lishi. 28 pixel juftlikda o'zgarish faqat yuzdagi ko'z hududida, canvas y>=140'da o'zgarish0, yangi alfa yorig'i0; 8 walk faza ikkala yo'nalishda ham ko'rildi. Idle/walk yopiq ko'z screenshotlari ko'z bilan tekshirildi. Bu audit 270×270 backing canvas (180CSS px, DPR1.5) uchun.

Haqiqiy taymerli Electron sinovi (performance/timer almashtirilmagan): idle blink137.6ms, walk135.2ms, birorta kuzatilgan hodisada slot yo'qolmadi. Walk ko'z yumuq holda walk-seq-01→02→03 o'tdi; konsol xatosi0. Har holatdan4.1s/68 canvas capture; review GIF'lari `Codex visualizations/.../chibi-blink-b/{idle,walk}.gif`, real capture vaqt oralig'i GIF10ms chegarasigacha yaxlitlangan, umumiy4.1s. Preview fonida kulrang matte, ilovaning o'z canvasi shaffof. Sinov script/profil/capture/reportlar Temp'da yaratildi va yakunda tozalandi.

CPU: haqiqiy `npm start`, har variantga yangi Temp profil; qizcha old/neytral idle, autoWalk/climb o'chirilgan, quiet=true, cursor/hover IPC sinov jarayonida filtrlangan. Fidget qayta rejalash to'xtatilgan; avvaldan qo'yilgan birinchi fidget faqat `glance` bo'lishi uchun random=.99. 5s warm-up, keyin ketma-ket30s×2; har5s canvas holati tekshirildi, barcha namunada oyna ko'rinardi. Oldingi935ee60 jarayoni fayllar tahriridan oldin yuklangan, o'lchovda qayta yuklanmagan. Yangi variant alohida ishga tushirilgan.

| Variant | Jami CPU, 1 / 2 | Renderer, 1 / 2 | GPU process CPU, 1 / 2 |
|---|---|---|---|
| 935ee60, idle20fps | 10.507% / 10.623% | 3.485% / 3.583% | 5.452% / 5.812% |
| B, idle12fps + uzluksiz blink | 7.272% / 7.305% | 2.276% / 2.320% | 3.525% / 3.615% |

Formula: har process uchun `100 * delta(cumulativeCPUUsage seconds) / elapsed seconds`, jami Browser/Tab/GPU/Utility yig'indisi. 100% bitta mantiqiy yadro; bu mashinada16ta, Task Manager butun CPU foizi uchun16ga bo'linadi. GPU ustuni GPU process'ining CPU vaqti, GPU apparat utilization'i emas. Jami o'rtacha10.565 → 7.289% (~31% pasayish); bu ikki lokal namuna, universal kafolat yoki X4/60s×3 emas. App working set yig'indisi oldin450.6/452.4MiB, keyin455.2/440.1MiB; shared xotira takror sanalishi mumkin, RAM kamayishi isbotlanmadi. Renderer/GPU alohida qayd etildi; sinovda jismoniy sudrash/fullscreen/OS sleep-resume bajarilmadi.
