"use client";

import { useEffect, useState } from "react";
import {
  Calendar, ClipboardList, GraduationCap, LayoutDashboard,
  Users, LogOut, ShieldAlert, BookOpen, MessageSquareWarning, CalendarDays, Bell, UserCircle, Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Components
import Chatbot from '@/components/Chatbot';
import Login from "@/components/Login";
import AdminDashboard from "@/components/AdminDashboard";
import LeaveRequest from "@/components/LeaveRequest";
import Helpdesk from "@/components/Helpdesk";
import Timetable from "@/components/Timetable";
import CourseMaterials from "@/components/CourseMaterials";

type PersonalData = { roll_number: string; full_name: string; email: string; city: string; profile_pic_url?: string };
type AcademicData = { programme: string; specialization: string; current_semester: string; section: string; };
type AttendanceData = { total_sessions: number; sessions_attended: number; attendance_percentage: number; };
type MarkRow = { id: string; subject_code: string; subject_name: string; internals: number; midterm: number; endterm: number; total_score: number; grade: string; };

const ADMIN_EMAILS = ["sakthirp.official@gmail.com"];

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<"Student" | "Admin">("Student");
  
  const [personal, setPersonal] = useState<PersonalData | null>(null);
  const [academic, setAcademic] = useState<AcademicData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [marks, setMarks] = useState<MarkRow[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        setRole(ADMIN_EMAILS.includes(session.user.email.toLowerCase()) ? "Admin" : "Student");
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (!userEmail || role === "Admin") return;
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
        setAcademic(academicRes.data as AcademicData);
        setAttendance(attendanceRes.data as AttendanceData);
        setMarks(marksRes.data as MarkRow[] || []);
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

  // 🚀 SECURE BLOCK 1: Show a loading screen while checking the database
  // This prevents the empty dashboard from flashing on the screen.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // 🚀 SECURE BLOCK 2: The Hard Stop for Unregistered Emails
  if (role === "Student" && error && !personal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <ShieldAlert className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">Access Restricted</h2>
          <p className="mb-6 text-sm text-slate-600">
            The email address <span className="font-semibold text-slate-900">{userEmail}</span> is not registered in the official campus database.
          </p>
          <div className="mb-8 rounded-xl bg-slate-50 p-4 text-xs font-medium text-slate-500 border border-slate-100 text-left">
            <strong className="text-slate-700 block mb-1">Security Policy:</strong> 
            Only pre-authorized students mapped to a valid Roll Number can access the ISSM Smart portal. Please log in with your official ID.
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition-all hover:bg-red-600"
          >
            <LogOut className="h-4 w-4" /> Sign Out & Try Again
          </button>
        </div>
      </div>
    );
  }

  // If they pass the checks, let them into the app!
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {role === "Admin" ? (
        <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-indigo-600"/> Admin Control Center</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
          <AdminDashboard />
        </div>
      ) : (
        <StudentShell 
          personal={personal} academic={academic} attendance={attendance} 
          marks={marks} loading={loading} error={error} handleLogout={handleLogout} 
        />
      )}
      {role === "Student" && <Chatbot />}
    </div>
  );
}

function StudentShell({ personal, academic, attendance, marks, loading, error, handleLogout }: any) {
  const [activeTab, setActiveTab] = useState("Dashboard");
  
  const menuItems = [
    { id: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "Academics", icon: <BookOpen className="h-5 w-5" /> },
    { id: "Requests", icon: <MessageSquareWarning className="h-5 w-5" /> },
    { id: "Calendar", icon: <CalendarDays className="h-5 w-5" /> },
  ];

  return (
    <div className="flex w-full">
      {/* Premium Fixed Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white shadow-sm md:flex">
        <div className="flex h-20 items-center gap-3 px-6 border-b border-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm border border-slate-200">
            <img src="/issm-logo.png" alt="ISSM Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">ISSM Smart</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Campus Portal</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 p-4">
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Main Menu</p>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                activeTab === item.id 
                  ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-100" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.icon}
              {item.id}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-red-50 hover:text-red-700">
            <LogOut className="h-5 w-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 md:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{personal?.full_name || "Loading..."}</p>
                <p className="text-xs text-slate-500">{personal?.roll_number}</p>
              </div>
              {/* ID Card Profile Picture Placeholder */}
              <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-indigo-100 bg-indigo-50 text-indigo-600 flex items-center justify-center">
                {personal?.profile_pic_url ? (
                   <img src={personal.profile_pic_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                   <UserCircle className="h-6 w-6" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Framer Motion Tab Transitions */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "Dashboard" && <DashboardTab personal={personal} academic={academic} attendance={attendance} error={error} loading={loading} />}
              {activeTab === "Academics" && <AcademicsTab marks={marks} academic={academic} loading={loading} />}
              {activeTab === "Requests" && <RequestsTab rollNumber={personal?.roll_number} />}
              {activeTab === "Calendar" && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">🗓️ Interactive Academic Calendar coming in Phase B...</div>}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS FOR THE TABS ---

function DashboardTab({ personal, academic, attendance, error, loading }: any) {
  const [timeFilter, setTimeFilter] = useState("Semester");
  
  const present = attendance?.sessions_attended || 0;
  const total = attendance?.total_sessions || 0;
  const absent = Math.max(0, total - present - 2); 
  const approvedLeaves = 2; 
  const lateComings = 1;    
  const attendancePct = attendance?.attendance_percentage ?? 0;

  const chartData = [
    { name: 'Present', value: present, color: '#4f46e5' }, 
    { name: 'Absent', value: absent, color: '#ef4444' }, 
    { name: 'Approved Leave', value: approvedLeaves, color: '#10b981' }, 
    { name: 'Late', value: lateComings, color: '#f59e0b' }, 
  ];

  return (
    <div className="space-y-6">
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      
      {/* 🚀 NEW PERSONALIZED HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-8 shadow-sm">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"></div>
        <div className="relative z-10">
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-2">ISSM Business School</p>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            Welcome Future Business Leader, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Mr. Sakthi R P</span>
          </h1>
          <p className="mt-4 text-sm font-medium text-slate-300 max-w-xl">
            Your centralized command center for academic analytics, daily attendance, and operational requests.
          </p>
        </div>
      </div>
      
      {/* Existing Analytics Filter Bar */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
         <h2 className="text-sm font-bold text-slate-700">Attendance Analytics</h2>
         <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all cursor-pointer"
         >
            <option value="Week">This Week</option>
            <option value="Month">This Month</option>
            <option value="Semester">Entire Semester</option>
         </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Advanced Interactive Donut Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1 flex flex-col items-center">
           <h3 className="text-sm font-medium text-slate-500 w-full text-left mb-4">Breakdown ({timeFilter})</h3>
           
           <div className="h-48 w-full relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={chartData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={4}
                   dataKey="value"
                   stroke="none"
                 >
                   {chartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} className="transition-all duration-300 hover:opacity-80 cursor-pointer" />
                   ))}
                 </Pie>
                 <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                 />
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-3xl font-bold tracking-tight text-slate-800">{attendancePct}%</span>
             </div>
           </div>
           
           <div className="mt-4 w-full grid grid-cols-2 gap-3 text-xs font-semibold text-slate-600">
             {chartData.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                   <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></span>
                   <span className="text-slate-900">{item.name}: {item.value}</span>
                </div>
             ))}
           </div>
        </div>

        {/* Live Campus Action Center */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-sm flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl"></div>
           
           <h3 className="flex items-center gap-2 text-sm font-medium text-indigo-300 mb-6 relative z-10">
              <Bell className="h-4 w-4"/> Campus Action Center
           </h3>
           
           <div className="space-y-4 flex-1 overflow-y-auto relative z-10 pr-2">
             <div className="group rounded-xl bg-white/5 p-4 backdrop-blur-md border border-white/10 transition-all hover:bg-white/10 hover:border-white/20">
               <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Request Approved</p>
                  <span className="text-[10px] text-slate-400">2 hours ago</span>
               </div>
               <p className="text-sm font-medium text-slate-200">Your On-Duty (OD) request for the Corporate Tax Seminar has been approved.</p>
             </div>
             
             <div className="group rounded-xl bg-white/5 p-4 backdrop-blur-md border border-white/10 transition-all hover:bg-white/10 hover:border-white/20">
               <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">New Announcement</p>
                  <span className="text-[10px] text-slate-400">Yesterday</span>
               </div>
               <p className="text-sm font-medium text-slate-200">GST Regulations & Indian Stock Market workshop scheduled for tomorrow at 10 AM in the main auditorium.</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function AcademicsTab({ marks, academic, loading }: any) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* 1. Grade History */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden lg:col-span-1">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ClipboardList className="h-5 w-5 text-indigo-600"/> Grade History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Subject</th>
                <th className="px-4 py-2 font-medium">Total</th>
                <th className="px-4 py-2 font-medium">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={3} className="py-4 text-center">Loading...</td></tr> : 
                marks.map((row: any) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-medium">{row.subject_name}</td>
                    <td className="px-4 py-3 font-semibold">{row.total_score}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">{row.grade}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Timetable */}
      <div className="lg:col-span-1 h-full">
        <Timetable specialization={academic?.specialization} semester={academic?.current_semester} />
      </div>

      {/* 3. Course Materials */}
      <div className="lg:col-span-1 h-full">
        <CourseMaterials subjectCode="MBA-401" canUpload={false} />
      </div>
    </div>
  );
}

function RequestsTab({ rollNumber }: { rollNumber: string }) {
  if (!rollNumber) return <p>Loading...</p>;
  return (
    <div className="space-y-8">
      <LeaveRequest rollNumber={rollNumber} />
      <Helpdesk rollNumber={rollNumber} />
    </div>
  );
}