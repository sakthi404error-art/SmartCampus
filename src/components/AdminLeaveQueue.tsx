"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, XCircle, Clock, FileText, User } from "lucide-react";

export default function AdminLeaveQueue() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("status", "Pending")
      .order("created_at", { ascending: true });
    
    if (data) setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("leave_requests")
        .update({ status: newStatus })
        .eq("id", id);
      
      if (error) throw error;
      
      // Remove the processed request from the UI immediately for a snappy feel
      setRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Check console.");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm col-span-full">
      <h3 className="mb-6 text-lg font-bold text-slate-800 flex items-center gap-2">
        <Clock className="h-5 w-5 text-indigo-600" />
        Pending OD Requests
      </h3>

      {loading ? (
        <p className="text-sm text-slate-500 text-center py-4">Loading queue...</p>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <CheckCircle2 className="h-12 w-12 mb-3 text-emerald-400 opacity-50" />
          <p className="text-sm font-medium">All caught up! No pending requests.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => (
                <tr key={req.id} className="transition-all hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-700">{req.student_name}</p>
                    <p className="text-xs text-slate-500">{req.roll_number}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-600">{req.leave_date}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={req.reason}>
                    {req.reason}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleUpdateStatus(req.id, 'Approved')}
                        className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-100"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(req.id, 'Rejected')}
                        className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition-all hover:bg-red-100"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}