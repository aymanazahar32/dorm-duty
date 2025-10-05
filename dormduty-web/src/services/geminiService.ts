"use client";

/**
 * Gemini AI Service
 * Handles interactions with Google's Gemini API for schedule optimisation.
 */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

type GeminiInlineData = {
  mimeType: string;
  data: string;
};

type GeminiPart = {
  text?: string;
  inlineData?: GeminiInlineData;
};

type Schedule = {
  userName: string;
  roomNumber?: string;
  preferences?: string;
  timeSlots: Array<{
    day: string;
    startTime: string;
    endTime: string;
    isBusy: boolean;
    activity?: string;
  }>;
};

class GeminiService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "";
  }

  setApiKey(key: string | undefined) {
    this.apiKey = key ?? "";
  }

  private ensureApiKey() {
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY.");
    }
  }

  private async callGemini(prompt: string, imageData?: GeminiInlineData) {
    this.ensureApiKey();

    const parts: GeminiPart[] = [{ text: prompt }];

    if (imageData) {
      parts.push({ inlineData: imageData });
    }

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Unexpected API response structure");
    }
    return text as string;
  }

  private extractJSON(response: string, expectArray: boolean) {
    const startChar = expectArray ? "[" : "{";
    const endChar = expectArray ? "]" : "}";

    const firstIndex = response.indexOf(startChar);
    const lastIndex = response.lastIndexOf(endChar);

    if (firstIndex === -1 || lastIndex === -1 || lastIndex <= firstIndex) {
      throw new Error("No valid JSON found in AI response");
    }

    const jsonString = response.substring(firstIndex, lastIndex + 1);
    return JSON.parse(jsonString);
  }

  async optimizeSchedules(schedules: Schedule[], tasks: string[]) {
    if (!Array.isArray(schedules) || schedules.length === 0) {
      throw new Error("schedules must be a non-empty array");
    }
    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error("tasks must be a non-empty array");
    }

    const prompt = this.buildOptimizationPrompt(schedules, tasks);
    const response = await this.callGemini(prompt);
    return this.extractJSON(response, true) as unknown[];
  }

  async findBestTimeForTask(task: string, schedules: Schedule[], durationMinutes = 30) {
    const prompt = this.buildSingleTaskPrompt(task, schedules, durationMinutes);
    const response = await this.callGemini(prompt);
    return this.extractJSON(response, false) as unknown;
  }

  async analyzeScheduleConflicts(schedules: Schedule[]) {
    const prompt = this.buildAnalysisPrompt(schedules);
    const response = await this.callGemini(prompt);
    return this.extractJSON(response, false) as unknown;
  }

  generateFallbackSuggestions(schedules: Schedule[], tasks: string[]) {
    const suggestions: Array<Record<string, unknown>> = [];

    if (schedules.length === 0) {
      return suggestions;
    }

    tasks.forEach((task, index) => {
      const userIndex = index % schedules.length;
      const schedule = schedules[userIndex];
      const freeSlots = schedule.timeSlots.filter((slot) => !slot.isBusy);

      if (freeSlots.length > 0) {
        const slot = freeSlots[0];
        suggestions.push({
          task,
          assignedTo: schedule.userName,
          day: slot.day,
          time: slot.startTime,
          confidence: 0.6,
          reasoning: "Based on availability (offline mode - AI unavailable)",
        });
      }
    });

    return suggestions;
  }

  private buildOptimizationPrompt(schedules: Schedule[], tasks: string[]) {
    let prompt = "You are a scheduling assistant for a dorm. Analyze the following user schedules and optimise task assignments.\n\nUSERS AND THEIR SCHEDULES:\n";

    schedules.forEach((schedule) => {
      prompt += `\n\nUser: ${schedule.userName} (Room ${schedule.roomNumber || "N/A"})\n`;

      if (schedule.preferences) {
        prompt += `Preferences: ${schedule.preferences}\n`;
      }

      prompt += "Available Times:\n";

      const freeSlots = schedule.timeSlots.filter((slot) => !slot.isBusy);
      if (freeSlots.length === 0) {
        prompt += "  - No free time slots available\n";
      } else {
        freeSlots.forEach((slot) => {
          prompt += `  - ${slot.day}: ${slot.startTime} - ${slot.endTime}\n`;
        });
      }

      const busySlots = schedule.timeSlots.filter((slot) => slot.isBusy);
      if (busySlots.length > 0) {
        prompt += "Busy Times:\n";
        busySlots.forEach((slot) => {
          prompt += `  - ${slot.day}: ${slot.startTime} - ${slot.endTime} (${slot.activity || "Busy"})\n`;
        });
      }
    });

    prompt += `\n\nTASKS TO ASSIGN: ${tasks.join(", ")}\n\n`;
    prompt += `INSTRUCTIONS:\n1. Assign each task to the most suitable person based on their availability\n2. Distribute tasks fairly among all users\n3. Avoid scheduling conflicts\n4. Consider task duration and time-of-day suitability\n5. Return JSON with an array called "suggestions" where each suggestion has task, assignedTo, day, time, confidence (0-1), and reasoning.`;

    return prompt;
  }

  private buildSingleTaskPrompt(task: string, schedules: Schedule[], durationMinutes: number) {
    return `${this.buildOptimizationPrompt(schedules, [task])}\n\nFocus on scheduling the task "${task}" with an estimated duration of ${durationMinutes} minutes.`;
  }

  private buildAnalysisPrompt(schedules: Schedule[]) {
    return `Analyse the following schedules for conflicts and provide recommendations. Return a JSON object with \"conflicts\" (array) and \"recommendations\" (array). Data:${JSON.stringify(schedules)}`;
  }

  async fileToBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          const base64 = result.split(",")[1];
          resolve(base64 ?? "");
        } else {
          reject(new Error("Unable to read file"));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  }

  async extractScheduleFromFile(file: File) {
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];

    if (!validTypes.includes(file.type)) {
      throw new Error("Invalid file type. Please upload an image (JPG, PNG, GIF, WebP) or PDF.");
    }

    const base64Data = await this.fileToBase64(file);

    const prompt = `Analyze this schedule image/document and extract the following information:\n\n1. Person's name (if visible)\n2. All time slots with day, start time (HH:MM 24-hour), end time, whether they're busy, and the activity if busy\n3. Any preferences or notes mentioned\n\nReturn JSON with userName, roomNumber, preferences, and timeSlots.`;

    const response = await this.callGemini(prompt, {
      mimeType: file.type,
      data: base64Data,
    });

    const scheduleData = this.extractJSON(response, false) as Schedule;

    if (!scheduleData.timeSlots || scheduleData.timeSlots.length === 0) {
      throw new Error("No schedule information could be extracted from the file.");
    }

    return scheduleData;
  }

  async extractScheduleFromText(text: string) {
    const prompt = `Extract schedule information from the following text:\n\n${text}\n\nReturn JSON with userName, roomNumber, preferences, and timeSlots (array with day, startTime, endTime, isBusy, activity).`;
    const response = await this.callGemini(prompt);
    return this.extractJSON(response, false) as Schedule;
  }
}

const geminiService = new GeminiService();
export default geminiService;
