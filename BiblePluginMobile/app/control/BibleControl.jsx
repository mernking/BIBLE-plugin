'use client';

import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
// import { useColorScheme } from 'nativewind'; // Assuming nativewind provides this for theme colors

// Mock API service for initial development
const mockBibles = [
  { shortname: 'kjv', name: 'King James Version', lang: 'en' },
  { shortname: 'esv', name: 'English Standard Version', lang: 'en' },
  { shortname: 'spa', name: 'Spanish Bible', lang: 'es' },
];

const mockVerses = {
  kjv: [
    { book: 1, chapter: 1, verse: 1, book_name: 'Genesis', text: 'In the beginning God created the heaven and the earth.' },
    { book: 1, chapter: 1, verse: 2, book_name: 'Genesis', text: 'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.' },
    { book: 43, chapter: 3, verse: 16, book_name: 'John', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
  ],
  esv: [
    { book: 1, chapter: 1, verse: 1, book_name: 'Genesis', text: 'In the beginning, God created the heavens and the earth.' },
    { book: 43, chapter: 3, verse: 16, book_name: 'John', text: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.' },
  ],
};

async function fetchBiblesMock() {
  return new Promise(resolve => setTimeout(() => resolve({ bibles: mockBibles }), 500));
}

async function fetchBibleContentMock(shortname) {
  return new Promise(resolve => setTimeout(() => resolve({ verses: mockVerses[shortname] || [] }), 500));
}


const bookAbbreviations = {
  gen: 'Genesis', ex: 'Exodus', lev: 'Leviticus', num: 'Numbers', deut: 'Deuteronomy', josh: 'Joshua', judg: 'Judges', ruth: 'Ruth',
  '1 sam': '1 Samuel', '2 sam': '2 Samuel', '1 kgs': '1 Kings', '2 kgs': '2 Kings', '1 chr': '1 Chronicles', '2 chr': '2 Chronicles',
  ezra: 'Ezra', neh: 'Nehemiah', est: 'Esther', job: 'Job', ps: 'Psalms', prov: 'Proverbs', eccl: 'Ecclesiastes', song: 'Song of Solomon',
  isa: 'Isaiah', jer: 'Jeremiah', lam: 'Lamentations', ezek: 'Ezekiel', dan: 'Daniel', hos: 'Hosea', joel: 'Joel', amos: 'Amos',
  obad: 'Obadiah', jonah: 'Jonah', mic: 'Micah', nah: 'Nahum', hab: 'Habakkuk', zeph: 'Zephaniah', hag: 'Haggai', zech: 'Zechariah',
  mal: 'Malachi', matt: 'Matthew', mk: 'Mark', lk: 'Luke', jn: 'John', acts: 'Acts', rom: 'Romans', '1 cor': '1 Corinthians',
  '2 cor': '2 Corinthians', gal: 'Galatians', eph: 'Ephesians', phil: 'Philippians', col: 'Colossians', '1 thes': '1 Thessalonians',
  '2 thes': '2 Thessalonians', '1 tim': '1 Timothy', '2 tim': '2 Timothy', titus: 'Titus', phlm: 'Philemon', heb: 'Hebrews',
  jas: 'James', '1 pet': '1 Peter', '2 pet': '2 Peter', '1 jn': '1 John', '2 jn': '2 John', '3 jn': '3 John', jude: 'Jude', rev: 'Revelation',
};


export default function BibleControl({ socket }) {
  const [allBibles, setAllBibles] = useState([]);
  const [bibles, setBibles] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedBible, setSelectedBible] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [verses, setVerses] = useState([]);
  const [filteredVerses, setFilteredVerses] = useState([]);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [sortBy, setSortBy] = useState('book');
  const [backgroundType, setBackgroundType] = useState('image');
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
    const fetchBibleList = async () => {
      try {
        // const res = await fetch('/api/bibles'); // Original web app API call
        const data = await fetchBiblesMock(); // Using mock API
        setAllBibles(data.bibles);

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
  }, []);

  useEffect(() => {
    let filteredBibles = [];
    if (selectedLanguage === 'All') {
      filteredBibles = allBibles;
    } else {
      filteredBibles = allBibles.filter((bible) => bible.lang === selectedLanguage);
    }
    setBibles(filteredBibles);

    if (filteredBibles.length > 0) {
      setSelectedBible(filteredBibles[0].shortname);
    } else {
      setSelectedBible(null);
    }
  }, [selectedLanguage, allBibles]);

  useEffect(() => {
    if (selectedBible) {
      const fetchBibleContent = async () => {
        setLoading(true);
        try {
          // const res = await fetch(`/api/bibles/${selectedBible}`); // Original web app API call
          const data = await fetchBibleContentMock(selectedBible); // Using mock API
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

  useEffect(() => {
    let currentFilteredVerses = [];

    if (searchTerm) {
      let processedSearchTerm = searchTerm.toLowerCase();

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
      currentFilteredVerses = verses;
    }

    const sortedVerses = [...currentFilteredVerses].sort((a, b) => {
      if (sortBy === 'book') {
        if (a.book !== b.book) return a.book - b.book;
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.verse - b.verse;
      } else if (sortBy === 'chapter') {
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        if (a.book !== b.book) return a.book - b.book;
        return a.verse - b.verse;
      } else if (sortBy === 'verse') {
        if (a.verse !== b.verse) return a.verse - b.verse;
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.book - b.book;
      }
      return 0;
    });
    setFilteredVerses(sortedVerses);
  }, [searchTerm, verses, sortBy]);

  const goLive = () => {
    if (socket && selectedVerse) {
      console.log('Sending verse:', { verse: selectedVerse, styles });
      socket.emit('setVerse', { verse: selectedVerse, styles });
    }
  };

  const clearVerse = () => {
    if (socket) {
      socket.emit('clearVerse');
      setSelectedVerse(null);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true, // Request base64 to send via socket
    });

    if (!result.canceled) {
      setStyles({ ...styles, backgroundImage: `data:image/jpeg;base64,${result.assets[0].base64}`, backgroundVideo: '' });
    }
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true, // Request base64 to send via socket
    });

    if (!result.canceled) {
      setStyles({ ...styles, backgroundVideo: `data:video/mp4;base64,${result.assets[0].base64}`, backgroundImage: '' });
    }
  };

  return (
    <ScrollView className='p-4 bg-background text-text flex-1'>
      <Text className='text-2xl font-bold mb-4 text-primary'>
        OBS Bible Plugin Control
      </Text>

      <View className='mb-4'>
        <Text className='block text-sm font-medium text-text'>
          Select Language:
        </Text>
        <Picker
          selectedValue={selectedLanguage}
          onValueChange={(itemValue) => setSelectedLanguage(itemValue)}
          // className='mt-1 block w-full pl-3 pr-10 py-2 text-base border border-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-text shadow-sm'
          style={{ height: 50, width: '100%', backgroundColor: '#f0f0f0', color: '#333' }} // Basic styling for Picker
        >
          {availableLanguages.map((lang) => (
            <Picker.Item key={lang} label={lang} value={lang} />
          ))}
        </Picker>
      </View>

      <View className='mb-4'>
        <Text className='block text-sm font-medium text-text'>
          Select Bible:
        </Text>
        <Picker
          selectedValue={selectedBible}
          onValueChange={(itemValue) => setSelectedBible(itemValue)}
          // className='mt-1 block w-full pl-3 pr-10 py-2 text-base border border-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-text shadow-sm'
          style={{ height: 50, width: '100%', backgroundColor: '#f0f0f0', color: '#333' }} // Basic styling for Picker
        >
          {bibles?.map((bible) => (
            <Picker.Item key={bible.shortname} label={bible.name} value={bible.shortname} />
          ))}
        </Picker>
      </View>

      <View className='mb-4'>
        <Text className='block text-sm font-medium text-text'>
          Search Verse:
        </Text>
        <TextInput
          className='mt-1 block w-full pl-3 pr-3 py-2 text-base border border-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-text shadow-sm'
          placeholder='e.g., John 3:16 or Genesis'
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <View className='mb-4'>
        <Text className='block text-sm font-medium text-text'>
          Sort By:
        </Text>
        <Picker
          selectedValue={sortBy}
          onValueChange={(itemValue) => setSortBy(itemValue)}
          // className='mt-1 block w-full pl-3 pr-10 py-2 text-base border border-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-text shadow-sm'
          style={{ height: 50, width: '100%', backgroundColor: '#f0f0f0', color: '#333' }} // Basic styling for Picker
        >
          <Picker.Item label='Book' value='book' />
          <Picker.Item label='Chapter' value='chapter' />
          <Picker.Item label='Verse' value='verse' />
        </Picker>
      </View>

      <View className='mb-4'>
        <Text className='text-xl font-semibold mb-2 text-accent'>Verse List</Text>
        <View className='border rounded-md p-2 h-48 overflow-y-auto bg-secondary/20'>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : filteredVerses.length > 0 ? (
            <ScrollView>
              {filteredVerses.map((verse, index) => (
                <TouchableOpacity
                  key={index}
                  className={`p-2 cursor-pointer hover:bg-primary/50 ${selectedVerse === verse ? 'bg-primary' : ''}`}
                  onPress={() => setSelectedVerse(verse)}
                  onLongPress={() => { // Use onLongPress for double-click equivalent
                    setSelectedVerse(verse);
                    goLive();
                  }}
                >
                  <Text className='font-semibold text-text'>
                    {verse.book_name} {verse.chapter}:{verse.verse}
                  </Text>
                  <Text className='text-sm text-text/70'>
                    {verse.text.substring(0, 100)}...
                  </Text>
                </TouchableOpacity>
              ))
            }
            </ScrollView>
          ) : (
            <Text className='text-text/50'>
              {searchTerm
                ? 'No verses found for your search.'
                : 'Select a bible to see verses.'}
            </Text>
          )}
        </View>
      </View>

      <View className='mb-4'>
        <Text className='text-xl font-semibold mb-2 text-accent'>
          Preview Panel
        </Text>

        <View
          className='border rounded-md p-4 min-h-[100px] flex items-center justify-center relative overflow-hidden border-primary'
          style={{
            backgroundColor: styles.backgroundColor,
            fontSize: styles.fontSize,
            fontFamily: styles.fontFamily,
            color: styles.textColor,
            textAlign: styles.textAlign,
            justifyContent: styles.justifyContent,
            alignItems: styles.alignItems,
          }}
        >
          {styles.backgroundImage && (
            <ImageBackground
              source={{ uri: styles.backgroundImage }}
              className='absolute inset-0'
              style={{
                width: '100%',
                height: '100%',
                opacity: styles.backgroundOpacity !== undefined ? styles.backgroundOpacity : 1,
              }}
              resizeMode="cover"
            />
          )}

          {styles.backgroundVideo && (
            <Video
              source={{ uri: styles.backgroundVideo }}
              className='absolute inset-0'
              style={{
                width: '100%',
                height: '100%',
                opacity: styles.backgroundOpacity !== undefined ? styles.backgroundOpacity : 1,
              }}
              resizeMode="cover"
              shouldPlay
              isLooping
              isMuted
            />
          )}

          {selectedVerse ? (
            <Text
              className='relative z-10'
              style={{ maxWidth: styles.maxWidth }}
            >
              {selectedVerse.text} - {selectedVerse.book_name}{' '}
              {selectedVerse.chapter}:{selectedVerse.verse}
            </Text>
          ) : (
            <Text className='text-gray-500 relative z-10'>
              Select a verse to preview.
            </Text>
          )}
        </View>
      </View>

      <View className='mb-4'>
        <Text className='text-xl font-semibold mb-2 text-accent'>
          Customization Controls
        </Text>
        <View className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {/* Background Controls */}
          <View className='border border-secondary p-4 rounded-md'>
            <Text className='text-lg font-semibold text-accent px-2'>Background</Text>

            <View className='flex-row space-x-2 mb-4'>
              <TouchableOpacity
                onPress={() => setBackgroundType('image')}
                className={`px-3 py-1 border rounded-md text-sm ${backgroundType === 'image' ? 'bg-primary text-white' : 'border-primary text-text'} hover:opacity-80`}
              >
                <Text className={`${backgroundType === 'image' ? 'text-white' : 'text-text'}`}>Image</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setBackgroundType('video')}
                className={`px-3 py-1 border rounded-md text-sm ${backgroundType === 'video' ? 'bg-primary text-white' : 'border-primary text-text'} hover:opacity-80`}
              >
                <Text className={`${backgroundType === 'video' ? 'text-white' : 'text-text'}`}>Video</Text>
              </TouchableOpacity>
            </View>

            {backgroundType === 'image' && (
              <>
                <View className='mb-2'>
                  <Text className='block text-sm font-medium text-text'>
                    Background Image URL:
                  </Text>
                  <TextInput
                    className='mt-1 block w-full pl-3 pr-3 py-2 text-base border border-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-text shadow-sm'
                    placeholder='e.g., https://example.com/image.jpg'
                    value={
                      styles.backgroundImage.startsWith('data:')
                        ? ''
                        : styles.backgroundImage
                    }
                    onChangeText={(text) =>
                      setStyles({ ...styles, backgroundImage: text, backgroundVideo: '' })
                    }
                  />
                </View>

                <View className='mb-2'>
                  <Text className='block text-sm font-medium text-text'>
                    Or upload from computer:
                  </Text>
                  <TouchableOpacity
                    onPress={pickImage}
                    className='mt-1 block w-full text-sm text-text file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80'
                  >
                    <Text className='px-4 py-2 rounded-full bg-primary text-white'>Pick an image</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {backgroundType === 'video' && (
              <>
                <View className='mb-2'>
                  <Text className='block text-sm font-medium text-text'>
                    Background Video URL:
                  </Text>
                  <TextInput
                    className='mt-1 block w-full pl-3 pr-3 py-2 text-base border border-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-text shadow-sm'
                    placeholder='e.g., https://example.com/video.mp4'
                    value={
                      styles.backgroundVideo.startsWith('data:')
                        ? ''
                        : styles.backgroundVideo
                    }
                    onChangeText={(text) =>
                      setStyles({ ...styles, backgroundVideo: text, backgroundImage: '' })
                    }
                  />
                </View>

                <View className='mb-2'>
                  <Text className='block text-sm font-medium text-text'>
                    Or upload from computer:
                  </Text>
                  <TouchableOpacity
                    onPress={pickVideo}
                    className='mt-1 block w-full text-sm text-text file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80'
                  >
                    <Text className='px-4 py-2 rounded-full bg-primary text-white'>Pick a video</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View className='mb-2'>
              <Text className='block text-sm font-medium text-text'>
                Background Opacity:
              </Text>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={0}
                maximumValue={1}
                step={0.01}
                value={styles.backgroundOpacity}
                onValueChange={(value) =>
                  setStyles({ ...styles, backgroundOpacity: value })
                }
                minimumTrackTintColor="#FFFFFF" // Placeholder, will use theme colors
                maximumTrackTintColor="#000000" // Placeholder, will use theme colors
                thumbTintColor="#FFFFFF" // Placeholder, will use theme colors
              />
              <Text>{(styles.backgroundOpacity * 100).toFixed(0)}%</Text>
            </View>

            <View className='mb-2'>
              <Text className='block text-sm font-medium text-text'>
                Background Color:
              </Text>
              <TextInput
                className='mt-1 block w-full pl-3 pr-3 py-2 text-base border border-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-text shadow-sm'
                placeholder='e.g., #RRGGBB or transparent'
                value={styles.backgroundColor}
                onChangeText={(text) =>
                  setStyles({ ...styles, backgroundColor: text })
                }
              />
              <TouchableOpacity
                onPress={() =>
                  setStyles({ ...styles, backgroundColor: 'transparent' })
                }
                className='ml-2 px-3 py-1 border border-primary rounded-md text-sm bg-background text-text shadow-sm hover:opacity-80'
              >
                <Text className='text-text'>Transparent</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Typography Controls */}
          <View className='border border-secondary p-4 rounded-md'>
            <Text className='text-lg font-semibold text-accent px-2'>Typography</Text>
            <View className='mb-2'>
              <Text className='block text-sm font-medium text-text'>
                Font Size:
              </Text>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={16}
                maximumValue={100}
                step={1}
                value={styles.fontSize}
                onValueChange={(value) =>
                  setStyles({ ...styles, fontSize: parseInt(value) })
                }
                minimumTrackTintColor="#FFFFFF"
                maximumTrackTintColor="#000000"
                thumbTintColor="#FFFFFF"
              />
              <Text>{styles.fontSize}px</Text>
            </View>

            <View className='mb-2'>
              <Text className='block text-sm font-medium text-text'>
                Font Family:
              </Text>
              <Picker
                selectedValue={styles.fontFamily}
                onValueChange={(itemValue) =>
                  setStyles({ ...styles, fontFamily: itemValue })
                }
                // className='mt-1 block w-full pl-3 pr-10 py-2 text-base border border-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-text shadow-sm'
                style={{ height: 50, width: '100%', backgroundColor: '#f0f0f0', color: '#333' }} // Basic styling for Picker
              >
                <Picker.Item label='Arial' value='Arial' />
                <Picker.Item label='Verdana' value='Verdana' />
                <Picker.Item label='Georgia' value='Georgia' />
                <Picker.Item label='Times New Roman' value='Times New Roman' />
                <Picker.Item label='Courier New' value='Courier New' />
              </Picker>
            </View>

            <View className='mb-2'>
              <Text className='block text-sm font-medium text-text'>
                Text Color:
              </Text>
              <TextInput
                className='mt-1 block w-full pl-3 pr-3 py-2 text-base border border-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-text shadow-sm'
                placeholder='e.g., #RRGGBB'
                value={styles.textColor}
                onChangeText={(text) =>
                  setStyles({ ...styles, textColor: text })
                }
              />
            </View>
          </View>

          {/* Layout Controls */}
          <View className='border border-secondary p-4 rounded-md'>
            <Text className='text-lg font-semibold text-accent px-2'>Layout</Text>
            <View className='mb-2'>
              <Text className='block text-sm font-medium text-text'>
                Max Width (px):
              </Text>
              <TextInput
                className='mt-1 block w-full pl-3 pr-3 py-2 text-base border border-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-text shadow-sm'
                keyboardType='numeric'
                value={String(styles.maxWidth)}
                onChangeText={(text) =>
                  setStyles({ ...styles, maxWidth: parseInt(text) || 0 })
                }
              />
            </View>

            <View className='mb-2'>
              <Text className='block text-sm font-medium text-text'>
                Horizontal Alignment:
              </Text>
              <View className='mt-1 flex-row space-x-2'>
                <TouchableOpacity
                  onPress={() =>
                    setStyles({ ...styles, justifyContent: 'flex-start' })
                  }
                  className={`px-3 py-1 border rounded-md text-sm ${styles.justifyContent === 'flex-start' ? 'bg-primary text-white' : 'border-primary text-text'} hover:opacity-80`}
                >
                  <Text className={`${styles.justifyContent === 'flex-start' ? 'text-white' : 'text-text'}`}>Left</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setStyles({ ...styles, justifyContent: 'center' })}
                  className={`px-3 py-1 border rounded-md text-sm ${styles.justifyContent === 'center' ? 'bg-primary text-white' : 'border-primary text-text'} hover:opacity-80`}
                >
                  <Text className={`${styles.justifyContent === 'center' ? 'text-white' : 'text-text'}`}>Center</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    setStyles({ ...styles, justifyContent: 'flex-end' })
                  }
                  className={`px-3 py-1 border rounded-md text-sm ${styles.justifyContent === 'flex-end' ? 'bg-primary text-white' : 'border-primary text-text'} hover:opacity-80`}
                >
                  <Text className={`${styles.justifyContent === 'flex-end' ? 'text-white' : 'text-text'}`}>Right</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className='mb-2'>
              <Text className='block text-sm font-medium text-text'>
                Vertical Alignment:
              </Text>
              <View className='mt-1 flex-row space-x-2'>
                <TouchableOpacity
                  onPress={() => setStyles({ ...styles, alignItems: 'flex-start' })}
                  className={`px-3 py-1 border rounded-md text-sm ${styles.alignItems === 'flex-start' ? 'bg-primary text-white' : 'border-primary text-text'} hover:opacity-80`}
                >
                  <Text className={`${styles.alignItems === 'flex-start' ? 'text-white' : 'text-text'}`}>Top</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setStyles({ ...styles, alignItems: 'center' })}
                  className={`px-3 py-1 border rounded-md text-sm ${styles.alignItems === 'center' ? 'bg-primary text-white' : 'border-primary text-text'} hover:opacity-80`}
                >
                  <Text className={`${styles.alignItems === 'center' ? 'text-white' : 'text-text'}`}>Middle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setStyles({ ...styles, alignItems: 'flex-end' })}
                  className={`px-3 py-1 border rounded-md text-sm ${styles.alignItems === 'flex-end' ? 'bg-primary text-white' : 'border-primary text-text'} hover:opacity-80`}
                >
                  <Text className={`${styles.alignItems === 'flex-end' ? 'text-white' : 'text-text'}`}>Bottom</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className='flex-row space-x-4'>
        <TouchableOpacity
          onPress={goLive}
          className='bg-primary text-white px-4 py-2 rounded-md hover:opacity-80'
        >
          <Text className='text-white'>Go Live</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={clearVerse}
          className='bg-red-500 text-white px-4 py-2 rounded-md hover:opacity-80'
        >
          <Text className='text-white'>Clear</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}