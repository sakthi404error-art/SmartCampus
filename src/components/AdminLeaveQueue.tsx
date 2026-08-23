"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function AdminLeaveQueue() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    // Fetch requests and join with personal_data to get student names
    const { data } = await supabase.from("leave_requests").select("*, personal_data(full_name)").order("created_at", { ascending: false });
    if (data) setRequests(data);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleUpdate = async (id: string, status: string) => {
    await supabase.from("leave_requests").update({ status }).eq("id", id);
    fetchRequests();
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[700px]">
      <div className="border-b border-slate-100 p-6"><h2 className="text-lg font-bold text-slate-900">Leave Approvals Queue</h2></div>
      <div className="flex-1 overflow-y-auto p-2">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-white text-xs uppercase text-slate-500 shadow-sm z-10">
            <tr><th className="px-4 py-3 font-medium">Student</th><th className="px-4 py-3 font-medium">Dates</th><th className="px-4 py-3 font-medium">Reason</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50">
                <td className="px-4 py-3"><p className="font-bold text-slate-900">{req.personal_data?.full_name}</p><p className="text-xs text-slate-500">{req.roll_number}</p></td>
                <td className="px-4 py-3 text-slate-600 text-xs">{req.start_date} <br/>to {req.end_date}</td>
                <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{req.reason}</td>
                <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-md ${req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : req.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{req.status}</span></td>
                <td className="px-4 py-3 text-right">
                  {req.status === 'Pending' && (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleUpdate(req.id, 'Approved')} className="p-1.5 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"><CheckCircle2 className="h-5 w-5"/></button>
                      <button onClick={() => handleUpdate(req.id, 'Rejected')} className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100"><XCircle className="h-5 w-5"/></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-500">No leave requests pending.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}