"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, FileText, Download, Search, X, Loader2, Database, CalendarCheck, UploadCloud, LayoutDashboard } from "lucide-react";

// Importing all your existing Admin components!
import AdminProjects from "@/components/AdminProjects";
import AdminLeaveQueue from "@/components/AdminLeaveQueue";
import BulkStudentUploader from "@/components/BulkStudentUploader";

export default function AdminDashboard() {
  // Sets default tab to your overview/directory
  const [activeTab, setActiveTab] = useState("Directory");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      const { data } = await supabase.from("personal_data").select("*, academic_data(programme, specialization)");
      if (data) setStudents(data);
      setLoading(false);
    }
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.roll_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 🚀 ALL ADMIN TABS RESTORED */}
      <div className="flex flex-wrap gap-4 border-b border-slate-200 pb-4">
        <button onClick={() => setActiveTab("Directory")} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${activeTab === "Directory" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}>
          <LayoutDashboard className="h-4 w-4"/> Dashboard & Directory
        </button>
        <button onClick={() => setActiveTab("LeaveQueue")} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${activeTab === "LeaveQueue" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}>
          <CalendarCheck className="h-4 w-4"/> Leave Approvals
        </button>
        <button onClick={() => setActiveTab("Projects")} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${activeTab === "Projects" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}>
          <Database className="h-4 w-4"/> Projects Hub
        </button>
        <button onClick={() => setActiveTab("BulkUpload")} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${activeTab === "BulkUpload" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}>
          <UploadCloud className="h-4 w-4"/> Bulk Data Upload
        </button>
      </div>

      {/* RENDER OLD COMPONENTS SAFELY */}
      {activeTab === "Projects" && <AdminProjects />}
      {activeTab === "LeaveQueue" && <AdminLeaveQueue />}
      {activeTab === "BulkUpload" && <BulkStudentUploader />}

      {/* MASTER DIRECTORY */}
      {activeTab === "Directory" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[700px]">
          <div className="border-b border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">Master Student Directory</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Search roll no or name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-indigo-600"/>
            </div>
          </div>
          
          {loading ? (
             <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
          ) : (
            <div className="flex-1 overflow-y-auto p-2">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-white text-xs uppercase text-slate-500 shadow-sm z-10">
                  <tr><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Roll No</th><th className="px-4 py-3 font-medium">Specialization</th><th className="px-4 py-3 font-medium text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student: any) => (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{student.full_name}</td>
                      <td className="px-4 py-3 text-slate-500">{student.roll_number}</td>
                      <td className="px-4 py-3 text-slate-600">{student.academic_data?.[0]?.specialization || "N/A"}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setSelectedStudent(student)} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">Full Profile</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Full Profile Modal for Admin */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setSelectedStudent(null)}>
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
          <div className="bg-gradient-to-r from-slate-900 to-indigo-900 p-6 text-white relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center">
                  {selectedStudent.profile_pic_url ? (
                    <img src={selectedStudent.profile_pic_url} className="h-full w-full object-cover" />
                  ) : (
                    <Users className="h-8 w-8 text-white/50"/>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedStudent.full_name}</h2>
                  <p className="text-indigo-200 text-sm mt-1">{selectedStudent.roll_number} | {selectedStudent.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-white/70 hover:text-white"><X className="h-6 w-6"/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white p-4 border border-slate-200"><p className="text-xs text-slate-500">Phone</p><p className="font-semibold text-slate-800">{selectedStudent.phone || "N/A"}</p></div>
                <div className="rounded-xl bg-white p-4 border border-slate-200"><p className="text-xs text-slate-500">City</p><p className="font-semibold text-slate-800">{selectedStudent.city || "N/A"}</p></div>
                <div className="rounded-xl bg-white p-4 border border-slate-200"><p className="text-xs text-slate-500">Programme</p><p className="font-semibold text-slate-800">{selectedStudent.academic_data?.[0]?.programme || "N/A"}</p></div>
                <div className="rounded-xl bg-white p-4 border border-slate-200"><p className="text-xs text-slate-500">Mentor Email</p><p className="font-semibold text-slate-800">{selectedStudent.mentor_email || "Not Assigned"}</p></div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4 border-b pb-2">Uploaded Resumes</h3>
                <div className="flex gap-4">
                   {selectedStudent.spec_resume_url ? (
                     <a href={selectedStudent.spec_resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 border border-indigo-200"><Download className="h-4 w-4"/> Spec Resume</a>
                   ) : <span className="text-sm text-slate-400">No Spec Resume</span>}
                   
                   {selectedStudent.mgmt_resume_url ? (
                     <a href={selectedStudent.mgmt_resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 border border-indigo-200"><Download className="h-4 w-4"/> Mgmt Resume</a>
                   ) : <span className="text-sm text-slate-400">No Mgmt Resume</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}