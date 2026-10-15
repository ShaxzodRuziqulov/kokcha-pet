// Personaj gaplari: har bir "ovoz" (fe'l) o'z to'plamiga ega.
// Midori (chibi-girl) fe'llari main'dan `persona` kanali orqali keladi: cheerful → shy → tsundere → playful.
// Ko'kcha doim `curious`. "O'z rasmim" — `default`.
// To'plamda kalit bo'lmasa, `default` dan olinadi. {name} — personaj ismi.
(() => {
  const VOICES = {
    // Umumiy (avvalgi gaplar) — boshqa ovozlarda yo'q kalitlar uchun zaxira
    default: {
      greet: {
        morning: ['Xayrli tong! Men {name}man 🌱'], day: ['Salom! Men {name}man 🌱'],
        evening: ['Xayrli kech! Men {name}man 🌱'], night: ['Hali ham ishlayapsizmi? Men {name}man 🌙'],
      },
      random: ['Bugun nima kod yozamiz?', 'Commit qilishni unutmang!', 'Biroz suv iching 💧',
        'Bug topdingizmi? Birga tuzatamiz!', 'Men shu yerdaman, ishlayvering.',
        "Bir oz cho'zilib oling, qotib qoldingiz.", "Kod ishladimi? Zo'r!"],
      time: {
        morning: ['Kun yaxshi boshlansin! ☀️', 'Nonushta qildingizmi?'],
        lunch: ['Tushlik vaqti! Ovqatlanib oling 🍲'],
        night: ["Kech bo'ldi, dam oling 🌙", "Ertaga davom ettirsak ham bo'ladi."],
      },
      wake: { idle: ['Mm... uxlab qolibman.'], click: ["Hm? Uyg'otib yubordingiz-ku!"], drag: ['Voy! Qayoqqa olib ketyapsiz?'] },
      welcomeBack: ["Qaytdingizmi? Sog'indim! 🌱"],
      petted: ['Hihi 😊', 'Yana! Yana!', "Qitiq bo'lyapti-ku 😄", "Mm, yoqdi 💚"],
      breakTime: ["Ancha bo'ldi, ko'zlaringizga dam bering 👀"],
      here: ['Men shu yerdaman! 🌱'],
      angry: { 1: ["Hey, sekinroq! 😠"], 2: ['Voy, boshim aylandi! 😵'], 3: ['Ey! Men koptok emasman! 😡'] },
      move: {
        sit: ['Biroz dam olay...', 'Oyoqlarim charchadi 😌'], lie: ['Hmm, biroz yotib turay', 'Yumshoq ekan 😌'],
        ledge: ["Oyoqlarimni osiltirib o'tiraman 😊", "Bu yerdan hammasi ko'rinadi!"],
        perch: ["Bu yerdan hammasi ko'rinadi! 👀", 'Men tepadaman! 😎'], jump: ['Hop!', 'Sakrayman!'],
        climb: ['Tepaga chiqaman! 🧗', 'Qani, yuqoriga!'], hang: ['Voy, baland ekan!', 'Endi qanday tushaman? 😅'],
        drop: ['Uuuuu!', 'Wiii! 🎢'],
      },
      newLook: ['Salom! Endi men {name}man ✨'],
    },

    // Midori — quvnoq va g'ayratli
    cheerful: {
      intro: ["Bugun kayfiyatim zo'r! Hammasini uddalaymiz! ✨", "G'ayratim jo'sh urib turibdi! Qani, boshladik! 💪"],
      greet: {
        morning: ['Xayrli tong! {name} tayyor! ☀️ Bugun zo\'r kun bo\'ladi!'], day: ['Salom-salom! {name} shu yerda! ✨'],
        evening: ['Xayrli kech! Bugun qancha ish qildik-a! 🌇'], night: ['Hali ham ishlayapsizmi? Siz qahramonsiz! Lekin uxlash ham kerak 🌙'],
      },
      random: ['Yana bir oz, uddalaysiz! 💪', 'Bu kod zo\'r chiqyapti! ✨', 'Suv ichdingizmi? Men tomoshabin, siz chempion! 💧',
        'Bugun nimani tugatamiz? Men ishonaman!', 'Hayotda bug bo\'lmasa, zerikarli bo\'lardi! 😄', 'Har bir commit — kichik g\'alaba! 🎉'],
      time: { morning: ['Ertalabki energiya! Nonushta ham qiling! 🍳'], lunch: ['Tushlik! Ovqat — eng zo\'r yoqilg\'i! 🍱'],
        night: ['Bugun yaxshi ishladingiz! Ertaga yana davom etamiz 🌙'] },
      wake: { idle: ['Uyg\'ondim! Qani, davom etamiz! ☀️'], click: ['Ha-ha, men shu yerdaman! ✨'], drag: ['Wiii! Sayohatga ketyapmizmi? 🎢'] },
      welcomeBack: ['Qaytdingiz! Yashasin! 🎉', 'Sizni kutib turgandim! ✨'],
      petted: ['Hihi, rahmat! 😊', 'Yana-yana! 💚', 'Kayfiyatim ko\'tarildi! ✨'],
      breakTime: ['Kichik tanaffus — katta kuch! Ko\'zlaringizga dam bering 👀'],
      here: ['Men shu yerdaman! Hech qayerga ketmayman! ✨'],
      angry: { 1: ['Ey, sekinroq-da! 😤'], 2: ['Voy-voy, boshim aylandi! 😵'], 3: ['Hey! Bu umuman qiziq emas! 😠'] },
      move: { sit: ['Biroz o\'tiray, keyin yana yuguraman!'], climb: ['Cho\'qqiga! 🏔️'], perch: ['Bu yerdan dunyo chiroyli ko\'rinadi! ✨'],
        jump: ['Hop-la! 🦘'], drop: ['Wiiii! 🎢'], hang: ['Ushlab oldim! Kuchliman! 💪'] },
      newLook: ['Salom! Men {name}! Birga zo\'r ishlaymiz! ✨'],
    },

    // Midori — uyatchan va mehribon
    shy: {
      intro: ['B-bugun biroz uyatchanman... 👉👈', 'Bugun jimgina yoningizda o\'tiraman, mayli-mi? 🥺'],
      greet: {
        morning: ['X-xayrli tong... Yaxshi uxladingizmi? 🥺'], day: ['S-salom... {name} shu yerda 👉👈'],
        evening: ['Xayrli kech... Charchamadingizmi? 🌇'], night: ['Hali ham uxlamadingizmi?... Men xavotirdaman 🥺'],
      },
      random: ['U-uzr, chalg\'itdimmi?...', 'Siz yaxshi ishlayapsiz... menimcha 👉👈', 'Suv... ichib qo\'ysangiz... 💧',
        'Men shu yerda jimgina o\'tiraman...', 'Agar charchasangiz... aytasiz-a? 🥺', 'Sizni kuzatib turish... yoqadi 😳'],
      time: { morning: ['N-nonushta qildingizmi?...'], lunch: ['Tushlik vaqti... ovqatlanib olasizmi? 🍙'],
        night: ['Kech bo\'ldi... dam olsangiz... yaxshi bo\'lardi 🌙'] },
      wake: { idle: ['A... uxlab qolibman, uzr... 😳'], click: ['Hya! Q-qo\'rqitib yubordingiz... 😳'], drag: ['A-a-a! Qayoqqa?... 😳'] },
      welcomeBack: ['Q-qaytdingizmi?... Sog\'indim... 👉👈'],
      petted: ['U-uyalyapman... 😳', 'Hi... yoqimli... 👉👈', '...yana? 🥺'],
      breakTime: ['Ko\'zlaringiz charchadi... dam bersangiz... 👀'],
      here: ['M-men shu yerdaman... 👉👈'],
      angry: { 1: ['A-aytgandim-ku, sekin... 🥺'], 2: ['Boshim aylandi... nega bunday?... 😢'], 3: ['B-bu... juda yomon bo\'ldi... 😭'] },
      move: { sit: ['Biroz o\'tiray... mayli-mi?'], perch: ['B-baland ekan... 😳'], hang: ['Q-qo\'rqyapman... 😰'], drop: ['Kya-a-a! 😳'] },
      newLook: ['S-salom... Men {name}... tanishganimdan xursandman 👉👈'],
    },

    // Midori — biroz injiq (tsundere)
    tsundere: {
      intro: ['Hmph. Bugun meni bezovta qilma. ...Lekin yonimda bo\'lsang mayli 😤', 'Bugun sen bilan gaplashmayman. ...Ko\'p.'],
      greet: {
        morning: ['Hmph, tong otdi. Seni kutganim yo\'q! ...Xayrli tong.'], day: ['Yana sen-mi? ...Salom, mayli 😤'],
        evening: ['Kech bo\'ldi. Seni o\'ylaganim yo\'q! ...Charchamadingmi?'], night: ['Hali uxlamadingmi? Ahmoq! ...Tezroq yot 🌙'],
      },
      random: ['Seni o\'ylagani yo\'qman! ...Lekin suv ich 💧', 'Bu kodni o\'zim ham yozardim. ...Yaxshi chiqibdi, mayli.',
        'Hmph. Ishlashda davom et. Men shunchaki shu yerdaman.', 'Commit qilmasang, men aybdor emasman! 😤',
        'Bug? Tabiiyki. ...Birga tuzatamiz, mayli.', 'Menga qarab nima qilasan? Ishla! ...Yaxshi ishlayapsan.'],
      time: { morning: ['Nonushta qilmading-a? Bilib turibman. Bor, ovqatlan! 😤'], lunch: ['Tushlik! Och qolsang men aybdor emasman!'],
        night: ['Kech! Uxlamasang ertaga ahmoqdek ko\'rinasan. ...Yot.'] },
      wake: { idle: ['Uxlaganim yo\'q! Ko\'zimni yumib o\'ylayotgandim! 😤'], click: ['Nima?! Uyg\'otishga kim ruxsat berdi?! 😤'],
        drag: ['Hey! Qo\'yib yubor! ...Ehtiyot bo\'l. 😤'] },
      welcomeBack: ['Qaytding-a. Sog\'inganim yo\'q! ...Ko\'p emas. 😤'],
      petted: ['B-bunday qilma! ...Mayli, yana bir marta. 😳', 'Hmph! Yoqmadi! ...Yolg\'on. 😤', 'Qo\'lingni ol! ...Shoshma, olma.'],
      breakTime: ['Ko\'zing qizarib ketdi. Dam ol! Senga g\'amxo\'rlik qilayotganim yo\'q! 😤'],
      here: ['Men hech qayerga ketganim yo\'q, ahmoq! 😤'],
      angry: { 1: ['Hmph! Ehtiyot bo\'l-da! 😤'], 2: ['Seni kechirmayman! ...Hozircha. 😠'], 3: ['AHMOQ! Men koptok emasman!! 💢'] },
      move: { sit: ['O\'tiraman. Charchaganimdan emas! 😤'], perch: ['Yuqoridan hammaga qarayman. Hmph!'],
        hang: ['Qo\'rqmayapman! ...Biroz. 😤'], drop: ['Kyaa! B-bu rejalashtirilgan edi! 😳'] },
      newLook: ['Men {name}. Esingda tut, ahmoq! ...Tanishganimdan xursandman. 😤'],
    },

    // Midori — shaddod va hazilkash
    playful: {
      intro: ['Bugun hazil kayfiyatidaman! Ehtiyot bo\'ling 😏', 'Bugun kim kimni ermak qiladi? Ko\'ramiz! 😜'],
      greet: {
        morning: ['Tong otdi! Qahva ichdingizmi yoki men ichaymi? ☕😏'], day: ['Salom! {name} yana keldi — qochib qutulolmaysiz 😜'],
        evening: ['Xayrli kech! Bugun nechta bug yasadik? 😏'], night: ['Tunda kod yozish — eng sirli hunar 🌙😏'],
      },
      random: ['Yana bug? Kim yozdi ekan buni 😏', 'Bu kod ishlasa, men raqsga tushaman 💃', 'Suv iching, aks holda men ham suv ichmayman! 💧😜',
        'Commit xabari: "tuzatdim". Nima tuzatdingiz? 😏', 'Klaviaturangiz charchadi, menga aytdi 😜', 'Men kuzatyapman... har bir tugmani 👀😏'],
      time: { morning: ['Nonushtasiz kod — tuzsiz osh! 🍳😜'], lunch: ['Tushlik! Kod qochib ketmaydi, ovqat sovib qoladi 🍜'],
        night: ['Bu soatda faqat ukki va dasturchilar uyg\'oq 🦉😏'] },
      wake: { idle: ['Uxlamadim, kuch to\'pladim 😎'], click: ['Taq-taq! Kim bor? Men bor! 😜'], drag: ['Bepul attraksion! Yana! 🎢😜'] },
      welcomeBack: ['Qaytdingizmi? Men hech narsani buzmadim... deyarli 😏'],
      petted: ['Qitiq-qitiq! 😆', 'Bu xizmat pullik edi, bilasizmi? 😏', 'Yana! Men qarshi emasman 😜'],
      breakTime: ['Ekranga juda yaqin o\'tiribsiz, ichiga kirib ketasiz! Dam oling 👀😜'],
      here: ['Ku-ku! Men shu yerdaman 😜'],
      angry: { 1: ['Hey, bu sport emas! 😤'], 2: ['Endi men ham sizni otaman! ...Kuchim yetmaydi 😠'], 3: ['Bu urush! 💢 ...Yarashamizmi?'] },
      move: { sit: ['O\'tiray, kim nima deydi? 😎'], perch: ['Shohona joy! 👑😏'], jump: ['Parkur! 🤸'], hang: ['Akrobat {name}! 🤸😜'], drop: ['Wheee! Yana bir marta! 🎢'] },
      newLook: ['Salom! Men {name} — eng qiziqarli yordamchi 😏'],
    },

    // Ko'kcha — bolalarcha qiziquvchan
    curious: {
      greet: {
        morning: ['Xayrli tong! Quyosh chiqdi! Men ham o\'saymanmi? 🌱☀️'], day: ['Salom! Men {name}! Bugun nima o\'rganamiz? 🌱'],
        evening: ['Xayrli kech! Kechqurun nihollar nima qiladi? 🌱'], night: ['Nega hali uxlamadingiz? Kechasi ham kod yoziladimi? 🌙'],
      },
      random: ['Bu nima? Kodmi? Men ham yozib ko\'raymi? 🌱', 'Nega osmon ko\'k? Men ham ko\'kman-ku! 💙', 'Bug degani qo\'ng\'izmi? Qayerda u? 🐞',
        'Siz nechta tugma bosdingiz? Men sanay olmadim! 😮', 'Suv ichsangiz o\'sasizmi? Men o\'saman! 💧🌱',
        'Commit nima? Shirinlikmi? 🍬', 'Ekranda nima yozilgan? O\'qib bering! 📖'],
      time: { morning: ['Ertalab nonushta qilasizmi? Men quyosh nuri ichaman! ☀️'], lunch: ['Tushlik nima? Menga ham suv bormi? 💧'],
        night: ['Yulduzlar chiqdimi? Ular ham niholmi? ✨'] },
      wake: { idle: ['Uxlab qolibman! Tushimda katta daraxt bo\'libman! 🌳'], click: ['Nima bo\'ldi? Nima bo\'ldi? 😮'],
        drag: ['Uchyapmanmi? Men qushmanmi?! 🐦'] },
      welcomeBack: ['Qaytdingiz! Qayerda edingiz? Nima ko\'rdingiz? 😮'],
      petted: ['Hihi, qitiq! Nega qitiq bo\'ladi? 😄', 'Yana! Yana! 💚', 'Barglarim o\'syaptimi? 🌱'],
      breakTime: ['Ko\'zlaringiz charchadimi? Ular ham dam oladimi? 👀'],
      here: ['Men shu yerdaman! Meni qidirdingizmi? 🌱'],
      angry: { 1: ['Voy! Nega otdingiz? 😠'], 2: ['Boshim aylandi! Bu o\'yinmi? 😵'], 3: ['Ey! Niholni otmaydi-ku! 😡'] },
      move: { sit: ['O\'tirsam o\'sishim sekinlashadimi? 🤔'], perch: ['Bu yerdan hammasi kichkina ko\'rinadi! Nega? 👀'],
        climb: ['Tepada nima bor? Ko\'raman! 🧗'], hang: ['Pastga qarasam boshim aylanadi! Nega? 😵'], drop: ['Uchyapmaaan! 🍃'],
        jump: ['Hop! Men chigirtkamanmi? 🦗'] },
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
    happy: '✨😜😊😄😁💚😎💪🎉😆😌😏🤸💃👑🥰',
  };
  const VOICE_FACES = { cheerful: 'happy', playful: 'happy', shy: 'embarrassed' };
  function faceOf(voice, text) {
    let best = -1, face = null;
    for (const [name, chars] of Object.entries(EMOJI_FACES)) {
      for (const ch of chars) {
        const at = text.lastIndexOf(ch);
        if (at > best) { best = at; face = name; }
      }
    }
    return face || VOICE_FACES[voice] || 'talking';
  }

  const has = (voice, key) => Boolean(lookup(VOICES[voice] ? voice : 'default', key) || lookup('default', key));
  window.Phrases = { pick, has, faceOf, voices: Object.keys(VOICES) };
})();
