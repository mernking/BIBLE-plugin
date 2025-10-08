'use client';

import { useState, useEffect } from 'react';

export default function HymnControl({ socket, apiKey, overlayConnected }) {
  const [hymns, setHymns] = useState([]);
  const [filteredHymns, setFilteredHymns] = useState([]);
  const [selectedHymn, setSelectedHymn] = useState(null);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [backgroundType, setBackgroundType] = useState('image');
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
  }, []);

  useEffect(() => {
    const currentFilteredHymns = hymns.filter((hymn) =>
      hymn.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredHymns(currentFilteredHymns);
  }, [searchTerm, hymns]);

  const goLive = () => {
    if (socket && selectedHymn && selectedVerse) {
      const data = {
        hymn: {
          title: selectedHymn.title,
          verse: selectedVerse,
        },
        styles,
      };
      console.log('Sending hymn verse:', data);
      socket.emit('setHymn', data);
    }
  };

  const clearHymn = () => {
    if (socket) {
      socket.emit('clearHymn');
      setSelectedHymn(null);
      setSelectedVerse(null);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setStyles({ ...styles, backgroundImage: event.target.result, backgroundVideo: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setStyles({ ...styles, backgroundVideo: event.target.result, backgroundImage: '' });
      };
      reader.readAsDataURL(file);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className='mb-4'>
          <h2 className='text-xl font-semibold mb-2 text-accent'>Hymn List</h2>
          <div className='border rounded-md p-2 h-48 overflow-y-auto bg-secondary/20'>
            {loading ? (
              <p className='text-text/50'>Loading...</p>
            ) : filteredHymns.length > 0 ? (
              filteredHymns.map((hymn) => (
                <div
                  key={hymn.id}
                  className={`p-2 cursor-pointer hover:bg-primary/50 ${selectedHymn?.id === hymn.id ? 'bg-primary' : ''}`}
                  onClick={() => {
                    setSelectedHymn(hymn);
                    setSelectedVerse(null);
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

        <div className='mb-4'>
          <h2 className='text-xl font-semibold mb-2 text-accent'>Verse List</h2>
          <div className='border rounded-md p-2 h-48 overflow-y-auto bg-secondary/20'>
            {selectedHymn ? (
              JSON.parse(selectedHymn.verses).map((verse, index) => (
                <div
                  key={index}
                  className={`p-2 cursor-pointer hover:bg-primary/50 ${selectedVerse === verse ? 'bg-primary' : ''}`}
                  onClick={() => setSelectedVerse(verse)}
                  onDoubleClick={() => {
                    setSelectedVerse(verse);
                    goLive();
                  }}
                >
                  <p className='text-sm text-text/70'>
                    {verse.substring(0, 100)}...
                  </p>
                </div>
              ))
            ) : (
              <p className='text-text/50'>Select a hymn to see verses.</p>
            )}
          </div>
        </div>
      </div>

      <div className='mb-4'>
        <h2 className='text-xl font-semibold mb-2 text-accent'>
          Preview Panel
        </h2>

        <div
          className='border rounded-md p-4 min-h-[100px] flex items-center justify-center relative overflow-hidden border-primary'
          style={{
            backgroundColor: styles.backgroundColor,
            fontSize: `${styles.fontSize}px`,
            fontFamily: styles.fontFamily,
            color: styles.textColor,
            textAlign: styles.textAlign,
            justifyContent: styles.justifyContent,
            alignItems: styles.alignItems,
          }}
        >
          {styles.backgroundImage && (
            <div
              className='absolute inset-0'
              style={{
                backgroundImage: `url(${styles.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: styles.backgroundOpacity !== undefined ? styles.backgroundOpacity : 1,
              }}
            />
          )}

          {styles.backgroundVideo && (
            <video
              className='absolute inset-0 w-full h-full object-cover'
              src={styles.backgroundVideo}
              autoPlay
              loop
              muted
              style={{
                opacity: styles.backgroundOpacity !== undefined ? styles.backgroundOpacity : 1,
              }}
            />
          )}

          {selectedVerse ? (
            <div
              className='relative z-10'
              style={{ maxWidth: `${styles.maxWidth}px` }}
            >
              {/* <p className='font-bold'>{selectedHymn.title}</p>
              <div className="text-sm mt-2" dangerouslySetInnerHTML={{ __html: selectedVerse.replace(/\n/g, '<br />') }} /> */}
              <div className="" dangerouslySetInnerHTML={{ __html: selectedVerse.replace(/\n/g, '<br />') }} />
            </div>
          ) : (
            <p className='text-gray-500 relative z-10'>
              Select a verse to preview.
            </p>
          )}
        </div>
      </div>

      <div className='mb-4'>
        <h2 className='text-xl font-semibold mb-2 text-accent'>
          Customization Controls
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <fieldset className='border border-secondary p-4 rounded-md'>
            <legend className='text-lg font-semibold text-accent px-2'>Background</legend>

            <div className='flex space-x-2 mb-4'>
              <button
                onClick={() => setBackgroundType('image')}
                className={`px-3 py-1 border rounded-md text-sm ${backgroundType === 'image' ? 'bg-primary text-white' : 'border-primary text-text'} hover:opacity-80`}
              >
                Image
              </button>
              <button
                onClick={() => setBackgroundType('video')}
                className={`px-3 py-1 border rounded-md text-sm ${backgroundType === 'video' ? 'bg-primary text-white' : 'border-primary text-text'} hover:opacity-80`}
              >
                Video
              </button>
            </div>

            {backgroundType === 'image' && (
              <>
                <div className='mb-2'>
                  <label
                    htmlFor='bg-image-url'
                    className='block text-sm font-medium text-text'
                  >
                    Background Image URL:
                  </label>
                  <input
                    type='text'
                    id='bg-image-url'
                    className='mt-1 block w-full pl-3 pr-3 py-2 text-base border border-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-text shadow-sm'
                    placeholder='e.g., https://example.com/image.jpg'
                    value={
                      styles.backgroundImage.startsWith('data:')
                        ? ''
                        : styles.backgroundImage
                    }
                    onChange={(e) =>
                      setStyles({ ...styles, backgroundImage: e.target.value, backgroundVideo: '' })
                    }
                  />
                </div>

                <div className='mb-2'>
                  <label
                    htmlFor='bg-image-file'
                    className='block text-sm font-medium text-text'
                  >
                    Or upload from computer:
                  </label>
                  <input
                    type='file'
                    id='bg-image-file'
                    accept='image/*'
                    className='mt-1 block w-full text-sm text-text file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80'
                    onChange={handleImageUpload}
                  />
                </div>
              </>
            )}

            {backgroundType === 'video' && (
              <>
                <div className='mb-2'>
                  <label
                    htmlFor='bg-video-url'
                    className='block text-sm font-medium text-text'
                  >
                    Background Video URL:
                  </label>
                  <input
                    type='text'
                    id='bg-video-url'
                    className='mt-1 block w-full pl-3 pr-3 py-2 text-base border border-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-text shadow-sm'
                    placeholder='e.g., https://example.com/video.mp4'
                    value={
                      styles.backgroundVideo.startsWith('data:')
                        ? ''
                        : styles.backgroundVideo
                    }
                    onChange={(e) =>
                      setStyles({ ...styles, backgroundVideo: e.target.value, backgroundImage: '' })
                    }
                  />
                </div>

                <div className='mb-2'>
                  <label
                    htmlFor='bg-video-file'
                    className='block text-sm font-medium text-text'
                  >
                    Or upload from computer:
                  </label>
                  <input
                    type='file'
                    id='bg-video-file'
                    accept='video/*'
                    className='mt-1 block w-full text-sm text-text file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80'
                    onChange={handleVideoUpload}
                  />
                </div>
              </>
            )}

            <div className='mb-2'>
              <label
                htmlFor='bg-opacity'
                className='block text-sm font-medium text-text'
              >
                Background Opacity:
              </label>
              <input
                type='range'
                id='bg-opacity'
                min='0'
                max='1'
                step='0.01'
                value={styles.backgroundOpacity}
                onChange={(e) =>
                  setStyles({
                    ...styles,
                    backgroundOpacity: parseFloat(e.target.value),
                  })
                }
                className='w-full accent-primary'
              />
              <span>{(styles.backgroundOpacity * 100).toFixed(0)}%</span>
            </div>

            <div className='mb-2'>
              <label
                htmlFor='bg-color'
                className='block text-sm font-medium text-text'
              >
                Background Color:
              </label>
              <input
                type='color'
                id='bg-color'
                value={
                  styles.backgroundColor === 'transparent'
                    ? '#000000'
                    : styles.backgroundColor
                }
                onChange={(e) =>
                  setStyles({ ...styles, backgroundColor: e.target.value })
                }
                className='accent-primary'
              />
              <button
                onClick={() =>
                  setStyles({ ...styles, backgroundColor: 'transparent' })
                }
                className='ml-2 px-3 py-1 border border-primary rounded-md text-sm bg-background text-text shadow-sm hover:opacity-80'
              >
                Transparent
              </button>
            </div>
          </fieldset>

          <fieldset className='border border-secondary p-4 rounded-md'>
            <legend className='text-lg font-semibold text-accent px-2'>Typography</legend>
            <div className='mb-2'>
              <label
                htmlFor='font-size'
                className='block text-sm font-medium text-text'
              >
                Font Size:
              </label>
              <input
                type='range'
                id='font-size'
                min='16'
                max='100'
                value={styles.fontSize}
                onChange={(e) =>
                  setStyles({ ...styles, fontSize: parseInt(e.target.value) })
                }
                className='w-full accent-primary'
              />
              <span>{styles.fontSize}px</span>
            </div>

            <div className='mb-2'>
              <label
                htmlFor='font-family'
                className='block text-sm font-medium text-text'
              >
                Font Family:
              </label>
              <select
                id='font-family'
                value={styles.fontFamily}
                onChange={(e) =>
                  setStyles({ ...styles, fontFamily: e.target.value })
                }
                className='mt-1 block w-full pl-3 pr-10 py-2 text-base border border-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-text shadow-sm'
              >
                <option>Arial</option>
                <option>Verdana</option>
                <option>Georgia</option>
                <option>Times New Roman</option>
                <option>Courier New</option>
              </select>
            </div>

            <div className='mb-2'>
              <label
                htmlFor='text-color'
                className='block text-sm font-medium text-text'
              >
                Text Color:
              </label>
              <input
                type='color'
                id='text-color'
                value={styles.textColor}
                onChange={(e) =>
                  setStyles({ ...styles, textColor: e.target.value })
                }
                className='accent-primary'
              />
            </div>
          </fieldset>

          <fieldset className='border border-secondary p-4 rounded-md'>
            <legend className='text-lg font-semibold text-accent px-2'>Layout</legend>
            <div className='mb-2'>
              <label
                htmlFor='max-width'
                className='block text-sm font-medium text-text'
              >
                Max Width (px):
              </label>
              <input
                type='number'
                id='max-width'
                min='100'
                max='1920'
                value={styles.maxWidth}
                onChange={(e) =>
                  setStyles({ ...styles, maxWidth: parseInt(e.target.value) })
                }
                className='mt-1 block w-full pl-3 pr-3 py-2 text-base border border-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-text shadow-sm'
              />
            </div>

            <div className='mb-2'>
              <label className='block text-sm font-medium text-text'>
                Horizontal Alignment:
              </label>
              <div className='mt-1 flex space-x-2'>
                <button
                  onClick={() =>
                    setStyles({ ...styles, justifyContent: 'flex-start' })
                  }
                  className={`px-3 py-1 border rounded-md text-sm ${styles.justifyContent === 'flex-start' ? 'bg-primary text-white' : 'border-primary text-text'} hover:opacity-80`}
                >
                  Left
                </button>
                <button
                  onClick={() => setStyles({ ...styles, justifyContent: 'center' })}
                  className={`px-3 py-1 border rounded-md text-sm ${styles.justifyContent === 'center' ? 'bg-primary text-white' : 'border-primary text-text'} hover:opacity-80`}
                >
                  Center
                </button>
                <button
                  onClick={() =>
                    setStyles({ ...styles, justifyContent: 'flex-end' })
                  }
                  className={`px-3 py-1 border rounded-md text-sm ${styles.justifyContent === 'flex-end' ? 'bg-primary text-white' : 'border-primary text-text'} hover:opacity-80`}
                >
                  Right
                </button>
              </div>
            </div>

            <div className='mb-2'>
              <label className='block text-sm font-medium text-text'>
                Vertical Alignment:
              </label>
              <div className='mt-1 flex space-x-2'>
                <button
                  onClick={() => setStyles({ ...styles, alignItems: 'flex-start' })}
                  className={`px-3 py-1 border rounded-md text-sm ${styles.alignItems === 'flex-start' ? 'bg-primary text-white' : 'border-primary text-text'} hover:opacity-80`}
                >
                  Top
                </button>
                <button
                  onClick={() => setStyles({ ...styles, alignItems: 'center' })}
                  className={`px-3 py-1 border rounded-md text-sm ${styles.alignItems === 'center' ? 'bg-primary text-white' : 'border-primary text-text'} hover:opacity-80`}
                >
                  Middle
                </button>
                <button
                  onClick={() => setStyles({ ...styles, alignItems: 'flex-end' })}
                  className={`px-3 py-1 border rounded-md text-sm ${styles.alignItems === 'flex-end' ? 'bg-primary text-white' : 'border-primary text-text'} hover:opacity-80`}
                >
                  Bottom
                </button>
              </div>
            </div>
          </fieldset>
        </div>
      </div>

      <div className='flex space-x-4'>
        <button
          onClick={goLive}
          className={`bg-primary text-white px-4 py-2 rounded-md ${!overlayConnected ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
          disabled={!overlayConnected}
        >
          Go Live
        </button>
        <button
          onClick={clearHymn}
          className={`bg-red-500 text-white px-4 py-2 rounded-md ${!overlayConnected ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
          disabled={!overlayConnected}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
