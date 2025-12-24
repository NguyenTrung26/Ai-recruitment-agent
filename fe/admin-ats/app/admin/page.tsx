import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Candidate {
  id: string | number; // UUID or integer
  full_name: string;
  email: string;
  ai_score?: number;
  status: string;
  job_id?: string | number; // UUID or integer
  [key: string]: unknown;
}

export default async function AdminPage() {
  const { data: candidates, error } = await supabase
    .from("candidates")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            👥 Candidates Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Total: {candidates?.length || 0} candidates
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg">
            Error loading candidates: {error.message}
          </div>
        )}

        {!candidates || candidates.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No candidates yet.{" "}
              <Link href="/upload" className="text-blue-600 hover:underline">
                Start by uploading a CV
              </Link>
            </p>
          </div>
        ) : (
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
