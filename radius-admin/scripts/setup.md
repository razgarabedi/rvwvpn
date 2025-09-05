# Quick Setup Guide

This guide will help you set up the Radius Admin application with a working database and admin user.

## Prerequisites

1. **PostgreSQL Database**
   - Install PostgreSQL on your system
   - Create a database (e.g., `radius_admin`)
   - Note your database credentials

2. **Node.js and npm**
   - Ensure you have Node.js 18+ installed
   - npm should be available

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Edit the `.env` file with your actual database credentials:

```bash
# Replace with your actual database credentials
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/your_database_name
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

### 3. Set Up Database
```bash

$env:DATABASE_URL=
# Create tables in your database
npx prisma db push

# Create admin user
npx prisma db seed
```

### 4. Start the Application
```bash
npm run dev
```

### 5. Test Login
1. Open [http://localhost:3000](http://localhost:3000)
2. You should be redirected to `/signin`
3. Use these credentials:
   - **Email**: `admin@example.com`
   - **Password**: `adminpassword123`

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure the database exists
- Check if the port (5432) is accessible

### Authentication Issues
- Verify the admin user was created: `npx prisma studio`
- Check the `AdminUser` table for the seeded user
- Ensure `NEXTAUTH_SECRET` is set in `.env`

### Build Issues
- Run `npm run build` to check for TypeScript errors
- Ensure all dependencies are installed: `npm install`

## Database Verification

You can verify the admin user was created by running:

```bash
npx prisma studio
```

This opens a web interface where you can view the `AdminUser` table and confirm the user was created with the correct email and hashed password.

## Next Steps

Once you have successfully logged in, you can:
1. Start building the FreeRADIUS user management interface
2. Add more admin users through the database
3. Customize the authentication system as needed
