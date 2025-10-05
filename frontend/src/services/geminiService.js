/**
 * Gemini AI Service
 * Handles all interactions with Google's Gemini API for schedule optimization
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

class GeminiService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY || '';
  }

  /**
   * Set API key dynamically
   */
  setApiKey(key) {
    this.apiKey = key;
  }

  /**
   * Make API call to Gemini
   */
  async callGemini(prompt, imageData = null) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured. Please add REACT_APP_GEMINI_API_KEY to your .env file');
    }

    // Use base URL and send API key in headers instead of URL query
    const url = GEMINI_API_URL;

    // Build parts array - text prompt + optional image
    const parts = [{ text: prompt }];
    
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.data
        }
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({ parts })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Unexpected API response structure');
    }
    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Extract JSON from AI response
   */
  extractJSON(response, isArray = false) {
    const startChar = isArray ? '[' : '{';
    const endChar = isArray ? ']' : '}';
    
    const firstIndex = response.indexOf(startChar);
    const lastIndex = response.lastIndexOf(endChar);
    
    if (firstIndex === -1 || lastIndex === -1 || lastIndex <= firstIndex) {
      throw new Error('No valid JSON found in AI response');
    }
    
    const jsonString = response.substring(firstIndex, lastIndex + 1);
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error(`Failed to parse JSON from AI response: ${error.message}`);
    }
  }

  /**
   * Optimize schedules for multiple tasks
   * @param {Array} schedules - Array of user schedules
   * @param {Array} tasks - Array of tasks to assign (e.g., ['Cooking', 'Cleaning', 'Laundry'])
   * @returns {Promise<Array>} Array of task suggestions
   */
  async optimizeSchedules(schedules, tasks) {
    const prompt = this.buildOptimizationPrompt(schedules, tasks);
    const response = await this.callGemini(prompt);
    return this.extractJSON(response, true);
  }

  /**
   * Find best time for a single task
   * @param {string} task - Task name
   * @param {Array} schedules - Array of user schedules
   * @param {number} durationMinutes - Estimated task duration
   * @returns {Promise<Object>} Single task suggestion
   */
  async findBestTimeForTask(task, schedules, durationMinutes = 30) {
    const prompt = this.buildSingleTaskPrompt(task, schedules, durationMinutes);
    const response = await this.callGemini(prompt);
    return this.extractJSON(response, false);
  }

  /**
   * Analyze schedules for conflicts and provide recommendations
   * @param {Array} schedules - Array of user schedules
   * @returns {Promise<Object>} Analysis with conflicts and recommendations
   */
  async analyzeScheduleConflicts(schedules) {
    const prompt = this.buildAnalysisPrompt(schedules);
    const response = await this.callGemini(prompt);
    return this.extractJSON(response, false);
  }

  /**
   * Build prompt for optimizing multiple tasks
   */
  buildOptimizationPrompt(schedules, tasks) {
    let prompt = `You are a scheduling assistant for a dorm. Analyze the following user schedules and optimize task assignments.

USERS AND THEIR SCHEDULES:
`;

    schedules.forEach(schedule => {
      prompt += `\n\nUser: ${schedule.userName} (Room ${schedule.roomNumber || 'N/A'})\n`;
      
      if (schedule.preferences) {
        prompt += `Preferences: ${schedule.preferences}\n`;
      }
      
      prompt += 'Available Times:\n';
      
      const freeSlots = schedule.timeSlots.filter(slot => !slot.isBusy);
      if (freeSlots.length === 0) {
        prompt += '  - No free time slots available\n';
      } else {
        freeSlots.forEach(slot => {
          prompt += `  - ${slot.day}: ${slot.startTime} - ${slot.endTime}\n`;
        });
      }
      
      // Include busy times for context
      const busySlots = schedule.timeSlots.filter(slot => slot.isBusy);
      if (busySlots.length > 0) {
        prompt += 'Busy Times:\n';
        busySlots.forEach(slot => {
          prompt += `  - ${slot.day}: ${slot.startTime} - ${slot.endTime} (${slot.activity || 'Busy'})\n`;
        });
      }
    });

    prompt += `\n\nTASKS TO ASSIGN: ${tasks.join(', ')}\n\n`;
    prompt += `INSTRUCTIONS:
1. Assign each task to the most suitable person based on their availability
2. Distribute tasks fairly among all users (each person should get roughly equal number of tasks)
3. Avoid scheduling conflicts
4. Consider task duration and time of day suitability:
   - Cooking: Best during meal times (7-9am breakfast, 12-2pm lunch, 6-8pm dinner)
   - Cleaning: Can be done anytime, prefer morning or afternoon
   - Laundry: Best during daytime hours (9am-6pm)
5. Consider user preferences if provided
6. Return suggestions in this exact JSON format:

[
  {
    "task": "Cooking",
    "assignedTo": "John Smith",
    "day": "Monday",
    "time": "18:00",
    "confidence": 0.95,
    "reasoning": "John is free Monday evenings and this is ideal for dinner preparation"
  }
]

Return ONLY the JSON array, no additional text before or after.`;

    return prompt;
  }

  /**
   * Build prompt for finding best time for single task
   */
  buildSingleTaskPrompt(task, schedules, durationMinutes) {
    let prompt = `Find the best person and time for the following task: ${task}
Task duration: approximately ${durationMinutes} minutes

AVAILABLE USERS:
`;

    schedules.forEach(schedule => {
      const freeSlots = schedule.timeSlots.filter(slot => !slot.isBusy);
      prompt += `\n${schedule.userName} (Room ${schedule.roomNumber || 'N/A'}):\n`;
      
      if (freeSlots.length === 0) {
        prompt += '  - No free time available\n';
      } else {
        freeSlots.forEach(slot => {
          prompt += `  - ${slot.day} ${slot.startTime}-${slot.endTime}\n`;
        });
      }
    });

    prompt += `\nReturn the best assignment in this exact JSON format:
{
  "task": "${task}",
  "assignedTo": "user name",
  "day": "day of week",
  "time": "HH:MM",
  "confidence": 0.0-1.0,
  "reasoning": "explanation why this is the best time"
}

Return ONLY the JSON object, no additional text.`;

    return prompt;
  }

  /**
   * Build prompt for analyzing schedule conflicts
   */
  buildAnalysisPrompt(schedules) {
    let prompt = `Analyze the following schedules for potential conflicts and provide recommendations:

SCHEDULES:
`;

    schedules.forEach(schedule => {
      prompt += `\n${schedule.userName}: ${schedule.timeSlots.length} time slots\n`;
      schedule.timeSlots.forEach(slot => {
        prompt += `  - ${slot.day} ${slot.startTime}-${slot.endTime} (${slot.isBusy ? 'Busy' : 'Free'})\n`;
      });
    });

    prompt += `\nAnalyze for:
1. Users with too few free time slots
2. Users with overlapping busy/free times
3. Uneven distribution of availability
4. Best practices for task distribution

Return analysis in this exact JSON format:
{
  "conflicts": number of conflicts found,
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}

Return ONLY the JSON object, no additional text.`;

    return prompt;
  }

  /**
   * Generate fallback suggestions when API fails
   */
  generateFallbackSuggestions(schedules, tasks) {
    const suggestions = [];
    
    // Simple round-robin assignment
    tasks.forEach((task, index) => {
      const userIndex = index % schedules.length;
      const schedule = schedules[userIndex];
      
      const freeSlots = schedule.timeSlots.filter(slot => !slot.isBusy);
      
      if (freeSlots.length > 0) {
        const slot = freeSlots[0];
        suggestions.push({
          task,
          assignedTo: schedule.userName,
          day: slot.day,
          time: slot.startTime,
          confidence: 0.6,
          reasoning: 'Based on availability (offline mode - AI unavailable)',
        });
      }
    });
    
    return suggestions;
  }

  /**
   * Convert file to base64
   */
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Extract schedule data from uploaded image or PDF
   * @param {File} file - Image or PDF file
   * @returns {Promise<Object>} Extracted schedule data
   */
  async extractScheduleFromFile(file) {
    // Validate file type
    const validTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf'
    ];
    
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload an image (JPG, PNG, GIF, WebP) or PDF.');
    }

    // Convert file to base64
    const base64Data = await this.fileToBase64(file);

    // Build prompt for schedule extraction
    const prompt = `Analyze this schedule image/document and extract the following information:

1. Person's name (if visible)
2. All time slots with:
   - Day of week (Monday-Sunday)
   - Start time (HH:MM format, 24-hour)
   - End time (HH:MM format, 24-hour)
   - Whether the person is BUSY or FREE during this time
   - Activity name if busy (e.g., "Class", "Work", "Meeting")

3. Any preferences or notes mentioned

Look for:
- Calendar views
- Class schedules
- Work schedules
- Timetables
- Any time-based information

Return the data in this exact JSON format:
{
  "userName": "extracted name or Unknown",
  "roomNumber": "extracted room number if visible or empty string",
  "preferences": "any preferences or notes found",
  "timeSlots": [
    {
      "day": "Monday",
      "startTime": "09:00",
      "endTime": "12:00",
      "isBusy": true,
      "activity": "Class"
    }
  ]
}

IMPORTANT:
- Use 24-hour time format (00:00 to 23:59)
- If free time is shown, set isBusy to false
- If busy time is shown, set isBusy to true
- Include as many time slots as you can identify
- If no name is visible, use "Unknown"
- Return ONLY the JSON object, no additional text`;

    // Call Gemini with image
    const response = await this.callGemini(prompt, {
      mimeType: file.type,
      data: base64Data
    });

    // Extract and parse JSON
    const scheduleData = this.extractJSON(response, false);

    // Validate extracted data
    if (!scheduleData.timeSlots || scheduleData.timeSlots.length === 0) {
      throw new Error('No schedule information could be extracted from the file. Please try a clearer image or enter manually.');
    }

    return scheduleData;
  }

  /**
   * Extract schedule from text (for OCR or text-based extraction)
   * @param {string} text - Text containing schedule information
   * @returns {Promise<Object>} Extracted schedule data
   */
  async extractScheduleFromText(text) {
    const prompt = `Extract schedule information from the following text:

${text}

Return the data in this exact JSON format:
{
  "userName": "extracted name or Unknown",
  "roomNumber": "",
  "preferences": "",
  "timeSlots": [
    {
      "day": "Monday",
      "startTime": "09:00",
      "endTime": "12:00",
      "isBusy": true,
      "activity": "Class"
    }
  ]
}

Return ONLY the JSON object, no additional text.`;

    const response = await this.callGemini(prompt);
    return this.extractJSON(response, false);
  }
}

// Export singleton instance
const geminiService = new GeminiService();
export default geminiService;
