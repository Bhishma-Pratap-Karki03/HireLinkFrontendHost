import PortalFooter from "../../components/PortalFooter";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CandidateSidebar from "../../components/candidatecomponents/CandidateSidebar";
import CandidateTopBar from "../../components/candidatecomponents/CandidateTopBar";
import "../../styles/CandidateAppliedStatusPage.css";
import statsAppliedIcon from "../../images/Candidate Profile Page Images/stats-applied-icon.svg";
import statsInterviewIcon from "../../images/Candidate Profile Page Images/stats-interview-icon.svg";
import statsOfferIcon from "../../images/Candidate Profile Page Images/stats-offer-icon.svg";
import statsTotalIcon from "../../images/Candidate Profile Page Images/stats-reject.svg";
import actionMessageIcon from "../../images/Candidate Profile Page Images/message-icon.svg";
import actionResumeIcon from "../../images/Candidate Profile Page Images/eyeIcon.svg";
import prevIcon from "../../images/Employers Page Images/Prev Icon.svg";
import nextIcon from "../../images/Employers Page Images/Next Icon.svg";

type AppliedStatusItem = {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  jobType: string;
  appliedAt: string;
  updatedAt: string;
  status: string;
  resumeUrl: string;
  resumeFileName: string;
  resumeFileSize: number;
  recruiter: {
    id: string;
    fullName: string;
    profilePicture?: string;
  } | null;
};

const CandidateAppliedStatusPage = () => {
  const ITEMS_PER_PAGE = 20;
  const navigate = useNavigate();
  const [items, setItems] = useState<AppliedStatusItem[]>([]);
  const [titleSearch, setTitleSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const resolveResume = (resumeUrl?: string) => {
    if (!resumeUrl) return "";
    if (resumeUrl.startsWith("http")) return resumeUrl;
    return `${import.meta.env.VITE_BACKEND_URL}${resumeUrl}`;
  };

  const cleanLabel = (value?: string) =>
    String(value || "")
      .replace(/•/g, "-")
      .replace(/\?/g, "-")
      .trim();

  const labelFromStatus = (status?: string) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "interview") return "Interview";
    if (normalized === "shortlisted") return "Shortlisted";
    if (normalized === "reviewed") return "Reviewed";
    if (normalized === "hired") return "Hired";
    if (normalized === "rejected") return "Rejected";
    return "Applied";
  };

  const statusClass = (status?: string) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "interview") return "status-interview";
    if (normalized === "hired") return "status-hired";
    if (normalized === "rejected") return "status-rejected";
    if (normalized === "shortlisted") return "status-shortlisted";
    if (normalized === "reviewed") return "status-reviewed";
    return "status-applied";
  };

  const stats = useMemo(() => {
    const total = items.length;
    const interview = items.filter((item) => item.status === "interview").length;
    const offers = items.filter((item) => item.status === "hired").length;
    const rejected = items.filter((item) => item.status === "rejected").length;
    return { total, interview, offers, rejected, applied: total };
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = titleSearch.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => item.jobTitle.toLowerCase().includes(query));
  }, [items, titleSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const visiblePages = useMemo(
    () => Array.from({ length: Math.min(totalPages, 7) }, (_, index) => index + 1),
    [totalPages],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [titleSearch]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const fetchAppliedStatus = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/applications/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load applied jobs");
      }
      setItems(data.applications || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load applied jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppliedStatus();
  }, []);

  return (
    <div className="candidate-dashboard-container">
      <CandidateSidebar />
      <main className="candidate-applied-main">
        <CandidateTopBar
          showSearch
          searchPlaceholder="Search by job title..."
          onSearch={setTitleSearch}
        />
        <div className="candidate-applied-content-wrapper">
        <section className="candidate-applied-shell">
          <div className="candidate-applied-stats">
            <article className="candidate-applied-stat-card">
              <div>
                <h3>{stats.applied}</h3>
                <p>Applied Jobs</p>
              </div>
              <img src={statsAppliedIcon} alt="Applied jobs" />
            </article>
            <article className="candidate-applied-stat-card">
              <div>
                <h3>{stats.interview}</h3>
                <p>Interviews</p>
              </div>
              <img src={statsInterviewIcon} alt="Interviews" />
            </article>
            <article className="candidate-applied-stat-card">
              <div>
                <h3>{stats.offers}</h3>
                <p>Job Offers</p>
              </div>
              <img src={statsOfferIcon} alt="Job offers" />
            </article>
            <article className="candidate-applied-stat-card">
              <div>
                <h3>{stats.rejected}</h3>
                <p>Rejected</p>
              </div>
              <img src={statsTotalIcon} alt="Rejected jobs" />
            </article>
          </div>

          <section className="candidate-applied-table-wrap">
            <header className="candidate-applied-table-head">
              <span>Job Role & Company</span>
              <span>Date Applied</span>
              <span>Status</span>
              <span>Resume</span>
              <span>Actions</span>
            </header>

            {loading && (
              <div className="candidate-applied-state">Loading applied jobs...</div>
            )}
            {!loading && error && (
              <div className="candidate-applied-state candidate-applied-error">
                {error}
              </div>
            )}
            {!loading && !error && filteredItems.length === 0 && (
              <div className="candidate-applied-state">
                {items.length === 0
                  ? "No applied jobs found."
                  : "No job matches this title."}
              </div>
            )}

            {!loading &&
              !error &&
              paginatedItems.map((item) => (
                <article key={item.id} className="candidate-applied-row">
                  <div className="candidate-applied-cell candidate-applied-job">
                    <h4>{item.jobTitle}</h4>
                    <p>
                      {cleanLabel(item.companyName)} - {cleanLabel(item.location)}
                    </p>
                  </div>
                  <div className="candidate-applied-cell">
                    {formatDate(item.appliedAt)}
                  </div>
                  <div className="candidate-applied-cell">
                    <span
                      className={`candidate-applied-status ${statusClass(item.status)}`}
                    >
                      {labelFromStatus(item.status)}
                    </span>
                  </div>
                  <div className="candidate-applied-cell">
                    <a
                      href={resolveResume(item.resumeUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="candidate-applied-resume-link"
                    >
                      View Resume
                    </a>
                    <small>{formatFileSize(item.resumeFileSize)}</small>
                  </div>
                  <div className="candidate-applied-cell candidate-applied-actions">
                    {item.recruiter?.id ? (
                      <button
                        type="button"
                        className="candidate-applied-icon-btn"
                        onClick={() =>
                          navigate(`/candidate/messages?user=${item.recruiter?.id}`)
                        }
                        title="Message recruiter"
                      >
                        <img src={actionMessageIcon} alt="Message recruiter" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="candidate-applied-icon-btn"
                      onClick={() => navigate(`/jobs/${item.jobId}`)}
                      title="View job details"
                    >
                      <img src={actionResumeIcon} alt="View details" />
                    </button>
                  </div>
                </article>
              ))}
            {!loading && !error && filteredItems.length > 0 && (
              <div className="candidate-applied-pagination">
                <div className="candidate-applied-page-info">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                  {(currentPage - 1) * ITEMS_PER_PAGE + paginatedItems.length} of{" "}
                  {filteredItems.length}
                </div>
                <div className="candidate-applied-page-controls">
                  <button
                    className="candidate-applied-page-nav"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <img src={prevIcon} alt="Previous" />
                  </button>
                  <div className="candidate-applied-page-numbers">
                    {visiblePages.map((pageNumber) => (
                      <span
                        key={pageNumber}
                        className={`candidate-applied-page-num ${
                          pageNumber === currentPage ? "active" : ""
                        }`}
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </span>
                    ))}
                  </div>
                  <button
                    className="candidate-applied-page-nav"
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
        </section>
        <PortalFooter />
        </div>
      </main>
    </div>
  );
};

export default CandidateAppliedStatusPage;






