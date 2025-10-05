# 🧠 Gemini AI Integration - Complete Setup

## ✅ What Was Created

### Core Services
1. **`src/services/geminiService.js`** - Gemini API client
   - Handles API calls to Gemini 2.0 Flash
   - Optimizes schedules for multiple tasks
   - Finds best time for individual tasks
   - Analyzes schedule conflicts
   - Generates fallback suggestions

2. **`src/services/scheduleService.js`** - Schedule data management
   - Local storage persistence
   - CRUD operations for schedules
   - Validation
   - Import/Export functionality

### React Components
3. **`src/pages/Schedule.jsx`** - Main schedule optimizer page
   - Dashboard with statistics
   - API key configuration
   - Task selection
   - Optimization button
   - Results display

4. **`src/components/ScheduleForm.jsx`** - Add schedule form
   - User information input
   - Time slot management
   - Busy/Free time marking
   - Activity labels

5. **`src/components/ScheduleCard.jsx`** - Display schedule cards
   - User details
   - Time slots visualization
   - Delete functionality
   - Color-coded availability

6. **`src/components/TaskSuggestions.jsx`** - AI suggestions display
   - Task assignments
   - Confidence scores
   - AI reasoning
   - Statistics dashboard

### Configuration & Documentation
7. **`src/App.js`** - Updated with /schedule route
8. **`src/components/Navbar.jsx`** - Added Schedule tab
9. **`env.example`** - Environment variable template
10. **`GEMINI_INTEGRATION_GUIDE.md`** - Complete documentation
11. **`AI_SCHEDULE_QUICKSTART.md`** - Quick start guide

---

## 🚀 Quick Start (3 Steps)

### Step 1: Get API Key
```bash
# Visit: https://makersuite.google.com/app/apikey
# Click "Create API Key"
# Copy your key
```

### Step 2: Configure
```bash
cd frontend

# Create .env file
echo "REACT_APP_GEMINI_API_KEY=your_key_here" > .env
```

### Step 3: Run
```bash
npm install
npm start
```

Visit: `http://localhost:3000/schedule`

---

## 📁 File Structure

```
frontend/
├── src/
│   ├── services/
│   │   ├── geminiService.js        ← AI integration
│   │   └── scheduleService.js      ← Data management
│   ├── pages/
│   │   └── Schedule.jsx            ← Main page
│   ├── components/
│   │   ├── ScheduleForm.jsx        ← Add schedule
│   │   ├── ScheduleCard.jsx        ← Display schedule
│   │   ├── TaskSuggestions.jsx     ← Show AI results
│   │   └── Navbar.jsx              ← Updated navigation
│   └── App.js                      ← Updated routes
├── env.example                      ← API key template
├── GEMINI_SETUP.md                 ← This file
└── AI_SCHEDULE_QUICKSTART.md       ← Quick guide
```

---

## 🎯 How It Works

### 1. User Flow
```
User uploads schedule
    ↓
Other users upload schedules
    ↓
Select tasks to assign
    ↓
Click "Optimize with AI"
    ↓
Gemini API analyzes availability
    ↓
Returns optimal assignments
    ↓
Display with confidence scores
```

### 2. API Integration
```javascript
// geminiService.js
const suggestions = await geminiService.optimizeSchedules(
  schedules,  // All user schedules
  tasks       // Selected tasks
);

// Returns:
[
  {
    task: "Cooking",
    assignedTo: "John Doe",
    day: "Monday",
    time: "18:00",
    confidence: 0.95,
    reasoning: "John is free Monday evenings..."
  }
]
```

### 3. Data Storage
```javascript
// scheduleService.js
// Saves to localStorage
localStorage.setItem('dormduty_schedules', JSON.stringify(schedules));

// Persists across sessions
const schedules = scheduleService.getSchedules();
```

---

## 🔧 API Key Configuration

### Method 1: Environment Variable (Recommended)
```bash
# Create .env in frontend folder
REACT_APP_GEMINI_API_KEY=AIzaSy...your_key_here
```

### Method 2: In-App Entry
- Navigate to `/schedule`
- Yellow banner appears
- Enter API key
- Click "Save"

### Method 3: Directly in Code (Not recommended)
```javascript
// src/services/geminiService.js
constructor() {
  this.apiKey = 'your_key_here';  // ⚠️ Don't commit this
}
```

---

## 🎨 Features

### Schedule Management
- ✅ Add unlimited users
- ✅ Multiple time slots per user
- ✅ Mark as Free or Busy
- ✅ Add activity labels (Class, Work)
- ✅ Personal preferences
- ✅ Edit/Delete schedules
- ✅ Export/Import JSON

### AI Optimization
- ✅ Multi-task optimization
- ✅ Fair distribution
- ✅ Time-of-day matching
- ✅ Conflict avoidance
- ✅ Preference consideration
- ✅ Confidence scoring
- ✅ Detailed reasoning

### UI/UX
- ✅ Real-time statistics
- ✅ Color-coded slots
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling
- ✅ Mobile-friendly

---

## 🧪 Testing

### Test the Integration

1. **Add Test Schedules:**
```javascript
// User 1
Name: John Doe
Room: 301
Free: Mon 9-12, Wed 14-18
Busy: Tue 10-14 (Class)

// User 2
Name: Sarah Smith
Room: 302
Free: Tue 16-20, Thu 10-14
Busy: Mon 9-17 (Work)
```

2. **Select Tasks:**
- Cooking
- Cleaning
- Laundry

3. **Run Optimization:**
- Click "Optimize with AI"
- Wait 5-10 seconds
- View suggestions

4. **Expected Result:**
```
🍳 Cooking → John, Monday 11:00
   95% Confidence - "Morning availability ideal"

🧹 Cleaning → Sarah, Thursday 11:00
   90% Confidence - "Free morning slot"

👕 Laundry → John, Wednesday 15:00
   88% Confidence - "Afternoon availability"
```

---

## 🐛 Troubleshooting

### Common Issues

**1. "No API key found"**
```bash
# Solution: Create .env file
cd frontend
echo "REACT_APP_GEMINI_API_KEY=your_key" > .env
npm start  # Restart required
```

**2. "API error (404): model not found"**
```javascript
// Solution: Update model name in geminiService.js
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
```

**3. "Schedules not saving"**
```javascript
// Solution: Check localStorage
// Open DevTools > Application > Local Storage
// Clear if needed: localStorage.clear()
```

**4. "Low confidence scores"**
```
Reasons:
- Too few time slots
- Conflicting schedules
- Limited availability

Solutions:
- Add more free time slots
- Update schedule with more details
- Add preferences
```

**5. lint errors about 'process'**
```
These are expected - the files use Node.js environment variables
They work fine in React apps (Create React App handles it)
If you want to fix them: npm install --save-dev @types/node
```

---

## 📊 API Limits

### Free Tier (Gemini API)
- **60 requests per minute**
- **1,500 requests per day**
- Each optimization = 1 request

### Best Practices
- Don't spam optimize button
- Cache results in localStorage
- Use fallback for errors
- Consider rate limiting

---

## 🔒 Security

### ✅ What's Secure
- API key in environment variables
- Not committed to Git (.env in .gitignore)
- Local data storage (localStorage)
- No backend required

### ⚠️ Important
- Never commit API keys
- Don't hardcode keys in code
- Use environment variables
- Add .env to .gitignore

---

## 🚀 Deployment

### Development
```bash
npm start
# Runs on localhost:3000
```

### Production Build
```bash
npm run build
# Creates optimized build in build/

# Set API key in hosting platform
# Example (Vercel):
# Dashboard > Settings > Environment Variables
# REACT_APP_GEMINI_API_KEY = your_key
```

### Hosting Options
- **Vercel** - Easiest, free tier
- **Netlify** - Great for React
- **GitHub Pages** - Free hosting
- **Firebase Hosting** - Google integration

---

## 📚 Additional Resources

### Documentation
- Full guide: `GEMINI_INTEGRATION_GUIDE.md`
- Quick start: `AI_SCHEDULE_QUICKSTART.md`
- Gemini docs: https://ai.google.dev/docs

### Code Examples
```javascript
// Import services
import geminiService from './services/geminiService';
import scheduleService from './services/scheduleService';

// Get schedules
const schedules = scheduleService.getSchedules();

// Optimize
const suggestions = await geminiService.optimizeSchedules(
  schedules,
  ['Cooking', 'Cleaning', 'Laundry']
);

// Save results
scheduleService.saveSuggestions(suggestions);
```

---

## ✨ Next Steps

### Immediate
1. ✅ Get API key
2. ✅ Configure .env
3. ✅ Run npm start
4. ✅ Test with sample data

### Future Enhancements
- 🔄 Connect to backend/database
- 📱 Mobile app version
- 🔔 Push notifications
- 📧 Email assignments
- 👥 User authentication
- 📅 Calendar integration
- 🤝 Team collaboration
- 📈 Analytics dashboard

---

## 🎉 You're All Set!

The Gemini AI integration is complete and ready to use!

**Navigation:** Home → Schedule tab (bottom nav)

**Quick Test:**
1. Add 2-3 schedules
2. Select 3 tasks
3. Click "Optimize with AI"
4. View suggestions!

Happy scheduling! 🧠✨
