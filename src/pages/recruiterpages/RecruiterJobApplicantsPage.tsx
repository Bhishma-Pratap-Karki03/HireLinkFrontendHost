import PortalFooter from "../../components/PortalFooter";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RecruiterSidebar from "../../components/recruitercomponents/RecruiterSidebar";
import RecruiterTopBar from "../../components/recruitercomponents/RecruiterTopBar";
import RecruiterAtsDetailsOverlay from "../../components/recruitercomponents/RecruiterAtsDetailsOverlay";
import "../../styles/RecruiterJobApplicantsPage.css";
import defaultAvatar from "../../images/Register Page Images/Default Profile.webp";
import actionMessageIcon from "../../images/Candidate Profile Page Images/message-icon.svg";
import actionEyeIcon from "../../images/Candidate Profile Page Images/eyeIcon.svg";
import dropdownArrow from "../../images/Register Page Images/1_2307.svg";
import statsCandidatesIcon from "../../images/Candidate Profile Page Images/statsCandidatesIcon.png";
import unreadMessageIcon from "../../images/Candidate Profile Page Images/rejected-icon.png";

type CandidateInfo = {
  id?: string;
  _id?: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  currentJobTitle?: string;
};

type AssessmentSummary = {
  attached: boolean;
  required: boolean;
  source: "admin" | "recruiter" | null;
  type: "quiz" | "writing" | "task" | "code" | null;
  title: string;
  submitted: boolean;
  submittedAt: string | null;
  score: number | null;
  quizTotal: number | null;
  writingResponse: string;
  writingLink: string;
  codeResponse: string;
  codeLink: string;
};

type ApplicantItem = {
  id: string;
  candidate: CandidateInfo;
  atsScore?: number | null;
  resumeUrl: string;
  resumeFileName: string;
  resumeFileSize: number;
  message: string;
  status: string;
  appliedAt: string;
  assessment?: AssessmentSummary;
};

type JobInfo = {
  jobTitle: string;
  location: string;
  jobType: string;
  deadline: string;
  assessmentRequired?: boolean;
};

type ReportItem = {
  _id: string;
  application?: string | { _id: string };
  candidate: CandidateInfo;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  skillsScore?: number;
  experienceScore?: number;
  experienceMatch?: boolean;
  extracted?: {
    experienceYears?: number;
  };
  updatedAt?: string;
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
    throw new Error("API returned HTML instead of JSON. Check API base URL.");
  }
  return JSON.parse(text);
};

const resolveAvatar = (profilePicture?: string) => {
  if (!profilePicture) return defaultAvatar;
  if (profilePicture.startsWith("http")) return profilePicture;
  return `${import.meta.env.VITE_BACKEND_URL}${profilePicture}`;
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
};

const getApplicationId = (report: ReportItem) => {
  if (!report.application) return "";
  if (typeof report.application === "string") return report.application;
  const raw = report.application as any;
  if (raw?._id) return String(raw._id);
  if (typeof raw?.toString === "function") return String(raw.toString());
  return "";
};

const getCandidateId = (candidate?: CandidateInfo | string | null) => {
  if (!candidate) return "";
  if (typeof candidate === "string") return candidate;
  return candidate.id || candidate._id || "";
};

const STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "reviewed", label: "Reviewed" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview", label: "Interview" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
];

const RecruiterJobApplicantsPage = () => {
  const apiBaseUrl = resolveApiBaseUrl();
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobInfo | null>(null);
  const [applications, setApplications] = useState<ApplicantItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [atsToastMessage, setAtsToastMessage] = useState("");
  const [atsToastType, setAtsToastType] = useState<"success" | "error">(
    "success",
  );
  const [runningMode, setRunningMode] = useState<"all" | "new" | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!atsToastMessage) return;
    const timer = window.setTimeout(() => {
      setAtsToastMessage("");
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [atsToastMessage]);

  const reportsByApplicationId = useMemo(
    () =>
      reports.reduce((acc: Record<string, ReportItem>, report) => {
        const applicationId = getApplicationId(report);
        if (applicationId) acc[applicationId] = report;
        return acc;
      }, {}),
    [reports],
  );

  const loadApplicantsAndAts = async () => {
    if (!id) {
      setError("Invalid job id");
      return;
    }
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [applicationsRes, atsRes] = await Promise.all([
        fetch(`${apiBaseUrl}/applications/job/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiBaseUrl}/ats/results/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const applicationsData = await parseJsonResponse(applicationsRes);
      const atsData = await parseJsonResponse(atsRes);

      if (!applicationsRes.ok) {
        throw new Error(
          applicationsData?.message || "Failed to load applicants",
        );
      }
      if (!atsRes.ok) {
        throw new Error(atsData?.message || "Failed to load ATS ranking");
      }
      setJob(applicationsData.job || atsData.job || null);
      setApplications(applicationsData.applications || []);
      setReports(atsData.reports || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load applicants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplicantsAndAts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".recruiter-applicant-status-dropdown")) return;
      setOpenStatusDropdownId(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const runAts = async (mode: "all" | "new") => {
    if (!id) return;
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setRunningMode(mode);
      setAtsToastMessage("");

      const scanRes = await fetch(`${apiBaseUrl}/ats/scan/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode }),
      });
      const scanData = await parseJsonResponse(scanRes);
      if (!scanRes.ok) {
        throw new Error(scanData?.message || "Failed to run ATS scan");
      }
      setAtsToastType("success");
      setAtsToastMessage(scanData?.message || "ATS scan completed.");
      await loadApplicantsAndAts();
    } catch (err: any) {
      setAtsToastType("error");
      setAtsToastMessage(err?.message || "Failed to run ATS");
    } finally {
      setRunningMode(null);
    }
  };

  const handleStatusChange = async (
    applicationId: string,
    nextStatus: string,
  ) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      setStatusUpdating(applicationId);
      const res = await fetch(
        `${apiBaseUrl}/applications/${applicationId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update status");
      }

      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: nextStatus } : app,
        ),
      );
    } catch (err: any) {
      setError(err?.message || "Failed to update status");
    } finally {
      setStatusUpdating(null);
    }
  };

  const openApplicantOverlay = (report: ReportItem) => {
    setSelectedReport(report);
  };

  const openCandidateMessage = (candidateId: string) => {
    if (!candidateId) {
      setError("Unable to open inbox for this applicant right now.");
      return;
    }
    navigate(`/recruiter/messages?user=${candidateId}`);
  };

  const rankedApplications = [...applications]
    .sort((a, b) => {
      const scoreA = reportsByApplicationId[a.id]?.score ?? a.atsScore ?? 0;
      const scoreB = reportsByApplicationId[b.id]?.score ?? b.atsScore ?? 0;
      return scoreB - scoreA;
    })
    .map((application, index) => {
      const isUnscoredApplicant =
        application.atsScore === null ||
        typeof application.atsScore === "undefined";
      const scoreValue =
        typeof reportsByApplicationId[application.id]?.score === "number"
          ? reportsByApplicationId[application.id].score
          : typeof application.atsScore === "number"
            ? application.atsScore
            : null;

      return {
        application,
        rank: index + 1,
        isNewApplicant: isUnscoredApplicant,
        isUnscoredApplicant,
        scoreValue,
        report:
          reportsByApplicationId[application.id] ||
          ({
            _id: `fallback-${application.id}`,
            application: application.id,
            candidate: application.candidate,
            score:
              typeof application.atsScore === "number"
                ? application.atsScore
                : 0,
            matchedSkills: [],
            missingSkills: [],
            experienceMatch: false,
            extracted: { experienceYears: 0 },
          } as ReportItem),
      };
    });

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredRankedApplications = rankedApplications.filter(
    ({ application, report }) => {
      if (!normalizedQuery) return true;
      const fullName = (
        report.candidate?.fullName ||
        application.candidate?.fullName ||
        ""
      ).toLowerCase();
      const email = (
        report.candidate?.email ||
        application.candidate?.email ||
        ""
      ).toLowerCase();
      return (
        fullName.includes(normalizedQuery) || email.includes(normalizedQuery)
      );
    },
  );

  const selectedApplication = selectedReport
    ? applications.find(
        (application) => application.id === getApplicationId(selectedReport),
      )
    : undefined;

  const unscoredOrNewApplicants = applications.filter(
    (item) =>
      item.atsScore === null || typeof item.atsScore === "undefined",
  ).length;

  return (
    <div className="recruiter-applicants-layout">
      <RecruiterSidebar />
      <main className="recruiter-applicants-main">
        <div className="recruiter-applicants-topbar-wrapper">
          <RecruiterTopBar
            showSearch
            searchPlaceholder="Search applicants by name or email..."
            onSearch={setSearchQuery}
          />
        </div>
        <div className="recruiter-applicants-scrollable-content">
          <div className="recruiter-applicants-content">
            {atsToastMessage && (
              <div
                className={`recruiter-applicants-toast ${
                  atsToastType === "success" ? "success" : "error"
                }`}
              >
                <div className="recruiter-applicants-toast-head">
                  {atsToastType === "success" ? "Success" : "Error"}
                </div>
                <p className="recruiter-applicants-toast-message">
                  {atsToastMessage}
                </p>
                <button
                  type="button"
                  className="recruiter-applicants-toast-close"
                  onClick={() => setAtsToastMessage("")}
                  aria-label="Close toast"
                >
                  x
                </button>
              </div>
            )}
            <div className="recruiter-applicants-header">
              <div>
                <h1>Applicants</h1>
                {job && (
                  <p>
                    {job.jobTitle} - {job.location} - {job.jobType} - Deadline:{" "}
                    {formatDate(job.deadline)}
                  </p>
                )}
              </div>
              <button
                className="recruiter-applicants-back"
                onClick={() => navigate("/recruiter/job-postings")}
              >
                Back to Job Posts
              </button>
            </div>

            <div className="recruiter-applicants-summary-grid">
              <article className="recruiter-applicants-summary-card">
                <div>
                  <span>Total Applicants</span>
                  <strong>{applications.length}</strong>
                </div>
                <img src={statsCandidatesIcon} alt="Total applicants" />
              </article>
              <article className="recruiter-applicants-summary-card">
                <div>
                  <span>Unscored (New)</span>
                  <strong>{unscoredOrNewApplicants}</strong>
                </div>
                <img src={unreadMessageIcon} alt="Unscored applicants" />
              </article>
            </div>

            <div className="recruiter-applicants-ats-callout">
              <div>
                <h2>ATS Controls</h2>
                <p>
                  Applicants are loaded first for quick review. Run ATS manually
                  when you need fresh ranking.
                </p>
              </div>
              <div className="recruiter-applicants-ats-actions">
                <button
                  type="button"
                  className="recruiter-applicants-ats-btn"
                  onClick={() => runAts("all")}
                  disabled={runningMode !== null}
                >
                  {runningMode === "all" ? "Running..." : "Run ATS (All)"}
                </button>
                <button
                  type="button"
                  className="recruiter-applicants-ats-btn secondary"
                  onClick={() => runAts("new")}
                  disabled={runningMode !== null}
                >
                  {runningMode === "new" ? "Running..." : "Run ATS (New Only)"}
                </button>
              </div>
            </div>

            {loading && (
              <div className="recruiter-applicants-state">Loading</div>
            )}
            {error && !loading && (
              <div className="recruiter-applicants-state error">{error}</div>
            )}
            {!loading && !error && applications.length === 0 && (
              <div className="recruiter-applicants-state">
                No applicants for this job yet.
              </div>
            )}

            {!loading &&
              !error &&
              applications.length > 0 &&
              filteredRankedApplications.length === 0 && (
                <div className="recruiter-applicants-state">
                  No applicants match "{searchQuery}".
                </div>
              )}

            <div className="recruiter-applicants-list">
              {filteredRankedApplications.map(
                ({
                  application,
                  report,
                  rank,
                  isNewApplicant,
                  isUnscoredApplicant,
                  scoreValue,
                }) => {
                  const candidateId =
                    getCandidateId(report.candidate) ||
                    getCandidateId(application.candidate);
                  return (
                    <article
                      key={application.id}
                      className={`recruiter-applicant-card ${
                        openStatusDropdownId === application.id
                          ? "status-open"
                          : ""
                      }`}
                    >
                      <div className="recruiter-applicant-info recruiter-ats-top-row">
                        <div className="recruiter-applicant-left">
                          <div className="recruiter-ats-rank">#{rank}</div>
                          <img
                            src={resolveAvatar(report.candidate.profilePicture)}
                            alt={report.candidate.fullName}
                            className="recruiter-applicant-avatar"
                          />
                          <div className="recruiter-applicant-user">
                            <div className="recruiter-applicant-user-row">
                              <h3>{report.candidate.fullName}</h3>
                              {isNewApplicant ? (
                                <span className="recruiter-applicant-new-badge">
                                  New
                                </span>
                              ) : null}
                            </div>
                            <p>
                              {report.candidate.currentJobTitle || "Candidate"}
                            </p>
                            <span>{report.candidate.email}</span>
                            <small>
                              Applied on {formatDate(application.appliedAt)}
                            </small>
                          </div>
                        </div>
                        <div className="recruiter-applicant-status-inline">
                          <span>Status</span>
                          <div className="recruiter-applicant-status-control recruiter-applicant-status-dropdown">
                            <button
                              type="button"
                              className={`recruiter-applicant-status-trigger ${
                                openStatusDropdownId === application.id
                                  ? "open"
                                  : ""
                              }`}
                              onClick={() =>
                                setOpenStatusDropdownId((prev) =>
                                  prev === application.id
                                    ? null
                                    : application.id,
                                )
                              }
                              disabled={statusUpdating === application.id}
                            >
                              <span>
                                {STATUS_OPTIONS.find(
                                  (item) => item.value === application.status,
                                )?.label || "Submitted"}
                              </span>
                              <img
                                src={dropdownArrow}
                                alt=""
                                aria-hidden="true"
                                className={`recruiter-applicant-status-caret ${
                                  openStatusDropdownId === application.id
                                    ? "open"
                                    : ""
                                }`}
                              />
                            </button>
                            {openStatusDropdownId === application.id && (
                              <div
                                className="recruiter-applicant-status-menu"
                                role="listbox"
                              >
                                {STATUS_OPTIONS.map((statusOption) => (
                                  <button
                                    key={statusOption.value}
                                    type="button"
                                    className={`recruiter-applicant-status-option ${
                                      application.status === statusOption.value
                                        ? "active"
                                        : ""
                                    }`}
                                    onClick={() => {
                                      setOpenStatusDropdownId(null);
                                      if (
                                        application.status ===
                                        statusOption.value
                                      )
                                        return;
                                      handleStatusChange(
                                        application.id,
                                        statusOption.value,
                                      );
                                    }}
                                  >
                                    {statusOption.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="recruiter-applicant-score recruiter-ats-score">
                          <span>Score</span>
                          <strong>{isUnscoredApplicant ? "-" : scoreValue ?? "-"}</strong>
                        </div>
                        <div className="recruiter-applicant-top-actions">
                          <button
                            type="button"
                            className="recruiter-applicant-icon-btn"
                            onClick={() => openApplicantOverlay(report)}
                            title="View ATS details"
                          >
                            <img src={actionEyeIcon} alt="View ATS details" />
                          </button>
                          <button
                            type="button"
                            className="recruiter-applicant-icon-btn"
                            onClick={() => openCandidateMessage(candidateId)}
                            title="Message candidate"
                          >
                            <img
                              src={actionMessageIcon}
                              alt="Message candidate"
                            />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          </div>

          <RecruiterAtsDetailsOverlay
            open={Boolean(selectedReport)}
            report={selectedReport}
            application={selectedApplication}
            statusUpdating={statusUpdating}
            onClose={() => setSelectedReport(null)}
            onStatusChange={handleStatusChange}
            onViewAssessment={(applicationId) =>
              navigate(
                `/recruiter/job-postings/${id}/applicants/${applicationId}/assessment`,
              )
            }
          />
          <PortalFooter />
        </div>
      </main>
    </div>
  );
};

export default RecruiterJobApplicantsPage;


