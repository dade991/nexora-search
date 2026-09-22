import React from 'react';
import { SearchHistoryItem } from '@/types';

interface SearchHistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    history: SearchHistoryItem[];
    onSelectQuery: (query: string) => void;
    onClearHistory: () => void;
}

export const SearchHistoryDrawer: React.FC<SearchHistoryDrawerProps> = ({
    isOpen,
    onClose,
    history,
    onSelectQuery,
    onClearHistory,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            Search History ({history.length})
                        </h3>
                    </div>

                    <div className="flex items-center gap-2">
                        {history.length > 0 && (
                            <button
                                onClick={onClearHistory}
                                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                            >
                                Clear All
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 mb-3">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">No search history</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                                Searches executed via the command bar will be cataloged here for instant replay.
                            </p>
                        </div>
                    ) : (
                        history.map((item, idx) => (
                            <div
                                key={item.id || idx}
                                onClick={() => {
                                    onSelectQuery(item.query);
                                    onClose();
                                }}
                                className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-3 hover:bg-blue-50 hover:border-blue-400/40 transition cursor-pointer dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                            >
                                <div className="flex items-center gap-3">
                                    <svg className="h-4 w-4 text-slate-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                        {item.query}
                                    </span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400">
                                    Replay ↵
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
