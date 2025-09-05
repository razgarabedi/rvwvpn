# Radius Admin

A modern admin dashboard built with Next.js, TypeScript, and Tailwind CSS.

## Project Setup

### Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable components built with Radix UI and Tailwind CSS
- **Prisma** - Database ORM
- **NextAuth.js** - Authentication for Next.js
- **bcryptjs** - Password hashing
- **Lucide React** - Beautiful & consistent icon toolkit

### Initialization Commands

```bash
# Create Next.js app with all configurations
npx create-next-app@latest radius-admin --typescript --eslint --tailwind --src-dir --app --import-alias --yes

# Install additional dependencies
npm install prisma @prisma/client next-auth bcryptjs lucide-react
npm install -D @types/bcryptjs

# Initialize shadcn/ui
npx shadcn@latest init
```

### Project Structure

```
radius-admin/
├── src/
│   ├── app/          # App Router pages
│   ├── components/   # Reusable components
│   └── lib/          # Utility functions
├── .env              # Environment variables
├── components.json   # shadcn/ui configuration
├── tailwind.config.ts
├── postcss.config.js
└── package.json
```

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env`:
   ```bash
   DATABASE_URL=postgresql://username:password@localhost:5432/radius_admin
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   ```

3. Set up the database:
   ```bash
   # Push the schema to your database
   npx prisma db push
   
   # Seed the database with an admin user
   npx prisma db seed
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Seeding the Database

Before running the application for the first time, you need to set up the database and create an admin user.

#### **Prerequisites**
- PostgreSQL database server running
- Database created (e.g., `radius_admin`)
- Valid database credentials

#### **Configuration Steps**

1. **Update Environment Variables**
   Edit the `.env` file with your actual database credentials:
   ```bash
   # Replace with your actual database credentials
   DATABASE_URL=postgresql://your_username:your_password@localhost:5432/your_database_name
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   ```

2. **Sync Database Schema**
   ```bash
   npx prisma db push
   ```
   This command creates the necessary tables in your PostgreSQL database.

3. **Seed Admin User**
   ```bash
   npx prisma db seed
   ```
   This creates an admin user with the following credentials:
   - **Email**: `admin@example.com`
   - **Password**: `adminpassword123`

#### **Verification**
After seeding, you can verify the admin user was created by connecting to your database and checking the `AdminUser` table:

```sql
SELECT id, email, "createdAt" FROM "AdminUser";
```

You should see a record with the email `admin@example.com`.

### Database Schema

The application uses Prisma ORM with PostgreSQL to manage FreeRADIUS user data and admin authentication. The schema includes four main models:

#### **RadCheck Model**
Stores user credentials and attributes for FreeRADIUS authentication.
- `id` - Auto-incrementing primary key
- `username` - User identifier
- `attribute` - Attribute type (default: "Cleartext-Password")
- `op` - Operation type (default: ":=")
- `value` - Attribute value (e.g., user password)
- Unique constraint on `username` and `attribute`

#### **RadGroupCheck Model**
Defines attributes for entire user groups.
- `id` - Auto-incrementing primary key
- `groupname` - Group identifier
- `attribute` - Attribute type
- `op` - Operation type (default: ":=")
- `value` - Attribute value

#### **RadUserGroup Model**
Maps users to groups with priority levels.
- `id` - Auto-incrementing primary key
- `username` - User identifier
- `groupname` - Group identifier
- `priority` - Priority level (default: 1)
- Unique constraint on `username` and `groupname`

#### **AdminUser Model**
Manages admin panel authentication.
- `id` - CUID primary key
- `email` - Admin email (unique)
- `password` - Hashed password
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

#### **Complete Schema**

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

// FreeRADIUS User Credentials and Attributes
model RadCheck {
  id        Int    @id @default(autoincrement())
  username  String
  attribute String @default("Cleartext-Password")
  op        String @default(":=")
  value     String

  @@unique([username, attribute])
}

// FreeRADIUS Group Attributes
model RadGroupCheck {
  id        Int    @id @default(autoincrement())
  groupname String
  attribute String
  op        String @default(":=")
  value     String
}

// FreeRADIUS User-Group Mapping
model RadUserGroup {
  id        Int    @id @default(autoincrement())
  username  String
  groupname String
  priority  Int    @default(1)

  @@unique([username, groupname])
}

// Admin Panel User Authentication
model AdminUser {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint