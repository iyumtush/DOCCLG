"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StudentDashboard from "@/components/StudentDashboard";

type StudentUser = {
  name: string;
  email: string;
  role: string;
  registrationNumber?: string;
};

export default function StudentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<StudentUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = sessionStorage.getItem("token");
    const storedUser = sessionStorage.getItem("user");

    if (!storedToken || !storedUser) {
      setLoading(false);
      router.replace("/"); // 🔒 not logged in
      return;
    }

    const parsedUser = JSON.parse(storedUser) as StudentUser;

    if (parsedUser.role !== "STUDENT") {
      setLoading(false);
      router.replace("/"); // 🔒 wrong role
      return;
    }

    setUser(parsedUser);
    setToken(storedToken);
    setLoading(false);
  }, [router]);

  if (loading) {
    return <p className="p-6">Loading dashboard...</p>;
  }

  if (!user || !token) {
    return null;
  }

  return (
    <StudentDashboard
      user={user}
      token={token}
      onLogout={() => {
        sessionStorage.clear();
        router.replace("/");
      }}
    />
  );
}
