# Switching to PostgreSQL for Production

## Step 1: Change prisma/schema.prisma
Replace:
```
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```
With:
```
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Step 2: Set DATABASE_URL environment variable on Render
Format: `postgresql://user:password@host:5432/dbname`
Render gives you this when you create a PostgreSQL database.

## Step 3: Run migration
```
npx prisma migrate deploy
```
