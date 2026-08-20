import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

// Centralized model configuration with automatic fallback support for 503/429 spikes
export const PRIMARY_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.7-flash';
export const FALLBACK_MODELS = ['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'];

let aiClient: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute a Gemini generateContent request with multi-model fallback and progressive backoff
 */
async function callGeminiWithFallback(params: {
  contents: any;
  config?: any;
}) {
  const ai = getAiClient();
  if (!ai) {
    throw new Error('AI service is temporarily unavailable (GEMINI_API_KEY not configured).');
  }

  const modelQueue = Array.from(new Set([PRIMARY_GEMINI_MODEL, ...FALLBACK_MODELS]));
  let lastErr: any = null;

  for (let i = 0; i < modelQueue.length; i++) {
    const model = modelQueue[i];
    // Up to 2 attempts per model with short delay
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) {
          await wait(500 * attempt);
        }
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastErr = err;
        const isTemporary =
          err?.status === 'UNAVAILABLE' ||
          err?.code === 503 ||
          err?.code === 429 ||
          err?.code === 404 ||
          err?.message?.includes('503') ||
          err?.message?.includes('high demand') ||
          err?.message?.includes('temporarily') ||
          err?.message?.includes('RESOURCE_EXHAUSTED') ||
          err?.message?.includes('NOT_FOUND') ||
          err?.message?.includes('overloaded');

        if (!isTemporary) {
          throw err;
        }

        if (attempt === 0) {
          // Quick retry before hopping models
          await wait(600);
          continue;
        }
      }
    }

    if (i < modelQueue.length - 1) {
      console.warn(`[FitAI Gemini API] Model ${model} is experiencing high demand. Seamlessly transitioning to fallback model: ${modelQueue[i + 1]}`);
      await wait(400);
    }
  }

  throw lastErr || new Error('AI service is currently experiencing high demand. Please retry in a few moments.');
}

export interface FoodVisionDetectionResult {
  foodName: string;
  foodItems?: string[];
  portionEstimate: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  confidenceScore: number;
  disclaimer: string;
}

/**
 * AI Food Image Analysis using Gemini Vision
 * Real AI extraction with model fallback
 */
export async function detectFoodFromImage(base64Image: string, mimeType: string = 'image/jpeg'): Promise<FoodVisionDetectionResult> {
  const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

  try {
    const response = await callGeminiWithFallback({
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || 'image/jpeg',
            },
          },
          {
            text: `You are an expert clinical dietitian and food recognition AI. Analyze this food image.
Identify all visible food items/dishes, estimate the serving size, and calculate realistic macronutrient values (calories, protein in grams, carbohydrates in grams, fat in grams, fiber in grams).

Return strictly valid JSON matching this exact schema:
{
  "foodName": "Primary name of dish or combined meal",
  "foodItems": ["Item 1", "Item 2", "Item 3"],
  "portionEstimate": "e.g., 2 medium Rotis with 1 bowl Dal (approx. 250g)",
  "calories": 380,
  "protein": 18,
  "carbs": 48,
  "fat": 11,
  "fiber": 6,
  "confidenceScore": 0.92,
  "disclaimer": "Nutrition values from images are estimates and may vary depending on ingredients, cooking method, oil, and portion size."
}`
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);

    if (!parsed.foodName || typeof parsed.calories !== 'number') {
      throw new Error('Could not reliably identify food in image.');
    }

    return {
      foodName: String(parsed.foodName),
      foodItems: Array.isArray(parsed.foodItems) ? parsed.foodItems : [parsed.foodName],
      portionEstimate: parsed.portionEstimate || '1 standard serving',
      calories: Math.max(0, Math.round(Number(parsed.calories) || 0)),
      protein: Math.max(0, Math.round((Number(parsed.protein) || 0) * 10) / 10),
      carbs: Math.max(0, Math.round((Number(parsed.carbs) || 0) * 10) / 10),
      fat: Math.max(0, Math.round((Number(parsed.fat) || 0) * 10) / 10),
      fiber: Math.max(0, Math.round((Number(parsed.fiber) || 0) * 10) / 10),
      confidenceScore: Math.min(1, Math.max(0.1, Number(parsed.confidenceScore) || 0.85)),
      disclaimer: parsed.disclaimer || 'Nutrition values from images are estimates and may vary depending on ingredients, cooking method, oil, and portion size.'
    };
  } catch (error: any) {
    console.error('Gemini vision detection error:', error);
    throw new Error(error.message || 'AI food vision analysis failed. Please provide a clearer image or enter details manually.');
  }
}

/**
 * Daily tailored insight and motivation
 */
export async function generateDailyInsight(userContext: {
  name: string;
  goal: string;
  calorieTarget: number;
  caloriesConsumed: number;
  proteinTarget: number;
  proteinConsumed: number;
  waterTarget: number;
  waterConsumed: number;
  workoutDone: boolean;
  stepsDone: number;
  stepGoal: number;
}): Promise<string> {
  const calRemaining = userContext.calorieTarget - userContext.caloriesConsumed;
  const proteinRemaining = userContext.proteinTarget - userContext.proteinConsumed;
  const waterRemaining = Math.max(0, userContext.waterTarget - userContext.waterConsumed);

  const defaultInsight = () => {
    if (proteinRemaining > 25) {
      return `Great momentum, ${userContext.name}! You are ${proteinRemaining}g short of your protein target today—consider a protein-rich snack like boiled eggs, paneer, or Greek yogurt.`;
    }
    if (waterRemaining > 1000) {
      return `Solid progress today! Make sure to hydrate—you still have ${(waterRemaining / 1000).toFixed(1)}L of water to hit your daily hydration goal.`;
    }
    if (!userContext.workoutDone) {
      return `On track with nutrition, ${userContext.name}! A 20-minute movement or workout session today will keep you progressing toward your ${userContext.goal.replace(/_/g, ' ')} target.`;
    }
    return `Keep up the consistency today, ${userContext.name}! You are well aligned with your daily ${userContext.goal.replace(/_/g, ' ')} targets.`;
  };

  try {
    const prompt = `You are FitAI Coach, a supportive, evidence-based fitness & nutrition assistant.
Provide a concise, motivating 2-sentence daily insight for ${userContext.name} based on today's logged data:
- Goal: ${userContext.goal.replace(/_/g, ' ')}
- Calorie Target: ${userContext.calorieTarget} kcal | Consumed: ${userContext.caloriesConsumed} kcal (Remaining: ${calRemaining} kcal)
- Protein Target: ${userContext.proteinTarget}g | Consumed: ${userContext.proteinConsumed}g (Remaining: ${proteinRemaining}g)
- Water: ${userContext.waterConsumed}ml / ${userContext.waterTarget}ml
- Workout completed today: ${userContext.workoutDone ? 'Yes' : 'Not yet'}
- Steps: ${userContext.stepsDone} / ${userContext.stepGoal}

Rules:
1. Keep it strictly under 35 words.
2. Give one specific, actionable recommendation.
3. Do not make medical claims.`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text?.trim() || defaultInsight();
  } catch (err) {
    console.warn('Gemini daily insight using dynamic calculated fallback:', err);
    return defaultInsight();
  }
}

/**
 * "What Should I Eat?" AI recommendation engine
 */
export async function generateWhatShouldIEat(userContext: {
  goal: string;
  diet: string;
  foodPreferences: string[];
  allergies: string[];
  dislikedFoods: string[];
  remainingCalories: number;
  remainingProtein: number;
  dailyBudget: number;
  timeOfDay: string;
  recentFoods?: string[];
}): Promise<Array<{
  name: string;
  ingredients: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTimeMinutes: number;
  estimatedCost: number;
  reason: string;
  recipeInstructions: string[];
}>> {
  const prompt = `You are FitAI Nutrition Engine. Recommend exactly 3 distinct, healthy, practical meal options for the current time of day (${userContext.timeOfDay}).
User Profile & Constraints:
- Fitness Goal: ${userContext.goal.replace(/_/g, ' ')}
- Dietary Type: ${userContext.diet}
- Cuisine & Regional Preferences: ${userContext.foodPreferences.join(', ') || 'Indian / International'}
- STRICT ALLERGIES (CRITICAL: NEVER INCLUDE ANY OF THESE INGREDIENTS OR DERIVATIVES): ${userContext.allergies.join(', ') || 'None'}
- DISLIKED FOODS (DO NOT INCLUDE): ${userContext.dislikedFoods.join(', ') || 'None'}
- Remaining Calories Window: ~${Math.max(150, userContext.remainingCalories)} kcal
- Remaining Protein Target: ~${Math.max(10, userContext.remainingProtein)}g
- Estimated Budget Target: Approx ₹${userContext.dailyBudget || 200}/day

Safety & Authenticity Rules:
1. Verify strictly that NO allergenic foods are included.
2. Provide authentic ingredients with realistic portion sizes.
3. Return strictly a JSON array of exactly 3 objects.

JSON schema:
[
  {
    "name": "Dish Name",
    "ingredients": ["150g Item with quantity", "1 tsp Spice/Oil"],
    "calories": 350,
    "protein": 22,
    "carbs": 38,
    "fat": 10,
    "prepTimeMinutes": 15,
    "estimatedCost": 60,
    "reason": "Why this fits current remaining macros, time of day, and dietary preferences",
    "recipeInstructions": ["Step 1", "Step 2", "Step 3"]
  }
]`;

  try {
    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item) => ({
        name: String(item.name || 'Nutritious Meal'),
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
        calories: Math.max(0, Math.round(Number(item.calories) || 0)),
        protein: Math.max(0, Math.round(Number(item.protein) || 0)),
        carbs: Math.max(0, Math.round(Number(item.carbs) || 0)),
        fat: Math.max(0, Math.round(Number(item.fat) || 0)),
        prepTimeMinutes: Math.max(5, Number(item.prepTimeMinutes) || 15),
        estimatedCost: Math.max(10, Number(item.estimatedCost) || 50),
        reason: String(item.reason || 'Optimized for your macro target.'),
        recipeInstructions: Array.isArray(item.recipeInstructions) ? item.recipeInstructions : ['Prepare fresh ingredients and cook thoroughly.']
      }));
    }
    throw new Error('Invalid AI response structure');
  } catch (err: any) {
    console.error('Gemini WhatShouldIEat error:', err);
    throw new Error(err.message || 'Failed to generate meal suggestions with AI');
  }
}

/**
 * AI Recipe Generator from Pantry Ingredients
 */
export async function generateCustomRecipe(
  ingredients: string[],
  filter: string,
  diet: string,
  allergies: string[]
): Promise<any> {
  const prompt = `You are a culinary dietitian. Create a healthy, delicious recipe using the following available ingredients: ${ingredients.join(', ')}.
User Preferences:
- Diet: ${diet}
- Recipe Focus / Goal: ${filter || 'High Protein & Balanced'}
- STRICT ALLERGIES TO EXCLUDE: ${allergies.join(', ') || 'None'}

Return strictly valid JSON matching this schema:
{
  "title": "Creative Appetizing Recipe Name",
  "description": "Short description of taste and nutritional benefits",
  "ingredients": ["100g Ingredient with exact quantity", "1 tbsp Olive oil / Ghee"],
  "instructions": ["Step 1", "Step 2", "Step 3", "Step 4"],
  "calories": 380,
  "protein": 26,
  "carbs": 42,
  "fat": 10,
  "prepTimeMinutes": 15,
  "costEstimate": 50,
  "tags": ["High Protein", "Quick Prep", "${diet}"]
}`;

  try {
    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.title) {
      throw new Error('AI could not generate a recipe from given ingredients.');
    }
    return {
      title: parsed.title,
      description: parsed.description || '',
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : ingredients,
      instructions: Array.isArray(parsed.instructions) ? parsed.instructions : ['Cook ingredients together.'],
      calories: Number(parsed.calories) || 350,
      protein: Number(parsed.protein) || 20,
      carbs: Number(parsed.carbs) || 40,
      fat: Number(parsed.fat) || 10,
      prepTimeMinutes: Number(parsed.prepTimeMinutes) || 15,
      costEstimate: Number(parsed.costEstimate) || 50,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [filter, diet]
    };
  } catch (err: any) {
    console.error('Gemini recipe generation error:', err);
    throw new Error(err.message || 'Failed to generate custom recipe');
  }
}

/**
 * AI Personalized Meal Plan Generation
 */
export async function generateAiMealPlan(params: {
  goal: string;
  diet: string;
  foodPreferences: string[];
  allergies: string[];
  dislikedFoods: string[];
  dailyCalorieTarget: number;
  proteinTarget: number;
  dailyBudget: number;
  daysCount?: number;
}): Promise<any[]> {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].slice(0, params.daysCount || 7);

  const prompt = `You are a certified sports nutritionist. Generate a personalized ${days.length}-day meal plan.
User Profile:
- Goal: ${params.goal.replace(/_/g, ' ')}
- Diet Type: ${params.diet}
- Cuisine & Food Preferences: ${params.foodPreferences.join(', ') || 'Indian / Global'}
- STRICT ALLERGIES (NEVER INCLUDE ANY OF THESE): ${params.allergies.join(', ') || 'None'}
- DISLIKED FOODS: ${params.dislikedFoods.join(', ') || 'None'}
- Daily Calorie Target: ~${params.dailyCalorieTarget} kcal
- Daily Protein Target: ~${params.proteinTarget}g
- Target Budget: ~₹${params.dailyBudget || 250}/day

Return strictly a JSON array of days matching this schema:
[
  {
    "day": "Monday",
    "breakfast": { "name": "Dish Name", "calories": 300, "protein": 15, "carbs": 40, "fat": 8, "costEstimate": 35, "recipe": "Quick preparation instructions" },
    "morningSnack": { "name": "Snack Name", "calories": 140, "protein": 10, "carbs": 18, "fat": 3, "costEstimate": 20, "recipe": "Quick prep" },
    "lunch": { "name": "Lunch Main", "calories": 550, "protein": 35, "carbs": 60, "fat": 15, "costEstimate": 75, "recipe": "Preparation steps" },
    "eveningSnack": { "name": "Evening Snack", "calories": 160, "protein": 8, "carbs": 12, "fat": 9, "costEstimate": 25, "recipe": "Preparation steps" },
    "dinner": { "name": "Dinner Main", "calories": 480, "protein": 32, "carbs": 50, "fat": 12, "costEstimate": 60, "recipe": "Preparation steps" },
    "dailyBudgetEstimate": 215
  }
]`;

  try {
    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    throw new Error('Invalid meal plan format from AI');
  } catch (err: any) {
    console.error('Gemini meal plan generator error:', err);
    throw new Error(err.message || 'Failed to generate personalized meal plan');
  }
}

/**
 * AI Workout Generator
 */
export async function generateAiWorkout(params: {
  goal: string;
  fitnessLevel: string;
  equipment: string[];
  durationMinutes: number;
  location: string;
  notes?: string;
}): Promise<any> {
  const prompt = `Generate a customized, safe, structured workout routine.
Parameters:
- Goal: ${params.goal.replace(/_/g, ' ')}
- Experience Level: ${params.fitnessLevel}
- Available Equipment: ${params.equipment.join(', ') || 'Bodyweight only'}
- Available Time: Exactly ${params.durationMinutes} minutes
- Location: ${params.location}
${params.notes ? `- User notes: ${params.notes}` : ''}

Safety Rule: Include a clear safety guidance disclaimer and form cues.

Return strictly JSON matching this structure:
{
  "title": "Creative Workout Title",
  "category": "${params.location || 'home'}",
  "fitnessLevel": "${params.fitnessLevel || 'beginner'}",
  "goal": "${params.goal}",
  "durationMinutes": ${params.durationMinutes},
  "caloriesBurnedEstimate": 220,
  "equipment": ["Dumbbells"],
  "safetyGuidance": "Maintain neutral spine. Stop if sharp joint discomfort occurs.",
  "exercises": [
    {
      "name": "Exercise Name",
      "sets": 3,
      "reps": 12,
      "durationSec": 0,
      "restSec": 45,
      "equipment": "Dumbbells",
      "instructions": "Clear form cues",
      "muscleGroup": "Primary Muscle Group",
      "caloriesBurnedEstimate": 40
    }
  ]
}`;

  try {
    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.title || !Array.isArray(parsed.exercises)) {
      throw new Error('Invalid workout format returned from AI');
    }
    return parsed;
  } catch (err: any) {
    console.error('Gemini workout generator error:', err);
    throw new Error(err.message || 'Failed to generate workout with AI');
  }
}

/**
 * AI Progress Analysis
 */
export async function generateProgressAnalysis(stats: {
  userName: string;
  goal: string;
  startWeight?: number;
  currentWeight: number;
  targetWeight: number;
  weightTrend: Array<{ date: string; weight: number }>;
  avgCalories: number;
  calorieTarget: number;
  avgProtein: number;
  proteinTarget: number;
  workoutsCompleted: number;
  avgWaterMl: number;
  waterTarget: number;
  avgSleepHours: number;
}): Promise<{
  summary: string;
  consistencyScore: number;
  nutritionAdherence: string;
  workoutAnalysis: string;
  hydrationAndSleep: string;
  actionSteps: string[];
  disclaimer: string;
}> {
  const prompt = `Analyze this user fitness & nutrition progress dataset:
- User: ${stats.userName}
- Fitness Goal: ${stats.goal.replace(/_/g, ' ')}
- Current Weight: ${stats.currentWeight}kg | Target Weight: ${stats.targetWeight}kg
- Weight Data Points: ${JSON.stringify(stats.weightTrend.slice(-10))}
- Nutrition: Avg Calories ${stats.avgCalories} kcal (Target: ${stats.calorieTarget}), Avg Protein ${stats.avgProtein}g (Target: ${stats.proteinTarget}g)
- Workouts Completed: ${stats.workoutsCompleted}
- Water Intake: Avg ${stats.avgWaterMl}ml (Target: ${stats.waterTarget}ml)
- Sleep: Avg ${stats.avgSleepHours} hours

Provide an honest, analytical, encouraging breakdown.
Return strictly valid JSON:
{
  "summary": "2-3 sentence overarching summary of trajectory and positive habits",
  "consistencyScore": 85,
  "nutritionAdherence": "Detailed observations on calories, protein, and dietary discipline",
  "workoutAnalysis": "Observations on training frequency, volume, and recovery",
  "hydrationAndSleep": "Review of hydration and sleep adequacy",
  "actionSteps": ["Specific actionable step 1", "Actionable step 2", "Actionable step 3"],
  "disclaimer": "Disclaimer: This progress analysis provides general lifestyle guidance based on your logged metrics and is not a medical evaluation. Consult a qualified healthcare specialist for clinical advice."
}`;

  try {
    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.summary) {
      throw new Error('Invalid progress analysis format');
    }
    return {
      summary: parsed.summary,
      consistencyScore: Math.min(100, Math.max(0, Number(parsed.consistencyScore) || 80)),
      nutritionAdherence: parsed.nutritionAdherence || 'Consistent nutrition tracking.',
      workoutAnalysis: parsed.workoutAnalysis || 'Good workout regularity.',
      hydrationAndSleep: parsed.hydrationAndSleep || 'Adequate hydration and rest.',
      actionSteps: Array.isArray(parsed.actionSteps) ? parsed.actionSteps : ['Keep logging daily.'],
      disclaimer: parsed.disclaimer || 'Disclaimer: General fitness tracking, not medical diagnosis.'
    };
  } catch (err: any) {
    console.error('Gemini progress analysis error:', err);
    throw new Error(err.message || 'Failed to generate progress analysis with AI');
  }
}

/**
 * AI Coach Interactive Chat
 */
export async function chatWithAiCoach(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  userProfile: any,
  todayStats: any,
  recentLogs?: any
): Promise<string> {
  const systemPrompt = `You are FitAI Coach, a supportive, evidence-based personal fitness, nutrition, and wellness coach.
You have real-time access to the user's active profile and today's tracked metrics:
User Profile:
- Name: ${userProfile?.name || 'Athlete'}
- Age: ${userProfile?.age || 26} | Gender: ${userProfile?.gender || 'not specified'}
- Height: ${userProfile?.height || 175}cm | Current Weight: ${userProfile?.weight || 72}kg (Target: ${userProfile?.targetWeight || 68}kg)
- Fitness Goal: ${userProfile?.fitnessGoal?.replace(/_/g, ' ') || 'lose fat'}
- Dietary Preference: ${userProfile?.diet || 'vegetarian'}
- Allergies (CRITICAL: NEVER RECOMMEND): ${userProfile?.allergies?.join(', ') || 'None'}
- Disliked Foods: ${userProfile?.dislikedFoods?.join(', ') || 'None'}
- Calorie Target: ${userProfile?.dailyCalorieTarget || 2000} kcal
- Protein Target: ${userProfile?.proteinTarget || 120}g

Today's Logged Metrics:
- Calories Consumed: ${todayStats?.caloriesConsumed || 0} / ${userProfile?.dailyCalorieTarget || 2000} kcal
- Protein Consumed: ${todayStats?.proteinConsumed || 0} / ${userProfile?.proteinTarget || 120}g
- Water Consumed: ${todayStats?.waterConsumed || 0} / ${userProfile?.waterTargetMl || 3000} ml
- Workout Done Today: ${todayStats?.workoutDone ? 'Yes' : 'Not yet'}
- Steps Today: ${todayStats?.steps || 0} / ${userProfile?.stepGoal || 8000}

Communication Guidelines:
1. Always give realistic, motivating, practical advice.
2. Directly reference their current numbers when relevant.
3. Strictly respect all allergies and dietary preferences.
4. Format responses cleanly with bold highlights and bullet points for readability.
5. Include friendly encouragement and never offer dangerous or unverified medical diagnoses.`;

  const conversationHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'FitAI Coach'}: ${m.content}`).join('\n\n');

  try {
    const response = await callGeminiWithFallback({
      contents: `${systemPrompt}\n\nConversation History:\n${conversationHistory}\n\nFitAI Coach:`,
      config: {
        temperature: 0.6,
      }
    });

    return response.text?.trim() || 'I am right here with you! How can I assist with your fitness or meals today?';
  } catch (err: any) {
    console.warn('Gemini chat temporary spike fallback:', err.message);
    const lastUserMsg = messages[messages.length - 1]?.content.toLowerCase() || '';
    if (lastUserMsg.includes('eat') || lastUserMsg.includes('food') || lastUserMsg.includes('diet') || lastUserMsg.includes('hungry')) {
      return `Based on your ${userProfile?.diet || 'healthy'} diet and ${userProfile?.fitnessGoal?.replace(/_/g, ' ') || 'fitness'} goal, aim for balanced meals with ~${Math.round((userProfile?.proteinTarget || 120) / 3)}g protein per meal (like lentils, tofu, paneer, eggs, or Greek yogurt) and stay mindful of your daily ${userProfile?.dailyCalorieTarget || 2000} kcal target.`;
    }
    if (lastUserMsg.includes('workout') || lastUserMsg.includes('exercise') || lastUserMsg.includes('training')) {
      return `For your ${userProfile?.fitnessGoal?.replace(/_/g, ' ') || 'training'} goal, keep workouts focused: dynamic warm-up (3 mins), 3-4 compound movements with good form, and 2 minutes of stretching. Consistency beats intensity every time!`;
    }
    return `I am keeping track of your ${userProfile?.fitnessGoal?.replace(/_/g, ' ') || 'fitness'} progress! You currently have ${todayStats?.proteinConsumed || 0}g protein and ${todayStats?.waterConsumed || 0}ml water logged today. Let me know what specific workout, meal, or recovery question you have!`;
  }
}
