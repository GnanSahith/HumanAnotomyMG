import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI("AQ.Ab8RN6Ifu5PE1MgfCThQBL9jWZs5nQiSsYNijy0ZtT2lMBj8BQ");

async function check() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("hello");
    console.log("Success with gemini-2.5-flash:", result.response.text());
  } catch (error) {
    console.error("Error with gemini-2.5-flash:", error.message);
  }
}

check();
