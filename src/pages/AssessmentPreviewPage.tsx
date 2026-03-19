import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/AssessmentAttemptPage.css";

type Assessment = {
  id: string;
  title: string;
  description: string;
  type: "quiz" | "writing" | "task" | "code";
  quizQuestions?: { question: string; options: string[]; correctIndex: number }[];
  writingTask?: string;
  writingInstructions?: string;
  writingFormat?: "text" | "file" | "link";
  codeProblem?: string;
  codeLanguages?: string[];
  codeSubmission?: "file" | "repo" | "link";
  codeEvaluation?: string;
};

const AssessmentPreviewPage = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const source = searchParams.get("source") || "admin";
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAssessment = async () => {
      if (!assessmentId) return;
      try {
        setLoading(true);
        setError("");
        const base =
          source === "recruiter"
            ? `${import.meta.env.VITE_API_BASE_URL}/recruiter-assessments`
            : `${import.meta.env.VITE_API_BASE_URL}/assessments`;
        const response = await fetch(`${base}/${assessmentId}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Failed to load assessment");
        }
        const item = data.assessment;
        setAssessment({
          id: item._id || item.id,
          title: item.title,
          description: item.description || "",
          type: item.type === "code" ? "task" : item.type || "quiz",
          quizQuestions: item.quizQuestions || [],
          writingTask: item.writingTask || "",
          writingInstructions: item.writingInstructions || "",
          writingFormat: item.writingFormat || "text",
          codeProblem: item.codeProblem || "",
          codeLanguages: item.codeLanguages || [],
          codeSubmission: item.codeSubmission || "file",
          codeEvaluation: item.codeEvaluation || "",
        });
      } catch {
        setError("No data found currently.");
      } finally {
        setLoading(false);
      }
    };

    loadAssessment();
  }, [assessmentId]);

  return (
    <div className="assessment-attempt-page">
      <Navbar />
      <section className="assessment-attempt-content">
        <div className="assessment-attempt-container">
          {loading && <div className="assessment-state">Loading...</div>}
          {error && !loading && (
            <div className="assessment-state assessment-error">{error}</div>
          )}
          {!loading && !error && assessment && (
            <div className="assessment-attempt-card">
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
                              question.correctIndex === optIndex ? "correct" : ""
                            }`}
                          >
                            <input type="radio" checked={false} disabled />
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
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default AssessmentPreviewPage;


