import { GoogleGenAI, Type } from "@google/genai";
import { StudentProfile, RoadmapItem, RiskCategory, ResourceItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AcademicPlan {
  roadmap: RoadmapItem[];
  resources: ResourceItem[];
}

export async function generateAcademicPlan(
  profile: StudentProfile,
  cat: RiskCategory,
  riskScore: number,
  mlInsights: string
): Promise<AcademicPlan> {
  const prompt = `
    Generate a highly personalized academic success plan for a student:
    - Stream: ${profile.stream} (${profile.substream})
    - Current Semester: ${profile.sem}
    - CGPA: ${profile.prevCgpa}
    - Attendance: ${profile.attend}%
    - Assignments: ${profile.assign}%
    - Backlogs: ${profile.backlogs}
    - Study Hours: ${profile.study} hrs/day
    - Sleep: ${profile.sleep} hrs/day
    - Screen Time: ${profile.screen} hrs/day
    - Stress Level: ${profile.stress || 5}/10
    
    ML Classification: ${cat.toUpperCase()} (Risk Score: ${riskScore}/100)
    ML Insights: ${mlInsights}

    Task 1: Generate a Roadmap (5-6 items, Week-by-week)
    Task 2: Generate 4-6 Personalized Resources (Courses, Books, Tools) specifically for their stream/substream and academic needs.

    Return the plan as a single JSON object with 'roadmap' and 'resources' keys.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            roadmap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  week: { type: Type.STRING },
                  color: { type: Type.STRING },
                  title: { type: Type.STRING },
                  desc: { type: Type.STRING },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["week", "color", "title", "desc", "tags"],
              },
            },
            resources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING },
                  type: { 
                    type: Type.STRING,
                    enum: ['course', 'book', 'tool', 'video', 'article']
                  },
                  desc: { type: Type.STRING },
                },
                required: ["title", "url", "type", "desc"],
              },
            },
          },
          required: ["roadmap", "resources"],
        },
      },
    });

    const plan = JSON.parse(response.text || "{}");
    return {
      roadmap: plan.roadmap || [],
      resources: plan.resources || [],
    };
  } catch (error) {
    console.error("Error generating academic plan:", error);
    return { roadmap: [], resources: [] };
  }
}
