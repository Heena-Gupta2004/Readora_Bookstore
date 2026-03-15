## React + Node Run Guide

Use these commands from project root:

1. Install all dependencies (one time):
`npm run install:all`

2. Start backend (terminal 1):
`npm run dev:backend`

3. Start frontend (terminal 2):
`npm run dev:frontend`

4. Open:
`http://localhost:5173`

### If you see "Port 5000 is already in use"
Stop old Node processes, then start again:

`Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force`
