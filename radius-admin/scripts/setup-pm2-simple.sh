#!/bin/bash

# Simple PM2 setup script for Radius Admin
# This script provides an easier way to set up PM2

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="radius-admin"
APP_DIR="/var/www/$APP_NAME"

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

# Function to install PM2
install_pm2() {
    print_status "Installing PM2..."
    
    if command -v pm2 >/dev/null 2>&1; then
        print_status "PM2 is already installed"
    else
        print_status "Installing PM2 globally..."
        sudo npm install -g pm2
    fi
}

# Function to create log directory
create_log_directory() {
    print_status "Creating log directory..."
    sudo mkdir -p /var/log/radius-admin
    sudo chown $USER:$USER /var/log/radius-admin
}

# Function to setup PM2
setup_pm2() {
    print_status "Setting up PM2 for Radius Admin..."
    
    # Navigate to app directory
    cd $APP_DIR
    
    # Stop any existing PM2 processes
    if pm2 list | grep -q "$APP_NAME"; then
        print_status "Stopping existing $APP_NAME process..."
        pm2 stop $APP_NAME
        pm2 delete $APP_NAME
    fi
    
    # Start the application with PM2
    print_status "Starting application with PM2..."
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 to start on boot
    print_status "Setting up PM2 to start on boot..."
    pm2 startup
    
    print_status "PM2 setup completed!"
}

# Function to show PM2 status
show_status() {
    print_status "PM2 Status:"
    pm2 status
    
    print_status "Application logs (last 20 lines):"
    pm2 logs $APP_NAME --lines 20 --nostream
}

# Function to show useful commands
show_commands() {
    print_status "Useful PM2 commands:"
    print_status "  pm2 status                    - Show all processes"
    print_status "  pm2 logs $APP_NAME           - Show application logs"
    print_status "  pm2 restart $APP_NAME        - Restart application"
    print_status "  pm2 stop $APP_NAME           - Stop application"
    print_status "  pm2 start $APP_NAME          - Start application"
    print_status "  pm2 monit                     - Monitor processes"
    print_status "  pm2 logs $APP_NAME --lines 50 - Show last 50 log lines"
}

# Main function
main() {
    print_status "Setting up PM2 for Radius Admin..."
    
    check_root
    install_pm2
    create_log_directory
    setup_pm2
    show_status
    show_commands
    
    print_status "PM2 setup completed successfully!"
    print_status "Your application should now be running on port 3000"
}

# Run main function
main "$@"
