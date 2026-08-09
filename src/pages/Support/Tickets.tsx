import {
  Ticket,
  Clock3,
  Send,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  CalendarDays,
  ChevronDown,
  RotateCcw,
  Eye,
  MoreVertical,
  Minus,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Headphones,
} from "lucide-react";
import { useState } from "react";

const ticketStats = [
  {
    title: "Total Tickets",
    value: "24",
    subtitle: "All time",
    icon: Ticket,
    iconBg: "bg-[#FFF0EA]",
    iconColor: "text-[#F26738]",
  },
  {
    title: "Open",
    value: "6",
    subtitle: "Need your response",
    icon: Clock3,
    iconBg: "bg-[#FFF7E5]",
    iconColor: "text-[#F5B51B]",
  },
  {
    title: "In Progress",
    value: "8",
    subtitle: "Being resolved",
    icon: Send,
    iconBg: "bg-[#EDF4FF]",
    iconColor: "text-[#3478E5]",
  },
  {
    title: "Resolved",
    value: "9",
    subtitle: "Successfully closed",
    icon: CheckCircle2,
    iconBg: "bg-[#EAFBF4]",
    iconColor: "text-[#19A96B]",
  },
  {
    title: "Closed",
    value: "1",
    subtitle: "All closed tickets",
    icon: XCircle,
    iconBg: "bg-[#F1F2F5]",
    iconColor: "text-[#69717D]",
  },
];

export default function SupportTickets() {
      const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");




  const tickets = [
  {
    id: "#TKT-2458",
    created: "Created on May 20, 2024",
    subject: "Unable to access mock test",
    description: "I am unable to start my mock test. It shows...",
    category: "Mock Test",
    status: "Open",
    priority: "High",
    updatedDate: "May 20, 2024",
    updatedTime: "10:30 AM",
  },
  {
    id: "#TKT-2457",
    created: "Created on May 19, 2024",
    subject: "Payment failed but amount deducted",
    description: "I tried to purchase a course but payment...",
    category: "Payments",
    status: "In Progress",
    priority: "Medium",
    updatedDate: "May 20, 2024",
    updatedTime: "09:15 AM",
  },
  {
    id: "#TKT-2456",
    created: "Created on May 18, 2024",
    subject: "Course content not loading",
    description: "Videos are not loading in the course...",
    category: "Technical",
    status: "In Progress",
    priority: "Medium",
    updatedDate: "May 19, 2024",
    updatedTime: "07:45 PM",
  },
  {
    id: "#TKT-2455",
    created: "Created on May 17, 2024",
    subject: "Refund request for course",
    description: "I would like to request a refund for the...",
    category: "Refunds",
    status: "Resolved",
    priority: "Low",
    updatedDate: "May 18, 2024",
    updatedTime: "04:30 PM",
  },
  {
    id: "#TKT-2454",
    created: "Created on May 15, 2024",
    subject: "How to enroll in a batch?",
    description: "I need help understand how to enroll...",
    category: "Courses & Enrollment",
    status: "Closed",
    priority: "Low",
    updatedDate: "May 16, 2024",
    updatedTime: "11:20 AM",
  },
];

const statusStyles = {
  Open: "bg-[#FFF0E9] text-[#F26738]",
  "In Progress": "bg-[#EDF4FF] text-[#2874D8]",
  Resolved: "bg-[#EAFBF3] text-[#16A66A]",
  Closed: "bg-[#F0F1F4] text-[#59616D]",
};

const priorityStyles = {
  High: {
    text: "text-[#4A4A4A]",
    icon: "text-[#F15B5B]",
  },
  Medium: {
    text: "text-[#4A4A4A]",
    icon: "text-[#E9B52C]",
  },
  Low: {
    text: "text-[#4A4A4A]",
    icon: "text-[#42B88A]",
  },
};


  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      status === "All" || ticket.status === status;

    const matchesCategory =
      category === "All" || ticket.category === category;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  
  return (
    <>
    <section className="w-full  px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px]">

        {/* ================= HEADER ================= */}
        <div
          className="
            mb-5
            flex flex-col gap-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          {/* Heading */}
          <div>
            <h2
              className="
                text-[21px]
                font-bold
                leading-7
                tracking-[-0.4px]
                text-[#171717]
                sm:text-[22px]
              "
            >
              My Support Tickets
            </h2>

            <p
              className="
                mt-1
                text-[12px]
                leading-5
                text-[#777777]
                sm:text-[13px]
              "
            >
              Track and manage all your support requests in one place.
            </p>
          </div>

          {/* Create Ticket */}
          <button
            type="button"
            className="
              group
              flex
              h-[38px]
              w-full
              items-center
              justify-center
              gap-2
              rounded-[8px]
              bg-[#F45B2A]
              px-5
              text-[12px]
              font-semibold
              text-white
              shadow-[0_4px_10px_rgba(244,91,42,0.16)]
              transition-all
              duration-300
              hover:bg-[#E94F20]
              hover:shadow-[0_6px_16px_rgba(244,91,42,0.22)]
              sm:w-auto
            "
          >
            <Plus
              size={17}
              strokeWidth={2}
              className="
                transition-transform
                duration-300
                group-hover:rotate-90
              "
            />

            <span>Create New Ticket</span>
          </button>
        </div>

        {/* ================= TICKET CARDS ================= */}
        <div
          className="
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-5
          "
        >
          {ticketStats.map((ticket) => {
            const Icon = ticket.icon;

            return (
              <div
                key={ticket.title}
                className="
                  group
                  min-h-[120px]
                  rounded-[10px]
                  border
                  border-[#E8E7E5]
                  bg-white
                  px-4
                  py-5
                  shadow-[0_1px_3px_rgba(0,0,0,0.02)]
                  transition-all
                  duration-300
                  hover:-translate-y-0.5
                  hover:border-[#E2DED9]
                  hover:shadow-[0_7px_20px_rgba(0,0,0,0.05)]
                  sm:px-5
                "
              >
                <div className="flex items-center gap-4">

                  {/* Icon */}
                  <div
                    className={`
                      flex
                      h-[50px]
                      w-[50px]
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      ${ticket.iconBg}
                      transition-transform
                      duration-300
                      group-hover:scale-105
                    `}
                  >
                    <Icon
                      size={23}
                      strokeWidth={2}
                      className={ticket.iconColor}
                    />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p
                      className="
                        truncate
                        text-[12px]
                        font-medium
                        leading-5
                        text-[#4C4C4C]
                      "
                    >
                      {ticket.title}
                    </p>

                    <p
                      className="
                        mt-[-1px]
                        text-[21px]
                        font-bold
                        leading-7
                        tracking-[-0.4px]
                        text-[#20242A]
                      "
                    >
                      {ticket.value}
                    </p>
                  </div>
                </div>

                {/* Subtitle */}
                <div className="mt-3 pl-[66px]">
                  <p
                    className="
                      flex
                      items-center
                      gap-1.5
                      whitespace-nowrap
                      text-[11px]
                      leading-4
                      text-[#777B82]
                    "
                  >
                    {ticket.title === "Total Tickets" && (
                      <span className="inline-flex items-center">
                        <Clock3
                          size={11}
                          strokeWidth={2}
                          className="text-[#777B82]"
                        />
                      </span>
                    )}

                    {ticket.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>

        <section className="w-full  px-3 py-5 sm:px-5 lg:px-7">
      <div className="mx-auto w-full max-w-[1400px]">

        {/* ================= MAIN CONTAINER ================= */}
        <div className="overflow-hidden rounded-[10px] border border-[#E8E7E5] bg-white">

          {/* ================= FILTER BAR ================= */}
          <div
            className="
              flex flex-col gap-3
              border-b border-[#EDEBE9]
              p-3
              sm:p-4
              lg:flex-row lg:items-center
            "
          >
            {/* Search */}
            <div className="relative w-full lg:max-w-[373px]">
              <Search
                size={17}
                strokeWidth={1.8}
                className="
                  absolute left-3 top-1/2
                  -translate-y-1/2
                  text-[#747B84]
                "
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets by subject or ID..."
                className="
                  h-[38px]
                  w-full
                  rounded-[7px]
                  border border-[#DFE1E4]
                  bg-white
                  pl-10 pr-3
                  text-[11px]
                  text-[#333333]
                  outline-none
                  placeholder:text-[#8A8F96]
                  focus:border-[#F45B2A]
                  focus:ring-2
                  focus:ring-[#F45B2A]/10
                "
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row lg:ml-auto">

              {/* Status */}
            <div className="w-full sm:w-[150px]">
  <select
    value={status}
    onChange={(e) => setStatus(e.target.value)}
    className="
      h-[38px]
      w-full
      rounded-[7px]
      border border-[#DFE1E4]
      bg-white
      px-3
      text-[11px]
      text-[#333333]
      outline-none
      focus:border-[#F45B2A]
      focus:ring-1
      focus:ring-[#F45B2A]/20
    "
  >
    <option value="All">Status: All</option>
    <option value="Open">Status: Open</option>
    <option value="In Progress">Status: In Progress</option>
    <option value="Resolved">Status: Resolved</option>
    <option value="Closed">Status: Closed</option>
  </select>
</div>

              {/* Category */}
            <div className="w-full sm:w-[180px]">
  <select
    value={category}
    onChange={(e) => setCategory(e.target.value)}
    className="
      h-[38px]
      w-full
      rounded-[7px]
      border border-[#DFE1E4]
      bg-white
      px-3
      text-[11px]
      text-[#333333]
      outline-none
      focus:border-[#F45B2A]
      focus:ring-1
      focus:ring-[#F45B2A]/20
    "
  >
    <option value="All">Category: All</option>
    <option value="Mock Test">Category: Mock Test</option>
    <option value="Payments">Category: Payments</option>
    <option value="Technical">Category: Technical</option>
    <option value="Refunds">Category: Refunds</option>
    <option value="Courses & Enrollment">
      Category: Courses & Enrollment
    </option>
  </select>
</div>

              {/* Date */}
              <button
                type="button"
                className="
                  flex h-[38px]
                  w-full sm:w-[198px]
                  items-center
                  justify-between
                  rounded-[7px]
                  border border-[#DFE1E4]
                  bg-white
                  px-3
                  text-[11px]
                  text-[#333333]
                  transition
                  hover:border-[#D4D6D9]
                "
              >
                <span className="flex items-center gap-2">
                  <CalendarDays
                    size={14}
                    strokeWidth={1.8}
                    className="text-[#69717A]"
                  />
                  <span>
                    <span className="font-medium">Date:</span>{" "}
                    Newest First
                  </span>
                </span>

                <ChevronDown
                  size={14}
                  className="text-[#69717A]"
                />
              </button>

              {/* Clear */}
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatus("All");
                  setCategory("All");
                }}
                className="
                  flex h-[38px]
                  shrink-0
                  items-center
                  justify-center
                  gap-1.5
                  px-2
                  text-[11px]
                  font-medium
                  text-[#F26738]
                  transition
                  hover:text-[#D94F20]
                "
              >
                <RotateCcw
                  size={14}
                  strokeWidth={1.8}
                />
                Clear
              </button>
            </div>
          </div>

          {/* ================= DESKTOP TABLE ================= */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1000px] border-collapse">
              <thead>
                <tr className="border-b border-[#ECEAE8] bg-[#FCFCFC]">
                  <TableHead>TICKET ID</TableHead>
                  <TableHead>SUBJECT</TableHead>
                  <TableHead>CATEGORY</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>PRIORITY</TableHead>
                  <TableHead>LAST UPDATED</TableHead>
                  <TableHead className="text-center">
                    ACTIONS
                  </TableHead>
                </tr>
              </thead>

              <tbody>
                {filteredTickets.map((ticket) => (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* ================= MOBILE / TABLET CARDS ================= */}
          <div className="divide-y divide-[#ECEAE8] lg:hidden">
            {filteredTickets.map((ticket) => (
              <TicketMobileCard
                key={ticket.id}
                ticket={ticket}
              />
            ))}
          </div>

          {/* ================= FOOTER ================= */}
          <div
            className="
              flex flex-col gap-4
              border-t border-[#ECEAE8]
              px-4 py-3
              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:px-5
            "
          >
            <p className="text-[11px] text-[#747982]">
              Showing 1 to 5 of 24 tickets
            </p>

            <div className="flex items-center justify-between gap-2 sm:justify-end">

              {/* Previous */}
              <PaginationButton>
                <ChevronLeft size={15} />
              </PaginationButton>

              {/* Active */}
              <PaginationButton active>
                1
              </PaginationButton>

              <PaginationButton>2</PaginationButton>
              <PaginationButton>3</PaginationButton>

              <span className="px-1 text-[11px] text-[#777D84]">
                ...
              </span>

              <PaginationButton>5</PaginationButton>

              {/* Next */}
              <PaginationButton>
                <ChevronRight size={15} />
              </PaginationButton>

              {/* Per page */}
              <button
                type="button"
                className="
                  ml-1
                  flex h-[32px]
                  items-center
                  gap-2
                  rounded-[7px]
                  border border-[#DFE1E4]
                  bg-white
                  px-3
                  text-[11px]
                  text-[#4D535A]
                "
              >
                10 / page
                <ChevronDown size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>


        <section className="w-full px-3 py-5 sm:px-5 lg:px-7">
      <div
        className="
          relative
          mx-auto
          flex
          w-full
          max-w-[1400px]
          flex-col
          overflow-hidden
          rounded-[12px]
          border
          border-[#F3E5DE]
          bg-gradient-to-r
          from-[#FFF5F0]
          via-[#FFF9F7]
          to-[#FFF5F1]
          px-5
          py-5
          sm:px-7
          md:flex-row
          md:items-center
          md:justify-between
          lg:px-10
          lg:py-4
        "
      >
        {/* Decorative circles */}
        <div
          className="
            pointer-events-none
            absolute
            -left-7
            top-1/2
            h-[95px]
            w-[95px]
            -translate-y-1/2
            rounded-full
            border
            border-[#F5D8CC]
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -left-1
            top-1/2
            h-[70px]
            w-[70px]
            -translate-y-1/2
            rounded-full
            border
            border-[#F2CFC2]
          "
        />

        {/* Left Content */}
        <div className="relative z-10 flex items-center gap-5 sm:gap-7">
          {/* Headphone / Chat Icon */}
          <div
            className="
              relative
              flex
              h-[65px]
              w-[65px]
              shrink-0
              items-center
              justify-center
              sm:h-[72px]
              sm:w-[72px]
            "
          >
            <Headphones
              size={58}
              strokeWidth={1.5}
              className="text-[#292929]"
            />

            {/* Orange ear pieces */}
            <span
              className="
                absolute
                left-[7px]
                top-[30px]
                h-[17px]
                w-[7px]
                rounded-full
                bg-[#F36A3D]
              "
            />

            <span
              className="
                absolute
                right-[7px]
                top-[30px]
                h-[17px]
                w-[7px]
                rounded-full
                bg-[#F36A3D]
              "
            />

            {/* Chat bubble */}
            <div
              className="
                absolute
                left-1/2
                top-1/2
                flex
                h-[28px]
                w-[36px]
                -translate-x-1/2
                -translate-y-1/2
                items-center
                justify-center
                rounded-[7px]
                bg-[#F36A3D]
                shadow-[0_3px_8px_rgba(243,106,61,0.18)]
              "
            >
              <MessageSquare
                size={17}
                strokeWidth={2.2}
                className="fill-white text-white"
              />

              {/* dots */}
              <div
                className="
                  absolute
                  left-1/2
                  top-1/2
                  flex
                  -translate-x-1/2
                  -translate-y-1/2
                  gap-[2px]
                "
              >
                <span className="h-[3px] w-[3px] rounded-full bg-[#F36A3D]" />
                <span className="h-[3px] w-[3px] rounded-full bg-[#F36A3D]" />
                <span className="h-[3px] w-[3px] rounded-full bg-[#F36A3D]" />
              </div>
            </div>
          </div>

          {/* Text */}
          <div>
            <h2
              className="
                text-[15px]
                font-bold
                leading-5
                tracking-[-0.2px]
                text-[#282828]
                sm:text-[16px]
              "
            >
              Need more help?
            </h2>

            <p
              className="
                mt-1
                text-[11px]
                leading-5
                text-[#777777]
                sm:text-[12px]
              "
            >
              Can’t find what you’re looking for? Our support team is here for
              you.
            </p>
          </div>
        </div>

        {/* Button */}
        <button
          type="button"
          className="
            group
            relative
            z-10
            mt-5
            flex
            h-[36px]
            w-full
            items-center
            justify-center
            gap-3
            rounded-[7px]
            border
            border-[#F0835F]
            bg-white/60
            px-5
            text-[11px]
            font-semibold
            text-[#E9673D]
            transition-all
            duration-300
            hover:bg-[#FFF0E9]
            hover:shadow-[0_4px_12px_rgba(233,103,61,0.12)]
            md:mt-0
            md:w-auto
            md:min-w-[199px]
          "
        >
          <span>Contact Support Team</span>

          <ArrowUpRight
            size={16}
            strokeWidth={1.8}
            className="
              transition-transform
              duration-300
              group-hover:translate-x-0.5
              group-hover:-translate-y-0.5
            "
          />
        </button>
      </div>
    </section>

    </>

    
  );
}


function TableHead({ children, className = "" }) {
  return (
    <th
      className={`
        px-4 py-3
        text-left
        text-[10px]
        font-semibold
        text-[#72777D]
        ${className}
      `}
    >
      {children}
    </th>
  );
}

/* ============================================================
   TABLE ROW
============================================================ */

function TicketRow({ ticket }) {
    const priorityStyles = {
  High: {
    text: "text-[#4A4A4A]",
    icon: "text-[#F15B5B]",
  },
  Medium: {
    text: "text-[#4A4A4A]",
    icon: "text-[#E9B52C]",
  },
  Low: {
    text: "text-[#4A4A4A]",
    icon: "text-[#42B88A]",
  },
};

const statusStyles = {
  Open: "bg-[#FFF0E9] text-[#F26738]",
  "In Progress": "bg-[#EDF4FF] text-[#2874D8]",
  Resolved: "bg-[#EAFBF3] text-[#16A66A]",
  Closed: "bg-[#F0F1F4] text-[#59616D]",
};
  const priority = priorityStyles[ticket.priority];

  return (
    <tr className="border-b border-[#ECEAE8] transition hover:bg-[#FFFCFA]">

      {/* Ticket ID */}
      <td className="px-4 py-4">
        <p className="text-[11px] font-bold text-[#25292E]">
          {ticket.id}
        </p>

        <p className="mt-1 whitespace-nowrap text-[10px] text-[#858A91]">
          {ticket.created}
        </p>
      </td>

      {/* Subject */}
      <td className="max-w-[245px] px-4 py-4">
        <p className="truncate text-[11px] font-semibold text-[#30343A]">
          {ticket.subject}
        </p>

        <p className="mt-1 truncate text-[10px] text-[#777D84]">
          {ticket.description}
        </p>
      </td>

      {/* Category */}
      <td className="px-4 py-4 text-[11px] text-[#676D74]">
        {ticket.category}
      </td>

      {/* Status */}
      <td className="px-4 py-4">
        <span
          className={`
            inline-flex
            items-center
            gap-1.5
            rounded-[5px]
            px-2
            py-1
            text-[10px]
            font-medium
            ${statusStyles[ticket.status]}
          `}
        >
          <span className="h-[4px] w-[4px] rounded-full bg-current" />
          {ticket.status}
        </span>
      </td>

      {/* Priority */}
      <td className="px-4 py-4">
        <span
          className={`
            flex
            items-center
            gap-2
            text-[11px]
            ${priority.text}
          `}
        >
          {ticket.priority === "High" ? (
            <ArrowUpRight
              size={15}
              strokeWidth={2}
              className={priority.icon}
            />
          ) : (
            <Minus
              size={16}
              strokeWidth={2.5}
              className={priority.icon}
            />
          )}

          {ticket.priority}
        </span>
      </td>

      {/* Last Updated */}
      <td className="px-4 py-4">
        <p className="whitespace-nowrap text-[11px] font-semibold text-[#30343A]">
          {ticket.updatedDate}
        </p>

        <p className="mt-1 text-[10px] text-[#777D84]">
          {ticket.updatedTime}
        </p>
      </td>

      {/* Actions */}
      <td className="px-4 py-4">
        <div className="flex items-center justify-center gap-2">
          <ActionButton>
            <Eye size={15} strokeWidth={1.8} />
          </ActionButton>

          <ActionButton>
            <MoreVertical size={15} strokeWidth={1.8} />
          </ActionButton>
        </div>
      </td>
    </tr>
  );
}

/* ============================================================
   MOBILE CARD
============================================================ */

function TicketMobileCard({ ticket }) {

    const priorityStyles = {
  High: {
    text: "text-[#4A4A4A]",
    icon: "text-[#F15B5B]",
  },
  Medium: {
    text: "text-[#4A4A4A]",
    icon: "text-[#E9B52C]",
  },
  Low: {
    text: "text-[#4A4A4A]",
    icon: "text-[#42B88A]",
  },
};

const statusStyles = {
  Open: "bg-[#FFF0E9] text-[#F26738]",
  "In Progress": "bg-[#EDF4FF] text-[#2874D8]",
  Resolved: "bg-[#EAFBF3] text-[#16A66A]",
  Closed: "bg-[#F0F1F4] text-[#59616D]",
};
  const priority = priorityStyles[ticket.priority];

  return (
    <div className="p-4">

      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-[#25292E]">
            {ticket.id}
          </p>

          <p className="mt-1 text-[10px] text-[#858A91]">
            {ticket.created}
          </p>
        </div>

        <span
          className={`
            inline-flex
            items-center
            gap-1.5
            rounded-[5px]
            px-2 py-1
            text-[10px]
            font-medium
            ${statusStyles[ticket.status]}
          `}
        >
          <span className="h-[4px] w-[4px] rounded-full bg-current" />
          {ticket.status}
        </span>
      </div>

      {/* Subject */}
      <div className="mt-4">
        <p className="text-[12px] font-semibold text-[#30343A]">
          {ticket.subject}
        </p>

        <p className="mt-1 text-[10px] leading-5 text-[#777D84]">
          {ticket.description}
        </p>
      </div>

      {/* Details */}
      <div className="mt-4 grid grid-cols-2 gap-4">

        <div>
          <p className="text-[9px] font-medium uppercase text-[#999EA4]">
            Category
          </p>

          <p className="mt-1 text-[11px] text-[#676D74]">
            {ticket.category}
          </p>
        </div>

        <div>
          <p className="text-[9px] font-medium uppercase text-[#999EA4]">
            Priority
          </p>

          <span
            className={`
              mt-1 flex items-center gap-2
              text-[11px]
              ${priority.text}
            `}
          >
            {ticket.priority === "High" ? (
              <ArrowUpRight
                size={14}
                className={priority.icon}
              />
            ) : (
              <Minus
                size={15}
                className={priority.icon}
              />
            )}

            {ticket.priority}
          </span>
        </div>

        <div>
          <p className="text-[9px] font-medium uppercase text-[#999EA4]">
            Last Updated
          </p>

          <p className="mt-1 text-[11px] font-medium text-[#30343A]">
            {ticket.updatedDate}
          </p>

          <p className="text-[10px] text-[#777D84]">
            {ticket.updatedTime}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex justify-end gap-2">
        <ActionButton>
          <Eye size={15} />
        </ActionButton>

        <ActionButton>
          <MoreVertical size={15} />
        </ActionButton>
      </div>
    </div>
  );
}



/* ============================================================
   ACTION BUTTON
============================================================ */

function ActionButton({ children }) {
  return (
    <button
      type="button"
      className="
        flex h-[32px] w-[32px]
        items-center justify-center
        rounded-[7px]
        border border-[#E1E3E5]
        bg-white
        text-[#69717A]
        transition-all duration-200
        hover:border-[#F45B2A]
        hover:bg-[#FFF7F3]
        hover:text-[#F45B2A]
      "
    >
      {children}
    </button>
  );
}

/* ============================================================
   PAGINATION BUTTON
============================================================ */

function PaginationButton({
  children,
  active = false,
}) {
  return (
    <button
      type="button"
      className={`
        flex h-[32px] min-w-[32px]
        items-center justify-center
        rounded-[7px]
        border
        text-[11px]
        transition-all
        ${
          active
            ? "border-[#F45B2A] bg-[#FFF7F3] text-[#F26738]"
            : "border-[#E1E3E5] bg-white text-[#59616A] hover:border-[#F45B2A] hover:text-[#F26738]"
        }
      `}
    >
      {children}
    </button>
  );
}