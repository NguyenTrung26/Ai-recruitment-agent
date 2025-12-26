"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function UploadPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    jobId: "",
    experience: "",
    coverLetter: "",
  });

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (
        ![
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(file.type)
      ) {
        setError("Only PDF and DOCX files are allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      setCvFile(file);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!cvFile) {
      setError("Please select a CV file");
      return;
    }

    if (!formData.fullName || !formData.email) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // Read file as FormData
      const formDataToSend = new FormData();
      formDataToSend.append("cvFile", cvFile);

      // Upload to n8n webhook
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK;
      if (!webhookUrl) {
        throw new Error("N8N webhook URL not configured");
      }

      const response = await fetch(
        webhookUrl.replace("/admin/decision", "/apply-cv"),
        {
          method: "POST",
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            jobId: formData.jobId,
            experience: formData.experience,
            coverLetter: formData.coverLetter,
            cvFile: cvFile.name,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload CV");
      }

      setSuccess("✓ CV submitted successfully! We will review it shortly.");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        jobId: "",
        experience: "",
        coverLetter: "",
      });
      setCvFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit CV");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            📤 Upload Your CV
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Join our recruitment process with AI-powered candidate screening
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="John Doe"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="john@example.com"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="+84 123 456 7890"
              />
            </div>

            {/* Job Position */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Job Position
              </label>
              <input
                type="text"
                name="jobId"
                value={formData.jobId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="e.g., Backend Developer"
              />
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Years of Experience
              </label>
              <input
                type="text"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="e.g., 3 years"
              />
            </div>

            {/* CV File Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Upload CV (PDF or DOCX) *
              </label>
              <div className="relative border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 hover:border-blue-500 transition">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.docx"
                  className="w-full cursor-pointer opacity-0 absolute inset-0"
                  required
                />
                <div className="text-center">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    {cvFile ? cvFile.name : "Drag and drop your CV here"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    or click to browse (Max 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Cover Letter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Cover Letter (Optional)
              </label>
              <textarea
                name="coverLetter"
                value={formData.coverLetter}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                placeholder="Tell us why you're interested in this position..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? "⏳ Uploading..." : "🚀 Submit Application"}
            </button>
          </form>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-3">
            ℹ️ How it works
          </h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-200 text-sm">
            <li>✓ Your CV will be automatically analyzed by AI</li>
            <li>✓ You'll receive an email with the results within 24 hours</li>
            <li>✓ If selected, we'll schedule an interview with you</li>
            <li>✓ All your data is secure and confidential</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
