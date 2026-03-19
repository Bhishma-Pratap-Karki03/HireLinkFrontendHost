import React, { useState, useEffect } from "react";
import "../../styles/LanguageEditor.css";

// Import images
import closeIcon from "../../images/Candidate Profile Page Images/corss icon.png";
import starIcon from "../../images/Candidate Profile Page Images/star-icon.svg";
import emptyStarIcon from "../../images/Candidate Profile Page Images/empty-star-icon.png";

// Define the Language interface
export interface Language {
  _id?: string;
  languageName: string;
  rating: number;
  createdAt?: string;
  updatedAt?: string;
}

// Define the props interface for the component
interface LanguageEditorProps {
  language: Language | null; // Current language data (null for adding new)
  isOpen: boolean; // Whether the modal is open
  onClose: () => void; // Function to close the modal
  onSave: (languageData: Language) => Promise<void>; // Function to save the language
}

// Popular language options
const popularLanguages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Chinese (Mandarin)",
  "Hindi",
  "Arabic",
  "Portuguese",
  "Russian",
  "Japanese",
  "Korean",
  "Italian",
  "Nepali",
  "Other",
];

/**
 * LanguageEditor Component
 * A modal for adding/editing languages
 */
const LanguageEditor: React.FC<LanguageEditorProps> = ({
  language,
  isOpen,
  onClose,
  onSave,
}) => {
  // State for form fields
  const [languageName, setLanguageName] = useState<string>("");
  const [customLanguage, setCustomLanguage] = useState<string>("");
  const [rating, setRating] = useState<number>(3);
  const [useCustomLanguage, setUseCustomLanguage] = useState<boolean>(false);

  // State for loading/saving indicator
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (language) {
        // Editing existing language
        setLanguageName(language.languageName || "");
        setRating(language.rating || 3);

        // Check if it's a custom language
        const isCustom = !popularLanguages.includes(language.languageName);
        setUseCustomLanguage(isCustom);
        if (isCustom) {
          setCustomLanguage(language.languageName);
        }
      } else {
        // Adding new language
        setLanguageName("");
        setCustomLanguage("");
        setRating(3);
        setUseCustomLanguage(false);
      }
      setIsSaving(false);
      setErrors({});
      setSubmitError("");
    }
  }, [isOpen, language]);

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

    // Get the final language name
    const finalLanguageName = useCustomLanguage
      ? customLanguage.trim()
      : languageName.trim();

    if (!finalLanguageName) {
      newErrors.languageName = "Language name is required";
    }

    if (rating < 1 || rating > 5) {
      newErrors.rating = "Rating must be between 1 and 5";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Save the language
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setSubmitError("");

      // Get the final language name
      const finalLanguageName = useCustomLanguage
        ? customLanguage.trim()
        : languageName.trim();

      const languageData: Language = {
        _id: language?._id,
        languageName: finalLanguageName,
        rating: rating,
      };

      await onSave(languageData);
      onClose();
    } catch (error) {
      console.error("Error saving language:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Failed to save language"
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
   * Handle language selection change
   */
  const handleLanguageChange = (value: string) => {
    if (value === "Other") {
      setUseCustomLanguage(true);
      setCustomLanguage("");
    } else {
      setUseCustomLanguage(false);
      setLanguageName(value);
    }
  };

  /**
   * Handle star rating click
   */
  const handleStarClick = (starIndex: number) => {
    setRating(starIndex);
  };

  /**
   * Render star rating UI
   */
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className={`language-star-button ${i <= rating ? "active" : ""}`}
          onClick={() => handleStarClick(i)}
          disabled={isSaving}
        >
          <img
            src={i <= rating ? starIcon : emptyStarIcon}
            alt={i <= rating ? "Filled Star" : "Empty Star"}
            className="language-star-icon"
          />
        </button>
      );
    }
    return stars;
  };

  /**
   * Render rating description
   */
  const getRatingDescription = () => {
    switch (rating) {
      case 1:
        return "Basic - Can understand and use familiar everyday expressions";
      case 2:
        return "Elementary - Can communicate in simple and routine tasks";
      case 3:
        return "Intermediate - Can deal with most situations likely to arise while traveling";
      case 4:
        return "Advanced - Can interact with a degree of fluency and spontaneity";
      case 5:
        return "Native / Fluent - Can express ideas fluently and spontaneously";
      default:
        return "Select your proficiency level";
    }
  };

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  return (
    <div className="language-modal-overlay" onClick={handleOverlayClick}>
      <div
        className="language-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="language-close-button"
          aria-label="Close editor"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <img src={closeIcon} alt="Close Icon" />
        </button>

        <div className="language-modal-content">
          {/* Header Section */}
          <header className="language-modal-header">
            <h2 className="language-modal-title">
              {language ? "Edit Language" : "Add Language"}
            </h2>
            <p className="language-modal-subtitle">
              {language
                ? "Update your language details"
                : "Add a new language to your profile"}
            </p>
          </header>

          {/* Form Section */}
          <div className="language-form">
            {/* Language Name */}
            <div className="language-form-group">
              <label className="language-form-label" data-required="*">
                Language
              </label>

              {!useCustomLanguage ? (
                <select
                  value={languageName}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className={`language-form-select ${
                    errors.languageName ? "error" : ""
                  }`}
                  disabled={isSaving}
                >
                  <option value="">Select a language</option>
                  {popularLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={customLanguage}
                  onChange={(e) => setCustomLanguage(e.target.value)}
                  placeholder="Enter language name"
                  className={`language-form-input ${
                    errors.languageName ? "error" : ""
                  }`}
                  disabled={isSaving}
                />
              )}

              {errors.languageName && (
                <p className="language-form-error">{errors.languageName}</p>
              )}
            </div>

            {/* Rating Section */}
            <div className="language-rating-group">
              <label className="language-form-label" data-required="*">
                Proficiency Rating
              </label>

              <div className="language-stars-container">{renderStars()}</div>

              <div className="language-rating-description">
                <span className="language-rating-text">
                  {rating} out of 5 stars
                </span>
                <span className="language-rating-help">
                  {getRatingDescription()}
                </span>
              </div>

              {errors.rating && (
                <p className="language-form-error">{errors.rating}</p>
              )}
            </div>

            {/* Rating Guide */}
            <div className="language-rating-guide">
              <h4 className="language-guide-title">
                Proficiency Rating Guide:
              </h4>
              <ul className="language-guide-list">
                <li>
                  <strong>1 Star (Basic):</strong> Can understand and use
                  familiar everyday expressions
                </li>
                <li>
                  <strong>2 Stars (Elementary):</strong> Can communicate in
                  simple and routine tasks
                </li>
                <li>
                  <strong>3 Stars (Intermediate):</strong> Can deal with most
                  situations likely to arise
                </li>
                <li>
                  <strong>4 Stars (Advanced):</strong> Can interact with a
                  degree of fluency
                </li>
                <li>
                  <strong>5 Stars (Native/Fluent):</strong> Can express ideas
                  fluently and spontaneously
                </li>
              </ul>
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className="language-submit-error">
                <span>{submitError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="language-action-buttons">
              <button
                className="language-btn language-btn-cancel"
                onClick={handleCancel}
                disabled={isSaving}
                type="button"
              >
                Cancel
              </button>
              <button
                className="language-btn language-btn-save"
                onClick={handleSubmit}
                disabled={isSaving}
                type="button"
              >
                {isSaving
                  ? "Saving..."
                  : language
                  ? "Update Language"
                  : "Add Language"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageEditor;
