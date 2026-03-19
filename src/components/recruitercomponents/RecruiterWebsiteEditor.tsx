import React, { useState, useEffect } from "react";
import "../../styles/RecruiterWebsiteEditor.css";

// Import images
import closeIcon from "../../images/Candidate Profile Page Images/corss icon.png";
import websiteIcon from "../../images/Recruiter Profile Page Images/6_229.svg";
import linkedinIcon from "../../images/Recruiter Profile Page Images/6_237.svg";
import instagramIcon from "../../images/Recruiter Profile Page Images/6_245.svg";
import facebookIcon from "../../images/Recruiter Profile Page Images/6_253.svg";

interface RecruiterWebsiteEditorProps {
  userData: {
    websiteUrl: string;
    linkedinUrl: string;
    instagramUrl: string;
    facebookUrl: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    websiteUrl: string;
    linkedinUrl: string;
    instagramUrl: string;
    facebookUrl: string;
  }) => Promise<void>;
}

const RecruiterWebsiteEditor: React.FC<RecruiterWebsiteEditorProps> = ({
  userData,
  isOpen,
  onClose,
  onSave,
}) => {
  const [websiteUrl, setWebsiteUrl] = useState(userData.websiteUrl || "");
  const [linkedinUrl, setLinkedinUrl] = useState(userData.linkedinUrl || "");
  const [instagramUrl, setInstagramUrl] = useState(userData.instagramUrl || "");
  const [facebookUrl, setFacebookUrl] = useState(userData.facebookUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{
    websiteUrl?: string;
    linkedinUrl?: string;
    instagramUrl?: string;
    facebookUrl?: string;
  }>({});

  useEffect(() => {
    if (isOpen) {
      setWebsiteUrl(userData.websiteUrl || "");
      setLinkedinUrl(userData.linkedinUrl || "");
      setInstagramUrl(userData.instagramUrl || "");
      setFacebookUrl(userData.facebookUrl || "");
      setErrors({});
    }
  }, [isOpen, userData]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const validateUrl = (url: string, fieldName: string): string | undefined => {
    if (!url.trim()) return undefined; // Empty is okay (optional field)

    try {
      // Add https:// if not present for validation
      let testUrl = url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        testUrl = "https://" + url;
      }

      new URL(testUrl);
      return undefined; // Valid URL
    } catch (error) {
      return `Please enter a valid ${fieldName} URL`;
    }
  };

  const formatUrl = (url: string): string => {
    if (!url.trim()) return "";

    // Remove protocol for display
    return url.replace(/^(https?:\/\/)?(www\.)?/, "");
  };

  const handleSubmit = async () => {
    const newErrors: {
      websiteUrl?: string;
      linkedinUrl?: string;
      instagramUrl?: string;
      facebookUrl?: string;
    } = {};

    // Validate URLs
    const websiteError = validateUrl(websiteUrl, "website");
    if (websiteError) newErrors.websiteUrl = websiteError;

    const linkedinError = validateUrl(linkedinUrl, "LinkedIn");
    if (linkedinError) newErrors.linkedinUrl = linkedinError;

    const instagramError = validateUrl(instagramUrl, "Instagram");
    if (instagramError) newErrors.instagramUrl = instagramError;

    const facebookError = validateUrl(facebookUrl, "Facebook");
    if (facebookError) newErrors.facebookUrl = facebookError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        websiteUrl: websiteUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        instagramUrl: instagramUrl.trim(),
        facebookUrl: facebookUrl.trim(),
      });
      onClose();
    } catch (error) {
      console.error("Error saving website information:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setWebsiteUrl(userData.websiteUrl || "");
    setLinkedinUrl(userData.linkedinUrl || "");
    setInstagramUrl(userData.instagramUrl || "");
    setFacebookUrl(userData.facebookUrl || "");
    setErrors({});
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="recruiter-website-modal-overlay"
      onClick={handleOverlayClick}
    >
      <div
        className="recruiter-website-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="recruiter-website-close-button"
          aria-label="Close"
          onClick={handleCancel}
        >
          <img src={closeIcon} alt="Close Icon" />
        </button>

        <div className="recruiter-website-modal-content">
          {/* Header Section */}
          <header className="recruiter-website-modal-header">
            <h2 className="recruiter-website-modal-title">
              Website and Social Media
            </h2>
            <p className="recruiter-website-modal-subtitle">
              Update your company's online presence
            </p>
          </header>

          {/* Form Section */}
          <div className="recruiter-website-form">
            <div className="recruiter-website-input-group">
              {/* Website Field */}
              <div className="recruiter-website-field">
                <div className="recruiter-website-field-header">
                  <img src={websiteIcon} alt="Website" />
                  <label className="recruiter-website-label">Website URL</label>
                </div>
                <div className="recruiter-website-input-wrapper">
                  <span className="recruiter-website-url-prefix">https://</span>
                  <input
                    type="text"
                    value={formatUrl(websiteUrl)}
                    onChange={(e) => {
                      setWebsiteUrl(e.target.value);
                      if (errors.websiteUrl)
                        setErrors({ ...errors, websiteUrl: undefined });
                    }}
                    placeholder="www.yourcompany.com"
                    className={`recruiter-website-input ${
                      errors.websiteUrl ? "error" : ""
                    }`}
                    disabled={isSaving}
                  />
                </div>
                {errors.websiteUrl && (
                  <p className="recruiter-website-error">{errors.websiteUrl}</p>
                )}
                <p className="recruiter-website-field-help">
                  Your company's official website
                </p>
              </div>

              {/* LinkedIn Field */}
              <div className="recruiter-website-field">
                <div className="recruiter-website-field-header">
                  <img src={linkedinIcon} alt="LinkedIn" />
                  <label className="recruiter-website-label">
                    LinkedIn URL
                  </label>
                </div>
                <div className="recruiter-website-input-wrapper">
                  <span className="recruiter-website-url-prefix">
                    linkedin.com/
                  </span>
                  <input
                    type="text"
                    value={formatUrl(linkedinUrl).replace("linkedin.com/", "")}
                    onChange={(e) => {
                      setLinkedinUrl(e.target.value);
                      if (errors.linkedinUrl)
                        setErrors({ ...errors, linkedinUrl: undefined });
                    }}
                    placeholder="company/yourcompany"
                    className={`recruiter-website-input ${
                      errors.linkedinUrl ? "error" : ""
                    }`}
                    disabled={isSaving}
                  />
                </div>
                {errors.linkedinUrl && (
                  <p className="recruiter-website-error">
                    {errors.linkedinUrl}
                  </p>
                )}
                <p className="recruiter-website-field-help">
                  Your company's LinkedIn page
                </p>
              </div>

              {/* Instagram Field */}
              <div className="recruiter-website-field">
                <div className="recruiter-website-field-header">
                  <img src={instagramIcon} alt="Instagram" />
                  <label className="recruiter-website-label">
                    Instagram URL
                  </label>
                </div>
                <div className="recruiter-website-input-wrapper">
                  <span className="recruiter-website-url-prefix">
                    instagram.com/
                  </span>
                  <input
                    type="text"
                    value={formatUrl(instagramUrl).replace(
                      "instagram.com/",
                      ""
                    )}
                    onChange={(e) => {
                      setInstagramUrl(e.target.value);
                      if (errors.instagramUrl)
                        setErrors({ ...errors, instagramUrl: undefined });
                    }}
                    placeholder="yourcompany"
                    className={`recruiter-website-input ${
                      errors.instagramUrl ? "error" : ""
                    }`}
                    disabled={isSaving}
                  />
                </div>
                {errors.instagramUrl && (
                  <p className="recruiter-website-error">
                    {errors.instagramUrl}
                  </p>
                )}
                <p className="recruiter-website-field-help">
                  Your company's Instagram profile
                </p>
              </div>

              {/* Facebook Field */}
              <div className="recruiter-website-field">
                <div className="recruiter-website-field-header">
                  <img src={facebookIcon} alt="Facebook" />
                  <label className="recruiter-website-label">
                    Facebook URL
                  </label>
                </div>
                <div className="recruiter-website-input-wrapper">
                  <span className="recruiter-website-url-prefix">
                    facebook.com/
                  </span>
                  <input
                    type="text"
                    value={formatUrl(facebookUrl).replace("facebook.com/", "")}
                    onChange={(e) => {
                      setFacebookUrl(e.target.value);
                      if (errors.facebookUrl)
                        setErrors({ ...errors, facebookUrl: undefined });
                    }}
                    placeholder="yourcompany"
                    className={`recruiter-website-input ${
                      errors.facebookUrl ? "error" : ""
                    }`}
                    disabled={isSaving}
                  />
                </div>
                {errors.facebookUrl && (
                  <p className="recruiter-website-error">
                    {errors.facebookUrl}
                  </p>
                )}
                <p className="recruiter-website-field-help">
                  Your company's Facebook page
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="recruiter-website-action-buttons">
              <button
                className="recruiter-website-btn recruiter-website-btn-cancel"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="recruiter-website-btn recruiter-website-btn-save"
                onClick={handleSubmit}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterWebsiteEditor;
