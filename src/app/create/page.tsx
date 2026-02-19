// src/app/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export default function CreateBug() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const createBug = api.bug.create.useMutation({
    onSuccess: () => {
      router.push("/");
      router.refresh(); 
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBug.mutate({ title, description });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Report a New Bug</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., Login button is broken"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 h-32 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Describe what happened..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={createBug.isPending}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {createBug.isPending ? "🤖 AI is analyzing..." : "Submit Bug Report"}
          </button>
        </form>
      </div>
    </div>
  );
}