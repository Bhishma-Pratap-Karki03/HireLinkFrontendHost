import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import "../../styles/ProfilePictureEditor.css";

// Import images
import defaultAvatar from "../../images/Register Page Images/Default Profile.webp";
import closeIcon from "../../images/Candidate Profile Page Images/corss icon.png";
import trashIcon from "../../images/Candidate Profile Page Images/trash.png";
import fileIcon from "../../images/Candidate Profile Page Images/image icon.png";

interface ProfilePictureEditorProps {
  currentImage: string;
  userName: string;
  currentJobTitle?: string;
  currentProfileVisibility?: "public" | "private";
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    imageFile?: File | null;
    currentJobTitle: string;
    profileVisibility: "public" | "private";
  }) => void;
}

const ProfilePictureEditor: React.FC<ProfilePictureEditorProps> = ({
  currentImage,
  userName,
  currentJobTitle: initialJobTitle = "",
  currentProfileVisibility = "public",
  isOpen,
  onClose,
  onSave,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(currentImage);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentJobTitle, setCurrentJobTitle] =
    useState<string>(initialJobTitle);
  const [isPublicProfile, setIsPublicProfile] = useState<boolean>(
    currentProfileVisibility === "public"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDefaultImage, setIsDefaultImage] = useState<boolean>(false);
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasImageChanged, setHasImageChanged] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);

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
    setCurrentJobTitle(initialJobTitle);
    setIsPublicProfile(currentProfileVisibility === "public");

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [currentImage, isOpen, initialJobTitle, currentProfileVisibility]);

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
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file (JPG, PNG, etc.)");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size too large. Maximum size is 5MB");
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

      // Determine what to send: if imageFile exists, send it; if null, send null (remove); if undefined, don't send
      let imagePayload;
      if (hasImageChanged) {
        imagePayload = isDefaultImage ? null : imageFile;
      } else {
        imagePayload = undefined; // No change to image
      }

      console.log("Saving profile with:", {
        hasImageChanged,
        isDefaultImage,
        imageFile: imageFile ? imageFile.name : "null",
        currentJobTitle,
        imagePayload:
          imagePayload === null
            ? "null (remove)"
            : imagePayload
            ? "file"
            : "undefined",
      });

      // Call the parent's onSave with both the image file (if changed) and current job title
      await onSave({
        imageFile: imagePayload,
        currentJobTitle,
        profileVisibility: isPublicProfile ? "public" : "private",
      });

      onClose();
    } catch (error) {
      console.error("Error saving profile:", error);
      // Don't show alert here, let parent component handle it
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
    setCurrentJobTitle(initialJobTitle);
    setIsPublicProfile(currentProfileVisibility === "public");
    setHasImageChanged(false);
    onClose();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Helper function to truncate filename to 10 characters
  const truncateFileName = (
    fileName: string,
    maxLength: number = 10
  ): string => {
    if (!fileName) return "";

    // Get file extension
    const lastDotIndex = fileName.lastIndexOf(".");
    const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : "";
    const nameWithoutExt =
      lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;

    // Truncate name part if needed
    if (nameWithoutExt.length > maxLength) {
      return nameWithoutExt.substring(0, maxLength) + "..." + extension;
    }

    return fileName;
  };

  // Handle click on overlay (outside modal) to close
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="modal-container"
        ref={modalRef}
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
            <div className="profile-avatar-group" onClick={triggerFileInput}>
              {/* Main Avatar */}
              <img
                src={selectedImage}
                className="avatar-base"
                alt="Profile Picture"
                onError={(e) => {
                  // If image fails to load, show default avatar
                  e.currentTarget.src = defaultAvatar;
                }}
              />
              {/* Camera Badge Background */}
              <img
                src={defaultAvatar}
                className="avatar-badge-bg"
                alt=""
                style={{ opacity: 0 }}
              />
              {/* Camera Icon */}
              <svg
                className="avatar-badge-icon"
                width="18"
                height="16"
                viewBox="0 0 18 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 3.5C12 4.32843 12.6716 5 13.5 5C14.3284 5 15 4.32843 15 3.5C15 2.67157 14.3284 2 13.5 2C12.6716 2 12 2.67157 12 3.5Z"
                  fill="white"
                />
                <path
                  d="M16 1H13.83L12.59 0.15C12.22 -0.06 11.78 -0.05 11.41 0.15L10.17 1H8C6.9 1 6 1.9 6 3V13C6 14.1 6.9 15 8 15H16C17.1 15 18 14.1 18 13V3C18 1.9 17.1 1 16 1ZM9 8C9 9.66 10.34 11 12 11C13.66 11 15 9.66 15 8C15 6.34 13.66 5 12 5C10.34 5 9 6.34 9 8Z"
                  fill="white"
                />
              </svg>
            </div>
            <h2 className="modal-title">Basic Information</h2>
          </header>

          {/* Form Section */}
          <div className="modal-form">
            <div className="form-fields-wrapper">
              {/* File Info Row */}
              {!isDefaultImage && currentFileName && (
                <div className="file-row">
                  <div className="file-info">
                    <img src={fileIcon} alt="File Icon" className="icon-file" />
                    <span className="file-name" title={currentFileName}>
                      {truncateFileName(currentFileName)}
                    </span>
                  </div>
                  <button className="remove-button" onClick={handleRemoveImage}>
                    <img
                      src={trashIcon}
                      alt="Trash Icon"
                      className="icon-trash"
                    />
                    <span className="remove-text">Remove</span>
                  </button>
                </div>
              )}

              {/* Input Fields */}
              <div className="input-stack">
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="text-input"
                    value={userName}
                    readOnly
                    disabled
                  />
                </div>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Current Job Title"
                    value={currentJobTitle}
                    onChange={(e) => setCurrentJobTitle(e.target.value)}
                  />
                </div>
              </div>

              {/* Toggle Row */}
              <div className="toggle-row">
                <span className="toggle-label">
                  Public Profile: {isPublicProfile ? "On" : "Off"}
                </span>
                <button
                  className="toggle-switch"
                  onClick={() => setIsPublicProfile(!isPublicProfile)}
                  aria-label={
                    isPublicProfile
                      ? "Turn off public profile"
                      : "Turn on public profile"
                  }
                >
                  {isPublicProfile ? (
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
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="btn btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button
                className="btn btn-save"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
};

export default ProfilePictureEditor;
