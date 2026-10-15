const form = document.getElementById('form');
const textInput = document.getElementById('text');
const dueInput = document.getElementById('due');
const status = document.getElementById('status');
const saveButton = document.getElementById('save');

function inMinutes(minutes) {
  const date = new Date(Date.now() + minutes * 60000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  dueInput.value = date.toISOString().slice(0, 16);
}
inMinutes(10);
for (const button of document.querySelectorAll('[data-minutes]')) {
  button.addEventListener('click', () => inMinutes(Number(button.dataset.minutes)));
}
async function refresh() {
  try {
    const items = await window.reminders.list();
    const list = document.getElementById('list');
    list.replaceChildren();
    document.getElementById('empty').hidden = items.length > 0;
    items.sort((a, b) => Boolean(a.deliveredAt) - Boolean(b.deliveredAt) || a.dueAt - b.dueAt);
    for (const item of items) {
      const row = document.createElement('li');
      if (item.deliveredAt) row.className = 'delivered';
      const details = document.createElement('div');
      const text = document.createElement('p'); text.textContent = item.text;
      const time = document.createElement('small');
      time.textContent = `${item.deliveredAt ? 'Eslatildi · ' : item.dueAt <= Date.now() ? 'Kutilmoqda · ' : ''}${new Date(item.dueAt).toLocaleString('uz-Latn', { dateStyle: 'medium', timeStyle: 'short' })}`;
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'O‘chirish';
      remove.setAttribute('aria-label', `${item.text} eslatmasini o‘chirish`);
      remove.addEventListener('click', async () => {
        remove.disabled = true;
        try { const result = await window.reminders.remove(item.id); status.textContent = result.error || ''; await refresh(); }
        catch { status.textContent = 'O‘chirib bo‘lmadi. Yana urinib ko‘ring.'; remove.disabled = false; }
      });
      details.append(text, time); row.append(details, remove); list.append(row);
    }
  } catch { status.textContent = 'Ro‘yxatni yuklab bo‘lmadi. Oynani qayta oching.'; }
}
form.addEventListener('submit', async event => {
  event.preventDefault(); saveButton.disabled = true;
  try {
    const result = await window.reminders.add({ text: textInput.value, dueAt: new Date(dueInput.value).getTime() });
    status.textContent = result.error || 'Saqlandi. Vaqti kelganda eslataman.';
    if (result.ok) { textInput.value = ''; textInput.focus(); await refresh(); }
  } catch { status.textContent = 'Saqlab bo‘lmadi. Yana urinib ko‘ring.'; }
  finally { saveButton.disabled = false; }
});
window.reminders.onChanged(refresh);
refresh();
