-- Fix Database Schema for FreeRADIUS Compatibility
-- This script changes column names from PascalCase to lowercase to match FreeRADIUS expectations

-- ============================================
-- 1. Fix radcheck table
-- ============================================

-- Rename columns to lowercase
ALTER TABLE radcheck RENAME COLUMN "UserName" TO username;
ALTER TABLE radcheck RENAME COLUMN "Attribute" TO attribute;
ALTER TABLE radcheck RENAME COLUMN "Value" TO value;

-- Update indexes
DROP INDEX IF EXISTS radcheck_UserName;
CREATE INDEX radcheck_username ON radcheck (username, attribute);

-- ============================================
-- 2. Fix radreply table
-- ============================================

-- Rename columns to lowercase
ALTER TABLE radreply RENAME COLUMN "UserName" TO username;
ALTER TABLE radreply RENAME COLUMN "Attribute" TO attribute;
ALTER TABLE radreply RENAME COLUMN "Value" TO value;

-- Update indexes
DROP INDEX IF EXISTS radreply_UserName;
CREATE INDEX radreply_username ON radreply (username, attribute);

-- ============================================
-- 3. Fix radgroupcheck table
-- ============================================

-- Rename columns to lowercase
ALTER TABLE radgroupcheck RENAME COLUMN "GroupName" TO groupname;
ALTER TABLE radgroupcheck RENAME COLUMN "Attribute" TO attribute;
ALTER TABLE radgroupcheck RENAME COLUMN "Value" TO value;

-- Update indexes
DROP INDEX IF EXISTS radgroupcheck_GroupName;
CREATE INDEX radgroupcheck_groupname ON radgroupcheck (groupname, attribute);

-- ============================================
-- 4. Fix radgroupreply table
-- ============================================

-- Rename columns to lowercase
ALTER TABLE radgroupreply RENAME COLUMN "GroupName" TO groupname;
ALTER TABLE radgroupreply RENAME COLUMN "Attribute" TO attribute;
ALTER TABLE radgroupreply RENAME COLUMN "Value" TO value;

-- Update indexes
DROP INDEX IF EXISTS radgroupreply_GroupName;
CREATE INDEX radgroupreply_groupname ON radgroupreply (groupname, attribute);

-- ============================================
-- 5. Fix radusergroup table
-- ============================================

-- Rename columns to lowercase
ALTER TABLE radusergroup RENAME COLUMN "UserName" TO username;
ALTER TABLE radusergroup RENAME COLUMN "GroupName" TO groupname;

-- Update indexes
DROP INDEX IF EXISTS radusergroup_UserName;
CREATE INDEX radusergroup_username ON radusergroup (username);

-- ============================================
-- 6. Fix radacct table
-- ============================================

-- Rename columns to lowercase
ALTER TABLE radacct RENAME COLUMN "UserName" TO username;
ALTER TABLE radacct RENAME COLUMN "Realm" TO realm;
ALTER TABLE radacct RENAME COLUMN "NASIPAddress" TO nasipaddress;
ALTER TABLE radacct RENAME COLUMN "NASPortId" TO nasportid;
ALTER TABLE radacct RENAME COLUMN "NASPortType" TO nasporttype;
ALTER TABLE radacct RENAME COLUMN "AcctSessionId" TO acctsessionid;
ALTER TABLE radacct RENAME COLUMN "AcctUniqueId" TO acctuniqueid;
ALTER TABLE radacct RENAME COLUMN "AcctStartTime" TO acctstarttime;
ALTER TABLE radacct RENAME COLUMN "AcctUpdateTime" TO acctupdatetime;
ALTER TABLE radacct RENAME COLUMN "AcctStopTime" TO acctstoptime;
ALTER TABLE radacct RENAME COLUMN "AcctInterval" TO acctinterval;
ALTER TABLE radacct RENAME COLUMN "AcctSessionTime" TO acctsessiontime;
ALTER TABLE radacct RENAME COLUMN "AcctAuthentic" TO acctauthentic;
ALTER TABLE radacct RENAME COLUMN "ConnectInfo_start" TO connectinfo_start;
ALTER TABLE radacct RENAME COLUMN "ConnectInfo_stop" TO connectinfo_stop;
ALTER TABLE radacct RENAME COLUMN "AcctInputOctets" TO acctinputoctets;
ALTER TABLE radacct RENAME COLUMN "AcctOutputOctets" TO acctoutputoctets;
ALTER TABLE radacct RENAME COLUMN "CalledStationId" TO calledstationid;
ALTER TABLE radacct RENAME COLUMN "CallingStationId" TO callingstationid;
ALTER TABLE radacct RENAME COLUMN "AcctTerminateCause" TO acctterminatecause;
ALTER TABLE radacct RENAME COLUMN "ServiceType" TO servicetype;
ALTER TABLE radacct RENAME COLUMN "FramedProtocol" TO framedprotocol;
ALTER TABLE radacct RENAME COLUMN "FramedIPAddress" TO framedipaddress;
ALTER TABLE radacct RENAME COLUMN "FramedIPv6Address" TO framedipv6address;
ALTER TABLE radacct RENAME COLUMN "FramedIPv6Prefix" TO framedipv6prefix;
ALTER TABLE radacct RENAME COLUMN "FramedInterfaceId" TO framedinterfaceid;
ALTER TABLE radacct RENAME COLUMN "DelegatedIPv6Prefix" TO delegatedipv6prefix;
ALTER TABLE radacct RENAME COLUMN "Class" TO class;

-- Update indexes
DROP INDEX IF EXISTS radacct_active_session_idx;
DROP INDEX IF EXISTS radacct_bulk_close;
DROP INDEX IF EXISTS radacct_start_user_idx;
DROP INDEX IF EXISTS radacct_calss_idx;

CREATE INDEX radacct_active_session_idx ON radacct (acctuniqueid) WHERE acctstoptime IS NULL;
CREATE INDEX radacct_bulk_close ON radacct (nasipaddress, acctstarttime) WHERE acctstoptime IS NULL;
CREATE INDEX radacct_start_user_idx ON radacct (acctstarttime, username);
CREATE INDEX radacct_class_idx ON radacct (class);

-- ============================================
-- 7. Fix radpostauth table
-- ============================================

-- Rename columns to lowercase
ALTER TABLE radpostauth RENAME COLUMN "CalledStationId" TO calledstationid;
ALTER TABLE radpostauth RENAME COLUMN "CallingStationId" TO callingstationid;
ALTER TABLE radpostauth RENAME COLUMN "Class" TO class;

-- Update indexes
DROP INDEX IF EXISTS radpostauth_class_idx;
CREATE INDEX radpostauth_class_idx ON radpostauth (class);

-- ============================================
-- 8. Fix nasreload table
-- ============================================

-- Rename columns to lowercase
ALTER TABLE nasreload RENAME COLUMN "NASIPAddress" TO nasipaddress;
ALTER TABLE nasreload RENAME COLUMN "ReloadTime" TO reloadtime;

-- ============================================
-- 9. Verify changes
-- ============================================

-- Check that all tables now have lowercase column names
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('radcheck', 'radreply', 'radgroupcheck', 'radgroupreply', 'radusergroup', 'radacct', 'radpostauth', 'nasreload')
ORDER BY table_name, ordinal_position;

-- ============================================
-- 10. Test queries
-- ============================================

-- Test the queries that FreeRADIUS will use
SELECT id, username, attribute, value, op FROM radcheck WHERE username = 'testuser' ORDER BY id;
SELECT id, username, attribute, value, op FROM radreply WHERE username = 'testuser' ORDER BY id;
SELECT groupname FROM radusergroup WHERE username = 'testuser' ORDER BY priority;

COMMIT;
