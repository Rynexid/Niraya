# Database Operations

## Initial Setup
1. Create Neon project/database
2. Set DATABASE_URL
3. Run migrations: `npx drizzle-kit migrate` or `bun run db:migrate`

## Migrations
- Generate: `bun run db:generate`
- Push (dev): `bun run db:push`
- Migrate (prod): use migrate command

## Backup/Restore
- Use Neon automated backups/snapshots or pg_dump
- Deployer responsible for backups
