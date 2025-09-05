#!/bin/bash

# Setup Radius Admin without PM2
# This script sets up the application using systemd service instead of PM2

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="radius-admin"
APP_DIR="/var/www/$APP_NAME"
SERVICE_USER="www-data"

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

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
        exit 1
    fi
}

# Function to create systemd service
create_systemd_service() {
    print_status "Creating systemd service for Radius Admin..."
    
    sudo tee /etc/systemd/system/$APP_NAME.service > /dev/null << EOF
[Unit]
Description=Radius Admin Application
After=network.target postgresql.service

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$APP_NAME

[Install]
WantedBy=multi-user.target
EOF

    print_status "Systemd service created!"
}

# Function to setup application directory
setup_app_directory() {
    print_status "Setting up application directory..."
    
    # Create app directory if it doesn't exist
    sudo mkdir -p $APP_DIR
    
    # Copy application files
    if [[ -f "package.json" ]]; then
        print_status "Copying application files..."
        sudo cp -r . $APP_DIR/
    else
        print_error "Please run this script from the radius-admin directory"
        exit 1
    fi
    
    # Set proper ownership
    sudo chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR
    
    # Install dependencies
    print_status "Installing dependencies..."
    cd $APP_DIR
    sudo -u $SERVICE_USER npm install
    
    # Build the application
    print_status "Building application..."
    sudo -u $SERVICE_USER npm run build
    
    print_status "Application setup completed!"
}

# Function to enable and start service
enable_service() {
    print_status "Enabling and starting service..."
    
    # Reload systemd
    sudo systemctl daemon-reload
    
    # Enable service
    sudo systemctl enable $APP_NAME
    
    # Start service
    sudo systemctl start $APP_NAME
    
    # Check status
    if systemctl is-active --quiet $APP_NAME; then
        print_status "✅ Service is running"
    else
        print_error "❌ Service failed to start"
        print_status "Checking service status:"
        sudo systemctl status $APP_NAME
        exit 1
    fi
}

# Function to show service status
show_status() {
    print_status "Service Status:"
    sudo systemctl status $APP_NAME --no-pager
    
    print_status "Service logs (last 20 lines):"
    sudo journalctl -u $APP_NAME --lines 20 --no-pager
}

# Function to show useful commands
show_commands() {
    print_status "Useful systemd commands:"
    print_status "  sudo systemctl status $APP_NAME     - Show service status"
    print_status "  sudo systemctl start $APP_NAME      - Start service"
    print_status "  sudo systemctl stop $APP_NAME       - Stop service"
    print_status "  sudo systemctl restart $APP_NAME    - Restart service"
    print_status "  sudo journalctl -u $APP_NAME -f     - Follow logs"
    print_status "  sudo journalctl -u $APP_NAME --lines 50 - Show last 50 log lines"
}

# Function to test application
test_application() {
    print_status "Testing application..."
    
    # Wait a moment for the service to start
    sleep 5
    
    # Test if port 3000 is listening
    if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
        print_status "✅ Port 3000 is listening"
    else
        print_warning "❌ Port 3000 is not listening"
        print_status "Checking service logs:"
        sudo journalctl -u $APP_NAME --lines 10 --no-pager
    fi
    
    # Test HTTP response
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
        print_status "✅ Application responds on localhost:3000"
    else
        print_warning "❌ Application does not respond on localhost:3000"
        print_status "Response:"
        curl -I http://localhost:3000 || echo "Connection failed"
    fi
}

# Main function
main() {
    print_status "Setting up Radius Admin without PM2..."
    
    check_root
    setup_app_directory
    create_systemd_service
    enable_service
    show_status
    test_application
    show_commands
    
    print_status "Setup completed successfully!"
    print_status "Your application should now be running on port 3000"
}

# Run main function
main "$@"
