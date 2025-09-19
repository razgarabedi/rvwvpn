#!/bin/bash

# FreeRADIUS Integration Script for User Activity Reports
# This script sets up FreeRADIUS to work with the PostgreSQL database for comprehensive user activity tracking

set -e

echo "🔧 Setting up FreeRADIUS integration for User Activity Reports..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FREERADIUS_DIR="/etc/freeradius/3.0"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="radius"
DB_USER="radius"
DB_PASSWORD="radius"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "  FreeRADIUS Directory: $FREERADIUS_DIR"
echo "  Database Host: $DB_HOST:$DB_PORT"
echo "  Database Name: $DB_NAME"
echo "  Database User: $DB_USER"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Check if FreeRADIUS is installed
if ! command -v freeradius &> /dev/null; then
    echo -e "${RED}❌ FreeRADIUS is not installed. Please install it first.${NC}"
    echo "  Ubuntu/Debian: sudo apt-get install freeradius freeradius-postgresql"
    echo "  CentOS/RHEL: sudo yum install freeradius freeradius-postgresql"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not running or not accessible${NC}"
    exit 1
fi

echo -e "${GREEN}✅ FreeRADIUS and PostgreSQL are available${NC}"

# Create FreeRADIUS configuration for PostgreSQL
echo -e "${BLUE}📝 Creating FreeRADIUS PostgreSQL configuration...${NC}"

# Create sql.conf
cat > $FREERADIUS_DIR/mods-available/sql << 'EOF'
sql {
    driver = "rlm_sql_postgresql"
    server = "localhost"
    port = 5432
    login = "radius"
    password = "radius"
    radius_db = "radius"
    
    # Connection pool settings
    pool {
        start = 5
        min = 4
        max = 10
        spare = 3
        uses = 0
        retry_delay = 30
        lifetime = 0
        idle_timeout = 60
    }
    
    # Accounting settings
    accounting {
        reference = "%{tolower:type.%{Acct-Status-Type}}"
        type = "postgresql"
        
        # Start accounting
        start {
            reference = "accounting_start"
            type = "postgresql"
        }
        
        # Update accounting
        update {
            reference = "accounting_update"
            type = "postgresql"
        }
        
        # Stop accounting
        stop {
            reference = "accounting_stop"
            type = "postgresql"
        }
        
        # Interim accounting
        interim-update {
            reference = "accounting_interim_update"
            type = "postgresql"
        }
    }
    
    # Authentication settings
    authorize {
        reference = "authorize"
        type = "postgresql"
    }
    
    # Post-auth logging
    post-auth {
        reference = "post_auth"
        type = "postgresql"
    }
    
    # Group membership
    group {
        reference = "group"
        type = "postgresql"
    }
}
EOF

# Create SQL queries for accounting
cat > $FREERADIUS_DIR/mods-config/sql/main/postgresql/accounting_start.sql << 'EOF'
INSERT INTO radacct (
    acctsessionid, acctuniqueid, username, realm, nasipaddress, nasportid, nasporttype,
    acctstarttime, acctupdatetime, acctstoptime, acctinterval, acctsessiontime,
    acctauthentic, connectinfo_start, connectinfo_stop, acctinputoctets, acctoutputoctets,
    calledstationid, callingstationid, acctterminatecause, servicetype, framedprotocol,
    framedipaddress, framedipv6address, framedipv6prefix, framedinterfaceid, delegatedipv6prefix, class
) VALUES (
    '%{Acct-Session-Id}', '%{Acct-Unique-Session-Id}', '%{User-Name}', '%{Realm}',
    '%{NAS-IP-Address}', '%{NAS-Port}', '%{NAS-Port-Type}', '%S', '%S', NULL, 0, 0,
    '%{Acct-Authentic}', '%{Connect-Info}', '', 0, 0, '%{Called-Station-Id}',
    '%{Calling-Station-Id}', '', '%{Service-Type}', '%{Framed-Protocol}',
    '%{Framed-IP-Address}', '%{Framed-IPv6-Address}', '%{Framed-IPv6-Prefix}',
    '%{Framed-Interface-Id}', '%{Delegated-IPv6-Prefix}', '%{Class}'
);
EOF

cat > $FREERADIUS_DIR/mods-config/sql/main/postgresql/accounting_update.sql << 'EOF'
UPDATE radacct SET
    acctupdatetime = '%S',
    acctsessiontime = '%{Acct-Session-Time}',
    acctinputoctets = '%{Acct-Input-Octets}',
    acctoutputoctets = '%{Acct-Output-Octets}',
    connectinfo_stop = '%{Connect-Info}'
WHERE acctuniqueid = '%{Acct-Unique-Session-Id}';
EOF

cat > $FREERADIUS_DIR/mods-config/sql/main/postgresql/accounting_stop.sql << 'EOF'
UPDATE radacct SET
    acctupdatetime = '%S',
    acctstoptime = '%S',
    acctsessiontime = '%{Acct-Session-Time}',
    acctinputoctets = '%{Acct-Input-Octets}',
    acctoutputoctets = '%{Acct-Output-Octets}',
    acctterminatecause = '%{Acct-Terminate-Cause}',
    connectinfo_stop = '%{Connect-Info}'
WHERE acctuniqueid = '%{Acct-Unique-Session-Id}';
EOF

cat > $FREERADIUS_DIR/mods-config/sql/main/postgresql/accounting_interim_update.sql << 'EOF'
UPDATE radacct SET
    acctupdatetime = '%S',
    acctsessiontime = '%{Acct-Session-Time}',
    acctinputoctets = '%{Acct-Input-Octets}',
    acctoutputoctets = '%{Acct-Output-Octets}',
    connectinfo_stop = '%{Connect-Info}'
WHERE acctuniqueid = '%{Acct-Unique-Session-Id}';
EOF

# Create post-auth logging
cat > $FREERADIUS_DIR/mods-config/sql/main/postgresql/post_auth.sql << 'EOF'
INSERT INTO radpostauth (
    username, pass, reply, calledstationid, callingstationid, authdate, class
) VALUES (
    '%{User-Name}', '%{User-Password}', '%{reply:Packet-Type}', '%{Called-Station-Id}',
    '%{Calling-Station-Id}', '%S', '%{Class}'
);
EOF

# Create authorize query
cat > $FREERADIUS_DIR/mods-config/sql/main/postgresql/authorize.sql << 'EOF'
SELECT username, attribute, op, value FROM radcheck WHERE username = '%{User-Name}';
SELECT username, attribute, op, value FROM radreply WHERE username = '%{User-Name}';
SELECT groupname FROM radusergroup WHERE username = '%{User-Name}' ORDER BY priority;
SELECT groupname, attribute, op, value FROM radgroupcheck WHERE groupname = '%{SQL-Group-Name}';
SELECT groupname, attribute, op, value FROM radgroupreply WHERE groupname = '%{SQL-Group-Name}';
EOF

# Enable SQL module
echo -e "${BLUE}🔗 Enabling SQL module...${NC}"
ln -sf $FREERADIUS_DIR/mods-available/sql $FREERADIUS_DIR/mods-enabled/sql

# Update sites-available/default
echo -e "${BLUE}📝 Updating FreeRADIUS site configuration...${NC}"

# Backup original configuration
cp $FREERADIUS_DIR/sites-available/default $FREERADIUS_DIR/sites-available/default.backup

# Add SQL module to authorize section
sed -i '/authorize {/a\        sql' $FREERADIUS_DIR/sites-available/default

# Add SQL module to accounting section
sed -i '/accounting {/a\        sql' $FREERADIUS_DIR/sites-available/default

# Add SQL module to post-auth section
sed -i '/post-auth {/a\        sql' $FREERADIUS_DIR/sites-available/default

# Create client configuration for testing
echo -e "${BLUE}📝 Creating client configuration...${NC}"
cat > $FREERADIUS_DIR/clients.conf << 'EOF'
client localhost {
    ipaddr = 127.0.0.1
    secret = testing123
    require_message_authenticator = no
    nas_type = other
}

client 192.168.0.0/16 {
    secret = testing123
    shortname = private-network
    nas_type = other
}

client 10.0.0.0/8 {
    secret = testing123
    shortname = private-network
    nas_type = other
}
EOF

# Set proper permissions
echo -e "${BLUE}🔐 Setting permissions...${NC}"
chown -R freerad:freerad $FREERADIUS_DIR
chmod 640 $FREERADIUS_DIR/mods-config/sql/main/postgresql/*.sql
chmod 640 $FREERADIUS_DIR/clients.conf

# Test configuration
echo -e "${BLUE}🧪 Testing FreeRADIUS configuration...${NC}"
if freeradius -C &> /dev/null; then
    echo -e "${GREEN}✅ FreeRADIUS configuration is valid${NC}"
else
    echo -e "${RED}❌ FreeRADIUS configuration has errors${NC}"
    freeradius -C
    exit 1
fi

# Create systemd service for real-time monitoring
echo -e "${BLUE}📊 Creating real-time monitoring service...${NC}"
cat > /etc/systemd/system/radius-monitor.service << 'EOF'
[Unit]
Description=FreeRADIUS Real-time Activity Monitor
After=freeradius.service postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=freerad
Group=freerad
WorkingDirectory=/opt/radius-admin
ExecStart=/usr/bin/node /opt/radius-admin/scripts/radius-monitor.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Create monitoring script
cat > /opt/radius-admin/scripts/radius-monitor.js << 'EOF'
#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

class RadiusMonitor {
    constructor() {
        this.isRunning = false;
        this.lastCheck = new Date();
    }

    async start() {
        console.log('🔍 Starting FreeRADIUS real-time monitoring...');
        this.isRunning = true;
        
        // Monitor every 30 seconds
        setInterval(() => {
            this.checkActivity();
        }, 30000);
        
        // Initial check
        this.checkActivity();
    }

    async checkActivity() {
        try {
            const now = new Date();
            
            // Get recent activity
            const recentSessions = await prisma.radAcct.findMany({
                where: {
                    acctstarttime: {
                        gte: this.lastCheck
                    }
                },
                orderBy: {
                    acctstarttime: 'desc'
                },
                take: 10
            });

            const recentAuth = await prisma.radPostAuth.findMany({
                where: {
                    authdate: {
                        gte: this.lastCheck
                    }
                },
                orderBy: {
                    authdate: 'desc'
                },
                take: 10
            });

            // Log activity
            if (recentSessions.length > 0 || recentAuth.length > 0) {
                console.log(`📊 Activity detected: ${recentSessions.length} sessions, ${recentAuth.length} auth attempts`);
                
                // Log to file for dashboard consumption
                const logEntry = {
                    timestamp: now.toISOString(),
                    sessions: recentSessions.length,
                    authAttempts: recentAuth.length,
                    data: {
                        sessions: recentSessions,
                        auth: recentAuth
                    }
                };
                
                fs.appendFileSync('/var/log/radius-activity.log', JSON.stringify(logEntry) + '\n');
            }

            this.lastCheck = now;
        } catch (error) {
            console.error('❌ Error monitoring activity:', error);
        }
    }

    stop() {
        console.log('🛑 Stopping FreeRADIUS monitoring...');
        this.isRunning = false;
    }
}

const monitor = new RadiusMonitor();

// Handle graceful shutdown
process.on('SIGINT', () => {
    monitor.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    monitor.stop();
    process.exit(0);
});

// Start monitoring
monitor.start().catch(console.error);
EOF

chmod +x /opt/radius-admin/scripts/radius-monitor.js

# Create log rotation for activity logs
echo -e "${BLUE}📝 Setting up log rotation...${NC}"
cat > /etc/logrotate.d/radius-activity << 'EOF'
/var/log/radius-activity.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 freerad freerad
    postrotate
        systemctl reload radius-monitor
    endscript
}
EOF

# Enable and start services
echo -e "${BLUE}🚀 Starting services...${NC}"
systemctl daemon-reload
systemctl enable radius-monitor
systemctl start radius-monitor

# Restart FreeRADIUS
systemctl restart freeradius

echo -e "${GREEN}✅ FreeRADIUS integration completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Test authentication: radtest testuser testpass localhost 0 testing123"
echo "2. Check logs: tail -f /var/log/freeradius/radius.log"
echo "3. Monitor activity: tail -f /var/log/radius-activity.log"
echo "4. View dashboard: http://your-server:3000"
echo ""
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo "- Update database credentials in $FREERADIUS_DIR/mods-available/sql"
echo "- Configure your NAS devices in $FREERADIUS_DIR/clients.conf"
echo "- Test the integration thoroughly before production use"
echo ""
echo -e "${GREEN}🎉 User Activity Reports are now ready!${NC}"
