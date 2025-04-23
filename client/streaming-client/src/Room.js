import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import YouTube from "react-youtube";
import { useDispatch, useSelector } from "react-redux";
import {
  setPlayerState,
  setPlayerTime,
  setIsHost,
  setRoom
} from "./store";
import { WS_TO_SERVER_SEND_MESSAGE, WS_TO_SERVER_SET_VIDEO, WS_TO_SERVER_PLAYER_ACTION } from "./Home";
// import "./App.css";

/**
 * Handles real-time YouTube video syncing and messaging for a specific room.
 * 
 * Responsibilities:
 * - Syncs video state across clients (play, pause, seek, end).
 * - Allows host to set YouTube videos.
 * - Manages chat messages for the room.
 * - Updates Redux store and communicates with the server via WebSocket events.
 */
function Room() {
  const params = useParams();
  const location = useLocation();
  const currentRoomFromURL = params.roomId;
  const isHostFromURL = new URLSearchParams(location.search).get("host") === "true";
  const intervalRef = useRef(null);
  
  const [message, setMessage] = useState("");
  const [requestVideoId, setRequestVideoId] = useState("");
  const [player, setPlayer] = useState(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const dispatch = useDispatch();
  const room = useSelector(state => state.room);
  const isHost = useSelector(state => state.isHost);
  const messages = useSelector(state => state.messages);
  const videoId = useSelector(state => state.videoId);
  const playerState = useSelector(state => state.playerState);
  const currentTime = useSelector(state => state.currentTime);

  // On component mount: sets the room ID and whether the user is host based on the URL.
  useEffect(() => {
    dispatch(setRoom(currentRoomFromURL));
    dispatch(setIsHost(isHostFromURL));
  }, [dispatch, currentRoomFromURL, isHostFromURL]);

  // Syncs the player's state (seek and play/pause) for non-host clients once the player is ready.
  useEffect(() => {
    if (!player || !isPlayerReady || isHost) return;

    const delay = setTimeout(() => {
      if (playerState === "playing") {
        player.seekTo(currentTime || 0);
        player.playVideo();
      } else if (playerState === "paused") {
        player.seekTo(currentTime || 0);
        player.pauseVideo();
      }
    }, 800);
    return () => clearTimeout(delay);
  }, [player, playerState, currentTime]);

  // Extracts a valid YouTube video ID from various YouTube URL formats or raw IDs.
  const extractYouTubeID = (url) => {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-]{11})(?:[&?].+)?/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([\w\-]{11})(?:[&?].+)?/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([\w\-]{11})(?:[&?].+)?/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:.+&)?v=([\w\-]{11})(?:[&?].+)?/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    if (/^[\w\-]{11}$/.test(url)) {
      return url;
    }
    
    console.warn('Could not extract YouTube ID from:', url);
    return null;
  };

  // Sends a typed chat message to the server via WebSocket.
  const sendMessage = () => {
    if (message.trim()) {
      dispatch({
        type: WS_TO_SERVER_SEND_MESSAGE,
        payload: { room_id: room, message }
      });
      setMessage("");
    }
  };

  // Validates and sends a YouTube video ID to the server (host-only action).
  const requestVideo = () => {
    if (requestVideoId) {
      const videoIdValue = extractYouTubeID(requestVideoId);
      console.log('Extracted video ID:', videoIdValue);
  
      if (videoIdValue) {
        if (isHost) {
          dispatch({
            type: WS_TO_SERVER_SET_VIDEO,
            payload: { room_id: room, video_id: videoIdValue }
          });
          setRequestVideoId("");
        } else {
          alert("Only the host can set videos");
        }
      } else {
        alert("Invalid YouTube URL or video ID");
      }
    } else {
      alert("Please enter a valid YouTube link.");
    }
  };

  // Called when the YouTube player is ready; syncs it with current video state and time.
  const onPlayerReady = (event) => {
    setPlayer(event.target);
    setIsPlayerReady(true);
    if (playerState === "playing") {
      event.target.seekTo(currentTime || 0);
      event.target.playVideo();
    } else if (playerState === "paused") {
      event.target.seekTo(currentTime || 0);
      event.target.pauseVideo();
    }
  };

  // Called whenever the YouTube player state changes; only the host dispatches playback updates.
  const onPlayerStateChange = (event) => {
    if (!isHost) return;
    const playerStatus = event.data;
    const currentPlayerTime = event.target.getCurrentTime();

    if (playerStatus === window.YT.PlayerState.PLAYING) {
      dispatch(setPlayerState("playing"));
      dispatch(setPlayerTime(currentPlayerTime));

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
  
      intervalRef.current = setInterval(() => {
        if (event.target.getPlayerState() !== window.YT.PlayerState.PLAYING) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          return;
        }

        const currentTime = event.target.getCurrentTime();
        dispatch(setPlayerTime(currentTime));
        dispatch({
          type: WS_TO_SERVER_PLAYER_ACTION,
          payload: {
            room_id: currentRoomFromURL,
            action: "playing",
            time: currentTime,
          }
        });
      }, 1000);

    } else if (playerStatus === window.YT.PlayerState.PAUSED) {
      dispatch(setPlayerState("paused"));
      dispatch(setPlayerTime(currentPlayerTime));
      dispatch({
        type: WS_TO_SERVER_PLAYER_ACTION,
        payload: {
          room_id: currentRoomFromURL,
          action: "paused",
          time: currentPlayerTime,
        }
      });
    } else if (playerStatus === window.YT.PlayerState.ENDED) {
      dispatch(setPlayerState("ended"));
      dispatch(setPlayerTime(0));
      dispatch({
        type: WS_TO_SERVER_PLAYER_ACTION,
        payload: {
          room_id: currentRoomFromURL,
          action: "ended",
          time: 0,
        }
      });
      
    }
  };

  const opts = {
    height: '390',
    width: '640',
    playerVars: {
      autoplay: 0,
    },
  };

  return (
    <div className="room">
      <h2>Room: {currentRoomFromURL}</h2>
      <p>Video ID: {videoId || 'No video loaded'}</p>
      
      <div className="video-chat-container">
        {videoId ? (
          <div className="video-player">
            <YouTube
              key={videoId}
              videoId={videoId}
              opts={opts}
              onStateChange={onPlayerStateChange}
              onReady={onPlayerReady}
            />
          </div>
        ) : (
          <div className="no-video">
            <p>No video loaded yet</p>
            {isHost && <p>Use the control below to set a video</p>}
            {!isHost && <p>Waiting for host to set a video</p>}
          </div>
        )}
        
        <div className="chat-container">
          <div className="chat-box">
            {messages.map((msg, index) =>
              msg.system ? (
                <p key={index} className="system">{msg.system}</p>
              ) : (
                <p key={index}>
                  <strong>{msg.sender || "User"}:</strong> {msg.message || msg.text}
                </p>
              )
            )}
          </div>
        </div>
        <div className="chat-input">
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
      </div>

      <div style={{ height: "10px" }}></div>

      {isHost && (
        <div className="video-controls">
          <input
            type="text"
            value={requestVideoId}
            onChange={(e) => setRequestVideoId(e.target.value)}
            placeholder="Enter YouTube Video Link"
          />
          <button onClick={requestVideo}>Set Video</button>
        </div>
      )}
    </div>
  );
}

export default Room;