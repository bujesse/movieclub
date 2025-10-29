# 🎬 Movie Club App

A self-hosted web app for creating, sharing, and voting on movie recommendation lists. Designed for small groups to track favorite movies and vote on each other’s lists.

---

## 🧰 Features

- Create Movie lists, which will become the topic of a given Movie Club Meetup.
  - Title, optional Description (Why you created the list), and list of movies (at least one but more encouraged)
- Search and add movies to your movie list. Data pulls from TMDB. You must select a movie from the Autocomplete.
- You should not have to log in to this app - I use your Cloudflare login to grab your ID.
- Edit and Delete lists that you created (Can't edit other's).
- Vote and Unvote lists. You have 3 votes per Meetup.
- Countdown to the next meetup (Click to see the date/time)
- Lists are sorted by most upvotes first, _then_ by all-time votes, _then_ oldest to newest.
  - Lists display with poster carousel and links to Letterboxd (Opens the app if you're on mobile).
  - Main page shows lists that have _not_ been selected for a meetup yet.

---

## ⚡ Tech Stack

- **Frontend:** React + Next.js
- **Backend:** Node.js / Prisma
- **Database:** SQLite

---

## 🚀 Getting Started

### 2. Install dependencies

**Node**

````bash
# Node
npm install

### 3. Create .env

```bash
cp .env.example .env

### 3. Run migrations

```bash
npm run prisma:migrate
````

### 4. Start dev

```bash
npm run dev
```

Visit `http://localhost:3000`
