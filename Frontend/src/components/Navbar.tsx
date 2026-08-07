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
  Sparkles,
} from "lucide-react";

interface NavbarProps {
  currentRole: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadNotifsCount: number;
  unreadMessagesCount: number;
  onOpenNotifs: () => void;
  onOpenChat: () => void;
  onOpenAICoach?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  activeTab,
  setActiveTab,
  unreadNotifsCount,
  unreadMessagesCount,
  onOpenNotifs,
  onOpenChat,
  onOpenAICoach,
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
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-10 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveTab(navItems[0]?.id || "")}
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-xs">
              C
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-indigo-950 uppercase flex items-center gap-1">
                Intern<span className="text-indigo-600">Connect</span>{" "}
                <span className="font-light text-slate-400 text-sm lowercase">
                  | portal
                </span>
              </span>
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                Career Opportunities & Management
              </span>
            </div>
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
            {currentRole === "STUDENT" && onOpenAICoach && (
              <button
                id="btn-ai-coach"
                onClick={onOpenAICoach}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI CV & Gợi ý Job</span>
              </button>
            )}

            {/* Chat Button */}
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
