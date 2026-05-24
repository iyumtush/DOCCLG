/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

type Request = {
  id: string;
  documentType: string;
  purpose: string;
  status: string;
  createdAt: string;
  additionalDetails?: string;
  classInchargeComments?: string;
  hodComments?: string;
  rejectionReason?: string;
  certificateId?: string;
  certificateUrl?: string;
  student: {
    name: string;
    email: string;
    branch: string;
  };
};

export default function FacultyDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"requests" | "history">("requests");
  const [historyTab, setHistoryTab] = useState<"approved" | "rejected">("approved");

  // ================= AUTH =================



useEffect(() => {
  const savedUser = sessionStorage.getItem("user");
  const savedToken = sessionStorage.getItem("token");

  if (!savedUser || !savedToken) {
    setLoading(false);   // ✅ ADD THIS
    router.push("/");
    return;
  }

  const parsedUser = JSON.parse(savedUser);

  if (
    parsedUser.role !== "CLASS_INCHARGE" &&
    parsedUser.role !== "HOD"
  ) {
    setLoading(false);   // ✅ ADD THIS
    router.push("/");
    return;
  }

  setUser(parsedUser);
  setToken(savedToken);
}, [router]);


  useEffect(() => {
  const storedToken = sessionStorage.getItem("token");

  if (!storedToken) {
    setLoading(false);   // ✅ ADD THIS
    router.push("/");
    return;
  }

  setToken(storedToken);

  const fetchUser = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/auth/me", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (!res.ok) {
        setLoading(false);   // ✅ ADD THIS
        router.push("/");
        return;
      }

      const data = await res.json();

      if (
        data.user.role !== "CLASS_INCHARGE" &&
        data.user.role !== "HOD"
      ) {
        setLoading(false);   // ✅ ADD THIS
        router.push("/");
        return;
      }

      setUser(data.user);

    } catch (err) {
      console.error("User fetch failed", err);
      setLoading(false);   // ✅ ADD THIS
      router.push("/");
    }
  };

  fetchUser();
}, [router]);

  // ================= FETCH =================
  const fetchRequests = async () => {
    if (!token) return;

    try {
      const res = await fetch("http://localhost:4000/api/requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();

        if (Array.isArray(data)) setRequests(data);
        else if (data.requests) setRequests(data.requests);
        else if (data.data) setRequests(data.data);
        else setRequests([]);
      }
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !user) return;
    fetchRequests();
  }, [token, user]);

  useEffect(() => {
    if (!token || !user) return;

    const interval = setInterval(() => {
      fetchRequests();
    }, 5000);

    return () => clearInterval(interval);
  }, [token, user]);

  // ================= UPDATE =================
  const updateStatus = async (
    id: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    if (!token || !user) return;

    try {
      const mappedStatus =
        status === "APPROVED"
          ? user.role === "CLASS_INCHARGE"
            ? "CLASS_INCHARGE_APPROVED"
            : "HOD_APPROVED"
          : "REJECTED";

      const res = await fetch(`http://localhost:4000/api/requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: mappedStatus }),
      });

      if (res.ok) {
        if (status === "APPROVED") {
          toast.success(
            user.role === "CLASS_INCHARGE"
              ? "Request approved and forwarded to HOD"
              : "Request approved successfully"
          );
        } else {
          toast.error("Request rejected successfully");
        }

        await fetchRequests();
      } else {
        toast.error("Failed to update request status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/");
  };

  // ================= LOADING =================
  if (!user || loading) {
    return <p className="p-6">Loading faculty dashboard...</p>;
  }

  // ================= COUNTS (FIXED) =================
  const pending = requests.filter(r => r.status === "PENDING").length;
  const waiting = requests.filter(r => r.status === "CLASS_INCHARGE_APPROVED").length;
  const approved = requests.filter(r => r.status === "HOD_APPROVED").length;
  const rejected = requests.filter(r => r.status === "REJECTED").length;

  const activeRequests = requests.filter(
    (r) =>
      r.status === "PENDING" ||
      r.status === "CLASS_INCHARGE_APPROVED"
  );

  const approvedHistory = requests.filter(
    (r) => r.status === "HOD_APPROVED"
  );

  const rejectedHistory = requests.filter(
    (r) => r.status === "REJECTED"
  );

  console.log("ALL REQUESTS:", requests);

  return (
  <div className="min-h-screen bg-gray-100 p-6">

    {/* HEADER */}
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold">Faculty Dashboard</h1>
        <p className="text-sm text-gray-600">
          Welcome, {user?.name}
        </p>
      </div>

      <Button variant="outline" onClick={handleLogout}>
        Logout
      </Button>
    </div>

    {/* GRID */}
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

      {/* PROFILE */}
      <div className="bg-white rounded-2xl shadow p-6 text-center">
        <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
          {user?.name?.charAt(0)}
        </div>

        <h2 className="font-semibold text-lg">{user?.name}</h2>

        <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
          {user?.role}
        </span>

        <p className="text-sm text-gray-500 mt-2">{user?.email}</p>
      </div>

      {/* STATS */}
      <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="bg-yellow-100 p-4 rounded-xl">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-xl font-bold text-yellow-700">{pending}</p>
        </div>

        <div className="bg-blue-100 p-4 rounded-xl">
          <p className="text-sm text-gray-600">Waiting for HOD</p>
          <p className="text-xl font-bold text-blue-700">{waiting}</p>
        </div>

        <div className="bg-green-100 p-4 rounded-xl">
          <p className="text-sm text-gray-600">Final Approved</p>
          <p className="text-xl font-bold text-green-700">{approved}</p>
        </div>

        <div className="bg-red-100 p-4 rounded-xl">
          <p className="text-sm text-gray-600">Rejected</p>
          <p className="text-xl font-bold text-red-700">{rejected}</p>
        </div>

      </div>

      {/* REQUEST SECTION */}
      <div className="lg:col-span-4">

        {/* TAB BAR */}
        <div className="flex gap-2 bg-gray-200 rounded-2xl p-2 w-fit mb-6">

          <button
            onClick={() => setActiveTab("requests")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "requests"
                ? "bg-white shadow text-black"
                : "text-gray-600"
            }`}
          >
            Requests
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "history"
                ? "bg-white shadow text-black"
                : "text-gray-600"
            }`}
          >
            History
          </button>
        </div>

        {/* ACTIVE REQUESTS */}
        {activeTab === "requests" && (
          <div className="space-y-4">

        {activeRequests.map((req) => (
          <div key={req.id} className="bg-white p-5 rounded-xl shadow">

            <div className="flex justify-between items-start">

              <div>
                <h3 className="font-semibold text-lg">
                  📄 {req.documentType}
                </h3>

                <p className="text-sm text-gray-500">
                  👤 {req.student?.name} • {req.student?.branch}
                </p>

                <p className="text-xs text-gray-400">
                  {new Date(req.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* STATUS BADGE FIX */}
              <span
                className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  req.status === "HOD_APPROVED"
                    ? "bg-green-100 text-green-700"
                    : req.status === "REJECTED"
                    ? "bg-red-100 text-red-700"
                    : req.status === "CLASS_INCHARGE_APPROVED"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {req.status}
              </span>
            </div>

            <p className="mt-3 text-sm">
              <span className="font-medium">Purpose:</span> {req.purpose}
            </p>

            {/* ✅ MULTI-LEVEL APPROVAL FIX */}
            {(
              (user.role === "CLASS_INCHARGE" && req.status === "PENDING") ||
              (user.role === "HOD" && req.status === "CLASS_INCHARGE_APPROVED")
            ) && (
              <div className="flex gap-2 mt-4">

                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => updateStatus(req.id, "APPROVED")}
                >
                  Approve
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => updateStatus(req.id, "REJECTED")}
                >
                  Reject
                </Button>

              </div>
            )}

          </div>
        ))}
    </div>
  )}

  {/* HISTORY SECTION */}
  {activeTab === "history" && (
    <div className="space-y-4">

      {/* HISTORY TAB BAR */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-2 w-fit">

        <button
          onClick={() => setHistoryTab("approved")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            historyTab === "approved"
              ? "bg-green-600 text-white"
              : "text-gray-600"
          }`}
        >
          Approved History
        </button>

        <button
          onClick={() => setHistoryTab("rejected")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            historyTab === "rejected"
              ? "bg-red-600 text-white"
              : "text-gray-600"
          }`}
        >
          Rejected History
        </button>
      </div>


      {/* APPROVED HISTORY */}
      {historyTab === "approved" && (
        <div className="bg-white p-5 rounded-xl shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Approved History</h2>
            <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
              {approvedHistory.length} Approved
            </span>
          </div>

          {approvedHistory.length === 0 ? (
            <p className="text-sm text-gray-500">No approved requests found.</p>
          ) : (
            <div className="space-y-3">
              {approvedHistory.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-green-100 bg-green-50 p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      📄 {r.documentType}
                    </p>

                    <p className="text-sm text-gray-600">
                      👤 {r.student?.name} • {r.student?.branch}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    Approved
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REJECTED HISTORY */}
      {historyTab === "rejected" && (
        <div className="bg-white p-5 rounded-xl shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Rejected History</h2>
            <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-semibold">
              {rejectedHistory.length} Rejected
            </span>
          </div>

          {rejectedHistory.length === 0 ? (
            <p className="text-sm text-gray-500">No rejected requests found.</p>
          ) : (
            <div className="space-y-3">
              {rejectedHistory.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      📄 {r.documentType}
                    </p>

                    <p className="text-sm text-gray-600">
                      👤 {r.student?.name} • {r.student?.branch}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    Rejected
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )}

</div>
    </div>
  </div>
);
}