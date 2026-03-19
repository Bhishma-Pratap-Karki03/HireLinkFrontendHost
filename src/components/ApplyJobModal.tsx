import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import closeIcon from "../images/Candidate Profile Page Images/corss icon.png";

type ApplyModalJob = {
  jobTitle: string;
  companyName: string;
  education?: string;
  experience?: string;
};

type ApplyJobModalProps = {
  isOpen: boolean;
  loading: boolean;
  job: ApplyModalJob | null;
  profileResume: string;
  useCustomResume: boolean;
  customResumeFile: File | null;
  applyNote: string;
  confirmRequirements: boolean;
  confirmResume: boolean;
  applyError: string;
  applyMessage: string;
  onClose: () => void;
  onConfirm: () => void;
  onUseCustomResumeChange: (checked: boolean) => void;
  onCustomResumeChange: (file: File | null) => void;
  onApplyNoteChange: (value: string) => void;
  onConfirmRequirementsChange: (checked: boolean) => void;
  onConfirmResumeChange: (checked: boolean) => void;
};

const quillModules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "list",
  "bullet",
  "link",
];

const ApplyJobModal = ({
  isOpen,
  loading,
  job,
  profileResume,
  useCustomResume,
  customResumeFile,
  applyNote,
  confirmRequirements,
  confirmResume,
  applyError,
  applyMessage,
  onClose,
  onConfirm,
  onUseCustomResumeChange,
  onCustomResumeChange,
  onApplyNoteChange,
  onConfirmRequirementsChange,
  onConfirmResumeChange,
}: ApplyJobModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="apply-modal-overlay">
      <div className="apply-modal">
        <div className="apply-modal-header">
          <div>
            <h3>Confirm Application</h3>
            <p>Review your resume and confirm the requirements before applying.</p>
          </div>
          <button className="apply-modal-close" onClick={onClose}>
            <img src={closeIcon} alt="Close" />
          </button>
        </div>

        {loading && <p>Loading details...</p>}
        {!loading && job && (
          <div className="apply-modal-body">
            <div className="apply-modal-section">
              <h4>{job.jobTitle}</h4>
              <p className="apply-modal-muted">{job.companyName}</p>
            </div>

            <div className="apply-modal-section">
              <h5>Resume</h5>
              {profileResume ? (
                <a
                  href={`http://localhost:5000${profileResume}`}
                  target="_blank"
                  rel="noreferrer"
                  className="apply-modal-link"
                >
                  View current resume
                </a>
              ) : (
                <p className="apply-modal-muted">No resume on profile.</p>
              )}
              <label className="apply-modal-checkbox">
                <input
                  type="checkbox"
                  checked={useCustomResume}
                  onChange={(e) => onUseCustomResumeChange(e.target.checked)}
                />
                Use a different resume for this application (won't change your
                profile)
              </label>
              {useCustomResume && (
                <label className="apply-modal-upload">
                  <input
                    type="file"
                    onChange={(e) =>
                      onCustomResumeChange(e.target.files ? e.target.files[0] : null)
                    }
                  />
                  <div className="apply-modal-upload-inner">
                    <span className="apply-modal-upload-title">Upload new resume</span>
                    <span className="apply-modal-upload-subtitle">
                      PDF or DOCX ? Max 5MB
                    </span>
                    {customResumeFile && (
                      <>
                        <span className="apply-modal-upload-file">
                          {customResumeFile.name}
                        </span>
                        <button
                          type="button"
                          className="apply-modal-link apply-modal-preview-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            const url = URL.createObjectURL(customResumeFile);
                            window.open(url, "_blank", "noopener,noreferrer");
                          }}
                        >
                          Preview selected resume
                        </button>
                      </>
                    )}
                  </div>
                </label>
              )}
            </div>

            <div className="apply-modal-divider" />

            <div className="apply-modal-section">
              <h5>Requirements</h5>
              <p className="apply-modal-muted">
                Education: {job.education || "Not specified"}
              </p>
              <p className="apply-modal-muted">
                Experience: {job.experience || "Not specified"}
              </p>
              <label className="apply-modal-checkbox">
                <input
                  type="checkbox"
                  checked={confirmRequirements}
                  onChange={(e) => onConfirmRequirementsChange(e.target.checked)}
                />
                I confirm I meet the listed requirements.
              </label>
            </div>

            <div className="apply-modal-divider" />

            <div className="apply-modal-section">
              <h5>Message to recruiter (optional)</h5>
              <div className="apply-modal-quill">
                <ReactQuill
                  theme="snow"
                  value={applyNote}
                  onChange={onApplyNoteChange}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Add a short note for the recruiter..."
                />
              </div>
            </div>

            <label className="apply-modal-checkbox">
              <input
                type="checkbox"
                checked={confirmResume}
                onChange={(e) => onConfirmResumeChange(e.target.checked)}
              />
              I have reviewed my resume and want to apply.
            </label>
          </div>
        )}

        {applyError && <div className="apply-modal-error">{applyError}</div>}
        {applyMessage && <div className="apply-modal-success">{applyMessage}</div>}

        <div className="apply-modal-actions">
          <button className="apply-modal-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="apply-modal-primary" onClick={onConfirm} disabled={loading}>
            Confirm & Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplyJobModal;
