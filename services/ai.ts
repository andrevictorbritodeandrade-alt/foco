import { GoogleGenAI, Type } from "@google/genai";
import { Task } from "../types";

// Always use new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getNaggingMessage = async (pendingTasks: Task[]): Promise<string> => {
  if (pendingTasks.length === 0) return "Parabéns, André. Por enquanto você está limpo. Não se acostume.";

  // Fix: changed t.category to t.categoryId as t.category does not exist on Task type
  const taskList = pendingTasks.map(t => `- [${t.categoryId}] ${t.text}`).join('\n');
  
  const prompt = `
    Você é o Coach de Produtividade Agressivo do André. 
    Ele tem as seguintes tarefas pendentes:
    ${taskList}

    Sua missão: Escrever UMA frase curta (máximo 15 palavras) que seja irritante, direta e motivadora para o André parar de procrastinar. 
    Use um tom sarcástico ou autoritário, mas focado no André. 
    Fale em Português do Brasil.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
      },
    });

    return response.text.trim() || "VAI TRABALHAR, ANDRÉ!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "André, pare de olhar para mim e termine essas tarefas!";
  }
};

export const getTaskInsight = async (task: Task): Promise<string> => {
  // Fix: changed task.category to task.categoryId
  const prompt = `Dê uma dica rápida ou curiosidade sobre esta tarefa: "${task.text}" da categoria "${task.categoryId}". Seja breve.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.7 }
    });
    return response.text.trim();
  } catch {
    return "Foco no objetivo!";
  }
};