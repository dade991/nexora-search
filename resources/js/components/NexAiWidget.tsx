import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, Key, History, Compass, MessageSquare, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { SearchHistoryItem } from '@/types';
import { api } from '@/lib/api';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    provider?: string;
}

interface NexAiWidgetProps {
    searchHistory?: SearchHistoryItem[];
    onSelectSuggestion?: (query: string) => void;
}

export const NexAiWidget: React.FC<NexAiWidgetProps> = ({
    searchHistory = [],
    onSelectSuggestion,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'suggestions' | 'settings'>('chat');
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [nvidiaKey, setNvidiaKey] = useState('');
    const [keySaved, setKeySaved] = useState(false);
    
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hello! I'm Nex AI, your site assistant. I can log your search activity, suggest relevant locations, or answer questions about any destination. How can I help you today?",
            timestamp: new Date(),
            provider: 'nexora_ai_engine',
        },
    ]);

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedKey = localStorage.getItem('nexora_nvidia_api_key');
        if (savedKey) {
            setNvidiaKey(savedKey);
        }
    }, []);

    useEffect(() => {
        if (isOpen && activeTab === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, activeTab]);

    const handleSaveKey = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('nexora_nvidia_api_key', nvidiaKey.trim());
        setKeySaved(true);
        setTimeout(() => setKeySaved(false), 3000);
    };

    const handleSendMessage = async (textToSend?: string) => {
        const query = textToSend || inputMessage;
        if (!query.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: query.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        if (!textToSend) setInputMessage('');
        setIsLoading(true);

        try {
            const apiHistory = messages
                .filter((m) => m.id !== '1')
                .map((m) => ({ role: m.role, content: m.content }));
            
            apiHistory.push({ role: 'user', content: query.trim() });

            const payload: any = {
                messages: apiHistory,
            };

            if (nvidiaKey.trim()) {
                payload.api_key = nvidiaKey.trim();
            }

            const res = await api.post('/ai/chat', payload);
            const data = res.data;

            const assistantContent = data.message?.content || "I'm processing your request across Nexora's location database.";
            
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: assistantContent,
                    timestamp: new Date(),
                    provider: data.provider || 'nexora_ai_engine',
                },
            ]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: "I'm processing your site navigation query. Enter an NVIDIA API Key in Settings for powered response.",
                    timestamp: new Date(),
                    provider: 'nexora_fallback',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const recentQueries = searchHistory.slice(0, 5);

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 h-[500px] bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4">
                    {/* Header */}
                    <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                            <div className="relative">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-slate-100 flex items-center space-x-1">
                                    <span>Nex AI</span>
                                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono">Agent</span>
                                </h3>
                                <p className="text-[11px] text-slate-400">Site Assistant & Search Intelligence</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => setActiveTab(activeTab === 'settings' ? 'chat' : 'settings')}
                                className={`p-1.5 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                                title="NVIDIA API Settings"
                            >
                                <Key className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-slate-800 bg-slate-900/60 px-2 py-1 text-xs">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`flex-1 py-1.5 rounded-md flex items-center justify-center space-x-1.5 font-medium transition-colors ${
                                activeTab === 'chat' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Chat</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('suggestions')}
                            className={`flex-1 py-1.5 rounded-md flex items-center justify-center space-x-1.5 font-medium transition-colors ${
                                activeTab === 'suggestions' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Compass className="w-3.5 h-3.5" />
                            <span>Suggestions ({recentQueries.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex-1 py-1.5 rounded-md flex items-center justify-center space-x-1.5 font-medium transition-colors ${
                                activeTab === 'settings' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Key className="w-3.5 h-3.5" />
                            <span>API Key</span>
                        </button>
                    </div>

                    {/* Tab Content: Chat */}
                    {activeTab === 'chat' && (
                        <>
                            <div className="flex-1 p-3 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                    >
                                        <div
                                            className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                                                msg.role === 'user'
                                                    ? 'bg-cyan-600 text-white rounded-br-none shadow-md shadow-cyan-600/10'
                                                    : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-bl-none'
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                        {msg.provider && (
                                            <span className="text-[10px] text-slate-500 mt-1 px-1 font-mono">
                                                {msg.provider === 'nvidia_nim' ? '⚡ NVIDIA NIM' : '🤖 Nex Engine'}
                                            </span>
                                        )}
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex items-center space-x-2 bg-slate-800/60 text-slate-400 p-2.5 rounded-xl border border-slate-700/50 w-fit text-xs">
                                        <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                                        <span>Nex AI is thinking...</span>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            <div className="px-3 py-1.5 bg-slate-900/80 border-t border-slate-800 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
                                <button
                                    onClick={() => handleSendMessage("Suggest top places to visit")}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-full whitespace-nowrap border border-slate-700/60 transition-colors"
                                >
                                    ✨ Suggest Places
                                </button>
                                <button
                                    onClick={() => handleSendMessage("What can I search on Nexora?")}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full whitespace-nowrap border border-slate-700/60 transition-colors"
                                >
                                    🔍 Search Help
                                </button>
                            </div>

                            <div className="p-3 bg-slate-800/90 border-t border-slate-700/80">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }}
                                    className="flex items-center space-x-2"
                                >
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        placeholder="Ask Nex AI about places or search..."
                                        className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition-colors"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!inputMessage.trim() || isLoading}
                                        className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white transition-colors flex items-center justify-center shadow-md shadow-cyan-600/20"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}

                    {activeTab === 'suggestions' && (
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            <div>
                                <h4 className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5 mb-2">
                                    <History className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>Logged Search Activity</span>
                                </h4>
                                {recentQueries.length === 0 ? (
                                    <p className="text-xs text-slate-500 italic bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                                        No recent searches recorded yet. Try searching above!
                                    </p>
                                ) : (
                                    <div className="space-y-1.5">
                                        {recentQueries.map((item, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    if (onSelectSuggestion) onSelectSuggestion(item.query);
                                                    setIsOpen(false);
                                                }}
                                                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 flex items-center justify-between cursor-pointer transition-colors text-xs"
                                            >
                                                <span className="font-medium text-slate-200">{item.query}</span>
                                                <span className="text-[10px] text-cyan-400 font-mono">
                                                    {item.resultCount ?? 0} results
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5 mb-2">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Site Recommendations</span>
                                </h4>
                                <div className="space-y-2 text-xs">
                                    <div
                                        onClick={() => {
                                            if (onSelectSuggestion) onSelectSuggestion('Singapore');
                                            setIsOpen(false);
                                        }}
                                        className="p-3 bg-gradient-to-r from-cyan-950/40 to-slate-800 border border-cyan-500/20 hover:border-cyan-500/50 rounded-xl cursor-pointer transition-all"
                                    >
                                        <p className="font-semibold text-cyan-300">🇸🇬 Explore Singapore Landmarks</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Marina Bay Sands, Gardens by the Bay & SkyPark</p>
                                    </div>
                                    <div
                                        onClick={() => {
                                            if (onSelectSuggestion) onSelectSuggestion('Tokyo Cafe');
                                            setIsOpen(false);
                                        }}
                                        className="p-3 bg-gradient-to-r from-purple-950/40 to-slate-800 border border-purple-500/20 hover:border-purple-500/50 rounded-xl cursor-pointer transition-all"
                                    >
                                        <p className="font-semibold text-purple-300">☕ Discover Tokyo Coffee Shops</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Artisanal cafes and hidden spots in Shibuya</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
                                <h4 className="font-semibold text-slate-200 flex items-center space-x-1.5 mb-1 text-xs">
                                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                                    <span>NVIDIA NIM API Configuration</span>
                                </h4>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Nex AI uses NVIDIA NIM endpoints (<code className="text-cyan-300 font-mono">https://integrate.api.nvidia.com/v1</code>). Enter your API key below or set <code className="text-cyan-300 font-mono">NVIDIA_API_KEY</code> in <code className="text-cyan-300 font-mono">.env</code>.
                                </p>
                            </div>

                            <form onSubmit={handleSaveKey} className="space-y-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                                        NVIDIA API Key
                                    </label>
                                    <input
                                        type="password"
                                        value={nvidiaKey}
                                        onChange={(e) => setNvidiaKey(e.target.value)}
                                        placeholder="nvapi-..."
                                        className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 outline-none font-mono"
                                    />
                                </div>

                                {keySaved && (
                                    <div className="flex items-center space-x-1.5 text-emerald-400 text-xs bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>API Key saved successfully!</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl transition-colors shadow-md shadow-cyan-600/20"
                                >
                                    Save Key to Browser
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 hover:from-cyan-900 hover:to-slate-800 text-white rounded-full shadow-2xl border border-cyan-500/40 hover:border-cyan-400 transition-all duration-300 transform hover:scale-105"
                >
                    <div className="relative">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse"></span>
                    </div>
                    <span className="font-semibold text-xs tracking-wide pr-1">Nex AI</span>
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 opacity-80 group-hover:opacity-100 group-hover:rotate-12 transition-all" />
                </button>
            )}
        </div>
    );
};
