"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Candidate {
  id: string | number;
  full_name: string;
  email: string;
  ai_score?: number;
  status: string;
  job_id?: string | number;
  [key: string]: unknown;
}

export default function AdminPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/candidates`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format");
      }
      setCandidates(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
    // Auto-refresh mỗi 15 giây
    const interval = setInterval(loadCandidates, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Navigation Tabs */}
        <div className="mb-8 flex gap-4 border-b border-gray-300 dark:border-gray-700">
          <Link
            href="/admin"
            className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
          >
            👥 Candidates
          </Link>
          <Link
            href="/admin/schedules"
            className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition"
          >
            📅 Scheduled Posts
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              👥 Candidates Overview
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Total: {candidates?.length || 0} candidates
            </p>
          </div>
          <button
            onClick={loadCandidates}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? "🔄 Loading..." : "🔄 Refresh"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg">
            ❌ Error: {error}
          </div>
        )}

        {/* Loading State */}
        {loading && candidates.length === 0 && (
          <div className="text-center text-gray-600 dark:text-gray-400">
            Loading candidates...
          </div>
        )}

        {/* Empty State */}
        {!loading && candidates.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No candidates yet.{" "}
              <Link href="/upload" className="text-blue-600 hover:underline">
                Start by uploading a CV
              </Link>
            </p>
          </div>
        )}

        {/* Candidates Grid */}
        {candidates && candidates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((c: Candidate) => (
              <Link
                key={c.id}
                href={`/admin/${c.id}`}
                className="bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                      {c.full_name}
                    </h3>
                    <span className="text-2xl">⭐ {c.ai_score || "-"}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 break-all">
                    {c.email}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                      {c.status}
                    </span>
                    {c.job_id && (
                      <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                        Job #{c.job_id}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
