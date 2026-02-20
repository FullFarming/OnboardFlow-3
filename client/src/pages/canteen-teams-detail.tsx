import { useLocation } from "wouter";
import {
  ArrowLeft,
  Bookmark,
  Share2,
  Eye,
  Info,
  CheckCircle,
  HelpCircle,
  Wifi,
  Tv,
  Mic,
  Volume2,
  PhoneOff,
  Camera,
  Monitor,
  AlertTriangle,
  Zap,
  QrCode,
  Settings,
} from "lucide-react";
import officeBg from "@assets/image_1756257576204.png";

export default function CanteenTeamsDetail() {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex justify-center items-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 sm:rounded-3xl shadow-2xl overflow-hidden relative min-h-screen sm:min-h-[800px] flex flex-col">

        {/* ── Hero Header ── */}
        <div className="relative h-48 bg-gray-800 flex-shrink-0">
          <img
            src={officeBg}
            alt="Office Background"
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-white dark:to-gray-800" />
          <div className="absolute top-0 left-0 right-0 px-4 py-4 mt-8 flex justify-between items-center z-10 text-white">
            <button
              onClick={() => setLocation("/manual-library")}
              className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex gap-3">
              <button className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors">
                <Bookmark className="w-5 h-5 text-white" />
              </button>
              <button className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors">
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto px-5 pb-28 -mt-12 relative z-10">

          {/* ── Info Card ── */}
          <div className="bg-white dark:bg-gray-700 rounded-2xl p-5 shadow-lg mb-6 border border-gray-100 dark:border-gray-600">
            <div className="flex justify-between items-start mb-3">
              <span className="bg-indigo-50 text-indigo-600 dark:text-indigo-300 dark:bg-indigo-900/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                WPR
              </span>
              <span className="text-gray-400 dark:text-gray-500 text-xs flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> 24
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
              캔틴 팀즈룸 매뉴얼
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              효율적인 하이브리드 미팅을 위한 Crestron 및 AirMedia 장비 운영 가이드입니다.
            </p>
            <div className="flex flex-wrap gap-2">
              {["캔틴", "팀즈", "Teams", "Crestron", "AirMedia"].map((tag) => (
                <span key={tag} className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                  #{tag}
                </span>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-600 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>Last updated: 2025.01.01</span>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[9px] font-bold">
                  W
                </div>
                <span>WPR Team</span>
              </div>
            </div>
          </div>

          {/* ── Content Sections ── */}
          <div className="space-y-6">

            {/* Step 1: 미팅 생성 및 회의실 초대 */}
            <Section title="Step 1. 미팅 생성 및 회의실 초대">
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                Teams 앱 또는 Outlook 캘린더에서 미팅을 만들고 캔틴 회의실을 초대하세요.
              </p>
              <StepList
                steps={[
                  {
                    title: "미팅 생성",
                    desc: "Teams 앱 또는 Outlook 캘린더에서 '새로운 미팅(New Meeting)'을 생성합니다.",
                  },
                  {
                    title: "회의실 초대 (필수)",
                    desc: (
                      <>
                        참석자(Attendees) 또는 장소(Location) 필드에 캔틴 회의실을 추가하세요.
                        <br />
                        <span className="mt-1 block font-mono text-[11px] bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-indigo-600 dark:text-indigo-300">
                          KORSeoul.CanteenRM@cushwake.com
                        </span>
                      </>
                    ),
                  },
                  {
                    title: "초대 발송",
                    desc: "날짜와 시간을 확인한 후 초대를 발송합니다. 회의실 시스템이 자동으로 예약을 수락합니다.",
                  },
                ]}
              />
              <InfoBox icon={<Zap className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />}>
                Zoom도 동일 방식으로 사용 가능합니다. (One-Touch Join 지원)
              </InfoBox>
            </Section>

            {/* Step 2-1: 미팅 옵션 설정 (Meeting Access) */}
            <Section title="Step 2-1. 미팅 옵션 설정 (Access)">
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                미팅 생성 시 <strong className="text-gray-800 dark:text-gray-100">"Options"</strong> 버튼을 클릭하여 접근 권한을 설정하세요.
              </p>
              <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-600 text-sm">
                <div className="grid grid-cols-2 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                  <span>설정 항목</span>
                  <span>권장값</span>
                </div>
                {[
                  ["Who can bypass the lobby", "People in my org"],
                  ["Who can admit from the lobby", "Organizers, co-organizers"],
                ].map(([setting, value]) => (
                  <div
                    key={setting}
                    className="grid grid-cols-2 px-4 py-3 border-t border-gray-100 dark:border-gray-600 gap-2"
                  >
                    <span className="text-gray-600 dark:text-gray-400 text-xs leading-snug">{setting}</span>
                    <span className="text-gray-900 dark:text-white text-xs font-medium">{value}</span>
                  </div>
                ))}
              </div>
              <InfoBox icon={<Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />}>
                외부인은 바로 입장하지 못하고 로비(Lobby)에서 대기하며, 승인 후에만 입장 가능합니다.
              </InfoBox>
            </Section>

            {/* Step 2-2: 미팅 옵션 설정 (Participation) */}
            <Section title="Step 2-2. 미팅 옵션 설정 (참여)">
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                Meeting options에서 참석자들의 권한을 세밀하게 조정할 수 있습니다.
              </p>
              <div className="space-y-2">
                {[
                  { icon: <Mic className="w-4 h-4" />, label: "Allow mic for attendees", desc: "참석자 마이크 사용 허용" },
                  { icon: <Camera className="w-4 h-4" />, label: "Allow camera for attendees", desc: "참석자 카메라 사용 허용" },
                  { icon: <Monitor className="w-4 h-4" />, label: "Meeting chat", desc: "채팅 기능 활성화" },
                  { icon: <Settings className="w-4 h-4" />, label: "Allow reactions", desc: "이모지 반응 사용 허용" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-600"
                  >
                    <span className="text-indigo-500 dark:text-indigo-400">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <InfoBox icon={<Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />}>
                참석자가 많은 경우 잡음 방지를 위해 마이크·카메라 권한을 Off로 설정하는 것을 권장합니다.
              </InfoBox>
            </Section>

            {/* Step 3: Crestron 미팅 참가 */}
            <Section title="Step 3. Crestron에서 미팅 참가">
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                회의실 테이블 위의 <strong className="text-gray-800 dark:text-gray-100">Crestron 터치 패널</strong>을 사용하여 예정된 미팅에 참여하세요.
              </p>
              <StepList
                steps={[
                  { title: "미팅 확인", desc: "패널 화면 우측의 일정 목록에서 예약된 미팅을 확인합니다." },
                  { title: "Join 버튼 클릭", desc: "활성화된 보라색 'Join' 버튼을 터치합니다." },
                  { title: "참가 완료", desc: "TV 화면에 미팅룸이 표시되며 연결이 완료됩니다." },
                ]}
              />
              <InfoBox icon={<QrCode className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />}>
                화면 좌측 상단의 QR 코드를 스캔하면 개인 모바일 기기로도 미팅에 참여할 수 있습니다.
              </InfoBox>
            </Section>

            {/* Step 4: 미팅 중 제어하기 */}
            <Section title="Step 4. 미팅 중 제어하기">
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                터치 패널 하단의 아이콘으로 미팅 환경을 실시간으로 제어할 수 있습니다.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Camera className="w-5 h-5" />, label: "카메라", desc: "회의실 카메라 영상 켜기/끄기" },
                  { icon: <Mic className="w-5 h-5" />, label: "마이크", desc: "Mute/Unmute 전환" },
                  { icon: <Volume2 className="w-5 h-5" />, label: "음량", desc: "스피커 볼륨 조절" },
                  { icon: <PhoneOff className="w-5 h-5" />, label: "종료", desc: "미팅 나가기/통화 종료" },
                ].map((ctrl) => (
                  <div
                    key={ctrl.label}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-600 text-center"
                  >
                    <span className="text-indigo-500 dark:text-indigo-400">{ctrl.icon}</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{ctrl.label}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-snug">{ctrl.desc}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Step 5: AirMedia 화면 공유 */}
            <Section title="Step 5. AirMedia 화면 공유">
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                일명 <strong className="text-gray-800 dark:text-gray-100">'Puck'</strong>이라 불리는 원형 무선 화면 공유 장치입니다. 소프트웨어 설치 없이 USB-C 연결만으로 화면 공유가 가능합니다.
              </p>
              <div className="space-y-3">
                {[
                  { icon: <Wifi className="w-4 h-4" />, title: "간편한 연결", desc: "노트북의 USB-C 포트에 연결하면 즉시 TV 및 Teams 미팅에 화면이 공유됩니다." },
                  { icon: <Zap className="w-4 h-4" />, title: "No Software", desc: "드라이버나 앱 설치가 전혀 필요 없습니다. (Plug & Play)" },
                  { icon: <Tv className="w-4 h-4" />, title: "듀얼 연결 지원", desc: "회의실에 2개의 장치가 비치되어 있어 2대 동시 연결이 가능합니다." },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-600"
                  >
                    <span className="mt-0.5 flex-shrink-0 text-indigo-500 dark:text-indigo-400">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-0.5">{item.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Step 6: AirMedia 연결하기 */}
            <Section title="Step 6. AirMedia 연결하기">
              <StepList
                steps={[
                  { title: "USB-C 포트 연결", desc: "노트북 포트에 AirMedia 장치를 연결하세요." },
                  { title: "3~5초 대기", desc: "장치가 인식될 때까지 잠시 기다립니다." },
                  { title: "녹색 버튼 점등 확인", desc: "LED가 녹색으로 바뀌면 연결이 완료된 것입니다." },
                  { title: "화면 자동 표시", desc: "TV 및 Teams에 화면이 자동으로 공유됩니다." },
                ]}
              />
              <InfoBox icon={<Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />}>
                DisplayPort Alt Mode 지원 포트가 필요합니다. 화면 모드 변경은 Win+P를 누르고 복제(Duplicate) 또는 확장(Extend)을 선택하세요.
              </InfoBox>
            </Section>

            {/* 주의사항 */}
            <div className="bg-white dark:bg-gray-700 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-600">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                반드시 기억하세요!
              </h2>
              <div className="space-y-4">
                <WarningBox title="이중 화면 공유 금지">
                  AirMedia 사용 중일 때는 Teams 앱 내의 '화면 공유' 버튼을 누르지 마세요.
                  화면 충돌 및 오디오 에코(Howling)로 회의 진행이 불가합니다.
                </WarningBox>
                <WarningBox title="마이크 음량 조절">
                  Crestron 패널로 조절이 충분하지 않은 경우, 캔틴 창고의 음향 장비(앰프 마스터 볼륨)를 확인하세요.
                </WarningBox>
                <WarningBox title="Laptop 오디오 설정 변경 금지">
                  AirMedia 연결 시 오디오 주설정이 변경됩니다. 미팅 중 오디오 설정을 임의로 변경하지 마세요.
                </WarningBox>
                <WarningBox title="사전 리허설 필수">
                  온·오프라인 미팅 전 리허설을 진행하여 오디오·화면 공유 상태를 미리 점검하세요.
                </WarningBox>
              </div>
            </div>

            {/* Quick Guide */}
            <div className="bg-white dark:bg-gray-700 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-600">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                <span className="w-1.5 h-5 bg-[#E31837] rounded-full mr-2 flex-shrink-0" />
                사용 요약 (Quick Guide)
              </h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { num: "1", title: "미팅 생성", desc: "캔틴 회의실 초대 후 예약" },
                  { num: "2", title: "미팅 참가", desc: "Crestron Join 버튼 클릭" },
                  { num: "3", title: "화면 공유", desc: "AirMedia USB-C 연결" },
                ].map((step) => (
                  <div key={step.num} className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-lg">
                      {step.num}
                    </div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">{step.title}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="bg-white dark:bg-gray-700 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-600">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                <span className="w-1.5 h-5 bg-[#E31837] rounded-full mr-2 flex-shrink-0" />
                문제 해결 (Troubleshooting)
              </h2>
              <div className="space-y-3">
                {[
                  {
                    problem: "AirMedia 연결 안 됨",
                    solution: "장치 분리 후 5초 대기 → 재연결하거나 노트북 재부팅",
                  },
                  {
                    problem: "소리가 울림 (Echo)",
                    solution: "노트북 마이크/스피커를 모두 음소거 처리하세요.",
                  },
                ].map((item) => (
                  <div
                    key={item.problem}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-600"
                  >
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">
                      🔴 {item.problem}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">{item.solution}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
                장비 사용 중 문제가 발생하면 WPR팀으로 연락주시기 바랍니다.
              </p>
            </div>

          </div>
          {/* bottom spacer */}
          <div className="h-4" />
        </div>

        {/* ── Bottom Action Bar ── */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-700/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-600 p-4 flex gap-3 z-50">
          <button className="flex-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-white font-medium py-3 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors flex justify-center items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            문의하기
          </button>
          <button className="flex-[2] bg-indigo-600 text-white font-medium py-3 rounded-xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            확인 완료
          </button>
        </div>

      </div>
    </div>
  );
}

/* ── Reusable sub-components ── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-700 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-600">
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
        <span className="w-1.5 h-5 bg-[#E31837] rounded-full mr-2 flex-shrink-0" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function StepList({
  steps,
}: {
  steps: { title: string; desc: React.ReactNode }[];
}) {
  return (
    <ul className="space-y-4 relative mb-4">
      {steps.length > 1 && (
        <div className="absolute left-[15px] top-2 bottom-6 w-0.5 bg-gray-200 dark:bg-gray-600" />
      )}
      {steps.map((step, i) => (
        <li key={i} className="relative pl-10">
          <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-sm z-10 border-2 border-white dark:border-gray-700">
            {i + 1}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{step.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">{step.desc}</p>
        </li>
      ))}
    </ul>
  );
}

function InfoBox({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex items-start gap-3 border border-gray-100 dark:border-gray-600 mt-4">
      {icon}
      <p className="text-xs text-gray-500 dark:text-gray-400">{children}</p>
    </div>
  );
}

function WarningBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-0.5">{title}</p>
        <p className="text-xs text-red-600 dark:text-red-300 leading-snug">{children}</p>
      </div>
    </div>
  );
}
