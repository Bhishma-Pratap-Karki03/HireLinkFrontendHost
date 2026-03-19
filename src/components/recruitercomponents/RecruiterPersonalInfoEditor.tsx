import React, { useState, useEffect } from "react";
import "../../styles/RecruiterPersonalInfoEditor.css";

// Import images
import closeIcon from "../../images/Candidate Profile Page Images/corss icon.png";

interface RecruiterPersonalInfoEditorProps {
  userData: {
    email: string;
    phone: string;
    address: string;
    fullName: string;
    companySize: string;
    foundedYear: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    fullName: string;
    phone: string;
    address: string;
    companySize: string;
    foundedYear: string;
  }) => Promise<void>;
}

const RecruiterPersonalInfoEditor: React.FC<
  RecruiterPersonalInfoEditorProps
> = ({ userData, isOpen, onClose, onSave }) => {
  const [fullName, setFullName] = useState(userData.fullName || "");
  const [phone, setPhone] = useState(userData.phone || "");
  const [address, setAddress] = useState(userData.address || "");
  const [companySize, setCompanySize] = useState(userData.companySize || "");
  const [foundedYear, setFoundedYear] = useState(userData.foundedYear || "");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{
    phone?: string;
    fullName?: string;
    foundedYear?: string;
  }>({});

  useEffect(() => {
    if (isOpen) {
      setFullName(userData.fullName || "");
      setPhone(userData.phone || "");
      setAddress(userData.address || "");
      setCompanySize(userData.companySize || "");
      setFoundedYear(userData.foundedYear || "");
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

  const validatePhone = (phoneNumber: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return (
      !phoneNumber || phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ""))
    );
  };

  const validateFullName = (name: string): boolean => {
    return name.trim().length >= 2;
  };

  const validateFoundedYear = (year: string): boolean => {
    if (!year) return true; // Optional field

    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();

    // Check if it's a valid number
    if (isNaN(yearNum)) {
      return false;
    }

    // Check year range
    return yearNum >= 1800 && yearNum <= currentYear;
  };

  const handleSubmit = async () => {
    const newErrors: {
      phone?: string;
      fullName?: string;
      foundedYear?: string;
    } = {};

    // Validate full name
    if (!validateFullName(fullName)) {
      newErrors.fullName = "Company name must be at least 2 characters long";
    }

    // Validate phone number if provided
    if (phone && !validatePhone(phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Validate founded year if provided
    if (foundedYear && !validateFoundedYear(foundedYear)) {
      const currentYear = new Date().getFullYear();
      newErrors.foundedYear = `Please enter a valid year between 1800 and ${currentYear}`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSaving(true);
      console.log("Submitting company info:", {
        fullName,
        phone,
        address,
        companySize,
        foundedYear,
      });

      await onSave({
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        companySize: companySize.trim(),
        foundedYear: foundedYear.trim(),
      });
      onClose();
    } catch (error) {
      console.error("Error saving company information:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(userData.fullName || "");
    setPhone(userData.phone || "");
    setAddress(userData.address || "");
    setCompanySize(userData.companySize || "");
    setFoundedYear(userData.foundedYear || "");
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
      className="recruiter-personal-info-modal-overlay"
      onClick={handleOverlayClick}
    >
      <div
        className="recruiter-personal-info-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="recruiter-personal-info-close-button"
          aria-label="Close"
          onClick={handleCancel}
        >
          <img src={closeIcon} alt="Close Icon" />
        </button>

        <div className="recruiter-personal-info-modal-content">
          {/* Header Section */}
          <header className="recruiter-personal-info-modal-header">
            <h2 className="recruiter-personal-info-modal-title">
              Company Information
            </h2>
            <p className="recruiter-personal-info-modal-subtitle">
              Update your company contact details
            </p>
          </header>

          {/* Form Section */}
          <div className="recruiter-personal-info-form">
            <div className="recruiter-personal-info-input-group">
              {/* Company Name Field */}
              <div className="recruiter-personal-info-field">
                <label className="recruiter-personal-info-label">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName)
                      setErrors({ ...errors, fullName: undefined });
                  }}
                  placeholder="Enter your company name"
                  className={`recruiter-personal-info-input ${
                    errors.fullName ? "error" : ""
                  }`}
                  disabled={isSaving}
                />
                {errors.fullName && (
                  <p className="recruiter-personal-info-error">
                    {errors.fullName}
                  </p>
                )}
                <p className="recruiter-personal-info-field-help">
                  Your company name as it should appear on your profile
                </p>
              </div>

              {/* Email Field (Read-only) */}
              <div className="recruiter-personal-info-field">
                <label className="recruiter-personal-info-label">
                  Company Email
                </label>
                <div className="recruiter-personal-info-readonly-field">
                  <input
                    type="email"
                    value={userData.email}
                    readOnly
                    disabled
                    className="recruiter-personal-info-input"
                  />
                  <span className="recruiter-personal-info-readonly-badge">
                    Can't be changed
                  </span>
                </div>
                <p className="recruiter-personal-info-field-help">
                  Your company email address is used for account verification
                  and cannot be changed.
                </p>
              </div>

              {/* Phone Number Field */}
              <div className="recruiter-personal-info-field">
                <label className="recruiter-personal-info-label">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone)
                      setErrors({ ...errors, phone: undefined });
                  }}
                  placeholder="Enter company phone number"
                  className={`recruiter-personal-info-input ${
                    errors.phone ? "error" : ""
                  }`}
                  disabled={isSaving}
                />
                {errors.phone && (
                  <p className="recruiter-personal-info-error">
                    {errors.phone}
                  </p>
                )}
                <p className="recruiter-personal-info-field-help">
                  Enter your company phone number with country code (optional)
                </p>
              </div>

              {/* Company Size Field */}
              <div className="recruiter-personal-info-field">
                <label className="recruiter-personal-info-label">
                  Company Size
                </label>
                <input
                  type="text"
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  placeholder="e.g., 50-100 employees, 100-500 employees"
                  className="recruiter-personal-info-input"
                  disabled={isSaving}
                />
                <p className="recruiter-personal-info-field-help">
                  Enter the size range of your company (optional)
                </p>
              </div>

              {/* Founded Year Field */}
              <div className="recruiter-personal-info-field">
                <label className="recruiter-personal-info-label">
                  Founded Year
                </label>
                <select
                  value={foundedYear}
                  onChange={(e) => {
                    setFoundedYear(e.target.value);
                    if (errors.foundedYear)
                      setErrors({ ...errors, foundedYear: undefined });
                  }}
                  className={`recruiter-personal-info-input ${
                    errors.foundedYear ? "error" : ""
                  }`}
                  disabled={isSaving}
                >
                  <option value="">Select year</option>
                  {Array.from(
                    { length: new Date().getFullYear() - 1799 },
                    (_, i) => new Date().getFullYear() - i
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.foundedYear && (
                  <p className="recruiter-personal-info-error">
                    {errors.foundedYear}
                  </p>
                )}
                <p className="recruiter-personal-info-field-help">
                  Select the year your company was founded (optional)
                </p>
              </div>

              {/* Address Field */}
              <div className="recruiter-personal-info-field">
                <label className="recruiter-personal-info-label">
                  Company Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your company full address"
                  className="recruiter-personal-info-textarea"
                  rows={3}
                  disabled={isSaving}
                />
                <p className="recruiter-personal-info-field-help">
                  Your company's physical location (optional)
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="recruiter-personal-info-action-buttons">
              <button
                className="recruiter-personal-info-btn recruiter-personal-info-btn-cancel"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="recruiter-personal-info-btn recruiter-personal-info-btn-save"
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

export default RecruiterPersonalInfoEditor;
