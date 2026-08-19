export interface NutritionTargetResult {
  bmi: number;
  bmiCategory: string;
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  waterTargetMl: number;
  stepGoal: number;
  sleepGoalHours: number;
  explanation: {
    bmrFormula: string;
    activityMultiplier: number;
    goalAdjustment: string;
    macroDistribution: string;
    healthDisclaimer: string;
  };
}

export function calculateFitnessTargets(params: {
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  weight: number; // kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';
  fitnessGoal: 'lose_fat' | 'gain_muscle' | 'maintain_weight' | 'improve_fitness' | 'improve_endurance' | 'build_strength';
}): NutritionTargetResult {
  const { age, gender, height, weight, activityLevel, fitnessGoal } = params;

  // 1. BMI Calculation
  const heightM = height / 100;
  const bmiRaw = weight / (heightM * heightM);
  const bmi = Math.round(bmiRaw * 10) / 10;

  let bmiCategory = 'Normal weight';
  if (bmi < 18.5) bmiCategory = 'Underweight';
  else if (bmi >= 18.5 && bmi < 24.9) bmiCategory = 'Normal weight';
  else if (bmi >= 25 && bmi < 29.9) bmiCategory = 'Overweight';
  else bmiCategory = 'Obese';

  // 2. BMR calculation (Mifflin-St Jeor)
  let bmrBase = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'male') {
    bmrBase += 5;
  } else if (gender === 'female') {
    bmrBase -= 161;
  } else {
    bmrBase -= 78;
  }
  const bmr = Math.round(bmrBase);

  // 3. Activity Multiplier
  let activityMultiplier = 1.2;
  switch (activityLevel) {
    case 'sedentary':
      activityMultiplier = 1.2;
      break;
    case 'light':
      activityMultiplier = 1.375;
      break;
    case 'moderate':
      activityMultiplier = 1.55;
      break;
    case 'very_active':
      activityMultiplier = 1.725;
      break;
    case 'extra_active':
      activityMultiplier = 1.9;
      break;
    default:
      activityMultiplier = 1.375;
  }

  const tdee = Math.round(bmr * activityMultiplier);

  // 4. Goal Adjustment
  let calorieTarget = tdee;
  let goalAdjustmentText = 'Maintenance calorie level';

  switch (fitnessGoal) {
    case 'lose_fat':
      calorieTarget = Math.max(1200, tdee - 500);
      goalAdjustmentText = 'Moderate caloric deficit (-500 kcal/day for sustainable fat loss)';
      break;
    case 'gain_muscle':
      calorieTarget = tdee + 350;
      goalAdjustmentText = 'Caloric surplus (+350 kcal/day for lean muscle synthesis)';
      break;
    case 'build_strength':
      calorieTarget = tdee + 250;
      goalAdjustmentText = 'Controlled surplus (+250 kcal/day to support high-intensity lifting)';
      break;
    case 'improve_endurance':
      calorieTarget = tdee + 100;
      goalAdjustmentText = 'Glycogen replenishment focus (slight boost +100 kcal)';
      break;
    case 'improve_fitness':
    case 'maintain_weight':
    default:
      calorieTarget = tdee;
      goalAdjustmentText = 'Energy balance maintenance target';
  }

  // 5. Macro Target Calculations
  // Protein: g per kg bodyweight based on goal
  let proteinPerKg = 1.8;
  if (fitnessGoal === 'gain_muscle' || fitnessGoal === 'build_strength') {
    proteinPerKg = 2.0;
  } else if (fitnessGoal === 'lose_fat') {
    proteinPerKg = 2.0; // preserve lean mass in deficit
  } else if (fitnessGoal === 'improve_endurance') {
    proteinPerKg = 1.6;
  } else {
    proteinPerKg = 1.6;
  }

  const proteinGrams = Math.round(weight * proteinPerKg);
  const proteinCalories = proteinGrams * 4;

  // Fat: 25% - 28% of total daily calories (9 kcal/g)
  const fatCalories = Math.round(calorieTarget * 0.25);
  const fatGrams = Math.round(fatCalories / 9);

  // Carbohydrates: Remainder of daily calories (4 kcal/g)
  const carbCalories = Math.max(0, calorieTarget - (proteinCalories + fatCalories));
  const carbGrams = Math.round(carbCalories / 4);

  // 6. Hydration target: 35-40ml / kg bodyweight
  const waterTargetMl = Math.min(4500, Math.max(2200, Math.round((weight * 38) / 100) * 100));

  // 7. Step Goal
  let stepGoal = 8000;
  if (activityLevel === 'sedentary') stepGoal = 7000;
  else if (activityLevel === 'light') stepGoal = 8500;
  else if (activityLevel === 'moderate') stepGoal = 10000;
  else if (activityLevel === 'very_active' || activityLevel === 'extra_active') stepGoal = 12000;

  return {
    bmi,
    bmiCategory,
    bmr,
    tdee,
    dailyCalorieTarget: calorieTarget,
    proteinTarget: proteinGrams,
    carbsTarget: carbGrams,
    fatTarget: fatGrams,
    waterTargetMl,
    stepGoal,
    sleepGoalHours: 8,
    explanation: {
      bmrFormula: 'Mifflin-St Jeor Equation based on age, gender, height, and body mass',
      activityMultiplier,
      goalAdjustment: goalAdjustmentText,
      macroDistribution: `Protein: ${proteinGrams}g (${Math.round((proteinCalories/calorieTarget)*100)}%), Carbs: ${carbGrams}g (${Math.round((carbCalories/calorieTarget)*100)}%), Fat: ${fatGrams}g (${Math.round((fatCalories/calorieTarget)*100)}%)`,
      healthDisclaimer: 'Calculated nutritional targets are evidence-based estimates. Adjust according to personal comfort and consult a healthcare professional for clinical guidance.'
    }
  };
}
