import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building, Shield, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import cwKoreaBg from "@assets/image_1756254246105.png";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<"admin" | "employee" | "select">("select");
  const [isRegister, setIsRegister] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/admin");
    }
  }, [user, setLocation]);

  if (user) {
    return null;
  }

  const handleAdminAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      if (isRegister) {
        await registerMutation.mutateAsync({ username, password });
        toast({ title: "관리자 계정이 생성되었습니다." });
      } else {
        await loginMutation.mutateAsync({ username, password });
        toast({ title: "관리자 로그인 성공" });
      }
      setLocation("/admin");
    } catch (error) {
      toast({
        title: isRegister ? "계정 생성 실패" : "로그인 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleEmployeeLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userName = formData.get("userName") as string;
    const userPassword = formData.get("userPassword") as string;

    try {
      const response = await apiRequest("POST", "/api/employee-login", {
        userName,
        userPassword,
      });
      const employee = await response.json();
      
      // Store employee data in sessionStorage for the user dashboard
      sessionStorage.setItem("currentEmployee", JSON.stringify(employee));
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "로그인 실패",
        description: "이름과 휴대폰 번호를 확인해주세요.",
        variant: "destructive",
      });
    }
  };

  if (mode === "select") {
    return (
      <div 
        className="min-h-screen hero-bg flex items-center justify-center px-4"
        style={{ backgroundImage: `url(${cwKoreaBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <Card className="w-full max-w-md glass-card">
          <CardContent className="pt-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">WELCOME</h1>
              <h2 className="text-2xl font-bold brand-navy mb-4">C&W KOREA</h2>
              <p className="text-gray-600">로그인 유형을 선택하세요</p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => setMode("admin")}
                className="w-full bg-brand-navy hover:bg-blue-800 text-white py-3"
                data-testid="button-admin-login"
              >
                <Shield className="mr-2 h-5 w-5" />
                관리자 로그인
              </Button>
              
              <Button
                onClick={() => setMode("employee")}
                className="w-full bg-brand-blue hover:bg-blue-700 text-white py-3"
                data-testid="button-employee-login"
              >
                <User className="mr-2 h-5 w-5" />
                신입사원 로그인
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <div className="flex items-center justify-center space-x-2">
                <Building className="h-4 w-4 brand-red" />
                <span className="text-sm font-semibold text-gray-700">CUSHMAN & WAKEFIELD</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Better never settles</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === "admin") {
    return (
      <div 
        className="min-h-screen hero-bg flex items-center justify-center px-4"
        style={{ backgroundImage: `url(${cwKoreaBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <Card className="w-full max-w-md glass-card">
          <CardContent className="pt-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-brand-navy rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-white text-2xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">관리자 로그인</h1>
              <p className="text-gray-600">Admin Dashboard Access</p>
            </div>

            <form onSubmit={handleAdminAuth} className="space-y-6">
              <div className="relative">
                <Input
                  name="username"
                  type="text"
                  required
                  className="form-input"
                  placeholder=" "
                  data-testid="input-admin-username"
                />
                <Label className="form-label">관리자 ID</Label>
              </div>

              <div className="relative">
                <Input
                  name="password"
                  type="password"
                  required
                  className="form-input"
                  placeholder=" "
                  data-testid="input-admin-password"
                />
                <Label className="form-label">비밀번호</Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-brand-navy hover:bg-blue-800 text-white font-semibold py-3"
                disabled={loginMutation.isPending || registerMutation.isPending}
                data-testid="button-admin-submit"
              >
                {isRegister ? "계정 생성" : "로그인"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => setIsRegister(!isRegister)}
                className="text-brand-blue hover:text-blue-800"
                data-testid="button-toggle-register"
              >
                {isRegister ? "로그인으로 돌아가기" : "새 관리자 계정 생성"}
              </Button>
            </div>

            <div className="mt-8 text-center">
              <Button
                variant="link"
                onClick={() => setMode("select")}
                className="text-brand-blue hover:text-blue-800 font-medium"
                data-testid="button-back-to-select"
              >
                ← 뒤로 가기
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <div className="flex items-center justify-center space-x-2">
                <Building className="h-4 w-4 brand-red" />
                <span className="text-sm font-semibold text-gray-700">CUSHMAN & WAKEFIELD</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Better never settles</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen hero-bg flex items-center justify-center px-4"
      style={{ backgroundImage: `url(${cwKoreaBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <Card className="w-full max-w-md glass-card">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">WELCOME</h1>
            <h2 className="text-2xl font-bold brand-navy mb-4">C&W KOREA</h2>
            <p className="text-gray-600">신입사원 온보딩 시스템</p>
          </div>

          <form onSubmit={handleEmployeeLogin} className="space-y-6">
            <div className="relative">
              <Input
                name="userName"
                type="text"
                required
                className="form-input"
                placeholder=" "
                data-testid="input-employee-name"
              />
              <Label className="form-label">이름을 입력하세요</Label>
            </div>

            <div className="relative">
              <Input
                name="userPassword"
                type="tel"
                required
                maxLength={4}
                pattern="[0-9]{4}"
                className="form-input"
                placeholder=" "
                data-testid="input-employee-phone"
              />
              <Label className="form-label">휴대폰 번호 뒷 4자리</Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-brand-navy hover:bg-blue-800 text-white font-semibold py-3"
              data-testid="button-employee-submit"
            >
              로그인
            </Button>
          </form>

          <div className="mt-8 text-center">
            <Button
              variant="link"
              onClick={() => setMode("select")}
              className="text-brand-blue hover:text-blue-800 font-medium"
              data-testid="button-back-to-select"
            >
              ← 관리자 로그인
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Building className="h-4 w-4 brand-red" />
              <span className="text-sm font-semibold text-gray-700">CUSHMAN & WAKEFIELD</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Better never settles</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
