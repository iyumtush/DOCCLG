"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */

import { toast } from "sonner";
import { DoorClosed, DoorOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";


/* shadcn/ui components */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

/* icons */
import {
  FileText,
  Users,
  Shield,
  GraduationCap,
  Building2,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";



export default function HomePage() {
 const router = useRouter();
 const [loginType, setLoginType] = useState<"student" | "faculty" | "admin" | "register">("student");
const [otpStep, setOtpStep] = useState(false);
const [otp, setOtp] = useState("");
const [otpEmail, setOtpEmail] = useState("");
const [otpLoading, setOtpLoading] = useState(false);
const [otpMessage, setOtpMessage] = useState("");
const [resendTimer, setResendTimer] = useState(0);
const [canResend, setCanResend] = useState(true);
const [registerRole, setRegisterRole] = useState("STUDENT");
const [showLoginPassword, setShowLoginPassword] = useState(false);
const [showFacultyPassword, setShowFacultyPassword] = useState(false);
const [branch, setBranch] = useState("");
const [roleError, setRoleError] = useState("");
const [passwordShake, setPasswordShake] = useState(false);
const [roleShake, setRoleShake] = useState(false);
const [showAdminPassword, setShowAdminPassword] = useState(false);
const [showRegisterPassword, setShowRegisterPassword] = useState(false);
const [passwordError, setPasswordError] = useState("");
const [forgotStep, setForgotStep] = useState(false);
const [resetStep, setResetStep] = useState(false);
const [resetEmail, setResetEmail] = useState("");
const [newPassword, setNewPassword] = useState("");
  const [facultyRole, setFacultyRole] = useState<"class-incharge" | "hod">("class-incharge");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
 

useEffect(() => {
  const savedToken = sessionStorage.getItem("token");
  const savedUser = sessionStorage.getItem("user");

  if (savedToken && savedUser) {
    setToken(savedToken);
    setUser(JSON.parse(savedUser));
  }

  setAuthChecked(true);
}, []); 

useEffect(() => {
  const updateStatus = () => {
    setIsOnline(navigator.onLine);
  };

  updateStatus();

  window.addEventListener("online", updateStatus);
  window.addEventListener("offline", updateStatus);

  return () => {
    window.removeEventListener("online", updateStatus);
    window.removeEventListener("offline", updateStatus);
  };
}, []);

useEffect(() => {
  let interval: NodeJS.Timeout;

  if (resendTimer > 0) {
    interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
  } else {
    setCanResend(true);
  }

  return () => clearInterval(interval);
}, [resendTimer]);



const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  const formData = new FormData(e.currentTarget);
  const identifier = formData.get("identifier") as string;
  const password = formData.get("password") as string;

  let role = "STUDENT";
  if (loginType === "faculty") {
    role = facultyRole === "class-incharge" ? "CLASS_INCHARGE" : "HOD";
  } else if (loginType === "admin") {
    role = "ADMIN";
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier,
          password,
          role,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Login failed");
      return;
    }

    setUser(data.user);
    setToken(data.token);
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user));

    if (data.user.role === "STUDENT") {
      router.push("/student/dashboard");
    } else if (
      data.user.role === "CLASS_INCHARGE" ||
      data.user.role === "HOD"
    ) {
      router.push("/faculty/dashboard");
    } else if (data.user.role === "ADMIN") {
      router.push("/admin/dashboard");
    }

  } catch (err) {
    console.error(err);
    setError("Network error");
  } finally {
    setLoading(false);
  }
};

const handleForgotPassword = async (email: string) => {
  const res = await fetch("https://docclg-backend.onrender.com/api/auth/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message);
    return;
  }

  alert("OTP sent");
  setResetStep(true);
};



// HANDLE SEND OTP (OTP FUNCTIONS)


const handleSendOtp = async (email: string) => {
  try {
    setOtpLoading(true);

    // 🔐 PASSWORD GET
    let passwordValue = "";

    if (loginType === "student") {
      const input = document.getElementById("student-password") as HTMLInputElement;
      passwordValue = input?.value;
    } else if (loginType === "faculty") {
      const input = document.getElementById("faculty-password") as HTMLInputElement;
      passwordValue = input?.value;
    }

    // 🎭 ROLE LOGIC
    let role = "STUDENT";

    if (loginType === "faculty") {
      role = facultyRole === "class-incharge"
        ? "CLASS_INCHARGE"
        : "HOD";
    }

    // 🚀 API CALL
    const res = await fetch("https://docclg-backend.onrender.com/api/auth/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: passwordValue,
        role,
      }),
    });

    const data = await res.json();

    // 🧪 DEBUG 1 → WHAT BACKEND RETURNS
    console.log("ERROR:", data.message);

    // ❌ ERROR HANDLING
    if (!res.ok) {

  if (loginType === "faculty" && data.message === "Invalid role selected") {

    console.log("Setting role error");

    setRoleError("Wrong role selected ❌");

    setRoleShake(true);
    setTimeout(() => setRoleShake(false), 500);

    setTimeout(() => setRoleError(""), 2000);
  } 

  else if (data.message === "Invalid password") {

    console.log("Setting password error");

    setPasswordError("Incorrect password ❌");

    setPasswordShake(true);
    setTimeout(() => setPasswordShake(false), 500);

    setTimeout(() => setPasswordError(""), 2000);
  } 

  else {
    console.log("Other error:", data.message);
    alert(data.message);
  }

  return;
}

    // ✅ SUCCESS
    setOtpEmail(email);
    setOtpStep(true);

toast.success("OTP sent! Check your email 📧");

  } catch (err) {
    console.error(err);
  } finally {
    setOtpLoading(false);
  }
};

const handleResetPassword = async () => {
  const res = await fetch("https://docclg-backend.onrender.com/api/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: resetEmail,
      otp,
      newPassword,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message);
    return;
  }

  alert("Password updated");
  setForgotStep(false);
  setResetStep(false);
};


const handleVerifyOtp = async () => {
  
try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/api/auth/verify-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: otpEmail,
          otp,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    // ✅ Save login
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user));

    alert("Login successful!");

    // ✅ ADD THIS (REDIRECT LOGIC)
    if (data.user.role === "STUDENT") {
      router.push("/student/dashboard");
    } else if (
      data.user.role === "CLASS_INCHARGE" ||
      data.user.role === "HOD"
    ) {
      router.push("/faculty/dashboard");
    } else if (data.user.role === "ADMIN") {
      router.push("/admin/dashboard");
    }

  } catch (err) {
    console.error(err);
    alert("OTP verification failed");
  }
};





const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (loading) return;
  setLoading(true);

  const form = e.currentTarget;
  const formData = new FormData(form);

  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");
  const branch = formData.get("branch"); // ✅ ADDED

  if (!branch) {
    alert("Please select branch");
    setLoading(false);
    return;
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/api/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role: registerRole,
          branch, // ✅ ADDED
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Registration failed");
      return;
    }

    alert(data.message || "Registration successful");

    form.reset();

  } catch (err) {
    console.error(err);
    alert("Network error");
  } finally {
    setLoading(false);
  }
};

  return (
 
  


   <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center py-6">
      
      {/* LEFT: Logo + Title */}
      <div className="flex items-center space-x-4">
        <img
          src="/death-note.png"
          alt="Death Note Logo"
          className="w-14 h-14 object-contain"
        />

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
CollegeDocs          </h1>
          <p className="text-sm text-gray-600">
           Digital Documents Management System 
          </p>
        </div>
      </div>

      {/* RIGHT: Status */}
      <div className="flex items-center space-x-4">
        <Badge
          variant="outline"
          className={isOnline
            ? "text-green-700 border-green-200 bg-green-50"
            : "text-red-700 border-red-200 bg-red-50"
          }
        >
          {isOnline ? "System Online" : "System Offline"}
        </Badge>
      </div>

    </div>
  </div>
</header>


      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Hero Section */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Digital Documents 
                <span className="text-blue-600 block">Management System</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Streamlined document request and approval process for students and faculty. 
                Request official certificates, track approval status, and receive documents digitally.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="border-blue-100 bg-blue-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Document Requests</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Apply for Bonafide, Attendance, and Recommendation certificates online
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-100 bg-green-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Multi-Level Approval</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Class Incharge and HOD approval workflow with email notifications
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-100 bg-purple-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Digital Signatures</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Secure certificates with digital signatures and QR code verification
                  </p>
                </CardContent>
              </Card>

              <Card className="border-orange-100 bg-orange-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Real-time Tracking</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Track your request status and receive instant email notifications
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* College Info */}
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Building2 className="w-6 h-6" />
                  <h3 className="text-lg font-semibold">College Information</h3>
                </div>
                <div className="space-y-2 text-blue-100">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">123 College Street, City, State - 123456</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">+91-1234567890</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">info@abccollege.edu</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Login Section */}
          <div className="lg:sticky lg:top-8">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">Login to System</CardTitle>
                <CardDescription className="text-gray-600">
                  Access your dashboard to manage documents and requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Login Type Selector */}
                <Tabs value={loginType} onValueChange={(value) => setLoginType(value as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
  <TabsTrigger value="student">Student</TabsTrigger>
  <TabsTrigger value="faculty">Faculty</TabsTrigger>
  <TabsTrigger value="admin">Admin</TabsTrigger>
  <TabsTrigger value="register">Register</TabsTrigger>
</TabsList>

                  {/* Student Login */}
                  <TabsContent value="student" className="space-y-4 mt-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="student-id">Registration Number / Email</Label>
                        <Input 
                          id="student-id" 
                          name="identifier"
                          placeholder="Enter your registration number or email"
                          className="h-11"
                          required
                        />
                      </div>
<div className={`space-y-2 ${passwordShake ? "animate-shake" : ""}`}>

  <Label htmlFor="student-password">Password</Label>

  <div className="relative">
    <Input 
      id="student-password" 
      name="password"
      type={showLoginPassword ? "text" : "password"}
      placeholder="Enter your password"
className={`h-11 pr-10 ${passwordError ? "ring-2 ring-red-400" : ""}`}      
required

onChange={(e) => {
  setPasswordError("");
}}
    />

    <button
      type="button"
      onClick={() => setShowLoginPassword((prev) => !prev)}
      className="absolute right-3 top-1/2 -translate-y-1/2"
    >
      {showLoginPassword ? (
        <DoorOpen className="text-green-500 rotate-12" size={20} />
      ) : (
        <DoorClosed className="text-gray-500" size={20} />
      )}
    </button>
  </div>

  {/* 🔴 ERROR MESSAGE */}
  {passwordError && (
    <p className="text-sm text-red-600">
      {passwordError}
    </p>
  )}
</div>
                      {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                          {error}
                        </div>
                      )}
                      {!otpStep ? (
 // Send OTP Button  

<Button
  type="button"
  className={`w-full h-11 bg-blue-600 hover:bg-blue-700 ${
    otpLoading ? "opacity-50 cursor-not-allowed" : ""
  }`}
  disabled={otpLoading}
  onClick={() => {
    const emailInput = document.getElementById("student-id") as HTMLInputElement;

    if (!emailInput?.value) {
      alert("Enter email first");
      return;
    }

    handleSendOtp(emailInput.value);
  }}
>
  {otpLoading ? "Sending OTP..." : "Send OTP"}

</Button>


) : (
  <>
  <div className="flex justify-between gap-2">
  {Array.from({ length: 6 }).map((_, index) => (
    <Input
      key={index}
      maxLength={1}
      className="w-12 h-12 text-center text-lg"
      value={otp[index] || ""}
      onChange={(e) => {
        const value = e.target.value;
        if (!/^[0-9]?$/.test(value)) return;

        const newOtp = otp.split("");
        newOtp[index] = value;
        setOtp(newOtp.join(""));

        // 👉 auto focus next
        if (value && e.target.nextSibling) {
          (e.target.nextSibling as HTMLInputElement).focus();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Backspace" && !otp[index] && e.currentTarget.previousSibling) {
          (e.currentTarget.previousSibling as HTMLInputElement).focus();
        }
      }}
    />
  ))}
</div>

  <Button
    type="button"
    className="w-full h-11 bg-green-600 hover:bg-green-700"
    onClick={handleVerifyOtp}
  >
    Verify OTP
  </Button>

  {/* 🔁 RESEND OTP */}
  <Button
    type="button"
    variant="outline"
    disabled={!canResend}
    className={`w-full ${
      !canResend ? "opacity-50 cursor-not-allowed" : ""
    }`}
    onClick={() => handleSendOtp(otpEmail)}
  >
    {canResend
      ? "Resend OTP"
      : `Resend in ${resendTimer}s`}
  </Button>
</>
)}


{/* 🔥 FORGOT PASSWORD UI */}

{forgotStep && !resetStep && (
  <div className="space-y-3 mt-4">
    <Input
      placeholder="Enter your email"
      onChange={(e) => setResetEmail(e.target.value)}
    />

    <Button
      type="button"
      onClick={() => handleForgotPassword(resetEmail)}
    >
      Send Reset OTP
    </Button>
  </div>
)}

{resetStep && (
  <div className="space-y-3 mt-4">
    <Input
      placeholder="Enter OTP"
      value={otp}
      onChange={(e) => setOtp(e.target.value)}
    />

    <Input
      type="password"
      placeholder="Enter new password"
      onChange={(e) => setNewPassword(e.target.value)}
    />

    <Button onClick={handleResetPassword}>
      Reset Password
    </Button>
  </div>
)}
                    </form>
                  </TabsContent>

                  {/* Faculty Login */}
        
<TabsContent value="faculty" className="space-y-4 mt-6">
  <form onSubmit={handleLogin} className="space-y-4">

    <div className="space-y-2">
      <Label htmlFor="faculty-id">Faculty Email</Label>
      <Input 
        id="faculty-id" 
        name="identifier"
        placeholder="Enter your email"
        className="h-11"
        required
      />
    </div>

<div className={`space-y-2 ${roleShake ? "animate-shake" : ""}`}>
  <Label>Select Role</Label>

  <Select
    value={facultyRole}
    onValueChange={(value) => {
      setFacultyRole(value as any);
      setRoleError(""); // clear error when changed
    }}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select role" />
    </SelectTrigger>

    <SelectContent>
      <SelectItem value="class-incharge">Class Incharge</SelectItem>
      <SelectItem value="hod">HOD</SelectItem>
    </SelectContent>
  </Select>

  {/* 🔴 ERROR MESSAGE */}
  {roleError && (
    <p className="text-sm text-red-600 animate-pulse">
      {roleError}
    </p>
  )}
</div>

<div className={`space-y-2 ${passwordShake ? "animate-shake" : ""}`}>  <Label htmlFor="faculty-password">Password</Label>

  <div className="relative">
  <Input 
    id="faculty-password"
    name="password"
    type={showFacultyPassword ? "text" : "password"}
    placeholder="Enter Password"
    className="h-11 pr-10"
    required
    onChange={() => setPasswordError("")}
  />

    <button
      type="button"
      onClick={() => setShowFacultyPassword((prev) => !prev)}
      className="absolute right-3 top-1/2 -translate-y-1/2"
    >
      {showFacultyPassword ? (
        <DoorOpen className="text-green-500 rotate-12" size={20} />
      ) : (
        <DoorClosed className="text-gray-500" size={20} />
      )}
    </button>
  </div>

  {/* 🔴 ERROR MESSAGE */}
  {passwordError && (
    <p className="text-sm text-red-600 animate-pulse">
      {passwordError}
    </p>
  )}
</div>

    {!otpStep ? (
  
<Button
  type="button"
  disabled={otpLoading}
  className={`w-full h-11 bg-blue-600 hover:bg-blue-700 ${
    otpLoading ? "opacity-50 cursor-not-allowed" : ""
  }`}
  onClick={() => {
    const emailInput = document.getElementById("faculty-id") as HTMLInputElement;

    if (!emailInput?.value) {
      alert("Enter email");
      return;
    }

    if (!facultyRole) {
      setRoleError("Please select role first");

      setRoleShake(true);
      setTimeout(() => setRoleShake(false), 500);

      return;
    }

    const passwordInput = document.getElementById("faculty-password") as HTMLInputElement;

    if (!passwordInput?.value) {
      alert("Enter password");
      return;
    }

    handleSendOtp(emailInput.value);
  }}
>
  {otpLoading ? "Sending OTP..." : "Send OTP"}
</Button>


) : (
 <>
  {/* 🔢 OTP BOXES */}
  <div className="flex justify-between mt-6 px-2">
    {[...Array(6)].map((_, i) => (
      <input
        key={i}
        maxLength={1}
        className="w-12 h-12 text-center text-lg border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
        value={otp[i] || ""}
        
        onChange={(e) => {
          const val = e.target.value;
          if (!/^[0-9]?$/.test(val)) return;

          const newOtp = otp.split("");
          newOtp[i] = val;
          setOtp(newOtp.join(""));

          // 👉 MOVE TO NEXT BOX
          if (val && e.target.nextSibling) {
            (e.target.nextSibling as HTMLInputElement).focus();
          }
        }}

        onKeyDown={(e) => {
          // 👉 BACKSPACE → MOVE PREVIOUS
          if (e.key === "Backspace" && !otp[i] && e.currentTarget.previousSibling) {
            (e.currentTarget.previousSibling as HTMLInputElement).focus();
          }
        }}
      />
    ))}
  </div>

  {/* ✅ VERIFY BUTTON */}
  <Button
    type="button"
    className="w-full h-12 bg-green-600 hover:bg-green-700 mt-6 text-lg font-semibold rounded-xl"
    onClick={handleVerifyOtp}
  >
    Verify OTP
  </Button>


  {/* 🔁 RESEND BUTTON */}
  <Button
    type="button"
    variant="outline"
    className="w-full h-11 mt-4 rounded-xl"
    onClick={() => handleSendOtp(otpEmail)}
  >
    Resend OTP
  </Button>
</>
)}

  </form>

{forgotStep && !resetStep && (
  <div className="space-y-3 mt-4">
    <Input
      placeholder="Enter your email"
      onChange={(e) => setResetEmail(e.target.value)}
    />

    <Button
      type="button"
      onClick={() => handleForgotPassword(resetEmail)}
    >
      Send Reset OTP
    </Button>
  </div>
)}

{resetStep && (
  <div className="space-y-3 mt-4">
    <Input
      placeholder="Enter OTP"
      value={otp}
      onChange={(e) => setOtp(e.target.value)}
    />

    <Input
      type="password"
      placeholder="Enter new password"
      onChange={(e) => setNewPassword(e.target.value)}
    />

    <Button onClick={handleResetPassword}>
      Reset Password
    </Button>
  </div>
)}


</TabsContent>

                  {/* Admin Login */}
<TabsContent value="admin" className="space-y-4 mt-6">
  <form onSubmit={handleLogin} className="space-y-4">

    <div className="space-y-2">
      <Label htmlFor="admin-id">Admin Email</Label>
      <Input 
        id="admin-id" 
        name="identifier"
        placeholder="Enter your email"
        className="h-11"
        required
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="admin-password">Password</Label>

      <div className="relative">
        <Input 
          id="admin-password" 
          name="password"
          type={showAdminPassword ? "text" : "password"}
          placeholder="Enter your password"
          className="h-11 pr-10"
          required
        />

        <button
          type="button"
          onClick={() => setShowAdminPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          {showAdminPassword ? (
            <DoorOpen className="text-green-500 rotate-12" size={20} />
          ) : (
            <DoorClosed className="text-gray-500" size={20} />
          )}
        </button>
      </div>
    </div>

    <Button 
      type="submit" 
      className="w-full h-11 bg-blue-600 hover:bg-blue-700"
    >
      Login as Admin
    </Button>

  </form>
</TabsContent>
        
                    {/* Register */}
<TabsContent value="register" className="space-y-4 mt-6">
  <form onSubmit={handleRegister} className="space-y-4">

    {/* NAME */}
    <div className="space-y-2">
  <label>Name</label>

  <Input
  name="name"
  placeholder="Enter Name"
  required
/>
</div>

    {/* EMAIL */}
    <div>
  <Label>Email</Label>
  <Input
    name="email"
    type="email"
    placeholder="Enter Email"   // ✅ ADDED
    required
  />
</div>

    {/* PASSWORD WITH 🚪 */}
    <div className="relative">
<Label>Password</Label>
  <Input
    name="password"
    type={showRegisterPassword ? "text" : "password"}
    placeholder="Enter Password"
    required
    className="pr-10"
  />


  <button
    type="button"
    onClick={() => setShowRegisterPassword((prev) => !prev)}  // ✅ FIXED
    className="absolute right-3 top-1/2 -translate-y-1/2"
  >
    {showRegisterPassword ? (
      <DoorOpen className="text-green-500 rotate-12" size={20} />
    ) : (
      <DoorClosed className="text-gray-500" size={20} />
    )}
  </button>
</div>
   <div className="flex gap-4 max-w-md">
  
  {/* ROLE */}
  <div className="flex-1">
    <Label className="font-normal text-sm">Role</Label>
    <select
      className="w-full h-10 border rounded-md px-2 text-sm text-gray-700 bg-white"
      value={registerRole}
      onChange={(e) => setRegisterRole(e.target.value)}
    >
      <option value="">Select role</option>
      <option value="STUDENT">Student</option>
      <option value="CLASS_INCHARGE">Faculty</option>
      <option value="HOD">HOD</option>
    </select>
  </div>

  {/* BRANCH */}
  <div className="flex-1">
    <Label className="font-normal text-sm">Branch</Label>
    <select
      name="branch"
      className="w-full h-10 border rounded-md px-2 text-sm text-gray-700 bg-white"
      value={branch}
      onChange={(e) => setBranch(e.target.value)}
    >
      <option value="">Select Branch</option>
      <option value="CSE">CSE</option>
      <option value="AIDS">AIDS</option>
      <option value="IT">IT</option>
      <option value="EE">EE</option>
      <option value="ME">ME</option>
      <option value="CE">CE</option>
    </select>
  </div>

</div>

    {/* BUTTON */}
    <Button type="submit" className="w-full" disabled={loading}>
  {loading ? "Registering..." : "Register"}
</Button>

  </form>
</TabsContent>
                </Tabs>

                {/* Additional Links */}
                <div className="text-center space-y-2 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Need help? Contact IT Support
                  </p>
                  <div className="flex justify-center space-x-4 text-xs">
                    <button
  className="text-blue-600 hover:underline"
  onClick={() => setForgotStep(true)}
>
  Forgot Password?
</button>
                    <span className="text-gray-300">|</span>
                    <button className="text-blue-600 hover:underline">System Guide</button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <Card className="text-center p-4">
                <div className="text-2xl font-bold text-blue-600">1,247</div>
                <div className="text-xs text-gray-600">Active Students</div>
              </Card>
              <Card className="text-center p-4">
                <div className="text-2xl font-bold text-green-600">89</div>
                <div className="text-xs text-gray-600">Faculty Members</div>
              </Card>
              <Card className="text-center p-4">
                <div className="text-2xl font-bold text-purple-600">3,456</div>
                <div className="text-xs text-gray-600">Documents Issued</div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2024 ABC College of Engineering. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Document Management System v1.0 | Secure • Efficient • Digital
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 
