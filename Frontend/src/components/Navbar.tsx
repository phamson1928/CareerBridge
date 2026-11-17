import React, { useEffect, useRef, useState } from "react";
import { UserRole, Application, Internship } from "../types";
import { useAuth } from "../auth/AuthContext";
import {
  Briefcase,
  GraduationCap,
  Bell,
  MessageSquare,
  FileText,
  User,
  LayoutDashboard,
  CheckSquare,
  Building,
  Users,
  Search,
  CalendarDays,
  LogOut,
  ShieldCheck,
  KeyRound,
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Home,
  Star,
} from "lucide-react";
import { ProfileAvatarPreview } from "./ProfileAvatarUpload";
import {
  ADMIN_PROFILE_UPDATED_EVENT,
  loadAdminProfile,
} from "./AdminView/AdminProfile";
import type { AppNotification } from "../notifications/types";
import type { PlacementRecord } from "../placements/types";

interface NavbarProps {
  currentRole: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadNotifsCount: number;
  unreadMessagesCount: number;
  onOpenNotifs: () => void;
  notifications: AppNotification[];
  onNotificationClick: (notification: AppNotification) => void;
  onOpenChat: () => void;
  onLogout: () => void;
  avatarFileId?: string | null;
  companyLogo?: string | null;
  companyName?: string | null;
  companyVerificationStatus?: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | null;
  lecturerName?: string | null;
  lecturerTitle?: string | null;
  lecturerDepartment?: string | null;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  internships?: Internship[];
  applications?: Application[];
  placements?: PlacementRecord[];
}

interface AdminItemDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  permission?: string;
  superAdminOnly?: boolean;
}

interface AdminGroupDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: AdminItemDef[];
}

type AdminNavEntry =
  | { type: "item"; data: AdminItemDef }
  | { type: "group"; data: AdminGroupDef };

const adminNavStructure: AdminNavEntry[] = [
  {
    type: "item",
    data: {
      id: "stats-dashboard",
      label: "Thống kê hệ thống",
      icon: <LayoutDashboard className="w-4 h-4" />,
      permission: "DASHBOARD",
    },
  },
  {
    type: "group",
    data: {
      id: "training",
      label: "Thực tập & Đào tạo",
      icon: <GraduationCap className="w-4 h-4" />,
      items: [
        {
          id: "placement-management",
          label: "Quản lý thực tập",
          icon: <Briefcase className="w-4 h-4" />,
          permission: "PLACEMENTS",
        },
        {
          id: "teacher-assignment",
          label: "Phân công Giảng viên",
          icon: <GraduationCap className="w-4 h-4" />,
          permission: "PLACEMENTS",
        },
        {
          id: "semester-management",
          label: "Kỳ thực tập",
          icon: <CalendarDays className="w-4 h-4" />,
          permission: "SEMESTERS",
        },
        {
          id: "organization-management",
          label: "Khoa & Ngành",
          icon: <Building className="w-4 h-4" />,
          permission: "SEMESTERS",
        },
      ],
    },
  },
  {
    type: "group",
    data: {
      id: "business",
      label: "Doanh nghiệp",
      icon: <Building className="w-4 h-4" />,
      items: [
        {
          id: "company-approval",
          label: "Duyệt Doanh nghiệp",
          icon: <Building className="w-4 h-4" />,
          permission: "COMPANIES",
        },
        {
          id: "internship-management",
          label: "Tin tuyển dụng",
          icon: <FileText className="w-4 h-4" />,
          permission: "INTERNSHIPS",
        },
        {
          id: "skill-management",
          label: "Danh mục kỹ năng",
          icon: <CheckSquare className="w-4 h-4" />,
          permission: "INTERNSHIPS",
        },
      ],
    },
  },
  {
    type: "group",
    data: {
      id: "system",
      label: "Tài khoản & Hệ thống",
      icon: <Users className="w-4 h-4" />,
      items: [
        {
          id: "user-management",
          label: "Quản lý người dùng",
          icon: <Users className="w-4 h-4" />,
          superAdminOnly: true,
        },
        {
          id: "admin-permissions",
          label: "Phân quyền quản trị",
          icon: <KeyRound className="w-4 h-4" />,
          superAdminOnly: true,
        },
        {
          id: "audit-logs",
          label: "Nhật ký hệ thống",
          icon: <ShieldCheck className="w-4 h-4" />,
          superAdminOnly: true,
        },
      ],
    },
  },
  {
    type: "item",
    data: {
      id: "support-requests",
      label: "Hỗ trợ sinh viên",
      icon: <LifeBuoy className="w-4 h-4" />,
      permission: "SUPPORT",
    },
  },
];

const companyNavStructure: AdminNavEntry[] = [
  {
    type: "item",
    data: {
      id: "dashboard",
      label: "Tổng quan",
      icon: <Home className="w-4 h-4" />,
    },
  },
  {
    type: "item",
    data: {
      id: "postings",
      label: "Tin tuyển dụng",
      icon: <Briefcase className="w-4 h-4" />,
    },
  },
  {
    type: "item",
    data: {
      id: "applicants",
      label: "Ứng viên",
      icon: <Users className="w-4 h-4" />,
    },
  },
  {
    type: "item",
    data: {
      id: "interns-evaluation",
      label: "Thực tập sinh",
      icon: <Star className="w-4 h-4" />,
    },
  },
  {
    type: "item",
    data: {
      id: "company-profile",
      label: "Hồ sơ doanh nghiệp",
      icon: <Building className="w-4 h-4" />,
    },
  },
];

const teacherNavStructure: AdminNavEntry[] = [
  {
    type: "item",
    data: {
      id: "students-list",
      label: "Tổng quan",
      icon: <Home className="w-4 h-4" />,
    },
  },
  {
    type: "item",
    data: {
      id: "supervised-placements",
      label: "Sinh viên hướng dẫn",
      icon: <Users className="w-4 h-4" />,
    },
  },
  {
    type: "item",
    data: {
      id: "review-reports",
      label: "Duyệt báo cáo tuần",
      icon: <CheckSquare className="w-4 h-4" />,
    },
  },
  {
    type: "item",
    data: {
      id: "evaluation-list",
      label: "Đánh giá & Chấm điểm",
      icon: <Star className="w-4 h-4" />,
    },
  },
  {
    type: "item",
    data: {
      id: "lecturer-profile",
      label: "Hồ sơ giảng viên",
      icon: <GraduationCap className="w-4 h-4" />,
    },
  },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  activeTab,
  setActiveTab,
  unreadNotifsCount,
  unreadMessagesCount,
  onOpenNotifs,
  notifications,
  onNotificationClick,
  onOpenChat,
  onLogout,
  avatarFileId,
  companyLogo,
  companyName,
  companyVerificationStatus,
  lecturerName,
  lecturerDepartment,
  isSidebarCollapsed = false,
  onToggleSidebar,
  internships = [],
  applications = [],
  placements = [],
}) => {
  const { user } = useAuth();
  const [isStudentInternshipOpen, setIsStudentInternshipOpen] = useState(false);
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);
  const [isStudentMobileOpen, setIsStudentMobileOpen] = useState(false);
  const studentInternshipDropdownRef = useRef<HTMLDivElement>(null);
  const studentProfileDropdownRef = useRef<HTMLDivElement>(null);
  const studentMobileDropdownRef = useRef<HTMLDivElement>(null);
  const studentMobileDrawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        studentInternshipDropdownRef.current &&
        !studentInternshipDropdownRef.current.contains(target)
      ) {
        setIsStudentInternshipOpen(false);
      }
      if (
        studentProfileDropdownRef.current &&
        !studentProfileDropdownRef.current.contains(target)
      ) {
        setIsStudentProfileOpen(false);
      }
      if (
        studentMobileDropdownRef.current &&
        !studentMobileDropdownRef.current.contains(target) &&
        (!studentMobileDrawerRef.current || !studentMobileDrawerRef.current.contains(target))
      ) {
        setIsStudentMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const profileCloseTimerRef = useRef<number | null>(null);
  const internshipCloseTimerRef = useRef<number | null>(null);

  const handleProfileMouseEnter = () => {
    if (profileCloseTimerRef.current) {
      window.clearTimeout(profileCloseTimerRef.current);
      profileCloseTimerRef.current = null;
    }
    setIsStudentProfileOpen(true);
  };

  const handleProfileMouseLeave = () => {
    if (profileCloseTimerRef.current) {
      window.clearTimeout(profileCloseTimerRef.current);
    }
    profileCloseTimerRef.current = window.setTimeout(() => {
      setIsStudentProfileOpen(false);
    }, 220);
  };

  const handleInternshipMouseEnter = () => {
    if (internshipCloseTimerRef.current) {
      window.clearTimeout(internshipCloseTimerRef.current);
      internshipCloseTimerRef.current = null;
    }
    setIsStudentInternshipOpen(true);
  };

  const handleInternshipMouseLeave = () => {
    if (internshipCloseTimerRef.current) {
      window.clearTimeout(internshipCloseTimerRef.current);
    }
    internshipCloseTimerRef.current = window.setTimeout(() => {
      setIsStudentInternshipOpen(false);
    }, 220);
  };

  const selectStudentTab = (tab: string) => {
    if (profileCloseTimerRef.current) {
      window.clearTimeout(profileCloseTimerRef.current);
      profileCloseTimerRef.current = null;
    }
    if (internshipCloseTimerRef.current) {
      window.clearTimeout(internshipCloseTimerRef.current);
      internshipCloseTimerRef.current = null;
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsStudentInternshipOpen(false);
    setIsStudentProfileOpen(false);
    setIsStudentMobileOpen(false);
  };

  useEffect(() => {
    return () => {
      if (profileCloseTimerRef.current) window.clearTimeout(profileCloseTimerRef.current);
      if (internshipCloseTimerRef.current) window.clearTimeout(internshipCloseTimerRef.current);
    };
  }, []);

  const [adminSearch, setAdminSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [adminProfile, setAdminProfile] = useState(() =>
    loadAdminProfile(user?.id, user?.email, user?.isSuperAdmin),
  );

  useEffect(() => {
    const syncProfile = () => {
      setAdminProfile(loadAdminProfile(user?.id, user?.email, user?.isSuperAdmin));
    };
    syncProfile();
    window.addEventListener(ADMIN_PROFILE_UPDATED_EVENT, syncProfile);
    return () => window.removeEventListener(ADMIN_PROFILE_UPDATED_EVENT, syncProfile);
  }, [user?.id, user?.email, user?.isSuperAdmin]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {
      "company-recruitment": true,
      "company-interns": true,
    };
    for (const entry of adminNavStructure) {
      if (entry.type === "group") {
        initial[entry.data.id] = entry.data.items.some((i) => i.id === activeTab);
      }
    }
    return initial;
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  useEffect(() => {
    if (currentRole === "ADMIN" || currentRole === "COMPANY" || currentRole === "TEACHER") {
      const sourceStructure =
        currentRole === "COMPANY"
          ? companyNavStructure
          : currentRole === "TEACHER"
            ? teacherNavStructure
            : adminNavStructure;
      for (const entry of sourceStructure) {
        if (entry.type === "group" && entry.data.items.some((i) => i.id === activeTab)) {
          setOpenGroups((prev) =>
            prev[entry.data.id] ? prev : { ...prev, [entry.data.id]: true },
          );
          break;
        }
      }
    }
  }, [activeTab, currentRole]);
  const getNavItems = () => {
    switch (currentRole) {
      case "STUDENT":
        return [
          {
            id: "internships",
            label: "Cơ hội thực tập",
            icon: <Search className="w-4 h-4" />,
          },
          {
            id: "applications",
            label: "Đơn ứng tuyển",
            icon: <FileText className="w-4 h-4" />,
          },
          {
            id: "placement",
            label: "Hồ sơ thực tập",
            icon: <Briefcase className="w-4 h-4" />,
          },
          {
            id: "reports",
            label: "Báo cáo tuần",
            icon: <CheckSquare className="w-4 h-4" />,
          },
          {
            id: "evaluations",
            label: "Kết quả đánh giá",
            icon: <GraduationCap className="w-4 h-4" />,
          },
          {
            id: "support",
            label: "Hỗ trợ",
            icon: <LifeBuoy className="w-4 h-4" />,
          },
          {
            id: "profile",
            label: "Hồ sơ cá nhân",
            icon: <User className="w-4 h-4" />,
          },
        ];
      case "COMPANY": {
        if (companyVerificationStatus !== "APPROVED") {
          return [
            {
              id: "dashboard",
              label: "Tổng quan",
              icon: <LayoutDashboard className="w-4 h-4" />,
            },
            {
              id: "company-profile",
              label: "Đăng ký doanh nghiệp",
              icon: <Building className="w-4 h-4" />,
            },
          ];
        }
        return [
          {
            id: "dashboard",
            label: "Tổng quan",
            icon: <LayoutDashboard className="w-4 h-4" />,
          },
          {
            id: "postings",
            label: "Tin tuyển dụng",
            icon: <Briefcase className="w-4 h-4" />,
          },
          {
            id: "applicants",
            label: "Ứng viên & CV",
            icon: <Users className="w-4 h-4" />,
          },
          {
            id: "interns-evaluation",
            label: "Đánh giá thực tập",
            icon: <CheckSquare className="w-4 h-4" />,
          },
          {
            id: "company-profile",
            label: "Hồ sơ công ty",
            icon: <Building className="w-4 h-4" />,
          },
        ];
      }
      case "TEACHER":
        return [
          {
            id: "students-list",
            label: "Tổng quan",
            icon: <Users className="w-4 h-4" />,
          },
          {
            id: "supervised-placements",
            label: "Sinh viên hướng dẫn",
            icon: <Briefcase className="w-4 h-4" />,
          },
          {
            id: "review-reports",
            label: "Duyệt báo cáo tuần",
            icon: <CheckSquare className="w-4 h-4" />,
          },
          {
            id: "evaluation-list",
            label: "Đánh giá & Chấm điểm",
            icon: <GraduationCap className="w-4 h-4" />,
          },
          {
            id: "lecturer-profile",
            label: "Hồ sơ giảng viên",
            icon: <User className="w-4 h-4" />,
          },
        ];
      case "ADMIN": {
        const items: AdminItemDef[] = [];
        for (const entry of adminNavStructure) {
          if (entry.type === "item") {
            items.push(entry.data);
          } else {
            items.push(...entry.data.items);
          }
        }
        if (user?.isSuperAdmin) {
          return items;
        }
        const userPerms = user?.permissions || [];
        return items.filter((item) => {
          if (item.superAdminOnly) return false;
          if (item.permission) return userPerms.includes(item.permission);
          return true;
        });
      }
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const canUseChat =
    currentRole === "STUDENT" ||
    currentRole === "COMPANY" ||
    currentRole === "TEACHER";
  const showLogoutInNavbar = currentRole !== "ADMIN";
  const showNotificationPreview =
    currentRole === "STUDENT" ||
    currentRole === "COMPANY" ||
    currentRole === "TEACHER" ||
    currentRole === "ADMIN";
  const unreadNotifications = notifications
    .filter((notification) => !notification.isRead)
    .slice(0, 4);

  const notificationPreview = showNotificationPreview ? (
    <div
      className="invisible absolute right-0 top-full z-50 pt-2 w-[min(23rem,calc(100vw-2rem))] origin-top-right opacity-0 translate-y-1.5 scale-[0.98] pointer-events-none transition-all duration-200 ease-out before:absolute before:-top-3 before:inset-x-0 before:h-3 before:content-[''] group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-hover:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:pointer-events-auto"
      role="dialog"
      aria-label="Xem nhanh thông báo"
    >
      <div className="notification-hover-card origin-top-right rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xl shadow-teal-950/15">
        <div className="flex items-center justify-between px-3 py-2">
          <div>
            <p className="text-sm font-bold text-slate-800">Thông báo</p>
            <p className="text-[11px] text-slate-500">
              {unreadNotifsCount
                ? `${unreadNotifsCount} chưa đọc`
                : "Bạn đã cập nhật đầy đủ"}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenNotifs}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
          >
            Xem tất cả
          </button>
        </div>
        <div className="max-h-80 space-y-1 overflow-x-hidden overflow-y-auto no-scrollbar pt-1">
          {unreadNotifications.length ? (
            unreadNotifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => onNotificationClick(notification)}
                className={`w-full overflow-hidden rounded-xl px-3 py-2.5 text-left transition hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none cursor-pointer ${notification.isRead ? "" : "bg-indigo-50/60"}`}
              >
                <div className="flex min-w-0 items-start gap-2">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${notification.isRead ? "bg-slate-300" : "bg-indigo-600"}`}
                  />
                  <span className="min-w-0 flex-1 overflow-hidden">
                    <span className="block truncate text-xs font-bold text-slate-800">
                      {notification.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] leading-4 text-slate-500">
                      {notification.content}
                    </span>
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="px-3 py-8 text-center text-xs text-slate-500">
              Bạn đã đọc hết thông báo
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  if (currentRole === "ADMIN" || currentRole === "COMPANY" || currentRole === "TEACHER") {
    const isCompany = currentRole === "COMPANY";
    const isTeacher = currentRole === "TEACHER";
    const isWorkspaceSidebar = isCompany || isTeacher;
    const labelTransitionClass = `whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out ${isSidebarCollapsed
      ? "max-w-0 opacity-0 pointer-events-none -translate-x-1"
      : "max-w-[170px] opacity-100 translate-x-0"
      }`;

    const filterAdminItem = (item: AdminItemDef) => {
      if (user?.isSuperAdmin) return true;
      if (item.superAdminOnly) return false;
      if (item.permission) {
        const userPerms = user?.permissions || [];
        return userPerms.includes(item.permission);
      }
      return true;
    };

    const visibleEntries: AdminNavEntry[] = isCompany
      ? companyVerificationStatus === "APPROVED"
        ? companyNavStructure
        : [
          {
            type: "item",
            data: {
              id: "company-profile",
              label: "Đăng ký doanh nghiệp",
              icon: <Building className="w-4 h-4" />,
            },
          },
        ]
      : isTeacher
        ? teacherNavStructure
        : (adminNavStructure
          .map((entry) => {
            if (entry.type === "item") {
              return filterAdminItem(entry.data) ? entry : null;
            }
            const visibleSub = entry.data.items.filter(filterAdminItem);
            if (visibleSub.length === 0) return null;
            return {
              type: "group" as const,
              data: {
                ...entry.data,
                items: visibleSub,
              },
            };
          })
          .filter(Boolean) as AdminNavEntry[]);

    const searchableItems: { id: string; label: string; groupLabel: string; icon: React.ReactNode }[] = [];
    for (const entry of visibleEntries) {
      if (entry.type === "item") {
        searchableItems.push({
          id: entry.data.id,
          label: entry.data.label,
          groupLabel: isCompany
            ? entry.data.id === "company-profile"
              ? "Thông tin & Pháp lý"
              : "Tổng quan & Vận hành"
            : isTeacher
              ? entry.data.id === "lecturer-profile"
                ? "Hồ sơ học thuật"
                : "Hướng dẫn thực tập"
              : "Tổng quan & Vận hành",
          icon: entry.data.icon,
        });
      } else {
        for (const sub of entry.data.items) {
          searchableItems.push({
            id: sub.id,
            label: sub.label,
            groupLabel: entry.data.label,
            icon: sub.icon,
          });
        }
      }
    }
    if (!isCompany && !isTeacher) {
      searchableItems.push({
        id: "admin-profile",
        label: "Hồ sơ cá nhân",
        groupLabel: "Tài khoản quản trị",
        icon: <User className="w-4 h-4" />,
      });
    }

    const activeModule =
      searchableItems.find((item) => item.id === activeTab) ||
      searchableItems[0] || {
        id: isCompany ? "dashboard" : isTeacher ? "students-list" : "stats-dashboard",
        label: isCompany
          ? "Thống kê tuyển dụng"
          : isTeacher
            ? "Tổng quan hướng dẫn"
            : "Thống kê hệ thống",
        groupLabel: isTeacher ? "Hướng dẫn thực tập" : "Tổng quan & Vận hành",
        icon: <LayoutDashboard className="w-4 h-4" />,
      };

    const q = adminSearch.trim().toLowerCase();
    const matchingPages = q
      ? searchableItems.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.groupLabel.toLowerCase().includes(q),
      )
      : searchableItems;
    const filteredSearchItems = matchingPages;

    const matchingJobs = q && isCompany && internships
      ? internships.filter((j) => {
        const title = (j.title || "").toLowerCase();
        const dept = (j.department || "").toLowerCase();
        const loc = (j.location || "").toLowerCase();
        const reqs = (j.requirements || []).join(" ").toLowerCase();
        const skills = (j.requiredSkills || []).join(" ").toLowerCase();
        return (
          title.includes(q) ||
          dept.includes(q) ||
          loc.includes(q) ||
          reqs.includes(q) ||
          skills.includes(q)
        );
      })
      : [];

    const matchingApplicants = q && isCompany && applications
      ? applications.filter((app) => {
        const name = (app.studentName || "").toLowerCase();
        const title = (app.internshipTitle || "").toLowerCase();
        const major = (app.studentMajor || "").toLowerCase();
        const skills = (app.studentSkills || []).join(" ").toLowerCase();
        return (
          name.includes(q) ||
          title.includes(q) ||
          major.includes(q) ||
          skills.includes(q)
        );
      })
      : [];

    const matchingStudents = q && isTeacher && placements
      ? placements.filter((pl) => {
        const name = (pl.student?.fullName || "").toLowerCase();
        const code = (pl.student?.studentCode || "").toLowerCase();
        const major = (pl.student?.major || "").toLowerCase();
        const comp = (pl.company?.companyName || "").toLowerCase();
        const job = (pl.internship?.title || "").toLowerCase();
        return (
          name.includes(q) ||
          code.includes(q) ||
          major.includes(q) ||
          comp.includes(q) ||
          job.includes(q)
        );
      })
      : [];

    const totalSearchResultsCount =
      matchingPages.length +
      matchingJobs.length +
      matchingApplicants.length +
      matchingStudents.length;

    const profileTabId = isCompany
      ? "company-profile"
      : isTeacher
        ? "lecturer-profile"
        : "admin-profile";
    const displayFullName = isCompany
      ? companyName || user?.email?.split("@")[0] || "Doanh nghiệp đối tác"
      : isTeacher
        ? lecturerName || user?.email?.split("@")[0] || "Giảng viên hướng dẫn"
        : adminProfile.fullName;
    const displaySubtitle = isCompany
      ? user?.email || "Tài khoản doanh nghiệp"
      : isTeacher
        ? lecturerDepartment || user?.email || "Giảng viên hướng dẫn"
        : adminProfile.title || user?.email;
    const avatarInitial = isCompany
      ? displayFullName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join("") || "DN"
      : isTeacher
        ? (lecturerName || user?.email || "GV")
          .split(/\s+/)
          .filter(Boolean)
          .slice(-2)
          .map((w) => w.charAt(0).toUpperCase())
          .join("") || "GV"
        : (
          displayFullName?.charAt(0) ||
          user?.email?.charAt(0) ||
          "A"
        ).toUpperCase();
    const resolvedAvatarId = isCompany || isTeacher ? avatarFileId : adminProfile.avatarFileId || avatarFileId;

    return (
      <>
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-20 flex-col border-r border-slate-200/80 ${isWorkspaceSidebar ? "bg-[#f8fafd]" : "bg-white"
            } text-slate-700 shadow-[2px_0_12px_rgba(0,0,0,0.03)] transition-[width] duration-200 ease-in-out ${isSidebarCollapsed ? "lg:w-20" : "lg:w-[240px]"
            }`}
        >
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              title={
                isSidebarCollapsed
                  ? "Mở rộng thanh điều hướng"
                  : "Thu gọn thanh điều hướng"
              }
              aria-label={
                isSidebarCollapsed
                  ? "Mở rộng thanh điều hướng"
                  : "Thu gọn thanh điều hướng"
              }
              className="absolute -right-3 top-[18px] z-50 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:scale-110 hover:text-[#038b95] hover:bg-slate-50 lg:flex cursor-pointer"
            >
              <ChevronLeft
                className={`h-3.5 w-3.5 transition-transform duration-200 ease-out ${isSidebarCollapsed ? "rotate-180" : "rotate-0"
                  }`}
              />
            </button>
          )}

          <div className="flex h-full w-full flex-col overflow-hidden">
            <button
              type="button"
              onClick={() => setActiveTab(navItems[0]?.id || "")}
              className="flex h-[64px] items-center justify-start gap-2.5 overflow-hidden border-b border-slate-100 px-3.5 text-left cursor-pointer shrink-0"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 border border-slate-100 p-1 shadow-2xs">
                <img
                  src="/careerbridge-logo.svg"
                  alt="CareerBridge"
                  className="h-full w-full -translate-x-[14%] scale-[1.35] object-contain"
                />
              </span>
              <span className={labelTransitionClass}>
                <span className="block text-sm font-black tracking-tight text-slate-900">
                  CareerBridge
                </span>
                <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {isCompany
                    ? companyVerificationStatus === "APPROVED"
                      ? "Đối tác Doanh nghiệp"
                      : "Cổng Doanh nghiệp"
                    : isTeacher
                      ? "Giảng viên hướng dẫn"
                      : user?.isSuperAdmin
                        ? "Quản trị tối cao"
                        : "Ban quản trị phân hệ"}
                </span>
              </span>
            </button>
            <div
              className={`overflow-hidden whitespace-nowrap px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 transition-all duration-200 ease-in-out ${isSidebarCollapsed
                ? "max-h-0 pt-0 opacity-0 pointer-events-none"
                : "max-h-8 pt-3 pb-1 opacity-100"
                }`}
            >
              Điều hướng
            </div>
            <nav className="mt-1 flex-1 space-y-0.5 overflow-x-hidden overflow-y-auto px-2.5 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {visibleEntries.map((entry) => {
                if (entry.type === "item") {
                  const item = entry.data;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-tab-${item.id}`}
                      title={item.label}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex w-full items-center justify-start gap-2.5 overflow-hidden rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-colors duration-150 cursor-pointer ${isActive
                        ? "bg-[#e0f4f6] text-[#038b95] shadow-xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                      <span className={`flex h-4 w-5 shrink-0 items-center justify-center ${isActive ? "text-[#038b95]" : "text-slate-400"}`}>
                        {item.icon}
                      </span>
                      <span className={labelTransitionClass}>{item.label}</span>
                    </button>
                  );
                }

                const group = entry.data;
                const isOpen = !!openGroups[group.id];
                const hasActiveChild = group.items.some((i) => i.id === activeTab);

                return (
                  <div key={group.id} className="space-y-0.5">
                    <button
                      type="button"
                      title={group.label}
                      onClick={() => {
                        if (isSidebarCollapsed && onToggleSidebar) {
                          onToggleSidebar();
                        }
                        toggleGroup(group.id);
                      }}
                      className={`flex w-full items-center justify-between gap-1.5 overflow-hidden rounded-xl px-2.5 py-2 text-left text-xs font-bold transition-colors duration-150 cursor-pointer ${!isOpen && hasActiveChild
                        ? "bg-[#e0f4f6] text-[#038b95]"
                        : isOpen
                          ? "text-slate-900 bg-slate-50/70"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={`flex h-4 w-5 shrink-0 items-center justify-center ${hasActiveChild ? "text-[#038b95]" : "text-slate-400"}`}>
                          {group.icon}
                        </span>
                        <span className={labelTransitionClass}>{group.label}</span>
                      </div>
                      <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-all duration-200 ml-1 ${isOpen ? "rotate-180 text-slate-600" : ""
                          } ${isSidebarCollapsed
                            ? "opacity-0 w-0 pointer-events-none overflow-hidden"
                            : "opacity-100 w-3.5"
                          }`}
                      />
                    </button>

                    {isOpen && (
                      <div
                        className={`space-y-0.5 overflow-hidden transition-[max-height,opacity] duration-200 ease-out ${isSidebarCollapsed
                          ? "max-h-0 opacity-0 pointer-events-none"
                          : "max-h-96 opacity-100"
                          }`}
                      >
                        {group.items.map((subItem) => {
                          const isSubActive = activeTab === subItem.id;
                          return (
                            <button
                              key={subItem.id}
                              id={`nav-tab-${subItem.id}`}
                              title={subItem.label}
                              onClick={() => setActiveTab(subItem.id)}
                              className={`flex w-full items-center justify-start gap-2 overflow-hidden rounded-xl pl-7 pr-3 py-1.5 text-left text-xs font-semibold transition-colors duration-150 cursor-pointer ${isSubActive
                                ? "bg-[#e0f4f6] text-[#038b95] shadow-xs"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                            >
                              <span className={`flex h-4 w-4 shrink-0 items-center justify-center ${isSubActive ? "text-[#038b95]" : "text-slate-400"}`}>
                                {subItem.icon}
                              </span>
                              <span className="truncate">{subItem.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Bottom Identity Card (Company & Lecturer) */}
            {(isCompany || isTeacher) && (
              <div className="shrink-0 border-t border-slate-100 p-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab(isCompany ? "company-profile" : "lecturer-profile")}
                  title={`${displayFullName} — Nhấp để xem ${isCompany ? "Hồ sơ doanh nghiệp" : "Hồ sơ giảng viên"}`}
                  className={`flex w-full items-center gap-2.5 overflow-hidden rounded-xl border border-[#b8e6ea] bg-[#e0f4f6]/85 p-2 text-left transition hover:bg-[#cdeff2] cursor-pointer ${isSidebarCollapsed ? "justify-center px-1.5" : ""
                    }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#038b95] text-white shadow-2xs">
                    {isCompany ? (
                      companyLogo ? (
                        <img
                          src={companyLogo}
                          alt={displayFullName}
                          className="h-full w-full object-cover bg-white"
                        />
                      ) : (
                        <Building className="h-4 w-4" />
                      )
                    ) : (
                      <ProfileAvatarPreview
                        fileId={resolvedAvatarId}
                        fallback={avatarInitial}
                        className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-[#038b95] text-xs font-extrabold text-white"
                        imageClassName="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className={`min-w-0 flex-1 ${labelTransitionClass}`}>
                    <p className="truncate text-xs font-extrabold text-slate-800">
                      {displayFullName}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-[10px] font-semibold text-[#038b95]">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${isCompany
                          ? companyVerificationStatus === "APPROVED"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                          : "bg-emerald-500"
                          }`}
                      />
                      <span className="truncate">
                        {isCompany
                          ? companyVerificationStatus === "APPROVED"
                            ? "Doanh nghiệp"
                            : "Chờ xác minh"
                          : lecturerDepartment || "Giảng viên hướng dẫn"}
                      </span>
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Cohesive Modern Dashboard Top Header Bar */}
        <header className={`sticky top-0 z-40 flex h-[64px] w-full items-center justify-between gap-4 border-b border-slate-200/80 ${isWorkspaceSidebar ? "bg-[#f8fafd]" : "bg-white"
          } px-4 shadow-[0_2px_12px_rgba(15,23,42,0.03)] sm:px-6 lg:px-7`}>
          {/* Left Section: For Company & Lecturer -> Clean Search Bar on the left; For Admin -> Active Module Badge */}
          {isWorkspaceSidebar ? (
            <div className="group relative flex-1 max-w-md">
              <div className="relative flex items-center">
                <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={adminSearch}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setIsSearchFocused(false), 200);
                  }}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (matchingJobs.length > 0) {
                        setActiveTab("postings");
                        setAdminSearch("");
                        setIsSearchFocused(false);
                      } else if (matchingApplicants.length > 0) {
                        setActiveTab("applicants");
                        setAdminSearch("");
                        setIsSearchFocused(false);
                      } else if (matchingStudents.length > 0) {
                        setActiveTab("supervised-placements");
                        setAdminSearch("");
                        setIsSearchFocused(false);
                      } else if (matchingPages.length > 0) {
                        setActiveTab(matchingPages[0].id);
                        setAdminSearch("");
                        setIsSearchFocused(false);
                      }
                    } else if (e.key === "Escape") {
                      setIsSearchFocused(false);
                    }
                  }}
                  placeholder={
                    isCompany
                      ? "Tìm kiếm chức năng, tin tuyển dụng, ứng viên..."
                      : "Tìm kiếm chức năng, sinh viên hướng dẫn, doanh nghiệp..."
                  }
                  className="h-10 w-full rounded-full border border-slate-200/90 bg-slate-100/80 pl-10 pr-9 text-xs font-medium text-slate-700 placeholder:text-slate-400 transition-all hover:border-slate-300 hover:bg-slate-100 focus:border-[#038b95] focus:bg-white focus:ring-3 focus:ring-[#038b95]/12 focus:outline-none"
                />
                {adminSearch && (
                  <button
                    type="button"
                    onClick={() => setAdminSearch("")}
                    className="absolute right-3 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Search Dropdown */}
              <div
                className={`absolute left-0 top-full z-50 pt-2 w-80 sm:w-[440px] origin-top-left transition-all duration-200 ease-out ${isSearchFocused
                  ? "visible opacity-100 translate-y-0 scale-100 pointer-events-auto"
                  : "invisible opacity-0 translate-y-1.5 scale-[0.98] pointer-events-none"
                  }`}
              >
                <div className="max-h-96 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xl">
                  <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>{q ? "Kết quả tìm kiếm" : "Đi tới nhanh"}</span>
                    <span>{totalSearchResultsCount} mục</span>
                  </div>

                  {totalSearchResultsCount === 0 ? (
                    <div className="px-3 py-8 text-center text-xs text-slate-400">
                      {isCompany
                        ? "Không tìm thấy chức năng, tin tuyển dụng hoặc ứng viên phù hợp"
                        : "Không tìm thấy chức năng hoặc sinh viên hướng dẫn phù hợp"}
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      {/* Section: Sinh viên hướng dẫn (Lecturer) */}
                      {matchingStudents.length > 0 && (
                        <div>
                          <div className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#038b95] flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5" />
                              <span>Sinh viên hướng dẫn ({matchingStudents.length})</span>
                            </span>
                          </div>
                          <div className="space-y-1 mt-1">
                            {matchingStudents.slice(0, 5).map((pl) => (
                              <button
                                key={pl.id}
                                type="button"
                                onMouseDown={() => {
                                  setActiveTab("supervised-placements");
                                  setAdminSearch("");
                                  setIsSearchFocused(false);
                                }}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer hover:bg-slate-50 group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e0f4f6] text-[#038b95]">
                                    <GraduationCap className="w-3.5 h-3.5" />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-800 truncate group-hover:text-[#038b95]">
                                      {pl.student?.fullName} ({pl.student?.studentCode})
                                    </p>
                                    <p className="text-[11px] text-slate-400 truncate">
                                      {pl.company?.companyName} • {pl.internship?.title}
                                    </p>
                                  </div>
                                </div>
                                <span className="ml-2 shrink-0 rounded-full bg-[#e0f4f6] text-[#038b95] px-2 py-0.5 text-[10px] font-semibold">
                                  Theo dõi
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section 1: Tin tuyển dụng */}
                      {matchingJobs.length > 0 && (
                        <div>
                          <div className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#038b95] flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Briefcase className="h-3.5 w-3.5" />
                              <span>Tin tuyển dụng ({matchingJobs.length})</span>
                            </span>
                          </div>
                          <div className="space-y-1 mt-1">
                            {matchingJobs.slice(0, 5).map((job) => (
                              <button
                                key={job.id}
                                type="button"
                                onMouseDown={() => {
                                  setActiveTab("postings");
                                  setAdminSearch("");
                                  setIsSearchFocused(false);
                                }}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer hover:bg-slate-50 group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e0f4f6] text-[#038b95]">
                                    <Briefcase className="w-3.5 h-3.5" />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-800 truncate group-hover:text-[#038b95]">
                                      {job.title}
                                    </p>
                                    <p className="text-[11px] text-slate-400 truncate">
                                      {job.location || "Hồ Chí Minh"} • {job.stipend || "Thỏa thuận"}
                                    </p>
                                  </div>
                                </div>
                                <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                  Xem tin
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section 2: Ứng viên */}
                      {matchingApplicants.length > 0 && (
                        <div>
                          <div className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#038b95] flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5" />
                              <span>Ứng viên ({matchingApplicants.length})</span>
                            </span>
                          </div>
                          <div className="space-y-1 mt-1">
                            {matchingApplicants.slice(0, 5).map((app) => (
                              <button
                                key={app.id}
                                type="button"
                                onMouseDown={() => {
                                  setActiveTab("applicants");
                                  setAdminSearch("");
                                  setIsSearchFocused(false);
                                }}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer hover:bg-slate-50 group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                    <Users className="w-3.5 h-3.5" />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-800 truncate group-hover:text-[#038b95]">
                                      {app.studentName}
                                    </p>
                                    <p className="text-[11px] text-slate-400 truncate">
                                      {app.internshipTitle ? `Vị trí: ${app.internshipTitle}` : app.studentMajor}
                                    </p>
                                  </div>
                                </div>
                                <span className="ml-2 shrink-0 rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-semibold">
                                  Hồ sơ
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section 3: Chức năng / Phân hệ */}
                      {matchingPages.length > 0 && (
                        <div>
                          <div className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                            <span>Chức năng ({matchingPages.length})</span>
                          </div>
                          <div className="space-y-0.5 mt-1">
                            {matchingPages.map((item) => {
                              const isCurrentTab = activeTab === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onMouseDown={() => {
                                    setActiveTab(item.id);
                                    setAdminSearch("");
                                    setIsSearchFocused(false);
                                  }}
                                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${isCurrentTab
                                    ? "bg-[#e0f4f6] font-bold text-[#038b95]"
                                    : "font-medium text-slate-700 hover:bg-slate-50"
                                    }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${isCurrentTab
                                        ? "bg-[#038b95] text-white"
                                        : "bg-[#e0f4f6]/70 text-[#038b95]"
                                        }`}
                                    >
                                      {item.icon}
                                    </span>
                                    <span className="truncate">{item.label}</span>
                                  </div>
                                  <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                    {item.groupLabel}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#a5dfe4] bg-[#e0f4f6]/70 text-[#038b95] shadow-xs">
                {activeModule.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400 truncate leading-tight">
                  {activeModule.groupLabel}
                </p>
                <h2 className="text-base font-extrabold text-slate-800 tracking-tight truncate leading-snug">
                  {activeModule.label}
                </h2>
              </div>
            </div>
          )}

          {/* Right Cluster: Search Pill (Admin only) + Chat + Notifications + Account Capsule */}
          <div className="flex items-center gap-3">
            {/* Sleek Search Pill for Admin */}
            {!isWorkspaceSidebar && (
              <div className="group relative hidden md:block w-64 lg:w-80">
                <div className="relative flex items-center">
                  <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#038b95]" />
                  <input
                    type="text"
                    value={adminSearch}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => {
                      setTimeout(() => setIsSearchFocused(false), 200);
                    }}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && filteredSearchItems.length > 0) {
                        setActiveTab(filteredSearchItems[0].id);
                        setAdminSearch("");
                        setIsSearchFocused(false);
                      } else if (e.key === "Escape") {
                        setIsSearchFocused(false);
                      }
                    }}
                    placeholder="Tìm nhanh chức năng quản trị..."
                    className="h-10 w-full rounded-full border border-[#a5dfe4] bg-[#f0f9fa] pl-10 pr-10 text-xs font-medium text-slate-700 placeholder:text-slate-400 transition-all hover:border-[#9bd8d9] hover:bg-white focus:border-[#038b95] focus:bg-white focus:ring-3 focus:ring-[#038b95]/12 focus:outline-none"
                  />
                  {adminSearch ? (
                    <button
                      type="button"
                      onClick={() => setAdminSearch("")}
                      className="absolute right-3 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      ×
                    </button>
                  ) : (
                    <span className="pointer-events-none absolute right-3 rounded-md border border-[#a5dfe4] bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#038b95]/70">
                      /
                    </span>
                  )}
                </div>

                {/* Seamless Search Dropdown (Smooth float transition, 0 gap) */}
                <div
                  className={`absolute right-0 top-full z-50 pt-2 w-88 origin-top-right transition-all duration-200 ease-out before:absolute before:-top-3 before:inset-x-0 before:h-3 before:content-[''] ${isSearchFocused
                    ? "visible opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "invisible opacity-0 translate-y-1.5 scale-[0.98] pointer-events-none group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-hover:pointer-events-auto"
                    }`}
                >
                  <div className="max-h-72 overflow-y-auto rounded-2xl border border-[#a5dfe4] bg-white p-2 shadow-2xl shadow-teal-950/12 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span>{q ? "Kết quả tìm kiếm" : "Chuyển nhanh phân hệ"}</span>
                      <span>{filteredSearchItems.length} mục</span>
                    </div>
                    {filteredSearchItems.length === 0 ? (
                      <div className="px-3 py-6 text-center text-xs text-slate-400">
                        Không tìm thấy chức năng phù hợp
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {filteredSearchItems.map((item) => {
                          const isCurrentTab = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onMouseDown={() => {
                                setActiveTab(item.id);
                                setAdminSearch("");
                                setIsSearchFocused(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${isCurrentTab
                                ? "bg-[#e0f4f6] font-bold text-[#038b95]"
                                : "font-medium text-slate-700 hover:bg-[#f0f9fa]"
                                }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${isCurrentTab
                                    ? "bg-[#038b95] text-white"
                                    : "bg-[#e0f4f6]/70 text-[#038b95]"
                                    }`}
                                >
                                  {item.icon}
                                </span>
                                <span className="truncate">{item.label}</span>
                              </div>
                              <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                {item.groupLabel}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Chat Circle (For Company role) */}
            {canUseChat && (
              <button
                id="btn-chat-toggle"
                type="button"
                onClick={onOpenChat}
                title="Tin nhắn & Trao đổi"
                aria-label="Tin nhắn & Trao đổi"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#a5dfe4] bg-[#f0f9fa] text-[#038b95] transition-all hover:border-[#038b95] hover:bg-white hover:shadow-xs cursor-pointer"
              >
                <MessageSquare className="h-4.5 w-4.5" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#038b95] px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadMessagesCount}
                  </span>
                )}
              </button>
            )}

            {/* Notification Bell Circle (Hover to preview, Click to open full drawer) */}
            <div className="group relative notification-trigger">
              <button
                id="btn-notifs-toggle"
                type="button"
                onClick={onOpenNotifs}
                title="Thông báo"
                aria-label="Thông báo"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#a5dfe4] bg-[#f0f9fa] text-[#038b95] transition-all hover:border-[#038b95] hover:bg-white hover:shadow-xs cursor-pointer"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#da1c2d] px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>
              {notificationPreview}
            </div>

            {/* Unified Account & Avatar Capsule (Click avatar to open Profile, Hover/Chevron to open Menu) */}
            <div className="group relative">
              <div
                className={`flex items-center gap-2 rounded-full border py-1 pl-1.5 pr-2.5 text-left transition-all ${activeTab === profileTabId
                  ? "border-[#038b95] bg-[#e0f4f6]/70 ring-2 ring-[#038b95]/20"
                  : isProfileOpen
                    ? "border-[#038b95] bg-white ring-3 ring-[#038b95]/12"
                    : "border-[#a5dfe4] bg-[#f0f9fa] hover:border-[#038b95]/60 hover:bg-white hover:shadow-xs group-hover:border-[#038b95]/60 group-hover:bg-white"
                  }`}
              >
                {/* Clicking Avatar or Name navigates directly to Hồ sơ */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(profileTabId);
                    setIsProfileOpen(false);
                  }}
                  className="flex items-center gap-2.5 text-left cursor-pointer focus:outline-none"
                  title={
                    isCompany
                      ? "Nhấp để xem Hồ sơ doanh nghiệp"
                      : isTeacher
                        ? "Nhấp để xem Hồ sơ giảng viên"
                        : "Nhấp để xem Hồ sơ cá nhân"
                  }
                >
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#038b95] to-[#025c63] text-xs font-black text-white shadow-xs transition-transform hover:scale-105">
                    {isCompany && companyLogo ? (
                      <img
                        src={companyLogo}
                        alt={displayFullName}
                        className="h-full w-full rounded-full object-cover bg-white"
                      />
                    ) : (
                      <ProfileAvatarPreview
                        fileId={resolvedAvatarId}
                        fallback={avatarInitial}
                        className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#038b95] to-[#025c63] text-white"
                        imageClassName="h-full w-full object-cover"
                      />
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div className="hidden sm:block max-w-[170px]">
                    <p className="truncate text-xs font-extrabold leading-tight text-slate-800 hover:text-[#038b95] transition-colors">
                      {displayFullName}
                    </p>
                    <p className="truncate text-[10px] font-medium leading-tight text-slate-500">
                      {displaySubtitle}
                    </p>
                  </div>
                </button>

                {/* Dropdown toggle chevron */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileOpen((prev) => !prev);
                  }}
                  title="Tùy chọn tài khoản"
                  aria-label="Tùy chọn tài khoản"
                  className="hidden sm:flex h-5 w-5 items-center justify-center text-slate-400 hover:text-[#038b95] transition-colors cursor-pointer"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${isProfileOpen ? "rotate-180 text-[#038b95]" : "group-hover:rotate-180"
                      }`}
                  />
                </button>
              </div>

              {/* Account Dropdown Menu (Smooth float transition, 0 gap) */}
              <div
                className={`absolute right-0 top-full z-50 pt-2 w-68 origin-top-right transition-all duration-200 ease-out before:absolute before:-top-3 before:inset-x-0 before:h-3 before:content-[''] ${isProfileOpen
                  ? "visible opacity-100 translate-y-0 scale-100 pointer-events-auto"
                  : "invisible opacity-0 translate-y-1.5 scale-[0.98] pointer-events-none group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-hover:pointer-events-auto"
                  }`}
              >
                <div className="rounded-2xl border border-[#a5dfe4] bg-white p-2 shadow-2xl shadow-teal-950/15">
                  <div className="rounded-xl bg-gradient-to-br from-[#f0fbfb] to-white border border-[#e0f2f2] px-3.5 py-2.5 mb-1">
                    <p className="truncate text-xs font-extrabold text-slate-800">
                      {displayFullName}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
                      {user?.email}
                    </p>
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-[#e0f4f6] px-2 py-0.5 text-[10px] font-bold text-[#038b95]">
                      <ShieldCheck className="h-3 w-3 shrink-0" />
                      {isCompany
                        ? companyVerificationStatus === "APPROVED"
                          ? "Đối tác đã xác minh"
                          : companyVerificationStatus === "PENDING"
                            ? "Đang chờ xác minh"
                            : "Tài khoản Doanh nghiệp"
                        : isTeacher
                          ? "Giảng viên hướng dẫn"
                          : user?.isSuperAdmin
                            ? "Quản trị viên hệ thống"
                            : "Quản trị viên phân hệ"}
                    </span>
                  </div>

                  <div className="py-1 border-b border-slate-100 space-y-0.5">
                    <button
                      type="button"
                      onMouseDown={() => {
                        setActiveTab(profileTabId);
                        setIsProfileOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-[#f0fbfb] hover:text-[#038b95] cursor-pointer"
                    >
                      {isCompany ? (
                        <Building className="h-4 w-4 text-[#038b95]" />
                      ) : isTeacher ? (
                        <GraduationCap className="h-4 w-4 text-[#038b95]" />
                      ) : (
                        <User className="h-4 w-4 text-[#038b95]" />
                      )}
                      {isCompany
                        ? "Hồ sơ doanh nghiệp"
                        : isTeacher
                          ? "Hồ sơ giảng viên"
                          : "Hồ sơ cá nhân"}
                    </button>
                    {isCompany && companyVerificationStatus === "APPROVED" && (
                      <>
                        <button
                          type="button"
                          onMouseDown={() => {
                            setActiveTab("postings");
                            setIsProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-[#f0fbfb] hover:text-[#038b95] cursor-pointer"
                        >
                          <Briefcase className="h-4 w-4 text-[#038b95]" />
                          Tin tuyển dụng &amp; Mẫu
                        </button>
                        <button
                          type="button"
                          onMouseDown={() => {
                            setActiveTab("applicants");
                            setIsProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-[#f0fbfb] hover:text-[#038b95] cursor-pointer"
                        >
                          <Users className="h-4 w-4 text-[#038b95]" />
                          Ứng viên &amp; Sàng lọc AI
                        </button>
                      </>
                    )}
                    {isTeacher && (
                      <>
                        <button
                          type="button"
                          onMouseDown={() => {
                            setActiveTab("supervised-placements");
                            setIsProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-[#f0fbfb] hover:text-[#038b95] cursor-pointer"
                        >
                          <Users className="h-4 w-4 text-[#038b95]" />
                          Sinh viên hướng dẫn
                        </button>
                        <button
                          type="button"
                          onMouseDown={() => {
                            setActiveTab("review-reports");
                            setIsProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-[#f0fbfb] hover:text-[#038b95] cursor-pointer"
                        >
                          <CheckSquare className="h-4 w-4 text-[#038b95]" />
                          Duyệt báo cáo tuần
                        </button>
                        <button
                          type="button"
                          onMouseDown={() => {
                            setActiveTab("evaluation-list");
                            setIsProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-[#f0fbfb] hover:text-[#038b95] cursor-pointer"
                        >
                          <Star className="h-4 w-4 text-[#038b95]" />
                          Đánh giá &amp; Chấm điểm
                        </button>
                      </>
                    )}
                    {!isCompany && !isTeacher && user?.isSuperAdmin && (
                      <>
                        <button
                          type="button"
                          onMouseDown={() => {
                            setActiveTab("admin-permissions");
                            setIsProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-[#f0fbfb] hover:text-[#038b95] cursor-pointer"
                        >
                          <KeyRound className="h-4 w-4 text-[#038b95]" />
                          Phân quyền quản trị
                        </button>
                        <button
                          type="button"
                          onMouseDown={() => {
                            setActiveTab("user-management");
                            setIsProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-[#f0fbfb] hover:text-[#038b95] cursor-pointer"
                        >
                          <Users className="h-4 w-4 text-[#038b95]" />
                          Quản lý người dùng
                        </button>
                      </>
                    )}
                  </div>

                  <div className="pt-1">
                    <button
                      id="btn-logout"
                      type="button"
                      onMouseDown={onLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-bold text-[#da1c2d] hover:bg-rose-50 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
      </>
    );
  }

  if (currentRole === "STUDENT") {
    const isInternshipDropdownActive = ["placement", "reports", "evaluations"].includes(activeTab);

    return (
      <div className="fixed top-2.5 sm:top-3.5 inset-x-2.5 sm:inset-x-4 lg:inset-x-6 xl:inset-x-8 z-50 pointer-events-none">
        <header className="student-capsule-navbar pointer-events-auto w-full max-w-[1240px] mx-auto border border-teal-900/15 bg-white/95 backdrop-blur-xl shadow-[0_10px_35px_-10px_rgb(0_80_84/0.25)] rounded-full px-3.5 sm:px-5 lg:px-6 h-13 sm:h-14 lg:h-16 flex items-center justify-between gap-2 sm:gap-4 transition-all">
          {/* Left: Brand Identity - Cả cụm Logo + Chữ CareerBridge đều click để về trang chủ */}
          <button
            type="button"
            className="group flex items-center gap-2 sm:gap-2.5 cursor-pointer shrink-0 py-1 pl-0.5 pr-1.5 sm:pr-3 rounded-full hover:opacity-90 transition-all text-left focus:outline-none"
            onClick={() => {
              setActiveTab("internships");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            title="CareerBridge - Về trang chủ"
            aria-label="Về trang chủ CareerBridge"
          >
            <img
              src="/careerbridge-logo.svg"
              alt="CareerBridge"
              className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 object-contain transition-transform group-hover:scale-105 pointer-events-none select-none"
            />
            <span className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-slate-900 leading-none group-hover:text-teal-700 transition-colors pointer-events-none select-none">
              CareerBridge
            </span>
          </button>

          {/* Center: Navigation Links (Desktop ONLY, Text ONLY) */}
          <nav className="hidden lg:flex items-center gap-1.5">
            <button
              id="nav-tab-internships"
              onClick={() => {
                setActiveTab("internships");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${activeTab === "internships"
                ? "bg-teal-700 text-white font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
            >
              Cơ hội việc làm
            </button>

            <button
              id="nav-tab-applications"
              onClick={() => {
                setActiveTab("applications");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${activeTab === "applications"
                ? "bg-teal-700 text-white font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
            >
              Đơn ứng tuyển
            </button>

            {/* Dropdown cụm: Thực tập ⌵ */}
            <div
              ref={studentInternshipDropdownRef}
              className="relative"
              onMouseEnter={handleInternshipMouseEnter}
              onMouseLeave={handleInternshipMouseLeave}
            >
              <button
                type="button"
                onClick={() => {
                  if (internshipCloseTimerRef.current) window.clearTimeout(internshipCloseTimerRef.current);
                  setIsStudentInternshipOpen((prev) => !prev);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${isInternshipDropdownActive
                  ? "bg-teal-700 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
              >
                <span>Thực tập</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isStudentInternshipOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              <div
                className={`transition-all duration-200 absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50 w-56 ${isStudentInternshipOpen
                  ? "visible opacity-100 translate-y-0 pointer-events-auto"
                  : "invisible opacity-0 translate-y-1 pointer-events-none"
                  }`}
              >
                <div className="rounded-2xl border border-slate-200/90 !bg-white p-1.5 shadow-2xl space-y-0.5">
                  <button
                    type="button"
                    id="nav-tab-placement"
                    onClick={() => selectStudentTab("placement")}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${activeTab === "placement" ? "bg-teal-50 text-teal-800" : "text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    <span>Hồ sơ thực tập</span>
                    {activeTab === "placement" && <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />}
                  </button>
                  <button
                    type="button"
                    id="nav-tab-reports"
                    onClick={() => selectStudentTab("reports")}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${activeTab === "reports" ? "bg-teal-50 text-teal-800" : "text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    <span>Báo cáo tuần</span>
                    {activeTab === "reports" && <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />}
                  </button>
                  <button
                    type="button"
                    id="nav-tab-evaluations"
                    onClick={() => selectStudentTab("evaluations")}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${activeTab === "evaluations" ? "bg-teal-50 text-teal-800" : "text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    <span>Kết quả đánh giá</span>
                    {activeTab === "evaluations" && <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              id="nav-tab-support"
              onClick={() => setActiveTab("support")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${activeTab === "support"
                ? "bg-teal-700 text-white font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
            >
              Hỗ trợ
            </button>
          </nav>

          {/* Right: Actions & User Avatar */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Chat button */}
            {canUseChat && (
              <button
                id="btn-chat-toggle"
                onClick={onOpenChat}
                className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-teal-900/10 bg-slate-50 text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer shadow-2xs"
                title="Tin nhắn & Trao đổi"
              >
                <MessageSquare className="h-4 w-4" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 text-[9px] font-bold text-white ring-2 ring-white px-1">
                    {unreadMessagesCount}
                  </span>
                )}
              </button>
            )}

            {/* Notifications Button */}
            <div className="group relative notification-trigger">
              <button
                id="btn-notifs-toggle"
                onClick={onOpenNotifs}
                className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-teal-900/10 bg-slate-50 text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer shadow-2xs"
                title="Thông báo"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white animate-pulse px-1">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>
              {notificationPreview}
            </div>

            <div className="h-5 w-px bg-slate-200 mx-0.5 sm:mx-1 hidden sm:block" />

            {/* User Profile Avatar with dropdown (Desktop/Tablet) */}
            <div
              ref={studentProfileDropdownRef}
              className="relative hidden sm:block"
              onMouseEnter={handleProfileMouseEnter}
              onMouseLeave={handleProfileMouseLeave}
            >
              <button
                type="button"
                onClick={() => {
                  if (profileCloseTimerRef.current) window.clearTimeout(profileCloseTimerRef.current);
                  setIsStudentProfileOpen((prev) => !prev);
                }}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center overflow-hidden rounded-full border-2 border-teal-500/30 bg-slate-100 text-sm font-black text-slate-600 transition hover:border-teal-500 hover:ring-2 hover:ring-teal-100 cursor-pointer shadow-xs"
                title="Tài khoản của tôi"
                aria-label="Tài khoản của tôi"
              >
                <ProfileAvatarPreview
                  fileId={avatarFileId}
                  fallback="S"
                  className="flex h-full w-full items-center justify-center bg-teal-100 text-teal-800"
                  imageClassName="h-full w-full object-cover"
                />
              </button>
              <div
                className={`transition-all duration-150 absolute right-0 top-full pt-2 z-50 w-52 ${isStudentProfileOpen
                  ? "visible opacity-100 translate-y-0 pointer-events-auto"
                  : "invisible opacity-0 translate-y-1 pointer-events-none"
                  }`}
              >
                <div className="rounded-2xl border border-slate-200/90 !bg-white p-1.5 shadow-2xl space-y-0.5">
                  <button
                    type="button"
                    id="nav-tab-profile"
                    onClick={() => selectStudentTab("profile")}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition cursor-pointer"
                  >
                    <User className="h-3.5 w-3.5 text-teal-600" /> Hồ sơ sinh viên
                  </button>
                  <button
                    id="btn-logout"
                    type="button"
                    onClick={() => {
                      if (profileCloseTimerRef.current) window.clearTimeout(profileCloseTimerRef.current);
                      setIsStudentProfileOpen(false);
                      onLogout();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Đăng xuất
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile menu trigger */}
            <div
              ref={studentMobileDropdownRef}
              className="lg:hidden relative"
            >
              <button
                type="button"
                onClick={() => setIsStudentMobileOpen((prev) => !prev)}
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border transition cursor-pointer shadow-2xs ${isStudentMobileOpen
                  ? "border-teal-600 bg-teal-50 text-teal-800"
                  : "border-teal-900/10 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                title="Menu điều hướng"
                aria-label="Menu điều hướng"
                aria-expanded={isStudentMobileOpen}
              >
                {isStudentMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>

          </div>
        </header>

        {/* Mobile Navigation Drawer Overlay */}
        {isStudentMobileOpen && (
          <div
            className="pointer-events-auto fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-xs lg:hidden transition-opacity flex flex-col items-center px-2.5 sm:px-4"
            onClick={() => setIsStudentMobileOpen(false)}
          >
            <div
              ref={studentMobileDrawerRef}
              className="mt-17 sm:mt-19 w-full max-w-md bg-white/98 backdrop-blur-xl border border-teal-900/15 shadow-[0_24px_50px_-12px_rgba(0,40,45,0.3)] rounded-3xl p-4 sm:p-5 space-y-3.5 max-h-[calc(100vh-5.5rem)] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden animate-in fade-in slide-in-from-top-3 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* User Identity Card */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-teal-50/70 border border-teal-100">
                <ProfileAvatarPreview
                  fileId={avatarFileId}
                  fallback="S"
                  className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-100 text-teal-800 font-bold text-sm shadow-xs"
                  imageClassName="h-full w-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-900 truncate">
                    {user?.email?.split('@')[0] || "Sinh viên"}
                  </p>
                  <p className="text-[11px] font-semibold text-teal-700 truncate">{user?.email}</p>
                </div>
                <span className="rounded-full bg-white border border-teal-200/80 px-2.5 py-0.5 text-[10px] font-black uppercase text-teal-800 shadow-2xs">
                  Sinh viên
                </span>
              </div>

              {/* Main Navigation Links */}
              <div className="space-y-1">
                <p className="px-2 pt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Phân hệ chức năng
                </p>
                <button
                  type="button"
                  onClick={() => selectStudentTab("internships")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "internships"
                    ? "bg-teal-700 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                    }`}
                >
                  <Briefcase className="h-4 w-4 shrink-0" />
                  <span>Cơ hội việc làm</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectStudentTab("applications")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "applications"
                    ? "bg-teal-700 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                    }`}
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span>Đơn ứng tuyển</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectStudentTab("placement")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "placement"
                    ? "bg-teal-700 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                    }`}
                >
                  <Building className="h-4 w-4 shrink-0" />
                  <span>Hồ sơ thực tập</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectStudentTab("reports")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "reports"
                    ? "bg-teal-700 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                    }`}
                >
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  <span>Báo cáo tuần</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectStudentTab("evaluations")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "evaluations"
                    ? "bg-teal-700 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                    }`}
                >
                  <CheckSquare className="h-4 w-4 shrink-0" />
                  <span>Kết quả đánh giá</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectStudentTab("support")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "support"
                    ? "bg-teal-700 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                    }`}
                >
                  <LifeBuoy className="h-4 w-4 shrink-0" />
                  <span>Hỗ trợ &amp; Phản ánh</span>
                </button>
              </div>

              {/* Account Options */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <p className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Tài khoản
                </p>
                <button
                  type="button"
                  onClick={() => selectStudentTab("profile")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "profile"
                    ? "bg-teal-50 text-teal-800"
                    : "text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                    }`}
                >
                  <User className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>Hồ sơ sinh viên</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsStudentMobileOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <header className="role-navbar sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 lg:gap-8">
          {/* Left: Brand Identity */}
          <div
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
            onClick={() => setActiveTab(navItems[0]?.id || "")}
            title="Về trang chính"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/80 p-1 shadow-2xs transition hover:bg-slate-100">
              <img
                src="/careerbridge-logo.svg"
                alt="CareerBridge"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
                CareerBridge
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#e0f4f6] text-[#038b95] border border-[#a5dfe4]">
                {currentRole === "COMPANY"
                  ? "Doanh nghiệp"
                  : currentRole === "TEACHER"
                    ? "Giảng viên"
                    : "Sinh viên"}
              </span>
            </div>
          </div>

          {/* Center: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${isActive
                    ? "bg-[#038b95] text-white font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                    }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Search Shortcut */}
            <div className="hidden 2xl:flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs text-slate-400 w-44 shadow-2xs">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="flex-1 truncate text-slate-400 text-[11px]">Tìm nhanh...</span>
              <kbd className="px-1.5 py-0.5 text-[9px] font-bold bg-white rounded border border-slate-200 text-slate-400 shadow-2xs">/</kbd>
            </div>

            {/* Chat button */}
            {canUseChat && (
              <button
                id="btn-chat-toggle"
                onClick={onOpenChat}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                title="Tin nhắn & Trao đổi"
              >
                <MessageSquare className="h-4 w-4" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 text-[9px] font-bold text-white ring-2 ring-white px-1">
                    {unreadMessagesCount}
                  </span>
                )}
              </button>
            )}

            {/* Notifications Button */}
            <div className="group relative notification-trigger">
              <button
                id="btn-notifs-toggle"
                onClick={onOpenNotifs}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                title="Thông báo"
                aria-haspopup={showNotificationPreview ? "dialog" : undefined}
              >
                <Bell className="h-4 w-4" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white animate-pulse px-1">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>
              {notificationPreview}
            </div>

            {/* Subtle Divider */}
            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* User Profile Chip */}
            {showLogoutInNavbar &&
              (currentRole === "COMPANY" ? (
                <div className="group relative">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 transition cursor-pointer"
                    title="Menu tài khoản doanh nghiệp"
                  >
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-teal-50 border border-teal-200/80 text-teal-800 font-bold text-xs">
                      {companyLogo ? (
                        <img
                          src={companyLogo}
                          alt="Logo công ty"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Building className="h-4 w-4 text-teal-700" />
                      )}
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1.5 ring-white" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 hidden sm:block truncate max-w-[130px]">
                      {companyName || user?.email?.split('@')[0] || "Ban Tuyển Dụng"}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition" />
                  </button>

                  <div className="invisible absolute right-0 top-full z-50 mt-2 w-48 translate-y-1 rounded-xl border border-slate-200 bg-white p-1.5 opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => setActiveTab("company-profile")}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition cursor-pointer"
                    >
                      <Building className="h-3.5 w-3.5 text-teal-600" /> Hồ sơ doanh nghiệp
                    </button>
                    <button
                      id="btn-logout"
                      type="button"
                      onClick={onLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Đăng xuất
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group relative">
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-sm font-black text-slate-600 transition hover:border-indigo-200 hover:ring-2 hover:ring-indigo-100 cursor-pointer"
                    title="Tài khoản của tôi"
                    aria-label="Tài khoản của tôi"
                  >
                    <ProfileAvatarPreview
                      fileId={avatarFileId}
                      fallback={currentRole === "TEACHER" ? "G" : "S"}
                      className={`flex h-full w-full items-center justify-center ${currentRole === "TEACHER" ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"}`}
                      imageClassName="h-full w-full object-cover"
                    />
                  </button>
                  <div className="invisible absolute right-0 top-full z-50 mt-2 w-44 translate-y-1 rounded-xl border border-slate-200 bg-white p-1.5 opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          currentRole === "TEACHER"
                            ? "lecturer-profile"
                            : "profile",
                        )
                      }
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <User className="h-4 w-4" /> Hồ sơ
                    </button>
                    <button
                      id="btn-logout"
                      type="button"
                      onClick={onLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" /> Đăng xuất
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex items-center space-x-1 overflow-x-auto pb-2.5 pt-1 no-scrollbar border-t border-slate-100">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition ${isActive
                  ? "bg-[#038b95] text-white shadow-xs"
                  : "text-slate-600 bg-slate-100 hover:bg-slate-200"
                  }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
