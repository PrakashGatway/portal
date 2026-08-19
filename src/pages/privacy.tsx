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
      {/* <div className="mb-8">
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
      </div> */}

      {/* Content Section */}
   <div className="w-full">
  {privacyData.extraData ? (
    <div
      className="
        w-full
        text-[15px] leading-7
        text-gray-700 dark:text-gray-300

        [&_*]:!max-w-full
        [&_*]:!box-border
        [&_p]:!mb-4
        [&_p]:!leading-7
        [&_h1]:!text-3xl
        [&_h1]:!font-bold
        [&_h1]:!mb-5
        [&_h2]:!text-2xl
        [&_h2]:!font-bold
        [&_h2]:!mb-4
        [&_h3]:!text-xl
        [&_h3]:!font-semibold
        [&_h3]:!mb-3
        [&_strong]:!font-semibold
        [&_b]:!font-semibold
        [&_ul]:!list-disc
        [&_ul]:!pl-6
        [&_ul]:!mb-4
        [&_ol]:!list-decimal
        [&_ol]:!pl-6
        [&_ol]:!mb-4
        [&_li]:!mb-2
        [&_a]:!text-orange-500
        [&_a]:!underline
        [&_a]:!break-words
        [&_img]:!max-w-full
        [&_img]:!h-auto
        [&_table]:!w-full
        [&_table]:!border-collapse
        [&_table]:!my-5
        [&_th]:!border
        [&_th]:!border-gray-300
        [&_th]:!p-3
        [&_th]:!font-semibold
        [&_td]:!border
        [&_td]:!border-gray-300
        [&_td]:!p-3
        [&_blockquote]:!border-l-4
        [&_blockquote]:!pl-4
        [&_blockquote]:!italic
        [&_br]:!leading-7
      "
      dangerouslySetInnerHTML={{
        __html: privacyData.extraData,
      }}
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