import PortalFooter from "../../components/PortalFooter";
import React, { useMemo, useState, useEffect, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useNavigate, useParams } from "react-router-dom";
import RecruiterSidebar from "../../components/recruitercomponents/RecruiterSidebar";
import RecruiterTopBar from "../../components/recruitercomponents/RecruiterTopBar";
import "../../styles/RecruiterJobPostPage.css";
import "../../styles/JobListingPage.css";

// Import images
import postJobCalendarIcon from "../../images/Recruiter Profile Page Images/postjobcalendar.svg";
import deleteIcon from "../../images/Recruiter Job Post Page Images/deleteIcon.svg";
import errorIcon from "../../images/Recruiter Job Post Page Images/Error icon.svg";
import addResponsibilityIcon from "../../images/Recruiter Job Post Page Images/addIcon.svg";
import deleteRequirementIcon from "../../images/Recruiter Job Post Page Images/deleteIcon.svg";
import addRequirementIcon from "../../images/Recruiter Job Post Page Images/addIcon.svg";
import tagRemoveIcon from "../../images/Recruiter Job Post Page Images/tagRemove.svg";
import dropdownArrow from "../../images/Register Page Images/1_2307.svg";
import checkHealthIcon from "../../images/Recruiter Job Post Page Images/checkIcon.svg";
import checkPtoIcon from "../../images/Recruiter Job Post Page Images/checkIcon.svg";
import checkInsuranceIcon from "../../images/Recruiter Job Post Page Images/checkIcon.svg";
import deleteStageFirstIcon from "../../images/Recruiter Job Post Page Images/deleteIcon.svg";
import deleteStageSecondIcon from "../../images/Recruiter Job Post Page Images/deleteIcon.svg";
import addStageIcon from "../../images/Recruiter Job Post Page Images/addIcon.svg";

// New preview section images
import companyLogo from "../../images/Recruiter Job Post Page Images/companyLogo.png";
import locationIcon from "../../images/Recruiter Job Post Page Images/location.svg";
import timeIcon from "../../images/Recruiter Job Post Page Images/timeIcon.svg";
import successIcon from "../../images/Recruiter Job Post Page Images/successIcon.svg";
import workModeIcon from "../../images/Job List Page Images/work-mode.svg";
import jobTypeIcon from "../../images/Job List Page Images/job-type.svg";

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


const RecruiterJobPostPage: React.FC = () => {
  const MAX_INTERVIEW_STAGES = 6;
  const navigate = useNavigate();
  const { id: jobIdParam } = useParams();
  const isEditMode = Boolean(jobIdParam);
  const [workMode, setWorkMode] = useState("remote");
  const [gender, setGender] = useState("both");
  const [formData, setFormData] = useState({
    jobTitle: "",
    contactEmail: "",
    department: "",
    location: "",
    jobLevel: "",
    jobType: "",
    openings: "",
    deadline: "",
    description: "",
    experience: "",
    education: "",
    salaryFrom: "",
    salaryTo: "",
    currency: "",
  });
  const [responsibilities, setResponsibilities] = useState<string[]>([""]);
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([""]);
  const [benefits, setBenefits] = useState<string[]>([
    "Health Benefits",
    "Paid Time Off",
    "Vehicle Insurance",
  ]);
  const [interviewStages, setInterviewStages] = useState<string[]>([""]);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitToast, setSubmitToast] = useState("");
  const [hasPosted, setHasPosted] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [assessmentEnabled, setAssessmentEnabled] = useState(false);
  const [assessmentRequired, setAssessmentRequired] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [assessmentMode, setAssessmentMode] = useState<
    "none" | "create" | "edit" | "view"
  >("none");
  const [assessmentForm, setAssessmentForm] = useState<AssessmentForm>({
    title: "",
    description: "",
    type: "quiz",
    difficulty: "beginner",
    timeLimit: "",
    maxAttempts: "1",
    status: "active",
    visibleToRecruiters: true,
    skillTags: [""],
    quizQuestions: [{ question: "", options: [""], correctIndex: null }],
    writingTask: "",
    writingInstructions: "",
    writingFormat: "text",
    codeProblem: "",
    codeLanguages: [""],
    codeSubmission: "file",
    codeEvaluation: "",
  });
  const [assessmentSubmitError, setAssessmentSubmitError] = useState("");
  const [assessmentSubmitSuccess, setAssessmentSubmitSuccess] = useState("");
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const currencyDropdownRef = useRef<HTMLDivElement | null>(null);

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

  const mapAssessmentToForm = (assessment: any): AssessmentForm => ({
    title: assessment?.title || "",
    description: assessment?.description || "",
    type: assessment?.type === "code" ? "task" : assessment?.type || "quiz",
    difficulty: assessment?.difficulty || "beginner",
    timeLimit: assessment?.timeLimit || "",
    maxAttempts: assessment?.maxAttempts
      ? String(assessment.maxAttempts)
      : "1",
    status: assessment?.status || "active",
    visibleToRecruiters: true,
    skillTags:
      Array.isArray(assessment?.skillTags) && assessment.skillTags.length > 0
        ? assessment.skillTags
        : [""],
    quizQuestions:
      assessment?.type === "quiz" &&
      Array.isArray(assessment?.quizQuestions) &&
      assessment.quizQuestions.length > 0
        ? assessment.quizQuestions.map((q: any) => ({
            question: q?.question || "",
            options:
              Array.isArray(q?.options) && q.options.length > 0
                ? q.options
                : [""],
            correctIndex:
              typeof q?.correctIndex === "number" ? q.correctIndex : null,
          }))
        : [{ question: "", options: [""], correctIndex: null }],
    writingTask: assessment?.writingTask || "",
    writingInstructions: assessment?.writingInstructions || "",
    writingFormat: assessment?.writingFormat || "text",
    codeProblem: assessment?.codeProblem || "",
    codeLanguages:
      Array.isArray(assessment?.codeLanguages) &&
      assessment.codeLanguages.length > 0
        ? assessment.codeLanguages
        : [""],
    codeSubmission:
      assessment?.codeSubmission === "repo"
        ? "link"
        : assessment?.codeSubmission || "file",
    codeEvaluation: assessment?.codeEvaluation || "",
  });

  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (!formData.jobTitle.trim()) missing.push("Job Title");
    if (!formData.department.trim()) missing.push("Department");
    if (!formData.location.trim()) missing.push("Location");
    if (!workMode) missing.push("Work Mode");
    if (!formData.jobLevel.trim()) missing.push("Job Level");
    if (!gender) missing.push("Gender");
    if (!formData.jobType.trim()) missing.push("Job Type");
    if (!formData.openings.trim()) missing.push("Openings");
    if (!formData.deadline.trim()) missing.push("Deadline");
    if (!stripHtml(formData.description)) missing.push("Job Description");
    if (!formData.salaryFrom.trim()) missing.push("Salary From");
    if (!formData.salaryTo.trim()) missing.push("Salary To");
    if (!formData.currency.trim()) missing.push("Currency");
    return missing;
  }, [formData, workMode, gender]);

  const isFormComplete = missingFields.length === 0;
  const shouldShowSuccess = hasPosted || submitSuccess !== "";

  useEffect(() => {
    if (!submitToast) return;
    const timer = window.setTimeout(() => {
      setSubmitToast("");
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [submitToast]);

  const loadAssessmentById = async (
    assessmentId: string,
    mode: "view" | "edit" = "view",
  ) => {
    if (!assessmentId) return;
    try {
      setAssessmentSubmitError("");
      setAssessmentSubmitSuccess("");
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/recruiter-assessments/${assessmentId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to load assessment");
      }
      setAssessmentForm(mapAssessmentToForm(data.assessment));
      setAssessmentMode(mode);
    } catch (error: any) {
      setAssessmentSubmitError(error?.message || "Failed to load assessment");
    }
  };

  useEffect(() => {
    const loadJobForEdit = async () => {
      if (!isEditMode || !jobIdParam) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/jobs/${jobIdParam}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load job");
        }
        const job = data.job;
        setFormData({
          jobTitle: job.jobTitle || "",
          contactEmail: job.companyEmail || "",
          department: job.department || "",
          location: job.location || "",
          jobLevel: job.jobLevel || "",
          jobType: job.jobType || "",
          openings: job.openings ? String(job.openings) : "",
          deadline: job.deadline ? String(job.deadline).slice(0, 10) : "",
          description: job.description || "",
          experience: job.experience || "",
          education: job.education || "",
          salaryFrom: job.salaryFrom || "",
          salaryTo: job.salaryTo || "",
          currency: job.currency || "",
        });
        setWorkMode(job.workMode || "remote");
        setGender(job.gender || "both");
        setResponsibilities(
          Array.isArray(job.responsibilities) && job.responsibilities.length > 0
            ? job.responsibilities
            : [""]
        );
        setRequirements(
          Array.isArray(job.requirements) && job.requirements.length > 0
            ? job.requirements
            : [""]
        );
        setRequiredSkills(
          Array.isArray(job.requiredSkills) && job.requiredSkills.length > 0
            ? job.requiredSkills
            : [""]
        );
        setBenefits(
          Array.isArray(job.benefits) && job.benefits.length > 0
            ? job.benefits
            : [""]
        );
        setInterviewStages(
          Array.isArray(job.interviewStages) && job.interviewStages.length > 0
            ? job.interviewStages
                .slice(0, MAX_INTERVIEW_STAGES)
                .map((stage: any) => stage.name || "")
            : [""]
        );
        setAssessmentEnabled(Boolean(job.assessmentId));
        setSelectedAssessmentId(job.assessmentId || "");
        setAssessmentRequired(Boolean(job.assessmentRequired));
        setAssessmentMode("none");
        setHasPosted(false);
        setSubmitSuccess("");
        setSubmitError("");
      } catch (error) {
        console.error("Error loading job:", error);
      }
    };

    loadJobForEdit();
  }, [isEditMode, jobIdParam]);

  const assessmentMissingFields = useMemo(() => {
    const missing: string[] = [];
    if (!assessmentForm.title.trim()) missing.push("Assessment Title");
    if (!stripHtml(assessmentForm.description))
      missing.push("Assessment Description");
    if (!assessmentForm.difficulty) missing.push("Difficulty Level");
    if (!assessmentForm.maxAttempts.trim()) missing.push("Maximum Attempts");

    if (assessmentForm.type === "quiz") {
      if (
        assessmentForm.quizQuestions.filter((q) => q.question.trim()).length ===
        0
      ) {
        missing.push("Quiz Questions");
      }
      const hasInsufficientOptions = assessmentForm.quizQuestions.some(
        (q) => q.options.filter((opt) => opt.trim()).length < 2,
      );
      if (hasInsufficientOptions) missing.push("At least 2 Options");
      const hasNoCorrect = assessmentForm.quizQuestions.some(
        (q) => q.correctIndex === null,
      );
      if (hasNoCorrect) missing.push("Correct Answer");
    }
    if (assessmentForm.type === "writing") {
      if (!stripHtml(assessmentForm.writingTask)) missing.push("Writing Task");
      if (!stripHtml(assessmentForm.writingInstructions))
        missing.push("Submission Instructions");
      if (!assessmentForm.writingFormat) missing.push("Submission Format");
    }
    if (assessmentForm.type === "task" || assessmentForm.type === "code") {
      if (!stripHtml(assessmentForm.codeProblem)) missing.push("Problem Statement");
      if (assessmentForm.codeLanguages.filter((item) => item.trim()).length === 0)
        missing.push("Allowed Languages");
      if (!assessmentForm.codeSubmission) missing.push("Submission Format");
      if (!stripHtml(assessmentForm.codeEvaluation))
        missing.push("Evaluation Guidelines");
    }

    return missing;
  }, [assessmentForm]);

  const isAssessmentComplete = assessmentMissingFields.length === 0;


  const benefitsOptions = [
    { label: "Health Benefits", icon: checkHealthIcon },
    { label: "Paid Time Off", icon: checkPtoIcon },
    { label: "Vehicle Insurance", icon: checkInsuranceIcon },
  ];

  const currencyOptions = [
    { code: "NPR", label: "NPR (Rs.)" },
    { code: "INR", label: "INR (₹)" },
    { code: "USD", label: "USD ($)" },
    { code: "GBP", label: "GBP (£)" },
  ];

  const selectedCurrencyLabel =
    currencyOptions.find((option) => option.code === formData.currency)?.label ||
    "Select currency";

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        currencyDropdownRef.current &&
        !currencyDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (field === "contactEmail") {
        setEmailTouched(true);
      }
      setHasPosted(false);
    };

  const updateListItem = (
    index: number,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((prev) => prev.map((item, i) => (i === index ? value : item)));
    setHasPosted(false);
  };

  const addListItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((prev) => [...prev, ""]);
    setHasPosted(false);
  };

  const removeListItem = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
    setHasPosted(false);
  };

  const removeSkill = (index: number) => {
    setRequiredSkills((prev) => prev.filter((_, i) => i !== index));
    setHasPosted(false);
  };

  const toggleBenefit = (benefit: string) => {
    setBenefits((prev) =>
      prev.includes(benefit)
        ? prev.filter((item) => item !== benefit)
        : [...prev, benefit],
    );
    setHasPosted(false);
  };

  const updateStage = (index: number, value: string) => {
    setInterviewStages((prev) =>
      prev.map((stage, i) => (i === index ? value : stage)),
    );
    setHasPosted(false);
  };

  const addStage = () => {
    setInterviewStages((prev) =>
      prev.length >= MAX_INTERVIEW_STAGES ? prev : [...prev, ""]
    );
    setHasPosted(false);
  };

  const removeStage = (index: number) => {
    setInterviewStages((prev) => prev.filter((_, i) => i !== index));
    setHasPosted(false);
  };

  const updateAssessmentForm = (field: keyof AssessmentForm, value: any) => {
    setAssessmentForm((prev) => ({ ...prev, [field]: value }));
    setAssessmentSubmitError("");
    setAssessmentSubmitSuccess("");
  };

  const updateAssessmentQuestion = (index: number, value: string) => {
    setAssessmentForm((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((q, i) =>
        i === index ? { ...q, question: value } : q,
      ),
    }));
  };

  const addAssessmentQuestion = () => {
    setAssessmentForm((prev) => ({
      ...prev,
      quizQuestions: [
        ...prev.quizQuestions,
        { question: "", options: [""], correctIndex: null },
      ],
    }));
  };

  const removeAssessmentQuestion = (index: number) => {
    setAssessmentForm((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.filter((_, i) => i !== index),
    }));
  };

  const updateAssessmentOption = (
    questionIndex: number,
    optionIndex: number,
    value: string,
  ) => {
    setAssessmentForm((prev) => ({
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

  const setAssessmentCorrectOption = (
    questionIndex: number,
    optionIndex: number,
  ) => {
    setAssessmentForm((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((q, i) =>
        i === questionIndex ? { ...q, correctIndex: optionIndex } : q,
      ),
    }));
  };

  const addAssessmentOption = (questionIndex: number) => {
    setAssessmentForm((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((q, i) =>
        i === questionIndex
          ? { ...q, options: [...q.options, ""] }
          : q,
      ),
    }));
  };

  const removeAssessmentOption = (questionIndex: number, optionIndex: number) => {
    setAssessmentForm((prev) => ({
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

  const addAssessmentSkill = () => {
    updateAssessmentForm("skillTags", [...assessmentForm.skillTags, ""]);
  };

  const updateAssessmentSkill = (index: number, value: string) => {
    updateAssessmentForm(
      "skillTags",
      assessmentForm.skillTags.map((item, i) => (i === index ? value : item)),
    );
  };

  const removeAssessmentSkill = (index: number) => {
    updateAssessmentForm(
      "skillTags",
      assessmentForm.skillTags.filter((_, i) => i !== index),
    );
  };

  const addAssessmentLanguage = () => {
    updateAssessmentForm("codeLanguages", [...assessmentForm.codeLanguages, ""]);
  };

  const updateAssessmentLanguage = (index: number, value: string) => {
    updateAssessmentForm(
      "codeLanguages",
      assessmentForm.codeLanguages.map((item, i) => (i === index ? value : item)),
    );
  };

  const removeAssessmentLanguage = (index: number) => {
    updateAssessmentForm(
      "codeLanguages",
      assessmentForm.codeLanguages.filter((_, i) => i !== index),
    );
  };


  const handlePostJob = async () => {
    if (!isFormComplete) {
      setSubmitError("Please complete all required fields before posting.");
      setSubmitSuccess("");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      setSubmitError("Please log in to post a job.");
      setSubmitSuccess("");
      return;
    }

    if (hasPosted && !isEditMode) {
      setSubmitError("You have already posted this job.");
      setSubmitSuccess("");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/jobs${isEditMode ? `/${jobIdParam}` : ""}`,
        {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobTitle: formData.jobTitle,
          contactEmail: formData.contactEmail,
          department: formData.department,
          location: formData.location,
          workMode,
          gender,
          jobLevel: formData.jobLevel,
          jobType: formData.jobType,
          openings: formData.openings,
          deadline: formData.deadline,
          description: formData.description,
          responsibilities: responsibilities.filter((item) => item.trim()),
          requirements: requirements.filter((item) => item.trim()),
          requiredSkills: requiredSkills.filter((item) => item.trim()),
          experience: formData.experience,
          education: formData.education,
          salaryFrom: formData.salaryFrom,
          salaryTo: formData.salaryTo,
          currency: formData.currency,
          benefits,
          interviewStages: interviewStages
            .map((stage) => stage.trim())
            .filter((stage) => stage)
            .slice(0, MAX_INTERVIEW_STAGES)
            .map((stage) => ({ name: stage })),
          assessmentId: assessmentEnabled ? selectedAssessmentId : null,
          assessmentRequired: assessmentEnabled ? assessmentRequired : false,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to post job");
      }

      setSubmitSuccess(
        isEditMode ? "Job updated successfully!" : "Job posted successfully!"
      );
      setSubmitToast(
        isEditMode ? "Job updated successfully!" : "Job posted successfully!"
      );
      setHasPosted(true);
      setTimeout(() => {
        if (!isEditMode) {
          resetForm();
        }
        navigate("/recruiter/job-postings");
      }, 900);
    } catch (error: any) {
      setSubmitError(error.message || "Failed to post job");
      setSubmitSuccess("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/recruiter/job-postings");
  };

  const handleSearch = (query: string) => {
    console.log("Search query:", query);
  };

  const handleWorkModeChange = (mode: string) => {
    setWorkMode(mode);
    setHasPosted(false);
  };

  const handleGenderChange = (value: string) => {
    setGender(value);
    setHasPosted(false);
  };

  const userId = (() => {
    try {
      const userDataStr = localStorage.getItem("userData");
      if (!userDataStr) return "";
      const userData = JSON.parse(userDataStr);
      return userData.id || "";
    } catch {
      return "";
    }
  })();

  const companyName = (() => {
    try {
      const userDataStr = localStorage.getItem("userData");
      if (!userDataStr) return "Your Company";
      const userData = JSON.parse(userDataStr);
      return userData.fullName || "Your Company";
    } catch {
      return "Your Company";
    }
  })();

  const [previewCompanyLogo, setPreviewCompanyLogo] =
    useState<string>(companyLogo);

  const resolveCompanyLogoPath = (logo?: string) => {
    if (!logo) return "";
    if (logo.startsWith("http")) return logo;
    return `${import.meta.env.VITE_BACKEND_URL}${logo.startsWith("/") ? "" : "/"}${logo}`;
  };

  const defaultEmail = (() => {
    try {
      const userDataStr = localStorage.getItem("userData");
      if (!userDataStr) return "";
      const userData = JSON.parse(userDataStr);
      return userData.email || "";
    } catch {
      return "";
    }
  })();

  useEffect(() => {
    if (!emailTouched && !formData.contactEmail && defaultEmail) {
      setFormData((prev) => ({ ...prev, contactEmail: defaultEmail }));
    }
  }, [defaultEmail, formData.contactEmail, emailTouched]);

  useEffect(() => {
    let isMounted = true;

    const loadCompanyLogo = async () => {
      try {
        const userDataStr = localStorage.getItem("userData");
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          const localLogo = resolveCompanyLogoPath(
            userData.profilePicture || userData.logo || "",
          );
          if (localLogo) {
            if (isMounted) setPreviewCompanyLogo(localLogo);
            return;
          }
        }
      } catch {
        // ignore local storage parse error and fallback to API
      }

      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profile/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) return;
        const data = await response.json();
        const apiLogo = resolveCompanyLogoPath(
          data?.user?.profilePicture || data?.user?.logo || "",
        );
        if (apiLogo && isMounted) {
          setPreviewCompanyLogo(apiLogo);
        }
      } catch {
        // keep default fallback logo
      }
    };

    loadCompanyLogo();
    return () => {
      isMounted = false;
    };
  }, []);

  // Recruiters create assessments directly for a job (no selection list).

  const formattedWorkMode =
    workMode === "on-site"
      ? "On-site"
      : workMode === "remote"
        ? "Remote"
        : "Hybrid";

  const resetAssessmentForm = () => {
    setAssessmentForm({
      title: "",
      description: "",
      type: "quiz",
      difficulty: "beginner",
      timeLimit: "",
      maxAttempts: "1",
      status: "active",
      visibleToRecruiters: true,
      skillTags: [""],
      quizQuestions: [{ question: "", options: [""], correctIndex: null }],
      writingTask: "",
      writingInstructions: "",
      writingFormat: "text",
      codeProblem: "",
      codeLanguages: [""],
      codeSubmission: "file",
      codeEvaluation: "",
    });
  };

  const isAssessmentReadOnly = assessmentMode === "view";

  const handleSaveAssessment = async () => {
    if (assessmentForm.timeLimit) {
      const minutes = Number(
        assessmentForm.timeLimit.replace(/[^0-9]/g, ""),
      );
      if (!minutes || minutes <= 0) {
        setAssessmentSubmitError("Time limit must be a valid number.");
        setAssessmentSubmitSuccess("");
        return;
      }
    }
    if (!isAssessmentComplete) {
      setAssessmentSubmitError(
        `Please complete: ${assessmentMissingFields.join(", ")}.`,
      );
      setAssessmentSubmitSuccess("");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      setAssessmentSubmitError("Please log in to save an assessment.");
      setAssessmentSubmitSuccess("");
      return;
    }

    try {
      setAssessmentSubmitError("");
      const isUpdate = Boolean(selectedAssessmentId);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/recruiter-assessments${isUpdate ? `/${selectedAssessmentId}` : ""}`,
        {
        method: isUpdate ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: assessmentForm.title,
          description: assessmentForm.description,
          type: assessmentForm.type === "code" ? "task" : assessmentForm.type,
          difficulty: assessmentForm.difficulty,
          timeLimit: assessmentForm.timeLimit,
          maxAttempts: assessmentForm.maxAttempts,
          status: assessmentForm.status,
          visibleToRecruiters: assessmentForm.visibleToRecruiters,
          skillTags: assessmentForm.skillTags.filter((tag) => tag.trim()),
          quizQuestions:
            assessmentForm.type === "quiz"
              ? assessmentForm.quizQuestions.map((q) => ({
                  question: q.question,
                  options: q.options.filter((opt) => opt.trim()),
                  correctIndex: q.correctIndex,
                }))
              : [],
          writingTask: assessmentForm.writingTask,
          writingInstructions: assessmentForm.writingInstructions,
          writingFormat: assessmentForm.writingFormat,
          codeProblem: assessmentForm.codeProblem,
          codeLanguages: assessmentForm.codeLanguages.filter((item) => item.trim()),
          codeSubmission: assessmentForm.codeSubmission,
          codeEvaluation: assessmentForm.codeEvaluation,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to save assessment");
      }
      const saved = data.assessment;
      setSelectedAssessmentId(saved._id || saved.id);
      setAssessmentEnabled(true);
      setAssessmentForm(mapAssessmentToForm(saved));
      setAssessmentSubmitSuccess(
        isUpdate ? "Assessment updated successfully." : "Assessment created successfully.",
      );
      setSubmitToast(
        isUpdate ? "Assessment updated successfully." : "Assessment created successfully.",
      );
      setAssessmentMode("view");
    } catch (err: any) {
      setAssessmentSubmitError(err?.message || "Failed to save assessment");
      setAssessmentSubmitSuccess("");
    }
  };

  const resetForm = () => {
    setFormData({
      jobTitle: "",
      contactEmail: defaultEmail,
      department: "",
      location: "",
      jobLevel: "",
      jobType: "",
      openings: "",
      deadline: "",
      description: "",
      experience: "",
      education: "",
      salaryFrom: "",
      salaryTo: "",
      currency: "",
    });
    setWorkMode("remote");
    setGender("both");
    setEmailTouched(false);
    setResponsibilities([""]);
    setRequirements([""]);
    setRequiredSkills([""]);
    setBenefits([
      "Health Benefits",
      "Paid Time Off",
      "Vehicle Insurance",
    ]);
    setInterviewStages([""]);
    setAssessmentEnabled(false);
    setAssessmentRequired(false);
    setSelectedAssessmentId("");
    setAssessmentMode("none");
  };

  return (
    <div className="recruiter-postjob-container">
      <div className="recruiter-postjob-layout">
        {/* Recruiter Sidebar */}
        <RecruiterSidebar />

        {/* Main Content Area */}
        <div className="recruiter-postjob-main-area">
          {/* Top Bar */}
          <div className="recruiter-postjob-topbar-wrapper">
            <RecruiterTopBar
              onPostJob={handlePostJob}
              onSearch={handleSearch}
            />
          </div>

          {/* Scrollable Content */}
          <div className="recruiter-postjob-scrollable-content">
            <div className="recruiter-postjob-content-wrapper">
              {submitToast && (
                <div className="recruiter-jobpost-toast">
                  <button
                    type="button"
                    className="recruiter-jobpost-toast-close"
                    onClick={() => setSubmitToast("")}
                    aria-label="Close"
                  >
                    ×
                  </button>
                  <p className="recruiter-jobpost-toast-message">{submitToast}</p>
                </div>
              )}
              {/* Page Title */}
                <div className="recruiter-postjob-page-title-area">
                  <h1>{isEditMode ? "Edit Job Posting" : "Post a New Job"}</h1>
                  <p>
                    {isEditMode
                      ? "Update the details below to keep this job post accurate."
                      : "Enter the details below to find your next great hire."}
                  </p>
                </div>

              {/* Section 1: Basic Information */}
              <section className="recruiter-postjob-card">
                <div className="recruiter-postjob-card-header">
                  <h3>Basic Information</h3>
                </div>
                <div className="recruiter-postjob-card-body">
                  <div className="recruiter-postjob-form-grid">
                    <div className="recruiter-postjob-grid-2-col">
                      <div className="recruiter-postjob-form-group">
                        <label>
                          Job Title{" "}
                          <span className="recruiter-postjob-required">*</span>
                        </label>
                        <div className="recruiter-postjob-input-wrapper">
                          <input
                            type="text"
                            placeholder="E.g. Senior Product Designer"
                            value={formData.jobTitle}
                            onChange={handleInputChange("jobTitle")}
                          />
                        </div>
                      </div>
                      <div className="recruiter-postjob-form-group">
                        <label>
                          Gender{" "}
                          <span className="recruiter-postjob-required">*</span>
                        </label>
                        <div className="recruiter-postjob-segmented-control">
                          <button
                            className={`recruiter-postjob-segment ${gender === "male" ? "active" : ""}`}
                            onClick={() => handleGenderChange("male")}
                          >
                            Male
                          </button>
                          <button
                            className={`recruiter-postjob-segment ${gender === "female" ? "active" : ""}`}
                            onClick={() => handleGenderChange("female")}
                          >
                            Female
                          </button>
                          <button
                            className={`recruiter-postjob-segment ${gender === "both" ? "active" : ""}`}
                            onClick={() => handleGenderChange("both")}
                          >
                            Both
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="recruiter-postjob-form-group recruiter-postjob-full-width">
                      <div className="recruiter-postjob-grid-3-col">
                        <div className="recruiter-postjob-form-group">
                          <label>
                            Department{" "}
                            <span className="recruiter-postjob-required">*</span>
                          </label>
                          <div className="recruiter-postjob-input-wrapper">
                            <input
                              type="text"
                              placeholder="Design and Product"
                              value={formData.department}
                              onChange={handleInputChange("department")}
                            />
                          </div>
                        </div>
                        <div className="recruiter-postjob-form-group">
                          <label>
                            Location{" "}
                            <span className="recruiter-postjob-required">*</span>
                          </label>
                          <div className="recruiter-postjob-input-wrapper">
                            <input
                              type="text"
                              placeholder="E.g. Old Baneshwor, Kathmandu"
                              value={formData.location}
                              onChange={handleInputChange("location")}
                            />
                          </div>
                        </div>
                        <div className="recruiter-postjob-form-group">
                          <label>Contact Email</label>
                          <div className="recruiter-postjob-input-wrapper">
                            <input
                              type="email"
                              placeholder="Email for applicants"
                              value={formData.contactEmail}
                              onChange={handleInputChange("contactEmail")}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="recruiter-postjob-form-group recruiter-postjob-full-width">
                      <div className="recruiter-postjob-grid-2-col">
                        <div className="recruiter-postjob-form-group">
                          <label>
                            Work Mode{" "}
                            <span className="recruiter-postjob-required">*</span>
                          </label>
                          <div className="recruiter-postjob-segmented-control">
                            <button
                              className={`recruiter-postjob-segment ${workMode === "remote" ? "active" : ""}`}
                              onClick={() => handleWorkModeChange("remote")}
                            >
                              Remote
                            </button>
                            <button
                              className={`recruiter-postjob-segment ${workMode === "on-site" ? "active" : ""}`}
                              onClick={() => handleWorkModeChange("on-site")}
                            >
                              On-Site
                            </button>
                            <button
                              className={`recruiter-postjob-segment ${workMode === "hybrid" ? "active" : ""}`}
                              onClick={() => handleWorkModeChange("hybrid")}
                            >
                              Hybrid
                            </button>
                          </div>
                        </div>
                        <div className="recruiter-postjob-form-group">
                          <label>
                            Job Level{" "}
                            <span className="recruiter-postjob-required">*</span>
                          </label>
                          <div className="recruiter-postjob-input-wrapper">
                            <input
                              type="text"
                              placeholder="E.g. Senior - Designer"
                              value={formData.jobLevel}
                              onChange={handleInputChange("jobLevel")}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="recruiter-postjob-form-group recruiter-postjob-full-width">
                      <div className="recruiter-postjob-grid-3-col">
                        <div className="recruiter-postjob-form-group">
                          <label>
                            Job Type{" "}
                            <span className="recruiter-postjob-required">*</span>
                          </label>
                          <div className="recruiter-postjob-input-wrapper">
                            <input
                              type="text"
                              placeholder="E.g. Full-time"
                              value={formData.jobType}
                              onChange={handleInputChange("jobType")}
                            />
                          </div>
                        </div>
                        <div className="recruiter-postjob-form-group">
                          <label>
                            Openings{" "}
                            <span className="recruiter-postjob-required">*</span>
                          </label>
                          <div className="recruiter-postjob-input-wrapper">
                            <input
                              type="number"
                              min="1"
                              placeholder="E.g. 1"
                              value={formData.openings}
                              onChange={handleInputChange("openings")}
                            />
                          </div>
                        </div>
                        <div className="recruiter-postjob-form-group">
                          <label>
                            Deadline{" "}
                            <span className="recruiter-postjob-required">*</span>
                          </label>
                          <div className="recruiter-postjob-input-wrapper recruiter-postjob-date-input">
                            <input
                              type="date"
                              value={formData.deadline}
                              onChange={handleInputChange("deadline")}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2: Description */}
              <section className="recruiter-postjob-card">
                <div className="recruiter-postjob-card-header">
                  <h3>Description, Responsibilities and Requirements</h3>
                </div>
                <div className="recruiter-postjob-card-body">
                  <div className="recruiter-postjob-form-group">
                    <label>
                      Job Description{" "}
                      <span className="recruiter-postjob-required">*</span>
                    </label>
                    <div className="recruiter-postjob-quill-editor">
                      <ReactQuill
                        theme="snow"
                        value={formData.description}
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            description: value,
                          }));
                          setHasPosted(false);
                        }}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Describe the role, team, and day-by-day responsibilities..."
                      />
                    </div>
                  </div>

                  <div className="recruiter-postjob-form-group recruiter-postjob-mt-20">
                    <label>Core Responsibilities</label>
                    <div className="recruiter-postjob-dynamic-list">
                      {responsibilities.map((item, index) => (
                        <div
                          className="recruiter-postjob-list-item"
                          key={index}
                        >
                          <div className="recruiter-postjob-list-content">
                            <input
                              type="text"
                              placeholder={`Responsibility ${index + 1}`}
                              value={item}
                              onChange={(e) =>
                                updateListItem(
                                  index,
                                  e.target.value,
                                  setResponsibilities,
                                )
                              }
                            />
                          </div>
                          <button
                            type="button"
                            className="recruiter-postjob-list-action"
                            onClick={() =>
                              removeListItem(index, setResponsibilities)
                            }
                            aria-label="Remove responsibility"
                          >
                            <img src={deleteIcon} alt="Delete" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="recruiter-postjob-add-btn"
                        onClick={() => addListItem(setResponsibilities)}
                      >
                        <img src={addResponsibilityIcon} alt="Plus" />
                        <span>Add Responsibility</span>
                      </button>
                    </div>
                  </div>

                  <div className="recruiter-postjob-form-group recruiter-postjob-mt-20">
                    <label>Requirements</label>
                    <div className="recruiter-postjob-dynamic-list">
                      {requirements.map((item, index) => (
                        <div
                          className="recruiter-postjob-list-item"
                          key={index}
                        >
                          <div className="recruiter-postjob-list-content">
                            <input
                              type="text"
                              placeholder={`Requirement ${index + 1}`}
                              value={item}
                              onChange={(e) =>
                                updateListItem(
                                  index,
                                  e.target.value,
                                  setRequirements,
                                )
                              }
                            />
                          </div>
                          <button
                            type="button"
                            className="recruiter-postjob-list-action"
                            onClick={() =>
                              removeListItem(index, setRequirements)
                            }
                            aria-label="Remove requirement"
                          >
                            <img src={deleteRequirementIcon} alt="Delete" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="recruiter-postjob-add-btn"
                        onClick={() => addListItem(setRequirements)}
                      >
                        <img src={addRequirementIcon} alt="Plus" />
                        <span>Add Requirements</span>
                      </button>
                    </div>
                  </div>

                  <div className="recruiter-postjob-grid-2-col recruiter-postjob-mt-20">
                    <div className="recruiter-postjob-form-group">
                      <label>Required Skills</label>
                      <div className="recruiter-postjob-dynamic-list">
                        {requiredSkills.map((skill, index) => (
                          <div
                            className="recruiter-postjob-list-item"
                            key={index}
                          >
                            <div className="recruiter-postjob-list-content">
                              <input
                                type="text"
                                placeholder={`Skill ${index + 1}`}
                                value={skill}
                                onChange={(e) =>
                                  updateListItem(
                                    index,
                                    e.target.value,
                                    setRequiredSkills,
                                  )
                                }
                              />
                            </div>
                            <button
                              type="button"
                              className="recruiter-postjob-list-action"
                              onClick={() => removeSkill(index)}
                              aria-label="Remove skill"
                            >
                              <img src={tagRemoveIcon} alt="Delete" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="recruiter-postjob-add-btn"
                          onClick={() => addListItem(setRequiredSkills)}
                        >
                          <img src={addRequirementIcon} alt="Plus" />
                          <span>Add Skill</span>
                        </button>
                      </div>
                    </div>
                    <div className="recruiter-postjob-form-group">
                      <label>Experience & Education</label>
                      <div className="recruiter-postjob-grid-2-col-tight">
                        <div className="recruiter-postjob-input-wrapper">
                          <input
                            type="text"
                            placeholder="E.g. 5+ Years Experience"
                            value={formData.experience}
                            onChange={handleInputChange("experience")}
                          />
                        </div>
                        <div className="recruiter-postjob-input-wrapper">
                          <input
                            type="text"
                            placeholder="E.g. Bachelor's Degree"
                            value={formData.education}
                            onChange={handleInputChange("education")}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3: Compensation */}
              <section className="recruiter-postjob-card recruiter-postjob-card--compensation">
                <div className="recruiter-postjob-card-header">
                  <h3>Compensation and Benefits</h3>
                </div>
                <div className="recruiter-postjob-card-body">
                  <div className="recruiter-postjob-grid-3-col">
                    <div className="recruiter-postjob-form-group">
                      <label>
                        Salary Range (From){" "}
                        <span className="recruiter-postjob-required">*</span>
                      </label>
                      <div className="recruiter-postjob-input-wrapper">
                        <input
                          type="text"
                          placeholder="E.g. Rs. 40,000"
                          value={formData.salaryFrom}
                          onChange={handleInputChange("salaryFrom")}
                        />
                      </div>
                    </div>
                    <div className="recruiter-postjob-form-group">
                      <label>
                        Salary Range (To){" "}
                        <span className="recruiter-postjob-required">*</span>
                      </label>
                      <div className="recruiter-postjob-input-wrapper">
                        <input
                          type="text"
                          placeholder="E.g. Rs. 50,000"
                          value={formData.salaryTo}
                          onChange={handleInputChange("salaryTo")}
                        />
                      </div>
                    </div>
                    <div className="recruiter-postjob-form-group">
                      <label>
                        Currency{" "}
                        <span className="recruiter-postjob-required">*</span>
                      </label>
                      <div
                        className="recruiter-postjob-input-wrapper recruiter-postjob-dropdown recruiter-postjob-currency-dropdown"
                        ref={currencyDropdownRef}
                      >
                        <button
                          type="button"
                          className={`recruiter-postjob-currency-trigger ${
                            isCurrencyMenuOpen ? "open" : ""
                          }`}
                          onClick={() =>
                            setIsCurrencyMenuOpen((prev) => !prev)
                          }
                          aria-haspopup="listbox"
                          aria-expanded={isCurrencyMenuOpen}
                        >
                          <span>{selectedCurrencyLabel}</span>
                          <img
                            src={dropdownArrow}
                            alt=""
                            aria-hidden="true"
                            className={`recruiter-postjob-currency-caret ${
                              isCurrencyMenuOpen ? "open" : ""
                            }`}
                          />
                        </button>
                        {isCurrencyMenuOpen && (
                          <div className="recruiter-postjob-currency-menu" role="listbox">
                            <button
                              type="button"
                              className={`recruiter-postjob-currency-option ${
                                formData.currency === "" ? "active" : ""
                              }`}
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, currency: "" }));
                                setHasPosted(false);
                                setIsCurrencyMenuOpen(false);
                              }}
                            >
                              Select currency
                            </button>
                            {currencyOptions.map((option) => (
                              <button
                                key={option.code}
                                type="button"
                                className={`recruiter-postjob-currency-option ${
                                  formData.currency === option.code ? "active" : ""
                                }`}
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    currency: option.code,
                                  }));
                                  setHasPosted(false);
                                  setIsCurrencyMenuOpen(false);
                                }}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="recruiter-postjob-form-group recruiter-postjob-mt-20">
                    <label>Core Benefits</label>
                    <div className="recruiter-postjob-checkbox-group">
                      {benefitsOptions.map((benefit) => {
                        const isChecked = benefits.includes(benefit.label);
                        return (
                          <button
                            type="button"
                            key={benefit.label}
                            className="recruiter-postjob-checkbox-item"
                            onClick={() => toggleBenefit(benefit.label)}
                          >
                            <div
                              className={`recruiter-postjob-checkbox ${isChecked ? "checked" : ""}`}
                            >
                              {isChecked && (
                                <img src={benefit.icon} alt="Check" />
                              )}
                            </div>
                            <span>{benefit.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 4: Hiring Process */}
              <section className="recruiter-postjob-card">
                <div className="recruiter-postjob-card-header">
                  <h3>Hiring Process and Intelligence</h3>
                </div>
                <div className="recruiter-postjob-card-body">
                  <div className="recruiter-postjob-form-group">
                    <label>Interview Stage</label>
                    <p className="recruiter-postjob-interview-note">
                      Maximum 6 interview stages are allowed.
                    </p>
                    <div className="recruiter-postjob-dynamic-list">
                      {interviewStages.map((stage, index) => (
                        <div
                          className="recruiter-postjob-list-item"
                          key={index}
                        >
                          <div className="recruiter-postjob-list-content">
                            <input
                              type="text"
                              placeholder={`Stage ${index + 1}`}
                              value={stage}
                              onChange={(e) =>
                                updateStage(index, e.target.value)
                              }
                            />
                          </div>
                          <button
                            type="button"
                            className="recruiter-postjob-list-action"
                            onClick={() => removeStage(index)}
                            aria-label="Remove stage"
                          >
                            <img
                              src={
                                index === 0
                                  ? deleteStageFirstIcon
                                  : deleteStageSecondIcon
                              }
                              alt="Delete"
                            />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="recruiter-postjob-add-btn recruiter-postjob-mt-20"
                        onClick={addStage}
                        disabled={interviewStages.length >= MAX_INTERVIEW_STAGES}
                      >
                        <img src={addStageIcon} alt="Plus" />
                        <span>
                          {interviewStages.length >= MAX_INTERVIEW_STAGES
                            ? "Maximum 6 stages reached"
                            : "Add Stages"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 5: Assessment / Quiz */}
              <section className="recruiter-postjob-card recruiter-postjob-assessment-section">
                <div className="recruiter-postjob-card-header recruiter-postjob-assessment-header">
                  <h3>Assessment / Quiz</h3>
                </div>
                <div className="recruiter-postjob-card-body recruiter-postjob-assessment-body">
                  <div className="recruiter-postjob-grid-2-col recruiter-postjob-assessment-top-row">
                    <div className="recruiter-postjob-form-group">
                      <label>Attach Assessment to This Job</label>
                      <div className="recruiter-postjob-toggle-row">
                        <input
                          type="checkbox"
                          checked={assessmentEnabled}
                          onChange={(e) => {
                            setAssessmentEnabled(e.target.checked);
                            setAssessmentMode("none");
                            if (!e.target.checked) {
                              setSelectedAssessmentId("");
                              setAssessmentRequired(false);
                              setAssessmentMode("none");
                            }
                          }}
                        />
                        <span>
                          Attach an assessment to this job (optional or
                          mandatory).
                        </span>
                      </div>
                    </div>

                    {assessmentEnabled && (
                      <div className="recruiter-postjob-form-group">
                        <label>Assessment Requirement</label>
                        <div className="recruiter-postjob-segmented-control">
                          <button
                            className={`recruiter-postjob-segment ${assessmentRequired ? "active" : ""}`}
                            onClick={() => setAssessmentRequired(true)}
                          >
                            Mandatory
                          </button>
                          <button
                            className={`recruiter-postjob-segment ${!assessmentRequired ? "active" : ""}`}
                            onClick={() => setAssessmentRequired(false)}
                          >
                            Optional
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {assessmentEnabled && (
                    <>
                      <div className="recruiter-postjob-form-group">
                        <label>Assessment</label>
                        {!selectedAssessmentId ? (
                          <button
                            type="button"
                            className="recruiter-postjob-add-btn"
                            onClick={() => {
                              resetAssessmentForm();
                              setAssessmentMode("create");
                            }}
                          >
                            <img src={addRequirementIcon} alt="Plus" />
                            <span>Create Assessment</span>
                          </button>
                        ) : (
                          <div className="recruiter-postjob-segmented-control recruiter-postjob-assessment-viewedit-row">
                            <button
                              type="button"
                              className={`recruiter-postjob-segment ${
                                assessmentMode === "view" ? "active" : ""
                              }`}
                              onClick={() =>
                                loadAssessmentById(selectedAssessmentId, "view")
                              }
                            >
                              View Assessment
                            </button>
                            <button
                              type="button"
                              className={`recruiter-postjob-segment ${
                                assessmentMode === "edit" ? "active" : ""
                              }`}
                              onClick={() =>
                                loadAssessmentById(selectedAssessmentId, "edit")
                              }
                            >
                              Edit Assessment
                            </button>
                          </div>
                        )}
                      </div>

                      {assessmentMode !== "none" && (
                        <div className="recruiter-postjob-assessment-builder">
                          <div className="recruiter-postjob-card-header">
                            <h3>
                              {assessmentMode === "create"
                                ? "Create Assessment"
                                : assessmentMode === "edit"
                                  ? "Edit Assessment"
                                  : "View Assessment"}
                            </h3>
                          </div>
                          <div className="recruiter-postjob-form-group">
                            <label>Assessment Title *</label>
                            <div className="recruiter-postjob-input-wrapper">
                              <input
                                type="text"
                                placeholder="e.g. UI/UX Fundamentals"
                                value={assessmentForm.title}
                                disabled={isAssessmentReadOnly}
                                onChange={(e) =>
                                  updateAssessmentForm("title", e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <div className="recruiter-postjob-form-group">
                            <label>Assessment Description / Instructions *</label>
                            <div className="recruiter-postjob-quill-editor">
                              <ReactQuill
                                theme="snow"
                                value={assessmentForm.description}
                                readOnly={isAssessmentReadOnly}
                                onChange={(value) =>
                                  updateAssessmentForm("description", value)
                                }
                                modules={quillModules}
                                formats={quillFormats}
                                placeholder="Provide instructions for candidates..."
                              />
                            </div>
                          </div>

                          <div className="recruiter-postjob-grid-2-col">
                            <div className="recruiter-postjob-form-group">
                              <label>Assessment Type *</label>
                              <div className="recruiter-postjob-segmented-control">
                                {[
                                  { value: "quiz", label: "Quiz (MCQ)" },
                                  {
                                    value: "writing",
                                    label: "Writing",
                                  },
                                  { value: "task", label: "Task-Based" },
                                ].map((item) => (
                                  <button
                                    key={item.value}
                                    className={`recruiter-postjob-segment ${assessmentForm.type === item.value ? "active" : ""}`}
                                    disabled={isAssessmentReadOnly}
                                    onClick={() => {
                                      if (isAssessmentReadOnly) return;
                                      updateAssessmentForm("type", item.value);
                                    }}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="recruiter-postjob-form-group">
                              <label>Difficulty Level *</label>
                              <div className="recruiter-postjob-segmented-control">
                                {[
                                  { value: "beginner", label: "Beginner" },
                                  {
                                    value: "intermediate",
                                    label: "Intermediate",
                                  },
                                  { value: "advanced", label: "Advanced" },
                                ].map((item) => (
                                  <button
                                    key={item.value}
                                    className={`recruiter-postjob-segment ${assessmentForm.difficulty === item.value ? "active" : ""}`}
                                    disabled={isAssessmentReadOnly}
                                    onClick={() => {
                                      if (isAssessmentReadOnly) return;
                                      updateAssessmentForm(
                                        "difficulty",
                                        item.value,
                                      );
                                    }}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="recruiter-postjob-grid-3-col recruiter-postjob-mt-20">
                            <div className="recruiter-postjob-form-group">
                              <label>Time Limit (optional)</label>
                              <div className="recruiter-postjob-input-wrapper">
                                <input
                                  type="number"
                                  min="1"
                                  max="240"
                                  placeholder="e.g. 45"
                                  value={
                                    assessmentForm.timeLimit
                                      ? Number(
                                          assessmentForm.timeLimit.replace(
                                            /[^0-9]/g,
                                            "",
                                          ),
                                        )
                                      : ""
                                  }
                                  disabled={isAssessmentReadOnly}
                                  onChange={(e) =>
                                    updateAssessmentForm(
                                      "timeLimit",
                                      e.target.value
                                        ? `${e.target.value} minutes`
                                        : "",
                                    )
                                  }
                                />
                              </div>
                              <p className="recruiter-postjob-field-note">
                                Enter minutes only (e.g. 45).
                              </p>
                            </div>
                            <div className="recruiter-postjob-form-group">
                              <label>Maximum Attempts *</label>
                              <div className="recruiter-postjob-input-wrapper">
                                <input
                                  type="number"
                                  min="1"
                                  value={assessmentForm.maxAttempts}
                                  disabled={isAssessmentReadOnly}
                                  onChange={(e) =>
                                    updateAssessmentForm(
                                      "maxAttempts",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                            <div className="recruiter-postjob-form-group">
                              <label>Status *</label>
                              <div className="recruiter-postjob-segmented-control">
                                {[
                                  { value: "active", label: "Active" },
                                  { value: "inactive", label: "Inactive" },
                                ].map((item) => (
                                  <button
                                    key={item.value}
                                    className={`recruiter-postjob-segment ${assessmentForm.status === item.value ? "active" : ""}`}
                                    disabled={isAssessmentReadOnly}
                                    onClick={() => {
                                      if (isAssessmentReadOnly) return;
                                      updateAssessmentForm("status", item.value);
                                    }}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="recruiter-postjob-assessment-content recruiter-postjob-mt-20">
                            {assessmentForm.type === "quiz" && (
                              <div className="recruiter-postjob-assessment-type">
                                <div className="recruiter-postjob-assessment-header">
                                  <div>
                                    <h4>Quiz Assessment</h4>
                                    <p>
                                      Quiz scores are calculated automatically.
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    className="recruiter-postjob-add-btn"
                                    onClick={addAssessmentQuestion}
                                    disabled={isAssessmentReadOnly}
                                  >
                                    <img src={addRequirementIcon} alt="Plus" />
                                    <span>Add Question</span>
                                  </button>
                                </div>
                                {assessmentForm.quizQuestions.map(
                                  (question, index) => (
                                    <div
                                      key={index}
                                      className="recruiter-postjob-assessment-question"
                                    >
                                      <div className="recruiter-postjob-list-item">
                                        <div className="recruiter-postjob-list-content">
                                          <input
                                            type="text"
                                            placeholder={`Question ${index + 1}`}
                                            value={question.question}
                                            disabled={isAssessmentReadOnly}
                                            onChange={(e) =>
                                              updateAssessmentQuestion(
                                                index,
                                                e.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                        {!isAssessmentReadOnly &&
                                          assessmentForm.quizQuestions.length >
                                            1 && (
                                          <button
                                            type="button"
                                            className="recruiter-postjob-list-action"
                                            onClick={() =>
                                              removeAssessmentQuestion(index)
                                            }
                                          >
                                            <img
                                              src={deleteRequirementIcon}
                                              alt="Delete"
                                            />
                                          </button>
                                        )}
                                      </div>
                                      <div className="recruiter-postjob-assessment-options">
                                        {question.options.map(
                                          (option, optIndex) => (
                                            <div
                                              key={optIndex}
                                              className="recruiter-postjob-list-item"
                                            >
                                              <div className="recruiter-postjob-option-radio">
                                                <input
                                                  type="radio"
                                                  checked={
                                                    question.correctIndex ===
                                                    optIndex
                                                  }
                                                  disabled={isAssessmentReadOnly}
                                                  onChange={() =>
                                                    !isAssessmentReadOnly &&
                                                    setAssessmentCorrectOption(
                                                      index,
                                                      optIndex,
                                                    )
                                                  }
                                                />
                                              </div>
                                              <div
                                                className={`recruiter-postjob-list-content ${
                                                  isAssessmentReadOnly &&
                                                  question.correctIndex ===
                                                    optIndex
                                                    ? "recruiter-postjob-correct-option"
                                                    : ""
                                                }`}
                                              >
                                                <input
                                                  type="text"
                                                  placeholder={`Option ${optIndex + 1}`}
                                                  value={option}
                                                  disabled={isAssessmentReadOnly}
                                                  onChange={(e) =>
                                                    updateAssessmentOption(
                                                      index,
                                                      optIndex,
                                                      e.target.value,
                                                    )
                                                  }
                                                />
                                              </div>
                                              {!isAssessmentReadOnly &&
                                                question.options.length > 1 && (
                                                <button
                                                  type="button"
                                                  className="recruiter-postjob-list-action"
                                                  onClick={() =>
                                                    removeAssessmentOption(
                                                      index,
                                                      optIndex,
                                                    )
                                                  }
                                                >
                                                  <img
                                                    src={deleteRequirementIcon}
                                                    alt="Delete"
                                                  />
                                                </button>
                                              )}
                                            </div>
                                          ),
                                        )}
                                        {!isAssessmentReadOnly && (
                                          <button
                                            type="button"
                                            className="recruiter-postjob-add-btn"
                                            onClick={() =>
                                              addAssessmentOption(index)
                                            }
                                          >
                                            <img
                                              src={addRequirementIcon}
                                              alt="Plus"
                                            />
                                            <span>Add Option</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}

                            {assessmentForm.type === "writing" && (
                              <div className="recruiter-postjob-assessment-type">
                                <h4>Writing Assignment</h4>
                                <div className="recruiter-postjob-form-group">
                                  <label>Task Description *</label>
                                  <div className="recruiter-postjob-quill-editor">
                                    <ReactQuill
                                      theme="snow"
                                      value={assessmentForm.writingTask}
                                      readOnly={isAssessmentReadOnly}
                                      onChange={(value) =>
                                        updateAssessmentForm(
                                          "writingTask",
                                          value,
                                        )
                                      }
                                      modules={quillModules}
                                      formats={quillFormats}
                                      placeholder="Describe the writing task"
                                    />
                                  </div>
                                </div>
                                <div className="recruiter-postjob-form-group">
                                  <label>Submission Instructions *</label>
                                  <div className="recruiter-postjob-quill-editor">
                                    <ReactQuill
                                      theme="snow"
                                      value={assessmentForm.writingInstructions}
                                      readOnly={isAssessmentReadOnly}
                                      onChange={(value) =>
                                        updateAssessmentForm(
                                          "writingInstructions",
                                          value,
                                        )
                                      }
                                      modules={quillModules}
                                      formats={quillFormats}
                                      placeholder="Submission instructions"
                                    />
                                  </div>
                                </div>
                                <div className="recruiter-postjob-form-group">
                                  <label>Expected Submission Format *</label>
                                  <div className="recruiter-postjob-segmented-control">
                                    {[
                                      { value: "text", label: "Text" },
                                      { value: "file", label: "File" },
                                      { value: "link", label: "Link" },
                                    ].map((item) => (
                                      <button
                                        key={item.value}
                                        className={`recruiter-postjob-segment ${assessmentForm.writingFormat === item.value ? "active" : ""}`}
                                        disabled={isAssessmentReadOnly}
                                        onClick={() => {
                                          if (isAssessmentReadOnly) return;
                                          updateAssessmentForm(
                                            "writingFormat",
                                            item.value,
                                          );
                                        }}
                                      >
                                        {item.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {(assessmentForm.type === "task" ||
                              assessmentForm.type === "code") && (
                              <div className="recruiter-postjob-assessment-type">
                                <h4>Task-Based Assignment</h4>
                                <div className="recruiter-postjob-form-group">
                                  <label>Problem Statement *</label>
                                  <div className="recruiter-postjob-quill-editor">
                                    <ReactQuill
                                      theme="snow"
                                      value={assessmentForm.codeProblem}
                                      readOnly={isAssessmentReadOnly}
                                      onChange={(value) =>
                                        updateAssessmentForm(
                                          "codeProblem",
                                          value,
                                        )
                                      }
                                      modules={quillModules}
                                      formats={quillFormats}
                                      placeholder="Describe the coding challenge"
                                    />
                                  </div>
                                </div>
                                <div className="recruiter-postjob-form-group">
                                  <label>Relevant Tools / Languages</label>
                                  <div className="recruiter-postjob-dynamic-list">
                                    {(assessmentForm.codeLanguages.length > 0
                                      ? assessmentForm.codeLanguages
                                      : [""]).map((language, index) => (
                                      <div
                                        className="recruiter-postjob-list-item"
                                        key={index}
                                      >
                                        <div className="recruiter-postjob-list-content">
                                          <input
                                            type="text"
                                            placeholder={`Tool / Language ${index + 1}`}
                                            value={language}
                                            disabled={isAssessmentReadOnly}
                                            onChange={(e) =>
                                              updateAssessmentLanguage(
                                                index,
                                                e.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          className="recruiter-postjob-list-action"
                                          disabled={isAssessmentReadOnly}
                                          onClick={() => {
                                            if (isAssessmentReadOnly) return;
                                            removeAssessmentLanguage(index);
                                          }}
                                          aria-label="Remove language"
                                        >
                                          <img src={tagRemoveIcon} alt="Delete" />
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      className="recruiter-postjob-add-btn"
                                      disabled={isAssessmentReadOnly}
                                      onClick={() => {
                                        if (isAssessmentReadOnly) return;
                                        addAssessmentLanguage();
                                      }}
                                    >
                                      <img src={addRequirementIcon} alt="Plus" />
                                      <span>Add Tool / Language</span>
                                    </button>
                                  </div>
                                </div>
                                <div className="recruiter-postjob-form-group">
                                  <label>Submission Format *</label>
                                  <div className="recruiter-postjob-segmented-control">
                                    {[
                                      { value: "file", label: "File Upload" },
                                      { value: "link", label: "Task Link" },
                                    ].map((item) => (
                                      <button
                                        key={item.value}
                                        className={`recruiter-postjob-segment ${assessmentForm.codeSubmission === item.value ? "active" : ""}`}
                                        disabled={isAssessmentReadOnly}
                                        onClick={() => {
                                          if (isAssessmentReadOnly) return;
                                          updateAssessmentForm(
                                            "codeSubmission",
                                            item.value,
                                          );
                                        }}
                                      >
                                        {item.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="recruiter-postjob-form-group">
                                  <label>Evaluation Guidelines *</label>
                                  <div className="recruiter-postjob-quill-editor">
                                    <ReactQuill
                                      theme="snow"
                                      value={assessmentForm.codeEvaluation}
                                      readOnly={isAssessmentReadOnly}
                                      onChange={(value) =>
                                        updateAssessmentForm(
                                          "codeEvaluation",
                                          value,
                                        )
                                      }
                                      modules={quillModules}
                                      formats={quillFormats}
                                      placeholder="Provide evaluation guidelines"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {(assessmentSubmitError ||
                            assessmentSubmitSuccess) && (
                            <div className="recruiter-postjob-assessment-message">
                              {assessmentSubmitError || assessmentSubmitSuccess}
                            </div>
                          )}

                          {(assessmentMode === "create" ||
                            assessmentMode === "edit") && (
                            <div className="recruiter-jobpost-main-action-buttons recruiter-postjob-mt-20">
                              <button
                                className="recruiter-jobpost-btn-post-job"
                                onClick={handleSaveAssessment}
                              >
                                {assessmentMode === "create"
                                  ? "Create Assessment"
                                  : "Update Assessment"}
                              </button>
                              <button
                                className="recruiter-jobpost-btn-cancel"
                                onClick={() => setAssessmentMode("none")}
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {assessmentMode === "view" && (
                            <div className="recruiter-jobpost-main-action-buttons recruiter-postjob-mt-20">
                              <button
                                className="recruiter-jobpost-btn-post-job"
                                onClick={() => setAssessmentMode("edit")}
                              >
                                Edit Assessment
                              </button>
                              <button
                                className="recruiter-jobpost-btn-cancel"
                                onClick={() => setAssessmentMode("none")}
                              >
                                Close
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>

              {/* Section 5: Final Review and Preview - New Design */}
              <div className="recruiter-jobpost-preview-container">
                <div className="recruiter-jobpost-main-container">
                  {/* Header Section */}
                  <header className="recruiter-jobpost-preview-header">
                    <h2 className="recruiter-jobpost-header-title">
                      Final Review and Preview
                    </h2>
                  </header>

                  {/* Main Content Body */}
                  <div className="recruiter-jobpost-preview-body">
                    {/* Left Column: Job Card */}
                    <div className="recruiter-jobpost-job-card">
                      <article className="joblist-card-item">
                        <div className="joblist-card-top">
                          <img
                            src={previewCompanyLogo}
                            alt={companyName}
                            className="joblist-company-logo"
                          />
                        </div>
                        <div className="joblist-card-company">{companyName}</div>
                        <div className="joblist-card-meta">
                          <img src={workModeIcon} alt="Work mode" />
                          {formattedWorkMode || "Work Mode"}
                        </div>
                        <h3 className="joblist-card-title">
                          {formData.jobTitle.trim() || "Job Title"}
                        </h3>
                        <div className="joblist-card-info">
                          <span>
                            <img src={locationIcon} alt="Location" />
                            {formData.location.trim() || "Location"}
                          </span>
                          <span>
                            <img src={jobTypeIcon} alt="Job type" />
                            {formData.jobType.trim() || "Job Type"}
                          </span>
                        </div>
                        <div className="joblist-card-buttons">
                          <button className="joblist-btn-primary">
                            Apply Now
                          </button>
                        </div>
                      </article>
                    </div>

                    {/* Right Column: Preview Context */}
                    <div className="recruiter-jobpost-preview-context">
                      <h4 className="recruiter-jobpost-context-label">
                        Job Card Preview
                      </h4>
                      <p className="recruiter-jobpost-preview-note">
                        This is only a visual preview and is not functional.
                      </p>

                      <div
                        className={`recruiter-jobpost-alert-box ${
                          shouldShowSuccess || isFormComplete
                            ? "recruiter-jobpost-alert-box--success"
                            : "recruiter-jobpost-alert-box--error"
                        }`}
                      >
                        <img
                          src={
                            shouldShowSuccess || isFormComplete
                              ? successIcon
                              : errorIcon
                          }
                          alt={
                            shouldShowSuccess || isFormComplete
                              ? "Success"
                              : "Missing Info"
                          }
                          className="recruiter-jobpost-alert-icon"
                        />
                        <div className="recruiter-jobpost-alert-content">
                          <div
                            className={`recruiter-jobpost-alert-title ${
                              shouldShowSuccess || isFormComplete
                                ? "recruiter-jobpost-alert-title--success"
                                : "recruiter-jobpost-alert-title--error"
                            }`}
                          >
                            {shouldShowSuccess || isFormComplete
                              ? "Posting looks great!"
                              : "Missing required information"}
                          </div>
                          <div
                            className={`recruiter-jobpost-alert-desc ${
                              shouldShowSuccess || isFormComplete
                                ? "recruiter-jobpost-alert-desc--success"
                                : "recruiter-jobpost-alert-desc--error"
                            }`}
                          >
                            {shouldShowSuccess
                              ? "Job posted successfully."
                              : isFormComplete
                                ? "All required fields are completed."
                                : `Please complete: ${missingFields.join(", ")}.`}
                          </div>
                        </div>
                      </div>
                      {submitError && (
                        <div className="recruiter-jobpost-error-text">
                          {submitError}
                        </div>
                      )}
                      {submitSuccess && (
                        <div className="recruiter-jobpost-success-text">
                          {submitSuccess}
                        </div>
                      )}

                      <div className="recruiter-jobpost-main-action-buttons">
                          <button
                            className="recruiter-jobpost-btn-post-job"
                            onClick={handlePostJob}
                            disabled={isSubmitting || hasPosted}
                          >
                            {hasPosted
                              ? isEditMode
                                ? "Updated"
                                : "Posted"
                              : isSubmitting
                                ? isEditMode
                                  ? "Updating..."
                                  : "Posting..."
                                : isEditMode
                                  ? "Update Job"
                                  : "Post Job"}
                          </button>
                        <button
                          className="recruiter-jobpost-btn-cancel"
                          onClick={handleCancel}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <PortalFooter />
        </div>
      </div>
    </div>
  );
};

export default RecruiterJobPostPage;


