/**
 * WebSocket connection hook with reconnection and binary decode.
 */
import { useEffect, useRef, useCallback, useState } from "react";
import { decodeMessage, encodeCommand, type ServerMessage } from "../lib/protocol";

type MessageHandler = (msg: ServerMessage) => void;

interface UseWebSocketOptions {
  url: string;
  onMessage: MessageHandler;
  reconnectMs?: number;
}

export function useWebSocket({ url, onMessage, reconnectMs = 2000 }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };

    ws.onmessage = (event) => {
      try {
        const msg = decodeMessage(event.data as ArrayBuffer);
        onMessageRef.current(msg);
      } catch (e) {
        console.error("Failed to decode message:", e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, reconnectMs);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [url, reconnectMs]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((cmd: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(encodeCommand(cmd));
    }
  }, []);

  return { connected, send };
}
