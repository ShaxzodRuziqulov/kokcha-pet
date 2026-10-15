// Ko'kcha — SVG personaj (Yashil qizcha — chibi/ papkasida, PNG kadrlar).
// "Skelet": pose > body-group, arm-l/arm-r, foot-l/foot-r, ko'zlar, og'iz, Zzz — style.css animatsiyalari shularga bog'langan.
// Ranglar CSS o'zgaruvchilaridan olinadi: --body, --line, --belly.

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
    </g>
    <g class="eyes-angry">
      <path d="M50 68 L 72 75" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M110 68 L 88 75" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
      <ellipse cx="62" cy="83" rx="6.5" ry="7" fill="${INK}"/>
      <ellipse cx="98" cy="83" rx="6.5" ry="7" fill="${INK}"/>
      <circle cx="64" cy="80.5" r="2.2" fill="#fff"/>
      <circle cx="100" cy="80.5" r="2.2" fill="#fff"/>
    </g>`;

  const CHEEKS = `
    <ellipse class="cheek" cx="48" cy="96" rx="7" ry="4" fill="#f4a6b4"/>
    <ellipse class="cheek" cx="112" cy="96" rx="7" ry="4" fill="#f4a6b4"/>`;

  const SMILE = `
    <path class="mouth-smile" d="M72 96 Q 80 104 88 96" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse class="mouth-open" cx="80" cy="99" rx="6" ry="5" fill="${INK}"/>`;

  // Jahl: pastga qayrilgan og'iz va boshi ustida "g'azab belgisi"
  const ANGRY = `
    <path class="mouth-angry" d="M70 104 Q 80 97 90 104" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <g class="anger-mark" stroke="#e5484d" stroke-width="3" stroke-linecap="round" fill="none">
      <path d="M112 44 Q 117 49 112 54"/><path d="M128 44 Q 123 49 128 54"/>
      <path d="M115 41 Q 120 46 125 41"/><path d="M115 57 Q 120 52 125 57"/>
    </g>`;

  const ZZZ = `
    <g class="zzz">
      <text x="118" y="40" class="z z1">z</text>
      <text x="130" y="26" class="z z2">z</text>
      <text x="142" y="12" class="z z3">Z</text>
    </g>`;

  // back — tana orqasida (nihol)
  function build({ back = '' }) {
    return `
      <ellipse class="shadow" cx="80" cy="150" rx="40" ry="6"/>
      <g class="pose">
      <g class="body-group">
        ${back}
        <path class="c-body" d="${BODY}" stroke-width="3"/>
        <ellipse class="c-belly" cx="80" cy="112" rx="30" ry="22"/>
        <ellipse class="arm arm-l c-body" cx="32" cy="104" rx="8" ry="12" stroke-width="3"/>
        <ellipse class="arm arm-r c-body" cx="128" cy="104" rx="8" ry="12" stroke-width="3"/>
        <ellipse class="foot foot-l c-feet" cx="62" cy="142" rx="12" ry="6"/>
        <ellipse class="foot foot-r c-feet" cx="98" cy="142" rx="12" ry="6"/>
        ${EYES}
        ${CHEEKS}
        ${SMILE}
        ${ANGRY}
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
  };
})();
