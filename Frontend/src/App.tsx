/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Application,
  ApplicationStatus,
  CompanyProfile,
  Internship,
  StudentProfile,
  UserRole,
} from "./types";

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
import { AuditLogManagement } from "./components/AdminView/AuditLogManagement";
import { PlacementOverview } from "./components/StudentView/PlacementOverview";
import { StudentEvaluations } from "./components/StudentView/StudentEvaluations";
import { SupervisedPlacements } from "./components/TeacherView/SupervisedPlacements";
import { useAuth } from "./auth/AuthContext";
import { useNotifications } from "./notifications/use-notifications";
import type { NotificationAction } from "./notifications/types";
import { applicationsApi, type ApplicationRecord } from "./applications/api";
import { companiesApi, type CompanyProfileRecord } from "./companies/api";
import { internshipsApi, type InternshipRecord } from "./internships/api";
import { studentsApi, type StudentProfileRecord } from "./students/api";
import { skillsApi } from "./skills/api";
import { evaluationsApi, type EvaluationRecord } from "./evaluations/api";
import { placementsApi } from "./placements/api";
import type { PlacementRecord } from "./placements/types";
import { getApiErrorMessage } from "./auth/api";
import { useChat } from "./chat/use-chat";

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

function toLegacyStudentProfile(
  record: StudentProfileRecord,
  skills: string[],
): StudentProfile {
  return {
    id: record.id,
    userId: record.userId,
    fullname: record.fullName,
    studentCode: record.studentCode,
    major: record.major,
    university: "",
    gpa: record.gpa ?? 0,
    skills,
    cvFileId: record.cvFileId ?? undefined,
    cvName: record.cvFile?.originalName,
    summary: record.summary ?? undefined,
    phone: record.phone ?? undefined,
  };
}

function toLegacyCompanyProfile(record: CompanyProfileRecord): CompanyProfile {
  return {
    id: record.id,
    userId: record.userId,
    companyName: record.companyName,
    tagline: record.tagline ?? "",
    description: record.description ?? "",
    industry: record.industry ?? "",
    website: record.website ?? "",
    address: record.address ?? "",
    logo: record.logo ?? "",
    verified: record.status === "APPROVED",
    contactEmail: record.contactEmail ?? "",
  };
}

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const notificationState = useNotifications();
  const chatState = useChat();
  const currentRole: UserRole =
    user?.role === "LECTURER" ? "TEACHER" : (user?.role ?? "STUDENT");
  const [activeTab, setActiveTab] = useState<string>(() =>
    getDefaultTab(currentRole),
  );

  useEffect(() => {
    setActiveTab(getDefaultTab(currentRole));
  }, [currentRole]);

  const [studentProfile, setStudentProfile] =
    useState<StudentProfile | null>(null);
  const [companyProfile, setCompanyProfile] =
    useState<CompanyProfile | null>(null);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [evaluationRecords, setEvaluationRecords] = useState<EvaluationRecord[]>([]);
  const [myPlacements, setMyPlacements] = useState<PlacementRecord[]>([]);

  // Modals state
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAICoachOpen, setIsAICoachOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    let active = true;
    setStudentProfile(null);
    setCompanyProfile(null);
    setInternships([]);
    setApplications([]);
    setEvaluationRecords([]);
    setMyPlacements([]);

    const applyApplications = (records: ApplicationRecord[]) => {
      if (active) setApplications(records.map(toLegacyApplication));
    };

    const loadWorkflowData = async () => {
      try {
        if (user.role === "STUDENT") {
          const [internshipsPage, applicationsPage, evaluationPage] =
            await Promise.all([
              internshipsApi.list({ page: 1, limit: 100 }),
              applicationsApi.listMine({ page: 1, limit: 100 }),
              evaluationsApi.listMine({ page: 1, limit: 100 }),
            ]);
          if (!active) return;
          setInternships(internshipsPage.items.map(toLegacyInternship));
          applyApplications(applicationsPage.items);
          setEvaluationRecords(evaluationPage.items);

          try {
            const [profile, studentSkills] = await Promise.all([
              studentsApi.getMine(),
              skillsApi.getStudentMine(),
            ]);
            if (active) {
              setStudentProfile(
                toLegacyStudentProfile(
                  profile,
                  studentSkills.map((skill) => skill.name),
                ),
              );
            }
          } catch (profileError) {
            console.warn("Student profile is not available yet", profileError);
          }
        }

        if (user.role === "COMPANY") {
          const [applicationsPage, placements, evaluationPage] =
            await Promise.all([
              applicationsApi.listMine({ page: 1, limit: 100 }),
              placementsApi.listMine(),
              evaluationsApi.listMine({ page: 1, limit: 100 }),
            ]);
          if (!active) return;
          applyApplications(applicationsPage.items);
          setMyPlacements(placements.items);
          setEvaluationRecords(evaluationPage.items);

          try {
            const profile = await companiesApi.getMine();
            if (active) setCompanyProfile(toLegacyCompanyProfile(profile));
          } catch (profileError) {
            console.warn("Company profile is not available yet", profileError);
          }
        }

        if (user.role === "LECTURER") {
          const [placements, evaluationPage] = await Promise.all([
            placementsApi.listMine(),
            evaluationsApi.listMine({ page: 1, limit: 100 }),
          ]);
          if (!active) return;
          setMyPlacements(placements.items);
          setEvaluationRecords(evaluationPage.items);
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

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  // Student Actions
  const handleApplyInternship = async (
    internshipId: string,
    coverLetter: string,
  ) => {
    const job = internships.find((item) => item.id === internshipId);
    if (!job) throw new Error("Không tìm thấy vị trí thực tập.");

    let cvFileId = studentProfile?.cvFileId;
    if (!cvFileId) {
      const profile = await studentsApi.getMine();
      cvFileId = profile.cvFileId ?? undefined;
      setStudentProfile((current) =>
        toLegacyStudentProfile(profile, current?.skills ?? []),
      );
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

    alert(
      `Ứng tuyển vị trí "${job.title}" thành công! Doanh nghiệp sẽ xem xét hồ sơ của bạn.`,
    );
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

  const handleSubmitEvaluation = async (input: {
    placementId: string;
    score: number;
    comment: string;
  }) => {
    try {
      const created = await evaluationsApi.create(input);
      setEvaluationRecords((previous) => [created, ...previous]);
      alert("Đã lưu đánh giá thành công. Sinh viên sẽ nhận được thông báo.");
    } catch (error) {
      alert(getApiErrorMessage(error));
      throw error;
    }
  };

  const handleUpdateEvaluation = async (id: string, input: { score: number; comment: string }) => {
    try {
      const updated = await evaluationsApi.update(id, input);
      setEvaluationRecords((previous) => previous.map((item) => item.id === id ? updated : item));
      alert("Đã cập nhật đánh giá.");
    } catch (error) {
      alert(getApiErrorMessage(error));
      throw error;
    }
  };

  const handleNotificationNavigate = (action: NotificationAction) => {
    const tabByAction: Partial<Record<NotificationAction, string>> = {
      OPEN_APPLICATION: currentRole === "COMPANY" ? "applicants" : currentRole === "ADMIN" ? "application-management" : "applications",
      OPEN_REPORT: currentRole === "TEACHER" ? "review-reports" : "reports",
      OPEN_SUPERVISION: currentRole === "TEACHER" ? "supervised-placements" : currentRole === "ADMIN" ? "teacher-assignment" : "placement",
      OPEN_PLACEMENT: currentRole === "COMPANY" ? "placement-management" : currentRole === "TEACHER" ? "supervised-placements" : currentRole === "ADMIN" ? "placement-management" : "placement",
      OPEN_COMPANY_PROFILE: currentRole === "ADMIN" ? "company-approval" : "company-profile",
      OPEN_EVALUATION: currentRole === "COMPANY" ? "interns-evaluation" : currentRole === "TEACHER" ? "evaluation-list" : "evaluations",
    };
    const tab = tabByAction[action];
    if (tab) setActiveTab(tab);
  };

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
        unreadNotifsCount={notificationState.unreadCount}
        unreadMessagesCount={chatState.unreadCount}
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
              studentProfile ? (
                <InternshipList
                  internships={internships}
                  studentProfile={studentProfile}
                  applications={applications}
                  onApply={handleApplyInternship}
                />
              ) : (
                <ProfileRequiredNotice
                  title="Hoàn thiện hồ sơ trước khi ứng tuyển"
                  description="Hệ thống không dùng dữ liệu mẫu. Hãy tạo hồ sơ sinh viên và tải CV để xem cơ hội phù hợp."
                  onOpenProfile={() => setActiveTab("profile")}
                />
              )
            )}
            {activeTab === "applications" && (
              <StudentApplications
                applications={applications}
                onOpenChat={() => setIsChatOpen(true)}
                onWithdraw={handleWithdrawApplication}
              />
            )}
            {activeTab === "reports" && (
              <StudentReports />
            )}
            {activeTab === "placement" && <PlacementOverview />}
            {activeTab === "evaluations" && <StudentEvaluations evaluations={evaluationRecords} />}
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
              companyProfile ? (
                <ManageApplicants
                  companyProfile={companyProfile}
                  applications={applications}
                  onUpdateStatus={handleUpdateApplicationStatus}
                  onOpenChat={() => setIsChatOpen(true)}
                />
              ) : (
                <ProfileRequiredNotice
                  title="Hoàn thiện hồ sơ doanh nghiệp"
                  description="Tạo hồ sơ doanh nghiệp trước khi quản lý các hồ sơ ứng tuyển."
                  onOpenProfile={() => setActiveTab("company-profile")}
                />
              )
            )}
            {activeTab === "interns-evaluation" && (
              <EvaluateInternsModal
                placements={myPlacements}
                evaluations={evaluationRecords}
                onSubmit={handleSubmitEvaluation}
                onUpdate={handleUpdateEvaluation}
              />
            )}
          </>
        )}

        {/* TEACHER VIEWS */}
        {currentRole === "TEACHER" && (
          <>
            {activeTab === "students-list" && (
              <TeacherDashboard onNavigateTab={setActiveTab} />
            )}
            {activeTab === "supervised-placements" && <SupervisedPlacements />}
            {activeTab === "review-reports" && (
              <ReviewReports />
            )}
            {activeTab === "evaluation-list" && (
              <TeacherEvaluations
                placements={myPlacements}
                evaluations={evaluationRecords}
                onSubmit={handleSubmitEvaluation}
                onUpdate={handleUpdateEvaluation}
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
            {activeTab === "audit-logs" && <AuditLogManagement />}
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
        notifications={notificationState.notifications}
        unreadCount={notificationState.unreadCount}
        filter={notificationState.filter}
        onFilterChange={notificationState.setFilter}
        isLoading={notificationState.isLoading}
        isLoadingMore={notificationState.isLoadingMore}
        isMarkingAll={notificationState.isMarkingAll}
        hasMore={notificationState.hasMore}
        error={notificationState.error}
        socketStatus={notificationState.socketStatus}
        onRefresh={() => void notificationState.refresh()}
        onLoadMore={() => void notificationState.loadMore()}
        onMarkAsRead={(id) => void notificationState.markAsRead(id)}
        onMarkAllAsRead={() => void notificationState.markAllAsRead()}
        onNavigate={(action) => { handleNotificationNavigate(action); setIsNotifsOpen(false); }}
      />

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        latestMessage={chatState.latestMessage}
        onMessagesRead={chatState.refreshUnreadCount}
      />
      {studentProfile && (
        <AICVCoachModal
          isOpen={isAICoachOpen}
          onClose={() => setIsAICoachOpen(false)}
          studentProfile={studentProfile}
          internships={internships}
        />
      )}
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

function ProfileRequiredNotice({
  title,
  description,
  onOpenProfile,
}: {
  title: string;
  description: string;
  onOpenProfile: () => void;
}) {
  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
      <h1 className="text-lg font-black">{title}</h1>
      <p className="mt-2 max-w-xl text-sm text-amber-800">{description}</p>
      <button
        onClick={onOpenProfile}
        className="mt-4 rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white hover:bg-amber-800"
      >
        Mở hồ sơ
      </button>
    </section>
  );
}