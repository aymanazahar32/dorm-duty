# 🚀 AI Schedule Optimizer - Quick Start

Get your AI-powered schedule optimization running in **5 minutes**!

## ⚡ Quick Setup

### 1. Get API Key (2 minutes)

Visit: https://makersuite.google.com/app/apikey
- Sign in with Google
- Click "Create API Key"
- Copy your key

### 2. Add API Key (1 minute)

**Option A: Environment Variable**
```bash
# In the frontend folder, create .env file
echo "REACT_APP_GEMINI_API_KEY=your_key_here" > .env
```

**Option B: In-App Entry**
- Just run the app and enter key when prompted

### 3. Run the App (1 minute)

```bash
cd frontend
npm install  # if first time
npm start
```

Visit: `http://localhost:3000/schedule`

### 4. Add Schedules (1 minute)

1. Click "Add Your Schedule"
2. Enter your name and room
3. Add time slots (when you're free/busy)
4. Save

### 5. Get AI Suggestions!

1. Select tasks (Cooking, Cleaning, etc.)
2. Click "Optimize with AI"
3. View intelligent suggestions! 🎉

---

## 📸 What You'll See

```
│  🧠 AI Schedule Optimizer            │
├──────────────────────────────────────┤
│                                      │
│  [Add Your Schedule Button]          │
│                                      │
│  📤 Upload Schedule (NEW!)           │
│  ┌────────────────────────────────┐ │
│  │  📸 Upload Image or PDF        │ │
│  │  AI extracts automatically!    │ │
│  │  [Choose File]                 │ │
│  │         OR                     │ │
│  │  📝 Enter Manually             │ │
│  └────────────────────────────────┘ │
│                                      │
│  📅 Uploaded Schedules:              │
│  ┌────────────────┐ ┌──────────────┐│
│  │ John Doe       │ │ Sarah Smith  ││
│  │ Room 301       │ │ Room 302     ││
│  │ 5 free slots   │ │ 4 free slots ││
│  └────────────────┘ └──────────────┘│
│                                      │
│  📋 Select Tasks:                    │
│  [✓🍳] [✓🧹] [✓👕] [ 🍽️] [ 🗑️]      │
│                                      │
│  [✨ Optimize with AI]               │
│                                      │
│  🤖 AI Suggestions:                  │
│  ┌─────────────────────────────────┐│
│  │🍳 Cooking → John, Mon 6pm      ││
│  │✨ 95% High Confidence          ││
│  │💡 "John is free Mon evenings"  ││
│  └─────────────────────────────────┘│
└──────────────────────────────────────┘

**Scenario:** 3 roommates, 3 tasks

```javascript
// Alice's Schedule
Free: Mon/Wed/Fri mornings
Busy: Tue/Thu (classes)

// Bob's Schedule  
Free: Tue/Thu evenings
Busy: Mon/Wed/Fri (work)

// Carol's Schedule
Free: Weekends
Busy: Mon-Fri 9-5 (work)

// AI Suggests:
🍳 Cooking → Bob (Thu 6pm) - "Perfect evening slot"
🧹 Cleaning → Alice (Mon 10am) - "Morning availability"
👕 Laundry → Carol (Sat 2pm) - "Weekend free time"
```

**Result:** Everyone gets tasks during their free time! 🎉

---

## 💡 Pro Tips

1. **Add detailed schedules** - More time slots = better suggestions
2. **Include preferences** - "I prefer mornings" helps AI decide
3. **Mark busy times** - Classes, work, etc.
4. **Check confidence scores** - 80%+ are usually spot-on
5. **Re-run after changes** - Update schedules weekly

---

## 🔥 Cool Features

- ✨ **Smart AI** - Considers availability, fairness, time of day
- 💾 **Auto-save** - Schedules persist in browser
- 📊 **Real-time stats** - See users, slots, suggestions
- 🎨 **Beautiful UI** - Color-coded, responsive design
- 🔒 **Private** - Data stays in your browser

---

## ❓ Troubleshooting

**"No API key"** → Add to `.env` or enter in app
**"No suggestions"** → Add more schedules (need 2+ users)
**"Low confidence"** → Add more free time slots
**"API error"** → Check API key is correct

---

## 📚 Full Documentation

See `GEMINI_INTEGRATION_GUIDE.md` for complete details:
- API reference
- Advanced features
- Troubleshooting
- Best practices

---

## 🎊 That's It!

You're ready to use AI-powered scheduling!

**Navigation:** Click on your Navbar → Schedule page

**Questions?** Check the full guide or console (F12)

Happy scheduling! 🚀
