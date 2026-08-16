import { Bot, RefreshCw, Send, Trash2, XCircle, Zap } from "lucide-react";
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGmailAccessTokenStore } from "../store/gmailAccessTokenStore";
import { useGmailAuthStoreDetails } from "../store/gmailAuthStore";
import { getRuntimeEnv } from "../config/runtimeEnv";
import { useNavigate } from "react-router-dom";

const GMAIL_MESSAGES_URL =
  "https://gmail.googleapis.com/gmail/v1/users/me/messages";

const CONCURRENT_REQUESTS = 5;
const MAX_RETRIES = 5;
const PAGE_SIZE = 10;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const quickPrompts = ["Summarize my emails", "Find invoices from this week"];

const renderInlineText = (text) => {
  if (!text) return null;

  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|[^*`]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const token = match[0];

    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong
          key={`${token}-${parts.length}`}
          className="font-semibold text-white"
        >
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={`${token}-${parts.length}`}
          className="rounded bg-slate-800/90 px-1.5 py-0.5 font-mono text-[0.82rem] text-cyan-200"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      parts.push(<span key={`${token}-${parts.length}`}>{token}</span>);
    }
  }

  return <>{parts}</>;
};

const parseRichMessage = (text) => {
  const lines = text.split("\n");
  const blocks = [];
  let paragraphLines = [];
  let listItems = null;

  const flushParagraph = () => {
    if (paragraphLines.length) {
      blocks.push({
        type: "paragraph",
        content: paragraphLines.join(" "),
      });
      paragraphLines = [];
    }
  };

  const flushList = () => {
    if (listItems) {
      blocks.push({ type: listItems.type, items: listItems.items });
      listItems = null;
    }
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      return;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: Math.min(headingMatch[1].length, 3),
        content: headingMatch[2],
      });
      return;
    }

    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      if (!listItems || listItems.type !== "bullet") {
        flushList();
        listItems = { type: "bullet", items: [] };
      }
      listItems.items.push(bulletMatch[1]);
      return;
    }

    const orderedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      if (!listItems || listItems.type !== "ordered") {
        flushList();
        listItems = { type: "ordered", items: [] };
      }
      listItems.items.push(orderedMatch[2]);
      return;
    }

    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: "quote", content: quoteMatch[1] });
      return;
    }

    paragraphLines.push(line);
  });

  flushParagraph();
  flushList();

  return blocks;
};

export const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState("");
  // const [syncedCount, setSyncedCount] = useState(0);
  const { accessToken } = useGmailAccessTokenStore();
  const { hasVisited, setHasVisited } = useGmailAuthStoreDetails();
  const hasAutoSyncedRef = useRef(false);
  const abortControllerRef = useRef(null);
  const chatAbortControllerRef = useRef(null);
  const { logout } = useGmailAuthStoreDetails();
  const [uploadProgress, setUploadProgress] = useState(0);
  // const [downloadProgress, setDownloadProgress] = useState(0);
  const VITE_BACKEND_URL = (() => {
    const configured = getRuntimeEnv("VITE_BACKEND_URL", "");
    if (configured) return configured;
    if (typeof window !== "undefined") {
      const currentOrigin = window.location.origin;
      if (currentOrigin.includes("5173"))
        return currentOrigin.replace(/:5173$/, ":8000");
      return currentOrigin;
    }
    return "http://127.0.0.1:8000";
  })();

  const navigate = useNavigate();

  // console.log("VITE_BACKEND_URL : ",VITE_BACKEND_URL);

  const headers = useCallback(
    (token = accessToken) => ({ Authorization: `Bearer ${token}` }),
    [accessToken],
  );

  const handleClearChat = useCallback(() => {
    setMessages([]);
    setInput("");
    setError("");
    setIsTyping(false);
  }, []);

  const fetchWithRetry = useCallback(
    async (id, token, signal) => {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const response = await fetch(`${GMAIL_MESSAGES_URL}/${id}`, {
          headers: headers(token),
          signal,
        });

        if (response.ok) {
          return response.json();
        }

        // Retry on rate limit
        if (response.status === 429 && attempt < MAX_RETRIES) {
          const retryAfter = response.headers.get("Retry-After");

          const delay = retryAfter
            ? Number(retryAfter) * 1000
            : Math.min(1000 * Math.pow(2, attempt), 10000);

          console.warn(`Rate limited for ${id}. Retrying in ${delay} ms...`);

          await sleep(delay);

          if (signal.aborted) {
            throw new DOMException("Aborted", "AbortError");
          }

          continue;
        }

        const text = await response.text();

        throw new Error(`Message ${id}: ${response.status} ${text}`);
      }
    },
    [headers],
  );

  const fetchDetails = useCallback(
    async (ids, token, signal) => {
      const results = [];

      for (let i = 0; i < ids.length; i += CONCURRENT_REQUESTS) {
        const batch = ids.slice(i, i + CONCURRENT_REQUESTS);

        const batchResults = await Promise.all(
          batch.map((id) => fetchWithRetry(id, token, signal)),
        );

        results.push(...batchResults);

        if (i + CONCURRENT_REQUESTS < ids.length) {
          await sleep(300);
        }
      }

      return results;
    },
    [fetchWithRetry],
  );

  const cancelSync = useCallback(() => {
    abortControllerRef.current?.abort();
    if (!abortControllerRef.current) return;

    const controller = abortControllerRef.current;
    abortControllerRef.current = null;
    controller.abort();
    setIsSyncing(false);
    setError("Inbox sync cancelled.");
  }, []);

  const cancelChatRequest = useCallback(() => {
    chatAbortControllerRef.current?.abort();

    if (!chatAbortControllerRef.current) return;

    const controller = chatAbortControllerRef.current;
    chatAbortControllerRef.current = null;
    controller.abort();
    setIsTyping(false);
    setError("Message generation cancelled.");
  }, []);

  const syncInbox = useCallback(async () => {
    if (!accessToken) {
      setError(
        "Connect your Google account first so Gmail messages can be synced.",
      );
      return;
    }

    if (isSyncing) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSyncing(true);
    setError("");

    try {
      const { data } = await axios.get(GMAIL_MESSAGES_URL, {
        headers: headers(accessToken),
        params: { maxResults: 50 },
        signal: controller.signal,
      });

      const ids = (data.messages ?? []).map((message) => message.id);
      const fullMessages = [];

      for (let index = 0; index < ids.length; index += PAGE_SIZE) {
        const currentBatch = ids.slice(index, index + PAGE_SIZE);
        fullMessages.push(
          ...(await fetchDetails(currentBatch, accessToken, controller.signal)),
        );
      }

      if (fullMessages.length) {
        const formData = new FormData();
        formData.append(
          "messages",
          new Blob([JSON.stringify(fullMessages)], {
            type: "application/json",
          }),
        );

        await axios.post(`${VITE_BACKEND_URL}/upload`, formData, {
          signal: controller.signal,

          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );

              // console.log("Upload:", percent + "%");
              setUploadProgress(percent);
            }
          },
        });
      }

      // setSyncedCount(fullMessages.length);
      setHasVisited(true);
      setMessages((previous) => [
        ...previous,
        {
          id: Date.now(),
          role: "assistant",
          text: `Synced ${fullMessages.length} Gmail message${fullMessages.length === 1 ? "" : "s"} into the RAG backend.`,
        },
      ]);
    } catch (requestError) {
      const wasCanceled =
        requestError?.code === "ERR_CANCELED" ||
        requestError?.name === "CanceledError" ||
        requestError?.message === "canceled";

      const detail = wasCanceled
        ? "Inbox sync cancelled."
        : requestError.response?.data?.detail ||
          requestError.message ||
          "Inbox sync failed.";

      setError(detail);
    } finally {
      abortControllerRef.current = null;
      setIsSyncing(false);
    }
  }, [
    accessToken,
    fetchDetails,
    headers,
    isSyncing,
    setHasVisited,
    VITE_BACKEND_URL,
  ]);

  useEffect(() => {
    if (!accessToken) {
      logout();
      navigate("/");
      alert("Session expired pls login again.");
      // return;
    }
  }, [accessToken, logout, navigate]);

  useEffect(() => {
    if (hasVisited || hasAutoSyncedRef.current) return;

    hasAutoSyncedRef.current = true;
    setHasVisited(true);
    syncInbox();
  }, [hasVisited, syncInbox, setHasVisited]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = input.trim();
    if (!value || isTyping) return;

    const userMessage = { id: Date.now(), role: "user", text: value };
    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setIsTyping(true);
    setError("");

    const controller = new AbortController();
    chatAbortControllerRef.current = controller;

    try {
      const { data } = await axios.post(
        `${VITE_BACKEND_URL}/chat`,
        {
          question: value,
        },
        {
          signal: controller.signal,
        },
      );
      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "assistant",
          text:
            data.answer ||
            "I could not find a helpful answer from your synced inbox yet.",
        },
      ]);
    } catch (requestError) {
      const wasCanceled =
        requestError?.code === "ERR_CANCELED" ||
        requestError?.name === "CanceledError" ||
        requestError?.message === "canceled";

      if (wasCanceled) {
        setError("Message generation cancelled.");
        return;
      }

      const detail =
        requestError.response?.data?.detail ||
        requestError.message ||
        "The assistant could not answer that request.";
      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: detail,
        },
      ]);
    } finally {
      if (chatAbortControllerRef.current === controller) {
        chatAbortControllerRef.current = null;
      }
      setIsTyping(false);
    }
  };

  return (
    <div
      className="min-h-[calc(100vh-73px)] px-4 py-6 sm:px-6 lg:px-8"
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(34, 211, 238, 0.16), transparent 35%), radial-gradient(circle at bottom right, rgba(167, 139, 250, 0.16), transparent 30%), linear-gradient(135deg, rgba(2, 6, 23, 0.95), rgba(15, 23, 42, 0.92))",
      }}
    >
      <main className="mx-auto flex max-w-7xl flex-col gap-6 rounded-4xl border border-white/15 bg-white/10 p-4 shadow-[0_25px_100px_rgba(2,6,23,0.45)] backdrop-blur-2xl lg:flex-row lg:p-6">
        <section className="flex w-auto flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-white/15 bg-slate-950/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
          <div className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            {/* Left */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-950 sm:h-11 sm:w-11">
                <Bot className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="truncate font-semibold text-white">
                  Inbox Copilot
                </p>
                <p className="text-xs text-slate-400 sm:text-sm">
                  RAG-powered answers for your Gmail
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleClearChat}
                disabled={messages?.length === 0}
                className={`${messages?.length === 0 && "opacity-50"} flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/20 sm:w-auto sm:py-1`}
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                <span>Clear chat</span>
              </button>

              {
                <button
                  type="button"
                  onClick={() => {
                    setUploadProgress(0);
                    void syncInbox();
                  }}
                  disabled={isSyncing}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs text-emerald-200 transition hover:bg-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-1"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isSyncing ? "animate-spin" : ""
                    }`}
                  />
                  <span>
                    {isSyncing ? (
                      <>
                        Syncing
                        {uploadProgress > 0 ? ` (${uploadProgress}%)` : ""}
                        {/* <br /> */}
                        {/* <span className="text-[10px] opacity-80">
                          (It takes less than 4 mins to sync)
                        </span> */}
                      </>
                    ) : (
                      "Sync inbox"
                    )}
                  </span>
                </button>
              }

              {isSyncing && (
                <button
                  type="button"
                  onClick={cancelSync}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-300/20 sm:w-auto sm:py-1"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {error ? (
              <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            {messages?.length === 0 ? (
              <div className="m-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-cyan-100">
                  <Zap className="h-4 w-4" />
                  Try one of these prompts
                </div>
                <div className="mt-3 flex flex-wrap flex-row justify-center gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setInput(prompt)}
                      className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/20"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const isUser = message.role === "user";
                  const richBlocks = !isUser
                    ? parseRichMessage(message.text)
                    : [];

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl border px-4 py-3 text-sm leading-7 shadow-sm ${
                          isUser
                            ? "border-cyan-300/20 bg-cyan-300/15 text-cyan-50"
                            : "border-white/10 bg-white/10 text-slate-200"
                        }`}
                      >
                        {isUser ? (
                          <div className="whitespace-pre-wrap">
                            {message.text}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {richBlocks.length > 0 ? (
                              richBlocks.map((block, index) => {
                                if (block.type === "paragraph") {
                                  return (
                                    <p
                                      key={`${message.id}-paragraph-${index}`}
                                      className="whitespace-pre-wrap"
                                    >
                                      {renderInlineText(block.content)}
                                    </p>
                                  );
                                }

                                if (block.type === "heading") {
                                  const HeadingTag = `h${Math.min(block.level, 3)}`;
                                  return (
                                    <HeadingTag
                                      key={`${message.id}-heading-${index}`}
                                      className="font-semibold text-white"
                                    >
                                      {renderInlineText(block.content)}
                                    </HeadingTag>
                                  );
                                }

                                if (block.type === "quote") {
                                  return (
                                    <div
                                      key={`${message.id}-quote-${index}`}
                                      className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-cyan-50"
                                    >
                                      {renderInlineText(block.content)}
                                    </div>
                                  );
                                }

                                if (block.type === "bullet") {
                                  return (
                                    <ul
                                      key={`${message.id}-bullet-${index}`}
                                      className="ml-4 list-disc space-y-1"
                                    >
                                      {block.items.map((item, itemIndex) => (
                                        <li
                                          key={`${message.id}-bullet-${index}-${itemIndex}`}
                                        >
                                          {renderInlineText(item)}
                                        </li>
                                      ))}
                                    </ul>
                                  );
                                }

                                if (block.type === "ordered") {
                                  return (
                                    <ol
                                      key={`${message.id}-ordered-${index}`}
                                      className="ml-4 list-decimal space-y-1"
                                    >
                                      {block.items.map((item, itemIndex) => (
                                        <li
                                          key={`${message.id}-ordered-${index}-${itemIndex}`}
                                        >
                                          {renderInlineText(item)}
                                        </li>
                                      ))}
                                    </ol>
                                  );
                                }

                                return null;
                              })
                            ) : (
                              <div className="whitespace-pre-wrap">
                                {message.text}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50 shadow-sm">
                      <div className="relative flex h-5 w-5 items-center justify-center">
                        <div className="absolute h-4 w-4 animate-spin rounded-full border-2 border-cyan-200/40 border-t-cyan-300" />
                        <div className="absolute h-2.5 w-2.5 rounded-full bg-cyan-300/80" />
                      </div>
                      <span className="font-medium">
                        Thinking through your inbox…
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-white/10 p-4"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-2 backdrop-blur">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about your Gmail..."
                className="min-h-11 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
              {isTyping ? (
                <button
                  type="button"
                  onClick={cancelChatRequest}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-300/20 bg-rose-300/10 text-rose-200 transition hover:bg-rose-300/20"
                  aria-label="Cancel message"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-950 transition hover:bg-slate-100"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};
