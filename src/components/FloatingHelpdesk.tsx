import React, { useState } from "react";
import { MessageSquare } from "lucide-react";
import { ChatMessage } from "../types";

interface FloatingHelpdeskProps {
  isArabic: boolean;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  chatMessages: ChatMessage[];
  onSendStudentChat: (message: string) => Promise<void>;
}

export const FloatingHelpdesk: React.FC<FloatingHelpdeskProps> = ({
  isArabic,
  currentUser,
  chatMessages,
  onSendStudentChat
}) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [myMsg, setMyMsg] = useState("");
  const studentMsgs = chatMessages.filter(m => m.studentId === currentUser.id);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {chatOpen && (
        <div className="bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-100 w-80 h-96 flex flex-col overflow-hidden mb-3 animate-fade-in text-right">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-3.5 flex items-center justify-between">
            <button 
              onClick={() => setChatOpen(false)}
              className="text-white/80 hover:text-white text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <h4 className="text-xs font-bold">{isArabic ? "مكتب المساعدة والدردشة المباشرة" : "Live Library Helpdesk"}</h4>
                <p className="text-[10px] text-indigo-100">{isArabic ? "تواصل مباشر مع مشرف المكتبة" : "Chat with Library supervisor"}</p>
              </div>
              <MessageSquare className="w-4 h-4 text-white animate-pulse" />
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50 flex flex-col-reverse">
            {[...studentMsgs].reverse().map((msg, idx) => {
              const isAdmin = msg.senderRole === "admin";
              return (
                <div key={idx} className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}>
                  <div className={`p-2.5 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                    isAdmin 
                      ? "bg-gray-100 text-gray-800 rounded-tl-none text-left" 
                      : "bg-indigo-600 text-white rounded-tr-none text-right font-medium"
                  }`}>
                    <p>{msg.message}</p>
                  </div>
                  <span className="text-[8px] text-gray-400 mt-1 px-1 font-mono">{msg.timestamp}</span>
                </div>
              );
            })}
            {studentMsgs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-4 space-y-2 my-auto">
                <MessageSquare className="w-8 h-8 text-indigo-500 animate-bounce" />
                <p className="text-xs font-bold text-gray-700">{isArabic ? "مرحباً بك! هل لديك أي استفسار؟" : "Hello! Feel free to ask any question."}</p>
                <p className="text-[10px] leading-relaxed text-gray-500">
                  {isArabic 
                    ? "اكتب رسالتك وسيرد عليك مشرف المكتبة الرقمية فوراً."
                    : "Send a message and library administrators will reply."}
                </p>
              </div>
            )}
          </div>

          {/* Message Input */}
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              if (!myMsg.trim()) return;
              await onSendStudentChat(myMsg);
              setMyMsg("");
            }}
            className="p-2.5 border-t border-gray-100 bg-white flex gap-2 items-center"
          >
            <button 
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
            >
              {isArabic ? "إرسال" : "Send"}
            </button>
            <input
              type="text"
              value={myMsg}
              onChange={(e) => setMyMsg(e.target.value)}
              placeholder={isArabic ? "اكتب رسالتك للمشرف..." : "Type your query..."}
              className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-right focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </form>
        </div>
      )}

      {/* Chat Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 cursor-pointer relative"
        title={isArabic ? "الدردشة مع المشرف" : "Chat with Advisor"}
      >
        <MessageSquare className="w-5 h-5" />
        {chatMessages.length > 0 && chatMessages[chatMessages.length - 1].senderRole === "admin" && !chatOpen && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full animate-ping" />
        )}
      </button>
    </div>
  );
};
