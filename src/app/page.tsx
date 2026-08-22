"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Calendar,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Users,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Chatbot from '@/components/Chatbot';
import CourseMaterials from "@/components/CourseMaterials";
import Login from "@/components/Login";
import AdminDashboard from "@/components/AdminDashboard";
import LeaveRequest from "@/components/LeaveRequest";
import Helpdesk from "@/components/Helpdesk";
import Timetable from "@/components/Timetable";

type PersonalData = { roll_number: string; full_name: string; email: string; city: string; };
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
        const email = session.user.email;
        setUserEmail(email);
        
        if (ADMIN_EMAILS.includes(email.toLowerCase())) {
          setRole("Admin");
        } else {
          setRole("Student");
        }
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

      const { data: personalData, error: personalError } = await supabase
        .from("personal_data")
        .select("*")
        .eq("email", userEmail)
        .maybeSingle();

      if (personalError || !personalData) {
        if (!cancelled) {
          setError("Profile not found in database. Contact admin.");
          setLoading(false);
        }
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

    return () => {
      cancelled = true;
    };
  }, [userEmail, role]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    setPersonal(null);
    setRole("Student");
  };

  if (!userEmail) {
    return <Login />;
  }

  const gpa = "8.42";

  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">ISSM Business School</p>
              <p className="text-xs text-slate-500">
                {role === "Admin" ? "Admin Control Center" : "Student Portal"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {role === "Admin" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                <ShieldAlert className="h-3.5 w-3.5" /> Admin Mode
              </span>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {role === "Admin" ? (
          <AdminDashboard />
        ) : (
          <StudentView
            personal={personal}
            academic={academic}
            attendance={attendance}
            gpa={gpa}
            marks={marks}
            loading={loading}
            error={error}
          />
        )}
      </main>
      {role === "Student" && <Chatbot />}
    </div>
  );
}

function StudentView({
  personal,
  academic,
  attendance,
  gpa,
  marks,
  loading,
  error,
}: {
  personal: PersonalData | null;
  academic: AcademicData | null;
  attendance: AttendanceData | null;
  gpa: string;
  marks: MarkRow[];
  loading: boolean;
  error: string | null;
}) {
  const studentName = personal?.full_name ?? "Student";
  const rollNumber = personal?.roll_number ?? "";
  const programme = academic?.programme ?? "MBA";
  const specialization = academic?.specialization ?? "";
  const semester = academic?.current_semester ?? "";

  const attendancePct = attendance?.attendance_percentage ?? 0;
  let statusColor = "from-emerald-400 to-emerald-500";
  let statusBg = "bg-emerald-50 border-emerald-200";
  let statusText = "text-emerald-700";
  let statusMessage = "You are safely above the minimum cutoff.";

  if (attendancePct < 75 && attendancePct >= 65) {
    statusColor = "from-amber-400 to-amber-500";
    statusBg = "bg-amber-50 border-amber-200";
    statusText = "text-amber-700";
    statusMessage = "Warning: You are at risk. Please ensure you attend upcoming sessions.";
  } else if (attendancePct < 65 && attendancePct > 0) {
    statusColor = "from-red-500 to-red-600";
    statusBg = "bg-red-50 border-red-200";
    statusText = "text-red-700";
    statusMessage = "Critical Shortage: You are currently ineligible for semester exams.";
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {loading ? "Loading profile…" : `Welcome back, ${studentName}`}
          </h1>
          <p className="text-sm text-slate-500">
            {programme} {specialization ? `in ${specialization}` : ""}
            {semester ? ` · Semester ${semester}` : ""}
            {rollNumber ? ` · Roll No. ${rollNumber}` : ""}
          </p>
        </div>
        <div className="flex gap-3">
          <StatChip icon={<LayoutDashboard className="h-4 w-4" />} label="CGPA" value={gpa} />
          <StatChip icon={<Calendar className="h-4 w-4" />} label="Term" value="Fall 2026" />
        </div>
      </section>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Marks & Timetable (Spans 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-indigo-600" />
                <h2 className="font-semibold">Academic Performance</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Code</th>
                    <th className="px-5 py-3 font-medium">Subject</th>
                    <th className="px-5 py-3 font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">Loading marks…</td></tr>
                  ) : marks.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No marks found.</td></tr>
                  ) : (
                    marks.map((row, index) => (
                      <tr key={row.id ?? index} className="hover:bg-slate-50/80">
                        <td className="px-5 py-3 font-mono text-xs text-slate-500">{row.subject_code}</td>
                        <td className="px-5 py-3 font-medium">{row.subject_name}</td>
                        <td className="px-5 py-3 font-semibold">{row.total_score}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${row.grade === 'O' || row.grade === 'A+' ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-sky-50 text-sky-700 ring-sky-100'}`}>
                            {row.grade}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* TIMETABLE VIEWER */}
          <Timetable specialization={specialization} semester={semester} />
        </div>

        {/* Right Column: Attendance & Course Materials */}
        <div className="space-y-6">
          <section className={`rounded-2xl border p-5 shadow-sm transition-colors ${statusBg}`}>
            <div className="mb-4 flex items-center gap-2">
              <Users className={`h-4 w-4 ${statusText}`} />
              <h2 className={`font-semibold ${statusText}`}>Attendance Status</h2>
            </div>
            <div className="mb-2 flex items-end justify-between">
              <p className={`text-3xl font-semibold tracking-tight ${statusText}`}>{attendancePct}%</p>
              <p className={`text-xs font-medium ${statusText}`}>Required: 75%</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/60">
              <div className={`h-full rounded-full bg-gradient-to-r ${statusColor} transition-all duration-1000 ease-out`} style={{ width: `${attendancePct}%` }} />
            </div>
            <p className={`mt-3 text-sm font-medium ${statusText}`}>{statusMessage}</p>
          </section>
          
          <CourseMaterials canUpload={false} subjectCode="MBA401"/>
        </div>
      </div>

      {/* NEW: Leave & Helpdesk Modules */}
      <div className="mt-6 space-y-6">
        <LeaveRequest rollNumber={rollNumber} />
        <Helpdesk rollNumber={rollNumber} />
      </div>
    </div>
  );
}

function StatChip({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}