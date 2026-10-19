# SettleMate frontend

A React + Vite frontend organised by application routing, feature modules, shared UI, and API services.

## Setup

1. Use this `src/` directory in a React + Vite project.
2. Install dependencies:

   ```bash
   npm install react-router-dom axios
   ```

3. Add `.env` at the project root:

   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. Start the frontend with `npm run dev`.

The Vite project should have an `index.html` with `<div id="root"></div>` and a `package.json` with the usual `dev`, `build`, and `preview` scripts.

## Structure

- `app/`: route table and authentication guard.
- `components/layout/`: application shell and sidebar.
- `components/ui/`: reusable avatar, modal, alert, and loading state.
- `features/auth/`: authentication context and form.
- `features/groups/`: group creation, group cards, and searchable add-member flow. Only the group creator can add members.
- `features/expenses/`: expense form.
- `features/settlements/`: manual settlement form.
- `pages/`: route-level screens.
- `lib/`: Axios client, errors, and formatting helpers.
- `styles/`: global responsive styling.

## Backend endpoints expected

`/auth/register`, `/auth/login`, `/auth/me`, `/groups`, `/groups/:id`, `/groups/:id/members`, `/users/search`, `/expenses`, `/expenses/group/:groupId`, `/balances/group/:groupId`, `/settlements`, `/settlements/group/:groupId`.

## Notes

- JWT is stored in localStorage to match the uploaded backend's bearer-token middleware. For a production app, consider secure, HttpOnly cookies and appropriate CSRF protection.
- The profile page can update the user's name and public profile image URL through `PATCH /auth/me`; email is shown read-only because the current backend does not expose email changes.
- Settlements are recorded as a ledger entry. They do not trigger a real money transfer.
- Expense creation supports equal splits, custom exact-amount splits, and custom percentage splits. You can choose which group members participate; exact amounts must total the expense amount, and percentages must total 100%.
- The backend's `/auth/me` response in the provided version does not return `createdAt`, so the member-since field will display a dash unless the backend response is extended.
