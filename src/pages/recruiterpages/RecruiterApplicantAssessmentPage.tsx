import PortalFooter from "../../components/PortalFooter";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RecruiterSidebar from "../../components/recruitercomponents/RecruiterSidebar";
import RecruiterTopBar from "../../components/recruitercomponents/RecruiterTopBar";
import "../../styles/RecruiterApplicantAssessmentPage.css";
import "../../styles/AssessmentAttemptPage.css";

type AssessmentDetail = {
  attached: boolean;
  required: boolean;
  source: "admin" | "recruiter" | null;
  type: "quiz" | "writing" | "task" | "code" | null;
  title: string;
  description: string;
  submitted: boolean;
  submittedAt: string | null;
  startTime: string | null;
  endTime: string | null;
  attemptCreatedAt: string | null;
  score: number | null;
  quizTotal: number | null;
  quizReview: Array<{
    question: string;
    options: string[];
    selectedIndex: number | null;
    selectedOption: string;
    correctIndex: number | null;
    correctOption: string;
    isCorrect: boolean;
  }>;
  writingTask: string;
  writingInstructions: string;
  writingFormat: string;
  writingResponse: string;
  writingLink: string;
  codeProblem: string;
  codeSubmission: "file" | "link" | "repo" | null;
  codeEvaluation: string;
  codeResponse: string;
  codeLink: string;
  codeFileUrl: string;
  codeFileName: string;
  codeFileSize: number;
};

type Payload = {
  application: {
    id: string;
    candidate?: {
      fullName?: string;
      email?: string;
    };
    job?: {
      jobTitle?: string;
    };
  };
  assessment: AssessmentDetail;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const formatDuration = (start?: string | null, end?: string | null) => {
  if (!start || !end) return "-";
  const startDate = new Date(start);
  const endDate = new Date(end);
  const totalSeconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
  if (Number.isNaN(totalSeconds) || totalSeconds < 0) return "-";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
};

const RecruiterApplicantAssessmentPage = () => {
  const { id: jobId, applicationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<Payload | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        setLoading(true);
        setError("");
        const res = await fetch(
          `http://localhost:5000/api/applications/${applicationId}/assessment`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load assessment details");
        }
        setPayload(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load assessment details");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [applicationId, navigate]);

  const assessment = payload?.assessment;

  return (
    <div className="recruiter-assessment-page-layout">
      <RecruiterSidebar />
      <main className="recruiter-assessment-page-main">
        <RecruiterTopBar />
        <div className="recruiter-assessment-page-content">
          <div className="recruiter-assessment-page-header">
            <div>
              <h1>Assessment Submission</h1>
              <p>
                {payload?.application?.candidate?.fullName || "Candidate"} ·{" "}
                {payload?.application?.job?.jobTitle || "Job"}
              </p>
            </div>
            <button
              className="recruiter-assessment-page-back"
              onClick={() => navigate(`/recruiter/job-postings/${jobId}/applicants`)}
            >
              Back to Applicants
            </button>
          </div>

          {loading && <div className="recruiter-assessment-page-state">Loading...</div>}
          {error && !loading && (
            <div className="recruiter-assessment-page-state error">{error}</div>
          )}

          {!loading && !error && assessment && (
            <section className="recruiter-assessment-page-card">
              <div className="recruiter-assessment-page-row">
                <span>Assessment Title</span>
                <strong>{assessment.title || "-"}</strong>
              </div>
              <div className="recruiter-assessment-page-row">
                <span>Type</span>
                <strong>{assessment.type || "-"}</strong>
              </div>
              <div className="recruiter-assessment-page-row">
                <span>Submitted At</span>
                <strong>{formatDateTime(assessment.submittedAt)}</strong>
              </div>
              <div className="recruiter-assessment-page-row">
                <span>Completed In</span>
                <strong>
                  {formatDuration(
                    assessment.startTime || assessment.attemptCreatedAt,
                    assessment.submittedAt,
                  )}
                </strong>
              </div>

              {assessment.description && (
                <div className="recruiter-assessment-page-block">
                  <span>Assessment Description</span>
                  <div
                    className="assessment-richtext"
                    dangerouslySetInnerHTML={{ __html: assessment.description }}
                  />
                </div>
              )}

              {assessment.type === "quiz" && (
                <>
                  <div className="recruiter-assessment-score-card">
                    <span>Quiz Score</span>
                    <strong>
                      {assessment.score ?? 0} / {assessment.quizTotal ?? 0}
                    </strong>
                  </div>
                  <div className="assessment-attempt-section">
                    {assessment.quizReview.map((item, index) => (
                      <div
                        key={`${item.question}-${index}`}
                        className="quiz-card"
                      >
                        <h3>
                          Q{index + 1}. {item.question}
                        </h3>
                        <div className="quiz-options">
                          {item.options.map((opt, optIndex) => (
                            <label
                              key={`${opt}-${optIndex}`}
                              className={`quiz-option ${
                                item.correctIndex === optIndex
                                  ? "correct"
                                  : item.selectedIndex === optIndex &&
                                      item.correctIndex !== optIndex
                                    ? "incorrect"
                                    : item.selectedIndex === optIndex
                                      ? "selected"
                                      : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name={`recruiter-q-${index}`}
                                checked={item.selectedIndex === optIndex}
                                disabled
                                readOnly
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {assessment.type === "writing" && (
                <>
                  {assessment.writingTask && (
                    <div className="recruiter-assessment-page-block">
                      <span>Writing Task</span>
                      <div
                        className="assessment-richtext"
                        dangerouslySetInnerHTML={{ __html: assessment.writingTask }}
                      />
                    </div>
                  )}
                  {assessment.writingInstructions && (
                    <div className="recruiter-assessment-page-block">
                      <span>Writing Instructions</span>
                      <div
                        className="assessment-richtext"
                        dangerouslySetInnerHTML={{ __html: assessment.writingInstructions }}
                      />
                    </div>
                  )}
                  <div className="recruiter-assessment-page-row">
                    <span>Writing Format</span>
                    <strong>{assessment.writingFormat || "-"}</strong>
                  </div>
                  {assessment.writingLink && (
                    <div className="recruiter-assessment-page-block">
                      <span>Writing Link</span>
                      <a href={assessment.writingLink} target="_blank" rel="noreferrer">
                        {assessment.writingLink}
                      </a>
                    </div>
                  )}
                  {assessment.writingResponse && (
                    <div className="recruiter-assessment-page-block">
                      <span>Writing Submission</span>
                      <div
                        className="assessment-richtext"
                        dangerouslySetInnerHTML={{ __html: assessment.writingResponse }}
                      />
                    </div>
                  )}
                </>
              )}

              {(assessment.type === "task" || assessment.type === "code") && (
                <>
                  {assessment.codeProblem && (
                    <div className="recruiter-assessment-page-block">
                      <span>Task Description</span>
                      <div
                        className="assessment-richtext"
                        dangerouslySetInnerHTML={{ __html: assessment.codeProblem }}
                      />
                    </div>
                  )}
                  {assessment.codeEvaluation && (
                    <div className="recruiter-assessment-page-block">
                      <span>Evaluation Notes</span>
                      <div
                        className="assessment-richtext"
                        dangerouslySetInnerHTML={{ __html: assessment.codeEvaluation }}
                      />
                    </div>
                  )}
                  {(assessment.codeSubmission === "link" ||
                    assessment.codeSubmission === "repo") &&
                    assessment.codeLink && (
                    <div className="recruiter-assessment-page-block">
                      <span>Task Link</span>
                      <a href={assessment.codeLink} target="_blank" rel="noreferrer">
                        {assessment.codeLink}
                      </a>
                    </div>
                  )}
                  {assessment.codeSubmission === "file" &&
                    assessment.codeFileUrl && (
                      <div className="recruiter-assessment-page-block">
                        <span>Uploaded File</span>
                        <a
                          href={`http://localhost:5000${assessment.codeFileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {assessment.codeFileName || "View uploaded file"}
                          {assessment.codeFileSize
                            ? ` (${(assessment.codeFileSize / 1024 / 1024).toFixed(2)} MB)`
                            : ""}
                        </a>
                      </div>
                    )}
                  {assessment.codeResponse &&
                    assessment.codeSubmission !== "file" && (
                    <div className="recruiter-assessment-page-block">
                      <span>Code Submission</span>
                      <pre>{assessment.codeResponse}</pre>
                    </div>
                  )}
                </>
              )}
            </section>
          )}
        </div>
              <PortalFooter />
</main>
    </div>
  );
};

export default RecruiterApplicantAssessmentPage;


