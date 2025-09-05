# PostgreSQL Database Setup Guide

This guide will walk you through setting up PostgreSQL database step by step using the psql shell and configuring it for your Next.js application.

## Table of Contents
1. [Installing PostgreSQL](#installing-postgresql)
2. [Creating a Database](#creating-a-database)
3. [Setting up User and Permissions](#setting-up-user-and-permissions)
4. [Configuring Environment Variables](#configuring-environment-variables)
5. [Prisma Configuration](#prisma-configuration)
6. [Testing the Connection](#testing-the-connection)
7. [Troubleshooting](#troubleshooting)

## Installing PostgreSQL

### Windows
1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` superuser
4. Make sure to add PostgreSQL to your PATH during installation

### macOS
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql

# Or using MacPorts
sudo port install postgresql15
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Creating a Database

### Step 1: Connect to PostgreSQL
Open your terminal/command prompt and connect to PostgreSQL as the superuser:

```bash
# On Windows (if added to PATH)
psql -U postgres

# On macOS/Linux
sudo -u postgres psql
```

### Step 2: Create a New Database
Once connected to the psql shell, run the following commands:

```sql
-- Create a new database for your application
CREATE DATABASE radius_admin_db;

-- Verify the database was created
\l
```

### Step 3: Create a Database User (Recommended)
It's a best practice to create a dedicated user for your application:

```sql
-- Create a new user
CREATE USER radius_admin_user WITH PASSWORD 'your_secure_password_here';

-- Grant privileges to the user for the database
GRANT ALL PRIVILEGES ON DATABASE radius_admin_db TO radius_admin_user;

-- Grant schema privileges (for Prisma)
GRANT ALL ON SCHEMA public TO radius_admin_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO radius_admin_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO radius_admin_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO radius_admin_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO radius_admin_user;
-- Connect to your database
   \c radius_admin_db
   
   -- Grant all necessary permissions to your user
   GRANT ALL ON SCHEMA public TO radius_admin_user;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO radius_admin_user;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO radius_admin_user;
   GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO radius_admin_user;
   
   -- Set default privileges for future objects
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO radius_admin_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO radius_admin_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO radius_admin_user;
   
   -- Grant usage on the schema
   GRANT USAGE ON SCHEMA public TO radius_admin_user;
   
   -- Grant create privileges
   GRANT CREATE ON SCHEMA public TO radius_admin_user;
   
   -- Exit psql
   \q
-- Exit psql
\q
```

### Step 4: Test the New User Connection
Test that your new user can connect to the database:

```bash
# Connect with the new user
psql -U radius_admin_user -d radius_admin_db -h localhost
```

If successful, you should see a prompt like:
```
radius_admin_db=>
```

Type `\q` to exit.

## Configuring Environment Variables

### Step 1: Create Environment File
In your `radius-admin` project directory, create a `.env.local` file:

```bash
# Navigate to your project directory
cd radius-admin

# Create the environment file
touch .env.local  # On Windows: type nul > .env.local
```

### Step 2: Add Database Configuration
Add the following configuration to your `.env.local` file:

```env
# Database Configuration
DATABASE_URL="postgresql://radius_admin_user:your_secure_password_here@localhost:5432/radius_admin_db"

# Alternative format (if you prefer separate variables)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=radius_admin_db
DB_USER=radius_admin_user
DB_PASSWORD=your_secure_password_here
DB_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
```

### Step 3: Update .gitignore
Make sure your `.env.local` file is in your `.gitignore` to keep credentials secure:

```gitignore
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## Prisma Configuration

### Step 1: Initialize Prisma (if not already done)
```bash
npx prisma init
```

### Step 2: Configure Prisma Schema
Update your `prisma/schema.prisma` file:

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Example model - customize based on your needs
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

### Step 4: Run Database Migrations
```bash
npx prisma db push
```

## Testing the Connection

### Step 1: Test with Prisma Studio
```bash
npx prisma studio
```
This will open a web interface where you can view and manage your database.

### Step 2: Test with a Simple Script
Create a test file `test-db.js` in your project root:

```javascript
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    // Test the connection
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT version()`
    console.log('PostgreSQL version:', result[0].version)
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
```

Run the test:
```bash
node test-db.js
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Connection Refused Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
- Ensure PostgreSQL service is running:
  ```bash
  # Windows
  net start postgresql-x64-15
  
  # macOS
  brew services start postgresql
  
  # Linux
  sudo systemctl start postgresql
  ```

#### 2. Authentication Failed
```
Error: password authentication failed for user "radius_admin_user"
```

**Solutions:**
- Verify the password in your `.env.local` file
- Reset the user password:
  ```sql
  ALTER USER radius_admin_user WITH PASSWORD 'new_password';
  ```

#### 3. Database Does Not Exist
```
Error: database "radius_admin_db" does not exist
```

**Solutions:**
- Create the database:
  ```sql
  CREATE DATABASE radius_admin_db;
  ```

#### 4. Permission Denied
```
Error: permission denied for table users
```

**Solutions:**
- Grant proper permissions:
  ```sql
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO radius_admin_user;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO radius_admin_user;
  ```

### Useful PostgreSQL Commands

```sql
-- List all databases
\l

-- List all users
\du

-- Connect to a specific database
\c database_name

-- List all tables in current database
\dt

-- Describe a table structure
\d table_name

-- Exit psql
\q
```

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Complete database connection string | `postgresql://user:pass@localhost:5432/dbname` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `radius_admin_db` |
| `DB_USER` | Database user | `radius_admin_user` |
| `DB_PASSWORD` | Database password | `your_secure_password` |

## Security Best Practices

1. **Use strong passwords** for database users
2. **Never commit** `.env` files to version control
3. **Use environment-specific** configuration files
4. **Limit user privileges** to only what's necessary
5. **Use SSL connections** in production
6. **Regularly update** PostgreSQL to the latest version

## Next Steps

After setting up your database:

1. Design your database schema
2. Create Prisma models
3. Run migrations: `npx prisma migrate dev`
4. Seed your database with initial data
5. Set up database backups

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
