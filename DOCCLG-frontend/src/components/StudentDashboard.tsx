
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
};

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
  const [currentUser, setCurrentUser] = useState<StudentUser>(user);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    name: user.name,
    email: user.email,
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyFormData);
  const [creating, setCreating] = useState(false);

  // Track previous request statuses for notifications
  const [previousStatuses, setPreviousStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    setCurrentUser(user);
    setEditData({
      name: user.name,
      email: user.email,
    });
  }, [user]);

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
      const res = await fetch("https://docclg-backend.onrender.com/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${finalToken}`,
        },
        body: JSON.stringify(formData),
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
      <header className="border-b bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-sm text-gray-600">
              Welcome back, {currentUser.name}
            </p>
          </div>

          <Button variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="mx-auto w-full max-w-sm">
              <Card className="overflow-hidden rounded-2xl shadow-md">
                <div className="h-28 bg-gradient-to-r from-blue-500 to-blue-400" />

                <div className="-mt-14 flex justify-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-3xl font-bold text-white shadow">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                </div>

                <CardContent className="space-y-3 px-6 pb-6 pt-2 text-center">
                  <h2 className="text-2xl font-semibold">{currentUser.name}</h2>
                  <p className="text-sm uppercase text-gray-500">{currentUser.role}</p>
                  <p className="text-sm text-gray-700">{currentUser.email}</p>
                  <p className="text-sm text-gray-600">
                    Reg No: {currentUser.registrationNumber || "-"}
                  </p>

                  <div className="my-4 border-t" />

                  <div className="flex justify-center gap-3">
                    <button className="rounded-full border px-5 py-2 text-sm hover:bg-gray-100">
                      My Account
                    </button>
                    <button
                      className="rounded-full border px-5 py-2 text-sm hover:bg-gray-100"
                      onClick={onLogout}
                    >
                      Sign out
                    </button>
                  </div>

                  <Button
                    className="mt-4 w-full"
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
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle>Request Summary</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="font-semibold">{requests.length}</span>
                </div>

                <div className="flex justify-between">
                  <span>Pending</span>
                  <span className="font-semibold text-yellow-600">
                    {pendingRequests.length}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Completed</span>
                  <span className="font-semibold text-green-600">
                    {approvedHistory.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="requests" className="w-full">
              <div className="mb-6 flex items-center justify-between">
                <TabsList className="rounded-xl bg-gray-100 p-1">
                  <TabsTrigger value="requests">My Requests</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="certificates">Certificates</TabsTrigger>
                </TabsList>

                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Request
                </Button>
              </div>

              <TabsContent value="requests" className="space-y-4">
                {requests.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                      <h3 className="mb-2 text-xl font-semibold text-gray-900">
                        No Requests Yet
                      </h3>
                      <p className="mb-6 text-sm text-gray-500 max-w-md mx-auto">
                        Start by creating a new document request. Your approval status and certificate history will appear here.
                      </p>
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Request
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  requests.map((request) => (
                    <Card key={request.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <CardTitle className="text-lg">
                              {getDocumentTypeLabel(
                                request.documentType,
                                request.customDocumentName
                              )}
                            </CardTitle>
                            <CardDescription>
                              Requested on{" "}
                              {new Date(request.createdAt).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Premium Timeline */}
                        <div className="mb-6">
                          

<div className="relative grid grid-cols-4 items-start justify-items-center">                          <div className="absolute top-[44px] left-[12.5%] right-[12.5%] h-1 bg-gray-200 rounded-full" />
                          <div
  className={`absolute top-[44px] left-[12.5%] h-1 rounded-full transition-all duration-500 ${
    request.status === "REJECTED"
      ? "bg-red-500"
      : "bg-green-500"
  }`}
  style={{
    width:
      request.status === "PENDING"
        ? "0%"
        : request.status === "CLASS_INCHARGE_APPROVED"
        ? "33.33%"
        : request.status === "HOD_APPROVED"
        ? "75%"
        : request.status === "COMPLETED"
        ? "100%"
        : request.status === "REJECTED"
        ? "100%"
        : "0%",
  }}
/>

                            {/* Steps */}
                            {["PENDING", "CLASS_INCHARGE_APPROVED", "HOD_APPROVED", "DONE"].map((step, index) => {
                              const labels = ["Submitted", "CI", "HOD", "Done"];
                              const isCompleted =
                                index === 0 ||
                                (index === 1 &&
                                  (request.status === "CLASS_INCHARGE_APPROVED" ||
                                    request.status === "HOD_APPROVED")) ||
                                (index === 2 && request.status === "HOD_APPROVED") ||
                                (index === 3 && request.status === "HOD_APPROVED");

                              return (
                            <div key={index} className="relative z-10 flex flex-col items-center justify-start min-h-[110px]">    
                                 <span className="mb-3 text-xs font-medium text-gray-600"> {labels[index]}
                                 </span>
                                                          <div
                                             className={`w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all ${
                                      request.status === "REJECTED" && index === 3
                                        ? "bg-red-500 border-red-500 text-white"
                                        : isCompleted
                                        ? "bg-green-600 border-green-600 text-white"
                                        : "bg-white border-gray-300 text-gray-400"
                                    }`}
                                  >
                                    ✓
                                  </div>

                                  <span className="text-[10px] mt-2 text-gray-500">
                                    {new Date(request.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          <p className="text-xs mt-4 text-gray-600">
                            Current Stage: {
                              request.status === "PENDING"
                                ? "With Class Incharge"
                                : request.status === "CLASS_INCHARGE_APPROVED"
                                ? "With HOD"
                                : request.status === "HOD_APPROVED"
                                ? "Completed"
                                : request.status === "REJECTED"
                                ? "Rejected"
                                : ""
                            }
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Purpose:</p>
                            <p className="text-sm text-gray-600">{request.purpose}</p>
                          </div>

                          {request.additionalDetails ? (
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Additional Details:
                              </p>
                              <p className="text-sm text-gray-600">
                                {request.additionalDetails}
                              </p>
                            </div>
                          ) : null}

                          {request.classInchargeComments ? (
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Class Incharge Comments:
                              </p>
                              <p className="text-sm text-gray-600">
                                {request.classInchargeComments}
                              </p>
                            </div>
                          ) : null}

                          {request.hodComments ? (
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                HOD Comments:
                              </p>
                              <p className="text-sm text-gray-600">
                                {request.hodComments}
                              </p>
                            </div>
                          ) : null}

                          {request.status === "REJECTED" && (request.classInchargeComments || request.hodComments) && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                              <p className="text-sm font-medium text-red-700 mb-1">
                                Rejection Details:
                              </p>

                              {request.classInchargeComments && (
                                <p className="text-sm text-red-600">
                                  <b>Class Incharge:</b> {request.classInchargeComments}
                                </p>
                              )}

                              {request.hodComments && (
                                <p className="text-sm text-red-600">
                                  <b>HOD:</b> {request.hodComments}
                                </p>
                              )}
                            </div>
                          )}

                          {request.certificateId ? (
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Certificate ID:
                              </p>
                              <p className="text-sm font-mono text-gray-600">
                                {request.certificateId}
                              </p>
                            </div>
                          ) : null}

                          {request.certificateUrl ? (
                            <div className="pt-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                asChild
                              >
                                <a
                                  href={request.certificateUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download Certificate
                                </a>
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Approved History</CardTitle>
                    <CardDescription>
                      Previously approved document requests
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {approvedHistory.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No approved requests found.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {approvedHistory.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between rounded-xl border border-green-100 bg-green-50 p-4"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {getDocumentTypeLabel(
                                  request.documentType,
                                  request.customDocumentName
                                )}
                              </p>

                              <p className="text-sm text-gray-600">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>

                            <Badge className="bg-green-600 hover:bg-green-600">
                              Approved
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Rejected History</CardTitle>
                    <CardDescription>
                      Previously rejected document requests
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {rejectedHistory.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No rejected requests found.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {rejectedHistory.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-4"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {getDocumentTypeLabel(
                                  request.documentType,
                                  request.customDocumentName
                                )}
                              </p>

                              <p className="text-sm text-gray-600">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>

                            <Badge className="bg-red-600 hover:bg-red-600">
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
                <Card>
                  <CardHeader>
                    <CardTitle>Issued Certificates</CardTitle>
                    <CardDescription>
                      Download your approved and issued certificates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {issuedCertificates.length === 0 ? (
                      <div className="py-8 text-center">
                        <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                        <h3 className="mb-2 text-lg font-medium text-gray-900">
                          No certificates yet
                        </h3>
                        <p className="text-gray-600">
                          Your approved certificates will appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {issuedCertificates.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between rounded-lg border p-4"
                          >
                            <div>
                              <h4 className="font-medium">
                                {getDocumentTypeLabel(
                                  request.documentType,
                                  request.customDocumentName
                                )}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Certificate ID: {request.certificateId || "-"}
                              </p>
                              <p className="text-sm text-gray-500">
                                Issued on{" "}
                                {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
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
