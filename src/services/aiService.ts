import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { ReflectionData, LessonType, SkillFocus } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateAIFeedback(reflection: ReflectionData) {
  const prompt = `
    You are an expert ELT (English Language Teaching) mentor. 
    Analyze the following trainee teacher's reflection based on Gibbs Reflective Cycle and Bloom's Taxonomy.
    
    Lesson Context:
    - Week: ${reflection.week}
    - Lesson Type: ${reflection.lessonMetadata.type}
    - Skill Focus: ${reflection.lessonMetadata.focus.join(', ')}
    - Title: ${reflection.title}
    
    Reflection Content:
    - Description: ${JSON.stringify(reflection.responses.description)}
    - Feelings: ${JSON.stringify(reflection.responses.feelings)}
    - Evaluation: ${JSON.stringify(reflection.responses.evaluation)}
    - Analysis: ${JSON.stringify(reflection.responses.analysis)}
    - Conclusion: ${JSON.stringify(reflection.responses.conclusion)}
    - Action Plan: ${JSON.stringify(reflection.responses.actionPlan)}

    Provide a deep, critical evaluation of the reflection. Evaluate the teaching choices, the depth of self-awareness, and the pedagogical soundness of the action plan.
    
    Provide detailed feedback in JSON format:
    {
      "summary": "A comprehensive, deep analysis (2-3 paragraphs) evaluating the teaching choices and the depth of reflection. Be critical but constructive.",
      "depthScore": number (0-100, based on Bloom's Taxonomy),
      "evaluationDetails": {
        "strengths": ["detailed strength 1 with pedagogical reasoning", "detailed strength 2"],
        "weaknesses": ["critical area for improvement 1", "critical area for improvement 2"],
        "wordAnalysis": "A short paragraph evaluating the specific language used in the reflection (e.g., is it descriptive, analytical, or critical?)"
      },
      "effectiveness": "Deep analysis of teaching effectiveness",
      "management": "Deep analysis of classroom management",
      "engagement": "Deep analysis of student engagement",
      "instructions": "Deep analysis of instruction clarity",
      "strategies": ["Specific, actionable enhancement strategy 1", "Specific, actionable enhancement strategy 2"],
      "goals": ["SMART goal 1", "SMART goal 2"],
      "furtherEnhancement": "A dedicated section on how to take this specific lesson to the next level (e.g., specific ELT techniques like TTT reduction, CCQ implementation, or scaffolding adjustments)"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Feedback Error:", error);
    return {
      summary: "Great effort on this reflection. You're showing good awareness of your classroom dynamics.",
      depthScore: 70,
      effectiveness: "Your activity choice was appropriate for the level.",
      management: "Consider your positioning during group work.",
      engagement: "Students seemed active during the main task.",
      instructions: "Try to use more ICQs (Instruction Checking Questions).",
      strategies: ["Use the 'Clap once if you can hear me' signal", "Prepare written instructions on slides"],
      goals: ["Reduce TTT (Teacher Talking Time) by 10%", "Implement 3 ICQs per lesson"]
    };
  }
}

export async function getAdaptiveQuestions(lessonType: LessonType, skills: SkillFocus[], week: number) {
  const prompt = `
    Generate 3 scaffolded, ELT-specific reflection questions for a trainee teacher in Week ${week}.
    Lesson Type: ${lessonType}
    Skill Focus: ${skills.join(', ')}
    
    The questions should be clear, beginner-friendly, and progressively deeper.
    Return as a JSON array of strings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [
      "How did the ${lessonType} structure help students achieve the objective?",
      "What specific challenges did students face with ${skills[0]}?",
      "If you taught this again, how would you adjust your instructions?"
    ];
  }
}

export async function getAIInsightForAnalysis(description: string, reaction: string) {
  const prompt = `
    As an ELT mentor, provide a quick insight into why students might have reacted this way.
    Lesson: ${description}
    Student Reaction: ${reaction}
    Keep it under 3 sentences.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt
    });
    return response.text;
  } catch (error) {
    return "Consider if the task complexity matched the students' current proficiency level.";
  }
}
