import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import "../../styles/ResumeEditor.css";

// Import images
import closeIcon from "../../images/Candidate Profile Page Images/corss icon.png";
import trashIcon from "../../images/Candidate Profile Page Images/trash.png";
import fileIcon from "../../images/Candidate Profile Page Images/Resume-icon.png";
import editIcon from "../../images/Candidate Profile Page Images/261_2045.svg";
import uploadIcon from "../../images/Candidate Profile Page Images/upload-icon.svg";

interface ResumeEditorProps {
  currentResume: {
    url: string;
    fileName: string;
    fileSize: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: (file: File | null) => Promise<void>;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({
  currentResume,
  isOpen,
  onClose,
  onSave,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasResume, setHasResume] = useState(!!currentResume.url);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setError(null);
      setHasResume(!!currentResume.url);
      setShowRemoveConfirm(false);
    }
  }, [isOpen, currentResume]);

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

  if (!isOpen) return null;

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const allowedExtensions = [".pdf", ".doc", ".docx"];
      const fileExtension = file.name
        .toLowerCase()
        .slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2);

      if (
        !allowedTypes.includes(file.type) ||
        !allowedExtensions.includes(`.${fileExtension}`)
      ) {
        setError("Only PDF, DOC, and DOCX files are allowed");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size too large. Maximum size is 5MB");
        return;
      }

      setSelectedFile(file);
      setError(null);
      setHasResume(true);
      setShowRemoveConfirm(false); // Hide remove confirmation if new file selected
    }
  };

  const handleRemoveResume = () => {
    if (currentResume.url && !selectedFile) {
      // If there's an existing resume and no new file selected, show confirmation
      setShowRemoveConfirm(true);
    } else {
      // If there's a newly selected file, just clear it
      setSelectedFile(null);
      setHasResume(false);
      setError(null);
      setShowRemoveConfirm(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const confirmRemoveResume = async () => {
    try {
      setIsUploading(true);
      setError(null);

      // Call onSave with null to remove the resume
      await onSave(null);

      onClose();
    } catch (error) {
      console.error("Error removing resume:", error);
      setError(
        error instanceof Error ? error.message : "Failed to remove resume"
      );
    } finally {
      setIsUploading(false);
      setShowRemoveConfirm(false);
    }
  };

  const cancelRemoveResume = () => {
    setShowRemoveConfirm(false);
  };

  const handleSave = async () => {
    try {
      setIsUploading(true);
      setError(null);

      // Determine what to send: if selectedFile exists, send it; if no resume selected and had resume, send null (remove)
      let fileToSave;
      if (selectedFile) {
        fileToSave = selectedFile;
      } else if (!hasResume && currentResume.url) {
        fileToSave = null; // Remove existing resume
      } else {
        // No change - just close the modal
        onClose();
        return;
      }

      await onSave(fileToSave);
      onClose();
    } catch (error) {
      console.error("Error saving resume:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save resume"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setError(null);
    setHasResume(!!currentResume.url);
    setShowRemoveConfirm(false);
    onClose();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Helper function to truncate filename
  const truncateFileName = (
    fileName: string,
    maxLength: number = 20
  ): string => {
    if (!fileName) return "";

    if (fileName.length <= maxLength) return fileName;

    const extensionIndex = fileName.lastIndexOf(".");
    if (extensionIndex === -1) {
      return fileName.substring(0, maxLength) + "...";
    }

    const name = fileName.substring(0, extensionIndex);
    const extension = fileName.substring(extensionIndex);
    const maxNameLength = maxLength - extension.length - 3; // Account for "..."

    if (name.length <= maxNameLength) return fileName;

    return name.substring(0, maxNameLength) + "..." + extension;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Handle click on overlay (outside modal) to close
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div className="resume-modal-overlay" onClick={handleOverlayClick}>
      <div
        className="resume-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="resume-close-button"
          aria-label="Close"
          onClick={handleCancel}
        >
          <img src={closeIcon} alt="Close Icon" />
        </button>

        <div className="resume-modal-content">
          {/* Header Section */}
          <header className="resume-modal-header">
            <h2 className="resume-modal-title">Resume</h2>
            <p className="resume-modal-subtitle">
              Upload your resume (PDF, DOC, DOCX, Max 5MB)
            </p>
          </header>

          {/* Form Section */}
          <div className="resume-modal-form">
            <div className="resume-form-fields-wrapper">
              {/* Upload Area */}
              <div className="resume-upload-area" onClick={triggerFileInput}>
                <div className="resume-upload-icon">
                  <img
                    src={uploadIcon}
                    alt="Upload"
                    className="upload-icon-image"
                  />
                </div>
                <div className="resume-upload-text">
                  <p className="resume-upload-title">Click to upload resume</p>
                  <p className="resume-upload-subtitle">
                    Supported files: .pdf, .doc, .docx (Max size: 5MB)
                  </p>
                </div>
              </div>

              {/* File Info Row - Show current or selected file */}
              {(currentResume.fileName || selectedFile) && (
                <div className="resume-file-row">
                  <div className="resume-file-info">
                    <img
                      src={fileIcon}
                      alt="File Icon"
                      className="resume-icon-file"
                    />
                    <div className="resume-file-details">
                      <span
                        className="resume-file-name"
                        title={selectedFile?.name || currentResume.fileName}
                      >
                        {truncateFileName(
                          selectedFile?.name || currentResume.fileName
                        )}
                      </span>
                      <span className="resume-file-size">
                        {formatFileSize(
                          selectedFile?.size || currentResume.fileSize
                        )}
                      </span>
                    </div>
                  </div>
                  <button
                    className="resume-remove-button"
                    onClick={handleRemoveResume}
                    disabled={isUploading}
                  >
                    <img
                      src={trashIcon}
                      alt="Trash Icon"
                      className="resume-icon-trash"
                    />
                    <span className="resume-remove-text">Remove</span>
                  </button>
                </div>
              )}

              {/* Remove Confirmation Dialog */}
              {showRemoveConfirm && (
                <div className="resume-confirm-dialog">
                  <div className="resume-confirm-content">
                    <p className="resume-confirm-text">
                      Are you sure you want to remove your resume?
                    </p>
                    <div className="resume-confirm-buttons">
                      <button
                        className="resume-btn resume-btn-cancel"
                        onClick={cancelRemoveResume}
                        disabled={isUploading}
                      >
                        Cancel
                      </button>
                      <button
                        className="resume-btn resume-btn-remove"
                        onClick={confirmRemoveResume}
                        disabled={isUploading}
                      >
                        {isUploading ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="resume-error-message">
                  <span className="resume-error-text">{error}</span>
                </div>
              )}

              {/* Info Text */}
              <div className="resume-info-text">
                <p>
                  The resume stands as the most crucial document that recruiters
                  prioritize, often disregarding profiles lacking this essential
                  component.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="resume-action-buttons">
              <button
                className="resume-btn resume-btn-cancel"
                onClick={handleCancel}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                className="resume-btn resume-btn-save"
                onClick={handleSave}
                disabled={
                  isUploading ||
                  (!selectedFile && !currentResume.url && !showRemoveConfirm)
                }
              >
                {isUploading ? (
                  <>
                    <span className="resume-saving-spinner"></span>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
};

export default ResumeEditor;
