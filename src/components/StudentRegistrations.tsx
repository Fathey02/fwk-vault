import { useState, useEffect, FormEvent } from "react";
import { 
  Users, 
  UserPlus, 
  ShieldAlert, 
  Check, 
  ShieldCheck, 
  QrCode, 
  BookOpen, 
  Terminal, 
  Eye, 
  Lock,
  Activity,
  Award,
  Camera,
  LogIn,
  LogOut,
  Clock,
  UserCheck
} from "lucide-react";
import { StudentRegistration } from "../types";
import { Html5Qrcode } from "html5-qrcode";

interface StudentRegistrationsProps {
  isArabic: boolean;
  registrations: StudentRegistration[];
  onRegisterStudent: (reg: Omit<StudentRegistration, "id">) => Promise<void>;
  onUpdateLibraryStatus: (studentRegId: string, inLibrary: boolean, accessTime: string) => Promise<void>;
  currentUser: {
    name: string;
    id: string;
    email: string;
    role: "internal_student" | "external_student" | "admin";
    collegeName?: string;
    department?: string;
  } | null;
}

export default function StudentRegistrations({
  isArabic,
  registrations,
  onRegisterStudent,
  onUpdateLibraryStatus,
  currentUser
}: StudentRegistrationsProps) {
  const [subTab, setSubTab] = useState<"gate" | "enrollment">("gate");
  const [passType, setPassType] = useState<"barcode" | "qrcode">("qrcode");
  const [qrTimestamp, setQrTimestamp] = useState<string>(new Date().toLocaleTimeString());

  // Connection states
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [forceOffline, setForceOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const currentOnlineStatus = isOnline && !forceOffline;

  // Form States
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dept, setDept] = useState("هندسة البرمجيات");
  const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
  const [showMemberCard, setShowMemberCard] = useState<StudentRegistration | null>(null);

  // QR Camera Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [scanSuccess, setScanSuccess] = useState<boolean | null>(null);

  // Gate simulation log
  const [gateLogs, setGateLogs] = useState<Array<{
    time: string;
    studentName: string;
    studentId: string;
    action: "enter" | "exit";
  }>>([
    { time: "14:15:10", studentName: "سليمان العتيبي", studentId: "441002341", action: "enter" },
    { time: "13:40:02", studentName: "يزيد المطيري", studentId: "442001928", action: "enter" },
    { time: "12:30:15", studentName: "يزيد المطيري", studentId: "442001928", action: "exit" }
  ]);

  // Security Simulation State
  const [securityLogs, setSecurityLogs] = useState<Array<{
    time: string;
    event: string;
    status: "intercepted" | "secure" | "audit";
    ip: string;
  }>>([
    { time: "13:38:12", event: "SQL Injection filter active - sanitized string 'UNION SELECT'", status: "intercepted", ip: "192.168.4.52" },
    { time: "13:35:40", event: "Rate Limiter initialized on /api/ai/chat - 15 req/min", status: "secure", ip: "System" },
    { time: "13:32:15", event: "Database payload encryption verified for Student IDs", status: "audit", ip: "Local Host" },
    { time: "13:28:09", event: "Cross-Site Scripting (XSS) input tag stripped on book description", status: "intercepted", ip: "10.0.82.14" },
  ]);

  // Find the registration for the current user
  const currentReg = registrations.find(r => r.studentId === currentUser?.id);

  // Initialize and destroy camera scanner
  useEffect(() => {
    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;

    if (isScanning) {
      const timer = setTimeout(() => {
        if (!isMounted) return;
        try {
          html5QrCode = new Html5Qrcode("gate-qr-reader");
          html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (decodedText) => {
              if (isMounted) {
                handleBarcodeScanned(decodedText);
                setIsScanning(false);
              }
            },
            () => {
              // Frame scan error (ignore verbose)
            }
          ).catch((err) => {
            console.error("Camera access/start error:", err);
            setScanMessage(isArabic ? "فشل فتح الكاميرا. يرجى استخدام زر محاكاة المسح السريع بالأسفل." : "Failed to access camera. Please use the simulated quick scan button below.");
            setScanSuccess(false);
          });
        } catch (e) {
          console.error("Error creating scanner", e);
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        isMounted = false;
        if (html5QrCode) {
          html5QrCode.stop().catch((err) => console.error("Error stopping scanner:", err));
        }
      };
    }
  }, [isScanning]);

  const handleBarcodeScanned = async (text: string) => {
    setScanSuccess(null);
    setScanMessage("");

    // Extract studentId from barcodes or text
    // Accept text that contains student ID (digits) or standard formats
    const matchedDigits = text.match(/\d+/);
    const idToLookup = matchedDigits ? matchedDigits[0] : text.trim();

    const matchedStudent = registrations.find(r => r.studentId === idToLookup);

    if (!matchedStudent) {
      setScanMessage(isArabic ? `عذراً، الرمز الممسوح (${idToLookup}) غير مسجل بقاعدة بيانات كروت العضوية!` : `Error: Scanned code (${idToLookup}) is not enrolled in database!`);
      setScanSuccess(false);
      return;
    }

    // Toggle current library state
    const currentInLib = matchedStudent.inLibrary || false;
    const nextInLib = !currentInLib;
    const timeString = new Date().toTimeString().split(" ")[0];

    try {
      await onUpdateLibraryStatus(matchedStudent.id, nextInLib, timeString);
      setScanSuccess(true);
      setScanMessage(
        isArabic
          ? `✓ تم التعرف بنجاح: ${matchedStudent.studentName}. حالة البوابة: ${nextInLib ? "🟢 تفضل بالدخول" : "🔴 مغادرة آمنة"}`
          : `✓ Scan successful: ${matchedStudent.studentName}. Gate Status: ${nextInLib ? "🟢 WELCOME IN" : "🔴 SECURE LOGOUT"}`
      );

      // Add to gate logs
      setGateLogs([
        { time: timeString, studentName: matchedStudent.studentName, studentId: matchedStudent.studentId, action: nextInLib ? "enter" : "exit" },
        ...gateLogs
      ]);

      // Play simulated beep
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(nextInLib ? 1200 : 800, audioCtx.currentTime); // high beep for enter, lower for exit
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch (e) {
        // Audio context block browser fallback
      }

    } catch (err: any) {
      setScanMessage("Gate sync error: " + err?.message);
      setScanSuccess(false);
    }
  };

  const toggleClub = (club: string) => {
    if (selectedClubs.includes(club)) {
      setSelectedClubs(selectedClubs.filter(c => c !== club));
    } else {
      setSelectedClubs([...selectedClubs, club]);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !studentId || !email) {
      alert(isArabic ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields");
      return;
    }

    try {
      const qrData = `STUDENT-ID-${studentId}-${Date.now().toString().slice(-4)}`;
      
      const regData = {
        studentName: name,
        studentId,
        email,
        phone: phone || "N/A",
        department: dept,
        activities: selectedClubs.length > 0 ? selectedClubs : [isArabic ? "خدمات الاستعارة العامة" : "General Loan Services"],
        registrationDate: new Date().toISOString().split("T")[0],
        qrCodeData: qrData,
        inLibrary: false,
        lastAccessTime: "N/A"
      };

      await onRegisterStudent(regData);

      // Trigger membership pass simulation
      setShowMemberCard({ id: "temp", ...regData });

      // Add to security log
      const timeNow = new Date().toTimeString().split(" ")[0];
      setSecurityLogs([
        { time: timeNow, event: `New encrypted student profile logged for ID ${studentId}`, status: "secure", ip: "Secure Session SSL" },
        ...securityLogs
      ]);

      // Reset
      setName("");
      setStudentId("");
      setEmail("");
      setPhone("");
      setSelectedClubs([]);

    } catch (err) {
      console.error(err);
      alert("Registration failed");
    }
  };

  const studentsInside = registrations.filter(r => r.inLibrary);

  return (
    <div className="space-y-6 animate-fade-in animate-duration-300 text-right font-sans" id="registrations-tab">
      
      {/* Sub tabs navigation */}
      <div className="flex bg-slate-100 p-1 rounded-xl max-w-sm ml-auto gap-1">
        <button
          onClick={() => setSubTab("enrollment")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            subTab === "enrollment" ? "bg-white text-blue-600 shadow-2xs" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {isArabic ? "التسجيل والأمن" : "Enrollment & WAF"}
        </button>
        <button
          onClick={() => setSubTab("gate")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            subTab === "gate" ? "bg-white text-blue-600 shadow-2xs" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {isArabic ? "بوابة الدخول (الباركود)" : "Gate Access (Barcode)"}
        </button>
      </div>

      {/* VIEW: BARCODE GATE CONTROL (HIGHEST PRIORITY USER INTENT) */}
      {subTab === "gate" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: My Digital Barcode Pass & Simulated Scanner */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 justify-between">
              <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-0.5 rounded-full font-bold">
                {isArabic ? "بث حي للبوابة" : "Live Access Gate"}
              </span>
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                {isArabic ? "بطاقة الباركود وبوابة الدخول" : "Digital Barcode Pass & Access"}
              </h3>
            </div>

            {currentUser ? (
              <div className="space-y-6">
                
                {/* CONNECTION SIMULATION SWITCH */}
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${currentOnlineStatus ? "bg-emerald-500 animate-pulse" : "bg-red-500 animate-pulse"}`}></span>
                    <span className="font-bold">{currentOnlineStatus ? (isArabic ? "أنت متصل بالشبكة" : "You are Online") : (isArabic ? "أنت منقطع عن الشبكة" : "You are Offline")}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForceOffline(!forceOffline)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                      forceOffline 
                        ? "bg-amber-100 text-amber-800 border-amber-200" 
                        : "bg-white text-gray-700 border-gray-200 hover:bg-slate-50"
                    }`}
                  >
                    {forceOffline ? (isArabic ? "إلغاء محاكاة الانقطاع" : "Disable Offline Demo") : (isArabic ? "🔌 محاكاة وضع الانقطاع" : "🔌 Simulate Offline Mode")}
                  </button>
                </div>

                {/* 1. MY BARCODE CARD */}
                <div className="p-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <span className={`px-2.5 py-1 text-[9px] rounded-lg font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 ${
                      currentReg?.inLibrary 
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 animate-pulse"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/25"
                    }`}>
                      {currentReg?.inLibrary ? (
                        <>
                          <LogIn className="w-3 h-3" />
                          {isArabic ? "متواجد بالجامعة" : "PRESENT AT UNIVERSITY"}
                        </>
                      ) : (
                        <>
                          <LogOut className="w-3 h-3" />
                          {isArabic ? "خارج الجامعة" : "OUTSIDE UNIVERSITY"}
                        </>
                      )}
                    </span>
                    <div className="text-right">
                      <h4 className="font-extrabold text-xs tracking-tight">{isArabic ? "كليات الحاسبات والمعلومات" : "Colleges of CS & IT"}</h4>
                      <p className="text-[9px] text-indigo-300 block">{isArabic ? "بوابة الهوية الذكية" : "Unified Smart Pass"}</p>
                    </div>
                  </div>

                  {/* PASS TYPE TOGGLE */}
                  <div className="flex justify-center bg-indigo-950/40 p-1 rounded-xl mb-4 max-w-xs mx-auto gap-1 border border-indigo-800/30">
                    <button
                      type="button"
                      onClick={() => setPassType("qrcode")}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        passType === "qrcode" ? "bg-white text-indigo-900 shadow-sm font-extrabold" : "text-indigo-200 hover:text-white"
                      }`}
                    >
                      {isArabic ? "رمز QR للدخول" : "QR Entry Code"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPassType("barcode")}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        passType === "barcode" ? "bg-white text-indigo-900 shadow-sm font-extrabold" : "text-indigo-200 hover:text-white"
                      }`}
                    >
                      {isArabic ? "رمز باركود خطي" : "Linear Barcode"}
                    </button>
                  </div>

                  {passType === "qrcode" ? (
                    /* DYNAMIC HIGH-RESOLUTION QR CODE */
                    <div className="bg-white text-slate-950 p-4 rounded-xl shadow-inner max-w-sm mx-auto space-y-3 text-center relative overflow-hidden group">
                      {!currentOnlineStatus ? (
                        /* OFFLINE FALLBACK MESSAGE */
                        <div className="py-4 px-2 space-y-3 animate-fade-in text-center">
                          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 border border-amber-200">
                            <span className="text-2xl font-bold">⚠️</span>
                          </div>
                          
                          <div className="space-y-1">
                            <h5 className="font-bold text-xs text-amber-800">
                              {isArabic ? "تنبيه: أنت غير متصل بالشبكة" : "Attention: Device Offline"}
                            </h5>
                            <p className="text-[10px] text-gray-500 leading-relaxed max-w-xs mx-auto">
                              {isArabic 
                                ? "أنت خارج الشبكة حالياً. يرجى تفعيل الاتصال بالإنترنت لتوليد وتحديث رمز QR مشفر آمن للدخول. لا يمكن للبوابة الميدانية أو الكشك التحقق من صحة الرمز وهو منقطع عن السحابة."
                                : "You are currently offline. Live internet connection is strictly required to generate, sign, and verify your secure dynamic QR pass at the gateway registry."}
                            </p>
                          </div>

                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center gap-1.5 text-[9px] text-gray-400 font-bold font-mono">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                            <span>{isArabic ? "الحالة: منقطع عن الشبكة" : "CONNECTION: OFFLINE"}</span>
                          </div>
                        </div>
                      ) : (
                        /* ONLINE SCANNER */
                        <>
                          <div className="relative w-44 h-44 mx-auto bg-slate-50 border border-slate-100 rounded-lg p-2 flex items-center justify-center">
                            {/* Animated green laser scanner line */}
                            <div className="absolute left-0 right-0 h-[2px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] top-0 animate-bounce pointer-events-none z-10"></div>
                            
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&color=0f172a&data=${encodeURIComponent(`STUDENT-ID:${currentUser.id}|NAME:${currentUser.name}|TIME:${qrTimestamp}`)}`}
                              alt="Student Gate QR Code"
                              className="w-full h-full object-contain relative z-0 transition-transform group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <p className="font-mono text-xs font-bold text-slate-800 uppercase tracking-widest">
                              {currentUser.id}
                            </p>
                            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-medium">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                              <span>{isArabic ? `الرمز مؤمن ونشط: ${qrTimestamp}` : `Secure token active: ${qrTimestamp}`}</span>
                              <button
                                type="button"
                                onClick={() => setQrTimestamp(new Date().toLocaleTimeString())}
                                className="text-blue-600 hover:text-blue-700 font-bold ml-1 hover:underline cursor-pointer"
                                title={isArabic ? "تحديث الرمز" : "Refresh Code"}
                              >
                                🔄
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    /* HIGH RESOLUTION BARCODE COMPONENT */
                    <div className="bg-white text-slate-950 p-4 rounded-xl shadow-inner max-w-sm mx-auto space-y-2 text-center">
                      <div className="flex justify-center items-stretch h-14 w-full px-4 gap-[2px]">
                        {/* CSS-generated Alternating barcode bars (thick & thin) */}
                        {[
                          3,1,1,2,4,1,2,3,1,1,4,1,2,1,3,2,1,1,2,4,1,2,3,1,1,4,1,2,1,3,2,1,1,2,4,1,2,3,1,1
                        ].map((width, idx) => (
                          <div 
                            key={idx} 
                            className="bg-slate-900" 
                            style={{ width: `${width}px` }} 
                          />
                        ))}
                      </div>
                      <p className="font-mono text-xs font-bold tracking-[6px] text-slate-800 uppercase mt-1">
                        {currentUser.id}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 flex justify-between items-center text-xs text-indigo-200">
                    <div>
                      <span className="text-[9px] text-indigo-400 block">{isArabic ? "القسم" : "Major"}</span>
                      <span className="font-bold text-[11px] text-white">{currentUser.department || "General"}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-indigo-400 block">{isArabic ? "اسم العضو" : "Member Name"}</span>
                      <span className="font-bold text-[11px] text-white">{currentUser.name}</span>
                    </div>
                  </div>
                </div>

                {/* 2. THE SIMULATED SCANNER BEEP TRIGGER */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-right space-y-1">
                    <h5 className="font-bold text-gray-800 text-xs">{isArabic ? "محاكاة المسح والتحقق الفوري" : "Quick simulation check"}</h5>
                    <p className="text-[10px] text-gray-400 leading-normal">
                      {isArabic 
                        ? "اضغط لتسجيل الدخول الفوري عند البوابة. قم بالضغط مجدداً عند الخروج لتسجيل مغادرتك للمكتبة."
                        : "Click to instantly trigger entry beep. Click again when leaving to securely check-out."}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleBarcodeScanned(currentUser.id)}
                    className={`w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm border ${
                      currentReg?.inLibrary 
                        ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-500"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500"
                    }`}
                  >
                    <Activity className="w-4 h-4 animate-pulse" />
                    <span>
                      {currentReg?.inLibrary 
                        ? (isArabic ? "مسح للمغادرة (خروج) 🚪" : "Scan to Exit 🚪") 
                        : (isArabic ? "مسح للدخول (دخول) 🔑" : "Scan to Enter 🔑")}
                    </span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="p-6 bg-red-50 border border-red-100 text-red-600 rounded-xl text-center text-xs">
                {isArabic ? "يرجى تسجيل الدخول لعرض الباركود الخاص بك." : "Please sign in to view your pass barcode."}
              </div>
            )}

            {/* 3. HARDWARE CAMERA SCANNER INTERACTION */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="font-bold text-xs text-gray-700 flex items-center justify-end gap-2">
                {isArabic ? "بوابة المسح الضوئي بالكاميرا" : "Physical Camera Scanner Gate"}
              </h4>
              
              <div className="flex justify-center">
                {isScanning ? (
                  <div className="w-full max-w-sm bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 aspect-video relative flex items-center justify-center shadow-lg">
                    <div id="gate-qr-reader" className="w-full h-full"></div>
                    <div className="absolute inset-0 pointer-events-none border-2 border-blue-500 m-8 animate-pulse rounded-lg flex items-center justify-center">
                      <div className="w-full h-0.5 bg-red-500 animate-bounce"></div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setIsScanning(true); setScanMessage(""); setScanSuccess(null); }}
                    className="w-full max-w-sm py-8 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-gray-200 hover:border-blue-400 text-gray-500 hover:text-blue-600 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Camera className="w-8 h-8" />
                    <span className="text-xs font-bold">{isArabic ? "تشغيل الكاميرا لمسح باركود الهوية" : "Activate Webcam Barcode Scanner"}</span>
                    <span className="text-[10px] text-gray-400">{isArabic ? "يتيح لك مسح الباركود الخاص بك من الجوال" : "Scan barcode displayed on another screen"}</span>
                  </button>
                )}
              </div>

              {/* Scan feedback alert */}
              {scanMessage && (
                <div className={`p-3 border rounded-xl text-xs font-bold text-center animate-pulse ${
                  scanSuccess === true ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                  scanSuccess === false ? "bg-amber-50 border-amber-100 text-amber-700" :
                  "bg-blue-50 border-blue-100 text-blue-700"
                }`}>
                  {scanMessage}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Presence Counters & Logs (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* STUDENTS IN LIBRARY COUNTER */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-right space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="font-mono text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {studentsInside.length}
                </span>
                <h4 className="font-bold text-gray-800 text-xs flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-gray-600" />
                  {isArabic ? "الطلاب المتواجدين حالياً بالمكتبة" : "Students Currently in Library"}
                </h4>
              </div>

              {studentsInside.length === 0 ? (
                <div className="text-center py-6 text-[11px] text-gray-400">
                  {isArabic ? "المكتبة فارغة تماماً حالياً." : "The library is empty at the moment."}
                </div>
              ) : (
                <div className="space-y-2 max-h-[140px] overflow-y-auto">
                  {studentsInside.map(student => (
                    <div key={student.id} className="p-2 bg-emerald-50/50 border border-emerald-100 rounded-lg flex justify-between items-center text-xs">
                      <span className="font-mono text-[10px] text-emerald-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {student.lastAccessTime || "N/A"}
                      </span>
                      <div className="text-right">
                        <p className="font-bold text-slate-800 text-[11px]">{student.studentName}</p>
                        <p className="text-[9px] text-gray-400 font-mono">ID: {student.studentId} | {student.department}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LIVE GATE LOGS */}
            <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-lg border border-slate-800 space-y-4">
              <h4 className="font-bold text-xs font-mono tracking-wider text-slate-300 border-b border-slate-800 pb-2.5">
                GATE LOGS TERMINAL / سجل حركة البوابة
              </h4>
              
              <div className="space-y-2 font-mono text-[10px] max-h-[220px] overflow-y-auto">
                {gateLogs.map((log, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-slate-850 pb-2 text-right">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      log.action === "enter" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-450"
                    }`}>
                      {log.action === "enter" ? (isArabic ? "دخول 🔑" : "CHECK-IN 🔑") : (isArabic ? "خروج 🚪" : "CHECK-OUT 🚪")}
                    </span>
                    <div className="text-right">
                      <p className="text-slate-200 font-bold">{log.studentName} <span className="text-slate-500 font-mono text-[9px]">({log.studentId})</span></p>
                      <p className="text-[9px] text-slate-500">[{log.time}]</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* VIEW: ENROLLMENT & SECURITY LOGS */}
      {subTab === "enrollment" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Side: Registration Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm text-right">
            <div className="flex items-center gap-2.5 mb-6 border-b border-gray-100 pb-3 justify-end sm:justify-start">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-800 text-base">
                {isArabic ? "استمارة عضوية المكتبة والأنشطة الطلابية" : "Library Membership & Student Activity Registry"}
              </h3>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isArabic ? "اسم الطالب الرباعي *" : "Student Full Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isArabic ? "ادخل اسمك الكامل" : "e.g. John Doe"}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isArabic ? "الرقم الأكاديمي / الجامعي *" : "Student Academic ID *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="44... / 43..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isArabic ? "البريد الإلكتروني الجامعي *" : "University Email *"}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="username@college.edu.sa"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-left font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isArabic ? "رقم الجوال (اختياري)" : "Phone Number (Optional)"}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isArabic ? "القسم الأكاديمي" : "Academic Department"}
                  </label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right outline-none"
                  >
                    <option value="علوم الحاسب">{isArabic ? "قسم علوم الحاسب" : "Computer Science (CS)"}</option>
                    <option value="نظم المعلومات">{isArabic ? "قسم نظم المعلومات" : "Information Systems (IS)"}</option>
                    <option value="هندسة البرمجيات">{isArabic ? "قسم هندسة البرمجيات" : "Software Engineering (SWE)"}</option>
                    <option value="هندسة الحاسب">{isArabic ? "قسم هندسة الحاسب" : "Computer Engineering (CE)"}</option>
                    <option value="External">{isArabic ? "زائر من كليات أخرى" : "External Student Guest"}</option>
                  </select>
                </div>
              </div>

              {/* Select student activities / clubs */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  {isArabic ? "الانضمام للأندية والأنشطة التقنية بالمكتبة" : "Enroll in Specialist Tech Clubs & Workshops"}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "ai-club", ar: "نادي الذكاء الاصطناعي", en: "AI Innovation Club" },
                    { id: "cyber-club", ar: "نادي الأمن السيبراني", en: "Cyber Defence Club" },
                    { id: "ecom-master", ar: "معسكر التجارة الرقمية", en: "E-Commerce sandbox" },
                    { id: "code-forces", ar: "نادي الخوارزميات والبرمجة", en: "Competitive Coding" }
                  ].map((club) => (
                    <button
                      type="button"
                      key={club.id}
                      onClick={() => toggleClub(isArabic ? club.ar : club.en)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer outline-none ${
                        selectedClubs.includes(isArabic ? club.ar : club.en)
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs font-bold"
                          : "bg-slate-50 border-gray-100 text-gray-600 hover:bg-slate-100/70"
                      }`}
                    >
                      <span className="text-[11px] block">{isArabic ? club.ar : club.en}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  {isArabic ? "تسجيل العضوية وتصدير كارت المكتبة" : "Register Profile & Generate Digital Card"}
                </button>
              </div>
            </form>
          </div>

          {/* Right Side: Security Center (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col justify-between h-full" id="security-sandbox">
              <div>
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4 justify-end sm:justify-start">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-mono text-xs font-bold text-slate-200 tracking-wider">
                    CYBERSECURITY GATEWAY / تأمين البيانات
                  </h3>
                </div>

                <p className="text-[10px] text-slate-400 font-mono mb-4 text-right">
                  {isArabic 
                    ? "لوحة استخبارات حماية البوابة الأكاديمية ضد اختراقات حقن الاستعلامات (SQLi) والبرمجة عبر المواقع (XSS)."
                    : "Live gateway filter logs demonstrating payload encryption and defense rules preventing injection attacks."}
                </p>

                {/* Status panel */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-slate-800/50 border border-slate-800 rounded-xl flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">DATABASE</span>
                      <span className="text-xs font-bold font-mono text-emerald-400">ENCRYPTED</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/50 border border-slate-800 rounded-xl flex items-center gap-2.5">
                    <Lock className="w-5 h-5 text-blue-400" />
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">WAF FIREWALL</span>
                      <span className="text-xs font-bold font-mono text-blue-400">ACTIVE</span>
                    </div>
                  </div>
                </div>

                {/* Live terminal-like logs */}
                <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 max-h-[190px] overflow-y-auto font-mono text-[9px] text-slate-400 leading-normal">
                  {securityLogs.map((log, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:justify-between items-start border-b border-slate-900 pb-1.5 gap-1 text-right">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                          log.status === "intercepted" ? "bg-rose-500/10 text-rose-400" :
                          log.status === "secure" ? "bg-emerald-500/10 text-emerald-400" :
                          "bg-blue-500/10 text-blue-400"
                        }`}>
                          {log.status === "intercepted" ? "INTERCEPTED" : log.status === "secure" ? "SECURE" : "AUDIT"}
                        </span>
                        <span className="text-slate-500">{log.ip}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400">[{log.time}]</span> {log.event}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 mt-4 text-center">
                <span className="text-[9px] text-slate-500 block font-mono">
                  SECURE AES-256 SENSITIVE FIELD HASHING SYSTEM
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Log of Registered Members in College */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm" id="registered-logs">
        <h4 className="font-bold text-gray-800 text-sm mb-4 text-right">
          {isArabic ? "سجل الطلاب المقيدين بأنشطة المكتبة والنوادي" : "Approved Membership & Student Privileges Log"}
        </h4>
        {registrations.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-400">
            {isArabic ? "لم يتم تسجيل أي طلاب في قاعدة البيانات للأنشطة بعد." : "No registered members cataloged in database yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {registrations.map(reg => (
              <div key={reg.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-gray-100 rounded-xl flex items-center justify-between text-right gap-3">
                <button
                  onClick={() => setShowMemberCard(reg)}
                  className="p-2 bg-white hover:bg-indigo-50 border border-gray-200 text-indigo-600 rounded-xl transition-all cursor-pointer shadow-2xs shrink-0"
                  title={isArabic ? "معاينة كارت العضوية" : "Inspect membership details"}
                >
                  <Eye className="w-4 h-4" />
                </button>
                <div>
                  <h5 className="font-bold text-gray-800 text-xs">{reg.studentName}</h5>
                  <span className="text-[10px] text-gray-400 block font-mono">ID: {reg.studentId} | {reg.department}</span>
                  <div className="flex flex-wrap gap-1 mt-1 justify-end">
                    {reg.activities.map((act, i) => (
                      <span key={i} className="bg-indigo-50 text-indigo-700 text-[8px] font-bold px-1.5 py-0.2 rounded-md">
                        {act}
                      </span>
                    ))}
                  </div>
                  {reg.inLibrary && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full mt-1.5 inline-block">
                      {isArabic ? "🟢 داخل المكتبة" : "🟢 In Library"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Member Card Pass */}
      {showMemberCard && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full overflow-hidden">
            
            {/* Holographic Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 text-center space-y-1">
              <span className="text-[9px] bg-white/20 border border-white/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {isArabic ? "البطاقة الجامعية الذكية" : "Smart Digital Member Pass"}
              </span>
              <h3 className="font-bold text-base mt-2">
                {isArabic ? "نادي تكنولوجيا معلومات المكتبة" : "CS College Library Club"}
              </h3>
              <p className="text-[10px] text-slate-300 font-mono">
                {showMemberCard.qrCodeData}
              </p>
            </div>

            <div className="p-6 text-center space-y-4">
              
              {/* QR Access ticket */}
              <div className="p-4 bg-slate-50 border-2 border-dashed border-gray-200 rounded-xl max-w-[130px] mx-auto flex items-center justify-center">
                <div className="p-2 bg-white border border-gray-100 rounded-lg shadow-sm">
                  <div className="grid grid-cols-5 gap-1.5 w-20 h-20 bg-slate-100 p-1">
                    <div className="bg-slate-950 rounded-sm"></div>
                    <div className="bg-slate-950 rounded-sm"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-950 rounded-sm"></div>
                    <div className="bg-slate-950 rounded-sm"></div>

                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-950 rounded-sm"></div>
                    <div className="bg-slate-950 rounded-sm"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-100"></div>

                    <div className="bg-slate-950 rounded-sm"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-950 rounded-sm"></div>
                    <div className="bg-slate-950 rounded-sm"></div>
                    <div className="bg-slate-950 rounded-sm"></div>

                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-950 rounded-sm"></div>
                    <div className="bg-slate-100"></div>

                    <div className="bg-slate-950 rounded-sm"></div>
                    <div className="bg-slate-150"></div>
                    <div className="bg-slate-950 rounded-sm"></div>
                    <div className="bg-slate-950 rounded-sm"></div>
                    <div className="bg-slate-950 rounded-sm"></div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-right text-xs">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-bold text-gray-800">{showMemberCard.studentName}</span>
                  <span className="text-gray-400">{isArabic ? "اسم الطالب" : "Student"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-mono text-gray-600">{showMemberCard.studentId}</span>
                  <span className="text-gray-400">{isArabic ? "الرقم الجامعي" : "ID"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-semibold text-gray-700">{showMemberCard.department}</span>
                  <span className="text-gray-400">{isArabic ? "التخصص" : "Department"}</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="font-mono text-gray-500">{showMemberCard.registrationDate}</span>
                  <span className="text-gray-400">{isArabic ? "تاريخ الانتساب" : "Registered On"}</span>
                </div>
              </div>

              <div className="space-y-1 text-right">
                <span className="text-[10px] text-gray-400 block">{isArabic ? "الأنشطة والامتيازات النشطة" : "Authorized Clubs & privileges"}</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {showMemberCard.activities.map((act, i) => (
                    <span key={i} className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md">
                      {act}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-[9px] text-indigo-600 bg-indigo-50 rounded-lg p-2.5 text-right leading-normal">
                {isArabic 
                  ? "✓ تم تفعيل كارت العضوية وتأمين بياناتك بتشفير AES-256. يمكنك مسح الكارت للاستفادة من غرف النقاش ومعدات الهاكاثون المتقدمة."
                  : "✓ Membership activated and secured via AES-256 database layers. Scan barcode to access hackathon hardware."}
              </p>

              <button
                onClick={() => setShowMemberCard(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                {isArabic ? "إغلاق التصريح" : "Close Pass"}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
