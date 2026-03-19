import React, { useState, useRef, useEffect } from "react";
import "../../styles/AdminProfilePictureEditor.css";

// Import images
import defaultAvatar from "../../images/Register Page Images/Default Profile.webp";
import closeIcon from "../../images/Candidate Profile Page Images/corss icon.png";
import trashIcon from "../../images/Candidate Profile Page Images/trash.png";
import fileIcon from "../../images/Candidate Profile Page Images/image icon.png";
import cameraIcon from "../../images/Recruiter Profile Page Images/cameraIcon.svg";

interface AdminProfilePictureEditorProps {
  currentImage: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { imageFile?: File | null }) => Promise<void>;
}

const AdminProfilePictureEditor: React.FC<AdminProfilePictureEditorProps> = ({
  currentImage,
  isOpen,
  onClose,
  onSave,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(currentImage);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDefaultImage, setIsDefaultImage] = useState<boolean>(false);
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasImageChanged, setHasImageChanged] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset selected image to current image when modal opens
    if (isOpen) {
      setSelectedImage(currentImage);
    }

    // Check if current image is the default one
    const isDefault =
      !currentImage ||
      currentImage === "" ||
      currentImage.includes("Default Profile") ||
      currentImage.includes("Default Profile.webp");
    setIsDefaultImage(isDefault);

    // Reset file state
    setImageFile(null);
    setHasImageChanged(false);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [currentImage, isOpen]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        alert("File size too large. Maximum size is 2MB.");
        return;
      }

      // Check file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        alert("Invalid file type. Please upload JPG, PNG, or WebP image.");
        return;
      }

      setImageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setIsDefaultImage(false);
      setCurrentFileName(file.name);
      setHasImageChanged(true);
    }
  };

  const handleRemoveImage = () => {
    // Set to default avatar
    setSelectedImage(defaultAvatar);
    setImageFile(null);
    setCurrentFileName("");
    setIsDefaultImage(true);
    setHasImageChanged(true);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Determine what to send
      let imagePayload;
      if (hasImageChanged) {
        imagePayload = isDefaultImage ? null : imageFile;
      } else {
        imagePayload = undefined; // No change to image
      }

      await onSave({
        imageFile: imagePayload,
      });

      onClose();
    } catch (error) {
      console.error("Error saving profile picture:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedImage(currentImage);
    setImageFile(null);
    setIsDefaultImage(
      !currentImage ||
        currentImage === "" ||
        currentImage.includes("Default Profile") ||
        currentImage.includes("Default Profile.webp")
    );
    setHasImageChanged(false);
    onClose();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle click on overlay (outside modal) to close
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  // Helper function to truncate filename
  const truncateFileName = (
    fileName: string,
    maxLength: number = 10
  ): string => {
    if (!fileName) return "";

    const lastDotIndex = fileName.lastIndexOf(".");
    const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : "";
    const nameWithoutExt =
      lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;

    if (nameWithoutExt.length > maxLength) {
      return nameWithoutExt.substring(0, maxLength) + "..." + extension;
    }

    return fileName;
  };

  return (
    <div className="admin-picture-modal-overlay" onClick={handleOverlayClick}>
      <div
        className="admin-picture-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="admin-picture-close-button"
          aria-label="Close"
          onClick={handleCancel}
        >
          <img src={closeIcon} alt="Close Icon" />
        </button>

        <div className="admin-picture-modal-content">
          {/* Header Section */}
          <header className="admin-picture-modal-header">
            <div
              className="admin-profile-avatar-group"
              onClick={handleUploadClick}
            >
              {/* Main Avatar */}
              <img
                src={selectedImage}
                className="admin-avatar-base"
                alt="Profile Picture"
                onError={(e) => {
                  e.currentTarget.src = defaultAvatar;
                }}
              />
            </div>
            <h2 className="admin-picture-modal-title">Edit Profile Picture</h2>
          </header>

          {/* Form Section */}
          <div className="admin-picture-modal-form">
            <div className="admin-picture-form-fields">
              {/* File Info Row */}
              {!isDefaultImage && currentFileName && (
                <div className="admin-file-info-row">
                  <div className="admin-file-info-content">
                    <img
                      src={fileIcon}
                      alt="File Icon"
                      className="admin-file-icon"
                    />
                    <span className="admin-file-name" title={currentFileName}>
                      {truncateFileName(currentFileName, 20)}
                    </span>
                  </div>
                  <button
                    className="admin-remove-file-button"
                    onClick={handleRemoveImage}
                  >
                    <img
                      src={trashIcon}
                      alt="Trash Icon"
                      className="admin-trash-icon"
                    />
                    <span className="admin-remove-text">Remove</span>
                  </button>
                </div>
              )}

              {/* Upload Button */}
              <div className="admin-picture-upload-button-container">
                <button
                  className="admin-picture-upload-btn"
                  onClick={handleUploadClick}
                >
                  <img src={cameraIcon} alt="Camera" />
                  <span>Choose New Image</span>
                </button>
              </div>

              {/* File Info */}
              <div className="admin-picture-file-info">
                <p>Recommended: 400×400px (JPG, PNG). Max Size 2MB</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="admin-picture-action-buttons">
              <button
                className="admin-picture-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                className="admin-picture-save-btn"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
};

export default AdminProfilePictureEditor;
