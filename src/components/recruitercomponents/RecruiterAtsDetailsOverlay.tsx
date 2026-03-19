import { useEffect, useState } from "react";
import RecruiterOverlay from "./RecruiterOverlay";
import "../../styles/RecruiterAtsRankingPage.css";
import dropdownArrow from "../../images/Register Page Images/1_2307.svg";

type AssessmentSummary = {
  attached: boolean;
  required: boolean;
  submitted: boolean;
  submittedAt: string | null;
  score: number | null;
  writingResponse: string;
  writingLink: string;
  codeResponse: string;
  codeLink: string;
};

type ApplicantItem = {
  id: string;
  status: string;
  resumeUrl: string;
  assessment?: AssessmentSummary;
};

type ReportItem = {
  candidate: {
    fullName: string;
  };
  matchedSkills: string[];
  missingSkills: string[];
  experienceMatch?: boolean;
  extracted?: {
    experienceYears?: number;
  };
};

type RecruiterAtsDetailsOverlayProps = {
  open: boolean;
  report: ReportItem | null;
  application?: ApplicantItem;
  statusUpdating: string | null;
  onClose: () => void;
  onStatusChange: (applicationId: string, nextStatus: string) => void;
  onViewAssessment: (applicationId: string) => void;
};

const STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "reviewed", label: "Reviewed" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview", label: "Interview" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
];

const formatExperienceLabel = (report: ReportItem) =>
  `${report.experienceMatch ? "Matched" : "Not matched"} ${
    report.extracted?.experienceYears ? `(${report.extracted.experienceYears} yrs)` : ""
  }`.trim();

const formatSubmittedDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
};

const hasAssessmentSubmission = (assessment?: AssessmentSummary) =>
  Boolean(
    assessment &&
      (assessment.submitted ||
        !!assessment.submittedAt ||
        assessment.score !== null ||
        !!assessment.writingResponse ||
        !!assessment.writingLink ||
        !!assessment.codeResponse ||
        !!assessment.codeLink),
  );

const RecruiterAtsDetailsOverlay = ({
  open,
  report,
  application,
  statusUpdating,
  onClose,
  onStatusChange,
  onViewAssessment,
}: RecruiterAtsDetailsOverlayProps) => {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsStatusDropdownOpen(false);
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".recruiter-ats-status-dropdown")) return;
      setIsStatusDropdownOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <RecruiterOverlay
      open={open}
      title={report?.candidate.fullName || "ATS details"}
      onClose={onClose}
      maxWidth={960}
    >
      {report && (
        <div className="recruiter-ats-overlay-shell">
          <div className="recruiter-ats-overlay-top-grid">
            <section className="recruiter-ats-overlay-panel recruiter-ats-overlay-panel-status">
              <span className="recruiter-ats-overlay-label">Status</span>
              {application ? (
                <div className="recruiter-ats-status-control">
                  <div className="recruiter-ats-status-dropdown">
                    <button
                      type="button"
                      className={`recruiter-ats-status-trigger ${
                        isStatusDropdownOpen ? "open" : ""
                      }`}
                      onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                      disabled={statusUpdating === application.id}
                    >
                      <span>
                        {STATUS_OPTIONS.find((item) => item.value === application.status)
                          ?.label || "Submitted"}
                      </span>
                      <img
                        src={dropdownArrow}
                        alt=""
                        aria-hidden="true"
                        className={`recruiter-ats-status-caret ${
                          isStatusDropdownOpen ? "open" : ""
                        }`}
                      />
                    </button>
                    {isStatusDropdownOpen && (
                      <div className="recruiter-ats-status-menu" role="listbox">
                        {STATUS_OPTIONS.map((statusOption) => (
                          <button
                            key={statusOption.value}
                            type="button"
                            className={`recruiter-ats-status-option ${
                              application.status === statusOption.value ? "active" : ""
                            }`}
                            onClick={() => {
                              setIsStatusDropdownOpen(false);
                              if (application.status === statusOption.value) return;
                              onStatusChange(application.id, statusOption.value);
                            }}
                          >
                            {statusOption.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="recruiter-ats-overlay-value">-</p>
              )}
            </section>

            <section className="recruiter-ats-overlay-panel">
              <span className="recruiter-ats-overlay-label">Resume</span>
              {application?.resumeUrl ? (
                <a
                  href={`http://localhost:5000${application.resumeUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="recruiter-ats-link-btn"
                >
                  View Resume
                </a>
              ) : (
                <p className="recruiter-ats-overlay-value">Not available</p>
              )}
            </section>

            <section className="recruiter-ats-overlay-panel">
              <span className="recruiter-ats-overlay-label">Assessment</span>
              {application && hasAssessmentSubmission(application.assessment) ? (
                <div className="recruiter-ats-overlay-assessment">
                  <button
                    className="recruiter-ats-link-btn"
                    onClick={() => onViewAssessment(application.id)}
                  >
                    View Assessment
                  </button>
                  <small>
                    Submitted {formatSubmittedDate(application.assessment?.submittedAt)}
                  </small>
                </div>
              ) : (
                <p className="recruiter-ats-overlay-value">Not submitted</p>
              )}
            </section>
          </div>

          <div className="recruiter-ats-overlay-insights-grid">
            <section className="recruiter-ats-overlay-panel">
              <span className="recruiter-ats-overlay-label">Matched Skills</span>
              <p className="recruiter-ats-overlay-value">
                {report.matchedSkills?.length
                  ? report.matchedSkills.join(", ")
                  : "No matches"}
              </p>
            </section>

            <section className="recruiter-ats-overlay-panel">
              <span className="recruiter-ats-overlay-label">Missing Skills</span>
              <p className="recruiter-ats-overlay-value">
                {report.missingSkills?.length
                  ? report.missingSkills.join(", ")
                  : "None"}
              </p>
            </section>

            <section className="recruiter-ats-overlay-panel recruiter-ats-overlay-panel-wide">
              <span className="recruiter-ats-overlay-label">Experience Match</span>
              <p className="recruiter-ats-overlay-value">{formatExperienceLabel(report)}</p>
            </section>
          </div>
        </div>
      )}
    </RecruiterOverlay>
  );
};

export default RecruiterAtsDetailsOverlay;
