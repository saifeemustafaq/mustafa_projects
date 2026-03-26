# Mustafa Projects

A portfolio app for showcasing projects. Built with Next.js, React, Tailwind CSS, and MongoDB. Hosted on Netlify.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `INITIAL_ADMIN_PASSWORD` | Once | Sets the admin password on first run. Remove after. |
| `AUTH_SECRET` | Production | Secret for signing session cookies |
| `GITHUB_TOKEN` | No | GitHub PAT with `repo` scope for image uploads |
| `GITHUB_OWNER` | No | GitHub repo owner (e.g. `saifeemustafaq`) |
| `GITHUB_REPO` | No | GitHub repo name (e.g. `mustafa_projects`) |

3. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Resetting the admin password

```bash
# Option 1: pass as argument
npm run reset-password "YourNewPassword123"

# Option 2: use env var (keeps password out of shell history)
NEW_PASSWORD=YourNewPassword123 node scripts/reset-password.js
```

Requires `MONGODB_URI` in `.env.local`. See [scripts/README.md](scripts/README.md) for details.

## Image uploads

When logged in, the Add/Edit project modals let you either paste an image URL or upload an image directly to the GitHub repo. Uploading creates a PR, merges it, and returns the raw URL automatically.

Requires `GITHUB_TOKEN`, `GITHUB_OWNER`, and `GITHUB_REPO` in `.env.local`.

## Deployment

Hosted on [Netlify](https://www.netlify.com). Set the same environment variables from `.env.example` in your Netlify site settings under **Site configuration > Environment variables**.
