# Fixing FreeRADIUS Case Sensitivity Issue

## Problem Description

You're getting this error in FreeRADIUS:

```
PGRES_FATAL_ERROR
rlm_sql_postgresql: 42703: UNDEFINED COLUMN
(0) sql: ERROR: rlm_sql_postgresql: ERROR:  column "username" does not exist
(0) sql: ERROR: rlm_sql_postgresql: LINE 1: SELECT id, UserName, Attribute, Value, Op FROM radcheck WHER...
(0) sql: ERROR: rlm_sql_postgresql:                    ^
(0) sql: ERROR: rlm_sql_postgresql: HINT:  Perhaps you meant to reference the column "radcheck.UserName".
(0) sql: ERROR: Error getting check attributes
```

## Root Cause

The issue is a case sensitivity mismatch between:
- **Database Schema**: Uses `UserName` (PascalCase)
- **FreeRADIUS Queries**: Were looking for `username` (lowercase)

## Solution Applied

### 1. Fixed queries.conf File

Updated the following queries in `postgresql/queries.conf`:

**Before:**
```sql
authorize_check_query = "\
	SELECT id, UserName, Attribute, Value, Op \
	FROM ${authcheck_table} \
	WHERE Username = '%{SQL-User-Name}' \
	ORDER BY id"

authorize_reply_query = "\
	SELECT id, UserName, Attribute, Value, Op \
	FROM ${authreply_table} \
	WHERE Username = '%{SQL-User-Name}' \
	ORDER BY id"
```

**After:**
```sql
authorize_check_query = "\
	SELECT id, UserName, Attribute, Value, Op \
	FROM ${authcheck_table} \
	WHERE UserName = '%{SQL-User-Name}' \
	ORDER BY id"

authorize_reply_query = "\
	SELECT id, UserName, Attribute, Value, Op \
	FROM ${authreply_table} \
	WHERE UserName = '%{SQL-User-Name}' \
	ORDER BY id"
```

### 2. Database Schema

Your database schema correctly uses PascalCase column names:

```sql
CREATE TABLE radcheck (
	id			serial PRIMARY KEY,
	UserName		text NOT NULL DEFAULT '',
	Attribute		text NOT NULL DEFAULT '',
	op			VARCHAR(2) NOT NULL DEFAULT '==',
	Value			text NOT NULL DEFAULT ''
);
```

## Verification Steps

### 1. Test the Database Connection

```bash
cd radius-admin
node scripts/test-db-columns.js
```

### 2. Test the Fix

```bash
cd radius-admin
node scripts/fix-database-case-sensitivity.js
```

### 3. Restart FreeRADIUS

```bash
# On Ubuntu/Debian
sudo systemctl restart freeradius

# Check status
sudo systemctl status freeradius

# Check logs
sudo journalctl -u freeradius -f
```

### 4. Test Authentication

Try connecting with a VPN client to verify the fix works.

## Additional Configuration

### FreeRADIUS Configuration Files

Make sure your FreeRADIUS configuration is pointing to the correct files:

1. **sql.conf** - Should point to your PostgreSQL database
2. **queries.conf** - Should use the updated queries (already fixed)
3. **sites-available/default** - Should include the sql module

### Example sql.conf

```conf
sql {
    driver = "rlm_sql_postgresql"
    server = "localhost"
    port = 5432
    login = "freeradius"
    password = "your_password"
    radius_db = "freeradius_db"
    acct_table1 = "radacct"
    acct_table2 = "radacct"
    postauth_table = "radpostauth"
    authcheck_table = "radcheck"
    authreply_table = "radreply"
    groupcheck_table = "radgroupcheck"
    groupreply_table = "radgroupreply"
    usergroup_table = "radusergroup"
    client_table = "nas"
    group_attribute = "SQL-Group"
    group_filter = "`%{control:${group_attribute}}`"
    user_filter = "`%{control:${group_attribute}}`"
    accounting {
        reference = "%{tolower:type.%{%{Acct-Status-Type}:-%{Request-Processing-Stage}}.query}"
    }
    post-auth {
        reference = "%{tolower:type.%{%{Acct-Status-Type}:-%{Request-Processing-Stage}}.query}"
    }
}
```

## Troubleshooting

### If the error persists:

1. **Check FreeRADIUS configuration path:**
   ```bash
   freeradius -X
   ```
   Look for the sql module configuration and verify it's using the correct queries.conf file.

2. **Verify database connection:**
   ```bash
   psql -h localhost -U freeradius -d freeradius_db -c "SELECT * FROM radcheck LIMIT 1;"
   ```

3. **Check FreeRADIUS logs:**
   ```bash
   sudo tail -f /var/log/freeradius/radius.log
   ```

### Common Issues:

1. **Wrong queries.conf file**: Make sure FreeRADIUS is using the updated queries.conf file
2. **Database permissions**: Ensure the FreeRADIUS user has proper database permissions
3. **Case sensitivity**: PostgreSQL is case-sensitive for unquoted identifiers

## Prevention

To prevent this issue in the future:

1. Always use consistent naming conventions in your database schema
2. Use double quotes around column names in SQL queries when case matters
3. Test your FreeRADIUS configuration after any database schema changes
4. Keep your FreeRADIUS queries.conf file in sync with your database schema

## Summary

The case sensitivity issue has been fixed by updating the FreeRADIUS queries to use the correct column names (`UserName` instead of `Username`). The database schema was already correct - it was just the queries that needed to be updated to match.
