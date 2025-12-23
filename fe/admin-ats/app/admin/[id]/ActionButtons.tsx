"use client";

import { useState } from "react";

interface RequestBody {
  candidateId: number;
  interviewDate?: string;
  interviewTime?: string;
}

export default function ActionButtons({
  candidateId,
  candidateEmail,
}: {
  candidateId: number | string;
  candidateEmail: string;
}) {
  const [loading, setLoading] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("10:00");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleDecision = async (decision: "approve" | "reject") => {
    if (decision === "approve" && !interviewDate) {
      setError("Please select an interview date");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const endpoint = `/api/decision/${decision}`;
      const body: RequestBody = {
        candidateId:
          typeof candidateId === "string" ? parseInt(candidateId) : candidateId,
      };

      if (decision === "approve" && interviewDate) {
        body.interviewDate = interviewDate;
        body.interviewTime = interviewTime;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || `Decision failed: ${response.statusText}`
        );
      }

      const data = await response.json();

      setSuccess(
        decision === "approve"
          ? `✓ Interview invitation sent to ${data.candidate.email}!`
          : `✓ Rejection notification sent to ${data.candidate.email}`
      );
      setShowSchedule(false);
      setInterviewDate("");

      // Redirect to candidates list after 3 seconds
      setTimeout(() => {
        window.location.href = "/admin";
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process decision"
      );
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        ⚡ HR Decision & Actions
      </h2>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 rounded-lg">
          {success}
        </div>
      )}

      {/* Interview Schedule Section */}
      {!showSchedule ? (
        <button
          onClick={() => setShowSchedule(true)}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg transition mb-4 flex items-center justify-center gap-2"
          disabled={loading}
        >
          📅 Schedule Interview
        </button>
      ) : (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">
            📅 Schedule Interview
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time
              </label>
              <input
                type="time"
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              📧 Interview invitation will be sent to:{" "}
              <strong>{candidateEmail}</strong>
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSchedule(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  interviewDate
                    ? handleDecision("approve")
                    : setError("Please select a date")
                }
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
                disabled={loading || !interviewDate}
              >
                {loading ? "Sending..." : "✓ Send Interview"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decision Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Approve Button */}
        <button
          onClick={() => setShowSchedule(true)}
          disabled={loading}
          className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
        >
          {loading ? "⏳ Processing..." : "✅ Approve & Schedule"}
        </button>

        {/* Reject Button */}
        <button
          onClick={() => handleDecision("reject")}
          disabled={loading}
          className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
        >
          {loading ? "⏳ Processing..." : "❌ Reject Candidate"}
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          💡 <strong>Note:</strong> Your decision will trigger automated emails
          via the n8n workflow.
        </p>
      </div>
    </div>
  );
}
