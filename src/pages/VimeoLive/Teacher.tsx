import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../axiosInstance';
import { useAuth } from '../../context/UserContext';
import AgoraRTM from 'agora-rtm-sdk'; // Only RTM for chat, no RTC
import {
    Video, Play, StopCircle, Mic, MicOff, Camera,
    CameraOff, Share, MessageSquare, Users, X, Send,
    ThumbsUp, Heart, UserMinus, Settings
} from 'lucide-react';

const VimeoTeacherLiveComponent = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [classData, setClassData] = useState(null);
    const [isLive, setIsLive] = useState(false);
    const [vimeoEventData, setVimeoEventData] = useState(null);
    const [showSidebar, setShowSidebar] = useState(true);

    // Media controls (local state only, no Agora RTC)
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // Agora RTM for chat (only)
    const rtmRef = useRef({
        client: null,
        channel: null,
    });

    // Chat system
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [reactions, setReactions] = useState([]);

    // Participants management
    const [participants, setParticipants] = useState([]);
    const [blockedStudents, setBlockedStudents] = useState([]);

    // Refs
    const vimeoPlayerRef = useRef(null);
    const screenSharePreviewRef = useRef(null);

    // Initialize Agora RTM for chat only
    const initializeAgoraRTM = async (agoraToken) => {
        try {
            const AGORA_APP_ID = process.env.REACT_APP_AGORA_APP_ID || "your-agora-app-id";

            if (!AGORA_APP_ID) {
                throw new Error('Agora App ID not configured');
            }

            // Clean up existing client if any
            if (rtmRef.current.client) {
                await cleanupAgoraRTM();
            }

            // Create RTM client (for chat only)
            rtmRef.current.client = AgoraRTM.createInstance(AGORA_APP_ID);

            // Login to RTM
            await rtmRef.current.client.login({
                uid: user._id.toString(),
                token: agoraToken || null
            });

            // Create/join channel
            rtmRef.current.channel = rtmRef.current.client.createChannel(classId);
            await rtmRef.current.channel.join();

            // Set up event listeners
            setupRTMEventListeners();

            console.log('Agora RTM (chat only) initialized successfully');
        } catch (error) {
            console.error('Error initializing Agora RTM:', error);
            toast.error('Failed to initialize chat system');
        }
    };

    // Set up RTM event listeners
    const setupRTMEventListeners = () => {
        if (!rtmRef.current.channel || !rtmRef.current.client) return;

        // Handle incoming messages
        rtmRef.current.channel.on('ChannelMessage', (message, senderId) => {
            try {
                // Check if sender is blocked
                if (blockedStudents.includes(senderId)) {
                    return;
                }

                let msgData;
                try {
                    msgData = JSON.parse(message.text);
                } catch (e) {
                    // Handle plain text messages
                    msgData = {
                        type: 'chat',
                        text: message.text,
                        timestamp: new Date().toISOString()
                    };
                }

                if (msgData.type === 'chat') {
                    setMessages(prev => [...prev, {
                        text: msgData.text,
                        senderId: senderId,
                        senderName: msgData.senderName || `Student ${senderId}`,
                        senderRole: msgData.senderRole || 'student',
                        timestamp: new Date(msgData.timestamp || Date.now())
                    }]);
                } else if (msgData.type === 'reaction') {
                    setReactions(prev => [...prev, {
                        type: msgData.reactionType,
                        senderId: senderId,
                        senderName: msgData.senderName || `Student ${senderId}`,
                        senderRole: msgData.senderRole || 'student',
                        timestamp: new Date(msgData.timestamp || Date.now())
                    }]);

                    // Auto-remove after 5 seconds
                    setTimeout(() => {
                        setReactions(prev => prev.filter(r => !(r.senderId === senderId && r.type === msgData.reactionType && r.timestamp === msgData.timestamp)));
                    }, 5000);
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        });

        // Handle member join
        rtmRef.current.channel.on('MemberJoined', (memberId) => {
            if (!blockedStudents.includes(memberId)) {
                setParticipants(prev => {
                    if (!prev.find(p => p.id === memberId)) {
                        return [...prev, { id: memberId, name: `Student ${memberId}` }];
                    }
                    return prev;
                });
                toast.info(`Student ${memberId} joined the class`);
            }
        });

        // Handle member leave
        rtmRef.current.channel.on('MemberLeft', (memberId) => {
            setParticipants(prev => prev.filter(p => p.id !== memberId));
            toast.info(`Student ${memberId} left the class`);
        });
    };

    // Cleanup Agora RTM
    const cleanupAgoraRTM = async () => {
        try {
            if (rtmRef.current.channel) {
                rtmRef.current.channel.removeAllListeners();
                await rtmRef.current.channel.leave();
                rtmRef.current.channel = null;
            }

            if (rtmRef.current.client) {
                rtmRef.current.client.removeAllListeners();
                await rtmRef.current.client.logout();
                rtmRef.current.client = null;
            }
        } catch (error) {
            console.error('Error cleaning up Agora RTM:', error);
        }
    };

    // Fetch class data and initialize
    const fetchClassData = async () => {
        try {
            setLoading(true);

            const agoraTokenResponse = await api.get(`/tokens/${classId}/${user?._id}`);
            const agoraToken = agoraTokenResponse.data?.rtmToken;

            await initializeAgoraRTM(agoraToken);
            let vimeoLiveEventId;

            if (vimeoLiveEventId) {
                const eventResponse = await api.get(`/vimeo/live-events/${response.data.vimeoLiveEventId}`);
                setVimeoEventData(eventResponse.data);
                setIsLive(eventResponse.data.status === 'started');

                if (eventResponse.data.status === 'started') {
                    initializeVimeoPlayer(eventResponse.data.eventId);
                }
            } else {
                toast.error('No pre-created Vimeo live event found for this class');
            }
        } catch (error) {
            toast.error('Failed to load class data');
            console.error('Error fetching class ', error);
        } finally {
            setLoading(false);
        }
    };

    const initializeVimeoPlayer = (videoId) => {
        if (typeof window !== 'undefined' && window.Vimeo) {
            vimeoPlayerRef.current = new window.Vimeo.Player('vimeo-player', {
                id: videoId,
                autoplay: true,
                muted: false,
                controls: true,
                responsive: true
            });

            vimeoPlayerRef.current.on('play', () => {
                console.log('Vimeo player is playing');
            });

            vimeoPlayerRef.current.on('pause', () => {
                console.log('Vimeo player is paused');
            });

            vimeoPlayerRef.current.on('ended', () => {
                console.log('Vimeo player has ended');
                setIsLive(false);
            });
        }
    };

    useEffect(() => {
        fetchClassData();

        return () => {
            cleanupAgoraRTM();
        };
    }, [classId]);

    // Start live event (pre-created)
    const startLiveEvent = async () => {
        if (!vimeoEventData?.eventId) {
            toast.error('No pre-created Vimeo live event found');
            return;
        }

        try {
            setLoading(true);

            // Start the pre-created live event
            await api.post(`/vimeo/start-live-event/${vimeoEventData.eventId}`);
            setIsLive(true);

            // Initialize player
            initializeVimeoPlayer(vimeoEventData.eventId);

            // Update class status
            await api.patch(`/classes/${classId}`, {
                status: 'live'
            });

            toast.success('Live stream started successfully!');
        } catch (error) {
            toast.error('Failed to start live stream');
            console.error('Error starting live stream:', error);
        } finally {
            setLoading(false);
        }
    };

    // End live event
    const endLiveStream = async () => {
        if (!vimeoEventData?.eventId) {
            toast.error('No live event found');
            return;
        }

        try {
            setLoading(true);
            await api.post(`/vimeo/stop-live-event/${vimeoEventData.eventId}`);
            setIsLive(false);

            // Update class status
            await api.patch(`/classes/${classId}`, {
                status: 'completed'
            });

            toast.success('Live stream ended successfully');
            navigate('/');
        } catch (error) {
            toast.error('Failed to end live stream');
            console.error('Error ending live stream:', error);
        } finally {
            setLoading(false);
        }
    };

    // Toggle camera (local state only)
    const toggleCamera = () => {
        if (isScreenSharing) {
            toast.info("Cannot toggle camera while screen sharing.");
            return;
        }
        setIsCameraOn(!isCameraOn);
        toast.info(`Camera ${!isCameraOn ? 'enabled' : 'disabled'}`);
    };

    // Toggle microphone (local state only)
    const toggleMic = () => {
        setIsMicOn(!isMicOn);
        toast.info(`Microphone ${!isMicOn ? 'unmuted' : 'muted'}`);
    };

    // Toggle screen sharing (using browser API, not Agora)
    const toggleScreenShare = async () => {
        if (!isLive) {
            toast.info("Start the live stream first");
            return;
        }

        try {
            if (!isScreenSharing) {
                // Use browser's screen sharing API
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        cursor: "always",
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        frameRate: { ideal: 30 }
                    },
                    audio: false
                });

                // Create a video element to preview
                if (screenSharePreviewRef.current) {
                    const video = document.createElement('video');
                    video.srcObject = stream;
                    video.muted = true;
                    video.play();
                    screenSharePreviewRef.current.innerHTML = '';
                    screenSharePreviewRef.current.appendChild(video);
                }

                setIsScreenSharing(true);
                toast.info('Screen sharing started');

                // Handle stream ending
                stream.getVideoTracks()[0].onended = () => {
                    setIsScreenSharing(false);
                    toast.info('Screen sharing stopped by user');
                    if (screenSharePreviewRef.current) {
                        screenSharePreviewRef.current.innerHTML = '';
                    }
                };
            } else {
                // Stop screen sharing
                if (screenSharePreviewRef.current && screenSharePreviewRef.current.firstChild) {
                    const video = screenSharePreviewRef.current.firstChild;
                    const stream = video.srcObject;
                    if (stream) {
                        stream.getTracks().forEach(track => track.stop());
                    }
                    screenSharePreviewRef.current.innerHTML = '';
                }
                setIsScreenSharing(false);
                toast.info('Screen sharing stopped');
            }
        } catch (error) {
            if (error.name !== 'NotAllowedError') {
                toast.error('Failed to toggle screen sharing');
                console.error('Error toggling screen sharing:', error);
            }
            setIsScreenSharing(false);
        }
    };

    // Send message via Agora RTM
    const sendMessage = async () => {
        if (!newMessage.trim() || !isLive || !rtmRef.current.channel) return;

        try {
            const messageData = {
                type: 'chat',
                text: newMessage,
                senderName: user.name || 'Teacher',
                senderRole: 'teacher',
                timestamp: new Date().toISOString()
            };

            // Send via Agora RTM
            await rtmRef.current.channel.sendMessage({
                text: JSON.stringify(messageData)
            });

            // Update local state
            setMessages(prev => [...prev, {
                ...messageData,
                senderId: user._id.toString(),
                timestamp: new Date()
            }]);

            setNewMessage('');
        } catch (error) {
            toast.error('Failed to send message');
            console.error('Error sending message:', error);
        }
    };

    // Send reaction via Agora RTM
    const sendReaction = async (reactionType) => {
        if (!isLive || !rtmRef.current.channel) return;

        try {
            const reactionData = {
                type: 'reaction',
                reactionType: reactionType,
                senderName: user.name || 'Teacher',
                senderRole: 'teacher',
                timestamp: new Date().toISOString()
            };

            // Send via Agora RTM
            await rtmRef.current.channel.sendMessage({
                text: JSON.stringify(reactionData)
            });

            // Update local state
            setReactions(prev => [...prev, {
                ...reactionData,
                senderId: user._id.toString(),
                timestamp: new Date()
            }]);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                setReactions(prev => prev.filter(r => !(r.senderId === user._id.toString() && r.type === reactionType && r.timestamp === reactionData.timestamp)));
            }, 5000);
        } catch (error) {
            console.error('Error sending reaction:', error);
        }
    };

    // Block student
    const blockStudent = async (studentId, studentName) => {
        if (!window.confirm(`Are you sure you want to block ${studentName}?`)) {
            return;
        }

        try {
            // Add to blocked list
            setBlockedStudents(prev => [...prev, studentId]);

            // Notify backend to block student
            await api.post(`/classes/${classId}/block-student`, {
                studentId,
                blockedBy: user._id
            });

            // Remove student from participants
            setParticipants(prev => prev.filter(p => p.id !== studentId));

            // Remove student's messages and reactions from local state
            setMessages(prev => prev.filter(msg => msg.senderId !== studentId));
            setReactions(prev => prev.filter(r => r.senderId !== studentId));

            // Send message to student (if needed)
            if (rtmRef.current.client) {
                try {
                    await rtmRef.current.client.sendMessageToPeer(
                        {
                            text: JSON.stringify({
                                type: 'blocked',
                                message: 'You have been blocked from this class by the teacher.'
                            })
                        },
                        studentId
                    );
                } catch (error) {
                    console.error('Could not send block notification to student:', error);
                }
            }

            toast.success(`${studentName} has been blocked from the class`);
        } catch (error) {
            toast.error('Failed to block student');
            console.error('Error blocking student:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading classroom...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            {classData?.title || `Live Class: ${classId}`}
                        </h1>
                        {isLive && (
                            <div className="flex items-center space-x-2 bg-red-100 dark:bg-red-900 px-3 py-1 rounded-full">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-red-700 dark:text-red-300 font-medium">LIVE</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                        {!isLive && vimeoEventData && (
                            <button
                                onClick={startLiveEvent}
                                disabled={loading}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                            >
                                <Play className="h-4 w-4" />
                                <span>Go Live</span>
                            </button>
                        )}
                        {isLive && (
                            <button
                                onClick={endLiveStream}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                            >
                                <StopCircle className="h-4 w-4" />
                                <span>End Live</span>
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/')}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm font-medium transition-colors"
                        >
                            Exit
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Video Area */}
                <div className="flex-1 p-4">
                    <div className="bg-black rounded-lg overflow-hidden h-full relative">
                        {isLive && vimeoEventData?.eventId ? (
                            <div className="w-full h-full">
                                <div
                                    id="vimeo-player"
                                    className="w-full h-full"
                                    style={{ background: '#000' }}
                                ></div>
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                <div className="text-center">
                                    <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-300 mb-2">Ready to Go Live</h3>
                                    <p className="text-gray-400 mb-4">Click "Go Live" to start your broadcast</p>
                                    {classData?.description && (
                                        <p className="text-gray-300 text-sm mt-2">{classData.description}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Local video preview (when screen sharing) */}
                        {isScreenSharing && (
                            <div
                                ref={screenSharePreviewRef}
                                className="absolute bottom-4 right-4 w-32 h-32 rounded-full border-4 border-white overflow-hidden z-10 shadow-lg"
                                style={{ display: 'block' }}
                            >
                                {/* Screen share preview will be rendered here */}
                            </div>
                        )}
                    </div>

                    {/* Floating reaction bubbles */}
                    <div className="absolute top-4 left-4 pointer-events-none">
                        {reactions.map((reaction, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 1, y: 0 }}
                                animate={{ opacity: 0, y: -100 }}
                                transition={{ duration: 3, ease: "easeOut" }}
                                className="mb-2 text-2xl font-bold drop-shadow-lg"
                            >
                                {reaction.type === 'like' && '👍'}
                                {reaction.type === 'heart' && '❤️'}
                                {reaction.type === 'laugh' && '😂'}
                                {reaction.type === 'clap' && '👏'}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Toggle Button */}
                <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="absolute right-4 bottom-4 z-20 p-2 h-10 w-10 rounded-full shadow-lg bg-blue-500 hover:bg-blue-600 text-white"
                >
                    {showSidebar ? '◀' : '▶'}
                </button>

                {/* Sidebar */}
                <AnimatePresence>
                    {showSidebar && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 420, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ type: 'spring', damping: 20 }}
                            className="flex flex-col bg-white dark:bg-gray-800 shadow-xl z-10"
                        >
                            {/* Sidebar Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h2 className="text-lg font-bold">Live Controls</h2>
                                <button
                                    onClick={() => setShowSidebar(false)}
                                    className="p-1 rounded-full h-10 w-10 hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Sidebar Content */}
                            <div className="flex-1 overflow-y-auto">
                                {/* Media Controls */}
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="font-semibold mb-3">Media Controls</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            onClick={toggleCamera}
                                            disabled={!isLive}
                                            className={`p-3 rounded-lg flex flex-col items-center justify-center transition-colors ${!isLive ? 'opacity-50 cursor-not-allowed' : ''
                                                } ${isCameraOn
                                                    ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                                    : 'bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50'
                                                }`}
                                        >
                                            {isCameraOn ? <Camera className="h-5 w-5 mb-1" /> : <CameraOff className="h-5 w-5 mb-1" />}
                                            <span className="text-xs">Camera</span>
                                        </button>
                                        <button
                                            onClick={toggleMic}
                                            disabled={!isLive}
                                            className={`p-3 rounded-lg flex flex-col items-center justify-center transition-colors ${!isLive ? 'opacity-50 cursor-not-allowed' : ''
                                                } ${isMicOn
                                                    ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                                    : 'bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50'
                                                }`}
                                        >
                                            {isMicOn ? <Mic className="h-5 w-5 mb-1" /> : <MicOff className="h-5 w-5 mb-1" />}
                                            <span className="text-xs">Microphone</span>
                                        </button>
                                        <button
                                            onClick={toggleScreenShare}
                                            disabled={!isLive}
                                            className={`p-3 rounded-lg flex flex-col items-center justify-center transition-colors ${!isLive ? 'opacity-50 cursor-not-allowed' : ''
                                                } ${isScreenSharing
                                                    ? 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50'
                                                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            <Share className="h-5 w-5 mb-1" />
                                            <span className="text-xs">Share</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Quick Reactions */}
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="font-semibold mb-3">Send Reactions</h3>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => sendReaction('like')}
                                            disabled={!isLive}
                                            className={`p-2 rounded-lg transition-colors ${!isLive ? 'opacity-50 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            👍
                                        </button>
                                        <button
                                            onClick={() => sendReaction('heart')}
                                            disabled={!isLive}
                                            className={`p-2 rounded-lg transition-colors ${!isLive ? 'opacity-50 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            ❤️
                                        </button>
                                        <button
                                            onClick={() => sendReaction('laugh')}
                                            disabled={!isLive}
                                            className={`p-2 rounded-lg transition-colors ${!isLive ? 'opacity-50 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            😂
                                        </button>
                                        <button
                                            onClick={() => sendReaction('clap')}
                                            disabled={!isLive}
                                            className={`p-2 rounded-lg transition-colors ${!isLive ? 'opacity-50 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            👏
                                        </button>
                                    </div>
                                </div>

                                {/* Participants */}
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="font-semibold mb-3 flex items-center">
                                        <Users className="h-5 w-5 mr-2" />
                                        Students ({participants.length})
                                    </h3>
                                    <div className="max-h-48 overflow-y-auto space-y-2">
                                        <div className="p-2 rounded-lg flex items-center bg-blue-100 dark:bg-blue-900">
                                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2">
                                                T
                                            </div>
                                            <span className="font-medium text-sm">You (Teacher)</span>
                                        </div>
                                        {participants.length > 0 ? (
                                            participants.map((participant) => (
                                                <div key={participant.id} className="p-2 rounded-lg flex items-center justify-between bg-gray-100 dark:bg-gray-700">
                                                    <div className="flex items-center">
                                                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs mr-2">
                                                            S
                                                        </div>
                                                        <span className="text-sm truncate">{participant.name || `Student ${participant.id}`}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => blockStudent(participant.id, participant.name || `Student ${participant.id}`)}
                                                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                                                        title="Block student"
                                                    >
                                                        <UserMinus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-3 text-center text-sm text-gray-500">
                                                No students joined yet
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Chat */}
                                <div className="p-4">
                                    <h3 className="font-semibold mb-3 flex items-center">
                                        <MessageSquare className="h-5 w-5 mr-2" />
                                        Live Chat
                                    </h3>
                                    <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex flex-col h-64">
                                        <div className="flex-1 overflow-y-auto p-2">
                                            {messages.length > 0 ? (
                                                messages.map((msg, index) => (
                                                    <div key={index} className="mb-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-xs opacity-75">
                                                                {msg.senderName} {msg.senderRole === 'teacher' && '(Teacher)'}
                                                            </div>
                                                            <div className="text-xs opacity-50">
                                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                                            </div>
                                                        </div>
                                                        <div
                                                            className={`p-2 rounded mt-1 text-sm break-words ${msg.senderRole === 'teacher'
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
                                                    {isLive ? 'No messages yet' : 'Go live to start chatting'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2 border-t border-gray-200 dark:border-gray-600 flex">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                                disabled={!isLive}
                                                placeholder={isLive ? "Type a message..." : "Go live to chat"}
                                                className="flex-1 p-1 text-sm rounded-l bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white disabled:opacity-50"
                                            />
                                            <button
                                                onClick={sendMessage}
                                                disabled={!isLive || !newMessage.trim()}
                                                className="px-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-r"
                                            >
                                                <Send className="h-4 w-4" />
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

export default VimeoTeacherLiveComponent;