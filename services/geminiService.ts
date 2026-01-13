
import { GoogleGenAI } from "@google/genai";

// 환경 변수 안전하게 가져오기
const getApiKey = () => {
  try {
    return (window as any).process?.env?.API_KEY || (import.meta as any).env?.VITE_API_KEY || "";
  } catch (e) {
    return "";
  }
};

export const geminiService = {
  async generateNotice(topic: string) {
    const apiKey = getApiKey();
    if (!apiKey) return "API 키가 설정되지 않았습니다.";
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `골프 모임 공지사항을 작성해주세요. 주제: ${topic}. 말투는 정중하고 명확하게 작성해주세요.`,
    });
    return response.text;
  },

  async analyzeFinances(records: any[]) {
    const apiKey = getApiKey();
    if (!apiKey) return "API 키가 설정되지 않았습니다.";

    const ai = new GoogleGenAI({ apiKey });
    const dataString = JSON.stringify(records);
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `다음 골프 모임 회비 내역을 분석하고 요약해주세요: ${dataString}. 한국어로 요약해주세요.`,
    });
    return response.text;
  }
};
