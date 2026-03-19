import React, { useState, useEffect, useRef } from "react";
import "../../styles/RecruiterWorkspaceGalleryEditor.css";

// Import images
import closeIcon from "../../images/Candidate Profile Page Images/corss icon.png";
import deleteIcon from "../../images/Recruiter Profile Page Images/6_80.svg";
import reorderIcon from "../../images/Recruiter Profile Page Images/6_344.svg";

interface WorkspaceImage {
  _id: string;
  imageUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  order: number;
}

interface RecruiterWorkspaceGalleryEditorProps {
  currentImages: WorkspaceImage[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    uploadedImages: File[];
    deletedImageIds: string[];
    reorderedImageIds: string[];
  }) => Promise<void>;
}

const RecruiterWorkspaceGalleryEditor: React.FC<
  RecruiterWorkspaceGalleryEditorProps
> = ({ currentImages, isOpen, onClose, onSave }) => {
  const [images, setImages] = useState<WorkspaceImage[]>(currentImages || []);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [objectUrls, setObjectUrls] = useState<string[]>([]);
  const [hasSaved, setHasSaved] = useState(false);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log("Modal opened with images:", currentImages);
      setImages(currentImages || []);
      setUploadedFiles([]);
      setDeletedImageIds([]);
      setIsSaving(false);
      setError(null);
      setSuccessMessage(null);
      setHasSaved(false);

      // Clean up old object URLs
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      setObjectUrls([]);
    }
  }, [isOpen, currentImages]);

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

  // Calculate slots - ALLOW 6 IMAGES NOW
  const totalSlots = 6; // Maximum 6 images allowed

  // Count only images that are NOT marked for deletion
  const existingImagesCount = images.filter(
    (img) => !deletedImageIds.includes(img._id)
  ).length;

  // Total images = existing (non-deleted) + newly uploaded
  const totalImages = existingImagesCount + uploadedFiles.length;
  
  // Remaining slots = max allowed - current total
  const remainingSlots = Math.max(0, totalSlots - totalImages);

  // Debug logs for slot calculation
  useEffect(() => {
    console.log("Slot calculation DEBUG:", {
      totalSlots,
      imagesCount: images.length,
      deletedImageIds: deletedImageIds,
      existingImagesCount,
      uploadedFilesCount: uploadedFiles.length,
      totalImages,
      remainingSlots,
      imagesNotDeleted: images.filter(
        (img) => !deletedImageIds.includes(img._id)
      ),
    });
  }, [images, deletedImageIds, uploadedFiles]);

  // Handle file selection from EMPTY SLOTS
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    console.log("Files selected:", newFiles.length);

    // Check if files exceed available slots
    if (newFiles.length > remainingSlots) {
      setError(`You can only upload ${remainingSlots} more image(s)`);
      setTimeout(() => setError(null), 3000);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    const errors: string[] = [];

    newFiles.forEach((file) => {
      console.log("Validating file:", file.name, file.type, file.size);

      // Check file type
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!validTypes.includes(file.type)) {
        errors.push(
          `${file.name}: Only image files are allowed (JPG, JPEG, PNG, WEBP, GIF)`
        );
        return;
      }

      // Check file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        errors.push(`${file.name}: File size too large. Maximum size is 5MB`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join("\n"));
      setTimeout(() => setError(null), 5000);
    }

    if (validFiles.length > 0) {
      console.log("Adding valid files:", validFiles.length);
      setUploadedFiles((prev) => {
        const newUploadedFiles = [...prev, ...validFiles];
        console.log("Updated uploaded files:", newUploadedFiles.length);
        return newUploadedFiles;
      });

      // Create object URLs for preview
      const newObjectUrls = validFiles.map((file) => URL.createObjectURL(file));
      setObjectUrls((prev) => [...prev, ...newObjectUrls]);

      setSuccessMessage(`${validFiles.length} image(s) selected successfully!`);
      setTimeout(() => setSuccessMessage(null), 2000);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle delete existing image - Mark for deletion but keep in state for preview
  const handleDeleteImage = (imageId: string) => {
    console.log("Deleting image:", imageId);

    // Mark image for deletion
    setDeletedImageIds((prev) => [...prev, imageId]);

    // DO NOT filter images from state yet - keep them for preview
    // The actual removal happens when saved
    setSuccessMessage("Image marked for deletion");
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  // Handle delete uploaded file
  const handleDeleteUploadedFile = (index: number) => {
    console.log("Deleting uploaded file at index:", index);

    // Revoke the object URL
    if (objectUrls[index]) {
      URL.revokeObjectURL(objectUrls[index]);
    }

    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setObjectUrls((prev) => prev.filter((_, i) => i !== index));
    setSuccessMessage("Uploaded image removed");
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  // Drag and drop reordering (only for non-deleted images)
  const handleDragStart = (index: number) => {
    const image = images[index];
    // Don't allow dragging deleted images
    if (deletedImageIds.includes(image._id)) {
      return;
    }
    setDragIndex(index);
  };

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const image = images[index];
    // Don't allow dropping on deleted images
    if (deletedImageIds.includes(image._id)) {
      return;
    }
  };

  const handleDropItem = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null) return;

    const draggedImage = images[dragIndex];
    const dropImage = images[dropIndex];

    // Don't allow reordering if either image is deleted
    if (
      deletedImageIds.includes(draggedImage._id) ||
      deletedImageIds.includes(dropImage._id)
    ) {
      setDragIndex(null);
      return;
    }

    console.log("Reordering: from", dragIndex, "to", dropIndex);

    const newImages = [...images];
    const [draggedImg] = newImages.splice(dragIndex, 1);
    newImages.splice(dropIndex, 0, draggedImg);

    // Update order property for non-deleted images only
    const nonDeletedImages = newImages.filter(
      (img) => !deletedImageIds.includes(img._id)
    );
    nonDeletedImages.forEach((img, idx) => {
      img.order = idx;
    });

    setImages(newImages);
    setDragIndex(null);
    setSuccessMessage("Image order updated");
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  // Get image URL for preview
  const getImageUrl = (
    image: WorkspaceImage | File,
    index?: number
  ): string => {
    if (image instanceof File) {
      // For uploaded files, use object URL
      if (index !== undefined && objectUrls[index]) {
        return objectUrls[index];
      }
      return URL.createObjectURL(image);
    }

    // For existing images from database
    const imageUrl = image.imageUrl.startsWith("/")
      ? image.imageUrl
      : `/uploads/workspaceimages/${image.imageUrl}`;

    return `http://localhost:5000${imageUrl}?t=${Date.now()}`;
  };

  // Save changes
  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Calculate final image count after deletions and before uploads
      const imagesAfterDeletion = images.filter(
        (img) => !deletedImageIds.includes(img._id)
      );
      const finalImageCount = imagesAfterDeletion.length + uploadedFiles.length;

      console.log("Submitting workspace gallery changes:", {
        existingImages: images.length,
        deletedCount: deletedImageIds.length,
        imagesAfterDeletion: imagesAfterDeletion.length,
        uploadedFiles: uploadedFiles.length,
        finalImageCount,
        maxAllowed: totalSlots,
      });

      // Validate final count before proceeding
      if (finalImageCount > totalSlots) {
        const excess = finalImageCount - totalSlots;
        setError(
          `Cannot save: You are trying to upload ${uploadedFiles.length} image(s), but after deletions you will have ${imagesAfterDeletion.length} existing images. This would exceed the maximum of ${totalSlots} images by ${excess}. Please remove ${excess} more image(s) or reduce the number of uploads.`
        );
        setIsSaving(false);
        return;
      }

      // Get reordered image IDs (only non-deleted images)
      const reorderedImageIds = imagesAfterDeletion.map((img) => img._id);
      console.log("Reordered image IDs (non-deleted only):", reorderedImageIds);

      await onSave({
        uploadedImages: uploadedFiles,
        deletedImageIds: deletedImageIds,
        reorderedImageIds: reorderedImageIds,
      });

      // Mark as saved
      setHasSaved(true);

      // Clean up object URLs
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      setObjectUrls([]);

      setSuccessMessage("Gallery updated successfully!");

      // Close after 1.5 seconds
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error("Error saving workspace gallery:", error);
      setError(error.message || "Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    console.log("Cancelling changes");

    // Clean up object URLs
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    setObjectUrls([]);

    setImages(currentImages || []);
    setUploadedFiles([]);
    setDeletedImageIds([]);
    onClose();
  };

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  // Handle empty slot click
  const handleEmptySlotClick = () => {
    if (remainingSlots > 0 && !isSaving && !hasSaved) {
      fileInputRef.current?.click();
    } else if (remainingSlots <= 0) {
      setError("Maximum 6 images reached. Remove some images to add new ones.");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="workspace-gallery-modal-overlay"
      onClick={handleOverlayClick}
    >
      <div
        className="workspace-gallery-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="workspace-gallery-close-button"
          aria-label="Close"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <img src={closeIcon} alt="Close Icon" />
        </button>

        <div className="workspace-gallery-modal-content">
          {/* Header Section */}
          <header className="workspace-gallery-modal-header">
            <h2 className="workspace-gallery-modal-title">
              Workplace Gallery Editor
            </h2>
            <p className="workspace-gallery-modal-subtitle">
              Manage your workplace images (Maximum 6 images allowed){" "}
              {/* Updated text */}
            </p>
            <div className="workspace-gallery-counter">
              <span className="workspace-gallery-count">{totalImages}</span>
              <span className="workspace-gallery-separator">/</span>
              <span className="workspace-gallery-total">{totalSlots}</span>
              <span className="workspace-gallery-label">images uploaded</span>
            </div>
          </header>

          {/* Error Message */}
          {error && (
            <div className="workspace-gallery-error-message">
              <div className="error-icon">!</div>
              <div className="error-text">{error}</div>
              <button className="error-close" onClick={() => setError(null)}>
                ×
              </button>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="workspace-gallery-success-message">
              <div className="success-icon">✓</div>
              <div className="success-text">{successMessage}</div>
              <button
                className="success-close"
                onClick={() => setSuccessMessage(null)}
              >
                ×
              </button>
            </div>
          )}

          {/* Upload Instructions - STATIC AREA (Non-clickable) */}
          <div className="workspace-gallery-upload-instructions">
            <div className="instructions-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="#2481fb">
                <path d="M19 13C19.7 13 20.37 13.1 21 13.3V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.1 3.89 23 5 23H13.81C13.3 22.12 13 21.1 13 20C13 16.13 16.13 13 20 13C20.36 13 20.72 13.03 21.08 13.08C20.75 13.03 20.38 13 20 13C19.66 13 19.33 13.03 19 13.08V13ZM14 2.5L19.5 8H14V2.5ZM20 15V18H23V20H20V23H18V20H15V18H18V15H20Z" />
              </svg>
            </div>
            <div className="instructions-content">
              <h3 className="instructions-title">How to Upload Images</h3>
              <p className="instructions-description">
                <strong>Click on any empty slot below</strong> to select images
                from your computer.
                {remainingSlots > 0 ? (
                  <>
                    {" "}
                    You can upload up to <strong>{remainingSlots}</strong> more
                    image(s).
                  </>
                ) : (
                  <> All slots are filled. Remove images to add new ones.</>
                )}
              </p>
              <div className="instructions-tips">
                <span className="tip-item">
                  • Supported formats: JPG, PNG, WEBP, GIF
                </span>
                <span className="tip-item">
                  • Maximum file size: 5MB per image
                </span>
                <span className="tip-item">
                  • Drag & drop to reorder existing images
                </span>
              </div>
            </div>
          </div>

          {/* Image Grid */}
          <div className="workspace-gallery-grid">
            {/* Existing Images - Show all images including those marked for deletion */}
            {images
              .sort((a, b) => a.order - b.order)
              .map((image, index) => {
                const isDeleted = deletedImageIds.includes(image._id);

                return (
                  <div
                    key={image._id}
                    className={`workspace-gallery-image-item ${
                      isDeleted ? "marked-for-delete" : ""
                    }`}
                    draggable={!isSaving && !hasSaved && !isDeleted}
                    onDragStart={() =>
                      !isSaving &&
                      !hasSaved &&
                      !isDeleted &&
                      handleDragStart(index)
                    }
                    onDragOver={(e) =>
                      !isSaving &&
                      !hasSaved &&
                      !isDeleted &&
                      handleDragOverItem(e, index)
                    }
                    onDrop={(e) =>
                      !isSaving &&
                      !hasSaved &&
                      !isDeleted &&
                      handleDropItem(e, index)
                    }
                  >
                    <div className="workspace-gallery-image-wrapper">
                      <img
                        src={getImageUrl(image)}
                        alt={`Workspace ${index + 1}`}
                        className="workspace-gallery-image"
                        onError={(e) => {
                          console.error(
                            "Failed to load image:",
                            image.imageUrl
                          );
                          e.currentTarget.src = `https://via.placeholder.com/300x200?text=Image+${
                            index + 1
                          }`;
                        }}
                      />
                      {isDeleted && (
                        <div className="delete-overlay">
                          <span>Marked for deletion</span>
                        </div>
                      )}
                      <div className="workspace-gallery-image-overlay">
                        <button
                          className="workspace-gallery-delete-btn"
                          onClick={() => handleDeleteImage(image._id)}
                          disabled={isSaving || hasSaved || isDeleted}
                          type="button"
                          title={
                            isDeleted
                              ? "Already marked for deletion"
                              : "Delete image"
                          }
                        >
                          <img src={deleteIcon} alt="Delete" />
                        </button>
                        {!isDeleted && (
                          <div className="workspace-gallery-reorder-handle">
                            <img src={reorderIcon} alt="Reorder" />
                            <span>Drag to reorder</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="workspace-gallery-image-info">
                      <span className="workspace-gallery-image-name">
                        {image.fileName}
                        {isDeleted && " (Will be deleted)"}
                      </span>
                      <span className="workspace-gallery-image-size">
                        {(image.fileSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                );
              })}

            {/* Uploaded Files Preview */}
            {uploadedFiles.map((file, index) => (
              <div
                key={`uploaded-${index}`}
                className="workspace-gallery-image-item"
              >
                <div className="workspace-gallery-image-wrapper">
                  <img
                    src={getImageUrl(file, index)}
                    alt={`New ${index + 1}`}
                    className="workspace-gallery-image"
                  />
                  <div className="workspace-gallery-image-overlay">
                    <button
                      className="workspace-gallery-delete-btn"
                      onClick={() => handleDeleteUploadedFile(index)}
                      disabled={isSaving || hasSaved}
                      type="button"
                      title="Delete uploaded image"
                    >
                      <img src={deleteIcon} alt="Delete" />
                    </button>
                    <div className="workspace-gallery-new-badge">New</div>
                  </div>
                </div>
                <div className="workspace-gallery-image-info">
                  <span className="workspace-gallery-image-name">
                    {file.name}
                  </span>
                  <span className="workspace-gallery-image-size">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
            ))}

            {/* Empty Slots - Show only if not saved yet and slots available */}
            {!hasSaved && remainingSlots > 0 && (
              <>
                {Array.from({ length: remainingSlots }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="workspace-gallery-empty-slot"
                    onClick={handleEmptySlotClick}
                  >
                    <div className="workspace-gallery-empty-content">
                      <div className="workspace-gallery-empty-icon">+</div>
                      <span className="workspace-gallery-empty-text">
                        Click to upload
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileSelect}
            disabled={remainingSlots <= 0 || isSaving || hasSaved}
            className="workspace-gallery-file-input-hidden"
          />

          {/* Status Message */}
          <div className="workspace-gallery-status">
            {!hasSaved ? (
              <>
                {remainingSlots > 0 && (
                  <p className="available-status">
                    <strong>{remainingSlots}</strong> slot(s) available for
                    upload
                  </p>
                )}
                {uploadedFiles.length > 0 && (
                  <p className="upload-status">
                    {uploadedFiles.length} new image(s) ready to upload
                  </p>
                )}
                {deletedImageIds.length > 0 && (
                  <p className="delete-status">
                    {deletedImageIds.length} image(s) marked for deletion
                  </p>
                )}
                {totalImages === 0 && (
                  <p className="empty-status">
                    No images in gallery. Click on empty slots to upload images.
                  </p>
                )}
              </>
            ) : (
              <p className="saved-status">
                ✓ Changes saved successfully! Close this window to continue.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="workspace-gallery-action-buttons">
            <button
              className="workspace-gallery-btn workspace-gallery-btn-cancel"
              onClick={handleCancel}
              disabled={isSaving}
              type="button"
            >
              {hasSaved ? "Close" : "Cancel"}
            </button>

            {!hasSaved && (
              <button
                className="workspace-gallery-btn workspace-gallery-btn-save"
                onClick={handleSubmit}
                disabled={
                  isSaving ||
                  (uploadedFiles.length === 0 &&
                    deletedImageIds.length === 0 &&
                    totalImages === 0)
                }
                type="button"
              >
                {isSaving ? (
                  <>
                    <span className="spinner"></span>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterWorkspaceGalleryEditor;
