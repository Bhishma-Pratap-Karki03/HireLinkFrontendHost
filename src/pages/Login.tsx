import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Login.css";
import loginAvatar1 from "../images/Login Page Images/avatar-1.jpg";
import loginAvatar2 from "../images/Login Page Images/avatar-2.png";
import loginAvatar3 from "../images/Login Page Images/avatar-3.png";
import loginAvatar4 from "../images/Login Page Images/avatar-4.png";
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

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationLink, setShowVerificationLink] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string>("");
  const [platformStats, setPlatformStats] = useState({
    activeJobs: 0,
    candidates: 0,
    companies: 0,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const apiBaseUrl = getApiBaseUrl();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userDataStr = localStorage.getItem("userData");

    if (token && userDataStr) {
      try {
        JSON.parse(userDataStr);
        navigate("/home");
      } catch (error) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (location.state?.message) {
      setStatusMessage(location.state.message);
      setStatusType(location.state.verifiedSuccess ? "success" : "error");
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  useEffect(() => {
    if (!statusMessage || showVerificationLink) return;
    const timerId = window.setTimeout(() => {
      setStatusMessage(null);
      setStatusType(null);
    }, 4000);

    return () => window.clearTimeout(timerId);
  }, [statusMessage, showVerificationLink]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "email") {
      setShowVerificationLink(false);
    }
  };

  const handleGoToVerification = () => {
    if (verificationEmail) {
      navigate("/verify-email", {
        state: {
          email: verificationEmail,
          message: "Please enter verification code sent to your email",
          fromLogin: true,
        },
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatusMessage(null);
    setStatusType(null);
    setIsSubmitting(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setStatusMessage("Please enter a valid email address");
      setStatusType("error");
      setIsSubmitting(false);
      return;
    }

    if (!formData.password.trim()) {
      setStatusMessage("Please enter your password");
      setStatusType("error");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresVerification) {
          setStatusMessage(data.message || "Please verify your email first.");
          setStatusType("error");
          setShowVerificationLink(true);
          setVerificationEmail(data.email || formData.email);
          setIsSubmitting(false);
          return;
        }

        setStatusMessage(data.message || "Login failed");
        setStatusType("error");
        setIsSubmitting(false);
        return;
      }

      setStatusMessage("Login successful! Redirecting...");
      setStatusType("success");

      if (data.token) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userData", JSON.stringify(data.user));
        localStorage.removeItem("profilePictureBase64");
        localStorage.removeItem("profilePictureFileName");
        setFormData({ email: "", password: "" });

        setTimeout(() => {
          navigate("/home");
        }, 500);
      }
    } catch (error) {
      setStatusMessage("Something went wrong. Please try again.");
      setStatusType("error");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <main id="login" className="login-page-wrap">
        <section className="login-left-panel">
          <div className="login-left-circle-1" />
          <div className="login-left-circle-2" />
          <div className="login-dot-grid" />

          <div className="login-left-top">
            <div className="login-left-badge">
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

            <div className="login-stat-row">
              <div className="login-stat-item">
                <span className="login-stat-num">
                  {platformStats.activeJobs.toLocaleString()}
                </span>
                <span className="login-stat-lbl">Active Jobs</span>
              </div>
              <div className="login-stat-item">
                <span className="login-stat-num">
                  {platformStats.candidates.toLocaleString()}
                </span>
                <span className="login-stat-lbl">Candidates</span>
              </div>
              <div className="login-stat-item">
                <span className="login-stat-num">
                  {platformStats.companies.toLocaleString()}
                </span>
                <span className="login-stat-lbl">Companies</span>
              </div>
            </div>
          </div>

          <div className="login-illustration">
            <div className="login-ill-scene">
              <div className="login-ill-main-card">
                <div className="login-ill-card-top">
                  <div className="login-ill-co-logo">
                    <img src={searchIcon} alt="Search" />
                  </div>
                  <div>
                    <div className="login-ill-co-name">Google Inc.</div>
                    <div className="login-ill-role">Sr. UX/UI Designer</div>
                  </div>
                </div>
                <div className="login-ill-tags">
                  <span className="login-ill-tag">Full-Time</span>
                  <span className="login-ill-tag green">Remote</span>
                  <span className="login-ill-tag">Kathmandu</span>
                </div>
                <div className="login-ill-card-foot">
                  <div className="login-ill-salary">
                    $4,500 <small>/ mo</small>
                  </div>
                  <div className="login-ill-apply">Apply Now</div>
                </div>
              </div>

              <div className="login-float-card top">
                <div className="login-fc-label">New Applicants</div>
                <div className="login-avatar-stack">
                  <span className="login-av">
                    <img src={loginAvatar1} alt="" />
                  </span>
                  <span className="login-av">
                    <img src={loginAvatar2} alt="" />
                  </span>
                  <span className="login-av">
                    <img src={loginAvatar3} alt="" />
                  </span>
                  <span className="login-av">
                    <img src={loginAvatar4} alt="" />
                  </span>
                  <span className="login-av-more">+</span>
                </div>
                <div className="login-fc-count">1.7k+ applicants</div>
                <div className="login-fc-sub">This week</div>
              </div>

              <div className="login-float-card bottom">
                <div className="login-fc-label">Your AI Match</div>
                <div className="login-match-num">96%</div>
                <div className="login-match-bar-bg">
                  <div className="login-match-bar" />
                </div>
                <div className="login-match-sub">Excellent fit for this role</div>
              </div>
            </div>
          </div>
        </section>

        <section className="login-right-panel">
          <div className="login-form-box">
            <div className="login-form-header">
              <div className="login-form-kicker">Welcome back</div>
              <h2>Login to HireLink</h2>
              <p>
                Don&apos;t have an account? <Link to="/register">Register for free</Link>
              </p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-field">
                <label htmlFor="email">Email Address *</label>
                <div className="login-input-wrap">
                  <span className="login-inp-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="password">Password *</label>
                <div className="login-input-wrap">
                  <span className="login-inp-icon">
                    <svg viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="login-toggle-pw"
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

              <div className="login-form-meta">
                <Link to="/forgot-password" className="login-forgot">
                  Forgot Password?
                </Link>
              </div>

              <button type="submit" className="login-btn" disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Login Now"}
              </button>

              {showVerificationLink && verificationEmail && (
                <button
                  type="button"
                  className="login-verification-inline-btn"
                  onClick={handleGoToVerification}
                >
                  Go to Verification Page
                </button>
              )}

              <p className="login-reg-link">
                Don&apos;t have an account? <Link to="/register">Register for free</Link>
              </p>

              <div className="login-trust-row">
                <div className="login-trust-item">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  SSL Secured
                </div>
                <div className="login-trust-item">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Verified Platform
                </div>
                <div className="login-trust-item">
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                  24h Support
                </div>
              </div>


            </form>
          </div>
        </section>
      </main>

      {statusMessage && (
        <div className={`login-toast ${statusType === "success" ? "success" : "error"}`}>
          <div className="login-toast-head">
            {statusType === "success" ? "Success" : "Error"}
          </div>
          <p className="login-toast-message">{statusMessage}</p>
          <button
            type="button"
            className="login-toast-close"
            aria-label="Close toast"
            onClick={() => {
              setStatusMessage(null);
              setStatusType(null);
              setShowVerificationLink(false);
            }}
          >
            x
          </button>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Login;



