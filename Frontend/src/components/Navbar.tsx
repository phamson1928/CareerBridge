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

interface NavbarProps {
  currentRole: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadNotifsCount: number;
  unreadMessagesCount: number;
  onOpenNotifs: () => void;
  onOpenChat: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  activeTab,
  setActiveTab,
  unreadNotifsCount,
  unreadMessagesCount,
  onOpenNotifs,
  onOpenChat,
  onLogout,
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
            label: "Placement của tôi",
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
            label: "Placement hướng dẫn",
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
            label: "Quản lý Placement",
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
  const canUseChat = currentRole === "STUDENT" || currentRole === "COMPANY" || currentRole === "TEACHER";
  const useCompactSession = currentRole === "COMPANY" || currentRole === "ADMIN";

  if (currentRole === "ADMIN") {
    return (
      <aside className="fixed inset-y-0 left-0 z-50 flex w-20 flex-col border-r border-[#006f72] bg-[#00878a] text-white shadow-2xl lg:w-72">
        <button type="button" onClick={() => setActiveTab(navItems[0]?.id || "")} className="flex h-24 items-center justify-center gap-3 border-b border-white/15 px-3 text-left lg:justify-start lg:px-7">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow-lg"><img src="/careerbridge-logo.svg" alt="CareerBridge" className="h-full w-full -translate-x-[14%] scale-[1.35] object-contain" /></span>
          <span className="hidden lg:block"><span className="block text-base font-black tracking-tight">CareerBridge</span><span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">Admin workspace</span></span>
        </button>
        <div className="hidden px-4 pt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55 lg:block">Điều hướng</div>
        <nav className="mt-3 flex-1 space-y-1 overflow-y-auto px-3">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return <button key={item.id} id={`nav-tab-${item.id}`} title={item.label} onClick={() => setActiveTab(item.id)} className={`flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition lg:justify-start ${isActive ? "bg-white text-[#00777a] shadow-lg" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>{item.icon}<span className="hidden lg:block">{item.label}</span></button>;
          })}
        </nav>
        <div className="m-3 space-y-2 border-t border-white/15 pt-3">
          <button id="btn-notifs-toggle" title="Thông báo" onClick={onOpenNotifs} className="relative flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white lg:justify-start"><Bell className="h-5 w-5" /><span className="hidden lg:block">Thông báo</span>{unreadNotifsCount > 0 && <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#da1c2d] px-1 text-[10px] font-bold text-white lg:static lg:ml-auto">{unreadNotifsCount}</span>}</button>
          <button id="btn-logout" title="Đăng xuất" type="button" onClick={onLogout} className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#da1c2d] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#da1c2d]/20 transition hover:bg-[#bd1425] lg:justify-start"><LogOut className="h-5 w-5" /><span className="hidden lg:block">Đăng xuất</span></button>
        </div>
      </aside>
    );
  }

  return (
    <header className={`bg-white border-b border-slate-200 sticky ${useCompactSession ? "top-0" : "top-10"} z-40 shadow-xs`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveTab(navItems[0]?.id || "")}
          >
            <img src="/careerbridge-logo.svg" alt="CareerBridge" className="h-20 w-auto object-contain" />
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
            <button
              id="btn-notifs-toggle"
              onClick={onOpenNotifs}
              className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
              title="Thông báo"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>
            {useCompactSession && (
              <button
                id="btn-logout"
                type="button"
                onClick={onLogout}
                className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
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
