import React from 'react';
import { Sparkles, User, Calendar, Clock, TrendingUp, Loader2 } from 'lucide-react';

export default function TaskSuggestions({ suggestions, onAddAll, isAdding = false }) {
  const getConfidenceBadge = (confidence) => {
    if (confidence >= 0.8) {
      return {
        text: 'High Confidence',
        className: 'bg-green-100 text-green-800 border-green-300'
      };
    } else if (confidence >= 0.6) {
      return {
        text: 'Medium Confidence',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
      };
    } else {
      return {
        text: 'Low Confidence',
        className: 'bg-red-100 text-red-800 border-red-300'
      };
    }
  };

  const getTaskIcon = (taskName) => {
    const icons = {
      cooking: '🍳',
      cleaning: '🧹',
      laundry: '👕',
      dishes: '🍽️',
      trash: '🗑️',
      bathroom: '🚽',
    };
    
    const key = taskName.toLowerCase();
    return icons[key] || '📋';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="text-purple-500" size={32} />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            AI-Powered Task Assignments
          </h2>
          <p className="text-gray-600">
            Based on everyone's availability and preferences
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{suggestions.length}</div>
          <div className="text-sm text-gray-600">Tasks Assigned</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {new Set(suggestions.map(s => s.assignedTo)).size}
          </div>
          <div className="text-sm text-gray-600">Users Involved</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {suggestions.length > 0
              ? Math.round(
                  (suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length) * 100
                )
              : 0}%
          </div>
          <div className="text-sm text-gray-600">Avg Confidence</div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="grid grid-cols-1 gap-4">
       <div className="grid grid-cols-1 gap-4">
         {suggestions.map((suggestion, index) => {
           const badge = getConfidenceBadge(suggestion.confidence);
           
           return (
             <div
               key={`${suggestion.task}-${suggestion.assignedTo}-${suggestion.day}`}
               className="bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-xl border-2 border-purple-200 p-6 hover:shadow-lg transition-all"
             >
              className="bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-xl border-2 border-purple-200 p-6 hover:shadow-lg transition-all"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{getTaskIcon(suggestion.task)}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {suggestion.task}
                    </h3>
                    <p className="text-sm text-gray-600">Task Assignment</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${badge.className}`}>
                  {Math.round(suggestion.confidence * 100)}% {badge.text.split(' ')[0]}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                  <User className="text-blue-500 flex-shrink-0" size={20} />
                  <div>
                    <div className="text-xs text-gray-600">Assigned To</div>
                    <div className="font-semibold text-gray-900">{suggestion.assignedTo}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                  <Calendar className="text-green-500 flex-shrink-0" size={20} />
                  <div>
                    <div className="text-xs text-gray-600">Day</div>
                    <div className="font-semibold text-gray-900">{suggestion.day}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                  <Clock className="text-purple-500 flex-shrink-0" size={20} />
                  <div>
                    <div className="text-xs text-gray-600">Time</div>
                    <div className="font-semibold text-gray-900">{suggestion.time}</div>
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="p-4 bg-white rounded-lg border-l-4 border-purple-500">
                <div className="flex items-start gap-2">
                  <TrendingUp className="text-purple-500 flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-1">AI Reasoning</div>
                    <p className="text-sm text-gray-700 italic">
                      {suggestion.reasoning}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onAddAll}
            disabled={isAdding}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAdding ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Adding Tasks...
              </>
            ) : (
              'Add All to Tasks'
            )}
          </button>
          <button
            onClick={() => {
              // TODO: Implement CSV export functionality
              console.log('Exporting to CSV:', suggestions);
            }}
            className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            Export as CSV
          </button>
        </div>
      </div>
    </div>
  );
}
