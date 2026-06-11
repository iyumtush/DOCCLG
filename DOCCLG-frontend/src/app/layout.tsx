"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handleOnline = () => {
      toast.success("Internet connection restored", {
        description: "You are back online",
      });
    };

    const handleOffline = () => {
      toast.error("No internet connection", {
        description: "You are currently offline",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          {children}
        </div>

        {/* ✅ THIS FIXES EVERYTHING */}
        <Toaster
          position="top-center"
          richColors
          closeButton
          expand
          visibleToasts={4}
          toastOptions={{
            duration: 3000,
            classNames: {
              toast:
                "rounded-2xl border border-gray-200 shadow-xl backdrop-blur-md",
              title: "font-semibold text-sm",
              description: "text-xs text-gray-500",
              success: "bg-green-50 text-green-900 border-green-200",
              error: "bg-red-50 text-red-900 border-red-200",
              warning: "bg-yellow-50 text-yellow-900 border-yellow-200",
              info: "bg-blue-50 text-blue-900 border-blue-200",
            },
          }}
        />
      </body>
    </html>
  );
}