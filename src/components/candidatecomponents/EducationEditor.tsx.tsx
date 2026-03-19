import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../../styles/EducationEditor.css";

// Import images
import closeIcon from "../../images/Candidate Profile Page Images/corss icon.png";

// Define the Education interface
export interface Education {
  _id?: string;
  degreeTitle: string;
  degreeType: string;
  institution: string;
  location: string;
  description: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Define the props interface for the component
interface EducationEditorProps {
  education: Education | null; // Current education data (null for adding new)
  isOpen: boolean; // Whether the modal is open
  onClose: () => void; // Function to close the modal
  onSave: (educationData: Education) => Promise<void>; // Function to save the education
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
    ["blockquote", "code-block"],
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
  "code-block",
];

// Degree type options
const degreeTypes = [
  "High School",
  "Associate",
  "Bachelor's",
  "Master's",
  "Doctorate",
  "Diploma",
  "Certificate",
  "Other",
];

/**
 * EducationEditor Component
 * A modal for adding/editing education information
 */
const EducationEditor: React.FC<EducationEditorProps> = ({
  education,
  isOpen,
  onClose,
  onSave,
}) => {
  // State for form fields
  const [degreeTitle, setDegreeTitle] = useState<string>("");
  const [degreeType, setDegreeType] = useState<string>("Bachelor's");
  const [institution, setInstitution] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isCurrent, setIsCurrent] = useState<boolean>(false);

  // State for loading/saving indicator
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (education) {
        // Editing existing education
        setDegreeTitle(education.degreeTitle || "");
        setDegreeType(education.degreeType || "Bachelor's");
        setInstitution(education.institution || "");
        setLocation(education.location || "");
        setDescription(education.description || "");
        setStartDate(
          education.startDate
            ? new Date(education.startDate).toISOString().split("T")[0]
            : ""
        );
        setEndDate(
          education.endDate && !education.isCurrent
            ? new Date(education.endDate).toISOString().split("T")[0]
            : ""
        );
        setIsCurrent(education.isCurrent || false);
      } else {
        // Adding new education
        setDegreeTitle("");
        setDegreeType("Bachelor's");
        setInstitution("");
        setLocation("");
        setDescription("");
        setStartDate("");
        setEndDate("");
        setIsCurrent(false);
      }
      setIsSaving(false);
      setErrors({});
      setSubmitError("");
    }
  }, [isOpen, education]);

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

    if (!degreeTitle.trim()) {
      newErrors.degreeTitle = "Degree title is required";
    }

    if (!institution.trim()) {
      newErrors.institution = "Institution name is required";
    }

    if (!startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!isCurrent && !endDate) {
      newErrors.endDate = "End date is required unless currently studying";
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
   * Save the education
   * Calls the onSave prop function and closes modal on success
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setSubmitError("");

      const educationData: Education = {
        _id: education?._id,
        degreeTitle: degreeTitle.trim(),
        degreeType,
        institution: institution.trim(),
        location: location.trim(),
        description: description.trim(),
        startDate,
        endDate: isCurrent ? null : endDate,
        isCurrent,
      };

      await onSave(educationData);
      onClose();
    } catch (error) {
      console.error("Error saving education:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Failed to save education"
      );
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Cancel editing and close modal
   * Resets form to original values
   */
  const handleCancel = () => {
    setErrors({});
    setSubmitError("");
    onClose();
  };

  /**
   * Handle click on overlay to close modal
   * Only closes if click is directly on overlay (not modal content)
   */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  /**
   * Handle description change in the editor
   */
  const handleDescriptionChange = (content: string) => {
    setDescription(content);
  };

  /**
   * Handle current study toggle
   */
  const handleCurrentToggle = (checked: boolean) => {
    setIsCurrent(checked);
    if (checked) {
      setEndDate("");
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.endDate;
        return newErrors;
      });
    }
  };

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  return (
    <div className="education-modal-overlay" onClick={handleOverlayClick}>
      <div
        className="education-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Top right corner */}
        <button
          className="education-close-button"
          aria-label="Close editor"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <img src={closeIcon} alt="Close Icon" />
        </button>

        <div className="education-modal-content">
          {/* Header Section */}
          <header className="education-modal-header">
            <h2 className="education-modal-title">
              {education ? "Edit Education" : "Add Education"}
            </h2>
            <p className="education-modal-subtitle">
              {education
                ? "Update your education details"
                : "Add your educational background"}
            </p>
          </header>

          {/* Form Section */}
          <div className="education-form">
            <div className="education-form-grid">
              {/* Degree Title */}
              <div className="education-form-group">
                <label className="education-form-label" data-required="*">
                  Degree Title
                </label>
                <input
                  type="text"
                  value={degreeTitle}
                  onChange={(e) => setDegreeTitle(e.target.value)}
                  placeholder="e.g., Bachelor of Science in Computer Science"
                  className={`education-form-input ${
                    errors.degreeTitle ? "error" : ""
                  }`}
                  disabled={isSaving}
                />
                {errors.degreeTitle && (
                  <p className="education-form-error">{errors.degreeTitle}</p>
                )}
              </div>

              {/* Degree Type */}
              <div className="education-form-group">
                <label className="education-form-label" data-required="*">
                  Degree Type
                </label>
                <select
                  value={degreeType}
                  onChange={(e) => setDegreeType(e.target.value)}
                  className={`education-form-input ${
                    errors.degreeType ? "error" : ""
                  }`}
                  disabled={isSaving}
                >
                  {degreeTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.degreeType && (
                  <p className="education-form-error">{errors.degreeType}</p>
                )}
              </div>

              {/* Institution */}
              <div className="education-form-group">
                <label className="education-form-label" data-required="*">
                  Institution
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g., University of Example"
                  className={`education-form-input ${
                    errors.institution ? "error" : ""
                  }`}
                  disabled={isSaving}
                />
                {errors.institution && (
                  <p className="education-form-error">{errors.institution}</p>
                )}
              </div>

              {/* Location */}
              <div className="education-form-group">
                <label className="education-form-label">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., City, State, Country"
                  className="education-form-input"
                  disabled={isSaving}
                />
                <p className="education-field-help">
                  Optional - City, state, or country where institution is
                  located
                </p>
              </div>

              {/* Start Date */}
              <div className="education-form-group">
                <label className="education-form-label" data-required="*">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`education-form-input ${
                    errors.startDate ? "error" : ""
                  }`}
                  disabled={isSaving}
                />
                {errors.startDate && (
                  <p className="education-form-error">{errors.startDate}</p>
                )}
              </div>

              {/* End Date or Current Study */}
              <div className="education-form-group">
                <label className="education-form-label">
                  {isCurrent ? "Currently Studying" : "End Date"}
                </label>
                {isCurrent ? (
                  <div className="education-current-job">
                    <span className="education-current-text">
                      Currently studying here
                    </span>
                  </div>
                ) : (
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`education-form-input ${
                      errors.endDate ? "error" : ""
                    }`}
                    disabled={isSaving}
                  />
                )}
                {errors.endDate && (
                  <p className="education-form-error">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Current Study Toggle */}
            <div className="education-current-toggle">
              <label className="education-toggle-label">
                <input
                  type="checkbox"
                  checked={isCurrent}
                  onChange={(e) => handleCurrentToggle(e.target.checked)}
                  className="education-toggle-checkbox"
                  disabled={isSaving}
                />
                <span className="education-toggle-text">
                  I am currently studying here
                </span>
              </label>
            </div>

            {/* Description Editor */}
            <div className="education-description-group">
              <label className="education-form-label">Description</label>
              <p className="education-field-help">
                Optional - Describe your studies, achievements, courses, or
                projects
              </p>
              <div className="education-editor-wrapper">
                <ReactQuill
                  theme="snow"
                  value={description}
                  onChange={handleDescriptionChange}
                  modules={modules}
                  formats={formats}
                  placeholder="Describe your education experience, courses, achievements, projects, etc..."
                  className="education-quill-editor"
                  readOnly={isSaving}
                />
              </div>
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className="education-submit-error">
                <span>{submitError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="education-action-buttons">
              <button
                className="education-btn education-btn-cancel"
                onClick={handleCancel}
                disabled={isSaving}
                type="button"
              >
                Cancel
              </button>
              <button
                className="education-btn education-btn-save"
                onClick={handleSubmit}
                disabled={isSaving}
                type="button"
              >
                {isSaving
                  ? "Saving..."
                  : education
                  ? "Update Education"
                  : "Add Education"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationEditor;
