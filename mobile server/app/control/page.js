'use client';

import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useRouter, useSearchParams } from 'next/navigation';
import BibleControl from './BibleControl';
import HymnControl from './HymnControl';

let socket;

export default function ControlPage() {
  const [view, setView] = useState('bible'); // 'bible' or 'hymn'
  const [currentApiKey, setCurrentApiKey] = useState(null);
  const [overlayConnected, setOverlayConnected] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const apiKeyFromUrl = searchParams.get('key');

    if (!apiKeyFromUrl) {
      console.error('API Key not found in URL, redirecting to home.');
      router.push('/');
      return;
    }

    setCurrentApiKey(apiKeyFromUrl);

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || window.location.origin;
    socket = io(serverUrl, {
      query: { apiKey: apiKeyFromUrl, type: 'mobile' },
      transports: ['websocket'],
    });

    socket.on('connect', () => console.log('Connected to socket.io server'));
    socket.on('disconnect', () => {
      console.log('Disconnected from socket.io server');
      setOverlayConnected(false); // Reset overlay status on disconnect
    });
    socket.on('overlayConnected', () => {
      console.log('Overlay connected!');
      setOverlayConnected(true);
    });
    socket.on('overlayDisconnected', () => {
      console.log('Overlay disconnected!');
      setOverlayConnected(false);
    });
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [router, searchParams]);

  return (
    <div className='p-4 bg-background text-text min-h-screen'>
      <div className='mb-4'>
        <h2 className='text-xl font-semibold text-accent'>API Key:</h2>
        <p className='text-text break-all'>{currentApiKey || 'Loading...'}</p>
        <p className={`text-sm font-medium ${overlayConnected ? 'text-green-500' : 'text-red-500'}`}>
          Overlay Status: {overlayConnected ? 'Connected' : 'Disconnected'}
        </p>
      </div>

      <div className='flex space-x-4 mb-4'>
        <button
          onClick={() => setView('bible')}
          className={`px-4 py-2 rounded-md ${view === 'bible' ? 'bg-primary text-white' : 'bg-secondary text-text'}`}>
          Bible Control
        </button>
        <button
          onClick={() => setView('hymn')}
          className={`px-4 py-2 rounded-md ${view === 'hymn' ? 'bg-primary text-white' : 'bg-secondary text-text'}`}>
          Hymn Control
        </button>
      </div>

      {currentApiKey && (view === 'bible' ? <BibleControl socket={socket} apiKey={currentApiKey} overlayConnected={overlayConnected} /> : <HymnControl socket={socket} apiKey={currentApiKey} overlayConnected={overlayConnected} />)}
    </div>
  );
}
