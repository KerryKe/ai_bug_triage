export async function triageBug(title: string, description: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("AI Error: GEMINI_API_KEY is missing");
    return { severity: "S3", area: "backend", similar_keywords: [], reply: "API Key missing." };
  }

  // model: gemini-3-flash-preview
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

  try {
    const isCustomPrompt = title === "Agent Chat" || title === "Similarity Check";  // two functions: chat or calculate cimilarity
    

    const promptText = isCustomPrompt 
      ? description 
      : `Analyze this bug report and return ONLY a JSON object.
         Format: {"severity": "S0"|"S1"|"S2"|"S3", "area": "frontend"|"backend"|"infra"|"data", "similar_keywords": []}
         
         Title: ${title}
         Description: ${description}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }],
        generationConfig: {
          temperature: 0.2,  // to avoid "creative" response
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("GEMINI API ERROR:", data.error.message);
      throw new Error(data.error.message);
    }

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("No response content from AI");
    }

    const rawText = data.candidates[0].content.parts[0].text;
    
    // check json 
    const jsonMatch = rawText.match(/{[\s\S]*}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return parsed;
      } catch (e) {
      }
    }

    // return plain text if no json
    return { 
      reply: rawText, 
      severity: "S2", 
      area: "backend", 
      similar_keywords: [] 
    };

  } catch (error) {
    console.error("AI Operation Failed:", error);
    return { 
      reply: "I'm having trouble analyzing that right now.",
      severity: "S2", 
      area: "backend", 
      similar_keywords: ["error"] 
    };
  }
}