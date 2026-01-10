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
    <div className="bg-white/90 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl border border-gray-100">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
          <span className="text-white text-xl sm:text-2xl">⏰</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Time Slot Configuration</h2>
          <p className="text-xs sm:text-sm text-gray-600">Define your institution's daily schedule</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Day Start Time */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
            Day Start Time
          </label>
          <input
            type="time"
            value={localConfig.dayStart}
            onChange={(e) => setLocalConfig({ ...localConfig, dayStart: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
          />
        </div>

        {/* Day End Time */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
            Day End Time
          </label>
          <input
            type="time"
            value={localConfig.dayEnd}
            onChange={(e) => setLocalConfig({ ...localConfig, dayEnd: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
          />
        </div>

        {/* Period Duration */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
            Period Duration (minutes)
          </label>
          <input
            type="number"
            min="30"
            max="120"
            step="5"
            value={localConfig.periodDuration}
            onChange={(e) => setLocalConfig({ ...localConfig, periodDuration: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
          />
        </div>

        {/* Break Duration */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
            Break Duration (minutes)
          </label>
          <input
            type="number"
            min="5"
            max="60"
            step="5"
            value={localConfig.breakDuration}
            onChange={(e) => setLocalConfig({ ...localConfig, breakDuration: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <button
        onClick={handleApply}
        className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-2xl transition-all mb-4 sm:mb-6 text-sm sm:text-base"
      >
        Apply Configuration
      </button>

      {/* Preview */}
      <div className="bg-gradient-to-br from-blue-50/80 to-cyan-50/80 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-blue-200">
        <h3 className="font-bold text-sm sm:text-base text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
          <span>📅</span>
          Daily Schedule Preview
        </h3>

        {preview.error ? (
          <div className="text-sm sm:text-base text-red-600 font-medium p-3 bg-red-50 rounded-lg">{preview.error}</div>
        ) : (
          <>
            <div className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 flex flex-wrap gap-2">
              <span>Total Periods: <span className="font-bold text-blue-600">
                {preview.slots.filter(s => !s.isBreak).length}
              </span></span>
              <span className="hidden sm:inline">•</span>
              <span>Breaks: <span className="font-bold text-blue-600">
                {preview.slots.filter(s => s.isBreak).length}
              </span></span>
            </div>

            <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
              {preview.slots.map((slot, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg shadow-sm ${
                    slot.isBreak
                      ? 'bg-amber-100 border-l-4 border-amber-500'
                      : 'bg-white border-l-4 border-blue-500'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 ${
                      slot.isBreak
                        ? 'bg-amber-200 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {slot.isBreak ? '☕' : `P${slot.period}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs sm:text-sm md:text-base text-gray-800">
                        {slot.isBreak ? 'Break Time' : `Period ${slot.period}`}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        {slot.duration} minutes
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <div className="font-mono font-bold text-xs sm:text-sm text-gray-800 whitespace-nowrap">
                      {slot.start}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">to</div>
                    <div className="font-mono font-bold text-xs sm:text-sm text-gray-800 whitespace-nowrap">
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