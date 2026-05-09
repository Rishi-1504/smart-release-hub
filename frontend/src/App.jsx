import React, { useState } from 'react';
import { Rocket, FileText, CheckCircle } from 'lucide-react';
import axios from 'axios';

function App() {
  const [activeTab, setActiveTab] = useState('technical');
  const [content, setContent] = useState('Click a tab to generate notes...');

  const fetchNotes = async (type) => {
    setContent('AI is generating notes...');
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/generate-notes?variant=${type}`);
      setContent(response.data.content);
    } catch (error) {
      setContent('Error: Make sure the Python backend is running!');
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Smart Release Intelligence Hub</h1>
      <div className="flex gap-4 mb-4">
        <button onClick={() => { setActiveTab('technical'); fetchNotes('technical'); }} className="p-2 bg-blue-500 text-white rounded">Technical</button>
        <button onClick={() => { setActiveTab('qa'); fetchNotes('qa'); }} className="p-2 bg-green-500 text-white rounded">QA Summary</button>
        <button onClick={() => { setActiveTab('executive'); fetchNotes('executive'); }} className="p-2 bg-purple-500 text-white rounded">Executive</button>
      </div>
      <div className="p-6 bg-white border rounded shadow">
        <h2 className="font-bold uppercase mb-2 text-gray-500">{activeTab} View</h2>
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

export default App;