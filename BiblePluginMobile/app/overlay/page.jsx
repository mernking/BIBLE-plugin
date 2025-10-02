'use client';

import { useState, useEffect } from "react";
import { View, Text, ImageBackground } from "react-native";
import { Video } from 'expo-av';
import io from "socket.io-client";
import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';

let socket;

export default function OverlayPage() {
  const { width } = useWindowDimensions();
  const [verseData, setVerseData] = useState(null);
  const [hymnData, setHymnData] = useState(null);
  const [styles, setStyles] = useState({});

  useEffect(() => {
    const socketInitializer = async () => {
      // For local development, you might need to replace this with your local IP
      // or a dynamically determined IP if running on a device.
      // For now, we'll assume the server is running on the same device or accessible via localhost.
      // In the "lighter" version, this will be an API endpoint.
      socket = io("http://localhost:3000"); // Assuming the Next.js server runs on port 3000

      socket.on("connect", () => {
        console.log("Overlay connected to socket.io server");
      });

      socket.on("updateVerse", (data) => {
        console.log("Overlay received updateVerse:", data);
        setHymnData(null);
        setVerseData(data.verse);
        setStyles(data.styles);
      });

      socket.on("clearVerse", () => {
        console.log("Overlay received clearVerse");
        setVerseData(null);
        setStyles({});
      });

      socket.on("setHymn", (data) => {
        console.log("Overlay received setHymn:", data);
        setVerseData(null);
        setHymnData(data.hymn);
        setStyles(data.styles);
      });

      socket.on("clearHymn", () => {
        console.log("Overlay received clearHymn");
        setHymnData(null);
        setStyles({});
      });

      socket.on("disconnect", () => {
        console.log("Overlay disconnected from socket.io server");
      });
    };
    socketInitializer();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const renderHymnContent = hymnData ? { html: hymnData.verse.replace(/\\n/g, '<br />') } : null;

  return (
    <View
      className="flex-1 relative overflow-hidden" // flex-1 for w-screen h-screen equivalent
      style={{
        backgroundColor: styles.backgroundColor,
        justifyContent: styles.justifyContent || "center",
        alignItems: styles.alignItems || "center",
      }}
    >
      {styles.backgroundImage && (
        <ImageBackground
          source={{ uri: styles.backgroundImage }}
          className="absolute inset-0"
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
          className="absolute inset-0"
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

      {!styles.backgroundImage &&
        !styles.backgroundVideo &&
        styles.backgroundColor && (
          <View
            className="absolute inset-0"
            style={{
              backgroundColor: styles.backgroundColor,
            }}
          />
        )}

      {verseData && (
        <View
          className="relative p-4 rounded-lg z-10"
          style={{
            fontSize: styles.fontSize || 32, // RN Text doesn't use 'px'
            fontFamily: styles.fontFamily || "sans-serif",
            color: styles.textColor || "#fff",
            textAlign: styles.textAlign || "center",
            maxWidth: styles.maxWidth || 800,
          }}
        >
          <Text className="font-bold">{verseData.text}</Text>
          <Text className="text-sm mt-2">
            {verseData.book_name} {verseData.chapter}:{verseData.verse}
          </Text>
        </View>
      )}

      {hymnData && (
        <View
          className="relative p-4 rounded-lg z-10"
          style={{
            fontSize: styles.fontSize || 32,
            fontFamily: styles.fontFamily || "sans-serif",
            color: styles.textColor || "#fff",
            textAlign: styles.textAlign || "center",
            maxWidth: styles.maxWidth || 800,
          }}
        >
          <RenderHtml
            contentWidth={width}
            source={renderHymnContent}
            tagsStyles={{
              body: {
                whiteSpace: 'normal', // Ensure text wraps
                color: styles.textColor || "#fff",
                fontSize: styles.fontSize || 32,
                fontFamily: styles.fontFamily || "sans-serif",
                textAlign: styles.textAlign || "center",
              },
              p: {
                marginBottom: 0, // Adjust as needed
              }
            }}
          />
        </View>
      )}
    </View>
  );
}
