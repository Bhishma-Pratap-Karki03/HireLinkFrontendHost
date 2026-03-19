import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admincomponents/AdminSidebar";
import AdminTopBar from "../../components/admincomponents/AdminTopBar";
import AdminProfilePictureEditor from "../../components/admincomponents/AdminProfilePictureEditor";
import AdminPersonalInfoEditor from "../../components/admincomponents/AdminPersonalInfoEditor";
import "../../styles/AdminProfilePage.css";
import "../../styles/AdminProfilePictureEditor.css";
import "../../styles/AdminPersonalInfoEditor.css";

// Import images
import cameraIcon from "../../images/Recruiter Profile Page Images/cameraIcon.svg";
import editIcon from "../../images/Admin Profile Page Images/4_34.svg";
import defaultAvatar from "../../images/Register Page Images/Default Profile.webp";

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phone: string;
  address: string;
  profilePicture: string;
  createdAt: string;
  updatedAt: string;
}

const AdminProfilePage: React.FC = () => {
  const navigate = useNavigate();

  // State for user profile data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfilePictureEditorOpen, setIsProfilePictureEditorOpen] =
    useState(false);
  const [isPersonalInfoEditorOpen, setIsPersonalInfoEditorOpen] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch user profile data
  const fetchUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("authToken");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:5000/api/profile/me", {
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
        };
        localStorage.setItem("userData", JSON.stringify(minimalUserData));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Fetch profile on component mount and refresh
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile, refreshTrigger]);

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
        // Check if user is admin (by email)
        const isAdminEmail = userData.email === "hirelinknp@gmail.com";
        if (!isAdminEmail) {
          // Redirect non-admin users to their respective pages
          if (userData.role === "recruiter") {
            navigate("/recruiter-profile");
          } else {
            navigate("/candidate-profile");
          }
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, [navigate]);

  // Handle profile picture save
  const handleSaveProfilePicture = async (data: {
    imageFile?: File | null;
  }) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);
      if (data.imageFile !== undefined) {
        if (data.imageFile) {
          // Upload new profile picture
          const formData = new FormData();
          formData.append("profilePicture", data.imageFile);

          const response = await fetch(
            "http://localhost:5000/api/profile/me/picture", // CHANGED FROM /upload-picture to /me/picture
            {
              method: "POST", // CHANGED FROM PUT to POST
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            }
          );

          const responseData = await response.json();

          if (!response.ok) {
            throw new Error(
              responseData.message || "Failed to upload profile picture"
            );
          }
        } else {
          // Remove profile picture
          const response = await fetch(
            "http://localhost:5000/api/profile/me/picture", // CHANGED FROM /remove-picture to /me/picture
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to remove profile picture");
          }
        }
      }

      // Refresh profile data
      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);

      // Notify other components
      window.dispatchEvent(new CustomEvent("profileUpdated"));
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile picture. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle personal info save (updated to remove address)
  const handleSavePersonalInfo = async (data: {
    fullName: string;
    phone: string;
  }): Promise<void> => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("http://localhost:5000/api/profile/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: data.fullName,
          phone: data.phone || "",
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || "Failed to update personal information"
        );
      }

      // Refresh profile data
      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);

      // Notify other components
      window.dispatchEvent(new CustomEvent("profileUpdated"));
    } catch (error) {
      console.error("Error saving personal information:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    console.log("Search query:", query);
    // Implement search functionality here
  };

  // Handle change password
  const handleChangePassword = () => {
    navigate("/admin/settings");
  };

  // Get profile image URL
  const getProfileImageUrl = () => {
    if (!userProfile) {
      return defaultAvatar;
    }

    // Check if profile picture exists and is not empty
    if (
      !userProfile.profilePicture ||
      userProfile.profilePicture.trim() === ""
    ) {
      return defaultAvatar;
    }

    // If profile picture exists, use it with cache busting
    if (userProfile.profilePicture.startsWith("http")) {
      return userProfile.profilePicture;
    }

    // For relative paths, prepend the backend URL with cache busting
    return `http://localhost:5000${userProfile.profilePicture}?t=${Date.now()}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="admin-profile-page-container">
        <div className="admin-loading-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-profile-page-container">
      <div className="admin-profile-layout">
        {/* Admin Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <div className="admin-profile-main-area">
          {/* Top Bar */}
          <div className="admin-profile-topbar-wrapper">
            <AdminTopBar onSearch={handleSearch} />
          </div>

          {/* Scrollable Content */}
          <div className="admin-profile-scrollable-content">
            <div className="admin-profile-content-wrapper">
              <div className="admin-profile-page-header">
                <h1>My Profile</h1>
                <p>
                  Manage your personal information and account security settings
                </p>
              </div>

              {/* Two Column Layout */}
              <div className="admin-profile-panels-grid">
                {/* Left Panel: Profile Picture */}
                <div className="admin-profile-card admin-profile-pic-card">
                  <h2 className="admin-card-title">Profile Picture</h2>
                  <div className="admin-avatar-upload-area">
                    <div className="admin-large-avatar">
                      <img
                        src={getProfileImageUrl()}
                        alt="Profile Picture"
                        className="admin-profile-avatar-img"
                        onError={(e) => {
                          // If image fails to load, show default avatar
                          e.currentTarget.src = defaultAvatar;
                        }}
                      />
                    </div>
                    <div className="admin-upload-info">
                      <span>
                        Recommended: 400×400px (JPG, PNG). Max Size 2MB
                      </span>
                    </div>
                    <div className="admin-upload-actions">
                      <button
                        className="admin-btn-outline admin-upload-btn"
                        onClick={() => setIsProfilePictureEditorOpen(true)}
                      >
                        <img src={cameraIcon} alt="Camera" />
                        <span>Upload New Picture</span>
                      </button>
                      {userProfile?.profilePicture && (
                        <button
                          className="admin-btn-outline admin-remove-btn"
                          onClick={() =>
                            handleSaveProfilePicture({
                              imageFile: null,
                            })
                          }
                        >
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Panel: Basic Info & Security */}
                <div className="admin-profile-card admin-info-card">
                  {/* Basic Information */}
                  <div className="admin-card-section">
                    <div className="admin-section-header">
                      <h2 className="admin-card-title">Basic Information</h2>
                      <button
                        className="admin-edit-btn"
                        onClick={() => setIsPersonalInfoEditorOpen(true)}
                      >
                        <img src={editIcon} alt="Edit" />
                      </button>
                    </div>

                    <div className="admin-form-grid">
                      <div className="admin-form-group admin-full-width">
                        <label>Full Name</label>
                        <div className="admin-input-wrapper">
                          <div className="admin-input-text">
                            {userProfile?.fullName || "No name provided"}
                          </div>
                        </div>
                      </div>

                      <div className="admin-form-row">
                        <div className="admin-form-group">
                          <label>Email Address</label>
                          <div className="admin-input-wrapper">
                            <div className="admin-input-text">
                              {userProfile?.email || "No email provided"}
                            </div>
                          </div>
                        </div>
                        <div className="admin-form-group">
                          <label>Phone Number</label>
                          <div className="admin-input-wrapper">
                            <div className="admin-input-text">
                              {userProfile?.phone || "No phone provided"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="admin-divider" />

                  {/* Security Settings */}
                  <div className="admin-card-section">
                    <h2 className="admin-card-title">Security Settings</h2>
                    <div className="admin-security-box">
                      <div className="admin-security-content">
                        <span className="admin-security-text">
                          Want to Change Password?
                        </span>
                        <button
                          className="admin-btn-primary admin-small-btn"
                          onClick={handleChangePassword}
                        >
                          Change Password
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Picture Editor Modal */}
      {userProfile && (
        <AdminProfilePictureEditor
          currentImage={getProfileImageUrl()}
          isOpen={isProfilePictureEditorOpen}
          onClose={() => setIsProfilePictureEditorOpen(false)}
          onSave={handleSaveProfilePicture}
        />
      )}

      {/* Personal Information Editor Modal */}
      {userProfile && (
        <AdminPersonalInfoEditor
          userData={{
            email: userProfile.email,
            phone: userProfile.phone || "",
            fullName: userProfile.fullName || "",
          }}
          isOpen={isPersonalInfoEditorOpen}
          onClose={() => setIsPersonalInfoEditorOpen(false)}
          onSave={handleSavePersonalInfo}
        />
      )}
    </div>
  );
};

export default AdminProfilePage;
