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
  Users,
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
  Book
} from "lucide-react";
type IconType = React.ElementType;

type NavItem = {
  name: string;
  icon: IconType;
  path?: string;
  subItems?: { name: string; path: string; icon: IconType; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: FileText,
    name: "Mock Tests",
    path: "/mock-tests"
  },
  {
    icon: GraduationCap,
    name: "Courses",
    subItems: [
      { name: "All Courses", path: "/courses", icon: ClipboardList },
      {
        icon: BookOpen,
        name: "Categories",
        path: "/categories",
      },
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
      { name: "Tests", path: "/tests", icon: ScrollText },
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
  {
    icon: FolderOpen,
    name: "Resources",
    path: "/study-materials",
  },
  {
    icon: Users,
    name: "Users",
    path: "/users",
  },
  {
    icon: Rocket,
    name: "Leads",
    path: "/leads",
  },
  {
    icon: Tag,
    name: "Coupons",
    path: "/promocodes",
  },
  {
    icon: Bell,
    name: "Notifications",
    path: "/notifications",
  },
  {
    icon: Phone,
    name: "Contact",
    path: "/contacts",
  },
  {
    icon: MessageSquare,
    name: "Reviews",
    path: "/reviews",
  },
  {
    icon: Globe,
    name: "Website",
    subItems: [
      { name: "Pages", path: "/pages", icon: File },
      { name: "Entities", path: "/entities", icon: Box },
      { name: "Blogs", path: "/blogs", icon: PenTool },
      { name: "Comments", path: "/comments", icon: MessageCircle },
      { name: "Categories", path: "/blog-categories", icon: Tags },
    ]
  },
  {
    icon: CreditCard,
    name: "Orders",
    path: "/all_transactions",
  }
];

const navItemsUser: NavItem[] = [
  {
    icon: LayoutDashboard,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: Target,
    name: "Batches",
    path: "/course",
  },
  {
    icon: TestTube2,
    name: "Mock Tests",
    path: "/tests",
  },
  {
    icon: Pencil,
    name: "Practice Tests",
    path: "/practice-tests",
  },
  {
    icon: Book,
    name: "Tests Series",
    path: "/test-series",
  },
  {
    icon: BookOpen,
    name: "Study Material",
    path: "/study-material"
  },
  {
    icon: GraduationCap,
    name: "My Courses",
    path: "/my-courses",
  },
  {
    icon: Sparkles,
    name: "Free Quiz",
    path: "/Quiz",
  },
    {
    icon: Gift,
    name: "Offers",
    path: "/offers"
  },
  {
    icon: Handshake,
    name: "Refer & Earn",
    path: "/referrals"
  },
  {
    icon: History,
    name: "Orders History",
    path: "/transactions"
  },
  // {
  //   icon: Calendar,
  //   name: "Calendar",
  //   path: "/events",
  // },
];

const navItemsCoun: NavItem[] = [
  {
    icon: LayoutDashboard,
    name: "Dashboard",
    path: "/",
  },
];

const navItemsMan: NavItem[] = [
  {
    icon: LayoutDashboard,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: PhoneCall,
    name: "Call Reports",
    path: "/lead-report",
  },
  {
    icon: Rocket,
    name: "Leads",
    path: "/leads",
  },
];

const navItemsTeacher: NavItem[] = [
  {
    icon: LayoutDashboard,
    name: "Dashboard",
    path: "/",
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
    name: "Content Management",
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
  {
    icon: User,
    name: "My Profile",
    path: "/profile",
  },
  {
    icon: Headphones,
    name: "Support",
    path: "/support"
  },
  {
    icon: Lock,
    name: "Our Selections",
    path: "/selections"
  },
  {
    icon: Shield,
    name: "Privacy Policy",
    path: "/privacy-policy"
  }
];

const teacherOthersItems: NavItem[] = [
  {
    icon: UserCircle,
    name: "Profile",
    path: "/profile",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
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
      const items = menuType === "main"
        ? (user?.role === "admin" ? navItems : user?.role === "teacher" ? navItemsTeacher : navItemsUser)
        : (user?.role === "teacher" || user?.role === "counselor" ? teacherOthersItems : othersItems);

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

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-0.5">
      {items.map((nav, index) => {
        const isSubmenuOpen = openSubmenu?.type === menuType && openSubmenu?.index === index;
        const hasActiveSubItem = nav.subItems?.some(subItem => isActive(subItem.path));
        const Icon = nav.icon;

        return (
          <li key={nav.name} className="relative">
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-300 ease-in-out
                  ${isSubmenuOpen || hasActiveSubItem
                    ? "text-white font-medium"
                    : "text-gray-100 font-light hover:bg-white/10 hover:scale-105 hover:text-white"
                  }`}
                style={{
                  ...(isSubmenuOpen || hasActiveSubItem
                    ? { backgroundColor: "#F6673C", boxShadow: "0px 2px 2px rgba(0, 0, 0, 0.25)" }
                    : {})
                }}
              >

                {(isExpanded || isHovered || isMobileOpen) ? (
                  <>
                    <Icon className="w-5 h-5 stroke-[1.6px] flex-shrink-0" />
                    <span className=" flex-1 text-left"> {nav.name} </span>
                    <ChevronDown
                      className={`w-4 h-4 flex-shrink-0 transition-transform ${isSubmenuOpen ? "rotate-180" : ""}`}
                    />
                  </>
                ) : (
                  <Icon className="w-6 h-6 mx-auto stroke-[1.6px] flex-shrink-0" />
                )}
              </button>
            ) : nav.path ? (
              <Link
                to={nav.path}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-300
                  ${isActive(nav.path)
                    ? "text-white font-medium"
                    : "text-gray-100 font-light hover:bg-white/10 hover:scale-105 hover:text-white"
                  }`}
                style={{
                  ...(isActive(nav.path)
                    ? { backgroundColor: "#F6673C", boxShadow: "0px 2px 2px rgba(0, 0, 0, 0.25)" }
                    : {})
                }}
              >
                {(isExpanded || isHovered || isMobileOpen) ? (
                  <>
                    <Icon className="w-5 h-5 stroke-[1.6px] flex-shrink-0" />
                    <span className=""> {nav.name} </span>
                  </>
                ) : (
                  <Icon className="w-6 mx-auto h-6 stroke-[1.6px] flex-shrink-0" />
                )}
              </Link>
            ) : null}

            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => { subMenuRefs.current[`${menuType}-${index}`] = el; }}
                className="overflow-hidden transition-all duration-500 ease-in-out"
                style={{
                  height: isSubmenuOpen ? `${subMenuHeight[`${menuType}-${index}`] || 0}px` : "0px",
                  opacity: isSubmenuOpen ? 1 : 0,
                }}
              >
                <ul className="pt-2 space-y-[3px] ml-2">
                  {nav.subItems.map((subItem) => {
                    const SubIcon = subItem.icon;
                    return (
                      <li key={subItem.name}>
                        <Link
                          to={subItem.path}
                          className={`flex items-center justify-between gap-3 px-3 py-2 rounded text-[15px] transition-all duration-300
                            ${isActive(subItem.path)
                              ? "bg-[#F6673C] text-white font-medium"
                              : "text-gray-100 font-light hover:scale-105 hover:bg-white/5 hover:text-gray-200"
                            }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <SubIcon className="w-4 h-4" />
                            <span>{subItem.name}</span>
                          </div>
                          <div className="flex gap-1">
                            {subItem.new && (
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full font-medium ${isActive(subItem.path)
                                  ? "bg-orange-400 text-white"
                                  : "bg-green-500/20 text-green-300"
                                  }`}
                              >
                                New
                              </span>
                            )}
                            {subItem.pro && (
                              <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded-full font-medium">
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

  const getMenuItems = (menuType: "main" | "others") => {
    if (menuType === "main") {
      if (user?.role === "admin") return navItems;
      if (user?.role === "counselor") return navItemsCoun;
      if (user?.role === "manager" || user?.role === "leader") return navItemsMan;
      if (user?.role === "teacher") return navItemsTeacher;
      return navItemsUser;
    } else {
      if (user?.role === "teacher" || user?.role === "counselor" || user?.role === "manager" || user?.role === "leader") return teacherOthersItems;
      return othersItems;
    }
  };

  const primaryColor = "#FF7147";   // Accent Orange
  const sidebarBg = "#3F3F3F";       // Primary Dark

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 text-white h-screen transition-all duration-300 ease-in-out z-50 shadow-lg
        ${isExpanded || isMobileOpen
          ? "w-[240px]"
          : isHovered
            ? "w-[240px]"
            : "w-[80px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      style={{ backgroundColor: sidebarBg }}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex px-5 pt-2 transition-all ${!isExpanded && !isHovered ? "justify-center" : "justify-start"}`}>
        <Link to="/" className="flex items-center transform hover:scale-105 transition-transform duration-200">
          {isExpanded || isHovered || isMobileOpen ? (
            <img
              src="https://www.ooshasprep.com/home/logo.png"
              alt="Logo"
              width={120}
              height={20}
            />
          ) : (
            <img
              src="https://ooshasglobal.com/images/fevi-icon.png"
              alt="Logo"
              className="scale-160"
              width={120}
              height={30}
            />
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex px-3 py-2 flex-col flex-1 overflow-y-auto no-scrollbar">
        <nav className="mb-6 flex-1">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className={`mb-3 text-xs uppercase text-gray-400 font-semibold tracking-wider ${!isExpanded && !isHovered ? "pl-3" : "pl-3"}`}>
                {isExpanded || isHovered || isMobileOpen ? "Menu" : ""}
              </h2>
              {renderMenuItems(getMenuItems("main"), "main")}
            </div>

            <div>
              <h2 className={`mb-3 text-xs uppercase text-gray-400 font-semibold tracking-wider ${!isExpanded && !isHovered ? "pl-3" : "pl-3"}`}>
                {isExpanded || isHovered || isMobileOpen
                  ? user?.role === "teacher" ? "Account" : "Others"
                  : ""
                }
              </h2>
              {renderMenuItems(getMenuItems("others"), "others")}
            </div>
          </div>
        </nav>
        {/* User Profile */}
        {(isExpanded || isHovered || isMobileOpen) && user && (
          <div className="p-0.5 rounded-xl bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30">
            <div className="flex items-center gap-1 p-3 px-1 rounded-xl bg-white/5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user.name || "User"}
                </p>
                <p className="text-xs text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;