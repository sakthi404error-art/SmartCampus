"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Search, User, FileEdit, AlertCircle, UploadCloud, CheckCircle2, Loader2, Database, XCircle, CalendarClock, Briefcase, MessageSquareWarning, Filter, Clock, CheckCircle } from "lucide-react";
import Papa from "papaparse";

export default function AdminDashboard() {
  // Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [student, setStudent] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadTable, setUploadTable] = useState("attendance_data");
  const [uploadMessage, setUploadMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Leave Approvals State
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Helpdesk Tickets State
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketStatusFilter, setTicketStatusFilter] = useState("All");
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState("All");

  useEffect(() => {
    fetchPendingLeaves();
    fetchTickets();
  }, []);

  const fetchPendingLeaves = async () => {
    const { data } = await supabase
      .from("leave_requests")
      .select("*, personal_data(full_name)")
      .eq("status", "Pending")
      .order("submitted_at", { ascending: true });
    if (data) setPendingLeaves(data);
  };

  const fetchTickets = async () => {
    const { data } = await supabase
      .from("helpdesk_tickets")
      .select("*, personal_data(full_name)")
      .order("submitted_at", { ascending: false });
    if (data) setTickets(data);
  };

  const handleLeaveAction = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    setProcessingId(id);
    const { error } = await supabase.from("leave_requests").update({ status: newStatus }).eq("id", id);
    setProcessingId(null);
    if (!error) fetchPendingLeaves();
  };

  const handleTicketAction = async (id: string, newStatus: 'In Review' | 'Resolved') => {
    setProcessingId(id);
    const { error } = await supabase.from("helpdesk_tickets").update({ status: newStatus }).eq("id", id);
    setProcessingId(null);
    if (!error) fetchTickets();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    setStudent(null);
    try {
      const { data: personalData, error: personalError } = await supabase.from("personal_data").select("*");
      if (personalError) throw personalError;
      const foundStudent = personalData?.find((s) => JSON.stringify(s).toLowerCase().includes(searchTerm.toLowerCase()));
      if (!foundStudent) {
        setSearchError("No student found with that name or Roll Number.");
      } else {
        const { data: acadData } = await supabase.from("academic_data").select("*").eq("roll_number", foundStudent.roll_number).maybeSingle();
        setStudent({ ...foundStudent, ...acadData });
      }
    } catch (err) {
      setSearchError("Failed to connect to the database.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMessage(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          const { error } = await supabase.from(uploadTable).upsert(rows);
          if (error) throw error;
          setUploadMessage({ text: `Successfully synced ${rows.length} records!`, type: "success" });
        } catch (err: any) {
          setUploadMessage({ text: `Upload failed: ${err.message}`, type: "error" });
        } finally {
          setUploading(false);
          e.target.value = ""; 
        }
      }
    });
  };

  // Slicer Logic for Tickets
  const filteredTickets = tickets.filter(t => {
    const matchesStatus = ticketStatusFilter === "All" || t.status === ticketStatusFilter;
    const matchesCategory = ticketCategoryFilter === "All" || t.category === ticketCategoryFilter;
    return matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* 1. LEAVE & OD APPROVALS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-sm font-medium text-indigo-600">Action Required</p>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <CalendarClock className="h-5 w-5 text-indigo-600" />
              Pending Leaves & ODs
            </h2>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
            {pendingLeaves.length}
          </div>
        </div>

        <div className="space-y-4">
          {pendingLeaves.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500">
              All caught up! No pending requests.
            </div>
          ) : (
            pendingLeaves.map((req) => (
              <div key={req.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{req.personal_data?.full_name || req.roll_number}</span>
                    <span className="text-xs font-medium text-slate-500">({req.roll_number})</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700"><span className="font-medium text-indigo-600">{req.request_type}</span> on {new Date(req.target_date).toLocaleDateString()}</p>
                  <p className="mt-1 text-xs text-slate-500">"{req.reason}"</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => handleLeaveAction(req.id, 'Rejected')} className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">Reject</button>
                  <button onClick={() => handleLeaveAction(req.id, 'Approved')} className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100">Approve</button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 2. HELPDESK TICKETS & SLICERS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">Issue Management</p>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <MessageSquareWarning className="h-5 w-5 text-indigo-600" />
              Helpdesk Overview
            </h2>
          </div>
          
          {/* Slicers / Filters */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select 
              value={ticketStatusFilter} 
              onChange={(e) => setTicketStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Review">In Review</option>
              <option value="Resolved">Resolved</option>
            </select>
            <select 
              value={ticketCategoryFilter} 
              onChange={(e) => setTicketCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Complaint">Complaints</option>
              <option value="Query">Queries</option>
              <option value="Feedback">Feedback</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500">
              No tickets match your filters.
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div key={ticket.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{ticket.personal_data?.full_name || ticket.roll_number}</span>
                    <span className="text-xs text-slate-500">• {new Date(ticket.submitted_at).toLocaleString()}</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      ticket.category === 'Complaint' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {ticket.category}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{ticket.description}</p>
                </div>
                
                <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 pt-4 sm:border-0 sm:pt-0">
                  <span className={`inline-flex items-center justify-center rounded-lg px-3 py-1 text-xs font-semibold ${
                    ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                    ticket.status === 'In Review' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {ticket.status}
                  </span>
                  
                  {/* Action Buttons */}
                  {ticket.status === 'Pending' && (
                    <button onClick={() => handleTicketAction(ticket.id, 'In Review')} className="flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
                      <Clock className="h-3 w-3" /> Mark 'In Review'
                    </button>
                  )}
                  {ticket.status === 'In Review' && (
                    <button onClick={() => handleTicketAction(ticket.id, 'Resolved')} className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                      <CheckCircle className="h-3 w-3" /> Mark 'Resolved'
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 3. STUDENT INSPECTOR (Search Bar remains unchanged) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
         <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-sm font-medium text-indigo-600">Database Search</p>
            <h2 className="text-xl font-semibold">Student Inspector</h2>
          </div>
        </div>
        <form onSubmit={handleSearch} className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by student name or roll number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-indigo-600 focus:bg-white" />
          </div>
          <button type="submit" disabled={searchLoading} className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50">Search</button>
        </form>
        {student && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-6 sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex sm:gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600"><User className="h-8 w-8" /></div>
              <div className="mt-4 sm:mt-0 sm:pt-1">
                <p className="text-xl font-bold text-slate-900">{student.full_name}</p>
                <p className="text-sm font-medium text-slate-500">{student.programme} · Roll No: {student.roll_number}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. BULK UPLOAD SECTION (Remains unchanged) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold tracking-tight">Bulk Data Migration</h2>
        </div>
        <div className="mb-6">
          <select value={uploadTable} onChange={(e) => setUploadTable(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-indigo-600">
            <option value="attendance_data">Attendance Data (Updates Daily)</option>
            <option value="marks_data">Marks Data (Updates Semesterly)</option>
            <option value="academic_data">Academic Data</option>
            <option value="personal_data">Personal Data (Master Roster)</option>
            <option value="timetables">Timetables (Class Schedule)</option>
          </select>
        </div>
        <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50">
          <UploadCloud className="mb-3 h-8 w-8 text-indigo-500" />
          <p className="mb-1 text-sm font-medium text-slate-700">Click to upload CSV file</p>
          <input type="file" accept=".csv" onChange={handleCSVUpload} disabled={uploading} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
          <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200">{uploading ? "Processing..." : "Select File"}</button>
        </div>
      </section>
    </div>
  );
}