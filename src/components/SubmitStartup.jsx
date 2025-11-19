import React, { useState } from 'react';
import { X, ArrowLeft, Sparkles, Loader, CheckCircle, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';
import { submissionsAPI } from '../services/api';
import { aiService } from '../services/aiService';
import insforge from '../lib/insforge';

const SubmitStartup = ({ onClose, onBack, onPageChange, onSubmissionSuccess }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    description: '',
    website: '',
    location: '',
    industry: '',
    founded: '',
    team_size: '',
    founder_name: '',
    founder_email: '',
    founder_role: '',
    logo_url: ''
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'
  const [errorMessage, setErrorMessage] = useState('');

  // AI parsing states
  const [aiInput, setAiInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload an image file');
      setSubmitStatus('error');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size must be less than 5MB');
      setSubmitStatus('error');
      return;
    }

    setIsUploadingLogo(true);
    setErrorMessage('');
    setSubmitStatus(null);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to InsForge storage
      // Generate a unique filename to avoid conflicts
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `logo-${timestamp}-${randomStr}.${fileExtension}`;

      const { data, error } = await insforge.storage
        .from('startup-logos')
        .upload(fileName, file);

      if (error) {
        // If upload fails due to foreign key constraint, try without setting uploaded_by
        // This might happen if the backend tries to set uploaded_by automatically
        console.error('Storage upload error:', error);
        
        // Try alternative: use direct API call with FormData
        try {
          const formDataToUpload = new FormData();
          formDataToUpload.append('file', file);
          formDataToUpload.append('key', fileName);

          const baseUrl = 'https://7ratu4x5.us-east.insforge.app';
          const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTM0NzF9.ALQ2k9V6hrERL978f-1cstz8DR1sXZ1qaQ42_EfEc98';

          // Try POST method first (for new objects)
          let response = await fetch(
            `${baseUrl}/api/storage/buckets/startup-logos/objects`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${anonKey}`
              },
              body: formDataToUpload
            }
          );

          // If POST fails, try PUT
          if (!response.ok) {
            response = await fetch(
              `${baseUrl}/api/storage/buckets/startup-logos/objects/${encodeURIComponent(fileName)}`,
              {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${anonKey}`,
                  'Content-Type': file.type
                },
                body: file
              }
            );
          }

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed: ${response.statusText}. ${errorText}`);
          }

          const url = `${baseUrl}/api/storage/buckets/startup-logos/objects/${encodeURIComponent(fileName)}`;
          
          setFormData(prev => ({
            ...prev,
            logo_url: url
          }));
          setLogoFile(file);
          return;
        } catch (fallbackError) {
          console.error('Fallback upload also failed:', fallbackError);
          throw new Error(error.message || 'Failed to upload logo. Please try again or submit without a logo.');
        }
      }

      if (data && data.url) {
        setFormData(prev => ({
          ...prev,
          logo_url: data.url
        }));
        setLogoFile(file);
      } else {
        throw new Error('Upload succeeded but no URL returned');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      setErrorMessage(error.message || 'Failed to upload logo. Please try again.');
      setSubmitStatus('error');
      setLogoPreview(null);
      setLogoFile(null);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleAiParse = async () => {
    if (!aiInput.trim()) {
      setParseError('Please paste some company information first');
      return;
    }

    setIsParsing(true);
    setParseError('');

    try {
      // Extract website URL if present in the text
      const urlMatch = aiInput.match(/https?:\/\/[^\s]+/);
      const websiteUrl = urlMatch ? urlMatch[0] : null;

      const parsedData = await aiService.parseWithWebSearch(aiInput, websiteUrl);
      
      // Fill the form with parsed data
      setFormData(prev => ({
        ...prev,
        ...parsedData
      }));

      // Clear the input after successful parse
      setAiInput('');
    } catch (error) {
      console.error('AI parsing error:', error);
      setParseError(error.message || 'Failed to parse. Please check your API key or try again.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage('');

    try {
      // Validate required fields
      if (!formData.company_name || !formData.description) {
        throw new Error('Company name and description are required');
      }

      // Validate email format
      if (formData.founder_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.founder_email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate website URL format
      if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
        throw new Error('Please enter a valid website URL (starting with http:// or https://)');
      }

      const submissionData = {
        company_name: formData.company_name.trim(),
        description: formData.description.trim(),
        website: formData.website.trim() || null,
        location: formData.location.trim() || null,
        industry: formData.industry.trim() || null,
        founded: formData.founded ? parseInt(formData.founded) : null,
        team_size: formData.team_size ? parseInt(formData.team_size) : null,
        founder_name: formData.founder_name.trim() || null,
        founder_email: formData.founder_email.trim() || null,
        founder_role: formData.founder_role.trim() || null,
        logo_url: formData.logo_url || null,
        status: 'pending'
      };

      // Check for duplicates (this is also done in API, but we show a better error here)
      const duplicateCheck = await submissionsAPI.checkDuplicate(
        submissionData.company_name,
        submissionData.website
      );

      if (duplicateCheck.exists) {
        throw new Error(duplicateCheck.message);
      }

      await submissionsAPI.create(submissionData);
      
      // Show success message
      setSubmitStatus('success');
      
      // Notify parent component to refresh directory data
      if (onSubmissionSuccess) {
        onSubmissionSuccess();
      }
      
      // Reset form after showing success
      setFormData({
        company_name: '',
        description: '',
        website: '',
        location: '',
        industry: '',
        founded: '',
        team_size: '',
        founder_name: '',
        founder_email: '',
        founder_role: '',
        logo_url: ''
      });
      
      // Clear logo
      setLogoFile(null);
      setLogoPreview(null);
      
      // Clear AI input as well
      setAiInput('');
      setParseError('');
      
    } catch (error) {
      console.error('Submission error:', error);
      
      // Always set error status and message
      setSubmitStatus('error');
      
      // Extract error message
      let errorMsg = 'Failed to submit. Please try again.';
      
      if (error.message) {
        errorMsg = error.message;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      }
      
      setErrorMessage(errorMsg);
      
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#fdfdf8] overflow-y-auto">
      {/* Navbar */}
      <nav className="bg-[#fdfdf8] border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-5 h-[70px] flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="bg-[#f26522] w-[50px] h-[50px] flex items-center justify-center">
              <span className="text-white text-3xl font-bold">O</span>
            </div>
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
                    item.page === 'submit'
                      ? 'text-[#f26522] font-semibold'
                      : 'text-[#333] hover:text-[#f26522]'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (item.page === 'submit') {
                      // Already on submit page, do nothing
                      return;
                    }
                    if (onPageChange) {
                      onPageChange(item.page);
                    } else if (onClose) {
                      onClose();
                    }
                  }}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack || onClose} 
              className="hidden lg:flex items-center gap-2 text-[15px] text-[#333] hover:text-[#f26522]"
            >
              <ArrowLeft size={18} />
              Back to Directory
            </button>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-black">
              <X size={28} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-5 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-[42px] font-bold text-[#111] mb-4 tracking-tight leading-tight">
            Submit Your Startup
          </h1>
          <p className="text-[18px] text-[#333] leading-relaxed">
            Share your startup with the community. No selection. No permission. If you build, you belong here.
          </p>
        </div>

        {/* Success Message */}
        {submitStatus === 'success' && (
          <div className="mb-8 p-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-white" size={32} />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-[24px] font-bold text-green-900 mb-3">
                  🎉 Submission Successful!
                </h3>
                <p className="text-[16px] text-green-800 mb-4 leading-relaxed">
                  Thank you for submitting your startup! Your submission has been received and will be reviewed shortly.
                </p>
                <div className="bg-white/60 rounded-lg p-4 mt-4">
                  <p className="text-[14px] text-green-700 font-medium mb-2">What happens next?</p>
                  <ul className="text-[14px] text-green-700 space-y-1 list-disc list-inside">
                    <li>Your startup will be added to the directory within 24 hours</li>
                    <li>No selection process - everyone gets listed</li>
                    <li>You can submit another startup anytime</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setSubmitStatus(null);
                    setFormData({
                      company_name: '',
                      description: '',
                      website: '',
                      location: '',
                      industry: '',
                      founded: '',
                      team_size: '',
                      founder_name: '',
                      founder_email: '',
                      founder_role: '',
                      logo_url: ''
                    });
                    setLogoFile(null);
                    setLogoPreview(null);
                  }}
                  className="mt-6 px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold text-[15px] hover:bg-green-700 transition-colors"
                >
                  Submit Another Startup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {submitStatus === 'error' && errorMessage && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
              <div className="flex-1">
                <h3 className="text-[18px] font-bold text-red-800 mb-2">Submission Failed</h3>
                <p className="text-[15px] text-red-700 leading-relaxed">{errorMessage}</p>
                {(errorMessage.includes('already') || errorMessage.includes('exists')) && (
                  <div className="mt-4 p-3 bg-red-100 rounded border border-red-200">
                    <p className="text-[13px] text-red-800">
                      <strong>Note:</strong> Each company can only be submitted once. If you believe this is an error, please contact support.
                    </p>
                  </div>
                )}
                <button
                  onClick={() => {
                    setSubmitStatus(null);
                    setErrorMessage('');
                  }}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-[14px] font-medium hover:bg-red-700 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Form */}
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
              <div className="space-y-6">
                {/* Company Information Section */}
                <div>
                  <h2 className="text-[24px] font-bold text-[#111] mb-6">Company Information</h2>
                  
                  <div className="space-y-4">
                    {/* Logo Upload */}
                    <div>
                      <label className="block text-[15px] font-medium text-[#333] mb-2">
                        Company Logo
                      </label>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {logoPreview ? (
                            <div className="w-24 h-24 rounded-lg border-2 border-gray-200 overflow-hidden bg-white flex items-center justify-center">
                              <img 
                                src={logoPreview} 
                                alt="Logo preview" 
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                              <ImageIcon className="text-gray-400" size={32} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <label
                            htmlFor="logo_upload"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[4px] text-[15px] font-medium text-[#333] hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            {isUploadingLogo ? (
                              <>
                                <Loader className="animate-spin" size={18} />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload size={18} />
                                Upload Logo
                              </>
                            )}
                          </label>
                          <input
                            type="file"
                            id="logo_upload"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            disabled={isUploadingLogo}
                          />
                          <p className="text-[12px] text-gray-500 mt-2">
                            PNG, JPG or GIF. Max 5MB.
                          </p>
                          {formData.logo_url && !logoPreview && (
                            <p className="text-[12px] text-green-600 mt-1">✓ Logo uploaded</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="company_name" className="block text-[15px] font-medium text-[#333] mb-2">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="company_name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        required
                        className="w-full bg-white border border-gray-300 rounded-[4px] py-3 px-4 text-[16px] focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522]"
                        placeholder="e.g., Instacart"
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-[15px] font-medium text-[#333] mb-2">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows="4"
                        className="w-full bg-white border border-gray-300 rounded-[4px] py-3 px-4 text-[16px] focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522] resize-none"
                        placeholder="Brief description of what your startup does"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="website" className="block text-[15px] font-medium text-[#333] mb-2">
                          Website
                        </label>
                        <input
                          type="url"
                          id="website"
                          name="website"
                          value={formData.website}
                          onChange={handleChange}
                          className="w-full bg-white border border-gray-300 rounded-[4px] py-3 px-4 text-[16px] focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522]"
                          placeholder="https://example.com"
                        />
                      </div>

                      <div>
                        <label htmlFor="location" className="block text-[15px] font-medium text-[#333] mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          className="w-full bg-white border border-gray-300 rounded-[4px] py-3 px-4 text-[16px] focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522]"
                          placeholder="e.g., San Francisco, CA, USA"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="industry" className="block text-[15px] font-medium text-[#333] mb-2">
                          Industry
                        </label>
                        <select
                          id="industry"
                          name="industry"
                          value={formData.industry}
                          onChange={handleChange}
                          className="w-full bg-white border border-gray-300 rounded-[4px] py-3 px-4 text-[16px] focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522]"
                        >
                          <option value="">Select industry</option>
                          <option value="B2B">B2B</option>
                          <option value="Consumer">Consumer</option>
                          <option value="Fintech">Fintech</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Education">Education</option>
                          <option value="Industrials">Industrials</option>
                          <option value="Nonprofit">Nonprofit</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="founded" className="block text-[15px] font-medium text-[#333] mb-2">
                          Founded Year
                        </label>
                        <input
                          type="number"
                          id="founded"
                          name="founded"
                          value={formData.founded}
                          onChange={handleChange}
                          min="1900"
                          max={new Date().getFullYear()}
                          className="w-full bg-white border border-gray-300 rounded-[4px] py-3 px-4 text-[16px] focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522]"
                          placeholder="e.g., 2020"
                        />
                      </div>

                      <div>
                        <label htmlFor="team_size" className="block text-[15px] font-medium text-[#333] mb-2">
                          Team Size
                        </label>
                        <input
                          type="number"
                          id="team_size"
                          name="team_size"
                          value={formData.team_size}
                          onChange={handleChange}
                          min="1"
                          className="w-full bg-white border border-gray-300 rounded-[4px] py-3 px-4 text-[16px] focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522]"
                          placeholder="e.g., 50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Founder Information Section */}
                <div className="pt-6 border-t border-gray-200">
                  <h2 className="text-[24px] font-bold text-[#111] mb-6">Founder Information</h2>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="founder_name" className="block text-[15px] font-medium text-[#333] mb-2">
                          Founder Name
                        </label>
                        <input
                          type="text"
                          id="founder_name"
                          name="founder_name"
                          value={formData.founder_name}
                          onChange={handleChange}
                          className="w-full bg-white border border-gray-300 rounded-[4px] py-3 px-4 text-[16px] focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522]"
                          placeholder="e.g., John Doe"
                        />
                      </div>

                      <div>
                        <label htmlFor="founder_email" className="block text-[15px] font-medium text-[#333] mb-2">
                          Founder Email
                        </label>
                        <input
                          type="email"
                          id="founder_email"
                          name="founder_email"
                          value={formData.founder_email}
                          onChange={handleChange}
                          className="w-full bg-white border border-gray-300 rounded-[4px] py-3 px-4 text-[16px] focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522]"
                          placeholder="founder@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="founder_role" className="block text-[15px] font-medium text-[#333] mb-2">
                        Founder Role
                      </label>
                      <input
                        type="text"
                        id="founder_role"
                        name="founder_role"
                        value={formData.founder_role}
                        onChange={handleChange}
                        className="w-full bg-white border border-gray-300 rounded-[4px] py-3 px-4 text-[16px] focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522]"
                        placeholder="e.g., CEO & Co-Founder"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#f26522] text-white px-6 py-4 rounded font-bold text-[16px] hover:bg-[#d9531e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Your Startup'}
                  </button>
                  <p className="text-[13px] text-gray-500 mt-4 text-center">
                    By submitting, you agree to have your startup listed in our open directory.
                  </p>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column - AI Parser */}
          <div className="w-full lg:w-[400px] flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm sticky top-[100px]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#f26522] rounded-lg flex items-center justify-center">
                  <Sparkles className="text-white" size={20} />
                </div>
                <h3 className="text-[20px] font-bold text-[#111]">AI Auto Fill</h3>
              </div>
              
              <p className="text-[14px] text-[#666] mb-4 leading-relaxed">
                Paste any company information, website URL, or company name. AI will search the web and automatically fill the form.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[14px] font-medium text-[#333] mb-2">
                    Paste Company Info
                  </label>
                  <textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    rows="8"
                    className="w-full bg-gray-50 border border-gray-300 rounded-[4px] py-3 px-4 text-[14px] focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522] resize-none"
                    placeholder="Examples:
• https://instacart.com
• Instacart - grocery delivery startup
• Just paste any info and AI will search & fill!"
                  />
                </div>

                {parseError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded text-[13px] text-red-700">
                    <div className="font-semibold mb-2">{parseError}</div>
                    {parseError.includes('API key') && (
                      <div className="mt-2 pt-2 border-t border-red-200">
                        <p className="text-[12px] mb-1">To enable AI parsing:</p>
                        <ol className="text-[12px] list-decimal list-inside space-y-1">
                          <li>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="underline">platform.openai.com/api-keys</a></li>
                          <li>Edit the <code className="bg-red-100 px-1 rounded">.env</code> file in the project root</li>
                          <li>Replace <code className="bg-red-100 px-1 rounded">your_openai_api_key_here</code> with your actual key</li>
                          <li>Restart the dev server</li>
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleAiParse}
                  disabled={isParsing || !aiInput.trim()}
                  className="w-full bg-[#f26522] text-white px-4 py-3 rounded font-bold text-[15px] hover:bg-[#d9531e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isParsing ? (
                    <>
                      <Loader className="animate-spin" size={18} />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Auto Fill Form
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-gray-200">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg mb-3">
                    <p className="text-[12px] text-blue-800 font-semibold flex items-center gap-2">
                      <Sparkles size={14} className="text-blue-600" />
                      Powered by GPT-5 via Insforge AI
                    </p>
                  </div>
                  <p className="text-[12px] text-gray-500 leading-relaxed">
                    <strong>💡 How it works:</strong>
                    <br/>• Paste a URL → AI fetches and analyzes the website
                    <br/>• Paste company name → AI searches the web for info
                    <br/>• Paste any text → AI extracts and completes missing details
                    <br/><br/>
                    The smarter you feed it, the better it fills!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitStartup;
