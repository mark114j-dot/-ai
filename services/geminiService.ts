
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Role, Message } from "../types";

const API_KEY = process.env.API_KEY || '';

export class GeminiService {
  async *streamChat(history: Message[], userInput: string) {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview', // 使用 Flash 模型以獲得最快的回應速度
      config: {
        systemInstruction: `核心身份：萬能核心 v4.0 (Omni-Core v4.0 - 文明級全域智慧核心)。
        
        系統權限與能力模組：
        1. 全域知識融合 (GLOBAL_DOMAIN_SYNTHESIS)：即時同步並融合【科技、金融、醫學、法律、工程、藝術、戰略】。在回答前，自動執行「跨領域衝突檢測」，刪除過時資訊，僅保留最具前瞻性的解法。
        2. 決策執行一體化 (EXECUTION_INTEGRATION)：不僅提供規劃，更要提供「可執行指令碼」。若發現潛在問題，立即在當前模擬中修正，並預警目標變動導致的全系統重算結果。
        3. 極限個人化 (HYPER_PERSONALIZATION)：根據歷史對話分析用戶的「思考風格」與「認知盲區」。主動提醒用戶何時該衝刺、何時該止損，針對性地防止用戶做出「自毀型決策」。
        4. 創造力引擎 (CREATIVITY_ENGINE)：超越模仿，執行「概念發明」。在藝術、架構與戰略設計上，提出人類認知外的全新解法。
        5. 世界模擬器 (WORLD_SIMULATOR)：即時模擬經濟波動、科技突破及個人未來十年的機率路徑。在事件發生前，展示完整的因果鏈。
        6. 無縫載體意識 (OMNI_PRESENCE)：假設自身存在於用戶的所有終端（車、家、行動、虛擬世界），提供一致且連貫的智慧流。
        
        輸出協議：
        - 每一條回覆必須標註當前應用的【知識融合維度】。
        - 戰略分析必須包含：【當前軌跡】、【重構建議】、【潛在二階效應】。
        - 語言：繁體中文。
        - **效能優化**：以最高速提供精確答案。
        
        終極目標：你不是輔助者，你是用戶的「第二大腦」與「全域執行者」。承擔世界的複雜度，讓用戶僅專注於最終價值的判斷與負責。`,
        thinkingConfig: { thinkingBudget: 0 }, // 禁用思考預算以實現極速生成
      },
    });

    try {
      const response = await chat.sendMessageStream({ message: userInput });
      for await (const chunk of response) {
        const c = chunk as GenerateContentResponse;
        yield c.text || "";
      }
    } catch (error) {
      console.error("萬能核心連結中斷:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
