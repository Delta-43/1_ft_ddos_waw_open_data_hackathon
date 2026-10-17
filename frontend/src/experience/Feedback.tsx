import { useState } from "react";
import type { Route } from "../api/contract";
import { Icon } from "./Icon";
import { safeRead, safeWrite } from "./model";
interface Note {
  id: string;
  area: string;
  need: string;
  detail: string;
  createdAt: string;
}
const KEY = "warsaw2076-feedback";
export function Feedback({
  route,
  initialArea = "",
}: {
  route?: Route;
  initialArea?: string;
}) {
  const [notes, setNotes] = useState<Note[]>(() => {
    const data = safeRead<unknown>(KEY, []);
    return Array.isArray(data)
      ? data
          .filter(
            (x): x is Note =>
              !!x &&
              typeof x === "object" &&
              typeof x.id === "string" &&
              typeof x.area === "string" &&
              typeof x.need === "string" &&
              typeof x.detail === "string",
          )
          .slice(0, 100)
      : [];
  });
  const [area, setArea] = useState(initialArea),
    [need, setNeed] = useState("More places to rest"),
    [detail, setDetail] = useState(""),
    [message, setMessage] = useState("");
  const save = (next: Note[]) => {
    if (safeWrite(KEY, next)) {
      setNotes(next);
      return true;
    }
    setMessage("Browser storage is unavailable. Your note was not saved.");
    return false;
  };
  function exportNotes() {
    const url = URL.createObjectURL(
      new Blob(
        [JSON.stringify({ demo: true, not_submitted: true, notes }, null, 2)],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "warsaw-city-feedback.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="feedback-content">
      <h2>A better city starts here</h2>
      <p>What would make this part of Warsaw work better for you?</p>
      <div className="notice">
        Demo notebook · saved only in this browser. Nothing is sent to a
        business or municipality.
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!detail.trim()) {
            setMessage("Write a note before saving.");
            return;
          }
          if (notes.length >= 100) {
            setMessage(
              "This notebook is full. Export your notes and delete some before adding another.",
            );
            return;
          }
          if (
            save(
              [
                {
                  id:
                    crypto.randomUUID?.() ??
                    `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  area: area || route?.name || "Central Warsaw",
                  need,
                  detail: detail.trim(),
                  createdAt: new Date().toISOString(),
                },
                ...notes,
              ].slice(0, 100),
            )
          ) {
            setDetail("");
            setMessage(
              "Saved in this browser. You can export or delete it below.",
            );
          }
        }}
      >
        <label htmlFor="feedback-area">Where?</label>
        <select
          id="feedback-area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        >
          <option value="">{route?.name ?? "Central Warsaw"}</option>
          {route?.places.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <label htmlFor="feedback-need">What is missing?</label>
        <select
          id="feedback-need"
          value={need}
          onChange={(e) => setNeed(e.target.value)}
        >
          {[
            "More places to rest",
            "Step-free access",
            "Drinking water",
            "Safer crossings",
            "Quieter surroundings",
            "Service feedback",
          ].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <label htmlFor="feedback-detail">Your note</label>
        <textarea
          id="feedback-detail"
          required
          maxLength={500}
          rows={3}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="A bench between the museum and the park would help."
        />
        <button className="primary" type="submit">
          <Icon name="message-square" size={18} />
          Save locally
        </button>
      </form>
      <p role="status">{message}</p>
      {notes.length > 0 && (
        <>
          <div className="section-heading">
            <h3>Your notes ({notes.length})</h3>
            <button className="text-action" onClick={exportNotes}>
              <Icon name="download" size={16} />
              Export
            </button>
          </div>
          <ul className="feedback-notes">
            {notes.map((n) => (
              <li key={n.id}>
                <div>
                  <strong>{n.need}</strong>
                  <small>{n.area}</small>
                  <p>{n.detail}</p>
                </div>
                <button
                  className="icon-button"
                  aria-label={`Delete note about ${n.need}`}
                  onClick={() => save(notes.filter((x) => x.id !== n.id))}
                >
                  <Icon name="trash-2" size={16} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <details>
        <summary>Example of future city insight</summary>
        <p className="notice">
          Fictional example: several walkers request more seating between a
          museum and a park. A future service could share consented, aggregated
          requests with the municipality.
        </p>
      </details>
    </section>
  );
}
