// Real-time data service for monitoring dashboard
export class RealtimeService {
  private static instance: RealtimeService;
  private eventSource: EventSource | null = null;
  private listeners: Map<string, ((data: unknown) => void)[]> = new Map();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;

  private constructor() {}

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  connect() {
    if (this.isConnected) return;

    try {
      this.eventSource = new EventSource('/api/radius/reports/realtime/ws');
      
      this.eventSource.onopen = () => {
        console.log('Real-time connection established');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected', { timestamp: new Date().toISOString() });
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('data', data);
        } catch (error) {
          console.error('Error parsing real-time data:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('Real-time connection error:', error);
        this.isConnected = false;
        this.emit('error', error);
        this.handleReconnect();
      };

      // EventSource doesn't have onclose, we'll handle it in onerror

    } catch (error) {
      console.error('Failed to establish real-time connection:', error);
      this.emit('error', error);
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached', { attempts: this.maxReconnectAttempts });
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  on(event: string, callback: (data: unknown) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: unknown) => void) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: unknown) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Fetch data manually (fallback when WebSocket is not available)
  async fetchData(type: string = 'overview') {
    try {
      const response = await fetch(`/api/radius/reports/realtime?type=${type}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      throw error;
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

// Export singleton instance
export const realtimeService = RealtimeService.getInstance();
