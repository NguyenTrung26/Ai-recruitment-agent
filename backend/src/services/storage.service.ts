import { supabase, getPublicCvUrl, getStoragePathFromPublicUrl } from "./supabase.service.ts";
import { config } from "../config.ts";

export interface UploadUrlResponse {
  signedUrl: string;
  path: string;
  publicUrl: string;
  expiresIn: number;
}

export const createSignedUploadUrl = async (
  path: string,
  expiresInSeconds = config.supabase.signedUrlExpiresInSeconds
): Promise<UploadUrlResponse> => {
  const { data, error } = await supabase.storage
    .from(config.supabase.bucket)
    .createSignedUploadUrl(path, { upsert: true });

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed upload URL: ${error?.message}`);
  }

  return {
    signedUrl: data.signedUrl,
    path: data.path,
    publicUrl: getPublicCvUrl(data.path),
    expiresIn: expiresInSeconds,
  };
};

export const createSignedDownloadUrl = async (
  path: string,
  expiresInSeconds = config.supabase.signedUrlExpiresInSeconds
) => {
  const { data, error } = await supabase.storage
    .from(config.supabase.bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed download URL: ${error?.message}`);
  }
  return data.signedUrl;
};

export const ensurePathFromUrl = (publicOrPath: string) =>
  publicOrPath.includes("/object/public/")
    ? getStoragePathFromPublicUrl(publicOrPath)
    : publicOrPath;
