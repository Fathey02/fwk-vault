import { useState, FormEvent } from "react";
import { 
  Bot, 
  Search, 
  Sparkles, 
  BookOpen, 
  Send, 
  HelpCircle, 
  ShieldAlert, 
  ChevronDown, 
  ArrowLeft,
  ChevronRight,
  RefreshCw,
  Cpu,
  GraduationCap
} from "lucide-react";
import { Book, GraduationProject, LibraryInquiry, Achievement } from "../types";

interface GuidelinesAndAIProps {
  isArabic: boolean;
  books: Book[];
  projects: GraduationProject[];
  achievements: Achievement[];
  inquiries: LibraryInquiry[];
}

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export default function GuidelinesAndAI({
  isArabic,
  books,
  projects,
  achievements,
  inquiries
}: GuidelinesAndAIProps) {

  // Accordion faq states
  const [activeFaq, setActiveFaq] = useState<string | null>(null);

  // Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "model", text: isArabic ? "مرحباً بك! أنا مساعد مكتبة علوم الحاسب الذكي. كيف يمكنني إرشادك اليوم؟ يمكنك سؤالي عن الكتب، المناهج، مقترحات مشاريع التخرج أو كيفية بدء التجارة والاستثمار." : "Hello! I am your AI Library Assistant. How can I help you today? Ask me about curriculum books, graduation research, or trading guides." }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // AI Search States
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<{
    summary: string;
    relevantIds: string[];
  } | null>(null);

  // Local storage search history state
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("fwk_vault_ai_search_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addToHistory = (query: string) => {
    if (!query.trim()) return;
    const filtered = searchHistory.filter(q => q !== query);
    const updated = [query, ...filtered].slice(0, 5); // Keep top 5
    setSearchHistory(updated);
    try {
      localStorage.setItem("fwk_vault_ai_search_history", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleHistoryClick = (q: string) => {
    setAiSearchQuery(q);
    // Auto-trigger semantic search using the clicked query
    triggerSearchWithQuery(q);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem("fwk_vault_ai_search_history");
    } catch (e) {
      console.error(e);
    }
  };

  // Run AI Semantic Search (البحث بالذكاء الاصطناعي)
  const handleAiSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!aiSearchQuery.trim()) return;
    addToHistory(aiSearchQuery);
    await triggerSearchWithQuery(aiSearchQuery);
  };

  const triggerSearchWithQuery = async (queryText: string) => {
    setAiSearchLoading(true);
    setAiSearchResults(null);

    // Prepare catalog items for semantic search
    const items = [
      ...books.map(b => ({ id: b.id, type: "Book", title: b.title, desc: b.description, category: b.category, sub: b.subCategory })),
      ...projects.map(p => ({ id: p.id, type: "GraduationProject", title: p.title, desc: p.abstract, category: p.category })),
      ...achievements.map(a => ({ id: a.id, type: "Achievement", title: a.title, desc: a.description, category: a.type }))
    ];

    try {
      const response = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryText,
          items: items
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setAiSearchResults({
        summary: data.summary || (isArabic ? "لم يتم العثور على ملخص كافٍ." : "No structured summary found."),
        relevantIds: data.relevantIds || []
      });
    } catch (err) {
      console.error(err);
      setAiSearchResults({
        summary: isArabic 
          ? "لم أتمكن من إتمام البحث الدلالي بالذكاء الاصطناعي. يرجى تزويد بوابة الخادم بمفتاح GEMINI_API_KEY صالح للتشغيل."
          : "Unable to run semantic AI search. Ensure server environment holds a valid GEMINI_API_KEY.",
        relevantIds: []
      });
    } finally {
      setAiSearchLoading(false);
    }
  };

  // Toggle FAQ
  const toggleFaq = (id: string) => {
    setActiveFaq(activeFaq === id ? null : id);
  };

  // Run AI Chat
  const handleSendChat = async (textToSend?: string) => {
    const queryStr = textToSend || userInput;
    if (!queryStr.trim()) return;

    const updatedMessages = [...chatMessages, { role: "user" as const, text: queryStr }];
    setChatMessages(updatedMessages);
    setUserInput("");
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryStr,
          chatHistory: chatMessages
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setChatMessages([...updatedMessages, { role: "model", text: data.response }]);
    } catch (err: any) {
      console.error(err);
      setChatMessages([...updatedMessages, { role: "model", text: isArabic ? "عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي. يرجى التحقق من مفتاح GEMINI_API_KEY." : "Sorry, an error occurred. Please check the GEMINI_API_KEY settings." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="ai-tab">
      
      {/* 1. AI Search Panel (البحث بالذكاء الاصطناعي) */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden" id="ai-search-module">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 space-y-4 text-right">
          <div className="flex items-center gap-2 justify-end">
            <span className="bg-blue-500/30 text-blue-200 text-[10px] px-2.5 py-0.5 rounded-full border border-blue-400/20 font-bold uppercase tracking-wider">
              Gemini 2.5 Flash Powered
            </span>
            <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
            <h3 className="font-bold text-lg">
              {isArabic ? "محرك البحث الدلالي الذكي بالذكاء الاصطناعي" : "AI Semantic Search & Discovery Engine"}
            </h3>
          </div>

          <p className="text-xs text-indigo-100 max-w-2xl ml-auto leading-relaxed">
            {isArabic 
              ? "اطرح سؤالك باللغة الطبيعية (مثال: 'أقترح لي مراجع تداول للبدء وجلب دخل' أو 'أين أجد مشاريع تتعلق بالبلوكشين والشبكات؟') ليقوم الذكاء الاصطناعي بفهرسة جميع المراجع ومطابقتها دلالياً."
              : "Search using natural language query. Gemini will crawl catalog records, write an elegant brief, and recommend corresponding assets."}
          </p>

          {/* Search bar input */}
          <form onSubmit={handleAiSearch} className="flex gap-2 max-w-3xl ml-auto">
            <button
              type="submit"
              disabled={aiSearchLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            >
              {aiSearchLoading ? (isArabic ? "جاري البحث..." : "Searching...") : (isArabic ? "بحث ذكي" : "AI Search")}
            </button>
            <div className="relative w-full">
              <input
                type="text"
                required
                value={aiSearchQuery}
                onChange={(e) => setAiSearchQuery(e.target.value)}
                placeholder={isArabic ? "اطرح أي سؤال بحثي على المكتبة..." : "Ask any research question..."}
                className="w-full p-2.5 bg-white/10 text-white placeholder-slate-400 border border-white/20 rounded-xl text-xs focus:bg-white focus:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </form>

          {/* Local Storage Search History */}
          {searchHistory.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 justify-end text-xs pt-1.5" id="search-history-panel">
              <button 
                type="button"
                onClick={clearHistory} 
                className="text-slate-400 hover:text-red-400 text-[10px] font-bold border border-slate-700/60 hover:border-red-500/30 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
              >
                {isArabic ? "مسح السجل" : "Clear"}
              </button>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {searchHistory.map((q, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleHistoryClick(q)}
                    className="bg-slate-800/80 hover:bg-slate-700 hover:text-indigo-200 text-slate-300 text-[10px] px-2.5 py-1 rounded-lg border border-slate-700/60 transition-all cursor-pointer truncate max-w-[160px]"
                    title={q}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <span className="text-slate-400 text-[10px] font-bold">
                {isArabic ? "الاستفسارات السابقة:" : "Recent searches:"}
              </span>
            </div>
          )}

          {/* AI Search Output */}
          {aiSearchResults && (
            <div className="bg-white/5 border border-white/10 p-5 rounded-xl space-y-4 text-right animate-fade-in mt-4">
              <div className="flex items-center gap-2 justify-end text-xs text-amber-400 font-bold border-b border-white/10 pb-2">
                <span>{isArabic ? "مستخلص إجابة الذكاء الاصطناعي" : "AI Search Abstract"}</span>
                <Bot className="w-4 h-4" />
              </div>
              <p className="text-xs text-indigo-50 leading-relaxed">
                {aiSearchResults.summary}
              </p>

              {aiSearchResults.relevantIds.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] text-indigo-300 block font-bold">
                    {isArabic ? "عناصر موصى بها من فهرس المكتبة" : "Matching Library Materials"}
                  </span>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {aiSearchResults.relevantIds.map((id) => {
                      // Match with book or project
                      const bookMatch = books.find(b => b.id === id);
                      const projMatch = projects.find(p => p.id === id);
                      const name = bookMatch?.title || projMatch?.title || `ID: ${id}`;
                      const type = bookMatch ? (isArabic ? "كتاب مالي/منهج" : "Book") : (isArabic ? "مشروع تخرج" : "Project");
                      
                      return (
                        <span key={id} className="text-[10px] bg-white/10 hover:bg-white/20 text-indigo-100 px-3 py-1 rounded-lg border border-white/5 transition-colors cursor-pointer">
                          [{type}] {name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* 2. Side-by-Side: AI Assistant Chat & College Guidelines FAQs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: AI Assistant Chat bot (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between" id="ai-chat-module">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 justify-end sm:justify-start">
              <Bot className="w-5 h-5 text-blue-600 animate-bounce" />
              <div className="text-right sm:text-left">
                <h3 className="font-bold text-gray-800 text-base">
                  {isArabic ? "مساعد خدمة العملاء والإرشادات الأكاديمية" : "Smart Library Customer Service Agent"}
                </h3>
                <p className="text-[11px] text-gray-400">
                  {isArabic ? "اسألني عن لوائح الكلية، فترات الاستعارة، أو ترشيحات الكتب المالية والمهنية" : "Ask about library regulations, borrowing limits, or finance literature"}
                </p>
              </div>
            </div>

            {/* Chat Body scrolling */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto p-2 bg-slate-50/50 rounded-xl border border-slate-100/50 flex flex-col">
              {chatMessages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-2xl max-w-[85%] text-xs leading-normal ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none self-end text-left"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-none self-start text-right"
                  }`}
                >
                  <span className="font-bold text-[9px] block mb-1 opacity-75">
                    {msg.role === "user" ? (isArabic ? "أنت" : "Student") : (isArabic ? "مساعد المكتبة الذكي" : "Library AI Assistant")}
                  </span>
                  <p>{msg.text}</p>
                </div>
              ))}
              {isChatLoading && (
                <div className="p-3 bg-white border border-gray-100 rounded-xl rounded-bl-none self-start text-right text-[11px] text-gray-400 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  {isArabic ? "مساعد المكتبة يقوم بتحليل استفسارك..." : "AI Assistant is thinking..."}
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-1.5 justify-end">
              {[
                { label: "أقترح لي كتب تداول واستثمار", en: "Suggest trading books" },
                { label: "ما هي فترات وضوابط الاستعارة؟", en: "What are borrowing rules?" },
                { label: "كيف أصنع خطة لمشروع تخرجي؟", en: "How to draft senior project?" }
              ].map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSendChat(isArabic ? p.label : p.en)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-gray-700 text-[10px] font-semibold rounded-lg border border-gray-200 transition-colors cursor-pointer"
                >
                  {isArabic ? p.label : p.en}
                </button>
              ))}
            </div>
          </div>

          {/* Input Panel */}
          <div className="flex gap-2 pt-4 border-t border-gray-100 mt-4">
            <button
              onClick={() => handleSendChat()}
              disabled={isChatLoading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              placeholder={isArabic ? "اكتب سؤالك هنا لمساعد المكتبة..." : "Type your query here..."}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none text-right"
            />
          </div>

        </div>

        {/* Right Column: College Guidelines Accordion FAQ (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-right" id="college-guidelines">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3 justify-end sm:justify-start">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-800 text-base">
              {isArabic ? "إرشادات ولوائح كلية الحاسب والمكتبة" : "College Guidelines & Library Rules"}
            </h3>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            {isArabic 
              ? "مجموعة اللوائح والسياسات الرسمية الصادرة من عمادة الكلية لتنظيم استعارة المراجع وسلوك صالات المطالعة."
              : "Accordion listing guidelines of the college of computer science regarding literature lending and silence regulations."}
          </p>

          <div className="space-y-2.5 text-xs">
            {inquiries.map((faq) => (
              <div 
                key={faq.id} 
                className="border border-gray-100 rounded-xl overflow-hidden transition-all bg-slate-50/50"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-3 text-right font-bold text-gray-700 hover:bg-slate-100 flex items-center justify-between gap-2"
                >
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${activeFaq === faq.id ? "rotate-180" : ""}`} />
                  <span className="leading-snug">{faq.question}</span>
                </button>
                
                {activeFaq === faq.id && (
                  <div className="p-3.5 bg-white text-gray-600 leading-relaxed border-t border-gray-100 text-[11px] text-right">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
