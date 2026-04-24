import React, { useState, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FileInput from './components/FileInput';
import PromptInput from './components/PromptInput';
import AnalysisOutput from './components/AnalysisOutput';
import { Zap, Loader2, AlertCircle } from 'lucide-react';
import ChatView from './components/ChatView';

const API_URL = "http://127.0.0.1:8000";
const POLL_INTERVAL_MS = 2000;

function App() {
    const [file, setFile] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeView, setActiveView] = useState("upload");
    const [isCancelling, setIsCancelling] = useState(false);
    const [error, setError] = useState(null);
    const [analysisData, setAnalysisData] = useState(null);
    const [datasetId, setDatasetId] = useState(null);

    const taskIdRef = useRef(null);
    const pollingRef = useRef(false);

    const stopPolling = () => { pollingRef.current = false; };

    const resetState = () => {
        setLoading(false);
        setIsCancelling(false);
        taskIdRef.current = null;
        pollingRef.current = false;
    };

    const handleUpload = async (selectedFile) => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append("file", selectedFile);

        const res = await fetch(`${API_URL}/upload`, {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        console.log("DATASET ID:", data.dataset_id);
        setDatasetId(data.dataset_id);
    };

    const handleAnalyze = useCallback(async () => {
        if (!datasetId) {
            alert("Upload a dataset first");
            return;
        }

        if (!prompt) {
            alert("Enter a prompt");
            return;
        }

        if (taskIdRef.current) {
            await fetch(`${API_URL}/cancel/${taskIdRef.current}`, { method: 'POST' }).catch(() => {});
        }

        stopPolling();
        setIsCancelling(false);
        setError(null);
        setAnalysisData(null);

        const formData = new FormData();
        formData.append('dataset_id', datasetId);
        formData.append('query', prompt);

        try {
            const startRes = await fetch(`${API_URL}/start-analysis`, {
                method: 'POST',
                body: formData,
            });

            if (!startRes.ok) throw new Error(await startRes.text());

            const { task_id } = await startRes.json();

            setLoading(true);
            taskIdRef.current = task_id;
            pollingRef.current = true;

            while (pollingRef.current) {
                await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
                if (!pollingRef.current) break;

                const statusRes = await fetch(`${API_URL}/status/${task_id}`);
                const result = await statusRes.json();

                if (["completed", "cancelled", "error"].includes(result.status)) {
                    stopPolling();

                    if (result.status === "completed") {
                        setAnalysisData(result.data);
                    }

                    if (result.status === "error") {
                        throw new Error(result.error);
                    }

                    break;
                }
            }

        } catch (err) {
            if (pollingRef.current) setError(err.message);
        } finally {
            resetState();
        }
    }, [datasetId, prompt]);

    const handleCancel = useCallback(() => {
        const taskId = taskIdRef.current;
        if (!taskId) return;

        setIsCancelling(true);
        stopPolling();

        fetch(`${API_URL}/cancel/${taskId}`, { method: 'POST' }).catch(() => {});
    }, []);

    return (
        <div className="flex min-h-screen bg-[#0b0f19] text-white">
            <Sidebar activeView={activeView} setActiveView={setActiveView} />

            <div className="flex-1 ml-[220px] flex flex-col min-h-screen">
                <Header />

                <main className="p-6 flex-1 flex flex-col">
                    <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">

                        {/* UPLOAD VIEW */}
                        {activeView === "upload" && (
                            <div className="flex justify-center items-center h-full">
                                <FileInput
                                    file={file}
                                    setFile={setFile}
                                    onUpload={handleUpload}
                                />
                                {datasetId && (
                                    <p className="text-green-400 mt-4">
                                        Dataset uploaded successfully
                                    </p>
                                )}
                            </div>
                        )}

                        {/* DASHBOARD VIEW */}
                        {activeView === "dashboard" && (
                            <>
                                <div className="grid grid-cols-1 gap-8 mb-10">
                                    <PromptInput prompt={prompt} setPrompt={setPrompt} />
                                </div>

                                <div className="flex justify-center mb-12 gap-4">

                                    {/* Execute */}
                                    <button
                                        onClick={handleAnalyze}
                                        className="btn-gradient px-12 py-5"
                                        disabled={!datasetId || loading}
                                    >
                                        {loading ? "Running..." : "Execute Analysis"}
                                    </button>

                                    {/* Stop */}
                                    {loading && (
                                        <button
                                            onClick={handleCancel}
                                            className="bg-red-600 px-8 py-5 rounded-xl hover:bg-red-500 transition"
                                        >
                                            Stop
                                        </button>
                                    )}

                                </div>

                                <AnalysisOutput data={analysisData} loading={loading} />
                            </>
                        )}

                        {/* CHAT VIEW */}
                        {activeView === "chat" && (
                            <ChatView datasetId={datasetId} />
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
}

export default App;