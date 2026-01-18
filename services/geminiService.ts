
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AnalysisConfig } from "../types";

// Initialize GoogleGenAI with error handling
let ai: GoogleGenAI | null = null;

// Read model names from environment variables with fallback defaults
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash';
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';

try {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  } else {
    console.warn("Gemini API key not found. Some features will be disabled.");
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI:", error);
}

export const extractTextFromImage = async (base64Data: string, mimeType: string): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini AI service not available. Please check your API key.");
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: [
        {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: "請將這張圖片中的所有文字辨識出來，並以純文字格式回傳。請直接回傳辨識出的內容，不要包含任何前言、解釋或額外的標點符號標籤。請確保輸出為繁體中文。" }
          ]
        }
      ]
    });
    return response.text || "";
  } catch (error: any) {
    console.error("Image text extraction failed:", error);

    // Handle specific API errors
    if (error.message && typeof error.message === 'string') {
      // Check for quota exceeded error
      if (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429')) {
        throw new Error("API 配額已用盡，請稍後再試或檢查您的 API 金鑰配額。");
      }

      // Check for authentication errors
      if (error.message.includes('API key') || error.message.includes('401') || error.message.includes('403')) {
        throw new Error("API 金鑰無效或權限不足，請檢查您的設定。");
      }
    }

    // Generic error message
    throw new Error("影像文字辨識失敗，請稍後再試。");
  }
};

export const analyzeText = async (
  text: string,
  config: AnalysisConfig
): Promise<AnalysisResult> => {
  if (!ai) {
    throw new Error("Gemini AI service not available. Please check your API key.");
  }
  const revisionIntensity = [
    "",
    "【極低度修改】：僅針對絕對的錯誤（錯字、標點）進行修正，絕對不要更動任何語法或詞彙。",
    "【低度修改】：除錯字外，僅針對明顯的病句或贅詞進行微調，盡可能保留原句結構。",
    "【中度修改】：在保留原意的基礎上，適度優化語句流暢度與用詞精準度。",
    "【高度修改】：積極尋找可以提升閱讀感的改寫方式，優化語氣與節奏。",
    "【深度改寫】：全方位優化。只要能讓表達更優雅、專業或精簡，請大膽進行改寫。"
  ][config.revisionLevel];

  // 根據勾選狀態動態生成禁令
  const redundancyRule = config.checkRedundancy
    ? `執行。僅刪除絕對多餘文字（修改強度：${config.revisionLevel}）。`
    : "【禁用】：嚴禁進行冗贅詞檢查。不論多麼囉唆，都必須原封不動保留。";

  const fluencyRule = config.checkFluency
    ? `執行。僅在必要時微調語句流暢度（修改強度：${config.revisionLevel}）。`
    : "【禁用】：嚴禁進行流暢度優化。不論多麼不通順，都必須保留原句結構。";

  const prompt = `你是一位極其嚴謹且技術精湛的專業中文編輯。
  
核心指令：
1. **修改幅度設定**：${revisionIntensity}
2. **零無關變動原則**：**絕對禁止**修改任何非必要的文字。若一部分文字不符合當前的功能勾選或強度需求，必須 100% 原封不動地保留。
3. **錯字與標點 (typo)**：永遠執行。修正錯別字與誤用標點。
4. **冗贅詞檢查 (redundancy)**：${redundancyRule}
5. **流暢度檢查 (fluency)**：${fluencyRule}

${config.stylePreference ? `**風格偏好**：在遵守上述「禁用」與「原則」的前提下，微調語氣為「${config.stylePreference}」。` : ''}

**差異標記格式要求**：
- **所有變動** 必須在 diffText 中以 [[INS:]] 或 [[DEL:]] 包裹。
- 如果某個功能被【禁用】，則 JSON 的 issues 列表中絕不能出現該類型的建議。

待分析文字：
"""
${text}
"""

請以 JSON 格式回傳：
{
  "revisedText": "校正後的純文字",
  "diffText": "包含 [[INS:]] 與 [[DEL:]] 標籤的對照文本",
  "issues": [
    {
      "original": "原文中有問題的部分",
      "suggested": "建議修改後的寫法",
      "reason": "簡短修改原因",
      "type": "typo | redundancy | fluency"
    }
  ],
  "summary": "事實描述已執行的修正。"
}`;

  let response;
  try {
    response = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            revisedText: { type: Type.STRING },
            diffText: { type: Type.STRING },
            summary: { type: Type.STRING },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  suggested: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  type: { type: Type.STRING },
                },
                required: ["original", "suggested", "reason", "type"],
              },
            },
          },
          required: ["revisedText", "diffText", "issues", "summary"],
        },
      },
    });
  } catch (error: any) {
    console.error("Gemini API error:", error);

    // Handle specific API errors
    if (error.message && typeof error.message === 'string') {
      // Check for quota exceeded error
      if (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429')) {
        throw new Error("API 配額已用盡，請稍後再試或檢查您的 API 金鑰配額。");
      }

      // Check for authentication errors
      if (error.message.includes('API key') || error.message.includes('401') || error.message.includes('403')) {
        throw new Error("API 金鑰無效或權限不足，請檢查您的設定。");
      }

      // Return a clean error message without JSON
      throw new Error("API 請求失敗，請稍後再試。");
    }

    // Fallback for unexpected error formats
    throw new Error("分析服務暫時無法使用，請稍後再試。");
  }

  try {
    const data = JSON.parse(response.text || "{}");
    // 再次在客戶端過濾，確保萬無一失
    data.issues = data.issues.filter((issue: any) => {
      if (issue.type === 'redundancy' && !config.checkRedundancy) return false;
      if (issue.type === 'fluency' && !config.checkFluency) return false;
      return true;
    });
    return data as AnalysisResult;
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error("無法解析分析結果，請重新嘗試。");
  }
};
