"use client";

import { api } from "~/trpc/react";
import Link from "next/link";

export default function Home() {
  const { data: bugs, isLoading } = api.bug.getAll.useQuery();

  if (isLoading) return <div>Loading bugs...</div>;

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-6">AI Bug Triage Board</h1>
      <Link href="/create" className="bg-blue-500 text-white px-4 py-2 rounded">
        Report New Bug
      </Link>
      
      <div className="mt-8 grid gap-4">
        {bugs?.map((bug: any) => (
          <Link href={`/bug/${bug.id}`} key={bug.id} className="border p-4 rounded hover:bg-gray-50">
            <h2 className="font-bold">{bug.title}</h2>
            <div className="flex gap-2 text-sm mt-2">
              <span className="bg-red-100 px-2 py-1 rounded">Severity: {bug.severity}</span>
              <span className="bg-blue-100 px-2 py-1 rounded">Area: {bug.area}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}