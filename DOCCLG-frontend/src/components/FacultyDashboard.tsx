

"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  CheckCircle,
  Clock,
  Download,
  FileText,
  XCircle,
  User,
  Mail,
  Building,
  Hash,
  Shield,
  Activity,
  AlertCircle,
  Calendar,
  ChevronRight,
  GraduationCap
} from "lucide-react";

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
  course?: string;
  yearOfStudy?: string;
  academicSession?: string;
  semester?: string;
  section?: string;
  
attendancePercentage?: number | undefined;
  student: {
  name: string;
  email: string;
  branch: string;
  section?: string;

    
  };
};

export default function FacultyDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [attendanceInputs, setAttendanceInputs] = useState<Record<string, string>>({});
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
      const res = await fetch("https://docclg-backend.onrender.com/api/auth/me", {
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
      const res = await fetch("https://docclg-backend.onrender.com/api/requests", {
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

      const res = await fetch(`https://docclg-backend.onrender.com/api/requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
body: JSON.stringify({
  status: mappedStatus,
  attendancePercentage:
    attendanceInputs[id] && attendanceInputs[id] !== ""
      ? Number(attendanceInputs[id])
      : undefined,
}),      });

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="/collegedocs-logo.png"
                alt="CollegeDocs Logo"
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">CollegeDocs</h1>
                <p className="text-[10px] font-medium text-blue-600">Faculty Portal</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-sm font-semibold text-gray-900">{user?.name}</span>
                <span className="text-xs text-gray-500 uppercase">{user?.role}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors" 
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <Card className="border-yellow-100 bg-yellow-50/20 hover:shadow-md transition-all duration-300">
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="rounded-xl bg-yellow-100 p-3 text-yellow-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <h3 className="text-2xl font-bold text-yellow-600">{pending}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-blue-50/20 hover:shadow-md transition-all duration-300">
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Waiting HOD</p>
                <h3 className="text-2xl font-bold text-blue-600">{waiting}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100 bg-green-50/20 hover:shadow-md transition-all duration-300">
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="rounded-xl bg-green-100 p-3 text-green-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Final Approved</p>
                <h3 className="text-2xl font-bold text-green-600">{approved}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-100 bg-red-50/20 hover:shadow-md transition-all duration-300">
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="rounded-xl bg-red-100 p-3 text-red-600">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <h3 className="text-2xl font-bold text-red-600">{rejected}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="overflow-hidden rounded-2xl border-0 shadow-md bg-white">
              {/* Header banner */}
              <div className="h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-end px-4">
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm uppercase tracking-wider text-[10px] px-3 py-1 rounded-full">
                  {user?.role === "CLASS_INCHARGE" ? "Class Incharge" : user?.role}
                </Badge>
              </div>

              {/* Avatar section */}
              <div className="-mt-12 flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-2xl font-bold text-white shadow-md">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="mt-3 text-center px-4">
                  <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>

              {/* Profile details list */}
              <CardContent className="px-6 py-6 space-y-4">
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-start text-sm">
                    <Building className="mr-3 h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                    <span className="text-gray-500 w-24 shrink-0 font-medium">Department</span>
                    <span className="text-gray-900 font-semibold leading-tight">{user?.branch || "-"}</span>
                  </div>

                  {user?.section && (
                    <div className="flex items-center text-sm">
                      <Hash className="mr-3 h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-gray-500 w-24 shrink-0 font-medium">Section</span>
                      <span className="text-gray-900 font-semibold">{user.section}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm">
                    <Shield className="mr-3 h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-500 w-24 shrink-0 font-medium">Auth Level</span>
                    <span className="text-gray-900 font-semibold">{user?.role === "CLASS_INCHARGE" ? "Level 1 (CI)" : "Level 2 (HOD)"}</span>
                  </div>
                </div>

                <div className="border-t pt-4 flex gap-2">
                  <Button
                    variant="ghost"
                    className="w-full rounded-xl h-10 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-semibold"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <TabsList className="grid grid-cols-2 w-full sm:w-auto rounded-xl bg-gray-100 p-1 h-11">
                  <TabsTrigger className="rounded-lg text-sm font-semibold" value="requests">Active Requests</TabsTrigger>
                  <TabsTrigger className="rounded-lg text-sm font-semibold" value="history">History Log</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="requests" className="space-y-4">
                {activeRequests.length === 0 ? (
                  <Card className="border-dashed border-2 border-gray-200">
                    <CardContent className="py-12 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <FileText className="h-6 w-6" />
                      </div>
                      <h3 className="mb-2 text-lg font-bold text-gray-900">No Active Requests</h3>
                      <p className="text-sm text-gray-500 max-w-sm mx-auto">
                        All student document requests have been successfully processed. New requests will appear here dynamically.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  activeRequests.map((req) => (
                    <Card key={req.id} className="overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300 bg-white rounded-2xl">
                      <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div>
                            <CardTitle className="text-lg font-bold text-gray-900">
                              📄 {req.documentType}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1 text-gray-500">
                              Requested on {new Date(req.createdAt).toLocaleDateString("en-US", {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </CardDescription>
                          </div>
                          
                          <div className="shrink-0">
                            <Badge
                              className={`text-xs px-3 py-1 rounded-full font-semibold border-0 ${
                                req.status === "HOD_APPROVED"
                                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                                  : req.status === "REJECTED"
                                  ? "bg-red-100 text-red-700 hover:bg-red-100"
                                  : req.status === "CLASS_INCHARGE_APPROVED"
                                  ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                  : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                              }`}
                            >
                              {req.status === "PENDING" ? "With Class Incharge" : req.status === "CLASS_INCHARGE_APPROVED" ? "With HOD" : req.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Student Details Grid */}
                        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block">Student Information</span>
                            <div className="flex items-center text-gray-700">
                              <User className="mr-2 h-3.5 w-3.5 text-gray-400 shrink-0" />
                              <strong className="font-semibold text-gray-900">{req.student?.name}</strong>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Mail className="mr-2 h-3.5 w-3.5 text-gray-400 shrink-0" />
                              <span>{req.student?.email}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Building className="mr-2 h-3.5 w-3.5 text-gray-400 shrink-0" />
                              <span>{req.student?.branch}</span>
                            </div>
                            {req.student?.section && (
                              <div className="flex items-center text-gray-600">
                                <Hash className="mr-2 h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <span>Section {req.student.section}</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block">Academic Context</span>
                            <div className="text-gray-700"><span className="font-medium text-gray-500">Course:</span> {req.course || "-"}</div>
                            <div className="text-gray-700"><span className="font-medium text-gray-500">Year:</span> {req.yearOfStudy || "-"}</div>
                            <div className="text-gray-700"><span className="font-medium text-gray-500">Semester:</span> {req.semester || "-"}</div>
                            <div className="text-gray-700"><span className="font-medium text-gray-500">Session:</span> {req.academicSession || "-"}</div>
                          </div>
                        </div>

                        {/* Purpose and details */}
                        <div className="space-y-1 text-sm">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block">Request Purpose</span>
                          <p className="text-gray-700 font-medium leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">{req.purpose}</p>
                        </div>
                        
                        {req.additionalDetails && (
                          <div className="space-y-1 text-sm">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block">Additional Details</span>
                            <p className="text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">{req.additionalDetails}</p>
                          </div>
                        )}

                        {/* Attendance input for level 1 (Class Incharge) for Attendance certificates */}
                        {user.role === "CLASS_INCHARGE" &&
                          (req.documentType || "").toUpperCase().includes("ATTENDANCE") &&
                          req.status === "PENDING" && (
                            <div className="mt-4 bg-blue-50/30 rounded-xl p-4 border border-blue-100/50 space-y-2">
                              <label className="block text-xs font-semibold text-blue-900 uppercase tracking-wider">
                                Attendance Percentage (%)
                              </label>
                              <div className="flex items-center space-x-3">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={attendanceInputs[req.id] || ""}
                                  onChange={(e) =>
                                    setAttendanceInputs((prev) => ({
                                      ...prev,
                                      [req.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="e.g. 85.50"
                                  className="w-36 border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                                />
                                <span className="text-xs text-gray-500 font-medium">Entering accurate attendance is required before approval.</span>
                              </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        {((user.role === "CLASS_INCHARGE" && req.status === "PENDING") ||
                          (user.role === "HOD" && req.status === "CLASS_INCHARGE_APPROVED")) && (
                            <div className="flex items-center gap-3 pt-3 border-t">
                              <Button
                                className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm h-9 px-6 font-semibold transition-all duration-200"
                                onClick={() => {
                                  if (
                                    user.role === "CLASS_INCHARGE" &&
                                    (req.documentType || "").toUpperCase().includes("ATTENDANCE") &&
                                    !attendanceInputs[req.id]
                                  ) {
                                    toast.error("Please enter attendance percentage");
                                    return;
                                  }
                                  updateStatus(req.id, "APPROVED");
                                }}
                              >
                                Approve Request
                              </Button>

                              <Button
                                variant="destructive"
                                className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-100 rounded-xl h-9 px-6 font-semibold transition-all duration-200"
                                onClick={() => updateStatus(req.id, "REJECTED")}
                              >
                                Reject
                              </Button>
                            </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                {/* Secondary History tab triggers */}
                <div className="flex gap-2 bg-gray-100 rounded-xl p-1 w-fit">
                  <button
                    onClick={() => setHistoryTab("approved")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      historyTab === "approved"
                        ? "bg-green-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Approved History ({approvedHistory.length})
                  </button>

                  <button
                    onClick={() => setHistoryTab("rejected")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      historyTab === "rejected"
                        ? "bg-red-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Rejected History ({rejectedHistory.length})
                  </button>
                </div>

                {historyTab === "approved" ? (
                  <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="border-b pb-4">
                      <CardTitle className="text-lg font-bold text-gray-900">Approved History</CardTitle>
                      <CardDescription className="text-xs text-gray-500">
                        List of requests approved by you
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-6">
                      {approvedHistory.length === 0 ? (
                        <div className="py-8 text-center text-sm text-gray-500">
                          <CheckCircle className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                          No approved history records.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {approvedHistory.map((r) => (
                            <div
                              key={r.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-green-100 bg-green-50/30 p-4 hover:bg-green-50/50 transition-colors duration-200"
                            >
                              <div className="space-y-1">
                                <p className="font-bold text-sm text-gray-900">
                                  📄 {r.documentType}
                                </p>
                                <p className="text-xs text-gray-600 font-medium">
                                  Student: {r.student?.name} ({r.student?.branch})
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  Approved on {new Date(r.createdAt).toLocaleDateString()}
                                </p>
                              </div>

                              <Badge className="bg-green-600 hover:bg-green-600 text-white rounded-lg px-2.5 py-0.5 border-0 font-semibold text-xs self-start sm:self-center">
                                Approved
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="border-b pb-4">
                      <CardTitle className="text-lg font-bold text-gray-900">Rejected History</CardTitle>
                      <CardDescription className="text-xs text-gray-500">
                        List of requests rejected by you
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-6">
                      {rejectedHistory.length === 0 ? (
                        <div className="py-8 text-center text-sm text-gray-500">
                          <XCircle className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                          No rejected history records.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {rejectedHistory.map((r) => (
                            <div
                              key={r.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50/30 p-4 hover:bg-red-50/50 transition-colors duration-200"
                            >
                              <div className="space-y-1">
                                <p className="font-bold text-sm text-gray-900">
                                  📄 {r.documentType}
                                </p>
                                <p className="text-xs text-gray-600 font-medium">
                                  Student: {r.student?.name} ({r.student?.branch})
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  Rejected on {new Date(r.createdAt).toLocaleDateString()}
                                </p>
                              </div>

                              <Badge className="bg-red-600 hover:bg-red-600 text-white rounded-lg px-2.5 py-0.5 border-0 font-semibold text-xs self-start sm:self-center">
                                Rejected
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}