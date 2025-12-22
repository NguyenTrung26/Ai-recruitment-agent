import { supabase } from "@/lib/supabase";
import ActionButtons from "./ActionButtons";

export default async function CandidateDetail({ params }: any) {
  const { data: c } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!c) return <div>Not found</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">{c.full_name}</h1>

      <div className="flex gap-4">
        <span>Email: {c.email}</span>
        <span>Score: ⭐ {c.ai_score}</span>
      </div>

      <div>
        <h2 className="font-semibold">AI Summary</h2>
        <p className="text-gray-700">{c.ai_analysis}</p>
      </div>

      <div>
        <h2 className="font-semibold">Skills</h2>
        <div className="flex gap-2 flex-wrap">
          {c.ai_skills?.map((s: string) => (
            <span key={s} className="px-2 py-1 bg-gray-200 rounded">
              {s}
            </span>
          ))}
        </div>
      </div>

      <iframe
        src={`https://<project>.supabase.co/storage/v1/object/public/cv/${c.cv_path}`}
        className="w-full h-[600px] border"
      />

      <ActionButtons candidateId={c.id} />
    </div>
  );
}
