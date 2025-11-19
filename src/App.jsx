import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, Globe, Linkedin, Twitter, Youtube, ExternalLink, Menu, X, ChevronDown, ChevronRight, Check, Github, Facebook } from 'lucide-react';
import { companiesAPI } from './services/api';
import SubmitStartup from './components/SubmitStartup';
import About from './components/About';
import Community from './components/Community';
import Resources from './components/Resources';

// --- Reusable Components ---

const CheckboxRow = ({ label, count, checked, onChange, subItem = false, isRegion = false }) => (
  <div className={`flex items-center gap-2.5 py-[5px] cursor-pointer group ${subItem ? 'ml-6' : ''}`} onClick={onChange}>
     {isRegion && subItem ? (
        <div className="w-5 h-5 flex items-center justify-center">
           <ChevronRight size={16} className="text-gray-400" />
        </div>
     ) : (
        <div className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition-colors flex-shrink-0
          ${checked ? 'bg-[#f26522] border-[#f26522]' : 'bg-white border-gray-300 group-hover:border-gray-400'}`}>
          {checked && <Check size={12} className="text-white stroke-[4]" />}
        </div>
     )}
    <span className="text-[#111] text-[15px] flex-1 truncate">{label}</span>
    {count !== undefined && <span className="text-gray-400 text-sm bg-gray-100 px-1.5 py-0.5 rounded">{count}</span>}
  </div>
);

const FilterSection = ({ title, children }) => {
  return (
    <div className="border-b border-gray-200 pb-6 mb-6">
      <div className="flex justify-between items-center mb-3 cursor-pointer group">
        <h3 className="font-bold text-[#111] text-[16px]">{title}</h3>
        <div className="w-5 h-5 bg-[#e0e0e0] rounded text-white flex items-center justify-center group-hover:bg-[#ccc] transition-colors">
           <span className="font-bold text-xs">-</span>
        </div>
      </div>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
};

const BatchTag = ({ batch }) => (
  <div className="inline-flex items-center bg-[#e6e6e6] rounded-[3px] px-1.5 py-1 gap-1.5">
    <div className="bg-[#f26522] w-3.5 h-3.5 flex items-center justify-center rounded-[1px]">
      <span className="text-white text-[9px] font-bold">L</span>
    </div>
    <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wide">Listed</span>
  </div>
);

const IndustryTag = ({ label }) => (
  <span className="inline-flex items-center bg-[#e6e6e6] rounded-[3px] px-2 py-1 text-[10px] font-semibold text-[#555] uppercase tracking-wide">
    {label}
  </span>
);

const StatusDot = ({ status }) => (
  <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#333]">
     <div className={`w-2 h-2 rounded-full ${status === 'Public' || status === 'Active' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
     {status}
  </div>
);

// --- Main App Component ---

const App = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('Anywhere');
  const [topCompaniesOnly, setTopCompaniesOnly] = useState(false);
  const [isHiringOnly, setIsHiringOnly] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('directory'); // 'directory', 'submit', 'about', 'community', 'resources'
  
  // Data states
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    topCompanies: 0,
    hiring: 0,
    nonprofit: 0,
    batchCounts: {},
    industryCounts: {},
    regionCounts: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load stats once on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await companiesAPI.getStats();
        setStats(statsData);
      } catch (err) {
        console.error('Error loading stats:', err);
      }
    };
    loadStats();
  }, []);

  // Load companies when filters change
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatch, selectedIndustry, selectedRegion, topCompaniesOnly, isHiringOnly, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load companies with filters
      const filters = {
        batch: selectedBatch,
        industry: selectedIndustry,
        region: selectedRegion,
        isTop: topCompaniesOnly,
        hiring: isHiringOnly,
        search: searchQuery
      };
      
      const companiesData = await companiesAPI.getAll(filters);
      setCompanies(companiesData || []);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyClick = async (company) => {
    try {
      const fullCompany = await companiesAPI.getById(company.id);
      setSelectedCompany(fullCompany);
    } catch (err) {
      console.error('Error loading company details:', err);
      setSelectedCompany(company); // Fallback to basic data
    }
  };

  // Format company data for display
  const formatCompany = (company) => {
    return {
      ...company,
      logo: company.logo_url || `https://logo.clearbit.com/${company.website?.replace('https://', '').replace('http://', '').split('/')[0]}`,
      logoFallback: company.logo_fallback || company.name.charAt(0).toUpperCase(),
      longDescription: company.long_description || company.description,
      batchFull: company.batch_full || company.batch,
      tags: company.tags || [],
      teamSize: company.team_size || 0,
      isTop: company.is_top || false,
      hiring: company.hiring || false,
      founders: company.founders || [],
      jobs: company.jobs || [],
      news: company.news || []
    };
  };

  // Get count for batch/stage
  const getBatchCount = (batch) => {
    if (batch === 'All') return stats.total;
    return stats.batchCounts[batch] || 0;
  };

  // Get count for industry
  const getIndustryCount = (industry) => {
    if (industry === 'All') return stats.total;
    return stats.industryCounts[industry] || 0;
  };

  // Get count for region
  const getRegionCount = (region) => {
    if (region === 'Anywhere') return stats.total;
    return stats.regionCounts[region] || 0;
  };

  // Show submit page

  // Handle page navigation
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    // Close company detail modal when navigating away from directory
    if (page !== 'directory') {
      setSelectedCompany(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdf8] font-sans text-[#333]">
      {/* Global Navbar - Always visible */}
      <nav className="bg-[#fdfdf8] sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-5 h-[70px] flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a 
              href="#" 
              className="block" 
              onClick={(e) => { 
                e.preventDefault(); 
                handlePageChange('directory');
              }}
            >
              <div className="bg-[#f26522] w-[50px] h-[50px] flex items-center justify-center">
                 <span className="text-white text-3xl font-bold">O</span>
              </div>
            </a>
            <div className="hidden md:flex items-center gap-6">
              {[
                { name: 'About', page: 'about' },
                { name: 'Startup Directory', page: 'directory' },
                { name: 'Submit Your Startup', page: 'submit' },
                { name: 'Community', page: 'community' },
                { name: 'Resources', page: 'resources' }
              ].map(item => (
                <a 
                  key={item.name} 
                  href="#" 
                  className={`text-[15px] font-normal transition-colors ${
                    currentPage === item.page 
                      ? 'text-[#f26522] font-semibold' 
                      : 'text-[#333] hover:text-[#f26522]'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(item.page);
                  }}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden lg:block text-[15px] text-[#333]">Join thousands of builders.</span>
            <button 
              className="bg-[#f26522] text-white px-6 py-2.5 rounded font-bold text-[15px] hover:bg-[#d9531e] transition-colors"
              onClick={() => handlePageChange('submit')}
            >
              Submit your startup
            </button>
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-30 pt-[80px] px-5">
          <div className="flex flex-col gap-4 text-lg">
             {[
                { name: 'About', page: 'about' },
                { name: 'Startup Directory', page: 'directory' },
                { name: 'Submit Your Startup', page: 'submit' },
                { name: 'Community', page: 'community' },
                { name: 'Resources', page: 'resources' }
              ].map(item => (
                <a 
                  key={item.name} 
                  href="#" 
                  className={`text-[#333] font-medium border-b border-gray-100 pb-2 ${
                    currentPage === item.page ? 'text-[#f26522]' : ''
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(item.page);
                  }}
                >
                  {item.name}
                </a>
              ))}
          </div>
        </div>
      )}

      {/* Page Router */}
      {currentPage === 'submit' && (
        <SubmitStartup 
          onClose={() => handlePageChange('directory')} 
          onBack={() => handlePageChange('directory')}
          onPageChange={handlePageChange}
          onSubmissionSuccess={() => {
            // Refresh directory data when submission succeeds
            loadData();
            // Optionally navigate to directory after a short delay
            setTimeout(() => {
              handlePageChange('directory');
            }, 2000);
          }}
        />
      )}

      {currentPage === 'about' && (
        <About 
          onClose={() => handlePageChange('directory')} 
          onBack={() => handlePageChange('directory')} 
        />
      )}

      {currentPage === 'community' && (
        <Community 
          onClose={() => handlePageChange('directory')} 
          onBack={() => handlePageChange('directory')} 
        />
      )}

      {currentPage === 'resources' && (
        <Resources 
          onClose={() => handlePageChange('directory')} 
          onBack={() => handlePageChange('directory')} 
        />
      )}

      {/* Main Directory Page */}
      {currentPage === 'directory' && (
        <>
          <div className="max-w-[1200px] mx-auto px-5 py-10">
        
        {/* Header Text Area */}
        <div className="mb-12 max-w-4xl">
          <h1 className="text-[42px] font-bold text-[#111] mb-6 tracking-tight leading-tight">The open startup directory</h1>
          <p className="text-[22px] text-[#111] leading-relaxed font-normal mb-3">
            No selection. No permission. If you build, you belong here.
          </p>
          <p className="text-[20px] text-[#f26522] leading-relaxed font-medium">
            Show the world what you built
          </p>
        </div>

        {/* 2-Column Grid: Left Filters | Right Content */}
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* --- LEFT COLUMN: FILTERS --- */}
          <div className="w-full lg:w-[260px] flex-shrink-0">
            
            {/* Top Checkboxes */}
            <div className="border-b border-gray-200 pb-6 mb-6 space-y-1">
              <CheckboxRow 
                label="Top Companies" 
                count={stats.topCompanies} 
                checked={topCompaniesOnly} 
                onChange={() => setTopCompaniesOnly(!topCompaniesOnly)} 
              />
              <CheckboxRow 
                label="Is Hiring" 
                count={stats.hiring} 
                checked={isHiringOnly} 
                onChange={() => setIsHiringOnly(!isHiringOnly)} 
              />
              <CheckboxRow label="Nonprofit" count={stats.nonprofit} checked={false} onChange={() => {}} />
            </div>

            {/* Stage Filter */}
            <FilterSection title="Stage">
              <CheckboxRow label="All stages" count={stats.total} checked={selectedBatch === 'All'} onChange={() => setSelectedBatch('All')} />
              <CheckboxRow label="Idea" count={getBatchCount('W26')} checked={selectedBatch === 'W26'} onChange={() => setSelectedBatch('W26')} />
              <CheckboxRow label="MVP" count={getBatchCount('F25')} checked={selectedBatch === 'F25'} onChange={() => setSelectedBatch('F25')} />
              <CheckboxRow label="Early Stage" count={getBatchCount('S25')} checked={selectedBatch === 'S25'} onChange={() => setSelectedBatch('S25')} />
              <CheckboxRow label="Growth" count={getBatchCount('Sp25')} checked={selectedBatch === 'Sp25'} onChange={() => setSelectedBatch('Sp25')} />
              <CheckboxRow label="Established" count={getBatchCount('W25')} checked={selectedBatch === 'W25'} onChange={() => setSelectedBatch('W25')} />
              <a href="#" className="text-[#f26522] text-[15px] mt-2 block hover:underline ml-8">See all options</a>
            </FilterSection>

            {/* Industry Filter */}
            <FilterSection title="Industry">
               <CheckboxRow label="All industries" count={stats.total} checked={selectedIndustry === 'All'} onChange={() => setSelectedIndustry('All')} />
                {['B2B', 'Consumer', 'Fintech', 'Healthcare', 'Education', 'Industrials'].map(ind => (
                   <div key={ind} className="flex items-center gap-2 py-[5px] cursor-pointer group ml-6" onClick={() => setSelectedIndustry(ind === selectedIndustry ? 'All' : ind)}>
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                            <ChevronRight size={16} className="text-gray-400" />
                        </div>
                        <span className={`text-[15px] flex-1 ${selectedIndustry === ind ? 'font-bold text-[#111]' : 'text-[#333]'}`}>{ind}</span>
                        <span className="text-gray-400 text-sm bg-gray-100 px-1.5 py-0.5 rounded">{getIndustryCount(ind)}</span>
                   </div>
                ))}
                <CheckboxRow label="Real Estate and Construction" count={getIndustryCount('Real Estate')} checked={false} onChange={() => {}} subItem isRegion />
                <a href="#" className="text-[#f26522] text-[15px] mt-2 block hover:underline ml-8">See all options</a>
            </FilterSection>

            {/* Region Filter */}
            <FilterSection title="Region">
              <CheckboxRow label="Anywhere" count={stats.total} checked={selectedRegion === 'Anywhere'} onChange={() => setSelectedRegion('Anywhere')} />
              {['America / Canada', 'Remote', 'Europe', 'South Asia', 'Latin America', 'Southeast Asia', 'Africa', 'Middle East and North Africa'].map(region => (
                 <CheckboxRow 
                   key={region}
                   label={region} 
                   count={getRegionCount(region)} 
                   subItem 
                   isRegion
                   checked={selectedRegion === region}
                   onChange={() => setSelectedRegion(region)}
                 />
              ))}
            </FilterSection>

            {/* Team Size Slider */}
            <div className="pb-6">
              <h3 className="font-bold text-[#111] mb-4 text-[16px]">Team size</h3>
              <div className="px-2">
                <div className="text-[15px] text-[#333] mb-3 font-medium">1 - 1,000+</div>
                <div className="relative h-1.5 bg-[#e0e0e0] rounded-full">
                   <div className="absolute left-0 right-0 h-full bg-[#90c0e0] rounded-full"></div>
                   <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-4 h-6 bg-white border border-gray-200 rounded shadow-sm cursor-pointer hover:border-gray-300">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[2px] h-2 bg-gray-300"></div>
                   </div>
                   <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-6 bg-white border border-gray-200 rounded shadow-sm cursor-pointer hover:border-gray-300">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[2px] h-2 bg-gray-300"></div>
                   </div>
                </div>
              </div>
            </div>
             
            <div className="space-y-1 mt-6">
               <p className="text-[14px] text-[#666] mb-4">
                 This directory updates in real time. New teams join every day.
               </p>
            </div>
          </div>

          {/* --- RIGHT COLUMN: CONTENT --- */}
          <div className="flex-1 min-w-0">
            
            {/* Row 1: Sort By (Top Right) */}
            <div className="flex justify-end mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[#333] text-[15px]">Sort by</span>
                <button className="bg-white border border-gray-300 rounded px-3 py-1.5 text-[15px] text-[#333] flex items-center gap-8 hover:border-gray-400 transition-colors shadow-sm">
                  Default <ChevronDown size={16} />
                </button>
              </div>
            </div>

            {/* Row 2: Search Bar (Full Width in Right Column) */}
            <div className="relative mb-6">
               <input 
                type="text" 
                placeholder="Keywords..." 
                className="w-full bg-white border border-gray-300 rounded-[4px] py-3 px-4 text-[16px] focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522] placeholder-gray-400 shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Row 3: Result Count */}
            <div className="mb-4 text-[#555] text-[15px]">
              {loading ? 'Loading...' : error ? error : `Showing ${companies.length} of ${stats.total}+ startups`}
            </div>
            
            {/* Row 4: Company List */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-12 text-center text-gray-500">Loading companies...</div>
              ) : error ? (
                <div className="p-12 text-center text-red-500">{error}</div>
              ) : companies.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No companies found matching your criteria.
                </div>
              ) : (
                companies.map((company, index) => {
                  const formattedCompany = formatCompany(company);
                  return (
                    <div 
                      key={company.id} 
                      onClick={() => handleCompanyClick(company)}
                      className={`p-6 flex gap-6 cursor-pointer hover:bg-[#fdfdf8] transition-colors ${index !== companies.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      {/* Logo */}
                      <div className="w-[60px] h-[60px] flex-shrink-0 rounded-full overflow-hidden border border-gray-100 bg-white flex items-center justify-center relative">
                        <img 
                          src={formattedCompany.logo} 
                          alt={formattedCompany.name} 
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.parentElement.querySelector('.fallback');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div className="fallback hidden absolute inset-0 bg-gray-100 items-center justify-center text-gray-400 font-bold text-xl">
                          {formattedCompany.logoFallback}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 mb-1">
                          <h3 className="text-[18px] font-bold text-[#111]">{formattedCompany.name}</h3>
                          <span className="text-[15px] text-[#555]">{formattedCompany.location}</span>
                        </div>
                        <p className="text-[15px] text-[#111] mb-3 leading-normal">
                          {formattedCompany.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <BatchTag />
                          {formattedCompany.industry && <IndustryTag label={formattedCompany.industry.toUpperCase()} />}
                          {formattedCompany.tags.map(tag => (
                            <IndustryTag key={tag} label={tag.toUpperCase()} />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

          {/* Detail Modal - Only shown on directory page */}
          {selectedCompany && (
            <div className="fixed inset-0 z-50 bg-[#fdfdf8] overflow-y-auto">
           
           {/* Modal Navbar */}
           <nav className="bg-[#fdfdf8] border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-[1200px] mx-auto px-5 h-[70px] flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="bg-[#f26522] w-[50px] h-[50px] flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">O</span>
                </div>
                <div className="hidden md:flex items-center gap-6">
                  {['About', 'Startup Directory', 'Submit Your Startup', 'Community', 'Resources'].map(item => (
                    <a key={item} href="#" className="text-[15px] text-[#333] hover:text-[#f26522] font-normal">
                      {item}
                    </a>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden lg:block text-[15px] text-[#333]">Join thousands of builders.</span>
                <button className="bg-[#f26522] text-white px-6 py-2.5 rounded font-bold text-[15px] hover:bg-[#d9531e] transition-colors">
                  Submit your startup
                </button>
                <button onClick={() => setSelectedCompany(null)} className="p-2 text-gray-500 hover:text-black">
                    <X size={28} />
                </button>
              </div>
            </div>
          </nav>

           <div className="max-w-[1200px] mx-auto px-5 py-8">
              
              {/* Breadcrumb */}
              <div className="text-[#f26522] text-[15px] mb-8 flex items-center font-medium">
                <span className="hover:underline cursor-pointer" onClick={() => setSelectedCompany(null)}>Home</span> 
                <span className="text-gray-400 mx-2">›</span> 
                <span className="hover:underline cursor-pointer" onClick={() => setSelectedCompany(null)}>Companies</span> 
                <span className="text-gray-400 mx-2">›</span> 
                <span className="text-[#333]">{selectedCompany.name}</span>
              </div>

              {/* Header Section */}
              <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
                 <div className="w-[120px] h-[120px] flex-shrink-0 bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-center">
                    <img src={formatCompany(selectedCompany).logo} alt={selectedCompany.name} className="max-w-full max-h-full object-contain" />
                 </div>
                 <div className="flex-1">
                    <h1 className="text-[42px] font-bold text-[#111] mb-2 leading-tight">{selectedCompany.name}</h1>
                    <p className="text-[22px] text-[#333] mb-6 leading-normal">{selectedCompany.description}</p>
                    <div className="flex flex-wrap items-center gap-3">
                       <BatchTag />
                       {selectedCompany.status === 'Public' && (
                          <div className="flex items-center gap-1.5 bg-transparent px-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-[11px] font-bold text-[#555] uppercase tracking-wide">PUBLIC</span>
                          </div>
                       )}
                       {selectedCompany.industry && <IndustryTag label={selectedCompany.industry.toUpperCase()} />}
                       {formatCompany(selectedCompany).tags.map(tag => (
                          <IndustryTag key={tag} label={tag.toUpperCase()} />
                       ))}
                       {selectedCompany.location && (
                          <span className="bg-[#e6e6e6] rounded-[3px] px-2 py-1 text-[10px] font-semibold text-[#555] uppercase tracking-wide">
                             {selectedCompany.location.split(',')[0].toUpperCase()}
                          </span>
                       )}
                    </div>
                 </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center border-b border-gray-200 mb-10">
                 <div className="flex gap-8">
                    <button className="py-3 font-bold text-[#111] border-b-[3px] border-[#f26522] text-[17px]">Company</button>
                    <button className="py-3 font-medium text-gray-500 hover:text-[#111] text-[17px] flex items-center gap-2">
                      Jobs <span className="bg-[#f5f5f5] text-[#555] text-xs font-bold px-2 py-0.5 rounded-full">{formatCompany(selectedCompany).jobs.length || 0}</span>
                    </button>
                    <button className="py-3 font-medium text-gray-500 hover:text-[#111] text-[17px]">News</button>
                 </div>
                 <div className="ml-auto">
                    {selectedCompany.website && (
                      <a href={selectedCompany.website} target="_blank" rel="noreferrer" className="text-[#f26522] text-[15px] flex items-center gap-1 hover:underline">
                         {selectedCompany.website.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]}
                      </a>
                    )}
                 </div>
              </div>

              {/* Main Content Grid */}
              <div className="flex flex-col lg:flex-row gap-16">
                 
                 {/* Left Content Column */}
                 <div className="flex-1 min-w-0">
                    
                    <div className="prose max-w-none mb-16">
                       <p className="text-[18px] leading-relaxed text-[#111]">
                          {formatCompany(selectedCompany).longDescription || selectedCompany.description}
                       </p>
                    </div>

                    {/* Latest News */}
                    {formatCompany(selectedCompany).news && formatCompany(selectedCompany).news.length > 0 && (
                       <div className="mb-16">
                          <h3 className="text-[28px] font-bold text-[#111] mb-6">Latest News</h3>
                          <div className="space-y-8">
                             {formatCompany(selectedCompany).news.map((newsItem, i) => (
                                <div key={i}>
                                   <a href={newsItem.url || '#'} className="text-[#f26522] text-[18px] hover:underline font-normal block mb-1.5 leading-snug">
                                      {newsItem.title}
                                   </a>
                                   <div className="text-[15px] text-gray-500">{newsItem.date || newsItem.created_at}</div>
                                </div>
                             ))}
                          </div>
                       </div>
                    )}

                    {/* Jobs */}
                    <div className="mb-16">
                       <div className="flex justify-between items-baseline mb-6">
                          <h3 className="text-[28px] font-bold text-[#111]">Jobs at {selectedCompany.name}</h3>
                          <a href="#" className="text-[#f26522] font-bold hover:underline text-[15px]">View all jobs &gt;</a>
                       </div>
                       
                       {formatCompany(selectedCompany).jobs && formatCompany(selectedCompany).jobs.length > 0 ? (
                          <div className="space-y-4">
                             {formatCompany(selectedCompany).jobs.map((job, i) => (
                                <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-gray-100">
                                   <div className="mb-3 sm:mb-0">
                                      <a href={job.apply_url || '#'} className="text-[#f26522] font-bold text-[17px] hover:underline block mb-1">{job.title}</a>
                                      <div className="text-[15px] text-[#333]">
                                         {job.location} {job.salary && `• ${job.salary}`} {job.experience && `• ${job.experience}`}
                                      </div>
                                   </div>
                                   <button className="bg-[#f26522] text-white px-5 py-2 rounded font-bold text-[15px] hover:bg-[#d9531e]">
                                      Apply Now &gt;
                                   </button>
                                </div>
                             ))}
                          </div>
                       ) : (
                         <div className="text-gray-500">No active job listings found.</div>
                       )}
                    </div>

                    {/* Founders */}
                    {formatCompany(selectedCompany).founders && formatCompany(selectedCompany).founders.length > 0 && (
                      <div>
                         <h3 className="text-[28px] font-bold text-[#111] mb-6">Active Founders</h3>
                         <div className="space-y-6">
                            {formatCompany(selectedCompany).founders.map((founder, i) => (
                               <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col sm:flex-row gap-6 shadow-sm">
                                  <div className="w-[100px] h-[100px] flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                     <img src={founder.image_url || `https://ui-avatars.com/api/?name=${founder.name}&background=random`} alt={founder.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1">
                                     <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[19px] font-bold text-[#111]">{founder.name}</span>
                                        {founder.linkedin_url && (
                                          <a href={founder.linkedin_url} target="_blank" rel="noreferrer">
                                            <Linkedin size={18} className="text-[#0077b5]" />
                                          </a>
                                        )}
                                     </div>
                                     <div className="text-[15px] text-[#555] mb-3">{founder.role}</div>
                                     {founder.bio && (
                                       <p className="text-[15px] text-[#333] leading-relaxed">
                                          {founder.bio}
                                       </p>
                                     )}
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                    )}
                 </div>

                 {/* Right Sidebar - Card Style */}
                 <div className="w-full lg:w-[340px] flex-shrink-0">
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm sticky top-[100px]">
                        <div className="flex items-center gap-2 mb-6">
                           <img src={formatCompany(selectedCompany).logo} className="w-6 h-6 object-contain" alt="logo small" />
                           <span className="font-bold text-xl text-[#111]">{selectedCompany.name}</span>
                        </div>
                        <div className="space-y-5 text-[16px]">
                           {selectedCompany.founded && (
                             <div className="flex justify-between">
                                <span className="text-gray-500 font-medium">Founded:</span>
                                <span className="text-[#111]">{selectedCompany.founded}</span>
                             </div>
                           )}
                           <div className="flex justify-between">
                              <span className="text-gray-500 font-medium">Listed:</span>
                              <span className="text-[#111]">Real time</span>
                           </div>
                           {selectedCompany.team_size && (
                             <div className="flex justify-between">
                                <span className="text-gray-500 font-medium">Team Size:</span>
                                <span className="text-[#111]">{selectedCompany.team_size}</span>
                             </div>
                           )}
                           <div className="flex justify-between items-center">
                              <span className="text-gray-500 font-medium">Status:</span>
                              <StatusDot status={selectedCompany.status || 'Active'} />
                           </div>
                           {selectedCompany.location && (
                             <div className="flex justify-between">
                                <span className="text-gray-500 font-medium">Location:</span>
                                <span className="text-[#111] text-right max-w-[150px]">{selectedCompany.location.split(',')[0]}</span>
                             </div>
                           )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-100">
                           {selectedCompany.website && (
                             <a href={selectedCompany.website} target="_blank" rel="noreferrer" className="w-9 h-9 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
                                <ExternalLink size={18}/>
                             </a>
                           )}
                           <a href="#" className="w-9 h-9 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 flex items-center justify-center text-[#0077b5] transition-colors">
                              <Linkedin size={18}/>
                           </a>
                           <a href="#" className="w-9 h-9 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 flex items-center justify-center text-[#1da1f2] transition-colors">
                              <Twitter size={18}/>
                           </a>
                           <a href="#" className="w-9 h-9 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 flex items-center justify-center text-[#4267B2] transition-colors">
                              <Facebook size={18}/>
                           </a>
                           <a href="#" className="w-9 h-9 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 flex items-center justify-center text-[#333] transition-colors">
                              <Github size={18}/>
                           </a>
                        </div>
                    </div>
                 </div>
              </div>

              {/* Footer */}
              <div className="mt-24 pt-12 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-8 pb-12">
                 <div className="bg-[#f26522] w-[50px] h-[50px] flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">O</span>
                 </div>
                 <div className="flex flex-wrap gap-x-8 gap-y-4 justify-center font-medium text-[#333]">
                    <div className="flex flex-col gap-3">
                       <span className="font-bold text-[17px] mb-1">About</span>
                       <a href="#" className="text-[15px] hover:text-[#f26522]">We welcome every founder</a>
                       <a href="#" className="text-[15px] hover:text-[#f26522]">This platform exists to make discovery open</a>
                       <a href="#" className="text-[15px] hover:text-[#f26522]">If you build you get listed</a>
                    </div>
                    <div className="flex flex-col gap-3">
                       <span className="font-bold text-[17px] mb-1">Directory</span>
                       <a href="#" className="text-[15px] hover:text-[#f26522]">Startup Directory</a>
                       <a href="#" className="text-[15px] hover:text-[#f26522]">Startup Jobs board</a>
                       <a href="#" className="text-[15px] hover:text-[#f26522]">Community</a>
                    </div>
                    <div className="flex flex-col gap-3">
                       <span className="font-bold text-[17px] mb-1">Resources</span>
                       <a href="#" className="text-[15px] hover:text-[#f26522]" onClick={(e) => { e.preventDefault(); handlePageChange('submit'); }}>Submit Your Startup</a>
                       <a href="#" className="text-[15px] hover:text-[#f26522]">Contact</a>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <span className="text-xl font-medium">If you are building something, you belong here.</span>
                    <button className="bg-[#f26522] text-white px-4 py-1.5 rounded font-bold hover:bg-[#d9531e]" onClick={() => handlePageChange('submit')}>Submit your startup</button>
                 </div>
              </div>

              <div className="text-center text-gray-500 text-sm pb-8">
                 © 2025 Open Startup Directory
              </div>

           </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default App;
