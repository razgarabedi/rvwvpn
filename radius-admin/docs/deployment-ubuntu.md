# Ubuntu Deployment Guide

This guide will help you deploy the Radius Admin manager on Ubuntu using SSH, Nginx, and Let's Encrypt for SSL certificates.

## Prerequisites

- Ubuntu 20.04 LTS or later
- Root or sudo access
- Domain name pointing to your server
- SSH access to the server

## Step 1: Server Setup

### Connect to your Ubuntu server
```bash
ssh username@your-server-ip
```

### Update the system
```bash
sudo apt update && sudo apt upgrade -y
```

### Install required packages
```bash
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx postgresql postgresql-contrib nodejs npm build-essential
```

### Install Node.js 18+ (if not available in default repos)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Step 2: Database Setup

### Configure PostgreSQL
```bash
sudo -u postgres psql
```

In the PostgreSQL prompt:
```sql
CREATE DATABASE radius_admin_db;
-- Create a new user
CREATE USER radius_admin_user WITH PASSWORD 'your_secure_password_here';

-- Grant privileges to the user for the database
GRANT ALL PRIVILEGES ON DATABASE radius_admin_db TO radius_admin_user;

-- Grant schema privileges (for Prisma)
GRANT ALL ON SCHEMA public TO radius_admin_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO radius_admin_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO radius_admin_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO radius_admin_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO radius_admin_user;
-- Connect to your database
   \c radius_admin_db
   
   -- Grant all necessary permissions to your user
   GRANT ALL ON SCHEMA public TO radius_admin_user;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO radius_admin_user;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO radius_admin_user;
   GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO radius_admin_user;
   
   -- Set default privileges for future objects
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO radius_admin_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO radius_admin_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO radius_admin_user;
   
   -- Grant usage on the schema
   GRANT USAGE ON SCHEMA public TO radius_admin_user;
   
   -- Grant create privileges
   GRANT CREATE ON SCHEMA public TO radius_admin_user;
   
   -- Exit psql
   \q
```

### Enable PostgreSQL to start on boot
```bash
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

## Step 3: Application Deployment

### Create application directory
```bash
sudo mkdir -p /var/www/radius-admin
sudo chown $USER:$USER /var/www/radius-admin
cd /var/www/radius-admin
```

### Clone and setup the application
```bash
# If you have the code in a Git repository
git clone https://github.com/yourusername/radius-admin.git .

# Or upload your code using SCP
# scp -r /path/to/radius-admin/* username@your-server-ip:/var/www/radius-admin/
```

### Install dependencies
```bash
npm install
```

### Build the application
```bash
npm run build
```

### Create environment file
```bash
sudo nano .env.production
```

Add the following content:
```env
# Database Configuration
DATABASE_URL=postgresql://radius_admin_user:your_secure_password@localhost:5432/radius_admin

# NextAuth.js
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-very-secure-secret-key-here

# Node Environment
NODE_ENV=production
```

### Set up the database
```bash
# Push the schema to the database
npx prisma db push

# Seed the database with initial data
npx prisma db seed
```

## Step 4: Process Management

You have several options for running the application. Choose the one that works best for you:

### Option 1: Simple PM2 Setup (Recommended)

Use the automated PM2 setup script:
```bash
chmod +x scripts/setup-pm2-simple.sh
./scripts/setup-pm2-simple.sh
```

### Option 2: Systemd Service (No PM2)

Use systemd instead of PM2:
```bash
chmod +x scripts/setup-without-pm2.sh
./scripts/setup-without-pm2.sh
```

### Option 3: Manual PM2 Setup

If you prefer to set up PM2 manually:
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 4: Simple Start Script (Development/Testing)

For development or testing, use the simple start script:
```bash
chmod +x scripts/start-app.sh
./scripts/start-app.sh start
```

**Useful commands:**
- `./scripts/start-app.sh status` - Check if app is running
- `./scripts/start-app.sh restart` - Restart the app
- `./scripts/start-app.sh stop` - Stop the app

## Step 5: Nginx Configuration

### Create Nginx configuration
```bash
sudo nano /etc/nginx/sites-available/radius-admin
```

Add the following content (this is the initial configuration BEFORE running Let's Encrypt):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
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

    location ~ \.(env|log)$ {
        deny all;
    }
}
```

### Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/radius-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 6: SSL Certificate with Let's Encrypt

### Obtain SSL certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Important**: After running this command, certbot will automatically:
- Obtain SSL certificates from Let's Encrypt
- Update your Nginx configuration to include the SSL certificate paths
- Add proper SSL settings and security headers
- Add HTTP to HTTPS redirect
- Test the configuration and reload Nginx

**Note**: The initial Nginx configuration only listens on port 80. After running certbot, it will add a new server block for port 443 with SSL and modify the port 80 block to redirect to HTTPS.

### Test certificate renewal
```bash
sudo certbot renew --dry-run
```

### Set up automatic renewal
```bash
sudo crontab -e
```

Add this line to renew certificates automatically:
```bash
0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 7: Firewall Configuration

### Configure UFW firewall
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Check firewall status
```bash
sudo ufw status
```

## Step 8: System Service Setup

### Create systemd service for PM2
```bash
sudo nano /etc/systemd/system/radius-admin.service
```

Add the following content:
```ini
[Unit]
Description=Radius Admin Application
After=network.target

[Service]
Type=forking
User=www-data
Group=www-data
WorkingDirectory=/var/www/radius-admin
ExecStart=/usr/bin/pm2 start ecosystem.config.js
ExecReload=/usr/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=always

[Install]
WantedBy=multi-user.target
```

### Enable and start the service
```bash
sudo systemctl daemon-reload
sudo systemctl enable radius-admin
sudo systemctl start radius-admin
```

## Step 9: Monitoring and Logs

### View application logs
```bash
pm2 logs radius-admin
```

### View Nginx logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Monitor system resources
```bash
pm2 monit
```

## Step 10: Security Hardening

### Update PostgreSQL configuration
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

Uncomment and modify:
```
listen_addresses = 'localhost'
```

### Restart PostgreSQL
```bash
sudo systemctl restart postgresql
```

### Set up fail2ban for additional security
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Step 11: Backup Strategy

### Create backup script
```bash
sudo nano /usr/local/bin/backup-radius-admin.sh
```

Add the following content:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/radius-admin"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -h localhost -U radius_admin_user radius_admin > $BACKUP_DIR/radius_admin_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/radius-admin-files_$DATE.tar.gz /var/www/radius-admin

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### Make script executable
```bash
sudo chmod +x /usr/local/bin/backup-radius-admin.sh
```

### Set up daily backups
```bash
sudo crontab -e
```

Add this line:
```bash
0 2 * * * /usr/local/bin/backup-radius-admin.sh
```

## Step 12: Testing the Deployment

### Test the application
```bash
curl -I https://yourdomain.com
```

### Test SSL certificate
```bash
curl -I https://yourdomain.com
```

### Test database connection
```bash
cd /var/www/radius-admin
npx prisma db pull
```

## Troubleshooting

### Diagnostic Tools

Before troubleshooting manually, try these automated diagnostic tools:

1. **Comprehensive Diagnostic Script**
   ```bash
   chmod +x scripts/diagnose-nginx.sh
   ./scripts/diagnose-nginx.sh
   ```
   This script checks all components and provides detailed recommendations.

2. **Fix Next.js Nginx Configuration**
   ```bash
   chmod +x scripts/fix-nextjs-nginx.sh
   ./scripts/fix-nextjs-nginx.sh
   ```
   This script applies an improved Nginx configuration specifically for Next.js applications.

3. **Fix SSL Configuration Issues**
   ```bash
   chmod +x scripts/fix-nginx-ssl.sh
   ./scripts/fix-nginx-ssl.sh
   ```
   This script fixes common SSL configuration problems.

### Common Issues

1. **Application won't start**
   
   **If using PM2:**
   ```bash
   pm2 logs radius-admin
   pm2 status
   ```
   
   **If using systemd:**
   ```bash
   sudo systemctl status radius-admin
   sudo journalctl -u radius-admin -f
   ```
   
   **If using simple start script:**
   ```bash
   ./scripts/start-app.sh status
   cat /var/log/radius-admin.log
   ```

2. **Nginx 502 Bad Gateway**
   - Check if the application is running: `pm2 status`
   - Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

3. **Database connection issues**
   - Verify PostgreSQL is running: `sudo systemctl status postgresql`
   - Check database credentials in `.env.production`

4. **SSL certificate issues**
   - Test certificate: `sudo certbot certificates`
   - Renew certificate: `sudo certbot renew`

5. **Site shows XML or doesn't load properly**
   - Run the diagnostic script: `./scripts/diagnose-nginx.sh`
   - Check if Nginx is running: `sudo systemctl status nginx`
   - Check Nginx configuration: `sudo nginx -t`
   - Verify the application is running on port 3000: `netstat -tlnp | grep :3000`
   - Check if the initial Nginx config only has port 80 (no SSL before certbot)
   - Make sure you run `sudo certbot --nginx -d yourdomain.com` after setting up Nginx
   - Try the improved Next.js configuration: `./scripts/fix-nextjs-nginx.sh`

6. **Nginx configuration errors**
   - Test configuration: `sudo nginx -t`
   - Check for syntax errors in `/etc/nginx/sites-available/radius-admin`
   - Make sure you're not trying to use SSL before running certbot

### Useful Commands

```bash
# Restart application
pm2 restart radius-admin

# Restart Nginx
sudo systemctl restart nginx

# Check application status
pm2 status

# View real-time logs
pm2 logs radius-admin --lines 100

# Update application
cd /var/www/radius-admin
git pull
npm install
npm run build
pm2 restart radius-admin
```

## Maintenance

### Regular Updates
1. Update the application code
2. Update dependencies: `npm update`
3. Rebuild: `npm run build`
4. Restart: `pm2 restart radius-admin`

### Monitoring
- Set up monitoring with tools like Uptime Robot
- Monitor server resources with `htop` or `top`
- Check logs regularly for errors

### Security Updates
- Keep the system updated: `sudo apt update && sudo apt upgrade`
- Monitor security advisories
- Regularly update Node.js and npm

## Access Your Application

Once everything is set up, you can access your Radius Admin manager at:
- **URL**: `https://yourdomain.com`
- **Default Login**:
  - Email: `admin@example.com`
  - Password: `adminpassword123`

Remember to change the default password after first login!

## Support

If you encounter any issues:
1. Check the logs: `pm2 logs radius-admin`
2. Verify all services are running: `sudo systemctl status nginx postgresql`
3. Test database connection: `npx prisma db pull`
4. Check firewall: `sudo ufw status`
