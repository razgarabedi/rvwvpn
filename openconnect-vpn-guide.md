# Complete OpenConnect VPN Server Setup Guide on Ubuntu

## Table of Contents
1. [Prerequisites and System Preparation](#prerequisites-and-system-preparation)
2. [Installing Dependencies](#installing-dependencies)
3. [Compiling OCserv from Source](#compiling-ocserv-from-source)
4. [SSL Certificate Setup with Let's Encrypt](#ssl-certificate-setup-with-lets-encrypt)
5. [OCserv Configuration](#ocserv-configuration)
6. [User and Group Management](#user-and-group-management)
7. [Firewall and Network Configuration](#firewall-and-network-configuration)
8. [Security Optimizations](#security-optimizations)
9. [Performance Optimizations](#performance-optimizations)
10. [Testing the VPN Server](#testing-the-vpn-server)
11. [RADIUS Integration](#radius-integration)
12. [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)

## Prerequisites and System Preparation

### System Requirements
- Ubuntu 22.04 LTS or newer
- Root access via SSH
- A fully qualified domain name (FQDN) pointing to your server
- At least 1GB RAM and 10GB disk space
- Open ports: 80/tcp, 443/tcp, 443/udp

### Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo reboot
```

### Create Dedicated User and Directories
```bash
# Create ocserv user and group
sudo adduser --system --group --no-create-home --disabled-login ocserv

# Create necessary directories
sudo mkdir -p /etc/ocserv/{ssl,config-per-user,config-per-group}
sudo mkdir -p /var/log/ocserv
sudo mkdir -p /var/run/ocserv
sudo mkdir -p /etc/ocserv/raddb

# Set proper permissions
sudo chown -R ocserv:ocserv /etc/ocserv
sudo chown -R ocserv:ocserv /var/log/ocserv
sudo chown -R ocserv:ocserv /var/run/ocserv
```

## Installing Dependencies

### Core Build Dependencies
```bash
sudo apt install -y build-essential git autoconf automake libtool pkg-config
sudo apt install -y libgnutls28-dev libev-dev libpam0g-dev liblz4-dev
sudo apt install -y libseccomp-dev libreadline-dev libnl-route-3-dev
sudo apt install -y libkrb5-dev libradcli-dev libcurl4-gnutls-dev
sudo apt install -y libcjose-dev libjansson-dev libprotobuf-c-dev
sudo apt install -y libtalloc-dev libhttp-parser-dev protobuf-c-compiler
sudo apt install -y gperf nuttcp lcov libuid-wrapper libpam-wrapper
sudo apt install -y libnss-wrapper libsocket-wrapper gss-ntlmssp
sudo apt install -y haproxy iputils-ping freeradius gawk gnutls-bin ipcalc-ng
sudo apt install -y iproute2 yajl-tools tcpdump certbot
```

### Install RADCLI (Required for RADIUS support)
```bash
cd /usr/local/src
sudo wget https://github.com/radcli/radcli/releases/download/1.3.0/radcli-1.3.0.tar.gz
sudo tar -xzf radcli-1.3.0.tar.gz
cd radcli-1.3.0
sudo ./configure --prefix=/usr/local --sysconfdir=/usr/local/etc
sudo make && sudo make install
sudo ldconfig
```

## Compiling OCserv from Source

### Download and Compile OCserv
```bash
cd /usr/local/src
sudo git clone https://gitlab.com/openconnect/ocserv.git
cd ocserv

# Generate build configuration
sudo autoreconf -fvi

# Configure with RADIUS support
sudo ./configure \
    --prefix=/usr/local \
    --sysconfdir=/etc \
    --localstatedir=/var \
    --with-pam \
    --with-radius \
    --with-gssapi \
    --with-utmp \
    --with-seccomp \
    --enable-seccomp

# Compile (may take 10-15 minutes)
sudo make -j$(nproc)

# Install
sudo make install
sudo ldconfig
```

### Create Systemd Service
```bash
sudo tee /etc/systemd/system/ocserv.service > /dev/null <<EOF
[Unit]
Description=OpenConnect SSL VPN server
Documentation=man:ocserv(8)
After=network-online.target
Wants=network-online.target
RequiresMountsFor=/var/lib

[Service]
Type=forking
PIDFile=/var/run/ocserv.pid
ExecStart=/usr/local/sbin/ocserv --config /etc/ocserv/ocserv.conf --pid-file /var/run/ocserv.pid
ExecReload=/bin/kill -HUP \$MAINPID
KillMode=process
User=root
Group=root

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ocserv
```

## SSL Certificate Setup with Let's Encrypt

### Install Certbot and Obtain Certificate
```bash
# Stop any service using port 80/443
sudo systemctl stop apache2 nginx 2>/dev/null || true

# Obtain SSL certificate (replace vpn.example.com with your domain)
sudo certbot certonly --standalone \
    --preferred-challenges http \
    --agree-tos \
    --email your-email@example.com \
    -d vpn.example.com

# Set up automatic renewal (every 2 months as requested)
sudo tee /etc/cron.d/letsencrypt-ocserv > /dev/null <<EOF
# Renew Let's Encrypt certificates every 2 months
0 3 1 */2 * root certbot renew --quiet --post-hook "systemctl restart ocserv"
EOF
```

### Set Certificate Permissions
```bash
# Create certificate access script
sudo tee /usr/local/bin/ocserv-cert-hook.sh > /dev/null <<'EOF'
#!/bin/bash
# Post-renewal hook for ocserv
systemctl restart ocserv
logger "Let's Encrypt certificate renewed and ocserv restarted"
EOF

sudo chmod +x /usr/local/bin/ocserv-cert-hook.sh
```

## OCserv Configuration

### Create Main Configuration File
```bash
sudo tee /etc/ocserv/ocserv.conf > /dev/null <<'EOF'
# OpenConnect VPN Server Configuration

# Authentication methods
auth = "plain[passwd=/etc/ocserv/ocpasswd]"
#auth = "radius[config=/usr/local/etc/radcli/radiusclient.conf,groupconfig=true]"

# Enable certificate authentication as secondary method
#enable-auth = "certificate"

# Server certificates (Let's Encrypt)
server-cert = /etc/letsencrypt/live/vpn.example.com/fullchain.pem
server-key = /etc/letsencrypt/live/vpn.example.com/privkey.pem

# CA certificate for client certificates (if using certificate auth)
#ca-cert = /etc/ocserv/ssl/ca-cert.pem
#cert-user-oid = 2.5.4.3

# TCP and UDP ports
tcp-port = 443
udp-port = 443

# Run as specific user
run-as-user = ocserv
run-as-group = ocserv

# Socket file
socket-file = /var/run/ocserv/ocserv-socket

# PID file
pid-file = /var/run/ocserv.pid

# Server information
server-stats-reset-time = 604800
keepalive = 30
dpd = 60
mobile-dpd = 300

# Dead peer detection for mobile clients
try-mtu-discovery = true

# Client limits
max-clients = 100
max-same-clients = 5

# Session timeout (12 hours)
session-timeout = 43200

# Idle timeout (30 minutes)
idle-timeout = 1800

# Mobile idle timeout (4 hours)
mobile-idle-timeout = 14400

# Default domain
default-domain = vpn.example.com

# IPv4 network configuration
ipv4-network = 10.10.10.0
ipv4-netmask = 255.255.255.0

# IPv6 network configuration (optional)
#ipv6-network = fda9:4efe:7e3b:03ea::/48
#ipv6-subnet-prefix = 64

# DNS servers
dns = 1.1.1.1
dns = 1.0.0.1
dns = 8.8.8.8
dns = 8.8.4.4

# Force all DNS through VPN
tunnel-all-dns = true

# Routes (comment out for full tunnel)
route = default

# TLS priorities for security
tls-priorities = "SECURE256:+SECURE128:-VERS-SSL3.0:-VERS-TLS1.0:-VERS-TLS1.1"

# Cipher preferences (secure and fast)
# Use ChaCha20-Poly1305 for better performance on mobile devices
cipher-list = "CHACHA20-POLY1305:AES256-GCM:AES128-GCM:AES256-CCM:AES128-CCM"

# Compression (disable for security)
compression = false

# Enable stats via occtl
use-occtl = true

# Ban configuration
max-ban-score = 80
ban-reset-time = 1200

# Per-user/group configuration
config-per-user = /etc/ocserv/config-per-user
config-per-group = /etc/ocserv/config-per-group

# Device
device = vpns

# Enable proxy protocol (if behind a load balancer)
#listen-proxy-proto = true

# Custom headers (optional)
custom-header = "X-DTLS-MTU: 1200"
custom-header = "X-CSTP-MTU: 1200"

# Cisco client compatibility
cisco-client-compat = true

# Security features
isolate-workers = true
predictable-ips = false

# Logging
log-level = 1
syslog-facility = daemon

# User profile (optional)
#user-profile = /etc/ocserv/profile.xml

# Enable DTLS for better performance
dtls-legacy = true

# Cookie validity (24 hours)
cookie-validity = 86400

# Deny user on multiple failed attempts
deny-roaming = false
EOF

# Replace vpn.example.com with your actual domain
sudo sed -i 's/vpn.example.com/YOUR_DOMAIN_HERE/g' /etc/ocserv/ocserv.conf
```

## User and Group Management

### Create User Management System
```bash
# Create user password file
sudo touch /etc/ocserv/ocpasswd
sudo chown ocserv:ocserv /etc/ocserv/ocpasswd
sudo chmod 600 /etc/ocserv/ocpasswd

# Create group file
sudo tee /etc/ocserv/groups > /dev/null <<EOF
# Group definitions
# Format: groupname:user1,user2,user3
admins:admin
users:
restricted:
EOF

# Function to add users
sudo tee /usr/local/bin/ocserv-user-mgmt.sh > /dev/null <<'EOF'
#!/bin/bash

OCPASSWD="/etc/ocserv/ocpasswd"
GROUPS_FILE="/etc/ocserv/groups"

add_user() {
    local username="$1"
    local group="${2:-users}"
    
    if [ -z "$username" ]; then
        echo "Usage: $0 add_user <username> [group]"
        exit 1
    fi
    
    echo "Adding user: $username"
    /usr/local/bin/ocpasswd -c "$OCPASSWD" "$username"
    
    # Add user to group
    if grep -q "^${group}:" "$GROUPS_FILE"; then
        sed -i "s/^${group}:/&${username},/" "$GROUPS_FILE"
    else
        echo "${group}:${username}" >> "$GROUPS_FILE"
    fi
    
    echo "User $username added to group $group"
}

delete_user() {
    local username="$1"
    
    if [ -z "$username" ]; then
        echo "Usage: $0 delete_user <username>"
        exit 1
    fi
    
    echo "Deleting user: $username"
    /usr/local/bin/ocpasswd -d "$OCPASSWD" "$username"
    
    # Remove from all groups
    sed -i "s/,${username}//g; s/:${username},/:/" "$GROUPS_FILE"
    
    echo "User $username deleted"
}

list_users() {
    echo "=== VPN Users ==="
    if [ -f "$OCPASSWD" ]; then
        cut -d: -f1 "$OCPASSWD"
    fi
    
    echo -e "\n=== Groups ==="
    cat "$GROUPS_FILE"
}

case "$1" in
    add)
        add_user "$2" "$3"
        ;;
    delete)
        delete_user "$2"
        ;;
    list)
        list_users
        ;;
    *)
        echo "Usage: $0 {add|delete|list} [username] [group]"
        exit 1
        ;;
esac
EOF

sudo chmod +x /usr/local/bin/ocserv-user-mgmt.sh

# Create initial admin user
echo "Creating initial VPN user..."
sudo /usr/local/bin/ocserv-user-mgmt.sh add admin admins
```

### Per-User Configuration Examples
```bash
# Create sample per-user config for admin
sudo tee /etc/ocserv/config-per-user/admin > /dev/null <<EOF
# Admin user configuration
# Grant access to internal networks
route = 192.168.0.0/255.255.0.0
route = 172.16.0.0/255.240.0.0
route = 10.0.0.0/255.0.0.0

# Custom DNS
dns = 192.168.1.1

# Higher bandwidth
rx-data-per-sec = 1000000
tx-data-per-sec = 1000000
EOF

# Create sample per-group config for users
sudo tee /etc/ocserv/config-per-group/users > /dev/null <<EOF
# Regular users configuration
# Limited access - internet only
route = default
tunnel-all-dns = true

# Bandwidth limits
rx-data-per-sec = 500000
tx-data-per-sec = 500000
EOF

# Create restricted group config
sudo tee /etc/ocserv/config-per-group/restricted > /dev/null <<EOF
# Restricted users configuration
# Access to specific networks only
route = 192.168.100.0/255.255.255.0

# Lower bandwidth
rx-data-per-sec = 100000
tx-data-per-sec = 100000

# Shorter session timeout
session-timeout = 3600
EOF

sudo chown -R ocserv:ocserv /etc/ocserv/config-per-*
```

## Firewall and Network Configuration

### Enable IP Forwarding and Optimize Network Stack
```bash
# Enable IP forwarding and network optimizations
sudo tee -a /etc/sysctl.conf > /dev/null <<EOF

# OpenConnect VPN optimizations
net.ipv4.ip_forward = 1
net.ipv6.conf.all.forwarding = 1

# TCP BBR for better performance
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr

# Network performance optimizations
net.core.rmem_default = 262144
net.core.rmem_max = 16777216
net.core.wmem_default = 262144
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 131072 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.core.netdev_max_backlog = 2500
net.ipv4.tcp_slow_start_after_idle = 0

# Security optimizations
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.conf.all.log_martians = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1
EOF

sudo sysctl -p
```

### Configure UFW Firewall
```bash
# Reset UFW
sudo ufw --force reset

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw default allow routed

# Allow SSH (adjust port if needed)
sudo ufw allow 22/tcp

# Allow VPN ports
sudo ufw allow 80/tcp   # For Let's Encrypt
sudo ufw allow 443/tcp  # HTTPS/SSL VPN
sudo ufw allow 443/udp  # DTLS VPN

# Configure NAT in UFW
sudo sed -i 's/DEFAULT_FORWARD_POLICY="DROP"/DEFAULT_FORWARD_POLICY="ACCEPT"/' /etc/default/ufw

# Get primary network interface
INTERFACE=$(ip route | grep default | awk '{print $5}' | head -n1)

# Add NAT rules to UFW
sudo tee -a /etc/ufw/before.rules > /dev/null <<EOF

# NAT table rules for OpenConnect VPN
*nat
:POSTROUTING ACCEPT [0:0]

# Forward traffic from VPN clients through $INTERFACE
-A POSTROUTING -s 10.10.10.0/24 -o $INTERFACE -j MASQUERADE

# End each table with the 'COMMIT' line
COMMIT
EOF

# Enable UFW
sudo ufw --force enable

echo "Firewall configured with interface: $INTERFACE"
```

### Advanced Firewall Rules (Optional)
```bash
# Create advanced iptables rules for better security
sudo tee /etc/ocserv/firewall-rules.sh > /dev/null <<'EOF'
#!/bin/bash

# OpenConnect VPN Advanced Firewall Rules
VPN_INTERFACE="vpns"
VPN_NETWORK="10.10.10.0/24"
WAN_INTERFACE=$(ip route | grep default | awk '{print $5}' | head -n1)

# Rate limiting for VPN connections
iptables -I INPUT -p tcp --dport 443 -m state --state NEW -m recent --set --name vpn_conn
iptables -I INPUT -p tcp --dport 443 -m state --state NEW -m recent --update --seconds 60 --hitcount 10 --name vpn_conn -j DROP

# Protect against DDoS on VPN port
iptables -I INPUT -p udp --dport 443 -m limit --limit 25/minute --limit-burst 100 -j ACCEPT

# Log dropped VPN connection attempts
iptables -I INPUT -p tcp --dport 443 -j LOG --log-prefix "VPN-ATTEMPT: " --log-level 4
iptables -I INPUT -p udp --dport 443 -j LOG --log-prefix "VPN-UDP-ATTEMPT: " --log-level 4

echo "Advanced firewall rules applied"
EOF

sudo chmod +x /etc/ocserv/firewall-rules.sh
# Run once to apply rules
sudo /etc/ocserv/firewall-rules.sh
```

## Security Optimizations

### Hardening Configuration
```bash
# Create security hardening script
sudo tee /etc/ocserv/security-hardening.sh > /dev/null <<'EOF'
#!/bin/bash

# OpenConnect VPN Security Hardening Script

# Set secure file permissions
chmod 600 /etc/ocserv/ocserv.conf
chmod 600 /etc/ocserv/ocpasswd
chown -R ocserv:ocserv /etc/ocserv
chown -R ocserv:ocserv /var/log/ocserv
chown -R ocserv:ocserv /var/run/ocserv

# Secure the certificate files
if [ -d "/etc/letsencrypt/live" ]; then
    chown -R root:ocserv /etc/letsencrypt/live
    chmod -R 640 /etc/letsencrypt/live/*/privkey.pem
    chmod -R 644 /etc/letsencrypt/live/*/fullchain.pem
fi

# Create log rotation configuration
cat > /etc/logrotate.d/ocserv <<LOGROTATE
/var/log/ocserv/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 640 ocserv ocserv
    postrotate
        systemctl reload ocserv > /dev/null 2>&1 || true
    endscript
}
LOGROTATE

echo "Security hardening applied"
EOF

sudo chmod +x /etc/ocserv/security-hardening.sh
sudo /etc/ocserv/security-hardening.sh
```

### Fail2Ban Configuration for VPN
```bash
# Install and configure Fail2Ban
sudo apt install -y fail2ban

# Create OpenConnect jail configuration
sudo tee /etc/fail2ban/jail.d/ocserv.conf > /dev/null <<EOF
[ocserv]
enabled = true
port = 443
protocol = tcp
filter = ocserv
logpath = /var/log/syslog
maxretry = 5
bantime = 3600
findtime = 600
action = iptables[name=ocserv, port=https, protocol=tcp]
EOF

# Create filter for OpenConnect
sudo tee /etc/fail2ban/filter.d/ocserv.conf > /dev/null <<EOF
[Definition]
failregex = ^.*ocserv.*\[.*\]: user '.*' \(group: .*\) login failed$
            ^.*ocserv.*\[.*\]: TLS handshake failed.*$
            ^.*ocserv.*\[.*\]: user authentication failed.*$

ignoreregex =
EOF

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban
```

## Performance Optimizations

### TCP BBR and DTLS Optimizations
```bash
# Verify BBR is enabled
echo "Current TCP congestion control:"
sysctl net.ipv4.tcp_congestion_control

echo "Available congestion control algorithms:"
sysctl net.ipv4.tcp_available_congestion_control

# Additional performance tuning
sudo tee -a /etc/sysctl.conf > /dev/null <<EOF

# Additional performance optimizations for VPN
net.ipv4.tcp_fastopen = 3
net.ipv4.tcp_window_scaling = 1
net.ipv4.tcp_timestamps = 1
net.ipv4.tcp_sack = 1
net.ipv4.tcp_fack = 1
net.ipv4.tcp_ecn = 0
net.ipv4.tcp_dsack = 1

# Increase connection tracking table sizes
net.netfilter.nf_conntrack_max = 1048576
net.netfilter.nf_conntrack_tcp_timeout_established = 7200

# Optimize for VPN traffic
net.core.netdev_budget = 600
net.core.netdev_max_backlog = 5000
EOF

sudo sysctl -p
```

### OCserv Performance Tuning
```bash
# Create performance monitoring script
sudo tee /usr/local/bin/ocserv-monitor.sh > /dev/null <<'EOF'
#!/bin/bash

# OpenConnect VPN Performance Monitor
echo "=== OCserv Status ==="
systemctl status ocserv --no-pager -l

echo -e "\n=== Connected Users ==="
if command -v occtl &> /dev/null; then
    occtl -s /var/run/ocserv/ocserv-socket show users
else
    echo "occtl not available"
fi

echo -e "\n=== Network Statistics ==="
ss -tuln | grep :443

echo -e "\n=== VPN Interface Status ==="
ip addr show vpns 2>/dev/null || echo "VPN interface not active"

echo -e "\n=== Memory Usage ==="
ps aux | grep ocserv | grep -v grep

echo -e "\n=== TCP BBR Status ==="
sysctl net.ipv4.tcp_congestion_control

echo -e "\n=== Active Connections ==="
netstat -an | grep :443 | wc -l
EOF

sudo chmod +x /usr/local/bin/ocserv-monitor.sh
```

## Testing the VPN Server

### Start and Test OCserv
```bash
# Start the service
sudo systemctl start ocserv
sudo systemctl status ocserv

# Check if it's listening on the correct ports
sudo ss -tuln | grep :443

# Test configuration
sudo /usr/local/sbin/ocserv -t -c /etc/ocserv/ocserv.conf

# Check logs
sudo journalctl -u ocserv -f
```

### Client Testing Script
```bash
# Create comprehensive test script
sudo tee /usr/local/bin/ocserv-test.sh > /dev/null <<'EOF'
#!/bin/bash

VPN_SERVER="vpn.example.com"  # Replace with your domain
TEST_USER="testuser"

echo "=== OpenConnect VPN Server Test ==="

# Test 1: Check if service is running
echo "1. Checking OCserv service status..."
if systemctl is-active --quiet ocserv; then
    echo "✓ OCserv service is running"
else
    echo "✗ OCserv service is not running"
    exit 1
fi

# Test 2: Check if ports are listening
echo "2. Checking if VPN ports are listening..."
if ss -tuln | grep -q ":443.*LISTEN"; then
    echo "✓ Port 443 is listening"
else
    echo "✗ Port 443 is not listening"
fi

# Test 3: Check SSL certificate
echo "3. Testing SSL certificate..."
if openssl s_client -connect $VPN_SERVER:443 -servername $VPN_SERVER < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
    echo "✓ SSL certificate is valid"
else
    echo "⚠ SSL certificate verification failed (might be self-signed)"
fi

# Test 4: Create test user if doesn't exist
echo "4. Creating test user..."
if ! grep -q "^$TEST_USER:" /etc/ocserv/ocpasswd 2>/dev/null; then
    echo "testpass" | ocpasswd -c /etc/ocserv/ocpasswd $TEST_USER
    echo "✓ Test user created: $TEST_USER"
else
    echo "✓ Test user already exists: $TEST_USER"
fi

# Test 5: Test client connection (requires openconnect client)
echo "5. Testing client connection..."
if command -v openconnect &> /dev/null; then
    echo "OpenConnect client found. You can test with:"
    echo "sudo openconnect --user=$TEST_USER --passwd-on-stdin $VPN_SERVER <<< 'testpass'"
    echo ""
    echo "For batch mode testing:"
    echo "echo 'testpass' | sudo openconnect --user=$TEST_USER --passwd-on-stdin --background $VPN_SERVER"
else
    echo "⚠ OpenConnect client not installed. Install with: apt install openconnect"
fi

# Test 6: Configuration validation
echo "6. Validating configuration..."
if /usr/local/sbin/ocserv -t -c /etc/ocserv/ocserv.conf >/dev/null 2>&1; then
    echo "✓ Configuration is valid"
else
    echo "✗ Configuration has errors"
    /usr/local/sbin/ocserv -t -c /etc/ocserv/ocserv.conf
fi

# Test 7: Check firewall rules
echo "7. Checking firewall status..."
if ufw status | grep -q "443.*ALLOW"; then
    echo "✓ Firewall allows VPN traffic"
else
    echo "⚠ Firewall might be blocking VPN traffic"
fi

# Test 8: Check IP forwarding
echo "8. Checking IP forwarding..."
if [ "$(sysctl -n net.ipv4.ip_forward)" = "1" ]; then
    echo "✓ IP forwarding is enabled"
else
    echo "✗ IP forwarding is disabled"
fi

echo ""
echo "=== Test Summary ==="
echo "Server: $VPN_SERVER"
echo "Test user: $TEST_USER (password: testpass)"
echo ""
echo "To connect from a client:"
echo "sudo openconnect --user=$TEST_USER $VPN_SERVER"
echo ""
echo "To monitor connections:"
echo "sudo /usr/local/bin/ocserv-monitor.sh"
EOF

sudo chmod +x /usr/local/bin/ocserv-test.sh

# Replace domain placeholder
echo "Please edit /usr/local/bin/ocserv-test.sh and replace 'vpn.example.com' with your actual domain"

# Run initial test
echo "Running initial server test..."
sudo /usr/local/bin/ocserv-test.sh
```

### Client Connection Examples
```bash
# Create client connection examples
sudo tee /etc/ocserv/client-examples.txt > /dev/null <<'EOF'
=== OpenConnect VPN Client Connection Examples ===

1. Linux/macOS Command Line:
   sudo openconnect --user=username vpn.example.com

2. Linux with Background Connection:
   echo 'password' | sudo openconnect --user=username --passwd-on-stdin --background vpn.example.com

3. Windows (using OpenConnect GUI):
   - Download from: https://openconnect.sourceforge.io/
   - Server: vpn.example.com
   - Username: your_username

4. Android (Cisco AnyConnect):
   - Server: vpn.example.com
   - Username: your_username

5. iOS (Cisco AnyConnect):
   - Server: vpn.example.com
   - Username: your_username

6. Test Connection:
   - After connecting, check your IP: curl ifconfig.me
   - Test DNS: nslookup google.com
   - Check routing: ip route (Linux) or route print (Windows)

7. Disconnect:
   - Linux/macOS: Ctrl+C or kill the openconnect process
   - GUI clients: Use disconnect button
EOF
```

## RADIUS Integration

### Install and Configure RADIUS Support

First, ensure RADCLI is properly configured:

```bash
# Configure RADCLI for RADIUS authentication
sudo mkdir -p /usr/local/etc/radcli

sudo tee /usr/local/etc/radcli/radiusclient.conf > /dev/null <<EOF
# RADCLI Configuration for OCserv
authserver 192.168.1.100:1812
acctserver 192.168.1.100:1813

# Shared secret (change this!)
servers /usr/local/etc/radcli/servers

# Dictionary
dictionary /usr/local/etc/radcli/dictionary

# Default realm
default_realm

# Timeout and retries
radius_timeout 10
radius_retries 3

# Local interface to bind (optional)
#bindaddr *

# Login radius user (optional)
login_tries 4
login_timeout 60

# Issue a challenge
issue /usr/local/etc/radcli/issue

# Authentication types
seq_file /var/run/radcli/seq
mapfile /usr/local/etc/radcli/port-id-map

# Accounting
nas_identifier ocserv-vpn
EOF

# Create servers file
sudo tee /usr/local/etc/radcli/servers > /dev/null <<EOF
# RADIUS Servers Configuration
# Format: server[:port] shared_secret

# Primary RADIUS server
192.168.1.100:1812 your_shared_secret_here

# Backup RADIUS server (optional)
#192.168.1.101:1812 your_shared_secret_here
EOF

# Create dictionary file
sudo tee /usr/local/etc/radcli/dictionary > /dev/null <<EOF
# RADIUS Dictionary
ATTRIBUTE User-Name 1 string
ATTRIBUTE User-Password 2 string encrypt=1
ATTRIBUTE CHAP-Password 3 string encrypt=1
ATTRIBUTE NAS-IP-Address 4 ipaddr
ATTRIBUTE NAS-Port 5 integer
ATTRIBUTE Service-Type 6 integer
ATTRIBUTE Framed-Protocol 7 integer
ATTRIBUTE Framed-IP-Address 8 ipaddr
ATTRIBUTE Framed-IP-Netmask 9 ipaddr
ATTRIBUTE Framed-Routing 10 integer
ATTRIBUTE Filter-Id 11 string
ATTRIBUTE Framed-MTU 12 integer
ATTRIBUTE Framed-Compression 13 integer
ATTRIBUTE Login-IP-Host 14 ipaddr
ATTRIBUTE Login-Service 15 integer
ATTRIBUTE Login-TCP-Port 16 integer
ATTRIBUTE Reply-Message 18 string
ATTRIBUTE Callback-Number 19 string
ATTRIBUTE Callback-Id 20 string
ATTRIBUTE Framed-Route 22 string
ATTRIBUTE Framed-IPX-Network 23 ipaddr
ATTRIBUTE State 24 string
ATTRIBUTE Class 25 string
ATTRIBUTE Vendor-Specific 26 string
ATTRIBUTE Session-Timeout 27 integer
ATTRIBUTE Idle-Timeout 28 integer
ATTRIBUTE Termination-Action 29 integer
ATTRIBUTE Called-Station-Id 30 string
ATTRIBUTE Calling-Station-Id 31 string
ATTRIBUTE NAS-Identifier 32 string
ATTRIBUTE Proxy-State 33 string
ATTRIBUTE Login-LAT-Service 34 string
ATTRIBUTE Login-LAT-Node 35 string
ATTRIBUTE Login-LAT-Group 36 string
ATTRIBUTE Framed-AppleTalk-Link 37 integer
ATTRIBUTE Framed-AppleTalk-Network 38 integer
ATTRIBUTE Framed-AppleTalk-Zone 39 string
ATTRIBUTE CHAP-Challenge 60 string
ATTRIBUTE NAS-Port-Type 61 integer
ATTRIBUTE Port-Limit 62 integer
ATTRIBUTE Login-LAT-Port 63 integer

# Values
VALUE Service-Type Login-User 1
VALUE Service-Type Framed-User 2
VALUE Service-Type Callback-Login-User 3
VALUE Service-Type Callback-Framed-User 4
VALUE Service-Type Outbound-User 5
VALUE Service-Type Administrative-User 6
VALUE Service-Type NAS-Prompt-User 7
VALUE Service-Type Authenticate-Only 8
VALUE Service-Type Callback-NAS-Prompt 9

VALUE Framed-Protocol PPP 1
VALUE Framed-Protocol SLIP 2

VALUE Framed-Routing None 0
VALUE Framed-Routing Broadcast 1
VALUE Framed-Routing Listen 2
VALUE Framed-Routing Broadcast-Listen 3

VALUE Framed-Compression None 0
VALUE Framed-Compression Van-Jacobson-TCP-IP 1

VALUE Login-Service Telnet 0
VALUE Login-Service Rlogin 1
VALUE Login-Service TCP-Clear 2
VALUE Login-Service PortMaster 3

VALUE Termination-Action Default 0
VALUE Termination-Action RADIUS-Request 1

VALUE NAS-Port-Type Async 0
VALUE NAS-Port-Type Sync 1
VALUE NAS-Port-Type ISDN-Sync 2
VALUE NAS-Port-Type ISDN-Sync-V120 3
VALUE NAS-Port-Type ISDN-Sync-V110 4
VALUE NAS-Port-Type Virtual 5
EOF

# Set proper permissions
sudo chown -R root:ocserv /usr/local/etc/radcli
sudo chmod 640 /usr/local/etc/radcli/servers
sudo chmod 644 /usr/local/etc/radcli/radiusclient.conf
sudo chmod 644 /usr/local/etc/radcli/dictionary

# Create directory for runtime files
sudo mkdir -p /var/run/radcli
sudo chown ocserv:ocserv /var/run/radcli
```

### Configure OCserv for RADIUS

```bash
# Create RADIUS-enabled OCserv configuration
sudo tee /etc/ocserv/ocserv-radius.conf > /dev/null <<'EOF'
# OpenConnect VPN Server Configuration with RADIUS

# RADIUS Authentication
auth = "radius[config=/usr/local/etc/radcli/radiusclient.conf,groupconfig=true]"

# Optional: Fallback to local authentication
#auth = "plain[passwd=/etc/ocserv/ocpasswd]"

# RADIUS Accounting (optional)
acct = "radius[config=/usr/local/etc/radcli/radiusclient.conf]"

# Server certificates (Let's Encrypt)
server-cert = /etc/letsencrypt/live/vpn.example.com/fullchain.pem
server-key = /etc/letsencrypt/live/vpn.example.com/privkey.pem

# TCP and UDP ports
tcp-port = 443
udp-port = 443

# Run as specific user
run-as-user = ocserv
run-as-group = ocserv

# Socket file
socket-file = /var/run/ocserv/ocserv-socket

# PID file
pid-file = /var/run/ocserv.pid

# RADIUS-specific settings
# Enable group configuration per RADIUS response
enable-auth = "radius"

# Default domain
default-domain = vpn.example.com

# IPv4 network configuration
ipv4-network = 10.10.10.0
ipv4-netmask = 255.255.255.0

# DNS servers
dns = 1.1.1.1
dns = 1.0.0.1

# Force all DNS through VPN
tunnel-all-dns = true

# Routes
route = default

# Session and security settings
session-timeout = 28800
idle-timeout = 1800
keepalive = 30
dpd = 60

# Client limits
max-clients = 200
max-same-clients = 3

# TLS security
tls-priorities = "SECURE256:+SECURE128:-VERS-SSL3.0:-VERS-TLS1.0:-VERS-TLS1.1"

# Device
device = vpns

# Cisco client compatibility
cisco-client-compat = true

# Security features
isolate-workers = true

# Logging
log-level = 1
syslog-facility = daemon

# Per-group configuration (RADIUS can set groups)
config-per-group = /etc/ocserv/config-per-group
EOF
```

### RADIUS Testing and Validation

```bash
# Create RADIUS test script
sudo tee /usr/local/bin/test-radius.sh > /dev/null <<'EOF'
#!/bin/bash

RADIUS_SERVER="192.168.1.100"
RADIUS_SECRET="your_shared_secret_here"
TEST_USER="testuser"
TEST_PASS="testpass"

echo "=== RADIUS Authentication Test ==="

# Test 1: Check if RADIUS server is reachable
echo "1. Testing RADIUS server connectivity..."
if timeout 5 bash -c "</dev/tcp/$RADIUS_SERVER/1812" 2>/dev/null; then
    echo "✓ RADIUS server is reachable on port 1812"
else
    echo "✗ Cannot reach RADIUS server on port 1812"
fi

# Test 2: Test RADIUS authentication (requires radtest if available)
echo "2. Testing RADIUS authentication..."
if command -v radtest &> /dev/null; then
    echo "Running radtest..."
    radtest $TEST_USER $TEST_PASS $RADIUS_SERVER 1812 $RADIUS_SECRET
else
    echo "⚠ radtest not available. Install with: apt install freeradius-utils"
fi

# Test 3: Validate RADCLI configuration
echo "3. Validating RADCLI configuration..."
if [ -f "/usr/local/etc/radcli/radiusclient.conf" ]; then
    echo "✓ RADCLI configuration exists"
    if grep -q "authserver.*$RADIUS_SERVER" /usr/local/etc/radcli/radiusclient.conf; then
        echo "✓ RADIUS server configured in RADCLI"
    else
        echo "✗ RADIUS server not properly configured"
    fi
else
    echo "✗ RADCLI configuration missing"
fi

# Test 4: Check OCserv RADIUS configuration
echo "4. Checking OCserv RADIUS configuration..."
if grep -q "radius\[config=" /etc/ocserv/ocserv.conf; then
    echo "✓ OCserv configured for RADIUS authentication"
else
    echo "⚠ OCserv not configured for RADIUS (check configuration)"
fi

echo ""
echo "=== Configuration Files to Check ==="
echo "RADCLI config: /usr/local/etc/radcli/radiusclient.conf"
echo "RADCLI servers: /usr/local/etc/radcli/servers"
echo "OCserv config: /etc/ocserv/ocserv.conf"
echo ""
echo "To enable RADIUS authentication:"
echo "1. Update RADIUS server IP in /usr/local/etc/radcli/servers"
echo "2. Update shared secret in /usr/local/etc/radcli/servers"
echo "3. Uncomment RADIUS auth line in /etc/ocserv/ocserv.conf"
echo "4. Restart ocserv: systemctl restart ocserv"
EOF

sudo chmod +x /usr/local/bin/test-radius.sh
```

### FreeRADIUS Server Setup Example (Optional)

```bash
# Install FreeRADIUS for testing (optional)
install_freeradius() {
    echo "Installing FreeRADIUS server for testing..."
    
    sudo apt install -y freeradius freeradius-utils
    
    # Create test user
    sudo tee -a /etc/freeradius/3.0/users > /dev/null <<'EOF'

# Test user for OCserv
testuser Cleartext-Password := "testpass"
    Reply-Message := "Hello, %{User-Name}",
    Framed-IP-Address = 10.10.10.100,
    Framed-Route = "192.168.1.0/24"
EOF

    # Configure client
    sudo tee -a /etc/freeradius/3.0/clients.conf > /dev/null <<'EOF'

# OCserv client
client ocserv {
    ipaddr = 127.0.0.1
    secret = your_shared_secret_here
    shortname = ocserv-vpn
}
EOF

    # Start FreeRADIUS
    sudo systemctl enable freeradius
    sudo systemctl start freeradius
    
    echo "FreeRADIUS installed and configured"
    echo "Test with: radtest testuser testpass localhost 1812 your_shared_secret_here"
}

# Uncomment the next line to install FreeRADIUS
# install_freeradius
```

## Monitoring and Troubleshooting

### Comprehensive Monitoring Setup

```bash
# Create comprehensive monitoring script
sudo tee /usr/local/bin/ocserv-status.sh > /dev/null <<'EOF'
#!/bin/bash

echo "========================================"
echo "    OpenConnect VPN Server Status"
echo "========================================"

# Service status
echo "=== Service Status ==="
systemctl status ocserv --no-pager

# Network listening
echo -e "\n=== Network Status ==="
echo "Listening ports:"
ss -tuln | grep :443
echo ""
echo "Active connections:"
ss -tuln | grep :443 | wc -l

# Connected users
echo -e "\n=== Connected Users ==="
if [ -S "/var/run/ocserv/ocserv-socket" ]; then
    if command -v occtl &> /dev/null; then
        /usr/local/bin/occtl -s /var/run/ocserv/ocserv-socket show users 2>/dev/null || echo "No users connected"
    else
        echo "occtl not available"
    fi
else
    echo "OCserv socket not available"
fi

# System resources
echo -e "\n=== System Resources ==="
echo "Memory usage:"
ps aux | grep -E "(ocserv|PID)" | grep -v grep
echo ""
echo "CPU usage:"
top -bn1 | grep "ocserv" | head -5

# Network interface
echo -e "\n=== VPN Interface ==="
if ip link show vpns &>/dev/null; then
    ip addr show vpns
else
    echo "VPN interface not active"
fi

# Recent logs
echo -e "\n=== Recent Logs (last 10 lines) ==="
journalctl -u ocserv --no-pager -n 10

# Certificate status
echo -e "\n=== Certificate Status ==="
if [ -f "/etc/letsencrypt/live/vpn.example.com/fullchain.pem" ]; then
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/vpn.example.com/fullchain.pem | cut -d= -f2)
    echo "Certificate expires: $CERT_EXPIRY"
else
    echo "Certificate file not found"
fi

# Configuration test
echo -e "\n=== Configuration Test ==="
if /usr/local/sbin/ocserv -t -c /etc/ocserv/ocserv.conf >/dev/null 2>&1; then
    echo "✓ Configuration is valid"
else
    echo "✗ Configuration has errors:"
    /usr/local/sbin/ocserv -t -c /etc/ocserv/ocserv.conf
fi
EOF

sudo chmod +x /usr/local/bin/ocserv-status.sh
```

### Log Analysis Tools

```bash
# Create log analysis script
sudo tee /usr/local/bin/ocserv-logs.sh > /dev/null <<'EOF'
#!/bin/bash

echo "=== OpenConnect VPN Log Analysis ==="

# Function to analyze logs
analyze_logs() {
    local timeframe="${1:-1 hour ago}"
    
    echo "Analyzing logs since: $timeframe"
    echo "=================================="
    
    # Connection attempts
    echo "=== Connection Attempts ==="
    journalctl -u ocserv --since "$timeframe" | grep -c "connect" || echo "0"
    
    # Successful logins
    echo -e "\n=== Successful Logins ==="
    journalctl -u ocserv --since "$timeframe" | grep "logged in" | tail -10
    
    # Failed login attempts
    echo -e "\n=== Failed Login Attempts ==="
    journalctl -u ocserv --since "$timeframe" | grep -i "fail\|error" | tail -10
    
    # Disconnections
    echo -e "\n=== Recent Disconnections ==="
    journalctl -u ocserv --since "$timeframe" | grep "disconnect" | tail -10
    
    # IP assignments
    echo -e "\n=== IP Assignments ==="
    journalctl -u ocserv --since "$timeframe" | grep "assigned" | tail -10
    
    # Errors and warnings
    echo -e "\n=== Errors and Warnings ==="
    journalctl -u ocserv --since "$timeframe" | grep -i "warn\|error\|fatal" | tail -10
}

# Default analysis for last hour
if [ $# -eq 0 ]; then
    analyze_logs
else
    analyze_logs "$1"
fi

echo -e "\n=== Usage Examples ==="
echo "$0                    # Last hour"
echo "$0 '24 hours ago'     # Last 24 hours"
echo "$0 '2024-01-01'       # Since specific date"
echo ""
echo "=== Live monitoring ==="
echo "journalctl -u ocserv -f"
EOF

sudo chmod +x /usr/local/bin/ocserv-logs.sh
```

### Troubleshooting Guide

```bash
# Create troubleshooting guide
sudo tee /etc/ocserv/troubleshooting.md > /dev/null <<'EOF'
# OpenConnect VPN Troubleshooting Guide

## Common Issues and Solutions

### 1. Service Won't Start
**Symptoms:** `systemctl start ocserv` fails
**Solutions:**
- Check configuration: `/usr/local/sbin/ocserv -t -c /etc/ocserv/ocserv.conf`
- Check certificate permissions: `ls -la /etc/letsencrypt/live/*/`
- Check if ports are available: `ss -tuln | grep :443`
- Review logs: `journalctl -u ocserv -n 50`

### 2. Clients Can't Connect
**Symptoms:** Connection timeouts or certificate errors
**Solutions:**
- Verify firewall: `ufw status` and check port 443
- Test SSL certificate: `openssl s_client -connect server:443`
- Check DNS resolution of server domain
- Verify Let's Encrypt certificate renewal

### 3. Authentication Failures
**Symptoms:** "Login failed" in logs
**Solutions:**
- Check user exists: `grep username /etc/ocserv/ocpasswd`
- Test with simple password (no special characters)
- For RADIUS: Test with `radtest` command
- Check authentication method in config

### 4. No Internet Access After Connection
**Symptoms:** Connected but no internet
**Solutions:**
- Check IP forwarding: `sysctl net.ipv4.ip_forward`
- Verify NAT rules: `iptables -t nat -L`
- Check routing: `ip route show`
- Verify DNS settings in client

### 5. Poor Performance
**Symptoms:** Slow speeds or high latency
**Solutions:**
- Enable TCP BBR: `sysctl net.ipv4.tcp_congestion_control`
- Check CPU usage: `top`
- Monitor network interface: `iftop -i vpns`
- Adjust MTU settings

### 6. Certificate Issues
**Symptoms:** SSL/TLS errors
**Solutions:**
- Renew certificate: `certbot renew --force-renewal`
- Check certificate expiry: `openssl x509 -enddate -noout -in cert.pem`
- Verify certificate chain: `openssl verify -CApath /etc/ssl/certs cert.pem`

## Diagnostic Commands

### Check service status:
systemctl status ocserv
journalctl -u ocserv -n 50

### Test configuration:
/usr/local/sbin/ocserv -t -c /etc/ocserv/ocserv.conf

### Monitor connections:
/usr/local/bin/occtl -s /var/run/ocserv/ocserv-socket show users
ss -tuln | grep :443

### Check system resources:
ps aux | grep ocserv
df -h
free -h

### Network diagnostics:
ip addr show vpns
iptables -t nat -L
ping -c 4 8.8.8.8

## Log Locations
- System logs: `journalctl -u ocserv`
- OCserv logs: `/var/log/ocserv/`
- System logs: `/var/log/syslog`
- Authentication logs: `/var/log/auth.log`

## Configuration Files
- Main config: `/etc/ocserv/ocserv.conf`
- User passwords: `/etc/ocserv/ocpasswd`
- Per-user configs: `/etc/ocserv/config-per-user/`
- Per-group configs: `/etc/ocserv/config-per-group/`
- SSL certificates: `/etc/letsencrypt/live/`

## Support Commands
Run these for support requests:
- `/usr/local/bin/ocserv-status.sh`
- `/usr/local/bin/ocserv-logs.sh`
- `uname -a`
- `lsb_release -a`
EOF
```

## Final Setup and Validation

```bash
# Create final setup validation script
sudo tee /usr/local/bin/ocserv-final-check.sh > /dev/null <<'EOF'
#!/bin/bash

echo "==========================================="
echo "   OpenConnect VPN Final Setup Check"
echo "==========================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check function
check_item() {
    local description="$1"
    local command="$2"
    local expected="$3"
    
    echo -n "Checking $description... "
    
    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        return 1
    fi
}

# Tests
echo "=== Core System Checks ==="
check_item "OCserv service running" "systemctl is-active --quiet ocserv"
check_item "OCserv enabled at boot" "systemctl is-enabled --quiet ocserv"
check_item "Port 443 TCP listening" "ss -tuln | grep -q ':443.*LISTEN'"
check_item "IP forwarding enabled" "[ \$(sysctl -n net.ipv4.ip_forward) = '1' ]"
check_item "TCP BBR enabled" "[ \$(sysctl -n net.ipv4.tcp_congestion_control) = 'bbr' ]"

echo -e "\n=== Configuration Checks ==="
check_item "OCserv config valid" "/usr/local/sbin/ocserv -t -c /etc/ocserv/ocserv.conf"
check_item "User password file exists" "[ -f /etc/ocserv/ocpasswd ]"
check_item "SSL certificate exists" "[ -f /etc/letsencrypt/live/*/fullchain.pem ]"
check_item "SSL private key exists" "[ -f /etc/letsencrypt/live/*/privkey.pem ]"

echo -e "\n=== Security Checks ==="
check_item "Firewall enabled" "ufw status | grep -q 'Status: active'"
check_item "Fail2Ban running" "systemctl is-active --quiet fail2ban"
check_item "OCserv user exists" "getent passwd ocserv"
check_item "Secure file permissions" "[ \$(stat -c %a /etc/ocserv/ocpasswd) = '600' ]"

echo -e "\n=== Network Checks ==="
check_item "UFW allows port 443" "ufw status | grep -q '443.*ALLOW'"
check_item "NAT rules configured" "iptables -t nat -L | grep -q MASQUERADE"

echo -e "\n=== Monitoring Tools ==="
check_item "OCctl available" "command -v occtl"
check_item "Status script exists" "[ -x /usr/local/bin/ocserv-status.sh ]"
check_item "Log analysis script exists" "[ -x /usr/local/bin/ocserv-logs.sh ]"
check_item "User management script exists" "[ -x /usr/local/bin/ocserv-user-mgmt.sh ]"

echo -e "\n=== Certificate Status ==="
if [ -f "/etc/letsencrypt/live/*/fullchain.pem" ]; then
    CERT_FILE=$(find /etc/letsencrypt/live -name "fullchain.pem" | head -1)
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in "$CERT_FILE" | cut -d= -f2)
    DAYS_LEFT=$(( ($(date -d "$CERT_EXPIRY" +%s) - $(date +%s)) / 86400 ))
    
    if [ $DAYS_LEFT -gt 30 ]; then
        echo -e "Certificate expiry: ${GREEN}$CERT_EXPIRY ($DAYS_LEFT days left)${NC}"
    elif [ $DAYS_LEFT -gt 7 ]; then
        echo -e "Certificate expiry: ${YELLOW}$CERT_EXPIRY ($DAYS_LEFT days left)${NC}"
    else
        echo -e "Certificate expiry: ${RED}$CERT_EXPIRY ($DAYS_LEFT days left) - URGENT RENEWAL NEEDED${NC}"
    fi
fi

echo -e "\n=== Summary ==="
echo "Next steps:"
echo "1. Create VPN users: /usr/local/bin/ocserv-user-mgmt.sh add username"
echo "2. Test connection: /usr/local/bin/ocserv-test.sh"
echo "3. Monitor status: /usr/local/bin/ocserv-status.sh"
echo "4. View logs: /usr/local/bin/ocserv-logs.sh"
echo ""
echo "For RADIUS integration:"
echo "1. Configure RADIUS server details in /usr/local/etc/radcli/servers"
echo "2. Update OCserv config to use RADIUS authentication"
echo "3. Test with: /usr/local/bin/test-radius.sh"
echo ""
echo "Configuration files:"
echo "- Main config: /etc/ocserv/ocserv.conf"
echo "- User management: /usr/local/bin/ocserv-user-mgmt.sh"
echo "- Troubleshooting: /etc/ocserv/troubleshooting.md"
EOF

sudo chmod +x /usr/local/bin/ocserv-final-check.sh

# Run final check
echo "Running final setup validation..."
sudo /usr/local/bin/ocserv-final-check.sh
```

## Usage Instructions

After completing this setup, use these commands:

```bash
# Add a new VPN user
sudo /usr/local/bin/ocserv-user-mgmt.sh add username

# Test the VPN server
sudo /usr/local/bin/ocserv-test.sh

# Monitor server status
sudo /usr/local/bin/ocserv-status.sh

# Analyze logs
sudo /usr/local/bin/ocserv-logs.sh

# Test RADIUS (if configured)
sudo /usr/local/bin/test-radius.sh

# Client connection command
sudo openconnect --user=username your-domain.com
```

## Important Notes

1. **Replace placeholders**: Update `vpn.example.com` with your actual domain name
2. **Security**: Change default passwords and secrets
3. **Firewall**: Ensure ports 80, 443/tcp, and 443/udp are accessible
4. **DNS**: Point your domain to the server's public IP
5. **Monitoring**: Regularly check logs and certificate expiry
6. **Updates**: Keep the system and OCserv updated

This comprehensive guide provides a production-ready OpenConnect VPN server with security hardening, performance optimization, monitoring tools, and RADIUS integration support.
