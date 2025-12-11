"use client";
import { useState, useEffect } from "react";


type Thought = {
    id: number;
    text: string;
    time: string;
    competencies: number[];
};

type Competency = {
    id: number;
    skill: string;
    description: string;
};

type EntryFromDB = {
    id: number;
    text: string;
    createdAt: string;
    competencies: number[];
}

// A page.tsx file is just a React component similar to DailyThought.tsx
// The difference is it is stored within a directory and the path to that directory will load the component
// In this case, the path is /thoughts
export default function Thoughts() {
    const [thoughts, setThoughts] = useState<Thought[]>([]);
    const [competencies, setCompetencies] = useState<Competency[]>([]);
    
    // Load thoughts from the database using our GET route
    useEffect(() => {
        async function loadThoughts() {
            const res = await fetch("/api/entry");
            
            if (!res.ok) return;
            const data: EntryFromDB[] = await res.json();
            
            // Transform the response into a Thought
            const formatted: Thought[] = data.map((row) => (
                {
                    id: row.id,
                    text: row.text,
                    time: new Date(row.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    competencies: (row.competencies && row.competencies.filter((c: any) => c !== null)) || [],
                }
            ));
            setThoughts(formatted);
        }
        loadThoughts();
    }, []);

    useEffect(() => {
        async function fetchCompetencies() {
            const res = await fetch("/api/competencies");
            const data = await res.json();
            setCompetencies(data);
        }
        fetchCompetencies();
    }, []);

    return (
        <div className="max-w-2xl w-full bg-white p-6 rounded-lg shadow-md mt-5">
            <h2 className="text-2xl font-bold mb-4 text-[#ff0000]">All My Thoughts</h2>
            <div className="space-y-4">
                    {thoughts.length === 0 ? (<p className="italic text-center">No thoughts yet. Start typing!</p>) : (
                            thoughts.map((thought) => (
                                <div key={thought.id} className="bg-white p-4 rounded-lg shadow-sm border">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <p className="text-lg font-medium leading-relaxed break-words">{thought.text}</p>
                                            <p className="text-sm text-gray-500 mt-2">{thought.time}</p>

                                            {thought.competencies.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {thought.competencies.map((id) => {
                                                        const name = competencies.find((c) => c.id === id)?.skill || `#${id}`;
                                                        return (
                                                            <span key={id} className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">{name}</span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-shrink-0 flex flex-col items-end gap-2">
                                            <button
                                                onClick={async () => {
                                                    const newText = window.prompt("Edit thought:", thought.text);
                                                    if (!newText || newText.trim() === "") return;
                                                    const res = await fetch(`/api/entry/${thought.id}`, {
                                                        method: "PUT",
                                                        headers: {"Content-Type": "application/json"},
                                                        body: JSON.stringify({ text: newText, competencyIDs: thought.competencies }),
                                                    });
                                                    if (!res.ok) { alert("Failed to update entry."); return; }
                                                    setThoughts((prev) => prev.map(t => t.id === thought.id ? { ...t, text: newText } : t));
                                                }}
                                                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded">
                                                Edit
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (!confirm("Delete this thought?")) return;
                                                    const res = await fetch(`/api/entry/${thought.id}`, { method: "DELETE" });
                                                    if (!res.ok) { alert("Failed to delete"); return; }
                                                    setThoughts((prev) => prev.filter(t => t.id !== thought.id));
                                                }}
                                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                    )}
            </div>
        </div>
    );
}