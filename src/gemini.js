import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini with API Key from Environment Variables
// Make sure to add VITE_GEMINI_API_KEY to your .env file or Netlify Environment Variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Fallback warning if key is missing
if (!API_KEY) {
  console.error("Missing VITE_GEMINI_API_KEY. AI features will not work.");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Helper to safely parse JSON from AI response
const parseAIResponse = (text) => {
  try {
    // Strip markdown code blocks if present
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    return null;
  }
};

/**
 * Analyzes session history to generate deep insights and predictions.
 */
export const fetchGeminiInsights = async (history, userProgress, currentSettings) => {
  if (!history || history.length < 3) return null;

  const prompt = `
    Analyze this productivity data and provide JSON output.
    
    User Stats: Level ${userProgress.level}, XP ${userProgress.xp}, Streak ${userProgress.streakCount}.
    Recent Sessions (Last 10): ${JSON.stringify(history.slice(0, 10).map(s => ({
      mode: s.mode,
      duration: Math.round(s.durationSec/60),
      score: s.productivityScore,
      hour: new Date(s.startTime).getHours(),
      day: new Date(s.startTime).getDay()
    })))}
    Current Settings: Focus ${currentSettings.focusMinutes}min.

    Return valid JSON with this structure:
    {
      "insights": ["string (insight 1)", "string (insight 2)", "string (insight 3)"],
      "prediction": {
        "score": number (0-100 success probability),
        "confidence": number (0-100),
        "factors": ["string (factor 1)", "string (factor 2)"]
      },
      "optimizationSuggestion": "string (brief suggestion)"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseAIResponse(response.text());
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return null;
  }
};

/**
 * Generates smart recommendations based on user context.
 */
export const fetchGeminiRecommendations = async (context) => {
  const prompt = `
    Act as an elite productivity coach. Based on this context, suggest 3 specific actions.
    
    Context:
    - Time: ${context.hour}:00
    - Day: ${context.dayOfWeek} (0=Sun, 6=Sat)
    - Energy: ${context.energy || 'Unknown'}
    - Mood: ${context.mood || 'Unknown'}
    - Recent Performance: ${context.completionRate * 100}% success rate
    - Active Tasks: ${context.taskCount}

    Return valid JSON:
    [
      {
        "title": "string",
        "description": "string",
        "priority": "high" | "medium" | "low",
        "icon": "string (emoji)",
        "type": "timing" | "wellness" | "productivity"
      }
    ]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseAIResponse(response.text()) || [];
  } catch (error) {
    console.error("Gemini Recommendation Error:", error);
    return [];
  }
};

/**
 * Analyzes a task to determine priority and suggest improvements.
 */
export const analyzeTaskPriority = async (taskText, existingTasks) => {
  const prompt = `
    Analyze this new task: "${taskText}".
    Existing tasks: ${JSON.stringify(existingTasks.map(t => t.text))}.
    
    Return valid JSON:
    {
      "priority": "high" | "medium" | "low",
      "isUrgent": boolean,
      "refinedText": "string (make it more actionable)",
      "aiReasoning": "string (short reason why)"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseAIResponse(response.text());
  } catch (error) {
    console.error("Gemini Task Analysis Error:", error);
    return null;
  }
};