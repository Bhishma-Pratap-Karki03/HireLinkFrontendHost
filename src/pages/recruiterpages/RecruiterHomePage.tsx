import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";

const RecruiterHomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
    }

    // Check if user is actually a recruiter
    const userDataStr = localStorage.getItem("userData");
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        if (userData.role !== "recruiter") {
          // Redirect based on actual role
          if (userData.role === "candidate") {
            navigate("/candidate-home");
          } else if (userData.role === "admin") {
            navigate("/admin-home");
          } else {
            // Unknown role, redirect to login
            localStorage.removeItem("authToken");
            localStorage.removeItem("userData");
            navigate("/login");
          }
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
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
      <Navbar userType="recruiter" />

      <div style={{ padding: "20px" }}>
        <h1>Recruiter Home Page</h1>
        <p>Welcome to your Recruiter Dashboard</p>
        <div style={{ marginTop: "30px" }}>
          <h2>Recruiter Features</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            <div
              style={{
                padding: "20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <h3>📊 Job Postings</h3>
              <p>Create and manage job listings</p>
            </div>
            <div
              style={{
                padding: "20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <h3>👥 Candidate Search</h3>
              <p>Find and connect with candidates</p>
            </div>
            <div
              style={{
                padding: "20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <h3>💼 Applications</h3>
              <p>Review and manage applications</p>
            </div>
            <div
              style={{
                padding: "20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <h3>📈 Analytics</h3>
              <p>View recruitment metrics</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            marginTop: "30px",
            padding: "10px 20px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default RecruiterHomePage;
