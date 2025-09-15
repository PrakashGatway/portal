import { useState } from 'react';
import { useAuth } from "../../context/UserContext";
import StudentChatComponent from "./StudentChat";
import TeacherChatComponent from "./TeacherChat";
import { VideoPlayer } from "./youtube";
import { MessageSquare } from 'lucide-react';

export const VideoWithChat = () => {
    const [isChatOpen, setIsChatOpen] = useState(true); // Chat visibility state
    const classId = "b";
    const { user } = useAuth();
    const username = user?.name || user?.email;
    const isTeacher = user?.role === "teacher";

    const videoId = "N-iFUEYauLQ";

    if (!classId || !username) {
        return (
            <div className="flex items-center justify-center bg-gray-900 rounded-xl">
                <div className="text-center text-white">
                    <h2 className="text-xl font-bold mb-2">Missing Information</h2>
                    <p>Please provide class ID and username</p>
                </div>
            </div>
        );
    }

    const renderChat = () => {
        if (isTeacher) {
            return <TeacherChatComponent classId={classId} username={username} />;
        }
        return <StudentChatComponent classId={classId} username={username} />;
    };

    return (
        <div className={`flex w-full rounded-xl bg-gray-100 dark:bg-gray-900 overflow-hidden`}>
            <div className={`relative bg-gray-100 max-w-6xl m-auto dark:bg-gray-900 transition-all duration-300 ${isChatOpen ? 'w-5/8' : 'w-full'}`}>
                <VideoPlayer videoId={videoId} title={`Class ${classId}`} />
                <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all shadow-lg z-10"
                    aria-label={isChatOpen ? "Hide chat" : "Show chat"}
                >
                    <MessageSquare className="h-5 w-5" />
                </button>
            </div>

            <div className={`flex flex-col bg-gray-100 dark:bg-gray-900 transition-all duration-300 ${
                isChatOpen 
                    ? 'w-3/8 opacity-100' 
                    : 'w-0 opacity-0 overflow-hidden'
            }`}>
                <div className="flex-1 overflow-hidden">
                    {renderChat()}
                </div>
            </div>
        </div>
    );
};