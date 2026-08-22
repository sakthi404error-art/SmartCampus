"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CalendarDays, Clock, User, BookOpen } from "lucide-react";

export default function Timetable({ specialization, semester }: { specialization: string; semester: string }) {
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  // Auto-detect current day (Defaults to Monday if it's Sunday)
  const todayIndex = new Date().getDay();
  const defaultDay = todayIndex > 0 && todayIndex < 7 ? daysOfWeek[todayIndex - 1] : "Monday";
  
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSchedule() {
      setLoading(true);
      // Fetch classes matching the student's exact academic profile
      const { data } = await supabase
        .from("timetables")
        .select("*")
        .eq("specialization", specialization || "Systems") // Fallback for testing
        .eq("semester", semester || "1") // Fallback for testing
        .eq("day_of_week", selectedDay)
        .order("session_time", { ascending: true });
      
      if (data) setSchedule(data);
      setLoading(false);
    }

    fetchSchedule();
  }, [specialization, semester, selectedDay]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <CalendarDays className="h-5 w-5 text-indigo-600" />
            Class Schedule
          </h2>
          <p className="mt-1 text-sm text-slate-500">Your specific timetable for Semester {semester || "1"}</p>
        </div>
        
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium outline-none transition focus:border-indigo-600"
        >
          {daysOfWeek.map(day => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8 text-slate-400">Loading schedule...</div>
        ) : schedule.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500">
            No classes scheduled for {selectedDay}. Enjoy your day!
          </div>
        ) : (
          <div className="relative border-l-2 border-indigo-100 pl-4 ml-3 space-y-6">
            {schedule.map((session, idx) => (
              <div key={idx} className="relative">
                {/* Timeline Dot */}
                <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white bg-indigo-500 shadow-sm"></div>
                
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-indigo-200 hover:bg-white hover:shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-2">
                    <Clock className="h-3.5 w-3.5" />
                    {session.session_time}
                  </div>
                  <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    {session.subject_name}
                  </h3>
                  <p className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="h-4 w-4 text-slate-400" />
                    Prof. {session.faculty_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}