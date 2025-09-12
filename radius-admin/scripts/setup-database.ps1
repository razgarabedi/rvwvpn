# PowerShell script to set up the FreeRADIUS3 database
# This script will create the database, run migrations, and seed data

Write-Host "🚀 Starting FreeRADIUS3 Database Setup..." -ForegroundColor Green

# Set environment variables
$env:DATABASE_URL = "postgresql://postgres:a3eilm2s2y@localhost:5432/freeradius_db?schema=public"

Write-Host "📋 Environment variables set:" -ForegroundColor Yellow
Write-Host "   DATABASE_URL: $env:DATABASE_URL" -ForegroundColor Gray

# Step 1: Generate Prisma client
Write-Host "`n🔧 Step 1: Generating Prisma client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "✅ Prisma client generated successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to generate Prisma client: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Push schema to database
Write-Host "`n📊 Step 2: Pushing schema to database..." -ForegroundColor Yellow
try {
    npx prisma db push --force-reset
    Write-Host "✅ Schema pushed to database successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to push schema: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Run seed script
Write-Host "`n🌱 Step 3: Seeding database..." -ForegroundColor Yellow
try {
    npx tsx prisma/seed.ts
    Write-Host "✅ Database seeded successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to seed database: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Verify setup
Write-Host "`n🔍 Step 4: Verifying database setup..." -ForegroundColor Yellow
try {
    node scripts/test-db-connection.js
    Write-Host "✅ Database verification completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Database verification failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 FreeRADIUS3 Database Setup Complete!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Configure your FreeRADIUS3 server to use this database" -ForegroundColor White
Write-Host "   2. Update the queries.conf file with the correct table names" -ForegroundColor White
Write-Host "   3. Test authentication with: radtest username password localhost 0 testing123" -ForegroundColor White
Write-Host "`n🔗 Database connection details:" -ForegroundColor Yellow
Write-Host "   Host: localhost" -ForegroundColor White
Write-Host "   Port: 5432" -ForegroundColor White
Write-Host "   Database: freeradius_db" -ForegroundColor White
Write-Host "   Username: postgres" -ForegroundColor White
Write-Host "   Password: a3eilm2s2y" -ForegroundColor White
