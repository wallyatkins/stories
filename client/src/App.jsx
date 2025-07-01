import React, { useState } from 'react';
import PromptRecorder from './components/PromptRecorder';
import ResponseRecorder from './components/ResponseRecorder';

export default function App() {
  const [promptId, setPromptId] = useState('');
  const [recordingPrompt, setRecordingPrompt] = useState(false);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Video Stories</h1>
      {recordingPrompt ? (
        <PromptRecorder onFinish={(id) => { setPromptId(id); setRecordingPrompt(false); }} />
      ) : (
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => setRecordingPrompt(true)}>Record Prompt</button>
      )}
      {promptId && (
        <div className="mt-6">
          <ResponseRecorder promptId={promptId} />
        </div>
      )}
    </div>
  );
}
