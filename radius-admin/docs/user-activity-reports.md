# User Activity Reports - FreeRADIUS Integration

This document provides comprehensive information about the User Activity Reports system integrated with FreeRADIUS for tracking user login attempts, session duration, and usage patterns.

## 🎯 Overview

The User Activity Reports system provides real-time and historical analytics for FreeRADIUS authentication and accounting data. It tracks:

- **Login Attempts**: Success/failure rates, authentication patterns
- **Session Duration**: Active sessions, session statistics, connection patterns
- **Usage Patterns**: Peak usage times, user behavior analytics
- **System Performance**: Response times, throughput, error rates
- **Real-time Monitoring**: Live activity feeds and system status

## 🏗️ Architecture

### Database Schema

The system uses the standard FreeRADIUS PostgreSQL schema with these key tables:

#### `radacct` - Accounting Records
```sql
- RadAcctId (Primary Key)
- acctsessionid (Session ID)
- acctuniqueid (Unique Session ID)
- username (User Name)
- nasipaddress (NAS IP Address)
- acctstarttime (Session Start Time)
- acctstoptime (Session Stop Time)
- acctsessiontime (Session Duration)
- acctinputoctets (Input Data)
- acctoutputoctets (Output Data)
- acctterminatecause (Termination Reason)
```

#### `radpostauth` - Authentication Logs
```sql
- id (Primary Key)
- username (User Name)
- authdate (Authentication Date)
- reply (Authentication Result)
- calledstationid (Called Station ID)
- callingstationid (Calling Station ID)
```

### API Endpoints

#### Activity Reports
- `GET /api/radius/reports/activity?type=overview` - Activity overview
- `GET /api/radius/reports/activity?type=login-attempts` - Login attempts
- `GET /api/radius/reports/activity?type=session-duration` - Session duration
- `GET /api/radius/reports/activity?type=usage-patterns` - Usage patterns
- `GET /api/radius/reports/activity?type=failed-logins` - Failed logins
- `GET /api/radius/reports/activity?type=active-sessions` - Active sessions

#### Authentication Logs
- `GET /api/radius/reports/auth-logs` - Detailed authentication logs
- `GET /api/radius/reports/auth-logs?status=success` - Successful logins
- `GET /api/radius/reports/auth-logs?status=failed` - Failed logins

#### Performance Reports
- `GET /api/radius/reports/performance?type=overview` - Performance overview
- `GET /api/radius/reports/performance?type=nas-performance` - NAS performance
- `GET /api/radius/reports/performance?type=response-times` - Response times
- `GET /api/radius/reports/performance?type=error-rates` - Error rates

## 🚀 Setup Instructions

### 1. Prerequisites

- FreeRADIUS 3.x installed and configured
- PostgreSQL database with FreeRADIUS schema
- Node.js and npm installed
- Admin access to the system

### 2. Database Setup

Ensure your PostgreSQL database has the FreeRADIUS schema:

```bash
# Run the schema setup
psql -U radius -d radius -f postgresql/schema.sql
```

### 3. FreeRADIUS Integration

Run the integration script:

```bash
# Make the script executable
chmod +x scripts/freeradius-integration.sh

# Run the integration (requires sudo)
sudo ./scripts/freeradius-integration.sh
```

### 4. Start the Application

```bash
# Install dependencies
npm install

# Start the application
npm run dev
```

## 📊 Features

### Activity Overview Dashboard

The overview dashboard provides key metrics:

- **Total Sessions**: Number of sessions in the selected time period
- **Active Sessions**: Currently active sessions
- **Success Rate**: Authentication success percentage
- **Data Usage**: Total data transferred
- **Unique Users**: Number of unique users
- **Failed Logins**: Number of failed authentication attempts
- **Average Session Duration**: Mean session length
- **Successful Logins**: Number of successful authentications

### Login Attempts Tracking

Detailed tracking of all authentication attempts:

- Username and timestamp
- Success/failure status
- Calling and called station IDs
- Authentication reply details
- Real-time updates

### Session Duration Analysis

Comprehensive session analysis:

- Session start and stop times
- Duration calculations
- Active vs completed sessions
- NAS device information
- Termination causes

### Usage Patterns

Analytics for understanding user behavior:

- Hourly activity patterns
- Daily usage trends
- Peak usage identification
- User distribution analysis

### Real-time Monitoring

Live system monitoring:

- Current active sessions
- Real-time authentication attempts
- System performance metrics
- Live activity feed

## 🔧 Configuration

### Date Range Filtering

All reports support date range filtering:

```javascript
// Example API call with date range
const response = await fetch('/api/radius/reports/activity?type=overview&startDate=2024-01-01&endDate=2024-01-31');
```

### Username Filtering

Filter reports by specific users:

```javascript
// Example API call with username filter
const response = await fetch('/api/radius/reports/activity?type=login-attempts&username=john.doe');
```

### Pagination

Large datasets support pagination:

```javascript
// Example API call with pagination
const response = await fetch('/api/radius/reports/auth-logs?limit=50&offset=100');
```

## 📈 Analytics and Metrics

### Key Performance Indicators (KPIs)

1. **Authentication Success Rate**
   - Formula: (Successful Logins / Total Attempts) × 100
   - Target: > 95%

2. **Average Session Duration**
   - Formula: Total Session Time / Number of Sessions
   - Useful for capacity planning

3. **Peak Usage Hours**
   - Identifies high-traffic periods
   - Helps with resource allocation

4. **Data Transfer Volume**
   - Total input + output octets
   - Network capacity planning

### Real-time Alerts

The system can be configured to send alerts for:

- High failure rates (> 10% in 5 minutes)
- Unusual authentication patterns
- System performance degradation
- Suspicious activity

## 🔍 Troubleshooting

### Common Issues

#### 1. No Data in Reports

**Symptoms**: Reports show empty or no data

**Solutions**:
- Check FreeRADIUS is running: `systemctl status freeradius`
- Verify database connection: `psql -U radius -d radius -c "SELECT COUNT(*) FROM radacct;"`
- Check FreeRADIUS logs: `tail -f /var/log/freeradius/radius.log`

#### 2. Authentication Failures

**Symptoms**: High failure rates in reports

**Solutions**:
- Check user credentials in `radcheck` table
- Verify NAS client configuration
- Review FreeRADIUS authentication logs

#### 3. Performance Issues

**Symptoms**: Slow report loading

**Solutions**:
- Add database indexes for frequently queried columns
- Implement data archiving for old records
- Optimize database queries

### Log Files

Important log files for troubleshooting:

- `/var/log/freeradius/radius.log` - FreeRADIUS main log
- `/var/log/radius-activity.log` - Real-time activity log
- `/var/log/radius-admin.log` - Application logs

## 🔒 Security Considerations

### Data Privacy

- User authentication data is sensitive
- Implement proper access controls
- Consider data retention policies
- Encrypt sensitive data in transit and at rest

### Access Control

- Restrict dashboard access to authorized personnel
- Implement role-based access control
- Regular security audits
- Monitor access to the reporting system

### Data Retention

- Implement data archiving policies
- Regular cleanup of old records
- Compliance with data protection regulations
- Secure disposal of sensitive data

## 📚 API Reference

### Activity Reports API

#### GET /api/radius/reports/activity

**Parameters**:
- `type` (string): Report type (overview, login-attempts, session-duration, usage-patterns, failed-logins, active-sessions)
- `startDate` (string): Start date (YYYY-MM-DD)
- `endDate` (string): End date (YYYY-MM-DD)
- `username` (string): Filter by username
- `limit` (number): Number of records to return

**Response**:
```json
{
  "overview": {
    "totalSessions": 1234,
    "activeSessions": 45,
    "uniqueUsers": 89,
    "failedLogins": 23,
    "successfulLogins": 1211,
    "avgSessionDuration": 7200,
    "totalDataUsage": 1073741824,
    "successRate": "98.14"
  }
}
```

### Authentication Logs API

#### GET /api/radius/reports/auth-logs

**Parameters**:
- `startDate` (string): Start date (YYYY-MM-DD)
- `endDate` (string): End date (YYYY-MM-DD)
- `username` (string): Filter by username
- `status` (string): Filter by status (success, failed, all)
- `limit` (number): Number of records to return
- `offset` (number): Offset for pagination

**Response**:
```json
{
  "logs": [
    {
      "id": "123",
      "username": "john.doe",
      "timestamp": "2024-01-15T10:30:00Z",
      "success": true,
      "reply": "Access-Accept",
      "calledStationId": "192.168.1.1",
      "callingStationId": "192.168.1.100"
    }
  ],
  "pagination": {
    "total": 1000,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  },
  "summary": {
    "totalAttempts": 1000,
    "successfulAttempts": 980,
    "failedAttempts": 20,
    "successRate": 98.0
  }
}
```

## 🚀 Future Enhancements

### Planned Features

1. **Advanced Analytics**
   - Machine learning for anomaly detection
   - Predictive analytics for capacity planning
   - User behavior analysis

2. **Enhanced Visualizations**
   - Interactive charts and graphs
   - Real-time dashboards
   - Custom report builder

3. **Integration Features**
   - Webhook notifications
   - API integrations with external systems
   - Export to various formats (PDF, Excel, CSV)

4. **Performance Optimizations**
   - Caching layer for frequently accessed data
   - Database query optimization
   - Real-time data streaming

### Contributing

To contribute to the User Activity Reports system:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support and questions:

- Check the troubleshooting section
- Review the API documentation
- Create an issue in the repository
- Contact the development team

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Compatibility**: FreeRADIUS 3.x, PostgreSQL 12+, Node.js 18+
