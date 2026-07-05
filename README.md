# 🏛️ FWK Library: Smart Academic & Resource Portal

**FWK Library** is a cutting-edge, full-stack, responsive web application designed for the **College of Computer Science and Information Library**. It serves as an integrated smart portal featuring physical book catalogs, digital graduation project repositories, student activity registrations, interactive real-time study space floor maps, and server-side **Gemini AI academic assistance**.

---

## 🎨 Design Vision & Bilingualism
* **Bilingual Arabic & English Support:** Full localized interface toggleable in a single click, catering to Arab students and international academic teams seamlessly.
* **Modern & Responsive UI:** Designed with generous spacing, custom typography pairing, elegant transitions using `motion/react`, and visual feedback.
* **Compact Layouts:** No cluttered headers or terminal lines—just pristine layout cards, custom responsive interactive maps, and real-time live support chat.

---

## 🌟 Key Modules & Features

### 1. 📊 Interactive Floor Map & Live Seating (Newly Updated)
* **Visual Seat Layout:** Dynamic visual seating maps for individual study zones (e.g. silent study reading rooms, VR sandbox labs, high-performance GPU workstations, and collaboration spaces).
* **Live Status:** Color-coded circles mapping occupancy states (Free 🟢, Busy 🔴, Under Maintenance 🟡) in real-time.
* **Occupant Overlay:** Displays active occupant names, scheduled timings, and verification security codes directly on the layout card when a segment is selected.

### 2. 📚 Smart Catalog & Book Circulation
* **Digital Inventory:** Dynamic catalogs categorizing textbooks, references, and papers.
* **Instant Borrowing (QR-Code Powered):** Student reservations automatically generate interactive, scanning-ready secure QR codes.
* **Admin Verification:** Librarians can scan generated QR codes to checkout or return books seamlessly.

### 3. 🎓 Graduation Projects Hub & Printing Queue
* **Project Repository:** Completed projects, searchable by year, department, advisor, and category, with links to source repositories.
* **Incomplete Draft Submissions:** Upload-only portal for current graduation groups to draft titles, load project abstracts, and design drafts.
* **3D Binding & Printing Queue:** Request binding (hardcover, softcover, spiral) or paper sizes (A4, A3). Requests join a live, trackable status queue (Pending ⏱️, Printing 🖨️, Ready 📦).

### 4. 🤖 AI-Powered Academic Assistant
* **Smart Semantic Search:** Powered by server-side Gemini AI models via the modern `@google/genai` SDK.
* **Bilingual LLM Chats:** Students can request literature reviews, ask code-related questions, draft abstracts, or find book locations inside the physical library halls.

### 5. 🛡️ Admin Control & Operations
* **Live Broadcasts:** Dispatch urgent notices (e.g., exams, library shutdowns) targeting specific student populations.
* **Security Logs:** Automatic audit trails of entries, book loans, and system overrides.
* **Support Helpdesk:** Real-time chat helpdesk connecting students to librarian admins.

---

## 💻 Tech Stack & Architecture

### Frontend
* **Core Framework:** React 19 + TypeScript (Fast, modular, strongly-typed components)
* **Build System:** Vite 6 (Zero HMR flickering during cold-starts)
* **Styles:** Tailwind CSS v4 (Pure utility classes, modern layout mechanics)
* **Animation Engine:** `motion/react` (Smooth slide transitions and interactive feedback)
* **Data Visualization:** `recharts` (Congestion analysis and resource statistics)
* **Scanning:** `html5-qrcode` (Browser-based QR code camera parser)

### Backend
* **Runtime:** Node.js (with `tsx` execution in dev mode)
* **Server Framework:** Express (Proxying requests safely, serving static SPA bundles)
* **Compiler:** `esbuild` (Compiling the Express server into `dist/server.cjs` for performance)

### Databases & Cloud
* **Persistent Database:** Firebase Firestore (Durable real-time document storage)
* **Authentication:** Firebase Auth (Secure student logins and credentials)

---

## 🗄️ Database Schema Blueprint

The application interfaces directly with **Firebase Firestore** using the following collections:

| Collection Name | Schema Entities | Description |
| :--- | :--- | :--- |
| `books` | `Book` | Stores physical title metadata, categories, available/total stock count. |
| `loans` | `Loan` | Book loan tracking, return states, dates, and QR verification codes. |
| `projects` | `GraduationProject` | Archive of published graduate projects, students list, and abstract. |
| `incomplete_projects` | `IncompleteProject` | Drafts and ongoing project briefs uploaded by active graduating cohorts. |
| `spaces` | `LibrarySpace` | Multi-node study locations, current status, and active occupant schedules. |
| `student_registrations` | `StudentRegistration` | Portal profiles, RFID cards, verified activities, and QR tokens. |
| `print_requests` | `PrintRequest` | Automated binding requests, paper specs, copy numbers, and state. |
| `notifications` | `BroadcastNotification` | System-wide notices targetting general or specific student profiles. |
| `chat_messages` | `ChatMessage` | Instant messaging strings for live support helpdesk. |

---

## ⚙️ Setup & Installation

### Prerequisites
* Node.js (v18 or higher)
* NPM

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone <your-repository-url>
cd fwk-library

# Install base dependencies
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root folder based on `.env.example`:
```env
# Gemini API Key (Required for server-side smart academic helper)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration (Automatically configured by platform)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### 3. Run the Development Server
```bash
# Start backend Express server + Vite Dev server
npm run dev
```
The application will boot and be accessible at `http://localhost:3000`.

### 4. Build for Production
To bundle the frontend assets and compile the backend into a CJS file:
```bash
npm run build
```
Deployments run automatically via the start script:
```bash
npm run start
```

---

## 🔒 Security Rules & Integrity
Security constraints are stored inside `firestore.rules` preventing unauthenticated edits. The backend operates with strict checks to safeguard user-authored logs and academic credentials.

## 🤝 Authors & Credits
Designed and developed for the **College of Computer Science and Information Library (FWK)**. Inspired by smart, student-first learning centers.
