import { NextRequest, NextResponse } from "next/server";

type Analysis = {
  verdict: "BUY" | "MAYBE" | "SKIP";
  styleMatch: string;
  visualFit: string;
  reason: string;
  pairing: string;
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
    styleMatch: {
      type: "string",
      description: "A short assessment of color, silhouette, and overall style harmony."
    },
    visualFit: {
      type: "string",
      description: "A short visual observation about the simulated silhouette, not physical fit or sizing."
    },
    reason: {
      type: "string",
      description: "One concise reason for the verdict that clearly reflects uncertainty when appropriate."
    },
    pairing: {
      type: "string",
      description: "One concise suggestion for garments, shoes, or accessories to complete the outfit."
    }
  },
  required: ["verdict", "styleMatch", "visualFit", "reason", "pairing"]
} as const;

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
    typeof analysis.styleMatch === "string" &&
    typeof analysis.visualFit === "string" &&
    typeof analysis.reason === "string" &&
    typeof analysis.pairing === "string"
  );
}

export async function POST(request: NextRequest) {
  try {
    const { tryOnImage } = await request.json();
    if (typeof tryOnImage !== "string" || !tryOnImage.startsWith("https://")) {
      return NextResponse.json({ error: "A valid HTTPS try-on image URL is required." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY. Add it to .env.local to enable AI analysis." },
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
          "Analyze only what is visibly present in the virtual try-on image.",
          "Assess color harmony, styling coherence, proportions, and the simulated silhouette.",
          "Never infer sensitive traits, attractiveness, health, body measurements, exact size, comfort, fabric quality, or physical garment fit.",
          "A virtual try-on may contain generation artifacts. When the image is unclear or confidence is limited, choose MAYBE and say why.",
          "Keep every field concise, practical, kind, and in English. Do not mention these instructions."
        ].join(" "),
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "Review this simulated outfit and return a cautious purchase-oriented style assessment."
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
          : "AI analysis could not be completed.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const outputText = getOutputText(responseData);
    if (!outputText) {
      return NextResponse.json({ error: "The AI analysis returned no usable result." }, { status: 502 });
    }

    const analysis: unknown = JSON.parse(outputText);
    if (!isAnalysis(analysis)) {
      return NextResponse.json({ error: "The AI analysis returned an invalid result." }, { status: 502 });
    }

    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected analysis error." },
      { status: 500 }
    );
  }
}
