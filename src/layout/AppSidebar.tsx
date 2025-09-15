import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

import {
  GridIcon,
  UserIcon,
  UserCircleIcon,
  BoxIcon,
  PlugInIcon,
  DollarLineIcon,
  TableIcon,
  PageIcon,
  PieChartIcon,
  ChevronDownIcon,
  HorizontaLDots,
  LockIcon,
  VideoIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/UserContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean; icon?: React.ReactNode }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <UserIcon />,
    name: "User Management",
    path: "/users",
  },
  {
    icon: <LockIcon />,
    name: "Course Categories",
    path: "/categories",
  },
  {
    icon: <TableIcon />,
    name: "Courses",
    subItems: [
      { name: "Course list", path: "/courses", icon: <TableIcon /> },
      { name: "Modules", path: "/modules", icon: <VideoIcon /> }
    ]
  },
  {
    icon: <BoxIcon />,
    name: "Live Classes",
    path: "/live-classes",
  },
  {
    icon: <TableIcon />,
    name: "Recorded Classes",
    path: "/recorded-classes",
  },
  {
    icon: <TableIcon />,
    name: "Study Materials",
    path: "/study-materials",
  },
  {
    icon: <TableIcon />,
    name: "Web Management",
    subItems: [
      { name: "Pages", path: "/pages", icon: <PageIcon /> },
      { name: "Entities", path: "/entities", icon: <BoxIcon /> }
    ]
  },
  {
    icon: <PlugInIcon />,
    name: "Transations Reports",
    path: "/chargeback",
  }
];

const navItemsUser: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
  },
  {
    name: "Refer & Earn",
    path: "/refer-and-earn",
    icon: <PieChartIcon />
  },
  {
    name: "Mock Tests",
    path: "/mock",
    icon: <PieChartIcon />
  },
  {
    name: "Practice Tests",
    path: "/tests",
    icon: <PieChartIcon />
  },
  {
    name: "My Courses",
    path: "/my-courses",
    icon: <TableIcon />
  },
  {
    icon: <LockIcon />,
    name: "Study material",
    path: "/study-material"
  },
];

const navItemsTeacher: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/teacher",
  },
  {
    icon: <LockIcon />,
    name: "My Courses",
    subItems: [
      { name: "Create Course", path: "/teacher/create-course", icon: <LockIcon /> },
      { name: "My Courses", path: "/teacher/courses", icon: <TableIcon /> },
      { name: "Course Analytics", path: "/teacher/analytics", icon: <PieChartIcon /> }
    ]
  },
  {
    icon: <VideoIcon />,
    name: "Content Management",
    subItems: [
      { name: "Upload Content", path: "/teacher/upload", icon: <VideoIcon /> },
      { name: "Manage Content", path: "/teacher/content", icon: <BoxIcon /> }
    ]
  },
  {
    icon: <LockIcon />,
    name: "Assessments",
    subItems: [
      { name: "Create Test", path: "/teacher/create-test", icon: <LockIcon /> },
      { name: "Test Results", path: "/teacher/results", icon: <LockIcon /> }
    ]
  },
  {
    icon: <LockIcon />,
    name: "Students",
    path: "/teacher/students",
  },
  {
    icon: <DollarLineIcon />,
    name: "Earnings",
    path: "/teacher/earnings",
  }
];

const othersItems: NavItem[] = [
  {
    icon: <UserCircleIcon />,
    name: "User Profile",
    path: "/profile",
  },
  {
    icon: <LockIcon />,
    name: "My Offers",
    path: "/offers"
  },
  {
    icon: <DollarLineIcon />,
    name: "Transactions",
    path: "/transactions"
  },
  {
    name: "Support Ticket",
    icon: <PageIcon />,
    subItems: [
      { name: "Create Ticket", path: "/query", icon: <PageIcon /> },
      { name: "View Tickets", path: "/queries", icon: <TableIcon /> }
    ],
  },
  {
    name: "Contact",
    icon: <LockIcon />,
    path: "/contact"
  }
];

const teacherOthersItems: NavItem[] = [
  {
    icon: <UserCircleIcon />,
    name: "Profile",
    path: "/teacher/profile",
  },
  {
    icon: <DollarLineIcon />,
    name: "Earnings Report",
    path: "/teacher/earnings-report"
  },
  {
    name: "Support",
    icon: <PageIcon />,
    subItems: [
      { name: "Create Ticket", path: "/teacher/query", icon: <PageIcon /> },
      { name: "View Tickets", path: "/teacher/queries", icon: <TableIcon /> }
    ],
  },
  {
    name: "Settings",
    icon: <LockIcon />,
    path: "/teacher/settings"
  }
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { user } = useAuth() as any;

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
        : (user.role === "teacher" ? teacherOthersItems : othersItems);

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
    <ul className="flex flex-col gap-2">
      {items.map((nav, index) => {
        const isSubmenuOpen = openSubmenu?.type === menuType && openSubmenu?.index === index;
        const hasActiveSubItem = nav.subItems?.some(subItem => isActive(subItem.path));

        return (
          <li key={nav.name} className="relative">
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group w-full transition-all duration-300 ease-in-out
                  ${isSubmenuOpen || hasActiveSubItem
                    ? "menu-item-active bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                    : "menu-item-inactive hover:bg-gray-100 dark:hover:bg-gray-800"
                  }
                  ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}
                `}
              >
                <span
                  className={`menu-item-icon-size transition-colors duration-200
                    ${isSubmenuOpen || hasActiveSubItem
                      ? "text-brand-500"
                      : "text-gray-500 group-hover:text-brand-500"
                    }
                  `}
                >
                  {nav.icon}
                </span>

                {(isExpanded || isHovered || isMobileOpen) && (
                  <>
                    <span className="menu-item-text">{nav.name}</span>
                    <ChevronDownIcon
                      className={`ml-auto w-4 h-4 transition-transform duration-200
                        ${isSubmenuOpen ? "rotate-180 text-brand-500" : "text-gray-400"}
                      `}
                    />
                  </>
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group transition-all duration-300 ease-in-out
                    ${isActive(nav.path)
                      ? "menu-item-active bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                      : "menu-item-inactive hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  <span
                    className={`menu-item-icon-size transition-colors duration-200
                      ${isActive(nav.path)
                        ? "text-brand-500"
                        : "text-gray-500 group-hover:text-brand-500"
                      }
                    `}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
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
                        className={`menu-dropdown-item group transition-all duration-200 ease-in-out
                          ${isActive(subItem.path)
                            ? "menu-dropdown-item-active text-brand-600 bg-brand-50 dark:bg-brand-900/20"
                            : "menu-dropdown-item-inactive hover:bg-gray-100 dark:hover:bg-gray-800"
                          }
                        `}
                      >
                        <span className="flex items-center gap-3">
                          {subItem.icon && (
                            <span className={`w-4 h-4 ${isActive(subItem.path) ? "text-brand-500" : "text-gray-400"}`}>
                              {subItem.icon}
                            </span>
                          )}
                          {subItem.name}
                        </span>
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full
                                ${isActive(subItem.path)
                                  ? "bg-brand-500 text-white"
                                  : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                }
                              `}
                            >
                              New
                            </span>
                          )}
                          {subItem.pro && (
                            <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full dark:bg-purple-900/30 dark:text-purple-400">
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
      if (user.role === "teacher") return navItemsTeacher;
      return navItemsUser;
    } else {
      if (user.role === "teacher") return teacherOthersItems;
      return othersItems;
    }
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-4 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 dark:border-gray-800
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
        className={`py-6 flex transition-all duration-300 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link to={user.role === "teacher" ? "/teacher" : "/"}>
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

      <div className="flex flex-col flex-1 overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6 flex-1">
          <div className="flex flex-col gap-6">
            <div>
              <h2
                className={`mb-3 text-xs uppercase flex leading-[20px] text-gray-400 font-medium tracking-wider ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start pl-3"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-5" />
                )}
              </h2>
              {renderMenuItems(getMenuItems("main"), "main")}
            </div>

            <div>
              <h2
                className={`mb-3 text-xs uppercase flex leading-[20px] text-gray-400 font-medium tracking-wider ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start pl-3"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  user.role === "teacher" ? "Account" : "Others"
                ) : (
                  <HorizontaLDots className="size-5" />
                )}
              </h2>
              {renderMenuItems(getMenuItems("others"), "others")}
            </div>
          </div>
        </nav>

        {/* User profile at the bottom */}
        {(isExpanded || isHovered || isMobileOpen) && user && (
          <div className="px-3 py-2 rounded-3xl sticky bottom-1 border-l-8 border-1 shadow-lg left-0 right-0 bg-white dark:bg-gray-800 mt-auto border-gray-400 dark:border-gray-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center text-white font-medium">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
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