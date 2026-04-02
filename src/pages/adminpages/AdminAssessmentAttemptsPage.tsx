import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admincomponents/AdminSidebar";
import AdminTopBar from "../../components/admincomponents/AdminTopBar";
import "../../styles/AdminManageUsersPage.css";
import "../../styles/AdminAssessmentsPage.css";
import actionEyeIcon from "../../images/Candidate Profile Page Images/eyeIcon.svg";
import deleteIcon from "../../images/Recruiter Profile Page Images/6_80.svg";
import prevIcon from "../../images/Employers Page Images/Prev Icon.svg";
import nextIcon from "../../images/Employers Page Images/Next Icon.svg";

type AttemptItem = {
  id: string;
  assessmentTitle: string;
  assessmentType: string;
  candidate: {
    id: string;
    fullName: string;
    email: string;
  };
  attemptNumber: number;
  submittedAt: string;
  score: number | null;
  quizTotal: number | null;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const AdminAssessmentAttemptsPage = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ATTEMPTS_PER_PAGE = 20;

  const fetchAttempts = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/assessments/admin/attempts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load assessment attempts");
      }
      setAttempts(data.attempts || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load assessment attempts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, []);

  const filteredAttempts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return attempts.filter((item) => {
      const matchesSearch = q
        ? item.assessmentTitle.toLowerCase().includes(q) ||
          item.candidate.fullName.toLowerCase().includes(q) ||
          item.candidate.email.toLowerCase().includes(q)
        : true;
      const matchesType =
        typeFilter === "all" ? true : item.assessmentType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [attempts, search, typeFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAttempts.length / ATTEMPTS_PER_PAGE),
  );
  const paginatedAttempts = filteredAttempts.slice(
    (currentPage - 1) * ATTEMPTS_PER_PAGE,
    currentPage * ATTEMPTS_PER_PAGE,
  );
  const showingStart =
    filteredAttempts.length === 0
      ? 0
      : (currentPage - 1) * ATTEMPTS_PER_PAGE + 1;
  const showingEnd =
    filteredAttempts.length === 0
      ? 0
      : Math.min(currentPage * ATTEMPTS_PER_PAGE, filteredAttempts.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const onSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    setCurrentPage(1);
    setSearch(searchInput);
  };

  const dismissSubmission = async (attemptId: string) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setDismissingId(attemptId);
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/assessments/admin/attempts/${attemptId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to dismiss submission");
      }
      setAttempts((prev) => prev.filter((item) => item.id !== attemptId));
    } catch (err: any) {
      setError(err?.message || "Failed to dismiss submission");
    } finally {
      setDismissingId(null);
    }
  };

  return (
    <div className="admin-assessments-page-container">
      <div className="admin-assessments-layout">
        <AdminSidebar />
        <div className="admin-manage-main-area">
          <div className="admin-manage-topbar-wrapper">
            <AdminTopBar />
          </div>
          <div className="admin-manage-scrollable-content">
            <div className="admin-manage-shell">
              <header className="admin-manage-header">
                <div>
                  <h1>Assessment Attempt History</h1>
                  <p>Track who attempted admin quiz/assessments and review submissions.</p>
                </div>
              </header>

              <form className="admin-manage-filters" onSubmit={onSearchSubmit}>
                <input
                  type="text"
                  placeholder="Search by assessment title, candidate name, or email"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                >
                  <option value="all">All Type</option>
                  <option value="quiz">Quiz</option>
                  <option value="writing">Writing</option>
                  <option value="task">Task</option>
                </select>
                <button type="submit">Search</button>
              </form>

              <section className="admin-manage-table-wrap">
                <header className="admin-manage-table-head admin-assessment-attempts-table-head">
                  <span>Assessment</span>
                  <span>Type</span>
                  <span>Candidate</span>
                  <span>Attempt</span>
                  <span>Score</span>
                  <span>Submitted</span>
                  <span>Actions</span>
                </header>

                {loading && <div className="admin-manage-state">Loading</div>}
                {error && !loading && <div className="admin-manage-state error">{error}</div>}
                {!loading && !error && filteredAttempts.length === 0 && (
                  <div className="admin-manage-state">No assessment attempts found.</div>
                )}

                {!loading &&
                  !error &&
                  paginatedAttempts.map((item) => (
                    <article
                      className="admin-manage-row admin-assessment-attempts-table-row"
                      key={item.id}
                    >
                      <span>{item.assessmentTitle}</span>
                      <span className={`chip ${item.assessmentType}`}>
                        {item.assessmentType}
                      </span>
                      <span>
                        {item.candidate.fullName}
                        <br />
                        <small>{item.candidate.email}</small>
                      </span>
                      <span>
                        {item.attemptNumber}
                        {item.assessmentType === "quiz" && typeof item.score === "number"
                          ? item.quizTotal && item.quizTotal > 0
                            ? ` (${item.score}/${item.quizTotal})`
                            : ` (${item.score})`
                          : ""}
                      </span>
                      <span>
                        {item.assessmentType === "quiz" && typeof item.score === "number" ? (
                          <strong className="admin-assessment-attempt-score">
                            {item.quizTotal && item.quizTotal > 0
                              ? `${item.score}/${item.quizTotal}`
                              : `${item.score}`}
                          </strong>
                        ) : (
                          "-"
                        )}
                      </span>
                      <span>{formatDate(item.submittedAt)}</span>
                      <div className="admin-assessments-actions">
                        <button
                          type="button"
                          className="admin-assessments-icon-btn"
                          title="View submission"
                          onClick={() =>
                            navigate(`/admin/assessments/attempts/${item.id}`)
                          }
                        >
                          <img src={actionEyeIcon} alt="View" />
                        </button>
                        <button
                          type="button"
                          className="admin-assessments-icon-btn danger"
                          title="Dismiss submission"
                          onClick={() => dismissSubmission(item.id)}
                          disabled={dismissingId === item.id}
                        >
                          <img src={deleteIcon} alt="Dismiss" />
                        </button>
                      </div>
                    </article>
                  ))}
                {!loading && !error && filteredAttempts.length > 0 && (
                  <div className="admin-manage-pagination">
                    <div className="admin-manage-page-controls">
                      <button
                        className="admin-manage-page-nav"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        <img src={prevIcon} alt="Previous" />
                      </button>
                      <div className="admin-manage-page-numbers">
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
                            className={`admin-manage-page-num ${
                              currentPage === pageNum ? "active" : ""
                            }`}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>
                      <button
                        className="admin-manage-page-nav"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1),
                          )
                        }
                        disabled={currentPage === totalPages}
                      >
                        <img src={nextIcon} alt="Next" />
                      </button>
                    </div>
                    <div className="admin-manage-page-info">
                      Showing {showingStart} to {showingEnd} of{" "}
                      {filteredAttempts.length}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAssessmentAttemptsPage;


