import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient, isAdmin, validateUpload } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side upload route that uses the service role key to bypass
 * Supabase Storage RLS policies. Only accessible to admins.
 */
export async function POST(req: NextRequest) {
  // 1. Verify the caller is authenticated
  const supabaseAuth = createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Verify admin role using service role key (bypasses RLS)
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. Parse the multipart form data
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const bucket = formData.get("bucket") as string | null;
  const path = formData.get("path") as string | null;

  if (!file || !bucket || !path) {
    return NextResponse.json(
      { error: "Missing file, bucket, or path" },
      { status: 400 }
    );
  }

  // 4. Validate file type, size, and bucket
  const validationError = validateUpload(file, bucket);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // 5. Sanitize path — prevent directory traversal
  const sanitizedPath = path.replace(/\.\./g, "").replace(/\/\//g, "/");

  // 6. Upload using service role key (bypasses RLS)
  const supabaseAdmin = createServiceRoleClient();

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(sanitizedPath, file, { upsert: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(sanitizedPath);

  return NextResponse.json({ url: data.publicUrl });
}
