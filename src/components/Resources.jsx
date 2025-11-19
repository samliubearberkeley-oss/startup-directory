import React from 'react';
import { Book, FileText, Video, Download, ExternalLink, Lock } from 'lucide-react';

const Resources = ({ onClose, onBack }) => {
  const resources = [
    {
      icon: Book,
      title: 'Startup Library',
      description: 'Curated articles, guides, and resources for founders at every stage.',
      link: '#'
    },
    {
      icon: FileText,
      title: 'Templates & Tools',
      description: 'Free templates for pitch decks, business plans, and more.',
      link: '#'
    },
    {
      icon: Video,
      title: 'Video Library',
      description: 'Talks, interviews, and tutorials from successful founders.',
      link: '#'
    },
    {
      icon: Download,
      title: 'Downloads',
      description: 'Downloadable resources, checklists, and guides.',
      link: '#'
    }
  ];

  return (
    <div className="min-h-screen bg-[#fdfdf8]">
      <div className="max-w-[1200px] mx-auto px-5 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-[48px] font-bold text-[#111] tracking-tight">
              Resources
            </h1>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <Lock className="text-gray-500" size={20} />
              <span className="text-[14px] font-semibold text-gray-600">Coming Soon</span>
            </div>
          </div>
          <p className="text-[20px] text-[#333] mb-12 leading-relaxed">
            Everything you need to build, grow, and scale your startup.
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
                We're curating the best resources for founders. Check back soon for templates, guides, and more!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 opacity-50 pointer-events-none">
            {resources.map((resource, index) => {
              const Icon = resource.icon;
              return (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="text-gray-500" size={24} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-[20px] font-bold text-[#111] mb-2">{resource.title}</h2>
                      <p className="text-[15px] text-[#333] leading-relaxed mb-4">
                        {resource.description}
                      </p>
                      <span className="text-gray-400 font-semibold flex items-center gap-2">
                        Explore <ExternalLink size={16} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;

