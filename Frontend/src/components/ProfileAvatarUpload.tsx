import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Camera, LoaderCircle, Trash2 } from "lucide-react";
import { getPrivateFileDownloadUrl, uploadPrivateFile } from "../files/api";

interface ProfileAvatarUploadProps {
  fileId?: string | null;
  fallback: string;
  accentClassName?: string;
  disabled?: boolean;
  onChange: (fileId: string | null) => void;
  onError: (message: string) => void;
}

interface ProfileAvatarPreviewProps {
  fileId?: string | null;
  fallback: string;
  className?: string;
  imageClassName?: string;
  onError?: (message: string) => void;
}

export function ProfileAvatarPreview({ fileId, fallback, className, imageClassName, onError }: ProfileAvatarPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    if (!fileId) { setPreviewUrl(null); return; }
    void (async () => {
      try {
        const { downloadUrl } = await getPrivateFileDownloadUrl(fileId);
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error("Không thể tải ảnh đại diện.");
        objectUrl = URL.createObjectURL(await response.blob());
        if (active) setPreviewUrl(objectUrl);
      } catch (error) {
        if (active) onError?.(error instanceof Error ? error.message : "Không thể tải ảnh đại diện.");
      }
    })();
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [fileId, onError]);
  return <div className={className}>{previewUrl ? <img src={previewUrl} alt="Ảnh đại diện" className={imageClassName} /> : fallback}</div>;
}

export function ProfileAvatarUpload({
  fileId,
  fallback,
  accentClassName = "from-blue-600 to-indigo-600",
  disabled = false,
  onChange,
  onError,
}: ProfileAvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    if (!fileId) {
      setPreviewUrl(null);
      return;
    }
    void (async () => {
      try {
        const { downloadUrl } = await getPrivateFileDownloadUrl(fileId);
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error("Không thể tải ảnh đại diện.");
        objectUrl = URL.createObjectURL(await response.blob());
        if (active) setPreviewUrl(objectUrl);
      } catch (error) {
        if (active) onError(error instanceof Error ? error.message : "Không thể tải ảnh đại diện.");
      }
    })();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId, onError]);

  const selectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      onError("Avatar chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onError("Ảnh đại diện không được vượt quá 5 MB.");
      return;
    }
    setIsLoading(true);
    try {
      const uploaded = await uploadPrivateFile(file, "AVATAR");
      onChange(uploaded.id);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Không thể tải ảnh đại diện lên.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 md:col-span-2">
      <div className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-tr ${accentClassName} text-2xl font-black text-white`}>
        {previewUrl ? <img src={previewUrl} alt="Ảnh đại diện xem trước" className="h-full w-full object-cover" /> : fallback}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-800">Ảnh đại diện</p>
        <p className="mt-1 text-xs text-slate-500">JPG, PNG hoặc WebP · tối đa 5 MB</p>
        <div className="mt-3 flex gap-2">
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void selectFile(event)} />
          <button type="button" disabled={disabled || isLoading} onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50">
            {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {fileId ? "Đổi ảnh" : "Tải ảnh lên"}
          </button>
          {fileId && <button type="button" disabled={disabled || isLoading} onClick={() => onChange(null)} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-4 w-4" />Xóa ảnh</button>}
        </div>
      </div>
    </div>
  );
}
