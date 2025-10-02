'use client';

import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import BibleControl from './BibleControl';
import HymnControl from './HymnControl';

let socket;

export default function ControlPage() {
  const [view, setView] = useState('bible'); // 'bible' or 'hymn'

  useEffect(() => {
    const socketInitializer = async () => {
      socket = io();
      socket.on('connect', () => console.log('Connected to socket.io server'));
      socket.on('disconnect', () => console.log('Disconnected from socket.io server'));
    };
    socketInitializer();

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  return (
    <div className='p-4 bg-background text-text min-h-screen'>
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

      {view === 'bible' ? <BibleControl socket={socket} /> : <HymnControl socket={socket} />}
    </div>
  );
}
