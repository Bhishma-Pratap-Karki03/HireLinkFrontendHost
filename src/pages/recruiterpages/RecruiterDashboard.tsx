import PortalFooter from "../../components/PortalFooter";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  BarElement,
  Legend,
  LinearScale,
  Title,
  LineElement,
  PointElement,
  Tooltip,
  ArcElement,
} from "chart.js";
import type { ChartOptions } from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import RecruiterSidebar from "../../components/recruitercomponents/RecruiterSidebar";
import RecruiterTopBar from "../../components/recruitercomponents/RecruiterTopBar";
import statsTotalJobsIcon from "../../images/Candidate Profile Page Images/stats-applied-icon.svg";
import statsApplicationsIcon from "../../images/Candidate Profile Page Images/statsCandidatesIcon.png";
import shortlistedIcon from "../../images/Candidate Profile Page Images/shortlisted-icon.png";  
import pendingIcon from "../../images/Employers Page Images/pending-icon.png";
import unreadMessagesIcon from "../../images/Candidate Profile Page Images/unread-message-icon.png";
import statsInterviewIcon from "../../images/Candidate Profile Page Images/stats-interview-icon.png";
import rejectedIcon from "../../images/Candidate Profile Page Images/rejected-icon.png";
import assessmentAttemptsIcon from "../../images/Candidate Profile Page Images/assessment-attempts-icon.png";
import "../../styles/RecruiterDashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

type DashboardStats = {
  jobs: {
    total: number;
    active: number;
    inactive: number;
    inRange: number;
  };
  applications: {
    total: number;
    reviewed: number;
    shortlisted: number;
    interview: number;
    hired: number;
    rejected: number;
  };
  ats: { reports: number };
  assessments: {
    total: number;
    active: number;
    inactive: number;
    attempts: number;
    distributions: {
      types: { labels: string[]; values: number[] };
    };
    topAssessmentsByAttempts: Array<{ title: string; attempts: number }>;
  };
  messaging: {
    totalReceived: number;
    unreadReceived: number;
  };
  connections: {
    pending: number;
    accepted: number;
  };
  trends: {
    labels: string[];
    jobsPosted: number[];
    applicationsReceived: number[];
    hires: number[];
  };
  distributions: {
    jobTypes: { labels: string[]; values: number[] };
    workModes: { labels: string[]; values: number[] };
    applicationStatuses: { labels: string[]; values: number[] };
  };
  topJobs: Array<{ jobId: string; title: string; applicants: number }>;
};

type RecentApplication = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePicture?: string;
  jobTitle: string;
  status: string;
  appliedAt: string;
};

const emptyStats: DashboardStats = {
  jobs: { total: 0, active: 0, inactive: 0, inRange: 0 },
  applications: {
    total: 0,
    reviewed: 0,
    shortlisted: 0,
    interview: 0,
    hired: 0,
    rejected: 0,
  },
  ats: { reports: 0 },
  assessments: {
    total: 0,
    active: 0,
    inactive: 0,
    attempts: 0,
    distributions: {
      types: { labels: [], values: [] },
    },
    topAssessmentsByAttempts: [],
  },
  messaging: { totalReceived: 0, unreadReceived: 0 },
  connections: { pending: 0, accepted: 0 },
  trends: {
    labels: [],
    jobsPosted: [],
    applicationsReceived: [],
    hires: [],
  },
  distributions: {
    jobTypes: { labels: [], values: [] },
    workModes: { labels: [], values: [] },
    applicationStatuses: { labels: [], values: [] },
  },
  topJobs: [],
};

const todayInputValue = () => new Date().toISOString().slice(0, 10);
const daysAgoInputValue = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

const statusColorMap: Record<string, string> = {
  submitted: "#3b82f6",
  reviewed: "#8b5cf6",
  shortlisted: "#14b8a6",
  interview: "#f59e0b",
  hired: "#22c55e",
  rejected: "#ef4444",
};

const chartPalette = ["#1459b8", "#3b82f6", "#14b8a6", "#f59e0b", "#8b5cf6"];

const formatDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString();
};

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState(daysAgoInputValue(29));
  const [toDate, setToDate] = useState(todayInputValue());
  const [trendVisibility, setTrendVisibility] = useState({
    jobsPosted: true,
    applicationsReceived: true,
    hires: true,
  });

  const fetchStats = async (from: string, to: string) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const query = new URLSearchParams({ from, to }).toString();
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/recruiter/dashboard-stats?${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to load recruiter dashboard");
      }
      setStats(data.stats || emptyStats);
      setRecentApplications(data.recentApplications || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load recruiter dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(fromDate, toDate);
  }, [navigate]);

  const trendSeries = useMemo(
    () => [
      {
        key: "jobsPosted" as const,
        label: "Jobs Posted",
        data: stats.trends.jobsPosted,
        borderColor: "#1459b8",
        backgroundColor: "rgba(20, 89, 184, 0.13)",
      },
      {
        key: "applicationsReceived" as const,
        label: "Applications Received",
        data: stats.trends.applicationsReceived,
        borderColor: "#14b8a6",
        backgroundColor: "rgba(20, 184, 166, 0.13)",
      },
      {
        key: "hires" as const,
        label: "Hires",
        data: stats.trends.hires,
        borderColor: "#22c55e",
        backgroundColor: "rgba(34, 197, 94, 0.12)",
      },
    ],
    [stats.trends],
  );

  const trendData = useMemo(
    () => ({
      labels: stats.trends.labels,
      datasets: trendSeries
        .filter((item) => trendVisibility[item.key])
        .map((item) => ({
          label: item.label,
          data: item.data,
          borderColor: item.borderColor,
          backgroundColor: item.backgroundColor,
          fill: true,
          tension: 0.32,
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 4,
        })),
    }),
    [stats.trends.labels, trendSeries, trendVisibility],
  );

  const trendOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: 2,
      interaction: { mode: "index" as const, intersect: false },
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: "#6a829d",
            maxTicksLimit: 10,
            maxRotation: 0,
            font: { size: 12, weight: 600 },
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(131, 151, 177, 0.20)" },
          ticks: {
            color: "#6a829d",
            precision: 0,
            font: { size: 12, weight: 600 },
          },
        },
      },
    }),
    [],
  );

  const topJobsData = useMemo(
    () => ({
      labels: stats.topJobs.map((item) => item.title),
      datasets: [
        {
          label: "Applicants",
          data: stats.topJobs.map((item) => item.applicants),
          backgroundColor: "#1459b8",
          borderRadius: 10,
          maxBarThickness: 42,
        },
      ],
    }),
    [stats.topJobs],
  );

  const topJobsOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: 2,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: "#6a829d",
            maxRotation: 0,
            autoSkip: false,
            font: { size: 11, weight: 600 },
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(131, 151, 177, 0.20)" },
          ticks: { color: "#6a829d", precision: 0, font: { size: 11, weight: 600 } },
        },
      },
    }),
    [],
  );

  const donutOptions = useMemo<ChartOptions<"doughnut">>(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      devicePixelRatio: 2,
      cutout: "60%",
      plugins: { legend: { display: false } },
    }),
    [],
  );

  const applicationStatusColors = useMemo(
    () =>
      stats.distributions.applicationStatuses.labels.map(
        (label, idx) =>
          statusColorMap[String(label || "").toLowerCase()] ||
          chartPalette[idx % chartPalette.length],
      ),
    [stats.distributions.applicationStatuses.labels],
  );

  const applicationStatusData = useMemo(
    () => ({
      labels: stats.distributions.applicationStatuses.labels,
      datasets: [
        {
          data: stats.distributions.applicationStatuses.values,
          backgroundColor: applicationStatusColors,
          borderWidth: 0,
        },
      ],
    }),
    [stats.distributions.applicationStatuses, applicationStatusColors],
  );

  const workModeData = useMemo(
    () => ({
      labels: stats.distributions.workModes.labels,
      datasets: [
        {
          data: stats.distributions.workModes.values,
          backgroundColor: ["#1459b8", "#14b8a6", "#f59e0b", "#8b5cf6"],
          borderWidth: 0,
        },
      ],
    }),
    [stats.distributions.workModes],
  );

  const assessmentTypeData = useMemo(
    () => ({
      labels: stats.assessments.distributions.types.labels,
      datasets: [
        {
          data: stats.assessments.distributions.types.values,
          backgroundColor: ["#1459b8", "#14b8a6", "#f59e0b", "#8b5cf6"],
          borderWidth: 0,
        },
      ],
    }),
    [stats.assessments.distributions.types],
  );

  const formatPercent = (value: number, total: number) => {
    if (!total) return "0.0%";
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  const applicationLegend = useMemo(() => {
    const labels = stats.distributions.applicationStatuses.labels;
    const values = stats.distributions.applicationStatuses.values;
    const total = values.reduce((sum, value) => sum + value, 0);
    return labels.map((label, idx) => ({
      label,
      value: values[idx] || 0,
      percent: formatPercent(values[idx] || 0, total),
      color: applicationStatusColors[idx] || chartPalette[idx % chartPalette.length],
    }));
  }, [stats.distributions.applicationStatuses, applicationStatusColors]);

  const workModeLegend = useMemo(() => {
    const labels = stats.distributions.workModes.labels;
    const values = stats.distributions.workModes.values;
    const total = values.reduce((sum, value) => sum + value, 0);
    const colors = ["#1459b8", "#14b8a6", "#f59e0b", "#8b5cf6"];
    return labels.map((label, idx) => ({
      label,
      percent: formatPercent(values[idx] || 0, total),
      color: colors[idx % colors.length],
    }));
  }, [stats.distributions.workModes]);

  const toggleTrendSeries = (key: "jobsPosted" | "applicationsReceived" | "hires") => {
    setTrendVisibility((prev) => {
      const next = !prev[key];
      const activeCount = Object.values(prev).filter(Boolean).length;
      if (!next && activeCount === 1) return prev;
      return { ...prev, [key]: next };
    });
  };

  return (
    <div className="recruiter-dashboard-page-container">
      <div className="recruiter-dashboard-layout">
        <RecruiterSidebar />
        <div className="recruiter-dashboard-main-area">
          <div className="recruiter-dashboard-topbar-wrapper">
            <RecruiterTopBar onPostJob={() => navigate("/recruiter/post-job")} />
          </div>
          <div className="recruiter-dashboard-scrollable-content">
            <div className="recruiter-dashboard-content-wrapper">
              <div className="recruiter-dashboard-header-row">
                <div className="recruiter-dashboard-header-copy">
                  <h1>Recruiter Dashboard</h1>
                  <p>Hiring insights and pipeline performance overview.</p>
                </div>
                <div className="recruiter-dashboard-inline-filters">
                  <div className="recruiter-dashboard-date-field">
                    <label>From</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div className="recruiter-dashboard-date-field">
                    <label>To</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                  <button
                    className="recruiter-dashboard-apply-filter"
                    onClick={() => fetchStats(fromDate, toDate)}
                  >
                    Apply Range
                  </button>
                </div>
              </div>

              <div className="recruiter-dashboard-stats-grid">
                <article className="recruiter-dashboard-stat-card">
                  <div className="recruiter-dashboard-stat-content">
                    <h3>Total Jobs</h3>
                    <p>{stats.jobs.total}</p>
                    <small>{stats.jobs.active} active / {stats.jobs.inactive} inactive</small>
                  </div>
                  <img src={statsTotalJobsIcon} alt="Total jobs" className="recruiter-dashboard-stat-icon" />
                </article>
                <article className="recruiter-dashboard-stat-card">
                  <div className="recruiter-dashboard-stat-content">
                    <h3>Applications in Range</h3>
                    <p>{stats.applications.total}</p>
                    <small>
                      {stats.applications.shortlisted} shortlisted / {stats.applications.hired} hired
                    </small>
                  </div>
                  <img src={statsApplicationsIcon} alt="Applications" className="recruiter-dashboard-stat-icon" />
                </article>
                <article className="recruiter-dashboard-stat-card">
                  <div className="recruiter-dashboard-stat-content">
                    <h3>Interviews in Range</h3>
                    <p>{stats.applications.interview}</p>
                    <small>{stats.applications.hired} hired from this pipeline</small>
                  </div>
                  <img src={statsInterviewIcon} alt="Interviews in range" className="recruiter-dashboard-stat-icon" />
                </article>
                <article className="recruiter-dashboard-stat-card">
                  <div className="recruiter-dashboard-stat-content">
                    <h3>Unread Messages</h3>
                    <p>{stats.messaging.unreadReceived}</p>
                    <small>{stats.messaging.totalReceived} total received</small>
                  </div>
                  <img src={unreadMessagesIcon} alt="Unread messages" className="recruiter-dashboard-stat-icon" />
                </article>
                <article className="recruiter-dashboard-stat-card">
                  <div className="recruiter-dashboard-stat-content">
                    <h3>Shortlisted Candidates</h3>
                    <p>{stats.applications.shortlisted}</p>
                    <small>Ready for interview stage</small>
                  </div>
                  <img src={shortlistedIcon} alt="Shortlisted candidates" className="recruiter-dashboard-stat-icon" />
                </article>
                <article className="recruiter-dashboard-stat-card">
                  <div className="recruiter-dashboard-stat-content">
                    <h3>Rejected Applications</h3>
                    <p>{stats.applications.rejected}</p>
                    <small>Applications marked rejected in selected range</small>
                  </div>
                  <img src={rejectedIcon} alt="Rejected applications" className="recruiter-dashboard-stat-icon" />
                </article>
                <article className="recruiter-dashboard-stat-card">
                  <div className="recruiter-dashboard-stat-content">
                    <h3>Assessment Attempts</h3>
                    <p>{stats.assessments.attempts}</p>
                    <small>{stats.assessments.total} assessments created</small>
                  </div>
                  <img src={assessmentAttemptsIcon} alt="Assessment attempts" className="recruiter-dashboard-stat-icon" />
                </article>
                <article className="recruiter-dashboard-stat-card">
                  <div className="recruiter-dashboard-stat-content">
                    <h3>Pending Connections</h3>
                    <p>{stats.connections.pending}</p>
                    <small>{stats.connections.accepted} accepted connections</small>
                  </div>
                  <img src={pendingIcon} alt="Pending connections" className="recruiter-dashboard-stat-icon" />
                </article>
              </div>

              <div className="recruiter-dashboard-chart-stack">
                <section className="recruiter-dashboard-panel recruiter-dashboard-chart-panel">
                  <h2>Hiring Activity Trend</h2>
                  <div className="recruiter-dashboard-trend-controls">
                    {trendSeries.map((item) => (
                      <label
                        key={item.key}
                        className={`recruiter-dashboard-trend-control ${
                          trendVisibility[item.key] ? "active" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={trendVisibility[item.key]}
                          onChange={() => toggleTrendSeries(item.key)}
                        />
                        <span
                          className="recruiter-dashboard-trend-dot"
                          style={{ backgroundColor: item.borderColor }}
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="recruiter-dashboard-chart-wrap recruiter-dashboard-trend-chart-wrap">
                    <Line data={trendData} options={trendOptions} />
                  </div>
                </section>
              </div>

              <div className="recruiter-dashboard-chart-grid">
                <section className="recruiter-dashboard-panel recruiter-dashboard-chart-panel">
                  <h2>Top Jobs by Applicants</h2>
                  {stats.topJobs.length > 0 ? (
                    <div className="recruiter-dashboard-chart-wrap recruiter-dashboard-top-jobs-wrap">
                      <Bar data={topJobsData} options={topJobsOptions} />
                    </div>
                  ) : (
                    <div className="recruiter-dashboard-empty-chart">
                      No applicant data in selected date range.
                    </div>
                  )}
                </section>

                <section className="recruiter-dashboard-panel recruiter-dashboard-chart-panel recruiter-dashboard-donut-panel">
                  <h2>Assessment Type Split</h2>
                  {stats.assessments.distributions.types.labels.length > 0 ? (
                    <div className="recruiter-dashboard-donut-layout">
                      <div className="recruiter-dashboard-donut-chart-wrap">
                        <Doughnut data={assessmentTypeData} options={donutOptions} />
                      </div>
                      <div className="recruiter-dashboard-donut-legend">
                        {stats.assessments.distributions.types.labels.map((label, idx) => {
                          const colors = ["#1459b8", "#14b8a6", "#f59e0b", "#8b5cf6"];
                          const values = stats.assessments.distributions.types.values;
                          const total = values.reduce((sum, value) => sum + value, 0);
                          return (
                            <div
                              key={`assessment-type-${label}`}
                              className="recruiter-dashboard-donut-legend-item"
                            >
                              <span className="recruiter-dashboard-donut-legend-left">
                                <span
                                  className="recruiter-dashboard-donut-legend-dot"
                                  style={{ backgroundColor: colors[idx % colors.length] }}
                                />
                                <span className="recruiter-dashboard-donut-legend-label">
                                  {label}
                                </span>
                              </span>
                              <span className="recruiter-dashboard-donut-legend-value">
                                {formatPercent(values[idx] || 0, total)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="recruiter-dashboard-empty-chart">
                      No assessment data in selected date range.
                    </div>
                  )}
                </section>
              </div>

              <div className="recruiter-dashboard-chart-grid">
                <section className="recruiter-dashboard-panel recruiter-dashboard-chart-panel recruiter-dashboard-donut-panel">
                  <h2>Application Status Split</h2>
                  <div className="recruiter-dashboard-donut-layout">
                    <div className="recruiter-dashboard-donut-chart-wrap">
                      <Doughnut data={applicationStatusData} options={donutOptions} />
                    </div>
                    <div className="recruiter-dashboard-donut-legend">
                      {applicationLegend.map((item) => (
                        <div key={`status-${item.label}`} className="recruiter-dashboard-donut-legend-item">
                          <span className="recruiter-dashboard-donut-legend-left">
                            <span
                              className="recruiter-dashboard-donut-legend-dot"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="recruiter-dashboard-donut-legend-label">
                              {item.label}
                            </span>
                          </span>
                          <span className="recruiter-dashboard-donut-legend-value">{item.percent}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
                <section className="recruiter-dashboard-panel recruiter-dashboard-chart-panel recruiter-dashboard-donut-panel">
                  <h2>Work Mode Split</h2>
                  <div className="recruiter-dashboard-donut-layout">
                    <div className="recruiter-dashboard-donut-chart-wrap">
                      <Doughnut data={workModeData} options={donutOptions} />
                    </div>
                    <div className="recruiter-dashboard-donut-legend">
                      {workModeLegend.map((item) => (
                        <div key={`work-${item.label}`} className="recruiter-dashboard-donut-legend-item">
                          <span className="recruiter-dashboard-donut-legend-left">
                            <span
                              className="recruiter-dashboard-donut-legend-dot"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="recruiter-dashboard-donut-legend-label">
                              {item.label}
                            </span>
                          </span>
                          <span className="recruiter-dashboard-donut-legend-value">{item.percent}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>

              <section className="recruiter-dashboard-panel">
                <h2>Recent Applications</h2>
                <div className="recruiter-dashboard-list">
                  {recentApplications.map((item) => (
                    <article key={item.id} className="recruiter-dashboard-list-item">
                      <div>
                        <h4>{item.candidateName}</h4>
                        <p>{item.candidateEmail}</p>
                      </div>
                      <div>
                        <h4>{item.jobTitle}</h4>
                        <p>{item.status}</p>
                      </div>
                      <div className="recruiter-dashboard-list-meta">
                        <small>{formatDate(item.appliedAt)}</small>
                      </div>
                    </article>
                  ))}
                  {!loading && recentApplications.length === 0 && (
                    <div className="recruiter-dashboard-state">No recent applications.</div>
                  )}
                </div>
              </section>

              {loading && <div className="recruiter-dashboard-state">Loading</div>}
              {!loading && error && <div className="recruiter-dashboard-state error">{error}</div>}
            </div>
          </div>
          <PortalFooter />
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;


