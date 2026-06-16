import React from "react";

/**
 * The signature pill search bar. White surface, fully rounded, the system's one
 * shadow tier at rest, divided by hairlines into Where / When / Who segments and
 * terminated by a circular coral search orb. The first segment is editable so the
 * marketplace can be filtered by a free-text query.
 */
export function SearchBar({
  query = "",
  onQueryChange,
  segments = [
    { label: "Check in", value: "Add dates" },
    { label: "Who", value: "Add guests" },
  ],
  onSearch,
  onSegmentClick,
  style,
  ...rest
}) {
  function handleSubmit(e) {
    e.preventDefault();
    onSearch && onSearch();
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        alignItems: "center",
        height: 64,
        padding: "0 8px",
        borderRadius: "var(--radius-full)",
        background: "var(--color-canvas)",
        border: "1px solid var(--color-hairline)",
        boxShadow: "var(--shadow-card)",
        fontFamily: "var(--font-family-base)",
        width: "fit-content",
        maxWidth: "100%",
        ...style,
      }}
      {...rest}
    >
      <label
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 2,
          padding: "8px 24px",
          cursor: "text",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: "var(--type-caption-size)", fontWeight: 600, color: "var(--color-ink)" }}>
          Where
        </span>
        <input
          value={query}
          onChange={(e) => onQueryChange && onQueryChange(e.target.value)}
          placeholder="Search destinations"
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: "var(--type-body-sm-size)",
            color: "var(--color-ink)",
            fontFamily: "var(--font-family-base)",
            width: 150,
            padding: 0,
          }}
        />
      </label>

      {segments.map((seg, i) => (
        <React.Fragment key={i}>
          <span style={{ width: 1, height: 30, background: "var(--color-hairline)" }} />
          <button
            type="button"
            onClick={() => onSegmentClick && onSegmentClick(i)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 2,
              padding: "8px 24px",
              border: "none",
              background: "transparent",
              borderRadius: "var(--radius-full)",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: "var(--type-caption-size)", fontWeight: 600, color: "var(--color-ink)" }}>
              {seg.label}
            </span>
            <span style={{ fontSize: "var(--type-body-sm-size)", color: "var(--color-muted)", whiteSpace: "nowrap" }}>
              {seg.value}
            </span>
          </button>
        </React.Fragment>
      ))}

      <button type="submit" aria-label="Search" style={{ ...orbStyle(48), border: "none", cursor: "pointer", marginLeft: 8 }}>
        <SearchGlyph size={18} />
      </button>
    </form>
  );
}

function orbStyle(size) {
  return {
    width: size,
    height: size,
    borderRadius: "var(--radius-full)",
    background: "var(--color-primary)",
    color: "var(--color-on-primary)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 auto",
  };
}

function SearchGlyph({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.4" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
