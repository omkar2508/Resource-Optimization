import React, { useState } from 'react';
import { toast } from 'react-toastify';

export default function TimeConfigPanel({ timeConfig, setTimeConfig }) {
  const [localConfig, setLocalConfig] = useState({
    dayStart: timeConfig?.dayStart || "09:00",
    dayEnd: timeConfig?.dayEnd || "14:00",
    periodDuration: timeConfig?.periodDuration || 60,
    breakDuration: timeConfig?.breakDuration || 60,
  });

  const parseTime = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const generatePreview = () => {
    const startMinutes = parseTime(localConfig.dayStart);
    const endMinutes = parseTime(localConfig.dayEnd);
    const periodDuration = parseInt(localConfig.periodDuration);
    const breakDuration = parseInt(localConfig.breakDuration);

    if (startMinutes >= endMinutes) {
      return { error: "End time must be after start time" };
    }

    const slots = [];
    let currentTime = startMinutes;
    let periodNum = 1;

    while (currentTime < endMinutes) {
      const slotEnd = currentTime + periodDuration;
      if (slotEnd > endMinutes) break;

      slots.push({
        period: periodNum,
        start: formatTime(currentTime),
        end: formatTime(slotEnd),
        duration: periodDuration
      });

      currentTime = slotEnd;
      periodNum++;

      // Add break after every 3 periods (example logic)
      if (periodNum % 4 === 0 && currentTime < endMinutes) {
        const breakEnd = currentTime + breakDuration;
        if (breakEnd <= endMinutes) {
          slots.push({
            period: 'Break',
            start: formatTime(currentTime),
            end: formatTime(breakEnd),
            duration: breakDuration,
            isBreak: true
          });
          currentTime = breakEnd;
        }
      }
    }

    return { slots };
  };

  const handleApply = () => {
    const preview = generatePreview();
    
    if (preview.error) {
      toast.error(preview.error);
      return;
    }

    if (preview.slots.length < 4) {
      toast.error("Configuration must allow at least 4 periods per day");
      return;
    }

    setTimeConfig({
      day_start: localConfig.dayStart,
      day_end: localConfig.dayEnd,
      period_duration: parseInt(localConfig.periodDuration),
      break_duration: parseInt(localConfig.breakDuration)
    });

    toast.success("Time configuration applied successfully!");
  };

  const preview = generatePreview();

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white text-2xl">⏰</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Time Slot Configuration</h2>
          <p className="text-sm text-gray-600">Define your institution's daily schedule</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Day Start Time */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Day Start Time
          </label>
          <input
            type="time"
            value={localConfig.dayStart}
            onChange={(e) => setLocalConfig({ ...localConfig, dayStart: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
          />
        </div>

        {/* Day End Time */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Day End Time
          </label>
          <input
            type="time"
            value={localConfig.dayEnd}
            onChange={(e) => setLocalConfig({ ...localConfig, dayEnd: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
          />
        </div>

        {/* Period Duration */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Period Duration (minutes)
          </label>
          <input
            type="number"
            min="30"
            max="120"
            step="5"
            value={localConfig.periodDuration}
            onChange={(e) => setLocalConfig({ ...localConfig, periodDuration: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
          />
        </div>

        {/* Break Duration */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Break Duration (minutes)
          </label>
          <input
            type="number"
            min="5"
            max="60"
            step="5"
            value={localConfig.breakDuration}
            onChange={(e) => setLocalConfig({ ...localConfig, breakDuration: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <button
        onClick={handleApply}
        className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl font-semibold shadow-lg hover:shadow-2xl transition-all mb-6"
      >
        Apply Configuration
      </button>

      {/* Preview */}
      <div className="bg-gradient-to-br from-blue-50/80 to-cyan-50/80 rounded-xl p-6 border border-blue-200">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📅</span>
          Daily Schedule Preview
        </h3>

        {preview.error ? (
          <div className="text-red-600 font-medium">{preview.error}</div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-4">
              Total Periods: <span className="font-bold text-blue-600">
                {preview.slots.filter(s => !s.isBreak).length}
              </span>
              {' • '}
              Breaks: <span className="font-bold text-blue-600">
                {preview.slots.filter(s => s.isBreak).length}
              </span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {preview.slots.map((slot, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg shadow-sm ${
                    slot.isBreak
                      ? 'bg-amber-100 border-l-4 border-amber-500'
                      : 'bg-white border-l-4 border-blue-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                      slot.isBreak
                        ? 'bg-amber-200 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {slot.isBreak ? '☕' : `P${slot.period}`}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {slot.isBreak ? 'Break Time' : `Period ${slot.period}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        {slot.duration} minutes
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-gray-800">
                      {slot.start}
                    </div>
                    <div className="text-sm text-gray-500">to</div>
                    <div className="font-mono font-bold text-gray-800">
                      {slot.end}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}