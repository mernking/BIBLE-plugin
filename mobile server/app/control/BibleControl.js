'use client';

import { useState, useEffect } from 'react';

export default function BibleControl({ socket, apiKey, overlayConnected }) {
  const [allBibles, setAllBibles] = useState([]); // Store all fetched bibles
  const [bibles, setBibles] = useState([]); // Filtered bibles based on language
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('All'); // Default to 'All'
  const [selectedBible, setSelectedBible] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [verses, setVerses] = useState([]);
  const [filteredVerses, setFilteredVerses] = useState([]);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [sortBy, setSortBy] = useState('book'); // Default sort by book
  const [backgroundType, setBackgroundType] = useState('image'); // New state for background type
  const [loading, setLoading] = useState(false);
  const [styles, setStyles] = useState({
    backgroundColor: 'transparent',
    fontSize: 32,
    fontFamily: 'Arial',
    textColor: '#000000',
    textAlign: 'center',
    backgroundImage: '', // New state for background image URL
    backgroundVideo: '', // New state for background video URL
    backgroundOpacity: 1, // Unified opacity for both image and video
    maxWidth: 800, // New state for max width
    justifyContent: 'center', // New state for horizontal alignment
    alignItems: 'center', // New state for vertical alignment
  });

  useEffect(() => {
    // Fetch all Bibles metadata once
    const fetchBibleList = async () => {
      try {
        const res = await fetch('/api/bibles');
        const data = await res.json();
        setAllBibles(data.bibles); // The API now returns an array

        // Extract unique languages
        const languages = new Set(['All']);
        data.bibles.forEach((bible) => {
          if (bible.lang) {
            languages.add(bible.lang);
          }
        });
        setAvailableLanguages(Array.from(languages).sort());
      } catch (error) {
        console.error('Failed to fetch bible list:', error);
      }
    };
    fetchBibleList();
  }, []); // Run only once on mount

  // Effect to filter bibles by language
  useEffect(() => {
    let filteredBibles = [];
    if (selectedLanguage === 'All') {
      filteredBibles = allBibles;
    } else {
      filteredBibles = allBibles.filter((bible) => bible.lang === selectedLanguage);
    }
    setBibles(filteredBibles); // Update the 'bibles' state that the selector uses

    // Set selectedBible to the first available in the filtered list, or null
    if (filteredBibles.length > 0) {
      setSelectedBible(filteredBibles[0].shortname);
    } else {
      setSelectedBible(null);
    }
  }, [selectedLanguage, allBibles]); // Re-run when language or allBibles changes

  // Effect to fetch bible content when a bible is selected
  useEffect(() => {
    if (selectedBible) {
      const fetchBibleContent = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/bibles/${selectedBible}`);
          const data = await res.json();
          setVerses(data.verses);
          setFilteredVerses(data.verses);
        } catch (error) {
          console.error(`Failed to fetch bible content for ${selectedBible}:`, error);
          setVerses([]);
          setFilteredVerses([]);
        }
        setLoading(false);
      };
      fetchBibleContent();
    } else {
      setVerses([]);
      setFilteredVerses([]);
    }
  }, [selectedBible]);

  const bookAbbreviations = {
    gen: 'Genesis',
    ex: 'Exodus',
    lev: 'Leviticus',
    num: 'Numbers',
    deut: 'Deuteronomy',
    josh: 'Joshua',
    judg: 'Judges',
    ruth: 'Ruth',
    '1 sam': '1 Samuel',
    '2 sam': '2 Samuel',
    '1 kgs': '1 Kings',
    '2 kgs': '2 Kings',
    '1 chr': '1 Chronicles',
    '2 chr': '2 Chronicles',
    ezra: 'Ezra',
    neh: 'Nehemiah',
    est: 'Esther',
    job: 'Job',
    ps: 'Psalms',
    prov: 'Proverbs',
    eccl: 'Ecclesiastes',
    song: 'Song of Solomon',
    isa: 'Isaiah',
    jer: 'Jeremiah',
    lam: 'Lamentations',
    ezek: 'Ezekiel',
    dan: 'Daniel',
    hos: 'Hosea',
    joel: 'Joel',
    amos: 'Amos',
    obad: 'Obadiah',
    jonah: 'Jonah',
    mic: 'Micah',
    nah: 'Nahum',
    hab: 'Habakkuk',
    zeph: 'Zephaniah',
    hag: 'Haggai',
    zech: 'Zechariah',
    mal: 'Malachi',
    matt: 'Matthew',
    mk: 'Mark',
    lk: 'Luke',
    jn: 'John',
    acts: 'Acts',
    rom: 'Romans',
    '1 cor': '1 Corinthians',
    '2 cor': '2 Corinthians',
    gal: 'Galatians',
    eph: 'Ephesians',
    phil: 'Philippians',
    col: 'Colossians',
    '1 thes': '1 Thessalonians',
    '2 thes': '2 Thessalonians',
    '1 tim': '1 Timothy',
    '2 tim': '2 Timothy',
    titus: 'Titus',
    phlm: 'Philemon',
    heb: 'Hebrews',
    jas: 'James',
    '1 pet': '1 Peter',
    '2 pet': '2 Peter',
    '1 jn': '1 John',
    '2 jn': '2 John',
    '3 jn': '3 John',
    jude: 'Jude',
    rev: 'Revelation',
  };

  // Effect to filter and sort verses based on search term, selected Bible, and sort option
  useEffect(() => {
    let currentFilteredVerses = [];

    if (searchTerm) {
      let processedSearchTerm = searchTerm.toLowerCase();

      // Check if search term is a book abbreviation
      const matchedBook = Object.keys(bookAbbreviations).find((abbr) =>
        processedSearchTerm.startsWith(abbr + ' ')
      );
      if (matchedBook) {
        const fullBookName = bookAbbreviations[matchedBook];
        processedSearchTerm = processedSearchTerm.replace(
          matchedBook,
          fullBookName.toLowerCase()
        );
      }

      currentFilteredVerses = verses.filter((verse) => {
        const reference =
          `${verse.book_name} ${verse.chapter}:${verse.verse}`.toLowerCase();
        const text = verse.text.toLowerCase();
        return (
          reference.includes(processedSearchTerm) ||
          text.includes(processedSearchTerm)
        );
      });
    } else {
      // If no search term, show all verses
      currentFilteredVerses = verses;
    }

    // Apply sorting
    const sortedVerses = [...currentFilteredVerses].sort((a, b) => {
      if (sortBy === 'book') {
        if (a.book !== b.book) return a.book - b.book;
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.verse - b.verse;
      } else if (sortBy === 'chapter') {
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        if (a.book !== b.book) return a.book - b.book; // Fallback to book if chapters are same
        return a.verse - b.verse;
      } else if (sortBy === 'verse') {
        if (a.verse !== b.verse) return a.verse - b.verse;
        if (a.chapter !== b.chapter) return a.chapter - b.chapter; // Fallback to chapter
        return a.book - b.book; // Fallback to book
      }
      return 0; // No sort
    });
    setFilteredVerses(sortedVerses);
  }, [searchTerm, verses, sortBy]); // Add sortBy to dependencies

  // Function to handle Go Live
  const goLive = () => {
    if (socket && selectedVerse) {
      console.log('Sending verse:', { verse: selectedVerse, styles });
      socket.emit('setVerse', { verse: selectedVerse, styles });
    }
  };

  // Function to handle Clear
  const clearVerse = () => {
    if (socket) {
      socket.emit('clearVerse');
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

  // Placeholder UI
  return (
    <div className='p-4 bg-background text-text min-h-screen'>
      <h1 className='text-2xl font-bold mb-4 text-primary'>
        OBS Bible Plugin Control
      </h1>

      <div className='mb-4'>
        <label
          htmlFor='language-select'
          className='block text-sm font-medium text-text'
        >
          Select Language:
        </label>
        <select
          id='language-select'
          className='mt-1 block w-full pl-3 pr-10 py-2 text-base border border-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-text shadow-sm'
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          {availableLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      <div className='mb-4'>
        <label
          htmlFor='bible-select'
          className='block text-sm font-medium text-text'
        >
          Select Bible:
        </label>
        <select
          id='bible-select'
          className='mt-1 block w-full pl-3 pr-10 py-2 text-base border border-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-text shadow-sm'
          value={selectedBible || ''}
          onChange={(e) => setSelectedBible(e.target.value)}
        >
          {bibles?.map((bible) => (
            <option key={bible.shortname} value={bible.shortname}>
              {bible.name}
            </option>
          ))}
        </select>
      </div>

      <div className='mb-4'>
        <label
          htmlFor='search-bar'
          className='block text-sm font-medium text-text'
        >
          Search Verse:
        </label>
        <input
          type='text'
          id='search-bar'
          className='mt-1 block w-full pl-3 pr-3 py-2 text-base border border-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-text shadow-sm'
          placeholder='e.g., John 3:16 or Genesis'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className='mb-4'>
        <label
          htmlFor='sort-by'
          className='block text-sm font-medium text-text'
        >
          Sort By:
        </label>
        <select
          id='sort-by'
          className='mt-1 block w-full pl-3 pr-10 py-2 text-base border border-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-text shadow-sm'
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value='book'>Book</option>
          <option value='chapter'>Chapter</option>
          <option value='verse'>Verse</option>
        </select>
      </div>

      <div className='mb-4'>
        <h2 className='text-xl font-semibold mb-2 text-accent'>Verse List</h2>
        <div className='border rounded-md p-2 h-48 overflow-y-auto bg-secondary/20'>
          {loading ? (
            <p className='text-text/50'>Loading...</p>
          ) : filteredVerses.length > 0 ? (
            filteredVerses.map((verse, index) => (
              <div
                key={index}
                className={`p-2 cursor-pointer hover:bg-primary/50 ${
                  selectedVerse === verse ? 'bg-primary' : ''
                }`}
                onClick={() => setSelectedVerse(verse)}
                onDoubleClick={() => {
                  setSelectedVerse(verse);
                  goLive();
                }} // Double-click to go live
              >
                <p className='font-semibold text-text'>
                  {verse.book_name} {verse.chapter}:{verse.verse}
                </p>
                <p className='text-sm text-text/70'>
                  {verse.text.substring(0, 100)}...
                </p>
              </div>
            ))
          ) : (
            <p className='text-text/50'>
              {searchTerm
                ? 'No verses found for your search.'
                : 'Select a bible to see verses.'}
            </p>
          )}
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
            // Conditional background image is handled by the inner div
          }}
        >
          {/* Background image overlay with opacity */}
          {styles.backgroundImage && (
            <div
              className='absolute inset-0'
              style={{
                backgroundImage: `url(${styles.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity:
                  styles.backgroundOpacity !== undefined
                    ? styles.backgroundOpacity
                    : 1,
              }}
            />
          )}

          {/* Background video overlay with opacity */}
          {styles.backgroundVideo && (
            <video
              className='absolute inset-0 w-full h-full object-cover'
              src={styles.backgroundVideo}
              autoPlay
              loop
              muted
              style={{
                opacity:
                  styles.backgroundOpacity !== undefined
                    ? styles.backgroundOpacity
                    : 1,
              }}
            />
          )}

          {/* Verse text */}
          {selectedVerse ? (
            <p
              className='relative z-10'
              style={{ maxWidth: `${styles.maxWidth}px` }}
            >
              {selectedVerse.text} - {selectedVerse.book_name}{' '}
              {selectedVerse.chapter}:{selectedVerse.verse}
            </p>
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
          {/* Background Controls */}
          <fieldset className='border border-secondary p-4 rounded-md'>
            <legend className='text-lg font-semibold text-accent px-2'>Background</legend>

            <div className='flex space-x-2 mb-4'>
              <button
                onClick={() => setBackgroundType('image')}
                className={`px-3 py-1 border rounded-md text-sm ${
                  backgroundType === 'image'
                    ? 'bg-primary text-white'
                    : 'border-primary text-text'
                } hover:opacity-80`}
              >
                Image
              </button>
              <button
                onClick={() => setBackgroundType('video')}
                className={`px-3 py-1 border rounded-md text-sm ${
                  backgroundType === 'video'
                    ? 'bg-primary text-white'
                    : 'border-primary text-text'
                } hover:opacity-80`}
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

          {/* Typography Controls */}
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

          {/* Layout Controls */}
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
                  className={`px-3 py-1 border rounded-md text-sm ${
                    styles.justifyContent === 'flex-start'
                      ? 'bg-primary text-white'
                      : 'border-primary text-text'
                  } hover:opacity-80`}
                >
                  Left
                </button>
                <button
                  onClick={() => setStyles({ ...styles, justifyContent: 'center' })}
                  className={`px-3 py-1 border rounded-md text-sm ${
                    styles.justifyContent === 'center'
                      ? 'bg-primary text-white'
                      : 'border-primary text-text'
                  } hover:opacity-80`}
                >
                  Center
                </button>
                <button
                  onClick={() =>
                    setStyles({ ...styles, justifyContent: 'flex-end' })
                  }
                  className={`px-3 py-1 border rounded-md text-sm ${
                    styles.justifyContent === 'flex-end'
                      ? 'bg-primary text-white'
                      : 'border-primary text-text'
                  } hover:opacity-80`}
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
                  className={`px-3 py-1 border rounded-md text-sm ${
                    styles.alignItems === 'flex-start'
                      ? 'bg-primary text-white'
                      : 'border-primary text-text'
                  } hover:opacity-80`}
                >
                  Top
                </button>
                <button
                  onClick={() => setStyles({ ...styles, alignItems: 'center' })}
                  className={`px-3 py-1 border rounded-md text-sm ${
                    styles.alignItems === 'center'
                      ? 'bg-primary text-white'
                      : 'border-primary text-text'
                  } hover:opacity-80`}
                >
                  Middle
                </button>
                <button
                  onClick={() => setStyles({ ...styles, alignItems: 'flex-end' })}
                  className={`px-3 py-1 border rounded-md text-sm ${
                    styles.alignItems === 'flex-end'
                      ? 'bg-primary text-white'
                      : 'border-primary text-text'
                  } hover:opacity-80`}
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
          onClick={clearVerse}
          className={`bg-red-500 text-white px-4 py-2 rounded-md ${!overlayConnected ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
          disabled={!overlayConnected}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
