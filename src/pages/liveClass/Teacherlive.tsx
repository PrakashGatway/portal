import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import AgoraRTC from 'agora-rtc-sdk-ng';
import AgoraRTM from 'agora-rtm-sdk';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../axiosInstance';
import { useAuth } from '../../context/UserContext';

const AGORA_APP_ID = "6147232a6d8e42aebaf649bdc11fc387";

const TeacherLiveClass = () => {
  const { classId } = useParams();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const navigate = useNavigate();

  const rtcRef = useRef({
    client: null,
    localAudioTrack: null,
    localVideoTrack: null,
    screenShareTrack: null,
  }) as any;

  const rtmRef = useRef({
    client: null,
    channel: null,
  }) as any;

  const pipRtcRef = useRef({
    client: null,
    localVideoTrack: null,
  }) as any;

  const localVideoRef = useRef(null) as any;
  const remoteContainerRef = useRef(null) as any;
  const screenSharePreviewRef = useRef(null) as any; // Ref for the preview during screen share

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [messages, setMessages] = useState([]) as any;
  const [newMessage, setNewMessage] = useState('');
  const [joinRequests, setJoinRequests] = useState([]) as any;
  const [participants, setParticipants] = useState([]) as any; // List of connected student UIDs
  const [showSidebar, setShowSidebar] = useState(true);
  const [agoraToken, setAgoraToken] = useState() as any;
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchToken = async () => {
    setLoading(true);
    try {
      const confirmed = await window.confirm("Do you want to start the class?");
      if (!confirmed) {
        navigate("/");
        return;
      }
      const response = await api.get(`/tokens/${id}/${user?._id}`);
      setAgoraToken(response.data);
      initAgora(response.data);
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchToken();
  }, []);


  const initAgora = async (agoraToken: any) => {

    if (!AGORA_APP_ID || !classId || !agoraToken.rtcToken || !agoraToken.rtmToken) {
      toast.error('Missing App ID, Class ID or Tokens');
      return;
    }

    try {
      rtcRef.current.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

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
        }
        try {
          await oldClient?.logout();
        } catch (e) {
        }
        rtmRef.current.channel = null;
        rtmRef.current.client = null;
      }
      if (agoraToken?.rtmToken === null) {
        toast.error('Missing Token');
        return;
      }
      rtmRef.current.client = AgoraRTM.createInstance(AGORA_APP_ID);
      await rtmRef.current.client.login({ uid: user._id, token: agoraToken?.rtmToken });
      rtmRef.current.channel = rtmRef.current.client.createChannel(id);
      await rtmRef.current.channel.join();

      rtmRef.current.channel.on('ChannelMessage', (message, senderId) => {
        try {
          const data = JSON.parse(message.text);
          if (data.type === 'join_request') {
            setJoinRequests(prev => [...prev, { uid: senderId, name: data.name || `Student ${senderId}` }]);
          } else if (data.type === 'chat') {
            setMessages(prev => [...prev, { text: data.text, senderId: data.name || senderId, timestamp: new Date() }]);
          }
        } catch (e) {
          setMessages(prev => [...prev, { text: message.text, senderId, timestamp: new Date() }]);
        }
      });

      rtmRef.current.channel.on('MemberJoined', (memberId) => {
        setParticipants(prev => {
          if (!prev.includes(memberId)) return [...prev, memberId];
          return prev;
        });
        toast.info(`Student ${memberId} connected`);
      });

      rtmRef.current.channel.on('MemberLeft', (memberId) => {
        setParticipants(prev => prev.filter(id => id !== memberId));
        toast.info(`Student ${memberId} disconnected`);
      });

      rtmRef.current.client.on('MessageFromPeer', (message, peerId) => {
        const data = JSON.parse(message.text);
        if (data.type === 'join_request') {
          setJoinRequests(prev => [...prev, { uid: peerId, name: data.name || `Student ${peerId}` }]);
        }
      });

      [rtcRef.current.localAudioTrack, rtcRef.current.localVideoTrack] = await Promise.all([
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack(),
      ]);

      if (localVideoRef.current && rtcRef.current.localVideoTrack) {
        rtcRef.current.localVideoTrack.play(localVideoRef.current);
      }

      await rtcRef.current.client.join(AGORA_APP_ID, id, agoraToken?.rtcToken, user._id);
      await rtcRef.current.client.publish([rtcRef.current.localAudioTrack, rtcRef.current.localVideoTrack]);

      setIsJoined(true);
      toast.success('Live class started successfully!');

    } catch (error) {
      toast.error(`Failed to start class: ${error.message}`);
      try {
        await rtcRef.current.client?.leave();
        await rtmRef.current.channel?.leave();
        await rtmRef.current.client?.logout();
      } catch (cleanupError) {
        console.error("Cleanup error after init failure:", cleanupError);
      }
    }
  };

  useEffect(() => {
    if (!AGORA_APP_ID || !classId || !agoraToken?.rtcToken || !agoraToken?.rtmToken) {
      return;
    }
    initAgora(agoraToken);

    return () => {
      const cleanup = async () => {
        try {
          rtcRef.current.localAudioTrack?.close();
          rtcRef.current.localVideoTrack?.close();
          rtcRef.current.screenShareTrack?.close();
          await rtcRef.current.client?.leave();
          const channel = rtmRef.current.channel;
          const client = rtmRef.current.client;
          client?.removeAllListeners('MessageFromPeer');
          channel?.removeAllListeners('ChannelMessage');
          channel?.removeAllListeners('MemberJoined');
          channel?.removeAllListeners('MemberLeft');
          await channel?.leave();
          await client?.logout();
          setIsJoined(false);
          if (remoteContainerRef.current) {
            remoteContainerRef.current.innerHTML = '';
          }
        } catch (e) {
          console.error('Teacher Cleanup error:', e);
        }
      };
      cleanup();
    };
  }, []);

  const toggleCamera = async () => {
    if (rtcRef.current.localVideoTrack && !isScreenSharing) { // Only toggle if not screen sharing
      try {
        if (isCameraOn) {
          await rtcRef.current.localVideoTrack.setMuted(true);
        } else {
          await rtcRef.current.localVideoTrack.setMuted(false);
        }
        setIsCameraOn(!isCameraOn);
        toast.info(`Camera ${isCameraOn ? 'muted' : 'unmuted'}`);
      } catch (error) {
        toast.error('Failed to toggle camera');
      }
    } else if (isScreenSharing) {
      toast.info("Cannot toggle camera while screen sharing.");
    }
  };

  const toggleMic = async () => {
    if (rtcRef.current.localAudioTrack) {
      try {
        if (isMicOn) {
          await rtcRef.current.localAudioTrack.setMuted(true);
        } else {
          await rtcRef.current.localAudioTrack.setMuted(false);
        }
        setIsMicOn(!isMicOn);
        toast.info(`Microphone ${isMicOn ? 'muted' : 'unmuted'}`);
      } catch (error) {
        toast.error('Failed to toggle microphone');
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!rtcRef.current.client) return;

    try {
      if (!isScreenSharing) {
        rtcRef.current.screenShareTrack = await AgoraRTC.createScreenVideoTrack(
          { optimizationMode: 'motion' },
          'auto'
        );

        if (pipRtcRef.current.localVideoTrack) {
          await pipRtcRef.current.client.unpublish([pipRtcRef.current.localVideoTrack]);
          pipRtcRef.current.localVideoTrack.close();
          pipRtcRef.current.localVideoTrack = null;
        }
        if (rtcRef.current.localVideoTrack) {
          await rtcRef.current.client.unpublish([rtcRef.current.localVideoTrack]);
          rtcRef.current.localVideoTrack.close();
          rtcRef.current.localVideoTrack = null;
          if (localVideoRef.current) {
            localVideoRef.current.innerHTML = '';
          }
        }

        await rtcRef.current.client.publish([rtcRef.current.screenShareTrack]);

        const response = await api.get(`/tokens/${id}_pip/${user?._id}_pip`);
        pipRtcRef.current.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

        await pipRtcRef.current.client.join(AGORA_APP_ID, `${id}_pip`, response.data.rtcToken, `${user._id}_pip`);

        pipRtcRef.current.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
        await pipRtcRef.current.client.publish([pipRtcRef.current.localVideoTrack]);

        rtcRef.current.screenShareTrack.on('track-ended', async () => {
          if (rtcRef.current.client && rtcRef.current.screenShareTrack) {
            try {
              await rtcRef.current.client.unpublish([rtcRef.current.screenShareTrack]);
            } catch (unpublishError) {
              console.error("Error unpublishing screen share track:", unpublishError);
            }
            rtcRef.current.screenShareTrack.close();
            rtcRef.current.screenShareTrack = null;

            if (pipRtcRef.current.client) {
              if (pipRtcRef.current.localVideoTrack) {
                await pipRtcRef.current.client.unpublish([pipRtcRef.current.localVideoTrack]);
                pipRtcRef.current.localVideoTrack.close();
                pipRtcRef.current.localVideoTrack = null;
              }
              await pipRtcRef.current.client.leave();
              pipRtcRef.current.client = null;
            }

            try {
              rtcRef.current.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
              if (localVideoRef.current) {
                rtcRef.current.localVideoTrack.play(localVideoRef.current);
              }
              await rtcRef.current.client.publish([rtcRef.current.localVideoTrack]);
              setIsCameraOn(true); // Assume camera is on after re-publishing
            } catch (cameraError) {
              console.error("Error re-publishing camera after screen share:", cameraError);
              toast.error("Failed to restart camera after screen share.");
              setIsCameraOn(false);
            }
          }
          setIsScreenSharing(false);
          toast.info('Screen sharing stopped by user');
        });

        setIsScreenSharing(true);
        toast.info('Screen sharing started');

        if (!rtcRef.current.localVideoTrack) { // Recreate if it was closed
          rtcRef.current.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
        }
        if (screenSharePreviewRef.current) {
          screenSharePreviewRef.current.innerHTML = '';
          rtcRef.current.localVideoTrack.play(screenSharePreviewRef.current, { fit: "cover" });
          screenSharePreviewRef.current.style.display = 'block'; // Make sure it's visible
        }

      } else {
        if (rtcRef.current.screenShareTrack) {
          await rtcRef.current.client.unpublish([rtcRef.current.screenShareTrack]);
          rtcRef.current.screenShareTrack.close();
          rtcRef.current.screenShareTrack = null;
        }

        if (pipRtcRef.current.client) {
          if (pipRtcRef.current.localVideoTrack) {
            await pipRtcRef.current.client.unpublish([pipRtcRef.current.localVideoTrack]);
            pipRtcRef.current.localVideoTrack.close();
            pipRtcRef.current.localVideoTrack = null;
          }
          await pipRtcRef.current.client.leave();
          pipRtcRef.current.client = null;
        }

        if (screenSharePreviewRef.current) {
          screenSharePreviewRef.current.style.display = 'none';
          screenSharePreviewRef.current.innerHTML = ''; // Clear the preview
        }
        if (rtcRef.current.localVideoTrack) {
          rtcRef.current.localVideoTrack.close();
          rtcRef.current.localVideoTrack = null;
        }

        rtcRef.current.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
        if (localVideoRef.current) {
          rtcRef.current.localVideoTrack.play(localVideoRef.current);
        }
        await rtcRef.current.client.publish([rtcRef.current.localVideoTrack]);
        setIsCameraOn(true);

        setIsScreenSharing(false);
        toast.info('Screen sharing stopped');
      }
    } catch (error) {
      console.error('Screen sharing error:', error);
      toast.error('Failed to share screen');
      setIsScreenSharing(false);
      if (screenSharePreviewRef.current) {
        screenSharePreviewRef.current.style.display = 'none';
      }
    }
  };

  const toggleScreenSha = async () => {
    if (!rtcRef.current.client) return;

    try {
      if (!isScreenSharing) {
        const screenShareConfig = {
          optimizationMode: 'motion',
          audio: 'auto' // Or true, or { microphone: false } to exclude mic if system audio is captured
        };
        let screenTracksRaw = await AgoraRTC.createScreenVideoTrack(screenShareConfig, 'auto'); // 'auto' for audio parameter here as well
        let screenTracksArray = Array.isArray(screenTracksRaw) ? screenTracksRaw : [screenTracksRaw];
        rtcRef.current.screenShareTrack = null; // Main screen share video track
        let screenShareAudioTrack = null;
        for (const track of screenTracksArray) {
          if (track.trackMediaType === 'video') {
            rtcRef.current.screenShareTrack = track;
          } else if (track.trackMediaType === 'audio') {
            screenShareAudioTrack = track;
          }
        }
        if (!rtcRef.current.screenShareTrack) {
          throw new Error("Failed to create screen share video track.");
        }

        if (rtcRef.current.localVideoTrack) {
          await rtcRef.current.client.unpublish([rtcRef.current.localVideoTrack]);
          rtcRef.current.localVideoTrack.close();
          rtcRef.current.localVideoTrack = null;
          if (localVideoRef.current) {
            localVideoRef.current.innerHTML = ''; // Clear the main video div
          }
        }
        if (rtcRef.current.localAudioTrack) {
          await rtcRef.current.client.unpublish([rtcRef.current.localAudioTrack]);
        }
        const tracksToPublish = [rtcRef.current.screenShareTrack];
        if (screenShareAudioTrack) {
          tracksToPublish.push(screenShareAudioTrack);
        }
        if (rtcRef.current.localAudioTrack) {
          tracksToPublish.push(rtcRef.current.localAudioTrack);
        }
        await rtcRef.current.client.publish(tracksToPublish);
        rtcRef.current.screenShareTrack.on('track-ended', async () => {
          if (rtcRef.current.client && rtcRef.current.screenShareTrack) {
            const tracksToUnpublish = [rtcRef.current.screenShareTrack];
            if (screenShareAudioTrack) {
              tracksToUnpublish.push(screenShareAudioTrack);
            }
            if (rtcRef.current.localAudioTrack) {
              tracksToUnpublish.push(rtcRef.current.localAudioTrack);
            }
            try {
              await rtcRef.current.client.unpublish(tracksToUnpublish);
            } catch (unpublishError) {
              console.error("Error unpublishing screen share tracks:", unpublishError);
            }
            rtcRef.current.screenShareTrack.close();
            rtcRef.current.screenShareTrack = null;
            if (screenShareAudioTrack) {
              screenShareAudioTrack.close();
              screenShareAudioTrack = null;
            }
            try {
              if (!rtcRef.current.localAudioTrack) {
                rtcRef.current.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                if (!isMicOn) {
                  await rtcRef.current.localAudioTrack.setMuted(true);
                }
              }
              rtcRef.current.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
              if (!isCameraOn) {
                await rtcRef.current.localVideoTrack.setMuted(true);
              }

              if (localVideoRef.current) {
                rtcRef.current.localVideoTrack.play(localVideoRef.current);
              }
              await rtcRef.current.client.publish([rtcRef.current.localVideoTrack, rtcRef.current.localAudioTrack]);
            } catch (cameraOrMicError) {
              toast.error("Failed to restart camera/mic after screen share.");
              setIsCameraOn(false);
            }
          }
          setIsScreenSharing(false);
          if (screenSharePreviewRef.current) {
            screenSharePreviewRef.current.style.display = 'none';
            screenSharePreviewRef.current.innerHTML = ''; // Clear the preview
          }
          toast.info('Screen sharing stopped by user');
        });

        setIsScreenSharing(true);
        toast.info('Screen sharing started (attempting system audio capture)');
        if (!rtcRef.current.localAudioTrack) {
          rtcRef.current.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          if (!isMicOn) {
            await rtcRef.current.localAudioTrack.setMuted(true);
          }
        }
        if (!rtcRef.current.localVideoTrack) { // Recreate if it was closed (shouldn't be if logic is sound)
          rtcRef.current.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
          if (!isCameraOn) {
            await rtcRef.current.localVideoTrack.setMuted(true);
          }
        }
        if (screenSharePreviewRef.current) {
          screenSharePreviewRef.current.innerHTML = '';
          rtcRef.current.localVideoTrack.play(screenSharePreviewRef.current, { fit: "cover" });
          screenSharePreviewRef.current.style.display = 'block';
        }
      } else {
        if (rtcRef.current.screenShareTrack) {
          rtcRef.current.screenShareTrack.close();
        } else {
          setIsScreenSharing(false);
          if (screenSharePreviewRef.current) {
            screenSharePreviewRef.current.style.display = 'none';
          }
          toast.info('Screen sharing stopped');
        }

      }
    } catch (error) {
      toast.error(`Failed to share screen: ${error.message || error.name}`);
      setIsScreenSharing(false);
      if (screenSharePreviewRef.current) {
        screenSharePreviewRef.current.style.display = 'none';
      }
    }
  };


  const sendMessage = async () => {
    if (newMessage.trim() && rtmRef.current.channel) {
      try {
        await rtmRef.current.channel.sendMessage({
          text: JSON.stringify({ type: 'chat', text: newMessage })
        });
        setMessages(prev => [...prev, {
          text: newMessage,
          senderId: 'You (Teacher)',
          timestamp: new Date()
        }]);
        setNewMessage('');
      } catch (error) {
        toast.error('Failed to send message');
      }
    }
  };

  const handleJoinRequest = async (uid, approved) => {
    if (!rtmRef.current.client) {
      toast.error('RTM client not initialized');
      return;
    }
    try {
      await rtmRef.current.client.sendMessageToPeer(
        {
          text: JSON.stringify({
            type: approved ? 'join_approved' : 'join_rejected',
            classId: classId
          })
        },
        uid // Send directly to the student's UID
      );
      if (approved) {
        toast.success(`Student ${uid} approved`);
      } else {
        toast.info(`Student ${uid} rejected`);
      }
      setJoinRequests(prev => prev.filter(req => req.uid !== uid));
    } catch (error) {
      console.error("Failed to process join request:", error);
      toast.error('Failed to process join request');
    }
  };

  const endClass = async () => {
    try {
      await rtcRef.current.client?.leave();
      await rtmRef.current.channel?.leave();
      await rtmRef.current.client?.logout();
      toast.info('Class ended');
      navigate('/'); // Adjust navigation as needed
    } catch (error) {
      toast.error('Error ending class');
    }
  };

  const saveNotes = () => {
    toast.success('Notes saved locally');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading class...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-md">
        <div className="flex items-center">
          <h1 className="text-xl font-bold mr-4">Live Class: {classId}</h1>
          {/* Live indicator if needed */}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={toggleCamera}
            disabled={!isJoined || isScreenSharing}
            className={`px-3 py-1 rounded text-sm flex items-center ${isCameraOn && !isScreenSharing
              ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
              : 'bg-red-500 hover:bg-red-600 text-white'
              } ${(!isJoined || isScreenSharing) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isCameraOn && !isScreenSharing ? '📷 Stop Cam' : '📷 Start Cam'}
          </button>
          <button
            onClick={toggleMic}
            disabled={!isJoined}
            className={`px-3 py-1 rounded text-sm flex items-center ${isMicOn
              ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
              : 'bg-red-500 hover:bg-red-600 text-white'
              } ${!isJoined ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isMicOn ? '🎤 Mute' : '🎤 Unmute'}
          </button>
          <button
            onClick={toggleScreenShare}
            disabled={!isJoined}
            className={`px-3 py-1 rounded text-sm flex items-center ${isScreenSharing
              ? 'bg-purple-500 hover:bg-purple-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
              } ${!isJoined ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isScreenSharing ? '🖥️ Stop Share' : '🖥️ Share Screen'}
          </button>
          {/* <button
            onClick={toggleWhiteboard}
            disabled={!isJoined}
            className={`px-3 py-1 rounded text-sm flex items-center ${
              isWhiteboardActive
                ? 'bg-purple-500 hover:bg-purple-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
            } ${!isJoined ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isWhiteboardActive ? '📋 Hide Board' : '📋 Whiteboard'}
          </button> */}
          <button
            onClick={endClass}
            disabled={!isJoined}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            End Class
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col p-2">
          <div className="relative flex-1 bg-black rounded-lg overflow-hidden">

            <div ref={remoteContainerRef} className="w-full h-full">
              <div ref={localVideoRef} className="w-full h-full bg-gray-800" />
            </div>
            {isScreenSharing && ( // Conditionally render the preview only when screen sharing
              <div
                ref={screenSharePreviewRef} // Attach the ref
                className="absolute bottom-4 right-4 w-32 h-32 rounded-full border-4 border-white overflow-hidden z-10 shadow-lg" // Styling for circle, border, shadow
                style={{ display: 'none' }} // Initially hidden, controlled by JavaScript
              >
                {/* The rtcRef.current.localVideoTrack will be played here by the toggleScreenShare function */}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="absolute right-4 bottom-4  z-20 p-2 h-10 w-10 rounded-full shadow-lg bg-blue-500 hover:bg-blue-600 text-white"
        >
          {showSidebar ? '◀' : '▶'}
        </button>

        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 420, opacity: 1 }}
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
                    <span className="mr-2">✋</span> Join Requests
                    {joinRequests.length > 0 && (
                      <span className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {joinRequests.length}
                      </span>
                    )}
                  </h3>
                  {joinRequests.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {joinRequests.map((request) => (
                        <div key={request.uid} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
                          <span className="text-sm truncate">{request.name} ({request.uid})</span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleJoinRequest(request.uid, true)}
                              className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleJoinRequest(request.uid, false)}
                              className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center rounded-lg bg-gray-100 dark:bg-gray-700">
                      <p className="text-sm opacity-75">No pending requests</p>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <span className="mr-2">👥</span> Participants
                    <span className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {participants.length}
                    </span>
                  </h3>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    <div className="p-2 rounded-lg flex items-center bg-blue-100 dark:bg-blue-900">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2">
                        T
                      </div>
                      <span className="font-medium text-sm">You (Teacher)</span>
                    </div>
                    {participants.map((participant) => (
                      <div key={participant} className="p-2 rounded-lg flex items-center bg-gray-100 dark:bg-gray-700">
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs mr-2">
                          S
                        </div>
                        <span className="text-sm truncate">{participant}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center">
                    <span className="mr-2">💬</span> Class Chat
                  </h3>
                  <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex flex-col h-64">
                    <div className="flex-1 overflow-y-auto p-2">
                      {messages.length > 0 ? (
                        messages.map((msg, index) => (
                          <div key={index} className="mb-2">
                            <div className="text-xs opacity-75">
                              {msg.senderId} - {msg.timestamp.toLocaleTimeString()}
                            </div>
                            <div
                              className={`p-2 rounded mt-1 text-sm ${msg.senderId === 'You (Teacher)'
                                ? 'bg-blue-100 dark:bg-blue-900 ml-4'
                                : 'bg-gray-200 dark:bg-gray-600 mr-4'
                                }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-sm opacity-75">
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

export default TeacherLiveClass;
