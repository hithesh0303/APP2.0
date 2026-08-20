-- FitAI Comprehensive Relational Database Schema for PostgreSQL
-- Supports full multi-user authentication, nutrition tracking, workout history,
-- water, weight, sleep, activity, reminders, notifications, recipes, meal plans, and grocery lists.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    age INT DEFAULT 25,
    gender VARCHAR(32) DEFAULT 'male',
    height NUMERIC(5,2) DEFAULT 175,
    weight NUMERIC(5,2) DEFAULT 70,
    target_weight NUMERIC(5,2) DEFAULT 66,
    activity_level VARCHAR(64) DEFAULT 'moderate',
    fitness_experience VARCHAR(64) DEFAULT 'beginner',
    fitness_goal VARCHAR(64) DEFAULT 'lose_fat',
    workout_preference VARCHAR(64) DEFAULT 'home',
    available_equipment JSONB DEFAULT '["Bodyweight"]',
    diet VARCHAR(64) DEFAULT 'vegetarian',
    food_preferences JSONB DEFAULT '["Indian"]',
    allergies JSONB DEFAULT '[]',
    disliked_foods JSONB DEFAULT '[]',
    daily_budget NUMERIC(8,2) DEFAULT 250,
    weekly_budget NUMERIC(8,2) DEFAULT 1750,
    available_workout_time INT DEFAULT 30,
    sleep_time VARCHAR(16) DEFAULT '23:00',
    wake_time VARCHAR(16) DEFAULT '07:00',
    theme_preference VARCHAR(32) DEFAULT 'light',
    daily_calorie_target INT DEFAULT 2000,
    protein_target INT DEFAULT 120,
    carbs_target INT DEFAULT 220,
    fat_target INT DEFAULT 55,
    water_target_ml INT DEFAULT 3000,
    step_goal INT DEFAULT 8000,
    sleep_goal_hours NUMERIC(4,2) DEFAULT 8.0,
    bmi NUMERIC(4,2) DEFAULT 22.8,
    bmi_category VARCHAR(64) DEFAULT 'Normal weight',
    onboarding_completed BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Food Catalog (Global & Custom)
CREATE TABLE IF NOT EXISTS foods (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    serving_size VARCHAR(128) NOT NULL,
    calories INT NOT NULL,
    protein NUMERIC(5,2) NOT NULL,
    carbs NUMERIC(5,2) NOT NULL,
    fat NUMERIC(5,2) NOT NULL,
    fiber NUMERIC(5,2) DEFAULT 0,
    is_custom BOOLEAN DEFAULT false,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    estimated_cost NUMERIC(8,2) DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);

-- 4. Daily Food Diary Logs
CREATE TABLE IF NOT EXISTS food_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type VARCHAR(64) NOT NULL,
    food_id VARCHAR(64) REFERENCES foods(id) ON DELETE SET NULL,
    food_name VARCHAR(255) NOT NULL,
    serving_size VARCHAR(128) NOT NULL,
    quantity NUMERIC(5,2) DEFAULT 1.0,
    calories INT NOT NULL,
    protein NUMERIC(5,2) NOT NULL,
    carbs NUMERIC(5,2) NOT NULL,
    fat NUMERIC(5,2) NOT NULL,
    fiber NUMERIC(5,2) DEFAULT 0,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs(user_id, date);

-- 5. Workout Templates
CREATE TABLE IF NOT EXISTS workout_templates (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    fitness_level VARCHAR(64) NOT NULL,
    goal VARCHAR(128) NOT NULL,
    duration_minutes INT NOT NULL,
    calories_burned_estimate INT NOT NULL,
    equipment JSONB DEFAULT '[]',
    exercises JSONB NOT NULL,
    safety_guidance TEXT,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Workout History Logs
CREATE TABLE IF NOT EXISTS workout_histories (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_id VARCHAR(64) REFERENCES workout_templates(id) ON DELETE SET NULL,
    workout_title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    duration_minutes INT NOT NULL,
    calories_burned INT NOT NULL,
    exercises_completed INT NOT NULL,
    total_exercises INT NOT NULL,
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workout_histories_user_date ON workout_histories(user_id, date);

-- 7. Water Logs
CREATE TABLE IF NOT EXISTS water_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount_ml INT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, date);

-- 8. Weight & Body Measurements
CREATE TABLE IF NOT EXISTS weight_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight NUMERIC(5,2) NOT NULL,
    bmi NUMERIC(4,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, date);

CREATE TABLE IF NOT EXISTS body_measurements (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    chest_cm NUMERIC(5,2),
    waist_cm NUMERIC(5,2),
    hips_cm NUMERIC(5,2),
    arms_cm NUMERIC(5,2),
    thighs_cm NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Sleep and Activity Trackers
CREATE TABLE IF NOT EXISTS sleep_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    bedtime VARCHAR(16) NOT NULL,
    wake_time VARCHAR(16) NOT NULL,
    duration_minutes INT NOT NULL,
    quality VARCHAR(32) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    steps INT DEFAULT 0,
    distance_km NUMERIC(5,2) DEFAULT 0,
    active_minutes INT DEFAULT 0,
    calories_burned INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_user_date ON activity_logs(user_id, date);

-- 10. Reminders & Notifications
CREATE TABLE IF NOT EXISTS reminders (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    time VARCHAR(16) NOT NULL,
    repeat_days JSONB DEFAULT '["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]',
    enabled BOOLEAN DEFAULT true,
    message TEXT,
    interval_minutes INT,
    quiet_hours_start VARCHAR(16),
    quiet_hours_end VARCHAR(16),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(64) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- 11. Recipes & Meal Plans & Groceries
CREATE TABLE IF NOT EXISTS recipes (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ingredients JSONB NOT NULL,
    instructions JSONB NOT NULL,
    calories INT NOT NULL,
    protein NUMERIC(5,2) NOT NULL,
    carbs NUMERIC(5,2) NOT NULL,
    fat NUMERIC(5,2) NOT NULL,
    prep_time_minutes INT NOT NULL,
    cost_estimate NUMERIC(8,2) NOT NULL,
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meal_plans (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grocery_items (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity VARCHAR(128) NOT NULL,
    estimated_cost NUMERIC(8,2) DEFAULT 0,
    purchased BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
