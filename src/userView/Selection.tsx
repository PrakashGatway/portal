import {
  ArrowRight,
  Building2,
  Globe2,
  GraduationCap,
  Medal,
  Plane,
  Sparkles,
  Trophy,
  Users,
  X,
  Star,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import axios from "axios";

const renderHTML = (htmlString) => {
  return { __html: htmlString || "" };
};

const TestimonialModal = ({ student, onClose }) => {
  if (!student) return null;

  const testimonialText =
    student.about ||
    student.message ||
    "I knew the concepts, but timing was my biggest weakness. The practice tests and mock tests at OOSHAS Prep helped me improve my speed, accuracy, and confidence.";

  const accentColor = "#FF6B35";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <X size={22} />
        </button>

        {/* LEFT SIDE - IMAGE */}
        <div className="w-full md:w-2/5 p-10 flex flex-col items-center justify-center relative">
          <div className="relative w-44 h-44 md:w-52 md:h-52 mb-6">
            {/* Triangle */}
            <svg
              className="absolute -top-3 -left-3 w-full h-full"
              viewBox="0 5 60 76"
              fill="none"
              preserveAspectRatio="none"
            >
              <path d="M0 0 L60 0 L0 76 Z" fill={accentColor} />
            </svg>

            <div className="relative w-full h-full border-5 border-white overflow-hidden z-[999] bg-[#ffb499]">
              <img
                src={student.image}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 text-center">
            {student.name}
          </h3>

          <div className="h-[75%] w-[.5px] absolute right-0 bg-gray-900" />
        </div>



        {/* RIGHT SIDE - CONTENT */}
        <div className="w-full md:w-3/5 p-8 md:p-12 flex flex-col justify-center 
        relative max-h-[80vh] overflow-y-auto  border-gray-100">

          {/* Heading */}
          <div className="mb-6 mt-42 sm:mt-0 flex items-start justify-between">
            <div>
              <h2
                className="text-3xl md:text-4xl font-black tracking-tight"
                style={{ color: accentColor }}
              >
                STUDENT
              </h2>
              <span className="block text-4xl md:text-5xl font-['cursive'] text-gray-800 -mt-1">
                Testimonial
              </span>
            </div>

            {/* Quote Icon */}
            <svg
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill={accentColor}
              className="opacity-20 shrink-0 rotate-[180deg]"
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
          </div>

          {/* Score & Course */}
          <div className="mb-6">
            {student.previousScore && (
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 mb-1">
                <span>{student.previousScore}</span>
                <span style={{ color: accentColor }}>→</span>
                <span style={{ color: accentColor }}>{student.score}</span>
              </div>
            )}

            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-5xl font-black"
                style={{ color: accentColor }}
              >
                {student.score || "N/A"}
              </span>
              <span className="text-xs font-bold text-gray-500 tracking-wide mt-1">
                {(student.course || "SAT SCORE").toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <span className="text-gray-600 font-medium">
                | Excellent Preparation
              </span>
            </div>
          </div>

          {/* Testimonial Text */}
          <div
            className="text-gray-600 text-sm md:text-base leading-relaxed mb-6 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={renderHTML(testimonialText)}
          />
        </div>
      </div>
    </div>
  );
};

const CompactWallOfFame = () => {

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students2, setstudents2] = useState([]);
  type Student = {
    name: string;
    university?: string;
    image?: string;
    flag?: string;
    rotate?: string;
  };

  type ApiStudent = {
    name?: string;
    image?: string;
    img?: string;
  };

  const [students, setstudents] = useState<Student[]>([]);

  // const students = ;

  const achievements = [
    { value: "4,23,891+", label: "Total Selections", icon: GraduationCap },
    { value: "85+", label: "Countries Worldwide", icon: Globe2 },
    { value: "1,250+", label: "Partner Universities", icon: Building2 },
    { value: "92%", label: "Success Rate", icon: Medal },
    { value: "50,000+", label: "Students Transformed", icon: Users },
  ];

  const stats = [
    { value: "85+", label: "Countries", icon: Globe2 },
    { value: "1,250+", label: "Universities", icon: Building2 },
    { value: "50,000+", label: "Happy Students", icon: Users },
    { value: "92%", label: "Success Rate", icon: Trophy },
  ];

  const fetchData = async () => {
    try {
      const [api, api2] = await Promise.all([
        axios.get("https://www.ooshasprep.com/api/admin/student"),
        axios.get("https://www.ooshasprep.com/api/admin/student?limit=6"),
      ]);


      console.log(api?.data?.data, "all data");
      if (api?.data?.data) {
        setstudents2(api.data.data);
        setstudents(
          (api2.data?.data || []).map(
            (student: ApiStudent, index: number): Student => ({
              name: student.name || "Student",
              image: student.image || student.img,
              university: student?.course +" "+  student.score,
              rotate: [
                "md:rotate-2",
                "md:rotate-5",
                "md:rotate-6",
                "md:-rotate-5",
                "md:-rotate-4",
                "md:rotate-4",
              ][index % 6],
            })
          )
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <div className="flex items-center justify-center">
        <section className="w-full px-4 py-2 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-[1450px] overflow-hidden rounded-[28px] border border-[#f4d9c9] bg-[#fffaf5] shadow-[0_15px_50px_rgba(246,103,60,0.10)]">
            {/* BACKGROUND DECORATIONS */}
            <div className="pointer-events-none absolute right-[-120px] top-[-180px] h-[500px] w-[650px] rounded-full bg-[#ffad87]/55 blur-[110px]" />
            <div className="pointer-events-none absolute left-[-180px] top-[-150px] h-[400px] w-[500px] rounded-full bg-[#fff8ef] blur-[100px]" />
            <div className="pointer-events-none absolute bottom-[-200px] left-[0%] h-[350px] w-[600px] rounded-full bg-[#ffad87]/40 blur-[120px]" />

            {/* MAIN HERO */}
            <div className="relative grid grid-cols-1 gap-10 px-6 pb-8 pt-8 sm:px-8 sm:pt-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8 lg:px-6 lg:pb-1 lg:pt-1">
              {/* LEFT CONTENT */}
              <div className="relative z-10 flex flex-col justify-center lg:pr-4">
                <div className="hidden lg:block absolute left-60 top-40 w-70 rotate-13 scale-120">
                  <img src="/images/aeroplane.png" alt="" />
                </div>

                <div className="mb-6 flex items-center w-30">
                  <img
                    src="https://dashboard.ooshasprep.com/ooshas-logo.png"
                    alt=""
                  />
                </div>

                <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-[#f6673c]/20 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#f6673c] shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Student Success Stories
                </div>

                <div className="font-['cursive'] text-xl leading-none text-[#f6673c] sm:text-[46px] lg:text-4xl">
                  Real Dreams.
                </div>

                <h2 className="mt-2 max-w-[650px] text-xl font-black leading-[0.98] tracking-[-0.045em] text-[#111111] sm:text-[48px] lg:text-4xl">
                  Real Achievements.
                </h2>

                <p className="mt-5 max-w-[590px] text-sm leading-7 text-[#4b5563] sm:text-base lg:text-[17px] lg:leading-8">
                  Proudly celebrating thousands of students who turned their
                  study abroad dreams into reality with Ooshas Prep.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    className="group inline-flex h-12 items-center justify-center gap-3 rounded-xl bg-[#f6673c] px-6 text-xs lg:text-sm font-bold text-white shadow-[0_10px_25px_rgba(246,103,60,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#ed592f] hover:shadow-[0_15px_30px_rgba(246,103,60,0.30)]"
                  >
                    Be Our Next Success Story
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>

                  <div className="hidden items-center gap-2 text-[#f6673c] sm:flex">
                    <svg
                      width="45"
                      height="30"
                      viewBox="0 0 45 30"
                      fill="none"
                      className="shrink-0"
                    >
                      <path
                        d="M2 22C13 22 20 19 27 12C32 7 37 4 43 3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M37 3L43 3L41 9"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="max-w-[130px] font-['cursive'] text-sm leading-5">
                      Your dream is
                      <br />
                      our mission!
                    </span>
                  </div>
                </div>

                {/* STATS */}
                <div className="mt-4 grid grid-cols-2 lg:flex items-center gap-4 lg:gap-0 justify-between lg:border-t lg:border-[#eadbd0] pt-5">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className={`flex flex-col items-center justify-center text-center ${
                          index !== 0
                            ? "lg:border-l lg:border-[#eadbd0] lg:pl-6"
                            : ""
                        }`}
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#f6673c]/20 bg-white/80 text-[#f6673c] shadow-[0_3px_10px_rgba(246,103,60,0.06)]">
                          <Icon className="h-[19px] w-[19px]" />
                        </div>
                        <div className="mt-2 text-[19px] font-black leading-none tracking-[-0.02em] text-[#111827]">
                          {stat.value}
                        </div>
                        <div className="mt-1 text-[12px] font-normal leading-4 text-[#4b5563]">
                          {stat.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT STUDENT GRID */}
              <div className="relative z-10 flex min-h-[400px] items-center justify-center sm:min-h-[470px] lg:min-h-[540px]">
                <div className="relative mt-5 grid w-full max-w-[700px] grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-4">
                  {students.map((student, index) => (
                    <div
                      key={student.name}
                      className={`group relative overflow-visible rounded-2xl bg-white shadow-[0_12px_30px_rgba(0,0,0,0.10)] ring-1 ring-black/[0.04] transition-all duration-500 hover:z-20 hover:-translate-y-2 hover:rotate-0 ${student.rotate} ${
                        index === 3 ? "md:mt-2" : ""
                      } ${index === 4 ? "md:-mt-1" : ""} ${
                        index === 5 ? "md:mt-3" : ""
                      }`}
                    >
                     {student?.flag && <div className="absolute bottom-16 right-3 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-lg z-10">
                        <img
                          src={student.flag}
                          alt={`${student.name} country flag`}
                          className="h-full w-full object-cover"
                        />
                      </div>}

                      <div className="relative aspect-[1.18] overflow-hidden rounded-t-2xl bg-gray-100">
                        <img
                          src={student.image}
                          alt={student.name}
                          className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>

                      <div className="min-h-[76px] px-3 pb-3 pt-3 sm:min-h-[74px] sm:px-4">
                        <h3 className="truncate text-xs font-extrabold text-[#111827] sm:text-sm">
                          {student.name}
                        </h3>
                        {student?.university && <div className="mt-2 flex items-start gap-2">
                          <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-[#f6673c]" />
                          <span className="line-clamp-2 text-[9px] font-medium leading-4 text-gray-600 sm:text-xs">
                            {student.university}
                          </span>
                        </div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BOTTOM ACHIEVEMENT STRIP */}
            <div className="relative mx-5 mb-5 overflow-hidden rounded-[22px] bg-gradient-to-r from-[#ff8a3d] via-[#f6673c] to-[#ff5b25] px-5 py-6 text-white shadow-[0_12px_30px_rgba(246,103,60,0.22)] sm:mx-7 sm:px-7 lg:mx-8 lg:mb-8 lg:px-8 lg:py-5">
              <div className="pointer-events-none absolute right-[-80px] top-[-100px] h-56 w-56 rounded-full bg-white/10 blur-2xl" />

              <div className="relative grid grid-cols-2 gap-y-7 lg:grid-cols-[1.25fr_repeat(5,1fr)] lg:items-center lg:gap-0">
                <div className="col-span-2 border-b border-white/20 pb-5 lg:col-span-1 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-7">
                  <div className="font-['cursive'] text-xl leading-none text-white/95">
                    Proud Moments.
                  </div>
                  <h3 className="mt-1 text-lg font-black">Lifetime Success.</h3>
                  <p className="mt-2 max-w-[230px] text-[11px] leading-5 text-white/80">
                    Our students' success is the foundation of our journey.
                  </p>
                </div>

                {achievements.map((achievement, index) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.label}
                      className={`lg:flex grid grid-cols-3 items-center px-2 sm:px-4 lg:min-h-[65px] lg:px-5 gap-3 ${
                        index !== 0 ? "lg:border-l lg:border-white/20" : ""
                      }`}
                    >
                      <div className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-[#f6673c]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-black leading-none sm:text-lg">
                          {achievement.value}
                        </div>
                        <div className="mt-1 max-w-[110px] lg:text-sm text-xs leading-4 text-white/85">
                          {achievement.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ================= STUDENT GRID (API DATA) ================= */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 max-w-7xl p-6 relative z-10">
              {students2.map((student, index) => (
                <div
                  key={student._id || index}
                  className="group overflow-hidden rounded-2xl border border-[#F1E8E3] bg-white p-3 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
                >
                  {/* Student Image */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#FFF5F0]">
                    <img
                      src={student.image}
                      alt={student.name}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Score Badge */}
                    <div
                      className="absolute bottom-2 right-2 rounded-lg px-2.5 py-1 text-sm font-bold text-white shadow-md"
                      style={{
                        backgroundColor: "#FF6B35",
                      }}
                    >
                      {student.score}
                    </div>

                    {/* Course Badge */}
                    {student.course && (
                      <div className="absolute top-2 left-2 rounded-lg bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-gray-800 shadow-sm">
                        {student.course}
                      </div>
                    )}
                  </div>

                  {/* Student Details */}
                  <div className="px-1 pt-3">
                    <h3 className="truncate text-center text-sm font-semibold text-[#242424] sm:text-base">
                      {student.name}
                    </h3>

                    <div
                      className="mx-auto mt-2 h-1 w-7 rounded-full"
                      style={{
                        backgroundColor: "#FF9B76",
                      }}
                    />

                    {/* View Profile Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(student)}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold transition-all duration-200 hover:text-white sm:text-sm"
                      style={{
                        borderColor: "#FF6B35",
                        color: "#FF6B35",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#FF6B35";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#FF6B35";
                      }}
                    >
                      View Profile
                      <span>→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* MODAL */}
            {selectedStudent && (
              <TestimonialModal
                student={selectedStudent}
                onClose={() => setSelectedStudent(null)}
              />
            )}
          </div>
        </section>
      </div>
    </>
  );
};




export const TestbookSuccessSection = () => {
  return (
    <div className="h-full py-2 px-4 md:px-8 md:py-4">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] p-8 md:p-12 relative overflow-hidden border border-gray-100">
          <div className="relative mb-10 md:mb-14">
            <div className="max-w-xl relative z-10">
              <p className="text-gray-500 font-medium mb-2 text-sm md:text-base uppercase tracking-wide">
                Selections at Ooshas prep
              </p>
              <h2 className="text-2xl md:text-2xl font-bold text-gray-900 leading-tight">
                We are proud to help thousands of students in securing their
                dream job
              </h2>
            </div>

            <div className="hidden md:block absolute -top-4 right-0 w-64 h-64 -mt-12 -mr-8 opacity-90 z-11">
              <svg
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="20"
                  y="20"
                  width="10"
                  height="10"
                  fill="#FCD34D"
                  transform="rotate(15)"
                />
                <rect
                  x="160"
                  y="40"
                  width="8"
                  height="8"
                  fill="#F59E0B"
                  transform="rotate(-20)"
                />
                <rect
                  x="140"
                  y="10"
                  width="12"
                  height="6"
                  fill="#FBBF24"
                  transform="rotate(45)"
                />
                <path
                  d="M60 70 C60 70 50 130 100 150 C150 130 140 70 140 70 L60 70 Z"
                  fill="url(#trophyGradient)"
                />
                <path
                  d="M60 70 L40 90 C30 100 40 120 60 110"
                  stroke="#F59E0B"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  d="M140 70 L160 90 C170 100 160 120 140 110"
                  stroke="#F59E0B"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  d="M100 85 L105 100 L120 100 L108 110 L112 125 L100 115 L88 125 L92 110 L80 100 L95 100 Z"
                  fill="white"
                  fillOpacity="0.8"
                />
                <rect x="85" y="150" width="30" height="10" fill="#D97706" />
                <rect
                  x="75"
                  y="160"
                  width="50"
                  height="8"
                  rx="2"
                  fill="#92400E"
                />
                <defs>
                  <linearGradient
                    id="trophyGradient"
                    x1="60"
                    y1="70"
                    x2="140"
                    y2="150"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#FCD34D" />
                    <stop offset="1" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">
            <div className="bg-[#FFF8EB] rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-orange-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute inset-y-0 left-2 flex items-center opacity-60">
                <svg
                  width="40"
                  height="80"
                  viewBox="0 0 24 48"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                >
                  <path d="M12 44C12 44 4 36 4 24C4 12 12 4 12 4" />
                  <path d="M12 40C8 36 6 30 6 24" />
                  <path d="M12 36C9 32 8 26 8 20" />
                  <path d="M12 32C10 28 10 22 10 16" />
                </svg>
              </div>
              <div className="z-10">
                <h3 className="text-3xl md:text-2xl font-bold text-gray-900 mb-1">
                  53567
                </h3>
                <p className="text-gray-600 font-medium">Total</p>
              </div>
              <div className="absolute inset-y-0 right-2 flex items-center opacity-60 scale-x-[-1]">
                <svg
                  width="40"
                  height="80"
                  viewBox="0 0 24 48"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                >
                  <path d="M12 44C12 44 4 36 4 24C4 12 12 4 12 4" />
                  <path d="M12 40C8 36 6 30 6 24" />
                  <path d="M12 36C9 32 8 26 8 20" />
                  <path d="M12 32C10 28 10 22 10 16" />
                </svg>
              </div>
            </div>

            <StatCard
              count="19054"
              label="Selections in SSC"
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              icon={<GraduationCapIcon />}
            />
            <StatCard
              count="18921"
              label="Selections in Banking"
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              icon={<BankIcon />}
            />
            <StatCard
              count="7087"
              label="Selections in Railways"
              iconBg="bg-orange-100"
              iconColor="text-orange-600"
              icon={<TrainIcon />}
            />
            <StatCard
              count="8505"
              label="Selections in Other Govt Exams"
              iconBg="bg-green-100"
              iconColor="text-green-600"
              icon={<GovtBuildingIcon />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Stat Card Component
const StatCard = ({ count, label, iconBg, iconColor, icon }) => (
  <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
    <div
      className={`w-12 h-12 ${iconBg} ${iconColor} rounded-full flex items-center justify-center mb-4`}
    >
      {icon}
    </div>
    <h3 className="text-2xl md:text-xl font-bold text-gray-900 mb-2">
      {count}
    </h3>
    <p className="text-gray-500 text-sm leading-tight">{label}</p>
  </div>
);

// Inline Icons
const GraduationCapIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
  </svg>
);

const BankIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
      clipRule="evenodd"
    />
  </svg>
);

const TrainIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z"
      clipRule="evenodd"
    />
  </svg>
);

const GovtBuildingIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-5a1 1 0 01.008-.943z"
      clipRule="evenodd"
    />
  </svg>
);


export const WallOfFame = () => {
  const students = [
    {
      name: "Samridhi Talwar",
      rank: "AIR 1",
      exam: "Delhi Judicial 2024",
      img: "https://i.pravatar.cc/200?img=5",
    },
    {
      name: "Ashish Tiwari",
      rank: "AIR 2",
      exam: "SSC CGL 2024",
      img: "https://i.pravatar.cc/200?img=12",
    },
    {
      name: "Debesh Bairagi",
      rank: "AIR 4",
      exam: "SSC CGL 2024",
      img: "https://i.pravatar.cc/200?img=13",
    },
    {
      name: "Ishant Shukla",
      rank: "AIR 8",
      exam: "SSC CGL 2024",
      img: "https://i.pravatar.cc/200?img=14",
    },
    {
      name: "Rohit Chadhar",
      rank: "AIR 1",
      exam: "SSC CHSL 2024",
      img: "https://i.pravatar.cc/200?img=15",
    },
    {
      name: "Sagardip Ghosh",
      rank: "AIR 3",
      exam: "SSC CHSL 2024",
      img: "https://i.pravatar.cc/200?img=16",
    },
    {
      name: "Mohan Kumar",
      rank: "AIR 1",
      exam: "SSC JE (ME) 2023",
      img: "https://i.pravatar.cc/200?img=17",
    },
    {
      name: "Sanket Paul",
      rank: "AIR 1",
      exam: "SSC JE (CE) 2023",
      img: "https://i.pravatar.cc/200?img=18",
    },
  ];

  return (
    <div className="w-full py-2 px-4 md:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-2xl font-bold">
              <span className="text-orange-500">Ooshas </span>
              <span className="text-gray-900 ml-2">Wall of Fame</span>
            </h1>
          </div>
        </div>

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
      <div className="relative w-36 h-36 mb-4">
        <div className="absolute -top-2 left-4 w-2 h-2 bg-green-400 rounded-full"></div>
        <div className="absolute top-6 -left-2 w-2 h-2 bg-blue-400 rounded-full"></div>
        <div className="absolute -bottom-1 left-6 w-2 h-2 bg-purple-400 rounded-full"></div>
        <div className="absolute -top-1 right-8 w-2 h-2 bg-pink-400 rounded-full"></div>
        <div className="absolute top-8 -right-1 w-2 h-2 bg-pink-400 rounded-full"></div>
        <div className="absolute -bottom-2 right-4 w-2 h-2 bg-pink-400 rounded-full"></div>

        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1">
          <div className="w-0.5 h-3 bg-amber-400 rounded-full"></div>
          <div className="w-0.5 h-4 bg-amber-400 rounded-full"></div>
          <div className="w-0.5 h-3 bg-amber-400 rounded-full"></div>
        </div>

        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2">
          <svg width="24" height="40" viewBox="0 0 24 40" fill="none">
            <path
              d="M20 5C15 8 12 15 12 20C12 25 15 32 20 35"
              stroke="#FBBF24"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M16 8C12 10 10 15 10 20C10 25 12 30 16 32"
              stroke="#FBBF24"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M12 10C9 12 8 16 8 20C8 24 9 28 12 30"
              stroke="#FBBF24"
              strokeWidth="1"
              fill="none"
            />
          </svg>
        </div>

        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2">
          <svg width="24" height="40" viewBox="0 0 24 40" fill="none">
            <path
              d="M4 5C9 8 12 15 12 20C12 25 9 32 4 35"
              stroke="#FBBF24"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M8 8C12 10 14 15 14 20C14 25 12 30 8 32"
              stroke="#FBBF24"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M12 10C15 12 16 16 16 20C16 24 15 28 12 30"
              stroke="#FBBF24"
              strokeWidth="1"
              fill="none"
            />
          </svg>
        </div>

        <div className="relative w-full h-full rounded-full p-1 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 shadow-md">
          <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
            <img
              src={img}
              alt={name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>

        <div className="absolute -top-1 -right-1 w-10 h-10 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
          <svg
            className="w-5 h-5 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-gray-900 mb-1 text-center">
        {name}
      </h3>
      <p className="text-xs font-medium text-emerald-500 text-center">
        {rank} | {exam}
      </p>
    </div>
  );
};

export default CompactWallOfFame;
