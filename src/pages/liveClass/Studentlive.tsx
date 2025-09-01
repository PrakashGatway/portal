// src/components/student/StudentLiveClass.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import AgoraRTC, {
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCClient,
} from 'agora-rtc-sdk-ng';
import AgoraRTM, { RtmClient, RtmChannel } from 'agora-rtm-sdk';
import { toast } from 'react-toastify';

// Replace with your actual App ID and token generation logic
const AGORA_APP_ID = "6147232a6d8e42aebaf649bdc11fc387";
const AGORA_TOKEN = "007eJxTYLja/XB3ucju5X07Z8z7FSzVMnFK+QHj6KteWpPqyqNW1hgoMJgZmpgbGRslmqVYpJoYJaYmJaaZmVgmpSQbGqYlG1uYC93dlNEQyMhw8L4PCyMDBIL4zAwGBhYMDACq7iAm"; // Use null for testing, or fetch from backend

const StudentLiveClass = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  // Agora Refs
  const rtcRef = useRef({
    client: null,
    localAudioTrack: null,
    localVideoTrack: null,
  });

  const rtmRef = useRef({
    client: null,
    channel: null,
  });

  // UI Refs
  const localVideoRef = useRef(null);
  const remoteContainerRef = useRef(null); // For teacher's video

  // State
  const [isCameraOn, setIsCameraOn] = useState(false); // Camera off by default
  const [isMicOn, setIsMicOn] = useState(true); // Mic on by default
  const [isJoined, setIsJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [studentNotes, setStudentNotes] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch token (replace with your backend call)
  const fetchToken = useCallback(async (channel, uid) => {
    // In a real app, call your backend to get a valid token
    // const response = await fetch(`/api/agora/token?channel=${channel}&uid=${uid}`);
    // const data = await response.json();
    // return data.rtcToken;
    return AGORA_TOKEN; // For testing
  }, []);

  // Initialize Agora
  useEffect(() => {
    const initAgora = async () => {
      if (!AGORA_APP_ID || !classId) {
        toast.error('Missing App ID or Class ID');
        return;
      }

      try {
        // --- Agora RTC Setup ---
        rtcRef.current.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

        rtcRef.current.client.on('user-published', async (user, mediaType) => {
          await rtcRef.current.client.subscribe(user, mediaType);
          if (mediaType === 'video') {
            const remoteVideoTrack = user.videoTrack;
            // Clear and show only the latest main video (teacher/screen share)
            if (remoteContainerRef.current) {
              remoteContainerRef.current.innerHTML = '';
              const playerId = `teacher-player`;
              let playerContainer = document.getElementById(playerId);
              if (!playerContainer) {
                playerContainer = document.createElement('div');
                playerContainer.id = playerId;
                playerContainer.className = 'w-full h-full';
                remoteContainerRef.current.appendChild(playerContainer);
              }
              remoteVideoTrack.play(playerContainer);
            }
          }
          if (mediaType === 'audio') {
            const remoteAudioTrack = user.audioTrack;
            remoteAudioTrack.play();
          }
        });

        rtcRef.current.client.on('user-unpublished', (user) => {
            if (remoteContainerRef.current) {
                remoteContainerRef.current.innerHTML = '<div class="text-gray-400 w-full text-center py-10">Video stopped</div>';
            }
        });

        rtcRef.current.client.on('user-left', (user) => {
            if (remoteContainerRef.current) {
                remoteContainerRef.current.innerHTML = '<div class="text-gray-400 w-full text-center py-10">Teacher has left the class</div>';
            }
            toast.info('Teacher has left the class');
        });

        // --- Agora RTM Setup ---
        // Generate a unique UID for the student (in a real app, get from auth context)
        const studentUid = `student_${Math.floor(Math.random() * 100000)}`;
        // rtmRef.current.client = AgoraRTM.createInstance(AGORA_APP_ID);
        // await rtmRef.current.client.login({ uid: studentUid, token: null }); // Use RTM token if needed
        // rtmRef.current.channel = rtmRef.current.client.createChannel(classId);
        // await rtmRef.current.channel.join();

        // rtmRef.current.channel.on('ChannelMessage', (message, senderId) => {
        //   const senderName = senderId === 'teacher' ? 'Teacher' : senderId;
        //   setMessages((prev) => [...prev, { text: message.text, senderId: senderName, timestamp: new Date() }]);
        // });

        // --- Create and Publish Local Audio Track ---
        rtcRef.current.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();

        const token = await fetchToken(classId, studentUid);
        await rtcRef.current.client.join(AGORA_APP_ID, classId, token, studentUid);
        await rtcRef.current.client.publish([rtcRef.current.localAudioTrack]);

        setIsJoined(true);
        toast.success('Joined live class successfully!');
      } catch (error) {
        console.error('Agora initialization error:', error);
        toast.error(`Failed to join class: ${error.message}`);
      }
    };

    initAgora();

    return () => {
      const cleanup = async () => {
        try {
          rtcRef.current.localAudioTrack?.close();
          rtcRef.current.localVideoTrack?.close();
          await rtcRef.current.client?.leave();
          await rtmRef.current.channel?.leave();
          await rtmRef.current.client?.logout();
          setIsJoined(false);
          if (localVideoRef.current) localVideoRef.current.innerHTML = '';
          if (remoteContainerRef.current) remoteContainerRef.current.innerHTML = '';
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      };
      cleanup();
    };
  }, [classId, fetchToken]);

  // Toggle Camera
  const toggleCamera = async () => {
    try {
      if (!isCameraOn) {
        // Turn camera ON
        if (!rtcRef.current.localVideoTrack) {
          rtcRef.current.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
        }
        if (localVideoRef.current) {
          rtcRef.current.localVideoTrack.play(localVideoRef.current);
        }
        if (rtcRef.current.client && !rtcRef.current.localVideoTrack.isPublished) {
          await rtcRef.current.client.publish([rtcRef.current.localVideoTrack]);
        }
      } else {
        // Turn camera OFF
        if (rtcRef.current.localVideoTrack && rtcRef.current.localVideoTrack.isPublished) {
          await rtcRef.current.client.unpublish([rtcRef.current.localVideoTrack]);
        }
        rtcRef.current.localVideoTrack?.close();
        rtcRef.current.localVideoTrack = null;
        if (localVideoRef.current) {
          localVideoRef.current.innerHTML = '<div class="text-gray-400">Camera Off</div>';
        }
      }
      setIsCameraOn(!isCameraOn);
    } catch (error) {
      toast.error('Failed to toggle camera');
    }
  };

  // Toggle Microphone
  const toggleMic = async () => {
    if (rtcRef.current.localAudioTrack) {
      try {
        if (isMicOn) {
          await rtcRef.current.localAudioTrack.setMuted(true);
        } else {
          await rtcRef.current.localAudioTrack.setMuted(false);
        }
        setIsMicOn(!isMicOn);
      } catch (error) {
        toast.error('Failed to toggle microphone');
      }
    }
  };

  // Send Chat Message
  const sendMessage = async () => {
    if (newMessage.trim() && rtmRef.current.channel) {
      try {
        await rtmRef.current.channel.sendMessage({ text: newMessage });
        setMessages((prev) => [...prev, { text: newMessage, senderId: 'You', timestamp: new Date() }]);
        setNewMessage('');
      } catch (error) {
        toast.error('Failed to send message');
      }
    }
  };

  // Save Student Notes
  const saveStudentNotes = () => {
    // Implement note saving logic (e.g., local storage or backend)
    console.log('Saving student notes:', studentNotes);
    toast.success('Notes saved locally');
  };

  // Leave Class
  const leaveClass = async () => {
    try {
      await rtcRef.current.client?.leave();
      await rtmRef.current.channel?.leave();
      await rtmRef.current.client?.logout();
      toast.info('Left the class');
      navigate('/dashboard'); // Adjust navigation
    } catch (error) {
      toast.error('Error leaving class');
    }
  };

  // Toggle Fullscreen for Teacher Video
  const toggleFullscreen = () => {
    if (!remoteContainerRef.current) return;

    if (!isFullscreen) {
      if (remoteContainerRef.current.requestFullscreen) {
        remoteContainerRef.current.requestFullscreen();
      } else if (remoteContainerRef.current.mozRequestFullScreen) {
        remoteContainerRef.current.mozRequestFullScreen();
      } else if (remoteContainerRef.current.webkitRequestFullscreen) {
        remoteContainerRef.current.webkitRequestFullscreen();
      } else if (remoteContainerRef.current.msRequestFullscreen) {
        remoteContainerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gray-800">
        <h1 className="text-xl font-bold">Live Class: {classId}</h1>
        <div className="flex space-x-2">
          <button
            onClick={toggleCamera}
            disabled={!isJoined}
            className={`px-3 py-1 rounded text-sm ${isCameraOn ? 'bg-gray-700' : 'bg-red-600'}`}
          >
            {isCameraOn ? '📷 Stop Cam' : '📷 Start Cam'}
          </button>
          <button
            onClick={toggleMic}
            disabled={!isJoined}
            className={`px-3 py-1 rounded text-sm ${isMicOn ? 'bg-gray-700' : 'bg-red-600'}`}
          >
            {isMicOn ? '🎤 Mute' : '🎤 Unmute'}
          </button>
          <button
            onClick={leaveClass}
            disabled={!isJoined}
            className="px-3 py-1 bg-red-600 rounded text-sm"
          >
            Leave Class
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden p-2">
        {/* Teacher Video */}
        <div className="w-2/3 pr-2 flex flex-col">
          <div className="relative flex-1 bg-black rounded-lg overflow-hidden">
            <div
              ref={remoteContainerRef}
              className="w-full h-full"
            >
              {isJoined && (
                <div className="text-gray-400 w-full text-center py-10">
                  Waiting for teacher's video...
                </div>
              )}
            </div>
            <button
              onClick={toggleFullscreen}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded"
            >
              {isFullscreen ? '⇲' : '⛶'}
            </button>
          </div>
        </div>

        {/* Sidebar (Local Video, Chat, Notes) */}
        <div className="w-1/3 pl-2 flex flex-col">
          {/* Local Video (Picture-in-Picture style) */}
          <div className="bg-gray-800 rounded-lg overflow-hidden mb-2">
            <div className="p-2 text-sm font-semibold border-b border-gray-700">You</div>
            <div ref={localVideoRef} className="h-48 bg-gray-700 flex items-center justify-center">
              {!isCameraOn && <div className="text-gray-400">Camera is off</div>}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col bg-gray-800 rounded-lg mb-2">
            <div className="p-2 text-sm font-semibold border-b border-gray-700">Class Chat</div>
            <div className="flex-1 overflow-y-auto p-2 text-xs">
              {messages.map((msg, index) => (
                <div key={index} className="mb-1">
                  <span className={`text-xs ${msg.senderId === 'You' ? 'text-blue-400' : 'text-gray-400'}`}>
                    {msg.senderId} - {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-gray-700 flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 bg-gray-700 text-white p-1 rounded-l text-sm"
                placeholder="Type a message..."
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 px-3 rounded-r text-sm"
              >
                Send
              </button>
            </div>
          </div>

          {/* Student Notes */}
          <div className="flex-1 flex flex-col bg-gray-800 rounded-lg">
            <div className="p-2 text-sm font-semibold border-b border-gray-700">My Notes</div>
            <textarea
              value={studentNotes}
              onChange={(e) => setStudentNotes(e.target.value)}
              className="flex-1 bg-gray-900 text-white p-2 text-sm resize-none"
              placeholder="Take your own notes..."
            />
            <div className="p-2 border-t border-gray-700">
              <button
                onClick={saveStudentNotes}
                className="w-full bg-green-600 py-1 rounded text-sm"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLiveClass;