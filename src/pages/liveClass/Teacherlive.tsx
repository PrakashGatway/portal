// src/components/teacher/TeacherLiveClass.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import AgoraRTC, {
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ILocalVideoTrack,
  IAgoraRTCClient,
} from 'agora-rtc-sdk-ng';
import AgoraRTM, { RtmClient, RtmChannel } from 'agora-rtm-sdk';
import ReactPlayer from 'react-player';
import { WindowManager } from '@netless/window-manager';
import { WhiteWebSdk } from 'white-web-sdk';
import { toast } from 'react-toastify';

// Replace with your actual App ID and token generation logic
const AGORA_APP_ID = "6147232a6d8e42aebaf649bdc11fc387";
const AGORA_TOKEN = "007eJxTYLja/XB3ucju5X07Z8z7FSzVMnFK+QHj6KteWpPqyqNW1hgoMJgZmpgbGRslmqVYpJoYJaYmJaaZmVgmpSQbGqYlG1uYC93dlNEQyMhw8L4PCyMDBIL4zAwGBhYMDACq7iAm"; // Use null for testing, or fetch from backend

const TeacherLiveClass = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  // Agora Refs
  const rtcRef = useRef({
    client: null,
    localAudioTrack: null,
    localVideoTrack: null,
    screenShareTrack: null,
  });

  const rtmRef = useRef({
    client: null,
    channel: null,
  });

  // UI Refs
  const localVideoRef = useRef(null);
  const remoteContainerRef = useRef(null);
  const whiteboardContainerRef = useRef(null);

  // State
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isWhiteboardActive, setIsWhiteboardActive] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const [notes, setNotes] = useState('');
  const [whiteboardManager, setWhiteboardManager] = useState(null);
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
            const playerId = `remote-player-${user.uid}`;
            let playerContainer = document.getElementById(playerId);
            if (!playerContainer) {
              playerContainer = document.createElement('div');
              playerContainer.id = playerId;
              playerContainer.className = 'remote-player';
              if (remoteContainerRef.current) {
                remoteContainerRef.current.appendChild(playerContainer);
              }
            }
            remoteVideoTrack.play(playerContainer);
          }
          if (mediaType === 'audio') {
            const remoteAudioTrack = user.audioTrack;
            remoteAudioTrack.play();
          }
        });

        rtcRef.current.client.on('user-unpublished', (user) => {
          const playerContainer = document.getElementById(`remote-player-${user.uid}`);
          if (playerContainer && remoteContainerRef.current) {
            remoteContainerRef.current.removeChild(playerContainer);
          }
        });

        // --- Agora RTM Setup ---
        // rtmRef.current.client = AgoraRTM.createInstance(AGORA_APP_ID);
        // await rtmRef.current.client.login({ uid: 'teacher', token: "007eJxTYOhceSgt9PxG4xA1Vv75X44cvGm5y8Ggqmy3olkjl9j+Y3MUGMwMTcyNjI0SzVIsUk2MElOTEtPMTCyTUpINDdOSjS3M2+9uymgIZGRgca9lYWRgZWBkYGIA8RkYAHBJHS8=" }); // Use RTM token if needed
        // rtmRef.current.channel = rtmRef.current.client.createChannel(classId);
        // await rtmRef.current.channel.join();

        // rtmRef.current.channel.on('ChannelMessage', (message, senderId) => {
        //   setMessages((prev) => [...prev, { text: message.text, senderId, timestamp: new Date() }]);
        // });

        // rtmRef.current.channel.on('MemberJoined', (memberId) => {
        //   setParticipants((prev) => [...prev, memberId]);
        //   toast.info(`Student ${memberId} joined`);
        // });

        // rtmRef.current.channel.on('MemberLeft', (memberId) => {
        //   setParticipants((prev) => prev.filter((id) => id !== memberId));
        //   toast.info(`Student ${memberId} left`);
        // });

        // --- Create and Publish Local Tracks ---
        [rtcRef.current.localAudioTrack, rtcRef.current.localVideoTrack] = await Promise.all([
          AgoraRTC.createMicrophoneAudioTrack(),
          AgoraRTC.createCameraVideoTrack(),
        ]);

        if (localVideoRef.current) {
          rtcRef.current.localVideoTrack.play(localVideoRef.current);
        }

        const token = await fetchToken(classId, 'teacher');
        await rtcRef.current.client.join(AGORA_APP_ID, classId, token, 'teacher');
        await rtcRef.current.client.publish([rtcRef.current.localAudioTrack, rtcRef.current.localVideoTrack]);

        setIsJoined(true);
        toast.success('Live class started successfully!');
      } catch (error) {
        console.error('Agora initialization error:', error);
        toast.error(`Failed to start class: ${error.message}`);
      }
    };

    initAgora();

    return () => {
      const cleanup = async () => {
        try {
          rtcRef.current.localAudioTrack?.close();
          rtcRef.current.localVideoTrack?.close();
          rtcRef.current.screenShareTrack?.close();
          await rtcRef.current.client?.leave();
          await rtmRef.current.channel?.leave();
          await rtmRef.current.client?.logout();
          setIsJoined(false);
          if (remoteContainerRef.current) {
            remoteContainerRef.current.innerHTML = '';
          }
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      };
      cleanup();
    };
  }, [classId, fetchToken]);

  // Initialize Whiteboard
  useEffect(() => {
    if (isWhiteboardActive && whiteboardContainerRef.current && !whiteboardManager) {
      const initWhiteboard = async () => {
        try {
          // In a real app, get these from your backend
          const sdkToken = 'NETLESSSDK_YWs9Sl9FTElWS1FieFpFRGk5bCZub25jZT01YWFhNDNjMC04NTkzLTExZjAtYWI1Ni02MTU0MDYzMjk5NmUmcm9sZT0wJnNpZz00MzU0ZjA3MjQ1ZTU5OGYxYTJhNjVlNDhmYjMxNThlOGNkZTdmNmM2ZTI0YTBmOGI4YWUwZjMwY2E5MDc1ZmU2'; // Replace with your White SDK Token
          const roomId = classId; // Use classId as roomId
          const roomUUID = 'ROOM_UUID'; // Replace with actual room UUID from your backend
          const userUID = 'teacher';

          const whiteWebSdk = new WhiteWebSdk({
            appIdentifier: sdkToken,
            useMobXState: true,
          });

          const room = await whiteWebSdk.joinRoom({
            uuid: roomUUID,
            roomToken: AGORA_TOKEN, // Replace with actual room token from your backend
            userPayload: {
              uid: userUID,
              nickName: 'Teacher',
            },
            floatBar: true,
            disableNewPencil: false,
            hotKeys: true,
          });

          const manager = new WindowManager();
          await manager.bindContainer(whiteboardContainerRef.current, room);
          manager.setViewMode('broadcaster');
          setWhiteboardManager(manager);
        } catch (error) {
          console.error('Whiteboard initialization error:', error);
          toast.error('Failed to initialize whiteboard');
          setIsWhiteboardActive(false);
        }
      };

      initWhiteboard();
    }

    return () => {
      if (whiteboardManager) {
        whiteboardManager.destroy();
        setWhiteboardManager(null);
        if (whiteboardContainerRef.current) {
          whiteboardContainerRef.current.innerHTML = '';
        }
      }
    };
  }, [isWhiteboardActive, classId, whiteboardManager]);

  // Toggle Camera
  const toggleCamera = async () => {
    if (rtcRef.current.localVideoTrack) {
      try {
        if (isCameraOn) {
          await rtcRef.current.localVideoTrack.setMuted(true);
        } else {
          await rtcRef.current.localVideoTrack.setMuted(false);
        }
        setIsCameraOn(!isCameraOn);
      } catch (error) {
        toast.error('Failed to toggle camera');
      }
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

  // Share Screen
  const shareScreen = async () => {
    if (!rtcRef.current.client) return;

    try {
      if (!isScreenSharing) {
        // Start screen sharing
        rtcRef.current.screenShareTrack = await AgoraRTC.createScreenVideoTrack(
          { optimizationMode: 'motion' },
          'auto'
        );

        await rtcRef.current.client.unpublish([rtcRef.current.localVideoTrack]);
        rtcRef.current.localVideoTrack.close();
        await rtcRef.current.client.publish([rtcRef.current.screenShareTrack]);

        rtcRef.current.screenShareTrack.on('track-ended', async () => {
          if (rtcRef.current.client && rtcRef.current.screenShareTrack) {
            await rtcRef.current.client.unpublish([rtcRef.current.screenShareTrack]);
            rtcRef.current.screenShareTrack.close();
            rtcRef.current.screenShareTrack = null;

            // Re-publish camera
            rtcRef.current.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
            if (localVideoRef.current) {
              rtcRef.current.localVideoTrack.play(localVideoRef.current);
            }
            await rtcRef.current.client.publish([rtcRef.current.localVideoTrack]);
          }
          setIsScreenSharing(false);
        });

        setIsScreenSharing(true);
        toast.info('Screen sharing started');
      } else {
        // Stop screen sharing
        if (rtcRef.current.screenShareTrack) {
          await rtcRef.current.client.unpublish([rtcRef.current.screenShareTrack]);
          rtcRef.current.screenShareTrack.close();
          rtcRef.current.screenShareTrack = null;

          // Re-publish camera
          rtcRef.current.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
          if (localVideoRef.current) {
            rtcRef.current.localVideoTrack.play(localVideoRef.current);
          }
          await rtcRef.current.client.publish([rtcRef.current.localVideoTrack]);
        }
        setIsScreenSharing(false);
        toast.info('Screen sharing stopped');
      }
    } catch (error) {
      console.error('Screen sharing error:', error);
      toast.error('Failed to share screen');
    }
  };

  // Send Chat Message
  const sendMessage = async () => {
    if (newMessage.trim() && rtmRef.current.channel) {
      try {
        await rtmRef.current.channel.sendMessage({ text: newMessage });
        setMessages((prev) => [...prev, { text: newMessage, senderId: 'You (Teacher)', timestamp: new Date() }]);
        setNewMessage('');
      } catch (error) {
        toast.error('Failed to send message');
      }
    }
  };

  // Toggle Whiteboard
  const toggleWhiteboard = () => {
    setIsWhiteboardActive(!isWhiteboardActive);
  };

  // Save Notes
  const saveNotes = () => {
    // Implement note saving logic (e.g., send to backend)
    console.log('Saving notes:', notes);
    toast.success('Notes saved locally');
  };

  // End Class
  const endClass = async () => {
    try {
      await rtcRef.current.client?.leave();
      await rtmRef.current.channel?.leave();
      await rtmRef.current.client?.logout();
      toast.info('Class ended');
      navigate('/dashboard'); // Adjust navigation
    } catch (error) {
      toast.error('Error ending class');
    }
  };

  // Toggle Fullscreen for Local Video
  const toggleFullscreen = () => {
    if (!localVideoRef.current) return;

    if (!isFullscreen) {
      if (localVideoRef.current.requestFullscreen) {
        localVideoRef.current.requestFullscreen();
      } else if (localVideoRef.current.mozRequestFullScreen) {
        localVideoRef.current.mozRequestFullScreen();
      } else if (localVideoRef.current.webkitRequestFullscreen) {
        localVideoRef.current.webkitRequestFullscreen();
      } else if (localVideoRef.current.msRequestFullscreen) {
        localVideoRef.current.msRequestFullscreen();
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
            onClick={shareScreen}
            disabled={!isJoined}
            className={`px-3 py-1 rounded text-sm ${isScreenSharing ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            {isScreenSharing ? '🖥️ Stop Share' : '🖥️ Share Screen'}
          </button>
          <button
            onClick={toggleWhiteboard}
            disabled={!isJoined}
            className={`px-3 py-1 rounded text-sm ${isWhiteboardActive ? 'bg-purple-600' : 'bg-gray-700'}`}
          >
            {isWhiteboardActive ? '📝 Hide Board' : '📝 Whiteboard'}
          </button>
          <button
            onClick={endClass}
            disabled={!isJoined}
            className="px-3 py-1 bg-red-600 rounded text-sm"
          >
            End Class
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video Area */}
        <div className={`${isWhiteboardActive ? 'w-1/2' : 'w-2/3'} flex flex-col pr-2`}>
          <div className="relative flex-1 bg-black rounded-lg overflow-hidden">
            {/* Local Video with Fullscreen Toggle */}
            <div className="relative h-1/3 bg-gray-800 rounded m-1">
              <div ref={localVideoRef} className="w-full h-full" />
              <button
                onClick={toggleFullscreen}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded"
              >
                {isFullscreen ? '⇲' : '⛶'}
              </button>
              <div className="absolute bottom-2 left-2 text-xs bg-black bg-opacity-50 px-1 rounded">
                You (Teacher)
              </div>
            </div>

            {/* Remote Videos */}
            <div
              ref={remoteContainerRef}
              className="h-2/3 overflow-y-auto p-1 flex flex-wrap"
            >
              {participants.length === 0 && (
                <div className="text-gray-400 w-full text-center py-10">
                  Waiting for students...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Whiteboard Area */}
        {isWhiteboardActive && (
          <div className="w-1/2 pl-2 flex flex-col">
            <div className="flex-1 bg-white rounded-lg overflow-hidden">
              <div
                ref={whiteboardContainerRef}
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {/* Sidebar (Chat & Notes) */}
        <div className="w-1/3 pl-2 flex flex-col">
          {/* Chat */}
          <div className="flex-1 flex flex-col bg-gray-800 rounded-lg mb-2">
            <div className="p-2 font-semibold border-b border-gray-700">Chat</div>
            <div className="flex-1 overflow-y-auto p-2 text-sm">
              {messages.map((msg, index) => (
                <div key={index} className="mb-1">
                  <span className="text-gray-400 text-xs">
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

          {/* Notes */}
          <div className="flex-1 flex flex-col bg-gray-800 rounded-lg">
            <div className="p-2 font-semibold border-b border-gray-700">Class Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 bg-gray-900 text-white p-2 text-sm resize-none"
              placeholder="Take notes during class..."
            />
            <div className="p-2 border-t border-gray-700">
              <button
                onClick={saveNotes}
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

export default TeacherLiveClass;