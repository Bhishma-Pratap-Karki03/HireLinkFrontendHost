import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useNavigate, useParams } from "react-router-dom";
import AdminSidebar from "../../components/admincomponents/AdminSidebar";
import AdminTopBar from "../../components/admincomponents/AdminTopBar";
import "../../styles/AdminAssessmentCreatePage.css";
import addIcon from "../../images/Recruiter Job Post Page Images/addIcon.svg";
import deleteIcon from "../../images/Recruiter Job Post Page Images/deleteIcon.svg";

type AssessmentType = "quiz" | "writing" | "task" | "code";

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number | null;
};

type AssessmentForm = {
  title: string;
  description: string;
  type: AssessmentType;
  difficulty: "beginner" | "intermediate" | "advanced";
  timeLimit: string;
  maxAttempts: string;
  status: "active" | "inactive";
  visibleToRecruiters: boolean;
  skillTags: string[];
  quizQuestions: QuizQuestion[];
  writingTask: string;
  writingInstructions: string;
  writingFormat: "text" | "file" | "link";
  codeProblem: string;
  codeLanguages: string[];
  codeSubmission: "file" | "link";
  codeEvaluation: string;
};

const AdminAssessmentEditPage: React.FC = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { id } = useParams();
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialForm, setInitialForm] = useState<AssessmentForm | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<AssessmentForm>({
    title: "",
    description: "",
    type: "quiz",
    difficulty: "beginner",
    timeLimit: "",
    maxAttempts: "1",
    status: "active",
    visibleToRecruiters: true,
    skillTags: [],
    quizQuestions: [{ question: "", options: [""], correctIndex: null }],
    writingTask: "",
    writingInstructions: "",
    writingFormat: "text",
    codeProblem: "",
    codeLanguages: [],
    codeSubmission: "file",
    codeEvaluation: "",
  });

  useEffect(() => {
    const loadAssessment = async () => {
      if (!id) {
        setSubmitError("Assessment ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/assessments/${id}`,
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Failed to load assessment");
        }

        const assessment = data.assessment;
        setForm({
          title: assessment.title || "",
          description: assessment.description || "",
          type: assessment.type === "code" ? "task" : assessment.type || "quiz",
          difficulty: assessment.difficulty || "beginner",
          timeLimit: assessment.timeLimit || "",
          maxAttempts:
            assessment.maxAttempts !== undefined
              ? String(assessment.maxAttempts)
              : "1",
          status: assessment.status || "active",
          visibleToRecruiters:
            assessment.visibleToRecruiters !== undefined
              ? Boolean(assessment.visibleToRecruiters)
              : true,
          skillTags: Array.isArray(assessment.skillTags)
            ? assessment.skillTags
            : [],
          quizQuestions:
            Array.isArray(assessment.quizQuestions) &&
            assessment.quizQuestions.length > 0
              ? assessment.quizQuestions.map((q: QuizQuestion) => ({
                  question: q.question || "",
                  options:
                    Array.isArray(q.options) && q.options.length > 0
                      ? q.options
                      : [""],
                  correctIndex:
                    q.correctIndex !== undefined ? q.correctIndex : null,
                }))
              : [{ question: "", options: [""], correctIndex: null }],
          writingTask: assessment.writingTask || "",
          writingInstructions: assessment.writingInstructions || "",
          writingFormat: assessment.writingFormat || "text",
          codeProblem: assessment.codeProblem || "",
          codeLanguages: Array.isArray(assessment.codeLanguages)
            ? assessment.codeLanguages
            : [],
          codeSubmission:
            assessment.codeSubmission === "repo"
              ? "link"
              : assessment.codeSubmission || "file",
          codeEvaluation: assessment.codeEvaluation || "",
        });

        setInitialForm({
          title: assessment.title || "",
          description: assessment.description || "",
          type: assessment.type === "code" ? "task" : assessment.type || "quiz",
          difficulty: assessment.difficulty || "beginner",
          timeLimit: assessment.timeLimit || "",
          maxAttempts:
            assessment.maxAttempts !== undefined
              ? String(assessment.maxAttempts)
              : "1",
          status: assessment.status || "active",
          visibleToRecruiters:
            assessment.visibleToRecruiters !== undefined
              ? Boolean(assessment.visibleToRecruiters)
              : true,
          skillTags: Array.isArray(assessment.skillTags)
            ? assessment.skillTags
            : [],
          quizQuestions:
            Array.isArray(assessment.quizQuestions) &&
            assessment.quizQuestions.length > 0
              ? assessment.quizQuestions.map((q: QuizQuestion) => ({
                  question: q.question || "",
                  options:
                    Array.isArray(q.options) && q.options.length > 0
                      ? q.options
                      : [""],
                  correctIndex:
                    q.correctIndex !== undefined ? q.correctIndex : null,
                }))
              : [{ question: "", options: [""], correctIndex: null }],
          writingTask: assessment.writingTask || "",
          writingInstructions: assessment.writingInstructions || "",
          writingFormat: assessment.writingFormat || "text",
          codeProblem: assessment.codeProblem || "",
          codeLanguages: Array.isArray(assessment.codeLanguages)
            ? assessment.codeLanguages
            : [],
          codeSubmission:
            assessment.codeSubmission === "repo"
              ? "link"
              : assessment.codeSubmission || "file",
          codeEvaluation: assessment.codeEvaluation || "",
        });
      } catch (err: any) {
        setSubmitError(err?.message || "Failed to load assessment");
      } finally {
        setLoading(false);
      }
    };

    loadAssessment();
  }, [id]);


  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ color: [] }, { background: [] }],
        ["clean"],
        ["link"],
        ["blockquote", "code-block"],
      ],
    }),
    [],
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

  const stripHtml = (value: string) =>
    value
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (!form.title.trim()) missing.push("Assessment Title");
    if (!stripHtml(form.description)) missing.push("Assessment Description");
    if (!form.difficulty) missing.push("Difficulty Level");
    if (!form.maxAttempts.trim()) missing.push("Maximum Attempts");

    if (form.type === "quiz") {
      if (form.quizQuestions.filter((q) => q.question.trim()).length === 0) {
        missing.push("Quiz Questions");
      }
      const hasInsufficientOptions = form.quizQuestions.some(
        (q) => q.options.filter((opt) => opt.trim()).length < 2,
      );
      if (hasInsufficientOptions) missing.push("At least 2 Options");
      const hasNoCorrect = form.quizQuestions.some(
        (q) => q.correctIndex === null,
      );
      if (hasNoCorrect) missing.push("Correct Answer");
    }
    if (form.type === "writing") {
      if (!stripHtml(form.writingInstructions))
        missing.push("Submission Instructions");
      if (!form.writingFormat) missing.push("Submission Format");
    }
    if (form.type === "task" || form.type === "code") {
      if (!stripHtml(form.codeProblem)) missing.push("Problem Statement");
      if (form.codeLanguages.filter((item) => item.trim()).length === 0)
        missing.push("Allowed Languages");
      if (!form.codeSubmission) missing.push("Submission Format");
      if (!stripHtml(form.codeEvaluation))
        missing.push("Evaluation Guidelines");
    }

    return missing;
  }, [form]);

  const isFormComplete = missingFields.length === 0;

  const updateForm = (field: keyof AssessmentForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSubmitError("");
    setSubmitSuccess("");
  };

  const updateQuestion = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((q, i) =>
        i === index ? { ...q, question: value } : q,
      ),
    }));
  };

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      quizQuestions: [
        ...prev.quizQuestions,
        { question: "", options: [""], correctIndex: null },
      ],
    }));
  };

  const removeQuestion = (index: number) => {
    setForm((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.filter((_, i) => i !== index),
    }));
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              options: q.options.map((opt, idx) =>
                idx === optionIndex ? value : opt,
              ),
            }
          : q,
      ),
    }));
  };

  const setCorrectOption = (questionIndex: number, optionIndex: number) => {
    setForm((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((q, i) =>
        i === questionIndex ? { ...q, correctIndex: optionIndex } : q,
      ),
    }));
  };

  const addOption = (questionIndex: number) => {
    setForm((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((q, i) =>
        i === questionIndex
          ? { ...q, options: [...q.options, ""] }
          : q,
      ),
    }));
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setForm((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((q, i) => {
        if (i !== questionIndex) return q;
        const nextOptions = q.options.filter((_, idx) => idx !== optionIndex);
        let nextCorrect = q.correctIndex;
        if (nextCorrect === optionIndex) nextCorrect = null;
        if (nextCorrect !== null && nextCorrect > optionIndex) {
          nextCorrect = nextCorrect - 1;
        }
        return {
          ...q,
          options: nextOptions.length > 0 ? nextOptions : [""],
          correctIndex: nextCorrect,
        };
      }),
    }));
  };

  const addSkillTag = () => {
    updateForm("skillTags", [...form.skillTags, ""]);
  };

  const updateSkillTag = (index: number, value: string) => {
    updateForm(
      "skillTags",
      form.skillTags.map((item, i) => (i === index ? value : item)),
    );
  };

  const removeSkillTag = (index: number) => {
    updateForm(
      "skillTags",
      form.skillTags.filter((_, i) => i !== index),
    );
  };

  const addCodeLanguage = () => {
    updateForm("codeLanguages", [...form.codeLanguages, ""]);
  };

  const updateCodeLanguage = (index: number, value: string) => {
    updateForm(
      "codeLanguages",
      form.codeLanguages.map((item, i) => (i === index ? value : item)),
    );
  };

  const removeCodeLanguage = (index: number) => {
    updateForm(
      "codeLanguages",
      form.codeLanguages.filter((_, i) => i !== index),
    );
  };

  const normalizePayload = (value: AssessmentForm) => ({
    title: value.title.trim(),
    description: value.description.trim(),
      type: value.type === "code" ? "task" : value.type,
    difficulty: value.difficulty,
    timeLimit: value.timeLimit.trim(),
    maxAttempts: value.maxAttempts.trim(),
    status: value.status,
    visibleToRecruiters: value.visibleToRecruiters,
    skillTags: value.skillTags.map((tag) => tag.trim()).filter(Boolean),
    quizQuestions: value.quizQuestions.map((q) => ({
      question: q.question.trim(),
      options: q.options.map((opt) => opt.trim()).filter(Boolean),
      correctIndex: q.correctIndex,
    })),
    writingTask: value.writingTask.trim(),
    writingInstructions: value.writingInstructions.trim(),
    writingFormat: value.writingFormat,
    codeProblem: value.codeProblem.trim(),
    codeLanguages: value.codeLanguages
      .map((item) => item.trim())
      .filter(Boolean)
      .sort(),
    codeSubmission: value.codeSubmission,
    codeEvaluation: value.codeEvaluation.trim(),
  });

  const handleSubmit = async () => {
    if (form.timeLimit) {
      const minutes = Number(form.timeLimit.replace(/[^0-9]/g, ""));
      if (!minutes || minutes <= 0) {
        setSubmitError("Time limit must be a valid number.");
        setSubmitSuccess("");
        return;
      }
    }
    if (!isFormComplete) {
      setSubmitError(`Please complete: ${missingFields.join(", ")}.`);
      setSubmitSuccess("");
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (initialForm) {
      const current = JSON.stringify(normalizePayload(form));
      const original = JSON.stringify(normalizePayload(initialForm));
      if (current == original) {
        setSubmitError("No changes detected. Please update a field before saving.");
        setSubmitSuccess("");
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    if (!id) {
      setSubmitError("Assessment ID is missing.");
      setSubmitSuccess("");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      setSubmitError("Please login to update an assessment.");
      setSubmitSuccess("");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/assessments/${id}`,{
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          type: form.type,
          difficulty: form.difficulty,
          timeLimit: form.timeLimit,
          maxAttempts: form.maxAttempts,
          status: form.status,
          visibleToRecruiters: form.visibleToRecruiters,
          skillTags: form.skillTags.filter((tag) => tag.trim()),
          quizQuestions:
            form.type === "quiz"
              ? form.quizQuestions.map((q) => ({
                  question: q.question,
                  options: q.options.filter((opt) => opt.trim()),
                  correctIndex: q.correctIndex,
                }))
              : [],
          writingTask: form.writingTask,
          writingInstructions: form.writingInstructions,
          writingFormat: form.writingFormat,
          codeProblem: form.codeProblem,
          codeLanguages: form.codeLanguages.filter((item) => item.trim()),
          codeSubmission: form.codeSubmission,
          codeEvaluation: form.codeEvaluation,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to update assessment");
      }

      setSubmitSuccess(data?.message || "Assessment updated successfully.");
      setSubmitError("");
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        setSubmitSuccess("");
        navigate("/admin/assessments");
      }, 1200);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to update assessment");
      setSubmitSuccess("");
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCancel = () => {
    navigate("/admin/assessments");
  };

  const handleDelete = async () => {
    if (!id) return;
    const token = localStorage.getItem("authToken");
    if (!token) {
      setSubmitError("Please login to delete assessments.");
      setSubmitSuccess("");
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/assessments/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete assessment");
      }
      setShowDeleteDialog(false);
      navigate("/admin/assessments");
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to delete assessment");
      setSubmitSuccess("");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-assessment-page-container">
      <div className="admin-assessment-layout">
        <AdminSidebar />
        <div className="admin-assessment-main-area">
          <div className="admin-assessment-topbar-wrapper">
            <AdminTopBar />
          </div>

          <div className="admin-assessment-scrollable-content" ref={scrollRef}>
            <div className="admin-assessment-content-wrapper">
              <div className="admin-assessment-page-header">
                <h1>Edit Assessment</h1>
                <p>Update assessment details and settings.</p>
              </div>

              {submitSuccess && (
                <div className="admin-assessment-toast success">
                  <button
                    type="button"
                    className="admin-assessment-toast-close"
                    onClick={() => setSubmitSuccess("")}
                    aria-label="Close"
                  >
                    ×
                  </button>
                  <p className="admin-assessment-toast-message">{submitSuccess}</p>
                </div>
              )}

              {loading ? (
                <div className="admin-assessment-loading">Loading</div>
              ) : (
                <>
                  {submitError && (
                    <div className="admin-assessment-feedback-overlay">
                      <div className="admin-assessment-feedback-card error">
                        <h3>Error</h3>
                        <p>{submitError}</p>
                        <button
                          className="admin-assessment-primary"
                          onClick={() => {
                            setSubmitError("");
                          }}
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="admin-assessment-grid">
                <div className="admin-assessment-form">
                  <section className="admin-assessment-card">
                    <h2>Basic Assessment Information</h2>
                    <div className="admin-assessment-form-group">
                      <label>Assessment Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Frontend UI Fundamentals"
                        value={form.title}
                        onChange={(e) => updateForm("title", e.target.value)}
                      />
                    </div>
                    <div className="admin-assessment-form-group">
                      <label>Assessment Description / Instructions *</label>
                      <ReactQuill
                        theme="snow"
                        value={form.description}
                        onChange={(value) => updateForm("description", value)}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Provide instructions for candidates..."
                      />
                    </div>

                    <div className="admin-assessment-row admin-assessment-row-3">
                      <div className="admin-assessment-form-group">
                        <label>Assessment Type *</label>
                        <div className="admin-assessment-pill-group">
                          {[
                            { value: "quiz", label: "Quiz (MCQ)" },
                            { value: "writing", label: "Writing Assignment" },
                            { value: "task", label: "Task-Based" },
                          ].map((item) => (
                            <button
                              key={item.value}
                              type="button"
                              className={`admin-assessment-pill ${
                                form.type === item.value ? "active" : ""
                              }`}
                              onClick={() => updateForm("type", item.value)}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="admin-assessment-form-group">
                        <label>Difficulty Level *</label>
                        <div className="admin-assessment-pill-group">
                          {[
                            { value: "beginner", label: "Beginner" },
                            { value: "intermediate", label: "Intermediate" },
                            { value: "advanced", label: "Advanced" },
                          ].map((item) => (
                            <button
                              key={item.value}
                              type="button"
                              className={`admin-assessment-pill ${
                                form.difficulty === item.value ? "active" : ""
                              }`}
                              onClick={() =>
                                updateForm("difficulty", item.value)
                              }
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="admin-assessment-form-group">
                      <label>Skill Tags</label>
                      <div className="admin-assessment-skill-list">
                        {form.skillTags.length === 0 && (
                          <span className="admin-assessment-muted">
                            No skills added yet.
                          </span>
                        )}
                        {form.skillTags.map((tag, index) => (
                          <div
                            key={index}
                            className="admin-assessment-option-row"
                          >
                            <input
                              type="text"
                              placeholder={`Skill ${index + 1}`}
                              value={tag}
                              onChange={(e) =>
                                updateSkillTag(index, e.target.value)
                              }
                            />
                            <button
                              type="button"
                              className="admin-assessment-option-remove"
                              onClick={() => removeSkillTag(index)}
                              aria-label="Remove skill"
                            >
                              <img src={deleteIcon} alt="Delete" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="admin-assessment-option-add"
                          onClick={addSkillTag}
                        >
                          <img src={addIcon} alt="Plus" />
                          Add Skill
                        </button>
                      </div>
                    </div>
                  </section>

                  <section className="admin-assessment-card">
                    <h2>Assessment Configuration</h2>
                    <div className="admin-assessment-row admin-assessment-row-3">
                      <div className="admin-assessment-form-group">
                        <label>Time Limit (optional)</label>
                        <input
                          type="number"
                          min="1"
                          max="240"
                          placeholder="e.g. 45"
                          value={
                            form.timeLimit
                              ? Number(form.timeLimit.replace(/[^0-9]/g, ""))
                              : ""
                          }
                          onChange={(e) =>
                            updateForm(
                              "timeLimit",
                              e.target.value ? `${e.target.value} minutes` : "",
                            )
                          }
                        />
                        <p className="admin-assessment-note">
                          Enter minutes only (e.g. 45).
                        </p>
                      </div>
                      <div className="admin-assessment-form-group">
                        <label>Maximum Attempts *</label>
                        <input
                          type="number"
                          min="1"
                          value={form.maxAttempts}
                          onChange={(e) =>
                            updateForm("maxAttempts", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="admin-assessment-row">
                      <div className="admin-assessment-form-group">
                        <label>Status *</label>
                        <div className="admin-assessment-pill-group">
                          {[
                            { value: "active", label: "Active" },
                            { value: "inactive", label: "Inactive" },
                          ].map((item) => (
                            <button
                              key={item.value}
                              type="button"
                              className={`admin-assessment-pill ${
                                form.status === item.value ? "active" : ""
                              }`}
                              onClick={() => updateForm("status", item.value)}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="admin-assessment-form-group">
                        <label>Visibility</label>
                        <div className="admin-assessment-toggle">
                          <input
                            type="checkbox"
                            checked={form.visibleToRecruiters}
                            onChange={(e) =>
                              updateForm(
                                "visibleToRecruiters",
                                e.target.checked,
                              )
                            }
                          />
                          <span>Available for recruiters</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="admin-assessment-card">
                    <h2>Assessment Content</h2>

                    {form.type === "quiz" && (
                      <div className="admin-assessment-type-section">
                        <div className="admin-assessment-type-header">
                          <div>
                            <h3>Quiz Assessment</h3>
                            <p>Quiz scores are calculated automatically.</p>
                          </div>
                          <button
                            type="button"
                            className="admin-assessment-option-add"
                            onClick={addQuestion}
                          >
                            <img src={addIcon} alt="Plus" />
                            Add Question
                          </button>
                        </div>
                        <div className="admin-assessment-question-count">
                          Total Questions: {form.quizQuestions.length}
                        </div>
                        <div className="admin-assessment-question-list">
                          {form.quizQuestions.map((question, index) => (
                            <div
                              key={index}
                              className="admin-assessment-question-card"
                            >
                              <div className="admin-assessment-question-item">
                                <input
                                  type="text"
                                  placeholder={`Question ${index + 1}`}
                                  value={question.question}
                                  onChange={(e) =>
                                    updateQuestion(index, e.target.value)
                                  }
                                />
                                {form.quizQuestions.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeQuestion(index)}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              <div className="admin-assessment-options">
                                {question.options.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className="admin-assessment-option-row"
                                  >
                                    <input
                                      type="radio"
                                      name={`correct-${index}`}
                                      checked={question.correctIndex === optIndex}
                                      onChange={() =>
                                        setCorrectOption(index, optIndex)
                                      }
                                    />
                                    <input
                                      type="text"
                                      placeholder={`Option ${optIndex + 1}`}
                                      value={option}
                                      onChange={(e) =>
                                        updateOption(
                                          index,
                                          optIndex,
                                          e.target.value,
                                        )
                                      }
                                    />
                                    {question.options.length > 1 && (
                                      <button
                                        type="button"
                                        className="admin-assessment-option-remove"
                                        onClick={() =>
                                          removeOption(index, optIndex)
                                        }
                                        aria-label="Remove option"
                                      >
                                        <img src={deleteIcon} alt="Delete" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  className="admin-assessment-option-add"
                                  onClick={() => addOption(index)}
                                >
                                  <img src={addIcon} alt="Plus" />
                                  Add Option
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {form.type === "writing" && (
                      <div className="admin-assessment-type-section">
                        <h3>Writing Assignment</h3>
                        <div className="admin-assessment-form-group">
                          <label>Submission Instructions *</label>
                          <ReactQuill
                            theme="snow"
                            value={form.writingInstructions}
                            onChange={(value) =>
                              updateForm("writingInstructions", value)
                            }
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="Submission instructions"
                          />
                        </div>
                        <div className="admin-assessment-form-group">
                          <label>Expected Submission Format *</label>
                          <div className="admin-assessment-pill-group">
                            {[
                              { value: "text", label: "Text" },
                              { value: "file", label: "File" },
                              { value: "link", label: "Link" },
                            ].map((item) => (
                              <button
                                key={item.value}
                                type="button"
                                className={`admin-assessment-pill ${
                                  form.writingFormat === item.value
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() =>
                                  updateForm("writingFormat", item.value)
                                }
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {form.writingFormat === "link" && (
                          <div className="admin-assessment-note">
                            Candidates will submit a link (e.g. Figma, Drive).
                          </div>
                        )}
                      </div>
                    )}

                    {(form.type === "task" || form.type === "code") && (
                      <div className="admin-assessment-type-section">
                        <h3>Task-Based Assignment</h3>
                        <div className="admin-assessment-form-group">
                          <label>Problem Statement *</label>
                          <ReactQuill
                            theme="snow"
                            value={form.codeProblem}
                            onChange={(value) =>
                              updateForm("codeProblem", value)
                            }
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="Describe the coding challenge"
                          />
                        </div>
                        <div className="admin-assessment-form-group">
                          <label>Relevant Tools / Languages</label>
                          <div className="admin-assessment-skill-list">
                            {(form.codeLanguages.length > 0
                              ? form.codeLanguages
                              : [""]
                            ).map((language, index) => (
                              <div
                                key={`code-lang-${index}`}
                                className="admin-assessment-option-row"
                              >
                                <input
                                  type="text"
                                  value={language}
                                  onChange={(e) =>
                                    updateCodeLanguage(index, e.target.value)
                                  }
                                  placeholder="e.g. React, Figma, Node.js"
                                />
                                <button
                                  type="button"
                                  className="admin-assessment-option-remove"
                                  onClick={() => removeCodeLanguage(index)}
                                  disabled={
                                    (form.codeLanguages.length > 0
                                      ? form.codeLanguages.length
                                      : 1) === 1
                                  }
                                >
                                  <img src={deleteIcon} alt="Remove language" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              className="admin-assessment-option-add"
                              onClick={addCodeLanguage}
                            >
                              <img src={addIcon} alt="" />
                              Add Tool / Language
                            </button>
                          </div>
                        </div>
                        <div className="admin-assessment-form-group">
                          <label>Submission Format *</label>
                          <div className="admin-assessment-pill-group">
                            {[
                              { value: "file", label: "File Upload" },
                              { value: "link", label: "Task Link" },
                            ].map((item) => (
                              <button
                                key={item.value}
                                type="button"
                                className={`admin-assessment-pill ${
                                  form.codeSubmission === item.value
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() =>
                                  updateForm("codeSubmission", item.value)
                                }
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="admin-assessment-form-group">
                          <label>Evaluation Guidelines *</label>
                          <ReactQuill
                            theme="snow"
                            value={form.codeEvaluation}
                            onChange={(value) =>
                              updateForm("codeEvaluation", value)
                            }
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="Provide evaluation guidelines"
                          />
                        </div>
                      </div>
                    )}
                  </section>

                  <div className="admin-assessment-actions">
                    <button
                      className="admin-assessment-primary"
                      onClick={handleSubmit}
                    >
                      Update Assessment
                    </button>
                    <button
                      className="admin-assessment-outline"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                    <button
                      className="admin-assessment-danger"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      Delete Assessment
                    </button>
                  </div>
                </div>

                <aside className="admin-assessment-preview-panel">
                  <div className="admin-assessment-card">
                    <h2>Assessment Overview</h2>
                    <div className="admin-assessment-overview">
                      <div>
                        <span>Type</span>
                        <strong>{form.type.toUpperCase()}</strong>
                      </div>
                      <div>
                        <span>Status</span>
                        <strong>{form.status}</strong>
                      </div>
                      <div>
                        <span>Attempts</span>
                        <strong>{form.maxAttempts || "-"}</strong>
                      </div>
                      <div>
                        <span>Time Limit</span>
                        <strong>{form.timeLimit || "Not set"}</strong>
                      </div>
                      <div>
                        <span>Skills</span>
                        <strong>
                          {form.skillTags.length > 0
                            ? form.skillTags.join(", ")
                            : "None"}
                        </strong>
                      </div>
                      <div>
                        <span>Visibility</span>
                        <strong>
                          {form.visibleToRecruiters ? "Recruiters" : "Admins"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
                </>
              )}
              {showDeleteDialog && (
                <div className="admin-assessment-delete-overlay">
                  <div className="admin-assessment-delete-dialog">
                    <h3>Delete Assessment</h3>
                    <p>Are you sure you want to delete this assessment? This action cannot be undone.</p>
                    <div className="admin-assessment-delete-actions">
                      <button
                        className="admin-assessment-outline"
                        onClick={() => setShowDeleteDialog(false)}
                        disabled={deleting}
                      >
                        Cancel
                      </button>
                      <button
                        className="admin-assessment-danger"
                        onClick={handleDelete}
                        disabled={deleting}
                      >
                        {deleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAssessmentEditPage;


