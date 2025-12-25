import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8080";
  const endpoint = `${backendUrl}/api/schedules/${id}`;

  let upstreamResp: Response;
  try {
    upstreamResp = await fetch(endpoint, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to reach backend";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  const ct = upstreamResp.headers.get("content-type") || "application/json";
  const bodyText = await upstreamResp.text();

  return new Response(bodyText, {
    status: upstreamResp.status,
    headers: { "content-type": ct },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8080";
  const endpoint = `${backendUrl}/api/schedules/${id}`;

  let upstreamResp: Response;
  try {
    upstreamResp = await fetch(endpoint, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to reach backend";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  const ct = upstreamResp.headers.get("content-type") || "application/json";
  const bodyText = await upstreamResp.text();

  return new Response(bodyText, {
    status: upstreamResp.status,
    headers: { "content-type": ct },
  });
}
