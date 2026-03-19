import { ReactNode } from "react";
import "../../styles/RecruiterOverlay.css";

type RecruiterOverlayProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number | string;
};

const RecruiterOverlay = ({
  open,
  title,
  onClose,
  children,
  maxWidth = 760,
}: RecruiterOverlayProps) => {
  if (!open) return null;

  return (
    <div className="recruiter-overlay" onClick={onClose}>
      <div
        className="recruiter-overlay-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth }}
      >
        <div className="recruiter-overlay-header">
          <h3>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="recruiter-overlay-close"
          >
            ×
          </button>
        </div>
        <div className="recruiter-overlay-body">{children}</div>
      </div>
    </div>
  );
};

export default RecruiterOverlay;
