import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { ToastContainer } from './components/common/Toast';
import { AuthModal } from './components/auth/AuthModal';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { FoodScreen } from './components/food/FoodScreen';
import { WorkoutScreen } from './components/workout/WorkoutScreen';
import { ActiveWorkoutPlayer } from './components/workout/ActiveWorkoutPlayer';
import { CoachChatScreen } from './components/coach/CoachChatScreen';
import { ProgressScreen } from './components/progress/ProgressScreen';
import { ProfileScreen } from './components/profile/ProfileScreen';
import { NotificationCenterModal } from './components/notifications/NotificationCenterModal';
import { RemindersModal } from './components/reminders/RemindersModal';
import { WorkoutTemplate } from './types';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, user, profile, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'food' | 'workout' | 'coach' | 'progress' | 'profile'>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [activeWorkoutSession, setActiveWorkoutSession] = useState<WorkoutTemplate | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-xl font-black animate-pulse">
          F
        </div>
        <p className="text-xs text-neutral-400 font-semibold tracking-wider uppercase">Loading FitAI Architecture...</p>
      </div>
    );
  }

  // If user is authenticated and explicitly hasn't finished profile setup, show Onboarding Wizard
  const needsOnboarding = Boolean(
    isAuthenticated && profile && profile.onboardingCompleted === false
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      {/* Global Header */}
      <Header
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        onOpenProfile={() => setActiveTab('profile')}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenReminders={() => setIsRemindersOpen(true)}
      />

      {/* Main Body View */}
      <main className="max-w-4xl mx-auto px-4 pt-4 sm:px-6">
        {needsOnboarding ? (
          <OnboardingFlow onComplete={() => setActiveTab('dashboard')} />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardScreen
                onNavigate={(t) => setActiveTab(t as any)}
                onStartWorkout={(w) => setActiveWorkoutSession(w)}
              />
            )}
            {activeTab === 'food' && <FoodScreen />}
            {activeTab === 'workout' && <WorkoutScreen />}
            {activeTab === 'coach' && <CoachChatScreen />}
            {activeTab === 'progress' && <ProgressScreen />}
            {activeTab === 'profile' && (
              <ProfileScreen
                onOpenReminders={() => setIsRemindersOpen(true)}
                onOpenAuth={() => setIsAuthModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Bottom Nav */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
      />

      {/* Interactive Active Workout Overlay */}
      {activeWorkoutSession && (
        <ActiveWorkoutPlayer
          workout={activeWorkoutSession}
          onClose={() => setActiveWorkoutSession(null)}
          onCompleted={() => {
            setActiveWorkoutSession(null);
            setActiveTab('progress');
          }}
        />
      )}

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />

      <RemindersModal
        isOpen={isRemindersOpen}
        onClose={() => setIsRemindersOpen(false)}
      />

      {/* Toast Overlay */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <MainAppContent />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
