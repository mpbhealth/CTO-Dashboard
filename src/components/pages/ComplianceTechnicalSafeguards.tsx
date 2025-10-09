import React from 'react';
import { Shield, Lock, Key, Database, Eye, Server, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface SafeguardControl {
  id: string;
  name: string;
  description: string;
  category: 'Access' | 'Audit' | 'Integrity' | 'Transmission';
  status: 'implemented' | 'partial' | 'planned';
  icon: any;
}

const ComplianceTechnicalSafeguards: React.FC = () => {
  const controls: SafeguardControl[] = [
    {
      id: '1',
      name: 'Unique User IDs',
      description: 'Each user has a unique identifier for system access',
      category: 'Access',
      status: 'implemented',
      icon: Key,
    },
    {
      id: '2',
      name: 'Emergency Access Procedures',
      description: 'Documented procedures for obtaining ePHI during emergencies',
      category: 'Access',
      status: 'implemented',
      icon: AlertCircle,
    },
    {
      id: '3',
      name: 'Automatic Logoff',
      description: 'Sessions terminate after period of inactivity',
      category: 'Access',
      status: 'implemented',
      icon: Lock,
    },
    {
      id: '4',
      name: 'Encryption at Rest',
      description: 'All ePHI is encrypted when stored (AES-256)',
      category: 'Access',
      status: 'implemented',
      icon: Database,
    },
    {
      id: '5',
      name: 'Audit Controls',
      description: 'Hardware, software, and procedures record and examine activity',
      category: 'Audit',
      status: 'implemented',
      icon: Eye,
    },
    {
      id: '6',
      name: 'Integrity Controls',
      description: 'Mechanisms to ensure ePHI is not improperly altered or destroyed',
      category: 'Integrity',
      status: 'implemented',
      icon: CheckCircle2,
    },
    {
      id: '7',
      name: 'Transmission Security (TLS)',
      description: 'Encryption for data in transit (TLS 1.2+)',
      category: 'Transmission',
      status: 'implemented',
      icon: Server,
    },
    {
      id: '8',
      name: 'Multi-Factor Authentication',
      description: 'MFA required for all system access',
      category: 'Access',
      status: 'partial',
      icon: Key,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'planned':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'planned':
        return <XCircle className="w-5 h-5 text-gray-600" />;
      default:
        return null;
    }
  };

  const categories = ['Access', 'Audit', 'Integrity', 'Transmission'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Shield className="w-8 h-8 text-purple-600" />
            <span>Technical Safeguards</span>
          </h1>
          <p className="text-gray-600 mt-1">
            HIPAA Security Rule technical safeguards implementation status
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg border-2 border-green-200 p-4">
          <p className="text-sm text-gray-600">Implemented</p>
          <p className="text-2xl font-bold text-green-800">
            {controls.filter(c => c.status === 'implemented').length}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg border-2 border-yellow-200 p-4">
          <p className="text-sm text-gray-600">Partial</p>
          <p className="text-2xl font-bold text-yellow-800">
            {controls.filter(c => c.status === 'partial').length}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg border-2 border-gray-200 p-4">
          <p className="text-sm text-gray-600">Planned</p>
          <p className="text-2xl font-bold text-gray-800">
            {controls.filter(c => c.status === 'planned').length}
          </p>
        </div>
      </div>

      {/* Controls by Category */}
      {categories.map((category) => {
        const categoryControls = controls.filter(c => c.category === category);
        
        return (
          <div key={category} className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <span>{category} Controls</span>
            </h2>
            
            <div className="space-y-3">
              {categoryControls.map((control) => {
                const Icon = control.icon;
                return (
                  <div
                    key={control.id}
                    className="flex items-start space-x-4 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                  >
                    <div className="flex-shrink-0 p-2 bg-purple-50 rounded-lg">
                      <Icon className="w-6 h-6 text-purple-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{control.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{control.description}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(control.status)}
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(control.status)}`}>
                        {control.status.charAt(0).toUpperCase() + control.status.slice(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Encryption Details */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Lock className="w-5 h-5 text-purple-600" />
          <span>Encryption Standards</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <h3 className="font-medium text-gray-900 mb-2">Data at Rest</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• AES-256 encryption for all databases</li>
              <li>• Encrypted backups</li>
              <li>• Full disk encryption on servers</li>
              <li>• Key rotation every 12 months</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <h3 className="font-medium text-gray-900 mb-2">Data in Transit</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• TLS 1.2 or higher for all connections</li>
              <li>• VPN for remote access</li>
              <li>• SFTP for file transfers</li>
              <li>• Certificate management and renewal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceTechnicalSafeguards;

