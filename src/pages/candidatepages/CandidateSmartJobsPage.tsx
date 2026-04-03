import PortalFooter from "../../components/PortalFooter";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CandidateSidebar from "../../components/candidatecomponents/CandidateSidebar";
import CandidateTopBar from "../../components/candidatecomponents/CandidateTopBar";
import "../../styles/CandidateSmartJobsPage.css";
import eyeIcon from "../../images/Candidate Profile Page Images/eyeIcon.svg";
import deleteIcon from "../../images/Candidate Profile Page Images/trash.png";
import prevIcon from "../../images/Employers Page Images/Prev Icon.svg";
import nextIcon from "../../images/Employers Page Images/Next Icon.svg";

type RecommendationHistoryItem = {
  id: string;
  createdAt: string;
  count: number;
};

const CandidateSmartJobsPage = () => {
  const ITEMS_PER_PAGE = 20;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error">("success");
  const [history, setHistory] = useState<RecommendationHistoryItem[]>([]);
  const [draftDateFrom, setDraftDateFrom] = useState("");
  const [draftDateTo, setDraftDateTo] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchHistory = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/recommendations/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setHistory(data.history || []);
      }
    } catch (_) {}
  };

  const fetchRecommendations = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setStatusMessage("");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/recommendations/me?limit=12`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load recommendations");
      }
      setHasRun(true);
      setStatusType("success");
      setStatusMessage("Recommendation run completed.");
      fetchHistory();
    } catch (err: any) {
      setStatusType("error");
      setStatusMessage(err?.message || "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = (id: string) => {
    navigate(`/candidate/job-alerts/history/${id}`);
  };

  const handleDeleteHistory = async (id: string) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/recommendations/history/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete recommendation history");
      }
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setStatusType("error");
      setStatusMessage(err?.message || "Failed to delete recommendation history");
    }
  };

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString();
  };

  const handleApplyDateFilter = () => {
    setDateFrom(draftDateFrom);
    setDateTo(draftDateTo);
  };

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const created = new Date(item.createdAt);
      if (Number.isNaN(created.getTime())) return false;

      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00`);
        if (created < from) return false;
      }

      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59`);
        if (created > to) return false;
      }

      return true;
    });
  }, [history, dateFrom, dateTo]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredHistory.length / ITEMS_PER_PAGE),
  );

  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHistory, currentPage]);

  const visiblePages = useMemo(
    () => Array.from({ length: Math.min(totalPages, 7) }, (_, index) => index + 1),
    [totalPages],
  );

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = window.setTimeout(() => {
      setStatusMessage("");
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="candidate-dashboard-container">
      <CandidateSidebar />
      <main className="candidate-smart-main">
        <CandidateTopBar />
        <div className="candidate-smart-content-wrapper">
          {statusMessage && (
            <div
              className={`candidate-smart-toast ${
                statusType === "success" ? "success" : "error"
              }`}
            >
              <div className="candidate-smart-toast-head">
                {statusType === "success" ? "Success" : "Error"}
              </div>
              <p className="candidate-smart-toast-message">{statusMessage}</p>
              <button
                type="button"
                className="candidate-smart-toast-close"
                onClick={() => setStatusMessage("")}
                aria-label="Close toast"
              >
                x
              </button>
            </div>
          )}
          <section className="candidate-smart-shell">
            <header className="candidate-smart-header">
              <div className="candidate-smart-header-left">
                <h2>Smart Jobs</h2>
                <p>AI-ranked jobs based on your profile, skills, and experience.</p>
                {!loading && !hasRun && (
                  <p className="candidate-smart-helper-text">
                    Click Run Recommendation to generate smart jobs.
                  </p>
                )}
              </div>
              <div className="candidate-smart-header-right">
                <div className="candidate-smart-filter-block">
                  <div className="candidate-smart-date-filter">
                    <input
                      type="date"
                      value={draftDateFrom}
                      onChange={(e) => setDraftDateFrom(e.target.value)}
                      aria-label="From date"
                    />
                    <span>to</span>
                    <input
                      type="date"
                      value={draftDateTo}
                      onChange={(e) => setDraftDateTo(e.target.value)}
                      aria-label="To date"
                    />
                  </div>
                  <button
                    type="button"
                    className="candidate-smart-apply-filter-btn"
                    onClick={handleApplyDateFilter}
                  >
                    Apply Filter
                  </button>
                </div>
                <button
                  type="button"
                  className="candidate-smart-run-btn"
                  onClick={fetchRecommendations}
                  disabled={loading}
                >
                  {loading ? "Running..." : "Run Recommendation"}
                </button>
              </div>
            </header>

            {!loading && history.length > 0 && (
              <section className="candidate-smart-history">
                <h4>Recommendation History</h4>
                <div className="candidate-smart-history-list">
                  {paginatedHistory.map((row) => (
                    <article key={row.id} className="candidate-smart-history-row-wrap">
                      <div className="candidate-smart-history-row">
                        <div>
                          <strong>{formatDateTime(row.createdAt)}</strong>
                          <p>{row.count} jobs recommended</p>
                        </div>
                        <div className="candidate-smart-history-actions">
                          <button
                            type="button"
                            className="candidate-smart-icon-btn"
                            onClick={() => handleViewHistory(row.id)}
                            title="View recommendation run"
                          >
                            <img src={eyeIcon} alt="View" />
                          </button>
                          <button
                            type="button"
                            className="candidate-smart-icon-btn"
                            onClick={() => handleDeleteHistory(row.id)}
                            title="Delete recommendation run"
                          >
                            <img src={deleteIcon} alt="Delete" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                  {filteredHistory.length === 0 && (
                    <div className="candidate-smart-state">
                      No recommendation history in selected date range.
                    </div>
                  )}
                </div>
                {filteredHistory.length > 0 && (
                  <div className="candidate-smart-pagination">
                    <div className="candidate-smart-page-info">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                      {(currentPage - 1) * ITEMS_PER_PAGE + paginatedHistory.length} of{" "}
                      {filteredHistory.length}
                    </div>
                    <div className="candidate-smart-page-controls">
                      <button
                        className="candidate-smart-page-nav"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <img src={prevIcon} alt="Previous" />
                      </button>
                      <div className="candidate-smart-page-numbers">
                        {visiblePages.map((pageNumber) => (
                          <span
                            key={pageNumber}
                            className={`candidate-smart-page-num ${
                              pageNumber === currentPage ? "active" : ""
                            }`}
                            onClick={() => setCurrentPage(pageNumber)}
                          >
                            {pageNumber}
                          </span>
                        ))}
                      </div>
                      <button
                        className="candidate-smart-page-nav"
                        onClick={() =>
                          setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        <img src={nextIcon} alt="Next" />
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}
          </section>
          <PortalFooter />
        </div>
      </main>
    </div>
  );
};

export default CandidateSmartJobsPage;




