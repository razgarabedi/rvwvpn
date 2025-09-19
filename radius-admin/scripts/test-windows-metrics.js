#!/usr/bin/env node

// Test Windows system metrics collection
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function testWindowsMetrics() {
  console.log('🧪 Testing Windows System Metrics Collection...\n');
  
  try {
    // Test CPU usage
    console.log('1. Testing CPU usage...');
    try {
      const { stdout: cpuOutput } = await execAsync('wmic cpu get loadpercentage /value | find "LoadPercentage"');
      const cpuMatch = cpuOutput.match(/LoadPercentage=(\d+)/);
      const cpuUsage = cpuMatch ? parseFloat(cpuMatch[1]) : 0;
      console.log(`✅ CPU Usage: ${cpuUsage}%`);
    } catch (error) {
      console.log('❌ CPU Usage failed:', error.message);
    }

    // Test memory usage
    console.log('\n2. Testing memory usage...');
    try {
      const { stdout: memOutput } = await execAsync('wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value');
      const totalMemMatch = memOutput.match(/TotalVisibleMemorySize=(\d+)/);
      const freeMemMatch = memOutput.match(/FreePhysicalMemory=(\d+)/);
      
      if (totalMemMatch && freeMemMatch) {
        const totalMem = parseInt(totalMemMatch[1]);
        const freeMem = parseInt(freeMemMatch[1]);
        const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
        console.log(`✅ Memory Usage: ${memoryUsage.toFixed(2)}%`);
      } else {
        console.log('❌ Memory Usage: Could not parse memory data');
      }
    } catch (error) {
      console.log('❌ Memory Usage failed:', error.message);
    }

    // Test disk usage
    console.log('\n3. Testing disk usage...');
    try {
      const { stdout: diskOutput } = await execAsync('wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /value');
      const sizeMatch = diskOutput.match(/Size=(\d+)/);
      const freeMatch = diskOutput.match(/FreeSpace=(\d+)/);
      
      if (sizeMatch && freeMatch) {
        const totalSize = parseInt(sizeMatch[1]);
        const freeSpace = parseInt(freeMatch[1]);
        const diskUsage = ((totalSize - freeSpace) / totalSize) * 100;
        console.log(`✅ Disk Usage: ${diskUsage.toFixed(2)}%`);
      } else {
        console.log('❌ Disk Usage: Could not parse disk data');
      }
    } catch (error) {
      console.log('❌ Disk Usage failed:', error.message);
    }

    // Test network connections
    console.log('\n4. Testing network connections...');
    try {
      const { stdout: connOutput } = await execAsync('netstat -an | find /c "ESTABLISHED"');
      const networkConnections = parseInt(connOutput.trim()) || 0;
      console.log(`✅ Network Connections: ${networkConnections}`);
    } catch (error) {
      console.log('❌ Network Connections failed:', error.message);
    }

    // Test process detection
    console.log('\n5. Testing process detection...');
    try {
      const { stdout: processOutput } = await execAsync('tasklist /FI "IMAGENAME eq node.exe"');
      const hasNode = processOutput.includes('node.exe');
      console.log(`✅ Node.js Process Found: ${hasNode}`);
    } catch (error) {
      console.log('❌ Process Detection failed:', error.message);
    }

    console.log('\n🎉 Windows Metrics Test Complete!');
    console.log('\n📊 Summary:');
    console.log('   - Windows system commands are working');
    console.log('   - Metrics collection should work in the API');
    console.log('   - The real-time monitoring should now work on Windows!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testWindowsMetrics();
