"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export function BugChat({ bugId }: { bugId?: number }) {
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState<{ role: string; content: string }[]>([]);

  const chatMutation = api.bug.chat.useMutation({
    onSuccess: (data) => {
      setChatLog((prev) => [...prev, { role: "assistant", content: data.reply }]);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setChatLog((prev) => [...prev, { role: "user", content: message }]);
    chatMutation.mutate({ message, bugId });
    setMessage("");
  };

  return (
    <div className="mt-4">
      <div className="bg-gray-50 border rounded-lg p-4 h-48 overflow-y-auto mb-4 space-y-2">
        {chatLog.length === 0 && (
          <p className="text-gray-400 text-sm italic">Ask about trends, duplicates, or fixing severity...</p>
        )}
        {chatLog.map((chat, i) => (
          <div key={i} className={`text-sm ${chat.role === "user" ? "text-blue-700" : "text-gray-800"}`}>
            <span className="font-bold">{chat.role === "user" ? "You: " : "AI: "}</span>
            {chat.content}
          </div>
        ))}
        {chatMutation.isPending && <p className="text-xs text-gray-400 animate-pulse">AI is thinking...</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Deduplicate this bug..."
          className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={chatMutation.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-400"
        >
          Send
        </button>
      </form>
    </div>
  );
}