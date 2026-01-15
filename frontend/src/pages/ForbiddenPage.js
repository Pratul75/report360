import React from 'react';
import { useNavigate } from 'react-router-dom';

const ForbiddenPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-red-500">403</h1>
          <h2 className="text-3xl font-semibold text-gray-800 mt-4">Access Denied</h2>
          <p className="text-gray-600 mt-4">
            You don't have permission to access this resource.
          </p>
          <p className="text-gray-500 mt-2 text-sm">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            ← Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-6 py-3 text-blue-600 bg-white border border-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">
            Need access?
          </h3>
          <p className="text-xs text-yellow-700">
            Contact your system administrator to request the necessary permissions for this feature.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
