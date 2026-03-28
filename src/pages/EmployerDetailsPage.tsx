// EmployerDetailsPage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/EmployerDetailsPage.css";

// Import images from Employers Page Images folder
import heroBgLeft from "../images/Employers Page Images/8_189.svg";
import heroBgRight from "../images/Employers Page Images/8_197.svg";
import heroCircle from "../images/Employers Page Images/8_205.svg";
import heroIcon1 from "../images/Employers Page Images/8_208.svg";
import heroIcon2 from "../images/Employers Page Images/8_209.svg";

import locationIcon from "../images/Employers Page Images/location-icond.svg";
import sizeIcon from "../images/Employers Page Images/5_115.svg";
import emailIcon from "../images/Employers Page Images/5_124.svg";
import foundedIcon from "../images/Employers Page Images/5_131.svg";

// Job meta icons from HTML
import jobCardLocationIcon from "../images/Job List Page Images/location.svg";
import jobCardTypeIcon from "../images/Job List Page Images/job-type.svg";
import jobCardWorkModeIcon from "../images/Job List Page Images/work-mode.svg";
import jobCardBookmarkIcon from "../images/Recruiter Job Post Page Images/bookmarkIcon.svg";
import jobCardSavedBookmarkIcon from "../images/Recruiter Job Post Page Images/bookmarkFilled.svg";
import jobCardShareIcon from "../images/Recruiter Job Post Page Images/shareFg.svg";

// Share and save icons

// Star icons from HTML
import starFilled from "../images/Employers Page Images/5_169.svg";
import starHalf from "../images/Employers Page Images/5_171.svg";
import starEmpty from "../images/Employers Page Images/unfilled stars.svg";

// Social icons
import facebookIcon from "../images/Employers Page Images/Facebook.png";
import linkedinIcon from "../images/Employers Page Images/Linkedin.png";
import instagramIcon from "../images/Employers Page Images/Instagram icon.jpg";
import connectIcon from "../images/Employers Page Images/connect-icon.png";
import pendingIcon from "../images/Employers Page Images/pending-icon.png";
import friendIcon from "../images/Employers Page Images/friend-icon.png";
import messageIcon from "../images/Employers Page Images/message-icon.png";

// Review illustration
import reviewIllustration from "../images/Employers Page Images/3af141ed608258860f6993ff7346ee87372d5fb8.png";

// Default logo
import defaultLogo from "../images/Register Page Images/Default Profile.webp";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Define interface for Company details
interface CompanyDetails {
  id: string;
  name: string;
  profileVisibility?: "public" | "private";
  logo: string;
  location: string;
  email: string;
  companySize: string;
  foundedYear: string;
  websiteUrl: string;
  about: string;
  workspaceImages: string[];
  linkedinUrl: string;
  instagramUrl: string;
  facebookUrl: string;
}

// Define interface for Job
interface Job {
  id: string;
  title: string;
  company: string;
  type: string;
  location: string;
  workMode: string;
  logo: string;
  assessmentRequired?: boolean;
}

// Define interface for Review
interface Review {
  id: string;
  rating: number;
  text: string;
  reviewerName: string;
  reviewerLocation: string;
  reviewerRole: string;
  reviewerUserType?: string;
  date: string;
  reviewerAvatar: string;
}

type ConnectionState = "none" | "pending" | "friend";
type MutualConnection = {
  id: string;
  fullName: string;
  profilePicture?: string;
  role?: string;
};

const EmployerDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State for company details
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [privateNotice, setPrivateNotice] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    description: "",
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(true);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  // Reviews state from API
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [isCheckingReview, setIsCheckingReview] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionState>("none");
  const [sendingConnection, setSendingConnection] = useState(false);
  const [mutualConnections, setMutualConnections] = useState<
    MutualConnection[]
  >([]);
  const userDataStr = localStorage.getItem("userData");
  const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
  const currentUserId =
    currentUser?.id || currentUser?._id || currentUser?.userId || "";
  const isAdminViewer =
    currentUser?.email === "hirelinknp@gmail.com" ||
    currentUser?.role === "admin";
  const isAllowedRole =
    currentUser?.role === "candidate" || currentUser?.role === "recruiter";
  const userRole = currentUser?.role || "";

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    console.log("Token from localStorage:", token); // Debug log
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    console.log("isLoggedIn state changed:", isLoggedIn); // Debug log
  }, [isLoggedIn]);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});
  const [savedJobs, setSavedJobs] = useState<Record<string, boolean>>({});

  // Fetch company details from backend
  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsPrivateProfile(false);
      setPrivateNotice("");
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `${API_BASE_URL}/employers/${id}`,
        {
          method: "GET",
          headers: token
            ? {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              }
            : {
                "Content-Type": "application/json",
              },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.company) {
          setCompany(data.company);
        } else {
          setError("Failed to load company details");
        }
      } else {
        if (response.status === 404) {
          setError("Company not found");
        } else if (response.status === 403) {
          const data = await response.json();
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
              const me = meData.user;
              setIsPrivateProfile(false);
              setPrivateNotice("");
              setCompany({
                id: me.id,
                name: me.fullName || "Company",
                logo: me.profilePicture
                  ? me.profilePicture.startsWith("http")
                    ? me.profilePicture
                    : `${import.meta.env.VITE_BACKEND_URL}${me.profilePicture}`
                  : "",
                location: me.address || "Location not specified",
                email: me.email || "",
                companySize: me.companySize || "",
                foundedYear: me.foundedYear || "",
                websiteUrl: me.websiteUrl || "",
                about: me.about || "",
                workspaceImages: (me.workspaceImages || [])
                  .map((item: any) =>
                    item?.imageUrl
                      ? item.imageUrl.startsWith("http")
                        ? item.imageUrl
                        : `${import.meta.env.VITE_BACKEND_URL}${item.imageUrl}`
                      : null,
                  )
                  .filter(Boolean),
                linkedinUrl: me.linkedinUrl || "",
                instagramUrl: me.instagramUrl || "",
                facebookUrl: me.facebookUrl || "",
              });
              setError(null);
              return;
            }
          }

          setIsPrivateProfile(true);
          setPrivateNotice(
            data?.message ||
              "This employer profile is private. Details are not available.",
          );
          setError(null);

          // Keep hero card visible by loading basic employer listing data.
          const listResponse = await fetch(
            `${API_BASE_URL}/employers`,
          );
          const listData = await listResponse.json();

          if (listResponse.ok && Array.isArray(listData?.recruiters)) {
            const matched = listData.recruiters.find(
              (item: any) => String(item?.id || "") === String(id),
            );

            if (matched) {
              setCompany({
                id: matched.id,
                name: matched.name || "Company",
                logo: matched.logo || "",
                location: matched.location || "Location not specified",
                email: matched.email || "",
                companySize: matched.companySize || "",
                foundedYear: matched.foundedYear || "",
                websiteUrl: matched.websiteUrl || "",
                about: "",
                workspaceImages: [],
                linkedinUrl: "",
                instagramUrl: "",
                facebookUrl: "",
              });
            }
          }
        } else {
          setError("Failed to fetch company details");
        }
      }
    } catch (err: any) {
      console.error("Error fetching company details:", err);
      setError("No data found currently.");
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyJobs = async () => {
    if (!id) return;
    try {
      setJobsLoading(true);
      setJobsError(null);
      const response = await fetch(
        `${API_BASE_URL}/jobs?recruiterId=${id}&sort=newest&limit=6`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch openings");
      }

      const mappedJobs = (data.jobs || []).map((job: any) => ({
        id: job.id || job._id,
        title: job.jobTitle || "Untitled Role",
        company: job.companyName || company?.name || "Company",
        type: job.jobType || "Full-Time",
        location: job.location || "Location",
        workMode: job.workMode || "remote",
        logo: resolveLogo(job.companyLogo || company?.logo),
        assessmentRequired: Boolean(job.assessmentRequired),
      }));

      setJobs(mappedJobs);
    } catch {
      setJobsError("No data found currently.");
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  // Check if user has already reviewed this company
  const checkExistingReview = async () => {
    if (!id || !isLoggedIn) return;

    setIsCheckingReview(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${API_BASE_URL}/reviews/company/${id}/my-review`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.review) {
          setExistingReview(data.review);
          // Pre-fill the review form with existing review
          setNewReview({
            rating: data.review.rating,
            description: data.review.text,
          });
        } else {
          setExistingReview(null);
        }
      } else if (response.status === 404) {
        // No existing review found
        setExistingReview(null);
      } else {
        console.error("Failed to check existing review");
      }
    } catch (err) {
      console.error("Error checking existing review:", err);
    } finally {
      setIsCheckingReview(false);
    }
  };

  // Fetch reviews from API
  const fetchReviews = async () => {
    if (!id) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/reviews/company/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Only show published reviews
          setReviews(data.reviews || []);
          setAverageRating(data.averageRating || 0);
        }
      } else {
        console.error("Failed to fetch reviews");
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  // Fetch company details on component mount
  useEffect(() => {
    if (id) {
      fetchCompanyDetails();
      fetchCompanyJobs();
      fetchReviews();
    } else {
      setError("No company ID provided");
      setLoading(false);
    }
  }, [id, isReviewSubmitted]);

  useEffect(() => {
    if (company?.name && !isPrivateProfile) {
      fetchCompanyJobs();
    }
  }, [company?.name, isPrivateProfile]);

  useEffect(() => {
    if (jobs.length === 0) {
      setAppliedJobs({});
      setSavedJobs({});
      return;
    }

    const ids = jobs.map((job) => job.id);
    fetchAppliedStatuses(ids);
    fetchSavedStatuses(ids);
  }, [jobs, userRole]);

  const formatWorkMode = (mode?: string) => {
    if (!mode) return "Remote";
    const normalized = mode.toLowerCase();
    if (normalized === "on-site" || normalized === "onsite") return "On-site";
    if (normalized === "hybrid") return "Hybrid";
    return "Remote";
  };

  // Check for existing review when logged in status changes
  useEffect(() => {
    if (isLoggedIn && id) {
      checkExistingReview();
    }
  }, [isLoggedIn, id]);

  useEffect(() => {
    const fetchConnectionStatus = async () => {
      if (!company?.id || !currentUserId || company.id === currentUserId)
        return;
      if (!isAllowedRole) return;

      const token = localStorage.getItem("authToken");
      if (!token) return;

      try {
        const res = await fetch(
          `${API_BASE_URL}/connections/statuses?targetIds=${company.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        if (!res.ok) return;
        const next = (data?.statuses?.[company.id] ||
          "none") as ConnectionState;
        setConnectionStatus(next);
      } catch {
        setConnectionStatus("none");
      }
    };

    fetchConnectionStatus();
  }, [company?.id, currentUserId, isAllowedRole]);

  useEffect(() => {
    const fetchMutualConnections = async () => {
      if (!company?.id || !currentUserId || company.id === currentUserId) {
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
          `${API_BASE_URL}/connections/mutual/${company.id}`,
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
  }, [company?.id, currentUserId, isAllowedRole]);

  const handleViewDetails = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
  };

  const handleApplyNow = (job: Job) => {
    if (!userRole) {
      navigate("/login");
      return;
    }

    if (userRole !== "candidate" || appliedJobs[job.id]) return;
    navigate(`/jobs/${job.id}`);
  };

  const fetchAppliedStatuses = async (jobIds: string[]) => {
    const token = localStorage.getItem("authToken");
    if (!token || userRole !== "candidate") {
      setAppliedJobs({});
      return;
    }

    try {
      const entries = await Promise.all(
        jobIds.map(async (jobId) => {
          const res = await fetch(
            `${API_BASE_URL}/applications/status/${jobId}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const data = await res.json();
          return [jobId, Boolean(data?.applied)] as const;
        }),
      );
      setAppliedJobs(Object.fromEntries(entries));
    } catch {
      setAppliedJobs({});
    }
  };

  const fetchSavedStatuses = async (jobIds: string[]) => {
    const token = localStorage.getItem("authToken");
    if (!token || userRole !== "candidate") {
      setSavedJobs({});
      return;
    }

    try {
      const entries = await Promise.all(
        jobIds.map(async (jobId) => {
          const res = await fetch(
            `${API_BASE_URL}/saved-jobs/status/${jobId}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const data = await res.json();
          return [jobId, Boolean(data?.saved)] as const;
        }),
      );
      setSavedJobs(Object.fromEntries(entries));
    } catch {
      setSavedJobs({});
    }
  };

  const toggleSaveJob = async (jobId: string) => {
    const token = localStorage.getItem("authToken");
    if (!token || userRole !== "candidate") {
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/saved-jobs/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setSavedJobs((prev) => ({ ...prev, [jobId]: Boolean(data?.saved) }));
    } catch {
      // no-op
    }
  };

  const handleSocialLink = (url: string, platform: string) => {
    if (url && url.trim() !== "") {
      let finalUrl = url.trim();
      if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
        finalUrl = `https://${finalUrl}`;
      }
      window.open(finalUrl, "_blank");
    } else {
      alert(
        `${company?.name || "This company"} doesn't have a ${platform} profile`,
      );
    }
  };

  const handleSendMessage = () => {
    if (!company?.id) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!isAllowedRole) return;
    const role = currentUser?.role;
    if (role !== "candidate" && role !== "recruiter") return;

    navigate(`/${role}/messages?user=${company.id}`);
  };

  const handleSendConnection = async () => {
    if (!company?.id || !isAllowedRole || company.id === currentUserId) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }
    if (sendingConnection || connectionStatus !== "none") return;

    try {
      setSendingConnection(true);
      const res = await fetch(`${API_BASE_URL}/connections/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientId: company.id }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setConnectionStatus(data.status === "accepted" ? "friend" : "pending");
    } finally {
      setSendingConnection(false);
    }
  };

  const handleExploreMore = () => {
    navigate("/jobs");
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    e.currentTarget.src = defaultLogo;
  };

  const resolveLogo = (logo?: string) => {
    if (!logo) return defaultLogo;
    if (logo.startsWith("http")) return logo;
    return `${import.meta.env.VITE_BACKEND_URL}${logo.startsWith("/") ? "" : "/"}${logo}`;
  };

  const formatRichTextForDisplay = (content?: string) => {
    if (!content) return "";
    const hasHtmlTag = /<\/?[a-z][\s\S]*>/i.test(content);
    return hasHtmlTag ? content : content.replace(/\n/g, "<br />");
  };

  const resolveProfileImage = (profilePicture?: string) => {
    if (!profilePicture || profilePicture.trim() === "") return defaultLogo;
    if (profilePicture.startsWith("http")) return profilePicture;
    return `${import.meta.env.VITE_BACKEND_URL}${profilePicture.startsWith("/") ? "" : "/"}${profilePicture}`;
  };

  // Review form handlers
  const handleRatingClick = (rating: number) => {
    setNewReview({ ...newReview, rating });
  };

  const handleStarHover = (rating: number) => {
    setHoveredRating(rating);
  };

  const handleSubmitReview = async () => {
    if (isSelfProfile) {
      setReviewError("You cannot review your own company profile.");
      return;
    }

    if (newReview.rating === 0) {
      setReviewError("Please select a rating");
      return;
    }
    if (!newReview.description.trim()) {
      setReviewError("Please enter a review description");
      return;
    }
    if (newReview.description.trim().length < 10) {
      setReviewError("Review description must be at least 10 characters");
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setReviewError("Please login to submit a review");
        // Redirect to login page
        setTimeout(() => {
          navigate("/login", {
            state: {
              from: `/employers/${id}`,
              message: "Please login to submit a review",
            },
          });
        }, 1500);
        setSubmittingReview(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/reviews/company/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: newReview.rating,
            description: newReview.description,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        // Clear form and close it
        setNewReview({ rating: 0, description: "" });
        setShowReviewForm(false);
        setIsReviewSubmitted(!isReviewSubmitted); // Trigger re-fetch
        setExistingReview(data.review); // Set the existing review
        setReviewError(null);

        // Show success message
        setReviewError("Review submitted successfully!");
        setTimeout(() => setReviewError(null), 3000);
      } else if (
        response.status === 400 &&
        data.code === "REVIEW_ALREADY_EXISTS"
      ) {
        // User already has a review
        setReviewError(
          "You have already submitted a review for this company. You can update your existing review.",
        );
        setExistingReview(null); // Reset existing review to trigger re-check
        checkExistingReview(); // Re-check for existing review
      } else if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        setReviewError("Your session has expired. Please login again.");
        setTimeout(() => {
          navigate("/login", {
            state: {
              from: `/employers/${id}`,
              message: "Your session has expired",
            },
          });
        }, 1500);
      } else {
        setReviewError(data.message || "Failed to submit review");
      }
    } catch (err: any) {
      console.error("Error submitting review:", err);
      setReviewError("Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Update existing review
  const handleUpdateReview = async () => {
    if (!existingReview) return;

    if (newReview.rating === 0) {
      setReviewError("Please select a rating");
      return;
    }
    if (!newReview.description.trim()) {
      setReviewError("Please enter a review description");
      return;
    }
    if (newReview.description.trim().length < 10) {
      setReviewError("Review description must be at least 10 characters");
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${API_BASE_URL}/reviews/${existingReview.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: newReview.rating,
            description: newReview.description,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        // Clear form and close it
        setNewReview({ rating: 0, description: "" });
        setShowReviewForm(false);
        setIsReviewSubmitted(!isReviewSubmitted); // Trigger re-fetch
        setExistingReview(data.review); // Update existing review
        setReviewError(null);

        // Show success message
        setReviewError("Review updated successfully!");
        setTimeout(() => setReviewError(null), 3000);
      } else if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        setReviewError("Your session has expired. Please login again.");
        setTimeout(() => {
          navigate("/login", {
            state: {
              from: `/employers/${id}`,
              message: "Your session has expired",
            },
          });
        }, 1500);
      } else {
        setReviewError(data.message || "Failed to update review");
      }
    } catch (err: any) {
      console.error("Error updating review:", err);
      setReviewError("Failed to update review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Delete existing review
  const handleDeleteReview = async () => {
    if (!existingReview) return;

    setSubmittingReview(true);
    setReviewError(null);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${API_BASE_URL}/reviews/${existingReview.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        // Clear form and close it
        setNewReview({ rating: 0, description: "" });
        setShowReviewForm(false);
        setExistingReview(null);
        setIsReviewSubmitted(!isReviewSubmitted); // Trigger re-fetch
        setReviewError(null);

        // Show success message
        setReviewError("Review deleted successfully!");
        setTimeout(() => setReviewError(null), 3000);
      } else if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        setReviewError("Your session has expired. Please login again.");
        setTimeout(() => {
          navigate("/login", {
            state: {
              from: `/employers/${id}`,
              message: "Your session has expired",
            },
          });
        }, 1500);
      } else {
        setReviewError(data.message || "Failed to delete review");
      }
    } catch (err: any) {
      console.error("Error deleting review:", err);
      setReviewError("Failed to delete review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Render stars for reviews
  const renderStars = (
    rating: number,
    size: "small" | "medium" | "large" = "medium",
  ) => {
    const sizeClass = `employer-details-star-${size}`;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(
          <img
            key={i}
            src={starFilled}
            alt="star"
            className={`employer-details-star ${sizeClass}`}
          />,
        );
      } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
        stars.push(
          <img
            key={i}
            src={starHalf}
            alt="half star"
            className={`employer-details-star ${sizeClass}`}
          />,
        );
      } else {
        stars.push(
          <img
            key={i}
            src={starEmpty}
            alt="empty star"
            className={`employer-details-star ${sizeClass}`}
          />,
        );
      }
    }
    return stars;
  };

  // Render stars for rating input
  const renderRatingStars = () => {
    return [1, 2, 3, 4, 5].map((star) => {
      const isFilled = star <= (newReview.rating || hoveredRating);
      const src = isFilled ? starFilled : starEmpty;

      return (
        <img
          key={star}
          src={src}
          alt={`Rate ${star} stars`}
          className="employer-details-rating-star"
          onClick={() => handleRatingClick(star)}
          onMouseEnter={() => handleStarHover(star)}
          onMouseLeave={() => setHoveredRating(0)}
          style={{
            cursor: "pointer",
            opacity:
              hoveredRating > 0 && star > hoveredRating && !isFilled ? 0.5 : 1,
          }}
        />
      );
    });
  };

  // Function to check if text is placeholder/test data
  const isPlaceholderText = (text: string): boolean => {
    if (!text || !text.trim()) return true;
    const trimmed = text.trim();
    // Check for repeated single characters (like "fffffff" or "aaaaaa")
    if (/^([a-z])\1{10,}$/i.test(trimmed)) return true;
    // Check for common placeholder patterns
    if (
      /^(lorem|test|placeholder|sample|dummy|ffff+|aaaa+|xxxx+)/i.test(trimmed)
    )
      return true;
    return false;
  };

  // Function to get preview text (first 60 characters)
  const getPreviewText = (text: string) => {
    if (!text || text.trim().length === 0) return "";
    if (text.length <= 60) return text;
    return text.substring(0, 60) + "...";
  };

  // Toggle review expansion
  const toggleReviewExpansion = (reviewId: string) => {
    setExpandedReviewId(expandedReviewId === reviewId ? null : reviewId);
  };

  // Handle opening review form
  const handleOpenReviewForm = () => {
    if (isSelfProfile) {
      setReviewError("You cannot review your own company profile.");
      return;
    }

    if (!isLoggedIn) {
      navigate("/login", {
        state: {
          from: `/employers/${id}`,
          message: "Please login to write a review",
        },
      });
      return;
    }

    if (existingReview) {
      // Pre-fill with existing review
      setNewReview({
        rating: existingReview.rating,
        description: existingReview.text,
      });
    } else {
      // Clear form for new review
      setNewReview({ rating: 0, description: "" });
    }
    setShowReviewForm(true);
  };

  const isSelfProfile = Boolean(company?.id && company.id === currentUserId);
  const connectionLabel =
    connectionStatus === "friend"
      ? "Friend"
      : connectionStatus === "pending"
        ? "Pending"
        : "Connect";
  const connectionActionIcon =
    connectionStatus === "friend"
      ? friendIcon
      : connectionStatus === "pending"
        ? pendingIcon
        : connectIcon;

  return (
    <div className="employer-details-page">
      <Navbar />

      {/* Hero Section */}
      <section className="employer-details-hero">
        <div className="employer-details-hero-wrapper">
          <div className="employer-details-hero-bg-elements">
            <img
              src={heroBgLeft}
              className="employer-details-bg-left"
              alt="Background decoration left"
            />
            <img
              src={heroBgRight}
              className="employer-details-bg-right"
              alt="Background decoration right"
            />
            <img
              src={heroCircle}
              className="employer-details-bg-circle"
              alt="Background circle"
            />
            <img
              src={heroIcon1}
              className="employer-details-bg-icon-1"
              alt="Background icon 1"
            />
            <img
              src={heroIcon2}
              className="employer-details-bg-icon-2"
              alt="Background icon 2"
            />
          </div>

          <div className="employer-details-hero-content">
            <div className="employer-details-company-header">
              {company ? (
                <>
                  <div className="employer-details-logo-wrapper">
                    <img
                      src={company.logo || defaultLogo}
                      alt={company.name}
                      className="employer-details-logo"
                      onError={handleImageError}
                    />
                  </div>
                  <div className="employer-details-company-text">
                    <h1>{company.name}</h1>
                    <p>Find your dream job at {company.name}</p>
                  </div>
                  {!isSelfProfile && isAllowedRole && (
                    <div className="employer-details-hero-side">
                      <div className="employer-details-hero-actions">
                        <button
                          type="button"
                          className={`employer-details-hero-btn ${
                            connectionStatus === "pending"
                              ? "is-pending"
                              : connectionStatus === "friend"
                                ? "is-friend"
                                : ""
                          }`}
                          disabled={
                            sendingConnection || connectionStatus !== "none"
                          }
                          onClick={handleSendConnection}
                        >
                          <img
                            src={connectionActionIcon}
                            alt={connectionLabel}
                          />
                          <span>{connectionLabel}</span>
                        </button>
                        <button
                          type="button"
                          className="employer-details-hero-btn"
                          onClick={handleSendMessage}
                        >
                          <img src={messageIcon} alt="Message" />
                          <span>Message</span>
                        </button>
                      </div>
                      {mutualConnections.length > 0 && (
                        <div className="employer-details-mutuals">
                          <div className="employer-details-mutual-avatars">
                            {mutualConnections.slice(0, 4).map((item) => (
                              <img
                                key={item.id}
                                src={resolveProfileImage(item.profilePicture)}
                                alt={item.fullName}
                                title={item.fullName}
                                className={
                                  item.role === "recruiter"
                                    ? "employer-details-mutual-logo"
                                    : ""
                                }
                                onError={handleImageError}
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
                </>
              ) : (
                <>
                  <div className="employer-details-logo-skeleton"></div>
                  <div className="employer-details-company-text">
                    <h1>Company Details</h1>
                    <p>Find your desired company and get your dream job</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="employer-details-main-content">
        <div className="employer-details-container">
          {/* Loading State */}
          {loading && (
            <div className="employer-details-loading">
              <p>Loading company details...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && !isPrivateProfile && (
            <div className="employer-details-error">
              <p>{error}</p>
              <button
                onClick={() => navigate("/employers")}
                className="employer-details-btn-back"
              >
                Back to Companies
              </button>
            </div>
          )}

          {/* Company Content */}
          {!loading && !error && company && !isPrivateProfile && (
            <>
              <div className="employer-details-content-grid">
                {/* Left Column */}
                <div className="employer-details-content-left">
                  {/* Overview Section */}
                  <div className="employer-details-overview-section">
                    <h2>Overview</h2>
                    <div className="employer-details-overview-text">
                      {company.about ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: formatRichTextForDisplay(company.about),
                          }}
                        />
                      ) : (
                        <p>No company description available.</p>
                      )}
                    </div>
                  </div>

                  {/* Gallery Section */}
                  <div className="employer-details-gallery-section">
                    <h2>Life at {company.name}</h2>
                    <div className="employer-details-gallery-grid">
                      {company.workspaceImages &&
                      company.workspaceImages.length > 0 ? (
                        company.workspaceImages.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Life at ${company.name} ${index + 1}`}
                            className="employer-details-gallery-img"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/300x200?text=Workspace+Image";
                            }}
                          />
                        ))
                      ) : (
                        <p className="employer-details-no-gallery">
                          No workspace images available.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Sidebar */}
                <aside className="employer-details-sidebar">
                  <div className="employer-details-sidebar-card">
                    <div className="employer-details-sidebar-header">
                      <img
                        src={company.logo || defaultLogo}
                        alt={company.name}
                        className="employer-details-sidebar-logo"
                        onError={handleImageError}
                      />
                      <h3>{company.name}</h3>
                      {company.websiteUrl && (
                        <a
                          href={
                            company.websiteUrl.startsWith("http")
                              ? company.websiteUrl
                              : `https://${company.websiteUrl}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="employer-details-website-link"
                        >
                          Visit Website
                        </a>
                      )}
                    </div>

                    <div className="employer-details-divider"></div>

                    <div className="employer-details-sidebar-info">
                      <div className="employer-details-info-item">
                        <div className="employer-details-icon-box">
                          <img src={locationIcon} alt="Location" />
                        </div>
                        <div className="employer-details-info-text">
                          <span className="employer-details-info-label">
                            Location
                          </span>
                          <span className="employer-details-info-value">
                            {company.location || "Not specified"}
                          </span>
                        </div>
                      </div>

                      <div className="employer-details-info-item">
                        <div className="employer-details-icon-box">
                          <img src={sizeIcon} alt="Size" />
                        </div>
                        <div className="employer-details-info-text">
                          <span className="employer-details-info-label">
                            Company Size
                          </span>
                          <span className="employer-details-info-value">
                            {company.companySize || "Not specified"}
                          </span>
                        </div>
                      </div>

                      <div className="employer-details-info-item">
                        <div className="employer-details-icon-box">
                          <img src={emailIcon} alt="Email" />
                        </div>
                        <div className="employer-details-info-text">
                          <span className="employer-details-info-label">
                            Email
                          </span>
                          <span className="employer-details-info-value">
                            {company.email || "Not provided"}
                          </span>
                        </div>
                      </div>

                      <div className="employer-details-info-item">
                        <div className="employer-details-icon-box">
                          <img src={foundedIcon} alt="Founded" />
                        </div>
                        <div className="employer-details-info-text">
                          <span className="employer-details-info-label">
                            Founded
                          </span>
                          <span className="employer-details-info-value">
                            {company.foundedYear || "Not specified"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="employer-details-divider"></div>

                    {/* Connect with Us Section */}
                    <div className="employer-details-connect-section">
                      <h4>Connect with Us</h4>
                      <div className="employer-details-connect-buttons">
                        <button
                          className="employer-details-connect-btn facebook"
                          onClick={() =>
                            handleSocialLink(company.facebookUrl, "Facebook")
                          }
                        >
                          <img src={facebookIcon} alt="Facebook" />
                          <span>Facebook</span>
                        </button>
                        <button
                          className="employer-details-connect-btn linkedin"
                          onClick={() =>
                            handleSocialLink(company.linkedinUrl, "LinkedIn")
                          }
                        >
                          <img src={linkedinIcon} alt="LinkedIn" />
                          <span>LinkedIn</span>
                        </button>
                        <button
                          className="employer-details-connect-btn instagram"
                          onClick={() =>
                            handleSocialLink(company.instagramUrl, "Instagram")
                          }
                        >
                          <img src={instagramIcon} alt="Instagram" />
                          <span>Instagram</span>
                        </button>
                      </div>
                    </div>

                    {!isAdminViewer && (
                      <button
                        className="employer-details-send-message-btn"
                        onClick={handleSendMessage}
                      >
                        Send Message
                      </button>
                    )}
                  </div>
                </aside>
              </div>
              {/* Enhanced Reviews Section */}
              <div className="employer-details-reviews-section">
                <div className="employer-details-reviews-header">
                  <div>
                    <h2>Company Reviews</h2>
                    <div className="employer-details-overall-rating">
                      <div className="employer-details-rating-big">
                        {averageRating.toFixed(1)}
                      </div>
                      <div className="employer-details-rating-details">
                        <div className="employer-details-stars-large">
                          {renderStars(averageRating, "large")}
                        </div>
                        <span className="employer-details-review-count">
                          {reviews.length} reviews
                        </span>
                      </div>
                    </div>
                  </div>
                  {!isSelfProfile &&
                    (isLoggedIn ? (
                      <button
                        className="employer-details-write-review-btn"
                        onClick={handleOpenReviewForm}
                        disabled={isCheckingReview}
                      >
                        {isCheckingReview
                          ? "Checking..."
                          : existingReview
                            ? "Edit Your Review"
                            : "Write a Review"}
                      </button>
                    ) : (
                      <button
                        className="employer-details-write-review-btn"
                        onClick={() => {
                          navigate("/login", {
                            state: {
                              from: `/employers/${id}`,
                              message: "Please login to write a review",
                            },
                          });
                        }}
                      >
                        Login to Write Review
                      </button>
                    ))}
                </div>

                {/* My Review Quick Actions */}
                {isLoggedIn &&
                  existingReview &&
                  !showReviewForm &&
                  existingReview.text &&
                  !isPlaceholderText(existingReview.text) && (
                    <div className="employer-details-my-review">
                      <div className="employer-details-my-review-body"></div>
                    </div>
                  )}

                {/* All Reviews Section */}
                <div className="employer-details-all-reviews">
                  <div className="employer-details-all-reviews-header">
                    <h3>
                      All Reviews (
                      {
                        reviews.filter(
                          (review) =>
                            review.text && !isPlaceholderText(review.text),
                        ).length
                      }
                      )
                    </h3>
                    <button
                      className="employer-details-toggle-reviews-btn"
                      onClick={() => setShowAllReviews(!showAllReviews)}
                    >
                      {showAllReviews ? "Hide Reviews" : "Show Reviews"}
                      <span className="employer-details-toggle-icon">
                        {showAllReviews ? "▲" : "▼"}
                      </span>
                    </button>
                  </div>

                  {showAllReviews && (
                    <div className="employer-details-reviews-grid">
                      {reviews
                        .filter(
                          (review) =>
                            review.text && !isPlaceholderText(review.text),
                        )
                        .map((review) => (
                          <div
                            key={review.id}
                            className={`employer-details-review-card-small ${
                              expandedReviewId === review.id ? "expanded" : ""
                            }`}
                            onClick={() => toggleReviewExpansion(review.id)}
                          >
                            <div className="employer-details-review-header-small">
                              <div
                                className={`employer-details-reviewer-avatar-small ${
                                  review.reviewerUserType === "recruiter" ||
                                  review.reviewerRole?.toLowerCase() ===
                                    "recruiter"
                                    ? "employer-details-reviewer-avatar-small-logo"
                                    : ""
                                }`}
                              >
                                {review.reviewerAvatar ? (
                                  <img
                                    src={review.reviewerAvatar}
                                    alt={review.reviewerName}
                                    className={`employer-details-reviewer-avatar-img ${
                                      review.reviewerUserType === "recruiter" ||
                                      review.reviewerRole?.toLowerCase() ===
                                        "recruiter"
                                        ? "employer-details-reviewer-avatar-logo"
                                        : ""
                                    }`}
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                      e.currentTarget.parentElement!.innerHTML = `<span>${review.reviewerName.charAt(
                                        0,
                                      )}</span>`;
                                    }}
                                  />
                                ) : (
                                  <span>{review.reviewerName.charAt(0)}</span>
                                )}
                              </div>
                              <div className="employer-details-reviewer-info-small">
                                <span className="employer-details-reviewer-name-small">
                                  {review.reviewerName}
                                </span>
                                <span className="employer-details-reviewer-location-small">
                                  {review.reviewerLocation}
                                </span>
                              </div>
                              <div className="employer-details-review-rating-small">
                                {renderStars(review.rating, "small")}
                              </div>
                            </div>

                            {/* Show preview text when not expanded */}
                            {expandedReviewId !== review.id && (
                              <p className="employer-details-review-preview-small">
                                {getPreviewText(review.text)}
                              </p>
                            )}

                            {/* Show full text when expanded */}
                            {expandedReviewId === review.id && (
                              <p className="employer-details-review-text-small">
                                {review.text}
                              </p>
                            )}

                            <div className="employer-details-review-footer-small">
                              <span className="employer-details-review-date-small">
                                {review.date}
                              </span>
                              <span
                                className={
                                  expandedReviewId === review.id
                                    ? "employer-details-read-less"
                                    : "employer-details-read-more"
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleReviewExpansion(review.id);
                                }}
                              >
                                {expandedReviewId === review.id
                                  ? "Show less"
                                  : "Read more"}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Write Review Form - Full Width */}
                {!isSelfProfile && showReviewForm && (
                  <div className="employer-details-write-review-form-wrapper full-width">
                    <div className="employer-details-write-review-content full-width">
                      <div className="employer-details-write-review-form">
                        {isLoggedIn ? (
                          // User is logged in - show review form
                          <>
                            <h3>
                              {existingReview
                                ? "Edit Your Review"
                                : "Share Your Experience"}
                            </h3>
                            <p>
                              {existingReview
                                ? `Update your review for ${company.name}`
                                : `Help others make informed decisions about working at ${company.name}`}
                            </p>

                            {reviewError && (
                              <div
                                className={`employer-details-review-${
                                  reviewError.includes("successfully")
                                    ? "success"
                                    : "error"
                                }`}
                              >
                                {reviewError}
                              </div>
                            )}

                            <div className="employer-details-form-group">
                              <label>Overall Rating *</label>
                              <div className="employer-details-star-input">
                                {renderRatingStars()}
                                <span className="employer-details-rating-text-input">
                                  {newReview.rating || hoveredRating || 0} out
                                  of 5
                                </span>
                              </div>
                            </div>

                            <div className="employer-details-form-group">
                              <label>Your Review *</label>
                              <textarea
                                placeholder="Tell us more about the pros and cons.. What did you like? What could be improved?"
                                className="employer-details-review-textarea"
                                rows={5}
                                value={newReview.description}
                                onChange={(e) =>
                                  setNewReview({
                                    ...newReview,
                                    description: e.target.value,
                                  })
                                }
                              />
                              <div className="employer-details-review-hint">
                                Be honest and specific about your experience
                              </div>
                            </div>

                            <div className="employer-details-form-actions">
                              <button
                                className="employer-details-submit-review-btn"
                                onClick={
                                  existingReview
                                    ? handleUpdateReview
                                    : handleSubmitReview
                                }
                                disabled={submittingReview}
                              >
                                {submittingReview
                                  ? "Submitting..."
                                  : existingReview
                                    ? "Update Review"
                                    : "Submit Review"}
                              </button>
                              {existingReview && (
                                <button
                                  className="employer-details-delete-review-btn"
                                  onClick={handleDeleteReview}
                                  disabled={submittingReview}
                                >
                                  {submittingReview ? "Deleting..." : "Delete Review"}
                                </button>
                              )}
                              <button
                                className="employer-details-cancel-review-btn"
                                onClick={() => {
                                  setShowReviewForm(false);
                                  setReviewError(null);
                                }}
                                disabled={submittingReview}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          // User is NOT logged in - show login prompt
                          <div className="employer-details-login-prompt">
                            <h3>Login Required</h3>
                            <p>
                              Please login to submit a review for {company.name}
                            </p>
                            <button
                              className="employer-details-login-btn"
                              onClick={() => {
                                navigate("/login", {
                                  state: {
                                    from: `/employers/${id}`,
                                    message: "Please login to write a review",
                                  },
                                });
                              }}
                            >
                              Login Now
                            </button>
                            <button
                              className="employer-details-cancel-review-btn"
                              onClick={() => setShowReviewForm(false)}
                              style={{
                                marginTop: "10px",
                                display: "block",
                                width: "100%",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="employer-details-review-illustration">
                        <img
                          src={reviewIllustration}
                          alt="Review Illustration"
                          className="employer-details-illustration-img"
                        />
                        <p className="employer-details-illustration-text">
                          Your review helps others find their perfect workplace
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {!loading && isPrivateProfile && company && (
            <div className="employer-details-loading">
              <p>
                {privateNotice ||
                  "This employer profile is private. Only basic profile information is visible."}
              </p>
            </div>
          )}

          {/* Jobs Section */}
          {!loading && !error && !isPrivateProfile && (
            <div className="employer-details-jobs-section">
              <div className="employer-details-jobs-header">
                <h2>Current Openings at {company?.name || "Company"}</h2>
                <button
                  onClick={handleExploreMore}
                  className="employer-details-explore-more"
                >
                  Explore More Jobs
                </button>
              </div>

              {jobsLoading && (
                <div className="employer-details-jobs-state">
                  Loading openings...
                </div>
              )}
              {jobsError && !jobsLoading && (
                <div className="employer-details-jobs-state">{jobsError}</div>
              )}
              {!jobsLoading && !jobsError && jobs.length === 0 && (
                <div className="employer-details-jobs-state">
                  No current openings for this company.
                </div>
              )}
              {!jobsLoading && !jobsError && jobs.length > 0 && (
                <div className="employer-details-jobs-grid employer-details-jobs-grid-compact">
                  {jobs.slice(0, 3).map((job) => (
                    <article key={job.id} className="joblist-card-item">
                      <div className="joblist-card-top">
                        <img
                          src={job.logo}
                          alt={job.company}
                          className="joblist-company-logo"
                          onError={handleImageError}
                        />
                        {!isAdminViewer && (
                          <div className="joblist-card-actions">
                            {userRole === "candidate" && (
                              <button
                                className="joblist-icon-btn"
                                onClick={() => toggleSaveJob(job.id)}
                              >
                                <img
                                  src={
                                    savedJobs[job.id]
                                      ? jobCardSavedBookmarkIcon
                                      : jobCardBookmarkIcon
                                  }
                                  alt="Bookmark"
                                />
                              </button>
                            )}
                            <button className="joblist-icon-btn">
                              <img src={jobCardShareIcon} alt="Share" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="joblist-card-company">{job.company}</div>
                      <div className="joblist-card-meta">
                        <img src={jobCardWorkModeIcon} alt="Work mode" />
                        {formatWorkMode(job.workMode)}
                      </div>
                      <h3 className="joblist-card-title">{job.title}</h3>
                      <div className="joblist-card-info">
                        <span>
                          <img src={jobCardLocationIcon} alt="Location" />
                          {job.location}
                        </span>
                        <span>
                          <img src={jobCardTypeIcon} alt="Job type" />
                          {job.type}
                        </span>
                      </div>
                      <div className="joblist-card-buttons">
                        <button
                          className="joblist-btn-outline"
                          onClick={() => handleViewDetails(job.id)}
                        >
                          View Details
                        </button>
                        {!isAdminViewer &&
                          (userRole === "candidate" || !userRole) && (
                            <button
                              className={`joblist-btn-primary ${
                                userRole === "candidate" && appliedJobs[job.id]
                                  ? "joblist-btn-applied"
                                  : ""
                              }`}
                              onClick={() => handleApplyNow(job)}
                              disabled={
                                userRole === "candidate" && appliedJobs[job.id]
                              }
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
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EmployerDetailsPage;



