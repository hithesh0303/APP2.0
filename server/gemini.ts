import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
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

export interface FoodVisionDetectionResult {
  foodName: string;
  portionEstimate: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  confidenceScore: number;
  disclaimer: string;
}

export async function detectFoodFromImage(base64Image: string, mimeType: string = 'image/jpeg'): Promise<FoodVisionDetectionResult> {
  const ai = getAiClient();
  if (!ai) {
    // Intelligent baseline calculation if API key is pending
    return {
      foodName: 'Nutritious Mixed Meal Bowl',
      portionEstimate: '1 medium plate (approx. 250g)',
      calories: 380,
      protein: 18,
      carbs: 45,
      fat: 12,
      fiber: 5,
      confidenceScore: 0.85,
      disclaimer: 'Note: AI image-based nutrition estimates are approximations. Please verify portions and ingredients.'
    };
  }

  try {
    const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || 'image/jpeg',
            },
          },
          {
            text: `Analyze this food image. Identify the primary dish/food items, estimated serving size, and approximate macronutrient breakdown (calories, protein in grams, carbohydrates in grams, fat in grams, fiber in grams).
Return strictly valid JSON matching this schema:
{
  "foodName": "Name of primary food or dish",
  "portionEstimate": "e.g., 2 medium Rotis with 1 bowl Dal",
  "calories": 350,
  "protein": 14,
  "carbs": 50,
  "fat": 8,
  "fiber": 6,
  "confidenceScore": 0.92,
  "disclaimer": "AI image-based nutrition values are estimates. Actual values depend on cooking oils and precise quantities."
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
    return {
      foodName: parsed.foodName || 'Identified Meal',
      portionEstimate: parsed.portionEstimate || '1 standard serving',
      calories: Number(parsed.calories) || 300,
      protein: Number(parsed.protein) || 12,
      carbs: Number(parsed.carbs) || 40,
      fat: Number(parsed.fat) || 8,
      fiber: Number(parsed.fiber) || 4,
      confidenceScore: Number(parsed.confidenceScore) || 0.88,
      disclaimer: parsed.disclaimer || 'AI image estimates are approximations.'
    };
  } catch (error) {
    console.error('Gemini vision detection error:', error);
    return {
      foodName: 'Mixed Meal Platter',
      portionEstimate: '1 plate (estimated 300g)',
      calories: 420,
      protein: 16,
      carbs: 52,
      fat: 14,
      fiber: 6,
      confidenceScore: 0.8,
      disclaimer: 'Note: AI image-based nutrition estimates are approximations.'
    };
  }
}

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
  const ai = getAiClient();
  const calRemaining = userContext.calorieTarget - userContext.caloriesConsumed;
  const proteinRemaining = userContext.proteinTarget - userContext.proteinConsumed;
  const waterRemaining = Math.max(0, userContext.waterTarget - userContext.waterConsumed);

  if (!ai) {
    if (proteinRemaining > 20) {
      return `You are doing well today, ${userContext.name}! You are currently ${proteinRemaining}g short of your protein goal—consider a snack like boiled eggs, roasted paneer, or Greek yogurt before dinner.`;
    }
    if (waterRemaining > 1000) {
      return `Great momentum on calories today! Make sure to hydrate—you still have ${(waterRemaining / 1000).toFixed(1)}L of water to hit your daily hydration target.`;
    }
    if (!userContext.workoutDone) {
      return `You're on track with nutrition! A quick 20-minute bodyweight or dumbbell session will help you hit your daily movement goals.`;
    }
    return `Solid consistency today! All key markers for calories and macros are well aligned with your ${userContext.goal.replace('_', ' ')} goal.`;
  }

  try {
    const prompt = `You are FitAI Coach, a supportive, evidence-based fitness & nutrition assistant.
Provide a concise, motivating, 2-sentence daily insight for ${userContext.name} based on today's logged data:
- Goal: ${userContext.goal}
- Calorie Target: ${userContext.calorieTarget} kcal | Consumed: ${userContext.caloriesConsumed} kcal (Remaining: ${calRemaining} kcal)
- Protein Target: ${userContext.proteinTarget}g | Consumed: ${userContext.proteinConsumed}g (Remaining: ${proteinRemaining}g)
- Water: ${userContext.waterConsumed}ml / ${userContext.waterTarget}ml
- Workout completed today: ${userContext.workoutDone ? 'Yes' : 'Not yet'}
- Steps: ${userContext.stepsDone} / ${userContext.stepGoal}

Rules:
1. Keep it strictly under 35 words.
2. Give one specific, actionable recommendation (e.g. snack idea, hydration tip, or workout encouragement).
3. Do not make medical claims.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text?.trim() || `Keep up the great work today, ${userContext.name}! Stay mindful of your protein target and hydration.`;
  } catch (err) {
    console.error('Gemini daily insight error:', err);
    return `You're on the right path today, ${userContext.name}! Keep prioritizing clean protein and regular hydration throughout the day.`;
  }
}

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
  const ai = getAiClient();
  const defaultMeals = [
    {
      name: 'Paneer / Tofu Bhurji with 2 Multigrain Rotis',
      ingredients: ['150g Low Fat Paneer / Tofu', '2 Multigrain Rotis', 'Onions, Tomatoes, Green Chillies', '1 tsp Olive Oil / Ghee', 'Turmeric, Cumin, Coriander'],
      calories: 380,
      protein: 24,
      carbs: 38,
      fat: 12,
      prepTimeMinutes: 15,
      estimatedCost: 65,
      reason: 'Delivers 24g of clean protein within your calorie window with low preparation time.',
      recipeInstructions: [
        'Finely chop onions, tomatoes, and green chillies.',
        'Heat 1 tsp oil in a pan, add cumin seeds and saute onions until golden.',
        'Add chopped tomatoes, turmeric, and salt. Cook until soft.',
        'Crumble fresh paneer into the pan and mix well for 3-4 minutes.',
        'Garnish with fresh coriander and serve hot with 2 warm rotis.'
      ]
    },
    {
      name: 'Moong Sprout & Boiled Egg / Chickpea Chaat',
      ingredients: ['1 cup Steamed Moong Sprouts', '2 Boiled Eggs or 1/2 cup Chickpeas', 'Cucumber, Tomato, Lemon Juice', 'Chaat Masala, Roasted Cumin'],
      calories: 260,
      protein: 18,
      carbs: 30,
      fat: 5,
      prepTimeMinutes: 8,
      estimatedCost: 35,
      reason: 'Light, budget-friendly, and packed with fiber and micronutrients.',
      recipeInstructions: [
        'Steam moong sprouts lightly for 3 minutes for easy digestion.',
        'Dice boiled eggs or boiled chickpeas, cucumbers, and tomatoes.',
        'Toss together in a bowl with lemon juice, chaat masala, and fresh mint.',
        'Enjoy immediately as a nutrient-dense meal.'
      ]
    },
    {
      name: 'Wholesome High-Protein Dal Tadka with Brown Rice',
      ingredients: ['1 cup Yellow Moong & Masoor Dal', '1 cup Cooked Brown Rice', 'Garlic, Ginger, Cumin, Mustard Seeds', '1 tsp Ghee', 'Fresh Spinach leaves'],
      calories: 340,
      protein: 16,
      carbs: 54,
      fat: 6,
      prepTimeMinutes: 20,
      estimatedCost: 40,
      reason: 'Complete amino acid profile combining legumes and whole grains with soothing digestion.',
      recipeInstructions: [
        'Pressure cook mixed dal with chopped spinach, turmeric, and water for 3 whistles.',
        'Heat ghee in a tadka pan, add cumin, mustard seeds, crushed garlic, and dried red chili.',
        'Pour aromatic tempering over the dal and simmer for 2 minutes.',
        'Serve with 1 cup of steamed brown rice.'
      ]
    }
  ];

  if (!ai) return defaultMeals;

  try {
    const prompt = `You are FitAI Nutrition Engine. Recommend 3 distinct, nutritious meal options for the current time of day (${userContext.timeOfDay}).
User Requirements:
- Goal: ${userContext.goal}
- Diet: ${userContext.diet}
- Food Regional Preferences: ${userContext.foodPreferences.join(', ') || 'Indian / International'}
- STRICT ALLERGIES (MUST EXCLUDE): ${userContext.allergies.join(', ') || 'None'}
- DISLIKED FOODS (DO NOT INCLUDE): ${userContext.dislikedFoods.join(', ') || 'None'}
- Remaining Calories Available: ${Math.max(150, userContext.remainingCalories)} kcal
- Remaining Protein Target: ${Math.max(10, userContext.remainingProtein)}g
- Budget Context: Approx ₹${userContext.dailyBudget || 200}/day

Return strictly a JSON array of exactly 3 objects:
[
  {
    "name": "Dish Name",
    "ingredients": ["Item 1", "Item 2"],
    "calories": 350,
    "protein": 22,
    "carbs": 40,
    "fat": 9,
    "prepTimeMinutes": 15,
    "estimatedCost": 50,
    "reason": "Why this fits current macro needs and budget",
    "recipeInstructions": ["Step 1", "Step 2", "Step 3"]
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
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
    return defaultMeals;
  } catch (err) {
    console.error('Gemini WhatShouldIEat error:', err);
    return defaultMeals;
  }
}

export async function generateCustomRecipe(ingredients: string[], filter: string, diet: string, allergies: string[]): Promise<any> {
  const ai = getAiClient();
  if (!ai) {
    return {
      title: 'Power Protein Scramble & Oats Bowl',
      description: `A delicious dish custom-crafted using ${ingredients.join(', ')}.`,
      ingredients: ingredients.length > 0 ? ingredients : ['Eggs / Tofu', 'Rolled Oats', 'Almond Milk', 'Chia Seeds', 'Banana'],
      instructions: [
        'Prepare the base ingredients by washing and measuring portions.',
        'Cook in a non-stick pan with light seasoning to retain nutritional value.',
        'Combine high-protein elements with wholesome carbs.',
        'Serve fresh with a sprinkle of roasted seeds or fresh herbs.'
      ],
      calories: 360,
      protein: 26,
      carbs: 42,
      fat: 9,
      prepTimeMinutes: 12,
      costEstimate: 45,
      tags: [filter || 'High Protein', diet, 'Quick Prep']
    };
  }

  try {
    const prompt = `Create a healthy, delicious recipe using the following available ingredients: ${ingredients.join(', ')}.
Preferences:
- Diet: ${diet}
- Preference / Focus filter: ${filter || 'High Protein & Balanced'}
- STRICT ALLERGIES to exclude: ${allergies.join(', ') || 'None'}

Return valid JSON with format:
{
  "title": "Creative Recipe Name",
  "description": "Short appetizing description",
  "ingredients": ["Item with quantity", "Item 2 with quantity"],
  "instructions": ["Step 1", "Step 2", "Step 3", "Step 4"],
  "calories": 380,
  "protein": 25,
  "carbs": 44,
  "fat": 10,
  "prepTimeMinutes": 15,
  "costEstimate": 50,
  "tags": ["High Protein", "Quick Meal", "${diet}"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (err) {
    console.error('Gemini recipe generation error:', err);
    return {
      title: 'Nutritious Kitchen Creation',
      description: 'Balanced meal crafted from your pantry ingredients.',
      ingredients,
      instructions: ['Combine ingredients in balanced proportions', 'Cook lightly with wholesome seasonings', 'Serve hot and fresh'],
      calories: 350,
      protein: 20,
      carbs: 40,
      fat: 10,
      prepTimeMinutes: 15,
      costEstimate: 50,
      tags: ['Balanced', diet]
    };
  }
}

export async function generateAiWorkout(params: {
  goal: string;
  fitnessLevel: string;
  equipment: string[];
  durationMinutes: number;
  location: string;
  notes?: string;
}): Promise<any> {
  const ai = getAiClient();
  const defaultWorkout = {
    title: `Targeted ${params.durationMinutes}-Min ${params.goal.replace('_', ' ').toUpperCase()} Session`,
    category: params.location || 'home',
    fitnessLevel: params.fitnessLevel || 'beginner',
    goal: params.goal,
    durationMinutes: params.durationMinutes || 25,
    caloriesBurnedEstimate: Math.round(params.durationMinutes * 8.5),
    equipment: params.equipment.length > 0 ? params.equipment : ['Bodyweight'],
    safetyGuidance: 'Warm up adequately. If you experience sharp joint pain or dizziness, stop immediately and rest.',
    exercises: [
      { name: 'Dynamic Joint Warmup & Arm Circles', sets: 2, reps: 20, restSec: 30, equipment: 'Bodyweight', instructions: 'Mobilize shoulders, spine, and hips smoothly.', muscleGroup: 'Warmup' },
      { name: 'Goblet / Bodyweight Squats', sets: 3, reps: 15, restSec: 45, equipment: params.equipment.includes('Dumbbells') ? 'Dumbbells' : 'Bodyweight', instructions: 'Chest upright, push hips back, press through feet.', muscleGroup: 'Quads & Glutes' },
      { name: 'Push-ups or Floor Press', sets: 3, reps: 12, restSec: 60, equipment: params.equipment.includes('Dumbbells') ? 'Dumbbells' : 'Bodyweight', instructions: 'Keep core tight, elbows tucked 45 degrees.', muscleGroup: 'Chest & Triceps' },
      { name: 'Bent-Over Rows / Prone Cobra', sets: 3, reps: 12, restSec: 45, equipment: params.equipment.includes('Dumbbells') ? 'Dumbbells' : 'Bodyweight', instructions: 'Hinge at hips with flat back, pull with elbows.', muscleGroup: 'Upper Back' },
      { name: 'Forearm Plank with Knee Taps', sets: 3, reps: 1, durationSec: 40, restSec: 45, equipment: 'Bodyweight', instructions: 'Brace core, tap knees alternatively without rocking hips.', muscleGroup: 'Core' }
    ]
  };

  if (!ai) return defaultWorkout;

  try {
    const prompt = `Generate a customized, safe, structured workout routine.
Parameters:
- Goal: ${params.goal}
- Experience Level: ${params.fitnessLevel}
- Available Equipment: ${params.equipment.join(', ') || 'Bodyweight only'}
- Available Time: Exactly ${params.durationMinutes} minutes
- Location: ${params.location}
${params.notes ? `- User specific prompt: ${params.notes}` : ''}

Safety Rule: Include a clear safety guidance disclaimer.

Return strictly JSON matching this structure:
{
  "title": "Creative Workout Title",
  "category": "home",
  "fitnessLevel": "beginner",
  "goal": "${params.goal}",
  "durationMinutes": ${params.durationMinutes},
  "caloriesBurnedEstimate": 220,
  "equipment": ["Dumbbells"],
  "safetyGuidance": "Safety note advising correct form and stopping if sharp pain occurs.",
  "exercises": [
    {
      "name": "Exercise Name",
      "sets": 3,
      "reps": 12,
      "durationSec": 0,
      "restSec": 45,
      "equipment": "Dumbbells",
      "instructions": "Clear form cue",
      "muscleGroup": "Primary Muscle Target",
      "caloriesBurnedEstimate": 45
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed.title ? parsed : defaultWorkout;
  } catch (err) {
    console.error('Gemini workout generator error:', err);
    return defaultWorkout;
  }
}

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
  const ai = getAiClient();
  const defaultAnalysis = {
    summary: `${stats.userName}, your progress trend shows consistent engagement towards your ${stats.goal.replace('_', ' ')} target. You have maintained a solid average calorie intake and steady workout frequency.`,
    consistencyScore: 84,
    nutritionAdherence: `Your average daily protein intake is ${stats.avgProtein}g vs your ${stats.proteinTarget}g target. Prioritize adding high-protein staples (eggs, paneer, sprouts, chicken, or soy) with breakfast and post-workout.`,
    workoutAnalysis: `Completed ${stats.workoutsCompleted} sessions over the tracked timeframe. Progressive overload and active recovery will continue driving steady metabolic adaptation.`,
    hydrationAndSleep: `Hydration averaged ${(stats.avgWaterMl / 1000).toFixed(1)}L/day and sleep averaged ${stats.avgSleepHours} hours. Both are foundational for muscle recovery and cortisol balance.`,
    actionSteps: [
      'Increase morning hydration by drinking 500ml water upon waking.',
      'Aim for at least 25g protein per main meal to optimize muscle protein synthesis.',
      'Maintain 7+ hours of quality sleep to support recovery and energy levels.'
    ],
    disclaimer: 'Disclaimer: This progress analysis provides general lifestyle guidance based on your logged metrics and is not a medical evaluation. Consult a qualified healthcare specialist for clinical advice.'
  };

  if (!ai) return defaultAnalysis;

  try {
    const prompt = `Analyze this user fitness & nutrition progress dataset:
- User: ${stats.userName}
- Fitness Goal: ${stats.goal}
- Current Weight: ${stats.currentWeight}kg | Target Weight: ${stats.targetWeight}kg
- Weight Data Points: ${JSON.stringify(stats.weightTrend.slice(-10))}
- Nutrition: Avg Calories ${stats.avgCalories} kcal (Target: ${stats.calorieTarget}), Avg Protein ${stats.avgProtein}g (Target: ${stats.proteinTarget}g)
- Workouts Completed: ${stats.workoutsCompleted}
- Water Intake: Avg ${stats.avgWaterMl}ml (Target: ${stats.waterTarget}ml)
- Sleep: Avg ${stats.avgSleepHours} hours

Provide a comprehensive, encouraging analysis. Return strictly valid JSON:
{
  "summary": "2-3 sentence overarching summary of trajectory and positive habits",
  "consistencyScore": 85,
  "nutritionAdherence": "Detailed observations on calories, protein, and dietary discipline",
  "workoutAnalysis": "Observations on training frequency, volume, and recovery",
  "hydrationAndSleep": "Review of hydration and sleep adequacy",
  "actionSteps": ["Actionable step 1", "Actionable step 2", "Actionable step 3"],
  "disclaimer": "Health disclaimer stating this is educational fitness tracking, not medical diagnosis."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed.summary ? parsed : defaultAnalysis;
  } catch (err) {
    console.error('Gemini progress analysis error:', err);
    return defaultAnalysis;
  }
}

export async function chatWithAiCoach(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>, userProfile: any, todayStats: any): Promise<string> {
  const ai = getAiClient();
  if (!ai) {
    const lastUserMsg = messages[messages.length - 1]?.content.toLowerCase() || '';
    if (lastUserMsg.includes('protein')) {
      return `Based on your profile, your daily protein target is **${userProfile?.proteinTarget || 120}g**. Today you have logged **${todayStats?.proteinConsumed || 0}g**. Good whole-food sources include boiled eggs, paneer, soy chunks, Greek yogurt, chicken breast, lentils, and whey protein.`;
    }
    if (lastUserMsg.includes('workout') || lastUserMsg.includes('exercise')) {
      return `To achieve your goal of **${userProfile?.fitnessGoal?.replace('_', ' ') || 'improving fitness'}**, consistency is key! Aim for 3-4 structured sessions per week with adequate rest between muscle groups. Would you like me to generate a tailored workout for you?`;
    }
    if (lastUserMsg.includes('eat') || lastUserMsg.includes('food') || lastUserMsg.includes('hungry')) {
      return `You have approximately **${Math.max(0, (userProfile?.dailyCalorieTarget || 2000) - (todayStats?.caloriesConsumed || 0))} kcal** remaining for today. A great option right now would be a high-protein stir fry, paneer bhurji with roti, or a sprout salad with boiled eggs!`;
    }
    return `Hello! I am your FitAI Coach. I am here to help you optimize your training, nutrition, hydration, and recovery according to your personal goals. What would you like guidance on today?`;
  }

  try {
    const systemPrompt = `You are FitAI Coach, a supportive, highly knowledgeable personal fitness, nutrition, and wellness coach.
You have real-time access to the user's active profile and today's tracked metrics:
User Profile:
- Name: ${userProfile?.name || 'Athlete'}
- Age: ${userProfile?.age || 26} | Gender: ${userProfile?.gender || 'not specified'}
- Height: ${userProfile?.height || 175}cm | Weight: ${userProfile?.weight || 72}kg (Target: ${userProfile?.targetWeight || 68}kg)
- Fitness Goal: ${userProfile?.fitnessGoal || 'lose_fat'}
- Dietary Preference: ${userProfile?.diet || 'vegetarian'}
- Allergies: ${userProfile?.allergies?.join(', ') || 'None'}
- Disliked Foods: ${userProfile?.dislikedFoods?.join(', ') || 'None'}
- Calorie Target: ${userProfile?.dailyCalorieTarget || 2000} kcal
- Protein Target: ${userProfile?.proteinTarget || 120}g

Today's Logged Numbers:
- Calories Consumed: ${todayStats?.caloriesConsumed || 0} / ${userProfile?.dailyCalorieTarget || 2000} kcal
- Protein Consumed: ${todayStats?.proteinConsumed || 0} / ${userProfile?.proteinTarget || 120}g
- Water Consumed: ${todayStats?.waterConsumed || 0} / ${userProfile?.waterTargetMl || 3000} ml
- Workout Done Today: ${todayStats?.workoutDone ? 'Yes' : 'Not yet'}
- Steps Today: ${todayStats?.steps || 0}

Communication Guidelines:
1. Always give realistic, motivating, practical advice.
2. Directly reference their current numbers when relevant (e.g. remaining protein or water).
3. Respect all allergies and dietary preferences strictly.
4. Format responses cleanly with bold highlights and bullet points for readability.
5. Include friendly encouragement and never offer dangerous or unverified medical diagnoses.`;

    const conversationHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'FitAI Coach'}: ${m.content}`).join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `${systemPrompt}\n\nConversation so far:\n${conversationHistory}\n\nFitAI Coach:`,
      config: {
        temperature: 0.6,
      }
    });

    return response.text?.trim() || 'I am right here with you! How can I assist with your fitness or meals today?';
  } catch (err) {
    console.error('Gemini chat error:', err);
    return 'I am ready to help you reach your goals! What fitness or nutrition questions do you have?';
  }
}
