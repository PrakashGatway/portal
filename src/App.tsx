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
import CommissionPackages from "./pages/package";
import CreateQuery from "./pages/OtherPage/Queries";
import QueryDetail from "./pages/OtherPage/QueryDetail";
import QueryList from "./pages/OtherPage/QueriesList";
import PagesManagement from "./pages/Website/Pages";
import EntityManagement from "./pages/Website/Entities";
import ComingSoon from "./pages/OtherPage/ComingSoon";
import CategoryManagement from "./pages/Courses/Categories";
import CategoryTree from "./pages/Courses/CategoryTree";
import CourseManagement from "./pages/Courses/Courses";
import CourseSteppedForm from "./pages/Courses/CourseSteps";
import ModuleManagement from "./pages/Courses/Modules";
import ContentManagement from "./pages/Content/Contents";
import StudentLiveClass from "./pages/liveClass/Studentlive";
import TeacherLiveClass from "./pages/liveClass/Teacherlive";

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

              <Route path="/query" element={<CreateQuery />} />
              <Route path="/queries" element={<QueryList />} />
              <Route path="/queries/:id" element={<QueryDetail />} />

              <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
                <Route path="/packages" element={<CommissionPackages />} />
                <Route path="/users" element={<UserListPage />} />
                <Route path="/categories" element={<CategoryManagement />} />
                <Route path="/courses" element={<CourseManagement />} />
                <Route path="/modules" element={<ModuleManagement />} />
                <Route path="/live-classes" element={<ContentManagement type="LiveClasses" />} />
                <Route path="/recorded-classes" element={<ContentManagement type="RecordedClasses" />} />
                <Route path="/tests" element={<ContentManagement type="Tests" />} />
                <Route path="/study-materials" element={<ContentManagement type="StudyMaterials" />} />
                <Route path="/liveclass/:classId" element={<StudentLiveClass />} />
                <Route path="/teacherclass/:classId" element={<TeacherLiveClass />} />
              </Route>

              <Route path="*" element={<ComingSoon />} />

              <Route element={<ProtectedRoute roles={[ROLES.EDITOR, ROLES.ADMIN]} />}>
                <Route path="/pages" element={<PagesManagement />} />
                <Route path="/entities" element={<EntityManagement />} />
              </Route>
            </Route>
          </Route>

          <Route path="/unauthorized" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}