import React, { useState } from "react";
import "../../styles/AdminPersonalInfoEditor.css";

// Import icons
import closeIcon from "../../images/Candidate Profile Page Images/corss icon.png";

interface AdminPersonalInfoEditorProps {
  userData: {
    email: string;
    phone: string;
    fullName: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { fullName: string; phone: string }) => Promise<void>;
}

const AdminPersonalInfoEditor: React.FC<AdminPersonalInfoEditorProps> = ({
  userData,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    fullName: userData.fullName || "",
    phone: userData.phone || "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName.trim()) {
      alert("Full name is required");
      return;
    }

    try {
      setIsLoading(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving personal info:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: userData.fullName || "",
      phone: userData.phone || "",
    });
    onClose();
  };

  // Handle click outside modal
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay admin-personal-info-overlay"
      onClick={handleOverlayClick}
    >
      <div
        className="modal-container admin-personal-info-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="close-button"
          aria-label="Close"
          onClick={handleCancel}
        >
          <img src={closeIcon} alt="Close Icon" />
        </button>

        <div className="modal-content">
          {/* Header Section */}
          <header className="modal-header">
            <h2 className="modal-title">Edit Personal Information</h2>
          </header>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="admin-personal-info-form">
            <div className="form-fields-wrapper">
              {/* Input Fields */}
              <div className="input-stack">
                {/* Full Name */}
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="text-input"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Full Name *"
                    required
                  />
                </div>

                {/* Email (Read-only) */}
                <div className="input-wrapper">
                  <input
                    type="email"
                    className="text-input"
                    value={userData.email}
                    readOnly
                    disabled
                    placeholder="Email Address"
                  />
                </div>

                {/* Phone Number */}
                <div className="input-wrapper">
                  <input
                    type="tel"
                    className="text-input"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone Number"
                  />
                </div>
              </div>

              {/* Note about email */}
              <div className="admin-field-note">
                Email address cannot be changed
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                type="button"
                className="btn btn-cancel"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-save"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminPersonalInfoEditor;
