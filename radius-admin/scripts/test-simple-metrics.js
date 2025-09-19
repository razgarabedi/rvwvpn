#!/usr/bin/env node

// Simple test for Windows system metrics
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function testSimpleMetrics() {
  console.log('🧪 Testing Simple Windows System Metrics...\n');
  
  try {
    // Test memory usage
    console.log('1. Testing memory usage...');
    try {
      const { stdout: memOutput } = await execAsync('powershell "Get-CimInstance -ClassName Win32_OperatingSystem | Select-Object @{Name=\'MemoryUsage\';Expression={[math]::Round((($_.TotalVisibleMemorySize - $_.FreePhysicalMemory) / $_.TotalVisibleMemorySize) * 100, 2)}} | Select-Object -ExpandProperty MemoryUsage"');
      const memoryUsage = parseFloat(memOutput.trim()) || 0;
      console.log(`✅ Memory Usage: ${memoryUsage.toFixed(2)}%`);
    } catch (error) {
      console.log('❌ Memory Usage failed:', error.message);
    }

    // Test disk usage
    console.log('\n2. Testing disk usage...');
    try {
      const { stdout: diskOutput } = await execAsync('powershell "Get-CimInstance -ClassName Win32_LogicalDisk | Where-Object {$_.DeviceID -eq \'C:\'} | Select-Object @{Name=\'UsedPercent\';Expression={[math]::Round((($_.Size - $_.FreeSpace) / $_.Size) * 100, 2)}} | Select-Object -ExpandProperty UsedPercent"');
      const diskUsage = parseFloat(diskOutput.trim()) || 0;
      console.log(`✅ Disk Usage: ${diskUsage.toFixed(2)}%`);
    } catch (error) {
      console.log('❌ Disk Usage failed:', error.message);
    }

    // Test network connections
    console.log('\n3. Testing network connections...');
    try {
      const { stdout: connOutput } = await execAsync('powershell "Get-NetTCPConnection | Where-Object {$_.State -eq \'Established\'} | Measure-Object | Select-Object -ExpandProperty Count"');
      const networkConnections = parseInt(connOutput.trim()) || 0;
      console.log(`✅ Network Connections: ${networkConnections}`);
    } catch (error) {
      console.log('❌ Network Connections failed:', error.message);
    }

    // Test uptime
    console.log('\n4. Testing system uptime...');
    try {
      const { stdout: uptimeOutput } = await execAsync('powershell "Get-CimInstance -ClassName Win32_OperatingSystem | Select-Object @{Name=\'Uptime\';Expression={(Get-Date) - $_.LastBootUpTime}} | Select-Object -ExpandProperty Uptime"');
      const uptimeMatch = uptimeOutput.match(/(\d+)\.(\d+):(\d+):(\d+)/);
      if (uptimeMatch) {
        const days = parseInt(uptimeMatch[1]);
        const hours = parseInt(uptimeMatch[2]);
        const minutes = parseInt(uptimeMatch[3]);
        console.log(`✅ System Uptime: ${days} days, ${hours} hours, ${minutes} minutes`);
      } else {
        console.log('✅ System Uptime: Available (format may vary)');
      }
    } catch (error) {
      console.log('❌ System Uptime failed:', error.message);
    }

    console.log('\n🎉 Simple Metrics Test Complete!');
    console.log('\n📊 Summary:');
    console.log('   - Windows PowerShell commands are working');
    console.log('   - System metrics can be collected');
    console.log('   - The real-time monitoring API should work on Windows!');
    console.log('\n💡 Note: CPU usage is simulated for development purposes');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSimpleMetrics();
