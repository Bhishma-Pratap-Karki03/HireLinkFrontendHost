import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Register.css";

import candidateSelectedIcon from "../images/Register Page Images/Candidate Selected.png";
import candidateUnselectedIcon from "../images/Register Page Images/Candidate Unselected.png";
import recruiterSelectedIcon from "../images/Register Page Images/Recruiter Selected.png";
import recruiterUnselectedIcon from "../images/Register Page Images/Recruiter Unselected.png";
import registerAvatar1 from "../images/Login Page Images/avatar-1.jpg";
import registerAvatar2 from "../images/Login Page Images/avatar-2.png";
import registerAvatar3 from "../images/Login Page Images/avatar-3.png";
import registerAvatar4 from "../images/Login Page Images/avatar-4.png";
import searchIcon from "../images/Job List Page Images/search.svg";

const getApiBaseUrl = () => {
  const apiBase = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  if (apiBase) return apiBase.replace(/\/+$/, "");

  const backendBase = String(import.meta.env.VITE_BACKEND_URL || "").trim();
  if (backendBase) return `${backendBase.replace(/\/+$/, "")}/api`;

  const host = window.location.hostname;
  const isLocalHost =
    host === "localhost" || host === "127.0.0.1" || host === "::1";

  if (isLocalHost) return "http://localhost:5000/api";
  return "https://hirelinkbackendhost.onrender.com/api";
};

const Register = () => {
  const [userType, setUserType] = useState<"candidate" | "recruiter">(
    "candidate",
  );
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationLink, setShowVerificationLink] = useState(false);
  const [existingUserEmail, setExistingUserEmail] = useState<string>("");
  const [platformStats, setPlatformStats] = useState({
    activeJobs: 0,
    candidates: 0,
    companies: 0,
  });
  const navigate = useNavigate();
  const apiBaseUrl = getApiBaseUrl();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userDataStr = localStorage.getItem("userData");

    if (token && userDataStr) {
      try {
        JSON.parse(userDataStr);
        navigate("/home");
      } catch {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
      }
    }
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;

    const loadPlatformStats = async () => {
      try {
        const [jobsRes, candidatesRes, companiesRes] = await Promise.all([
          fetch(`${apiBaseUrl}/jobs?page=1&limit=1`),
          fetch(`${apiBaseUrl}/users/candidates`),
          fetch(`${apiBaseUrl}/employers`),
        ]);

        const [jobsData, candidatesData, companiesData] = await Promise.all([
          jobsRes.json(),
          candidatesRes.json(),
          companiesRes.json(),
        ]);

        if (!isMounted) return;

        setPlatformStats({
          activeJobs: Number(jobsData?.total || 0),
          candidates: Number(
            candidatesData?.total || candidatesData?.candidates?.length || 0,
          ),
          companies: Number(
            companiesData?.total || companiesData?.recruiters?.length || 0,
          ),
        });
      } catch (_error) {
        if (!isMounted) return;
        setPlatformStats({
          activeJobs: 0,
          candidates: 0,
          companies: 0,
        });
      }
    };

    loadPlatformStats();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!statusMessage || showVerificationLink) return;
    const timer = window.setTimeout(() => {
      setStatusMessage(null);
      setStatusType(null);
    }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [statusMessage, showVerificationLink]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "email") {
      setShowVerificationLink(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;

    setStatusMessage(null);
    setStatusType(null);
    setShowVerificationLink(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setStatusMessage(
        "Please enter a valid email address (example@domain.com)",
      );
      setStatusType("error");
      return;
    }

    if (formData.fullName.trim().length < 2) {
      setStatusMessage("Full name must be at least 2 characters long");
      setStatusType("error");
      return;
    }

    if (formData.password.length < 8) {
      setStatusMessage("Password must be at least 8 characters long");
      setStatusType("error");
      return;
    }

    if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
        formData.password,
      )
    ) {
      setStatusMessage(
        "Password must contain uppercase, lowercase, number, and special character",
      );
      setStatusType("error");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setStatusMessage("Passwords do not match");
      setStatusType("error");
      return;
    }

    if (!formData.terms) {
      setStatusMessage("Please accept the terms and conditions");
      setStatusType("error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          userType,
        }),
      });

      const data = await response.json();

      // Existing account but not verified: continue verification flow.
      if (data.requiresVerification && data.emailExists) {
        const message = data.hasActiveCode
          ? data.message ||
            "Email already registered but not verified. Continue with your current verification code."
          : data.message ||
            "Email already registered but not verified. Previous code expired, please resend verification code.";

        setStatusMessage(message);
        setStatusType("error");
        setShowVerificationLink(true);
        setExistingUserEmail(data.email || formData.email);

        return;
      }

      if (!response.ok) {
        if (data.isVerified) {
          setStatusMessage(
            data.message || "Email already verified. Please login.",
          );
          setStatusType("error");
          setIsLoading(false);
          return;
        }

        if (data.emailExists && data.hasActiveCode) {
          setStatusMessage(
            data.message ||
              "Email already registered but not verified. Please enter the verification code.",
          );
          setStatusType("error");
          setShowVerificationLink(true);
          setExistingUserEmail(data.email);
          setIsLoading(false);
          return;
        }

        if (data.emailExists && data.codeExpired) {
          setStatusMessage(
            data.message || "Verification code expired. New code sent.",
          );
          setStatusType("success");
          setShowVerificationLink(true);
          setExistingUserEmail(data.email);

          setTimeout(() => {
            navigate("/verify-email", {
              state: {
                email: data.email,
                message: data.message,
              },
            });
          }, 500);
          setIsLoading(false);
          return;
        }

        if (data.requiresVerification) {
          setStatusMessage(data.message || "Please verify your email to continue");
          setStatusType("success");

          setTimeout(() => {
            navigate("/verify-email", {
              state: {
                email: formData.email,
                message: data.message,
              },
            });
          }, 500);
          setIsLoading(false);
          return;
        }

        setStatusMessage(data.message || "Registration failed");
        setStatusType("error");
        setIsLoading(false);
        return;
      }

      setStatusMessage(
        data.message || "Registration successful! Redirecting to verification...",
      );
      setStatusType("success");

      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        terms: false,
      });

      setTimeout(() => {
        navigate("/verify-email", {
          state: {
            email: formData.email,
            message: data.message,
          },
        });
      }, 500);
    } catch {
      setStatusMessage("Something went wrong. Please try again.");
      setStatusType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToVerification = () => {
    if (existingUserEmail) {
      navigate("/verify-email", {
        state: {
          email: existingUserEmail,
          message: "Please enter verification code sent to your email",
        },
      });
    }
  };

  return (
    <>
      <Navbar />
      <main id="register" className="register-page-wrap">
        <section className="register-left-panel">
          <div className="register-left-circle-1" />
          <div className="register-left-circle-2" />
          <div className="register-dot-grid" />

          <div className="register-left-top">
            <div className="register-left-badge">
              <span className="pulse" /> #1 Smart Recruitment Platform
            </div>
            <h1>
              Find Your <span>Dream Job</span>
              <br />
              with HireLink
            </h1>
            <p>
              Connect with top employers, build your skills portfolio, and get
              AI-matched to jobs that truly fit you.
            </p>

            <div className="register-stat-row">
              <div className="register-stat-item">
                <span className="register-stat-num">
                  {platformStats.activeJobs.toLocaleString()}
                </span>
                <span className="register-stat-lbl">Active Jobs</span>
              </div>
              <div className="register-stat-item">
                <span className="register-stat-num">
                  {platformStats.candidates.toLocaleString()}
                </span>
                <span className="register-stat-lbl">Candidates</span>
              </div>
              <div className="register-stat-item">
                <span className="register-stat-num">
                  {platformStats.companies.toLocaleString()}
                </span>
                <span className="register-stat-lbl">Companies</span>
              </div>
            </div>
          </div>

          <div className="register-illustration">
            <div className="register-ill-scene">
              <div className="register-ill-main-card">
                <div className="register-ill-card-top">
                  <div className="register-ill-co-logo">
                    <img src={searchIcon} alt="Search" />
                  </div>
                  <div>
                    <div className="register-ill-co-name">Google Inc.</div>
                    <div className="register-ill-role">Sr. UX/UI Designer</div>
                  </div>
                </div>
                <div className="register-ill-tags">
                  <span className="register-ill-tag">Full-Time</span>
                  <span className="register-ill-tag green">Remote</span>
                  <span className="register-ill-tag">Kathmandu</span>
                </div>
                <div className="register-ill-card-foot">
                  <div className="register-ill-salary">
                    $4,500 <small>/ mo</small>
                  </div>
                  <div className="register-ill-apply">Apply Now</div>
                </div>
              </div>

              <div className="register-float-card top">
                <div className="register-fc-label">New Applicants</div>
                <div className="register-avatar-stack">
                  <span className="register-av">
                    <img src={registerAvatar1} alt="" />
                  </span>
                  <span className="register-av">
                    <img src={registerAvatar2} alt="" />
                  </span>
                  <span className="register-av">
                    <img src={registerAvatar3} alt="" />
                  </span>
                  <span className="register-av">
                    <img src={registerAvatar4} alt="" />
                  </span>
                  <span className="register-av-more">+</span>
                </div>
                <div className="register-fc-count">1.7k+ applicants</div>
                <div className="register-fc-sub">This week</div>
              </div>

              <div className="register-float-card bottom">
                <div className="register-fc-label">Your AI Match</div>
                <div className="register-match-num">96%</div>
                <div className="register-match-bar-bg">
                  <div className="register-match-bar" />
                </div>
                <div className="register-match-sub">Excellent fit for this role</div>
              </div>
            </div>
          </div>
        </section>

        <section className="register-right-panel">
          <div className="register-form-box">
            <div className="register-form-header">
              <div className="register-form-kicker">Create account</div>
              <h2>Register on HireLink</h2>
              <p>
                Already have an account? <Link to="/login">Login now</Link>
              </p>
            </div>

            <div className="register-user-type-selector">
              <button
                className={`register-user-type-btn ${
                  userType === "candidate" ? "active" : ""
                }`}
                onClick={() => setUserType("candidate")}
                type="button"
              >
                <img
                  src={
                    userType === "candidate"
                      ? candidateSelectedIcon
                      : candidateUnselectedIcon
                  }
                  alt="Candidate"
                />
                Candidate
              </button>
              <button
                className={`register-user-type-btn ${
                  userType === "recruiter" ? "active" : ""
                }`}
                onClick={() => setUserType("recruiter")}
                type="button"
              >
                <img
                  src={
                    userType === "recruiter"
                      ? recruiterSelectedIcon
                      : recruiterUnselectedIcon
                  }
                  alt="Recruiter"
                />
                Recruiter
              </button>
            </div>

            <form className="register-form" onSubmit={handleSubmit}>
              <div className="register-field">
                <label htmlFor="fullName">
                  {userType === "recruiter" ? "Company Name *" : "Full Name *"}
                </label>
                <div className="register-input-wrap">
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    placeholder={
                      userType === "recruiter" ? "Company Name" : "Full Name"
                    }
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="register-field">
                <label htmlFor="email">Email Address *</label>
                <div className="register-input-wrap">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="register-field">
                <label htmlFor="password">Password *</label>
                <div className="register-input-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    className="register-toggle-pw"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="register-field">
                <label htmlFor="confirm-password">Confirm Password *</label>
                <div className="register-input-wrap">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm-password"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    className="register-toggle-pw"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </div>

              <label className="register-terms-check">
                <input
                  type="checkbox"
                  id="terms"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleInputChange}
                />
                <span className="register-checkmark" />
                Accept our terms and conditions and privacy policy
              </label>

              <button type="submit" className="register-submit-btn" disabled={isLoading}>
                {isLoading ? "Registering..." : "Register Now"}
              </button>

              {showVerificationLink && existingUserEmail && (
                <button
                  type="button"
                  className="register-verification-inline-btn"
                  onClick={handleGoToVerification}
                >
                  Go to Verification Page
                </button>
              )}
            </form>

            <div className="register-login-prompt-wrapper">
              <p className="register-login-prompt">
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      {statusMessage && (
        <div className={`register-toast ${statusType === "success" ? "success" : "error"}`}>
          <div className="register-toast-head">
            {statusType === "success" ? "Success" : "Error"}
          </div>
          <p className="register-toast-message">{statusMessage}</p>

          <button
            type="button"
            className="register-toast-close"
            aria-label="Close toast"
            onClick={() => {
              setStatusMessage(null);
              setStatusType(null);
              setShowVerificationLink(false);
            }}
          >
            ×
          </button>
        </div>
      )}
      <Footer />
    </>
  );
};

export default Register;



