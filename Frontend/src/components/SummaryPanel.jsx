import React from "react";

const SummaryPanel = ({ data, onBack, onGenerate }) => {
  return (
    <div className="p-6 bg-white shadow rounded max-w-3xl mx-auto mt-6">
      <h2 className="text-xl font-bold mb-4">Step 3 of 3</h2>

      <p className="text-gray-600 mb-6">
        Review your input and click "Generate Timetable".
      </p>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black rounded"
        >
          ← Back
        </button>

        <button
          onClick={onGenerate}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow"
        >
          Generate Timetable
        </button>
      </div>
    </div>
  );
};

export default SummaryPanel;
