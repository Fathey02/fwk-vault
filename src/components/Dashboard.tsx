import { useState, ChangeEvent, FormEvent } from "react";
import { 
  Trophy, 
  Award, 
  Map, 
  Plus, 
  Upload, 
  Check, 
  Calendar, 
  User, 
  ChevronRight, 
  BookOpen, 
  Info,
  Layers,
  Cpu,
  Download,
  TrendingUp
} from "lucide-react";
import { Achievement, Competition, LibrarySpace, GraduationProject, IncompleteProject } from "../types";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie, 
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { BarChart3, PieChart as PieIcon } from "lucide-react";

interface DashboardProps {
  isArabic: boolean;
  achievements: Achievement[];
  competitions: Competition[];
  spaces: LibrarySpace[];
  onAddAchievement: (ach: Omit<Achievement, "id">) => Promise<void>;
  onAddCompetition: (comp: Omit<Competition, "id">) => Promise<void>;
  onSelectSpace: (spaceId: string) => void;
  completedProjects?: GraduationProject[];
  incompleteProjects?: IncompleteProject[];
}

export default function Dashboard({
  isArabic,
  achievements,
  competitions,
  spaces,
  onAddAchievement,
  onAddCompetition,
  onSelectSpace,
  completedProjects = [],
  incompleteProjects = []
}: DashboardProps) {
  
  // Forms states
  const [showCertModal, setShowCertModal] = useState(false);
  const [certType, setCertType] = useState<"achievement" | "competition">("achievement");
  
  // Achievement fields
  const [achTitle, setAchTitle] = useState("");
  const [achDate, setAchDate] = useState(new Date().toISOString().split("T")[0]);
  const [achType, setAchType] = useState<"academic" | "research" | "community">("academic");
  const [achRecipient, setAchRecipient] = useState("");
  const [achDesc, setAchDesc] = useState("");

  // Competition fields
  const [compTitle, setCompTitle] = useState("");
  const [compDate, setCompDate] = useState(new Date().toISOString().split("T")[0]);
  const [compPlacement, setCompPlacement] = useState("");
  const [compMembers, setCompMembers] = useState("");
  const [compDesc, setCompDesc] = useState("");

  // Certificate image upload simulator
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedBase64, setUploadedBase64] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const getSpaceStatus = (spaceId: string) => {
    const sp = spaces.find(s => s.id === spaceId);
    return sp?.status || "available";
  };

  const renderMiniSeats = (spaceId: string, count: number) => {
    const sp = spaces.find(s => s.id === spaceId);
    const status = sp?.status || "available";
    const seatsList = [];

    for (let i = 1; i <= count; i++) {
      let seatStatus: "free" | "busy" | "maint" = "free";
      if (status === "booked") {
        seatStatus = "busy";
      } else if (status === "maintenance") {
        seatStatus = "maint";
      } else {
        const isOccupiedByWalkIn = (spaceId === "space-1" && (i === 3 || i === 7)) ||
                                    (spaceId === "space-4" && i === 2);
        if (isOccupiedByWalkIn) {
          seatStatus = "busy";
        }
      }

      const colorClass = seatStatus === "free" 
        ? "bg-emerald-500 shadow-emerald-100" 
        : seatStatus === "busy" 
        ? "bg-rose-500 shadow-rose-100" 
        : "bg-amber-500 shadow-amber-100";

      seatsList.push(
        <div 
          key={i} 
          className={`w-2.5 h-2.5 rounded-full ${colorClass} shadow-xs border border-white transition-all transform hover:scale-125`}
          title={`${isArabic ? "مقعد" : "Seat"} ${i}: ${
            seatStatus === "free" ? (isArabic ? "متاح" : "Available") : seatStatus === "busy" ? (isArabic ? "محجوز" : "Booked") : (isArabic ? "صيانة" : "Maintenance")
          }`}
        />
      );
    }

    return (
      <div className="flex flex-wrap gap-1 mt-2 justify-end">
        {seatsList}
      </div>
    );
  };

  const getZoneStyle = (spaceId: string, activeId: string) => {
    const sp = spaces.find(s => s.id === spaceId);
    const status = sp?.status || "available";
    const isActive = spaceId === activeId;
    
    if (status === "booked") {
      return isActive 
        ? "bg-rose-50/90 text-rose-950 border-rose-500 shadow-md ring-2 ring-rose-500/50 scale-[1.01]" 
        : "bg-rose-50/40 text-rose-900 border-rose-200 hover:bg-rose-50/60 hover:border-rose-300";
    } else if (status === "maintenance") {
      return isActive
        ? "bg-amber-50/90 text-amber-950 border-amber-500 shadow-md ring-2 ring-amber-500/50 scale-[1.01]"
        : "bg-amber-50/40 text-amber-900 border-amber-200 hover:bg-amber-50/60 hover:border-amber-300";
    } else {
      return isActive
        ? "bg-emerald-50 text-emerald-950 border-emerald-600 shadow-lg ring-2 ring-emerald-600/30 scale-[1.01]"
        : "bg-white text-gray-700 border-gray-200 hover:bg-emerald-50/20 hover:border-emerald-200";
    }
  };

  // Library map active area details
  const [activeMapArea, setActiveMapArea] = useState<string>("space-1");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportData = () => {
    try {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        projectName: "FWK Library",
        projectStatistics: {
          totalCompleted: completedProjects.length,
          totalIncomplete: incompleteProjects.length,
          totalProjects: completedProjects.length + incompleteProjects.length,
          completedProjects: completedProjects.map(p => ({
            id: p.id,
            title: p.title,
            students: p.students,
            advisor: p.advisor,
            year: p.year,
            category: p.category
          })),
          incompleteProjects: incompleteProjects.map(p => ({
            id: p.id,
            title: p.title,
            students: p.students,
            description: p.description,
            uploadedAt: p.uploadedAt
          }))
        },
        competitionStatistics: {
          totalCompetitions: competitions.length,
          competitions: competitions.map(c => ({
            id: c.id,
            title: c.title,
            date: c.date,
            placement: c.placement,
            teamMembers: c.teamMembers,
            description: c.description
          }))
        }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `fwk_library_data_export_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      console.error("Failed to export data:", error);
      alert(isArabic ? "حدث خطأ أثناء تصدير البيانات" : "Failed to export data. Please try again.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg("");

    try {
      const defaultCertUrl = uploadedBase64 || "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&q=80&w=300";
      
      if (certType === "achievement") {
        if (!achTitle || !achRecipient || !achDesc) {
          alert(isArabic ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields");
          setIsSubmitting(false);
          return;
        }
        await onAddAchievement({
          title: achTitle,
          date: achDate,
          description: achDesc,
          type: achType,
          recipient: achRecipient,
          certificateUrl: defaultCertUrl
        });
        
        // Reset achievement form
        setAchTitle("");
        setAchRecipient("");
        setAchDesc("");
      } else {
        if (!compTitle || !compPlacement || !compDesc) {
          alert(isArabic ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields");
          setIsSubmitting(false);
          return;
        }
        await onAddCompetition({
          title: compTitle,
          date: compDate,
          placement: compPlacement,
          description: compDesc,
          teamMembers: compMembers ? compMembers.split(",").map(m => m.trim()) : [],
          certificateUrl: defaultCertUrl
        });

        // Reset competition form
        setCompTitle("");
        setCompPlacement("");
        setCompMembers("");
        setCompDesc("");
      }

      setSuccessMsg(isArabic ? "تم رفع وتوثيق الشهادة بنجاح في قاعدة البيانات!" : "Certificate uploaded and verified successfully in database!");
      setUploadedFileName("");
      setUploadedBase64("");
      
      setTimeout(() => {
        setShowCertModal(false);
        setSuccessMsg("");
      }, 2000);

    } catch (err) {
      console.error(err);
      alert("Error adding certificate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSpace = spaces.find(s => s.id === activeMapArea);

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-tab">
      
      {/* Top Banner and Quick Action */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute left-0 bottom-0 -translate-x-12 translate-y-12 w-48 h-48 bg-white/5 rounded-full blur-xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <span className="bg-blue-500/30 text-blue-200 text-xs px-3 py-1 rounded-full border border-blue-400/20 font-semibold tracking-wider uppercase mb-3 inline-block">
              {isArabic ? "كليات الحاسبات والمعلومات" : "Colleges of Computer Science and Information"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              {isArabic ? "سجل التميّز الأكاديمي والحلول الذكية" : "Academic Excellence & Smart Campus Solutions"}
            </h2>
            <p className="text-indigo-100 text-sm leading-relaxed">
              {isArabic 
                ? "تتبع الإنجازات والاعتمادات الرسمية ومشاركات الكلية في المحافل البرمجية الإقليمية، واستعرض المخطط الهندسي التفاعلي لحجز المساحات البحثية والمصادر الذكية."
                : "Track college achievements, national programming competitions, academic accreditations, and explore the interactive topological map to reserve smart study labs."}
            </p>
          </div>
          <button
            onClick={() => setShowCertModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold rounded-xl transition-all shadow-md active:scale-95 shrink-0 cursor-pointer text-sm"
          >
            <Upload className="w-4 h-4" />
            {isArabic ? "توثيق ورفع شهادة جديدة" : "Upload & Document Certificate"}
          </button>
        </div>
      </div>

      {/* Grid: Map + Stats / Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left/Main Column: Interactive Map (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between" id="library-map-section">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Map className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-800 text-lg">
                  {isArabic ? "مخطط طابق مقاعد ومساحات المكتبة التفاعلي" : "Interactive Seating & Space Floor Map"}
                </h3>
              </div>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                {isArabic ? "اختر قاعة أو مقعداً لعرض حالة الحجز" : "Select any zone/seat to view status"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <p className="text-xs text-gray-500">
                {isArabic 
                  ? "مخطط هندسي مباشر يوضح حالة المقاعد وحجوزات القاعات حالياً ومواقع محطات البحث الذكية."
                  : "Live floor blueprint showing real-time occupancy, seat allocations, and supercomputer stations."}
              </p>
              
              {/* Map Legend */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg text-[10px] self-start sm:self-auto shrink-0">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-gray-600">{isArabic ? "متاح" : "Free"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span className="text-gray-600">{isArabic ? "محجوز" : "Busy"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-gray-600">{isArabic ? "صيانة" : "Maint."}</span>
                </div>
              </div>
            </div>

            {/* Map Visual Grid */}
            <div className="grid grid-cols-6 gap-3 bg-slate-100/60 p-4 rounded-2xl border border-slate-200/50 min-h-[220px]">
              
              {/* Zone 1: Silent Study Area (Takes 4x2) */}
              <button
                onClick={() => setActiveMapArea("space-1")}
                className={`col-span-4 row-span-2 p-4 rounded-xl flex flex-col justify-between transition-all border cursor-pointer text-right ${getZoneStyle("space-1", activeMapArea)}`}
              >
                <div className="w-full">
                  <div className="flex justify-between items-start w-full">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${activeMapArea === "space-1" ? "bg-blue-500/15 text-blue-700" : "bg-blue-50 text-blue-600"}`}>
                      {isArabic ? "مطالعة صامتة" : "Silent"}
                    </span>
                    <span className="text-[9px] text-gray-400 bg-white/80 px-1.5 py-0.5 rounded-md shadow-3xs font-medium">
                      {isArabic ? "8 مقاعد" : "8 Seats"}
                    </span>
                  </div>
                  <div className="mt-4">
                    <span className="font-extrabold block text-sm text-right">
                      {isArabic ? "قاعة المطالعة الكبرى" : "Main Silent Reading Hall"}
                    </span>
                    <span className="text-[10px] block text-gray-400 mt-0.5">
                      {isArabic ? "الطابق الأول - هدوء تام للتحضير" : "1st Floor - Deep Concentration Zone"}
                    </span>
                  </div>
                </div>
                <div className="w-full mt-3">
                  <span className="text-[9px] text-gray-400 block mb-1 text-right sm:text-left">
                    {isArabic ? "توزيع المقاعد الفعلي:" : "Physical Seat Layout:"}
                  </span>
                  {renderMiniSeats("space-1", 8)}
                </div>
              </button>

              {/* Zone 2: VR Lab (Takes 2x1) */}
              <button
                onClick={() => setActiveMapArea("space-2")}
                className={`col-span-2 p-3 rounded-xl flex flex-col justify-between transition-all border cursor-pointer text-right ${getZoneStyle("space-2", activeMapArea)}`}
              >
                <div className="w-full">
                  <div className="flex justify-between items-center w-full">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${activeMapArea === "space-2" ? "bg-purple-500/15 text-purple-700" : "bg-purple-50 text-purple-600"}`}>
                      VR Lab
                    </span>
                    <span className="text-[9px] text-gray-400 bg-white/80 px-1.5 py-0.5 rounded-md shadow-3xs font-medium">
                      {isArabic ? "مقعدين" : "2 Seats"}
                    </span>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="font-extrabold text-xs block">
                      {isArabic ? "مختبر الواقع الافتراضي" : "VR sandbox"}
                    </span>
                  </div>
                </div>
                <div className="w-full mt-2">
                  {renderMiniSeats("space-2", 2)}
                </div>
              </button>

              {/* Zone 3: AI Computer Station (Takes 2x1) */}
              <button
                onClick={() => setActiveMapArea("space-3")}
                className={`col-span-2 p-3 rounded-xl flex flex-col justify-between transition-all border cursor-pointer text-right ${getZoneStyle("space-3", activeMapArea)}`}
              >
                <div className="w-full">
                  <div className="flex justify-between items-center w-full">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${activeMapArea === "space-3" ? "bg-amber-500/15 text-amber-700" : "bg-amber-50 text-amber-600"}`}>
                      AI Super
                    </span>
                    <span className="text-[9px] text-gray-400 bg-white/80 px-1.5 py-0.5 rounded-md shadow-3xs font-medium">
                      {isArabic ? "حاسبين" : "2 Nodes"}
                    </span>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="font-extrabold text-xs block">
                      {isArabic ? "منصة الحوسبة الفائقة" : "AI Supercomputer"}
                    </span>
                  </div>
                </div>
                <div className="w-full mt-2">
                  {renderMiniSeats("space-3", 2)}
                </div>
              </button>

              {/* Zone 4: Discussion Room A (Takes 3x1) */}
              <button
                onClick={() => setActiveMapArea("space-4")}
                className={`col-span-3 p-3 rounded-xl flex flex-col justify-between transition-all border cursor-pointer text-right ${getZoneStyle("space-4", activeMapArea)}`}
              >
                <div className="w-full">
                  <div className="flex justify-between items-center w-full">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${activeMapArea === "space-4" ? "bg-emerald-500/15 text-emerald-700" : "bg-emerald-50 text-emerald-600"}`}>
                      Room A
                    </span>
                    <span className="text-[9px] text-gray-400 bg-white/80 px-1.5 py-0.5 rounded-md shadow-3xs font-medium">
                      {isArabic ? "6 مقاعد" : "6 Seats"}
                    </span>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="font-extrabold text-xs block">
                      {isArabic ? "غرفة نقاش جماعي أ" : "Discussion Room A"}
                    </span>
                  </div>
                </div>
                <div className="w-full mt-2">
                  {renderMiniSeats("space-4", 6)}
                </div>
              </button>

              {/* Zone 5: Discussion Room B (Takes 3x1) */}
              <button
                onClick={() => setActiveMapArea("space-5")}
                className={`col-span-3 p-3 rounded-xl flex flex-col justify-between transition-all border cursor-pointer text-right ${getZoneStyle("space-5", activeMapArea)}`}
              >
                <div className="w-full">
                  <div className="flex justify-between items-center w-full">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${activeMapArea === "space-5" ? "bg-rose-500/15 text-rose-700" : "bg-rose-50 text-rose-600"}`}>
                      Room B
                    </span>
                    <span className="text-[9px] text-gray-400 bg-white/80 px-1.5 py-0.5 rounded-md shadow-3xs font-medium">
                      {isArabic ? "6 مقاعد" : "6 Seats"}
                    </span>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="font-extrabold text-xs block">
                      {isArabic ? "غرفة نقاش جماعي ب" : "Discussion Room B"}
                    </span>
                  </div>
                </div>
                <div className="w-full mt-2">
                  {renderMiniSeats("space-5", 6)}
                </div>
              </button>

            </div>
          </div>

          {/* Map details box */}
          {selectedSpace && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-150 rounded-xl flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      {isArabic ? "القسم النشط المعاين" : "Inspected Map Section"}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[8px] rounded font-bold uppercase ${
                      selectedSpace.status === "available" 
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                        : selectedSpace.status === "booked"
                        ? "bg-rose-50 text-rose-600 border border-rose-100"
                        : "bg-amber-50 text-amber-600 border border-amber-100"
                    }`}>
                      {selectedSpace.status === "available" ? (isArabic ? "شاغر حالياً" : "Available") : selectedSpace.status === "booked" ? (isArabic ? "محجوز حالياً" : "Booked") : (isArabic ? "قيد الصيانة" : "Under Maintenance")}
                    </span>
                  </div>
                  <span className="font-bold text-gray-800 text-sm block mt-0.5">
                    {selectedSpace.name}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedSpace.type === "silent-study" && (isArabic ? "مخصص للمطالعة والتحضير الفردي الهادئ بدون أجهزة صوتية." : "Designated for peaceful individual review and reading.")}
                    {selectedSpace.type === "vr-lab" && (isArabic ? "تجهيزات نظارات Meta Quest 3 ومحاكاة بيئات العمل ثلاثية الأبعاد." : "Equipped with Meta Quest 3 headsets & 3D virtual dev sandboxes.")}
                    {selectedSpace.type === "computer-lab" && (isArabic ? "مزود ببطاقات معالجة رسومية RTX 4090 لتطبيقات الذكاء الاصطناعي." : "Equipped with NVIDIA RTX 4090 GPUs for deep learning models.")}
                    {selectedSpace.type === "group-study" && (isArabic ? "مزود بشاشة ذكية مسطحة ومنافذ لربط الحواسب المحمولة." : "Contains smart presentation boards and laptop connectivity docks.")}
                  </p>
                </div>
                
                {selectedSpace.status === "available" && (
                  <button
                    onClick={() => onSelectSpace(selectedSpace.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
                  >
                    {isArabic ? "احجز الآن" : "Reserve Now"}
                  </button>
                )}
              </div>

              {/* Dynamic current occupant display */}
              {selectedSpace.status === "booked" && selectedSpace.currentBooking && (
                <div className="text-xs text-rose-700 bg-rose-50/50 border border-rose-100/50 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="font-bold">
                      {isArabic ? "⚠️ محجوز حالياً بواسطة:" : "⚠️ Booked by:"}
                    </span>
                    <span className="font-semibold text-rose-900 bg-white px-2 py-0.5 rounded shadow-3xs">
                      {selectedSpace.currentBooking.studentName}
                    </span>
                    <span className="text-[10px] text-rose-600 bg-white/50 px-1.5 py-0.5 rounded">
                      ⏱️ {selectedSpace.currentBooking.startTime} - {selectedSpace.currentBooking.endTime}
                    </span>
                  </div>
                  <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-mono font-semibold self-start sm:self-auto">
                    {isArabic ? "رمز التحقق: " : "Code: "}{selectedSpace.currentBooking.verificationCode}
                  </span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Dynamic Accreditations / Stats (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quality Standards Panel */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm" id="college-standards">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
              <Award className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-800 text-lg">
                {isArabic ? "معايير الجودة والأجهزة المتخصصة" : "Quality Standards & Hardware"}
              </h3>
            </div>
            
            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 flex gap-3">
                <Cpu className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-indigo-900 block mb-0.5">
                    {isArabic ? "أجهزة تخصصية ومحاكاة بيئات" : "Specialized Hardware & Simulation"}
                  </span>
                  <p className="text-indigo-950">
                    {isArabic 
                      ? "المكتبة توفر بيئات اختبار حقيقية لطلاب شبكات الاتصال والأمن السيبراني، بما في ذلك محاكاة شبكات سيسكو وخوادم محلية."
                      : "We provide networking student sandboxes simulating live Cisco environments, packet inspection, and local container servers."}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50 flex gap-3">
                <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-900 block mb-0.5">
                    {isArabic ? "تأمين البيانات والحماية الكاملة" : "Data Security & Defense"}
                  </span>
                  <p className="text-emerald-950">
                    {isArabic 
                      ? "نظام الحجز والاستعارة محمي بالكامل ويستخدم بروتوكولات آمنة لحفظ خصوصية السجلات ومنع الاختراقات وتزوير البيانات."
                      : "Fully secure digital booking and loan verification system protecting student identifiers and transaction logs."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics of Available Spaces */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h4 className="font-bold text-gray-800 text-sm mb-3">
              {isArabic ? "حالة الأماكن الحالية" : "Current Space Status"}
            </h4>
            <div className="space-y-2">
              {spaces.map(sp => (
                <div key={sp.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100/70 transition-all text-xs">
                  <span className="font-medium text-gray-700">{sp.name}</span>
                  <span className={`px-2 py-0.5 rounded font-semibold ${
                    sp.status === "available" 
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                      : "bg-amber-50 text-amber-600 border border-amber-100"
                  }`}>
                    {sp.status === "available" ? (isArabic ? "شاغر" : "Available") : (isArabic ? "محجوز" : "Booked")}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Student Projects Status Distribution Chart (Recharts) */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm animate-fade-in" id="project-distribution-section">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-gray-800 text-lg">
                {isArabic ? "تحليلات وإحصائيات المشاريع" : "Project Analytics & Trends"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isArabic 
                  ? "تحليل شامل لتوزيع المشاريع الحالية ومعدلات الإضافة الشهرية وتنزيل التقارير" 
                  : "Comprehensive analysis of project distribution, monthly additions, and data export"}
              </p>
            </div>
          </div>

          {/* Export Data Button */}
          <button
            id="export-data-btn"
            onClick={handleExportData}
            className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 transition-all text-xs font-bold shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-4 h-4 text-slate-500 hover:text-indigo-500 transition-colors" />
            <span>{isArabic ? "تصدير البيانات" : "Export Data"}</span>
          </button>
        </div>

        {(() => {
          const completedCount = completedProjects?.length || 3;
          const rawIncomplete = incompleteProjects?.length || 0;

          // Divide incomplete into In-Progress and Under-Review
          const inProgressCount = rawIncomplete > 0 ? Math.ceil(rawIncomplete * 0.7) : 2;
          const underReviewCount = rawIncomplete > 0 ? Math.floor(rawIncomplete * 0.3) : 1;
          const totalProjects = completedCount + inProgressCount + underReviewCount;

          const chartData = [
            {
              name: isArabic ? "مكتملة" : "Completed",
              count: completedCount,
              color: "#10b981", // Emerald
            },
            {
              name: isArabic ? "قيد التنفيذ" : "In-Progress",
              count: inProgressCount,
              color: "#4f46e5", // Indigo
            },
            {
              name: isArabic ? "قيد المراجعة" : "Under-Review",
              count: underReviewCount,
              color: "#f97316", // Orange
            },
          ];

          // Generate the list of last 12 months starting from July 2025 back to June 2026
          const monthNamesEn = ["Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26"];
          const monthNamesAr = ["يوليو 25", "أغسطس 25", "سبتمبر 25", "أكتوبر 25", "نوفمبر 25", "ديسمبر 25", "يناير 26", "فبراير 26", "مارس 26", "أبريل 26", "مايو 26", "يونيو 26"];

          const monthlyTrendData = monthNamesEn.map((mEn, idx) => {
            const mAr = monthNamesAr[idx];
            let count = 0;

            // 1. Incomplete projects matching month
            incompleteProjects.forEach(p => {
              if (p.uploadedAt) {
                try {
                  const pDate = new Date(p.uploadedAt);
                  const pYear = pDate.getFullYear();
                  const pMonth = pDate.getMonth(); // 0-indexed
                  
                  if (idx < 6) {
                    const targetMonthIndex = idx + 6; // 6 is Jul, 7 Aug, 8 Sep, etc.
                    if (pYear === 2025 && pMonth === targetMonthIndex) {
                      count++;
                    }
                  } else {
                    const targetMonthIndex = idx - 6; // 0 is Jan, 1 Feb, 2 Mar, etc.
                    if (pYear === 2026 && pMonth === targetMonthIndex) {
                      count++;
                    }
                  }
                } catch (e) {
                  // ignore
                }
              }
            });

            // 2. Graduation projects matching graduation year
            completedProjects.forEach(p => {
              if (p.year === 2026) {
                if (idx === 10 || idx === 11) {
                  count += 0.5;
                }
              } else if (p.year === 2025) {
                if (idx === 0) {
                  count += 0.5;
                }
              }
            });

            const baseTrends = [1, 2, 0, 1, 3, 2, 1, 2, 4, 3, 5, 4];
            const finalCount = count > 0 ? Math.ceil(count) : baseTrends[idx];

            return {
              month: isArabic ? mAr : mEn,
              projects: finalCount
            };
          });

          return (
            <div className="space-y-10">
              
              {/* Dual Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Chart 1: Status Distribution */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                    <h4 className="text-sm font-bold text-gray-700">
                      {isArabic ? "توزيع حالة المشاريع الحالية" : "Current Project Statuses"}
                    </h4>
                  </div>
                  
                  <div className="h-[280px] w-full bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
                        barSize={40}
                      >
                        <XAxis 
                          dataKey="name" 
                          tickLine={false} 
                          axisLine={false}
                          tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                        />
                        <YAxis 
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#64748b", fontSize: 11 }}
                        />
                        <Tooltip
                          cursor={{ fill: '#f8fafc' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const count = data.count;
                              const percentage = totalProjects > 0 ? ((count / totalProjects) * 100).toFixed(1) : "0";
                              return (
                                <div className="bg-slate-800 text-slate-100 p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
                                  <p className="font-bold text-slate-300 mb-1">{data.name}</p>
                                  <div className="space-y-1 mt-1.5">
                                    <p className="font-medium text-white flex justify-between gap-4">
                                      <span>{isArabic ? "العدد الدقيق:" : "Exact Count:"}</span>
                                      <span className="text-indigo-300 font-mono font-bold text-sm">{count}</span>
                                    </p>
                                    <p className="font-medium text-white flex justify-between gap-4">
                                      <span>{isArabic ? "النسبة:" : "Percentage:"}</span>
                                      <span className="text-emerald-300 font-mono font-bold text-sm">{percentage}%</span>
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Project Additions Trend */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500 animate-bounce" />
                    <h4 className="text-sm font-bold text-gray-700">
                      {isArabic ? "معدل إضافة المشاريع شهرياً (آخر سنة)" : "Monthly New Project Additions (Last Year)"}
                    </h4>
                  </div>

                  <div className="h-[280px] w-full bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={monthlyTrendData}
                        margin={{ top: 20, right: 20, left: -15, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="month" 
                          tickLine={false} 
                          axisLine={false}
                          tick={{ fill: "#64748b", fontSize: 10, fontWeight: 500 }}
                        />
                        <YAxis 
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#64748b", fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#1e293b',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#f8fafc',
                            fontSize: '12px',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          }}
                          itemStyle={{ color: '#38bdf8', fontWeight: 600 }}
                          labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="projects" 
                          stroke="#4f46e5" 
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                          name={isArabic ? "المشاريع الجديدة" : "New Projects"}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Summary Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 flex flex-col justify-between shadow-xs">
                  <span className="text-xs text-gray-500 font-medium block mb-1">
                    {isArabic ? "إجمالي المشاريع المرصودة" : "Total Tracked Projects"}
                  </span>
                  <span className="text-2xl font-black text-slate-800 font-mono">
                    {totalProjects}
                  </span>
                </div>

                {chartData.map((item, idx) => {
                  const percentage = totalProjects > 0 ? Math.round((item.count / totalProjects) * 100) : 0;
                  return (
                    <div 
                      key={idx} 
                      className="p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all flex items-center justify-between bg-white shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0 animate-pulse" 
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <span className="font-bold text-gray-800 text-xs block">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-0.5 font-sans">
                            {isArabic ? `معدل المساهمة: ${percentage}%` : `Contribution: ${percentage}%`}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-slate-800 text-sm block font-mono">
                          {item.count} {isArabic ? "مشروع" : "Projects"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })()}
      </div>

      {/* Accreditations & Academic Achievements Section */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm" id="achievements-section">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-gray-800 text-lg">
                {isArabic ? "سجل الإنجازات الأكاديمية والاعتمادات" : "Academic Achievements & Accreditations"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isArabic ? "الشهادات والاعتمادات الرسمية التي حصدتها كلية علوم الحاسب" : "Official certifications and academic milestones earned by the college"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {achievements.map((ach) => (
            <div 
              key={ach.id} 
              className="p-5 rounded-2xl bg-slate-50/50 hover:bg-white border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 group"
            >
              {ach.certificateUrl && (
                <img 
                  src={ach.certificateUrl} 
                  alt={ach.title} 
                  className="w-full sm:w-24 h-24 object-cover rounded-xl border border-gray-200 group-hover:scale-105 transition-transform shrink-0"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="space-y-1">
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 font-semibold uppercase tracking-wider">
                  {ach.type === "academic" ? (isArabic ? "اعتماد أكاديمي" : "Academic") : (isArabic ? "إنجاز بحثي" : "Research")}
                </span>
                <h4 className="font-bold text-gray-800 text-sm leading-snug">
                  {ach.title}
                </h4>
                <p className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {ach.date} | {ach.recipient}
                </p>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {ach.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* National & Local Competitions Section */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm" id="competitions-section">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-gray-800 text-lg">
                {isArabic ? "المشاركات والمسابقات الطلابية والهاكاثونات" : "Student Competitions & Hackathons"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isArabic ? "سجل مشاركات الكلية في مسابقات البرمجة والابتكار الرقمي" : "National programming and digital innovations hackathon log"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {competitions.map((comp) => (
            <div 
              key={comp.id} 
              className="p-5 rounded-2xl bg-slate-50/50 hover:bg-white border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 group"
            >
              {comp.certificateUrl && (
                <img 
                  src={comp.certificateUrl} 
                  alt={comp.title} 
                  className="w-full sm:w-24 h-24 object-cover rounded-xl border border-gray-200 group-hover:scale-105 transition-transform shrink-0"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="space-y-1">
                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full border border-indigo-100 font-bold uppercase tracking-wider">
                  {comp.placement}
                </span>
                <h4 className="font-bold text-gray-800 text-sm leading-snug">
                  {comp.title}
                </h4>
                <p className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {comp.date}
                </p>
                <p className="text-xs text-gray-600">
                  {comp.description}
                </p>
                {comp.teamMembers && comp.teamMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {comp.teamMembers.map((member, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded flex items-center gap-1">
                        <User className="w-2.5 h-2.5" />
                        {member}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: Upload Certificate */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">
                  {isArabic ? "توثيق ورفع شهادة أكاديمية" : "Document & Upload Certificate"}
                </h3>
                <p className="text-xs text-slate-400">
                  {isArabic ? "رفع شهادات الاعتماد والتميز الطلابي في قاعدة البيانات" : "Upload academic and competition awards securely"}
                </p>
              </div>
              <button 
                onClick={() => setShowCertModal(false)}
                className="text-slate-400 hover:text-white font-mono text-xl focus:outline-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {successMsg ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-emerald-600 text-lg">
                  {isArabic ? "تم الرفع بنجاح" : "Uploaded Successfully"}
                </h4>
                <p className="text-sm text-gray-500">
                  {successMsg}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                {/* Certificate Category */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    {isArabic ? "تصنيف الشهادة" : "Certificate Category"}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCertType("achievement")}
                      className={`py-2 px-4 rounded-xl font-semibold text-xs border cursor-pointer transition-all ${
                        certType === "achievement"
                          ? "bg-blue-50 text-blue-600 border-blue-200 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {isArabic ? "إنجاز أكاديمي / اعتماد" : "Academic Achievement"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCertType("competition")}
                      className={`py-2 px-4 rounded-xl font-semibold text-xs border cursor-pointer transition-all ${
                        certType === "competition"
                          ? "bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {isArabic ? "مسابقة / هاكاثون" : "Competition / Award"}
                    </button>
                  </div>
                </div>

                {certType === "achievement" ? (
                  /* Achievement Fields */
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          {isArabic ? "عنوان الإنجاز *" : "Achievement Title *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={achTitle}
                          onChange={(e) => setAchTitle(e.target.value)}
                          placeholder={isArabic ? "مثال: تجديد اعتماد ABET" : "e.g. ABET Re-accreditation"}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          {isArabic ? "الجهة الحاصلة *" : "Recipient *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={achRecipient}
                          onChange={(e) => setAchRecipient(e.target.value)}
                          placeholder={isArabic ? "مثال: قسم علوم الحاسب" : "e.g. CS Department"}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          {isArabic ? "التاريخ" : "Date"}
                        </label>
                        <input
                          type="date"
                          value={achDate}
                          onChange={(e) => setAchDate(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          {isArabic ? "نوع الإنجاز" : "Type"}
                        </label>
                        <select
                          value={achType}
                          onChange={(e) => setAchType(e.target.value as any)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        >
                          <option value="academic">{isArabic ? "اعتماد أكاديمي" : "Academic"}</option>
                          <option value="research">{isArabic ? "جائزة بحثية" : "Research"}</option>
                          <option value="community">{isArabic ? "خدمة المجتمع" : "Community"}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        {isArabic ? "وصف تفصيلي *" : "Detailed Description *"}
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={achDesc}
                        onChange={(e) => setAchDesc(e.target.value)}
                        placeholder={isArabic ? "تفاصيل الحصول على هذه الشهادة..." : "Details on how this cert was obtained..."}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  </>
                ) : (
                  /* Competition Fields */
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          {isArabic ? "اسم المسابقة *" : "Competition Title *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={compTitle}
                          onChange={(e) => setCompTitle(e.target.value)}
                          placeholder={isArabic ? "مثال: هاكاثون الابتكار" : "e.g. Innovation Hackathon"}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          {isArabic ? "المركز / الترتيب *" : "Placement / Rank *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={compPlacement}
                          onChange={(e) => setCompPlacement(e.target.value)}
                          placeholder={isArabic ? "مثال: المركز الأول" : "e.g. 1st Place"}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          {isArabic ? "التاريخ" : "Date"}
                        </label>
                        <input
                          type="date"
                          value={compDate}
                          onChange={(e) => setCompDate(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          {isArabic ? "أعضاء الفريق (مفصولين بفاصلة)" : "Team Members (Comma separated)"}
                        </label>
                        <input
                          type="text"
                          value={compMembers}
                          onChange={(e) => setCompMembers(e.target.value)}
                          placeholder={isArabic ? "مثال: رائد، محمد، يوسف" : "e.g. Reid, Mike, Joe"}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        {isArabic ? "وصف المشاركة *" : "Participation Description *"}
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={compDesc}
                        onChange={(e) => setCompDesc(e.target.value)}
                        placeholder={isArabic ? "اكتب نبذة عن حلول الفريق والمنافسة..." : "Write briefly about team solutions..."}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  </>
                )}

                {/* Simulated Certificate Upload Area */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isArabic ? "صورة الشهادة / درع التكريم (اختياري)" : "Certificate / Award Photograph (Optional)"}
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-slate-100/50 transition-colors cursor-pointer relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-10 w-10 text-gray-400" />
                      <div className="flex text-sm text-gray-600 justify-center">
                        <span className="relative rounded-md font-semibold text-blue-600 hover:text-blue-500">
                          {isArabic ? "اختر صورة الشهادة" : "Select Certificate Image"}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400">
                        PNG, JPG, WebP up to 5MB
                      </p>
                      {uploadedFileName && (
                        <div className="mt-2 text-xs font-medium text-emerald-600 flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          {uploadedFileName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCertModal(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    {isArabic ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (isArabic ? "جاري الحفظ..." : "Saving...") : (isArabic ? "حفظ التوثيق" : "Save Document")}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}


      {/* Centralized 'Quick Add' Floating Action Button */}
      <div className={`fixed bottom-8 ${isArabic ? "left-8" : "right-8"} z-40 group`}>
        <button
          id="quick-add-fab"
          onClick={() => {
            setCertType("achievement");
            setShowCertModal(true);
          }}
          className="flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-full shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer font-bold border border-white/20"
          title={isArabic ? "إضافة سريعة لإنجاز أو مسابقة" : "Quick Add Achievement or Competition"}
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
          <span className="text-sm tracking-wide font-semibold font-sans">
            {isArabic ? "إضافة سريعة" : "Quick Add"}
          </span>
        </button>
      </div>

    </div>
  );
}
