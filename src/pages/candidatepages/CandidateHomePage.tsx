import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";

const CandidateHomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
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

      <div style={{ padding: "20px" }}>
        <h1>Candidate Home Page</h1>
        <p>Welcome to your Home Page</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default CandidateHomePage;
