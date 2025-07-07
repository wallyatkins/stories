# Database Setup

The `init.sql` script provisions the initial database schema used by the
application. Apply it to an empty database using psql:

```bash
psql -U stories -f init.sql
```

## Migrations

Database changes are tracked in the `migrations/` directory as sequential SQL
files. When updating your deployment, apply any new migrations in order:

```bash
psql -U stories -f migrations/001_initial.sql
# later migrations
psql -U stories -f migrations/002_some_change.sql
```

This simple scheme keeps the SQL files under version control so the schema can
be evolved gradually.
