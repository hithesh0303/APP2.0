import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { ChefHat, Sparkles, Plus, Trash2, CheckCircle2, Flame, Clock } from 'lucide-react';

interface CreateRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeSaved?: () => void;
}

export const CreateRecipeModal: React.FC<CreateRecipeModalProps> = ({ isOpen, onClose, onRecipeSaved }) => {
  const { sendLocalNotification } = useNotifications();

  const [ingredients, setIngredients] = useState<string[]>(['Paneer / Tofu', 'Spinach', 'Tomatoes', 'Oats']);
  const [newIngredient, setNewIngredient] = useState('');
  const [filter, setFilter] = useState('High Protein');

  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const addIngredient = () => {
    if (!newIngredient.trim()) return;
    setIngredients(prev => [...prev, newIngredient.trim()]);
    setNewIngredient('');
  };

  const removeIngredient = (idx: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  const handleGenerate = async () => {
    if (ingredients.length === 0) return;
    setLoading(true);
    try {
      const res = await api.createRecipe(ingredients, filter);
      setRecipe(res);
    } catch (err) {
      console.error('Recipe generate error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToCatalog = async () => {
    if (!recipe) return;
    setIsSaving(true);
    try {
      await api.saveRecipe({
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        prepTimeMinutes: recipe.prepTimeMinutes || 20,
        costEstimate: recipe.costEstimate || 50,
        tags: [filter, 'AI Generated'],
      });

      sendLocalNotification('Recipe Saved! 📖', `Added "${recipe.title}" to your recipes cookbook.`, 'meal');
      if (onRecipeSaved) onRecipeSaved();
      onClose();
    } catch (err) {
      console.error('Save recipe error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pantry Chef • AI Recipe Maker"
      subtitle="Tell FitAI what you have in your fridge; it creates a balanced macro-aligned meal"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Ingredient Chips */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
            Available Pantry / Fridge Items
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {ingredients.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center space-x-1 py-1 px-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs font-medium"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  className="hover:text-red-500 ml-1"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
              placeholder="e.g. Eggs, Chickpeas, Greek yogurt"
              className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 outline-none"
            />
            <button
              type="button"
              onClick={addIngredient}
              className="px-3 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-semibold"
            >
              Add Item
            </button>
          </div>
        </div>

        {/* Recipe Goal Filter */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
            Recipe Objective
          </label>
          <div className="grid grid-cols-4 gap-2">
            {['High Protein', 'Under 400 kcal', 'Under 15 Mins', 'Budget Friendly'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`py-1.5 px-2 text-center rounded-xl text-xs font-semibold border transition-all ${
                  filter === f
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          disabled={loading || ingredients.length === 0}
          onClick={handleGenerate}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
        >
          {loading ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Crafting Custom Recipe with Gemini...</span>
            </>
          ) : (
            <>
              <ChefHat className="w-4 h-4" />
              <span>Create AI Recipe</span>
            </>
          )}
        </button>

        {/* Result Recipe */}
        {recipe && (
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-2xl space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">{recipe.title}</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{recipe.description}</p>
              </div>
              <div className="flex items-center space-x-1 text-xs text-neutral-500 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>{recipe.prepTimeMinutes || 20}m</span>
              </div>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{recipe.calories}</div>
                <div className="text-[10px] text-neutral-500">kcal</div>
              </div>
              <div className="p-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{recipe.protein}g</div>
                <div className="text-[10px] text-neutral-500">Protein</div>
              </div>
              <div className="p-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="text-xs font-bold text-sky-600 dark:text-sky-400">{recipe.carbs}g</div>
                <div className="text-[10px] text-neutral-500">Carbs</div>
              </div>
              <div className="p-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400">{recipe.fat}g</div>
                <div className="text-[10px] text-neutral-500">Fat</div>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-1.5">Step-by-Step Method</h4>
              <ol className="list-decimal list-inside text-xs text-neutral-700 dark:text-neutral-300 space-y-1">
                {recipe.instructions?.map((inst: string, i: number) => (
                  <li key={i}>{inst}</li>
                ))}
              </ol>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveToCatalog}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save to My Cookbook</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
