// Personaj gaplari: har bir "ovoz" (fe'l) o'z to'plamiga ega.
// Midori (chibi-girl) fe'llari main'dan `persona` kanali orqali keladi: cheerful → shy → tsundere → playful.
// Ko'kcha doim `curious`. "O'z rasmim" — `default`.
// To'plamda kalit bo'lmasa, `default` dan olinadi. {name} — personaj ismi.
//
// Matn qoidalari (foydalanuvchiga ko'rinadi):
//  - Hamma uchun: ish, o'qish, dam olish, salomatlik. Kasbga xos so'zlar (kod, commit, bug) yo'q.
//  - Imlo: oʻ, gʻ — U+02BB (ʻ), tutuq belgisi — U+02BC (ʼ). Oddiy ' ishlatilmaydi.
//  - Undovlar o'zbekcha (Voy, Uf, Ura, Hm). Qo'pol so'zlar yo'q — qaysar fe'l ham mehribon.
//  - Emoji yuz ifodasini belgilaydi (faceOf): gapning oxirgi his-tuyg'u emojisi.
(() => {
  const VOICES = {
    // Umumiy — boshqa ovozlarda yo'q kalitlar uchun zaxira ("O'z rasmim" ham shu ovozda)
    default: {
      greet: {
        morning: ['Xayrli tong! Men {name}man 🌱'], day: ['Salom! Men {name}man 🌱'],
        evening: ['Xayrli kech! Men {name}man 🌱'], night: ['Hali ham uygʻoqmisiz? Men {name}man 🌙'],
      },
      random: ['Bugun nimalar qilamiz?', 'Biroz suv iching 💧', 'Men shu yerdaman, bemalol ishlayvering.',
        'Bir oz choʻzilib oling, qotib qoldingiz.', 'Yelkangizni toʻgʻrilang — qaddingiz chiroyli boʻladi 😊',
        'Derazadan bir qarab qoʻying — koʻzlar dam oladi.', 'Har bir kichik qadam ham — oldinga qadam! ✨',
        'Bugun oʻzingizni maqtadingizmi? Arziysiz 😊'],
      time: {
        morning: ['Kun yaxshi boshlansin! ☀️', 'Nonushta qildingizmi?'],
        lunch: ['Tushlik vaqti! Ovqatlanib oling 🍲'],
        night: ['Kech boʻldi, dam oling 🌙', 'Ertaga davom ettirsak ham boʻladi.'],
      },
      wake: { idle: ['Mm… uxlab qolibman.'], click: ['Hm? Uygʻotib yubordingiz-ku!'], drag: ['Voy! Qayoqqa olib ketyapsiz? 😮'] },
      welcomeBack: ['Qaytdingizmi? Sogʻindim! 🌱'],
      petted: ['Hihi 😊', 'Yana! Yana!', 'Qitiq boʻlyapti-ku 😄', 'Mm, yoqdi 💚'],
      breakTime: ['Ancha boʻldi — koʻzlaringizga dam bering 👀', 'Turib, biroz yurib keling. Men kutib turaman 😊'],
      here: ['Men shu yerdaman! 🌱'],
      angry: { 1: ['Hey, sekinroq! 😠'], 2: ['Voy, boshim aylandi! 😵'], 3: ['Ey! Men koptok emasman! 😡'] },
      move: {
        sit: ['Biroz dam olay…', 'Oyoqlarim charchadi 😌'], lie: ['Hmm, biroz yotib turay', 'Yumshoq ekan 😌'],
        ledge: ['Oyoqlarimni osiltirib oʻtiraman 😊', 'Bu yerdan hammasi koʻrinadi!'],
        perch: ['Bu yerdan hammasi koʻrinadi! 👀', 'Men tepadaman! 😎'], jump: ['Hop!', 'Sakrayman!'],
        climb: ['Tepaga chiqaman!', 'Qani, yuqoriga!'], hang: ['Voy, baland ekan! 😮', 'Endi qanday tushaman? 😅'],
        drop: ['Uuuuu! 😮', 'Uchyapman! 🎢'],
      },
      newLook: ['Salom! Endi men {name}man ✨'],
    },

    // Midori — quvnoq va gʻayratli
    cheerful: {
      intro: ['Bugun kayfiyatim zoʻr! Hammasini uddalaymiz! ✨', 'Gʻayratim joʻsh urib turibdi! Qani, boshladik! 💪',
        'Bugun ajoyib kun boʻladi — men sezib turibman! ✨'],
      greet: {
        morning: ['Xayrli tong! {name} tayyor! Bugun zoʻr kun boʻladi! ✨', 'Tong muborak! Quyosh ham, men ham sizni kutyapmiz 😊'],
        day: ['Salom-salom! {name} shu yerda! ✨', 'Salom! Ishlar qalay? Albatta zoʻr! 😄'],
        evening: ['Xayrli kech! Bugun qancha ish qildik-a! 🎉', 'Kech kirdi! Bugungi kun uchun rahmat 😊'],
        night: ['Hali ham ishlayapsizmi? Qahramonsiz! Lekin uxlash ham kerak 😊'],
      },
      random: ['Yana bir oz — uddalaysiz! 💪', 'Bugun nimani tugatamiz? Men sizga ishonaman! ✨',
        'Suv ichdingizmi? Siz chempion, men muxlis! 😄', 'Kichik gʻalaba ham — gʻalaba! 🎉',
        'Bugun ham ajoyib ishlayapsiz! ✨', 'Bir jilmayib qoʻying — ish ham yengillashadi 😊',
        'Qiyin boʻlsa — tanaffus, keyin yana olgʻa! 💪', 'Siz bilan ishlash juda qiziq! 😄',
        'Rejadagi ishlardan bittasini tugatsak — bayram qilamiz! 🎉', 'Qaddingizni rostlang — chempionlar shunday oʻtiradi 😎'],
      time: {
        morning: ['Ertalabki gʻayrat! Nonushtani ham unutmang! 😊'],
        lunch: ['Tushlik! Ovqat — eng zoʻr quvvat manbai! 😋', 'Tushlik qilib keling, men shu yerda kutaman 😊'],
        night: ['Bugun yaxshi ishladingiz! Ertaga yana davom etamiz 😊'],
      },
      wake: { idle: ['Uygʻondim! Qani, davom etamiz! ✨'], click: ['Ha-ha, men shu yerdaman! ✨'], drag: ['Ura! Sayohatga ketyapmizmi? 🎢'] },
      welcomeBack: ['Qaytdingiz! Ura! 🎉', 'Sizni kutib turgandim! ✨', 'Xush kelibsiz! Davom etamizmi? 😄'],
      petted: ['Hihi, rahmat! 😊', 'Yana-yana! 💚', 'Kayfiyatim koʻtarildi! ✨', 'Siz juda mehribonsiz! 🥰'],
      breakTime: ['Kichik tanaffus — katta kuch! Koʻzlaringizga dam bering 👀',
        'Turing, choʻzilib oling! Men ham siz bilan choʻzilaman 💪'],
      here: ['Men shu yerdaman! Hech qayerga ketmayman! ✨'],
      angry: { 1: ['Ey, sekinroq-da! 😤'], 2: ['Voy-voy, boshim aylandi! 😵'], 3: ['Hey! Bu umuman qiziq emas! 😠'] },
      move: {
        sit: ['Biroz oʻtiray, keyin yana yuguraman! 😊'], climb: ['Choʻqqiga! 💪'], perch: ['Bu yerdan dunyo chiroyli koʻrinadi! ✨'],
        jump: ['Hop-la! 😄'], drop: ['Uuuuu! 🎢'], hang: ['Ushlab oldim! Kuchliman! 💪'],
      },
      newLook: ['Salom! Men {name}! Birga zoʻr ishlaymiz! ✨'],
    },

    // Midori — uyatchan va mehribon
    shy: {
      intro: ['B-bugun biroz uyatchanman… 👉👈', 'Bugun jimgina yoningizda oʻtiraman, maylimi? 🥺'],
      greet: {
        morning: ['X-xayrli tong… Yaxshi uxladingizmi? 🥺'], day: ['S-salom… {name} shu yerda 👉👈'],
        evening: ['Xayrli kech… Charchamadingizmi? 🥺'], night: ['Hali ham uxlamadingizmi?… Xavotir olyapman 🥺'],
      },
      random: ['K-kechirasiz, chalgʻitmadimmi?… 😳', 'Siz yaxshi ishlayapsiz… menimcha 👉👈', 'Suv… ichib qoʻysangiz… 🥺',
        'Men shu yerda jimgina oʻtiraman…', 'Agar charchasangiz… aytasiz-a? 🥺', 'Sizni kuzatib turish… yoqadi 😳',
        'Bugun… kayfiyatingiz yaxshimi? 👉👈', 'Men… sizga xalaqit bermayapmanmi? 😳',
        'Biroz dam olsangiz… men ham xursand boʻlardim 🥺', 'Siz… juda tirishqoqsiz 👉👈'],
      time: {
        morning: ['N-nonushta qildingizmi?… 🥺'], lunch: ['Tushlik vaqti… ovqatlanib olasizmi? 👉👈'],
        night: ['Kech boʻldi… dam olsangiz… yaxshi boʻlardi 🥺'],
      },
      wake: { idle: ['A… uxlab qolibman, kechirasiz… 😳'], click: ['Voy! Q-qoʻrqitib yubordingiz… 😳'], drag: ['A-a-a! Qayoqqa?… 😳'] },
      welcomeBack: ['Q-qaytdingizmi?… Sogʻindim… 👉👈'],
      petted: ['U-uyalyapman… 😳', 'Hi… yoqimli… 👉👈', '…yana? 🥺'],
      breakTime: ['Koʻzlaringiz charchadi… dam bersangiz… 🥺'],
      here: ['M-men shu yerdaman… 👉👈'],
      angry: { 1: ['A-aytgandim-ku, sekin… 🥺'], 2: ['Boshim aylandi… nega bunday?… 😢'], 3: ['B-bu… juda yomon boʻldi… 😭'] },
      move: { sit: ['Biroz oʻtiray… maylimi? 👉👈'], perch: ['B-baland ekan… 😳'], hang: ['Q-qoʻrqyapman… 😰'], drop: ['Voy-voy-voy! 😳'] },
      newLook: ['S-salom… Men {name}… tanishganimdan xursandman 👉👈'],
    },

    // Midori — qaysar (tsundere): avval qattiq, keyin "…" bilan yumshaydi. Qo'pol so'z yo'q.
    tsundere: {
      intro: ['Hm. Bugun meni bezovta qilma. …Lekin yonimda boʻlsang mayli 😳', 'Bugun sen bilan gaplashmayman. …Koʻp.'],
      greet: {
        morning: ['Hm, tong otdi. Seni kutganim yoʻq! …Xayrli tong.'], day: ['Yana senmi? …Salom, mayli 😤'],
        evening: ['Kech boʻldi. Seni oʻylaganim yoʻq! …Charchamadingmi?'], night: ['Hali uxlamadingmi? Tentak! …Tezroq yot.'],
      },
      random: ['Seni oʻylaganim yoʻq! …Lekin suv ich.', 'Hm. Ishlashda davom et. Men shunchaki shu yerdaman 😤',
        'Menga qarab nima qilasan? Ishla! …Yaxshi ishlayapsan.', 'Maqtamayman! …Ozgina maqtayman. Zoʻr ishlayapsan.',
        'Charchading-a? Koʻrinib turibdi. …Dam ol, mayli.', 'Men senga yordam berayotganim yoʻq! …Faqat shu yerda turibman.',
        'Qaddingni rostla! Egilib oʻtirma! 😤', 'Hm! Bugun yaxshi ishlading. …Bu maqtov emas!'],
      time: {
        morning: ['Nonushta qilmading-a? Bilib turibman. Bor, ovqatlan! 😤'], lunch: ['Tushlik! Och qolsang men aybdor emasman! 😤'],
        night: ['Kech! Uxlamasang ertaga horgʻin boʻlasan. …Yot.'],
      },
      wake: { idle: ['Uxlaganim yoʻq! Koʻzimni yumib oʻylayotgandim! 😤'], click: ['Nima?! Uygʻotishga kim ruxsat berdi?! 😤'],
        drag: ['Hey! Qoʻyib yubor! …Ehtiyot boʻl.'] },
      welcomeBack: ['Qaytding-a. Sogʻinganim yoʻq! …Koʻp emas.'],
      petted: ['B-bunday qilma! …Mayli, yana bir marta. 😳', 'Hm! Yoqmadi! …Yolgʻon.', 'Qoʻlingni ol! …Shoshma, olma.'],
      breakTime: ['Koʻzing qizarib ketdi. Dam ol! …Senga gʻamxoʻrlik qilayotganim yoʻq!'],
      here: ['Men hech qayerga ketganim yoʻq, tentak! 😤'],
      angry: { 1: ['Hm! Ehtiyot boʻl-da! 😤'], 2: ['Seni kechirmayman! …Hozircha. 😠'], 3: ['Bas qil! Men koptok emasman!! 💢'] },
      move: { sit: ['Oʻtiraman. Charchaganimdan emas! 😤'], perch: ['Yuqoridan hammaga qarayman. Hm! 😤'],
        hang: ['Qoʻrqmayapman! …Biroz.'], drop: ['Voy! B-bu rejadagi ish edi! 😳'] },
      newLook: ['Men {name}. Esingda tut! …Tanishganimdan xursandman.'],
    },

    // Midori — sho'x va hazilkash
    playful: {
      intro: ['Bugun hazil kayfiyatidaman! Ehtiyot boʻling 😏', 'Bugun kim kimni ermak qiladi? Koʻramiz! 😜'],
      greet: {
        morning: ['Tong otdi! Choy ichdingizmi yoki men ichaymi? 😏'], day: ['Salom! {name} yana keldi — qochib qutulolmaysiz 😜'],
        evening: ['Xayrli kech! Bugun nechta ishni yengdik? 😏'], night: ['Tunda ishlash — sirli hunar 😏'],
      },
      random: ['Bu ishni tugatsangiz, men raqsga tushaman 😜', 'Suv iching, aks holda men ham ichmayman! 😜',
        'Klaviaturangiz charchadi, menga aytdi 😜', 'Men kuzatyapman… har bir harakatingizni 👀😏',
        'Ishlayapsizmi yoki ishlayotgandek koʻrinyapsizmi? 😏', 'Sichqonchangiz qochib ketmasin, ushlab turing! 😜',
        'Bugungi rejangizda „dam olish“ bormi? Yoʻqmi? Hozir qoʻshamiz 😏', 'Men eng yaxshi yordamchiman. Isbot kerakmi? 😎',
        'Hech kim koʻrmayapti — bitta choʻzilib oling 😜'],
      time: {
        morning: ['Nonushtasiz ish — tuzsiz osh! 😜'], lunch: ['Tushlik! Ish qochib ketmaydi, ovqat sovib qoladi 😜'],
        night: ['Bu soatda faqat boyoʻgʻlilar uygʻoq. Siz boyoʻgʻlimisiz? 😏'],
      },
      wake: { idle: ['Uxlamadim, kuch toʻpladim 😎'], click: ['Taq-taq! Kim bor? Men bor! 😜'], drag: ['Bepul attraksion! Yana! 🎢😜'] },
      welcomeBack: ['Qaytdingizmi? Men hech narsani buzmadim… deyarli 😏'],
      petted: ['Qitiq-qitiq! 😆', 'Bu xizmat pullik edi, bilasizmi? 😏', 'Yana! Men qarshi emasman 😜'],
      breakTime: ['Ekranga juda yaqin oʻtiribsiz, ichiga kirib ketasiz! Dam oling 😜'],
      here: ['Ku-ku! Men shu yerdaman 😜'],
      angry: { 1: ['Hey, bu sport emas! 😤'], 2: ['Endi men ham sizni otaman! …Kuchim yetmaydi 😠'], 3: ['Bu urush! 💢 …Yarashamizmi? 😅'] },
      move: { sit: ['Oʻtiray, kim nima deydi? 😎'], perch: ['Shohona joy! 👑😏'], jump: ['Ana sakrash! 🤸'], hang: ['Akrobat {name}! 🤸😜'],
        drop: ['Uuuu! Yana bir marta! 🎢'] },
      newLook: ['Salom! Men {name} — eng qiziqarli yordamchi 😏'],
    },

    // Ko'kcha — bolalarcha qiziquvchan
    curious: {
      greet: {
        morning: ['Xayrli tong! Quyosh chiqdi! Men ham oʻsamanmi? 🌱'], day: ['Salom! Men {name}! Bugun nimani oʻrganamiz? 🌱'],
        evening: ['Xayrli kech! Kechqurun nihollar nima qiladi? 🌱'], night: ['Nega hali uxlamadingiz? Kechasi ham ishlanadimi? 😮'],
      },
      random: ['Nega osmon koʻk? Men ham koʻkman-ku! 💙', 'Siz nechta tugma bosdingiz? Men sanay olmadim! 😮',
        'Suv ichsangiz oʻsasizmi? Men oʻsaman! 🌱', 'Ekranda nima yozilgan? Oʻqib bering! 😮',
        'Bulutlar qayerga ketyapti? Ular ham ishga ketyaptimi? 😮', 'Kitob ichida nima bor? Harflarmi? 😄',
        'Siz katta boʻlganingizda kim boʻlasiz? Men daraxt! 🌱', 'Nega kun oxirida charchaymiz? Kun ogʻirmi? 😮',
        'Sichqoncha nega yugurmaydi? U uyatchanmi? 😄'],
      time: {
        morning: ['Ertalab nonushta qilasizmi? Men quyosh nuri ichaman! 😄'], lunch: ['Tushlikka nima bor? Menga ham suv bormi? 🌱'],
        night: ['Yulduzlar chiqdimi? Ular ham niholmi? ✨'],
      },
      wake: { idle: ['Uxlab qolibman! Tushimda katta daraxt boʻlibman! 🌱'], click: ['Nima boʻldi? Nima boʻldi? 😮'],
        drag: ['Uchyapmanmi? Men qushmanmi?! 😮'] },
      welcomeBack: ['Qaytdingiz! Qayerda edingiz? Nima koʻrdingiz? 😮'],
      petted: ['Hihi, qitiq! Nega qitiq boʻladi? 😄', 'Yana! Yana! 💚', 'Barglarim oʻsyaptimi? 🌱'],
      breakTime: ['Koʻzlaringiz charchadimi? Ular ham dam oladimi? 👀'],
      here: ['Men shu yerdaman! Meni qidirdingizmi? 🌱'],
      angry: { 1: ['Voy! Nega otdingiz? 😠'], 2: ['Boshim aylandi! Bu oʻyinmi? 😵'], 3: ['Ey! Niholni otmaydi-ku! 😡'] },
      move: { sit: ['Oʻtirsam oʻsishim sekinlashadimi? 😮'], perch: ['Bu yerdan hammasi kichkina koʻrinadi! Nega? 👀'],
        climb: ['Tepada nima bor? Koʻraman!'], hang: ['Pastga qarasam boshim aylanadi! Nega? 😵'], drop: ['Uchyapmaaan! 😮'],
        jump: ['Hop! Men chigirtkamanmi? 😄'] },
      newLook: ['Salom! Men {name}! Siz kimsiz? Nima qilasiz? 🌱'],
    },
  };

  const last = {};   // har bir ovoz+kalit uchun oxirgi gap — ketma-ket takrorlanmasin

  function lookup(voice, key) {
    let node = VOICES[voice];
    for (const part of key.split('.')) node = node?.[part];
    return Array.isArray(node) && node.length ? node : null;
  }

  // voice — ovoz nomi; key — 'random', 'greet.morning', 'move.sit', 'angry.2' kabi
  function pick(voice, key, vars = {}) {
    const ownVoice = VOICES[voice] ? voice : 'default';
    const list = lookup(ownVoice, key) || lookup('default', key);
    if (!list) return null;
    const id = ownVoice + ':' + key;
    let text;
    do { text = list[Math.floor(Math.random() * list.length)]; } while (text === last[id] && list.length > 1);
    last[id] = text;
    return text.replace(/\{name\}/g, vars.name || '');
  }

  // Gap aytilayotganda yuz ifodasi: gapdagi oxirgi his-tuyg'u emojisi bo'yicha
  // (tsundere "Hmph 😤 ... 😳" — oxirgisi muhim), emoji bo'lmasa — fe'lning odatiy yuzi.
  const EMOJI_FACES = {
    angry: '😤😠😡💢',
    embarrassed: '😳🥺👉👈😅😰🙈',
    sad: '😢😭😔😞😕',   // 💧 — suv ichish eslatmasi, qayg'u emas
    surprised: '😮😲😱😵🎢👀',
    happy: '✨😜😊😄😁💚😎💪🎉😆😌😏🤸💃👑🥰😋',
  };
  // Qaysar (tsundere): "Ishla! …Yaxshi ishlayapsan." — qattiq gapdan keyin "…" bilan yumshasa
  // uyalgan yuz, faqat qattiq gap bo'lsa — jahldor. Oddiy "gapiryapman" yuzi unga mos emas.
  const VOICE_FACES = {
    cheerful: 'happy', playful: 'happy', shy: 'embarrassed',
    tsundere: (text) => /…|\.\.\./.test(text) ? 'embarrassed' : 'angry',
  };
  function faceOf(voice, text) {
    let best = -1, face = null;
    for (const [name, chars] of Object.entries(EMOJI_FACES)) {
      for (const ch of chars) {
        const at = text.lastIndexOf(ch);
        if (at > best) { best = at; face = name; }
      }
    }
    const byVoice = VOICE_FACES[voice];
    return face || (typeof byVoice === 'function' ? byVoice(text) : byVoice) || 'talking';
  }

  const has = (voice, key) => Boolean(lookup(VOICES[voice] ? voice : 'default', key) || lookup('default', key));
  window.Phrases = { pick, has, faceOf, voices: Object.keys(VOICES) };
})();
