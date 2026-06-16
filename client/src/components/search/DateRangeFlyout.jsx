import React, { useState } from "react";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
function ymd(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function addMonths(base, n) { return new Date(base.getFullYear(), base.getMonth() + n, 1); }

/** Range calendar. `value` is { checkIn, checkOut } (ISO strings). `single` picks one date. */
export function DateRangeFlyout({ value, onChange, single = false }) {
  const [view, setView] = useState(() => new Date(2026, 0, 1));
  const months = single ? [view] : [view, addMonths(view, 1)];

  function pick(dateStr) {
    if (single) { onChange({ checkIn: dateStr, checkOut: dateStr }); return; }
    const { checkIn, checkOut } = value;
    if (!checkIn || checkOut) { onChange({ checkIn: dateStr, checkOut: "" }); return; }
    if (dateStr <= checkIn) { onChange({ checkIn: dateStr, checkOut: "" }); return; }
    onChange({ checkIn, checkOut: dateStr });
  }

  return (
    <div style={panel}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <button type="button" aria-label="Previous month" onClick={() => setView(addMonths(view, -1))} style={navBtn}>‹</button>
        <button type="button" aria-label="Next month" onClick={() => setView(addMonths(view, 1))} style={navBtn}>›</button>
      </div>
      <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
        {months.map((m, i) => (
          <Month key={i} month={m} value={value} onPick={pick} single={single} />
        ))}
      </div>
    </div>
  );
}

function Month({ month, value, onPick, single }) {
  const year = month.getFullYear(), mon = month.getMonth();
  const first = new Date(year, mon, 1).getDay();
  const days = new Date(year, mon + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const title = month.toLocaleString(undefined, { month: "long", year: "numeric" });
  return (
    <div style={{ width: 240 }}>
      <div style={{ textAlign: "center", fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div style={grid}>
        {DAYS.map((d) => <div key={d} style={{ fontSize: 11, color: "var(--color-muted)", textAlign: "center" }}>{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <span key={i} />;
          const ds = `${year}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isStart = ds === value.checkIn, isEnd = ds === value.checkOut;
          const inRange = !single && value.checkIn && value.checkOut && ds > value.checkIn && ds < value.checkOut;
          const selected = isStart || isEnd;
          return (
            <button key={i} type="button" onClick={() => onPick(ds)} style={dayCell(selected, inRange)}>{day}</button>
          );
        })}
      </div>
    </div>
  );
}

const panel = { padding: 24, maxWidth: "90vw" };
const grid = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 };
const navBtn = { width: 36, height: 36, borderRadius: "var(--radius-full)", border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: "var(--color-ink)" };
function dayCell(selected, inRange) {
  return {
    height: 34, border: "none", cursor: "pointer", fontSize: 13, borderRadius: "var(--radius-full)",
    fontFamily: "var(--font-family-base)",
    background: selected ? "var(--color-ink)" : inRange ? "var(--color-surface-strong)" : "transparent",
    color: selected ? "var(--color-on-dark)" : "var(--color-ink)",
  };
}
