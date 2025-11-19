import React from 'react';

const About = ({ onClose, onBack }) => {
  return (
    <div className="min-h-screen bg-[#fdfdf8]">
      <div className="max-w-[1200px] mx-auto px-5 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-[48px] font-bold text-[#111] mb-8 tracking-tight">
            About
          </h1>

          <div className="prose prose-lg max-w-none space-y-8">
            <div>
              <h2 className="text-[32px] font-bold text-[#111] mb-4">
                The Open Startup Directory
              </h2>
              <p className="text-[18px] text-[#333] leading-relaxed mb-4">
                We welcome every founder. This platform exists to make discovery open. If you build, you get listed.
              </p>
              <p className="text-[18px] text-[#333] leading-relaxed">
                No selection. No permission. No committees deciding your fate. Just a place where builders can stand up and say: We are building this.
              </p>
            </div>

            <div>
              <h2 className="text-[28px] font-bold text-[#111] mb-4">
                Our Mission
              </h2>
              <p className="text-[18px] text-[#333] leading-relaxed mb-4">
                Startup ecosystems usually show only a small group. We show everyone. We believe that every builder deserves visibility, regardless of stage, funding, or background.
              </p>
              <p className="text-[18px] text-[#333] leading-relaxed">
                This directory updates in real time. New teams join every day. Your work becomes discoverable the moment you submit.
              </p>
            </div>

            <div>
              <h2 className="text-[28px] font-bold text-[#111] mb-4">
                How It Works
              </h2>
              <ul className="space-y-3 text-[18px] text-[#333]">
                <li className="flex items-start gap-3">
                  <span className="text-[#f26522] font-bold mt-1">1.</span>
                  <span><strong>Submit your startup</strong> - Takes less than one minute. No pitch deck required.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#f26522] font-bold mt-1">2.</span>
                  <span><strong>Get listed instantly</strong> - Your startup appears in the directory immediately.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#f26522] font-bold mt-1">3.</span>
                  <span><strong>Get discovered</strong> - Investors, creators, and users browse daily. Your work becomes visible.</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-[28px] font-bold text-[#111] mb-4">
                Built for Founders, by Founders
              </h2>
              <p className="text-[18px] text-[#333] leading-relaxed">
                We wanted a world where discovery is open. So we created a platform that welcomes every builder. No fear. No judgement. Only momentum.
              </p>
            </div>

            <div className="pt-8 border-t border-gray-200">
              <h2 className="text-[28px] font-bold text-[#111] mb-4">
                Contact
              </h2>
              <p className="text-[18px] text-[#333] leading-relaxed">
                Have questions? Want to get involved? Reach out to us.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;

