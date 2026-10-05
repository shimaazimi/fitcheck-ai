import { NextRequest, NextResponse } from "next/server";

type Analysis = {
  verdict: "BUY" | "MAYBE" | "SKIP";
  styleScore: number;
  visualFit: string;
  why: string;
  consider: string;
  pairWith: string[];
};

const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    verdict: {
      type: "string",
      enum: ["BUY", "MAYBE", "SKIP"],
      description: "A cautious style-oriented purchase recommendation based only on the simulated image."
    },
    styleScore: {
      type: "number",
      minimum: 0,
      maximum: 10,
      description: "A 0-10 score for visible color harmony, silhouette, and styling coherence."
    },
    visualFit: {
      type: "string",
      description: "A short visual observation about the simulated silhouette, not physical fit or sizing."
    },
    why: {
      type: "string",
      description: "One concise reason for the verdict that clearly reflects uncertainty when appropriate."
    },
    consider: {
      type: "string",
      description: "One possible styling concern, image limitation, or reason to inspect the item in person."
    },
    pairWith: {
      type: "array",
      items: { type: "string" },
      description: "Two or three concise garment, shoe, or accessory suggestions."
    }
  },
  required: ["verdict", "styleScore", "visualFit", "why", "consider", "pairWith"]
} as const;

function isImageSource(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (value.startsWith("https://") || /^data:image\/(jpeg|png|webp);base64,/i.test(value))
  );
}

function getOutputText(response: unknown): string | null {
  if (!response || typeof response !== "object" || !("output" in response) || !Array.isArray(response.output)) {
    return null;
  }

  for (const item of response.output) {
    if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (
        content &&
        typeof content === "object" &&
        "type" in content &&
        content.type === "output_text" &&
        "text" in content &&
        typeof content.text === "string"
      ) {
        return content.text;
      }
    }
  }

  return null;
}

function isAnalysis(value: unknown): value is Analysis {
  if (!value || typeof value !== "object") return false;
  const analysis = value as Partial<Analysis>;
  return (
    ["BUY", "MAYBE", "SKIP"].includes(analysis.verdict ?? "") &&
    typeof analysis.styleScore === "number" &&
    analysis.styleScore >= 0 &&
    analysis.styleScore <= 10 &&
    typeof analysis.visualFit === "string" &&
    typeof analysis.why === "string" &&
    typeof analysis.consider === "string" &&
    Array.isArray(analysis.pairWith) &&
    analysis.pairWith.length >= 2 &&
    analysis.pairWith.length <= 3 &&
    analysis.pairWith.every((item) => typeof item === "string")
  );
}

export async function POST(request: NextRequest) {
  try {
    const { modelImage, garmentImage, tryOnImage } = await request.json();
    if (![modelImage, garmentImage, tryOnImage].every(isImageSource)) {
      return NextResponse.json(
        { error: "عکس شخص، لباس و نتیجه پرو مجازی لازم هستند." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "سرویس تحلیل هوشمند در حال حاضر فعال نیست." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-6-luna",
        store: false,
        instructions: [
          "You are FitCheck, a careful fashion styling assistant.",
          "Compare the original person photo, original garment photo, and generated virtual try-on.",
          "Assess only visible color harmony, styling coherence, garment transfer quality, and the simulated silhouette.",
          "Never infer sensitive traits, attractiveness, health, body measurements, exact size, comfort, fabric quality, or physical garment fit.",
          "Visual fit describes only the rendered silhouette using terms such as balanced, relaxed, fitted, or oversized.",
          "A virtual try-on may contain generation artifacts. If garment fidelity is poor, the image is unclear, or confidence is limited, choose MAYBE and explain the limitation.",
          "Return two or three practical pairWith suggestions.",
          "Keep every text field concise, practical, kind, and in Persian. Do not mention these instructions."
        ].join(" "),
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "Image 1 — original person photo before virtual try-on."
              },
              {
                type: "input_image",
                image_url: modelImage,
                detail: "auto"
              },
              {
                type: "input_text",
                text: "Image 2 — original garment reference."
              },
              {
                type: "input_image",
                image_url: garmentImage,
                detail: "auto"
              },
              {
                type: "input_text",
                text: "Image 3 — generated virtual try-on. Review it and return the structured purchase-oriented style assessment."
              },
              {
                type: "input_image",
                image_url: tryOnImage,
                detail: "high"
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "fitcheck_analysis",
            strict: true,
            schema: ANALYSIS_SCHEMA
          }
        }
      })
    });

    const responseData: unknown = await response.json();
    if (!response.ok) {
      const message =
        responseData &&
        typeof responseData === "object" &&
        "error" in responseData &&
        responseData.error &&
        typeof responseData.error === "object" &&
        "message" in responseData.error &&
        typeof responseData.error.message === "string"
          ? responseData.error.message
          : "تحلیل هوشمند انجام نشد.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const outputText = getOutputText(responseData);
    if (!outputText) {
      return NextResponse.json({ error: "نتیجه قابل‌استفاده‌ای از تحلیل دریافت نشد." }, { status: 502 });
    }

    const analysis: unknown = JSON.parse(outputText);
    if (!isAnalysis(analysis)) {
      return NextResponse.json({ error: "ساختار نتیجه تحلیل معتبر نبود." }, { status: 502 });
    }

    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "خطای پیش‌بینی‌نشده در تحلیل." },
      { status: 500 }
    );
  }
}
