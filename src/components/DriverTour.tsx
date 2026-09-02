

"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
// import "./driver.css";

import "driver.js/dist/driver.css";

interface DriverTourProps {
  start: boolean;
  onFinish?: () => void;
  step : any;
  profile: any;
}

export default function DriverTour({
  start,
  profile,
  onFinish,
  step
}: DriverTourProps) {
  useEffect(() => {
    if (!start) return;

    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayOpacity: 0.75,
      smoothScroll: true,
      steps: step || [
        {
          element: "#overviewer",
          popover: {
            description: `
                            <div class="relative rounded-2xl bg-white p-4 max-w-md">
                                <!-- Left Image -->
                                <div class="absolute -left-[300px] top-0 flex justify-center items-center">
                                    <img
                                        src="/ai.gif"
                                        alt="Assistant"
                                        class="animate-fly w-80 h-80 object-contain drop-shadow-xl"
                                    />
                                </div>
                                
                                <!-- Content -->
                                <div>
                                    <h2 class="text-2xl font-bold text-gray-900 mb-1">
                                        Hi,I am your Assistant
                                    </h2>
                                    <div class="mb-4 mt-3">
                                        <p class="text-gray-700 text-base font-medium mb-1">
                                            Hi, I am
                                        </p>
                                        <p class="text-gray-600 text-base leading-relaxed">
                                            I am here to assist you in navigating the app, providing guidance on features, and answering any questions you may have to enhance your experience.
                                        </p>
                                    </div>
                                    
                                    <!-- Options Heading -->
                                    <p class="text-gray-700 text-base font-medium mb-3">
                                        Here are options for further processes you can explore:
                                    </p>
                                    <!-- Bottom Navigation Options - Secondary -->
                                    <div class="mt-2 flex flex-wrap gap-2 pt-3 border-gray-100">
                                        <span class="px-3 py-1.5 bg-orange-50 text-gray-600 text-xs font-medium rounded-full">
                                            About University
                                        </span>
                                        <span class="px-3 py-1.5 bg-orange-50 text-gray-600 text-xs font-medium rounded-full">
                                            Cost and Duration
                                        </span>
                                        <span class="px-3 py-1.5 bg-orange-50 text-gray-600 text-xs font-medium rounded-full">
                                            Features
                                        </span>
                                        <span class="px-3 py-1.5 bg-orange-50 text-gray-600 text-xs font-medium rounded-full">
                                            Scholarships
                                        </span>
                                    </div>
                                    
                                    <!-- Tour CTA -->
                                    <div class="mt-4 flex items-center gap-2 text-sm text-orange-600 font-medium">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                                        </svg>
                                        Let's take a quick tour!
                                    </div>
                                </div>
                            </div>
                        `,
            side: "bottom",
            align: "center",
          },
        },
        {
          element: "#profile",
          popover: {
            description: `
<div class="relative rounded-2xl bg-white">
<div class="absolute -left-[150px] top-0 flex justify-center items-center">
      <img
        src="/ai.gif"
        alt="Dashboard"
        class="w-32 h-32 object-contain drop-shadow-xl"
      />
    </div>
  <div class="flex items-center">

    <!-- Left Image -->
    

    <!-- Right Content -->
    <div class="">
      <h2 class="text-xl font-bold text-gray-900 mb-3">
        Welcome to Your Dashboard
      </h2>

      <p class="text-gray-600 text-sm leading-6">
        Manage your applications, track your progress, explore universities,
        and stay updated with every important step of your study abroad journey.
      </p>

      <div class="mt-3 flex items-center gap-2 text-sm text-green-600 font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        Let's take a quick tour!
      </div>

    </div>

  </div>
</div>
`,
            side: "bottom",
            align: "center",
          },
        },
        {
          element: "#notification",
          popover: {
            description: `
<div class="relative rounded-2xl bg-white">
<div class="absolute -left-[150px] top-0 flex justify-center items-center">
      <img
        src="/ai.gif"
        alt="Dashboard"
        class="w-32 h-32 object-contain drop-shadow-xl"
      />
    </div>
  <div class="">
   <h2 class="text-xl font-bold text-gray-900 mb-3">
        🔔 Notifications
      </h2>

      <p class="text-gray-600 text-sm leading-6">
        Stay updated with the latest alerts, deadlines, and important announcements related to your study abroad journey. Never miss a crucial update!
      </p>

    </div>

  </div>
</div>
`,

            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#dashboard",
          popover: {
            description: `
<div class="relative rounded-2xl bg-white">
<div class="absolute -right-[150px] top-0 flex justify-center items-center">
      <img
        src="/ai.gif"
        alt="Dashboard"
        class="w-32 h-32 object-contain drop-shadow-xl"
      />
    </div>
  <div class="">
   <h2 class="text-xl font-bold text-gray-900 mb-3">
        📊 Dashboard
      </h2>

      <p class="text-gray-600 text-sm leading-6">
     Your central hub for managing your study abroad journey. Access all features from here. Keep track of your applications, view your progress, and explore universities and programs.</p>

    </div>

  </div>
</div>
`,
            side: "right",
            align: "center",
          },
        },
        {
          element: "#universities",
          popover: {
            description: `
<div class="relative rounded-2xl bg-white">
<div class="absolute -right-[150px] top-0 flex justify-center items-center">
      <img
        src="/ai.gif"
        alt="Dashboard"
        class="w-32 h-32 object-contain drop-shadow-xl"
      />
    </div>
  <div class="">
   <h2 class="text-xl font-bold text-gray-900 mb-3">
        🏛️ Universities
      </h2>

      <p class="text-gray-600 text-sm leading-6">
        Explore a wide range of universities around the world. Find the perfect fit for your educational aspirations and make your study abroad dreams a reality.</p>
    </div>

  </div>
</div>
`,
            side: "right",
            align: "center",
          },
        },
        {
          element: "#countries",
          popover: {
            description: `
<div class="relative rounded-2xl bg-white">
<div class="absolute -right-[150px] top-0 flex justify-center items-center">
      <img
        src="/ai.gif"
        alt="Dashboard"
        class="w-32 h-32 object-contain drop-shadow-xl"
      />
    </div>
  <div class="">
   <h2 class="text-xl font-bold text-gray-900 mb-3">
    🌍 Countries
      </h2>

      <p class="text-gray-600 text-sm leading-6">
        Discover a diverse collection of countries where study abroad opportunities await you. Choose your dream destination and embark on a transformative educational journey.</p>
    </div>

  </div>
</div>
`,
            side: "right",
            align: "center",
          },
        },
        {
          element: "#find-programs",
          popover: {
            description: `
<div class="relative rounded-2xl bg-white">
<div class="absolute -right-[150px] top-0 flex justify-center items-center">
      <img
        src="/ai.gif"
        alt="Dashboard"
        class="w-32 h-32 object-contain drop-shadow-xl"
      />
    </div>
  <div class="">
   <h2 class="text-xl font-bold text-gray-900 mb-3">
    🔍 Find Programs
      </h2>

      <p class="text-gray-600 text-sm leading-6">
        Discover a diverse collection of countries where study abroad opportunities await you. Choose your dream destination and embark on a transformative educational journey. </p>
    </div>

  </div>
</div>
`,
            side: "right",
            align: "center",
          },
        },
        {
          element: "#application",
          popover: {
            description: `
<div class="relative rounded-2xl bg-white">
<div class="absolute -right-[150px] top-0 flex justify-center items-center">
      <img
        src="/ai.gif"
        alt="Dashboard"
        class="w-32 h-32 object-contain drop-shadow-xl"
      />
    </div>
  <div class="">
   <h2 class="text-xl font-bold text-gray-900 mb-3">
    📝 Applications
      </h2>

      <p class="text-gray-600 text-sm leading-6">
        Create and manage your study abroad applications effortlessly. Track your progress, submit documents, and stay updated on the status of your applications.</p>
    </div>

  </div>
</div>
`,
            side: "right",
            align: "center",
          },
        },
        {
          element: "#visa-process",
          popover: {
            description: `
                            <div class="relative rounded-2xl bg-white">
                                <div class="absolute -right-[150px] top-0 flex justify-center items-center">
                                    <img
                                        src="/ai.gif"
                                        alt="Visa Process"
                                        class="w-32 h-32 object-contain drop-shadow-xl"
                                    />
                                </div>
                                <div>
                                    <h2 class="text-xl font-bold text-gray-900 mb-3">
                                        🛂 Visa Process
                                    </h2>
                                    <p class="text-gray-600 text-sm leading-6">
                                        Create and manage your visa applications effortlessly. Track your progress, submit documents, and stay updated on the status of your visa applications.
                                    </p>
                                </div>
                            </div>
                        `,
            side: "right",
            align: "center",
          },
        },

        // Scholarships Step
        {
          element: "#scholarship",
          popover: {
            description: `
                            <div class="relative rounded-2xl bg-white">
                                <div class="absolute -right-[150px] top-0 flex justify-center items-center">
                                    <img
                                        src="/ai.gif"
                                        alt="Scholarships"
                                        class="w-32 h-32 object-contain drop-shadow-xl"
                                    />
                                </div>
                                <div>
                                    <h2 class="text-xl font-bold text-gray-900 mb-3">
                                        💰 Scholarships
                                    </h2>
                                    <p class="text-gray-600 text-sm leading-6">
                                        Find and apply for scholarships, grants, and financial aid opportunities. Get matched with funding options that fit your profile.
                                    </p>
                                </div>
                            </div>
                        `,
            side: "right",
            align: "center",
          },
        },

        // Accommodation Step
        {
          element: "#accommodation",
          popover: {
            description: `
                            <div class="relative rounded-2xl bg-white">
                                <div class="absolute -right-[150px] top-0 flex justify-center items-center">
                                    <img
                                        src="/ai.gif"
                                        alt="Accommodation"
                                        class="w-32 h-32 object-contain drop-shadow-xl"
                                    />
                                </div>
                                <div>
                                    <h2 class="text-xl font-bold text-gray-900 mb-3">
                                        🏠 Accommodation
                                    </h2>
                                    <p class="text-gray-600 text-sm leading-6">
                                        Explore housing options, from on-campus dorms to off-campus apartments. Find the perfect place to stay during your studies.
                                    </p>
                                </div>
                            </div>
                        `,
            side: "right",
            align: "center",
          },
        },

        // Payments Step
        {
          element: "#payments",
          popover: {
            description: `
                            <div class="relative rounded-2xl bg-white">
                                <div class="absolute -right-[150px] top-0 flex justify-center items-center">
                                    <img
                                        src="/ai.gif"
                                        alt="Payments"
                                        class="w-32 h-32 object-contain drop-shadow-xl"
                                    />
                                </div>
                                <div>
                                    <h2 class="text-xl font-bold text-gray-900 mb-3">
                                        💳 Payments
                                    </h2>
                                    <p class="text-gray-600 text-sm leading-6">
                                        Manage tuition fees, deposits, and other payments securely. Track payment history and get reminders for upcoming dues.
                                    </p>
                                </div>
                            </div>
                        `,
            side: "right",
            align: "center",
          },
        },

        // Offers Step
        {
          element: "#offers",
          popover: {
            description: `
                            <div class="relative rounded-2xl bg-white">
                                <div class="absolute -right-[150px] top-0 flex justify-center items-center">
                                    <img
                                        src="/ai.gif"
                                        alt="Offers"
                                        class="w-32 h-32 object-contain drop-shadow-xl"
                                    />
                                </div>
                                <div>
                                    <h2 class="text-xl font-bold text-gray-900 mb-3">
                                        📨 Offers
                                    </h2>
                                    <p class="text-gray-600 text-sm leading-6">
                                        View and respond to admission offers and acceptance letters. Compare offers and make informed decisions about your future.
                                    </p>
                                </div>
                            </div>
                        `,
            side: "right",
            align: "center",
          },
        },

        // Support Step
        {
          element: "#support",
          popover: {
            description: `
                            <div class="relative rounded-2xl bg-white">
                                <div class="absolute -right-[150px] top-0 flex justify-center items-center">
                                    <img
                                        src="/ai.gif"
                                        alt="Support"
                                        class="w-32 h-32 object-contain drop-shadow-xl"
                                    />
                                </div>
                                <div>
                                    <h2 class="text-xl font-bold text-gray-900 mb-3">
                                        🆘 Support
                                    </h2>
                                    <p class="text-gray-600 text-sm leading-6">
                                        Access help center, FAQ, and contact support for assistance. Get help whenever you need it during your journey.
                                    </p>
                                </div>
                            </div>
                        `,
            side: "right",
            align: "center",
          },
        },

        // Settings Step
        {
          element: "#settings",
          popover: {
            description: `
                            <div class="relative rounded-2xl bg-white">
                                <div class="absolute -right-[150px] top-0 flex justify-center items-center">
                                    <img
                                        src="/ai.gif"
                                        alt="Settings"
                                        class="w-32 h-32 object-contain drop-shadow-xl"
                                    />
                                </div>
                                <div>
                                    <h2 class="text-xl font-bold text-gray-900 mb-3">
                                        ⚙️ Settings
                                    </h2>
                                    <p class="text-gray-600 text-sm leading-6">
                                        Customize your preferences and manage your account settings. Control your notifications, privacy, and profile information.
                                    </p>
                                </div>
                            </div>
                        `,
            side: "right",
            align: "center",
          },
        },
      ],

      onDestroyed: () => {
        localStorage.setItem(`dashboardTour_${profile.email}`, "true");
        onFinish?.();
      },
    });

    driverObj.drive();
  }, [start]);

  return null;
}
