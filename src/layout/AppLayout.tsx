import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import { BannerProvider } from "../context/BannerContext";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen max-w-screen">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <AppHeader />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${(isExpanded || isHovered) ? "lg:ml-[260px]" : "lg:ml-[120px]"
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
    </SidebarProvider></BannerProvider>
  );
};

export default AppLayout;
