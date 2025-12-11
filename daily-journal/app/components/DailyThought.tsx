// "use client" specifies DailyThought as a client component instead of the default server component
// A client component is rendered by the web browser instead of the server
// Server components are more lightweight since Typescript code is not sent to the browser, which is why server components are the default
// Only client components can use React hooks such as useState and useEffect, though
"use client"; 
import { useState, useEffect } from "react";

// Custom types should generally be stored in a separate file within lib
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

// The DailyThought component can't be used elsewhere if we don't export it
// React components can receive props objects (kind of similar to parameters)
// props objects can transfer data in a read-only format
// For example, if you wanted to you could create a title prop so when you create a DailyThought component you could do this:
//      <DailyThought title="My Thoughts" />
// We could change the DailyThought header to DailyThought(props) and access the title using props.title
export default function DailyThought() {
    // input/thoughts/competencies/selected are the variables and setInput/setThoughts/setCompetencies/setSelected update those variables
    // The useState hook allows you to set the default value for each variable
    const [input, setInput] = useState("");
    const [thoughts, setThoughts] = useState<Thought[]>([]);
    const [competencies, setCompetencies] = useState<Competency[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    
    // Load competencies from API
    // useEffect is a React hook that runs after a component renders
    // In this example, we want to update the competencies that show on the home page after they are loaded from the API
    useEffect(() => {
        // As async function allows you to use await inside the function
        async function fetchCompetencies() {
            // The fetch function returns a Promise that will eventually resolve to a Response object
            // The await keyword waits for the Promise to resolve until it moves on
            // res.json works similarly, but will resolve to parsed JSON instead of a Response object
            const res = await fetch("/api/competencies");
            const data = await res.json();
            setCompetencies(data);
        }
        fetchCompetencies();
    }, []); // An empty dependency array means this effect only runs ONCE when the component mounts

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

    // Save thoughts to localStorage whenever thoughts are added
    // No longer needed after database is used
    /*useEffect(() => {
        // Convert the stored JSON data to a string
        localStorage.setItem("dailyThoughts", JSON.stringify(thoughts));
    }, [thoughts]); // Runs whenever thoughts state changes */

    /*  handleSave Function
        No Parameters
        Triggered when the Save Thought button is clicked
        Create a new Thought object and add it to the others thoughts
    */
    const handleSave = async () => {
        if (input.trim() === "") return;

        if (editingId !== null) {
            const res = await fetch(`/api/entry/${editingId}`, {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    text: input,
                    competencyIDs: selected,
                }),
            });

            if (!res.ok) {
                alert("Failed to update entry.");
                return;
            }

            const updated = thoughts.map(t => {
                if (t.id === editingId) {
                    return {
                        ...t,
                        text: input,
                        competencies: selected,
                    };
                }
                return t;
            });

            setThoughts(updated);
            setInput("");
            setSelected([]);
            setEditingId(null);
        } else {
            const res = await fetch("api/entry", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    text: input,
                    competencyIDs: selected,
                }),
            });

            if (!res.ok) {
                alert("Failed to save entry.");
                return;
            }

            const newThought = await res.json();
            const formattedThought: Thought = {
                id: newThought.id,
                text: newThought.text,
                time: new Date(newThought.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                competencies: newThought.competencies,
            };

            setThoughts([formattedThought, ...thoughts]);
            setInput("");
            setSelected([]);
        }
    }

    /*  toggleCompetency Function
        Parameters: id - The id of the competency being toggled
        When a competency checkbox is clicked, add it or remove it from the selected array
    */
    const toggleCompetency = (id: number) => {
        // prev is the previous value of the selected array
        setSelected((prev) =>
            // If prev includes the id, filter prev to exclude that id
            // If prev does not include the id, add id to prev
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );
    };

    const handleDelete = async (id: number) => {
        const res = await fetch(`/api/entry/${id}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            alert("Failed to delete");
            return;
        }

        setThoughts(thoughts.filter(t => t.id !== id));
    };

    const handleEdit = (thought: Thought) => {
        setInput(thought.text);
        setSelected(thought.competencies);
        setEditingId(thought.id);
        window.scrollTo(0, 0);
    };

    const handleCancel = () => {
        setInput("");
        setSelected([]);
        setEditingId(null);
    };

    // The return of our DailyThought component will return the actual HTML of the component
    return (
        // If you have a Tailwind extension installed such as Tailwind CSS IntelliSense, you can hover over Tailwind classes to see what they do
        <div className="bg-[#ff0000] text-white p-6 rounded-xl shadow-md text-center max-w-md w-full">
            <h2 className="text-xl font-bold mb-3">Daily Thoughts</h2>
            {/* The textarea is where you type in the thought
                Every time the text of the textarea changes, the input variable is updated
             */}
            <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your thoughts for the day..."
                className="w-full p-2 rounded-md focus:outline-none resize-none"
            />
            {/* This is where the competency checkboxes are created
                The map function takes an array as a parameter (competencies) and runs a callback function for each item (comp) in the array
                This map function outputs JSX code (Javascript + HTML) for each competency
             */}
            <div className="mt-4 text-left">
                <h3 className="font-semibold mb-2">Employability Competencies:</h3>
                <div className="space-y-1">
                    {competencies.map((comp) => (
                            <label
                                key={comp.id}
                                title={comp.description}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <input
                                    className="cursor-pointer"
                                    type="checkbox"
                                    checked={selected.includes(comp.id)}
                                    onChange={() => {toggleCompetency(comp.id)}}
                                />
                                <span>{comp.skill}</span>
                            </label>
                    ))}
                </div>
            </div>

            {/* Save Thought button that triggers the handleSave function */}
            <button
                onClick={handleSave}
                className="mt-3 bg-white text-[#ff0000] px-4 py-2 rounded-md font-semibold hover:bg-[#000000] transition-colors cursor-pointer">
                {editingId !== null ? "Update" : "Save Thought"}
            </button>
            {editingId !== null && (
                <button
                    onClick={handleCancel}
                    className="mt-3 ml-2 bg-gray-400 text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-500 transition-colors cursor-pointer">
                    Cancel
                </button>
            )}
            
            {/* Shows the most recent 5 thoughts - The slice function is used to limit the thoughts to 5
                If there are no thoughts, display the paragraph instead
                The map function is used on the thoughts array to display each thought in a <div>
            */}
            <div className="mt-5 space-y-3 text-left">
                {thoughts.length === 0 ? (<p className="italic text-center">No thoughts yet. Start typing!</p>) : (
                    thoughts.slice(0, 5).map((thought, index) => (
                        <div 
                            key={thought.id}
                            className="bg-white/20 p-3 rounded-lg shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <p className="text-lg">{thought.text}</p>
                                    <p className="text-sm opacity-80 mt-1">{thought.time}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                    <a href="/thoughts" className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-black text-xs rounded flex-shrink-0">Manage</a>
                                </div>
                            </div>
                            {thought.competencies.length > 0 && (
                                <p className="text-sm mt-1">
                                    <strong>Competencies: </strong>
                                    {/* For each competency attached to the current thought, find the actual name of the skill */}
                                    {thought.competencies.map((id) =>
                                        competencies.find((c) => c.id === id)?.skill || `#${id}`).join(", ")
                                    }
                                </p>
                            )}  
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}