import React, { useState, useRef, useEffect } from 'react';
import { API_URL } from "../config";

function ChatView({ datasetId }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || !datasetId) return;

        const userMsg = { role: 'user', content: input };
        const updatedMessages = [...messages, userMsg];

        setMessages(updatedMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dataset_id: datasetId,
                    query: input,
                    // Pass history so backend has conversational context.
                    // Content can be a string (user) or {answer, table} (assistant).
                    // Backend's format_history() handles both shapes.
                    history: updatedMessages,
                }),
            });

            if (!res.ok) throw new Error(`Server responded with ${res.status}`);

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data }]);

        } catch (err) {
            console.error("Chat error:", err);
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: { answer: 'Failed to connect to chat server.', table: null } }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">

            {/* CHAT AREA */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                        {datasetId ? "Ask anything about your dataset..." : "Upload a dataset first to start chatting."}
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'user' ? (
                            <div className="text-white bg-blue-600/50 px-4 py-2 rounded-2xl max-w-[80%]">
                                {msg.content}
                            </div>
                        ) : (
                            <div className="text-slate-200 bg-white/5 px-4 py-3 rounded-2xl max-w-[90%] border border-white/10 space-y-3">
                                <BotMessage content={msg.content} />
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl text-slate-400 text-sm animate-pulse">
                            Thinking...
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* INPUT */}
            <div className="p-4 flex gap-3 border-t border-white/10 bg-[#0b0f19]">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder={datasetId ? "Ask about your data..." : "Please upload a dataset first..."}
                    disabled={!datasetId || loading}
                    className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                    onClick={sendMessage}
                    disabled={loading || !datasetId || !input.trim()}
                    className="px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? '...' : 'Send'}
                </button>
            </div>
        </div>
    );
}

function BotMessage({ content }) {
    if (content?.error && !content?.answer) {
        return <p className="text-red-400 font-medium">⚠️ {content.error}</p>;
    }

    const { answer, table, error } = content;

    return (
        <>
            <p className="leading-relaxed whitespace-pre-wrap">{answer}</p>

            {table && table.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-white/10 mt-2">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white/5 text-slate-300 uppercase text-xs">
                            <tr>
                                {Object.keys(table[0]).map((key) => (
                                    <th key={key} className="px-4 py-3 border-b border-white/10 whitespace-nowrap">{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {table.map((row, i) => (
                                <tr key={i} className="hover:bg-white/5">
                                    {Object.values(row).map((val, j) => (
                                        <td key={j} className="px-4 py-2 whitespace-nowrap">
                                        {typeof val === "object" && val !== null ? (
                                            <div className="space-y-1">
                                            {Object.entries(val).map(([k, v]) => (
                                                <div key={k}>
                                                <span className="text-slate-400">{k}:</span> {v}
                                                </div>
                                            ))}
                                            </div>
                                        ) : (
                                            val ?? '—'
                                        )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {error && (
                <p className="text-red-400 text-xs mt-1">⚠️ Table could not be generated: {error}</p>
            )}
        </>
    );
}

export default ChatView;