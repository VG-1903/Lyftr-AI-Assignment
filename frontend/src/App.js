import React, { useState, useEffect } from "react";
import Section from "./components/Section";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function App() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("Ready to scrape");
  const [result, setResult] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [theme, setTheme] = useState("light");

  // Load history on component mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Load scrape history
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`${API_BASE}/api/scrapes?limit=10`);
      if (!response.ok) throw new Error("Failed to load history");
      const data = await response.json();
      setHistory(data.items || []);
    } catch (error) {
      console.error("Failed to load history:", error);
      setStatus("Failed to load history");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle scrape
  const handleScrape = async () => {
    if (!url.trim()) {
      alert("Please enter a URL");
      return;
    }

    setLoading(true);
    setStatus("Scraping...");
    setResult(null);
    setSavedId(null);

    try {
      const response = await fetch(`${API_BASE}/api/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Scrape failed");
      }

      // Your backend returns: { success: true, result: {...}, id: "..." }
      setResult(data.result);
      setSavedId(data.id);
      setStatus(`Scrape completed in ${data.scrapeTime}`);
      
      // Reload history
      loadHistory();
    } catch (error) {
      console.error("Scrape error:", error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // View saved scrape
  const viewSaved = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/scrapes/${id}`);
      if (!response.ok) throw new Error("Failed to load");
      const data = await response.json();
      
      setResult(data);
      setSavedId(data._id);
      setStatus("Loaded saved scrape");
    } catch (error) {
      console.error("Failed to load saved:", error);
      setStatus("Failed to load saved scrape");
    }
  };

  // Download JSON
  const downloadJson = () => {
    if (!result) return;
    
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scrape_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus("JSON downloaded!");
    setTimeout(() => setStatus(""), 2000);
  };

  // Copy to clipboard
  const copyToClipboard = async (text, message = "Copied to clipboard!") => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(message);
      setTimeout(() => setStatus(""), 2000);
    } catch (err) {
      setStatus("Failed to copy");
    }
  };

  // Share result
  const shareResult = async () => {
    if (!result) return;

    const shareData = {
      title: result.meta?.title || "Web Scrape Result",
      text: `Scraped from: ${url}\nFound ${result.sections?.length || 0} sections`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if (error.name !== "AbortError") {
          copyToClipboard(JSON.stringify(result, null, 2), "Result copied to clipboard!");
        }
      }
    } else {
      copyToClipboard(JSON.stringify(result, null, 2), "Result copied to clipboard!");
    }
  };

  // CSS for light/dark theme
  const themeStyles = {
    light: {
      background: "#f5f5f5",
      text: "#333",
      card: "#ffffff",
      border: "#ddd",
      accent: "#3498db",
      muted: "#7f8c8d",
    },
    dark: {
      background: "#1a1a1a",
      text: "#f0f0f0",
      card: "#2d2d2d",
      border: "#444",
      accent: "#60a5fa",
      muted: "#a0a0a0",
    },
  };

  const currentTheme = themeStyles[theme];

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: currentTheme.background,
      color: currentTheme.text,
      padding: "20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
        flexWrap: "wrap",
        gap: "20px",
      }}>
        <div>
          <h1 style={{ margin: 0, color: currentTheme.accent }}>🌐 MERN Scraper</h1>
          <p style={{ color: currentTheme.muted, margin: "5px 0 0 0" }}>
            Premium Web Content Extraction
          </p>
        </div>
        
        <button
          onClick={toggleTheme}
          style={{
            padding: "10px 20px",
            background: currentTheme.card,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </button>
      </div>

      {/* Main Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 350px",
        gap: "20px",
        maxWidth: "1400px",
        margin: "0 auto",
      }}>
        {/* Left Column - Main Content */}
        <div>
          {/* Scrape Panel */}
          <div style={{
            background: currentTheme.card,
            borderRadius: "12px",
            padding: "25px",
            marginBottom: "20px",
            border: `1px solid ${currentTheme.border}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}>
            <h2 style={{ marginTop: 0, color: currentTheme.text }}>Scrape a Website</h2>
            
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleScrape()}
              placeholder="https://example.com"
              style={{
                width: "100%",
                padding: "15px",
                fontSize: "16px",
                border: `2px solid ${currentTheme.border}`,
                borderRadius: "8px",
                marginBottom: "15px",
                background: currentTheme.background,
                color: currentTheme.text,
              }}
            />
            
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "15px" }}>
              <button
                onClick={handleScrape}
                disabled={loading || !url.trim()}
                style={{
                  padding: "12px 24px",
                  background: currentTheme.accent,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading || !url.trim() ? "not-allowed" : "pointer",
                  fontSize: "16px",
                  opacity: loading || !url.trim() ? 0.7 : 1,
                }}
              >
                {loading ? "⏳ Scraping..." : "🚀 Start Scraping"}
              </button>
              
              <button
                onClick={downloadJson}
                disabled={!result}
                style={{
                  padding: "12px 24px",
                  background: currentTheme.card,
                  color: currentTheme.text,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: "8px",
                  cursor: !result ? "not-allowed" : "pointer",
                  fontSize: "16px",
                  opacity: !result ? 0.5 : 1,
                }}
              >
                📥 Download JSON
              </button>
              
              <button
                onClick={shareResult}
                disabled={!result}
                style={{
                  padding: "12px 24px",
                  background: currentTheme.card,
                  color: currentTheme.text,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: "8px",
                  cursor: !result ? "not-allowed" : "pointer",
                  fontSize: "16px",
                  opacity: !result ? 0.5 : 1,
                }}
              >
                📤 Share Result
              </button>
            </div>
            
            <div style={{
              padding: "12px",
              background: currentTheme.background,
              borderRadius: "8px",
              border: `1px solid ${currentTheme.border}`,
              fontSize: "14px",
              color: currentTheme.muted,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span>{status}</span>
              {savedId && (
                <span
                  onClick={() => copyToClipboard(savedId, "Scrape ID copied!")}
                  style={{
                    color: currentTheme.accent,
                    cursor: "pointer",
                    fontFamily: "monospace",
                    background: currentTheme.card,
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                  title="Click to copy ID"
                >
                  ID: {savedId.slice(0, 8)}...
                </span>
              )}
            </div>
          </div>

          {/* Results Panel */}
          <div style={{
            background: currentTheme.card,
            borderRadius: "12px",
            padding: "25px",
            border: `1px solid ${currentTheme.border}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}>
            <h2 style={{ marginTop: 0, color: currentTheme.text }}>
              {result ? "📋 Scrape Results" : "📋 No Results Yet"}
            </h2>
            
            {result ? (
              <>
                {/* Meta Information */}
                <div style={{
                  background: currentTheme.background,
                  borderRadius: "8px",
                  padding: "20px",
                  marginBottom: "20px",
                  border: `1px solid ${currentTheme.border}`,
                }}>
                  <h3 style={{ marginTop: 0, color: currentTheme.text }}>📊 Meta Information</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px" }}>
                    <div>
                      <strong style={{ color: currentTheme.muted }}>Title:</strong>
                      <div style={{ marginTop: "5px", wordBreak: "break-word" }}>
                        {result.meta?.title || "—"}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: currentTheme.muted }}>Description:</strong>
                      <div style={{ marginTop: "5px", wordBreak: "break-word" }}>
                        {result.meta?.description || "—"}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: currentTheme.muted }}>URL:</strong>
                      <div style={{ marginTop: "5px", wordBreak: "break-word" }}>
                        <a 
                          href={result.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: currentTheme.accent, textDecoration: "none" }}
                        >
                          {result.url}
                        </a>
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: currentTheme.muted }}>Scraped At:</strong>
                      <div style={{ marginTop: "5px" }}>
                        {new Date(result.scrapedAt).toLocaleString()}
                      </div>
                    </div>
                    {result.errors?.length > 0 && (
                      <div style={{ gridColumn: "1 / -1" }}>
                        <strong style={{ color: "#ef4444" }}>Errors ({result.errors.length}):</strong>
                        <div style={{ marginTop: "5px" }}>
                          {result.errors.map((error, i) => (
                            <div key={i} style={{ color: "#ef4444", fontSize: "14px", marginBottom: "3px" }}>
                              • {error.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sections */}
                <div>
                  <h3 style={{ color: currentTheme.text }}>
                    📑 Sections ({result.sections?.length || 0})
                  </h3>
                  {result.sections && result.sections.length > 0 ? (
                    <div style={{ marginTop: "15px" }}>
                      {result.sections.map((section, index) => (
                        <Section key={section.id || index} s={section} theme={currentTheme} />
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      color: currentTheme.muted,
                      border: `1px dashed ${currentTheme.border}`,
                      borderRadius: "8px",
                    }}>
                      No sections found in this page
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{
                padding: "40px 20px",
                textAlign: "center",
                color: currentTheme.muted,
                border: `1px dashed ${currentTheme.border}`,
                borderRadius: "8px",
              }}>
                <p>Enter a URL and click "Start Scraping" to see results here</p>
                <p style={{ fontSize: "14px", marginTop: "10px" }}>
                  Try: <code style={{ background: currentTheme.background, padding: "2px 6px", borderRadius: "4px" }}>https://example.com</code>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - History */}
        <div>
          <div style={{
            background: currentTheme.card,
            borderRadius: "12px",
            padding: "25px",
            border: `1px solid ${currentTheme.border}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            position: "sticky",
            top: "20px",
          }}>
            <h2 style={{ marginTop: 0, color: currentTheme.text }}>📚 Scrape History</h2>
            
            {loadingHistory ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: currentTheme.muted }}>
                Loading history...
              </div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: currentTheme.muted }}>
                No scrape history yet
              </div>
            ) : (
              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                {history.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      background: currentTheme.background,
                      borderRadius: "8px",
                      padding: "15px",
                      marginBottom: "10px",
                      border: `1px solid ${currentTheme.border}`,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = currentTheme.accent}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = currentTheme.border}
                    onClick={() => viewSaved(item._id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: "600",
                          color: currentTheme.text,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginBottom: "5px",
                        }}>
                          {item.meta?.title || item.url}
                        </div>
                        <div style={{
                          fontSize: "12px",
                          color: currentTheme.muted,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                          {item.url}
                        </div>
                      </div>
                      <div style={{
                        fontSize: "12px",
                        color: currentTheme.muted,
                        marginLeft: "10px",
                        whiteSpace: "nowrap",
                      }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewSaved(item._id);
                        }}
                        style={{
                          padding: "5px 10px",
                          background: currentTheme.accent,
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(item._id, "Scrape ID copied!");
                        }}
                        style={{
                          padding: "5px 10px",
                          background: currentTheme.card,
                          color: currentTheme.text,
                          border: `1px solid ${currentTheme.border}`,
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Copy ID
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "20px",
              paddingTop: "20px",
              borderTop: `1px solid ${currentTheme.border}`,
            }}>
              <button
                onClick={loadHistory}
                style={{
                  padding: "8px 16px",
                  background: currentTheme.card,
                  color: currentTheme.text,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                ↻ Refresh
              </button>
              <div style={{ fontSize: "14px", color: currentTheme.muted }}>
                {history.length} items
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: "center",
        marginTop: "40px",
        paddingTop: "20px",
        borderTop: `1px solid ${currentTheme.border}`,
        color: currentTheme.muted,
        fontSize: "14px",
      }}>
        <p>© {new Date().getFullYear()} MERN Scraper • Built with React & Node.js</p>
      </div>
    </div>
  );
}