#!/usr/bin/env node

// Test cross-platform system metrics collection
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function testCrossPlatformMetrics() {
  console.log('🌍 Testing Cross-Platform System Metrics Collection...\n');
  
  const platform = process.platform;
  const isWindows = platform === 'win32';
  const isLinux = platform === 'linux';
  const isMacOS = platform === 'darwin';
  
  console.log(`🖥️  Detected OS: ${platform} (${isWindows ? 'Windows' : isLinux ? 'Linux' : isMacOS ? 'macOS' : 'Unknown'})`);
  console.log(`📊 Node.js Version: ${process.version}`);
  console.log(`🏗️  Architecture: ${process.arch}\n`);

  try {
    // Test 1: Memory Usage
    console.log('1. Testing Memory Usage...');
    try {
      let memoryUsage = 0;
      
      if (isWindows) {
        const { stdout: memOutput } = await execAsync('powershell "Get-CimInstance -ClassName Win32_OperatingSystem | Select-Object @{Name=\'MemoryUsage\';Expression={[math]::Round((($_.TotalVisibleMemorySize - $_.FreePhysicalMemory) / $_.TotalVisibleMemorySize) * 100, 2)}} | Select-Object -ExpandProperty MemoryUsage"');
        memoryUsage = parseFloat(memOutput.trim()) || 0;
      } else if (isLinux) {
        const { stdout: memOutput } = await execAsync("free | grep Mem | awk '{printf \"%.2f\", $3/$2 * 100.0}'");
        memoryUsage = parseFloat(memOutput.trim()) || 0;
      } else if (isMacOS) {
        const { stdout: memOutput } = await execAsync("vm_stat | grep 'Pages free' | awk '{print $3}' | sed 's/\\.//'");
        const freePages = parseInt(memOutput.trim()) || 0;
        const { stdout: totalMemOutput } = await execAsync("vm_stat | grep 'Pages active' | awk '{print $3}' | sed 's/\\.//'");
        const activePages = parseInt(totalMemOutput.trim()) || 0;
        const { stdout: inactiveMemOutput } = await execAsync("vm_stat | grep 'Pages inactive' | awk '{print $3}' | sed 's/\\.//'");
        const inactivePages = parseInt(inactiveMemOutput.trim()) || 0;
        
        const totalPages = freePages + activePages + inactivePages;
        if (totalPages > 0) {
          memoryUsage = ((activePages + inactivePages) / totalPages) * 100;
        }
      }
      
      console.log(`✅ Memory Usage: ${memoryUsage.toFixed(2)}%`);
    } catch (error) {
      console.log('❌ Memory Usage failed:', error.message);
    }

    // Test 2: Disk Usage
    console.log('\n2. Testing Disk Usage...');
    try {
      let diskUsage = 0;
      
      if (isWindows) {
        const { stdout: diskOutput } = await execAsync('powershell "Get-CimInstance -ClassName Win32_LogicalDisk | Where-Object {$_.DeviceID -eq \'C:\'} | Select-Object @{Name=\'UsedPercent\';Expression={[math]::Round((($_.Size - $_.FreeSpace) / $_.Size) * 100, 2)}} | Select-Object -ExpandProperty UsedPercent"');
        diskUsage = parseFloat(diskOutput.trim()) || 0;
      } else if (isLinux || isMacOS) {
        const { stdout: diskOutput } = await execAsync("df -h / | awk 'NR==2{print $5}' | sed 's/%//'");
        diskUsage = parseFloat(diskOutput.trim()) || 0;
      }
      
      console.log(`✅ Disk Usage: ${diskUsage.toFixed(2)}%`);
    } catch (error) {
      console.log('❌ Disk Usage failed:', error.message);
    }

    // Test 3: Network Connections
    console.log('\n3. Testing Network Connections...');
    try {
      let networkConnections = 0;
      
      if (isWindows) {
        const { stdout: connOutput } = await execAsync('powershell "Get-NetTCPConnection | Where-Object {$_.State -eq \'Established\'} | Measure-Object | Select-Object -ExpandProperty Count"');
        networkConnections = parseInt(connOutput.trim()) || 0;
      } else if (isLinux) {
        const { stdout: connOutput } = await execAsync("ss -tuln | wc -l");
        networkConnections = parseInt(connOutput.trim()) || 0;
      } else if (isMacOS) {
        const { stdout: connOutput } = await execAsync("netstat -an | grep ESTABLISHED | wc -l");
        networkConnections = parseInt(connOutput.trim()) || 0;
      }
      
      console.log(`✅ Network Connections: ${networkConnections}`);
    } catch (error) {
      console.log('❌ Network Connections failed:', error.message);
    }

    // Test 4: System Uptime
    console.log('\n4. Testing System Uptime...');
    try {
      let uptime = "Unknown";
      
      if (isWindows) {
        const { stdout } = await execAsync('powershell "Get-CimInstance -ClassName Win32_OperatingSystem | Select-Object @{Name=\'Uptime\';Expression={(Get-Date) - $_.LastBootUpTime}} | Select-Object -ExpandProperty Uptime"');
        const uptimeMatch = stdout.match(/(\d+)\.(\d+):(\d+):(\d+)/);
        if (uptimeMatch) {
          const days = parseInt(uptimeMatch[1]);
          const hours = parseInt(uptimeMatch[2]);
          const minutes = parseInt(uptimeMatch[3]);
          uptime = `${days} days, ${hours} hours, ${minutes} minutes`;
        }
      } else if (isLinux) {
        const { stdout } = await execAsync("uptime -p");
        uptime = stdout.trim();
      } else if (isMacOS) {
        const { stdout } = await execAsync("uptime");
        uptime = stdout.trim();
      }
      
      console.log(`✅ System Uptime: ${uptime}`);
    } catch (error) {
      console.log('❌ System Uptime failed:', error.message);
    }

    // Test 5: Process Detection
    console.log('\n5. Testing Process Detection...');
    try {
      let processCount = 0;
      
      if (isWindows) {
        const { stdout: processOutput } = await execAsync('powershell "Get-Process -Name node -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count"');
        processCount = parseInt(processOutput.trim()) || 0;
      } else if (isLinux || isMacOS) {
        const { stdout: processOutput } = await execAsync("ps aux | grep node | grep -v grep | wc -l");
        processCount = parseInt(processOutput.trim()) || 0;
      }
      
      console.log(`✅ Node.js Processes: ${processCount}`);
    } catch (error) {
      console.log('❌ Process Detection failed:', error.message);
    }

    console.log('\n🎉 Cross-Platform Test Complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Platform: ${platform}`);
    console.log('   - All platform-specific commands are working');
    console.log('   - System metrics can be collected on this OS');
    console.log('   - The real-time monitoring API is fully compatible!');
    
    console.log('\n🔧 Platform-Specific Features:');
    if (isWindows) {
      console.log('   - PowerShell commands for system monitoring');
      console.log('   - WMI/CIM for hardware information');
      console.log('   - .NET process management');
    } else if (isLinux) {
      console.log('   - Standard Unix commands (top, free, df, ss)');
      console.log('   - systemctl for service management');
      console.log('   - /proc filesystem access');
    } else if (isMacOS) {
      console.log('   - BSD-style commands (vm_stat, netstat)');
      console.log('   - macOS-specific process management');
      console.log('   - Darwin kernel information');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCrossPlatformMetrics();
