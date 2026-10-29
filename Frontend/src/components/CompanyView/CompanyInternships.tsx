import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Bookmark,
  Briefcase,
  Copy,
  Edit3,
  Eye,
  FilterX,
  Layers,
  LoaderCircle,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { CompanyInternshipStatsModal } from "./CompanyInternshipStatsModal";
import { getApiErrorMessage } from "../../auth/api";
import { useAppFeedback } from "../Feedback/AppFeedbackProvider";
import {
  internshipsApi,
  InternshipInput,
  InternshipRecord,
  RepostInternshipInput,
  MODERATION_REASON_LABELS,
} from "../../internships/api";
import {
  internshipTemplatesApi,
  InternshipTemplateRecord,
  CreateInternshipTemplateInput,
} from "../../internship-templates/api";
import { semestersApi } from "../../semesters/api";
import type { SemesterRecord } from "../../semesters/types";
import { skillsApi } from "../../skills/api";
import { SkillPicker, type SkillOption } from "../Skills/SkillPicker";

const initialInput: InternshipInput = {
  title: "",
  description: "",
  slots: 1,
  department: "",
  location: "",
  workType: "HYBRID",
  stipend: "",
  requirements: "",
  deadline: "",
  startDate: "",
  endDate: "",
  status: "DRAFT",
};

const initialTemplateInput: CreateInternshipTemplateInput = {
  name: "",
  title: "",
  description: "",
  slotsDefault: 1,
  department: "",
  location: "",
  workType: "HYBRID",
  stipend: "",
  requirements: "",
};

const internshipStatusLabel: Record<InternshipRecord["status"], string> = {
  DRAFT: "Nháp",
  OPEN: "Đang mở",
  CLOSED: "Đã đóng",
  CANCELLED: "Đã hủy",
  REJECTED: "Bị gỡ vi phạm",
};

const workTypeLabels: Record<string, string> = {
  ONSITE: "Tại công ty",
  REMOTE: "Từ xa",
  HYBRID: "Kết hợp (Hybrid)",
};

export function CompanyInternships() {
  const { confirm, notify } = useAppFeedback();
  const showToast = (opts: { message: string; tone?: string; title?: string }) => {
    notify({
      title: opts.title || (opts.tone === "negative" || opts.tone === "error" ? "Thất bại" : "Thành công"),
      message: opts.message,
      tone: opts.tone === "negative" || opts.tone === "error" ? "error" : opts.tone === "info" ? "info" : "success",
    });
  };

  // Active view tab
  const [activeTab, setActiveTab] = useState<"INTERNSHIPS" | "TEMPLATES">("INTERNSHIPS");

  // Internships list state
  const [items, setItems] = useState<InternshipRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestWarnings, setLatestWarnings] = useState<string[]>([]);

  // Templates list state
  const [templates, setTemplates] = useState<InternshipTemplateRecord[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Statistics modal state
  const [statsInternshipId, setStatsInternshipId] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [filterSkills, setFilterSkills] = useState<SkillOption[]>([]);
  const [status, setStatus] = useState("");
  const [semesterOptions, setSemesterOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [recruitingSemesters, setRecruitingSemesters] = useState<SemesterRecord[]>([]);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<InternshipInput>(initialInput);
  const [selectedSkills, setSelectedSkills] = useState<SkillOption[]>([]);

  // Save as template modal
  const [saveAsTemplateJob, setSaveAsTemplateJob] = useState<InternshipRecord | null>(null);
  const [templateNameInput, setTemplateNameInput] = useState("");

  // Repost modal
  const [repostJob, setRepostJob] = useState<InternshipRecord | null>(null);
  const [repostForm, setRepostForm] = useState<RepostInternshipInput>({
    semesterId: "",
    title: "",
    slots: 1,
    status: "DRAFT",
    deadline: "",
    startDate: "",
    endDate: "",
  });

  // Template CRUD modal (Create / Edit)
  const [editingTemplate, setEditingTemplate] = useState<InternshipTemplateRecord | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState<CreateInternshipTemplateInput>(initialTemplateInput);
  const [templateSkills, setTemplateSkills] = useState<SkillOption[]>([]);

  // Create internship from template modal
  const [instantiatingTemplate, setInstantiatingTemplate] = useState<InternshipTemplateRecord | null>(null);
  const [fromTemplateSemesterId, setFromTemplateSemesterId] = useState("");
  const [fromTemplateSlots, setFromTemplateSlots] = useState(1);
  const [fromTemplateDeadline, setFromTemplateDeadline] = useState("");
  const [fromTemplateStartDate, setFromTemplateStartDate] = useState("");
  const [fromTemplateEndDate, setFromTemplateEndDate] = useState("");
  const [fromTemplateStatus, setFromTemplateStatus] = useState<InternshipRecord["status"]>("DRAFT");

  const loadInternships = async (
    filters = {
      search,
      semesterId,
      skillIds: filterSkills.map((skill) => skill.id),
      status,
    },
  ) => {
    setLoading(true);
    setError(null);
    try {
      const [page, semesterPage] = await Promise.all([
        internshipsApi.listMine({
          page: 1,
          limit: 100,
          ...(filters.search ? { search: filters.search } : {}),
          ...(filters.semesterId ? { semesterId: filters.semesterId } : {}),
          ...(filters.skillIds.length ? { skillIds: filters.skillIds } : {}),
          ...(filters.status
            ? { status: filters.status as InternshipRecord["status"] }
            : {}),
        }),
        semestersApi.list({ page: 1, limit: 100 }),
      ]);
      setItems(page.items);
      const recruiting = semesterPage.items.filter(
        (semester) => semester.phase === "RECRUITING",
      );
      setRecruitingSemesters(recruiting);
      setSemesterOptions(
        semesterPage.items
          .map((semester) => ({ id: semester.id, name: semester.name }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const data = await internshipTemplatesApi.listMine();
      setTemplates(data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    void loadInternships();
    void loadTemplates();
  }, []);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadInternships();
  };

  const clearFilters = () => {
    const empty = {
      search: "",
      semesterId: "",
      skillIds: [] as string[],
      status: "",
    };
    setSearch("");
    setSemesterId("");
    setFilterSkills([]);
    setStatus("");
    void loadInternships(empty);
  };

  const update = (key: keyof InternshipInput, value: string | number) =>
    setForm((current) => ({ ...current, [key]: value }));

  const selectedPostingSemester =
    recruitingSemesters.find((semester) => semester.id === form.semesterId) ??
    (recruitingSemesters.length === 1 ? recruitingSemesters[0] : undefined);

  // Submit standard job creation
  const submitNewJob = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const hasStartDate = Boolean(form.startDate);
    const hasEndDate = Boolean(form.endDate);
    if (form.status === "OPEN" && (!hasStartDate || !hasEndDate)) {
      setError(
        "Khi đăng tin công khai (OPEN), bắt buộc phải nhập đầy đủ ngày bắt đầu và ngày kết thúc thực tập.",
      );
      return;
    }
    if (hasStartDate !== hasEndDate) {
      setError(
        "Hãy nhập đủ cả ngày bắt đầu và ngày kết thúc thực tập, hoặc để trống cả hai (nếu lưu nháp).",
      );
      return;
    }
    if (form.startDate && form.endDate && form.startDate >= form.endDate) {
      setError("Ngày bắt đầu thực tập phải trước ngày kết thúc.");
      return;
    }
    if (form.startDate && form.endDate && selectedPostingSemester) {
      const minimum = selectedPostingSemester.startDate.slice(0, 10);
      const maximum = selectedPostingSemester.endDate.slice(0, 10);
      if (form.startDate < minimum || form.endDate > maximum) {
        setError(
          `Thời gian thực tập phải nằm trong khung theo dõi ${minimum} – ${maximum}.`,
        );
        return;
      }
    }
    if (form.deadline && form.startDate && form.deadline >= form.startDate) {
      setError("Hạn ứng tuyển phải trước ngày bắt đầu thực tập.");
      return;
    }
    setSaving(true);
    try {
      const input: InternshipInput = {
        ...form,
        ...(recruitingSemesters.length > 1 ? { semesterId: form.semesterId } : {}),
        title: form.title.trim(),
        description: form.description.trim(),
        department: form.department?.trim() || null,
        location: form.location?.trim() || null,
        workType: form.workType?.trim() || null,
        stipend: form.stipend?.trim() || null,
        requirements: form.requirements?.trim() || null,
        deadline: form.deadline ? `${form.deadline}T23:59:59.999Z` : null,
        startDate: form.startDate ? `${form.startDate}T00:00:00.000Z` : null,
        endDate: form.endDate ? `${form.endDate}T23:59:59.999Z` : null,
      };
      const internship = await internshipsApi.create(input);
      if (selectedSkills.length) {
        await skillsApi.syncInternship(
          internship.id,
          selectedSkills.map((skill) => ({
            skillId: skill.id,
            isRequired: true,
            weight: 1,
          })),
        );
      }
      setIsFormOpen(false);
      setForm(initialInput);
      setSelectedSkills([]);
      showToast?.({ message: "Đăng tin tuyển dụng thành công!", tone: "positive" });
      await loadInternships();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  // Remove Job
  const removeJob = async (id: string) => {
    const accepted = await confirm({
      title: "Xóa bài đăng",
      message: "Xóa bài đăng này? Thao tác này không thể hoàn tác.",
      confirmLabel: "Xóa bài đăng",
      tone: "danger",
    });
    if (!accepted) return;
    try {
      await internshipsApi.remove(id);
      setItems((current) => current.filter((item) => item.id !== id));
      showToast?.({ message: "Đã xóa bài đăng tuyển dụng.", tone: "positive" });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  // Handle Save As Template
  const handleOpenSaveAsTemplate = (job: InternshipRecord) => {
    setError(null);
    setSaveAsTemplateJob(job);
    setTemplateNameInput(job.title.slice(0, 100));
  };

  const handleSaveAsTemplateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!saveAsTemplateJob) return;
    const trimmed = templateNameInput.trim();
    if (!trimmed) {
      setError("Tên mẫu tin không được để trống.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await internshipsApi.saveAsTemplate(saveAsTemplateJob.id, trimmed);
      setSaveAsTemplateJob(null);
      setTemplateNameInput("");
      showToast?.({ message: "Đã lưu vị trí vào danh sách mẫu tin thành công!", tone: "positive" });
      await loadTemplates();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  // Handle Repost
  const handleOpenRepost = (job: InternshipRecord) => {
    setError(null);
    setRepostJob(job);
    const defaultSemester = recruitingSemesters[0]?.id ?? "";
    setRepostForm({
      semesterId: defaultSemester,
      title: job.title,
      department: job.department ?? "",
      location: job.location ?? "",
      workType: job.workType ?? "HYBRID",
      stipend: job.stipend ?? "",
      slots: job.slots,
      status: "OPEN",
      deadline: job.deadline ? job.deadline.slice(0, 10) : "",
      startDate: job.startDate ? job.startDate.slice(0, 10) : "",
      endDate: job.endDate ? job.endDate.slice(0, 10) : "",
    });
  };

  const handleRepostSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!repostJob) return;
    const targetSemester = recruitingSemesters.find((s) => s.id === repostForm.semesterId);
    if (!targetSemester) {
      setError("Vui lòng chọn đợt thực tập hợp lệ.");
      return;
    }
    if (repostForm.startDate && repostForm.endDate && repostForm.startDate >= repostForm.endDate) {
      setError("Ngày bắt đầu dự kiến phải trước ngày kết thúc.");
      return;
    }
    if (repostForm.startDate && repostForm.endDate) {
      const minDate = targetSemester.startDate.slice(0, 10);
      const maxDate = targetSemester.endDate.slice(0, 10);
      if (repostForm.startDate < minDate || repostForm.endDate > maxDate) {
        setError(`Lịch theo dõi dự kiến phải nằm trong khung đợt: ${minDate} – ${maxDate}.`);
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const payload: RepostInternshipInput = {
        semesterId: repostForm.semesterId,
        title: repostForm.title?.trim(),
        department: repostForm.department?.trim() || null,
        location: repostForm.location?.trim() || null,
        workType: repostForm.workType || null,
        stipend: repostForm.stipend?.trim() || null,
        slots: Number(repostForm.slots) || 1,
        status: repostForm.status,
        deadline: repostForm.deadline ? `${repostForm.deadline}T23:59:59.999Z` : null,
        startDate: repostForm.startDate ? `${repostForm.startDate}T00:00:00.000Z` : null,
        endDate: repostForm.endDate ? `${repostForm.endDate}T23:59:59.999Z` : null,
      };
      const res = await internshipsApi.repost(repostJob.id, payload);
      if (res.warnings && res.warnings.length > 0) {
        setLatestWarnings(res.warnings);
      }
      setRepostJob(null);
      showToast?.({ message: "Đăng lại tin tuyển dụng thành công!", tone: "positive" });
      await loadInternships();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  // Open Template Modal (Create / Edit)
  const handleOpenCreateTemplate = () => {
    setError(null);
    setEditingTemplate(null);
    setTemplateForm(initialTemplateInput);
    setTemplateSkills([]);
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (tpl: InternshipTemplateRecord) => {
    setError(null);
    setEditingTemplate(tpl);
    setTemplateForm({
      name: tpl.name,
      title: tpl.title,
      description: tpl.description,
      slotsDefault: tpl.slotsDefault,
      department: tpl.department ?? "",
      location: tpl.location ?? "",
      workType: tpl.workType ?? "HYBRID",
      stipend: tpl.stipend ?? "",
      requirements: tpl.requirements ?? "",
    });
    setTemplateSkills(
      tpl.skills.map((s) => ({
        id: s.skillId,
        name: s.name,
      })),
    );
    setIsTemplateModalOpen(true);
  };

  // Submit Template (Create or Update)
  const handleTemplateFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = templateForm.name.trim();
    const trimmedTitle = templateForm.title.trim();
    const trimmedDesc = templateForm.description.trim();
    if (!trimmedName || !trimmedTitle || !trimmedDesc) {
      setError("Vui lòng nhập đầy đủ Tên mẫu tin, Tiêu đề vị trí và Mô tả.");
      return;
    }
    setSaving(true);
    try {
      const payload: CreateInternshipTemplateInput = {
        name: trimmedName,
        title: trimmedTitle,
        description: trimmedDesc,
        slotsDefault: Number(templateForm.slotsDefault) || 1,
        department: templateForm.department?.trim() || null,
        location: templateForm.location?.trim() || null,
        workType: templateForm.workType || null,
        stipend: templateForm.stipend?.trim() || null,
        requirements: templateForm.requirements?.trim() || null,
        skills: templateSkills.map((s) => ({
          skillId: s.id,
          isRequired: true,
          weight: 1,
        })),
      };

      if (editingTemplate) {
        await internshipTemplatesApi.update(editingTemplate.id, payload);
        showToast?.({ message: "Cập nhật mẫu tin thành công!", tone: "positive" });
      } else {
        await internshipTemplatesApi.create(payload);
        showToast?.({ message: "Tạo mẫu tin tuyển dụng mới thành công!", tone: "positive" });
      }
      setIsTemplateModalOpen(false);
      await loadTemplates();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  // Remove Template
  const handleRemoveTemplate = async (id: string, name: string) => {
    const accepted = await confirm({
      title: "Xóa mẫu tin tuyển dụng",
      message: `Bạn có chắc muốn xóa mẫu "${name}"? Thao tác này không ảnh hưởng đến các bài đăng đã tạo trước đây.`,
      confirmLabel: "Xóa mẫu",
      tone: "danger",
    });
    if (!accepted) return;
    try {
      await internshipTemplatesApi.remove(id);
      setTemplates((current) => current.filter((t) => t.id !== id));
      showToast?.({ message: "Đã xóa mẫu tin tuyển dụng.", tone: "positive" });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  // Handle Instantiate Job from Template
  const handleOpenFromTemplate = (tpl: InternshipTemplateRecord) => {
    setError(null);
    setInstantiatingTemplate(tpl);
    const defaultSemester = recruitingSemesters[0]?.id ?? "";
    setFromTemplateSemesterId(defaultSemester);
    setFromTemplateSlots(tpl.slotsDefault);
    setFromTemplateDeadline("");
    setFromTemplateStartDate("");
    setFromTemplateEndDate("");
    setFromTemplateStatus("OPEN");
  };

  const handleFromTemplateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!instantiatingTemplate) return;
    const targetSemester = recruitingSemesters.find((s) => s.id === fromTemplateSemesterId);
    if (!targetSemester) {
      setError("Vui lòng chọn đợt thực tập hợp lệ.");
      return;
    }
    if (fromTemplateStartDate && fromTemplateEndDate && fromTemplateStartDate >= fromTemplateEndDate) {
      setError("Ngày bắt đầu dự kiến phải trước ngày kết thúc.");
      return;
    }
    if (fromTemplateStartDate && fromTemplateEndDate) {
      const minDate = targetSemester.startDate.slice(0, 10);
      const maxDate = targetSemester.endDate.slice(0, 10);
      if (fromTemplateStartDate < minDate || fromTemplateEndDate > maxDate) {
        setError(`Lịch theo dõi dự kiến phải nằm trong khung đợt: ${minDate} – ${maxDate}.`);
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const res = await internshipTemplatesApi.createInternship(instantiatingTemplate.id, {
        semesterId: fromTemplateSemesterId,
        slots: Number(fromTemplateSlots) || 1,
        status: fromTemplateStatus,
        deadline: fromTemplateDeadline ? `${fromTemplateDeadline}T23:59:59.999Z` : null,
        startDate: fromTemplateStartDate ? `${fromTemplateStartDate}T00:00:00.000Z` : null,
        endDate: fromTemplateEndDate ? `${fromTemplateEndDate}T23:59:59.999Z` : null,
      });

      if (res.warnings && res.warnings.length > 0) {
        setLatestWarnings(res.warnings);
      }
      setInstantiatingTemplate(null);
      showToast?.({ message: "Đã tạo tin tuyển dụng từ mẫu thành công!", tone: "positive" });
      await Promise.all([loadInternships(), loadTemplates()]);
      setActiveTab("INTERNSHIPS");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Header */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("INTERNSHIPS")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                activeTab === "INTERNSHIPS"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Tin tuyển dụng</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] ${
                  activeTab === "INTERNSHIPS" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {items.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("TEMPLATES")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                activeTab === "TEMPLATES"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Mẫu tin tuyển dụng</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] ${
                  templates.length >= 20
                    ? "bg-rose-500 text-white"
                    : activeTab === "TEMPLATES"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {templates.length}/20
              </span>
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {activeTab === "INTERNSHIPS"
              ? "Quản lý bài đăng tuyển dụng, đăng lại sang đợt mới hoặc lưu làm mẫu để tái sử dụng."
              : "Bộ sưu tập mẫu tin tuyển dụng chuẩn hóa (tối đa 20 mẫu) giúp tái tạo nhanh chóng khi có đợt tuyển dụng mới."}
          </p>
        </div>

        {activeTab === "INTERNSHIPS" ? (
          <button
            disabled={!recruitingSemesters.length}
            onClick={() => setIsFormOpen(true)}
            title={
              recruitingSemesters.length
                ? "Đăng tin tuyển dụng mới"
                : "Hiện không có đợt nào trong giai đoạn tuyển dụng"
            }
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 shadow-xs transition"
          >
            <Plus className="h-4 w-4" /> Đăng bài mới
          </button>
        ) : (
          <button
            disabled={templates.length >= 20}
            onClick={handleOpenCreateTemplate}
            title={templates.length >= 20 ? "Đã đạt giới hạn tối đa 20 mẫu tin" : "Tạo mẫu tin mới"}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 shadow-xs transition"
          >
            <Plus className="h-4 w-4" /> Tạo mẫu mới ({templates.length}/20)
          </button>
        )}
      </section>

      {/* Warnings Banner if any skills were omitted */}
      {latestWarnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Lưu ý khi đồng bộ kỹ năng:</p>
                <ul className="mt-1 list-disc pl-4 space-y-1">
                  {latestWarnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              onClick={() => setLatestWarnings([])}
              className="text-amber-700 hover:text-amber-900 text-xs font-bold"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: INTERNSHIPS VIEW */}
      {activeTab === "INTERNSHIPS" && (
        <>
          <form
            onSubmit={applyFilters}
            className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs md:grid-cols-5 shadow-xs"
          >
            <label className="md:col-span-2">
              <span className="sr-only">Tìm kiếm</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-300 px-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm theo vị trí, công ty, mô tả"
                  className="w-full py-2.5 outline-none"
                />
              </div>
            </label>
            <select
              value={semesterId}
              onChange={(event) => setSemesterId(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2.5 bg-white outline-none"
            >
              <option value="">Tất cả đợt thực tập</option>
              {semesterOptions.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name}
                </option>
              ))}
            </select>
            <SkillPicker
              multiple
              selected={filterSkills}
              onChange={setFilterSkills}
              placeholder="Tìm kỹ năng để lọc..."
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2.5 bg-white outline-none"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="DRAFT">Nháp</option>
              <option value="OPEN">Đang mở</option>
              <option value="CLOSED">Đã đóng</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="REJECTED">Bị gỡ vi phạm</option>
            </select>
            <div className="flex gap-2 md:col-span-5">
              <button className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition">
                Lọc
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                <FilterX className="h-3.5 w-3.5" /> Xóa bộ lọc
              </button>
            </div>
          </form>

          {loading ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-sm text-slate-500 shadow-xs">
              <LoaderCircle className="mx-auto mb-3 h-5 w-5 animate-spin text-indigo-600" />
              Đang tải bài đăng tuyển dụng...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {items.map((job) => (
                <article
                  key={job.id}
                  className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition ${
                    job.status === "REJECTED"
                      ? "border-rose-200 ring-1 ring-rose-200/50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900 leading-snug">{job.title}</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {job.semester.name} · {job.department || "Chưa phân phòng ban"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 h-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          job.status === "OPEN"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : job.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : job.status === "DRAFT"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {internshipStatusLabel[job.status] || job.status}
                      </span>
                    </div>

                    {job.status === "REJECTED" && (
                      <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-900 shadow-xs">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-rose-900">Tin đã bị Ban quản trị gỡ vi phạm:</span>
                              {job.moderationReasonCode && (
                                <span className="inline-block rounded-md bg-rose-200/80 px-2 py-0.5 text-[10px] font-bold text-rose-900">
                                  {MODERATION_REASON_LABELS[job.moderationReasonCode] || job.moderationReasonCode}
                                </span>
                              )}
                            </div>
                            <p className="text-rose-800 leading-relaxed">
                              {job.moderationReason || "Bài đăng vi phạm quy chuẩn tuyển dụng của nhà trường hoặc nhận nhiều phản ánh tiêu cực từ sinh viên."}
                            </p>
                            <p className="text-[11px] text-rose-700 italic">
                              * Đơn ứng tuyển đang chờ/phỏng vấn đã được hoàn trả lại cho sinh viên. Vui lòng liên hệ Quản trị viên để được hướng dẫn.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {job.status === "DRAFT" && job.moderationReason && (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-900 shadow-xs">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="font-bold text-amber-900">Yêu cầu điều chỉnh từ Ban quản trị:</span>
                            <p className="text-amber-800 leading-relaxed">{job.moderationReason}</p>
                            <p className="text-[11px] text-amber-700 italic">
                              * Vui lòng cập nhật nội dung bài đăng theo đúng yêu cầu trước khi xuất bản lại.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="mt-3 text-xs text-slate-600">
                      {job.location || "Chưa có địa điểm"} · Hạn nộp:{" "}
                      {job.deadline
                        ? new Date(job.deadline).toLocaleDateString("vi-VN")
                        : "Không giới hạn"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {job.skills.map((skill) => (
                        <span
                          key={skill.skillId}
                          className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 border border-emerald-100"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-3">
                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 mb-3 gap-y-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                          <Eye className="h-3 w-3 text-blue-500" />
                          <span>{job.viewCount || 0} lượt xem</span>
                          <span className="text-slate-400 text-[10px]">({job.uniqueViewerCount || 0} SV)</span>
                        </span>
                        <span>
                          Chỉ tiêu: <strong className="text-slate-800">{job.filledSlots}/{job.slots}</strong>
                          <span className="ml-1 text-[11px] font-bold text-emerald-700">
                            ({job.slots > 0 ? Math.round((job.filledSlots / job.slots) * 100) : 0}%)
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {job.sourceTemplateId && (
                          <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                            Tạo từ mẫu
                          </span>
                        )}
                        {job.sourceInternshipId && (
                          <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-medium">
                            Đăng lại
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setStatsInternshipId(job.id)}
                        title="Xem thống kê tuyển dụng chi tiết của tin này"
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200"
                      >
                        <BarChart3 className="h-3.5 w-3.5" /> Thống kê
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenSaveAsTemplate(job)}
                        disabled={templates.length >= 20}
                        title={templates.length >= 20 ? "Đã đạt tối đa 20 mẫu" : "Lưu tin này thành mẫu chuẩn"}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition"
                      >
                        <Bookmark className="h-3.5 w-3.5 text-slate-600" /> Lưu làm mẫu
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenRepost(job)}
                        disabled={!recruitingSemesters.length}
                        title={
                          recruitingSemesters.length
                            ? "Đăng lại tin này vào đợt tuyển dụng khác"
                            : "Không có đợt tuyển dụng nào đang mở"
                        }
                        className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-1.5 font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition border border-indigo-100"
                      >
                        <Copy className="h-3.5 w-3.5" /> Đăng lại
                      </button>

                      <button
                        type="button"
                        onClick={() => void removeJob(job.id)}
                        className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Xóa
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-sm text-slate-500 shadow-xs">
              Chưa có bài đăng tuyển dụng nào.
            </div>
          )}
        </>
      )}

      {/* TAB 2: TEMPLATES VIEW */}
      {activeTab === "TEMPLATES" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>
              Tổng số mẫu đã lưu: <strong>{templates.length}</strong> / 20 mẫu tối đa
            </span>
            {templates.length >= 20 && (
              <span className="text-rose-600 font-bold">
                (Đã chạm hạn mức 20 mẫu. Xóa bớt mẫu cũ nếu muốn tạo mới)
              </span>
            )}
          </div>

          {loadingTemplates ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-sm text-slate-500 shadow-xs">
              <LoaderCircle className="mx-auto mb-3 h-5 w-5 animate-spin text-indigo-600" />
              Đang tải danh sách mẫu tin...
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-sm text-slate-500 shadow-xs">
              <Layers className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="font-bold text-slate-700">Chưa có mẫu tin tuyển dụng nào</p>
              <p className="mt-1 text-xs text-slate-400">
                Lưu tin từ danh sách bài đăng hoặc bấm "Tạo mẫu mới" để sẵn sàng cho các đợt tuyển sau.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {templates.map((tpl) => (
                <article
                  key={tpl.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition"
                >
                  <div>
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <span className="inline-block rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
                          Mẫu: {tpl.name}
                        </span>
                        <h3 className="mt-1 font-bold text-slate-900 leading-snug">{tpl.title}</h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {tpl.department || "Chưa phân phòng"} · {workTypeLabels[tpl.workType || ""] || "Linh hoạt"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        Đã dùng: {tpl.usageCount} lần
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-600">
                      {tpl.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {tpl.skills.map((skill) => (
                        <span
                          key={skill.skillId}
                          className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 border border-emerald-100"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
                      <span>Chỉ tiêu chuẩn: <strong>{tpl.slotsDefault}</strong></span>
                      {tpl.stipend && <span>Trợ cấp: <strong>{tpl.stipend}</strong></span>}
                      {tpl.location && <span>Địa điểm: <strong>{tpl.location}</strong></span>}
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Cập nhật: {new Date(tpl.updatedAt).toLocaleDateString("vi-VN")}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenFromTemplate(tpl)}
                        disabled={!recruitingSemesters.length}
                        title={
                          recruitingSemesters.length
                            ? "Khởi tạo tin tuyển dụng ngay vào đợt đang mở"
                            : "Không có đợt tuyển nào đang mở"
                        }
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-xs"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Tạo tin từ mẫu
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditTemplate(tpl)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                        title="Chỉnh sửa mẫu"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleRemoveTemplate(tpl.id, tpl.name)}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                        title="Xóa mẫu"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: CREATE JOB (TRADITIONAL) ================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={(event) => void submitNewJob(event)}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Đăng vị trí thực tập</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Chọn lưu nháp hoặc công khai tuyển dụng ngay.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
              {recruitingSemesters.length === 1 ? (
                <>
                  Tin tuyển dụng sẽ tự động áp dụng cho đợt:{" "}
                  <strong>{recruitingSemesters[0].name}</strong>. Giai đoạn tuyển kết thúc khi bắt đầu theo dõi vào{" "}
                  {new Date(recruitingSemesters[0].startDate).toLocaleDateString("vi-VN")}.
                </>
              ) : recruitingSemesters.length > 1 ? (
                <>Có nhiều đợt đang tuyển dụng. Vui lòng chọn đợt áp dụng cho tin này.</>
              ) : (
                <>Hiện không có đợt nào trong giai đoạn tuyển dụng. Không thể tạo hoặc công khai tin mới.</>
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
              {recruitingSemesters.length > 1 && (
                <label className="font-bold md:col-span-2">
                  Đợt thực tập *
                  <select
                    required
                    value={form.semesterId ?? ""}
                    onChange={(event) => update("semesterId", event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal bg-white"
                  >
                    <option value="" disabled>
                      Chọn đợt thực tập
                    </option>
                    {recruitingSemesters.map((semester) => (
                      <option key={semester.id} value={semester.id}>
                        {semester.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <Field
                label="Tên vị trí *"
                value={form.title}
                onChange={(value) => update("title", value)}
                required
              />
              <Field
                label="Phòng ban"
                value={form.department ?? ""}
                onChange={(value) => update("department", value)}
              />
              <Field
                label="Địa điểm"
                value={form.location ?? ""}
                onChange={(value) => update("location", value)}
              />
              <label className="font-bold">
                Hình thức làm việc
                <select
                  value={form.workType ?? ""}
                  onChange={(event) => update("workType", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 font-normal"
                >
                  <option value="">Chưa xác định</option>
                  <option value="ONSITE">Làm việc tại công ty</option>
                  <option value="REMOTE">Làm việc từ xa</option>
                  <option value="HYBRID">Kết hợp tại công ty và từ xa</option>
                </select>
              </label>
              <Field
                label="Trợ cấp"
                value={form.stipend ?? ""}
                onChange={(value) => update("stipend", value)}
              />
              <Field
                label="Số lượng *"
                type="number"
                value={String(form.slots)}
                onChange={(value) => update("slots", Number(value))}
                required
              />
              <Field
                label="Hạn ứng tuyển"
                type="date"
                value={form.deadline ?? ""}
                onChange={(value) => update("deadline", value)}
              />
              <Field
                label={
                  form.status === "OPEN"
                    ? "Bắt đầu thực tập *"
                    : "Bắt đầu thực tập"
                }
                type="date"
                required={form.status === "OPEN"}
                min={selectedPostingSemester?.startDate.slice(0, 10)}
                max={selectedPostingSemester?.endDate.slice(0, 10)}
                value={form.startDate ?? ""}
                onChange={(value) => update("startDate", value)}
              />
              <Field
                label={
                  form.status === "OPEN"
                    ? "Kết thúc thực tập *"
                    : "Kết thúc thực tập"
                }
                type="date"
                required={form.status === "OPEN"}
                min={selectedPostingSemester?.startDate.slice(0, 10)}
                max={selectedPostingSemester?.endDate.slice(0, 10)}
                value={form.endDate ?? ""}
                onChange={(value) => update("endDate", value)}
              />
              <p className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-blue-800 md:col-span-2">
                Thời gian thực tập này bắt buộc khi công khai tin (OPEN), phải
                nằm trong khung theo dõi của đợt thực tập và sẽ được áp dụng tự
                động vào hồ sơ thực tập (Placement) khi sinh viên xác nhận nhận
                việc.
              </p>
              <label className="font-bold md:col-span-2">
                Mô tả *
                <textarea
                  required
                  rows={4}
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal"
                />
              </label>
              <label className="font-bold md:col-span-2">
                Yêu cầu khác
                <textarea
                  rows={3}
                  value={form.requirements ?? ""}
                  onChange={(event) => update("requirements", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal"
                />
              </label>
              <label className="font-bold">
                Trạng thái
                <select
                  value={form.status}
                  onChange={(event) => update("status", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal bg-white"
                >
                  <option value="DRAFT">Lưu nháp</option>
                  <option value="OPEN">Công khai</option>
                </select>
              </label>
              <fieldset className="md:col-span-2">
                <legend className="font-bold">Kỹ năng yêu cầu</legend>
                <SkillPicker
                  multiple
                  selected={selectedSkills}
                  onChange={setSelectedSkills}
                  placeholder="Tìm và thêm kỹ năng..."
                  className="mt-1"
                />
              </fieldset>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                disabled={
                  saving ||
                  !recruitingSemesters.length ||
                  (recruitingSemesters.length > 1 && !form.semesterId)
                }
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50 shadow-xs"
              >
                {saving ? "Đang lưu..." : "Lưu bài đăng"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: SAVE AS TEMPLATE ================= */}
      {saveAsTemplateJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={(e) => void handleSaveAsTemplateSubmit(e)}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Lưu làm mẫu tin tuyển dụng</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Lưu thông tin vị trí "{saveAsTemplateJob.title}" thành mẫu để dùng cho các đợt tuyển sau.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSaveAsTemplateJob(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <label className="block">
                <span className="font-bold text-slate-800">Tên mẫu tin *</span>
                <input
                  required
                  autoFocus
                  maxLength={100}
                  value={templateNameInput}
                  onChange={(e) => setTemplateNameInput(e.target.value)}
                  placeholder="Ví dụ: Mẫu tuyển Thực tập sinh Backend Node.js"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-indigo-500"
                />
              </label>

              <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3 text-[11px] text-slate-600">
                <p>
                  <strong>Kỹ năng sẽ lưu:</strong>{" "}
                  {saveAsTemplateJob.skills.length > 0
                    ? saveAsTemplateJob.skills.map((s) => s.name).join(", ")
                    : "Không có kỹ năng"}
                </p>
                <p className="mt-1">
                  <strong>Số lượng mặc định:</strong> {saveAsTemplateJob.slots}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSaveAsTemplateJob(null)}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving || !templateNameInput.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 shadow-xs"
              >
                <Bookmark className="h-4 w-4" />
                {saving ? "Đang lưu..." : "Lưu mẫu"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: REPOST TO ANOTHER SEMESTER ================= */}
      {repostJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={(e) => void handleRepostSubmit(e)}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Đăng lại vào đợt thực tập khác</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Nhân bản vị trí "{repostJob.title}" sang học kỳ tuyển dụng mới.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRepostJob(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
              <label className="font-bold md:col-span-2">
                Chọn đợt thực tập tiếp theo *
                <select
                  required
                  value={repostForm.semesterId}
                  onChange={(e) => setRepostForm((c) => ({ ...c, semesterId: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal bg-white"
                >
                  <option value="" disabled>
                    -- Chọn đợt tuyển dụng --
                  </option>
                  {recruitingSemesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({new Date(s.startDate).toLocaleDateString("vi-VN")} –{" "}
                      {new Date(s.endDate).toLocaleDateString("vi-VN")})
                    </option>
                  ))}
                </select>
              </label>

              <Field
                label="Tiêu đề bài đăng *"
                value={repostForm.title ?? ""}
                onChange={(val) => setRepostForm((c) => ({ ...c, title: val }))}
                required
              />

              <Field
                label="Số lượng tuyển *"
                type="number"
                value={String(repostForm.slots ?? 1)}
                onChange={(val) => setRepostForm((c) => ({ ...c, slots: Number(val) }))}
                required
              />

              <Field
                label="Hạn nộp hồ sơ"
                type="date"
                value={repostForm.deadline ?? ""}
                onChange={(val) => setRepostForm((c) => ({ ...c, deadline: val }))}
              />

              <label className="font-bold">
                Trạng thái đăng
                <select
                  value={repostForm.status}
                  onChange={(e) =>
                    setRepostForm((c) => ({
                      ...c,
                      status: e.target.value as InternshipRecord["status"],
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal bg-white"
                >
                  <option value="DRAFT">Lưu nháp</option>
                  <option value="OPEN">Công khai ngay</option>
                </select>
              </label>

              <Field
                label="Bắt đầu theo dõi dự kiến"
                type="date"
                value={repostForm.startDate ?? ""}
                onChange={(val) => setRepostForm((c) => ({ ...c, startDate: val }))}
              />

              <Field
                label="Kết thúc theo dõi dự kiến"
                type="date"
                value={repostForm.endDate ?? ""}
                onChange={(val) => setRepostForm((c) => ({ ...c, endDate: val }))}
              />

              <div className="md:col-span-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-600">
                <p>
                  <strong>Kỹ năng sao chép:</strong>{" "}
                  {repostJob.skills.length > 0
                    ? repostJob.skills.map((s) => s.name).join(", ")
                    : "Không có kỹ năng"}
                </p>
                <p className="mt-0.5 text-slate-400">
                  (Hệ thống sẽ tự động lọc bỏ các kỹ năng đã bị quản trị viên gỡ khỏi danh mục)
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRepostJob(null)}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving || !repostForm.semesterId}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 shadow-xs"
              >
                <Copy className="h-4 w-4" />
                {saving ? "Đang xử lý..." : "Xác nhận đăng lại"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT TEMPLATE ================= */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={(e) => void handleTemplateFormSubmit(e)}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingTemplate ? "Chỉnh sửa mẫu tin" : "Tạo mẫu tin tuyển dụng mới"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Mẫu tin giúp chuẩn hóa yêu cầu tuyển dụng để tái sử dụng xuyên suốt các học kỳ.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
              <Field
                label="Tên mẫu gợi nhớ *"
                value={templateForm.name}
                onChange={(val) => setTemplateForm((c) => ({ ...c, name: val }))}
                placeholder="Ví dụ: Backend Java Fresher"
                required
              />

              <Field
                label="Tiêu đề bài đăng *"
                value={templateForm.title}
                onChange={(val) => setTemplateForm((c) => ({ ...c, title: val }))}
                placeholder="Ví dụ: Thực tập sinh Lập trình Java Backend"
                required
              />

              <Field
                label="Phòng ban"
                value={templateForm.department ?? ""}
                onChange={(val) => setTemplateForm((c) => ({ ...c, department: val }))}
              />

              <Field
                label="Địa điểm làm việc"
                value={templateForm.location ?? ""}
                onChange={(val) => setTemplateForm((c) => ({ ...c, location: val }))}
              />

              <label className="font-bold">
                Hình thức làm việc
                <select
                  value={templateForm.workType ?? ""}
                  onChange={(e) => setTemplateForm((c) => ({ ...c, workType: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 font-normal"
                >
                  <option value="ONSITE">Làm việc tại công ty</option>
                  <option value="REMOTE">Làm việc từ xa</option>
                  <option value="HYBRID">Kết hợp (Hybrid)</option>
                </select>
              </label>

              <Field
                label="Mức trợ cấp"
                value={templateForm.stipend ?? ""}
                onChange={(val) => setTemplateForm((c) => ({ ...c, stipend: val }))}
                placeholder="Ví dụ: 3.000.000 - 5.000.000 VNĐ"
              />

              <Field
                label="Số lượng tuyển mặc định *"
                type="number"
                value={String(templateForm.slotsDefault ?? 1)}
                onChange={(val) => setTemplateForm((c) => ({ ...c, slotsDefault: Number(val) }))}
                required
              />

              <label className="font-bold md:col-span-2">
                Mô tả công việc *
                <textarea
                  required
                  rows={4}
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm((c) => ({ ...c, description: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal"
                  placeholder="Nêu chi tiết trách nhiệm và nội dung thực tập..."
                />
              </label>

              <label className="font-bold md:col-span-2">
                Yêu cầu công việc
                <textarea
                  rows={3}
                  value={templateForm.requirements ?? ""}
                  onChange={(e) => setTemplateForm((c) => ({ ...c, requirements: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal"
                  placeholder="Kiến thức nền tảng, GPA hoặc kỹ năng mềm mong muốn..."
                />
              </label>

              <fieldset className="md:col-span-2">
                <legend className="font-bold">Kỹ năng chuyên môn chuẩn hóa</legend>
                <SkillPicker
                  multiple
                  selected={templateSkills}
                  onChange={setTemplateSkills}
                  placeholder="Chọn kỹ năng có sẵn từ danh mục..."
                  className="mt-1"
                />
              </fieldset>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                disabled={saving}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 shadow-xs"
              >
                {saving ? "Đang lưu..." : editingTemplate ? "Lưu thay đổi" : "Tạo mẫu tin"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: CREATE JOB FROM TEMPLATE ================= */}
      {instantiatingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={(e) => void handleFromTemplateSubmit(e)}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Tạo tin tuyển dụng từ mẫu</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Áp dụng mẫu "{instantiatingTemplate.name}" cho đợt tuyển dụng.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInstantiatingTemplate(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
              <label className="font-bold md:col-span-2">
                Đợt tuyển dụng áp dụng *
                <select
                  required
                  value={fromTemplateSemesterId}
                  onChange={(e) => setFromTemplateSemesterId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal bg-white"
                >
                  <option value="" disabled>
                    -- Chọn đợt tuyển dụng --
                  </option>
                  {recruitingSemesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({new Date(s.startDate).toLocaleDateString("vi-VN")} –{" "}
                      {new Date(s.endDate).toLocaleDateString("vi-VN")})
                    </option>
                  ))}
                </select>
              </label>

              <Field
                label="Số lượng tuyển đợt này *"
                type="number"
                value={String(fromTemplateSlots)}
                onChange={(val) => setFromTemplateSlots(Number(val))}
                required
              />

              <label className="font-bold">
                Trạng thái đăng
                <select
                  value={fromTemplateStatus}
                  onChange={(e) =>
                    setFromTemplateStatus(e.target.value as InternshipRecord["status"])
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal bg-white"
                >
                  <option value="DRAFT">Lưu nháp</option>
                  <option value="OPEN">Công khai ngay</option>
                </select>
              </label>

              <Field
                label="Hạn nộp hồ sơ"
                type="date"
                value={fromTemplateDeadline}
                onChange={setFromTemplateDeadline}
              />

              <Field
                label="Bắt đầu theo dõi dự kiến"
                type="date"
                value={fromTemplateStartDate}
                onChange={setFromTemplateStartDate}
              />

              <Field
                label="Kết thúc theo dõi dự kiến"
                type="date"
                value={fromTemplateEndDate}
                onChange={setFromTemplateEndDate}
              />

              <div className="md:col-span-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-600">
                <p>
                  <strong>Vị trí:</strong> {instantiatingTemplate.title} (
                  {instantiatingTemplate.department || "Không phân phòng"})
                </p>
                <p className="mt-1">
                  <strong>Kỹ năng trong mẫu:</strong>{" "}
                  {instantiatingTemplate.skills.length > 0
                    ? instantiatingTemplate.skills.map((s) => s.name).join(", ")
                    : "Không có"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setInstantiatingTemplate(null)}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving || !fromTemplateSemesterId}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-xs"
              >
                <Sparkles className="h-4 w-4" />
                {saving ? "Đang tạo..." : "Xác nhận tạo bài đăng"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal thống kê chi tiết tuyển dụng */}
      {statsInternshipId && (
        <CompanyInternshipStatsModal
          internshipId={statsInternshipId}
          onClose={() => setStatsInternshipId(null)}
        />
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  min?: string;
  max?: string;
}) {
  return (
    <label className="font-bold">
      {label}
      <input
        required={required}
        type={type}
        min={min}
        max={max}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal outline-none focus:border-indigo-500"
      />
    </label>
  );
}
