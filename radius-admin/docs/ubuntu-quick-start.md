# Ubuntu Quick Start Guide

This guide provides a quick way to deploy the Radius Admin manager on Ubuntu with minimal manual steps.

## Prerequisites

- Ubuntu 20.04 LTS or later
- Domain name pointing to your server
- SSH access to the server
- Root or sudo access

## Quick Deployment (Automated)

### 1. Upload the Application

```bash
# From your local machine, upload the application to your server
scp -r radius-admin/ username@your-server-ip:/home/username/
```

### 2. Connect to Your Server

```bash
ssh username@your-server-ip
cd radius-admin
```

### 3. Run the Deployment Script

```bash
# Make the script executable
chmod +x scripts/deploy-ubuntu.sh

# Run the deployment script
./scripts/deploy-ubuntu.sh
```

The script will prompt you for:
- Domain name (e.g., radius.example.com)
- Database password (choose a secure password)
- NEXTAUTH_SECRET (will be auto-generated if not provided)

### 4. Access Your Application

Once deployment is complete, visit:
- **URL**: `https://yourdomain.com`
- **Default Login**:
  - Email: `admin@example.com`
  - Password: `adminpassword123`

## Manual Deployment (Step by Step)

If you prefer to run each step manually, follow the detailed guide:

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install packages
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx postgresql postgresql-contrib nodejs npm build-essential

# 3. Install Node.js 18+ (if needed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Setup database
sudo -u postgres psql
# In PostgreSQL prompt:
# CREATE DATABASE radius_admin;
# CREATE USER radius_admin_user WITH PASSWORD 'your_password';
# GRANT ALL PRIVILEGES ON DATABASE radius_admin TO radius_admin_user;
# \q

# 5. Setup application
sudo mkdir -p /var/www/radius-admin
sudo chown $USER:$USER /var/www/radius-admin
cp -r . /var/www/radius-admin/
cd /var/www/radius-admin
npm install
npm run build

# 6. Create environment file
cat > .env.production << EOF
DATABASE_URL=postgresql://radius_admin_user:your_password@localhost:5432/radius_admin
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key
NODE_ENV=production
EOF

# 7. Setup database
npx prisma db push
npx prisma db seed

# 8. Install PM2 and start app
sudo npm install -g pm2
pm2 start npm --name "radius-admin" -- start
pm2 save
pm2 startup

# 9. Setup Nginx (see detailed guide for full config)
sudo nano /etc/nginx/sites-available/radius-admin
# Add the Nginx configuration from the detailed guide (without SSL cert paths)

# 10. Enable site and get SSL
sudo ln -s /etc/nginx/sites-available/radius-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 11. Get SSL certificate (this will automatically update Nginx config)
sudo certbot --nginx -d yourdomain.com
```

## Post-Deployment

### Change Default Password
1. Log in with default credentials
2. Go to user management
3. Edit the admin user and change the password

### Configure FreeRADIUS Server
1. Go to Server Configuration section
2. Update the default server settings with your actual FreeRADIUS server details
3. Add additional servers if needed

### Monitor the Application
```bash
# View application logs
pm2 logs radius-admin

# Check application status
pm2 status

# Restart application
pm2 restart radius-admin

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   ```bash
   # Check if app is running
   pm2 status
   
   # Check logs
   pm2 logs radius-admin
   ```

2. **Database Connection Error**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Test database connection
   cd /var/www/radius-admin
   npx prisma db pull
   ```

3. **SSL Certificate Issues**
   ```bash
   # Check certificate status
   sudo certbot certificates
   
   # Renew certificate
   sudo certbot renew
   ```

4. **Permission Issues**
   ```bash
   # Fix ownership
   sudo chown -R $USER:$USER /var/www/radius-admin
   
   # Fix permissions
   chmod -R 755 /var/www/radius-admin
   ```

## Security Checklist

- [ ] Changed default admin password
- [ ] Updated FreeRADIUS server configuration
- [ ] Configured firewall (UFW)
- [ ] Set up regular backups
- [ ] Enabled fail2ban
- [ ] Updated system packages
- [ ] Configured SSL certificate
- [ ] Set up monitoring

## Maintenance

### Regular Updates
```bash
cd /var/www/radius-admin
git pull
npm install
npm run build
pm2 restart radius-admin
```

### Backup
```bash
# Manual backup
sudo /usr/local/bin/backup-radius-admin.sh

# Check backup status
ls -la /var/backups/radius-admin/
```

### Monitoring
```bash
# Check system resources
htop

# Check application performance
pm2 monit

# Check disk space
df -h
```

## Support

If you encounter issues:
1. Check the detailed deployment guide: `docs/deployment-ubuntu.md`
2. Review application logs: `pm2 logs radius-admin`
3. Check system logs: `sudo journalctl -u radius-admin`
4. Verify all services are running: `sudo systemctl status nginx postgresql`

## Next Steps

After successful deployment:
1. Configure your FreeRADIUS server settings
2. Add RADIUS users through the web interface
3. Set up monitoring and alerting
4. Configure regular backups
5. Review security settings
