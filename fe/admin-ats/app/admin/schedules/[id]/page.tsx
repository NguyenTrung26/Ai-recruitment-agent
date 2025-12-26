"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Schedule {
  id: string | number;
  job_title: string;
  job_desc: string;
  apply_link: string;
  scheduled_time: string;
  status: "todo" | "done" | "cancel";
}

export default function EditSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [formData, setFormData] = useState<Omit<Schedule, "id">>({
    job_title: "",
    job_desc: "",
    apply_link: "",
    scheduled_time: "",
    status: "todo",
  });

  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const response = await fetch(`/api/schedules/${id}`);
        if (!response.ok) {
          throw new Error("Không tìm thấy lịch");
        }
        const data: Schedule = await response.json();

        // Convert ISO string to datetime-local format
        const date = new Date(data.scheduled_time);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const datetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;

        setFormData({
          job_title: data.job_title,
          job_desc: data.job_desc,
          apply_link: data.apply_link,
          scheduled_time: datetimeLocal,
          status: data.status,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Lỗi";
        setMessage({ text: `❌ ${message}`, type: "error" });
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const [datePart, timePart] = formData.scheduled_time.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute] = timePart.split(":").map(Number);

      const localDate = new Date(year, month - 1, day, hour, minute);
      const browserOffset = localDate.getTimezoneOffset();
      const vietnamOffset = -420;
      const correction = (vietnamOffset - browserOffset) * 60 * 1000;
      const utcDate = new Date(localDate.getTime() + correction);
      const isoString = utcDate.toISOString();

      const payload = {
        job_title: formData.job_title,
        job_desc: formData.job_desc,
        apply_link: formData.apply_link,
        scheduled_time: isoString,
        status: formData.status,
      };

      const response = await fetch(`/api/schedules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setMessage({ text: "✅ Cập nhật lịch thành công!", type: "success" });
        setTimeout(() => router.push("/admin/schedules"), 2000);
      } else {
        const errorData = await response.json();
        setMessage({
          text: `❌ Lỗi: ${errorData.error || "Không thể cập nhật lịch"}`,
          type: "error",
        });
      }
    } catch (err) {
      const errorText = err instanceof Error ? err.message : "Lỗi kết nối";
      setMessage({ text: `❌ Lỗi: ${errorText}`, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 py-12 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">⏳ Đang tải...</p>
      </div>
    );
  }

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
            ✏️ Chỉnh sửa Lịch Tuyển Dụng
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="job_title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
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
              <label
                htmlFor="job_desc"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
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
              <label
                htmlFor="apply_link"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
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
              <label
                htmlFor="scheduled_time"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
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

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Trạng thái
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todo">⏳ Chưa đăng</option>
                <option value="done">✅ Đã đăng</option>
                <option value="cancel">❌ Hủy</option>
              </select>
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
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition"
            >
              {saving ? "⏳ Đang xử lý..." : "✅ Cập nhật"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
