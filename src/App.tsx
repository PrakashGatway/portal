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
import ApiSwitchManagement from "./pages/Website/Entities";
import EntityManagement from "./pages/Website/Entities";
import ComingSoon from "./pages/OtherPage/ComingSoon";

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