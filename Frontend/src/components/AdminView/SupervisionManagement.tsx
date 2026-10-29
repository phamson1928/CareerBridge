import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LoaderCircle,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { useAppFeedback } from "../Feedback/AppFeedbackProvider";
import { ProfileAvatarPreview } from "../ProfileAvatarUpload";
import { placementsApi } from "../../placements/api";
import type {
  PlacementRecord,
  PlacementStatus,
} from "../../placements/types";
import { supervisionsApi } from "../../supervisions/api";
import type { LecturerOption } from "../../supervisions/types";
import { formatDate, formatDateTime } from "../../utils/format";

const statusLabel: Record<PlacementStatus, string> = {
  PENDING: "Chờ phân công",
  ACTIVE: "Đang thực tập",
  COMPLETED: "Đã hoàn tất",
  CANCELLED: "Đã hủy",
};
const statusClass: Record<PlacementStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  COMPLETED: "border-slate-200 bg-slate-100 text-slate-600",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
};

function hasInternshipStartedOrProgress(placement: PlacementRecord): boolean {
  return (
    placement.academicStatus === "ACTIVE" ||
    placement.academicStatus === "CLOSED" ||
    (placement.progress?.reportCount ?? 0) > 0 ||
    (placement.progress?.evaluationCount ?? 0) > 0
  );
}

function getPlacementBadge(placement: PlacementRecord): {
  label: string;
  className: string;
} {
  if (placement.status === "ACTIVE" && !hasInternshipStartedOrProgress(placement)) {
    return {
      label: "Đã phân công · Chờ bắt đầu",
      className: "border-blue-200 bg-blue-50 text-blue-700",
    };
  }
  return {
    label: statusLabel[placement.status],
    className: statusClass[placement.status],
  };
}

export const SupervisionManagement: React.FC = () => {
  const { confirm } = useAppFeedback();
  const [items, setItems] = useState<PlacementRecord[]>([]);
  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PlacementStatus | "">("");
  const [assignment, setAssignment] = useState<
    "ALL" | "ASSIGNED" | "UNASSIGNED"
  >("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);
  const [modalPlacement, setModalPlacement] = useState<PlacementRecord | null>(
    null,
  );
  const [selectedLecturer, setSelectedLecturer] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [placementPage, lecturerOptions] = await Promise.all([
        placementsApi.list({
          page,
          limit: 10,
          search: search.trim() || undefined,
          status: status || undefined,
          assignmentStatus: assignment === "ALL" ? undefined : assignment,
        }),
        supervisionsApi.lecturerOptions(),
      ]);
      setItems(placementPage.items);
      setTotal(placementPage.pagination.total);
      setTotalPages(Math.max(placementPage.pagination.totalPages, 1));
      setLecturers(lecturerOptions);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [page, search, status, assignment]);

  const metrics = useMemo(
    () => ({
      pending: items.filter((item) => item.status === "PENDING").length,
      active: items.filter(
        (item) =>
          item.status === "ACTIVE" && hasInternshipStartedOrProgress(item),
      ).length,
    }),
    [items],
  );
  const openAssign = (placement: PlacementRecord) => {
    setModalPlacement(placement);
    setSelectedLecturer(placement.supervision?.lecturerId ?? "");
  };
  const closeModal = () => {
    if (!saving) {
      setModalPlacement(null);
      setSelectedLecturer("");
    }
  };

  const saveAssignment = async () => {
    if (!modalPlacement || !selectedLecturer) return;
    setSaving(true);
    try {
      if (modalPlacement.supervision)
        await supervisionsApi.reassign(
          modalPlacement.supervision.id,
          selectedLecturer,
        );
      else await supervisionsApi.assign(modalPlacement.id, selectedLecturer);
      closeModal();
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const cancelSupervision = async (placement: PlacementRecord) => {
    if (!placement.supervision) return;
    const accepted = await confirm({
      title: "Bỏ phân công",
      message: `Bỏ phân công cho ${placement.student.fullName}?`,
      confirmLabel: "Bỏ phân công",
      tone: "danger",
    });
    if (!accepted) return;
    try {
      await supervisionsApi.cancel(placement.supervision.id);
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  return (
    <section className="admin-page admin-page--feature space-y-5">
      <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-[#004f52] via-[#00878a] to-[#006f72] p-6 text-white shadow-xl shadow-[#00878a]/25 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/90">
            <ShieldCheck className="h-3.5 w-3.5" /> Quản lý phân công hướng dẫn
          </div>
          <h1 className="admin-page-title text-2xl font-black tracking-tight sm:text-3xl">
            Phân công giảng viên
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
            Quản lý hồ sơ thực tập đã được xác nhận, phân công người hướng dẫn
            và theo dõi lịch sử phân công.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/85">
          <UsersRound className="h-4 w-4" /> {lecturers.length} giảng viên đang
          hoạt động
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            label: "Tổng hồ sơ thực tập",
            value: total,
            icon: BriefcaseBusiness,
            tone: "bg-indigo-50 text-indigo-600",
          },
          {
            label: "Chờ phân công",
            value: metrics.pending,
            icon: AlertCircle,
            tone: "bg-amber-50 text-amber-600",
          },
          {
            label: "Đang thực tập",
            value: metrics.active,
            icon: Check,
            tone: "bg-emerald-50 text-emerald-600",
          },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
          >
            <div
              className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_190px_190px]">
          <label className="relative block">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Tìm sinh viên, mã số, công ty, vị trí..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <select
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value as PlacementStatus | "");
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={assignment}
            onChange={(event) => {
              setPage(1);
              setAssignment(event.target.value as typeof assignment);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="ALL">Tất cả phân công</option>
            <option value="ASSIGNED">Đã phân công</option>
            <option value="UNASSIGNED">Chưa phân công</option>
          </select>
        </div>
      </div>
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">
            <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
            Đang tải hồ sơ thực tập...
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">
              Chưa có hồ sơ thực tập phù hợp
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Sinh viên</th>
                  <th className="px-5 py-3.5">Vị trí / Doanh nghiệp</th>
                  <th className="px-5 py-3.5">Học kỳ &amp; Lịch</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Giảng viên hướng dẫn</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((placement) => {
                  const supervision = placement.supervision;
                  const badge = getPlacementBadge(placement);
                  const isLocked = hasInternshipStartedOrProgress(placement);
                  const canModifySupervision =
                    Boolean(placement.startDate && placement.endDate) &&
                    placement.status !== "COMPLETED" &&
                    placement.status !== "CANCELLED" &&
                    placement.academicStatus !== "CLOSED" &&
                    placement.academicStatus !== "CANCELLED" &&
                    !isLocked;

                  return (
                    <tr
                      key={placement.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <ProfileAvatarPreview
                            fileId={placement.student.avatarFileId}
                            fallback={placement.student.fullName.charAt(0)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-100 font-black text-indigo-700"
                            imageClassName="h-full w-full object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {placement.student.fullName}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500">
                              <span className="font-mono font-semibold text-slate-600">
                                {placement.student.studentCode}
                              </span>{" "}
                              · {placement.student.major}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <p className="font-bold text-slate-800">
                          {placement.internship.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {placement.company.companyName}
                          {placement.internship.location
                            ? ` · ${placement.internship.location}`
                            : ""}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 align-middle">
                        <p className="font-semibold text-slate-700">
                          {placement.semester.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {formatDate(placement.startDate)} —{" "}
                          {formatDate(placement.endDate)}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 align-middle">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 align-middle">
                        {supervision ? (
                          <div>
                            <p className="font-bold text-slate-800">
                              {supervision.lecturer.fullName}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {supervision.lecturer.department}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Chưa
                            phân công
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-2">
                          {canModifySupervision && (
                            <button
                              type="button"
                              onClick={() => openAssign(placement)}
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-700"
                            >
                              <GraduationCap className="h-3.5 w-3.5" />{" "}
                              {supervision ? "Đổi GV" : "Phân công"}
                            </button>
                          )}
                          {!placement.startDate || !placement.endDate ? (
                            <span className="whitespace-nowrap rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700">
                              Cần đặt lịch trước
                            </span>
                          ) : null}
                          {canModifySupervision &&
                            supervision?.status === "ACTIVE" && (
                              <button
                                type="button"
                                onClick={() =>
                                  void cancelSupervision(placement)
                                }
                                className="whitespace-nowrap rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-700"
                              >
                                Bỏ phân công
                              </button>
                            )}
                          {supervision?.status === "ACTIVE" && isLocked && (
                            <span className="whitespace-nowrap text-[11px] font-semibold text-slate-400">
                              Đã khóa phân công
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-600">
            <span className="font-medium text-slate-500">
              Tổng: <strong className="text-slate-700">{total}</strong> hồ sơ
              thực tập
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>
                Trang {page}/{totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      {modalPlacement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                  {modalPlacement.supervision
                    ? "Cập nhật phân công"
                    : "Phân công mới"}
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  {modalPlacement.student.fullName}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {modalPlacement.internship.title} ·{" "}
                  {modalPlacement.company.companyName}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
              <div className="flex items-center gap-3">
                <UserRound className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-xs font-bold text-indigo-950">
                    Giảng viên phụ trách
                  </p>
                  <p className="mt-0.5 text-[11px] text-indigo-700">
                    Chọn giảng viên đang hoạt động và cân bằng khối lượng hướng
                    dẫn.
                  </p>
                </div>
              </div>
            </div>
            <select
              value={selectedLecturer}
              onChange={(event) => setSelectedLecturer(event.target.value)}
              className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Chọn giảng viên...</option>
              {lecturers.map((lecturer) => (
                <option key={lecturer.id} value={lecturer.id}>
                  {lecturer.fullName} · {lecturer.activeSupervisionCount} lượt
                  hướng dẫn đang phụ trách
                </option>
              ))}
            </select>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!selectedLecturer || saving}
                onClick={() => void saveAssignment()}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}Lưu
                phân công
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
