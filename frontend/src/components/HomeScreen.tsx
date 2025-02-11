import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeScreen.css';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-r from-red-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Welcome</h1>
        <div className="space-y-4">
          <button 
            className="w-full text-lg py-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            onClick={() => navigate('/user-map')}
          >
            View as User
          </button>
          <button 
            className="w-full text-lg py-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition"
            onClick={() => navigate('/login')}
          >
            Login as Vendor
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
