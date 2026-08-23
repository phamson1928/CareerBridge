/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserRole,
  StudentProfile,
  CompanyProfile,
  TeacherProfile,
  Internship,
  Application,
  WeeklyReport,
  Evaluation,
  ChatMessage,
  AppNotification,
  ApplicationStatus,
} from "./types";

import {
  INITIAL_STUDENT_PROFILES,
  INITIAL_COMPANY_PROFILES,
  INITIAL_TEACHER_PROFILES,
  INITIAL_INTERNSHIPS,
  INITIAL_WEEKLY_REPORTS,
  INITIAL_EVALUATIONS,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
} from "./data/mockData";

import { Navbar } from "./components/Navbar";
import { SessionBanner } from "./components/SessionBanner";
import { NotificationCenter } from "./components/Notifications/NotificationCenter";
import { ChatDrawer } from "./components/Chat/ChatDrawer";

import { InternshipList } from "./components/StudentView/InternshipList";
import { StudentApplications } from "./components/StudentView/StudentApplications";
import { StudentReports } from "./components/StudentView/StudentReports";
import { StudentProfileView } from "./components/StudentView/StudentProfile";
import { AICVCoachModal } from "./components/StudentView/AICVCoachModal";

import { CompanyDashboard } from "./components/CompanyView/CompanyDashboard";
import { PostInternshipModal } from "./components/CompanyView/PostInternshipModal";
import { ManageApplicants } from "./components/CompanyView/ManageApplicants";
import { EvaluateInternsModal } from "./components/CompanyView/EvaluateInternsModal";
import { CompanyProfileView } from "./components/CompanyView/CompanyProfile";
import { CompanyInternships } from "./components/CompanyView/CompanyInternships";

import { TeacherDashboard } from "./components/TeacherView/TeacherDashboard";
import { ReviewReports } from "./components/TeacherView/ReviewReports";
import { TeacherEvaluations } from "./components/TeacherView/TeacherEvaluations";
import { LecturerProfileView } from "./components/TeacherView/LecturerProfile";

import { AdminDashboard } from "./components/AdminView/AdminDashboard";
import { UserManagement } from "./components/AdminView/UserManagement";
import { CompanyModeration } from "./components/AdminView/CompanyModeration";
import { SupervisionManagement } from "./components/AdminView/SupervisionManagement";
import { PlacementManagement } from "./components/AdminView/PlacementManagement";
import { SkillManagement } from "./components/AdminView/SkillManagement";
import { SemesterManagement } from "./components/AdminView/SemesterManagement";
import { PlacementOverview } from "./components/StudentView/PlacementOverview";
import { SupervisedPlacements } from "./components/TeacherView/SupervisedPlacements";
import { useAuth } from "./auth/AuthContext";
import { applicationsApi, type ApplicationRecord } from "./applications/api";
import { companiesApi } from "./companies/api";
import { internshipsApi, type InternshipRecord } from "./internships/api";
import { studentsApi } from "./students/api";

function toLegacyInternship(record: InternshipRecord): Internship {
  const type = ["Full-time", "Part-time", "Hybrid", "Remote"].includes(
    record.workType ?? "",
  )
    ? (record.workType as Internship["type"])
    : "Full-time";

  return {
    id: record.id,
    companyId: record.companyId,
    companyName: record.company.companyName,
    companyLogo: record.company.logo ?? "",
    title: record.title,
    department: record.department ?? "Chưa cập nhật",
    location: record.location ?? "Chưa cập nhật",
    type,
    stipend: record.stipend ?? "Thỏa thuận",
    description: record.description,
    requirements: record.requirements
      ? record.requirements.split("\n").filter(Boolean)
      : [],
    requiredSkills: record.skills.map((item) => item.name),
    slots: record.slots,
    filledSlots: record.filledSlots,
    deadline: record.deadline ?? "Chưa cập nhật",
    createdAt: record.createdAt,
    status: record.status === "OPEN" ? "ACTIVE" : "CLOSED",
  };
}

function toLegacyApplication(record: ApplicationRecord): Application {
  return {
    id: record.id,
    studentId: record.studentId,
    studentName: record.student.fullName,
    studentMajor: record.student.major,
    studentSkills: [],
    internshipId: record.internshipId,
    internshipTitle: record.internship.title,
    companyId: record.internship.company.id,
    companyName: record.internship.company.companyName,
    cvUrl: "",
    cvFileId: record.cvFileId ?? undefined,
    coverLetter: record.coverLetter ?? undefined,
    matchScore: record.matchScore ?? 0,
    status: record.status,
    companyFeedback: record.companyFeedback ?? undefined,
    appliedAt: record.appliedAt,
    updatedAt: record.updatedAt,
  };
}

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const currentRole: UserRole =
    user?.role === "LECTURER" ? "TEACHER" : (user?.role ?? "STUDENT");
  const [activeTab, setActiveTab] = useState<string>(() =>
    getDefaultTab(currentRole),
  );

  useEffect(() => {
    setActiveTab(getDefaultTab(currentRole));
  }, [currentRole]);

  // Core App State
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>(
    INITIAL_STUDENT_PROFILES,
  );
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>(
    INITIAL_COMPANY_PROFILES,
  );
  const [teacherProfiles] = useState<TeacherProfile[]>(
    INITIAL_TEACHER_PROFILES,
  );

  const [internships, setInternships] =
    useState<Internship[]>(INITIAL_INTERNSHIPS);
  const [applications, setApplications] = useState<Application[]>([]);
  const [reports, setReports] = useState<WeeklyReport[]>(
    INITIAL_WEEKLY_REPORTS,
  );
  const [evaluations, setEvaluations] =
    useState<Evaluation[]>(INITIAL_EVALUATIONS);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [notifications, setNotifications] = useState<AppNotification[]>(
    INITIAL_NOTIFICATIONS,
  );

  // Modals state
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAICoachOpen, setIsAICoachOpen] = useState(false);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    let active = true;
    const applyApplications = (records: ApplicationRecord[]) => {
      if (active) setApplications(records.map(toLegacyApplication));
    };

    const loadWorkflowData = async () => {
      try {
        if (user.role === "STUDENT") {
          const [internshipsPage, applicationsPage] = await Promise.all([
            internshipsApi.list({ page: 1, limit: 100 }),
            applicationsApi.listMine({ page: 1, limit: 100 }),
          ]);
          if (!active) return;
          setInternships(internshipsPage.items.map(toLegacyInternship));
          applyApplications(applicationsPage.items);

          try {
            const profile = await studentsApi.getMine();
            if (!active) return;
            setStudentProfiles((previous) => [
              {
                ...previous[0],
                id: profile.id,
                userId: profile.userId,
                fullname: profile.fullName,
                studentCode: profile.studentCode,
                major: profile.major,
                gpa: profile.gpa ?? 0,
                cvFileId: profile.cvFileId ?? undefined,
                cvName: profile.cvFile?.originalName,
              },
            ]);
          } catch (profileError) {
            console.warn("Student profile is not available yet", profileError);
          }
        }

        if (user.role === "COMPANY") {
          const [profile, applicationsPage] = await Promise.all([
            companiesApi.getMine(),
            applicationsApi.listMine({ page: 1, limit: 100 }),
          ]);
          if (!active) return;
          setCompanyProfiles((previous) => [
            {
              ...previous[0],
              id: profile.id,
              userId: profile.userId,
              companyName: profile.companyName,
              tagline: profile.tagline ?? "",
              description: profile.description ?? "",
              industry: profile.industry ?? "",
              website: profile.website ?? "",
              address: profile.address ?? "",
              logo: profile.logo ?? "",
              verified: profile.status === "APPROVED",
              contactEmail: profile.contactEmail ?? "",
            },
          ]);
          applyApplications(applicationsPage.items);
        }
      } catch (error) {
        console.error("Unable to load application workflow data", error);
      }
    };

    void loadWorkflowData();
    return () => {
      active = false;
    };
  }, [user?.id, user?.role]);

  // Active Users per Role
  const currentStudent = studentProfiles[0];
  const currentCompany = companyProfiles[0];
  const currentTeacher = teacherProfiles[0];

  const currentUserId =
    currentRole === "STUDENT"
      ? currentStudent.userId
      : currentRole === "COMPANY"
        ? currentCompany.userId
        : currentRole === "TEACHER"
          ? currentTeacher.userId
          : "usr-adm-1";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  // Student Actions
  const handleApplyInternship = async (
    internshipId: string,
    coverLetter: string,
  ) => {
    const job = internships.find((i) => i.id === internshipId);
    if (!job) throw new Error("Không tìm thấy vị trí thực tập.");
    let cvFileId = currentStudent.cvFileId;
    if (!cvFileId) {
      const profile = await studentsApi.getMine();
      cvFileId = profile.cvFileId ?? undefined;
      setStudentProfiles((previous) => [
        {
          ...previous[0],
          cvFileId,
          cvName: profile.cvFile?.originalName,
        },
      ]);
    }
    if (!cvFileId) {
      throw new Error("Bạn cần tải CV lên hồ sơ trước khi ứng tuyển.");
    }

    const created = await applicationsApi.create({
      internshipId,
      coverLetter,
      cvFileId,
    });
    setApplications((previous) => [toLegacyApplication(created), ...previous]);

    // Add Notification for Company
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: job.companyId,
      title: "Đơn ứng tuyển mới 📄",
      message: `Sinh viên ${currentStudent.fullname} đã nộp đơn ứng tuyển vị trí ${job.title}.`,
      type: "APPLICATION",
      read: false,
      createdAt: "Vừa xong",
    };
    setNotifications((previous) => [newNotif, ...previous]);

    alert(
      `Ứng tuyển vị trí "${job.title}" thành công! Doanh nghiệp sẽ xem xét hồ sơ của bạn.`,
    );
  };

  const handleSubmitReport = (reportData: Partial<WeeklyReport>) => {
    const newReport: WeeklyReport = {
      id: `rep-${Date.now()}`,
      studentId: currentStudent.id,
      studentName: currentStudent.fullname,
      internshipId: currentStudent.activeInternshipId || "int-1",
      companyName: "FPT Software",
      weekNumber: reportData.weekNumber || reports.length + 1,
      startDate: reportData.startDate || new Date().toISOString().split("T")[0],
      endDate: reportData.endDate || new Date().toISOString().split("T")[0],
      tasksCompleted: reportData.tasksCompleted || "",
      plansNextWeek: reportData.plansNextWeek || "",
      learningsAndChallenges: reportData.learningsAndChallenges || "",
      attachmentName: reportData.attachmentName || "BaoCao.pdf",
      attachmentUrl:
        reportData.attachmentUrl || "https://pdfobject.com/pdf/sample.pdf",
      status: "SUBMITTED",
      submittedAt: new Date().toISOString().split("T")[0],
    };

    setReports([newReport, ...reports]);
  };

  const handleUpdateStudentProfile = (updated: Partial<StudentProfile>) => {
    setStudentProfiles((prev) =>
      prev.map((s) => (s.id === currentStudent.id ? { ...s, ...updated } : s)),
    );
  };

  // Company Actions
  const handlePostInternship = (posting: Partial<Internship>) => {
    const newJob: Internship = {
      id: `int-${Date.now()}`,
      companyId: currentCompany.id,
      companyName: currentCompany.companyName,
      companyLogo: currentCompany.logo,
      title: posting.title || "Mới",
      department: posting.department || "Phần mềm",
      location: posting.location || "TP. HCM",
      type: "Full-time",
      stipend: posting.stipend || "6,000,000 VNĐ",
      description: posting.description || "",
      requirements: posting.requirements || [],
      requiredSkills: posting.requiredSkills || [],
      slots: posting.slots || 5,
      filledSlots: 0,
      deadline: posting.deadline || "2026-09-01",
      createdAt: new Date().toISOString().split("T")[0],
      status: "ACTIVE",
    };

    setInternships([newJob, ...internships]);
  };

  const handleUpdateApplicationStatus = async (
    appId: string,
    status: ApplicationStatus,
    feedback?: string,
  ) => {
    const updated = await applicationsApi.updateStatus(appId, {
      status,
      companyFeedback: feedback,
    });
    setApplications((previous) =>
      previous.map((application) =>
        application.id === appId ? toLegacyApplication(updated) : application,
      ),
    );
  };

  const handleWithdrawApplication = async (appId: string) => {
    const updated = await applicationsApi.updateStatus(appId, {
      status: "WITHDRAWN",
    });
    setApplications((previous) =>
      previous.map((application) =>
        application.id === appId ? toLegacyApplication(updated) : application,
      ),
    );
  };

  const handleSubmitEvaluation = (evalData: Partial<Evaluation>) => {
    const newEval: Evaluation = {
      id: `eval-${Date.now()}`,
      studentId: evalData.studentId || "std-1",
      studentName: evalData.studentName || "Phạm Hoàng Sơn",
      internshipId: evalData.internshipId || "int-1",
      companyId: currentCompany.id,
      companyName: currentCompany.companyName,
      technicalScore: evalData.technicalScore || 9,
      softSkillScore: evalData.softSkillScore || 8.5,
      disciplineScore: evalData.disciplineScore || 9.5,
      overallScore: evalData.overallScore || 9,
      companyFeedback: evalData.companyFeedback || "",
      evaluatedAt: new Date().toISOString().split("T")[0],
    };

    setEvaluations([
      newEval,
      ...evaluations.filter((e) => e.studentId !== newEval.studentId),
    ]);
  };

  // Teacher Actions
  const handleReviewReport = (
    reportId: string,
    status: WeeklyReport["status"],
    comment: string,
  ) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, status, teacherComment: comment } : r,
      ),
    );
  };

  const handleSaveTeacherFeedback = (
    evalId: string,
    teacherFeedback: string,
  ) => {
    setEvaluations((prev) =>
      prev.map((e) => (e.id === evalId ? { ...e, teacherFeedback } : e)),
    );
  };

  // Realtime Chat Action
  const handleSendMessage = (receiverId: string, content: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUserId,
      senderName:
        currentRole === "STUDENT"
          ? currentStudent.fullname
          : currentCompany.companyName,
      senderRole: currentRole,
      receiverId,
      content,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMsg]);

    // Auto simulated reply from company/student
    setTimeout(() => {
      const autoReply: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        senderId: receiverId,
        senderName:
          currentRole === "STUDENT" ? "FPT Software HR" : "Phạm Hoàng Sơn",
        senderRole: currentRole === "STUDENT" ? "COMPANY" : "STUDENT",
        receiverId: currentUserId,
        content:
          currentRole === "STUDENT"
            ? "Dạ bên anh đã nhận được tin nhắn! Bộ phận Tuyển dụng FPT Software sẽ phản hồi trong ít phút."
            : "Em đã nhận được thông tin từ quý công ty. Em cảm ơn anh/chị!",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, autoReply]);
    }, 1200);
  };

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans flex flex-col antialiased">
      {user && (
        <SessionBanner user={user} onLogout={() => void handleLogout()} />
      )}

      {/* Main Navbar */}
      <Navbar
        currentRole={currentRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadNotifsCount={unreadNotifs}
        unreadMessagesCount={1}
        onOpenNotifs={() => setIsNotifsOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenAICoach={() => setIsAICoachOpen(true)}
      />

      {/* Main Page Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* STUDENT VIEWS */}
        {currentRole === "STUDENT" && (
          <>
            {activeTab === "internships" && (
              <InternshipList
                internships={internships}
                studentProfile={currentStudent}
                applications={applications}
                onApply={handleApplyInternship}
              />
            )}
            {activeTab === "applications" && (
              <StudentApplications
                applications={applications.filter(
                  (a) => a.studentId === currentStudent.id,
                )}
                onOpenChat={() => setIsChatOpen(true)}
                onWithdraw={handleWithdrawApplication}
              />
            )}
            {activeTab === "reports" && (
              <StudentReports />
            )}
            {activeTab === "placement" && <PlacementOverview />}
            {activeTab === "profile" && <StudentProfileView />}
          </>
        )}

        {/* COMPANY VIEWS */}
        {currentRole === "COMPANY" && (
          <>
            {activeTab === "company-profile" && <CompanyProfileView />}
            {activeTab === "dashboard" && (
              <CompanyDashboard
                onNavigateTab={setActiveTab}
                onOpenCreatePosting={() => setActiveTab("postings")}
              />
            )}
            {activeTab === "postings" && (
              <CompanyInternships />
            )}
            {activeTab === "applicants" && (
              <ManageApplicants
                companyProfile={currentCompany}
                applications={applications}
                onUpdateStatus={handleUpdateApplicationStatus}
                onOpenChat={() => setIsChatOpen(true)}
              />
            )}
            {activeTab === "interns-evaluation" && (
              <EvaluateInternsModal
                companyProfile={currentCompany}
                evaluations={evaluations}
                internships={internships}
                studentProfiles={studentProfiles}
                onSubmitEvaluation={handleSubmitEvaluation}
              />
            )}
          </>
        )}

        {/* TEACHER VIEWS */}
        {currentRole === "TEACHER" && (
          <>
            {activeTab === "students-list" && (
              <TeacherDashboard
                teacherProfile={currentTeacher}
                assignedStudents={studentProfiles}
                reports={reports}
                evaluations={evaluations}
                onNavigateTab={setActiveTab}
              />
            )}
            {activeTab === "supervised-placements" && <SupervisedPlacements />}
            {activeTab === "review-reports" && (
              <ReviewReports />
            )}
            {activeTab === "evaluation-list" && (
              <TeacherEvaluations
                evaluations={evaluations}
                assignedStudents={studentProfiles}
                onSaveTeacherFeedback={handleSaveTeacherFeedback}
              />
            )}
            {activeTab === "lecturer-profile" && <LecturerProfileView />}
          </>
        )}

        {/* ADMIN VIEWS */}
        {currentRole === "ADMIN" && (
          <>
            {activeTab === "stats-dashboard" && (
              <AdminDashboard onNavigate={setActiveTab} />
            )}
            {activeTab === "teacher-assignment" && <SupervisionManagement />}
            {activeTab === "placement-management" && (
              <PlacementManagement
                onOpenAssignment={() => setActiveTab("teacher-assignment")}
              />
            )}
            {activeTab === "user-management" && <UserManagement />}
            {activeTab === "company-approval" && <CompanyModeration />}
            {activeTab === "skill-management" && <SkillManagement />}
            {activeTab === "semester-management" && <SemesterManagement />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-semibold text-slate-700">
            Hệ Thống Hỗ Trợ Tìm Kiếm & Quản Lý Thực Tập Cho Sinh Viên
            (InternConnect) © 2026
          </p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Báo cáo đề tài thực tập tốt nghiệp</span>
            <span>•</span>
            <span className="font-mono text-blue-600 font-bold">
              PostgreSQL + NestJS + React
            </span>
          </div>
        </div>
      </footer>

      {/* Global Drawers & Modals */}
      <NotificationCenter
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) =>
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
          )
        }
        onMarkAllAsRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
      />

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        currentUserId={currentUserId}
        currentRole={currentRole}
        onSendMessage={handleSendMessage}
      />

      <AICVCoachModal
        isOpen={isAICoachOpen}
        onClose={() => setIsAICoachOpen(false)}
        studentProfile={currentStudent}
        internships={internships}
      />

      <PostInternshipModal
        isOpen={isCreateJobOpen}
        onClose={() => setIsCreateJobOpen(false)}
        companyProfile={currentCompany}
        onSubmitPosting={handlePostInternship}
      />
    </div>
  );
}

function getDefaultTab(role: UserRole): string {
  switch (role) {
    case "STUDENT":
      return "internships";
    case "COMPANY":
      return "company-profile";
    case "TEACHER":
      return "students-list";
    case "ADMIN":
      return "stats-dashboard";
  }
}
