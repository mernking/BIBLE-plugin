'use client';

import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import io from 'socket.io-client';
import BibleControl from './BibleControl';
import HymnControl from './HymnControl';

let socket;

export default function ControlPage() {
  const [view, setView] = useState('bible'); // 'bible' or 'hymn'

  useEffect(() => {
    const socketInitializer = async () => {
      // Assuming the server is running on the same device or accessible via localhost
      socket = io("http://localhost:3000"); // This will need to be configurable later

      socket.on('connect', () => console.log('Connected to socket.io server'));
      socket.on('disconnect', () => console.log('Disconnected from socket.io server'));
    };
    socketInitializer();

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  return (
    <View className='p-4 bg-background text-text flex-1'>
      <View className='flex-row space-x-4 mb-4'>
        <TouchableOpacity
          onPress={() => setView('bible')}
          className={`px-4 py-2 rounded-md ${view === 'bible' ? 'bg-primary text-white' : 'bg-secondary text-text'}`}
        >
          <Text className={`${view === 'bible' ? 'text-white' : 'text-text'}`}>Bible Control</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setView('hymn')}
          className={`px-4 py-2 rounded-md ${view === 'hymn' ? 'bg-primary text-white' : 'bg-secondary text-text'}`}
        >
          <Text className={`${view === 'hymn' ? 'text-white' : 'text-text'}`}>Hymn Control</Text>
        </TouchableOpacity>
      </View>

      {view === 'bible' ? <BibleControl socket={socket} /> : <HymnControl socket={socket} />}
    </View>
  );
}