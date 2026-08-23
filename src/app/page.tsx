"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  CalendarDays, ClipboardList, LayoutDashboard, Users, LogOut, 
  ShieldAlert, BookOpen, MessageSquareWarning, Bell, UserCircle, 
  Loader2, Menu, X, FolderUp, Briefcase, Award, ChevronLeft, ChevronRight, Info, CheckCircle2, Trash2
} from "lucide-react";

// Components
import Chatbot from '@/components/Chatbot';
import Login from "@/components/Login";
import AdminDashboard from "@/components/AdminDashboard";
import MentorDashboard from "@/components/MentorDashboard";
import Projects from "@/components/Projects";
import LeaveRequest from "@/components/LeaveRequest";
import Helpdesk from "@/components/Helpdesk";
import Timetable from "@/components/Timetable";
import CourseMaterials from "@/components/CourseMaterials";
import PlacementATS from "@/components/PlacementATS";

const ADMIN_EMAILS = ["sakthirp.official@gmail.com"];
const MENTOR_EMAILS = ["mentor@issm.edu.in", "professor@issm.edu.in"];
const PLACEMENT_EMAILS = ["placements@issm.edu.in"];

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<"Student" | "Admin" | "Mentor" | "Placement">("Student");
  
  const [personal, setPersonal] = useState<any | null>(null);
  const [academic, setAcademic] = useState<any | null>(null);
  const [attendance, setAttendance] = useState<any | null>(null);
  const [marks, setMarks] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        const email = session.user.email.toLowerCase();
        setUserEmail(email);
        
        if (ADMIN_EMAILS.includes(email)) setRole("Admin");
        else if (MENTOR_EMAILS.includes(email)) setRole("Mentor");
        else if (PLACEMENT_EMAILS.includes(email)) setRole("Placement");
        else setRole("Student");
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (!userEmail || role !== "Student") return;
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);
      const { data: personalData, error: personalError } = await supabase.from("personal_data").select("*").eq("email", userEmail).maybeSingle();

      if (personalError || !personalData) {
        if (!cancelled) { setError("Profile not found. Contact admin."); setLoading(false); }
        return;
      }
      const rollNumber = personalData.roll_number;
      const [academicRes, attendanceRes, marksRes] = await Promise.all([
        supabase.from("academic_data").select("*").eq("roll_number", rollNumber).maybeSingle(),
        supabase.from("attendance_data").select("*").eq("roll_number", rollNumber).maybeSingle(),
        supabase.from("marks_data").select("*").eq("roll_number", rollNumber),
      ]);

      if (!cancelled) {
        setPersonal(personalData);
        setAcademic(academicRes.data);
        setAttendance(attendanceRes.data);
        setMarks(marksRes.data || []);
        setLoading(false);
      }
    }
    void loadDashboard();
    return () => { cancelled = true; };
  }, [userEmail, role]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    setPersonal(null);
    setRole("Student");
  };

  if (!userEmail) return <Login />;
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {role === "Admin" ? (
        <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6">
          <div className="mb-6 flex justify-between"><h1 className="text-2xl font-bold flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-indigo-600"/> Admin Center</h1><button onClick={handleLogout} className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium border shadow-sm hover:bg-slate-50"><LogOut className="h-4 w-4" /> Sign Out</button></div>
          <AdminDashboard />
        </div>
      ) : role === "Mentor" ? (
        <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6">
          <div className="mb-6 flex justify-between"><h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-indigo-600"/> Mentor Center</h1><button onClick={handleLogout} className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium border shadow-sm hover:bg-slate-50"><LogOut className="h-4 w-4" /> Sign Out</button></div>
          <MentorDashboard mentorEmail={userEmail} />
        </div>
      ) : (
        <StudentShell personal={personal} academic={academic} attendance={attendance} marks={marks} loading={loading} error={error} handleLogout={handleLogout} />
      )}
      {role === "Student" && <Chatbot />}
    </div>
  );
}

function StudentShell({ personal, academic, attendance, marks, loading, error, handleLogout }: any) {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Real Database States
  const [uploadedSpec, setUploadedSpec] = useState<string | null>(null);
  const [uploadedMgmt, setUploadedMgmt] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Sync state with Database on load
  useEffect(() => {
    if (personal) {
      setUploadedSpec(personal.spec_resume_url || null);
      setUploadedMgmt(personal.mgmt_resume_url || null);
    }
  }, [personal]);

  const menuItems = [
    { id: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "Academics", icon: <BookOpen className="h-5 w-5" /> },
    { id: "Projects", icon: <FolderUp className="h-5 w-5" /> },
    { id: "Calendar", icon: <CalendarDays className="h-5 w-5" /> },
    { id: "Requests", icon: <MessageSquareWarning className="h-5 w-5" /> },
    { id: "Placements", icon: <Briefcase className="h-5 w-5" /> },
    { id: "Skills", icon: <Award className="h-5 w-5" /> },
  ];

  // REAL SUPABASE UPLOAD LOGIC
  const handleSpecUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const filePath = `${personal.roll_number}_spec_${Date.now()}`;
      const { error: uploadError } = await supabase.storage.from('resumes').upload(filePath, file);
      if (uploadError) throw new Error("Storage Error: Check if 'resumes' bucket exists and is public.");
      
      const { data } = supabase.storage.from('resumes').getPublicUrl(filePath);
      const { error: dbError } = await supabase.from('personal_data').update({ spec_resume_url: data.publicUrl }).eq('roll_number', personal.roll_number);
      if (dbError) throw new Error("Database Error saving URL.");
      
      setUploadedSpec(data.publicUrl);
      alert("✅ Specialization Resume successfully uploaded and secured in your vault.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMgmtUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const filePath = `${personal.roll_number}_mgmt_${Date.now()}`;
      const { error: uploadError } = await supabase.storage.from('resumes').upload(filePath, file);
      if (uploadError) throw new Error("Storage Error: Check if 'resumes' bucket exists and is public.");
      
      const { data } = supabase.storage.from('resumes').getPublicUrl(filePath);
      const { error: dbError } = await supabase.from('personal_data').update({ mgmt_resume_url: data.publicUrl }).eq('roll_number', personal.roll_number);
      if (dbError) throw new Error("Database Error saving URL.");
      
      setUploadedMgmt(data.publicUrl);
      alert("✅ Management Resume successfully uploaded and secured in your vault.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // DELETE RESUME LOGIC
  const handleDeleteResume = async (type: 'spec' | 'mgmt') => {
    if (!confirm("Are you sure you want to delete this resume?")) return;
    setIsUploading(true);
    const column = type === 'spec' ? 'spec_resume_url' : 'mgmt_resume_url';
    try {
      const { error } = await supabase.from('personal_data').update({ [column]: null }).eq('roll_number', personal.roll_number);
      if (error) throw error;
      
      if (type === 'spec') setUploadedSpec(null);
      else setUploadedMgmt(null);
      
      alert("🗑️ Resume deleted successfully. You can now upload a new one.");
    } catch (err: any) {
      alert("Error deleting resume: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex w-full">
      {isMobileMenuOpen && <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

      <aside className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm border border-slate-200"><img src="/issm-logo.png" alt="ISSM Logo" className="h-full w-full object-contain" /></div>
            <div><p className="text-sm font-bold tracking-tight">ISSM Smart</p><p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Campus Portal</p></div>
          </div>
          <button className="md:hidden text-slate-400 hover:text-slate-600" onClick={() => setIsMobileMenuOpen(false)}><X className="h-6 w-6" /></button>
        </div>

        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${activeTab === item.id ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
              {item.icon} {item.id}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100"><button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-red-50 hover:text-red-700"><LogOut className="h-5 w-5" /> Sign Out</button></div>
      </aside>

      <main className="flex-1 w-full md:ml-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 md:px-8 backdrop-blur w-full">
          <div className="flex items-center gap-3"><button className="md:hidden text-slate-600 p-2 -ml-2 hover:bg-slate-100 rounded-lg" onClick={() => setIsMobileMenuOpen(true)}><Menu className="h-6 w-6" /></button><h1 className="text-xl font-bold tracking-tight text-slate-900 hidden sm:block">{activeTab}</h1></div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4 cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
              <div className="text-right hidden sm:block"><p className="text-sm font-semibold hover:text-indigo-600">{personal?.full_name || "Loading..."}</p><p className="text-xs text-slate-500">{personal?.roll_number}</p></div>
              <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-indigo-100 bg-indigo-50 flex items-center justify-center text-indigo-600">{personal?.profile_pic_url ? <img src={personal.profile_pic_url} className="h-full w-full object-cover" /> : <UserCircle className="h-6 w-6" />}</div>
            </div>
          </div>
        </header>

        {/* PROFILE MODAL & DOCUMENT VAULT */}
        <AnimatePresence>
          {isProfileModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setIsProfileModalOpen(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="bg-indigo-600 p-6 flex flex-col items-center text-white relative flex-shrink-0">
                  <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="h-5 w-5"/></button>
                  <div className="h-24 w-24 rounded-full border-4 border-white/20 overflow-hidden bg-white/10 mb-4 flex items-center justify-center">{personal?.profile_pic_url ? <img src={personal.profile_pic_url} className="h-full w-full object-cover"/> : <UserCircle className="h-12 w-12"/>}</div>
                  <h2 className="text-xl font-bold">{personal?.full_name}</h2><p className="text-indigo-200 text-sm">{personal?.roll_number}</p>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                  
                  <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div><p className="text-slate-500 text-xs">Email</p><p className="font-medium text-slate-800 break-all">{personal?.email}</p></div>
                    <div><p className="text-slate-500 text-xs">Phone</p><p className="font-medium text-slate-800">{personal?.phone || "N/A"}</p></div>
                    <div><p className="text-slate-500 text-xs">Programme</p><p className="font-medium text-slate-800">{academic?.programme || "MBA"}</p></div>
                    <div><p className="text-slate-500 text-xs">Specialization</p><p className="font-medium text-slate-800">{academic?.specialization || "Systems"}</p></div>
                    <div><p className="text-slate-500 text-xs">Semester</p><p className="font-medium text-slate-800">Semester {academic?.current_semester || "1"}</p></div>
                    <div><p className="text-slate-500 text-xs">City</p><p className="font-medium text-slate-800">{personal?.city || "Chennai"}</p></div>
                  </div>
                  
                  {/* REAL DB DOCUMENT VAULT WITH DELETE BUTTONS */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">Document Vault</h3>
                    <div className="space-y-3">
                      
                      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                        <span className="text-xs font-semibold text-slate-700">Specialization Resume</span>
                        {isUploading ? (
                           <Loader2 className="h-4 w-4 animate-spin text-indigo-600"/>
                        ) : uploadedSpec ? (
                          <div className="flex items-center gap-3">
                            <a href={uploadedSpec} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline">
                              <CheckCircle2 className="h-4 w-4"/> View
                            </a>
                            <button onClick={() => handleDeleteResume('spec')} className="text-red-500 hover:text-red-700 p-1 rounded-md bg-red-50 hover:bg-red-100 transition-colors" title="Delete Resume">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-indigo-100 transition-colors">
                            Upload File <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleSpecUpload}/>
                          </label>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                        <span className="text-xs font-semibold text-slate-700">Management Resume</span>
                        {isUploading ? (
                           <Loader2 className="h-4 w-4 animate-spin text-indigo-600"/>
                        ) : uploadedMgmt ? (
                          <div className="flex items-center gap-3">
                            <a href={uploadedMgmt} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline">
                              <CheckCircle2 className="h-4 w-4"/> View
                            </a>
                            <button onClick={() => handleDeleteResume('mgmt')} className="text-red-500 hover:text-red-700 p-1 rounded-md bg-red-50 hover:bg-red-100 transition-colors" title="Delete Resume">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-indigo-100 transition-colors">
                            Upload File <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleMgmtUpload}/>
                          </label>
                        )}
                      </div>

                    </div>
                  </div>

                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 md:p-8 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {activeTab === "Dashboard" && <DashboardTab personal={personal} attendance={attendance} />}
              {activeTab === "Academics" && <AcademicsTab marks={marks} academic={academic} />}
              {activeTab === "Projects" && <Projects rollNumber={personal?.roll_number} />}
              {activeTab === "Calendar" && <StudentCalendar rollNumber={personal?.roll_number} />}
              {activeTab === "Requests" && <RequestsTab rollNumber={personal?.roll_number} />}
              {activeTab === "Placements" && <PlacementATS rollNumber={personal?.roll_number} />}
              {activeTab === "Skills" && <div className="p-12 text-center border border-slate-200 bg-white rounded-2xl"><Award className="h-12 w-12 mx-auto text-amber-400 mb-4"/><h2 className="text-xl font-bold text-slate-700">Skills & AI Certification</h2></div>}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// DASHBOARD
function DashboardTab({ personal, attendance }: any) {
  const [attendancePct, setAttendancePct] = useState(0);

  useEffect(() => {
    setAttendancePct(attendance?.attendance_percentage || 0);
  }, [attendance]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 md:p-8 shadow-sm">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"></div>
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">ISSM Business School</p>
          <h1 className="text-2xl font-extrabold text-white md:text-4xl">Welcome, <br className="hidden sm:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">{personal?.full_name}</span></h1>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Quick Attendance Status</h2>
          <div className="flex items-center gap-4">
             <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-indigo-100 text-lg font-bold text-indigo-600">{attendancePct}%</div>
             <div><p className="text-sm font-medium text-slate-500">You are maintaining good academic standing. Keep it up!</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col h-full">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2"><Bell className="h-4 w-4 text-amber-500"/> Campus Announcements</h2>
          <div className="space-y-3 flex-1 overflow-y-auto">
             <div className="rounded-lg bg-indigo-50 p-3 border border-indigo-100"><p className="text-xs font-bold text-indigo-700 mb-1">Placement Drive Update</p><p className="text-xs text-slate-600">Ensure both your Specialization and Management resumes are uploaded in your profile by Friday.</p></div>
             <div className="rounded-lg bg-slate-50 p-3 border border-slate-100"><p className="text-xs font-bold text-slate-700 mb-1">Semester Projects</p><p className="text-xs text-slate-500">Check the Projects tab. Deadlines are strictly enforced via the system clock.</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ACADEMICS, REQUESTS, CALENDAR
function AcademicsTab({ marks, academic }: any) { 
  return (
    <div className="grid gap-6 xl:grid-cols-3 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-1 lg:col-span-2">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ClipboardList className="h-5 w-5 text-indigo-600"/> Grade History</h3>
        <table className="min-w-full text-left text-sm whitespace-nowrap"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-2 font-medium">Subject</th><th className="px-4 py-2 font-medium">Grade</th></tr></thead><tbody className="divide-y divide-slate-100">{marks.map((row: any) => (<tr key={row.id}><td className="px-4 py-3">{row.subject_name}</td><td className="px-4 py-3 font-bold">{row.grade}</td></tr>))}</tbody></table>
      </div>
      <div className="xl:col-span-1 h-full"><Timetable specialization={academic?.specialization} semester={academic?.current_semester} /></div>
      <div className="xl:col-span-1 h-full"><CourseMaterials subjectCode="MBA-401" canUpload={false} /></div>
    </div>
  ); 
}

function RequestsTab({ rollNumber }: { rollNumber: string }) { 
  if (!rollNumber) return <p>Loading...</p>; 
  return <div className="space-y-8"><LeaveRequest rollNumber={rollNumber} /><Helpdesk rollNumber={rollNumber} /></div>; 
}

function StudentCalendar({ rollNumber }: { rollNumber: string }) {
  const [dailyAttendance, setDailyAttendance] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDayRecord, setSelectedDayRecord] = useState<any | null>(null);
  
  useEffect(() => {
    async function fetchAttendance() {
      if (!rollNumber) return;
      const { data } = await supabase.from("daily_attendance").select("*").eq("roll_number", rollNumber);
      if (data) setDailyAttendance(data);
    }
    fetchAttendance();
  }, [rollNumber, currentMonth]);
  
  const today = new Date();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-indigo-600"/> My Daily Attendance</h3>
        <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-1.5 hover:bg-white text-slate-600"><ChevronLeft className="h-5 w-5"/></button>
          <span className="font-bold w-32 text-center text-sm">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-1.5 hover:bg-white text-slate-600"><ChevronRight className="h-5 w-5"/></button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-bold text-slate-400"><div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div></div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const record = dailyAttendance.find(r => r.date === dateStr);
              const isToday = today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();
              let bgClass = "bg-slate-50 hover:bg-slate-100 border text-slate-600";
              if (record) {
                if (record.status.toLowerCase() === 'present') bgClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                else if (record.status.toLowerCase() === 'absent') bgClass = "bg-red-50 text-red-700 border-red-200";
                else bgClass = "bg-amber-50 text-amber-700 border-amber-200";
              }
              return (
                <button key={day} onClick={() => setSelectedDayRecord({ day, dateString: dateStr, record })} className={`aspect-square rounded-lg flex items-center justify-center text-sm font-semibold ${bgClass} ${isToday ? 'ring-2 ring-indigo-600 font-extrabold shadow-md' : ''}`}>{day}</button>
              );
            })}
          </div>
        </div>
        <div className="w-full md:w-72 rounded-xl bg-slate-50 border p-5 flex flex-col">
          <h4 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2">Session Details</h4>
          {selectedDayRecord && selectedDayRecord.record ? (
            <div className="space-y-4">
              <div><p className="text-xs text-slate-400">Date</p><p className="text-sm font-bold text-slate-900">{selectedDayRecord.dateString}</p></div>
              <div><p className="text-xs text-slate-400">Status</p><span className="inline-block px-3 py-1 text-xs font-bold uppercase border bg-white mt-1">{selectedDayRecord.record.status}</span></div>
              {selectedDayRecord.record.reason && <div><p className="text-xs text-slate-400">Reason</p><p className="text-sm font-medium text-slate-700 bg-white p-3 rounded-lg border mt-1">{selectedDayRecord.record.reason}</p></div>}
            </div>
          ) : <div className="text-center text-slate-500 mt-10"><Info className="h-8 w-8 mx-auto mb-2 opacity-50"/><p className="text-sm">Click a date to view record.</p></div>}
        </div>
      </div>
    </div>
  );
}