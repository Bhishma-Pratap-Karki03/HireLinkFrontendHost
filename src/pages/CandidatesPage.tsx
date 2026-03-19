import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/CandidatesPage.css";
import searchIcon from "../images/Employers Page Images/8_285.svg";
import defaultAvatar from "../images/Register Page Images/Default Profile.webp";
import connectIcon from "../images/Employers Page Images/connect-icon.png";
import pendingIcon from "../images/Employers Page Images/pending-icon.png";
import friendIcon from "../images/Employers Page Images/friend-icon.png";
import messageIcon from "../images/Employers Page Images/message-icon.png";
import viewProfileIcon from "../images/Employers Page Images/view-profile-icon.png";
import prevIcon from "../images/Employers Page Images/Prev Icon.svg";
import nextIcon from "../images/Employers Page Images/Next Icon.svg";

type CandidateSkill = {
  skillName: string;
};

type CandidateExperience = {
  startDate?: string;
  endDate?: string | null;
  isCurrent?: boolean;
};

type CandidateItem = {
  id?: string;
  _id?: string;
  fullName: string;
  email: string;
  currentJobTitle?: string;
  address?: string;
  profilePicture?: string;
  skills?: CandidateSkill[];
  experience?: CandidateExperience[];
};

type ConnectionState = "none" | "pending" | "friend";
type MutualConnection = {
  id: string;
  fullName: string;
  profilePicture?: string;
  role?: string;
};

const resolveAvatar = (profilePicture?: string) => {
  if (!profilePicture) return defaultAvatar;
  if (profilePicture.startsWith("http")) return profilePicture;
  return `${import.meta.env.VITE_BACKEND_URL}${profilePicture}`;
};

const getExperienceYears = (experience?: CandidateExperience[]) => {
  if (!experience || experience.length === 0) return 0;
  const now = new Date();
  const totalMonths = experience.reduce((sum, item) => {
    const start = item.startDate ? new Date(item.startDate) : null;
    const end = item.isCurrent
      ? now
      : item.endDate
        ? new Date(item.endDate)
        : now;
    if (
      !start ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return sum;
    }
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    return sum + Math.max(0, months);
  }, 0);
  return Math.round(totalMonths / 12);
};

const CandidatesPage = () => {
  const ITEMS_PER_PAGE = 9;
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [minExperience, setMinExperience] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [connectionStatuses, setConnectionStatuses] = useState<
    Record<string, ConnectionState>
  >({});
  const [sendingConnectionId, setSendingConnectionId] = useState<string | null>(
    null,
  );
  const [mutualConnectionsByCandidate, setMutualConnectionsByCandidate] =
    useState<Record<string, MutualConnection[]>>({});
  const userDataStr = localStorage.getItem("userData");
  const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
  const currentUserId =
    currentUser?.id || currentUser?._id || currentUser?.userId || "";
  const isAdminViewer =
    currentUser?.email === "hirelinknp@gmail.com" || currentUser?.role === "admin";

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/candidates`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load candidates");
        }
        setCandidates(data.candidates || []);
      } catch {
        setError("No data found currently.");
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  useEffect(() => {
    const fetchConnectionStatuses = async () => {
      const token = localStorage.getItem("authToken");
      const role = currentUser?.role;
      const isAllowed = role === "candidate" || role === "recruiter";

      if (!token || !isAllowed) {
        setConnectionStatuses({});
        return;
      }

      const targetIds = candidates
        .map((candidate) => candidate.id || candidate._id || "")
        .filter((id) => Boolean(id) && id !== currentUserId);

      if (targetIds.length === 0) {
        setConnectionStatuses({});
        return;
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/connections/statuses?targetIds=${targetIds.join(",")}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        if (!res.ok) {
          return;
        }
        setConnectionStatuses(
          (data.statuses || {}) as Record<string, ConnectionState>,
        );
      } catch {
        setConnectionStatuses({});
      }
    };

    fetchConnectionStatuses();

    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      fetchConnectionStatuses();
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [candidates, currentUser?.role, currentUserId]);

  const handleSendConnection = async (targetUserId: string) => {
    const token = localStorage.getItem("authToken");
    const role = currentUser?.role;
    const isAllowed = role === "candidate" || role === "recruiter";

    if (!token || !isAllowed) {
      navigate("/login");
      return;
    }

    if (
      !targetUserId ||
      targetUserId === currentUserId ||
      sendingConnectionId ||
      connectionStatuses[targetUserId] !== "none"
    ) {
      return;
    }

    try {
      setSendingConnectionId(targetUserId);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/connections/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientId: targetUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return;
      }

      const nextState: ConnectionState =
        data.status === "accepted" ? "friend" : "pending";
      setConnectionStatuses((prev) => ({
        ...prev,
        [targetUserId]: nextState,
      }));
    } finally {
      setSendingConnectionId(null);
    }
  };

  const getConnectionLabel = (targetUserId: string) => {
    const status = connectionStatuses[targetUserId] || "none";
    if (status === "friend") return "Friend";
    if (status === "pending") return "Pending";
    return "Connect";
  };

  const getConnectionIcon = (targetUserId: string) => {
    const status = connectionStatuses[targetUserId] || "none";
    if (status === "friend") return friendIcon;
    if (status === "pending") return pendingIcon;
    return connectIcon;
  };

  const openMessages = (targetUserId: string) => {
    const token = localStorage.getItem("authToken");
    const role = currentUser?.role;
    if (!token) {
      navigate("/login");
      return;
    }
    if (!targetUserId || (role !== "candidate" && role !== "recruiter")) {
      return;
    }
    navigate(`/${role}/messages?user=${targetUserId}`);
  };

  const filteredCandidates = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    const locationValue = locationFilter.trim().toLowerCase();
    const skillValue = skillFilter.trim().toLowerCase();
    const minYears = Number(minExperience) || 0;

    return candidates.filter((candidate) => {
      const skills = (candidate.skills || []).map((s) => s.skillName || "");
      const skillsText = skills.join(" ").toLowerCase();
      const nameMatch = candidate.fullName.toLowerCase().includes(searchValue);
      const titleMatch = (candidate.currentJobTitle || "")
        .toLowerCase()
        .includes(searchValue);
      const skillMatch = skillsText.includes(searchValue);
      const searchPass = !searchValue || nameMatch || titleMatch || skillMatch;

      const locationPass =
        !locationValue ||
        (candidate.address || "").toLowerCase().includes(locationValue);

      const skillFilterPass = !skillValue || skillsText.includes(skillValue);

      const experienceYears = getExperienceYears(candidate.experience);
      const experiencePass = !minExperience || experienceYears >= minYears;

      return searchPass && locationPass && skillFilterPass && experiencePass;
    });
  }, [candidates, search, locationFilter, skillFilter, minExperience]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, locationFilter, skillFilter, minExperience]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCandidates.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCandidates, currentPage]);

  useEffect(() => {
    const fetchMutualConnections = async () => {
      const token = localStorage.getItem("authToken");
      const role = currentUser?.role;
      const isAllowed = role === "candidate" || role === "recruiter";

      if (!token || !isAllowed) {
        setMutualConnectionsByCandidate({});
        return;
      }

      const targetIds = paginatedCandidates
        .map((candidate) => candidate.id || candidate._id || "")
        .filter((id) => Boolean(id) && id !== currentUserId);

      if (targetIds.length === 0) {
        setMutualConnectionsByCandidate({});
        return;
      }

      try {
        const results = await Promise.all(
          targetIds.map(async (targetId) => {
            const res = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/connections/mutual/${targetId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            const data = await res.json();
            return {
              targetId,
              mutualConnections: res.ok ? data?.mutualConnections || [] : [],
            };
          }),
        );

        const mapped: Record<string, MutualConnection[]> = {};
        results.forEach((item) => {
          mapped[item.targetId] = item.mutualConnections;
        });
        setMutualConnectionsByCandidate(mapped);
      } catch {
        setMutualConnectionsByCandidate({});
      }
    };

    fetchMutualConnections();
  }, [paginatedCandidates, currentUser?.role, currentUserId]);

  const visiblePages = useMemo(
    () =>
      Array.from({ length: Math.min(totalPages, 7) }, (_, index) => index + 1),
    [totalPages],
  );

  const applySearch = () => {
    setSearch(searchInput.trim());
    setCurrentPage(1);
  };

  return (
    <div className="candidates-page">
      <Navbar />
      <section className="candidates-hero">
        <div className="candidates-hero-inner">
          <div className="candidates-hero-text">
            <h1>Find Skilled Candidates for Your Team</h1>
            <p>
              Discover verified profiles, review key skills, and connect with
              candidates who match your hiring needs.
            </p>
          </div>
        </div>
        <div className="candidates-hero-search">
          <div className="candidates-search-pill">
            <div className="candidates-search-field">
              <img src={searchIcon} alt="Search" />
              <input
                type="text"
                placeholder="Search by name, title, or skill"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    applySearch();
                  }
                }}
              />
            </div>
            <button
              type="button"
              className="candidates-search-btn"
              onClick={applySearch}
            >
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="candidates-body">
        <aside className="candidates-filters">
          <div className="candidates-filter-card">
            <h3>Location</h3>
            <input
              type="text"
              placeholder="e.g. Kathmandu"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>
          <div className="candidates-filter-card">
            <h3>Skill</h3>
            <input
              type="text"
              placeholder="e.g. React, UI/UX"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
            />
          </div>
          <div className="candidates-filter-card">
            <h3>Experience (years)</h3>
            <input
              type="number"
              min="0"
              placeholder="Min years"
              value={minExperience}
              onChange={(e) => setMinExperience(e.target.value)}
            />
          </div>
        </aside>

        <div className="candidates-results">
          <div className="candidates-grid">
            {loading && <div className="candidates-state">Loading...</div>}
            {error && !loading && (
              <div className="public-empty-state">{error}</div>
            )}
            {!loading && !error && filteredCandidates.length === 0 && (
              <div className="public-empty-state">No data found currently.</div>
            )}

            {paginatedCandidates.map((candidate) => {
              const cardId = candidate.id || candidate._id || candidate.email;
              const connectionId = candidate.id || candidate._id || "";
              const isSelfCard = Boolean(
                currentUserId && connectionId === currentUserId,
              );
              const isConnectionDisabled =
                !connectionId ||
                isSelfCard ||
                sendingConnectionId === connectionId ||
                (connectionStatuses[connectionId] || "none") !== "none";
              const statusClass =
                connectionStatuses[connectionId] === "friend"
                  ? "is-friend"
                  : connectionStatuses[connectionId] === "pending"
                    ? "is-pending"
                    : "";
              const mutualConnections =
                mutualConnectionsByCandidate[connectionId] || [];

              return (
                <article
                  key={cardId}
                  className="candidates-card"
                  onClick={() => navigate(`/candidate/${cardId}`)}
                  role="button"
                >
                  <div className="candidates-card-header">
                    <img
                      src={resolveAvatar(candidate.profilePicture)}
                      alt={candidate.fullName}
                    />
                    <div>
                      <h3>{candidate.fullName}</h3>
                      <p>{candidate.currentJobTitle || "Candidate"}</p>
                      <span>{candidate.address || "Location not specified"}</span>
                    </div>
                  </div>
                  <div className="candidates-card-meta">
                    <div>
                      <span>Email</span>
                      <strong>{candidate.email}</strong>
                    </div>
                  </div>
                  {!isSelfCard && mutualConnections.length > 0 && (
                    <div className="candidates-mutuals">
                      <div className="candidates-mutual-avatars">
                        {mutualConnections.slice(0, 4).map((item) => (
                          <img
                            key={item.id}
                            src={resolveAvatar(item.profilePicture)}
                            alt={item.fullName}
                            className={
                              item.role === "recruiter"
                                ? "candidates-mutual-logo"
                                : ""
                            }
                          />
                        ))}
                      </div>
                      <span>
                        {mutualConnections.length} mutual connection
                        {mutualConnections.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                  <div
                    className={`candidates-card-actions ${
                      isSelfCard ? "is-single" : ""
                    } ${!isSelfCard && isAdminViewer ? "is-admin-view" : ""}`}
                  >
                    {isSelfCard ? (
                      <button
                        type="button"
                        title="View profile"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/candidate/${cardId}`);
                        }}
                      >
                        <img src={viewProfileIcon} alt="View profile" />
                        <span>View Profile</span>
                      </button>
                    ) : !isAdminViewer ? (
                      <>
                        <button
                          type="button"
                          title="Send connection request"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!connectionId) return;
                            handleSendConnection(connectionId);
                          }}
                          disabled={isConnectionDisabled}
                          className={statusClass}
                        >
                          <img
                            src={getConnectionIcon(connectionId)}
                            alt={getConnectionLabel(connectionId)}
                          />
                          <span>{getConnectionLabel(connectionId)}</span>
                        </button>
                        <button
                          type="button"
                          title="Message"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!connectionId) return;
                            openMessages(connectionId);
                          }}
                        >
                          <img src={messageIcon} alt="Message" />
                          <span>Message</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        title="View profile"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/candidate/${cardId}`);
                        }}
                      >
                        <img src={viewProfileIcon} alt="View profile" />
                        <span>View Profile</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {!loading && !error && filteredCandidates.length > 0 && (
            <div className="candidates-pagination">
              <div className="candidates-page-controls">
                <button
                  type="button"
                  className="candidates-page-nav"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <img src={prevIcon} alt="Previous" />
                </button>
                <div className="candidates-page-numbers">
                  {visiblePages.map((pageNumber) => (
                    <span
                      key={pageNumber}
                      className={`candidates-page-num ${
                        pageNumber === currentPage ? "candidates-active" : ""
                      }`}
                      onClick={() => setCurrentPage(pageNumber)}
                      role="button"
                    >
                      {pageNumber}
                    </span>
                  ))}
                  {totalPages > 7 && (
                    <span className="candidates-page-num candidates-dots">
                      ...
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="candidates-page-nav"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <img src={nextIcon} alt="Next" />
                </button>
              </div>
              <div className="candidates-page-info">
                Showing{" "}
                {paginatedCandidates.length
                  ? (currentPage - 1) * ITEMS_PER_PAGE + 1
                  : 0}{" "}
                to {(currentPage - 1) * ITEMS_PER_PAGE + paginatedCandidates.length}{" "}
                of {filteredCandidates.length}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CandidatesPage;


