import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      // For this app, admin users go to admin dashboard, regular users go to auth to select mode
      setLocation("/admin");
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">C&W Korea 온보딩 시스템</h1>
        <p className="text-gray-600">로딩 중...</p>
      </div>
    </div>
  );
}
