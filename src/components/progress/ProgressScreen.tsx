import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { WeightTrackerModal } from '../trackers/WeightTrackerModal';
import {
  TrendingUp,
  Scale,
  Sparkles,
  Award,
  Calendar,
  Flame,
  Droplets,
  Activity,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { ProgressBar } from '../common/ProgressBar';

export const ProgressScreen: React.FC = () => {
  const { profile } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // AI Progress Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);

  // Modal
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const data = await api.getProgressOverview();
      setOverview(data);
    } catch (err) {
      console.error('Fetch progress error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleGenerateAiAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await api.analyzeProgress('7days');
      setAiReport(res);
    } catch (err) {
      console.error('AI Progress analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const startWeight = profile?.weight || 70;
  const currentWeight = overview?.currentWeight || startWeight;
  const targetWeight = profile?.targetWeight || 65;
  const totalGoalDelta = Math.abs(startWeight - targetWeight) || 1;
  const achievedDelta = Math.abs(startWeight - currentWeight);
  const percentComplete = Math.min(100, Math.round((achievedDelta / totalGoalDelta) * 100));

  return (
    <div className="space-y-6 pb-20" id="progress-screen">
      {/* Header & Quick Log Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Progress & Health Analytics</h2>
          <p className="text-xs text-neutral-500">Longitudinal bio-metrics, adherence scores, and AI trends</p>
        </div>
        <button
          type="button"
          onClick={() => setIsWeightModalOpen(true)}
          className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Weigh-In</span>
        </button>
      </div>

      {/* Primary Goal Target Card */}
      <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400">Target Goal</span>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 capitalize">
                {profile?.goal?.replace('_', ' ') || 'Weight Management'}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{percentComplete}%</span>
            <div className="text-[10px] text-neutral-400">Goal Progress</div>
          </div>
        </div>

        <ProgressBar value={percentComplete} max={100} colorClass="bg-emerald-500" heightClass="h-2.5" />

        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div className="p-2 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl">
            <span className="text-[10px] text-neutral-500">Starting</span>
            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{startWeight} kg</div>
          </div>
          <div className="p-2 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl">
            <span className="text-[10px] text-neutral-500">Current</span>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{currentWeight} kg</div>
          </div>
          <div className="p-2 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl">
            <span className="text-[10px] text-neutral-500">Target</span>
            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{targetWeight} kg</div>
          </div>
        </div>
      </div>

      {/* AI Comprehensive Progress Audit Report */}
      <div className="p-5 bg-gradient-to-br from-emerald-950 via-neutral-900 to-neutral-950 text-white rounded-3xl shadow-sm border border-emerald-800/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-white">AI Longitudinal Progress Audit</h3>
              <p className="text-[11px] text-emerald-300">Gemini 2.5 Flash Bio-Analytics</p>
            </div>
          </div>
          <button
            type="button"
            disabled={analyzing}
            onClick={handleGenerateAiAnalysis}
            className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
          >
            {analyzing ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Auditing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run AI Audit</span>
              </>
            )}
          </button>
        </div>

        {aiReport ? (
          <div className="space-y-3 pt-2 text-xs leading-relaxed">
            <p className="p-3 bg-neutral-800/70 border border-neutral-700/80 rounded-2xl text-neutral-200">
              {aiReport.analysis}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Key Strengths</span>
                </span>
                <ul className="list-disc list-inside text-neutral-300 space-y-0.5">
                  {aiReport.strengths?.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-amber-950/60 border border-amber-800/60 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Growth Areas</span>
                </span>
                <ul className="list-disc list-inside text-neutral-300 space-y-0.5">
                  {aiReport.areasToImprove?.map((a: string, i: number) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>

            {aiReport.actionPlan && (
              <div className="p-3 bg-neutral-800/80 border border-neutral-700 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-sky-400">Next 7-Day Action Protocol</span>
                <ol className="list-decimal list-inside text-neutral-300 space-y-0.5">
                  {aiReport.actionPlan.map((step: string, i: number) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-neutral-400">
            Click "Run AI Audit" to synthesize your food logs, workout consistency, water intake, and weight delta into an actionable weekly report.
          </p>
        )}
      </div>

      {/* Biometric & Streak Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl text-center space-y-1">
          <Award className="w-5 h-5 mx-auto text-amber-500" />
          <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {overview?.streak || 3} Days
          </div>
          <span className="text-[10px] text-neutral-500">Active Streak</span>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl text-center space-y-1">
          <Activity className="w-5 h-5 mx-auto text-emerald-500" />
          <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {overview?.totalWorkoutsCompleted || 0}
          </div>
          <span className="text-[10px] text-neutral-500">Workouts Done</span>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl text-center space-y-1">
          <Flame className="w-5 h-5 mx-auto text-orange-500" />
          <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {overview?.adherencePercent || 92}%
          </div>
          <span className="text-[10px] text-neutral-500">Calorie Adherence</span>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl text-center space-y-1">
          <Droplets className="w-5 h-5 mx-auto text-sky-500" />
          <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {overview?.waterAdherencePercent || 88}%
          </div>
          <span className="text-[10px] text-neutral-500">Hydration Rate</span>
        </div>
      </div>

      {/* Weight History Timeline */}
      <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Weight Log Entries</h3>
        {overview?.weightLogs?.length > 0 ? (
          <div className="space-y-2">
            {overview.weightLogs.map((log: any, idx: number) => (
              <div
                key={log.id || idx}
                className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl text-xs"
              >
                <div>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">{log.weight} kg</span>
                  <span className="text-neutral-500 ml-2">BMI: {log.bmi}</span>
                  {log.notes && <p className="text-[10px] text-neutral-400 mt-0.5">{log.notes}</p>}
                </div>
                <span className="text-neutral-400 font-mono text-[11px]">{log.date}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-400">No weight history logged yet.</p>
        )}
      </div>

      <WeightTrackerModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        onUpdated={fetchOverview}
      />
    </div>
  );
};
