import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Sparkles, Utensils, Flame, Plus, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';

interface WhatToEatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMealAdded?: () => void;
}

export const WhatToEatModal: React.FC<WhatToEatModalProps> = ({ isOpen, onClose, onMealAdded }) => {
  const { sendLocalNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await api.whatShouldIEat();
      setData(res);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecommendations();
    }
  }, [isOpen]);

  const handleQuickAdd = async (sug: any, index: number) => {
    setAddingIndex(index);
    try {
      await api.addFoodLog({
        mealType: (data?.timeOfDay?.replace(' ', '_') as any) || 'lunch',
        foodName: sug.mealName,
        servingSize: sug.portion || '1 serving',
        calories: sug.calories,
        protein: sug.protein,
        carbs: sug.carbs,
        fat: sug.fat,
        fiber: 4,
      });

      sendLocalNotification(
        'Meal Added from AI Recommendation! 🍽️',
        `Logged "${sug.mealName}" (${sug.calories} kcal, ${sug.protein}g protein) for ${data?.timeOfDay || 'meal'}.`,
        'meal'
      );

      if (onMealAdded) onMealAdded();
      onClose();
    } catch (err) {
      console.error('Add meal error:', err);
    } finally {
      setAddingIndex(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="What Should I Eat Now? 🥗"
      subtitle="Context-aware meal suggestions based on your remaining daily calories & protein"
      maxWidth="xl"
    >
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Sparkles className="w-8 h-8 mx-auto text-emerald-500 animate-spin" />
            <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
              FitAI is analyzing your dietary preferences, budget & remaining macro targets...
            </p>
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* Header info bar */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                  Target Timing: {data.timeOfDay?.toUpperCase()}
                </span>
                <div className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                  Remaining today: <strong>{data.remainingCalories} kcal</strong> • <strong>{data.remainingProtein}g protein</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={fetchRecommendations}
                className="py-1 px-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Suggestions list */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {data.suggestions?.map((sug: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-2xl flex flex-col justify-between hover:border-emerald-400 transition-all shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                        Option {idx + 1}
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-500">
                        {sug.prepTimeMins || 15} mins • ₹{sug.costEstimate || 40}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                      {sug.mealName}
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                      {sug.reason || sug.recipe}
                    </p>

                    <div className="grid grid-cols-3 gap-1.5 py-1.5 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl text-center">
                      <div>
                        <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{sug.calories}</div>
                        <div className="text-[9px] text-neutral-500">kcal</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{sug.protein}g</div>
                        <div className="text-[9px] text-neutral-500">Protein</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-sky-600 dark:text-sky-400">{sug.carbs}g</div>
                        <div className="text-[9px] text-neutral-500">Carbs</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 dark:border-neutral-700/60 flex items-center space-x-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setSelectedRecipe(sug)}
                      className="py-1.5 px-2 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg flex items-center space-x-1"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Recipe</span>
                    </button>
                    <button
                      type="button"
                      disabled={addingIndex === idx}
                      onClick={() => handleQuickAdd(sug, idx)}
                      className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1 transition-colors shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Eat This</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Recipe Sub-card modal preview */}
            {selectedRecipe && (
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center space-x-1.5">
                    <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                    <span>How to prepare: {selectedRecipe.mealName}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSelectedRecipe(null)}
                    className="text-xs text-neutral-400 hover:text-neutral-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed bg-white dark:bg-neutral-800/80 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900">
                  {selectedRecipe.recipe || 'Mix fresh wholesome ingredients, season with mild spices and cook on medium flame for 10-12 minutes until aromatic and fully done.'}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </Modal>
  );
};
