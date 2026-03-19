import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/AssessmentListingPage.css";
import searchIcon from "../images/Job List Page Images/search.svg";
import dropdownArrow from "../images/Register Page Images/1_2307.svg";

type AssessmentCard = {
  id: string;
  title: string;
  type: "quiz" | "writing" | "task" | "code";
  difficulty: "beginner" | "intermediate" | "advanced";
  timeLimit: string;
  maxAttempts: number;
  attemptsUsed: number;
  attemptsLeft: number;
  status: "not_started" | "in_progress" | "submitted";
  deadline?: string;
  latestSubmittedAttemptId?: string | null;
  latestScore?: number | null;
  quizTotal?: number | null;
};

const AssessmentListingPage = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<AssessmentCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    type: "",
    status: "",
    difficulty: "",
  });
  const userDataStr = localStorage.getItem("userData");
  const userData = userDataStr ? JSON.parse(userDataStr) : null;
  const userRole = userData?.email === "hirelinknp@gmail.com"
    ? "admin"
    : userData?.role || "candidate";
  const isCandidate = userRole === "candidate";
  const typeDropdownRef = useRef<HTMLDivElement | null>(null);
  const difficultyDropdownRef = useRef<HTMLDivElement | null>(null);
  const statusDropdownRef = useRef<HTMLDivElement | null>(null);

  const typeOptions = [
    { value: "", label: "Type" },
    { value: "quiz", label: "MCQ" },
    { value: "writing", label: "Writing" },
    { value: "task", label: "Task-Based" },
  ];

  const difficultyOptions = [
    { value: "", label: "Difficulty" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

  const statusOptions = [
    { value: "", label: "Status" },
    { value: "not_started", label: "Not started" },
    { value: "in_progress", label: "In progress" },
    { value: "submitted", label: "Submitted" },
  ];

  const fetchAssessments = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Please log in to view assessments.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/assessments/available`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to load assessments");
      }
      setAssessments(
        (data.assessments || []).map((item: AssessmentCard) => ({
          ...item,
          type: item.type === "code" ? "task" : item.type,
        })),
      );
    } catch {
      setError("No data found currently.");
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(target)
      ) {
        setIsTypeOpen(false);
      }
      if (
        difficultyDropdownRef.current &&
        !difficultyDropdownRef.current.contains(target)
      ) {
        setIsDifficultyOpen(false);
      }
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(target)
      ) {
        setIsStatusOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const formatType = (type: AssessmentCard["type"]) => {
    if (type === "quiz") return "MCQ";
    if (type === "writing") return "Writing";
    return "Task-Based";
  };

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return "No deadline";
    const date = new Date(deadline);
    if (Number.isNaN(date.getTime())) return "No deadline";
    return date.toLocaleDateString();
  };

  const applyFilters = () => {
    setAppliedFilters({
      search: searchTerm.trim(),
      type: filterType,
      status: filterStatus,
      difficulty: filterDifficulty,
    });
  };

  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch = appliedFilters.search
      ? assessment.title
          .toLowerCase()
          .includes(appliedFilters.search.toLowerCase())
      : true;
    const matchesType = appliedFilters.type
      ? assessment.type === appliedFilters.type
      : true;
    const matchesStatus = appliedFilters.status
      ? assessment.status === appliedFilters.status
      : true;
    const matchesDifficulty = appliedFilters.difficulty
      ? assessment.difficulty === appliedFilters.difficulty
      : true;
    return matchesSearch && matchesType && matchesStatus && matchesDifficulty;
  });

  const handleStart = async (assessment: AssessmentCard) => {
    if (!isCandidate) return;
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Please log in to start an assessment.");
      return;
    }
    if (assessment.attemptsLeft <= 0) {
      return;
    }
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/assessments/${assessment.id}/attempts/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Unable to start assessment");
      }
      const attemptId = data.attempt?._id || data.attempt?.id;
      if (attemptId) {
        navigate(`/assessments/${assessment.id}/attempts/${attemptId}`);
      }
    } catch (err: any) {
      setError(err?.message || "Unable to start assessment");
    }
  };

  const handleViewSubmission = (assessment: AssessmentCard) => {
    if (!assessment.latestSubmittedAttemptId) return;
    navigate(
      `/assessments/${assessment.id}/attempts/${assessment.latestSubmittedAttemptId}`,
    );
  };

  return (
    <div className="assessment-listing-page">
      <Navbar />
      <section className="assessment-listing-hero">
        <div className="assessment-listing-hero-inner">
          <div className="assessment-listing-hero-text">
            <h1>Quiz / Assessment</h1>
            <p>Browse and complete assessments assigned to you.</p>
          </div>
        </div>
        <div className="assessment-listing-search">
          <div className="assessment-search-pill">
            <div className="assessment-search-field assessment-search-field-main">
              <img src={searchIcon} alt="Search" />
              <input
                type="text"
                placeholder="Search assessment title"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="assessment-search-field assessment-search-field-filter">
              <div className="assessment-filter-dropdown" ref={typeDropdownRef}>
                <button
                  type="button"
                  className={`assessment-filter-trigger ${isTypeOpen ? "open" : ""}`}
                  onClick={() => {
                    setIsTypeOpen((prev) => !prev);
                    setIsDifficultyOpen(false);
                    setIsStatusOpen(false);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={isTypeOpen}
                >
                  <span>
                    {typeOptions.find((option) => option.value === filterType)
                      ?.label || "Type"}
                  </span>
                  <img
                    src={dropdownArrow}
                    alt=""
                    aria-hidden="true"
                    className={`assessment-filter-caret ${isTypeOpen ? "open" : ""}`}
                  />
                </button>
                {isTypeOpen && (
                  <div className="assessment-filter-menu" role="listbox">
                    {typeOptions.map((option) => (
                      <button
                        key={option.value || "all-type"}
                        type="button"
                        className={`assessment-filter-option ${filterType === option.value ? "active" : ""}`}
                        onClick={() => {
                          setFilterType(option.value);
                          setIsTypeOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="assessment-search-field assessment-search-field-filter">
              <div
                className="assessment-filter-dropdown"
                ref={difficultyDropdownRef}
              >
                <button
                  type="button"
                  className={`assessment-filter-trigger ${isDifficultyOpen ? "open" : ""}`}
                  onClick={() => {
                    setIsDifficultyOpen((prev) => !prev);
                    setIsTypeOpen(false);
                    setIsStatusOpen(false);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={isDifficultyOpen}
                >
                  <span>
                    {difficultyOptions.find(
                      (option) => option.value === filterDifficulty,
                    )?.label || "Difficulty"}
                  </span>
                  <img
                    src={dropdownArrow}
                    alt=""
                    aria-hidden="true"
                    className={`assessment-filter-caret ${isDifficultyOpen ? "open" : ""}`}
                  />
                </button>
                {isDifficultyOpen && (
                  <div className="assessment-filter-menu" role="listbox">
                    {difficultyOptions.map((option) => (
                      <button
                        key={option.value || "all-difficulty"}
                        type="button"
                        className={`assessment-filter-option ${filterDifficulty === option.value ? "active" : ""}`}
                        onClick={() => {
                          setFilterDifficulty(option.value);
                          setIsDifficultyOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="assessment-search-field assessment-search-field-filter">
              <div className="assessment-filter-dropdown" ref={statusDropdownRef}>
                <button
                  type="button"
                  className={`assessment-filter-trigger ${isStatusOpen ? "open" : ""}`}
                  onClick={() => {
                    setIsStatusOpen((prev) => !prev);
                    setIsTypeOpen(false);
                    setIsDifficultyOpen(false);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={isStatusOpen}
                >
                  <span>
                    {statusOptions.find((option) => option.value === filterStatus)
                      ?.label || "Status"}
                  </span>
                  <img
                    src={dropdownArrow}
                    alt=""
                    aria-hidden="true"
                    className={`assessment-filter-caret ${isStatusOpen ? "open" : ""}`}
                  />
                </button>
                {isStatusOpen && (
                  <div className="assessment-filter-menu" role="listbox">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value || "all-status"}
                        type="button"
                        className={`assessment-filter-option ${filterStatus === option.value ? "active" : ""}`}
                        onClick={() => {
                          setFilterStatus(option.value);
                          setIsStatusOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button className="assessment-search-btn" onClick={applyFilters}>
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="assessment-listing-content">
        <div className="assessment-listing-container">
          {loading && <div className="assessment-state">Loading...</div>}
          {error && !loading && (
            <div className="assessment-state assessment-error">{error}</div>
          )}
          

          <div className="assessment-grid">
            {filteredAssessments.map((assessment) => (
              <div
                key={assessment.id}
                className="assessment-card"
                onClick={() => handleStart(assessment)}
                role="button"
              >
                <div className="assessment-card-header">
                  <div>
                    <h3>{assessment.title}</h3>
                    <p>{formatType(assessment.type)}</p>
                  </div>
                  <span className={`assessment-status ${assessment.status}`}>
                    {assessment.status === "not_started"
                      ? "Not started"
                      : assessment.status === "in_progress"
                        ? "In progress"
                        : "Submitted"}
                  </span>
                </div>

                <div className="assessment-card-meta">
                  <div>
                    <span>Duration</span>
                    <strong>{assessment.timeLimit || "60 min"}</strong>
                  </div>
                  <div>
                    <span>Attempts</span>
                    <strong>
                      {assessment.attemptsUsed}/{assessment.maxAttempts}
                    </strong>
                  </div>
                </div>

                <div className="assessment-card-meta secondary">
                  <div>
                    <span>Deadline</span>
                    <strong>{formatDeadline(assessment.deadline)}</strong>
                  </div>
                  <div>
                    <span>
                      {assessment.type === "quiz" ? "Score" : "Attempts left"}
                    </span>
                    <strong>
                      {assessment.type === "quiz"
                        ? assessment.latestScore !== null &&
                          assessment.latestScore !== undefined
                          ? `${assessment.latestScore}/${assessment.quizTotal ?? "-"}`
                          : "-"
                        : assessment.attemptsLeft}
                    </strong>
                  </div>
                </div>

                <div
                  className={`assessment-card-actions ${
                    isCandidate && assessment.status === "submitted"
                      ? "two-buttons"
                      : "single-button"
                  }`}
                >
                  <button
                    className="assessment-card-action"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCandidate) {
                        handleStart(assessment);
                      } else {
                        navigate(`/assessments/${assessment.id}/preview`);
                      }
                    }}
                  >
                    {isCandidate
                      ? assessment.attemptsLeft <= 0
                        ? "Unavailable"
                        : assessment.status === "in_progress"
                          ? "Resume"
                          : assessment.status === "submitted"
                            ? "Start new attempt"
                            : "Start"
                      : "View Questions"}
                  </button>
                  {isCandidate && assessment.status === "submitted" && (
                    <button
                      className="assessment-card-view"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewSubmission(assessment);
                      }}
                    >
                      View Submission
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!loading && filteredAssessments.length === 0 && (
              <div className="assessment-state">
                No assessments match your filters.
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default AssessmentListingPage;


