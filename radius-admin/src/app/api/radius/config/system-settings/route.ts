import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

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

// Get system settings
export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Try to load settings from file or use defaults
    let settings = defaultSettings
    
    try {
      const platform = process.platform
      const isWindows = platform === 'win32'
      const isLinux = platform === 'linux'
      const isMacOS = platform === 'darwin'
      
      let settingsPath = ''
      
      if (isWindows) {
        settingsPath = 'C:\\radius-admin\\settings.json'
        // Check if settings file exists
        const { stdout } = await execAsync(`if exist "${settingsPath}" echo "exists" else echo "not found"`)
        if (stdout.includes("exists")) {
          const { stdout: settingsContent } = await execAsync(`type "${settingsPath}"`)
          const fileSettings = JSON.parse(settingsContent)
          settings = { ...defaultSettings, ...fileSettings }
        }
      } else if (isLinux) {
        settingsPath = '/etc/radius-admin/settings.json'
        // Check if settings file exists
        const { stdout } = await execAsync(`ls -la ${settingsPath} 2>/dev/null || echo "not found"`)
        if (!stdout.includes("not found")) {
          const { stdout: settingsContent } = await execAsync(`cat ${settingsPath}`)
          const fileSettings = JSON.parse(settingsContent)
          settings = { ...defaultSettings, ...fileSettings }
        }
      } else if (isMacOS) {
        settingsPath = '/usr/local/etc/radius-admin/settings.json'
        // Check if settings file exists
        const { stdout } = await execAsync(`ls -la ${settingsPath} 2>/dev/null || echo "not found"`)
        if (!stdout.includes("not found")) {
          const { stdout: settingsContent } = await execAsync(`cat ${settingsPath}`)
          const fileSettings = JSON.parse(settingsContent)
          settings = { ...defaultSettings, ...fileSettings }
        }
      } else {
        // Fallback for unknown platforms
        settingsPath = './radius-admin-config/settings.json'
        try {
          const { stdout: settingsContent } = await execAsync(`cat ${settingsPath}`)
          const fileSettings = JSON.parse(settingsContent)
          settings = { ...defaultSettings, ...fileSettings }
        } catch {
          // File doesn't exist, use defaults
        }
      }
      
      console.log(`Settings loaded from: ${settingsPath}`)
    } catch {
      // Use default settings if file doesn't exist or can't be read
      console.log("Using default settings")
    }

    // Update platform detection
    settings.os.platform = process.platform

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error getting system settings:", error)
    return NextResponse.json({ error: "Failed to get system settings" }, { status: 500 })
  }
}

// Save system settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { settings } = await request.json()
    
    if (!settings) {
      return NextResponse.json({ error: "Settings data required" }, { status: 400 })
    }

    // Validate settings
    const validatedSettings = validateSettings(settings)
    
    // Save settings to file
    try {
      const platform = process.platform
      const isWindows = platform === 'win32'
      const isLinux = platform === 'linux'
      const isMacOS = platform === 'darwin'
      
      let settingsPath = ''
      let settingsDir = ''
      
      if (isWindows) {
        settingsDir = 'C:\\radius-admin'
        settingsPath = 'C:\\radius-admin\\settings.json'
        // Create directory if it doesn't exist
        await execAsync(`mkdir "${settingsDir}" 2>nul || echo "Directory exists"`)
        // Save settings to file
        await execAsync(`echo '${JSON.stringify(validatedSettings, null, 2)}' | Out-File -FilePath "${settingsPath}" -Encoding UTF8`)
      } else if (isLinux) {
        settingsDir = '/etc/radius-admin'
        settingsPath = '/etc/radius-admin/settings.json'
        // Create directory if it doesn't exist
        await execAsync(`mkdir -p ${settingsDir}`)
        // Save settings to file
        await execAsync(`echo '${JSON.stringify(validatedSettings, null, 2)}' > ${settingsPath}`)
        // Set proper permissions
        await execAsync(`chmod 600 ${settingsPath}`)
      } else if (isMacOS) {
        settingsDir = '/usr/local/etc/radius-admin'
        settingsPath = '/usr/local/etc/radius-admin/settings.json'
        // Create directory if it doesn't exist
        await execAsync(`mkdir -p ${settingsDir}`)
        // Save settings to file
        await execAsync(`echo '${JSON.stringify(validatedSettings, null, 2)}' > ${settingsPath}`)
        // Set proper permissions
        await execAsync(`chmod 600 ${settingsPath}`)
      } else {
        // Fallback for unknown platforms
        settingsDir = './radius-admin-config'
        settingsPath = './radius-admin-config/settings.json'
        await execAsync(`mkdir -p ${settingsDir}`)
        await execAsync(`echo '${JSON.stringify(validatedSettings, null, 2)}' > ${settingsPath}`)
      }
      
      console.log(`Settings saved to: ${settingsPath}`)
      
      // Apply FreeRADIUS configuration changes
      await applyFreeRADIUSConfig(validatedSettings)
      
      // Apply OS configuration changes
      await applyOSConfig(validatedSettings)
      
      console.log("System settings saved and applied successfully")
      
      return NextResponse.json({ 
        message: "Settings saved successfully",
        settings: validatedSettings,
        settingsPath: settingsPath
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      return NextResponse.json({ 
        error: "Failed to save settings", 
        details: error instanceof Error ? error.message : "Unknown error"
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Error processing settings:", error)
    return NextResponse.json({ error: "Failed to process settings" }, { status: 500 })
  }
}

// Validate settings
function validateSettings(settings: Record<string, unknown>) {
  const validated = { ...defaultSettings, ...settings }
  
  // Validate logging settings
  if (validated.logging.level && !["debug", "info", "warn", "error", "fatal"].includes(validated.logging.level)) {
    validated.logging.level = "info"
  }
  
  // Validate performance settings
  if (validated.performance.maxConnections < 1 || validated.performance.maxConnections > 10000) {
    validated.performance.maxConnections = 1000
  }
  
  if (validated.performance.threadPoolSize < 1 || validated.performance.threadPoolSize > 100) {
    validated.performance.threadPoolSize = 10
  }
  
  // Validate limits
  if (validated.limits.maxUsers < 1) {
    validated.limits.maxUsers = 10000
  }
  
  if (validated.limits.maxSessions < 1) {
    validated.limits.maxSessions = 5000
  }
  
  // Validate FreeRADIUS settings
  if (validated.freeradius.debugLevel < 0 || validated.freeradius.debugLevel > 4) {
    validated.freeradius.debugLevel = 1
  }
  
  if (validated.freeradius.logLevel && !["debug", "info", "warn", "error"].includes(validated.freeradius.logLevel)) {
    validated.freeradius.logLevel = "info"
  }
  
  return validated
}

// Apply FreeRADIUS configuration
async function applyFreeRADIUSConfig(settings: Record<string, unknown>) {
  try {
    const platform = process.platform
    const isWindows = platform === 'win32'
    const isLinux = platform === 'linux'
    const isMacOS = platform === 'darwin'
    
    if (isWindows) {
      // Windows-specific FreeRADIUS configuration
      console.log("Applying Windows FreeRADIUS configuration...")
      
      // Update FreeRADIUS configuration files
      const radiusConfigPath = "C:\\Program Files\\FreeRADIUS\\etc\\raddb"
      
      // Update radiusd.conf
      const freeradiusSettings = settings.freeradius as Record<string, unknown>
      const loggingSettings = settings.logging as Record<string, unknown>
      
      const radiusdConf = `
# FreeRADIUS Configuration - Generated by Radius Admin
# Debug level: ${freeradiusSettings.debugLevel}
# Log level: ${freeradiusSettings.logLevel}

log {
  destination = ${loggingSettings.destination}
  file = \${logdir}/radius.log
  syslog_facility = daemon
  stripped_names = no
  auth = ${freeradiusSettings.logLevel}
  auth_badpass = ${freeradiusSettings.logLevel}
  auth_goodpass = ${freeradiusSettings.logLevel}
}

listen {
  type = auth
  ipaddr = *
  port = 1812
  interface = \${listen.ipaddr}
  max_connections = ${freeradiusSettings.maxConnections}
  lifetime = 0
  idle_timeout = 30
}

listen {
  type = acct
  ipaddr = *
  port = 1813
  interface = \${listen.ipaddr}
  max_connections = ${freeradiusSettings.maxConnections}
  lifetime = 0
  idle_timeout = 30
}

thread pool {
  start_servers = 5
  max_servers = ${freeradiusSettings.threadPoolSize}
  min_spare_servers = 5
  max_spare_servers = 10
  max_requests_per_server = ${freeradiusSettings.maxRequests}
  max_requests = ${freeradiusSettings.maxRequests}
}
`
      
      // Write configuration to file
      await execAsync(`echo '${radiusdConf}' | Out-File -FilePath "${radiusConfigPath}\\radiusd.conf" -Encoding UTF8`)
      
    } else if (isLinux) {
      // Linux-specific FreeRADIUS configuration
      console.log("Applying Linux FreeRADIUS configuration...")
      
      // Update /etc/freeradius/3.0/radiusd.conf
      const freeradiusSettings = settings.freeradius as Record<string, unknown>
      const loggingSettings = settings.logging as Record<string, unknown>
      
      const radiusdConf = `
# FreeRADIUS Configuration - Generated by Radius Admin
# Debug level: ${freeradiusSettings.debugLevel}
# Log level: ${freeradiusSettings.logLevel}

log {
  destination = ${loggingSettings.destination}
  file = \${logdir}/radius.log
  syslog_facility = daemon
  stripped_names = no
  auth = ${freeradiusSettings.logLevel}
  auth_badpass = ${freeradiusSettings.logLevel}
  auth_goodpass = ${freeradiusSettings.logLevel}
}

listen {
  type = auth
  ipaddr = *
  port = 1812
  interface = \${listen.ipaddr}
  max_connections = ${freeradiusSettings.maxConnections}
  lifetime = 0
  idle_timeout = 30
}

listen {
  type = acct
  ipaddr = *
  port = 1813
  interface = \${listen.ipaddr}
  max_connections = ${freeradiusSettings.maxConnections}
  lifetime = 0
  idle_timeout = 30
}

thread pool {
  start_servers = 5
  max_servers = ${freeradiusSettings.threadPoolSize}
  min_spare_servers = 5
  max_spare_servers = 10
  max_requests_per_server = ${freeradiusSettings.maxRequests}
  max_requests = ${freeradiusSettings.maxRequests}
}
`
      
      // Write configuration to file
      await execAsync(`echo '${radiusdConf}' > /etc/freeradius/3.0/radiusd.conf`)
      
      // Restart FreeRADIUS service
      try {
        await execAsync(`systemctl restart freeradius`)
        console.log("FreeRADIUS service restarted successfully")
      } catch (error) {
        console.log("Could not restart FreeRADIUS service:", error)
      }
      
    } else if (isMacOS) {
      // macOS-specific FreeRADIUS configuration
      console.log("Applying macOS FreeRADIUS configuration...")
      
      // Similar to Linux but with different paths
      const freeradiusSettings = settings.freeradius as Record<string, unknown>
      const loggingSettings = settings.logging as Record<string, unknown>
      
      const radiusdConf = `
# FreeRADIUS Configuration - Generated by Radius Admin
# Debug level: ${freeradiusSettings.debugLevel}
# Log level: ${freeradiusSettings.logLevel}

log {
  destination = ${loggingSettings.destination}
  file = \${logdir}/radius.log
  syslog_facility = daemon
  stripped_names = no
  auth = ${freeradiusSettings.logLevel}
  auth_badpass = ${freeradiusSettings.logLevel}
  auth_goodpass = ${freeradiusSettings.logLevel}
}

listen {
  type = auth
  ipaddr = *
  port = 1812
  interface = \${listen.ipaddr}
  max_connections = ${freeradiusSettings.maxConnections}
  lifetime = 0
  idle_timeout = 30
}

listen {
  type = acct
  ipaddr = *
  port = 1813
  interface = \${listen.ipaddr}
  max_connections = ${freeradiusSettings.maxConnections}
  lifetime = 0
  idle_timeout = 30
}

thread pool {
  start_servers = 5
  max_servers = ${freeradiusSettings.threadPoolSize}
  min_spare_servers = 5
  max_spare_servers = 10
  max_requests_per_server = ${freeradiusSettings.maxRequests}
  max_requests = ${freeradiusSettings.maxRequests}
}
`
      
      // Write configuration to file
      await execAsync(`echo '${radiusdConf}' > /usr/local/etc/raddb/radiusd.conf`)
      
    }
    
    console.log("FreeRADIUS configuration applied successfully")
  } catch (error) {
    console.error("Error applying FreeRADIUS configuration:", error)
  }
}

// Apply OS configuration
async function applyOSConfig(settings: Record<string, unknown>) {
  try {
    const platform = process.platform
    const isWindows = platform === 'win32'
    const isLinux = platform === 'linux'
    const isMacOS = platform === 'darwin'
    
    if (isWindows) {
      // Windows-specific OS configuration
      console.log("Applying Windows OS configuration...")
      
      // Set system limits using PowerShell
      const osSettings = settings.os as Record<string, unknown>
      if ((osSettings.maxOpenFiles as number) > 0) {
        await execAsync(`powershell "Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters' -Name 'MaxUserPort' -Value ${osSettings.maxOpenFiles}"`)
      }
      
    } else if (isLinux) {
      // Linux-specific OS configuration
      console.log("Applying Linux OS configuration...")
      
      // Update /etc/security/limits.conf
      const osSettings = settings.os as Record<string, unknown>
      const limitsConf = `
# Radius Admin Configuration
* soft nofile ${osSettings.maxOpenFiles}
* hard nofile ${osSettings.maxOpenFiles}
* soft nproc ${osSettings.maxProcesses}
* hard nproc ${osSettings.maxProcesses}
freeradius soft nofile ${osSettings.maxOpenFiles}
freeradius hard nofile ${osSettings.maxOpenFiles}
freeradius soft nproc ${osSettings.maxProcesses}
freeradius hard nproc ${osSettings.maxProcesses}
`
      
      await execAsync(`echo '${limitsConf}' >> /etc/security/limits.conf`)
      
      // Configure log rotation
      if (osSettings.enableLogRotation) {
        const logrotateConf = `
/var/log/radius/*.log {
    daily
    missingok
    rotate ${osSettings.logRetentionDays}
    compress
    delaycompress
    notifempty
    create 0644 freeradius freeradius
    postrotate
        systemctl reload freeradius > /dev/null 2>&1 || true
    endscript
}
`
        
        await execAsync(`echo '${logrotateConf}' > /etc/logrotate.d/radius`)
      }
      
    } else if (isMacOS) {
      // macOS-specific OS configuration
      console.log("Applying macOS OS configuration...")
      
      // Similar to Linux but with different paths
      const osSettings = settings.os as Record<string, unknown>
      const limitsConf = `
# Radius Admin Configuration
* soft nofile ${osSettings.maxOpenFiles}
* hard nofile ${osSettings.maxOpenFiles}
* soft nproc ${osSettings.maxProcesses}
* hard nproc ${osSettings.maxProcesses}
`
      
      await execAsync(`echo '${limitsConf}' >> /etc/security/limits.conf`)
    }
    
    console.log("OS configuration applied successfully")
  } catch (error) {
    console.error("Error applying OS configuration:", error)
  }
}
