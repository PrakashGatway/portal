import { useState } from 'react';
import { useAuth } from "../../context/UserContext";
import StudentChatComponent from "./StudentChat";
import TeacherChatComponent from "./TeacherChat";
import { VideoPlayer } from "./youtube";
import { MessageSquare } from 'lucide-react';

export const VideoWithChat = ({ status, videoId, classId, classTitle }: any) => {
    const [isChatOpen, setIsChatOpen] = useState(true); // Chat visibility state
    const { user } = useAuth();
    const username = user?.name || user?.email;
    const isTeacher = user?.role === "teacher";

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
            return <TeacherChatComponent classTitle={classTitle} classId={classId} username={username} />;
        }
        return <StudentChatComponent classTitle={classTitle} classId={classId} username={username} />;
    };

    return (
        <div className={`flex w-full rounded-xl bg-gray-100 dark:bg-gray-900`}>
            <div className={`relative bg-gray-100 max-w-6xl m-auto dark:bg-gray-900 transition-all duration-300 ${isChatOpen && status == "live" ? 'w-5/8' : 'w-full'}`}>
                <VideoPlayer videoId={videoId} title={`Class ${classTitle}`} />
                { status == "live" && <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all shadow-lg z-10"
                    aria-label={isChatOpen ? "Hide chat" : "Show chat"}
                >
                    <MessageSquare className="h-5 w-5" />
                </button>}
            </div>

            <div className={`flex flex-col bg-gray-100 dark:bg-gray-900 transition-all duration-300 ${isChatOpen && status == "live"
                ? 'w-3/8 opacity-100'
                : 'w-0 opacity-0 overflow-hidden'
                }`}>
                <div className="flex-1 overflow-hidden">
                    { status == "live" && renderChat()}
                </div>
            </div>
        </div>
    );
};