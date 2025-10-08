'use client';

import { useState, useEffect } from "react";
import io from "socket.io-client";

let socket;

export default function OverlayPage() {
  const [verseData, setVerseData] = useState(null);
  const [hymnData, setHymnData] = useState(null);
  const [styles, setStyles] = useState({});

  useEffect(() => {
    const socketInitializer = async () => {
      // Use the environment variable for the server URL
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
      if (!serverUrl) {
        console.error("NEXT_PUBLIC_SERVER_URL is not defined");
        return;
      }

      // The API key is still expected to be in the URL search params
      const searchParams = new URLSearchParams(window.location.search);
      const apiKey = searchParams.get('key');
      if (!apiKey) {
        console.error('API Key not found in URL');
        return;
      }

      socket = io(serverUrl, {
        query: { apiKey: apiKey, type: 'overlay' },
        transports: ['websocket'],
      });

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

      socket.on('connect_error', (error) => {
        console.error('Overlay socket connection error:', error.message);
      });
    };
    socketInitializer();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return (
    <div
      className="w-screen h-screen flex relative overflow-hidden"
      style={{
        backgroundColor: styles.backgroundColor,
        justifyContent: styles.justifyContent || "center",
        alignItems: styles.alignItems || "center",
      }}
    >
      {styles.backgroundImage && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${styles.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundColor: styles.backgroundColor,
            opacity:
              styles.backgroundOpacity !== undefined
                ? styles.backgroundOpacity
                : 1,
          }}
        />
      )}

      {styles.backgroundVideo && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={styles.backgroundVideo}
          autoPlay
          loop
          muted
          style={{
            backgroundColor: styles.backgroundColor,
            opacity:
              styles.backgroundOpacity !== undefined
                ? styles.backgroundOpacity
                : 1,
          }}
        />
      )}

      {!styles.backgroundImage &&
        !styles.backgroundVideo &&
        styles.backgroundColor && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: styles.backgroundColor,
            }}
          />
        )}

      {verseData && (
        <div
          className="relative p-4 rounded-lg z-10"
          style={{
            fontSize: `${styles.fontSize || 32}px`,
            fontFamily: styles.fontFamily || "sans-serif",
            color: styles.textColor || "#fff",
            textAlign: styles.textAlign || "center",
            maxWidth: `${styles.maxWidth || 800}px`,
          }}
        >
          <p className="font-bold">{verseData.text}</p>
          <p className="text-sm mt-2">
            {verseData.book_name} {verseData.chapter}:{verseData.verse}
          </p>
        </div>
      )}

      {hymnData && (
        <div
          className="relative p-4 rounded-lg z-10"
          style={{
            fontSize: `${styles.fontSize || 32}px`,
            fontFamily: styles.fontFamily || "sans-serif",
            color: styles.textColor || "#fff",
            textAlign: styles.textAlign || "center",
            maxWidth: `${styles.maxWidth || 800}px`,
          }}
        >
          {/* <p className="font-bold">{hymnData.title}</p> */}
          {/* <div className="text-sm mt-2" dangerouslySetInnerHTML={{ __html: hymnData.verse.replace(/\n/g, '<br />') }} /> */}
          <div
            className=""
            dangerouslySetInnerHTML={{
              __html: hymnData.verse.replace(/\n/g, "<br />"),
            }}
          />
        </div>
      )}
    </div>
  );
}