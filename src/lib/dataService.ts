import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  setDoc, 
  query, 
  where,
  deleteDoc
} from "firebase/firestore";
import { db } from "./firebase";
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
} from "../types";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to check and seed default data
export async function initializeSeedData() {
  try {
    const booksSnap = await getDocs(collection(db, "books"));
    if (booksSnap.empty) {
      console.log("Seeding initial data to Firestore...");
      
      // 1. Seed Books
      const defaultBooks: Omit<Book, "id">[] = [
        {
          title: "خوارزميات وهياكل البيانات بلغة C++",
          author: "د. خالد السعيد",
          category: "curricula",
          subCategory: "علوم الحاسب الأساسية",
          description: "مرجع شامل يغطي أسس الخوارزميات، هياكل البيانات الخطية وغير الخطية، وتحليل كفاءة الخوارزميات لتطبيقات الحاسب.",
          availableCount: 5,
          totalCount: 5,
          pages: 340,
          isbn: "978-3-16-148410-0"
        },
        {
          title: "أساسيات هندسة البرمجيات الحديثة",
          author: "أ.د. منيرة العتيبي",
          category: "curricula",
          subCategory: "هندسة البرمجيات",
          description: "كتاب منهجي يدرس دورة حياة تطوير البرمجيات، منهجيات أجايل (Agile)، والتصميم المعماري للأنظمة المعقدة.",
          availableCount: 4,
          totalCount: 4,
          pages: 412,
          isbn: "978-1-40-289462-6"
        },
        {
          title: "مقدمة في الذكاء الاصطناعي وتعلم الآلة",
          author: "د. عمر المهدي",
          category: "educational",
          subCategory: "الذكاء الاصطناعي",
          description: "دليل تعليمي عملي يشرح شبكات العصبونات الاصطناعية، خوارزميات التصنيف والإنحدار، مع تطبيقات عملية باستخدام بايثون.",
          availableCount: 3,
          totalCount: 3,
          pages: 280,
          isbn: "978-0-12-345678-9"
        },
        {
          title: "الأمن السيبراني وحماية الشبكات اللاسلكية",
          author: "م. فهد الجاسر",
          category: "educational",
          subCategory: "الأمن السيبراني",
          description: "يركز على تقنيات التشفير، أمن البروتوكولات، اكتشاف الثغرات الأمنية، وكيفية حماية البنية التحتية من الاختراقات.",
          availableCount: 2,
          totalCount: 2,
          pages: 320,
          isbn: "978-5-43-210987-6"
        },
        {
          title: "الحصن الرقمي - رواية شيقة",
          author: "دان براون",
          category: "recreational",
          subCategory: "روايات تقنية",
          description: "رواية إثارة تكنولوجية تدور في أروقة وكالة الأمن القومي الأمريكية حول كود غامض لا يمكن فك تشفيره يهدد الأمن القومي.",
          availableCount: 6,
          totalCount: 6,
          pages: 450,
          isbn: "978-0-385-50841-4"
        },
        {
          title: "القراصنة: أبطال ثورة الكمبيوتر",
          author: "ستيفن ليفي",
          category: "recreational",
          subCategory: "تاريخ التقنية",
          description: "يروي الكتاب قصص المبرمجين الأوائل من معهد MIT في الخمسينات والستينات والذين صاغوا ثقافة الحاسوب المجاني ومصادر المفتوحة.",
          availableCount: 3,
          totalCount: 3,
          pages: 380,
          isbn: "978-0-59-600032-5"
        },
        {
          title: "الأب الغني والأب الفقير",
          author: "روبرت كيوساكي",
          category: "income-boosting",
          subCategory: "الذكاء المالي والاستثمار",
          description: "كتاب يعلم الطلاب كيفية إدارة أموالهم وتنمية وعيهم الاستثماري للبدء في توليد الدخل السلبي وتجنب الديون مبكراً.",
          availableCount: 4,
          totalCount: 4,
          pages: 240,
          isbn: "978-1-61-268019-4"
        },
        {
          title: "خارطة طريق التجارة الإلكترونية والدروب شيبينغ",
          author: "م. أحمد الشقيري",
          category: "income-boosting",
          subCategory: "التجارة الإلكترونية",
          description: "دليل عملي خطوة بخطوة لإنشاء متاجر إلكترونية مربحة، اختيار المنتجات الرابحة، وإدارة الإعلانات على شبكات التواصل.",
          availableCount: 5,
          totalCount: 5,
          pages: 195,
          isbn: "978-9-96-012345-1"
        },
        {
          title: "أساسيات تداول الأسهم والتحليل المالي",
          author: "د. سليمان الحربي",
          category: "income-boosting",
          subCategory: "التداول والاستثمار",
          description: "يعلم الطالب كيفية قراءة الرسوم البيانية وفهم الشموع اليابانية لتداول الأسهم والعملات الرقمية بشكل آمن وعلمي.",
          availableCount: 3,
          totalCount: 3,
          pages: 260,
          isbn: "978-4-12-887766-5"
        }
      ];

      for (const b of defaultBooks) {
        await addDoc(collection(db, "books"), b);
      }

      // 2. Seed Graduation Projects (Completed)
      const defaultProjects: Omit<GraduationProject, "id">[] = [
        {
          title: "نظام المساعد الذكي لمكتبة الكلية باستخدام نماذج الذكاء الاصطناعي التوليدي",
          students: ["أنس الحارثي", "عبدالإله الميموني", "محمد القحطاني"],
          advisor: "د. عمر المهدي",
          year: 2026,
          abstract: "مشروع تخرج يهدف إلى أتمتة خدمات الرد على الطلاب والبحث الدلالي عن المراجع في مكتبة الكلية بالاعتماد على نموذج Gemini API، مما يوفر وقتاً طويلاً للمستفيدين وأمناء المكتبة.",
          category: "AI",
          isCompleted: true,
          githubUrl: "https://github.com/cs-library/smart-assistant"
        },
        {
          title: "نظام لا مركزي لإدارة ومشاركة السجلات الطبية الآمنة باستخدام تقنية البلوكشين",
          students: ["ياسر الدوسري", "تركي السبيعي"],
          advisor: "د. خالد السعيد",
          year: 2025,
          abstract: "تطوير تطبيق ويب لإدارة السجلات الطبية المشفرة مع ضمان عدم تزويرها ومشاركتها الآمنة بين المستشفيات المختلفة عبر العقود الذكية على شبكة إيثيريوم.",
          category: "Cybersecurity",
          isCompleted: true,
          githubUrl: "https://github.com/cs-library/med-blockchain"
        },
        {
          title: "نظام ذكي ذاتي لمراقبة وحجز مواقف السيارات بالكلية باستخدام معالجة الصور وإنترنت الأشياء",
          students: ["فيصل العتيبي", "عبدالرحمن المطيري"],
          advisor: "م. فهد الجاسر",
          year: 2025,
          abstract: "مشروع متكامل يكتشف الأماكن الشاغرة للمواقف عبر كاميرات مراقبة ومعالجة الصور المباشرة (YOLOv8) وتحديث حالة الحجز فوراً عبر تطبيق جوال متصل بقاعدة بيانات سحابية.",
          category: "Software Engineering",
          isCompleted: true,
          githubUrl: "https://github.com/cs-library/smart-parking"
        }
      ];

      for (const p of defaultProjects) {
        await addDoc(collection(db, "projects"), p);
      }

      // 3. Seed Achievements & Competitions
      const defaultAchievements: Omit<Achievement, "id">[] = [
        {
          title: "الحصول على الاعتماد الأكاديمي الدولي الكامل (ABET)",
          date: "2026-02-15",
          description: "حصلت كليات الحاسبات والمعلومات رسمياً على تجديد الاعتماد الدولي لجميع برامجها الأكاديمية من منظمة ABET العالمية لضمان الجودة التعليمية والبحثية المتقدمة.",
          type: "academic",
          recipient: "كليات الحاسبات والمعلومات"
        },
        {
          title: "المركز الأول في هاكاثون الابتكار الرقمي على مستوى الجامعات",
          date: "2026-05-10",
          description: "توج فريق طالبات الكلية بالمركز الأول في الابتكار التقني عن مشروع 'بيئتي الرقمية' الذكي لإعادة تدوير النفايات الإلكترونية بالاعتماد على إنترنت الأشياء والذكاء الاصطناعي.",
          type: "research",
          recipient: "نادي الابتكار التقني بالكلية"
        }
      ];

      for (const ach of defaultAchievements) {
        await addDoc(collection(db, "achievements"), ach);
      }

      const defaultCompetitions: Omit<Competition, "id">[] = [
        {
          title: "المسابقة الوطنية للبرمجة الجامعية (ICPC)",
          date: "2026-03-22",
          placement: "المركز الثاني والميدالية الفضية",
          description: "شارك فريق الكلية في مسابقة الحلول البرمجية الفائقة وحل المسائل الرياضية المعقدة في زمن قياسي منافساً أكثر من 30 جامعة وطنية وإقليمية.",
          teamMembers: ["يزيد التميمي", "عبدالرحمن البقمي", "سعد الشهراني"]
        }
      ];

      for (const comp of defaultCompetitions) {
        await addDoc(collection(db, "competitions"), comp);
      }

      // 4. Seed Library Spaces
      const defaultSpaces: LibrarySpace[] = [
        {
          id: "space-1",
          name: "قاعة المطالعة الصامتة (طابق 1)",
          type: "silent-study",
          status: "available"
        },
        {
          id: "space-2",
          name: "مختبر البحث في الواقع الافتراضي VR (غرفة 102)",
          type: "vr-lab",
          status: "available"
        },
        {
          id: "space-3",
          name: "محطة حاسب الذكاء الاصطناعي الفائق (غرفة 105)",
          type: "computer-lab",
          status: "available"
        },
        {
          id: "space-4",
          name: "غرفة النقاش الجماعي الذكية A (غرفة 201)",
          type: "group-study",
          status: "available"
        },
        {
          id: "space-5",
          name: "غرفة النقاش الجماعي الذكية B (غرفة 202)",
          type: "group-study",
          status: "available"
        }
      ];

      for (const sp of defaultSpaces) {
        await setDoc(doc(db, "spaces", sp.id), sp);
      }

      // 5. Seed Guidelines / Inquiries
      const defaultInquiries: Omit<LibraryInquiry, "id">[] = [
        {
          question: "ما هي أوقات عمل المكتبة الرسمية؟",
          answer: "تفتح مكتبة الكلية أبوابها يومياً من الأحد إلى الخميس، من الساعة 8:00 صباحاً وحتى الساعة 8:00 مساءً. وتغلق في الإجازات الرسمية للكلية.",
          category: "hours"
        },
        {
          question: "كم عدد الكتب المسموح باستعارتها في نفس الوقت؟",
          answer: "يُسمح لطلاب البكالوريوس باستعارة ما يصل إلى 4 كتب في نفس الوقت لمدة 14 يوماً قابلة للتجديد لمرة واحدة إلكترونياً. ويُسمح لطلاب الدراسات العليا باستعارة حتى 8 كتب.",
          category: "lending"
        },
        {
          question: "كيف يمكنني حجز غرفة النقاش الجماعي أو محطات البحث الذكية؟",
          answer: "يمكنك حجز الغرف والأجهزة التخصصية عبر نظام الحجز الذكي المتوفر في هذا البوابة، حيث ستحصل على رمز تحقق وكود استجابة سريعة (QR) لتأكيد الحضور.",
          category: "spaces"
        },
        {
          question: "ما هي سياسة الهدوء والضوابط العامة داخل المكتبة؟",
          answer: "يُمنع منعاً باتاً التحدث بصوت مرتفع في منطقة المطالعة الصامتة، ويجب وضع الهواتف على الوضع الصامت. يُسمح بالمشروبات المغلقة ويُمنع إدخال الأطعمة للمحافظة على سلامة الكتب الورقية والأجهزة.",
          category: "guidelines"
        }
      ];

      for (const inq of defaultInquiries) {
        await addDoc(collection(db, "inquiries"), inq);
      }

      console.log("Seeding completed successfully!");
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "seed_data");
  }
}

// ----------------- BOOKS -----------------
export async function getBooks(): Promise<Book[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "books"));
    const books: Book[] = [];
    querySnapshot.forEach((doc) => {
      books.push({ id: doc.id, ...doc.data() } as Book);
    });
    return books;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "books");
    return [];
  }
}

export async function addBook(book: Omit<Book, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "books"), book);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "books");
    return "";
  }
}

export async function updateBookAvailability(bookId: string, change: number): Promise<void> {
  try {
    const docRef = doc(db, "books", bookId);
    const snap = await getDocs(query(collection(db, "books")));
    // Find specific book to update availability
    const bookDoc = snap.docs.find(d => d.id === bookId);
    if (bookDoc) {
      const data = bookDoc.data();
      const current = data.availableCount ?? 0;
      const nextVal = Math.max(0, Math.min(data.totalCount ?? 5, current + change));
      await updateDoc(docRef, { availableCount: nextVal });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `books/${bookId}`);
  }
}

// ----------------- LOANS -----------------
export async function getLoans(): Promise<Loan[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "loans"));
    const loans: Loan[] = [];
    querySnapshot.forEach((doc) => {
      loans.push({ id: doc.id, ...doc.data() } as Loan);
    });
    return loans;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "loans");
    return [];
  }
}

export async function createLoan(loan: Omit<Loan, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "loans"), loan);
    // Decrement book availability
    await updateBookAvailability(loan.bookId, -1);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "loans");
    return "";
  }
}

export async function returnLoan(loanId: string, bookId: string): Promise<void> {
  try {
    const docRef = doc(db, "loans", loanId);
    await updateDoc(docRef, {
      status: "returned",
      returnDate: new Date().toISOString().split("T")[0]
    });
    // Increment book availability back
    await updateBookAvailability(bookId, 1);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `loans/${loanId}`);
  }
}

// ----------------- GRADUATION PROJECTS -----------------
export async function getGraduationProjects(): Promise<GraduationProject[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "projects"));
    const projects: GraduationProject[] = [];
    querySnapshot.forEach((doc) => {
      projects.push({ id: doc.id, ...doc.data() } as GraduationProject);
    });
    return projects;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "projects");
    return [];
  }
}

export async function addGraduationProject(project: Omit<GraduationProject, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "projects"), project);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "projects");
    return "";
  }
}

// ----------------- INCOMPLETE PROJECTS (STUDENTS COVERS) -----------------
export async function getIncompleteProjects(): Promise<IncompleteProject[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "incomplete_projects"));
    const projects: IncompleteProject[] = [];
    querySnapshot.forEach((doc) => {
      projects.push({ id: doc.id, ...doc.data() } as IncompleteProject);
    });
    return projects;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "incomplete_projects");
    return [];
  }
}

export async function addIncompleteProject(project: Omit<IncompleteProject, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "incomplete_projects"), project);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "incomplete_projects");
    return "";
  }
}

// ----------------- ACHIEVEMENTS -----------------
export async function getAchievements(): Promise<Achievement[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "achievements"));
    const achievements: Achievement[] = [];
    querySnapshot.forEach((doc) => {
      achievements.push({ id: doc.id, ...doc.data() } as Achievement);
    });
    return achievements;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "achievements");
    return [];
  }
}

export async function addAchievement(achievement: Omit<Achievement, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "achievements"), achievement);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "achievements");
    return "";
  }
}

// ----------------- COMPETITIONS -----------------
export async function getCompetitions(): Promise<Competition[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "competitions"));
    const competitions: Competition[] = [];
    querySnapshot.forEach((doc) => {
      competitions.push({ id: doc.id, ...doc.data() } as Competition);
    });
    return competitions;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "competitions");
    return [];
  }
}

export async function addCompetition(competition: Omit<Competition, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "competitions"), competition);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "competitions");
    return "";
  }
}

// ----------------- STUDY SPACES & BOOKINGS -----------------
export async function getLibrarySpaces(): Promise<LibrarySpace[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "spaces"));
    const spaces: LibrarySpace[] = [];
    querySnapshot.forEach((doc) => {
      spaces.push({ id: doc.id, ...doc.data() } as LibrarySpace);
    });
    return spaces;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "spaces");
    return [];
  }
}

export async function bookSpace(
  spaceId: string, 
  studentName: string, 
  studentId: string, 
  startTime: string, 
  endTime: string,
  verificationCode: string,
  createdAt?: string,
  needsCheckIn?: boolean
): Promise<void> {
  try {
    const docRef = doc(db, "spaces", spaceId);
    await updateDoc(docRef, {
      status: "booked",
      currentBooking: {
        studentName,
        studentId,
        startTime,
        endTime,
        verificationCode,
        createdAt: createdAt || new Date().toISOString(),
        needsCheckIn: needsCheckIn || false
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `spaces/${spaceId}`);
  }
}

export async function releaseSpace(spaceId: string): Promise<void> {
  try {
    const docRef = doc(db, "spaces", spaceId);
    await updateDoc(docRef, {
      status: "available",
      currentBooking: null
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `spaces/${spaceId}`);
  }
}

// ----------------- STUDENT REGISTRATIONS -----------------
export async function getStudentRegistrations(): Promise<StudentRegistration[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "student_registrations"));
    const registrations: StudentRegistration[] = [];
    querySnapshot.forEach((doc) => {
      registrations.push({ id: doc.id, ...doc.data() } as StudentRegistration);
    });
    return registrations;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "student_registrations");
    return [];
  }
}

export async function registerStudent(registration: Omit<StudentRegistration, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "student_registrations"), registration);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "student_registrations");
    return "";
  }
}

// ----------------- GENERAL INQUIRIES -----------------
export async function getInquiries(): Promise<LibraryInquiry[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "inquiries"));
    const inquiries: LibraryInquiry[] = [];
    querySnapshot.forEach((doc) => {
      inquiries.push({ id: doc.id, ...doc.data() } as LibraryInquiry);
    });
    return inquiries;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "inquiries");
    return [];
  }
}

// ----------------- PRINT QUEUE SYSTEM -----------------
export async function getPrintRequests(): Promise<PrintRequest[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "print_requests"));
    const requests: PrintRequest[] = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() } as PrintRequest);
    });
    // Sort by requestedAt descending
    return requests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "print_requests");
    return [];
  }
}

export async function addPrintRequest(request: Omit<PrintRequest, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "print_requests"), request);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "print_requests");
    return "";
  }
}

export async function updatePrintRequestStatus(requestId: string, status: PrintRequest["status"]): Promise<void> {
  try {
    const docRef = doc(db, "print_requests", requestId);
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `print_requests/${requestId}`);
  }
}

// ----------------- BROADCAST NOTIFICATIONS -----------------
export async function getNotifications(): Promise<BroadcastNotification[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "notifications"));
    const notifications: BroadcastNotification[] = [];
    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() } as BroadcastNotification);
    });
    // Sort by date descending
    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "notifications");
    return [];
  }
}

export async function addNotification(notification: Omit<BroadcastNotification, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "notifications"), notification);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "notifications");
    return "";
  }
}

// ----------------- INTERACTIVE SUPPORT CHAT -----------------
export async function getChatMessages(): Promise<ChatMessage[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "chat_messages"));
    const messages: ChatMessage[] = [];
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
    });
    // Sort by timestamp ascending
    return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "chat_messages");
    return [];
  }
}

export async function addChatMessage(message: Omit<ChatMessage, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "chat_messages"), message);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "chat_messages");
    return "";
  }
}

export async function resolveStudentChats(studentId: string): Promise<void> {
  try {
    const querySnapshot = await getDocs(query(collection(db, "chat_messages"), where("studentId", "==", studentId)));
    const promises: Promise<void>[] = [];
    querySnapshot.forEach((document) => {
      const docRef = doc(db, "chat_messages", document.id);
      promises.push(updateDoc(docRef, { resolved: true }));
    });
    await Promise.all(promises);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, "chat_messages");
  }
}

// ----------------- LIBRARY GATE & CAPACITY & CLEAR SERVICES -----------------

export async function updateStudentLibraryStatus(studentRegId: string, inLibrary: boolean, accessTime: string): Promise<void> {
  try {
    const docRef = doc(db, "student_registrations", studentRegId);
    await updateDoc(docRef, {
      inLibrary,
      lastAccessTime: accessTime
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `student_registrations/${studentRegId}`);
  }
}

export interface LibraryConfig {
  totalSeats: number;
}

export async function getLibraryConfig(): Promise<LibraryConfig> {
  try {
    const docSnap = await getDocs(collection(db, "settings"));
    let totalSeats = 5;
    docSnap.forEach((d) => {
      if (d.id === "library_config") {
        totalSeats = d.data().totalSeats ?? 5;
      }
    });
    return { totalSeats };
  } catch (error) {
    return { totalSeats: 5 };
  }
}

export async function updateLibraryConfig(totalSeats: number): Promise<void> {
  try {
    const docRef = doc(db, "settings", "library_config");
    await setDoc(docRef, { totalSeats }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, "settings/library_config");
  }
}

export async function clearAllDatabaseData(): Promise<void> {
  try {
    const collectionsToPurge = [
      "loans",
      "student_registrations",
      "print_requests",
      "notifications",
      "chat_messages",
      "books"
    ];

    for (const coll of collectionsToPurge) {
      const snapshot = await getDocs(collection(db, coll));
      const deletePromises: Promise<void>[] = [];
      snapshot.forEach((document) => {
        deletePromises.push(deleteDoc(doc(db, coll, document.id)));
      });
      await Promise.all(deletePromises);
    }

    // Reset spaces to available
    const spaceSnap = await getDocs(collection(db, "spaces"));
    const spacePromises: Promise<void>[] = [];
    spaceSnap.forEach((document) => {
      spacePromises.push(
        updateDoc(doc(db, "spaces", document.id), {
          status: "available",
          currentBooking: null
        })
      );
    });
    await Promise.all(spacePromises);

    // Reset library capacity config
    await updateLibraryConfig(5);

  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, "all_collections");
  }
}

export async function verifyStudentReservations(studentId: string): Promise<void> {
  try {
    // 1. Verify space bookings
    const spacesSnap = await getDocs(collection(db, "spaces"));
    for (const d of spacesSnap.docs) {
      const sp = d.data();
      if (sp.status === "booked" && sp.currentBooking && sp.currentBooking.studentId === studentId) {
        await updateDoc(doc(db, "spaces", d.id), {
          "currentBooking.needsCheckIn": false
        });
      }
    }
    // 2. Verify book loans
    const loansSnap = await getDocs(collection(db, "loans"));
    for (const d of loansSnap.docs) {
      const ln = d.data();
      if (ln.status === "active" && ln.studentId === studentId && ln.needsCheckIn) {
        await updateDoc(doc(db, "loans", d.id), {
          needsCheckIn: false
        });
      }
    }
  } catch (error) {
    console.error("Error verifying reservations:", error);
  }
}

export async function cancelExpiredReservations(): Promise<string[]> {
  const canceledDetails: string[] = [];
  try {
    const now = new Date();

    // Fetch student registrations to determine library gate presence status (inLibrary)
    const regsSnap = await getDocs(collection(db, "student_registrations"));
    const regs = regsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

    // 1. Check spaces
    const spacesSnap = await getDocs(collection(db, "spaces"));
    for (const d of spacesSnap.docs) {
      const sp = d.data();
      if (sp.status === "booked" && sp.currentBooking) {
        const studentId = sp.currentBooking.studentId;
        const studentName = sp.currentBooking.studentName;
        const spaceName = sp.name;

        // Determine if the student is marked as 'outside'
        const studentReg = regs.find(r => r.studentId === studentId);
        const isOutside = !studentReg || studentReg.inLibrary === false;

        // Look at booking time (bookedAt or createdAt)
        const bookingTimeStr = sp.currentBooking.bookedAt || sp.currentBooking.createdAt;
        if (isOutside && bookingTimeStr) {
          const bookingTime = new Date(bookingTimeStr);
          const diffMs = now.getTime() - bookingTime.getTime();
          const diffMins = diffMs / 60000;
          if (diffMins >= 5) {
            // Release the space
            await updateDoc(doc(db, "spaces", d.id), {
              status: "available",
              currentBooking: null
            });

            // Create notification
            await addDoc(collection(db, "notifications"), {
              title: "⚠️ إلغاء حجز المقعد للتواجد خارج المكتبة",
              content: `تم إلغاء حجزك لـ (${spaceName}) تلقائياً لتواجدك خارج المكتبة ومرور أكثر من 5 دقائق منذ الحجز.`,
              targetAudience: studentId,
              createdAt: new Date().toISOString(),
              senderName: "بوابة الحجوزات الآلية"
            });

            canceledDetails.push(`Study Space booking for ${studentName} (${spaceName}) expired because student is marked outside and more than 5 mins passed.`);
          }
        }
      }
    }

    // 2. Check book loans
    const loansSnap = await getDocs(collection(db, "loans"));
    for (const d of loansSnap.docs) {
      const ln = d.data();
      if (ln.status === "active" && ln.needsCheckIn) {
        const createdStr = ln.createdAt;
        if (createdStr) {
          const createdTime = new Date(createdStr);
          const diffMs = now.getTime() - createdTime.getTime();
          const diffMins = diffMs / 60000;
          if (diffMins >= 5) {
            const studentId = ln.studentId;
            const studentName = ln.studentName;
            const bookTitle = ln.bookTitle;

            // Cancel loan (mark returned)
            await updateDoc(doc(db, "loans", d.id), {
              status: "returned",
              returnDate: new Date().toISOString().split("T")[0],
              needsCheckIn: false
            });

            // Increment book availability back
            await updateBookAvailability(ln.bookId, 1);

            // Create notification
            await addDoc(collection(db, "notifications"), {
              title: "⚠️ إلغاء حجز الكتاب لعدم الحضور",
              content: `تم إلغاء استعارة وحجز كتاب (${bookTitle}) تلقائياً لعدم الحضور إلى المكتبة خلال 5 دقائق من الحجز الخارجي.`,
              targetAudience: studentId,
              createdAt: new Date().toISOString(),
              senderName: "بوابة الاستعارة الآلية"
            });

            canceledDetails.push(`Book Reservation for ${studentName} (${bookTitle}) expired and was automatically canceled.`);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in cancelExpiredReservations:", error);
  }
  return canceledDetails;
}


