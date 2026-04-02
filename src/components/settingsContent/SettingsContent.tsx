import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type SettingsContentProps = {
  title: string;
  subtitle: string;
};

const API_BASE_URL =
  String(import.meta.env.VITE_API_BASE_URL || "").trim() ||
  "http://localhost:5000/api";

const parseJsonResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  const text = await response.text();
  if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
    throw new Error("API returned HTML instead of JSON. Check API base URL.");
  }
  return {};
};

const SettingsContent = ({ title, subtitle }: SettingsContentProps) => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showToast, setShowToast] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    navigate("/login", { replace: true });
  };

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setShowToast(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill all password fields.");
      setShowToast(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      setShowToast(true);
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Please login again.");
      setShowToast(true);
      navigate("/login");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/password/change`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(data?.message || "Failed to change password");
      }

      setSuccess(data?.message || "Password changed successfully.");
      setShowToast(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err?.message || "Failed to change password");
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!showToast) return;
    const timer = window.setTimeout(() => {
      setShowToast(false);
      setError("");
      setSuccess("");
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [showToast]);

  return (
    <section className="settings-page-shell">
      <header className="settings-page-header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </header>

      <div className="settings-page-grid">
        <article className="settings-page-card">
          <h2>Change Password</h2>
          <p>Enter your current password and set a new one.</p>

          <form onSubmit={handleChangePassword} className="settings-page-form">
            <label htmlFor="currentPassword">Current Password *</label>
            <div className="settings-password-wrap">
              <input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="settings-toggle-pw"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>

            <label htmlFor="newPassword">New Password *</label>
            <div className="settings-password-wrap">
              <input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="settings-toggle-pw"
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>

            <label htmlFor="confirmPassword">Confirm New Password *</label>
            <div className="settings-password-wrap">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="settings-toggle-pw"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>

            <button
              type="submit"
              className="settings-page-btn primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Change Password"}
            </button>
          </form>

        </article>

        <article className="settings-page-card">
          <h2>Logout</h2>
          <p>Click the button below to securely logout from your account.</p>

          <div className="settings-page-actions">
            <button
              type="button"
              className="settings-page-btn danger"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </article>
      </div>

      {showToast && (error || success) && (
        <div className={`settings-toast ${success ? "success" : "error"}`}>
          <div className="settings-toast-head">{success ? "Success" : "Error"}</div>
          <p className="settings-toast-message">{success || error}</p>
          <button
            type="button"
            className="settings-toast-close"
            onClick={() => {
              setShowToast(false);
              setError("");
              setSuccess("");
            }}
            aria-label="Close toast"
          >
            x
          </button>
        </div>
      )}
    </section>
  );
};

export default SettingsContent;


