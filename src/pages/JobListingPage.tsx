import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ApplyJobModal from "../components/ApplyJobModal";
import "../styles/JobListingPage.css";

// TODO: Replace with actual files in Job List Page Images folder
import heroBg from "../images/Job List Page Images/hero-bg.svg";
import searchIcon from "../images/Job List Page Images/search.svg";
import locationIcon from "../images/Job List Page Images/location.svg";
import categoryIcon from "../images/Job List Page Images/category.svg";
import jobTypeIcon from "../images/Job List Page Images/job-type.svg";
import salaryIcon from "../images/Job List Page Images/salary.svg";
import levelIcon from "../images/Job List Page Images/level.svg";
import workModeIcon from "../images/Job List Page Images/work-mode.svg";
import educationIcon from "../images/Job List Page Images/education.svg";
import experienceIcon from "../images/Job List Page Images/experience.svg";
import skillIcon from "../images/Job List Page Images/Skills.svg";
import promoIllustration from "../images/Job List Page Images/promo-illustration.svg";
import bookmarkIcon from "../images/Recruiter Job Post Page Images/bookmarkIcon.svg";
import savedBookmarkIcon from "../images/Recruiter Job Post Page Images/bookmarkFilled.svg";
import shareIcon from "../images/Recruiter Job Post Page Images/shareFg.svg";
import companyLogo from "../images/Recruiter Job Post Page Images/companyLogo.png";
import prevIcon from "../images/Employers Page Images/Prev Icon.svg";
import nextIcon from "../images/Employers Page Images/Next Icon.svg";
import minusIcon from "../images/Employers Page Images/minus.png";
import plusIcon from "../images/Employers Page Images/expand.png";
import dropdownArrow from "../images/Register Page Images/1_2307.svg";
import closeIcon from "../images/Candidate Profile Page Images/corss icon.png";

type JobCard = {
  id: string;
  companyName: string;
  jobTitle: string;
  workMode: string;
  location: string;
  jobType: string;
  companyLogo?: string;
  assessmentRequired?: boolean;
};

type ApplyModalJob = {
  jobTitle: string;
  companyName: string;
  education?: string;
  experience?: string;
};

type ConnectedUser = {
  id: string;
  fullName: string;
  role: string;
  email?: string;
};

type AppliedFilters = {
  search: string;
  location: string;
  department: string;
  workMode: string[];
  jobType: string[];
  jobLevel: string[];
  experience: string;
  education: string;
  skills: string;
  currency: string;
  salaryFrom: string;
  salaryTo: string;
};

const JobListingPage = () => {
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState("newest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const limit = 20;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterWorkMode, setFilterWorkMode] = useState({
    remote: false,
    "on-site": false,
    hybrid: false,
  });
  const [workModeCounts, setWorkModeCounts] = useState({
    remote: 0,
    "on-site": 0,
    hybrid: 0,
  });
  const [filterJobType, setFilterJobType] = useState({
    "Full Time": false,
    "Part Time": false,
    Contract: false,
    Internship: false,
  });
  const [jobTypeCounts, setJobTypeCounts] = useState({
    "Full Time": 0,
    "Part Time": 0,
    Contract: 0,
    Internship: 0,
  });
  const [filterJobLevel, setFilterJobLevel] = useState({
    Junior: false,
    Mid: false,
    Senior: false,
    Lead: false,
  });
  const [jobLevelCounts, setJobLevelCounts] = useState({
    Junior: 0,
    Mid: 0,
    Senior: 0,
    Lead: 0,
  });
  const [filterExperience, setFilterExperience] = useState("");
  const [filterEducation, setFilterEducation] = useState("");
  const [filterSkills, setFilterSkills] = useState("");
  const [filterCurrency, setFilterCurrency] = useState("");
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [filterSalaryFrom, setFilterSalaryFrom] = useState("");
  const [filterSalaryTo, setFilterSalaryTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    search: "",
    location: "",
    department: "",
    workMode: [],
    jobType: [],
    jobLevel: [],
    experience: "",
    education: "",
    skills: "",
    currency: "",
    salaryFrom: "",
    salaryTo: "",
  });
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyJobId, setApplyJobId] = useState<string | null>(null);
  const [applyJobDetails, setApplyJobDetails] = useState<ApplyModalJob | null>(
    null,
  );
  const [applyProfileResume, setApplyProfileResume] = useState<string>("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyError, setApplyError] = useState("");
  const [dismissedApplyToastKey, setDismissedApplyToastKey] = useState("");
  const [useCustomResume, setUseCustomResume] = useState(false);
  const [customResumeFile, setCustomResumeFile] = useState<File | null>(null);
  const [applyNote, setApplyNote] = useState("");
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});
  const [savedJobs, setSavedJobs] = useState<Record<string, boolean>>({});
  const [confirmRequirements, setConfirmRequirements] = useState(false);
  const [confirmResume, setConfirmResume] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareJob, setShareJob] = useState<JobCard | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [shareUsers, setShareUsers] = useState<ConnectedUser[]>([]);
  const [selectedShareUserId, setSelectedShareUserId] = useState("");
  const [shareUserQuery, setShareUserQuery] = useState("");
  const [isShareUserDropdownOpen, setIsShareUserDropdownOpen] = useState(false);
  const [isShareLoading, setIsShareLoading] = useState(false);
  const [isSendingShare, setIsSendingShare] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [shareError, setShareError] = useState("");
  const sortDropdownRef = useRef<HTMLDivElement | null>(null);
  const currencyDropdownRef = useRef<HTMLDivElement | null>(null);
  const shareUserDropdownRef = useRef<HTMLDivElement | null>(null);

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    location: false,
    department: false,
    workMode: false,
    jobType: false,
    jobLevel: false,
    experience: false,
    education: false,
    skills: false,
    salaryRange: false,
  });

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

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.set("sort", sortBy);
    params.set("page", String(page));
    params.set("limit", String(limit));

    const urlSearch = (searchParams.get("search") || "").trim();
    const urlLocation = (searchParams.get("location") || "").trim();
    const effectiveSearch = appliedFilters.search || urlSearch;
    const effectiveLocation = appliedFilters.location || urlLocation;

    if (effectiveSearch) params.set("search", effectiveSearch);
    if (effectiveLocation) params.set("location", effectiveLocation);
    if (appliedFilters.department)
      params.set("department", appliedFilters.department);
    if (appliedFilters.workMode.length > 0) {
      params.set("workMode", appliedFilters.workMode.join(","));
    }
    if (appliedFilters.jobType.length > 0) {
      params.set("jobType", appliedFilters.jobType.join(","));
    }
    if (appliedFilters.jobLevel.length > 0) {
      params.set("jobLevel", appliedFilters.jobLevel.join(","));
    }
    if (appliedFilters.experience)
      params.set("experience", appliedFilters.experience);
    if (appliedFilters.education)
      params.set("education", appliedFilters.education);
    if (appliedFilters.skills) params.set("skills", appliedFilters.skills);
    if (appliedFilters.currency)
      params.set("currency", appliedFilters.currency);
    const sanitizedSalaryFrom = appliedFilters.salaryFrom.replace(/,/g, "").trim();
    const sanitizedSalaryTo = appliedFilters.salaryTo.replace(/,/g, "").trim();
    if (sanitizedSalaryFrom) params.set("salaryFrom", sanitizedSalaryFrom);
    if (sanitizedSalaryTo) params.set("salaryTo", sanitizedSalaryTo);

    return params.toString();
  };

  const buildWorkModeCountQuery = () => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", "2000");

    const urlSearch = (searchParams.get("search") || "").trim();
    const urlLocation = (searchParams.get("location") || "").trim();
    const effectiveSearch = appliedFilters.search || urlSearch;
    const effectiveLocation = appliedFilters.location || urlLocation;

    if (effectiveSearch) params.set("search", effectiveSearch);
    if (effectiveLocation) params.set("location", effectiveLocation);
    if (appliedFilters.department)
      params.set("department", appliedFilters.department);
    if (appliedFilters.jobType.length > 0) {
      params.set("jobType", appliedFilters.jobType.join(","));
    }
    if (appliedFilters.jobLevel.length > 0) {
      params.set("jobLevel", appliedFilters.jobLevel.join(","));
    }
    if (appliedFilters.experience)
      params.set("experience", appliedFilters.experience);
    if (appliedFilters.education)
      params.set("education", appliedFilters.education);
    if (appliedFilters.skills) params.set("skills", appliedFilters.skills);
    if (appliedFilters.currency)
      params.set("currency", appliedFilters.currency);
    const sanitizedSalaryFrom = appliedFilters.salaryFrom.replace(/,/g, "").trim();
    const sanitizedSalaryTo = appliedFilters.salaryTo.replace(/,/g, "").trim();
    if (sanitizedSalaryFrom) params.set("salaryFrom", sanitizedSalaryFrom);
    if (sanitizedSalaryTo) params.set("salaryTo", sanitizedSalaryTo);

    return params.toString();
  };

  const buildJobTypeCountQuery = () => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", "2000");

    const urlSearch = (searchParams.get("search") || "").trim();
    const urlLocation = (searchParams.get("location") || "").trim();
    const effectiveSearch = appliedFilters.search || urlSearch;
    const effectiveLocation = appliedFilters.location || urlLocation;

    if (effectiveSearch) params.set("search", effectiveSearch);
    if (effectiveLocation) params.set("location", effectiveLocation);
    if (appliedFilters.department)
      params.set("department", appliedFilters.department);
    if (appliedFilters.workMode.length > 0) {
      params.set("workMode", appliedFilters.workMode.join(","));
    }
    if (appliedFilters.jobLevel.length > 0) {
      params.set("jobLevel", appliedFilters.jobLevel.join(","));
    }
    if (appliedFilters.experience)
      params.set("experience", appliedFilters.experience);
    if (appliedFilters.education)
      params.set("education", appliedFilters.education);
    if (appliedFilters.skills) params.set("skills", appliedFilters.skills);
    if (appliedFilters.currency)
      params.set("currency", appliedFilters.currency);
    const sanitizedSalaryFrom = appliedFilters.salaryFrom.replace(/,/g, "").trim();
    const sanitizedSalaryTo = appliedFilters.salaryTo.replace(/,/g, "").trim();
    if (sanitizedSalaryFrom) params.set("salaryFrom", sanitizedSalaryFrom);
    if (sanitizedSalaryTo) params.set("salaryTo", sanitizedSalaryTo);

    return params.toString();
  };

  const buildJobLevelCountQuery = () => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", "2000");

    const urlSearch = (searchParams.get("search") || "").trim();
    const urlLocation = (searchParams.get("location") || "").trim();
    const effectiveSearch = appliedFilters.search || urlSearch;
    const effectiveLocation = appliedFilters.location || urlLocation;

    if (effectiveSearch) params.set("search", effectiveSearch);
    if (effectiveLocation) params.set("location", effectiveLocation);
    if (appliedFilters.department)
      params.set("department", appliedFilters.department);
    if (appliedFilters.workMode.length > 0) {
      params.set("workMode", appliedFilters.workMode.join(","));
    }
    if (appliedFilters.jobType.length > 0) {
      params.set("jobType", appliedFilters.jobType.join(","));
    }
    if (appliedFilters.experience)
      params.set("experience", appliedFilters.experience);
    if (appliedFilters.education)
      params.set("education", appliedFilters.education);
    if (appliedFilters.skills) params.set("skills", appliedFilters.skills);
    if (appliedFilters.currency)
      params.set("currency", appliedFilters.currency);
    const sanitizedSalaryFrom = appliedFilters.salaryFrom.replace(/,/g, "").trim();
    const sanitizedSalaryTo = appliedFilters.salaryTo.replace(/,/g, "").trim();
    if (sanitizedSalaryFrom) params.set("salaryFrom", sanitizedSalaryFrom);
    if (sanitizedSalaryTo) params.set("salaryTo", sanitizedSalaryTo);

    return params.toString();
  };

  const normalizeWorkModeKey = (
    mode?: string,
  ): "remote" | "on-site" | "hybrid" => {
    if (!mode) return "remote";
    const normalized = mode.toLowerCase().trim();
    if (normalized === "hybrid") return "hybrid";
    if (normalized === "on-site" || normalized === "onsite") return "on-site";
    return "remote";
  };

  const normalizeJobTypeKey = (
    jobType?: string,
  ): "Full Time" | "Part Time" | "Contract" | "Internship" => {
    const normalized = (jobType || "").toLowerCase().replace(/[-\s]/g, "");
    if (normalized.includes("parttime")) return "Part Time";
    if (normalized.includes("contract")) return "Contract";
    if (normalized.includes("intern")) return "Internship";
    return "Full Time";
  };

  const normalizeJobLevelKey = (
    jobLevel?: string,
  ): "Junior" | "Mid" | "Senior" | "Lead" => {
    const normalized = (jobLevel || "").toLowerCase();
    if (normalized.includes("lead")) return "Lead";
    if (normalized.includes("senior")) return "Senior";
    if (normalized.includes("mid")) return "Mid";
    return "Junior";
  };

  const applyFilters = (override?: Partial<AppliedFilters>) => {
    const workModeSelected = Object.entries(filterWorkMode)
      .filter(([, selected]) => selected)
      .map(([value]) => value);
    const jobTypeSelected = Object.entries(filterJobType)
      .filter(([, selected]) => selected)
      .map(([value]) => value);
    const jobLevelSelected = Object.entries(filterJobLevel)
      .filter(([, selected]) => selected)
      .map(([value]) => value);

    setAppliedFilters({
      search: searchTerm.trim(),
      location: filterLocation.trim(),
      department: filterDepartment.trim(),
      workMode: workModeSelected,
      jobType: jobTypeSelected,
      jobLevel: jobLevelSelected,
      experience: filterExperience.trim(),
      education: filterEducation.trim(),
      skills: filterSkills.trim(),
      currency: filterCurrency,
      salaryFrom: filterSalaryFrom.trim(),
      salaryTo: filterSalaryTo.trim(),
      ...override,
    });
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterLocation("");
    setFilterDepartment("");
    setFilterWorkMode({
      remote: false,
      "on-site": false,
      hybrid: false,
    });
    setFilterJobType({
      "Full Time": false,
      "Part Time": false,
      Contract: false,
      Internship: false,
    });
    setFilterJobLevel({
      Junior: false,
      Mid: false,
      Senior: false,
      Lead: false,
    });
    setFilterExperience("");
    setFilterEducation("");
    setFilterSkills("");
    setFilterCurrency("");
    setFilterSalaryFrom("");
    setFilterSalaryTo("");
    setAppliedFilters({
      search: "",
      location: "",
      department: "",
      workMode: [],
      jobType: [],
      jobLevel: [],
      experience: "",
      education: "",
      skills: "",
      currency: "",
      salaryFrom: "",
      salaryTo: "",
    });
    setPage(1);
  };

  const fetchAppliedStatuses = async (jobIds: string[]) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      const entries = await Promise.all(
        jobIds.map(async (jobId) => {
          const res = await fetch(
            `${API_BASE_URL}/applications/status/${jobId}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const data = await res.json();
          return [jobId, Boolean(data.applied)];
        }),
      );
      const map = Object.fromEntries(entries);
      setAppliedJobs(map);
    } catch {
      // ignore
    }
  };

  const fetchSavedStatuses = async (jobIds: string[]) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      const entries = await Promise.all(
        jobIds.map(async (jobId) => {
          const res = await fetch(
            `${API_BASE_URL}/saved-jobs/status/${jobId}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const data = await res.json();
          return [jobId, Boolean(data.saved)];
        }),
      );
      const map = Object.fromEntries(entries);
      setSavedJobs(map);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const initialSearch = (searchParams.get("search") || "").trim();
    const initialLocation = (searchParams.get("location") || "").trim();

    if (!initialSearch && !initialLocation) return;

    setSearchTerm(initialSearch);
    setFilterLocation(initialLocation);
    setAppliedFilters((prev) => ({
      ...prev,
      search: initialSearch,
      location: initialLocation,
    }));
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSortOpen(false);
      }
      if (
        currencyDropdownRef.current &&
        !currencyDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyOpen(false);
      }
      if (
        shareUserDropdownRef.current &&
        !shareUserDropdownRef.current.contains(event.target as Node)
      ) {
        setIsShareUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectedCurrencyLabel =
    filterCurrency === "NPR"
      ? "NPR (Rs.)"
      : filterCurrency === "INR"
        ? "INR (Rs.)"
        : filterCurrency === "USD"
          ? "USD ($)"
          : filterCurrency === "GBP"
            ? "GBP (GBP)"
            : "Select currency";

  const filteredShareUsers = useMemo(() => {
    const normalizedQuery = shareUserQuery.trim().toLowerCase();
    if (!normalizedQuery) return shareUsers;

    return shareUsers.filter((user) => {
      const name = (user.fullName || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      const role = (user.role || "").toLowerCase();
      return (
        name.includes(normalizedQuery) ||
        email.includes(normalizedQuery) ||
        role.includes(normalizedQuery)
      );
    });
  }, [shareUsers, shareUserQuery]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(
          `${API_BASE_URL}/jobs?${buildQueryParams()}`,
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Failed to load job posts");
        }

        const mappedJobs = (data.jobs || []).map((job: any) => ({
          id: job.id || job._id,
          companyName: job.companyName || job.department || "Company",
          jobTitle: job.jobTitle || "Untitled Role",
          workMode: job.workMode ? job.workMode.replace("-", " ") : "Remote",
          location: job.location || "Location",
          jobType: job.jobType || "Full-Time",
          companyLogo: job.companyLogo || "",
          assessmentRequired: Boolean(job.assessmentRequired),
        }));

        setJobCards(mappedJobs);
        setTotalJobs(data.total || 0);
        fetchAppliedStatuses(mappedJobs.map((j: JobCard) => j.id));
        fetchSavedStatuses(mappedJobs.map((j: JobCard) => j.id));

        // Work mode counts should reflect current filters except work mode itself.
        const countResponse = await fetch(
          `${API_BASE_URL}/jobs?${buildWorkModeCountQuery()}`,
        );
        const countData = await countResponse.json();
        if (countResponse.ok) {
          const counts = { remote: 0, "on-site": 0, hybrid: 0 };
          (countData.jobs || []).forEach((job: any) => {
            const key = normalizeWorkModeKey(job.workMode);
            counts[key] += 1;
          });
          setWorkModeCounts(counts);
        }

        // Job type counts should reflect current filters except job type itself.
        const jobTypeCountResponse = await fetch(
          `${API_BASE_URL}/jobs?${buildJobTypeCountQuery()}`,
        );
        const jobTypeCountData = await jobTypeCountResponse.json();
        if (jobTypeCountResponse.ok) {
          const counts = {
            "Full Time": 0,
            "Part Time": 0,
            Contract: 0,
            Internship: 0,
          };
          (jobTypeCountData.jobs || []).forEach((job: any) => {
            const key = normalizeJobTypeKey(job.jobType);
            counts[key] += 1;
          });
          setJobTypeCounts(counts);
        }

        // Job level counts should reflect current filters except job level itself.
        const jobLevelCountResponse = await fetch(
          `${API_BASE_URL}/jobs?${buildJobLevelCountQuery()}`,
        );
        const jobLevelCountData = await jobLevelCountResponse.json();
        if (jobLevelCountResponse.ok) {
          const counts = { Junior: 0, Mid: 0, Senior: 0, Lead: 0 };
          (jobLevelCountData.jobs || []).forEach((job: any) => {
            const key = normalizeJobLevelKey(job.jobLevel);
            counts[key] += 1;
          });
          setJobLevelCounts(counts);
        }
      } catch {
        setError("No data found currently.");
        setJobCards([]);
        setTotalJobs(0);
        setWorkModeCounts({ remote: 0, "on-site": 0, hybrid: 0 });
        setJobTypeCounts({
          "Full Time": 0,
          "Part Time": 0,
          Contract: 0,
          Internship: 0,
        });
        setJobLevelCounts({ Junior: 0, Mid: 0, Senior: 0, Lead: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [sortBy, page, appliedFilters]);

  const startIndex = totalJobs > 0 ? (page - 1) * limit + 1 : 0;
  const endIndex = totalJobs > 0 ? (page - 1) * limit + jobCards.length : 0;
  const totalPages = Math.max(Math.ceil(totalJobs / limit), 1);
  const visiblePages = Array.from(
    { length: Math.min(totalPages, 7) },
    (_, index) => index + 1,
  );

  const resolveLogo = (logo?: string) => {
    if (!logo) return images.companyLogo;
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

  const images = {
    heroBg,
    searchIcon,
    locationIcon,
    categoryIcon,
    jobTypeIcon,
    salaryIcon,
    levelIcon,
    workModeIcon,
    educationIcon,
    experienceIcon,
    skillIcon,
    promoIllustration,
    bookmarkIcon,
    savedBookmarkIcon,
    shareIcon,
    companyLogo,
    prevIcon,
    nextIcon,
    minusIcon,
    plusIcon,
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
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

  const openApplyModal = async (jobId: string) => {
    if (userRole !== "candidate") return;
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
        fetch(`${API_BASE_URL}/jobs/${jobId}`),
        fetch(`${API_BASE_URL}/profile/me`, {
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
    } catch (err: any) {
      setApplyError("Unable to load application details.");
    } finally {
      setApplyLoading(false);
    }
  };

  const closeApplyModal = () => {
    setApplyModalOpen(false);
  };

  const toggleSaveJob = async (jobId: string) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/saved-jobs/toggle`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSavedJobs((prev) => ({ ...prev, [jobId]: Boolean(data.saved) }));
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

      const response = await fetch(
        `${API_BASE_URL}/applications/apply`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to apply");
      }

      setApplyMessage("Application submitted. Recruiter will be notified.");
      setAppliedJobs((prev) => ({ ...prev, [applyJobId as string]: true }));
      setApplyModalOpen(false);
    } catch (err: any) {
      setApplyError(err?.message || "Failed to apply");
    } finally {
      setApplyLoading(false);
    }
  };

  const closeShareModal = () => {
    setIsShareModalOpen(false);
    setShareJob(null);
    setShareLink("");
    setSelectedShareUserId("");
    setShareUserQuery("");
    setIsShareUserDropdownOpen(false);
    setShareMessage("");
    setShareError("");
  };

  const openShareModal = async (job: JobCard) => {
    const token = localStorage.getItem("authToken");
    if (
      !token ||
      !userRole ||
      (userRole !== "candidate" && userRole !== "recruiter")
    ) {
      navigate("/login");
      return;
    }

    const origin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
    const nextLink = `${origin}/jobs/${job.id}`;

    setShareJob(job);
    setShareLink(nextLink);
    setIsShareModalOpen(true);
    setShareMessage("");
    setShareError("");
    setSelectedShareUserId("");
    setShareUserQuery("");
    setIsShareUserDropdownOpen(false);

    try {
      setIsShareLoading(true);
      const res = await fetch(`${API_BASE_URL}/connections/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load connected users");
      }
      setShareUsers(data?.friends || []);
    } catch (err: any) {
      setShareUsers([]);
      setShareError(err?.message || "Failed to load connected users");
    } finally {
      setIsShareLoading(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareMessage("Link copied.");
      setShareError("");
    } catch {
      setShareError("Unable to copy link.");
    }
  };

  const handleShareToUser = async () => {
    if (!selectedShareUserId || !shareJob || !shareLink) {
      setShareError("Please select a user to share.");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      setShareError("Please log in to share with users.");
      return;
    }

    try {
      setIsSendingShare(true);
      setShareError("");
      const content = `Check out this job: ${shareJob.jobTitle} at ${shareJob.companyName}\n${shareLink}`;
      const res = await fetch(`${API_BASE_URL}/messages/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: selectedShareUserId,
          content,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to share job");
      }
      setShareMessage("Job shared successfully.");
    } catch (err: any) {
      setShareError(err?.message || "Failed to share job.");
    } finally {
      setIsSendingShare(false);
    }
  };

  return (
    <div className="joblist-page">
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

      <section className="joblist-hero">
        <div className="joblist-hero-inner">
          <div className="joblist-hero-text">
            <h1>Discover Opportunities That Match Your Skills</h1>
            <p>
              Explore verified jobs from trusted companies on HireLink and find
              the role that fits your career goals.
            </p>
          </div>
        </div>
        <div className="joblist-hero-search">
          <div className="joblist-search-pill">
            <div className="joblist-search-field">
              <img src={images.searchIcon} alt="Search" />
              <input
                type="text"
                placeholder="Search company or job title"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    applyFilters();
                  }
                }}
              />
            </div>
            <button
              className="joblist-search-btn"
              onClick={() => applyFilters()}
            >
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="joblist-content">
        <div className="joblist-layout">
          <aside className="joblist-sidebar">
            <div className="joblist-card joblist-filter-group">
              <div className="joblist-filter-header">
                <span>Location</span>
                <button
                  className="joblist-toggle-icon"
                  onClick={() => toggleSection("location")}
                  aria-label={expandedSections.location ? "Collapse" : "Expand"}
                >
                  <img
                    src={
                      expandedSections.location
                        ? images.minusIcon
                        : images.plusIcon
                    }
                    alt={expandedSections.location ? "Collapse" : "Expand"}
                  />
                </button>
              </div>
              {expandedSections.location && (
                <div className="joblist-input-row">
                  <img src={images.locationIcon} alt="Location" />
                  <input
                    type="text"
                    placeholder="City or country"
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="joblist-divider"></div>

            <div className="joblist-card joblist-filter-group">
              <div className="joblist-filter-header">
                <span>Department</span>
                <button
                  className="joblist-toggle-icon"
                  onClick={() => toggleSection("department")}
                  aria-label={
                    expandedSections.department ? "Collapse" : "Expand"
                  }
                >
                  <img
                    src={
                      expandedSections.department
                        ? images.minusIcon
                        : images.plusIcon
                    }
                    alt={expandedSections.department ? "Collapse" : "Expand"}
                  />
                </button>
              </div>
              {expandedSections.department && (
                <div className="joblist-input-row">
                  <img src={images.categoryIcon} alt="Department" />
                  <input
                    type="text"
                    placeholder="Design, Product, Engineering"
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="joblist-divider"></div>

            <div className="joblist-card joblist-filter-group">
              <div className="joblist-filter-header">
                <span>Work Mode</span>
                <button
                  className="joblist-toggle-icon"
                  onClick={() => toggleSection("workMode")}
                  aria-label={expandedSections.workMode ? "Collapse" : "Expand"}
                >
                  <img
                    src={
                      expandedSections.workMode
                        ? images.minusIcon
                        : images.plusIcon
                    }
                    alt={expandedSections.workMode ? "Collapse" : "Expand"}
                  />
                </button>
              </div>
              {expandedSections.workMode && (
                <div className="joblist-checklist">
                  <label>
                    <input
                      type="checkbox"
                      checked={filterWorkMode.remote}
                      onChange={(e) =>
                        setFilterWorkMode((prev) => ({
                          ...prev,
                          remote: e.target.checked,
                        }))
                      }
                    />{" "}
                    Remote
                    <span className="joblist-count">{workModeCounts.remote}</span>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={filterWorkMode["on-site"]}
                      onChange={(e) =>
                        setFilterWorkMode((prev) => ({
                          ...prev,
                          "on-site": e.target.checked,
                        }))
                      }
                    />{" "}
                    On-Site
                    <span className="joblist-count">{workModeCounts["on-site"]}</span>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={filterWorkMode.hybrid}
                      onChange={(e) =>
                        setFilterWorkMode((prev) => ({
                          ...prev,
                          hybrid: e.target.checked,
                        }))
                      }
                    />{" "}
                    Hybrid
                    <span className="joblist-count">{workModeCounts.hybrid}</span>
                  </label>
                </div>
              )}
            </div>

            <div className="joblist-divider"></div>

            <div className="joblist-card joblist-filter-group">
              <div className="joblist-filter-header">
                <span>Job Type</span>
                <button
                  className="joblist-toggle-icon"
                  onClick={() => toggleSection("jobType")}
                  aria-label={expandedSections.jobType ? "Collapse" : "Expand"}
                >
                  <img
                    src={
                      expandedSections.jobType
                        ? images.minusIcon
                        : images.plusIcon
                    }
                    alt={expandedSections.jobType ? "Collapse" : "Expand"}
                  />
                </button>
              </div>
              {expandedSections.jobType && (
                <div className="joblist-checklist">
                  <label>
                    <input
                      type="checkbox"
                      checked={filterJobType["Full Time"]}
                      onChange={(e) =>
                        setFilterJobType((prev) => ({
                          ...prev,
                          "Full Time": e.target.checked,
                        }))
                      }
                    />{" "}
                    Full Time
                    <span className="joblist-count">{jobTypeCounts["Full Time"]}</span>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={filterJobType["Part Time"]}
                      onChange={(e) =>
                        setFilterJobType((prev) => ({
                          ...prev,
                          "Part Time": e.target.checked,
                        }))
                      }
                    />{" "}
                    Part Time
                    <span className="joblist-count">{jobTypeCounts["Part Time"]}</span>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={filterJobType.Contract}
                      onChange={(e) =>
                        setFilterJobType((prev) => ({
                          ...prev,
                          Contract: e.target.checked,
                        }))
                      }
                    />{" "}
                    Contract
                    <span className="joblist-count">{jobTypeCounts.Contract}</span>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={filterJobType.Internship}
                      onChange={(e) =>
                        setFilterJobType((prev) => ({
                          ...prev,
                          Internship: e.target.checked,
                        }))
                      }
                    />{" "}
                    Internship
                    <span className="joblist-count">{jobTypeCounts.Internship}</span>
                  </label>
                </div>
              )}
            </div>

            <div className="joblist-divider"></div>

            <div className="joblist-card joblist-filter-group">
              <div className="joblist-filter-header">
                <span>Job Level</span>
                <button
                  className="joblist-toggle-icon"
                  onClick={() => toggleSection("jobLevel")}
                  aria-label={expandedSections.jobLevel ? "Collapse" : "Expand"}
                >
                  <img
                    src={
                      expandedSections.jobLevel
                        ? images.minusIcon
                        : images.plusIcon
                    }
                    alt={expandedSections.jobLevel ? "Collapse" : "Expand"}
                  />
                </button>
              </div>
              {expandedSections.jobLevel && (
                <div className="joblist-checklist">
                  <label>
                    <input
                      type="checkbox"
                      checked={filterJobLevel.Junior}
                      onChange={(e) =>
                        setFilterJobLevel((prev) => ({
                          ...prev,
                          Junior: e.target.checked,
                        }))
                      }
                    />{" "}
                    Junior
                    <span className="joblist-count">{jobLevelCounts.Junior}</span>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={filterJobLevel.Mid}
                      onChange={(e) =>
                        setFilterJobLevel((prev) => ({
                          ...prev,
                          Mid: e.target.checked,
                        }))
                      }
                    />{" "}
                    Mid
                    <span className="joblist-count">{jobLevelCounts.Mid}</span>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={filterJobLevel.Senior}
                      onChange={(e) =>
                        setFilterJobLevel((prev) => ({
                          ...prev,
                          Senior: e.target.checked,
                        }))
                      }
                    />{" "}
                    Senior
                    <span className="joblist-count">{jobLevelCounts.Senior}</span>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={filterJobLevel.Lead}
                      onChange={(e) =>
                        setFilterJobLevel((prev) => ({
                          ...prev,
                          Lead: e.target.checked,
                        }))
                      }
                    />{" "}
                    Lead
                    <span className="joblist-count">{jobLevelCounts.Lead}</span>
                  </label>
                </div>
              )}
            </div>

            <div className="joblist-divider"></div>

            <div className="joblist-card joblist-filter-group">
              <div className="joblist-filter-header">
                <span>Experience</span>
                <button
                  className="joblist-toggle-icon"
                  onClick={() => toggleSection("experience")}
                  aria-label={
                    expandedSections.experience ? "Collapse" : "Expand"
                  }
                >
                  <img
                    src={
                      expandedSections.experience
                        ? images.minusIcon
                        : images.plusIcon
                    }
                    alt={expandedSections.experience ? "Collapse" : "Expand"}
                  />
                </button>
              </div>
              {expandedSections.experience && (
                <div className="joblist-input-row">
                  <img src={images.experienceIcon} alt="Experience" />
                  <input
                    type="text"
                    placeholder="E.g. 2+ years"
                    value={filterExperience}
                    onChange={(e) => setFilterExperience(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="joblist-divider"></div>

            <div className="joblist-card joblist-filter-group">
              <div className="joblist-filter-header">
                <span>Education</span>
                <button
                  className="joblist-toggle-icon"
                  onClick={() => toggleSection("education")}
                  aria-label={
                    expandedSections.education ? "Collapse" : "Expand"
                  }
                >
                  <img
                    src={
                      expandedSections.education
                        ? images.minusIcon
                        : images.plusIcon
                    }
                    alt={expandedSections.education ? "Collapse" : "Expand"}
                  />
                </button>
              </div>
              {expandedSections.education && (
                <div className="joblist-input-row">
                  <img src={images.educationIcon} alt="Education" />
                  <input
                    type="text"
                    placeholder="Bachelor's Degree"
                    value={filterEducation}
                    onChange={(e) => setFilterEducation(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="joblist-divider"></div>

            <div className="joblist-card joblist-filter-group">
              <div className="joblist-filter-header">
                <span>Required Skills</span>
                <button
                  className="joblist-toggle-icon"
                  onClick={() => toggleSection("skills")}
                  aria-label={expandedSections.skills ? "Collapse" : "Expand"}
                >
                  <img
                    src={
                      expandedSections.skills
                        ? images.minusIcon
                        : images.plusIcon
                    }
                    alt={expandedSections.skills ? "Collapse" : "Expand"}
                  />
                </button>
              </div>
              {expandedSections.skills && (
                <div className="joblist-input-row">
                  <img src={images.skillIcon} alt="Skills" />
                  <input
                    type="text"
                    placeholder="React, Figma, UX Research"
                    value={filterSkills}
                    onChange={(e) => setFilterSkills(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="joblist-divider"></div>

            <div className="joblist-card joblist-filter-group">
              <div className="joblist-filter-header">
                <span>Salary Range</span>
                <button
                  className="joblist-toggle-icon"
                  onClick={() => toggleSection("salaryRange")}
                  aria-label={
                    expandedSections.salaryRange ? "Collapse" : "Expand"
                  }
                >
                  <img
                    src={
                      expandedSections.salaryRange
                        ? images.minusIcon
                        : images.plusIcon
                    }
                    alt={expandedSections.salaryRange ? "Collapse" : "Expand"}
                  />
                </button>
              </div>
              {expandedSections.salaryRange && (
                <div className="joblist-salary-range">
                  <div className="joblist-input-row joblist-currency-dropdown" ref={currencyDropdownRef}>
                    <img src={images.salaryIcon} alt="Currency" />
                    <button
                      type="button"
                      className={`joblist-currency-trigger ${isCurrencyOpen ? "open" : ""}`}
                      onClick={() => setIsCurrencyOpen((prev) => !prev)}
                      aria-haspopup="listbox"
                      aria-expanded={isCurrencyOpen}
                    >
                      <span>{selectedCurrencyLabel}</span>
                      <img
                        src={dropdownArrow}
                        alt=""
                        aria-hidden="true"
                        className={`joblist-currency-caret ${isCurrencyOpen ? "open" : ""}`}
                      />
                    </button>
                    {isCurrencyOpen && (
                      <div className="joblist-currency-menu" role="listbox">
                        <button
                          type="button"
                          className={`joblist-currency-option ${filterCurrency === "" ? "active" : ""}`}
                          onClick={() => {
                            setFilterCurrency("");
                            setIsCurrencyOpen(false);
                          }}
                        >
                          Select currency
                        </button>
                        <button
                          type="button"
                          className={`joblist-currency-option ${filterCurrency === "NPR" ? "active" : ""}`}
                          onClick={() => {
                            setFilterCurrency("NPR");
                            setIsCurrencyOpen(false);
                          }}
                        >
                          NPR (Rs.)
                        </button>
                        <button
                          type="button"
                          className={`joblist-currency-option ${filterCurrency === "INR" ? "active" : ""}`}
                          onClick={() => {
                            setFilterCurrency("INR");
                            setIsCurrencyOpen(false);
                          }}
                        >
                          INR (Rs.)
                        </button>
                        <button
                          type="button"
                          className={`joblist-currency-option ${filterCurrency === "USD" ? "active" : ""}`}
                          onClick={() => {
                            setFilterCurrency("USD");
                            setIsCurrencyOpen(false);
                          }}
                        >
                          USD ($)
                        </button>
                        <button
                          type="button"
                          className={`joblist-currency-option ${filterCurrency === "GBP" ? "active" : ""}`}
                          onClick={() => {
                            setFilterCurrency("GBP");
                            setIsCurrencyOpen(false);
                          }}
                        >
                          GBP (GBP)
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="joblist-salary-inputs">
                    <input
                      type="text"
                      placeholder="From"
                      value={filterSalaryFrom}
                      onChange={(e) => setFilterSalaryFrom(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="To"
                      value={filterSalaryTo}
                      onChange={(e) => setFilterSalaryTo(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="joblist-filter-actions">
              <button
                className="joblist-apply-filter"
                onClick={() => applyFilters()}
              >
                Apply Filter
              </button>
              <button className="joblist-clear-filter" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>

            <div className="joblist-card joblist-promo-card">
              <h4>Recruiting?</h4>
              <p>Advertise your jobs to millions of monthly users.</p>
              <button className="joblist-btn-outline">Post a Job</button>
              <img src={images.promoIllustration} alt="" />
            </div>
          </aside>

          <main className="joblist-main">
            <div className="joblist-main-header">
              <span>
                {loading
                  ? "Loading jobs..."
                  : `Showing ${startIndex}-${endIndex} of ${totalJobs} jobs`}
              </span>
              <div className="joblist-sort" ref={sortDropdownRef}>
                <span>Sort by:</span>
                <button
                  type="button"
                  className={`joblist-sort-select joblist-sort-trigger ${
                    isSortOpen ? "open" : ""
                  }`}
                  onClick={() => setIsSortOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={isSortOpen}
                >
                  <span>
                    {sortBy === "oldest"
                      ? "Oldest Post"
                      : sortBy === "salary"
                        ? "Salary"
                        : "Newest Post"}
                  </span>
                  <img
                    src={dropdownArrow}
                    alt=""
                    aria-hidden="true"
                    className={`joblist-sort-caret ${isSortOpen ? "open" : ""}`}
                  />
                </button>
                {isSortOpen && (
                  <div className="joblist-sort-menu" role="listbox">
                    <button
                      type="button"
                      className={`joblist-sort-option ${sortBy === "newest" ? "active" : ""}`}
                      onClick={() => {
                        setSortBy("newest");
                        setPage(1);
                        setIsSortOpen(false);
                      }}
                    >
                      Newest Post
                    </button>
                    <button
                      type="button"
                      className={`joblist-sort-option ${sortBy === "oldest" ? "active" : ""}`}
                      onClick={() => {
                        setSortBy("oldest");
                        setPage(1);
                        setIsSortOpen(false);
                      }}
                    >
                      Oldest Post
                    </button>
                    <button
                      type="button"
                      className={`joblist-sort-option ${sortBy === "salary" ? "active" : ""}`}
                      onClick={() => {
                        setSortBy("salary");
                        setPage(1);
                        setIsSortOpen(false);
                      }}
                    >
                      Salary
                    </button>
                  </div>
                )}
              </div>
            </div>

            {error && <div className="public-empty-state">{error}</div>}
            {!error && !loading && jobCards.length === 0 && (
              <div className="public-empty-state">No data found currently.</div>
            )}
            <div className="joblist-grid">
              {jobCards.map((job) => (
                <article key={job.id} className="joblist-card-item">
                  <div className="joblist-card-top">
                    <img
                      src={resolveLogo(job.companyLogo)}
                      alt={job.companyName}
                      className="joblist-company-logo"
                    />
                    <div className="joblist-card-actions">
                      {userRole === "candidate" && (
                        <button
                          className="joblist-icon-btn"
                          onClick={() => toggleSaveJob(job.id)}
                        >
                        <img
                          src={
                            savedJobs[job.id]
                              ? images.savedBookmarkIcon
                              : images.bookmarkIcon
                          }
                          alt="Save"
                        />
                        </button>
                      )}
                      {userRole !== "admin" && (
                        <button
                          className="joblist-icon-btn"
                          onClick={() => openShareModal(job)}
                        >
                          <img src={images.shareIcon} alt="Share" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="joblist-card-company">{job.companyName}</div>
                  <div className="joblist-card-meta">
                    <img src={images.workModeIcon} alt="Work mode" />
                    {formatWorkMode(job.workMode)}
                  </div>
                  <h3 className="joblist-card-title">{job.jobTitle}</h3>
                  <div className="joblist-card-info">
                    <span>
                      <img src={images.locationIcon} alt="Location" />
                      {job.location}
                    </span>
                    <span>
                      <img src={images.jobTypeIcon} alt="Job type" />
                      {job.jobType}
                    </span>
                  </div>
                  <div className="joblist-card-buttons">
                    <button
                      className="joblist-btn-outline"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      View Details
                    </button>
                    {(userRole === "candidate" || !userRole) && (
                      <button
                        className={`joblist-btn-primary ${
                          userRole === "candidate" && appliedJobs[job.id]
                            ? "joblist-btn-applied"
                            : ""
                        }`}
                        onClick={() => {
                          if (!userRole) {
                            navigate("/login");
                            return;
                          }
                          if (
                            userRole === "candidate" &&
                            job.assessmentRequired &&
                            !appliedJobs[job.id]
                          ) {
                            navigate(`/jobs/${job.id}`);
                            return;
                          }
                          openApplyModal(job.id);
                        }}
                        disabled={userRole === "candidate" && appliedJobs[job.id]}
                      >
                        {userRole === "candidate" && appliedJobs[job.id]
                          ? "Applied"
                          : "Apply Now"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="joblist-pagination">
              <div className="joblist-page-controls">
                <button
                  className="joblist-page-nav"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                >
                  <img src={images.prevIcon} alt="Previous" />
                </button>
                <div className="joblist-page-numbers">
                  {visiblePages.map((pageNumber) => (
                    <span
                      key={pageNumber}
                      className={`joblist-page-num ${
                        pageNumber === page ? "joblist-active" : ""
                      }`}
                      onClick={() => setPage(pageNumber)}
                      role="button"
                    >
                      {pageNumber}
                    </span>
                  ))}
                  {totalPages > 7 && (
                    <span className="joblist-page-num joblist-dots">...</span>
                  )}
                </div>
                <button
                  className="joblist-page-nav"
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={page === totalPages}
                >
                  <img src={images.nextIcon} alt="Next" />
                </button>
              </div>
              <div className="joblist-page-info">
                Showing {startIndex} to {endIndex} of {totalJobs}
              </div>
            </div>
          </main>
        </div>
      </section>

      <ApplyJobModal
        isOpen={applyModalOpen}
        loading={applyLoading}
        job={applyJobDetails}
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

      {isShareModalOpen && shareJob && (
        <div className="joblist-share-overlay" onClick={closeShareModal}>
          <div className="joblist-share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="joblist-share-header">
              <h3>Share Job</h3>
              <button type="button" onClick={closeShareModal}>
                <img src={closeIcon} alt="Close" />
              </button>
            </div>
            <p className="joblist-share-job-title">
              {shareJob.jobTitle} - {shareJob.companyName}
            </p>
            <div className="joblist-share-link-row">
              <input type="text" value={shareLink} readOnly />
              <button type="button" onClick={handleCopyShareLink}>
                Copy Link
              </button>
            </div>

            {(userRole === "candidate" || userRole === "recruiter") && (
              <div className="joblist-share-user-wrap">
                <label htmlFor="job-share-user">Share to connected user</label>
                <div className="joblist-share-user-combobox" ref={shareUserDropdownRef}>
                  <div className="joblist-share-user-input-wrap">
                    <input
                      id="job-share-user"
                      type="text"
                      value={shareUserQuery}
                      placeholder={
                        isShareLoading
                          ? "Loading users..."
                          : shareUsers.length === 0
                            ? "No connected users"
                            : "Search and select user"
                      }
                      onFocus={() => setIsShareUserDropdownOpen(true)}
                      onChange={(e) => {
                        setShareUserQuery(e.target.value);
                        setSelectedShareUserId("");
                        setIsShareUserDropdownOpen(true);
                      }}
                      disabled={isShareLoading || shareUsers.length === 0}
                    />
                    <button
                      type="button"
                      className="joblist-share-user-toggle"
                      onClick={() => setIsShareUserDropdownOpen((prev) => !prev)}
                      disabled={isShareLoading || shareUsers.length === 0}
                    >
                      <span>{isShareUserDropdownOpen ? "^" : "v"}</span>
                    </button>
                  </div>
                  {isShareUserDropdownOpen && shareUsers.length > 0 && (
                    <div className="joblist-share-user-list">
                      {filteredShareUsers.length > 0 ? (
                        filteredShareUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            className={`joblist-share-user-option ${
                              selectedShareUserId === user.id ? "active" : ""
                            }`}
                            onClick={() => {
                              setSelectedShareUserId(user.id);
                              setShareUserQuery(`${user.fullName} (${user.role})`);
                              setIsShareUserDropdownOpen(false);
                            }}
                          >
                            <span>{user.fullName}</span>
                            <small>{user.email || user.role}</small>
                          </button>
                        ))
                      ) : (
                        <p className="joblist-share-user-empty">No users found.</p>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="joblist-share-send-btn"
                  onClick={handleShareToUser}
                  disabled={isSendingShare || !selectedShareUserId}
                >
                  {isSendingShare ? "Sharing..." : "Share to User"}
                </button>
              </div>
            )}

            {!userRole && (
              <p className="joblist-share-helper">
                Log in as candidate/recruiter to share this job with connected users.
              </p>
            )}

            {shareMessage && <p className="joblist-share-success">{shareMessage}</p>}
            {shareError && <p className="joblist-share-error">{shareError}</p>}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default JobListingPage;














