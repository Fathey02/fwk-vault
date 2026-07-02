import { useState, FormEvent } from "react";
import { 
  Lock, 
  UserPlus, 
  ShieldCheck, 
  Globe, 
  BookOpen, 
  ArrowLeftRight,
  Activity
} from "lucide-react";
import { StudentRegistration } from "../types";

interface AuthPageProps {
  isArabic: boolean;
  setIsArabic: (val: boolean) => void;
  onLogin: (session: {
    name: string;
    id: string;
    email: string;
    role: "internal_student" | "external_student" | "admin";
    collegeName?: string;
    department?: string;
  }) => void;
  onRegister: (reg: Omit<StudentRegistration, "id">) => Promise<StudentRegistration>;
  registrations: StudentRegistration[];
}

export default function AuthPage({
  isArabic,
  setIsArabic,
  onLogin,
  onRegister,
  registrations
}: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // Login Form States
  const [loginIdOrEmail, setLoginIdOrEmail] = useState("");
  const [loginError, setLoginError] = useState("");

  // Registration Form States
  const [regName, setRegName] = useState("");
  const [regId, setRegId] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regDept, setRegDept] = useState("هندسة البرمجيات");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginIdOrEmail.trim()) {
      setLoginError(isArabic ? "يرجى إدخال البريد الإلكتروني أو الرقم الجامعي" : "Please enter your Email or Student ID");
      return;
    }

    const query = loginIdOrEmail.trim().toLowerCase();

    // Admin bypass check
    if (query === "admin" || query === "admin@college.edu.sa") {
      onLogin({
        name: isArabic ? "مشرف النظام الموحد" : "Unified System Admin",
        id: "admin-999",
        email: "admin@college.edu.sa",
        role: "admin"
      });
      return;
    }

    // Search inside the registered students
    const matched = registrations.find(
      r => r.studentId === query || r.email.toLowerCase() === query
    );

    if (matched) {
      onLogin({
        name: matched.studentName,
        id: matched.studentId,
        email: matched.email,
        role: matched.department === "External" ? "external_student" : "internal_student",
        collegeName: matched.department === "External" ? "الكليات والأقسام الخارجية" : "كليات الحاسبات والمعلومات",
        department: matched.department
      });
    } else {
      // Allow instant smart guest registration/login bypass if needed or show error
      setLoginError(
        isArabic 
          ? "لم يتم العثور على الحساب. يرجى إنشاء حساب جديد أولاً!" 
          : "Account not found. Please register as a new member first!"
      );
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess(false);

    if (!regName || !regId || !regEmail) {
      setRegError(isArabic ? "يرجى تعبئة الحقول الأساسية المطلوبة" : "Please fill in all primary required fields");
      return;
    }

    // Check duplicate Student ID
    const duplicate = registrations.some(r => r.studentId === regId.trim());
    if (duplicate) {
      setRegError(isArabic ? "هذا الرقم الجامعي مسجل بالفعل!" : "This Student ID is already registered!");
      return;
    }

    try {
      const qrData = `STUDENT-ID-${regId.trim()}-${Date.now().toString().slice(-4)}`;
      const studentData = {
        studentName: regName,
        studentId: regId.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim() || "N/A",
        department: regDept,
        activities: [isArabic ? "خدمات الاستعارة العامة" : "General Loan Services"],
        registrationDate: new Date().toISOString().split("T")[0],
        qrCodeData: qrData,
        inLibrary: false,
        lastAccessTime: "N/A"
      };

      const newReg = await onRegister(studentData);
      setRegSuccess(true);
      
      // Auto login after registration
      setTimeout(() => {
        onLogin({
          name: newReg.studentName,
          id: newReg.studentId,
          email: newReg.email,
          role: regDept === "External" ? "external_student" : "internal_student",
          collegeName: regDept === "External" ? "الكليات والأقسام الخارجية" : "كليات الحاسبات والمعلومات",
          department: regDept
        });
      }, 1000);

    } catch (err: any) {
      setRegError(err?.message || "Failed to register student");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-right font-sans" id="auth-page">
      
      {/* Header Language Switcher */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => setIsArabic(!isArabic)}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-gray-200 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <Globe className="w-4 h-4 text-slate-500" />
          <span>{isArabic ? "English" : "العربية"}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center text-white">
            <BookOpen className="w-8 h-8" />
          </div>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          {isArabic ? "مكتبة FWK Library الذكية" : "Smart FWK Library"}
        </h2>
        <p className="mt-2 text-center text-xs text-gray-500">
          {isArabic ? "كليات الحاسبات والمعلومات - بوابة الموارد الأكاديمية والمطالعة" : "Colleges of Computer Science and Information - Academic Portal"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-100 rounded-3xl border border-gray-100 sm:px-10 space-y-6">
          
          {/* Tabs Selector */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
            <button
              onClick={() => { setActiveTab("register"); setLoginError(""); setRegError(""); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "register" ? "bg-white text-blue-600 shadow-xs" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {isArabic ? "حساب طالب جديد" : "New Registration"}
            </button>
            <button
              onClick={() => { setActiveTab("login"); setLoginError(""); setRegError(""); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "login" ? "bg-white text-blue-600 shadow-xs" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {isArabic ? "تسجيل الدخول" : "Student / Admin Login"}
            </button>
          </div>

          {/* VIEW: LOGIN FORM */}
          {activeTab === "login" && (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <input
                  type="text"
                  placeholder={isArabic ? "الرقم الجامعي أو البريد الإلكتروني (e.g. 442001928)" : "Student ID or Email (e.g. 442001928)"}
                  value={loginIdOrEmail}
                  onChange={(e) => setLoginIdOrEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none text-right placeholder-gray-400 font-mono transition-all"
                />
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-[11px] rounded-xl font-bold">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                {isArabic ? "تسجيل الدخول الآمن" : "Secure Sign In"}
              </button>
            </form>
          )}

          {/* VIEW: REGISTRATION FORM */}
          {activeTab === "register" && (
            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  {isArabic ? "الاسم الكامل للطلب *" : "Full Student Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isArabic ? "مثال: فتحي الكيلاني" : "e.g. Fathi Al-Kilani"}
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none text-right transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  {isArabic ? "الرقم الجامعي المميز *" : "Student ID Number *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isArabic ? "مثال: 442109283" : "e.g. 442109283"}
                  value={regId}
                  onChange={(e) => setRegId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none text-right font-mono transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  {isArabic ? "البريد الإلكتروني الجامعي *" : "University Email Address *"}
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@university.edu.sa"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none text-right font-mono transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  {isArabic ? "رقم الجوال للاتصال" : "Mobile Phone (Optional)"}
                </label>
                <input
                  type="tel"
                  placeholder="05xxxxxxxx"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none text-right font-mono transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  {isArabic ? "القسم أو التخصص الأكاديمي" : "Academic Major / Dept"}
                </label>
                <select
                  value={regDept}
                  onChange={(e) => setRegDept(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all text-right"
                >
                  <option value="هندسة البرمجيات">{isArabic ? "قسم هندسة البرمجيات (SWE)" : "Software Engineering"}</option>
                  <option value="علوم الحاسب">{isArabic ? "قسم علوم الحاسب (CS)" : "Computer Science"}</option>
                  <option value="نظم المعلومات">{isArabic ? "قسم نظم المعلومات (IS)" : "Information Systems"}</option>
                  <option value="تقنية المعلومات">{isArabic ? "قسم تقنية المعلومات (IT)" : "Information Technology"}</option>
                  <option value="External">{isArabic ? "زائر من كليات خارجية" : "External Visitor"}</option>
                </select>
              </div>

              {regError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-[11px] rounded-xl font-bold">
                  {regError}
                </div>
              )}

              {regSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[11px] rounded-xl font-bold">
                  {isArabic ? "تم تسجيل حسابك بنجاح! جاري تسجيل الدخول التلقائي..." : "Registration successful! Signing in..."}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                {isArabic ? "إكمال التسجيل والاشتراك" : "Complete Registration"}
              </button>
            </form>
          )}

        </div>
      </div>

    </div>
  );
}
