# Scripts

## reset-password.js

Resets the **admin** user’s password in MongoDB. Use it when you want to change your login password.

**Security:** The script only works if `MONGODB_URI` is set (e.g. in `.env.local`). That file is **not** committed to the repo, so only someone with access to your environment (you or your deployment) can run the script successfully. Committing the script is safe; it cannot change any password without your real MongoDB connection string.

**Usage** (from project root):

```bash
# Option 1: pass new password as argument
node scripts/reset-password.js "YourNewPassword123"

# Option 2: use env var (keeps password out of shell history)
NEW_PASSWORD=YourNewPassword123 node scripts/reset-password.js
```

**Requirements:**

- `MONGODB_URI` in `.env.local` (or in the environment). The script loads `.env.local` from the project root if it exists.
- If the admin user doesn't exist yet, the script will create it with the password you provide.

After running, sign in with the admin username and the new password.
