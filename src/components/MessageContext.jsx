import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { api } from "../lib/api";

const MessageContext = createContext();

// Messages now live on the server. Threads are loaded on demand (per thread id)
// rather than all at once. `threads` is a map of threadId -> messages[].

export function MessageProvider({ children }) {
  const { user } = useAuth();
  const [threads, setThreads] = useState({});

  // Drop cached threads when the signed-in user changes.
  useEffect(() => {
    setThreads({});
  }, [user]);

  async function loadThread(threadId) {
    if (!threadId) return;
    try {
      const msgs = await api.get(
        `/messages?threadId=${encodeURIComponent(threadId)}`
      );
      setThreads((prev) => ({
        ...prev,
        [threadId]: Array.isArray(msgs) ? msgs : [],
      }));
    } catch (e) {
      console.error("MessageContext: loadThread failed", e.message);
    }
  }

  async function sendMessage(threadId, message) {
    const created = await api.post("/messages", {
      threadId,
      fromRole: message.from || message.fromRole || "buyer",
      text: message.text,
    });
    setThreads((prev) => ({
      ...prev,
      [threadId]: [...(prev[threadId] || []), created],
    }));
    return created;
  }

  return (
    <MessageContext.Provider value={{ threads, sendMessage, loadThread }}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessages() {
  return useContext(MessageContext);
}
