import { GoogleGenAI, Type } from "@google/genai";
import { Task } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getNaggingMessage = async (pendingTasks: Task[]): Promise<string> => {
  if (pendingTasks.length === 0) return "Parabéns, André. Por enquanto você está limpo. Não se acostume.";

  const taskList = pendingTasks.map(t => `- [${t.categoryId}] ${t.text}`).join('\n');
  
  const prompt = `
    Você é o Coach de Produtividade Agressivo do André. 
    Ele tem as seguintes tarefas pendentes:
    ${taskList}

    Sua missão: Escrever UMA frase curta (máximo 15 palavras) que seja irritante, direta e motivadora para o André parar de procrastinar. 
    Seja agressivo, use letras maiúsculas para dar ênfase em algumas palavras.
    Fale em Português do Brasil.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.9,
      },
    });

    return response.text?.trim() || "VAI TRABALHAR AGORA, ANDRÉ!";
  } catch (error) {
    console.error("AI Service Error:", error);
    return "ANDRÉ, PARE DE OLHAR PARA MIM E TERMINE ESSAS TAREFAS!";
  }
};

export const getAutoCategory = async (taskText: string): Promise<string> => {
  const prompt = `
    Dada a tarefa: "${taskText}"
    Escolha a categoria mais adequada entre estas opções (responda APENAS o ID da categoria):
    - health, travel, car, personal, study, projects, general
    
    Responda apenas o ID em letras minúsculas.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.1 }
    });
    const categoryId = response.text?.trim().toLowerCase();
    const validIds = ['health', 'travel', 'car', 'personal', 'study', 'projects', 'general'];
    return validIds.find(id => categoryId?.includes(id)) || 'general';
  } catch {
    return 'general';
  }
};

export const getTaskInsight = async (task: Task): Promise<string> => {
  const prompt = `Dê uma dica ultra rápida (max 10 palavras) para: "${task.text}".`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.7 }
    });
    return response.text?.trim() || "Foco no objetivo!";
  } catch {
    return "Foco no objetivo!";
  }
};