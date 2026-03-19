import React, { useState, useEffect } from "react";
import "../../styles/PersonalInfoEditor.css";

// Import images
import closeIcon from "../../images/Candidate Profile Page Images/corss icon.png";

interface PersonalInfoEditorProps {
  userData: {
    email: string;
    phone: string;
    address: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { phone: string; address: string }) => Promise<void>; // Important: Promise<void>
}

// Helper function to truncate filename to 10 characters
const truncateFileName = (fileName: string, maxLength: number = 10): string => {
  if (!fileName) return "";

  // Get file extension
  const lastDotIndex = fileName.lastIndexOf(".");
  const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : "";
  const nameWithoutExt =
    lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;

  // Truncate name part if needed
  if (nameWithoutExt.length > maxLength) {
    return nameWithoutExt.substring(0, maxLength) + "..." + extension;
  }

  return fileName;
};

const PersonalInfoEditor: React.FC<PersonalInfoEditorProps> = ({
  userData,
  isOpen,
  onClose,
  onSave,
}) => {
  const [phone, setPhone] = useState(userData.phone || "");
  const [address, setAddress] = useState(userData.address || "");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string }>({});
  const [profilePictureFileName, setProfilePictureFileName] =
    useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setPhone(userData.phone || "");
      setAddress(userData.address || "");
      setErrors({});

      // Get profile picture filename from localStorage
      let storedFileName = localStorage.getItem("profilePictureFileName") || "";
      const userDataStr = localStorage.getItem("userData");
      if (!storedFileName && userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          if (userData.profilePictureFileName) {
            storedFileName = userData.profilePictureFileName;
          }
        } catch (e) {
          console.error("Error parsing userData:", e);
        }
      }
      setProfilePictureFileName(storedFileName);
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

  const validatePhone = (phoneNumber: string): boolean => {
    // Basic phone validation - can be enhanced based on requirements
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return (
      !phoneNumber || phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ""))
    );
  };

  const handleSubmit = async () => {
    // Validate phone number if provided
    if (phone && !validatePhone(phone)) {
      setErrors({ phone: "Please enter a valid phone number" });
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        phone: phone.trim(),
        address: address.trim(),
      });
      onClose();
    } catch (error) {
      console.error("Error saving personal information:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPhone(userData.phone || "");
    setAddress(userData.address || "");
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
    <div className="personal-info-modal-overlay" onClick={handleOverlayClick}>
      <div
        className="personal-info-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="personal-info-close-button"
          aria-label="Close"
          onClick={handleCancel}
        >
          <img src={closeIcon} alt="Close Icon" />
        </button>

        <div className="personal-info-modal-content">
          {/* Header Section */}
          <header className="personal-info-modal-header">
            <h2 className="personal-info-modal-title">Personal Information</h2>
            <p className="personal-info-modal-subtitle">
              Update your contact details
            </p>
          </header>

          {/* Form Section */}
          <div className="personal-info-form">
            <div className="personal-info-input-group">
              {/* Email Field (Read-only) */}
              <div className="personal-info-field">
                <label className="personal-info-label">Email Address</label>
                <div className="personal-info-readonly-field">
                  <input
                    type="email"
                    value={userData.email}
                    readOnly
                    disabled
                    className="personal-info-input"
                  />
                  <span className="personal-info-readonly-badge">
                    Can't be changed
                  </span>
                </div>
                <p className="personal-info-field-help">
                  Your email address is used for account verification and cannot
                  be changed.
                </p>
              </div>

              {/* Phone Number Field */}
              <div className="personal-info-field">
                <label className="personal-info-label">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors({});
                  }}
                  placeholder="Enter your phone number"
                  className={`personal-info-input ${
                    errors.phone ? "error" : ""
                  }`}
                  disabled={isSaving}
                />
                {errors.phone && (
                  <p className="personal-info-error">{errors.phone}</p>
                )}
                <p className="personal-info-field-help">
                  Enter your phone number with country code (optional)
                </p>
              </div>

              {/* Address Field */}
              <div className="personal-info-field">
                <label className="personal-info-label">Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full address"
                  className="personal-info-textarea"
                  rows={3}
                  disabled={isSaving}
                />
                <p className="personal-info-field-help">
                  Your current location (optional)
                </p>
              </div>

              {/* Profile Picture File Name (Read-only) */}
              {profilePictureFileName && (
                <div className="personal-info-field">
                  <label className="personal-info-label">Profile Picture</label>
                  <div className="personal-info-readonly-field">
                    <input
                      type="text"
                      value={truncateFileName(profilePictureFileName)}
                      readOnly
                      disabled
                      className="personal-info-input"
                      title={profilePictureFileName}
                    />
                    <span className="personal-info-readonly-badge">
                      Current image
                    </span>
                  </div>
                  <p className="personal-info-field-help">
                    Your profile picture filename. To change it, use the edit
                    button on your profile picture.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="personal-info-action-buttons">
              <button
                className="personal-info-btn personal-info-btn-cancel"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="personal-info-btn personal-info-btn-save"
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

export default PersonalInfoEditor;
