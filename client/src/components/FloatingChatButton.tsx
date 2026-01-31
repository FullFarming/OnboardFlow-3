import { MessageCircle } from 'lucide-react';

interface FloatingChatButtonProps {
  onClick: () => void;
  hasNewMessage?: boolean;
}

export default function FloatingChatButton({ onClick, hasNewMessage = false }: FloatingChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 z-40 group"
      aria-label="챗봇 열기"
    >
      <MessageCircle className="w-6 h-6" />
      {hasNewMessage && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
      )}
      
      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        매뉴얼 챗봇
        <div className="absolute top-full right-4 w-2 h-2 bg-gray-800 transform rotate-45 -mt-1" />
      </div>
    </button>
  );
}
