export interface Book {
  id: string;
  title: string;
  author: string;
  category: "recreational" | "educational" | "curricula" | "income-boosting";
  subCategory?: string; // e.g., "Investment", "Trading", "E-commerce", "AI Programming"
  description: string;
  coverUrl?: string;
  pages?: number;
  isbn?: string;
  availableCount: number;
  totalCount: number;
}

export interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  studentName: string;
  studentId: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: "active" | "returned" | "overdue";
  qrCodeData: string; // Dynamic QR tracker
  createdAt?: string;
  needsCheckIn?: boolean;
}

export interface GraduationProject {
  id: string;
  title: string;
  students: string[];
  advisor: string;
  year: number;
  abstract: string;
  category: "AI" | "Cybersecurity" | "Software Engineering" | "Data Science" | "Network";
  isCompleted: boolean;
  coverUrl?: string; // photo upload or default icon
  githubUrl?: string;
}

export interface IncompleteProject {
  id: string;
  title: string;
  students: string[];
  description: string;
  coverUrl: string; // Cover photograph uploaded by student
  uploadedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  date: string;
  description: string;
  type: "academic" | "research" | "community";
  recipient: string;
  certificateUrl?: string; // Uploaded certificate
}

export interface Competition {
  id: string;
  title: string;
  date: string;
  placement: string; // e.g., "1st Place", "Gold Medalist", "Participant"
  description: string;
  teamMembers: string[];
  certificateUrl?: string; // Uploaded certificate
}

export interface LibrarySpace {
  id: string;
  name: string;
  type: "silent-study" | "group-study" | "computer-lab" | "vr-lab";
  status: "available" | "booked" | "maintenance";
  currentBooking?: {
    studentName: string;
    studentId: string;
    startTime: string;
    endTime: string;
    verificationCode: string;
    createdAt?: string;
    needsCheckIn?: boolean;
  };
}

export interface StudentRegistration {
  id: string;
  studentName: string;
  studentId: string;
  email: string;
  phone: string;
  department: string;
  activities: string[];
  registrationDate: string;
  qrCodeData: string;
  inLibrary?: boolean;
  lastAccessTime?: string;
}

export interface LibraryInquiry {
  id: string;
  question: string;
  answer: string;
  category: "guidelines" | "lending" | "hours" | "spaces";
}

export interface PrintRequest {
  id: string;
  projectId: string;
  projectTitle: string;
  studentName: string;
  studentId: string;
  paperSize: "A4" | "A3";
  coverType: "hardcover" | "softcover" | "spiral";
  copies: number;
  extraNotes?: string;
  requestedAt: string;
  status: "pending" | "printing" | "ready" | "completed";
}

export interface BroadcastNotification {
  id: string;
  title: string;
  content: string;
  targetAudience: "college_only" | "other_only" | "all";
  createdAt: string;
  senderName: string;
}

export interface ChatMessage {
  id: string;
  studentName: string;
  studentId: string;
  message: string;
  senderRole: "student" | "admin";
  timestamp: string;
  resolved?: boolean;
}

