import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/CandidateDetailsPage.css";
import heroBgLeft from "../images/Employers Page Images/8_189.svg";
import heroBgRight from "../images/Employers Page Images/8_197.svg";
import heroCircle from "../images/Employers Page Images/8_205.svg";
import heroIcon1 from "../images/Employers Page Images/8_208.svg";
import heroIcon2 from "../images/Employers Page Images/8_209.svg";
import defaultAvatar from "../images/Register Page Images/Default Profile.webp";
import projectImage from "../images/Candidate Profile Page Images/project-image.png";
import arrowIcon from "../images/Candidate Profile Page Images/267_1325.svg";
import starIcon from "../images/Candidate Profile Page Images/star-icon.svg";
import emptyStarIcon from "../images/Candidate Profile Page Images/empty-star-icon.png";
import connectIcon from "../images/Employers Page Images/connect-icon.png";
import pendingIcon from "../images/Employers Page Images/pending-icon.png";
import friendIcon from "../images/Employers Page Images/friend-icon.png";
import messageIcon from "../images/Employers Page Images/message-icon.png";
import { resolveAssetUrl } from "../utils/assetUrl";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

type Skill = {
  skillName: string;
  proficiencyLevel?: string;
  yearsOfExperience?: number;
  category?: string;
};

type Experience = {
  jobTitle?: string;
  organization?: string;
  location?: string;
  startDate?: string;
  endDate?: string | null;
  isCurrent?: boolean;
  description?: string;
};

type Education = {
  degreeTitle?: string;
  institution?: string;
  location?: string;
  startDate?: string;
  endDate?: string | null;
  isCurrent?: boolean;
  description?: string;
};

type Certification = {
  certificationName?: string;
  issuingOrganization?: string;
  credentialId?: string;
  issueDate?: string;
  expirationDate?: string | null;
  doesNotExpire?: boolean;
  credentialUrl?: string;
};

type Language = {
  languageName?: string;
  rating?: number;
};

type Project = {
  _id?: string;
  id?: string;
  projectTitle?: string;
  description?: string;
  technologies?: string;
  coverImage?: string;
  projectUrl?: string;
  projectDescription?: string;
  startDate?: string;
  endDate?: string | null;
  isOngoing?: boolean;
};

type CandidateProfile = {
  id: string;
  fullName: string;
  profileVisibility?: "public" | "private";
  email?: string;
  currentJobTitle?: string;
  address?: string;
  profilePicture?: string;
  about?: string;
  resume?: string;
  resumeFileName?: string;
  resumeFileSize?: number;
  skills?: Skill[];
  experience?: Experience[];
  education?: Education[];
  certifications?: Certification[];
  languages?: Language[];
  projects?: Project[];
};

type ShowcaseAssessment = {
  attemptId: string;
  assessmentId: string;
  assessmentSource: "admin" | "recruiter";
  title: string;
  type: "quiz" | "writing" | "task" | "code";
  difficulty?: string;
  submittedAt?: string;
  score: number;
  quizTotal: number;
};

type ProjectReview = {
  id: string;
  rating: number;
  text: string;
  title?: string;
  reviewerName: string;
  reviewerRole?: string;
  reviewerUserType?: string;
  reviewerAvatar?: string;
  date?: string;
};

type ConnectionState = "none" | "pending" | "friend";
type MutualConnection = {
  id: string;
  fullName: string;
  profilePicture?: string;
  role?: string;
};

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
};

const resolveAvatar = (profilePicture?: string) => {
  if (!profilePicture) return defaultAvatar;
  if (profilePicture.startsWith("http")) return profilePicture;
  return `${import.meta.env.VITE_BACKEND_URL}${profilePicture}`;
};

const getProjectImageUrl = (coverImage?: string) => {
  if (!coverImage) return projectImage;
  const value = coverImage.trim();
  if (!value) return projectImage;

  if (value.startsWith("http")) return value;
  return `${import.meta.env.VITE_BACKEND_URL}${value}`;
};

const formatProjectDateRange = (
  startDate?: string,
  endDate?: string | null,
  isOngoing?: boolean,
) => {
  const start = formatDate(startDate);
  if (!start) return "";
  if (isOngoing) return `${start} - Present`;
  const end = formatDate(endDate || undefined);
  return end ? `${start} - ${end}` : start;
};

const formatFileSize = (bytes = 0) => {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

const renderLanguageStars = (rating = 0) => {
  const stars = [];
  const totalStars = 5;
  for (let i = 1; i <= totalStars; i++) {
    stars.push(
      <img
        key={i}
        src={i <= rating ? starIcon : emptyStarIcon}
        alt={i <= rating ? "Filled Star" : "Empty Star"}
        className="candidate-star-icon"
      />
    );
  }
  return stars;
};

const CandidateDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [privateNotice, setPrivateNotice] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>("none");
  const [sendingConnection, setSendingConnection] = useState(false);
  const [mutualConnections, setMutualConnections] = useState<MutualConnection[]>([]);
  const [projectReviews, setProjectReviews] = useState<
    Record<string, ProjectReview[]>
  >({});
  const [myProjectReviews, setMyProjectReviews] = useState<
    Record<string, ProjectReview | null>
  >({});
  const [projectReviewForms, setProjectReviewForms] = useState<
    Record<string, { rating: number; description: string }>
  >({});
  const [projectReviewErrors, setProjectReviewErrors] = useState<
    Record<string, string>
  >({});
  const [projectReviewSaving, setProjectReviewSaving] = useState<
    Record<string, boolean>
  >({});
  const [projectReviewFormOpen, setProjectReviewFormOpen] = useState<
    Record<string, boolean>
  >({});
  const [expandedProjectReviews, setExpandedProjectReviews] = useState<
    Record<string, boolean>
  >({});
  const [projectReviewSectionOpen, setProjectReviewSectionOpen] = useState<
    Record<string, boolean>
  >({});
  const [showcaseAssessments, setShowcaseAssessments] = useState<
    ShowcaseAssessment[]
  >([]);
  const userDataStr = localStorage.getItem("userData");
  const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
  const currentUserId =
    currentUser?.id || currentUser?._id || currentUser?.userId || "";
  const isAllowedRole =
    currentUser?.role === "candidate" || currentUser?.role === "recruiter";

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError("");
        setIsPrivateProfile(false);
        setPrivateNotice("");
        const token = localStorage.getItem("authToken");

        const res = await fetch(`${API_BASE_URL}/profile/user/${id}`, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 403) {
            const isSelfRequest =
              Boolean(currentUserId) && String(currentUserId) === String(id);

            if (isSelfRequest && token) {
              const meRes = await fetch(`${API_BASE_URL}/profile/me`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              });
              const meData = await meRes.json();
              if (meRes.ok && meData?.user) {
                setIsPrivateProfile(false);
                setPrivateNotice("");
                setProfile(meData.user);
                return;
              }
            }

            setIsPrivateProfile(true);
            setPrivateNotice(
              data?.message ||
                "This profile is private. Candidate details are visible only when the profile is set to public."
            );

            // Keep hero card visible by loading basic candidate data.
            try {
              const basicRes = await fetch(`${API_BASE_URL}/users/candidates`);
              const basicData = await basicRes.json();
              if (basicRes.ok && Array.isArray(basicData?.candidates)) {
                const matched = basicData.candidates.find((item: any) => {
                  const itemId = item?.id || item?._id || "";
                  return String(itemId) === String(id);
                });
                if (matched) {
                  setProfile({
                    id: matched.id || matched._id,
                    fullName: matched.fullName || "Candidate",
                    email: matched.email || "",
                    currentJobTitle: matched.currentJobTitle || "",
                    address: matched.address || "",
                    profilePicture: matched.profilePicture || "",
                    about: "",
                    skills: [],
                    experience: [],
                    education: [],
                    certifications: [],
                    languages: [],
                    projects: [],
                  });
                  return;
                }
              }
            } catch {
              // Ignore fallback load errors and still show private notice.
            }

            setProfile({
              id: String(id),
              fullName: "Candidate",
              email: "",
              currentJobTitle: "",
              address: "",
              profilePicture: "",
              about: "",
              skills: [],
              experience: [],
              education: [],
              certifications: [],
              languages: [],
              projects: [],
            });
            return;
          }
          if (res.status === 404) {
            throw new Error("Candidate profile not found.");
          }
          throw new Error(data?.message || "Failed to load candidate profile");
        }
        setProfile(data.user);
      } catch {
        setError("No data found currently.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, currentUserId]);

  useEffect(() => {
    const fetchConnectionStatus = async () => {
      if (!profile?.id || !currentUserId || profile.id === currentUserId) return;
      if (!isAllowedRole) return;

      const token = localStorage.getItem("authToken");
      if (!token) return;

      try {
        const res = await fetch(
          `${API_BASE_URL}/connections/statuses?targetIds=${profile.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        if (!res.ok) return;
        const next = (data?.statuses?.[profile.id] || "none") as ConnectionState;
        setConnectionStatus(next);
      } catch {
        setConnectionStatus("none");
      }
    };

    fetchConnectionStatus();
  }, [profile?.id, currentUserId, isAllowedRole]);

  useEffect(() => {
    const fetchMutualConnections = async () => {
      if (!profile?.id || !currentUserId || profile.id === currentUserId) {
        setMutualConnections([]);
        return;
      }
      if (!isAllowedRole) {
        setMutualConnections([]);
        return;
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        setMutualConnections([]);
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE_URL}/connections/mutual/${profile.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        if (!res.ok) {
          setMutualConnections([]);
          return;
        }
        setMutualConnections(data?.mutualConnections || []);
      } catch {
        setMutualConnections([]);
      }
    };

    fetchMutualConnections();
  }, [profile?.id, currentUserId, isAllowedRole]);

  const handleSendConnection = async () => {
    if (!profile?.id || !isAllowedRole || profile.id === currentUserId) return;

    const token = localStorage.getItem("authToken");
    if (!token) return;
    if (sendingConnection || connectionStatus !== "none") return;

    try {
      setSendingConnection(true);
      const res = await fetch(`${API_BASE_URL}/connections/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientId: profile.id }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setConnectionStatus(data.status === "accepted" ? "friend" : "pending");
    } finally {
      setSendingConnection(false);
    }
  };

  const connectionLabel =
    connectionStatus === "friend"
      ? "Friend"
      : connectionStatus === "pending"
        ? "Pending"
        : "Connect";
  const connectionIcon =
    connectionStatus === "friend"
      ? friendIcon
      : connectionStatus === "pending"
        ? pendingIcon
        : connectIcon;
  const isSelfProfile = Boolean(profile?.id && profile.id === currentUserId);
  const canReviewProject = !isSelfProfile && isAllowedRole && connectionStatus === "friend";

  const getProjectReviewStateKey = (projectKey: string, reviewId: string) =>
    `${projectKey}:${reviewId}`;

  const toggleProjectReviewExpansion = (projectKey: string, reviewId: string) => {
    const stateKey = getProjectReviewStateKey(projectKey, reviewId);
    setExpandedProjectReviews((prev) => ({
      ...prev,
      [stateKey]: !prev[stateKey],
    }));
  };

  const toggleProjectReviewSection = (projectKey: string) => {
    setProjectReviewSectionOpen((prev) => ({
      ...prev,
      [projectKey]: !(prev[projectKey] ?? false),
    }));
  };

  const getProjectKey = (project: Project) => project._id || project.id || "";

  const handleOpenMessages = () => {
    if (!profile?.id) return;
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }
    if (!isAllowedRole) return;
    const role = currentUser?.role;
    if (role !== "candidate" && role !== "recruiter") return;
    navigate(`/${role}/messages?user=${profile.id}`);
  };

  useEffect(() => {
    const fetchShowcaseAssessments = async () => {
      if (!profile?.id || isPrivateProfile) {
        setShowcaseAssessments([]);
        return;
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        setShowcaseAssessments([]);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/assessments/candidate/${profile.id}/showcase`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();
        if (!response.ok) {
          setShowcaseAssessments([]);
          return;
        }
        setShowcaseAssessments(data?.submissions || []);
      } catch {
        setShowcaseAssessments([]);
      }
    };

    fetchShowcaseAssessments();
  }, [profile?.id, isPrivateProfile]);

  useEffect(() => {
    const fetchProjectReviewData = async () => {
      if (isPrivateProfile || !profile?.id || !profile.projects?.length) {
        setProjectReviews({});
        setMyProjectReviews({});
        setProjectReviewForms({});
        return;
      }

      const token = localStorage.getItem("authToken");
      const reviewsMap: Record<string, ProjectReview[]> = {};
      const mineMap: Record<string, ProjectReview | null> = {};
      const formMap: Record<string, { rating: number; description: string }> = {};

      await Promise.all(
        profile.projects.map(async (project) => {
          const projectKey = getProjectKey(project);
          if (!projectKey) return;

          try {
            const response = await fetch(
              `${API_BASE_URL}/reviews/project/${profile.id}/${projectKey}`,
              token
                ? { headers: { Authorization: `Bearer ${token}` } }
                : undefined,
            );
            const data = await response.json();
            reviewsMap[projectKey] = data?.reviews || [];
          } catch {
            reviewsMap[projectKey] = [];
          }

          if (token && canReviewProject) {
            try {
              const response = await fetch(
                `${API_BASE_URL}/reviews/project/${profile.id}/${projectKey}/my-review`,
                { headers: { Authorization: `Bearer ${token}` } },
              );
              const data = await response.json();
              if (response.ok && data?.review) {
                mineMap[projectKey] = data.review;
                formMap[projectKey] = {
                  rating: data.review.rating || 5,
                  description: data.review.text || "",
                };
              } else {
                mineMap[projectKey] = null;
                formMap[projectKey] = { rating: 5, description: "" };
              }
            } catch {
              mineMap[projectKey] = null;
              formMap[projectKey] = { rating: 5, description: "" };
            }
          } else {
            mineMap[projectKey] = null;
            formMap[projectKey] = { rating: 5, description: "" };
          }
        }),
      );

      setProjectReviews(reviewsMap);
      setMyProjectReviews(mineMap);
      setProjectReviewForms(formMap);
    };

    fetchProjectReviewData();
  }, [profile?.id, profile?.projects, canReviewProject, isPrivateProfile]);

  const setProjectReviewField = (
    projectKey: string,
    field: "rating" | "description",
    value: number | string,
  ) => {
    setProjectReviewForms((prev) => ({
      ...prev,
      [projectKey]: {
        rating: prev[projectKey]?.rating || 5,
        description: prev[projectKey]?.description || "",
        [field]: value,
      },
    }));
    setProjectReviewErrors((prev) => ({ ...prev, [projectKey]: "" }));
  };

  const submitProjectReview = async (project: Project) => {
    const projectKey = getProjectKey(project);
    if (!profile?.id || !projectKey || !canReviewProject) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    const payload = projectReviewForms[projectKey] || { rating: 5, description: "" };
    if (!payload.description.trim() || payload.description.trim().length < 10) {
      setProjectReviewErrors((prev) => ({
        ...prev,
        [projectKey]: "Review should be at least 10 characters.",
      }));
      return;
    }

    try {
      setProjectReviewSaving((prev) => ({ ...prev, [projectKey]: true }));
      const existing = myProjectReviews[projectKey];
      const url = existing
        ? `${API_BASE_URL}/reviews/${existing.id}`
        : `${API_BASE_URL}/reviews/project/${profile.id}/${projectKey}`;
      const method = existing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: payload.rating,
          description: payload.description.trim(),
          title: "",
          reviewerRole: currentUser?.currentJobTitle || currentUser?.role || "",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to save review");
      }

      setMyProjectReviews((prev) => ({ ...prev, [projectKey]: data.review }));
      setProjectReviews((prev) => {
        const others = (prev[projectKey] || []).filter(
          (item) => item.id !== data.review.id,
        );
        return { ...prev, [projectKey]: [data.review, ...others] };
      });
      setProjectReviewFormOpen((prev) => ({ ...prev, [projectKey]: false }));
    } catch (err: any) {
      setProjectReviewErrors((prev) => ({
        ...prev,
        [projectKey]: err?.message || "Failed to save review",
      }));
    } finally {
      setProjectReviewSaving((prev) => ({ ...prev, [projectKey]: false }));
    }
  };

  const deleteProjectReview = async (project: Project) => {
    const projectKey = getProjectKey(project);
    if (!projectKey || !canReviewProject) return;

    const existing = myProjectReviews[projectKey];
    if (!existing) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setProjectReviewSaving((prev) => ({ ...prev, [projectKey]: true }));
      setProjectReviewErrors((prev) => ({ ...prev, [projectKey]: "" }));

      const response = await fetch(
        `${API_BASE_URL}/reviews/${existing.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete review");
      }

      setMyProjectReviews((prev) => ({ ...prev, [projectKey]: null }));
      setProjectReviews((prev) => ({
        ...prev,
        [projectKey]: (prev[projectKey] || []).filter(
          (item) => item.id !== existing.id,
        ),
      }));
      setProjectReviewForms((prev) => ({
        ...prev,
        [projectKey]: { rating: 5, description: "" },
      }));
      setProjectReviewFormOpen((prev) => ({ ...prev, [projectKey]: false }));
    } catch (err: any) {
      setProjectReviewErrors((prev) => ({
        ...prev,
        [projectKey]: err?.message || "Failed to delete review",
      }));
    } finally {
      setProjectReviewSaving((prev) => ({ ...prev, [projectKey]: false }));
    }
  };

  return (
    <div className="candidate-details-page">
      <Navbar />

      <section className="candidate-details-hero">
        <img src={heroBgLeft} alt="" className="candidate-details-bg left" />
        <img src={heroBgRight} alt="" className="candidate-details-bg right" />
        <img src={heroCircle} alt="" className="candidate-details-circle" />
        <img src={heroIcon1} alt="" className="candidate-details-icon icon-1" />
        <img src={heroIcon2} alt="" className="candidate-details-icon icon-2" />
        <div className="candidate-details-hero-inner">
          {profile && (
            <div className="candidate-details-hero-card">
              <div className="candidate-details-hero-main">
                <img
                  src={resolveAvatar(profile.profilePicture)}
                  alt={profile.fullName}
                  className="candidate-details-avatar"
                />
                <div>
                  <h1>{profile.fullName}</h1>
                  <p>{profile.currentJobTitle || "Candidate"}</p>
                  <span>{profile.address || "Location not specified"}</span>
                  {profile.email && (
                    <div className="candidate-details-email">
                      {profile.email}
                    </div>
                  )}
                </div>
              </div>
              {!isSelfProfile && isAllowedRole && (
                <div className="candidate-details-hero-side">
                  <div className="candidate-details-connect-actions">
                    <button
                      type="button"
                      className={`candidate-details-connect-btn ${
                        connectionStatus === "pending"
                          ? "is-pending"
                          : connectionStatus === "friend"
                            ? "is-friend"
                            : ""
                      }`}
                      disabled={sendingConnection || connectionStatus !== "none"}
                      onClick={handleSendConnection}
                    >
                      <img src={connectionIcon} alt={connectionLabel} />
                      <span>{connectionLabel}</span>
                    </button>
                    <button
                      type="button"
                      className="candidate-details-connect-btn"
                      onClick={handleOpenMessages}
                    >
                      <img src={messageIcon} alt="Message" />
                      <span>Message</span>
                    </button>
                  </div>
                  {mutualConnections.length > 0 && (
                    <div className="candidate-details-mutuals">
                      <div className="candidate-details-mutual-avatars">
                        {mutualConnections.slice(0, 4).map((item) => (
                          <img
                            key={item.id}
                            src={resolveAvatar(item.profilePicture)}
                            alt={item.fullName}
                            title={item.fullName}
                            className={
                              item.role === "recruiter"
                                ? "candidate-details-mutual-logo"
                                : ""
                            }
                          />
                        ))}
                      </div>
                      <span>
                        {mutualConnections.length} mutual connection
                        {mutualConnections.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {loading && <div className="candidate-details-state">Loading</div>}
          {error && !loading && (
            <div className="candidate-details-state error">{error}</div>
          )}
        </div>
      </section>

      <section className="candidate-details-content">
        {profile && !isPrivateProfile && (
          <>
            <div className="candidate-details-grid">
              <div className="candidate-details-column">
              <div className="candidate-details-card">
                <h3>About</h3>
                <div
                  className="candidate-description-text"
                  dangerouslySetInnerHTML={{
                    __html: profile.about || "No bio provided.",
                  }}
                />
              </div>

              <div className="candidate-details-card">
                <h3>Experience</h3>
                {profile.experience && profile.experience.length > 0 ? (
                  <div className="candidate-details-list">
                    {profile.experience.map((item, index) => (
                      <div key={index} className="candidate-details-item">
                        <h4>{item.jobTitle || "Role"}</h4>
                        <span>
                          {(item.organization || "Organization") +
                            (item.location ? ` • ${item.location}` : "")}
                        </span>
                        <div className="candidate-details-dates">
                          {formatDate(item.startDate)}{" "}
                          {item.isCurrent
                            ? " - Present"
                            : item.endDate
                              ? ` - ${formatDate(item.endDate)}`
                              : ""}
                        </div>
                        {item.description && (
                          <div
                            className="candidate-description-text"
                            dangerouslySetInnerHTML={{
                              __html: item.description,
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No experience added.</p>
                )}
              </div>

            </div>

          <div className="candidate-details-column">
            <div className="candidate-details-card">
              <h3>Skills</h3>
              {profile.skills && profile.skills.length > 0 ? (
                <div className="candidate-skill-list">
                  {profile.skills.map((skill, index) => (
                    <div key={index} className="candidate-skill-card">
                      <div className="candidate-skill-top">
                        <h4>{skill.skillName}</h4>
                        <span className="candidate-skill-level">
                          {skill.proficiencyLevel || "Intermediate"}
                        </span>
                      </div>
                      <div className="candidate-skill-meta">
                        <span>{skill.category || "Technical"}</span>
                        <span>
                          {typeof skill.yearsOfExperience === "number"
                            ? `${skill.yearsOfExperience} yr${
                                skill.yearsOfExperience === 1 ? "" : "s"
                              }`
                            : "1 yr"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No skills added.</p>
              )}
            </div>

              <div className="candidate-details-card">
                <h3>Resume</h3>
                {profile.resume ? (
                  <div className="candidate-details-resume">
                    <span className="candidate-details-resume-name">
                      Resume
                    </span>
                    {profile.resumeFileSize ? (
                      <span className="candidate-details-resume-size">
                        {formatFileSize(profile.resumeFileSize)}
                      </span>
                    ) : null}
                    <a
                      href={resolveAssetUrl(profile.resume)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="candidate-details-resume-view"
                    >
                      View
                    </a>
                  </div>
                ) : (
                  <p>No resume uploaded.</p>
                )}
              </div>

              <div className="candidate-details-card">
                <h3>Quiz / Assessments</h3>
                {showcaseAssessments.length > 0 ? (
                  <div className="candidate-quiz-list">
                    {showcaseAssessments.slice(0, 5).map((item) => (
                      <div key={item.attemptId} className="candidate-quiz-item">
                        <div className="candidate-quiz-header">
                          <h4>{item.title}</h4>
                          {item.type === "quiz" ? (
                            <span className="candidate-quiz-score candidate-score-passed">
                              {item.score}/{item.quizTotal}
                            </span>
                          ) : (
                            <span className="candidate-quiz-type-badge">
                              {item.type === "task" ? "Task-Based" : "Writing"}
                            </span>
                          )}
                        </div>
                        <p className="candidate-quiz-status">
                          Submitted{" "}
                          {item.submittedAt
                            ? new Date(item.submittedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : ""}
                        </p>
                        <button
                          type="button"
                          className="candidate-quiz-view-btn"
                          onClick={() =>
                            navigate(
                              `/candidate/${profile.id}/assessments/${item.attemptId}`,
                            )
                          }
                        >
                          View Submission
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No showcased assessments yet.</p>
                )}
              </div>

              <div className="candidate-details-card">
                <h3>Certifications</h3>
                {profile.certifications && profile.certifications.length > 0 ? (
                  <div className="candidate-cert-list">
                    {profile.certifications.map((item, index) => (
                      <div key={index} className="candidate-cert-item">
                        <div className="candidate-cert-header">
                          <div className="candidate-cert-title-row">
                            <h4 className="candidate-cert-name">
                              {item.certificationName || "Certification"}
                            </h4>
                          </div>
                          <p className="candidate-sub-text">
                            {item.issuingOrganization || "Issuing Organization"}
                            {item.credentialId ? ` | ID: ${item.credentialId}` : ""}
                          </p>
                        </div>
                        <p className="candidate-meta-text">
                          Issued {formatDate(item.issueDate) || "N/A"}
                          {!item.doesNotExpire && item.expirationDate
                            ? ` | Expires ${formatDate(item.expirationDate)}`
                            : ""}
                          {item.doesNotExpire ? " | No expiration" : ""}
                        </p>
                        {item.credentialUrl && (
                          <a
                            href={
                              item.credentialUrl.startsWith("http")
                                ? item.credentialUrl
                                : `${import.meta.env.VITE_BACKEND_URL}${item.credentialUrl}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="candidate-show-credential-btn"
                          >
                            <span>Show Credential</span>
                            <img src={arrowIcon} alt="Arrow" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No certifications added.</p>
                )}
              </div>

              <div className="candidate-details-card">
                <h3>Languages</h3>
                {profile.languages && profile.languages.length > 0 ? (
                  <ul>
                    {profile.languages.map((item, index) => (
                      <li key={index}>
                        <div className="candidate-details-language">
                          <span>{item.languageName || "Language"}</span>
                          <div className="candidate-details-language-stars">
                            {renderLanguageStars(item.rating || 0)}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No languages added.</p>
                )}
              </div>

              <div className="candidate-details-card">
                <h3>Education</h3>
                {profile.education && profile.education.length > 0 ? (
                  <div className="candidate-details-list">
                    {profile.education.map((item, index) => (
                      <div key={index} className="candidate-details-item">
                        <h4>{item.degreeTitle || "Degree"}</h4>
                        <span>
                          {(item.institution || "Institution") +
                            (item.location ? ` • ${item.location}` : "")}
                        </span>
                        <div className="candidate-details-dates">
                          {formatDate(item.startDate)}{" "}
                          {item.isCurrent
                            ? " - Present"
                            : item.endDate
                              ? ` - ${formatDate(item.endDate)}`
                              : ""}
                        </div>
                        {item.description && (
                          <div
                            className="candidate-description-text"
                            dangerouslySetInnerHTML={{
                              __html: item.description,
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No education added.</p>
                )}
              </div>
              </div>
            </div>

            <div className="candidate-details-card candidate-details-card-full">
              <h3>Projects</h3>
              {profile.projects && profile.projects.length > 0 ? (
                <div className="candidate-project-list">
                  {profile.projects.map((item, index) => (
                    <div key={index} className="candidate-project-item">
                      <img
                        src={getProjectImageUrl(item.coverImage)}
                        alt={item.projectTitle || "Project"}
                        className="candidate-project-img candidate-details-project-img"
                        onError={(event) => {
                          event.currentTarget.src = projectImage;
                        }}
                      />
                      <div className="candidate-project-details">
                        <div className="candidate-project-header">
                          <div className="candidate-project-title-row">
                            <h4 className="candidate-project-title">
                              {item.projectTitle || "Project"}
                            </h4>
                          </div>
                          {formatProjectDateRange(
                            item.startDate,
                            item.endDate,
                            item.isOngoing,
                          ) && (
                            <p className="candidate-project-date-range">
                              {formatProjectDateRange(
                                item.startDate,
                                item.endDate,
                                item.isOngoing,
                              )}
                            </p>
                          )}
                        </div>

                        {item.technologies && (
                          <div className="candidate-project-technologies">
                            <span className="candidate-project-tech-label">
                              Technologies:
                            </span>
                            <div className="candidate-tech-tags">
                              {(Array.isArray(item.technologies)
                                ? item.technologies
                                : item.technologies.split(",")
                              )
                                .map((tech) => tech.trim())
                                .filter(Boolean)
                                .map((tech, techIndex) => (
                                  <span
                                    key={`${tech}-${techIndex}`}
                                    className="candidate-tech-tag"
                                  >
                                    {tech}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}

                        {item.projectUrl && (
                          <a
                            href={item.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="candidate-show-project-btn"
                          >
                            <span>View Project</span>
                            <img src={arrowIcon} alt="Arrow" />
                          </a>
                        )}

                        {(item.projectDescription || item.description) && (
                          <div
                            className="candidate-description-text-project"
                            dangerouslySetInnerHTML={{
                              __html:
                                item.projectDescription || item.description || "",
                            }}
                          />
                        )}

                        <div className="candidate-project-reviews">
                          {projectReviews[getProjectKey(item)]?.length ? (
                            <>
                              <div className="candidate-project-review-section-head">
                                <h5>Project Reviews</h5>
                                <button
                                  type="button"
                                  className="candidate-project-review-section-toggle"
                                  onClick={() =>
                                    toggleProjectReviewSection(getProjectKey(item))
                                  }
                                >
                                  {(projectReviewSectionOpen[getProjectKey(item)] ?? false)
                                    ? "Collapse"
                                    : "Expand"}
                                </button>
                              </div>
                              {(projectReviewSectionOpen[getProjectKey(item)] ?? false) && (
                              <div className="candidate-project-review-list">
                                {projectReviews[getProjectKey(item)].map((review) => {
                                  const projectKey = getProjectKey(item);
                                  const expansionKey = getProjectReviewStateKey(
                                    projectKey,
                                    review.id,
                                  );
                                  const isExpanded = Boolean(
                                    expandedProjectReviews[expansionKey],
                                  );
                                  const hasLongText =
                                    (review.text || "").trim().length > 180;

                                  return (
                                    <div
                                      key={review.id}
                                      className="candidate-project-review-item"
                                    >
                                      <div className="candidate-project-review-header">
                                        <div className="candidate-project-review-author">
                                          <img
                                            src={review.reviewerAvatar || defaultAvatar}
                                            alt={review.reviewerName}
                                            className={
                                              review.reviewerUserType === "recruiter" ||
                                              review.reviewerRole?.toLowerCase() === "recruiter"
                                                ? "candidate-project-review-logo"
                                                : ""
                                            }
                                          />
                                          <div>
                                            <strong>{review.reviewerName}</strong>
                                            <span>{review.reviewerRole || "User"}</span>
                                          </div>
                                        </div>
                                        <div className="candidate-project-review-meta">
                                          <div className="candidate-project-review-stars">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                              <img
                                                key={i}
                                                src={i < review.rating ? starIcon : emptyStarIcon}
                                                alt="star"
                                              />
                                            ))}
                                          </div>
                                          <small>{review.date || ""}</small>
                                        </div>
                                      </div>
                                      <p
                                        className={`candidate-project-review-text ${
                                          isExpanded ? "expanded" : ""
                                        }`}
                                      >
                                        {review.text}
                                      </p>
                                      {hasLongText && (
                                        <button
                                          type="button"
                                          className="candidate-project-review-read-toggle"
                                          onClick={() =>
                                            toggleProjectReviewExpansion(
                                              projectKey,
                                              review.id,
                                            )
                                          }
                                        >
                                          {isExpanded ? "Show less" : "Read more"}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              )}
                            </>
                          ) : null}

                          {canReviewProject && getProjectKey(item) && (
                            <div className="candidate-project-review-actions">
                              <button
                                type="button"
                                className="candidate-project-review-toggle"
                                onClick={() =>
                                  setProjectReviewFormOpen((prev) => ({
                                    ...prev,
                                    [getProjectKey(item)]:
                                      !prev[getProjectKey(item)],
                                  }))
                                }
                              >
                                {myProjectReviews[getProjectKey(item)]
                                  ? "Edit Your Review"
                                  : "Write a Review"}
                              </button>

                              {projectReviewFormOpen[getProjectKey(item)] && (
                                <div className="candidate-project-review-form">
                                  <div className="candidate-project-rating-input">
                                    {Array.from({ length: 5 }).map((_, i) => {
                                      const currentRating =
                                        projectReviewForms[getProjectKey(item)]?.rating || 5;
                                      return (
                                        <button
                                          key={i}
                                          type="button"
                                          onClick={() =>
                                            setProjectReviewField(
                                              getProjectKey(item),
                                              "rating",
                                              i + 1,
                                            )
                                          }
                                        >
                                          <img
                                            src={i < currentRating ? starIcon : emptyStarIcon}
                                            alt="star"
                                          />
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <textarea
                                    value={
                                      projectReviewForms[getProjectKey(item)]?.description || ""
                                    }
                                    onChange={(e) =>
                                      setProjectReviewField(
                                        getProjectKey(item),
                                        "description",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Write your review for this project..."
                                  />
                                  {projectReviewErrors[getProjectKey(item)] && (
                                    <p className="candidate-project-review-error">
                                      {projectReviewErrors[getProjectKey(item)]}
                                    </p>
                                  )}
                                  <div className="candidate-project-review-form-actions">
                                    <button
                                      type="button"
                                      className="candidate-project-review-submit"
                                      onClick={() => submitProjectReview(item)}
                                      disabled={projectReviewSaving[getProjectKey(item)]}
                                    >
                                      {projectReviewSaving[getProjectKey(item)]
                                        ? "Saving..."
                                        : myProjectReviews[getProjectKey(item)]
                                          ? "Update Review"
                                          : "Submit Review"}
                                    </button>
                                    <button
                                      type="button"
                                      className="candidate-project-review-cancel"
                                      onClick={() =>
                                        setProjectReviewFormOpen((prev) => ({
                                          ...prev,
                                          [getProjectKey(item)]: false,
                                        }))
                                      }
                                      disabled={projectReviewSaving[getProjectKey(item)]}
                                    >
                                      Cancel
                                    </button>
                                    {myProjectReviews[getProjectKey(item)] && (
                                      <button
                                        type="button"
                                        className="candidate-project-review-delete"
                                        onClick={() => deleteProjectReview(item)}
                                        disabled={projectReviewSaving[getProjectKey(item)]}
                                      >
                                        Delete Review
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No projects added.</p>
              )}
            </div>
          </>
        )}
        {profile && isPrivateProfile && (
          <div className="candidate-details-state candidate-details-state-private">
            {privateNotice ||
              "This candidate has set their profile to private. Only basic profile information is visible."}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default CandidateDetailsPage;




