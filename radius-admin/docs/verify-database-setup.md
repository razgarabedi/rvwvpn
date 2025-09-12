# How to Check if Users are Created in PostgreSQL Database

This guide explains multiple ways to verify that your FreeRADIUS3 users and data are properly stored in the PostgreSQL database.

## 🎯 Quick Verification Methods

### 1. Using the Check Scripts

We've created several scripts to help you verify your database setup:

```bash
# Check all users and data
node scripts/check-users.js

# Check what tables exist
node scripts/check-tables.js

# Set up test data
node scripts/setup-freeradius-test.js
```

### 2. Direct Database Queries

You can connect directly to PostgreSQL and run queries:

```bash
# Connect to the database
psql -h localhost -U postgres -d freeradius_db

# List all tables
\dt

# Check RADIUS users
SELECT * FROM radcheck;

# Check user groups
SELECT * FROM radusergroup;

# Check NAS devices
SELECT * FROM nas;

# Check accounting records
SELECT * FROM radacct LIMIT 5;
```

### 3. Using Prisma Studio

Launch Prisma Studio to visually inspect your data:

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can browse all tables and data.

## 📊 Database Structure Verification

### FreeRADIUS3 Tables Created

Your database now contains these tables with the exact names FreeRADIUS3 expects:

| Table Name | Purpose | Key Fields |
|------------|---------|------------|
| `nas` | Network Access Servers | `nasname`, `secret`, `type` |
| `radcheck` | User authentication | `UserName`, `Attribute`, `Value` |
| `radreply` | User reply attributes | `UserName`, `Attribute`, `Value` |
| `radgroupcheck` | Group authentication | `GroupName`, `Attribute`, `Value` |
| `radgroupreply` | Group reply attributes | `GroupName`, `Attribute`, `Value` |
| `radusergroup` | User-group mapping | `UserName`, `GroupName`, `priority` |
| `radacct` | Accounting records | `UserName`, `AcctSessionId`, `NASIPAddress` |
| `radpostauth` | Post-auth logging | `username`, `authdate`, `reply` |
| `nasreload` | NAS reload tracking | `NASIPAddress`, `ReloadTime` |

### Test Data Created

The setup script creates this test configuration:

**User:**
- Username: `testuser`
- Password: `testpass123`
- Group: `users`

**NAS Device:**
- IP: `192.168.1.100`
- Secret: `testing123`
- Type: `other`

**Group Attributes:**
- Service-Type: `Framed-User`
- Framed-Protocol: `PPP`
- Framed-IP-Address: `192.168.1.100`

## 🔍 Detailed Verification Steps

### Step 1: Check Table Existence

```sql
-- Verify all FreeRADIUS3 tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('nas', 'radacct', 'radcheck', 'radreply', 'radgroupcheck', 'radgroupreply', 'radusergroup', 'radpostauth', 'nasreload')
ORDER BY table_name;
```

### Step 2: Check User Data

```sql
-- Check user authentication data
SELECT * FROM radcheck WHERE "UserName" = 'testuser';

-- Check user groups
SELECT * FROM radusergroup WHERE "UserName" = 'testuser';

-- Check user reply attributes
SELECT * FROM radreply WHERE "UserName" = 'testuser';
```

### Step 3: Check NAS Configuration

```sql
-- Check NAS devices
SELECT * FROM nas;

-- Verify NAS secret and IP
SELECT nasname, secret, type FROM nas WHERE nasname = '192.168.1.100';
```

### Step 4: Check Group Configuration

```sql
-- Check group authentication
SELECT * FROM radgroupcheck WHERE "GroupName" = 'users';

-- Check group reply attributes
SELECT * FROM radgroupreply WHERE "GroupName" = 'users';
```

## 🧪 Testing with FreeRADIUS3

### Test Authentication

Once your database is set up, test with FreeRADIUS3:

```bash
# Test user authentication
radtest testuser testpass123 192.168.1.100 0 testing123
```

Expected output:
```
Sending Access-Request of id 123 to 192.168.1.100 port 1812
User-Name = "testuser"
User-Password = "testpass123"
NAS-IP-Address = 192.168.1.100
NAS-Port = 0
rad_recv: Access-Accept packet from host 192.168.1.100 port 1812, id=123, length=20
```

### Test Accounting

```bash
# Test accounting (if configured)
echo "User-Name = testuser" | radclient 192.168.1.100:1813 accounting testing123
```

## 🚨 Troubleshooting

### Common Issues

1. **"relation does not exist" error**
   - Solution: Run `npx prisma db push` to create tables

2. **"permission denied" error**
   - Solution: Check database user permissions

3. **"connection refused" error**
   - Solution: Verify PostgreSQL is running and accessible

### Verification Checklist

- [ ] All FreeRADIUS3 tables exist with correct names
- [ ] Column names match FreeRADIUS3 expectations (PascalCase)
- [ ] Test user exists in `radcheck` table
- [ ] User is assigned to a group in `radusergroup` table
- [ ] NAS device exists in `nas` table
- [ ] Group attributes are configured in `radgroupreply` table
- [ ] FreeRADIUS3 can connect to the database
- [ ] Authentication test passes with `radtest`

## 📈 Monitoring and Maintenance

### Regular Checks

1. **User Count**: Monitor how many users are in the system
2. **Active Sessions**: Check `radacct` table for active sessions
3. **Failed Logins**: Monitor `radpostauth` table for authentication failures
4. **Database Performance**: Monitor query performance and indexes

### Useful Queries

```sql
-- Count total users
SELECT COUNT(*) FROM radcheck;

-- Count active sessions
SELECT COUNT(*) FROM radacct WHERE "AcctStopTime" IS NULL;

-- Recent authentication attempts
SELECT * FROM radpostauth ORDER BY authdate DESC LIMIT 10;

-- User activity summary
SELECT "UserName", COUNT(*) as session_count 
FROM radacct 
GROUP BY "UserName" 
ORDER BY session_count DESC;
```

## 🎉 Success Indicators

Your FreeRADIUS3 database setup is working correctly when:

1. ✅ All tables exist with correct names and structure
2. ✅ Test user can be found in `radcheck` table
3. ✅ User is properly assigned to groups
4. ✅ NAS device is configured correctly
5. ✅ FreeRADIUS3 can authenticate users
6. ✅ Accounting records are being created
7. ✅ No "relation does not exist" errors in FreeRADIUS3 logs

The database is now fully aligned with FreeRADIUS3 requirements and ready for production use!
