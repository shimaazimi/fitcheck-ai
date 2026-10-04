# FitCheck AI — V0

A small AI-first fashion decision prototype:

1. Upload a person photo.
2. Upload a garment photo.
3. Generate a virtual try-on via FASHN Try-On v1.6.
4. Show a decision-oriented result screen.

## Run locally

```bash
npm install
cp .env.example .env.local
# add your FASHN_API_KEY and OPENAI_API_KEY to .env.local
npm run dev
```

Open http://localhost:3000

## Free demo mode

Click **Try free demo** to open a complete prepared try-on result and decision card without API keys or paid requests. The UI labels this mode clearly as a prepared demo. Live uploads still use the FASHN and OpenAI integrations when their keys are configured.

## Current architecture

- Next.js + React + TypeScript
- `/api/try-on` calls FASHN server-side, so the API key is not exposed to the browser
- `/api/analyze` sends the generated try-on image to the OpenAI Responses API and requests schema-validated style guidance
- `OPENAI_MODEL` is optional and defaults to `gpt-6-luna`
- `/public/demo` contains the prepared person, garment, and try-on assets used by the free demo flow

## Important product constraint

The V0 virtual try-on is a visual simulation. It should not claim exact size or physical garment fit without body measurements, garment measurements, and brand size-chart data.

## Analysis output

The multimodal analysis returns a structured response with:

- verdict: BUY / MAYBE / SKIP
- styleMatch
- visualFit
- reason
- pairing
