# Real-time Monitoring System

This document describes the real-time monitoring system for the FreeRADIUS User Activity Reports dashboard.

## 🎯 Overview

The real-time monitoring system provides live data visualization and system metrics for FreeRADIUS servers, including:

- **Live System Metrics**: CPU, memory, disk usage, load average
- **FreeRADIUS Status**: Process status, memory usage, active connections
- **Active Sessions**: Real-time session monitoring with data usage
- **Authentication Activity**: Live login attempts and success rates
- **Network Performance**: Connection counts and bandwidth usage

## 🏗️ Architecture

### Components

1. **API Endpoints** (`/api/radius/reports/realtime/`)
   - `GET /api/radius/reports/realtime?type=overview` - Overview metrics
   - `GET /api/radius/reports/realtime?type=system` - System metrics
   - `GET /api/radius/reports/realtime?type=freeradius` - FreeRADIUS metrics
   - `GET /api/radius/reports/realtime?type=sessions` - Active sessions
   - `GET /api/radius/reports/realtime?type=auth` - Authentication activity
   - `GET /api/radius/reports/realtime?type=performance` - Performance metrics

2. **WebSocket Endpoint** (`/api/radius/reports/realtime/ws`)
   - Server-Sent Events (SSE) for real-time updates
   - Automatic reconnection handling
   - Fallback to polling if WebSocket fails

3. **Real-time Service** (`src/lib/realtime-service.ts`)
   - Singleton service for managing real-time connections
   - Event-driven architecture
   - Automatic reconnection with exponential backoff

4. **Monitoring Component** (`src/components/realtime-monitoring.tsx`)
   - React component with modern UI
   - Real-time data visualization
   - Interactive controls and status indicators

## 📊 Features

### System Metrics

- **CPU Usage**: Real-time CPU utilization percentage
- **Memory Usage**: RAM usage with visual progress bars
- **Disk Usage**: Storage utilization with color-coded warnings
- **Load Average**: System load with threshold indicators
- **Network Connections**: Active network connections count
- **Uptime**: System uptime display

### FreeRADIUS Metrics

- **Service Status**: Active/Inactive status with visual indicators
- **Process Count**: Number of running FreeRADIUS processes
- **Memory Usage**: FreeRADIUS memory consumption
- **Port Status**: RADIUS port availability (1812/1813)
- **Error Count**: Recent error count from logs

### Active Sessions

- **Live Session List**: Real-time active session table
- **Session Duration**: Current session duration calculation
- **Data Usage**: Real-time data transfer monitoring
- **NAS Information**: Network Access Server details
- **User Details**: Username and connection information

### Authentication Activity

- **Recent Attempts**: Live authentication attempt feed
- **Success Rate**: Real-time success/failure ratio
- **Hourly Statistics**: Authentication patterns over time
- **Error Analysis**: Failed authentication reasons

## 🚀 Setup Instructions

### 1. Prerequisites

- Linux server with FreeRADIUS installed
- Node.js application running
- Proper permissions for system command execution
- PostgreSQL database with FreeRADIUS schema

### 2. System Requirements

The monitoring system requires access to:

- `/proc/` filesystem for system metrics
- `systemctl` for service status
- `ps`, `top`, `free`, `df` for resource monitoring
- `ss` for network connection monitoring
- FreeRADIUS log files (`/var/log/freeradius/`)

### 3. Permissions Setup

```bash
# Add the application user to necessary groups
sudo usermod -a -G systemd-journal $USER

# Ensure log file access
sudo chmod 644 /var/log/freeradius/radius.log

# Test system command access
node scripts/system-metrics-collector.js
```

### 4. API Configuration

The real-time API endpoints are automatically available when the application starts. No additional configuration is required.

## 🔧 Usage

### Basic Usage

1. **Navigate to Graphs Tab**: Click on "Graphs" in the main navigation
2. **Select Real-time Monitoring**: Click on "Real-time Monitoring" card
3. **View Live Data**: The dashboard will automatically start showing live data
4. **Control Updates**: Use the pause/resume and refresh buttons

### API Usage

#### Fetch Overview Data

```javascript
const response = await fetch('/api/radius/reports/realtime?type=overview');
const data = await response.json();
console.log(data.overview);
```

#### Fetch System Metrics

```javascript
const response = await fetch('/api/radius/reports/realtime?type=system');
const data = await response.json();
console.log(data.system);
```

#### WebSocket Connection

```javascript
const eventSource = new EventSource('/api/radius/reports/realtime/ws');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};
```

### Component Integration

```tsx
import RealtimeMonitoring from '@/components/realtime-monitoring';

function Dashboard() {
  return (
    <div>
      <RealtimeMonitoring />
    </div>
  );
}
```

## 📈 Data Structure

### Overview Response

```typescript
interface RealtimeData {
  timestamp: string;
  overview: {
    activeSessions: number;
    sessionsStarted: number;
    uniqueUsers: number;
    successfulAuth: number;
    failedAuth: number;
    successRate: number;
    totalDataUsage: number;
    dataUsageMB: number;
  };
  recentActivity: Array<{
    id: string;
    username: string;
    timestamp: string;
    success: boolean;
    reply: string;
    calledStationId: string;
    callingStationId: string;
  }>;
}
```

### System Metrics Response

```typescript
interface SystemMetrics {
  timestamp: string;
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    loadAverage: number;
    networkConnections: number;
    uptime: string;
  };
  freeradius: {
    active: boolean;
    processes: number;
    memoryUsageKB: number;
    memoryUsageMB: number;
  };
}
```

## 🎨 UI Components

### Metric Cards

- **Color-coded Status**: Green (good), Yellow (warning), Red (critical)
- **Progress Bars**: Visual representation of resource usage
- **Real-time Updates**: Live data refresh every 5 seconds
- **Responsive Design**: Works on desktop and mobile devices

### Data Tables

- **Sortable Columns**: Click headers to sort data
- **Real-time Updates**: Live data without page refresh
- **Status Indicators**: Visual status indicators for quick assessment
- **Hover Effects**: Interactive elements with hover states

### Status Indicators

- **Connection Status**: Real-time connection indicator
- **Auto-refresh Toggle**: Enable/disable automatic updates
- **Last Update Time**: Timestamp of last data refresh
- **Error Handling**: Graceful error display and recovery

## 🔍 Troubleshooting

### Common Issues

#### 1. No Data Displayed

**Symptoms**: Dashboard shows loading or empty state

**Solutions**:
- Check API endpoint accessibility: `curl http://localhost:3000/api/radius/reports/realtime?type=overview`
- Verify database connection
- Check FreeRADIUS service status: `systemctl status freeradius`
- Review application logs for errors

#### 2. System Metrics Not Available

**Symptoms**: System metrics show 0 or error values

**Solutions**:
- Verify system command access: `node scripts/system-metrics-collector.js`
- Check file permissions for `/proc/` filesystem
- Ensure required system tools are installed: `top`, `free`, `df`, `ss`
- Run with appropriate permissions

#### 3. Real-time Updates Not Working

**Symptoms**: Data doesn't update automatically

**Solutions**:
- Check WebSocket connection in browser developer tools
- Verify EventSource support in browser
- Check network connectivity
- Review server logs for WebSocket errors

#### 4. High CPU Usage

**Symptoms**: System becomes slow or unresponsive

**Solutions**:
- Increase update interval (default: 5 seconds)
- Disable auto-refresh for less critical monitoring
- Optimize database queries
- Check for infinite loops in data fetching

### Performance Optimization

1. **Database Indexing**: Ensure proper indexes on frequently queried columns
2. **Caching**: Implement Redis caching for frequently accessed data
3. **Query Optimization**: Use efficient database queries
4. **Resource Limits**: Set appropriate limits for data fetching
5. **Connection Pooling**: Use database connection pooling

## 🔒 Security Considerations

### Data Privacy

- **Sensitive Information**: Avoid logging sensitive user data
- **Access Control**: Implement proper authentication and authorization
- **Data Retention**: Set appropriate data retention policies
- **Encryption**: Use HTTPS for all communications

### System Security

- **Command Execution**: Limit system command execution to necessary operations
- **File Access**: Restrict file system access to required paths
- **Network Security**: Secure WebSocket connections
- **Input Validation**: Validate all input parameters

## 📚 API Reference

### GET /api/radius/reports/realtime

**Parameters**:
- `type` (string): Type of metrics to fetch
  - `overview` - Overview metrics
  - `system` - System metrics
  - `freeradius` - FreeRADIUS metrics
  - `sessions` - Active sessions
  - `auth` - Authentication activity
  - `performance` - Performance metrics

**Response**: JSON object with requested metrics

**Status Codes**:
- `200` - Success
- `401` - Unauthorized
- `500` - Server Error

### GET /api/radius/reports/realtime/ws

**Description**: Server-Sent Events endpoint for real-time updates

**Response**: Event stream with JSON data

**Events**:
- `connected` - Connection established
- `update` - Data update
- `error` - Connection error
- `disconnected` - Connection closed

## 🚀 Future Enhancements

### Planned Features

1. **Advanced Visualizations**
   - Interactive charts and graphs
   - Custom dashboard layouts
   - Export capabilities

2. **Alerting System**
   - Threshold-based alerts
   - Email/SMS notifications
   - Webhook integrations

3. **Historical Analysis**
   - Trend analysis
   - Capacity planning
   - Performance forecasting

4. **Mobile App**
   - Native mobile application
   - Push notifications
   - Offline capabilities

### Contributing

To contribute to the real-time monitoring system:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests
5. Submit a pull request

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Compatibility**: Node.js 18+, React 19+, FreeRADIUS 3.x
