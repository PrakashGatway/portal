import React, { useMemo } from "react";

interface WritingEditorProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    rows?: number;
    disabled?: boolean;
    minWords?: number;
    maxWords?: number;
    className?: string;
}

export default function WritingEditor({
    value,
    onChange,
    placeholder = "Write your response...",
    rows = 8,
    disabled = false,
    minWords,
    maxWords,
    className = "",
}: WritingEditorProps) {
    const wordCount = useMemo(() => {
        return value.trim().length === 0
            ? 0
            : value.trim().split(/\s+/).length;
    }, [value]);

    const charCount = value.length;

    const countColor = useMemo(() => {
        if (minWords && wordCount < minWords) return "text-red-600";
        if (maxWords && wordCount > maxWords) return "text-red-600";
        return "text-green-600";
    }, [wordCount, minWords, maxWords]);

    return (
        <div className="space-y-0 mt-2">
            <div className="flex items-center justify-between text-sm py-2 ">
                <span className="text-slate-500">
                    Characters: <strong>{charCount}</strong>
                </span>

                <span className={countColor}>
                    Words: <strong>{wordCount}</strong>

                    {minWords && (
                        <span className="text-slate-500">
                            {" "}
                            / Min {minWords}
                        </span>
                    )}

                    {maxWords && (
                        <span className="text-slate-500">
                            {" "}
                            / Max {maxWords}
                        </span>
                    )}
                </span>
            </div>
            <textarea
                value={value}
                onChange={onChange}
                rows={rows}
                disabled={disabled}
                placeholder={placeholder}
                className={`w-full rounded-lg border border-slate-300 dark:border-slate-600
        px-3 outline-none text-base resize-none
        ring-1 ring-indigo-500
        dark:bg-slate-800 dark:text-white ${className}`}
            />
        </div>
    );
}