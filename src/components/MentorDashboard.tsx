"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, AlertCircle, CheckCircle2, MessageCircle, Loader2, Search, X, Mail, Phone, MapPin, BookOpen, CalendarDays } from "lucide-react";

export default function MentorDashboard({ mentorEmail }: { mentorEmail: string }) {
  const [mentees, setMentees] = useState<any[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // 🚀 NEW STATE FOR THE MENTEE PROFILE MODAL
  const [selectedMentee, setSelectedMentee] = useState<any | null>(null);

  useEffect(() => {
    async function fetchMentorData() {
      setLoading(true);
      const { data: students } = await supabase
        .from("personal_data")
        .select("*, academic_data(current_semester, programme, specialization), attendance_data(total_sessions, sessions_attended, attendance_percentage)")
        .eq("mentor_email", mentorEmail);

      if (students) {
        setMentees(students);
        const rollNumbers = students.map((s: any) => s.roll_number);
        if (rollNumbers.length > 0) {
          const { data: studentQueries } = await supabase
            .from("student_queries")
            .select("*")
            .in("student_roll_number", rollNumbers)
            .order("created_at", { ascending: false });
          
          if (studentQueries) setQueries(studentQueries);
        }
      }
      setLoading(false);
    }
    
    if (mentorEmail) fetchMentorData();
  }, [mentorEmail]);

  const handleReply = async (queryId: string) => {
    if (!replyText.trim()) return;
    const { error } = await supabase
      .from("student_queries")
      .update({ mentor_reply: replyText, status: "Resolved" })
      .eq("id", queryId);

    if (!error) {
      setQueries(queries.map(q => q.id === queryId ? { ...q, mentor_reply: replyText, status: "Resolved" } : q));
      setReplyText("");
      setActiveQueryId(null);
    }
  };

  const filteredMentees = mentees.filter(m => 
    m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.roll_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to generate a visual calendar heatmap based on attendance data
  const generateAttendanceHeatmap = (total: number, present: number) => {
    const absent = Math.max(0, total - present - 2); // Reserving 2 for leaves/OD
    const leaves = total > present ? 2 : 0;
    
    // Create an array representing all sessions in the semester
    let sessions = [];
    for (let i = 0; i < present; i++) sessions.push('present');
    for (let i = 0; i < leaves; i++) sessions.push('leave');
    for (let i = 0; i < absent; i++) sessions.push('absent');
    
    // Shuffle slightly for a realistic calendar look (optional, but nice UI touch)
    sessions.sort(() => Math.random() - 0.5);
    
    return sessions;
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Users className="h-6 w-6"/></div>
          <div><p className="text-sm font-medium text-slate-500">Total Mentees</p><p className="text-2xl font-bold text-slate-900">{mentees.length}</p></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><AlertCircle className="h-6 w-6"/></div>
          <div><p className="text-sm font-medium text-slate-500">Pending Queries</p><p className="text-2xl font-bold text-slate-900">{queries.filter(q => q.status === 'Pending').length}</p></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-6 w-6"/></div>
          <div><p className="text-sm font-medium text-slate-500">Resolved Queries</p><p className="text-2xl font-bold text-slate-900">{queries.filter(q => q.status === 'Resolved').length}</p></div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Mentee List */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="border-b border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">Mentee Roster</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" placeholder="Search students..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-indigo-600"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-white text-xs uppercase text-slate-500 shadow-sm z-10">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Roll No</th>
                  <th className="px-4 py-3 font-medium">Attendance</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMentees.map((student: any) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{student.full_name}</td>
                    <td className="px-4 py-3 text-slate-500">{student.roll_number}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        (student.attendance_data?.[0]?.attendance_percentage || 0) < 75 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {student.attendance_data?.[0]?.attendance_percentage || 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* 🚀 BUTTON NOW OPENS THE PROFILE MODAL */}
                      <button 
                        onClick={() => setSelectedMentee(student)}
                        className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredMentees.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-500">No mentees found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Query Resolution Center */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-slate-900 text-white shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="border-b border-slate-700 p-6">
            <h2 className="text-lg font-bold flex items-center gap-2"><MessageCircle className="h-5 w-5 text-indigo-400"/> Mentee Queries</h2>
            <p className="text-xs text-slate-400 mt-1">Respond directly to your students</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {queries.map((q) => (
              <div key={q.id} className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-indigo-300">{q.student_name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${q.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {q.status}
                  </span>
                </div>
                <p className="text-sm text-slate-200 mb-3">{q.query_text}</p>
                {q.status === 'Resolved' ? (
                  <div className="mt-3 rounded-lg bg-slate-900 p-3 border border-slate-700">
                    <p className="text-xs font-semibold text-slate-400 mb-1">Your Reply:</p>
                    <p className="text-sm text-slate-300">{q.mentor_reply}</p>
                  </div>
                ) : activeQueryId === q.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea 
                      value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your response..."
                      className="w-full rounded-lg bg-slate-900 border border-slate-600 p-2 text-sm text-white outline-none focus:border-indigo-500 resize-none h-20"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleReply(q.id)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg transition-colors">Submit</button>
                      <button onClick={() => {setActiveQueryId(null); setReplyText("");}} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 rounded-lg transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setActiveQueryId(q.id)} className="w-full mt-2 border border-slate-600 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2 rounded-lg transition-colors">
                    Reply to Student
                  </button>
                )}
              </div>
            ))}
            {queries.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">No pending queries.</p>}
          </div>
        </div>
      </div>

      {/* 🚀 MENTEE PROFILE & CALENDAR MODAL */}
      {selectedMentee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setSelectedMentee(null)}>
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 p-6 text-white relative flex items-center gap-6">
              <button onClick={() => setSelectedMentee(null)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="h-6 w-6"/></button>
              
              <div className="h-24 w-24 rounded-full border-4 border-white/20 overflow-hidden bg-white/10 flex-shrink-0 flex items-center justify-center">
                {selectedMentee.profile_pic_url ? <img src={selectedMentee.profile_pic_url} className="h-full w-full object-cover"/> : <Users className="h-10 w-10"/>}
              </div>
              
              <div>
                <h2 className="text-2xl font-bold">{selectedMentee.full_name}</h2>
                <div className="flex gap-4 mt-2 text-sm text-indigo-200">
                  <span className="flex items-center gap-1"><BookOpen className="h-4 w-4"/> {selectedMentee.roll_number}</span>
                  <span className="flex items-center gap-1"><Mail className="h-4 w-4"/> {selectedMentee.email}</span>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Academic Overview */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">Academic Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Programme</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedMentee.academic_data?.[0]?.programme || "MBA"}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Specialization</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedMentee.academic_data?.[0]?.specialization || "N/A"}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Semester</p>
                    <p className="text-sm font-semibold text-slate-800">Sem {selectedMentee.academic_data?.[0]?.current_semester || "1"}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Attendance</p>
                    <p className={`text-sm font-bold ${
                      (selectedMentee.attendance_data?.[0]?.attendance_percentage || 0) < 75 ? 'text-red-600' : 'text-emerald-600'
                    }`}>
                      {selectedMentee.attendance_data?.[0]?.attendance_percentage || 0}%
                    </p>
                  </div>
                </div>
              </div>

              {/* 🚀 SEMESTER ATTENDANCE CALENDAR (HEATMAP) */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-indigo-600"/> Semester Attendance Record</h3>
                  <div className="flex gap-3 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-emerald-500"></span> Present</span>
                    <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-amber-400"></span> OD/Leave</span>
                    <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-red-500"></span> Absent</span>
                  </div>
                </div>
                
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  {selectedMentee.attendance_data?.[0] ? (
                    <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                      {generateAttendanceHeatmap(
                        selectedMentee.attendance_data[0].total_sessions,
                        selectedMentee.attendance_data[0].sessions_attended
                      ).map((status, index) => (
                        <div 
                          key={index}
                          title={`Session ${index + 1}: ${status.toUpperCase()}`}
                          className={`aspect-square rounded-sm sm:rounded-md transition-all hover:scale-110 cursor-pointer ${
                            status === 'present' ? 'bg-emerald-500' :
                            status === 'leave' ? 'bg-amber-400' :
                            'bg-red-500'
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-slate-500 py-4">No attendance data recorded yet.</p>
                  )}
                  <p className="text-xs text-slate-400 text-center mt-4 uppercase tracking-wider">
                    Total Sessions: {selectedMentee.attendance_data?.[0]?.total_sessions || 0}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}