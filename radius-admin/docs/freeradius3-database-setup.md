# FreeRADIUS3 Database Setup Guide

This guide explains how to set up the database to work with FreeRADIUS3 using the provided schema files.

## Overview

The database schema has been updated to match FreeRADIUS3 requirements. The main changes include:

1. **Complete FreeRADIUS3 Schema**: All required tables from `schema.sql` are now included
2. **Proper Field Mapping**: Field names and types match FreeRADIUS3 expectations
3. **Indexes**: Performance indexes as specified in the original schema
4. **User Permissions**: Proper database user setup for FreeRADIUS3

## Database Tables

### Core FreeRADIUS3 Tables

1. **radacct** - Main accounting records table
   - Stores all RADIUS accounting data
   - Includes session tracking, data usage, IP addresses
   - Critical for billing and session management

2. **radcheck** - User check attributes
   - User authentication attributes (passwords, etc.)
   - Used during authentication phase

3. **radreply** - User reply attributes  
   - User-specific reply attributes
   - Used to send attributes back to NAS

4. **radgroupcheck** - Group check attributes
   - Group-based authentication attributes
   - Applied to all users in a group

5. **radgroupreply** - Group reply attributes
   - Group-based reply attributes
   - Applied to all users in a group

6. **radusergroup** - User-group mapping
   - Links users to groups
   - Supports priority-based group assignment

7. **radpostauth** - Post-authentication logging
   - Logs authentication attempts
   - Useful for auditing and debugging

8. **nas** - Network Access Server configuration
   - Defines RADIUS clients (NAS devices)
   - Includes shared secrets and connection info

9. **nasreload** - NAS reload tracking
   - Tracks when NAS devices reload
   - Used for session cleanup

## Setup Instructions

### 1. Database Migration

Run the Prisma migration to create the new schema:

```bash
# Set database URL (adjust as needed)
$env:DATABASE_URL="postgresql://radius_admin_user:secure_password_123@localhost:5432/radius_admin"

# Generate and apply migration
npx prisma migrate dev --name freeradius3-schema-alignment

# Generate Prisma client
npx prisma generate
```

### 2. FreeRADIUS3 User Setup

After the migration, run the setup script to create the FreeRADIUS3 database user:

```bash
# Connect to PostgreSQL as superuser
psql -U postgres -d radius_admin

# Run the setup script
\i scripts/setup-freeradius-db.sql
```

### 3. FreeRADIUS3 Configuration

Update your FreeRADIUS3 configuration to use the new schema:

#### mods-available/sql

```sql
# Database connection
driver = "rlm_sql_postgresql"
server = "localhost"
port = 5432
login = "radius"
password = "radpass"
radius_db = "radius_admin"

# Table names (these match our Prisma schema)
radius_table = "radacct"
authcheck_table = "radcheck"
authreply_table = "radreply"
groupcheck_table = "radgroupcheck"
groupreply_table = "radgroupreply"
usergroup_table = "radusergroup"
postauth_table = "radpostauth"
client_table = "nas"
```

#### mods-available/sql/queries.conf

Use the provided `queries.conf` file from the `postgresql/` directory, which contains all the necessary SQL queries for FreeRADIUS3 operations.

### 4. Testing the Setup

1. **Test Database Connection**:
   ```bash
   # Test connection as radius user
   psql -U radius -d radius_admin -h localhost
   ```

2. **Test FreeRADIUS3**:
   ```bash
   # Start FreeRADIUS3 in debug mode
   radiusd -X
   ```

3. **Test Authentication**:
   ```bash
   # Test with radtest
   radtest username password localhost 0 testing123
   ```

## Data Migration

If you have existing data, you may need to migrate it to the new schema structure. The main considerations:

1. **Field Name Changes**: Some field names have changed to match FreeRADIUS3 conventions
2. **Data Types**: Ensure data types are compatible
3. **Indexes**: The new schema includes performance indexes

## API Updates

The admin panel API routes have been updated to work with the new schema:

- User management now uses the correct FreeRADIUS3 table structure
- Server configuration integrates with the `nas` table
- Accounting data can be viewed through the `radacct` table

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure the `radius` user has proper permissions
2. **Connection Issues**: Check database connection settings
3. **Schema Mismatches**: Verify all tables exist and have correct structure

### Verification Queries

```sql
-- Check if all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('radacct', 'radcheck', 'radreply', 'radgroupcheck', 'radgroupreply', 'radusergroup', 'radpostauth', 'nas', 'nasreload');

-- Check table structure
\d radacct
\d radcheck
\d radreply

-- Check permissions
SELECT * FROM information_schema.table_privileges 
WHERE grantee = 'radius';
```

## Next Steps

1. **Configure FreeRADIUS3**: Update your FreeRADIUS3 configuration files
2. **Test Authentication**: Verify that authentication works correctly
3. **Monitor Logs**: Check FreeRADIUS3 logs for any issues
4. **Performance Tuning**: Monitor database performance and adjust indexes if needed

## Additional Resources

- [FreeRADIUS3 Documentation](https://freeradius.org/documentation/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
