"use client";

import { useState, useEffect } from "react";
import io from "socket.io-client";

let socket;

export default function OverlayPage() {
  const [verseData, setVerseData] = useState(null);
  const [styles, setStyles] = useState({});

  useEffect(() => {
    const socketInitializer = async () => {
      socket = io();

      socket.on("connect", () => {
        console.log("Overlay connected to socket.io server");
      });

      socket.on("updateVerse", (data) => {
        console.log("Overlay received updateVerse:", data);
        setVerseData(data.verse);
        setStyles(data.styles);
      });

      socket.on("clearVerse", () => {
        console.log("Overlay received clearVerse");
        setVerseData(null);
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

  return (
    <div
      className="w-screen h-screen flex relative overflow-hidden"
      style={{
        justifyContent: styles.justifyContent || "center",
        alignItems: styles.alignItems || "center",
      }}
    >
      {/* Background layer with optional opacity */}
      {styles.backgroundImage && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${styles.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity:
              styles.backgroundOpacity !== undefined
                ? styles.backgroundOpacity
                : 1,
          }}
        />
      )}

      {/* Solid color fallback (no opacity, just color) */}
      {!styles.backgroundImage && styles.backgroundColor && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: styles.backgroundColor,
          }}
        />
      )}

      {/* Verse text on top */}
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
    </div>
  );
}
