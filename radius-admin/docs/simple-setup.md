# Simple Setup Guide

This guide provides the easiest way to get the Radius Admin manager running on Ubuntu without complex PM2 configurations.

## Quick Start (5 minutes)

### 1. Upload and Setup
```bash
# Upload your application to the server
scp -r radius-admin/ username@your-server-ip:/home/username/

# Connect to your server
ssh username@your-server-ip
cd radius-admin
```

### 2. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git nginx postgresql postgresql-contrib nodejs npm build-essential

# Install Node.js 18+ if needed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Setup Database
```bash
# Create database and user
sudo -u postgres psql
```

In PostgreSQL prompt:
```sql
CREATE DATABASE radius_admin_db;
CREATE USER radius_admin_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE radius_admin_db TO radius_admin_user;
\c radius_admin_db
GRANT ALL ON SCHEMA public TO radius_admin_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO radius_admin_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO radius_admin_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO radius_admin_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO radius_admin_user;
\q
```

### 4. Setup Application
```bash
# Move to web directory
sudo mkdir -p /var/www/radius-admin
sudo cp -r . /var/www/radius-admin/
cd /var/www/radius-admin

# Set permissions
sudo chown -R $USER:$USER /var/www/radius-admin

# Create environment file
cat > .env.production << EOF
DATABASE_URL=postgresql://radius_admin_user:your_secure_password@localhost:5432/radius_admin_db
NEXTAUTH_URL=http://yourdomain.com
NEXTAUTH_SECRET=your-very-secure-secret-key-here
NODE_ENV=production
EOF

# Install dependencies and build
npm install
npm run build

# Setup database
npx prisma db push
npx prisma db seed
```

### 5. Start Application (Choose One)

#### Option A: Simple Start Script (Easiest)
```bash
chmod +x scripts/start-app.sh
./scripts/start-app.sh start
```

#### Option B: Systemd Service (Recommended for Production)
```bash
chmod +x scripts/setup-without-pm2.sh
./scripts/setup-without-pm2.sh
```

#### Option C: PM2 (If you prefer PM2)
```bash
chmod +x scripts/setup-pm2-simple.sh
./scripts/setup-pm2-simple.sh
```

### 6. Setup Nginx
```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/radius-admin > /dev/null << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;

    # Proxy to Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Handle static files
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/radius-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Get SSL Certificate
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 8. Test Your Setup
```bash
# Test application
curl -I http://localhost:3000

# Test through Nginx
curl -I http://yourdomain.com

# Check if everything is running
./scripts/start-app.sh status
```

## Access Your Application

- **URL**: `https://yourdomain.com`
- **Default Login**:
  - Email: `admin@example.com`
  - Password: `adminpassword123`

## Management Commands

### If using Simple Start Script:
```bash
./scripts/start-app.sh start    # Start application
./scripts/start-app.sh stop     # Stop application
./scripts/start-app.sh restart  # Restart application
./scripts/start-app.sh status   # Check status
```

### If using Systemd:
```bash
sudo systemctl start radius-admin     # Start service
sudo systemctl stop radius-admin      # Stop service
sudo systemctl restart radius-admin   # Restart service
sudo systemctl status radius-admin    # Check status
sudo journalctl -u radius-admin -f    # View logs
```

### If using PM2:
```bash
pm2 start radius-admin    # Start application
pm2 stop radius-admin     # Stop application
pm2 restart radius-admin  # Restart application
pm2 status                # Check status
pm2 logs radius-admin     # View logs
```

## Troubleshooting

### Application not starting?
```bash
# Check what's running on port 3000
netstat -tlnp | grep :3000

# Check logs
cat /var/log/radius-admin.log

# Check if dependencies are installed
cd /var/www/radius-admin
npm list
```

### Nginx not working?
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Database issues?
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
cd /var/www/radius-admin
npx prisma db pull
```

## Quick Fixes

### Restart Everything:
```bash
# Restart application
./scripts/start-app.sh restart

# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Check Everything:
```bash
# Check all services
sudo systemctl status nginx postgresql
./scripts/start-app.sh status

# Test connectivity
curl -I http://localhost:3000
curl -I http://yourdomain.com
```

This simple setup should get your Radius Admin manager running quickly without complex PM2 configurations!
