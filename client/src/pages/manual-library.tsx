import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BookOpen, Search, Menu, Home, LogOut, FileText, Eye, ArrowLeft, Download } from "lucide-react";
import PDFViewerModal from "@/components/PDFViewerModal";
import FloatingChatButton from "@/components/FloatingChatButton";
import ChatbotModal from "@/components/ChatbotModal";
import { type Employee, type Department, type Manual } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import dashboardBg from "@assets/image_1756257576204.png";
import cwLogo from "@assets/CW_Logo_Color-removebg-preview (1)_1756259032675.png";

export default function ManualLibrary() {
  const [, setLocation] = useLocation();
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedManual, setSelectedManual] = useState<Manual | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const employeeData = sessionStorage.getItem("currentEmployee");
    if (employeeData) {
      setCurrentEmployee(JSON.parse(employeeData));
    } else {
      setLocation("/auth");
    }
  }, [setLocation]);

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: manuals = [], isLoading } = useQuery<Manual[]>({
    queryKey: ["/api/manuals", selectedDepartment, searchTerm],
    queryFn: async () => {
      let url = "/api/manuals?";
      if (selectedDepartment) url += `departmentId=${selectedDepartment}&`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}`;
      const response = await fetch(url);
      return response.json();
    },
  });

  const handleLogout = () => {
    sessionStorage.removeItem("currentEmployee");
    setLocation("/auth");
  };

  const handleManualClick = async (manual: Manual) => {
    await fetch(`/api/manuals/${manual.id}/view`, { method: "POST" });
    queryClient.invalidateQueries({ queryKey: ["/api/manuals", selectedDepartment, searchTerm] });
    setSelectedManual(manual);
  };

  const getDepartmentById = (id: string) => {
    return departments.find(d => d.id === id);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (!currentEmployee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen hero-bg pb-20"
      style={{ backgroundImage: `url(${dashboardBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
    >
      <header className="bg-white bg-opacity-95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="px-3 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <SheetHeader>
                    <SheetTitle className="text-left">
                      <img src={cwLogo} alt="C&W Korea Logo" className="h-8 w-auto" />
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="mt-6 flex flex-col gap-2">
                    <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3 text-left">
                        <Home className="h-5 w-5" />
                        홈
                      </Button>
                    </Link>
                    <Link href="/manual-library" onClick={() => setMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3 text-left bg-gray-100">
                        <BookOpen className="h-5 w-5" />
                        매뉴얼 라이브러리
                      </Button>
                    </Link>
                    <div className="border-t my-4" />
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start gap-3 text-left text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => { handleLogout(); setMenuOpen(false); }}
                    >
                      <LogOut className="h-5 w-5" />
                      로그아웃
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
              <Link href="/dashboard">
                <img src={cwLogo} alt="C&W Korea Logo" className="h-8 w-auto cursor-pointer" />
              </Link>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hover:text-gray-700 p-2">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <div className="px-3 py-4">
        <div className="flex items-center gap-2 mb-4 text-[#ffffff]">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2 text-[#ffffff]">
            <BookOpen className="h-6 w-6 text-brand-navy" />
            매뉴얼 라이브러리
          </h1>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="제목 또는 해시태그로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          <Button
            variant={selectedDepartment === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedDepartment(null)}
            className={selectedDepartment === null ? "bg-brand-navy" : "bg-white"}
          >
            전체
          </Button>
          {departments.map((dept) => (
            <Button
              key={dept.id}
              variant={selectedDepartment === dept.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDepartment(dept.id)}
              style={selectedDepartment === dept.id ? { backgroundColor: dept.color || "#3B82F6" } : undefined}
              className={selectedDepartment !== dept.id ? "bg-white" : ""}
            >
              {dept.name}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">로딩 중...</div>
        ) : manuals.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? "검색 결과가 없습니다." : "등록된 매뉴얼이 없습니다."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {manuals.map((manual) => {
              const dept = getDepartmentById(manual.departmentId);
              return (
                <Card 
                  key={manual.id} 
                  className="bg-white bg-opacity-95 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleManualClick(manual)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: dept?.color || "#3B82F6" }}
                      >
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{manual.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: dept?.color || "#3B82F6" }}
                          >
                            {dept?.name || "Unknown"}
                          </span>
                          <span className="text-xs text-gray-400">{formatFileSize(manual.fileSize)}</span>
                        </div>
                        {manual.hashtags && manual.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {manual.hashtags.slice(0, 3).map((tag) => (
                              <span 
                                key={tag} 
                                className="text-xs text-blue-600 cursor-pointer hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSearchTerm(tag);
                                }}
                              >
                                #{tag}
                              </span>
                            ))}
                            {manual.hashtags.length > 3 && (
                              <span className="text-xs text-gray-400">+{manual.hashtags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                        <Eye className="h-3 w-3" />
                        {manual.viewCount || 0}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <PDFViewerModal
        isOpen={!!selectedManual}
        fileUrl={selectedManual?.fileUrl || ""}
        title={selectedManual?.title || ""}
        department={selectedManual ? getDepartmentById(selectedManual.departmentId) : null}
        hashtags={selectedManual?.hashtags || []}
        onClose={() => setSelectedManual(null)}
      />

      {/* <FloatingChatButton onClick={() => setIsChatOpen(true)} />
      <ChatbotModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} /> */}
    </div>
  );
}
