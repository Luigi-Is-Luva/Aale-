import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set. Copy .env.example to .env and add your key.");
}

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
export const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
