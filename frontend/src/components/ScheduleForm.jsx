import React, { useState } from 'react';
import { X, Plus, Trash2, Upload, Loader } from 'lucide-react';
import geminiService from '../services/geminiService';

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export default function ScheduleForm({ onSubmit, onCancel }) {
  const [userName, setUserName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [preferences, setPreferences] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  
  // Current time slot being added
  const [currentSlot, setCurrentSlot] = useState({
    day: 'Monday',
    startTime: '09:00',
    endTime: '12:00',
    isBusy: false,
    activity: ''
  });

  const handleAddTimeSlot = () => {
    if (!currentSlot.startTime || !currentSlot.endTime) {
      alert('Please enter both start and end times');
      return;
    }

    if (currentSlot.startTime >= currentSlot.endTime) {
      alert('End time must be after start time');
      return;
    }

    setTimeSlots([...timeSlots, { ...currentSlot, id: Date.now() }]);
    
    // Reset current slot
    setCurrentSlot({
      day: 'Monday',
      startTime: '09:00',
      endTime: '12:00',
      isBusy: false,
      activity: ''
    });
  };

  const handleRemoveTimeSlot = (id) => {
    setTimeSlots(timeSlots.filter(slot => slot.id !== id));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsExtracting(true);
    setExtractionError(null);
    setUploadedFileName(file.name);

    try {
      // Extract schedule data from file using AI
      const extractedData = await geminiService.extractScheduleFromFile(file);

      // Pre-fill form with extracted data
      if (extractedData.userName && extractedData.userName !== 'Unknown') {
        setUserName(extractedData.userName);
      }
      if (extractedData.roomNumber) {
        setRoomNumber(extractedData.roomNumber);
      }
      if (extractedData.preferences) {
        setPreferences(extractedData.preferences);
      }

      // Add extracted time slots
      if (extractedData.timeSlots && extractedData.timeSlots.length > 0) {
        const slotsWithIds = extractedData.timeSlots.map(slot => ({
          ...slot,
          id: Date.now() + Math.random() // Unique ID
        }));
        setTimeSlots(slotsWithIds);
      }

      setExtractionError(null);
      
      // Show success message
      alert(`Successfully extracted ${extractedData.timeSlots.length} time slots! Review and edit if needed.`);

    } catch (error) {
      console.error('File extraction error:', error);
      setExtractionError(error.message || 'Failed to extract schedule from file. Please try again or enter manually.');
    } finally {
      setIsExtracting(false);
      // Clear file input
      event.target.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!userName.trim()) {
      alert('Please enter your name');
      return;
    }

    if (timeSlots.length === 0) {
      alert('Please add at least one time slot');
      return;
    }

    onSubmit({
      userName: userName.trim(),
      roomNumber: roomNumber.trim(),
      preferences: preferences.trim(),
      timeSlots: timeSlots.map(({ id, ...slot }) => slot) // Remove temporary IDs
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Add Your Schedule</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* File Upload Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">📤 Upload Schedule (Optional)</h3>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-dashed border-purple-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto text-purple-500 mb-3" size={40} />
                <h4 className="font-semibold text-gray-900 mb-2">
                  Upload Your Schedule Image or PDF
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  AI will automatically extract your schedule information from the file
                </p>
                
                <label className="inline-block">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    disabled={isExtracting}
                    className="hidden"
                    id="schedule-file-upload"
                  />
                  <span className={`px-6 py-3 rounded-lg font-medium cursor-pointer transition-all inline-flex items-center gap-2 ${
                    isExtracting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg'
                  }`}>
                    {isExtracting ? (
                      <>
                        <Loader className="animate-spin" size={20} />
                        Extracting Schedule...
                      </>
                    ) : (
                      <>
                        <Upload size={20} />
                        Choose File
                      </>
                    )}
                  </span>
                </label>

                {uploadedFileName && (
                  <p className="text-sm text-gray-600 mt-3">
                    📎 {uploadedFileName}
                  </p>
                )}

                <p className="text-xs text-gray-500 mt-3">
                  Supports: JPG, PNG, GIF, WebP, PDF
                </p>
              </div>

              {extractionError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    ⚠️ {extractionError}
                  </p>
                </div>
              )}

              {isExtracting && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    🧠 AI is analyzing your schedule... This may take 10-15 seconds.
                  </p>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <span className="text-sm text-gray-500">OR</span>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">📝 Enter Manually</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Number
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="301"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferences (optional)
              </label>
              <textarea
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="E.g., I prefer mornings, I enjoy cooking, etc."
                rows={2}
              />
            </div>
          </div>

          {/* Time Slots */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Add Time Slots</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day
                  </label>
                  <select
                    value={currentSlot.day}
                    onChange={(e) => setCurrentSlot({ ...currentSlot, day: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentSlot.isBusy}
                      onChange={(e) => setCurrentSlot({ ...currentSlot, isBusy: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      I'm Busy
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={currentSlot.startTime}
                    onChange={(e) => setCurrentSlot({ ...currentSlot, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={currentSlot.endTime}
                    onChange={(e) => setCurrentSlot({ ...currentSlot, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {currentSlot.isBusy && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity (optional)
                  </label>
                  <input
                    type="text"
                    value={currentSlot.activity}
                    onChange={(e) => setCurrentSlot({ ...currentSlot, activity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Class, Work, Study"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleAddTimeSlot}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Time Slot
              </button>
            </div>

            {/* Added Time Slots */}
            {timeSlots.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">
                  Added Time Slots ({timeSlots.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {timeSlots.map(slot => (
                    <div
                      key={slot.id}
                      className={`flex justify-between items-center p-3 rounded-lg border-2 ${
                        slot.isBusy 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {slot.day} • {slot.startTime} - {slot.endTime}
                        </div>
                        <div className="text-sm text-gray-600">
                          {slot.isBusy ? (
                            <span className="text-red-600">
                              🔴 Busy {slot.activity && `- ${slot.activity}`}
                            </span>
                          ) : (
                            <span className="text-green-600">🟢 Available</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTimeSlot(slot.id)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!userName.trim() || timeSlots.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Save Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
