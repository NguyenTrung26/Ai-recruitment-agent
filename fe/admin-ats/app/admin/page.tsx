import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function AdminPage() {
  const { data: candidates } = await supabase
    .from("candidates")
    .select("*")
    .eq("status", "ai_scored")
    .order("ai_score", { ascending: false });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">AI Scored Candidates</h1>

      <div className="space-y-3">
        {candidates?.map((c) => (
          <Link
            key={c.id}
            href={`/admin/${c.id}`}
            className="block p-4 border rounded hover:bg-gray-50"
          >
            <div className="flex justify-between">
              <span className="font-medium">{c.full_name}</span>
              <span className="font-bold">⭐ {c.ai_score}</span>
            </div>
            <p className="text-sm text-gray-600">{c.email}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
