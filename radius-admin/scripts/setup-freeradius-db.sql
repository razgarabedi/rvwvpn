-- FreeRADIUS3 Database Setup Script
-- This script sets up the database according to FreeRADIUS3 requirements

-- Create the database and user if they don't exist
-- Note: These commands need to be run as a PostgreSQL superuser

-- Create database (run as postgres superuser)
-- CREATE DATABASE radius_admin;
-- CREATE USER radius_admin_user WITH PASSWORD 'secure_password_123';
-- GRANT ALL PRIVILEGES ON DATABASE radius_admin TO radius_admin_user;

-- Connect to the radius_admin database and run the following:

-- Grant schema permissions
GRANT USAGE ON SCHEMA public TO radius_admin_user;
GRANT CREATE ON SCHEMA public TO radius_admin_user;

-- Create the FreeRADIUS3 schema tables
-- This will be handled by Prisma migrations, but here's the reference:

-- The main tables that need to be created:
-- 1. radacct - Accounting records
-- 2. radcheck - User check attributes  
-- 3. radreply - User reply attributes
-- 4. radgroupcheck - Group check attributes
-- 5. radgroupreply - Group reply attributes
-- 6. radusergroup - User-group mapping
-- 7. radpostauth - Post-authentication logging
-- 8. nas - Network Access Server configuration
-- 9. nasreload - NAS reload tracking

-- After Prisma migration, run the setup.sql to create the radius user and permissions
-- This is needed for FreeRADIUS3 to connect to the database

-- Create radius user for FreeRADIUS3
CREATE USER radius WITH PASSWORD 'radpass';

-- Grant permissions for authorization data
GRANT SELECT ON radcheck TO radius;
GRANT SELECT ON radreply TO radius;
GRANT SELECT ON radusergroup TO radius;
GRANT SELECT ON radgroupcheck TO radius;
GRANT SELECT ON radgroupreply TO radius;

-- Grant permissions for accounting and post-auth data
GRANT SELECT, INSERT, UPDATE ON radacct TO radius;
GRANT SELECT, INSERT, UPDATE ON radpostauth TO radius;

-- Grant permissions for NAS data
GRANT SELECT ON nas TO radius;

-- Grant permissions for NAS reload tracking
GRANT SELECT, INSERT, UPDATE ON nasreload TO radius;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON SEQUENCE radcheck_id_seq TO radius;
GRANT USAGE, SELECT ON SEQUENCE radreply_id_seq TO radius;
GRANT USAGE, SELECT ON SEQUENCE radusergroup_id_seq TO radius;
GRANT USAGE, SELECT ON SEQUENCE radgroupcheck_id_seq TO radius;
GRANT USAGE, SELECT ON SEQUENCE radgroupreply_id_seq TO radius;
GRANT USAGE, SELECT ON SEQUENCE radacct_radacctid_seq TO radius;
GRANT USAGE, SELECT ON SEQUENCE radpostauth_id_seq TO radius;
GRANT USAGE, SELECT ON SEQUENCE nas_id_seq TO radius;
