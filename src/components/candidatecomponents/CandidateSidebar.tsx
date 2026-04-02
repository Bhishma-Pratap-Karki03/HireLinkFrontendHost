import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../../styles/CandidateSidebar.css";

// Import images
import logoImg from "../../images/Register Page Images/Logo.png";
import dashboardIcon from "../../images/Candidate Profile Page Images/261_1905.svg";
import profileIcon from "../../images/Candidate Profile Page Images/My Profile.png";
import resumeIcon from "../../images/Candidate Profile Page Images/261_1918.svg";
import messagesIcon from "../../images/Candidate Profile Page Images/261_1924.svg";
import jobAlertsIcon from "../../images/Candidate Profile Page Images/261_1929.svg";
import savedJobIcon from "../../images/Candidate Profile Page Images/261_1935.svg";
import settingsIcon from "../../images/Candidate Profile Page Images/261_1942.svg";
import friendRequestsIcon from "../../images/Recruiter Profile Page Images/friend-request.svg";
import appliedStatusIcon from "../../images/Job List Page Images/applied-status-icon.png";
import notificationIcon from "../../images/Recruiter Profile Page Images/notification-icon.png";
import defaultAvatar from "../../images/Register Page Images/Default Profile.webp";
import menuIcon from "../../images/Register Page Images/menu.png";

interface UserData {
  id: string;
  fullName: string;
  email: string;
  role: string;
  profilePicture?: string;
  currentJobTitle?: string;
}

interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: string;
}

const CandidateSidebar: React.FC = () => {
  const [userName, setUserName] = useState<string>("User");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profileImage, setProfileImage] = useState<string>(defaultAvatar);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch user data from backend
  const fetchUserData = async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profile/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);

        if (data.user.fullName) {
          setUserName(data.user.fullName);
        } else if (data.user.email) {
          setUserName(data.user.email.split("@")[0]);
        } else {
          setUserName("User");
        }

        // Set profile picture from database
        if (data.user.profilePicture && data.user.profilePicture !== "") {
          if (data.user.profilePicture.startsWith("http")) {
            // Add cache-busting timestamp to prevent caching
            const separator = data.user.profilePicture.includes("?")
              ? "&"
              : "?";
            setProfileImage(
              `${data.user.profilePicture}${separator}t=${Date.now()}`,
            );
          } else {
            // Add cache-busting timestamp to prevent caching
            setProfileImage(
              `${import.meta.env.VITE_BACKEND_URL}${data.user.profilePicture}?t=${Date.now()}`,
            );
          }
        } else {
          setProfileImage(defaultAvatar);
        }
      } else if (response.status === 401) {
        // Token expired
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        navigate("/login");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();

    // Set up interval to refresh user data periodically
    const intervalId = setInterval(() => {
      const token = localStorage.getItem("authToken");
      if (token) {
        fetchUserData();
      }
    }, 120000); // Refresh every 2 minutes

    return () => clearInterval(intervalId);
  }, [navigate]);

  // Listen for profile update events
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchUserData();
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, [navigate]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Get navigation items based on user role
  const getNavItems = (): NavItem[] => {
    if (!userData) return [];

    const isAdmin = userData.email === "hirelinknp@gmail.com";
    const isRecruiter = userData.role === "recruiter";

    if (isAdmin) {
      return [
        {
          id: "dashboard",
          path: "/admin-dashboard",
          label: "Dashboard",
          icon: dashboardIcon,
        },
        {
          id: "profile",
          path: "/admin-profile",
          label: "My Profile",
          icon: profileIcon,
        },
        {
          id: "manage-users",
          path: "/admin/manage-users",
          label: "Manage Users",
          icon: messagesIcon,
        },
        {
          id: "reports",
          path: "/admin/reports",
          label: "Reports",
          icon: jobAlertsIcon,
        },
        {
          id: "settings",
          path: "/admin/settings",
          label: "Settings",
          icon: settingsIcon,
        },
      ];
    } else if (isRecruiter) {
      return [
        {
          id: "dashboard",
          path: "/recruiter-dashboard",
          label: "Dashboard",
          icon: dashboardIcon,
        },
        {
          id: "profile",
          path: "/recruiter-profile",
          label: "My Profile",
          icon: profileIcon,
        },
        {
          id: "post-job",
          path: "/recruiter/post-job",
          label: "Post Job",
          icon: resumeIcon,
        },
        {
          id: "candidates",
          path: "/recruiter/candidates",
          label: "View Candidates",
          icon: messagesIcon,
        },
        {
          id: "applications",
          path: "/recruiter/applications",
          label: "Applications",
          icon: jobAlertsIcon,
        },
        {
          id: "saved-candidates",
          path: "/recruiter/saved-candidates",
          label: "Saved Candidates",
          icon: savedJobIcon,
        },
        {
          id: "settings",
          path: "/recruiter/settings",
          label: "Settings",
          icon: settingsIcon,
        },
      ];
    } else {
      // Candidate navigation
      return [
        {
          id: "dashboard",
          path: "/candidate-dashboard",
          label: "Dashboard",
          icon: dashboardIcon,
        },
        {
          id: "profile",
          path: "/candidate-profile",
          label: "My Profile",
          icon: profileIcon,
        },
        {
          id: "messages",
          path: "/candidate/messages",
          label: "Messages",
          icon: messagesIcon,
        },
        {
          id: "job-alerts",
          path: "/candidate/job-alerts",
          label: "Smart Jobs",
          icon: jobAlertsIcon,
        },
        {
          id: "saved-jobs",
          path: "/candidate/saved-jobs",
          label: "Saved Jobs",
          icon: savedJobIcon,
        },
        {
          id: "applied-status",
          path: "/candidate/applied-status",
          label: "Applied Status",
          icon: appliedStatusIcon,
        },
        {
          id: "friend-requests",
          path: "/candidate/friend-requests",
          label: "Friend Requests",
          icon: friendRequestsIcon,
        },
        {
          id: "notifications",
          path: "/candidate/notifications",
          label: "Notifications",
          icon: notificationIcon,
        },
        {
          id: "settings",
          path: "/candidate/settings",
          label: "Settings",
          icon: settingsIcon,
        },
      ];
    }
  };

  const navItems = getNavItems();

  // Handle logo click - redirect to public home
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/home");
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleNavItemClick = () => {
    if (window.innerWidth <= 1024) {
      closeMobileMenu();
    }
  };

  if (isLoading) {
    return (
      <>
        <button
          type="button"
          className="sidebar-mobile-menu-btn"
          aria-label="Open menu"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <img src={menuIcon} alt="Menu" className="sidebar-mobile-menu-icon" />
        </button>
        {isMobileMenuOpen && (
          <button
            type="button"
            className="sidebar-mobile-backdrop"
            aria-label="Close menu"
            onClick={closeMobileMenu}
          />
        )}
        <aside className={`sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}>
          <div className="sidebar-header">
            <Link
              to="#"
              onClick={handleLogoClick}
              style={{ display: "inline-block", textDecoration: "none" }}
            >
              <img src={logoImg} alt="HireLink Logo" className="logo" />
            </Link>
          </div>
          <div className="loading-sidebar">
            <p>Loading</p>
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className="sidebar-mobile-menu-btn"
        aria-label="Open menu"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <img src={menuIcon} alt="Menu" className="sidebar-mobile-menu-icon" />
      </button>
      {isMobileMenuOpen && (
        <button
          type="button"
          className="sidebar-mobile-backdrop"
          aria-label="Close menu"
          onClick={closeMobileMenu}
        />
      )}
      <aside className={`sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <Link
            to="#"
            onClick={handleLogoClick}
            style={{ display: "inline-block", textDecoration: "none" }}
          >
            <img src={logoImg} alt="HireLink Logo" className="logo" />
          </Link>
        </div>

        <div className="user-summary">
          <div className="avatar-container">
            <img
              src={profileImage}
              alt={`${userName}'s profile`}
              className="user-avatar"
              onError={(e) => {
                e.currentTarget.src = defaultAvatar;
              }}
            />
          </div>
          <h3 className="user-name">{userName}</h3>
          {userData?.currentJobTitle && (
            <p className="user-job-title">{userData.currentJobTitle}</p>
          )}
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isSmartJobs =
              item.id === "job-alerts" &&
              location.pathname.startsWith("/candidate/job-alerts");
            const isActive = isSmartJobs || location.pathname === item.path;

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={handleNavItemClick}
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  className="nav-icon"
                  onError={(e) => {
                    e.currentTarget.src = messagesIcon;
                  }}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default CandidateSidebar;


