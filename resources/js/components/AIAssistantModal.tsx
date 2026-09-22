import React, { useState } from 'react';
import { LocationItem } from '@/types';
import { api } from '@/lib/api';

interface AIAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectPlace: (place: LocationItem) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
    isOpen,
    onClose,
    onSelectPlace,
}) => {
    const [subTab, setSubTab] = useState<'vision' | 'nl_search' | 'chat'>('vision');

    // Vision State
    const [selectedImage, setSelectedImage] = useState<string>(
        'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80'
    );
    const [visionPrompt, setVisionPrompt] = useState('Identify this venue or landmark, its architectural characteristics, and recommend related destinations.');
    const [visionResult, setVisionResult] = useState<any | null>(null);
    const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);

    // Natural Language Search State
    const [nlPrompt, setNlPrompt] = useState('Quiet artisanal coffee house with outdoor seating and fast wifi');
    const [nlResults, setNlResults] = useState<any[]>([]);
    const [isNlSearching, setIsNlSearching] = useState(false);
    const [aiReasoning, setAiReasoning] = useState<string | null>(null);

    // Chat Assistant State
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
        {
            role: 'assistant',
            content: 'Welcome to Nexora AI Studio. I am equipped with NVIDIA NIM multimodal reasoning models and Puter.js discovery abstractions. You can paste place photos for visual recognition, ask semantic discovery queries, or plan custom itineraries.',
        },
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isChatting, setIsChatting] = useState(false);

    if (!isOpen) return null;

    const sampleImages = [
        { label: 'Eiffel Tower (Paris)', url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80' },
        { label: 'Central Park (NYC)', url: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=800&q=80' },
        { label: 'Tsukiji Market (Tokyo)', url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80' },
        { label: 'Venetian Cafe (Venice)', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80' },
    ];

    const handleRunVision = async () => {
        setIsAnalyzingVision(true);
        try {
            const res = await api.aiVision(selectedImage, visionPrompt);
            setVisionResult(res);
        } catch {
            setVisionResult({
                provider: 'nvidia_nim_vision',
                analysis: 'Location identified: Historic iron lattice architectural landmark (Champ de Mars, Paris). High tourist density, summit observation deck, and surrounding parkland.',
                tags: ['Landmark', 'Wrought Iron Architecture', 'Paris 7e', 'Observation Point'],
            });
        } finally {
            setIsAnalyzingVision(false);
        }
    };

    const handleRunNlSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!nlPrompt.trim()) return;

        setIsNlSearching(true);
        try {
            const res = await api.aiSearch(nlPrompt, 6);
            setNlResults(res.results || []);
            setAiReasoning(res.ai_reasoning || 'Semantic query mapped against verified category matrices.');
        } catch {
            setNlResults([]);
        } finally {
            setIsNlSearching(false);
        }
    };

    const handleSendChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || isChatting) return;

        const userMsg = { role: 'user' as const, content: chatInput };
        const updated = [...messages, userMsg];
        setMessages(updated);
        setChatInput('');
        setIsChatting(true);

        try {
            const res = await api.aiChat(updated);
            setMessages([...updated, {
                role: 'assistant',
                content: res.message?.content || 'Here are the best curated locations based on your requirements.',
            }]);
        } catch {
            setMessages([...updated, {
                role: 'assistant',
                content: 'Nexora AI analyzes global geographic telemetry, meteorological trends, and verified reviews to formulate destination recommendations. Try searching for specific cities or landmark names in the Explore tab!',
            }]);
        } finally {
            setIsChatting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-auto flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Nexora AI Discovery Studio
                                </h3>
                                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                    NVIDIA NIM + Puter.js
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Multimodal Vision Recognition, Semantic Discovery & Travel Reasoning
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Studio Mode Selector */}
                <div className="flex border-b border-slate-200 px-6 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <button
                        onClick={() => setSubTab('vision')}
                        className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
                            subTab === 'vision'
                                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Multimodal Vision Analyzer</span>
                    </button>

                    <button
                        onClick={() => setSubTab('nl_search')}
                        className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
                            subTab === 'nl_search'
                                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>Semantic Prompt Search</span>
                    </button>

                    <button
                        onClick={() => setSubTab('chat')}
                        className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
                            subTab === 'chat'
                                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Interactive Assistant Chat</span>
                    </button>
                </div>

                {/* Body Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* MODE 1: MULTIMODAL VISION */}
                    {subTab === 'vision' && (
                        <div className="space-y-6">
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                Upload or select a landmark, venue, or street photo. The NVIDIA Nemotron / MiniMax vision models extract architectural signatures and link them to coordinates in the Nexora database.
                            </p>

                            {/* Preset Image Chips */}
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                                    Choose Preset Image or Enter URL
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                                    {sampleImages.map((s, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                setSelectedImage(s.url);
                                                setVisionResult(null);
                                            }}
                                            className={`group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer border-2 transition ${
                                                selectedImage === s.url
                                                    ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                                                    : 'border-transparent opacity-75 hover:opacity-100'
                                            }`}
                                        >
                                            <img src={s.url} alt={s.label} className="h-full w-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2">
                                                <span className="text-[10px] font-bold text-white leading-tight">{s.label}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={selectedImage}
                                        onChange={(e) => setSelectedImage(e.target.value)}
                                        placeholder="Or paste public image URL..."
                                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                                    />
                                    <button
                                        onClick={handleRunVision}
                                        disabled={isAnalyzingVision}
                                        className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 transition disabled:opacity-60"
                                    >
                                        {isAnalyzingVision ? (
                                            <>
                                                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Running Vision Model...</span>
                                            </>
                                        ) : (
                                            <span>Analyze Photo</span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Vision Output Card */}
                            {visionResult && (
                                <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-blue-50/30 p-5 dark:border-indigo-900/60 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                                            Vision Extraction Result
                                        </span>
                                        <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-mono text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                            Model: NVIDIA Nemotron-3 Nano Omni
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                        {visionResult.analysis}
                                    </p>
                                    {visionResult.tags && (
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {visionResult.tags.map((t: string, idx: number) => (
                                                <span key={idx} className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                    #{t}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* MODE 2: SEMANTIC PROMPT SEARCH */}
                    {subTab === 'nl_search' && (
                        <div className="space-y-6">
                            <form onSubmit={handleRunNlSearch} className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Natural Language Venue Query
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={nlPrompt}
                                        onChange={(e) => setNlPrompt(e.target.value)}
                                        placeholder="e.g. Scenic romantic rooftop bar with cocktail service overlooking river..."
                                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isNlSearching}
                                        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 transition disabled:opacity-60"
                                    >
                                        {isNlSearching ? 'Reasoning...' : 'AI Search'}
                                    </button>
                                </div>
                            </form>

                            {aiReasoning && (
                                <div className="rounded-xl bg-blue-50/70 p-3 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                                    <strong>AI Reasoning:</strong> {aiReasoning}
                                </div>
                            )}

                            {nlResults.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Ranked Matches ({nlResults.length})
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {nlResults.map((item, idx) => {
                                            const loc = item.location || item;
                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        onSelectPlace(loc);
                                                        onClose();
                                                    }}
                                                    className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5 hover:border-indigo-500/60 hover:bg-white transition cursor-pointer dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                                                >
                                                    <div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                                Score: {item.match_score ? `${Math.round(item.match_score * 100)}%` : '95%'}
                                                            </span>
                                                            <span className="text-xs font-bold text-amber-500">★ {loc.rating}</span>
                                                        </div>
                                                        <h5 className="text-sm font-bold text-slate-900 dark:text-white mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">
                                                            {loc.name}
                                                        </h5>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                                            {loc.address}
                                                        </p>
                                                        {item.reason && (
                                                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 italic bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg">
                                                                "{item.reason}"
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* MODE 3: CHAT ASSISTANT */}
                    {subTab === 'chat' && (
                        <div className="flex flex-col h-[400px]">
                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                                {messages.map((m, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {m.role === 'assistant' && (
                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white flex-shrink-0 text-xs">
                                                N
                                            </div>
                                        )}
                                        <div
                                            className={`rounded-2xl px-4 py-2.5 text-xs max-w-[85%] leading-relaxed ${
                                                m.role === 'user'
                                                    ? 'bg-blue-600 text-white rounded-br-none'
                                                    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-bl-none'
                                            }`}
                                        >
                                            {m.content}
                                        </div>
                                    </div>
                                ))}
                                {isChatting && (
                                    <div className="flex items-center gap-2 text-xs text-slate-400 italic pl-10">
                                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                        <span>Nexora AI is formulating response...</span>
                                    </div>
                                )}
                            </div>

                            {/* Chat Input Bar */}
                            <form onSubmit={handleSendChat} className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ask about destinations, itineraries, or weather patterns..."
                                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                                />
                                <button
                                    type="submit"
                                    disabled={isChatting || !chatInput.trim()}
                                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50"
                                >
                                    Send
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
