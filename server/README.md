# Server DB migration runner

This folder contains a tiny migration runner that executes `.sql` files placed in `server/setup`.

Usage

1. Configure your DB connection in `server/.env` (DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT).
2. Add `.sql` files into `server/setup/`. Files are processed in alphabetical order.
3. Run migrations on demand:

```powershell
cd server
npm run setup
```

The script records applied filenames in an `applied_migrations` table so each file runs only once. If a migration fails, it will rollback the current transaction and stop.

If you prefer a different mechanism (timestamped filenames, third-party migration tool, or not using Postgres), let me know and I can adapt.
