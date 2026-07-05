import { BookOpen, Users, BookmarkCheck, Calendar, Activity, LogOut, ShieldAlert, Menu, X } from "lucide-react";

interface HeaderProps {
  isArabic: boolean;
  setIsArabic: (val: boolean) => void;
  congestion: number; // 0 - 100
  setCongestion: (val: number) => void;
  totalSeats: number;
  currentUser: {
    name: string;
    id: string;
    email: string;
    role: "internal_student" | "external_student" | "admin";
    collegeName?: string;
    department?: string;
  } | null;
  onLogout: () => void;
  stats: {
    totalBooks: number;
    activeLoans: number;
    bookedSeats: number;
    totalStudents: number;
  };
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
}

export default function Header({ 
  isArabic, 
  setIsArabic, 
  congestion, 
  setCongestion, 
  totalSeats,
  currentUser,
  onLogout,
  stats,
  sidebarOpen,
  setSidebarOpen
}: HeaderProps) {
  
  // Get congestion status and color
  const getCongestionStatus = (level: number) => {
    if (level < 35) {
      return {
        ar: "هادئ جداً (مناسب للمطالعة الصامتة)",
        en: "Very Quiet (Perfect for Silent Study)",
        color: "bg-emerald-500",
        text: "text-emerald-500",
        lightBg: "bg-emerald-50/50"
      };
    } else if (level < 70) {
      return {
        ar: "متوسط الزحام (نشاط اعتيادي)",
        en: "Moderate (Standard Activity)",
        color: "bg-amber-500",
        text: "text-amber-500",
        lightBg: "bg-amber-50/50"
      };
    } else {
      return {
        ar: "مزدحم (موصى بغرف النقاش)",
        en: "Crowded (Recommended to use Discussion Rooms)",
        color: "bg-rose-500",
        text: "text-rose-500",
        lightBg: "bg-rose-50/50"
      };
    }
  };

  const status = getCongestionStatus(congestion);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-md bg-white/95" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200 flex items-center justify-center">
              <BookOpen className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                {isArabic ? "مكتبة FWK Library" : "FWK Library"}
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] bg-blue-50 text-blue-600 rounded-full font-mono border border-blue-100">
                  v2.5 Smart
                </span>
              </h1>
              <p className="text-xs text-gray-500">
                {isArabic ? "كليات الحاسبات والمعلومات - البوابة الأكاديمية المتكاملة" : "Colleges of Computer Science and Information - Unified Portal"}
              </p>
            </div>
          </div>

          {/* Quick Metrics & Settings */}
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Live Congestion Indicator */}
            <div className={`flex items-center gap-3 px-3.5 py-1.5 rounded-xl border border-gray-100 ${status.lightBg}`}>
              <div className="relative">
                <span className={`flex h-3 w-3 rounded-full ${status.color}`}></span>
                <span className={`animate-ping absolute top-0 left-0 h-3 w-3 rounded-full ${status.color} opacity-75`}></span>
              </div>
              <div className="text-xs">
                <span className="text-gray-500 block text-[10px] uppercase tracking-wider">
                  {isArabic ? "مستوى الزحام الحالي" : "Live Library Congestion"}
                </span>
                <span className={`font-semibold ${status.text}`}>
                  {congestion}% - {isArabic ? status.ar : status.en}
                </span>
              </div>
              
              {/* Congestion Control Slider for Simulation */}
              <div className="flex items-center gap-1 border-l border-gray-200 pl-3 ml-2">
                <input 
                  type="range" 
                  min="10" 
                  max="95" 
                  value={congestion}
                  onChange={(e) => setCongestion(parseInt(e.target.value))}
                  className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                  title={isArabic ? "محاكاة مستوى زحام المكتبة" : "Simulate library congestion level"}
                />
                <span className="text-[10px] text-gray-400 font-mono">Sim</span>
              </div>
            </div>

            {/* Language Switcher */}
            <button
              id="lang-toggle"
              onClick={() => setIsArabic(!isArabic)}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 transition-colors cursor-pointer"
            >
              {isArabic ? "English 🇬🇧" : "العربية 🇸🇦"}
            </button>

            {/* Mobile Menu Hamburger Toggle */}
            {currentUser && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold"
                title={isArabic ? "قائمة التصفح" : "Toggle Menu"}
              >
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                <span>{isArabic ? "القائمة" : "Menu"}</span>
              </button>
            )}

            {/* Logged in user profile & Logout */}
            {currentUser && (
              <div className="flex items-center gap-2 border-l sm:border-l-0 sm:border-r border-gray-200 pl-2 sm:pl-0 sm:pr-2 sm:ml-1" id="header-user-profile">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-gray-800 leading-none">{currentUser.name}</p>
                  <span className="text-[9px] text-gray-400 font-medium block mt-1">
                    {currentUser.role === "admin" 
                      ? (isArabic ? "مدير النظام" : "System Administrator")
                      : `${currentUser.department || (isArabic ? "طالب" : "Student")} | ${currentUser.id}`}
                  </span>
                </div>
                
                <button
                  onClick={onLogout}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 hover:border-red-200 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                  title={isArabic ? "تسجيل الخروج" : "Log Out"}
                  id="header-logout-btn"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{isArabic ? "خروج" : "Logout"}</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Dashboard Mini-Stats Ribbon */}
        <div className="hidden md:grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
          
          <div className="p-3 bg-slate-50/50 rounded-xl border border-gray-100/70 flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-gray-400 block">
                {isArabic ? "إجمالي الكتب بالفهرس" : "Total Catalog Books"}
              </span>
              <span className="text-sm font-bold text-gray-800 font-mono">
                {stats.totalBooks}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50/50 rounded-xl border border-gray-100/70 flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-gray-400 block">
                {isArabic ? "الاستعارات النشطة" : "Active Book Loans"}
              </span>
              <span className="text-sm font-bold text-gray-800 font-mono">
                {stats.activeLoans}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50/50 rounded-xl border border-gray-100/70 flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-gray-400 block">
                {isArabic ? "المقاعد المحجوزة" : "Booked Seats / Spaces"}
              </span>
              <span className="text-sm font-bold text-gray-800 font-mono">
                {stats.bookedSeats} / {totalSeats}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50/50 rounded-xl border border-gray-100/70 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-gray-400 block">
                {isArabic ? "الطلاب المسجلين" : "Registered Students"}
              </span>
              <span className="text-sm font-bold text-gray-800 font-mono">
                {stats.totalStudents}
              </span>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}
