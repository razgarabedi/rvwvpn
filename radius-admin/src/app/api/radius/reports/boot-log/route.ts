import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// GET /api/radius/reports/boot-log - Get boot log entries (dmesg)
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Mock data for demonstration - in production, this would query the actual database
    const mockLogEntries = [
      {
        id: 1,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        level: "INFO",
        subsystem: "Kernel",
        message: "Linux version 5.4.0-74-generic (buildd@lcy01-amd64-027)",
        device: "system",
        driver: "kernel",
        memory_address: "0x0",
        irq: 0,
        cpu: 0,
        details: "Kernel boot sequence started"
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        level: "INFO",
        subsystem: "Memory",
        message: "Memory: 8192MB available",
        device: "memory",
        driver: "memory",
        memory_address: "0x10000000",
        irq: 0,
        cpu: 0,
        details: "Memory initialization completed"
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 900000).toISOString(),
        level: "INFO",
        subsystem: "CPU",
        message: "CPU0: Intel(R) Core(TM) i7-8700K CPU @ 3.70GHz",
        device: "cpu0",
        driver: "cpu",
        memory_address: "0x0",
        irq: 0,
        cpu: 0,
        details: "CPU initialization completed"
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        level: "INFO",
        subsystem: "Storage",
        message: "sd 0:0:0:0: [sda] 1000GB 512-byte logical blocks",
        device: "sda",
        driver: "sd",
        memory_address: "0x0",
        irq: 16,
        cpu: 0,
        details: "Storage device detected"
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 1500000).toISOString(),
        level: "WARNING",
        subsystem: "Network",
        message: "eth0: link down",
        device: "eth0",
        driver: "e1000",
        memory_address: "0x0",
        irq: 19,
        cpu: 0,
        details: "Network interface down during boot"
      },
      {
        id: 6,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        level: "INFO",
        subsystem: "USB",
        message: "usb 1-1: new high-speed USB device number 2 using ehci_hcd",
        device: "usb1-1",
        driver: "ehci_hcd",
        memory_address: "0x0",
        irq: 23,
        cpu: 0,
        details: "USB device detected"
      },
      {
        id: 7,
        timestamp: new Date(Date.now() - 2100000).toISOString(),
        level: "INFO",
        subsystem: "PCI",
        message: "pci 0000:00:1f.3: Intel Corporation 8 Series/C220 Series Chipset Family SMBus Controller",
        device: "0000:00:1f.3",
        driver: "i801_smbus",
        memory_address: "0x0",
        irq: 11,
        cpu: 0,
        details: "PCI device initialized"
      },
      {
        id: 8,
        timestamp: new Date(Date.now() - 2400000).toISOString(),
        level: "INFO",
        subsystem: "Network",
        message: "eth0: link up (1000Mbps/Full duplex)",
        device: "eth0",
        driver: "e1000",
        memory_address: "0x0",
        irq: 19,
        cpu: 0,
        details: "Network interface up"
      },
      {
        id: 9,
        timestamp: new Date(Date.now() - 2700000).toISOString(),
        level: "INFO",
        subsystem: "Kernel",
        message: "Freeing unused kernel memory: 1024K",
        device: "system",
        driver: "kernel",
        memory_address: "0x0",
        irq: 0,
        cpu: 0,
        details: "Kernel memory optimization"
      },
      {
        id: 10,
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        level: "INFO",
        subsystem: "Kernel",
        message: "Write protecting the kernel read-only data: 8192k",
        device: "system",
        driver: "kernel",
        memory_address: "0x0",
        irq: 0,
        cpu: 0,
        details: "Kernel security initialization"
      }
    ]

    return NextResponse.json(mockLogEntries)
  } catch (error) {
    console.error("Error fetching boot log entries:", error)
    return NextResponse.json(
      { error: "Failed to fetch boot log entries" },
      { status: 500 }
    )
  }
}
