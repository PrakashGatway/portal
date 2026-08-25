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
import MockTestsPage from "./userView/TestSeries";
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
import BlogsManagement from "./pages/Website/Article";
import FaqsManagement from "./pages/Website/Faq";
import CommentsManagement from "./pages/Website/BlogComent";
import MockTest from "./userView/Mocktest";
import TestQuestionPage from "./userView/Testquestionpage";
import PackageManagement from "./pages/Tests/Packages";
import FullLengthTestPage from "./pages/TestScreen/FullTest";
import FullTestsPage from "./userView/SatTest";
import QuestionManagementPage from "./pages/mcu/Questions";
import TestTemplateManagementPage from "./pages/mcu/TestTemplates";
import SatTestAttemptPage from "./pages/SatTest/SatAttempts";
import GmatTestAttemptPage from "./pages/mcu/GmatTest";
import GreTestAttemptPage from "./pages/mcu/GreAttempts";
import GmatTestAnalysisPage from "./pages/mcu/GmatAnaysis";
import PteExamPage from "./pages/PTEtest/PteAttempts";
import TestSeriesManagementPage from "./pages/TestSeries/TestSeriesPage";
import TestSeriesDetailPage from "./usercomponent/TestSeriesDetail";
import DailyReport from "./pages/Leads/DailyReport";
import { Toaster } from "sonner";
import MockTests from "./tests/mcqtest";
import JobSelectionsWall from "./userView/Selection";
import SecureMaterialViewer from "./userView/SecureMaterial";
import Setting from "./pages/Dashboard/Setting";
import Notifications from "./pages/Notifications";
import SupportTickets from "./pages/Support/Tickets";
import Privacy from "./pages/privacy";
import FeedbackPage from "./pages/feedbackPage";
import IELTSQuestionManagementPage from "./pages/ielts/ieltsQuestion";
import IELTSGroupQuestionManagementPage from "./pages/ielts/ieltsGroup";
import IELTSPassageManagementPage from "./pages/ielts/ieltsPassage";
import IeltsTestManagementPage from "./pages/ielts/ieltsTest";
// import IeltsTestResultPage from "./pages/ielts/IeltsResult";

import IeltsTestPlatform from "./pages/ielts/ieltsTestAttempt";
import ContentViewPage from "./pages/liveClass/Session";
import CourseContentManagement from "./pages/Courses/CourseContent";

// Define roles
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  EDITOR: "editor",
  COUNSEL: "counselor",
  MANAGER: "manager",
  LEADER: "leader",
  TEACHER: "teacher",
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastContainer style={{ zIndex: 999999 }} />
        <Toaster position="top-center" richColors closeButton />
        <ScrollToTop />
        <Routes>
          {/* <Route element={<AuthRoute />}>
            <Route path="/signin" element={<SignIn />} />
          </Route> */}

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index path="/" element={<Home />} />
              //completed
              <Route path="/offers" element={<OffersPage />} />
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/coming" element={<ComingSoon />} />
              <Route path="/course" element={<CourseListingPage />} />
              <Route path="/course/:slug" element={<CourseDetailPage />} />
              <Route path="/sessions/:slug" element={<ContentViewPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/referrals" element={<ReferAndEarnPage />} />
              //support
              <Route path="/support" element={<SupportPage />} />
              <Route path="/all-tickets" element={<SupportTickets />} />
              <Route path="/our-selection" element={<JobSelectionsWall />} />
              <Route path="/calendar" element={<EventCalendar />} />
              // my course
              <Route path="/my-courses" element={<MyCoursesPage />} />
              <Route path="/courses/:slug" element={<CourseDetailPageee />} />
              // study material
              <Route path="/resources" element={<StudyMaterialPage />} />
              <Route
                path="/resources/:slug"
                element={<SecureMaterialViewer />}
              />
              // Video player
              <Route
                path="/class/:contentId/:courseId"
                element={<VideoPlayerPage />}
              />
              // test series
              <Route path="/test-series" element={<MockTestsPage />} />
              <Route
                path="/tests"
                element={<MockTests testType="full_length" />}
              />
              <Route
                path="/practice-tests"
                element={<MockTests testType="sectional" />}
              />
              <Route path="/quiz" element={<MockTests testType="quiz" />} />
              <Route
                path="/test-series/:slug"
                element={<TestSeriesDetailPage />}
              />
              // ilets
              <Route path="/mock-tests" element={<MockTest />} />
              {/* <Route path="/test/:testId" element={<TestQuestionPage/>} /> */}
              // admin
              <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
                <Route path="/users" element={<UserListPage />} />

                <Route path="/reviews-report" element={<FeedbackPage />} />

                <Route path="/promocodes" element={<PromoCodeManagement />} />
                <Route
                  path="/all_transactions"
                  element={<AdminTransactionsPage />}
                />

                <Route path="/test/exams" element={<ExamManagement />} />
                <Route path="/test/sections" element={<SectionManagement />} />
                <Route path="/test-manage" element={<TestSeriesManagement />} />
                {/* <Route
                  path="/test/questions"
                  element={<QuestionManagement />}
                /> */}
                <Route
                  path="/test/questions"
                  element={<IELTSQuestionManagementPage />}
                />
                <Route
                  path="/test/groups"
                  element={<IELTSGroupQuestionManagementPage />}
                />
                <Route
                  path="/test/passage"
                  element={<IELTSPassageManagementPage />}
                />
                <Route path="/test" element={<IeltsTestManagementPage />} />

                <Route path="/test/packages" element={<PackageManagement />} />
                <Route path="/setting" element={<Setting />} />
              </Route>
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/privacy-policy" element={<Privacy />} />
              // teachers
              <Route
                element={
                  <ProtectedRoute roles={[ROLES.TEACHER, ROLES.ADMIN]} />
                }
              >
                <Route
                  path="/mcq/questions"
                  element={<QuestionManagementPage />}
                />
                <Route
                  path="/mcq/tests"
                  element={<TestTemplateManagementPage />}
                />
                <Route
                  path="/mcq/test-series"
                  element={<TestSeriesManagementPage />}
                />
                <Route
                  path="/live-classes"
                  element={<ContentManagement type="LiveClasses" />}
                />
                <Route
                  path="/sessions"
                  element={<ContentManagement type="Sessions" />}
                />
                 <Route
                  path="/course-tests"
                  element={<ContentManagement type="Tests" />}
                />
                <Route
                  path="/recorded-classes"
                  element={<ContentManagement type="RecordedClasses" />}
                />
                <Route
                  path="/study-materials"
                  element={<ContentManagement type="StudyMaterials" />}
                />

                <Route path="/courses" element={<CourseManagement />} />
                <Route path="/courses/content/:courseId" element={<CourseContentManagement />} />

                <Route path="/modules" element={<ModuleManagement />} />
                <Route path="/categories" element={<CategoryManagement />} />

              </Route>
              // Crm
              <Route
                element={
                  <ProtectedRoute
                    roles={[
                      ROLES.COUNSEL,
                      ROLES.ADMIN,
                      ROLES.MANAGER,
                      ROLES.LEADER,
                    ]}
                  />
                }
              >
                <Route path="/leads" element={<LeadManagement />} />
                <Route path="/lead-report" element={<DailyReport />} />
              </Route>
              // website
              <Route
                element={<ProtectedRoute roles={[ROLES.EDITOR, ROLES.ADMIN]} />}
              >
                <Route path="/pages" element={<PagesManagement />} />
                <Route path="/entities" element={<EntityManagement />} />
                <Route
                  path="/blog-categories"
                  element={<BlogCategoryManagement />}
                />
                <Route path="/article" element={<ArticleManagement />} />
                <Route path="/blogs" element={<BlogsManagement />} />
                <Route path="/faqs" element={<FaqsManagement />} />
                <Route path="/comments" element={<CommentsManagement />} />
              </Route>
            </Route>

            <Route
              path="/course/category"
              element={<CategorySelectionPage />}
            />
            <Route path="/checkout/:slug" element={<CheckoutPage />} />
            <Route path="/payment-status" element={<PaymentStatusPage />} />
            <Route
              path="/full/:testSeriesId"
              element={<FullLengthTestPage />}
            />
            <Route path="/sat" element={<FullTestsPage />} />
            <Route
              path="/mcq/tests/:testTemplateId"
              element={<SatTestAttemptPage />}
            />
            <Route
              path="/gmat/tests/:testTemplateId"
              element={<GmatTestAttemptPage />}
            />
            <Route
              path="/gre/tests/:testTemplateId"
              element={<GreTestAttemptPage />}
            />
            <Route
              path="/gmat/analysis/:attemptId"
              element={<GmatTestAnalysisPage />}
            />
            <Route
              path="/pte/tests/:testTemplateId"
              element={<PteExamPage />}
            />
            <Route
              path="/ielts/tests/:testId"
              element={<IeltsTestPlatform />}
            />
            {/* <Route
              path="/ielts/results/:testId"
              element={<IeltsTestResultPage />}
            /> */}
            <Route path="*" element={<ComingSoon />} />
          </Route>
          <Route path="/unauthorized" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
