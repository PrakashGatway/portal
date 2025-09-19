import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Users, MessageCircle, MicOff, User, UserX, UserCheck,
    VolumeX, Volume2, LogOut, Megaphone, Info, CheckCircle, XCircle
} from 'lucide-react';
import io from 'socket.io-client';
import api from '../../axiosInstance';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';

const TeacherChatComponent = ({ classTitle, classId, username }: any) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [usersTyping, setUsersTyping] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(0);
    const [totalMessages, setTotalMessages] = useState(0);
    const [usersList, setUsersList] = useState([]);
    const [activeTab, setActiveTab] = useState('chat');
    const [actionMessage, setActionMessage] = useState('');
    const [actionError, setActionError] = useState('');

    const socketRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    let navigate = useNavigate()
    // Initialize socket connection
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
                classId: classId,
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
                setTotalMessages(stats.totalMessages);
            }
        });

        socketRef.current.on('adminUsersList', (users) => {
            setUsersList(users);
        });

        socketRef.current.on('actionSuccess', (data) => {
            setActionMessage(data.message);
            setTimeout(() => setActionMessage(''), 3000);
        });

        socketRef.current.on("classEnded", (data) => {
            navigate("/");
        });

        socketRef.current.on('error', (data) => {
            setActionError(data.message);
            setTimeout(() => setActionError(''), 3000);
        });

        socketRef.current.on('userMuted', (data) => {
            setMessages(prev => [...prev, {
                isSystem: true,
                text: `You have been muted by ${data.by}`,
                timestamp: data.timestamp
            }]);
        });

        socketRef.current.on('userUnmuted', (data) => {
            setMessages(prev => [...prev, {
                isSystem: true,
                text: `You have been unmuted by ${data.by}`,
                timestamp: data.timestamp
            }]);
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
    }, [messages, activeTab]);

    const handleTyping = () => {
        if (socketRef.current) {
            socketRef.current.emit('typing', true);

            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socketRef.current.emit('typing', false);
            }, 1000);
        }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && socketRef.current && isConnected) {
            socketRef.current.emit('message', {
                text: newMessage
            });
            setNewMessage('');
            socketRef.current.emit('typing', false);
        }
    };

    const sendBroadcastMessage = (e) => {
        e.preventDefault();
        if (broadcastMessage.trim() && socketRef.current && isConnected) {
            socketRef.current.emit('adminAction', {
                action: 'broadcastMessage',
                message: broadcastMessage
            });
            setBroadcastMessage('');
        }
    };

    const endClass = (e) => {
        e.preventDefault();
        if (socketRef.current && isConnected) {
            socketRef.current.emit('adminAction', {
                action: 'endClass',
                classId
            });
        }
    };

    const muteUser = (username) => {
        socketRef.current.emit('adminAction', {
            action: 'muteUser',
            username: username
        });
    };

    const unmuteUser = (username) => {
        socketRef.current.emit('adminAction', {
            action: 'unmuteUser',
            username: username
        });
    };

    const kickUser = (username) => {
        const reason = prompt('Reason for kicking user (optional):');
        socketRef.current.emit('adminAction', {
            action: 'kickUser',
            username: username,
            reason: reason || 'Kicked by admin'
        });
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const typingUsers = usersTyping
        .map(user => user.username)
        .join(', ');

    return (
        <div className="flex flex-col h-[80vh] bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 p-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <h2 className="text-lg font-bold text-white flex items-center">
                            <span className="bg-yellow-400 text-yellow-900 text-xs px-1 py-0.5 rounded mr-2">ADMIN</span>
                            Class: {classTitle || classId}
                        </h2>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center text-white/90">
                            <MessageCircle className="h-5 w-5 mr-1" />
                            <span className="text-sm">{totalMessages}</span>
                        </div>
                        <div className="flex items-center text-white/90">
                            <Users className="h-5 w-5 mr-1" />
                            <span className="text-sm">{onlineUsers}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between mt-2">
                    <div>
                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ y: 0 }}
                            onClick={() => setActiveTab('chat')}
                            className={`px-3 py-1 rounded-l-lg font-medium transition-colors ${activeTab === 'chat'
                                ? 'bg-white text-purple-700'
                                : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                        >
                            Chat
                        </motion.button>
                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ y: 0 }}
                            onClick={() => setActiveTab('users')}
                            className={`px-3 py-1 font-medium transition-colors ${activeTab === 'users'
                                ? 'bg-white text-purple-700'
                                : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                        >
                            Students ({usersList.filter(u => !u.isAdmin).length})
                        </motion.button>
                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ y: 0 }}
                            onClick={() => setActiveTab('broadcast')}
                            className={`px-3 py-1 rounded-r-lg font-medium transition-colors ${activeTab === 'broadcast'
                                ? 'bg-white text-purple-700'
                                : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                        >
                            Broadcast
                        </motion.button>
                    </div>
                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0 }}
                        onClick={async (e) => {
                            try {
                                const confirmEnd = window.confirm("Are you sure you want to end this class?");
                                if (!confirmEnd) return; 
                                await endClass(e); 
                                await api.put(`/content/status/${classId}`, { status: "published" });
                                toast.success("Class ended successfully");
                            } catch (error) {
                                toast.error(error.message);
                            }
                        }}
                        className={`px-3 py-1 rounded-lg font-medium transition-colors bg-red-800 text-gray-300`}
                    >
                        End Class
                    </motion.button>
                </div>
            </div>

            {/* Status Messages */}
            <AnimatePresence>
                {(actionMessage || actionError) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`p-3 text-center flex items-center justify-center ${actionMessage
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            }`}
                    >
                        {actionMessage ? <CheckCircle className="h-5 w-5 mr-2" /> : <XCircle className="h-5 w-5 mr-2" />}
                        {actionMessage || actionError}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Chat Tab */}
                {activeTab === 'chat' && (
                    <div className="flex-1 flex flex-col">
                        {/* Messages Container */}
                        <div style={{ scrollbarWidth: 'none' }} ref={messagesContainerRef} className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50 dark:bg-gray-800">
                            <AnimatePresence>
                                {messages.map((message, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`p-2 px-4 rounded-full max-w-[90%] ${message.isSystem
                                            ? 'mx-auto text-center text-gray-500 dark:text-gray-400 italic bg-gray-200 dark:bg-gray-700/50'
                                            : message.isAdmin
                                                ? 'ml-auto bg-gradient-to-r from-purple-900 to-indigo-600 text-white'
                                                : 'mr-auto bg-gradient-to-r from-purple-800 to-indigo-500 text-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                                            }`}
                                    >
                                        {message.isSystem ? (
                                            <div className="text-sm font-medium">
                                                {message.text}
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex items-baseline">
                                                    <span className={`font-semibold text-xs mr-2 m-0 p-0 ${message.isAdmin
                                                        ? 'text-yellow-200'
                                                        : 'text-gray-600 dark:text-blue-300'
                                                        }`}>
                                                        {message.username} {message.isAdmin && <span className="text-xs bg-yellow-400 text-yellow-900 px-1 rounded ml-1">ADMIN</span>}
                                                    </span>
                                                    <span className="text-xs opacity-80 text-gray-400 dark:text-gray-400">
                                                        {formatTime(message.timestamp)}
                                                    </span>
                                                </div>
                                                <div className="break-words m-0 p-0">
                                                    {message.text}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">

                            {typingUsers && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-xs text-gray-500 dark:text-gray-400 italic pb-2 flex items-center"
                                >
                                    <div className="flex space-x-1 mr-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                    {typingUsers} {typingUsers.includes(',') ? 'are' : 'is'} typing...
                                </motion.div>
                            )}
                            <div className="flex">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        handleTyping();
                                    }}
                                    placeholder={isConnected ? "Type a message..." : "Connecting..."}
                                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-l-xl px-4 py-3 focus:outline-none "
                                    disabled={!isConnected}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="submit"
                                    className={`px-5 rounded-r-xl font-medium flex items-center ${newMessage.trim() && isConnected
                                        ? 'bg-purple-500 hover:bg-purple-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                        }`}
                                    disabled={!newMessage.trim() || !isConnected}
                                >
                                    <Send className="h-5 w-5" />
                                </motion.button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
                        <div className="p-4 py-2 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center">
                                <Users className="h-5 w-5 mr-2" />
                                Connected Students
                            </h3>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {usersList.filter(u => !u.isAdmin).length} students online
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            {usersList.filter(u => !u.isAdmin).length === 0 ? (
                                <div className="text-center text-gray-500 dark:text-gray-400 p-8">
                                    <Users className="h-12 w-12 mx-auto text-gray-400" />
                                    <p className="mt-2">No students connected</p>
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {usersList
                                        .filter(u => !u.isAdmin)
                                        .map((user, index) => (
                                            <motion.li
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="p-2 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white mr-2">
                                                            <User className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-800 dark:text-white">
                                                                {user.username}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                Joined: {new Date(user.joinedAt).toLocaleTimeString()}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex space-x-2">
                                                        {user.isMuted ? (
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => unmuteUser(user.username)}
                                                                className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg flex items-center"
                                                                title="Unmute user"
                                                            >
                                                                <Volume2 className="h-4 w-4" />
                                                            </motion.button>
                                                        ) : (
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => muteUser(user.username)}
                                                                className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg flex items-center"
                                                                title="Mute user"
                                                            >
                                                                <VolumeX className="h-4 w-4" />
                                                            </motion.button>
                                                        )}
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => kickUser(user.username)}
                                                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg flex items-center"
                                                            title="Kick user"
                                                        >
                                                            <LogOut className="h-4 w-4" />
                                                        </motion.button>
                                                    </div>
                                                </div>

                                                {user.isMuted && (
                                                    <div className="mt-3 flex items-center text-xs text-yellow-600 dark:text-yellow-400">
                                                        <MicOff className="h-4 w-4 mr-1" />
                                                        <span className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
                                                            User is muted
                                                        </span>
                                                    </div>
                                                )}
                                            </motion.li>
                                        ))
                                    }
                                </ul>
                            )}
                        </div>
                    </div>
                )}

                {/* Broadcast Tab */}
                {activeTab === 'broadcast' && (
                    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 p-2 overflow-y-auto">
                        <h3 className="font-semibold text-gray-800 dark:text-white text-lg mb-4 flex items-center">
                            <Megaphone className="h-5 w-5 mr-2" />
                            Broadcast Message
                        </h3>

                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2 mb-3 border border-blue-200 dark:border-blue-800/50">
                            <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                                Send an announcement to all connected users in this class. This message will appear as a system notification.
                            </p>

                            <form onSubmit={sendBroadcastMessage}>
                                <textarea
                                    value={broadcastMessage}
                                    onChange={(e) => setBroadcastMessage(e.target.value)}
                                    placeholder="Enter your broadcast message..."
                                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-4 h-32 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-300 dark:border-gray-600"
                                    disabled={!isConnected}
                                />
                                <div className="flex justify-end mt-2">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        className={`px-2 py-1 rounded-lg font-medium flex items-center ${broadcastMessage.trim() && isConnected
                                            ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                            }`}
                                        disabled={!broadcastMessage.trim() || !isConnected}
                                    >
                                        <Megaphone className="h-4 w-4 mr-2" />
                                        Send Broadcast
                                    </motion.button>
                                </div>
                            </form>
                        </div>

                        <div className="bg-gray-100 dark:bg-gray-700/50 rounded-xl p-2 text-sm border border-gray-200 dark:border-gray-600">
                            <h4 className="font-medium text-gray-800 dark:text-white mb-3 flex items-center">
                                <Info className="h-5 w-5 mr-2" />
                                Admin Controls
                            </h4>
                            <ul className="text-gray-600 dark:text-gray-300 text-sm space-y-2">
                                <li className="flex items-start">
                                    <UserCheck className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <span>Mute users to prevent them from sending messages</span>
                                </li>
                                <li className="flex items-start">
                                    <User className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <span>Unmute users to restore their messaging privileges</span>
                                </li>
                                <li className="flex items-start">
                                    <UserX className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <span>Kick users to disconnect them from the chat</span>
                                </li>
                                <li className="flex items-start">
                                    <Megaphone className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <span>Broadcast messages appear to all users as system notifications</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherChatComponent;