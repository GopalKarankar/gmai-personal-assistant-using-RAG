import { Mail, Clock, ChevronRight } from "lucide-react";

export const MessageList = ({
  messages,
  onViewDetails,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border border-white/20 border-t-emerald-400"></div>
      </div>
    );
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-400">
        <Mail className="mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">No messages found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 overflow-y-auto h-[1000px]">
      {messages.map((message, idx) => (
        <div
          key={message.id || `${message.subject || "message"}-${idx}`}
          className="group rounded-xl border border-white/10 bg-white/[0.06] p-4 transition-all duration-200 hover:border-emerald-400/30 hover:bg-white/[0.08]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-300">
                  From
                </span>
                <p className="truncate text-sm font-medium text-white">
                  {message.from || "Unknown"}
                </p>
              </div>

              <p className="mb-2 text-sm font-semibold text-white line-clamp-2">
                {message.subject || "No subject"}
              </p>

              <p className="mb-3 text-xs text-slate-300 line-clamp-2">
                {message.preview || message.snippet || "No preview available"}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{message.date || "Unknown date"}</span>
                </div>
                {message.labels && message.labels.length > 0 && (
                  <div className="flex items-center gap-2">
                    {message.labels.slice(0, 2).map((label) => (
                      <span
                        key={label}
                        className="rounded bg-slate-700/50 px-2 py-1 text-xs"
                      >
                        {label}
                      </span>
                    ))}
                    {message.labels.length > 2 && (
                      <span className="text-slate-500">
                        +{message.labels.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => onViewDetails(message)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 opacity-0 transition-all duration-200 hover:bg-emerald-400/20 group-hover:opacity-100 cursor-pointer"
              title="View full message details"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {message.unread && (
            <div className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-emerald-400"></div>
          )}
        </div>
      ))}
    </div>
  );
};
