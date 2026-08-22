"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { MessageSquareWarning, Send, Loader2, CheckCircle2, HelpCircle, AlertOctagon, Lightbulb } from "lucide-react";

export default function Helpdesk({ rollNumber }: { rollNumber: string }) {
  const [category, setCategory] = useState("Query");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    async function fetchTickets() {
      if (!rollNumber) return;
      const { data } = await supabase
        .from("helpdesk_tickets")
        .select("*")
        .eq("roll_number", rollNumber)
        .order("submitted_at", { ascending: false });
      
      if (data) setTickets(data);
    }
    fetchTickets();
  }, [rollNumber, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("helpdesk_tickets").insert([
      {
        roll_number: rollNumber,
        category: category,
        description: description,
        status: "Pending",
      },
    ]);

    setLoading(false);
    if (!error) {
      setSuccess(true);
      setDescription("");
      setTimeout(() => setSuccess(false), 3000);
    } else {
      console.error(error);
      alert("Failed to submit ticket.");
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Complaint": return <AlertOctagon className="h-4 w-4" />;
      case "Feedback": return <Lightbulb className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Ticket Submission Form */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <MessageSquareWarning className="h-5 w-5 text-indigo-600" />
            Campus Helpdesk
          </h2>
          <p className="mt-1 text-sm text-slate-500">Submit queries, complaints, or feedback to administration.</p>
        </div>

        {success ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-center text-emerald-700">
            <CheckCircle2 className="mb-2 h-8 w-8" />
            <p className="font-semibold">Ticket Raised Successfully!</p>
            <p className="text-sm">Admin will review this shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
              <div className="grid grid-cols-3 gap-3">
                {["Query", "Complaint", "Feedback"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCategory(type)}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                      category === type
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {getCategoryIcon(type)}
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain your issue or query in detail..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit Ticket
            </button>
          </form>
        )}
      </section>

      {/* Ticket History */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-lg font-semibold text-slate-900">Your Active Tickets</h2>
          <p className="mt-1 text-sm text-slate-500">Track the resolution status of your issues.</p>
        </div>
        
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No active tickets.</p>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="flex items-start justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">{ticket.category}</span>
                    <span className="text-xs text-slate-400">• {new Date(ticket.submitted_at).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 line-clamp-2">{ticket.description}</p>
                </div>
                <div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                    ticket.status === 'In Review' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {ticket.status}
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