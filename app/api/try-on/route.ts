import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.fashn.ai/v1";
const WAIT_MS = 1800;
const MAX_POLLS = 30;

export async function POST(request: NextRequest) {
  try {
    const { modelImage, garmentImage } = await request.json();
    if (!modelImage || !garmentImage) {
      return NextResponse.json({ error: "عکس شخص و لباس هر دو لازم هستند." }, { status: 400 });
    }

    const apiKey = process.env.FASHN_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "سرویس پرو مجازی در حال حاضر فعال نیست." },
        { status: 500 }
      );
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    };

    const runResponse = await fetch(`${BASE_URL}/run`, {
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
    if (!runResponse.ok || !runData.id) {
      return NextResponse.json({ error: runData.error || "پرو مجازی شروع نشد؛ دوباره تلاش کنید." }, { status: 502 });
    }

    for (let i = 0; i < MAX_POLLS; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, WAIT_MS));
      const statusResponse = await fetch(`${BASE_URL}/status/${runData.id}`, { headers });
      const statusData = await statusResponse.json();

      if (statusData.status === "completed" && statusData.output?.[0]) {
        return NextResponse.json({ output: statusData.output[0], predictionId: runData.id });
      }

      if (!["starting", "in_queue", "processing"].includes(statusData.status)) {
        return NextResponse.json({ error: statusData.error || "ساخت پرو مجازی انجام نشد." }, { status: 502 });
      }
    }

    return NextResponse.json({ error: "زمان ساخت پرو مجازی طولانی شد؛ دوباره تلاش کنید." }, { status: 504 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "خطای پیش‌بینی‌نشده در سرور." },
      { status: 500 }
    );
  }
}
