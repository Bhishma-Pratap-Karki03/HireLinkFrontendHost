import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";
import { connectSocket, getSocket } from "../lib/socketClient";

// Import images
import logoImg from "../images/Register Page Images/Logo.png";
import dropdownArrow from "../images/Register Page Images/1_2307.svg";
import applyDot from "../images/Register Page Images/1_2315.svg";
import menuIcon from "../images/Register Page Images/menu.png";
import bookmarkIcon from "../images/Register Page Images/281_1325.svg";
import notificationIcon from "../images/Register Page Images/281_1327.svg";
import defaultAvatar from "../images/Register Page Images/Default Profile.webp";
import dashboardIcon from "../images/Register Page Images/Dashboard.png";
import profileIcon from "../images/Register Page Images/My Profile.png";
import logoutIcon from "../images/Register Page Images/Log Out.png";

interface NavbarProps {
  isAuthenticated?: boolean;
  userType?: "candidate" | "recruiter" | "admin";
}

interface UserData {
  id: string;
  fullName: string;
  email: string;
  role: string;
  profilePicture?: string;
  currentJobTitle?: string;
  phone?: string;
  address?: string;
}

interface NotificationItem {
  id: string;
  type:
    | "connection_request_received"
    | "connection_request_accepted"
    | "application_status_updated"
    | "project_review_received"
    | "company_review_received"
    | "message_received"
    | "contact_message_received";
  isRead: boolean;
  message: string;
  createdAt: string;
  updatedAt: string;
  targetPath: string;
  contactMessageId?: string;
  unreadMessageCount?: number;
  actor?: {
    id: string;
    fullName: string;
    role: string;
    profilePicture?: string;
  };
}

interface MessageConversationItem {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    profilePicture?: string;
    currentJobTitle?: string;
  };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    receiverId: string;
  } | null;
  updatedAt: string;
  unreadCount?: number;
}

interface AdminContactNotificationItem {
  _id: string;
  name: string;
  email: string;
  subject: string;
  isRead?: boolean;
  createdAt: string;
}

const NOTIFICATION_TOAST_STORAGE_PREFIX = "connectionNotificationToasts:";

const readStoredUserData = (): UserData | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("userData");
    return raw ? (JSON.parse(raw) as UserData) : null;
  } catch {
    return null;
  }
};

const readStoredUserName = (): string => {
  const stored = readStoredUserData();
  if (!stored) return "";
  if (stored.fullName) return stored.fullName;
  if (stored.email) return stored.email.split("@")[0];
  return "";
};

const getToastStorageKey = () => {
  const storedUser = readStoredUserData();
  const userId = storedUser?.id || "guest";
  return `${NOTIFICATION_TOAST_STORAGE_PREFIX}${userId}`;
};

const resolveAvatar = (value?: string) => {
  if (!value) return defaultAvatar;
  if (value.startsWith("http")) return value;
  return `${import.meta.env.VITE_BACKEND_URL}${value}`;
};

const getNotificationTime = (item: NotificationItem) => {
  const primary = new Date(item.updatedAt || item.createdAt).getTime();
  if (!Number.isNaN(primary)) return primary;
  const fallback = new Date(item.createdAt).getTime();
  return Number.isNaN(fallback) ? 0 : fallback;
};
const NOTIFICATION_DROPDOWN_LIMIT = 20;

const Navbar = (_props: NavbarProps) => {
  const ADMIN_VIEWED_CONTACT_STORAGE_KEY = "adminViewedContactNotificationIds";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    typeof window !== "undefined" ? Boolean(localStorage.getItem("authToken")) : false
  );
  const [userName, setUserName] = useState<string>(() => readStoredUserName());
  const [userData, setUserData] = useState<UserData | null>(() => readStoredUserData());
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileUserDropdownOpen, setIsMobileUserDropdownOpen] =
    useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [connectionNotificationItems, setConnectionNotificationItems] = useState<
    NotificationItem[]
  >([]);
  const [messageNotificationItems, setMessageNotificationItems] = useState<
    NotificationItem[]
  >([]);
  const [adminContactNotificationItems, setAdminContactNotificationItems] =
    useState<NotificationItem[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [connectionUnreadCount, setConnectionUnreadCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [adminContactUnreadCount, setAdminContactUnreadCount] = useState(0);
  const [notificationToasts, setNotificationToasts] = useState<NotificationItem[]>([]);
  const [dismissingToastIds, setDismissingToastIds] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string>(defaultAvatar);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileUserDropdownRef = useRef<HTMLDivElement | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const toastTimersRef = useRef<Record<string, number>>({});
  const knownAdminContactIdsRef = useRef<Set<string>>(new Set());
  const viewedAdminContactIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedAdminContactsRef = useRef(false);
  const navigate = useNavigate();
  const notificationItems = useMemo(() => {
    return [
      ...connectionNotificationItems,
      ...messageNotificationItems,
      ...adminContactNotificationItems,
    ]
      .sort((a, b) => getNotificationTime(b) - getNotificationTime(a))
      .slice(0, NOTIFICATION_DROPDOWN_LIMIT);
  }, [
    connectionNotificationItems,
    messageNotificationItems,
    adminContactNotificationItems,
  ]);
  const unreadNotificationCount =
    connectionUnreadCount + messageUnreadCount + adminContactUnreadCount;

  const isAdminContactViewed = (item: NotificationItem) => {
    if (item.type !== "contact_message_received" || !item.contactMessageId) {
      return false;
    }
    return viewedAdminContactIdsRef.current.has(item.contactMessageId);
  };

  // Fetch user data from backend
  const fetchUserData = async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      setIsAuthenticated(false);
      setUserData(null);
      setUserName("");
      setProfileImage(defaultAvatar);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profile/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        setIsAuthenticated(true);

        // IMPORTANT: Check if this is the admin email and update role
        const isAdminEmail = data.user.email === "hirelinknp@gmail.com";
        if (isAdminEmail) {
          // Update userData with admin role
          const updatedUserData = {
            ...data.user,
            role: "admin", // Force admin role for admin email
          };
          setUserData(updatedUserData);

          // Update localStorage with admin role
          const minimalUserData = {
            id: data.user.id,
            fullName: data.user.fullName,
            email: data.user.email,
            role: "admin", // Store as admin
          };
          localStorage.setItem("userData", JSON.stringify(minimalUserData));
        } else {
          // For non-admin users
          const minimalUserData = {
            id: data.user.id,
            fullName: data.user.fullName,
            email: data.user.email,
            role: data.user.role,
          };
          localStorage.setItem("userData", JSON.stringify(minimalUserData));
        }

        // Set user name - prioritize fullName, fallback to email
        if (data.user.fullName) {
          setUserName(data.user.fullName);
        } else if (data.user.email) {
          setUserName(data.user.email.split("@")[0]);
        } else {
          setUserName("User");
        }

        // Set profile picture from database
        if (data.user.profilePicture && data.user.profilePicture !== "") {
          if (data.user.profilePicture.startsWith("http")) {
            setProfileImage(data.user.profilePicture);
          } else {
            setProfileImage(`${import.meta.env.VITE_BACKEND_URL}${data.user.profilePicture}`);
          }
        } else {
          // Use default avatar for users without profile picture
          setProfileImage(defaultAvatar);
        }
      } else if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        setIsAuthenticated(false);
        setUserData(null);
        setUserName("");
        setProfileImage(defaultAvatar);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setIsAuthenticated(false);
      setUserData(null);
      setUserName("");
      setProfileImage(defaultAvatar);
    }
  };

  useEffect(() => {
    fetchUserData();

    // Set up interval to refresh user data (increased to 5 minutes to prevent overload)
    const intervalId = setInterval(() => {
      const token = localStorage.getItem("authToken");
      if (token) {
        fetchUserData();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(intervalId);
  }, []); // Empty dependency array - FIXED: prevents infinite loop

  // Listen for profile update events
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchUserData();
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, []);

  // Check if user is admin by email
  const isAdminUser = userData?.email === "hirelinknp@gmail.com";

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsMobileUserDropdownOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileUserDropdownOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen((prev) => !prev);
  };

  const toggleMobileUserDropdown = () => {
    setIsMobileUserDropdownOpen((prev) => !prev);
  };

  const fetchNotifications = async (silent = false) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setConnectionNotificationItems([]);
      setConnectionUnreadCount(0);
      return;
    }

    try {
      if (!silent) {
        setNotificationLoading(true);
        setNotificationError("");
      }
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/connections/notifications?limit=${NOTIFICATION_DROPDOWN_LIMIT}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to load notifications");
      }
      setConnectionNotificationItems(data?.notifications || []);
      setConnectionUnreadCount(Number(data?.unreadCount || 0));
    } catch (error: any) {
      if (!silent) {
        setNotificationError(error?.message || "Failed to load notifications");
      }
    } finally {
      if (!silent) {
        setNotificationLoading(false);
      }
    }
  };

  const fetchMessageNotifications = async (silent = false) => {
    const token = localStorage.getItem("authToken");
    const role = userData?.role;
    if (!token || (role !== "candidate" && role !== "recruiter")) {
      setMessageNotificationItems([]);
      setMessageUnreadCount(0);
      return;
    }

    try {
      if (!silent) {
        setNotificationLoading(true);
        setNotificationError("");
      }
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/messages/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to load message notifications");
      }

      const conversations = (data?.conversations || []) as MessageConversationItem[];
      const unreadConversations = conversations.filter(
        (item) => Number(item?.unreadCount || 0) > 0
      );
      const totalUnread = unreadConversations.reduce(
        (sum, item) => sum + Number(item?.unreadCount || 0),
        0
      );

      const mapped = unreadConversations
        .map((item) => {
          const unreadCount = Number(item.unreadCount || 0);
          const displayMessage = item.lastMessage?.content?.trim()
            ? item.lastMessage.content
            : "sent you a message.";
          const messagePath =
            role === "recruiter"
              ? `/recruiter/messages?user=${item.user.id}`
              : `/candidate/messages?user=${item.user.id}`;

          return {
            id: `message:${item.user.id}`,
            type: "message_received" as const,
            isRead: false,
            message:
              unreadCount > 1
                ? `${item.user.fullName} sent ${unreadCount} new messages.`
                : `${item.user.fullName}: ${displayMessage}`,
            createdAt: item.lastMessage?.createdAt || item.updatedAt,
            updatedAt: item.lastMessage?.createdAt || item.updatedAt,
            targetPath: messagePath,
            unreadMessageCount: unreadCount,
            actor: {
              id: item.user.id,
              fullName: item.user.fullName || "User",
              role: item.user.role || "",
              profilePicture: item.user.profilePicture || "",
            },
          };
        })
        .sort((a, b) => getNotificationTime(b) - getNotificationTime(a))
        .slice(0, NOTIFICATION_DROPDOWN_LIMIT);

      setMessageNotificationItems(mapped);
      setMessageUnreadCount(totalUnread);
    } catch (error: any) {
      if (!silent) {
        setNotificationError(
          error?.message || "Failed to load message notifications"
        );
      }
    } finally {
      if (!silent) {
        setNotificationLoading(false);
      }
    }
  };

  const fetchAdminContactNotifications = async (silent = false) => {
    const token = localStorage.getItem("authToken");
    if (!token || !isAdminUser) {
      setAdminContactNotificationItems([]);
      setAdminContactUnreadCount(0);
      return;
    }

    try {
      if (!silent) {
        setNotificationLoading(true);
        setNotificationError("");
      }
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/contact/admin/messages?status=all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to load contact notifications");
      }

      const incoming = (data?.messages || []) as AdminContactNotificationItem[];
      const mapped: NotificationItem[] = incoming
        .slice(0, NOTIFICATION_DROPDOWN_LIMIT)
        .map((item) => ({
        id: `contact:${item._id}`,
        contactMessageId: item._id,
        type: "contact_message_received",
        isRead: Boolean(item.isRead),
        message: `${item.name} sent a contact message.`,
        createdAt: item.createdAt,
        updatedAt: item.createdAt,
        targetPath: "/admin/contact-messages",
      }));

      const currentIds = new Set(mapped.map((item) => item.id));
      if (hasLoadedAdminContactsRef.current) {
        const newItems = mapped.filter(
          (item) => !knownAdminContactIdsRef.current.has(item.id) && !item.isRead,
        );
        if (newItems.length > 0) {
          setNotificationToasts((prev) => {
            const next = [
              ...newItems,
              ...prev.filter(
                (oldItem) => !newItems.some((newItem) => newItem.id === oldItem.id),
              ),
            ];
            return next.slice(0, 3);
          });
        }
      }

      knownAdminContactIdsRef.current = currentIds;
      hasLoadedAdminContactsRef.current = true;

      setAdminContactNotificationItems(mapped);
      setAdminContactUnreadCount(
        incoming.filter(
          (item) =>
            !Boolean(item.isRead) &&
            !viewedAdminContactIdsRef.current.has(item._id),
        ).length,
      );
    } catch (error: any) {
      if (!silent) {
        setNotificationError(
          error?.message || "Failed to load contact notifications",
        );
      }
    } finally {
      if (!silent) {
        setNotificationLoading(false);
      }
    }
  };

  const toggleNotificationMenu = () => {
    setIsNotificationOpen((prev) => {
      const next = !prev;
      if (next) {
        if (isAdminUser) {
          fetchAdminContactNotifications();
        } else {
          fetchNotifications();
          fetchMessageNotifications();
        }
      }
      return next;
    });
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (item.type === "contact_message_received") {
      if (
        item.contactMessageId &&
        !item.isRead &&
        !viewedAdminContactIdsRef.current.has(item.contactMessageId)
      ) {
        viewedAdminContactIdsRef.current.add(item.contactMessageId);
        try {
          localStorage.setItem(
            ADMIN_VIEWED_CONTACT_STORAGE_KEY,
            JSON.stringify(Array.from(viewedAdminContactIdsRef.current)),
          );
        } catch {
          // no-op
        }
        setAdminContactUnreadCount((prev) => Math.max(prev - 1, 0));
      }
      dismissToast(item.id);
      setIsNotificationOpen(false);
      navigate("/admin/contact-messages");
      return;
    }

    if (item.type === "message_received") {
      setMessageNotificationItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id ? { ...entry, isRead: true } : entry
        )
      );
      const consumedUnread = Number(item.unreadMessageCount || 0);
      if (consumedUnread > 0) {
        setMessageUnreadCount((prev) => Math.max(prev - consumedUnread, 0));
      }
      setIsNotificationOpen(false);
      navigate(item.targetPath || "/home");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/connections/notifications/read`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notificationId: item.id }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setConnectionNotificationItems((prev) =>
          prev.map((entry) =>
            entry.id === item.id ? { ...entry, isRead: true } : entry
          )
        );
        setConnectionUnreadCount(Number(data?.unreadCount || 0));
      }
    } catch {
      // no-op: navigation should continue even if read-status update fails
    }

    setIsNotificationOpen(false);
    if (item.type === "connection_request_received") {
      const friendRequestsPath =
        userData?.role === "recruiter"
          ? "/recruiter/friend-requests"
          : "/candidate/friend-requests";
      navigate(friendRequestsPath);
      return;
    }

    navigate(item.targetPath || "/home");
  };

  const dismissToast = (notificationId: string) => {
    setDismissingToastIds((prev) =>
      prev.includes(notificationId) ? prev : [...prev, notificationId]
    );
    window.setTimeout(() => {
      setNotificationToasts((prev) =>
        prev.filter((item) => item.id !== notificationId)
      );
      setDismissingToastIds((prev) =>
        prev.filter((id) => id !== notificationId)
      );
      const activeTimer = toastTimersRef.current[notificationId];
      if (activeTimer) {
        window.clearTimeout(activeTimer);
        delete toastTimersRef.current[notificationId];
      }
    }, 280);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(getToastStorageKey());
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      setNotificationToasts(parsed.slice(0, 3));
    } catch {
      // ignore invalid local storage values
    }
  }, []);

  useEffect(() => {
    try {
      if (notificationToasts.length === 0) {
        localStorage.removeItem(getToastStorageKey());
        return;
      }
      localStorage.setItem(
        getToastStorageKey(),
        JSON.stringify(notificationToasts.slice(0, 3))
      );
    } catch {
      // ignore local storage write errors
    }
  }, [notificationToasts]);

  useEffect(() => {
    notificationToasts.forEach((toast) => {
      if (toastTimersRef.current[toast.id]) return;
      toastTimersRef.current[toast.id] = window.setTimeout(() => {
        dismissToast(toast.id);
      }, 20000);
    });

    Object.keys(toastTimersRef.current).forEach((toastId) => {
      const stillExists = notificationToasts.some((item) => item.id === toastId);
      if (!stillExists) {
        window.clearTimeout(toastTimersRef.current[toastId]);
        delete toastTimersRef.current[toastId];
      }
    });
  }, [notificationToasts]);

  useEffect(() => {
    return () => {
      Object.keys(toastTimersRef.current).forEach((toastId) => {
        window.clearTimeout(toastTimersRef.current[toastId]);
      });
      toastTimersRef.current = {};
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("authToken") || "";
    const isNotifiableRole =
      (userData?.role === "candidate" || userData?.role === "recruiter") &&
      !isAdminUser;

    if (!token || !isNotifiableRole) return;

    const socket = connectSocket(token);
    if (!socket) return;

    const handleRealtimeNotification = (payload: {
      notification?: NotificationItem;
      unreadCount?: number;
    }) => {
      const incoming = payload?.notification;
      if (!incoming) return;
      setConnectionNotificationItems((prev) => {
        const merged = [incoming, ...prev.filter((item) => item.id !== incoming.id)];
        return merged.slice(0, NOTIFICATION_DROPDOWN_LIMIT);
      });
      setConnectionUnreadCount(
        typeof payload?.unreadCount === "number"
          ? Number(payload.unreadCount)
          : (prev) => prev + 1
      );
      setNotificationToasts((prev) => {
        const next = [incoming, ...prev.filter((item) => item.id !== incoming.id)];
        return next.slice(0, 3);
      });
    };

    const handleMessageNotification = (payload: any) => {
      const receiverId = String(payload?.receiverId || "");
      const senderId = String(payload?.senderId || "");
      const actor = payload?.sender;

      if (!receiverId || !senderId || !userData?.id || receiverId !== userData.id) {
        return;
      }

      const role = userData?.role;
      if (role !== "candidate" && role !== "recruiter") return;

      const targetPath =
        role === "recruiter"
          ? `/recruiter/messages?user=${senderId}`
          : `/candidate/messages?user=${senderId}`;
      const nextUpdatedAt = payload?.createdAt || new Date().toISOString();

      setMessageNotificationItems((prev) => {
        const existing = prev.find((item) => item.id === `message:${senderId}`);
        const unreadCount = Number(existing?.unreadMessageCount || 0) + 1;

        const updatedItem: NotificationItem = {
          id: `message:${senderId}`,
          type: "message_received",
          isRead: false,
          message: `${actor?.fullName || "User"}: ${payload?.content || "sent you a message."}`,
          createdAt: nextUpdatedAt,
          updatedAt: nextUpdatedAt,
          targetPath,
          unreadMessageCount: unreadCount,
          actor: {
            id: senderId,
            fullName: actor?.fullName || "User",
            role: actor?.role || "",
            profilePicture: actor?.profilePicture || "",
          },
        };

        const merged = [updatedItem, ...prev.filter((item) => item.id !== updatedItem.id)];
        return merged.slice(0, NOTIFICATION_DROPDOWN_LIMIT);
      });
      setMessageUnreadCount((prev) => prev + 1);
    };

    const handleSocketConnect = () => {
      fetchNotifications(true);
      fetchMessageNotifications(true);
    };

    socket.on("connect", handleSocketConnect);
    socket.on("notification:connection:new", handleRealtimeNotification);
    socket.on("message:new", handleMessageNotification);

    fetchNotifications(true);
    fetchMessageNotifications(true);

    return () => {
      const activeSocket = getSocket();
      activeSocket?.off("connect", handleSocketConnect);
      activeSocket?.off("notification:connection:new", handleRealtimeNotification);
      activeSocket?.off("message:new", handleMessageNotification);
    };
  }, [userData?.role, userData?.id, isAdminUser]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ADMIN_VIEWED_CONTACT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          viewedAdminContactIdsRef.current = new Set(
            parsed.filter((value) => typeof value === "string"),
          );
        }
      }
    } catch {
      // no-op
    }

    const token = localStorage.getItem("authToken") || "";
    if (!token || !isAdminUser) return;

    fetchAdminContactNotifications(true);
    const intervalId = window.setInterval(() => {
      fetchAdminContactNotifications(true);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [isAdminUser]);

  useEffect(() => {
    const onDeleted = (event: Event) => {
      const custom = event as CustomEvent<{
        notificationId?: string;
        unreadCount?: number;
      }>;
      const notificationId = custom.detail?.notificationId;
      if (!notificationId) return;

      setConnectionNotificationItems((prev) =>
        prev.filter((item) => item.id !== notificationId)
      );
      setNotificationToasts((prev) =>
        prev.filter((item) => item.id !== notificationId)
      );
      setDismissingToastIds((prev) =>
        prev.filter((id) => id !== notificationId)
      );

      const nextUnread = custom.detail?.unreadCount;
      if (typeof nextUnread === "number") {
        setConnectionUnreadCount(nextUnread);
      }
    };

    window.addEventListener("connectionNotificationDeleted", onDeleted);
    return () =>
      window.removeEventListener("connectionNotificationDeleted", onDeleted);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Handle desktop user dropdown
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }

      // Handle mobile user dropdown
      if (
        mobileUserDropdownRef.current &&
        !mobileUserDropdownRef.current.contains(event.target as Node) &&
        isMobileMenuOpen
      ) {
        setIsMobileUserDropdownOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("profilePictureBase64");
    localStorage.removeItem("profilePictureFileName");
    localStorage.removeItem(getToastStorageKey());

    // Update state
    setIsAuthenticated(false);
    setUserName("");
    setUserData(null);
    setProfileImage(defaultAvatar);
    setIsMobileUserDropdownOpen(false);
    setIsUserMenuOpen(false);
    setConnectionNotificationItems([]);
    setMessageNotificationItems([]);
    setAdminContactNotificationItems([]);
    setConnectionUnreadCount(0);
    setMessageUnreadCount(0);
    setAdminContactUnreadCount(0);
    setIsNotificationOpen(false);
    setNotificationToasts([]);

    console.log("Logging out...");
    closeMobileMenu();

    // Redirect to login page
    navigate("/login", { replace: true });
  };

  const handleDashboardClick = () => {
    // Navigate to appropriate dashboard based on user role
    if (userData) {
      // Check if admin by email (primary check)
      if (isAdminUser) {
        navigate("/admin-dashboard");
      } else if (userData.role === "recruiter") {
        navigate("/recruiter-dashboard");
      } else {
        navigate("/candidate-dashboard");
      }
    } else {
      // Fallback to candidate dashboard if no user data
      navigate("/candidate-dashboard");
    }
    closeMobileMenu();
    setIsUserMenuOpen(false);
    setIsMobileUserDropdownOpen(false);
  };

  const handleProfileClick = () => {
    // Navigate to profile page based on role
    if (userData) {
      // Check if admin by email (primary check)
      if (isAdminUser) {
        navigate("/admin-profile");
      } else if (userData.role === "candidate") {
        navigate("/candidate-profile");
      } else if (userData.role === "recruiter") {
        navigate("/recruiter-profile");
      }
    } else {
      // Fallback to candidate profile if no user data
      navigate("/candidate-profile");
    }
    setIsUserMenuOpen(false);
    setIsMobileUserDropdownOpen(false);
    closeMobileMenu();
  };

  const handleSavedJobsClick = () => {
    if (isCandidate && !isAdminUser) {
      navigate("/candidate/saved-jobs");
    }
    closeMobileMenu();
    setIsUserMenuOpen(false);
    setIsMobileUserDropdownOpen(false);
  };

  const handleMobileNotificationHistoryClick = () => {
    if (isAdminUser) {
      navigate("/admin/contact-messages");
    } else if (isRecruiter) {
      navigate("/recruiter/notifications");
    } else {
      navigate("/candidate/notifications");
    }
    closeMobileMenu();
    setIsUserMenuOpen(false);
    setIsMobileUserDropdownOpen(false);
  };

  const handleNotificationHistoryClick = () => {
    setIsNotificationOpen(false);
    if (isAdminUser) {
      navigate("/admin/contact-messages");
    } else if (isRecruiter) {
      navigate("/recruiter/notifications");
    } else {
      navigate("/candidate/notifications");
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      if (isAdminUser) {
        const unreadContacts = adminContactNotificationItems.filter(
          (item) =>
            item.contactMessageId &&
            !item.isRead &&
            !viewedAdminContactIdsRef.current.has(item.contactMessageId),
        );
        await Promise.all(
          unreadContacts.map((item) =>
            fetch(
              `${import.meta.env.VITE_API_BASE_URL}/contact/admin/messages/${item.contactMessageId}/read`,
              {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              },
            ),
          ),
        );
        setAdminContactNotificationItems((prev) =>
          prev.map((item) => ({ ...item, isRead: true })),
        );
        setAdminContactUnreadCount(0);
      } else {
        const unreadConnectionIds = connectionNotificationItems
          .filter((item) => !item.isRead)
          .map((item) => item.id);

        await Promise.all(
          unreadConnectionIds.map((notificationId) =>
            fetch(`${import.meta.env.VITE_API_BASE_URL}/connections/notifications/read`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ notificationId }),
            }),
          ),
        );

        setConnectionNotificationItems((prev) =>
          prev.map((item) => ({ ...item, isRead: true })),
        );
        setConnectionUnreadCount(0);
        setMessageNotificationItems((prev) =>
          prev.map((item) => ({ ...item, isRead: true, unreadMessageCount: 0 })),
        );
        setMessageUnreadCount(0);
      }
    } catch {
      // best-effort
    }
  };

  // Determine if user is recruiter
  const isRecruiter = userData?.role === "recruiter";
  const isCandidate = userData?.role === "candidate";
  const homeNavPath = isCandidate ? "/" : "/home";

  // Render authenticated actions - only for candidate role
  const renderAuthenticatedActions = () => {
    const showNotificationIcon = isCandidate || isRecruiter || isAdminUser;
    const showBookmarkIcon = isCandidate && !isAdminUser;

    return (
      <>
        {showBookmarkIcon && (
          <>
            <button
              className="action-icon"
              title="Saved Jobs"
              onClick={handleSavedJobsClick}
            >
              <img src={bookmarkIcon} alt="Bookmark" />
            </button>
          </>
        )}
        {showNotificationIcon && (
          <div className="notification-wrapper" ref={notificationRef}>
            <button
              className="action-icon"
              title="Notifications"
              onClick={toggleNotificationMenu}
            >
              <img src={notificationIcon} alt="Notifications" />
              {unreadNotificationCount > 0 && (
                <span className="notification-badge">
                  {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                </span>
              )}
            </button>
            {isNotificationOpen && (
              <div className="notification-dropdown">
                <div className="notification-dropdown-header">
                  <span>Recent Notifications</span>
                  <button
                    type="button"
                    className="notification-mark-read-btn"
                    onClick={handleMarkAllNotificationsRead}
                    disabled={unreadNotificationCount === 0}
                  >
                    Mark all as read
                  </button>
                </div>
                {notificationLoading && (
                  <div className="notification-dropdown-state">Loading...</div>
                )}
                {!notificationLoading && notificationError && (
                  <div className="notification-dropdown-state error">
                    {notificationError}
                  </div>
                )}
                {!notificationLoading &&
                  !notificationError &&
                  notificationItems.length === 0 && (
                    <div className="notification-dropdown-state">
                      No recent notifications
                    </div>
                  )}
                {!notificationLoading &&
                  !notificationError &&
                  notificationItems.length > 0 && (
                    <ul className="notification-list">
                      {notificationItems.map((item) => (
                        <li
                          key={item.id}
                          className={`notification-item ${
                            item.isRead || isAdminContactViewed(item)
                              ? "read"
                              : "unread"
                          }`}
                          onClick={() => handleNotificationClick(item)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handleNotificationClick(item);
                            }
                          }}
                        >
                          <div className="notification-item-main">
                            <img
                              src={resolveAvatar(item.actor?.profilePicture)}
                              alt={item.actor?.fullName || "User"}
                              className={`notification-item-avatar ${
                                item.actor?.role === "recruiter" ? "recruiter-logo" : ""
                              }`}
                              onError={(e) => {
                                e.currentTarget.src = defaultAvatar;
                              }}
                            />
                            <div className="notification-item-content">
                              <div className="notification-item-top">
                                <span
                                  className={`notification-status-badge ${
                                    item.type === "message_received"
                                      ? "status-message-pill"
                                      : item.type === "contact_message_received"
                                        ? "status-review"
                                      : item.type === "application_status_updated"
                                        ? "status-application"
                                      : item.type === "project_review_received" ||
                                          item.type === "company_review_received"
                                        ? "status-review"
                                      : item.type === "connection_request_accepted"
                                        ? "status-accepted"
                                        : "status-new-request"
                                  }`}
                                >
                                  {item.type === "message_received"
                                    ? "Message"
                                    : item.type === "contact_message_received"
                                      ? "Contact"
                                    : item.type === "application_status_updated"
                                      ? "Application"
                                    : item.type === "project_review_received" ||
                                        item.type === "company_review_received"
                                      ? "Review"
                                    : item.type === "connection_request_accepted"
                                      ? "Accepted"
                                    : "New Request"}
                                </span>
                                <span className="notification-time">
                                  {new Date(
                                    item.updatedAt || item.createdAt
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <p className="notification-message">{item.message}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                <div className="notification-dropdown-footer">
                  <button
                    type="button"
                    className="notification-view-more-btn"
                    onClick={handleNotificationHistoryClick}
                  >
                    View More Notifications
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="user-profile-wrapper" ref={userMenuRef}>
          <div
            className="user-profile"
            onClick={toggleUserMenu}
            style={{ cursor: "pointer" }}
          >
            <div
              className={`avatar-wrapper ${
                isRecruiter ? "recruiter-avatar" : "candidate-avatar"
              }`}
            >
              <img
                src={profileImage}
                alt={userName}
                className="avatar-image"
                onError={(e) => {
                  // If image fails to load, show default avatar
                  e.currentTarget.src = defaultAvatar;
                }}
              />
            </div>
            <span className="user-name">
              {userName}{" "}
              <img
                src={dropdownArrow}
                alt="Menu"
                className={`user-dropdown-arrow ${
                  isUserMenuOpen ? "open" : ""
                }`}
              />
            </span>
          </div>

          {isUserMenuOpen && (
            <div className="user-dropdown">
              <button
                className="user-dropdown-item"
                onClick={handleDashboardClick}
              >
                <img src={dashboardIcon} alt="Dashboard" />
                <span>Dashboard</span>
              </button>
              <button
                className="user-dropdown-item"
                onClick={handleProfileClick}
              >
                <img src={profileIcon} alt="My Profile" />
                <span>My Profile</span>
              </button>
              <button className="user-dropdown-item" onClick={handleLogout}>
                <img src={logoutIcon} alt="Log Out" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderUnauthenticatedActions = () => (
    <>
      <a href="#" className="apply-now-link">
        <img src={applyDot} alt="" className="apply-dot" />
        Apply Now
      </a>
      <Link to="/login" className="btn btn-primary">
        Register/Login
      </Link>
    </>
  );

  // Render mobile authenticated actions with dropdown
  const renderMobileAuthenticatedActions = () => {
    const showNotificationIcon = isCandidate || isRecruiter || isAdminUser;
    const showBookmarkIcon = isCandidate && !isAdminUser;

    return (
      <>
        {showBookmarkIcon && (
          <>
            <li>
              <button
                type="button"
                className="mobile-action-icon"
                onClick={handleSavedJobsClick}
              >
                <img src={bookmarkIcon} alt="Bookmark" />
                Bookmarks
              </button>
            </li>
          </>
        )}
        {showNotificationIcon && (
          <li>
            <button
              type="button"
              className="mobile-action-icon"
              onClick={handleMobileNotificationHistoryClick}
            >
              <img src={notificationIcon} alt="Notifications" />
              Notifications{unreadNotificationCount > 0 ? ` (${unreadNotificationCount})` : ""}
            </button>
          </li>
        )}
        <li>
          <div
            className="mobile-user-profile-wrapper"
            ref={mobileUserDropdownRef}
          >
            <div
              className="mobile-user-profile"
              onClick={toggleMobileUserDropdown}
            >
              <div
                className={`avatar-wrapper ${
                  isRecruiter ? "recruiter-avatar" : "candidate-avatar"
                }`}
              >
                <img
                  src={profileImage}
                  alt={userName}
                  className="avatar-image"
                  onError={(e) => {
                    // If image fails to load, show default avatar
                    e.currentTarget.src = defaultAvatar;
                  }}
                />
              </div>
              <span className="mobile-user-name">
                {userName}{" "}
                <img
                  src={dropdownArrow}
                  alt="Menu"
                  className={`mobile-dropdown-arrow ${
                    isMobileUserDropdownOpen ? "open" : ""
                  }`}
                />
              </span>
            </div>

            {isMobileUserDropdownOpen && (
              <div className="mobile-user-dropdown">
                <button
                  className="mobile-dropdown-item"
                  onClick={() => {
                    handleDashboardClick();
                  }}
                >
                  <img src={dashboardIcon} alt="Dashboard" />
                  <span>Dashboard</span>
                </button>
                <button
                  className="mobile-dropdown-item"
                  onClick={() => {
                    handleProfileClick();
                  }}
                >
                  <img src={profileIcon} alt="My Profile" />
                  <span>My Profile</span>
                </button>
                <button
                  className="mobile-dropdown-item logout"
                  onClick={handleLogout}
                >
                  <img src={logoutIcon} alt="Log Out" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </li>
      </>
    );
  };

  const renderMobileUnauthenticatedActions = () => (
    <>
      <li>
        <a href="#" className="mobile-apply-now" onClick={closeMobileMenu}>
          <img src={applyDot} alt="" className="apply-dot" />
          Apply Now
        </a>
      </li>
      <li>
        <Link
          to="/login"
          className="btn btn-primary mobile-register-btn"
          onClick={closeMobileMenu}
        >
          Register/Login
        </Link>
      </li>
    </>
  );

  return (
    <header className="site-header">
      <div className="container header-container">
        <Link
          to="/"
          className="logo-link"
        >
          <img src={logoImg} alt="HireLink Logo" className="logo-img" />
        </Link>
        <nav className="main-navigation">
          <ul>
            <li>
              <Link to={homeNavPath}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/jobs">
                Browse Jobs
              </Link>
            </li>
            <li>
              <Link to="/employers">
                Employers
              </Link>
            </li>
            <li>
              <Link to="/candidates">
                Candidates
              </Link>
            </li>
            {isCandidate && !isAdminUser && (
              <li>
                <Link to="/assessments">
                  Quiz/Assessment
                </Link>
              </li>
            )}
          </ul>
        </nav>
        <div className="header-actions">
          {isAuthenticated
            ? renderAuthenticatedActions()
            : renderUnauthenticatedActions()}
        </div>
        <button
          className="mobile-nav-toggle"
          aria-label="Toggle navigation"
          onClick={toggleMobileMenu}
        >
          <img src={menuIcon} alt="Menu" className="menu-icon" />
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen ? "active" : ""}`}
        onClick={closeMobileMenu}
      ></div>
      <nav className={`mobile-navigation ${isMobileMenuOpen ? "active" : ""}`}>
        <div className="mobile-menu-header">
          <h3>Menu</h3>
          <button
            className="mobile-menu-close"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        <ul className="mobile-menu-list">
          <li>
            <Link to={homeNavPath} onClick={closeMobileMenu}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/jobs" onClick={closeMobileMenu}>
              Browse Jobs
            </Link>
          </li>
          <li>
            <Link to="/employers" onClick={closeMobileMenu}>
              Employers
            </Link>
          </li>
          <li>
            <Link to="/candidates" onClick={closeMobileMenu}>
              Candidates
            </Link>
          </li>
          {isCandidate && !isAdminUser && (
            <li>
              <Link to="/assessments" onClick={closeMobileMenu}>
                Quiz/Assessment
              </Link>
            </li>
          )}

          {isAuthenticated
            ? renderMobileAuthenticatedActions()
            : renderMobileUnauthenticatedActions()}
        </ul>
      </nav>

      {notificationToasts.length > 0 && (
        <div className="notification-toast-stack">
          {notificationToasts.map((item) => (
            <div
              key={item.id}
              className={`notification-toast ${
                dismissingToastIds.includes(item.id) ? "is-dismissing" : ""
              }`}
              role="button"
              tabIndex={0}
              onClick={() => handleNotificationClick(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleNotificationClick(item);
                }
              }}
            >
              <button
                type="button"
                className="notification-toast-close"
                onClick={(event) => {
                  event.stopPropagation();
                  dismissToast(item.id);
                }}
                aria-label="Close notification"
              >
                ×
              </button>
              <div className="notification-toast-head">
                <img
                  src={resolveAvatar(item.actor?.profilePicture)}
                  alt={item.actor?.fullName || "User"}
                  className={`notification-toast-avatar ${
                    item.actor?.role === "recruiter" ? "recruiter-logo" : ""
                  }`}
                  onError={(e) => {
                    e.currentTarget.src = defaultAvatar;
                  }}
                />
                <span
                  className={`notification-status-badge ${
                    item.type === "application_status_updated"
                      ? "status-application"
                      : item.type === "contact_message_received"
                        ? "status-review"
                      : item.type === "project_review_received" ||
                          item.type === "company_review_received"
                        ? "status-review"
                      : item.type === "connection_request_accepted"
                        ? "status-accepted"
                        : "status-new-request"
                  }`}
                >
                  {item.type === "application_status_updated"
                    ? "Application"
                    : item.type === "contact_message_received"
                      ? "Contact"
                    : item.type === "project_review_received" ||
                        item.type === "company_review_received"
                      ? "Review"
                    : item.type === "connection_request_accepted"
                      ? "Accepted"
                    : "New Request"}
                </span>
              </div>
              <p className="notification-toast-message">{item.message}</p>
            </div>
          ))}
        </div>
      )}
    </header>
  );
};

export default Navbar;


