import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Users, 
  Printer, 
  Megaphone, 
  MessageSquare, 
  Check, 
  Trash2, 
  Clock, 
  AlertCircle, 
  Send, 
  Sliders, 
  FileText,
  UserCheck,
  Smartphone,
  Camera,
  X
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { 
  PrintRequest, 
  BroadcastNotification, 
  ChatMessage, 
  LibrarySpace, 
  StudentRegistration,
  Loan
} from "../types";

interface AdminPortalProps {
  isArabic: boolean;
  spaces: LibrarySpace[];
  registrations: StudentRegistration[];
  printRequests: PrintRequest[];
  notifications: BroadcastNotification[];
  chatMessages: ChatMessage[];
  totalSeats: number;
  onUpdateTotalSeats: (count: number) => Promise<void>;
  loans: Loan[];
  onReturnLoan: (loanId: string, bookId: string) => Promise<void>;
  onUpdatePrintStatus: (id: string, status: PrintRequest["status"]) => Promise<void>;
  onSendNotification: (title: string, content: string, target: "college_only" | "other_only" | "all") => Promise<void>;
  onReplyToChat: (studentId: string, studentName: string, message: string) => Promise<void>;
  onReleaseSpace: (spaceId: string) => Promise<void>;
  onUpdateLibraryStatus: (studentRegId: string, inLibrary: boolean, accessTime: string) => Promise<void>;
  onClearProject: () => Promise<void>;
}

export default function AdminPortal({
  isArabic,
  spaces,
  registrations,
  printRequests,
  notifications,
  chatMessages,
  totalSeats,
  onUpdateTotalSeats,
  loans,
  onReturnLoan,
  onUpdatePrintStatus,
  onSendNotification,
  onReplyToChat,
  onReleaseSpace,
  onUpdateLibraryStatus,
  onClearProject
}: AdminPortalProps) {
  // Tabs within Admin panel
  const [adminTab, setAdminTab] = useState<"stats" | "printing" | "broadcast" | "chat" | "spaces" | "gate" | "system">("stats");

  // Notification form states
  const [notifTitle, setNotifTitle] = useState("");
  const [notifContent, setNotifContent] = useState("");
  const [notifTarget, setNotifTarget] = useState<"college_only" | "other_only" | "all">("all");
  const [notifSuccess, setNotifSuccess] = useState(false);

  // Chat Hub states
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Gate Scanner Simulation States
  const [scanInput, setScanInput] = useState("");
  const [scannedStudent, setScannedStudent] = useState<StudentRegistration | null>(null);
  const [gateScanMessage, setGateScanMessage] = useState("");
  const [gateScanSuccess, setGateScanSuccess] = useState<boolean | null>(null);
  const [isProcessingGate, setIsProcessingGate] = useState(false);

  // System Controls
  const [isWiping, setIsWiping] = useState(false);
  const [wipeSuccess, setWipeSuccess] = useState(false);

  // Camera QR Scanner states
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraScanError, setCameraScanError] = useState("");

  const handleCameraDecoded = async (studentIdToScan: string) => {
    if (!studentIdToScan.trim()) return;

    const reg = registrations.find(
      r => r.studentId.trim().toLowerCase() === studentIdToScan.trim().toLowerCase()
    );

    if (!reg) {
      playBeep("error");
      setGateScanSuccess(false);
      setGateScanMessage(isArabic ? `لم يتم العثور على طالب بالمعرف: ${studentIdToScan}` : `No student matched with ID: ${studentIdToScan}`);
      return;
    }

    try {
      const nextInLibrary = !reg.inLibrary;
      await onUpdateLibraryStatus(reg.id, nextInLibrary, new Date().toLocaleString());
      
      playBeep("success");
      setScannedStudent({ ...reg, inLibrary: nextInLibrary });
      setGateScanSuccess(true);
      setGateScanMessage(
        isArabic 
          ? `[مسح الكاميرا] تم بنجاح! الطالب: (${reg.studentName}) مسجل الآن كـ [${nextInLibrary ? "متواجد بالجامعة" : "خارج الجامعة"}]` 
          : `[Camera Scan] Verified! ${reg.studentName} is now registered as [${nextInLibrary ? "PRESENT AT UNIVERSITY" : "OUTSIDE UNIVERSITY"}]`
      );
    } catch (err) {
      playBeep("error");
      setGateScanSuccess(false);
      setGateScanMessage(isArabic ? "فشل الاتصال بخدمات السحابة" : "Cloud server connection failed");
    }
  };

  useEffect(() => {
    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;

    if (isCameraModalOpen) {
      setCameraScanError("");
      const timer = setTimeout(() => {
        if (!isMounted) return;
        try {
          html5QrCode = new Html5Qrcode("admin-camera-qr-reader");
          html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (decodedText) => {
              if (isMounted) {
                let studentId = decodedText;
                if (decodedText.includes("STUDENT-ID:")) {
                  const part = decodedText.split("|")[0];
                  studentId = part.replace("STUDENT-ID:", "").trim();
                } else if (decodedText.startsWith("STUDENT-ID-")) {
                  const parts = decodedText.split("-");
                  if (parts.length >= 3) {
                    studentId = parts[1];
                  }
                } else {
                  const match = decodedText.match(/[A-Z0-9-]+/i);
                  if (match) {
                    studentId = match[0];
                  }
                }
                handleCameraDecoded(studentId);
                setIsCameraModalOpen(false);
              }
            },
            () => {
              // Frame scan error, ignore
            }
          ).catch((err) => {
            console.error("Camera scan start error:", err);
            setCameraScanError(isArabic ? "تعذر تشغيل الكاميرا. يرجى التأكد من صلاحيات الكاميرا." : "Failed to open camera. Please ensure permissions are granted.");
          });
        } catch (e) {
          console.error("Error creating scanner", e);
        }
      }, 350);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        if (html5QrCode) {
          html5QrCode.stop().catch((err) => console.error("Error stopping admin scanner:", err));
        }
      };
    }
  }, [isCameraModalOpen]);

  // Web synthesized buzzer sound
  const playBeep = (type: "success" | "error") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === "success") {
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else {
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.log("Audio play blocked by browser gesture", e);
    }
  };

  // Group chats by unique students
  const uniqueStudentChats = chatMessages.reduce((acc: { [key: string]: { name: string; messages: ChatMessage[] } }, msg) => {
    if (!acc[msg.studentId]) {
      acc[msg.studentId] = {
        name: msg.studentName,
        messages: []
      };
    }
    acc[msg.studentId].messages.push(msg);
    return acc;
  }, {});

  const studentsList = Object.keys(uniqueStudentChats).map(id => ({
    id,
    name: uniqueStudentChats[id].name,
    lastMessage: uniqueStudentChats[id].messages[uniqueStudentChats[id].messages.length - 1]
  })).sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());

  // Auto select first student if none selected
  useEffect(() => {
    if (!selectedStudentId && studentsList.length > 0) {
      setSelectedStudentId(studentsList[0].id);
    }
  }, [studentsList, selectedStudentId]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !replyText.trim()) return;

    const studentName = uniqueStudentChats[selectedStudentId]?.name || "Student";
    await onReplyToChat(selectedStudentId, studentName, replyText);
    setReplyText("");
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifContent.trim()) return;

    await onSendNotification(notifTitle, notifContent, notifTarget);
    setNotifTitle("");
    setNotifContent("");
    setNotifSuccess(true);
    setTimeout(() => setNotifSuccess(false), 4000);
  };

  const handleSimulateGateScan = async (studentIdToScan: string) => {
    if (!studentIdToScan.trim()) {
      playBeep("error");
      setGateScanSuccess(false);
      setGateScanMessage(isArabic ? "يرجى إدخال الرقم الجامعي أو اختيار طالب أولاً" : "Please input a student ID or select a student first");
      return;
    }

    const reg = registrations.find(
      r => r.studentId.trim().toLowerCase() === studentIdToScan.trim().toLowerCase()
    );

    if (!reg) {
      playBeep("error");
      setGateScanSuccess(false);
      setGateScanMessage(isArabic ? "لم يتم العثور على طالب مسجل بهذا الرقم الجامعي" : "No student found with this ID in the database");
      return;
    }

    setIsProcessingGate(true);
    setGateScanSuccess(null);
    setGateScanMessage(isArabic ? "جاري المسح الضوئي والاتصال بقاعدة البيانات..." : "Scanning QR pass and contacting registry...");

    setTimeout(async () => {
      try {
        const nextInLibrary = !reg.inLibrary;
        await onUpdateLibraryStatus(reg.id, nextInLibrary, new Date().toLocaleString());
        
        playBeep("success");
        setScannedStudent({ ...reg, inLibrary: nextInLibrary });
        setGateScanSuccess(true);
        setGateScanMessage(
          isArabic 
            ? `تم تسجيل الحضور بنجاح! الطالب: (${reg.studentName}) مسجل الآن كـ [${nextInLibrary ? "متواجد بالجامعة" : "خارج الجامعة"}]` 
            : `Scan verified successfully! ${reg.studentName} is now registered as [${nextInLibrary ? "PRESENT AT UNIVERSITY" : "OUTSIDE UNIVERSITY"}]`
        );
      } catch (err) {
        playBeep("error");
        setGateScanSuccess(false);
        setGateScanMessage(isArabic ? "فشل الاتصال بخدمات السحابة" : "Cloud server connection failed");
      } finally {
        setIsProcessingGate(false);
      }
    }, 1500);
  };

  const handleClearDatabase = async () => {
    if (!window.confirm(isArabic ? "هل أنت متأكد تماماً من رغبتك في تصفير كامل قاعدة البيانات وبدء النظام من جديد؟ لا يمكن التراجع عن هذا الإجراء." : "Are you absolutely sure you want to clear the entire database and start over? This action is completely irreversible.")) {
      return;
    }
    try {
      setIsWiping(true);
      await onClearProject();
      setWipeSuccess(true);
      setTimeout(() => setWipeSuccess(false), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsWiping(false);
    }
  };

  // Stats calculation
  const totalStudents = registrations.length;
  const activeBookings = spaces.filter(s => s.status === "booked").length;
  const activePrints = printRequests.filter(r => r.status === "pending" || r.status === "printing").length;
  const unresolvedChats = Object.values(uniqueStudentChats).filter(
    item => item.messages[item.messages.length - 1].senderRole === "student"
  ).length;

  return (
    <div className="space-y-6 animate-fade-in" id="admin-portal-stage">
      
      {/* Admin Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl border border-slate-800 text-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-right">
          <div className="flex items-center gap-2 justify-center md:justify-end">
            <span className="bg-red-500/20 text-red-300 text-[10px] px-2.5 py-0.5 rounded-full border border-red-500/30 font-bold tracking-wide flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {isArabic ? "صلاحيات كاملة للمشرف" : "Full Admin Access"}
            </span>
            <h2 className="font-bold text-lg">
              {isArabic ? "لوحة الإدارة والتحكم الشاملة للمكتبة" : "Smart Library Admin Control Hub"}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {isArabic ? "إدارة طلبات الطباعة، حجز القاعات، محادثات الطلاب والتعميمات العامة للكلية" : "Manage queues, bookings, chats, and customized push notifications."}
          </p>
        </div>
        
        {/* Navigation row within Admin */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setAdminTab("stats")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminTab === "stats" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {isArabic ? "الإحصائيات العامة" : "Overview"}
          </button>
          <button
            onClick={() => setAdminTab("printing")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              adminTab === "printing" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isArabic ? "طابور مشاريع التخرج" : "Print Queue"}</span>
            {activePrints > 0 && (
              <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                {activePrints}
              </span>
            )}
          </button>
          <button
            onClick={() => setAdminTab("broadcast")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              adminTab === "broadcast" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>{isArabic ? "بث الإشعارات والتعميمات" : "Announcements"}</span>
          </button>
          <button
            onClick={() => setAdminTab("chat")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              adminTab === "chat" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isArabic ? "محادثات الطلاب" : "Student Chats"}</span>
            {unresolvedChats > 0 && (
              <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                {unresolvedChats}
              </span>
            )}
          </button>
          <button
            onClick={() => setAdminTab("spaces")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminTab === "spaces" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {isArabic ? "حجوزات القاعات" : "Reservations"}
          </button>
          <button
            onClick={() => setAdminTab("gate")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              adminTab === "gate" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isArabic ? "جهاز مسح QR" : "QR scanner"}</span>
          </button>
          <button
            onClick={() => setAdminTab("system")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              adminTab === "system" ? "bg-red-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isArabic ? "صيانة النظام" : "System Controls"}</span>
          </button>
        </div>
      </div>

      {/* VIEW: STATS OVERVIEW */}
      {adminTab === "stats" && (
        <div className="space-y-6">
          {/* Bento Grid Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-right space-y-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg inline-block">
                <Users className="w-5 h-5" />
              </span>
              <p className="text-xs text-gray-400 font-bold">{isArabic ? "إجمالي الأعضاء المسجلين" : "Total Members"}</p>
              <p className="text-2xl font-bold text-gray-800 font-mono">{totalStudents}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-right space-y-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg inline-block">
                <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
              </span>
              <p className="text-xs text-gray-400 font-bold">{isArabic ? "القاعات والوحدات المحجوزة" : "Booked Space Seats"}</p>
              <p className="text-2xl font-bold text-gray-800 font-mono">{activeBookings}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-right space-y-2">
              <span className="p-2 bg-amber-50 text-amber-600 rounded-lg inline-block">
                <Printer className="w-5 h-5 animate-bounce" />
              </span>
              <p className="text-xs text-gray-400 font-bold">{isArabic ? "طلبات الطباعة النشطة بالطابور" : "Active Print Requests"}</p>
              <p className="text-2xl font-bold text-gray-800 font-mono">{activePrints}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-right space-y-2">
              <span className="p-2 bg-red-50 text-red-600 rounded-lg inline-block">
                <MessageSquare className="w-5 h-5" />
              </span>
              <p className="text-xs text-gray-400 font-bold">{isArabic ? "محادثات الدعم المعلقة" : "Pending Support Chats"}</p>
              <p className="text-2xl font-bold text-gray-800 font-mono">{unresolvedChats}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick action logger logs */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-right space-y-4">
              <h3 className="font-bold text-gray-800 text-sm">{isArabic ? "سجل النشاطات الفورية للنظام" : "Live Ingress Activity Monitor"}</h3>
              <div className="space-y-3 font-mono text-[10px] text-gray-500 max-h-[220px] overflow-y-auto">
                <div className="p-2 bg-slate-50 border-r-2 border-indigo-500 rounded">
                  <span className="text-indigo-600 font-bold">[15:12:08]</span> {isArabic ? "الأدمن بث إشعارات لجميع الطلاب" : "Admin sent broadcast announcement to all students"}
                </div>
                <div className="p-2 bg-slate-50 border-r-2 border-emerald-500 rounded">
                  <span className="text-emerald-600 font-bold">[14:55:22]</span> {isArabic ? "طالب الكلية سجل طلب طباعة لمشروع التخرج" : "Student queued graduation file for A4 hard-binding print"}
                </div>
                <div className="p-2 bg-slate-50 border-r-2 border-amber-500 rounded">
                  <span className="text-amber-600 font-bold">[14:48:30]</span> {isArabic ? "حجز ذكي نشط لقاعة الواقع الافتراضي" : "Smart Booking activated: Space-04 (VR Innovation Lab)"}
                </div>
                <div className="p-2 bg-slate-50 border-r-2 border-indigo-500 rounded">
                  <span className="text-indigo-600 font-bold">[14:32:15]</span> {isArabic ? "طالب خارجي تصفح الفهرس العام للمراجع" : "External college student initiated lookup on recreational library books"}
                </div>
              </div>
            </div>

            {/* Print overview card details */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-right space-y-4">
              <h3 className="font-bold text-gray-800 text-sm">{isArabic ? "توزيع الطلبة حسب نوع الكلية" : "Access Distribution by Student Groups"}</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span className="font-mono">{registrations.filter(r => r.department !== "External").length} ({isArabic ? "طالب الكلية" : "College Students"})</span>
                    <span>{isArabic ? "كليات الحاسبات والمعلومات" : "Colleges of Computer Science and Information"}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span className="font-mono">{registrations.filter(r => r.department === "External").length} ({isArabic ? "طالب كليات أخرى" : "Guest Students"})</span>
                    <span>{isArabic ? "الكليات والأقسام الخارجية" : "Other Colleges / Visitors"}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: PRINTING QUEUE */}
      {adminTab === "printing" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-right">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <span className="text-xs text-gray-400 font-bold font-mono">
              {isArabic ? `إجمالي الطلبات: ${printRequests.length}` : `Total Queued: ${printRequests.length}`}
            </span>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800 text-base">
                {isArabic ? "إدارة طابور طباعة مشاريع التخرج" : "Graduation Projects Printing Queue Manager"}
              </h3>
              <Printer className="w-5 h-5 text-indigo-600" />
            </div>
          </div>

          {printRequests.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">
              {isArabic ? "لا يوجد طلبات طباعة نشطة حالياً في الطابور." : "No print requests in the queue right now."}
            </div>
          ) : (
            <div className="space-y-4">
              {printRequests.map((req) => (
                <div 
                  key={req.id} 
                  className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                    req.status === "pending" ? "bg-slate-50 border-gray-200" :
                    req.status === "printing" ? "bg-blue-50/20 border-blue-200" :
                    req.status === "ready" ? "bg-emerald-50/30 border-emerald-200" :
                    "bg-slate-100 border-gray-200 opacity-60"
                  }`}
                >
                  {/* Action buttons (Left side in RTL) */}
                  <div className="flex gap-2 w-full md:w-auto">
                    {req.status === "pending" && (
                      <button
                        onClick={() => onUpdatePrintStatus(req.id, "printing")}
                        className="flex-1 md:flex-none px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-all"
                      >
                        {isArabic ? "بدء الطباعة" : "Start Printing"}
                      </button>
                    )}
                    {req.status === "printing" && (
                      <button
                        onClick={() => onUpdatePrintStatus(req.id, "ready")}
                        className="flex-1 md:flex-none px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-all"
                      >
                        {isArabic ? "وضع علامة: جاهز للتسليم" : "Mark Ready"}
                      </button>
                    )}
                    {req.status === "ready" && (
                      <button
                        onClick={() => onUpdatePrintStatus(req.id, "completed")}
                        className="flex-1 md:flex-none px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isArabic ? "إكمال وتسليم" : "Mark Delivered"}</span>
                      </button>
                    )}
                    {req.status === "completed" && (
                      <span className="text-[10px] text-gray-500 font-bold bg-gray-100 border border-gray-200 px-3 py-1 rounded-lg">
                        ✓ {isArabic ? "تم تسليمه للطالب" : "Completed & Delivered"}
                      </span>
                    )}
                  </div>

                  {/* Core Details (Right side in RTL) */}
                  <div className="space-y-1 md:text-right w-full md:w-auto">
                    <div className="flex items-center gap-2 justify-end">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        req.status === "pending" ? "bg-amber-100 text-amber-700" :
                        req.status === "printing" ? "bg-blue-100 text-blue-700 animate-pulse" :
                        req.status === "ready" ? "bg-emerald-100 text-emerald-700" :
                        "bg-gray-200 text-gray-700"
                      }`}>
                        {req.status === "pending" ? (isArabic ? "قيد الانتظار" : "Pending") :
                         req.status === "printing" ? (isArabic ? "جاري الطباعة والتجليد" : "Printing...") :
                         req.status === "ready" ? (isArabic ? "جاهز للاستلام بالمكتبة" : "Ready for Pickup") :
                         (isArabic ? "مكتمل ومسلّم" : "Completed")}
                      </span>
                      <h4 className="font-bold text-gray-800 text-sm">{req.projectTitle}</h4>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 justify-end">
                      <span>{isArabic ? "حجم الورق" : "Size"}: <span className="font-mono text-gray-700 font-bold">{req.paperSize}</span></span>
                      <span>{isArabic ? "التجليد" : "Cover"}: <span className="text-gray-700 font-medium">{
                        req.coverType === "hardcover" ? (isArabic ? "فاخر كرتون" : "Hardcover") :
                        req.coverType === "softcover" ? (isArabic ? "ورقي ملون" : "Softcover") :
                        (isArabic ? "سلك بلاستيك" : "Plastic spiral")
                      }</span></span>
                      <span>{isArabic ? "النسخ" : "Copies"}: <span className="font-mono text-gray-700 font-bold">{req.copies}</span></span>
                      <span>{isArabic ? "الطالب" : "Student"}: <span className="text-gray-700 font-semibold">{req.studentName} ({req.studentId})</span></span>
                    </div>

                    {req.extraNotes && (
                      <p className="text-[11px] text-indigo-600 bg-indigo-50/50 rounded-lg p-2 mt-1.5">
                        <span className="font-bold">{isArabic ? "ملاحظات الطالب: " : "Notes: "}</span>{req.extraNotes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: BROADCAST ANNOUNCEMENTS */}
      {adminTab === "broadcast" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 text-right">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-bold">{isArabic ? "إرسال تعميمات فورية تظهر لجميع المسجلين" : "Broadcast alerts in real-time"}</span>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800 text-base">
                {isArabic ? "مركز بث الإعلانات والتعميمات" : "Announcements Broadcast Center"}
              </h3>
              <Megaphone className="w-5 h-5 text-indigo-600" />
            </div>
          </div>

          {notifSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center justify-end gap-2 animate-bounce">
              <span>{isArabic ? "تم بث التعميم بنجاح ووصوله لجميع الهواتف والواجهات النشطة في الثواني الأخيرة!" : "Broadcast sent successfully to all active client streams!"}</span>
              <Check className="w-4 h-4" />
            </div>
          )}

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs text-gray-500 font-bold block">{isArabic ? "عنوان التعميم الإرشادي" : "Announcement Title"}</label>
                <input 
                  type="text" 
                  required
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder={isArabic ? "مثال: هام: تمديد ساعات العمل بالمكتبة الرقمية" : "e.g., Extension of Digital Library hours"}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 font-bold block">{isArabic ? "الشريحة المستهدفة بالتعميم" : "Target Audience Scope"}</label>
                <select
                  value={notifTarget}
                  onChange={(e) => setNotifTarget(e.target.value as any)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-right font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">{isArabic ? "الجميع (طلبة كليتنا والكليات الخارجية)" : "All Students (Internal & Guest)"}</option>
                  <option value="college_only">{isArabic ? "طلبة كلية علوم الحاسب فقط" : "Internal CS Students Only"}</option>
                  <option value="other_only">{isArabic ? "طلبة الكليات الأخرى / الزوار فقط" : "Other College Guest Students Only"}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-500 font-bold block">{isArabic ? "نص الإعلان والرسالة بالكامل" : "Notification Content"}</label>
              <textarea
                rows={3}
                required
                value={notifContent}
                onChange={(e) => setNotifContent(e.target.value)}
                placeholder={isArabic ? "اكتب الإعلان هنا..." : "Write announcement details here..."}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isArabic ? "بث الإشعار الآن فوراً" : "Publish & Broadcast Now"}</span>
            </button>
          </form>

          {/* Past Broadcast History */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <h4 className="font-bold text-gray-800 text-sm">{isArabic ? "الأرشيف والتعميمات السابقة" : "Broadcast Archive"}</h4>
            {notifications.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">{isArabic ? "لم يتم إرسال تعميمات من قبل." : "No announcements found."}</p>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-right space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-400 font-mono">{notif.createdAt}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.2 rounded font-bold uppercase ${
                          notif.targetAudience === "all" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                          notif.targetAudience === "college_only" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                          "bg-amber-50 text-amber-600 border border-amber-100"
                        }`}>
                          {notif.targetAudience === "all" ? (isArabic ? "جميع المستخدمين" : "All users") :
                           notif.targetAudience === "college_only" ? (isArabic ? "طلبة الكلية فقط" : "College students") :
                           (isArabic ? "طلبة كليات خارجية" : "Guest students")}
                        </span>
                        <span className="text-gray-500 font-bold">{notif.senderName}</span>
                      </div>
                    </div>
                    <h5 className="font-bold text-gray-800 text-xs">{notif.title}</h5>
                    <p className="text-[11px] text-gray-600 leading-relaxed">{notif.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: INTERACTIVE SUPPORT CHAT HUB */}
      {adminTab === "chat" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-[500px] flex flex-col md:flex-row-reverse" id="admin-chat-hub">
          {/* Right Panel: Students list (Sidebar) */}
          <div className="w-full md:w-64 border-l border-gray-100 flex flex-col bg-slate-50 text-right">
            <div className="p-4 border-b border-gray-100 font-bold text-xs text-gray-800 bg-white">
              {isArabic ? "محادثات الطلاب النشطة" : "Active Student Conversations"}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {studentsList.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  {isArabic ? "لا يوجد رسائل دعم طلابي حالياً." : "No student support chats."}
                </div>
              ) : (
                studentsList.map((st) => {
                  const isUnread = st.lastMessage.senderRole === "student";
                  return (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStudentId(st.id)}
                      className={`w-full p-3 rounded-xl text-right transition-all flex flex-col gap-1 cursor-pointer ${
                        selectedStudentId === st.id 
                          ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                          : "hover:bg-slate-100 text-gray-700 bg-white border border-gray-100"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                          selectedStudentId === st.id ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
                        }`}>
                          {st.id}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isUnread && (
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                          )}
                          <span className="font-bold text-xs">{st.name}</span>
                        </div>
                      </div>
                      <p className={`text-[10px] truncate w-full ${
                        selectedStudentId === st.id ? "text-blue-100" : "text-gray-400"
                      }`}>
                        {st.lastMessage.message}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Left Panel: Selected Student chat box messages stream */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedStudentId ? (
              <>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 text-right">
                  <div className="text-xs text-gray-400 font-mono font-bold">
                    ID: {selectedStudentId}
                  </div>
                  <div className="font-bold text-gray-800 text-sm">
                    {isArabic ? "التواصل النشط مع: " : "Communicating with: "}{uniqueStudentChats[selectedStudentId]?.name}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 flex flex-col justify-end">
                  {uniqueStudentChats[selectedStudentId]?.messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col max-w-[80%] ${
                        msg.senderRole === "admin" ? "mr-auto items-start" : "ml-auto items-end"
                      }`}
                    >
                      <div className={`p-3 rounded-2xl text-xs leading-relaxed text-right ${
                        msg.senderRole === "admin" 
                          ? "bg-slate-100 text-gray-800 rounded-tl-none" 
                          : "bg-blue-600 text-white rounded-tr-none"
                      }`}>
                        {msg.message}
                      </div>
                      <span className="text-[9px] text-gray-400 font-mono mt-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendReply} className="p-3 border-t border-gray-100 bg-slate-50 flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    {isArabic ? "إرسال" : "Reply"}
                  </button>
                  <input
                    type="text"
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={isArabic ? "اكتب رد الإدارة الأكاديمية هنا..." : "Type official academic reply..."}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 text-xs space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300" />
                <p>{isArabic ? "الرجاء تحديد طالب من القائمة الجانبية لبدء المحادثة." : "Please select a student conversation."}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: SPACES & CAPACITY MANAGEMENT */}
      {adminTab === "spaces" && (
        <div className="space-y-6 text-right">
          
          {/* SECTION 1: ADJUST SEAT CAPACITY */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-bold">{isArabic ? "تعديل عدد مقاعد المكتبة المتاحة للطلبة" : "Adjust public library seats limit"}</span>
              <h3 className="font-bold text-gray-800 text-sm">
                {isArabic ? "⚙️ التحكم بالطاقة الاستيعابية للمقاعد" : "⚙️ Adjust Library Seats Capacity"}
              </h3>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateTotalSeats(Math.max(1, totalSeats - 1))}
                  className="w-10 h-10 bg-white hover:bg-slate-100 rounded-xl border border-gray-200 flex items-center justify-center font-bold text-gray-800 text-base shadow-xs transition-colors cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={totalSeats}
                  onChange={(e) => onUpdateTotalSeats(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-xl text-center text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => onUpdateTotalSeats(totalSeats + 1)}
                  className="w-10 h-10 bg-white hover:bg-slate-100 rounded-xl border border-gray-200 flex items-center justify-center font-bold text-gray-800 text-base shadow-xs transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>

              <div className="text-center sm:text-right">
                <p className="text-xs font-bold text-gray-800">{isArabic ? "الحد الأقصى للمقاعد المتاحة حالياً" : "Current Active Seat Capacity"}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {isArabic 
                    ? "التحكم في سعة المقاعد يغير مباشرة قيمة العداد المعروض في الترويسة الرئيسية للمكتبة." 
                    : "Modifying this directly impacts the available seats denominator shown on the main header."}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: CANCEL STUDY SPACE RESERVATIONS */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-bold">{isArabic ? "تحرير وتفريغ حجوزات المختبرات والقاعات" : "Force-release space slots"}</span>
              <h3 className="font-bold text-gray-800 text-sm">
                {isArabic ? "📅 حجوزات القاعات والمساحات الدراسية" : "📅 Study Space Reservations"}
              </h3>
            </div>

            <div className="space-y-3">
              {spaces.map((sp) => (
                <div 
                  key={sp.id} 
                  className={`p-4 rounded-xl border flex justify-between items-center ${
                    sp.status === "booked" ? "bg-amber-50/30 border-amber-200" : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <div>
                    {sp.status === "booked" && sp.currentBooking ? (
                      <button
                        onClick={() => onReleaseSpace(sp.id)}
                        className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                      >
                        {isArabic ? "إلغاء حجز القاعة" : "Cancel Reservation"}
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                        {isArabic ? "متاحة" : "Available"}
                      </span>
                    )}
                  </div>

                  <div className="text-right space-y-0.5">
                    <h4 className="font-bold text-gray-800 text-xs">{sp.name}</h4>
                    {sp.status === "booked" && sp.currentBooking ? (
                      <p className="text-[10px] text-gray-500">
                        {isArabic ? "محجوزة بواسطة: " : "Booked by: "}
                        <span className="font-bold text-slate-700">{sp.currentBooking.studentName}</span> ({sp.currentBooking.studentId}) | {sp.currentBooking.startTime} - {sp.currentBooking.endTime}
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-400">{isArabic ? "متاحة للحجز العام للطلبة المؤهلين" : "Open for booking"}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: CANCEL BOOK LOANS / RESERVATIONS */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-bold">{isArabic ? "قائمة الكتب المستعارة حالياً من قبل الطلبة وإمكانية إلغائها" : "Manage active book borrow contracts"}</span>
              <h3 className="font-bold text-gray-800 text-sm">
                {isArabic ? "📚 استعارات وحجوزات الكتب" : "📚 Book Reservations & Loans"}
              </h3>
            </div>

            {loans.filter(l => l.status === "active").length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">
                {isArabic ? "لا توجد استعارات أو حجوزات كتب نشطة حالياً." : "No active book loans or reservations found."}
              </div>
            ) : (
              <div className="space-y-3">
                {loans.filter(l => l.status === "active").map((loan) => (
                  <div key={loan.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center">
                    <button
                      onClick={() => onReturnLoan(loan.id, loan.bookId)}
                      className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                    >
                      {isArabic ? "إلغاء الاستعارة / إرجاع" : "Cancel Loan / Return"}
                    </button>

                    <div className="text-right space-y-0.5">
                      <h4 className="font-bold text-gray-800 text-xs">{loan.bookTitle}</h4>
                      <p className="text-[10px] text-gray-500">
                        {isArabic ? "مستعار بواسطة: " : "Borrowed by: "}
                        <span className="font-bold text-slate-700">{loan.studentName}</span> ({loan.studentId})
                      </p>
                      <p className="text-[9px] text-gray-400 font-mono">
                        {isArabic ? "تاريخ الاستحقاق: " : "Due Date: "}{loan.dueDate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW: GATE PASS QR SCANNER SIMULATOR */}
      {adminTab === "gate" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs text-gray-400 font-bold">
                {isArabic ? "محاكاة ماسح الحضور والبوابة الميدانية للتحقق الفوري" : "Simulate real-world gate scanner terminal"}
              </span>
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-600" />
                {isArabic ? "💻 محاكي جهاز مسح البوابة الذكية" : "💻 Secure Gate Entry Scanner Terminal"}
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Right Column: Active Scanner Interface */}
              <div className="lg:col-span-5 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between min-h-[350px]">
                <div className="text-center space-y-2">
                  <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                    {isArabic ? "بوابة الجامعة الذكية" : "Unified Campus Gate"}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {isArabic ? "قم بمسح رمز QR أو إدخال الكود لتسجيل الدخول الفوري" : "Scan dynamic QR or type Student ID"}
                  </p>
                </div>

                {/* Simulated Camera Scan HUD */}
                <div className="relative w-44 h-44 mx-auto bg-slate-950 border-2 border-indigo-500/30 rounded-2xl p-4 flex flex-col items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/20 to-transparent"></div>
                  
                  {isProcessingGate ? (
                    <div className="space-y-2 text-center animate-pulse z-10">
                      <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <span className="text-[9px] font-mono text-indigo-300 uppercase tracking-widest">{isArabic ? "جاري المعالجة..." : "PROCESSING..."}</span>
                    </div>
                  ) : gateScanSuccess ? (
                    <div className="text-center space-y-1 animate-bounce z-10">
                      <span className="text-3xl">✅</span>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{isArabic ? "تم التحقق" : "VERIFIED"}</p>
                    </div>
                  ) : gateScanSuccess === false ? (
                    <div className="text-center space-y-1 animate-shake z-10">
                      <span className="text-3xl">❌</span>
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">{isArabic ? "فشل المسح" : "FAILED"}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-center z-10">
                      <Smartphone className="w-8 h-8 text-indigo-400 mx-auto animate-bounce" />
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">{isArabic ? "جاهز للمسح" : "READY FOR PASS"}</span>
                    </div>
                  )}

                  {/* Aesthetic grid laser overlay */}
                  <div className="absolute inset-0 border-r border-indigo-500/5 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none"></div>
                  {/* Moving scanner line */}
                  <div className="absolute left-0 right-0 h-[2px] bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] top-0 animate-bounce pointer-events-none"></div>
                </div>

                {/* Status Console Text */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[10px] text-slate-300 text-center min-h-[50px] flex items-center justify-center">
                  {gateScanMessage || (isArabic ? "بانتظار مسح الهوية الذكية..." : "Awaiting secure smart pass scan...")}
                </div>
              </div>

              {/* Left Column: Input and Quick Student List */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* LIVE WEB CAMERA QR SCANNING BOARD */}
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-right">
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-indigo-950">
                      {isArabic ? "📷 المسح الضوئي المباشر بالكاميرا" : "📷 Live Device QR Camera Scanner"}
                    </h4>
                    <p className="text-[10px] text-indigo-700 leading-relaxed">
                      {isArabic 
                        ? "قم بتفعيل كاميرا الويب أو الجوال لمسح الباركود ورموز QR فوراً من شاشات الطلاب لتسجيل الدخول." 
                        : "Turn on your device camera to scan and authenticate student dynamic QR codes instantly."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCameraModalOpen(true)}
                    className="self-end sm:self-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isArabic ? "تشغيل الكاميرا" : "Scan with Camera"}</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 text-right">
                    {isArabic ? "الرقم الجامعي للطالب (أو كتابة الهوية)" : "Student ID / Code"}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isProcessingGate}
                      onClick={() => handleSimulateGateScan(scanInput)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
                    >
                      <span>{isArabic ? "مسح وتسجيل دخول" : "Scan QR / Beep"}</span>
                    </button>
                    <input
                      type="text"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      placeholder={isArabic ? "أدخل الرقم الجامعي (مثال: CS-2026-001)" : "Enter Student ID (e.g. CS-2026-001)"}
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none text-right"
                    />
                  </div>
                </div>

                {/* QUICK LIST OF ENROLLED STUDENTS FOR ADMIN CONVENIENCE */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 text-right">
                    {isArabic ? "الطلاب المقيدون (انقر للاختيار والتحقق السريع)" : "Enrolled Students (Click to scan instantly)"}
                  </h4>
                  <div className="max-h-[220px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 bg-slate-50">
                    {registrations.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-400">
                        {isArabic ? "لا يوجد طلاب مسجلون حالياً في قاعدة البيانات." : "No registered students found."}
                      </div>
                    ) : (
                      registrations.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => {
                            setScanInput(st.studentId);
                            handleSimulateGateScan(st.studentId);
                          }}
                          className="p-3 hover:bg-white transition-all cursor-pointer flex items-center justify-between text-xs"
                        >
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            st.inLibrary 
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}>
                            {st.inLibrary ? (isArabic ? "متواجد بالجامعة" : "PRESENT") : (isArabic ? "خارج الجامعة" : "OUTSIDE")}
                          </span>
                          
                          <div className="text-right">
                            <span className="font-bold text-gray-800 block">{st.studentName}</span>
                            <span className="text-[10px] text-gray-400 font-mono">{st.studentId} | {st.department}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-800 leading-relaxed text-right">
                  {isArabic 
                    ? "💡 بمجرد تسجيل الطالب كـ [متواجد بالجامعة] عبر البوابة، يتم تلقائياً تثبيت وتأكيد كافة حجوزاته المعلقة (سواءً مقعد قراءة أو استعارة كتاب خارجي) دون الحاجة لإجراءات إضافية."
                    : "💡 Once the student is marked as [PRESENT] at the campus gate, any external reservations they made (such as library seats or book loan holds) are instantly secured and authenticated."}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SYSTEM MAINTENANCE (DATABASE RESET) */}
      {adminTab === "system" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-red-100 shadow-sm space-y-6">
            <div className="border-b border-red-50 pb-3 flex items-center justify-between">
              <span className="text-xs text-red-500 font-bold">
                {isArabic ? "منطقة أمنية حساسة - تصفير كامل لبيانات النظام" : "Sensitive administration zone - entire system restart"}
              </span>
              <h3 className="font-bold text-red-600 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 animate-pulse" />
                {isArabic ? "⚠️ تصفير قاعدة البيانات بالكامل (بداية جديدة للمشروع)" : "⚠️ Complete Project Cancellation & Reset"}
              </h3>
            </div>

            <div className="p-5 bg-red-50 border border-red-100 rounded-2xl space-y-3 text-right">
              <h4 className="font-bold text-red-800 text-sm">
                {isArabic ? "⛔ تحذير أمني هام وعاجل للمشرف:" : "⛔ CRITICAL WARNING FOR ADMINISTRATORS:"}
              </h4>
              <p className="text-xs text-red-700 leading-relaxed">
                {isArabic 
                  ? "الضغط على الزر أدناه سيقوم بحذف وإلغاء كافة السجلات المخزنة في السحابة فوراً وبشكل نهائي. يشمل ذلك: حسابات وبطاقات الطلاب، طابور الطباعة للمشاريع، محادثات الدردشة، الإشعارات العامة، وحجوزات الكتب والقاعات. سيتم الحفاظ على البنية الأساسية للمكتبة وتوريد 5 مقاعد شاغرة للبداية."
                  : "Performing a clear database operation will instantly purge all live tables in Firestore. This includes: Student Profiles, Print Queue contracts, Chat Histories, Push Announcements, and Seat holds. The library core layout and a default capacity of 5 seats will be seeded."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <div>
                {wipeSuccess && (
                  <span className="text-xs text-emerald-600 font-bold animate-pulse block text-center sm:text-left">
                    {isArabic ? "✅ تم تصفير كافة المجموعات بالسحابة بنجاح وبدء تشغيل نظيف!" : "✅ System reset accomplished! Clean database loaded."}
                  </span>
                )}
              </div>
              <button
                type="button"
                disabled={isWiping}
                onClick={handleClearDatabase}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 ${
                  isWiping ? "bg-slate-400" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isWiping ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>{isArabic ? "جاري تصفير السجلات..." : "Wiping all databases..."}</span>
                  </>
                ) : (
                  <>
                    <Sliders className="w-4 h-4" />
                    <span>{isArabic ? "تصفير وإعادة تهيئة النظام كاملاً" : "Execute Complete Project Reset"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAMERA SCANNER MODAL */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fade-in text-right">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-md w-full overflow-hidden p-6 relative space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <button
                onClick={() => setIsCameraModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-gray-800">
                  {isArabic ? "كاميرا مسح الـ QR الذكية" : "Unified Gate QR Reader"}
                </h3>
              </div>
            </div>

            {/* Camera Frame Area */}
            <div className="relative aspect-square max-w-sm mx-auto bg-slate-950 rounded-2xl overflow-hidden border-2 border-indigo-600 flex flex-col items-center justify-center">
              <div id="admin-camera-qr-reader" className="w-full h-full object-cover"></div>
              
              {/* Overlay laser scan guide */}
              <div className="absolute inset-0 border-r border-indigo-500/5 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none"></div>
              <div className="absolute left-0 right-0 h-[2.5px] bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)] top-0 animate-bounce pointer-events-none"></div>
              
              {/* Scan indicator overlay HUD */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="bg-slate-900/80 text-white text-[10px] px-3 py-1 rounded-full font-mono font-bold tracking-wider">
                  {isArabic ? "قم بوضع كود الطالب أمام العدسة" : "Position student QR pass in frame"}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {cameraScanError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{cameraScanError}</span>
              </div>
            )}

            {/* Actions / Instructions */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsCameraModalOpen(false)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {isArabic ? "إلغاء وإغلاق" : "Cancel & Close"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
