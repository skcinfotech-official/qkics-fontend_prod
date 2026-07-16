import { useState, useRef, useCallback, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";

export function useCallChat(call_room_id, token) {
  const wsRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  // user IDs (as strings, == LiveKit identity) the host has blocked from chat
  const [blockedUserIds, setBlockedUserIds] = useState([]);
  // set true when THIS client tries to chat while blocked
  const [blockedNotice, setBlockedNotice] = useState(false);

  const connect = useCallback((initialMessages = []) => {
    if (!call_room_id || !token) return;
    setMessages(initialMessages);

    try {
      const urlObj = new URL(API_BASE_URL);
      const domain = urlObj.host;
      const proto = urlObj.protocol === "https:" ? "wss" : "ws";

      const url = `${proto}://${domain}/ws/calls/${call_room_id}/?token=${token}`;
      const ws = new WebSocket(url);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "call_message") {
          setMessages((prev) => [...prev, {
            id: data.message_id || Date.now(),
            senderUsername: data.sender_username,
            text: data.text,
            timestamp: data.timestamp,
            isFile: false,
          }]);
        }
        if (data.type === "file_shared") {
          setMessages((prev) => [...prev, {
            id: data.message_id,
            senderUsername: data.sender_username,
            fileName: data.file_name,
            fileUrl: data.file_url,
            fileSizeBytes: data.file_size_bytes,
            isFile: true,
          }]);
        }
        if (data.type === "typing") {
          setIsTyping(data.is_typing);
          if (data.is_typing) setTimeout(() => setIsTyping(false), 3000);
        }
        if (data.type === "chat_block_state" || data.type === "chat_block_changed") {
          setBlockedUserIds(data.blocked_user_ids || []);
        }
        if (data.type === "chat_blocked_notice") {
          setBlockedNotice(true);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("WebSocket connection error:", err);
    }
  }, [call_room_id, token]);

  const sendMessage = useCallback((text) => {
    if (!text.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "call_message", text: text.trim() }));
  }, []);

  const notifyFileShared = useCallback((msg) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: "file_shared",
      message_id: msg.id,
      file_name: msg.file_name,
      file_url: msg.file_url,
      file_size_bytes: msg.file_size_bytes,
    }));
  }, []);

  const sendTyping = useCallback((isTypingNow) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "typing", is_typing: isTypingNow }));
  }, []);

  /** Host only: block / unblock a participant from the in-call chat. */
  const blockUser = useCallback((identity, blocked = true) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: "block_user",
      user_id: identity,
      blocked,
    }));
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close(1000);
    wsRef.current = null;
  }, []);

  useEffect(() => {
    return () => wsRef.current?.close(1000);
  }, []);

  return {
    connect,
    disconnect,
    sendMessage,
    notifyFileShared,
    sendTyping,
    blockUser,
    messages,
    isTyping,
    blockedUserIds,
    blockedNotice,
  };
}
