import React, { FormEvent, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { useAppFeedback } from "../Feedback/AppFeedbackProvider";
import { skillsApi } from "../../skills/api";
import type { SkillRecord } from "../../skills/types";

export const SkillManagement: React.FC = () => {
  const [items, setItems] = useState<SkillRecord[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillRecord | null>(null);
  const [skillName, setSkillName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { confirm, notify } = useAppFeedback();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await skillsApi.list({
        page,
        limit: 10,
        search: search || undefined,
      });
      setItems(result.items);
      setTotal(result.pagination.total);
      setTotalPages(Math.max(result.pagination.totalPages, 1));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 300);
    return () => window.clearTimeout(timer);
  }, [page, search]);

  const openCreate = () => {
    setEditingSkill(null);
    setSkillName("");
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (skill: SkillRecord) => {
    setEditingSkill(skill);
    setSkillName(skill.name);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingSkill(null);
    setSkillName("");
    setFormError(null);
  };

  const submitSkill = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = skillName.trim();
    if (!trimmed) {
      setFormError("Vui lòng nhập tên kỹ năng.");
      return;
    }
    if (editingSkill && trimmed === editingSkill.name) {
      closeModal();
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editingSkill) {
        await skillsApi.update(editingSkill.id, trimmed);
        await load();
        notify({ title: "Đã cập nhật kỹ năng", tone: "success" });
      } else {
        await skillsApi.create(trimmed);
        setPage(1);
        await load();
        notify({ title: "Đã thêm kỹ năng", tone: "success" });
      }
      setModalOpen(false);
      setEditingSkill(null);
      setSkillName("");
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (skill: SkillRecord) => {
    const accepted = await confirm({
      title: "Xóa kỹ năng",
      message: `Xóa kỹ năng “${skill.name}”? Thao tác này không thể hoàn tác.`,
      confirmLabel: "Xóa kỹ năng",
      tone: "danger",
    });
    if (!accepted) return;
    try {
      await skillsApi.remove(skill.id);
      await load();
      notify({ title: "Đã xóa kỹ năng", tone: "success" });
    } catch (requestError) {
      notify({
        title: "Không thể xóa kỹ năng",
        message: getApiErrorMessage(requestError),
        tone: "error",
      });
    }
  };

  return (
    <section className="admin-page admin-page--standard rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="admin-page-title text-xl font-extrabold text-slate-900">
            Danh mục kỹ năng
          </h2>
          <p className="text-xs text-slate-500">
            Quản lý danh mục dùng chung cho sinh viên và tin tuyển dụng.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-xs font-bold text-white"
        >
          <Plus className="h-4 w-4" />
          Thêm kỹ năng
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
          placeholder="Tìm kỹ năng..."
          className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>
      {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
      {loading ? (
        <div className="p-8 text-center text-slate-500">
          <LoaderCircle className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500">
          Chưa có kỹ năng phù hợp.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="p-3">Tên</th>
                <th className="p-3">Sinh viên</th>
                <th className="p-3">Tin tuyển dụng</th>
                <th className="p-3">Cập nhật</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((skill) => (
                <tr key={skill.id} className="border-b last:border-0">
                  <td className="p-3 font-bold text-slate-800">{skill.name}</td>
                  <td className="p-3">{skill.studentCount}</td>
                  <td className="p-3">{skill.internshipCount}</td>
                  <td className="p-3">
                    {new Date(skill.updatedAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(skill)}
                      className="mr-1.5 rounded-lg p-2 text-indigo-600"
                      aria-label={`Sửa ${skill.name}`}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(skill)}
                      className="rounded-lg p-2 text-rose-600"
                      aria-label={`Xóa ${skill.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && total > 0 && (
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-600">
          <span className="font-medium text-slate-500">
            Tổng: <strong className="text-slate-700">{total}</strong> kỹ năng
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => value - 1)}
              className="rounded-lg border border-slate-200 p-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>
              Trang {page}/{totalPages}
            </span>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg border border-slate-200 p-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <form
            onSubmit={(event) => void submitSkill(event)}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {editingSkill ? "Chỉnh sửa kỹ năng" : "Thêm kỹ năng"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Kỹ năng sẽ xuất hiện trong danh mục chọn của sinh viên và tin
                  tuyển dụng.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-800">
                  Tên kỹ năng *
                </label>
                <input
                  required
                  autoFocus
                  maxLength={80}
                  value={skillName}
                  onChange={(event) => setSkillName(event.target.value)}
                  placeholder="Ví dụ: React, Node.js, Docker..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              {formError && (
                <p className="text-xs text-rose-600">{formError}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {editingSkill ? "Lưu thay đổi" : "Thêm kỹ năng"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
