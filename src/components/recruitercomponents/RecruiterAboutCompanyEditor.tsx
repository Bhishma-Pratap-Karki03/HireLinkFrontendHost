import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Import Quill styles
import "../../styles/RecruiterAboutCompanyEditor.css";

// Import images
import closeIcon from "../../images/Candidate Profile Page Images/corss icon.png";

// Define the props interface for the component
interface RecruiterAboutCompanyEditorProps {
  currentAbout: string; // Current about text from the company profile
  isOpen: boolean; // Whether the modal is open
  onClose: () => void; // Function to close the modal
  onSave: (aboutText: string) => Promise<void>; // Function to save the about text
}

// Define modules configuration for React Quill editor
const modules = {
  toolbar: [
    // Text formatting options
    [{ header: [1, 2, 3, false] }], // Header sizes (H1, H2, H3, Normal)
    ["bold", "italic", "underline", "strike"], // Basic text formatting
    [{ list: "ordered" }, { list: "bullet" }], // Lists (ordered and bullet)

    // Text alignment
    [{ align: [] }],

    // Indentation
    [{ indent: "-1" }, { indent: "+1" }],

    // Color options
    [{ color: [] }, { background: [] }],

    // Clean formatting
    ["clean"],

    // Link and image
    ["link", "image"],

    // Blockquote and code block
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
  "image",
  "blockquote",
  "code-block",
];

/**
 * RecruiterAboutCompanyEditor Component
 * A rich text editor modal for editing the "About Company" section
 * Uses React Quill for WYSIWYG editing experience
 */
const RecruiterAboutCompanyEditor: React.FC<
  RecruiterAboutCompanyEditorProps
> = ({ currentAbout, isOpen, onClose, onSave }) => {
  // State for the about text
  const [aboutText, setAboutText] = useState<string>(currentAbout || "");

  // State for loading/saving indicator
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset to current about text when modal opens
      setAboutText(currentAbout || "");
      setIsSaving(false);
    }
  }, [isOpen, currentAbout]);

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

  /**
   * Handle text change in the editor
   * @param content - The HTML content from the editor
   */
  const handleTextChange = (content: string) => {
    setAboutText(content);
  };

  /**
   * Save the about text
   * Calls the onSave prop function and closes modal on success
   */
  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      await onSave(aboutText.trim());
      onClose();
    } catch (error) {
      console.error("Error saving company information:", error);
      alert("Failed to save company description. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Cancel editing and close modal
   * Resets form to original values
   */
  const handleCancel = () => {
    setAboutText(currentAbout || "");
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

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  return (
    <div className="recruiter-about-modal-overlay" onClick={handleOverlayClick}>
      <div
        className="recruiter-about-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Top right corner */}
        <button
          className="recruiter-about-close-button"
          aria-label="Close editor"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <img src={closeIcon} alt="Close Icon" />
        </button>

        <div className="recruiter-about-modal-content">
          {/* Header Section */}
          <header className="recruiter-about-modal-header">
            <h2 className="recruiter-about-modal-title">
              About Company Editor
            </h2>
            <p className="recruiter-about-modal-subtitle">
              Write about your company, mission, culture, and what makes you
              unique
            </p>
          </header>

          {/* Rich Text Editor Section */}
          <div className="recruiter-about-editor-wrapper">
            <ReactQuill
              theme="snow"
              value={aboutText}
              onChange={handleTextChange}
              modules={modules}
              formats={formats}
              placeholder="Write about your company here...

You can include:
• Company mission and values
• Company history and achievements
• Products or services offered
• Company culture and work environment
• Team and leadership
• Awards and recognition
• Future goals and vision
• Why candidates should work with you..."
              className="recruiter-about-quill-editor"
              readOnly={isSaving}
            />
          </div>

          {/* Editor Tips */}
          <div className="recruiter-about-editor-tips">
            <h4 className="recruiter-about-tips-title">Editor Tips:</h4>
            <ul className="recruiter-about-tips-list">
              <li>
                Use headers to organize sections (Company Mission, Culture,
                History, etc.)
              </li>
              <li>
                Use bullet points for company values, benefits, and achievements
              </li>
              <li>Add links to your website, career page, or company news</li>
              <li>Highlight what makes your company a great place to work</li>
              <li>Include information about company growth and future plans</li>
              <li>Proofread before saving to ensure professionalism</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="recruiter-about-action-buttons">
            <button
              className="recruiter-about-btn recruiter-about-btn-cancel"
              onClick={handleCancel}
              disabled={isSaving}
              type="button"
            >
              Cancel
            </button>
            <button
              className="recruiter-about-btn recruiter-about-btn-save"
              onClick={handleSubmit}
              disabled={isSaving}
              type="button"
            >
              {isSaving ? "Saving..." : "Save Company Description"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterAboutCompanyEditor;
