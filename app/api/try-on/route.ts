import { NextRequest, NextResponse } from "next/server";

const FASHN_BASE_URL = "https://api.fashn.ai/v1";
const FASHN_WAIT_MS = 1800;
const FASHN_MAX_POLLS = 30;
const DASHSCOPE_MODEL = process.env.DASHSCOPE_MODEL || "aitryon";
const DASHSCOPE_BASE_URL = (process.env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com").replace(/\/$/, "");
const ACTIVE_DASHSCOPE_STATUSES = ["PENDING", "PRE-PROCESSING", "RUNNING", "POST-PROCESSING"];

type UploadPolicy = {
  policy: string;
  signature: string;
  upload_dir: string;
  upload_host: string;
  oss_access_key_id: string;
  x_oss_object_acl: string;
  x_oss_forbid_overwrite: string;
};

function getProvider() {
  if (process.env.TRYON_PROVIDER) return process.env.TRYON_PROVIDER.toLowerCase();
  return process.env.DASHSCOPE_API_KEY ? "dashscope" : "fashn";
}

function dataUriToFile(dataUri: string, basename: string) {
  const match = dataUri.match(/^data:(image\/(?:jpeg|png|bmp|webp));base64,(.+)$/i);
  if (!match) throw new Error("فرمت عکس پشتیبانی نمی‌شود؛ JPG، PNG، BMP یا WEBP انتخاب کنید.");

  const mime = match[1].toLowerCase();
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.byteLength < 5 * 1024 || bytes.byteLength > 5 * 1024 * 1024) {
    throw new Error("حجم هر عکس باید بین ۵ کیلوبایت تا ۵ مگابایت باشد.");
  }

  const extension = mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
  return { blob: new Blob([bytes], { type: mime }), filename: `${basename}-${crypto.randomUUID()}.${extension}` };
}

async function uploadToDashScope(apiKey: string, dataUri: string, basename: string) {
  const policyResponse = await fetch(
    `https://dashscope.aliyuncs.com/api/v1/uploads?action=getPolicy&model=${encodeURIComponent(DASHSCOPE_MODEL)}`,
    { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, cache: "no-store" }
  );
  const policyPayload = await policyResponse.json();
  if (!policyResponse.ok || !policyPayload.data) {
    throw new Error(policyPayload.message || "مجوز موقت آپلود عکس از سرویس علی‌بابا دریافت نشد.");
  }

  const policy = policyPayload.data as UploadPolicy;
  const file = dataUriToFile(dataUri, basename);
  const key = `${policy.upload_dir}/${file.filename}`;
  const form = new FormData();
  form.append("OSSAccessKeyId", policy.oss_access_key_id);
  form.append("policy", policy.policy);
  form.append("Signature", policy.signature);
  form.append("key", key);
  form.append("x-oss-object-acl", policy.x_oss_object_acl);
  form.append("x-oss-forbid-overwrite", policy.x_oss_forbid_overwrite);
  form.append("success_action_status", "200");
  form.append("file", file.blob, file.filename);

  const uploadResponse = await fetch(policy.upload_host, { method: "POST", body: form });
  if (!uploadResponse.ok) throw new Error("آپلود موقت عکس برای پرو مجازی انجام نشد.");
  return `oss://${key}`;
}

async function startDashScopeTryOn(apiKey: string, modelImage: string, garmentImage: string) {
  const [personUrl, garmentUrl] = await Promise.all([
    uploadToDashScope(apiKey, modelImage, "person"),
    uploadToDashScope(apiKey, garmentImage, "garment")
  ]);

  const response = await fetch(`${DASHSCOPE_BASE_URL}/api/v1/services/aigc/image2image/image-synthesis`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-DashScope-Async": "enable",
      "X-DashScope-OssResourceResolve": "enable"
    },
    body: JSON.stringify({
      model: DASHSCOPE_MODEL,
      input: { person_image_url: personUrl, top_garment_url: garmentUrl },
      parameters: { resolution: 1024, restore_face: true }
    })
  });
  const payload = await response.json();
  const taskId = payload.output?.task_id;
  if (!response.ok || !taskId) {
    throw new Error(payload.message || payload.output?.message || "پرو مجازی در سرویس علی‌بابا شروع نشد.");
  }

  return NextResponse.json({ pending: true, provider: "dashscope", taskId }, { status: 202 });
}

async function startFashnTryOn(apiKey: string, modelImage: string, garmentImage: string) {
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
  const runResponse = await fetch(`${FASHN_BASE_URL}/run`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model_name: "tryon-v1.6",
      inputs: {
        model_image: modelImage,
        garment_image: garmentImage,
        category: "auto",
        garment_photo_type: "auto",
        mode: "balanced",
        num_samples: 1,
        output_format: "jpeg"
      }
    })
  });
  const runData = await runResponse.json();
  if (!runResponse.ok || !runData.id) throw new Error(runData.error || "پرو مجازی شروع نشد؛ دوباره تلاش کنید.");

  for (let i = 0; i < FASHN_MAX_POLLS; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, FASHN_WAIT_MS));
    const statusResponse = await fetch(`${FASHN_BASE_URL}/status/${runData.id}`, { headers });
    const statusData = await statusResponse.json();
    if (statusData.status === "completed" && statusData.output?.[0]) {
      return NextResponse.json({ output: statusData.output[0], predictionId: runData.id });
    }
    if (!["starting", "in_queue", "processing"].includes(statusData.status)) {
      throw new Error(statusData.error || "ساخت پرو مجازی انجام نشد.");
    }
  }
  throw new Error("زمان ساخت پرو مجازی طولانی شد؛ دوباره تلاش کنید.");
}

export async function POST(request: NextRequest) {
  try {
    const { modelImage, garmentImage } = await request.json();
    if (!modelImage || !garmentImage) {
      return NextResponse.json({ error: "عکس شخص و لباس هر دو لازم هستند." }, { status: 400 });
    }

    const provider = getProvider();
    if (provider === "dashscope") {
      const apiKey = process.env.DASHSCOPE_API_KEY;
      if (!apiKey) return NextResponse.json({ error: "کلید سرویس پرو مجازی علی‌بابا تنظیم نشده است." }, { status: 503 });
      return await startDashScopeTryOn(apiKey, modelImage, garmentImage);
    }

    const apiKey = process.env.FASHN_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "سرویس پرو مجازی در حال حاضر فعال نیست." }, { status: 503 });
    return await startFashnTryOn(apiKey, modelImage, garmentImage);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "خطای پیش‌بینی‌نشده در سرور." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const taskId = request.nextUrl.searchParams.get("taskId");
  if (!taskId || !/^[a-zA-Z0-9-]+$/.test(taskId)) {
    return NextResponse.json({ error: "شناسه پردازش معتبر نیست." }, { status: 400 });
  }

  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "سرویس پرو مجازی فعال نیست." }, { status: 503 });

  try {
    const response = await fetch(`${DASHSCOPE_BASE_URL}/api/v1/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store"
    });
    const payload = await response.json();
    const status = payload.output?.task_status;

    if (response.ok && status === "SUCCEEDED" && payload.output?.image_url) {
      return NextResponse.json({ output: payload.output.image_url, predictionId: taskId });
    }
    if (response.ok && ACTIVE_DASHSCOPE_STATUSES.includes(status)) {
      return NextResponse.json({ pending: true, status }, { status: 202 });
    }
    return NextResponse.json(
      { error: payload.output?.message || payload.message || "ساخت پرو مجازی انجام نشد." },
      { status: response.ok ? 502 : response.status }
    );
  } catch {
    return NextResponse.json({ error: "ارتباط با سرویس پرو مجازی برقرار نشد." }, { status: 502 });
  }
}
