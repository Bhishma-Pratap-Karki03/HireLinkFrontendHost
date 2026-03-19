import React, { useState, useRef, useEffect } from "react";
import "../../styles/RecruiterProfilePictureEditor.css";

// Import images
import defaultAvatar from "../../images/Register Page Images/Default Profile.webp";
import closeIcon from "../../images/Candidate Profile Page Images/corss icon.png";
import cameraIcon from "../../images/Recruiter Profile Page Images/cameraIcon.svg";

interface RecruiterProfilePictureEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    imageFile?: File | null;
    profileVisibility: "public" | "private";
  }) => Promise<void>;
  currentImage?: string;
  currentProfileVisibility?: "public" | "private";
}

const RecruiterProfilePictureEditor: React.FC<
  RecruiterProfilePictureEditorProps
> = ({
  isOpen,
  onClose,
  onSave,
  currentImage,
  currentProfileVisibility = "public",
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(
    currentImage || defaultAvatar
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when currentImage changes
  useEffect(() => {
    if (currentImage) {
      setPreviewUrl(currentImage);
    }
  }, [currentImage]);

  useEffect(() => {
    if (!isOpen) return;
    setIsPublicProfile(currentProfileVisibility === "public");
  }, [isOpen, currentProfileVisibility]);

  // Handle file selection from input
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // Create preview URL for the selected file
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Remove selected file and reset to default avatar
  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(defaultAvatar);
  };

  // Save changes and close editor
  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onSave({
        imageFile:
          selectedFile === null && previewUrl === defaultAvatar
            ? null
            : selectedFile,
        profileVisibility: isPublicProfile ? "public" : "private",
      });
      onClose();
    } catch (error) {
      console.error("Error saving profile picture:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="profile-picture-editor-overlay">
      <div className="profile-picture-editor-modal">
        <div className="profile-picture-editor-header">
          <h2>Edit Company Logo</h2>
          <button className="close-button" onClick={onClose}>
            <img src={closeIcon} alt="Close" />
          </button>
        </div>

        <div className="profile-picture-editor-content">
          {/* Profile Preview - Larger preview for better visibility */}
          <div className="profile-preview-container">
            <div className="profile-preview-wrapper recruiter-preview">
              <img
                src={previewUrl}
                alt="Logo Preview"
                className="profile-preview-image"
                onError={(e) => {
                  e.currentTarget.src = defaultAvatar;
                }}
              />
            </div>
            <p className="preview-label">Company Logo Preview</p>
          </div>

          {/* Upload Options */}
          <div className="upload-options">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="file-input"
            />

            <button className="upload-button" onClick={handleUploadClick}>
              <img src={cameraIcon} alt="Upload" />
              Upload New Logo
            </button>

            {/* Remove button with centered text */}
            <button className="remove-button" onClick={handleRemove}>
              <span>Remove Logo</span>
            </button>
          </div>

          <div className="recruiter-visibility-row">
            <span className="recruiter-visibility-label">
              Public Profile: {isPublicProfile ? "Public" : "Private"}
            </span>
            <button
              type="button"
              className="recruiter-visibility-toggle"
              onClick={() => setIsPublicProfile((prev) => !prev)}
              aria-label={
                isPublicProfile
                  ? "Turn off public profile"
                  : "Turn on public profile"
              }
            >
              {!isPublicProfile ? (
                <svg
                  width="44"
                  height="24"
                  viewBox="0 0 44 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="44" height="24" rx="12" fill="#0068CE" />
                  <circle cx="30" cy="12" r="8" fill="white" />
                </svg>
              ) : (
                <svg
                  width="44"
                  height="24"
                  viewBox="0 0 44 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="44" height="24" rx="12" fill="#E5E7EB" />
                  <circle cx="14" cy="12" r="8" fill="white" />
                </svg>
              )}
            </button>
          </div>

          {/* File Info */}
          <div className="file-info">
            <p>Recommended: 400×400px (JPG, PNG). Max Size 2MB</p>
          </div>
        </div>

        <div className="profile-picture-editor-actions">
          <button
            className="cancel-button"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="save-button"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecruiterProfilePictureEditor;
