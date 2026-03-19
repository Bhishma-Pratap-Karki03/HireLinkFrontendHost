// SkillEditor.tsx
import React, { useState, useEffect } from "react";
import "../../styles/SkillEditor.css";

// Import images
import closeIcon from "../../images/Candidate Profile Page Images/corss icon.png";

// Define the Skill interface
export interface Skill {
  _id?: string;
  skillName: string;
  proficiencyLevel: string;
  yearsOfExperience: number;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

// Define the props interface for the component
interface SkillEditorProps {
  skill: Skill | null; // Current skill data (null for adding new)
  isOpen: boolean; // Whether the modal is open
  onClose: () => void; // Function to close the modal
  onSave: (skillData: Skill) => Promise<void>; // Function to save the skill
}

// Proficiency level options
const proficiencyLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];

// Skill category options
const skillCategories = [
  "Technical",
  "Soft Skills",
  "Tools",
  "Languages",
  "Framework",
  "Database",
  "Other",
];

/**
 * SkillEditor Component
 * A modal for adding/editing skills
 */
const SkillEditor: React.FC<SkillEditorProps> = ({
  skill,
  isOpen,
  onClose,
  onSave,
}) => {
  // State for form fields
  const [skillName, setSkillName] = useState<string>("");
  const [proficiencyLevel, setProficiencyLevel] =
    useState<string>("Intermediate");
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(1);
  const [yearsInput, setYearsInput] = useState<string>("1");
  const [category, setCategory] = useState<string>("Technical");

  // State for loading/saving indicator
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (skill) {
        // Editing existing skill
        setSkillName(skill.skillName || "");
        setProficiencyLevel(skill.proficiencyLevel || "Intermediate");
        setYearsOfExperience(skill.yearsOfExperience || 1);
        setYearsInput(skill.yearsOfExperience?.toString() || "1");
        setCategory(skill.category || "Technical");
      } else {
        // Adding new skill
        setSkillName("");
        setProficiencyLevel("Intermediate");
        setYearsOfExperience(1);
        setYearsInput("1");
        setCategory("Technical");
      }
      setIsSaving(false);
      setErrors({});
      setSubmitError("");
    }
  }, [isOpen, skill]);

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

    if (!skillName.trim()) {
      newErrors.skillName = "Skill name is required";
    }

    // Parse years input to validate
    const parsedYears = parseFloat(yearsInput);
    if (yearsInput.trim() === "") {
      newErrors.yearsOfExperience = "Years of experience is required";
    } else if (isNaN(parsedYears)) {
      newErrors.yearsOfExperience = "Please enter a valid number";
    } else if (parsedYears < 0) {
      newErrors.yearsOfExperience = "Years cannot be negative";
    } else if (parsedYears > 50) {
      newErrors.yearsOfExperience = "Maximum 50 years allowed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Save the skill
   * Calls the onSave prop function and closes modal on success
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setSubmitError("");

      // Parse years input to ensure it's a number
      const parsedYears = parseFloat(yearsInput);
      const finalYears = isNaN(parsedYears) ? 0 : parsedYears;

      const skillData: Skill = {
        _id: skill?._id,
        skillName: skillName.trim(),
        proficiencyLevel,
        yearsOfExperience: finalYears,
        category,
      };

      await onSave(skillData);
      onClose();
    } catch (error) {
      console.error("Error saving skill:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Failed to save skill"
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
   * Handle years of experience change - allow typing
   */
  const handleYearsInputChange = (value: string) => {
    // Allow empty string for typing
    setYearsInput(value);

    // Update the numeric state when valid
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setYearsOfExperience(numValue);
    }
  };

  /**
   * Handle key down for years input - allow numbers, decimal point, and control keys
   */
  const handleYearsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: numbers, decimal point, backspace, delete, tab, arrow keys
    if (
      /[0-9]|\.|Backspace|Delete|Tab|ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Home|End/.test(
        e.key
      )
    ) {
      return;
    }

    // Prevent any other keys
    e.preventDefault();
  };

  /**
   * Handle blur event on years input - validate and format
   */
  const handleYearsBlur = () => {
    if (yearsInput.trim() === "") {
      setYearsInput("0");
      setYearsOfExperience(0);
      return;
    }

    const parsed = parseFloat(yearsInput);
    if (!isNaN(parsed)) {
      // Format to 1 decimal place if needed
      const formatted =
        parsed % 1 === 0 ? parsed.toString() : parsed.toFixed(1);
      setYearsInput(formatted);
      setYearsOfExperience(parsed);
    } else {
      // Reset to previous valid value if invalid
      setYearsInput(yearsOfExperience.toString());
    }
  };

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  return (
    <div className="skill-modal-overlay" onClick={handleOverlayClick}>
      <div
        className="skill-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Top right corner */}
        <button
          className="skill-close-button"
          aria-label="Close editor"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <img src={closeIcon} alt="Close Icon" />
        </button>

        <div className="skill-modal-content">
          {/* Header Section */}
          <header className="skill-modal-header">
            <h2 className="skill-modal-title">
              {skill ? "Edit Skill" : "Add Skill"}
            </h2>
            <p className="skill-modal-subtitle">
              {skill
                ? "Update your skill details"
                : "Add a new skill to your profile"}
            </p>
          </header>

          {/* Form Section */}
          <div className="skill-form">
            <div className="skill-form-grid">
              {/* Skill Name */}
              <div className="skill-form-group">
                <label className="skill-form-label" data-required="*">
                  Skill Name
                </label>
                <input
                  type="text"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g., JavaScript, React, Project Management"
                  className={`skill-form-input ${
                    errors.skillName ? "error" : ""
                  }`}
                  disabled={isSaving}
                />
                {errors.skillName && (
                  <p className="skill-form-error">{errors.skillName}</p>
                )}
              </div>

              {/* Proficiency Level */}
              <div className="skill-form-group">
                <label className="skill-form-label" data-required="*">
                  Proficiency Level
                </label>
                <select
                  value={proficiencyLevel}
                  onChange={(e) => setProficiencyLevel(e.target.value)}
                  className={`skill-form-input ${
                    errors.proficiencyLevel ? "error" : ""
                  }`}
                  disabled={isSaving}
                >
                  {proficiencyLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                {errors.proficiencyLevel && (
                  <p className="skill-form-error">{errors.proficiencyLevel}</p>
                )}
              </div>

              {/* Years of Experience - Changed to text field */}
              <div className="skill-form-group">
                <label className="skill-form-label" data-required="*">
                  Years of Experience
                </label>
                <input
                  type="text"
                  value={yearsInput}
                  onChange={(e) => handleYearsInputChange(e.target.value)}
                  onKeyDown={handleYearsKeyDown}
                  onBlur={handleYearsBlur}
                  className={`skill-form-input ${
                    errors.yearsOfExperience ? "error" : ""
                  }`}
                  disabled={isSaving}
                  placeholder="e.g., 2.5"
                />
                {errors.yearsOfExperience && (
                  <p className="skill-form-error">{errors.yearsOfExperience}</p>
                )}
                <p className="skill-field-help">
                  Enter years (e.g., 0.5 for 6 months, 1.5 for 1 year 6 months)
                </p>
              </div>

              {/* Category */}
              <div className="skill-form-group">
                <label className="skill-form-label" data-required="*">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`skill-form-input ${
                    errors.category ? "error" : ""
                  }`}
                  disabled={isSaving}
                >
                  {skillCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="skill-form-error">{errors.category}</p>
                )}
              </div>
            </div>

            {/* Proficiency Level Guide */}
            <div className="skill-proficiency-guide">
              <h4 className="skill-guide-title">Proficiency Level Guide:</h4>
              <ul className="skill-guide-list">
                <li>
                  <strong>Beginner:</strong> Basic understanding, can perform
                  simple tasks with guidance
                </li>
                <li>
                  <strong>Intermediate:</strong> Good understanding, can work
                  independently on most tasks
                </li>
                <li>
                  <strong>Advanced:</strong> Deep understanding, can solve
                  complex problems and mentor others
                </li>
                <li>
                  <strong>Expert:</strong> Mastery of the skill, can innovate
                  and lead in this area
                </li>
              </ul>
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className="skill-submit-error">
                <span>{submitError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="skill-action-buttons">
              <button
                className="skill-btn skill-btn-cancel"
                onClick={handleCancel}
                disabled={isSaving}
                type="button"
              >
                Cancel
              </button>
              <button
                className="skill-btn skill-btn-save"
                onClick={handleSubmit}
                disabled={isSaving}
                type="button"
              >
                {isSaving ? "Saving..." : skill ? "Update Skill" : "Add Skill"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillEditor;
