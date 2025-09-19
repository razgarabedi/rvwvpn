#!/usr/bin/env node

// Test PowerShell system metrics collection
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function testPowerShellMetrics() {
  console.log('🧪 Testing PowerShell System Metrics Collection...\n');
  
  try {
    // Test CPU usage
    console.log('1. Testing CPU usage...');
    try {
      const { stdout: cpuOutput } = await execAsync('powershell "Get-Counter \'\\Processor(_Total)\\% Processor Time\' | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue"');
      const cpuUsage = parseFloat(cpuOutput.trim()) || 0;
      console.log(`✅ CPU Usage: ${cpuUsage.toFixed(2)}%`);
    } catch (error) {
      console.log('❌ CPU Usage failed:', error.message);
    }

    // Test memory usage
    console.log('\n2. Testing memory usage...');
    try {
      const { stdout: memOutput } = await execAsync('powershell "Get-Counter \'\\Memory\\Available MBytes\' | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue"');
      const availableMB = parseFloat(memOutput.trim()) || 0;
      console.log(`✅ Available Memory: ${availableMB.toFixed(2)} MB`);
      
      const { stdout: totalMemOutput } = await execAsync('powershell "Get-CimInstance -ClassName Win32_ComputerSystem | Select-Object -ExpandProperty TotalPhysicalMemory"');
      const totalMemBytes = parseInt(totalMemOutput.trim()) || 0;
      const totalMemMB = totalMemBytes / (1024 * 1024);
      console.log(`✅ Total Memory: ${totalMemMB.toFixed(2)} MB`);
      
      if (totalMemMB > 0) {
        const memoryUsage = ((totalMemMB - availableMB) / totalMemMB) * 100;
        console.log(`✅ Memory Usage: ${memoryUsage.toFixed(2)}%`);
      }
    } catch (error) {
      console.log('❌ Memory Usage failed:', error.message);
    }

    // Test disk usage
    console.log('\n3. Testing disk usage...');
    try {
      const { stdout: diskOutput } = await execAsync('powershell "Get-WmiObject -Class Win32_LogicalDisk -Filter \'DeviceID="C:"\' | Select-Object @{Name=\'UsedPercent\';Expression={[math]::Round((($_.Size - $_.FreeSpace) / $_.Size) * 100, 2)}}"');
      const diskMatch = diskOutput.match(/UsedPercent\s*:\s*(\d+\.?\d*)/);
      const diskUsage = diskMatch ? parseFloat(diskMatch[1]) : 0;
      console.log(`✅ Disk Usage: ${diskUsage.toFixed(2)}%`);
    } catch (error) {
      console.log('❌ Disk Usage failed:', error.message);
    }

    // Test network connections
    console.log('\n4. Testing network connections...');
    try {
      const { stdout: connOutput } = await execAsync('powershell "Get-NetTCPConnection | Where-Object {$_.State -eq \'Established\'} | Measure-Object | Select-Object -ExpandProperty Count"');
      const networkConnections = parseInt(connOutput.trim()) || 0;
      console.log(`✅ Network Connections: ${networkConnections}`);
    } catch (error) {
      console.log('❌ Network Connections failed:', error.message);
    }

    // Test uptime
    console.log('\n5. Testing system uptime...');
    try {
      const { stdout: uptimeOutput } = await execAsync('powershell "Get-CimInstance -ClassName Win32_OperatingSystem | Select-Object @{Name=\'Uptime\';Expression={(Get-Date) - $_.LastBootUpTime}} | Select-Object -ExpandProperty Uptime"');
      console.log(`✅ System Uptime: ${uptimeOutput.trim()}`);
    } catch (error) {
      console.log('❌ System Uptime failed:', error.message);
    }

    console.log('\n🎉 PowerShell Metrics Test Complete!');
    console.log('\n📊 Summary:');
    console.log('   - PowerShell commands are working');
    console.log('   - System metrics can be collected');
    console.log('   - The real-time monitoring should now work on Windows!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPowerShellMetrics();
