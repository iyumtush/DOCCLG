"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Upload, Mail, User, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SupportPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      let screenshotUrl = "";

      if (screenshot) {
        const uploadData = new FormData();
        uploadData.append("file", screenshot);

        const uploadResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/api/upload`,
          {
            method: "POST",
            body: uploadData,
          }
        );

        const uploadResult = await uploadResponse.json();

        if (uploadResult.success) {
          screenshotUrl = uploadResult.url;
        }
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/support`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            screenshotUrl,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit request");
      }

      toast.success("Support request submitted successfully");

      setForm({
        name: "",
        email: "",
        title: "",
        description: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to submit support request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 border">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Contact Support
          </h1>

          <p className="text-center text-gray-600 mb-8">
            Facing an issue? Submit your problem and our team will review it.
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg pl-10 pr-4 py-3"
                  placeholder="Enter your name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border rounded-lg pl-10 pr-4 py-3"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Issue Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded-lg px-4 py-3"
                placeholder="Briefly describe the issue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Issue Description</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded-lg pl-10 pr-4 py-3"
                  placeholder="Explain the issue in detail"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Upload Screenshot</label>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer hover:bg-gray-50">
                <Upload className="w-5 h-5" />
                <span>Choose Screenshot</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setScreenshot(e.target.files[0]);
                    }
                  }}
                />
              </label>
              {screenshot && (
                <p className="text-sm text-green-600 mt-2">
                  Selected: {screenshot.name}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl"
            >
              {loading ? "Submitting..." : "Submit Support Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}