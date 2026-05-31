import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient, validateUpload } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * Best-effort per-user rate limit. NOTE: in-memory state lives per warm
 * serverless instance, so on Vercel this only blunts bursts that hit the same
 * instance — it is NOT a hard guarantee. Real quota enforcement arrives with the
 * credits/monetization layer; this just stops trivial abuse loops cheaply.
 */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20; // uploads per window per user
const uploadHits = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const recent = (uploadHits.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    uploadHits.set(userId, recent);
    return true;
  }
  recent.push(now);
  uploadHits.set(userId, recent);
  return false;
}

/**
 * Upload route for ANY authenticated user (unlike /api/admin/upload which is
 * admin-only). Used by the dashboard "My cookbook" form for recipe covers and
 * step photos.
 *
 * The storage path is decided by the server and namespaced under `u/<uid>/` so
 * one user can't overwrite another's files. Upload uses the service-role key to
 * bypass Storage RLS; allowed buckets/types/size are checked via validateUpload.
 */
export async function POST(req: NextRequest) {
  // 1. Require an authenticated session (no admin role needed).
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1b. Throttle rapid uploads (best-effort; see note above).
  if (isRateLimited(user.id)) {
    return NextResponse.json(
      { error: "Too many uploads. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  // 2. Parse multipart form data.
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const bucket = formData.get("bucket") as string | null;

  if (!file || !bucket) {
    return NextResponse.json({ error: "Missing file or bucket" }, { status: 400 });
  }

  // 3. Validate file type, size, and that the bucket is allowed.
  const validationError = validateUpload(file, bucket);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // 4. Server-controlled, per-user, ASCII-safe path.
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `u/${user.id}/${Date.now()}-${rand}.${ext}`;

  // 5. Upload with the service role key (bypasses Storage RLS).
  const supabaseAdmin = createServiceRoleClient();
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, { upsert: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
