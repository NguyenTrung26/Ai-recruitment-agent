"use client";

export default function ActionButtons({
  candidateId,
}: {
  candidateId: string;
}) {
  async function decide(decision: "approve" | "reject") {
    await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidate_id: candidateId,
        decision,
        interview_time: "2025-01-10 10:00",
      }),
    });

    alert("Action sent");
  }

  return (
    <div className="flex gap-4 mt-6">
      <button
        onClick={() => decide("approve")}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Approve & Send Interview Mail
      </button>

      <button
        onClick={() => decide("reject")}
        className="px-4 py-2 bg-red-600 text-white rounded"
      >
        Reject & Send Mail
      </button>
    </div>
  );
}
