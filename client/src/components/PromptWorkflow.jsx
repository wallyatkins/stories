import React, { useEffect, useState } from 'react';
import FriendList from './FriendList';
import PromptRecorder from './PromptRecorder';
import ResponseRecorder from './ResponseRecorder';

export default function PromptWorkflow() {
  const [promptId, setPromptId] = useState(() => {
    return new URLSearchParams(window.location.search).get('prompt') || '';
  });
  const [targetFriend, setTargetFriend] = useState(null);

  return (
    <div>
      <FriendList onPrompt={(f) => setTargetFriend(f)} />
      {targetFriend && (
        <PromptRecorder
          friend={targetFriend}
          onFinish={(id) => {
            setPromptId(id);
            const url = new URL(window.location);
            url.searchParams.set('prompt', id);
            window.history.replaceState(null, '', url);
            setTargetFriend(null);
          }}
        />
      )}
      {promptId && (
        <div className="mt-6">
          <ResponseRecorder promptId={promptId} />
        </div>
      )}
    </div>
  );
}
