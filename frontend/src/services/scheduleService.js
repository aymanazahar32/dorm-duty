/**
 * Schedule Service
 * Manages user schedules in localStorage
 */

const STORAGE_KEY = 'dormduty_schedules';
const SUGGESTIONS_KEY = 'dormduty_suggestions';

class ScheduleService {
  /**
   * Get all schedules
   */
  getSchedules() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading schedules:', error);
      return [];
    }
  }

  /**
   * Save schedules
   */
  saveSchedules(schedules) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
      return true;
    } catch (error) {
      console.error('Error saving schedules:', error);
      return false;
    }
  }

  /**
   * Add a new schedule
   */
  addSchedule(schedule) {
    const schedules = this.getSchedules();
    const newSchedule = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...schedule
    };
    schedules.push(newSchedule);
    this.saveSchedules(schedules);
    return newSchedule;
  }

  /**
   * Update a schedule
   */
  updateSchedule(id, updates) {
    const schedules = this.getSchedules();
    const index = schedules.findIndex(s => s.id === id);
    
    if (index !== -1) {
      schedules[index] = {
        ...schedules[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveSchedules(schedules);
      return schedules[index];
    }
    
    return null;
  }

  /**
   * Delete a schedule
   */
  deleteSchedule(id) {
    const schedules = this.getSchedules();
    const filtered = schedules.filter(s => s.id !== id);
    this.saveSchedules(filtered);
    return filtered.length < schedules.length;
  }

  /**
   * Get schedule by user email/id
   */
  getScheduleByUser(userEmail) {
    const schedules = this.getSchedules();
    return schedules.find(s => s.userEmail === userEmail);
  }

  /**
   * Save AI suggestions
   */
  saveSuggestions(suggestions) {
    try {
      localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify({
        suggestions,
        timestamp: new Date().toISOString()
      }));
      return true;
    } catch (error) {
      console.error('Error saving suggestions:', error);
      return false;
    }
  }

  /**
   * Get saved AI suggestions
   */
  getSuggestions() {
    try {
      const data = localStorage.getItem(SUGGESTIONS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading suggestions:', error);
      return null;
    }
  }

  /**
   * Clear all schedules
   */
  clearAllSchedules() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SUGGESTIONS_KEY);
  }

  /**
   * Validate schedule data
   */
  validateSchedule(schedule) {
    const errors = [];

    if (!schedule.userName || schedule.userName.trim() === '') {
      errors.push('User name is required');
    }

    if (!schedule.timeSlots || schedule.timeSlots.length === 0) {
      errors.push('At least one time slot is required');
    }

    if (schedule.timeSlots) {
      schedule.timeSlots.forEach((slot, index) => {
        if (!slot.day) {
          errors.push(`Time slot ${index + 1}: Day is required`);
        }
        if (!slot.startTime) {
          errors.push(`Time slot ${index + 1}: Start time is required`);
        }
        if (!slot.endTime) {
          errors.push(`Time slot ${index + 1}: End time is required`);
        }
        if (slot.startTime && slot.endTime && slot.startTime >= slot.endTime) {
          errors.push(`Time slot ${index + 1}: End time must be after start time`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get statistics about schedules
   */
  getStatistics() {
    const schedules = this.getSchedules();
    
    return {
      totalUsers: schedules.length,
      totalTimeSlots: schedules.reduce((sum, s) => sum + s.timeSlots.length, 0),
      totalFreeSlots: schedules.reduce((sum, s) => 
        sum + s.timeSlots.filter(slot => !slot.isBusy).length, 0),
      totalBusySlots: schedules.reduce((sum, s) => 
        sum + s.timeSlots.filter(slot => slot.isBusy).length, 0),
    };
  }

  /**
   * Export schedules as JSON file
   */
  exportSchedules() {
    const schedules = this.getSchedules();
    const dataStr = JSON.stringify(schedules, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dormduty-schedules-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import schedules from JSON
   */
  importSchedules(jsonData) {
    try {
      const imported = JSON.parse(jsonData);
      if (!Array.isArray(imported)) {
        throw new Error('Invalid format: Expected an array of schedules');
      }
      
      // Validate each schedule
      const validated = imported.map(schedule => {
        const validation = this.validateSchedule(schedule);
        if (!validation.isValid) {
          throw new Error(`Invalid schedule for ${schedule.userName}: ${validation.errors.join(', ')}`);
        }
        return schedule;
      });
      
      this.saveSchedules(validated);
      return { success: true, count: validated.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const scheduleService = new ScheduleService();
export default scheduleService;
