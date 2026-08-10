import React, { useState, useEffect } from 'react';
import api from '../axiosInstance';

const Privacy = () => {
  const [privacyData, setPrivacyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrivacyPolicy = async () => {
      try {
        setLoading(true);
        const response = await api.get('/Banner/privacy-policy');
        
        if (response.data?.success && response.data?.data?.length > 0) {
          setPrivacyData(response.data.data[0]);
        } else {
          setError('No privacy policy found');
        }
      } catch (err) {
        console.error('Error fetching privacy policy:', err);
        setError('Failed to load privacy policy');
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacyPolicy();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600 text-center">
          <p className="text-xl font-semibold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!privacyData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600 text-center">
          <p className="text-xl font-semibold">No Privacy Policy Available</p>
        </div>
      </div>
    );
  }

  return (
    <div className=" mx-auto px-4 py-8 bg-white w-full rounded-3xl">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          { 'Privacy Policy'}
        </h1>
        {privacyData.description && (
          <p className="text-gray-600 dark:text-gray-300">
            {privacyData.description}
          </p>
        )}
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date(privacyData.updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Content Section */}
      <div className="prose prose-lg dark:prose-invert max-w-none ">
        {privacyData.extraData ? (
          <div 
            className="privacy-content"
            dangerouslySetInnerHTML={{ __html: privacyData.extraData }}
          />
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            No content available for this privacy policy.
          </p>
        )}
      </div>

      {/* Footer Section */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This privacy policy is effective as of{' '}
          {new Date(privacyData.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Optional: Display metadata if needed */}
      <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
        <p>ID: {privacyData._id}</p>
        <p>Status: {privacyData.isActive ? 'Active' : 'Inactive'}</p>
        {privacyData.key && <p>Key: {privacyData.key}</p>}
      </div>

    </div>
  );
};

export default Privacy;