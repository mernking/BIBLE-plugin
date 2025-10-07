'use client';

import { useState, useEffect } from 'react';
import io from 'socket.io-client';

let socket;

export default function HymnControlPage() {
  const [hymns, setHymns] = useState([]);
  const [filteredHymns, setFilteredHymns] = useState([]);
  const [selectedHymn, setSelectedHymn] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [styles, setStyles] = useState({
    backgroundColor: 'transparent',
    fontSize: 32,
    fontFamily: 'Arial',
    textColor: '#000000',
    textAlign: 'center',
    backgroundImage: '',
    backgroundVideo: '',
    backgroundOpacity: 1,
    maxWidth: 800,
    justifyContent: 'center',
    alignItems: 'center',
  });

  useEffect(() => {
    const socketInitializer = async () => {
      socket = io();
      socket.on('connect', () => console.log('Connected to socket.io server'));
      socket.on('disconnect', () => console.log('Disconnected from socket.io server'));
    };
    socketInitializer();

    const fetchHymns = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/hymns');
        const data = await res.json();
        setHymns(data);
        setFilteredHymns(data);
      } catch (error) {
        console.error('Failed to fetch hymns:', error);
      }
      setLoading(false);
    };
    fetchHymns();

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const currentFilteredHymns = hymns.filter((hymn) =>
      hymn.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredHymns(currentFilteredHymns);
  }, [searchTerm, hymns]);

  const goLive = () => {
    if (socket && selectedHymn) {
      socket.emit('setHymn', { hymn: selectedHymn, styles });
    }
  };

  const clearHymn = () => {
    if (socket) {
      socket.emit('clearHymn');
      setSelectedHymn(null);
    }
  };

  return (
    <div className='p-4 bg-background text-text min-h-screen'>
      <h1 className='text-2xl font-bold mb-4 text-primary'>Hymn Control</h1>

      <div className='mb-4'>
        <label htmlFor='search-bar' className='block text-sm font-medium text-text'>
          Search Hymn:
        </label>
        <input
          type='text'
          id='search-bar'
          className='mt-1 block w-full pl-3 pr-3 py-2 text-base border border-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-text shadow-sm'
          placeholder='e.g., Amazing Grace'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className='mb-4'>
        <h2 className='text-xl font-semibold mb-2 text-accent'>Hymn List</h2>
        <div className='border rounded-md p-2 h-48 overflow-y-auto bg-secondary/20'>
          {loading ? (
            <p className='text-text/50'>Loading...</p>
          ) : filteredHymns.length > 0 ? (
            filteredHymns.map((hymn) => (
              <div
                key={hymn.id}
                className={`p-2 cursor-pointer hover:bg-primary/50 ${
                  selectedHymn?.id === hymn.id ? 'bg-primary' : ''
                }`}
                onClick={() => setSelectedHymn(hymn)}
                onDoubleClick={() => {
                  setSelectedHymn(hymn);
                  goLive();
                }}
              >
                <p className='font-semibold text-text'>{hymn.title}</p>
              </div>
            ))
          ) : (
            <p className='text-text/50'>No hymns found.</p>
          )}
        </div>
      </div>

      {/* Preview and customization controls will be added here */}

      <div className='flex space-x-4'>
        <button
          onClick={goLive}
          className='bg-primary text-white px-4 py-2 rounded-md hover:opacity-80'
        >
          Go Live
        </button>
        <button
          onClick={clearHymn}
          className='bg-red-500 text-white px-4 py-2 rounded-md hover:opacity-80'
        >
          Clear
        </button>
      </div>
    </div>
  );
}
