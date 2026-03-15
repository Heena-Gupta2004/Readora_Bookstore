# Readora Bookstore

Full-stack bookstore app with React (Vite) frontend and Node/Express + MongoDB backend.

## Features
- Browse books by category
- Cart and wishlist
- Authentication (register/login)
- Checkout creates orders
- Order history in profile

## Tech Stack
- Frontend: React, Vite, React Router
- Backend: Node.js, Express, MongoDB (Mongoose)

## Setup
From project root:

```powershell
npm run install:all
```

## Run
Terminal 1 (backend):
```powershell
npm run dev:backend
```

Terminal 2 (frontend):
```powershell
npm run dev:frontend
```

Open: http://localhost:5173

## Environment
Backend env file example:
`backend/.env.example`

Create `.env` inside `backend` if needed:
```
MONGODB_URI=mongodb://127.0.0.1:27017/bookstore
PORT=5000
PASSWORD_SALT_ROUNDS=10
SESSION_TTL_DAYS=7
```

## Troubleshooting
- If port 5000 is busy:
```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```
- If you see `Cannot POST /api/orders`, restart backend.
