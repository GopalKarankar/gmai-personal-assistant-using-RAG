import { X, Mail, Clock, Copy } from "lucide-react";
import { useState } from "react";
import useClickOutside from "../hooks/useClickOutside";

export const MessageDetailsModal = ({ message, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [bodyView, setBodyView] = useState("html");

  const modalRef = useClickOutside(() => {
    if (isOpen) onClose();
  });

  if (!isOpen || !message) return null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  
  // Decode Gmail Base64URL body
  const decodeGmailBody = (encoded) => {
    if (!encoded) return "";

    // Convert Base64URL → Base64
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");

    // Decode
    return decodeURIComponent(escape(atob(base64)));
  };

  // Extract email body in both HTML and plain text formats
  const getEmailBody = (messageData) => {
    const payload = messageData?.payload || messageData || {};
    let htmlBody = "";
    let plainText = "";

    const traverseParts = (node) => {
      if (!node) return;

      if (node.body?.data) {
        const decodedBody = decodeGmailBody(node.body.data);

        if (node.mimeType === "text/html" && !htmlBody) {
          htmlBody = decodedBody;
        }

        if (node.mimeType === "text/plain" && !plainText) {
          plainText = decodedBody;
        }
      }

      if (node.parts?.length) {
        node.parts.forEach(traverseParts);
      }
    };

    traverseParts(payload);

    if (!plainText && htmlBody) {
      plainText = htmlBody
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();
    }

    return {
      htmlBody: htmlBody || plainText || messageData?.body || messageData?.preview || "",
      plainText: plainText || htmlBody || messageData?.body || messageData?.preview || "",
    };
  };

  const bodyContent = getEmailBody(message.messageData || message);
  const htmlDocument = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><style>body{font-family:Arial,sans-serif;line-height:1.6;padding:16px;color:#0f172a;background:#fff}img{max-width:100%;height:auto}table{border-collapse:collapse;width:100%}th,td{border:1px solid #e2e8f0;padding:8px}</style></head><body>${bodyContent.htmlBody || "<p>No HTML body available</p>"}</body></html>`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div ref={modalRef} className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center">
              <Mail className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Message Details</p>
              <p className="text-xs text-slate-500">Full message information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* From */}
          <div>
            <label className="text-xs font-semibold text-emerald-300 uppercase tracking-wider block mb-2">
              From
            </label>
            <div className="flex items-center justify-between bg-white/[0.06] border border-white/10 rounded-lg px-4 py-3">
              <p className="text-sm text-white truncate">{message.from || "Unknown"}</p>
              <button
                onClick={() => handleCopy(message.from || "")}
                className="text-slate-400 hover:text-slate-200 transition"
                title="Copy email"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-semibold text-emerald-300 uppercase tracking-wider block mb-2">
              Subject
            </label>
            <p className="text-base font-semibold text-white bg-white/[0.06] border border-white/10 rounded-lg px-4 py-3">
              {message.subject || "No subject"}
            </p>
          </div>

          {/* Date and Labels */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-emerald-300 uppercase tracking-wider block mb-2">
                Date
              </label>
              <div className="flex items-center gap-2 text-sm text-slate-300 bg-white/[0.06] border border-white/10 rounded-lg px-4 py-3">
                <Clock className="h-4 w-4 text-emerald-400" />
                {message.date || "Unknown date"}
              </div>
            </div>

            {message.labels && message.labels.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-emerald-300 uppercase tracking-wider block mb-2">
                  Labels
                </label>
                <div className="flex flex-wrap gap-2 bg-white/[0.06] border border-white/10 rounded-lg px-4 py-3">
                  {message.labels.map((label) => (
                    <span
                      key={label}
                      className="px-3 py-1 bg-slate-700/50 text-xs text-slate-200 rounded-full"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Full Message Body */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                Message
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBodyView("html")}
                  className={`px-3 py-1.5 rounded-lg text-xs transition ${
                    bodyView === "html"
                      ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
                      : "bg-white/[0.06] text-slate-300 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  HTML View
                </button>
                <button
                  onClick={() => setBodyView("plain")}
                  className={`px-3 py-1.5 rounded-lg text-xs transition ${
                    bodyView === "plain"
                      ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
                      : "bg-white/[0.06] text-slate-300 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  Plain Text
                </button>
              </div>
            </div>

            <div className="bg-white/[0.06] border border-white/10 rounded-lg overflow-hidden">
              {bodyView === "html" ? (
                <iframe
                  title="Email HTML preview"
                  className="w-full min-h-[24rem] border-0 bg-white"
                  srcDoc={htmlDocument}
                />
              ) : (
                <div className="max-h-80 overflow-y-auto p-4">
                  <pre className="text-sm text-slate-200 leading-7 whitespace-pre-wrap font-sans">
                    {bodyContent.plainText || "No plain text body available"}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Additional Details */}
          {message.threadId && (
            <div>
              <label className="text-xs font-semibold text-emerald-300 uppercase tracking-wider block mb-2">
                Thread ID
              </label>
              <div className="flex items-center justify-between bg-white/[0.06] border border-white/10 rounded-lg px-4 py-3">
                <p className="text-xs text-slate-400 font-mono truncate">
                  {message.threadId}
                </p>
                <button
                  onClick={() => handleCopy(message.threadId)}
                  className="text-slate-400 hover:text-slate-200 transition"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Message ID */}
          {message.id && (
            <div>
              <label className="text-xs font-semibold text-emerald-300 uppercase tracking-wider block mb-2">
                Message ID
              </label>
              <div className="flex items-center justify-between bg-white/[0.06] border border-white/10 rounded-lg px-4 py-3">
                <p className="text-xs text-slate-400 font-mono truncate">
                  {message.id}
                </p>
                <button
                  onClick={() => handleCopy(message.id)}
                  className="text-slate-400 hover:text-slate-200 transition"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-slate-900/50 px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {copied ? "Copied to clipboard!" : ""}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-sm text-slate-300 hover:text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
