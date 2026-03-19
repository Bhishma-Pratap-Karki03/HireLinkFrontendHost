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
import { Doughnut, Line } from "react-chartjs-2";
import AdminSidebar from "../../components/admincomponents/AdminSidebar";
import AdminTopBar from "../../components/admincomponents/AdminTopBar";
import statsTotalUsersIcon from "../../images/Candidate Profile Page Images/statsTotalUsersIcon.png";
import statsTotalJobsIcon from "../../images/Candidate Profile Page Images/stats-applied-icon.svg";
import statsApplicationsIcon from "../../images/Candidate Profile Page Images/statsCandidatesIcon.png";
import adminAssessmentIcon from "../../images/Candidate Profile Page Images/adminAssessmentIcon.png";
import statsBlockedUsersIcon from "../../images/Candidate Profile Page Images/stats-reject.svg";
import assessmentAttemptsIcon from "../../images/Candidate Profile Page Images/assessment-attempts-icon.png";
import defaultAvatar from "../../images/Register Page Images/Default Profile.webp";
import "../../styles/AdminDashboard.css";

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
  users: {
    total: number;
    candidates: number;
    recruiters: number;
    active: number;
    blocked: number;
  };
  jobs: {
    total: number;
    active: number;
    inactive: number;
  };
  applications: {
    total: number;
    submitted: number;
    interview: number;
    hired: number;
    rejected: number;
  };
  assessments: {
    total: number;
    adminCreated: number;
    recruiterCreated: number;
    adminInsights?: {
      active: number;
      inactive: number;
      totalAttempts: number;
      avgQuizScore: number;
      distributions: {
        types: { labels: string[]; values: number[] };
        difficulty: { labels: string[]; values: number[] };
        attempts: { labels: string[]; values: number[] };
      };
      topAssessmentsByAttempts: Array<{ title: string; attempts: number }>;
    };
  };
  ats: {
    reports: number;
  };
  messaging: {
    totalMessages: number;
    unreadMessages: number;
  };
  connections: {
    pending: number;
    accepted: number;
  };
  trends: {
    labels: string[];
    usersCreated: number[];
    jobsPosted: number[];
    applications: number[];
  };
  distributions: {
    jobTypes: { labels: string[]; values: number[] };
    workModes: { labels: string[]; values: number[] };
    applicationStatuses: { labels: string[]; values: number[] };
    userRoles: { labels: string[]; values: number[] };
  };
  topCompanies: Array<{ name: string; jobs: number; logo?: string }>;
};

type RecentUser = {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  profilePicture?: string;
  isBlocked: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
};

type RecentJob = {
  _id: string;
  jobTitle: string;
  location: string;
  isActive: boolean;
  createdAt: string;
};

const todayInputValue = () => new Date().toISOString().slice(0, 10);
const daysAgoInputValue = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

const emptyStats: DashboardStats = {
  users: { total: 0, candidates: 0, recruiters: 0, active: 0, blocked: 0 },
  jobs: { total: 0, active: 0, inactive: 0 },
  applications: { total: 0, submitted: 0, interview: 0, hired: 0, rejected: 0 },
  assessments: {
    total: 0,
    adminCreated: 0,
    recruiterCreated: 0,
    adminInsights: {
      active: 0,
      inactive: 0,
      totalAttempts: 0,
      avgQuizScore: 0,
      distributions: {
        types: { labels: [], values: [] },
        difficulty: { labels: [], values: [] },
        attempts: { labels: [], values: [] },
      },
      topAssessmentsByAttempts: [],
    },
  },
  ats: { reports: 0 },
  messaging: { totalMessages: 0, unreadMessages: 0 },
  connections: { pending: 0, accepted: 0 },
  trends: { labels: [], usersCreated: [], jobsPosted: [], applications: [] },
  distributions: {
    jobTypes: { labels: [], values: [] },
    workModes: { labels: [], values: [] },
    applicationStatuses: { labels: [], values: [] },
    userRoles: { labels: [], values: [] },
  },
  topCompanies: [],
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

const resolveImage = (value?: string) => {
  if (!value) return defaultAvatar;
  if (value.startsWith("http")) return value;
  return `http://localhost:5000${value}`;
};

const chartColors = [
  "#1459b8",
  "#3b82f6",
  "#14b8a6",
  "#22c55e",
  "#f59e0b",
  "#f97316",
  "#eab308",
  "#ef4444",
];

const statusColorMap: Record<string, string> = {
  submitted: "#3b82f6",
  shortlisted: "#14b8a6",
  reviewed: "#8b5cf6",
  interview: "#f59e0b",
  hired: "#22c55e",
  accepted: "#22c55e",
  rejected: "#ef4444",
  withdrawn: "#64748b",
};

const roleSplitColors = ["#1459b8", "#14b8a6"];

const percentageLabel = (value: number, total: number) => {
  if (!total) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState(daysAgoInputValue(29));
  const [toDate, setToDate] = useState(todayInputValue());
  const [trendVisibility, setTrendVisibility] = useState({
    usersCreated: true,
    jobsPosted: true,
    applications: true,
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
        `http://localhost:5000/api/users/admin/dashboard-stats?${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to load dashboard stats");
      }
      setStats(data.stats || emptyStats);
      setRecentUsers(data.recentUsers || []);
      setRecentJobs(data.recentJobs || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(fromDate, toDate);
  }, [navigate]);

  const trendDatasetConfig = useMemo(
    () => [
      {
        key: "usersCreated" as const,
        label: "Users Created",
        data: stats.trends.usersCreated,
        borderColor: "#1459b8",
        backgroundColor: "rgba(20, 89, 184, 0.14)",
      },
      {
        key: "jobsPosted" as const,
        label: "Jobs Posted",
        data: stats.trends.jobsPosted,
        borderColor: "#14b8a6",
        backgroundColor: "rgba(20, 184, 166, 0.12)",
      },
      {
        key: "applications" as const,
        label: "Applications",
        data: stats.trends.applications,
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.14)",
      },
    ],
    [stats.trends],
  );

  const trendChartData = useMemo(
    () => ({
      labels: stats.trends.labels,
      datasets: trendDatasetConfig
        .filter((item) => trendVisibility[item.key])
        .map((item) => ({
          label: item.label,
          data: item.data,
          borderColor: item.borderColor,
          backgroundColor: item.backgroundColor,
          fill: true,
          tension: 0.3,
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 4,
        })),
    }),
    [stats.trends.labels, trendDatasetConfig, trendVisibility],
  );

  const applicationStatusColors = useMemo(
    () =>
      stats.distributions.applicationStatuses.labels.map(
        (label, index) =>
          statusColorMap[String(label || "").toLowerCase()] ||
          chartColors[index % chartColors.length],
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

  const roleSplitData = useMemo(
    () => ({
      labels: stats.distributions.userRoles.labels,
      datasets: [
        {
          data: stats.distributions.userRoles.values,
          backgroundColor: roleSplitColors,
          borderWidth: 0,
        },
      ],
    }),
    [stats.distributions.userRoles],
  );
  const trendChartOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: 2,
      interaction: { mode: "index" as const, intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          titleFont: { size: 13, weight: 700 },
          bodyFont: { size: 13, weight: 600 },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: "#6a829d",
            maxTicksLimit: 10,
            maxRotation: 0,
            font: { size: 13, weight: 600 },
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(131, 151, 177, 0.20)" },
          ticks: {
            color: "#6a829d",
            precision: 0,
            font: { size: 13, weight: 600 },
          },
        },
      },
    }),
    [],
  );
  const doughnutOptions = useMemo<ChartOptions<"doughnut">>(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      devicePixelRatio: 2,
      cutout: "58%",
      plugins: {
        legend: { display: false },
      },
    }),
    [],
  );

  const applicationLegendItems = useMemo(() => {
    const labels = stats.distributions.applicationStatuses.labels;
    const values = stats.distributions.applicationStatuses.values;
    const total = values.reduce((sum, value) => sum + value, 0);
    return labels.map((label, index) => ({
      label,
      value: values[index] || 0,
      percent: percentageLabel(values[index] || 0, total),
      color:
        applicationStatusColors[index] ||
        chartColors[index % chartColors.length],
    }));
  }, [stats.distributions.applicationStatuses, applicationStatusColors]);

  const roleLegendItems = useMemo(() => {
    const labels = stats.distributions.userRoles.labels;
    const values = stats.distributions.userRoles.values;
    const total = values.reduce((sum, value) => sum + value, 0);
    return labels.map((label, index) => ({
      label,
      value: values[index] || 0,
      percent: percentageLabel(values[index] || 0, total),
      color: roleSplitColors[index % roleSplitColors.length],
    }));
  }, [stats.distributions.userRoles]);

  const assessmentTypeData = useMemo(
    () => ({
      labels: stats.assessments.adminInsights?.distributions.types.labels || [],
      datasets: [
        {
          data:
            stats.assessments.adminInsights?.distributions.types.values || [],
          backgroundColor: ["#1459b8", "#14b8a6", "#f59e0b", "#8b5cf6"],
          borderWidth: 0,
        },
      ],
    }),
    [stats.assessments.adminInsights],
  );

  const toggleTrendSeries = (
    key: "usersCreated" | "jobsPosted" | "applications",
  ) => {
    setTrendVisibility((prev) => {
      const nextValue = !prev[key];
      const activeCount = Object.values(prev).filter(Boolean).length;
      if (!nextValue && activeCount === 1) {
        return prev;
      }
      return { ...prev, [key]: nextValue };
    });
  };

  return (
    <div className="admin-profile-page-container">
      <div className="admin-profile-layout">
        <AdminSidebar />
        <div className="admin-profile-main-area">
          <div className="admin-profile-topbar-wrapper">
            <AdminTopBar />
          </div>

          <div className="admin-profile-scrollable-content">
            <div className="admin-profile-content-wrapper">
              <div className="admin-dashboard-header-row">
                <div className="admin-profile-page-header">
                  <h1>Admin Dashboard</h1>
                  <p>Platform insights and operational overview.</p>
                </div>
                <div className="admin-dashboard-inline-filters">
                  <div className="admin-dashboard-date-field">
                    <label>From</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div className="admin-dashboard-date-field">
                    <label>To</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                  <button
                    className="admin-dashboard-apply-filter"
                    onClick={() => fetchStats(fromDate, toDate)}
                  >
                    Apply Range
                  </button>
                </div>
              </div>

              <div className="admin-dashboard-content">
                <div className="admin-dashboard-stats-grid">
                  <article className="admin-dashboard-stat-card">
                    <div className="admin-dashboard-stat-content">
                      <h3>Total Users</h3>
                      <p>{stats.users.total}</p>
                      <small>
                        {stats.users.candidates} candidates /{" "}
                        {stats.users.recruiters} recruiters
                      </small>
                    </div>
                    <img
                      src={statsTotalUsersIcon}
                      alt="Total users"
                      className="admin-dashboard-stat-icon"
                    />
                  </article>
                  <article className="admin-dashboard-stat-card">
                    <div className="admin-dashboard-stat-content">
                      <h3>Jobs in Range</h3>
                      <p>{stats.jobs.total}</p>
                      <small>
                        {stats.jobs.active} active / {stats.jobs.inactive}{" "}
                        inactive
                      </small>
                    </div>
                    <img
                      src={statsTotalJobsIcon}
                      alt="Jobs in range"
                      className="admin-dashboard-stat-icon"
                    />
                  </article>
                  <article className="admin-dashboard-stat-card">
                    <div className="admin-dashboard-stat-content">
                      <h3>Applications in Range</h3>
                      <p>{stats.applications.total}</p>
                      <small>
                        {stats.applications.interview} interview /{" "}
                        {stats.applications.hired} hired
                      </small>
                    </div>
                    <img
                      src={statsApplicationsIcon}
                      alt="Applications in range"
                      className="admin-dashboard-stat-icon"
                    />
                  </article>
                  <article className="admin-dashboard-stat-card">
                    <div className="admin-dashboard-stat-content">
                      <h3>Blocked Users</h3>
                      <p>{stats.users.blocked}</p>
                      <small>{stats.users.active} currently active</small>
                    </div>
                    <img
                      src={statsBlockedUsersIcon}
                      alt="Blocked users"
                      className="admin-dashboard-stat-icon"
                    />
                  </article>
                  <article className="admin-dashboard-stat-card">
                    <div className="admin-dashboard-stat-content">
                      <h3>Admin Assessments</h3>
                      <p>{stats.assessments.adminCreated}</p>
                      <small>
                        {stats.assessments.adminInsights?.active || 0} active /{" "}
                        {stats.assessments.adminInsights?.inactive || 0}{" "}
                        inactive
                      </small>
                    </div>
                    <img
                      src={adminAssessmentIcon}
                      alt="Admin assessments"
                      className="admin-dashboard-stat-icon"
                    />
                  </article>
                  <article className="admin-dashboard-stat-card">
                    <div className="admin-dashboard-stat-content">
                      <h3>Total Assessment Attempts</h3>
                      <p>
                        {stats.assessments.adminInsights?.totalAttempts || 0}
                      </p>
                      <small>All attempts in selected date range</small>
                    </div>
                    <img
                      src={assessmentAttemptsIcon}
                      alt="Total assessment attempts"
                      className="admin-dashboard-stat-icon"
                    />
                  </article>
                </div>

                <div className="admin-dashboard-chart-stack">
                  <section className="admin-dashboard-panel admin-dashboard-chart-panel">
                    <h2>Activity Trend</h2>
                    <div className="admin-dashboard-trend-controls">
                      {trendDatasetConfig.map((item) => (
                        <label
                          key={item.key}
                          className={`admin-dashboard-trend-control ${
                            trendVisibility[item.key] ? "active" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={trendVisibility[item.key]}
                            onChange={() => toggleTrendSeries(item.key)}
                          />
                          <span
                            className="admin-dashboard-trend-dot"
                            style={{ backgroundColor: item.borderColor }}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="admin-dashboard-chart-wrap admin-dashboard-trend-chart-wrap">
                      <Line data={trendChartData} options={trendChartOptions} />
                    </div>
                  </section>
                  <section className="admin-dashboard-panel admin-dashboard-chart-panel">
                    <h2>Top Companies by Job Posts</h2>
                    {stats.topCompanies.length > 0 ? (
                      <div className="admin-dashboard-ranking-list">
                        {stats.topCompanies.map((company, index) => (
                          <div
                            key={`${company.name}-${index}`}
                            className="admin-dashboard-ranking-item"
                          >
                            <div className="admin-dashboard-ranking-left">
                              <span className="admin-dashboard-ranking-rank">
                                #{index + 1}
                              </span>
                              <img
                                src={resolveImage(company.logo)}
                                alt={company.name}
                                className="admin-dashboard-ranking-avatar admin-dashboard-avatar-recruiter"
                                onError={(event) => {
                                  event.currentTarget.src = defaultAvatar;
                                }}
                              />
                              <span className="admin-dashboard-ranking-name">
                                {company.name}
                              </span>
                            </div>
                            <span className="admin-dashboard-ranking-count">
                              {company.jobs} jobs
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="admin-dashboard-empty-chart">
                        No company posting data in selected date range.
                      </div>
                    )}
                  </section>
                </div>

                <div className="admin-dashboard-chart-grid">
                  <section className="admin-dashboard-panel admin-dashboard-chart-panel admin-dashboard-donut-panel">
                    <h2>Application Status Split</h2>
                    <div className="admin-dashboard-donut-layout">
                      <div className="admin-dashboard-donut-chart-wrap">
                        <Doughnut
                          data={applicationStatusData}
                          options={doughnutOptions}
                        />
                      </div>
                      <div className="admin-dashboard-donut-legend">
                        {applicationLegendItems.map((item) => (
                          <div
                            key={`app-legend-${item.label}`}
                            className="admin-dashboard-donut-legend-item"
                          >
                            <span className="admin-dashboard-donut-legend-left">
                              <span
                                className="admin-dashboard-donut-legend-dot"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="admin-dashboard-donut-legend-label">
                                {item.label}
                              </span>
                            </span>
                            <span className="admin-dashboard-donut-legend-value">
                              {item.percent}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                  <section className="admin-dashboard-panel admin-dashboard-chart-panel admin-dashboard-donut-panel">
                    <h2>User Role Split</h2>
                    <div className="admin-dashboard-donut-layout">
                      <div className="admin-dashboard-donut-chart-wrap">
                        <Doughnut
                          data={roleSplitData}
                          options={doughnutOptions}
                        />
                      </div>
                      <div className="admin-dashboard-donut-legend">
                        {roleLegendItems.map((item) => (
                          <div
                            key={`role-legend-${item.label}`}
                            className="admin-dashboard-donut-legend-item"
                          >
                            <span className="admin-dashboard-donut-legend-left">
                              <span
                                className="admin-dashboard-donut-legend-dot"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="admin-dashboard-donut-legend-label">
                                {item.label}
                              </span>
                            </span>
                            <span className="admin-dashboard-donut-legend-value">
                              {item.percent}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>

                <div className="admin-dashboard-chart-grid">
                  <section className="admin-dashboard-panel admin-dashboard-chart-panel admin-dashboard-donut-panel">
                    <h2>Admin Assessment Type Split</h2>
                    <div className="admin-dashboard-donut-layout">
                      <div className="admin-dashboard-donut-chart-wrap admin-dashboard-assessment-donut-chart-wrap">
                        <Doughnut
                          data={assessmentTypeData}
                          options={doughnutOptions}
                        />
                      </div>
                      <div className="admin-dashboard-donut-legend">
                        {(
                          stats.assessments.adminInsights?.distributions.types
                            .labels || []
                        ).map((label, index) => {
                          const value =
                            stats.assessments.adminInsights?.distributions.types
                              .values[index] || 0;
                          const total = (
                            stats.assessments.adminInsights?.distributions.types
                              .values || []
                          ).reduce((sum, item) => sum + item, 0);
                          const colors = [
                            "#1459b8",
                            "#14b8a6",
                            "#f59e0b",
                            "#8b5cf6",
                          ];
                          return (
                            <div
                              key={`assessment-type-${label}`}
                              className="admin-dashboard-donut-legend-item"
                            >
                              <span className="admin-dashboard-donut-legend-left">
                                <span
                                  className="admin-dashboard-donut-legend-dot"
                                  style={{
                                    backgroundColor:
                                      colors[index % colors.length],
                                  }}
                                />
                                <span className="admin-dashboard-donut-legend-label">
                                  {label}
                                </span>
                              </span>
                              <span className="admin-dashboard-donut-legend-value">
                                {percentageLabel(value, total)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>

                  <section className="admin-dashboard-panel admin-dashboard-chart-panel">
                    <h2>Top Admin Assessments by Attempts</h2>
                    {stats.assessments.adminInsights?.topAssessmentsByAttempts
                      ?.length ? (
                      <div className="admin-dashboard-ranking-list">
                        {stats.assessments.adminInsights.topAssessmentsByAttempts.map(
                          (assessment, index) => (
                            <div
                              key={`${assessment.title}-${index}`}
                              className="admin-dashboard-ranking-item"
                            >
                              <div className="admin-dashboard-ranking-left">
                                <span className="admin-dashboard-ranking-rank">
                                  #{index + 1}
                                </span>
                                <span className="admin-dashboard-ranking-name">
                                  {assessment.title}
                                </span>
                              </div>
                              <span className="admin-dashboard-ranking-count">
                                {assessment.attempts} attempts
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="admin-dashboard-empty-chart">
                        No admin assessment attempts in selected date range.
                      </div>
                    )}
                  </section>
                </div>

                <div className="admin-dashboard-summary-grid">
                  <section className="admin-dashboard-panel">
                    <h2>Recent Users</h2>
                    <div className="admin-dashboard-list">
                      {recentUsers.map((user) => (
                        <article
                          key={user._id}
                          className="admin-dashboard-list-item"
                        >
                          <div className="admin-dashboard-list-user-info">
                            <img
                              src={resolveImage(user.profilePicture)}
                              alt={user.fullName}
                              className={`admin-dashboard-list-avatar ${
                                user.role === "recruiter"
                                  ? "admin-dashboard-avatar-recruiter"
                                  : ""
                              }`}
                              onError={(event) => {
                                event.currentTarget.src = defaultAvatar;
                              }}
                            />
                            <div>
                              <h4>{user.fullName}</h4>
                              <p>{user.email}</p>
                            </div>
                          </div>
                          <div className="admin-dashboard-list-meta">
                            <span>{user.role}</span>
                            <small>{formatDate(user.lastLoginAt)}</small>
                          </div>
                        </article>
                      ))}
                      {!loading && recentUsers.length === 0 && (
                        <div className="admin-dashboard-state">
                          No recent users.
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="admin-dashboard-panel">
                    <h2>Recent Jobs</h2>
                    <div className="admin-dashboard-list">
                      {recentJobs.map((job) => (
                        <article
                          key={job._id}
                          className="admin-dashboard-list-item"
                        >
                          <div>
                            <h4>{job.jobTitle}</h4>
                            <p>{job.location || "-"}</p>
                          </div>
                          <div className="admin-dashboard-list-meta">
                            <span>{job.isActive ? "active" : "inactive"}</span>
                            <small>{formatDate(job.createdAt)}</small>
                          </div>
                        </article>
                      ))}
                      {!loading && recentJobs.length === 0 && (
                        <div className="admin-dashboard-state">
                          No recent jobs.
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                {loading && (
                  <div className="admin-dashboard-state">
                    Loading dashboard...
                  </div>
                )}
                {!loading && error && (
                  <div className="admin-dashboard-state error">{error}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
