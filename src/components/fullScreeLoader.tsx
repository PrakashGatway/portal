const Loader = () => {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="h-10 w-72 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-10 w-40 rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Main Card */}
      <div className="rounded-3xl border p-6 space-y-6">
        <div className="h-8 w-64 rounded-lg bg-gray-200 dark:bg-gray-700 mx-auto" />

        <div className="h-52 rounded-2xl bg-gray-200 dark:bg-gray-700" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>

        <div className="h-12 w-48 mx-auto rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
};

export { Loader };

const FullScreenLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75">
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Loading...</p>
      </div>
    </div>
  );
};

export default FullScreenLoader;


