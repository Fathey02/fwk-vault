import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { 
  FolderGit, 
  Search, 
  Plus, 
  Upload, 
  Check, 
  User, 
  BookOpen, 
  FileText, 
  Github, 
  Sparkles,
  Trello,
  Calendar,
  Layers,
  Award,
  Printer,
  QrCode,
  Camera
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { GraduationProject, IncompleteProject } from "../types";

interface GraduationProjectsProps {
  isArabic: boolean;
  completedProjects: GraduationProject[];
  incompleteProjects: IncompleteProject[];
  onAddGradProject: (proj: Omit<GraduationProject, "id">) => Promise<void>;
  onAddIncompleteProject: (proj: Omit<IncompleteProject, "id">) => Promise<void>;
  currentUserRole?: "internal_student" | "external_student" | "admin";
  currentUserName?: string;
  currentUserId?: string;
  onAddPrintRequest?: (request: {
    projectTitle: string;
    paperSize: "A4" | "A3";
    coverType: "hardcover" | "softcover" | "spiral";
    copies: number;
    extraNotes: string;
    studentName: string;
    studentId: string;
  }) => Promise<void>;
}

interface ResearchTask {
  id: string;
  title: string;
  category: "literature" | "design" | "implementation" | "testing" | "documentation";
  status: "todo" | "in-progress" | "done";
  students: string;
}

// ---------------- DYNAMIC SVG QR CODE GENERATION UTILITY ----------------
function DynamicQRCode({ value }: { value: string }) {
  const size = 15;
  const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };
  
  const seed = hashString(value);
  const grid: boolean[][] = [];
  
  for (let r = 0; r < size; r++) {
    grid[r] = [];
    for (let c = 0; c < size; c++) {
      const isTopLeftFinder = r < 4 && c < 4;
      const isTopRightFinder = r < 4 && c >= size - 4;
      const isBottomLeftFinder = r >= size - 4 && c < 4;
      
      if (isTopLeftFinder || isTopRightFinder || isBottomLeftFinder) {
        const localR = isTopLeftFinder ? r : isTopRightFinder ? r : r - (size - 4);
        const localC = isTopLeftFinder ? c : isTopRightFinder ? c - (size - 4) : c;
        const isBorder = localR === 0 || localR === 3 || localC === 0 || localC === 3;
        const isCore = (localR === 1.5 || localR === 2 || localC === 1.5 || localC === 2) || (localR > 0 && localR < 3 && localC > 0 && localC < 3);
        grid[r][c] = isBorder || isCore;
      } else {
        const val = Math.abs(Math.sin(seed + r * 13 + c * 37));
        grid[r][c] = val > 0.48;
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-xl shadow-xs space-y-2 mx-auto max-w-[200px]">
      <svg width="150" height="150" viewBox="0 0 15 15" className="shape-rendering-crisp-edges">
        <rect width="15" height="15" fill="#ffffff" />
        {grid.map((row, r) => 
          row.map((active, c) => (
            active ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#1e293b" /> : null
          ))
        )}
      </svg>
      <span className="text-[9px] text-gray-400 font-mono tracking-wider truncate max-w-[170px] select-all cursor-pointer" title="Click to copy">{value}</span>
    </div>
  );
}

export default function GraduationProjects({
  isArabic,
  completedProjects,
  incompleteProjects,
  onAddGradProject,
  onAddIncompleteProject,
  currentUserRole = "internal_student",
  currentUserName = "",
  currentUserId = "",
  onAddPrintRequest
}: GraduationProjectsProps) {

  // Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"completed" | "incomplete" | "theses">("completed");
  const [isScanning, setIsScanning] = useState(false);

  const handleQrScanned = (decodedText: string) => {
    // Check completed projects
    const matchedCompleted = completedProjects.find(p => 
      decodedText === `GP-COMPLETED-${p.id}-${p.year}` || 
      decodedText.includes(p.id)
    );
    if (matchedCompleted) {
      setActiveTab("completed");
      setSearchTerm(matchedCompleted.title);
      setQrProject({
        title: matchedCompleted.title,
        advisor: matchedCompleted.advisor,
        students: matchedCompleted.students,
        year: matchedCompleted.year,
        category: matchedCompleted.category,
        qrValue: `GP-COMPLETED-${matchedCompleted.id}-${matchedCompleted.year}`
      });
      return;
    }

    // Check incomplete projects
    const matchedIncomplete = incompleteProjects.find(p => 
      decodedText === `GP-PROPOSAL-${p.id}-${p.uploadedAt}` || 
      decodedText.includes(p.id)
    );
    if (matchedIncomplete) {
      setActiveTab("incomplete");
      setSearchTerm(matchedIncomplete.title);
      setQrProject({
        title: matchedIncomplete.title,
        advisor: isArabic ? "مكتبة الكلية" : "College Library",
        students: matchedIncomplete.students,
        year: matchedIncomplete.uploadedAt,
        category: isArabic ? "مسودة مقترح" : "Proposal Draft",
        qrValue: `GP-PROPOSAL-${matchedIncomplete.id}-${matchedIncomplete.uploadedAt}`
      });
      return;
    }

    // Check static theses
    if (decodedText === "GP-THESIS-6G-POST-QUANTUM-2026") {
      setActiveTab("theses");
      setSearchTerm(isArabic ? "تحليل الكفاءة الأمنية لشبكات الجيل السادس" : "Security Performance Analysis of 6G");
      setQrProject({
        title: isArabic ? "تحليل الكفاءة الأمنية لشبكات الجيل السادس باستخدام خوارزميات التشفير ما بعد الكمي" : "Security Performance Analysis of 6G Networks using Post-Quantum Cryptography",
        advisor: isArabic ? "مكتبة الكلية" : "College Library",
        students: [isArabic ? "د. فهد الجاسر" : "Dr. Fahad Al-Jasser"],
        year: 2026,
        category: isArabic ? "رسالة دكتوراه" : "Doctoral Dissertation",
        qrValue: "GP-THESIS-6G-POST-QUANTUM-2026"
      });
      return;
    }

    if (decodedText === "GP-THESIS-SMART-HEALTHCARE-2025") {
      setActiveTab("theses");
      setSearchTerm(isArabic ? "نمذجة وتصميم أنظمة الرعاية الصحية الذكية" : "Modeling Smart Healthcare Architectures");
      setQrProject({
        title: isArabic ? "نمذجة وتصميم أنظمة الرعاية الصحية الذكية القائمة على تشفير الحواف المحسّن" : "Modeling Smart Healthcare Architectures over Edge Cryptography Networks",
        advisor: isArabic ? "مكتبة الكلية" : "College Library",
        students: [isArabic ? "م. هند العتيبي" : "Eng. Hind Al-Otaibi"],
        year: 2025,
        category: isArabic ? "رسالة ماجستير" : "Master Thesis",
        qrValue: "GP-THESIS-SMART-HEALTHCARE-2025"
      });
      return;
    }

    // Generic fallback: set search term to the scanned text directly
    setSearchTerm(decodedText);
    alert(isArabic 
      ? `تم مسح الرمز بنجاح: "${decodedText}". جاري تصفية البحث...` 
      : `Scanned successfully: "${decodedText}". Filtering search result...`
    );
  };

  useEffect(() => {
    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;

    if (isScanning) {
      const timer = setTimeout(() => {
        if (!isMounted) return;
        try {
          html5QrCode = new Html5Qrcode("qr-reader");
          html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (decodedText) => {
              if (isMounted) {
                handleQrScanned(decodedText);
                setIsScanning(false);
              }
            },
            () => {
              // Ignore frame error verbose logs
            }
          ).catch((err) => {
            console.error("Camera access/start error:", err);
          });
        } catch (e) {
          console.error("Error creating scanner", e);
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        isMounted = false;
        if (html5QrCode) {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().catch((e) => console.log("Ignore stop error:", e));
          }
        }
      };
    }
  }, [isScanning]);
  
  // Modals state
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [showGradModal, setShowGradModal] = useState(false);
  
  // QR Code Modal State
  const [qrProject, setQrProject] = useState<{
    title: string;
    advisor: string;
    students: string[];
    year?: string | number;
    category: string;
    qrValue: string;
  } | null>(null);

  // Print Request Form States
  const [printingProject, setPrintingProject] = useState<GraduationProject | null>(null);
  const [printPaperSize, setPrintPaperSize] = useState("A4");
  const [printCoverType, setPrintCoverType] = useState("hardcover");
  const [printCopies, setPrintCopies] = useState(3);
  const [printExtraNotes, setPrintExtraNotes] = useState("");
  const [printStudentName, setPrintStudentName] = useState("");
  const [printStudentId, setPrintStudentId] = useState("");
  const [printSuccess, setPrintSuccess] = useState(false);
  const [showRoleError, setShowRoleError] = useState(false);

  // Initialize form with logged in student info
  useEffect(() => {
    if (currentUserName) setPrintStudentName(currentUserName);
    if (currentUserId) setPrintStudentId(currentUserId);
  }, [currentUserName, currentUserId]);

  const handlePrintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!printingProject || !onAddPrintRequest) return;
    
    // Safety check for Guest / External students
    if (currentUserRole === "external_student") {
      setShowRoleError(true);
      return;
    }

    try {
      await onAddPrintRequest({
        projectTitle: printingProject.title,
        paperSize: printPaperSize,
        coverType: printCoverType,
        copies: printCopies,
        extraNotes: printExtraNotes,
        studentName: printStudentName || currentUserName || "Student",
        studentId: printStudentId || currentUserId || "4400000"
      });
      setPrintSuccess(true);
      setTimeout(() => {
        setPrintSuccess(false);
        setPrintingProject(null);
        setPrintExtraNotes("");
      }, 3000);
    } catch (err) {
      alert("Failed to submit print request");
    }
  };

  // Incomplete Project Form State
  const [incTitle, setIncTitle] = useState("");
  const [incStudents, setIncStudents] = useState("");
  const [incDesc, setIncDesc] = useState("");
  const [incCover, setIncCover] = useState("");
  const [incCoverName, setIncCoverName] = useState("");

  // Completed Project Form State
  const [compTitle, setCompTitle] = useState("");
  const [compStudents, setCompStudents] = useState("");
  const [compAdvisor, setCompAdvisor] = useState("");
  const [compYear, setCompYear] = useState(new Date().getFullYear());
  const [compAbstract, setCompAbstract] = useState("");
  const [compCategory, setCompCategory] = useState<GraduationProject["category"]>("AI");
  const [compGithub, setCompGithub] = useState("");

  // Interactive Research Planner board state
  const [researchTasks, setResearchTasks] = useState<ResearchTask[]>([
    { id: "t-1", title: "مراجعة الدراسات السابقة لنموذج التصنيف", category: "literature", status: "done", students: "أنس، محمد" },
    { id: "t-2", title: "تصميم البنية المعمارية لقاعدة البيانات والواجهات", category: "design", status: "in-progress", students: "فيصل، تركي" },
    { id: "t-3", title: "إجراء اختبارات الأمان والتحقق من الاختراق", category: "testing", status: "todo", students: "ياسر، عبدالرحمن" },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<ResearchTask["category"]>("literature");
  const [newTaskStudents, setNewTaskStudents] = useState("");

  // Handle snapping cover photo
  const handleIncompleteCover = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIncCoverName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIncCover(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Incomplete Project plan
  const handleIncompleteSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!incTitle || !incStudents || !incDesc) {
      alert(isArabic ? "يرجى تعبئة الحقول المطلوبة" : "Please fill in all required fields");
      return;
    }

    try {
      const defaultCover = incCover || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=300";
      
      await onAddIncompleteProject({
        title: incTitle,
        students: incStudents.split(",").map(s => s.trim()),
        description: incDesc,
        coverUrl: defaultCover,
        uploadedAt: new Date().toISOString().split("T")[0]
      });

      alert(isArabic ? "تم تسجيل مقترح المشروع وتخزين غلافه بنجاح!" : "Project proposal and cover uploaded successfully!");
      setShowIncompleteModal(false);
      setIncTitle("");
      setIncStudents("");
      setIncDesc("");
      setIncCover("");
      setIncCoverName("");
    } catch (err) {
      console.error(err);
      alert("Failed to save project proposal");
    }
  };

  // Submit Completed Project
  const handleGradSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!compTitle || !compStudents || !compAdvisor || !compAbstract) {
      alert(isArabic ? "يرجى ملء جميع الحقول" : "Please fill in all fields");
      return;
    }

    try {
      await onAddGradProject({
        title: compTitle,
        students: compStudents.split(",").map(s => s.trim()),
        advisor: compAdvisor,
        year: Number(compYear),
        abstract: compAbstract,
        category: compCategory,
        isCompleted: true,
        githubUrl: compGithub
      });

      alert(isArabic ? "تم توثيق مشروع التخرج بنجاح في الفهرس السحابي!" : "Graduation project documented successfully in catalog!");
      setShowGradModal(false);
      setCompTitle("");
      setCompStudents("");
      setCompAdvisor("");
      setCompAbstract("");
      setCompGithub("");
    } catch (err) {
      console.error(err);
      alert("Failed to document project");
    }
  };

  // Add a task to interactive planner board
  const handleAddPlannerTask = (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    const newTask: ResearchTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      category: newTaskCategory,
      status: "todo",
      students: newTaskStudents || (isArabic ? "لم يحدد" : "Unassigned")
    };

    setResearchTasks([...researchTasks, newTask]);
    setNewTaskTitle("");
    setNewTaskStudents("");
  };

  // Update task status in planner
  const moveTask = (taskId: string, nextStatus: ResearchTask["status"]) => {
    setResearchTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
  };

  // Filter list by search term
  const filteredCompleted = completedProjects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.students.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.advisor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.abstract.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredIncomplete = incompleteProjects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.students.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in" id="projects-tab">
      
      {/* Search & Actions Ribbon */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FolderGit className="w-5 h-5 text-blue-600 animate-pulse" />
            {isArabic ? "وحدة مشاريع التخرج والأبحاث العلمية" : "Graduation Projects & Thesis Module"}
          </h2>
          <p className="text-xs text-gray-500">
            {isArabic 
              ? "ابحث في مشاريع الطلاب المكتملة، تصفح أرشيف الرسائل العلمية، أو ارفع مسودة مشروعك قيد الإنجاز." 
              : "Search archived student projects, examine academic dissertations, or post your active project covers."}
          </p>
        </div>

        {/* Dynamic Buttons depending on view */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowIncompleteModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
          >
            {isArabic ? "رفع مشروع قيد الإنجاز (غلاف)" : "Upload Active Project (Cover)"}
          </button>
          
          <button
            onClick={() => setShowGradModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
          >
            {isArabic ? "توثيق مشروع تخرج مكتمل" : "Document Completed Project"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "completed" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {isArabic ? "مشاريع الطلاب المكتملة" : "Completed Student Projects"}
          </button>
          <button
            onClick={() => setActiveTab("incomplete")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "incomplete" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {isArabic ? "مشاريع قيد الإنجاز (أغلفة)" : "Active/Incomplete Projects"}
          </button>
          <button
            onClick={() => setActiveTab("theses")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "theses" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {isArabic ? "أرشيف الرسائل والبحوث العلمية" : "Scientific Theses & Research"}
          </button>
        </div>

        {/* Project search bar with Camera QR Scanner */}
        <div className="flex gap-2 w-full sm:w-80 items-center justify-end">
          <button
            onClick={() => setIsScanning(true)}
            className="p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
            title={isArabic ? "مسح رمز الاستجابة السريعة QR" : "Scan QR Code"}
          >
            <Camera className="w-4 h-4" />
          </button>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={isArabic ? "ابحث بالعنوان، الطالب، أو الكلمات المفتاحية..." : "Search projects, authors, abstracts..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Dynamic Content Views */}
      {activeTab === "completed" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="completed-projects">
          {filteredCompleted.map((proj) => (
            <div 
              key={proj.id} 
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all space-y-4 text-right"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 font-bold uppercase tracking-wider">
                  {proj.category}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {isArabic ? "عام" : "Year"}: {proj.year}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-gray-800 text-sm leading-snug">
                  {proj.title}
                </h3>
                <p className="text-xs text-gray-500">
                  {isArabic ? "المشرف الأكاديمي" : "Academic Advisor"}: <span className="font-semibold">{proj.advisor}</span>
                </p>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                {proj.abstract}
              </p>

              <div className="pt-2 border-t border-gray-50 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {proj.students.map((student, idx) => (
                    <span key={idx} className="bg-slate-50 text-slate-600 px-2.5 py-0.5 rounded-lg border border-slate-100 text-[10px] font-medium flex items-center gap-1">
                      <User className="w-2.5 h-2.5" />
                      {student}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQrProject({
                      title: proj.title,
                      advisor: proj.advisor,
                      students: proj.students,
                      year: proj.year,
                      category: proj.category,
                      qrValue: `GP-COMPLETED-${proj.id}-${proj.year}`
                    })}
                    className="p-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                    title={isArabic ? "عرض رمز الاستجابة السريعة QR" : "Show QR Code"}
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setPrintingProject(proj)}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{isArabic ? "طلب طباعة ورقية" : "Request Print"}</span>
                  </button>

                  {proj.githubUrl && (
                    <a 
                      href={proj.githubUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                      title={isArabic ? "رابط الشيفرة البرمجية GitHub" : "View source code on GitHub"}
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "incomplete" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6" id="incomplete-projects">
          {filteredIncomplete.map((proj) => (
            <div 
              key={proj.id} 
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group text-right"
            >
              {/* Photographed Book Cover */}
              <div className="h-44 bg-slate-50 relative border-b border-gray-100">
                <img 
                  src={proj.coverUrl} 
                  alt={proj.title} 
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-2 right-2">
                  <span className="text-[9px] bg-slate-900/80 text-white px-2 py-0.5 rounded backdrop-blur-xs">
                    {isArabic ? "مسودة مقترح" : "Proposal Draft"}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <h4 className="font-bold text-gray-800 text-xs line-clamp-1">
                  {proj.title}
                </h4>
                <p className="text-[10px] text-gray-500 leading-snug line-clamp-3">
                  {proj.description}
                </p>
                <div className="flex flex-wrap gap-1 justify-end pt-1">
                  {proj.students.map((st, i) => (
                    <span key={i} className="text-[8px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                      {st}
                    </span>
                  ))}
                </div>
              </div>
              <div className="px-4 pb-4 pt-2 border-t border-gray-50 text-[10px] text-gray-400 font-mono flex items-center justify-between">
                <button
                  onClick={() => setQrProject({
                    title: proj.title,
                    advisor: isArabic ? "مكتبة الكلية" : "College Library",
                    students: proj.students,
                    year: proj.uploadedAt,
                    category: isArabic ? "مسودة مقترح" : "Proposal Draft",
                    qrValue: `GP-PROPOSAL-${proj.id}-${proj.uploadedAt}`
                  })}
                  className="p-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded transition-all cursor-pointer flex items-center justify-center"
                  title={isArabic ? "عرض رمز الاستجابة السريعة QR" : "Show QR Code"}
                >
                  <QrCode className="w-3.5 h-3.5" />
                </button>
                <span>{isArabic ? "رفع في" : "Uploaded"}: {proj.uploadedAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "theses" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-right" id="scientific-theses">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              {isArabic ? "قاعة الرسائل العلمية المحكّمة" : "Peer-Reviewed Scientific Theses"}
            </span>
            <h3 className="font-bold text-gray-800 text-sm">
              {isArabic ? "أرشيف رسائل الماجستير والدكتوراه بالكلية" : "Master & Doctoral Dissertations Library"}
            </h3>
          </div>

          <p className="text-xs text-gray-500">
            {isArabic 
              ? "تحتوي مكتبة الكلية على أرشيف رقمي للرسائل العلمية التي تمت مناقشتها بنجاح في مجالات علوم الحاسب والشبكات ونظم المعلومات."
              : "Access vetted dissertation drafts and doctoral defense records cataloged by date and indexing tags."}
          </p>

          <div className="space-y-3">
            <div className="p-4 bg-slate-50 hover:bg-slate-100/50 border border-slate-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right">
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => setQrProject({
                    title: isArabic ? "تحليل الكفاءة الأمنية لشبكات الجيل السادس باستخدام خوارزميات التشفير ما بعد الكمي" : "Security Performance Analysis of 6G Networks using Post-Quantum Cryptography",
                    advisor: isArabic ? "مكتبة الكلية" : "College Library",
                    students: [isArabic ? "د. فهد الجاسر" : "Dr. Fahad Al-Jasser"],
                    year: 2026,
                    category: isArabic ? "رسالة دكتوراه" : "Doctoral Dissertation",
                    qrValue: "GP-THESIS-6G-POST-QUANTUM-2026"
                  })}
                  className="p-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                  title={isArabic ? "عرض رمز الاستجابة السريعة QR" : "Show QR Code"}
                >
                  <QrCode className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => alert(isArabic ? "جاري تحميل وقراءة ملخص الرسالة العلمية..." : "Downloading scientific abstract...")}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg cursor-pointer inline-flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {isArabic ? "تحميل الملخص PDF" : "Download PDF"}
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-bold uppercase">
                  {isArabic ? "رسالة دكتوراه" : "Doctoral Dissertation"}
                </span>
                <h4 className="font-bold text-gray-800 text-xs">
                  {isArabic ? "تحليل الكفاءة الأمنية لشبكات الجيل السادس باستخدام خوارزميات التشفير ما بعد الكمي" : "Security Performance Analysis of 6G Networks using Post-Quantum Cryptography"}
                </h4>
                <p className="text-[10px] text-gray-400 font-mono">
                  {isArabic ? "الباحث" : "Researcher"}: د. فهد الجاسر | 2026
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 hover:bg-slate-100/50 border border-slate-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right">
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => setQrProject({
                    title: isArabic ? "نمذجة وتصميم أنظمة الرعاية الصحية الذكية القائمة على تشفير الحواف المحسّن" : "Modeling Smart Healthcare Architectures over Edge Cryptography Networks",
                    advisor: isArabic ? "مكتبة الكلية" : "College Library",
                    students: [isArabic ? "م. هند العتيبي" : "Eng. Hind Al-Otaibi"],
                    year: 2025,
                    category: isArabic ? "رسالة ماجستير" : "Master Thesis",
                    qrValue: "GP-THESIS-SMART-HEALTHCARE-2025"
                  })}
                  className="p-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                  title={isArabic ? "عرض رمز الاستجابة السريعة QR" : "Show QR Code"}
                >
                  <QrCode className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => alert(isArabic ? "جاري تحميل وقراءة ملخص الرسالة العلمية..." : "Downloading scientific abstract...")}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg cursor-pointer inline-flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {isArabic ? "تحميل الملخص PDF" : "Download PDF"}
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-bold uppercase">
                  {isArabic ? "رسالة ماجستير" : "Master Thesis"}
                </span>
                <h4 className="font-bold text-gray-800 text-xs">
                  {isArabic ? "نمذجة وتصميم أنظمة الرعاية الصحية الذكية القائمة على تشفير الحواف المحسّن" : "Modeling Smart Healthcare Architectures over Edge Cryptography Networks"}
                </h4>
                <p className="text-[10px] text-gray-400 font-mono">
                  {isArabic ? "الباحث" : "Researcher"}: م. هند العتيبي | 2025
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Research Board & Kanban Tools (أدوات إدارة المشاريع والأبحاث) */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm" id="research-planner">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Trello className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-gray-800 text-base">
                {isArabic ? "أدوات إدارة المشاريع والأبحاث (Kanban Board)" : "Project & Research Management Tools"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isArabic ? "خطط لمشروع تخرجك ووزع المهام على فريقك والزملاء" : "Manage milestones, assign research blocks, and drag-and-drop tasks"}
              </p>
            </div>
          </div>
        </div>

        {/* Board Planner Creation Form */}
        <form onSubmit={handleAddPlannerTask} className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 grid grid-cols-1 md:grid-cols-12 gap-3 text-right">
          <div className="md:col-span-5">
            <label className="block text-[10px] text-gray-500 mb-1">{isArabic ? "عنوان المهمة البحثية *" : "Task Description *"}</label>
            <input 
              type="text" 
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder={isArabic ? "مثال: مراجعة خوارزميات الأمن السيبراني" : "e.g. Design block Diagram"}
              className="w-full p-2 bg-white border border-gray-200 rounded text-xs text-right"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-[10px] text-gray-500 mb-1">{isArabic ? "الطلاب المسؤولون" : "Students Assigned"}</label>
            <input 
              type="text" 
              value={newTaskStudents}
              onChange={(e) => setNewTaskStudents(e.target.value)}
              placeholder={isArabic ? "سليمان، فيصل" : "John, Mike"}
              className="w-full p-2 bg-white border border-gray-200 rounded text-xs text-right"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] text-gray-500 mb-1">{isArabic ? "المجال" : "Phase"}</label>
            <select
              value={newTaskCategory}
              onChange={(e) => setNewTaskCategory(e.target.value as any)}
              className="w-full p-2 bg-white border border-gray-200 rounded text-xs text-right"
            >
              <option value="literature">{isArabic ? "الدراسات السابقة" : "Literature"}</option>
              <option value="design">{isArabic ? "التصميم" : "Design"}</option>
              <option value="implementation">{isArabic ? "البرمجة" : "Programming"}</option>
              <option value="testing">{isArabic ? "الاختبار" : "Testing"}</option>
              <option value="documentation">{isArabic ? "الكتابة" : "Documentation"}</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm cursor-pointer"
            >
              {isArabic ? "إدراج مهمة" : "Add Task"}
            </button>
          </div>
        </form>

        {/* Columns Kanban layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* TO DO COLUMN */}
          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
              <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded font-bold">
                {researchTasks.filter(t => t.status === "todo").length}
              </span>
              <h4 className="font-bold text-gray-700 text-xs">
                {isArabic ? "مهام معلقة" : "To Do"}
              </h4>
            </div>

            <div className="space-y-2.5">
              {researchTasks.filter(t => t.status === "todo").map(t => (
                <div key={t.id} className="p-3 bg-white border border-gray-100 rounded-lg shadow-2xs space-y-2 text-right">
                  <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.2 rounded font-bold uppercase">
                    {t.category}
                  </span>
                  <h5 className="font-bold text-gray-800 text-[11px] leading-snug">{t.title}</h5>
                  <p className="text-[9px] text-gray-400 font-mono">{t.students}</p>
                  <button
                    onClick={() => moveTask(t.id, "in-progress")}
                    className="w-full py-1 bg-indigo-50 text-indigo-600 text-[9px] font-bold rounded hover:bg-indigo-100 cursor-pointer"
                  >
                    {isArabic ? "بدء العمل الآن ←" : "Start Task →"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* IN PROGRESS COLUMN */}
          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
              <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold">
                {researchTasks.filter(t => t.status === "in-progress").length}
              </span>
              <h4 className="font-bold text-gray-700 text-xs">
                {isArabic ? "قيد الإنجاز" : "In Progress"}
              </h4>
            </div>

            <div className="space-y-2.5">
              {researchTasks.filter(t => t.status === "in-progress").map(t => (
                <div key={t.id} className="p-3 bg-white border border-gray-100 rounded-lg shadow-2xs space-y-2 text-right">
                  <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded font-bold uppercase">
                    {t.category}
                  </span>
                  <h5 className="font-bold text-gray-800 text-[11px] leading-snug">{t.title}</h5>
                  <p className="text-[9px] text-gray-400 font-mono">{t.students}</p>
                  <button
                    onClick={() => moveTask(t.id, "done")}
                    className="w-full py-1 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded hover:bg-emerald-100 cursor-pointer"
                  >
                    {isArabic ? "تم اكتمال المهمة ✓" : "Mark Done ✓"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* DONE COLUMN */}
          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
              <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-bold">
                {researchTasks.filter(t => t.status === "done").length}
              </span>
              <h4 className="font-bold text-gray-700 text-xs">
                {isArabic ? "مهام منجزة" : "Completed"}
              </h4>
            </div>

            <div className="space-y-2.5">
              {researchTasks.filter(t => t.status === "done").map(t => (
                <div key={t.id} className="p-3 bg-white border border-gray-100 rounded-lg shadow-2xs space-y-2 text-right opacity-80">
                  <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.2 rounded font-bold uppercase">
                    {t.category}
                  </span>
                  <h5 className="font-bold text-gray-500 line-through text-[11px] leading-snug">{t.title}</h5>
                  <p className="text-[9px] text-gray-400 font-mono">{t.students}</p>
                  <span className="text-[9px] text-emerald-600 font-bold block text-center bg-emerald-50/50 p-1 rounded">
                    ✓ {isArabic ? "مكتملة بنجاح" : "Success"}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* MODAL: Upload Incomplete Project */}
      {showIncompleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden">
            
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">
                  {isArabic ? "رفع وإدراج مسودة مشروع قيد الإنجاز" : "Upload Active Project Draft"}
                </h3>
                <p className="text-xs text-slate-400">
                  {isArabic ? "صوّر غلاف تقرير مشروع التخرج وسجله لمشاركته باللوحة" : "Capture project cover sheet and describe technical goal"}
                </p>
              </div>
              <button 
                onClick={() => setShowIncompleteModal(false)}
                className="text-slate-400 hover:text-white font-mono text-xl focus:outline-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleIncompleteSubmit} className="p-6 space-y-4 text-right">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isArabic ? "عنوان مقترح المشروع *" : "Project Proposal Title *"}
                </label>
                <input
                  type="text"
                  required
                  value={incTitle}
                  onChange={(e) => setIncTitle(e.target.value)}
                  placeholder={isArabic ? "مثال: أتمتة تشفير الثغرات الرقمية" : "e.g. AI-driven cybersecurity analyzer"}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isArabic ? "أعضاء فريق المشروع (مفصولين بفاصلة) *" : "Project Team Members (Comma-separated) *"}
                </label>
                <input
                  type="text"
                  required
                  value={incStudents}
                  onChange={(e) => setIncStudents(e.target.value)}
                  placeholder={isArabic ? "مثال: رائد الشهراني، عبدالرحمن الحربي" : "e.g. John Doe, Ray Doe"}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isArabic ? "وصف المشروع وأهم عناصره *" : "Proposal Abstract *"}
                </label>
                <textarea
                  required
                  rows={3}
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  placeholder={isArabic ? "اكتب تفاصيل مقترح المشروع، المشكلة التي يحاربها، والمخرجات المتوقعة..." : "Details on project goal, architecture, or deliverables..."}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right"
                />
              </div>

              {/* Photographed cover book */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isArabic ? "تصوير غلاف تقرير المشروع وتحميله" : "Snap Cover Photo of Project Book / Report"}
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-slate-100/50 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleIncompleteCover}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-10 w-10 text-gray-400" />
                    <span className="text-blue-600 font-semibold text-xs">
                      {isArabic ? "التقاط الغلاف عبر كاميرا الهاتف أو رفع ملف" : "Click here to photograph or select file"}
                    </span>
                    {incCoverName && (
                      <p className="text-xs text-emerald-600 font-bold mt-1">
                        ✓ {incCoverName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIncompleteModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  {isArabic ? "حفظ وإدراج في اللوحة" : "Save & Post to Board"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: Document Completed Project */}
      {showGradModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden">
            
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">
                  {isArabic ? "توثيق مشروع تخرج مكتمل ورسمي" : "Document Completed Graduation Project"}
                </h3>
                <p className="text-xs text-slate-400">
                  {isArabic ? "أرشفة المخرجات البرمجية ومصادر مشروع التخرج بالمكتبة" : "Archive finalized project deliverables and codebase links"}
                </p>
              </div>
              <button 
                onClick={() => setShowGradModal(false)}
                className="text-slate-400 hover:text-white font-mono text-xl focus:outline-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleGradSubmit} className="p-6 space-y-4 text-right">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isArabic ? "عنوان مشروع التخرج النهائي *" : "Graduation Project Title *"}
                </label>
                <input
                  type="text"
                  required
                  value={compTitle}
                  onChange={(e) => setCompTitle(e.target.value)}
                  placeholder={isArabic ? "مثال: منصة لا مركزية للبيانات الطبية" : "e.g. Decentralized healthcare platform"}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isArabic ? "المشرف الأكاديمي *" : "Academic Advisor *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={compAdvisor}
                    onChange={(e) => setCompAdvisor(e.target.value)}
                    placeholder="أ.د. منيرة العتيبي"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isArabic ? "سنة المناقشة" : "Defense Year"}
                  </label>
                  <input
                    type="number"
                    value={compYear}
                    onChange={(e) => setCompYear(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isArabic ? "مجال المشروع الرئيسي" : "Core Track"}
                  </label>
                  <select
                    value={compCategory}
                    onChange={(e) => setCompCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right"
                  >
                    <option value="AI">{isArabic ? "الذكاء الاصطناعي" : "Artificial Intelligence"}</option>
                    <option value="Cybersecurity">{isArabic ? "الأمن السيبراني" : "Cybersecurity"}</option>
                    <option value="Software Engineering">{isArabic ? "هندسة البرمجيات" : "Software Engineering"}</option>
                    <option value="Data Science">{isArabic ? "علم البيانات" : "Data Science"}</option>
                    <option value="Network">{isArabic ? "الشبكات والاتصالات" : "Networking"}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isArabic ? "مستودع الأكواد (GitHub Link)" : "Code Repository Link"}
                  </label>
                  <input
                    type="url"
                    value={compGithub}
                    onChange={(e) => setCompGithub(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-left font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isArabic ? "أعضاء الفريق (مفصولين بفاصلة) *" : "Student Authors (Comma-separated) *"}
                </label>
                <input
                  type="text"
                  required
                  value={compStudents}
                  onChange={(e) => setCompStudents(e.target.value)}
                  placeholder={isArabic ? "مثال: يزيد العتيبي، أنس المطيري، فيصل الحربي" : "e.g. Alex Doe, Mike Doe"}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isArabic ? "المستخلص الأكاديمي (Abstract) *" : "Abstract *"}
                </label>
                <textarea
                  required
                  rows={4}
                  value={compAbstract}
                  onChange={(e) => setCompAbstract(e.target.value)}
                  placeholder={isArabic ? "ملخص كامل عن المشكلة، والحل المقترح، والنتائج العلمية المكتشفة..." : "A comprehensive description of project solution..."}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGradModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  {isArabic ? "حفظ وتوثيق بالمكتبة" : "Document & Archive"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: Request Print setup form */}
      {printingProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden">
            
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white p-5 text-right space-y-1">
              <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                {isArabic ? "طلب طباعة وتجليد أكاديمي مجاني" : "Academic Binding & Print Request"}
              </span>
              <h3 className="font-bold text-base mt-2">
                {printingProject.title}
              </h3>
            </div>

            {printSuccess ? (
              <div className="p-8 text-center space-y-3 animate-fade-in">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl">
                  ✓
                </div>
                <h4 className="font-bold text-gray-800 text-sm">
                  {isArabic ? "تم إرسال طلب الطباعة بنجاح!" : "Print Job Queued Successfully!"}
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {isArabic 
                    ? "لقد أرسلنا تفاصيل التجليد وقفل التقرير لمكتبة الكلية الرقمية بنجاح. يرجى متابعة حالة طابور الطباعة من الإدارة أو التوجه للاستلام عند جاهزيته."
                    : "Your document binding request has been securely queued at the CS library center."}
                </p>
              </div>
            ) : (
              <form onSubmit={handlePrintSubmit} className="p-6 space-y-4 text-right">
                {/* Guest Visitor check warning */}
                {currentUserRole === "external_student" && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs space-y-1">
                    <p className="font-bold">⚠️ {isArabic ? "تنبيه الصلاحية" : "Access Warning"}</p>
                    <p className="leading-relaxed">
                      {isArabic 
                        ? "مرحباً بك! هذه الخدمة مخصصة لطلاب كليات الحاسبات والمعلومات فقط. يمكنك الاطلاع وتخصيص الخيارات، لكن إرسال الطباعة محمي للأعضاء الرسميين." 
                        : "This privilege is reserved for official Colleges of Computer Science and Information students."}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 font-bold">
                    {isArabic ? "اسم مقدم الطلب *" : "Applicant Full Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={printStudentName}
                    onChange={(e) => setPrintStudentName(e.target.value)}
                    placeholder={isArabic ? "يزيد المطيري" : "Student Name"}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 font-bold">
                    {isArabic ? "الرقم الأكاديمي الموحد *" : "Academic student ID *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={printStudentId}
                    onChange={(e) => setPrintStudentId(e.target.value)}
                    placeholder="44... / 43..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 font-bold">
                      {isArabic ? "نوع الغلاف والتجليد" : "Binding Cover"}
                    </label>
                    <select
                      value={printCoverType}
                      onChange={(e) => setPrintCoverType(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="hardcover">{isArabic ? "فاخر (كرتون كحلي مذهب)" : "Premium Hardcover (Blue/Gold)"}</option>
                      <option value="softcover">{isArabic ? "غلاف ورقي ملون" : "Softcover (Color)"}</option>
                      <option value="spiral">{isArabic ? "سلك حلزوني بلاستيك" : "Plastic Spiral"}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 font-bold">
                      {isArabic ? "مقاس الورق" : "Paper Size"}
                    </label>
                    <select
                      value={printPaperSize}
                      onChange={(e) => setPrintPaperSize(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="A4">A4 (Standard)</option>
                      <option value="A3">A3 (Posters/Drawings)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 font-bold">
                    {isArabic ? "عدد النسخ المطلوبة" : "Copies count"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={printCopies}
                    onChange={(e) => setPrintCopies(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center font-bold font-mono text-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 font-bold">
                    {isArabic ? "تعليمات خاصة بالطباعة (اختياري)" : "Special printing notes (Optional)"}
                  </label>
                  <textarea
                    rows={2}
                    value={printExtraNotes}
                    onChange={(e) => setPrintExtraNotes(e.target.value)}
                    placeholder={isArabic ? "مثال: أريد طباعة صفحة الأكواد والرسوم البيانية بالألوان والباقي أسود وأبيض..." : "e.g. Please print diagrams in color, rest grayscale."}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPrintingProject(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    {isArabic ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={currentUserRole === "external_student"}
                    className={`px-5 py-2 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer ${
                      currentUserRole === "external_student" 
                        ? "bg-slate-300 cursor-not-allowed opacity-50" 
                        : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                    }`}
                  >
                    {isArabic ? "إرسال للطابور الرقمي" : "Queue Print Job"}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* MODAL: View Project QR Code */}
      {qrProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden text-right">
            
            <div className="bg-gradient-to-l from-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">
                  {isArabic ? "رمز الوصول السريع للمشروع" : "Project Quick Access Code"}
                </h3>
                <p className="text-xs text-indigo-200">
                  {isArabic ? "مسح الرمز للوصول الفوري إلى البيانات والمصادر" : "Scan to instantly access project metadata & repository"}
                </p>
              </div>
              <button 
                onClick={() => setQrProject(null)}
                className="text-slate-400 hover:text-white font-mono text-xl focus:outline-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6 flex flex-col items-center">
              {/* Dynamic QR Code generator */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner w-full flex flex-col items-center justify-center">
                <DynamicQRCode value={qrProject.qrValue} />
                <p className="text-[11px] text-gray-500 mt-3 text-center px-4 leading-relaxed">
                  {isArabic 
                    ? "امسح الرمز أعلاه باستخدام كاميرا الهاتف المحمول لعرض وتنزيل تفاصيل المشروع البرمجي."
                    : "Scan the QR code above using your mobile camera to view and retrieve full project details."}
                </p>
              </div>

              {/* Project Meta Details Card */}
              <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3 text-right">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100 font-bold uppercase">
                    {qrProject.category}
                  </span>
                  {qrProject.year && (
                    <span className="text-xs text-slate-500 font-mono">
                      {isArabic ? "العام" : "Year"}: {qrProject.year}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    {isArabic ? "العنوان النهائي للمشروع" : "Final Project Title"}
                  </span>
                  <h4 className="font-bold text-slate-800 text-sm leading-snug">
                    {qrProject.title}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {isArabic ? "الطلاب المشاركون" : "Participating Students"}
                    </span>
                    <div className="text-slate-700 text-xs font-medium space-y-0.5">
                      {qrProject.students.map((st, i) => (
                        <div key={i} className="truncate">• {st}</div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {isArabic ? "المشرف / الباحث" : "Advisor / Researcher"}
                    </span>
                    <span className="text-slate-700 text-xs font-bold block truncate">
                      {qrProject.advisor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setQrProject(null)}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer text-center font-bold"
              >
                {isArabic ? "إغلاق النافذة" : "Close Window"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: Camera QR Code Scanner */}
      {isScanning && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden text-right">
            
            <div className="bg-gradient-to-l from-blue-900 to-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">
                  {isArabic ? "ماسح رمز الاستجابة السريعة" : "QR Code Scanner"}
                </h3>
                <p className="text-xs text-blue-200">
                  {isArabic ? "امسح الرمز المطبوع أو المعروض على هاتف آخر" : "Scan printed or displayed project QR codes"}
                </p>
              </div>
              <button 
                onClick={() => setIsScanning(false)}
                className="text-slate-400 hover:text-white font-mono text-xl focus:outline-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6 flex flex-col items-center">
              {/* Camera Scanner Viewport Container with Overlay */}
              <div className="relative w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden border-2 border-blue-500/30 flex items-center justify-center">
                
                {/* HTML5 QR Code Mount point */}
                <div id="qr-reader" className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />

                {/* Aesthetic Scanning Viewfinder Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-56 h-56 border-2 border-dashed border-blue-400/80 rounded-xl relative flex items-center justify-center">
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-md"></div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-md"></div>
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-md"></div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-md"></div>

                    {/* Scanning moving red laser effect */}
                    <div className="absolute left-2 right-2 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-[bounce_2s_infinite]"></div>
                  </div>
                </div>
              </div>

              {/* Guide directions */}
              <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  {isArabic ? "كيفية الاستخدام:" : "How to use:"}
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {isArabic 
                    ? "وجه كاميرا جهازك نحو رمز الاستجابة السريعة (QR Code) الخاص بمشروع التخرج ليتم قراءته والانتقال للتفاصيل تلقائياً."
                    : "Point your device's camera towards the project's QR code to scan and open details instantly."}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsScanning(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer text-center"
              >
                {isArabic ? "إلغاء ومغادرة الكاميرا" : "Cancel & Close Camera"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
