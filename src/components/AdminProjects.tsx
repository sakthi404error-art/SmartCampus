"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FolderUp, Loader2, Download, Users, CheckCircle2, Clock } from "lucide-react";

export default function AdminProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [projRes, subRes, stuRes] = await Promise.all([
        supabase.from("projects").select("*").order("deadline", { ascending: true }),
        supabase.from("project_submissions").select("*"),
        supabase.from("personal_data").select("roll_number, full_name")
      ]);

      if (projRes.data) setProjects(projRes.data);
      if (subRes.data) setSubmissions(subRes.data);
      if (stuRes.data) setStudents(stuRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const totalStudents = students.length;

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><FolderUp className="h-6 w-6 text-indigo-600"/> Master Project Submissions</h2>
      </div>

      <div className="grid gap-6">
        {projects.map((project) => {
          const projectSubs = submissions.filter(s => s.project_id === project.id);
          const submittedCount = projectSubs.length;
          const completionRate = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

          return (
            <div key={project.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{project.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">Deadline: {new Date(project.deadline).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completion</p>
                    <p className="text-xl font-extrabold text-indigo-600">{completionRate}%</p>
                  </div>
                  <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600"><CheckCircle2 className="h-4 w-4"/> {submittedCount} In</div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-500"><Clock className="h-4 w-4"/> {totalStudents - submittedCount} Pending</div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase text-slate-500 mb-2 border-b border-slate-200">
                      <tr>
                        <th className="pb-3 font-medium">Student Name</th>
                        <th className="pb-3 font-medium">Roll Number</th>
                        <th className="pb-3 font-medium">File Name</th>
                        <th className="pb-3 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projectSubs.map(sub => {
                        const student = students.find(s => s.roll_number === sub.student_roll_number);
                        return (
                          <tr key={sub.id}>
                            <td className="py-3 font-medium text-slate-900">{student?.full_name || "Unknown"}</td>
                            <td className="py-3 text-slate-500">{sub.student_roll_number}</td>
                            <td className="py-3 text-slate-600">{sub.file_name}</td>
                            <td className="py-3 text-right">
                              <a 
                                href={sub.file_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                              >
                                <Download className="h-3 w-3"/> Download
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                      {projectSubs.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-slate-400">No submissions yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}