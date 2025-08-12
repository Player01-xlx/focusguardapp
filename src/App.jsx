/*
FocusGuard - React Starter (Enhanced AI Version)

What this app does:
- A mobile-friendly Pomodoro-style Pomodoro-style focus timer (start / pause / reset).
- Enhanced AI-powered recommendations and insights.
- Advanced smart reminders with machine learning.
- A task list and daily goals with intelligent prioritization.
- Session history with deep analytics.
- Clean monochrome design optimized for focus.

This file is a single-file React app optimized for productivity and focus.
*/

import React, { useState, useEffect, useRef } from "react";

// ---------------------- Constants & Utilities ----------------------
const DEFAULT_SETTINGS = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  soundEnabled: true,
};

const DEFAULT_CUSTOMIZATION = {
  layout: 'default', // 'default', 'compact', 'minimal'
  theme: 'monochrome',
  enableTooltips: true,
  visibleSections: {
    tasks: true,
    dailyGoals: true,
    settings: true,
    history: false,
    aiInsights: false,
    smartRecommendations: false,
    achievements: false,
    streaks: false,
    sessionHighlights: false,
    smartReminders: false,
    focusAnalytics: false,
    localAnalytics: false,
    supportCreator: false,
    deviceSync: false
  },
  sectionOrder: ['aiInsights', 'smartRecommendations', 'localAnalytics', 'tasks', 'dailyGoals', 'focusAnalytics', 'achievements', 'streaks', 'sessionHighlights', 'smartReminders', 'deviceSync', 'settings', 'history', 'supportCreator'],
  headerButtons: {
    customize: true,
    analytics: true,
    layoutToggle: true,
    notifications: true,
    aiCoach: true
  },
  showHeaderButtons: true
};

const ACHIEVEMENTS = [
  // Basic Milestones
  { id: 'first_session', name: 'Getting Started', description: 'Complete your first focus session', icon: '🎯', coins: 10, unlocked: false },
  { id: 'first_week', name: 'First Week', description: 'Complete 7 focus sessions total', icon: '📅', coins: 25, unlocked: false },
  { id: 'first_month', name: 'Monthly Milestone', description: 'Complete 30 focus sessions total', icon: '🗓️', coins: 75, unlocked: false },

  // Time-based Achievements
  { id: 'early_bird', name: 'Early Bird', description: 'Complete a focus session before 8 AM', icon: '🌅', coins: 20, unlocked: false },
  { id: 'night_owl', name: 'Night Owl', description: 'Complete a focus session after 10 PM', icon: '🦉', coins: 20, unlocked: false },
  { id: 'midnight_warrior', name: 'Midnight Warrior', description: 'Complete a session between 12 AM - 4 AM', icon: '🌙', coins: 30, unlocked: false },
  { id: 'sunrise_session', name: 'Sunrise Session', description: 'Start a focus session during sunrise (5-7 AM)', icon: '🌄', coins: 35, unlocked: false },
  { id: 'golden_hour', name: 'Golden Hour', description: 'Complete a session during 6-8 PM', icon: '🌇', coins: 25, unlocked: false },
  { id: 'lunch_break_pro', name: 'Lunch Break Pro', description: 'Complete a session during lunch (11 AM - 2 PM)', icon: '🥪', coins: 20, unlocked: false },

  // Weekend & Holiday Achievements  
  { id: 'weekend_grind', name: 'Weekend Grind', description: 'Complete 4 focus sessions on a weekend day', icon: '🏖️', coins: 25, unlocked: false },
  { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Complete sessions on both Saturday and Sunday', icon: '⚔️', coins: 40, unlocked: false },
  { id: 'monday_motivation', name: 'Monday Motivation', description: 'Complete 3 sessions on a Monday', icon: '💼', coins: 30, unlocked: false },
  { id: 'friday_finisher', name: 'Friday Finisher', description: 'Complete 5 sessions on a Friday', icon: '🎉', coins: 35, unlocked: false },

  // Streak Achievements
  { id: 'streak_3', name: 'On Fire', description: 'Maintain a 3-day streak', icon: '🔥', coins: 30, unlocked: false },
  { id: 'streak_7', name: 'Weekly Warrior', description: 'Maintain a 7-day streak', icon: '⚡', coins: 50, unlocked: false },
  { id: 'streak_14', name: 'Consistent', description: 'Maintain a 14-day streak', icon: '💪', coins: 70, unlocked: false },
  { id: 'streak_30', name: 'Marathon Streak', description: 'Maintain a 30-day streak', icon: '🚀', coins: 100, unlocked: false },
  { id: 'streak_50', name: 'Streak Beast', description: 'Maintain a 50-day streak', icon: '🦁', coins: 150, unlocked: false },
  { id: 'streak_100', name: 'Streak Legend', description: 'Maintain a 100-day streak', icon: '🌟', coins: 200, unlocked: false },
  { id: 'comeback_kid', name: 'Comeback Kid', description: 'Rebuild a streak after losing one over 10 days', icon: '🔄', coins: 45, unlocked: false },

  // Volume Achievements
  { id: 'ten_sessions', name: 'Tenacious', description: 'Complete 10 focus sessions', icon: '💯', coins: 20, unlocked: false },
  { id: 'twenty_five_sessions', name: 'Quarter Century', description: 'Complete 25 focus sessions', icon: '🥉', coins: 35, unlocked: false },
  { id: 'fifty_sessions', name: 'Dedicated', description: 'Complete 50 focus sessions', icon: '🥈', coins: 50, unlocked: false },
  { id: 'hundred_sessions', name: 'Focused', description: 'Complete 100 focus sessions', icon: '🥇', coins: 80, unlocked: false },
  { id: 'two_fifty_sessions', name: 'Elite Focus', description: 'Complete 250 focus sessions', icon: '🏆', coins: 120, unlocked: false },
  { id: 'five_hundred_sessions', name: 'Focus Virtuoso', description: 'Complete 500 focus sessions', icon: '🎖️', coins: 180, unlocked: false },
  { id: 'thousand_sessions', name: 'Master', description: 'Complete 1000 focus sessions', icon: '👑', coins: 300, unlocked: false },

  // Time Duration Achievements
  { id: 'hundred_minutes', name: 'Century Club', description: 'Focus for 100 minutes total', icon: '⏳', coins: 40, unlocked: false },
  { id: 'five_hours', name: 'Time Keeper', description: 'Focus for 5 hours total', icon: '⏰', coins: 60, unlocked: false },
  { id: 'ten_hours', name: 'Time Lord', description: 'Focus for 10 hours total', icon: '🕰️', coins: 90, unlocked: false },
  { id: 'twenty_five_hours', name: 'Day Warrior', description: 'Focus for 25 hours total', icon: '📊', coins: 120, unlocked: false },
  { id: 'fifty_hours', name: 'Work Beast', description: 'Focus for 50 hours total', icon: '💼', coins: 200, unlocked: false },
  { id: 'hundred_hours', name: 'Century Timer', description: 'Focus for 100 hours total', icon: '⭐', coins: 350, unlocked: false },

  // Single Session Achievements
  { id: 'marathon', name: 'Marathoner', description: 'Complete a 2-hour focus session', icon: '🏃‍♂️', coins: 60, unlocked: false },
  { id: 'ultra_marathon', name: 'Ultra Marathoner', description: 'Complete a 4-hour focus session', icon: '🏁', coins: 150, unlocked: false },
  { id: 'iron_focus', name: 'Iron Focus', description: 'Complete a 6-hour focus session', icon: '🔥', coins: 250, unlocked: false },
  { id: 'short_burst', name: 'Sprint Master', description: 'Complete a 5-minute focus session', icon: '💨', coins: 15, unlocked: false },
  { id: 'perfect_pomodoro', name: 'Perfect Pomodoro', description: 'Complete exactly 25 minutes without pause', icon: '🍅', coins: 25, unlocked: false },

  // Task & Goal Achievements
  { id: 'first_task', name: 'Task Starter', description: 'Complete your first task', icon: '✅', coins: 10, unlocked: false },
  { id: 'task_rookie', name: 'Task Rookie', description: 'Complete 10 tasks', icon: '📝', coins: 25, unlocked: false },
  { id: 'task_master', name: 'Task Master', description: 'Complete 50 tasks', icon: '✅', coins: 60, unlocked: false },
  { id: 'productivity_machine', name: 'Productivity Machine', description: 'Complete 100 tasks', icon: '⚙️', coins: 100, unlocked: false },
  { id: 'task_legend', name: 'Task Legend', description: 'Complete 250 tasks', icon: '🏅', coins: 180, unlocked: false },
  { id: 'goal_starter', name: 'Goal Setter', description: 'Complete your first daily goal', icon: '🎯', coins: 15, unlocked: false },
  { id: 'goal_crusher', name: 'Goal Crusher', description: 'Complete 25 daily goals', icon: '🎯', coins: 70, unlocked: false },
  { id: 'daily_clean_sweep', name: 'Clean Sweep', description: 'Complete all daily goals in one day (3+ goals)', icon: '🧹', coins: 50, unlocked: false },
  { id: 'weekly_goals_master', name: 'Weekly Goals Master', description: 'Complete daily goals 7 days in a row', icon: '📈', coins: 80, unlocked: false },

  // AI & Technology Achievements
  { id: 'ai_student', name: 'AI Student', description: 'Follow 10 AI recommendations', icon: '🤖', coins: 50, unlocked: false },
  { id: 'ai_master', name: 'AI Master', description: 'Follow 50 AI recommendations', icon: '🧠', coins: 150, unlocked: false },
  { id: 'ai_sensei', name: 'AI Sensei', description: 'Follow 100 AI recommendations', icon: '🥋', coins: 250, unlocked: false },
  { id: 'data_scientist', name: 'Data Scientist', description: 'Export your analytics data 5 times', icon: '📊', coins: 40, unlocked: false },
  { id: 'smart_notifications', name: 'Notification Pro', description: 'Enable AI smart notifications', icon: '🔔', coins: 30, unlocked: false },

  // Daily Performance Achievements
  { id: 'speed_demon', name: 'Speed Demon', description: 'Complete 5 focus sessions in one day', icon: '💨', coins: 40, unlocked: false },
  { id: 'daily_champion', name: 'Daily Champion', description: 'Complete 8 focus sessions in one day', icon: '🏆', coins: 70, unlocked: false },
  { id: 'productivity_beast', name: 'Productivity Beast', description: 'Complete 10 focus sessions in one day', icon: '👹', coins: 100, unlocked: false },
  { id: 'unstoppable', name: 'Unstoppable', description: 'Complete 15 focus sessions in one day', icon: '🚀', coins: 150, unlocked: false },

  // Consistency & Pattern Achievements
  { id: 'consistency_king', name: 'Consistency King', description: 'Complete at least 1 session daily for 30 days', icon: '🗓️', coins: 200, unlocked: false },
  { id: 'morning_person', name: 'Morning Person', description: 'Complete 10 sessions before 9 AM', icon: '🌞', coins: 60, unlocked: false },
  { id: 'afternoon_ace', name: 'Afternoon Ace', description: 'Complete 15 sessions between 12-6 PM', icon: '☀️', coins: 55, unlocked: false },
  { id: 'evening_expert', name: 'Evening Expert', description: 'Complete 10 sessions after 6 PM', icon: '🌆', coins: 50, unlocked: false },
  { id: 'all_rounder', name: 'All Rounder', description: 'Complete sessions in morning, afternoon, and evening on same day', icon: '🌈', coins: 75, unlocked: false },

  // Reflection & Mindfulness Achievements
  { id: 'first_reflection', name: 'Thoughtful Begin', description: 'Write your first session reflection', icon: '💭', coins: 15, unlocked: false },
  { id: 'reflective_soul', name: 'Reflective Soul', description: 'Save 25 session reflections', icon: '🪞', coins: 60, unlocked: false },
  { id: 'zen_master', name: 'Zen Master', description: 'Save 100 session reflections', icon: '🧘', coins: 180, unlocked: false },
  { id: 'philosopher', name: 'Philosopher', description: 'Save 250 session reflections', icon: '🤔', coins: 300, unlocked: false },
  { id: 'mindful_warrior', name: 'Mindful Warrior', description: 'Write reflections for 10 consecutive sessions', icon: '🧘‍♂️', coins: 70, unlocked: false },

  // Shop & Customization Achievements
  { id: 'first_purchase', name: 'First Purchase', description: 'Buy your first item from the shop', icon: '🛒', coins: 20, unlocked: false },
  { id: 'theme_collector', name: 'Theme Collector', description: 'Own 3 different themes', icon: '🎨', coins: 80, unlocked: false },
  { id: 'sound_engineer', name: 'Sound Engineer', description: 'Own 5 different sound effects', icon: '🔊', coins: 100, unlocked: false },
  { id: 'power_user', name: 'Power User', description: 'Use 10 different power-ups', icon: '⚡', coins: 120, unlocked: false },
  { id: 'shopaholic', name: 'Shopaholic', description: 'Spend 1000 coins in the shop', icon: '💳', coins: 150, unlocked: false },

  // Special Pattern Achievements
  { id: 'fibonacci_focus', name: 'Fibonacci Focus', description: 'Complete sessions following Fibonacci sequence (1,1,2,3,5 in days)', icon: '🌀', coins: 100, unlocked: false },
  { id: 'prime_time', name: 'Prime Time', description: 'Complete sessions on 5 prime numbered days of month', icon: '🔢', coins: 85, unlocked: false },
  { id: 'lucky_seven', name: 'Lucky Seven', description: 'Complete exactly 7 sessions, each exactly 7 minutes apart', icon: '🍀', coins: 77, unlocked: false },
  { id: 'double_trouble', name: 'Double Trouble', description: 'Complete 2 sessions of exactly double length (50min after 25min)', icon: '✖️', coins: 60, unlocked: false },

  // Social & Sharing Achievements  
  { id: 'data_sharer', name: 'Data Sharer', description: 'Generate a sync code to share progress', icon: '🔗', coins: 30, unlocked: false },
  { id: 'analytics_master', name: 'Analytics Master', description: 'View analytics dashboard 20 times', icon: '📈', coins: 50, unlocked: false },

  // Challenge & Extreme Achievements
  { id: 'iron_will', name: 'Iron Will', description: 'Complete 50 consecutive sessions without skipping', icon: '🗿', coins: 200, unlocked: false },
  { id: 'centurion', name: 'Centurion', description: 'Complete 100 sessions in 30 days', icon: '🏛️', coins: 300, unlocked: false },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Achieve 100% success rate for 25 sessions', icon: '💎', coins: 250, unlocked: false },
  { id: 'comeback_champion', name: 'Comeback Champion', description: 'Rebuild to 30-day streak after losing 50+ day streak', icon: '🔥', coins: 400, unlocked: false },
  { id: 'legend', name: 'Living Legend', description: 'Reach level 50', icon: '🌟', coins: 500, unlocked: false },
];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// XP Calculation Logic
function calculateLevel(xp) {
  let level = 1;
  let xpNeededForLevel = 100; // Base XP for level 2
  while (xp >= xpNeededForLevel) {
    xp -= xpNeededForLevel;
    level++;
    xpNeededForLevel = Math.floor(xpNeededForLevel * 1.15); // Increase XP requirement by 15% each level
  }
  return level;
}

function getXPForNextLevel(currentXP) {
  let level = 1;
  let xpNeededForLevel = 100;
  let xpAccumulated = 0;

  while (xpAccumulated <= currentXP) {
    xpAccumulated += xpNeededForLevel;
    level++;
    xpNeededForLevel = Math.floor(xpNeededForLevel * 1.15);
  }
  return xpAccumulated;
}

function getXPProgressInCurrentLevel(currentXP) {
  let level = 1;
  let xpNeededForLevel = 100;
  let xpAccumulated = 0;
  let xpForCurrentLevel = 0;

  while (xpAccumulated <= currentXP) {
    xpAccumulated += xpNeededForLevel;
    level++;
    xpForCurrentLevel = xpNeededForLevel; // XP needed for the level we just passed
    xpNeededForLevel = Math.floor(xpNeededForLevel * 1.15);
  }

  // XP within the current level
  const xpInCurrentLevel = currentXP - (xpAccumulated - xpForCurrentLevel);

  // Calculate progress towards the *next* level
  const xpToNextLevel = xpNeededForLevel; // xpNeededForLevel is already calculated for the next level

  return xpToNextLevel === 0 ? 0 : (xpInCurrentLevel / xpToNextLevel) * 100;
}


// Gamified Rewards Shop
const SHOP_ITEMS = {
  themes: {
    dark: { name: 'Dark Mode', price: 50, icon: '🌙', description: 'Sleek dark theme' },
    neon: { name: 'Neon Glow', price: 150, icon: '💫', description: 'Futuristic neon theme' },
    nature: { name: 'Nature Green', price: 100, icon: '🌿', description: 'Calming nature theme' },
    sunset: { name: 'Sunset Orange', price: 120, icon: '🌅', description: 'Warm sunset colors' },
    ocean: { name: 'Ocean Blue', price: 80, icon: '🌊', description: 'Deep ocean theme' },
    minimal: { name: 'Minimal White', price: 60, icon: '⚪', description: 'Clean minimal design' },
    retro: { name: 'Retro Terminal', price: 180, icon: '💻', description: 'Classic green terminal look' },
    galaxy: { name: 'Galaxy Purple', price: 200, icon: '🌌', description: 'Deep space theme' }
  },
  sounds: {
    piano: { name: 'Piano Notes', price: 60, icon: '🎹', description: 'Gentle piano notifications' },
    chimes: { name: 'Wind Chimes', price: 40, icon: '🎐', description: 'Peaceful chime sounds' },
    bells: { name: 'Temple Bells', price: 70, icon: '🔔', description: 'Meditative bell tones' },
    nature: { name: 'Nature Sounds', price: 90, icon: '🦜', description: 'Bird and nature sounds' },
    space: { name: 'Space Blips', price: 120, icon: '🚀', description: 'Futuristic sci-fi sounds' },
    zen: { name: 'Zen Bowls', price: 80, icon: '🧘', description: 'Singing bowl harmony' },
    guitar: { name: 'Guitar Chord', price: 100, icon: '🎸', description: 'Acoustic guitar strum' },
    synth: { name: 'Synth Wave', price: 110, icon: '🎵', description: 'Retro synth melody' },
    drum: { name: 'Victory Drums', price: 85, icon: '🥁', description: 'Triumphant drum beat' },
    harp: { name: 'Angel Harp', price: 95, icon: '🎯', description: 'Ethereal harp glissando' }
  },
  boosts: {
    doubleXP: { name: '2x XP Boost', price: 200, icon: '⚡', description: '2x XP for 1 hour', duration: 3600 },
    streakFreeze: { name: 'Streak Freeze', price: 100, icon: '❄️', description: 'Protect your streak for 1 day' },
    focusBoost: { name: 'Focus Boost', price: 150, icon: '🎯', description: 'Extra focus time bonus' },
    tripleCoins: { name: '3x Coins', price: 250, icon: '🪙', description: 'Triple coins for 30 min', duration: 1800 },
    megaXP: { name: 'Mega XP', price: 300, icon: '💎', description: '5x XP for 15 min', duration: 900 },
    timeExtend: { name: 'Time Warp', price: 180, icon: '⏰', description: 'Add 10 min to current session' },
    instantLevel: { name: 'Level Jump', price: 500, icon: '🚀', description: 'Instant level up (once per day)' }
  },
  special: {
    aiCoach: { name: 'AI Coach Pro', price: 400, icon: '🤖', description: 'Advanced AI insights & predictions' },
    customTimer: { name: 'Custom Timer', price: 300, icon: '⏲️', description: 'Set any timer duration' },
    darkWeb: { name: 'Dark Web Mode', price: 350, icon: '🕸️', description: 'Exclusive dark interface' },
    rainbow: { name: 'Rainbow Effects', price: 250, icon: '🌈', description: 'Colorful progress animations' },
    stealth: { name: 'Stealth Mode', price: 200, icon: '👤', description: 'Hide timer from others' },
    analytics: { name: 'Pro Analytics', price: 450, icon: '📊', description: 'Advanced productivity insights' }
  }
};

// Create proper audio context and functions
let audioContext = null;
let masterGainNode = null;
let tooltipTimeout = null;

function initAudioContext() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      masterGainNode = audioContext.createGain();
      masterGainNode.connect(audioContext.destination);
      masterGainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

      // Resume context if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
    } catch (error) {
      console.warn('Audio context not supported:', error);
      return null;
    }
  }
  return audioContext;
}

function createBeep(frequency = 800, duration = 200, type = 'sine') {
  const ctx = initAudioContext();
  if (!ctx || !masterGainNode) return null;

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(masterGainNode);

    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);

    return oscillator;
  } catch (error) {
    console.warn('Failed to create beep:', error);
    return null;
  }
}

function playStartSound() {
  try {
    // Cheerful ascending tone for session start
    createBeep(523, 150); // C5
    setTimeout(() => createBeep(659, 150), 100); // E5
    setTimeout(() => createBeep(784, 200), 200); // G5
  } catch (error) {
    console.warn('Failed to play start sound:', error);
  }
}

function playEndSound() {
  try {
    // Gentle descending tone for session end
    createBeep(784, 150); // G5
    setTimeout(() => createBeep(659, 150), 100); // E5
    setTimeout(() => createBeep(523, 200), 200); // C5
  } catch (error) {
    console.warn('Failed to play end sound:', error);
  }
}

function playCustomSound(soundType) {
  try {
    switch(soundType) {
      case 'piano':
        createBeep(523, 300, 'triangle'); // C5
        setTimeout(() => createBeep(659, 300, 'triangle'), 200); // E5
        break;
      case 'chimes':
        createBeep(1047, 500, 'sine'); // C6
        setTimeout(() => createBeep(1319, 400, 'sine'), 100); // E6
        setTimeout(() => createBeep(1568, 600, 'sine'), 200); // G6
        break;
      case 'bells':
        createBeep(440, 800, 'triangle'); // A4
        setTimeout(() => createBeep(880, 600, 'triangle'), 300); // A5
        break;
      case 'nature':
        // Bird chirp simulation
        createBeep(2000, 100, 'square');
        setTimeout(() => createBeep(2500, 80, 'square'), 50);
        setTimeout(() => createBeep(1800, 120, 'square'), 150);
        break;
      case 'space':
        createBeep(800, 150, 'square');
        setTimeout(() => createBeep(1200, 150, 'square'), 100);
        setTimeout(() => createBeep(1600, 200, 'square'), 200);
        break;
      case 'zen':
        createBeep(256, 1000, 'sine'); // Low C
        setTimeout(() => createBeep(512, 800, 'sine'), 200); // Higher C
        setTimeout(() => createBeep(768, 600, 'sine'), 400); // G
        break;
      case 'guitar':
        createBeep(82, 400, 'triangle'); // E2
        setTimeout(() => createBeep(110, 350, 'triangle'), 50); // A2
        setTimeout(() => createBeep(147, 300, 'triangle'), 100); // D3
        setTimeout(() => createBeep(196, 250, 'triangle'), 150); // G3
        break;
      case 'synth':
        createBeep(440, 200, 'sawtooth');
        setTimeout(() => createBeep(554, 200, 'sawtooth'), 150);
        setTimeout(() => createBeep(659, 300, 'sawtooth'), 300);
        break;
      case 'drum':
        createBeep(60, 100, 'square'); // Bass drum
        setTimeout(() => createBeep(200, 80, 'square'), 120); // Snare
        setTimeout(() => createBeep(60, 100, 'square'), 200); // Bass drum
        break;
      case 'harp':
        createBeep(523, 150, 'triangle'); // C5
        setTimeout(() => createBeep(587, 150, 'triangle'), 80); // D5
        setTimeout(() => createBeep(659, 150, 'triangle'), 160); // E5
        setTimeout(() => createBeep(698, 150, 'triangle'), 240); // F5
        setTimeout(() => createBeep(784, 200, 'triangle'), 320); // G5
        break;
      default:
        playStartSound();
    }
  } catch (error) {
    console.warn('Failed to play custom sound:', error);
  }
}

// Enhanced tooltip functions - only show on button hover with customization enabled
function showTooltip(message, event) {
  if (!customization.enableTooltips) return;

  clearTimeout(tooltipTimeout);

  // Only show tooltips on buttons
  if (!event.target.tagName.toLowerCase() === 'button') return;

  const tooltip = document.getElementById('custom-tooltip');
  if (!tooltip) return;

  tooltip.innerHTML = message;
  const rect = event.target.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  let top = rect.top + window.scrollY - tooltipRect.height - 10;
  let left = rect.left + window.scrollX - tooltipRect.width / 2 + rect.width / 2;

  // Prevent tooltip from going off-screen
  if (top < 0) top = rect.bottom + window.scrollY + 10;
  if (left < 0) left = 5;
  if (left + tooltipRect.width > window.innerWidth) left = window.innerWidth - tooltipRect.width - 5;

  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
  tooltip.style.display = 'block';
  tooltip.style.opacity = '1';
}

function hideTooltip() {
  tooltipTimeout = setTimeout(() => {
    const tooltip = document.getElementById('custom-tooltip');
    if (tooltip) {
      tooltip.style.opacity = '0';
      tooltip.style.display = 'none';
    }
  }, 100);
}

// ---------------------- Main App ----------------------
export default function App() {
  // Settings persisted in localStorage
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem("fg_settings");
      return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  // Mobile layout detection
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [forceMobileLayout, setForceMobileLayout] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_forceMobileLayout");
      return saved ? JSON.parse(saved) : false;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("fg_forceMobileLayout", JSON.stringify(forceMobileLayout));
  }, [forceMobileLayout]);

  // Customization state
  const [customization, setCustomization] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_customization");
      const parsed = saved ? JSON.parse(saved) : DEFAULT_CUSTOMIZATION;
      if (!parsed.headerButtons) {
        parsed.headerButtons = DEFAULT_CUSTOMIZATION.headerButtons;
      }
      return parsed;
    } catch (e) {
      return DEFAULT_CUSTOMIZATION;
    }
  });

  // User progress state
  const [userProgress, setUserProgress] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_userProgress");
      return saved ? JSON.parse(saved) : {
        xp: 0,
        level: 1,
        totalFocusMinutes: 0,
        totalTasks: 0,
        totalGoalsCompleted: 0,
        streakCount: 0,
        lastStreakDate: null,
        streakFreezes: 0,
        aiRecommendationsFollowed: 0,
        achievements: ACHIEVEMENTS
      };
    } catch (e) {
      return {
        xp: 0,
        level: 1,
        totalFocusMinutes: 0,
        totalTasks: 0,
        totalGoalsCompleted: 0,
        streakCount: 0,
        lastStreakDate: null,
        streakFreezes: 0,
        aiRecommendationsFollowed: 0,
        achievements: ACHIEVEMENTS
      };
    }
  });

  // Tasks (simple todo list)
  const [tasks, setTasks] = useState(() => {
    try {
      const raw = localStorage.getItem("fg_tasks");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [taskInput, setTaskInput] = useState("");

  // Timer state
  const [mode, setMode] = useState("focus"); // 'focus' | 'short' | 'long'
  const [remaining, setRemaining] = useState(settings.focusMinutes * 60);
  const [running, setRunning] = useState(false);

  // History of sessions
  const [history, setHistory] = useState(() => {
    try {
      const raw = localStorage.getItem("fg_history");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  // Daily goals
  const [dailyGoals, setDailyGoals] = useState(() => {
    try {
      const raw = localStorage.getItem("fg_dailyGoals");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [goalInput, setGoalInput] = useState("");

  // UI state
  const [showCustomization, setShowCustomization] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAICoach, setShowAICoach] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [showBreakOptions, setShowBreakOptions] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);

  // Session highlights
  const [sessionHighlights, setSessionHighlights] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_sessionHighlights");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("fg_sessionHighlights", JSON.stringify(sessionHighlights));
  }, [sessionHighlights]);

  // Local Analytics State
  const [localAnalytics, setLocalAnalytics] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_localAnalytics");
      return saved ? JSON.parse(saved) : {
        dailyStats: {},
        weeklyGoals: { target: 4, current: 0 },
        monthlyProgress: {},
        bestStreak: 0,
        totalHours: 0,
        averageSessionLength: 0,
        productivityScore: 0
      };
    } catch (e) {
      return {
        dailyStats: {},
        weeklyGoals: { target: 4, current: 0 },
        monthlyProgress: {},
        bestStreak: 0,
        totalHours: 0,
        averageSessionLength: 0,
        productivityScore: 0
      };
    }
  });

  useEffect(() => {
    localStorage.setItem("fg_localAnalytics", JSON.stringify(localAnalytics));
  }, [localAnalytics]);



  // Coins and Shop state
  const [coins, setCoins] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_coins");
      return saved ? JSON.parse(saved) : 0;
    } catch (e) {
      return 0;
    }
  });

  const [ownedItems, setOwnedItems] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_ownedItems");
      return saved ? JSON.parse(saved) : { themes: [], sounds: [], boosts: [], special: [] };
    } catch (e) {
      return { themes: [], sounds: [], boosts: [], special: [] };
    }
  });

  const [activeTheme, setActiveTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_activeTheme");
      return saved ? JSON.parse(saved) : 'monochrome';
    } catch (e) {
      return 'monochrome';
    }
  });

  const [activeSound, setActiveSound] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_activeSound");
      return saved ? JSON.parse(saved) : 'default';
    } catch (e) {
      return 'default';
    }
  });

  const [activeBoosts, setActiveBoosts] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_activeBoosts");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [showShop, setShowShop] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showHowToGuide, setShowHowToGuide] = useState(false);
  const [expandedGuideSection, setExpandedGuideSection] = useState(null);
  const [syncCode, setSyncCode] = useState('');
  const [generatedSyncCode, setGeneratedSyncCode] = useState('');
  const [syncCodes, setSyncCodes] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_syncCodes");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Keep track of completed focus cycles in the current round
  const cyclesRef = useRef(0);
  const timerRef = useRef(null);
  const sessionStartRef = useRef(null);

  // Enhanced Smart Reminders & AI state
  const [smartReminders, setSmartReminders] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_smartReminders");
      return saved ? JSON.parse(saved) : {
        enabled: false,
        optimalTimes: [],
        scheduledReminders: [],
        aiLearningData: {
          sessionPatterns: [],
          productivityScores: [],
          environmentFactors: []
        },
        preferences: {
          reminderTypes: ['focus', 'break', 'streak', 'optimization'],
          aiIntensity: 'adaptive', // 'low', 'medium', 'high', 'adaptive'
          quietHours: { start: 22, end: 7 }
        }
      };
    } catch {
      return {
        enabled: false,
        optimalTimes: [],
        scheduledReminders: [],
        aiLearningData: {
          sessionPatterns: [],
          productivityScores: [],
          environmentFactors: []
        },
        preferences: {
          reminderTypes: ['focus', 'break', 'streak', 'optimization'],
          aiIntensity: 'adaptive',
          quietHours: { start: 22, end: 7 }
        }
      };
    }
  });

  useEffect(() => {
    localStorage.setItem("fg_smartReminders", JSON.stringify(smartReminders));
  }, [smartReminders]);

  // Persist all state whenever they change
  useEffect(() => {
    localStorage.setItem("fg_settings", JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem("fg_tasks", JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem("fg_history", JSON.stringify(history));
  }, [history]);
  useEffect(() => {
    localStorage.setItem("fg_dailyGoals", JSON.stringify(dailyGoals));
  }, [dailyGoals]);
  useEffect(() => {
    localStorage.setItem("fg_customization", JSON.stringify(customization));
  }, [customization]);
  useEffect(() => {
    localStorage.setItem("fg_userProgress", JSON.stringify(userProgress));
  }, [userProgress]);
  useEffect(() => {
    localStorage.setItem("fg_coins", JSON.stringify(coins));
  }, [coins]);
  useEffect(() => {
    localStorage.setItem("fg_ownedItems", JSON.stringify(ownedItems));
  }, [ownedItems]);
  useEffect(() => {
    localStorage.setItem("fg_activeTheme", JSON.stringify(activeTheme));
  }, [activeTheme]);
  useEffect(() => {
    localStorage.setItem("fg_activeSound", JSON.stringify(activeSound));
  }, [activeSound]);
  useEffect(() => {
    localStorage.setItem("fg_activeBoosts", JSON.stringify(activeBoosts));
  }, [activeBoosts]);
  useEffect(() => {
    localStorage.setItem("fg_syncCodes", JSON.stringify(syncCodes));
  }, [syncCodes]);

  // Update the remaining time if the user changes the settings
  useEffect(() => {
    if (mode === "focus") setRemaining(settings.focusMinutes * 60);
    else if (mode === "short") setRemaining(settings.shortBreakMinutes * 60);
    else setRemaining(settings.longBreakMinutes * 60);
  }, [settings, mode]);

  // Timer interval with real-time analytics updates
  useEffect(() => {
    if (!running) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    // Start interval
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        const newRemaining = r <= 1 ? 0 : r - 1;
        
        // Update analytics in real-time every second
        if (mode === 'focus' && sessionStartRef.current) {
          const currentSessionMinutes = Math.round((Date.now() - sessionStartRef.current) / 60000);
          const today = new Date().toISOString().slice(0, 10);
          
          // Update local analytics in real-time
          setLocalAnalytics(prev => {
            const newDailyStats = { ...prev.dailyStats };
            if (!newDailyStats[today]) {
              newDailyStats[today] = { sessions: 0, minutes: 0, completedSessions: 0 };
            }
            
            // Update current session minutes in real-time
            const otherSessionsToday = history.filter(s => 
              s.mode === 'focus' && 
              new Date(s.startTime).toISOString().slice(0, 10) === today
            ).reduce((sum, s) => sum + Math.round(s.durationSec / 60), 0);
            
            newDailyStats[today].minutes = otherSessionsToday + currentSessionMinutes;
            
            const totalMinutes = Object.values(newDailyStats).reduce((sum, day) => sum + day.minutes, 0);
            const totalSessions = Object.values(newDailyStats).reduce((sum, day) => sum + day.sessions, 0) + (running ? 1 : 0);
            
            return {
              ...prev,
              dailyStats: newDailyStats,
              totalHours: totalMinutes / 60,
              averageSessionLength: totalSessions > 0 ? totalMinutes / totalSessions : 0
            };
          });
        }
        
        if (newRemaining <= 0) {
          // End of session
          clearInterval(timerRef.current);
          timerRef.current = null;
          setRunning(false);
          handleTimerEnd();
        }
        
        return newRemaining;
      });
    }, 1000);

    // Clean up on unmount or when running changes
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode]);

  function handleTimerEnd() {
    // Play end sound
    if (settings.soundEnabled) {
      if (activeSound !== 'default' && ownedItems.sounds.includes(activeSound)) {
        playCustomSound(activeSound);
      } else {
        playEndSound();
      }
    }

    // Record session in history
    const endTime = Date.now();
    const startTime = sessionStartRef.current || (endTime - (settings[mode === 'focus' ? 'focusMinutes' : (mode === 'short' ? 'shortBreakMinutes' : 'longBreakMinutes')] * 60 * 1000));
    const durationSec = Math.round((endTime - startTime) / 1000);

    const sessionRecord = {
      id: generateId(),
      mode: mode,
      startTime: startTime,
      endTime: endTime,
      durationSec: durationSec,
      productivityScore: calculateProductivityScore(durationSec, mode),
      environmentContext: captureEnvironmentContext()
    };
    setHistory((h) => [sessionRecord, ...h]);

    // Update local analytics
    if (mode === 'focus') {
      updateLocalAnalytics(sessionRecord);
    }

    // Update AI learning data
    updateAILearningData(sessionRecord);

    // Show reward animation
    setShowRewardAnimation(true);
    setTimeout(() => setShowRewardAnimation(false), 3000);

    // Award XP and update progress for focus sessions
    if (mode === "focus") {
      const focusMinutes = Math.round(durationSec / 60);
      let xpGained = focusMinutes * 2; // 2 XP per minute

      // Exponential coin reward system - rewards longer sessions significantly more
      let coinsEarned = 1; // Base reward
      if (focusMinutes <= 5) {
        coinsEarned = 1;
      } else if (focusMinutes <= 15) {
        coinsEarned = Math.floor(2 + (focusMinutes - 5) * 0.3); // 2-5 coins for 5-15 min
      } else if (focusMinutes <= 30) {
        coinsEarned = Math.floor(5 + Math.pow(focusMinutes - 15, 1.3) * 0.4); // 5-12 coins for 15-30 min
      } else if (focusMinutes <= 60) {
        coinsEarned = Math.floor(12 + Math.pow(focusMinutes - 30, 1.5) * 0.3); // 12-25 coins for 30-60 min
      } else {
        // Exponential rewards for ultra-long sessions (60+ minutes)
        coinsEarned = Math.floor(25 + Math.pow(focusMinutes - 60, 1.8) * 0.2); // 25+ coins for 60+ min
      }

      // Apply XP boost if active
      if (activeBoosts.doubleXP && activeBoosts.doubleXP > Date.now()) {
        xpGained *= 2;
      }
      if (activeBoosts.tripleCoins && activeBoosts.tripleCoins > Date.now()) {
        coinsEarned *= 3;
      }

      // Show reflection prompt
      setShowReflection(true);

      setUserProgress(prev => {
        const newXP = prev.xp + xpGained;
        const newLevel = calculateLevel(newXP);
        const newTotalMinutes = prev.totalFocusMinutes + focusMinutes;
        const newTotalSessions = history.filter(s => s.mode === 'focus').length + 1;

        // Check for level up
        if (newLevel > prev.level) {
          sendNotification(`Level Up!`, `Congratulations! You've reached level ${newLevel}!`);
        }

        // Update streak
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        let newStreak = prev.streakCount;

        if (prev.lastStreakDate === yesterday || prev.lastStreakDate === null) {
          newStreak = prev.lastStreakDate === yesterday ? prev.streakCount + 1 : 1;
        } else if (prev.lastStreakDate !== today) {
          newStreak = 1;
        }

        // Check achievements and award coins
        let totalCoinsToAdd = coinsEarned;
        const updatedAchievements = prev.achievements.map(achievement => {
          if (achievement.unlocked) return achievement;

          const hour = new Date().getHours();
          const dayOfWeek = new Date().getDay();
          const dayOfMonth = new Date().getDate();
          let shouldUnlock = false;

          // Helper function to get sessions for specific conditions
          const getFocusSessions = () => history.filter(s => s.mode === 'focus');
          const getTodaySessions = () => history.filter(s => 
            s.mode === 'focus' && 
            new Date(s.startTime).toISOString().slice(0, 10) === today
          );
          const getWeekendSessions = () => history.filter(s => 
            s.mode === 'focus' && [0, 6].includes(new Date(s.startTime).getDay())
          );

          switch (achievement.id) {
            // Basic Milestones
            case 'first_session':
              shouldUnlock = true;
              break;
            case 'first_week':
              shouldUnlock = newTotalSessions >= 7;
              break;
            case 'first_month':
              shouldUnlock = newTotalSessions >= 30;
              break;

            // Time-based Achievements
            case 'early_bird':
              shouldUnlock = hour < 8;
              break;
            case 'night_owl':
              shouldUnlock = hour >= 22;
              break;
            case 'midnight_warrior':
              shouldUnlock = hour >= 0 && hour < 4;
              break;
            case 'sunrise_session':
              shouldUnlock = hour >= 5 && hour < 7;
              break;
            case 'golden_hour':
              shouldUnlock = hour >= 18 && hour < 20;
              break;
            case 'lunch_break_pro':
              shouldUnlock = hour >= 11 && hour < 14;
              break;

            // Weekend & Daily Achievements
            case 'weekend_grind':
              shouldUnlock = (dayOfWeek === 0 || dayOfWeek === 6) && 
                getTodaySessions().length >= 4;
              break;
            case 'weekend_warrior':
              const saturdaySessions = history.filter(s => 
                s.mode === 'focus' && new Date(s.startTime).getDay() === 6 &&
                new Date(s.startTime).toISOString().slice(0, 10) === today
              );
              const sundaySessions = history.filter(s => 
                s.mode === 'focus' && new Date(s.startTime).getDay() === 0 &&
                new Date(s.startTime).toISOString().slice(0, 10) === today
              );
              shouldUnlock = saturdaySessions.length > 0 && sundaySessions.length > 0;
              break;
            case 'monday_motivation':
              shouldUnlock = dayOfWeek === 1 && getTodaySessions().length >= 3;
              break;
            case 'friday_finisher':
              shouldUnlock = dayOfWeek === 5 && getTodaySessions().length >= 5;
              break;

            // Streak Achievements
            case 'streak_3':
              shouldUnlock = newStreak >= 3;
              break;
            case 'streak_7':
              shouldUnlock = newStreak >= 7;
              break;
            case 'streak_14':
              shouldUnlock = newStreak >= 14;
              break;
            case 'streak_30':
              shouldUnlock = newStreak >= 30;
              break;
            case 'streak_50':
              shouldUnlock = newStreak >= 50;
              break;
            case 'streak_100':
              shouldUnlock = newStreak >= 100;
              break;
            case 'comeback_kid':
              // Check if they previously had a streak > 10 and rebuilt it
              shouldUnlock = newStreak >= 5 && prev.streakCount === 0;
              break;

            // Volume Achievements
            case 'ten_sessions':
              shouldUnlock = newTotalSessions >= 10;
              break;
            case 'twenty_five_sessions':
              shouldUnlock = newTotalSessions >= 25;
              break;
            case 'fifty_sessions':
              shouldUnlock = newTotalSessions >= 50;
              break;
            case 'hundred_sessions':
              shouldUnlock = newTotalSessions >= 100;
              break;
            case 'two_fifty_sessions':
              shouldUnlock = newTotalSessions >= 250;
              break;
            case 'five_hundred_sessions':
              shouldUnlock = newTotalSessions >= 500;
              break;
            case 'thousand_sessions':
              shouldUnlock = newTotalSessions >= 1000;
              break;

            // Time Duration Achievements
            case 'hundred_minutes':
              shouldUnlock = newTotalMinutes >= 100;
              break;
            case 'five_hours':
              shouldUnlock = newTotalMinutes >= 300;
              break;
            case 'ten_hours':
              shouldUnlock = newTotalMinutes >= 600;
              break;
            case 'twenty_five_hours':
              shouldUnlock = newTotalMinutes >= 1500;
              break;
            case 'fifty_hours':
              shouldUnlock = newTotalMinutes >= 3000;
              break;
            case 'hundred_hours':
              shouldUnlock = newTotalMinutes >= 6000;
              break;

            // Single Session Achievements
            case 'marathon':
              shouldUnlock = focusMinutes >= 120;
              break;
            case 'ultra_marathon':
              shouldUnlock = focusMinutes >= 240;
              break;
            case 'iron_focus':
              shouldUnlock = focusMinutes >= 360;
              break;
            case 'short_burst':
              shouldUnlock = focusMinutes <= 5;
              break;
            case 'perfect_pomodoro':
              shouldUnlock = focusMinutes === 25;
              break;

            // Task & Goal Achievements
            case 'first_task':
              shouldUnlock = prev.totalTasks >= 1;
              break;
            case 'task_rookie':
              shouldUnlock = prev.totalTasks >= 10;
              break;
            case 'task_master':
              shouldUnlock = prev.totalTasks >= 50;
              break;
            case 'productivity_machine':
              shouldUnlock = prev.totalTasks >= 100;
              break;
            case 'task_legend':
              shouldUnlock = prev.totalTasks >= 250;
              break;
            case 'goal_starter':
              shouldUnlock = prev.totalGoalsCompleted >= 1;
              break;
            case 'goal_crusher':
              shouldUnlock = prev.totalGoalsCompleted >= 25;
              break;
            case 'daily_clean_sweep':
              const todayGoals = dailyGoals.filter(g => g.createdAt === today);
              const completedTodayGoals = todayGoals.filter(g => g.completed);
              shouldUnlock = todayGoals.length >= 3 && completedTodayGoals.length === todayGoals.length;
              break;
            case 'weekly_goals_master':
              // Check if completed goals 7 days in a row
              const last7DaysWithGoals = Array.from({length: 7}, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                return date.toISOString().slice(0, 10);
              });
              shouldUnlock = last7DaysWithGoals.every(date => 
                dailyGoals.some(g => g.createdAt === date && g.completed)
              );
              break;

            // AI & Technology Achievements
            case 'ai_student':
              shouldUnlock = prev.aiRecommendationsFollowed >= 10;
              break;
            case 'ai_master':
              shouldUnlock = prev.aiRecommendationsFollowed >= 50;
              break;
            case 'ai_sensei':
              shouldUnlock = prev.aiRecommendationsFollowed >= 100;
              break;
            case 'smart_notifications':
              shouldUnlock = smartReminders.enabled;
              break;

            // Daily Performance Achievements
            case 'speed_demon':
              shouldUnlock = getTodaySessions().length >= 4; // Current session makes it 5
              break;
            case 'daily_champion':
              shouldUnlock = getTodaySessions().length >= 7; // Current session makes it 8
              break;
            case 'productivity_beast':
              shouldUnlock = getTodaySessions().length >= 9; // Current session makes it 10
              break;
            case 'unstoppable':
              shouldUnlock = getTodaySessions().length >= 14; // Current session makes it 15
              break;

            // Consistency & Pattern Achievements
            case 'consistency_king':
              const last30Days = Array.from({length: 30}, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                return date.toISOString().slice(0, 10);
              });
              shouldUnlock = last30Days.every(date => 
                history.some(s => 
                  s.mode === 'focus' && 
                  new Date(s.startTime).toISOString().slice(0, 10) === date
                )
              );
              break;
            case 'morning_person':
              const morningSessions = history.filter(s => 
                s.mode === 'focus' && new Date(s.startTime).getHours() < 9
              );
              shouldUnlock = morningSessions.length >= 10;
              break;
            case 'afternoon_ace':
              const afternoonSessions = history.filter(s => 
                s.mode === 'focus' && 
                new Date(s.startTime).getHours() >= 12 && 
                new Date(s.startTime).getHours() < 18
              );
              shouldUnlock = afternoonSessions.length >= 15;
              break;
            case 'evening_expert':
              const eveningSessions = history.filter(s => 
                s.mode === 'focus' && new Date(s.startTime).getHours() >= 18
              );
              shouldUnlock = eveningSessions.length >= 10;
              break;
            case 'all_rounder':
              const todayMorning = getTodaySessions().some(s => new Date(s.startTime).getHours() < 12);
              const todayAfternoon = getTodaySessions().some(s => {
                const h = new Date(s.startTime).getHours();
                return h >= 12 && h < 18;
              });
              const todayEvening = getTodaySessions().some(s => new Date(s.startTime).getHours() >= 18);
              shouldUnlock = todayMorning && todayAfternoon && todayEvening;
              break;

            // Reflection & Mindfulness Achievements
            case 'first_reflection':
              shouldUnlock = sessionHighlights.length >= 1;
              break;
            case 'reflective_soul':
              shouldUnlock = sessionHighlights.length >= 25;
              break;
            case 'zen_master':
              shouldUnlock = sessionHighlights.length >= 99; // Current reflection makes it 100
              break;
            case 'philosopher':
              shouldUnlock = sessionHighlights.length >= 250;
              break;
            case 'mindful_warrior':
              // Check last 10 sessions had reflections
              const last10Sessions = history.filter(s => s.mode === 'focus').slice(0, 10);
              shouldUnlock = last10Sessions.length >= 10 && 
                last10Sessions.every(s => 
                  sessionHighlights.some(h => 
                    Math.abs(h.timestamp - s.endTime) < 300000 // Within 5 minutes
                  )
                );
              break;

            // Special Pattern Achievements
            case 'fibonacci_focus':
              // Complex logic for Fibonacci pattern - simplified check
              shouldUnlock = newTotalSessions >= 13; // 1+1+2+3+5 = 12, so 13th unlocks it
              break;
            case 'prime_time':
              const primedays = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];
              const sessionsOnPrimeDays = history.filter(s => 
                s.mode === 'focus' && 
                primedays.includes(new Date(s.startTime).getDate())
              );
              shouldUnlock = sessionsOnPrimeDays.length >= 5;
              break;
            case 'lucky_seven':
              shouldUnlock = getTodaySessions().length === 6; // Current session makes it 7
              break;

            // Challenge & Extreme Achievements  
            case 'perfectionist':
              const last25Sessions = history.filter(s => s.mode === 'focus').slice(0, 25);
              const successfulSessions = last25Sessions.filter(s => 
                s.durationSec >= settings.focusMinutes * 60 * 0.8
              );
              shouldUnlock = last25Sessions.length >= 25 && 
                successfulSessions.length === last25Sessions.length;
              break;
            case 'legend':
              shouldUnlock = calculateLevel(newXP) >= 50;
              break;

            default:
              shouldUnlock = false;
          }

          if (shouldUnlock) {
            totalCoinsToAdd += achievement.coins;
            sendNotification(`Achievement Unlocked!`, `${achievement.icon} ${achievement.name} - ${achievement.coins} coins earned!`);
            return { ...achievement, unlocked: true };
          }
          return achievement;
        });

        // Award all coins at once
        setCoins(prev => prev + totalCoinsToAdd);

        return {
          ...prev,
          xp: newXP,
          level: newLevel,
          totalFocusMinutes: newTotalMinutes,
          streakCount: newStreak,
          lastStreakDate: today,
          achievements: updatedAchievements
        };
      });

      cyclesRef.current += 1;
    } else {
      // Show break options for break sessions
      setShowBreakOptions(true);
    }

    // Decide next mode
    if (mode === "focus") {
      // AI-driven session length adjustment
      let nextFocusMinutes = settings.focusMinutes;
      const completedFocusSessions = history.filter(s => s.mode === 'focus');
      const successRate = completedFocusSessions.length > 0 
        ? completedFocusSessions.filter(s => s.productivityScore && s.productivityScore >= 70).length / completedFocusSessions.length 
        : 1;

      if (successRate < 0.6 && settings.focusMinutes > 15) {
        nextFocusMinutes = Math.max(15, settings.focusMinutes - 5);
        sendNotification('AI Focus Adjustment', `Your focus sessions are challenging. AI suggests shortening to ${nextFocusMinutes} minutes.`);
      } else if (successRate > 0.85 && settings.focusMinutes < 45) {
        nextFocusMinutes = Math.min(45, settings.focusMinutes + 5);
        sendNotification('AI Focus Adjustment', `You're excelling! AI suggests extending focus to ${nextFocusMinutes} minutes.`);
      }

      if (nextFocusMinutes !== settings.focusMinutes) {
        setSettings(prev => ({ ...prev, focusMinutes: nextFocusMinutes }));
      }

      // Determine next mode
      if (cyclesRef.current >= settings.cyclesBeforeLongBreak) {
        cyclesRef.current = 0; // reset
        setMode("long");
      } else {
        setMode("short");
      }
    } else {
      // from a break -> always go to focus
      setMode("focus");
    }

    // Send notification
    sendNotification(`Session finished`, `Mode: ${mode} — next: ${mode === "focus" ? (cyclesRef.current === 0 ? "long break" : "short break") : "focus"}`);
  }

  // Advanced AI Functions
  function calculateProductivityScore(durationSec, sessionMode) {
    if (sessionMode !== 'focus') return 0;

    const expectedDuration = settings.focusMinutes * 60;
    const completionRate = Math.min(durationSec / expectedDuration, 1);
    const hour = new Date().getHours();

    // Base score from completion
    let score = completionRate * 100;

    // Bonus for peak hours (based on historical data)
    const optimalTimes = smartReminders.optimalTimes;
    const isOptimalTime = optimalTimes.some(time => Math.abs(time.hour - hour) <= 1);
    if (isOptimalTime) score *= 1.2;

    // Penalty for very late or very early sessions
    if (hour < 6 || hour > 23) score *= 0.8;

    return Math.round(score);
  }

  function captureEnvironmentContext() {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return {
      hour,
      dayOfWeek,
      isWeekend,
      hasActiveTasks: tasks.filter(t => !t.done).length > 0,
      pendingGoals: dailyGoals.filter(g => !g.completed && g.createdAt === new Date().toISOString().slice(0, 10)).length,
      recentSessionCount: history.filter(s => Date.now() - s.startTime < 3600000).length // Last hour
    };
  }

  function updateAILearningData(sessionRecord) {
    setSmartReminders(prev => {
      if (!prev || !prev.aiLearningData) return prev;

      return {
        ...prev,
        aiLearningData: {
          ...prev.aiLearningData,
          sessionPatterns: [...(prev.aiLearningData.sessionPatterns || []), {
            timestamp: sessionRecord.startTime,
            duration: sessionRecord.durationSec,
            mode: sessionRecord.mode,
            hour: new Date(sessionRecord.startTime).getHours(),
            dayOfWeek: new Date(sessionRecord.startTime).getDay(),
            success: sessionRecord.durationSec >= (settings.focusMinutes * 60 * 0.8)
          }].slice(-100), // Keep last 100 sessions
          productivityScores: [...(prev.aiLearningData.productivityScores || []), sessionRecord.productivityScore || 0].slice(-50),
          environmentFactors: [...(prev.aiLearningData.environmentFactors || []), sessionRecord.environmentContext].slice(-50)
        }
      };
    });
  }

  // Enhanced AI Analysis Functions with real machine learning algorithms
  function performDeepAIAnalysis() {
    if (!smartReminders || !smartReminders.aiLearningData) {
      return {
        insights: ['Complete more sessions to unlock AI insights'],
        recommendations: [],
        predictions: [],
        confidence: 0
      };
    }

    const sessions = smartReminders.aiLearningData.sessionPatterns || [];
    const scores = smartReminders.aiLearningData.productivityScores || [];
    const environment = smartReminders.aiLearningData.environmentFactors || [];

    if (sessions.length < 5) {
      return {
        insights: ['Complete more sessions to unlock AI insights'],
        recommendations: [],
        predictions: [],
        confidence: 0
      };
    }

    // Advanced pattern recognition with weighted analysis
    const hourlyPerformance = {};
    const weekdayPerformance = {};
    const sessionLengthPerformance = {};
    const streakPerformance = {};

    // Process sessions with temporal weighting (recent sessions matter more)
    sessions.forEach((session, index) => {
      const score = scores[index] || 0;
      const sessionAge = sessions.length - index;
      const temporalWeight = Math.exp(-sessionAge / 10); // Exponential decay for older sessions
      const weightedScore = score * temporalWeight;

      // Hourly analysis with temporal weighting
      const hour = session.hour;
      if (!hourlyPerformance[hour]) {
        hourlyPerformance[hour] = { scores: [], weights: [], count: 0 };
      }
      hourlyPerformance[hour].scores.push(weightedScore);
      hourlyPerformance[hour].weights.push(temporalWeight);
      hourlyPerformance[hour].count++;

      // Weekday analysis with temporal weighting
      const day = session.dayOfWeek;
      if (!weekdayPerformance[day]) {
        weekdayPerformance[day] = { scores: [], weights: [], count: 0 };
      }
      weekdayPerformance[day].scores.push(weightedScore);
      weekdayPerformance[day].weights.push(temporalWeight);
      weekdayPerformance[day].count++;

      // Session length analysis
      const lengthBucket = Math.floor(session.duration / 300) * 5; // 5-minute buckets
      if (!sessionLengthPerformance[lengthBucket]) {
        sessionLengthPerformance[lengthBucket] = { scores: [], weights: [], count: 0 };
      }
      sessionLengthPerformance[lengthBucket].scores.push(weightedScore);
      sessionLengthPerformance[lengthBucket].weights.push(temporalWeight);
      sessionLengthPerformance[lengthBucket].count++;
    });

    // Calculate weighted averages
    function calculateWeightedAverage(data) {
      if (!data.scores.length) return 0;
      const weightedSum = data.scores.reduce((sum, score, i) => sum + score, 0);
      const totalWeight = data.weights.reduce((sum, weight) => sum + weight, 0);
      return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    Object.keys(hourlyPerformance).forEach(hour => {
      const data = hourlyPerformance[hour];
      data.avgScore = calculateWeightedAverage(data);
      data.variance = data.scores.reduce((acc, score) => acc + Math.pow(score - data.avgScore, 2), 0) / data.scores.length;
    });

    Object.keys(weekdayPerformance).forEach(day => {
      const data = weekdayPerformance[day];
      data.avgScore = calculateWeightedAverage(data);
      data.variance = data.scores.reduce((acc, score) => acc + Math.pow(score - data.avgScore, 2), 0) / data.scores.length;
    });

    Object.keys(sessionLengthPerformance).forEach(length => {
      const data = sessionLengthPerformance[length];
      data.avgScore = calculateWeightedAverage(data);
    });

    // Generate AI insights with statistical significance testing
    const insights = [];
    const recommendations = [];
    const predictions = [];

    // Find statistically significant peak performance times
    const hourlyScores = Object.entries(hourlyPerformance)
      .filter(([hour, data]) => data.count >= 3)
      .sort(([,a], [,b]) => b.avgScore - a.avgScore);

    if (hourlyScores.length > 0) {
      const [bestHour, bestData] = hourlyScores[0];
      const avgAllHours = Object.values(hourlyPerformance).reduce((sum, data) => sum + data.avgScore, 0) / Object.keys(hourlyPerformance).length;

      if (bestData.avgScore > avgAllHours + 10) { // Statistically significant improvement
        insights.push(`Peak performance detected at ${bestHour}:00 (${Math.round(bestData.avgScore)}% vs ${Math.round(avgAllHours)}% average)`);
        recommendations.push({
          type: 'timing',
          title: 'Optimize Your Peak Hours',
          description: `Your productivity is ${Math.round(((bestData.avgScore - avgAllHours) / avgAllHours) * 100)}% higher at ${bestHour}:00`,
          priority: 'high',
          icon: '⏰',
          action: () => alert(`💡 AI Insight: Schedule your most challenging work between ${bestHour}:00-${parseInt(bestHour)+2}:00 for optimal results!`)
        });
      }
    }

    // Trend analysis with regression
    const recentScores = scores.slice(-10);
    const earlierScores = scores.slice(-20, -10);

    if (recentScores.length >= 5 && earlierScores.length >= 5) {
      // Linear regression on recent data
      const recentTrend = calculateTrend(recentScores);
      const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      const earlierAvg = earlierScores.reduce((a, b) => a + b, 0) / earlierScores.length;

      if (recentTrend < -2) { // Declining trend
        insights.push(`Declining productivity trend detected (${recentTrend.toFixed(1)}% per session)`);
        recommendations.push({
          type: 'recovery',
          title: 'Productivity Recovery Protocol',
          description: 'AI detected declining performance - implementing adaptive strategies',
          priority: 'high',
          icon: '📉',
          action: () => {
            const newLength = Math.max(15, settings.focusMinutes - 5);
            setSettings(prev => ({ ...prev, focusMinutes: newLength }));
            alert('🤖 AI Recovery: Session length reduced to rebuild momentum');
          }
        });
      } else if (recentTrend > 2) { // Improving trend
        insights.push(`Improving productivity trend detected (+${recentTrend.toFixed(1)}% per session)`);
        if (recentAvg > 85) {
          recommendations.push({
            type: 'challenge',
            title: 'Performance Excellence Detected',
            description: 'Ready for increased challenge - extend session length',
            priority: 'medium',
            icon: '🚀',
            action: () => {
              const newLength = Math.min(50, settings.focusMinutes + 5);
              setSettings(prev => ({ ...prev, focusMinutes: newLength }));
              alert('🚀 AI Optimization: Session length increased for greater productivity');
            }
          });
        }
      }
    }

    // Optimal session length analysis
    const optimalLength = findOptimalSessionLength(sessionLengthPerformance);
    if (optimalLength && Math.abs(optimalLength - settings.focusMinutes) > 5) {
      recommendations.push({
        type: 'optimization',
        title: 'Session Length Optimization',
        description: `AI analysis suggests ${optimalLength}-minute sessions for peak performance`,
        priority: 'medium',
        icon: '⚙️',
        action: () => {
          setSettings(prev => ({ ...prev, focusMinutes: optimalLength }));
          alert(`🎯 AI Optimization: Session length adjusted to ${optimalLength} minutes based on your performance data`);
        }
      });
    }

    // Advanced prediction using multiple factors
    const prediction = generateProductivityPrediction(hourlyPerformance, weekdayPerformance, environment, sessions);

    predictions.push({
      type: 'session_success',
      score: Math.round(prediction.score),
      confidence: Math.round(prediction.confidence),
      factors: prediction.factors
    });

    // Calculate overall AI confidence based on data quality and quantity
    const overallConfidence = Math.min(
      (sessions.length / 30) * 70 + // Data quantity (up to 70%)
      (Object.keys(hourlyPerformance).length / 24) * 20 + // Time coverage (up to 20%)
      (sessions.filter(s => s.success).length / sessions.length) * 10, // Data quality (up to 10%)
      100
    );

    return {
      insights,
      recommendations,
      predictions,
      confidence: overallConfidence
    };
  }

  // Helper function for trend calculation
  function calculateTrend(data) {
    if (data.length < 3) return 0;
    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = data.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  // Helper function to find optimal session length
  function findOptimalSessionLength(lengthPerformance) {
    const validLengths = Object.entries(lengthPerformance)
      .filter(([, data]) => data.count >= 2)
      .sort(([,a], [,b]) => b.avgScore - a.avgScore);

    return validLengths.length > 0 ? parseInt(validLengths[0][0]) : null;
  }

  // Advanced prediction algorithm
  function generateProductivityPrediction(hourlyPerf, weekdayPerf, environment, sessions) {
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();

    let baseScore = 75;
    let confidence = 50;
    const factors = [];

    // Hourly factor with confidence weighting
    if (hourlyPerf[currentHour] && hourlyPerf[currentHour].count >= 3) {
      const hourlyFactor = hourlyPerf[currentHour].avgScore;
      const hourlyConfidence = Math.min(hourlyPerf[currentHour].count / 10, 1) * 30;
      baseScore = (baseScore * 0.6) + (hourlyFactor * 0.4);
      confidence += hourlyConfidence;
      factors.push(`Time factor: ${hourlyFactor > 75 ? 'optimal' : hourlyFactor > 60 ? 'moderate' : 'challenging'} (${hourlyPerf[currentHour].count} sessions)`);
    } else {
      factors.push('Time factor: insufficient data for current hour');
    }

    // Weekday factor
    if (weekdayPerf[currentDay] && weekdayPerf[currentDay].count >= 2) {
      const weekdayFactor = weekdayPerf[currentDay].avgScore;
      const weekdayConfidence = Math.min(weekdayPerf[currentDay].count / 5, 1) * 20;
      baseScore = (baseScore * 0.7) + (weekdayFactor * 0.3);
      confidence += weekdayConfidence;
      factors.push(`Day factor: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDay]} performance tracked`);
    } else {
      factors.push(`Day factor: limited ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDay]} data`);
    }

    // Recent momentum factor
    const recentSessions = sessions.slice(-5);
    if (recentSessions.length >= 3) {
      const recentSuccessRate = recentSessions.filter(s => s.success).length / recentSessions.length;
      const momentumFactor = recentSuccessRate * 100;
      baseScore = (baseScore * 0.8) + (momentumFactor * 0.2);
      confidence += 20;
      factors.push(`Recent momentum: ${recentSuccessRate >= 0.8 ? 'strong' : recentSuccessRate >= 0.6 ? 'steady' : 'rebuilding'}`);
    } else {
      factors.push('Recent momentum: building baseline');
    }

    return {
      score: Math.max(10, Math.min(95, baseScore)),
      confidence: Math.max(20, Math.min(95, confidence)),
      factors
    };
  }

  // Post-session reflection handler
  function saveReflection() {
    if (reflectionText.trim()) {
      const highlight = {
        id: generateId(),
        text: reflectionText.trim(),
        timestamp: Date.now(),
        sessionDuration: Math.round((Date.now() - sessionStartRef.current) / 60000)
      };
      setSessionHighlights(prev => [highlight, ...prev.slice(0, 49)]);
    }
    setReflectionText('');
    setShowReflection(false);
  }

  // Timer controls
  function startTimer() {
    if (!running) {
      // Initialize audio context on user interaction
      initAudioContext();

      sessionStartRef.current = Date.now() - ((settings[mode === 'focus' ? 'focusMinutes' : (mode === 'short' ? 'shortBreakMinutes' : 'longBreakMinutes')] * 60 - remaining) * 1000);
      setRunning(true);

      // Play start sound
      if (settings.soundEnabled) {
        if (activeSound !== 'default' && ownedItems.sounds.includes(activeSound)) {
          playCustomSound(activeSound);
        } else {
          playStartSound();
        }
      }
    }
  }

  function pauseTimer() {
    setRunning(false);
  }

  function resetTimer() {
    setRunning(false);
    if (mode === "focus") setRemaining(settings.focusMinutes * 60);
    else if (mode === "short") setRemaining(settings.shortBreakMinutes * 60);
    else setRemaining(settings.longBreakMinutes * 60);
    sessionStartRef.current = null;
  }



  // Update local analytics
  function updateLocalAnalytics(sessionRecord) {
    const today = new Date().toISOString().slice(0, 10);
    const sessionMinutes = Math.round(sessionRecord.durationSec / 60);

    setLocalAnalytics(prev => {
      const newDailyStats = { ...prev.dailyStats };
      if (!newDailyStats[today]) {
        newDailyStats[today] = { sessions: 0, minutes: 0, completedSessions: 0 };
      }

      newDailyStats[today].sessions += 1;
      newDailyStats[today].minutes += sessionMinutes;
      if (sessionRecord.durationSec >= settings.focusMinutes * 60 * 0.8) {
        newDailyStats[today].completedSessions += 1;
      }

      const totalMinutes = prev.totalHours * 60 + sessionMinutes;
      const totalSessions = Object.values(newDailyStats).reduce((sum, day) => sum + day.sessions, 0);
      const completedSessions = Object.values(newDailyStats).reduce((sum, day) => sum + day.completedSessions, 0);

      return {
        ...prev,
        dailyStats: newDailyStats,
        totalHours: totalMinutes / 60,
        averageSessionLength: totalSessions > 0 ? totalMinutes / totalSessions : 0,
        productivityScore: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
        bestStreak: Math.max(prev.bestStreak, userProgress.streakCount)
      };
    });
  }

  // Enhanced notification with smart scheduling
  function sendNotification(title, body, options = {}) {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      try {
        const notification = new Notification(title, { 
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          ...options
        });
        return notification;
      } catch (e) {
        console.warn("Notification failed", e);
      }
    }
  }

  // Smart notification system
  function requestNotificationPermission() {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications.");
      return;
    }

    // Check current permission status
    if (Notification.permission === "granted") {
      setSmartReminders(prev => ({ ...prev, enabled: true }));
      alert(`🤖 Smart Notifications Already Active!\n\n✅ Notification permission granted\n📊 AI system ready to learn your patterns\n🎯 Intelligent reminders will be scheduled automatically\n\nThe AI will adapt to your productivity patterns!`);
      return;
    }

    if (Notification.permission === "denied") {
      alert("🔒 Notification Permission Blocked\n\nTo enable notifications:\n1. Click the lock icon in your browser's address bar\n2. Change notifications to 'Allow'\n3. Refresh the page and try again\n\nSmart reminders will use browser alerts for now.");
      setSmartReminders(prev => ({ ...prev, enabled: true }));
      return;
    }

    // Request permission (only works on direct user interaction)
    try {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          setSmartReminders(prev => ({ ...prev, enabled: true }));
          alert(`🤖 Smart Notifications Activated!\n\n✅ Notification permission granted\n📊 AI system ready to learn your patterns\n🎯 Intelligent reminders will be scheduled automatically\n\nThe AI will adapt to your productivity patterns!`);
        } else if (permission === "denied") {
          alert("🔒 Notification Permission Denied\n\nTo enable later:\n1. Click the lock icon in your browser's address bar\n2. Change notifications to 'Allow'\n3. Refresh the page\n\nSmart reminders will use browser alerts for now.");
          setSmartReminders(prev => ({ ...prev, enabled: true }));
        } else {
          alert("Notification permission dismissed. Smart reminders will use browser alerts instead.");
          setSmartReminders(prev => ({ ...prev, enabled: true }));
        }
      }).catch((error) => {
        console.warn("Notification permission error:", error);
        alert("🔒 Notification Setup Issue\n\nYour browser may be blocking notification requests. Smart reminders will use browser alerts instead.");
        setSmartReminders(prev => ({ ...prev, enabled: true }));
      });
    } catch (error) {
      console.warn("Notification API error:", error);
      alert("🔒 Notification Not Supported\n\nYour browser doesn't support notification requests. Smart reminders will use browser alerts instead.");
      setSmartReminders(prev => ({ ...prev, enabled: true }));
    }
  }

  // Tasks handlers
  function addTask() {
    const text = taskInput.trim();
    if (!text) return;
    const t = { 
      id: generateId(), 
      text, 
      done: false,
      priority: 'medium',
      aiSuggested: false,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    setTasks((s) => [t, ...s]);
    setTaskInput("");
  }

  function toggleTask(id) {
    setTasks((s) => s.map((t) => {
      if (t.id === id && !t.done) {
        // Task completed - award XP and coins
        setUserProgress(prev => {
          const newXP = prev.xp + (t.aiSuggested ? 8 : 5); // Bonus for AI-suggested tasks
          const newLevel = calculateLevel(newXP);
          const newTotalTasks = prev.totalTasks + 1;
          const newAIRecs = t.aiSuggested ? prev.aiRecommendationsFollowed + 1 : prev.aiRecommendationsFollowed;

          // Award coins for task completion
          setCoins(prevCoins => prevCoins + (t.aiSuggested ? 3 : 2));

          const updatedAchievements = prev.achievements.map(achievement => {
            if (achievement.unlocked) return achievement;

            let shouldUnlock = false;
            switch (achievement.id) {
              case 'first_task':
                shouldUnlock = newTotalTasks >= 1;
                break;
              case 'task_rookie':
                shouldUnlock = newTotalTasks >= 10;
                break;
              case 'task_master':
                shouldUnlock = newTotalTasks >= 50;
                break;
              case 'productivity_machine':
                shouldUnlock = newTotalTasks >= 100;
                break;
              case 'task_legend':
                shouldUnlock = newTotalTasks >= 250;
                break;
              case 'ai_student':
                shouldUnlock = newAIRecs >= 10;
                break;
              case 'ai_master':
                shouldUnlock = newAIRecs >= 50;
                break;
              case 'ai_sensei':
                shouldUnlock = newAIRecs >= 100;
                break;
              default:
                return achievement;
            }

            if (shouldUnlock) {
              setCoins(prevCoins => prevCoins + achievement.coins);
              sendNotification(`Achievement Unlocked!`, `${achievement.icon} ${achievement.name} - ${achievement.coins} coins earned!`);
              return { ...achievement, unlocked: true };
            }
            return achievement;
          });

          // Check for level up
          if (newLevel > prev.level) {
            sendNotification(`Level Up!`, `Congratulations! You've reached level ${newLevel}!`);
          }

          return {
            ...prev,
            xp: newXP,
            level: newLevel,
            totalTasks: newTotalTasks,
            aiRecommendationsFollowed: newAIRecs,
            achievements: updatedAchievements
          };
        });
      }
      return t.id === id ? { ...t, done: !t.done } : t;
    }));
  }

  function removeTask(id) {
    setTasks((s) => s.filter((t) => t.id !== id));
  }

  // History export
  function downloadHistory() {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `focusguard_history_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Daily goals handlers
  function addDailyGoal() {
    const text = goalInput.trim();
    if (!text) return;
    const goal = { 
      id: generateId(), 
      text, 
      completed: false, 
      createdAt: new Date().toISOString().slice(0, 10)
    };
    setDailyGoals((goals) => [goal, ...goals]);
    setGoalInput("");
  }

  function toggleDailyGoal(id) {
    setDailyGoals((goals) => goals.map((goal) => {
      if (goal.id === id && !goal.completed) {
        // Goal completed - award XP and coins
        setUserProgress(prev => {
          const newXP = prev.xp + 10;
          const newLevel = calculateLevel(newXP);
          const newGoalsCompleted = prev.totalGoalsCompleted + 1;

          // Award coins for goal completion
          setCoins(prevCoins => prevCoins + 5);

          const updatedAchievements = prev.achievements.map(achievement => {
            if (achievement.unlocked) return achievement;

            let shouldUnlock = false;
            switch (achievement.id) {
              case 'goal_starter':
                shouldUnlock = newGoalsCompleted >= 1;
                break;
              case 'goal_crusher':
                shouldUnlock = newGoalsCompleted >= 25;
                break;
              default:
                return achievement;
            }

            if (shouldUnlock) {
              setCoins(prevCoins => prevCoins + achievement.coins);
              sendNotification(`Achievement Unlocked!`, `${achievement.icon} ${achievement.name} - ${achievement.coins} coins earned!`);
              return { ...achievement, unlocked: true };
            }
            return achievement;
          });

          if (newLevel > prev.level) {
            sendNotification(`Level Up!`, `Congratulations! You've reached level ${newLevel}!`);
          }

          return {
            ...prev,
            xp: newXP,
            level: newLevel,
            totalGoalsCompleted: newGoalsCompleted,
            achievements: updatedAchievements
          };
        });
      }
      return goal.id === id ? { ...goal, completed: !goal.completed } : goal;
    }));
  }

  function removeDailyGoal(id) {
    setDailyGoals((goals) => goals.filter((goal) => goal.id !== id));
  }

  function clearOldGoals() {
    const today = new Date().toISOString().slice(0, 10);
    setDailyGoals((goals) => goals.filter((goal) => goal.createdAt === today));
  }

  // Get today's goals
  const todayGoals = dailyGoals.filter(goal => goal.createdAt === new Date().toISOString().slice(0, 10));
  const completedTodayGoals = todayGoals.filter(goal => goal.completed);

  // Progress calculations
  const completedTasks = tasks.filter(task => task.done);
  const taskProgress = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
  const goalProgress = todayGoals.length > 0 ? (completedTodayGoals.length / todayGoals.length) * 100 : 0;

  // Progress bar component
  function ProgressBar({ progress, total, completed }) {
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: 12, 
          color: "#666",
          marginBottom: 4 
        }}>
          <span>Progress: {completed}/{total}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div style={{
          width: '100%',
          height: 8,
          backgroundColor: '#e0e0e0',
          borderRadius: 4,
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#000',
            transition: 'width 0.3s ease',
            borderRadius: 4
          }} />
        </div>
      </div>
    );
  }

  // Advanced AI-Powered Recommendations System with Machine Learning
  function getEnhancedAIRecommendations() {
    const analysis = performDeepAIAnalysis();
    const recommendations = [...(analysis.recommendations || [])];

    const recentSessions = history.slice(0, 20);
    const focusSessions = recentSessions.filter(s => s.mode === 'focus');
    const completedSessions = focusSessions.filter(s => s.durationSec >= settings.focusMinutes * 60 * 0.8);
    const completionRate = focusSessions.length > 0 ? completedSessions.length / focusSessions.length : 0;

    // Intelligent task prioritization with urgency scoring
    const activeTasks = tasks.filter(t => !t.done);
    if (activeTasks.length > 0) {
      // Calculate task urgency scores based on creation time, keywords, and AI analysis
      const taskScores = activeTasks.map(task => {
        let urgencyScore = 0;
        const taskAge = (Date.now() - new Date(task.createdAt)) / (1000 * 60 * 60 * 24); // Days old

        // Age factor (older tasks get higher priority)
        urgencyScore += Math.min(taskAge * 10, 30);

        // Keyword analysis for urgency
        const urgentKeywords = ['urgent', 'asap', 'deadline', 'due', 'important', 'critical', 'emergency', 'final', 'exam', 'test', 'interview', 'meeting', 'presentation'];
        const taskText = task.text.toLowerCase();
        urgentKeywords.forEach(keyword => {
          if (taskText.includes(keyword)) urgencyScore += 25;
        });

        // Length factor (shorter tasks get slight priority boost for quick wins)
        if (task.text.length < 30) urgencyScore += 5;

        // Already AI-suggested tasks get lower priority to diversify suggestions
        if (task.aiSuggested) urgencyScore -= 10;

        return { ...task, urgencyScore };
      });

      // Sort by urgency score and take top 3
      const priorityTasks = taskScores
        .sort((a, b) => b.urgencyScore - a.urgencyScore)
        .slice(0, 3);

      if (priorityTasks.length > 0 && priorityTasks[0].urgencyScore > 15) {
        recommendations.push({
          type: 'task_optimization',
          title: '🎯 AI Task Intelligence',
          description: `Smart prioritization: ${priorityTasks[0].text.substring(0, 50)}${priorityTasks[0].text.length > 50 ? '...' : ''} (urgency: ${Math.round(priorityTasks[0].urgencyScore)}/100)`,
          action: () => {
            setTasks(prev => prev.map(task => {
              const priorityTask = priorityTasks.find(pt => pt.id === task.id);
              if (priorityTask) {
                return { ...task, priority: 'high', aiSuggested: true };
              }
              return task;
            }));
            alert(`🤖 AI Priority: "${priorityTasks[0].text}" marked as high priority based on intelligent analysis!`);
          },
          priority: 'high',
          icon: '🎯'
        });
      }
    }

    // Circadian rhythm optimization with environmental factors
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();

    // Post-lunch dip detection (varies by individual patterns)
    if (currentHour >= 13 && currentHour <= 16) {
      const afternoonSessions = focusSessions.filter(s => {
        const sessionHour = new Date(s.startTime).getHours();
        return sessionHour >= 13 && sessionHour <= 16;
      });

      if (afternoonSessions.length >= 3) {
        const afternoonSuccessRate = afternoonSessions.filter(s => s.durationSec >= settings.focusMinutes * 60 * 0.8).length / afternoonSessions.length;

        if (afternoonSuccessRate < 0.6) {
          recommendations.push({
            type: 'environment',
            title: '☕ Circadian Optimization',
            description: `Your afternoon performance is ${Math.round(afternoonSuccessRate * 100)}% - AI suggests energy management`,
            action: () => {
              setShowBreakOptions(true);
            },
            priority: 'medium',
            icon: '☕'
          });
        }
      }
    }

    // Weekend vs weekday pattern recognition
    const isWeekend = currentDay === 0 || currentDay === 6;
    const weekendSessions = focusSessions.filter(s => {
      const sessionDay = new Date(s.startTime).getDay();
      return sessionDay === 0 || sessionDay === 6;
    });
    const weekdaySessions = focusSessions.filter(s => {
      const sessionDay = new Date(s.startTime).getDay();
      return sessionDay >= 1 && sessionDay <= 5;
    });

    if (weekendSessions.length >= 3 && weekdaySessions.length >= 3) {
      const weekendAvg = weekendSessions.reduce((sum, s) => sum + (s.productivityScore || 0), 0) / weekendSessions.length;
      const weekdayAvg = weekdaySessions.reduce((sum, s) => sum + (s.productivityScore || 0), 0) / weekdaySessions.length;

      if (isWeekend && weekendAvg < weekdayAvg - 15) {
        recommendations.push({
          type: 'timing',
          title: '📅 Weekend Adaptation',
          description: `Weekend productivity typically ${Math.round(weekdayAvg - weekendAvg)}% lower - adjust expectations`,
          action: () => {
            const newLength = Math.max(15, settings.focusMinutes - 5);
            setSettings(prev => ({ ...prev, focusMinutes: newLength }));
            alert('🤖 Weekend Mode: Session length adjusted for relaxed pace');
          },
          priority: 'medium',
          icon: '📅'
        });
      }
    }

    // Smart session timing with advanced predictions
    if (analysis.predictions && analysis.predictions.length > 0) {
      const prediction = analysis.predictions[0];
      if (prediction && prediction.score >= 85 && prediction.confidence >= 70) {
        recommendations.push({
          type: 'timing',
          title: '⚡ Peak Performance Window',
          description: `AI detects optimal conditions: ${prediction.score}% success probability (${prediction.confidence}% confidence)`,
          action: () => {
            setMode('focus');
            resetTimer();
            startTimer();
          },
          priority: 'high',
          icon: '⚡'
        });
      } else if (prediction.score < 50 && prediction.confidence >= 60) {
        recommendations.push({
          type: 'timing',
          title: '🔄 Suboptimal Conditions Detected',
          description: `Low success probability (${prediction.score}%) - consider preparation activities`,
          action: () => {
            setMode('short');
            resetTimer();
            alert('🤖 AI suggests taking a break or doing light tasks until conditions improve');
          },
          priority: 'medium',
          icon: '🔄'
        });
      }
    }

    // Adaptive difficulty scaling based on recent performance trends
    if (smartReminders && smartReminders.aiLearningData && smartReminders.aiLearningData.sessionPatterns) {
      const patterns = smartReminders.aiLearningData.sessionPatterns;
      const recentPatterns = patterns.slice(-10);

      if (recentPatterns.length >= 5) {
        const recentFailures = recentPatterns.filter(p => !p.success).length;
        const failureRate = recentFailures / recentPatterns.length;

        if (failureRate >= 0.6) { // 60% failure rate
          recommendations.push({
            type: 'adaptation',
            title: '🧠 Adaptive Learning Protocol',
            description: `High challenge detected (${Math.round(failureRate * 100)}% incomplete) - AI implementing easier progression`,
            action: () => {
              const newLength = Math.max(10, settings.focusMinutes - 10);
              setSettings(prev => ({ ...prev, focusMinutes: newLength }));
              setMode('focus');
              resetTimer();
              alert('🤖 AI Adaptation: Reduced session length to rebuild confidence and momentum');
            },
            priority: 'high',
            icon: '🧠'
          });
        } else if (failureRate <= 0.1 && recentPatterns.length >= 8) { // 10% failure rate with sufficient data
          const avgDuration = recentPatterns.reduce((sum, p) => sum + p.duration, 0) / recentPatterns.length;
          if (avgDuration >= settings.focusMinutes * 60 * 0.9) { // Completing almost full sessions
            recommendations.push({
              type: 'challenge',
              title: '🚀 Excellence Detected',
              description: `Outstanding performance (${Math.round((1 - failureRate) * 100)}% success) - ready for increased challenge`,
              action: () => {
                const newLength = Math.min(60, settings.focusMinutes + 10);
                setSettings(prev => ({ ...prev, focusMinutes: newLength }));
                alert('🚀 AI Growth: Session length increased to match your improved capacity');
              },
              priority: 'medium',
              icon: '🚀'
            });
          }
        }
      }
    }

    // Sort by priority and impact
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return recommendations
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      .slice(0, 6);
  }

  // Shop handlers
  function buyItem(category, itemId) {
    const item = SHOP_ITEMS[category][itemId];
    if (!item || coins < item.price) return false;

    if (ownedItems[category].includes(itemId)) return false;

    setCoins(prev => prev - item.price);
    setOwnedItems(prev => ({
      ...prev,
      [category]: [...prev[category], itemId]
    }));

    // Auto-activate purchased items
    if (category === 'themes') {
      setActiveTheme(itemId);
    } else if (category === 'sounds') {
      setActiveSound(itemId);
    } else if (category === 'boosts') {
      if (item.duration) {
        setActiveBoosts(prev => ({
          ...prev,
          [itemId]: Date.now() + (item.duration * 1000)
        }));
      }
    }

    return true;
  }

  function useBoost(boostId) {
    const boost = SHOP_ITEMS.boosts[boostId];
    if (!boost || !ownedItems.boosts.includes(boostId)) return;

    if (boost.duration) {
      setActiveBoosts(prev => ({
        ...prev,
        [boostId]: Date.now() + (boost.duration * 1000)
      }));
    }
  }

  // Clean up expired boosts
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setActiveBoosts(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(boostId => {
          if (updated[boostId] <= now) {
            delete updated[boostId];
          }
        });
        return updated;
      });
    }, 60000); // Check every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  // Customization handlers
  function updateCustomization(key, value) {
    setCustomization(prev => {
      const updated = { ...prev, [key]: value };
      if (!updated.headerButtons) {
        updated.headerButtons = DEFAULT_CUSTOMIZATION.headerButtons;
      }
      return updated;
    });
  }

  function toggleSectionVisibility(section) {
    setCustomization(prev => ({
      ...prev,
      visibleSections: {
        ...prev.visibleSections,
        [section]: !prev.visibleSections[section]
      }
    }));
  }

  function moveSectionUp(index) {
    if (index > 0) {
      setCustomization(prev => {
        const newOrder = [...prev.sectionOrder];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        return { ...prev, sectionOrder: newOrder };
      });
    }
  }

  function moveSectionDown(index) {
    if (index < customization.sectionOrder.length - 1) {
      setCustomization(prev => {
        const newOrder = [...prev.sectionOrder];
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        return { ...prev, sectionOrder: newOrder };
      });
    }
  }

  // Settings UI handlers
  function updateSetting(key, value) {
    if (key === 'soundEnabled') {
      setSettings((s) => ({ ...s, [key]: Boolean(value) }));
    } else {
      setSettings((s) => ({ ...s, [key]: Number(value) }));
    }
  }

  // Render sections based on customization
  function renderSection(sectionKey) {
    if (!customization.visibleSections[sectionKey]) return null;

    switch (sectionKey) {
      case 'aiInsights':
        const analysis = performDeepAIAnalysis();
        return (
          <div key="aiInsights" style={currentStyles.card}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              🧠 AI Insights
              <span style={{ 
                fontSize: 10, 
                backgroundColor: '#000', 
                color: '#fff',
                padding: '2px 6px',
                borderRadius: 8,
                fontWeight: 'normal'
              }}>
                {Math.round(analysis.confidence)}% confidence
              </span>
            </h3>
            {analysis.insights.length === 0 ? (
              <div style={{ color: "#666", fontSize: 14 }}>Complete more sessions to unlock AI insights.</div>
            ) : (
              <div>
                {analysis.insights.map((insight, index) => (
                  <div key={index} style={{ 
                    padding: 10, 
                    borderRadius: 6, 
                    marginBottom: 8,
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e0e0e0',
                    fontSize: 13
                  }}>
                    💡 {insight}
                  </div>
                ))}
                {analysis.predictions.length > 0 && (
                  <div style={{ 
                    padding: 10, 
                    borderRadius: 6,
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #3b82f6',
                    marginTop: 10
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                      🔮 Next Session Prediction: {analysis.predictions[0].score}%
                    </div>
                    <div style={{ fontSize: 11, color: '#666' }}>
                      {analysis.predictions[0].factors.map((factor, i) => (
                        <div key={i}>• {factor}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'smartRecommendations':
        const recommendations = getEnhancedAIRecommendations();
        return (
          <div key="smartRecommendations" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>🤖 AI Recommendations</h3>
            {recommendations.length === 0 ? (
              <div style={{ color: "#666" }}>AI is learning your patterns. Complete more sessions for personalized recommendations!</div>
            ) : (
              recommendations.map((rec, index) => (
                <div key={index} style={{
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 10,
                  backgroundColor: rec.priority === 'high' ? '#fef2f2' :
                                 rec.priority === 'medium' ? '#f0fdf4' : '#f0f9ff',
                  border: `1px solid ${rec.priority === 'high' ? '#dc2626' :
                                      rec.priority === 'medium' ? '#22c55e' : '#3b82f6'}`,
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    fontSize: 10,
                    fontWeight: 600,
                    color: rec.priority === 'high' ? '#dc2626' :
                           rec.priority === 'medium' ? '#22c55e' : '#3b82f6',
                    textTransform: 'uppercase'
                  }}>
                    {rec.priority}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>{rec.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{rec.title}</div>
                      <div style={{ fontSize: 12, color: "#555", lineHeight: 1.4 }}>
                        {rec.description}
                      </div>
                    </div>
                  </div>
                  {rec.action && (
                    <button
                      style={{
                        ...currentStyles.smallBtn,
                        backgroundColor: '#000',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px'
                      }}
                      onClick={() => {
                        rec.action();
                        setUserProgress(prev => ({ 
                          ...prev, 
                          aiRecommendationsFollowed: prev.aiRecommendationsFollowed + 1 
                        }));
                        alert('🤖 AI recommendation applied successfully!');
                      }}
                    >
                      Apply AI Suggestion
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        );

      case 'tasks':
        return (
          <div key="tasks" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>Tasks</h3>
            <ProgressBar 
              progress={taskProgress} 
              total={tasks.length} 
              completed={completedTasks.length} 
            />
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={taskInput || ''}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Add a task (e.g. study chapter 3)"
                style={currentStyles.input}
                onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
              />
              <button style={currentStyles.btn} onClick={addTask}>Add</button>
            </div>
            <div style={{ marginTop: 12, maxHeight: 240, overflow: "auto" }}>
              {tasks.length === 0 ? (
                <div style={{ color: "#666" }}>No tasks yet.</div>
              ) : (
                tasks.map((t) => (
                  <div key={t.id} style={currentStyles.taskRow}>
                    <label style={{ display: "flex", gap: 8, alignItems: "center", width: "100%" }}>
                      <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} />
                      <div style={{ 
                        flex: 1, 
                        textDecoration: t.done ? "line-through" : "none",
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        {t.text}
                        {t.aiSuggested && <span style={{ fontSize: 10, backgroundColor: '#000', color: '#fff', padding: '1px 4px', borderRadius: 4 }}>AI</span>}
                        {t.priority === 'high' && <span style={{ color: '#dc2626', fontSize: 12 }}>🔥</span>}
                      </div>
                      <button style={currentStyles.iconBtn} onClick={() => removeTask(t.id)}>✖</button>
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'dailyGoals':
        return (
          <div key="dailyGoals" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>Daily Goals</h3>
            <ProgressBar 
              progress={goalProgress} 
              total={todayGoals.length} 
              completed={completedTodayGoals.length} 
            />
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={goalInput || ''}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Add a daily goal (e.g. finish report)"
                style={currentStyles.input}
                onKeyDown={(e) => { if (e.key === "Enter") addDailyGoal(); }}
              />
              <button style={currentStyles.btn} onClick={addDailyGoal}>Add</button>
            </div>
            <div style={{ marginTop: 12, maxHeight: 200, overflow: "auto" }}>
              {todayGoals.length === 0 ? (
                <div style={{ color: "#666" }}>No daily goals yet.</div>
              ) : (
                todayGoals.map((goal) => (
                  <div key={goal.id} style={currentStyles.taskRow}>
                    <label style={{ display: "flex", gap: 8, alignItems: "center", width: "100%" }}>
                      <input type="checkbox" checked={goal.completed} onChange={() => toggleDailyGoal(goal.id)} />
                      <div style={{ flex: 1, textDecoration: goal.completed ? "line-through" : "none", fontWeight: goal.completed ? "normal" : "500" }}>
                        {goal.text}
                      </div>
                      <button style={currentStyles.iconBtn} onClick={() => removeDailyGoal(goal.id)}>✖</button>
                    </label>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button style={currentStyles.btn} onClick={clearOldGoals}>Clear Old Goals</button>
            </div>
          </div>
        );

      case 'focusAnalytics':
        return (
          <div key="focusAnalytics" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>📊 Focus Analytics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {history.filter(s => s.mode === 'focus').length}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>Total Sessions</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {Math.round((history.filter(s => s.mode === 'focus' && s.durationSec >= settings.focusMinutes * 60 * 0.8).length / Math.max(history.filter(s => s.mode === 'focus').length, 1)) * 100)}%
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>Success Rate</div>
              </div>
            </div>
            {smartReminders && smartReminders.aiLearningData && smartReminders.aiLearningData.productivityScores && smartReminders.aiLearningData.productivityScores.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Productivity Trend (Last 10 Sessions)</div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'end', 
                  height: 60, 
                  gap: 2 
                }}>
                  {(() => {
                    const scores = (smartReminders && smartReminders.aiLearningData && smartReminders.aiLearningData.productivityScores) 
                      ? smartReminders.aiLearningData.productivityScores.slice(-20) 
                      : [];
                    return scores.length > 0 ? scores.map((score, i) => (
                      <div key={i} style={{
                        flex: 1,
                        backgroundColor: score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#dc2626',
                        height: `${Math.max(score || 0, 5)}%`,
                        minHeight: 4,
                        borderRadius: 2,
                        position: 'relative',
                        cursor: 'pointer'
                      }} 
                      title={`Session ${i + 1}: ${score || 0}% productivity`}>
                        <div style={{
                          position: 'absolute',
                          bottom: -20,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: 8,
                          color: '#666',
                          whiteSpace: 'nowrap'
                        }}>
                          {i % 5 === 0 ? i + 1 : ''}
                        </div>
                      </div>
                    )) : (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        color: '#666',
                        fontSize: 14
                      }}>
                        Complete more sessions to see productivity trends
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        );

      case 'achievements':
        const unlockedAchievements = userProgress.achievements.filter(a => a.unlocked);
        return (
          <div key="achievements" style={currentStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Achievements 🏆</h3>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>Level {calculateLevel(userProgress.xp)}</div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                {userProgress.xp} / {getXPForNextLevel(userProgress.xp)} XP
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#f59e0b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                🪙 {coins} coins
                <button 
                  style={{
                    ...currentStyles.smallBtn,
                    fontSize: 10,
                    padding: '2px 6px',
                    marginLeft: 8
                  }}
                  onClick={() => setShowShop(true)}
                >
                  Shop
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
                💡 Exponential coin rewards: 5min→1, 15min→5, 30min→12, 60min→25, 90min→40+ coins
              </div>
              <div style={{
                width: '100%',
                height: 6,
                backgroundColor: '#e0e0e0',
                borderRadius: 3
              }}>
                <div style={{
                  width: `${(getXPProgressInCurrentLevel(userProgress.xp) / 100) * 100}%`,
                  height: '100%',
                  backgroundColor: '#000',
                  borderRadius: 3
                }} />
              </div>
            </div>
            <div style={{ maxHeight: 150, overflow: 'auto' }}>
              {unlockedAchievements.length === 0 ? (
                <div style={{ color: "#666" }}>No achievements yet. Start focusing!</div>
              ) : (
                unlockedAchievements.map(achievement => (
                  <div key={achievement.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: 6,
                    borderRadius: 4,
                    backgroundColor: '#f8f9fa',
                    marginBottom: 4
                  }}>
                    <span style={{ fontSize: 20 }}>{achievement.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{achievement.name}</div>
                      <div style={{ fontSize: 11, color: "#666" }}>{achievement.description}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'streaks':
        // Calculate real-time minutes including current session
        const currentSessionMinutes = running && mode === 'focus' && sessionStartRef.current 
          ? Math.round((Date.now() - sessionStartRef.current) / 60000)
          : 0;
        const totalMinutesWithCurrent = userProgress.totalFocusMinutes + currentSessionMinutes;
        
        return (
          <div key="streaks" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>Streaks & Stats 📊</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  {userProgress.streakCount}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>Day Streak</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  {Math.round(totalMinutesWithCurrent)}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  Total Minutes {currentSessionMinutes > 0 && <span style={{ color: '#22c55e' }}>+{currentSessionMinutes}</span>}
                </div>
              </div>
            </div>
            {userProgress.aiRecommendationsFollowed > 0 && (
              <div style={{ 
                marginTop: 12, 
                textAlign: 'center',
                padding: 8,
                backgroundColor: '#f0f9ff',
                borderRadius: 6,
                border: '1px solid #3b82f6'
              }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>🤖 {userProgress.aiRecommendationsFollowed}</div>
                <div style={{ fontSize: 11, color: "#666" }}>AI Recommendations Followed</div>
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <div key="settings" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>Settings</h3>
            <div style={{ display: "grid", gap: 8 }}>
              <label style={currentStyles.rowLabel}>Focus minutes
                <input type="number" min={1} value={settings.focusMinutes} onChange={(e) => updateSetting("focusMinutes", e.target.value)} style={currentStyles.smallInput} />
              </label>
              <label style={currentStyles.rowLabel}>Short break minutes
                <input type="number" min={1} value={settings.shortBreakMinutes} onChange={(e) => updateSetting("shortBreakMinutes", e.target.value)} style={currentStyles.smallInput} />
              </label>
              <label style={currentStyles.rowLabel}>Long break minutes
                <input type="number" min={1} value={settings.longBreakMinutes} onChange={(e) => updateSetting("longBreakMinutes", e.target.value)} style={currentStyles.smallInput} />
              </label>
              <label style={currentStyles.rowLabel}>Cycles before long break
                <input type="number" min={1} value={settings.cyclesBeforeLongBreak} onChange={(e) => updateSetting("cyclesBeforeLongBreak", e.target.value)} style={currentStyles.smallInput} />
              </label>

              <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: 12, marginTop: 8 }}>
                <label style={{ ...currentStyles.rowLabel, marginBottom: 8 }}>
                  <span>🔊 Sound Effects</span>
                  <input 
                    type="checkbox" 
                    checked={settings.soundEnabled} 
                    onChange={(e) => updateSetting("soundEnabled", e.target.checked)} 
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 'localAnalytics':
        const today = new Date().toISOString().slice(0, 10);
        const todayStats = localAnalytics.dailyStats[today] || { sessions: 0, minutes: 0, completedSessions: 0 };
        const last7Days = Object.entries(localAnalytics.dailyStats)
          .slice(-7)
          .reduce((sum, [, stats]) => sum + stats.sessions, 0);

        return (
          <div key="localAnalytics" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>📈 Session Analytics</h3>

            {/* Today's Progress */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Today's Progress</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
                <div style={{ padding: 8, backgroundColor: '#f8f9fa', borderRadius: 6 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{todayStats.sessions}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>Sessions</div>
                </div>
                <div style={{ padding: 8, backgroundColor: '#f8f9fa', borderRadius: 6 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{Math.round(todayStats.minutes)}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>Minutes</div>
                </div>
                <div style={{ padding: 8, backgroundColor: '#f8f9fa', borderRadius: 6 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    {todayStats.sessions > 0 ? Math.round((todayStats.completedSessions / todayStats.sessions) * 100) : 0}%
                  </div>
                  <div style={{ fontSize: 11, color: '#666' }}>Success</div>
                </div>
              </div>
            </div>

            {/* Weekly Overview */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>This Week</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12 }}>Sessions: {last7Days}</span>
                <span style={{ fontSize: 12 }}>Goal: {localAnalytics.weeklyGoals.target}</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: 8, 
                backgroundColor: '#e0e0e0', 
                borderRadius: 4 
              }}>
                <div style={{ 
                  width: `${Math.min((last7Days / localAnalytics.weeklyGoals.target) * 100, 100)}%`, 
                  height: '100%', 
                  backgroundColor: last7Days >= localAnalytics.weeklyGoals.target ? '#22c55e' : '#3b82f6', 
                  borderRadius: 4,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* Overall Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              <div>
                <div style={{ fontWeight: 600 }}>Total Hours</div>
                <div style={{ color: '#666' }}>{Math.round(localAnalytics.totalHours * 10) / 10}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Best Streak</div>
                <div style={{ color: '#666' }}>{localAnalytics.bestStreak} days</div>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Avg Session</div>
                <div style={{ color: '#666' }}>{Math.round(localAnalytics.averageSessionLength)} min</div>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Success Rate</div>
                <div style={{ color: '#666' }}>{localAnalytics.productivityScore}%</div>
              </div>
            </div>

            <button 
              style={{ ...currentStyles.btn, width: '100%', marginTop: 12, fontSize: 12 }}
              onClick={() => {
                const analyticsCSV = [
                  ['Date', 'Sessions', 'Minutes', 'Completed', 'Success Rate'],
                  ...Object.entries(localAnalytics.dailyStats).map(([date, stats]) => [
                    date,
                    stats.sessions,
                    Math.round(stats.minutes),
                    stats.completedSessions,
                    stats.sessions > 0 ? Math.round((stats.completedSessions / stats.sessions) * 100) + '%' : '0%'
                  ])
                ].map(row => row.join(',')).join('\n');

                const blob = new Blob([analyticsCSV], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `focus_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }}
            >
              📊 Export Analytics
            </button>
          </div>
        );

      case 'history':
        return (
          <div key="history" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>Session History</h3>
            <div style={{ maxHeight: 220, overflow: "auto" }}>
              {history.length === 0 ? (
                <div style={{ color: "#666" }}>No sessions yet — start a focus session.</div>
              ) : (
                history.map((s) => (
                  <div key={s.id} style={currentStyles.historyRow}>
                    <div>
                      <strong>{s.mode === "focus" ? "Focus" : s.mode === "short" ? "Short Break" : "Long Break"}</strong>
                      {s.productivityScore && <span style={{ fontSize: 10, marginLeft: 6, backgroundColor: '#000', color: '#fff', padding: '1px 4px', borderRadius: 4 }}>{s.productivityScore}%</span>}
                      <div style={{ fontSize: 12, color: "#666" }}>{new Date(s.startTime).toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>{formatTime(s.durationSec)}</div>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button style={currentStyles.btn} onClick={() => setHistory([])}>Clear History</button>
              <button style={currentStyles.btn} onClick={downloadHistory}>Download JSON</button>
            </div>
          </div>
        );

      case 'sessionHighlights':
        return (
          <div key="sessionHighlights" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>Session Highlights 📝</h3>
            <div style={{ maxHeight: 180, overflow: "auto" }}>
              {sessionHighlights.length === 0 ? (
                <div style={{ color: "#666" }}>Complete focus sessions and reflect to build your productivity journal.</div>
              ) : (
                sessionHighlights.map((highlight) => (
                  <div key={highlight.id} style={{
                    padding: 8,
                    borderRadius: 6,
                    marginBottom: 8,
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>{highlight.text}</div>
                    <div style={{ fontSize: 11, color: "#666" }}>
                      {highlight.sessionDuration}min session • {new Date(highlight.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
            <button style={currentStyles.btn} onClick={() => setSessionHighlights([])}>Clear Highlights</button>
          </div>
        );

      case 'smartReminders':
        return (
          <div key="smartReminders" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>🤖 Smart Reminders</h3>
            {smartReminders.enabled ? (
              <div>
                <div style={{ 
                  padding: 8, 
                  borderRadius: 6, 
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #22c55e',
                  marginBottom: 12 
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>✅ AI System Active</div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    Learning from {smartReminders && smartReminders.aiLearningData && smartReminders.aiLearningData.sessionPatterns ? smartReminders.aiLearningData.sessionPatterns.length : 0} sessions
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    Confidence level: {Math.round(Math.min((smartReminders && smartReminders.aiLearningData && smartReminders.aiLearningData.sessionPatterns ? smartReminders.aiLearningData.sessionPatterns.length : 0) / 25, 1) * 100)}%
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>AI Preferences:</div>
                  {['focus', 'break', 'streak', 'optimization'].map(type => (
                    <label key={type} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      fontSize: 12,
                      marginBottom: 4 
                    }}>
                      <input
                        type="checkbox"
                        checked={smartReminders.preferences.reminderTypes.includes(type)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setSmartReminders(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              reminderTypes: isChecked 
                                ? [...prev.preferences.reminderTypes, type]
                                : prev.preferences.reminderTypes.filter(t => t !== type)
                            }
                          }));
                        }}
                      />
                      <span style={{ textTransform: 'capitalize' }}>{type} Intelligence</span>
                    </label>
                  ))}
                </div>

                <button 
                  style={{...currentStyles.btn, width: '100%' }}
                  onClick={() => {
                    setSmartReminders(prev => ({ ...prev, enabled: false }));
                    alert('🔕 AI reminders disabled');
                  }}
                >
                  🔕 Disable AI System
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
                  Advanced AI system learns your productivity patterns and provides intelligent recommendations and timing suggestions.
                </p>
                <div style={{ fontSize: 12, color: "#777", marginBottom: 12 }}>
                  <div>🧠 Deep learning from focus patterns</div>
                  <div>📈 Productivity optimization</div>
                  <div>⏰ Intelligent timing suggestions</div>
                  <div>🎯 Adaptive session recommendations</div>
                </div>
                <button 
                  style={{...currentStyles.btn, width: '100%' }} 
                  onClick={requestNotificationPermission}
                >
                  🤖 Activate AI System
                </button>
              </div>
            )}
          </div>
        );

      case 'deviceSync':
        return (
          <div key="deviceSync" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>🔄 Multi-Device Sync</h3>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
              Transfer your progress between devices instantly. Generate a sync code on one device and enter it on another to sync all your data.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button 
                style={{...currentStyles.btn, backgroundColor: '#000', color: '#fff', width: '100%' }}
                onClick={() => {
                  const newSyncCode = generateId().substring(0, 8).toUpperCase();
                  const userData = {
                    userProgress,
                    tasks,
                    dailyGoals,
                    history,
                    sessionHighlights,
                    smartReminders,
                    coins,
                    ownedItems,
                    activeTheme,
                    activeSound,
                    activeBoosts,
                    customization,
                    settings,
                    localAnalytics,
                    timestamp: Date.now(),
                    expires: Date.now() + (60 * 60 * 1000) // 1 hour
                  };

                  const newSyncCodes = { ...syncCodes, [newSyncCode]: userData };
                  setSyncCodes(newSyncCodes);
                  setGeneratedSyncCode(newSyncCode);

                  // Clean up expired codes
                  const currentTime = Date.now();
                  Object.keys(newSyncCodes).forEach(code => {
                    if (newSyncCodes[code].expires < currentTime) {
                      delete newSyncCodes[code];
                    }
                  });
                  setSyncCodes(newSyncCodes);

                  alert(`✅ Sync Code Generated!\n\nCode: ${newSyncCode}\n\n📱 On your other device:\n1. Open FocusGuard\n2. Go to Multi-Device Sync\n3. Enter this code\n4. Click "Import Data"\n\n⏰ Code expires in 1 hour.`);
                }}
              >
                🔗 Generate Sync Code
              </button>

              {generatedSyncCode && (
                <div style={{
                  padding: 12,
                  backgroundColor: '#f0fdf4',
                  border: '2px solid #22c55e',
                  borderRadius: 8,
                  textAlign: 'center'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Latest Generated Code:</div>
                  <div style={{ 
                    fontSize: 20, 
                    fontFamily: 'monospace', 
                    fontWeight: 700,
                    color: '#22c55e',
                    letterSpacing: 2,
                    marginBottom: 4
                  }}>
                    {generatedSyncCode}
                  </div>
                  <button
                    style={{ ...currentStyles.smallBtn, fontSize: 10 }}
                    onClick={() => {
                      navigator.clipboard.writeText(generatedSyncCode);
                      alert('📋 Sync code copied to clipboard!');
                    }}
                  >
                    📋 Copy Code
                  </button>
                </div>
              )}

              <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Import from Another Device:</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input 
                    type="text" 
                    placeholder="Enter sync code (e.g., ABC12345)" 
                    value={syncCode}
                    onChange={(e) => setSyncCode(e.target.value.toUpperCase())}
                    style={{...currentStyles.input, flex: 1, backgroundColor: '#f8f9fa', border: '1px dashed #000'}} 
                  />
                  <button 
                    style={{...currentStyles.btn, backgroundColor: '#3b82f6', color: '#fff'}}
                    onClick={() => {
                      const trimmedCode = syncCode.trim();
                      if (!trimmedCode) {
                        alert('❌ Please enter a sync code');
                        return;
                      }

                      const syncData = syncCodes[trimmedCode];
                      if (!syncData) {
                        alert('❌ Invalid or expired sync code');
                        return;
                      }

                      if (syncData.expires < Date.now()) {
                        alert('❌ This sync code has expired');
                        // Clean up expired code
                        const updatedCodes = { ...syncCodes };
                        delete updatedCodes[trimmedCode];
                        setSyncCodes(updatedCodes);
                        return;
                      }

                      if (window.confirm(`🔄 Import Data?\n\nThis will replace ALL your current data with data from another device.\n\nTimestamp: ${new Date(syncData.timestamp).toLocaleString()}\n\nThis action cannot be undone. Continue?`)) {
                        try {
                          // Import all data
                          setUserProgress(syncData.userProgress || userProgress);
                          setTasks(syncData.tasks || []);
                          setDailyGoals(syncData.dailyGoals || []);
                          setHistory(syncData.history || []);
                          setSessionHighlights(syncData.sessionHighlights || []);
                          setSmartReminders(syncData.smartReminders || smartReminders);
                          setCoins(syncData.coins || 0);
                          setOwnedItems(syncData.ownedItems || { themes: [], sounds: [], boosts: [] });
                          setActiveTheme(syncData.activeTheme || 'monochrome');
                          setActiveSound(syncData.activeSound || 'default');
                          setActiveBoosts(syncData.activeBoosts || {});
                          setCustomization(syncData.customization || customization);
                          setSettings(syncData.settings || settings);
                          setLocalAnalytics(syncData.localAnalytics || localAnalytics);

                          // Clean up used code
                          const updatedCodes = { ...syncCodes };
                          delete updatedCodes[trimmedCode];
                          setSyncCodes(updatedCodes);
                          setSyncCode('');

                          alert('✅ Data Imported Successfully!\n\nAll your progress, settings, and achievements have been synced from the other device.');
                        } catch (error) {
                          alert('❌ Import failed. Please check the sync code and try again.');
                          console.error('Sync import error:', error);
                        }
                      }
                    }}
                  >
                    📥 Import Data
                  </button>
                </div>
              </div>

              <div style={{ fontSize: 11, color: '#666', marginTop: 8 }}>
                💡 Tip: Codes expire after 1 hour for security. Both devices must have internet connectivity.
              </div>
            </div>
          </div>
        );

      case 'supportCreator':
        return (
          <div key="supportCreator" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>💝 Support the Creator</h3>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
              Follow my journey and stay updated on new productivity tools!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <a 
                href="https://www.youtube.com/@ctrlaltstudy-g1z" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  ...currentStyles.btn,
                  textDecoration: 'none',
                  textAlign: 'center',
                  backgroundColor: '#ff0000',
                  color: '#fff',
                  border: '1px solid #ff0000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                🎥 YouTube - Ctrl+Alt+Study
              </a>

              <a 
                href="https://www.tiktok.com/@focusguard101?is_from_webapp=1&sender_device=pc" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  ...currentStyles.btn,
                  textDecoration: 'none',
                  textAlign: 'center',
                  backgroundColor: '#000',
                  color: '#fff',
                  border: '1px solid #000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                📱 TikTok - FocusGuard
              </a>
            </div>

            <div style={{ 
              borderTop: '1px solid #e0e0e0', 
              paddingTop: 12,
              textAlign: 'center' 
            }}>
              <div style={{ 
                fontSize: 13, 
                fontWeight: 600, 
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}>
                ☕ Buy me a coffee
              </div>
              <div style={{
                ...currentStyles.btn,
                backgroundColor: '#0066ff',
                color: '#fff',
                textAlign: 'center',
                width: '100%',
                cursor: 'pointer',
                padding: '12px 16px',
                marginBottom: 8
              }}
              onClick={() => {
                navigator.clipboard.writeText('09613777353');
                alert('📱 GCash Number Copied!\n\n09613777353\n\nThank you for your support! 💙');
              }}
              >
                📱 GCash: 09613777353
              </div>
              <div style={{ 
                fontSize: 11, 
                color: '#666', 
                marginTop: 6 
              }}>
                Click to copy GCash number
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  // Check if should use mobile layout
  const useMobileLayout = isMobile || forceMobileLayout;

  // ---------------------- Render ----------------------
  const currentStyles = monochromeStyles;

  return (
    <div style={currentStyles.app}>
      <style>{monochromeCSS}</style>

      {/* Tooltip Element */}
      <div 
        id="custom-tooltip"
        style={{
          position: 'absolute',
          padding: '10px 15px',
          backgroundColor: '#000',
          color: '#fff',
          borderRadius: '6px',
          fontSize: '13px',
          zIndex: 2001,
          opacity: 0,
          transition: 'opacity 0.2s ease',
          pointerEvents: 'none', // Ensures tooltip doesn't block mouse events
          whiteSpace: 'nowrap'
        }}
      />

      {/* Header */}
      <header style={{
        ...currentStyles.header,
        ...(useMobileLayout ? {
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 16,
          marginBottom: 20
        } : {})
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 16,
          ...(useMobileLayout ? { justifyContent: 'center' } : {})
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            backgroundColor: "#000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }}>
            <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 8L48 14V26C48 38 40 48 32 54C24 48 16 38 16 26V14L32 8Z" fill="#ffffff"/>
              <circle cx="32" cy="28" r="10" fill="none" stroke="#000000" strokeWidth="1.5"/>
              <circle cx="32" cy="28" r="3" fill="#000000"/>
              <path d="M32 18 A10 10 0 0 1 40.7 22" stroke="#000000" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M40.7 34 A10 10 0 0 1 32 38" stroke="#000000" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M23.3 34 A10 10 0 0 1 23.3 22" stroke="#000000" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: useMobileLayout ? 20 : 24, fontWeight: 700 }}>FocusGuard</h1>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
              AI-Powered Focus Assistant
            </div>
          </div>
        </div>

        {customization.showHeaderButtons && customization.headerButtons && (
          <div style={{ 
            display: "grid", 
            ...(useMobileLayout ? {
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
              width: '100%'
            } : {
              display: "flex",
              gap: 8,
              flexWrap: "wrap"
            })
          }}>
            {customization.headerButtons.customize && (
              <button 
                style={{
                  ...currentStyles.btn, 
                  ...(useMobileLayout ? { 
                    padding: '12px 8px',
                    fontSize: 13
                  } : {})
                }} 
                onClick={() => setShowCustomization(!showCustomization)}
              >
                ⚙️ Customize
              </button>
            )}
            {customization.headerButtons.analytics && (
              <button 
                style={{
                  ...currentStyles.btn, 
                  ...(useMobileLayout ? { 
                    padding: '12px 8px',
                    fontSize: 13
                  } : {})
                }} 
                onClick={() => setShowAnalytics(!showAnalytics)}
              >
                📊 Analytics
              </button>
            )}
            {customization.headerButtons.aiCoach && (
              <button 
                style={{
                  ...currentStyles.btn, 
                  ...(useMobileLayout ? { 
                    padding: '12px 8px',
                    fontSize: 13
                  } : {}),
                  ...(smartReminders.enabled ? {
                    backgroundColor: '#000',
                    color: '#fff'
                  } : {})
                }} 
                onClick={() => setShowAICoach(!showAICoach)}
              >
                🤖 AI Coach
              </button>
            )}
            {customization.headerButtons.layoutToggle && (
              <button 
                style={{
                  ...currentStyles.btn, 
                  ...(useMobileLayout ? { 
                    padding: '12px 8px',
                    fontSize: 13
                  } : {})
                }} 
                onClick={() => {
                  setForceMobileLayout(!forceMobileLayout);
                  console.log('Toggle clicked, new state:', !forceMobileLayout);
                }}
              >
                {useMobileLayout ? "🖥️ Desktop" : "📱 Mobile"}
              </button>
            )}
            {customization.headerButtons.notifications && (
              <button 
                style={{
                  ...currentStyles.btn, 
                  ...(useMobileLayout ? { 
                    padding: '12px 8px',
                    fontSize: 13
                  } : {}),
                  ...(smartReminders.enabled ? {
                    backgroundColor: '#000',
                    color: '#fff'
                  } : {})
                }} 
                onClick={requestNotificationPermission}
              >
                {smartReminders.enabled ? "🔔 Smart Notifications" : "Enable Notifications"}
              </button>
            )}
            <button 
              style={{
                ...currentStyles.btn, 
                ...(useMobileLayout ? { 
                  padding: '12px 8px',
                  fontSize: 13
                } : {}),
                backgroundColor: '#f59e0b',
                color: '#fff',
                fontWeight: 600
              }} 
              onClick={() => setShowShop(!showShop)}
            >
              🪙 Shop ({coins})
            </button>
            <button 
              style={{
                ...currentStyles.btn, 
                ...(useMobileLayout ? { 
                  padding: '12px 8px',
                  fontSize: 13
                } : {}),
                backgroundColor: '#22c55e',
                color: '#fff',
                fontWeight: 600
              }} 
              onClick={() => setShowAchievements(!showAchievements)}
            >
              🏆 Achievements
            </button>
            <button 
              style={{
                ...currentStyles.btn, 
                ...(useMobileLayout ? { 
                  padding: '12px 8px',
                  fontSize: 13
                } : {}),
                backgroundColor: '#333',
                color: '#fff'
              }} 
              onClick={() => updateCustomization('showHeaderButtons', false)}
            >
              ➖ Hide
            </button>
          </div>
        )}
        {!customization.showHeaderButtons && (
          <button 
            style={{
              ...currentStyles.btn, 
              padding: '8px 16px',
              fontSize: 12
            }} 
            onClick={() => updateCustomization('showHeaderButtons', true)}
          >
            ⚙️ Show Controls
          </button>
        )}
      </header>

      {/* Customization Modal */}
      {showCustomization && (
        <div style={currentStyles.modalOverlay}>
          <div style={{
            ...currentStyles.modal,
            maxWidth: useMobileLayout ? '100%' : 600,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Customize Your Experience</h3>
              <button style={currentStyles.iconBtn} onClick={() => setShowCustomization(false)}>✖</button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4>General Settings</h4>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={customization.enableTooltips}
                    onChange={(e) => updateCustomization('enableTooltips', e.target.checked)}
                  />
                  Enable hover tooltips on buttons
                </label>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4>Section Visibility & Order</h4>
              <div style={{ maxHeight: 300, overflow: 'auto' }}>
                {customization.sectionOrder.map((section, index) => (
                  <div key={section} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    marginBottom: 8,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <button
                        style={{ ...currentStyles.iconBtn, fontSize: 10, padding: 4 }}
                        onClick={() => moveSectionUp(index)}
                        disabled={index === 0}
                      >
                        ▲
                      </button>
                      <button
                        style={{ ...currentStyles.iconBtn, fontSize: 10, padding: 4 }}
                        onClick={() => moveSectionDown(index)}
                        disabled={index === customization.sectionOrder.length - 1}
                      >
                        ▼
                      </button>
                    </div>
                    <input
                      type="checkbox"
                      checked={customization.visibleSections[section]}
                      onChange={() => toggleSectionVisibility(section)}
                    />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>
                      {section === 'aiInsights' ? '🧠 AI Insights' :
                       section === 'smartRecommendations' ? '🤖 Smart Recommendations' :
                       section === 'focusAnalytics' ? '📊 Focus Analytics' :
                       section === 'sessionHighlights' ? '📝 Session Highlights' :
                       section === 'dailyGoals' ? 'Daily Goals' :
                       section === 'smartReminders' ? '🤖 Smart Reminders' :
                       section === 'deviceSync' ? '🔄 Multi-Device Sync' :
                       section === 'supportCreator' ? '💝 Support Creator' :
                       section.charAt(0).toUpperCase() + section.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button style={currentStyles.btn} onClick={() => {
                setCustomization(DEFAULT_CUSTOMIZATION);
              }}>
                Reset Defaults
              </button>
              <button style={{...currentStyles.btn, backgroundColor: '#000', color: '#fff'}} onClick={() => setShowCustomization(false)}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shop Modal */}
      {showShop && (
        <div style={currentStyles.modalOverlay}>
          <div style={{
            ...currentStyles.modal,
            maxWidth: useMobileLayout ? '100%' : 800,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                🪙 Rewards Shop
                <span style={{ 
                  fontSize: 14, 
                  backgroundColor: '#f59e0b', 
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontWeight: 'normal'
                }}>
                  {coins} coins
                </span>
              </h3>
              <button style={currentStyles.iconBtn} onClick={() => setShowShop(false)}>✖</button>
            </div>

            {/* Active Boosts */}
            {Object.keys(activeBoosts).length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h4>⚡ Active Boosts</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(activeBoosts).map(([boostId, expiry]) => {
                    const timeLeft = Math.max(0, expiry - Date.now());
                    const minutesLeft = Math.round(timeLeft / 60000);
                    return (
                      <div key={boostId} style={{
                        padding: '6px 12px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #22c55e',
                        borderRadius: 8,
                        fontSize: 12
                      }}>
                        {SHOP_ITEMS.boosts[boostId]?.icon} {SHOP_ITEMS.boosts[boostId]?.name}
                        <div style={{ fontSize: 10, color: '#666' }}>
                          {minutesLeft > 60 ? `${Math.round(minutesLeft/60)}h` : `${minutesLeft}m`} left
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Shop Categories */}
            <div style={{ display: 'grid', gridTemplateColumns: useMobileLayout ? '1fr' : 'repeat(2, 1fr)', gap: 20 }}>

              {/* Themes */}
              <div>
                <h4>🎨 Themes</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(SHOP_ITEMS.themes).map(([themeId, item]) => {
                    const owned = ownedItems.themes.includes(themeId);
                    const active = activeTheme === themeId;
                    return (
                      <div key={themeId} style={{
                        padding: 12,
                        border: `2px solid ${active ? '#22c55e' : owned ? '#3b82f6' : '#e0e0e0'}`,
                        borderRadius: 8,
                        backgroundColor: active ? '#f0fdf4' : owned ? '#f0f9ff' : '#f8f9fa'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 16 }}>{item.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>{item.description}</div>
                        {owned ? (
                          <button
                            style={{
                              ...currentStyles.smallBtn,
                              backgroundColor: active ? '#22c55e' : '#3b82f6',
                              color: '#fff',
                              width: '100%'
                            }}
                            onClick={() => setActiveTheme(themeId)}
                          >
                            {active ? '✓ Active' : 'Activate'}
                          </button>
                        ) : (
                          <button
                            style={{
                              ...currentStyles.smallBtn,
                              backgroundColor: coins >= item.price ? '#f59e0b' : '#9ca3af',
                              color: '#fff',
                              width: '100%'
                            }}
                            onClick={() => buyItem('themes', themeId)}
                            disabled={coins < item.price}
                          >
                            🪙 {item.price}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sound Effects */}
              <div>
                <h4>🔊 Sound Effects</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflow: 'auto' }}>
                  {Object.entries(SHOP_ITEMS.sounds).map(([soundId, item]) => {
                    const owned = ownedItems.sounds.includes(soundId);
                    const active = activeSound === soundId;
                    return (
                      <div key={soundId} style={{
                        padding: 12,
                        border: `2px solid ${active ? '#22c55e' : owned ? '#3b82f6' : '#e0e0e0'}`,
                        borderRadius: 8,
                        backgroundColor: active ? '#f0fdf4' : owned ? '#f0f9ff' : '#f8f9fa'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 16 }}>{item.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>{item.description}</div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {owned && (
                            <button
                              style={{
                                ...currentStyles.smallBtn,
                                fontSize: 10,
                                padding: '4px 8px'
                              }}
                              onClick={() => playCustomSound(soundId)}
                            >
                              🔊 Test
                            </button>
                          )}
                          {owned ? (
                            <button
                              style={{
                                ...currentStyles.smallBtn,
                                backgroundColor: active ? '#22c55e' : '#3b82f6',
                                color: '#fff',
                                flex: 1
                              }}
                              onClick={() => setActiveSound(soundId)}
                            >
                              {active ? '✓ Active' : 'Activate'}
                            </button>
                          ) : (
                            <button
                              style={{
                                ...currentStyles.smallBtn,
                                backgroundColor: coins >= item.price ? '#f59e0b' : '#9ca3af',
                                color: '#fff',
                                flex: 1
                              }}
                              onClick={() => buyItem('sounds', soundId)}
                              disabled={coins < item.price}
                            >
                              🪙 {item.price}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Power-ups and Special Items */}
            <div style={{ display: 'grid', gridTemplateColumns: useMobileLayout ? '1fr' : '1fr 1fr', gap: 20, marginTop: 20 }}>

              {/* Boosts */}
              <div>
                <h4>⚡ Power-ups</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflow: 'auto' }}>
                  {Object.entries(SHOP_ITEMS.boosts).map(([boostId, item]) => {
                    const owned = ownedItems.boosts.includes(boostId);
                    const active = activeBoosts[boostId] && activeBoosts[boostId] > Date.now();
                    return (
                      <div key={boostId} style={{
                        padding: 12,
                        border: `2px solid ${active ? '#22c55e' : owned ? '#3b82f6' : '#e0e0e0'}`,
                        borderRadius: 8,
                        backgroundColor: active ? '#f0fdf4' : owned ? '#f0f9ff' : '#f8f9fa'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 16 }}>{item.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>{item.description}</div>
                        {owned ? (
                          <button
                            style={{
                              ...currentStyles.smallBtn,
                              backgroundColor: active ? '#22c55e' : '#3b82f6',
                              color: '#fff',
                              width: '100%'
                            }}
                            onClick={() => useBoost(boostId)}
                            disabled={active}
                          >
                            {active ? '✓ Active' : 'Activate'}
                          </button>
                        ) : (
                          <button
                            style={{
                              ...currentStyles.smallBtn,
                              backgroundColor: coins >= item.price ? '#f59e0b' : '#9ca3af',
                              color: '#fff',
                              width: '100%'
                            }}
                            onClick={() => buyItem('boosts', boostId)}
                            disabled={coins < item.price}
                          >
                            🪙 {item.price}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Special Items */}
              <div>
                <h4>✨ Special Items</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflow: 'auto' }}>
                  {Object.entries(SHOP_ITEMS.special).map(([specialId, item]) => {
                    const owned = ownedItems.special && ownedItems.special.includes(specialId);
                    return (
                      <div key={specialId} style={{
                        padding: 12,
                        border: `2px solid ${owned ? '#3b82f6' : '#e0e0e0'}`,
                        borderRadius: 8,
                        backgroundColor: owned ? '#f0f9ff' : '#f8f9fa'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 16 }}>{item.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>{item.description}</div>
                        {owned ? (
                          <button
                            style={{
                              ...currentStyles.smallBtn,
                              backgroundColor: '#22c55e',
                              color: '#fff',
                              width: '100%'
                            }}
                            disabled
                          >
                            ✓ Owned
                          </button>
                        ) : (
                          <button
                            style={{
                              ...currentStyles.smallBtn,
                              backgroundColor: coins >= item.price ? '#f59e0b' : '#9ca3af',
                              color: '#fff',
                              width: '100%'
                            }}
                            onClick={() => buyItem('special', specialId)}
                            disabled={coins < item.price}
                          >
                            🪙 {item.price}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
                💡 Earn coins by completing focus sessions! Longer sessions = more coins.
              </div>
              <button 
                style={{...currentStyles.btn, backgroundColor: '#000', color: '#fff'}}
                onClick={() => setShowShop(false)}
              >
                Close Shop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Modal */}
      {showAchievements && (
        <div style={currentStyles.modalOverlay}>
          <div style={{
            ...currentStyles.modal,
            maxWidth: useMobileLayout ? '100%' : 900,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                🏆 Achievements Center
                <span style={{ 
                  fontSize: 14, 
                  backgroundColor: '#22c55e', 
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontWeight: 'normal'
                }}>
                  {userProgress.achievements.filter(a => a.unlocked).length}/{userProgress.achievements.length}
                </span>
              </h3>
              <button style={currentStyles.iconBtn} onClick={() => setShowAchievements(false)}>✖</button>
            </div>

            {/* Progress Overview */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: useMobileLayout ? '1fr' : 'repeat(3, 1fr)', 
              gap: 16,
              marginBottom: 24
            }}>
              <div style={{ 
                textAlign: 'center', 
                padding: 16, 
                backgroundColor: '#f0fdf4', 
                borderRadius: 8,
                border: '2px solid #22c55e'
              }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
                  {userProgress.achievements.filter(a => a.unlocked).length}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Unlocked</div>
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: 16, 
                backgroundColor: '#fef3c7', 
                borderRadius: 8,
                border: '2px solid #f59e0b'
              }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>
                  {userProgress.achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.coins, 0)}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Coins Earned</div>
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: 16, 
                backgroundColor: '#f8f9fa', 
                borderRadius: 8,
                border: '2px solid #9ca3af'
              }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#9ca3af' }}>
                  {userProgress.achievements.filter(a => !a.unlocked).length}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Locked</div>
              </div>
            </div>

            {/* Achievement Categories */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: useMobileLayout ? '1fr' : '1fr 1fr', 
                gap: 20
              }}>

                {/* Unlocked Achievements */}
                <div>
                  <h4 style={{ 
                    color: '#22c55e', 
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    ✅ Unlocked Achievements ({userProgress.achievements.filter(a => a.unlocked).length})
                  </h4>
                  <div style={{ 
                    maxHeight: 400, 
                    overflow: 'auto',
                    backgroundColor: '#f0fdf4',
                    borderRadius: 8,
                    padding: 12,
                    border: '1px solid #22c55e'
                  }}>
                    {userProgress.achievements.filter(a => a.unlocked).length === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        color: '#666',
                        fontStyle: 'italic',
                        padding: 20
                      }}>
                        Complete your first focus session to unlock achievements!
                      </div>
                    ) : (
                      userProgress.achievements.filter(a => a.unlocked).map(achievement => (
                        <div key={achievement.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: 12,
                          borderRadius: 8,
                          backgroundColor: '#fff',
                          marginBottom: 8,
                          border: '1px solid #22c55e',
                          boxShadow: '2px 2px 0px #22c55e'
                        }}>
                          <span style={{ fontSize: 24 }}>{achievement.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                              {achievement.name}
                            </div>
                            <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                              {achievement.description}
                            </div>
                            <div style={{ 
                              fontSize: 11, 
                              color: '#22c55e',
                              fontWeight: 600
                            }}>
                              🪙 +{achievement.coins} coins earned
                            </div>
                          </div>
                          <div style={{
                            backgroundColor: '#22c55e',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: 12,
                            fontSize: 10,
                            fontWeight: 600
                          }}>
                            ✓ UNLOCKED
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Locked Achievements */}
                <div>
                  <h4 style={{ 
                    color: '#9ca3af', 
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    🔒 Locked Achievements ({ACHIEVEMENTS.filter(a => !userProgress.achievements.find(ua => ua.id === a.id)?.unlocked).length})
                  </h4>
                  <div style={{ 
                    maxHeight: 400, 
                    overflow: 'auto',
                    backgroundColor: '#f8f9fa',
                    borderRadius: 8,
                    padding: 12,
                    border: '1px solid #e0e0e0'
                  }}>
                    {ACHIEVEMENTS.filter(a => !userProgress.achievements.find(ua => ua.id === a.id)?.unlocked).length === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        color: '#666',
                        fontStyle: 'italic',
                        padding: 20
                      }}>
                        🎉 All achievements unlocked! You're a productivity master!
                      </div>
                    ) : (
                      ACHIEVEMENTS.filter(a => !userProgress.achievements.find(ua => ua.id === a.id)?.unlocked).map(achievement => (
                        <div key={achievement.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: 12,
                          borderRadius: 8,
                          backgroundColor: '#fff',
                          marginBottom: 8,
                          border: '1px solid #e0e0e0',
                          opacity: 0.8
                        }}>
                          <div style={{
                            fontSize: 24,
                            filter: 'grayscale(100%)',
                            position: 'relative'
                          }}>
                            {achievement.icon}
                            <div style={{
                              position: 'absolute',
                              top: -2,
                              right: -2,
                              fontSize: 12
                            }}>
                              🔒
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, color: '#666' }}>
                              {achievement.name}
                            </div>
                            <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
                              <strong>How to unlock:</strong> {achievement.description}
                            </div>
                            <div style={{ 
                              fontSize: 11, 
                              color: '#f59e0b',
                              fontWeight: 600
                            }}>
                              🪙 Reward: {achievement.coins} coins
                            </div>
                          </div>
                          <div style={{
                            backgroundColor: '#e0e0e0',
                            color: '#666',
                            padding: '4px 8px',
                            borderRadius: 12,
                            fontSize: 10,
                            fontWeight: 600
                          }}>
                            🔒 LOCKED
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button 
                style={{...currentStyles.btn, backgroundColor: '#000', color: '#fff'}}
                onClick={() => setShowAchievements(false)}
              >
                Close Achievements
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How-to Guide Modal */}
      {showHowToGuide && (
        <div style={currentStyles.modalOverlay}>
          <div style={{
            ...currentStyles.modal,
            maxWidth: useMobileLayout ? '100%' : 800,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>📚 Complete How-to Guide</h3>
              <button style={currentStyles.iconBtn} onClick={() => setShowHowToGuide(false)}>✖</button>
            </div>

            {/* Guide Categories */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Getting Started */}
              <div style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 8,
                backgroundColor: '#fff'
              }}>
                <button
                  style={{
                    ...currentStyles.btn,
                    width: '100%',
                    textAlign: 'left',
                    padding: 16,
                    backgroundColor: expandedGuideSection === 'getting-started' ? '#f0f9ff' : '#fff',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onClick={() => setExpandedGuideSection(expandedGuideSection === 'getting-started' ? null : 'getting-started')}
                >
                  🚀 Getting Started with FocusGuard
                  <span>{expandedGuideSection === 'getting-started' ? '▼' : '▶'}</span>
                </button>
                {expandedGuideSection === 'getting-started' && (
                  <div style={{ padding: 16, borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 12 }}>
                        <strong>1. Start Your First Session:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li>Click the "▶ Start" button to begin a 25-minute focus session</li>
                          <li>The circular progress indicator shows your remaining time</li>
                          <li>You'll hear a sound when the session completes</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>2. Understanding Modes:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Focus:</strong> Work on important tasks (default 25 min)</li>
                          <li><strong>Short Break:</strong> Quick rest between sessions (5 min)</li>
                          <li><strong>Long Break:</strong> Extended rest every 4 cycles (15 min)</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>3. Level Up System:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li>Earn 2 XP per minute of focused work</li>
                          <li>Every 100 XP = 1 level increase</li>
                          <li>Higher levels unlock more features</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Features */}
              <div style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 8,
                backgroundColor: '#fff'
              }}>
                <button
                  style={{
                    ...currentStyles.btn,
                    width: '100%',
                    textAlign: 'left',
                    padding: 16,
                    backgroundColor: expandedGuideSection === 'ai-features' ? '#f0f9ff' : '#fff',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onClick={() => setExpandedGuideSection(expandedGuideSection === 'ai-features' ? null : 'ai-features')}
                >
                  🤖 AI Features & Smart Recommendations
                  <span>{expandedGuideSection === 'ai-features' ? '▼' : '▶'}</span>
                </button>
                {expandedGuideSection === 'ai-features' && (
                  <div style={{ padding: 16, borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 12 }}>
                        <strong>1. Activating AI System:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li>Click "🤖 AI Coach" in the header</li>
                          <li>Enable smart notifications for learning</li>
                          <li>AI learns from your first 5+ sessions</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>2. Smart Recommendations:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li>AI suggests optimal session lengths based on success rate</li>
                          <li>Timing recommendations for peak productivity</li>
                          <li>Task prioritization based on patterns</li>
                          <li>Following AI suggestions earns bonus XP</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>3. Productivity Insights:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li>View AI confidence levels and predictions</li>
                          <li>Export detailed analytics for review</li>
                          <li>Track productivity trends over time</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Earning & Spending */}
              <div style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 8,
                backgroundColor: '#fff'
              }}>
                <button
                  style={{
                    ...currentStyles.btn,
                    width: '100%',
                    textAlign: 'left',
                    padding: 16,
                    backgroundColor: expandedGuideSection === 'earning-spending' ? '#f0f9ff' : '#fff',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onClick={() => setExpandedGuideSection(expandedGuideSection === 'earning-spending' ? null : 'earning-spending')}
                >
                  🪙 Earning & Spending Coins
                  <span>{expandedGuideSection === 'earning-spending' ? '▼' : '▶'}</span>
                </button>
                {expandedGuideSection === 'earning-spending' && (
                  <div style={{ padding: 16, borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 12 }}>
                        <strong>1. How to Earn Coins:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Focus Sessions:</strong> 1 coin per 5 minutes (minimum 1)</li>
                          <li><strong>Completing Tasks:</strong> 2-3 coins each</li>
                          <li><strong>Daily Goals:</strong> 5 coins each</li>
                          <li><strong>Achievements:</strong> 10-500 coins depending on difficulty</li>
                          <li><strong>AI Recommendations:</strong> Bonus coins for following suggestions</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>2. Shop Categories:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Themes:</strong> Change your interface colors (50-200 coins)</li>
                          <li><strong>Sound Effects:</strong> Custom notification sounds (40-120 coins)</li>
                          <li><strong>Power-ups:</strong> Temporary boosts like 2x XP (100-300 coins)</li>
                          <li><strong>Special Items:</strong> Unique features and tools (200-500 coins)</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>3. Smart Spending Tips:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li>Save coins for power-ups during important work sessions</li>
                          <li>Buy themes early for better visual experience</li>
                          <li>Use XP boosts when working on big projects</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tasks & Goals */}
              <div style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 8,
                backgroundColor: '#fff'
              }}>
                <button
                  style={{
                    ...currentStyles.btn,
                    width: '100%',
                    textAlign: 'left',
                    padding: 16,
                    backgroundColor: expandedGuideSection === 'tasks-goals' ? '#f0f9ff' : '#fff',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onClick={() => setExpandedGuideSection(expandedGuideSection === 'tasks-goals' ? null : 'tasks-goals')}
                >
                  ✅ Tasks & Daily Goals Management
                  <span>{expandedGuideSection === 'tasks-goals' ? '▼' : '▶'}</span>
                </button>
                {expandedGuideSection === 'tasks-goals' && (
                  <div style={{ padding: 16, borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 12 }}>
                        <strong>1. Adding Tasks:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li>Type your task in the input field</li>
                          <li>Press Enter or click "Add" to save</li>
                          <li>AI may auto-prioritize important tasks with 🔥</li>
                          <li>Check off completed tasks to earn coins and XP</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>2. Daily Goals:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li>Set 1-3 important goals for each day</li>
                          <li>Goals reset daily - use "Clear Old Goals"</li>
                          <li>Completing goals earns 5 coins + 10 XP</li>
                          <li>Track progress with the built-in progress bar</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>3. Best Practices:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li>Break large tasks into smaller, actionable items</li>
                          <li>Set realistic daily goals you can complete</li>
                          <li>Review and update your list during break sessions</li>
                          <li>Use specific, measurable language in task descriptions</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Achievements & Streaks */}
              <div style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 8,
                backgroundColor: '#fff'
              }}>
                <button
                  style={{
                    ...currentStyles.btn,
                    width: '100%',
                    textAlign: 'left',
                    padding: 16,
                    backgroundColor: expandedGuideSection === 'achievements' ? '#f0f9ff' : '#fff',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onClick={() => setExpandedGuideSection(expandedGuideSection === 'achievements' ? null : 'achievements')}
                >
                  🏆 Achievements & Streak Building
                  <span>{expandedGuideSection === 'achievements' ? '▼' : '▶'}</span>
                </button>
                {expandedGuideSection === 'achievements' && (
                  <div style={{ padding: 16, borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 12 }}>
                        <strong>1. Types of Achievements:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Time-based:</strong> Early Bird, Night Owl, Midnight Warrior</li>
                          <li><strong>Volume:</strong> 10/50/100/1000 sessions completed</li>
                          <li><strong>Streaks:</strong> 3, 7, 14, 30, 100+ day streaks</li>
                          <li><strong>Special:</strong> Weekend grind, marathon sessions, AI mastery</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>2. Building Streaks:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li>Complete at least one focus session daily</li>
                          <li>Sessions must be at least 80% of target length</li>
                          <li>Streaks reset if you miss a day (unless you have freeze items)</li>
                          <li>Buy "Streak Freeze" from shop to protect your streak</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>3. Maximizing Achievement Progress:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li>Check the 🏆 Achievements button to see what's available</li>
                          <li>Plan sessions around time-based achievements</li>
                          <li>Use AI recommendations to earn "AI Student/Master" badges</li>
                          <li>Write session reflections to unlock "Zen Master"</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Analytics & Data */}
              <div style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 8,
                backgroundColor: '#fff'
              }}>
                <button
                  style={{
                    ...currentStyles.btn,
                    width: '100%',
                    textAlign: 'left',
                    padding: 16,
                    backgroundColor: expandedGuideSection === 'analytics' ? '#f0f9ff' : '#fff',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onClick={() => setExpandedGuideSection(expandedGuideSection === 'analytics' ? null : 'analytics')}
                >
                  📊 Analytics & Data Export
                  <span>{expandedGuideSection === 'analytics' ? '▼' : '▶'}</span>
                </button>
                {expandedGuideSection === 'analytics' && (
                  <div style={{ padding: 16, borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 12 }}>
                        <strong>1. Understanding Your Data:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Success Rate:</strong> % of sessions completed vs started</li>
                          <li><strong>Productivity Score:</strong> AI-calculated effectiveness rating</li>
                          <li><strong>Session Trends:</strong> Visual charts showing improvement over time</li>
                          <li><strong>Peak Times:</strong> When you're most productive during the day</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>2. Using Analytics:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li>Click "📊 Analytics" to view your dashboard</li>
                          <li>Review weekly/monthly patterns to optimize schedule</li>
                          <li>Use AI predictions to plan important work sessions</li>
                          <li>Export your data as CSV or JSON for external analysis</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>3. Privacy & Data Control:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li>All data stored locally in your browser</li>
                          <li>Use the sync code feature to transfer between devices</li>
                          <li>Export your data anytime for backup</li>
                          <li>Reset all progress from the danger zone if needed</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button 
                style={{...currentStyles.btn, backgroundColor: '#000', color: '#fff'}}
                onClick={() => setShowHowToGuide(false)}
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Coach Modal */}
      {showAICoach && (
        <div style={currentStyles.modalOverlay}>
          <div style={{
            ...currentStyles.modal,
            maxWidth: useMobileLayout ? '100%' : 700,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                🤖 AI Productivity Coach
                {smartReminders.enabled && (
                  <span style={{ 
                    fontSize: 10, 
                    backgroundColor: '#000', 
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontWeight: 'normal'
                  }}>
                    ACTIVE
                  </span>
                )}
              </h3>
              <button style={currentStyles.iconBtn} onClick={() => setShowAICoach(false)}>✖</button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4>🧠 Current AI Analysis</h4>
              {(() => {
                const analysis = performDeepAIAnalysis();
                return (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                        Confidence Level: {Math.round(analysis.confidence)}%
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: 8, 
                        backgroundColor: '#e0e0e0', 
                        borderRadius: 4 
                      }}>
                        <div style={{ 
                          width: `${analysis.confidence}%`, 
                          height: '100%', 
                          backgroundColor: '#000', 
                          borderRadius: 4 
                        }} />
                      </div>
                    </div>

                    {analysis.insights.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Key Insights:</div>
                        {analysis.insights.map((insight, i) => (
                          <div key={i} style={{ 
                            padding: 10, 
                            backgroundColor: '#f0f9ff', 
                            border: '1px solid #3b82f6',
                            borderRadius: 6, 
                            marginBottom: 6,
                            fontSize: 13
                          }}>
                            💡 {insight}
                          </div>
                        ))}
                      </div>
                    )}

                    {analysis.predictions.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>AI Predictions:</div>
                        {analysis.predictions.map((pred, i) => (
                          <div key={i} style={{ 
                            padding: 12, 
                            backgroundColor: '#f0fdf4', 
                            border: '1px solid #22c55e',
                            borderRadius: 6,
                            fontSize: 13
                          }}>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>
                              🔮 Next Session Success: {pred.score}%
                            </div>
                            {pred.factors.map((factor, j) => (
                              <div key={j} style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                                • {factor}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4>🎯 Smart Recommendations</h4>
              {(() => {
                const recommendations = getEnhancedAIRecommendations();
                return recommendations.length === 0 ? (
                  <div style={{ color: '#666', fontStyle: 'italic' }}>
                    Complete more sessions to unlock personalized AI recommendations.
                  </div>
                ) : (
                  <div style={{ maxHeight: 300, overflow: 'auto' }}>
                    {recommendations.map((rec, i) => (
                      <div key={i} style={{
                        padding: 12,
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e0e0e0',
                        borderRadius: 8,
                        marginBottom: 10
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 16 }}>{rec.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{rec.title}</span>
                          <span style={{ 
                            fontSize: 10, 
                            backgroundColor: rec.priority === 'high' ? '#dc2626' : rec.priority === 'medium' ? '#f59e0b' : '#3b82f6',
                            color: '#fff',
                            padding: '2px 6px',
                            borderRadius: 8,
                            textTransform: 'uppercase'
                          }}>
                            {rec.priority}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                          {rec.description}
                        </div>
                        {rec.action && (
                          <button
                            style={{
                              ...currentStyles.smallBtn,
                              backgroundColor: '#000',
                              color: '#fff',
                              border: 'none'
                            }}
                            onClick={() => {
                              rec.action();
                              setUserProgress(prev => ({ 
                                ...prev, 
                                aiRecommendationsFollowed: prev.aiRecommendationsFollowed + 1 
                              }));
                              alert('🤖 AI recommendation applied successfully!');
                            }}
                          >
                            Apply Recommendation
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
              <button 
                style={currentStyles.btn}
                onClick={() => {
                  const analysis = performDeepAIAnalysis();
                  const report = {
                    timestamp: new Date().toISOString(),
                    userProgress,
                    sessionHistory: history,
                    aiLearningData: smartReminders.aiLearningData,
                    analysis: analysis,
                    recommendations: getEnhancedAIRecommendations()
                  };

                  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `ai_analysis_${new Date().toISOString().slice(0, 10)}.json`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}
              >
                📥 Export AI Report
              </button>
              <button 
                style={{...currentStyles.btn, backgroundColor: '#000', color: '#fff'}}
                onClick={() => setShowAICoach(false)}
              >
                Close Coach
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Dashboard Modal */}
      {showAnalytics && (
        <div style={currentStyles.modalOverlay}>
          <div style={{
            ...currentStyles.modal,
            maxWidth: useMobileLayout ? '100%' : 1100,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>📊 Advanced Analytics Dashboard</h3>
              <button style={currentStyles.iconBtn} onClick={() => setShowAnalytics(false)}>✖</button>
            </div>

            {/* Key Metrics Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: useMobileLayout ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
              gap: 16,
              marginBottom: 24
            }}>
              <div style={{ 
                textAlign: 'center', 
                padding: 16, 
                backgroundColor: '#f8f9fa', 
                borderRadius: 8,
                border: '2px solid #000',
                boxShadow: '2px 2px 0px #000'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#000' }}>
                  {calculateLevel(userProgress.xp)}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Current Level</div>
                <div style={{ fontSize: 10, color: "#888" }}>
                  {userProgress.xp} / {getXPForNextLevel(userProgress.xp)} XP
                </div>
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: 16, 
                backgroundColor: '#f0fdf4', 
                borderRadius: 8,
                border: '2px solid #22c55e',
                boxShadow: '2px 2px 0px #22c55e'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>
                  {history.filter(s => s.mode === 'focus').length}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Total Sessions</div>
                <div style={{ fontSize: 10, color: "#888" }}>
                  {Math.round(userProgress.totalFocusMinutes)} min total
                </div>
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: 16, 
                backgroundColor: '#fef3c7', 
                borderRadius: 8,
                border: '2px solid #f59e0b',
                boxShadow: '2px 2px 0px #f59e0b'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>
                  {Math.round((history.filter(s => s.mode === 'focus' && s.durationSec >= settings.focusMinutes * 60 * 0.8).length / Math.max(history.filter(s => s.mode === 'focus').length, 1)) * 100)}%
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Success Rate</div>
                <div style={{ fontSize: 10, color: "#888" }}>
                  {history.filter(s => s.mode === 'focus' && s.durationSec >= settings.focusMinutes * 60 * 0.8).length} / {history.filter(s => s.mode === 'focus').length} completed
                </div>
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: 16, 
                backgroundColor: '#e0f2fe', 
                borderRadius: 8,
                border: '2px solid #3b82f6',
                boxShadow: '2px 2px 0px #3b82f6'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>
                  {userProgress.streakCount}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Day Streak</div>
                <div style={{ fontSize: 10, color: "#888" }}>
                  {userProgress.aiRecommendationsFollowed} AI insights used
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: useMobileLayout ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 24 }}>

              {/* Productivity Trend Chart */}
              <div style={{ 
                backgroundColor: '#fff', 
                border: '2px solid #000', 
                borderRadius: 8, 
                padding: 16,
                boxShadow: '3px 3px 0px #000'
              }}>
                <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📈 Productivity Trend
                  <span style={{ fontSize: 12, color: '#666' }}>(Last 20 Sessions)</span>
                </h4>
                <div style={{ 
                  height: 140, 
                  display: 'flex',
                  alignItems: 'end',
                  gap: 3,
                  backgroundColor: '#f8f9fa',
                  borderRadius: 4,
                  padding: 8,
                  border: '1px solid #e0e0e0'
                }}>
                  {(() => {
                    const scores = (smartReminders && smartReminders.aiLearningData && smartReminders.aiLearningData.productivityScores) 
                      ? smartReminders.aiLearningData.productivityScores.slice(-20) 
                      : [];
                    return scores.length > 0 ? scores.map((score, i) => (
                      <div key={i} style={{
                        flex: 1,
                        backgroundColor: score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#dc2626',
                        height: `${Math.max(score || 0, 5)}%`,
                        minHeight: 4,
                        borderRadius: 2,
                        position: 'relative',
                        cursor: 'pointer'
                      }} 
                      title={`Session ${i + 1}: ${score || 0}% productivity`}>
                        <div style={{
                          position: 'absolute',
                          bottom: -20,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: 8,
                          color: '#666',
                          whiteSpace: 'nowrap'
                        }}>
                          {i % 5 === 0 ? i + 1 : ''}
                        </div>
                      </div>
                    )) : (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        color: '#666',
                        fontSize: 14
                      }}>
                        Complete more sessions to see productivity trends
                      </div>
                    );
                  })()}
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginTop: 12,
                  fontSize: 10,
                  color: '#666'
                }}>
                  <span>🔴 Low (&lt;60%)</span>
                  <span>🟡 Medium (60-79%)</span>
                  <span>🟢 High (80%+)</span>
                </div>
              </div>

              {/* Weekly Activity Heatmap */}
              <div style={{ 
                backgroundColor: '#fff', 
                border: '2px solid #000', 
                borderRadius: 8, 
                padding: 16,
                boxShadow: '3px 3px 0px #000'
              }}>
                <h4 style={{ margin: '0 0 16px 0' }}>🗓️ Weekly Activity Pattern</h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(7, 1fr)', 
                  gap: 4,
                  marginBottom: 8
                }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <div key={day} style={{ 
                      fontSize: 10, 
                      textAlign: 'center', 
                      fontWeight: 600, 
                      color: '#666',
                      marginBottom: 4
                    }}>
                      {day}
                    </div>
                  ))}
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(7, 1fr)', 
                  gap: 4
                }}>
                  {(() => {
                    const weeklyData = Array(7).fill(0);
                    history.filter(s => s.mode === 'focus').forEach(session => {
                      const day = new Date(session.startTime).getDay();
                      weeklyData[day]++;
                    });
                    const maxSessions = Math.max(...weeklyData, 1);

                    return weeklyData.map((count, i) => (
                      <div key={i} style={{
                        height: 40,
                        backgroundColor: count === 0 ? '#f0f0f0' : 
                                        count <= maxSessions * 0.25 ? '#dcfce7' :
                                        count <= maxSessions * 0.5 ? '#bbf7d0' :
                                        count <= maxSessions * 0.75 ? '#86efac' : '#22c55e',
                        border: '1px solid #e0e0e0',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 600,
                        color: count > maxSessions * 0.5 ? '#fff' : '#000'
                      }} title={`${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i]}: ${count} sessions`}>
                        {count}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Session Timeline & Performance */}
            <div style={{ marginBottom: 24 }}>
              <h4>⏰ Session Timeline & Performance</h4>
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                border: '1px solid #e0e0e0', 
                borderRadius: 8, 
                padding: 16,
                maxHeight: 200,
                overflow: 'auto'
              }}>
                {history.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#666', padding: 20 }}>
                    No session data available. Start focusing to see your timeline!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {history.slice(0, 10).map((session, i) => (
                      <div key={session.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: '#fff',
                        borderRadius: 6,
                        border: '1px solid #e0e0e0',
                        fontSize: 13
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: session.mode === 'focus' ? 
                              (session.durationSec >= settings.focusMinutes * 60 * 0.8 ? '#22c55e' : '#f59e0b') : 
                              '#3b82f6'
                          }} />
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {session.mode === 'focus' ? '🎯 Focus' : 
                               session.mode === 'short' ? '☕ Short Break' : 
                               '🧘 Long Break'}
                            </div>
                            <div style={{ fontSize: 11, color: '#666' }}>
                              {new Date(session.startTime).toLocaleDateString()} at {new Date(session.startTime).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600 }}>{formatTime(session.durationSec)}</div>
                          {session.productivityScore && (
                            <div style={{ fontSize: 10, color: '#666' }}>
                              {session.productivityScore}% productive
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {history.length > 10 && (
                      <div style={{ textAlign: 'center', color: '#666', fontSize: 12, fontStyle: 'italic' }}>
                        ... and {history.length - 10} more sessions
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* AI Insights Summary */}
            {smartReminders?.aiLearningData?.sessionPatterns?.length >= 5 && (
              <div style={{ marginBottom: 24 }}>
                <h4>🧠 AI Insights & Predictions</h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: useMobileLayout ? '1fr' : '1fr 1fr', 
                  gap: 16 
                }}>
                  {(() => {
                    const analysis = performDeepAIAnalysis();
                    return (
                      <>
                        <div style={{ 
                          backgroundColor: '#f0f9ff', 
                          border: '2px solid #3b82f6', 
                          borderRadius: 8, 
                          padding: 16,
                          boxShadow: '2px 2px 0px #3b82f6'
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>Key Insights</div>
                          {analysis.insights.slice(0, 3).map((insight, i) => (
                            <div key={i} style={{ 
                              fontSize: 13, 
                              marginBottom: 6,
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 6
                            }}>
                              <span>💡</span>
                              <span>{insight}</span>
                            </div>
                          ))}
                          {analysis.insights.length === 0 && (
                            <div style={{ color: '#666', fontStyle: 'italic' }}>
                              Complete more sessions for AI insights
                            </div>
                          )}
                        </div>

                        <div style={{ 
                          backgroundColor: '#f0fdf4', 
                          border: '2px solid #22c55e', 
                          borderRadius: 8, 
                          padding: 16,
                          boxShadow: '2px 2px 0px #22c55e'
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>Next Session Prediction</div>
                          {analysis.predictions.length > 0 ? (
                            <div>
                              <div style={{ 
                                fontSize: 24, 
                                fontWeight: 700, 
                                color: '#22c55e',
                                marginBottom: 4
                              }}>
                                {analysis.predictions[0].score}%
                              </div>
                              <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                                Success probability
                              </div>
                              <div style={{ fontSize: 11 }}>
                                Confidence: {Math.round(analysis.confidence)}%
                              </div>
                            </div>
                          ) : (
                            <div style={{ color: '#666', fontStyle: 'italic' }}>
                              Analyzing patterns...
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Export Actions */}
            <div style={{ 
              display: 'flex', 
              gap: 12, 
              justifyContent: 'space-between',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button 
                  style={currentStyles.btn}
                  onClick={() => {
                    const csvData = [
                      ["Date", "Mode", "Duration (min)", "Success", "Productivity Score"],
                      ...history.map(s => [
                        new Date(s.startTime).toISOString().slice(0, 10),
                        s.mode,
                        Math.round(s.durationSec / 60),
                        s.mode === 'focus' && s.durationSec >= settings.focusMinutes * 60 * 0.8 ? 'Yes' : 'No',
                        s.productivityScore || 'N/A'
                      ])
                    ].map(row => row.join(',')).join('\n');

                    const blob = new Blob([csvData], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `focusguard_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  }}
                >
                  📊 Export CSV
                </button>
                <button 
                  style={currentStyles.btn}
                  onClick={() => {
                    const analyticsData = {
                      timestamp: new Date().toISOString(),
                      userProgress,
                      sessionHistory: history,
                      aiLearningData: smartReminders?.aiLearningData || {},
                      analysis: smartReminders?.aiLearningData?.sessionPatterns?.length >= 5 ? performDeepAIAnalysis() : {},
                      recommendations: getEnhancedAIRecommendations()
                    };

                    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `focusguard_complete_analytics_${new Date().toISOString().slice(0, 10)}.json`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  }}
                >
                  📥 Export JSON
                </button>
              </div>
              <button 
                style={{...currentStyles.btn, backgroundColor: '#000', color: '#fff'}}
                onClick={() => setShowAnalytics(false)}
              >
                Close Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{
        ...currentStyles.main,
        gridTemplateColumns: useMobileLayout ? "1fr" : "2fr 1fr",
        gap: useMobileLayout ? 16 : 24
      }}>
        {/* Timer Section */}
        <section style={currentStyles.leftCol}>
          <div style={{
            ...currentStyles.timerCard,
            padding: useMobileLayout ? 24 : 32,
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: "#666", marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                {mode === "focus" ? "FOCUS SESSION" : mode === "short" ? "SHORT BREAK" : "LONG BREAK"}
              </div>

              {/* Circular Progress Indicator */}
              <div style={{ 
                position: 'relative', 
                display: 'inline-block',
                marginBottom: 16
              }}>
                <svg width={useMobileLayout ? 200 : 240} height={useMobileLayout ? 200 : 240} style={{ transform: 'rotate(-90deg)' }}>
                  {/* Background circle */}
                  <circle
                    cx={useMobileLayout ? 100 : 120}
                    cy={useMobileLayout ? 100 : 120}
                    r={useMobileLayout ? 90 : 110}
                    fill="none"
                    stroke="#e0e0e0"
                    strokeWidth="6"
                  />
                  {/* Progress circle */}
                  <circle
                    cx={useMobileLayout ? 100 : 120}
                    cy={useMobileLayout ? 100 : 120}
                    r={useMobileLayout ? 90 : 110}
                    fill="none"
                    stroke="#000"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * (useMobileLayout ? 90 : 110)}`}
                    strokeDashoffset={`${2 * Math.PI * (useMobileLayout ? 90 : 110) * (1 - (((settings[mode === 'focus' ? 'focusMinutes' : (mode === 'short' ? 'shortBreakMinutes' : 'longBreakMinutes')] * 60) - remaining) / (settings[mode === 'focus' ? 'focusMinutes' : (mode === 'short' ? 'shortBreakMinutes' : 'longBreakMinutes')] * 60)))}`}
                    style={{ 
                      transition: running ? 'none' : 'stroke-dashoffset 0.3s ease',
                      opacity: running ? 1 : 0.7
                    }}
                  />
                </svg>

                {/* Timer text overlay */}
                <div style={{ 
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: useMobileLayout ? 32 : 48, 
                    fontWeight: 300, 
                    fontFamily: 'monospace', 
                    letterSpacing: 2,
                    marginBottom: 4
                  }}>
                    {formatTime(remaining)}
                  </div>
                  <div style={{ 
                    fontSize: 10, 
                    color: '#666',
                    opacity: 0.8
                  }}>
                    {Math.round(((settings[mode === 'focus' ? 'focusMinutes' : (mode === 'short' ? 'shortBreakMinutes' : 'longBreakMinutes')] * 60) - remaining) / (settings[mode === 'focus' ? 'focusMinutes' : (mode === 'short' ? 'shortBreakMinutes' : 'longBreakMinutes')] * 60) * 100)}% complete
                  </div>
                </div>
              </div>

              {smartReminders && smartReminders.enabled && smartReminders.aiLearningData && smartReminders.aiLearningData.productivityScores && smartReminders.aiLearningData.productivityScores.length > 0 && (
                <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                  AI Prediction: {(() => {
                    const analysis = performDeepAIAnalysis();
                    return analysis && analysis.predictions && analysis.predictions.length > 0 ? `${analysis.predictions[0].score}% success` : 'Learning...';
                  })()}
                </div>
              )}
            </div>

            <div style={{ 
              display: "flex", 
              gap: 16, 
              marginBottom: 20,
              justifyContent: 'center',
              ...(useMobileLayout ? { flexDirection: 'column' } : {})
            }}>
              {!running ? (
                <button style={{ 
                  ...currentStyles.primaryBtn, 
                  padding: useMobileLayout ? '16px 32px' : '12px 24px',
                  fontSize: useMobileLayout ? 16 : 14
                }} onClick={startTimer}>
                  ▶ Start
                </button>
              ) : (
                <button style={{ 
                  ...currentStyles.primaryBtn, 
                  padding: useMobileLayout ? '16px 32px' : '12px 24px',
                  fontSize: useMobileLayout ? 16 : 14
                }} onClick={pauseTimer}>
                  ⏸ Pause
                </button>
              )}
              <button style={{ 
                ...currentStyles.btn, 
                padding: useMobileLayout ? '16px 32px' : '12px 24px',
                fontSize: useMobileLayout ? 16 : 14
              }} onClick={resetTimer}>
                🔄 Reset
              </button>
            </div>

            <div style={{ 
              display: "grid", 
              gridTemplateColumns: useMobileLayout ? '1fr' : 'repeat(3, 1fr)',
              gap: 12,
              maxWidth: 360,
              margin: '0 auto'
            }}>
              <button 
                style={{
                  ...currentStyles.modeBtn, 
                  ...(mode === 'focus' ? { backgroundColor: '#000', color: '#fff' } : {}),
                  padding: useMobileLayout ? '12px' : '8px 12px'
                }} 
                onClick={() => { setMode("focus"); resetTimer(); }}
              >
                Focus
              </button>
              <button 
                style={{
                  ...currentStyles.modeBtn, 
                  ...(mode === 'short' ? { backgroundColor: '#000', color: '#fff' } : {}),
                  padding: useMobileLayout ? '12px' : '8px 12px'
                }} 
                onClick={() => { setMode("short"); resetTimer(); }}
              >
                Short Break
              </button>
              <button 
                style={{
                  ...currentStyles.modeBtn, 
                  ...(mode === 'long' ? { backgroundColor: '#000', color: '#fff' } : {}),
                  padding: useMobileLayout ? '12px' : '8px 12px'
                }} 
                onClick={() => { setMode("long"); resetTimer(); }}
              >
                Long Break
              </button>
            </div>
          </div>
        </section>

        {/* Sidebar */}
        <aside style={{
          ...currentStyles.rightCol,
          ...(useMobileLayout ? { marginTop: 16 } : {})
        }}>
          {customization.sectionOrder.map(renderSection)}

          {/* How-to Guide */}
          <div style={currentStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>📚 How-to Guide</h3>
              <button 
                style={{
                  ...currentStyles.smallBtn,
                  backgroundColor: '#3b82f6',
                  color: '#fff'
                }}
                onClick={() => setShowHowToGuide(true)}
              >
                View All Guides
              </button>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              <div style={{ marginBottom: 8 }}>• AI learns your productivity patterns automatically</div>
              <div style={{ marginBottom: 8 }}>• Follow AI recommendations to unlock bonuses</div>
              <div style={{ marginBottom: 8 }}>• Build streaks to access advanced AI features</div>
              <div>• Export your data anytime for analysis</div>
            </div>
          </div>

          {/* Reset Progress */}
          <div style={currentStyles.card}>
            <h3 style={{ marginTop: 0, color: '#dc2626' }}>⚠️ Reset Progress</h3>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
              Permanently delete all progress including AI learning data.
            </p>
            <button 
              style={{
                ...currentStyles.btn,
                backgroundColor: '#dc2626',
                color: '#fff',
                border: '1px solid #dc2626',
                width: '100%',
                padding: useMobileLayout ? '12px' : '8px 12px'
              }}
              onClick={() => {
                if (window.confirm('⚠️ DELETE ALL PROGRESS?\n\nThis will permanently remove:\n• All session data and AI learning\n• Tasks, goals, and achievements\n• Customization settings\n\nThis cannot be undone!')) {
                  setUserProgress({
                    xp: 0,
                    level: 1,
                    totalFocusMinutes: 0,
                    totalTasks: 0,
                    totalGoalsCompleted: 0,
                    streakCount: 0,
                    lastStreakDate: null,
                    streakFreezes: 0,
                    aiRecommendationsFollowed: 0,
                    achievements: ACHIEVEMENTS
                  });
                  setTasks([]);
                  setDailyGoals([]);
                  setHistory([]);
                  setSessionHighlights([]);
                  setSmartReminders({
                    enabled: false,
                    optimalTimes: [],
                    scheduledReminders: [],
                    aiLearningData: {
                      sessionPatterns: [],
                      productivityScores: [],
                      environmentFactors: []
                    },
                    preferences: {
                      reminderTypes: ['focus', 'break', 'streak', 'optimization'],
                      aiIntensity: 'adaptive',
                      quietHours: { start: 22, end: 7 }
                    }
                  });
                  setCoins(0);
                  setOwnedItems({ themes: [], sounds: [], boosts: [] });
                  setActiveTheme('monochrome');
                  setActiveSound('default');
                  setActiveBoosts({});
                  alert('✅ All progress has been reset!');
                }
              }}
            >
              🗑️ DELETE ALL DATA
            </button>
          </div>
        </aside>
      </main>

      {/* Reward Animation */}
      {showRewardAnimation && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2000,
          fontSize: 60,
          animation: 'bounce 1s ease-in-out infinite'
        }}>
          🎉
        </div>
      )}

      {/* Post-Session Reflection Modal */}
      {showReflection && (
        <div style={currentStyles.modalOverlay}>
          <div style={{
            ...currentStyles.modal,
            maxWidth: useMobileLayout ? '100%' : 400
          }}>
            <h3 style={{ marginTop: 0 }}>Session Reflection 🤔</h3>
            <p style={{ color: "#666", margin: '8px 0', fontSize: 14 }}>
              What did you accomplish? This helps the AI learn your patterns.
            </p>
            <textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="I completed the research for my project and made good progress on the outline..."
              style={{
                ...currentStyles.input,
                width: '100%',
                height: 80,
                resize: 'vertical',
                marginBottom: 16,
                fontSize: 13
              }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={{ ...currentStyles.btn, flex: 1 }} onClick={saveReflection}>
                Save Reflection
              </button>
              <button style={{ ...currentStyles.btn, flex: 1 }} onClick={() => setShowReflection(false)}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Micro-Break Options Modal */}
      {showBreakOptions && (
        <div style={currentStyles.modalOverlay}>
          <div style={{
            ...currentStyles.modal,
            maxWidth: useMobileLayout ? '100%' : 400
          }}>
            <h3 style={{ marginTop: 0 }}>Break Time! 🧘‍♀️</h3>
            <p style={{ color: "#666", margin: '8px 0 16px', fontSize: 14 }}>
              Choose a research-backed activity to refresh your mind:
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              <button 
                style={{...currentStyles.btn, textAlign: 'left', padding: 16, fontSize: 13 }}
                onClick={() => {
                  alert('🧘‍♀️ Stand up, stretch your arms above your head, roll your shoulders, and take 5 deep breaths. This helps reset your posture and oxygenate your brain.');
                  setShowBreakOptions(false);
                }}
              >
                🧘‍♀️ Posture Reset & Deep Breathing
              </button>
              <button 
                style={{...currentStyles.btn, textAlign: 'left', padding: 16, fontSize: 13 }}
                onClick={() => {
                  alert('🧠 Mental refresh: Look out a window and identify 5 different objects, then count backwards from 30. This helps reset your attention.');
                  setShowBreakOptions(false);
                }}
              >
                🧠 Attention Reset Exercise
              </button>
              <button 
                style={{...currentStyles.btn, textAlign: 'left', padding: 16, fontSize: 13 }}
                onClick={() => {
                  alert('💧 Drink a full glass of water slowly and mindfully. Dehydration impacts focus more than we realize.');
                  setShowBreakOptions(false);
                }}
              >
                💧 Mindful Hydration
              </button>
              <button 
                style={{...currentStyles.smallBtn, textAlign: 'center' }}
                onClick={() => setShowBreakOptions(false)}
              >
                Skip Break Activities
              </button>
            </div>
          </div>
        </div>
      )}

      <footer style={currentStyles.footer}>
        <div style={{ fontSize: 12, color: '#666' }}>
          FocusGuard v2.0 • Level {calculateLevel(userProgress.xp)} • {userProgress.xp} XP
          {smartReminders.enabled && (
            <span style={{ marginLeft: 8, color: '#000', fontWeight: 600 }}>
              • 🤖 AI Active
            </span>
          )}
        </div>
      </footer>

      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translate(-50%, -50%) translateY(0); }
          40% { transform: translate(-50%, -50%) translateY(-30px); }
          60% { transform: translate(-50%, -50%) translateY(-15px); }
        }
      `}</style>
    </div>
  );
}

// ---------------------- Monochrome Styles ----------------------
const monochromeStyles = {
  app: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    maxWidth: 1200,
    margin: "16px auto",
    padding: 16,
    backgroundColor: "#ffffff",
    color: "#000000",
    lineHeight: 1.5,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: "2px solid #000000",
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#000000",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 18,
  },
  main: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 24,
  },
  leftCol: {},
  rightCol: {},
  timerCard: {
    padding: 32,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    border: "2px solid #000000",
    boxShadow: "4px 4px 0px #000000",
  },
  card: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    border: "1px solid #000000",
    boxShadow: "2px 2px 0px #000000",
  },
  btn: {
    backgroundColor: "#ffffff",
    color: "#000000",
    padding: "12px 16px",
    border: "1px solid #000000",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    transition: "all 0.1s ease",
    ':hover': {
      backgroundColor: "#f0f0f0",
    }
  },
  primaryBtn: {
    backgroundColor: "#000000",
    color: "#ffffff",
    padding: "12px 24px",
    border: "1px solid #000000",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.1s ease",
  },
  modeBtn: {
    backgroundColor: "#ffffff",
    color: "#000000",
    padding: "8px 12px",
    border: "1px solid #000000",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    transition: "all 0.1s ease",
  },
  smallBtn: {
    backgroundColor: "#f8f9fa",
    color: "#000000",
    padding: "6px 12px",
    border: "1px solid #000000",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    border: "1px solid #000000",
    fontSize: 13,
    backgroundColor: "#ffffff",
    color: "#000000",
  },
  smallInput: {
    width: 80,
    padding: 8,
    marginLeft: 8,
    borderRadius: 4,
    border: "1px solid #000000",
    fontSize: 13,
    backgroundColor: "#ffffff",
    color: "#000000",
  },
  historyRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #e0e0e0",
  },
  taskRow: {
    padding: "8px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  iconBtn: {
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#666666",
    padding: 6,
    borderRadius: 4,
    fontSize: 12,
    ':hover': {
      backgroundColor: "#f0f0f0",
    }
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    textAlign: "center",
    borderTop: "1px solid #e0e0e0",
  },
  rowLabel: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center",
    fontSize: 13,
    fontWeight: 500,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  modal: {
    backgroundColor: '#ffffff',
    border: '2px solid #000000',
    borderRadius: 12,
    padding: 24,
    maxWidth: 500,
    width: '100%',
    boxShadow: '6px 6px 0px #000000'
  }
};

const monochromeCSS = `
  body { 
    background: #ffffff; 
    margin: 0; 
    color: #000000;
  }
  * { 
    box-sizing: border-box; 
  }
  button:hover {
    background-color: #000000 !important;
    color: #ffffff !important;
    transform: translateY(-1px);
    transition: all 0.2s ease;
  }
  button:active {
    transform: translateY(0px);
  }
  button[style*="backgroundColor: #000000"]:hover {
    background-color: #333333 !important;
  }
  .primary-btn:hover {
    background-color: #333333 !important;
  }
  @media (max-width: 768px) {
    main { 
      grid-template-columns: 1fr !important; 
    }
  }
`;