# Splitwise+ frontend source

A modular React + Vite frontend for the provided expense-splitter Express backend.

## Files
- `main.jsx` — React entry point and global CSS import
- `App.jsx` — app state, authentication, API calls and page orchestration
- `services/api.js` — Axios client and auth header handling
- `utils/format.js` — currency, date, IDs and category helpers
- `components/` — reusable auth, brand, avatar, sidebar and stat components
- `pages/Dashboard.jsx` — group dashboard, expenses, balances and settlements
- `styles.css` — responsive UI styles

## Install / use
1. Copy this `src` folder into the root of your React + Vite frontend.
2. Install Axios in the frontend root: `npm install axios`.
3. Ensure `index.html` points to `/src/main.jsx` (standard Vite default).
4. Create `.env` in the frontend root:
   `VITE_API_URL=http://localhost:5000/api`
5. Start the frontend with `npm run dev`.

## Backend assumptions
Uses the routes in the supplied backend: `/auth/register`, `/auth/login`, `/auth/me`, `/groups`, `/expenses`, `/balances/group/:groupId`, and `/settlements`.

JWT is stored in localStorage as `expense_token`, matching the earlier single-file frontend. Use HTTPS in production and consider a safer token-storage strategy for a production deployment.

## Notes
- Add-member UI expects an existing account's MongoDB user ID because the supplied backend's add-member route accepts `userId`.
- Settlement confirmation records a ledger entry; it does not transfer money.
- Exact and percentage split forms submit the amounts entered for each member. Ensure those values total the expense amount or 100%, respectively, as required by the backend.
