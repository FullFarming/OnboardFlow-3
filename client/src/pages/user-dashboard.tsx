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
  const [wasAllComplete, setWasAllComplete] = useState(false);
  const { toast } = useToast();

  // Get employee data from sessionStorage
  useEffect(() => {
    const employeeData = sessionStorage.getItem("currentEmployee");
    if (employeeData) {
      const employee = JSON.parse(employeeData);
      setCurrentEmployee(employee);
      
      // Initialize wasAllComplete from localStorage for this employee
      const completionKey = `onboardingComplete:${employee.id}`;
      const savedCompletion = localStorage.getItem(completionKey) === 'true';
      setWasAllComplete(savedCompletion);
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
    isAllComplete: boolean;
  }>({
    queryKey: [`/api/progress-summary/${currentEmployee?.id}`],
    enabled: !!currentEmployee?.id,
  });

  // Fetch user progress details
  const { data: userProgress = [], refetch: refetchUserProgress } = useQuery<any[]>({
    queryKey: [`/api/progress/${currentEmployee?.id}`],
    enabled: !!currentEmployee?.id,
  });

  // Mark completion mutation (idempotent)
  const markCompleteMutation = useMutation({
    mutationFn: async ({ contentId, employeeId }: { contentId: string; employeeId: string }) => {
      const response = await apiRequest("POST", "/api/content/mark-complete", {
        contentId,
        employeeId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      refetchProgress();
      refetchUserProgress();
      if (data.alreadyCompleted) {
        toast({ title: "이미 완료된 콘텐츠입니다." });
      } else {
        toast({ title: "콘텐츠 완료!" });
      }
    },
    onError: () => {
      toast({ title: "업데이트 실패", variant: "destructive" });
    },
  });

  // Toggle completion mutation (for admin panel double-click)
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

  // Sort content icons by display order (create a copy to avoid mutating the cache)
  const contentIcons = [...contentIconsData].sort((a, b) => a.displayOrder - b.displayOrder);

  // Check for completion celebration
  useEffect(() => {
    if (progressSummary && currentEmployee) {
      // Primary check using isAllComplete flag, fallback to percentage for robustness
      const isNowComplete = (progressSummary.isAllComplete || progressSummary.percentage === 100) && progressSummary.total > 0;
      
      // Trigger badge when completion is newly achieved
      if (isNowComplete && !wasAllComplete) {
        setShowCelebration(true);
        // Persist completion state to prevent future notifications
        localStorage.setItem(`onboardingComplete:${currentEmployee.id}`, 'true');
      }
      
      // Update the tracker for next check
      setWasAllComplete(isNowComplete);
    }
  }, [progressSummary?.isAllComplete, progressSummary?.percentage, wasAllComplete, currentEmployee]);

  // Function to check if content is completed
  const isContentCompleted = (contentId: string) => {
    return userProgress.some(p => p.contentId === contentId && p.completed === 1);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("currentEmployee");
    setLocation("/auth");
  };

  const handleContentClick = (content: ContentIcon, event?: React.MouseEvent) => {
    // Check if this is a completion toggle (double-click for toggle functionality)
    const isToggleClick = event?.detail === 2; // Double-click
    
    if (isToggleClick && currentEmployee) {
      event?.preventDefault();
      toggleCompletionMutation.mutate({
        contentId: content.id,
        employeeId: currentEmployee.id,
      });
      return;
    }

    // Check if content is already completed
    const isCompleted = isContentCompleted(content.id);

    // Normal content viewing
    if (content.contentType === "Link") {
      // Only mark as complete if not already completed
      if (currentEmployee && !isCompleted) {
        markCompleteMutation.mutate({
          contentId: content.id,
          employeeId: currentEmployee.id,
        });
      }
      window.open(content.contentSource, "_blank");
    } else {
      // For other content types, mark as complete only if not already completed
      if (currentEmployee && !isCompleted) {
        markCompleteMutation.mutate({
          contentId: content.id,
          employeeId: currentEmployee.id,
        });
      }
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
      {/* Mobile Header */}
      <header className="bg-white bg-opacity-95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="px-3 py-3">
          <div className="flex flex-col space-y-3">
            <div className="flex justify-between items-center">
              <img 
                src={cwLogo} 
                alt="C&W Korea Logo" 
                className="h-8 w-auto"
                data-testid="img-cw-logo"
              />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 p-2"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900" data-testid="text-welcome-message">
                안녕하세요, <span data-testid="text-user-name">{currentEmployee.userName}</span>님!
              </h1>
              <p className="text-xs text-gray-600">C&W Korea 온보딩에 오신 것을 환영합니다</p>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Content */}
      <div className="px-3 py-4">
        {/* Personal Information Card */}
        <Card className="glass-card mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 brand-navy text-base">
              <Users className="h-4 w-4" />
              개인 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-2 bg-gray-50 rounded-lg">
                <Inbox className="h-4 w-4 brand-blue mt-1" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600">이메일</p>
                  <p className="font-medium text-sm break-all" data-testid="text-user-email">{currentEmployee.email}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-2 bg-gray-50 rounded-lg">
                <Laptop className="h-4 w-4 brand-blue mt-1" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600">임시pw</p>
                  <p className="font-medium text-sm" data-testid="text-user-laptop">{currentEmployee.laptopInfo}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-2 bg-gray-50 rounded-lg">
                <Users className="h-4 w-4 brand-blue mt-1" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600">Your Buddy</p>
                  <p className="font-medium text-sm" data-testid="text-user-buddy">{currentEmployee.buddyName}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-2 bg-gray-50 rounded-lg">
                <Key className="h-4 w-4 brand-blue mt-1" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600">사물함 번호</p>
                  <p className="font-medium text-sm" data-testid="text-user-locker">{currentEmployee.lockerNumber}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Onboarding Curriculum */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 brand-navy text-base">
              <GraduationCap className="h-4 w-4" />
              온보딩 커리큘럼
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {contentIcons.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                온보딩 콘텐츠가 준비 중입니다.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2" data-testid="content-grid">
                {contentIcons.map((content) => {
                  const isCompleted = isContentCompleted(content.id);
                  return (
                    <div
                      key={content.id}
                      className="cursor-pointer group relative"
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
                      <div className={`bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 ${isCompleted ? 'ring-2 ring-green-500' : ''}`}>
                        <div className="relative flex justify-center mb-2">
                          <div className={`w-16 h-16 ${content.iconImage ? 'bg-transparent' : getContentTypeColor(content.contentType)} rounded-lg flex items-center justify-center text-2xl overflow-hidden relative`}>
                            {content.iconImage ? (
                              <img 
                                src={content.iconImage.startsWith('/uploads') ? content.iconImage : content.iconImage.startsWith('http') ? content.iconImage : `/uploads/${content.iconImage}`} 
                                alt={content.iconTitle} 
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  // Show fallback icon instead
                                  const parent = target.parentElement!;
                                  parent.innerHTML = `<span class="text-2xl text-white">${getContentTypeIcon(content.contentType)}</span>`;
                                  parent.className = parent.className.replace('bg-transparent', getContentTypeColor(content.contentType));
                                }}
                              />
                            ) : (
                              <span className="text-white">{getContentTypeIcon(content.contentType)}</span>
                            )}
                          </div>
                          {isCompleted && (
                            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <h3 className={`text-xs font-medium text-center leading-tight ${isCompleted ? 'text-green-700' : 'text-gray-900'}`} data-testid={`text-content-title-${content.id}`}>
                          {content.iconTitle}
                        </h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile EXP Bar - Fixed at bottom */}
      {progressSummary && (
        <div className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-95 backdrop-blur-sm border-t border-gray-200 shadow-lg z-50">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">온보딩 진행률</span>
              <span className="text-xs font-bold text-blue-600">
                EXP: {Math.min(progressSummary.completed, progressSummary.total)} / {progressSummary.total} ({Math.min(100, Math.round(progressSummary.percentage))}%)
              </span>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${Math.min(100, progressSummary.percentage)}%` }}
                  data-testid="exp-progress-bar"
                >
                  <div className="h-full bg-white bg-opacity-20 animate-pulse"></div>
                </div>
              </div>
              {Math.min(progressSummary.completed, progressSummary.total) >= progressSummary.total && (
                <div className="absolute -top-1 right-0">
                  <Sparkles className="h-4 w-4 text-yellow-500 animate-bounce" />
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
              🎉 축하합니다! 🎉
              <Sparkles className="h-8 w-8 text-yellow-500" />
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-blue-900 mb-4">
              온보딩을 완료하신 것을 축하합니다!
            </h2>
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-lg font-bold text-gray-800">
                HR에 방문하셔서 이걸 보여주시면 입사 선물을 받을 수 있어요!
              </p>
            </div>
            <Button
              onClick={() => setShowCelebration(false)}
              className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-2"
              data-testid="button-close-congrats"
            >
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
