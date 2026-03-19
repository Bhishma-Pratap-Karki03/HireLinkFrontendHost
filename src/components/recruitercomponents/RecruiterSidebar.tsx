import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../../styles/RecruiterSidebar.css";

// Import images
import logoImg from "../../images/Register Page Images/Logo.png";
import defaultAvatar from "../../images/Register Page Images/Default Profile.webp";
import dashboardIcon from "../../images/Candidate Profile Page Images/261_1905.svg";
import profileIcon from "../../images/Candidate Profile Page Images/My Profile.png";
import jobPostingsIcon from "../../images/Recruiter Profile Page Images/6_312.svg";
import messagesIcon from "../../images/Recruiter Profile Page Images/6_317.svg";
import settingsIcon from "../../images/Recruiter Profile Page Images/6_335.svg";
import friendRequestsIcon from "../../images/Recruiter Profile Page Images/friend-request.svg";
import notificationIcon from "../../images/Recruiter Profile Page Images/notification-icon.png";
import menuIcon from "../../images/Register Page Images/menu.png";

interface UserData {
  id: string;
  fullName: string;
  email: string;
  role: string;
  profilePicture?: string;
  // Remove currentJobTitle from interface if not needed elsewhere
}

interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: string;
}

const RecruiterSidebar: React.FC = () => {
  const [userName, setUserName] = useState<string>("Recruiter");
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
          setUserName("Recruiter");
        }

        // Set profile picture from database
        if (data.user.profilePicture && data.user.profilePicture !== "") {
          if (data.user.profilePicture.startsWith("http")) {
            const separator = data.user.profilePicture.includes("?")
              ? "&"
              : "?";
            setProfileImage(
              `${data.user.profilePicture}${separator}t=${Date.now()}`,
            );
          } else {
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

  // Determine if user is recruiter
  const isRecruiter = userData?.role === "recruiter";

  // Recruiter navigation items
  const navItems: NavItem[] = [
    {
      id: "dashboard",
      path: "/recruiter-dashboard",
      label: "Dashboard",
      icon: dashboardIcon,
    },
    {
      id: "profile",
      path: "/recruiter-profile",
      label: "Company Profile",
      icon: profileIcon,
    },
    {
      id: "job-postings",
      path: "/recruiter/job-postings",
      label: "Job Postings",
      icon: jobPostingsIcon,
    },
    {
      id: "messages",
      path: "/recruiter/messages",
      label: "Messages",
      icon: messagesIcon,
    },
    {
      id: "friend-requests",
      path: "/recruiter/friend-requests",
      label: "Friend Requests",
      icon: friendRequestsIcon,
    },
    {
      id: "notifications",
      path: "/recruiter/notifications",
      label: "Notifications",
      icon: notificationIcon,
    },
    {
      id: "settings",
      path: "/recruiter/settings",
      label: "Settings",
      icon: settingsIcon,
    },
  ];

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
          className="recruiter-sidebar-mobile-menu-btn"
          aria-label="Open menu"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <img
            src={menuIcon}
            alt="Menu"
            className="recruiter-sidebar-mobile-menu-icon"
          />
        </button>
        {isMobileMenuOpen && (
          <button
            type="button"
            className="recruiter-sidebar-mobile-backdrop"
            aria-label="Close menu"
            onClick={closeMobileMenu}
          />
        )}
        <aside
          className={`recruiter-sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}
        >
          <div className="recruiter-sidebar-header">
            <Link
              to="#"
              onClick={handleLogoClick}
              style={{ display: "inline-block", textDecoration: "none" }}
            >
              <img
                src={logoImg}
                alt="HireLink Logo"
                className="recruiter-logo"
              />
            </Link>
          </div>
          <div className="loading-sidebar">
            <p>Loading...</p>
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className="recruiter-sidebar-mobile-menu-btn"
        aria-label="Open menu"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <img
          src={menuIcon}
          alt="Menu"
          className="recruiter-sidebar-mobile-menu-icon"
        />
      </button>
      {isMobileMenuOpen && (
        <button
          type="button"
          className="recruiter-sidebar-mobile-backdrop"
          aria-label="Close menu"
          onClick={closeMobileMenu}
        />
      )}
      <aside className={`recruiter-sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="recruiter-sidebar-header">
          <Link
            to="#"
            onClick={handleLogoClick}
            style={{ display: "inline-block", textDecoration: "none" }}
          >
            <img src={logoImg} alt="HireLink Logo" className="recruiter-logo" />
          </Link>
        </div>
        <div className="recruiter-user-summary">
          <div
            className={`recruiter-avatar-container ${
              isRecruiter
                ? "recruiter-logo-container"
                : "candidate-avatar-container"
            }`}
          >
            <img
              src={profileImage}
              alt={`${userName}'s company logo`}
              className={`recruiter-user-avatar ${
                isRecruiter ? "recruiter-logo" : "candidate-avatar"
              }`}
              onError={(e) => {
                e.currentTarget.src = defaultAvatar;
              }}
            />
          </div>
          <h3 className="recruiter-user-name">{userName}</h3>
        </div>

        <nav className="recruiter-sidebar-nav">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.id === "job-postings" &&
                (location.pathname.startsWith("/recruiter/job-postings") ||
                  location.pathname === "/recruiter/post-job"));

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`recruiter-nav-item ${isActive ? "active" : ""}`}
                onClick={handleNavItemClick}
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  className="recruiter-nav-icon"
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

export default RecruiterSidebar;


