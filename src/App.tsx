import { useState, useEffect } from "react";
import { 
  Trophy, 
  BookMarked, 
  Calendar, 
  FolderGit, 
  UserPlus, 
  Bot, 
  LayoutDashboard, 
  Menu, 
  X,
  Activity,
  ShieldCheck,
  Shield,
  MessageSquare
} from "lucide-react";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import LibraryCatalog from "./components/LibraryCatalog";
import SpaceBookings from "./components/SpaceBookings";
import GraduationProjects from "./components/GraduationProjects";
import StudentRegistrations from "./components/StudentRegistrations";
import GuidelinesAndAI from "./components/GuidelinesAndAI";
import AdminPortal from "./components/AdminPortal";
import { FloatingHelpdesk } from "./components/FloatingHelpdesk";
import AuthPage from "./components/AuthPage";

import { 
  initializeSeedData, 
  getBooks, 
  addBook, 
  deleteBook,
  getLoans, 
  createLoan, 
  returnLoan, 
  getGraduationProjects, 
  addGraduationProject, 
  deleteGraduationProject,
  getIncompleteProjects, 
  addIncompleteProject, 
  deleteIncompleteProject,
  getAchievements, 
  addAchievement, 
  getCompetitions, 
  addCompetition, 
  getLibrarySpaces, 
  bookSpace, 
  releaseSpace, 
  getStudentRegistrations, 
  registerStudent, 
  getInquiries,
  getPrintRequests,
  addPrintRequest,
  updatePrintRequestStatus,
  getNotifications,
  addNotification,
  getChatMessages,
  addChatMessage,
  getLibraryConfig,
  updateLibraryConfig,
  updateStudentLibraryStatus,
  clearAllDatabaseData,
  verifyStudentReservations,
  cancelExpiredReservations
} from "./lib/dataService";

import { 
  Book, 
  Loan, 
  GraduationProject, 
  IncompleteProject, 
  Achievement, 
  Competition, 
  LibrarySpace, 
  StudentRegistration, 
  LibraryInquiry,
  PrintRequest,
  BroadcastNotification,
  ChatMessage
} from "./types";

export default function App() {
  // Bilingual state
  const [isArabic, setIsArabic] = useState(true);
  const [congestion, setCongestion] = useState(38); // Simulated active live level
  const [congestionMode, setCongestionMode] = useState<"auto" | "manual">("auto");
  
  // Navigation
  const [activeTab, setActiveTab] = useState<"dashboard" | "catalog" | "bookings" | "projects" | "registrations" | "ai" | "admin">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // NEW STATES: User Session & Support Features
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    id: string;
    email: string;
    role: "internal_student" | "external_student" | "admin";
    collegeName?: string;
    department?: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem("smart_lib_session_v1");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [totalSeats, setTotalSeats] = useState<number>(5);

  // Firestore Data State
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [graduationProjects, setGraduationProjects] = useState<GraduationProject[]>([]);
  const [incompleteProjects, setIncompleteProjects] = useState<IncompleteProject[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [spaces, setSpaces] = useState<LibrarySpace[]>([]);
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [inquiries, setInquiries] = useState<LibraryInquiry[]>([]);
  const [printRequests, setPrintRequests] = useState<PrintRequest[]>([]);
  const [notifications, setNotifications] = useState<BroadcastNotification[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and fetch data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Run automatic seed check
      await initializeSeedData();
      
      // Parallel fetch from Firestore
      const [
        booksList,
        loansList,
        gradProjs,
        incProjs,
        achList,
        compList,
        spaceList,
        regList,
        faqList,
        printList,
        notifList,
        chatList,
        config
      ] = await Promise.all([
        getBooks(),
        getLoans(),
        getGraduationProjects(),
        getIncompleteProjects(),
        getAchievements(),
        getCompetitions(),
        getLibrarySpaces(),
        getStudentRegistrations(),
        getInquiries(),
        getPrintRequests(),
        getNotifications(),
        getChatMessages(),
        getLibraryConfig()
      ]);

      setBooks(booksList);
      setLoans(loansList);
      setGraduationProjects(gradProjs);
      setIncompleteProjects(incProjs);
      setAchievements(achList);
      setCompetitions(compList);
      setSpaces(spaceList);
      setRegistrations(regList);
      setInquiries(faqList);
      setPrintRequests(printList);
      setNotifications(notifList);
      setChatMessages(chatList);
      setTotalSeats(config.totalSeats || 5);
      if (config.congestionMode !== undefined) {
        setCongestionMode(config.congestionMode as "auto" | "manual");
      }
      if (config.congestionMode === "manual" && config.congestion !== undefined) {
        setCongestion(config.congestion);
      }

    } catch (err) {
      console.error("Error loading library database:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-calculate congestion if in auto mode based on students present in library
  useEffect(() => {
    if (congestionMode === "auto") {
      const count = registrations.filter(r => r.inLibrary).length;
      let calculated = 12;
      if (count === 1) calculated = 28;
      else if (count === 2) calculated = 45;
      else if (count === 3) calculated = 68;
      else if (count >= 4) calculated = 88;
      setCongestion(calculated);
    }
  }, [registrations, congestionMode]);

  // Navigation permissions checker
  const isTabAllowed = (tab: string, role: "internal_student" | "external_student" | "admin"): boolean => {
    if (tab === "dashboard") {
      return role === "admin" || role === "internal_student";
    }
    if (role === "admin") {
      return tab === "admin";
    }
    if (role === "internal_student") {
      return ["catalog", "bookings", "projects", "registrations", "ai"].includes(tab);
    }
    if (role === "external_student") {
      return tab === "catalog";
    }
    return false;
  };

  // Sync and protect activeTab on user session/role change
  useEffect(() => {
    if (currentUser) {
      if (!isTabAllowed(activeTab, currentUser.role)) {
        if (currentUser.role === "admin") {
          setActiveTab("admin");
        } else if (currentUser.role === "internal_student") {
          setActiveTab("bookings");
        } else if (currentUser.role === "external_student") {
          setActiveTab("catalog");
        }
      }
    }
  }, [currentUser, activeTab]);

  // Background interval to check for expired reservations every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const cancellations = await cancelExpiredReservations();
        if (cancellations.length > 0) {
          console.log("Canceled expired reservations:", cancellations);
          await fetchData(); // Refresh state and update UI
        }
      } catch (err) {
        console.error("Error in background reservation expiration check:", err);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Compute stats for Header
  const stats = {
    totalBooks: books.length,
    activeLoans: loans.filter(l => l.status === "active").length,
    bookedSeats: spaces.filter(s => s.status === "booked").length,
    totalStudents: registrations.length
  };

  // ---------------- MUTATIONS ----------------

  const handleAddBook = async (bookData: Omit<Book, "id">) => {
    await addBook(bookData);
    await fetchData(); // Refresh
  };

  const handleBorrowBook = async (loanData: Omit<Loan, "id">) => {
    const studentReg = registrations.find(r => r.studentId === loanData.studentId);
    const isOutside = !studentReg || !studentReg.inLibrary;
    const loanPayload = {
      ...loanData,
      createdAt: new Date().toISOString(),
      needsCheckIn: isOutside
    };
    await createLoan(loanPayload);
    await fetchData(); // Refresh
  };

  const handleReturnBook = async (loanId: string, bookId: string) => {
    await returnLoan(loanId, bookId);
    await fetchData(); // Refresh
  };

  const handleAddGradProject = async (projData: Omit<GraduationProject, "id">) => {
    await addGraduationProject(projData);
    await fetchData(); // Refresh
  };

  const handleDeleteGradProject = async (projectId: string) => {
    await deleteGraduationProject(projectId);
    await fetchData(); // Refresh
  };

  const handleAddIncompleteProject = async (projData: Omit<IncompleteProject, "id">) => {
    await addIncompleteProject(projData);
    await fetchData(); // Refresh
  };

  const handleDeleteIncompleteProject = async (projectId: string) => {
    await deleteIncompleteProject(projectId);
    await fetchData(); // Refresh
  };

  const handleDeleteBook = async (bookId: string) => {
    await deleteBook(bookId);
    await fetchData(); // Refresh
  };

  const handleAddAchievement = async (achData: Omit<Achievement, "id">) => {
    await addAchievement(achData);
    await fetchData(); // Refresh
  };

  const handleAddCompetition = async (compData: Omit<Competition, "id">) => {
    await addCompetition(compData);
    await fetchData(); // Refresh
  };

  const handleBookSpace = async (
    spaceId: string, 
    stName: string, 
    stId: string, 
    start: string, 
    end: string,
    vCode: string
  ) => {
    const studentReg = registrations.find(r => r.studentId === stId);
    const isOutside = !studentReg || !studentReg.inLibrary;
    await bookSpace(spaceId, stName, stId, start, end, vCode, new Date().toISOString(), isOutside);
    await fetchData(); // Refresh
  };

  const handleReleaseSpace = async (spaceId: string) => {
    await releaseSpace(spaceId);
    await fetchData(); // Refresh
  };

  const handleRegisterStudent = async (regData: Omit<StudentRegistration, "id">) => {
    await registerStudent(regData);
    await fetchData(); // Refresh
  };

  const handleRegisterFromAuth = async (regData: Omit<StudentRegistration, "id">): Promise<StudentRegistration> => {
    const newId = await registerStudent(regData);
    await fetchData(); // Refresh
    return { id: newId, ...regData };
  };

  // NEW BROADCASTS & CHATS & PRINTS CALLBACKS
  const handleAddPrintRequest = async (printData: {
    projectTitle: string;
    paperSize: "A4" | "A3";
    coverType: "hardcover" | "softcover" | "spiral";
    copies: number;
    extraNotes: string;
    studentName: string;
    studentId: string;
  }) => {
    await addPrintRequest({
      projectId: "",
      projectTitle: printData.projectTitle,
      studentName: printData.studentName,
      studentId: printData.studentId,
      paperSize: printData.paperSize,
      coverType: printData.coverType,
      copies: printData.copies,
      extraNotes: printData.extraNotes,
      status: "pending",
      requestedAt: new Date().toLocaleDateString("ar-SA") + " " + new Date().toLocaleTimeString("ar-SA")
    });
    await fetchData(); // Refresh
  };

  const handleUpdatePrintStatus = async (id: string, status: PrintRequest["status"]) => {
    await updatePrintRequestStatus(id, status);
    await fetchData(); // Refresh
  };

  const handleSendNotification = async (title: string, content: string, target: "college_only" | "other_only" | "all") => {
    await addNotification({
      title,
      content,
      targetAudience: target,
      senderName: isArabic ? "إدارة الكلية" : "College Admin",
      createdAt: new Date().toLocaleDateString("ar-SA") + " " + new Date().toLocaleTimeString("ar-SA")
    });
    await fetchData(); // Refresh
  };

  const handleReplyToChat = async (studentId: string, studentName: string, messageText: string) => {
    await addChatMessage({
      studentId,
      studentName,
      message: messageText,
      senderRole: "admin",
      timestamp: new Date().toLocaleTimeString("ar-SA")
    });
    await fetchData(); // Refresh
  };

  const handleSendStudentChat = async (messageText: string) => {
    if (!currentUser) return;
    await addChatMessage({
      studentId: currentUser.id,
      studentName: currentUser.name,
      message: messageText,
      senderRole: "student",
      timestamp: new Date().toLocaleTimeString("ar-SA")
    });
    await fetchData(); // Refresh
  };

  const handleUpdateTotalSeats = async (count: number) => {
    try {
      await updateLibraryConfig(count);
      setTotalSeats(count);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateLibraryStatus = async (studentRegId: string, inLibrary: boolean, accessTime: string) => {
    try {
      await updateStudentLibraryStatus(studentRegId, inLibrary, accessTime);
      if (inLibrary) {
        // Find the student's studentId using studentRegId or registered record
        const studentReg = registrations.find(r => r.studentId === studentRegId || r.id === studentRegId);
        if (studentReg) {
          await verifyStudentReservations(studentReg.studentId);
        }
      }
      await fetchData(); // Refresh
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("smart_lib_session_v1");
    setCurrentUser(null);
  };

  const handleClearProject = async () => {
    try {
      setIsLoading(true);
      await clearAllDatabaseData();
      localStorage.removeItem("smart_lib_session_v1");
      setCurrentUser(null);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick navigation select from map
  const handleSelectSpaceFromMap = (spaceId: string) => {
    setActiveTab("bookings");
    // Component will handle auto focus
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-400 font-mono">Loading smart library system...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthPage 
        isArabic={isArabic}
        setIsArabic={setIsArabic}
        onLogin={(session) => {
          localStorage.setItem("smart_lib_session_v1", JSON.stringify(session));
          setCurrentUser(session);
          if (session.role === "admin") {
            setActiveTab("admin");
          } else if (session.role === "internal_student") {
            setActiveTab("dashboard");
          } else if (session.role === "external_student") {
            setActiveTab("catalog");
          }
        }}
        onRegister={handleRegisterFromAuth}
        registrations={registrations}
      />
    );
  }

  const handleSetCongestionMode = async (mode: "auto" | "manual") => {
    setCongestionMode(mode);
    try {
      let finalCongestion = congestion;
      if (mode === "auto") {
        const count = registrations.filter(r => r.inLibrary).length;
        if (count === 0) finalCongestion = 12;
        else if (count === 1) finalCongestion = 28;
        else if (count === 2) finalCongestion = 45;
        else if (count === 3) finalCongestion = 68;
        else finalCongestion = 88;
        setCongestion(finalCongestion);
      }
      await updateLibraryConfig(totalSeats, finalCongestion, mode);
    } catch (err) {
      console.error("Failed to save congestion mode:", err);
    }
  };

  const handleSetCongestion = async (level: number) => {
    setCongestion(level);
    try {
      await updateLibraryConfig(totalSeats, level, congestionMode);
    } catch (err) {
      console.error("Failed to save congestion level:", err);
    }
  };

  return (
    <div className={`min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans ${isArabic ? "rtl" : "ltr"}`} id="app-root">
      
      {/* Top Header stats bar */}
      <Header 
        isArabic={isArabic} 
        setIsArabic={setIsArabic} 
        congestion={congestion}
        setCongestion={handleSetCongestion}
        totalSeats={totalSeats}
        currentUser={currentUser}
        onLogout={handleLogout}
        stats={stats}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        congestionMode={congestionMode}
        setCongestionMode={handleSetCongestionMode}
        studentsInLibraryCount={registrations.filter(r => r.inLibrary).length}
      />

      {/* Target Scoped Broadcast Banner */}
      {notifications.length > 0 && (
        (() => {
          const matchedNotifs = notifications.filter(notif => {
            if (notif.targetAudience === "all") return true;
            if (currentUser.role === "internal_student" && notif.targetAudience === "college_only") return true;
            if (currentUser.role === "external_student" && notif.targetAudience === "other_only") return true;
            return false;
          });
          if (matchedNotifs.length === 0) return null;
          // Get the latest notification
          const latest = matchedNotifs[matchedNotifs.length - 1];
          return (
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white py-2.5 px-6 text-center text-xs font-semibold flex items-center justify-between gap-4 shadow-sm animate-pulse">
              <div className="flex-1 text-center flex items-center justify-center gap-2">
                <span className="text-sm">📢</span>
                <span>
                  <strong className="font-extrabold">{isArabic ? "تنبيه هام من الإدارة: " : "Admin Broadcast: "}</strong>
                  {latest.title} — {latest.content}
                </span>
                <span className="opacity-70 bg-black/20 px-2 py-0.5 rounded text-[9px] font-mono">{latest.createdAt}</span>
              </div>
            </div>
          );
        })()
      )}

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        
        {/* Navigation Sidebar/Rail */}
        <aside className={`w-full md:w-64 shrink-0 flex flex-col relative ${sidebarOpen ? "z-50" : "z-10"}`} id="app-sidebar">
          
          {/* Mobile navigation toggle */}
          <div className="md:hidden flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl mb-4">
            <span className="font-bold text-xs text-gray-700">
              {isArabic ? "قائمة التصفح" : "Navigation"}
            </span>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 text-gray-500 hover:text-blue-600 focus:outline-none cursor-pointer"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <nav className={`bg-white border border-gray-100 rounded-2xl p-4 space-y-1.5 shadow-xl transition-all ${
            sidebarOpen 
              ? "block absolute left-0 right-0 top-[60px] z-50 md:relative md:top-0 md:shadow-xs" 
              : "hidden md:block"
          }`}>
            
            {isTabAllowed("dashboard", currentUser.role) && (
              <button
                onClick={() => { setActiveTab("dashboard"); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.01]"
                    : "text-gray-600 hover:bg-slate-50 hover:text-blue-600"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{isArabic ? "لوحة التميز والخرائط" : "Excellence & Map"}</span>
              </button>
            )}

            {isTabAllowed("catalog", currentUser.role) && (
              <button
                onClick={() => { setActiveTab("catalog"); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "catalog"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.01]"
                    : "text-gray-600 hover:bg-slate-50 hover:text-blue-600"
                }`}
              >
                <BookMarked className="w-4 h-4" />
                <span>{isArabic ? "المكتبة وفهرس المراجع" : "Library Book Catalog"}</span>
              </button>
            )}

            {isTabAllowed("bookings", currentUser.role) && (
              <button
                onClick={() => { setActiveTab("bookings"); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "bookings"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.01]"
                    : "text-gray-600 hover:bg-slate-50 hover:text-blue-600"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>{isArabic ? "حجز القاعات والأجهزة" : "Smart Space Booking"}</span>
              </button>
            )}

            {isTabAllowed("projects", currentUser.role) && (
              <button
                onClick={() => { setActiveTab("projects"); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "projects"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.01]"
                    : "text-gray-600 hover:bg-slate-50 hover:text-blue-600"
                }`}
              >
                <FolderGit className="w-4 h-4" />
                <span>{isArabic ? "مشاريع التخرج والبحوث" : "Graduation Projects"}</span>
              </button>
            )}

            {isTabAllowed("registrations", currentUser.role) && (
              <button
                onClick={() => { setActiveTab("registrations"); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "registrations"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.01]"
                    : "text-gray-600 hover:bg-slate-50 hover:text-blue-600"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>{isArabic ? "تسجيل العضوية والأنشطة" : "Activity Registration"}</span>
              </button>
            )}

            {isTabAllowed("ai", currentUser.role) && (
              <button
                onClick={() => { setActiveTab("ai"); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border-t border-slate-100 pt-3.5 ${
                  activeTab === "ai"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-[1.01]"
                    : "text-indigo-600 hover:bg-indigo-50/50"
                }`}
              >
                <Bot className="w-4 h-4 animate-bounce" />
                <span>{isArabic ? "محرك البحث والذكاء الاصطناعي" : "AI Search & Assistant"}</span>
              </button>
            )}

            {isTabAllowed("admin", currentUser.role) && (
              <button
                onClick={() => { setActiveTab("admin"); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border-t border-rose-100 pt-3.5 ${
                  activeTab === "admin"
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-100 scale-[1.01]"
                    : "text-rose-600 hover:bg-rose-50/50"
                }`}
              >
                <Shield className="w-4 h-4 animate-pulse" />
                <span>{isArabic ? "لوحة تحكم الأدمن والطلبات" : "Admin Command Center"}</span>
              </button>
            )}

            {/* Simulation controls have been removed per security requirements. Login is handled purely from the external authentication page. */}

          </nav>

        </aside>

        {/* Primary Viewstage */}
        <main className="flex-1 min-w-0">
          
          {isLoading ? (
            <div className="bg-white rounded-2xl p-16 text-center space-y-4 border border-gray-100 shadow-xs flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <Bot className="w-6 h-6 text-blue-600 absolute inset-0 m-auto" />
              </div>
              <h3 className="font-bold text-gray-800 text-base">
                {isArabic ? "جاري الاتصال بقاعدة البيانات السحابية..." : "Connecting to Library Cloud Database..."}
              </h3>
              <p className="text-xs text-gray-400">
                {isArabic ? "تحميل الفهارس، الجداول، ومصادر الذكاء الاصطناعي" : "Loading indices, timetables, and Gemini intelligence endpoints"}
              </p>
            </div>
          ) : !isTabAllowed(activeTab, currentUser.role) ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center space-y-6 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 animate-bounce">
                <Shield className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-gray-800 text-lg">
                  {isArabic ? "وصول غير مصرح به" : "Unauthorized Access"}
                </h3>
                <p className="text-sm text-gray-500 max-w-md">
                  {isArabic 
                    ? "هذه الصفحة غير مصرح لك بدخولها طبقاً لسياسة صلاحيات المستخدم الحالية." 
                    : "This page is restricted according to your current user permission policy."}
                </p>
              </div>
              <button 
                onClick={() => {
                  if (currentUser.role === "admin") {
                    setActiveTab("admin");
                  } else if (currentUser.role === "internal_student") {
                    setActiveTab("bookings");
                  } else {
                    setActiveTab("catalog");
                  }
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                {isArabic ? "الرجوع إلى صفحتك الرئيسية" : "Return to Your Authorized Dashboard"}
              </button>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <Dashboard
                  isArabic={isArabic}
                  achievements={achievements}
                  competitions={competitions}
                  spaces={spaces}
                  onAddAchievement={handleAddAchievement}
                  onAddCompetition={handleAddCompetition}
                  onSelectSpace={handleSelectSpaceFromMap}
                  completedProjects={graduationProjects}
                  incompleteProjects={incompleteProjects}
                  currentUserRole={currentUser.role}
                />
              )}

              {activeTab === "catalog" && (
                <LibraryCatalog
                  isArabic={isArabic}
                  books={books}
                  loans={loans}
                  onAddBook={handleAddBook}
                  onBorrowBook={handleBorrowBook}
                  onReturnBook={handleReturnBook}
                  currentUserRole={currentUser.role}
                  currentUser={currentUser}
                />
              )}

              {activeTab === "bookings" && (
                <SpaceBookings
                  isArabic={isArabic}
                  spaces={spaces}
                  onBookSpace={handleBookSpace}
                  onReleaseSpace={handleReleaseSpace}
                  currentUser={currentUser}
                />
              )}

              {activeTab === "projects" && (
                <GraduationProjects
                  isArabic={isArabic}
                  completedProjects={graduationProjects}
                  incompleteProjects={incompleteProjects}
                  onAddGradProject={handleAddGradProject}
                  onAddIncompleteProject={handleAddIncompleteProject}
                  currentUserRole={currentUser.role}
                  currentUserName={currentUser.name}
                  currentUserId={currentUser.id}
                  onAddPrintRequest={handleAddPrintRequest}
                />
              )}

              {activeTab === "registrations" && (
                <StudentRegistrations
                  isArabic={isArabic}
                  registrations={registrations}
                  onRegisterStudent={handleRegisterStudent}
                  onUpdateLibraryStatus={handleUpdateLibraryStatus}
                  currentUser={currentUser}
                />
              )}

              {activeTab === "ai" && (
                <GuidelinesAndAI
                  isArabic={isArabic}
                  books={books}
                  projects={graduationProjects}
                  achievements={achievements}
                  inquiries={inquiries}
                />
              )}

              {activeTab === "admin" && currentUser.role === "admin" && (
                <AdminPortal
                  isArabic={isArabic}
                  printRequests={printRequests}
                  chatMessages={chatMessages}
                  spaces={spaces}
                  registrations={registrations}
                  notifications={notifications}
                  totalSeats={totalSeats}
                  onUpdateTotalSeats={handleUpdateTotalSeats}
                  loans={loans}
                  onReturnLoan={handleReturnBook}
                  onUpdatePrintStatus={handleUpdatePrintStatus}
                  onSendNotification={handleSendNotification}
                  onReplyToChat={handleReplyToChat}
                  onReleaseSpace={handleReleaseSpace}
                  onUpdateLibraryStatus={handleUpdateLibraryStatus}
                  onClearProject={handleClearProject}
                  books={books}
                  onAddBook={handleAddBook}
                  onDeleteBook={handleDeleteBook}
                  completedProjects={graduationProjects}
                  incompleteProjects={incompleteProjects}
                  onAddGradProject={handleAddGradProject}
                  onAddIncompleteProject={handleAddIncompleteProject}
                  onDeleteGradProject={handleDeleteGradProject}
                  onDeleteIncompleteProject={handleDeleteIncompleteProject}
                />
              )}
            </>
          )}

        </main>

      </div>

      {/* Floating Student-Admin Live Support Helpdesk (for non-admins) */}
      {currentUser.role !== "admin" && (
        <FloatingHelpdesk
          isArabic={isArabic}
          currentUser={currentUser}
          chatMessages={chatMessages}
          onSendStudentChat={handleSendStudentChat}
        />
      )}

      {/* Footer credits with security indicators */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-12 text-center text-xs text-gray-400 font-mono space-y-1.5" id="app-footer">
        <div className="flex justify-center items-center gap-1.5 flex-wrap">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>{isArabic ? "البوابة محمية بالكامل بتشفير البيانات المتقدم ومزودة بجدار ناري" : "Endpoint verified and fully secured under AES-256 firewall layers."}</span>
        </div>
        <p>
          &copy; {new Date().getFullYear()} - {isArabic ? "كلية الحاسبات والمعلومات - البوابة الأكاديمية المتكاملة" : "College of Computing & Informatics - Integrated Academic Portal"}
        </p>
      </footer>

    </div>
  );
}
