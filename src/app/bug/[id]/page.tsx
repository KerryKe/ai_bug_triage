"use client";

import { use, useState } from "react";
import { api } from "~/trpc/react";
import Link from "next/link";
import { BugChat } from "~/components/BugChat"; 

export default function BugDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const bugId = parseInt(resolvedParams.id);

  const { data, isLoading, error } = api.bug.getById.useQuery({ id: bugId });

  if (isLoading) return <div className="p-10 text-center">Loading details...</div>;
  if (error || !data) return <div className="p-10 text-center text-red-500">Bug not found</div>;

  const { bug, potentialDuplicates } = data;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-500 hover:underline mb-4 inline-block">&larr; Back to Board</Link>
        
        {/* Main Bug Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold text-gray-900">{bug.title}</h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded uppercase">
              {bug.status}
            </span>
          </div>

          <div className="mt-4 flex gap-4 text-sm">
            <div className="bg-gray-100 px-3 py-1 rounded">
              <span className="font-semibold">Area:</span> {bug.area}
            </div>
            <div className={`px-3 py-1 rounded text-white ${
                bug.severity === "S0" ? "bg-red-600" :
                bug.severity === "S1" ? "bg-orange-500" :
                bug.severity === "S2" ? "bg-yellow-500" : "bg-green-500"
            }`}>
              <span className="font-semibold">Severity:</span> {bug.severity}
            </div>
          </div>

          <p className="mt-6 text-gray-700 whitespace-pre-wrap leading-relaxed border-b pb-6">
            {bug.description}
          </p>

          {/* New Feature: Chat with your bugs */}
          <BugChat bugId={bugId} />
        </div>

        {/* AI Suggestions: Scored Duplicates */}
        {potentialDuplicates.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              ⚠️ Similar Bugs Found
              <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">AI Similarity Scoring</span>
            </h3>
            <div className="space-y-3">
            {potentialDuplicates.map((dup: any) => (
                <Link 
                  href={`/bug/${dup.id}`} 
                  key={dup.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded hover:bg-gray-50 transition"
                >
                  <div className="flex-1">
                    <div className="font-medium text-blue-600 hover:underline">{dup.title}</div>
                    <div className="text-sm text-gray-500 mt-1 line-clamp-1">{dup.description}</div>
                  </div>
                  {/* Similarity Score Display  */}
                  <div className="ml-4 text-right">
                    <span className="text-xs font-bold text-gray-400 block uppercase">Match</span>
                    <span className="text-lg font-mono text-blue-500">
                      {(dup.score * 100).toFixed(0)}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}