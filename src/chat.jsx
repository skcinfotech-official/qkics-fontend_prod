import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getAccessToken } from "./redux/store/tokenManager";

import {
  MdSend,
  MdSearch,
  MdMoreVert,
  MdArrowBack,
  MdChatBubbleOutline,
  MdClose,
  MdVideoCall,
} from "react-icons/md";
import axiosSecure from "./components/utils/axiosSecure";
import useChatSocket from "./components/hooks/useChatSocket.jsx";
import "./chatPage.css";

function TypingDots() {
  return (
    <span className="flex items-center gap-1">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </span>
  );
}

function formatMessageDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function avatarFor(person) {
  return (
    person?.profile_picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(person?.first_name || person?.username || "User")}&background=random`
  );
}

export default function ChatPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { data: user } = useSelector((state) => state.user);

  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState(null);
  const [messagesError, setMessagesError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const readMessageIds = useRef(new Set());

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tokenRef = useRef(getAccessToken());
  const [token, setToken] = useState(tokenRef.current);

  useEffect(() => {
    const interval = setInterval(() => {
      const fresh = getAccessToken();
      if (fresh && fresh !== tokenRef.current) {
        tokenRef.current = fresh;
        setToken(fresh);
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  /* ---------------- helpers ---------------- */
  const getOtherParticipant = useCallback(
    (room) => {
      if (!room || !user) return null;
      if (room.user?.id === user.id) return room.advisor || room.expert || room.investor;
      if (room.advisor?.id === user.id) return room.user;
      if (room.expert?.id === user.id) return room.user;
      if (room.investor?.id === user.id) return room.user;
      return null;
    },
    [user]
  );

  const otherUser = getOtherParticipant(selectedRoom);

  /* ---------------- websocket ---------------- */
  const { send: sendWS, isReady } = useChatSocket({
    roomId: selectedRoom?.id,
    token,
    onMessage: (msg) => {
      setMessages((prev) => {
        const isMe = msg.sender === user?.username || msg.sender_id === user?.id;
        const incomingMsg = { ...msg, is_mine: isMe };

        if (isMe) {
          const optimisticIndex = prev.findIndex(
            (m) => m.isOptimistic && m.is_mine && m.text === incomingMsg.text
          );
          if (optimisticIndex !== -1) {
            const newMsgs = [...prev];
            newMsgs[optimisticIndex] = incomingMsg;
            return newMsgs;
          }
        }

        if (msg.id && prev.some((m) => m.id === msg.id)) {
          return prev;
        }

        return [...prev, incomingMsg];
      });

      const isMe = msg.sender === user?.username || msg.sender_id === user?.id;
      if (!isMe) {
        setOnlineUsers((prev) => {
          const updates = {};
          if (msg.sender_id) updates[msg.sender_id] = true;
          if (msg.sender) updates[msg.sender] = true;
          return { ...prev, ...updates };
        });
      }
    },
    onTyping: (data) => {
      if (data.user === user?.username) return;
      setTypingUser(data.is_typing ? data.user : null);

      if (data.is_typing && data.user) {
        setOnlineUsers((prev) => ({ ...prev, [data.user]: true }));
      }
    },
    onUserStatus: (data) => {
      setOnlineUsers((prev) => {
        const updates = {};
        if (data.user_id) updates[data.user_id] = data.online;
        if (data.user) updates[data.user] = data.online;
        if (data.username) updates[data.username] = data.online;
        return { ...prev, ...updates };
      });
    },
  });

  const isUserOnline = useCallback(
    (participant) => {
      if (!participant) return false;
      const pid = participant.id;
      const uid = participant.user?.id || participant.user_id;
      const uname = participant.username || participant.user?.username;
      return (
        (pid && onlineUsers[pid]) ||
        (uid && onlineUsers[uid]) ||
        (uname && onlineUsers[uname])
      ) ?? false;
    },
    [onlineUsers]
  );

  /* ---------------- effects ---------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    fetchChatRooms();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    messages.forEach((msg) => {
      if (!msg.is_mine && msg.id && !readMessageIds.current.has(msg.id)) {
        readMessageIds.current.add(msg.id);
        sendWS({ type: "message_read", message_id: msg.id });
      }
    });
  }, [messages, isReady, sendWS]);

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeout.current);
    };
  }, []);

  /* ---------------- api ---------------- */
  const fetchChatRooms = async () => {
    try {
      setLoadingRooms(true);
      setRoomsError(null);
      const res = await axiosSecure.get("/v1/chat/rooms/");
      setChatRooms(res.data || []);

      if (res.data?.length) {
        const room = res.data.find((r) => String(r.id) === roomId) || res.data[0];
        setSelectedRoom(room);
        fetchMessages(room.id);
      }
    } catch (err) {
      console.error("Failed to load chat rooms:", err);
      setRoomsError("Failed to load conversations. Please try again.");
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchMessages = async (id) => {
    try {
      setLoadingMessages(true);
      setMessagesError(null);
      readMessageIds.current = new Set();
      const res = await axiosSecure.get(`/v1/chat/rooms/${id}/messages/`);
      setMessages(res.data || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
      setMessagesError("Failed to load messages. Please try again.");
    } finally {
      setLoadingMessages(false);
    }
  };

  /* ---------------- actions ---------------- */
  const handleTyping = (value) => {
    setNewMessage(value);
    if (!isReady) return;

    sendWS({ type: "typing", is_typing: true });

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      sendWS({ type: "typing", is_typing: false });
    }, 800);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedRoom || !isReady) return;

    const optimistic = {
      id: Date.now(),
      isOptimistic: true,
      text: newMessage,
      is_mine: true,
      created_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    sendWS({ type: "chat_message", text: newMessage });
    setNewMessage("");
    sendWS({ type: "typing", is_typing: false });
  };

  const filteredRooms = chatRooms.filter((room) => {
    const other = getOtherParticipant(room);
    const name = `${other?.first_name || ""} ${other?.last_name || ""}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  /* ============================ UI ============================ */

  return (
    <div className="mx-auto flex h-[calc(100vh-136px)] w-full max-w-7xl overflow-hidden bg-background text-foreground md:h-[calc(100vh-80px)]">

      {/* ================= LEFT SIDEBAR ================= */}
      <aside className={`flex w-full flex-col border-r border-border bg-card md:w-80 lg:w-96 ${selectedRoom && "hidden md:flex"}`}>
        <div className="border-b border-border px-5 py-4">
          <h2 className="mb-3 text-lg font-bold tracking-tight">Messages</h2>
          <div className="flex items-center gap-2 rounded-xl border border-input bg-muted/40 px-3.5 py-2.5 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40">
            <MdSearch size={18} className="shrink-0 text-muted-foreground" />
            <input
              className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto p-2 custom-scrollbar">
          {loadingRooms ? (
            [1, 2, 3, 4].map((n) => (
              <div key={n} className="flex animate-pulse items-center gap-3 rounded-xl p-3">
                <div className="h-12 w-12 shrink-0 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-24 rounded bg-muted" />
                  <div className="h-3 w-32 rounded bg-muted" />
                </div>
              </div>
            ))
          ) : roomsError ? (
            <div className="px-4 py-16 text-center">
              <p className="mb-3 text-sm font-bold text-danger">{roomsError}</p>
              <button
                onClick={fetchChatRooms}
                className="rounded-xl bg-primary px-4 py-2 text-2xs font-bold uppercase tracking-wide text-primary-foreground transition hover:bg-primary-hover"
              >
                Retry
              </button>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm font-bold text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const other = getOtherParticipant(room);
              const isActive = selectedRoom?.id === room.id;
              const isOnline = isUserOnline(other);

              return (
                <button
                  key={room.id}
                  onClick={() => {
                    setSelectedRoom(room);
                    fetchMessages(room.id);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${isActive ? "bg-primary-soft" : "hover:bg-muted"
                    }`}
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border">
                    <img src={avatarFor(other)} alt={`${other?.first_name || ""} ${other?.last_name || ""}`} className="h-full w-full object-cover" />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className={`truncate text-sm font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
                      {other?.first_name} {other?.last_name}
                    </h4>
                    <p className="truncate text-xs text-muted-foreground">
                      {room.last_message && typeof room.last_message === "object"
                        ? room.last_message.text ?? "No messages yet"
                        : room.last_message || "No messages yet"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ================= CHAT WINDOW ================= */}
      <main className={`flex flex-1 flex-col ${!selectedRoom && "hidden md:flex"}`}>
        {selectedRoom ? (
          <>
            {/* HEADER */}
            <header className="z-10 flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  className="text-foreground md:hidden"
                  onClick={() => setSelectedRoom(null)}
                  aria-label="Back to conversations"
                >
                  <MdArrowBack size={22} />
                </button>

                <div className="h-11 w-11 overflow-hidden rounded-full border border-border">
                  <img src={avatarFor(otherUser)} alt={`${otherUser?.first_name || ""} ${otherUser?.last_name || ""}`} className="h-full w-full object-cover" />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {otherUser?.first_name} {otherUser?.last_name}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${isUserOnline(otherUser) ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                    <span className="text-2xs font-medium text-muted-foreground">
                      {isUserOnline(otherUser) ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const callId = selectedRoom?.call_Room_id || selectedRoom?.booking?.call_Room_id;
                    navigate(callId ? `/video-call/${callId}` : "/video-call");
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-muted hover:text-primary"
                  aria-label="Video call"
                  title="Video call"
                >
                  <MdVideoCall size={22} />
                </button>

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${showMenu ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                    aria-label="More options"
                  >
                    <MdMoreVert size={20} />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 z-50 mt-2 flex w-44 flex-col overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-xl animate-fadeIn">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          const callId = selectedRoom?.call_Room_id || selectedRoom?.booking?.call_Room_id;
                          navigate(callId ? `/video-call/${callId}` : "/video-call");
                        }}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                      >
                        <MdVideoCall size={18} className="text-primary" />
                        Video Call
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRoom(null);
                          setShowMenu(false);
                        }}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                      >
                        <MdClose size={16} className="text-muted-foreground" />
                        Close Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* MESSAGES */}
            <div className="flex-1 space-y-1 overflow-y-auto bg-muted/30 p-4 custom-scrollbar">
              {loadingMessages ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
                  <p className="text-2xs font-bold uppercase tracking-wide">Loading messages...</p>
                </div>
              ) : messagesError ? (
                <div className="flex h-full flex-col items-center justify-center gap-2">
                  <p className="text-sm font-bold text-danger">{messagesError}</p>
                  <button
                    onClick={() => fetchMessages(selectedRoom.id)}
                    className="rounded-xl bg-primary px-4 py-2 text-2xs font-bold uppercase tracking-wide text-primary-foreground transition hover:bg-primary-hover"
                  >
                    Retry
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                  <MdChatBubbleOutline size={56} className="opacity-40" />
                  <p className="text-sm font-semibold">No messages yet</p>
                  <p className="text-xs text-muted-foreground">Say hello to start the conversation.</p>
                </div>
              ) : (
                (() => {
                  let lastDate = null;
                  return messages.map((msg) => {
                    const msgTime = msg.timestamp || msg.created_at;
                    const msgDateStr = new Date(msgTime).toDateString();
                    const showHeader = msgDateStr !== lastDate;
                    lastDate = msgDateStr;

                    const isMine = msg.is_mine;
                    return (
                      <div key={msg.id} className="flex flex-col">
                        {showHeader && (
                          <div className="my-4 flex justify-center">
                            <span className="rounded-full border border-border bg-card px-3 py-1 text-2xs font-bold uppercase tracking-wide text-muted-foreground shadow-sm">
                              {formatMessageDate(msgTime)}
                            </span>
                          </div>
                        )}

                        <div className={`mb-1.5 flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[70%] ${isMine
                              ? "rounded-br-md bg-primary text-primary-foreground"
                              : "rounded-bl-md border border-border bg-card text-foreground"
                              }`}
                          >
                            {msg.file ? (
                              <a href={msg.file} target="_blank" rel="noreferrer" className="font-semibold underline">
                                📎 Attachment
                              </a>
                            ) : (
                              <span>{msg.text}</span>
                            )}
                            <div className={`mt-0.5 flex items-center justify-end ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                              <span className="text-3xs font-medium">
                                {new Date(msgTime).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* TYPING INDICATOR */}
            {typingUser && (
              <div className="flex items-center gap-2 bg-muted/30 px-5 pb-1 text-xs font-medium text-muted-foreground">
                <span>{typingUser} is typing</span>
                <TypingDots />
              </div>
            )}

            {/* INPUT AREA */}
            <div className="border-t border-border bg-card p-3 md:p-4">
              {!isReady && selectedRoom && (
                <div className="mb-2 text-center text-2xs font-bold uppercase tracking-wide text-amber-500">
                  Reconnecting...
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center rounded-2xl border border-input bg-muted/40 px-4 py-2.5 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40">
                  <input
                    className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !isReady}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all ${newMessage.trim() && isReady
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary-hover active:scale-95"
                    : "cursor-not-allowed bg-muted text-muted-foreground"
                    }`}
                  aria-label="Send message"
                >
                  <MdSend size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 animate-fadeIn">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary-soft text-primary">
              <MdChatBubbleOutline size={48} />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Your Messages</h2>
            <p className="text-sm text-muted-foreground">Select a conversation to start chatting.</p>
          </div>
        )}
      </main>
    </div>
  );
}
