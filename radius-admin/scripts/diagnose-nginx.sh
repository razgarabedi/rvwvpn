#!/bin/bash

# Comprehensive Nginx and Next.js diagnostic script
# This script helps diagnose why the website isn't loading properly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="radius-admin"
APP_DIR="/var/www/$APP_NAME"
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

print_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Function to get domain input
get_domain() {
    if [[ -z "$DOMAIN" ]]; then
        read -p "Enter your domain name (e.g., radius.example.com): " DOMAIN
    fi
}

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
        exit 1
    fi
}

# Function to check system services
check_services() {
    print_status "Checking system services..."
    
    # Check Nginx
    if systemctl is-active --quiet nginx; then
        print_status "✅ Nginx is running"
    else
        print_error "❌ Nginx is not running"
        print_status "Starting Nginx..."
        sudo systemctl start nginx
    fi
    
    # Check PostgreSQL
    if systemctl is-active --quiet postgresql; then
        print_status "✅ PostgreSQL is running"
    else
        print_error "❌ PostgreSQL is not running"
        print_status "Starting PostgreSQL..."
        sudo systemctl start postgresql
    fi
}

# Function to check application status
check_application() {
    print_status "Checking application status..."
    
    # Check if PM2 is installed and running
    if command -v pm2 >/dev/null 2>&1; then
        print_status "PM2 is installed"
        
        if pm2 list | grep -q "$APP_NAME"; then
            print_status "✅ Application is running with PM2"
            pm2 status
        else
            print_warning "❌ Application not found in PM2"
            print_status "Available PM2 processes:"
            pm2 list
        fi
    else
        print_warning "PM2 not found. Checking if application is running manually..."
    fi
    
    # Check if port 3000 is listening
    if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
        print_status "✅ Port 3000 is listening"
        netstat -tlnp | grep ":3000 "
    else
        print_error "❌ Port 3000 is not listening"
        print_status "Checking what's running on port 3000..."
        netstat -tlnp | grep ":3000" || echo "Nothing found on port 3000"
    fi
}

# Function to check Nginx configuration
check_nginx_config() {
    print_status "Checking Nginx configuration..."
    
    # Test Nginx configuration
    if sudo nginx -t 2>/dev/null; then
        print_status "✅ Nginx configuration is valid"
    else
        print_error "❌ Nginx configuration has errors"
        print_status "Nginx configuration test output:"
        sudo nginx -t
        return 1
    fi
    
    # Check if site is enabled
    if [[ -L "/etc/nginx/sites-enabled/$APP_NAME" ]]; then
        print_status "✅ Site is enabled"
    else
        print_error "❌ Site is not enabled"
        print_status "Enabling site..."
        sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    fi
    
    # Check site configuration
    if [[ -f "/etc/nginx/sites-available/$APP_NAME" ]]; then
        print_status "✅ Site configuration file exists"
        print_debug "Site configuration content:"
        cat /etc/nginx/sites-available/$APP_NAME
    else
        print_error "❌ Site configuration file not found"
        return 1
    fi
}

# Function to check application files
check_application_files() {
    print_status "Checking application files..."
    
    if [[ -d "$APP_DIR" ]]; then
        print_status "✅ Application directory exists: $APP_DIR"
    else
        print_error "❌ Application directory not found: $APP_DIR"
        return 1
    fi
    
    # Check if .next directory exists (Next.js build)
    if [[ -d "$APP_DIR/.next" ]]; then
        print_status "✅ Next.js build directory exists"
        ls -la "$APP_DIR/.next/"
    else
        print_error "❌ Next.js build directory not found"
        print_status "You may need to run: npm run build"
    fi
    
    # Check if package.json exists
    if [[ -f "$APP_DIR/package.json" ]]; then
        print_status "✅ package.json exists"
    else
        print_error "❌ package.json not found"
        return 1
    fi
    
    # Check if .env file exists
    if [[ -f "$APP_DIR/.env.production" ]]; then
        print_status "✅ Production environment file exists"
    else
        print_warning "❌ Production environment file not found"
        print_status "You may need to create .env.production"
    fi
}

# Function to test application directly
test_application_direct() {
    print_status "Testing application directly..."
    
    # Test if application responds on localhost:3000
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
        print_status "✅ Application responds on localhost:3000"
    else
        print_error "❌ Application does not respond on localhost:3000"
        print_status "Response:"
        curl -I http://localhost:3000 || echo "Connection failed"
    fi
}

# Function to test through Nginx
test_nginx_proxy() {
    print_status "Testing Nginx proxy..."
    
    # Test if Nginx responds
    if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
        print_status "✅ Nginx responds on localhost"
    else
        print_error "❌ Nginx does not respond on localhost"
        print_status "Response:"
        curl -I http://localhost || echo "Connection failed"
    fi
    
    # Test domain if provided
    if [[ -n "$DOMAIN" ]]; then
        print_status "Testing domain: $DOMAIN"
        if curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN | grep -q "200\|301\|302"; then
            print_status "✅ Domain responds: $DOMAIN"
        else
            print_error "❌ Domain does not respond: $DOMAIN"
            print_status "Response:"
            curl -I http://$DOMAIN || echo "Connection failed"
        fi
    fi
}

# Function to check logs
check_logs() {
    print_status "Checking logs..."
    
    # Check Nginx error logs
    print_status "Nginx error logs (last 10 lines):"
    sudo tail -10 /var/log/nginx/error.log || echo "No error logs found"
    
    # Check Nginx access logs
    print_status "Nginx access logs (last 10 lines):"
    sudo tail -10 /var/log/nginx/access.log || echo "No access logs found"
    
    # Check application logs if PM2 is running
    if command -v pm2 >/dev/null 2>&1 && pm2 list | grep -q "$APP_NAME"; then
        print_status "Application logs (last 10 lines):"
        pm2 logs $APP_NAME --lines 10 --nostream
    fi
}

# Function to fix common issues
fix_common_issues() {
    print_status "Attempting to fix common issues..."
    
    # Restart Nginx
    print_status "Restarting Nginx..."
    sudo systemctl restart nginx
    
    # Restart application if PM2 is available
    if command -v pm2 >/dev/null 2>&1 && pm2 list | grep -q "$APP_NAME"; then
        print_status "Restarting application..."
        pm2 restart $APP_NAME
    fi
    
    # Check if port 3000 is available
    if ! netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
        print_status "Starting application manually..."
        cd $APP_DIR
        if [[ -f "package.json" ]]; then
            print_status "Running: npm start"
            nohup npm start > /tmp/radius-admin.log 2>&1 &
            sleep 5
        fi
    fi
}

# Function to show recommendations
show_recommendations() {
    print_status "Recommendations:"
    print_status ""
    
    if ! netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
        print_status "1. Start your application:"
        print_status "   cd $APP_DIR"
        print_status "   npm run build"
        print_status "   npm start"
        print_status "   # Or with PM2:"
        print_status "   pm2 start npm --name '$APP_NAME' -- start"
    fi
    
    if ! systemctl is-active --quiet nginx; then
        print_status "2. Start Nginx:"
        print_status "   sudo systemctl start nginx"
    fi
    
    if [[ ! -f "$APP_DIR/.next" ]]; then
        print_status "3. Build your application:"
        print_status "   cd $APP_DIR"
        print_status "   npm run build"
    fi
    
    if [[ ! -f "$APP_DIR/.env.production" ]]; then
        print_status "4. Create production environment file:"
        print_status "   cd $APP_DIR"
        print_status "   cp .env.example .env.production"
        print_status "   # Edit .env.production with your settings"
    fi
    
    print_status ""
    print_status "5. Test your setup:"
    print_status "   curl -I http://localhost:3000  # Test app directly"
    print_status "   curl -I http://localhost       # Test through Nginx"
    if [[ -n "$DOMAIN" ]]; then
        print_status "   curl -I http://$DOMAIN        # Test domain"
    fi
}

# Main diagnostic function
main() {
    print_status "Starting comprehensive diagnostic..."
    print_status "======================================"
    
    check_root
    get_domain
    
    print_status "1. Checking system services..."
    check_services
    
    print_status "2. Checking application status..."
    check_application
    
    print_status "3. Checking Nginx configuration..."
    check_nginx_config
    
    print_status "4. Checking application files..."
    check_application_files
    
    print_status "5. Testing application directly..."
    test_application_direct
    
    print_status "6. Testing Nginx proxy..."
    test_nginx_proxy
    
    print_status "7. Checking logs..."
    check_logs
    
    print_status "8. Attempting to fix common issues..."
    fix_common_issues
    
    print_status "9. Final recommendations..."
    show_recommendations
    
    print_status "======================================"
    print_status "Diagnostic complete!"
}

# Run main function
main "$@"
