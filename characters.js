// Tayyor personajlar (SVG).
// Hammasi bir xil "skelet"ga ega: pose > body-group, arm-l/arm-r, foot-l/foot-r, ko'zlar, og'iz, Zzz.
// Shuning uchun style.css'dagi barcha animatsiyalar (yurish, uyqu, raqs, esnash...) har biriga ishlaydi.
// Ranglar CSS o'zgaruvchilaridan olinadi: --body, --line, --belly, --accent, --feet.

(() => {
  const BODY = 'M80 36 C 120 36, 132 70, 132 100 C 132 130, 110 142, 80 142 C 50 142, 28 130, 28 100 C 28 70, 40 36, 80 36 Z';
  const INK = '#23343a';

  const EYES = `
    <g class="eyes-open">
      <g id="pupils">
        <ellipse cx="62" cy="80" rx="8" ry="10" fill="${INK}"/>
        <ellipse cx="98" cy="80" rx="8" ry="10" fill="${INK}"/>
        <circle cx="65" cy="76" r="3" fill="#fff"/>
        <circle cx="101" cy="76" r="3" fill="#fff"/>
      </g>
    </g>
    <g class="eyes-happy">
      <path d="M53 84 Q 62 72 71 84" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M89 84 Q 98 72 107 84" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </g>
    <g class="eyes-closed">
      <path d="M53 82 Q 62 88 71 82" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M89 82 Q 98 88 107 82" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </g>`;

  const CHEEKS = `
    <ellipse class="cheek" cx="48" cy="96" rx="7" ry="4" fill="#f4a6b4"/>
    <ellipse class="cheek" cx="112" cy="96" rx="7" ry="4" fill="#f4a6b4"/>`;

  const SMILE = `
    <path class="mouth-smile" d="M72 96 Q 80 104 88 96" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse class="mouth-open" cx="80" cy="99" rx="6" ry="5" fill="${INK}"/>`;

  const ZZZ = `
    <g class="zzz">
      <text x="118" y="40" class="z z1">z</text>
      <text x="130" y="26" class="z z2">z</text>
      <text x="142" y="12" class="z z3">Z</text>
    </g>`;

  // back — tana orqasida (dum, quloq asosi), face — ko'zdan oldin (niqob),
  // extra — eng ustida (burun, mo'ylov, osilgan quloqlar)
  function build({ back = '', face = '', mouth = SMILE, extra = '' }) {
    return `
      <ellipse class="shadow" cx="80" cy="150" rx="40" ry="6"/>
      <g class="pose">
      <g class="body-group">
        ${back}
        <path class="c-body" d="${BODY}" stroke-width="3"/>
        <ellipse class="c-belly" cx="80" cy="112" rx="30" ry="22"/>
        ${face}
        <ellipse class="arm arm-l c-body" cx="32" cy="104" rx="8" ry="12" stroke-width="3"/>
        <ellipse class="arm arm-r c-body" cx="128" cy="104" rx="8" ry="12" stroke-width="3"/>
        <ellipse class="foot foot-l c-feet" cx="62" cy="142" rx="12" ry="6"/>
        <ellipse class="foot foot-r c-feet" cx="98" cy="142" rx="12" ry="6"/>
        ${EYES}
        ${CHEEKS}
        ${mouth}
        ${extra}
      </g>
      </g>
      ${ZZZ}`;
  }

  window.CHARACTERS = {
    // Ko'kcha — boshida nihol
    kokcha: build({
      back: `
        <g class="sprout">
          <path d="M80 38 C 80 26, 80 20, 80 14" stroke="#3f8f5a" stroke-width="4" fill="none" stroke-linecap="round"/>
          <path d="M80 18 C 66 6, 52 10, 50 18 C 60 26, 72 24, 80 18 Z" fill="#6cc488"/>
          <path d="M80 16 C 92 2, 108 4, 112 12 C 102 22, 90 22, 80 16 Z" fill="#86d69c"/>
        </g>`,
    }),

    // Mushukcha — uchli quloqlar, dum, mo'ylov
    cat: build({
      back: `
        <path d="M128 128 C 152 124, 154 98, 140 86" stroke="var(--line)" stroke-width="11" fill="none" stroke-linecap="round"/>
        <path d="M128 128 C 152 124, 154 98, 140 86" stroke="var(--body)" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path class="c-body" d="M42 66 L 44 22 L 78 44 Z" stroke-width="3" stroke-linejoin="round"/>
        <path class="c-body" d="M118 66 L 116 22 L 82 44 Z" stroke-width="3" stroke-linejoin="round"/>
        <path d="M50 52 L 50 32 L 68 44 Z" fill="#f4a6b4"/>
        <path d="M110 52 L 110 32 L 92 44 Z" fill="#f4a6b4"/>`,
      mouth: `
        <path class="mouth-smile" d="M71 99 Q 75.5 105 80 99 Q 84.5 105 89 99" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <ellipse class="mouth-open" cx="80" cy="101" rx="5.5" ry="5" fill="${INK}"/>`,
      extra: `
        <path d="M76 92 L 84 92 L 80 97 Z" fill="#e8798f"/>
        <g stroke="var(--line)" stroke-width="2" stroke-linecap="round">
          <path d="M22 94 L 42 97"/><path d="M22 103 L 42 102"/>
          <path d="M138 94 L 118 97"/><path d="M138 103 L 118 102"/>
        </g>`,
    }),

    // Kuchukcha — osilgan quloqlar, katta burun, dumcha
    dog: build({
      back: `
        <path d="M128 122 C 146 118, 152 104, 148 94" stroke="var(--line)" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path d="M128 122 C 146 118, 152 104, 148 94" stroke="var(--body)" stroke-width="4" fill="none" stroke-linecap="round"/>`,
      mouth: `
        <path class="mouth-smile" d="M71 100 Q 80 108 89 100 M80 96 L 80 101" stroke="${INK}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
        <g class="mouth-open">
          <ellipse cx="80" cy="102" rx="6" ry="5.5" fill="${INK}"/>
          <ellipse cx="80" cy="105" rx="3.5" ry="2.5" fill="#e8798f"/>
        </g>`,
      extra: `
        <ellipse cx="80" cy="91" rx="7" ry="5" fill="${INK}"/>
        <ellipse cx="78" cy="89.5" rx="2" ry="1.2" fill="#fff" opacity="0.7"/>
        <path class="c-accent" d="M46 46 C 26 48, 18 80, 28 98 C 40 96, 48 74, 54 54 Z" stroke-width="3" stroke-linejoin="round"/>
        <path class="c-accent" d="M114 46 C 134 48, 142 80, 132 98 C 120 96, 112 74, 106 54 Z" stroke-width="3" stroke-linejoin="round"/>`,
    }),

    // Pingvin — oq yuz niqobi, to'q sariq tumshuq va oyoqlar
    penguin: build({
      back: `
        <path d="M80 37 C 76 28, 70 26, 66 28 M80 37 C 82 27, 88 24, 92 27" stroke="var(--line)" stroke-width="3" fill="none" stroke-linecap="round"/>`,
      face: `
        <ellipse class="c-belly" cx="80" cy="114" rx="36" ry="26"/>
        <ellipse class="c-belly" cx="65" cy="84" rx="19" ry="21"/>
        <ellipse class="c-belly" cx="95" cy="84" rx="19" ry="21"/>`,
      mouth: `
        <path class="mouth-smile beak" d="M71 94 L 89 94 L 80 103 Z" fill="#f5a623" stroke="#d4881a" stroke-width="2" stroke-linejoin="round"/>
        <g class="mouth-open" stroke="#d4881a" stroke-width="2" stroke-linejoin="round" fill="#f5a623">
          <path d="M71 92 L 89 92 L 80 97 Z"/>
          <path d="M73 100 L 87 100 L 80 107 Z"/>
        </g>`,
    }),
  };
})();
