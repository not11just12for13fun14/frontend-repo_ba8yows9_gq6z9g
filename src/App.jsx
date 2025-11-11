import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "";

function formatDate(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  return d.toLocaleString();
}

function Badge({ children, color = "blue" }) {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    gray: "bg-gray-100 text-gray-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    purple: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded ${colors[color] || colors.gray}`}>{children}</span>
  );
}

function EventCard({ ev }) {
  const now = new Date();
  const regStart = new Date(ev.registration_start);
  const regEnd = new Date(ev.registration_end);
  const status = regStart <= now && now <= regEnd ? "open" : regStart > now ? "upcoming" : "closed";
  return (
    <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
      <div className="flex gap-4">
        {ev.poster_url ? (
          <img src={ev.poster_url} alt={ev.title} className="w-28 h-28 object-cover rounded" />
        ) : (
          <div className="w-28 h-28 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">No Poster</div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg truncate">{ev.title}</h3>
            <Badge color="purple">{ev.category}</Badge>
            {ev.is_org_verified && <Badge color="green">Verified Org</Badge>}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{ev.description}</p>
          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            <Badge color={status === "open" ? "green" : status === "upcoming" ? "amber" : "gray"}>
              {status === "open" ? "Registration Open" : status === "upcoming" ? "Opens Soon" : "Closed"}
            </Badge>
            <span>Event: {formatDate(ev.event_start)}{ev.event_end ? ` → ${formatDate(ev.event_end)}` : ""}</span>
            <span>Venue: {ev.venue}</span>
          </div>
          <div className="mt-3 flex gap-2">
            {ev.google_form_url && status !== "closed" && (
              <a href={ev.google_form_url} target="_blank" className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">Register</a>
            )}
            {ev.poster_url && (
              <a href={ev.poster_url} target="_blank" className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50">View Poster</a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <div className="grid gap-3">
        {items.map((ev) => (
          <EventCard key={ev.id} ev={ev} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState({ open: [], upcoming: [], closed: [], count: 0 });
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const filterByQuery = (arr) =>
      arr.filter(
        (e) =>
          e.title.toLowerCase().includes(query.toLowerCase()) ||
          e.description.toLowerCase().includes(query.toLowerCase()) ||
          e.venue.toLowerCase().includes(query.toLowerCase())
      );
    return {
      open: filterByQuery(data.open),
      upcoming: filterByQuery(data.upcoming),
      closed: filterByQuery(data.closed),
    };
  }, [data, query]);

  async function loadCategories() {
    try {
      const res = await fetch(`${API_BASE}/events/categories`);
      const json = await res.json();
      setCategories(json || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadEvents() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      params.set("sort", "time");
      const res = await fetch(`${API_BASE}/events?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="font-bold text-lg">Event Explorer</div>
          <div className="flex-1" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, venues..."
            className="w-64 max-w-[50vw] px-3 py-1.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded border border-gray-300"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {loading ? (
          <div className="text-gray-500">Loading events...</div>
        ) : (
          <>
            <Section title="Registration Open" items={filtered.open} />
            <Section title="Opening Soon" items={filtered.upcoming} />
            <Section title="Closed" items={filtered.closed} />
          </>
        )}
      </main>

      <footer className="py-8 text-center text-sm text-gray-500">
        Built with love for communities • {new Date().getFullYear()}
      </footer>
    </div>
  );
}
