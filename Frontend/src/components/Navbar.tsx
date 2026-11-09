import React from "react";
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
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { ProfileAvatarPreview } from "./ProfileAvatarUpload";
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
  companyName?: string | null;
  companyVerificationStatus?: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | null;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

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
  isSidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const { user } = useAuth();
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
        const adminItems = [
          {
            id: "stats-dashboard",
            label: "Thống kê hệ thống",
            icon: <LayoutDashboard className="w-4 h-4" />,
            permission: "DASHBOARD",
          },
          {
            id: "teacher-assignment",
            label: "Phân công Giảng viên",
            icon: <GraduationCap className="w-4 h-4" />,
            permission: "PLACEMENTS",
          },
          {
            id: "placement-management",
            label: "Quản lý thực tập",
            icon: <Briefcase className="w-4 h-4" />,
            permission: "PLACEMENTS",
          },
          {
            id: "internship-management",
            label: "Tin tuyển dụng",
            icon: <FileText className="w-4 h-4" />,
            permission: "INTERNSHIPS",
          },
          {
            id: "user-management",
            label: "Quản lý người dùng",
            icon: <Users className="w-4 h-4" />,
            superAdminOnly: true,
          },
          {
            id: "audit-logs",
            label: "Nhật ký hệ thống",
            icon: <ShieldCheck className="w-4 h-4" />,
            superAdminOnly: true,
          },
          {
            id: "company-approval",
            label: "Duyệt Doanh nghiệp",
            icon: <Building className="w-4 h-4" />,
            permission: "COMPANIES",
          },
          {
            id: "organization-management",
            label: "Khoa & Ngành",
            icon: <GraduationCap className="w-4 h-4" />,
            permission: "SEMESTERS",
          },
          {
            id: "skill-management",
            label: "Danh mục kỹ năng",
            icon: <CheckSquare className="w-4 h-4" />,
            permission: "INTERNSHIPS",
          },
          {
            id: "semester-management",
            label: "Kỳ thực tập",
            icon: <CalendarDays className="w-4 h-4" />,
            permission: "SEMESTERS",
          },
          {
            id: "support-requests",
            label: "Hỗ trợ sinh viên",
            icon: <LifeBuoy className="w-4 h-4" />,
            permission: "SUPPORT",
          },
        ];

        if (user?.isSuperAdmin) {
          return adminItems;
        }

        const userPerms = user?.permissions || [];
        return adminItems.filter((item) => {
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
    currentRole === "TEACHER";
  const unreadNotifications = notifications
    .filter((notification) => !notification.isRead)
    .slice(0, 4);

  const notificationPreview = showNotificationPreview ? (
    <div
      className="notification-hover-card invisible absolute right-0 top-full z-50 mt-3 w-[min(23rem,calc(100vw-2rem))] translate-y-2 origin-top-right rounded-2xl border border-slate-200/90 bg-white/95 p-2 opacity-0 shadow-2xl shadow-slate-900/15 backdrop-blur-xl transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
      role="dialog"
      aria-label="Xem nhanh thông báo"
    >
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
          className="rounded-lg px-2 py-1 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-700"
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
              className={`w-full overflow-hidden rounded-xl px-3 py-2.5 text-left transition hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none ${notification.isRead ? "" : "bg-indigo-50/60"}`}
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
  ) : null;

  if (currentRole === "ADMIN") {
    const labelTransitionClass = `whitespace-nowrap overflow-hidden transition-[opacity,transform,max-width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
      isSidebarCollapsed
        ? "max-w-0 opacity-0 -translate-x-1.5 pointer-events-none"
        : "max-w-0 opacity-0 lg:max-w-[180px] lg:opacity-100 lg:translate-x-0"
    }`;

    return (
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-20 flex-col border-r border-[#006f72] bg-[#00878a] text-white shadow-2xl will-change-[width] transition-[width] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isSidebarCollapsed ? "lg:w-20" : "lg:w-72"
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
            className="absolute -right-3.5 top-9 z-50 hidden h-7 w-7 items-center justify-center rounded-full border border-[#006f72]/30 bg-white text-[#00777a] shadow-md transition-transform duration-200 hover:scale-105 hover:bg-[#e6f6f6] lg:flex"
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isSidebarCollapsed ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab(navItems[0]?.id || "")}
          className="flex h-24 items-center justify-start gap-3 overflow-hidden border-b border-white/15 px-3 text-left"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow-lg">
            <img
              src="/careerbridge-logo.svg"
              alt="CareerBridge"
              className="h-full w-full -translate-x-[14%] scale-[1.35] object-contain"
            />
          </span>
          <span className={labelTransitionClass}>
            <span className="block text-base font-black tracking-tight">
              CareerBridge
            </span>
            <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">
              {user?.isSuperAdmin ? "Quản trị tối cao" : "Ban quản trị phân hệ"}
            </span>
          </span>
        </button>
        <div
          className={`overflow-hidden whitespace-nowrap px-5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55 transition-[opacity,max-height,padding] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isSidebarCollapsed
              ? "max-h-0 pt-0 opacity-0"
              : "max-h-0 pt-0 opacity-0 lg:max-h-10 lg:pt-6 lg:opacity-100"
          }`}
        >
          Điều hướng
        </div>
        <nav className="mt-3 flex-1 space-y-1 overflow-x-hidden overflow-y-auto px-3">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                title={item.label}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center justify-start gap-3 overflow-hidden rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors duration-150 ${
                  isActive
                    ? "bg-white text-[#00777a] shadow-lg"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="flex h-5 w-6 shrink-0 items-center justify-center">
                  {item.icon}
                </span>
                <span className={labelTransitionClass}>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="m-3 space-y-2 border-t border-white/15 pt-3">
          <button
            id="btn-notifs-toggle"
            title="Thông báo"
            onClick={onOpenNotifs}
            className="relative flex w-full items-center justify-start gap-3 overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold text-white/85 transition-colors duration-150 hover:bg-white/10 hover:text-white"
          >
            <span className="flex h-5 w-6 shrink-0 items-center justify-center">
              <Bell className="h-5 w-5 shrink-0" />
            </span>
            <span className={labelTransitionClass}>Thông báo</span>
            {unreadNotifsCount > 0 && (
              <span
                className={`flex h-5 min-w-5 items-center justify-center rounded-full bg-[#da1c2d] px-1 text-[10px] font-bold text-white transition-all duration-200 ${
                  isSidebarCollapsed
                    ? "absolute right-1.5 top-1.5"
                    : "absolute right-1.5 top-1.5 lg:static lg:ml-auto"
                }`}
              >
                {unreadNotifsCount}
              </span>
            )}
          </button>
          <button
            id="btn-logout"
            title="Đăng xuất"
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-start gap-3 overflow-hidden rounded-xl bg-[#da1c2d] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#da1c2d]/20 transition-colors duration-150 hover:bg-[#bd1425]"
          >
            <span className="flex h-5 w-6 shrink-0 items-center justify-center">
              <LogOut className="h-5 w-5 shrink-0" />
            </span>
            <span className={labelTransitionClass}>Đăng xuất</span>
          </button>
        </div>
      </aside>
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
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-teal-50 text-teal-800 border border-teal-200/70">
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
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-teal-700 text-white font-bold shadow-xs"
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition ${
                  isActive
                    ? "bg-teal-700 text-white shadow-xs"
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
