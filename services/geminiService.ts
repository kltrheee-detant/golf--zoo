
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  async generateNotice(topic: string) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `골프 모임 공지사항을 작성해주세요. 주제: ${topic}. 말투는 정중하고 명확하게, 핵심 정보를 포함하여 한국어로 작성해주세요.`,
    });
    return response.text;
  },

  async analyzeFinances(records: any[]) {
    const dataString = JSON.stringify(records);
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `다음 골프 모임 회비 내역을 분석하고 요약해주세요: ${dataString}. 총 수입, 총 지출, 그리고 특이사항을 한국어로 짧게 요약해주세요.`,
    });
    return response.text;
  }
};
