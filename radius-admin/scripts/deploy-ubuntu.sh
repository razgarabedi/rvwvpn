#!/bin/bash

# Radius Admin Ubuntu Deployment Script
# This script automates the deployment process on Ubuntu

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="radius-admin"
APP_DIR="/var/www/$APP_NAME"
DOMAIN=""
DB_PASSWORD=""
NEXTAUTH_SECRET=""

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

# Function to get user input
get_user_input() {
    if [[ -z "$DOMAIN" ]]; then
        read -p "Enter your domain name (e.g., radius.example.com): " DOMAIN
    fi
    
    if [[ -z "$DB_PASSWORD" ]]; then
        read -s -p "Enter database password: " DB_PASSWORD
        echo
    fi
    
    if [[ -z "$NEXTAUTH_SECRET" ]]; then
        NEXTAUTH_SECRET=$(openssl rand -base64 32)
        print_status "Generated NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
    fi
}

# Function to update system
update_system() {
    print_status "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
}

# Function to install required packages
install_packages() {
    print_status "Installing required packages..."
    sudo apt install -y curl wget git nginx certbot python3-certbot-nginx postgresql postgresql-contrib nodejs npm build-essential
    
    # Install Node.js 18+ if needed
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt 18 ]]; then
        print_status "Installing Node.js 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
}

# Function to setup database
setup_database() {
    print_status "Setting up PostgreSQL database..."
    
    sudo -u postgres psql << EOF
CREATE DATABASE radius_admin;
CREATE USER radius_admin_user WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE radius_admin TO radius_admin_user;
\q
EOF

    sudo systemctl enable postgresql
    sudo systemctl start postgresql
}

# Function to setup application
setup_application() {
    print_status "Setting up application..."
    
    # Create application directory
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
    cd $APP_DIR
    
    # Copy application files (assuming we're running from the app directory)
    if [[ -f "package.json" ]]; then
        print_status "Application files found, copying to $APP_DIR..."
        cp -r . $APP_DIR/
    else
        print_error "Please run this script from the radius-admin directory"
        exit 1
    fi
    
    # Install dependencies
    cd $APP_DIR
    npm install
    
    # Create production environment file
    cat > .env.production << EOF
# Database Configuration
DATABASE_URL=postgresql://radius_admin_user:$DB_PASSWORD@localhost:5432/radius_admin

# NextAuth.js
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# Node Environment
NODE_ENV=production
EOF

    # Build application
    npm run build
    
    # Setup database
    DATABASE_URL="postgresql://radius_admin_user:$DB_PASSWORD@localhost:5432/radius_admin" npx prisma db push
    DATABASE_URL="postgresql://radius_admin_user:$DB_PASSWORD@localhost:5432/radius_admin" npx prisma db seed
}

# Function to setup PM2
setup_pm2() {
    print_status "Setting up PM2 process manager..."
    
    sudo npm install -g pm2
    
    # Create PM2 ecosystem file
    cat > $APP_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'npm',
    args: 'start',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

    # Start application with PM2
    cd $APP_DIR
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
}

# Function to setup Nginx
setup_nginx() {
    print_status "Setting up Nginx..."
    
    # Create Nginx configuration (before SSL)
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

    # Enable site
    sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx
}

# Function to setup SSL
setup_ssl() {
    print_status "Setting up SSL certificate with Let's Encrypt..."
    print_status "Certbot will automatically update the Nginx configuration with SSL settings..."
    
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    # Setup automatic renewal
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
}

# Function to setup firewall
setup_firewall() {
    print_status "Setting up firewall..."
    
    sudo ufw allow ssh
    sudo ufw allow 'Nginx Full'
    sudo ufw --force enable
}

# Function to create systemd service
setup_systemd() {
    print_status "Setting up systemd service..."
    
    sudo tee /etc/systemd/system/$APP_NAME.service > /dev/null << EOF
[Unit]
Description=Radius Admin Application
After=network.target

[Service]
Type=forking
User=$USER
Group=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/pm2 start ecosystem.config.js
ExecReload=/usr/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable $APP_NAME
    sudo systemctl start $APP_NAME
}

# Function to create backup script
setup_backup() {
    print_status "Setting up backup script..."
    
    sudo tee /usr/local/bin/backup-$APP_NAME.sh > /dev/null << EOF
#!/bin/bash
BACKUP_DIR="/var/backups/$APP_NAME"
DATE=\$(date +%Y%m%d_%H%M%S)
mkdir -p \$BACKUP_DIR

# Backup database
pg_dump -h localhost -U radius_admin_user radius_admin > \$BACKUP_DIR/radius_admin_\$DATE.sql

# Backup application files
tar -czf \$BACKUP_DIR/radius-admin-files_\$DATE.tar.gz $APP_DIR

# Keep only last 7 days of backups
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

    sudo chmod +x /usr/local/bin/backup-$APP_NAME.sh
    
    # Setup daily backups
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-$APP_NAME.sh") | crontab -
}

# Main deployment function
main() {
    print_status "Starting Radius Admin deployment on Ubuntu..."
    
    check_root
    get_user_input
    update_system
    install_packages
    setup_database
    setup_application
    setup_pm2
    setup_nginx
    setup_ssl
    setup_firewall
    setup_systemd
    setup_backup
    
    print_status "Deployment completed successfully!"
    print_status "Your Radius Admin manager is now available at: https://$DOMAIN"
    print_status "Default login credentials:"
    print_status "  Email: admin@example.com"
    print_status "  Password: adminpassword123"
    print_warning "Please change the default password after first login!"
    
    print_status "Useful commands:"
    print_status "  View logs: pm2 logs $APP_NAME"
    print_status "  Restart app: pm2 restart $APP_NAME"
    print_status "  Check status: pm2 status"
    print_status "  View Nginx logs: sudo tail -f /var/log/nginx/error.log"
}

# Run main function
main "$@"
