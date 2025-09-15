import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "./context/UserContext";
import { ProtectedRoute } from "./components/RouteGaurds";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";

import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import { ToastContainer } from "react-toastify";
import UserListPage from "./pages/userList";
import CreateQuery from "./pages/OtherPage/Queries";
import QueryDetail from "./pages/OtherPage/QueryDetail";
import QueryList from "./pages/OtherPage/QueriesList";
import PagesManagement from "./pages/Website/Pages";
import EntityManagement from "./pages/Website/Entities";
import ComingSoon from "./pages/OtherPage/ComingSoon";
import CategoryManagement from "./pages/Courses/Categories";
import CourseManagement from "./pages/Courses/Courses";
import ModuleManagement from "./pages/Courses/Modules";
import ContentManagement from "./pages/Content/Contents";
import TeacherLiveClass from "./pages/liveClass/Teacherlive";
import WaitingRoom from "./pages/liveClass/WaitingRoom";
import CategorySelectionPage from "./pages/Category/CategorySelection";
import CourseListingPage from "./pages/CourseList/CourseUsers";
import VimeoTeacherLiveComponent from "./pages/VimeoLive/Teacher";
import LiveClassPage from "./pages/VimeoLive/Class";
import VideoPlayerPage from "./pages/Player/Player";
import { VideoPlayer } from "./pages/Player/youtube";
import { VideoWithChat } from "./pages/Player/YoutubeChat";

// Define roles
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  EDITOR: 'editor'
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastContainer
          style={{ zIndex: 999999 }}
        />
        <ScrollToTop />
        <Routes>
          {/* <Route element={<AuthRoute />}>
            <Route path="/signin" element={<SignIn />} />
          </Route> */}

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index path="/" element={<Home />} />
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/coming" element={<ComingSoon />} />
              {/* <Route path="/y" element={<VideoWithChat/>} /> */}

              <Route path="/course" element={<CourseListingPage />} />
              <Route path="/teacher/:classId" element={<VimeoTeacherLiveComponent />} />
              <Route path="/class/live/:classId/:courseId" element={<LiveClassPage />} />
              <Route path="/class/:contentId/:courseId" element={<VideoPlayerPage />} />

              <Route path="/query" element={<CreateQuery />} />
              <Route path="/queries" element={<QueryList />} />
              <Route path="/queries/:id" element={<QueryDetail />} />
              <Route path="/waiting/:classId" element={<WaitingRoom />} />
              {/* <Route path="/class/:classId" element={<StudentLiveClass />} /> */}

              <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
                <Route path="/users" element={<UserListPage />} />
                <Route path="/categories" element={<CategoryManagement />} />
                <Route path="/courses" element={<CourseManagement />} />
                <Route path="/modules" element={<ModuleManagement />} />
                <Route path="/live-classes" element={<ContentManagement type="LiveClasses" />} />
                <Route path="/recorded-classes" element={<ContentManagement type="RecordedClasses" />} />
                <Route path="/tests" element={<ContentManagement type="Tests" />} />
                <Route path="/study-materials" element={<ContentManagement type="StudyMaterials" />} />
              </Route>

              <Route path="*" element={<ComingSoon />} />

              <Route element={<ProtectedRoute roles={[ROLES.EDITOR, ROLES.ADMIN]} />}>
                <Route path="/pages" element={<PagesManagement />} />
                <Route path="/entities" element={<EntityManagement />} />
              </Route>
            </Route>
            <Route path="/instructor/class/:classId" element={<TeacherLiveClass />} />
            <Route path="/course/category" element={<CategorySelectionPage />} />

          </Route>

          <Route path="/unauthorized" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}