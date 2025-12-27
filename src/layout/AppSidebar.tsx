import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/UserContext";
import { ChevronDown } from "lucide-react";

type NavItem = {
  name: string;
  emoji: string;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean; emoji?: string }[];
};

const navItems: NavItem[] = [
  {
    emoji: "📊",
    name: "Dashboard",
    path: "/",
  },
  {
    emoji: "📝",
    name: "Mock Tests",
    path: "/mock-tests"
  },
  {
    emoji: "🎓",
    name: "Courses",
    subItems: [
      { name: "All Courses", path: "/courses", emoji: "📋" },
      {
        emoji: "📚",
        name: "Categories",
        path: "/categories",
      },
      { name: "Modules", path: "/modules", emoji: "📹" },
      { name: "Combos", path: "/combos", emoji: "📚" }
    ]
  },
  {
    emoji: "📋",
    name: "Test Series",
    subItems: [
      { name: "Exams", path: "/test/exams", emoji: "📋" },
      { name: "Sections", path: "/test/sections", emoji: "📹" },
      { name: "Questions", path: "/test/questions", emoji: "📚" },
      { name: "Tests", path: "/tests", emoji: "📜" },
      { name: "Packages", path: "/test/packages", emoji: "🛍️" }
    ]
  },
  {
    emoji: "📝",
    name: "Mcq Bank",
    subItems: [
      { name: "Questions", path: "/mcq/questions", emoji: "📋" },
      { name: "Tests", path: "/mcq/tests", emoji: "📚" },
      { name: "Test Series", path: "/mcq/test-series", emoji: "📜" }
    ]
  },
  {
    emoji: "🎥",
    name: "Classes",
    subItems: [
      { name: "Live", path: "/live-classes", emoji: "🎥" },
      { name: "Recorded", path: "/recorded-classes", emoji: "📼" }
    ]
  },
  {
    emoji: "📂",
    name: "Resources",
    path: "/study-materials",
  },
  {
    emoji: "👥",
    name: "Users",
    path: "/users",
  },
  {
    emoji: "🚀",
    name: "Leads",
    path: "/leads",
  },
  {
    emoji: "💝",
    name: "Coupons",
    path: "/promocodes",
  },
  {
    emoji: "🔔",
    name: "Notifications",
    path: "/notifications",
  },
  {
    emoji: "📞",
    name: "Contact",
    path: "/contacts",
  },
  {
    emoji: "📝",
    name: "Reviews",
    path: "/reviews",
  },
  {
    emoji: "🌐",
    name: "Website",
    subItems: [
      { name: "Pages", path: "/pages", emoji: "📄" },
      { name: "Entities", path: "/entities", emoji: "📦" },
      { name: "Blogs", path: "/blogs", emoji: "📝" },
      { name: "Comments", path: "/comments", emoji: "💬" },
      { name: "Categories", path: "/blog-categories", emoji: "📚" },
    ]
  },
  {
    emoji: "💳",
    name: "Orders",
    path: "/all_transactions",
  }
];

const navItemsUser: NavItem[] = [
  {
    emoji: "📊",
    name: "Dashboard",
    path: "/",
  },
  {
    emoji: "🎯",
    name: "Batches",
    path: "/course",
  },
  
  {
    emoji: "🧪",
    name: "Practice Tests",
    path: "/tests",
  },
  {
    emoji: "🗓️",
    name: "Calendar",
    path: "/events",
  },
  {
    emoji: "🎓",
    name: "My Courses",
    path: "/my-courses",
  },
  {
    emoji: "📖",
    name: "Resources",
    path: "/study-material"
  },
];

const navItemsCoun: NavItem[] = [
  {
    emoji: "📊",
    name: "Dashboard",
    path: "/",
  },
];

const navItemsTeacher: NavItem[] = [
  {
    emoji: "📊",
    name: "Dashboard",
    path: "/",
  },
  {
    emoji: "🎓",
    name: "My Courses",
    subItems: [
      { name: "Create Course", path: "/teacher/create-course", emoji: "🆕" },
      { name: "My Courses", path: "/teacher/courses", emoji: "📋" },
      { name: "Course Analytics", path: "/teacher/analytics", emoji: "📈" }
    ]
  },
  {
    emoji: "📦",
    name: "Content Management",
    subItems: [
      { name: "Upload Content", path: "/teacher/upload", emoji: "⬆️" },
      { name: "Manage Content", path: "/teacher/content", emoji: "🗃️" }
    ]
  },
  {
    emoji: "📝",
    name: "Assessments",
    subItems: [
      { name: "Create Test", path: "/teacher/create-test", emoji: "✏️" },
      { name: "Test Results", path: "/teacher/results", emoji: "📊" }
    ]
  }
];

const othersItems: NavItem[] = [
  {
    emoji: "👤",
    name: "My Profile",
    path: "/profile",
  },
  {
    emoji: "🎁",
    name: "Offers",
    path: "/offers"
  },
  {
    emoji: "🤝",
    name: "Refer & Earn",
    path: "/referrals"
  },
  {
    emoji: "💸",
    name: "My orders",
    path: "/transactions"
  },
  {
    emoji: "🎫",
    name: "Support",
    path: "/support"
  }
];

const teacherOthersItems: NavItem[] = [
  {
    emoji: "👤",
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
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => {
        const isSubmenuOpen = openSubmenu?.type === menuType && openSubmenu?.index === index;
        const hasActiveSubItem = nav.subItems?.some(subItem => isActive(subItem.path));

        return (
          <li key={nav.name} className="relative">
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ease-in-out
                  ${isSubmenuOpen || hasActiveSubItem
                    ? "bg-yellow-50 dark:bg-yellow-900/10 text-black dark:text-yellow-300 shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                style={{
                  ...(isSubmenuOpen || hasActiveSubItem
                    ? { borderLeft: `3px solid #daff02` }
                    : {})
                }}
              >
                <span className="text-xl flex-shrink-0">
                  {nav.emoji}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <>
                    <span className="font-medium flex-1 text-left"> {nav.name} </span>
                    <ChevronDown
                      className={`w-4 h-4 flex-shrink-0 transition-transform ${isSubmenuOpen ? "rotate-180 text-yellow-600" : "text-gray-400"}`}
                    />
                  </>
                )}
              </button>
            ) : nav.path ? (
              <Link
                to={nav.path}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300
                  ${isActive(nav.path)
                    ? "bg-yellow-50 dark:bg-yellow-900/10 text-black dark:text-yellow-300 shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                style={{
                  ...(isActive(nav.path)
                    ? { borderLeft: `3px solid #daff02` }
                    : {})
                }}
              >
                <span className="text-xl flex-shrink-0">
                  {nav.emoji}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="font-medium"> {nav.name} </span>
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
                <ul className="py-2 space-y-1 ml-12">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        to={subItem.path}
                        className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                          ${isActive(subItem.path)
                            ? "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 font-medium"
                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {subItem.emoji && (
                            <span className="text-lg">{subItem.emoji}</span>
                          )}
                          <span>{subItem.name}</span>
                        </div>
                        <div className="flex gap-1">
                          {subItem.new && (
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                isActive(subItem.path)
                                  ? "bg-yellow-500 text-black"
                                  : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              }`}
                            >
                              New
                            </span>
                          )}
                          {subItem.pro && (
                            <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full font-medium dark:bg-purple-900/30 dark:text-purple-400">
                              Pro
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
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
      if (user?.role === "counselor" || user?.role === "manager") return navItemsCoun;
      if (user?.role === "teacher") return navItemsTeacher;
      return navItemsUser;
    } else {
      if (user?.role === "teacher" || user?.role === "counselor") return teacherOthersItems;
      return othersItems;
    }
  };

  const primaryColor = "#daff02";   // Yellow
  const secondaryColor = "#fe572a"; // Orange

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-3 left-0 bg-white dark:bg-gray-900 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 dark:border-gray-800 shadow-lg
        ${isExpanded || isMobileOpen
          ? "w-[260px]"
          : isHovered
            ? "w-[260px]"
            : "w-[80px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className={`py-5 flex transition-all ${!isExpanded && !isHovered ? "justify-center" : "justify-start"}`}>
        <Link to="/" className="flex items-center transform hover:scale-105 transition-transform duration-200">
          {isExpanded || isHovered || isMobileOpen ? (
            <img
              src="/images/logo.png"
              alt="Logo"
              width={160}
              height={30}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-black font-bold shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              G
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
        <nav className="mb-6 flex-1">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className={`mb-3 text-xs uppercase text-gray-500 dark:text-gray-400 font-medium tracking-wider ${!isExpanded && !isHovered ? "text-center" : "pl-3"}`}>
                {isExpanded || isHovered || isMobileOpen ? "Menu" : "🔍"}
              </h2>
              {renderMenuItems(getMenuItems("main"), "main")}
            </div>

            <div>
              <h2 className={`mb-3 text-xs uppercase text-gray-500 dark:text-gray-400 font-medium tracking-wider ${!isExpanded && !isHovered ? "text-center" : "pl-3"}`}>
                {isExpanded || isHovered || isMobileOpen
                  ? user?.role === "teacher" ? "Account" : "Others"
                  : "⚙️"
                }
              </h2>
              {renderMenuItems(getMenuItems("others"), "others")}
            </div>
          </div>
        </nav>

        {/* User Profile */}
        {(isExpanded || isHovered || isMobileOpen) && user && (
          <div className="p-0.5 rounded-xl bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 mt-auto border border-yellow-200 dark:border-yellow-800/30 shadow-sm">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-gray-800">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-black font-bold shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user.name || "User"}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                  {user.role}
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