import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI("AQ.Ab8RN6Ifu5PE1MgfCThQBL9jWZs5nQiSsYNijy0ZtT2lMBj8BQ");

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const result = await model.generateContent("Explain electrons in one sentence");
    console.log(result.response.text());
  } catch (error) {
    console.error(error);
  }
}

test();
