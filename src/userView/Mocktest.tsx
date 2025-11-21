import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import api from "../axiosInstance";

const MockTest = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("reading");
  const [mockTests, setMockTests] = useState({
    reading: [],
    writing: [],
    speaking: [],
    listening: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const testTypes = [
    { id: "reading", name: "Reading", emoji: "📖", color: "blue" },
    { id: "writing", name: "Writing", emoji: "✍️", color: "green" },
    { id: "speaking", name: "Speaking", emoji: "🎤", color: "purple" },
    { id: "listening", name: "Listening", emoji: "👂", color: "orange" }
  ];

  // Fetch test series from API
  useEffect(() => {
    const fetchTestSeries = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Starting API call...");
        const response = await api.get("/test/series?page=1&limit=10");

        console.log("Full API Response:", response.data);

        if (response.data && response.data.success) {
          console.log("API Success - Transforming data...");
          // Transform API data to match our structure
          const transformedData = transformApiData(response.data.data);
          console.log("Transformed Data:", transformedData);
          setMockTests(transformedData);
        } else {
          console.log("API returned success: false");
          setError("Failed to fetch test series - API returned error");
          setMockTests(getFallbackData());
        }
      } catch (err) {
        console.error("API Error:", err);
        setError(err.response?.data?.message || err.message || "Failed to fetch test series");
        // Fallback to mock data if API fails
        setMockTests(getFallbackData());
      } finally {
        setLoading(false);
      }
    };

    fetchTestSeries();
  }, []);

  // Transform API data to match our component structure
  const transformApiData = (apiData) => {
    console.log("Raw API Data for transformation:", apiData);
    
    const transformed = {
      reading: [],
      writing: [],
      speaking: [],
      listening: []
    };

    if (!apiData || !Array.isArray(apiData)) {
      console.log("API data is not an array");
      
    }

    apiData.forEach((test, index) => {
      console.log(`Processing test ${index}:`, test);
      
      // Extract section information to determine test type
      let testType = "reading"; // Default to reading
      
      if (test.sections && test.sections.length > 0) {
        const sectionName = test.sections[0]?.sectionDetails?.name || "";
        if (sectionName.includes('READING')) testType = "reading";
        else if (sectionName.includes('WRITING')) testType = "writing";
        else if (sectionName.includes('SPEAKING')) testType = "speaking";
        else if (sectionName.includes('LISTENING')) testType = "listening";
      }

      // Calculate final price with discount
      const originalPrice = test.price?.amount || 99;
      const discount = test.price?.discount || 0;
      const finalPrice = discount > 0 ? Math.round(originalPrice * (1 - discount / 100)) : originalPrice;

      // Map API test to our structure
      const testItem = {
        id: test._id || `test-${index}`,
        title: test.title || `Test #${index + 1}`,
        duration: `${test.duration || 60} Min`,
        questions: test.totalQuestions || 40,
        isPaid: test.isPaid || false,
        price: finalPrice,
        description: test.description || "",
        category: testType,
        difficulty: test.difficultyLevel?.toLowerCase() || "medium",
        originalPrice: originalPrice,
        discount: discount,
        sections: test.sections,
        examName: test.exam?.name || "IELTS"
      };

      console.log(`Created test item for ${testType}:`, testItem);

      // Add to the appropriate category
      if (transformed[testType]) {
        transformed[testType].push(testItem);
      } else {
        transformed.reading.push(testItem); // Default to reading
      }
    });

    console.log("Final transformed data:", transformed);
    return transformed;
  };

  

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleStartTest = (testId, testType) => {
    const testData = mockTests[testType]?.find(test => test.id === testId);
    
    navigate(`/test/${testId}`, { 
      state: { 
        testType: testType,
        testData: testData
      }
    });
  };

  const handlePreviewTest = (testId, testType) => {
    const testData = mockTests[testType]?.find(test => test.id === testId);
    
    navigate(`/test/preview/${testId}`, {
      state: {
        testType: testType,
        testData: testData
      }
    });
  };

  const handleBuyTest = (testId, testType) => {
    const testData = mockTests[testType]?.find(test => test.id === testId);
    console.log("Buying test:", testData);
    alert(`Redirecting to payment for ${testData.title} - ₹${testData.price}`);
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-700 dark:text-blue-300",
        button: "bg-blue-600 hover:bg-blue-700 text-white",
        badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        paidBadge: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
      },
      green: {
        bg: "bg-green-50 dark:bg-green-900/20",
        border: "border-green-200 dark:border-green-800",
        text: "text-green-700 dark:text-green-300",
        button: "bg-green-600 hover:bg-green-700 text-white",
        badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        paidBadge: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
      },
      purple: {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        border: "border-purple-200 dark:border-purple-800",
        text: "text-purple-700 dark:text-purple-300",
        button: "bg-purple-600 hover:bg-purple-700 text-white",
        badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        paidBadge: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
      },
      orange: {
        bg: "bg-orange-50 dark:bg-orange-900/20",
        border: "border-orange-200 dark:border-orange-800",
        text: "text-orange-700 dark:text-orange-300",
        button: "bg-orange-600 hover:bg-orange-700 text-white",
        badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        paidBadge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      }
    };
    return colors[color] || colors.blue;
  };

  const currentTests = mockTests[activeTab] || [];
  const currentColor = getColorClasses(testTypes.find(t => t.id === activeTab)?.color || "blue");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg text-gray-600 dark:text-gray-400">Loading tests...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
            <div className="text-red-600 dark:text-red-400 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
              Failed to Load Tests
            </h3>
            <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Retry
              </button>
              <button 
                onClick={() => setMockTests(getFallbackData())} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Use Demo Data
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Mock Tests
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Practice with our comprehensive mock tests for better preparation
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-2 mb-8">
          <div className="flex space-x-1">
            {testTypes.map((tab) => {
              const isActive = activeTab === tab.id;
              const colorClasses = getColorClasses(tab.color);
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 flex-1 justify-center ${
                    isActive
                      ? `${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} border shadow-sm`
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <span className="text-lg">{tab.emoji}</span>
                  <span>{tab.name}</span>
                  {mockTests[tab.id] && mockTests[tab.id].length > 0 && (
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                      {mockTests[tab.id].length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentTests.length > 0 ? (
            currentTests.map((test) => (
              <div
                key={test.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border ${currentColor.border} p-6 transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {test.title}
                  </h3>
                  <div className="flex flex-col items-end space-y-1">
                    {!test.isPaid ? (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${currentColor.badge}`}>
                        FREE
                      </span>
                    ) : (
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${currentColor.paidBadge}`}>
                          ₹{test.price}
                        </span>
                        {test.discount > 0 && (
                          <span className="px-1 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                            {test.discount}% OFF
                          </span>
                        )}
                      </div>
                    )}
                    {test.difficulty && (
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full capitalize">
                        {test.difficulty}
                      </span>
                    )}
                  </div>
                </div>

                {test.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {test.description}
                  </p>
                )}

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <span className="w-5">⏱️</span>
                    <span>Duration: {test.duration}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <span className="w-5">❓</span>
                    <span>Questions: {test.questions}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <span className="w-5">📊</span>
                    <span>Type: {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  {!test.isPaid ? (
                    <button
                      onClick={() => handleStartTest(test.id, activeTab)}
                      className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all duration-200 ${currentColor.button} shadow-sm hover:shadow-md hover:scale-105 transform`}
                    >
                      Starting FREE Test
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => handlePreviewTest(test.id, activeTab)}
                        className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105 transform"
                      >
                        Preview
                      </button>
                      <button 
                        onClick={() => handleBuyTest(test.id, activeTab)}
                        className="flex-1 py-2 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 transform"
                      >
                        Buy Now ₹{test.price}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Tests Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Check back later for new {activeTab} mock tests.
              </p>
            </div>
          )}
        </div>

        {/* Test Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3">
            Test Instructions
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
            <li>• Click "Starting FREE Test" to begin your practice test</li>
            <li>• For paid tests, click "Buy Now" to purchase access</li>
            <li>• Each test has a specific time limit - manage your time wisely</li>
            <li>• You can navigate between questions using the navigation buttons</li>
            <li>• Submit your test before the time runs out</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MockTest;