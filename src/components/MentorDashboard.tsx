"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, AlertCircle, CheckCircle2, MessageCircle, Loader2, Search, X, Mail, BookOpen, CalendarDays, ChevronLeft, ChevronRight, Info } from "lucide-react";

export default function MentorDashboard({ mentorEmail }: { mentorEmail: string }) {
  const [mentees, setMentees] = useState<any[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedMentee, setSelectedMentee] = useState<any | null>(null);
  
  // 🚀 REAL-TIME CALENDAR STATE
  const [dailyAttendance, setDailyAttendance] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Automatically detects today's month/year
  const [selectedDayRecord, setSelectedDayRecord] = useState<any | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    async function fetchMentorData() {
      setLoading(true);
      const { data: students } = await supabase.from("personal_data").select("*").eq("mentor_email", mentorEmail);

      if (students && students.length > 0) {
        const rollNumbers = students.map((s: any) => s.roll_number);
        const [academicRes, attendanceRes, queryRes] = await Promise.all([
          supabase.from("academic_data").select("*").in("roll_number", rollNumbers),
          supabase.from("attendance_data").select("*").in("roll_number", rollNumbers),
          supabase.from("student_queries").select("*").in("student_roll_number", rollNumbers).order("created_at", { ascending: false })
        ]);

        const combinedMentees = students.map(student => ({
          ...student,
          academic_data: academicRes.data?.filter(a => a.roll_number === student.roll_number) || [],
          attendance_data: attendanceRes.data?.filter(a => a.roll_number === student.roll_number) || [],
        }));

        setMentees(combinedMentees);
        if (queryRes.data) setQueries(queryRes.data);
      }
      setLoading(false);
    }
    if (mentorEmail) fetchMentorData();
  }, [mentorEmail]);

  // Fetch daily attendance when opening the modal
  const handleViewProfile = async (student: any) => {
    setSelectedMentee(student);
    setCalendarLoading(true);
    setCurrentMonth(new Date()); // Reset to the actual current real-time month
    setSelectedDayRecord(null);

    const { data } = await supabase
      .from("daily_attendance")
      .select("*")
      .eq("roll_number", student.roll_number);
    
    if (data) setDailyAttendance(data);
    setCalendarLoading(false);
  };

  const handleReply = async (queryId: string) => {
    if (!replyText.trim()) return;
    const { error } = await supabase.from("student_queries").update({ mentor_reply: replyText, status: "Resolved" }).eq("id", queryId);
    if (!error) {
      setQueries(queries.map(q => q.id === queryId ? { ...q, mentor_reply: replyText, status: "Resolved" } : q));
      setReplyText("");
      setActiveQueryId(null);
    }
  };

  const filteredMentees = mentees.filter(m => 
    m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || m.roll_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 🚀 CALENDAR ENGINE
  const today = new Date();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Users className="h-6 w-6"/></div><div><p className="text-sm font-medium text-slate-500">Total Mentees</p><p className="text-2xl font-bold text-slate-900">{mentees.length}</p></div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><AlertCircle className="h-6 w-6"/></div><div><p className="text-sm font-medium text-slate-500">Pending Queries</p><p className="text-2xl font-bold text-slate-900">{queries.filter(q => q.status === 'Pending').length}</p></div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-6 w-6"/></div><div><p className="text-sm font-medium text-slate-500">Resolved Queries</p><p className="text-2xl font-bold text-slate-900">{queries.filter(q => q.status === 'Resolved').length}</p></div></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Mentee List */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="border-b border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">Mentee Roster</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Search students..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-indigo-600"/>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-white text-xs uppercase text-slate-500 shadow-sm z-10">
                <tr><th className="px-4 py-3 font-medium">Student</th><th className="px-4 py-3 font-medium">Roll No</th><th className="px-4 py-3 font-medium">Attendance</th><th className="px-4 py-3 font-medium text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMentees.map((student: any) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{student.full_name}</td>
                    <td className="px-4 py-3 text-slate-500">{student.roll_number}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${(student.attendance_data?.[0]?.attendance_percentage || 0) < 75 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{student.attendance_data?.[0]?.attendance_percentage || 0}%</span></td>
                    <td className="px-4 py-3 text-right"><button onClick={() => handleViewProfile(student)} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100">View Profile</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Query Resolution Center */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-slate-900 text-white shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="border-b border-slate-700 p-6"><h2 className="text-lg font-bold flex items-center gap-2"><MessageCircle className="h-5 w-5 text-indigo-400"/> Mentee Queries</h2><p className="text-xs text-slate-400 mt-1">Respond directly to your students</p></div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {queries.map((q) => (
              <div key={q.id} className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                <div className="flex justify-between items-start mb-2"><span className="text-xs font-bold text-indigo-300">{q.student_name}</span><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${q.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{q.status}</span></div>
                <p className="text-sm text-slate-200 mb-3">{q.query_text}</p>
                {q.status === 'Resolved' ? (
                  <div className="mt-3 rounded-lg bg-slate-900 p-3 border border-slate-700"><p className="text-xs font-semibold text-slate-400 mb-1">Your Reply:</p><p className="text-sm text-slate-300">{q.mentor_reply}</p></div>
                ) : activeQueryId === q.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your response..." className="w-full rounded-lg bg-slate-900 border border-slate-600 p-2 text-sm text-white outline-none focus:border-indigo-500 resize-none h-20"/>
                    <div className="flex gap-2"><button onClick={() => handleReply(q.id)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg transition-colors">Submit</button><button onClick={() => {setActiveQueryId(null); setReplyText("");}} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 rounded-lg transition-colors">Cancel</button></div>
                  </div>
                ) : <button onClick={() => setActiveQueryId(q.id)} className="w-full mt-2 border border-slate-600 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2 rounded-lg transition-colors">Reply to Student</button>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🚀 REAL-TIME CALENDAR MODAL */}
      {selectedMentee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setSelectedMentee(null)}>
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
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

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-sm"><p className="text-xs text-slate-500 mb-1">Programme</p><p className="text-sm font-semibold text-slate-800">{selectedMentee.academic_data?.[0]?.programme || "MBA"}</p></div>
                <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-sm"><p className="text-xs text-slate-500 mb-1">Specialization</p><p className="text-sm font-semibold text-slate-800">{selectedMentee.academic_data?.[0]?.specialization || "N/A"}</p></div>
                <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-sm"><p className="text-xs text-slate-500 mb-1">Semester</p><p className="text-sm font-semibold text-slate-800">Sem {selectedMentee.academic_data?.[0]?.current_semester || "1"}</p></div>
                <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-sm"><p className="text-xs text-slate-500 mb-1">Total Attendance</p><p className={`text-sm font-bold ${(selectedMentee.attendance_data?.[0]?.attendance_percentage || 0) < 75 ? 'text-red-600' : 'text-emerald-600'}`}>{selectedMentee.attendance_data?.[0]?.attendance_percentage || 0}%</p></div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-indigo-600"/> Daily Attendance Tracker</h3>
                  <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-white hover:shadow-sm text-slate-600 transition-all"><ChevronLeft className="h-5 w-5"/></button>
                    <span className="font-bold w-32 text-center text-slate-800 text-sm tracking-wide">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                    <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-white hover:shadow-sm text-slate-600 transition-all"><ChevronRight className="h-5 w-5"/></button>
                  </div>
                </div>

                {calendarLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
                ) : (
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* The Calendar Grid */}
                    <div className="flex-1">
                      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-bold text-slate-400">
                        <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
                        
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const dateString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const record = dailyAttendance.find(r => r.date === dateString);
                          
                          // Auto-detect Today's date
                          const isToday = today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();
                          
                          let bgClass = "bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600";
                          if (record) {
                            if (record.status.toLowerCase() === 'present') bgClass = "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100";
                            else if (record.status.toLowerCase() === 'absent') bgClass = "bg-red-50 border-red-200 text-red-700 hover:bg-red-100";
                            else if (record.status.toLowerCase() === 'od' || record.status.toLowerCase() === 'leave') bgClass = "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100";
                          }

                          return (
                            <button 
                              key={day}
                              onClick={() => setSelectedDayRecord({ day, dateString, record })}
                              className={`aspect-square rounded-lg flex items-center justify-center text-sm font-semibold transition-all shadow-sm
                                ${bgClass} 
                                ${isToday ? 'ring-2 ring-indigo-600 ring-offset-2 font-extrabold shadow-md' : ''}
                                ${selectedDayRecord?.day === day ? 'ring-2 ring-slate-400 ring-offset-1' : ''}`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Day Details Sidebar */}
                    <div className="w-full md:w-72 rounded-xl bg-white border border-slate-200 p-5 flex flex-col shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Session Details</h4>
                      
                      {selectedDayRecord ? (
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Selected Date</p>
                            <p className="text-sm font-bold text-slate-900">{new Date(selectedDayRecord.dateString).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                          </div>
                          
                          {selectedDayRecord.record ? (
                            <>
                              <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                                <span className={`inline-block rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wide border ${
                                  selectedDayRecord.record.status.toLowerCase() === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  selectedDayRecord.record.status.toLowerCase() === 'absent' ? 'bg-red-50 text-red-700 border-red-200' :
                                  'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {selectedDayRecord.record.status}
                                </span>
                              </div>
                              {selectedDayRecord.record.reason && (
                                <div>
                                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Reason / Remarks</p>
                                  <p className="text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">{selectedDayRecord.record.reason}</p>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex items-start gap-3 text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-100">
                              <Info className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                              <p className="text-sm font-medium leading-relaxed">No specific attendance status recorded for this date.</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center px-4">
                          <CalendarDays className="h-10 w-10 mb-3 text-slate-200" />
                          <p className="text-sm font-medium text-slate-500">Click any date on the calendar to view OD reasons or absence remarks.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}