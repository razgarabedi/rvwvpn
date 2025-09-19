#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

class SystemMetricsCollector {
  constructor() {
    this.metrics = {
      timestamp: new Date().toISOString(),
      system: {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        loadAverage: 0,
        networkConnections: 0,
        uptime: 'Unknown'
      },
      freeradius: {
        active: false,
        processes: 0,
        memoryUsageKB: 0,
        memoryUsageMB: 0
      },
      network: {
        interfaces: [],
        connections: 0,
        bandwidth: {
          rx: 0,
          tx: 0
        }
      }
    };
  }

  async collectAllMetrics() {
    try {
      await Promise.all([
        this.collectSystemMetrics(),
        this.collectFreeRADIUSMetrics(),
        this.collectNetworkMetrics()
      ]);
      
      return this.metrics;
    } catch (error) {
      console.error('Error collecting metrics:', error);
      throw error;
    }
  }

  async collectSystemMetrics() {
    try {
      // CPU Usage
      const { stdout: cpuOutput } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | awk -F'%' '{print $1}'");
      this.metrics.system.cpuUsage = parseFloat(cpuOutput.trim()) || 0;

      // Memory Usage
      const { stdout: memOutput } = await execAsync("free | grep Mem | awk '{printf \"%.2f\", $3/$2 * 100.0}'");
      this.metrics.system.memoryUsage = parseFloat(memOutput.trim()) || 0;

      // Disk Usage
      const { stdout: diskOutput } = await execAsync("df -h / | awk 'NR==2{print $5}' | sed 's/%//'");
      this.metrics.system.diskUsage = parseFloat(diskOutput.trim()) || 0;

      // Load Average
      const { stdout: loadOutput } = await execAsync("uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//'");
      this.metrics.system.loadAverage = parseFloat(loadOutput.trim()) || 0;

      // Network Connections
      const { stdout: connOutput } = await execAsync("ss -tuln | wc -l");
      this.metrics.system.networkConnections = parseInt(connOutput.trim()) || 0;

      // Uptime
      const { stdout: uptimeOutput } = await execAsync("uptime -p");
      this.metrics.system.uptime = uptimeOutput.trim();

    } catch (error) {
      console.error('Error collecting system metrics:', error);
    }
  }

  async collectFreeRADIUSMetrics() {
    try {
      // Check if FreeRADIUS is active
      const { stdout: radiusStatus } = await execAsync("systemctl is-active freeradius");
      this.metrics.freeradius.active = radiusStatus.trim() === 'active';

      // Get FreeRADIUS process count and memory usage
      try {
        const { stdout: radiusPs } = await execAsync("ps aux | grep freeradius | grep -v grep | wc -l");
        this.metrics.freeradius.processes = parseInt(radiusPs.trim()) || 0;
        
        const { stdout: radiusMem } = await execAsync("ps aux | grep freeradius | grep -v grep | awk '{sum+=$6} END {print sum}'");
        this.metrics.freeradius.memoryUsageKB = parseInt(radiusMem.trim()) || 0;
        this.metrics.freeradius.memoryUsageMB = Math.round((this.metrics.freeradius.memoryUsageKB / 1024) * 100) / 100;
      } catch (error) {
        // FreeRADIUS might not be running
        this.metrics.freeradius.processes = 0;
        this.metrics.freeradius.memoryUsageKB = 0;
        this.metrics.freeradius.memoryUsageMB = 0;
      }

    } catch (error) {
      console.error('Error collecting FreeRADIUS metrics:', error);
    }
  }

  async collectNetworkMetrics() {
    try {
      // Get network interfaces
      const { stdout: interfacesOutput } = await execAsync("ip -j addr show | jq -r '.[] | select(.operstate == \"UP\") | .ifname'");
      this.metrics.network.interfaces = interfacesOutput.trim().split('\n').filter(iface => iface.length > 0);

      // Get network connections
      const { stdout: connOutput } = await execAsync("ss -tuln | wc -l");
      this.metrics.network.connections = parseInt(connOutput.trim()) || 0;

      // Get bandwidth usage (simplified)
      try {
        const { stdout: bandwidthOutput } = await execAsync("cat /proc/net/dev | grep -E '(eth0|ens|enp)' | head -1 | awk '{print $2, $10}'");
        const bandwidth = bandwidthOutput.trim().split(' ');
        if (bandwidth.length >= 2) {
          this.metrics.network.bandwidth.rx = parseInt(bandwidth[0]) || 0;
          this.metrics.network.bandwidth.tx = parseInt(bandwidth[1]) || 0;
        }
      } catch (error) {
        // Network stats might not be available
        this.metrics.network.bandwidth.rx = 0;
        this.metrics.network.bandwidth.tx = 0;
      }

    } catch (error) {
      console.error('Error collecting network metrics:', error);
    }
  }

  async saveMetrics(filePath) {
    try {
      const data = JSON.stringify(this.metrics, null, 2);
      await fs.promises.writeFile(filePath, data);
      console.log(`Metrics saved to ${filePath}`);
    } catch (error) {
      console.error('Error saving metrics:', error);
    }
  }
}

// CLI usage
if (require.main === module) {
  const collector = new SystemMetricsCollector();
  
  collector.collectAllMetrics()
    .then(metrics => {
      console.log('System Metrics:', JSON.stringify(metrics, null, 2));
      
      // Save to file if output path provided
      const outputPath = process.argv[2];
      if (outputPath) {
        collector.saveMetrics(outputPath);
      }
    })
    .catch(error => {
      console.error('Failed to collect metrics:', error);
      process.exit(1);
    });
}

module.exports = SystemMetricsCollector;
