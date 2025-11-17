import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/UserContext";
import { Sparkles } from "lucide-react";
import DynamicIcon from "../components/DynamicIcon";

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
    emoji: "📝",
    name: "Mock Tests",
    path: "/mock",
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
  // {
  //   emoji: "🚀",
  //   name: "lead Management",
  //   path: "/leads",
  // }
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
  // {
  //   emoji: "📈",
  //   name: "Earnings Report",
  //   path: "/earnings-report"
  // },
  // {
  //   emoji: "🎫",
  //   name: "Support",
  //   subItems: [
  //     { name: "Create Ticket", path: "/teacher/query", emoji: "🆕" },
  //     { name: "View Tickets", path: "/teacher/queries", emoji: "👀" }
  //   ],
  // },
  // {
  //   emoji: "⚙️",
  //   name: "Settings",
  //   path: "/settings"
  // }
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
        ? (user.role === "admin" ? navItems : user.role === "teacher" ? navItemsTeacher : navItemsUser)
        : (user.role === "teacher" || user.role == "counselor" ? teacherOthersItems : othersItems);

      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive, user.role]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
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
                className={`menu-item group w-full transition-all duration-300 ease-in-out rounded-xl
                  ${isSubmenuOpen || hasActiveSubItem
                    ? "menu-item-active bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 border-r-4 border-blue-500 shadow-sm"
                    : "menu-item-inactive hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }
                  ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}
                `}
              >
                <span
                  className={`menu-item-icon-size transition-all duration-300 flex-shrink-0 text-xl transform group-hover:scale-125
                    ${isSubmenuOpen || hasActiveSubItem
                      ? "text-blue-600 dark:text-blue-400 scale-110"
                      : "text-gray-600 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400"
                    }
                  `}
                >
                  {nav.emoji}
                </span>

                {(isExpanded || isHovered || isMobileOpen) && (
                  <>
                    <span className="menu-item-text font-medium text-gray-900 dark:text-gray-100">{nav.name}</span>
                    <span
                      className={`ml-auto w-4 h-4 transition-transform duration-200 flex-shrink-0
                        ${isSubmenuOpen ? "rotate-180 text-blue-500" : "text-gray-400"}
                      `}
                    >
                      ▼
                    </span>
                  </>
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group transition-all duration-300 ease-in-out rounded-xl
                    ${isActive(nav.path)
                      ? "menu-item-active bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 border-r-4 border-blue-500 shadow-sm"
                      : "menu-item-inactive hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }
                  `}
                >
                  <span
                    className={`menu-item-icon-size transition-all duration-300 flex-shrink-0 text-xl transform group-hover:scale-125
                      ${isActive(nav.path)
                        ? "text-blue-600 dark:text-blue-400 scale-110"
                        : "text-gray-600 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400"
                      }
                    `}
                  >
                    {nav.emoji}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text font-medium text-gray-900 dark:text-gray-100">{nav.name}</span>
                  )}
                </Link>
              )
            )}

            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-500 ease-in-out"
                style={{
                  height: isSubmenuOpen ? `${subMenuHeight[`${menuType}-${index}`] || 0}px` : "0px",
                  opacity: isSubmenuOpen ? 1 : 0,
                }}
              >
                <ul className="py-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        to={subItem.path}
                        className={`menu-dropdown-item group transition-all duration-200 ease-in-out rounded-md px-3 py-2 flex items-center transform hover:scale-[1.02]
                          ${isActive(subItem.path)
                            ? "menu-dropdown-item-active text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 scale-[1.02]"
                            : "menu-dropdown-item-inactive hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-300"
                          }
                        `}
                      >
                        <span className="flex items-center gap-3">
                          {subItem.emoji && (
                            <span className={`text-lg flex-shrink-0 ${isActive(subItem.path) ? "text-blue-500" : "text-gray-400"}`}>
                              {subItem.emoji}
                            </span>
                          )}
                          <span className="text-sm text-gray-900 dark:text-gray-100">{subItem.name}</span>
                        </span>
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`px-1.5 py-0.5 text-xs rounded-full
                                ${isActive(subItem.path)
                                  ? "bg-blue-500 text-white"
                                  : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                }
                              `}
                            >
                              New
                            </span>
                          )}
                          {subItem.pro && (
                            <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full dark:bg-purple-900/30 dark:text-purple-400">
                              Pro
                            </span>
                          )}
                        </span>
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
      if (user.role === "admin") return navItems;
      if (user.role === "counselor") return navItemsCoun;
      if (user.role === "teacher") return navItemsTeacher;
      return navItemsUser;
    } else {
      if (user.role === "teacher" || user.role == "counselor") return teacherOthersItems;
      return othersItems;
    }
  };

  return (
    <aside
      className={` bg-[hsl(0deg 0% 96.08%)] fixed mt-16 flex flex-col lg:mt-0 top-0 px-3 left-0 bg-white dark:bg-gray-900 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 dark:border-gray-800 shadow-lg
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
      <div
        className={`py-6 sm:block hidden flex transition-all duration-300 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link to={user.role === "teacher" ? "/" : "/"} className="flex items-center transform hover:scale-105 transition-transform duration-200">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="https://www.gatewayabroadeducations.com/images/logo.svg"
                alt="Logo"
                width={180}
                height={36}
              />
              <img
                className="hidden dark:block"
                src="https://www.gatewayabroadeducations.com/images/logo.svg"
                alt="Logo"
                width={180}
                height={36}
              />
            </>
          ) : (
            <img
              src="https://www.gatewayabroadeducations.com/img/favicon.png"
              alt="Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
          )}
        </Link>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto duration-300 sm:mt-0 mt-2 ease-linear no-scrollbar">
        <nav className="mb-6 flex-1">
          <div className="flex flex-col gap-6">
            <div>
              <h2
                className={`mb-3 text-xs uppercase flex leading-[20px] text-gray-500 dark:text-gray-400 font-medium tracking-wider ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start pl-3"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <span className="text-lg">🔍</span>
                )}
              </h2>
              {renderMenuItems(getMenuItems("main"), "main")}
            </div>

            <div>
              <h2
                className={`mb-3 text-xs uppercase flex leading-[20px] text-gray-500 dark:text-gray-400 font-medium tracking-wider ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start pl-3"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  user.role === "teacher" ? "Account" : "Others"
                ) : (
                  <span className="text-lg">⚙️</span>
                )}
              </h2>
              {renderMenuItems(getMenuItems("others"), "others")}
            </div>
          </div>
        </nav>

        {/* User profile at the bottom */}
        {(isExpanded || isHovered || isMobileOpen) && user && (
          <div className="p-0.5 rounded-xl sticky bottom-2 left-0 right-0 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 mt-auto border border-gray-200 dark:border-gray-700 shadow-md transform transition-transform duration-200">
            {/* <button
              onClick={() => navigate("/course/category")}
              className={`inline-flex items-center justify-center mb-2
                                px-4 py-2 w-full
                                bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20
                                text-blue-700 dark:text-blue-300
                                font-medium text-base capitalize
                                rounded-xl
                                border border-blue-200 dark:border-blue-800
                                transition-all duration-200
                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                                hover:shadow-md hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-800/30 dark:hover:to-purple-800/30`}
            >
              <DynamicIcon
                name={user.subCategory?.icon || user.category?.icon}
                className="h-4 w-4 mr-2"
              />
              {user.subCategory?.name || user.category?.name}
              <Sparkles className="h-3 w-3 ml-1 text-yellow-500" />
            </button> */}
            <div className="flex items-center gap-3 border border-blue-200 dark:border-blue-800 p-2 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium shadow-md transform transition-transform duration-200">
                {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name || 'User'}
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