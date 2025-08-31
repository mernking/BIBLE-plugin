"use client";
import Link from "next/link";

export default function HomePage() {
  const overlayUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/overlay`
      : "http://localhost:3000/overlay";

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(overlayUrl)
      .then(() => {
        alert("Overlay URL copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        alert("Failed to copy URL. Please copy it manually: " + overlayUrl);
      });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text p-4">
      <h1 className="text-4xl font-bold mb-6 text-primary">OBS Bible Plugin</h1>

      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
        <h2 className="text-2xl font-semibold mb-4 text-accent">Welcome!</h2>

        <p className="mb-4 text-gray-700">
          Use this plugin to display Bible verses on your OBS streams.
        </p>

        <div className="mb-6">
          <label
            htmlFor="overlay-url"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            OBS Browser Source URL:
          </label>
          <div className="flex items-center border border-gray-300 rounded-md shadow-sm overflow-hidden">
            <input
              type="text"
              id="overlay-url"
              readOnly
              value={overlayUrl}
              className="flex-grow p-2 text-sm bg-gray-50 text-gray-800 focus:outline-none"
            />
            <button
              onClick={copyToClipboard}
              className="bg-primary text-white px-4 py-2 text-sm hover:opacity-80 transition-opacity duration-200"
            >
              Copy
            </button>
          </div>
        </div>

        <Link
          href="/control"
          className="inline-block bg-accent text-white px-6 py-3 rounded-md text-lg font-semibold hover:opacity-80 transition-opacity duration-200"
        >
          Go to Control Dashboard
        </Link>
      </div>
    </div>
  );
}
