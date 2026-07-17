import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/UserContext";
import {
  ChevronDown,
  LayoutDashboard,
  FileText,
  GraduationCap,
  ClipboardList,
  BookOpen,
  Folder,
  Package,
  ClipboardCheck,
  FileCheck,
  Layers,
  HelpCircle,
  ScrollText,
  ShoppingBag,
  Database,
  CircleHelp,
  TestTube,
  Scroll,
  Video,
  PlayCircle,
  FolderOpen,
  Rocket,
  Tag,
  Bell,
  Phone,
  MessageSquare,
  Globe,
  File,
  Box,
  PenTool,
  MessageCircle,
  Tags,
  CreditCard,
  Target,
  TestTube2,
  Sparkles,
  Calendar,
  PhoneCall,
  User,
  Gift,
  Handshake,
  History,
  Headphones,
  Lock,
  Shield,
  UserCircle,
  PlusCircle,
  TrendingUp,
  Upload,
  BarChart3,
  Pencil,
  Book,
  UsersRound,
  ArrowBigLeft,
  ChevronRight,
  ChevronLeft
} from "lucide-react";

type IconType = React.ElementType;

type NavItem = {
  name: string;
  icon: IconType;
  path?: string;
  subItems?: { name: string; path: string; icon: IconType; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  { icon: LayoutDashboard, name: "Dashboard", path: "/" },
  { icon: FileText, name: "Mock Tests", path: "/mock-tests" },
  {
    icon: GraduationCap,
    name: "Courses",
    subItems: [
      { name: "All Courses", path: "/courses", icon: ClipboardList },
      { icon: BookOpen, name: "Categories", path: "/categories" },
      { name: "Modules", path: "/modules", icon: Folder },
      { name: "Combos", path: "/combos", icon: Package }
    ]
  },
  {
    icon: ClipboardCheck,
    name: "Test Series",
    subItems: [
      { name: "Exams", path: "/test/exams", icon: FileCheck },
      { name: "Sections", path: "/test/sections", icon: Layers },
      { name: "Questions", path: "/test/questions", icon: HelpCircle },
      { name: "Tests", path: "/test-manage", icon: ScrollText },
      { name: "Packages", path: "/test/packages", icon: ShoppingBag }
    ]
  },
  {
    icon: Database,
    name: "Mcq Bank",
    subItems: [
      { name: "Questions", path: "/mcq/questions", icon: CircleHelp },
      { name: "Tests", path: "/mcq/tests", icon: TestTube },
      { name: "Test Series", path: "/mcq/test-series", icon: Scroll }
    ]
  },
  {
    icon: Video,
    name: "Classes",
    subItems: [
      { name: "Live", path: "/live-classes", icon: Video },
      { name: "Recorded", path: "/recorded-classes", icon: PlayCircle }
    ]
  },
  { icon: FolderOpen, name: "Resources", path: "/study-materials" },
  { icon: UsersRound, name: "Users", path: "/users" },
  { icon: Rocket, name: "Leads", path: "/leads" },
  { icon: Tag, name: "Coupons", path: "/promocodes" },
  { icon: Bell, name: "Notifications", path: "/notifications" },
  { icon: Phone, name: "Contact", path: "/contacts" },
  { icon: MessageSquare, name: "Reviews", path: "/reviews" },
  {
    icon: Globe,
    name: "Website",
    subItems: [
      { name: "Pages", path: "/pages", icon: File },
      { name: "Entities", path: "/entities", icon: Box },
      { name: "Blogs", path: "/blogs", icon: PenTool },
      { name: "Comments", path: "/comments", icon: MessageCircle },
      { name: "Categories", path: "/blog-categories", icon: Tags }
    ]
  },
  { icon: CreditCard, name: "Orders", path: "/all_transactions" }
];

const navItemsUser: NavItem[] = [
  { icon: LayoutDashboard, name: "Dashboard", path: "/" },
  { icon: Target, name: "Batches", path: "/course" },
  { icon: TestTube2, name: "Mock Tests", path: "/tests" },
  { icon: Pencil, name: "Practice Tests", path: "/practice-tests" },
  { icon: Book, name: "Tests Series", path: "/test-series" },
  { icon: BookOpen, name: "Study Material", path: "/study-material" },
  { icon: GraduationCap, name: "My Courses", path: "/my-courses" },
  { icon: Sparkles, name: "Free Quiz", path: "/Quiz" },
  { icon: Gift, name: "Offers", path: "/offers" },
  { icon: Handshake, name: "Refer & Earn", path: "/referrals" },
  { icon: History, name: "Orders History", path: "/transactions" }
];

const navItemsCoun: NavItem[] = [
  { icon: LayoutDashboard, name: "Dashboard", path: "/" }
];

const navItemsMan: NavItem[] = [
  { icon: LayoutDashboard, name: "Dashboard", path: "/" },
  { icon: PhoneCall, name: "Call Reports", path: "/lead-report" },
  { icon: Rocket, name: "Leads", path: "/leads" }
];

const navItemsTeacher: NavItem[] = [
  { icon: LayoutDashboard, name: "Dashboard", path: "/" },
  {
    icon: Database,
    name: "Mcq Bank",
    subItems: [
      { name: "Questions", path: "/mcq/questions", icon: CircleHelp },
      { name: "Tests", path: "/mcq/tests", icon: TestTube },
      { name: "Test Series", path: "/mcq/test-series", icon: Scroll }
    ]
  },
  {
    icon: GraduationCap,
    name: "My Courses",
    subItems: [
      { name: "Create Course", path: "/teacher/create-course", icon: PlusCircle },
      { name: "My Courses", path: "/teacher/courses", icon: ClipboardList },
      { name: "Course Analytics", path: "/teacher/analytics", icon: TrendingUp }
    ]
  },
  {
    icon: Folder,
    name: "Content",
    subItems: [
      { name: "Upload Content", path: "/teacher/upload", icon: Upload },
      { name: "Manage Content", path: "/teacher/content", icon: Database }
    ]
  },
  {
    icon: ClipboardCheck,
    name: "Assessments",
    subItems: [
      { name: "Create Test", path: "/teacher/create-test", icon: Pencil },
      { name: "Test Results", path: "/teacher/results", icon: BarChart3 }
    ]
  }
];

const othersItems: NavItem[] = [
  { icon: User, name: "My Profile", path: "/profile" },
  { icon: Headphones, name: "Support", path: "/support" },
  { icon: Lock, name: "Our Selections", path: "/our-selection" },
  { icon: Shield, name: "Privacy Policy", path: "/privacy-policy" }
];

const teacherOthersItems: NavItem[] = [
  { icon: UserCircle, name: "Profile", path: "/profile" }
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const location = useLocation();
  const { user } = useAuth() as any;
  const navigate = useNavigate();


  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items =
        menuType === "main"
          ? user?.role === "admin"
            ? navItems
            : user?.role === "teacher"
              ? navItemsTeacher
              : user?.role === "counselor"
                ? navItemsCoun
                : user?.role === "manager" || user?.role === "leader"
                  ? navItemsMan
                  : navItemsUser
          : user?.role === "teacher" || user?.role === "counselor" || user?.role === "manager" || user?.role === "leader"
            ? teacherOthersItems
            : othersItems;

      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType as "main" | "others", index });
              submenuMatched = true;
            }
          });
        }
      });
    });
    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive, user?.role]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      const el = subMenuRefs.current[key];
      if (el) {
        setSubMenuHeight(prev => ({ ...prev, [key]: el.scrollHeight }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu(prev =>
      prev?.type === menuType && prev.index === index ? null : { type: menuType, index }
    );
  };

  const showLabels = isExpanded || isHovered || isMobileOpen;

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-0.5">
      {items.map((nav, index) => {
        const isSubmenuOpen = openSubmenu?.type === menuType && openSubmenu?.index === index;
        const hasActiveSubItem = nav.subItems?.some(subItem => isActive(subItem.path));
        const active = isSubmenuOpen || hasActiveSubItem;
        const Icon = nav.icon;

        return (
          <li key={nav.name} className="relative">
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ransition-all duration-200 ease-out group relative
                  ${active ? "font-semibold" : "font-medium"}
                  ${active
                    ? "bg-orange-500/10 text-orange-500"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-orange-500" />
                )}

                {showLabels ? (
                  <>
                    <Icon className={`w-[20px] h-[20px] stroke-[2.2] flex-shrink-0 transition-colors duration-200 ${active ? "text-orange-500" : "text-zinc-500 dark:text-zinc-500"}`} />
                    <span className="flex-1 text-left text-[15px] tracking-wide">{nav.name}</span>
                    <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-300 text-zinc-300 dark:text-zinc-600 ${isSubmenuOpen ? "rotate-180" : ""}`} />
                  </>
                ) : (
                  <div className="relative flex flex-col gap-1 items-center justify-center w-full">
                    <Icon className={`w-6 h-6 stroke-[1.7] transition-colors duration-200 ${active ? "text-orange-600" : "text-zinc-500 dark:text-zinc-500"}`} />
                    <span className=" text-left font-medium text-[10px] tracking-wide">{nav.name}</span>
                  </div>
                )}
              </button>
            ) : nav.path ? (
              <Link
                to={nav.path}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-out group relative
                  ${isActive(nav.path) ? "font-semibold" : "font-medium"}
                  ${isActive(nav.path)
                    ? "bg-orange-500/10 text-orange-500"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
              >
                {isActive(nav.path) && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-7 rounded-r-full bg-orange-500" />
                )}

                {showLabels ? (
                  <>
                    <Icon className={`w-[20px] h-[20px] stroke-[2.2] flex-shrink-0 transition-colors duration-200 ${isActive(nav.path) ? "text-orange-500" : "text-zinc-500 dark:text-zinc-500"}`} />
                    <span className="text-[15px] tracking-wide">{nav.name}</span>
                  </>
                ) : (
                  <div className="relative flex flex-col gap-1 items-center justify-center w-full">
                    <Icon className={`w-6 h-6 stroke-[1.7] transition-colors duration-200 ${isActive(nav.path) ? "text-orange-600" : "text-zinc-500 dark:text-zinc-500"}`} />

                    <span className=" text-left font-medium text-[10px] tracking-wide">{nav.name}</span>
                  </div>
                )}
              </Link>
            ) : null}

            {nav.subItems && showLabels && (
              <div
                ref={(el) => { subMenuRefs.current[`${menuType}-${index}`] = el; }}
                className="overflow-hidden transition-all duration-400 ease-in-out"
                style={{
                  height: isSubmenuOpen ? `${subMenuHeight[`${menuType}-${index}`] || 0}px` : "0px",
                  opacity: isSubmenuOpen ? 1 : 0
                }}
              >
                <ul className="pt-1.5 pb-1 space-y-[2px] ml-3 pl-3 border-l border-zinc-100 dark:border-white/[0.06]">
                  {nav.subItems.map((subItem) => {
                    const SubIcon = subItem.icon;
                    const subActive = isActive(subItem.path);
                    return (
                      <li key={subItem.name}>
                        <Link
                          to={subItem.path}
                          className={`flex items-center justify-between gap-2.5 px-3 py-[9px] rounded-lg text-[14px] transition-all duration-200
                            ${subActive ? "font-medium" : "font-medium"}
                            ${subActive
                              ? "bg-orange-500/10 text-orange-500"
                              : "text-zinc-600 dark:text-zinc-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-zinc-900 dark:hover:text-zinc-100"
                            }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{subItem.name}</span>
                          </div>
                          <div className="flex gap-1.5">
                            {subItem.new && (
                              <span className={`px-1.5 py-[1px] text-[10px] rounded-md font-semibold uppercase tracking-wide ${subActive
                                ? "bg-orange-500 text-white"
                                : "bg-green-500/10 text-green-600 dark:text-green-400"
                                }`}>
                                New
                              </span>
                            )}
                            {subItem.pro && (
                              <span className="px-1.5 py-[1px] text-[10px] rounded-md font-semibold uppercase tracking-wide bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                Pro
                              </span>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const getMenuItems = (menuType: "main" | "others") => {
    if (menuType === "main") {
      if (user?.role === "admin") return navItems;
      if (user?.role === "counselor") return navItemsCoun;
      if (user?.role === "manager" || user?.role === "leader") return navItemsMan;
      if (user?.role === "teacher") return navItemsTeacher;
      return navItemsUser;
    } else {
      if (user?.role === "teacher" || user?.role === "counselor" || user?.role === "manager" || user?.role === "leader")
        return teacherOthersItems;
      return othersItems;
    }
  };

  return (
    <div className="relative">

      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 99px; }
        .dark .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #a1a1aa; }
        .dark .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>

      <aside
        className={`fixed mt-13 pt-2 flex flex-col lg:mt-0 top-0 left-0 h-screen transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-50
          bg-white dark:bg-[#1e1e2d]
          border-r border-gray-200 dark:border-gray-700
          ${isExpanded || isMobileOpen ? "w-[260px]" : isHovered ? "w-[260px]" : "w-[120px]"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div className="flex items-center lg:h-[70px] px-4 flex-shrink-0 ">
          {/* <Link to="/" className="flex items-center justify-start w-full">
            {showLabels ? (
              <img src="/ooshas-logo.png" alt="Logo" width={120} height={24} className="object-contain" />
            ) : (
              <img src="https://www.ooshasprep.com/fevicon.ico" alt="Logo" className="scale-[1.1]" width={32} height={32} />
            )}
          </Link> */}
        </div>

        {/* Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto sidebar-scroll px-2.5 py-3">
          <button
            className="hidden lg:flex absolute lg:top-18 -right-4 items-center justify-center p-2 w-9 h-9 text-gray-100 dark:text-gray-400 border border-gray-200 dark:border-gray-800 rounded-full bg-gray-600 dark:bg-gray-800 hover:bg-gray-500 dark:hover:bg-gray-700 transition-all duration-200"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen || isExpanded || isHovered ? (
              <ChevronLeft/>
            ) : (
              <ChevronRight/>
            )}
          </button>
          <nav className="flex-1 flex flex-col gap-5">
            <div>
              {showLabels && (
                <p className="mb-2 px-3 text-[12px] font-bold uppercase text-zinc-500 dark:text-zinc-600">
                  Menu
                </p>
              )}
              {renderMenuItems(getMenuItems("main"), "main")}
            </div>
            <div>
              {showLabels && (
                <p className="mb-2 px-3 text-[12px] font-bold uppercase text-zinc-500 dark:text-zinc-600">
                  {user?.role === "teacher" ? "Account" : "Others"}
                </p>
              )}
              {renderMenuItems(getMenuItems("others"), "others")}
            </div>
          </nav>
          {/* Bottom */}
          {/* <div className="flex flex-col gap-2 mt-4 pt-4 flex-shrink-0 border-t border-zinc-100 dark:border-white/[0.06]">
            {user && (showLabels ? (
              <div
                className="rounded-lg p-2.5 transition-all duration-200 cursor-pointer bg-zinc-50 dark:bg-white/[0.04] border border-orange-500/20 dark:border-orange-500/20 hover:border-orange-500 hover:bg-orange-500/5 dark:hover:bg-white/[0.08]"
                onClick={() => navigate("/profile")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm bg-gradient-to-br from-orange-500 to-orange-400">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate text-zinc-900 dark:text-zinc-100">
                      {user.name || "User"}
                    </p>
                    <p className="text-[11px] truncate capitalize text-zinc-400 dark:text-zinc-500">
                      {user.role || "Member"}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0 text-zinc-300 dark:text-zinc-600" />
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm cursor-pointer shadow-sm bg-gradient-to-br from-orange-500 to-orange-400 transition-transform duration-200 hover:scale-105"
                  onClick={() => navigate("/profile")}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
              </div>
            ))}
          </div> */}
        </div>
      </aside>
    </div>
  );
};

export default AppSidebar;