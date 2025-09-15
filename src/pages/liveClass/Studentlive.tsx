// src/components/student/StudentLiveClass.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import AgoraRTC from 'agora-rtc-sdk-ng';
import AgoraRTM from 'agora-rtm-sdk';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/UserContext';
import api from '../../axiosInstance';

const AGORA_APP_ID = "6147232a6d8e42aebaf649bdc11fc387";

const StudentLiveClass = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id"); // Main class/channel ID
  const instructorId = searchParams.get("inst"); // Instructor UID for RTM

  // Refs for main class session
  const rtcRef = useRef({
    client: null,
  }) as any;

  const rtmRef = useRef({
    client: null,
    channel: null,
  }) as any;

  // Refs for PiP session
  const pipRtcRef = useRef({
    client: null,
  }) as any;

  const remoteContainerRef = useRef(null) as any;
  const pipVideoRef = useRef(null) as any; // Ref for the PiP video container

  const [isJoined, setIsJoined] = useState(false); // Main class joined
  const [isPipJoined, setIsPipJoined] = useState(false); // PiP channel joined
  const [messages, setMessages] = useState([]) as any;
  const [newMessage, setNewMessage] = useState('') as any;
  const [showSidebar, setShowSidebar] = useState(true);
  const [joinStatus, setJoinStatus] = useState('idle'); // idle, requesting, approved, rejected
  const [participants, setParticipants] = useState([]) as any;
  const [agoraToken, setAgoraToken] = useState({ rtcToken: null, rtmToken: null }) as any;
  const [pipAgoraToken, setPipAgoraToken] = useState({ rtcToken: null }) as any; // Token for PiP channel
  const { user: userInfo } = useAuth() as any;

  // --- Main Class Token Fetching ---
  const fetchToken = useCallback(async () => {
    if (!id || !userInfo?._id) {
      toast.error("Unable to initialize class session.");
      return;
    }
    try {
      const response = await api.get(`/tokens/${id}/${userInfo?._id}`);
      setAgoraToken(response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch main Agora tokens:", error);
      toast.error("Failed to initialize class session. Please try again.");
    }
  }, [id, userInfo?._id]);

  // --- PiP Channel Token Fetching ---
  const fetchPipToken = useCallback(async () => {
    if (!id || !userInfo?._id) {
      toast.error("Unable to initialize PiP session.");
      return;
    }
    try {
      // Fetch token for the PiP channel (${id}_pip) and user ID (${userInfo?._id}_pip)
      const response = await api.get(`/tokens/${id}_pip/${userInfo?._id}_pip`);
      setPipAgoraToken(response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch PiP Agora token:", error);
      // Don't show error toast here as PiP is optional, just log
    }
  }, [id, userInfo?._id]);

  // --- Main Class Agora & RTM Initialization ---
  const initAgoraAndRTM = useCallback(async (tokens: any) => {
    if (!tokens || !tokens.rtcToken || !tokens.rtmToken) {
      toast.error("Session tokens are invalid.");
      return;
    }

    try {
      // --- Main RTC Client ---
      rtcRef.current.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      rtcRef.current.client.on('user-published', async (user: any, mediaType: any) => {
         // Handle main instructor stream (non-PiP)
        await rtcRef.current.client.subscribe(user, mediaType);
        const playerId = `remote-player-${user.uid}-${mediaType}`;
        let playerContainer = document.getElementById(playerId);
        if (!playerContainer) {
          playerContainer = document.createElement('div');
          playerContainer.id = playerId;
          playerContainer.className = 'remote-player w-full h-full block overflow-hidden absolute inset-0';
          if (remoteContainerRef.current) {
             remoteContainerRef.current.innerHTML = ''; // Clear for main stream
             remoteContainerRef.current.appendChild(playerContainer);
          }
        }
        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack;
          remoteVideoTrack.play(playerContainer, { fit: "contain" });
        }
        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack;
          remoteAudioTrack.play();
        }
      });

      rtcRef.current.client.on('user-unpublished', (user: any) => {
        // Handle main stream unpublished
        const playerContainerVideo = document.getElementById(`remote-player-${user.uid}-video`);
        // const playerContainerAudio = document.getElementById(`remote-player-${user.uid}-audio`); // Not used directly
        if (playerContainerVideo && remoteContainerRef.current) {
          remoteContainerRef.current.removeChild(playerContainerVideo);
        }
      });

      // --- RTM Initialization ---
      if (rtmRef.current.client || rtmRef.current.channel) {
        const oldClient = rtmRef.current.client;
        const oldChannel = rtmRef.current.channel;
        oldClient?.removeAllListeners('MessageFromPeer');
        oldChannel?.removeAllListeners('ChannelMessage');
        oldChannel?.removeAllListeners('MemberJoined');
        oldChannel?.removeAllListeners('MemberLeft');
        try {
          await oldChannel?.leave();
        } catch (e) {
          console.warn("Error leaving old RTM channel:", e);
        }
        try {
          await oldClient?.logout();
        } catch (e) {
          console.warn("Error logging out of old RTM client:", e);
        }
        rtmRef.current.channel = null;
        rtmRef.current.client = null;
      }

      rtmRef.current.client = AgoraRTM.createInstance(AGORA_APP_ID);
      await rtmRef.current.client.login({
        uid: userInfo?._id,
        token: tokens.rtmToken
      });

      rtmRef.current.client.on('MessageFromPeer', (message: any, peerId: string) => {
        if (peerId === instructorId) {
          try {
            const data = JSON.parse(message.text);
            if (data.type === 'join_approved') {
              setJoinStatus('approved');
              toast.success('Join request approved! Connecting to class...');
            } else if (data.type === 'join_rejected') {
              setJoinStatus('rejected');
              toast.error('Your join request was rejected by the instructor.');
            }
          } catch (e) {
            console.error("Error parsing peer message:", e);
          }
        }
      });

    } catch (error) {
      toast.error(`Failed to initialize class session: ${error.message}`);
      rtmRef.current.channel = null;
      rtmRef.current.client = null;
    }
  }, [instructorId, userInfo?._id]); // Added `id` dependency

  const initAndJoinPipChannel = useCallback(async (pipTokens: any) => {
    if (!pipTokens || !pipTokens.rtcToken || !id || !userInfo?._id) {
      console.warn("PiP tokens or IDs missing, cannot join PiP channel.");
      return;
    }

    try {
       if (pipRtcRef.current.client) {
        try {
            await pipRtcRef.current.client.leave();
        } catch (e) {
            console.warn("Error leaving previous PiP client:", e);
        }
        pipRtcRef.current.client = null;
       }

      pipRtcRef.current.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      pipRtcRef.current.client.on('user-published', async (user: any, mediaType: any) => {
        const isPipStream = user.uid === `${instructorId}_pip`; // Teacher uses ${user._id}_pip as UID
        if (isPipStream && mediaType === 'video') {
            await pipRtcRef.current.client.subscribe(user, mediaType);
            const remoteVideoTrack = user.videoTrack;
            if (pipVideoRef.current) {
                pipVideoRef.current.innerHTML = ''; // Clear previous content
                remoteVideoTrack.play(pipVideoRef.current, { fit: "cover" });
                (pipVideoRef.current as HTMLElement).style.display = 'block';
            }
        }
      });

      pipRtcRef.current.client.on('user-unpublished', (user: any) => {
        const isPipStream = user.uid === `${instructorId}_pip`;

        if (isPipStream) {
            if (pipVideoRef.current) {
                pipVideoRef.current.innerHTML = '';
                (pipVideoRef.current as HTMLElement).style.display = 'none'; // Hide container
            }
            setIsPipJoined(false); // Update state if needed
        }
      });

      await pipRtcRef.current.client.join(AGORA_APP_ID, `${id}_pip`, pipTokens.rtcToken, `${userInfo?._id}_pip`);
      setIsPipJoined(true);
      console.log("Successfully joined PiP channel");
    } catch (error) {
      console.error("Failed to initialize or join PiP channel:", error);
      setIsPipJoined(false);
      if (pipRtcRef.current.client) {
        try {
            await pipRtcRef.current.client.leave();
        } catch (e) {
            console.warn("Error leaving PiP client after error:", e);
        }
        pipRtcRef.current.client = null;
      }
    }
  }, [id, userInfo?._id]);

  const joinRTMChannel = useCallback(async () => {
    if (!rtmRef.current.client || !id || rtmRef.current.channel) {
      return;
    }
    try {
      const newChannel = rtmRef.current.client.createChannel(id);
      rtmRef.current.channel = newChannel;

      const handleChannelMessage = (message: any, senderId: string) => {
        if (senderId === userInfo?._id) return;
        try {
          const data = JSON.parse(message.text);
          if (data.type === 'chat') {
            setMessages((prev: any) => [...prev, {
              text: data.text,
              senderId: data.name || senderId,
              timestamp: new Date()
            }]);
          }
        } catch (e) {
          setMessages((prev: any) => [...prev, {
            text: message.text,
            senderId: senderId,
            timestamp: new Date()
          }]);
        }
      };

      const handleMemberJoined = (memberId: string) => {
        setParticipants((prev: any) => {
          if (!prev.includes(memberId)) return [...prev, memberId];
          return prev;
        });
      };

      const handleMemberLeft = (memberId: string) => {
        setParticipants((prev: any) => prev.filter((id: string) => id !== memberId));
      };

      newChannel.on('ChannelMessage', handleChannelMessage);
      newChannel.on('MemberJoined', handleMemberJoined);
      newChannel.on('MemberLeft', handleMemberLeft);

      await newChannel.join();
      toast.info("Connected to class chat");
    } catch (error) {
      toast.error("Failed to connect to class chat");
      rtmRef.current.channel = null;
    }
  }, [id, userInfo?._id]);

  const joinMainClass = useCallback(async () => {
    if (joinStatus !== 'approved' || !rtcRef.current.client || !rtmRef.current.client || !agoraToken.rtcToken) {
      return;
    }
    try {
      await rtcRef.current.client.join(AGORA_APP_ID, id, agoraToken.rtcToken, userInfo?._id);
      setIsJoined(true);
      toast.success('Successfully joined the main class!');
      await joinRTMChannel();
    } catch (error) {
      toast.error(`Failed to join main class: ${error.message}`);
    }
  }, [joinStatus, id, userInfo?._id, agoraToken.rtcToken, joinRTMChannel]);

  useEffect(() => {
     if (isJoined && !isPipJoined) {
        const setupPip = async () => {
            const pipTokens = await fetchPipToken();
            if (pipTokens) {
                 initAndJoinPipChannel(pipTokens);
            }
        };
        setupPip();
     }
  }, [isJoined, isPipJoined, fetchPipToken, initAndJoinPipChannel]);

  const requestToJoin = useCallback(async () => {
    if (!userInfo?._id) {
      toast.error('User information not available.');
      return;
    }
    if (!instructorId) {
      toast.error('Instructor information not available.');
      return;
    }
    if (!rtmRef.current.client) {
      toast.error('Messaging service not initialized. Please wait or refresh.');
      return;
    }
    try {
      setJoinStatus('requesting');
      toast.info('Sending join request...');
      await rtmRef.current.client.sendMessageToPeer(
        {
          text: JSON.stringify({
            type: 'join_request',
            name: userInfo?.name || `Student ${userInfo?._id}`,
            userId: userInfo?._id,
            classId: id
          })
        },
        instructorId
      );
      toast.info('Join request sent to instructor.');
    } catch (error) {
      console.error("Failed to send join request:", error);
      toast.error('Failed to send join request. Please try again.');
      setJoinStatus('idle');
    }
  }, [userInfo, instructorId, id]);

  const sendMessage = async () => {
    if (newMessage.trim() && rtmRef.current.channel) {
      try {
        await rtmRef.current.channel.sendMessage({
          text: JSON.stringify({
            type: 'chat',
            text: newMessage,
            name: userInfo?.name || `Student`
          })
        });
        setMessages((prev: any) => [...prev, {
          text: newMessage,
          senderId: 'You',
          timestamp: new Date()
        }]);
        setNewMessage('');
      } catch (error) {
        toast.error('Failed to send message. Please try again.');
      }
    } else if (!rtmRef.current.channel) {
      toast.error('Not connected to chat yet.');
    }
  };

  const leaveClass = async () => {
    try {
      await rtcRef.current.client?.leave();
      await pipRtcRef.current.client?.leave(); // Leave PiP channel too
      toast.info('Left the class');
      navigate('/');
    } catch (error) {
      toast.error('Error leaving class. Please try again.');
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initializeSession = async () => {
      const tokens = await fetchToken();
      if (isMounted && tokens) {
        await initAgoraAndRTM(tokens);
        await requestToJoin(); // Request to join after RTM is set up
      }
    };
    initializeSession();

    return () => {
      isMounted = false;
      const cleanup = async () => {
        try {
          await rtcRef.current.client?.leave();
          await pipRtcRef.current.client?.leave(); // Cleanup PiP client
          const channel = rtmRef.current.channel;
          const client = rtmRef.current.client;
          client?.removeAllListeners('MessageFromPeer');
          channel?.removeAllListeners('ChannelMessage');
          channel?.removeAllListeners('MemberJoined');
          channel?.removeAllListeners('MemberLeft');
          await channel?.leave();
          await client?.logout();
          setIsJoined(false);
          setIsPipJoined(false); // Reset PiP state
          setJoinStatus('idle');
          if (remoteContainerRef.current) {
            remoteContainerRef.current.innerHTML = '';
          }
          // Clear PiP container on cleanup
          if (pipVideoRef.current) {
              pipVideoRef.current.innerHTML = '';
              (pipVideoRef.current as HTMLElement).style.display = 'none';
          }
        } catch (e) {
          console.error('Student Cleanup error:', e);
        }
      };
      cleanup();
    };
  }, [fetchToken, initAgoraAndRTM, requestToJoin]); // Added dependencies

  useEffect(() => {
    if (joinStatus === 'approved' && !isJoined) {
      const timer = setTimeout(() => {
        joinMainClass();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [joinStatus, isJoined, joinMainClass]);

  if (joinStatus !== 'approved' || !isJoined) {
    // ... (Waiting Room UI remains the same)
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] bg-gray-100 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md text-center">
          <div className="mb-6">
            <div className="mx-auto bg-blue-100 dark:bg-blue-900 text-blue-500 dark:text-blue-300 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Waiting Room</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {joinStatus === 'requesting' ? 'Your join request is being processed...' :
                joinStatus === 'rejected' ? 'Your join request was rejected.' :
                  'Preparing your class session...'}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="mb-4">
              {joinStatus === 'requesting' && (
                <div className="flex flex-col items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">Sending request...</span>
                </div>
              )}
              {joinStatus === 'idle' && (
                <span className="text-sm text-gray-500 dark:text-gray-400">Ready to request access.</span>
              )}
              {joinStatus === 'rejected' && (
                <span className="text-sm text-red-500 dark:text-red-400">Access denied.</span>
              )}
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 w-full mb-6">
              <div className="grid grid-cols-2 gap-4 text-left text-sm">
                <div>
                  <p className="font-medium text-gray-500 dark:text-gray-400">Class ID</p>
                  <p className="text-gray-800 dark:text-white truncate">{id || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500 dark:text-gray-400">Instructor</p>
                  <p className="text-gray-800 dark:text-white truncate">{instructorId ? `ID: ${instructorId.substring(0, 8)}...` : 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500 dark:text-gray-400">Your ID</p>
                  <p className="text-gray-800 dark:text-white truncate">{userInfo?._id ? `${userInfo?._id.substring(0, 8)}...` : 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500 dark:text-gray-400">Status</p>
                  <p className={`${
                    joinStatus === 'approved' ? 'text-green-500' :
                    joinStatus === 'rejected' ? 'text-red-500' :
                    joinStatus === 'requesting' ? 'text-yellow-500' :
                    'text-blue-500'
                  }`}>
                    {joinStatus.charAt(0).toUpperCase() + joinStatus.slice(1)}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full">
              <button
                onClick={requestToJoin}
                disabled={joinStatus === 'requesting'}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition duration-300 ${
                  joinStatus === 'requesting'
                    ? 'bg-blue-400 cursor-not-allowed'
                    : joinStatus === 'rejected'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {joinStatus === 'requesting' ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Requesting...
                  </span>
                ) : joinStatus === 'rejected' ? 'Retry Join Request' : 'Request to Join Class'}
              </button>
            </div>
            <button
              onClick={leaveClass}
              className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Leave Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[86vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-md">
        <div className="flex items-center">
          <h1 className="text-xl font-bold mr-4">Live Class</h1>
          <span className="text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
            Live
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={leaveClass}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm flex items-center"
          >
            Leave Class
          </button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 flex flex-col p-2">
          <div className="relative flex-1 bg-black rounded-lg overflow-hidden">
            <div
              ref={remoteContainerRef}
              className="w-full h-full relative bg-gray-800"
            >
              {participants.length === 0 && (
                <div className="text-gray-400 text-center absolute inset-0 flex items-center justify-center">
                  Waiting for instructor's stream...
                </div>
              )}
            </div>
            {/* PiP Video Container */}
            <div
              ref={pipVideoRef}
              className="absolute bottom-4 right-4 w-32 h-32 rounded-full border-4 border-white overflow-hidden z-10 shadow-lg"
              style={{ display: 'none' }} // Initially hidden, controlled by JS
            />
          </div>
        </div>
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="absolute right-4 h-10 w-10 bottom-24 z-20 p-2 rounded-full shadow-lg bg-blue-500 hover:bg-blue-600 text-white"
        >
          {showSidebar ? '◀' : '▶'}
        </button>
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="flex flex-col bg-white dark:bg-gray-800 shadow-xl z-10"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-bold">Classroom Tools</h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-1 rounded-full h-10 w-10 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-6">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <span className="mr-2">👥</span> Participants
                    <span className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {participants.length + 1}
                    </span>
                  </h3>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    <div className="p-2 rounded-lg flex items-center bg-blue-100 dark:bg-blue-900">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2">
                        I
                      </div>
                      <span className="font-medium text-sm">Instructor</span>
                    </div>
                    <div className="p-2 rounded-lg flex items-center bg-purple-100 dark:bg-purple-900">
                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs mr-2">
                        S
                      </div>
                      <span className="font-medium text-sm">
                        You ({`${userInfo?.name}`.trim() || userInfo?.name || `Student`})
                      </span>
                    </div>
                    {participants.filter((p: string) => p !== instructorId && p !== userInfo?._id).map((participant: string) => (
                      <div key={participant} className="p-2 rounded-lg flex items-center bg-gray-100 dark:bg-gray-700">
                        <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs mr-2">
                          S
                        </div>
                        <span className="text-sm truncate">Student {participant.substring(0, 8)}...</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 flex items-center">
                    <span className="mr-2">💬</span> Class Chat
                  </h3>
                  <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex flex-col h-80">
                    <div className="flex-1 overflow-y-auto p-2">
                      {messages.length > 0 ? (
                        messages.map((msg: any, index: number) => (
                          <div key={index} className="mb-2">
                            <div className="text-xs opacity-75 dark:opacity-60">
                              {msg.senderId === 'You' ? 'You' : `Student ${msg.senderId.substring(0, 8)}...`} - {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div
                              className={`p-2 rounded mt-1 text-sm ${
                                msg.senderId === 'You'
                                  ? 'bg-blue-100 dark:bg-blue-900 ml-4'
                                  : 'bg-gray-200 dark:bg-gray-600 mr-4'
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-sm opacity-75 dark:opacity-60">
                          No messages yet. Start a conversation!
                        </div>
                      )}
                    </div>
                    <div className="p-2 border-t border-gray-200 dark:border-gray-600 flex">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-1 p-1 text-sm rounded-l bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white"
                        placeholder="Type a message..."
                      />
                      <button
                        onClick={sendMessage}
                        className="px-3 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-r"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StudentLiveClass;