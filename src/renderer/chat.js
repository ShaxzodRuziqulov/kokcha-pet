const keyForm = document.getElementById('key-form');
const chatBox = document.getElementById('chat');
const log = document.getElementById('log');
const askForm = document.getElementById('ask-form');
const textInput = document.getElementById('text');
const sendButton = document.getElementById('send');
let petName = 'Midori';
let requestVersion = 0;

function cancelPending() {
  requestVersion++;
  sendButton.disabled = false;
  log.querySelectorAll('.typing').forEach(item => item.remove());
}

// scope: keyForm yoki chatBox — har birining o'z holat qatori bor
function setStatus(scope, text) { scope.querySelector('.status').textContent = text || ''; }

function bubble(role, text, extra = '') {
  log.querySelector('.empty')?.remove();
  const li = document.createElement('li');
  li.className = `${role} ${extra}`.trim();
  li.textContent = text;
  log.append(li);
  log.scrollTop = log.scrollHeight;
  return li;
}

function showEmpty() {
  log.replaceChildren();
  bubble('empty', `${petName} bilan gaplashing — javobi ish stolidagi bulutchada ham chiqadi.`);
}

async function load() {
  try {
    const state = await window.chat.state();
    petName = state.name;
    document.getElementById('title').textContent = `${petName} bilan suhbat`;
    keyForm.hidden = state.hasKey;
    chatBox.hidden = !state.hasKey;
    if (!state.hasKey) { document.getElementById('key').focus(); return; }
    showEmpty();
    for (const m of state.history) bubble(m.role, m.text);
    textInput.focus();
  } catch { setStatus(keyForm, 'Oynani yuklab boʻlmadi. Qayta oching.'); keyForm.hidden = false; }
}

document.getElementById('studio').addEventListener('click', () => window.chat.openStudio());

keyForm.addEventListener('submit', async event => {
  event.preventDefault();
  const input = document.getElementById('key');
  const result = await window.chat.setKey(input.value).catch(() => ({ error: 'Saqlab boʻlmadi.' }));
  if (result.error) return setStatus(keyForm, result.error);
  input.value = ''; setStatus(keyForm, '');
  await load();
});

askForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (sendButton.disabled) return;
  const version = requestVersion;
  const text = textInput.value.trim();
  if (!text) return;
  bubble('user', text);
  textInput.value = ''; sendButton.disabled = true; setStatus(chatBox, '');
  const waiting = bubble('model', `${petName} yozyapti…`, 'typing');
  const result = await window.chat.ask(text).catch(() => ({ error: 'Javob olib boʻlmadi.' }));
  if (version !== requestVersion) return;
  waiting.remove();
  sendButton.disabled = false;
  if (result.cancelled) return;
  if (result.ok) bubble('model', result.reply);
  else {
    setStatus(chatBox, result.error);
    if (result.needKey) await load();
  }
  textInput.focus();
});

document.getElementById('reset').addEventListener('click', async () => {
  cancelPending();
  await window.chat.reset();
  setStatus(chatBox, ''); showEmpty(); textInput.focus();
});

document.getElementById('forget').addEventListener('click', async () => {
  cancelPending();
  await window.chat.clearKey();
  await load();
});

load();
