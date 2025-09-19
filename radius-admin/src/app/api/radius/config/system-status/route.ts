import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// Get system status
export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const platform = process.platform

    // Get FreeRADIUS status
    const freeradiusStatus = await getFreeRADIUSStatus(platform)
    
    // Get system status
    const systemStatus = await getSystemStatus(platform)

    return NextResponse.json({
      status: {
        freeradius: freeradiusStatus,
        system: systemStatus
      }
    })
  } catch (error) {
    console.error("Error getting system status:", error)
    return NextResponse.json({ error: "Failed to get system status" }, { status: 500 })
  }
}

// Get FreeRADIUS status
async function getFreeRADIUSStatus(platform: string) {
  try {
    const isWindows = platform === 'win32'
    const isLinux = platform === 'linux'
    const isMacOS = platform === 'darwin'

    let status = "stopped"
    let version = "unknown"
    let uptime = "0"
    let processes = 0
    let memoryUsage = 0

    if (isWindows) {
      // Windows-specific FreeRADIUS status
      try {
        // Check if FreeRADIUS is running
        const { stdout: processCheck } = await execAsync('powershell "Get-Process -Name freeradius -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count"')
        const processCount = parseInt(processCheck.trim()) || 0
        
        if (processCount > 0) {
          status = "running"
          processes = processCount
          
          // Get memory usage
          const { stdout: memoryOutput } = await execAsync('powershell "Get-Process -Name freeradius -ErrorAction SilentlyContinue | Measure-Object -Property WorkingSet -Sum | Select-Object -ExpandProperty Sum"')
          memoryUsage = parseInt(memoryOutput.trim()) || 0
          
          // Get version (if possible)
          try {
            const { stdout: versionOutput } = await execAsync('powershell "freeradius -v"')
            version = versionOutput.trim() || "unknown"
          } catch {
            version = "unknown"
          }
          
          // Get uptime (simplified)
          try {
            const { stdout: uptimeOutput } = await execAsync('powershell "Get-Process -Name freeradius | Select-Object -First 1 | ForEach-Object { (Get-Date) - $_.StartTime }"')
            uptime = uptimeOutput.trim() || "0"
          } catch {
            uptime = "0"
          }
        }
      } catch (error) {
        console.error("Error getting Windows FreeRADIUS status:", error)
      }
    } else if (isLinux) {
      // Linux-specific FreeRADIUS status
      try {
        // Check service status
        const { stdout: serviceStatus } = await execAsync("systemctl is-active freeradius")
        status = serviceStatus.trim() === 'active' ? 'running' : 'stopped'
        
        if (status === 'running') {
          // Get version
          try {
            const { stdout: versionOutput } = await execAsync("freeradius -v")
            version = versionOutput.trim() || "unknown"
          } catch {
            version = "unknown"
          }
          
          // Get uptime
          try {
            const { stdout: uptimeOutput } = await execAsync("systemctl show freeradius --property=ActiveEnterTimestamp --value")
            if (uptimeOutput.trim()) {
              const startTime = new Date(uptimeOutput.trim())
              const now = new Date()
              const diffMs = now.getTime() - startTime.getTime()
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
              const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
              uptime = `${diffHours}h ${diffMinutes}m`
            }
          } catch {
            uptime = "unknown"
          }
          
          // Get process count
          try {
            const { stdout: processOutput } = await execAsync("ps aux | grep freeradius | grep -v grep | wc -l")
            processes = parseInt(processOutput.trim()) || 0
          } catch {
            processes = 0
          }
          
          // Get memory usage
          try {
            const { stdout: memoryOutput } = await execAsync("ps aux | grep freeradius | grep -v grep | awk '{sum+=$6} END {print sum}'")
            memoryUsage = parseInt(memoryOutput.trim()) || 0
          } catch {
            memoryUsage = 0
          }
        }
      } catch (error) {
        console.error("Error getting Linux FreeRADIUS status:", error)
      }
    } else if (isMacOS) {
      // macOS-specific FreeRADIUS status
      try {
        // Check if FreeRADIUS is running
        const { stdout: processOutput } = await execAsync("ps aux | grep freeradius | grep -v grep | wc -l")
        const processCount = parseInt(processOutput.trim()) || 0
        
        if (processCount > 0) {
          status = "running"
          processes = processCount
          
          // Get version
          try {
            const { stdout: versionOutput } = await execAsync("freeradius -v")
            version = versionOutput.trim() || "unknown"
          } catch {
            version = "unknown"
          }
          
          // Get memory usage
          try {
            const { stdout: memoryOutput } = await execAsync("ps aux | grep freeradius | grep -v grep | awk '{sum+=$6} END {print sum}'")
            memoryUsage = parseInt(memoryOutput.trim()) || 0
          } catch {
            memoryUsage = 0
          }
          
          // Get uptime (simplified)
          try {
            const { stdout: uptimeOutput } = await execAsync("ps -o lstart= -p $(pgrep freeradius | head -1)")
            if (uptimeOutput.trim()) {
              const startTime = new Date(uptimeOutput.trim())
              const now = new Date()
              const diffMs = now.getTime() - startTime.getTime()
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
              const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
              uptime = `${diffHours}h ${diffMinutes}m`
            }
          } catch {
            uptime = "unknown"
          }
        }
      } catch (error) {
        console.error("Error getting macOS FreeRADIUS status:", error)
      }
    }

    return {
      status,
      version,
      uptime,
      processes,
      memoryUsage: Math.round((memoryUsage / 1024) * 100) / 100 // Convert to MB
    }
  } catch (error) {
    console.error("Error getting FreeRADIUS status:", error)
    return {
      status: "unknown",
      version: "unknown",
      uptime: "0",
      processes: 0,
      memoryUsage: 0
    }
  }
}

// Get system status
async function getSystemStatus(platform: string) {
  try {
    const isWindows = platform === 'win32'
    const isLinux = platform === 'linux'
    const isMacOS = platform === 'darwin'

    let cpuUsage = 0
    let memoryUsage = 0
    let diskUsage = 0
    let loadAverage = 0

    if (isWindows) {
      // Windows-specific system status
      try {
        // Get CPU usage
        const { stdout: cpuOutput } = await execAsync('powershell "Get-CimInstance -ClassName Win32_Processor | Measure-Object -Property LoadPercentage -Average | Select-Object -ExpandProperty Average"')
        cpuUsage = parseFloat(cpuOutput.trim()) || 0

        // Get memory usage
        const { stdout: memOutput } = await execAsync('powershell "Get-CimInstance -ClassName Win32_OperatingSystem | Select-Object @{Name=\'MemoryUsage\';Expression={[math]::Round((($_.TotalVisibleMemorySize - $_.FreePhysicalMemory) / $_.TotalVisibleMemorySize) * 100, 2)}} | Select-Object -ExpandProperty MemoryUsage"')
        memoryUsage = parseFloat(memOutput.trim()) || 0

        // Get disk usage
        const { stdout: diskOutput } = await execAsync('powershell "Get-CimInstance -ClassName Win32_LogicalDisk | Where-Object {$_.DeviceID -eq \'C:\'} | Select-Object @{Name=\'UsedPercent\';Expression={[math]::Round((($_.Size - $_.FreeSpace) / $_.Size) * 100, 2)}} | Select-Object -ExpandProperty UsedPercent"')
        diskUsage = parseFloat(diskOutput.trim()) || 0

        // Load average not available on Windows
        loadAverage = 0
      } catch (error) {
        console.error("Error getting Windows system status:", error)
      }
    } else if (isLinux) {
      // Linux-specific system status
      try {
        // Get CPU usage
        const { stdout: cpuOutput } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | awk -F'%' '{print $1}'")
        cpuUsage = parseFloat(cpuOutput.trim()) || 0

        // Get memory usage
        const { stdout: memOutput } = await execAsync("free | grep Mem | awk '{printf \"%.2f\", $3/$2 * 100.0}'")
        memoryUsage = parseFloat(memOutput.trim()) || 0

        // Get disk usage
        const { stdout: diskOutput } = await execAsync("df -h / | awk 'NR==2{print $5}' | sed 's/%//'")
        diskUsage = parseFloat(diskOutput.trim()) || 0

        // Get load average
        const { stdout: loadOutput } = await execAsync("uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//'")
        loadAverage = parseFloat(loadOutput.trim()) || 0
      } catch (error) {
        console.error("Error getting Linux system status:", error)
      }
    } else if (isMacOS) {
      // macOS-specific system status
      try {
        // Get CPU usage
        const { stdout: cpuOutput } = await execAsync("top -l 1 | grep 'CPU usage' | awk '{print $3}' | sed 's/%//'")
        cpuUsage = parseFloat(cpuOutput.trim()) || 0

        // Get memory usage
        const { stdout: memOutput } = await execAsync("vm_stat | grep 'Pages free' | awk '{print $3}' | sed 's/\\.//'")
        const freePages = parseInt(memOutput.trim()) || 0
        const { stdout: totalMemOutput } = await execAsync("vm_stat | grep 'Pages active' | awk '{print $3}' | sed 's/\\.//'")
        const activePages = parseInt(totalMemOutput.trim()) || 0
        const { stdout: inactiveMemOutput } = await execAsync("vm_stat | grep 'Pages inactive' | awk '{print $3}' | sed 's/\\.//'")
        const inactivePages = parseInt(inactiveMemOutput.trim()) || 0
        
        const totalPages = freePages + activePages + inactivePages
        if (totalPages > 0) {
          memoryUsage = ((activePages + inactivePages) / totalPages) * 100
        }

        // Get disk usage
        const { stdout: diskOutput } = await execAsync("df -h / | awk 'NR==2{print $5}' | sed 's/%//'")
        diskUsage = parseFloat(diskOutput.trim()) || 0

        // Get load average
        const { stdout: loadOutput } = await execAsync("uptime | awk -F'load averages:' '{print $2}' | awk '{print $1}' | sed 's/,//'")
        loadAverage = parseFloat(loadOutput.trim()) || 0
      } catch (error) {
        console.error("Error getting macOS system status:", error)
      }
    }

    return {
      platform,
      cpuUsage: Math.round(cpuUsage * 100) / 100,
      memoryUsage: Math.round(memoryUsage * 100) / 100,
      diskUsage: Math.round(diskUsage * 100) / 100,
      loadAverage: Math.round(loadAverage * 100) / 100
    }
  } catch (error) {
    console.error("Error getting system status:", error)
    return {
      platform: process.platform,
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      loadAverage: 0
    }
  }
}
