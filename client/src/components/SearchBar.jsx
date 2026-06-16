import React, { useEffect, useRef, useState } from "react";
import { WhereFlyout } from "./search/WhereFlyout.jsx";
import { DateRangeFlyout } from "./search/DateRangeFlyout.jsx";
import { GuestsFlyout } from "./search/GuestsFlyout.jsx";

const EMPTY_GUESTS = { adults: 0, children: 0, infants: 0, pets: 0 };

/**
 * The signature pill search bar. Segments open one flyout at a time; the layout
 * reshapes per product tab (stays = Where/Check in/Check out/Who; experiences &
 * services = Where/Date/Who). Pressing search commits the composed query.
 */
export function SearchBar({ tab = "stays", onSearch, style }) {
  const [open, setOpen] = useState(null); // "where" | "dates" | "who" | null
  const [where, setWhere] = useState(""); // committed destination text (typed or chosen)
  const [dates, setDates] = useState({ checkIn: "", checkOut: "" });
  const [guests, setGuests] = useState(EMPTY_GUESTS);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(null); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const single = tab !== "stays";
  const guestCount = guests.adults + guests.children;
  const guestLabel = guestCount ? `${guestCount} guest${guestCount > 1 ? "s" : ""}` : "Add guests";
  const datesLabel = dates.checkIn ? (single ? fmt(dates.checkIn) : `${fmt(dates.checkIn)}${dates.checkOut ? " – " + fmt(dates.checkOut) : ""}`) : (single ? "Add date" : "Add dates");

  function commit(e) {
    e?.preventDefault();
    setOpen(null);
    onSearch && onSearch({
      location: where,
      checkIn: dates.checkIn || "",
      checkOut: single ? dates.checkIn || "" : dates.checkOut || "",
      guests: guestCount,
    });
  }

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <form onSubmit={commit} className="sl-search" style={bar}>
        <WhereSegment value={where} onChange={setWhere} active={open === "where"} onFocus={() => setOpen("where")} />
        <Divider />
        {single ? (
          <Segment label="Date" value={datesLabel} muted={!dates.checkIn} onClick={() => setOpen(open === "dates" ? null : "dates")} active={open === "dates"} />
        ) : (
          <>
            <Segment label="Check in" value={dates.checkIn ? fmt(dates.checkIn) : "Add dates"} muted={!dates.checkIn} onClick={() => setOpen(open === "dates" ? null : "dates")} active={open === "dates"} />
            <Divider />
            <Segment label="Check out" value={dates.checkOut ? fmt(dates.checkOut) : "Add dates"} muted={!dates.checkOut} onClick={() => setOpen(open === "dates" ? null : "dates")} active={open === "dates"} />
          </>
        )}
        <Divider />
        <Segment label="Who" value={guestLabel} muted={!guestCount} onClick={() => setOpen(open === "who" ? null : "who")} active={open === "who"} />
        <button type="submit" aria-label="Search" className="sl-search-orb" style={orb}>
          <SearchGlyph />
        </button>
      </form>

      {open === "where" && (
        <div className="sl-flyout" style={{ left: 0 }}>
          <WhereFlyout value={where} onSelect={(d) => { setWhere(d); setOpen("dates"); }} />
        </div>
      )}
      {open === "dates" && (
        <div className="sl-flyout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          <DateRangeFlyout value={dates} onChange={setDates} single={single} />
        </div>
      )}
      {open === "who" && (
        <div className="sl-flyout" style={{ right: 0 }}>
          <GuestsFlyout value={guests} onChange={setGuests} />
        </div>
      )}
    </div>
  );
}

function Segment({ label, value, muted, onClick, active }) {
  return (
    <button type="button" onClick={onClick} className="sl-search-seg" style={{ ...seg, background: active ? "var(--color-surface-soft)" : "transparent" }}>
      <span style={{ fontSize: "var(--type-caption-size)", fontWeight: 600, color: "var(--color-ink)" }}>{label}</span>
      <span style={{ fontSize: "var(--type-body-sm-size)", color: muted ? "var(--color-muted)" : "var(--color-ink)", whiteSpace: "nowrap", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
    </button>
  );
}

// The Where segment holds a real text input so the user can type to filter
// destinations; the value also serves as the committed location on search.
function WhereSegment({ value, onChange, active, onFocus }) {
  return (
    <label className="sl-search-seg sl-search-where" style={{ ...seg, cursor: "text", background: active ? "var(--color-surface-soft)" : "transparent" }}>
      <span style={{ fontSize: "var(--type-caption-size)", fontWeight: 600, color: "var(--color-ink)" }}>Where</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder="Search destinations"
        style={{
          border: "none", outline: "none", background: "transparent",
          fontSize: "var(--type-body-sm-size)", color: "var(--color-ink)",
          fontFamily: "var(--font-family-base)", width: 150, padding: 0,
        }}
      />
    </label>
  );
}
function Divider() { return <span style={{ width: 1, height: 30, background: "var(--color-hairline)" }} />; }

function fmt(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleString(undefined, { month: "short", day: "numeric" });
}

const bar = {
  display: "flex", alignItems: "center", height: 64, padding: "0 8px",
  borderRadius: "var(--radius-full)", background: "var(--color-canvas)",
  border: "1px solid var(--color-hairline)", fontFamily: "var(--font-family-base)",
  width: "fit-content", maxWidth: "100%",
};
const seg = {
  display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
  padding: "8px 24px", border: "none", borderRadius: "var(--radius-full)", cursor: "pointer", textAlign: "left",
};
const orb = {
  width: 48, height: 48, borderRadius: "var(--radius-full)", border: "none",
  cursor: "pointer", marginLeft: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto",
};
function SearchGlyph() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.4" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
