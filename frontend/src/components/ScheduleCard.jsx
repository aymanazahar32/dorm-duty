import React from 'react';
import { User, Home, Trash2, Clock } from 'lucide-react';

export default function ScheduleCard({ schedule, onDelete }) {
  const freeSlots = schedule.timeSlots.filter(slot => !slot.isBusy);
  const busySlots = schedule.timeSlots.filter(slot => slot.isBusy);

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all p-5">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <User className="text-blue-500" size={20} />
            <h3 className="text-lg font-bold text-gray-900">{schedule.userName}</h3>
          </div>
          {schedule.roomNumber && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Home size={16} />
              Room {schedule.roomNumber}
            </div>
          )}
        </div>
        <button
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete schedule"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Preferences */}
      {schedule.preferences && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900 italic">"{schedule.preferences}"</p>
        </div>
      )}

      {/* Time Slots Summary */}
      <div className="mb-3 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1 text-green-600">
          <Clock size={16} />
          <span className="font-medium">{freeSlots.length} free slots</span>
        </div>
        <div className="flex items-center gap-1 text-red-600">
          <Clock size={16} />
          <span className="font-medium">{busySlots.length} busy slots</span>
        </div>
      </div>

      {/* Time Slots */}
      <div className="space-y-2">
        {schedule.timeSlots.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {schedule.timeSlots.map((slot, index) => (
              <div
                key={index}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  slot.isBusy
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}
                title={slot.activity || (slot.isBusy ? 'Busy' : 'Available')}
              >
                {slot.day.substring(0, 3)} {slot.startTime}-{slot.endTime}
                {slot.isBusy ? ' 🔴' : ' 🟢'}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No time slots added</p>
        )}
      </div>

      {/* Timestamp */}
      {schedule.createdAt && (
        <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
          Added {new Date(schedule.createdAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
