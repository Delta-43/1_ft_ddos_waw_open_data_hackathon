/** The app mark: a winding path that ends in a lit dot. */
export function AppMark() {
  return (
    <svg className="app-mark" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" strokeOpacity="0.22" />
      <path d="M8.5 23.5c3.5 0 4-4.5 7.5-4.5s3.2-6.5 7.5-7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8.5" cy="23.5" r="1.6" fill="currentColor" fillOpacity="0.55" />
      <circle className="app-mark__dot" cx="23.5" cy="11.5" r="2.6" />
    </svg>
  );
}

/** Transparent title bar: the mark and the name, nothing else. */
export function TitleBar({ onHome }: { onHome?: () => void }) {
  return (
    <header className="title-bar">
      <button type="button" className="title-bar__brand" onClick={onHome} aria-label="Find YOUR way: back to the start">
        <AppMark />
        <span className="title-bar__name">
          Find <strong>YOUR</strong> way
        </span>
      </button>
    </header>
  );
}
