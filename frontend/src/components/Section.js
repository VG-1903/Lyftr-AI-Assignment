import React, { useState } from "react";

export default function Section({ s }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copySectionJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(s, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareSection = async () => {
    const shareData = {
      title: s.label || "Scraped Section",
      text: `Section: ${s.type}\n${s.content?.text?.slice(0, 100)}...`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== "AbortError") {
          copySectionJson();
        }
      }
    } else {
      copySectionJson();
    }
  };

  return (
    <div className="section-card">
      <div className="section-head" onClick={() => setOpen(!open)}>
        <div className="section-label">
          {s.label || "Section"} <span className="section-type">({s.type})</span>
        </div>
        <div className="section-type">{open ? "▼" : "▶"}</div>
      </div>
      {open && (
        <div className="section-body">
          {/* Headings */}
          {s.content?.headings && s.content.headings.length > 0 && (
            <div>
              <strong>Headings:</strong> {s.content.headings.join(" | ")}
            </div>
          )}

          {/* Text */}
          {s.content?.text && (
            <div>
              <strong>Text:</strong>
              <div className="section-text">
                {s.content.text.length > 400
                  ? `${s.content.text.slice(0, 400)}...`
                  : s.content.text}
              </div>
            </div>
          )}

          {/* Links */}
          {s.content?.links && s.content.links.length > 0 && (
            <div>
              <strong>Links ({s.content.links.length}):</strong>
              <ul>
                {s.content.links.slice(0, 3).map((link, i) => (
                  <li key={i}>
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      {link.text || link.href}
                    </a>
                  </li>
                ))}
                {s.content.links.length > 3 && (
                  <li>... and {s.content.links.length - 3} more</li>
                )}
              </ul>
            </div>
          )}

          {/* Images */}
          {s.content?.images && s.content.images.length > 0 && (
            <div>
              <strong>Images ({s.content.images.length}):</strong>
              <div className="images">
                {s.content.images.slice(0, 4).map((img, i) => (
                  <div key={i} className="img-wrap">
                    <img
                      src={img.src}
                      alt={img.alt || ""}
                      onError={(e) => (e.target.style.display = "none")}
                    />
                    {img.alt && <div className="img-alt">{img.alt}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
            <button onClick={copySectionJson} style={{ padding: "5px 10px", fontSize: "12px" }}>
              {copied ? "Copied! ✓" : "Copy JSON"}
            </button>
            <button onClick={shareSection} style={{ padding: "5px 10px", fontSize: "12px" }}>
              Share
            </button>
          </div>

          {/* Full JSON */}
          <details style={{ marginTop: "10px" }}>
            <summary>Full JSON</summary>
            <pre style={{ 
              background: "#f5f5f5", 
              padding: "10px", 
              overflow: "auto", 
              maxHeight: "200px",
              fontSize: "12px"
            }}>
              {JSON.stringify(s, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}


















