const API_KEY = "AIzaSyDjVSYhIN-v-4YRBurQ4KAAbRafCVs9AQM";

const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
  API_KEY;

async function sendToGemini(text, prompt) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt + "\n\n" + text,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || response.statusText || "Unknown API Error";
      return { success: false, error: errorMessage };
    }

    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textResult) {
      return { success: true, data: textResult };
    }
    return { success: false, error: "No content generated" };
  } catch (error) {
    console.error("Gemini API error:", error);
    return { success: false, error: error.message };
  }
}
