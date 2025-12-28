"use client";

import { useMemo, useState } from "react";

type DayAvailabilityCalendarProps = {
  bookedDates: string[];            // e.g. ["2025-11-29", "2025-11-30"]
  initialSelectedDate?: string;     // e.g. "2025-11-30"
  name?: string;                    // form field name, default "event_date"
};

function toYMD(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function DayAvailabilityCalendar({
  bookedDates,
  initialSelectedDate,
  name = "event_date",
}: DayAvailabilityCalendarProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Initial selected date: at least today
  let initialDate = initialSelectedDate ? parseYMD(initialSelectedDate) : today;
  if (initialDate < today) {
    initialDate = today;
  }

  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );
  const [selected, setSelected] = useState<string>(toYMD(initialDate));

  const bookedSet = useMemo(
    () => new Set(bookedDates),
    [bookedDates]
  );

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const currentYear = today.getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear + i); // current year + next 2

  const monthYearLabel = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  // Build grid for current month
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startWeekday = firstDayOfMonth.getDay(); // 0-6
  const daysInMonth = lastDayOfMonth.getDate();

  const cells: Array<{ type: "empty" } | { type: "day"; date: Date }> = [];

  // Leading empty cells
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ type: "empty" });
  }
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ type: "day", date: new Date(year, month, day) });
  }

  function changeMonth(offset: number) {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1)
    );
  }

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newMonth = Number(e.target.value); // 0-11
    setCurrentMonth((prev) => new Date(prev.getFullYear(), newMonth, 1));
  }

  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newYear = Number(e.target.value);
    setCurrentMonth((prev) => new Date(newYear, prev.getMonth(), 1));
  }

  function handleDayClick(date: Date) {
    const ymd = toYMD(date);
    const isBooked = bookedSet.has(ymd);
    const isPast = date < today;
    if (isBooked || isPast) return; // cannot select
    setSelected(ymd);
  }

  return (
    <div>
      {/* Hidden input that the server action reads */}
      <input type="hidden" name={name} value={selected} />

      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="text-xs">Month</label>
          <select
            value={currentMonth.getMonth()}
            onChange={handleMonthChange}
            className="border rounded px-1 py-0.5 text-xs"
          >
            {monthNames.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>

          <label className="text-xs">Year</label>
          <select
            value={currentMonth.getFullYear()}
            onChange={handleYearChange}
            className="border rounded px-1 py-0.5 text-xs"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="border rounded px-2 py-1 text-xs"
          >
            ◀
          </button>
          <div className="font-semibold text-xs">{monthYearLabel}</div>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="border rounded px-2 py-1 text-xs"
          >
            ▶
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="font-semibold">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {cells.map((cell, idx) => {
          if (cell.type === "empty") {
            return <div key={idx} />;
          }

          const ymd = toYMD(cell.date);
          const isBooked = bookedSet.has(ymd);
          const isPast = cell.date < today;
          const isSelected = selected === ymd;

          let className =
            "border rounded px-1 py-1 text-xs select-none";

          if (isBooked) {
            className +=
              " bg-gray-200 text-gray-500 line-through cursor-not-allowed";
          } else if (isPast) {
            className += " text-gray-400 cursor-not-allowed";
          } else if (isSelected) {
            className += " bg-black text-white cursor-pointer";
          } else {
            className += " cursor-pointer";
          }

          return (
            <button
              key={idx}
              type="button"
              className={className}
              onClick={() => handleDayClick(cell.date)}
              disabled={isBooked || isPast}
            >
              {cell.date.getDate()}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-xs space-x-4">
        <span className="inline-block w-3 h-3 border rounded align-middle mr-1" />{" "}
        Available day
        <span className="inline-block w-3 h-3 border rounded bg-gray-200 align-middle ml-4 mr-1" />{" "}
        Booked day
        <span className="inline-block w-3 h-3 border rounded align-middle ml-4 mr-1 text-gray-400 border-dashed" />{" "}
        Past day (not bookable)
      </p>
    </div>
  );
}
