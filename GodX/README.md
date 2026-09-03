# Bachat — Micro-Savings & Cashback Rewards App (v3.0 Premium)

A legit, transparent savings app with a companion admin panel.
**User app:** save in flexible plans, earn cashback on completion, deposit via admin-published UPI/bank details with **UTR + screenshot verification**, withdraw to your **saved bank account or UPI**.
**Admin panel:** manage plans, payment methods, approve deposits/withdrawals (with proof viewer), manage users, announcements, and home-screen content.

---

## 📁 Project structure

```
GodX/
├── user/                  → the mobile-style user web app (PWA)
│   ├── index.html
│   ├── manifest.json
│   ├── css/style.css
│   └── js/ (config.js ← Firebase config · app.js)
├── admin/                 → the admin web panel
│   ├── index.html
│   ├── css/admin.css
│   └── js/ (config.js ← SAME Firebase config · admin.js)
├── firestore.rules        → security rules (paste into Firebase Console)
└── README.md
```

## 🔥 Firebase setup (10 minutes)

1. **Create project** at https://console.firebase.google.com → "Add project".
2. **Enable Auth:** Build → Authentication → Sign-in method → enable **Email/Password**.
3. **Create Firestore:** Build → Firestore Database → Create database → Production mode.
4. **Get web config:** Project Settings → "Your apps" → Web (`</>`) → copy the `firebaseConfig` object.
5. **Paste config** into BOTH `user/js/config.js` and `admin/js/config.js`.
6. **Security rules:** Firestore → Rules tab → paste contents of `firestore.rules` → Publish.
7. **Create admin:** sign up in the user app → Firestore → `users` → your doc → set `role` = `admin`.

## 🚀 Run / deploy

```bash
cd GodX/user  && npx serve .          # user app
cd GodX/admin && npx serve . -p 3001  # admin panel
```
Or deploy both folders to Firebase Hosting / Netlify / Vercel as two sites.

## ✨ What's new in v3.0

### User app
- **Premium theme + animations**: shimmer skeleton loaders, staggered view entrances, button loading spinners, full-screen loader overlay, animated splash, confetti, floating gradients, success pop-ups
- **Fully responsive settings & wallet**: fixed overflow bugs (missing `.skel`/`.success-pop` styles, truncated rows, wrapping referral box, fluid type with `clamp()`, safe-area support)
- **Bank details in Wallet**: add/edit holder name, bank, account number, IFSC, optional UPI — shown as a premium debit-card-style card
- **Deposit with proof**: pick an admin-published UPI/bank method → copy details → pay → enter **UTR number** → **upload payment screenshot** (auto-compressed) → live pending status
- **Withdraw to saved destination**: choose your saved bank account or UPI ID; amount held until admin pays out

### Admin panel
- **New "Payment Methods" page**: add/edit/hide/delete UPI IDs and bank accounts users deposit to
- **Deposit verification**: requests table shows UTR, "View payment screenshot" opens a zoomable proof modal with one-tap **Approve & Credit** / Reject
- **Withdrawal details**: shows the user's destination (bank A/C + IFSC or UPI) for payout
- **Users table**: view each user's saved bank details
- Fully responsive (collapsible sidebar, scrollable tables), premium animations, fixed quick-action buttons

## 🗄️ Data model

| Collection | Key fields |
|---|---|
| `users` | name, email, phone, balance, totalSaved, totalCashback, totalDeposits, totalWithdrawn, **bankDetails{holderName,bankName,accountNumber,ifsc,upiId}**, referralCode, role, blocked |
| `plans` | name, tagline, minAmount, cashbackPct, durationDays, perks[], popular, active |
| `paymentMethods` | type (upi/bank), label, upiId OR accountName/accountNumber/ifsc/bankName, note, active |
| `investments` | uid, planId, planName, amount, cashbackPct, cashbackAmount, durationDays, status, createdAt |
| `transactions` | uid, type, amount, status, note, **utr, proof (data-URL image), payMethod, withdrawTo**, createdAt |
| `announcements` | title, body, createdAt |
| `appContent/main` | aboutTitle, trustPoints[], aboutPoints[] |

## ⚠️ Notes

- Payment screenshots are stored as compressed JPEG data-URLs inside the transaction doc (no Firebase Storage needed; keep screenshots cropped). For high volume, migrate `proof` to Firebase Storage and store the URL instead.
- Keep cashback rates realistic — this is a savings + cashback app, not an investment scheme.
- Before going live with real money, integrate a licensed payment gateway and follow KYC/Terms requirements.
