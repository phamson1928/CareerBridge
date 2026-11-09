import React, { useEffect, useState } from "react";
import { UserRole } from "../types";
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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { ProfileAvatarPreview } from "./ProfileAvatarUpload";
import {
  ADMIN_PROFILE_UPDATED_EVENT,
  loadAdminProfile,
} from "./AdminView/AdminProfile";
import type { AppNotification } from "../notifications/types";

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
  companyVerificationStatus?: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | null;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
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
      label: "Doanh nghiệp & Tuyển dụng",
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
  companyVerificationStatus,
  isSidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const { user } = useAuth();
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
    const initial: Record<string, boolean> = {};
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
    if (currentRole === "ADMIN") {
      for (const entry of adminNavStructure) {
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
      case "COMPANY":
        return [
          {
            id: "company-profile",
            label: companyVerificationStatus === "APPROVED" ? "Hồ sơ doanh nghiệp" : "Đăng ký doanh nghiệp",
            icon: <Building className="w-4 h-4" />,
          },
          ...(companyVerificationStatus === "APPROVED" ? [{
            id: "dashboard",
            label: "Tổng quan",
            icon: <LayoutDashboard className="w-4 h-4" />,
          }, {
            id: "postings",
            label: "Đăng & Quản lý tin",
            icon: <Briefcase className="w-4 h-4" />,
          }, {
            id: "applicants",
            label: "Ứng viên & Duyệt CV",
            icon: <Users className="w-4 h-4" />,
          }, {
            id: "interns-evaluation",
            label: "Thực tập sinh & Đánh giá",
            icon: <CheckSquare className="w-4 h-4" />,
          }] : []),
        ];
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
        <div className="max-h-80 space-y-1 overflow-x-hidden overflow-y-auto pt-1">
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

  if (currentRole === "ADMIN") {
    const labelTransitionClass = `whitespace-nowrap overflow-hidden transition-opacity duration-150 ${
      isSidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
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

    const visibleEntries = adminNavStructure
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
      .filter(Boolean) as AdminNavEntry[];

    const searchableItems: { id: string; label: string; groupLabel: string; icon: React.ReactNode }[] = [];
    for (const entry of visibleEntries) {
      if (entry.type === "item") {
        searchableItems.push({
          id: entry.data.id,
          label: entry.data.label,
          groupLabel: "Tổng quan & Vận hành",
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
    searchableItems.push({
      id: "admin-profile",
      label: "Hồ sơ cá nhân",
      groupLabel: "Tài khoản quản trị",
      icon: <User className="w-4 h-4" />,
    });

    const activeModule =
      searchableItems.find((item) => item.id === activeTab) ||
      searchableItems[0] || {
        id: "stats-dashboard",
        label: "Thống kê hệ thống",
        groupLabel: "Tổng quan & Vận hành",
        icon: <LayoutDashboard className="w-4 h-4" />,
      };

    const q = adminSearch.trim().toLowerCase();
    const filteredSearchItems = q
      ? searchableItems.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.groupLabel.toLowerCase().includes(q),
        )
      : searchableItems;

    const avatarInitial = (
      adminProfile.fullName?.charAt(0) ||
      user?.email?.charAt(0) ||
      "A"
    ).toUpperCase();
    const resolvedAvatarId = adminProfile.avatarFileId || avatarFileId;

    return (
      <>
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-20 flex-col border-r border-slate-200/80 bg-white text-slate-700 shadow-[2px_0_12px_rgba(0,0,0,0.03)] transition-[width] duration-200 ease-out will-change-[width] ${
            isSidebarCollapsed ? "lg:w-20" : "lg:w-[300px]"
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
              className="absolute -right-3.5 top-[22px] z-50 hidden h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:scale-110 hover:text-[#00878a] hover:bg-slate-50 lg:flex cursor-pointer"
            >
              <ChevronLeft
                className={`h-4 w-4 transition-transform duration-200 ease-out ${
                  isSidebarCollapsed ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>
          )}

          <div className="flex h-full w-full flex-col overflow-hidden">
            <button
              type="button"
              onClick={() => setActiveTab(navItems[0]?.id || "")}
              className="flex h-[72px] items-center justify-start gap-3 overflow-hidden border-b border-slate-100 px-3.5 text-left cursor-pointer shrink-0"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 border border-slate-100 p-1 shadow-xs">
                <img
                  src="/careerbridge-logo.svg"
                  alt="CareerBridge"
                  className="h-full w-full -translate-x-[14%] scale-[1.35] object-contain"
                />
              </span>
              <span className={labelTransitionClass}>
                <span className="block text-base font-bold tracking-tight text-slate-900">
                  CareerBridge
                </span>
                <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {user?.isSuperAdmin ? "Quản trị tối cao" : "Ban quản trị phân hệ"}
                </span>
              </span>
            </button>
            <div
              className={`overflow-hidden whitespace-nowrap px-5 pt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 transition-opacity duration-150 ${
                isSidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
            >
              Điều hướng
            </div>
          <nav className="mt-2 flex-1 space-y-1 overflow-x-hidden overflow-y-auto px-3 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
                    className={`flex w-full items-center justify-start gap-2.5 overflow-hidden rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-colors duration-150 cursor-pointer ${
                      isActive
                        ? "bg-[#e6f6f6] text-[#00777a] shadow-xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className={`flex h-5 w-6 shrink-0 items-center justify-center ${isActive ? "text-[#00777a]" : "text-slate-400"}`}>
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
                <div key={group.id} className="space-y-1">
                  <button
                    type="button"
                    title={group.label}
                    onClick={() => {
                      if (isSidebarCollapsed && onToggleSidebar) {
                        onToggleSidebar();
                      }
                      toggleGroup(group.id);
                    }}
                    className={`flex w-full items-center justify-between gap-1.5 overflow-hidden rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors duration-150 cursor-pointer ${
                      !isOpen && hasActiveChild
                        ? "bg-[#e6f6f6] text-[#00777a]"
                        : isOpen
                          ? "text-slate-900 bg-slate-50/70"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className={`flex h-5 w-6 shrink-0 items-center justify-center ${hasActiveChild ? "text-[#00777a]" : "text-slate-400"}`}>
                        {group.icon}
                      </span>
                      <span className={labelTransitionClass}>{group.label}</span>
                    </div>
                    {!isSidebarCollapsed && (
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ml-1 ${
                          isOpen ? "rotate-180 text-slate-600" : ""
                        }`}
                      />
                    )}
                  </button>

                  {isOpen && (
                    <div
                      className={`space-y-1 overflow-hidden transition-[max-height,opacity] duration-200 ease-out ${
                        isSidebarCollapsed
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
                            className={`flex w-full items-center justify-start gap-2.5 overflow-hidden rounded-xl pl-8 pr-3.5 py-2.5 text-left text-sm font-semibold transition-colors duration-150 cursor-pointer ${
                              isSubActive
                                ? "bg-[#e6f6f6] text-[#00777a] shadow-xs"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center ${isSubActive ? "text-[#00777a]" : "text-slate-400"}`}>
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
        </div>
      </aside>

        {/* Cohesive Modern Admin Top Header Bar */}
        <header className="sticky top-0 z-40 flex h-[72px] w-full items-center justify-between gap-4 border-b border-[#d5eaea] bg-white px-4 shadow-[0_4px_20px_rgb(0_105_110/0.05)] sm:px-6 lg:px-7">
          {/* Left: Active Module Badge & Clean Two-line Title Hierarchy */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#cde4e5] bg-[#e6f6f6]/70 text-[#00777a] shadow-xs">
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

          {/* Right Cluster: Search Pill + Notifications + Account Capsule */}
          <div className="flex items-center gap-3">
            {/* Sleek Search Pill */}
            <div className="group relative hidden md:block w-64 lg:w-80">
              <div className="relative flex items-center">
                <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#00878a]" />
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
                  className="h-10 w-full rounded-full border border-[#cde4e5] bg-[#f4fbfb] pl-10 pr-10 text-xs font-medium text-slate-700 placeholder:text-slate-400 transition-all hover:border-[#9bd8d9] hover:bg-white focus:border-[#00878a] focus:bg-white focus:ring-3 focus:ring-[#00878a]/12 focus:outline-none"
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
                  <span className="pointer-events-none absolute right-3 rounded-md border border-[#cde4e5] bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#00777a]/70">
                    /
                  </span>
                )}
              </div>

              {/* Seamless Search Dropdown (Smooth float transition, 0 gap) */}
              <div
                className={`absolute right-0 top-full z-50 pt-2 w-88 origin-top-right transition-all duration-200 ease-out before:absolute before:-top-3 before:inset-x-0 before:h-3 before:content-[''] ${
                  isSearchFocused
                    ? "visible opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "invisible opacity-0 translate-y-1.5 scale-[0.98] pointer-events-none group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-hover:pointer-events-auto"
                }`}
              >
                <div className="max-h-72 overflow-y-auto rounded-2xl border border-[#cde4e5] bg-white p-2 shadow-2xl shadow-teal-950/12 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${
                              isCurrentTab
                                ? "bg-[#e6f6f6] font-bold text-[#00777a]"
                                : "font-medium text-slate-700 hover:bg-[#f4fbfb]"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                                  isCurrentTab
                                    ? "bg-[#00878a] text-white"
                                    : "bg-[#e6f6f6]/70 text-[#00777a]"
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

            {/* Notification Bell Circle (Hover to preview, Click to open full drawer) */}
            <div className="group relative notification-trigger">
              <button
                id="btn-notifs-toggle"
                type="button"
                onClick={onOpenNotifs}
                title="Thông báo"
                aria-label="Thông báo"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#cde4e5] bg-[#f4fbfb] text-[#00777a] transition-all hover:border-[#00878a] hover:bg-white hover:shadow-xs cursor-pointer"
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
                className={`flex items-center gap-2 rounded-full border py-1 pl-1.5 pr-2.5 text-left transition-all ${
                  activeTab === "admin-profile"
                    ? "border-[#00878a] bg-[#e6f6f6]/70 ring-2 ring-[#00878a]/20"
                    : isProfileOpen
                      ? "border-[#00878a] bg-white ring-3 ring-[#00878a]/12"
                      : "border-[#cde4e5] bg-[#f4fbfb] hover:border-[#00878a]/60 hover:bg-white hover:shadow-xs group-hover:border-[#00878a]/60 group-hover:bg-white"
                }`}
              >
                {/* Clicking Avatar or Name navigates directly to Hồ sơ cá nhân */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("admin-profile");
                    setIsProfileOpen(false);
                  }}
                  className="flex items-center gap-2.5 text-left cursor-pointer focus:outline-none"
                  title="Nhấp để xem Hồ sơ cá nhân"
                >
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#00878a] to-[#005a5d] text-xs font-black text-white shadow-xs transition-transform hover:scale-105">
                    <ProfileAvatarPreview
                      fileId={resolvedAvatarId}
                      fallback={avatarInitial}
                      className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#00878a] to-[#005a5d] text-white"
                      imageClassName="h-full w-full object-cover"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div className="hidden sm:block max-w-[170px]">
                    <p className="truncate text-xs font-extrabold leading-tight text-slate-800 hover:text-[#00878a] transition-colors">
                      {adminProfile.fullName}
                    </p>
                    <p className="truncate text-[10px] font-medium leading-tight text-slate-500">
                      {adminProfile.title || user?.email}
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
                  className="hidden sm:flex h-5 w-5 items-center justify-center text-slate-400 hover:text-[#00878a] transition-colors cursor-pointer"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      isProfileOpen ? "rotate-180 text-[#00878a]" : "group-hover:rotate-180"
                    }`}
                  />
                </button>
              </div>

              {/* Account Dropdown Menu (Smooth float transition, 0 gap) */}
              <div
                className={`absolute right-0 top-full z-50 pt-2 w-68 origin-top-right transition-all duration-200 ease-out before:absolute before:-top-3 before:inset-x-0 before:h-3 before:content-[''] ${
                  isProfileOpen
                    ? "visible opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "invisible opacity-0 translate-y-1.5 scale-[0.98] pointer-events-none group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-hover:pointer-events-auto"
                }`}
              >
                <div className="rounded-2xl border border-[#cde4e5] bg-white p-2 shadow-2xl shadow-teal-950/15">
                  <div className="rounded-xl bg-gradient-to-br from-[#f0fbfb] to-white border border-[#e0f2f2] px-3.5 py-2.5 mb-1">
                    <p className="truncate text-xs font-extrabold text-slate-800">
                      {adminProfile.fullName}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
                      {user?.email}
                    </p>
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-[#e6f6f6] px-2 py-0.5 text-[10px] font-bold text-[#00777a]">
                      <ShieldCheck className="h-3 w-3 shrink-0" />
                      {user?.isSuperAdmin ? "Quản trị tối cao (Super Admin)" : "Quản trị viên phân hệ"}
                    </span>
                  </div>

                  <div className="py-1 border-b border-slate-100 space-y-0.5">
                    <button
                      type="button"
                      onMouseDown={() => {
                        setActiveTab("admin-profile");
                        setIsProfileOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-[#f0fbfb] hover:text-[#00777a] cursor-pointer"
                    >
                      <User className="h-4 w-4 text-[#00878a]" />
                      Hồ sơ cá nhân
                    </button>
                    {user?.isSuperAdmin && (
                      <>
                        <button
                          type="button"
                          onMouseDown={() => {
                            setActiveTab("admin-permissions");
                            setIsProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-[#f0fbfb] hover:text-[#00777a] cursor-pointer"
                        >
                          <KeyRound className="h-4 w-4 text-[#00878a]" />
                          Phân quyền quản trị
                        </button>
                        <button
                          type="button"
                          onMouseDown={() => {
                            setActiveTab("user-management");
                            setIsProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-[#f0fbfb] hover:text-[#00777a] cursor-pointer"
                        >
                          <Users className="h-4 w-4 text-[#00878a]" />
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

  return (
    <header className="role-navbar sticky top-0 z-40 border-b border-slate-200 bg-white shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveTab(navItems[0]?.id || "")}
          >
            <img
              src="/careerbridge-logo.svg"
              alt="CareerBridge"
              className="h-14 w-auto object-contain"
            />
          </div>

          {/* Navigation Links */}
          <nav className="hidden items-center space-x-1 md:flex">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-100/60 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {/* A conversation is private to the accepted application's student and company. */}
            {canUseChat && (
              <button
                id="btn-chat-toggle"
                onClick={onOpenChat}
                className="relative rounded-lg border border-transparent p-2 text-slate-600 transition-colors hover:border-slate-200 hover:bg-slate-50 hover:text-indigo-600"
                title="Trao đổi Realtime"
              >
                <MessageSquare className="h-5 w-5" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
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
                className="relative rounded-lg border border-transparent p-2 text-slate-600 transition-colors hover:border-slate-200 hover:bg-slate-50 hover:text-indigo-600 focus:border-indigo-200 focus:bg-indigo-50 focus:text-indigo-600"
                title="Thông báo"
                aria-haspopup={showNotificationPreview ? "dialog" : undefined}
              >
                <Bell className="h-5 w-5" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>
              {notificationPreview}
            </div>
            {showLogoutInNavbar &&
              (currentRole === "COMPANY" ? (
                <button
                  id="btn-logout"
                  type="button"
                  onClick={onLogout}
                  className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 hover:ring-2 hover:ring-rose-100"
                  title="Đăng xuất"
                  aria-label="Đăng xuất"
                >
                  <span className="flex h-full w-full items-center justify-center transition-all duration-150 group-hover:scale-75 group-hover:opacity-0">
                    {companyLogo ? (
                      <img
                        src={companyLogo}
                        alt="Logo công ty"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building className="h-5 w-5" />
                    )}
                  </span>
                  <LogOut className="pointer-events-none absolute h-5 w-5 scale-75 opacity-0 transition-all duration-150 group-hover:scale-100 group-hover:opacity-100" />
                </button>
              ) : (
                <div className="group relative">
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-sm font-black text-slate-600 transition hover:border-indigo-200 hover:ring-2 hover:ring-indigo-100"
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
        <div className="md:hidden flex items-center space-x-1 overflow-x-auto pb-2 pt-1 no-scrollbar border-t border-slate-100">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
                  isActive
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-slate-600 bg-slate-100"
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
