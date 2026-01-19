import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  UserCheck,
  Search,
  Plus,
  Filter,
  MapPin,
  Phone,
  Star,
  Building2,
  Stethoscope,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  specialty: string;
  type: 'physician' | 'facility' | 'specialist' | 'pharmacy' | 'lab';
  status: 'active' | 'pending' | 'inactive';
  location: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  rating: number;
  reviewCount: number;
  acceptingPatients: boolean;
  networkTier: 'preferred' | 'standard' | 'out-of-network';
  languages: string[];
  lastUpdated: string;
}

// Demo provider data
const demoProviders: Provider[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson, MD',
    specialty: 'Family Medicine',
    type: 'physician',
    status: 'active',
    location: { address: '123 Medical Center Dr', city: 'Miami', state: 'FL', zip: '33101' },
    contact: { phone: '(305) 555-0101', email: 'sjohnson@medcenter.com', website: 'www.drsjohnson.com' },
    rating: 4.8,
    reviewCount: 127,
    acceptingPatients: true,
    networkTier: 'preferred',
    languages: ['English', 'Spanish'],
    lastUpdated: '2025-01-05'
  },
  {
    id: '2',
    name: 'Miami General Hospital',
    specialty: 'General Hospital',
    type: 'facility',
    status: 'active',
    location: { address: '500 Hospital Blvd', city: 'Miami', state: 'FL', zip: '33102' },
    contact: { phone: '(305) 555-0200', email: 'info@miamigeneral.com', website: 'www.miamigeneral.com' },
    rating: 4.5,
    reviewCount: 892,
    acceptingPatients: true,
    networkTier: 'preferred',
    languages: ['English', 'Spanish', 'Portuguese'],
    lastUpdated: '2025-01-06'
  },
  {
    id: '3',
    name: 'Dr. Michael Chen, DDS',
    specialty: 'Dentistry',
    type: 'specialist',
    status: 'active',
    location: { address: '789 Smile Ave', city: 'Fort Lauderdale', state: 'FL', zip: '33301' },
    contact: { phone: '(954) 555-0303', email: 'mchen@brightsmile.com' },
    rating: 4.9,
    reviewCount: 234,
    acceptingPatients: true,
    networkTier: 'standard',
    languages: ['English', 'Mandarin'],
    lastUpdated: '2025-01-04'
  },
  {
    id: '4',
    name: 'CVS Pharmacy #4521',
    specialty: 'Retail Pharmacy',
    type: 'pharmacy',
    status: 'active',
    location: { address: '456 Main St', city: 'Miami', state: 'FL', zip: '33103' },
    contact: { phone: '(305) 555-0404', email: 'rx4521@cvs.com' },
    rating: 4.2,
    reviewCount: 156,
    acceptingPatients: true,
    networkTier: 'preferred',
    languages: ['English', 'Spanish'],
    lastUpdated: '2025-01-07'
  },
  {
    id: '5',
    name: 'Quest Diagnostics - Downtown',
    specialty: 'Clinical Laboratory',
    type: 'lab',
    status: 'active',
    location: { address: '321 Lab Lane', city: 'Miami', state: 'FL', zip: '33104' },
    contact: { phone: '(305) 555-0505', email: 'downtown@questdiagnostics.com', website: 'www.questdiagnostics.com' },
    rating: 4.3,
    reviewCount: 89,
    acceptingPatients: true,
    networkTier: 'preferred',
    languages: ['English', 'Spanish', 'Creole'],
    lastUpdated: '2025-01-06'
  },
  {
    id: '6',
    name: 'Dr. Emily Rodriguez, MD',
    specialty: 'Cardiology',
    type: 'specialist',
    status: 'pending',
    location: { address: '555 Heart Center Way', city: 'Coral Gables', state: 'FL', zip: '33146' },
    contact: { phone: '(305) 555-0606', email: 'erodriguez@heartcare.com' },
    rating: 4.7,
    reviewCount: 78,
    acceptingPatients: false,
    networkTier: 'standard',
    languages: ['English', 'Spanish'],
    lastUpdated: '2025-01-03'
  },
  {
    id: '7',
    name: 'Sunrise Urgent Care',
    specialty: 'Urgent Care',
    type: 'facility',
    status: 'active',
    location: { address: '888 Emergency Rd', city: 'Sunrise', state: 'FL', zip: '33351' },
    contact: { phone: '(954) 555-0707', email: 'info@sunriseurgent.com', website: 'www.sunriseurgent.com' },
    rating: 4.4,
    reviewCount: 312,
    acceptingPatients: true,
    networkTier: 'preferred',
    languages: ['English', 'Spanish', 'Portuguese'],
    lastUpdated: '2025-01-07'
  },
  {
    id: '8',
    name: 'Dr. James Wilson, DO',
    specialty: 'Orthopedics',
    type: 'specialist',
    status: 'inactive',
    location: { address: '999 Bone & Joint Dr', city: 'Boca Raton', state: 'FL', zip: '33431' },
    contact: { phone: '(561) 555-0808', email: 'jwilson@orthoclinic.com' },
    rating: 4.6,
    reviewCount: 145,
    acceptingPatients: false,
    networkTier: 'out-of-network',
    languages: ['English'],
    lastUpdated: '2024-12-15'
  }
];

export function ProviderDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [_selectedProvider, _setSelectedProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredProviders = useMemo(() => {
    return demoProviders.filter(provider => {
      const matchesSearch = 
        provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.location.city.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'all' || provider.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || provider.status === statusFilter;
      const matchesTier = tierFilter === 'all' || provider.networkTier === tierFilter;
      
      return matchesSearch && matchesType && matchesStatus && matchesTier;
    });
  }, [searchQuery, typeFilter, statusFilter, tierFilter]);

  const stats = useMemo(() => ({
    total: demoProviders.length,
    active: demoProviders.filter(p => p.status === 'active').length,
    pending: demoProviders.filter(p => p.status === 'pending').length,
    preferred: demoProviders.filter(p => p.networkTier === 'preferred').length,
  }), []);

  const getTypeIcon = (type: Provider['type']) => {
    switch (type) {
      case 'physician': return <UserCheck className="w-4 h-4" />;
      case 'facility': return <Building2 className="w-4 h-4" />;
      case 'specialist': return <Stethoscope className="w-4 h-4" />;
      case 'pharmacy': return <Plus className="w-4 h-4" />;
      case 'lab': return <Clock className="w-4 h-4" />;
      default: return <UserCheck className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Provider['status']) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'inactive': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getTierColor = (tier: Provider['networkTier']) => {
    switch (tier) {
      case 'preferred': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'standard': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'out-of-network': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <UserCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Provider Directory</h1>
            <p className="text-slate-600">Manage healthcare providers and facilities</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Provider</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-500">Total Providers</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
              <p className="text-sm text-slate-500">Active</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
              <p className="text-sm text-slate-500">Pending</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.preferred}</p>
              <p className="text-sm text-slate-500">Preferred Tier</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search providers by name, specialty, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-colors ${
              showFilters ? 'bg-teal-50 border-teal-200 text-teal-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Provider Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="all">All Types</option>
                <option value="physician">Physicians</option>
                <option value="specialist">Specialists</option>
                <option value="facility">Facilities</option>
                <option value="pharmacy">Pharmacies</option>
                <option value="lab">Laboratories</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Network Tier</label>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="all">All Tiers</option>
                <option value="preferred">Preferred</option>
                <option value="standard">Standard</option>
                <option value="out-of-network">Out of Network</option>
              </select>
            </div>
          </motion.div>
        )}
      </div>

      {/* Provider List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <p className="text-sm text-slate-600">
            Showing <span className="font-medium">{filteredProviders.length}</span> of{' '}
            <span className="font-medium">{demoProviders.length}</span> providers
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredProviders.length === 0 ? (
            <div className="p-12 text-center">
              <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No providers found</h3>
              <p className="text-slate-600">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            filteredProviders.map((provider, index) => (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Provider Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      provider.type === 'facility' ? 'bg-purple-100 text-purple-600' :
                      provider.type === 'pharmacy' ? 'bg-green-100 text-green-600' :
                      provider.type === 'lab' ? 'bg-orange-100 text-orange-600' :
                      'bg-teal-100 text-teal-600'
                    }`}>
                      {getTypeIcon(provider.type)}
                    </div>

                    {/* Provider Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{provider.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(provider.status)}`}>
                          {provider.status}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getTierColor(provider.networkTier)}`}>
                          {provider.networkTier}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 mb-2">{provider.specialty}</p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{provider.location.city}, {provider.location.state}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Phone className="w-4 h-4" />
                          <span>{provider.contact.phone}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-amber-500" />
                          <span>{provider.rating} ({provider.reviewCount} reviews)</span>
                        </span>
                        {provider.acceptingPatients ? (
                          <span className="flex items-center space-x-1 text-emerald-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Accepting patients</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 text-slate-400">
                            <XCircle className="w-4 h-4" />
                            <span>Not accepting</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        {provider.languages.map(lang => (
                          <span key={lang} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {provider.contact.website && (
                      <a
                        href={`https://${provider.contact.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Visit website"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

