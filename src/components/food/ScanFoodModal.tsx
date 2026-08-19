import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Camera, Upload, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Flame } from 'lucide-react';

interface ScanFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogged?: () => void;
}

export const ScanFoodModal: React.FC<ScanFoodModalProps> = ({ isOpen, onClose, onLogged }) => {
  const { sendLocalNotification } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'morning_snack' | 'evening_snack'>('lunch');
  const [isLogging, setIsLogging] = useState(false);

  const resetScanner = () => {
    setImagePreview(null);
    setImageBase64(null);
    setResult(null);
    setError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);
    setMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      const base64Data = dataUrl.split(',')[1];
      setImageBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imageBase64) return;
    setAnalyzing(true);
    setError(null);

    try {
      const data = await api.scanFood(imageBase64, mimeType);
      setResult(data);
    } catch (err: any) {
      console.error('Scan food error:', err);
      setError(err.message || 'Could not analyze food image. Please try a clearer picture.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmLog = async () => {
    if (!result) return;
    setIsLogging(true);
    try {
      await api.addFoodLog({
        mealType,
        foodName: result.foodName,
        servingSize: result.portionSize || '1 plate',
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        fiber: result.fiber || 0,
      });

      sendLocalNotification(
        'Meal Logged via AI Vision! 📸',
        `Added "${result.foodName}" (${result.calories} kcal, ${result.protein}g protein) to your ${mealType}.`,
        'meal'
      );

      if (onLogged) onLogged();
      onClose();
      resetScanner();
    } catch (err: any) {
      console.error('Log scanned food error:', err);
      setError('Failed to save to diary');
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        resetScanner();
      }}
      title="FitAI Vision • Food Scanner"
      subtitle="Powered by Gemini 2.5 Flash Vision for Indian & Global dishes"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          id="camera-file-input"
        />

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 rounded-xl text-red-700 dark:text-red-300 text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {!imagePreview ? (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 rounded-3xl bg-neutral-50/50 dark:bg-neutral-800/30 text-center transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Camera className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Take or Upload Food Photo</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mt-1 mb-4">
              Snap a picture of your plate (e.g. Idli Sambar, Paneer Roti, Grilled Chicken) for automated macro detection.
            </p>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors shadow-xs"
              >
                <Camera className="w-4 h-4" />
                <span>Snap Camera / Browse</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image Preview Container */}
            <div className="relative rounded-2xl overflow-hidden max-h-56 bg-neutral-900 flex items-center justify-center">
              <img src={imagePreview} alt="Food capture" className="w-full h-full object-cover max-h-56" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute top-2 right-2 py-1 px-2.5 bg-black/60 hover:bg-black/80 text-white rounded-lg text-[11px] font-semibold backdrop-blur-xs flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retake</span>
              </button>
            </div>

            {!result && (
              <button
                type="button"
                disabled={analyzing}
                onClick={handleAnalyze}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-colors shadow-xs"
              >
                {analyzing ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Gemini AI Analyzing Ingredients & Macros...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Analyze Food with FitAI Vision</span>
                  </>
                )}
              </button>
            )}

            {/* Analysis Result Card */}
            {result && (
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      Identified Food • {result.confidence}% Confidence
                    </span>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                      {result.foodName}
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">Portion: {result.portionSize}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-200/60 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                      Score: {result.healthScore}/10
                    </span>
                  </div>
                </div>

                {/* Macro Badges */}
                <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                  <div className="p-2 bg-white dark:bg-neutral-800/80 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                    <Flame className="w-3.5 h-3.5 mx-auto text-amber-500 mb-0.5" />
                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{result.calories}</div>
                    <div className="text-[10px] text-neutral-500">kcal</div>
                  </div>
                  <div className="p-2 bg-white dark:bg-neutral-800/80 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{result.protein}g</div>
                    <div className="text-[10px] text-neutral-500">Protein</div>
                  </div>
                  <div className="p-2 bg-white dark:bg-neutral-800/80 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                    <div className="text-xs font-bold text-sky-600 dark:text-sky-400">{result.carbs}g</div>
                    <div className="text-[10px] text-neutral-500">Carbs</div>
                  </div>
                  <div className="p-2 bg-white dark:bg-neutral-800/80 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400">{result.fat}g</div>
                    <div className="text-[10px] text-neutral-500">Fat</div>
                  </div>
                </div>

                {/* AI Advice */}
                {result.advice && (
                  <p className="text-xs text-emerald-900 dark:text-emerald-200 bg-emerald-100/50 dark:bg-emerald-950/50 p-2.5 rounded-xl">
                    💡 <strong>Coach Note:</strong> {result.advice}
                  </p>
                )}

                {/* Log Meal Selector & Action */}
                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Meal:</label>
                    <select
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value as any)}
                      className="px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-semibold text-neutral-800 dark:text-neutral-200 outline-none"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="morning_snack">Morning Snack</option>
                      <option value="lunch">Lunch</option>
                      <option value="evening_snack">Evening Snack</option>
                      <option value="dinner">Dinner</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={isLogging}
                    onClick={handleConfirmLog}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Log to Diary</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
