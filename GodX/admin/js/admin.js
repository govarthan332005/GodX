/* ═══════════════════════════════════════════════════════════
   BACHAT ADMIN — control panel logic 3.0
   Admin access: users/{uid}.role === 'admin' (see README)
   New: Payment Methods page, deposit proof review (UTR +
   screenshot viewer), responsive tables, premium UI
   ═══════════════════════════════════════════════════════════ */

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const inr = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const fdate = ts => ts && ts.toDate ? ts.toDate().toLocaleString('en-IN', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function toast(msg, type = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  $('#toast-root').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 3000);
}

function openModal(html) {
  closeModal();
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal">${html}</div>`;
  $('#modal-root').appendChild(back);
  back.onclick = e => { if (e.target === back) closeModal(); };
  return back.querySelector('.modal');
}
function closeModal() { $('#modal-root').innerHTML = ''; }

/* ══════════ AUTH ══════════ */
$('#admin-login').onsubmit = async e => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.disabled = true; btn.textContent = 'Signing in…';
  try {
    await auth.signInWithEmailAndPassword($('#ad-email').value.trim(), $('#ad-pass').value);
  } catch (err) { toast(err.message, 'err'); }
  btn.disabled = false; btn.textContent = 'Sign In';
};

auth.onAuthStateChanged(async user => {
  if (!user) {
    $('#panel').classList.add('hidden');
    $('#login-view').classList.remove('hidden');
    return;
  }
  const snap = await db.collection('users').doc(user.uid).get();
  if (!snap.exists || snap.data().role !== 'admin') {
    await auth.signOut();
    return toast('This account does not have admin access', 'err');
  }
  $('#admin-chip').textContent = snap.data().name || 'Admin';
  $('#login-view').classList.add('hidden');
  $('#panel').classList.remove('hidden');
  renderDashboard();
  watchPendingBadge();
});

$('#ad-logout').onclick = () => auth.signOut();

/* ══════════ NAV ══════════ */
$$('.sb-item[data-p]').forEach(b => b.onclick = () => goPage(b.dataset.p));
function goPage(p) {
  $$('.sb-item[data-p]').forEach(x => x.classList.toggle('active', x.dataset.p === p));
  $$('.page').forEach(pg => pg.classList.add('hidden'));
  $('#page-' + p).classList.remove('hidden');
  const titles = { dashboard: 'Dashboard', requests: 'Requests', payments: 'Payment Methods',
                   users: 'Users', plans: 'Plans', announce: 'Announcements', content: 'App Content' };
  $('#page-title').textContent = titles[p] || p;
  ({ dashboard: renderDashboard, requests: renderRequests, payments: renderPayments, users: renderUsers,
     plans: renderPlans, announce: renderAnnounce, content: renderContent })[p]();
}

function watchPendingBadge() {
  db.collection('transactions').where('status', '==', 'pending').onSnapshot(s => {
    const b = $('#badge-req');
    b.textContent = s.size;
    b.classList.toggle('show', s.size > 0);
  });
}

/* ══════════ DASHBOARD ══════════ */
async function renderDashboard() {
  const el = $('#page-dashboard');
  el.innerHTML = '<div class="spinner"></div>';
  const [users, tx, inv] = await Promise.all([
    db.collection('users').get(),
    db.collection('transactions').get(),
    db.collection('investments').get()
  ]);
  let deposits = 0, withdrawn = 0, pending = 0, cashback = 0, balance = 0;
  tx.forEach(d => { const t = d.data();
    if (t.type === 'deposit' && t.status === 'completed') deposits += t.amount || 0;
    if (t.type === 'withdraw' && t.status === 'completed') withdrawn += t.amount || 0;
    if (t.type === 'cashback') cashback += t.amount || 0;
    if (t.status === 'pending') pending++;
  });
  let activePlans = 0, locked = 0;
  inv.forEach(d => { const i = d.data(); if (i.status === 'active') { activePlans++; locked += i.amount || 0; } });
  users.forEach(d => balance += d.data().balance || 0);

  el.innerHTML = `
    <div class="stat-cards">
      <div class="sc sc-hero"><small>Total Users</small><b>${users.size}</b>
        <div class="sc-sub">Registered savers</div></div>
      <div class="sc"><small>Deposits (verified)</small><b>${inr(deposits)}</b>
        <div class="sc-sub">All time</div></div>
      <div class="sc"><small>Wallet Float</small><b>${inr(balance)}</b>
        <div class="sc-sub">Sum of user balances</div></div>
      <div class="sc"><small>Active Plans</small><b>${activePlans}</b>
        <div class="sc-sub">${inr(locked)} currently saved in plans</div></div>
      <div class="sc"><small>Withdrawn</small><b>${inr(withdrawn)}</b>
        <div class="sc-sub">Paid out to users</div></div>
      <div class="sc"><small>Cashback Given</small><b>${inr(cashback)}</b>
        <div class="sc-sub">Rewards credited</div></div>
      <div class="sc"><small>Pending Requests</small><b style="color:${pending ? 'var(--amber)' : 'inherit'}">${pending}</b>
        <div class="sc-sub">Deposits & withdrawals awaiting review</div></div>
    </div>
    <div class="tbl-card">
      <div class="tbl-head"><h3>Quick Actions</h3></div>
      <div style="padding:18px;display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary" id="qa-seed">⚡ Seed Demo Plans</button>
        <button class="btn btn-soft" id="qa-pay">💳 Add Payment Method</button>
        <button class="btn btn-soft" id="qa-ann">📣 New Announcement</button>
        <button class="btn btn-green" id="qa-req">⇅ Review Requests ${pending ? `(${pending})` : ''}</button>
      </div>
    </div>
    <div class="tbl-card">
      <div class="tbl-head"><h3>Latest Activity</h3></div>
      <div id="dash-recent"><div class="spinner"></div></div>
    </div>`;

  $('#qa-seed').onclick = seedPlans;
  $('#qa-pay').onclick = () => { goPage('payments'); setTimeout(() => paymentEditor(null), 250); };
  $('#qa-ann').onclick = () => goPage('announce');
  $('#qa-req').onclick = () => goPage('requests');

  const recent = await db.collection('transactions').orderBy('createdAt', 'desc').limit(8).get();
  $('#dash-recent').innerHTML = recent.empty ? '<div class="empty">No activity yet</div>' : `
    <div class="tbl-scroll"><table><tr><th>Type</th><th>User</th><th>Amount</th><th>Status</th><th>When</th></tr>
    ${recent.docs.map(d => { const t = d.data(); return `
      <tr><td>${esc(t.type)}</td><td>${esc(t.userName || t.uid?.slice(0, 8) || '—')}</td>
      <td>${inr(t.amount)}</td><td><span class="chip ${t.status === 'pending' ? 'chip-amber' : t.status === 'completed' ? 'chip-green' : 'chip-red'}">${t.status}</span></td>
      <td>${fdate(t.createdAt)}</td></tr>`; }).join('')}</table></div>`;
}

/* ══════════ REQUESTS (approve deposits / withdrawals) ══════════ */
async function renderRequests() {
  const el = $('#page-requests');
  el.innerHTML = '<div class="spinner"></div>';
  const snap = await db.collection('transactions').where('status', '==', 'pending').get();
  const docs = snap.docs.sort((a, b) => (a.data().createdAt?.seconds || 0) - (b.data().createdAt?.seconds || 0));
  if (!docs.length) { el.innerHTML = '<div class="tbl-card"><div class="empty">🎉 All caught up — no pending requests</div></div>'; return; }

  el.innerHTML = `<div class="tbl-card"><div class="tbl-head"><h3>Pending Requests (${docs.length})</h3></div>
    <div class="tbl-scroll"><table><tr><th>Type</th><th>User</th><th>Amount</th><th>Details</th><th>Requested</th><th>Actions</th></tr>
    ${docs.map(d => { const t = d.data(); return `
      <tr><td><span class="chip ${t.type === 'deposit' ? 'chip-blue' : 'chip-amber'}">${t.type}</span></td>
      <td data-u="${t.uid}">…</td><td><b>${inr(t.amount)}</b></td>
      <td>${t.type === 'deposit' && t.utr
          ? `UTR: <b>${esc(t.utr)}</b>${t.proof ? `<br><button class="proof-btn" data-proof="${d.id}">📷 View payment screenshot</button>` : '<br><span class="mini">no screenshot</span>'}`
          : `<span class="mini">${esc(t.note || '')}</span>${t.withdrawTo ? `<span class="mini">${t.withdrawTo.method === 'bank' ? `Bank: ${esc(t.withdrawTo.bankName || '')} A/C ${esc(t.withdrawTo.accountNumber || '')} · IFSC ${esc(t.withdrawTo.ifsc || '')}` : 'UPI: ' + esc(t.withdrawTo.upiId || '')}</span>` : ''}`}</td>
      <td>${fdate(t.createdAt)}</td>
      <td><div class="tbl-actions">
        <button class="btn btn-green btn-sm" data-a="ok" data-id="${d.id}">Approve</button>
        <button class="btn btn-red btn-sm" data-a="no" data-id="${d.id}">Reject</button>
      </div></td></tr>`; }).join('')}</table></div></div>`;

  // resolve user names
  const uids = [...new Set(docs.map(d => d.data().uid))];
  const names = {};
  await Promise.all(uids.map(async u => { const s = await db.collection('users').doc(u).get(); names[u] = s.exists ? s.data().name : u.slice(0, 8); }));
  $$('#page-requests td[data-u]').forEach(td => td.textContent = names[td.dataset.u] || '—');

  $$('#page-requests button[data-a]').forEach(b => b.onclick = () => decideRequest(b.dataset.id, b.dataset.a === 'ok'));
  $$('#page-requests button[data-proof]').forEach(b => b.onclick = async () => {
    const d = await db.collection('transactions').doc(b.dataset.proof).get();
    if (!d.exists || !d.data().proof) return toast('Screenshot not available', 'err');
    const t = d.data();
    const m = openModal(`
      <h3>Payment Proof</h3>
      <p class="msub">${inr(t.amount)} · UTR <b>${esc(t.utr || '—')}</b> · ${fdate(t.createdAt)}${t.payMethod ? '<br>Paid to: ' + esc(t.payMethod.label || t.payMethod.upiId || t.payMethod.accountNumber || '') : ''}</p>
      <img class="proof-img" id="pv-img" src="${t.proof}" alt="Payment screenshot">
      <p class="msub" style="margin-top:10px;text-align:center">Tap image to zoom · verify amount & UTR match the bank/UPI app before approving</p>
      <div style="display:flex;gap:10px;margin-top:6px">
        <button class="btn btn-green" id="pv-ok" style="flex:1">Approve & Credit</button>
        <button class="btn btn-red" id="pv-no" style="flex:1">Reject</button>
      </div>`);
    m.querySelector('#pv-img').onclick = e => e.target.classList.toggle('zoom');
    m.querySelector('#pv-ok').onclick = async () => { closeModal(); await decideRequest(d.id, true); };
    m.querySelector('#pv-no').onclick = async () => { closeModal(); await decideRequest(d.id, false); };
  });
}

async function decideRequest(id, approve) {
  const ref = db.collection('transactions').doc(id);
  const snap = await ref.get();
  if (!snap.exists) return;
  const t = snap.data();
  const batch = db.batch();
  if (approve) {
    batch.update(ref, { status: 'completed' });
    const uref = db.collection('users').doc(t.uid);
    if (t.type === 'deposit') batch.update(uref, {
      balance: firebase.firestore.FieldValue.increment(t.amount),
      totalDeposits: firebase.firestore.FieldValue.increment(t.amount) });
    if (t.type === 'withdraw') batch.update(uref, {
      totalWithdrawn: firebase.firestore.FieldValue.increment(t.amount) });
  } else {
    batch.update(ref, { status: 'rejected' });
    if (t.type === 'withdraw') // refund held balance
      batch.update(db.collection('users').doc(t.uid), {
        balance: firebase.firestore.FieldValue.increment(t.amount) });
  }
  await batch.commit();
  toast(approve ? 'Request approved ✓' : 'Request rejected & refunded', approve ? 'ok' : '');
  renderRequests();
}

/* ══════════ PAYMENT METHODS (UPI / bank for deposits) ══════════ */
async function renderPayments() {
  const el = $('#page-payments');
  el.innerHTML = `<div class="tbl-card"><div class="tbl-head"><h3>Deposit Payment Methods</h3>
    <button class="btn btn-primary btn-sm" id="pm-new">+ Add Method</button></div>
    <div style="padding:12px 18px" class="muted">These UPI IDs / bank accounts are shown to users in the app's deposit flow.
    Users pay here, then submit their UTR + screenshot for verification.</div></div>
    <div class="plan-grid" id="pm-grid"><div class="spinner"></div></div>`;
  $('#pm-new').onclick = () => paymentEditor(null);
  const snap = await db.collection('paymentMethods').get();
  const grid = $('#pm-grid'); grid.innerHTML = '';
  if (snap.empty) { grid.innerHTML = '<div class="tbl-card"><div class="empty">No payment methods yet — add your UPI ID or bank account.</div></div>'; return; }
  snap.docs.forEach(d => {
    const m = d.data();
    const c = document.createElement('div');
    c.className = 'ap-card';
    c.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <h4 class="pm-type">${m.type === 'upi' ? '⚡' : '🏦'} ${esc(m.label || (m.type === 'upi' ? 'UPI' : 'Bank'))}</h4>
        <span class="chip ${m.active ? 'chip-green' : 'chip-red'}">${m.active ? 'Live' : 'Hidden'}</span></div>
      <div class="pm-detail">${m.type === 'upi'
        ? `UPI ID: <b>${esc(m.upiId || '—')}</b>`
        : `A/C Name: <b>${esc(m.accountName || '—')}</b><br>A/C No: <b>${esc(m.accountNumber || '—')}</b><br>IFSC: <b>${esc(m.ifsc || '—')}</b> · ${esc(m.bankName || '')}`}
        ${m.note ? `<br><span class="muted">${esc(m.note)}</span>` : ''}</div>
      <div class="ap-actions">
        <button class="btn btn-soft btn-sm" style="flex:1" data-e>Edit</button>
        <button class="btn ${m.active ? 'btn-red' : 'btn-green'} btn-sm" style="flex:1" data-t>${m.active ? 'Hide' : 'Go Live'}</button>
        <button class="btn btn-red btn-sm" data-d>🗑</button>
      </div>`;
    c.querySelector('[data-e]').onclick = () => paymentEditor({ id: d.id, ...m });
    c.querySelector('[data-t]').onclick = async () => { await db.collection('paymentMethods').doc(d.id).update({ active: !m.active }); renderPayments(); };
    c.querySelector('[data-d]').onclick = () => confirmSheet('Delete this payment method? Users won\'t see it in deposits anymore.', async () => {
      await db.collection('paymentMethods').doc(d.id).delete(); toast('Payment method deleted'); renderPayments();
    });
    grid.appendChild(c);
  });
}

function paymentEditor(m) {
  const isNew = !m;
  m = m || { type: 'upi', label: '', upiId: '', accountName: '', accountNumber: '', ifsc: '', bankName: '', note: '', active: true };
  const mo = openModal(`
    <h3>${isNew ? 'Add Payment Method' : 'Edit Payment Method'}</h3>
    <p class="msub">Users will pay to this account and submit UTR + screenshot for verification.</p>
    <div class="frow"><span>Type</span><select class="field-in" id="pm-type">
      <option value="upi" ${m.type === 'upi' ? 'selected' : ''}>UPI ID</option>
      <option value="bank" ${m.type === 'bank' ? 'selected' : ''}>Bank Account</option></select></div>
    <div class="frow"><span>Label</span><input class="field-in" id="pm-label" value="${esc(m.label)}" placeholder="e.g. Primary UPI / HDFC Current A/C"></div>
    <div id="pm-upi" class="${m.type === 'upi' ? '' : 'hidden'}">
      <div class="frow"><span>UPI ID</span><input class="field-in" id="pm-upiid" value="${esc(m.upiId || '')}" placeholder="yourname@okhdfcbank"></div>
    </div>
    <div id="pm-bank" class="${m.type === 'bank' ? '' : 'hidden'}">
      <div class="frow"><span>Account Holder Name</span><input class="field-in" id="pm-acname" value="${esc(m.accountName || '')}"></div>
      <div class="frow2">
        <div class="frow"><span>Account Number</span><input class="field-in" id="pm-acno" value="${esc(m.accountNumber || '')}"></div>
        <div class="frow"><span>IFSC</span><input class="field-in" id="pm-ifsc" value="${esc(m.ifsc || '')}"></div>
      </div>
      <div class="frow"><span>Bank Name</span><input class="field-in" id="pm-bankname" value="${esc(m.bankName || '')}" placeholder="e.g. HDFC Bank"></div>
    </div>
    <div class="frow"><span>Note for users (optional)</span><input class="field-in" id="pm-note" value="${esc(m.note || '')}" placeholder="e.g. Use only for deposits above ₹1,000"></div>
    <div style="display:flex;gap:10px;margin-top:6px">
      <button class="btn btn-primary" id="pm-save" style="flex:1">${isNew ? 'Add & Go Live' : 'Save'}</button>
      <button class="btn btn-soft" onclick="closeModal()" style="flex:1">Cancel</button></div>`);
  mo.querySelector('#pm-type').onchange = e => {
    mo.querySelector('#pm-upi').classList.toggle('hidden', e.target.value !== 'upi');
    mo.querySelector('#pm-bank').classList.toggle('hidden', e.target.value !== 'bank');
  };
  mo.querySelector('#pm-save').onclick = async () => {
    const type = mo.querySelector('#pm-type').value;
    const data = {
      type, label: mo.querySelector('#pm-label').value.trim(),
      note: mo.querySelector('#pm-note').value.trim(),
      active: isNew ? true : m.active
    };
    if (type === 'upi') {
      data.upiId = mo.querySelector('#pm-upiid').value.trim();
      if (!/^\S+@\S+$/.test(data.upiId)) return toast('Enter a valid UPI ID', 'err');
    } else {
      data.accountName = mo.querySelector('#pm-acname').value.trim();
      data.accountNumber = mo.querySelector('#pm-acno').value.replace(/\s/g, '');
      data.ifsc = mo.querySelector('#pm-ifsc').value.trim().toUpperCase();
      data.bankName = mo.querySelector('#pm-bankname').value.trim();
      if (!data.accountName || !data.accountNumber || !data.ifsc) return toast('Fill all bank fields', 'err');
    }
    if (isNew) await db.collection('paymentMethods').add(data);
    else await db.collection('paymentMethods').doc(m.id).update(data);
    closeModal(); toast(isNew ? 'Payment method live for all users' : 'Payment method saved', 'ok'); renderPayments();
  };
}

/* ══════════ USERS ══════════ */
async function renderUsers() {
  const el = $('#page-users');
  el.innerHTML = `<div class="tbl-card"><div class="tbl-head"><h3>All Users</h3>
    <input class="search-in" id="u-search" placeholder="Search name / email…"></div>
    <div id="u-tbl"><div class="spinner"></div></div></div>`;
  const snap = await db.collection('users').orderBy('createdAt', 'desc').get();
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const draw = list => {
    $('#u-tbl').innerHTML = list.length ? `
      <div class="tbl-scroll"><table><tr><th>Name</th><th>Contact</th><th>Balance</th><th>Saved</th><th>Cashback</th><th>Bank</th><th>Role</th><th>Actions</th></tr>
      ${list.map(u => `<tr>
        <td><b>${esc(u.name)}</b>${u.blocked ? '<br><span class="chip chip-red">blocked</span>' : ''}</td>
        <td>${esc(u.email)}<br><span class="muted">${esc(u.phone || '')}</span></td>
        <td><b>${inr(u.balance)}</b></td><td>${inr(u.totalSaved)}</td><td>${inr(u.totalCashback)}</td>
        <td>${u.bankDetails && u.bankDetails.accountNumber
          ? `<span class="mini">${esc(u.bankDetails.bankName)} ·•••• ${esc(String(u.bankDetails.accountNumber).slice(-4))}<br>IFSC ${esc(u.bankDetails.ifsc)}</span>
             <button class="proof-btn" data-bank="${u.id}">View</button>`
          : '<span class="mini">—</span>'}</td>
        <td><span class="chip ${u.role === 'admin' ? 'chip-red' : 'chip-blue'}">${u.role || 'user'}</span></td>
        <td><div class="tbl-actions">
          <button class="btn btn-soft btn-sm" data-adj="${u.id}">Adjust</button>
          ${u.role !== 'admin' ? `<button class="btn btn-red btn-sm" data-block="${u.id}">${u.blocked ? 'Unblock' : 'Block'}</button>` : ''}
        </div></td></tr>`).join('')}</table></div>` : '<div class="empty">No users found</div>';
    $$('#u-tbl button[data-adj]').forEach(b => b.onclick = () => adjustBalance(b.dataset.adj, list.find(x => x.id === b.dataset.adj)));
    $$('#u-tbl button[data-bank]').forEach(b => b.onclick = () => {
      const u = list.find(x => x.id === b.dataset.bank);
      const bd = u.bankDetails;
      openModal(`<h3>Bank Details — ${esc(u.name)}</h3><p class="msub">Used for withdrawal payouts</p>
        <div class="kv"><span>Holder</span><b>${esc(bd.holderName)}</b>
        <span>Bank</span><b>${esc(bd.bankName)}</b>
        <span>A/C No</span><b>${esc(bd.accountNumber)}</b>
        <span>IFSC</span><b>${esc(bd.ifsc)}</b>
        ${bd.upiId ? `<span>UPI</span><b>${esc(bd.upiId)}</b>` : ''}</div>
        <button class="btn btn-soft btn-block" onclick="closeModal()">Close</button>`);
    });
    $$('#u-tbl button[data-block]').forEach(b => b.onclick = async () => {
      const u = list.find(x => x.id === b.dataset.block);
      await db.collection('users').doc(u.id).update({ blocked: !u.blocked });
      toast(u.blocked ? 'User unblocked' : 'User blocked'); renderUsers();
    });
  };
  draw(rows);
  $('#u-search').oninput = e => {
    const q = e.target.value.toLowerCase();
    draw(rows.filter(u => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)));
  };
}

function adjustBalance(uid, u) {
  const m = openModal(`
    <h3>Adjust Balance — ${esc(u.name)}</h3>
    <p class="msub">Current balance: ${inr(u.balance)} · use for cashback credits, corrections or bonuses</p>
    <div class="frow"><span>Amount (₹)</span><input class="field-in" id="adj-amt" type="number" placeholder="100"></div>
    <div class="frow"><span>Type</span><select class="field-in" id="adj-type">
      <option value="credit">Credit (add)</option><option value="debit">Debit (remove)</option></select></div>
    <div class="frow"><span>Reason</span><input class="field-in" id="adj-why" placeholder="e.g. Referral bonus"></div>
    <div style="display:flex;gap:10px"><button class="btn btn-primary" id="adj-go" style="flex:1">Apply</button>
    <button class="btn btn-soft" onclick="closeModal()" style="flex:1">Cancel</button></div>`);
  m.querySelector('#adj-go').onclick = async () => {
    const amt = Number(m.querySelector('#adj-amt').value);
    const why = m.querySelector('#adj-why').value.trim() || 'Admin adjustment';
    const credit = m.querySelector('#adj-type').value === 'credit';
    if (!amt || amt <= 0) return toast('Enter a valid amount', 'err');
    if (!credit && amt > (u.balance || 0)) return toast('Cannot debit more than the balance', 'err');
    const batch = db.batch();
    batch.update(db.collection('users').doc(uid), { balance: firebase.firestore.FieldValue.increment(credit ? amt : -amt) });
    batch.set(db.collection('transactions').doc(), {
      uid, type: credit ? 'cashback' : 'withdraw', amount: amt, status: 'completed',
      note: why, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    await batch.commit();
    closeModal(); toast('Balance updated', 'ok'); renderUsers();
  };
}

/* ══════════ PLANS ══════════ */
async function renderPlans() {
  const el = $('#page-plans');
  el.innerHTML = `<div class="tbl-card"><div class="tbl-head"><h3>Savings Plans</h3>
    <button class="btn btn-primary btn-sm" id="p-new">+ New Plan</button></div></div>
    <div class="plan-grid" id="p-grid"><div class="spinner"></div></div>`;
  $('#p-new').onclick = () => planEditor(null);
  const snap = await db.collection('plans').orderBy('minAmount').get();
  const grid = $('#p-grid'); grid.innerHTML = '';
  if (snap.empty) { grid.innerHTML = '<div class="tbl-card"><div class="empty">No plans yet — create one or seed demo plans.</div></div>'; return; }
  snap.forEach(d => {
    const p = d.data();
    const c = document.createElement('div');
    c.className = 'ap-card';
    c.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <h4>${esc(p.name)}</h4>
        <span class="chip ${p.active ? 'chip-green' : 'chip-red'}">${p.active ? 'Live' : 'Hidden'}</span></div>
      <p class="muted" style="margin-top:4px">${esc(p.tagline || '')}</p>
      <div class="ap-stats">
        <div class="ap-stat"><small>Min</small><b>${inr(p.minAmount)}</b></div>
        <div class="ap-stat"><small>Cashback</small><b>${p.cashbackPct}%</b></div>
        <div class="ap-stat"><small>Days</small><b>${p.durationDays}</b></div>
      </div>
      <div class="ap-actions">
        <button class="btn btn-soft btn-sm" style="flex:1" data-e>Edit</button>
        <button class="btn ${p.active ? 'btn-red' : 'btn-green'} btn-sm" style="flex:1" data-t>${p.active ? 'Hide' : 'Go Live'}</button>
        <button class="btn btn-red btn-sm" data-d>🗑</button>
      </div>`;
    c.querySelector('[data-e]').onclick = () => planEditor({ id: d.id, ...p });
    c.querySelector('[data-t]').onclick = async () => { await db.collection('plans').doc(d.id).update({ active: !p.active }); renderPlans(); };
    c.querySelector('[data-d]').onclick = () => confirmSheet('Delete this plan? Users won\'t see it anymore.', async () => {
      await db.collection('plans').doc(d.id).delete(); toast('Plan deleted'); renderPlans();
    });
    grid.appendChild(c);
  });
}

function planEditor(p) {
  const isNew = !p;
  p = p || { name: '', tagline: '', minAmount: 300, cashbackPct: 5, durationDays: 30, popular: false, active: true, perks: [] };
  const m = openModal(`
    <h3>${isNew ? 'Create Plan' : 'Edit Plan'}</h3>
    <p class="msub">Cashback % is a one-time reward on completion — keep it realistic and sustainable.</p>
    <div class="frow"><span>Plan Name</span><input class="field-in" id="pf-name" value="${esc(p.name)}" placeholder="Starter Saver"></div>
    <div class="frow"><span>Tagline</span><input class="field-in" id="pf-tag" value="${esc(p.tagline)}" placeholder="Perfect for beginners"></div>
    <div class="frow2">
      <div class="frow"><span>Min Amount (₹)</span><input class="field-in" id="pf-min" type="number" value="${p.minAmount}"></div>
      <div class="frow"><span>Cashback %</span><input class="field-in" id="pf-cb" type="number" step="0.5" value="${p.cashbackPct}"></div>
    </div>
    <div class="frow"><span>Duration (days)</span><input class="field-in" id="pf-days" type="number" value="${p.durationDays}"></div>
    <div class="frow"><span>Perks (one per line)</span><textarea class="field-in" id="pf-perks">${esc((p.perks || []).join('\n'))}</textarea></div>
    <div class="frow" style="flex-direction:row;align-items:center;gap:10px">
      <input type="checkbox" id="pf-pop" ${p.popular ? 'checked' : ''}> <span style="font-size:.82rem">Show "POPULAR" ribbon</span></div>
    <div style="display:flex;gap:10px;margin-top:6px">
      <button class="btn btn-primary" id="pf-save" style="flex:1">${isNew ? 'Create' : 'Save'}</button>
      <button class="btn btn-soft" onclick="closeModal()" style="flex:1">Cancel</button></div>`);
  m.querySelector('#pf-save').onclick = async () => {
    const data = {
      name: m.querySelector('#pf-name').value.trim(),
      tagline: m.querySelector('#pf-tag').value.trim(),
      minAmount: Number(m.querySelector('#pf-min').value),
      cashbackPct: Number(m.querySelector('#pf-cb').value),
      durationDays: Number(m.querySelector('#pf-days').value),
      perks: m.querySelector('#pf-perks').value.split('\n').map(x => x.trim()).filter(Boolean),
      popular: m.querySelector('#pf-pop').checked,
      active: isNew ? true : p.active
    };
    if (!data.name || !data.minAmount || !data.durationDays) return toast('Fill name, amount and duration', 'err');
    if (isNew) await db.collection('plans').add(data);
    else await db.collection('plans').doc(p.id).update(data);
    closeModal(); toast(isNew ? 'Plan created — it\'s live!' : 'Plan saved', 'ok'); renderPlans();
  };
}

async function seedPlans() {
  const demo = [
    { name: 'Starter Saver', tagline: 'Begin your savings habit', minAmount: 300, cashbackPct: 3, durationDays: 30, popular: false, active: true,
      perks: ['3% cashback on completion', 'Withdraw anytime after 30 days', 'Full transaction receipts'] },
    { name: 'Smart Saver', tagline: 'For consistent savers', minAmount: 1000, cashbackPct: 5, durationDays: 60, popular: true, active: true,
      perks: ['5% cashback on completion', 'Priority withdrawal processing', 'Free savings insights report'] },
    { name: 'Champion Saver', tagline: 'Maximum rewards', minAmount: 3000, cashbackPct: 7, durationDays: 90, popular: false, active: true,
      perks: ['7% cashback on completion', 'Dedicated support line', 'Early access to new plans'] }
  ];
  const batch = db.batch();
  demo.forEach(p => batch.set(db.collection('plans').doc(), p));
  await batch.commit();
  toast('3 demo plans created', 'ok'); renderPlans();
}

/* ══════════ ANNOUNCEMENTS ══════════ */
async function renderAnnounce() {
  const el = $('#page-announce');
  el.innerHTML = `<div class="tbl-card"><div class="tbl-head"><h3>Announcements</h3>
    <button class="btn btn-primary btn-sm" id="a-new">+ New Announcement</button></div>
    <div id="a-list"><div class="spinner"></div></div></div>`;
  $('#a-new').onclick = () => annEditor(null);
  const snap = await db.collection('announcements').orderBy('createdAt', 'desc').get();
  $('#a-list').innerHTML = snap.empty ? '<div class="empty">No announcements yet</div>' : `
    <div class="tbl-scroll"><table><tr><th>Title</th><th>Message</th><th>Posted</th><th></th></tr>
    ${snap.docs.map(d => { const a = d.data(); return `<tr><td><b>${esc(a.title)}</b></td>
      <td style="max-width:340px">${esc(a.body)}</td><td>${fdate(a.createdAt)}</td>
      <td><button class="btn btn-red btn-sm" data-del="${d.id}">Delete</button></td></tr>`; }).join('')}</table></div>`;
  $$('#a-list button[data-del]').forEach(b => b.onclick = () => confirmSheet('Delete this announcement?', async () => {
    await db.collection('announcements').doc(b.dataset.del).delete(); renderAnnounce();
  }));
}

function annEditor() {
  const m = openModal(`
    <h3>New Announcement</h3><p class="msub">Shown on the Home screen and in Notifications</p>
    <div class="frow"><span>Title</span><input class="field-in" id="an-t" placeholder="🎉 Weekend cashback boost!"></div>
    <div class="frow"><span>Message</span><textarea class="field-in" id="an-b" placeholder="Write a short, clear message…"></textarea></div>
    <div style="display:flex;gap:10px"><button class="btn btn-primary" id="an-go" style="flex:1">Publish</button>
    <button class="btn btn-soft" onclick="closeModal()" style="flex:1">Cancel</button></div>`);
  m.querySelector('#an-go').onclick = async () => {
    const title = m.querySelector('#an-t').value.trim(), body = m.querySelector('#an-b').value.trim();
    if (!title || !body) return toast('Title and message required', 'err');
    await db.collection('announcements').add({ title, body, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    closeModal(); toast('Announcement published', 'ok'); renderAnnounce();
  };
}

/* ══════════ APP CONTENT (trust strip, about) ══════════ */
async function renderContent() {
  const el = $('#page-content');
  el.innerHTML = '<div class="spinner"></div>';
  const d = await db.collection('appContent').doc('main').get();
  const c = d.exists ? d.data() : {};
  el.innerHTML = `
    <div class="tbl-card"><div class="tbl-head"><h3>Home Screen Content</h3></div>
      <div style="padding:18px">
        <div class="frow"><span>"Why trust us" section title</span>
          <input class="field-in" id="c-title" value="${esc(c.aboutTitle || 'Why thousands trust Bachat')}"></div>
        <div class="frow"><span>Trust strip items (format: Label | sublabel, comma separated)</span>
          <textarea class="field-in" id="c-trust">${esc((c.trustPoints || [
            {t:'Bank-grade Security',d:'AES-256 encrypted'},{t:'Instant Withdrawals',d:'Money in 24 hrs'},
            {t:'RBI-compliant Partners',d:'Regulated rails'},{t:'Zero Hidden Fees',d:'100% transparent'}
          ]).map(x => x.t + ' | ' + x.d).join(', '))}</textarea></div>
        <div class="frow"><span>About points (format: Title | description, one per line)</span>
          <textarea class="field-in" id="c-about" style="min-height:110px">${esc((c.aboutPoints || [
            {t:'Real savings, real rewards',d:'Every rupee earns actual cashback from merchant partners.'},
            {t:'Your money stays liquid',d:'Withdraw anytime after your plan duration.'},
            {t:'Fully transparent',d:'Every transaction visible with receipts and status.'}
          ]).map(x => x.t + ' | ' + x.d).join('\n'))}</textarea></div>
        <button class="btn btn-primary" id="c-save">Save Content</button>
      </div></div>`;
  $('#c-save').onclick = async () => {
    const trust = $('#c-trust').value.split(',').map(x => { const [t, d] = x.split('|').map(s => (s || '').trim()); return t ? { t, d: d || '' } : null; }).filter(Boolean);
    const about = $('#c-about').value.split('\n').map(x => { const [t, d] = x.split('|').map(s => (s || '').trim()); return t ? { t, d: d || '' } : null; }).filter(Boolean);
    await db.collection('appContent').doc('main').set({ aboutTitle: $('#c-title').value.trim(), trustPoints: trust, aboutPoints: about }, { merge: true });
    toast('Home screen content updated — live for all users', 'ok');
  };
}

/* ══════════ CONFIRM ══════════ */
function confirmSheet(msg, onYes) {
  const m = openModal(`<h3>Are you sure?</h3><p class="msub">${esc(msg)}</p>
    <div style="display:flex;gap:10px"><button class="btn btn-red" id="cf-y" style="flex:1">Yes, do it</button>
    <button class="btn btn-soft" onclick="closeModal()" style="flex:1">Cancel</button></div>`);
  m.querySelector('#cf-y').onclick = async () => { closeModal(); await onYes(); };
}
