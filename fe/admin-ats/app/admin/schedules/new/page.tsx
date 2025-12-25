"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddSchedulePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    job_title: "",
    job_desc: "",
    apply_link: "",
    scheduled_time: "",
  });
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const payload = {
        ...formData,
        scheduled_time: formData.scheduled_time.replace("T", " "),
      };

      const response = await fetch(`/api/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setMessage({ text: "✅ Đã thêm lịch thành công!", type: "success" });
        setFormData({ job_title: "", job_desc: "", apply_link: "", scheduled_time: "" });
        setTimeout(() => router.push("/admin/schedules"), 2000);
      } else {
        const errorData = await response.json();
        setMessage({
          text: `❌ Lỗi: ${errorData.error || "Không thể thêm lịch"}`,
          type: "error",
        });
      }
    } catch (err) {
      const errorText = err instanceof Error ? err.message : "Lỗi kết nối";
      setMessage({ text: `❌ Lỗi: ${errorText}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Link
          href="/admin/schedules"
          className="inline-block mb-6 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Quay lại
        </Link>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            ➕ Thêm Lịch Tuyển Dụng
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiêu đề công việc
              </label>
              <input
                type="text"
                id="job_title"
                value={formData.job_title}
                onChange={handleChange}
                placeholder="Ví dụ: Backend Developer"
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="job_desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mô tả công việc
              </label>
              <textarea
                id="job_desc"
                value={formData.job_desc}
                onChange={handleChange}
                placeholder="Mô tả chi tiết về vị trí công việc..."
                rows={5}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="apply_link" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Link ứng tuyển
              </label>
              <input
                type="url"
                id="apply_link"
                value={formData.apply_link}
                onChange={handleChange}
                placeholder="https://example.com/apply"
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="scheduled_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thời gian đăng
              </label>
              <input
                type="datetime-local"
                id="scheduled_time"
                value={formData.scheduled_time}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-200"
                    : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition"
            >
              {loading ? "⏳ Đang xử lý..." : "✅ Thêm lịch"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
