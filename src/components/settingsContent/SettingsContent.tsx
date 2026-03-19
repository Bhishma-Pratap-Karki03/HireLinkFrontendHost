import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type SettingsContentProps = {
  title: string;
  subtitle: string;
};

const SettingsContent = ({ title, subtitle }: SettingsContentProps) => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    navigate("/login");
  };

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Please login again.");
      navigate("/login");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("http://localhost:5000/api/password/change", {
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

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to change password");
      }

      setSuccess(data?.message || "Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err?.message || "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <label htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />

            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Enter new password"
              autoComplete="new-password"
            />

            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />

            <button
              type="submit"
              className="settings-page-btn primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Change Password"}
            </button>
          </form>

          {error && <div className="settings-page-feedback error">{error}</div>}
          {success && (
            <div className="settings-page-feedback success">{success}</div>
          )}
        </article>

        <article className="settings-page-card">
          <h2>Account Actions</h2>
          <p>Manage your current session and password recovery.</p>

          <div className="settings-page-actions">
            <Link to="/forgot-password" className="settings-page-btn outline">
              Forgot Password
            </Link>
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
    </section>
  );
};

export default SettingsContent;
