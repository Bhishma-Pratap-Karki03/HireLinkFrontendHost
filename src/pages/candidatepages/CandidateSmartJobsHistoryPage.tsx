import PortalFooter from "../../components/PortalFooter";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CandidateSidebar from "../../components/candidatecomponents/CandidateSidebar";
import CandidateTopBar from "../../components/candidatecomponents/CandidateTopBar";
import "../../styles/CandidateSmartJobsPage.css";
import prevIcon from "../../images/Employers Page Images/Prev Icon.svg";
import nextIcon from "../../images/Employers Page Images/Next Icon.svg";

type Recommendation = {
  jobId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  jobType: string;
  workMode: string;
  skillMatchPercent: number;
  matchedSkills: string[];
  reasons: string[];
};

const CandidateSmartJobsHistoryPage = () => {
  const ITEMS_PER_PAGE = 20;
  const navigate = useNavigate();
  const { historyId } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<Recommendation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchHistory = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }
    if (!historyId) return;

    try {
      setLoading(true);
      setError("");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/recommendations/history/${historyId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load recommendation history");
      }
      const sortedItems = [...(data.recommendations || [])].sort(
        (a: Recommendation, b: Recommendation) =>
          (b.skillMatchPercent || 0) - (a.skillMatchPercent || 0),
      );
      setItems(sortedItems);
    } catch (err: any) {
      setError(err?.message || "Failed to load recommendation history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [historyId]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) => {
      const title = (item.jobTitle || "").toLowerCase();
      const company = (item.companyName || "").toLowerCase();
      const location = (item.location || "").toLowerCase();
      return (
        title.includes(query) ||
        company.includes(query) ||
        location.includes(query)
      );
    });
  }, [items, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const visiblePages = useMemo(
    () => Array.from({ length: Math.min(totalPages, 7) }, (_, index) => index + 1),
    [totalPages],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="candidate-dashboard-container">
      <CandidateSidebar />
      <main className="candidate-smart-main">
        <CandidateTopBar
          showSearch
          searchPlaceholder="Search by job title, company, or location..."
          onSearch={setSearchQuery}
        />
        <div className="candidate-smart-content-wrapper">
        <section className="candidate-smart-shell">
          <header className="candidate-smart-header">
            <div className="candidate-smart-header-left">
              <h2>Recommendation History</h2>
              <p>Saved recommendation run results.</p>
            </div>
            <div className="candidate-smart-header-right">
              <button
                type="button"
                className="candidate-smart-run-btn"
                onClick={() => navigate("/candidate/job-alerts")}
              >
                Back
              </button>
            </div>
          </header>

          {loading && <div className="candidate-smart-state">Loading</div>}
          {!loading && error && (
            <div className="candidate-smart-state candidate-smart-error">{error}</div>
          )}
          {!loading && !error && items.length === 0 && (
            <div className="candidate-smart-state">No recommendations in this history run.</div>
          )}
          {!loading && !error && items.length > 0 && filteredItems.length === 0 && (
            <div className="candidate-smart-state">
              No jobs match your search.
            </div>
          )}

          {filteredItems.length > 0 && (
            <div className="candidate-smart-list">
              {paginatedItems.map((item) => (
                <article key={item.jobId} className="candidate-smart-card">
                  <div className="candidate-smart-card-top">
                    <div>
                      <h3 className="candidate-smart-history-job-title">{item.jobTitle}</h3>
                      <div className="candidate-smart-history-company-row">
                        <span className="candidate-smart-history-company-name">
                          {item.companyName || "Company"}
                        </span>
                      </div>
                      <p className="candidate-smart-history-job-location">{item.location}</p>
                    </div>
                    <div className="candidate-smart-score">
                      {item.skillMatchPercent ?? 0}%
                    </div>
                  </div>

                  <div className="candidate-smart-meta">
                    <span>{item.jobType || "-"}</span>
                    <span>{item.workMode || "-"}</span>
                    {(item.reasons || []).map((reason, idx) => (
                      <span key={`${item.jobId}-reason-${idx}`}>{reason}</span>
                    ))}
                  </div>

                  <div className="candidate-smart-bottom-row">
                    <div className="candidate-smart-skill-row">
                      <strong>Matched Skills:</strong>{" "}
                      {item.matchedSkills?.length
                        ? item.matchedSkills.join(", ")
                        : "No direct match"}
                    </div>
                    <div className="candidate-smart-actions candidate-smart-actions-right">
                      <button onClick={() => navigate(`/jobs/${item.jobId}`)}>View Details</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          {filteredItems.length > 0 && (
            <div className="candidate-smart-pagination">
              <div className="candidate-smart-page-controls">
                <button
                  className="candidate-smart-page-nav"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <img src={prevIcon} alt="Previous" />
                </button>
                <div className="candidate-smart-page-numbers">
                  {visiblePages.map((pageNumber) => (
                    <span
                      key={pageNumber}
                      className={`candidate-smart-page-num ${
                        pageNumber === currentPage ? "active" : ""
                      }`}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </span>
                  ))}
                </div>
                <button
                  className="candidate-smart-page-nav"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <img src={nextIcon} alt="Next" />
                </button>
              </div>
              <div className="candidate-smart-page-info">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                {(currentPage - 1) * ITEMS_PER_PAGE + paginatedItems.length} of{" "}
                {filteredItems.length}
              </div>
            </div>
          )}
        </section>
        <PortalFooter />
        </div>
      </main>
    </div>
  );
};

export default CandidateSmartJobsHistoryPage;




