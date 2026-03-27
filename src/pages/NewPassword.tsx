import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/NewPassword.css";

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

const parseJsonResponse = async <T,>(response: Response): Promise<T> => {
  const raw = await response.text();
  if (!raw) return {} as T;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("Server returned invalid response. Please try again.");
  }
};

const NewPassword = () => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const apiBaseUrl = getApiBaseUrl();

  const email = location.state?.email || "";
  const resetToken = location.state?.token || "";
  const initialMessage = location.state?.message || "";
  const [statusMessage, setStatusMessage] = useState(initialMessage);
  const [statusType, setStatusType] = useState<"success" | "error">(
    initialMessage ? "success" : "error"
  );

  useEffect(() => {
    if (!statusMessage || isLoading) return;
    const timerId = window.setTimeout(() => {
      setStatusMessage("");
    }, 4000);

    return () => window.clearTimeout(timerId);
  }, [statusMessage, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.password.trim()) {
      setStatusMessage("Please enter a new password");
      setStatusType("error");
      return;
    }

    if (!formData.confirmPassword.trim()) {
      setStatusMessage("Please confirm your password");
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
        formData.password
      )
    ) {
      setStatusMessage(
        "Password must contain uppercase, lowercase, number, and special character"
      );
      setStatusType("error");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setStatusMessage("Passwords do not match");
      setStatusType("error");
      return;
    }

    if (!resetToken) {
      setStatusMessage("Invalid reset token. Please request a new reset link.");
      setStatusType("error");
      return;
    }

    setIsLoading(true);
    setStatusMessage("");

    try {
      const response = await fetch(`${apiBaseUrl}/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken,
          newPassword: formData.password,
        }),
      });

      const data = await parseJsonResponse<{ message?: string }>(response);

      if (!response.ok) {
        setStatusMessage(data.message || "Failed to reset password");
        setStatusType("error");
        setIsLoading(false);
        return;
      }

      setStatusMessage(
        "Password has been reset successfully! Redirecting to login..."
      );
      setStatusType("success");

      setFormData({
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/login", {
          state: {
            message:
              "Password reset successful! You can now login with your new password.",
            verifiedSuccess: true,
          },
        });
      }, 500);
    } catch (error) {
      console.error("Error resetting password:", error);
      setStatusMessage("Something went wrong. Please try again.");
      setStatusType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="new-password-page-wrap">
        <section className="new-password-left-panel">
          <div className="new-password-left-circle-1" />
          <div className="new-password-left-circle-2" />
          <div className="new-password-dot-grid" />

          <div className="new-password-left-top">
            <div className="new-password-left-badge">
              <span className="new-password-badge-pulse" />
              Password Recovery
            </div>
            <h1>
              Create Your
              <br />
              <span>New Password</span>
            </h1>
            <p>
              Set a strong password to protect your HireLink account and
              continue securely.
            </p>
          </div>

          <div className="new-password-steps">
            <div className="new-password-step">
              <div className="new-password-step-num">01</div>
              <div className="new-password-step-body">
                <strong>Enter new password</strong>
                <span>Use at least 8 characters.</span>
              </div>
            </div>
            <div className="new-password-step-connector" />
            <div className="new-password-step">
              <div className="new-password-step-num">02</div>
              <div className="new-password-step-body">
                <strong>Confirm password</strong>
                <span>Make sure both fields match.</span>
              </div>
            </div>
            <div className="new-password-step-connector" />
            <div className="new-password-step">
              <div className="new-password-step-num">03</div>
              <div className="new-password-step-body">
                <strong>Login again</strong>
                <span>Use your new password to access account.</span>
              </div>
            </div>
          </div>

        </section>

        <section className="new-password-right-panel">
          <div className="new-password-form-box">
            <div className="new-password-lock-icon">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <div className="new-password-form-header">
              <div className="new-password-form-kicker">Set Password</div>
              <h2>Set New Password</h2>
              <p>
                {email ? `Set a new password for ${email}` : "Set your new password."}
              </p>
            </div>

            <form className="new-password-form" onSubmit={handleSubmit}>
              <div className="new-password-field">
                <label htmlFor="new-password-input">
                  New Password <span>*</span>
                </label>
                <div className="new-password-input-wrap">
                  <span className="new-password-inp-icon">
                    <svg viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="new-password-input"
                    type="password"
                    name="password"
                    placeholder="Enter new password"
                    className="new-password-form-input"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="new-password-field">
                <label htmlFor="confirm-password-input">
                  Confirm Password <span>*</span>
                </label>
                <div className="new-password-input-wrap">
                  <span className="new-password-inp-icon">
                    <svg viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="confirm-password-input"
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    className="new-password-form-input"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="new-password-btn-submit"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>

            <div className="new-password-form-footer">
              <Link to="/login" className="new-password-back-link">
                Back to Login
              </Link>
              <span className="new-password-footer-sep">|</span>
              <Link to="/forgot-password" className="new-password-back-link">
                Back to Forgot Password
              </Link>
            </div>

            <div className="new-password-trust-row">
              <div className="new-password-trust-item">
                <svg viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                SSL Secured
              </div>
              <div className="new-password-trust-item">
                <svg viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Strong Validation
              </div>
              <div className="new-password-trust-item">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
                24h Support
              </div>
            </div>
          </div>
        </section>
      </main>

      {statusMessage && (
        <div
          className={`new-password-toast ${
            statusType === "success" ? "success" : "error"
          }`}
        >
          <div className="new-password-toast-head">
            {statusType === "success" ? "Success" : "Error"}
          </div>
          <p className="new-password-toast-message">{statusMessage}</p>
          <button
            type="button"
            className="new-password-toast-close"
            aria-label="Close toast"
            onClick={() => setStatusMessage("")}
          >
            x
          </button>
        </div>
      )}

      <Footer />
    </>
  );
};

export default NewPassword;


