import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import { BannerProvider } from "../context/BannerContext";
import { useAuth } from "../context/UserContext";
import DriverTour from "../components/Tour/DriverTour";
import { useEffect, useState } from "react";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { user } = useAuth() as any;
  const [startTour, setStartTour] = useState(false);

  useEffect(() => {
    if (!user) return

    const hasSeen = localStorage.getItem(`dashboardTour_${user?.email}`);

    if (!hasSeen) {
      setTimeout(() => {
        setStartTour(true);
      }, 500);
    }
    
  }, [user]);

  return (
    <div className="min-h-screen max-w-screen">
      {user?.role === 'user' && 
      <DriverTour
        start={startTour}
        profile={user}
        onFinish={() => setStartTour(false)}
      />}

      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <AppHeader />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[260px]" : "lg:ml-[120px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <div className="p-2 sm:p-4 mx-auto bg-[#FDF4EF] dark:bg-gray-900  md:p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <BannerProvider>
      <SidebarProvider>
        <LayoutContent />
      </SidebarProvider>
    </BannerProvider>
  );
};

export default AppLayout;
