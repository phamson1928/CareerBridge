/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserRole,
  User,
  StudentProfile,
  CompanyProfile,
  TeacherProfile,
  Internship,
  Application,
  WeeklyReport,
  Evaluation,
  ChatMessage,
  AppNotification,
  DashboardStats,
  ApplicationStatus,
} from './types';

import {
  INITIAL_USERS,
  INITIAL_STUDENT_PROFILES,
  INITIAL_COMPANY_PROFILES,
  INITIAL_TEACHER_PROFILES,
  INITIAL_INTERNSHIPS,
  INITIAL_APPLICATIONS,
  INITIAL_WEEKLY_REPORTS,
  INITIAL_EVALUATIONS,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
  MOCK_DASHBOARD_STATS,
} from './data/mockData';

import { Navbar } from './components/Navbar';
import { SessionBanner } from './components/SessionBanner';
import { NotificationCenter } from './components/Notifications/NotificationCenter';
import { ChatDrawer } from './components/Chat/ChatDrawer';

import { InternshipList } from './components/StudentView/InternshipList';
import { StudentApplications } from './components/StudentView/StudentApplications';
import { StudentReports } from './components/StudentView/StudentReports';
import { StudentProfileView } from './components/StudentView/StudentProfile';
import { AICVCoachModal } from './components/StudentView/AICVCoachModal';

import { CompanyDashboard } from './components/CompanyView/CompanyDashboard';
import { PostInternshipModal } from './components/CompanyView/PostInternshipModal';
import { ManageApplicants } from './components/CompanyView/ManageApplicants';
import { EvaluateInternsModal } from './components/CompanyView/EvaluateInternsModal';

import { TeacherDashboard } from './components/TeacherView/TeacherDashboard';
import { ReviewReports } from './components/TeacherView/ReviewReports';
import { TeacherEvaluations } from './components/TeacherView/TeacherEvaluations';

import { AdminDashboard } from './components/AdminView/AdminDashboard';
import { UserManagement } from './components/AdminView/UserManagement';
import { CompanyModeration } from './components/AdminView/CompanyModeration';
import { TeacherAssignment } from './components/AdminView/TeacherAssignment';
import { useAuth } from './auth/AuthContext';

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const currentRole: UserRole = user?.role === 'LECTURER' ? 'TEACHER' : user?.role ?? 'STUDENT';
  const [activeTab, setActiveTab] = useState<string>(() => getDefaultTab(currentRole));

  useEffect(() => {
    setActiveTab(getDefaultTab(currentRole));
  }, [currentRole]);

  // Core App State
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>(INITIAL_STUDENT_PROFILES);
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>(INITIAL_COMPANY_PROFILES);
  const [teacherProfiles, setTeacherProfiles] = useState<TeacherProfile[]>(INITIAL_TEACHER_PROFILES);

  const [internships, setInternships] = useState<Internship[]>(INITIAL_INTERNSHIPS);
  const [applications, setApplications] = useState<Application[]>(INITIAL_APPLICATIONS);
  const [reports, setReports] = useState<WeeklyReport[]>(INITIAL_WEEKLY_REPORTS);
  const [evaluations, setEvaluations] = useState<Evaluation[]>(INITIAL_EVALUATIONS);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  // Modals state
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAICoachOpen, setIsAICoachOpen] = useState(false);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);

  // Active Users per Role
  const currentStudent = studentProfiles[0];
  const currentCompany = companyProfiles[0];
  const currentTeacher = teacherProfiles[0];

  const currentUserId =
    currentRole === 'STUDENT'
      ? currentStudent.userId
      : currentRole === 'COMPANY'
      ? currentCompany.userId
      : currentRole === 'TEACHER'
      ? currentTeacher.userId
      : 'usr-adm-1';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Student Actions
  const handleApplyInternship = (internshipId: string, coverLetter: string, cvUrl: string) => {
    const job = internships.find((i) => i.id === internshipId);
    if (!job) return;

    const newApp: Application = {
      id: `app-${Date.now()}`,
      studentId: currentStudent.id,
      studentName: currentStudent.fullname,
      studentMajor: currentStudent.major,
      studentSkills: currentStudent.skills,
      internshipId,
      internshipTitle: job.title,
      companyId: job.companyId,
      companyName: job.companyName,
      cvUrl,
      coverLetter,
      matchScore: 92,
      status: 'PENDING',
      appliedAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setApplications([newApp, ...applications]);

    // Add Notification for Company
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: job.companyId,
      title: 'Đơn ứng tuyển mới 📄',
      message: `Sinh viên ${currentStudent.fullname} đã nộp đơn ứng tuyển vị trí ${job.title}.`,
      type: 'APPLICATION',
      read: false,
      createdAt: 'Vừa xong',
    };
    setNotifications([newNotif, ...notifications]);

    alert(`Ứng tuyển vị trí "${job.title}" thành công! Doanh nghiệp sẽ xem xét hồ sơ của bạn.`);
  };

  const handleSubmitReport = (reportData: Partial<WeeklyReport>) => {
    const newReport: WeeklyReport = {
      id: `rep-${Date.now()}`,
      studentId: currentStudent.id,
      studentName: currentStudent.fullname,
      internshipId: currentStudent.activeInternshipId || 'int-1',
      companyName: 'FPT Software',
      weekNumber: reportData.weekNumber || reports.length + 1,
      startDate: reportData.startDate || new Date().toISOString().split('T')[0],
      endDate: reportData.endDate || new Date().toISOString().split('T')[0],
      tasksCompleted: reportData.tasksCompleted || '',
      plansNextWeek: reportData.plansNextWeek || '',
      learningsAndChallenges: reportData.learningsAndChallenges || '',
      attachmentName: reportData.attachmentName || 'BaoCao.pdf',
      attachmentUrl: reportData.attachmentUrl || 'https://pdfobject.com/pdf/sample.pdf',
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString().split('T')[0],
    };

    setReports([newReport, ...reports]);
  };

  const handleUpdateStudentProfile = (updated: Partial<StudentProfile>) => {
    setStudentProfiles((prev) =>
      prev.map((s) => (s.id === currentStudent.id ? { ...s, ...updated } : s))
    );
  };

  // Company Actions
  const handlePostInternship = (posting: Partial<Internship>) => {
    const newJob: Internship = {
      id: `int-${Date.now()}`,
      companyId: currentCompany.id,
      companyName: currentCompany.companyName,
      companyLogo: currentCompany.logo,
      title: posting.title || 'Mới',
      department: posting.department || 'Phần mềm',
      location: posting.location || 'TP. HCM',
      type: 'Full-time',
      stipend: posting.stipend || '6,000,000 VNĐ',
      description: posting.description || '',
      requirements: posting.requirements || [],
      requiredSkills: posting.requiredSkills || [],
      slots: posting.slots || 5,
      filledSlots: 0,
      deadline: posting.deadline || '2026-09-01',
      createdAt: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
    };

    setInternships([newJob, ...internships]);
  };

  const handleUpdateApplicationStatus = (
    appId: string,
    status: ApplicationStatus,
    feedback?: string
  ) => {
    setApplications((prev) =>
      prev.map((a) =>
        a.id === appId
          ? {
              ...a,
              status,
              companyFeedback: feedback || a.companyFeedback,
              updatedAt: new Date().toISOString().split('T')[0],
            }
          : a
      )
    );
  };

  const handleSubmitEvaluation = (evalData: Partial<Evaluation>) => {
    const newEval: Evaluation = {
      id: `eval-${Date.now()}`,
      studentId: evalData.studentId || 'std-1',
      studentName: evalData.studentName || 'Phạm Hoàng Sơn',
      internshipId: evalData.internshipId || 'int-1',
      companyId: currentCompany.id,
      companyName: currentCompany.companyName,
      technicalScore: evalData.technicalScore || 9,
      softSkillScore: evalData.softSkillScore || 8.5,
      disciplineScore: evalData.disciplineScore || 9.5,
      overallScore: evalData.overallScore || 9,
      companyFeedback: evalData.companyFeedback || '',
      evaluatedAt: new Date().toISOString().split('T')[0],
    };

    setEvaluations([newEval, ...evaluations.filter((e) => e.studentId !== newEval.studentId)]);
  };

  // Teacher Actions
  const handleReviewReport = (reportId: string, status: WeeklyReport['status'], comment: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status, teacherComment: comment } : r))
    );
  };

  const handleSaveTeacherFeedback = (evalId: string, teacherFeedback: string) => {
    setEvaluations((prev) =>
      prev.map((e) => (e.id === evalId ? { ...e, teacherFeedback } : e))
    );
  };

  // Admin Actions
  const handleAssignTeacher = (studentId: string, teacherId: string | null) => {
    setStudentProfiles((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, assignedTeacherId: teacherId || undefined } : s))
    );

    // Update assignedStudentIds on teacher profiles
    setTeacherProfiles((prev) =>
      prev.map((t) => {
        let updatedIds = t.assignedStudentIds.filter((id) => id !== studentId);
        if (teacherId && t.id === teacherId) {
          updatedIds.push(studentId);
        }
        return { ...t, assignedStudentIds: updatedIds };
      })
    );
  };

  const handleBatchAutoAssign = () => {
    if (teacherProfiles.length === 0) return;
    const unassigned = studentProfiles.filter((s) => !s.assignedTeacherId);
    if (unassigned.length === 0) return;

    let teacherIdx = 0;
    const updatedStudents = studentProfiles.map((s) => {
      if (!s.assignedTeacherId) {
        const assignedT = teacherProfiles[teacherIdx % teacherProfiles.length];
        teacherIdx++;
        return { ...s, assignedTeacherId: assignedT.id };
      }
      return s;
    });

    setStudentProfiles(updatedStudents);

    // Sync back to teacher profiles
    setTeacherProfiles((prevTeachers) =>
      prevTeachers.map((t) => {
        const stdIds = updatedStudents
          .filter((s) => s.assignedTeacherId === t.id)
          .map((s) => s.id);
        return { ...t, assignedStudentIds: stdIds };
      })
    );
  };

  // Realtime Chat Action
  const handleSendMessage = (receiverId: string, content: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUserId,
      senderName: currentRole === 'STUDENT' ? currentStudent.fullname : currentCompany.companyName,
      senderRole: currentRole,
      receiverId,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);

    // Auto simulated reply from company/student
    setTimeout(() => {
      const autoReply: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        senderId: receiverId,
        senderName: currentRole === 'STUDENT' ? 'FPT Software HR' : 'Phạm Hoàng Sơn',
        senderRole: currentRole === 'STUDENT' ? 'COMPANY' : 'STUDENT',
        receiverId: currentUserId,
        content:
          currentRole === 'STUDENT'
            ? 'Dạ bên anh đã nhận được tin nhắn! Bộ phận Tuyển dụng FPT Software sẽ phản hồi trong ít phút.'
            : 'Em đã nhận được thông tin từ quý công ty. Em cảm ơn anh/chị!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, autoReply]);
    }, 1200);
  };

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans flex flex-col antialiased">
      {user && <SessionBanner user={user} onLogout={() => void handleLogout()} />}

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
        {currentRole === 'STUDENT' && (
          <>
            {activeTab === 'internships' && (
              <InternshipList
                internships={internships}
                studentProfile={currentStudent}
                applications={applications}
                onApply={handleApplyInternship}
              />
            )}
            {activeTab === 'applications' && (
              <StudentApplications
                applications={applications.filter((a) => a.studentId === currentStudent.id)}
                onOpenChat={() => setIsChatOpen(true)}
              />
            )}
            {activeTab === 'reports' && (
              <StudentReports
                reports={reports.filter((r) => r.studentId === currentStudent.id)}
                studentProfile={currentStudent}
                onSubmitReport={handleSubmitReport}
              />
            )}
            {activeTab === 'profile' && (
              <StudentProfileView
                profile={currentStudent}
                teacherProfiles={teacherProfiles}
                onUpdateProfile={handleUpdateStudentProfile}
                onOpenAICoach={() => setIsAICoachOpen(true)}
              />
            )}
          </>
        )}

        {/* COMPANY VIEWS */}
        {currentRole === 'COMPANY' && (
          <>
            {activeTab === 'dashboard' && (
              <CompanyDashboard
                companyProfile={currentCompany}
                internships={internships}
                applications={applications}
                onNavigateTab={setActiveTab}
                onOpenCreatePosting={() => setIsCreateJobOpen(true)}
              />
            )}
            {activeTab === 'postings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Danh Sách Tin Tuyển Dụng Thực Tập</h2>
                    <p className="text-xs text-slate-500">Quản lý các vị trí đang tuyển và tạo bài đăng mới.</p>
                  </div>
                  <button
                    onClick={() => setIsCreateJobOpen(true)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    + Đăng tuyển bài mới
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {internships
                    .filter((i) => i.companyId === currentCompany.id)
                    .map((job) => (
                      <div key={job.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                        <h3 className="font-bold text-slate-900 text-base">{job.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">{job.department} • Hạn: {job.deadline}</p>
                        <p className="text-xs text-emerald-700 font-bold mt-2">Mức hỗ trợ: {job.stipend}</p>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {job.requiredSkills.map((sk) => (
                            <span key={sk} className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded font-medium border">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            {activeTab === 'applicants' && (
              <ManageApplicants
                companyProfile={currentCompany}
                applications={applications}
                onUpdateStatus={handleUpdateApplicationStatus}
                onOpenChat={() => setIsChatOpen(true)}
              />
            )}
            {activeTab === 'interns-evaluation' && (
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
        {currentRole === 'TEACHER' && (
          <>
            {activeTab === 'students-list' && (
              <TeacherDashboard
                teacherProfile={currentTeacher}
                assignedStudents={studentProfiles}
                reports={reports}
                evaluations={evaluations}
                onNavigateTab={setActiveTab}
              />
            )}
            {activeTab === 'review-reports' && (
              <ReviewReports reports={reports} onReviewReport={handleReviewReport} />
            )}
            {activeTab === 'evaluation-list' && (
              <TeacherEvaluations
                evaluations={evaluations}
                assignedStudents={studentProfiles}
                onSaveTeacherFeedback={handleSaveTeacherFeedback}
              />
            )}
          </>
        )}

        {/* ADMIN VIEWS */}
        {currentRole === 'ADMIN' && (
          <>
            {activeTab === 'stats-dashboard' && <AdminDashboard stats={MOCK_DASHBOARD_STATS} />}
            {activeTab === 'teacher-assignment' && (
              <TeacherAssignment
                students={studentProfiles}
                teachers={teacherProfiles}
                onAssignTeacher={handleAssignTeacher}
                onBatchAutoAssign={handleBatchAutoAssign}
              />
            )}
            {activeTab === 'user-management' && (
              <UserManagement
                users={users}
                onToggleUserLock={(id) => alert(`Đã cập nhật trạng thái tài khoản ${id}`)}
              />
            )}
            {activeTab === 'company-approval' && (
              <CompanyModeration
                companies={companyProfiles}
                internships={internships}
                onToggleVerifyCompany={(cmpId) =>
                  setCompanyProfiles((prev) =>
                    prev.map((c) => (c.id === cmpId ? { ...c, verified: !c.verified } : c))
                  )
                }
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-semibold text-slate-700">
            Hệ Thống Hỗ Trợ Tìm Kiếm & Quản Lý Thực Tập Cho Sinh Viên (InternConnect) © 2026
          </p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Báo cáo đề tài thực tập tốt nghiệp</span>
            <span>•</span>
            <span className="font-mono text-blue-600 font-bold">PostgreSQL + NestJS + React</span>
          </div>
        </div>
      </footer>

      {/* Global Drawers & Modals */}
      <NotificationCenter
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) =>
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
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
    case 'STUDENT':
      return 'internships';
    case 'COMPANY':
      return 'dashboard';
    case 'TEACHER':
      return 'students-list';
    case 'ADMIN':
      return 'stats-dashboard';
  }
}
