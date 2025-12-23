"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [candidatesRes, jobsRes] = await Promise.all([
        supabase.from("candidates").select("*").limit(5),
        supabase.from("jobs").select("*").limit(5),
      ]);

      if (candidatesRes.data) setCandidates(candidatesRes.data);
      if (jobsRes.data) setJobs(jobsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🤖 AI Recruitment Agent
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Advanced AI-powered candidate screening and job matching
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Total Candidates
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {candidates.length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Active Jobs
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {jobs.length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              High Scorers
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
              {candidates.filter((c: any) => c.ai_score >= 8).length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Processing
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              {candidates.filter((c: any) => c.status === "processing").length}
            </p>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/admin">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition cursor-pointer p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                👥 Candidates
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                View, analyze, and manage all candidates with AI insights
              </p>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                View All →
              </span>
            </div>
          </Link>

          <Link href="/upload">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition cursor-pointer p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                📤 Upload CV
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Submit your CV for AI-powered screening and analysis
              </p>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                Apply Now →
              </span>
            </div>
          </Link>

          <Link href="/admin/jobs">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition cursor-pointer p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                💼 Job Postings
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create and manage job postings for automatic candidate matching
              </p>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                Manage Jobs →
              </span>
            </div>
          </Link>
        </div>

        {/* Recent Candidates */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Recent Candidates
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : candidates.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No candidates yet. Upload CVs to get started.
              </div>
            ) : (
              candidates.map((candidate: any) => (
                <Link href={`/admin/${candidate.id}`} key={candidate.id}>
                  <div className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {candidate.full_name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {candidate.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          ⭐ {candidate.ai_score || "-"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {candidate.status}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">
              AI Analysis
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Advanced CV parsing and candidate profiling using Gemini AI
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">
              Smart Scoring
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Multi-criteria evaluation for objective candidate ranking
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">
              Automation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automated workflows with n8n integration and job queue processing
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
