// Supabase Edge Function: ai-coach
// Proxies requests to the Gemini API using the admin's API key stored as a Supabase secret.
// The key never leaves the server — clients only receive the AI's text response.
// Supports both text-only chat (IA Coach) and image analysis (screenshot scanner).

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_TEXT = 20_000;
const MAX_IMAGE_B64 = 7_000_000; // ~5 MB of image data
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    // verify_jwt only checks the signature, and the public anon key is a valid JWT too.
    // Ask Supabase Auth who the caller is so only signed-in users can spend the Gemini quota.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization header" }, 401);
    const authRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "" },
    });
    if (!authRes.ok) return json({ error: "Invalid or expired session" }, 401);
    const user = await authRes.json();
    if (!user?.id) return json({ error: "Invalid or expired session" }, 401);

    const body = await req.json();
    const systemPrompt: string = body.systemPrompt || "";
    const userMessage: string = body.userMessage || "";
    // Optional image input for the screenshot scanner
    const imageBase64: string | undefined = body.imageBase64;
    const imageMediaType: string = body.imageMediaType || "image/jpeg";

    if (!userMessage) return json({ error: "Missing userMessage" }, 400);
    if (typeof userMessage !== "string" || userMessage.length > MAX_TEXT) return json({ error: "userMessage too long" }, 413);
    if (typeof systemPrompt !== "string" || systemPrompt.length > MAX_TEXT) return json({ error: "systemPrompt too long" }, 413);
    if (imageBase64 !== undefined) {
      if (typeof imageBase64 !== "string" || imageBase64.length > MAX_IMAGE_B64) return json({ error: "Image too large" }, 413);
      if (!ALLOWED_IMAGE_TYPES.includes(imageMediaType)) return json({ error: "Unsupported image type" }, 400);
    }

    // Fast path: health check ping (used by the frontend to detect deployment status)
    if (userMessage === "__ping__") {
      const hasKey = !!Deno.env.get("GEMINI_API_KEY");
      return hasKey
        ? json({ ok: true, ping: true, text: "pong" })
        : json({ error: "AI service not configured by admin" }, 503);
    }

    // Load the API key from Supabase secrets (invisible to clients)
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return json({ error: "AI service not configured by admin" }, 503);
    }

    // Build the "parts" array for Gemini — text plus optional inline image
    const userParts: Record<string, unknown>[] = [];
    if (imageBase64) {
      userParts.push({
        inline_data: { mime_type: imageMediaType, data: imageBase64 },
      });
    }
    userParts.push({ text: userMessage });

    // Call Gemini with retry across models
    let lastError: string | null = null;
    for (const model of MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: userParts }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
          }),
        });
        const data = await res.json();
        if (data.error) {
          lastError = data.error.message || `Error ${data.error.code}`;
          console.warn(`Model ${model} failed:`, data.error?.code);
          continue;
        }
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return json({ text, model });
        }
        lastError = "Empty response from Gemini";
      } catch (e) {
        lastError = (e as Error).message;
        console.warn(`Model ${model} error:`, e);
      }
    }

    return json({ error: "All models failed" }, 502);

  } catch (e) {
    console.error("ai-coach function error:", e);
    return json({ error: "Internal error" }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
