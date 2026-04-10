import PortalFooter from "../../components/PortalFooter";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import RecruiterSidebar from "../../components/recruitercomponents/RecruiterSidebar";
import RecruiterTopBar from "../../components/recruitercomponents/RecruiterTopBar";
import defaultAvatar from "../../images/Register Page Images/Default Profile.webp";
import { connectSocket, getSocket } from "../../lib/socketClient";
import prevIcon from "../../images/Employers Page Images/Prev Icon.svg";
import nextIcon from "../../images/Employers Page Images/Next Icon.svg";
import "../../styles/RecruiterFriendRequestsPage.css";

const LAST_ACCEPTED_CONNECTION_KEY = "lastAcceptedConnectionRequest";

type FriendRequestItem = {
  id: string;
  requester: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    profilePicture?: string;
    currentJobTitle?: string;
  };
  createdAt: string;
};

type ConnectedUserItem = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  profilePicture?: string;
  currentJobTitle?: string;
  connectedAt?: string;
};

const RecruiterFriendRequestsPage = () => {
  const ITEMS_PER_PAGE = 20;
  const navigate = useNavigate();
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [friends, setFriends] = useState<ConnectedUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"requests" | "connected">(
    "requests",
  );
  const [topSearch, setTopSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchRequests = async (silent = false) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      if (!silent) {
        setLoading(true);
        setError("");
      }
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/connections/incoming`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load friend requests");
      }
      setRequests(data.requests || []);
    } catch (err: any) {
      if (!silent) {
        setError(err?.message || "Failed to load friend requests");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleRespond = async (requesterId: string, action: "accept" | "delete") => {
    const token = localStorage.getItem("authToken");
    if (!token || !requesterId) return;
    try {
      setActionLoadingId(requesterId);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/connections/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requesterId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update request");
      }
      setRequests((prev) => prev.filter((item) => item.requester.id !== requesterId));
      if (action === "accept") {
        try {
          localStorage.setItem(
            LAST_ACCEPTED_CONNECTION_KEY,
            JSON.stringify({
              requesterId,
              acceptedAt: Date.now(),
            }),
          );
        } catch {
          // ignore storage issues
        }
        fetchFriends();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update request");
    } finally {
      setActionLoadingId(null);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchFriends();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("authToken") || "";
    if (!token) return;

    const socket = connectSocket(token);
    if (!socket) return;

    const handleConnectionEvent = () => {
      fetchRequests(true);
      fetchFriends();
    };
    const handleVisibilityOrFocus = () => {
      if (document.hidden) return;
      handleConnectionEvent();
    };

    socket.on("connect", handleConnectionEvent);
    socket.on("connection:request:new", handleConnectionEvent);
    socket.on("connection:request:updated", handleConnectionEvent);
    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      const connectedSocket = getSocket();
      connectedSocket?.off("connect", handleConnectionEvent);
      connectedSocket?.off("connection:request:new", handleConnectionEvent);
      connectedSocket?.off("connection:request:updated", handleConnectionEvent);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, []);

  const fetchFriends = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/connections/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load connections");
      }
      setFriends(data.friends || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load connections");
    }
  };

  const handleRemoveConnection = async (targetUserId: string) => {
    const token = localStorage.getItem("authToken");
    if (!token || !targetUserId) return;
    try {
      setActionLoadingId(targetUserId);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/connections/remove`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to remove connection");
      }
      setFriends((prev) => prev.filter((item) => item.id !== targetUserId));
    } catch (err: any) {
      setError(err?.message || "Failed to remove connection");
    } finally {
      setActionLoadingId(null);
    }
  };

  const resolveAvatar = (value?: string) => {
    if (!value) return defaultAvatar;
    if (value.startsWith("http")) return value;
    return `${import.meta.env.VITE_BACKEND_URL}${value}`;
  };

  const formatDate = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString();
  };

  const getDisplayRole = (item: {
    role?: string;
    currentJobTitle?: string;
  }) => {
    const title = (item.currentJobTitle || "").trim();
    const role = (item.role || "").trim();
    if (role.toLowerCase() === "recruiter") {
      return "Recruiter";
    }
    if (title && title.toLowerCase() !== "this is the logo") {
      return title;
    }
    return role || "User";
  };

  const goToProfileDetails = (requester: FriendRequestItem["requester"]) => {
    const path =
      requester.role === "recruiter"
        ? `/employer/${requester.id}`
        : `/candidate/${requester.id}`;
    navigate(path);
  };

  const shouldShowRoleLine = (item: {
    role?: string;
    currentJobTitle?: string;
  }) => {
    const role = (item.role || "").trim().toLowerCase();
    if (role === "recruiter") return false;
    const title = (item.currentJobTitle || "").trim().toLowerCase();
    return title !== "this is the logo";
  };

  const filteredRequests = requests.filter((item) =>
    item.requester.fullName
      .toLowerCase()
      .includes(topSearch.trim().toLowerCase()),
  );
  const filteredFriends = friends.filter((item) =>
    item.fullName.toLowerCase().includes(topSearch.trim().toLowerCase()),
  );

  const activeItemsCount =
    activeTab === "requests" ? filteredRequests.length : filteredFriends.length;
  const totalPages = Math.max(1, Math.ceil(activeItemsCount / ITEMS_PER_PAGE));
  const visiblePages = useMemo(
    () => Array.from({ length: Math.min(totalPages, 7) }, (_, index) => index + 1),
    [totalPages],
  );

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  const paginatedFriends = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFriends.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFriends, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, topSearch]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="recruiter-friend-layout">
      <RecruiterSidebar />
      <main className="recruiter-friend-main">
        <div className="recruiter-friend-topbar-wrapper">
          <RecruiterTopBar
            showSearch
            searchPlaceholder={
              activeTab === "requests"
                ? "Search requests by user name..."
                : "Search connected users by name..."
            }
            onSearch={setTopSearch}
          />
        </div>
        <div className="recruiter-friend-scrollable-content">
          <section className="recruiter-friend-content">
          <header className="recruiter-friend-header">
            <h1>Friend Requests</h1>
            <p>Accept, remove, or keep pending requests as you prefer.</p>
          </header>

          <div className="recruiter-friend-tabs">
            <button
              type="button"
              className={`recruiter-friend-tab ${
                activeTab === "requests" ? "active" : ""
              }`}
              onClick={() => setActiveTab("requests")}
            >
              Requests ({requests.length})
            </button>
            <button
              type="button"
              className={`recruiter-friend-tab ${
                activeTab === "connected" ? "active" : ""
              }`}
              onClick={() => setActiveTab("connected")}
            >
              Connected ({friends.length})
            </button>
          </div>

          {loading && <div className="recruiter-friend-state loading">Loading</div>}
          {error && !loading && (
            <div className="recruiter-friend-state error">{error}</div>
          )}
          {!loading &&
            !error &&
            activeTab === "requests" &&
            filteredRequests.length === 0 && (
            <div className="recruiter-friend-state">
              {requests.length === 0
                ? "No pending requests."
                : "No request matches this name."}
            </div>
          )}
          {!loading &&
            !error &&
            activeTab === "connected" &&
            filteredFriends.length === 0 && (
            <div className="recruiter-friend-state">
              {friends.length === 0
                ? "No connected users yet."
                : "No connected user matches this name."}
            </div>
          )}

          {activeTab === "requests" && (
            <div className="recruiter-friend-list">
              {paginatedRequests.map((item) => (
                <article key={item.id} className="recruiter-friend-card">
                  <div
                    className="recruiter-friend-user recruiter-friend-user-clickable"
                    onClick={() => goToProfileDetails(item.requester)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        goToProfileDetails(item.requester);
                      }
                    }}
                  >
                    <img
                      src={resolveAvatar(item.requester.profilePicture)}
                      alt={item.requester.fullName}
                      className={
                        item.requester.role === "recruiter"
                          ? "recruiter-friend-avatar recruiter-logo"
                          : "recruiter-friend-avatar"
                      }
                      onError={(e) => {
                        e.currentTarget.src = defaultAvatar;
                      }}
                    />
                    <div className="recruiter-friend-info">
                      <h3>{item.requester.fullName}</h3>
                      {shouldShowRoleLine(item.requester) && (
                        <p>{getDisplayRole(item.requester)}</p>
                      )}
                      <span>{item.requester.email}</span>
                      <small>Requested on {formatDate(item.createdAt)}</small>
                    </div>
                  </div>

                  <div className="recruiter-friend-actions">
                    <button
                      type="button"
                      className="recruiter-friend-btn profile"
                      onClick={() => goToProfileDetails(item.requester)}
                    >
                      View Profile
                    </button>
                    <button
                      type="button"
                      className="recruiter-friend-btn accept"
                      onClick={() => handleRespond(item.requester.id, "accept")}
                      disabled={actionLoadingId === item.requester.id}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="recruiter-friend-btn delete"
                      onClick={() => handleRespond(item.requester.id, "delete")}
                      disabled={actionLoadingId === item.requester.id}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {activeTab === "connected" && (
            <div className="recruiter-friend-list">
              {paginatedFriends.map((item) => (
                <article key={item.id} className="recruiter-friend-card">
                  <div
                    className="recruiter-friend-user recruiter-friend-user-clickable"
                    onClick={() => goToProfileDetails(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        goToProfileDetails(item);
                      }
                    }}
                  >
                    <img
                      src={resolveAvatar(item.profilePicture)}
                      alt={item.fullName}
                      className={
                        item.role === "recruiter"
                          ? "recruiter-friend-avatar recruiter-logo"
                          : "recruiter-friend-avatar"
                      }
                      onError={(e) => {
                        e.currentTarget.src = defaultAvatar;
                      }}
                    />
                    <div className="recruiter-friend-info">
                      <h3>{item.fullName}</h3>
                      {shouldShowRoleLine(item) && <p>{getDisplayRole(item)}</p>}
                      <span>{item.email}</span>
                      <small>Connected on {formatDate(item.connectedAt)}</small>
                    </div>
                  </div>

                  <div className="recruiter-friend-actions">
                    <button
                      type="button"
                      className="recruiter-friend-btn profile"
                      onClick={() => goToProfileDetails(item)}
                    >
                      View Profile
                    </button>
                    <button
                      type="button"
                      className="recruiter-friend-btn delete"
                      onClick={() => handleRemoveConnection(item.id)}
                      disabled={actionLoadingId === item.id}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && activeItemsCount > 0 && (
            <div className="recruiter-friend-pagination">
              <div className="recruiter-friend-page-controls">
                <button
                  className="recruiter-friend-page-nav"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <img src={prevIcon} alt="Previous" />
                </button>
                <div className="recruiter-friend-page-numbers">
                  {visiblePages.map((page) => (
                    <button
                      key={page}
                      className={`recruiter-friend-page-num ${currentPage === page ? "active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  className="recruiter-friend-page-nav"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <img src={nextIcon} alt="Next" />
                </button>
              </div>
              <div className="recruiter-friend-page-info">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, activeItemsCount)} of{" "}
                {activeItemsCount}
              </div>
            </div>
          )}
          </section>
          <PortalFooter />
        </div>
      </main>
    </div>
  );
};

export default RecruiterFriendRequestsPage;




