import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, MicOff } from 'lucide-react';
import io from 'socket.io-client';
import { useNavigate } from 'react-router';

const StudentChatComponent = ({ classTitle, classId, username }: any) => {
    const [messages, setMessages] = useState([]) as any;
    const [newMessage, setNewMessage] = useState('') as any;
    const [usersTyping, setUsersTyping] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    const socketRef = useRef(null) as any;
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const messagesContainerRef = useRef(null);

    let navigate = useNavigate();

    useEffect(() => {
        if (!classId) return;

        socketRef.current = io('http://localhost:5000', {
            transports: ['websocket'],
            auth: {
                token: localStorage.getItem('accessToken')
            },
            withCredentials: true
        });

        socketRef.current.on('connect', () => {
            setIsConnected(true);
            socketRef.current.emit('joinClass', {
                classId: classId
            });
        });

        socketRef.current.on('previousMessages', (previousMessages) => {
            setMessages(previousMessages);
        });

        socketRef.current.on('message', (message) => {
            setMessages(prev => [...prev, message]);
        });

        socketRef.current.on('userJoined', (userData) => {
            setMessages(prev => [...prev, {
                isSystem: true,
                text: `${userData.username} ${userData.isAdmin ? '(Admin)' : ''} joined the chat`,
                timestamp: userData.timestamp
            }]);
        });

        socketRef.current.on('userLeft', (userData) => {
            setMessages(prev => [...prev, {
                isSystem: true,
                text: `${userData.username} ${userData.isAdmin ? '(Admin)' : ''} left the chat`,
                timestamp: userData.timestamp
            }]);
        });

        socketRef.current.on('userTyping', (typingData) => {
            setUsersTyping(prev => {
                const newTyping = prev.filter(user => user.userId !== typingData.userId);
                if (typingData.isTyping) {
                    newTyping.push(typingData);
                }
                return newTyping;
            });
        });

        socketRef.current.on('stats', (stats) => {
            if (stats.classId === classId) {
                setOnlineUsers(stats.onlineUsers);
            }
        });

        socketRef.current.on("classEnded", (data) => {
            alert(data.message || "class Ended");
            navigate("/");
        });
        
        socketRef.current.on('userMuted', (data) => {
            setIsMuted(true);
            setMessages(prev => [...prev, {
                isSystem: true,
                text: `You have been muted by ${data.by}`,
                timestamp: data.timestamp
            }]);
        });

        socketRef.current.on('userUnmuted', (data) => {
            setIsMuted(false);
            setMessages(prev => [...prev, {
                isSystem: true,
                text: `You have been unmuted by ${data.by}`,
                timestamp: data.timestamp
            }]);
        });

        socketRef.current.on('userKicked', (data) => {
            setMessages(prev => [...prev, {
                isSystem: true,
                text: `You have been kicked by ${data.by}: ${data.reason}`,
                timestamp: new Date()
            }]);
            setTimeout(() => {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                }
            }, 3000);
        });

        socketRef.current.on('disconnect', () => {
            setIsConnected(false);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [classId, username]);

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleTyping = () => {
        if (socketRef.current && !isMuted) {
            socketRef.current.emit('typing', true);

            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socketRef.current.emit('typing', false);
            }, 1000);
        }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && socketRef.current && isConnected && !isMuted) {
            socketRef.current.emit('message', {
                text: newMessage
            });
            setNewMessage('');
            socketRef.current.emit('typing', false);
        }
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const typingUsers = usersTyping
        .filter(user => user.username !== username)
        .map(user => user.username)
        .join(', ');

    return (
        <div className="flex flex-col h-[80vh] bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 p-2 pb-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-3 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <h2 className="text-lg font-bold text-white">{classTitle || classId}</h2>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center text-white/90">
                            <Users className="h-5 w-5 mr-1" />
                            <span className="text-sm">{onlineUsers}</span>
                        </div>
                    </div>
                </div>

                <div className="flex mt-2 text-sm text-white/80">
                    {isMuted && (
                        <span className="flex items-center bg-yellow-500/20 px-2 py-1 rounded">
                            <MicOff className="h-4 w-4 mr-1" />
                            You are muted
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className={`${'w-full'} flex flex-col`}>
                    <div style={{ scrollbarWidth: "none" }} ref={messagesContainerRef} className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50 dark:bg-gray-800">
                        <AnimatePresence>
                            {messages.map((message, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={`p-2 px-4 rounded-full max-w-[85%] ${message.isSystem
                                        ? 'mx-auto text-center text-gray-500 dark:text-gray-300 italic bg-gray-200 dark:bg-gray-700/50'
                                        : message.username === username
                                            ? 'ml-auto bg-blue-700 text-white'
                                            : message.isAdmin
                                                ? 'mr-auto bg-gradient-to-r from-purple-900 to-indigo-800 text-white'
                                                : 'mr-auto bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                                        }`}
                                >
                                    {message.isSystem ? (
                                        <div className="text-sm font-medium">
                                            {message.text}
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="flex items-baseline">
                                                <span className={`font-semibold text-xs ${message.username === username
                                                    ? 'text-blue-100'
                                                    : message.isAdmin
                                                        ? 'text-yellow-200'
                                                        : 'text-blue-600 dark:text-blue-300'
                                                    }`}>
                                                    {message.username} {message.isAdmin && <span className="text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0 rounded-xl">ADMIN</span>}
                                                </span>
                                                <span className="text-xs opacity-80 ml-1">
                                                    {formatTime(message.timestamp)}
                                                </span>
                                            </div>
                                            <div className="break-words">
                                                {message.text}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {typingUsers && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs text-gray-500 dark:text-gray-400 italic p-2 flex items-center"
                            >
                                <div className="flex space-x-1 mr-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                                {typingUsers} {typingUsers.includes(',') ? 'are' : 'is'} typing...
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div className="flex">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    handleTyping();
                                }}
                                placeholder={
                                    isMuted
                                        ? "You are muted by admin"
                                        : isConnected
                                            ? "Type a message..."
                                            : "Connecting..."
                                }
                                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-l-xl px-4 py-3 focus:outline-none"
                                disabled={!isConnected || isMuted}
                            />
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="submit"
                                className={`px-5 rounded-r-xl font-medium flex items-center ${newMessage.trim() && isConnected && !isMuted
                                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                    }`}
                                disabled={!newMessage.trim() || !isConnected || isMuted}
                            >
                                <Send className="h-5 w-5" />
                            </motion.button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StudentChatComponent;