import { ModalPortal } from "../ModalPortal";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Bookmark,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  DollarSign,
  Edit3,
  Eye,
  FilterX,
  Globe,
  GraduationCap,
  HelpCircle,
  Info,
  Layers,
  LayoutGrid,
  List,
  LoaderCircle,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
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
import { findDefaultSemester } from "../../semesters/utils";
import { skillsApi } from "../../skills/api";
import { SkillPicker, type SkillOption } from "../Skills/SkillPicker";
import { facultiesApi } from "../../organization/api";
import type { FacultyOption } from "../../organization/types";

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
  majorIds: [],
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

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Tất cả trạng thái", color: "bg-slate-400" },
  { value: "OPEN", label: "Đang mở", color: "bg-emerald-500" },
  { value: "DRAFT", label: "Nháp", color: "bg-amber-500" },
  { value: "CLOSED", label: "Đã đóng", color: "bg-slate-500" },
  { value: "CANCELLED", label: "Đã hủy", color: "bg-rose-500" },
  { value: "REJECTED", label: "Bị gỡ vi phạm", color: "bg-red-600" },
];

const workTypeLabels: Record<string, string> = {
  ONSITE: "Tại công ty",
  REMOTE: "Từ xa",
  HYBRID: "Kết hợp (Hybrid)",
};

function formatDateVi(dateStr?: string | null): string {
  if (!dateStr) return "Không giới hạn";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

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
  const [selectedDetailJob, setSelectedDetailJob] = useState<InternshipRecord | null>(null);
  const [moderationDetailJob, setModerationDetailJob] = useState<InternshipRecord | null>(null);

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
  const [filterMajorId, setFilterMajorId] = useState("");
  const [status, setStatus] = useState("");
  const [semesterOptions, setSemesterOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [allSemesters, setAllSemesters] = useState<SemesterRecord[]>([]);
  const [recruitingSemesters, setRecruitingSemesters] = useState<SemesterRecord[]>([]);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);

  // Custom filter dropdowns state
  const [openDropdown, setOpenDropdown] = useState<"SEMESTER" | "MAJOR" | "STATUS" | null>(null);
  const filterDropdownsRef = useRef<HTMLDivElement>(null);
  const [isHeaderSemesterOpen, setIsHeaderSemesterOpen] = useState(false);
  const headerSemesterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openDropdown && !isHeaderSemesterOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filterDropdownsRef.current && !filterDropdownsRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
      if (headerSemesterRef.current && !headerSemesterRef.current.contains(e.target as Node)) {
        setIsHeaderSemesterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown, isHeaderSemesterOpen]);

  // Pagination state (Admin style)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const isFirstMount = useRef(true);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [form, setForm] = useState<InternshipInput>(initialInput);
  const [selectedSkills, setSelectedSkills] = useState<SkillOption[]>([]);
  const [selectedMajorIds, setSelectedMajorIds] = useState<string[]>([]);

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
    majorIds: [],
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
  const [fromTemplateMajorIds, setFromTemplateMajorIds] = useState<string[]>([]);

  const loadInternships = async (
    targetPage = 1,
    filters?: {
      search?: string;
      semesterId?: string;
      skillIds?: string[];
      majorId?: string;
      status?: string;
    },
  ) => {
    setLoading(true);
    setError(null);
    try {
      const activeSearch = filters?.search !== undefined ? filters.search : search;
      const activeSemesterId = filters?.semesterId !== undefined ? filters.semesterId : semesterId;
      const activeSkillIds = filters?.skillIds !== undefined ? filters.skillIds : filterSkills.map((s) => s.id);
      const activeMajorId = filters?.majorId !== undefined ? filters.majorId : filterMajorId;
      const activeStatus = filters?.status !== undefined ? filters.status : status;

      const [resPage, semesterPage] = await Promise.all([
        internshipsApi.listMine({
          page: targetPage,
          limit: 10,
          ...(activeSearch.trim() ? { search: activeSearch.trim() } : {}),
          ...(activeSemesterId ? { semesterId: activeSemesterId } : {}),
          ...(activeSkillIds.length ? { skillIds: activeSkillIds } : {}),
          ...(activeMajorId ? { majorId: activeMajorId } : {}),
          ...(activeStatus
            ? { status: activeStatus as InternshipRecord["status"] }
            : {}),
        }),
        semestersApi.list({ page: 1, limit: 100 }),
      ]);

      setItems(resPage.items);
      setPage(targetPage);
      setTotalItems(resPage.pagination?.total ?? resPage.items.length);
      setTotalPages(Math.max(1, resPage.pagination?.totalPages ?? 1));

      const recruiting = semesterPage.items.filter(
        (semester) => semester.phase === "RECRUITING",
      );
      setAllSemesters(semesterPage.items);
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

  // Debounced search: Tự động đổi ngay sau 350ms khi gõ
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void loadInternships(1, { search });
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const semesterPage = await semestersApi.list({ page: 1, limit: 100 });
        if (!active) return;
        const recruiting = semesterPage.items.filter(
          (semester) => semester.phase === "RECRUITING",
        );
        setAllSemesters(semesterPage.items);
        setRecruitingSemesters(recruiting);
        setSemesterOptions(
          semesterPage.items
            .map((semester) => ({ id: semester.id, name: semester.name }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        const def = findDefaultSemester(semesterPage.items, "COMPANY");
        const defaultSemId = def ? def.id : "";
        if (defaultSemId) setSemesterId(defaultSemId);
        void loadInternships(1, {
          search,
          semesterId: defaultSemId,
          skillIds: filterSkills.map((skill) => skill.id),
          majorId: filterMajorId,
          status,
        });
      } catch {
        void loadInternships(1);
      }
    };
    void init();
    void loadTemplates();
    facultiesApi
      .listOptions({ includeInactive: false })
      .then((data) => setFaculties(data.items))
      .catch(() => setFaculties([]));
    return () => {
      active = false;
    };
  }, []);

  const clearFilters = () => {
    setSearch("");
    setSemesterId("");
    setFilterSkills([]);
    setFilterMajorId("");
    setStatus("");
    void loadInternships(1, {
      search: "",
      semesterId: "",
      skillIds: [],
      majorId: "",
      status: "",
    });
  };

  const hasActiveFilter = Boolean(
    search.trim() || semesterId || filterMajorId || status,
  );

  const openCreateJobModal = () => {
    setError(null);
    setEditingJobId(null);
    setForm(initialInput);
    setSelectedSkills([]);
    setSelectedMajorIds([]);
    setIsFormOpen(true);
  };

  const openEditJobModal = (job: InternshipRecord) => {
    setError(null);
    setEditingJobId(job.id);
    setForm({
      semesterId: job.semesterId,
      title: job.title,
      description: job.description,
      slots: job.slots,
      department: job.department ?? "",
      location: job.location ?? "",
      workType: job.workType ?? "HYBRID",
      stipend: job.stipend ?? "",
      requirements: job.requirements ?? "",
      deadline: job.deadline ? job.deadline.slice(0, 10) : "",
      startDate: job.startDate ? job.startDate.slice(0, 10) : "",
      endDate: job.endDate ? job.endDate.slice(0, 10) : "",
      status: job.status === "REJECTED" || job.status === "CANCELLED" ? "DRAFT" : job.status,
      majorIds: (job.majors ?? []).map((m) => m.majorId),
    });
    setSelectedSkills(
      job.skills.map((s) => ({
        id: s.skillId,
        name: s.name,
      })),
    );
    setSelectedMajorIds((job.majors ?? []).map((m) => m.majorId));
    setIsFormOpen(true);
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
        majorIds: selectedMajorIds,
      };
      if (editingJobId) {
        const internship = await internshipsApi.update(editingJobId, input);
        await skillsApi.syncInternship(
          internship.id,
          selectedSkills.map((skill) => ({
            skillId: skill.id,
            isRequired: true,
            weight: 1,
          })),
        );
        showToast?.({ message: "Cập nhật bài đăng tuyển dụng thành công!", tone: "positive" });
      } else {
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
        showToast?.({ message: "Đăng tin tuyển dụng thành công!", tone: "positive" });
      }
      setIsFormOpen(false);
      setEditingJobId(null);
      setForm(initialInput);
      setSelectedSkills([]);
      setSelectedMajorIds([]);
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
      majorIds: (job.majors ?? [])
        .filter((m) => m.isActive)
        .map((m) => m.majorId),
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
        majorIds: repostForm.majorIds ?? [],
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
    setFromTemplateMajorIds([]);
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
        majorIds: fromTemplateMajorIds,
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
    <div className="admin-page admin-page--feature space-y-6">
      {/* Box Quản lý tin tuyển dụng (kèm bộ lọc học kỳ và thanh tiến trình đơn giản) */}
      <div className="relative z-30 rounded-2xl bg-[#f8fafd] p-3.5 sm:p-4 text-slate-900 shadow-xs border border-slate-200/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h1 className="!text-xl sm:!text-2xl font-extrabold text-[#006f72] tracking-tight">
              Tin tuyển dụng & Mẫu vị trí thực tập
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {activeTab === "INTERNSHIPS"
                ? "Quản lý bài đăng tuyển dụng, đăng lại sang đợt mới hoặc lưu làm mẫu để tái sử dụng."
                : "Bộ sưu tập mẫu tin tuyển dụng chuẩn hóa (tối đa 20 mẫu) giúp tái tạo nhanh chóng khi có đợt tuyển dụng mới."}
            </p>
          </div>

          {/* Right Controls: Bộ lọc học kỳ + Nút Đăng/Tạo */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Bộ lọc học kỳ trong Header Box */}
            <div className="relative z-40" ref={headerSemesterRef}>
              <button
                type="button"
                onClick={() => setIsHeaderSemesterOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full bg-white/95 hover:bg-white backdrop-blur-md border border-[#a5dfe4] hover:border-[#038b95] px-3.5 py-1.5 text-xs font-bold text-[#02636a] shadow-2xs transition-all cursor-pointer"
                title="Lọc bài đăng theo đợt thực tập"
              >
                <Calendar className="h-3.5 w-3.5 text-[#038b95] shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-[320px]">
                  {semesterId
                    ? semesterOptions.find((s) => s.id === semesterId)?.name.replace(/\s*\[.*?\]/g, "").trim()
                    : "Tất cả đợt thực tập"}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-[#038b95] shrink-0 transition-transform duration-200 ${
                    isHeaderSemesterOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isHeaderSemesterOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-[340px] sm:w-[370px] max-w-[92vw] rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-2xl no-scrollbar max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                    Chọn đợt thực tập
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSemesterId("");
                      setIsHeaderSemesterOpen(false);
                      void loadInternships(1, { semesterId: "" });
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                      !semesterId
                        ? "bg-[#e0f4f6] text-[#02636a] font-extrabold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-[#038b95]" />
                      <span>Tất cả đợt thực tập</span>
                    </span>
                    {!semesterId && <Check className="h-3.5 w-3.5 text-[#038b95] shrink-0" />}
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  {semesterOptions.map((s) => {
                    const isSelected = s.id === semesterId;
                    const cleanName = s.name.replace(/\s*\[.*?\]/g, "").trim();
                    const semRecord = allSemesters.find((item) => item.id === s.id);
                    const phase = semRecord?.phase;

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSemesterId(s.id);
                          setIsHeaderSemesterOpen(false);
                          void loadInternships(1, { semesterId: s.id });
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                          isSelected
                            ? "bg-[#e0f4f6] text-[#02636a] font-extrabold"
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold"
                        }`}
                      >
                        <span className="font-semibold text-xs whitespace-nowrap text-slate-800 truncate">{cleanName}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {phase && (
                            <span
                              className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9.5px] font-bold ${
                                phase === "RECRUITING"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : phase === "ONGOING" || phase === "MONITORING"
                                  ? "bg-sky-50 text-sky-700 border border-sky-200"
                                  : phase === "UPCOMING"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {phase === "RECRUITING"
                                ? "Đang tuyển dụng"
                                : phase === "ONGOING" || phase === "MONITORING"
                                ? "Hiện tại"
                                : phase === "UPCOMING"
                                ? "Sắp diễn ra"
                                : "Đã kết thúc"}
                            </span>
                          )}
                          {isSelected && <Check className="h-3.5 w-3.5 text-[#038b95] shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Header Action Button */}
            {activeTab === "INTERNSHIPS" ? (
              <button
                disabled={!recruitingSemesters.length}
                onClick={openCreateJobModal}
                title={
                  recruitingSemesters.length
                    ? "Đăng tin tuyển dụng mới"
                    : "Hiện không có đợt nào trong giai đoạn tuyển dụng"
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#038b95] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#026f77] disabled:cursor-not-allowed disabled:bg-slate-300 shadow-xs transition cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" /> Đăng bài mới
              </button>
            ) : (
              <button
                disabled={templates.length >= 20}
                onClick={handleOpenCreateTemplate}
                title={templates.length >= 20 ? "Đã đạt giới hạn tối đa 20 mẫu tin" : "Tạo mẫu tin mới"}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#038b95] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#026f77] disabled:cursor-not-allowed disabled:bg-slate-300 shadow-xs transition cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" /> Tạo mẫu mới ({templates.length}/20)
              </button>
            )}
          </div>
        </div>

        {/* Thanh tiến trình đơn giản (Dưới chữ tuyển dụng) */}
        {(() => {
          const activeSemester =
            allSemesters.find((s) => s.id === semesterId) ||
            allSemesters.find((s) => s.phase === "RECRUITING") ||
            allSemesters.find((s) => s.phase === "MONITORING") ||
            allSemesters[0];

          if (!activeSemester) return null;

          const diffDays = (targetDateStr?: string) => {
            if (!targetDateStr) return 0;
            const target = new Date(targetDateStr);
            if (isNaN(target.getTime())) return 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const targetDay = new Date(target);
            targetDay.setHours(0, 0, 0, 0);
            return Math.max(0, Math.round((targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
          };

          let countdownText = "";
          if (activeSemester.phase === "UPCOMING") {
            const days = diffDays(activeSemester.recruitmentStart);
            countdownText = days > 0 ? `Còn ${days} ngày nữa mở cổng tuyển dụng` : "Sắp mở cổng tuyển dụng";
          } else if (activeSemester.phase === "RECRUITING") {
            const days = diffDays(activeSemester.startDate);
            countdownText = days > 0 ? `Đang mở tuyển: Còn ${days} ngày trước khi chốt đợt` : "Hạn chốt tuyển dụng";
          } else if (activeSemester.phase === "MONITORING") {
            const days = diffDays(activeSemester.endDate);
            countdownText = days > 0 ? `Đang thực tập: Còn ${days} ngày trước khi kết thúc kỳ` : "Đang nghiệm thu thực tập";
          } else if (activeSemester.phase === "COMPLETED") {
            countdownText = "Đợt thực tập đã hoàn tất";
          }

          const campaignSteps = [
            { label: "Mở đợt" },
            { label: "Đang tuyển" },
            { label: "Đang thực tập" },
            { label: "Kết thúc" },
          ];

          const phaseStepMap: Record<string, number> = {
            UPCOMING: 0,
            RECRUITING: 1,
            MONITORING: 2,
            COMPLETED: 3,
          };

          const currentStepIdx = phaseStepMap[activeSemester.phase] ?? 0;
          const progressPercent = (currentStepIdx / (campaignSteps.length - 1)) * 100;

          return (
            <div className="mt-4 pt-3.5 border-t border-slate-200/70">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Tiến trình đợt:
                  </span>
                  <span className="font-bold text-slate-800 text-xs">
                    {activeSemester.name.replace(/\s*\[.*?\]/, "").trim()}
                  </span>
                  {countdownText && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        activeSemester.phase === "RECRUITING"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : activeSemester.phase === "MONITORING"
                          ? "bg-sky-100 text-sky-800 border border-sky-200"
                          : activeSemester.phase === "COMPLETED"
                          ? "bg-slate-200 text-slate-700"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {countdownText}
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-slate-400 font-medium">
                  Khung đợt: {formatDateVi(activeSemester.startDate)} – {formatDateVi(activeSemester.endDate)}
                </span>
              </div>

              {/* Stepper tiến trình 4 bước đơn giản */}
              <div className="relative px-3 sm:px-8 py-1.5">
                {/* Đường ray tiến trình nền */}
                <div className="absolute left-6 right-6 sm:left-11 sm:right-11 top-[18px] -translate-y-1/2 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#038b95] rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* 4 mốc tiến trình */}
                <div className="relative z-10 flex items-center justify-between">
                  {campaignSteps.map((st, idx) => {
                    const isPassed = currentStepIdx >= idx;
                    const isCurrent = currentStepIdx === idx;

                    return (
                      <div key={st.label} className="flex flex-col items-center">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all ${
                            isCurrent
                              ? "border-[#038b95] bg-[#038b95] text-white ring-4 ring-[#038b95]/20 shadow-xs scale-105"
                              : isPassed
                              ? "border-[#038b95] bg-white text-[#038b95]"
                              : "border-slate-300 bg-white text-slate-400"
                          }`}
                        >
                          {isPassed ? <Check className="h-3 w-3 stroke-[3]" /> : idx + 1}
                        </div>
                        <span
                          className={`mt-1 text-[11px] font-bold tracking-tight whitespace-nowrap ${
                            isCurrent
                              ? "text-[#006f72]"
                              : isPassed
                              ? "text-slate-700"
                              : "text-slate-400"
                          }`}
                        >
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 1 CARD BOX DUY NHẤT TOÀN DIỆN (TABS + FILTER + BẢNG DANH SÁCH + PHÂN TRANG) */}
      <section className="relative z-10 rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {/* ROW 1: Tabs bên trái + Đếm số lượng bên phải */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
          <div className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("INTERNSHIPS");
                setPage(1);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === "INTERNSHIPS"
                  ? "bg-white text-[#038b95] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Tin tuyển dụng</span>
              <span className="rounded-full bg-[#e0f4f6] px-2 py-0.5 text-[10px] font-bold text-[#038b95] border border-[#b8e6ea]">
                {totalItems}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("TEMPLATES")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === "TEMPLATES"
                  ? "bg-white text-[#038b95] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Mẫu tin tuyển dụng</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  templates.length >= 20
                    ? "bg-rose-500 text-white"
                    : activeTab === "TEMPLATES"
                    ? "bg-[#e0f4f6] text-[#038b95] border border-[#b8e6ea]"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {templates.length}/20
              </span>
            </button>
          </div>
        </div>

        {/* TAB 1: INTERNSHIPS VIEW */}
        {activeTab === "INTERNSHIPS" && (
          <>
            {/* ROW 2: BỘ LỌC TỰ ĐỘNG (BỎ LỌC KỸ NĂNG, CHỌN LÀ ĐỔI NGAY) */}
            <div className="border-b border-slate-100 bg-slate-50/40 p-4 sm:p-5 space-y-3">
              <div
                ref={filterDropdownsRef}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 text-xs"
              >
                {/* Ô tìm kiếm từ khóa */}
                <div className="lg:col-span-4 relative">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-[#038b95] focus-within:ring-2 focus-within:ring-[#038b95]/20 transition shadow-2xs">
                    <Search className="h-4 w-4 text-slate-400 shrink-0" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Tìm theo vị trí tuyển dụng, phòng ban..."
                      className="w-full py-2.5 outline-none font-medium text-slate-800 text-xs placeholder:text-slate-400"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dropdown Đợt thực tập (Custom Dropdown) */}
                <div className="relative lg:col-span-3">
                  {(() => {
                    const selectedSemesterObj = semesterOptions.find((s) => s.id === semesterId);
                    const selectedSemesterName = selectedSemesterObj
                      ? selectedSemesterObj.name.replace(/\s*\[.*?\]/, "").trim()
                      : "Tất cả đợt thực tập";

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => setOpenDropdown(openDropdown === "SEMESTER" ? null : "SEMESTER")}
                          className={`w-full flex items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-xs font-semibold transition shadow-2xs cursor-pointer ${
                            openDropdown === "SEMESTER"
                              ? "border-[#038b95] ring-2 ring-[#038b95]/20 text-slate-900"
                              : "border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <Calendar className="h-4 w-4 text-[#038b95] shrink-0" />
                            <span className="truncate">{selectedSemesterName}</span>
                          </span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                              openDropdown === "SEMESTER" ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {openDropdown === "SEMESTER" && (
                          <div className="absolute left-0 top-full mt-1.5 z-50 w-[340px] sm:w-[370px] max-w-[92vw] rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-2xl no-scrollbar max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                            <div className="px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                              Chọn đợt thực tập
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSemesterId("");
                                setOpenDropdown(null);
                                void loadInternships(1, { semesterId: "" });
                              }}
                              className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                                !semesterId
                                  ? "bg-[#e0f4f6] text-[#02636a] font-extrabold"
                                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-[#038b95]" />
                                <span>Tất cả đợt thực tập</span>
                              </span>
                              {!semesterId && <Check className="h-3.5 w-3.5 text-[#038b95] shrink-0" />}
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                            {semesterOptions.map((s) => {
                              const isSelected = s.id === semesterId;
                              const cleanName = s.name.replace(/\s*\[.*?\]/g, "").trim();
                              const semRecord = allSemesters.find((item) => item.id === s.id);
                              const phase = semRecord?.phase;

                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => {
                                    setSemesterId(s.id);
                                    setOpenDropdown(null);
                                    void loadInternships(1, { semesterId: s.id });
                                  }}
                                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                                    isSelected
                                      ? "bg-[#e0f4f6] text-[#02636a] font-extrabold"
                                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold"
                                  }`}
                                >
                                  <span className="font-semibold text-xs whitespace-nowrap text-slate-800 truncate">{cleanName}</span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {phase && (
                                      <span
                                        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9.5px] font-bold ${
                                          phase === "RECRUITING"
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            : phase === "ONGOING" || phase === "MONITORING"
                                            ? "bg-sky-50 text-sky-700 border border-sky-200"
                                            : phase === "UPCOMING"
                                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                                            : "bg-slate-100 text-slate-600 border border-slate-200"
                                        }`}
                                      >
                                        {phase === "RECRUITING"
                                          ? "Đang tuyển dụng"
                                          : phase === "ONGOING" || phase === "MONITORING"
                                          ? "Hiện tại"
                                          : phase === "UPCOMING"
                                          ? "Sắp diễn ra"
                                          : "Đã kết thúc"}
                                      </span>
                                    )}
                                    {isSelected && <Check className="h-3.5 w-3.5 text-[#038b95] shrink-0" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Dropdown Ngành tuyển dụng (Custom Dropdown) */}
                <div className="relative lg:col-span-3">
                  {(() => {
                    const selectedMajorObj = faculties.flatMap((f) => f.majors).find((m) => m.id === filterMajorId);
                    const selectedMajorName = selectedMajorObj ? selectedMajorObj.name : "Tất cả ngành tuyển dụng";

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => setOpenDropdown(openDropdown === "MAJOR" ? null : "MAJOR")}
                          className={`w-full flex items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-xs font-semibold transition shadow-2xs cursor-pointer ${
                            openDropdown === "MAJOR"
                              ? "border-[#038b95] ring-2 ring-[#038b95]/20 text-slate-900"
                              : "border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <GraduationCap className="h-4 w-4 text-[#038b95] shrink-0" />
                            <span className="truncate">{selectedMajorName}</span>
                          </span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                              openDropdown === "MAJOR" ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {openDropdown === "MAJOR" && (
                          <div className="absolute left-0 top-full mt-1.5 z-40 w-full min-w-[280px] sm:min-w-[340px] rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xl max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Chọn ngành tuyển dụng
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFilterMajorId("");
                                setOpenDropdown(null);
                                void loadInternships(1, { majorId: "" });
                              }}
                              className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${
                                !filterMajorId
                                  ? "bg-[#e0f4f6] text-[#02636a] font-bold"
                                  : "text-slate-700 hover:bg-slate-50 font-medium"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <GraduationCap className="h-3.5 w-3.5 text-[#038b95]" />
                                <span>Tất cả ngành tuyển dụng</span>
                              </span>
                              {!filterMajorId && <Check className="h-3.5 w-3.5 text-[#038b95] shrink-0" />}
                            </button>

                            {faculties.map((f) => (
                              <div key={f.id} className="mt-2">
                                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100/80 rounded-md mb-1">
                                  Khoa {f.name}
                                </div>
                                <div className="space-y-0.5">
                                  {f.majors.map((m) => {
                                    const isSelected = m.id === filterMajorId;
                                    return (
                                      <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => {
                                          setFilterMajorId(m.id);
                                          setOpenDropdown(null);
                                          void loadInternships(1, { majorId: m.id });
                                        }}
                                        className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${
                                          isSelected
                                            ? "bg-[#e0f4f6] text-[#02636a] font-bold"
                                            : "text-slate-700 hover:bg-slate-50 font-medium"
                                        }`}
                                      >
                                        <span className="truncate">
                                          {m.name} {!m.isActive ? "(Tạm ngưng)" : ""}
                                        </span>
                                        {isSelected && <Check className="h-3.5 w-3.5 text-[#038b95] shrink-0" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Dropdown Trạng thái (Custom Dropdown) */}
                <div className="relative lg:col-span-2">
                  {(() => {
                    const selectedStatusObj =
                      STATUS_FILTER_OPTIONS.find((opt) => opt.value === status) || STATUS_FILTER_OPTIONS[0];

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => setOpenDropdown(openDropdown === "STATUS" ? null : "STATUS")}
                          className={`w-full flex items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-xs font-semibold transition shadow-2xs cursor-pointer ${
                            openDropdown === "STATUS"
                              ? "border-[#038b95] ring-2 ring-[#038b95]/20 text-slate-900"
                              : "border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${selectedStatusObj.color}`} />
                            <span className="truncate">{selectedStatusObj.label}</span>
                          </span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                              openDropdown === "STATUS" ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {openDropdown === "STATUS" && (
                          <div className="absolute right-0 top-full mt-1.5 z-40 w-full min-w-[200px] rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xl max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Chọn trạng thái
                            </div>
                            {STATUS_FILTER_OPTIONS.map((opt) => {
                              const isSelected = status === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => {
                                    setStatus(opt.value);
                                    setOpenDropdown(null);
                                    void loadInternships(1, { status: opt.value });
                                  }}
                                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${
                                    isSelected
                                      ? "bg-[#e0f4f6] text-[#02636a] font-bold"
                                      : "text-slate-700 hover:bg-slate-50 font-medium"
                                  }`}
                                >
                                  <span className="flex items-center gap-2 truncate">
                                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${opt.color}`} />
                                    <span className="truncate">{opt.label}</span>
                                  </span>
                                  {isSelected && <Check className="h-3.5 w-3.5 text-[#038b95] shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Thẻ tag bộ lọc đang áp dụng + Nút xóa bộ lọc */}
              {hasActiveFilter && (
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">Đang lọc theo:</span>
                    {search && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        Từ khóa: "{search}"
                      </span>
                    )}
                    {semesterId && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-[#006f72]">
                        {semesterOptions.find((s) => s.id === semesterId)?.name}
                      </span>
                    )}
                    {filterMajorId && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-800">
                        Ngành: {faculties.flatMap((f) => f.majors).find((m) => m.id === filterMajorId)?.name}
                      </span>
                    )}
                    {status && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                        {internshipStatusLabel[status] || status}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <FilterX className="h-3.5 w-3.5" /> Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>

            {/* ROW 3: BẢNG DANH SÁCH BẢN GHI GỌN GÀNG (CLICK VÀO ĐỂ XEM CHI TIẾT) */}
            {loading ? (
              <div className="p-12 text-center text-sm text-slate-500">
                <LoaderCircle className="mx-auto mb-3 h-6 w-6 animate-spin text-[#038b95]" />
                Đang tải danh sách tin tuyển dụng...
              </div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Briefcase className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">Chưa có bài đăng tuyển dụng nào phù hợp</p>
                <p className="text-xs text-slate-400 mt-1">
                  Hãy điều chỉnh bộ lọc hoặc bấm "Đăng bài mới" để bắt đầu tuyển dụng.
                </p>
                {recruitingSemesters.length > 0 && (
                  <button
                    type="button"
                    onClick={openCreateJobModal}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#038b95] px-4 py-2 text-xs font-bold text-white hover:bg-[#026f77] transition cursor-pointer shadow-xs"
                  >
                    <Plus className="h-4 w-4" /> Đăng tin tuyển dụng ngay
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 pl-6 pr-4 min-w-[280px]">Vị trí tuyển dụng</th>
                      <th className="py-3.5 px-4 min-w-[180px]">Đợt thực tập</th>
                      <th className="py-3.5 px-4 min-w-[140px]">Chỉ tiêu tiếp nhận</th>
                      <th className="py-3.5 px-4 min-w-[120px]">Hạn nộp</th>
                      <th className="py-3.5 px-4 min-w-[120px] text-center">Trạng thái</th>
                      <th className="py-3.5 pl-4 pr-6 text-right min-w-[140px]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((job) => {
                      const progress =
                        job.slots > 0 ? Math.min(100, Math.round((job.filledSlots / job.slots) * 100)) : 0;
                      const isWarning =
                        job.status === "REJECTED" || (job.status === "DRAFT" && !!job.moderationReason);

                      return (
                        <tr
                          key={job.id}
                          onClick={() => setSelectedDetailJob(job)}
                          className={`h-16 transition hover:bg-[#f0fbfb]/70 cursor-pointer ${
                            job.status === "REJECTED" ? "bg-rose-50/20" : ""
                          }`}
                        >
                          {/* 1. Vị trí tuyển dụng & Phòng ban */}
                          <td className="py-3 pl-6 pr-4">
                            <div className="max-w-[320px]">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="font-bold text-slate-900 truncate hover:text-[#038b95] transition"
                                  title={job.title}
                                >
                                  {job.title}
                                </span>
                                {job.sourceInternshipId && (
                                  <span className="shrink-0 text-[10px] text-[#006f72] bg-[#e0f4f6] px-1.5 py-0.2 rounded font-bold">
                                    Đăng lại
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                                {job.department || "Chưa phân phòng"} ·{" "}
                                <span className="font-semibold text-emerald-700">
                                  {job.isUnpaid
                                    ? "Không phụ cấp"
                                    : job.stipend
                                    ? `${job.stipend.toLocaleString("vi-VN")} đ`
                                    : "Thỏa thuận"}
                                </span>
                              </p>
                            </div>
                          </td>

                          {/* 2. Đợt thực tập */}
                          <td className="py-3 px-4">
                            <div className="max-w-[200px]">
                              <span className="font-semibold text-slate-800 truncate block" title={job.semester.name}>
                                {job.semester.name}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {workTypeLabels[job.workType] || job.workType}
                              </span>
                            </div>
                          </td>

                          {/* 3. Chỉ tiêu tiếp nhận */}
                          <td className="py-3 px-4">
                            <div className="w-[120px]">
                              <span className="font-bold text-slate-800">
                                {job.filledSlots}/{job.slots} SV{" "}
                                <span className="text-emerald-600 font-semibold text-[11px]">({progress}%)</span>
                              </span>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    progress >= 100 ? "bg-emerald-500" : "bg-[#038b95]"
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* 4. Hạn nộp */}
                          <td className="py-3 px-4 text-slate-600 font-medium">
                            {formatDateVi(job.deadline)}
                          </td>

                          {/* 5. Trạng thái */}
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
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
                            {isWarning && (
                              <span className="block text-[10px] text-rose-600 font-bold mt-0.5">
                                Vi phạm
                              </span>
                            )}
                          </td>

                          {/* 6. Thao tác */}
                          <td className="py-3 pl-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center justify-end gap-1">
                              {job.status !== "CANCELLED" && job.status !== "REJECTED" && (
                                <button
                                  type="button"
                                  onClick={() => openEditJobModal(job)}
                                  title="Chỉnh sửa bài đăng"
                                  className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 hover:text-amber-800 transition cursor-pointer"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setStatsInternshipId(job.id)}
                                title="Xem thống kê"
                                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition cursor-pointer"
                              >
                                <BarChart3 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void removeJob(job.id)}
                                title="Xóa bài đăng"
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ROW 4: PHÂN TRANG */}
            {!loading && totalPages > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-3.5 text-xs text-slate-600">
                <span className="font-medium text-slate-500">
                  Tổng: <strong className="text-slate-700">{totalItems}</strong> tin tuyển dụng
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => {
                      const prevPage = Math.max(1, page - 1);
                      void loadInternships(prevPage);
                    }}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition cursor-pointer shadow-2xs"
                    title="Trang trước"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="font-semibold text-slate-700 px-1">
                    Trang {page}/{totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages || loading}
                    onClick={() => {
                      const nextPage = Math.min(totalPages, page + 1);
                      void loadInternships(nextPage);
                    }}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition cursor-pointer shadow-2xs"
                    title="Trang sau"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: TEMPLATES VIEW (BẢNG DANH SÁCH DẠNG RECORD ĐỒNG BỘ) */}
        {activeTab === "TEMPLATES" && (
          <div>
            {templates.length >= 20 && (
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-800 flex items-center justify-between">
                <span>Bạn đã đạt giới hạn tối đa 20 mẫu tin tuyển dụng.</span>
                <span className="text-amber-700">Hãy xóa hoặc cập nhật mẫu hiện có để lưu mẫu mới.</span>
              </div>
            )}

            {loadingTemplates ? (
              <div className="p-12 text-center text-sm text-slate-500">
                <LoaderCircle className="mx-auto mb-3 h-6 w-6 animate-spin text-[#038b95]" />
                Đang tải danh sách mẫu tin...
              </div>
            ) : templates.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Layers className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">Chưa có mẫu tin tuyển dụng nào</p>
                <p className="text-xs text-slate-400 mt-1">
                  Lưu tin từ danh sách bài đăng hoặc bấm "Tạo mẫu mới" để sẵn sàng tạo nhanh cho các đợt tuyển sau.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreateTemplate}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#038b95] px-4 py-2 text-xs font-bold text-white hover:bg-[#026f77] transition cursor-pointer shadow-xs"
                >
                  <Plus className="h-4 w-4" /> Tạo mẫu tin mới
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 pl-6 pr-4 min-w-[300px]">Tên mẫu & Vị trí tuyển dụng</th>
                      <th className="py-3.5 px-4 min-w-[170px]">Hình thức & Địa điểm</th>
                      <th className="py-3.5 px-4 min-w-[110px]">Chỉ tiêu</th>
                      <th className="py-3.5 px-4 min-w-[170px]">Kỹ năng yêu cầu</th>
                      <th className="py-3.5 px-4 min-w-[100px] text-center">Đã dùng</th>
                      <th className="py-3.5 pl-4 pr-6 text-right min-w-[140px]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {templates.map((tpl) => (
                      <tr
                        key={tpl.id}
                        onClick={() => handleOpenEditTemplate(tpl)}
                        className="h-16 transition hover:bg-[#f0fbfb]/70 cursor-pointer"
                      >
                        {/* 1. Tên mẫu & Vị trí */}
                        <td className="py-3 pl-6 pr-4">
                          <div className="max-w-[320px]">
                            <span className="inline-block rounded-md bg-[#e0f4f6] border border-[#00878a]/20 px-1.5 py-0.2 text-[10px] font-bold text-[#006f72] uppercase truncate max-w-[200px]">
                              {tpl.name}
                            </span>
                            <h4 className="mt-1 font-bold text-slate-900 truncate hover:text-[#038b95] transition">
                              {tpl.title}
                            </h4>
                            <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                              {tpl.department || "Chưa phân phòng"} ·{" "}
                              <span className="font-semibold text-emerald-700">
                                {tpl.stipend || "Thỏa thuận"}
                              </span>
                            </p>
                          </div>
                        </td>

                        {/* 2. Hình thức & Địa điểm */}
                        <td className="py-3 px-4">
                          <div className="max-w-[180px]">
                            <span className="font-semibold text-slate-800 block truncate">
                              {workTypeLabels[tpl.workType || ""] || "Linh hoạt"}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate" title={tpl.location || ""}>
                              {tpl.location || "Chưa thiết lập"}
                            </span>
                          </div>
                        </td>

                        {/* 3. Chỉ tiêu */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800">
                            {tpl.slotsDefault} <span className="font-medium text-slate-500 text-[11px]">SV</span>
                          </span>
                        </td>

                        {/* 4. Kỹ năng yêu cầu */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {tpl.skills.length === 0 ? (
                              <span className="text-slate-400 text-[11px]">Không yêu cầu</span>
                            ) : (
                              <>
                                {tpl.skills.slice(0, 2).map((s) => (
                                  <span
                                    key={s.skillId}
                                    className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200 truncate max-w-[90px]"
                                  >
                                    {s.name}
                                  </span>
                                ))}
                                {tpl.skills.length > 2 && (
                                  <span className="rounded-md bg-slate-100 px-1 py-0.5 text-[10px] font-bold text-slate-600">
                                    +{tpl.skills.length - 2}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>

                        {/* 5. Số lần dùng */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
                            {tpl.usageCount} lần
                          </span>
                        </td>

                        {/* 6. Thao tác */}
                        <td className="py-3 pl-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenFromTemplate(tpl)}
                              title="Tạo bài đăng từ mẫu này"
                              className="p-1.5 rounded-lg text-[#006f72] hover:bg-[#e0f4f6] transition cursor-pointer"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditTemplate(tpl)}
                              title="Chỉnh sửa mẫu"
                              className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 hover:text-amber-800 transition cursor-pointer"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleRemoveTemplate(tpl.id, tpl.name)}
                              title="Xóa mẫu"
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ================= MODAL: CREATE JOB (TRADITIONAL) ================= */}
      {isFormOpen && (
        <ModalPortal>
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={(event) => void submitNewJob(event)}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingJobId ? "Cập nhật vị trí thực tập" : "Đăng vị trí thực tập"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Chọn lưu nháp hoặc công khai tuyển dụng ngay.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingJobId(null);
                }}
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
              <CustomSelect
                label="Hình thức làm việc"
                value={form.workType ?? ""}
                options={WORK_TYPE_OPTIONS}
                onChange={(value) => update("workType", value)}
              />
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
              <CustomSelect
                label="Trạng thái"
                value={form.status}
                options={STATUS_OPTIONS}
                onChange={(value) => update("status", value)}
              />
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
              <fieldset className="md:col-span-2">
                <legend className="font-bold">Ngành học mục tiêu (tùy chọn)</legend>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Chọn một hoặc nhiều ngành đào tạo ưu tiên cho vị trí này. Nếu để trống, tin sẽ mở cho sinh viên tất cả các ngành.
                </p>
                <MajorMultiPicker
                  faculties={faculties}
                  selectedMajorIds={selectedMajorIds}
                  onChange={setSelectedMajorIds}
                />
              </fieldset>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingJobId(null);
                }}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                disabled={
                  saving ||
                  (!editingJobId && !recruitingSemesters.length) ||
                  (!editingJobId && recruitingSemesters.length > 1 && !form.semesterId)
                }
                className="rounded-xl bg-[#038b95] px-4 py-2 text-xs font-bold text-white disabled:opacity-50 shadow-xs"
              >
                {saving ? "Đang lưu..." : editingJobId ? "Cập nhật bài đăng" : "Lưu bài đăng"}
              </button>
            </div>
          </form>
        </div>
        </ModalPortal>
      )}

      {/* ================= MODAL: SAVE AS TEMPLATE ================= */}
      {saveAsTemplateJob && (
        <ModalPortal>
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
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
        </ModalPortal>
      )}

      {/* ================= MODAL: REPOST TO ANOTHER SEMESTER ================= */}
      {repostJob && (
        <ModalPortal>
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
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

              <fieldset className="md:col-span-2">
                <legend className="font-bold">Ngành học mục tiêu áp dụng cho bài đăng lại</legend>
                <MajorMultiPicker
                  faculties={faculties}
                  selectedMajorIds={repostForm.majorIds ?? []}
                  onChange={(ids) => setRepostForm((c) => ({ ...c, majorIds: ids }))}
                />
              </fieldset>
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
        </ModalPortal>
      )}

      {/* ================= MODAL: CREATE / EDIT TEMPLATE ================= */}
      {isTemplateModalOpen && (
        <ModalPortal>
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
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

              <CustomSelect
                label="Hình thức làm việc"
                value={templateForm.workType ?? "HYBRID"}
                options={WORK_TYPE_OPTIONS.filter((o) => o.value !== "")}
                onChange={(val) => setTemplateForm((c) => ({ ...c, workType: val }))}
              />

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
        </ModalPortal>
      )}

      {/* ================= MODAL: CREATE JOB FROM TEMPLATE ================= */}
      {instantiatingTemplate && (
        <ModalPortal>
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
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

              <fieldset className="md:col-span-2">
                <legend className="font-bold">Ngành học mục tiêu cho đợt này (tùy chọn)</legend>
                <MajorMultiPicker
                  faculties={faculties}
                  selectedMajorIds={fromTemplateMajorIds}
                  onChange={setFromTemplateMajorIds}
                />
              </fieldset>
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#038b95] px-4 py-2 text-xs font-bold text-white hover:bg-[#026f77] disabled:opacity-50 shadow-xs"
              >
                <Sparkles className="h-4 w-4" />
                {saving ? "Đang tạo..." : "Xác nhận tạo bài đăng"}
              </button>
            </div>
          </form>
        </div>
        </ModalPortal>
      )}

      {/* Modal Box hiển thị chi tiết tin tuyển dụng khi click vào record */}
      {selectedDetailJob && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6 bg-[#f8fafd]">
                <div className="space-y-1.5 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-md bg-[#e0f4f6] px-2.5 py-0.5 text-xs font-bold text-[#006f72]">
                      {selectedDetailJob.semester.name}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        selectedDetailJob.status === "OPEN"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : selectedDetailJob.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : selectedDetailJob.status === "DRAFT"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {internshipStatusLabel[selectedDetailJob.status] || selectedDetailJob.status}
                    </span>
                    {selectedDetailJob.sourceInternshipId && (
                      <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700">
                        Đăng lại
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-slate-900">
                    {selectedDetailJob.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Phòng ban: <strong className="text-slate-700">{selectedDetailJob.department || "Chưa phân phòng"}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDetailJob(null)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
                {/* Vi phạm nếu có */}
                {selectedDetailJob.status === "REJECTED" && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>Bài đăng bị Ban Quản trị gỡ vi phạm</span>
                    </div>
                    {selectedDetailJob.moderationReasonCode && (
                      <span className="inline-block rounded-md bg-rose-200/80 px-2 py-0.5 text-[10px] font-bold text-rose-900">
                        {MODERATION_REASON_LABELS[selectedDetailJob.moderationReasonCode] || selectedDetailJob.moderationReasonCode}
                      </span>
                    )}
                    <p className="text-rose-800 mt-1">
                      {selectedDetailJob.moderationReason || "Bài đăng vi phạm quy chuẩn tuyển dụng của nhà trường."}
                    </p>
                  </div>
                )}

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Phụ cấp</span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-700 truncate block">
                      {selectedDetailJob.isUnpaid ? "Không phụ cấp" : selectedDetailJob.stipend ? `${selectedDetailJob.stipend.toLocaleString("vi-VN")} đ` : "Thỏa thuận"}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Hình thức</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 truncate block">
                      {workTypeLabels[selectedDetailJob.workType] || selectedDetailJob.workType}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Chỉ tiêu</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 truncate block">
                      {selectedDetailJob.filledSlots} / {selectedDetailJob.slots} SV
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Hạn nộp</span>
                    <span className="text-xs sm:text-sm font-bold text-amber-700 truncate block">
                      {formatDateVi(selectedDetailJob.deadline)}
                    </span>
                  </div>
                </div>

                {/* Location & Views */}
                <div className="rounded-2xl border border-slate-200/80 p-3.5 space-y-2 bg-white">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <span><strong>Địa điểm làm việc:</strong> {selectedDetailJob.location || "Chưa cập nhật"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Eye className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>
                      <strong>Lượt tương tác:</strong> {selectedDetailJob.viewCount || 0} lượt xem ({selectedDetailJob.uniqueViewerCount || 0} sinh viên quan tâm)
                    </span>
                  </div>
                  {(selectedDetailJob.startDate || selectedDetailJob.endDate) && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>
                        <strong>Dự kiến thực tập:</strong> {formatDateVi(selectedDetailJob.startDate)} — {formatDateVi(selectedDetailJob.endDate)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Kỹ năng & Ngành */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200/80 p-3.5 space-y-2">
                    <span className="font-bold text-slate-800 text-xs block">Kỹ năng yêu cầu:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDetailJob.skills.length > 0 ? (
                        selectedDetailJob.skills.map((s) => (
                          <span
                            key={s.skillId}
                            className="rounded-lg bg-teal-50 border border-teal-200/70 px-2 py-0.5 text-xs font-semibold text-[#006f72]"
                          >
                            {s.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">Không yêu cầu kỹ năng cụ thể</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 p-3.5 space-y-2">
                    <span className="font-bold text-slate-800 text-xs block">Ngành học ưu tiên:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDetailJob.majors && selectedDetailJob.majors.length > 0 ? (
                        selectedDetailJob.majors.map((m) => (
                          <span
                            key={m.majorId}
                            className="rounded-lg bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 text-xs font-semibold text-indigo-800"
                          >
                            {m.name}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          Mở cho sinh viên mọi ngành
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mô tả công việc */}
                {selectedDetailJob.description && (
                  <div className="rounded-2xl border border-slate-200/80 p-3.5 space-y-1.5 bg-slate-50/50">
                    <span className="font-bold text-slate-800 text-xs block">Mô tả công việc:</span>
                    <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {selectedDetailJob.description}
                    </div>
                  </div>
                )}

                {/* Yêu cầu ứng viên */}
                {selectedDetailJob.requirements && (
                  <div className="rounded-2xl border border-slate-200/80 p-3.5 space-y-1.5 bg-slate-50/50">
                    <span className="font-bold text-slate-800 text-xs block">Yêu cầu ứng viên:</span>
                    <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {selectedDetailJob.requirements}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer: Cân đối 2 bên hài hòa */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 p-4 sm:p-5 bg-slate-50/70">
                {/* Nhóm công cụ tiện ích mở rộng (Bên trái) */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedDetailJob.id;
                      setSelectedDetailJob(null);
                      setStatsInternshipId(id);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer shadow-2xs"
                  >
                    <BarChart3 className="h-4 w-4 text-[#038b95]" />
                    <span>Thống kê</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const job = selectedDetailJob;
                      setSelectedDetailJob(null);
                      handleOpenSaveAsTemplate(job);
                    }}
                    disabled={templates.length >= 20}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 transition cursor-pointer shadow-2xs"
                  >
                    <Bookmark className="h-4 w-4 text-amber-500" />
                    <span>Lưu mẫu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const job = selectedDetailJob;
                      setSelectedDetailJob(null);
                      handleOpenRepost(job);
                    }}
                    disabled={!recruitingSemesters.length}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 transition cursor-pointer shadow-2xs"
                  >
                    <Copy className="h-4 w-4 text-indigo-500" />
                    <span>Đăng lại</span>
                  </button>
                </div>

                {/* Nhóm nút điều hướng chính (Bên phải) */}
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedDetailJob(null)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
                  >
                    Đóng
                  </button>
                  {selectedDetailJob.status !== "CANCELLED" && selectedDetailJob.status !== "REJECTED" && (
                    <button
                      type="button"
                      onClick={() => {
                        const job = selectedDetailJob;
                        setSelectedDetailJob(null);
                        openEditJobModal(job);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#038b95] px-4.5 py-2 text-xs font-bold text-white hover:bg-[#026f77] transition cursor-pointer shadow-xs"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Sửa bài đăng</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal chi tiết vi phạm / yêu cầu điều chỉnh từ Ban Quản trị */}
      {moderationDetailJob && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      moderationDetailJob.status === "REJECTED"
                        ? "bg-rose-50 text-rose-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {moderationDetailJob.status === "REJECTED"
                        ? "Chi tiết vi phạm bài đăng"
                        : "Yêu cầu điều chỉnh từ Ban quản trị"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {moderationDetailJob.semester.name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModerationDetailJob(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Vị trí tuyển dụng
                  </span>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {moderationDetailJob.title}
                  </p>
                </div>

                {moderationDetailJob.moderationReasonCode && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-700">Lý do theo quy chuẩn:</span>
                    <div className="mt-1">
                      <span className="inline-block rounded-lg bg-rose-100 px-3 py-1 font-bold text-rose-800 border border-rose-200">
                        {MODERATION_REASON_LABELS[moderationDetailJob.moderationReasonCode] ||
                          moderationDetailJob.moderationReasonCode}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-[11px] font-bold text-slate-700">
                    Nội dung phản hồi từ Nhà trường / Ban quản trị:
                  </span>
                  <div className="mt-1 rounded-2xl bg-rose-50/80 p-4 border border-rose-200 text-rose-900 leading-relaxed font-medium">
                    {moderationDetailJob.moderationReason ||
                      "Bài đăng vi phạm quy chuẩn tuyển dụng của nhà trường hoặc nhận phản ánh từ sinh viên."}
                  </div>
                </div>

                <div className="rounded-xl bg-amber-50 p-3.5 border border-amber-200 text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-amber-600 shrink-0" />
                    Lưu ý đối với doanh nghiệp:
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {moderationDetailJob.status === "REJECTED"
                      ? "Bài đăng đã bị ngừng công khai. Các đơn ứng tuyển đang ở trạng thái Chờ duyệt hoặc Đang phỏng vấn đã được hệ thống tự động hoàn trả cho sinh viên. Vui lòng liên hệ cán bộ quản lý đợt thực tập nếu cần hỗ trợ thêm."
                      : "Vui lòng cập nhật lại nội dung bài đăng theo đúng các yêu cầu trên để được phê duyệt và mở công khai cho sinh viên ứng tuyển."}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModerationDetailJob(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
                >
                  Đóng
                </button>
                {moderationDetailJob.status !== "CANCELLED" && moderationDetailJob.status !== "REJECTED" && (
                  <button
                    type="button"
                    onClick={() => {
                      const job = moderationDetailJob;
                      setModerationDetailJob(null);
                      openEditJobModal(job);
                    }}
                    className="rounded-xl bg-[#038b95] px-4 py-2 text-xs font-bold text-white hover:bg-[#026f77] transition cursor-pointer shadow-2xs"
                  >
                    Cập nhật bài đăng ngay
                  </button>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
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

interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const WORK_TYPE_OPTIONS: CustomSelectOption[] = [
  {
    value: "",
    label: "Chưa xác định",
    sublabel: "Thỏa thuận hoặc linh hoạt trao đổi sau",
    icon: HelpCircle,
  },
  {
    value: "ONSITE",
    label: "Làm việc tại công ty",
    sublabel: "Trực tiếp tại văn phòng doanh nghiệp (Onsite)",
    icon: Building2,
  },
  {
    value: "REMOTE",
    label: "Làm việc từ xa",
    sublabel: "Làm việc trực tuyến 100% (Remote)",
    icon: Globe,
  },
  {
    value: "HYBRID",
    label: "Kết hợp tại công ty và từ xa",
    sublabel: "Linh hoạt giữa văn phòng & từ xa (Hybrid)",
    icon: Layers,
  },
];

const STATUS_OPTIONS: CustomSelectOption[] = [
  {
    value: "DRAFT",
    label: "Lưu nháp",
    sublabel: "Chưa công khai cho sinh viên ứng tuyển",
    icon: Edit3,
  },
  {
    value: "OPEN",
    label: "Công khai",
    sublabel: "Mở nhận hồ sơ ứng tuyển từ sinh viên",
    icon: CheckCircle2,
  },
];

function CustomSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Chọn...",
  required = false,
  className = "",
}: {
  label?: string;
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];
  const SelectedIcon = selectedOption?.icon;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <span className="block font-bold text-slate-800">
          {label} {required && <span className="text-rose-500">*</span>}
        </span>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`mt-1 flex w-full items-center justify-between rounded-xl border bg-white px-3 py-2.5 text-xs text-left transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? "border-[#038b95] ring-2 ring-teal-500/20"
            : "border-slate-300 hover:border-[#038b95]"
        }`}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          {SelectedIcon && (
            <SelectedIcon className="h-4 w-4 text-[#038b95] shrink-0" />
          )}
          <span className={`truncate ${selectedOption ? "font-semibold text-slate-800" : "font-normal text-slate-400"}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#038b95]" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto no-scrollbar">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            const OptIcon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left transition cursor-pointer ${
                  isSelected
                    ? "bg-[#e0f4f6] text-[#02636a]"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {OptIcon && (
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-white text-[#038b95] shadow-2xs"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <OptIcon className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div
                      className={`text-xs truncate ${
                        isSelected
                          ? "font-bold text-[#02636a]"
                          : "font-semibold text-slate-800"
                      }`}
                    >
                      {opt.label}
                    </div>
                    {opt.sublabel && (
                      <div className="text-[10px] text-slate-400 truncate">
                        {opt.sublabel}
                      </div>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-[#038b95] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
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

function MajorMultiPicker({
  faculties,
  selectedMajorIds,
  onChange,
}: {
  faculties: FacultyOption[];
  selectedMajorIds: string[];
  onChange: (majorIds: string[]) => void;
}) {
  const toggleMajor = (majorId: string) => {
    if (selectedMajorIds.includes(majorId)) {
      onChange(selectedMajorIds.filter((id) => id !== majorId));
    } else {
      onChange([...selectedMajorIds, majorId]);
    }
  };

  if (faculties.length === 0) {
    return (
      <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
        Chưa có dữ liệu danh mục Khoa/Ngành.
      </p>
    );
  }

  return (
    <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-3">
      {selectedMajorIds.length > 0 && (
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-[11px]">
          <span className="font-semibold text-indigo-700">
            Đã chọn {selectedMajorIds.length} ngành mục tiêu
          </span>
          <button
            type="button"
            onClick={() => onChange([])}
            className="font-bold text-slate-500 hover:text-rose-600"
          >
            Bỏ chọn tất cả (Mở cho mọi ngành)
          </button>
        </div>
      )}
      {faculties.map((faculty) => {
        const activeMajors = faculty.majors.filter(
          (m) => m.isActive || selectedMajorIds.includes(m.id),
        );
        if (activeMajors.length === 0) return null;
        return (
          <div key={faculty.id} className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {faculty.code} — {faculty.name}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {activeMajors.map((major) => {
                const checked = selectedMajorIds.includes(major.id);
                return (
                  <button
                    key={major.id}
                    type="button"
                    onClick={() => toggleMajor(major.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                      checked
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-2xs"
                        : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40"
                    }`}
                  >
                    <span>{major.name}</span>
                    {!major.isActive && (
                      <span className="text-[10px] opacity-80">(Ngưng)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
