import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Sparkles, Plus, AlertCircle } from 'lucide-react';
import scheduleService from '../services/scheduleService';
import geminiService from '../services/geminiService';
import ScheduleForm from '../components/ScheduleForm';
import ScheduleCard from '../components/ScheduleCard';
import TaskSuggestions from '../components/TaskSuggestions';

const AVAILABLE_TASKS = [
  { id: 'cooking', name: 'Cooking', icon: '🍳', duration: 60 },
  { id: 'cleaning', name: 'Cleaning', icon: '🧹', duration: 45 },
  { id: 'laundry', name: 'Laundry', icon: '👕', duration: 90 },
  { id: 'dishes', name: 'Dishes', icon: '🍽️', duration: 20 },
  { id: 'trash', name: 'Trash', icon: '🗑️', duration: 10 },
  { id: 'bathroom', name: 'Bathroom', icon: '🚽', duration: 30 },
];

export default function Schedule() {
  const [schedules, setSchedules] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState(['cooking', 'cleaning', 'laundry']);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    loadSchedules();
    loadSuggestions();
    
    // Check for API key in env
    const envKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (envKey) {
      setApiKey(envKey);
      geminiService.setApiKey(envKey);
    } else {
      setShowApiKeyInput(true);
    }
  }, []);

  const loadSchedules = () => {
    const loaded = scheduleService.getSchedules();
    setSchedules(loaded);
  };

  const loadSuggestions = () => {
    const saved = scheduleService.getSuggestions();
    if (saved && saved.suggestions) {
      setSuggestions(saved.suggestions);
    }
  };

  const handleAddSchedule = (scheduleData) => {
    const validation = scheduleService.validateSchedule(scheduleData);
    
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    scheduleService.addSchedule(scheduleData);
    loadSchedules();
    setShowForm(false);
    setError(null);
  };

  const handleDeleteSchedule = (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      scheduleService.deleteSchedule(id);
      loadSchedules();
    }
  };

  const handleTaskToggle = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleOptimize = async () => {
    if (schedules.length === 0) {
      setError('Please add at least one schedule before optimizing');
      return;
    }

    if (selectedTasks.length === 0) {
      setError('Please select at least one task to assign');
      return;
    }

    if (!apiKey) {
      setError('Please enter your Gemini API key');
      setShowApiKeyInput(true);
      return;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      // Set API key
      geminiService.setApiKey(apiKey);

      // Get task names
      // Filter out any undefined names before calling optimizeSchedules
      const taskNames = selectedTasks
        .map(taskId => AVAILABLE_TASKS.find(t => t.id === taskId)?.name)
        .filter(name => name !== undefined);

      // Call AI service
      const aiSuggestions = await geminiService.optimizeSchedules(schedules, taskNames);

      // Save suggestions
      setSuggestions(aiSuggestions);
      scheduleService.saveSuggestions(aiSuggestions);

      // Scroll to suggestions
      setTimeout(() => {
        document.getElementById('suggestions-section')?.scrollIntoView({ 
          behavior: 'smooth' 
        });
      }, 100);

    } catch (err) {
      console.error('Optimization error:', err);
      setError(err.message || 'Failed to optimize schedules. Please try again.');
      
      // Generate fallback suggestions
      const fallback = geminiService.generateFallbackSuggestions(
        schedules, 
        selectedTasks.map(id => AVAILABLE_TASKS.find(t => t.id === id)?.name)
      );
      setSuggestions(fallback);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      geminiService.setApiKey(apiKey);
      setShowApiKeyInput(false);
      setError(null);
    }
  };

  const stats = scheduleService.getStatistics();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🧠 AI Schedule Optimizer
          </h1>
          <p className="text-gray-600">
            Upload your schedules and let AI find the best times for tasks
          </p>
        </div>

        {/* API Key Input */}
        {showApiKeyInput && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  Gemini API Key Required
                </h3>
                <p className="text-sm text-yellow-800 mb-3">
                  Get your free API key from{' '}
                  <a 
                    href="https://makersuite.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    Google AI Studio
                  </a>
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key..."
                    className="flex-1 px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSaveApiKey}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Users</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
              </div>
              <Users className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Time Slots</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalTimeSlots}</p>
              </div>
              <Clock className="text-green-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Free Slots</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalFreeSlots}</p>
              </div>
              <Calendar className="text-purple-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Suggestions</p>
                <p className="text-3xl font-bold text-orange-600">{suggestions.length}</p>
              </div>
              <Sparkles className="text-orange-500" size={32} />
            </div>
          </div>
        </div>

        {/* Add Schedule Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
          >
            <Plus size={20} />
            Add Your Schedule
          </button>
        </div>

        {/* Schedule Form Modal */}
        {showForm && (
          <ScheduleForm
            onSubmit={handleAddSchedule}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Schedules List */}
        {schedules.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              📅 Uploaded Schedules
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schedules.map(schedule => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onDelete={() => handleDeleteSchedule(schedule.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Task Selection */}
        {schedules.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              📋 Select Tasks to Assign
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {AVAILABLE_TASKS.map(task => (
                <button
                  key={task.id}
                  onClick={() => handleTaskToggle(task.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedTasks.includes(task.id)
                      ? 'bg-blue-50 border-blue-500 shadow-md'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{task.icon}</div>
                  <div className="font-semibold text-sm">{task.name}</div>
                  <div className="text-xs text-gray-500">{task.duration}min</div>
                </button>
              ))}
            </div>

            {/* Optimize Button */}
            <button
              onClick={handleOptimize}
              disabled={isOptimizing || selectedTasks.length === 0}
              className={`w-full mt-6 py-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                isOptimizing || selectedTasks.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg'
              }`}
            >
              {isOptimizing ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Optimizing with AI...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Optimize with AI
                </>
              )}
            </button>
          </div>
        )}

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <div id="suggestions-section">
            <TaskSuggestions suggestions={suggestions} />
          </div>
        )}

        {/* Empty State */}
        {schedules.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No schedules yet
            </h3>
            <p className="text-gray-500 mb-6">
              Add your first schedule to get started with AI optimization
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
