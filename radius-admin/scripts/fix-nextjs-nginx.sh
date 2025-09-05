#!/bin/bash

# Fix Nginx configuration for Next.js applications
# This script applies an improved Nginx configuration for better Next.js support

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

# Function to create improved Next.js configuration
create_improved_config() {
    print_status "Creating improved Next.js Nginx configuration..."
    
    # Create the improved configuration file
    sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null << EOF
# Improved Nginx configuration for Next.js Radius Admin
# This configuration better handles Next.js static files and routing

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
    gzip_types 
        text/plain 
        text/css 
        text/xml 
        text/javascript 
        application/x-javascript 
        application/xml+rss 
        application/json
        application/javascript
        application/xml
        image/svg+xml;

    # Handle Next.js static files with proper caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Handle Next.js image optimization
    location /_next/image {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Handle API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Handle Next.js pages and app router
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
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        
        # Handle WebSocket connections
        proxy_set_header Connection "upgrade";
        proxy_set_header Upgrade \$http_upgrade;
    }

    # Security: Block access to sensitive files
    location ~ /\. {
        deny all;
        return 404;
    }

    location ~ \.(env|log|sql)\$ {
        deny all;
        return 404;
    }

    # Block access to node_modules and other sensitive directories
    location ~ /(node_modules|\.git|\.next/cache) {
        deny all;
        return 404;
    }

    # Handle favicon and other static assets
    location = /favicon.ico {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=86400";
    }

    # Handle robots.txt
    location = /robots.txt {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=86400";
    }
}
EOF

    print_status "Improved configuration created!"
}

# Function to test and reload Nginx
test_and_reload() {
    print_status "Testing Nginx configuration..."
    
    if sudo nginx -t; then
        print_status "✅ Nginx configuration test passed!"
        sudo systemctl reload nginx
        print_status "✅ Nginx reloaded successfully!"
    else
        print_error "❌ Nginx configuration test failed!"
        print_error "Please check the configuration manually:"
        print_error "sudo nano /etc/nginx/sites-available/$APP_NAME"
        exit 1
    fi
}

# Function to check application status
check_application() {
    print_status "Checking application status..."
    
    # Check if port 3000 is listening
    if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
        print_status "✅ Port 3000 is listening"
    else
        print_warning "❌ Port 3000 is not listening"
        print_status "You may need to start your application:"
        print_status "cd /var/www/$APP_NAME"
        print_status "npm run build"
        print_status "npm start"
    fi
}

# Function to test the configuration
test_configuration() {
    print_status "Testing configuration..."
    
    # Test localhost
    print_status "Testing localhost..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
        print_status "✅ Localhost responds correctly"
    else
        print_warning "❌ Localhost does not respond correctly"
        print_status "Response:"
        curl -I http://localhost || echo "Connection failed"
    fi
    
    # Test domain if provided
    if [[ -n "$DOMAIN" ]]; then
        print_status "Testing domain: $DOMAIN"
        if curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN | grep -q "200\|301\|302"; then
            print_status "✅ Domain responds correctly: $DOMAIN"
        else
            print_warning "❌ Domain does not respond correctly: $DOMAIN"
            print_status "Response:"
            curl -I http://$DOMAIN || echo "Connection failed"
        fi
    fi
}

# Function to show next steps
show_next_steps() {
    print_status "Nginx configuration has been improved for Next.js!"
    print_status ""
    print_status "Next steps:"
    print_status "1. Make sure your application is running on port 3000"
    print_status "2. Test the site at: http://$DOMAIN"
    print_status "3. If everything works, run Let's Encrypt for SSL:"
    print_status "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    print_status ""
    print_status "If you still have issues, run the diagnostic script:"
    print_status "   ./scripts/diagnose-nginx.sh"
}

# Main function
main() {
    print_status "Fixing Nginx configuration for Next.js..."
    
    get_domain
    backup_config
    create_improved_config
    test_and_reload
    check_application
    test_configuration
    show_next_steps
}

# Run main function
main "$@"
