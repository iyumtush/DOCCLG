
"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */



import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  Clock,
  Download,
  FileText,
  Plus,
  XCircle,
  Hash,
  BookOpen,
  Milestone,
  Building,
  AlertCircle,
  ArrowRight,
  Send,
  ShieldCheck,
  Award,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface DocumentRequest {
  id: string;
  documentType: string;
  customDocumentName?: string;
  purpose: string;
  additionalDetails?: string;
  status: string;
  certificateId?: string;
  certificateUrl?: string;
  createdAt: string;
  classInchargeComments?: string;
  hodComments?: string;
  rejectionReason?: string;
}

interface StudentUser {
  name: string;
  email: string;
  role: string;
  registrationNumber?: string;

  branch?: string;
  section?: string;

  collegeId?: string;
  rollNumber?: string;
  course?: string;
  yearOfStudy?: string;
}

interface StudentDashboardProps {
  user: StudentUser;
  token: string;
  onLogout: () => void;
}

const emptyFormData = {
  documentType: "",
  customDocumentName: "",
  purpose: "",
  additionalDetails: "",
  academicSession: "",
  semester: "",
};

const academicSessions = Array.from({ length: 5 }, (_, index) => {
  const startYear = new Date().getFullYear() + index;
  return `${startYear}-${startYear + 1}`;
});


export default function StudentDashboard({
  user,
  token,
  onLogout,
}: StudentDashboardProps) {
  const storedUser = typeof window !== "undefined"
    ? JSON.parse(sessionStorage.getItem("user") || "null")
    : null;

  const storedToken = typeof window !== "undefined"
    ? sessionStorage.getItem("token")
    : null;

  const finalUser = user || storedUser;
  const finalToken = token || storedToken;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<StudentUser>(
    finalUser || user
  );
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    name: user.name,
    email: user.email,
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyFormData);
  const [creating, setCreating] = useState(false);
  const [isCustomSession, setIsCustomSession] = useState(false);
  const [customSessionVal, setCustomSessionVal] = useState("");

  // Track previous request statuses for notifications
  const [previousStatuses, setPreviousStatuses] = useState<Record<string, string>>({});

  const engineeringCourses = ["B.Tech", "B.E", "M.Tech"];

  useEffect(() => {
    const activeUser = finalUser || user;

    setCurrentUser(activeUser);

    setEditData({
      name: activeUser.name,
      email: activeUser.email,
    });
  }, [user]);

  useEffect(() => {
    if (!isCreateDialogOpen) {
      setFormData(emptyFormData);
      setIsCustomSession(false);
      setCustomSessionVal("");
    }
  }, [isCreateDialogOpen]);

  const fetchRequests = async () => {
    if (!finalToken) return;

    if (initialLoad) setLoading(true);

    try {
      const res = await fetch("https://docclg-backend.onrender.com/api/requests", {
        headers: {
          Authorization: `Bearer ${finalToken}`,
        },
      });

      if (res.status === 401) {
        onLogout();
        router.push("/");
        return;
      }

      if (!res.ok) {
        toast.error("Failed to load requests");
        return;
      }

      const data = await res.json();

      const incomingRequests = Array.isArray(data)
        ? data
        : data.requests || data.data || [];

      // Toast notifications for real-time status updates
      incomingRequests.forEach((request: DocumentRequest) => {
        const previousStatus = previousStatuses[request.id];

        if (previousStatus && previousStatus !== request.status) {
          if (request.status === "CLASS_INCHARGE_APPROVED") {
            toast.success(
              `${getDocumentTypeLabel(
                request.documentType,
                request.customDocumentName
              )} approved by Class Incharge`
            );
          }

          if (request.status === "HOD_APPROVED") {
            toast.success(
              `${getDocumentTypeLabel(
                request.documentType,
                request.customDocumentName
              )} approved successfully`
            );
          }

          if (request.status === "REJECTED") {
            toast.error(
              `${getDocumentTypeLabel(
                request.documentType,
                request.customDocumentName
              )} request rejected`
            );
          }
        }
      });

      const updatedStatuses: Record<string, string> = {};
      incomingRequests.forEach((request: DocumentRequest) => {
        updatedStatuses[request.id] = request.status;
      });

      setPreviousStatuses(updatedStatuses);
      setRequests(incomingRequests);
    } catch (err) {
      console.error("Failed to fetch requests", err);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [onLogout, router, finalToken]);

  useEffect(() => {
    if (!finalToken) return;

    const interval = setInterval(() => {
      fetchRequests();
    }, 5000);

    return () => clearInterval(interval);
  }, [finalToken]);

  const handleCreateRequest = async () => {
    try {
      setCreating(true);
      // Refactored validation: always require course, yearOfStudy, academicSession, semester
      if (
        !formData.academicSession?.trim() ||
        !formData.semester
      ) {
        toast.error("Please fill in Academic Session and Semester.");
        setCreating(false);
        return;
      }
      const res = await fetch("https://docclg-backend.onrender.com/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${finalToken}`,
        },
        body: JSON.stringify({
          ...formData,
          course: currentUser.course,
          yearOfStudy: currentUser.yearOfStudy,
        }),
      });

      if (!res.ok) {
        let errorData: { message?: string } = {};

        try {
          errorData = await res.json();
        } catch {
          errorData = { message: "Server error" };
        }

        toast.error(errorData.message || "Failed to create request");
        return;
      }

      const data = await res.json();
      const createdRequest = data.request;

      if (createdRequest) {
        await fetchRequests();
      }

      toast.success("Request created successfully");
      setIsCreateDialogOpen(false);
      setFormData(emptyFormData);
    } catch (err) {
      console.error("Create request failed", err);
      toast.error("Request failed");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveProfile = () => {
    const updatedUser = {
      ...currentUser,
      name: editData.name,
      email: editData.email,
    };

    setCurrentUser(updatedUser);
    sessionStorage.setItem("user", JSON.stringify(updatedUser));
    setIsEditOpen(false);
    toast.success("Profile updated locally");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="border-yellow-200 bg-yellow-50 text-yellow-700"
          >
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "CLASS_INCHARGE_APPROVED":
        return (
          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-50 text-blue-700"
          >
            <Clock className="mr-1 h-3 w-3" />
            With HOD
          </Badge>
        );
      case "HOD_APPROVED":
        return (
          <Badge
            variant="outline"
            className="border-green-200 bg-green-50 text-green-700"
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="border-red-200 bg-red-50 text-red-700"
          >
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge
            variant="outline"
            className="border-green-200 bg-green-50 text-green-700"
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocumentTypeLabel = (type: string, customName?: string) => {
    if (type === "CUSTOM" && customName) {
      return customName;
    }

    switch (type) {
      case "BONAFIDE":
        return "Bonafide Certificate";
      case "ATTENDANCE":
        return "Attendance Certificate";
      case "RECOMMENDATION":
        return "Recommendation Certificate";
      case "CHARACTER":
        return "Character Certificate";
      default:
        return type;
    }
  };

  const issuedCertificates = requests.filter(
    (request) => request.status === "HOD_APPROVED" || request.status === "COMPLETED"
  );

  const pendingRequests = requests.filter(
    (request) =>
      request.status === "PENDING" ||
      request.status === "CLASS_INCHARGE_APPROVED"
  );

  const approvedHistory = requests.filter(
    (request) =>
      request.status === "HOD_APPROVED" ||
      request.status === "COMPLETED"
  );

  const rejectedHistory = requests.filter(
    (request) => request.status === "REJECTED"
  );

  if (loading && initialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-16 rounded-2xl bg-gray-200" />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="h-80 rounded-2xl bg-gray-200" />
            <div className="h-48 rounded-2xl bg-gray-200" />
            <div className="lg:col-span-2 h-[500px] rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

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
                <p className="text-[10px] font-medium text-blue-600">Student Portal</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-sm font-semibold text-gray-900">{currentUser.name}</span>
                <span className="text-xs text-gray-500 uppercase">{currentUser.role}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                onClick={onLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Card className="border-blue-100 bg-blue-50/20 hover:shadow-md transition-all duration-300">
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Requests</p>
                <h3 className="text-2xl font-bold text-gray-900">{requests.length}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-100 bg-yellow-50/20 hover:shadow-md transition-all duration-300">
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="rounded-xl bg-yellow-100 p-3 text-yellow-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
                <h3 className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100 bg-green-50/20 hover:shadow-md transition-all duration-300">
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="rounded-xl bg-green-100 p-3 text-green-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Certificates</p>
                <h3 className="text-2xl font-bold text-green-600">{approvedHistory.length}</h3>
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
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm uppercase tracking-wider text-[10px]">
                  {currentUser.role}
                </Badge>
              </div>

              {/* Avatar section */}
              <div className="-mt-12 flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-2xl font-bold text-white shadow-md">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="mt-3 text-center px-4">
                  <h2 className="text-xl font-bold text-gray-900">{currentUser.name}</h2>
                  <p className="text-xs text-gray-500">{currentUser.email}</p>
                </div>
              </div>

              {/* Profile details list */}
              <CardContent className="px-6 py-6 space-y-4">
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center text-sm">
                    <Hash className="mr-3 h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-500 w-24 shrink-0 font-medium">College ID</span>
                    <span className="text-gray-900 font-semibold truncate">{currentUser.collegeId || "-"}</span>
                  </div>

                  <div className="flex items-center text-sm">
                    <Hash className="mr-3 h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-500 w-24 shrink-0 font-medium">Roll Number</span>
                    <span className="text-gray-900 font-semibold truncate">{currentUser.rollNumber || "-"}</span>
                  </div>

                  <div className="flex items-center text-sm">
                    <BookOpen className="mr-3 h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-500 w-24 shrink-0 font-medium">Course</span>
                    <span className="text-gray-900 font-semibold">{currentUser.course || "-"}</span>
                  </div>

                  <div className="flex items-center text-sm">
                    <Milestone className="mr-3 h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-500 w-24 shrink-0 font-medium">Year of Study</span>
                    <span className="text-gray-900 font-semibold">{currentUser.yearOfStudy || "-"}</span>
                  </div>

                  {currentUser.branch && (
                    <div className="flex items-start text-sm">
                      <Building className="mr-3 h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-gray-500 w-24 shrink-0 font-medium">Branch</span>
                      <span className="text-gray-900 font-semibold leading-tight">{currentUser.branch}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm">
                    <Milestone className="mr-3 h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-500 w-24 shrink-0 font-medium">Section</span>
                    <span className="text-gray-900 font-semibold">{currentUser.section || "-"}</span>
                  </div>
                </div>

                <div className="border-t pt-4 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-10 border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold"
                    onClick={() => {
                      setEditData({
                        name: currentUser.name,
                        email: currentUser.email,
                      });
                      setIsEditOpen(true);
                    }}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 rounded-xl h-10 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-semibold"
                    onClick={onLogout}
                  >
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="requests" className="w-full">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <TabsList className="grid grid-cols-3 w-full sm:w-auto rounded-xl bg-gray-100 p-1 h-11">
                  <TabsTrigger className="rounded-lg text-sm font-semibold" value="requests">My Requests</TabsTrigger>
                  <TabsTrigger className="rounded-lg text-sm font-semibold" value="history">History</TabsTrigger>
                  <TabsTrigger className="rounded-lg text-sm font-semibold" value="certificates">Certificates</TabsTrigger>
                </TabsList>

                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm h-10 px-4 shrink-0"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Request
                </Button>
              </div>

              <TabsContent value="requests" className="space-y-4">
                {requests.length === 0 ? (
                  <Card className="border-dashed border-2 border-gray-200">
                    <CardContent className="py-12 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <FileText className="h-6 w-6" />
                      </div>
                      <h3 className="mb-2 text-lg font-bold text-gray-900">No Requests Yet</h3>
                      <p className="mb-6 text-sm text-gray-500 max-w-sm mx-auto">
                        Start by creating a new document request. Your approval status and certificate history will appear here.
                      </p>
                      <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Request
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  requests.map((request) => {
                    const isRejected = request.status === "REJECTED";

                    // Determine current workflow stage (0 = Submitted, 1 = Class Incharge, 2 = HOD, 3 = Completed)
                    let currentStage = 0;
                    if (request.status === "PENDING") {
                      currentStage = 1; // active stage is Class Incharge
                    } else if (request.status === "CLASS_INCHARGE_APPROVED") {
                      currentStage = 2; // active stage is HOD
                    } else if (request.status === "HOD_APPROVED" || request.status === "COMPLETED") {
                      currentStage = 4; // All stages completed
                    } else if (isRejected) {
                      currentStage = request.hodComments ? 2 : 1;
                    }

                    const getLineWidth = () => {
                      if (currentStage === 1) return "33.33%";
                      if (currentStage === 2) return "66.66%";
                      if (currentStage === 4) return "100%";
                      return "0%";
                    };

                    return (
                      <Card key={request.id} className="overflow-hidden border border-gray-100 hover:border-gray-198 hover:shadow-md transition-all duration-300 bg-white rounded-2xl">
                        <CardHeader className="pb-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                              <CardTitle className="text-lg font-bold text-gray-900">
                                {getDocumentTypeLabel(
                                  request.documentType,
                                  request.customDocumentName
                                )}
                              </CardTitle>
                              <CardDescription className="text-xs mt-1 text-gray-500">
                                Requested on {new Date(request.createdAt).toLocaleDateString("en-US", {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </CardDescription>
                            </div>
                            <div className="shrink-0">
                              {getStatusBadge(request.status)}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-6">
                          {/* Visual Stepper Workflow */}
                          <div className="bg-gray-50/50 rounded-xl p-4 sm:p-6 border border-gray-100 relative">
                            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">

                              {/* Horizontal connector line wrapper (spans exact center-to-center distance) */}
                              <div className="absolute top-[20px] left-5 right-5 h-0.5 md:block hidden">
                                {/* Active progress fill line */}
                                <div
                                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${isRejected ? "bg-red-500" : "bg-green-500"
                                    }`}
                                  style={{
                                    width: getLineWidth()
                                  }}
                                />
                              </div>

                              {/* Stepper Steps */}
                              {[
                                { label: "Submitted", sub: "Request Sent", icon: Send },
                                { label: "Class Incharge", sub: "Review & Sign", icon: ShieldCheck },
                                { label: "HOD Approval", sub: "Final Signoff", icon: Award },
                                { label: "Completed", sub: "Ready for Download", icon: Check }
                              ].map((step, idx) => {
                                const StepIcon = step.icon;

                                // Determine step state: completed, active, pending, or rejected
                                let stepState: "completed" | "active" | "pending" | "rejected" = "pending";

                                if (isRejected) {
                                  if (currentStage === idx) {
                                    stepState = "rejected";
                                  } else if (idx < currentStage) {
                                    stepState = "completed";
                                  } else {
                                    stepState = "pending";
                                  }
                                } else {
                                  if (idx < currentStage) {
                                    stepState = "completed";
                                  } else if (idx === currentStage) {
                                    stepState = "active";
                                  } else {
                                    stepState = "pending";
                                  }
                                }

                                return (
                                  <div key={idx} className="relative z-10 flex flex-row md:flex-col items-center gap-3 md:gap-2 w-full md:w-auto md:text-center">
                                    {/* Icon container */}
                                    <div
                                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${stepState === "completed"
                                        ? "bg-green-600 border-green-600 text-white shadow-sm"
                                        : stepState === "active"
                                          ? "bg-white border-green-500 text-green-600 animate-stepper-pulse"
                                          : stepState === "rejected"
                                            ? "bg-red-500 border-red-500 text-white animate-stepper-pulse-rejected"
                                            : "bg-white border-gray-200 text-gray-400"
                                        }`}
                                    >
                                      {stepState === "rejected" ? (
                                        <XCircle className="h-5 w-5" />
                                      ) : stepState === "completed" ? (
                                        <Check className="h-5 w-5 stroke-[3px]" />
                                      ) : (
                                        <StepIcon className="h-5 w-5" />
                                      )}
                                    </div>

                                    <div className="flex flex-col md:items-center">
                                      <span className={`text-xs font-bold ${stepState === "rejected"
                                        ? "text-red-600"
                                        : stepState === "completed"
                                          ? "text-green-700"
                                          : stepState === "active"
                                            ? "text-green-600"
                                            : "text-gray-500"
                                        }`}>
                                        {step.label}
                                      </span>
                                      <span className="text-[10px] text-gray-400 hidden sm:inline md:block mt-0.5">{step.sub}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* stage description / alerts */}
                            <div className="mt-5 border-t pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
                              <span>
                                Current Stage:{" "}
                                <strong className={`font-semibold ${isRejected ? "text-red-600" : "text-gray-700"}`}>
                                  {isRejected
                                    ? "Rejected"
                                    : request.status === "PENDING"
                                      ? "Verification by Class Incharge"
                                      : request.status === "CLASS_INCHARGE_APPROVED"
                                        ? "Final Signature by HOD"
                                        : "Approved & Issued"}
                                </strong>
                              </span>
                              <span>
                                Last update: {new Date(request.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Purpose</span>
                              <p className="text-gray-700 font-medium leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">{request.purpose}</p>
                            </div>
                            {request.additionalDetails && (
                              <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Additional Details</span>
                                <p className="text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">{request.additionalDetails}</p>
                              </div>
                            )}
                          </div>

                          {/* Rejection reason box */}
                          {isRejected && (request.classInchargeComments || request.hodComments) && (
                            <div className="flex items-start space-x-3 rounded-xl border border-red-100 bg-red-50/50 p-4">
                              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                              <div className="space-y-2">
                                <h4 className="text-sm font-bold text-red-800">Rejection Details</h4>
                                {request.classInchargeComments && (
                                  <p className="text-xs text-red-700 leading-relaxed">
                                    <strong className="font-semibold">Class Incharge:</strong> {request.classInchargeComments}
                                  </p>
                                )}
                                {request.hodComments && (
                                  <p className="text-xs text-red-700 leading-relaxed">
                                    <strong className="font-semibold">HOD:</strong> {request.hodComments}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Comments for approved requests */}
                          {!isRejected && (request.classInchargeComments || request.hodComments) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {request.classInchargeComments && (
                                <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-3">
                                  <strong className="block font-semibold text-gray-500 mb-1">Class Incharge Feedback</strong>
                                  <p className="text-gray-600">{request.classInchargeComments}</p>
                                </div>
                              )}
                              {request.hodComments && (
                                <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-3">
                                  <strong className="block font-semibold text-gray-500 mb-1">HOD Feedback</strong>
                                  <p className="text-gray-600">{request.hodComments}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Certificate download / details */}
                          {(request.certificateId || request.certificateUrl) && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t pt-4">
                              {request.certificateId && (
                                <div className="space-y-0.5">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Certificate Reference ID</span>
                                  <p className="text-xs font-mono text-gray-700 font-bold bg-gray-100 rounded px-2 py-1 inline-block">{request.certificateId}</p>
                                </div>
                              )}
                              {request.certificateUrl && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm h-9 px-4 shrink-0 transition-all font-semibold"
                                  asChild
                                >
                                  <a href={request.certificateUrl} target="_blank" rel="noreferrer">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Certificate
                                  </a>
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="border-b pb-4">
                    <CardTitle className="text-lg font-bold text-gray-900">Approved History</CardTitle>
                    <CardDescription className="text-xs text-gray-500">
                      Previously approved document requests
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-6">
                    {approvedHistory.length === 0 ? (
                      <div className="py-8 text-center text-sm text-gray-500">
                        <CheckCircle className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                        No approved requests found.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {approvedHistory.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between rounded-xl border border-green-100 bg-green-50/30 p-4 hover:bg-green-50/50 transition-colors duration-200"
                          >
                            <div className="space-y-1">
                              <p className="font-bold text-sm text-gray-900">
                                {getDocumentTypeLabel(
                                  request.documentType,
                                  request.customDocumentName
                                )}
                              </p>
                              <p className="text-xs text-gray-500">
                                Approved on {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>

                            <Badge className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-2.5 py-0.5 border-0">
                              Approved
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="border-b pb-4">
                    <CardTitle className="text-lg font-bold text-gray-900">Rejected History</CardTitle>
                    <CardDescription className="text-xs text-gray-500">
                      Previously rejected document requests
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-6">
                    {rejectedHistory.length === 0 ? (
                      <div className="py-8 text-center text-sm text-gray-500">
                        <XCircle className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                        No rejected requests found.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {rejectedHistory.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50/30 p-4 hover:bg-red-50/50 transition-colors duration-200"
                          >
                            <div className="space-y-1">
                              <p className="font-bold text-sm text-gray-900">
                                {getDocumentTypeLabel(
                                  request.documentType,
                                  request.customDocumentName
                                )}
                              </p>
                              <p className="text-xs text-gray-500">
                                Rejected on {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>

                            <Badge className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2.5 py-0.5 border-0">
                              Rejected
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="certificates" className="space-y-4">
                <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="border-b pb-4">
                    <CardTitle className="text-lg font-bold text-gray-900">Issued Certificates</CardTitle>
                    <CardDescription className="text-xs text-gray-500">
                      Download your approved and issued certificates
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-6">
                    {issuedCertificates.length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                          <FileText className="h-6 w-6" />
                        </div>
                        <h3 className="mb-2 text-md font-bold text-gray-900">No Certificates Issued</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">
                          Your approved academic certificates will appear here once ready for download.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {issuedCertificates.map((request) => (
                          <div
                            key={request.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gray-100 p-4 hover:bg-gray-50/50 transition-colors duration-200"
                          >
                            <div className="space-y-1">
                              <h4 className="font-bold text-sm text-gray-900">
                                {getDocumentTypeLabel(
                                  request.documentType,
                                  request.customDocumentName
                                )}
                              </h4>
                              <p className="text-xs text-gray-500">
                                Reference ID: <code className="font-mono text-gray-700 bg-gray-100 px-1 rounded">{request.certificateId || "-"}</code>
                              </p>
                              <p className="text-[10px] text-gray-400">
                                Issued on {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm h-9 px-4 shrink-0 transition-colors font-semibold"
                              disabled={!request.certificateUrl}
                              asChild={Boolean(request.certificateUrl)}
                            >
                              {request.certificateUrl ? (
                                <a
                                  href={request.certificateUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </a>
                              ) : (
                                <span>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </span>
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Document Request</DialogTitle>
              <DialogDescription>
                Fill out the form below to request a new document.
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!creating) handleCreateRequest();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, documentType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BONAFIDE">Bonafide Certificate</SelectItem>
                    <SelectItem value="ATTENDANCE">
                      Attendance Certificate
                    </SelectItem>
                    <SelectItem value="RECOMMENDATION">
                      Recommendation Certificate
                    </SelectItem>
                    <SelectItem value="CHARACTER">
                      Character Certificate
                    </SelectItem>
                    <SelectItem value="CUSTOM">Custom Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.documentType === "CUSTOM" ? (
                <div className="space-y-2">
                  <Label htmlFor="customDocumentName">Custom Document Name</Label>
                  <Input
                    id="customDocumentName"
                    value={formData.customDocumentName}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        customDocumentName: event.target.value,
                      }))
                    }
                    placeholder="Enter document name"
                    required
                  />
                </div>
              ) : null}

              {/* Move Course/Year/Session block here */}
              {formData.documentType && (
                <div className="space-y-4">


                  <div className="space-y-2">
                    <Label>Academic Session</Label>
                    <Select
                      value={isCustomSession ? "CUSTOM" : (formData.academicSession || "")}
                      onValueChange={(value) => {
                        if (value === "CUSTOM") {
                          setIsCustomSession(true);
                          setFormData((prev) => ({
                            ...prev,
                            academicSession: customSessionVal,
                          }));
                        } else {
                          setIsCustomSession(false);
                          setFormData((prev) => ({
                            ...prev,
                            academicSession: value,
                          }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Academic Session" />
                      </SelectTrigger>

                      <SelectContent>
                        {academicSessions.map((session) => (
                          <SelectItem key={session} value={session}>
                            {session}
                          </SelectItem>
                        ))}
                        <SelectItem value="CUSTOM">Other (Enter custom session)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isCustomSession && (
                    <div className="space-y-2">
                      <Label htmlFor="customAcademicSession">Custom Academic Session</Label>
                      <Input
                        id="customAcademicSession"
                        value={customSessionVal}
                        onChange={(event) => {
                          const val = event.target.value;
                          setCustomSessionVal(val);
                          setFormData((prev) => ({
                            ...prev,
                            academicSession: val,
                          }));
                        }}
                        placeholder="e.g. 2024-2025"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Format as YYYY-YYYY or YYYY-YY (e.g., 2025-2026 or 2025-26) for correct document generation.
                      </p>
                    </div>
                  )}
                  {/* Semester Selector */}
                  <div className="space-y-2">
                    <Label>Current Semester</Label>
                    <Select
                      value={formData.semester || ""}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          semester: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Current Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {engineeringCourses.includes(currentUser.course || "")
                          ? Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                            <SelectItem key={sem} value={`Semester ${sem}`}>
                              Semester {sem}
                            </SelectItem>
                          ))
                          : Array.from({ length: 6 }, (_, i) => i + 1).map((sem) => (
                            <SelectItem key={sem} value={`Semester ${sem}`}>
                              Semester {sem}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  id="purpose"
                  value={formData.purpose}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      purpose: event.target.value,
                    }))
                  }
                  placeholder="Purpose of the document"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalDetails">
                  Additional Details (Optional)
                </Label>
                <Textarea
                  id="additionalDetails"
                  value={formData.additionalDetails}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      additionalDetails: event.target.value,
                    }))
                  }
                  placeholder="Any additional information"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating Request..." : "Create Request"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your local dashboard details.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studentName">Name</Label>
                <Input
                  id="studentName"
                  value={editData.name}
                  onChange={(event) =>
                    setEditData((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentEmail">Email</Label>
                <Input
                  id="studentEmail"
                  value={editData.email}
                  onChange={(event) =>
                    setEditData((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
