import React, { useEffect, useState } from 'react';
import FriendList from './FriendList';
import ResponseRecorder from './ResponseRecorder';

export default function PromptWorkflow() {
  const [promptId, setPromptId] = useState(() => {
    return new URLSearchParams(window.location.search).get('prompt') || '';
  });


  return (
    <div>
      <FriendList />
      {promptId && (
        <div className="mt-6">
          <ResponseRecorder promptId={promptId} />
        </div>
      )}
    </div>
  );
}
