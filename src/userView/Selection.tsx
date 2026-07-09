import React from 'react';

const CompactWallOfFame = () => {
  // Mock data mimicking the varied sizes in the screenshot
const profiles = [
  { id: 1, img: "https://randomuser.me/api/portraits/women/44.jpg", type: "hero" },
  { id: 2, img: "https://randomuser.me/api/portraits/men/32.jpg", type: "tall" },
  { id: 3, img: "https://randomuser.me/api/portraits/women/68.jpg", type: "std" },
  { id: 4, img: "https://randomuser.me/api/portraits/men/45.jpg", type: "std" },
  { id: 5, img: "https://randomuser.me/api/portraits/women/63.jpg", type: "wide" },
  { id: 6, img: "https://randomuser.me/api/portraits/men/52.jpg", type: "std" },
  { id: 7, img: "https://randomuser.me/api/portraits/women/33.jpg", type: "std" },
  { id: 8, img: "https://randomuser.me/api/portraits/men/67.jpg", type: "std" },
  { id: 9, img: "https://randomuser.me/api/portraits/women/79.jpg", type: "std" },
  { id: 10, img: "https://randomuser.me/api/portraits/men/81.jpg", type: "std" },
  { id: 11, img: "https://randomuser.me/api/portraits/women/57.jpg", type: "std" },
];

  return (
   <>
    <div className="bg-[#FAFAFA] flex items-center justify-center p-4 md:py-4 font-sans">
      {/* Main Card Container */}
      <div className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] overflow-hidden border border-gray-100">
        
        <div className="grid lg:grid-cols-12 gap-0">
          
          {/* LEFT SIDE: Typography & CTA */}
          <div className="lg:col-span-5 p-8 md:p-12 flex flex-col justify-center relative z-10 bg-white">
            {/* Decorative Background Blob for Left Side */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-amber-100/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <div className="space-y-2 mb-6">
              <span className="text-6xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 tracking-tight">
                4,23,891+
              </span>
              <h2 className="text-4xl md:text-3xl font-bold text-gray-900 leading-[1.1]">
                Job Selections.
              </h2>
            </div>

            <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-sm">
              Join the elite league. Share your selection journey to be featured on the Ooshas Global Wall of Fame.
            </p>

            <button className="group relative w-fit overflow-hidden rounded-xl bg-orange-500 px-8 py-4 text-white shadow-lg transition-all hover:bg-orange-600 hover:shadow-orange-500/30 hover:-translate-y-1">
              <span className="relative z-10 font-semibold text-base flex items-center gap-2">
                Share Your Journey
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m-4-4H3"></path></svg>
              </span>
            </button>
          </div>

          {/* RIGHT SIDE: Compact Masonry/Bento Grid */}
          <div className="lg:col-span-7 bg-gray-50/50 p-6 md:p-8 relative">
             {/* Subtle Pattern Overlay */}
             <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            <div className="grid grid-cols-4 auto-rows-[100px] gap-3 md:gap-4 h-full content-center">
              
              {profiles.map((profile, idx) => {
                // Determine grid span classes based on type
                let spanClass = "col-span-1 row-span-1"; // Standard
                if (profile.type === 'hero') spanClass = "col-span-2 row-span-2";
                if (profile.type === 'tall') spanClass = "col-span-1 row-span-2";
                if (profile.type === 'wide') spanClass = "col-span-2 row-span-1";

                return (
                  <div 
                    key={profile.id} 
                    className={`group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 ease-out hover:-translate-y-1 ${spanClass}`}
                  >
                    <img 
                      src={profile.img} 
                      alt="Student" 
                      className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                       <span className="text-white text-xs font-medium translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                         Selected for Govt Exam
                       </span>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

        </div>
      </div>
      
    </div>
    <TestbookSuccessSection/>
    <WallOfFame/>
    
    </>
  );
};


export const TestbookSuccessSection = () => {
  // Profile data for the Wall of Fame grid
 
  return (
    <div className="h-full  py-2 px-4 md:px-8 md:py-4">
      <div className="max-w-6xl mx-auto space-y-12">
        
       


        {/* ================= SELECTIONS STATS SECTION ================= */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] p-8 md:p-12 relative overflow-hidden border border-gray-100">
          
          {/* Header & Trophy */}
          <div className="relative mb-10 md:mb-14">
            <div className="max-w-xl relative z-10">
              <p className="text-gray-500 font-medium mb-2 text-sm md:text-base uppercase tracking-wide">
                Selections at Ooshas Global
              </p>
              <h2 className="text-2xl md:text-2xl font-bold text-gray-900 leading-tight">
                We are proud to help thousands of students in securing their dream job
              </h2>
            </div>

            {/* Decorative Trophy SVG */}
            <div className="hidden md:block absolute -top-4 right-0 w-64 h-64 -mt-12 -mr-8 opacity-90 z-11">
               <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="20" y="20" width="10" height="10" fill="#FCD34D" transform="rotate(15)" />
                  <rect x="160" y="40" width="8" height="8" fill="#F59E0B" transform="rotate(-20)" />
                  <rect x="140" y="10" width="12" height="6" fill="#FBBF24" transform="rotate(45)" />
                  <path d="M60 70 C60 70 50 130 100 150 C150 130 140 70 140 70 L60 70 Z" fill="url(#trophyGradient)" />
                  <path d="M60 70 L40 90 C30 100 40 120 60 110" stroke="#F59E0B" strokeWidth="4" fill="none" />
                  <path d="M140 70 L160 90 C170 100 160 120 140 110" stroke="#F59E0B" strokeWidth="4" fill="none" />
                  <path d="M100 85 L105 100 L120 100 L108 110 L112 125 L100 115 L88 125 L92 110 L80 100 L95 100 Z" fill="white" fillOpacity="0.8" />
                  <rect x="85" y="150" width="30" height="10" fill="#D97706" />
                  <rect x="75" y="160" width="50" height="8" rx="2" fill="#92400E" />
                  <defs>
                    <linearGradient id="trophyGradient" x1="60" y1="70" x2="140" y2="150" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FCD34D" />
                      <stop offset="1" stopColor="#F59E0B" />
                    </linearGradient>
                  </defs>
               </svg>
            </div>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">
            
            {/* Total Card */}
            <div className="bg-[#FFF8EB] rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-orange-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute inset-y-0 left-2 flex items-center opacity-60">
                 <svg width="40" height="80" viewBox="0 0 24 48" fill="none" stroke="#F59E0B" strokeWidth="1.5">
                   <path d="M12 44C12 44 4 36 4 24C4 12 12 4 12 4" />
                   <path d="M12 40C8 36 6 30 6 24" />
                   <path d="M12 36C9 32 8 26 8 20" />
                   <path d="M12 32C10 28 10 22 10 16" />
                 </svg>
              </div>
              
              <div className="z-10">
                <h3 className="text-3xl md:text-2xl font-bold text-gray-900 mb-1">53567</h3>
                <p className="text-gray-600 font-medium">Total</p>
              </div>

              <div className="absolute inset-y-0 right-2 flex items-center opacity-60 scale-x-[-1]">
                 <svg width="40" height="80" viewBox="0 0 24 48" fill="none" stroke="#F59E0B" strokeWidth="1.5">
                   <path d="M12 44C12 44 4 36 4 24C4 12 12 4 12 4" />
                   <path d="M12 40C8 36 6 30 6 24" />
                   <path d="M12 36C9 32 8 26 8 20" />
                   <path d="M12 32C10 28 10 22 10 16" />
                 </svg>
              </div>
            </div>

            {/* SSC Card */}
            <StatCard count="19054" label="Selections in SSC" iconBg="bg-purple-100" iconColor="text-purple-600" icon={<GraduationCapIcon />} />
            
            {/* Banking Card */}
            <StatCard count="18921" label="Selections in Banking" iconBg="bg-blue-100" iconColor="text-blue-600" icon={<BankIcon />} />
            
            {/* Railways Card */}
            <StatCard count="7087" label="Selections in Railways" iconBg="bg-orange-100" iconColor="text-orange-600" icon={<TrainIcon />} />
            
            {/* Other Govt Card */}
            <StatCard count="8505" label="Selections in Other Govt Exams" iconBg="bg-green-100" iconColor="text-green-600" icon={<GovtBuildingIcon />} />
          </div>
        </div>

      </div>
    </div>
  );
};

// Reusable Stat Card Component
const StatCard = ({ count, label, iconBg, iconColor, icon }) => (
  <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
    <div className={`w-12 h-12 ${iconBg} ${iconColor} rounded-full flex items-center justify-center mb-4`}>
      {icon}
    </div>
    <h3 className="text-2xl md:text-xl font-bold text-gray-900 mb-2">{count}</h3>
    <p className="text-gray-500 text-sm leading-tight">{label}</p>
  </div>
);

// Inline Icons
const GraduationCapIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" /></svg>
);
const BankIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" /></svg>
);
const TrainIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" /></svg>
);
const GovtBuildingIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-5a1 1 0 01.008-.943z" clipRule="evenodd" /></svg>
);




export const WallOfFame = () => {
  const students = [
    { name: 'Samridhi Talwar', rank: 'AIR 1', exam: 'Delhi Judicial 2024', img: 'https://i.pravatar.cc/200?img=5' },
    { name: 'Ashish Tiwari', rank: 'AIR 2', exam: 'SSC CGL 2024', img: 'https://i.pravatar.cc/200?img=12' },
    { name: 'Debesh Bairagi', rank: 'AIR 4', exam: 'SSC CGL 2024', img: 'https://i.pravatar.cc/200?img=13' },
    { name: 'Ishant Shukla', rank: 'AIR 8', exam: 'SSC CGL 2024', img: 'https://i.pravatar.cc/200?img=14' },
    { name: 'Rohit Chadhar', rank: 'AIR 1', exam: 'SSC CHSL 2024', img: 'https://i.pravatar.cc/200?img=15' },
    { name: 'Sagardip Ghosh', rank: 'AIR 3', exam: 'SSC CHSL 2024', img: 'https://i.pravatar.cc/200?img=16' },
    { name: 'Mohan Kumar', rank: 'AIR 1', exam: 'SSC JE (ME) 2023', img: 'https://i.pravatar.cc/200?img=17' },
    { name: 'Sanket Paul', rank: 'AIR 1', exam: 'SSC JE (CE) 2023', img: 'https://i.pravatar.cc/200?img=18' },
  ];

  return (
    <div className="w-full py-2 px-4 md:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            {/* Testbook Logo Icon */}
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-2xl font-bold">
              <span className="text-orange-500">Ooshas Global</span>
              <span className="text-gray-900 ml-2">Wall of Fame</span>
            </h1>
          </div>
        </div>

        {/* Student Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {students.map((student, index) => (
            <StudentCard key={index} {...student} />
          ))}
        </div>

      </div>
    </div>
  );
};

const StudentCard = ({ name, rank, exam, img }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center hover:shadow-lg transition-shadow duration-300">
      
      {/* Photo Container with Decorations */}
      <div className="relative w-36 h-36 mb-4">
        
        {/* Confetti Dots - Scattered around */}
        <div className="absolute -top-2 left-4 w-2 h-2 bg-green-400 rounded-full"></div>
        <div className="absolute top-6 -left-2 w-2 h-2 bg-blue-400 rounded-full"></div>
        <div className="absolute -bottom-1 left-6 w-2 h-2 bg-purple-400 rounded-full"></div>
        <div className="absolute -top-1 right-8 w-2 h-2 bg-pink-400 rounded-full"></div>
        <div className="absolute top-8 -right-1 w-2 h-2 bg-pink-400 rounded-full"></div>
        <div className="absolute -bottom-2 right-4 w-2 h-2 bg-pink-400 rounded-full"></div>

        {/* Top Sparkles */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1">
          <div className="w-0.5 h-3 bg-amber-400 rounded-full"></div>
          <div className="w-0.5 h-4 bg-amber-400 rounded-full"></div>
          <div className="w-0.5 h-3 bg-amber-400 rounded-full"></div>
        </div>

        {/* Left Wing/Laurel Decoration */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2">
          <svg width="24" height="40" viewBox="0 0 24 40" fill="none">
            <path d="M20 5C15 8 12 15 12 20C12 25 15 32 20 35" stroke="#FBBF24" strokeWidth="2" fill="none" />
            <path d="M16 8C12 10 10 15 10 20C10 25 12 30 16 32" stroke="#FBBF24" strokeWidth="1.5" fill="none" />
            <path d="M12 10C9 12 8 16 8 20C8 24 9 28 12 30" stroke="#FBBF24" strokeWidth="1" fill="none" />
          </svg>
        </div>

        {/* Right Wing/Laurel Decoration */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2">
          <svg width="24" height="40" viewBox="0 0 24 40" fill="none">
            <path d="M4 5C9 8 12 15 12 20C12 25 9 32 4 35" stroke="#FBBF24" strokeWidth="2" fill="none" />
            <path d="M8 8C12 10 14 15 14 20C14 25 12 30 8 32" stroke="#FBBF24" strokeWidth="1.5" fill="none" />
            <path d="M12 10C15 12 16 16 16 20C16 24 15 28 12 30" stroke="#FBBF24" strokeWidth="1" fill="none" />
          </svg>
        </div>

        {/* Main Photo Circle with Golden Border */}
        <div className="relative w-full h-full rounded-full p-1 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 shadow-md">
          <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
            <img
              src={img}
              alt={name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>

        {/* Star Badge - Top Right */}
        <div className="absolute -top-1 -right-1 w-10 h-10 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>

      </div>

      {/* Student Name */}
      <h3 className="text-sm font-semibold text-gray-900 mb-1 text-center">
        {name}
      </h3>

      {/* Rank and Exam */}
      <p className="text-xs font-medium text-emerald-500 text-center">
        {rank} | {exam}
      </p>

    </div>
  );
};




export default CompactWallOfFame;


