"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Headphones,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  ShoppingBag,
  Ticket,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api from "../../axiosInstance";

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (value = 0) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
};

const formatNumber = (value = 0) => {
  return new Intl.NumberFormat("en-IN").format(Number(value) || 0);
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const formatDateTime = (date) => {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

const getInitials = (name = "User") => {
  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
};

const getMonthName = (month) => {
  if (!month) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(new Date(2026, month - 1, 1));
};

const getGrowthIcon = (value) => {
  if (value >= 0) return ArrowUpRight;
  return ArrowDownRight;
};

const getGrowthColor = (value) => {
  if (value > 0) {
    return "text-emerald-600 bg-emerald-50";
  }
  if (value < 0) {
    return "text-red-600 bg-red-50";
  }
  return "text-slate-500 bg-slate-100";
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /* =======================================================
     FETCH DASHBOARD
  ======================================================= */

  const fetchDashboard = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
        setError("");

        const response = await api.get("/admin/dashboard", {
          params: {
            days,
            refresh: showLoader,
          },
        });

        const result = response.data;

        if (!result.success) {
          throw new Error(result.message || "Unable to load dashboard");
        }

        setDashboard(result.data);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError(
          err?.message || "Something went wrong while loading dashboard",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [days],
  );

  useEffect(() => {
    fetchDashboard(true);
  }, [fetchDashboard]);

  /* =======================================================
     CHART DATA
  ======================================================= */

  const chartData = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    const users = dashboard.charts?.userGrowth || [];
    const purchases = dashboard.charts?.purchaseGrowth || [];
    const revenue = dashboard.charts?.revenue || [];

    const keys = new Set();

    users.forEach((item) => {
      keys.add(`${item._id.year}-${item._id.month}`);
    });

    purchases.forEach((item) => {
      keys.add(`${item._id.year}-${item._id.month}`);
    });

    revenue.forEach((item) => {
      keys.add(`${item._id.year}-${item._id.month}`);
    });

    return [...keys].sort().map((key) => {
      const [year, month] = key.split("-");

      const userItem = users.find(
        (item) =>
          item._id.year === Number(year) && item._id.month === Number(month),
      );

      const purchaseItem = purchases.find(
        (item) =>
          item._id.year === Number(year) && item._id.month === Number(month),
      );

      const revenueItem = revenue.find(
        (item) =>
          item._id.year === Number(year) && item._id.month === Number(month),
      );

      return {
        year: Number(year),
        month: Number(month),
        label: `${getMonthName(Number(month))} ${year}`,
        users: userItem?.count || 0,
        purchases: purchaseItem?.count || 0,
        revenue: revenueItem?.revenue || 0,
      };
    });
  }, [dashboard]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return <DashboardSkeleton />;
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error && !dashboard) {
    return (
      <div className="min-h-screen p-4">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Unable to load dashboard
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>
            <button
              onClick={() => fetchDashboard(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     SAFE DATA
  ======================================================= */

  const overview = dashboard?.overview || {};
  const stats = dashboard?.stats || {};
  const recent = dashboard?.recent || {};

  const revenueGrowth = overview.revenue?.growth || 0;
  const userGrowth = overview.users?.growth || 0;
  const purchaseGrowth = overview.purchases?.growth || 0;
  const leadGrowth = stats.leads?.growth || 0;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen text-slate-900">
      <div className="mx-auto max-w-[1600px] p-4">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
              <span>Admin</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-slate-900">Dashboard</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Good morning, Admin 👋
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Here's what's happening with your platform today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* PERIOD */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              {[7, 30, 90, 365].map((option) => (
                <button
                  key={option}
                  onClick={() => setDays(option)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4 ${
                    days === option
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {option === 365 ? "1Y" : `${option}D`}
                </button>
              ))}
            </div>

            {/* REFRESH */}
            <button
              onClick={() => fetchDashboard(false)}
              disabled={refreshing}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* =================================================
            REFRESH ERROR
        ================================================= */}

        {error && dashboard && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* =================================================
            KPI CARDS
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(overview.revenue?.total)}
            subtitle={`${formatCurrency(overview.revenue?.month)} this month`}
            growth={revenueGrowth}
            icon={Wallet}
            iconClass="bg-indigo-50 text-indigo-600"
          />
          <MetricCard
            title="Total Users"
            value={formatNumber(overview.users?.total)}
            subtitle={`+${formatNumber(overview.users?.period)} in ${days} days`}
            growth={userGrowth}
            icon={Users}
            iconClass="bg-blue-50 text-blue-600"
          />
          <MetricCard
            title="Course Purchases"
            value={formatNumber(overview.purchases?.total)}
            subtitle={`+${formatNumber(overview.purchases?.period)} in ${days} days`}
            growth={purchaseGrowth}
            icon={ShoppingBag}
            iconClass="bg-emerald-50 text-emerald-600"
          />
          <MetricCard
            title="Total Courses"
            value={formatNumber(overview.courses?.total)}
            subtitle={`${formatNumber(overview.courses?.published)} published`}
            icon={BookOpen}
            iconClass="bg-violet-50 text-violet-600"
          />
        </div>

        {/* =================================================
            SECONDARY STATS
        ================================================= */}

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <MiniStat
            label="Payments"
            value={stats.payments?.total}
            icon={CreditCard}
          />
          <MiniStat
            label="Successful"
            value={stats.payments?.successful}
            icon={CheckCircle2}
            positive
          />
          <MiniStat
            label="Pending"
            value={stats.payments?.pending}
            icon={Clock3}
            warning
          />
          <MiniStat
            label="Test Attempts"
            value={stats.tests?.totalAttempts}
            icon={Trophy}
          />
          <MiniStat
            label="Open Tickets"
            value={stats.support?.open}
            icon={Headphones}
            danger={stats.support?.open > 0}
          />
          <MiniStat label="Leads" value={stats.leads?.total} icon={UserPlus} />
        </div>

        {/* =================================================
            MAIN ANALYTICS
        ================================================= */}

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
          {/* REVENUE CHART */}
          <RevenueChart
            data={chartData}
            total={overview.revenue?.period}
            growth={revenueGrowth}
          />
          {/* PAYMENT OVERVIEW */}
          <PaymentOverview payments={stats.payments} />
        </div>

        {/* =================================================
            USER + PURCHASE ANALYTICS
        ================================================= */}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <UserGrowthChart
            data={chartData}
            total={overview.users?.period}
            growth={userGrowth}
          />
          <PurchaseChart
            data={chartData}
            total={overview.purchases?.period}
            growth={purchaseGrowth}
          />
        </div>

        {/* =================================================
            TEST + SUPPORT
        ================================================= */}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ActivityCard
            title="Learning Activity"
            icon={Activity}
            iconClass="bg-violet-50 text-violet-600"
          >
            <ActivityRow
              label="Total Test Attempts"
              value={stats.tests?.totalAttempts}
            />
            <ActivityRow
              label="IELTS Attempts"
              value={stats.tests?.ieltsAttempts}
            />
            <ActivityRow
              label="Active Courses"
              value={overview.courses?.published}
            />
          </ActivityCard>

          <ActivityCard
            title="Support Center"
            icon={Headphones}
            iconClass="bg-orange-50 text-orange-600"
          >
            <ActivityRow
              label="Open Tickets"
              value={stats.support?.open}
              danger={stats.support?.open > 0}
            />
            <ActivityRow label="Total Leads" value={stats.leads?.total} />
            <ActivityRow
              label="Lead Growth"
              value={`${leadGrowth}%`}
              positive={leadGrowth > 0}
            />
          </ActivityCard>

          <ActivityCard
            title="Notifications"
            icon={Bell}
            iconClass="bg-blue-50 text-blue-600"
          >
            <div className="flex items-center justify-between py-5">
              <div>
                <p className="text-sm text-slate-500">Total notifications</p>
                <p className="mt-1 text-3xl font-bold text-slate-950">
                  {formatNumber(stats.notifications?.total)}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <button className="flex w-full items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-slate-700 hover:text-slate-950">
              Manage notifications
              <ChevronRight className="h-4 w-4" />
            </button>
          </ActivityCard>
        </div>

        {/* =================================================
            RECENT ACTIVITY
        ================================================= */}

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <RecentUsers users={recent.users} />
          <RecentPayments payments={recent.payments} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <RecentPurchases purchases={recent.purchases} />
          <RecentSupport support={recent.support} />
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row">
          <span>Dashboard data updates from your latest activity.</span>
          <span>Showing last {days} days</span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({ title, value, subtitle, growth, icon: Icon, iconClass }) {
  const GrowthIcon = getGrowthIcon(growth);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
      <div className="">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="mt-1 flex flex-wrap items-end gap-3">
          <h3 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {value}
          </h3>
          {typeof growth === "number" && (
            <span
              className={`mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold ${getGrowthColor(growth)}`}
            >
              <GrowthIcon className="h-3.5 w-3.5" />
              {Math.abs(growth)}%
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({ label, value, icon: Icon, positive, warning, danger }) {
  let iconStyle = "bg-slate-50 text-slate-500";
  if (positive) iconStyle = "bg-emerald-50 text-emerald-600";
  if (warning) iconStyle = "bg-amber-50 text-amber-600";
  if (danger) iconStyle = "bg-red-50 text-red-600";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${iconStyle}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">
        {formatNumber(value)}
      </p>
    </div>
  );
}

/* =========================================================
   REVENUE CHART (Using Recharts)
========================================================= */

function RevenueChart({ data, total, growth }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>
            <span className="text-sm font-semibold text-slate-900">
              Revenue Overview
            </span>
          </div>
          <div className="mt-4 flex items-end gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              {formatCurrency(total)}
            </h2>
            <span
              className={`mb-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${getGrowthColor(growth)}`}
            >
              {growth >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {Math.abs(growth)}%
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Revenue generated during selected period
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="h-2 w-2 rounded-full bg-indigo-500" />
          Revenue
        </div>
      </div>

      <div className="mt-8 h-72">
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `₹${value / 1000}K`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                }}
                formatter={(value) => [formatCurrency(value), "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   USER GROWTH CHART (Using Recharts)
========================================================= */

function UserGrowthChart({ data, total, growth }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
      <SectionHeader
        icon={Users}
        iconClass="bg-blue-50 text-blue-600"
        title="User Growth"
        subtitle="Monthly registrations"
      />

      <div className="mt-5 flex items-end gap-3">
        <span className="text-2xl font-bold text-slate-950">
          {formatNumber(total)}
        </span>
        <span
          className={`mb-1 rounded-full px-2 py-1 text-xs font-semibold ${getGrowthColor(growth)}`}
        >
          {growth >= 0 ? "+" : ""}
          {growth}%
        </span>
      </div>

      <div className="mt-7 h-56">
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                }}
                formatter={(value) => [value, "Users"]}
              />
              <Bar
                dataKey="users"
                fill="#3b82f6"
                radius={[8, 8, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PURCHASE CHART (Using Recharts)
========================================================= */

function PurchaseChart({ data, total, growth }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
      <SectionHeader
        icon={ShoppingBag}
        iconClass="bg-emerald-50 text-emerald-600"
        title="Purchase Activity"
        subtitle="Monthly purchases"
      />

      <div className="mt-5 flex items-end gap-3">
        <span className="text-2xl font-bold text-slate-950">
          {formatNumber(total)}
        </span>
        <span
          className={`mb-1 rounded-full px-2 py-1 text-xs font-semibold ${getGrowthColor(growth)}`}
        >
          {growth >= 0 ? "+" : ""}
          {growth}%
        </span>
      </div>

      <div className="mt-7 h-56">
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                }}
                formatter={(value) => [value, "Purchases"]}
              />
              <Bar
                dataKey="purchases"
                fill="#10b981"
                radius={[8, 8, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PAYMENT OVERVIEW
========================================================= */

function PaymentOverview({ payments = {} }) {
  const total = payments.total || 0;
  const successful = payments.successful || 0;
  const pending = payments.pending || 0;
  const failed = payments.failed || 0;

  const getPercent = (value) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
      <SectionHeader
        icon={CreditCard}
        iconClass="bg-indigo-50 text-indigo-600"
        title="Payment Overview"
        subtitle="Transaction health"
      />

      <div className="mt-6 flex justify-center">
        <div
          className="relative flex h-44 w-44 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(
              #10b981 0% ${getPercent(successful)}%,
              #f59e0b ${getPercent(successful)}% ${getPercent(successful) + getPercent(pending)}%,
              #ef4444 ${getPercent(successful) + getPercent(pending)}% 100%
            )`,
          }}
        >
          <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white">
            <span className="text-3xl font-bold text-slate-950">
              {formatNumber(total)}
            </span>
            <span className="text-xs text-slate-400">transactions</span>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <PaymentStatus
          label="Successful"
          value={successful}
          percent={getPercent(successful)}
          dot="bg-emerald-500"
        />
        <PaymentStatus
          label="Pending"
          value={pending}
          percent={getPercent(pending)}
          dot="bg-amber-500"
        />
        <PaymentStatus
          label="Failed"
          value={failed}
          percent={getPercent(failed)}
          dot="bg-red-500"
        />
      </div>
    </div>
  );
}

/* =========================================================
   PAYMENT STATUS
========================================================= */

function PaymentStatus({ label, value, percent, dot }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-slate-900">{value}</span>
        <span className="w-9 text-right text-xs text-slate-400">
          {percent}%
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   ACTIVITY CARD
========================================================= */

function ActivityCard({ title, icon: Icon, iconClass, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-bold text-slate-900">{title}</h3>
      </div>
      <div className="mt-3 divide-y divide-slate-100">{children}</div>
    </div>
  );
}

/* =========================================================
   ACTIVITY ROW
========================================================= */

function ActivityRow({ label, value, positive, warning, danger }) {
  let valueClass = "text-slate-900";
  if (positive) valueClass = "text-emerald-600";
  if (warning) valueClass = "text-amber-600";
  if (danger) valueClass = "text-red-600";

  return (
    <div className="flex items-center justify-between py-3.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-bold ${valueClass}`}>
        {typeof value === "number" ? formatNumber(value) : (value ?? "-")}
      </span>
    </div>
  );
}

/* =========================================================
   RECENT USERS
========================================================= */

function RecentUsers({ users = [] }) {
  return (
    <RecentSection
      title="Recent Users"
      subtitle="Latest registrations"
      icon={Users}
      action="View all"
    >
      {users.length === 0 ? (
        <EmptyState text="No recent users found" />
      ) : (
        users.slice(0, 6).map((user) => (
          <div key={user._id} className="flex items-center gap-3 py-3">
            <Avatar name={user.name} image={user.avatar || user.profileImage} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {user.name || "Unnamed user"}
              </p>
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            </div>
            <div className="hidden text-right sm:block">
              <RoleBadge role={user.role} />
              <p className="mt-1 text-[10px] text-slate-400">
                {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        ))
      )}
    </RecentSection>
  );
}

/* =========================================================
   RECENT PAYMENTS
========================================================= */

function RecentPayments({ payments = [] }) {
  return (
    <RecentSection
      title="Recent Payments"
      subtitle="Latest transactions"
      icon={CreditCard}
      action="View all"
    >
      {payments.length === 0 ? (
        <EmptyState text="No recent payments found" />
      ) : (
        payments.slice(0, 6).map((payment) => (
          <div key={payment._id} className="flex items-center gap-3 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50">
              {payment.status === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : payment.status === "pending" ? (
                <Clock3 className="h-5 w-5 text-amber-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {payment.user?.name || "Unknown user"}
              </p>
              <p className="truncate text-xs text-slate-400">
                {formatDateTime(payment.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">
                {formatCurrency(payment.amount)}
              </p>
              <PaymentBadge status={payment.status} />
            </div>
          </div>
        ))
      )}
    </RecentSection>
  );
}

/* =========================================================
   RECENT PURCHASES
========================================================= */

function RecentPurchases({ purchases = [] }) {
  return (
    <RecentSection
      title="Recent Purchases"
      subtitle="Latest enrollments"
      icon={ShoppingBag}
      action="View all"
    >
      {purchases.length === 0 ? (
        <EmptyState text="No recent purchases found" />
      ) : (
        purchases.slice(0, 6).map((purchase) => (
          <div key={purchase._id} className="flex items-center gap-3 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <ShoppingBag className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {purchase.user?.name || "Unknown user"}
              </p>
              <p className="truncate text-xs text-slate-400">
                {purchase.itemType || "Purchase"}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
                  purchase.isActive
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {purchase.isActive ? "Active" : "Inactive"}
              </span>
              <p className="mt-1 text-[10px] text-slate-400">
                {formatDate(purchase.createdAt)}
              </p>
            </div>
          </div>
        ))
      )}
    </RecentSection>
  );
}

/* =========================================================
   RECENT SUPPORT
========================================================= */

function RecentSupport({ support = [] }) {
  return (
    <RecentSection
      title="Support Tickets"
      subtitle="Latest customer issues"
      icon={Headphones}
      action="View all"
    >
      {support.length === 0 ? (
        <EmptyState text="No support tickets found" />
      ) : (
        support.slice(0, 6).map((ticket) => (
          <div key={ticket._id} className="flex items-center gap-3 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
              <Ticket className="h-5 w-5 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {ticket.subject || "Support request"}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] text-slate-400">
                  {ticket.ticketId}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[10px] capitalize text-slate-400">
                  {ticket.category}
                </span>
              </div>
            </div>
            <div className="text-right">
              <SupportBadge status={ticket.status} />
              <p className="mt-1 text-[10px] text-slate-400">
                {formatDate(ticket.createdAt)}
              </p>
            </div>
          </div>
        ))
      )}
    </RecentSection>
  );
}

/* =========================================================
   RECENT SECTION
========================================================= */

function RecentSection({ title, subtitle, icon: Icon, action, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
            <Icon className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-slate-900">
          {action}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({ icon: Icon, iconClass, title, subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

/* =========================================================
   AVATAR
========================================================= */

function Avatar({ name, image }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name || "User"}
        className="h-10 w-10 shrink-0 rounded-xl object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
      {getInitials(name)}
    </div>
  );
}

/* =========================================================
   ROLE BADGE
========================================================= */

function RoleBadge({ role }) {
  const styles = {
    admin: "bg-violet-50 text-violet-600",
    teacher: "bg-blue-50 text-blue-600",
    user: "bg-slate-100 text-slate-500",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${
        styles[role] || "bg-slate-100 text-slate-500"
      }`}
    >
      {role || "user"}
    </span>
  );
}

/* =========================================================
   PAYMENT BADGE
========================================================= */

function PaymentBadge({ status }) {
  const styles = {
    success: "bg-emerald-50 text-emerald-600",
    successful: "bg-emerald-50 text-emerald-600",
    completed: "bg-emerald-50 text-emerald-600",
    pending: "bg-amber-50 text-amber-600",
    failed: "bg-red-50 text-red-600",
  };

  return (
    <span
      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold capitalize ${
        styles[status] || "bg-slate-100 text-slate-500"
      }`}
    >
      {status || "unknown"}
    </span>
  );
}

/* =========================================================
   SUPPORT BADGE
========================================================= */

function SupportBadge({ status }) {
  const styles = {
    open: "bg-red-50 text-red-600",
    pending: "bg-amber-50 text-amber-600",
    resolved: "bg-emerald-50 text-emerald-600",
    closed: "bg-slate-100 text-slate-500",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${
        styles[status] || "bg-slate-100 text-slate-500"
      }`}
    >
      {status || "unknown"}
    </span>
  );
}

/* =========================================================
   EMPTY CHART
========================================================= */

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
      <div className="text-center">
        <BarChart3 className="mx-auto h-7 w-7 text-slate-300" />
        <p className="mt-2 text-xs font-medium text-slate-400">
          No chart data available
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({ text }) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
        <Activity className="h-5 w-5 text-slate-300" />
      </div>
      <p className="mt-2 text-xs text-slate-400">{text}</p>
    </div>
  );
}

/* =========================================================
   DASHBOARD SKELETON
========================================================= */

function DashboardSkeleton() {
  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-7 flex items-center justify-between">
          <div>
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-8 w-72 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-slate-200" />
          </div>
          <div className="hidden h-10 w-40 animate-pulse rounded-xl bg-slate-200 sm:block" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-2xl bg-white"
            />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.65fr_0.85fr]">
          <div className="h-[430px] animate-pulse rounded-2xl bg-white" />
          <div className="h-[430px] animate-pulse rounded-2xl bg-white" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl bg-white" />
          <div className="h-80 animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    </div>
  );
}
