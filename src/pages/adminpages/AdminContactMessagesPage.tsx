import { FormEvent, useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admincomponents/AdminSidebar";
import AdminTopBar from "../../components/admincomponents/AdminTopBar";
import PortalFooter from "../../components/PortalFooter";
import "../../styles/AdminContactMessagesPage.css";
import prevIcon from "../../images/Employers Page Images/Prev Icon.svg";
import nextIcon from "../../images/Employers Page Images/Next Icon.svg";
import trashIcon from "../../images/Candidate Profile Page Images/trash.png";
import eyeIcon from "../../images/Candidate Profile Page Images/eye-icon.svg";
import statsTotalUserIcon from "../../images/Admin Profile Page Images/messagetotal.jpg";
import unreadMessageIcon from "../../images/Candidate Profile Page Images/unread-message-icon.png";
import readmessageIcon from "../../images/Admin Profile Page Images/ReadMessage.png";

type ContactMessageItem = {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead?: boolean;
  createdAt: string;
  readAt?: string | null;
};

const MESSAGES_PER_PAGE = 20;

const AdminContactMessagesPage = () => {
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "read" | "unread">(
    "all",
  );
  const [actingMessageId, setActingMessageId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMessage, setSelectedMessage] =
    useState<ContactMessageItem | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const token = localStorage.getItem("authToken") || "";

  const fetchMessages = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        search: search.trim(),
        status: statusFilter,
      });
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/contact/admin/messages?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to load contact messages.");
      }
      setMessages(data.messages || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load contact messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [statusFilter]);

  const onSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    setCurrentPage(1);
    fetchMessages();
  };

  const markAsRead = async (messageId: string) => {
    if (!token) return;
    try {
      setActingMessageId(messageId);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/contact/admin/messages/${messageId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to mark message as read.");
      }

      setMessages((prev) =>
        prev.map((item) =>
          item._id === messageId
            ? {
                ...item,
                isRead: true,
                readAt: data?.data?.readAt || new Date().toISOString(),
              }
            : item,
        ),
      );
    } catch (err: any) {
      setError(err?.message || "Failed to mark message as read.");
    } finally {
      setActingMessageId("");
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!token) return;

    try {
      setActingMessageId(messageId);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/contact/admin/messages/${messageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete message.");
      }

      setMessages((prev) => prev.filter((item) => item._id !== messageId));
      setToastType("success");
      setToastMessage("Contact message deleted.");
    } catch (err: any) {
      setError(err?.message || "Failed to delete message.");
      setToastType("error");
      setToastMessage(err?.message || "Failed to delete message.");
    } finally {
      setActingMessageId("");
    }
  };

  const stats = useMemo(() => {
    const total = messages.length;
    const unread = messages.filter((item) => !item.isRead).length;
    const read = total - unread;
    return { total, unread, read };
  }, [messages]);

  const totalPages = Math.max(
    1,
    Math.ceil(messages.length / MESSAGES_PER_PAGE),
  );
  const paginatedMessages = messages.slice(
    (currentPage - 1) * MESSAGES_PER_PAGE,
    currentPage * MESSAGES_PER_PAGE,
  );
  const showingStart =
    messages.length === 0 ? 0 : (currentPage - 1) * MESSAGES_PER_PAGE + 1;
  const showingEnd =
    messages.length === 0
      ? 0
      : Math.min(currentPage * MESSAGES_PER_PAGE, messages.length);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeoutId = window.setTimeout(() => {
      setToastMessage("");
    }, 2800);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const formatDateTime = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString();
  };

  return (
    <div className="admin-assessments-layout">
      <AdminSidebar />
      <main className="admin-contact-main-area">
        <div className="admin-contact-topbar-wrapper">
          <AdminTopBar />
        </div>

        <div className="admin-contact-scrollable-content">
          <section className="admin-contact-shell">
            <header className="admin-contact-header">
              <h1>Contact Messages</h1>
              <p>Review contact-us submissions from platform visitors.</p>
            </header>

            <div className="admin-contact-stats">
              <article className="admin-contact-stat-card">
                <div>
                  <h3>{stats.total}</h3>
                  <span>Total Messages</span>
                </div>
                <img src={statsTotalUserIcon} alt="Total messages" />
              </article>
              <article className="admin-contact-stat-card">
                <div>
                  <h3>{stats.unread}</h3>
                  <span>Unread</span>
                </div>
                <img src={unreadMessageIcon} alt="Unread messages" />
              </article>
              <article className="admin-contact-stat-card">
                <div>
                  <h3>{stats.read}</h3>
                  <span>Read</span>
                </div>
                <img src={readmessageIcon} alt="Read messages" />
              </article>
            </div>

            <form className="admin-contact-filters" onSubmit={onSearchSubmit}>
              <input
                type="text"
                placeholder="Search by name, email, subject, or message"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "all" | "read" | "unread",
                  )
                }
              >
                <option value="all">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
              <button type="submit">Search</button>
            </form>

            <section className="admin-contact-table-wrap">
              <header className="admin-contact-table-head">
                <span>Sender</span>
                <span>Received</span>
                <span>Status</span>
                <span>Actions</span>
              </header>

              {loading && (
                <div className="admin-contact-state">Loading</div>
              )}
              {!loading && error && (
                <div className="admin-contact-state error">{error}</div>
              )}
              {!loading && !error && messages.length === 0 && (
                <div className="admin-contact-state">
                  No contact messages found.
                </div>
              )}

              {!loading &&
                !error &&
                paginatedMessages.map((item) => (
                  <article
                    className={`admin-contact-row ${
                      item.isRead ? "read" : "unread"
                    }`}
                    key={item._id}
                  >
                    <div className="admin-contact-sender-cell">
                      <h4>{item.name}</h4>
                      <p>{item.email}</p>
                    </div>
                    <div>{formatDateTime(item.createdAt)}</div>
                    <div>
                      <span
                        className={`admin-contact-status-badge ${
                          item.isRead ? "read" : "unread"
                        }`}
                      >
                        {item.isRead ? "Read" : "Unread"}
                      </span>
                    </div>
                    <div className="admin-contact-actions">
                      <button
                        type="button"
                        className="admin-contact-view-btn"
                        onClick={() => setSelectedMessage(item)}
                        disabled={actingMessageId === item._id}
                        title="View message details"
                      >
                        <img src={eyeIcon} alt="View" />
                      </button>
                      {!item.isRead && (
                        <button
                          type="button"
                          className="admin-contact-mark-read"
                          onClick={() => markAsRead(item._id)}
                          disabled={actingMessageId === item._id}
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        type="button"
                        className="admin-contact-delete-btn"
                        onClick={() => deleteMessage(item._id)}
                        disabled={actingMessageId === item._id}
                      >
                        <img src={trashIcon} alt="Delete" />
                      </button>
                    </div>
                  </article>
                ))}

              {!loading && !error && messages.length > 0 && (
                <div className="admin-contact-pagination">
                  <div className="admin-contact-page-controls">
                    <button
                      className="admin-contact-page-nav"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      <img src={prevIcon} alt="Previous" />
                    </button>
                    <div className="admin-contact-page-numbers">
                      {Array.from(
                        { length: Math.min(totalPages, 7) },
                        (_, index) => {
                          let pageNum = index + 1;
                          if (totalPages > 7 && currentPage > 4) {
                            pageNum = Math.min(
                              totalPages - 6 + index,
                              currentPage - 3 + index,
                            );
                          }
                          return pageNum;
                        },
                      ).map((pageNum) => (
                        <button
                          key={pageNum}
                          className={`admin-contact-page-num ${
                            currentPage === pageNum ? "active" : ""
                          }`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                    <button
                      className="admin-contact-page-nav"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <img src={nextIcon} alt="Next" />
                    </button>
                  </div>
                  <div className="admin-contact-page-info">
                    Showing {showingStart} to {showingEnd} of {messages.length}
                  </div>
                </div>
              )}
            </section>
          </section>
          <PortalFooter />
        </div>
      </main>
      {selectedMessage && (
        <div
          className="admin-contact-modal-backdrop"
          onClick={() => setSelectedMessage(null)}
          role="presentation"
        >
          <div
            className="admin-contact-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-contact-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-contact-modal-top">
              <h3 id="admin-contact-modal-title">Contact Message Details</h3>
              <div className="admin-contact-modal-top-actions">
                {!selectedMessage.isRead && (
                  <button
                    type="button"
                    className="admin-contact-modal-mark-read"
                    onClick={async () => {
                      await markAsRead(selectedMessage._id);
                      setSelectedMessage((prev) =>
                        prev
                          ? {
                              ...prev,
                              isRead: true,
                              readAt: prev.readAt || new Date().toISOString(),
                            }
                          : prev,
                      );
                    }}
                    disabled={actingMessageId === selectedMessage._id}
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  type="button"
                  className="admin-contact-modal-delete"
                  onClick={async () => {
                    await deleteMessage(selectedMessage._id);
                    setSelectedMessage(null);
                  }}
                  disabled={actingMessageId === selectedMessage._id}
                  aria-label="Delete message"
                >
                  <img src={trashIcon} alt="Delete" />
                </button>
                <button
                  type="button"
                  className="admin-contact-modal-close"
                  onClick={() => setSelectedMessage(null)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="admin-contact-modal-grid">
              <div>
                <strong>Name</strong>
                <p>{selectedMessage.name}</p>
              </div>
              <div>
                <strong>Email</strong>
                <p>{selectedMessage.email}</p>
              </div>
              <div>
                <strong>Received</strong>
                <p>{formatDateTime(selectedMessage.createdAt)}</p>
              </div>
              <div>
                <strong>Status</strong>
                <p>{selectedMessage.isRead ? "Read" : "Unread"}</p>
              </div>
            </div>
            <div className="admin-contact-modal-field">
              <strong>Subject</strong>
              <p>{selectedMessage.subject}</p>
            </div>
            <div className="admin-contact-modal-field">
              <strong>Message</strong>
              <p>{selectedMessage.message}</p>
            </div>
          </div>
        </div>
      )}
      {toastMessage && (
        <div className={`admin-contact-toast ${toastType}`}>
          <div className="admin-contact-toast-head">
            {toastType === "success" ? "Success" : "Error"}
          </div>
          <p className="admin-contact-toast-message">{toastMessage}</p>
          <button
            type="button"
            className="admin-contact-toast-close"
            aria-label="Close toast"
            onClick={() => setToastMessage("")}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminContactMessagesPage;


