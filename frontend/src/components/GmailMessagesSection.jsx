import { RefreshCw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { MessageDetailsModal } from "./MessageDetailsModal";
import { MessageList } from "./MessageList";
import { useGmailAccessTokenStore } from "../store/gmailAccessTokenStore";
import { useGmailAuthStoreDetails } from "../store/gmailAuthStore";
import { getRuntimeEnv } from "../config/runtimeEnv";

const GMAIL_MESSAGES_URL =
  "https://gmail.googleapis.com/gmail/v1/users/me/messages";

const PAGE_SIZE = 50;
const BATCH_SIZE = 10;

const toMessageItem = (message) => {
  const headers = message.payload?.headers ?? [];
  const header = (name) =>
    headers.find((item) => item.name === name)?.value ?? null;
  return {
    from: header("From"),
    subject: header("Subject"),
    date: header("Date"),
    labels: message.labelIds ?? [],
    messageId: message.id,
    threadId: message.threadId,
    snippet: message.snippet,
    messageData: message,
  };
};

export default function GmailMessagesSection() {
  const { accessToken } = useGmailAccessTokenStore();
  const { pageToken, setPageToken, setMessagesIDs, hasVisited, setHasVisited } =
    useGmailAuthStoreDetails();

  const backendUrl = (() => {
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

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [error, setError] = useState("");
  const loadMoreAbortRef = useRef(null);
  const headers = useCallback(
    () => ({ Authorization: `Bearer ${accessToken}` }),
    [accessToken],
  );

  const fetchDetails = useCallback(
    async (ids = []) => {
      if (!ids.length) return [];

      const messages = [];

      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);

        const responses = await Promise.all(
          batch.map((id) =>
            fetch(`${GMAIL_MESSAGES_URL}/${id}`, {
              headers: headers(),
            }),
          ),
        );

        if (responses.some((response) => !response.ok)) {
          throw new Error("Could not load Gmail message details.");
        }

        const batchMessages = await Promise.all(
          responses.map((response) => response.json()),
        );

        messages.push(...batchMessages);
      }

      return messages;
    },
    [headers],
  );

  // const fetchDetails = useCallback(async (ids) => {
  //   const responses = await Promise.all(ids.map((id) => fetch(`${GMAIL_MESSAGES_URL}/${id}`, { headers: headers() })));
  //   if (responses.some((response) => !response.ok)) throw new Error("Could not load Gmail message details.");
  //   return Promise.all(responses.map((response) => response.json()));
  // }, [headers]);

  const refreshMessages = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${GMAIL_MESSAGES_URL}?maxResults=${PAGE_SIZE}`,
        { headers: headers() },
      );
      if (!response.ok) throw new Error("Could not load your Gmail messages.");
      const data = await response.json();
      const ids = (data.messages ?? []).map((message) => message.id);
      const fullMessages = await fetchDetails(ids);
      setMessages(fullMessages.map(toMessageItem));
      setMessagesIDs(ids);
      setPageToken(data.nextPageToken ?? null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, fetchDetails, headers, setMessagesIDs, setPageToken]);

  const syncInbox = useCallback(async () => {
    if (!accessToken || isSyncing) return;
    setIsSyncing(true);
    setProgress(0);
    try {
      const { data } = await axios.get(GMAIL_MESSAGES_URL, {
        headers: headers(),
        params: { maxResults: 50 },
      });
      const ids = (data.messages ?? []).map((message) => message.id);
      const fullMessages = await fetchDetails(ids);

      setProgress(100);
      
      if (fullMessages.length) {
        const formData = new FormData();
        formData.append(
          "messages",
          new Blob([JSON.stringify(fullMessages)], {
            type: "application/json",
          }),
        );
        await axios.post(`${backendUrl}/upload`, formData);
      }
      setHasVisited(true);
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          requestError.message ||
          "Inbox sync failed.",
      );
    } finally {
      setIsSyncing(false);
      setProgress(null);
    }
  }, [
    accessToken,
    fetchDetails,
    headers,
    isSyncing,
    setHasVisited,
    backendUrl,
  ]);

  const loadMore = async () => {
    if (!accessToken || !pageToken || isLoadingMore) return;
    setIsLoadingMore(true);
    loadMoreAbortRef.current?.abort();
    loadMoreAbortRef.current = new AbortController();
    try {
      const response = await fetch(
        `${GMAIL_MESSAGES_URL}?maxResults=${PAGE_SIZE}&pageToken=${pageToken}`,
        { headers: headers(), signal: loadMoreAbortRef.current.signal },
      );
      if (!response.ok) throw new Error("Could not load more Gmail messages.");
      const data = await response.json();
      const ids = (data.messages ?? []).map((message) => message.id);
      const fullMessages = await fetchDetails(ids);
      setMessages((current) => [
        ...current,
        ...fullMessages.map(toMessageItem),
      ]);
      setMessagesIDs((current) => [...current, ...ids]);
      setPageToken(data.nextPageToken ?? null);
    } catch (requestError) {
      if (requestError.name !== "AbortError") setError(requestError.message);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshMessages(), 0);
    return () => window.clearTimeout(timer);
  }, [refreshMessages]);
  useEffect(() => () => loadMoreAbortRef.current?.abort(), []);
  useEffect(() => {
    if (!accessToken || hasVisited) return undefined;
    const timer = window.setTimeout(() => void syncInbox(), 0);
    return () => window.clearTimeout(timer);
  }, [accessToken, hasVisited, syncInbox]);

  return (
    <>
      <section className="rounded-4xl border border-white/10 bg-white/4 p-6 shadow-[0_25px_80px_rgba(2,6,23,0.38)] sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
              <Sparkles className="h-4 w-4" />
              Your Gmail messages
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Emails</h2>
            <p className="mt-1 text-sm text-slate-400">
              {messages.length} message(s) • Select a message to view details.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={refreshMessages}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-emerald-300 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={syncInbox}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-slate-950 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
              />
              Sync inbox
            </button>
          </div>
        </div>
        {error && (
          <p className="mb-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        )}
        {progress !== null && (
          <p className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            Syncing emails to the assistant: {progress}%
          </p>
        )}
        <MessageList
          messages={messages}
          onViewDetails={setSelectedMessage}
          isLoading={isLoading}
        />
        {pageToken && !isLoadingMore && (
          <button
            onClick={loadMore}
            className="mx-auto mt-4 flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200"
          >
            Load more emails
          </button>
        )}
        {isLoadingMore && (
          <button
            onClick={() => loadMoreAbortRef.current?.abort()}
            className="mx-auto mt-4 flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200"
          >
            Cancel loading
          </button>
        )}
      </section>
      <MessageDetailsModal
        message={selectedMessage}
        isOpen={Boolean(selectedMessage)}
        onClose={() => setSelectedMessage(null)}
      />
    </>
  );
}
