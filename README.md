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

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/movie-club.git
cd movie-club
```

### 2. Install backend dependencies

**Node / Bun / Deno example**

```bash
# Node
npm install

# Bun
bun install

# Deno
deno cache index.ts
```

### 3. Run the backend

```bash
# Node / Bun
bun run index.ts
# or
node index.js

# Deno
deno run --allow-net --allow-read --allow-write index.ts
```

### 4. Start frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` (or `5173` for Vite) to see the app.

---

## 🗄 Database

- SQLite file: `movies.db` (ignored by Git via `.gitignore`)
- Tables:
  - `movies` — movie info, added by users
  - `votes` — upvotes/downvotes per movie

Optional Prisma schema is in `prisma/schema.prisma` if you want type-safe queries.

---

## 📝 Usage

1. Enter a list title and add some movies.
2. Submit the list to the backend.
3. Browse all submitted lists and vote on movies you like.
4. Movie lists are updated in real-time or on refresh.

---

## 📦 Notes

- Backend and frontend can run independently.
- For a quick setup, no authentication is required (all users are "dummy").
- TMDb or OMDb API keys can be added for fetching real movie metadata.

---

## 📂 Project Structure

```
movie-club/
├─ backend/       # API server, SQLite database
├─ frontend/      # React app
├─ prisma/        # Optional Prisma schema
├─ .gitignore
└─ README.md
```

---

## 🔮 Future Enhancements

- User authentication / accounts
- Real movie metadata integration (TMDb API)
- Live voting updates via WebSockets
- Collections / pools for thematic movie lists
