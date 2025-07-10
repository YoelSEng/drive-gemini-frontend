// src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ==========================================================
// DEPLOYMENT CHANGE: Using the live backend URL from Render
// ==========================================================
const BACKEND_URL = 'https://drive-gemini-backend.onrender.com';

function App() {
    // --- "State" Variables ---
    const [items, setItems] = useState([]);
    const [currentFolder, setCurrentFolder] = useState({ id: null, name: 'Home' });
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- State for the Gemini Chat ---
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [isConsulting, setIsConsulting] = useState(false);

    // --- Data Fetching Effect ---
    useEffect(() => {
        const fetchFiles = async () => {
            setIsLoading(true);
            // ==========================================================
            // DEPLOYMENT CHANGE: Using the full BACKEND_URL
            // ==========================================================
            const url = currentFolder.id ? `${BACKEND_URL}/api/files/${currentFolder.id}` : `${BACKEND_URL}/api/files`;
            
            try {
                const response = await axios.get(url);
                setItems(response.data);
            } catch (error) {
                console.error("Error fetching files:", error);
                alert('Failed to fetch files from the live server.');
            }
            setIsLoading(false);
        };

        fetchFiles();
    }, [currentFolder]);

    // --- Event Handler Functions ---
    const handleFolderClick = (folder) => {
        setHistory([...history, currentFolder]);
        setCurrentFolder(folder);
        setAnswer('');
    };

    const handleBackClick = () => {
        const lastFolder = history[history.length - 1];
        setHistory(history.slice(0, -1));
        setCurrentFolder(lastFolder);
        setAnswer('');
    };

    const handleConsult = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        setIsConsulting(true);
        setAnswer('');

        try {
            // ==========================================================
            // DEPLOYMENT CHANGE: Using the full BACKEND_URL
            // ==========================================================
            const response = await axios.post(`${BACKEND_URL}/api/consult`, {
                folderId: currentFolder.id,
                question: question,
            });
            // Check if Gemini actually returned an answer
            if (response.data && response.data.answer) {
                 setAnswer(response.data.answer);
            } else {
                setAnswer('Gemini returned an empty response. The files might be empty or unreadable.');
            }
        } catch (error) {
            console.error("Error consulting Gemini:", error);
            setAnswer('Sorry, an error occurred while talking to Gemini. Please try again.');
        }
        setIsConsulting(false);
        setQuestion('');
    };

    // --- JSX: The HTML-like structure of our component ---
    return (
        <div className="App">
            <header>
                <h1>Drive Gemini Explorer</h1>
                <h2>Viewing Folder: {currentFolder.name}</h2>
                {history.length > 0 && (
                    <button onClick={handleBackClick} className="back-button">
                        ← Back
                    </button>
                )}
            </header>

            <main>
                {isLoading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="folder-grid">
                        {items.map((item) =>
                            item.mimeType === 'application/vnd.google-apps.folder' ? (
                                <div key={item.id} className="folder-card" onClick={() => handleFolderClick(item)}>
                                    <div className="card-icon">📁</div>
                                    <p>{item.name}</p>
                                </div>
                            ) : (
                                <div key={item.id} className="file-card">
                                    <div className="card-icon">📄</div>
                                    <p>{item.name}</p>
                                </div>
                            )
                        )}
                    </div>
                )}

                {currentFolder.id && !isLoading && (
                    <div className="chat-container">
                        <h3>Consult Gemini about this Folder's Files</h3>
                        <p>Ask a question about the files in the "{currentFolder.name}" folder.</p>
                        <div className="chat-box">
                            {isConsulting ? 'Thinking...' : (answer || "Ask a question below...")}
                        </div>
                        <form onSubmit={handleConsult} className="chat-input">
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="e.g., 'Summarize the main points from all documents'"
                                disabled={isConsulting}
                            />
                            <button type="submit" disabled={isConsulting}>
                                {isConsulting ? '...' : 'Ask'}
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;