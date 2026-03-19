import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ApplyJobModal from "../components/ApplyJobModal";
import "../styles/HomePage.css";

import heroBadgeIcon from "../images/Public Page/I1_1112_1_3587.svg";
import heroSearchIcon from "../images/Public Page/I1_1112_1_3605.svg";
import heroLocationIcon from "../images/Public Page/I1_1112_1_3613.svg";
import heroBannerImage from "../images/Public Page/df6dadf31abcddb06b9e43b983e0fa10840be3a5.png";
import heroSuccessIcon from "../images/Public Page/1_1389.svg";
import heroTickIcon from "../images/Public Page/1_1396.svg";
import deco1121 from "../images/Public Page/1_1121.svg";
import deco1123 from "../images/Public Page/1_1123.svg";
import deco1127 from "../images/Public Page/1_1127.svg";
import deco1133 from "../images/Public Page/1_1133.svg";
import deco1135 from "../images/Public Page/1_1135.svg";




import bookmarkIcon from "../images/Recruiter Job Post Page Images/bookmarkIcon.svg";
import savedBookmarkIcon from "../images/Recruiter Job Post Page Images/bookmarkFilled.svg";
import shareIcon from "../images/Recruiter Job Post Page Images/shareFg.svg";
import workModeIcon from "../images/Job List Page Images/work-mode.svg";
import locationIcon from "../images/Job List Page Images/location.svg";
import jobTypeIcon from "../images/Job List Page Images/job-type.svg";

import featureImage from "../images/Public Page/882f75bf60f070197e88b2ba5cf872266e58743d.png";
import candidateA from "../images/Public Page/I1_1399_1_3526.svg";
import candidateB from "../images/Public Page/I1_1399_1_3531.svg";
import candidateC from "../images/Public Page/I1_1399_1_3536.svg";

import stepMainImage from "../images/Public Page/abc46da86de8d4960be05461c8c6828035ee2295.png";
import stepFloatImage from "../images/Public Page/ac01f05469ba2dfecedcce7f92baba3a733e0dab.png";


import checkIcon from "../images/Public Page/1_1463.svg";
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

type CompanySummary = {
  name: string;
  logo?: string;
  vacancies: number;
  jobsCount?: number;
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

type PricingPlan = {
  name: string;
  description: string;
  features: string[];
};

const HomePage = () => {
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState("");
  const [heroLocation, setHeroLocation] = useState("");
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");
  const [featuredCompanies, setFeaturedCompanies] = useState<CompanySummary[]>(
    [],
  );
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState("");
  const [totalCompanyVacancies, setTotalCompanyVacancies] = useState(0);
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});
  const [savedJobs, setSavedJobs] = useState<Record<string, boolean>>({});
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyJobId, setApplyJobId] = useState<string | null>(null);
  const [applyJobDetails, setApplyJobDetails] = useState<ApplyModalJob | null>(
    null,
  );
  const [applyProfileResume, setApplyProfileResume] = useState<string>("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyError, setApplyError] = useState("");
  const [useCustomResume, setUseCustomResume] = useState(false);
  const [customResumeFile, setCustomResumeFile] = useState<File | null>(null);
  const [applyNote, setApplyNote] = useState("");
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
  const [pricingAudience, setPricingAudience] = useState<
    "candidates" | "recruiters"
  >("candidates");
  const shareUserDropdownRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
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
    const loadFeaturedCompanies = async () => {
      try {
        setCompaniesLoading(true);
        setCompaniesError("");
        const response = await fetch(
          "http://localhost:5000/api/jobs/companies-summary?limit=7",
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Failed to load companies");
        }

        setFeaturedCompanies(
          (data?.companies || []).map((item: CompanySummary) => ({
            name: item.name || "Company",
            logo: item.logo || "",
            vacancies: Number(item.jobsCount ?? item.vacancies) || 0,
            jobsCount: Number(item.jobsCount) || 0,
          })),
        );
        setTotalCompanyVacancies(Number(data?.totalVacancies) || 0);
      } catch {
        setFeaturedCompanies([]);
        setTotalCompanyVacancies(0);
        setCompaniesError("No data found currently.");
      } finally {
        setCompaniesLoading(false);
      }
    };

    loadFeaturedCompanies();
  }, []);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setJobsLoading(true);
        setJobsError("");
        const response = await fetch(
          "http://localhost:5000/api/jobs?sort=newest&page=1&limit=6",
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Failed to load jobs");
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

        setJobs(mappedJobs);
      } catch {
        setJobsError("No data found currently.");
      } finally {
        setJobsLoading(false);
      }
    };

    loadJobs();
  }, []);

  useEffect(() => {
    const fetchAppliedStatuses = async () => {
      if (userRole !== "candidate" || jobs.length === 0) {
        setAppliedJobs({});
        return;
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        setAppliedJobs({});
        return;
      }

      try {
        const checks = await Promise.all(
          jobs.map(async (job) => {
            const response = await fetch(
              `http://localhost:5000/api/applications/status/${job.id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            const data = await response.json();
            return [job.id, Boolean(data?.applied)] as const;
          }),
        );

        const map: Record<string, boolean> = {};
        checks.forEach(([jobId, applied]) => {
          map[jobId] = applied;
        });
        setAppliedJobs(map);
      } catch {
        setAppliedJobs({});
      }
    };

    fetchAppliedStatuses();
  }, [jobs, userRole]);

  useEffect(() => {
    const fetchSavedStatuses = async () => {
      if (userRole !== "candidate" || jobs.length === 0) {
        setSavedJobs({});
        return;
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        setSavedJobs({});
        return;
      }

      try {
        const checks = await Promise.all(
          jobs.map(async (job) => {
            const response = await fetch(
              `http://localhost:5000/api/saved-jobs/status/${job.id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            const data = await response.json();
            return [job.id, Boolean(data?.saved)] as const;
          }),
        );

        const map: Record<string, boolean> = {};
        checks.forEach(([jobId, saved]) => {
          map[jobId] = saved;
        });
        setSavedJobs(map);
      } catch {
        setSavedJobs({});
      }
    };

    fetchSavedStatuses();
  }, [jobs, userRole]);

  const toggleSaveJob = async (jobId: string) => {
    const token = localStorage.getItem("authToken");
    if (!token || userRole !== "candidate") {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/saved-jobs/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to update saved job");
      }
      setSavedJobs((prev) => ({ ...prev, [jobId]: Boolean(data?.saved) }));
    } catch {
      // ignore save status failure on home cards
    }
  };

  const resolveLogo = (logo?: string) => {
    if (!logo) return "";
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

  const displayedCompanies = featuredCompanies;
  const displayedTotalVacancies = totalCompanyVacancies > 0 ? totalCompanyVacancies : 0;

  const candidatePlans: PricingPlan[] = [
    {
      name: "Basic",
      description: "Start your job search with essential tools.",
      features: [
        "Create and manage your profile",
        "Apply to jobs and track status",
        "Get smart job recommendations",
        "Use ATS resume scanner",
        "Connect and message recruiters",
      ],
    },
    {
      name: "Pro",
      description: "Advanced support for faster job discovery.",
      features: [
        "Everything in Basic",
        "Priority profile visibility",
        "Advanced job filters and matching",
        "Assessment and submission history",
        "Enhanced candidate dashboard insights",
      ],
    },
    {
      name: "Elite",
      description: "Complete feature access for serious job seekers.",
      features: [
        "Everything in Pro",
        "Portfolio and project showcase boost",
        "Priority support queue",
        "Early access to new platform features",
        "Improved networking visibility",
      ],
    },
  ];

  const recruiterPlans: PricingPlan[] = [
    {
      name: "Basic",
      description: "Post jobs and manage hiring in one place.",
      features: [
        "Create and publish job postings",
        "Review applicants and change status",
        "Built-in candidate messaging",
        "Company profile and branding setup",
        "Access recruiter dashboard insights",
      ],
    },
    {
      name: "Pro",
      description: "Smarter screening and assessment workflow.",
      features: [
        "Everything in Basic",
        "ATS ranking for applicants",
        "Assessment integration per job",
        "Applicant detail overlays and quick actions",
        "Improved filtering and tracking tools",
      ],
    },
    {
      name: "Enterprise",
      description: "Full recruiting workflow for growing teams.",
      features: [
        "Everything in Pro",
        "Advanced analytics and hiring trends",
        "Role-based process visibility",
        "Higher operational control and reporting",
        "Priority platform support",
      ],
    },
  ];

  const activePlans =
    pricingAudience === "candidates" ? candidatePlans : recruiterPlans;

  const handleFindNow = () => {
    const params = new URLSearchParams();
    const search = heroSearch.trim();
    const location = heroLocation.trim();
    if (search) params.set("search", search);
    if (location) params.set("location", location);
    const query = params.toString();
    navigate(query ? `/jobs?${query}` : "/jobs");
  };

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

    const token = localStorage.getItem("authToken");
    if (!token || !userRole || (userRole !== "candidate" && userRole !== "recruiter")) {
      setShareUsers([]);
      return;
    }

    try {
      setIsShareLoading(true);
      const res = await fetch("http://localhost:5000/api/connections/friends", {
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
      const res = await fetch("http://localhost:5000/api/messages/send", {
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to apply";
      setApplyError(message);
    } finally {
      setApplyLoading(false);
    }
  };

  return (
    <div className="home-page">
      <Navbar />

      <section id="hero">
        <div className="container hero-container">
          <div className="hero-content">
            <div className="badge">
              <img src={heroBadgeIcon} alt="icon" />
              <span>BEST JOBS PLACE</span>
            </div>
            <h1>The Easiest Way to Get Your New Job</h1>
            <p>
              Each month, more than 3 million job seekers turn to website in
              their search for work, making over 140,000 applications every
              single day
            </p>

            <div className="search-bar">
              <div className="search-input-group">
                <img src={heroSearchIcon} alt="search" />
                <input
                  type="text"
                  placeholder="Job title, Company...."
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                />
              </div>
              <div className="divider"></div>
              <div className="search-input-group">
                <img src={heroLocationIcon} alt="location" />
                <input
                  type="text"
                  placeholder="Location"
                  value={heroLocation}
                  onChange={(e) => setHeroLocation(e.target.value)}
                />              </div>
              <button className="find-btn" onClick={handleFindNow}>
                Find now
              </button>
            </div>

            <p className="popular-searches">
              Popular Searches: Designer, Developer, Web, Engineer, Senior
            </p>
          </div>

          <div className="hero-image-wrapper">
            <div className="main-banner">
              <img src={heroBannerImage} alt="Hero Banner" />
            </div>

            <div className="overlay-card success-card">
              <img src={heroSuccessIcon} alt="Email" className="email-icon" />
              <div className="success-content">
                <div className="success-header">
                  <span>Congratulation!</span>
                  <div className="tick-circle">
                    <img src={heroTickIcon} alt="tick" />
                  </div>
                </div>
                <span className="success-msg">Your Application is Selected</span>
              </div>
            </div>

            <div className="deco-circle-1">
              <div style={{ position: "relative", width: "94px", height: "97px" }}>
                <img src={deco1121} style={{ position: "absolute", left: 11, top: 0 }} />
                <img src={deco1123} style={{ position: "absolute", left: 26, top: 14 }} />
              </div>
            </div>
            <div className="deco-docs">
              <div style={{ position: "relative", width: "84px", height: "79px" }}>
                <img src={deco1127} style={{ position: "absolute", left: 5, top: 8 }} />
                <img src={deco1133} style={{ position: "absolute", left: 14, top: 0 }} />
                <img src={deco1135} style={{ position: "absolute", left: 52, top: 0 }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="categories">
        <div className="container">
          <div className="categories-header">
            <h2 className="section-title">Top Hiring Companies</h2>
            <p className="section-subtitle">
              Explore companies actively hiring on HireLink and discover how
              many openings are currently available at each organization.
            </p>
          </div>

          {companiesError && !companiesLoading && (
            <div className="home-empty-state">{companiesError}</div>
          )}
          {companiesLoading && (
            <div className="home-jobs-loading">Loading companies...</div>
          )}

          {!companiesLoading && !companiesError && displayedCompanies.length > 0 && (
            <div className="categories-grid">
              {displayedCompanies.map((company, index) => (
                <div className="category-card" key={`${company.name}-${index}`}>
                  <div className="cat-icon">
                    {company.logo ? (
                      <img src={resolveLogo(company.logo)} alt={company.name} />
                    ) : (
                      <span className="cat-icon-fallback">
                        {(company.name || "C").trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h3>{company.name}</h3>
                  <span className="vacancy">
                    {company.vacancies} Vacancy
                  </span>
                </div>
              ))}

              <div className="category-card cta-card">
                <div className="cta-content">
                  <h3>{displayedTotalVacancies.toLocaleString()} +</h3>
                  <p>jobs are waiting for you</p>
                  <button
                    className="explore-btn"
                    onClick={() => navigate("/employers")}
                  >
                    Explore more
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
      </section>

      <section id="jobs">
        <div className="container">
          <div className="jobs-header">
            <div className="jobs-title">
              <h2 className="section-title">Recent Jobs</h2>
              <div className="jobs-count">
                <span>Discover the most recently posted opportunities across active hiring companies.</span>
              </div>
            </div>
          </div>

          {jobsError && <div className="home-jobs-error">{jobsError}</div>}
          {jobsLoading && <div className="home-jobs-loading">Loading jobs...</div>}

          {!jobsLoading && !jobsError && jobs.length === 0 && (
            <div className="home-empty-state">No data found currently.</div>
          )}

          {!jobsLoading && !jobsError && jobs.length > 0 && (
            <div className="home-jobs-grid">
              {jobs.map((job) => (
                <article key={job.id} className="joblist-card-item">
                  <div className="joblist-card-top">
                    {job.companyLogo ? (
                      <img
                        src={resolveLogo(job.companyLogo)}
                        alt={job.companyName}
                        className="joblist-company-logo"
                      />
                    ) : (
                      <div className="joblist-company-logo joblist-company-logo-fallback">
                        {(job.companyName || "C").trim().charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="joblist-card-actions">
                      {userRole === "candidate" && (
                        <button
                          className="joblist-icon-btn"
                          onClick={() => toggleSaveJob(job.id)}
                        >
                          <img
                            src={savedJobs[job.id] ? savedBookmarkIcon : bookmarkIcon}
                            alt="Save"
                          />
                        </button>
                      )}
                      {userRole !== "admin" && (
                        <button
                          className="joblist-icon-btn"
                          onClick={() => openShareModal(job)}
                        >
                          <img src={shareIcon} alt="Share" />
                        </button>
                      )}
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
                      onClick={() => {
                        if (!userRole) {
                          navigate("/login");
                          return;
                        }
                        navigate(`/jobs/${job.id}`);
                      }}
                    >
                      View Details
                    </button>
                    {(userRole === "candidate" || !userRole) && (
                      <button
                        className={`joblist-btn-primary${
                          appliedJobs[job.id] ? " joblist-btn-applied" : ""
                        }`}
                        disabled={userRole === "candidate" && Boolean(appliedJobs[job.id])}
                        onClick={() => {
                          if (!userRole) {
                            navigate("/login");
                            return;
                          }
                          if (job.assessmentRequired) {
                            navigate(`/jobs/${job.id}`);
                            return;
                          }
                          openApplyModal(job.id);
                        }}
                      >
                        {appliedJobs[job.id] ? "Applied" : "Apply Now"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>


      {isShareModalOpen && shareJob && (
        <div className="home-share-overlay" onClick={closeShareModal}>
          <div className="home-share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="home-share-header">
              <h3>Share Job</h3>
              <button type="button" onClick={closeShareModal}>
                <img src={closeIcon} alt="Close" />
              </button>
            </div>
            <p className="home-share-job-title">
              {shareJob.jobTitle} - {shareJob.companyName}
            </p>
            <div className="home-share-link-row">
              <input type="text" value={shareLink} readOnly />
              <button type="button" onClick={handleCopyShareLink}>
                Copy Link
              </button>
            </div>

            {(userRole === "candidate" || userRole === "recruiter") && (
              <div className="home-share-user-wrap">
                <label htmlFor="home-job-share-user">Share to connected user</label>
                <div className="home-share-user-combobox" ref={shareUserDropdownRef}>
                  <div className="home-share-user-input-wrap">
                    <input
                      id="home-job-share-user"
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
                      className="home-share-user-toggle"
                      onClick={() => setIsShareUserDropdownOpen((prev) => !prev)}
                      disabled={isShareLoading || shareUsers.length === 0}
                    >
                      <span>{isShareUserDropdownOpen ? "^" : "v"}</span>
                    </button>
                  </div>
                  {isShareUserDropdownOpen && shareUsers.length > 0 && (
                    <div className="home-share-user-list">
                      {filteredShareUsers.length > 0 ? (
                        filteredShareUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            className={`home-share-user-option ${
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
                        <p className="home-share-user-empty">No users found.</p>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="home-share-send-btn"
                  onClick={handleShareToUser}
                  disabled={isSendingShare || !selectedShareUserId}
                >
                  {isSendingShare ? "Sharing..." : "Share to User"}
                </button>
              </div>
            )}

            {!userRole && (
              <p className="home-share-helper">
                Log in as candidate/recruiter to share this job with connected users.
              </p>
            )}

            {shareMessage && <p className="home-share-success">{shareMessage}</p>}
            {shareError && <p className="home-share-error">{shareError}</p>}
          </div>
        </div>
      )}
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
        applyError={applyError}
        applyMessage={applyMessage}
        onClose={closeApplyModal}
        onConfirm={handleConfirmApply}
        onUseCustomResumeChange={setUseCustomResume}
        onCustomResumeChange={setCustomResumeFile}
        onApplyNoteChange={setApplyNote}
        onConfirmRequirementsChange={setConfirmRequirements}
        onConfirmResumeChange={setConfirmResume}
      />

      <section id="feature">
        <div className="container feature-container">
          <div className="feature-text">
            <h2 className="section-title">
              Find the Right Talent
              <br />
              and the Right Opportunity
            </h2>
            <p className="section-subtitle">
              HireLink helps recruiters discover qualified candidates and helps
              job seekers find relevant roles through skills-based matching,
              assessments, and a streamlined hiring workflow.
            </p>

            <div className="feature-actions">
              <button className="post-job-btn">Post a job Now</button>
              <a href="#" className="learn-more">
                Learn more
              </a>
            </div>
          </div>

          <div className="feature-image">
            <div className="image-bg">
              <img src={featureImage} alt="Feature Image" />
            </div>
            <div className="candidates-card">
              <div className="card-header">Top Candidates</div>
              <div className="candidate-list">
                <div className="candidate-item">
                  <img src={candidateA} alt="User" />
                  <div>
                    <h4>Sushant Pradhan</h4>
                    <span>UI/UX Designer</span>
                  </div>
                </div>
                <div className="candidate-item">
                  <img src={candidateB} alt="User" />
                  <div>
                    <h4>John Lennon</h4>
                    <span>Senior Art Director</span>
                  </div>
                </div>
                <div className="candidate-item">
                  <img src={candidateC} alt="User" />
                  <div>
                    <h4>Nadine Coyle</h4>
                    <span>Photographer</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="steps">
        <div className="container steps-container">
          <div className="steps-content">
            <h2 className="section-title">
              Follow ours steps
              <br />
              We will help you
            </h2>

            <div className="steps-list">
              <div className="step-line"></div>

              <div className="step-item">
                <div className="step-number" style={{ background: "#73b5e8" }}>
                  01
                </div>
                <div className="step-text">
                  <h3>Register Your Account</h3>
                  <p>
                    You need to create an account to find the best and preferred
                    job.
                  </p>
                </div>
              </div>

              <div className="step-item">
                <div className="step-number" style={{ background: "#edc882" }}>
                  02
                </div>
                <div className="step-text">
                  <h3>Search Your Job</h3>
                  <p>After creating an account, search for you favorite job</p>
                </div>
              </div>

              <div className="step-item">
                <div className="step-number" style={{ background: "#d1a8d7" }}>
                  03
                </div>
                <div className="step-text">
                  <h3>Apply For Dream Job</h3>
                  <p>
                    After creating the account, you have to apply for the desired
                    job.
                  </p>
                </div>
              </div>

              <div className="step-item">
                <div className="step-number" style={{ background: "#7ce2c7" }}>
                  04
                </div>
                <div className="step-text">
                  <h3>Upload Your Resume</h3>
                  <p>
                    Upload your resume after filling all relevant information.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="steps-image">
            <div className="image-wrapper">
              <img src={stepMainImage} alt="Steps Illustration" />
              <img src={stepFloatImage} className="floating-img img-1" alt="" />
              <img src={stepFloatImage} className="floating-img img-2" alt="" />
            </div>
          </div>
        </div>
      </section>

      <section id="pricing">
        <div className="container">
          <div className="pricing-header">
            <h2 className="section-title">Simple, Transparent Pricing</h2>
            <p className="section-subtitle">
              HireLink is currently free for all users. Choose a plan based on
              your workflow needs. All features are available at no cost during
              this phase.
            </p>

            <div className="pricing-toggle">
              <span
                className={`toggle-opt${
                  pricingAudience === "candidates" ? " active" : ""
                }`}
                onClick={() => setPricingAudience("candidates")}
              >
                Candidates
              </span>
              <span
                className={`toggle-opt${
                  pricingAudience === "recruiters" ? " active" : ""
                }`}
                onClick={() => setPricingAudience("recruiters")}
              >
                Recruiters
              </span>
            </div>
          </div>

          <div className="pricing-cards">
            {activePlans.map((plan, index) => (
              <div
                key={plan.name}
                className={`price-card${index === 1 ? " featured" : ""}`}
              >
                <div className="price-amount">
                  <span className="amount">$0</span>
                  <span className="period">/month</span>
                </div>
                <div className="yearly-price">
                  <span className="amount-sm">Free</span>
                  <span className="period-sm">for now</span>
                </div>
                <h3>{plan.name}</h3>
                <p className="plan-desc">{plan.description}</p>
                <ul className="features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <img src={checkIcon} alt="" /> {feature}
                    </li>
                  ))}
                </ul>
                <button className="plan-btn">Choose Plan</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;










