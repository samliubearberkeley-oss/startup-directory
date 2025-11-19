import React from 'react';
import { Users, MessageSquare, Calendar, TrendingUp, Lock } from 'lucide-react';

const Community = ({ onClose, onBack }) => {
  return (
    <div className="min-h-screen bg-[#fdfdf8]">
      <div className="max-w-[1200px] mx-auto px-5 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-[48px] font-bold text-[#111] tracking-tight">
              Community
            </h1>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <Lock className="text-gray-500" size={20} />
              <span className="text-[14px] font-semibold text-gray-600">Coming Soon</span>
            </div>
          </div>
          <p className="text-[20px] text-[#333] mb-12 leading-relaxed">
            Connect with builders, share knowledge, and grow together.
          </p>

          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-16 mb-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="text-gray-400" size={40} />
              </div>
              <h2 className="text-[32px] font-bold text-[#111] mb-4">
                Coming Soon
              </h2>
              <p className="text-[18px] text-[#666] leading-relaxed max-w-2xl mx-auto">
                We're building an amazing community platform for founders. Stay tuned for updates!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 opacity-50 pointer-events-none">
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
              <div className="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center mb-4">
                <Users className="text-gray-500" size={24} />
              </div>
              <h2 className="text-[24px] font-bold text-[#111] mb-3">Founder Network</h2>
              <p className="text-[16px] text-[#333] leading-relaxed mb-4">
                Connect with founders building in your industry or region. Share experiences and learn from each other.
              </p>
              <button className="text-gray-400 font-semibold" disabled>
                Join Network →
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
              <div className="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="text-gray-500" size={24} />
              </div>
              <h2 className="text-[24px] font-bold text-[#111] mb-3">Discussions</h2>
              <p className="text-[16px] text-[#333] leading-relaxed mb-4">
                Join conversations about building, fundraising, growth, and everything startup-related.
              </p>
              <button className="text-gray-400 font-semibold" disabled>
                View Discussions →
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
              <div className="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="text-gray-500" size={24} />
              </div>
              <h2 className="text-[24px] font-bold text-[#111] mb-3">Events</h2>
              <p className="text-[16px] text-[#333] leading-relaxed mb-4">
                Find and join startup events, meetups, and workshops happening in your area or online.
              </p>
              <button className="text-gray-400 font-semibold" disabled>
                Browse Events →
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
              <div className="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="text-gray-500" size={24} />
              </div>
              <h2 className="text-[24px] font-bold text-[#111] mb-3">Success Stories</h2>
              <p className="text-[16px] text-[#333] leading-relaxed mb-4">
                Read stories from founders who started small and built something meaningful. Get inspired.
              </p>
              <button className="text-gray-400 font-semibold" disabled>
                Read Stories →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;

