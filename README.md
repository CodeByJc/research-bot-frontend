# Research Bot Frontend

Professional, clean light-theme frontend built with React + TypeScript + Vite for your FastAPI research analysis backend.

## Live URL

https://researchbot.jc7.in

## Supporting GitHub Repositories

- https://github.com/CodeByJc/research-bot-csv-structured-output
- https://github.com/CodeByJc/research-bot-backend

## Backend Integration

This UI integrates with:

- `POST /analyze`
- Content type: `multipart/form-data`
- Field name: `file` (PDF)
- Expected response: JSON with `short_goal`, `short_method`, `detailed_goal`, `detailed_method` (or `raw_output` fallback)

## Environment

Create `.env` from `.env.example` and set your backend base URL:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
