# 🚀 Quick Reference Card - Gemini AI Integration

## ⚡ 30-Second Setup

```bash
# 1. Get API key: https://makersuite.google.com/app/apikey
# 2. Configure
cd frontend
echo "REACT_APP_GEMINI_API_KEY=your_key_here" > .env

# 3. Run
npm start

# 4. Visit: http://localhost:3000/schedule
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `frontend/src/services/geminiService.js` | AI API calls |
| `frontend/src/services/scheduleService.js` | Data management |
| `frontend/src/pages/Schedule.jsx` | Main page |
| `frontend/src/components/ScheduleForm.jsx` | Add schedule |
| `frontend/src/components/TaskSuggestions.jsx` | Show results |

---

## 🎯 Usage Flow

```
1. Click "Add Your Schedule"
   ↓
2. Fill in name, room, time slots
   ↓
3. Wait for others to add theirs
   ↓
4. Select tasks (🍳 🧹 👕)
   ↓
5. Click "Optimize with AI"
   ↓
6. View AI suggestions!
```

---

## 💻 Code Snippets

### Import Services
```javascript
import geminiService from './services/geminiService';
import scheduleService from './services/scheduleService';
```

### Get Schedules
```javascript
const schedules = scheduleService.getSchedules();
```

### Optimize
```javascript
const suggestions = await geminiService.optimizeSchedules(
  schedules,
  ['Cooking', 'Cleaning', 'Laundry']
);
```

### Add Schedule
```javascript
scheduleService.addSchedule({
  userName: "John Doe",
  roomNumber: "301",
  timeSlots: [
    { day: "Monday", startTime: "09:00", endTime: "12:00", isBusy: false }
  ]
});
```

---

## 🐛 Quick Fixes

| Error | Fix |
|-------|-----|
| No API key | Add to `.env` file |
| API 404 | Update model name in `geminiService.js` |
| No suggestions | Add more schedules (need 2+) |
| Low confidence | Add more time slots |
| Data not saving | Check localStorage not full |

---

## 📊 Example Data

### Test Schedule
```javascript
{
  userName: "Alice",
  roomNumber: "301",
  preferences: "Morning person",
  timeSlots: [
    { day: "Monday", startTime: "09:00", endTime: "12:00", isBusy: false },
    { day: "Tuesday", startTime: "10:00", endTime: "14:00", isBusy: true, activity: "Class" },
    { day: "Wednesday", startTime: "14:00", endTime: "18:00", isBusy: false }
  ]
}
```

### Expected Output
```javascript
{
  task: "Cooking",
  assignedTo: "Alice",
  day: "Monday",
  time: "11:00",
  confidence: 0.92,
  reasoning: "Alice prefers mornings and has availability"
}
```

---

## 🎨 Available Tasks

| Task | Icon | Duration |
|------|------|----------|
| Cooking | 🍳 | 60 min |
| Cleaning | 🧹 | 45 min |
| Laundry | 👕 | 90 min |
| Dishes | 🍽️ | 20 min |
| Trash | 🗑️ | 10 min |
| Bathroom | 🚽 | 30 min |

---

## 📚 Documentation Links

- **Quick Start**: `frontend/AI_SCHEDULE_QUICKSTART.md`
- **Setup Guide**: `frontend/GEMINI_SETUP.md`
- **Full Docs**: `GEMINI_INTEGRATION_GUIDE.md`
- **Summary**: `IMPLEMENTATION_SUMMARY.md`

---

## 🔑 Environment Variables

```bash
# .env file in frontend/
REACT_APP_GEMINI_API_KEY=AIzaSy...your_key_here
```

---

## 🌐 API Info

- **Model**: Gemini 2.0 Flash (Experimental)
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`
- **Free Tier**: 60 req/min, 1,500 req/day
- **Response Time**: 5-10 seconds

---

## 🧪 Quick Test

```bash
# Test with sample data
1. Add "John" with Mon 9-12 free
2. Add "Sarah" with Tue 14-18 free
3. Select "Cooking" task
4. Click "Optimize"
5. Should suggest one of them!
```

---

## ✅ Checklist

Before first use:
- [ ] Get API key from Google AI Studio
- [ ] Create `.env` file with key
- [ ] Run `npm install` in frontend
- [ ] Run `npm start`
- [ ] Navigate to `/schedule`

Ready to optimize:
- [ ] At least 2 schedules uploaded
- [ ] At least 1 task selected
- [ ] API key configured
- [ ] Internet connection active

---

## 🎉 Success!

If you see AI suggestions with confidence scores, you're all set!

**Questions?** Check the full documentation.

**Issues?** Open browser console (F12) for errors.

---

Made with 🧠 & ❤️ for DormDuty
