import React, { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Download,
  LoaderCircle,
  Save,
  Send,
  XCircle,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import {
  companiesApi,
  CompanyProfileInput,
  CompanyProfileRecord,
} from "../../companies/api";
import {
  downloadPrivateFile,
  uploadPrivateFile,
} from "../../files/api";

const emptyForm: CompanyProfileInput = {
  companyName: "",
  businessRegistrationNumber: "",
  contactPersonName: "",
  contactPhone: "",
  tagline: "",
  description: "",
  industry: "",
  website: "",
  address: "",
  logo: "",
  contactEmail: "",
  registrationDocumentFileId: "",
};

const toForm = (profile: CompanyProfileRecord): CompanyProfileInput => ({
  companyName: profile.companyName,
  businessRegistrationNumber: profile.businessRegistrationNumber ?? "",
  contactPersonName: profile.contactPersonName ?? "",
  contactPhone: profile.contactPhone ?? "",
  tagline: profile.tagline ?? "",
  description: profile.description ?? "",
  industry: profile.industry ?? "",
  website: profile.website ?? "",
  address: profile.address ?? "",
  logo: profile.logo ?? "",
  contactEmail: profile.contactEmail ?? "",
  registrationDocumentFileId: profile.registrationDocumentFileId ?? "",
});

interface CompanyProfileViewProps {
  onProfileChange?: (profile: CompanyProfileRecord) => void;
}

export const CompanyProfileView: React.FC<CompanyProfileViewProps> = ({
  onProfileChange,
}) => {
  const [profile, setProfile] = useState<CompanyProfileRecord | null>(null);
  const [form, setForm] = useState<CompanyProfileInput>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await companiesApi.getMine();
        if (active) {
          setProfile(result);
          setForm(toForm(result));
        }
      } catch (requestError) {
        if (!(
          axios.isAxiosError(requestError) &&
          requestError.response?.status === 404
        )) {
          if (active) setError(getApiErrorMessage(requestError));
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const update = (key: keyof CompanyProfileInput, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const saveProfile = async (): Promise<CompanyProfileRecord | null> => {
    setSaving(true);
    setError(null);
    try {
      let documentId = form.registrationDocumentFileId || null;
      if (selectedDocument) {
        setUploadingDocument(true);
        const uploaded = await uploadPrivateFile(
          selectedDocument,
          "COMPANY_REGISTRATION",
        );
        documentId = uploaded.id;
        setUploadingDocument(false);
      }
      const payload = Object.fromEntries(
        Object.entries({ ...form, registrationDocumentFileId: documentId }).map(
          ([key, value]) => [
            key,
            typeof value === "string" ? value.trim() || null : value,
          ],
        ),
      ) as unknown as CompanyProfileInput;
      payload.companyName = form.companyName.trim();
      const result = profile
        ? await companiesApi.updateMine(payload)
        : await companiesApi.createMine(payload);
      setProfile(result);
      setForm(toForm(result));
      setSelectedDocument(null);
      onProfileChange?.(result);
      return result;
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
      return null;
    } finally {
      setUploadingDocument(false);
      setSaving(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveProfile();
  };

  const submitForVerification = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const saved = await saveProfile();
      if (!saved) return;
      const result = await companiesApi.submitVerification();
      setProfile(result);
      setForm(toForm(result));
      onProfileChange?.(result);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const isLocked = profile?.status === "PENDING" || profile?.status === "SUSPENDED";
  const identityLocked = profile?.status === "APPROVED";

  if (loading) return <LoadingState />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-indigo-600 p-3 text-white">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Đăng ký doanh nghiệp
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Hoàn thiện thông tin để gửi hồ sơ cho hệ thống xác minh.
            </p>
          </div>
        </div>
        {profile && <VerificationStatus profile={profile} />}
        {error && (
          <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}
        <form
          onSubmit={(event) => void submit(event)}
          className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <TextField
            label="Tên doanh nghiệp"
            required
            disabled={isLocked || identityLocked}
            value={form.companyName}
            onChange={(value) => update("companyName", value)}
          />
          <TextField
            label="Mã số doanh nghiệp"
            required
            disabled={isLocked || identityLocked}
            value={form.businessRegistrationNumber ?? ""}
            onChange={(value) => update("businessRegistrationNumber", value)}
            placeholder="Ví dụ: 0123456789"
          />
          <TextField
            label="Email liên hệ"
            type="email"
            required
            disabled={isLocked || identityLocked}
            value={form.contactEmail ?? ""}
            onChange={(value) => update("contactEmail", value)}
          />
          <TextField
            label="Người liên hệ"
            required
            disabled={isLocked || identityLocked}
            value={form.contactPersonName ?? ""}
            onChange={(value) => update("contactPersonName", value)}
          />
          <TextField
            label="Số điện thoại liên hệ"
            required
            disabled={isLocked || identityLocked}
            value={form.contactPhone ?? ""}
            onChange={(value) => update("contactPhone", value)}
          />
          <TextField
            label="Lĩnh vực hoạt động"
            disabled={isLocked}
            value={form.industry ?? ""}
            onChange={(value) => update("industry", value)}
          />
          <TextField
            label="Website"
            type="url"
            disabled={isLocked}
            placeholder="https://example.com"
            value={form.website ?? ""}
            onChange={(value) => update("website", value)}
          />
          <TextField
            label="Slogan ngắn"
            disabled={isLocked}
            value={form.tagline ?? ""}
            onChange={(value) => update("tagline", value)}
          />
          <TextField
            label="Địa chỉ"
            required
            disabled={isLocked || identityLocked}
            value={form.address ?? ""}
            onChange={(value) => update("address", value)}
          />
          <div className="md:col-span-2">
            <TextField
              label="URL logo"
              type="url"
              disabled={isLocked}
              placeholder="https://..."
              value={form.logo ?? ""}
              onChange={(value) => update("logo", value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-bold text-slate-800">
              Giới thiệu doanh nghiệp
            </label>
            <textarea
              rows={5}
              disabled={isLocked}
              value={form.description ?? ""}
              onChange={(event) => update("description", event.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
            />
          </div>
          <div className="md:col-span-2 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-indigo-950">
                  Giấy đăng ký doanh nghiệp <span className="text-rose-600">*</span>
                </p>
                <p className="mt-1 text-xs leading-5 text-indigo-900/70">
                  PDF, JPG hoặc PNG, tối đa 10 MB. Tài liệu chỉ dành cho doanh nghiệp và quản trị viên.
                </p>
              </div>
              {profile?.registrationDocumentFileId && (
                <button
                  type="button"
                  onClick={() => void downloadPrivateFile(profile.registrationDocumentFileId!)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-indigo-700 shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" /> Xem tài liệu
                </button>
              )}
            </div>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              disabled={isLocked || identityLocked || uploadingDocument}
              onChange={(event) => setSelectedDocument(event.target.files?.[0] ?? null)}
              className="mt-3 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:text-indigo-700"
            />
            <p className="mt-2 text-xs text-slate-500">
              {selectedDocument?.name || profile?.registrationDocument?.originalName || "Chưa chọn tài liệu"}
            </p>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving || submitting || isLocked}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving || uploadingDocument ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lưu hồ sơ
            </button>
            {(!profile || profile.status === "DRAFT" || profile.status === "REJECTED") && (
              <button
                type="button"
                onClick={() => void submitForVerification()}
                disabled={saving || submitting || uploadingDocument}
                className="ml-2 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Gửi hồ sơ xác minh
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
};

function VerificationStatus({ profile }: { profile: CompanyProfileRecord }) {
  const content =
    profile.status === "APPROVED"
      ? {
          Icon: CheckCircle2,
          title: "Đã được nhà trường xác minh hồ sơ",
          body: profile.reviewedAt
            ? `Đã duyệt ngày ${new Date(profile.reviewedAt).toLocaleDateString("vi-VN")}.`
            : "Hồ sơ của bạn đã được duyệt.",
          className: "border-emerald-200 bg-emerald-50 text-emerald-800",
        }
      : profile.status === "SUSPENDED"
        ? {
            Icon: XCircle,
            title: "Quyền doanh nghiệp đang bị tạm đình chỉ",
            body: profile.suspensionReason || "Vui lòng liên hệ quản trị viên.",
            className: "border-rose-200 bg-rose-50 text-rose-800",
          }
        : profile.status === "REJECTED"
        ? {
            Icon: XCircle,
            title: "Hồ sơ cần bổ sung",
            body:
              profile.rejectionReason ||
              "Hãy cập nhật thông tin và gửi duyệt lại.",
            className: "border-rose-200 bg-rose-50 text-rose-800",
          }
        : profile.status === "PENDING"
          ? {
              Icon: Clock3,
              title: "Nhà trường đang kiểm tra hồ sơ",
              body: "Bạn chưa thể đăng tin hoặc xử lý ứng viên trong thời gian chờ duyệt.",
              className: "border-amber-200 bg-amber-50 text-amber-800",
            }
          : {
          Icon: Clock3,
            title: "Hồ sơ đang soạn",
            body: "Bổ sung đủ thông tin và gửi hồ sơ để nhà trường kiểm tra.",
            className: "border-amber-200 bg-amber-50 text-amber-800",
            };
  const { Icon } = content;
  return (
    <div
      className={`mt-6 flex gap-3 rounded-xl border p-4 ${content.className}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="text-sm font-bold">{content.title}</p>
        <p className="mt-1 text-xs leading-relaxed">{content.body}</p>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block text-xs font-bold text-slate-800">
      {label}
      {required ? " *" : ""}
      <input
        required={required}
        type={type}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm font-normal"
      />
    </label>
  );
}

function LoadingState() {
  return (
    <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">
      <LoaderCircle className="mx-auto mb-3 h-5 w-5 animate-spin" />
      Đang tải hồ sơ doanh nghiệp...
    </div>
  );
}
