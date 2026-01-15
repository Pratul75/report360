import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Truck, Calendar, TrendingUp, Shield, CheckCircle } from 'lucide-react';

const WelcomePage = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    setVisible(true);
  }, []);

  const features = [
    { icon: Truck, title: 'Fleet Management', description: 'Track and manage your vehicle fleet efficiently' },
    { icon: Calendar, title: 'Campaign Tracking', description: 'Monitor campaign progress in real-time' },
    { icon: Users, title: 'Team Collaboration', description: 'Work seamlessly with your team members' },
    { icon: TrendingUp, title: 'Analytics', description: 'Get insights with powerful analytics tools' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className={`max-w-4xl w-full transition-all duration-1000 transform ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Welcome Card */}
        <Card className="backdrop-blur-sm bg-white/90 shadow-2xl border-0 mb-8">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="mb-6 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              </div>
              <Shield className="w-20 h-20 mx-auto text-indigo-600 relative z-10 animate-bounce" />
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Welcome to Ops360
            </h1>
            
            <p className="text-2xl text-gray-700 mb-2">
              Hello, <span className="font-semibold text-indigo-600">{user.name || 'User'}</span>!
            </p>
            
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Your comprehensive fleet operations management platform. 
              {user.role && (
                <span className="block mt-2 text-sm">
                  Role: <span className="font-semibold capitalize">{user.role.replace('_', ' ')}</span>
                </span>
              )}
            </p>

            <div className="flex items-center justify-center gap-2 text-green-600 mb-6">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">You're successfully logged in</span>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="backdrop-blur-sm bg-white/80 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              style={{
                animationDelay: `${index * 150}ms`,
                animation: visible ? 'slideIn 0.6s ease-out forwards' : 'none',
                opacity: visible ? 1 : 0
              }}
            >
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Message */}
        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-lg">
          <CardContent className="pt-6 pb-6">
            <div className="text-center">
              <p className="text-gray-700 mb-4">
                Your dashboard is being configured. Please contact your administrator for access to specific features.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Back to Login
                </button>
                <span className="text-gray-500 text-sm">or contact support for assistance</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Animated Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;
