"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Shield,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import Chatbot from '@/components/Chatbot';
import CourseMaterials from "@/components/CourseMaterials";
import AdminDashboard from "@/components/AdminDashboard";

type Role = "Admin" | "Professor" | "Student";

const STUDENT_ID = "33333333-3333-3333-3333-333333333333";

type ProfileRow = {
  id?: string;
  name?: string;
  full_name?: string;
  display_name?: string;
  semester?: string | number;
  roll_number?: string;
  roll_no?: string;
  roll?: string;
  programme?: string;
  program?: string;
  course?: string;
  attendance?: number;
};

type MarkRow = {
  id?: number | string;
  student_id?: string;
  code?: string;
  course_code?: string;
  subject?: string;
  subject_name?: string;
  course?: string;
  internals?: number;
  internal?: number;
  midterm?: number;
  mid?: number;
  endterm?: number;
  end?: number;
  external?: number;
  total?: number;
  marks?: number;
  score?: number;
  grade?: string;
};

type AnnouncementRow = {
  id?: number | string;
  title?: string;
  body?: string;
  content?: string;
  message?: string;
  date?: string;
  created_at?: string;
  tag?: string;
  category?: string;
};

const ATTENDANCE = 86;

function firstValue<T>(...values: Array<T | null | undefined>): T | undefined {
  return values.find((value) => value !== null && value !== undefined);
}

function formatDate(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function gradeColor(grade: string) {
  if (grade.startsWith("A")) return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (grade.startsWith("B")) return "bg-sky-50 text-sky-700 ring-sky-100";
  return "bg-amber-50 text-amber-700 ring-amber-100";
}

function applyChange<T extends { id?: number | string }>(
  rows: T[],
  payload: RealtimePostgresChangesPayload<T>,
): T[] {
  if (payload.eventType === "INSERT") {
    const next = payload.new as T;
    if (next.id != null && rows.some((row) => row.id === next.id)) {
      return rows.map((row) => (row.id === next.id ? next : row));
    }
    return [...rows, next];
  }

  if (payload.eventType === "UPDATE") {
    const next = payload.new as T;
    if (next.id == null) return rows;
    if (rows.some((row) => row.id === next.id)) {
      return rows.map((row) => (row.id === next.id ? next : row));
    }
    return [...rows, next];
  }

  if (payload.eventType === "DELETE") {
    const previous = payload.old as T;
    return rows.filter((row) => row.id !== previous.id);
  }

  return rows;
}

function applyMarksChange(
  rows: MarkRow[],
  payload: RealtimePostgresChangesPayload<MarkRow>,
): MarkRow[] {
  const next = payload.new as MarkRow;
  const previous = payload.old as MarkRow;

  if (payload.eventType === "INSERT" && next.student_id !== STUDENT_ID) {
    return rows;
  }

  if (payload.eventType === "UPDATE" && next.student_id !== STUDENT_ID) {
    return rows.filter((row) => row.id !== (next.id ?? previous.id));
  }

  if (payload.eventType === "DELETE" && previous.student_id && previous.student_id !== STUDENT_ID) {
    return rows;
  }

  return applyChange(rows, payload);
}

export default function Home() {
  const [role, setRole] = useState<Role>("Student");
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [marks, setMarks] = useState<MarkRow[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      const [profileResult, marksResult, announcementsResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", STUDENT_ID).maybeSingle(),
        supabase.from("marks").select("*").eq("student_id", STUDENT_ID),
        supabase.from("announcements").select("*"),
      ]);

      if (cancelled) return;

      const firstError =
        profileResult.error?.message ??
        marksResult.error?.message ??
        announcementsResult.error?.message;

      if (firstError) {
        setError(firstError);
        setProfile(null);
        setMarks([]);
        setAnnouncements([]);
      } else {
        setProfile((profileResult.data as ProfileRow) ?? null);
        setMarks((marksResult.data as MarkRow[]) ?? []);
        setAnnouncements((announcementsResult.data as AnnouncementRow[]) ?? []);
      }

      setLoading(false);
    }

    void loadDashboard();

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "marks" },
        (payload: RealtimePostgresChangesPayload<MarkRow>) => {
          setMarks((current) => applyMarksChange(current, payload));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        (payload: RealtimePostgresChangesPayload<AnnouncementRow>) => {
          setAnnouncements((current) => applyChange(current, payload));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  const gpa = useMemo(() => {
    if (marks.length === 0) return "—";
    const points: Record<string, number> = { "A+": 10, A: 9, "B+": 8, B: 7 };
    const avg =
      marks.reduce((sum, row) => sum + (points[row.grade ?? ""] ?? 6), 0) / marks.length;
    return avg.toFixed(2);
  }, [marks]);

  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">College Portal</p>
              <p className="text-xs text-slate-500">MBA Academic Dashboard</p>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
              aria-haspopup="listbox"
              aria-expanded={open}
            >
              <RoleIcon role={role} />
              <span>Role Switcher</span>
              <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 sm:inline">
                {role}
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
            </button>

            {open ? (
              <ul
                className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                role="listbox"
              >
                {(["Admin", "Professor", "Student"] as Role[]).map((option) => (
                  <li key={option}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setRole(option);
                        setOpen(false);
                      }}
                    >
                      <span className="inline-flex items-center gap-2">
                        <RoleIcon role={option} />
                        {option}
                      </span>
                      {role === option ? <Check className="h-4 w-4 text-indigo-600" /> : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {role === "Student" ? (
          <StudentView
            profile={profile}
            gpa={gpa}
            marks={marks}
            announcements={announcements}
            loading={loading}
            error={error}
          />
        ) : null}
        {role === "Professor" ? <ProfessorView /> : null}
        {role === "Admin" ? <AdminDashboard /> : null}
      </main>
      <Chatbot />
    </div>
  );
}

function RoleIcon({ role }: { role: Role }) {
  if (role === "Admin") return <Shield className="h-4 w-4 text-indigo-600" />;
  if (role === "Professor") return <BookOpen className="h-4 w-4 text-indigo-600" />;
  return <GraduationCap className="h-4 w-4 text-indigo-600" />;
}

function StudentView({
  profile,
  gpa,
  marks,
  announcements,
  loading,
  error,
}: {
  profile: ProfileRow | null;
  gpa: string;
  marks: MarkRow[];
  announcements: AnnouncementRow[];
  loading: boolean;
  error: string | null;
}) {
  const studentName = firstValue(profile?.full_name, profile?.name, profile?.display_name);
  const semester = profile?.semester != null ? String(profile.semester) : null;
  const rollNumber = firstValue(profile?.roll_number, profile?.roll_no, profile?.roll);
  const programme = firstValue(profile?.programme, profile?.program, profile?.course) ?? "MBA";
// Determine attendance status and colors
const attendancePct = profile?.attendance ?? 0; // Pulls from DB, defaults to 0 if empty
  
let statusColor = "from-emerald-400 to-emerald-500"; // Safe (Green)
let statusBg = "bg-emerald-50 border-emerald-200";
let statusText = "text-emerald-700";
let statusMessage = "You are safely above the minimum cutoff.";

if (attendancePct < 75 && attendancePct >= 65) {
  statusColor = "from-amber-400 to-amber-500"; // Warning (Amber)
  statusBg = "bg-amber-50 border-amber-200";
  statusText = "text-amber-700";
  statusMessage = "Warning: You are at risk. Please ensure you attend upcoming sessions.";
} else if (attendancePct < 65 && attendancePct > 0) {
  statusColor = "from-red-500 to-red-600"; // Danger (Red)
  statusBg = "bg-red-50 border-red-200";
  statusText = "text-red-700";
  statusMessage = "Critical Shortage: You are currently ineligible for semester exams.";
}
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Student View</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {loading ? "Loading profile…" : `Welcome back, ${studentName ?? "student"}`}
          </h1>
          <p className="text-sm text-slate-500">
            {programme}
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
        <section className="lg:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-indigo-600" />
              <h2 className="font-semibold">MBA Marks</h2>
              <CourseMaterials canUpload={false} subjectCode="MBA-401"/>
            </div>
            <span className="text-xs text-slate-500">Internal · Mid · End · Total / 100</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Code</th>
                  <th className="px-5 py-3 font-medium">Subject</th>
                  <th className="px-5 py-3 font-medium">Int.</th>
                  <th className="px-5 py-3 font-medium">Mid</th>
                  <th className="px-5 py-3 font-medium">End</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      Loading marks…
                    </td>
                  </tr>
                ) : marks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      No marks found.
                    </td>
                  </tr>
                ) : (
                  marks.map((row, index) => {
                    const code = firstValue(row.code, row.course_code) ?? "—";
                    const subject =
                      firstValue(row.subject, row.subject_name, row.course) ?? "—";
                    const internals = firstValue(row.internals, row.internal) ?? "—";
                    const midterm = firstValue(row.midterm, row.mid) ?? "—";
                    const endterm = firstValue(row.endterm, row.end, row.external) ?? "—";
                    const total = firstValue(row.total, row.marks, row.score) ?? "—";
                    const grade = row.grade ?? "—";

                    return (
                      <tr key={row.id ?? `${code}-${index}`} className="hover:bg-slate-50/80">
                        <td className="px-5 py-3 font-mono text-xs text-slate-500">{code}</td>
                        <td className="px-5 py-3 font-medium">{subject}</td>
                        <td className="px-5 py-3 text-slate-600">{internals}</td>
                        <td className="px-5 py-3 text-slate-600">{midterm}</td>
                        <td className="px-5 py-3 text-slate-600">{endterm}</td>
                        <td className="px-5 py-3 font-semibold">{total}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${gradeColor(grade)}`}
                          >
                            {grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

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
              <div
                className={`h-full rounded-full bg-gradient-to-r ${statusColor} transition-all duration-1000 ease-out`}
                style={{ width: `${attendancePct}%` }}
              />
            </div>
            <p className={`mt-3 text-sm font-medium ${statusText}`}>
              {statusMessage}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-indigo-600" />
              <h2 className="font-semibold">Announcements</h2>
            </div>
            {loading ? (
              <p className="text-sm text-slate-500">Loading announcements…</p>
            ) : announcements.length === 0 ? (
              <p className="text-sm text-slate-500">No announcements yet.</p>
            ) : (
              <ul className="space-y-4">
                {announcements.map((item, index) => {
                  const title = item.title ?? "Announcement";
                  const body = firstValue(item.body, item.content, item.message) ?? "";
                  const tag = firstValue(item.tag, item.category) ?? "Notice";
                  const date = formatDate(firstValue(item.date, item.created_at));

                  return (
                    <li
                      key={item.id ?? `${title}-${index}`}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{title}</p>
                        <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-indigo-600 ring-1 ring-indigo-100">
                          {tag}
                        </span>
                      </div>
                      {body ? <p className="text-xs leading-5 text-slate-600">{body}</p> : null}
                      {date ? (
                        <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <Bell className="h-3 w-3" />
                          {date}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
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

function ProfessorView() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-medium text-indigo-600">Professor View</p>
      <h1 className="mt-1 text-2xl font-semibold">Course roster</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-500">
        Grade MBA sections, publish attendance, and post announcements from here. Switch back to
        Student to preview the learner dashboard.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {["MBA-401 ERP · 42 students", "MBA-402 Governance · 38 students", "MBA-403 GST · 40 students"].map(
          (item) => (
            <div key={item} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium">
              {item}
            </div>
          ),
        )}
        <CourseMaterials canUpload={true} subjectCode="MBA-401"/>
      </div>
    </section>
  );
}
