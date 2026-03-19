import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/AssessmentAttemptPage.css";

type Assessment = {
  id: string;
  title: string;
  description: string;
  type: "quiz" | "writing" | "task" | "code";
  timeLimit: string;
  maxAttempts: number;
  quizQuestions?: { question: string; options: string[]; correctIndex: number }[];
  writingTask?: string;
  writingInstructions?: string;
  writingFormat?: "text" | "file" | "link";
  codeProblem?: string;
  codeLanguages?: string[];
  codeSubmission?: "file" | "link";
  codeEvaluation?: string;
};

type Attempt = {
  id: string;
  status: "in_progress" | "submitted";
  startTime: string;
  endTime: string;
  submittedAt?: string;
  answers?: {
    quizAnswers?: number[];
    writingResponse?: string;
    writingLink?: string;
    codeResponse?: string;
    codeLink?: string;
    codeFileUrl?: string;
    codeFileName?: string;
    codeFileMimeType?: string;
    codeFileSize?: number;
  };
};

const resolveAssetUrl = (value: string) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${import.meta.env.VITE_BACKEND_URL}${value}`;
};

const AssessmentAttemptPage = () => {
  const { assessmentId, attemptId, candidateId } = useParams<{
    assessmentId: string;
    attemptId: string;
    candidateId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromJob = searchParams.get("fromJob");
  const backTarget = fromJob
    ? `/jobs/${fromJob}`
    : candidateId
      ? `/candidate/${candidateId}`
      : "/assessments";
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remainingMs, setRemainingMs] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [submitToast, setSubmitToast] = useState("");
  const [attemptSource, setAttemptSource] = useState<"admin" | "recruiter">(
    "admin",
  );

  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [writingResponse, setWritingResponse] = useState("");
  const [writingLink, setWritingLink] = useState("");
  const [codeResponse, setCodeResponse] = useState("");
  const [codeLink, setCodeLink] = useState("");
  const [codeFileUrl, setCodeFileUrl] = useState("");
  const [codeFileName, setCodeFileName] = useState("");
  const [codeFileSize, setCodeFileSize] = useState(0);
  const [selectedCodeFile, setSelectedCodeFile] = useState<File | null>(null);

  const submitGuard = useRef(false);
  const autosaveTimer = useRef<number | null>(null);

  const fetchAttempt = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Please log in to continue.");
      return;
    }
    if (!attemptId) return;
    try {
      setLoading(true);
      setError("");
      const response = await fetch(
        candidateId
          ? `${import.meta.env.VITE_API_BASE_URL}/assessments/candidate/${candidateId}/attempts/${attemptId}`
          : `${import.meta.env.VITE_API_BASE_URL}/assessments/attempts/${attemptId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to load attempt");
      }
      const assessmentData = data.assessment;
      const attemptData = data.attempt;
      const normalizedType =
        assessmentData.type === "code" ? "task" : assessmentData.type;
      setAssessment({
        id: assessmentData._id || assessmentData.id,
        title: assessmentData.title,
        description: assessmentData.description,
        type: normalizedType,
        timeLimit: assessmentData.timeLimit,
        maxAttempts: assessmentData.maxAttempts,
        quizQuestions: assessmentData.quizQuestions || [],
        writingTask: assessmentData.writingTask || "",
        writingInstructions: assessmentData.writingInstructions || "",
        writingFormat: assessmentData.writingFormat || "text",
        codeProblem: assessmentData.codeProblem || "",
        codeLanguages: assessmentData.codeLanguages || [],
        codeSubmission:
          assessmentData.codeSubmission === "repo"
            ? "link"
            : assessmentData.codeSubmission || "file",
        codeEvaluation: assessmentData.codeEvaluation || "",
      });
      setAttempt({
        id: attemptData._id || attemptData.id,
        status: attemptData.status,
        startTime: attemptData.startTime,
        endTime: attemptData.endTime,
        submittedAt: attemptData.submittedAt,
        answers: attemptData.answers || {},
      });
      setAttemptSource(attemptData.assessmentSource || "admin");

      setQuizAnswers(attemptData.answers?.quizAnswers || []);
      setWritingResponse(attemptData.answers?.writingResponse || "");
      setWritingLink(attemptData.answers?.writingLink || "");
      setCodeResponse(attemptData.answers?.codeResponse || "");
      setCodeLink(attemptData.answers?.codeLink || "");
      setCodeFileUrl(attemptData.answers?.codeFileUrl || "");
      setCodeFileName(attemptData.answers?.codeFileName || "");
      setCodeFileSize(attemptData.answers?.codeFileSize || 0);
      setSelectedCodeFile(null);

      const endTime = new Date(attemptData.endTime).getTime();
      setRemainingMs(Math.max(endTime - Date.now(), 0));
    } catch {
      setError("No data found currently.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempt();
  }, [attemptId, candidateId]);

  useEffect(() => {
    if (!attempt || attempt.status !== "in_progress") return;
    const intervalId = window.setInterval(() => {
      const endTime = new Date(attempt.endTime).getTime();
      const nextRemaining = Math.max(endTime - Date.now(), 0);
      setRemainingMs(nextRemaining);
      if (nextRemaining <= 0) {
        handleSubmit();
      }
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [attempt?.endTime, attempt?.status]);

  const scheduleAutosave = () => {
    if (!attempt || attempt.status !== "in_progress") return;
    if (
      assessment &&
      (assessment.type === "task" || assessment.type === "code") &&
      assessment.codeSubmission === "file"
    ) {
      return;
    }
    if (autosaveTimer.current) {
      window.clearTimeout(autosaveTimer.current);
    }
    autosaveTimer.current = window.setTimeout(() => {
      handleAutosave();
    }, 600);
  };

  useEffect(() => {
    scheduleAutosave();
  }, [
    quizAnswers,
    writingResponse,
    writingLink,
    codeResponse,
    codeLink,
    assessment?.codeSubmission,
    assessment?.type,
  ]);

  const handleAutosave = async () => {
    if (!attemptId || !assessmentId) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      setSaving(true);
      const base =
        attemptSource === "recruiter"
          ? `${import.meta.env.VITE_API_BASE_URL}/recruiter-assessments`
          : `${import.meta.env.VITE_API_BASE_URL}/assessments`;
      await fetch(`${base}/${assessmentId}/attempts/${attemptId}/answers`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quizAnswers,
            writingResponse,
            writingLink,
            codeResponse,
            codeLink,
          }),
        },
      );
    } catch (err) {
      // silent autosave error
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (submitGuard.current) return;
    submitGuard.current = true;
    if (!attemptId || !assessmentId) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      if (
        assessment &&
        (assessment.type === "task" || assessment.type === "code") &&
        assessment.codeSubmission === "file" &&
        !selectedCodeFile &&
        !codeFileUrl &&
        !codeLink.trim()
      ) {
        setMessage(
          "Please upload a PDF, DOC, DOCX, or ZIP file, or provide a task link before submitting.",
        );
        submitGuard.current = false;
        return;
      }
      const base =
        attemptSource === "recruiter"
          ? `${import.meta.env.VITE_API_BASE_URL}/recruiter-assessments`
          : `${import.meta.env.VITE_API_BASE_URL}/assessments`;
      const endpoint = `${base}/${assessmentId}/attempts/${attemptId}/submit`;
      let response: Response;
      if (
        assessment &&
        (assessment.type === "task" || assessment.type === "code") &&
        assessment.codeSubmission === "file"
      ) {
        const formData = new FormData();
        formData.append("quizAnswers", JSON.stringify(quizAnswers));
        formData.append("writingResponse", writingResponse);
        formData.append("writingLink", writingLink);
        formData.append("codeResponse", codeResponse);
        formData.append("codeLink", codeLink);
        if (selectedCodeFile) {
          formData.append("codeFile", selectedCodeFile);
        }
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      } else {
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quizAnswers,
            writingResponse,
            writingLink,
            codeResponse,
            codeLink,
          }),
        });
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to submit");
      }
      setCodeFileUrl(data?.attempt?.answers?.codeFileUrl || codeFileUrl);
      setCodeFileName(data?.attempt?.answers?.codeFileName || codeFileName);
      setCodeFileSize(data?.attempt?.answers?.codeFileSize || codeFileSize);
      setSelectedCodeFile(null);
      setAttempt((prev) =>
        prev
          ? {
              ...prev,
              status: "submitted",
              submittedAt: data.attempt?.submittedAt || new Date().toISOString(),
            }
          : prev,
      );
      setMessage("");
      setSubmitToast("Assessment submitted successfully.");
      setTimeout(() => {
        navigate(backTarget);
      }, 1200);
    } catch (err: any) {
      setMessage(err?.message || "Failed to submit assessment.");
      submitGuard.current = false;
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (attempt?.status === "in_progress") {
        handleSubmit();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (attempt?.status === "in_progress") {
        handleSubmit();
      }
    };
  }, [attempt?.status]);

  useEffect(() => {
    if (!submitToast) return;
    const timer = window.setTimeout(() => {
      setSubmitToast("");
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [submitToast]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const formatDurationVerbose = (ms: number) => {
    const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const formatFileSize = (size: number) => {
    if (!size || size <= 0) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isReadOnly = attempt?.status !== "in_progress";
  const isSubmitted = attempt?.status === "submitted";
  const quillModules = useMemo(
    () => ({
      toolbar: isReadOnly
        ? false
        : [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ align: [] }],
            [{ indent: "-1" }, { indent: "+1" }],
            [{ color: [] }, { background: [] }],
            ["link", "blockquote", "code-block"],
            ["clean"],
          ],
    }),
    [isReadOnly],
  );
  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "indent",
    "align",
    "color",
    "background",
    "link",
    "blockquote",
    "code-block",
  ];
  const completedDuration = () => {
    if (!attempt?.startTime || !attempt?.endTime) return null;
    const start = new Date(attempt.startTime).getTime();
    const end = attempt.submittedAt
      ? new Date(attempt.submittedAt).getTime()
      : new Date().getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) return null;
    return formatDurationVerbose(Math.max(end - start, 0));
  };

  return (
    <div className="assessment-attempt-page">
      <Navbar />
      <section className="assessment-attempt-content">
        <div className="assessment-attempt-container">
          {submitToast && (
            <div className="assessment-submit-toast">
              <button
                type="button"
                className="assessment-submit-toast-close"
                onClick={() => setSubmitToast("")}
                aria-label="Close"
              >
                ×
              </button>
              <p className="assessment-submit-toast-message">{submitToast}</p>
            </div>
          )}
          {loading && <div className="assessment-state">Loading...</div>}
          {error && !loading && (
            <div className="assessment-state assessment-error">{error}</div>
          )}
          {message && !loading && (
            <div className="assessment-state assessment-message">{message}</div>
          )}

          {!loading && !error && assessment && attempt && (
            <div
              className={`assessment-attempt-card ${
                isSubmitted ? "assessment-attempt-card-submitted" : ""
              }`}
            >
                <div className="assessment-attempt-header">
                <div>
                  <h1>{assessment.title}</h1>
                  <div
                    className="assessment-richtext"
                    dangerouslySetInnerHTML={{
                      __html: assessment.description || "",
                    }}
                  />
                </div>
                <div className="assessment-attempt-timer">
                  {isSubmitted ? (
                    <>
                      <span>Completed in</span>
                      <strong>{completedDuration() || "00:00"}</strong>
                      <p>Submitted</p>
                    </>
                  ) : (
                    <>
                      <span>Time left</span>
                      <strong>{formatTime(remainingMs)}</strong>
                      <p>
                        {assessment &&
                        (assessment.type === "task" || assessment.type === "code") &&
                        assessment.codeSubmission === "file"
                          ? "File uploads are sent on submit"
                          : saving
                            ? "Saving..."
                            : "Autosaved"}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {assessment.type === "quiz" && (
                <div className="assessment-attempt-section">
                  {(assessment.quizQuestions || []).map((question, index) => (
                    <div key={`${question.question}-${index}`} className="quiz-card">
                      <h3>
                        Q{index + 1}. {question.question}
                      </h3>
                      <div className="quiz-options">
                        {question.options.map((opt, optIndex) => (
                          <label
                            key={`${opt}-${optIndex}`}
                            className={`quiz-option ${
                              isSubmitted && question.correctIndex === optIndex
                                ? "correct"
                                : isSubmitted &&
                                    quizAnswers[index] === optIndex &&
                                    question.correctIndex !== optIndex
                                  ? "incorrect"
                                  : quizAnswers[index] === optIndex
                                    ? "selected"
                                    : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q-${index}`}
                              checked={quizAnswers[index] === optIndex}
                              disabled={isReadOnly}
                              onChange={() => {
                                const next = [...quizAnswers];
                                next[index] = optIndex;
                                setQuizAnswers(next);
                              }}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {assessment.type === "writing" && (
                <div className="assessment-attempt-section">
                  <div className="writing-block">
                    <h3>Task Description</h3>
                    <div
                      className="assessment-richtext"
                      dangerouslySetInnerHTML={{
                        __html: assessment.writingTask || "",
                      }}
                    />
                  </div>
                  <div className="writing-block">
                    <h3>Submission Instructions</h3>
                    <div
                      className="assessment-richtext"
                      dangerouslySetInnerHTML={{
                        __html: assessment.writingInstructions || "",
                      }}
                    />
                  </div>
                  {assessment.writingFormat === "link" ? (
                    <input
                      className="assessment-input"
                      placeholder="Paste your submission link"
                      value={writingLink}
                      disabled={isReadOnly}
                      onChange={(e) => setWritingLink(e.target.value)}
                    />
                  ) : (
                    <div className="assessment-writing-quill">
                      <ReactQuill
                        theme="snow"
                      value={writingResponse}
                        onChange={setWritingResponse}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Write your response here..."
                        readOnly={isReadOnly}
                      />
                    </div>
                  )}
                </div>
              )}

              {(assessment.type === "task" || assessment.type === "code") && (
                <div className="assessment-attempt-section">
                  <div className="writing-block">
                    <h3>Problem Statement</h3>
                    <div
                      className="assessment-richtext"
                      dangerouslySetInnerHTML={{
                        __html: assessment.codeProblem || "",
                      }}
                    />
                  </div>
                  <div className="writing-block">
                    <h3>Allowed Languages</h3>
                    <p>{(assessment.codeLanguages || []).join(", ")}</p>
                  </div>
                  <div className="writing-block">
                    <h3>Evaluation Guidelines</h3>
                    <div
                      className="assessment-richtext"
                      dangerouslySetInnerHTML={{
                        __html: assessment.codeEvaluation || "",
                      }}
                    />
                  </div>
                  <div className="writing-block assessment-submission-block">
                    <h3>
                      {assessment.codeSubmission === "link"
                        ? "Submitted Task Link"
                        : "Submitted File"}
                    </h3>
                    {assessment.codeSubmission === "link" ? (
                      isReadOnly && codeLink ? (
                        <a
                          className="assessment-link-output"
                          href={codeLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {codeLink}
                        </a>
                      ) : (
                        <input
                          className="assessment-input"
                          placeholder="Paste task link"
                          value={codeLink}
                          disabled={isReadOnly}
                          onChange={(e) => setCodeLink(e.target.value)}
                        />
                      )
                    ) : (
                      <div className="assessment-file-upload-panel">
                        {!isReadOnly ? (
                          <>
                            <input
                              id="assessment-code-file-input"
                              className="assessment-file-hidden-input"
                              type="file"
                              accept=".pdf,.doc,.docx,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip,application/x-zip-compressed"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setSelectedCodeFile(file);
                              }}
                            />
                            <label
                              htmlFor="assessment-code-file-input"
                              className="assessment-upload-area"
                            >
                              <div className="assessment-upload-text">
                                <p className="assessment-upload-title">
                                  Click to upload submitted file
                                </p>
                                <p className="assessment-upload-subtitle">
                                  Allowed file types: PDF, DOC, DOCX, ZIP (max 10MB)
                                </p>
                              </div>
                              <span className="assessment-upload-browse-btn">
                                Browse File
                              </span>
                            </label>
                            {selectedCodeFile && (
                              <div className="assessment-file-selected">
                                <span className="assessment-file-selected-name">
                                  {selectedCodeFile.name}
                                </span>
                                <span className="assessment-file-selected-size">
                                  {selectedCodeFile.size
                                    ? formatFileSize(selectedCodeFile.size)
                                    : ""}
                                </span>
                              </div>
                            )}
                            {!selectedCodeFile && codeFileUrl && (
                              <p className="assessment-file-current">
                                Current upload:
                                <a
                                  className="assessment-link-output"
                                  href={resolveAssetUrl(codeFileUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {codeFileName || "View uploaded file"}
                                </a>
                              </p>
                            )}
                            <div className="assessment-upload-separator">
                              <span>or submit task link</span>
                            </div>
                            <input
                              className="assessment-input"
                              placeholder="Paste task link (optional if file is uploaded)"
                              value={codeLink}
                              onChange={(e) => setCodeLink(e.target.value)}
                            />
                            {codeLink.trim() && (
                              <a
                                className="assessment-link-output"
                                href={codeLink}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {codeLink}
                              </a>
                            )}
                          </>
                        ) : (
                          <>
                            {codeFileUrl ? (
                              <a
                                className="assessment-link-output"
                                href={resolveAssetUrl(codeFileUrl)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {codeFileName || "View uploaded file"}
                                {codeFileSize ? ` (${formatFileSize(codeFileSize)})` : ""}
                              </a>
                            ) : null}
                            {codeLink.trim() ? (
                              <a
                                className="assessment-link-output"
                                href={codeLink}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {codeLink}
                              </a>
                            ) : null}
                            {!codeFileUrl && !codeLink.trim() ? (
                              <p className="assessment-file-empty">No file or task link submitted.</p>
                            ) : null}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="assessment-attempt-actions">
                {!isReadOnly && (
                  <button
                    className="assessment-submit-btn"
                    type="button"
                    onClick={handleSubmit}
                  >
                    Submit Assessment
                  </button>
                )}
                <button
                  className="assessment-cancel-btn"
                  type="button"
                  onClick={() => navigate(backTarget)}
                >
                  {fromJob
                    ? "Back to Job Details"
                    : candidateId
                      ? "Back to Candidate Profile"
                      : "Back to list"}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default AssessmentAttemptPage;


