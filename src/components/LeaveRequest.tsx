"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CalendarClock, Send, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function LeaveRequest({ rollNumber }: { rollNumber: string }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, [rollNumber]);

  const fetchHistory = async () => {
    // 🚀 FIX: Removed the .order() command so it stops looking for created_at
    const { data, error } = await supabase.from("leave_requests").select("*").eq("roll_number", rollNumber);
    
    if (error) alert("History Fetch Error: " + error.message);
    if (data) setHistory(data.reverse()); // Manually reverse it in the browser instead of the database
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return alert("Fill all fields");
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("leave_requests").insert([{
        roll_number: rollNumber,
        start_date: startDate,
        end_date: endDate,
        reason,
        status: "Pending"
      }]);
      
      if (error) throw error;
      alert("✅ Leave request submitted to Admin successfully.");
      setStartDate(""); setEndDate(""); setReason("");
      fetchHistory();
    } catch (err: any) {
      alert("Error submitting request: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><CalendarClock className="h-5 w-5 text-indigo-600"/> Request Leave</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-slate-700">Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-indigo-600" required/></div>
            <div><label className="text-xs font-bold text-slate-700">End Date</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-indigo-600" required/></div>
          </div>
          <div><label className="text-xs font-bold text-slate-700">Reason for Leave</label><textarea value={reason} onChange={e => setReason(e.target.value)} className="w-full mt-1 rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-indigo-600 h-24 resize-none" required placeholder="Provide a valid reason..."/></div>
          <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-50">
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin"/> : <><Send className="h-4 w-4"/> Submit Request</>}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Leave History</h2>
        <div className="space-y-3 overflow-y-auto max-h-[300px]">
          {history.length === 0 ? <p className="text-sm text-slate-500">No previous leave requests.</p> : history.map((req) => (
            <div key={req.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-700">{req.start_date} to {req.end_date}</p>
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : req.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {req.status === 'Pending' && <Clock className="h-3 w-3"/>}
                  {req.status === 'Approved' && <CheckCircle2 className="h-3 w-3"/>}
                  {req.status === 'Rejected' && <XCircle className="h-3 w-3"/>}
                  {req.status}
                </span>
              </div>
              <p className="text-sm text-slate-600">{req.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}