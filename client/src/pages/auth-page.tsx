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
import loginBg from "@assets/image_1756258332288.png";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/admin");
    }
  }, [user, setLocation]);

  if (user) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const identifier = formData.get("identifier") as string;
    const credential = formData.get("credential") as string;

    // First try admin login
    try {
      await loginMutation.mutateAsync({ username: identifier, password: credential });
      toast({ title: "관리자 로그인 성공" });
      setLocation("/admin");
      return;
    } catch (error) {
      // If admin login fails, try employee login
      try {
        const response = await apiRequest("POST", "/api/employee-login", {
          userName: identifier,
          userPassword: credential,
        });
        const employee = await response.json();
        
        // Store employee data in sessionStorage for the user dashboard
        sessionStorage.setItem("currentEmployee", JSON.stringify(employee));
        toast({ title: "신입사원 로그인 성공" });
        setLocation("/dashboard");
      } catch (employeeError) {
        toast({
          title: "로그인 실패",
          description: "이름과 휴대폰 번호를 확인해주세요.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div 
      className="min-h-screen hero-bg flex items-center justify-center px-4"
      style={{ backgroundImage: `url(${loginBg})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
    >
      <Card className="w-full max-w-md glass-card">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">WELCOME</h1>
            <h2 className="text-2xl font-bold brand-navy mb-4">C&W KOREA</h2>
            <p className="text-gray-600"></p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <Input
                name="identifier"
                type="text"
                required
                className="form-input peer"
                placeholder=" "
                data-testid="input-name"
              />
              <Label className="form-label">이름을 입력하세요</Label>
            </div>

            <div className="relative">
              <Input
                name="credential"
                type="tel"
                required
                maxLength={4}
                pattern="[0-9]{4}"
                className="form-input peer"
                placeholder=" "
                data-testid="input-phone"
              />
              <Label className="form-label">휴대폰 번호 뒷 4자리</Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-brand-navy hover:bg-blue-800 text-white font-semibold py-3"
              data-testid="button-login"
            >
              로그인
            </Button>
          </form>

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
