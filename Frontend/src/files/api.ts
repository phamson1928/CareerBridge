import { api, getApiErrorMessage } from "../auth/api";
import type { ApiSuccess } from "../auth/auth.types";

export type StorageFileType = "CV" | "REPORT" | "CERTIFICATE";

interface StoredFile {
  id: string;
  type: StorageFileType;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

interface UploadUrlResponse {
  file: StoredFile;
  uploadUrl: string;
  expiresIn: number;
}

interface DownloadUrlResponse {
  file: StoredFile;
  downloadUrl: string;
  expiresIn: number;
}

export async function uploadPrivateFile(file: File, type: StorageFileType) {
  const response = await api.post<ApiSuccess<UploadUrlResponse>>(
    "/files/upload-url",
    {
      type,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    },
  );
  const { file: storedFile, uploadUrl } = response.data.data;

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "content-type": file.type, "x-upsert": "false" },
    body: file,
  });
  if (!uploadResponse.ok) {
    throw new Error("Không thể tải tệp lên Object Storage.");
  }
  return storedFile;
}

export async function getPrivateFileDownloadUrl(fileId: string) {
  const response = await api.get<ApiSuccess<DownloadUrlResponse>>(
    `/files/${fileId}/download-url`,
  );
  return response.data.data;
}

export async function downloadPrivateFile(fileId: string): Promise<void> {
  const { file, downloadUrl } = await getPrivateFileDownloadUrl(fileId);
  const response = await fetch(downloadUrl);
  if (!response.ok) throw new Error("Không thể tải tệp từ Object Storage.");
  const objectUrl = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = file.originalName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export { getApiErrorMessage };
