// src/pages/TimetableGenerator.jsx
import React, { useState } from "react";
import YearSelector from "../components/YearSelector";
import Wizard from "../components/Wizard";

export default function TimetableGenerator() {
  const [selectedYears, setSelectedYears] = useState([]);
  const [startWizard, setStartWizard] = useState(false);

  const [importedData, setImportedData] = useState(null);

  const [showImportBox, setShowImportBox] = useState(false);
  const [jsonText, setJsonText] = useState("");

  // ----------------------------
  // FILE UPLOAD IMPORT
  // ----------------------------
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        setImportedData(parsed);

        // Auto-start wizard
        setStartWizard(true);

        console.log("Imported JSON:", parsed);
      } catch (err) {
        alert("Invalid JSON file");
      }
    };

    reader.readAsText(file);
  };

  // ----------------------------
  // PASTE JSON IMPORT
  // ----------------------------
  const handleImportText = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setImportedData(parsed);

      // Auto-start wizard
      setStartWizard(true);

      console.log("Imported JSON (text):", parsed);
    } catch (err) {
      alert("Invalid JSON text");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex flex-col items-center p-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob-slow animation-delay-3000"></div>
      </div>

      {/* PAGE HEADER */}
      <div className="text-center mb-10 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100/80 backdrop-blur-sm rounded-full text-blue-600 font-semibold mb-4 border border-blue-200/50 shadow-sm">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          AI-Powered Resource Management
        </div>

        <h1 className="text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600">
          Timetable Generator
        </h1>

        <p className="text-gray-600 text-lg">
          Create optimized schedules with AI-powered automation
        </p>
      </div>

      {/* ----------------------------
          BEFORE STARTING WIZARD
      ---------------------------- */}
      {!startWizard ? (
        <div className="w-full max-w-2xl relative z-10">
          {/* YEAR SELECTION CARD */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-6 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">📚</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">
                Select Academic Years
              </h2>
            </div>

            <YearSelector
              selectedYears={selectedYears}
              setSelectedYears={setSelectedYears}
            />

            <button
              onClick={() => selectedYears.length > 0 && setStartWizard(true)}
              disabled={selectedYears.length === 0}
              className="
                mt-6 w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 
                text-white rounded-xl font-semibold shadow-lg hover:shadow-2xl
                transition-all disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Continue to Setup →
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-400/50 to-transparent"></div>
            <span className="text-gray-600 font-semibold px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-gray-200/50">
              OR
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-400/50 to-transparent"></div>
          </div>

          {/* IMPORT JSON BOX */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">📥</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">
                Import Configuration
              </h2>
            </div>

            <p className="text-gray-600 mb-4">
              Load existing timetable data from JSON file
            </p>

            <button
              onClick={() => setShowImportBox(!showImportBox)}
              className="
                w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-400 
                text-white rounded-xl font-semibold shadow-lg hover:shadow-2xl
                transition-all flex items-center justify-center gap-2
              "
            >
              📄 {showImportBox ? "Hide Import Options" : "Import JSON Data"}
            </button>

            {/* Expand Import Box */}
            {showImportBox && (
              <div className="mt-6 space-y-6">
                {/* FILE UPLOAD */}
                <div className="p-6 bg-gradient-to-br from-blue-50/80 to-cyan-50/80 rounded-xl border-2 border-dashed border-blue-300/60">
                  <p className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    📎 Upload JSON File
                  </p>

                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:bg-gradient-to-r file:from-blue-500 file:to-cyan-400 file:text-white file:font-semibold"
                  />
                </div>

                {/* PASTE JSON */}
                <div className="p-6 bg-gradient-to-br from-purple-50/80 to-pink-50/80 rounded-xl border-2 border-dashed border-purple-300/60">
                  <p className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    ✏️ Paste JSON Text
                  </p>

                  <textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    placeholder='{"years": {...}, "teachers": [...]}'
                    className="w-full h-40 border-2 border-purple-200 p-4 rounded-lg bg-white/90 font-mono text-sm"
                  />

                  <button
                    onClick={handleImportText}
                    className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold"
                  >
                    Load JSON Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ----------------------------
           AFTER START: SHOW WIZARD
        ---------------------------- */
        <div className="w-full max-w-6xl relative z-10">
          <Wizard selectedYears={selectedYears} importedData={importedData} />
        </div>
      )}

      {/* Blob Animations */}
      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes blob-slow {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(50px, 50px) scale(1.05);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-blob-slow {
          animation: blob-slow 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
