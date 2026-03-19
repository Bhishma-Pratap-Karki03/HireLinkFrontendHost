import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error">("success");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setStatusMessage("Please enter your email address");
      setStatusType("error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatusMessage("Please enter a valid email address");
      setStatusType("error");
      return;
    }

    setIsLoading(true);
    setStatusMessage("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/password/request-reset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresVerification) {
          setStatusMessage(
            "Please verify your email first before resetting password."
          );
          setStatusType("error");
          setIsLoading(false);
          return;
        }

        setStatusMessage(data.message || "Failed to send reset code");
        setStatusType("error");
        setIsLoading(false);
        return;
      }

      setStatusMessage("Password reset code sent! Redirecting to verification...");
      setStatusType("success");

      setTimeout(() => {
        navigate("/verify-email", {
          state: {
            email,
            message: "Please enter the password reset code sent to your email",
            isPasswordReset: true,
          },
        });
      }, 500);
    } catch (error) {
      console.error("Error requesting password reset:", error);
      setStatusMessage("Something went wrong. Please try again.");
      setStatusType("error");
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main id="forgot-password" className="forgot-password-page-wrap">
        <section className="forgot-password-left-panel">
          <div className="forgot-password-left-circle-1" />
          <div className="forgot-password-left-circle-2" />
          <div className="forgot-password-dot-grid" />

          <div className="forgot-password-left-top">
            <div className="forgot-password-left-badge">
              <span className="forgot-password-badge-pulse" />
              Account Recovery
            </div>
            <h1>
              Quick &amp; Secure
              <br />
              <span>Password Reset</span>
            </h1>
            <p>
              Don&apos;t worry. Enter your registered email and we&apos;ll send
              you a reset code in seconds.
            </p>
          </div>

          <div className="forgot-password-steps">
            <div className="forgot-password-step">
              <div className="forgot-password-step-num">01</div>
              <div className="forgot-password-step-body">
                <strong>Enter your email</strong>
                <span>The one linked to your HireLink account.</span>
              </div>
            </div>
            <div className="forgot-password-step-connector" />
            <div className="forgot-password-step">
              <div className="forgot-password-step-num">02</div>
              <div className="forgot-password-step-body">
                <strong>Check your inbox</strong>
                <span>We&apos;ll send a 6-digit verification code.</span>
              </div>
            </div>
            <div className="forgot-password-step-connector" />
            <div className="forgot-password-step">
              <div className="forgot-password-step-num">03</div>
              <div className="forgot-password-step-body">
                <strong>Reset your password</strong>
                <span>Create a new secure password instantly.</span>
              </div>
            </div>
          </div>

        </section>

        <section className="forgot-password-right-panel">
          <div className="forgot-password-form-box">
            <div className="forgot-password-lock-icon">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <div className="forgot-password-form-header">
              <div className="forgot-password-form-kicker">Account Recovery</div>
              <h2>Forgot your password?</h2>
              <p>
                Enter your email and we&apos;ll send your reset code right away.
              </p>
            </div>

            {statusMessage && (
              <p
                className={`status-message ${
                  statusType === "success" ? "status-success" : "status-error"
                }`}
              >
                {statusMessage}
              </p>
            )}

            <form className="forgot-password-form" onSubmit={handleSubmit}>
              <div className="forgot-password-field">
                <label htmlFor="forgot-password-email">
                  Email Address <span>*</span>
                </label>
                <div
                  className={`forgot-password-input-wrap ${
                    statusType === "error" && statusMessage
                      ? "has-error"
                      : ""
                  }`}
                >
                  <span className="forgot-password-inp-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <input
                    id="forgot-password-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`forgot-password-btn-submit ${
                  isLoading ? "loading" : ""
                }`}
                disabled={isLoading}
              >
                <span className="forgot-password-btn-lbl">
                  {isLoading ? "Sending..." : "Send Reset Code"}
                </span>
                <span className="forgot-password-btn-arrow">
                  <svg viewBox="0 0 24 24">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </button>
            </form>

            <div className="forgot-password-form-footer">
              <Link to="/login" className="forgot-password-back-link">
                <svg viewBox="0 0 24 24">
                  <polyline points="19 12 5 12" />
                  <polyline points="12 5 5 12 12 19" />
                </svg>
                Back to Login
              </Link>
              <span className="forgot-password-footer-sep">|</span>
              <span className="forgot-password-footer-note">
                New here? <Link to="/register">Create account</Link>
              </span>
            </div>

            <div className="forgot-password-trust-row">
              <div className="forgot-password-trust-item">
                <svg viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                SSL Secured
              </div>
              <div className="forgot-password-trust-item">
                <svg viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Instant Delivery
              </div>
              <div className="forgot-password-trust-item">
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

      <Footer />
    </>
  );
};

export default ForgotPassword;


