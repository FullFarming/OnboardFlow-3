import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Inbox, Laptop, Users, Key, GraduationCap, LogOut, ChevronRight, CheckCircle2, Trophy, Sparkles } from "lucide-react";
import { type Employee, type ContentIcon } from "@shared/schema";
import ContentViewer from "@/components/content-viewer";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import dashboardBg from "@assets/image_1756257576204.png";
import cwLogo from "@assets/CW_Logo_Color-removebg-preview (1)_1756259032675.png";

export default function UserDashboard() {
  const [, setLocation] = useLocation();
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [selectedContent, setSelectedContent] = useState<ContentIcon | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousPercentage, setPreviousPercentage] = useState(0);
  const { toast } = useToast();

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

  // Fetch progress summary
  const { data: progressSummary, refetch: refetchProgress } = useQuery<{
    completed: number;
    total: number;
    percentage: number;
  }>({
    queryKey: [`/api/progress-summary/${currentEmployee?.id}`],
    enabled: !!currentEmployee?.id,
  });

  // Fetch user progress details
  const { data: userProgress = [], refetch: refetchUserProgress } = useQuery<any[]>({
    queryKey: [`/api/progress/${currentEmployee?.id}`],
    enabled: !!currentEmployee?.id,
  });

  // Toggle completion mutation
  const toggleCompletionMutation = useMutation({
    mutationFn: async ({ contentId, employeeId }: { contentId: string; employeeId: string }) => {
      const response = await apiRequest("POST", "/api/content/toggle-completion", {
        contentId,
        employeeId,
      });
      return response.json();
    },
    onSuccess: () => {
      refetchProgress();
      refetchUserProgress();
      toast({ title: "진행 상태가 업데이트되었습니다." });
    },
    onError: () => {
      toast({ title: "업데이트 실패", variant: "destructive" });
    },
  });

  // Sort content icons by display order
  const contentIcons = contentIconsData.sort((a, b) => a.displayOrder - b.displayOrder);

  // Check for completion celebration
  useEffect(() => {
    if (progressSummary && progressSummary.percentage === 100 && previousPercentage < 100) {
      setShowCelebration(true);
    }
    if (progressSummary) {
      setPreviousPercentage(progressSummary.percentage);
    }
  }, [progressSummary?.percentage, previousPercentage]);

  // Function to check if content is completed
  const isContentCompleted = (contentId: string) => {
    return userProgress.some(p => p.contentId === contentId && p.completed === 1);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("currentEmployee");
    setLocation("/auth");
  };

  const handleContentClick = (content: ContentIcon, event?: React.MouseEvent) => {
    // Check if this is a completion toggle (right-click or ctrl+click)
    const isToggleClick = event?.ctrlKey || event?.metaKey || event?.button === 2;
    
    if (isToggleClick && currentEmployee) {
      event?.preventDefault();
      toggleCompletionMutation.mutate({
        contentId: content.id,
        employeeId: currentEmployee.id,
      });
      return;
    }

    // Normal content viewing
    if (content.contentType === "Link") {
      // Track progress for link clicks
      if (currentEmployee) {
        toggleCompletionMutation.mutate({
          contentId: content.id,
          employeeId: currentEmployee.id,
        });
      }
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
      case "Image Slideshow": return "🎠";
      case "Link": return "🔗";
      default: return "📁";
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case "Video": return "bg-blue-500";
      case "PDF": return "bg-green-500";
      case "Image": return "bg-orange-500";
      case "Image Slideshow": return "bg-pink-500";
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
      className="min-h-screen hero-bg pb-20"
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

        {/* Progress Card */}
        {progressSummary && (
          <Card className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 brand-navy">
                <Trophy className="h-5 w-5" />
                진행 상황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">전체 진행률</span>
                  <span className="text-sm font-bold brand-navy" data-testid="text-progress-percentage">
                    {progressSummary.percentage}%
                  </span>
                </div>
                <Progress value={progressSummary.percentage} className="w-full" data-testid="progress-bar" />
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>완료: {progressSummary.completed}</span>
                  <span>전체: {progressSummary.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                {contentIcons.map((content, index) => {
                  const isCompleted = isContentCompleted(content.id);
                  return (
                    <div key={content.id} className="flex items-center">
                      <div
                        className="content-icon cursor-pointer group relative"
                        onClick={(e) => handleContentClick(content, e)}
                        onContextMenu={(e) => handleContentClick(content, e)}
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          if (currentEmployee) {
                            toggleCompletionMutation.mutate({
                              contentId: content.id,
                              employeeId: currentEmployee.id,
                            });
                          }
                        }}
                        data-testid={`content-icon-${content.id}`}
                        title="더블클릭하여 완료 상태 변경"
                      >
                        <div className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 group-hover:scale-105 ${isCompleted ? 'ring-2 ring-green-500' : ''}`}>
                          <div className={`w-32 h-32 ${content.iconImage ? 'bg-transparent' : getContentTypeColor(content.contentType)} rounded-xl flex items-center justify-center mx-auto mb-3 text-4xl overflow-hidden relative`}>
                            {content.iconImage ? (
                              <img 
                                src={content.iconImage.startsWith('/uploads') ? content.iconImage : `/uploads/${content.iconImage}`} 
                                alt={content.iconTitle} 
                                className="w-full h-full object-cover rounded-xl"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  // Show fallback icon instead
                                  target.parentElement!.innerHTML = `<span class="text-4xl">${getContentTypeIcon(content.contentType)}</span>`;
                                }}
                              />
                            ) : (
                              getContentTypeIcon(content.contentType)
                            )}
                            {isCompleted && (
                              <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                                <CheckCircle2 className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                          <h3 className={`text-sm font-medium text-center ${isCompleted ? 'text-green-700' : 'text-gray-900'}`} data-testid={`text-content-title-${content.id}`}>
                            {content.iconTitle}
                          </h3>
                        </div>
                      </div>
                      {index < contentIcons.length - 1 && (
                        <ChevronRight className={`h-6 w-6 mx-2 flex-shrink-0 ${isCompleted ? 'text-green-500' : 'text-gray-400'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gamified EXP Bar - Fixed at bottom */}
      {progressSummary && (
        <div className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-95 backdrop-blur-sm border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">온보딩 진행률</span>
              <span className="text-sm font-bold text-blue-600">
                EXP: {progressSummary.completed} / {progressSummary.total} ({progressSummary.percentage}%)
              </span>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${progressSummary.percentage}%` }}
                  data-testid="exp-progress-bar"
                >
                  <div className="h-full bg-white bg-opacity-20 animate-pulse"></div>
                </div>
              </div>
              {progressSummary.percentage === 100 && (
                <div className="absolute -top-1 right-0">
                  <Sparkles className="h-5 w-5 text-yellow-500 animate-bounce" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Viewer Modal */}
      {selectedContent && currentEmployee && (
        <ContentViewer
          content={selectedContent}
          employeeId={currentEmployee.id}
          onClose={() => setSelectedContent(null)}
          onComplete={() => {
            // Refresh progress data
            refetchProgress();
          }}
        />
      )}

      {/* Celebration Modal for 100% Completion */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
              <Sparkles className="h-8 w-8 text-yellow-500" />
              축하합니다!
              <Sparkles className="h-8 w-8 text-yellow-500" />
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-blue-900 mb-2">
              Welcome Cushman & Wakefield!
            </h2>
            <p className="text-gray-600 mb-6">
              온보딩 과정을 모두 완료하셨습니다.<br />
              C&W Korea의 새로운 가족이 되신 것을 환영합니다!
            </p>
            <Button
              onClick={() => setShowCelebration(false)}
              className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-2"
              data-testid="button-close-celebration"
            >
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
