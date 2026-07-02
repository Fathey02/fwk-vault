import { useState, ChangeEvent, FormEvent } from "react";
import { 
  BookOpen, 
  Search, 
  Plus, 
  BookmarkCheck, 
  Clock, 
  ArrowLeftRight, 
  CheckCircle, 
  AlertCircle, 
  QrCode,
  Calendar,
  Layers,
  Upload,
  BookMarked,
  Sparkles
} from "lucide-react";
import { Book, Loan } from "../types";

const getLocalDateString = (d: Date = new Date()) => {
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split("T")[0];
};

const getFutureDateString = (daysAhead: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split("T")[0];
};

const calculateDaysDifference = (startDateStr: string, endDateStr: string) => {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

interface LibraryCatalogProps {
  isArabic: boolean;
  books: Book[];
  loans: Loan[];
  onAddBook: (book: Omit<Book, "id">) => Promise<void>;
  onBorrowBook: (loan: Omit<Loan, "id">) => Promise<void>;
  onReturnBook: (loanId: string, bookId: string) => Promise<void>;
}

export default function LibraryCatalog({
  isArabic,
  books,
  loans,
  onAddBook,
  onBorrowBook,
  onReturnBook
}: LibraryCatalogProps) {

  // Search and Filtering States
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "curricula" | "educational" | "recreational" | "income-boosting">("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState<Book | null>(null);
  const [showReceipt, setShowReceipt] = useState<Loan | null>(null);

  // Upload Book Form States
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newCategory, setNewCategory] = useState<"recreational" | "educational" | "curricula" | "income-boosting">("income-boosting");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPages, setNewPages] = useState(150);
  const [newIsbn, setNewIsbn] = useState("");
  const [newTotal, setNewTotal] = useState(5);
  const [uploadCover, setUploadCover] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");

  // Borrow Form States
  const [borrowName, setBorrowName] = useState("");
  const [borrowStudentId, setBorrowStudentId] = useState("");
  const [borrowReturnDate, setBorrowReturnDate] = useState(getLocalDateString());

  // Filtered Books
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (book.subCategory && book.subCategory.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          book.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === "all" ? true : book.category === activeTab;
    return matchesSearch && matchesTab;
  });

  // Handle Cover File conversion to base64
  const handleCoverUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadCover(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit book upload
  const handleUploadBook = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAuthor || !newDesc) {
      alert(isArabic ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields");
      return;
    }

    try {
      const defaultCover = uploadCover || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=300";
      
      await onAddBook({
        title: newTitle,
        author: newAuthor,
        category: newCategory,
        subCategory: newSubCategory || (newCategory === "income-boosting" ? "التجارة والاستثمار" : "عام"),
        description: newDesc,
        pages: Number(newPages),
        isbn: newIsbn || "978-X-XX-XXXXXX-X",
        availableCount: Number(newTotal),
        totalCount: Number(newTotal),
        coverUrl: defaultCover
      });

      alert(isArabic ? "تم إضافة الكتاب بنجاح وفهرسته سحابياً!" : "Book added and cataloged successfully!");
      setShowUploadModal(false);
      
      // Reset state
      setNewTitle("");
      setNewAuthor("");
      setNewSubCategory("");
      setNewDesc("");
      setUploadCover("");
      setUploadFileName("");
    } catch (err) {
      console.error(err);
      alert("Failed to catalog book");
    }
  };

  // Submit Borrowing
  const handleBorrowSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!showBorrowModal) return;
    if (!borrowName || !borrowStudentId) {
      alert(isArabic ? "يرجى إدخال اسم الطالب والرقم الأكاديمي" : "Please enter student name and ID");
      return;
    }
    
    const todayStr = getLocalDateString();
    const daysDiff = calculateDaysDifference(todayStr, borrowReturnDate);
    if (daysDiff < 0 || daysDiff > 7) {
      alert(isArabic ? "عفواً، الحد الأقصى لفترة الاستعارة هو 7 أيام ولا يمكن تحديد تاريخ في الماضي" : "Sorry, the maximum borrowing period is 7 days and past dates are not allowed");
      return;
    }

    try {
      const borrowDateStr = todayStr;
      const dueDateStr = borrowReturnDate;

      const qrData = `LOAN-${showBorrowModal.id}-${borrowStudentId}-${Date.now()}`;

      const loanData = {
        bookId: showBorrowModal.id,
        bookTitle: showBorrowModal.title,
        studentName: borrowName,
        studentId: borrowStudentId,
        borrowDate: borrowDateStr,
        dueDate: dueDateStr,
        status: "active" as const,
        qrCodeData: qrData
      };

      await onBorrowBook(loanData);
      
      // Open Receipt View
      setShowReceipt({ id: "temp", ...loanData });
      setShowBorrowModal(null);
      setBorrowName("");
      setBorrowStudentId("");
    } catch (err) {
      console.error(err);
      alert("Borrow operation failed");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="catalog-tab">
      
      {/* Search Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-blue-600" />
            {isArabic ? "الفهرس المركزي والمكتبة الرقمية" : "Central Catalog & Digital Library"}
          </h2>
          <p className="text-xs text-gray-500">
            {isArabic ? "ابحث بين المناهج والكتب الترفيهية، التعليمية ومصادر ريادة الأعمال والاستثمار." : "Search through academic curricula, novels, research papers, and startup literature."}
          </p>
        </div>
        
        {/* Advanced Upload Book button */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          {isArabic ? "رفع وإدراج كتاب مالي/تجاري" : "Upload Business/Income Book"}
        </button>
      </div>

      {/* Advanced Filter Tab System */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-3">
        <div className="flex flex-wrap gap-1.5" id="library-filter-tabs">
          <button
            id="tab-all"
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "all" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {isArabic ? "جميع الكتب" : "All Books"}
          </button>
          <button
            id="tab-recreational"
            onClick={() => setActiveTab("recreational")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "recreational" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {isArabic ? "ترفيهية وروايات" : "Recreational"}
          </button>
          <button
            id="tab-educational"
            onClick={() => setActiveTab("educational")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "educational" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {isArabic ? "تعليمية وتخصصية" : "Educational"}
          </button>
          <button
            id="tab-curricula"
            onClick={() => setActiveTab("curricula")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "curricula" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {isArabic ? "مناهج دراسية" : "Curricula"}
          </button>
          <button
            id="tab-income-generating"
            onClick={() => setActiveTab("income-boosting")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "income-boosting" 
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-100" 
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 animate-bounce text-emerald-500 group-hover:text-white" />
            {isArabic ? "مدرة للدخل وريادة أعمال" : "Income-Generating"}
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder={isArabic ? "ابحث بالاسم، المؤلف، الوصف..." : "Search title, author, keyword..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right md:text-left"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Main Literature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="books-grid">
        {filteredBooks.map((book) => (
          <div 
            key={book.id} 
            className="bg-white rounded-2xl border border-gray-100 hover:border-blue-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between group"
          >
            {/* Cover and details */}
            <div>
              <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-gray-50">
                {book.coverUrl ? (
                  <img 
                    src={book.coverUrl} 
                    alt={book.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <BookOpen className="w-12 h-12 text-gray-300" />
                )}
                
                {/* Category Badge absolute */}
                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-sm ${
                    book.category === "income-boosting" ? "bg-emerald-500 text-white" :
                    book.category === "curricula" ? "bg-blue-600 text-white" :
                    book.category === "educational" ? "bg-purple-600 text-white" :
                    "bg-amber-500 text-white"
                  }`}>
                    {book.category === "income-boosting" ? (isArabic ? "مدر للدخل" : "Income-Generating") :
                     book.category === "curricula" ? (isArabic ? "منهج دراسي" : "Curricula") :
                     book.category === "educational" ? (isArabic ? "تعليمي" : "Educational") :
                     (isArabic ? "ترفيهي" : "Recreational")}
                  </span>
                  
                  {book.subCategory && (
                    <span className="text-[9px] bg-slate-900/80 text-white backdrop-blur-xs px-2 py-0.5 rounded-md font-medium">
                      {book.subCategory}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-2 text-right">
                <h3 className="font-bold text-gray-800 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors text-right">
                  {book.title}
                </h3>
                <p className="text-xs text-gray-500 text-right">
                  {isArabic ? "تأليف" : "By"}: <span className="font-semibold">{book.author}</span>
                </p>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 text-right">
                  {book.description}
                </p>
              </div>
            </div>

            {/* Availability Status & Checkout action */}
            <div className="px-5 pb-5 pt-3 border-t border-gray-50 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-gray-400 block">
                  {isArabic ? "المتاح للرفوف" : "Shelf Available"}
                </span>
                <span className={`font-bold ${book.availableCount > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                  {book.availableCount} / {book.totalCount} {isArabic ? "نسخ" : "copies"}
                </span>
              </div>
              
              <button
                disabled={book.availableCount <= 0}
                onClick={() => setShowBorrowModal(book)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm cursor-pointer ${
                  book.availableCount > 0
                    ? "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {book.availableCount > 0 ? (isArabic ? "استعارة فورية" : "Borrow Book") : (isArabic ? "غير متاح" : "Out of Stock")}
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Section: My Loans and QR Scanner Simulation (سجل استعاراتي وتتبع الاستعارات) */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm" id="my-loans-section">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <ArrowLeftRight className="w-5 h-5 text-blue-600 animate-pulse" />
            <div>
              <h3 className="font-bold text-gray-800 text-base">
                {isArabic ? "سجل استعارات الطلاب النشطة وتتبع الكي آر" : "Active Student Loans & QR Tracking System"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isArabic ? "قائمة بجميع الكتب المستعارة حالياً وتواريخ الإرجاع الذكية" : "List of currently borrowed materials, QR tags, and return schedules"}
              </p>
            </div>
          </div>
        </div>

        {loans.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            {isArabic ? "لا توجد أي عمليات استعارة نشطة حالياً." : "No active library loans logged in system."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <th className="p-3 font-semibold">{isArabic ? "الكتاب" : "Book"}</th>
                  <th className="p-3 font-semibold">{isArabic ? "اسم المستعير" : "Student Name"}</th>
                  <th className="p-3 font-semibold">{isArabic ? "الرقم الجامعي" : "Student ID"}</th>
                  <th className="p-3 font-semibold">{isArabic ? "تاريخ الاستعارة" : "Borrow Date"}</th>
                  <th className="p-3 font-semibold">{isArabic ? "تاريخ الإرجاع المقدر" : "Due Date"}</th>
                  <th className="p-3 font-semibold">{isArabic ? "الحالة" : "Status"}</th>
                  <th className="p-3 font-semibold text-center">{isArabic ? "معاينة QR والتسجيل" : "QR Receipt"}</th>
                  <th className="p-3 font-semibold text-center">{isArabic ? "إجراء" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-medium text-gray-800">{loan.bookTitle}</td>
                    <td className="p-3 text-gray-600">{loan.studentName}</td>
                    <td className="p-3 font-mono text-gray-500">{loan.studentId}</td>
                    <td className="p-3 text-gray-500 font-mono">{loan.borrowDate}</td>
                    <td className="p-3 text-gray-500 font-mono">{loan.dueDate}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-semibold text-[10px] inline-flex items-center gap-1 ${
                        loan.status === "returned" 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                          : "bg-blue-50 text-blue-600 border border-blue-100"
                      }`}>
                        {loan.status === "returned" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3 animate-spin" />}
                        {loan.status === "returned" ? (isArabic ? "تم الإرجاع" : "Returned") : (isArabic ? "قيد المطالعة" : "Active")}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setShowReceipt(loan)}
                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded cursor-pointer inline-flex items-center gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5 text-blue-600" />
                        {isArabic ? "تذكرة QR" : "QR Receipt"}
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      {loan.status !== "returned" && (
                        <button
                          onClick={() => onReturnBook(loan.id, loan.bookId)}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded cursor-pointer"
                        >
                          {isArabic ? "تسجيل إرجاع" : "Return"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Upload Business & Financial Intelligence Books */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden">
            
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">
                  {isArabic ? "رفع وإضافة كتب التجارة والاستثمار" : "Upload Business & Trading Books"}
                </h3>
                <p className="text-xs text-slate-400">
                  {isArabic ? "إثراء مكتبة تنمية الدخل والذكاء المالي للطلاب" : "Add books on investment, trading, e-commerce, or passive income"}
                </p>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white font-mono text-xl focus:outline-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUploadBook} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isArabic ? "عنوان الكتاب *" : "Book Title *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={isArabic ? "مثال: أساسيات التداول المالي" : "e.g. Trading Fundamentals"}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isArabic ? "المؤلف / الكاتب *" : "Author *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder={isArabic ? "مثال: جون سميث" : "e.g. John Smith"}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isArabic ? "التصنيف الرئيسي" : "Category"}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right"
                  >
                    <option value="income-boosting">{isArabic ? "مدر للدخل وريادة أعمال" : "Income-Generating"}</option>
                    <option value="curricula">{isArabic ? "منهج دراسي" : "Curricula"}</option>
                    <option value="educational">{isArabic ? "تعليمي أكاديمي" : "Educational"}</option>
                    <option value="recreational">{isArabic ? "ترفيهي وروايات" : "Recreational"}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isArabic ? "التصنيف الفرعي" : "Sub-category"}
                  </label>
                  <input
                    type="text"
                    value={newSubCategory}
                    onChange={(e) => setNewSubCategory(e.target.value)}
                    placeholder={isArabic ? "مثال: تداول، استثمار، دروب شيبينغ" : "e.g. Trading, Investment"}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isArabic ? "عدد الصفحات" : "Pages"}
                  </label>
                  <input
                    type="number"
                    value={newPages}
                    onChange={(e) => setNewPages(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isArabic ? "الرقم الدولي ISBN" : "ISBN"}
                  </label>
                  <input
                    type="text"
                    value={newIsbn}
                    onChange={(e) => setNewIsbn(e.target.value)}
                    placeholder="978-X-..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isArabic ? "عدد النسخ المتاحة" : "Total Copies"}
                  </label>
                  <input
                    type="number"
                    value={newTotal}
                    onChange={(e) => setNewTotal(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isArabic ? "نبذة / وصف الكتاب *" : "Description *"}
                </label>
                <textarea
                  required
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder={isArabic ? "مقدمة ملخصة عن الكتاب وأهم محتوياته المالية والمهارية لطلاب الكلية..." : "A summary of book key components..."}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right"
                />
              </div>

              {/* Cover photograph uploaded by student */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isArabic ? "تصوير غلاف الكتاب وتحميله" : "Photograph Book Cover & Upload"}
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-slate-100/50 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-10 w-10 text-gray-400" />
                    <span className="text-blue-600 font-semibold text-xs">
                      {isArabic ? "التقاط صورة للغلاف أو الرفع" : "Snap or upload cover photo"}
                    </span>
                    {uploadFileName && (
                      <p className="text-xs text-emerald-600 font-bold mt-1">
                        ✓ {uploadFileName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  {isArabic ? "إدراج وتخزين" : "Document & Catalog"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: Borrow Book */}
      {showBorrowModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden">
            
            <div className="bg-blue-600 text-white p-5">
              <h3 className="font-bold text-lg">
                {isArabic ? "استمارة الاستعارة الرقمية" : "Digital Library Loan Request"}
              </h3>
              <p className="text-xs text-blue-100 mt-1">
                {isArabic ? `أنت على وشك استعارة: ${showBorrowModal.title}` : `You are borrowing: ${showBorrowModal.title}`}
              </p>
            </div>

            <form onSubmit={handleBorrowSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isArabic ? "اسم الطالب الرباعي *" : "Student Full Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={borrowName}
                  onChange={(e) => setBorrowName(e.target.value)}
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
                  value={borrowStudentId}
                  onChange={(e) => setBorrowStudentId(e.target.value)}
                  placeholder="44... / 43..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isArabic ? "تاريخ الإرجاع المتوقع *" : "Expected Return Date *"}
                </label>
                <input
                  type="date"
                  required
                  min={getLocalDateString()}
                  max={getFutureDateString(7)}
                  value={borrowReturnDate}
                  onChange={(e) => setBorrowReturnDate(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center font-bold text-gray-800"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  {isArabic 
                    ? `مسموح حتى 7 أيام من اليوم (أقصى تاريخ: ${getFutureDateString(7)})` 
                    : `Allowed up to 7 days from today (max: ${getFutureDateString(7)})`}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBorrowModal(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  {isArabic ? "تأكيد واستخراج كود QR" : "Borrow & Generate QR Pass"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: Loan Receipt / QR Generator */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full overflow-hidden">
            
            <div className="bg-slate-950 text-white p-6 text-center space-y-1">
              <span className="text-[10px] bg-blue-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {isArabic ? "إيصال استعارة رسمي" : "Official Library Pass"}
              </span>
              <h3 className="font-bold text-base mt-2">
                {isArabic ? "مكتبة كليات الحاسبات والمعلومات" : "Colleges of Computer Science and Information Library"}
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                {showReceipt.qrCodeData}
              </p>
            </div>

            <div className="p-6 text-center space-y-4">
              
              {/* QR Code Graphic Simulation */}
              <div className="p-4 bg-slate-50 border-2 border-dashed border-gray-200 rounded-xl max-w-[150px] mx-auto flex items-center justify-center">
                <div className="p-2 bg-white border border-gray-100 rounded-lg shadow-sm">
                  <div className="grid grid-cols-5 gap-1.5 w-24 h-24 bg-slate-100 p-1">
                    {/* Simulated QR block layout */}
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>

                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-950 rounded-sm"></div>

                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-100"></div>

                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-900 rounded-sm"></div>

                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-right text-xs">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-semibold text-gray-800">{showReceipt.bookTitle}</span>
                  <span className="text-gray-400">{isArabic ? "اسم الكتاب" : "Book"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-bold text-gray-700">{showReceipt.studentName}</span>
                  <span className="text-gray-400">{isArabic ? "المستعير" : "Student"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-mono text-gray-600">{showReceipt.studentId}</span>
                  <span className="text-gray-400">{isArabic ? "الرقم الجامعي" : "ID"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-mono text-gray-600">{showReceipt.borrowDate}</span>
                  <span className="text-gray-400">{isArabic ? "تاريخ الخروج" : "Checked Out"}</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="font-bold text-rose-600 font-mono">{showReceipt.dueDate}</span>
                  <span className="text-gray-400">{isArabic ? "تاريخ الإرجاع" : "Due Return"}</span>
                </div>
              </div>

              <p className="text-[10px] text-amber-600 bg-amber-50 rounded-lg p-2.5 text-right">
                {isArabic 
                  ? "يرجى مسح كود الاستجابة السريعة (QR) عند جهاز الخدمة الذاتية بالبوابة لتأكيد عملية الخروج والحصول على الكتاب الورقي."
                  : "Please scan this QR pass at the self-service terminal to authorize physical check out."}
              </p>

              <button
                onClick={() => setShowReceipt(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                {isArabic ? "تم حفظ الكود / إغلاق" : "Close & Save Receipt"}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
