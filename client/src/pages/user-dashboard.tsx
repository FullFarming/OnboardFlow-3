import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Inbox, Laptop, Users, Key, GraduationCap, LogOut, ChevronRight } from "lucide-react";
import { type Employee, type ContentIcon } from "@shared/schema";
import ContentViewer from "@/components/content-viewer";
import dashboardBg from "@assets/image_1756257576204.png";
import cwLogo from "@assets/CW_Logo_Color-removebg-preview (1)_1756259032675.png";

export default function UserDashboard() {
  const [, setLocation] = useLocation();
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [selectedContent, setSelectedContent] = useState<ContentIcon | null>(null);

  // Get employee data from sessionStorage
  useEffect(() => {
    const employeeData = sessionStorage.getItem("currentEmployee");
    if (employeeData) {
      setCurrentEmployee(JSON.parse(employeeData));
    } else {
      setLocation("/auth");
    }
  }, [setLocation]);

  // Fetch content icons
  const { data: contentIconsData = [] } = useQuery<ContentIcon[]>({
    queryKey: ["/api/content-icons"],
  });

  // Sort content icons by display order
  const contentIcons = contentIconsData.sort((a, b) => a.displayOrder - b.displayOrder);

  const handleLogout = () => {
    sessionStorage.removeItem("currentEmployee");
    setLocation("/auth");
  };

  const handleContentClick = (content: ContentIcon) => {
    if (content.contentType === "Link") {
      window.open(content.contentSource, "_blank");
    } else {
      setSelectedContent(content);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "Video": return "🎥";
      case "PDF": return "📄";
      case "Image": return "🖼️";
      case "Link": return "🔗";
      default: return "📁";
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case "Video": return "bg-blue-500";
      case "PDF": return "bg-green-500";
      case "Image": return "bg-orange-500";
      case "Link": return "bg-purple-500";
      default: return "bg-gray-500";
    }
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
      className="min-h-screen hero-bg"
      style={{ backgroundImage: `url(${dashboardBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
    >
      {/* Header */}
      <header className="bg-white bg-opacity-95 backdrop-blur-sm shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src={cwLogo} 
                alt="C&W Korea Logo" 
                className="h-12 w-auto"
                data-testid="img-cw-logo"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900" data-testid="text-welcome-message">
                  안녕하세요, <span data-testid="text-user-name">{currentEmployee.userName}</span>님!
                </h1>
                <p className="text-sm text-gray-600">C&W Korea 온보딩에 오신 것을 환영합니다</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700"
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Personal Information Card */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 brand-navy">
              <Users className="h-5 w-5" />
              개인 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Inbox className="h-5 w-5 brand-blue" />
                <div>
                  <p className="text-sm text-gray-600">이메일</p>
                  <p className="font-medium" data-testid="text-user-email">{currentEmployee.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Laptop className="h-5 w-5 brand-blue" />
                <div>
                  <p className="text-sm text-gray-600">노트북 정보</p>
                  <p className="font-medium" data-testid="text-user-laptop">{currentEmployee.laptopInfo}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 brand-blue" />
                <div>
                  <p className="text-sm text-gray-600">Your Buddy</p>
                  <p className="font-medium" data-testid="text-user-buddy">{currentEmployee.buddyName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Key className="h-5 w-5 brand-blue" />
                <div>
                  <p className="text-sm text-gray-600">사물함 번호</p>
                  <p className="font-medium" data-testid="text-user-locker">{currentEmployee.lockerNumber}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onboarding Curriculum */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 brand-navy">
              <GraduationCap className="h-5 w-5" />
              온보딩 커리큘럼
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contentIcons.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                온보딩 콘텐츠가 준비 중입니다.
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6" data-testid="content-grid">
                {contentIcons.map((content, index) => (
                  <div key={content.id} className="flex items-center">
                    <div
                      className="content-icon cursor-pointer group"
                      onClick={() => handleContentClick(content)}
                      data-testid={`content-icon-${content.id}`}
                    >
                      <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 group-hover:scale-105">
                        <div className={`w-32 h-32 ${content.iconImage ? 'bg-transparent' : getContentTypeColor(content.contentType)} rounded-xl flex items-center justify-center mx-auto mb-3 text-4xl overflow-hidden`}>
                          {content.iconImage ? (
                            <img src={content.iconImage} alt={content.iconTitle} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            getContentTypeIcon(content.contentType)
                          )}
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 text-center" data-testid={`text-content-title-${content.id}`}>
                          {content.iconTitle}
                        </h3>
                      </div>
                    </div>
                    {index < contentIcons.length - 1 && (
                      <ChevronRight className="h-6 w-6 text-gray-400 mx-2 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Viewer Modal */}
      {selectedContent && (
        <ContentViewer
          content={selectedContent}
          onClose={() => setSelectedContent(null)}
        />
      )}
    </div>
  );
}
