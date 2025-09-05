#!/bin/bash

# Fix Nginx SSL configuration
# This script fixes common Nginx SSL issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="radius-admin"
DOMAIN=""

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to get domain input
get_domain() {
    if [[ -z "$DOMAIN" ]]; then
        read -p "Enter your domain name (e.g., radius.example.com): " DOMAIN
    fi
}

# Function to backup current config
backup_config() {
    print_status "Backing up current Nginx configuration..."
    sudo cp /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-available/$APP_NAME.backup.$(date +%Y%m%d_%H%M%S)
    print_status "Backup created successfully!"
}

# Function to create correct initial config
create_correct_config() {
    print_status "Creating correct initial Nginx configuration..."
    
    # Create the correct configuration file
    sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;

    # Proxy to Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Security: Block access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ \.(env|log)\$ {
        deny all;
    }
}
EOF

    print_status "Correct configuration created!"
}

# Function to test and reload Nginx
test_and_reload() {
    print_status "Testing Nginx configuration..."
    
    if sudo nginx -t; then
        print_status "Nginx configuration test passed!"
        sudo systemctl reload nginx
        print_status "Nginx reloaded successfully!"
    else
        print_error "Nginx configuration test failed!"
        print_error "Please check the configuration manually:"
        print_error "sudo nano /etc/nginx/sites-available/$APP_NAME"
        exit 1
    fi
}

# Function to check application status
check_application() {
    print_status "Checking application status..."
    
    # Check if PM2 is running
    if command -v pm2 >/dev/null 2>&1; then
        if pm2 list | grep -q "$APP_NAME"; then
            print_status "Application is running with PM2"
            pm2 status
        else
            print_warning "Application not found in PM2. Please start it:"
            print_warning "pm2 start npm --name '$APP_NAME' -- start"
        fi
    else
        print_warning "PM2 not found. Please make sure your application is running on port 3000"
    fi
    
    # Check if port 3000 is listening
    if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
        print_status "Port 3000 is listening"
    else
        print_warning "Port 3000 is not listening. Please start your application."
    fi
}

# Function to show next steps
show_next_steps() {
    print_status "Nginx configuration has been fixed!"
    print_status ""
    print_status "Next steps:"
    print_status "1. Make sure your application is running on port 3000"
    print_status "2. Test the site at: http://$DOMAIN"
    print_status "3. Run Let's Encrypt to get SSL certificate:"
    print_status "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    print_status ""
    print_status "After running certbot, your site will be available at: https://$DOMAIN"
}

# Main function
main() {
    print_status "Fixing Nginx SSL configuration..."
    
    get_domain
    backup_config
    create_correct_config
    test_and_reload
    check_application
    show_next_steps
}

# Run main function
main "$@"
