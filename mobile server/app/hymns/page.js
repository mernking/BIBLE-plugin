'use client';

import { useState, useEffect } from 'react';

export default function HymnsPage() {
  const [hymns, setHymns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHymns() {
      try {
        const res = await fetch('/api/hymns');
        const data = await res.json();
        setHymns(data);
      } catch (error) {
        console.error('Error fetching hymns:', error);
      }
      setLoading(false);
    }

    fetchHymns();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Hymns</h1>
      <ul>
        {hymns.map((hymn) => (
          <li key={hymn.id}>{hymn.title}</li>
        ))}
      </ul>
    </div>
  );
}
