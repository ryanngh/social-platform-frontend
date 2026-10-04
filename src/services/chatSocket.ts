import type { WSClientFrame, WSServerFrame, WSConnectionState } from '../types/chat';
import type { CallCommand, CallClientEvent } from '../types/call';
import { generateUUID } from '../utils/uuid';

export type PayloadOf<T extends WSServerFrame['type']> = Extract<WSServerFrame, { type: T }> extends {
  payload: infer P;
}
  ? P
  : void;

type FrameHandler<T extends WSServerFrame['type']> = (payload: PayloadOf<T>) => void;

type StateChangeHandler = (state: WSConnectionState) => void;

class ChatSocketManager {
  public readonly callSessionId = generateUUID();
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private state: WSConnectionState = 'DISCONNECTED';
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private reconnectTimerId: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  private isManuallyClosed = false;

  private listeners: Map<string, Set<(payload: any) => void>> = new Map();
  private stateListeners: Set<StateChangeHandler> = new Set();

  constructor() {
    const envWsUrl = import.meta.env.VITE_CHAT_WS_URL;
    if (envWsUrl) {
      this.wsUrl = envWsUrl;
    } else if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.wsUrl = `${protocol}//${window.location.host}/ws`;
    } else {
      this.wsUrl = 'ws://localhost:8081/ws';
    }
  }

  public getState(): WSConnectionState {
    return this.state;
  }

  public isConnected(): boolean {
    return this.state === 'CONNECTED' && this.ws?.readyState === WebSocket.OPEN;
  }

  private setState(newState: WSConnectionState) {
    if (this.state !== newState) {
      this.state = newState;
      this.stateListeners.forEach((listener) => {
        try {
          listener(newState);
        } catch (err) {
          console.error('[ChatSocket] Error in state listener:', err);
        }
      });
    }
  }

  public onStateChange(handler: StateChangeHandler): () => void {
    this.stateListeners.add(handler);
    handler(this.state);
    return () => {
      this.stateListeners.delete(handler);
    };
  }

  public on<T extends WSServerFrame['type']>(type: T, handler: FrameHandler<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    const set = this.listeners.get(type)!;
    set.add(handler);

    return () => {
      set.delete(handler);
    };
  }

  public emit<T extends WSServerFrame['type']>(
    type: T,
    payload: PayloadOf<T>
  ) {
    const set = this.listeners.get(type);
    if (set) {
      set.forEach((handler) => {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[ChatSocket] Error in listener for ${type}:`, err);
        }
      });
    }
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('[ChatSocket] No access token found. Cannot connect.');
      this.setState('DISCONNECTED');
      return;
    }

    this.isManuallyClosed = false;
    this.setState('CONNECTING');

    try {
      // Connect using query param token fallback (most compatible across browser / proxies)
      const connectUrl = `${this.wsUrl}?token=${encodeURIComponent(token)}&call_session_id=${this.callSessionId}`;
      this.ws = new WebSocket(connectUrl);

      this.ws.onopen = () => {
        console.log('[ChatSocket] Connected successfully to', this.wsUrl);
        this.setState('CONNECTED');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const raw = typeof event.data === 'string' ? event.data : '';
          if (!raw) return;

          const frame: WSServerFrame = JSON.parse(raw);
          if (frame && frame.type) {
            this.emit(frame.type, (frame as any).payload);
          }
        } catch (err) {
          console.error('[ChatSocket] Failed to parse message frame:', err, event.data);
        }
      };

      this.ws.onerror = (error) => {
        console.warn('[ChatSocket] WebSocket encountered an error:', error);
        this.setState('ERROR');
      };

      this.ws.onclose = (event) => {
        if(event.code === 4401) { window.dispatchEvent(new Event('auth-revoked')); this.stopHeartbeat();this.setState('DISCONNECTED');return; }
        this.stopHeartbeat();
        this.ws = null;
        console.log(`[ChatSocket] Disconnected (code: ${event.code}, reason: "${event.reason}")`);

        if (event.code === 4001 || event.code === 4003 || event.reason?.includes('expired') || event.reason?.includes('unauthorized')) {
          console.warn('[ChatSocket] Token unauthorized, stopping reconnect loop');
          this.setState('DISCONNECTED');
          return;
        }

        if (!this.isManuallyClosed) {
          this.setState('DISCONNECTED');
          this.scheduleReconnect();
        } else {
          this.setState('DISCONNECTED');
        }
      };
    } catch (err) {
      console.error('[ChatSocket] Failed to create WebSocket connection:', err);
      this.setState('ERROR');
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.isManuallyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimerId) {
      clearTimeout(this.reconnectTimerId);
      this.reconnectTimerId = null;
    }
    if (this.ws) {
      this.ws.close(1000, 'User logged out or component unmounted');
      this.ws = null;
    }
    this.setState('DISCONNECTED');
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimerId) return;

    this.reconnectAttempts += 1;
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s + small jitter
    const baseDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
    const jitter = Math.floor(Math.random() * 500);
    const delay = baseDelay + jitter;

    console.log(`[ChatSocket] Scheduling reconnect attempt #${this.reconnectAttempts} in ${delay}ms...`);

    this.reconnectTimerId = setTimeout(() => {
      this.reconnectTimerId = null;
      if (!this.isManuallyClosed) {
        this.connect();
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingIntervalId = setInterval(() => {
      this.sendFrame({ type: 'ping' });
    }, 30000); // 30s ping interval
  }

  private stopHeartbeat(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  public sendFrame(frame: WSClientFrame): boolean {
    if (!this.isConnected() || !this.ws) {
      return false;
    }

    try {
      this.ws.send(JSON.stringify(frame));
      return true;
    } catch (err) {
      console.error('[ChatSocket] Failed to send frame:', err, frame);
      return false;
    }
  }

  public sendMessage(conversationId: string, clientMsgId: string, body: string, replyToId?: number | null): boolean {
    return this.sendFrame({
      type: 'message.send',
      payload: {
        conversation_id: conversationId,
        client_msg_id: clientMsgId,
        body,
        reply_to_id: replyToId ?? null,
      },
    });
  }

  public sendRead(conversationId: string, seq: number): boolean {
    return this.sendFrame({
      type: 'message.read',
      payload: {
        conversation_id: conversationId,
        seq,
      },
    });
  }

  public sendCall(type: CallClientEvent, payload: CallCommand = {}): boolean {
    return this.sendFrame({ type, payload });
  }

  public sendSync(conversationId: string, afterSeq: number): boolean {
    return this.sendFrame({
      type: 'message.sync',
      payload: {
        conversation_id: conversationId,
        after_seq: afterSeq,
      },
    });
  }

  public sendTyping(conversationId: string): boolean {
    return this.sendFrame({
      type: 'typing.start',
      payload: {
        conversation_id: conversationId,
      },
    });
  }

  public subscribePresence(userIds: string[]): boolean {
    if (!userIds.length) return false;
    return this.sendFrame({
      type: 'presence.subscribe',
      payload: {
        user_ids: userIds,
      },
    });
  }
}

export const chatSocket = new ChatSocketManager();
export default chatSocket;
