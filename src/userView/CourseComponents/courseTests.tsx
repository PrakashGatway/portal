import React, { useRef } from "react";
import {
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Lock,
  Star,
  Target,
} from "lucide-react";
import Button from "../../components/ui/button/Button";

interface CourseTestsProps {
  curriculum: any;
  loading?: boolean;
  onItemClick: (item: any, sectionId: string) => void;
}

export function CourseTests({
  course,
  curriculum,
  loading = false,
  onItemClick,
}: CourseTestsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-24 rounded-xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const [openTestSections, setOpenTestSections] = useState<string[]>([]);

const [expandedTests, setExpandedTests] = useState<
  Record<string, boolean>
>({});

const hasInitializedTestSections = useRef(false);



const toggleTestSection = (sectionId: string) => {
  setOpenTestSections((prev) =>
    prev.includes(sectionId)
      ? prev.filter((id) => id !== sectionId)
      : [...prev, sectionId],
  );
};

const toggleTests = (sectionId: string) => {
  setExpandedTests((prev) => ({
    ...prev,
    [sectionId]: !prev[sectionId],
  }));
};

  const sectionsWithTests = curriculum
    ?.map((section) => ({
      ...section,
      items: section.items?.filter((item: any) => item.type === "Tests") || [],
    }))
    .filter((section) => section.items.length > 0);

    useEffect(() => {
  if (
    sectionsWithTests?.length > 0 &&
    !hasInitializedTestSections.current
  ) {
    setOpenTestSections([sectionsWithTests[0]._id]);

    hasInitializedTestSections.current = true;
  }
}, [sectionsWithTests]);

  if (!sectionsWithTests?.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF1EB] text-[#F36E45]">
          <ClipboardCheck className="h-5 w-5" />
        </div>

        <h3 className="mt-4 text-base font-semibold text-[#172033]">
          No tests available
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Tests will appear here when they are added to the course.
        </p>
      </div>
    );
  }

  return (
   <div className="space-y-4">
  {sectionsWithTests.map((section, sectionIndex) => {
    const tests = section.items || [];

    // Section open / close
    const isOpen = openTestSections.includes(section._id);

    // View More / Show Less
    const isTestsExpanded =
      expandedTests[section._id] || false;

    const visibleTests = isTestsExpanded
      ? tests
      : tests.slice(0, 5);

    return (
      <div
        key={section._id}
        className="
          overflow-hidden
          rounded-xl
          border
          border-[#ffded5]
          bg-white
          transition-all
          duration-300
        "
      >
        {/* =====================================================
            SECTION HEADER
        ====================================================== */}
        <button
          type="button"
          onClick={() => toggleTestSection(section._id)}
          className="
            group
            relative
            flex
            w-full
            items-center
            justify-between
            gap-3
            bg-[#fef7dd]
            p-2
            px-4
            text-left
            transition-all
            duration-300
            hover:bg-[#FCE3D2]
          "
        >
          {/* LEFT SIDE */}
          <div className="flex min-w-0 items-center gap-4">
            {/* SECTION NUMBER */}
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                border-r
                border-[#EAB9A5]
                pr-4
                text-base
                font-medium
                text-[#F04F23]
                sm:h-12
                sm:w-12
              "
            >
              <span className="rounded-lg bg-[#FF7147] px-2 py-1 text-white">
                {String(sectionIndex + 1).padStart(2, "0")}
              </span>
            </div>

            {/* TITLE */}
            <div className="min-w-0">
              <h3
                className="
                  truncate
                  text-base
                  font-semibold
                  text-[#111827]
                "
              >
                {section.title}
              </h3>

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-xs
                  font-medium
                  text-[#8B6F61]
                "
              >
                <span>
                  {tests.length}{" "}
                  {tests.length === 1 ? "Test" : "Tests"}
                </span>

                <span className="text-[#C5A99B]">
                  •
                </span>

                <span>Assessment</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex shrink-0 items-center gap-3">
            {/* TEST COUNT */}
            <div
              className="
                hidden
                rounded-full
                border
                border-[#EBC5B3]
                bg-[#FF7147]
                px-3
                py-1
                text-sm
                font-semibold
                text-white
                sm:block
              "
            >
              {tests.length}
            </div>

            {/* SECTION CHEVRON */}
            <div
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
              "
            >
              <ChevronDown
                className={`
                  h-5
                  w-5
                  text-[#F04F23]
                  transition-transform
                  duration-300
                  ${isOpen ? "rotate-180" : ""}
                `}
              />
            </div>
          </div>
        </button>

        {/* =====================================================
            SECTION CONTENT
        ====================================================== */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{
                height: 0,
                opacity: 0,
              }}
              animate={{
                height: "auto",
                opacity: 1,
              }}
              exit={{
                height: 0,
                opacity: 0,
              }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className="overflow-hidden"
            >
              <div className="bg-white px-4 pb-2">

                {/* =================================================
                    TEST LIST
                ================================================== */}
                <div className="space-y-2.5 mt-2">
                  {visibleTests.map(
                    (item: any, index: number) => {
                      const currentTest =
                        item?.test || test;

                      const testTitle =
                        currentTest?.title ||
                        item?.title ||
                        `Test ${index + 1}`;

                      const testDescription =
                        currentTest?.description ||
                        item?.description ||
                        "Full Length Assessment";

                      const duration =
                        currentTest?.totalDurationMinutes ||
                        currentTest?.duration ||
                        item?.duration ||
                        null;

                      const totalQuestions =
                        currentTest?.totalQuestions ||
                        currentTest?.questions?.length ||
                        item?.totalQuestions ||
                        null;

                      const totalMarks =
                        currentTest?.totalMarks ||
                        currentTest?.marks ||
                        item?.totalMarks ||
                        null;

                      return (
                        <div
                          key={item._id}
                          onClick={() => {
                            if (!item.isLocked) {
                              onItemClick(
                                item,
                                section._id,
                              );
                            }
                          }}
                          className={`
                            group
                            flex
                            w-full
                            items-center
                            gap-[12px]
                            rounded-lg
                            border
                            border-[#FFB9A3]
                            bg-white
                            p-2
                            px-2.5
                            transition-all
                            duration-200
                            hover:bg-[#fef7dd]
                            ${
                              item.isLocked
                                ? "cursor-not-allowed opacity-60"
                                : "cursor-pointer hover:border-[#FF805F] hover:shadow-[0_2px_8px_rgba(242,103,56,0.08)]"
                            }
                          `}
                        >
                          {/* TEST IMAGE / CATEGORY */}
                          <div
                            className="
                              relative
                              flex
                              h-[50px]
                              w-[79px]
                              shrink-0
                              items-center
                              justify-center
                              overflow-hidden
                              rounded-[8px]
                              bg-[#FF6942]
                            "
                          >
                            <div className="relative z-10 text-center">
                              <div
                                className="
                                  text-xl
                                  font-bold
                                  text-white
                                "
                              >
                                {course?.categoryInfo?.name?.split(
                                  " ",
                                )[0] || "TEST"}
                              </div>
                            </div>
                          </div>

                          {/* CONTENT */}
                          <div className="min-w-0 flex-1">
                            {/* TITLE */}
                            <h4
                              className={`
                                truncate
                                text-base
                                font-medium
                                ${
                                  item.isLocked
                                    ? "text-gray-400"
                                    : "text-[#252525]"
                                }
                              `}
                            >
                              {testTitle}
                            </h4>

                            {/* DESCRIPTION */}
                            <p
                              className="
                                mt-px
                                truncate
                                text-xs
                                font-normal
                                text-[#777777]
                              "
                            >
                              {testDescription}
                            </p>

                            {/* TEST META */}
                            <div
                              className="
                                mt-1
                                flex
                                items-center
                                gap-[10px]
                                whitespace-nowrap
                                text-xs
                                leading-none
                                text-[#444444]
                              "
                            >
                              {/* QUESTIONS */}
                              {totalQuestions !== null && (
                                <span className="flex items-center gap-[3px]">
                                  <ClipboardCheck
                                    className="
                                      h-[10px]
                                      w-[10px]
                                      text-[#F26738]
                                    "
                                    strokeWidth={2}
                                  />

                                  <span>
                                    {totalQuestions}{" "}
                                    {Number(
                                      totalQuestions,
                                    ) === 1
                                      ? "Task"
                                      : "Tasks"}
                                  </span>
                                </span>
                              )}

                              {/* DURATION */}
                              {duration !== null && (
                                <span className="flex items-center gap-[3px]">
                                  <Clock3
                                    className="
                                      h-[10px]
                                      w-[10px]
                                      text-[#F26738]
                                    "
                                    strokeWidth={2}
                                  />

                                  <span>
                                    {duration} Min
                                  </span>
                                </span>
                              )}

                              {/* MARKS */}
                              {totalMarks !== null && (
                                <span className="flex items-center gap-[3px]">
                                  <Award
                                    className="
                                      h-[10px]
                                      w-[10px]
                                      text-[#F26738]
                                    "
                                    strokeWidth={2}
                                  />

                                  <span>
                                    {totalMarks} Marks
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* ACTION */}
                          <div className="shrink-0">
                            {item.isLocked ? (
                              <Button
                                type="button"
                                disabled
                                variant="outline"
                                size="sm"
                                className="
                                  mr-[3px]
                                  h-[25px]
                                  shrink-0
                                  rounded-full
                                  border-gray-200
                                  bg-gray-50
                                  px-[12px]
                                  text-[10px]
                                  text-gray-400
                                "
                              >
                                <Lock className="mr-1 h-3 w-3" />
                                Locked
                              </Button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();

                                  onItemClick(
                                    item,
                                    section._id,
                                  );
                                }}
                                className="
                                  mr-[3px]
                                  flex
                                  h-[25px]
                                  min-w-[70px]
                                  shrink-0
                                  items-center
                                  justify-center
                                  gap-[3px]
                                  rounded-[7px]
                                  bg-[#FF6942]
                                  px-[10px]
                                  text-sm
                                  font-medium
                                  leading-none
                                  text-white
                                  transition-all
                                  duration-200
                                  hover:bg-[#F45A34]
                                  active:scale-[0.97]
                                "
                              >
                                Start Test

                                <ChevronRight
                                  className="
                                    h-[10px]
                                    w-[10px]
                                  "
                                  strokeWidth={2.5}
                                />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>

                {/* =================================================
                    VIEW MORE / SHOW LESS
                ================================================== */}
                {tests.length > 5 && (
                  <div className="border-t border-[#F1E7E2]">
                    <button
                      type="button"
                      onClick={() =>
                        toggleTests(section._id)
                      }
                      className="
                        flex
                        w-full
                        items-center
                        justify-center
                        gap-2
                        py-4
                        text-sm
                        font-semibold
                        text-[#F4511E]
                        transition-colors
                        hover:text-[#D93F0D]
                      "
                    >
                      {isTestsExpanded
                        ? "Show less"
                        : `View all ${tests.length} tests`}

                      <ChevronDown
                        className={`
                          h-4
                          w-4
                          transition-transform
                          duration-200
                          ${
                            isTestsExpanded
                              ? "rotate-180"
                              : ""
                          }
                        `}
                      />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  })}
</div>
  );
}

import { File, LinkIcon, ImageIcon, Headphones } from "lucide-react";

interface CourseMaterialsProps {
  curriculum: any;
  loading?: boolean;
  onItemClick: (item: any, sectionId: string) => void;
}

const getMaterialIcon = (materialType?: string) => {
  switch (materialType?.toLowerCase()) {
    case "link":
      return <LinkIcon className="h-5 w-5 text-white" />;

    case "image":
      return <ImageIcon className="h-5 w-5 text-white" />;

    case "audio":
      return <Headphones className="h-5 w-5 text-white" />;

    case "pdf":
    case "document":
    default:
      return <File className="h-5 w-5 text-white" />;
  }
};

const getMaterialIconBg = (materialType?: string) => {
  switch (materialType?.toLowerCase()) {
    case "link":
      return "bg-[#2563EB]";

    case "image":
      return "bg-[#16A34A]";

    case "audio":
      return "bg-[#9333EA]";

    case "document":
      return "bg-[#EA580C]";

    default:
      return "bg-[#6B7280]";
  }
};

const getMaterialLabel = (materialType?: string) => {
  if (!materialType) return "Study Material";

  return materialType.charAt(0).toUpperCase() + materialType.slice(1);
};




export function CourseMaterials({
  curriculum,
  loading = false,
  onItemClick,
}: CourseMaterialsProps) {

    if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-24 rounded-xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const [openMaterialSections, setOpenMaterialSections] = useState<string[]>([]);

  const [expandedMaterials, setExpandedMaterials] = useState<
    Record<string, boolean>
  >({});

  const hasInitializedMaterials = useRef(false);

  const toggleMaterialSection = (sectionId: string) => {
    setOpenMaterialSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    );
  };

  const toggleMaterials = (sectionId: string) => {
    setExpandedMaterials((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };



  const sectionsWithMaterials = curriculum
    ?.map((section) => ({
      ...section,
      items:
        section.items?.filter((item: any) => item.type === "StudyMaterials") ||
        [],
    }))
    .filter((section) => section.items.length > 0);

 useEffect(() => {
  if (
    sectionsWithMaterials?.length > 0 &&
    !hasInitializedMaterials.current
  ) {
    setOpenMaterialSections([sectionsWithMaterials[0]._id]);

    hasInitializedMaterials.current = true;
  }
}, [sectionsWithMaterials]);
  if (!sectionsWithMaterials?.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF1EB] text-[#F36E45]">
          <File className="h-5 w-5" />
        </div>

        <h3 className="mt-4 text-base font-semibold text-[#172033]">
          No study materials available
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Study materials will appear here when they are added to the course.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sectionsWithMaterials.map((section, sectionIndex) => {
        const materials = section.items || [];

        // Section open / close
        const isOpen = openMaterialSections.includes(section._id);

        // Materials View More / Show Less
        const isMaterialsExpanded =
          expandedMaterials[section._id] || false;

        const visibleMaterials = isMaterialsExpanded
          ? materials
          : materials.slice(0, 5);

        return (
          <div
            key={section._id}
            className="
          overflow-hidden
          rounded-xl
          border
          border-[#ffded5]
          bg-white
          transition-all
          duration-300
        "
          >
            {/* =====================================================
            SECTION HEADER
        ====================================================== */}
            <button
              type="button"
              onClick={() => toggleMaterialSection(section._id)}
              className="
            group
            relative
            flex
            w-full
            items-center
            justify-between
            gap-3
            bg-[#fef7dd]
            p-2
            px-4
            text-left
            transition-all
            duration-300
            hover:bg-[#FCE3D2]
          "
            >
              {/* LEFT */}
              <div className="flex min-w-0 items-center gap-4">
                {/* SECTION NUMBER */}
                <div
                  className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                border-r
                border-[#EAB9A5]
                pr-4
                text-base
                font-medium
                text-[#F04F23]
                sm:h-12
                sm:w-12
              "
                >
                  <span className="rounded-lg bg-[#FF7147] px-2 py-1 text-white">
                    {String(sectionIndex + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* TITLE */}
                <div className="min-w-0">
                  <h3
                    className="
                  truncate
                  text-base
                  font-semibold
                  text-[#111827]
                "
                  >
                    {section.title}
                  </h3>

                  <div
                    className="
                  flex
                  items-center
                  gap-2
                  text-xs
                  font-medium
                  text-[#8B6F61]
                "
                  >
                    <span>
                      {materials.length}{" "}
                      {materials.length === 1
                        ? "Material"
                        : "Materials"}
                    </span>

                    <span className="text-[#C5A99B]">
                      •
                    </span>

                    <span>Study Materials</span>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex shrink-0 items-center gap-3">
                {/* COUNT */}
                <div
                  className="
                hidden
                rounded-full
                border
                border-[#EBC5B3]
                bg-[#FF7147]
                px-3
                py-1
                text-sm
                font-semibold
                text-white
                sm:block
              "
                >
                  {materials.length}
                </div>

                {/* SECTION ARROW */}
                <div
                  className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
              "
                >
                  <ChevronDown
                    className={`
                  h-5
                  w-5
                  text-[#F04F23]
                  transition-transform
                  duration-300
                  ${isOpen ? "rotate-180" : ""}
                `}
                  />
                </div>
              </div>
            </button>

            {/* =====================================================
            SECTION CONTENT
        ====================================================== */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{
                    height: 0,
                    opacity: 0,
                  }}
                  animate={{
                    height: "auto",
                    opacity: 1,
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeInOut",
                  }}
                  className="overflow-hidden"
                >
                  <div className="bg-white px-4 pb-2">

                    {/* =================================================
                    MATERIAL LIST
                ================================================== */}
                    <div className="space-y-2 mt-2">
                      {visibleMaterials.map((item: any) => {
                        const isPdf =
                          item?.materialType?.toLowerCase() === "pdf" ||
                          item?.materialType?.toLowerCase() ===
                          "document";

                        const handleView = (
                          e: React.MouseEvent,
                        ) => {
                          e.stopPropagation();

                          if (item.isLocked) return;

                          onItemClick(item, section._id);
                        };

                        return (
                          <div
                            key={item._id}
                            onClick={() => {
                              if (!item.isLocked) {
                                onItemClick(
                                  item,
                                  section._id,
                                );
                              }
                            }}
                            className={`
                          group
                          flex
                          min-h-[64px]
                          w-full
                          items-center
                          gap-[10px]
                          rounded-[11px]
                          bg-[#FFF6DD]
                          px-3
                          py-2
                          transition-all
                          duration-200
                          ${item.isLocked
                                ? "cursor-not-allowed opacity-60"
                                : "cursor-pointer hover:bg-[#FFF6DD]/50"
                              }
                        `}
                          >
                            {/* ICON */}
                            <div
                              className="
                            flex
                            shrink-0
                            items-center
                            justify-center
                            rounded-[9px]
                            bg-white
                            p-1.5
                          "
                            >
                              {isPdf ? (
                                <div
                                  className="
                                flex
                                h-[35px]
                                w-[35px]
                                items-center
                                justify-center
                                rounded-[5px]
                                bg-[#D82323]
                              "
                                >
                                  <img
                                    className="
                                  h-full
                                  w-full
                                  object-cover
                                "
                                    src="https://www.svgrepo.com/show/349472/pdf.svg"
                                    alt="PDF"
                                  />
                                </div>
                              ) : (
                                <div
                                  className={`flex
    h-[35px]
    w-[35px]
    items-center
    justify-center
    rounded-[5px]
    ${getMaterialIconBg(item.materialType)}
  `}
                                >
                                  {getMaterialIcon(
                                    item.materialType,
                                  )}
                                </div>
                              )}
                            </div>

                            {/* CONTENT */}
                            <div className="min-w-0 flex-1 py-[2px]">
                              <h3
                                className={`
                              truncate
                              text-base
                              font-semibold
                              ${item.isLocked
                                    ? "text-gray-400"
                                    : "text-[#2D2D2D]"
                                  }
                            `}
                              >
                                {item.title}
                              </h3>

                              {item.description ? (
                                <p
                                  className="
                                mt-[1px]
                                line-clamp-2
                                max-w-[300px]
                                text-xs
                                font-normal
                                text-[#858585]
                              "
                                >
                                  {item.description}
                                </p>
                              ) : (
                                <p
                                  className="
                                mt-[1px]
                                text-xs
                                font-normal
                                text-[#858585]
                              "
                                >
                                  {getMaterialLabel(
                                    item.materialType,
                                  )}
                                </p>
                              )}
                            </div>

                            {/* ACTION */}
                            {!item.isLocked ? (
                              <div
                                className="
                              flex
                              shrink-0
                              items-center
                              gap-[33px]
                              pr-[25px]
                            "
                              >
                                <button
                                  type="button"
                                  onClick={handleView}
                                  className="
                                flex
                                items-center
                                justify-center
                                rounded-[4px]
                                border
                                border-[#FF805F]
                                bg-white
                                px-3
                                py-2
                                text-sm
                                font-medium
                                leading-none
                                text-[#555555]
                                transition-all
                                duration-200
                                hover:bg-[#FFF4EF]
                                hover:text-[#F26738]
                                active:scale-[0.97]
                              "
                                >
                                  View
                                </button>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                disabled
                                size="sm"
                                variant="outline"
                                className="
                              mr-[10px]
                              h-[26px]
                              rounded-[5px]
                              border-gray-200
                              bg-gray-50
                              px-[10px]
                              text-[10px]
                              text-gray-400
                            "
                              >
                                <Lock className="mr-1 h-3 w-3" />
                                Locked
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* =================================================
                    VIEW MORE / SHOW LESS
                ================================================== */}
                    {materials.length > 5 && (
                      <div className="border-t border-[#F1E7E2]">
                        <button
                          type="button"
                          onClick={() =>
                            toggleMaterials(section._id)
                          }
                          className="
                        flex
                        w-full
                        items-center
                        justify-center
                        gap-2
                        py-4
                        text-sm
                        font-semibold
                        text-[#F4511E]
                        transition-colors
                        hover:text-[#D93F0D]
                      "
                        >
                          {isMaterialsExpanded
                            ? "Show less"
                            : `View all ${materials.length} materials`}

                          <ChevronDown
                            className={`
                          h-4
                          w-4
                          transition-transform
                          duration-200
                          ${isMaterialsExpanded
                                ? "rotate-180"
                                : ""
                              }
                        `}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, Video } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Session {
  _id: string;
  title: string;
  type: "Sessions";
  scheduledStart: string;
  scheduledEnd: string;
  duration?: string;
  slug?: string;
  thumbnailPic?: string | null;
  isLocked?: boolean;
}

interface TodaySessionsBannerProps {
  sessions: Session[];
  onJoin?: (session: Session) => void;
  onCalendar?: (session: Session) => void;
}

export const TodaySessionsBanner: React.FC<TodaySessionsBannerProps> = ({
  sessions = [],
  onJoin,
  onCalendar,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const todaySessions = useMemo(() => {
    const today = new Date();

    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    return sessions
      .filter((session) => {
        if (!session?.scheduledStart) return false;

        const start = new Date(session.scheduledStart);

        return (
          start.getFullYear() === todayYear &&
          start.getMonth() === todayMonth &&
          start.getDate() === todayDate
        );
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledStart).getTime() -
          new Date(b.scheduledStart).getTime(),
      );
  }, [sessions, now]);

  useEffect(() => {
    if (currentIndex >= todaySessions.length) {
      setCurrentIndex(0);
    }
  }, [todaySessions.length, currentIndex]);

  useEffect(() => {
    if (todaySessions.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % todaySessions.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [todaySessions.length]);

  if (!todaySessions.length) {
    return null;
  }

  const session = todaySessions[currentIndex];

  const startTime = new Date(session.scheduledStart);
  const endTime = new Date(session.scheduledEnd);

  const startTimestamp = startTime.getTime();
  const endTimestamp = endTime.getTime();
  const nowTimestamp = now.getTime();

  const isUpcoming = nowTimestamp < startTimestamp;
  const isLive = nowTimestamp >= startTimestamp && nowTimestamp < endTimestamp;
  const isCompleted = nowTimestamp >= endTimestamp;

  const timerTarget = isUpcoming ? startTimestamp : endTimestamp;

  const remainingSeconds = Math.max(
    0,
    Math.floor((timerTarget - nowTimestamp) / 1000),
  );

  const days = Math.floor(remainingSeconds / 86400);

  const hours = Math.floor((remainingSeconds % 86400) / 3600);

  const minutes = Math.floor((remainingSeconds % 3600) / 60);

  const seconds = remainingSeconds % 60;

  const formatNumber = (value: number) => String(value).padStart(2, "0");

  /*
   * -------------------------------------------------------
   * FORMAT DATE
   * -------------------------------------------------------
   */

  const formattedDate = startTime.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  /*
   * -------------------------------------------------------
   * FORMAT TIME
   * -------------------------------------------------------
   */

  const formattedStartTime = startTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const formattedEndTime = endTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  /*
   * -------------------------------------------------------
   * NAVIGATION
   * -------------------------------------------------------
   */

  const goPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? todaySessions.length - 1 : prev - 1,
    );
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % todaySessions.length);
  };

  /*
   * -------------------------------------------------------
   * JOIN HANDLER
   * -------------------------------------------------------
   */

  const handleJoin = () => {
    if (session.isLocked) return;

    onJoin?.(session);
  };

  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-xl border border-[#F6DED2] bg-[#FFF7F1]">
        <div className="relative z-10 flex min-h-[255px] flex-col lg:flex-row">
          {/* ===================================================
              LEFT CONTENT
          =================================================== */}

          <div className="flex min-w-0 flex-1 flex-col justify-center px-6 py-6 sm:px-8 lg:px-10 lg:py-7">
            {/* Status */}
            <div className="mb-2">
              <span
                className={`
                  inline-flex
                  items-center
                  rounded-md
                  px-2.5
                  py-1
                  text-[11px]
                  font-semibold
                  uppercase
                  tracking-wide
                  ${isLive
                    ? "bg-[#FFE1D6] text-[#F4511E]"
                    : isCompleted
                      ? "bg-gray-100 text-gray-500"
                      : "bg-[#FFE7D8] text-[#F4511E]"
                  }
                `}
              >
                {isLive
                  ? "Live Now"
                  : isCompleted
                    ? "Session Completed"
                    : "Upcoming Session"}
              </span>
            </div>

            {/* Title */}
            <h2 className="max-w-[620px] text-2xl font-semibold leading-tight tracking-[-0.5px] text-[#171717] sm:text-3xl lg:text-[28px]">
              {session.title}
            </h2>

            {/* Subtitle */}
            <p className="mt-1 max-w-[600px] line-clamp-2 text-base text-[#333333] sm:text-[17px]">
              {session.description}
            </p>

            {/* Details */}
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[#333333]">
              {/* Date */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <CalendarDays
                    className="h-[18px] w-[18px] text-[#F4511E]"
                    strokeWidth={1.8}
                  />

                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock3
                    className="h-[18px] w-[18px] text-[#F4511E]"
                    strokeWidth={1.8}
                  />

                  <span>
                    {formattedStartTime} - {formattedEndTime}
                    {session.duration && (
                      <span className="ml-1">({session.duration})</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <button
                type="button"
                disabled={session.isLocked || isCompleted}
                onClick={handleJoin}
                className={`
                  inline-flex
                  h-[43px]
                  items-center
                  justify-center
                  gap-2
                  rounded-md
                  px-6
                  text-sm
                  font-semibold
                  text-white
                  transition-all
                  ${session.isLocked || isCompleted
                    ? "cursor-not-allowed bg-gray-300"
                    : "bg-[#F36E45] shadow-sm hover:bg-[#e85b35] hover:shadow-md active:scale-[0.98]"
                  }
                `}
              >
                <Video className="h-4 w-4" />

                {isLive ? "Join Class" : "Join Class"}
              </button>
            </div>
          </div>

          {/* ===================================================
              TIMER
          =================================================== */}

          <div className="flex items-center justify-center px-5 py-5 lg:w-[285px] lg:px-4">
            <div
              className="
                w-full
                max-w-[225px]
                rounded-xl
                border
                border-[#F5E1D8]
                bg-white/70
                px-5
                py-5
                text-center
                shadow-[0_2px_10px_rgba(0,0,0,0.02)]
                backdrop-blur-sm
              "
            >
              <p className="text-sm font-medium text-[#222222]">
                {isLive ? "Class is live" : "Class starts in"}
              </p>

              {/* Timer */}
              <div className="mt-2 flex items-center justify-center gap-1">
                {days > 0 && (
                  <>
                    <span className="text-[30px] font-semibold tracking-wide text-[#F36E45]">
                      {formatNumber(days)}
                    </span>

                    <span className="mx-1 text-[24px] text-[#F36E45]">:</span>
                  </>
                )}

                <span className="text-[30px] font-semibold tracking-wide text-[#F36E45]">
                  {formatNumber(hours)}
                </span>

                <span className="text-[24px] text-[#F36E45]">:</span>

                <span className="text-[30px] font-semibold tracking-wide text-[#F36E45]">
                  {formatNumber(minutes)}
                </span>

                <span className="text-[24px] text-[#F36E45]">:</span>

                <span className="text-[30px] font-semibold tracking-wide text-[#F36E45]">
                  {formatNumber(seconds)}
                </span>
              </div>

              {/* Timer Labels */}
              <div className="mt-1 flex justify-center gap-[17px] text-[10px] font-medium uppercase text-gray-500">
                {days > 0 && <span>Days</span>}
                <span>Hrs</span>
                <span>Mins</span>
                <span>Secs</span>
              </div>

              {isLive && (
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-[#F36E45]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#F36E45]" />
                  Session in progress
                </div>
              )}
            </div>
          </div>

          {/* ===================================================
              RIGHT IMAGE
          =================================================== */}

          <div className="relative hidden w-[34%] min-w-[300px] overflow-hidden lg:block">
            {/* Background */}

            <img
              src={
                "https://orientelectric.com/cdn/shop/files/study_desk_lamp.png?v=1728973392"
              }
              alt=""
              className="
                  absolute
                  inset-0
                  h-full
                  w-full
                  object-contain
                "
            />
          </div>
        </div>

        {todaySessions.length > 1 && (
          <>
            {/* Previous */}
            <button
              type="button"
              onClick={goPrevious}
              aria-label="Previous session"
              className="
                absolute
                left-1
                top-1/2
                z-20
                hidden
                h-9
                w-9
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                border
                border-[#F3D5C7]
                bg-white/90
                text-gray-600
                shadow-sm
                backdrop-blur
                transition-all
                hover:bg-white
                hover:text-[#F36E45]
                lg:flex
              "
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={goNext}
              aria-label="Next session"
              className="
                absolute
                right-1
                top-1/2
                z-20
                hidden
                h-9
                w-9
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                border
                border-[#F3D5C7]
                bg-white/90
                text-gray-600
                shadow-sm
                backdrop-blur
                transition-all
                hover:bg-white
                hover:text-[#F36E45]
                lg:flex
              "
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
              {todaySessions.map((item, index) => (
                <button
                  key={item._id}
                  type="button"
                  aria-label={`Go to session ${index + 1}`}
                  onClick={() => setCurrentIndex(index)}
                  className={`
                    h-1.5
                    rounded-full
                    transition-all
                    duration-300
                    ${index === currentIndex
                      ? "w-6 bg-[#F36E45]"
                      : "w-1.5 bg-[#E5B8A7] hover:bg-[#F36E45]"
                    }
                  `}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
