import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ApplyJobModal from "../components/ApplyJobModal";
import "../styles/JobDetailsPage.css";

// Hero background (reuse Employers Page assets)
import heroBgLeft from "../images/Employers Page Images/8_189.svg";
import heroBgRight from "../images/Employers Page Images/8_197.svg";
import heroCircle from "../images/Employers Page Images/8_205.svg";
import heroIcon1 from "../images/Employers Page Images/8_208.svg";
import heroIcon2 from "../images/Employers Page Images/8_209.svg";

// Job list icons (paths reserved in Job List Page Images)
import locationIcon from "../images/Employers Page Images/location-icond.svg";

// Interview stage icons (placeholders in Job List Page Images)
import stageIcon1 from "../images/Job List Page Images/interview-stage-1.png";
import stageIcon2 from "../images/Job List Page Images/interview-stage-2.png";
import stageIcon3 from "../images/Job List Page Images/interview-stage-3.png";
import stageIcon4 from "../images/Job List Page Images/interview-stage-4.png";
import stageIcon5 from "../images/Job List Page Images/interview-stage-5.png";
import stageIcon6 from "../images/Job List Page Images/interview-stage-6.png";

// Sidebar icons (placeholders in Job List Page Images)
import employeeTypeIcon from "../images/Job List Page Images/employee-type.svg";
import emailIcon from "../images/Job List Page Images/email.svg";
import salaryIcon from "../images/Job List Page Images/salary-icon.svg";
import departmentIcon from "../images/Job List Page Images/department.svg";
import experienceIcon from "../images/Job List Page Images/experience-icon.svg";
import qualificationIcon from "../images/Job List Page Images/qualification.svg";
import levelIcon from "../images/Job List Page Images/job-level-icon.svg";
import genderIcon from "../images/Job List Page Images/gender-icon.png";
import calendarIcon from "../images/Job List Page Images/clock.svg";
import expiryIcon from "../images/Job List Page Images/expiry.svg";

// Default logo
import defaultLogo from "../images/Register Page Images/Default Profile.webp";

type InterviewStage = {
  name: string;
  salary?: string;
};

type JobDetails = {
  id: string;
  _id?: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  companyEmail: string;
  companyLocation: string;
  location: string;
  department: string;
  jobLevel: string;
  jobType: string;
  workMode: string;
  gender: string;
  openings: number;
  deadline: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  requiredSkills: string[];
  experience: string;
  education: string;
  salaryFrom: string;
  salaryTo: string;
  currency: string;
  benefits: string[];
  interviewStages: InterviewStage[];
  createdAt: string;
  companyAbout?: string;
  assessmentId?: string | null;
  assessmentRequired?: boolean;
  assessmentSource?: "admin" | "recruiter";
};

type AssessmentDetails = {
  id: string;
  title: string;
  description: string;
  type: "quiz" | "writing" | "task" | "code";
  difficulty: "beginner" | "intermediate" | "advanced";
  timeLimit?: string;
  maxAttempts?: number;
  quizQuestions?: {
    question: string;
    options: string[];
    correctIndex: number | null;
  }[];
  writingTask?: string;
  writingInstructions?: string;
  writingFormat?: "text" | "file" | "link";
  codeProblem?: string;
  codeLanguages?: string[];
  codeSubmission?: "file" | "repo" | "link";
  codeEvaluation?: string;
  skillTags?: string[];
};

type AssessmentMeta = {
  status: "not_started" | "in_progress" | "submitted";
  attemptsLeft: number;
  activeAttemptId?: string | null;
  latestSubmittedAttemptId?: string | null;
  latestScore?: number | null;
  quizTotal?: number | null;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const parseJsonResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      "API returned HTML instead of JSON. Check frontend API base URL configuration."
    );
  }
  return response.json();
};
const JobDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentError, setAssessmentError] = useState("");
  const [assessmentMeta, setAssessmentMeta] = useState<AssessmentMeta | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const userDataStr = localStorage.getItem("userData");
  let userRole: string | null = null;
  if (userDataStr) {
    try {
      const parsed = JSON.parse(userDataStr);
      const isAdminEmail = parsed?.email === "hirelinknp@gmail.com";
      userRole = isAdminEmail ? "admin" : parsed?.role || null;
    } catch {
      userRole = null;
    }
  }

  const [error, setError] = useState("");
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyProfileResume, setApplyProfileResume] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyError, setApplyError] = useState("");
  const [dismissedApplyToastKey, setDismissedApplyToastKey] = useState("");
  const [useCustomResume, setUseCustomResume] = useState(false);
  const [customResumeFile, setCustomResumeFile] = useState<File | null>(null);
  const [applyNote, setApplyNote] = useState("");
  const [isApplied, setIsApplied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [confirmRequirements, setConfirmRequirements] = useState(false);
  const [confirmResume, setConfirmResume] = useState(false);

  const fetchJobDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/jobs/${id}`);
      const data = await parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(data?.message || "Failed to load job details");
      }
      setJob(data.job);
    } catch {
      setError("No data found currently.");
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchSavedStatus = async () => {
    if (!job?.id && !job?._id) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      const jobId = job.id || job._id;
      const res = await fetch(
        `${API_BASE_URL}/saved-jobs/status/${jobId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await parseJsonResponse(res);
      if (res.ok) {
        setIsSaved(Boolean(data.saved));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchApplyStatus();
    fetchSavedStatus();
  }, [job?.id, job?._id]);

  const fetchApplyStatus = async () => {
    if (!job?.id && !job?._id) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      const jobId = job.id || job._id;
      const res = await fetch(
        `${API_BASE_URL}/applications/status/${jobId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await parseJsonResponse(res);
      if (res.ok) {
        setIsApplied(Boolean(data.applied));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchApplyStatus();
  }, [job?.id, job?._id]);

  useEffect(() => {
    const loadAssessment = async () => {
      if (!job?.assessmentId) {
        setAssessment(null);
        setAssessmentError("");
        return;
      }
      try {
        setAssessmentLoading(true);
        setAssessmentError("");
        const endpoint =
          job.assessmentSource === "admin"
            ? `${API_BASE_URL}/assessments/${job.assessmentId}`
            : `${API_BASE_URL}/recruiter-assessments/${job.assessmentId}`;
        const response = await fetch(endpoint);
        const data = await parseJsonResponse(response);
        if (!response.ok) {
          throw new Error(data?.message || "Failed to load assessment");
        }
        setAssessment({
          id: data.assessment._id || data.assessment.id,
          title: data.assessment.title || "Assessment",
          description: data.assessment.description || "",
          type: data.assessment.type || "quiz",
          difficulty: data.assessment.difficulty || "beginner",
          timeLimit: data.assessment.timeLimit || "",
          maxAttempts: data.assessment.maxAttempts || 1,
          quizQuestions: data.assessment.quizQuestions || [],
          writingTask: data.assessment.writingTask || "",
          writingInstructions: data.assessment.writingInstructions || "",
          writingFormat: data.assessment.writingFormat || "text",
          codeProblem: data.assessment.codeProblem || "",
          codeLanguages: data.assessment.codeLanguages || [],
          codeSubmission: data.assessment.codeSubmission || "file",
          codeEvaluation: data.assessment.codeEvaluation || "",
          skillTags: data.assessment.skillTags || [],
        });
      } catch (err: any) {
        setAssessmentError(err?.message || "Failed to load assessment");
        setAssessment(null);
      } finally {
        setAssessmentLoading(false);
      }
    };

    loadAssessment();
  }, [job?.assessmentId]);

  useEffect(() => {
    const loadAssessmentMeta = async () => {
      if (!job?.assessmentId) {
        setAssessmentMeta(null);
        return;
      }
      const token = localStorage.getItem("authToken");
      if (!token) {
        setAssessmentMeta(null);
        return;
      }
      try {
        const source = job.assessmentSource || "recruiter";

        if (source === "recruiter") {
          const response = await fetch(
            `${API_BASE_URL}/recruiter-assessments/${job.assessmentId}/meta`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          const data = await parseJsonResponse(response);
          if (!response.ok) return;
          const meta = data.meta;
          if (meta) {
            setAssessmentMeta({
              status: meta.status,
              attemptsLeft: meta.attemptsLeft ?? 0,
              activeAttemptId: meta.activeAttemptId || null,
              latestSubmittedAttemptId: meta.latestSubmittedAttemptId || null,
              latestScore:
                typeof meta.latestScore === "number" ? meta.latestScore : null,
              quizTotal:
                typeof meta.quizTotal === "number" ? meta.quizTotal : null,
            });
          }
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/assessments/available`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await parseJsonResponse(response);
        if (!response.ok) {
          return;
        }
        const found = (data.assessments || []).find(
          (item: any) =>
            item.id === job.assessmentId || item.id === job.assessmentId,
        );
        if (found) {
          setAssessmentMeta({
            status: found.status,
            attemptsLeft: found.attemptsLeft ?? 0,
            activeAttemptId: found.activeAttemptId || null,
            latestSubmittedAttemptId: found.latestSubmittedAttemptId || null,
            latestScore:
              typeof found.latestScore === "number" ? found.latestScore : null,
            quizTotal:
              typeof found.quizTotal === "number" ? found.quizTotal : null,
          });
        }
      } catch {
        setAssessmentMeta(null);
      }
    };

    loadAssessmentMeta();
  }, [job?.assessmentId, job?.assessmentSource]);

  const resolveLogo = (logo?: string) => {
    if (!logo) return defaultLogo;
    if (logo.startsWith("http")) return logo;
    return `${import.meta.env.VITE_BACKEND_URL}${logo.startsWith("/") ? "" : "/"}${logo}`;
  };

  const formatWorkMode = (mode?: string) => {
    if (!mode) return "Remote";
    const normalized = mode.toLowerCase();
    if (normalized === "on-site" || normalized === "onsite") return "On-site";
    if (normalized === "hybrid") return "Hybrid";
    return "Remote";
  };

  const formatDate = (value?: string) => {
    if (!value) return "Not specified";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not specified";
    return date.toLocaleDateString();
  };

  const stepIcons = [
    stageIcon1,
    stageIcon2,
    stageIcon3,
    stageIcon4,
    stageIcon5,
    stageIcon6,
  ];

  const displayValue = (value?: string) => {
    if (!value) return "Not specified";
    const trimmed = value.trim();
    return trimmed ? trimmed : "Not specified";
  };

  const formatGender = (value?: string) => {
    const normalized = value?.toLowerCase();
    if (!normalized) return "Not specified";
    if (normalized === "both") return "Male / Female";
    if (normalized === "male") return "Male";
    if (normalized === "female") return "Female";
    return "Not specified";
  };

  const formatDifficulty = (value?: string) => {
    if (!value) return "Beginner";
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const formatRichTextForDisplay = (content?: string) => {
    if (!content) return "";
    const hasHtmlTag = /<\/?[a-z][\s\S]*>/i.test(content);
    return hasHtmlTag ? content : content.replace(/\n/g, "<br />");
  };

  const applyFeedbackMessage = applyError || applyMessage;
  const applyFeedbackType = applyError ? "error" : "success";
  const applyFeedbackKey = `${applyFeedbackType}:${applyFeedbackMessage}`;

  useEffect(() => {
    setDismissedApplyToastKey("");
  }, [applyFeedbackKey]);

  useEffect(() => {
    if (!applyFeedbackMessage) return;
    const timer = window.setTimeout(() => {
      setApplyError("");
      setApplyMessage("");
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [applyFeedbackMessage]);

  const openApplyModal = async () => {
    if (!job || !isCandidate) return;
    if (!canApply) {
      setApplyError("Complete the assessment before applying.");
      return;
    }
    setApplyMessage("");
    setApplyError("");
    setApplyModalOpen(true);
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
      const profileRes = await fetch(`${API_BASE_URL}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = await parseJsonResponse(profileRes);
      if (profileRes.ok) {
        setApplyProfileResume(profileData.user?.resume || "");
      }
    } catch (err) {
      setApplyError("Unable to load resume details.");
    } finally {
      setApplyLoading(false);
    }
  };

  const closeApplyModal = () => {
    setApplyModalOpen(false);
  };

  const toggleSaveJob = async () => {
    const token = localStorage.getItem("authToken");
    if (!token || !job) return;
    const jobId = job.id || job._id;
    try {
      const res = await fetch(`${API_BASE_URL}/saved-jobs/toggle`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      });
      const data = await parseJsonResponse(res);
      if (res.ok) {
        setIsSaved(Boolean(data.saved));
      }
    } catch {
      // ignore
    }
  };

  const handleConfirmApply = async () => {
    if (!confirmRequirements || !confirmResume) {
      setApplyError("Please confirm the requirements and resume review.");
      return;
    }
    if (!job) {
      setApplyError("Job details not loaded.");
      return;
    }
    const token = localStorage.getItem("authToken");
    if (!token) {
      setApplyError("Please log in to apply.");
      return;
    }

    const jobIdToUse = job.id || job._id;
    if (!jobIdToUse) {
      setApplyError("Job ID missing.");
      return;
    }

    setApplyError("");
    try {
      setApplyLoading(true);
      const formData = new FormData();
      formData.append("jobId", jobIdToUse);
      formData.append("message", applyNote || "");
      if (useCustomResume && customResumeFile) {
        formData.append("resume", customResumeFile);
      } else if (applyProfileResume) {
        formData.append("resumeUrl", applyProfileResume);
      }

      const response = await fetch(
        `${API_BASE_URL}/applications/apply`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );
      const data = await parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(data?.message || "Failed to apply");
      }

      setApplyMessage("Application submitted. Recruiter will be notified.");
      setIsApplied(true);
      setApplyModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to apply";
      setApplyError(message);
    } finally {
      setApplyLoading(false);
    }
  };

  const isMandatoryAssessment = Boolean(
    job?.assessmentId && job?.assessmentRequired,
  );
  const isCandidate = userRole === "candidate";
  const isReviewer = userRole === "admin" || userRole === "recruiter";
  const isAssessmentSubmitted = assessmentMeta?.status === "submitted";
  const canApply = !isMandatoryAssessment || isAssessmentSubmitted;

  return (
    <div className="job-details-page">
      <Navbar />
      {applyFeedbackMessage && dismissedApplyToastKey !== applyFeedbackKey && (
        <div className={`apply-feedback-toast ${applyFeedbackType}`}>
          <div className="apply-feedback-toast-head">
            {applyFeedbackType === "success" ? "Success" : "Error"}
          </div>
          <p className="apply-feedback-toast-message">{applyFeedbackMessage}</p>
          <button
            type="button"
            className="apply-feedback-toast-close"
            aria-label="Close toast"
            onClick={() => {
              setDismissedApplyToastKey(applyFeedbackKey);
              setApplyError("");
              setApplyMessage("");
            }}
          >
            x
          </button>
        </div>
      )}

      <section className="job-details-hero">
        <div className="job-details-hero-wrapper">
          <div className="job-details-hero-bg-elements">
            <img src={heroBgLeft} className="job-details-bg-left" alt="" />
            <img src={heroBgRight} className="job-details-bg-right" alt="" />
            <img src={heroCircle} className="job-details-bg-circle" alt="" />
            <img src={heroIcon1} className="job-details-bg-icon-1" alt="" />
            <img src={heroIcon2} className="job-details-bg-icon-2" alt="" />
          </div>
          <div className="job-details-hero-content">
            <div className="job-details-company-header">
              <div className="job-details-logo-wrapper">
                <img
                  src={resolveLogo(job?.companyLogo)}
                  alt={job?.companyName}
                />
              </div>
              <div>
                <h1>{job?.jobTitle || "Job Title"}</h1>
                <p className="job-details-company-name">
                  {job?.companyName || "Company"}
                </p>
              </div>
              {isApplied && (
                <p className="job-details-assessment-note">
                  Applied ? wait for recruiter response.
                </p>
              )}
              {isCandidate && (
                <div className="job-details-hero-actions">
                  <button
                    className={`job-details-primary-btn${isApplied ? " job-details-applied" : ""}`}
                    disabled={!canApply || isApplied}
                    title={
                      isMandatoryAssessment && !isAssessmentSubmitted
                        ? "Complete the assessment before applying."
                        : undefined
                    }
                    onClick={openApplyModal}
                  >
                    {isApplied ? "Applied" : "Apply Now"}
                  </button>
                  <button
                    className="job-details-outline-btn"
                    onClick={toggleSaveJob}
                  >
                    {isSaved ? "Saved" : "Save Job"}
                  </button>
                </div>
              )}
              {isCandidate &&
                isMandatoryAssessment &&
                !isAssessmentSubmitted && (
                  <p className="job-details-assessment-note">
                    Complete the mandatory assessment before applying.
                  </p>
                )}
            </div>
          </div>
        </div>
      </section>

      <section className="job-details-content">
        <div className="job-details-container">
          {loading && <div className="job-details-state">Loading</div>}
          {error && !loading && (
            <div className="job-details-state job-details-error">{error}</div>
          )}

          {!loading && !error && job && (
            <div className="job-details-layout">
              <div className="job-details-main">
                <section className="job-details-section">
                  <h2>About Company</h2>
                  <div
                    className="job-details-richtext job-details-company-about-richtext"
                    dangerouslySetInnerHTML={{
                      __html:
                        job.companyAbout && job.companyAbout.trim() !== ""
                          ? formatRichTextForDisplay(job.companyAbout)
                          : "Company description is not available yet.",
                    }}
                  />
                </section>

                <section className="job-details-section">
                  <h2>Job Overview</h2>
                  <div
                    className="job-details-richtext"
                    dangerouslySetInnerHTML={{
                      __html: formatRichTextForDisplay(
                        job.description || "No job overview provided.",
                      ),
                    }}
                  />
                </section>

                <section className="job-details-section">
                  <h2>Interview Stages</h2>
                  {job.interviewStages && job.interviewStages.length > 0 ? (
                    <div className="job-details-stages-grid">
                      {job.interviewStages.map((stage, index) => (
                        <div
                          className="job-details-stage-card"
                          key={`${stage.name}-${index}`}
                        >
                          <div className="job-details-stage-icon">
                            <img
                              src={stepIcons[index % stepIcons.length]}
                              alt="Step"
                            />
                          </div>
                          <div className="job-details-stage-content">
                            <div className="job-details-stage-step">
                              {String(index + 1).padStart(2, "0")}
                              <span>STEP</span>
                            </div>
                            <div className="job-details-stage-pill">
                              {stage.name}
                            </div>
                            {stage.salary && (
                              <p className="job-details-stage-salary">
                                Salary: {stage.salary}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="job-details-muted">
                      Interview stages will be shared after application.
                    </p>
                  )}
                </section>

                <section className="job-details-section">
                  <h2>Requirements</h2>
                  {job.requirements && job.requirements.length > 0 ? (
                    <ul className="job-details-list">
                      {job.requirements.map((item, index) => (
                        <li key={`req-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="job-details-muted">No requirements listed.</p>
                  )}
                </section>

                <section className="job-details-section">
                  <h2>Responsibilities</h2>
                  {job.responsibilities && job.responsibilities.length > 0 ? (
                    <ul className="job-details-list">
                      {job.responsibilities.map((item, index) => (
                        <li key={`resp-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="job-details-muted">
                      No responsibilities listed.
                    </p>
                  )}
                </section>

                <section className="job-details-section">
                  <h2>Assessment / Quiz</h2>
                  {assessmentLoading && (
                    <p className="job-details-muted">Loading</p>
                  )}
                  {assessmentError && !assessmentLoading && (
                    <p className="job-details-muted">{assessmentError}</p>
                  )}
                  {!assessmentLoading &&
                    !assessmentError &&
                    job.assessmentId &&
                    assessment && (
                      <div className="job-details-assessment">
                        <div className="job-details-assessment-header">
                          <div>
                            <h3>{assessment.title}</h3>
                            <p className="job-details-muted">
                              {formatDifficulty(assessment.difficulty)} ·{" "}
                              {assessment.type.toUpperCase()}
                            </p>
                          </div>
                          <span className="job-details-assessment-badge">
                            {job.assessmentRequired ? "Mandatory" : "Optional"}
                          </span>
                        </div>

                        {assessmentMeta && isCandidate && (
                          <div className="job-details-assessment-status">
                            <span>
                              Status:{" "}
                              {assessmentMeta.status === "in_progress"
                                ? "In progress"
                                : assessmentMeta.status === "submitted"
                                  ? "Submitted"
                                  : "Not started"}
                            </span>
                            <span>
                              Attempts left: {assessmentMeta.attemptsLeft}
                            </span>
                            {assessment.type === "quiz" &&
                              assessmentMeta.latestScore !== null && (
                                <span>
                                  Score: {assessmentMeta.latestScore}/
                                  {assessmentMeta.quizTotal ?? "-"}
                                </span>
                              )}
                          </div>
                        )}

                        <div
                          className="job-details-richtext"
                          dangerouslySetInnerHTML={{
                            __html:
                              assessment.description ||
                              "Assessment instructions are not available.",
                          }}
                        />

                        <div className="job-details-assessment-actions">
                          {isReviewer && (
                            <button
                              className="job-details-outline-btn"
                              onClick={() =>
                                (window.location.href = `/assessments/${job.assessmentId}/preview?source=${job.assessmentSource || "admin"}`)
                              }
                            >
                              View Questions
                            </button>
                          )}
                          {assessmentMeta?.latestSubmittedAttemptId &&
                            isCandidate && (
                              <button
                                className="job-details-outline-btn"
                                onClick={() =>
                                  (window.location.href = `/assessments/${job.assessmentId}/attempts/${assessmentMeta.latestSubmittedAttemptId}?fromJob=${job.id}`)
                                }
                              >
                                View Submission
                              </button>
                            )}
                          {assessmentMeta &&
                            assessmentMeta.status !== "submitted" &&
                            assessmentMeta.attemptsLeft > 0 &&
                            isCandidate && (
                              <button
                                className="job-details-primary-btn"
                                onClick={() => {
                                  const token =
                                    localStorage.getItem("authToken");
                                  if (!token) {
                                    window.location.href = "/login";
                                    return;
                                  }
                                  const attemptId =
                                    assessmentMeta.activeAttemptId;
                                  if (attemptId) {
                                    window.location.href = `/assessments/${job.assessmentId}/attempts/${attemptId}?fromJob=${job.id}`;
                                    return;
                                  }
                                  const base =
                                    job.assessmentSource === "admin"
                                      ? `${API_BASE_URL}/assessments`
                                      : `${API_BASE_URL}/recruiter-assessments`;
                                  (async () => {
                                    try {
                                      const res = await fetch(`${base}/${job.assessmentId}/attempts/start`, {
                                        method: "POST",
                                        headers: {
                                          Authorization: `Bearer ${token}`,
                                          "Content-Type": "application/json",
                                        },
                                      });
                                      const data = await parseJsonResponse(res);
                                      if (!res.ok) return;
                                      const newAttempt = data.attempt?._id || data.attempt?.id;
                                      if (newAttempt) {
                                        window.location.href = `/assessments/${job.assessmentId}/attempts/${newAttempt}?fromJob=${job.id}`;
                                      }
                                    } catch {
                                      // ignore
                                    }
                                  })();
                                }}
                              >
                                {assessmentMeta.status === "in_progress"
                                  ? "Resume Assessment"
                                  : "Start Assessment"}
                              </button>
                            )}
                          {assessmentMeta &&
                            assessmentMeta.status !== "submitted" &&
                            assessmentMeta.attemptsLeft === 0 &&
                            isCandidate && (
                              <span className="job-details-muted">
                                No attempts remaining.
                              </span>
                            )}
                        </div>

                        <p className="job-details-muted">
                          Assessment questions are shown after you start the
                          assessment.
                        </p>
                      </div>
                    )}
                  {!assessmentLoading &&
                    !assessmentError &&
                    !job.assessmentId && (
                      <p className="job-details-muted">
                        No assessment required for this role.
                      </p>
                    )}
                </section>
              </div>

              <aside className="job-details-sidebar">
                <div className="job-details-card">
                  <h3>Overview</h3>
                  <div className="job-details-info-item">
                    <img src={employeeTypeIcon} alt="Employee Type" />
                    <div>
                      <span>Employee Type</span>
                      <strong>
                        {job.jobType} / {formatWorkMode(job.workMode)}
                      </strong>
                    </div>
                  </div>
                  <div className="job-details-info-item">
                    <img src={locationIcon} alt="Location" />
                    <div>
                      <span>Location</span>
                      <strong>
                        {displayValue(job.location || job.companyLocation)}
                      </strong>
                    </div>
                  </div>
                  <div className="job-details-info-item">
                    <img src={emailIcon} alt="Email" />
                    <div>
                      <span>Email</span>
                      <strong>{job.companyEmail || "Not provided"}</strong>
                    </div>
                  </div>
                  <div className="job-details-info-item">
                    <img src={salaryIcon} alt="Salary" />
                    <div>
                      <span>Salary</span>
                      <strong>
                        {job.currency} {job.salaryFrom} - {job.salaryTo}
                      </strong>
                    </div>
                  </div>
                  <div className="job-details-info-item">
                    <img src={departmentIcon} alt="Department" />
                    <div>
                      <span>Department</span>
                      <strong>{job.department || "Not specified"}</strong>
                    </div>
                  </div>
                  <div className="job-details-info-item">
                    <img src={experienceIcon} alt="Experience" />
                    <div>
                      <span>Experience</span>
                      <strong>{displayValue(job.experience)}</strong>
                    </div>
                  </div>
                  <div className="job-details-info-item">
                    <img src={qualificationIcon} alt="Qualification" />
                    <div>
                      <span>Qualification</span>
                      <strong>{displayValue(job.education)}</strong>
                    </div>
                  </div>
                  <div className="job-details-info-item">
                    <img src={levelIcon} alt="Job Level" />
                    <div>
                      <span>Job Level</span>
                      <strong>{job.jobLevel || "Not specified"}</strong>
                    </div>
                  </div>
                  <div className="job-details-info-item">
                    <img src={genderIcon} alt="Gender" />
                    <div>
                      <span>Gender</span>
                      <strong>{formatGender(job.gender)}</strong>
                    </div>
                  </div>
                  <div className="job-details-info-item">
                    <img src={calendarIcon} alt="Date Posted" />
                    <div>
                      <span>Date Posted</span>
                      <strong>{formatDate(job.createdAt)}</strong>
                    </div>
                  </div>
                  <div className="job-details-info-item">
                    <img src={expiryIcon} alt="Expiration Date" />
                    <div>
                      <span>Expiration Date</span>
                      <strong>{formatDate(job.deadline)}</strong>
                    </div>
                  </div>
                </div>

                <div className="job-details-card job-details-skills">
                  <h3>Skills</h3>
                  <div className="job-details-skill-tags">
                    {job.requiredSkills && job.requiredSkills.length > 0 ? (
                      job.requiredSkills.map((skill, index) => (
                        <span key={`${skill}-${index}`}>{skill}</span>
                      ))
                    ) : (
                      <span>Not specified</span>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      <ApplyJobModal
        isOpen={applyModalOpen}
        loading={applyLoading}
        job={job}
        profileResume={applyProfileResume}
        useCustomResume={useCustomResume}
        customResumeFile={customResumeFile}
        applyNote={applyNote}
        confirmRequirements={confirmRequirements}
        confirmResume={confirmResume}
        onClose={closeApplyModal}
        onConfirm={handleConfirmApply}
        onUseCustomResumeChange={setUseCustomResume}
        onCustomResumeChange={setCustomResumeFile}
        onApplyNoteChange={setApplyNote}
        onConfirmRequirementsChange={setConfirmRequirements}
        onConfirmResumeChange={setConfirmResume}
      />
      <Footer />
    </div>
  );
};

export default JobDetailsPage;










