"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, FileText, Send, Clock, Briefcase, FileUp, Loader2, CheckCircle2 } from "lucide-react";

export default function LeaveRequest({ rollNumber }: { rollNumber: string }) {
  const [requestType, setRequestType] = useState("Leave");
  const [targetDate, setTargetDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Fetch student's previous requests
  useEffect(() => {
    async function fetchHistory() {
      if (!rollNumber) return;
      const { data } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("roll_number", rollNumber)
        .order("submitted_at", { ascending: false });
      
      if (data) setHistory(data);
    }
    fetchHistory();
  }, [rollNumber, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Note: Document upload to Supabase Storage will be wired here next
    const { error } = await supabase.from("leave_requests").insert([
      {
        roll_number: rollNumber,
        request_type: requestType,
        target_date: targetDate,
        reason: reason,
        status: "Pending",
      },
    ]);

    setLoading(false);
    if (!error) {
      setSuccess(true);
      setReason("");
      setTargetDate("");
      setTimeout(() => setSuccess(false), 3000);
    } else {
      console.error(error);
      alert("Failed to submit request.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Application Form */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Calendar className="h-5 w-5 text-indigo-600" />
            New Leave / OD Request
          </h2>
          <p className="mt-1 text-sm text-slate-500">Apply for permissions or out-of-station duty.</p>
        </div>

        {success ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-center text-emerald-700">
            <CheckCircle2 className="mb-2 h-8 w-8" />
            <p className="font-semibold">Request Submitted!</p>
            <p className="text-sm">Sent to Admin for approval.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {["Leave", "Late", "On Duty (OD)"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRequestType(type)}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                    requestType === type
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {type === "Late" ? <Clock className="h-4 w-4" /> : type === "On Duty (OD)" ? <Briefcase className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  {type}
                </button>
              ))}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Date of Absence</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Reason / Description</label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide details..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white p-2 shadow-sm">
                  <FileUp className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Attach Proof</p>
                  <p className="text-xs text-slate-500">PDF, JPG, PNG (Max 5MB)</p>
                </div>
              </div>
              <input type="file" className="w-[90px] text-xs text-slate-500 file:hidden" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit Request
            </button>
          </form>
        )}
      </section>

      {/* History Tracking */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-lg font-semibold text-slate-900">Your Request History</h2>
          <p className="mt-1 text-sm text-slate-500">Track approval status for recent requests.</p>
        </div>
        
        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No requests found.</p>
          ) : (
            history.map((req) => (
              <div key={req.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">{req.request_type}</span>
                    <span className="text-xs text-slate-500">• {new Date(req.target_date).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-600">{req.reason}</p>
                </div>
                <div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                    req.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {req.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}