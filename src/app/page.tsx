"use client";

import { useMemo, useState, type ReactNode } from "react";
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

type Role = "Admin" | "Professor" | "Student";

const MBA_MARKS = [
  {
    code: "MBA-401",
    subject: "Enterprise Resource Planning",
    internals: 18,
    midterm: 22,
    endterm: 48,
    total: 88,
    grade: "A",
  },
  {
    code: "MBA-402",
    subject: "Corporate Governance",
    internals: 16,
    midterm: 20,
    endterm: 45,
    total: 81,
    grade: "A",
  },
  {
    code: "MBA-403",
    subject: "Goods and Services Tax (GST)",
    internals: 17,
    midterm: 19,
    endterm: 42,
    total: 78,
    grade: "B+",
  },
  {
    code: "MBA-404",
    subject: "Strategic Management",
    internals: 19,
    midterm: 23,
    endterm: 50,
    total: 92,
    grade: "A+",
  },
  {
    code: "MBA-405",
    subject: "Business Analytics",
    internals: 15,
    midterm: 18,
    endterm: 40,
    total: 73,
    grade: "B",
  },
];

const ANNOUNCEMENTS = [
  {
    id: 1,
    title: "GST workshop this Friday",
    body: "Department of Commerce is hosting a GST filing workshop in Seminar Hall B at 2:00 PM.",
    date: "22 Aug 2026",
    tag: "Academic",
  },
  {
    id: 2,
    title: "ERP lab submissions due",
    body: "Upload your SAP case study to the portal before Monday 11:59 PM. Late work will not be graded.",
    date: "21 Aug 2026",
    tag: "Deadline",
  },
  {
    id: 3,
    title: "Corporate Governance guest lecture",
    body: "Industry expert session on board ethics and SEBI regulations. Attendance is compulsory for MBA II.",
    date: "19 Aug 2026",
    tag: "Event",
  },
];

const ATTENDANCE = 86;

function gradeColor(grade: string) {
  if (grade.startsWith("A")) return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (grade.startsWith("B")) return "bg-sky-50 text-sky-700 ring-sky-100";
  return "bg-amber-50 text-amber-700 ring-amber-100";
}

export default function Home() {
  const [role, setRole] = useState<Role>("Student");
  const [open, setOpen] = useState(false);

  const gpa = useMemo(() => {
    const points: Record<string, number> = { "A+": 10, A: 9, "B+": 8, B: 7 };
    const avg =
      MBA_MARKS.reduce((sum, row) => sum + (points[row.grade] ?? 6), 0) /
      MBA_MARKS.length;
    return avg.toFixed(2);
  }, []);

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
        {role === "Student" ? <StudentView gpa={gpa} /> : null}
        {role === "Professor" ? <ProfessorView /> : null}
        {role === "Admin" ? <AdminView /> : null}
      </main>
    </div>
  );
}

function RoleIcon({ role }: { role: Role }) {
  if (role === "Admin") return <Shield className="h-4 w-4 text-indigo-600" />;
  if (role === "Professor") return <BookOpen className="h-4 w-4 text-indigo-600" />;
  return <GraduationCap className="h-4 w-4 text-indigo-600" />;
}

function StudentView({ gpa }: { gpa: string }) {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Student View</p>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, Aisha</h1>
          <p className="text-sm text-slate-500">MBA · Semester IV · Roll No. MBA24-118</p>
        </div>
        <div className="flex gap-3">
          <StatChip icon={<LayoutDashboard className="h-4 w-4" />} label="CGPA" value={gpa} />
          <StatChip icon={<Calendar className="h-4 w-4" />} label="Term" value="Fall 2026" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-indigo-600" />
              <h2 className="font-semibold">MBA Marks</h2>
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
                {MBA_MARKS.map((row) => (
                  <tr key={row.code} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{row.code}</td>
                    <td className="px-5 py-3 font-medium">{row.subject}</td>
                    <td className="px-5 py-3 text-slate-600">{row.internals}</td>
                    <td className="px-5 py-3 text-slate-600">{row.midterm}</td>
                    <td className="px-5 py-3 text-slate-600">{row.endterm}</td>
                    <td className="px-5 py-3 font-semibold">{row.total}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${gradeColor(row.grade)}`}
                      >
                        {row.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              <h2 className="font-semibold">Attendance</h2>
            </div>
            <div className="mb-2 flex items-end justify-between">
              <p className="text-3xl font-semibold tracking-tight">{ATTENDANCE}%</p>
              <p className="text-xs text-slate-500">Minimum required: 75%</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                style={{ width: `${ATTENDANCE}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              43 of 50 sessions attended. You are safely above the cutoff.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-indigo-600" />
              <h2 className="font-semibold">Announcements</h2>
            </div>
            <ul className="space-y-4">
              {ANNOUNCEMENTS.map((item) => (
                <li key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-indigo-600 ring-1 ring-indigo-100">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-xs leading-5 text-slate-600">{item.body}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <Bell className="h-3 w-3" />
                    {item.date}
                  </p>
                </li>
              ))}
            </ul>
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
      </div>
    </section>
  );
}

function AdminView() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-medium text-indigo-600">Admin View</p>
      <h1 className="mt-1 text-2xl font-semibold">Campus overview</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-500">
        Manage users, roles, and academic calendars. This is a preview panel for the role switcher.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Active students", value: "1,284" },
          { label: "Faculty", value: "96" },
          { label: "Open tickets", value: "12" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
