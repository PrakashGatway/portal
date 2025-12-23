import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
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
    { id: "reading", name: "Reading",color: "blue" },
    { id: "writing", name: "Writing",  color: "green" },
    { id: "speaking", name: "Speaking", color: "purple" },
    { id: "listening", name: "Listening",  color: "orange" }
  ];

  // Fetch test series from API
  useEffect(() => {
    const fetchTestSeries = async () => {
      try {
        setLoading(true);
        setError(null);
        
     
        const response = await api.get("/test/series?page=1&limit=10");

      

        if (response.data && response.data.success) {
        
          // Transform API data to match our structure
          const transformedData = transformApiData(response.data.data);
        
          setMockTests(transformedData);
        } else {
         
          setError("Failed to fetch test series - API returned error");
          setMockTests(getFallbackData());
        }
      } catch (err) {
     
        setError(err.response?.data?.message || err.message || "Failed to fetch test series");
        // Fallback to mock data if API fails
        setMockTests(getFallbackData());
      } finally {
        setLoading(false);
      }
    };

    fetchTestSeries();
  }, []);

  // Transform API data to match our component structure - ORIGINAL FUNCTION
  const transformApiData = (apiData) => {
   
    
    const transformed = {
      reading: [],
      writing: [],
      speaking: [],
      listening: []
    };

    if (!apiData || !Array.isArray(apiData)) {
   
      return transformed;
    }

    apiData.forEach((test, index) => {
      
      
      // Extract section information to determine test type
      let testType = "reading"; // Default to reading
      
      if (test.sections && test.sections.length > 0) {
        const sectionName = test.sections[0]?.sectionDetails?.name || "";
        if (sectionName.includes('READING')) testType = "reading";
        else if (sectionName.includes('WRITING')) testType = "writing";
        else if (sectionName.includes('SPEAKING')) testType = "speaking";
        else if (sectionName.includes('LISTENING')) testType = "listening";
      }

      // Calculate final price with discount - ORIGINAL LOGIC
      const originalPrice = test.price?.amount || 199;
      const discount = test.price?.discount || 0;
      const finalPrice = discount > 0 ? Math.round(originalPrice * (1 - discount / 100)) : originalPrice;

      // Map API test to our structure - ORIGINAL STRUCTURE
      const testItem = {
        id: test._id || `test-${index}`,
        title: test.title || `Full Mock Test #${140 + index}`,
        duration: `${test.duration || 174} Min`,
        questions: test.totalQuestions || 40,
    
        isPaid: test.isPaid || false, 
        price: finalPrice,
        description: test.description || "Comprehensive mock test with detailed analysis",
        category: testType,
        difficulty: test.difficultyLevel?.toLowerCase() || "medium",
        originalPrice: originalPrice,
        discount: discount,
        sections: test.sections,
        examName: test.exam?.name || "IELTS"
      };

      
      

      // Add to the appropriate category
      if (transformed[testType]) {
        transformed[testType].push(testItem);
      } else {
        transformed.reading.push(testItem); // Default to reading
      }
    });

    
    return transformed;
  };

  // Fallback data for demo - ORIGINAL LOGIC
  const getFallbackData = () => {
    const fallbackTests = [];
    for (let i = 140; i <= 153; i++) {
      fallbackTests.push({
        id: `test-${i}`,
        title: `Full Mock Test #${i}`,
        duration: "174 Min",
        questions: 40,
        isPaid: i !== 140, 
        price: 199,
        description: "Comprehensive IELTS mock test with detailed analysis and performance report",
        category: "reading",
        difficulty: ["easy", "medium", "hard"][Math.floor(Math.random() * 3)],
        originalPrice: 299,
        discount: 33,
        examName: "IELTS"
      });
    }
    
    return {
      reading: fallbackTests.slice(0, 4),
      writing: fallbackTests.slice(4, 8),
      speaking: fallbackTests.slice(8, 11),
      listening: fallbackTests.slice(11, 14)
    };
  };

  // ORIGINAL HANDLERS - UNCHANGED
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleStartTest = (testId, testType) => {
    const testData = mockTests[testType]?.find(test => test.id === testId);
    
    navigate(`/full/${testId}`, { 
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
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-700 dark:text-blue-300",
        button: "bg-blue-600 hover:bg-blue-700 text-white",
        badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        paidBadge: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
      },
      purple: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-700 dark:text-blue-300",
        button: "bg-blue-600 hover:bg-blue-700 text-white",
        badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        paidBadge: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
      },
      orange: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-700 dark:text-blue-300",
        button: "bg-blue-600 hover:bg-blue-700 text-white",
        badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        paidBadge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      }
    };
    return colors[color] || colors.blue;
  };

  const currentTests = mockTests[activeTab] || [];
  const currentColor = getColorClasses(testTypes.find(t => t.id === activeTab)?.color || "blue");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6">
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6">
      {/* Professional Header */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Mock Tests
              </h1>
              
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl px-4 py-2 shadow-sm">
                <span className="text-sm text-gray-500 dark:text-gray-400">Showing</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  {currentTests.length} {activeTab} tests
                </span>
              </div>
            </div>
          </div>

          {/* Professional Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-1.5 mb-8">
            <div className="flex space-x-1">
              {testTypes.map((tab) => {
                const isActive = activeTab === tab.id;
                const colorClasses = getColorClasses(tab.color);
                return (
                  <button
  key={tab.id}
  onClick={() => handleTabChange(tab.id)}
  className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-medium transition-all duration-300 flex-1 justify-center relative overflow-hidden ${
    isActive
      ? `bg-gradient-to-r ${tab.color === 'blue' ? 'from-blue-500 to-blue-600' : 
         "from-blue-500 to-blue-600"} text-white shadow-md`
      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
  }`}
>
  {/* Ripple effect */}
  <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
  
  <span className="text-lg transform group-hover:scale-110 transition-transform duration-300">{tab.emoji}</span>
  <span className="relative z-10">{tab.name}</span>
</button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Professional Test Cards Grid - ORIGINAL LOGIC FOR BUTTONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {currentTests.length > 0 ? (
            currentTests.map((test) => (
              <div
                key={test.id}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-blue-500 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-400"
              >
                <div className="p-6">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {/* ORIGINAL LOGIC: isPaid ke basis pe badge */}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          !test.isPaid ? currentColor.badge : currentColor.paidBadge
                        }`}>
                          {!test.isPaid ? "FREE" : `₹${test.price}`}
                        </span>
                        {test.discount > 0 && test.isPaid && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                            {test.discount}% OFF
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {test.title}
                      </h3>
                    </div>
                    {test.difficulty && (
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full capitalize">
                        {test.difficulty}
                      </span>
                    )}
                  </div>

               

                  {/* Test Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400">⏱️</span>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">Duration</div>
                          <div className="font-medium text-gray-900 dark:text-white">{test.duration}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                          <span className="text-green-600 dark:text-green-400">❓</span>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">Questions</div>
                          <div className="font-medium text-gray-900 dark:text-white">{test.questions}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - ORIGINAL LOGIC EXACTLY */}
                  <div className="flex space-x-3">
                    {!test.isPaid ? (
                
                     <button
  onClick={() => handleStartTest(test.id, activeTab)}
  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${currentColor.button} shadow-md hover:shadow-xl transform hover:scale-[1.03] active:scale-[0.98] relative overflow-hidden group`}
>
  <span className="relative z-10">Start FREE Test</span>
  <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
</button>
                    ) : (
                  
                      <>
                        <button 
                          onClick={() => handlePreviewTest(test.id, activeTab)}
                          className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Preview
                        </button>
                        <button 
  onClick={() => handleBuyTest(test.id, activeTab)}
  className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-xl transform hover:scale-[1.03] active:scale-[0.98] relative overflow-hidden group"
>
  <span className="relative z-10">Buy Now ₹{test.price}</span>
  <span className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-orange-400/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
</button>
                      </>
                    )}
                  </div>
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

       
      </div>
    </div>
  );
};

export default MockTest;