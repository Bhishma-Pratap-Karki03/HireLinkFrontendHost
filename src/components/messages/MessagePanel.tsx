import { useEffect, useMemo, useState } from "react";
import defaultAvatar from "../../images/Register Page Images/Default Profile.webp";
import sendIcon from "../../images/Recruiter Job Post Page Images/sendIcon.png";
import defaultMessageIllustration from "../../images/Recruiter Job Post Page Images/default-message-screen-icon.png";
import searchIcon from "../../images/Recruiter Profile Page Images/search icon.svg";
import { connectSocket, getSocket } from "../../lib/socketClient";

type MessageUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  profilePicture?: string;
  currentJobTitle?: string;
};

type ConversationItem = {
  user: MessageUser;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    receiverId: string;
  } | null;
  updatedAt: string;
  unreadCount?: number;
};

type MessageItem = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
};

type MessagePanelProps = {
  selectedUserIdFromQuery?: string;
  onSelectUser?: (userId: string) => void;
};

const resolveAvatar = (value?: string) => {
  if (!value) return defaultAvatar;
  if (value.startsWith("http")) return value;
  return `http://localhost:5000${value}`;
};

const formatTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDateLine = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
};

const MessagePanel = ({
  selectedUserIdFromQuery = "",
  onSelectUser,
}: MessagePanelProps) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeUserId, setActiveUserId] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeUser, setActiveUser] = useState<MessageUser | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("authToken") || "";
  const userDataStr = localStorage.getItem("userData");
  const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
  const currentUserId =
    currentUser?.id || currentUser?._id || currentUser?.userId || "";

  const filteredConversations = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((item) =>
      item.user.fullName.toLowerCase().includes(query),
    );
  }, [conversations, conversationSearch]);

  const fetchConversations = async (silent = false) => {
    if (!token) return;
    try {
      if (!silent) {
        setLoadingConversations(true);
        setError("");
      }
      const res = await fetch(
        "http://localhost:5000/api/messages/conversations",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load conversations");
      }
      const list = (data.conversations || []) as ConversationItem[];
      setConversations(list);

      const nextUserId = selectedUserIdFromQuery || activeUserId || "";
      if (nextUserId) {
        setActiveUserId(nextUserId);
      } else {
        setMessages([]);
        setActiveUser(null);
      }
    } catch (err: any) {
      if (!silent) {
        setError(err?.message || "Failed to load conversations");
      }
    } finally {
      if (!silent) {
        setLoadingConversations(false);
      }
    }
  };

  const fetchConversationMessages = async (
    targetUserId: string,
    silent = false,
  ) => {
    if (!token || !targetUserId) return;
    try {
      if (!silent) {
        setLoadingMessages(true);
        setError("");
      }
      const res = await fetch(
        `http://localhost:5000/api/messages/conversation/${targetUserId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load chat");
      }

      const incomingUser = data.user as MessageUser;
      const incomingMessages = (data.messages || []) as MessageItem[];

      setActiveUser(incomingUser);
      setMessages(incomingMessages);
      setConversations((prev) => {
        const exists = prev.some((item) => item.user.id === incomingUser.id);
        if (exists) return prev;
        return [
          {
            user: incomingUser,
            lastMessage: null,
            updatedAt: new Date().toISOString(),
          },
          ...prev,
        ];
      });
    } catch (err: any) {
      if (!silent) {
        setError(err?.message || "Failed to load chat");
        setMessages([]);
        setActiveUser(null);
      }
    } finally {
      if (!silent) {
        setLoadingMessages(false);
      }
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!selectedUserIdFromQuery) return;
    setActiveUserId(selectedUserIdFromQuery);
  }, [selectedUserIdFromQuery]);

  useEffect(() => {
    if (!activeUserId) return;
    fetchConversationMessages(activeUserId, false);
    if (onSelectUser) onSelectUser(activeUserId);
  }, [activeUserId]);

  useEffect(() => {
    if (!token || !currentUserId) return;

    const socket = connectSocket(token);
    if (!socket) return;

    const handleMessageNew = (payload: any) => {
      if (!payload?.id) return;

      const senderId = String(payload.senderId || "");
      const receiverId = String(payload.receiverId || "");
      const isMine = senderId === currentUserId;
      const otherUserId = isMine ? receiverId : senderId;
      const otherUser = isMine ? payload.receiver : payload.sender;

      setConversations((prev) => {
        const idx = prev.findIndex((item) => item.user.id === otherUserId);
        const updatedItem = {
          user: {
            id: otherUserId,
            fullName: otherUser?.fullName || "User",
            email: otherUser?.email || "",
            role: otherUser?.role || "",
            profilePicture: otherUser?.profilePicture || "",
            currentJobTitle: otherUser?.currentJobTitle || "",
          },
          lastMessage: {
            id: payload.id,
            content: payload.content,
            createdAt: payload.createdAt,
            senderId,
            receiverId,
          },
          updatedAt: payload.createdAt,
          unreadCount:
            !isMine && otherUserId !== activeUserId
              ? ((idx >= 0 ? prev[idx].unreadCount || 0 : 0) + 1)
              : 0,
        };

        let next = [...prev];
        if (idx >= 0) {
          next[idx] = updatedItem;
        } else {
          next.unshift(updatedItem);
        }

        return next.sort((a, b) => {
          const aDate = new Date(a.updatedAt).getTime();
          const bDate = new Date(b.updatedAt).getTime();
          return bDate - aDate;
        });
      });

      if (otherUserId === activeUserId) {
        setMessages((prev) => {
          if (prev.some((item) => item.id === payload.id)) return prev;
          return [
            ...prev,
            {
              id: payload.id,
              senderId,
              receiverId,
              content: payload.content,
              createdAt: payload.createdAt,
              readAt: payload.readAt || null,
            },
          ];
        });
      }
    };

    const handleMessageRead = (payload: any) => {
      const byUserId = String(payload?.byUserId || "");
      if (!byUserId || byUserId !== activeUserId) return;
      setMessages((prev) =>
        prev.map((item) =>
          item.senderId === currentUserId
            ? { ...item, readAt: payload?.readAt || new Date().toISOString() }
            : item,
        ),
      );
    };

    socket.on("message:new", handleMessageNew);
    socket.on("message:read", handleMessageRead);

    return () => {
      const connectedSocket = getSocket();
      connectedSocket?.off("message:new", handleMessageNew);
      connectedSocket?.off("message:read", handleMessageRead);
    };
  }, [token, currentUserId, activeUserId]);


  const handleSelectConversation = (userId: string) => {
    setActiveUserId(userId);
    setConversations((prev) =>
      prev.map((item) =>
        item.user.id === userId ? { ...item, unreadCount: 0 } : item,
      ),
    );
  };

  const handleSendMessage = async () => {
    const content = draft.trim();
    if (!content || !activeUserId || !token || sending) return;

    try {
      setSending(true);
      setError("");
      const res = await fetch("http://localhost:5000/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: activeUserId,
          content,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to send message");
      }

      const createdMessage = data.message as MessageItem;
      setDraft("");
      setMessages((prev) => {
        if (prev.some((item) => item.id === createdMessage.id)) return prev;
        return [...prev, createdMessage];
      });

      setConversations((prev) => {
        const updated = prev.map((item) => {
          if (item.user.id !== activeUserId) return item;
          if (item.lastMessage?.id === createdMessage.id) return item;
          return {
            ...item,
            lastMessage: {
              id: createdMessage.id,
              content: createdMessage.content,
              createdAt: createdMessage.createdAt,
              senderId: createdMessage.senderId,
              receiverId: createdMessage.receiverId,
            },
            updatedAt: createdMessage.createdAt,
          };
        });
        return [...updated].sort((a, b) => {
          const aDate = new Date(a.updatedAt).getTime();
          const bDate = new Date(b.updatedAt).getTime();
          return bDate - aDate;
        });
      });
    } catch (err: any) {
      setError(err?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDraftKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartChat = () => {
    if (activeUserId) return;
    if (conversations.length === 0) return;
    handleSelectConversation(conversations[0].user.id);
  };

  return (
    <section className="message-page-shell">
      <div className="message-page-panel">
        <aside className="message-page-left">
          <div className="message-page-left-header">
            <h1>Messages</h1>
            <p>Chat with candidates and recruiters.</p>
            <div className="message-page-conversation-search">
              <img src={searchIcon} alt="Search" />
              <input
                type="text"
                placeholder="Search user..."
                value={conversationSearch}
                onChange={(e) => setConversationSearch(e.target.value)}
              />
            </div>
          </div>
          {loadingConversations && (
            <div className="message-page-state">Loading conversations...</div>
          )}
          {!loadingConversations && conversations.length === 0 && (
            <div className="message-page-state">
              No conversations yet. Open a profile and click Message.
            </div>
          )}
          {!loadingConversations &&
            conversations.length > 0 &&
            filteredConversations.length === 0 && (
              <div className="message-page-state">No users match your search.</div>
            )}
          <div className="message-page-conversation-list">
            {filteredConversations.map((item) => (
              <button
                key={item.user.id}
                type="button"
                className={`message-page-conversation-item ${
                  item.user.id === activeUserId ? "active" : ""
                } ${item.unreadCount ? "unread" : ""}`}
                onClick={() => handleSelectConversation(item.user.id)}
              >
                <img
                  src={resolveAvatar(item.user.profilePicture)}
                  alt={item.user.fullName}
                  className={
                    item.user.role === "recruiter"
                      ? "message-page-avatar message-page-avatar-logo"
                      : "message-page-avatar"
                  }
                />
                <div className="message-page-conversation-text">
                  <div className="message-page-conversation-top">
                    <strong>{item.user.fullName}</strong>
                    <span>{formatDateLine(item.updatedAt)}</span>
                  </div>
                  <p>{item.lastMessage?.content || "Start conversation"}</p>
                </div>
                {item.unreadCount ? (
                  <span className="message-page-unread-badge">
                    {item.unreadCount > 9 ? "9+" : item.unreadCount}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </aside>

        <div className="message-page-right">
          {!activeUser && !loadingMessages && (
            <div className="message-page-empty-state">
              <div className="message-page-empty-icon-wrap">
                <img
                  src={defaultMessageIllustration}
                  alt="Message"
                  className="message-page-empty-icon"
                />
              </div>
              <h3>Your messages</h3>
              <p>Send a message to start a chat.</p>
              <button
                type="button"
                className="message-page-empty-cta"
                onClick={handleStartChat}
                disabled={conversations.length === 0}
              >
                Send message
              </button>
            </div>
          )}

          {activeUser && (
            <>
              <header className="message-page-chat-header">
                <div className="message-page-chat-user">
                  <img
                    src={resolveAvatar(activeUser.profilePicture)}
                    alt={activeUser.fullName}
                    className={
                      activeUser.role === "recruiter"
                        ? "message-page-avatar message-page-avatar-logo"
                        : "message-page-avatar"
                    }
                  />
                  <div>
                    <h3>{activeUser.fullName}</h3>
                  </div>
                </div>
              </header>

              <div className="message-page-chat-body">
                {loadingMessages && (
                  <div className="message-page-state">Loading messages...</div>
                )}
                {!loadingMessages && messages.length === 0 && (
                  <div className="message-page-state">
                    No messages yet. Send the first message.
                  </div>
                )}
                {!loadingMessages &&
                  messages.map((item) => {
                    const isMine = item.senderId === currentUserId;
                    return (
                      <div
                        key={item.id}
                        className={`message-page-bubble-row ${
                          isMine ? "mine" : "theirs"
                        }`}
                      >
                        <div className="message-page-bubble">
                          <p>{item.content}</p>
                          <span>{formatTime(item.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <footer className="message-page-chat-input">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleDraftKeyDown}
                  placeholder="Write a message..."
                  rows={2}
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={sending || !draft.trim()}
                  className="message-page-send-btn"
                >
                  <img src={sendIcon} alt="Send message" />
                </button>
              </footer>
            </>
          )}
        </div>
      </div>
      {error && <div className="message-page-error">{error}</div>}
    </section>
  );
};

export default MessagePanel;
