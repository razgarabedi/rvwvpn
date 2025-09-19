import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// Reset system settings to defaults
export async function POST() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Default system settings
    const defaultSettings = {
      logging: {
        level: "info",
        destination: "file",
        maxFileSize: 100,
        maxFiles: 10,
        enableConsole: true,
        enableFile: true,
        enableSyslog: false
      },
      performance: {
        maxConnections: 1000,
        threadPoolSize: 10,
        cacheSize: 256,
        timeout: 30,
        enableCompression: true,
        enableCaching: true
      },
      limits: {
        maxUsers: 10000,
        maxSessions: 5000,
        maxBandwidth: 1000,
        maxConcurrentLogins: 100,
        sessionTimeout: 60,
        idleTimeout: 30
      },
      freeradius: {
        debugLevel: 1,
        logLevel: "info",
        maxRequests: 1000,
        maxConnections: 100,
        threadPoolSize: 5,
        enableAccounting: true,
        enableAuthentication: true,
        enableProxy: false
      },
      os: {
        platform: process.platform,
        maxOpenFiles: 65536,
        maxProcesses: 32768,
        enableLogRotation: true,
        logRetentionDays: 30,
        enableSystemMonitoring: true
      }
    }

    // Save default settings to file
    try {
      const platform = process.platform
      const isWindows = platform === 'win32'
      const isLinux = platform === 'linux'
      const isMacOS = platform === 'darwin'

      if (isWindows) {
        // Windows-specific reset
        console.log("Resetting Windows system settings...")
        
        // Create directory if it doesn't exist
        await execAsync(`mkdir -p C:\\radius-admin`)
        
        // Save settings to file
        await execAsync(`echo '${JSON.stringify(defaultSettings, null, 2)}' | Out-File -FilePath "C:\\radius-admin\\settings.json" -Encoding UTF8`)
        
        // Reset FreeRADIUS configuration
        await resetFreeRADIUSConfig(platform)
        
        // Reset OS configuration
        await resetOSConfig(platform)
        
      } else if (isLinux) {
        // Linux-specific reset
        console.log("Resetting Linux system settings...")
        
        // Create directory if it doesn't exist
        await execAsync(`mkdir -p /etc/radius-admin`)
        
        // Save settings to file
        await execAsync(`echo '${JSON.stringify(defaultSettings, null, 2)}' > /etc/radius-admin/settings.json`)
        
        // Set proper permissions
        await execAsync(`chmod 600 /etc/radius-admin/settings.json`)
        
        // Reset FreeRADIUS configuration
        await resetFreeRADIUSConfig(platform)
        
        // Reset OS configuration
        await resetOSConfig(platform)
        
      } else if (isMacOS) {
        // macOS-specific reset
        console.log("Resetting macOS system settings...")
        
        // Create directory if it doesn't exist
        await execAsync(`mkdir -p /usr/local/etc/radius-admin`)
        
        // Save settings to file
        await execAsync(`echo '${JSON.stringify(defaultSettings, null, 2)}' > /usr/local/etc/radius-admin/settings.json`)
        
        // Set proper permissions
        await execAsync(`chmod 600 /usr/local/etc/radius-admin/settings.json`)
        
        // Reset FreeRADIUS configuration
        await resetFreeRADIUSConfig(platform)
        
        // Reset OS configuration
        await resetOSConfig(platform)
      }
      
      console.log("System settings reset to defaults successfully")
      
      return NextResponse.json({ 
        message: "Settings reset to defaults successfully",
        settings: defaultSettings 
      })
    } catch (error) {
      console.error("Error resetting settings:", error)
      return NextResponse.json({ error: "Failed to reset settings" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error processing reset request:", error)
    return NextResponse.json({ error: "Failed to process reset request" }, { status: 500 })
  }
}

// Reset FreeRADIUS configuration
async function resetFreeRADIUSConfig(platform: string) {
  try {
    const isWindows = platform === 'win32'
    const isLinux = platform === 'linux'
    const isMacOS = platform === 'darwin'
    
    if (isWindows) {
      // Windows-specific FreeRADIUS reset
      console.log("Resetting Windows FreeRADIUS configuration...")
      
      // Reset to default FreeRADIUS configuration
      const radiusConfigPath = "C:\\Program Files\\FreeRADIUS\\etc\\raddb"
      
      // Create backup of current config
      try {
        await execAsync(`copy "${radiusConfigPath}\\radiusd.conf" "${radiusConfigPath}\\radiusd.conf.backup"`)
      } catch {
        // Backup failed, continue
      }
      
      // Reset to default configuration
      const defaultRadiusdConf = `
# FreeRADIUS Configuration - Default Settings
# Reset by Radius Admin

log {
  destination = file
  file = \${logdir}/radius.log
  syslog_facility = daemon
  stripped_names = no
  auth = info
  auth_badpass = info
  auth_goodpass = info
}

listen {
  type = auth
  ipaddr = *
  port = 1812
  interface = \${listen.ipaddr}
  max_connections = 100
  lifetime = 0
  idle_timeout = 30
}

listen {
  type = acct
  ipaddr = *
  port = 1813
  interface = \${listen.ipaddr}
  max_connections = 100
  lifetime = 0
  idle_timeout = 30
}

thread pool {
  start_servers = 5
  max_servers = 5
  min_spare_servers = 5
  max_spare_servers = 10
  max_requests_per_server = 1000
  max_requests = 1000
}
`
      
      // Write default configuration to file
      await execAsync(`echo '${defaultRadiusdConf}' | Out-File -FilePath "${radiusConfigPath}\\radiusd.conf" -Encoding UTF8`)
      
    } else if (isLinux) {
      // Linux-specific FreeRADIUS reset
      console.log("Resetting Linux FreeRADIUS configuration...")
      
      // Create backup of current config
      try {
        await execAsync(`cp /etc/freeradius/3.0/radiusd.conf /etc/freeradius/3.0/radiusd.conf.backup`)
      } catch {
        // Backup failed, continue
      }
      
      // Reset to default configuration
      const defaultRadiusdConf = `
# FreeRADIUS Configuration - Default Settings
# Reset by Radius Admin

log {
  destination = file
  file = \${logdir}/radius.log
  syslog_facility = daemon
  stripped_names = no
  auth = info
  auth_badpass = info
  auth_goodpass = info
}

listen {
  type = auth
  ipaddr = *
  port = 1812
  interface = \${listen.ipaddr}
  max_connections = 100
  lifetime = 0
  idle_timeout = 30
}

listen {
  type = acct
  ipaddr = *
  port = 1813
  interface = \${listen.ipaddr}
  max_connections = 100
  lifetime = 0
  idle_timeout = 30
}

thread pool {
  start_servers = 5
  max_servers = 5
  min_spare_servers = 5
  max_spare_servers = 10
  max_requests_per_server = 1000
  max_requests = 1000
}
`
      
      // Write default configuration to file
      await execAsync(`echo '${defaultRadiusdConf}' > /etc/freeradius/3.0/radiusd.conf`)
      
      // Restart FreeRADIUS service
      try {
        await execAsync(`systemctl restart freeradius`)
        console.log("FreeRADIUS service restarted successfully")
      } catch (error) {
        console.log("Could not restart FreeRADIUS service:", error)
      }
      
    } else if (isMacOS) {
      // macOS-specific FreeRADIUS reset
      console.log("Resetting macOS FreeRADIUS configuration...")
      
      // Create backup of current config
      try {
        await execAsync(`cp /usr/local/etc/raddb/radiusd.conf /usr/local/etc/raddb/radiusd.conf.backup`)
      } catch {
        // Backup failed, continue
      }
      
      // Reset to default configuration
      const defaultRadiusdConf = `
# FreeRADIUS Configuration - Default Settings
# Reset by Radius Admin

log {
  destination = file
  file = \${logdir}/radius.log
  syslog_facility = daemon
  stripped_names = no
  auth = info
  auth_badpass = info
  auth_goodpass = info
}

listen {
  type = auth
  ipaddr = *
  port = 1812
  interface = \${listen.ipaddr}
  max_connections = 100
  lifetime = 0
  idle_timeout = 30
}

listen {
  type = acct
  ipaddr = *
  port = 1813
  interface = \${listen.ipaddr}
  max_connections = 100
  lifetime = 0
  idle_timeout = 30
}

thread pool {
  start_servers = 5
  max_servers = 5
  min_spare_servers = 5
  max_spare_servers = 10
  max_requests_per_server = 1000
  max_requests = 1000
}
`
      
      // Write default configuration to file
      await execAsync(`echo '${defaultRadiusdConf}' > /usr/local/etc/raddb/radiusd.conf`)
    }
    
    console.log("FreeRADIUS configuration reset successfully")
  } catch (error) {
    console.error("Error resetting FreeRADIUS configuration:", error)
  }
}

// Reset OS configuration
async function resetOSConfig(platform: string) {
  try {
    const isWindows = platform === 'win32'
    const isLinux = platform === 'linux'
    const isMacOS = platform === 'darwin'
    
    if (isWindows) {
      // Windows-specific OS reset
      console.log("Resetting Windows OS configuration...")
      
      // Reset system limits to defaults
      try {
        await execAsync(`powershell "Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters' -Name 'MaxUserPort' -Value 65534"`)
      } catch (error) {
        console.log("Could not reset Windows OS configuration:", error)
      }
      
    } else if (isLinux) {
      // Linux-specific OS reset
      console.log("Resetting Linux OS configuration...")
      
      // Remove custom limits
      try {
        await execAsync(`sed -i '/# Radius Admin Configuration/,+8d' /etc/security/limits.conf`)
      } catch (error) {
        console.log("Could not remove custom limits:", error)
      }
      
      // Remove custom logrotate configuration
      try {
        await execAsync(`rm -f /etc/logrotate.d/radius`)
      } catch (error) {
        console.log("Could not remove logrotate configuration:", error)
      }
      
    } else if (isMacOS) {
      // macOS-specific OS reset
      console.log("Resetting macOS OS configuration...")
      
      // Remove custom limits
      try {
        await execAsync(`sed -i '/# Radius Admin Configuration/,+6d' /etc/security/limits.conf`)
      } catch (error) {
        console.log("Could not remove custom limits:", error)
      }
    }
    
    console.log("OS configuration reset successfully")
  } catch (error) {
    console.error("Error resetting OS configuration:", error)
  }
}
