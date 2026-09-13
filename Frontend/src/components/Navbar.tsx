import React from "react";
import { UserRole } from "../types";
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
}) => {
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
            id: "profile",
            label: "Hồ sơ cá nhân",
            icon: <User className="w-4 h-4" />,
          },
        ];
      case "COMPANY":
        return [
          {
            id: "company-profile",
            label: "Đăng ký doanh nghiệp",
            icon: <Building className="w-4 h-4" />,
          },
          {
            id: "dashboard",
            label: "Tổng quan",
            icon: <LayoutDashboard className="w-4 h-4" />,
          },
          {
            id: "postings",
            label: "Đăng & Quản lý tin",
            icon: <Briefcase className="w-4 h-4" />,
          },
          {
            id: "applicants",
            label: "Ứng viên & Duyệt CV",
            icon: <Users className="w-4 h-4" />,
          },
          {
            id: "interns-evaluation",
            label: "Thực tập sinh & Đánh giá",
            icon: <CheckSquare className="w-4 h-4" />,
          },
        ];
      case "TEACHER":
        return [
          {
            id: "students-list",
            label: "Sinh viên phụ trách",
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
      case "ADMIN":
        return [
          {
            id: "stats-dashboard",
            label: "Thống kê hệ thống",
            icon: <LayoutDashboard className="w-4 h-4" />,
          },
          {
            id: "teacher-assignment",
            label: "Phân công Giảng viên",
            icon: <GraduationCap className="w-4 h-4" />,
          },
          {
            id: "placement-management",
            label: "Quản lý thực tập",
            icon: <Briefcase className="w-4 h-4" />,
          },
          {
            id: "user-management",
            label: "Quản lý người dùng",
            icon: <Users className="w-4 h-4" />,
          },
          {
            id: "company-approval",
            label: "Duyệt Doanh nghiệp",
            icon: <Building className="w-4 h-4" />,
          },
          {
            id: "skill-management",
            label: "Danh mục kỹ năng",
            icon: <CheckSquare className="w-4 h-4" />,
          },
          {
            id: "semester-management",
            label: "Kỳ thực tập",
            icon: <CalendarDays className="w-4 h-4" />,
          },
        ];
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
      <div className="max-h-80 space-y-1 overflow-y-auto pt-1">
        {unreadNotifications.length ? (
          unreadNotifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => onNotificationClick(notification)}
              className={`w-full rounded-xl px-3 py-2.5 text-left transition hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none ${notification.isRead ? "" : "bg-indigo-50/60"}`}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${notification.isRead ? "bg-slate-300" : "bg-indigo-600"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-slate-800">
                    {notification.title}
                  </span>
                  <span className="mt-0.5 block line-clamp-2 text-[11px] leading-4 text-slate-500">
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
    return (
      <aside className="fixed inset-y-0 left-0 z-50 flex w-20 flex-col border-r border-[#006f72] bg-[#00878a] text-white shadow-2xl lg:w-72">
        <button
          type="button"
          onClick={() => setActiveTab(navItems[0]?.id || "")}
          className="flex h-24 items-center justify-center gap-3 border-b border-white/15 px-3 text-left lg:justify-start lg:px-7"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow-lg">
            <img
              src="/careerbridge-logo.svg"
              alt="CareerBridge"
              className="h-full w-full -translate-x-[14%] scale-[1.35] object-contain"
            />
          </span>
          <span className="hidden lg:block">
            <span className="block text-base font-black tracking-tight">
              CareerBridge
            </span>
            <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">
              Khu vực quản trị
            </span>
          </span>
        </button>
        <div className="hidden px-4 pt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55 lg:block">
          Điều hướng
        </div>
        <nav className="mt-3 flex-1 space-y-1 overflow-y-auto px-3">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                title={item.label}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition lg:justify-start ${isActive ? "bg-white text-[#00777a] shadow-lg" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
              >
                {item.icon}
                <span className="hidden lg:block">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="m-3 space-y-2 border-t border-white/15 pt-3">
          <button
            id="btn-notifs-toggle"
            title="Thông báo"
            onClick={onOpenNotifs}
            className="relative flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white lg:justify-start"
          >
            <Bell className="h-5 w-5" />
            <span className="hidden lg:block">Thông báo</span>
            {unreadNotifsCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#da1c2d] px-1 text-[10px] font-bold text-white lg:static lg:ml-auto">
                {unreadNotifsCount}
              </span>
            )}
          </button>
          <button
            id="btn-logout"
            title="Đăng xuất"
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#da1c2d] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#da1c2d]/20 transition hover:bg-[#bd1425] lg:justify-start"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden lg:block">Đăng xuất</span>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <header className="role-navbar sticky top-0 z-40 border-b border-slate-200 bg-white shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
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
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-100/60 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {item.icon}
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
                className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                title="Trao đổi Realtime"
              >
                <MessageSquare className="w-5 h-5" />
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
                <Bell className="w-5 h-5" />
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
                  className="group relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 hover:ring-2 hover:ring-rose-100"
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
                    className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-sm font-black text-slate-600 transition hover:border-indigo-200 hover:ring-2 hover:ring-indigo-100"
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
                  isActive
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-slate-600 bg-slate-100"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
