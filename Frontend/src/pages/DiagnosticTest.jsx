import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import axiosInstance from "../utils/axiosInstance";

export default function DiagnosticTest() {
  const { isAdmin, adminData } = useAppContext();
  const [results, setResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const addResult = (test, status, data) => {
    setResults((prev) => [...prev, { test, status, data, time: new Date().toLocaleTimeString() }]);
  };

  const runDiagnostics = async () => {
    setTesting(true);
    setResults([]);

    // TEST 1: Check cookies
    addResult(
      "Browser Cookies",
      document.cookie.includes("sid") ? " PASS" : " FAIL",
      {
        hasSidCookie: document.cookie.includes("sid"),
        allCookies: document.cookie || "(none)",
      }
    );

    // TEST 2: Check session endpoint
    try {
      const res = await axiosInstance.get("/debug/session");
      addResult(
        "/debug/session",
        res.data.isAdmin ? " PASS" : " FAIL",
        res.data
      );
    } catch (error) {
      addResult("/debug/session", " ERROR", {
        message: error.message,
        response: error.response?.data,
      });
    }

    // TEST 3: Check admin /me endpoint
    try {
      const res = await axiosInstance.get("/api/admin/me");
      addResult(
        "/api/admin/me",
        res.data.authenticated ? " PASS" : " FAIL",
        res.data
      );
    } catch (error) {
      addResult("/api/admin/me", " ERROR", {
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
      });
    }

    // TEST 4: Check admin health endpoint
    try {
      const res = await axiosInstance.get("/api/admin/health");
      addResult(
        "/api/admin/health",
        res.data.success ? " PASS" : " FAIL",
        res.data
      );
    } catch (error) {
      addResult("/api/admin/health", " ERROR", {
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
      });
    }

    // TEST 5: Context state
    addResult(
      "React Context State",
      isAdmin ? " PASS" : " FAIL",
      {
        isAdmin,
        adminData,
      }
    );

    // TEST 6: Axios config
    addResult(
      "Axios Configuration",
      axiosInstance.defaults.withCredentials ? " PASS" : " FAIL",
      {
        baseURL: axiosInstance.defaults.baseURL,
        withCredentials: axiosInstance.defaults.withCredentials,
        headers: axiosInstance.defaults.headers,
      }
    );

    setTesting(false);
  };

  const copyResults = () => {
    const text = JSON.stringify(results, null, 2);
    navigator.clipboard.writeText(text);
    alert("Results copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔍 Authentication Diagnostic Tool
          </h1>
          <p className="text-gray-600">
            Run this to identify why the 401 error is happening
          </p>
        </div>

        {/* Current State */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Current Authentication State
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Admin Status</p>
              <p className="text-lg font-semibold">
                {isAdmin ? " Authenticated" : " Not Authenticated"}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Admin Name</p>
              <p className="text-lg font-semibold">
                {adminData?.name || "(not set)"}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Admin Role</p>
              <p className="text-lg font-semibold">
                {adminData?.role || "(not set)"}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Department</p>
              <p className="text-lg font-semibold">
                {adminData?.department || "(not set)"}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-4">
            <button
              onClick={runDiagnostics}
              disabled={testing}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {testing ? "Running Tests..." : "🔬 Run All Tests"}
            </button>
            {results.length > 0 && (
              <button
                onClick={copyResults}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
              >
                📋 Copy Results
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Test Results ({results.length})
            </h2>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    result.status.includes("PASS")
                      ? "bg-green-50 border-green-300"
                      : "bg-red-50 border-red-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {result.status.includes("PASS") ? "" : ""}
                      </span>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {result.test}
                        </h3>
                        <p className="text-sm text-gray-600">{result.time}</p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        result.status.includes("PASS")
                          ? "bg-green-200 text-green-800"
                          : "bg-red-200 text-red-800"
                      }`}
                    >
                      {result.status}
                    </span>
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm font-semibold">
                      View Details
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Troubleshooting Guide */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-yellow-900 mb-4">
            🛠️ What The Results Mean
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <strong className="text-yellow-900">Browser Cookies FAIL:</strong>
              <p className="text-yellow-800">
                Session cookie not being set during login. Check login endpoint.
              </p>
            </div>
            <div>
              <strong className="text-yellow-900">/debug/session FAIL:</strong>
              <p className="text-yellow-800">
                Session not created on backend. Check session middleware.
              </p>
            </div>
            <div>
              <strong className="text-yellow-900">/api/admin/me ERROR (401):</strong>
              <p className="text-yellow-800">
                Cookies not being sent or middleware rejecting them. Check axios
                withCredentials and CORS settings.
              </p>
            </div>
            <div>
              <strong className="text-yellow-900">/api/admin/health ERROR (401):</strong>
              <p className="text-yellow-800">
                AdminAuth middleware failing. This is your main issue - cookies aren't
                reaching the protected endpoint.
              </p>
            </div>
            <div>
              <strong className="text-yellow-900">React Context FAIL:</strong>
              <p className="text-yellow-800">
                Context not updated after login. Check AppContext adminLogin function.
              </p>
            </div>
            <div>
              <strong className="text-yellow-900">Axios Configuration FAIL:</strong>
              <p className="text-yellow-800">
                withCredentials not set to true. Replace axiosInstance.js file.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Fixes */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">
            ⚡ Quick Fixes
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Make sure you're logged in as admin at /admin/login</li>
            <li>Check DevTools → Application → Cookies for 'sid' cookie</li>
            <li>Check DevTools → Network → Headers for Cookie header in requests</li>
            <li>Verify .env has correct VITE_BACKEND_URL</li>
            <li>Replace utils/axiosInstance.js with the fixed version</li>
            <li>Restart both frontend and backend servers</li>
            <li>Clear all cookies and try logging in again</li>
          </ol>
        </div>
      </div>
    </div>
  );
}