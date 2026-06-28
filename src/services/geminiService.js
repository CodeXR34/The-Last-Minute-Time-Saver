import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API using the Vite environment variable
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn("VITE_GEMINI_API_KEY is not defined in the environment.");
}



export const generateSubtasks = async (taskData) => {
  if (!genAI) {
    throw new Error("Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
  }

  const schema = {
    type: "object",
    properties: {
      subtasks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" }
          },
          required: ["title"]
        }
      }
    },
    required: ["subtasks"]
  };

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  const prompt = `You are an AI assistant helping a user break down a high-complexity task into manageable steps.
Task Title: ${taskData.title}
Task Description: ${taskData.description || "No description provided."}

Return a JSON object with a 'subtasks' array containing 3 to 5 logical subtasks.
Each subtask should just have a 'title' string (short, actionable step).`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text).subtasks;
  } catch (error) {
    console.error("Gemini Subtask Generation failed:", error);
    throw error;
  }
};
