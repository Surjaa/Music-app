import React, { useRef, useEffect, useState } from "react";

const MediaPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [source, setSource] = useState("");
  const [mediaType, setMediaType] = useState(null);
  const [player, setPlayer] = useState(null);
  const [downloads, setDownloads] = useState([]);
  const mediaRef = useRef(null);
  const refContainer = useRef(null);

  // Unique User ID (simulating user authentication)
  const userId = "user123"; // This can be replaced with actual authentication logic

  useEffect(() => {
    // Load downloads from local storage when the app starts
    const savedDownloads =
      JSON.parse(localStorage.getItem(`downloads_${userId}`)) || [];
    setDownloads(savedDownloads);
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setSource(fileUrl);
      setMediaType(file.type.startsWith("video") ? "video" : "audio");
    }
  };

  const handleURLSubmit = (event) => {
    event.preventDefault();
    const url = event.target.url.value.trim();
    if (!url) return;

    if (url.match(/(youtube\.com\/watch\?v=|youtu\.be\/)/)) {
      const videoId =
        url.split("v=")[1]?.split("&")[0] || url.split("youtu.be/")[1];
      loadYouTubeVideo(videoId);
    } else {
      setSource(url);
      setMediaType(url.includes(".mp4") ? "video" : "audio");
    }
    event.target.reset();
  };

  const loadYouTubeVideo = (videoId) => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      window.onYouTubeIframeAPIReady = () => createPlayer(videoId);
      document.body.appendChild(tag);
    } else if (!player) {
      createPlayer(videoId);
    } else {
      player.loadVideoById(videoId);
    }
  };

  const createPlayer = (videoId) => {
    setPlayer(
      new window.YT.Player(refContainer.current, {
        videoId: videoId,
        events: {
          onReady: (event) => event.target.playVideo(),
        },
      })
    );
  };

  const downloadMedia = () => {
    if (!source) return;

    // Generate a downloadable link
    const link = document.createElement("a");
    link.href = source;
    link.download = source.split("/").pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Save the downloaded file to local storage
    const newDownloads = [
      ...downloads,
      { id: Date.now(), url: source, type: mediaType },
    ];
    setDownloads(newDownloads);
    localStorage.setItem(`downloads_${userId}`, JSON.stringify(newDownloads));
  };

  const deleteDownload = (id) => {
    const updatedDownloads = downloads.filter((item) => item.id !== id);
    setDownloads(updatedDownloads);
    localStorage.setItem(
      `downloads_${userId}`,
      JSON.stringify(updatedDownloads)
    );
  };

  return (
    <div className="container mt-4">
      <h3>Music and Video Player</h3> <br />

      <form onSubmit={handleURLSubmit} className="mb-3">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            name="url"
            placeholder="Paste YouTube URL or video URL here"
          />
          <button type="submit" className="btn btn-primary">
            Load URL
          </button>
        </div>
      </form> <br />

      <div className="mb-3">
        <input
          type="file"
          className="form-control"
          accept="audio/*,video/*"
          onChange={handleFileChange}
        />
      </div>

      {/* Download Button */}
      {source && (
        <button className="btn btn-success mb-3" onClick={downloadMedia}>
          Download
        </button>
      )} <br />

      {/* YouTube Player */}
      <div
        className="embed-responsive embed-responsive-16by9"
        ref={refContainer}
        style={{ maxWidth: "100%", marginBottom: "20px" }}
      ></div>

      {/* Audio Player (above Video) */}
      {mediaType === "audio" && (
        <audio ref={mediaRef} src={source} controls className="mb-3"></audio>
      )}

      {/* Video Player */}
      {mediaType === "video" && source && !source.includes("youtube") ? (
        <video
          ref={mediaRef}
          src={source}
          controls
          className="embed-responsive-item"
        ></video>
      ) : null}

      {/* List of Downloaded Files */}
      <h4 className="mt-4">Downloaded Files</h4>
      <ul className="list-group"> <br />
        {downloads.length > 0 ? (
          downloads.map((file) => (
            <li
              key={file.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              {file.type === "audio" ? (
                <audio src={file.url} controls className="me-2"></audio>
              ) : (
                <video src={file.url} width="100" height="50" controls></video>
              )}
              <button
                className="btn btn-danger btn-sm"
                onClick={() => deleteDownload(file.id)}
              >
                Delete
              </button>
            </li>
          ))
        ) : (
          <li className="list-group-item">No downloads available.</li>
        )}
      </ul>
    </div>
  );
};

export default MediaPlayer;
