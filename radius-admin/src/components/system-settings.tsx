"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Settings, 
  Server, 
  Database, 
  Activity, 
  Shield, 
  Cpu, 
  HardDrive, 
  MemoryStick,
  FileText,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Save,
  RotateCcw
} from "lucide-react"

interface SystemSettings {
  // Logging Configuration
  logging: {
    level: string
    destination: string
    maxFileSize: number
    maxFiles: number
    enableConsole: boolean
    enableFile: boolean
    enableSyslog: boolean
  }
  // Performance Tuning
  performance: {
    maxConnections: number
    threadPoolSize: number
    cacheSize: number
    timeout: number
    enableCompression: boolean
    enableCaching: boolean
  }
  // System Limits
  limits: {
    maxUsers: number
    maxSessions: number
    maxBandwidth: number
    maxConcurrentLogins: number
    sessionTimeout: number
    idleTimeout: number
  }
  // FreeRADIUS Specific
  freeradius: {
    debugLevel: number
    logLevel: string
    maxRequests: number
    maxConnections: number
    threadPoolSize: number
    enableAccounting: boolean
    enableAuthentication: boolean
    enableProxy: boolean
  }
  // OS Specific
  os: {
    platform: string
    maxOpenFiles: number
    maxProcesses: number
    enableLogRotation: boolean
    logRetentionDays: number
    enableSystemMonitoring: boolean
  }
}

interface SystemStatus {
  freeradius: {
    status: string
    version: string
    uptime: string
    processes: number
    memoryUsage: number
  }
  system: {
    platform: string
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    loadAverage: number
  }
}

export default function SystemSettings() {
  const { status } = useSession()
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("logging")
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load system settings and status
  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      setLoading(false)
      return
    }

    const loadSettings = async () => {
      try {
        setLoading(true)
        const [settingsRes, statusRes] = await Promise.all([
          fetch('/api/radius/config/system-settings'),
          fetch('/api/radius/config/system-status')
        ])

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          setSettings(settingsData.settings)
        }

        if (statusRes.ok) {
          const statusData = await statusRes.json()
          setSystemStatus(statusData.status)
        }
      } catch (error) {
        console.error('Failed to load system settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [status])

  const handleSettingChange = (category: keyof SystemSettings, key: string, value: unknown) => {
    if (!settings) return
    
    setSettings(prev => ({
      ...prev!,
      [category]: {
        ...prev![category],
        [key]: value
      }
    }))
  }

  const handleSaveSettings = async () => {
    if (!settings) return

    try {
      setSaving(true)
      const response = await fetch('/api/radius/config/system-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Settings saved successfully:', data.message)
        setMessage({ type: 'success', text: data.message || 'Settings saved successfully' })
        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to save settings:', response.status, response.statusText, errorData)
        setMessage({ 
          type: 'error', 
          text: errorData.details || errorData.error || `Failed to save settings: ${response.status} ${response.statusText}` 
        })
        // Clear message after 5 seconds
        setTimeout(() => setMessage(null), 5000)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Network error occurred while saving settings' 
      })
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setSaving(false)
    }
  }

  const handleResetSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/radius/config/system-settings/reset', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error resetting settings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading system settings...</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-4" />
              <p className="text-gray-600">Please sign in to configure system settings</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-4" />
              <p className="text-gray-600">Failed to load system settings</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
              <p className="text-gray-600">Configure logging levels, performance tuning, and system limits</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleResetSettings}
              disabled={saving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </div>
        
        {/* Message Display */}
        {message && (
          <div className={`mt-4 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}
      </Card>

      {/* System Status */}
      {systemStatus && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Server className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">FreeRADIUS</p>
                <p className="font-semibold text-blue-600">{systemStatus.freeradius.status}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Cpu className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">CPU Usage</p>
                <p className="font-semibold text-green-600">{systemStatus.system.cpuUsage}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <MemoryStick className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Memory Usage</p>
                <p className="font-semibold text-yellow-600">{systemStatus.system.memoryUsage}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <HardDrive className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Disk Usage</p>
                <p className="font-semibold text-purple-600">{systemStatus.system.diskUsage}%</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="logging" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Logging
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="limits" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Limits
          </TabsTrigger>
          <TabsTrigger value="freeradius" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            FreeRADIUS
          </TabsTrigger>
          <TabsTrigger value="os" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            OS Settings
          </TabsTrigger>
        </TabsList>

        {/* Logging Configuration */}
        <TabsContent value="logging" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Logging Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="logLevel">Log Level</Label>
                  <Select
                    value={settings.logging.level}
                    onValueChange={(value) => handleSettingChange('logging', 'level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="fatal">Fatal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="logDestination">Log Destination</Label>
                  <Select
                    value={settings.logging.destination}
                    onValueChange={(value) => handleSettingChange('logging', 'destination', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="file">File</SelectItem>
                      <SelectItem value="console">Console</SelectItem>
                      <SelectItem value="syslog">Syslog</SelectItem>
                      <SelectItem value="both">File + Console</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={settings.logging.maxFileSize}
                    onChange={(e) => handleSettingChange('logging', 'maxFileSize', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="maxFiles">Max Files</Label>
                  <Input
                    id="maxFiles"
                    type="number"
                    value={settings.logging.maxFiles}
                    onChange={(e) => handleSettingChange('logging', 'maxFiles', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enableConsole">Enable Console Logging</Label>
                  <Switch
                    id="enableConsole"
                    checked={settings.logging.enableConsole}
                    onCheckedChange={(checked) => handleSettingChange('logging', 'enableConsole', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enableFile">Enable File Logging</Label>
                  <Switch
                    id="enableFile"
                    checked={settings.logging.enableFile}
                    onCheckedChange={(checked) => handleSettingChange('logging', 'enableFile', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enableSyslog">Enable Syslog</Label>
                  <Switch
                    id="enableSyslog"
                    checked={settings.logging.enableSyslog}
                    onCheckedChange={(checked) => handleSettingChange('logging', 'enableSyslog', checked)}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Performance Tuning */}
        <TabsContent value="performance" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Tuning</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="maxConnections">Max Connections</Label>
                  <Input
                    id="maxConnections"
                    type="number"
                    value={settings.performance.maxConnections}
                    onChange={(e) => handleSettingChange('performance', 'maxConnections', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="threadPoolSize">Thread Pool Size</Label>
                  <Input
                    id="threadPoolSize"
                    type="number"
                    value={settings.performance.threadPoolSize}
                    onChange={(e) => handleSettingChange('performance', 'threadPoolSize', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="cacheSize">Cache Size (MB)</Label>
                  <Input
                    id="cacheSize"
                    type="number"
                    value={settings.performance.cacheSize}
                    onChange={(e) => handleSettingChange('performance', 'cacheSize', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="timeout">Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={settings.performance.timeout}
                    onChange={(e) => handleSettingChange('performance', 'timeout', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enableCompression">Enable Compression</Label>
                  <Switch
                    id="enableCompression"
                    checked={settings.performance.enableCompression}
                    onCheckedChange={(checked) => handleSettingChange('performance', 'enableCompression', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enableCaching">Enable Caching</Label>
                  <Switch
                    id="enableCaching"
                    checked={settings.performance.enableCaching}
                    onCheckedChange={(checked) => handleSettingChange('performance', 'enableCaching', checked)}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* System Limits */}
        <TabsContent value="limits" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="maxUsers">Max Users</Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={settings.limits.maxUsers}
                    onChange={(e) => handleSettingChange('limits', 'maxUsers', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="maxSessions">Max Sessions</Label>
                  <Input
                    id="maxSessions"
                    type="number"
                    value={settings.limits.maxSessions}
                    onChange={(e) => handleSettingChange('limits', 'maxSessions', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="maxBandwidth">Max Bandwidth (Mbps)</Label>
                  <Input
                    id="maxBandwidth"
                    type="number"
                    value={settings.limits.maxBandwidth}
                    onChange={(e) => handleSettingChange('limits', 'maxBandwidth', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="maxConcurrentLogins">Max Concurrent Logins</Label>
                  <Input
                    id="maxConcurrentLogins"
                    type="number"
                    value={settings.limits.maxConcurrentLogins}
                    onChange={(e) => handleSettingChange('limits', 'maxConcurrentLogins', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.limits.sessionTimeout}
                    onChange={(e) => handleSettingChange('limits', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="idleTimeout">Idle Timeout (minutes)</Label>
                  <Input
                    id="idleTimeout"
                    type="number"
                    value={settings.limits.idleTimeout}
                    onChange={(e) => handleSettingChange('limits', 'idleTimeout', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* FreeRADIUS Configuration */}
        <TabsContent value="freeradius" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">FreeRADIUS Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="debugLevel">Debug Level (0-4)</Label>
                  <Slider
                    value={[settings.freeradius.debugLevel]}
                    onValueChange={([value]) => handleSettingChange('freeradius', 'debugLevel', value)}
                    max={4}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">Current: {settings.freeradius.debugLevel}</p>
                </div>

                <div>
                  <Label htmlFor="logLevel">Log Level</Label>
                  <Select
                    value={settings.freeradius.logLevel}
                    onValueChange={(value) => handleSettingChange('freeradius', 'logLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxRequests">Max Requests</Label>
                  <Input
                    id="maxRequests"
                    type="number"
                    value={settings.freeradius.maxRequests}
                    onChange={(e) => handleSettingChange('freeradius', 'maxRequests', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="maxConnections">Max Connections</Label>
                  <Input
                    id="maxConnections"
                    type="number"
                    value={settings.freeradius.maxConnections}
                    onChange={(e) => handleSettingChange('freeradius', 'maxConnections', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="threadPoolSize">Thread Pool Size</Label>
                  <Input
                    id="threadPoolSize"
                    type="number"
                    value={settings.freeradius.threadPoolSize}
                    onChange={(e) => handleSettingChange('freeradius', 'threadPoolSize', parseInt(e.target.value))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enableAccounting">Enable Accounting</Label>
                  <Switch
                    id="enableAccounting"
                    checked={settings.freeradius.enableAccounting}
                    onCheckedChange={(checked) => handleSettingChange('freeradius', 'enableAccounting', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enableAuthentication">Enable Authentication</Label>
                  <Switch
                    id="enableAuthentication"
                    checked={settings.freeradius.enableAuthentication}
                    onCheckedChange={(checked) => handleSettingChange('freeradius', 'enableAuthentication', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enableProxy">Enable Proxy</Label>
                  <Switch
                    id="enableProxy"
                    checked={settings.freeradius.enableProxy}
                    onCheckedChange={(checked) => handleSettingChange('freeradius', 'enableProxy', checked)}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* OS Settings */}
        <TabsContent value="os" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">OS Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="platform">Platform</Label>
                  <Input
                    id="platform"
                    value={settings.os.platform}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-sm text-gray-500 mt-1">Detected automatically</p>
                </div>

                <div>
                  <Label htmlFor="maxOpenFiles">Max Open Files</Label>
                  <Input
                    id="maxOpenFiles"
                    type="number"
                    value={settings.os.maxOpenFiles}
                    onChange={(e) => handleSettingChange('os', 'maxOpenFiles', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="maxProcesses">Max Processes</Label>
                  <Input
                    id="maxProcesses"
                    type="number"
                    value={settings.os.maxProcesses}
                    onChange={(e) => handleSettingChange('os', 'maxProcesses', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="logRetentionDays">Log Retention (days)</Label>
                  <Input
                    id="logRetentionDays"
                    type="number"
                    value={settings.os.logRetentionDays}
                    onChange={(e) => handleSettingChange('os', 'logRetentionDays', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enableLogRotation">Enable Log Rotation</Label>
                  <Switch
                    id="enableLogRotation"
                    checked={settings.os.enableLogRotation}
                    onCheckedChange={(checked) => handleSettingChange('os', 'enableLogRotation', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enableSystemMonitoring">Enable System Monitoring</Label>
                  <Switch
                    id="enableSystemMonitoring"
                    checked={settings.os.enableSystemMonitoring}
                    onCheckedChange={(checked) => handleSettingChange('os', 'enableSystemMonitoring', checked)}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
