"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Schedule {
  id: string | number;
  title: string;
  content: string;
  scheduled_time: string;
  status: "todo" | "done" | "cancel";
  apply_link: string;
  created_at: string;
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/schedules`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format");
      }
      setSchedules(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(`❌ Lỗi: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
    const interval = setInterval(loadSchedules, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      todo: { bg: "bg-yellow-100", text: "text-yellow-800" },
      done: { bg: "bg-green-100", text: "text-green-800" },
      cancel: { bg: "bg-red-100", text: "text-red-800" },
    };
    const style = statusMap[status] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded text-sm font-medium ${style.bg} ${style.text}`}
      >
        {status}
      </span>
    );
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Navigation Tabs */}
        <div className="mb-8 flex gap-4 border-b border-gray-300 dark:border-gray-700">
          <Link
            href="/admin"
            className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition"
          >
            👥 Candidates
          </Link>
          <Link
            href="/admin/schedules"
            className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
          >
            📅 Scheduled Posts
          </Link>
        </div>

        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              📅 Danh sách lịch đăng
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Tổng cộng: {schedules.length} lịch
            </p>
          </div>
          <Link
            href="/admin/schedules/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            ➕ Thêm lịch mới
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              ⏳ Đang tải dữ liệu...
            </p>
          </div>
        )}

        {!loading && schedules.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Không có lịch nào.{" "}
              <Link
                href="/admin/schedules/new"
                className="text-blue-600 hover:underline"
              >
                Thêm lịch mới
              </Link>
            </p>
          </div>
        )}

        {!loading && schedules.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-600 dark:bg-blue-800">
                    <th className="px-6 py-3 text-left text-white font-semibold">
                      Vị trí tuyển
                    </th>
                    <th className="px-6 py-3 text-left text-white font-semibold">
                      Mô tả
                    </th>
                    <th className="px-6 py-3 text-left text-white font-semibold">
                      Thời gian đăng
                    </th>
                    <th className="px-6 py-3 text-left text-white font-semibold">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-white font-semibold">
                      Link ứng tuyển
                    </th>
                    <th className="px-6 py-3 text-left text-white font-semibold">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {schedules.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                    >
                      <td className="px-6 py-3 text-gray-900 dark:text-gray-100 font-semibold">
                        {item.title}
                      </td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-400 truncate max-w-xs">
                        {item.content}
                      </td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                        {formatDateTime(item.scheduled_time)}
                      </td>
                      <td className="px-6 py-3">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-3">
                        <a
                          href={item.apply_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          📝 Xem
                        </a>
                      </td>
                      <td className="px-6 py-3 text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/schedules/${item.id}`}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                          >
                            📝 Xem
                          </Link>
                          <Link
                            href={`/admin/schedules/${item.id}`}
                            className="text-orange-500 hover:text-orange-700 dark:text-orange-300 dark:hover:text-orange-200"
                          >
                            ✏️ Sửa
                          </Link>
                          <button
                            onClick={() => {
                              // Confirmation before delete
                              if (
                                window.confirm("Bạn có chắc muốn xóa lịch này?")
                              ) {
                                fetch(`/api/schedules/${item.id}`, {
                                  method: "DELETE",
                                })
                                  .then(() => loadSchedules())
                                  .catch((err) =>
                                    setError(
                                      err instanceof Error
                                        ? err.message
                                        : "Không thể xóa"
                                    )
                                  );
                              }
                            }}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            ❌ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
