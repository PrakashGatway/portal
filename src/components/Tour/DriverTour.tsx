"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "./driver.css";
import "driver.js/dist/driver.css";

interface DriverTourProps {
  start: boolean;
  onFinish?: () => void;
  profile: any;
}

export default function DriverTour({
  start,
  profile,
  onFinish,
}: DriverTourProps) {
  useEffect(() => {
    if (!start) return;

    const isMobile = window.innerWidth <= 767;

    const bottomNavElements = [
      "#dashboard",
      "#course",
      "#test",
      "#mock-test",
      "#practice-test",
      "#quiz",
      "#my-courses",
      "#support",
      "#settings",
    ];

    const getPopoverClass = (element: string) => {
      if (!isMobile) {
        return "";
      }

      if (bottomNavElements.includes(element)) {
        return "mobile-tour-popover mobile-bottom-nav-tour";
      }

      return "mobile-tour-popover";
    };

    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayOpacity: 0.75,
      smoothScroll: true,

      onHighlighted: () => {
        /*
         * Give the highlighted element time to settle
         * before forcing the mobile popup position.
         */
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.dispatchEvent(new Event("resize"));

            if (window.innerWidth <= 767) {
              const popover = document.querySelector(
                ".driver-popover.mobile-bottom-nav-tour"
              ) as HTMLElement | null;

              if (popover) {
                popover.style.setProperty(
                  "position",
                  "fixed",
                  "important"
                );

                popover.style.setProperty(
                  "top",
                  "auto",
                  "important"
                );

                popover.style.setProperty(
                  "bottom",
                  "72px",
                  "important"
                );

                popover.style.setProperty(
                  "left",
                  "50%",
                  "important"
                );

                popover.style.setProperty(
                  "right",
                  "auto",
                  "important"
                );

                popover.style.setProperty(
                  "transform",
                  "translateX(-50%)",
                  "important"
                );

                popover.style.setProperty(
                  "width",
                  "calc(100vw - 32px)",
                  "important"
                );

                popover.style.setProperty(
                  "max-width",
                  "340px",
                  "important"
                );

                popover.style.setProperty(
                  "z-index",
                  "999999",
                  "important"
                );
              }
            }
          });
        });
      },

      steps: [
        
        {
          element: "#overviewer",

          popover: {
            description: `
              <div>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">
                  👋 Welcome to Your Assistant
                </h2>

                <p class="text-gray-600 text-base leading-relaxed">
                  I’m here to help you navigate the platform, understand
                  the available features, and guide you through your study
                  abroad preparation journey.
                </p>

                <p class="text-gray-700 text-sm font-medium mt-4">
                  You can explore:
                </p>

                <div class="mt-2 flex flex-wrap gap-2">
                  <span class="px-3 py-1.5 bg-orange-50 text-gray-600 text-xs rounded-full">
                    Universities
                  </span>

                  <span class="px-3 py-1.5 bg-orange-50 text-gray-600 text-xs rounded-full">
                    Courses
                  </span>

                  <span class="px-3 py-1.5 bg-orange-50 text-gray-600 text-xs rounded-full">
                    Mock Tests
                  </span>

                  <span class="px-3 py-1.5 bg-orange-50 text-gray-600 text-xs rounded-full">
                    Scholarships
                  </span>
                </div>

                <div class="mt-4 text-sm text-orange-600 font-medium">
                  ✓ Let's take a quick tour!
                </div>
              </div>
            `,

            side: "bottom",
            align: "center",

            popoverClass: getPopoverClass("#overviewer"),
          },
        },

        {
          element: "#submenu",

          popover: {
            description: `
              <div>
                <h2 class="text-xl font-bold text-gray-900 mb-3">
                  👤 Profile
                </h2>

                <p class="text-gray-600 text-sm leading-6">
                  View and manage your personal information, academic details,
                  preferences, and other profile information used throughout
                  your study abroad journey.
                </p>

                <div class="mt-3 text-sm text-green-600 font-medium">
                  ✓ Keep your profile information up to date.
                </div>
              </div>
            `,

            side: "bottom",
            align: "center",

            popoverClass: getPopoverClass("#submenu"),
          },
        },

        {
          element: "#category",

          popover: {
            description: `
              <div>
                <h2 class="text-xl font-bold text-gray-900 mb-3">
                  📚 Course Categories
                </h2>

                <p class="text-gray-600 text-sm leading-6">
                  Browse courses based on different categories and find
                  programs that match your academic interests and career goals.
                </p>

                <div class="mt-3 text-sm text-green-600 font-medium">
                  ✓ Explore courses that fit your goals.
                </div>
              </div>
            `,

            side: "bottom",
            align: "center",

            popoverClass: getPopoverClass("#category"),
          },
        },

        {
          element: "#notification",

          popover: {
            description: `
              <div>
                <h2 class="text-xl font-bold text-gray-900 mb-3">
                  🔔 Notifications
                </h2>

                <p class="text-gray-600 text-sm leading-6">
                  Stay informed about important updates, announcements,
                  deadlines, application changes, test schedules, and
                  other activities related to your account.
                </p>

                <div class="mt-3 text-sm text-orange-600 font-medium">
                  ✓ Check your notifications regularly.
                </div>
              </div>
            `,

            side: "bottom",
            align: "start",

            popoverClass: getPopoverClass("#notification"),
          },
        },

        {
          element: "#dashboard",

          popover: {
            description: `
              <div>
                <h2 class="text-xl font-bold text-gray-900 mb-3">
                  📊 Dashboard
                </h2>

                <p class="text-gray-600 text-sm leading-6">
                  Your dashboard gives you a quick overview of your learning
                  activities, courses, tests, progress, and important updates.
                  Use it as your central place to manage your preparation.
                </p>

                <div class="mt-3 text-sm text-orange-600 font-medium">
                  ✓ Everything you need is available from your dashboard.
                </div>
              </div>
            `,

            side: isMobile ? "top" : "right",
            align: "center",

            popoverClass: getPopoverClass("#dashboard"),
          },
        },

        {
          element: "#course",

          popover: {
            description: `
              <div>
                <h2 class="text-xl font-bold text-gray-900 mb-3">
                  📚 Courses
                </h2>

                <p class="text-gray-600 text-sm leading-6">
                  Explore available preparation courses, view course details,
                  and choose the learning resources that match your exam and
                  study goals.
                </p>

                <div class="mt-3 text-sm text-green-600 font-medium">
                  ✓ Find the right course for your preparation.
                </div>
              </div>
            `,

            side: isMobile ? "top" : "right",
            align: "center",

            popoverClass: getPopoverClass("#course"),
          },
        },

        {
          element: "#test",

          popover: {
            description: `
              <div>
                <h2 class="text-xl font-bold text-gray-900 mb-3">
                  🏫 Explore Test
                </h2>

                <p class="text-gray-600 text-sm leading-6">
                  Find preparation programs designed to help you improve your
                  skills and get ready for your target examination.
                </p>

                <div class="mt-3 text-sm text-green-600 font-medium">
                  ✓ Choose a test and start learning.
                </div>
              </div>
            `,

            side: isMobile ? "top" : "right",
            align: "center",

            popoverClass: getPopoverClass("#test"),
          },
        },

        {
          element: "#mock-test",

          popover: {
            description: `
              <div>
                <h2 class="text-xl font-bold text-gray-900 mb-3">
                  📝 Mock Tests
                </h2>

                <p class="text-gray-600 text-sm leading-6">
                  Practice with realistic mock tests to understand your
                  current performance, identify weak areas, and become
                  familiar with the actual exam format.
                </p>

                <div class="mt-3 text-sm text-orange-600 font-medium">
                  ✓ Test yourself and track your improvement.
                </div>
              </div>
            `,

            side: isMobile ? "top" : "right",
            align: "center",

            popoverClass: getPopoverClass("#mock-test"),
          },
        },

        {
          element: "#practice-test",

          popover: {
            description: `
              <div>
                <h2 class="text-xl font-bold text-gray-900 mb-3">
                  🎯 Practice Tests
                </h2>

                <p class="text-gray-600 text-sm leading-6">
                  Practice specific topics and question types to strengthen
                  your concepts and improve your accuracy before taking a
                  full mock test.
                </p>

                <div class="mt-3 text-sm text-green-600 font-medium">
                  ✓ Practice regularly to improve your score.
                </div>
              </div>
            `,

            side: isMobile ? "top" : "right",
            align: "center",

            popoverClass: getPopoverClass("#practice-test"),
          },
        },

        /*
         * =====================================================
         * 10. QUIZ
         * =====================================================
         */
        {
          element: "#quiz",

          popover: {
            description: `
              <div>
                <h2 class="text-xl font-bold text-gray-900 mb-3">
                  🧠 Quizzes
                </h2>

                <p class="text-gray-600 text-sm leading-6">
                  Take quick quizzes to test your understanding of different
                  topics and reinforce what you have learned.
                </p>

                <div class="mt-3 text-sm text-orange-600 font-medium">
                  ✓ Challenge yourself with quick quizzes.
                </div>
              </div>
            `,

            side: isMobile ? "top" : "right",
            align: "center",

            popoverClass: getPopoverClass("#quiz"),
          },
        },

        {
          element: "#my-courses",

          popover: {
            description: `
              <div>
                <h2 class="text-xl font-bold text-gray-900 mb-3">
                  📖 My Courses
                </h2>

                <p class="text-gray-600 text-sm leading-6">
                  Access all the courses you have enrolled in from one place.
                  Continue your lessons, monitor your progress, and keep track
                  of your learning journey.
                </p>

                <div class="mt-3 text-sm text-green-600 font-medium">
                  ✓ Continue your learning from where you left off.
                </div>
              </div>
            `,

            side: isMobile ? "top" : "right",
            align: "center",

            popoverClass: getPopoverClass("#my-courses"),
          },
        },

        /*
         * =====================================================
         * 12. SUPPORT
         * =====================================================
         */
        {
          element: "#support",

          popover: {
            description: `
              <div>
                <h2 class="text-xl font-bold text-gray-900 mb-3">
                  🆘 Support
                </h2>

                <p class="text-gray-600 text-sm leading-6">
                  Need help? Use the support section to find helpful resources,
                  FAQs, or contact the support team when you need assistance.
                </p>

                <div class="mt-3 text-sm text-orange-600 font-medium">
                  ✓ We're here whenever you need help.
                </div>
              </div>
            `,

            side: isMobile ? "top" : "right",
            align: "center",

            popoverClass: getPopoverClass("#support"),
          },
        },

        /*
         * =====================================================
         * 13. SETTINGS
         * =====================================================
         */
        {
          element: "#settings",

          popover: {
            description: `
              <div>
                <h2 class="text-xl font-bold text-gray-900 mb-3">
                  ⚙️ Settings
                </h2>

                <p class="text-gray-600 text-sm leading-6">
                  Manage your account preferences and customize settings such
                  as notifications, profile preferences, and other available
                  options.
                </p>

                <div class="mt-3 text-sm text-green-600 font-medium">
                  ✓ Customize your experience.
                </div>
              </div>
            `,

            side: isMobile ? "top" : "right",
            align: "center",

            popoverClass: getPopoverClass("#settings"),
          },
        },
      ],

      onDestroyed: () => {
        if (profile?.email) {
          localStorage.setItem(
            `dashboardTour_${profile.email}`,
            "true"
          );
        }

        onFinish?.();
      },
    });

    driverObj.drive();

    /*
     * Cleanup when component unmounts
     * or tour is stopped.
     */
    return () => {
      try {
        driverObj.destroy();
      } catch {
        // Driver already destroyed
      }
    };
  }, [start, profile, onFinish]);

  return null;
}






// "use client";

// import { useEffect } from "react";
// import { driver } from "driver.js";
// import "./driver.css";
// // import "driver.js/dist/driver.css";



// interface DriverTourProps {
//   start: boolean;
//   onFinish?: () => void;
//   profile: any;
// }

// export default function DriverTour({
//   start,
//   profile,
//   onFinish,
// }: DriverTourProps) {
//   useEffect(() => {
//     if (!start) return;

//     const driverObj = driver({
//       showProgress: true,
//       animate: true,
//       onHighlighted: () => {
//         // Give mobile layout time to settle
//         requestAnimationFrame(() => {
//           requestAnimationFrame(() => {
//             window.dispatchEvent(new Event("resize"));
//           });
//         });
//       },
//       allowClose: true,
//       overlayOpacity: 0.75,
//       smoothScroll: true,
//       steps : [
//   {
//     element: "#overviewer",
//     popover: {
//       description: `
//         <div>
//           <h2 class="text-2xl font-bold text-gray-900 mb-2">
//             👋 Welcome to Your Assistant
//           </h2>
//           <p class="text-gray-600 text-base leading-relaxed">
//             I’m here to help you navigate the platform, understand the available
//             features, and guide you through your study abroad preparation journey.
//           </p>
//           <p class="text-gray-700 text-sm font-medium mt-4">
//             You can explore:
//           </p>
//           <div class="mt-2 flex flex-wrap gap-2">
//             <span class="px-3 py-1.5 bg-orange-50 text-gray-600 text-xs rounded-full">
//               Universities
//             </span>
//             <span class="px-3 py-1.5 bg-orange-50 text-gray-600 text-xs rounded-full">
//               Courses
//             </span>
//             <span class="px-3 py-1.5 bg-orange-50 text-gray-600 text-xs rounded-full">
//               Mock Tests
//             </span>
//             <span class="px-3 py-1.5 bg-orange-50 text-gray-600 text-xs rounded-full">
//               Scholarships
//             </span>
//           </div>
//           <div class="mt-4 text-sm text-orange-600 font-medium">
//             ✓ Let's take a quick tour!
//           </div>
//         </div>
//       `,
//       side: "bottom",
//       align: "center",
//     },
//   },

//   {
//     element: "#submenu",
//     popover: {
//       description: `
//         <div>
//           <h2 class="text-xl font-bold text-gray-900 mb-3">
//            👤 Profile
//           </h2>
//           <p class="text-gray-600 text-sm leading-6 text-ellipsis">
//             View and manage your personal information, academic details,
//             preferences, and other profile information used throughout your
//             study abroad journey.
//           </p>
//           <div class="mt-3 text-sm text-green-600 font-medium text-ellipsis">
//             ✓ Keep your profile information up to date.
//           </div>
//         </div>
//       `,
//       side: "bottom",
//       align: "center",
//     },
//   },
  
//   {
//     element: "#category",
//     popover: {
//       description: `
//         <div>
//           <h2 class="text-xl font-bold text-gray-900 mb-3">
//             📚 Course Categories
//           </h2>
//           <p class="text-gray-600 text-sm leading-6">
//             Browse courses based on different categories and find programs
//             that match your academic interests and career goals.
//           </p>
//           <div class="mt-3 text-sm text-green-600 font-medium">
//             ✓ Explore courses that fit your goals.
//           </div>
//         </div>
//       `,
//       side: "bottom",
//       align: "center",
//     },
//   },


//   {
//     element: "#notification",
//     popover: {
//       description: `
//         <div>
//           <h2 class="text-xl font-bold text-gray-900 mb-3">
//             🔔 Notifications
//           </h2>
//           <p class="text-gray-600 text-sm leading-6 ">
//             Stay informed about important updates, announcements, deadlines,
//             application changes, test schedules, and other activities related
//             to your account.
//           </p>
//           <div class="mt-3 text-sm text-orange-600 font-medium">
//             ✓ Check your notifications regularly.
//           </div>
//         </div>
//       `,
//       side: "bottom",
//       align: "start",
//     },
//   },
// {
//     element: "#dashboard",
//     popover: {
//       description: `
//         <div>
//           <h2 class="text-xl font-bold text-gray-900 mb-3">
//             📊 Dashboard
//           </h2>
//           <p class="text-gray-600 text-sm leading-6">
//             Your dashboard gives you a quick overview of your learning
//             activities, courses, tests, progress, and important updates.
//             Use it as your central place to manage your preparation.
//           </p>
//           <div class="mt-3 text-sm text-orange-600 font-medium">
//             ✓ Everything you need is available from your dashboard.
//           </div>
//         </div>
//       `,
//       side: "right",
//       align: "center",
//     },
//   },

//   {
//     element: "#course",
//     popover: {
//       description: `
//         <div>
//           <h2 class="text-xl font-bold text-gray-900 mb-3">
//             📚 Courses
//           </h2>
//           <p class="text-gray-600 text-sm leading-6">
//             Explore available preparation courses, view course details,
//             and choose the learning resources that match your exam and
//             study goals.
//           </p>
//           <div class="mt-3 text-sm text-green-600 font-medium">
//             ✓ Find the right course for your preparation.
//           </div>
//         </div>
//       `,
//       side: "right",
//       align: "center",
//     },
//   },

  

//   {
//     element: "#test",
//     popover: {
//       description: `
//         <div>
//           <h2 class="text-xl font-bold text-gray-900 mb-3">
//             🏫 Explore test
//           </h2>
//           <p class="text-gray-600 text-sm leading-6">
//             Find preparation programs designed to help you improve your
//             skills and get ready for your target examination.
//           </p>
//           <div class="mt-3 text-sm text-green-600 font-medium">
//             ✓ Choose a test and start learning.
//           </div>
//         </div>
//       `,
//       side: "right",
//       align: "center",
//     },
//   },

//   {
//     element: "#mock-test",
//     popover: {
//       description: `
//         <div>
//           <h2 class="text-xl font-bold text-gray-900 mb-3">
//             📝 Mock Tests
//           </h2>
//           <p class="text-gray-600 text-sm leading-6">
//             Practice with realistic mock tests to understand your current
//             performance, identify weak areas, and become familiar with the
//             actual exam format.
//           </p>
//           <div class="mt-3 text-sm text-orange-600 font-medium">
//             ✓ Test yourself and track your improvement.
//           </div>
//         </div>
//       `,
//       side: "right",
//       align: "center",
//     },
//   },

//   {
//     element: "#practice-test",
//     popover: {
//       description: `
//         <div>
//           <h2 class="text-xl font-bold text-gray-900 mb-3">
//             🎯 Practice Tests
//           </h2>
//           <p class="text-gray-600 text-sm leading-6">
//             Practice specific topics and question types to strengthen your
//             concepts and improve your accuracy before taking a full mock test.
//           </p>
//           <div class="mt-3 text-sm text-green-600 font-medium">
//             ✓ Practice regularly to improve your score.
//           </div>
//         </div>
//       `,
//       side: "right",
//       align: "center",
//     },
//   },

//   {
//     element: "#quiz",
//     popover: {
//       description: `
//         <div>
//           <h2 class="text-xl font-bold text-gray-900 mb-3">
//             🧠 Quizzes
//           </h2>
//           <p class="text-gray-600 text-sm leading-6">
//             Take quick quizzes to test your understanding of different
//             topics and reinforce what you have learned.
//           </p>
//           <div class="mt-3 text-sm text-orange-600 font-medium">
//             ✓ Challenge yourself with quick quizzes.
//           </div>
//         </div>
//       `,
//       side: "right",
//       align: "center",
//     },
//   },

//   {
//     element: "#my-courses",
//     popover: {
//       description: `
//         <div>
//           <h2 class="text-xl font-bold text-gray-900 mb-3">
//             📖 My Courses
//           </h2>
//           <p class="text-gray-600 text-sm leading-6">
//             Access all the courses you have enrolled in from one place.
//             Continue your lessons, monitor your progress, and keep track
//             of your learning journey.
//           </p>
//           <div class="mt-3 text-sm text-green-600 font-medium">
//             ✓ Continue your learning from where you left off.
//           </div>
//         </div>
//       `,
//       side: "right",
//       align: "center",
//     },
//   },

//   {
//     element: "#support",
//     popover: {
//       description: `
//         <div>
//           <h2 class="text-xl font-bold text-gray-900 mb-3">
//             🆘 Support
//           </h2>
//           <p class="text-gray-600 text-sm leading-6">
//             Need help? Use the support section to find helpful resources,
//             FAQs, or contact the support team when you need assistance.
//           </p>
//           <div class="mt-3 text-sm text-orange-600 font-medium">
//             ✓ We're here whenever you need help.
//           </div>
//         </div>
//       `,
//       side: "right",
//       align: "center",
//     },
//   },

//   {
//     element: "#settings",
//     popover: {
//       description: `
//         <div>
//           <h2 class="text-xl font-bold text-gray-900 mb-3">
//             ⚙️ Settings
//           </h2>
//           <p class="text-gray-600 text-sm leading-6">
//             Manage your account preferences and customize settings such as
//             notifications, profile preferences, and other available options.
//           </p>
//           <div class="mt-3 text-sm text-green-600 font-medium">
//             ✓ Customize your experience.
//           </div>
//         </div>
//       `,
//       side: "right",
//       align: "center",
//     },
//   },
// ],
//       onDestroyed: () => {
//         localStorage.setItem(`dashboardTour_${profile.email}`, "true");
//         onFinish?.();
//       },
//     });

//     driverObj.drive();
//   }, [start]);

//   return null;
// }
