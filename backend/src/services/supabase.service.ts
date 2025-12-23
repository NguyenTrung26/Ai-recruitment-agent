import { createClient } from "@supabase/supabase-js";
import { config } from "../config.ts";

export const supabase = createClient(
	config.supabase.url,
	config.supabase.serviceRoleKey || config.supabase.key
);

export const getPublicCvUrl = (path: string) =>
	`${config.supabase.url}/storage/v1/object/public/${config.supabase.bucket}/${path}`;

export const getStoragePathFromPublicUrl = (publicUrl: string) => {
	const marker = `/object/public/${config.supabase.bucket}/`;
	const idx = publicUrl.indexOf(marker);
	if (idx === -1) return publicUrl;
	return publicUrl.slice(idx + marker.length);
};
