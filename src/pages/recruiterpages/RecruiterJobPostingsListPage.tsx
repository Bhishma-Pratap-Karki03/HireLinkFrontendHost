import PortalFooter from "../../components/PortalFooter";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import RecruiterSidebar from "../../components/recruitercomponents/RecruiterSidebar";
import RecruiterTopBar from "../../components/recruitercomponents/RecruiterTopBar";
import addIcon from "../../images/Recruiter Profile Page Images/plus icon.svg";
import prevIcon from "../../images/Employers Page Images/Prev Icon.svg";
import nextIcon from "../../images/Employers Page Images/Next Icon.svg";
import "../../styles/RecruiterJobPostingsListPage.css";

type RecruiterJobItem = {
  _id: string;
  jobTitle: string;
  location: string;
  jobType: string;
  deadline: string;
  statusLabel: string;
  applicantsCount: number;
  isActive: boolean;
};

const resolveApiBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();
  if (envUrl) return envUrl.replace(/\/+$/, "");
  if (typeof window !== "undefined") {
    const isLocalHost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isLocalHost) return "http://localhost:5000/api";
  }
  return "/api";
};

const parseJsonResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (!text) return {};
  if (!contentType.includes("application/json")) {
    throw new Error("API returned non-JSON response. Check API base URL.");
  }
  return JSON.parse(text);
};

const formatDate = (value?: string) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString();
};

const RecruiterJobPostingsListPage = () => {
  const apiBaseUrl = resolveApiBaseUrl();
  const navigate = useNavigate();
  const location = useLocation();
  const [jobs, setJobs] = useState<RecruiterJobItem[]>([]);
  const [titleSearch, setTitleSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pageToast, setPageToast] = useState("");
  const [pageToastType, setPageToastType] = useState<"success" | "error">("success");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 20;

  const filteredJobs = jobs.filter((job) =>
    job.jobTitle.toLowerCase().includes(titleSearch.trim().toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / jobsPerPage));
  const startIndex = filteredJobs.length === 0 ? 0 : (currentPage - 1) * jobsPerPage + 1;
  const endIndex = filteredJobs.length === 0 ? 0 : Math.min(currentPage * jobsPerPage, filteredJobs.length);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * jobsPerPage,
    currentPage * jobsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [titleSearch, jobs.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const state = location.state as
      | { toastMessage?: string; toastType?: "success" | "error" }
      | null;
    if (!state?.toastMessage) return;
    setPageToast(state.toastMessage);
    setPageToastType(state.toastType || "success");
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!pageToast) return;
    const timer = window.setTimeout(() => setPageToast(""), 4000);
    return () => window.clearTimeout(timer);
  }, [pageToast]);

  const toggleActive = async (jobId: string, nextValue: boolean) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      setTogglingId(jobId);
      const res = await fetch(`${apiBaseUrl}/jobs/${jobId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: nextValue }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update status");
      }
      setJobs((prev) =>
        prev.map((job) =>
          job._id === jobId ? { ...job, isActive: nextValue } : job,
        ),
      );
    } catch (err: any) {
      setError(err?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    const fetchJobs = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        setLoading(true);
        setError("");
        const res = await fetch(
          `${apiBaseUrl}/jobs/recruiter/list`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await parseJsonResponse(res);
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load job postings");
        }
        setJobs(data.jobs || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load job postings");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [navigate]);

  return (
    <div className="recruiter-joblist-layout">
      <RecruiterSidebar />
      <div className="recruiter-joblist-main">
        <div className="recruiter-joblist-topbar-wrapper">
          <RecruiterTopBar
            showSearch
            searchPlaceholder="Search by job title..."
            onSearch={setTitleSearch}
          />
        </div>
        <div className="recruiter-joblist-scrollable-content">
          <div className="recruiter-joblist-content">
            {pageToast && (
              <div className={`recruiter-joblist-toast ${pageToastType === "error" ? "error" : "success"}`}>
                <button
                  type="button"
                  className="recruiter-joblist-toast-close"
                  onClick={() => setPageToast("")}
                  aria-label="Close"
                >
                  {"\u00D7"}
                </button>
                <div className="recruiter-joblist-toast-head">
                  {pageToastType === "success" ? "Success" : "Error"}
                </div>
                <p className="recruiter-joblist-toast-message">{pageToast}</p>
              </div>
            )}
            <div className="recruiter-joblist-header">
              <div>
                <h1>Job Postings</h1>
                <p>Manage your job posts and track applicants.</p>
              </div>
              <button
                className="recruiter-btn-primary recruiter-joblist-create-btn"
                onClick={() => navigate("/recruiter/post-job")}
              >
                <img src={addIcon} alt="Add" />
                Post New Job
              </button>
            </div>

            {loading && <div className="recruiter-joblist-state">Loading...</div>}
            {error && !loading && (
              <div className="recruiter-joblist-state error">{error}</div>
            )}
            {!loading && !error && filteredJobs.length === 0 && (
              <div className="recruiter-joblist-state">
                {jobs.length === 0
                  ? "No job postings yet."
                  : "No jobs found for this title."}
              </div>
            )}

            <div className="recruiter-joblist-grid">
              {paginatedJobs.map((job) => (
                <article key={job._id} className="recruiter-joblist-card">
                  <div className="recruiter-joblist-card-header">
                    <h3>{job.jobTitle}</h3>
                    <span
                      className={`recruiter-joblist-status ${
                        job.isActive ? "status-open" : "status-closed"
                      }`}
                    >
                      {job.isActive ? "Open" : "Closed"}
                    </span>
                  </div>
                  <div className="recruiter-joblist-meta">
                    <span>{job.location}</span>
                    <span>{job.jobType}</span>
                    <span>Deadline: {formatDate(job.deadline)}</span>
                  </div>
                  <div className="recruiter-joblist-applicants">
                    Applicants: <strong>{job.applicantsCount}</strong>
                  </div>
                  <div className="recruiter-joblist-actions">
                    <button
                      className="recruiter-joblist-btn"
                      onClick={() =>
                        navigate(`/recruiter/job-postings/${job._id}/applicants`)
                      }
                    >
                      View Applicants
                    </button>
                    <button
                      className="recruiter-joblist-btn outline"
                      onClick={() =>
                        navigate(`/recruiter/job-postings/${job._id}/edit`)
                      }
                    >
                      Edit Job
                    </button>
                    <div className="recruiter-joblist-toggle">
                      <span
                        className={`recruiter-joblist-toggle-label ${
                          job.isActive ? "active" : "inactive"
                        }`}
                      >
                        {job.isActive ? "Active" : "Inactive"}
                      </span>
                      <button
                        className={`recruiter-joblist-switch ${
                          job.isActive ? "active" : "inactive"
                        }`}
                        onClick={() => toggleActive(job._id, !job.isActive)}
                        disabled={togglingId === job._id}
                        aria-label="Toggle job status"
                      >
                        <span className="recruiter-joblist-switch-dot" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {!loading && !error && filteredJobs.length > 0 && (
              <div className="recruiter-joblist-pagination">
                <div className="recruiter-joblist-page-controls">
                  <button
                    className="recruiter-joblist-page-nav"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <img src={prevIcon} alt="Previous" />
                  </button>
                  <div className="recruiter-joblist-page-numbers">
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
                        className={`recruiter-joblist-page-num ${currentPage === pageNum ? "active" : ""}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  <button
                    className="recruiter-joblist-page-nav"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <img src={nextIcon} alt="Next" />
                  </button>
                </div>
                <div className="recruiter-joblist-page-info">
                  Showing {startIndex} to {endIndex} of {filteredJobs.length}
                </div>
              </div>
            )}
          </div>
        </div>
        <PortalFooter />
      </div>
    </div>
  );
};

export default RecruiterJobPostingsListPage;




