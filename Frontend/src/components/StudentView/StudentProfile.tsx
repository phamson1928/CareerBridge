import React, { useState } from 'react';
import { StudentProfile, TeacherProfile } from '../../types';
import { User, GraduationCap, Award, FileText, Plus, Trash2, Edit3, Save, Sparkles, Code, Check, UserCheck } from 'lucide-react';

interface StudentProfileViewProps {
  profile: StudentProfile;
  teacherProfiles?: TeacherProfile[];
  onUpdateProfile: (updated: Partial<StudentProfile>) => void;
  onOpenAICoach: () => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  profile,
  teacherProfiles,
  onUpdateProfile,
  onOpenAICoach,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fullname, setFullname] = useState(profile.fullname);
  const [major, setMajor] = useState(profile.major);
  const [gpa, setGpa] = useState(profile.gpa);
  const [summary, setSummary] = useState(profile.summary || '');
  const [newSkill, setNewSkill] = useState('');
  const [skills, setSkills] = useState<string[]>(profile.skills);

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (!skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSave = () => {
    onUpdateProfile({
      fullname,
      major,
      gpa: Number(gpa),
      summary,
      skills,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-md">
              {profile.fullname.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{profile.fullname}</h2>
              <p className="text-xs font-semibold text-blue-600 flex items-center gap-1 mt-0.5">
                <GraduationCap className="w-4 h-4" /> MSSV: {profile.studentCode} • {profile.major}
              </p>
              <p className="text-xs text-slate-500 mt-1">{profile.university}</p>
              {profile.assignedTeacherId && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg text-xs font-semibold">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    GVHD:{' '}
                    {teacherProfiles?.find((t) => t.id === profile.assignedTeacherId)?.fullname ||
                      'TS. Nguyễn Văn Anh'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAICoach}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> AI CV Coach
            </button>
            {isEditing ? (
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Save className="w-4 h-4" /> Lưu thay đổi
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Edit3 className="w-4 h-4" /> Chỉnh sửa
              </button>
            )}
          </div>
        </div>

        {/* Edit / View Info */}
        <div className="mt-6 space-y-6">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Họ và tên:</label>
                <input
                  type="text"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Ngành học:</label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Điểm GPA tích lũy:</label>
                <input
                  type="number"
                  step="0.01"
                  value={gpa}
                  onChange={(e) => setGpa(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-800 mb-1">Tóm tắt mục tiêu & bản thân:</label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Tóm tắt mục tiêu & định hướng:</h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {profile.summary || 'Chưa cập nhật tóm tắt bản thân.'}
              </p>
            </div>
          )}

          {/* Skill Tag Management */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Code className="w-4 h-4 text-blue-600" /> Kỹ Năng Chuyên Môn ({skills.length})
              </h3>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map((sk) => (
                <span
                  key={sk}
                  className="bg-blue-50 text-blue-800 text-xs font-semibold px-3 py-1 rounded-xl border border-blue-200 flex items-center gap-1.5"
                >
                  {sk}
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveSkill(sk)}
                      className="text-blue-400 hover:text-rose-600"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>

            {isEditing && (
              <div className="flex items-center gap-2 max-w-md">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Thêm kỹ năng mới (ví dụ: Docker, Redis)..."
                  className="flex-1 p-2 border border-slate-300 rounded-xl text-xs"
                />
                <button
                  onClick={handleAddSkill}
                  className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  Thêm
                </button>
              </div>
            )}
          </div>

          {/* Projects */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-3">Dự Án Cá Nhân Tiêu Biểu:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.projects?.map((proj, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <h4 className="font-bold text-slate-900 text-sm">{proj.name}</h4>
                  <p className="text-slate-600 mt-1 leading-relaxed">{proj.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {proj.techStack.map((tech) => (
                      <span key={tech} className="bg-white text-slate-700 px-2 py-0.5 rounded text-[10px] border border-slate-200 font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CV Attachment Box */}
          <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Hồ Sơ CV Hiện Tại:</h4>
                <p className="text-xs text-indigo-900 font-semibold">{profile.cvName || 'Pham_Hoang_Son_CV.pdf'}</p>
              </div>
            </div>

            <a
              href={profile.cvUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-white text-indigo-700 font-bold rounded-xl text-xs shadow-2xs border border-indigo-200 hover:bg-indigo-100 transition-colors"
            >
              Xem / Tải CV (.pdf)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
