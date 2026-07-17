import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen max-w-screen 3xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <AppHeader />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${(isExpanded || isHovered) ? "lg:ml-[260px]" : "lg:ml-[100px]"
          } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <div className="p-2 sm:p-6 mx-auto bg-[#F5F5F6] dark:bg-gray-900 max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
