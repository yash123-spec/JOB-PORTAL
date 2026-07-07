// src/Components/jobs/SearchAutocomplete.jsx
import { useState, useEffect, useRef } from "react";
import { Search, Briefcase, Building2 } from "lucide-react";
import { jobAPI } from "../../utils/api";

/**
 * Controlled search input with a live suggestions dropdown (job titles + companies).
 * Suggestions are fetched debounced from GET /jobs/suggestions.
 *
 * Props:
 *   value        — current input text (controlled)
 *   onChange     — (text) => void, fires on every keystroke
 *   onSelect     — (text) => void, fires when a suggestion is picked (optional)
 *   placeholder  — input placeholder
 *   inputClassName — styling for the input (so it matches each page)
 */
const SearchAutocomplete = ({
    value,
    onChange,
    onSelect,
    placeholder = "Search...",
    inputClassName = "w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30",
}) => {
    const [suggestions, setSuggestions] = useState([]);
    const [open, setOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const boxRef = useRef(null);
    // Ignore a pending fetch's result right after the user picks a suggestion
    const skipNextFetch = useRef(false);

    // Debounced suggestion fetch
    useEffect(() => {
        const q = (value || "").trim();
        if (skipNextFetch.current) {
            skipNextFetch.current = false;
            return;
        }
        if (q.length < 2) {
            setSuggestions([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const res = await jobAPI.getSuggestions(q);
                if (res.success) {
                    setSuggestions(res.data || []);
                    setActiveIdx(-1);
                }
            } catch {
                // silent — suggestions are non-critical
            }
        }, 250);
        return () => clearTimeout(timer);
    }, [value]);

    // Close the dropdown on any outside click
    useEffect(() => {
        const onDoc = (e) => {
            if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const pick = (s) => {
        skipNextFetch.current = true;
        onChange(s.value);
        onSelect?.(s.value);
        setSuggestions([]);
        setOpen(false);
        setActiveIdx(-1);
    };

    const handleKeyDown = (e) => {
        if (!open || suggestions.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && activeIdx >= 0) {
            e.preventDefault();
            pick(suggestions[activeIdx]);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    const showDropdown = open && suggestions.length > 0;

    return (
        <div ref={boxRef} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
                type="text"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => value && suggestions.length > 0 && setOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                role="combobox"
                aria-expanded={showDropdown}
                aria-autocomplete="list"
                className={inputClassName}
            />

            {showDropdown && (
                <ul
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-gray-100 bg-white py-1 shadow-lift"
                >
                    {suggestions.map((s, i) => (
                        <li
                            key={`${s.type}-${s.value}`}
                            role="option"
                            aria-selected={i === activeIdx}
                            onMouseDown={(e) => {
                                e.preventDefault(); // keep focus, prevent blur-close before pick
                                pick(s);
                            }}
                            onMouseEnter={() => setActiveIdx(i)}
                            className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm ${
                                i === activeIdx ? "bg-brand-light text-brand-dark" : "text-gray-700"
                            }`}
                        >
                            {s.type === "company" ? (
                                <Building2 size={15} className="flex-shrink-0 text-gray-400" />
                            ) : (
                                <Briefcase size={15} className="flex-shrink-0 text-gray-400" />
                            )}
                            <span className="flex-1 truncate">{s.value}</span>
                            <span className="text-[10px] uppercase tracking-wide text-gray-400">{s.type}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchAutocomplete;
