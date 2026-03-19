import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../../styles/ExperienceEditor.css";

// Import images
import closeIcon from "../../images/Candidate Profile Page Images/corss icon.png";

// Define the props interface for the component
interface Experience {
  _id?: string;
  jobTitle: string;
  jobType: string;
  organization: string;
  location: string;
  description: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}

interface ExperienceEditorProps {
  experience: Experience | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (experience: Experience) => Promise<void>;
}

// Define modules configuration for React Quill editor
const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ color: [] }, { background: [] }],
    ["clean"],
    ["link"],
    ["blockquote"],
  ],
};

// Define formats that the editor will support
const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "indent",
  "align",
  "color",
  "background",
  "link",
  "blockquote",
];

/**
 * ExperienceEditor Component
 * A modal for adding/editing work experience
 */
const ExperienceEditor: React.FC<ExperienceEditorProps> = ({
  experience,
  isOpen,
  onClose,
  onSave,
}) => {
  // State for form fields
  const [jobTitle, setJobTitle] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [organization, setOrganization] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);

  // State for loading/saving indicator
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form when modal opens or experience changes
  useEffect(() => {
    if (isOpen) {
      if (experience) {
        // Editing existing experience
        setJobTitle(experience.jobTitle || "");
        setJobType(experience.jobType || "Full-time");
        setOrganization(experience.organization || "");
        setLocation(experience.location || "");
        setDescription(experience.description || "");
        setStartDate(
          experience.startDate ? experience.startDate.split("T")[0] : ""
        );
        // Handle null endDate
        setEndDate(
          experience.endDate && !experience.isCurrent
            ? experience.endDate.split("T")[0]
            : ""
        );
        setIsCurrent(experience.isCurrent || false);
      } else {
        // Adding new experience
        setJobTitle("");
        setJobType("Full-time");
        setOrganization("");
        setLocation("");
        setDescription("");
        setStartDate("");
        setEndDate("");
        setIsCurrent(false);
      }
      setErrors({});
      setIsSaving(false);
    }
  }, [isOpen, experience]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

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

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!jobTitle.trim()) {
      newErrors.jobTitle = "Job title is required";
    }

    if (!organization.trim()) {
      newErrors.organization = "Organization name is required";
    }

    if (!startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!isCurrent && !endDate) {
      newErrors.endDate = "End date is required for past experiences";
    }

    if (startDate && endDate && !isCurrent) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        newErrors.endDate = "End date cannot be before start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Save the experience
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);

      const experienceData: Experience = {
        jobTitle: jobTitle.trim(),
        jobType,
        organization: organization.trim(),
        location: location.trim(),
        description: description.trim(),
        startDate,
        // Handle endDate properly - convert empty string to null if isCurrent
        endDate: isCurrent ? null : endDate || null,
        isCurrent,
      };

      // If editing existing experience, include the ID
      if (experience && experience._id) {
        experienceData._id = experience._id;
      }

      await onSave(experienceData);
      onClose();
    } catch (error) {
      console.error("Error saving experience:", error);
      setErrors({
        submit: "Failed to save experience. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  /**
   * Cancel editing and close modal
   */
  const handleCancel = () => {
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
   * Handle current job toggle
   */
  const handleCurrentToggle = (checked: boolean) => {
    setIsCurrent(checked);
    if (checked) {
      setEndDate("");
      setErrors((prev) => ({ ...prev, endDate: "" }));
    }
  };

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  return (
    <div className="experience-modal-overlay" onClick={handleOverlayClick}>
      <div
        className="experience-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Top right corner */}
        <button
          className="experience-close-button"
          aria-label="Close editor"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <img src={closeIcon} alt="Close Icon" />
        </button>

        <div className="experience-modal-content">
          {/* Header Section */}
          <header className="experience-modal-header">
            <h2 className="experience-modal-title">
              {experience ? "Edit Experience" : "Add Experience"}
            </h2>
            <p className="experience-modal-subtitle">
              {experience
                ? "Update your work experience details"
                : "Add your work experience details"}
            </p>
          </header>

          {/* Form Section */}
          <div className="experience-form">
            <div className="experience-form-grid">
              {/* Job Title */}
              <div className="experience-form-group">
                <label className="experience-form-label">Job Title *</label>
                <input
                  type="text"
                  className={`experience-form-input ${
                    errors.jobTitle ? "error" : ""
                  }`}
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  disabled={isSaving}
                />
                {errors.jobTitle && (
                  <span className="experience-form-error">
                    {errors.jobTitle}
                  </span>
                )}
              </div>

              {/* Job Type */}
              <div className="experience-form-group">
                <label className="experience-form-label">Job Type</label>
                <select
                  className="experience-form-input"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  disabled={isSaving}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>

              {/* Organization */}
              <div className="experience-form-group">
                <label className="experience-form-label">Organization *</label>
                <input
                  type="text"
                  className={`experience-form-input ${
                    errors.organization ? "error" : ""
                  }`}
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g., Google Inc."
                  disabled={isSaving}
                />
                {errors.organization && (
                  <span className="experience-form-error">
                    {errors.organization}
                  </span>
                )}
              </div>

              {/* Location */}
              <div className="experience-form-group">
                <label className="experience-form-label">Location</label>
                <input
                  type="text"
                  className="experience-form-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., San Francisco, CA"
                  disabled={isSaving}
                />
              </div>

              {/* Start Date */}
              <div className="experience-form-group">
                <label className="experience-form-label">Start Date *</label>
                <input
                  type="date"
                  className={`experience-form-input ${
                    errors.startDate ? "error" : ""
                  }`}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isSaving}
                />
                {errors.startDate && (
                  <span className="experience-form-error">
                    {errors.startDate}
                  </span>
                )}
              </div>

              {/* End Date / Current Job */}
              <div className="experience-form-group">
                <label className="experience-form-label">
                  {isCurrent ? "Current Job" : "End Date *"}
                </label>
                {isCurrent ? (
                  <div className="experience-current-job">
                    <span className="experience-current-text">
                      Currently working here
                    </span>
                  </div>
                ) : (
                  <input
                    type="date"
                    className={`experience-form-input ${
                      errors.endDate ? "error" : ""
                    }`}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={isSaving}
                  />
                )}
                {errors.endDate && (
                  <span className="experience-form-error">
                    {errors.endDate}
                  </span>
                )}
              </div>
            </div>

            {/* Current Job Toggle */}
            <div className="experience-current-toggle">
              <label className="experience-toggle-label">
                <input
                  type="checkbox"
                  checked={isCurrent}
                  onChange={(e) => handleCurrentToggle(e.target.checked)}
                  disabled={isSaving}
                  className="experience-toggle-checkbox"
                />
                <span className="experience-toggle-text">
                  I am currently working in this role
                </span>
              </label>
            </div>

            {/* Description Editor */}
            <div className="experience-description-group">
              <label className="experience-form-label">
                Roles & Responsibilities
              </label>
              <div className="experience-editor-wrapper">
                <ReactQuill
                  theme="snow"
                  value={description}
                  onChange={setDescription}
                  modules={modules}
                  formats={formats}
                  placeholder="Describe your roles, responsibilities, and achievements in this position..."
                  className="experience-quill-editor"
                  readOnly={isSaving}
                />
              </div>
              <p className="experience-field-help">
                Describe your key responsibilities, achievements, and skills
                used
              </p>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="experience-submit-error">{errors.submit}</div>
            )}

            {/* Action Buttons */}
            <div className="experience-action-buttons">
              <button
                className="experience-btn experience-btn-cancel"
                onClick={handleCancel}
                disabled={isSaving}
                type="button"
              >
                Cancel
              </button>
              <button
                className="experience-btn experience-btn-save"
                onClick={handleSubmit}
                disabled={isSaving}
                type="button"
              >
                {isSaving
                  ? "Saving..."
                  : experience
                  ? "Update Experience"
                  : "Add Experience"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperienceEditor;
