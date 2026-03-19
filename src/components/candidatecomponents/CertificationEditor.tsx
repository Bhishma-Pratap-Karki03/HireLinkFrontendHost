// CertificationEditor.tsx
import React, { useState, useEffect } from "react";
import "../../styles/CertificationEditor.css";

// Import images
import closeIcon from "../../images/Candidate Profile Page Images/corss icon.png";

// Define the Certification interface
export interface Certification {
  _id?: string;
  certificationName: string;
  issuingOrganization: string;
  credentialId: string;
  issueDate: string;
  expirationDate: string | null;
  doesNotExpire: boolean;
  credentialUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

// Define the props interface for the component
interface CertificationEditorProps {
  certification: Certification | null; // Current certification data (null for adding new)
  isOpen: boolean; // Whether the modal is open
  onClose: () => void; // Function to close the modal
  onSave: (certificationData: Certification) => Promise<void>; // Function to save the certification
}

/**
 * CertificationEditor Component
 * A modal for adding/editing certifications
 */
const CertificationEditor: React.FC<CertificationEditorProps> = ({
  certification,
  isOpen,
  onClose,
  onSave,
}) => {
  // State for form fields
  const [certificationName, setCertificationName] = useState<string>("");
  const [issuingOrganization, setIssuingOrganization] = useState<string>("");
  const [credentialId, setCredentialId] = useState<string>("");
  const [issueDate, setIssueDate] = useState<string>("");
  const [expirationDate, setExpirationDate] = useState<string>("");
  const [doesNotExpire, setDoesNotExpire] = useState<boolean>(false);
  const [credentialUrl, setCredentialUrl] = useState<string>("");

  // State for loading/saving indicator
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (certification) {
        // Editing existing certification
        setCertificationName(certification.certificationName || "");
        setIssuingOrganization(certification.issuingOrganization || "");
        setCredentialId(certification.credentialId || "");
        setIssueDate(
          certification.issueDate
            ? new Date(certification.issueDate).toISOString().split("T")[0]
            : ""
        );
        setExpirationDate(
          certification.expirationDate
            ? new Date(certification.expirationDate).toISOString().split("T")[0]
            : ""
        );
        setDoesNotExpire(certification.doesNotExpire || false);
        setCredentialUrl(certification.credentialUrl || "");
      } else {
        // Adding new certification
        const today = new Date().toISOString().split("T")[0];
        setCertificationName("");
        setIssuingOrganization("");
        setCredentialId("");
        setIssueDate(today);
        setExpirationDate("");
        setDoesNotExpire(false);
        setCredentialUrl("");
      }
      setIsSaving(false);
      setErrors({});
      setSubmitError("");
    }
  }, [isOpen, certification]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleCancel();
      }
    };

    // Add event listener for Escape key
    document.addEventListener("keydown", handleEscape);

    // Cleanup event listener
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    // Cleanup function to restore scroll
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!certificationName.trim()) {
      newErrors.certificationName = "Certification name is required";
    }

    if (!issuingOrganization.trim()) {
      newErrors.issuingOrganization = "Issuing organization is required";
    }

    if (!issueDate) {
      newErrors.issueDate = "Issue date is required";
    }

    if (!doesNotExpire && expirationDate) {
      const issue = new Date(issueDate);
      const expiration = new Date(expirationDate);
      if (expiration < issue) {
        newErrors.expirationDate =
          "Expiration date cannot be before issue date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Save the certification
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setSubmitError("");

      const certificationData: Certification = {
        _id: certification?._id,
        certificationName: certificationName.trim(),
        issuingOrganization: issuingOrganization.trim(),
        credentialId: credentialId.trim(),
        issueDate: issueDate,
        expirationDate: doesNotExpire ? null : expirationDate || null,
        doesNotExpire,
        credentialUrl: credentialUrl.trim(),
      };

      await onSave(certificationData);
      onClose();
    } catch (error) {
      console.error("Error saving certification:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Failed to save certification"
      );
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Cancel editing and close modal
   */
  const handleCancel = () => {
    setErrors({});
    setSubmitError("");
    onClose();
  };

  /**
   * Handle click on overlay to close modal
   */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  /**
   * Handle does not expire checkbox change
   */
  const handleDoesNotExpireChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDoesNotExpire(e.target.checked);
    if (e.target.checked) {
      setExpirationDate("");
    }
  };

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  return (
    <div className="certification-modal-overlay" onClick={handleOverlayClick}>
      <div
        className="certification-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Top right corner */}
        <button
          className="certification-close-button"
          aria-label="Close editor"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <img src={closeIcon} alt="Close Icon" />
        </button>

        <div className="certification-modal-content">
          {/* Header Section */}
          <header className="certification-modal-header">
            <h2 className="certification-modal-title">
              {certification ? "Edit Certification" : "Add Certification"}
            </h2>
            <p className="certification-modal-subtitle">
              {certification
                ? "Update your certification details"
                : "Add a new certification to your profile"}
            </p>
          </header>

          {/* Form Section */}
          <div className="certification-form">
            <div className="certification-form-grid">
              {/* Certification Name */}
              <div className="certification-form-group">
                <label className="certification-form-label" data-required="*">
                  Certification Name
                </label>
                <input
                  type="text"
                  value={certificationName}
                  onChange={(e) => setCertificationName(e.target.value)}
                  placeholder="e.g., AWS Certified Solutions Architect, Google Professional Cloud Architect"
                  className={`certification-form-input ${
                    errors.certificationName ? "error" : ""
                  }`}
                  disabled={isSaving}
                />
                {errors.certificationName && (
                  <p className="certification-form-error">
                    {errors.certificationName}
                  </p>
                )}
              </div>

              {/* Issuing Organization */}
              <div className="certification-form-group">
                <label className="certification-form-label" data-required="*">
                  Issuing Organization
                </label>
                <input
                  type="text"
                  value={issuingOrganization}
                  onChange={(e) => setIssuingOrganization(e.target.value)}
                  placeholder="e.g., Amazon Web Services, Google, Microsoft"
                  className={`certification-form-input ${
                    errors.issuingOrganization ? "error" : ""
                  }`}
                  disabled={isSaving}
                />
                {errors.issuingOrganization && (
                  <p className="certification-form-error">
                    {errors.issuingOrganization}
                  </p>
                )}
              </div>

              {/* Credential ID */}
              <div className="certification-form-group">
                <label className="certification-form-label">
                  Credential ID
                </label>
                <input
                  type="text"
                  value={credentialId}
                  onChange={(e) => setCredentialId(e.target.value)}
                  placeholder="e.g., AWS-123456, GOOG-789012"
                  className="certification-form-input"
                  disabled={isSaving}
                />
                <p className="certification-field-help">
                  Optional - Your unique certification ID
                </p>
              </div>

              {/* Issue Date */}
              <div className="certification-form-group">
                <label className="certification-form-label" data-required="*">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className={`certification-form-input ${
                    errors.issueDate ? "error" : ""
                  }`}
                  disabled={isSaving}
                  max={new Date().toISOString().split("T")[0]}
                />
                {errors.issueDate && (
                  <p className="certification-form-error">{errors.issueDate}</p>
                )}
              </div>

              {/* Does Not Expire Checkbox */}
              <div className="certification-form-group certification-checkbox-group">
                <label className="certification-checkbox-label">
                  <input
                    type="checkbox"
                    checked={doesNotExpire}
                    onChange={handleDoesNotExpireChange}
                    disabled={isSaving}
                    className="certification-checkbox"
                  />
                  <span className="certification-checkbox-text">
                    This certification does not expire
                  </span>
                </label>
              </div>

              {/* Expiration Date */}
              <div className="certification-form-group">
                <label className="certification-form-label">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className={`certification-form-input ${
                    errors.expirationDate ? "error" : ""
                  }`}
                  disabled={isSaving || doesNotExpire}
                  min={issueDate}
                />
                {errors.expirationDate && (
                  <p className="certification-form-error">
                    {errors.expirationDate}
                  </p>
                )}
                <p className="certification-field-help">
                  Leave empty if certification does not expire
                </p>
              </div>

              {/* Credential URL */}
              <div className="certification-form-group certification-full-width">
                <label className="certification-form-label">
                  Credential URL
                </label>
                <input
                  type="url"
                  value={credentialUrl}
                  onChange={(e) => setCredentialUrl(e.target.value)}
                  placeholder="https://www.credly.com/badges/..."
                  className="certification-form-input"
                  disabled={isSaving}
                />
                <p className="certification-field-help">
                  Optional - Link to your digital credential or badge
                </p>
              </div>
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className="certification-submit-error">
                <span>{submitError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="certification-action-buttons">
              <button
                className="certification-btn certification-btn-cancel"
                onClick={handleCancel}
                disabled={isSaving}
                type="button"
              >
                Cancel
              </button>
              <button
                className="certification-btn certification-btn-save"
                onClick={handleSubmit}
                disabled={isSaving}
                type="button"
              >
                {isSaving
                  ? "Saving..."
                  : certification
                  ? "Update Certification"
                  : "Add Certification"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificationEditor;
