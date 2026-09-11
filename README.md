# ARYX CEO

ARYX Chief Executive Officer workspace for mail, CRM, and company operations.

## 🚀 Features

### 📊 **Analytics & Insights**
- **Member Engagement**: Track user activity, feature usage, and engagement patterns
- **Member Retention**: Analyze churn rates, cohort analysis, and retention metrics
- **Advisor Performance**: Monitor sales performance, skill assessments, and conversion rates
- **System Analytics**: Comprehensive business intelligence and performance metrics

### 🛠️ **Development & Planning**
- **Tech Stack Management**: Track technologies, versions, and ownership
- **Roadmap Planning**: Strategic technology initiatives with dependencies
- **Roadmap Visualizer**: Interactive timeline with advanced filtering
- **Project Management**: Active project tracking with progress monitoring

### ⚙️ **Operations & Management**
- **Compliance Dashboard**: HIPAA, SOC 2, and security audit tracking
- **SaaS Spend Management**: Vendor costs, renewals, and budget optimization
- **AI Agents**: Manage AI agent configurations and prompts

### 🏗️ **Infrastructure & Monitoring**
- **Deployment Logs**: Track deployment history and status
- **API Status**: Monitor API health and response times
- **System Uptime**: Real-time system health and component monitoring

## 🎨 **Design Features**

### **Modern UI/UX**
- ✅ **Apple-level design aesthetics** with meticulous attention to detail
- ✅ **Framer Motion animations** for smooth transitions and micro-interactions
- ✅ **Responsive design** optimized for all screen sizes
- ✅ **Dark/light theme support** with consistent color system
- ✅ **Professional data visualizations** using Recharts

### **Interactive Elements**
- ✅ **Advanced filtering systems** with real-time search
- ✅ **Drag-and-drop interfaces** for roadmap management
- ✅ **Hover states and micro-interactions** for enhanced UX
- ✅ **Loading states and error handling** for production reliability

## 🔧 **Technical Stack**

### **Frontend**
- **React 18.3.1** - Modern React with hooks and concurrent features
- **TypeScript 5.5.3** - Type-safe development
- **Tailwind CSS 3.4.1** - Utility-first styling
- **Framer Motion 10.16.16** - Animation library
- **Recharts 2.8.0** - Data visualization
- **Lucide React 0.344.0** - Icon system

### **Backend & Database**
- **Supabase 2.39.0** - Backend-as-a-Service with PostgreSQL
- **Row Level Security (RLS)** - Secure data access
- **Real-time subscriptions** - Live data updates
- **Type-safe database queries** - Generated TypeScript types

### **Development Tools**
- **Vite 5.4.2** - Fast build tool and dev server
- **ESLint** - Code linting and quality
- **PostCSS & Autoprefixer** - CSS processing
- **TypeScript ESLint** - TypeScript-specific linting

## 📁 **Project Structure**

```
src/
├── components/
│   ├── pages/           # Dashboard pages
│   │   ├── Overview.tsx
│   │   ├── Analytics.tsx
│   │   ├── MemberEngagement.tsx
│   │   ├── MemberRetention.tsx
│   │   ├── AdvisorPerformance.tsx
│   │   ├── TechStack.tsx
│   │   ├── Roadmap.tsx
│   │   ├── RoadVisualizerWithFilters.tsx
│   │   ├── Projects.tsx
│   │   ├── Compliance.tsx
│   │   ├── SaaSSpend.tsx
│   │   ├── AIAgents.tsx
│   │   ├── Deployments.tsx
│   │   ├── APIStatus.tsx
│   │   └── SystemUptime.tsx
│   ├── modals/          # Modal components
│   ├── ui/              # Reusable UI components
│   └── Sidebar.tsx      # Navigation sidebar
├── data/                # Mock data and types
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
├── types/               # TypeScript type definitions
└── App.tsx              # Main application component
```

## 🗄️ **Database Schema**

### **Core Tables**
- `kpi_data` - Key performance indicators
- `team_members` - Team directory and status
- `tech_stack` - Technology inventory
- `roadmap_items` - Strategic roadmap
- `projects` - Active project tracking
- `vendors` - SaaS vendor management
- `ai_agents` - AI agent configurations
- `api_statuses` - API health monitoring
- `deployment_logs` - Deployment history

### **Security Features**
- ✅ **Row Level Security (RLS)** enabled on all tables
- ✅ **Authenticated user policies** for data access
- ✅ **Role-based permissions** for different user types
- ✅ **Secure API endpoints** with proper authentication

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Supabase account

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mpb-health-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables (Optional)**
   ```bash
   cp .env.example .env
   ```
   
   **Development Mode (Recommended for initial setup):**
   The application works out-of-the-box with mock data when Supabase credentials are not provided. Simply run `npm run dev` to start with demo data.
   
   **Production Mode with Supabase:**
   Add your Supabase credentials to `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run database migrations (Production only)**
   - Import the SQL files from `supabase/migrations/` into your Supabase project
   - This will create all necessary tables and seed data
   - Skip this step if using development mode with mock data

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to the URL shown in terminal (usually `http://localhost:5173` or `http://localhost:5174`)

## 🔐 **Encryption Setup**

The dashboard includes AES-256-GCM encryption for protecting sensitive compliance documents and evidence files.

### **Generate an Encryption Key**

```bash
npx ts-node scripts/generate-encryption-key.ts
```

This generates a cryptographically secure 256-bit key (64 hex characters).

### **Configure the Key**

Add the generated key to your `.env` file:

```
VITE_ENCRYPTION_KEY=your_64_char_hex_key_here
```

### **How It Works**

- **Client-side encryption**: Files are encrypted in the browser before upload using the WebCrypto API
- **AES-256-GCM**: Industry-standard authenticated encryption with 256-bit keys
- **Secure storage**: Encrypted files are stored in Supabase Storage with metadata in the database
- **Automatic detection**: The EvidenceUploader component automatically enables encryption when configured

### **Security Notes**

- **Never commit your encryption key** to version control
- **Use different keys** for development and production environments
- **Back up your key securely** - encrypted data is unrecoverable without it
- **Key rotation**: When rotating keys, re-encrypt existing data before switching

### **Usage in Code**

```typescript
import { encryptToString, decryptFromString } from '@utils/encryption';
import { secureStore } from '@lib/secureStore';

// Encrypt/decrypt strings
const encrypted = await encryptToString('sensitive data', key);
const decrypted = await decryptFromString(encrypted, key);

// High-level secure store for JSON data
const payload = await secureStore.set({ ssn: '123-45-6789' });
const data = await secureStore.get<{ ssn: string }>(payload);
```

## 📊 **Dashboard Pages**

### **1. Overview**
- Company-wide KPIs and metrics
- Team directory with real-time status
- Recent activity feed
- Organization structure

### **2. Analytics**
- Revenue growth and trends
- User activity metrics
- Performance indicators
- Business intelligence

### **3. Member Engagement**
- Login patterns and session data
- Feature usage analytics
- Device breakdown
- Engagement trends

### **4. Member Retention**
- Retention rate analysis
- Churn volume and reasons
- Cohort analysis
- Actionable insights

### **5. Advisor Performance**
- Sales performance tracking
- Skill assessments
- Conversion funnel analysis
- Commission tracking

### **6. Tech Stack**
- Technology inventory
- Version tracking
- Ownership management
- Status monitoring

### **7. Roadmap**
- Strategic initiatives
- Timeline management
- Dependency tracking
- Progress monitoring

### **8. Roadmap Visualizer**
- Interactive timeline view
- Advanced filtering
- Multiple view modes
- Drag-and-drop interface

### **9. Projects**
- Active project tracking
- Progress monitoring
- Team assignments
- GitHub/Jira integration

### **10. Compliance**
- HIPAA compliance status
- Security audits
- Vendor assessments
- Audit trails

### **11. SaaS Spend**
- Vendor cost tracking
- Renewal management
- Budget optimization
- ROI analysis

### **12. AI Agents**
- Agent configurations
- Prompt management
- Dataset connections
- Performance monitoring

### **13. Deployments**
- Deployment history
- Status tracking
- Environment management
- Success/failure analysis

### **14. API Status**
- Real-time API monitoring
- Response time tracking
- Health checks
- Incident management

### **15. System Uptime**
- System health monitoring
- Component status
- Uptime metrics
- Performance tracking

## 🎯 **Key Features**

### **Advanced Filtering**
- Multi-dimensional filtering across all dashboards
- Real-time search functionality
- Saved filter presets
- Export capabilities

### **Real-time Updates**
- Live data synchronization with Supabase
- Automatic refresh intervals
- Real-time notifications
- Optimistic UI updates

### **Data Visualization**
- Interactive charts and graphs
- Responsive design for all screen sizes
- Export to PNG/PDF capabilities
- Customizable color schemes

### **User Experience**
- Intuitive navigation with categorized sidebar
- Smooth animations and transitions
- Loading states and error handling
- Keyboard shortcuts and accessibility

## 🔒 **Security & Compliance**

### **Data Protection**
- HIPAA-compliant data handling
- Encrypted data transmission
- Secure authentication
- Audit trail logging

### **Access Control**
- Role-based permissions
- Row-level security
- API rate limiting
- Session management

## 📈 **Performance**

### **Optimization**
- Code splitting and lazy loading
- Optimized bundle size
- Efficient re-rendering
- Caching strategies

### **Monitoring**
- Performance metrics tracking
- Error monitoring with Sentry
- User analytics
- System health checks

## 🚀 **Deployment**

### **Production Build**
```bash
npm run build
```

### **Preview Build**
```bash
npm run preview
```

### **Deployment Options**
- Netlify (recommended)
- Vercel
- AWS S3 + CloudFront
- Custom server deployment

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 **License**

This project is proprietary to MPB Health. All rights reserved.

## 👥 **Team**

**Vinnie R. Tannous** - Chief Technology Officer
- Email: vinnie@mpbhealth.com
- Role: Project Lead & Architecture

**Development Team**
- Frontend: Emily Rodriguez, Alex Thompson
- Backend: Michael Chen, David Kim
- AI/ML: Daniel Jimenez, Vandana Rathore
- DevOps: Infrastructure Team

## 📞 **Support**

For technical support or questions:
- Internal Slack: #aryx-ceo
- Email: tech-support@mpbhealth.com
- Documentation: Internal Wiki

---

**Built with ❤️ by the MPB Health Technology Team**