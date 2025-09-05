# Docker Deployment Guide

This guide explains how to deploy the Radius Admin manager using Docker and Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- Domain name (optional, for SSL)
- Basic knowledge of Docker

## Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo-url> radius-admin
cd radius-admin
```

### 2. Configure Environment

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Database
DB_PASSWORD=your_secure_password_here

# Application
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-very-secure-secret-key

# Optional: SSL certificates path
SSL_CERT_PATH=./ssl/cert.pem
SSL_KEY_PATH=./ssl/key.pem
```

### 3. Start the Application

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. Initialize Database

```bash
# Run database migrations
docker-compose exec app npx prisma db push

# Seed the database
docker-compose exec app npx prisma db seed
```

### 5. Access the Application

- **URL**: `http://localhost` (or your domain)
- **Default Login**:
  - Email: `admin@example.com`
  - Password: `adminpassword123`

## SSL Configuration

### Option 1: Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to ssl directory
sudo mkdir -p ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*

# Restart nginx
docker-compose restart nginx
```

### Option 2: Self-Signed Certificate (Development)

```bash
# Create ssl directory
mkdir ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

## Production Deployment

### 1. Update Docker Compose for Production

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: radius-admin-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: radius_admin
      POSTGRES_USER: radius_admin_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - radius-admin-network
    # Remove port exposure for security
    # ports:
    #   - "5432:5432"

  app:
    build: .
    container_name: radius-admin-app
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://radius_admin_user:${DB_PASSWORD}@postgres:5432/radius_admin
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NODE_ENV: production
    depends_on:
      - postgres
    networks:
      - radius-admin-network
    volumes:
      - ./uploads:/app/uploads

  nginx:
    image: nginx:alpine
    container_name: radius-admin-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - radius-admin-network

volumes:
  postgres_data:

networks:
  radius-admin-network:
    driver: bridge
```

### 2. Deploy to Production

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Management Commands

### Application Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f app
docker-compose logs -f nginx
docker-compose logs -f postgres

# Execute commands in app container
docker-compose exec app sh
docker-compose exec app npx prisma studio
docker-compose exec app npx prisma db seed
```

### Database Management

```bash
# Access PostgreSQL
docker-compose exec postgres psql -U radius_admin_user -d radius_admin

# Backup database
docker-compose exec postgres pg_dump -U radius_admin_user radius_admin > backup.sql

# Restore database
docker-compose exec -T postgres psql -U radius_admin_user -d radius_admin < backup.sql
```

### Updates and Maintenance

```bash
# Update application
git pull
docker-compose build app
docker-compose up -d app

# Update all services
docker-compose pull
docker-compose up -d

# Clean up unused images
docker system prune -a
```

## Monitoring

### Health Checks

```bash
# Check application health
curl -f http://localhost/api/health || echo "App is down"

# Check database connection
docker-compose exec app npx prisma db pull

# Check nginx status
docker-compose exec nginx nginx -t
```

### Log Monitoring

```bash
# Follow all logs
docker-compose logs -f

# Follow specific service logs
docker-compose logs -f app
docker-compose logs -f nginx
docker-compose logs -f postgres

# View last 100 lines
docker-compose logs --tail=100 app
```

## Backup Strategy

### Automated Backup Script

Create `scripts/backup-docker.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/radius-admin"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T postgres pg_dump -U radius_admin_user radius_admin > $BACKUP_DIR/radius_admin_$DATE.sql

# Backup application files
docker-compose exec app tar -czf - /app/uploads > $BACKUP_DIR/uploads_$DATE.tar.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### Restore from Backup

```bash
# Restore database
docker-compose exec -T postgres psql -U radius_admin_user -d radius_admin < backup.sql

# Restore uploads
docker-compose exec app tar -xzf - < uploads_backup.tar.gz
```

## Troubleshooting

### Common Issues

1. **Application won't start**
   ```bash
   # Check logs
   docker-compose logs app
   
   # Check if database is ready
   docker-compose exec postgres pg_isready -U radius_admin_user
   ```

2. **Database connection issues**
   ```bash
   # Check database status
   docker-compose ps postgres
   
   # Test connection
   docker-compose exec app npx prisma db pull
   ```

3. **Nginx 502 Bad Gateway**
   ```bash
   # Check if app is running
   docker-compose ps app
   
   # Check nginx logs
   docker-compose logs nginx
   ```

4. **SSL certificate issues**
   ```bash
   # Check certificate files
   ls -la ssl/
   
   # Test nginx configuration
   docker-compose exec nginx nginx -t
   ```

### Performance Optimization

1. **Resource Limits**
   ```yaml
   # Add to docker-compose.yml
   services:
     app:
       deploy:
         resources:
           limits:
             memory: 512M
             cpus: '0.5'
   ```

2. **Database Optimization**
   ```yaml
   # Add to postgres service
   postgres:
     command: postgres -c shared_buffers=256MB -c max_connections=100
   ```

## Security Considerations

1. **Network Security**
   - Don't expose database port externally
   - Use Docker networks for service communication
   - Implement proper firewall rules

2. **SSL/TLS**
   - Use Let's Encrypt for production
   - Regularly renew certificates
   - Implement HSTS headers

3. **Container Security**
   - Keep base images updated
   - Run containers as non-root user
   - Scan images for vulnerabilities

4. **Data Protection**
   - Encrypt sensitive data at rest
   - Use secure passwords
   - Regular backups

## Scaling

### Horizontal Scaling

```yaml
# Scale application instances
services:
  app:
    deploy:
      replicas: 3
```

### Load Balancing

```yaml
# Add load balancer
  nginx:
    depends_on:
      - app
    # Configure upstream for multiple app instances
```

## Support

For issues with Docker deployment:
1. Check container logs: `docker-compose logs`
2. Verify environment variables: `docker-compose config`
3. Test database connectivity: `docker-compose exec app npx prisma db pull`
4. Check network connectivity: `docker-compose exec app ping postgres`
