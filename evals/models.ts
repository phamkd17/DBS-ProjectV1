/** Lists the Gemini models your key can use, so GEMINI_MODEL is a real id. */
import { GoogleGenAI } from "@google/genai";

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const pager = await ai.models.list();
  for await (const m of pager) {
    if (m.supportedActions?.includes("generateContent") && /flash/i.test(m.name ?? "")) {
      console.log(m.name?.replace("models/", ""), "—", m.displayName);
    }
  }
  console.log("\nGEMINI_MODEL is currently:", process.env.GEMINI_MODEL || "(not set)");
}

main();
