// O'ng tugma paneli: main'dan kelgan ro'yxatni (menu.js template) chiroyli ko'rinishda chizadi.
// panelKind: banner — yangi versiya; tile — tez amallar; danger — chiqish; version — pastki yozuv.
const content = document.getElementById('content');
const openIds = new Set();   // ochiq bo'limlar — ro'yxat yangilanganda ham ochiq qoladi
let current = null;

const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
};
// Ikonka alohida berilgan bo'lsa, yorliq boshidagi emoji takrorlanmasin
const clean = (label, icon) => (icon ? label.replace(/^[^\p{L}\p{N}(]+/u, '') : label);

function act(item) {
  if (!item.enabled) return;
  window.panel.act(item.id, item.label);
}

function row(item) {
  const btn = el('button', 'row' + (item.kind === 'danger' ? ' danger' : ''));
  btn.type = 'button';
  btn.disabled = !item.enabled;
  btn.append(el('span', 'ico', item.icon || ''), el('span', 'label', clean(item.text, item.icon)));
  if (item.type === 'checkbox') {
    btn.setAttribute('role', 'menuitemcheckbox');
    btn.setAttribute('aria-checked', String(item.checked));
    btn.append(el('span', 'switch'));
  } else {
    btn.setAttribute('role', 'menuitem');
  }
  btn.addEventListener('click', () => act(item));
  return btn;
}

function submenu(item) {
  const wrap = el('div');
  const head = el('button', 'row');
  head.type = 'button';
  head.disabled = !item.enabled;
  const chosen = item.submenu.find((s) => s.type === 'radio' && s.checked);
  head.append(el('span', 'ico', item.icon || ''), el('span', 'label', clean(item.text, item.icon)),
    el('span', 'value', chosen ? chosen.text : ''), el('span', 'chev', '›'));
  const open = openIds.has(item.id) && item.enabled;
  head.setAttribute('aria-expanded', String(open));
  const sub = el('div', 'sub' + (open ? ' open' : ''));
  for (const s of item.submenu) {
    if (s.type === 'separator') continue;
    const opt = el('button', s.type === 'radio' ? 'opt' : 'opt plain', s.text);
    opt.type = 'button';
    opt.disabled = !s.enabled;
    if (s.type === 'radio') { opt.setAttribute('role', 'menuitemradio'); opt.setAttribute('aria-checked', String(s.checked)); }
    opt.addEventListener('click', () => act(s));
    sub.append(opt);
  }
  head.addEventListener('click', () => {
    if (openIds.has(item.id)) openIds.delete(item.id); else openIds.add(item.id);
    render(current);
  });
  wrap.append(head, sub);
  return wrap;
}

function render(model) {
  current = model;
  const { header, items } = model;
  document.getElementById('name').textContent = header.name;
  const av = document.getElementById('avatar');
  if (header.avatar?.src) {
    const img = el('img');
    img.src = header.avatar.src;
    img.alt = '';
    if (header.avatar.top) img.className = 'top';
    av.replaceChildren(img);
  } else av.textContent = header.avatar?.emoji || header.name.slice(0, 1);
  const chips = document.getElementById('chips');
  chips.replaceChildren(...[header.mood, header.state].filter(Boolean).map((t) => el('span', 'chip-tag', t)));

  const groups = [[]];
  for (const item of items) {
    if (item.type === 'separator') groups.push([]);
    else groups.at(-1).push(item);
  }
  content.replaceChildren();
  let footer = null;
  for (const group of groups) {
    if (!group.length) continue;
    const box = el('div', 'group');
    const tiles = group.filter((i) => i.kind === 'tile');
    if (tiles.length) {
      const grid = el('div', 'tiles');
      for (const t of tiles) {
        const b = el('button', 'tile');
        b.type = 'button';
        b.disabled = !t.enabled;
        b.title = t.text;
        b.append(el('span', 'ico', t.icon || '•'), el('span', '', clean(t.text, t.icon)));
        b.addEventListener('click', () => act(t));
        grid.append(b);
      }
      box.append(grid);
    }
    for (const item of group) {
      if (item.kind === 'tile') continue;
      if (item.kind === 'version') { footer = item.text; continue; }
      if (item.kind === 'banner') {
        const b = el('button', 'banner', '✨ ' + clean(item.text, '✨'));
        b.type = 'button';
        b.addEventListener('click', () => act(item));
        box.append(b);
      } else if (item.type === 'submenu') box.append(submenu(item));
      else if (item.kind === 'note') box.append(el('div', 'note', item.text));
      else box.append(row(item));
    }
    if (box.childNodes.length) content.append(box);
  }
  if (footer) {
    const f = el('div', 'footer');
    f.append(el('span', '', footer), el('span', '', 'Esc — yopish'));
    content.append(f);
  }
  // Tabiiy balandlik (karta oyna bilan cheklangan bo'lishi mumkin): sarlavha + butun ro'yxat + chetlar
  requestAnimationFrame(() => window.panel.height(
    document.querySelector('header').offsetHeight + content.scrollHeight + 4 + 16));
}

window.panel.onModel(render);
document.getElementById('close').addEventListener('click', () => window.panel.close());
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.panel.close(); });
