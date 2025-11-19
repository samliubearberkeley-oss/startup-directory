import insforge from '../lib/insforge';

// Companies API
export const companiesAPI = {
  // Get all companies with filters
  async getAll(filters = {}) {
    let query = insforge.database.from('companies').select('*');
    
    if (filters.batch && filters.batch !== 'All') {
      query = query.eq('batch', filters.batch);
    }
    
    if (filters.industry && filters.industry !== 'All') {
      query = query.eq('industry', filters.industry);
    }
    
    if (filters.region && filters.region !== 'Anywhere') {
      query = query.eq('region', filters.region);
    }
    
    if (filters.isTop) {
      query = query.eq('is_top', true);
    }
    
    if (filters.hiring) {
      query = query.eq('hiring', true);
    }
    
    if (filters.search) {
      // Use ilike for case-insensitive search on name or description
      const searchTerm = `%${filters.search}%`;
      query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get company by ID with related data
  async getById(id) {
    const { data, error } = await insforge.database
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    // Get founders
    const { data: founders } = await insforge.database
      .from('founders')
      .select('*')
      .eq('company_id', id);
    
    // Get jobs
    const { data: jobs } = await insforge.database
      .from('jobs')
      .select('*')
      .eq('company_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    // Get news
    const { data: news } = await insforge.database
      .from('news')
      .select('*')
      .eq('company_id', id)
      .order('date', { ascending: false })
      .limit(10);
    
    return {
      ...data,
      founders: founders || [],
      jobs: jobs || [],
      news: news || []
    };
  },

  // Get statistics
  async getStats() {
    // Get total count
    const { count: totalCount } = await insforge.database
      .from('companies')
      .select('*', { count: 'exact', head: true });
    
    // Get top companies count
    const { count: topCount } = await insforge.database
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('is_top', true);
    
    // Get hiring count
    const { count: hiringCount } = await insforge.database
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('hiring', true);
    
    // Get nonprofit count (assuming industry = 'Nonprofit')
    const { count: nonprofitCount } = await insforge.database
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('industry', 'Nonprofit');
    
    // Get counts by batch/stage
    const { data: batchData } = await insforge.database
      .from('companies')
      .select('batch');
    
    const batchCounts = {};
    if (batchData) {
      batchData.forEach(company => {
        if (company.batch) {
          batchCounts[company.batch] = (batchCounts[company.batch] || 0) + 1;
        }
      });
    }
    
    // Get counts by industry
    const { data: industryData } = await insforge.database
      .from('companies')
      .select('industry');
    
    const industryCounts = {};
    if (industryData) {
      industryData.forEach(company => {
        if (company.industry) {
          industryCounts[company.industry] = (industryCounts[company.industry] || 0) + 1;
        }
      });
    }
    
    // Get counts by region
    const { data: regionData } = await insforge.database
      .from('companies')
      .select('region');
    
    const regionCounts = {};
    if (regionData) {
      regionData.forEach(company => {
        if (company.region) {
          regionCounts[company.region] = (regionCounts[company.region] || 0) + 1;
        }
      });
    }
    
    return {
      total: totalCount || 0,
      topCompanies: topCount || 0,
      hiring: hiringCount || 0,
      nonprofit: nonprofitCount || 0,
      batchCounts,
      industryCounts,
      regionCounts
    };
  },

  // Create company (from submission)
  async create(companyData) {
    const { data, error } = await insforge.database
      .from('companies')
      .insert([companyData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Founders API
export const foundersAPI = {
  async getByCompanyId(companyId) {
    const { data, error } = await insforge.database
      .from('founders')
      .select('*')
      .eq('company_id', companyId);
    
    if (error) throw error;
    return data || [];
  },

  async create(founderData) {
    const { data, error } = await insforge.database
      .from('founders')
      .insert([founderData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Jobs API
export const jobsAPI = {
  async getByCompanyId(companyId) {
    const { data, error } = await insforge.database
      .from('jobs')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};

// Submissions API
export const submissionsAPI = {
  /**
   * Check if a company already exists (by name or website)
   */
  async checkDuplicate(companyName, website = null) {
    try {
      const companyNameLower = companyName.toLowerCase().trim();
      
      // Check in submissions table - get all and filter in memory for case-insensitive match
      const { data: allSubmissions, error: submissionsError } = await insforge.database
        .from('submissions')
        .select('id, company_name, website, status');
      
      if (submissionsError) {
        console.warn('Error checking submissions:', submissionsError);
      }
      
      // Check for duplicate company name in submissions
      if (allSubmissions && allSubmissions.length > 0) {
        const duplicateByName = allSubmissions.find(sub => 
          sub.company_name && sub.company_name.toLowerCase().trim() === companyNameLower
        );
        
        if (duplicateByName) {
          return {
            exists: true,
            type: 'submission',
            message: `A submission for "${companyName}" already exists. Please wait for it to be processed.`
          };
        }
      }
      
      // Check in companies table
      const { data: allCompanies, error: companiesError } = await insforge.database
        .from('companies')
        .select('id, name, website');
      
      if (companiesError) {
        console.warn('Error checking companies:', companiesError);
      }
      
      // Check for duplicate company name in companies
      if (allCompanies && allCompanies.length > 0) {
        const duplicateByName = allCompanies.find(comp => 
          comp.name && comp.name.toLowerCase().trim() === companyNameLower
        );
        
        if (duplicateByName) {
          return {
            exists: true,
            type: 'company',
            message: `"${companyName}" is already listed in the directory.`
          };
        }
      }
      
      // If website provided, also check by website
      if (website) {
        const websiteNormalized = website.toLowerCase().trim().replace(/\/$/, '');
        
        // Check submissions by website
        if (allSubmissions && allSubmissions.length > 0) {
          const duplicateByWebsite = allSubmissions.find(sub => {
            if (!sub.website) return false;
            const subWebsite = sub.website.toLowerCase().trim().replace(/\/$/, '');
            return subWebsite === websiteNormalized;
          });
          
          if (duplicateByWebsite) {
            return {
              exists: true,
              type: 'submission',
              message: `A submission for this website (${website}) already exists.`
            };
          }
        }
        
        // Check companies by website
        if (allCompanies && allCompanies.length > 0) {
          const duplicateByWebsite = allCompanies.find(comp => {
            if (!comp.website) return false;
            const compWebsite = comp.website.toLowerCase().trim().replace(/\/$/, '');
            return compWebsite === websiteNormalized;
          });
          
          if (duplicateByWebsite) {
            return {
              exists: true,
              type: 'company',
              message: `This website (${website}) is already listed in the directory.`
            };
          }
        }
      }
      
      return { exists: false };
    } catch (error) {
      console.error('Error checking duplicates:', error);
      // If check fails, allow submission (fail open)
      return { exists: false };
    }
  },

  async create(submissionData) {
    // Check for duplicates before creating
    const duplicateCheck = await this.checkDuplicate(
      submissionData.company_name,
      submissionData.website
    );
    
    if (duplicateCheck.exists) {
      const error = new Error(duplicateCheck.message);
      error.code = 'DUPLICATE_SUBMISSION';
      throw error;
    }
    
    // Create submission record
    const { data: submission, error: submissionError } = await insforge.database
      .from('submissions')
      .insert([submissionData])
      .select()
      .single();
    
    if (submissionError) throw submissionError;
    
    // Immediately create company record so it shows in directory
    try {
      // Check if company already exists (by name)
      const { data: existingCompanies } = await insforge.database
        .from('companies')
        .select('id, name')
        .ilike('name', submissionData.company_name);
      
      if (existingCompanies && existingCompanies.length > 0) {
        console.log('Company already exists:', existingCompanies[0].name);
        // Company already exists, skip creation
      } else {
        const companyData = {
          name: submissionData.company_name,
          description: submissionData.description,
          website: submissionData.website || null,
          location: submissionData.location || null,
          industry: submissionData.industry || null,
          founded: submissionData.founded || null,
          team_size: submissionData.team_size || null,
          logo_url: submissionData.logo_url || null,
          logo_fallback: submissionData.company_name ? submissionData.company_name.charAt(0).toUpperCase() : null,
          status: 'Active',
          is_top: false,
          hiring: false
        };

        const { data: company, error: companyError } = await insforge.database
          .from('companies')
          .insert([companyData])
          .select()
          .single();

        if (companyError) {
          console.error('Error creating company:', companyError);
          console.error('Company data:', companyData);
          // Throw error so user knows something went wrong
          throw new Error(`Failed to create company: ${companyError.message}`);
        } else {
          console.log('Company created successfully:', company.id);
          
          // If founder information is provided, create founder record
          if (submissionData.founder_name && company) {
            try {
              const founderData = {
                company_id: company.id,
                name: submissionData.founder_name,
                role: submissionData.founder_role || null,
                bio: null,
                image_url: null,
                linkedin_url: null
              };

              const { error: founderError } = await insforge.database
                .from('founders')
                .insert([founderData]);
              
              if (founderError) {
                console.error('Error creating founder:', founderError);
                // Don't throw - company was created successfully
              } else {
                console.log('Founder created successfully');
              }
            } catch (founderError) {
              console.error('Error creating founder:', founderError);
              // Don't throw - company was created successfully
            }
          }
        }
      }
    } catch (error) {
      console.error('Error creating company from submission:', error);
      // Re-throw so user knows about the issue
      throw error;
    }
    
    return submission;
  },

  async getAll(status = null) {
    let query = insforge.database.from('submissions').select('*');
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('submitted_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};

