
import React, { useState } from 'react';
import OpenAI from 'openai';
import ReactMarkdown from 'react-markdown';

const client = new OpenAI({
  baseURL: 'https://api.scaleway.ai/86c7c7a3-86f0-4c94-a060-cc35a156bd3f/v1',
  apiKey: import.meta.env.VITE_SCW_API_KEY,
  dangerouslyAllowBrowser: true
});

const availableModels = [
  'llama-3.3-70b-instruct',
  'gemma-3-27b-it',
  'deepseek-r1-distill-llama-70b',
  'mistral-small-3.1-24b-instruct-2503',
  'mistral-nemo-instruct-2407',
  'pixtral-12b-2409',
  'qwen2.5-coder-32b-instruct'
];

export default function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemma-3-27b-it');
  const [maxTokens, setMaxTokens] = useState(512);
  const [temperature, setTemperature] = useState(0.8);
  const [topP, setTopP] = useState(0.7);
  const [presencePenalty, setPresencePenalty] = useState(0);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const systemMessage = { role: 'system', content: 'You are a helpful assistant' };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const stream = await client.chat.completions.create({
        model: selectedModel,
        messages: [systemMessage, userMessage],
        max_tokens: maxTokens,
        temperature: temperature,
        top_p: topP,
        presence_penalty: presencePenalty,
        stream: true
      });

      let assistantReply = '';
      for await (const chunk of stream) {
        assistantReply += chunk.choices[0]?.delta?.content || '';
        setMessages(current => [
          ...current.filter(m => m.role !== 'assistant'),
          { role: 'assistant', content: assistantReply }
        ]);
      }
    } catch (error) {
      console.error('Streaming API error:', error);
      setMessages(current => [...current, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 w-full max-w-4xl mx-auto">
      <div className="mb-4 space-y-4">
        <div>
          <label className="mr-2 font-medium">Model:</label>
          <select
            className="border px-2 py-1 rounded"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {availableModels.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block font-medium">Max tokens</label>
            <input type="number" className="w-full border px-2 py-1 rounded" value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))} />
          </div>
          <div>
            <label className="block font-medium">Temperature</label>
            <input type="number" min="0" max="1" step="0.01" className="w-full border px-2 py-1 rounded" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} />
          </div>
          <div>
            <label className="block font-medium">Top P</label>
            <input type="number" min="0" max="1" step="0.01" className="w-full border px-2 py-1 rounded" value={topP} onChange={(e) => setTopP(Number(e.target.value))} />
          </div>
          <div>
            <label className="block font-medium">Presence penalty</label>
            <input type="number" min="0" max="1" step="0.01" className="w-full border px-2 py-1 rounded" value={presencePenalty} onChange={(e) => setPresencePenalty(Number(e.target.value))} />
          </div>
        </div>
      </div>

      <div className="border resize rounded-lg p-4 min-h-[300px] max-h-[600px] overflow-y-auto bg-white shadow">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-3 py-2 rounded-lg max-w-full whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-400 text-sm">Waiting for response...</div>}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 p-2 border rounded"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
