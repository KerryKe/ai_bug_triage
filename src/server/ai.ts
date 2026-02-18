import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json", // return only .json file
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        severity: { 
            type: SchemaType.STRING, 
            enum: ["S0", "S1", "S2", "S3"],
            description: "S0 is critical, S3 is minor"
        },
        area: { 
            type: SchemaType.STRING, 
            enum: ["frontend", "backend", "infra", "data"] 
        },
        similar_keywords: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
        }
      },
      required: ["severity", "area", "similar_keywords"],
    },
  },
});

export async function triageBug(title: string, description: string) {
  const prompt = 
  `
    Hey, please analyze this bug report and categorize it.
    
    Title: ${title}
    Description: ${description}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return JSON.parse(response.text());
  } 

  // default if AI fails
  catch (error) {
    console.error("AI Triage Failed:", error);
    return {
      severity: "S3",
      area: "backend",
      similar_keywords: []
    };
  }
}