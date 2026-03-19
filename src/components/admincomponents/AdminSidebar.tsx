import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../../styles/AdminSidebar.css";

// Import images
import logoImg from "../../images/Register Page Images/Logo.png";
import defaultAvatar from "../../images/Register Page Images/Default Profile.webp";
import dashboardIcon from "../../images/Candidate Profile Page Images/261_1905.svg";
import profileIcon from "../../images/Admin Profile Page Images/4_93.svg";
import manageUser from "../../images/Admin Profile Page Images/Manage-user.png";
import settingsIcon from "../../images/Recruiter Profile Page Images/6_335.svg";
import assessmentsIcon from "../../images/Admin Profile Page Images/Quiz.svg";
import jobsIcon from "../../images/Recruiter Profile Page Images/6_312.svg";
import contactUsIcon from "../../images/Recruiter Profile Page Images/contactUsIcon.png";
import menuIcon from "../../images/Register Page Images/menu.png";

interface UserData {
  id: string;
  fullName: string;
  email: string;
  role: string;
  profilePicture?: string;
}

interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: string;
}

const AdminSidebar: React.FC = () => {
  const [userName, setUserName] = useState<string>("Admin");
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
      const response = await fetch("http://localhost:5000/api/profile/me", {
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
          setUserName("Admin");
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
              `http://localhost:5000${data.user.profilePicture}?t=${Date.now()}`,
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

  // Admin navigation items
  const navItems: NavItem[] = [
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
      icon: manageUser,
    },
    {
      id: "jobs",
      path: "/admin/jobs",
      label: "Manage Jobs",
      icon: jobsIcon,
    },
    {
      id: "assessments",
      path: "/admin/assessments",
      label: "Quiz/Assessment",
      icon: assessmentsIcon,
    },
    {
      id: "contact-messages",
      path: "/admin/contact-messages",
      label: "Contact Messages",
      icon: contactUsIcon,
    },
    {
      id: "settings",
      path: "/admin/settings",
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
          className="admin-sidebar-mobile-menu-btn"
          aria-label="Open menu"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <img src={menuIcon} alt="Menu" className="admin-sidebar-mobile-menu-icon" />
        </button>
        {isMobileMenuOpen && (
          <button
            type="button"
            className="admin-sidebar-mobile-backdrop"
            aria-label="Close menu"
            onClick={closeMobileMenu}
          />
        )}
        <aside className={`admin-sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}>
          <div className="admin-sidebar-header">
            <Link
              to="#"
              onClick={handleLogoClick}
              style={{ display: "inline-block", textDecoration: "none" }}
            >
              <img src={logoImg} alt="HireLink Logo" className="admin-logo" />
            </Link>
          </div>
          <div className="admin-loading-sidebar">
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
        className="admin-sidebar-mobile-menu-btn"
        aria-label="Open menu"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <img src={menuIcon} alt="Menu" className="admin-sidebar-mobile-menu-icon" />
      </button>
      {isMobileMenuOpen && (
        <button
          type="button"
          className="admin-sidebar-mobile-backdrop"
          aria-label="Close menu"
          onClick={closeMobileMenu}
        />
      )}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="admin-sidebar-header">
          <Link
            to="#"
            onClick={handleLogoClick}
            style={{ display: "inline-block", textDecoration: "none" }}
          >
            <img src={logoImg} alt="HireLink Logo" className="admin-logo" />
          </Link>
        </div>
        <div className="admin-user-summary">
          <div className="admin-avatar-container">
            <img
              src={profileImage}
              alt={`${userName}'s profile`}
              className="admin-user-avatar"
              onError={(e) => {
                e.currentTarget.src = defaultAvatar;
              }}
            />
          </div>
          <h3 className="admin-user-name">{userName}</h3>
          <p className="admin-user-role">Administrator</p>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.id === "assessments" &&
                location.pathname.startsWith("/admin/assessments/"));

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`admin-nav-item ${isActive ? "active" : ""}`}
                onClick={handleNavItemClick}
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  className="admin-nav-icon"
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

export default AdminSidebar;
