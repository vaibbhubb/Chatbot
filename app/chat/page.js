"use client";

import { useState } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hey! I'm Vaibhav's AI clone. What's up?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });

      const data = await response.json();

      if (data.reply) {
        setMessages([...newMessages, { role: 'ai', content: data.reply }]);

        // Play the ElevenLabs audio reply if available
        if (data.audio) {
          const audioBlob = new Blob([Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))], { type: 'audio/mp3' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.play();
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 p-4 border-b border-gray-800 text-center shadow-md">
        <h1 className="text-xl font-bold">Chat with AI Vaibhav</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-sm' 
                : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-500 text-sm italic">AI is thinking and generating voice...</div>}
      </main>

      <footer className="p-4 bg-gray-900 border-t border-gray-800">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500 text-white transition-all"
          />
          <button 
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            {loading ? '...' : 'Send'}
          </button>
        </form>
      </footer>
    </div>
  );
}