import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";

const AdminHomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and is admin email
    const token = localStorage.getItem("authToken");
    const userDataStr = localStorage.getItem("userData");

    if (!token) {
      navigate("/login");
      return;
    }

    if (userDataStr) {
      try {
        const user = JSON.parse(userDataStr);

        // Check if this is the admin email
        if (user.email !== "hirelinknp@gmail.com") {
          // Redirect non-admin users to appropriate home page
          if (user.role === "recruiter") {
            navigate("/recruiter-home");
          } else {
            navigate("/candidate-home");
          }
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        navigate("/login");
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("profilePictureBase64");
    localStorage.removeItem("profilePictureFileName");

    // Redirect to login page
    navigate("/login");

    // Force page reload to clear all state
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div>
      {/* Navbar will automatically fetch user data from localStorage */}
      <Navbar />

      <div style={{ padding: "40px" }}>
        <div className="admin-home-content">
          <h1>Welcome to Admin Dashboard</h1>
          <p>Manage the entire platform from here</p>

          <div className="admin-home-actions">
            <button
              onClick={() => navigate("/admin-dashboard")}
              className="admin-btn-primary"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate("/admin-profile")}
              className="admin-btn-outline"
            >
              Edit Profile
            </button>
            <button onClick={handleLogout} className="admin-btn-logout">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHomePage;
