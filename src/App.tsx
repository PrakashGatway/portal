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
import PagesManagement from "./pages/Website/Pages";
import EntityManagement from "./pages/Website/Entities";
import ComingSoon from "./pages/OtherPage/ComingSoon";
import CategoryManagement from "./pages/Courses/Categories";
import CourseManagement from "./pages/Courses/Courses";
import ModuleManagement from "./pages/Courses/Modules";
import ContentManagement from "./pages/Content/Contents";
import CategorySelectionPage from "./pages/Category/CategorySelection";
import CourseListingPage from "./pages/CourseList/CourseUsers";
import VideoPlayerPage from "./pages/Player/Player";
import MockTestsPage from "./userView/MocktestPage";
import EventCalendar from "./userView/Events";
import CourseDetailPage from "./userView/CourseDetails";
import CheckoutPage from "./userView/CheckoutPage";
import OffersPage from "./userView/MyOffer";
import ReferAndEarnPage from "./userView/Referal";
import TransactionsPage from "./userView/TransationPage";
import PromoCodeManagement from "./pages/Offers/offers";
import MyCoursesPage from "./userView/MyCourse";
import StudyMaterialPage from "./userView/StudyMaterial";
import PaymentStatusPage from "./userView/PaymentStatus";
import AdminTransactionsPage from "./pages/Transaction";
import LeadManagement from "./pages/Leads/LeadManagement";
import CourseDetailPageee from "./userView/MyCourseDetail";
import ExamManagement from "./pages/Tests/Exam";
import SectionManagement from "./pages/Tests/Sections";
import TestSeriesManagement from "./pages/Tests/Tests";
import QuestionManagement from "./pages/Tests/Questions";
import SupportPage from "./pages/Support/Supports";
import BlogCategoryManagement from "./pages/Website/BlogCategories";
import ArticleManagement from "./pages/Website/Blogs";
import CommentsManagement from "./pages/Website/BlogComent";
import MockTest from "./userView/Mocktest";
import TestQuestionPage from "./userView/Testquestionpage";
import PackageManagement from "./pages/Tests/Packages";
import FullLengthTestPage from "./pages/TestScreen/FullTest";
import FullTestsPage from "./userView/SatTest";
import QuestionManagementPage from "./pages/mcu/Questions";
import TestTemplateManagementPage from "./pages/mcu/TestTemplates";
import SatTestAttemptPage from "./pages/mcu/Attempts";
import GmatTestAttemptPage from "./pages/mcu/GmatTest";
import GreTestAttemptPage from "./pages/mcu/GreAttempts";
import GmatTestAnalysisPage from "./pages/mcu/GmatAnaysis";

// Define roles
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  EDITOR: 'editor',
  COUNSEL: 'counselor',
  MANAGER: "manager"
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
              <Route path="/course" element={<CourseListingPage />} />
              <Route path="/course/:slug" element={<CourseDetailPage />} />

              <Route path="/offers" element={<OffersPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/referrals" element={<ReferAndEarnPage />} />
              <Route path="/my-courses" element={<MyCoursesPage />} />
              <Route path="/courses/:slug" element={<CourseDetailPageee />} />
              <Route path="/study-material" element={<StudyMaterialPage />} />
              <Route path="/class/:contentId/:courseId" element={<VideoPlayerPage />} />
              <Route path="/support" element={<SupportPage />} />

              <Route path="/mocks" element={<MockTestsPage />} />
              <Route path="/mock-tests" element={<MockTest />} />
              <Route path="/test/:testId" element={<TestQuestionPage />} />
              <Route path="/events" element={<EventCalendar />} />

              <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
                <Route path="/users" element={<UserListPage />} />
                <Route path="/categories" element={<CategoryManagement />} />
                <Route path="/courses" element={<CourseManagement />} />
                <Route path="/modules" element={<ModuleManagement />} />
                <Route path="/live-classes" element={<ContentManagement type="LiveClasses" />} />
                <Route path="/recorded-classes" element={<ContentManagement type="RecordedClasses" />} />
                <Route path="/promocodes" element={<PromoCodeManagement />} />
                <Route path="/all_transactions" element={<AdminTransactionsPage />} />
                {/* <Route path="/tests" element={<ContentManagement type="Tests" />} /> */}
                <Route path="/study-materials" element={<ContentManagement type="StudyMaterials" />} />

                <Route path="/test/exams" element={<ExamManagement />} />
                <Route path="/test/sections" element={<SectionManagement />} />
                <Route path="/tests" element={<TestSeriesManagement />} />
                <Route path="/test/questions" element={<QuestionManagement />} />
                <Route path="/test/packages" element={<PackageManagement />} />

                <Route path="/mcu/questions" element={<QuestionManagementPage />} />
                <Route path="/mcu/tests" element={<TestTemplateManagementPage />} />
              </Route>

              <Route element={<ProtectedRoute roles={[ROLES.COUNSEL, ROLES.ADMIN, ROLES.MANAGER]} />}>
                <Route path="/leads" element={<LeadManagement />} />
              </Route>

              <Route path="*" element={<ComingSoon />} />

              <Route element={<ProtectedRoute roles={[ROLES.EDITOR, ROLES.ADMIN]} />}>
                <Route path="/pages" element={<PagesManagement />} />
                <Route path="/entities" element={<EntityManagement />} />
                <Route path="/blog-categories" element={<BlogCategoryManagement />} />
                <Route path="/blogs" element={<ArticleManagement />} />
                <Route path="/comments" element={<CommentsManagement />} />
              </Route>
            </Route>
            <Route path="/course/category" element={<CategorySelectionPage />} />
            <Route path="/checkout/:slug" element={<CheckoutPage />} />
            <Route path="/payment-status" element={<PaymentStatusPage />} />
            <Route path="/full/:testSeriesId" element={<FullLengthTestPage />} />
            <Route path="/sat" element={<FullTestsPage />} />
            <Route path="/mcu/tests/:testTemplateId" element={<SatTestAttemptPage />} />
            <Route path="/gmat/tests/:testTemplateId" element={<GmatTestAttemptPage />} />
            <Route path="/gre/tests/:testTemplateId" element={<GreTestAttemptPage />} />
            <Route path="/gmat/analysis/:attemptId" element={<GmatTestAnalysisPage />} />
          </Route>
          <Route path="/unauthorized" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}