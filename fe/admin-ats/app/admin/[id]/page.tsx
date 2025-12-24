import { supabase } from "@/lib/supabase";
import ActionButtons from "./ActionButtons";
import Link from "next/link";

interface PageParams {
  params: Promise<{ id: string }>;
}

export default async function CandidateDetail({ params }: PageParams) {
  try {
    // Fix: Next.js 15+ requires awaiting params
    const { id } = await params;
    // Support both integer and UUID
    const candidateId = isNaN(Number(id)) ? id : Number(id);

    if (!candidateId) {
      throw new Error("Invalid candidate ID");
    }

    const { data: c, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", candidateId)
      .single();
    console.log("CV_URL_FROM_DB =", c?.cv_url);
    if (error || !c) {
      console.error("Candidate fetch error:", error);
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              ❌ Candidate Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              ID: {id} - Could not load candidate information
            </p>
            <Link
              href="/admin"
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
            >
              ← Back to Candidates
            </Link>
          </div>
        </div>
      );
    }
    const SUPABASE_URL = "https://axozefedjmitcbioidtj.supabase.co";

    const cvPreviewUrl = `${SUPABASE_URL}/storage/v1/object/public/${c.cv_url}`;

    // Render candidate detail
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {c.full_name}
            </h1>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-semibold">
                {c.status}
              </span>
              <span className="text-2xl">⭐ {c.ai_score || "N/A"}/100</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Contact Info */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  📞 Contact
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Email
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white break-all">
                      {c.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Phone
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {c.phone_number || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Score */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  🎯 AI Score
                </h2>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                  <div
                    className="bg-blue-600 dark:bg-blue-400 h-3 rounded-full"
                    style={{ width: `${c.ai_score || 0}%` }}
                  ></div>
                </div>
                <p className="text-center mt-2 font-bold text-lg">
                  {c.ai_score || 0}%
                </p>
              </div>

              {/* Skills */}
              {c.ai_skills && c.ai_skills.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    🛠️ Skills
                  </h2>
                  <div className="flex gap-2 flex-wrap">
                    {c.ai_skills.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - CV & Analysis */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Analysis */}
              {c.ai_analysis && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    📋 AI Analysis
                  </h2>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-500">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {c.ai_analysis}
                    </p>
                  </div>
                </div>
              )}

              {/* CV Preview - Using cv_url from database */}
              {c.cv_url && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      📄 CV Preview
                    </h2>
                    <a
                      //   href={c.cv_url}
                      href={cvPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium"
                    >
                      📥 Download
                    </a>
                  </div>
                  <div
                    className="relative w-full bg-gray-100 dark:bg-slate-900"
                    style={{ paddingBottom: "141.4%", minHeight: "400px" }}
                  >
                    <iframe
                      //   src={`${c.cv_url}#toolbar=0`}
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(
                        cvPreviewUrl
                      )}&embedded=true`}
                      className="absolute top-0 left-0 w-full h-full border-0"
                      title="CV Preview"
                      allow="fullscreen"
                    />
                  </div>
                </div>
              )}

              {!c.cv_url && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-700">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    📄 CV preview not available yet
                  </p>
                </div>
              )}

              {/* Actions */}
              <ActionButtons candidateId={c.id} candidateEmail={c.email} />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading candidate:", error);
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            ⚠️ Error Loading Candidate
          </h1>
          <p className="text-red-600 dark:text-red-400 mb-6">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <Link
            href="/admin"
            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
          >
            ← Back to Candidates
          </Link>
        </div>
      </div>
    );
  }
}
