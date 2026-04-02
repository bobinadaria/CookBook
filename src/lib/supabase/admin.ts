import { createClient as createAdminClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with the service role key.
 * Use ONLY on the server side (API routes, middleware, server components).
 */
export function createServiceRoleClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Checks if a user has the 'admin' role using the service role key.
 * This bypasses RLS to ensure the role check cannot be tampered with.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[isAdmin] Failed to check role:", error.message, "userId:", userId);
  }

  return profile?.role === "admin";
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validates that a string is a valid UUID v4 */
export function isValidUUID(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_BUCKETS = new Set(["recipe-covers", "step-photos"]);

/** Validates an uploaded file (type, size) and bucket name */
export function validateUpload(file: File, bucket: string): string | null {
  if (!ALLOWED_BUCKETS.has(bucket)) {
    return `Invalid bucket: ${bucket}`;
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB`;
  }
  if (file.size === 0) {
    return "File is empty";
  }
  return null; // valid
}
