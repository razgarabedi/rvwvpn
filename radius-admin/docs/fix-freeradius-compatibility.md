# Fix FreeRADIUS Compatibility - Database Schema Update

## Problem

Your FreeRADIUS server expects lowercase column names (e.g., `username`, `attribute`, `value`), but your database schema uses PascalCase column names (e.g., `UserName`, `Attribute`, `Value`). This causes authentication errors.

## Solution

Instead of changing FreeRADIUS configuration, we'll update your database schema to use lowercase column names that match FreeRADIUS expectations.

## Files Modified

- ✅ `radius-admin/scripts/fix-database-schema-for-freeradius.sql` - Database migration script
- ✅ `radius-admin/prisma/schema.prisma` - Updated Prisma schema
- ✅ `radius-admin/scripts/apply-database-migration.js` - Migration runner script

## Step-by-Step Fix

### 1. Apply Database Migration

```bash
cd radius-admin
node scripts/apply-database-migration.js
```

This script will:
- Rename all columns from PascalCase to lowercase
- Update all indexes to match new column names
- Verify the changes work correctly

### 2. Regenerate Prisma Client

```bash
npx prisma generate
```

### 3. Test the Fix

```bash
# Test user creation
node scripts/test-user-creation.js

# Test database queries
node scripts/check-users.js
```

## What Changed

### Database Schema Changes

| Table | Old Column | New Column |
|-------|------------|------------|
| `radcheck` | `UserName` | `username` |
| `radcheck` | `Attribute` | `attribute` |
| `radcheck` | `Value` | `value` |
| `radreply` | `UserName` | `username` |
| `radreply` | `Attribute` | `attribute` |
| `radreply` | `Value` | `value` |
| `radgroupcheck` | `GroupName` | `groupname` |
| `radgroupcheck` | `Attribute` | `attribute` |
| `radgroupcheck` | `Value` | `value` |
| `radgroupreply` | `GroupName` | `groupname` |
| `radgroupreply` | `Attribute` | `attribute` |
| `radgroupreply` | `Value` | `value` |
| `radusergroup` | `UserName` | `username` |
| `radusergroup` | `GroupName` | `groupname` |
| `radacct` | `UserName` | `username` |
| `radacct` | `NASIPAddress` | `nasipaddress` |
| `radacct` | `AcctSessionId` | `acctsessionid` |
| `radacct` | `AcctUniqueId` | `acctuniqueid` |
| `radacct` | `AcctStartTime` | `acctstarttime` |
| `radacct` | `AcctUpdateTime` | `acctupdatetime` |
| `radacct` | `AcctStopTime` | `acctstoptime` |
| `radacct` | `AcctInterval` | `acctinterval` |
| `radacct` | `AcctSessionTime` | `acctsessiontime` |
| `radacct` | `AcctAuthentic` | `acctauthentic` |
| `radacct` | `ConnectInfo_start` | `connectinfo_start` |
| `radacct` | `ConnectInfo_stop` | `connectinfo_stop` |
| `radacct` | `AcctInputOctets` | `acctinputoctets` |
| `radacct` | `AcctOutputOctets` | `acctoutputoctets` |
| `radacct` | `CalledStationId` | `calledstationid` |
| `radacct` | `CallingStationId` | `callingstationid` |
| `radacct` | `AcctTerminateCause` | `acctterminatecause` |
| `radacct` | `ServiceType` | `servicetype` |
| `radacct` | `FramedProtocol` | `framedprotocol` |
| `radacct` | `FramedIPAddress` | `framedipaddress` |
| `radacct` | `FramedIPv6Address` | `framedipv6address` |
| `radacct` | `FramedIPv6Prefix` | `framedipv6prefix` |
| `radacct` | `FramedInterfaceId` | `framedinterfaceid` |
| `radacct` | `DelegatedIPv6Prefix` | `delegatedipv6prefix` |
| `radacct` | `Class` | `class` |
| `radpostauth` | `CalledStationId` | `calledstationid` |
| `radpostauth` | `CallingStationId` | `callingstationid` |
| `radpostauth` | `Class` | `class` |
| `nasreload` | `NASIPAddress` | `nasipaddress` |
| `nasreload` | `ReloadTime` | `reloadtime` |

### Prisma Schema Changes

The Prisma schema has been updated to remove the `@map()` directives since the database columns now match the Prisma field names.

**Before:**
```prisma
model RadCheck {
  id        Int    @id @default(autoincrement())
  username  String @map("UserName")
  attribute String @map("Attribute")
  op        String @default("==")
  value     String @map("Value")
  @@index([username, attribute], map: "radcheck_UserName")
  @@map("radcheck")
}
```

**After:**
```prisma
model RadCheck {
  id        Int    @id @default(autoincrement())
  username  String
  attribute String
  op        String @default("==")
  value     String
  @@index([username, attribute], map: "radcheck_username")
  @@map("radcheck")
}
```

## Verification

### 1. Check Database Structure

```sql
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('radcheck', 'radreply', 'radgroupcheck', 'radgroupreply', 'radusergroup')
ORDER BY table_name, ordinal_position;
```

### 2. Test FreeRADIUS Queries

```sql
-- These queries should now work with FreeRADIUS
SELECT id, username, attribute, value, op FROM radcheck WHERE username = 'testuser' ORDER BY id;
SELECT id, username, attribute, value, op FROM radreply WHERE username = 'testuser' ORDER BY id;
SELECT groupname FROM radusergroup WHERE username = 'testuser' ORDER BY priority;
```

### 3. Test User Management System

```bash
# Create a test user
curl -X POST http://localhost:3000/api/radius/users \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass123"}'

# Check if user was created
curl http://localhost:3000/api/radius/users
```

## Benefits

1. **FreeRADIUS Compatibility**: Your database now matches FreeRADIUS expectations
2. **No FreeRADIUS Changes**: Your FreeRADIUS server configuration remains unchanged
3. **Consistent Naming**: All column names follow lowercase convention
4. **Better Performance**: No need for case-insensitive queries

## Troubleshooting

### If Migration Fails

1. **Check Database Connection**: Ensure you can connect to PostgreSQL
2. **Check Permissions**: Ensure the database user has ALTER TABLE permissions
3. **Check for Dependencies**: Ensure no other processes are using the tables

### If Prisma Errors Occur

1. **Regenerate Client**: Run `npx prisma generate`
2. **Check Schema**: Verify the Prisma schema matches the database
3. **Reset Database**: If needed, run `npx prisma db push --force-reset`

### If FreeRADIUS Still Fails

1. **Check Logs**: Look at FreeRADIUS logs for specific error messages
2. **Verify Queries**: Test the SQL queries manually
3. **Check Configuration**: Ensure FreeRADIUS is using the correct database

## Rollback (If Needed)

If you need to rollback the changes:

```sql
-- Rollback radcheck table
ALTER TABLE radcheck RENAME COLUMN username TO "UserName";
ALTER TABLE radcheck RENAME COLUMN attribute TO "Attribute";
ALTER TABLE radcheck RENAME COLUMN value TO "Value";

-- Rollback radreply table
ALTER TABLE radreply RENAME COLUMN username TO "UserName";
ALTER TABLE radreply RENAME COLUMN attribute TO "Attribute";
ALTER TABLE radreply RENAME COLUMN value TO "Value";

-- Continue for other tables...
```

Then revert the Prisma schema changes and run `npx prisma generate`.

## Summary

This solution updates your database schema to use lowercase column names that match FreeRADIUS expectations, eliminating the case sensitivity issues without requiring any changes to your FreeRADIUS server configuration.
