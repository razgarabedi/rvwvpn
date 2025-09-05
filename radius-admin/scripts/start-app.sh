#!/bin/bash

# Simple start script for Radius Admin
# This script starts the application without PM2

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/radius-admin"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if app is already running
check_running() {
    if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
        print_warning "Application is already running on port 3000"
        print_status "PID: $(netstat -tlnp | grep ":3000 " | awk '{print $7}' | cut -d'/' -f1)"
        return 0
    fi
    return 1
}

# Function to start application
start_app() {
    print_status "Starting Radius Admin application..."
    
    # Navigate to app directory
    cd $APP_DIR
    
    # Check if node_modules exists
    if [[ ! -d "node_modules" ]]; then
        print_status "Installing dependencies..."
        npm install
    fi
    
    # Check if .next directory exists
    if [[ ! -d ".next" ]]; then
        print_status "Building application..."
        npm run build
    fi
    
    # Start the application
    print_status "Starting application on port 3000..."
    nohup npm start > /var/log/radius-admin.log 2>&1 &
    
    # Wait a moment for the app to start
    sleep 3
    
    # Check if it's running
    if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
        print_status "✅ Application started successfully!"
        print_status "PID: $(netstat -tlnp | grep ":3000 " | awk '{print $7}' | cut -d'/' -f1)"
        print_status "Logs: tail -f /var/log/radius-admin.log"
    else
        print_warning "❌ Application failed to start"
        print_status "Check logs: cat /var/log/radius-admin.log"
    fi
}

# Function to show status
show_status() {
    print_status "Application Status:"
    
    if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
        print_status "✅ Running on port 3000"
        netstat -tlnp | grep ":3000 "
    else
        print_status "❌ Not running"
    fi
    
    print_status "Recent logs:"
    tail -10 /var/log/radius-admin.log 2>/dev/null || echo "No logs found"
}

# Function to stop application
stop_app() {
    print_status "Stopping application..."
    
    # Find and kill the process
    PID=$(netstat -tlnp 2>/dev/null | grep ":3000 " | awk '{print $7}' | cut -d'/' -f1)
    
    if [[ -n "$PID" ]]; then
        print_status "Killing process $PID"
        kill $PID
        sleep 2
        
        if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
            print_warning "Process still running, force killing..."
            kill -9 $PID
        fi
        
        print_status "✅ Application stopped"
    else
        print_status "No application running on port 3000"
    fi
}

# Function to restart application
restart_app() {
    print_status "Restarting application..."
    stop_app
    sleep 2
    start_app
}

# Function to show help
show_help() {
    echo "Usage: $0 [start|stop|restart|status|help]"
    echo ""
    echo "Commands:"
    echo "  start   - Start the application"
    echo "  stop    - Stop the application"
    echo "  restart - Restart the application"
    echo "  status  - Show application status"
    echo "  help    - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 status"
    echo "  $0 restart"
}

# Main function
main() {
    case "${1:-start}" in
        start)
            if check_running; then
                show_status
            else
                start_app
            fi
            ;;
        stop)
            stop_app
            ;;
        restart)
            restart_app
            ;;
        status)
            show_status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_warning "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
