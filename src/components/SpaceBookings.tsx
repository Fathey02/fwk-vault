import { useState, FormEvent, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  User, 
  Check, 
  QrCode, 
  Users, 
  Cpu, 
  Sparkles, 
  AlertTriangle,
  Send,
  Plus,
  Compass,
  Laptop,
  Play,
  Pause,
  RotateCcw,
  Timer,
  Flame
} from "lucide-react";
import { LibrarySpace } from "../types";

interface SpaceBookingsProps {
  isArabic: boolean;
  spaces: LibrarySpace[];
  onBookSpace: (
    spaceId: string, 
    studentName: string, 
    studentId: string, 
    startTime: string, 
    endTime: string,
    verificationCode: string
  ) => Promise<void>;
  onReleaseSpace: (spaceId: string) => Promise<void>;
  currentUser?: {
    name: string;
    id: string;
    email: string;
    role: "internal_student" | "external_student" | "admin";
    collegeName?: string;
    department?: string;
  } | null;
}

// Simulated Group tasks for Virtual Study Room (غرفة عمل افتراضية)
interface GroupTask {
  id: string;
  studentName: string;
  studentId: string;
  projectName: string;
  neededSkills: string;
  description: string;
  postedAt: string;
}

// ---------------- DYNAMIC SVG QR CODE GENERATION UTILITY ----------------
function DynamicQRCode({ value, isArabic }: { value: string; isArabic: boolean }) {
  const size = 12;
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
    <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-100 rounded-xl shadow-xs space-y-1.5 mx-auto max-w-[150px]">
      <svg width="110" height="110" viewBox="0 0 12 12" className="shape-rendering-crisp-edges">
        <rect width="12" height="12" fill="#ffffff" />
        {grid.map((row, r) => 
          row.map((active, c) => (
            active ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#1e293b" /> : null
          ))
        )}
      </svg>
      <span className="text-[8px] text-gray-400 font-mono tracking-wider truncate max-w-[130px]">{value}</span>
    </div>
  );
}

export default function SpaceBookings({
  isArabic,
  spaces,
  onBookSpace,
  onReleaseSpace,
  currentUser
}: SpaceBookingsProps) {

  // Space Booking State
  const [selectedSpace, setSelectedSpace] = useState<LibrarySpace | null>(null);
  const [studentName, setStudentName] = useState(currentUser?.name || "");
  const [studentId, setStudentId] = useState(currentUser?.id || "");

  // Space Bookings Sub-Tabs (List vs Calendar View)
  const [bookingsSubTab, setBookingsSubTab] = useState<"list" | "calendar">("list");
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [calendarFilter, setCalendarFilter] = useState<"all" | "mine">("all");

  // Dynamic Date calculations for Next 7 Days starting July 1, 2026
  const getNext7Days = (isAr: boolean) => {
    const days = [];
    const baseDate = new Date(2026, 6, 1); // July 1, 2026 (Wednesday) is our default
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dayName = d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short' });
      days.push({
        index: i,
        name: dayName,
        label: `${dayNum} ${monthName}`,
        fullDate: d.toISOString().split("T")[0]
      });
    }
    return days;
  };

  const next7Days = getNext7Days(isArabic);

  // Dynamic peak hour traffic generator based on hour & day index
  const getTrafficForHour = (hourStr: string, dayIndex: number) => {
    const hour = parseInt(hourStr.split(":")[0], 10);
    let base = 30;
    if (hour >= 9 && hour <= 13) {
      base = 75 + Math.sin(hour) * 15; // Peak morning
    } else if (hour >= 14 && hour <= 16) {
      base = 45; // Afternoon dip
    } else if (hour >= 17 && hour <= 20) {
      base = 65 + Math.cos(hour) * 10; // Evening peak
    } else {
      base = 15; // Early/Late quiet
    }

    // Quieter on weekends (Day 2: Friday, Day 3: Saturday in our July 1 2026 sequence)
    if (dayIndex === 2 || dayIndex === 3) {
      base = base * 0.35; 
    } else if (dayIndex === 1) {
      base = base * 0.85; 
    }

    const rounded = Math.min(Math.max(Math.round(base), 5), 98);
    
    let labelAr = "هادئ جداً";
    let labelEn = "Very Quiet";
    let color = "bg-emerald-500";
    let textColor = "text-emerald-700";
    let bgLight = "bg-emerald-50";

    if (rounded >= 75) {
      labelAr = "ذروة الازدحام";
      labelEn = "Peak Traffic";
      color = "bg-rose-500";
      textColor = "text-rose-700";
      bgLight = "bg-rose-50";
    } else if (rounded >= 50) {
      labelAr = "مزدحم / نشط";
      labelEn = "Busy / Active";
      color = "bg-amber-500";
      textColor = "text-amber-700";
      bgLight = "bg-amber-50";
    } else if (rounded >= 25) {
      labelAr = "معتدل";
      labelEn = "Moderate";
      color = "bg-blue-500";
      textColor = "text-blue-700";
      bgLight = "bg-blue-50";
    }

    return { level: rounded, labelAr, labelEn, color, textColor, bgLight };
  };

  // Get both live and simulated bookings for a specific day and hour slot
  const getBookingsForDayAndHour = (dayIndex: number, hourStr: string) => {
    const hNum = parseInt(hourStr.split(":")[0], 10);

    // Day 0: Live reservations from Firestore
    if (dayIndex === 0) {
      return spaces
        .filter((sp) => sp.status === "booked" && sp.currentBooking)
        .map((sp) => ({
          spaceId: sp.id,
          spaceName: sp.name,
          booking: sp.currentBooking!,
          isReal: true
        }))
        .filter((item) => {
          const startNum = parseInt(item.booking.startTime.split(":")[0], 10);
          const endNum = parseInt(item.booking.endTime.split(":")[0], 10);
          return hNum >= startNum && hNum < endNum;
        });
    }

    // Future Days: Deterministic simulation to demonstrate schedule views
    const simulated = [];
    for (let i = 0; i < spaces.length; i++) {
      const sp = spaces[i];
      const hash = Math.abs(Math.sin(dayIndex * 19 + hNum * 23 + i * 17));
      // Weekends Friday/Saturday quieter, weekdays busier
      const threshold = (dayIndex === 2 || dayIndex === 3) ? 0.85 : 0.6;

      if (hash > threshold) {
        const startHour = hNum;
        const endHour = hNum + 1;
        const startStr = `${startHour.toString().padStart(2, "0")}:00`;
        const endStr = `${endHour.toString().padStart(2, "0")}:00`;

        const namesAr = ["فيصل الدوسري", "أسماء المطيري", "عبدالرحمن الحربي", "نورة العتيبي", "خالد الشمراني"];
        const namesEn = ["Faisal Al-Dawsari", "Asma Al-Mutairi", "Abdulrahman Al-Harbi", "Noura Al-Otaibi", "Khaled Al-Shamrani"];
        const ids = ["442008812", "442001928", "441203492", "442201884", "443201994"];

        simulated.push({
          spaceId: sp.id,
          spaceName: sp.name,
          booking: {
            studentName: isArabic ? namesAr[i % namesAr.length] : namesEn[i % namesEn.length],
            studentId: ids[i % ids.length],
            startTime: startStr,
            endTime: endStr,
            verificationCode: Math.floor(1000 + hash * 9000).toString(),
            needsCheckIn: false
          },
          isReal: false
        });
      }
    }
    return simulated;
  };

  const addHoursToTime = (timeStr: string, hoursToAdd: number) => {
    const h = parseInt(timeStr.split(":")[0], 10);
    const m = timeStr.split(":")[1] || "00";
    const newH = Math.min(h + hoursToAdd, 23);
    return `${newH.toString().padStart(2, "0")}:${m}`;
  };

  const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];

  // Sync state if currentUser changes (due to Simulator role switching)
  useEffect(() => {
    if (currentUser) {
      setStudentName(currentUser.name);
      setStudentId(currentUser.id);
    }
  }, [currentUser]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [activeEquipment, setActiveEquipment] = useState<"none" | "cisco-network" | "gpu-node" | "vr-headset">("none");

  // Booking Verification Slip
  const [verificationSlip, setVerificationSlip] = useState<{
    spaceName: string;
    studentName: string;
    studentId: string;
    code: string;
    qrData: string;
    time: string;
  } | null>(null);

  // POMODORO FOCUS TIMER COMPONENT STATE
  const [timerMode, setTimerMode] = useState<"study" | "short" | "long">("study");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Synchronize timer duration with selected study mode
  const setTimerModeAndReset = (mode: "study" | "short" | "long") => {
    setTimerMode(mode);
    setTimerActive(false);
    if (mode === "study") {
      setSecondsLeft(25 * 60);
    } else if (mode === "short") {
      setSecondsLeft(5 * 60);
    } else {
      setSecondsLeft(15 * 60);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (timerActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && timerActive) {
      setTimerActive(false);
      if (timerMode === "study") {
        setCompletedSessions((prev) => prev + 1);
        alert(isArabic 
          ? "🎉 رائع! اكتملت جلسة التركيز المخصصة للدراسة والعمل العميق (25 دقيقة). خذ قسطاً من الراحة الآن!" 
          : "🎉 Excellent! Your 25-minute deep work study focus session is complete. Take a break!");
      } else {
        alert(isArabic 
          ? "⏱️ انتهى وقت الاستراحة. حان الوقت للعودة لمتابعة طلباتك ومذاكرتك بذهن متقد!" 
          : "⏱️ Break is over. Ready to start studying again with high productivity?");
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, secondsLeft, timerMode, isArabic]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remSecs.toString().padStart(2, "0")}`;
  };

  // Virtual study room state (غرفة عمل افتراضية)
  const [groupTasks, setGroupTasks] = useState<GroupTask[]>([
    {
      id: "task-1",
      studentName: "سعد الشهراني",
      studentId: "441203492",
      projectName: "تطوير تطبيق تتبع صحي بالذكاء الاصطناعي",
      neededSkills: "React Native, Node.js, Python",
      description: "نبحث عن مبرمج واجهات أمامية للانضمام إلى فريق مشروع التخرج لتطوير تطبيق تتبع التغذية بالذكاء الاصطناعي.",
      postedAt: "2026-06-30"
    },
    {
      id: "task-2",
      studentName: "رنا الحربي",
      studentId: "442201884",
      projectName: "نظام كشف الثغرات بالبلوكشين",
      neededSkills: "Solidity, Cybersecurity, Auditing",
      description: "نعمل على تصميم نظام لتدقيق العقود الذكية ونحتاج لطالب متمكن من لغة سوليديتي لمساعدتنا في بناء بيئة الاختبار.",
      postedAt: "2026-06-29"
    }
  ]);

  // Create Task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskProj, setTaskProj] = useState("");
  const [taskSkills, setTaskSkills] = useState("");
  const [taskDesc, setTaskDesc] = useState("");

  const handleBooking = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSpace) return;
    if (!studentName || !studentId) {
      alert(isArabic ? "يرجى ملء جميع بيانات الطالب" : "Please fill in all student credentials");
      return;
    }

    try {
      // Generate secure verification token (نظام تحقق عند الحجز)
      const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
      const qrData = `SPACE-BOOK-${selectedSpace.id}-${studentId}-${randomCode}`;

      await onBookSpace(
        selectedSpace.id,
        studentName,
        studentId,
        startTime,
        endTime,
        randomCode
      );

      setVerificationSlip({
        spaceName: selectedSpace.name,
        studentName,
        studentId,
        code: randomCode,
        qrData,
        time: `${startTime} - ${endTime}`
      });

      setSelectedSpace(null);
      setStudentName("");
      setStudentId("");
    } catch (err) {
      console.error(err);
      alert("Booking failed");
    }
  };

  const handlePostTask = (e: FormEvent) => {
    e.preventDefault();
    if (!taskName || !taskProj || !taskDesc) {
      alert(isArabic ? "يرجى تعبئة الحقول الأساسية" : "Please enter the core details");
      return;
    }

    const newTask: GroupTask = {
      id: `task-${Date.now()}`,
      studentName: taskName,
      studentId: "44... / 43...",
      projectName: taskProj,
      neededSkills: taskSkills || (isArabic ? "مهارات برمجة عامة" : "General Dev skills"),
      description: taskDesc,
      postedAt: new Date().toISOString().split("T")[0]
    };

    setGroupTasks([newTask, ...groupTasks]);
    setTaskName("");
    setTaskProj("");
    setTaskSkills("");
    setTaskDesc("");
    setShowTaskForm(false);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="spaces-tab">
      
      {/* Visual Booking Panels & Lab simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Active Spaces Grid list (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
              <Calendar className="w-5 h-5 text-blue-600 animate-pulse" />
              <div>
                <h3 className="font-bold text-gray-800 text-base">
                  {isArabic ? "لوحة الأماكن والمختبرات المتاحة للحجز" : "Spaces & Laboratories Booking Board"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isArabic ? "حجز فوري للغرف البحثية، محطات الذكاء الاصطناعي والواقع الافتراضي" : "Instantly book study units, AI engines, and specialized computer stations"}
                </p>
              </div>
            </div>

            {/* View Sub-Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100/80 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => setBookingsSubTab("list")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                  bookingsSubTab === "list"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {isArabic ? "📋 قائمة المساحات الشاغرة" : "📋 Available Spaces List"}
              </button>
              <button
                type="button"
                onClick={() => setBookingsSubTab("calendar")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                  bookingsSubTab === "calendar"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {isArabic ? "📅 تقويم الحجوزات وساعات الذروة" : "📅 Calendar & Peak Busy Hours"}
              </button>
            </div>

            {bookingsSubTab === "list" ? (
              <div className="space-y-3.5">
                {spaces.map((sp) => (
                  <div 
                    key={sp.id} 
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      sp.status === "available"
                        ? "bg-slate-50 border-gray-100 hover:border-blue-200"
                        : "bg-blue-50/20 border-blue-100/50"
                    }`}
                  >
                    <div className="space-y-1 text-right">
                      <div className="flex items-center gap-2 justify-end sm:justify-start">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sp.status === "available" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        }`}>
                          {sp.status === "available" ? (isArabic ? "شاغر" : "Available") : (isArabic ? "محجوز حالياً" : "Currently Booked")}
                        </span>
                        <h4 className="font-bold text-gray-800 text-sm">{sp.name}</h4>
                      </div>
                      
                      <p className="text-xs text-gray-500">
                        {sp.type === "silent-study" && (isArabic ? "مطالعة فردية صامتة - بدون حواسب" : "Silent Review Zone - No digital devices")}
                        {sp.type === "vr-lab" && (isArabic ? "مختبر غامر بأحدث نظارات الواقع الافتراضي وبيئات التجربة" : "Immersive hardware with Meta Quest 3 and simulation systems")}
                        {sp.type === "computer-lab" && (isArabic ? "محطة معالجة سحابية فائقة مع بطاقات RTX Nvidia" : "RTX Nvidia high-powered servers for training AI networks")}
                        {sp.type === "group-study" && (isArabic ? "غرفة مجهزة بشاشات ولوح تفاعلي للنقاشات الجماعية" : "Equipped with widescreen displays for group workshops")}
                      </p>

                      {sp.currentBooking && (
                        <div className="mt-2 text-[11px] text-blue-700 bg-blue-50/50 p-2 rounded-lg inline-block">
                          {isArabic ? "محجوز بواسطة" : "Booked by"}: <span className="font-semibold">{sp.currentBooking.studentName}</span> | {sp.currentBooking.startTime} - {sp.currentBooking.endTime}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {sp.status === "available" ? (
                        <button
                          onClick={() => setSelectedSpace(sp)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                        >
                          {isArabic ? "حجز الآن" : "Reserve Now"}
                        </button>
                      ) : (
                        <button
                          onClick={() => onReleaseSpace(sp.id)}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          {isArabic ? "تحرير المساحة" : "Release Room"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Horizontal Scroll Day Switcher */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2.5 text-right sm:text-left">
                    {isArabic ? "اختر اليوم لعرض ساعات الذروة والجدول الدراسي:" : "Select day to view peak traffic & reservation timeline:"}
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {next7Days.map((day) => {
                      const isActive = selectedDayIndex === day.index;
                      return (
                        <button
                          key={day.index}
                          type="button"
                          onClick={() => setSelectedDayIndex(day.index)}
                          className={`flex-none px-3.5 py-2 rounded-xl border text-center transition-all cursor-pointer min-w-[75px] ${
                            isActive
                              ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100 scale-[1.03]"
                              : "bg-slate-50 border-gray-100 text-gray-600 hover:bg-slate-100 hover:border-gray-200"
                          }`}
                        >
                          <div className="text-[9px] font-medium opacity-80 uppercase">{day.name}</div>
                          <div className="text-xs font-extrabold mt-0.5">{day.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter Toggle & Info Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 p-3 rounded-xl">
                  <div className="flex items-center gap-2 justify-end sm:justify-start">
                    <Clock className="w-4 h-4 text-slate-500 animate-pulse" />
                    <span className="text-xs text-gray-600 font-bold">
                      {isArabic ? "خريطة زحام وساعات عمل المكتبة" : "Library Congestion & Hours Map"}
                    </span>
                  </div>

                  <div className="flex gap-1 bg-white p-1 rounded-lg border border-gray-100 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setCalendarFilter("all")}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                        calendarFilter === "all"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {isArabic ? "جميع الحجوزات" : "All Bookings"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarFilter("mine")}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                        calendarFilter === "mine"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {isArabic ? "حجوزاتي فقط" : "My Bookings"}
                    </button>
                  </div>
                </div>

                {/* Hourly Grid list */}
                <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                  {HOURS.map((hour) => {
                    const traffic = getTrafficForHour(hour, selectedDayIndex);
                    const slotBookings = getBookingsForDayAndHour(selectedDayIndex, hour);
                    
                    // Filter by "mine" if chosen
                    const filteredBookings = calendarFilter === "mine"
                      ? slotBookings.filter(b => b.booking.studentId === currentUser?.id)
                      : slotBookings;

                    return (
                      <div key={hour} className="border border-gray-100 rounded-xl p-3 hover:border-gray-200 transition-all bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                        
                        {/* Time & Traffic indicator */}
                        <div className="flex items-center gap-3 w-full md:w-52 shrink-0 border-b md:border-b-0 pb-3 md:pb-0 md:border-r border-gray-100/80 text-right sm:text-left">
                          <div className="w-10 h-10 rounded-lg bg-blue-50/60 flex flex-col items-center justify-center shrink-0">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-[9px] font-bold font-mono text-blue-800 mt-0.5">{hour}</span>
                          </div>
                          
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-1.5 justify-end sm:justify-start">
                              <span className={`w-1.5 h-1.5 rounded-full ${traffic.color}`} />
                              <span className={`text-[10px] font-extrabold ${traffic.textColor}`}>
                                {isArabic ? traffic.labelAr : traffic.labelEn}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${traffic.color}`} style={{ width: `${traffic.level}%` }} />
                              </div>
                              <span className="text-[9px] font-mono font-bold text-gray-400 shrink-0">{traffic.level}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Bookings / Available spaces list */}
                        <div className="flex-1 min-w-0 space-y-2">
                          {filteredBookings.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2">
                              {filteredBookings.map((item, idx) => {
                                const isMine = item.booking.studentId === currentUser?.id;
                                return (
                                  <div 
                                    key={idx} 
                                    className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 text-right sm:text-left ${
                                      isMine 
                                        ? "bg-amber-50/30 border-amber-200/80 shadow-xs" 
                                        : "bg-slate-50/40 border-slate-100"
                                    }`}
                                  >
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${
                                          isMine ? "bg-amber-100 text-amber-800 animate-pulse" : "bg-slate-100 text-slate-600"
                                        }`}>
                                          {isMine ? (isArabic ? "🔑 حجزي" : "🔑 My Booking") : (isArabic ? "🔒 محجوز" : "🔒 Reserved")}
                                        </span>
                                        <span className="font-extrabold text-xs text-gray-800 truncate">
                                          {item.spaceName}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-1">
                                        {isArabic ? "بواسطة:" : "By:"} <span className="font-semibold text-gray-600">{isMine ? (isArabic ? "أنا (حسابي)" : "Me (My Account)") : item.booking.studentName}</span> 
                                        <span className="mx-1 opacity-40">|</span> 
                                        {item.booking.startTime} - {item.booking.endTime}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {isMine && (
                                        <>
                                          {/* Verification Ticket Trigger */}
                                          <button
                                            type="button"
                                            onClick={() => setVerificationSlip({
                                              spaceName: item.spaceName,
                                              studentName: item.booking.studentName,
                                              studentId: item.booking.studentId,
                                              code: item.booking.verificationCode,
                                              qrData: `VERIFY-SPACE-${item.spaceId}-${item.booking.verificationCode}`,
                                              time: `${item.booking.startTime} - ${item.booking.endTime}`
                                            })}
                                            className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-all"
                                            title={isArabic ? "عرض تذكرة الحجز والرمز" : "View Booking Ticket & Code"}
                                          >
                                            <QrCode className="w-3.5 h-3.5" />
                                          </button>

                                          {/* Live Release Action */}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (item.isReal) {
                                                onReleaseSpace(item.spaceId);
                                              } else {
                                                alert(isArabic ? "تم إلغاء الحجز التجريبي بنجاح!" : "Simulated booking cancelled successfully!");
                                              }
                                            }}
                                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold rounded-md transition-all cursor-pointer"
                                          >
                                            {isArabic ? "إلغاء الحجز" : "Cancel"}
                                          </button>
                                        </>
                                      )}
                                      
                                      {!isMine && (
                                        <span className="text-[9px] text-gray-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                          {isArabic ? "مؤكد" : "Verified"}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            // No bookings in this hour slot. Show quick book opportunities!
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-right sm:text-left p-1">
                              <span className="text-[11px] text-slate-400 italic">
                                {isArabic 
                                  ? "جميع المساحات شاغرة ومتاحة للدراسة الفردية أو الجماعية" 
                                  : "All spaces are completely unoccupied & available for study"}
                              </span>
                              
                              {/* Find first available space and allow booking */}
                              {spaces.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 justify-end sm:justify-start">
                                  {spaces.slice(0, 2).map((sp) => (
                                    <button
                                      key={sp.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedSpace(sp);
                                        setStartTime(hour);
                                        setEndTime(addHoursToTime(hour, 2));
                                      }}
                                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-extrabold rounded-md transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>{isArabic ? `حجز ${sp.name}` : `Book ${sp.name}`}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Specialized Equipment Booking & Sandbox Simulation */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
              <Cpu className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-gray-800 text-base">
                  {isArabic ? "حجز الأجهزة التخصصية ومحاكاة بيئات الاختبار" : "Specialized Hardware & Testing Sandboxes"}
                </h3>
                <p className="text-xs text-gray-500">
                  {isArabic ? "حجز عتاد مادي لتطبيقات الشبكات والذكاء الاصطناعي وبطاقات المعالجة المتقدمة" : "Reserve dedicated physical nodes, testing environments, or simulation sets"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div 
                onClick={() => setActiveEquipment("cisco-network")}
                className={`p-4 rounded-xl border text-center space-y-2 cursor-pointer transition-all ${
                  activeEquipment === "cisco-network" ? "bg-indigo-50 border-indigo-300 shadow-xs" : "bg-slate-50 border-gray-100 hover:bg-slate-100/50"
                }`}
              >
                <Laptop className="w-8 h-8 text-indigo-600 mx-auto" />
                <h4 className="font-bold text-gray-800 text-xs">
                  {isArabic ? "مختبر شبكات سيسكو" : "Cisco Sandbox Node"}
                </h4>
                <p className="text-[10px] text-gray-500">
                  {isArabic ? "محاكاة خوادم سيسكو وتوجيه البيانات" : "Simulate live Cisco routers & topology logs"}
                </p>
              </div>

              <div 
                onClick={() => setActiveEquipment("gpu-node")}
                className={`p-4 rounded-xl border text-center space-y-2 cursor-pointer transition-all ${
                  activeEquipment === "gpu-node" ? "bg-indigo-50 border-indigo-300 shadow-xs" : "bg-slate-50 border-gray-100 hover:bg-slate-100/50"
                }`}
              >
                <Cpu className="w-8 h-8 text-indigo-600 mx-auto" />
                <h4 className="font-bold text-gray-800 text-xs">
                  {isArabic ? "عقدة معالجة RTX 4090" : "AI GPU Node"}
                </h4>
                <p className="text-[10px] text-gray-500">
                  {isArabic ? "محطة معالجة للشبكات العصبية العميقة" : "High-end compute node for training neural nets"}
                </p>
              </div>

              <div 
                onClick={() => setActiveEquipment("vr-headset")}
                className={`p-4 rounded-xl border text-center space-y-2 cursor-pointer transition-all ${
                  activeEquipment === "vr-headset" ? "bg-indigo-50 border-indigo-300 shadow-xs" : "bg-slate-50 border-gray-100 hover:bg-slate-100/50"
                }`}
              >
                <Compass className="w-8 h-8 text-indigo-600 mx-auto" />
                <h4 className="font-bold text-gray-800 text-xs">
                  {isArabic ? "عدسات Meta Quest 3" : "Meta Quest VR Kit"}
                </h4>
                <p className="text-[10px] text-gray-500">
                  {isArabic ? "معدات تجربة التطبيقات ثلاثية الأبعاد" : "Interactive VR headset rentals for design evaluation"}
                </p>
              </div>
            </div>

            {activeEquipment !== "none" && (
              <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-right">
                <span className="font-bold text-indigo-900 block mb-1">
                  {isArabic ? "بيان العتاد التخصصي المختار" : "Selected Testing Environment Details"}
                </span>
                <p className="text-indigo-950 mb-3">
                  {activeEquipment === "cisco-network" && (isArabic ? "محاكاة بيئة اختبار كاملة لشهادات CCNA / CCNP تشمل أجهزة توجيه مادية وخوادم محلية." : "Provides actual Cisco Catalyst modules and packet analyzers for testing.")}
                  {activeEquipment === "gpu-node" && (isArabic ? "سعة 24GB VRAM من نوع GDDR6X مخصصة لتدريب النماذج اللغوية الضخمة." : "RTX Nvidia processing station ready with CUDA cores and Anaconda software.")}
                  {activeEquipment === "vr-headset" && (isArabic ? "نظارة واقع افتراضي مع مستشعرات تتبع الحركة، مخصصة لمشروعات التخرج." : "Includes rechargeable hand-held controllers and sensory tracking base.")}
                </p>
                <button
                  onClick={() => {
                    alert(isArabic ? "تم حجز الجهاز التخصصي وتخصيصه لحسابك الأكاديمي بنجاح!" : "Specialized node reserved and allocated to your student ID successfully!");
                    setActiveEquipment("none");
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg cursor-pointer"
                >
                  {isArabic ? "تأكيد حجز العتاد المادي" : "Confirm Equipment Allocation"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Virtual Study Room (غرفة عمل افتراضية) (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between" id="virtual-room">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-gray-800 text-base">
                    {isArabic ? "غرفة العمل الافتراضية للطلاب" : "Virtual Collaborative Study Room"}
                  </h3>
                </div>
                
                <button
                  onClick={() => setShowTaskForm(!showTaskForm)}
                  className="p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg cursor-pointer transition-colors"
                  title={isArabic ? "أضف طلب تعاون" : "Post a collaborative request"}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-gray-500 mb-4 text-right">
                {isArabic 
                  ? "مساحة جماعية لطلاب مشاريع التخرج والأبحاث للبحث عن شركاء تقنيين، تبادل المهارات، والتنسيق البرمجي المشترك."
                  : "A collaborative sandbox for senior graduation teams and researchers to form teams, exchange stack knowledge, and plan milestones."}
              </p>

              {showTaskForm && (
                <form onSubmit={handlePostTask} className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 space-y-3 text-right">
                  <h4 className="font-bold text-xs text-indigo-900 border-b border-indigo-100 pb-1">
                    {isArabic ? "طلب تعاون برمجـي جديد" : "Post Collaborative Task"}
                  </h4>
                  
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">{isArabic ? "اسم الطالب *" : "Student Name *"}</label>
                    <input 
                      type="text" 
                      required 
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      placeholder={isArabic ? "فتحي الكيلاني" : "Fathy El-Kilany"}
                      className="w-full p-2 bg-white border border-gray-200 rounded text-xs text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">{isArabic ? "موضوع المشروع *" : "Project Goal *"}</label>
                    <input 
                      type="text" 
                      required 
                      value={taskProj}
                      onChange={(e) => setTaskProj(e.target.value)}
                      placeholder={isArabic ? "مشروع التخرج: لوحة بيانات ذكية" : "e.g. Smart Dashboard Project"}
                      className="w-full p-2 bg-white border border-gray-200 rounded text-xs text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">{isArabic ? "المهارات التقنية المطلوبة" : "Skills Needed"}</label>
                    <input 
                      type="text" 
                      value={taskSkills}
                      onChange={(e) => setTaskSkills(e.target.value)}
                      placeholder="React, PyTorch, MongoDB..."
                      className="w-full p-2 bg-white border border-gray-200 rounded text-xs text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">{isArabic ? "تفاصيل الطلب *" : "Description *"}</label>
                    <textarea 
                      required 
                      rows={2}
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      placeholder={isArabic ? "ابحث عن مطور قواعد بيانات لمشروعي..." : "Seeking database specialist..."}
                      className="w-full p-2 bg-white border border-gray-200 rounded text-xs text-right"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTaskForm(false)}
                      className="px-2.5 py-1 bg-white border border-gray-200 text-gray-700 text-[10px] font-semibold rounded"
                    >
                      {isArabic ? "إلغاء" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold rounded shadow-sm"
                    >
                      {isArabic ? "نشر الطلب" : "Post Request"}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3.5">
                {groupTasks.map((task) => (
                  <div key={task.id} className="p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl space-y-2 text-right">
                    <div className="flex items-center justify-between border-b border-gray-200/50 pb-1.5">
                      <span className="text-[10px] text-gray-400 font-mono">{task.postedAt}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-800 text-xs">{task.studentName}</span>
                        <div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-[10px]">
                          {task.studentName.charAt(0)}
                        </div>
                      </div>
                    </div>

                    <h4 className="font-bold text-gray-800 text-xs">
                      {task.projectName}
                    </h4>

                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      {task.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1 justify-end">
                      {task.neededSkills.split(",").map((s, i) => (
                        <span key={i} className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-bold">
                          {s.trim()}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => alert(isArabic ? `تم إرسال تنبيه للمطالب ${task.studentName}. سيتم التواصل معك عبر البريد الجامعي!` : `Alert sent to ${task.studentName}. They will contact you shortly!`)}
                        className="w-full py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[10px] rounded-lg transition-colors cursor-pointer text-center"
                      >
                        {isArabic ? "إرسال طلب الانضمام للغرفة" : "Request to Join Team"}
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* POMODORO FOCUS TIMER COMPONENT (مؤقت البومودورو وجلسات التركيز) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-right space-y-4 animate-fade-in" id="pomodoro-focus-timer">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-1">
                {timerActive && (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
                <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3 h-3 text-red-500 fill-red-500" />
                  {isArabic ? `الجلسات المكتملة: ${completedSessions}` : `Sessions: ${completedSessions}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-800 text-sm">
                  {isArabic ? "حلقة التركيز ومؤقت البومودورو" : "Deep-Work Focus Timer"}
                </h3>
                <Timer className="w-4.5 h-4.5 text-red-500" />
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              {isArabic 
                ? "ابدأ جلسة تركيز (بومودورو) لمدة 25 دقيقة للتفاني والعمل المنظم على مشاريع تخرجك أو مراجعك الدراسية."
                : "Manage your study cycles efficiently using the classic Pomodoro productivity system."}
            </p>

            {/* Integration Status Badge */}
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
              <div className="font-mono text-[10px]">
                {verificationSlip ? (
                  <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200 flex items-center gap-1">
                    🟢 {isArabic ? `متصل بقاعة: ${verificationSlip.spaceName}` : `Synced: ${verificationSlip.spaceName}`}
                  </span>
                ) : (
                  <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200 flex items-center gap-1">
                    ⚠️ {isArabic ? "مؤقت مستقل (غير متزامن مع حجز)" : "Independent session"}
                  </span>
                )}
              </div>
              <span className="text-gray-400 font-bold">{isArabic ? "حالة المزامنة الأكاديمية" : "Attendance Sync"}</span>
            </div>

            {/* Timer Modes Row */}
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <button
                onClick={() => setTimerModeAndReset("study")}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                  timerMode === "study" 
                    ? "bg-red-500 text-white border-red-500 shadow-sm" 
                    : "bg-slate-50 text-gray-600 border-gray-100 hover:bg-slate-100"
                }`}
              >
                {isArabic ? "دراسة (٢٥ د)" : "Study (25m)"}
              </button>
              <button
                onClick={() => setTimerModeAndReset("short")}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                  timerMode === "short" 
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" 
                    : "bg-slate-50 text-gray-600 border-gray-100 hover:bg-slate-100"
                }`}
              >
                {isArabic ? "راحة (٥ د)" : "Short (5m)"}
              </button>
              <button
                onClick={() => setTimerModeAndReset("long")}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                  timerMode === "long" 
                    ? "bg-blue-500 text-white border-blue-500 shadow-sm" 
                    : "bg-slate-50 text-gray-600 border-gray-100 hover:bg-slate-100"
                }`}
              >
                {isArabic ? "راحة (١٥ د)" : "Long (15m)"}
              </button>
            </div>

            {/* Time Ticker Display */}
            <div className="py-6 text-center">
              <span className="text-4xl font-bold font-mono tracking-wider text-slate-800 tabular-nums">
                {formatTime(secondsLeft)}
              </span>
            </div>

            {/* Control buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setTimerModeAndReset(timerMode)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-gray-600 rounded-xl transition-all cursor-pointer"
                title={isArabic ? "إعادة ضبط المؤقت" : "Reset Timer"}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setTimerActive(!timerActive)}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                  timerActive 
                    ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100" 
                    : "bg-red-500 hover:bg-red-600 shadow-red-100"
                }`}
              >
                {timerActive ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>{isArabic ? "إيقاف مؤقت" : "Pause Session"}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>{isArabic ? "بدء المذاكرة الآن" : "Start Session"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* MODAL: Booking Form */}
      {selectedSpace && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden">
            
            <div className="bg-blue-600 text-white p-5">
              <h3 className="font-bold text-lg">
                {isArabic ? "استمارة حجز الغرفة والمطالعة" : "Library Space Reservation Form"}
              </h3>
              <p className="text-xs text-blue-100 mt-1">
                {isArabic ? `مساحة الحجز المحددة: ${selectedSpace.name}` : `Reserving: ${selectedSpace.name}`}
              </p>
            </div>

            <form onSubmit={handleBooking} className="p-6 space-y-4 text-right">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isArabic ? "اسم الطالب الرباعي *" : "Student Full Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={isArabic ? "ادخل اسمك الكامل" : "e.g. John Doe"}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isArabic ? "الرقم الجامعي / الأكاديمي *" : "Student Academic ID *"}
                </label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="44... / 43..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isArabic ? "وقت البدء" : "Start Time"}
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isArabic ? "وقت الانتهاء" : "End Time"}
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center"
                  />
                </div>
              </div>

              <p className="text-[10px] text-amber-600 bg-amber-50 rounded-lg p-2.5">
                {isArabic 
                  ? "* سيتم إنتاج كود تحقق رقمي آمن عند الانتهاء. يجب مسحه عند البوابة الإلكترونية أو غلاف الباب لتأكيد الحضور في الموعد المحدد."
                  : "* Secure authentication code will be generated. You must scan it to unlock physical doors."}
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSpace(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  {isArabic ? "تأكيد الحجز واستخراج التصريح" : "Confirm & Extract Pass"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: Booking Verification Slip (تأكيد كود التحقق) */}
      {verificationSlip && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full overflow-hidden">
            
            <div className="bg-emerald-600 text-white p-6 text-center space-y-1">
              <span className="text-[10px] bg-emerald-500 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {isArabic ? "تم تأكيد الحجز والتحقق" : "Verified Booking Pass"}
              </span>
              <h3 className="font-bold text-base mt-2">
                {verificationSlip.spaceName}
              </h3>
              <div className="py-2.5 px-4 bg-emerald-500/30 rounded-xl inline-block mt-2 font-mono text-xl font-bold tracking-widest text-white border border-emerald-400/20">
                {verificationSlip.code}
              </div>
            </div>

            <div className="p-6 text-center space-y-4">
              
              {/* QR Access ticket */}
              <div className="p-4 bg-slate-50 border-2 border-dashed border-gray-200 rounded-xl max-w-[170px] mx-auto flex items-center justify-center">
                <DynamicQRCode value={verificationSlip.qrData} isArabic={isArabic} />
              </div>

              <div className="space-y-2 text-right text-xs">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-bold text-gray-700">{verificationSlip.studentName}</span>
                  <span className="text-gray-400">{isArabic ? "اسم الطالب" : "Student"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-mono text-gray-600">{verificationSlip.studentId}</span>
                  <span className="text-gray-400">{isArabic ? "الرقم الجامعي" : "Student ID"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-semibold text-gray-800">{verificationSlip.time}</span>
                  <span className="text-gray-400">{isArabic ? "الفترة المحجوزة" : "Reserved Time"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-600">{verificationSlip.code}</span>
                  <span className="text-gray-400">{isArabic ? "كود التفعيل" : "Verification Code"}</span>
                </div>
              </div>

              <p className="text-[10px] text-emerald-700 bg-emerald-50 rounded-lg p-2.5 text-right">
                {isArabic 
                  ? "تم تفعيل حجزك! يرجى تقديم رمز التفعيل أو رمز QR لمشرف الصالة أو مسحه عند قفل الباب الإلكتروني للدخول."
                  : "Your space allocation is active! Scan this ticket at the smart doors."}
              </p>

              <button
                onClick={() => setVerificationSlip(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                {isArabic ? "تم حفظ الكود / إغلاق" : "Close & Save Ticket"}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
