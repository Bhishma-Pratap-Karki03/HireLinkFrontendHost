import PortalFooter from "../../components/PortalFooter";
import { useEffect, useMemo, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useNavigate } from "react-router-dom";
import CandidateTopBar from "../../components/candidatecomponents/CandidateTopBar";
import SideNavigation from "../../components/candidatecomponents/CandidateSidebar";
import "../../styles/JobListingPage.css";
import "../../styles/SavedJobsPage.css";

import locationIcon from "../../images/Job List Page Images/location.svg";
import jobTypeIcon from "../../images/Job List Page Images/job-type.svg";
import workModeIcon from "../../images/Job List Page Images/work-mode.svg";
import savedBookmarkIcon from "../../images/Recruiter Job Post Page Images/bookmarkFilled.svg";
import shareIcon from "../../images/Recruiter Job Post Page Images/shareFg.svg";
import defaultLogo from "../../images/Recruiter Job Post Page Images/companyLogo.png";
import closeIcon from "../../images/Candidate Profile Page Images/corss icon.png";
import prevIcon from "../../images/Employers Page Images/Prev Icon.svg";
import nextIcon from "../../images/Employers Page Images/Next Icon.svg";

type SavedJobItem = {
  id: string;
  jobId: string;
  companyName: string;
  jobTitle: string;
  workMode: string;
  location: string;
  jobType: string;
  companyLogo?: string;
};

const SavedJobsPage = () => {
  const ITEMS_PER_PAGE = 20;
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyJobId, setApplyJobId] = useState<string | null>(null);
  const [applyJobDetails, setApplyJobDetails] = useState<any>(null);
  const [applyProfileResume, setApplyProfileResume] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyError, setApplyError] = useState("");
  const [useCustomResume, setUseCustomResume] = useState(false);
  const [customResumeFile, setCustomResumeFile] = useState<File | null>(null);
  const [applyNote, setApplyNote] = useState("");
  const [confirmRequirements, setConfirmRequirements] = useState(false);
  const [confirmResume, setConfirmResume] = useState(false);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };
  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "link",
  ];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const resolveLogo = (logo?: string) => {
    if (!logo) return defaultLogo;
    if (logo.startsWith("http")) return logo;
    return `http://localhost:5000${logo.startsWith("/") ? "" : "/"}${logo}`;
  };

  const formatWorkMode = (mode?: string) => {
    if (!mode) return "Remote";
    const normalized = mode.toLowerCase();
    if (normalized === "on-site" || normalized === "onsite") return "On-site";
    if (normalized === "hybrid") return "Hybrid";
    return "Remote";
  };


  const fetchAppliedStatuses = async (jobIds: string[]) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      const entries = await Promise.all(
        jobIds.map(async (jobId) => {
          const res = await fetch(
            `http://localhost:5000/api/applications/status/${jobId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await res.json();
          return [jobId, Boolean(data.applied)];
        })
      );
      const map = Object.fromEntries(entries);
      setAppliedJobs(map);
    } catch {
      // ignore
    }
  };

  const toggleSavedJob = async (jobId: string) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Please log in to manage saved jobs.");
      return;
    }
    try {
      setSavingJobId(jobId);
      const res = await fetch("http://localhost:5000/api/saved-jobs/toggle", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update saved jobs");
      }
      if (data.saved === false) {
        setSavedJobs((prev) => prev.filter((job) => job.jobId !== jobId));
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update saved jobs");
    } finally {
      setSavingJobId(null);
    }
  };


  const openApplyModal = async (jobId: string) => {
    setApplyMessage("");
    setApplyError("");
    setApplyModalOpen(true);
    setApplyJobId(jobId);
    setApplyJobDetails(null);
    setUseCustomResume(false);
    setCustomResumeFile(null);
    setApplyNote("");
    setConfirmRequirements(false);
    setConfirmResume(false);

    const token = localStorage.getItem("authToken");
    if (!token) {
      setApplyError("Please log in to apply.");
      return;
    }
    try {
      setApplyLoading(true);
      const [jobRes, profileRes] = await Promise.all([
        fetch(`http://localhost:5000/api/jobs/${jobId}`),
        fetch("http://localhost:5000/api/profile/me", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const jobData = await jobRes.json();
      const profileData = await profileRes.json();
      if (jobRes.ok) {
        setApplyJobDetails(jobData.job);
      }
      if (profileRes.ok) {
        setApplyProfileResume(profileData.user?.resume || "");
      }
    } catch {
      setApplyError("Unable to load application details.");
    } finally {
      setApplyLoading(false);
    }
  };

  const closeApplyModal = () => {
    setApplyModalOpen(false);
  };

  const handleConfirmApply = async () => {
    if (!confirmRequirements || !confirmResume) {
      setApplyError("Please confirm the requirements and resume review.");
      return;
    }
    if (!applyJobId) {
      setApplyError("Job ID missing.");
      return;
    }
    const token = localStorage.getItem("authToken");
    if (!token) {
      setApplyError("Please log in to apply.");
      return;
    }

    setApplyError("");
    try {
      setApplyLoading(true);
      const formData = new FormData();
      formData.append("jobId", applyJobId);
      formData.append("message", applyNote || "");
      if (useCustomResume && customResumeFile) {
        formData.append("resume", customResumeFile);
      } else if (applyProfileResume) {
        formData.append("resumeUrl", applyProfileResume);
      }

      const response = await fetch("http://localhost:5000/api/applications/apply", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to apply");
      }

      setApplyMessage("Application submitted. Recruiter will be notified.");
      setAppliedJobs((prev) => ({ ...prev, [applyJobId]: true }));
      setTimeout(() => {
        setApplyModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setApplyError(err?.message || "Failed to apply");
    } finally {
      setApplyLoading(false);
    }
  };

  useEffect(() => {
    const fetchSaved = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        setLoading(true);
        setError("");
        const res = await fetch("http://localhost:5000/api/saved-jobs/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load saved jobs");
        }

        const mapped = (data.savedJobs || []).map((item: any) => {
          const job = item.job || {};
          return {
            id: item._id || item.id,
            jobId: job._id || job.id,
            companyName: job.companyName || job.department || "Company",
            jobTitle: job.jobTitle || "Untitled Role",
            workMode: job.workMode || "Remote",
            location: job.location || "Location",
            jobType: job.jobType || "Full-Time",
            companyLogo: job.companyLogo || "",
          };
        });

        setSavedJobs(mapped);
        fetchAppliedStatuses(mapped.map((j: SavedJobItem) => j.jobId));
      } catch (err: any) {
        setError(err?.message || "Failed to load saved jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchSaved();
  }, [navigate]);

  const filteredSavedJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return savedJobs;

    return savedJobs.filter((job) =>
      [
        job.jobTitle,
        job.companyName,
        job.location,
        job.jobType,
        job.workMode,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [savedJobs, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSavedJobs.length / ITEMS_PER_PAGE),
  );

  const paginatedSavedJobs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSavedJobs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSavedJobs, currentPage]);

  const visiblePages = useMemo(
    () => Array.from({ length: Math.min(totalPages, 7) }, (_, index) => index + 1),
    [totalPages],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="candidate-dashboard-container">
      <SideNavigation />
      <main className="savedjobs-main joblist-page">
        <CandidateTopBar
          showSearch
          onSearch={setSearchQuery}
          searchPlaceholder="Search saved jobs by role, company, city, location..."
        />

        <div className="savedjobs-header">
          <h1>Saved Jobs</h1>
          <p>Jobs you bookmarked for later review.</p>
        </div>

        {loading && <div className="savedjobs-state">Loading...</div>}
        {error && !loading && (
          <div className="savedjobs-state savedjobs-error">{error}</div>
        )}

        {!loading && !error && savedJobs.length === 0 && (
          <div className="savedjobs-empty">No saved jobs yet.</div>
        )}
        {!loading && !error && savedJobs.length > 0 && filteredSavedJobs.length === 0 && (
          <div className="savedjobs-empty">No jobs match your search.</div>
        )}

        <div className="joblist-grid savedjobs-grid">
          {paginatedSavedJobs.map((job) => (
            <article key={job.id} className="joblist-card-item savedjobs-card">
              <div className="joblist-card-top">
                <img
                  src={resolveLogo(job.companyLogo)}
                  alt={job.companyName}
                  className="joblist-company-logo"
                />
                <div className="joblist-card-actions">
                  <button
                    className="joblist-icon-btn"
                    onClick={() => toggleSavedJob(job.jobId)}
                    disabled={savingJobId === job.jobId}
                  >
                    <img src={savedBookmarkIcon} alt="Saved" />
                  </button>
                  <button className="joblist-icon-btn">
                    <img src={shareIcon} alt="Share" />
                  </button>
                </div>
              </div>
              <div className="joblist-card-company">{job.companyName}</div>
              <div className="joblist-card-meta">
                <img src={workModeIcon} alt="Work mode" />
                {formatWorkMode(job.workMode)}
              </div>
              <h3 className="joblist-card-title">{job.jobTitle}</h3>
              <div className="joblist-card-info">
                <span>
                  <img src={locationIcon} alt="Location" />
                  {job.location}
                </span>
                <span>
                  <img src={jobTypeIcon} alt="Job type" />
                  {job.jobType}
                </span>
              </div>
              <div className="joblist-card-buttons">
                <button
                  className="joblist-btn-outline"
                  onClick={() => navigate(`/jobs/${job.jobId}`)}
                >
                  View Details
                </button>
                <button
                  className="joblist-btn-primary"
                  onClick={() => openApplyModal(job.jobId)}
                  disabled={appliedJobs[job.jobId]}
                >
                  {appliedJobs[job.jobId] ? "Applied" : "Apply Now"}
                </button>
              </div>
            </article>
          ))}
        </div>
        {!loading && !error && filteredSavedJobs.length > 0 && (
          <div className="joblist-pagination">
            <div className="joblist-page-info">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
              {(currentPage - 1) * ITEMS_PER_PAGE + paginatedSavedJobs.length} of{" "}
              {filteredSavedJobs.length}
            </div>
            <div className="joblist-page-controls">
              <button
                className="joblist-page-nav"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <img src={prevIcon} alt="Previous" />
              </button>
              <div className="joblist-page-numbers">
                {visiblePages.map((pageNumber) => (
                  <span
                    key={pageNumber}
                    className={`joblist-page-num ${
                      pageNumber === currentPage ? "joblist-active" : ""
                    }`}
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </span>
                ))}
              </div>
              <button
                className="joblist-page-nav"
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
      {applyModalOpen && (
        <div className="apply-modal-overlay">
          <div className="apply-modal">
            <div className="apply-modal-header">
              <div>
                <h3>Confirm Application</h3>
                <p>Review your resume and confirm the requirements before applying.</p>
              </div>
              <button className="apply-modal-close" onClick={closeApplyModal}>
                <img src={closeIcon} alt="Close" />
              </button>
            </div>

            {applyLoading && <p>Loading details...</p>}
            {!applyLoading && applyJobDetails && (
              <div className="apply-modal-body">
                <div className="apply-modal-section">
                  <h4>{applyJobDetails.jobTitle}</h4>
                  <p className="apply-modal-muted">{applyJobDetails.companyName}</p>
                </div>

                <div className="apply-modal-section">
                  <h5>Resume</h5>
                  {applyProfileResume ? (
                    <a
                      href={`http://localhost:5000${applyProfileResume}`}
                      target="_blank"
                      rel="noreferrer"
                      className="apply-modal-link"
                    >
                      View current resume
                    </a>
                  ) : (
                    <p className="apply-modal-muted">No resume on profile.</p>
                  )}
                  <label className="apply-modal-checkbox">
                    <input
                      type="checkbox"
                      checked={useCustomResume}
                      onChange={(e) => setUseCustomResume(e.target.checked)}
                    />
                    Use a different resume for this application (won't change your profile)
                  </label>
                  {useCustomResume && (
                    <label className="apply-modal-upload">
                      <input
                        type="file"
                        onChange={(e) =>
                          setCustomResumeFile(e.target.files ? e.target.files[0] : null)
                        }
                      />
                      <div className="apply-modal-upload-inner">
                        <span className="apply-modal-upload-title">Upload new resume</span>
                        <span className="apply-modal-upload-subtitle">PDF or DOCX ? Max 5MB</span>
                        {customResumeFile && (
                          <>
                            <span className="apply-modal-upload-file">
                              {customResumeFile.name}
                            </span>
                            <button
                              type="button"
                              className="apply-modal-link apply-modal-preview-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                const url = URL.createObjectURL(customResumeFile);
                                window.open(url, "_blank", "noopener,noreferrer");
                              }}
                            >
                              Preview selected resume
                            </button>
                          </>
                        )}
                      </div>
                    </label>
                  )}
                </div>

                <div className="apply-modal-divider" />

                <div className="apply-modal-section">
                  <h5>Requirements</h5>
                  <p className="apply-modal-muted">
                    Education: {applyJobDetails.education || "Not specified"}
                  </p>
                  <p className="apply-modal-muted">
                    Experience: {applyJobDetails.experience || "Not specified"}
                  </p>
                  <label className="apply-modal-checkbox">
                    <input
                      type="checkbox"
                      checked={confirmRequirements}
                      onChange={(e) => setConfirmRequirements(e.target.checked)}
                    />
                    I confirm I meet the listed requirements.
                  </label>
                </div>

                <div className="apply-modal-divider" />

                <div className="apply-modal-section">
                  <h5>Message to recruiter (optional)</h5>
                  <div className="apply-modal-quill">
                    <ReactQuill
                      theme="snow"
                      value={applyNote}
                      onChange={setApplyNote}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="Add a short note for the recruiter..."
                    />
                  </div>
                </div>

                <label className="apply-modal-checkbox">
                  <input
                    type="checkbox"
                    checked={confirmResume}
                    onChange={(e) => setConfirmResume(e.target.checked)}
                  />
                  I have reviewed my resume and want to apply.
                </label>
              </div>
            )}

            {applyError && <div className="apply-modal-error">{applyError}</div>}
            {applyMessage && <div className="apply-modal-success">{applyMessage}</div>}

            <div className="apply-modal-actions">
              <button className="apply-modal-secondary" onClick={closeApplyModal}>
                Cancel
              </button>
              <button
                className="apply-modal-primary"
                onClick={handleConfirmApply}
                disabled={applyLoading}
              >
                Confirm & Apply
              </button>
            </div>
          </div>
        </div>
      )}

              <PortalFooter />
</main>
    </div>
  );
};

export default SavedJobsPage;


