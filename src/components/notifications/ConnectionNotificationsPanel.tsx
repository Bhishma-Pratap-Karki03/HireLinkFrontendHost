import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { connectSocket, getSocket } from "../../lib/socketClient";
import defaultAvatar from "../../images/Register Page Images/Default Profile.webp";
import deleteIcon from "../../images/Candidate Profile Page Images/trash.png";
import prevIcon from "../../images/Employers Page Images/Prev Icon.svg";
import nextIcon from "../../images/Employers Page Images/Next Icon.svg";

type NotificationItem = {
  id: string;
  type:
    | "connection_request_received"
    | "connection_request_accepted"
    | "application_status_updated"
    | "project_review_received"
    | "company_review_received";
  isRead: boolean;
  message: string;
  createdAt: string;
  updatedAt: string;
  targetPath: string;
  actor?: {
    id: string;
    fullName: string;
    role: string;
    profilePicture?: string;
  };
};

type ConnectionNotificationsPanelProps = {
  role: "candidate" | "recruiter";
  searchQuery?: string;
};

const API_BASE_URL =
  String(import.meta.env.VITE_API_BASE_URL || "").trim() ||
  "http://localhost:5000/api";

const getBackendBaseUrl = () => {
  const configured = String(import.meta.env.VITE_BACKEND_URL || "").trim();
  if (configured) return configured;
  return API_BASE_URL.replace(/\/api\/?$/, "");
};

const resolveAvatar = (value?: string) => {
  if (!value) return defaultAvatar;
  if (value.startsWith("http")) return value;
  return `${getBackendBaseUrl()}${value}`;
};

const formatApplicationNotificationMessage = (item: NotificationItem) => {
  const raw = (item.message || "").trim();
  if (item.type !== "application_status_updated" || !raw) return raw;

  const companyName = item.actor?.fullName?.trim() || "the company";
  const withCompanyMatch = raw.match(
    /^Your application for "(.+?)" at (.+?) was updated to (.+)\.$/i
  );
  if (withCompanyMatch) {
    return `Your application for "${withCompanyMatch[1]}" at ${companyName} was updated to ${withCompanyMatch[3]}.`;
  }

  const withoutCompanyMatch = raw.match(
    /^Your application for "(.+?)" was updated to (.+)\.$/i
  );
  if (withoutCompanyMatch) {
    return `Your application for "${withoutCompanyMatch[1]}" at ${companyName} was updated to ${withoutCompanyMatch[2]}.`;
  }
  return `${raw} (${companyName})`;
};

const ConnectionNotificationsPanel = ({
  role,
  searchQuery = "",
}: ConnectionNotificationsPanelProps) => {
  const ITEMS_PER_PAGE = 20;
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchNotifications = async (silent = false, page = currentPage) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      if (!silent) {
        setLoading(true);
        setError("");
      }
      const params = new URLSearchParams();
      params.set("limit", String(ITEMS_PER_PAGE));
      params.set("page", String(page));
      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      }
      if (appliedFromDate) {
        params.set("from", appliedFromDate);
      }
      if (appliedToDate) {
        params.set("to", appliedToDate);
      }

      const res = await fetch(
        `${API_BASE_URL}/connections/notifications?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load notifications");
      }
      setItems(data?.notifications || []);
      setCurrentPage(Number(data?.pagination?.page || page || 1));
      setTotalPages(Number(data?.pagination?.totalPages || 1));
      setTotalItems(Number(data?.pagination?.total || 0));
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

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, searchQuery, appliedFromDate, appliedToDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, appliedFromDate, appliedToDate]);

  useEffect(() => {
    const token = localStorage.getItem("authToken") || "";
    if (!token) return;

    const socket = connectSocket(token);
    if (!socket) return;

    const onNotification = () => {
      fetchNotifications(true, currentPage);
    };

    const onConnect = () => fetchNotifications(true, currentPage);

    socket.on("notification:connection:new", onNotification);
    socket.on("connect", onConnect);

    return () => {
      const current = getSocket();
      current?.off("notification:connection:new", onNotification);
      current?.off("connect", onConnect);
    };
  }, [currentPage]);

  const handleClick = async (item: NotificationItem) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/connections/notifications/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationId: item.id }),
      });
    } catch {
      // continue navigation even if mark-read fails
    }

    setItems((prev) =>
      prev.map((entry) =>
        entry.id === item.id ? { ...entry, isRead: true } : entry
      )
    );

    if (item.type === "connection_request_received") {
      navigate(
        role === "recruiter"
          ? "/recruiter/friend-requests"
          : "/candidate/friend-requests"
      );
      return;
    }

    navigate(item.targetPath || "/home");
  };

  const handleDelete = async (
    event: MouseEvent<HTMLButtonElement>,
    item: NotificationItem
  ) => {
    event.stopPropagation();

    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/connections/notifications/delete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ notificationId: item.id }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete notification");
      }

      setItems((prev) => prev.filter((entry) => entry.id !== item.id));

      if (items.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        fetchNotifications(true, currentPage);
      }

      window.dispatchEvent(
        new CustomEvent("connectionNotificationDeleted", {
          detail: {
            notificationId: item.id,
            unreadCount: Number(data?.unreadCount || 0),
          },
        })
      );
    } catch {
      // ignore delete errors for now
    }
  };

  const applyDateFilter = () => {
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setCurrentPage(1);
  };

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
    setAppliedFromDate("");
    setAppliedToDate("");
    setCurrentPage(1);
  };

  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const [notificationsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/connections/notifications/read-all`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${API_BASE_URL}/messages/read-all`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ]);
      const data = await notificationsRes.json();
      if (!notificationsRes.ok) {
        throw new Error(data?.message || "Failed to mark notifications as read");
      }

      setItems((prev) => prev.map((entry) => ({ ...entry, isRead: true })));

      window.dispatchEvent(
        new CustomEvent("connectionNotificationsReadAll", {
          detail: {
            unreadCount: Number(data?.unreadCount || 0),
          },
        })
      );
    } catch {
      // ignore action error to avoid blocking page usage
    }
  };

  const visiblePages = useMemo(
    () =>
      Array.from({ length: Math.min(totalPages, 7) }, (_, index) => index + 1),
    [totalPages]
  );

  const showingStart = items.length
    ? (currentPage - 1) * ITEMS_PER_PAGE + 1
    : 0;
  const showingEnd = (currentPage - 1) * ITEMS_PER_PAGE + items.length;

  return (
    <section className="connection-notification-page">
      <header className="connection-notification-header">
        <div>
          <h1>Notifications</h1>
          <p>Connection, application, and review notification history.</p>
        </div>
        <div className="connection-notification-filter">
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            aria-label="From date"
          />
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            aria-label="To date"
          />
          <button type="button" onClick={applyDateFilter}>
            Apply
          </button>
          <button type="button" onClick={clearDateFilter}>
            Clear
          </button>
          <div className="connection-notification-mark-read-row">
            <button
              type="button"
              className="connection-notification-mark-read-btn"
              onClick={handleMarkAllAsRead}
              disabled={!items.some((item) => !item.isRead)}
            >
              Mark all as read
            </button>
          </div>
        </div>
      </header>

      {loading && <div className="connection-notification-state">Loading</div>}
      {!loading && error && (
        <div className="connection-notification-state error">{error}</div>
      )}
      {!loading && !error && items.length === 0 && (
        <div className="connection-notification-state">No notifications yet.</div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="connection-notification-list">
            {items.map((item) => (
              <article
                key={item.id}
                className={`connection-notification-card ${
                  item.isRead ? "read" : "unread"
                }`}
                role="button"
                tabIndex={0}
                onClick={() => handleClick(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleClick(item);
                  }
                }}
              >
                <img
                  src={resolveAvatar(item.actor?.profilePicture)}
                  alt={item.actor?.fullName || "User"}
                  className={`connection-notification-avatar ${
                    item.actor?.role === "recruiter" ? "recruiter-logo" : ""
                  }`}
                  onError={(e) => {
                    e.currentTarget.src = defaultAvatar;
                  }}
                />
                <div className="connection-notification-content">
                  <div className="connection-notification-top">
                    <div className="connection-notification-meta">
                      <span
                        className={`connection-notification-badge ${
                          item.type === "application_status_updated"
                            ? "application"
                            : item.type === "project_review_received" ||
                                item.type === "company_review_received"
                              ? "review"
                            : item.type === "connection_request_accepted"
                            ? "accepted"
                            : "new-request"
                        }`}
                      >
                        {item.type === "application_status_updated"
                          ? "Application"
                          : item.type === "project_review_received" ||
                              item.type === "company_review_received"
                            ? "Review"
                          : item.type === "connection_request_accepted"
                          ? "Accepted"
                          : "New Request"}
                      </span>
                      <span className="connection-notification-time">
                        {new Date(item.updatedAt || item.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p>{formatApplicationNotificationMessage(item)}</p>
                </div>
                <button
                  type="button"
                  className="connection-notification-delete-btn"
                  onClick={(event) => handleDelete(event, item)}
                  aria-label="Delete notification"
                >
                  <img src={deleteIcon} alt="Delete" />
                </button>
              </article>
            ))}
          </div>

          <div className="connection-notification-pagination">
            <div className="connection-notification-page-controls">
              <button
                type="button"
                className="connection-notification-page-nav"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage <= 1}
              >
                <img src={prevIcon} alt="Previous" />
              </button>
              <div className="connection-notification-page-numbers">
                {visiblePages.map((pageNumber) => (
                  <span
                    key={pageNumber}
                    className={`connection-notification-page-num ${
                      pageNumber === currentPage
                        ? "connection-notification-active"
                        : ""
                    }`}
                    onClick={() => setCurrentPage(pageNumber)}
                    role="button"
                  >
                    {pageNumber}
                  </span>
                ))}
                {totalPages > 7 && (
                  <span className="connection-notification-page-num connection-notification-dots">
                    ...
                  </span>
                )}
              </div>
              <button
                type="button"
                className="connection-notification-page-nav"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage >= totalPages}
              >
                <img src={nextIcon} alt="Next" />
              </button>
            </div>
            <div className="connection-notification-page-info">
              Showing {showingStart} to {showingEnd} of {totalItems}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default ConnectionNotificationsPanel;










