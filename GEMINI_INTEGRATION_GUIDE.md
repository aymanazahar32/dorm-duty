# 🧠 Gemini AI Schedule Integration Guide

This guide explains how to use the AI-powered schedule optimization feature in the DormDuty app.

## 📋 Table of Contents

- [Overview](#overview)
- [Setup Instructions](#setup-instructions)
- [How to Use](#how-to-use)
- [Features](#features)
- [File Structure](#file-structure)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The Gemini AI integration allows users to:
1. **Upload their personal schedules** with free and busy time slots
2. **Select tasks** that need to be assigned (Cooking, Cleaning, Laundry, etc.)
3. **Get AI-powered suggestions** for optimal task assignments based on everyone's availability
4. **View confidence scores** and reasoning for each suggestion

---

## 🚀 Setup Instructions

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy your API key (starts with `AIza...`)

### 2. Configure the API Key

**Option A: Environment Variable (Recommended for production)**

1. Create a `.env` file in the `frontend` folder:
   ```bash
   cd frontend
   cp env.example .env
   ```

2. Add your API key:
   ```env
   REACT_APP_GEMINI_API_KEY=your_actual_api_key_here
   ```

3. Restart your development server:
   ```bash
   npm start
   ```

**Option B: Manual Entry (For testing)**

1. Navigate to `/schedule` page in the app
2. Enter your API key in the yellow banner at the top
3. Click "Save"

### 3. Install Dependencies (if needed)

```bash
cd frontend
npm install
```

### 4. Run the App

```bash
npm start
```

Visit `http://localhost:3000/schedule`

---

## 📖 How to Use

### Step 1: Add Your Schedule

1. Click **"Add Your Schedule"** button
2. Fill in your information:
   - **Name**: Your full name
   - **Room Number**: Your dorm room (optional)
   - **Preferences**: Any preferences like "I prefer mornings" (optional)

3. Add time slots:
   - Select **Day** (Monday-Sunday)
   - Set **Start Time** and **End Time**
   - Check **"I'm Busy"** if you're NOT available during this time
   - Add **Activity** name if busy (e.g., "Class", "Work")
   - Click **"Add Time Slot"**

4. Add multiple time slots for different days
5. Click **"Save Schedule"**

**Example Schedule:**
```
John Doe - Room 301
✅ Monday 9:00 AM - 12:00 PM (Free)
✅ Monday 2:00 PM - 5:00 PM (Free)
❌ Tuesday 10:00 AM - 2:00 PM (Busy - Class)
✅ Wednesday 6:00 PM - 9:00 PM (Free)
```

### Step 2: Wait for Others

- Each roommate/user needs to add their own schedule
- The more schedules added, the better the AI suggestions
- Minimum: 2 users recommended

### Step 3: Select Tasks

- Check the tasks you want to assign:
  - 🍳 **Cooking** (60 min)
  - 🧹 **Cleaning** (45 min)
  - 👕 **Laundry** (90 min)
  - 🍽️ **Dishes** (20 min)
  - 🗑️ **Trash** (10 min)
  - 🚽 **Bathroom** (30 min)

### Step 4: Optimize with AI

1. Click **"Optimize with AI"** button
2. Wait 5-10 seconds for AI processing
3. View suggestions below

### Step 5: Review AI Suggestions

Each suggestion shows:
- **Task name** (with icon)
- **Who** should do it
- **When** (day and time)
- **Confidence score** (High/Medium/Low)
- **AI reasoning** explaining why

**Example Suggestion:**
```
🍳 Cooking
👤 John Doe
📅 Monday
🕐 6:00 PM
✨ 95% High Confidence

💡 John is free Monday evenings and this is ideal 
   for dinner preparation. His schedule shows 
   consistent availability at this time.
```

---

## ✨ Features

### 1. Smart Schedule Management
- ✅ Add unlimited time slots per user
- ✅ Mark slots as free or busy
- ✅ Add activity labels (Class, Work, etc.)
- ✅ Add personal preferences
- ✅ Edit or delete schedules anytime

### 2. AI Optimization
- ✅ Considers everyone's availability
- ✅ Distributes tasks fairly
- ✅ Matches tasks to appropriate times (e.g., Cooking at meal times)
- ✅ Respects user preferences
- ✅ Provides confidence scores
- ✅ Explains reasoning for each assignment

### 3. Data Persistence
- ✅ Schedules saved in browser (localStorage)
- ✅ Survives page refreshes
- ✅ Export/import functionality

### 4. Visual Dashboard
- ✅ Real-time statistics
- ✅ Color-coded time slots
- ✅ Confidence badges
- ✅ Responsive design

---

## 📁 File Structure

```
frontend/src/
├── pages/
│   └── Schedule.jsx           # Main schedule optimization page
├── components/
│   ├── ScheduleForm.jsx       # Form to add new schedules
│   ├── ScheduleCard.jsx       # Display individual schedules
│   └── TaskSuggestions.jsx    # Display AI suggestions
├── services/
│   ├── geminiService.js       # Gemini API integration
│   └── scheduleService.js     # Schedule data management
└── App.js                     # Updated with /schedule route
```

---

## 🔧 API Reference

### GeminiService

#### `optimizeSchedules(schedules, tasks)`
Optimizes task assignments for multiple tasks.

**Parameters:**
- `schedules` (Array): Array of user schedules
- `tasks` (Array): Array of task names

**Returns:** Promise<Array> of suggestions

**Example:**
```javascript
import geminiService from './services/geminiService';

const suggestions = await geminiService.optimizeSchedules(
  [
    {
      userName: "John",
      roomNumber: "301",
      timeSlots: [
        { day: "Monday", startTime: "09:00", endTime: "12:00", isBusy: false }
      ]
    }
  ],
  ["Cooking", "Cleaning"]
);
```

#### `findBestTimeForTask(task, schedules, durationMinutes)`
Finds best time for a single task.

**Parameters:**
- `task` (string): Task name
- `schedules` (Array): Array of user schedules
- `durationMinutes` (number): Estimated duration

**Returns:** Promise<Object> single suggestion

#### `analyzeScheduleConflicts(schedules)`
Analyzes schedules for conflicts.

**Returns:** Promise<Object> with conflicts and recommendations

### ScheduleService

#### `getSchedules()`
Get all saved schedules.

#### `addSchedule(schedule)`
Add a new schedule.

#### `deleteSchedule(id)`
Delete a schedule by ID.

#### `validateSchedule(schedule)`
Validate schedule data.

---

## 🐛 Troubleshooting

### Error: "API Key Not Found"

**Solution:**
- Create `.env` file in `frontend` folder
- Add: `REACT_APP_GEMINI_API_KEY=your_key`
- Restart: `npm start`

### Error: "API error (404)"

**Solution:**
- The Gemini model name might have changed
- Check [Google AI docs](https://ai.google.dev/docs) for latest model names
- Update `GEMINI_API_URL` in `geminiService.js`

### Error: "No valid JSON found"

**Solution:**
- This happens when AI doesn't return perfect JSON
- The app will automatically use fallback suggestions
- Try again or check your schedule format

### Schedules Not Saving

**Solution:**
- Check browser localStorage isn't full
- Try clearing old data: Dev Tools > Application > Local Storage
- Check browser privacy settings allow localStorage

### Low Confidence Scores

**Possible Reasons:**
- Too few free time slots
- Conflicting schedules
- Unclear preferences

**Solutions:**
- Add more free time slots
- Update schedule with more availability
- Add preferences to help AI understand

### API Rate Limits

**Free tier limits:**
- 60 requests per minute
- 1,500 requests per day

**Solutions:**
- Wait a few minutes between optimizations
- Upgrade to paid tier if needed

---

## 💡 Best Practices

### 1. Schedule Entry
- ✅ Add at least 3-5 time slots per week
- ✅ Be specific with busy activities
- ✅ Include preferences for better matching
- ✅ Update schedules when they change

### 2. Task Selection
- ✅ Start with 3-4 main tasks
- ✅ Consider task durations
- ✅ Don't select all tasks at once (can overwhelm AI)

### 3. Using Suggestions
- ✅ Review confidence scores
- ✅ Read AI reasoning
- ✅ Adjust if needed based on team input
- ✅ Re-run optimization if schedules change

### 4. Team Coordination
- ✅ Have everyone add schedules before optimizing
- ✅ Discuss AI suggestions as a team
- ✅ Update schedules weekly
- ✅ Re-optimize when adding new tasks

---

## 🔒 Security & Privacy

- ✅ API key stored in environment variables (not committed to Git)
- ✅ Schedules stored locally in browser (not sent to external servers except Gemini API)
- ✅ No personal data collected
- ✅ Can clear all data anytime

---

## 📊 Example Use Case

**Scenario:** 3 roommates need to assign weekly chores

**Step 1: Everyone adds schedules**
```
Alice: Free M/W/F mornings, busy T/Th (classes)
Bob: Free T/Th evenings, busy M/W/F (work)
Carol: Free weekends, busy M-F 9-5 (work)
```

**Step 2: Select tasks**
- Cooking (dinner prep)
- Cleaning (common areas)
- Laundry

**Step 3: AI suggests**
```
🍳 Cooking → Bob, Thursday 6pm (90% confidence)
   "Bob is free Thursday evenings, ideal for dinner"

🧹 Cleaning → Alice, Monday 10am (85% confidence)
   "Alice has morning availability, good for cleaning"

👕 Laundry → Carol, Saturday 2pm (95% confidence)
   "Carol is free weekends, perfect for longer tasks"
```

**Result:** Fair distribution, everyone assigned to their available times!

---

## 🆘 Support

### Need Help?

1. Check this guide first
2. Look at console errors (F12 > Console)
3. Try the standalone test file: `test-gemini.html`
4. Check [Google AI docs](https://ai.google.dev/docs)

### Report Issues

Found a bug? Open an issue with:
- Description of the problem
- Steps to reproduce
- Screenshots (if applicable)
- Browser and version

---

## 🎉 Success!

You're now ready to use AI-powered schedule optimization! 

**Quick Start:**
1. Visit `/schedule` page
2. Add your schedule
3. Select tasks
4. Click "Optimize with AI"
5. Review suggestions

Happy scheduling! 🚀
