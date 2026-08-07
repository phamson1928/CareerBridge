import React, { ChangeEvent, useEffect, useState } from "react";
import { Download, Eye, FileUp, LoaderCircle, X } from "lucide-react";
import {
  getApiErrorMessage,
  getPrivateFileDownloadUrl,
  uploadPrivateFile,
} from "../../files/api";

interface CvUploadProps {
  fileId?: string;
  fileName?: string;
  mimeType?: string;
  onUploaded: (file: { id: string; originalName: string }) => void;
}

export const CvUpload: React.FC<CvUploadProps> = ({
  fileId,
  fileName,
  mimeType,
  onUploaded,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > 10 * 1024 * 1024) {
      setSelectedFile(null);
      setError("CV không được vượt quá 10 MB.");
      return;
    }
    setSelectedFile(file);
    setError(null);
  };

  useEffect(() => {
    setPreviewUrl(null);
  }, [fileId]);

  const uploadCv = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    try {
      const uploaded = await uploadPrivateFile(selectedFile, "CV");
      onUploaded({ id: uploaded.id, originalName: uploaded.originalName });
      setSelectedFile(null);
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError));
    } finally {
      setIsUploading(false);
    }
  };

  const downloadCv = async () => {
    if (!fileId) return;
    setIsDownloading(true);
    setError(null);
    try {
      const result = await getPrivateFileDownloadUrl(fileId);
      window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (downloadError) {
      setError(getApiErrorMessage(downloadError));
    } finally {
      setIsDownloading(false);
    }
  };

  const previewCv = async () => {
    if (!fileId) return;
    setIsPreviewing(true);
    setError(null);
    try {
      const result = await getPrivateFileDownloadUrl(fileId);
      setPreviewUrl(result.downloadUrl);
    } catch (previewError) {
      setError(getApiErrorMessage(previewError));
    } finally {
      setIsPreviewing(false);
    }
  };

  const canPreviewPdf = mimeType === "application/pdf";

  return (
    <div className="space-y-3">
      <p className="text-xs text-indigo-900 font-semibold">
        {fileName || "Chưa tải CV lên hệ thống"}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={selectFile}
          className="w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:text-indigo-700"
        />
        <button
          onClick={() => void uploadCv()}
          disabled={!selectedFile || isUploading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? (
            <LoaderCircle className="w-4 h-4 animate-spin" />
          ) : (
            <FileUp className="w-4 h-4" />
          )}{" "}
          Cập nhật CV
        </button>
        {fileId && (
          <>
            {canPreviewPdf && (
              <button
                onClick={() => void previewCv()}
                disabled={isPreviewing}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 disabled:opacity-50"
              >
                {isPreviewing ? (
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}{" "}
                Xem trước
              </button>
            )}
            <button
              onClick={() => void downloadCv()}
              disabled={isDownloading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 disabled:opacity-50"
            >
              {isDownloading ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}{" "}
              Xem / tải CV
            </button>
          </>
        )}
      </div>
      <p className="text-[11px] text-slate-500">
        Chấp nhận PDF, DOC, DOCX; tối đa 10 MB.
      </p>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      {previewUrl && canPreviewPdf && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
            <p className="text-xs font-bold text-slate-700">
              Xem trước PDF: {fileName}
            </p>
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
              title="Đóng xem trước"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <iframe
            title={`CV ${fileName ?? "PDF"}`}
            src={previewUrl}
            className="h-[560px] w-full bg-white"
          />
        </div>
      )}
    </div>
  );
};
