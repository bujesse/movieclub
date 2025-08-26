# 🎬 Movie Club App

A self-hosted web app for creating, sharing, and voting on movie recommendation lists. Designed for small groups, like a movie club, to track favorite movies and vote on each other’s lists.

---

## 🧰 Features

- Search and add movies to your personal recommendation list.
- Create lists with a title and multiple movies.
- View all lists from other users.
- Vote on movies in other users’ lists.
- Lightweight backend with **SQLite** (optional Prisma).
- Minimal, fast frontend built with **React**.

---

## ⚡ Tech Stack

- **Frontend:** React (Next.js or Vite)
- **Backend:** Bun / Node.js / Deno + lightweight API (Elysia, Express, or Oak)
- **Database:** SQLite
- **Optional:** Prisma for type-safe database access

---

## 🚀 Getting Started

### 2. Install dependencies

**Node / Bun / Deno example**

```bash
# Node
npm install

# Bun
bun install

### 3. Create .env

```bash
cp .env.example .env
```

### 4. Start dev

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` (or `5173` for Vite) to see the app.

---

## 🗄 Database

### Run migrations (dev)
```bash
npm run prisma:migrate
```

### Generate schema
```bash
npm run prisma:generate
```
