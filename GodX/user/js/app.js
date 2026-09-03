/* ═══════════════════════════════════════════════════════════
   BACHAT — user app logic 3.0 (premium edition)
   Collections: users, plans, investments, transactions,
                announcements, appContent, paymentMethods
   New: bank-details wallet, UTR + screenshot deposit proofs,
        admin-managed payment methods, premium animations
   ═══════════════════════════════════════════════════════════ */

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const inr = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const fdate = ts => ts && ts.toDate ? ts.toDate().toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store = { // safe localStorage (private-mode proof)
  get(k, d){ try { const v = localStorage.getItem(k); return v === null ? d : v; } catch(e){ return d; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch(e){} }
};

/* ── Premium SVG icon library (rounded, filled) ── */
const IC = {
  bell:'<svg viewBox="0 0 24 24"><path d="M12 22a2.4 2.4 0 0 0 2.4-2.4H9.6A2.4 2.4 0 0 0 12 22zm7.4-5.6v1H4.6v-1l1.8-1.8v-4.4a5.6 5.6 0 0 1 4.2-5.4V4a1.4 1.4 0 0 1 2.8 0v.8a5.6 5.6 0 0 1 4.2 5.4v4.4z"/></svg>',
  eye:'<svg viewBox="0 0 24 24"><path d="M12 5c-5 0-9.3 3-11 7 1.7 4 6 7 11 7s9.3-3 11-7c-1.7-4-6-7-11-7zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9zm0-7.2a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4z"/></svg>',
  eyeOff:'<svg viewBox="0 0 24 24"><path d="M3.3 2 2 3.3l3 3A12.6 12.6 0 0 0 1 12c1.7 4 6 7 11 7 2 0 3.9-.5 5.5-1.4l3.2 3.1L22 19.4zm8.7 15a4.5 4.5 0 0 1-5.9-5.9l1.6 1.6a2.7 2.7 0 0 0 3.7 3.7zM12 5c5 0 9.3 3 11 7a12.4 12.4 0 0 1-4.3 5l-2-2a4.5 4.5 0 0 0-5.8-5.8L8.2 4.5A11 11 0 0 1 12 5z"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M12 4.5c.8 0 1.4.6 1.4 1.4v4.7h4.7a1.4 1.4 0 0 1 0 2.8h-4.7v4.7a1.4 1.4 0 0 1-2.8 0v-4.7H5.9a1.4 1.4 0 0 1 0-2.8h4.7V5.9c0-.8.6-1.4 1.4-1.4z"/></svg>',
  up:'<svg viewBox="0 0 24 24"><path d="M12.7 4.3l6 6a1.3 1.3 0 0 1-.9 2.2h-3.4v6.8a1.3 1.3 0 0 1-1.3 1.3h-2.2a1.3 1.3 0 0 1-1.3-1.3v-6.8H6.2a1.3 1.3 0 0 1-.9-2.2l6-6a1.3 1.3 0 0 1 1.4 0z" transform="translate(0,-.6)"/></svg>',
  down:'<svg viewBox="0 0 24 24"><path d="M11.3 19.7l-6-6a1.3 1.3 0 0 1 .9-2.2h3.4V4.7a1.3 1.3 0 0 1 1.3-1.3h2.2a1.3 1.3 0 0 1 1.3 1.3v6.8h3.4a1.3 1.3 0 0 1 .9 2.2l-6 6a1.3 1.3 0 0 1-1.4 0z" transform="translate(0,.6)"/></svg>',
  gift:'<svg viewBox="0 0 24 24"><path d="M20 7h-2.2A3 3 0 0 0 15 3c-1.2 0-2.3.7-3 1.7C11.3 3.7 10.2 3 9 3a3 3 0 0 0-2.8 4H4a1 1 0 0 0-1 1v3h8V9h2v2h8V8a1 1 0 0 0-1-1zM9 5.5A1.5 1.5 0 0 1 10.5 7H9a1.5 1.5 0 0 1 0-1.5zm6 0A1.5 1.5 0 0 1 15 7h-1.5A1.5 1.5 0 0 1 15 5.5zM3 13v7a1 1 0 0 0 1 1h7v-8zm10 8h7a1 1 0 0 0 1-1v-7h-8z"/></svg>',
  shield:'<svg viewBox="0 0 24 24"><path d="M12 1.6 3.8 4.8v6.4c0 5 3.4 9.9 8.2 11.2 4.8-1.3 8.2-6.2 8.2-11.2V4.8zm3.5 7.6-4.7 4.7a1 1 0 0 1-1.4 0l-2.2-2.2a1 1 0 1 1 1.4-1.4l1.5 1.5 4-4a1 1 0 0 1 1.4 1.4z"/></svg>',
  bank:'<svg viewBox="0 0 24 24"><path d="M12 2 2 8v2h20V8zM4 11v7H2v3h20v-3h-2v-7h-4v7h-3v-7h-2v7H8v-7z"/></svg>',
  users:'<svg viewBox="0 0 24 24"><path d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2c-2.3 0-7 1.2-7 3.5V19h9v-2.5c0-.8.2-1.6.6-2.3A11 11 0 0 0 8 13zm8 0c-.3 0-.6 0-1 .1 1.2.8 2 2 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z"/></svg>',
  user:'<svg viewBox="0 0 24 24"><path d="M12 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 11c4.4 0 8 2.2 8 5v1.5a.5.5 0 0 1-.5.5h-15a.5.5 0 0 1-.5-.5V19c0-2.8 3.6-5 8-5z"/></svg>',
  chat:'<svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM7 9h10v2H7zm6 5H7v-2h6zm4-6H7V6h10z"/></svg>',
  check:'<svg viewBox="0 0 24 24"><path d="M9.6 15.6 5.9 11.9a1.2 1.2 0 0 0-1.7 1.7l4.5 4.5a1.2 1.2 0 0 0 1.7 0L20.7 7.8A1.2 1.2 0 0 0 19 6.1z"/></svg>',
  spark:'<svg viewBox="0 0 24 24"><path d="M12 1.5c.4 0 .8.3.9.7l1.9 6 6 1.9a.9.9 0 0 1 0 1.8l-6 1.9-1.9 6a.9.9 0 0 1-1.8 0l-1.9-6-6-1.9a.9.9 0 0 1 0-1.8l6-1.9 1.9-6c.1-.4.5-.7.9-.7z"/></svg>',
  target:'<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 4.2zm0 4.2a5.8 5.8 0 1 0 5.8 5.8h-2.2a3.6 3.6 0 1 1-3.6-3.6zm1.1 5L21.6 2.7h-2.7V1h-2v4.6l-2.4 2.3z"/></svg>',
  chevD:'<svg viewBox="0 0 24 24"><path d="M12 15.5a1.2 1.2 0 0 1-.9-.4l-5-5a1.2 1.2 0 1 1 1.7-1.7l4.2 4.2 4.2-4.2a1.2 1.2 0 1 1 1.7 1.7l-5 5a1.2 1.2 0 0 1-.9.4z"/></svg>',
  arrowR:'<svg class="arrow" viewBox="0 0 24 24"><path d="M8.5 5a1.2 1.2 0 0 1 .9.4l6 6a1.2 1.2 0 0 1 0 1.7l-6 6a1.2 1.2 0 0 1-1.7-1.7l5.2-5.2-5.2-5.2A1.2 1.2 0 0 1 8.5 5z"/></svg>',
  copy:'<svg viewBox="0 0 24 24"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11z"/></svg>',
  share:'<svg viewBox="0 0 24 24"><path d="M18 16.1a3 3 0 0 0-2.1.8L8.9 12.7a3.4 3.4 0 0 0 0-1.4l6.9-4A3 3 0 1 0 15 5c0 .2 0 .4.1.6L8.2 9.7a3 3 0 1 0 0 4.6l7 4.1a3 3 0 1 0 2.8-2.3z"/></svg>',
  logout:'<svg viewBox="0 0 24 24"><path d="M17 7l-1.4 1.4 2.6 2.6H8v2h10.2l-2.6 2.6L17 17l5-5zM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4z"/></svg>',
  doc:'<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm2 16H8v-2h8zm0-4H8v-2h8zm-3-5V3.5L18.5 9z"/></svg>',
  info:'<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-6h2zm0-8h-2V7h2z"/></svg>',
  percent:'<svg viewBox="0 0 24 24"><path d="M7.5 4A3.5 3.5 0 1 0 11 7.5 3.5 3.5 0 0 0 7.5 4zm0 5A1.5 1.5 0 1 1 9 7.5 1.5 1.5 0 0 1 7.5 9zm9 6a3.5 3.5 0 1 0 3.5 3.5 3.5 3.5 0 0 0-3.5-3.5zm0 5a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5zM19.5 2l1 1.7L6.2 22l-1-1.7z"/></svg>',
  clock:'<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7z"/></svg>',
  star:'<svg viewBox="0 0 24 24"><path d="m12 1.8 3.1 6.5 7 .9-5.1 4.8 1.3 7L12 17.6 5.7 21l1.3-7L1.9 9.2l7-.9z"/></svg>',
  wallet:'<svg viewBox="0 0 24 24"><path d="M18.5 4h-12A3.5 3.5 0 0 0 3 7.5v9A3.5 3.5 0 0 0 6.5 20h12a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 18.5 6h-11a.5.5 0 0 1 0-1h11zM16 13.8a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2z"/></svg>',
  lock:'<svg viewBox="0 0 24 24"><path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 1 1 6 0v3zm3 3.5a2 2 0 0 1 1 3.7V19a1 1 0 0 1-2 0v-1.8a2 2 0 0 1 1-3.7z"/></svg>',
  zap:'<svg viewBox="0 0 24 24"><path d="M13 1 3.5 13.5h6L9.5 23 20 10h-6.5z"/></svg>',
  phone:'<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.9 15.9 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .57 3.6 1 1 0 0 1-.25 1z"/></svg>',
  confetti:'<svg viewBox="0 0 24 24"><path d="m2 22 3.5-1-1-3.5a1 1 0 0 1 .3-1l8.7-8.8 4 4L8.7 20.5a1 1 0 0 1-1 .3zM15 3l1.2 2.8L19 7l-2.8 1.2L15 11l-1.2-2.8L11 7l2.8-1.2zm5 6 .8 1.7 1.7.8-1.7.8L20 14l-.8-1.7-1.7-.8 1.7-.8z"/></svg>',
  edit:'<svg viewBox="0 0 24 24"><path d="M3 17.2V21h3.8l11-11-3.8-3.8zm17.7-10.2a1 1 0 0 0 0-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-1.8 1.8 3.8 3.8z"/></svg>',
  upload:'<svg viewBox="0 0 24 24"><path d="M12 3a1 1 0 0 1 .7.3l4 4a1 1 0 0 1-1.4 1.4L13 6.4V15a1 1 0 0 1-2 0V6.4L8.7 8.7A1 1 0 0 1 7.3 7.3l4-4A1 1 0 0 1 12 3zM5 17a1 1 0 0 1 1 1v1h12v-1a1 1 0 0 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"/></svg>',
  qr:'<svg viewBox="0 0 24 24"><path d="M3 3h8v8H3zm2 2v4h4V5zm8-2h8v8h-8zm2 2v4h4V5zM3 13h8v8H3zm2 2v4h4v-4zm13-2h3v3h-3zm-5 0h2v2h-2zm2 5h3v3h-3zm-5-2h2v2h-2zm3 3h2v3h-2z"/></svg>'
};

/* ── Global state ── */
let currentUser = null, userDoc = null, plansCache = [];
let unsub = [];
let balanceVisible = store.get('bgBal', 'on') !== 'off', currentView = 'home';
let lastBalance = null; // for count-up animation

/* ══════════ FULLSCREEN LOADER ══════════ */
function showLoader(txt = 'Working…') {
  const el = $('#loader-overlay');
  if (el) { el.querySelector('.lo-txt').textContent = txt; el.classList.add('show'); }
}
function hideLoader() { const el = $('#loader-overlay'); if (el) el.classList.remove('show'); }

/* ══════════ TOAST ══════════ */
function toast(msg, type = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = (type === 'ok' ? IC.check : IC.info) + '<span>' + esc(msg) + '</span>';
  $('#toast-root').appendChild(t);
  setTimeout(() => { t.classList.add('bye'); setTimeout(() => t.remove(), 320); }, 2800);
}

/* ══════════ CONFETTI celebration ══════════ */
function confetti(n = 26) {
  const colors = ['#7C4DFF', '#F5B93F', '#0BA968', '#2563EB', '#E5484D', '#C084FC'];
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    const size = 6 + Math.random() * 7;
    p.style.cssText = `left:${Math.random() * 100}vw;width:${size}px;height:${size * (Math.random() > .5 ? 1 : .45)}px;
      background:${colors[i % colors.length]};animation-duration:${1.6 + Math.random() * 1.4}s;
      animation-delay:${Math.random() * .35}s;transform:rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 3400);
  }
}

/* ══════════ BALANCE COUNT-UP ══════════ */
function countUp(el, to) {
  const from = lastBalance ?? 0;
  lastBalance = to;
  if (from === to || !el) { if (el) el.textContent = inr(to); return; }
  const t0 = performance.now(), dur = 650;
  (function tick(t) {
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = inr(Math.round(from + (to - from) * e));
    if (k < 1 && document.body.contains(el)) requestAnimationFrame(tick);
  })(t0);
}

/* ══════════ MODAL (bottom sheet) ══════════ */
function openSheet(html) {
  closeSheet();
  const back = document.createElement('div'); back.className = 'modal-back';
  const sheet = document.createElement('div'); sheet.className = 'modal-sheet';
  sheet.innerHTML = '<div class="sheet-handle"></div><div class="sheet-fade">' + html + '</div>';
  $('#modal-root').append(back, sheet);
  requestAnimationFrame(() => { back.classList.add('show'); sheet.classList.add('show'); });
  back.onclick = closeSheet;
  return sheet;
}
function closeSheet() { $('#modal-root').innerHTML = ''; }

/* ══════════ SPLASH / AUTH ══════════ */
window.addEventListener('load', () => setTimeout(() => $('#splash').classList.add('fade'), 1300));

$('#tab-login').onclick = () => switchAuthTab(true);
$('#tab-signup').onclick = () => switchAuthTab(false);
function switchAuthTab(login) {
  $('#tab-login').classList.toggle('active', login);
  $('#tab-signup').classList.toggle('active', !login);
  $('#form-login').classList.toggle('hidden', !login);
  $('#form-signup').classList.toggle('hidden', login);
}

$('#form-login').onsubmit = async e => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.classList.add('loading'); btn.disabled = true;
  try {
    await auth.signInWithEmailAndPassword($('#login-email').value.trim(), $('#login-pass').value);
    toast('Welcome back! 👋', 'ok');
  } catch (err) { toast(authMsg(err), 'err'); }
  btn.classList.remove('loading'); btn.disabled = false;
};

$('#form-signup').onsubmit = async e => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  const name = $('#su-name').value.trim(), phone = $('#su-phone').value.trim(),
        email = $('#su-email').value.trim(), pass = $('#su-pass').value,
        ref = $('#su-ref').value.trim().toUpperCase();
  btn.classList.add('loading'); btn.disabled = true;
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    const code = 'BACHAT' + Math.random().toString(36).slice(2, 7).toUpperCase();
    await db.collection('users').doc(cred.user.uid).set({
      name, phone, email, role: 'user', balance: 0,
      totalSaved: 0, totalCashback: 0, totalDeposits: 0, totalWithdrawn: 0,
      referralCode: code, referredBy: ref || null, bankDetails: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast('Account created — welcome to Bachat! 🎉', 'ok');
    confetti();
  } catch (err) { toast(authMsg(err), 'err'); }
  btn.classList.remove('loading'); btn.disabled = false;
};

function authMsg(err) {
  const map = {
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/invalid-credential': 'Incorrect email or password',
    'auth/email-already-in-use': 'This email is already registered',
    'auth/weak-password': 'Password must be at least 6 characters',
    'auth/invalid-email': 'Please enter a valid email',
    'auth/too-many-requests': 'Too many attempts — try again in a minute',
    'auth/network-request-failed': 'Network error — check your connection'
  };
  return map[err.code] || err.message;
}

/* ══════════ AUTH STATE ══════════ */
auth.onAuthStateChanged(async user => {
  unsub.forEach(u => u()); unsub = [];
  if (!user) {
    currentUser = null; userDoc = null; lastBalance = null;
    $('#app').classList.add('hidden');
    $('#auth-view').classList.remove('hidden');
    return;
  }
  try {
    const snap = await db.collection('users').doc(user.uid).get();
    if (!snap.exists) { await auth.signOut(); return toast('Profile not found. Contact support.', 'err'); }
    currentUser = user; userDoc = snap;
    $('#auth-view').classList.add('hidden');
    $('#app').classList.remove('hidden');
    bindUserListener();
    renderHeader();
    switchView('home');
  } catch (e) {
    toast('Could not load profile — check connection', 'err');
  }
});

function bindUserListener() {
  unsub.push(db.collection('users').doc(currentUser.uid).onSnapshot(s => {
    userDoc = s;
    if (currentView === 'home') renderHome();
    if (currentView === 'wallet') renderWallet();
    if (currentView === 'settings') renderSettings();
    renderHeader();
  }));
}

/* ══════════ HEADER ══════════ */
function renderHeader() {
  if (!userDoc) return;
  const u = userDoc.data();
  const titles = { home: ['Welcome back 👋', u.name || 'Saver'], plans: ['Grow your money', 'Savings Plans'],
                   wallet: ['Your money, always yours', 'My Wallet'], settings: ['Manage everything', 'Settings'] };
  const [sub, title] = titles[currentView];
  $('#app-header').innerHTML = `
    <div class="hd-left">
      <div class="hd-avatar">${esc((u.name || 'B')[0].toUpperCase())}</div>
      <div class="hd-title"><small>${sub}</small><b>${esc(title)}</b></div>
    </div>
    <div class="hd-right">
      <button class="hd-icon" id="hd-bell" type="button" aria-label="Notifications">${IC.bell}<span class="hd-dot"></span></button>
    </div>`;
  $('#hd-bell').onclick = showNotifications;
}

/* ══════════ NAV ══════════ */
$$('.nav-btn').forEach(b => b.onclick = () => switchView(b.dataset.view));
function switchView(v) {
  currentView = v;
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  ['home','plans','wallet','settings'].forEach(x => $('#view-' + x).classList.toggle('hidden', x !== v));
  renderHeader();
  ({ home: renderHome, plans: renderPlans, wallet: renderWallet, settings: renderSettings })[v]();
  window.scrollTo({ top: 0 });
}

/* ══════════ HOME ══════════ */
async function renderHome() {
  const u = userDoc.data();
  const el = $('#view-home');
  el.innerHTML = `
    <div class="balance-hero">
      <div class="bh-label">Total Balance <span id="bal-eye" role="button">${balanceVisible ? IC.eye : IC.eyeOff}</span></div>
      <div class="bh-amount" id="bh-amt">${balanceVisible ? inr(u.balance) : '₹ ••••••'}</div>
      <div class="bh-row">
        <div class="bh-stat"><small>Total Saved</small><b>${balanceVisible ? inr(u.totalSaved) : '•••'}</b></div>
        <div class="bh-stat"><small>Cashback</small><b>${balanceVisible ? inr(u.totalCashback) : '•••'}</b></div>
        <div class="bh-stat"><small>Active Plans</small><b id="bh-plans">…</b></div>
      </div>
    </div>

    <div class="card">
      <div class="quick-grid">
        <button class="quick-item" data-q="save"><div class="quick-ic qi-1">${IC.plus}</div><span>Add Money</span></button>
        <button class="quick-item" data-q="plans"><div class="quick-ic qi-2">${IC.target}</div><span>Plans</span></button>
        <button class="quick-item" data-q="withdraw"><div class="quick-ic qi-3">${IC.up}</div><span>Withdraw</span></button>
        <button class="quick-item" data-q="refer"><div class="quick-ic qi-4">${IC.gift}</div><span>Refer</span></button>
      </div>
    </div>

    <div id="home-ann"></div>
    <div id="home-trust"></div>
    <div id="home-about"></div>

    <div class="sec-head"><h3>Featured Plans</h3><button id="see-plans" type="button">See all ›</button></div>
    <div id="home-featured"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;

  if (balanceVisible) countUp($('#bh-amt'), Number(u.balance || 0));
  $('#bal-eye').onclick = () => { balanceVisible = !balanceVisible; store.set('bgBal', balanceVisible ? 'on' : 'off'); renderHome(); };
  $$('#view-home .quick-item').forEach(b => b.onclick = () => {
    ({ save: () => openDeposit(), plans: () => switchView('plans'),
       withdraw: () => openWithdraw(), refer: () => showRefer() })[b.dataset.q]();
  });
  $('#see-plans').onclick = () => switchView('plans');

  try {
    const act = await db.collection('investments').where('uid', '==', currentUser.uid)
      .where('status', '==', 'active').get();
    const bp = $('#bh-plans'); if (bp) bp.textContent = act.size;
  } catch (e) { const bp = $('#bh-plans'); if (bp) bp.textContent = '0'; }

  loadAnnouncements('#home-ann');
  loadAppContent();
  loadFeaturedPlans();
}

async function loadFeaturedPlans() {
  const el = $('#home-featured');
  try {
    const snap = await db.collection('plans').where('active', '==', true).orderBy('minAmount').limit(2).get();
    if (snap.empty) { el.innerHTML = `<div class="card empty">${IC.target}<p>No plans live yet — check back soon!</p></div>`; return; }
    el.innerHTML = '';
    snap.forEach(d => el.appendChild(planCard(d)));
  } catch (e) { el.innerHTML = `<div class="card empty">${IC.info}<p>Couldn't load plans — pull to retry.</p></div>`; }
}

/* ══════════ TRUST & ABOUT (admin-editable) ══════════ */
const TRUST_ICONS = [IC.shield, IC.zap, IC.bank, IC.check];
async function loadAppContent() {
  let c = {};
  try { const d = await db.collection('appContent').doc('main').get(); c = d.exists ? d.data() : {}; } catch (e) {}
  const trust = c.trustPoints || [
    { t: 'Bank-grade Security', d: 'AES-256 encrypted' },
    { t: 'Instant Withdrawals', d: 'Money in 24 hrs' },
    { t: 'RBI-compliant Partners', d: 'Regulated rails' },
    { t: 'Zero Hidden Fees', d: '100% transparent' }
  ];
  $('#home-trust').innerHTML = `
    <div class="card"><div class="trust-strip">
      ${trust.map((x, i) => `<div class="trust-item"><div class="trust-ic">${TRUST_ICONS[i % TRUST_ICONS.length]}</div><span>${esc(x.t)}</span></div>`).join('')}
    </div></div>`;

  const about = c.aboutPoints || [
    { t: 'Real savings, real rewards', d: 'Every rupee you save earns actual cashback from our merchant partners — not points that expire.' },
    { t: 'Your money stays liquid', d: 'Withdraw anytime after your plan duration. No lock-in tricks, no penalties.' },
    { t: 'Fully transparent', d: 'Every transaction is visible in your wallet history with receipts and status.' }
  ];
  $('#home-about').innerHTML = `
    <div class="sec-head"><h3>${esc(c.aboutTitle || 'Why thousands trust Bachat')}</h3></div>
    <div class="card"><div class="about-list">
      ${about.map(a => `<div class="about-row"><div class="about-ic">${IC.check}</div>
        <div><b>${esc(a.t)}</b><p>${esc(a.d)}</p></div></div>`).join('')}
    </div></div>`;
}

/* ══════════ ANNOUNCEMENTS ══════════ */
async function loadAnnouncements(sel) {
  const el = $(sel);
  try {
    const snap = await db.collection('announcements').orderBy('createdAt', 'desc').limit(3).get();
    if (snap.empty) return;
    let h = `<div class="sec-head"><h3>Announcements</h3></div><div class="card" style="padding:4px 16px">`;
    snap.forEach(d => {
      const a = d.data();
      h += `<div class="ann-item"><div class="dot"></div><div>
        <b>${esc(a.title)}</b><p>${esc(a.body)}</p><time>${fdate(a.createdAt)}</time></div></div>`;
    });
    el.innerHTML = h + '</div>';
  } catch (e) {}
}

/* ══════════ PLANS ══════════ */
async function renderPlans() {
  const el = $('#view-plans');
  el.innerHTML = `<div class="banner banner-purple">${IC.spark}
      <div><h4>Savings Plans with Cashback</h4>
      <p>Save on your schedule, earn cashback on completion. No false promises — full terms on every plan.</p></div>
    </div>
    <div id="plans-list"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>
    <div class="sec-head"><h3>My Active Plans</h3></div>
    <div id="my-plans"><div class="skel skel-card" style="height:110px"></div></div>`;

  try {
    const snap = await db.collection('plans').where('active', '==', true).orderBy('minAmount').get();
    plansCache = snap.docs;
    const list = $('#plans-list'); list.innerHTML = '';
    if (snap.empty) list.innerHTML = `<div class="card empty">${IC.target}<p>No plans available right now.</p></div>`;
    snap.forEach(d => list.appendChild(planCard(d)));
  } catch (e) {
    $('#plans-list').innerHTML = `<div class="card empty">${IC.info}<p>Couldn't load plans — check connection.</p></div>`;
  }

  try {
    const mine = await db.collection('investments').where('uid', '==', currentUser.uid).get();
    const myEl = $('#my-plans'); myEl.innerHTML = '';
    const docs = mine.docs.sort((a, b) => (b.data().createdAt?.seconds || 0) - (a.data().createdAt?.seconds || 0));
    if (!docs.length) myEl.innerHTML = `<div class="card empty">${IC.doc}<p>You haven't joined a plan yet.</p></div>`;
    docs.forEach(d => {
      const i = d.data();
      const chipCls = i.status === 'active' ? 'chip-green' : i.status === 'completed' ? 'chip-blue' : 'chip-amber';
      const started = i.createdAt?.seconds ? i.createdAt.seconds * 1000 : Date.now();
      const total = (i.durationDays || 1) * 864e5;
      const pct = i.status === 'completed' ? 100 : Math.max(3, Math.min(100, Math.round((Date.now() - started) / total * 100)));
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <div style="min-width:0"><b style="font-size:.92rem">${esc(i.planName)}</b>
          <div class="muted">Started ${fdate(i.createdAt)} · ${i.durationDays} days</div></div>
          <span class="chip ${chipCls}">${esc(i.status)}</span></div>
        <div class="divider"></div>
        <div style="display:flex;justify-content:space-between;gap:8px;font-size:.8rem;flex-wrap:wrap">
          <span class="muted">Saved: <b style="color:var(--ink)">${inr(i.amount)}</b></span>
          <span class="muted">Cashback: <b style="color:var(--green)">+${inr(i.cashbackAmount)}</b></span></div>
        <div class="mp-progress"><i style="width:${pct}%"></i></div>
        <div class="mp-meta"><span>${pct}% of duration</span><span>${i.status === 'completed' ? 'Paid out' : 'Day ' + Math.max(1, Math.ceil((Date.now() - started) / 864e5)) + ' / ' + i.durationDays}</span></div>`;
      myEl.appendChild(div);
    });
  } catch (e) {}
}

const PLAN_COLORS = [['#0BA968', '#34D399'], ['#2563EB', '#60A5FA'], ['#7C3AED', '#C084FC'], ['#E8930C', '#F5B93F']];
const PLAN_ICONS = [IC.spark, IC.star, IC.zap, IC.gift];
function planCard(doc) {
  const p = doc.data();
  const idx = (p.minAmount || 0) % 97 % PLAN_COLORS.length;
  const [c1, c2] = PLAN_COLORS[idx];
  const perks = p.perks || ['Cashback credited on plan completion', 'Withdraw anytime after maturity', 'Full transaction receipts'];
  const div = document.createElement('div');
  div.className = 'plan-card';
  div.innerHTML = `
    ${p.popular ? '<div class="ribbon">POPULAR</div>' : ''}
    <div class="pc-head">
      <div style="min-width:0"><div class="pc-name">${esc(p.name)}</div><div class="pc-sub">${esc(p.tagline || 'Savings plan')}</div></div>
      <div class="pc-badge" style="background:linear-gradient(135deg,${c1},${c2})">${PLAN_ICONS[idx]}</div>
    </div>
    <div class="pc-row">
      <div class="pc-cell"><small>Start with</small><b>${inr(p.minAmount)}</b></div>
      <div class="pc-cell"><small>Cashback</small><b style="color:var(--green)">${p.cashbackPct}%</b></div>
      <div class="pc-cell"><small>Duration</small><b>${p.durationDays} days</b></div>
    </div>
    <div class="pc-perks">${perks.map(k => `<div class="pc-perk">${IC.check}<span>${esc(k)}</span></div>`).join('')}</div>
    <button class="btn btn-primary btn-block" type="button">Start Saving ${inr(p.minAmount)}</button>`;
  div.querySelector('.btn').onclick = () => joinPlan(doc.id, p);
  return div;
}

function joinPlan(planId, p) {
  const u = userDoc.data();
  const sheet = openSheet(`
    <div class="sheet-title">Join ${esc(p.name)}</div>
    <div class="sheet-sub">Cashback ${p.cashbackPct}% after ${p.durationDays} days · wallet balance ${inr(u.balance)}</div>
    <div class="amount-input"><span>₹</span><input id="join-amt" type="number" inputmode="numeric" placeholder="${p.minAmount}" min="${p.minAmount}"></div>
    <div class="amount-quick">${[p.minAmount, p.minAmount * 2, p.minAmount * 5].map(a => `<button type="button" data-a="${a}">${inr(a)}</button>`).join('')}</div>
    <div class="upi-note"><b>How it works:</b> the amount moves from your wallet into the plan.
    On completion you get your savings back <b>plus ${p.cashbackPct}% cashback</b>. Early exit returns your principal — cashback is only earned on completion.</div>
    <button class="btn btn-primary btn-block" id="join-go" type="button">Confirm & Start Plan</button>`);
  sheet.querySelectorAll('.amount-quick button').forEach(b => b.onclick = () => sheet.querySelector('#join-amt').value = b.dataset.a);
  sheet.querySelector('#join-go').onclick = async () => {
    const btn = sheet.querySelector('#join-go');
    const amt = Number(sheet.querySelector('#join-amt').value);
    if (!amt || amt < p.minAmount) return toast(`Minimum for this plan is ${inr(p.minAmount)}`, 'err');
    if (amt > u.balance) { closeSheet(); return toast('Insufficient balance — add money first', 'err'); }
    btn.classList.add('loading'); btn.disabled = true;
    try {
      const cashback = Math.round(amt * p.cashbackPct / 100 * 100) / 100;
      const batch = db.batch();
      const ref = db.collection('investments').doc();
      batch.set(ref, { uid: currentUser.uid, planId, planName: p.name, amount: amt,
        cashbackPct: p.cashbackPct, cashbackAmount: cashback, durationDays: p.durationDays,
        status: 'active', createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      batch.update(db.collection('users').doc(currentUser.uid), {
        balance: firebase.firestore.FieldValue.increment(-amt),
        totalSaved: firebase.firestore.FieldValue.increment(amt) });
      batch.set(db.collection('transactions').doc(), {
        uid: currentUser.uid, type: 'invest', amount: amt, status: 'completed',
        note: `Joined ${p.name}`, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      await batch.commit();
      closeSheet();
      confetti(34);
      toast(`You're in! ${inr(cashback)} cashback on completion 🎉`, 'ok');
      if (currentView === 'plans') renderPlans();
      if (currentView === 'home') renderHome();
    } catch (e) {
      btn.classList.remove('loading'); btn.disabled = false;
      toast('Could not join plan — try again', 'err');
    }
  };
}

/* ══════════ WALLET ══════════ */
async function renderWallet() {
  const u = userDoc.data();
  const el = $('#view-wallet');
  el.innerHTML = `
    <div class="wallet-hero">
      <div class="wh-top"><span style="color:rgba(255,255,255,.88);font-size:.74rem;font-weight:700">Available Balance</span>
        <span class="chip" style="background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.25)">${IC.shield.replace('<svg', '<svg style=&quot;width:12px;height:12px;fill:#fff&quot;')} Verified</span></div>
      <div class="wh-bal">${balanceVisible ? inr(u.balance) : '₹ ••••••'}</div>
      <div class="wh-btns">
        <button class="btn" id="w-dep" type="button">${IC.down} Add Money</button>
        <button class="btn" id="w-wd" type="button">${IC.up} Withdraw</button>
      </div>
    </div>

    <div class="sec-head"><h3>My Bank Account</h3></div>
    <div id="bank-slot"></div>

    <div class="stat-grid">
      <div class="stat-cell"><div class="stat-ic" style="background:linear-gradient(135deg,#0BA968,#34D399)">${IC.down}</div>
        <div><small>Total Deposits</small><b>${inr(u.totalDeposits || 0)}</b></div></div>
      <div class="stat-cell"><div class="stat-ic" style="background:linear-gradient(135deg,#E5484D,#F87171)">${IC.up}</div>
        <div><small>Total Withdrawn</small><b>${inr(u.totalWithdrawn || 0)}</b></div></div>
      <div class="stat-cell"><div class="stat-ic" style="background:linear-gradient(135deg,#2563EB,#60A5FA)">${IC.target}</div>
        <div><small>Total Saved</small><b>${inr(u.totalSaved || 0)}</b></div></div>
      <div class="stat-cell"><div class="stat-ic" style="background:linear-gradient(135deg,#E8930C,#F5B93F)">${IC.gift}</div>
        <div><small>Cashback Earned</small><b>${inr(u.totalCashback || 0)}</b></div></div>
    </div>
    <div class="sec-head"><h3>Transaction History</h3></div>
    <div class="card" style="padding:4px 16px" id="tx-list"><div class="skel skel-row"></div><div class="skel skel-row"></div><div class="skel skel-row"></div></div>`;

  $('#w-dep').onclick = openDeposit;
  $('#w-wd').onclick = openWithdraw;
  renderBankSlot();

  try {
    const tx = await db.collection('transactions').where('uid', '==', currentUser.uid).limit(30).get();
    const list = $('#tx-list');
    const docs = tx.docs.sort((a, b) => (b.data().createdAt?.seconds || 0) - (a.data().createdAt?.seconds || 0));
    if (!docs.length) { list.innerHTML = `<div class="empty">${IC.doc}<p>No transactions yet. Add money to get started!</p></div>`; return; }
    list.innerHTML = '';
    docs.forEach((d, i) => {
      const t = d.data();
      const isIn = ['deposit', 'cashback', 'maturity'].includes(t.type);
      const cls = t.type === 'cashback' ? 'tx-cb' : isIn ? 'tx-in' : 'tx-out';
      const icon = t.type === 'cashback' ? IC.gift : isIn ? IC.down : IC.up;
      const labels = { deposit: 'Wallet Deposit', withdraw: 'Withdrawal', invest: t.note || 'Plan Investment',
                       cashback: 'Cashback Reward', maturity: 'Plan Maturity Payout' };
      const chipCls = t.status === 'pending' ? 'chip-amber' : t.status === 'completed' ? 'chip-green' : 'chip-red';
      const row = document.createElement('div');
      row.className = 'tx-item';
      row.style.animationDelay = Math.min(i * 40, 400) + 'ms';
      row.innerHTML = `
        <div class="tx-ic ${cls}">${icon}</div>
        <div class="tx-mid"><b>${esc(labels[t.type] || t.type)}</b><small>${fdate(t.createdAt)} · #${d.id.slice(0, 8).toUpperCase()}${t.utr ? ' · UTR ' + esc(t.utr) : ''}</small></div>
        <div class="tx-right"><b class="${isIn ? 'tx-amt-in' : 'tx-amt-out'}">${isIn ? '+' : '−'}${inr(t.amount)}</b>
        <span class="chip ${chipCls}" style="margin-top:3px">${esc(t.status)}</span></div>`;
      list.appendChild(row);
    });
  } catch (e) {
    $('#tx-list').innerHTML = `<div class="empty">${IC.info}<p>Couldn't load transactions.</p></div>`;
  }
}

/* ── My bank account slot in wallet ── */
function renderBankSlot() {
  const u = userDoc.data();
  const bd = u.bankDetails;
  const slot = $('#bank-slot');
  if (!slot) return;
  if (bd && bd.accountNumber) {
    slot.innerHTML = `
      <div class="bank-card">
        <button class="bc-edit" id="bd-edit" type="button" aria-label="Edit bank details">${IC.edit}</button>
        <div class="bc-chip"></div>
        <div class="bc-num">•••• ${esc(String(bd.accountNumber).slice(-4))}</div>
        <div class="bc-row">
          <div><small>Account Holder</small><b>${esc(bd.holderName)}</b></div>
          <div><small>Bank</small><b>${esc(bd.bankName)}</b></div>
          <div><small>IFSC</small><b>${esc(bd.ifsc)}</b></div>
        </div>
      </div>
      <button class="btn btn-ghost btn-block btn-sm" id="bd-open" type="button" style="margin-bottom:14px">${IC.bank} View / Edit Full Details</button>
      <div style="height:2px"></div>`;
    $('#bd-edit').onclick = () => bankEditor(bd);
    $('#bd-open').onclick = () => bankEditor(bd);
  } else {
    slot.innerHTML = `
      <button class="bank-empty btn-block" id="bd-add" type="button" style="margin-bottom:14px;text-align:left">
        <div class="be-ic">${IC.bank}</div>
        <div style="flex:1;min-width:0"><b>Add your bank account</b>
        <p>Needed to receive withdrawals — takes 30 seconds</p></div>
        ${IC.arrowR}
      </button>`;
    $('#bd-add').onclick = () => bankEditor(null);
  }
}

/* ── Bank details add / edit ── */
function bankEditor(bd) {
  bd = bd || {};
  const s = openSheet(`
    <div class="sheet-title">${bd.accountNumber ? 'Edit Bank Details' : 'Add Bank Account'}</div>
    <div class="sheet-sub">Withdrawals are paid to this account · verified before every payout</div>
    <label class="field"><span>Account Holder Name</span><input id="bk-name" value="${esc(bd.holderName || userDoc.data().name || '')}" placeholder="As per bank records"></label>
    <div style="height:12px"></div>
    <label class="field"><span>Bank Name</span><input id="bk-bank" value="${esc(bd.bankName || '')}" placeholder="e.g. State Bank of India"></label>
    <div style="height:12px"></div>
    <label class="field"><span>Account Number</span><input id="bk-acc" inputmode="numeric" value="${esc(bd.accountNumber || '')}" placeholder="e.g. 50100234567890"></label>
    <div style="height:12px"></div>
    <label class="field"><span>IFSC Code</span><input id="bk-ifsc" value="${esc(bd.ifsc || '')}" placeholder="e.g. SBIN0001234" style="text-transform:uppercase"></label>
    <div style="height:12px"></div>
    <label class="field"><span>UPI ID <em>(optional)</em></span><input id="bk-upi" value="${esc(bd.upiId || '')}" placeholder="yourname@upi"></label>
    <div style="height:18px"></div>
    <div class="upi-note"><b>🔒 Safe & private.</b> Your bank details are encrypted, visible only to you and the payout team, and used solely for withdrawals you request.</div>
    <button class="btn btn-primary btn-block" id="bk-save" type="button">Save Bank Details</button>`);
  s.querySelector('#bk-save').onclick = async () => {
    const btn = s.querySelector('#bk-save');
    const holderName = s.querySelector('#bk-name').value.trim();
    const bankName = s.querySelector('#bk-bank').value.trim();
    const accountNumber = s.querySelector('#bk-acc').value.replace(/\s/g, '');
    const ifsc = s.querySelector('#bk-ifsc').value.trim().toUpperCase();
    const upiId = s.querySelector('#bk-upi').value.trim();
    if (holderName.length < 3) return toast('Enter the account holder name', 'err');
    if (!bankName) return toast('Enter your bank name', 'err');
    if (!/^\d{8,18}$/.test(accountNumber)) return toast('Account number must be 8–18 digits', 'err');
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) return toast('Enter a valid IFSC (e.g. SBIN0001234)', 'err');
    if (upiId && !/^\S+@\S+$/.test(upiId)) return toast('UPI ID looks invalid (e.g. name@upi)', 'err');
    btn.classList.add('loading'); btn.disabled = true;
    try {
      await db.collection('users').doc(currentUser.uid).update({
        bankDetails: { holderName, bankName, accountNumber, ifsc, upiId: upiId || null,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp() } });
      closeSheet();
      confetti(20);
      toast(bd.accountNumber ? 'Bank details updated ✓' : 'Bank account added ✓', 'ok');
    } catch (e) {
      btn.classList.remove('loading'); btn.disabled = false;
      toast('Could not save — try again', 'err');
    }
  };
}

/* ══════════ DEPOSIT — admin payment method → UTR + screenshot proof ══════════ */
async function openDeposit() {
  const sheet = openSheet(`
    <div class="sheet-title">Add Money to Wallet</div>
    <div class="sheet-sub">Pay via UPI / bank transfer · verified & credited by our team</div>
    <div class="amount-input"><span>₹</span><input id="dep-amt" type="number" inputmode="numeric" placeholder="500" min="50"></div>
    <div class="amount-quick">${[100, 300, 500, 1000].map(a => `<button type="button" data-a="${a}">₹${a}</button>`).join('')}</div>
    <div class="upi-note"><b>How deposits work:</b> choose an amount, pay to the official account shown next,
    then enter your <b>UTR / reference number</b> and upload a <b>payment screenshot</b>.
    Your wallet is credited after verification (usually under 30 minutes).</div>
    <button class="btn btn-primary btn-block" id="dep-go" type="button">Continue</button>`);
  sheet.querySelectorAll('.amount-quick button').forEach(b => b.onclick = () => sheet.querySelector('#dep-amt').value = b.dataset.a);
  sheet.querySelector('#dep-go').onclick = () => {
    const amt = Number(sheet.querySelector('#dep-amt').value);
    if (!amt || amt < 50) return toast('Minimum deposit is ₹50', 'err');
    depositStepMethod(amt);
  };
}

/* step 2: pick an admin-published payment method */
async function depositStepMethod(amt) {
  const sheet = openSheet(`
    <div class="sheet-title">Pay ${inr(amt)}</div>
    <div class="sheet-sub">Use any UPI app (GPay / PhonePe / Paytm) or net banking, then tap "I've Paid"</div>
    <div id="dep-methods"><div class="skel skel-row"></div><div class="skel skel-row"></div></div>`);
  let methods = [];
  try {
    const snap = await db.collection('paymentMethods').where('active', '==', true).get();
    methods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {}
  const box = sheet.querySelector('#dep-methods');
  if (!methods.length) {
    box.innerHTML = `<div class="empty">${IC.info}<p>Deposits aren't open right now.<br>Please try again shortly or contact support.</p></div>`;
    return;
  }
  let sel = methods[0];
  const draw = () => {
    box.innerHTML = methods.map((m, i) => `
      <div class="paym ${m.id === sel.id ? 'sel' : ''}" data-id="${m.id}">
        <div class="paym-head">
          <span class="chip ${m.type === 'upi' ? 'chip-blue' : 'chip-green'}">${m.type === 'upi' ? 'UPI' : 'BANK'}</span>
          <b>${esc(m.label || (m.type === 'upi' ? 'UPI Payment' : 'Bank Transfer'))}</b>
        </div>
        ${m.type === 'upi'
          ? `<div class="upi-id-pill">${esc(m.upiId)}</div>`
          : `<div class="bank-grid">
              <div><small>Account Name</small><b>${esc(m.accountName || '—')}</b></div>
              <div><small>Account No.</small><b>${esc(m.accountNumber || '—')}</b></div>
              <div><small>IFSC</small><b>${esc(m.ifsc || '—')}</b></div>
              <div><small>Bank</small><b>${esc(m.bankName || '—')}</b></div>
            </div>`}
        ${m.note ? `<p class="muted" style="margin-top:8px">${esc(m.note)}</p>` : ''}
        <button class="btn btn-soft btn-sm" type="button" data-copy="${m.id}">${IC.copy} Copy Details</button>
      </div>`).join('') +
      `<div style="height:6px"></div>
       <button class="btn btn-primary btn-block" id="dep-paid" type="button">${IC.check} I've Paid — Submit Proof</button>`;
    box.querySelectorAll('.paym').forEach(pm => pm.onclick = e => {
      if (e.target.closest('[data-copy]')) return;
      sel = methods.find(x => x.id === pm.dataset.id); draw();
    });
    box.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => {
      const m = methods.find(x => x.id === b.dataset.copy);
      const txt = m.type === 'upi' ? `Pay to UPI: ${m.upiId}` :
        `Bank: ${m.bankName}\nA/C Name: ${m.accountName}\nA/C No: ${m.accountNumber}\nIFSC: ${m.ifsc}`;
      navigator.clipboard?.writeText(txt);
      toast('Payment details copied', 'ok');
    });
    box.querySelector('#dep-paid').onclick = () => depositStepProof(amt, sel);
  };
  draw();
}

/* step 3: UTR + screenshot */
function depositStepProof(amt, method) {
  let proofData = null;
  const sheet = openSheet(`
    <div class="sheet-title">Verify Your Payment</div>
    <div class="sheet-sub">${inr(amt)} paid to <b>${esc(method.label || 'official account')}</b> · find the 12-digit UTR in your UPI app's payment details</div>
    <label class="field"><span>UTR / Reference Number</span><input id="dep-utr" inputmode="numeric" maxlength="22" placeholder="e.g. 418723456789"></label>
    <div style="height:14px"></div>
    <input type="file" id="dep-proof" accept="image/*" hidden>
    <label class="file-drop" for="dep-proof" id="dep-drop">
      ${IC.upload}<b>Upload payment screenshot</b><small>JPG / PNG · auto-compressed</small>
    </label>
    <img id="dep-preview" class="proof-preview hidden" alt="Payment proof preview">
    <div style="height:6px"></div>
    <button class="btn btn-primary btn-block" id="dep-submit" type="button">Submit for Verification</button>
    <p class="muted" style="text-align:center;margin-top:10px">Fake or mismatched proofs lead to account review. One deposit per payment.</p>`);

  sheet.querySelector('#dep-proof').onchange = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) return toast('Please choose an image file', 'err');
    try {
      proofData = await readImageCompressed(file, 900, .72);
      if (proofData.length > 750000) return toast('Screenshot too large — please crop it and retry', 'err');
      const pv = sheet.querySelector('#dep-preview');
      pv.src = proofData; pv.classList.remove('hidden');
      sheet.querySelector('#dep-drop').innerHTML = `${IC.check}<b>Screenshot attached ✓</b><small>Tap to replace</small>`;
    } catch (err) { toast('Could not read image — try another', 'err'); }
  };

  sheet.querySelector('#dep-submit').onclick = async () => {
    const btn = sheet.querySelector('#dep-submit');
    const utr = sheet.querySelector('#dep-utr').value.trim();
    if (!/^[A-Za-z0-9]{8,22}$/.test(utr)) return toast('Enter a valid UTR / reference number (8–22 characters)', 'err');
    if (!proofData) return toast('Please upload your payment screenshot', 'err');
    btn.classList.add('loading'); btn.disabled = true;
    showLoader('Submitting proof…');
    try {
      await db.collection('transactions').add({
        uid: currentUser.uid, type: 'deposit', amount: amt, status: 'pending',
        utr, proof: proofData,
        payMethod: { id: method.id, label: method.label || '', type: method.type,
          upiId: method.upiId || null, accountNumber: method.accountNumber || null },
        note: 'Awaiting payment verification',
        createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      hideLoader();
      const ok = openSheet(`
        <div class="success-check">${IC.check}</div>
        <div class="sheet-title" style="text-align:center">Deposit Submitted!</div>
        <div class="sheet-sub" style="text-align:center">We're verifying your payment of <b>${inr(amt)}</b> (UTR ${esc(utr)}).
        Your wallet will be credited shortly — watch the status in Transaction History.</div>
        <button class="btn btn-primary btn-block" id="ok-done" type="button">Done</button>`);
      ok.querySelector('#ok-done').onclick = () => { closeSheet(); if (currentView === 'wallet') renderWallet(); };
      confetti(30);
      if (currentView === 'wallet') renderWallet();
    } catch (e) {
      hideLoader();
      btn.classList.remove('loading'); btn.disabled = false;
      toast('Submission failed — check connection & retry', 'err');
    }
  };
}

/* compress an image file to a data URL (max dimension, jpeg quality) */
function readImageCompressed(file, maxDim, quality) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, maxDim / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = rej;
      img.src = r.result;
    };
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

/* ══════════ WITHDRAW — to saved bank account / UPI ══════════ */
function openWithdraw() {
  const u = userDoc.data();
  const bd = u.bankDetails;
  const hasBank = bd && bd.accountNumber;
  const hasUpi = bd && bd.upiId;
  let dest = hasBank ? 'bank' : (hasUpi ? 'upi' : null);
  const sheet = openSheet(`
    <div class="sheet-title">Withdraw Funds</div>
    <div class="sheet-sub">Available: ${inr(u.balance)} · paid within 24 hrs after review</div>
    <div class="amount-input"><span>₹</span><input id="wd-amt" type="number" inputmode="numeric" placeholder="100" min="100"></div>
    <div style="height:8px"></div>
    <div class="sheet-sub" style="margin-bottom:8px;font-weight:700;color:var(--ink)">Receive money in</div>
    <div id="wd-dests">
      ${hasBank ? `
      <div class="dest ${dest === 'bank' ? 'sel' : ''}" data-d="bank">
        <div class="dest-ic">${IC.bank}</div>
        <div><b>${esc(bd.bankName)} •••• ${esc(String(bd.accountNumber).slice(-4))}</b>
        <small>${esc(bd.holderName)} · IFSC ${esc(bd.ifsc)}</small></div>
        ${IC.check.replace('<svg', '<svg class="dest-ck"')}
      </div>` : ''}
      ${hasUpi ? `
      <div class="dest ${dest === 'upi' ? 'sel' : ''}" data-d="upi">
        <div class="dest-ic">${IC.zap}</div>
        <div><b>${esc(bd.upiId)}</b><small>UPI transfer</small></div>
        ${IC.check.replace('<svg', '<svg class="dest-ck"')}
      </div>` : ''}
      ${!hasBank && !hasUpi ? `
      <button class="bank-empty btn-block" id="wd-addbank" type="button" style="text-align:left">
        <div class="be-ic">${IC.bank}</div>
        <div style="flex:1;min-width:0"><b>Add a bank account first</b>
        <p>Withdrawals need a verified destination</p></div>${IC.arrowR}
      </button>` : ''}
    </div>
    <div style="height:6px"></div>
    <div class="upi-note"><b>No lock-in, no fees.</b> Withdrawals are reviewed for security and paid out
    within 24 hours. Money in active plans becomes available when the plan completes.</div>
    ${(hasBank || hasUpi) ? '<button class="btn btn-primary btn-block" id="wd-go" type="button">Request Withdrawal</button>' : ''}`);

  const addBtn = sheet.querySelector('#wd-addbank');
  if (addBtn) addBtn.onclick = () => bankEditor(null);
  sheet.querySelectorAll('.dest').forEach(d => d.onclick = () => {
    dest = d.dataset.d;
    sheet.querySelectorAll('.dest').forEach(x => x.classList.toggle('sel', x.dataset.d === dest));
  });
  const go = sheet.querySelector('#wd-go');
  if (!go) return;
  go.onclick = async () => {
    const btn = go;
    const amt = Number(sheet.querySelector('#wd-amt').value);
    if (!amt || amt < 100) return toast('Minimum withdrawal is ₹100', 'err');
    if (amt > u.balance) return toast('Amount exceeds available balance', 'err');
    if (!dest) return toast('Choose where to receive the money', 'err');
    btn.classList.add('loading'); btn.disabled = true;
    try {
      const destInfo = dest === 'bank'
        ? { method: 'bank', holderName: bd.holderName, bankName: bd.bankName, accountNumber: bd.accountNumber, ifsc: bd.ifsc }
        : { method: 'upi', upiId: bd.upiId };
      const batch = db.batch();
      batch.set(db.collection('transactions').doc(), {
        uid: currentUser.uid, type: 'withdraw', amount: amt, status: 'pending',
        withdrawTo: destInfo, note: dest === 'bank' ? `To ${bd.bankName} •••• ${String(bd.accountNumber).slice(-4)}` : 'To UPI: ' + bd.upiId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      batch.update(db.collection('users').doc(currentUser.uid), {
        balance: firebase.firestore.FieldValue.increment(-amt) });
      await batch.commit();
      closeSheet();
      toast('Withdrawal requested — paid within 24 hrs', 'ok');
      if (currentView === 'wallet') renderWallet();
    } catch (e) {
      btn.classList.remove('loading'); btn.disabled = false;
      toast('Request failed — try again', 'err');
    }
  };
}

/* ══════════ SETTINGS ══════════ */
async function renderSettings() {
  const u = userDoc.data();
  const el = $('#view-settings');
  el.innerHTML = `
    <div class="card profile-card">
      <div class="profile-av">${esc((u.name || 'B')[0].toUpperCase())}</div>
      <div><b>${esc(u.name)}</b><p>${esc(u.email)}<br>${esc(u.phone || '')}</p></div>
    </div>
    <div class="card">
      <div class="about-row"><div class="about-ic">${IC.gift}</div>
        <div><b>Refer & Earn</b><p>Share your code — you both get ₹25 cashback when a friend completes their first plan.</p></div></div>
      <div class="ref-box"><b>${esc(u.referralCode || '—')}</b>
        <div>
          <button class="btn btn-soft btn-sm" id="cp-ref" type="button">${IC.copy} Copy</button>
          <button class="btn btn-green btn-sm" id="sh-ref" type="button">${IC.share} Share</button>
        </div></div>
    </div>

    <div class="set-group"><h4>Account</h4>
      <button class="set-item" data-s="edit" type="button"><div class="set-ic" style="background:linear-gradient(135deg,#2563EB,#60A5FA)">${IC.user}</div>
        <div class="set-mid"><b>Edit Profile</b><small>Name &amp; phone number</small></div>${IC.arrowR}</button>
      <button class="set-item" data-s="bank" type="button"><div class="set-ic" style="background:linear-gradient(135deg,#4C1DED,#A78BFA)">${IC.bank}</div>
        <div class="set-mid"><b>Bank Details</b><small>${u.bankDetails && u.bankDetails.accountNumber ? esc(u.bankDetails.bankName) + ' •••• ' + esc(String(u.bankDetails.accountNumber).slice(-4)) : 'Add account for withdrawals'}</small></div>${IC.arrowR}</button>
      <button class="set-item" data-s="kyc" type="button"><div class="set-ic" style="background:linear-gradient(135deg,#0BA968,#34D399)">${IC.lock}</div>
        <div class="set-mid"><b>Security</b><small>Change password, sessions</small></div>${IC.arrowR}</button>
      <button class="set-item" data-s="tx" type="button"><div class="set-ic" style="background:linear-gradient(135deg,#E8930C,#F5B93F)">${IC.doc}</div>
        <div class="set-mid"><b>Statements</b><small>Full transaction history</small></div>${IC.arrowR}</button>
    </div>

    <div class="set-group"><h4>Preferences</h4>
      <div class="set-item"><div class="set-ic" style="background:linear-gradient(135deg,#7C3AED,#C084FC)">${IC.bell}</div>
        <div class="set-mid"><b>Notifications</b><small>Cashback &amp; plan alerts</small></div>
        <div class="switch ${store.get('bgNotif', 'on') !== 'off' ? 'on' : ''}" id="sw-notif" role="switch"></div></div>
      <div class="set-item"><div class="set-ic" style="background:linear-gradient(135deg,#0891B2,#22D3EE)">${IC.eye}</div>
        <div class="set-mid"><b>Show Balances</b><small>Hide amounts on screen</small></div>
        <div class="switch ${balanceVisible ? 'on' : ''}" id="sw-bal" role="switch"></div></div>
    </div>

    <div class="set-group"><h4>Support & Legal</h4>
      <button class="set-item" data-s="faq" type="button"><div class="set-ic" style="background:linear-gradient(135deg,#2563EB,#60A5FA)">${IC.chat}</div>
        <div class="set-mid"><b>Help & FAQ</b><small>Answers in one tap</small></div>${IC.arrowR}</button>
      <button class="set-item" data-s="terms" type="button"><div class="set-ic" style="background:linear-gradient(135deg,#64748B,#94A3B8)">${IC.doc}</div>
        <div class="set-mid"><b>Terms &amp; Privacy</b><small>Plain-language, no fine print tricks</small></div>${IC.arrowR}</button>
      <button class="set-item" data-s="about" type="button"><div class="set-ic" style="background:var(--grad)">${IC.info}</div>
        <div class="set-mid"><b>About Bachat</b><small>v3.0 · Made in India 🇮🇳</small></div>${IC.arrowR}</button>
    </div>

    <button class="btn btn-danger btn-block" id="btn-logout" type="button">${IC.logout} Log Out</button>
    <p class="muted" style="text-align:center;margin:14px 0 4px;font-weight:600">Bachat v3.0 · 100% transparent micro-savings</p>`;

  $('#cp-ref').onclick = () => { navigator.clipboard?.writeText(u.referralCode); toast('Referral code copied', 'ok'); };
  $('#sh-ref').onclick = async () => {
    const text = `Join me on Bachat — save small amounts, earn real cashback! Use my code ${u.referralCode} when you sign up 💜`;
    if (navigator.share) { try { await navigator.share({ title: 'Bachat', text }); } catch (e) {} }
    else { navigator.clipboard?.writeText(text); toast('Invite message copied — paste anywhere!', 'ok'); }
  };
  $('#sw-notif').onclick = e => { const on = !e.currentTarget.classList.contains('on'); e.currentTarget.classList.toggle('on', on); store.set('bgNotif', on ? 'on' : 'off'); toast(on ? 'Notifications on' : 'Notifications off'); };
  $('#sw-bal').onclick = e => { balanceVisible = !balanceVisible; store.set('bgBal', balanceVisible ? 'on' : 'off'); e.currentTarget.classList.toggle('on', balanceVisible); };
  $('#btn-logout').onclick = () => auth.signOut();
  $$('#view-settings .set-item[data-s]').forEach(b => b.onclick = () => settingsSheet(b.dataset.s));
}

function settingsSheet(key) {
  const u = userDoc.data();
  if (key === 'edit') {
    const s = openSheet(`
      <div class="sheet-title">Edit Profile</div><div class="sheet-sub">Keep your details up to date</div>
      <label class="field"><span>Full Name</span><input id="ep-name" value="${esc(u.name)}"></label>
      <div style="height:12px"></div>
      <label class="field"><span>Phone</span><input id="ep-phone" value="${esc(u.phone || '')}"></label>
      <div style="height:18px"></div>
      <button class="btn btn-primary btn-block" id="ep-save" type="button">Save Changes</button>`);
    s.querySelector('#ep-save').onclick = async () => {
      const btn = s.querySelector('#ep-save');
      const nm = s.querySelector('#ep-name').value.trim();
      if (!nm) return toast('Name cannot be empty', 'err');
      btn.classList.add('loading'); btn.disabled = true;
      try {
        await db.collection('users').doc(currentUser.uid).update({
          name: nm, phone: s.querySelector('#ep-phone').value.trim() });
        closeSheet(); toast('Profile updated ✨', 'ok');
      } catch (e) {
        btn.classList.remove('loading'); btn.disabled = false;
        toast('Update failed — try again', 'err');
      }
    };
  }
  if (key === 'bank') bankEditor(u.bankDetails || null);
  if (key === 'kyc') {
    const s = openSheet(`
      <div class="sheet-title">Security</div><div class="sheet-sub">Signed in as ${esc(u.email)}</div>
      <div class="about-list">
        <div class="about-row"><div class="about-ic">${IC.lock}</div><div><b>Change password</b><p>We'll email you a secure reset link.</p></div></div>
      </div>
      <div style="height:16px"></div>
      <button class="btn btn-primary btn-block" id="pw-reset" type="button">Email Me a Reset Link</button>`);
    s.querySelector('#pw-reset').onclick = async () => {
      const btn = s.querySelector('#pw-reset');
      btn.classList.add('loading'); btn.disabled = true;
      try { await auth.sendPasswordResetEmail(u.email); closeSheet(); toast('Reset link sent to your email', 'ok'); }
      catch (e) { btn.classList.remove('loading'); btn.disabled = false; toast(e.message, 'err'); }
    };
  }
  if (key === 'tx') { switchView('wallet'); }
  if (key === 'faq') {
    const faqs = [
      ['Is Bachat an investment app?', 'No. Bachat is a micro-savings and cashback rewards app. Your savings stay yours — cashback comes from merchant partnerships, clearly shown on every plan. We never promise guaranteed high returns.'],
      ['How do deposits work?', 'Add money from the Wallet, pay to the official UPI/bank account shown in the app, then submit your UTR number and payment screenshot. Our team verifies and credits your wallet, usually within 30 minutes.'],
      ['How does cashback work?', 'Each plan shows an exact cashback % and duration. Complete the plan duration and the cashback is credited to your wallet automatically. Exit early and you simply get your savings back.'],
      ['When can I withdraw?', 'Wallet balance can be withdrawn anytime after your plan completes, to your saved bank account or UPI ID. Requests are paid within 24 hours, with live status tracking.'],
      ['Is my money safe?', 'Deposits are processed by RBI-regulated payment partners, and all data is encrypted. Full receipts for every rupee.'],
      ['Are there any fees?', 'No joining fees, no withdrawal fees, no hidden charges. What you see is exactly what you get.']
    ];
    const s = openSheet(`<div class="sheet-title">Help & FAQ</div><div class="sheet-sub">Straight answers, no jargon</div>
      ${faqs.map((f, i) => `<div class="faq-item" data-i="${i}"><button class="faq-q" type="button">${esc(f[0])} ${IC.chevD}</button>
      <div class="faq-a">${esc(f[1])}</div></div>`).join('')}`);
    s.querySelectorAll('.faq-q').forEach(q => q.onclick = () => q.parentElement.classList.toggle('open'));
  }
  if (key === 'terms') openSheet(`
    <div class="sheet-title">Terms & Privacy</div><div class="sheet-sub">The short, honest version</div>
    <div class="about-list">
      <div class="about-row"><div class="about-ic">${IC.check}</div><div><b>Your money is yours</b><p>Savings can be withdrawn per each plan's terms. We never lock funds beyond the stated duration.</p></div></div>
      <div class="about-row"><div class="about-ic">${IC.check}</div><div><b>Cashback, not "returns"</b><p>Rewards are marketing cashback funded by partners — never promised investment yields.</p></div></div>
      <div class="about-row"><div class="about-ic">${IC.check}</div><div><b>Your data stays private</b><p>We never sell personal data. Payments run over encrypted, regulated rails.</p></div></div>
    </div>`);
  if (key === 'about') openSheet(`
    <div class="sheet-title">About Bachat</div><div class="sheet-sub">Save smart. Earn cashback.</div>
    <div class="success-pop" style="background:var(--grad-soft)"><svg viewBox="0 0 48 48" style="width:42px;height:42px;fill:var(--p1)"><rect x="4" y="4" width="40" height="40" rx="12" fill="rgba(91,45,224,.12)"/><path d="M24 12c-5 0-9 3.4-9 8 0 3 1.8 5.3 4.5 6.6L18 36l6-3 6 3-1.5-9.4C31.2 25.3 33 23 33 20c0-4.6-4-8-9-8z" fill="var(--p1)"/><circle cx="24" cy="20" r="3.4" fill="#fff"/></svg></div>
    <p class="muted" style="line-height:1.7;text-align:center">Bachat helps you build a savings habit with small, flexible plans
    and real cashback rewards. Built with transparency at its core — every fee, reward and transaction is visible
    in the app.<br><br><b style="color:var(--ink)">Made with 💜 in India · v3.0</b></p>`);
}

/* ══════════ NOTIFICATIONS ══════════ */
async function showNotifications() {
  const s = openSheet(`<div class="sheet-title">Notifications</div><div class="sheet-sub">Latest updates</div><div id="notif-body"><div class="spinner"></div></div>`);
  try {
    const [ann, tx] = await Promise.all([
      db.collection('announcements').orderBy('createdAt', 'desc').limit(3).get(),
      db.collection('transactions').where('uid', '==', currentUser.uid).where('status', '==', 'completed').limit(3).get()
    ]);
    let h = '<div class="about-list">';
    tx.forEach(d => { const t = d.data();
      h += `<div class="about-row"><div class="about-ic">${IC.check}</div><div><b style="text-transform:capitalize">${esc(t.type)} ${esc(t.status)}</b><p>${inr(t.amount)} · ${fdate(t.createdAt)}</p></div></div>`; });
    ann.forEach(d => { const a = d.data();
      h += `<div class="about-row"><div class="about-ic">${IC.bell}</div><div><b>${esc(a.title)}</b><p>${esc(a.body)}</p></div></div>`; });
    if (h === '<div class="about-list">') h += `<div class="empty" style="padding:20px 0">${IC.bell}<p>No notifications yet — you're all caught up!</p></div>`;
    s.querySelector('#notif-body').innerHTML = h + '</div>';
  } catch (e) {
    s.querySelector('#notif-body').innerHTML = `<div class="empty" style="padding:20px 0">${IC.info}<p>Couldn't load notifications.</p></div>`;
  }
}
