# Expense Splitter API

## Features in this backend
- JWT registration, login, current-user endpoint, and profile update.
- Group creation/list/detail, member add/remove (creator-only changes).
- Expense creation with equal, exact-amount, and percentage split support; list/detail, descriptive edits, and deletion permissions.
- Group balances and suggested minimum-style settlement transfers.
- Settlement history, recording and deletion with group membership checks.
- Authenticated user search by name/email for adding members.
- CORS configured with `CLIENT_URL`, JSON body limit, health check and JSON 404 responses.

## Setup
1. Use Node.js 20+.
2. Copy `.env.example` to `.env` and fill in your own MongoDB URI and a strong JWT secret.
3. `npm install`
4. `npm run dev`
5. API health check: `GET http://localhost:5000/`

Do not commit `.env` or share database credentials. If credentials from an old `.env` were ever uploaded/shared, rotate the MongoDB password and JWT secret.

## API routes
All routes except register/login and `GET /` require `Authorization: Bearer <token>`.

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PATCH /api/auth/me`
- `GET /api/users/search?q=name-or-email`
- `POST /api/groups`, `GET /api/groups`, `GET /api/groups/:id`, `POST /api/groups/:id/members`, `DELETE /api/groups/:id/members/:userId`
- `POST /api/expenses`, `GET /api/expenses/group/:groupId`, `GET /api/expenses/:id`, `PATCH /api/expenses/:id`, `DELETE /api/expenses/:id`
- `GET /api/balances/group/:groupId`
- `POST /api/settlements`, `GET /api/settlements/group/:groupId`, `GET /api/settlements/:id`, `DELETE /api/settlements/:id`

### Expense create body
```json
{
  "groupId": "GROUP_OBJECT_ID",
  "description": "Dinner",
  "amount": 1200,
  "splitType": "equal",
  "paidBy": [{ "user": "PAYER_OBJECT_ID", "amount": 1200 }],
  "splits": [{ "user": "MEMBER_1_ID" }, { "user": "MEMBER_2_ID" }],
  "category": "food",
  "notes": "Optional"
}
```
`splitType` accepts `equal`, `exact`, or `percentage`. For `exact`, each split needs `amount`; for `percentage`, each split needs `percentage`.

### Settlement create body
```json
{ "groupId": "GROUP_OBJECT_ID", "paidTo": "RECEIVER_OBJECT_ID", "amount": 100, "note": "UPI" }
```
This records a payment made by the authenticated user; it does not initiate a bank/UPI transfer.

## Frontend
`App.jsx` is a starter single-file React UI supplied separately. Add it to `src/App.jsx`, install `axios`, and set `VITE_API_URL=http://localhost:5000/api` in the frontend `.env` file. The starter UI uses equal splits only; the backend supports equal, exact and percentage splits.
