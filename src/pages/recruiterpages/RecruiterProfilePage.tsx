import PortalFooter from "../../components/PortalFooter";
// RecruiterProfilePage.tsx - Updated with dynamic reviews management
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import RecruiterSidebar from "../../components/recruitercomponents/RecruiterSidebar";
import RecruiterTopBar from "../../components/recruitercomponents/RecruiterTopBar";
import RecruiterProfilePictureEditor from "../../components/recruitercomponents/RecruiterProfilePictureEditor";
import RecruiterPersonalInfoEditor from "../../components/recruitercomponents/RecruiterPersonalInfoEditor";
import RecruiterWebsiteEditor from "../../components/recruitercomponents/RecruiterWebsiteEditor";
import "../../styles/RecruiterProfilePage.css";
import "../../styles/RecruiterPersonalInfoEditor.css";
import RecruiterAboutCompanyEditor from "../../components/recruitercomponents/RecruiterAboutCompanyEditor";
import RecruiterWorkspaceGalleryEditor from "../../components/recruitercomponents/RecruiterWorkspaceGalleryEditor";

// Import images
import cameraIcon from "../../images/Recruiter Profile Page Images/cameraIcon.svg";
import phoneIcon from "../../images/Recruiter Profile Page Images/phoneIcon.svg";
import infoIcon from "../../images/Recruiter Profile Page Images/6_27.svg";
import companyIcon from "../../images/Recruiter Profile Page Images/6_171.svg";
import locationIcon from "../../images/Recruiter Profile Page Images/6_180.svg";
import sizeIcon from "../../images/Recruiter Profile Page Images/6_189.svg";
import emailIcon from "../../images/Recruiter Profile Page Images/6_200.svg";
import foundedIcon from "../../images/Recruiter Profile Page Images/6_208.svg";
import editIcon1 from "../../images/Recruiter Profile Page Images/6_215.svg";
import editIcon2 from "../../images/Recruiter Profile Page Images/6_223.svg";
import websiteIcon from "../../images/Recruiter Profile Page Images/6_229.svg";
import linkedinIcon from "../../images/Recruiter Profile Page Images/6_237.svg";
import instagramIcon from "../../images/Recruiter Profile Page Images/6_245.svg";
import facebookIcon from "../../images/Recruiter Profile Page Images/6_253.svg";
import editIcon3 from "../../images/Recruiter Profile Page Images/6_344.svg";
import editIcon4 from "../../images/Recruiter Profile Page Images/6_353.svg";
import uploadGalleryIcon from "../../images/Recruiter Profile Page Images/6_274.svg";
import starIcon from "../../images/Recruiter Profile Page Images/6_55.svg";
import starFilledIcon from "../../images/Recruiter Profile Page Images/6_55.svg";
import hideIcon from "../../images/Recruiter Profile Page Images/6_75.svg";
import deleteIcon from "../../images/Recruiter Profile Page Images/6_80.svg";
import showIcon from "../../images/Recruiter Profile Page Images/6_112.svg";
import loadMoreIcon from "../../images/Recruiter Profile Page Images/6_161.svg";
import defaultAvatar from "../../images/Register Page Images/Default Profile.webp";

interface WorkspaceImage {
  _id: string;
  imageUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  order: number;
}

// Define Review Interface
interface Review {
  id: string;
  rating: number;
  text: string;
  title: string;
  reviewerName: string;
  reviewerLocation: string;
  reviewerRole: string;
  date: string;
  reviewerAvatar: string;
  status: "published" | "hidden";
}

// Define User Profile Interface
interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phone: string;
  address: string;
  about: string;
  currentJobTitle?: string;
  profileVisibility?: "public" | "private";
  profilePicture: string;
  createdAt: string;
  companySize: string;
  foundedYear: string;
  updatedAt: string;
  websiteUrl: string;
  linkedinUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  workspaceImages: WorkspaceImage[];
}

const RecruiterProfilePage: React.FC = () => {
  const navigate = useNavigate();

  // State for user profile data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfilePictureEditorOpen, setIsProfilePictureEditorOpen] =
    useState(false);
  const [isPersonalInfoEditorOpen, setIsPersonalInfoEditorOpen] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isWebsiteEditorOpen, setIsWebsiteEditorOpen] = useState(false);
  const [isAboutCompanyEditorOpen, setIsAboutCompanyEditorOpen] =
    useState(false);
  const [isWorkspaceGalleryEditorOpen, setIsWorkspaceGalleryEditorOpen] =
    useState(false);

  // State for reviews management
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewCounts, setReviewCounts] = useState({
    all: 0,
    published: 0,
    hidden: 0,
  });
  const [activeTab, setActiveTab] = useState<"all" | "published" | "hidden">(
    "all",
  );
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  // Fetch user profile data
  const fetchUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("authToken");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profile/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setUserProfile(data.user);

      // Update localStorage with user data
      if (data.user) {
        const minimalUserData = {
          id: data.user.id,
          fullName: data.user.fullName,
          email: data.user.email,
          role: data.user.role,
          companySize: data.user.companySize,
          foundedYear: data.user.foundedYear,
        };
        localStorage.setItem("userData", JSON.stringify(minimalUserData));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Fetch reviews for the company
  const fetchReviews = useCallback(
    async (page = 1, tab = activeTab, reset = false) => {
      if (!userProfile?.id) return;

      try {
        setIsLoadingReviews(true);
        const token = localStorage.getItem("authToken");

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/reviews/company/${userProfile.id}/manage?status=${tab}&page=${page}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (reset) {
            setReviews(data.reviews || []);
          } else {
            setReviews((prev) => [...prev, ...(data.reviews || [])]);
          }
          setReviewCounts(data.counts || { all: 0, published: 0, hidden: 0 });
          setHasMoreReviews((data.reviews || []).length > 0);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setIsLoadingReviews(false);
      }
    },
    [userProfile?.id, activeTab],
  );

  // Handle tab change
  const handleTabChange = (tab: "all" | "published" | "hidden") => {
    setActiveTab(tab);
    setReviewPage(1);
    setHasMoreReviews(true);
    fetchReviews(1, tab, true);
  };

  // Handle load more reviews
  const handleLoadMoreReviews = () => {
    const nextPage = reviewPage + 1;
    setReviewPage(nextPage);
    fetchReviews(nextPage, activeTab, false);
  };

  // Handle review status update (hide/show)
  const handleUpdateReviewStatus = async (
    reviewId: string,
    status: "published" | "hidden",
  ) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/reviews/${reviewId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      if (response.ok) {
        // Update local state
        setReviews((prev) =>
          prev.map((review) =>
            review.id === reviewId ? { ...review, status } : review,
          ),
        );

        // Update counts
        setReviewCounts((prev) => {
          const newCounts = { ...prev };
          if (status === "published") {
            newCounts.published += 1;
            newCounts.hidden -= 1;
          } else {
            newCounts.published -= 1;
            newCounts.hidden += 1;
          }
          return newCounts;
        });

        // Refresh reviews list
        fetchReviews(1, activeTab, true);
      } else {
        console.error("Failed to update review status");
      }
    } catch (error) {
      console.error("Error updating review status:", error);
    }
  };

  // Handle review deletion
  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/reviews/${reviewId}/manage`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        // Remove from local state
        setReviews((prev) => prev.filter((review) => review.id !== reviewId));

        // Update counts
        setReviewCounts((prev) => {
          const deletedReview = reviews.find((r) => r.id === reviewId);
          const newCounts = { ...prev };
          newCounts.all -= 1;
          if (deletedReview?.status === "published") {
            newCounts.published -= 1;
          } else {
            newCounts.hidden -= 1;
          }
          return newCounts;
        });

        // Refresh reviews list
        fetchReviews(1, activeTab, true);
      } else {
        console.error("Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  // Fetch profile on component mount and refresh
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile, refreshTrigger]);

  // Fetch reviews when user profile is loaded or tab changes
  useEffect(() => {
    if (userProfile?.id) {
      fetchReviews(1, activeTab, true);
    }
  }, [userProfile?.id, activeTab, fetchReviews]);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    const userDataStr = localStorage.getItem("userData");
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        if (userData.role !== "recruiter") {
          navigate(`/${userData.role}-profile`);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, [navigate]);

  // Handle profile picture save
  const handleSaveProfilePicture = async (data: {
    imageFile?: File | null;
    profileVisibility: "public" | "private";
  }) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      const profileSettingsResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/profile/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            profileVisibility: data.profileVisibility,
          }),
        },
      );

      if (!profileSettingsResponse.ok) {
        const errorData = await profileSettingsResponse.json();
        throw new Error(errorData.message || "Failed to update profile settings");
      }

      if (data.imageFile !== undefined) {
        if (data.imageFile) {
          const formData = new FormData();
          formData.append("profilePicture", data.imageFile);

          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/profile/me/picture`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            },
          );

          const responseData = await response.json();

          if (!response.ok) {
            throw new Error(
              responseData.message || "Failed to upload profile picture",
            );
          }
        } else {
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/profile/me/picture`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            },
          );

          if (!response.ok) {
            throw new Error("Failed to remove profile picture");
          }
        }
      }

      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);
      window.dispatchEvent(new CustomEvent("profileUpdated"));
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile picture. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePersonalInfo = async (data: {
    fullName: string;
    phone: string;
    address: string;
    companySize: string;
    foundedYear: string;
  }): Promise<void> => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: data.fullName,
          phone: data.phone || "",
          address: data.address || "",
          companySize: data.companySize || "",
          foundedYear: data.foundedYear || "",
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("API Error:", responseData);
        throw new Error(
          responseData.message || "Failed to update company information",
        );
      }

      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);
      window.dispatchEvent(new CustomEvent("profileUpdated"));
    } catch (error) {
      console.error("Error saving company information:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWebsiteInfo = async (data: {
    websiteUrl: string;
    linkedinUrl: string;
    instagramUrl: string;
    facebookUrl: string;
  }): Promise<void> => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          websiteUrl: data.websiteUrl || "",
          linkedinUrl: data.linkedinUrl || "",
          instagramUrl: data.instagramUrl || "",
          facebookUrl: data.facebookUrl || "",
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("API Error:", responseData);
        throw new Error(
          responseData.message || "Failed to update website information",
        );
      }

      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);
      window.dispatchEvent(new CustomEvent("profileUpdated"));
    } catch (error) {
      console.error("Error saving website information:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format URLs for display
  const formatUrlForDisplay = (url: string): string => {
    if (!url) return "";
    return url.replace(/^(https?:\/\/)?(www\.)?/, "");
  };

  const handleSaveAboutCompany = async (aboutText: string): Promise<void> => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          about: aboutText || "",
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("API Error:", responseData);
        throw new Error(
          responseData.message || "Failed to update company description",
        );
      }

      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);
      window.dispatchEvent(new CustomEvent("profileUpdated"));
    } catch (error) {
      console.error("Error saving company description:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWorkspaceGallery = async (data: {
    uploadedImages: File[];
    deletedImageIds: string[];
    reorderedImageIds: string[];
  }): Promise<void> => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      // Handle deletions first
      for (const imageId of data.deletedImageIds) {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/workspace/image/${imageId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete image");
        }
      }

      // Handle uploads
      for (const imageFile of data.uploadedImages) {
        const formData = new FormData();
        formData.append("workspaceImage", imageFile);

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/workspace/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to upload image");
        }
      }

      // Handle reordering if there are existing images
      if (data.reorderedImageIds.length > 0) {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/workspace/reorder`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              imageOrder: data.reorderedImageIds,
            }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to reorder images");
        }
      }

      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);
      window.dispatchEvent(new CustomEvent("profileUpdated"));
    } catch (error) {
      console.error("Error saving workspace gallery:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get workspace image URL
  const getWorkspaceImageUrl = (imageUrl: string) => {
    if (!imageUrl) {
      return "";
    }

    let finalUrl = imageUrl;

    if (!imageUrl.startsWith("/uploads") && !imageUrl.startsWith("http")) {
      finalUrl = `/uploads/workspaceimages/${imageUrl}`;
    }

    if (
      imageUrl.startsWith("/uploads/") &&
      !imageUrl.includes("workspaceimages")
    ) {
      finalUrl = `/uploads/workspaceimages/${imageUrl.split("/").pop()}`;
    }

    return `${import.meta.env.VITE_BACKEND_URL}${finalUrl}?t=${Date.now()}`;
  };

  const formatRichTextForDisplay = (content: string) => {
    if (!content) return "";
    const hasHtmlTag = /<\/?[a-z][\s\S]*>/i.test(content);
    return hasHtmlTag ? content : content.replace(/\n/g, "<br />");
  };

  // Helper function to safely render HTML content
  const renderAboutContent = (content: string) => {
    if (!content) {
      return (
        <p className="recruiter-profile-about-text">
          No company description provided. Click edit to add information about
          your company.
        </p>
      );
    }

    return (
      <div
        className="recruiter-profile-about-content"
        dangerouslySetInnerHTML={{ __html: formatRichTextForDisplay(content) }}
      />
    );
  };

  // Get profile image URL
  const getProfileImageUrl = () => {
    if (!userProfile) {
      return defaultAvatar;
    }

    if (
      !userProfile.profilePicture ||
      userProfile.profilePicture.trim() === ""
    ) {
      return defaultAvatar;
    }

    if (userProfile.profilePicture.startsWith("http")) {
      const separator = userProfile.profilePicture.includes("?") ? "&" : "?";
      return `${userProfile.profilePicture}${separator}t=${Date.now()}`;
    }

    return `${import.meta.env.VITE_BACKEND_URL}${userProfile.profilePicture}?t=${Date.now()}`;
  };

  const handlePostJob = () => {
    navigate("/recruiter/job-postings");
  };

  const handleSearch = (query: string) => {
    console.log("Search query:", query);
  };

  const handleToggleProfileVisibility = async () => {
    if (!userProfile) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    const nextVisibility =
      userProfile.profileVisibility === "private" ? "public" : "private";

    try {
      setIsUpdatingVisibility(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profileVisibility: nextVisibility,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to update profile visibility");
      }

      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              profileVisibility: nextVisibility,
            }
          : prev,
      );
    } catch (error) {
      console.error("Error updating profile visibility:", error);
      alert("Failed to update profile visibility. Please try again.");
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  // Handle edit profile picture click
  const handleEditProfilePicture = () => {
    setIsProfilePictureEditorOpen(true);
  };

  // Render stars for reviews
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <img
          key={i}
          src={i <= rating ? starFilledIcon : starIcon}
          alt="star"
        />,
      );
    }
    return stars;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="recruiter-profile-page-container">
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recruiter-profile-page-container">
      <div className="recruiter-profile-layout">
        {/* Recruiter Sidebar */}
        <RecruiterSidebar />

        {/* Main Content Area */}
        <div className="recruiter-profile-main-area">
          {/* Top Bar */}
          <div className="recruiter-profile-topbar-wrapper">
            <RecruiterTopBar
              onPostJob={handlePostJob}
              onSearch={handleSearch}
            />
          </div>

          {/* Scrollable Content */}
          <div className="recruiter-profile-scrollable-content">
            <div className="recruiter-profile-content-wrapper">
              <div className="recruiter-profile-page-header">
                <div className="recruiter-profile-page-header-left">
                  <h1>Company Profile</h1>
                  <p>
                    Manage your company branding details visible to candidates
                  </p>
                </div>
                <div className="recruiter-profile-page-header-right">
                  <div className="recruiter-profile-visibility-toggle-card">
                    <span className="recruiter-profile-visibility-label">
                      Public Profile:{" "}
                      {userProfile?.profileVisibility === "private" ? "Off" : "On"}
                    </span>
                    <button
                      type="button"
                      className="recruiter-profile-visibility-toggle-btn"
                      onClick={handleToggleProfileVisibility}
                      disabled={isUpdatingVisibility}
                      aria-label={
                        userProfile?.profileVisibility === "private"
                          ? "Turn on public profile"
                          : "Turn off public profile"
                      }
                    >
                      {userProfile?.profileVisibility === "private" ? (
                        <svg
                          width="56"
                          height="30"
                          viewBox="0 0 56 30"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect width="56" height="30" rx="15" fill="#E5E7EB" />
                          <circle cx="17" cy="15" r="10" fill="white" />
                        </svg>
                      ) : (
                        <svg
                          width="56"
                          height="30"
                          viewBox="0 0 56 30"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect width="56" height="30" rx="15" fill="#0068CE" />
                          <circle cx="39" cy="15" r="10" fill="white" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Logo Card */}
              <div className="recruiter-profile-card recruiter-profile-logo-card">
                <div
                  className="recruiter-profile-logo-placeholder"
                  onClick={handleEditProfilePicture}
                >
                  {userProfile?.profilePicture ? (
                    <img
                      src={getProfileImageUrl()}
                      alt="Company Logo"
                      className="recruiter-profile-logo-img"
                      onError={(e) => {
                        e.currentTarget.src = defaultAvatar;
                      }}
                    />
                  ) : (
                    <div className="recruiter-profile-logo-upload-icon">
                      <img src={cameraIcon} alt="Upload Logo" />
                    </div>
                  )}
                </div>
                <div className="recruiter-profile-logo-info">
                  <h3>Company Logo</h3>
                  <p>
                    This logo will be displayed on your company profile, job
                    posts and search results. Use a high-quality square image
                    (400Ã—400px recommended)
                  </p>
                  <div className="recruiter-profile-logo-actions">
                    <button
                      className="recruiter-profile-btn-outline"
                      onClick={handleEditProfilePicture}
                    >
                      <img src={cameraIcon} alt="Upload" />
                      <span>
                        {userProfile?.profilePicture
                          ? "Change Logo"
                          : "Upload Logo"}
                      </span>
                    </button>
                    {userProfile?.profilePicture && (
                      <button
                        className="recruiter-profile-btn-text-danger"
                        onClick={() =>
                          handleSaveProfilePicture({
                            imageFile: null,
                            profileVisibility:
                              userProfile?.profileVisibility || "public",
                          })
                        }
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                  <div className="recruiter-profile-logo-hint">
                    <img src={infoIcon} alt="Info" />
                    <span>Recommended: 400Ã—400px (JPG, PNG). Max Size 2MB</span>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="recruiter-profile-info-grid">
                {/* Left Column */}
                <div className="recruiter-profile-grid-column">
                  {/* Basic Information Card */}
                  <div className="recruiter-profile-card">
                    <div className="recruiter-profile-card-header">
                      <h3>Basic Information</h3>
                      <img
                        src={editIcon1}
                        alt="Edit"
                        className="recruiter-profile-edit-icon"
                        onClick={() => setIsPersonalInfoEditorOpen(true)}
                        style={{ cursor: "pointer" }}
                      />
                    </div>

                    {/* Company Name - Full width */}
                    <div className="recruiter-profile-form-group">
                      <div className="recruiter-profile-input-wrapper">
                        <img src={companyIcon} alt="Company" />
                        <label>Company Name</label>
                      </div>
                      <input
                        type="text"
                        value={
                          userProfile?.fullName || "No company name provided"
                        }
                        className="recruiter-profile-form-input"
                        readOnly
                      />
                    </div>

                    {/* First Row: Location and Company Size */}
                    <div className="recruiter-profile-form-row">
                      {/* Location */}
                      <div className="recruiter-profile-form-group half">
                        <div className="recruiter-profile-input-wrapper">
                          <img src={locationIcon} alt="Location" />
                          <label>Location</label>
                        </div>
                        <input
                          type="text"
                          value={userProfile?.address || "No address provided"}
                          className="recruiter-profile-form-input"
                          readOnly
                        />
                      </div>

                      {/* Company Size */}
                      <div className="recruiter-profile-form-group half">
                        <div className="recruiter-profile-input-wrapper">
                          <img src={sizeIcon} alt="Size" />
                          <label>Company Size</label>
                        </div>
                        <input
                          type="text"
                          value={userProfile?.companySize || "Not specified"}
                          className="recruiter-profile-form-input"
                          readOnly
                        />
                      </div>
                    </div>

                    {/* Second Row: Email and Founded Year */}
                    <div className="recruiter-profile-form-row">
                      {/* Email - Takes more space */}
                      <div className="recruiter-profile-form-group email-field">
                        <div className="recruiter-profile-input-wrapper">
                          <img src={emailIcon} alt="Email" />
                          <label>Company Email</label>
                        </div>
                        <input
                          type="text"
                          value={userProfile?.email || "No email provided"}
                          className="recruiter-profile-form-input"
                          readOnly
                        />
                      </div>

                      {/* Founded Year - Takes less space */}
                      <div className="recruiter-profile-form-group year-field">
                        <div className="recruiter-profile-input-wrapper">
                          <img src={foundedIcon} alt="Founded" />
                          <label>Founded Year</label>
                        </div>
                        <input
                          type="text"
                          value={userProfile?.foundedYear || "Not specified"}
                          className="recruiter-profile-form-input"
                          readOnly
                        />
                      </div>
                    </div>

                    {/* Phone (Full width, conditional) */}
                    {userProfile?.phone && (
                      <div className="recruiter-profile-form-group">
                        <div className="recruiter-profile-input-wrapper">
                          <img src={phoneIcon} alt="Phone" />
                          <label>Phone Number</label>
                        </div>
                        <input
                          type="text"
                          value={userProfile.phone}
                          className="recruiter-profile-form-input"
                          readOnly
                        />
                      </div>
                    )}
                  </div>

                  {/* About Company */}
                  <div className="recruiter-profile-card">
                    <div className="recruiter-profile-card-header">
                      <h3>About Company</h3>
                      <img
                        src={editIcon3}
                        alt="Edit"
                        className="recruiter-profile-edit-icon"
                        onClick={() => setIsAboutCompanyEditorOpen(true)}
                        style={{ cursor: "pointer" }}
                      />
                    </div>
                    {renderAboutContent(userProfile?.about || "")}
                  </div>
                </div>

                {/* Right Column */}
                <div className="recruiter-profile-grid-column">
                  {/* Website and Contacts Card */}
                  <div className="recruiter-profile-card">
                    <div className="recruiter-profile-card-header">
                      <h3>Website and Contacts</h3>
                      <img
                        src={editIcon2}
                        alt="Edit"
                        className="recruiter-profile-edit-icon"
                        onClick={() => setIsWebsiteEditorOpen(true)}
                        style={{ cursor: "pointer" }}
                      />
                    </div>

                    {/* Website URL */}
                    <div className="recruiter-profile-form-group">
                      <div className="recruiter-profile-input-wrapper">
                        <img src={websiteIcon} alt="Website" />
                        <label>Website URL</label>
                      </div>
                      <input
                        type="text"
                        value={
                          userProfile?.websiteUrl
                            ? formatUrlForDisplay(userProfile.websiteUrl)
                            : "No website provided"
                        }
                        className="recruiter-profile-form-input"
                        readOnly
                      />
                    </div>

                    {/* LinkedIn URL */}
                    <div className="recruiter-profile-form-group">
                      <div className="recruiter-profile-input-wrapper">
                        <img src={linkedinIcon} alt="LinkedIn" />
                        <label>LinkedIn URL</label>
                      </div>
                      <input
                        type="text"
                        value={
                          userProfile?.linkedinUrl
                            ? formatUrlForDisplay(userProfile.linkedinUrl)
                            : "No LinkedIn provided"
                        }
                        className="recruiter-profile-form-input"
                        readOnly
                      />
                    </div>

                    {/* Instagram URL */}
                    <div className="recruiter-profile-form-group">
                      <div className="recruiter-profile-input-wrapper">
                        <img src={instagramIcon} alt="Instagram" />
                        <label>Instagram URL</label>
                      </div>
                      <input
                        type="text"
                        value={
                          userProfile?.instagramUrl
                            ? formatUrlForDisplay(userProfile.instagramUrl)
                            : "No Instagram provided"
                        }
                        className="recruiter-profile-form-input"
                        readOnly
                      />
                    </div>

                    {/* Facebook URL */}
                    <div className="recruiter-profile-form-group">
                      <div className="recruiter-profile-input-wrapper">
                        <img src={facebookIcon} alt="Facebook" />
                        <label>Facebook URL</label>
                      </div>
                      <input
                        type="text"
                        value={
                          userProfile?.facebookUrl
                            ? formatUrlForDisplay(userProfile.facebookUrl)
                            : "No Facebook provided"
                        }
                        className="recruiter-profile-form-input"
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Workplace Gallery */}
                  <div className="recruiter-profile-card">
                    <div className="recruiter-profile-card-header">
                      <h3>Workplace Gallery</h3>
                      <img
                        src={editIcon4}
                        alt="Edit"
                        className="recruiter-profile-edit-icon"
                        onClick={() => setIsWorkspaceGalleryEditorOpen(true)}
                        style={{ cursor: "pointer" }}
                      />
                    </div>
                    <div className="recruiter-profile-gallery-grid">
                      {userProfile?.workspaceImages &&
                      userProfile.workspaceImages.length > 0 ? (
                        [...userProfile.workspaceImages]
                          .sort((a, b) => a.order - b.order)
                          .slice(0, 4)
                          .map((image, index) => {
                            const imageUrl = getWorkspaceImageUrl(
                              image.imageUrl,
                            );
                            return (
                              <div
                                key={image._id}
                                className="recruiter-profile-gallery-item"
                              >
                                <img
                                  src={imageUrl}
                                  alt={`Workspace ${index + 1}`}
                                  className="recruiter-profile-gallery-img"
                                  onError={(e) => {
                                    console.error(
                                      "Failed to load workspace image:",
                                      {
                                        imageUrl,
                                        originalUrl: image.imageUrl,
                                        error: e,
                                      },
                                    );
                                    e.currentTarget.src = `https://via.placeholder.com/300x200?text=Workspace+${
                                      index + 1
                                    }`;
                                    e.currentTarget.alt = `Failed to load workspace image ${
                                      index + 1
                                    }`;
                                  }}
                                  onLoad={() =>
                                    console.log(
                                      `Successfully loaded workspace image ${
                                        index + 1
                                      }`,
                                    )
                                  }
                                />
                              </div>
                            );
                          })
                      ) : (
                        <>
                          <div
                            className="recruiter-profile-upload-box"
                            onClick={() =>
                              setIsWorkspaceGalleryEditorOpen(true)
                            }
                          >
                            <img src={uploadGalleryIcon} alt="Upload" />
                            <span>Upload</span>
                          </div>
                          <div
                            className="recruiter-profile-upload-box"
                            onClick={() =>
                              setIsWorkspaceGalleryEditorOpen(true)
                            }
                          >
                            <img src={uploadGalleryIcon} alt="Upload" />
                            <span>Upload</span>
                          </div>
                        </>
                      )}

                      {/* Show count if there are more than 4 images */}
                      {userProfile?.workspaceImages &&
                        userProfile.workspaceImages.length > 4 && (
                          <div
                            className="recruiter-profile-more-images"
                            onClick={() =>
                              setIsWorkspaceGalleryEditorOpen(true)
                            }
                            style={{ cursor: "pointer" }}
                          >
                            <span>
                              +{userProfile.workspaceImages.length - 4} more
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviews Management */}
              <div className="recruiter-profile-card recruiter-profile-reviews-card">
                <div className="recruiter-profile-reviews-header">
                  <h3>Company Reviews Management</h3>
                  <div className="recruiter-profile-tabs">
                    <button
                      className={`recruiter-profile-tab ${
                        activeTab === "all" ? "active" : ""
                      }`}
                      onClick={() => handleTabChange("all")}
                    >
                      All Reviews ({reviewCounts.all})
                    </button>
                    <button
                      className={`recruiter-profile-tab ${
                        activeTab === "published" ? "active" : ""
                      }`}
                      onClick={() => handleTabChange("published")}
                    >
                      Published ({reviewCounts.published})
                    </button>
                    <button
                      className={`recruiter-profile-tab ${
                        activeTab === "hidden" ? "active" : ""
                      }`}
                      onClick={() => handleTabChange("hidden")}
                    >
                      Hidden ({reviewCounts.hidden})
                    </button>
                  </div>
                </div>

                {isLoadingReviews ? (
                  <div className="recruiter-profile-reviews-loading">
                    <p>Loading reviews...</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="recruiter-profile-no-reviews">
                    <p>No reviews found.</p>
                  </div>
                ) : (
                  <div className="recruiter-profile-reviews-list">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="recruiter-profile-review-item"
                      >
                        <div className="recruiter-profile-review-content">
                          <div className="recruiter-profile-review-meta">
                            <div className="recruiter-profile-stars">
                              {renderStars(review.rating)}
                              <span className="recruiter-profile-rating-text">
                                {review.rating} out of 5
                              </span>
                            </div>
                            <span className="recruiter-profile-review-date">
                              Posted on {review.date}
                            </span>
                          </div>
                          <p className="recruiter-profile-review-text">
                            {review.text}
                          </p>
                          <div className="recruiter-profile-reviewer-info">
                            <img
                              src={review.reviewerAvatar || defaultAvatar}
                              alt="Avatar"
                              className="recruiter-profile-avatar"
                              onError={(e) => {
                                e.currentTarget.src = defaultAvatar;
                              }}
                            />
                            <div className="recruiter-profile-reviewer-details">
                              <span className="recruiter-profile-reviewer-name">
                                {review.reviewerName}
                              </span>
                              <span className="recruiter-profile-reviewer-role">
                                {review.reviewerRole}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="recruiter-profile-review-actions">
                          {review.status === "published" ? (
                            <button
                              className="recruiter-profile-btn-action"
                              onClick={() =>
                                handleUpdateReviewStatus(review.id, "hidden")
                              }
                            >
                              <img src={hideIcon} alt="Hide" />
                              <span>Hide Review</span>
                            </button>
                          ) : (
                            <button
                              className="recruiter-profile-btn-action success"
                              onClick={() =>
                                handleUpdateReviewStatus(review.id, "published")
                              }
                            >
                              <img src={showIcon} alt="Show" />
                              <span>Show Review</span>
                            </button>
                          )}
                          <button
                            className="recruiter-profile-btn-action danger"
                            onClick={() => handleDeleteReview(review.id)}
                          >
                            <img src={deleteIcon} alt="Delete" />
                            <span>Delete Review</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {hasMoreReviews && reviews.length > 0 && (
                  <div className="recruiter-profile-load-more">
                    <button
                      className="recruiter-profile-btn-load-more"
                      onClick={handleLoadMoreReviews}
                      disabled={isLoadingReviews}
                    >
                      <span>
                        {isLoadingReviews ? "Loading..." : "Load More Reviews"}
                      </span>
                      <img src={loadMoreIcon} alt="Arrow" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <PortalFooter />
        </div>
      </div>
      {/* Profile Picture Editor Modal */}
      {userProfile && (
        <>
          <RecruiterProfilePictureEditor
            currentImage={getProfileImageUrl()}
            currentProfileVisibility={userProfile.profileVisibility || "public"}
            isOpen={isProfilePictureEditorOpen}
            onClose={() => setIsProfilePictureEditorOpen(false)}
            onSave={handleSaveProfilePicture}
          />

          {/* Personal Information Editor Modal */}
          <RecruiterPersonalInfoEditor
            userData={{
              email: userProfile.email,
              phone: userProfile.phone || "",
              address: userProfile.address || "",
              fullName: userProfile.fullName || "",
              companySize: userProfile.companySize || "",
              foundedYear: userProfile.foundedYear || "",
            }}
            isOpen={isPersonalInfoEditorOpen}
            onClose={() => setIsPersonalInfoEditorOpen(false)}
            onSave={handleSavePersonalInfo}
          />

          <RecruiterWebsiteEditor
            userData={{
              websiteUrl: userProfile.websiteUrl || "",
              linkedinUrl: userProfile.linkedinUrl || "",
              instagramUrl: userProfile.instagramUrl || "",
              facebookUrl: userProfile.facebookUrl || "",
            }}
            isOpen={isWebsiteEditorOpen}
            onClose={() => setIsWebsiteEditorOpen(false)}
            onSave={handleSaveWebsiteInfo}
          />

          <RecruiterAboutCompanyEditor
            currentAbout={userProfile.about || ""}
            isOpen={isAboutCompanyEditorOpen}
            onClose={() => setIsAboutCompanyEditorOpen(false)}
            onSave={handleSaveAboutCompany}
          />

          <RecruiterWorkspaceGalleryEditor
            currentImages={userProfile.workspaceImages || []}
            isOpen={isWorkspaceGalleryEditorOpen}
            onClose={() => setIsWorkspaceGalleryEditorOpen(false)}
            onSave={handleSaveWorkspaceGallery}
          />
        </>
      )}
    </div>
  );
};

export default RecruiterProfilePage;



