import React, { useState } from 'react';
import { Internship, CompanyProfile } from '../../types';
import { Briefcase, X, Plus, Trash2, Calendar, DollarSign, MapPin } from 'lucide-react';

interface PostInternshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyProfile: CompanyProfile;
  onSubmitPosting: (posting: Partial<Internship>) => void;
}

export const PostInternshipModal: React.FC<PostInternshipModalProps> = ({
  isOpen,
  onClose,
  companyProfile,
  onSubmitPosting,
}) => {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Software Engineering');
  const [location, setLocation] = useState('TP. Hồ Chí Minh');
  const [stipend, setStipend] = useState('6,000,000 - 8,000,000 VNĐ / tháng');
  const [description, setDescription] = useState('');
  const [requirementInput, setRequirementInput] = useState('');
  const [requirements, setRequirements] = useState<string[]>([
    'Thành thạo lập trình TypeScript/Node.js',
    'Có kiến thức về CSDL PostgreSQL / MySQL',
  ]);
  const [skillInput, setSkillInput] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['NestJS', 'PostgreSQL', 'TypeScript', 'Docker']);
  const [slots, setSlots] = useState(5);
  const [deadline, setDeadline] = useState('2026-08-30');

  if (!isOpen) return null;

  const handleAddRequirement = () => {
    if (!requirementInput.trim()) return;
    setRequirements([...requirements, requirementInput.trim()]);
    setRequirementInput('');
  };

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    if (!requiredSkills.includes(skillInput.trim())) {
      setRequiredSkills([...requiredSkills, skillInput.trim()]);
    }
    setSkillInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmitPosting({
      companyId: companyProfile.id,
      companyName: companyProfile.companyName,
      companyLogo: companyProfile.logo,
      title,
      department,
      location,
      type: 'Full-time',
      stipend,
      description,
      requirements,
      requiredSkills,
      slots: Number(slots),
      filledSlots: 0,
      deadline,
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Đăng Bài Tuyển Dụng Thực Tập</h2>
            <p className="text-xs text-slate-500">Tạo vị trí tuyển dụng thực tập mới đăng tải lên hệ thống.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Tiêu đề vị trí tuyển dụng (*):</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Backend Developer Intern (NestJS / Node.js)"
              className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Phòng ban / Dự án:</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Địa điểm làm việc:</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Mức hỗ trợ / Lương:</label>
              <input
                type="text"
                value={stipend}
                onChange={(e) => setStipend(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Số lượng tuyển:</label>
              <input
                type="number"
                min="1"
                value={slots}
                onChange={(e) => setSlots(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Hạn nộp hồ sơ:</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Mô tả chi tiết công việc:</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nêu phạm vi công việc, trách nhiệm chính của thực tập sinh..."
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          {/* Required Skills tags */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">Kỹ năng bắt buộc (Dùng để tính Match %):</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {requiredSkills.map((sk) => (
                <span key={sk} className="bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                  {sk}
                  <button type="button" onClick={() => setRequiredSkills(requiredSkills.filter((s) => s !== sk))} className="text-emerald-400 hover:text-rose-600">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Thêm kỹ năng (ví dụ: NestJS, Docker)..."
                className="flex-1 p-2 border border-slate-300 rounded-xl"
              />
              <button type="button" onClick={handleAddSkill} className="px-3 py-2 bg-emerald-600 text-white font-bold rounded-xl">Thêm</button>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700">Hủy</button>
            <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs">Đăng tuyển ngay</button>
          </div>
        </form>
      </div>
    </div>
  );
};
