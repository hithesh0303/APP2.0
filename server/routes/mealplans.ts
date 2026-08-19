import { Router } from 'express';
import { db, MealPlanDay, RecipeItem, GroceryItem } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../auth.js';

const router = Router();

const DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function generateStarterMealPlan(goal: string, diet: string, calTarget: number, proteinTarget: number): MealPlanDay[] {
  const isVeg = diet === 'vegetarian' || diet === 'vegan';
  const proteinItem = isVeg ? 'Paneer Bhurji / Tofu' : 'Grilled Chicken / Boiled Eggs';
  const breakfastOption = isVeg ? 'Idli with Sambar & Coconut Chutney' : 'Oats Omelette with Mushrooms';

  return DEFAULT_DAYS.map((day, idx) => {
    return {
      day,
      breakfast: {
        name: idx % 2 === 0 ? breakfastOption : 'High-Protein Oats Porridge with Almonds & Banana',
        calories: Math.round(calTarget * 0.25),
        protein: Math.round(proteinTarget * 0.25),
        carbs: 45,
        fat: 8,
        costEstimate: 35,
        recipe: 'Cook oats in warm milk or plant milk, stir in crushed almonds, chia seeds, and sliced fresh fruit.',
      },
      morningSnack: {
        name: 'Mixed Sprouts Salad with Lemon & Herbs',
        calories: 140,
        protein: 10,
        carbs: 22,
        fat: 2,
        costEstimate: 20,
        recipe: 'Toss steamed moong sprouts with diced cucumbers, fresh coriander, lime juice, and chaat masala.',
      },
      lunch: {
        name: `${proteinItem} with 2 Multigrain Rotis & Moong Dal`,
        calories: Math.round(calTarget * 0.35),
        protein: Math.round(proteinTarget * 0.38),
        carbs: 55,
        fat: 14,
        costEstimate: 70,
        recipe: 'Saute protein with spices; serve alongside warm yellow dal and fiber-rich multigrain rotis.',
      },
      eveningSnack: {
        name: 'Roasted Almonds & Green Tea',
        calories: 160,
        protein: 6,
        carbs: 6,
        fat: 14,
        costEstimate: 25,
        recipe: 'Lightly roasted almonds paired with freshly brewed green tea.',
      },
      dinner: {
        name: 'Wholesome Rajma / Chole Curry with Brown Rice & Fresh Salad',
        calories: Math.round(calTarget * 0.30),
        protein: Math.round(proteinTarget * 0.28),
        carbs: 58,
        fat: 10,
        costEstimate: 50,
        recipe: 'Slow cooked kidney beans or chickpeas in tomato-ginger sauce, served with steamed brown rice.',
      },
      dailyBudgetEstimate: 200,
    };
  });
}

// GET /api/mealplans
router.get('/', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  let plans = db.get().mealPlans[userId];

  if (!plans || plans.length === 0) {
    const profile = db.get().profiles.find(p => p.userId === userId);
    plans = generateStarterMealPlan(
      profile?.fitnessGoal || 'lose_fat',
      profile?.diet || 'vegetarian',
      profile?.dailyCalorieTarget || 2000,
      profile?.proteinTarget || 120
    );
    db.get().mealPlans[userId] = plans;
    db.save();
  }

  return res.json(plans);
});

// POST /api/mealplans/regenerate-day
router.post('/regenerate-day', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { day, mealType } = req.body;

  let plans = db.get().mealPlans[userId];
  if (!plans) {
    plans = generateStarterMealPlan('lose_fat', 'vegetarian', 2000, 120);
    db.get().mealPlans[userId] = plans;
  }

  const targetDay = plans.find(d => d.day.toLowerCase() === String(day).toLowerCase());
  if (targetDay && mealType) {
    if (mealType === 'breakfast') {
      targetDay.breakfast = {
        name: 'Vegetable Poha with Roasted Peanuts & Lemon',
        calories: 320,
        protein: 9,
        carbs: 52,
        fat: 8,
        costEstimate: 25,
        recipe: 'Rinse flattened rice, saute with mustard seeds, curry leaves, onions, green chilies, and crunchy peanuts.',
      };
    } else if (mealType === 'lunch') {
      targetDay.lunch = {
        name: 'Palak Paneer / Tofu with 2 Phulkas & Cucumber Raita',
        calories: 420,
        protein: 22,
        carbs: 45,
        fat: 16,
        costEstimate: 65,
        recipe: 'Blanch spinach into puree, simmer with spiced paneer cubes and serve with soft hot phulkas.',
      };
    } else if (mealType === 'dinner') {
      targetDay.dinner = {
        name: 'High-Protein Soy Chunks Curry with 2 Rotis',
        calories: 380,
        protein: 30,
        carbs: 42,
        fat: 9,
        costEstimate: 40,
        recipe: 'Boil soy chunks, squeeze water, simmer in onion-tomato gravy with turmeric and garam masala.',
      };
    }
  }

  db.save();
  return res.json(plans);
});

// ================= RECIPES =================

// GET /api/mealplans/recipes
router.get('/recipes', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const list = db.get().recipes.filter(r => !r.userId || r.userId === userId);
  return res.json(list);
});

// POST /api/mealplans/recipes
router.post('/recipes', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { title, description, ingredients, instructions, calories, protein, carbs, fat, prepTimeMinutes, costEstimate, tags } = req.body;

  if (!title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Title, ingredients, and instructions are required' });
  }

  const newRecipe: RecipeItem = {
    id: `recipe_${Date.now()}`,
    userId,
    title: title.trim(),
    description: description || 'Delicious customized recipe',
    ingredients: Array.isArray(ingredients) ? ingredients : [ingredients],
    instructions: Array.isArray(instructions) ? instructions : [instructions],
    calories: Number(calories) || 300,
    protein: Number(protein) || 15,
    carbs: Number(carbs) || 35,
    fat: Number(fat) || 8,
    prepTimeMinutes: Number(prepTimeMinutes) || 15,
    costEstimate: Number(costEstimate) || 40,
    tags: Array.isArray(tags) ? tags : ['FitAI Custom'],
  };

  db.get().recipes.push(newRecipe);
  db.save();

  return res.status(201).json(newRecipe);
});

// ================= GROCERY LIST =================

// GET /api/mealplans/grocery
router.get('/grocery', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  let items = db.get().groceryLists.filter(g => g.userId === userId);

  // If empty, generate standard healthy pantry grocery list
  if (items.length === 0) {
    const defaultGroceries: GroceryItem[] = [
      { id: `gro_${Date.now()}_1`, userId, category: 'Protein', name: 'Eggs / Fresh Paneer / Tofu', quantity: '500g / 1 dozen', estimatedCost: 120, purchased: false },
      { id: `gro_${Date.now()}_2`, userId, category: 'Protein', name: 'Yellow Moong & Masoor Dal', quantity: '1 kg', estimatedCost: 140, purchased: false },
      { id: `gro_${Date.now()}_3`, userId, category: 'Grains', name: 'Rolled Oats & Whole Wheat Atta', quantity: '1 kg each', estimatedCost: 110, purchased: false },
      { id: `gro_${Date.now()}_4`, userId, category: 'Vegetables', name: 'Spinach, Tomatoes, Cucumbers, Onions', quantity: 'Assorted (2 kg)', estimatedCost: 90, purchased: false },
      { id: `gro_${Date.now()}_5`, userId, category: 'Fruits', name: 'Bananas & Seasonal Apples', quantity: '1 kg', estimatedCost: 90, purchased: false },
      { id: `gro_${Date.now()}_6`, userId, category: 'Nuts/Seeds', name: 'Raw Almonds & Chia Seeds', quantity: '250g', estimatedCost: 160, purchased: false },
      { id: `gro_${Date.now()}_7`, userId, category: 'Dairy', name: 'Low Fat Fresh Curd / Dahi', quantity: '1 kg', estimatedCost: 75, purchased: false },
    ];
    db.get().groceryLists.push(...defaultGroceries);
    db.save();
    items = defaultGroceries;
  }

  const totalBudget = items.reduce((sum, item) => sum + item.estimatedCost, 0);
  const purchasedBudget = items.filter(i => i.purchased).reduce((sum, item) => sum + item.estimatedCost, 0);

  return res.json({
    items,
    totalBudget,
    purchasedBudget,
    pendingBudget: totalBudget - purchasedBudget,
  });
});

// POST /api/mealplans/grocery (Add grocery item)
router.post('/grocery', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { name, category, quantity, estimatedCost } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Item name is required' });
  }

  const newItem: GroceryItem = {
    id: `gro_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    userId,
    name: name.trim(),
    category: category || 'Other',
    quantity: quantity || '1 unit',
    estimatedCost: Number(estimatedCost) || 30,
    purchased: false,
  };

  db.get().groceryLists.push(newItem);
  db.save();

  return res.status(201).json(newItem);
});

// PUT /api/mealplans/grocery/:id/toggle
router.put('/grocery/:id/toggle', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const itemId = req.params.id;

  const item = db.get().groceryLists.find(g => g.id === itemId && g.userId === userId);
  if (!item) {
    return res.status(404).json({ error: 'Grocery item not found' });
  }

  item.purchased = !item.purchased;
  db.save();

  return res.json(item);
});

// DELETE /api/mealplans/grocery/:id
router.delete('/grocery/:id', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const itemId = req.params.id;

  const index = db.get().groceryLists.findIndex(g => g.id === itemId && g.userId === userId);
  if (index === -1) {
    return res.status(404).json({ error: 'Grocery item not found' });
  }

  db.get().groceryLists.splice(index, 1);
  db.save();

  return res.json({ success: true, message: 'Item deleted' });
});

export default router;
