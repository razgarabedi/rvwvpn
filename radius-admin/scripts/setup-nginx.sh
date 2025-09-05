#!/bin/bash

# Setup Nginx configuration for Radius Admin
# This script creates the initial Nginx config before running Let's Encrypt

set -e

# Colors for output
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

# Function to get domain input
get_domain() {
    if [[ -z "$DOMAIN" ]]; then
        read -p "Enter your domain name (e.g., radius.example.com): " DOMAIN
    fi
}

# Function to create Nginx configuration
create_nginx_config() {
    print_status "Creating Nginx configuration for $DOMAIN..."
    
    # Create the configuration file
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

    print_status "Nginx configuration created successfully!"
}

# Function to enable site
enable_site() {
    print_status "Enabling Nginx site..."
    
    # Remove default site if it exists
    if [[ -L "/etc/nginx/sites-enabled/default" ]]; then
        sudo rm /etc/nginx/sites-enabled/default
        print_status "Removed default Nginx site"
    fi
    
    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    
    # Test configuration
    if sudo nginx -t; then
        print_status "Nginx configuration test passed!"
        sudo systemctl reload nginx
        print_status "Nginx reloaded successfully!"
    else
        print_error "Nginx configuration test failed!"
        exit 1
    fi
}

# Function to show next steps
show_next_steps() {
    print_status "Nginx configuration completed!"
    print_status ""
    print_status "Next steps:"
    print_status "1. Make sure your application is running on port 3000"
    print_status "2. Run Let's Encrypt to get SSL certificate:"
    print_status "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    print_status ""
    print_status "Certbot will automatically:"
    print_status "- Obtain SSL certificates from Let's Encrypt"
    print_status "- Update your Nginx configuration with SSL settings"
    print_status "- Add proper SSL headers and security settings"
    print_status "- Test and reload Nginx"
}

# Main function
main() {
    print_status "Setting up Nginx for Radius Admin..."
    
    get_domain
    create_nginx_config
    enable_site
    show_next_steps
}

# Run main function
main "$@"
