import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admincomponents/AdminSidebar";
import AdminTopBar from "../../components/admincomponents/AdminTopBar";
import defaultAvatar from "../../images/Register Page Images/Default Profile.webp";
import "../../styles/AdminManageUsersPage.css";
import statsTotalUsersIcon from "../../images/Candidate Profile Page Images/statsTotalUsersIcon.png";
import statsCandidatesIcon from "../../images/Candidate Profile Page Images/statsCandidatesIcon.png";
import statsRecruitersIcon from "../../images/Candidate Profile Page Images/statsRecruitersIcon.png";
import statsBlockedIcon from "../../images/Candidate Profile Page Images/stats-reject.svg";
import dropdownArrow from "../../images/Register Page Images/1_2307.svg";
import prevIcon from "../../images/Employers Page Images/Prev Icon.svg";
import nextIcon from "../../images/Employers Page Images/Next Icon.svg";

type AdminUserItem = {
  _id: string;
  fullName: string;
  email: string;
  role: "candidate" | "recruiter";
  isBlocked: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  profilePicture?: string;
};

type RoleChangeConfirmState = {
  userId: string;
  fullName: string;
  email: string;
  currentRole: "candidate" | "recruiter";
  nextRole: "candidate" | "recruiter";
};

const AdminManageUsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actingUserId, setActingUserId] = useState("");
  const [blockConfirmUser, setBlockConfirmUser] = useState<AdminUserItem | null>(
    null,
  );
  const [unblockConfirmUser, setUnblockConfirmUser] = useState<AdminUserItem | null>(
    null,
  );
  const [roleChangeConfirm, setRoleChangeConfirm] =
    useState<RoleChangeConfirmState | null>(null);
  const [openRoleUserId, setOpenRoleUserId] = useState<string | null>(null);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const roleDropdownRef = useRef<HTMLDivElement | null>(null);
  const statusDropdownRef = useRef<HTMLDivElement | null>(null);
  const USERS_PER_PAGE = 20;

  const token = localStorage.getItem("authToken") || "";

  const fetchUsers = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const query = new URLSearchParams({
        search,
        role: roleFilter,
        status: statusFilter,
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/admin/list?${query.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to load users");
      }
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(users.length / USERS_PER_PAGE));
  const paginatedUsers = users.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE,
  );
  const showingStart = users.length === 0 ? 0 : (currentPage - 1) * USERS_PER_PAGE + 1;
  const showingEnd = users.length === 0 ? 0 : Math.min(currentPage * USERS_PER_PAGE, users.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target as Node)
      ) {
        setIsRoleOpen(false);
      }
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStatusOpen(false);
      }
      if (!(event.target as HTMLElement).closest(".admin-manage-role-dropdown")) {
        setOpenRoleUserId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const onSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const roleCounts = useMemo(() => {
    return {
      total: users.length,
      candidates: users.filter((user) => user.role === "candidate").length,
      recruiters: users.filter((user) => user.role === "recruiter").length,
      blocked: users.filter((user) => user.isBlocked).length,
    };
  }, [users]);

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString();
  };

  const resolveAvatar = (value?: string) => {
    if (!value) return defaultAvatar;
    if (value.startsWith("http")) return value;
    return `${import.meta.env.VITE_BACKEND_URL}${value}`;
  };

  const updateStatus = async (
    userId: string,
    action: "block" | "unblock",
    sendEmailOverride?: boolean,
  ) => {
    const sendEmail =
      typeof sendEmailOverride === "boolean"
        ? sendEmailOverride
        : false;

    try {
      setActingUserId(userId);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/admin/${userId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action, sendEmail }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to update status");
      }
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId
            ? { ...user, isBlocked: action === "block" }
            : user,
        ),
      );
    } catch (err: any) {
      setError(err?.message || "Failed to update status");
    } finally {
      setActingUserId("");
    }
  };

  const updateRole = async (
    userId: string,
    role: "candidate" | "recruiter",
    sendEmail = false,
  ) => {
    try {
      setActingUserId(userId);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/admin/${userId}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role, sendEmail }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to update role");
      }
      setUsers((prev) =>
        prev.map((user) => (user._id === userId ? { ...user, role } : user)),
      );
    } catch (err: any) {
      setError(err?.message || "Failed to update role");
    } finally {
      setActingUserId("");
    }
  };

  const goToUserDetails = (user: AdminUserItem) => {
    if (user.role === "recruiter") {
      navigate(`/employer/${user._id}`);
      return;
    }
    navigate(`/candidate/${user._id}`);
  };

  const onUserCardKeyDown = (event: KeyboardEvent, user: AdminUserItem) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToUserDetails(user);
    }
  };

  const openBlockConfirm = (userId: string) => {
    const selectedUser = users.find((item) => item._id === userId) || null;
    setBlockConfirmUser(selectedUser);
  };

  const closeBlockConfirm = () => {
    setBlockConfirmUser(null);
  };

  const onBlockConfirm = async (sendEmail: boolean) => {
    if (!blockConfirmUser) return;
    const targetUserId = blockConfirmUser._id;
    setBlockConfirmUser(null);
    await updateStatus(targetUserId, "block", sendEmail);
  };

  const openUnblockConfirm = (userId: string) => {
    const selectedUser = users.find((item) => item._id === userId) || null;
    setUnblockConfirmUser(selectedUser);
  };

  const closeUnblockConfirm = () => {
    setUnblockConfirmUser(null);
  };

  const onUnblockConfirm = async (sendEmail: boolean) => {
    if (!unblockConfirmUser) return;
    const targetUserId = unblockConfirmUser._id;
    setUnblockConfirmUser(null);
    await updateStatus(targetUserId, "unblock", sendEmail);
  };

  const openRoleChangeConfirm = (
    user: AdminUserItem,
    nextRole: "candidate" | "recruiter",
  ) => {
    setRoleChangeConfirm({
      userId: user._id,
      fullName: user.fullName,
      email: user.email,
      currentRole: user.role,
      nextRole,
    });
  };

  const closeRoleChangeConfirm = () => {
    setRoleChangeConfirm(null);
  };

  const onRoleChangeConfirm = async () => {
    if (!roleChangeConfirm) return;
    const targetUserId = roleChangeConfirm.userId;
    const targetRole = roleChangeConfirm.nextRole;
    setRoleChangeConfirm(null);
    await updateRole(targetUserId, targetRole, true);
  };

  return (
    <div className="admin-assessments-layout">
      <AdminSidebar />
      <main className="admin-manage-main-area">
        <div className="admin-manage-topbar-wrapper">
          <AdminTopBar />
        </div>
        <div className="admin-manage-scrollable-content">
          <section className="admin-manage-shell">
            <header className="admin-manage-header">
              <h1>Manage Users</h1>
              <p>Filter and manage candidates and recruiters from one place.</p>
            </header>

            <div className="admin-manage-stats">
              <article className="admin-manage-stat-card">
                <div>
                  <h3>{roleCounts.total}</h3>
                  <span>Total Users</span>
                </div>
                <img src={statsTotalUsersIcon} alt="Total users" />
              </article>
              <article className="admin-manage-stat-card">
                <div>
                  <h3>{roleCounts.candidates}</h3>
                  <span>Candidates</span>
                </div>
                <img src={statsCandidatesIcon} alt="Candidates" />
              </article>
              <article className="admin-manage-stat-card">
                <div>
                  <h3>{roleCounts.recruiters}</h3>
                  <span>Recruiters</span>
                </div>
                <img src={statsRecruitersIcon} alt="Recruiters" />
              </article>
              <article className="admin-manage-stat-card">
                <div>
                  <h3>{roleCounts.blocked}</h3>
                  <span>Blocked</span>
                </div>
                <img src={statsBlockedIcon} alt="Blocked users" />
              </article>
            </div>

            <form className="admin-manage-filters" onSubmit={onSearchSubmit}>
              <input
                type="text"
                placeholder="Search by full name or email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <div
                className="admin-manage-filter-dropdown"
                ref={roleDropdownRef}
              >
                <button
                  type="button"
                  className={`admin-manage-filter-trigger ${
                    isRoleOpen ? "open" : ""
                  }`}
                  onClick={() => {
                    setIsRoleOpen((prev) => !prev);
                    setIsStatusOpen(false);
                  }}
                >
                  <span>
                    {roleFilter === "candidate"
                      ? "Candidate"
                      : roleFilter === "recruiter"
                        ? "Recruiter"
                        : "All Roles"}
                  </span>
                  <img
                    src={dropdownArrow}
                    alt=""
                    aria-hidden="true"
                    className={`admin-manage-filter-caret ${
                      isRoleOpen ? "open" : ""
                    }`}
                  />
                </button>
                {isRoleOpen && (
                  <div className="admin-manage-filter-menu" role="listbox">
                    {[
                      { value: "all", label: "All Roles" },
                      { value: "candidate", label: "Candidate" },
                      { value: "recruiter", label: "Recruiter" },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        className={`admin-manage-filter-option ${
                          roleFilter === item.value ? "active" : ""
                        }`}
                        onClick={() => {
                          setRoleFilter(item.value);
                          setIsRoleOpen(false);
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div
                className="admin-manage-filter-dropdown"
                ref={statusDropdownRef}
              >
                <button
                  type="button"
                  className={`admin-manage-filter-trigger ${
                    isStatusOpen ? "open" : ""
                  }`}
                  onClick={() => {
                    setIsStatusOpen((prev) => !prev);
                    setIsRoleOpen(false);
                  }}
                >
                  <span>
                    {statusFilter === "active"
                      ? "Active"
                      : statusFilter === "blocked"
                        ? "Blocked"
                        : "All Status"}
                  </span>
                  <img
                    src={dropdownArrow}
                    alt=""
                    aria-hidden="true"
                    className={`admin-manage-filter-caret ${
                      isStatusOpen ? "open" : ""
                    }`}
                  />
                </button>
                {isStatusOpen && (
                  <div className="admin-manage-filter-menu" role="listbox">
                    {[
                      { value: "all", label: "All Status" },
                      { value: "active", label: "Active" },
                      { value: "blocked", label: "Blocked" },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        className={`admin-manage-filter-option ${
                          statusFilter === item.value ? "active" : ""
                        }`}
                        onClick={() => {
                          setStatusFilter(item.value);
                          setIsStatusOpen(false);
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit">Search</button>
            </form>

            <section className="admin-manage-table-wrap">
              <header className="admin-manage-table-head">
                <span>User</span>
                <span>Role</span>
                <span>Status</span>
                <span>Created Date</span>
                <span>Last Login</span>
                <span>Actions</span>
              </header>

              {loading && (
                <div className="admin-manage-state">Loading users...</div>
              )}
              {!loading && error && (
                <div className="admin-manage-state error">{error}</div>
              )}
              {!loading && !error && users.length === 0 && (
                <div className="admin-manage-state">No users found.</div>
              )}

              {!loading &&
                !error &&
                paginatedUsers.map((user) => (
                  <article className="admin-manage-row" key={user._id}>
                    <div
                      className="admin-manage-user-cell admin-manage-user-clickable"
                      onClick={() => goToUserDetails(user)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => onUserCardKeyDown(event, user)}
                    >
                      <img
                        src={resolveAvatar(user.profilePicture)}
                        alt={user.fullName}
                        className={
                          user.role === "recruiter"
                            ? "admin-manage-avatar recruiter-logo"
                            : "admin-manage-avatar"
                        }
                        onError={(event) => {
                          event.currentTarget.src = defaultAvatar;
                        }}
                      />
                      <div>
                        <h4>{user.fullName}</h4>
                        <p>{user.email}</p>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`admin-role-badge ${
                          user.role === "candidate" ? "candidate" : "recruiter"
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <div>
                      <span
                        className={`admin-status-badge ${
                          user.isBlocked ? "blocked" : "active"
                        }`}
                      >
                        {user.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </div>
                    <div>{formatDate(user.createdAt)}</div>
                    <div>{formatDate(user.lastLoginAt)}</div>
                    <div className="admin-manage-actions">
                      <div className="admin-manage-role-dropdown">
                        <button
                          type="button"
                          className={`admin-manage-role-trigger ${
                            openRoleUserId === user._id ? "open" : ""
                          }`}
                          onClick={() =>
                            setOpenRoleUserId((prev) =>
                              prev === user._id ? null : user._id,
                            )
                          }
                          disabled={actingUserId === user._id}
                        >
                          <span>
                            {user.role === "candidate" ? "Candidate" : "Recruiter"}
                          </span>
                        </button>
                        <img
                          src={dropdownArrow}
                          alt=""
                          aria-hidden="true"
                          className={`admin-manage-role-caret ${
                            openRoleUserId === user._id ? "open" : ""
                          }`}
                        />
                        {openRoleUserId === user._id && (
                          <div className="admin-manage-role-menu" role="listbox">
                            {[
                              { value: "candidate", label: "Candidate" },
                              { value: "recruiter", label: "Recruiter" },
                            ].map((item) => (
                              <button
                                key={item.value}
                                type="button"
                                className={`admin-manage-role-option ${
                                  user.role === item.value ? "active" : ""
                                }`}
                                onClick={() => {
                                  setOpenRoleUserId(null);
                                  if (user.role !== item.value) {
                                    openRoleChangeConfirm(
                                      user,
                                      item.value as "candidate" | "recruiter",
                                    );
                                  }
                                }}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {user.isBlocked ? (
                        <button
                          type="button"
                          className="action-unblock"
                          onClick={() => openUnblockConfirm(user._id)}
                          disabled={actingUserId === user._id}
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="action-block"
                          onClick={() => openBlockConfirm(user._id)}
                          disabled={actingUserId === user._id}
                        >
                          Block
                        </button>
                      )}
                    </div>
                  </article>
                ))}

              {!loading && !error && users.length > 0 && (
                <div className="admin-manage-pagination">
                  <div className="admin-manage-page-controls">
                    <button
                      className="admin-manage-page-nav"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <img src={prevIcon} alt="Previous" />
                    </button>
                    <div className="admin-manage-page-numbers">
                      {Array.from(
                        { length: Math.min(totalPages, 7) },
                        (_, index) => {
                          let pageNum = index + 1;
                          if (totalPages > 7 && currentPage > 4) {
                            pageNum = Math.min(
                              totalPages - 6 + index,
                              currentPage - 3 + index,
                            );
                          }
                          return pageNum;
                        },
                      ).map((pageNum) => (
                        <button
                          key={pageNum}
                          className={`admin-manage-page-num ${
                            currentPage === pageNum ? "active" : ""
                          }`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                    <button
                      className="admin-manage-page-nav"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <img src={nextIcon} alt="Next" />
                    </button>
                  </div>
                  <div className="admin-manage-page-info">
                    Showing {showingStart} to {showingEnd} of {users.length}
                  </div>
                </div>
              )}
            </section>
          </section>
        </div>
      </main>
      {blockConfirmUser && (
        <div
          className="admin-manage-modal-backdrop"
          onClick={closeBlockConfirm}
          role="presentation"
        >
          <div
            className="admin-manage-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-block-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="admin-block-confirm-title">Block User</h3>
            <p>
              Do you also want to send a block notification email to{" "}
              <strong>{blockConfirmUser.email}</strong>?
            </p>
            <div className="admin-manage-modal-actions">
              <button
                type="button"
                className="admin-manage-modal-btn cancel"
                onClick={closeBlockConfirm}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-manage-modal-btn neutral"
                onClick={() => onBlockConfirm(false)}
              >
                Block Only
              </button>
              <button
                type="button"
                className="admin-manage-modal-btn primary"
                onClick={() => onBlockConfirm(true)}
              >
                Block + Send Email
              </button>
            </div>
          </div>
        </div>
      )}
      {roleChangeConfirm && (
        <div
          className="admin-manage-modal-backdrop"
          onClick={closeRoleChangeConfirm}
          role="presentation"
        >
          <div
            className="admin-manage-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-role-change-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="admin-role-change-confirm-title">Confirm Role Change</h3>
            <p>
              Change role for <strong>{roleChangeConfirm.fullName}</strong> (
              <strong>{roleChangeConfirm.email}</strong>) from{" "}
              <strong>
                {roleChangeConfirm.currentRole === "candidate"
                  ? "Candidate"
                  : "Recruiter"}
              </strong>{" "}
              to{" "}
              <strong>
                {roleChangeConfirm.nextRole === "candidate"
                  ? "Candidate"
                  : "Recruiter"}
              </strong>
              ?
            </p>
            <p>
              A role change notification email will be sent to this user after
              confirmation.
            </p>
            <div className="admin-manage-modal-actions">
              <button
                type="button"
                className="admin-manage-modal-btn cancel"
                onClick={closeRoleChangeConfirm}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-manage-modal-btn primary"
                onClick={onRoleChangeConfirm}
              >
                Confirm + Send Email
              </button>
            </div>
          </div>
        </div>
      )}
      {unblockConfirmUser && (
        <div
          className="admin-manage-modal-backdrop"
          onClick={closeUnblockConfirm}
          role="presentation"
        >
          <div
            className="admin-manage-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-unblock-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="admin-unblock-confirm-title">Unblock User</h3>
            <p>
              Do you also want to send an unblock notification email to{" "}
              <strong>{unblockConfirmUser.email}</strong>?
            </p>
            <div className="admin-manage-modal-actions">
              <button
                type="button"
                className="admin-manage-modal-btn cancel"
                onClick={closeUnblockConfirm}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-manage-modal-btn neutral"
                onClick={() => onUnblockConfirm(false)}
              >
                Unblock Only
              </button>
              <button
                type="button"
                className="admin-manage-modal-btn primary"
                onClick={() => onUnblockConfirm(true)}
              >
                Unblock + Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManageUsersPage;


