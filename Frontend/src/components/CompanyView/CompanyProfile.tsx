import React, { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import {
  Building2,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Save,
  XCircle,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import {
  companiesApi,
  CompanyProfileInput,
  CompanyProfileRecord,
} from "../../companies/api";

const emptyForm: CompanyProfileInput = {
  companyName: "",
  tagline: "",
  description: "",
  industry: "",
  website: "",
  address: "",
  logo: "",
  contactEmail: "",
};

const toForm = (profile: CompanyProfileRecord): CompanyProfileInput => ({
  companyName: profile.companyName,
  tagline: profile.tagline ?? "",
  description: profile.description ?? "",
  industry: profile.industry ?? "",
  website: profile.website ?? "",
  address: profile.address ?? "",
  logo: profile.logo ?? "",
  contactEmail: profile.contactEmail ?? "",
});

export const CompanyProfileView: React.FC = () => {
  const [profile, setProfile] = useState<CompanyProfileRecord | null>(null);
  const [form, setForm] = useState<CompanyProfileInput>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() || null : value,
      ]),
    ) as unknown as CompanyProfileInput;
    payload.companyName = form.companyName.trim();
    try {
      const result = profile
        ? await companiesApi.updateMine(payload)
        : await companiesApi.createMine(payload);
      setProfile(result);
      setForm(toForm(result));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

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
            value={form.companyName}
            onChange={(value) => update("companyName", value)}
          />
          <TextField
            label="Email liên hệ"
            type="email"
            value={form.contactEmail ?? ""}
            onChange={(value) => update("contactEmail", value)}
          />
          <TextField
            label="Lĩnh vực hoạt động"
            value={form.industry ?? ""}
            onChange={(value) => update("industry", value)}
          />
          <TextField
            label="Website"
            type="url"
            placeholder="https://example.com"
            value={form.website ?? ""}
            onChange={(value) => update("website", value)}
          />
          <TextField
            label="Slogan ngắn"
            value={form.tagline ?? ""}
            onChange={(value) => update("tagline", value)}
          />
          <TextField
            label="Địa chỉ"
            value={form.address ?? ""}
            onChange={(value) => update("address", value)}
          />
          <div className="md:col-span-2">
            <TextField
              label="URL logo"
              type="url"
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
              value={form.description ?? ""}
              onChange={(event) => update("description", event.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <button
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {profile ? "Cập nhật và gửi duyệt lại" : "Gửi đăng ký"}
            </button>
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
          title: "Doanh nghiệp đã được xác minh",
          body: "Hồ sơ của bạn đã được duyệt.",
          className: "border-emerald-200 bg-emerald-50 text-emerald-800",
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
        : {
            Icon: Clock3,
            title: "Hồ sơ đang chờ duyệt",
            body: "Bạn sẽ có thể sử dụng các chức năng doanh nghiệp sau khi hồ sơ được xác minh.",
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-bold text-slate-800">
      {label}
      {required ? " *" : ""}
      <input
        required={required}
        type={type}
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
