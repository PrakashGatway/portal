import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";

export default function ComingSoon() {
    return (
        <>
            <PageMeta
                title="Coming Soon | OoshasPrep"
                description="Something exciting is coming soon to OoshasPrep. Stay tuned for new features and updates."
            />

            <div className="relative min-h-screen overflow-hidden bg-gray-50 px-4 py-10 dark:bg-gray-950 sm:px-6 lg:px-8">
                

                <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center">
                    <div className="mx-auto w-full max-w-3xl text-center">

                        {/* Illustration */}
                        <div className="relative mx-auto mb-3 flex h-[220px] items-center justify-center">
                            <img
                                src="https://media.tenor.com/exjpMhe7gwkAAAAi/rushing-hurry.gif"
                                alt="Coming Soon"
                                className="relative rounded-full z-10 mx-auto h-auto max-h-[180px] object-contain"
                            />
                        </div>

                        {/* Heading */}
                        <div className="mx-auto max-w-3xl">
                            <p className="mx-auto max-w-3xl font-medium text-base leading-7 text-gray-700 dark:text-gray-400 sm:text-lg sm:leading-8">
                                We're working hard behind the scenes to bring you
                                an amazing new experience. Stay tuned — we'll be
                                ready for you soon!
                            </p>
                        </div>

                        {/* Main Actions */}
                        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link
                                to="/"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/25 sm:w-auto"
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                                Back to Home
                            </Link>

                            <Link
                                to="/support"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-white sm:w-auto"
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 2-3 4" />
                                    <path d="M12 18h.01" />
                                </svg>
                                Get Support
                            </Link>
                        </div>

                        {/* Quick Links */}
                        <div className="mt-6">
                            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                                Quick Access
                            </p>

                            <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
                                {/* Dashboard */}
                                <Link
                                    to="/"
                                    className="group rounded-2xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/30"
                                >
                                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-colors group-hover:bg-brand-500 group-hover:text-white dark:bg-gray-800 dark:text-gray-300">
                                        <svg
                                            width="19"
                                            height="19"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <rect x="3" y="3" width="7" height="7" />
                                            <rect x="14" y="3" width="7" height="7" />
                                            <rect x="3" y="14" width="7" height="7" />
                                            <rect x="14" y="14" width="7" height="7" />
                                        </svg>
                                    </div>

                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                        Dashboard
                                    </span>
                                </Link>

                                {/* Support */}
                                <Link
                                    to="/support"
                                    className="group rounded-2xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/30"
                                >
                                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-colors group-hover:bg-brand-500 group-hover:text-white dark:bg-gray-800 dark:text-gray-300">
                                        <svg
                                            width="19"
                                            height="19"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                                        </svg>
                                    </div>

                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                        Support
                                    </span>
                                </Link>
                                {/* Help */}
                                <Link
                                    to="https://www.ooshasprep.com/guide"
                                    className="group rounded-2xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/30"
                                >
                                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-colors group-hover:bg-brand-500 group-hover:text-white dark:bg-gray-800 dark:text-gray-300">
                                        <svg
                                            width="19"
                                            height="19"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 16v-4" />
                                            <path d="M12 8h.01" />
                                        </svg>
                                    </div>

                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                        Help Center
                                    </span>
                                </Link>
                            </div>
                        </div>

                        {/* Bottom Message */}
                        <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-800">
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                                Thank you for your patience. We can't wait to show
                                you what's next. 🚀
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}