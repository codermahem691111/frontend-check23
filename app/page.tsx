"use client";

import { useEffect, useMemo, useState } from "react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "https://checking-trae.onrender.com";

const FILTERS = ["All", "Active", "Done"];

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [task, setTask] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");

  async function request(path, options) {
    const res = await fetch(`${API}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) throw new Error("Request failed");
    return res.json();
  }

  async function load() {
    try {
      setError("");
      setTodos(await request("/get"));
    } catch {
      setError(
        "Couldn't reach the server. It may be waking up, so try again in a few seconds."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addTodo(e) {
    e.preventDefault();
    const text = task.trim();
    if (!text) return;
    try {
      const created = await request("/add", {
        method: "POST",
        body: JSON.stringify({ task: text }),
      });
      setTodos((prev) => [...prev, created]);
      setTask("");
    } catch {
      setError("Couldn't add that task. Try again.");
    }
  }

  async function completeTodo(id) {
    try {
      const updated = await request(`/edit/${id}`, { method: "PUT" });
      setTodos((prev) => prev.map((t) => (t._id === id ? updated : t)));
    } catch {
      setError("Couldn't mark that task done. Try again.");
    }
  }

  async function saveEdit(id) {
    const text = draft.trim();
    setEditingId(null);
    if (!text) return;
    try {
      await request(`/update/${id}`, {
        method: "PUT",
        body: JSON.stringify({ task: text }),
      });
      setTodos((prev) =>
        prev.map((t) => (t._id === id ? { ...t, task: text } : t))
      );
    } catch {
      setError("Couldn't save your changes. Try again.");
    }
  }

  async function removeTodo(id) {
    try {
      await request(`/delete/${id}`, { method: "DELETE" });
      setTodos((prev) => prev.filter((t) => t._id !== id));
    } catch {
      setError("Couldn't delete that task. Try again.");
    }
  }

  const doneCount = todos.filter((t) => t.done).length;
  const left = todos.length - doneCount;
  const percent = todos.length ? Math.round((doneCount / todos.length) * 100) : 0;

  const visible = useMemo(() => {
    if (filter === "Active") return todos.filter((t) => !t.done);
    if (filter === "Done") return todos.filter((t) => t.done);
    return todos;
  }, [todos, filter]);

  return (
    <main className="min-h-screen bg-[#e9eef6] px-4 py-10 text-[#14213d] sm:py-16">
      <div className="mx-auto w-full max-w-xl">
        {/* Header */}
        <header className="mb-8">
          <p className="text-sm font-medium text-[#5b6b8c]">TaskFlow</p>
          <h1 className="mt-1 text-5xl font-bold leading-none tracking-tight sm:text-6xl">
            {loading
              ? "Loading…"
              : left === 0 && todos.length > 0
              ? "All done"
              : `${left} to do`}
          </h1>

          <div
            className="mt-5 h-2 overflow-hidden rounded-full bg-[#d3dcec]"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Tasks completed"
          >
            <div
              className="h-full rounded-full bg-[#3a5bff] transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-[#5b6b8c]">
            {doneCount} of {todos.length} completed
          </p>
        </header>

        {/* Add form */}
        <form
          onSubmit={addTodo}
          className="flex gap-2 rounded-2xl bg-white p-2 shadow-[0_8px_30px_-12px_rgba(20,33,61,0.25)] focus-within:ring-2 focus-within:ring-[#3a5bff]"
        >
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="What needs doing?"
            aria-label="New task"
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-base outline-none placeholder:text-[#9aa6bf]"
          />
          <button
            type="submit"
            disabled={!task.trim()}
            className="rounded-xl bg-[#3a5bff] px-5 py-2 font-semibold text-white transition hover:bg-[#2745e6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3a5bff] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add task
          </button>
        </form>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-[#f1b4b4] bg-[#fdecec] px-4 py-3 text-sm text-[#8a2323]"
          >
            <span>{error}</span>
            <button
              onClick={load}
              className="shrink-0 font-semibold underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="mt-6 flex gap-1 rounded-xl bg-[#d3dcec] p-1" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition ${
                filter === f
                  ? "bg-white shadow-sm"
                  : "text-[#5b6b8c] hover:text-[#14213d]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        <ul className="mt-4 space-y-2">
          {visible.map((t) => (
            <li
              key={t._id}
              className="group flex items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-[0_4px_16px_-10px_rgba(20,33,61,0.3)]"
            >
              <button
                onClick={() => !t.done && completeTodo(t._id)}
                disabled={t.done}
                aria-label={t.done ? "Completed" : "Mark as done"}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  t.done
                    ? "border-[#3a5bff] bg-[#3a5bff] text-white"
                    : "border-[#b7c3dc] hover:border-[#3a5bff]"
                }`}
              >
                {t.done && (
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 10.5l4 4 8-9" />
                  </svg>
                )}
              </button>

              {editingId === t._id ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => saveEdit(t._id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(t._id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  aria-label="Edit task"
                  className="min-w-0 flex-1 rounded-md bg-[#eef2fb] px-2 py-1 outline-none ring-2 ring-[#3a5bff]"
                />
              ) : (
                <span
                  className={`min-w-0 flex-1 break-words ${
                    t.done ? "text-[#9aa6bf] line-through" : ""
                  }`}
                >
                  {t.task}
                </span>
              )}

              <div className="flex shrink-0 gap-1 sm:opacity-0 sm:transition sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                {!t.done && editingId !== t._id && (
                  <button
                    onClick={() => {
                      setEditingId(t._id);
                      setDraft(t.task);
                    }}
                    aria-label="Edit task"
                    className="rounded-lg p-2 text-[#5b6b8c] hover:bg-[#eef2fb] hover:text-[#3a5bff]"
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13.5 3.5l3 3L7 16H4v-3L13.5 3.5z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => removeTodo(t._id)}
                  aria-label="Delete task"
                  className="rounded-lg p-2 text-[#5b6b8c] hover:bg-[#fdecec] hover:text-[#c0392b]"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>

        {!loading && visible.length === 0 && !error && (
          <p className="mt-10 text-center text-[#5b6b8c]">
            {todos.length === 0
              ? "No tasks yet. Add your first one above."
              : `No ${filter.toLowerCase()} tasks.`}
          </p>
        )}
      </div>
    </main>
  );
}