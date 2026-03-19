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
import CandidateSidebar from "../../components/candidatecomponents/CandidateSidebar";
import CandidateTopBar from "../../components/candidatecomponents/CandidateTopBar";
import statsAppliedIcon from "../../images/Candidate Profile Page Images/Total-Applications.png";
import statsInterviewIcon from "../../images/Candidate Profile Page Images/stats-interview-icon.png";
import connections from "../../images/Candidate Profile Page Images/connections.png";
import savedjobs from "../../images/Candidate Profile Page Images/Saved-Jobs.png";
import "../../styles/CandidateDashboard.css";

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

type CandidateDashboardStats = {
  applications: {
    total: number;
    inRange: number;
    reviewed: number;
    shortlisted: number;
    interview: number;
    hired: number;
    rejected: number;
    responded: number;
    activePipeline: number;
    staleSubmitted: number;
    rates: {
      responseRate: number;
      interviewRate: number;
      hireRate: number;
    };
  };
  savedJobs: {
    total: number;
    inRange: number;
  };
  recommendations: {
    totalRuns: number;
    runsInRange: number;
    suggestedJobsInRange: number;
  };
  assessments: {
    submitted: number;
    inProgress: number;
    avgQuizScore: number;
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
    applications: number[];
    savedJobs: number[];
    adminAssessments: number[];
  };
  distributions: {
    applicationStatuses: { labels: string[]; values: number[] };
    workModes: { labels: string[]; values: number[] };
    jobTypes: { labels: string[]; values: number[] };
  };
  topAppliedJobs: Array<{ jobId: string; title: string; applicants: number }>;
};

type RecentApplication = {
  id: string;
  jobTitle: string;
  location: string;
  companyName: string;
  status: string;
  appliedAt: string;
};

const emptyStats: CandidateDashboardStats = {
  applications: {
    total: 0,
    inRange: 0,
    reviewed: 0,
    shortlisted: 0,
    interview: 0,
    hired: 0,
    rejected: 0,
    responded: 0,
    activePipeline: 0,
    staleSubmitted: 0,
    rates: {
      responseRate: 0,
      interviewRate: 0,
      hireRate: 0,
    },
  },
  savedJobs: { total: 0, inRange: 0 },
  recommendations: { totalRuns: 0, runsInRange: 0, suggestedJobsInRange: 0 },
  assessments: { submitted: 0, inProgress: 0, avgQuizScore: 0 },
  messaging: { totalReceived: 0, unreadReceived: 0 },
  connections: { pending: 0, accepted: 0 },
  trends: { labels: [], applications: [], savedJobs: [], adminAssessments: [] },
  distributions: {
    applicationStatuses: { labels: [], values: [] },
    workModes: { labels: [], values: [] },
    jobTypes: { labels: [], values: [] },
  },
  topAppliedJobs: [],
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

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<CandidateDashboardStats>(emptyStats);
  const [recentApplications, setRecentApplications] = useState<
    RecentApplication[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState(daysAgoInputValue(29));
  const [toDate, setToDate] = useState(todayInputValue());
  const [trendVisibility, setTrendVisibility] = useState({
    applications: true,
    savedJobs: true,
    adminAssessments: true,
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
        `${import.meta.env.VITE_API_BASE_URL}/users/candidate/dashboard-stats?${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to load candidate dashboard");
      }
      setStats(data.stats || emptyStats);
      setRecentApplications(data.recentApplications || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load candidate dashboard");
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
        key: "applications" as const,
        label: "Applications",
        data: stats.trends.applications,
        borderColor: "#1459b8",
        backgroundColor: "rgba(20, 89, 184, 0.13)",
      },
      {
        key: "savedJobs" as const,
        label: "Saved Jobs",
        data: stats.trends.savedJobs,
        borderColor: "#14b8a6",
        backgroundColor: "rgba(20, 184, 166, 0.13)",
      },
      {
        key: "adminAssessments" as const,
        label: "Admin Quiz/Assessment Done",
        data: stats.trends.adminAssessments,
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.12)",
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
      plugins: { legend: { display: false } },
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

  const pipelineData = useMemo(
    () => ({
      labels: [
        "Submitted",
        "Reviewed",
        "Shortlisted",
        "Interview",
        "Hired",
        "Rejected",
      ],
      datasets: [
        {
          label: "Applications",
          data: [
            stats.distributions.applicationStatuses.values[
              stats.distributions.applicationStatuses.labels.findIndex(
                (label) => String(label).toLowerCase() === "submitted",
              )
            ] || 0,
            stats.applications.reviewed || 0,
            stats.applications.shortlisted || 0,
            stats.applications.interview || 0,
            stats.applications.hired || 0,
            stats.applications.rejected || 0,
          ],
          backgroundColor: [
            "#3b82f6",
            "#8b5cf6",
            "#14b8a6",
            "#f59e0b",
            "#22c55e",
            "#ef4444",
          ],
          borderRadius: 8,
          maxBarThickness: 24,
        },
      ],
    }),
    [stats.applications, stats.distributions.applicationStatuses],
  );

  const pipelineOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: 2,
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: "rgba(131, 151, 177, 0.20)" },
          ticks: {
            color: "#6a829d",
            precision: 0,
            font: { size: 11, weight: 600 },
          },
        },
        y: {
          grid: { display: false },
          ticks: {
            color: "#6a829d",
            font: { size: 11, weight: 600 },
          },
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

  const jobTypeData = useMemo(
    () => ({
      labels: stats.distributions.jobTypes.labels,
      datasets: [
        {
          data: stats.distributions.jobTypes.values,
          backgroundColor: [
            "#1459b8",
            "#3b82f6",
            "#14b8a6",
            "#f59e0b",
            "#8b5cf6",
          ],
          borderWidth: 0,
        },
      ],
    }),
    [stats.distributions.jobTypes],
  );

  const formatPercent = (value: number, total: number) => {
    if (!total) return "0.0%";
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  const buildLegend = (
    labels: string[],
    values: number[],
    colors: string[],
  ) => {
    const total = values.reduce((sum, value) => sum + value, 0);
    return labels.map((label, idx) => ({
      label,
      percent: formatPercent(values[idx] || 0, total),
      color: colors[idx % colors.length],
    }));
  };

  const applicationLegend = useMemo(
    () =>
      buildLegend(
        stats.distributions.applicationStatuses.labels,
        stats.distributions.applicationStatuses.values,
        applicationStatusColors.length > 0
          ? applicationStatusColors
          : chartPalette,
      ),
    [stats.distributions.applicationStatuses, applicationStatusColors],
  );

  const workModeLegend = useMemo(
    () =>
      buildLegend(
        stats.distributions.workModes.labels,
        stats.distributions.workModes.values,
        ["#1459b8", "#14b8a6", "#f59e0b", "#8b5cf6"],
      ),
    [stats.distributions.workModes],
  );

  const jobTypeLegend = useMemo(
    () =>
      buildLegend(
        stats.distributions.jobTypes.labels,
        stats.distributions.jobTypes.values,
        ["#1459b8", "#3b82f6", "#14b8a6", "#f59e0b", "#8b5cf6"],
      ),
    [stats.distributions.jobTypes],
  );

  const toggleTrendSeries = (
    key: "applications" | "savedJobs" | "adminAssessments",
  ) => {
    setTrendVisibility((prev) => {
      const next = !prev[key];
      const activeCount = Object.values(prev).filter(Boolean).length;
      if (!next && activeCount === 1) return prev;
      return { ...prev, [key]: next };
    });
  };

  return (
    <div className="candidate-dashboard-container">
      <CandidateSidebar />
      <main className="candidate-insight-main">
        <CandidateTopBar />
        <div className="candidate-insight-content-wrapper">
          <div className="candidate-insight-header-row">
            <div className="candidate-insight-header-copy">
              <h1>Candidate Dashboard</h1>
              <p>
                Application progress, profile activity, and career insights.
              </p>
            </div>
            <div className="candidate-insight-inline-filters">
              <div className="candidate-insight-date-field">
                <label>From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="candidate-insight-date-field">
                <label>To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <button
                className="candidate-insight-apply-filter"
                onClick={() => fetchStats(fromDate, toDate)}
              >
                Apply Range
              </button>
            </div>
          </div>

          <div className="candidate-insight-stats-grid">
            <article className="candidate-insight-stat-card">
              <div className="candidate-insight-stat-content">
                <h3>Total Applications</h3>
                <p>{stats.applications.total}</p>
                <small>{stats.applications.inRange} in selected range</small>
              </div>
              <img
                src={statsAppliedIcon}
                alt="Applications"
                className="candidate-insight-stat-icon"
              />
            </article>
            <article className="candidate-insight-stat-card">
              <div className="candidate-insight-stat-content">
                <h3>Active Pipeline</h3>
                <p>{stats.applications.activePipeline}</p>
                <small>Submitted, reviewed, shortlisted, interview</small>
              </div>
              <img
                src={statsInterviewIcon}
                alt="Shortlisted"
                className="candidate-insight-stat-icon"
              />
            </article>
            <article className="candidate-insight-stat-card">
              <div className="candidate-insight-stat-content">
                <h3>Saved Jobs</h3>
                <p>{stats.savedJobs.total}</p>
                <small>{stats.savedJobs.inRange} saved in selected range</small>
              </div>
              <img
                src={savedjobs}
                alt="Saved jobs"
                className="candidate-insight-stat-icon"
              />
            </article>
            <article className="candidate-insight-stat-card">
              <div className="candidate-insight-stat-content">
                <h3>Connections</h3>
                <p>{stats.connections.accepted}</p>
                <small>{stats.connections.pending} pending requests</small>
              </div>
              <img
                src={connections}
                alt="Connections"
                className="candidate-insight-stat-icon"
              />
            </article>
          </div>

          <section className="candidate-insight-panel candidate-insight-chart-panel">
            <h2>Activity Trend</h2>
            <div className="candidate-insight-trend-controls">
              {trendSeries.map((item) => (
                <label
                  key={item.key}
                  className={`candidate-insight-trend-control ${trendVisibility[item.key] ? "active" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={trendVisibility[item.key]}
                    onChange={() => toggleTrendSeries(item.key)}
                  />
                  <span
                    className="candidate-insight-trend-dot"
                    style={{ backgroundColor: item.borderColor }}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
            <div className="candidate-insight-chart-wrap candidate-insight-trend-chart-wrap">
              <Line data={trendData} options={trendOptions} />
            </div>
          </section>

          <div className="candidate-insight-chart-grid">
            <section className="candidate-insight-panel candidate-insight-chart-panel">
              <h2>Application Pipeline</h2>
              {stats.applications.inRange > 0 ? (
                <div className="candidate-insight-chart-wrap">
                  <Bar data={pipelineData} options={pipelineOptions} />
                </div>
              ) : (
                <div className="candidate-insight-empty-chart">
                  No applications in selected date range.
                </div>
              )}
            </section>

            <section className="candidate-insight-panel candidate-insight-chart-panel candidate-insight-donut-panel">
              <h2>Application Status Split</h2>
              <div className="candidate-insight-donut-layout">
                <div className="candidate-insight-donut-chart-wrap">
                  <Doughnut
                    data={applicationStatusData}
                    options={donutOptions}
                  />
                </div>
                <div className="candidate-insight-donut-legend">
                  {applicationLegend.map((item) => (
                    <div
                      key={`status-${item.label}`}
                      className="candidate-insight-donut-legend-item"
                    >
                      <span className="candidate-insight-donut-legend-left">
                        <span
                          className="candidate-insight-donut-legend-dot"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="candidate-insight-donut-legend-label">
                          {item.label}
                        </span>
                      </span>
                      <span className="candidate-insight-donut-legend-value">
                        {item.percent}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="candidate-insight-chart-grid">
            <section className="candidate-insight-panel candidate-insight-chart-panel candidate-insight-donut-panel">
              <h2>Work Mode Split</h2>
              <div className="candidate-insight-donut-layout">
                <div className="candidate-insight-donut-chart-wrap">
                  <Doughnut data={workModeData} options={donutOptions} />
                </div>
                <div className="candidate-insight-donut-legend">
                  {workModeLegend.map((item) => (
                    <div
                      key={`work-${item.label}`}
                      className="candidate-insight-donut-legend-item"
                    >
                      <span className="candidate-insight-donut-legend-left">
                        <span
                          className="candidate-insight-donut-legend-dot"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="candidate-insight-donut-legend-label">
                          {item.label}
                        </span>
                      </span>
                      <span className="candidate-insight-donut-legend-value">
                        {item.percent}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section className="candidate-insight-panel candidate-insight-chart-panel candidate-insight-donut-panel">
              <h2>Job Type Split</h2>
              <div className="candidate-insight-donut-layout">
                <div className="candidate-insight-donut-chart-wrap">
                  <Doughnut data={jobTypeData} options={donutOptions} />
                </div>
                <div className="candidate-insight-donut-legend">
                  {jobTypeLegend.map((item) => (
                    <div
                      key={`type-${item.label}`}
                      className="candidate-insight-donut-legend-item"
                    >
                      <span className="candidate-insight-donut-legend-left">
                        <span
                          className="candidate-insight-donut-legend-dot"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="candidate-insight-donut-legend-label">
                          {item.label}
                        </span>
                      </span>
                      <span className="candidate-insight-donut-legend-value">
                        {item.percent}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <section className="candidate-insight-panel">
            <h2>Recent Applications</h2>
            <div className="candidate-insight-list">
              {recentApplications.map((item) => (
                <article key={item.id} className="candidate-insight-list-item">
                  <div>
                    <h4>{item.jobTitle}</h4>
                    <p>{item.companyName}</p>
                  </div>
                  <div>
                    <h4>{item.location}</h4>
                    <p>{item.status}</p>
                  </div>
                  <div className="candidate-insight-list-meta">
                    <small>{formatDate(item.appliedAt)}</small>
                  </div>
                </article>
              ))}
              {!loading && recentApplications.length === 0 && (
                <div className="candidate-insight-state">
                  No recent applications.
                </div>
              )}
            </div>
          </section>

          {loading && (
            <div className="candidate-insight-state">Loading dashboard...</div>
          )}
          {!loading && error && (
            <div className="candidate-insight-state error">{error}</div>
          )}
        </div>
        <PortalFooter />
      </main>
    </div>
  );
};

export default CandidateDashboard;


