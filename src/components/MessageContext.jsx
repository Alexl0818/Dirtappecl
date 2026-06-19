import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const MessageContext = createContext();

const LS_KEY = "dirtapp_messages";

export function MessageProvider({ children }) {
  const [threads, setThreads] = useState({});

  // Load threads from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const parsed = JSON.parse(raw || "{}");
      setThreads(parsed && typeof parsed === "object" ? parsed : {});
    } catch (e) {
      console.error("MessageContext: load failed", e);
      setThreads({});
    }
  }, []);

  // Persist threads any time they change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(threads));
    } catch (e) {
      console.error("MessageContext: save failed", e);
    }
  }, [threads]);

  const sendMessage = (inquiryId, message) => {
    setThreads((prev) => {
      const existing = prev[inquiryId] || [];
      return {
        ...prev,
        [inquiryId]: [...existing, { id: Date.now().toString(), ...message }],
      };
    });
  };

  return (
    <MessageContext.Provider value={{ threads, sendMessage }}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessages() {
  return useContext(MessageContext);
}
