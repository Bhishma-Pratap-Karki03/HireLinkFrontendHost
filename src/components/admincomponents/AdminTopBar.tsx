import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/AdminTopBar.css";

// Import images
import jobsIcon from "../../images/Admin Profile Page Images/4_65.svg";
import homeIcon from "../../images/Admin Profile Page Images/4_70.svg";
import notificationsIcon from "../../images/Admin Profile Page Images/4_75.svg";

interface AdminTopBarProps {
  onSearch?: (query: string) => void;
}

type AdminContactNotification = {
  _id: string;
  name: string;
  email: string;
  subject: string;
  createdAt: string;
  isRead?: boolean;
};
const NOTIFICATION_DROPDOWN_LIMIT = 20;

const AdminTopBar: React.FC<AdminTopBarProps> = ({
  onSearch: _onSearch = () => {},
}) => {
  const VIEWED_STORAGE_KEY = "adminViewedContactNotificationIds";
  const navigate = useNavigate();
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const toastTimersRef = useRef<Record<string, number>>({});
  const knownMessageIdsRef = useRef<Set<string>>(new Set());
  const viewedMessageIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedOnceRef = useRef(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState<
    AdminContactNotification[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notificationToasts, setNotificationToasts] = useState<
    AdminContactNotification[]
  >([]);
  const [dismissingToastIds, setDismissingToastIds] = useState<string[]>([]);

  const fetchContactNotifications = async (silent = false) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setNotificationItems([]);
      return;
    }
    try {
      if (!silent) {
        setLoading(true);
        setError("");
      }
      const response = await fetch(
        "http://localhost:5000/api/contact/admin/messages?status=all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to load notifications");
      }
      const incoming = (data?.messages || []) as AdminContactNotification[];
      const topNotifications = incoming.slice(0, NOTIFICATION_DROPDOWN_LIMIT);

      // Detect newly received contact messages (skip toast on first load).
      const currentIds = new Set(topNotifications.map((item) => item._id));
      if (hasLoadedOnceRef.current) {
        const newItems = topNotifications.filter(
          (item) =>
            !knownMessageIdsRef.current.has(item._id) && !Boolean(item.isRead),
        );
        if (newItems.length > 0) {
          setNotificationToasts((prev) => {
            const merged = [
              ...newItems,
              ...prev.filter(
                (toast) => !newItems.some((newItem) => newItem._id === toast._id),
              ),
            ];
            return merged.slice(0, 3);
          });
        }
      }

      knownMessageIdsRef.current = currentIds;
      hasLoadedOnceRef.current = true;
      setNotificationItems(topNotifications);
      setUnreadCount(
        incoming.filter(
          (item) =>
            !Boolean(item.isRead) &&
            !viewedMessageIdsRef.current.has(item._id),
        ).length,
      );
    } catch (err: any) {
      if (!silent) {
        setError(err?.message || "Failed to load notifications");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const dismissToast = (messageId: string) => {
    setDismissingToastIds((prev) =>
      prev.includes(messageId) ? prev : [...prev, messageId],
    );
    window.setTimeout(() => {
      setNotificationToasts((prev) => prev.filter((item) => item._id !== messageId));
      setDismissingToastIds((prev) => prev.filter((id) => id !== messageId));
      const activeTimer = toastTimersRef.current[messageId];
      if (activeTimer) {
        window.clearTimeout(activeTimer);
        delete toastTimersRef.current[messageId];
      }
    }, 280);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(VIEWED_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          viewedMessageIdsRef.current = new Set(
            parsed.filter((value) => typeof value === "string"),
          );
        }
      }
    } catch {
      // no-op
    }

    fetchContactNotifications(true);
    const intervalId = window.setInterval(
      () => fetchContactNotifications(true),
      5000,
    );
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    notificationToasts.forEach((toast) => {
      if (toastTimersRef.current[toast._id]) return;
      toastTimersRef.current[toast._id] = window.setTimeout(() => {
        dismissToast(toast._id);
      }, 20000);
    });

    Object.keys(toastTimersRef.current).forEach((id) => {
      const stillExists = notificationToasts.some((item) => item._id === id);
      if (!stillExists) {
        window.clearTimeout(toastTimersRef.current[id]);
        delete toastTimersRef.current[id];
      }
    });
  }, [notificationToasts]);

  useEffect(() => {
    return () => {
      Object.keys(toastTimersRef.current).forEach((id) => {
        window.clearTimeout(toastTimersRef.current[id]);
      });
      toastTimersRef.current = {};
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const toggleNotificationMenu = () => {
    setIsNotificationOpen((prev) => {
      const next = !prev;
      if (next) fetchContactNotifications();
      return next;
    });
  };

  const handleNotificationClick = async (item: AdminContactNotification) => {
    if (!item.isRead && !viewedMessageIdsRef.current.has(item._id)) {
      viewedMessageIdsRef.current.add(item._id);
      try {
        localStorage.setItem(
          VIEWED_STORAGE_KEY,
          JSON.stringify(Array.from(viewedMessageIdsRef.current)),
        );
      } catch {
        // no-op
      }
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    }
    void item;
    setIsNotificationOpen(false);
    navigate("/admin/contact-messages");
  };

  const handleMarkAllNotificationsRead = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const unreadItems = notificationItems.filter(
      (item) => !item.isRead && !viewedMessageIdsRef.current.has(item._id),
    );

    try {
      await Promise.all(
        unreadItems.map((item) =>
          fetch(
            `http://localhost:5000/api/contact/admin/messages/${item._id}/read`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            },
          ),
        ),
      );
    } catch {
      // best-effort
    }

    setNotificationItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
  };

  const handleViewMoreNotifications = () => {
    setIsNotificationOpen(false);
    navigate("/admin/contact-messages");
  };

  return (
    <>
    <header className="admin-top-bar">
      <div className="admin-header-actions">
        <button className="admin-action-btn" onClick={() => navigate("/admin/jobs")}>
          <img src={jobsIcon} alt="Jobs" />
        </button>
        <button className="admin-action-btn" onClick={() => navigate("/home")}>
          <img src={homeIcon} alt="Home" />
        </button>
        <div className="admin-top-notification-wrapper" ref={notificationRef}>
          <button className="admin-action-btn" onClick={toggleNotificationMenu}>
            <img src={notificationsIcon} alt="Notifications" />
            {unreadCount > 0 && (
              <span className="admin-top-notification-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          {isNotificationOpen && (
            <div className="admin-top-notification-dropdown">
              <div className="admin-top-notification-header">
                <span>Recent Notifications</span>
                <button
                  type="button"
                  className="admin-top-notification-mark-read-btn"
                  onClick={handleMarkAllNotificationsRead}
                  disabled={unreadCount === 0}
                >
                  Mark all as read
                </button>
              </div>
              {loading && (
                <div className="admin-top-notification-state">Loading...</div>
              )}
              {!loading && error && (
                <div className="admin-top-notification-state error">{error}</div>
              )}
              {!loading && !error && notificationItems.length === 0 && (
                <div className="admin-top-notification-state">
                  No recent notifications
                </div>
              )}
              {!loading && !error && notificationItems.length > 0 && (
                <ul className="admin-top-notification-list">
                  {notificationItems.map((item) => (
                    <li
                      key={item._id}
                      className={`admin-top-notification-item ${
                        item.isRead || viewedMessageIdsRef.current.has(item._id)
                          ? "read"
                          : "unread"
                      }`}
                      onClick={() => handleNotificationClick(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleNotificationClick(item);
                        }
                      }}
                    >
                      <div className="admin-top-notification-content">
                        <div className="admin-top-notification-top">
                          <span className="admin-top-notification-status">
                            Contact Request
                          </span>
                          <span className="admin-top-notification-time">
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="admin-top-notification-message">
                          {item.name} sent a contact message.
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="admin-top-notification-footer">
                <button
                  type="button"
                  className="admin-top-notification-view-more-btn"
                  onClick={handleViewMoreNotifications}
                >
                  View More Notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
    {notificationToasts.length > 0 && (
      <div className="admin-top-toast-stack">
        {notificationToasts.map((item) => (
          <div
            key={item._id}
            className={`admin-top-toast ${
              dismissingToastIds.includes(item._id) ? "is-dismissing" : ""
            }`}
            role="button"
            tabIndex={0}
            onClick={() => handleNotificationClick(item)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleNotificationClick(item);
              }
            }}
          >
            <button
              type="button"
              className="admin-top-toast-close"
              onClick={(event) => {
                event.stopPropagation();
                dismissToast(item._id);
              }}
              aria-label="Dismiss notification"
            >
              x
            </button>
            <div className="admin-top-toast-head">
              <span className="admin-top-notification-status">
                Contact Request
              </span>
            </div>
            <p className="admin-top-toast-message">
              {item.name} sent a contact message.
            </p>
          </div>
        ))}
      </div>
    )}
    </>
  );
};

export default AdminTopBar;
