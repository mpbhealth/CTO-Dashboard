import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Database,
  Globe,
  Smartphone,
  LayoutDashboard,
  Ticket,
  UserCog,
  Building2,
  CreditCard,
  FileText,
  Shield,
  Zap,
  ArrowRight,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  Mail,
  FileKey,
  Upload,
  Workflow,
  Activity,
  Link2,
  Lock,
  RefreshCw,
  Target,
  Layers,
  Cpu,
  Network,
  Boxes,
  Monitor,
  Briefcase,
  Stethoscope,
  CalendarCheck,
  ClipboardList,
  Pencil,
  LucideIcon,
} from 'lucide-react';
import { usePresentationEditor } from '@/hooks/usePresentationEditor';
import { PresentationEditor } from '@/components/presentation/PresentationEditor';
import type { IconName, PresentationConfig } from '@/config/presentationData';

// Icon mapping for dynamic icon rendering
const iconMap: Record<IconName, LucideIcon> = {
  Users, Briefcase, UserCog, Building2, Globe, Smartphone,
  LayoutDashboard, Ticket, FileText, Stethoscope, Monitor,
  ClipboardList, CreditCard, Lock, Cpu, Mail, CalendarCheck,
  FileKey, Workflow, Activity, Link2, Database, RefreshCw,
  Shield, Zap, CheckCircle2, Clock, AlertTriangle, Target,
  Upload, ArrowLeftRight, ArrowRight, Network, Layers, Boxes,
};

const getIcon = (name: IconName): LucideIcon => iconMap[name] || Database;

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

const slideIn = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 },
};

// Pulsing dot component
function PulsingDot({ color = 'bg-emerald-500' }: { color?: string }) {
  return (
    <span className="relative flex h-3 w-3">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-3 w-3 ${color}`} />
    </span>
  );
}

// Slide 1: Architecture Overview
function ArchitectureSlide({
  isActive,
  config,
  isEditMode,
}: {
  isActive: boolean;
  config: PresentationConfig['architecture'];
  isEditMode: boolean;
}) {
  return (
    <motion.div
      className={`relative w-full h-full bg-gradient-to-br from-slate-50 via-white to-blue-50 p-8 overflow-hidden ${
        isEditMode ? 'ring-4 ring-blue-400 ring-inset' : ''
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(30, 58, 138, 0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Title */}
      <motion.div
        className="text-center mb-6"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800 bg-clip-text text-transparent">
          MPB Unified Platform
        </h1>
        <p className="text-lg text-slate-600 mt-1 font-medium">
          One Source of Truth, Many Experiences
        </p>
      </motion.div>

      <div className="flex gap-6 h-[calc(100%-120px)]">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Layer 1: Users */}
          <motion.div
            className="flex items-center gap-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <div className="bg-slate-100 rounded-xl px-4 py-2 border border-slate-200">
              <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Users className="w-4 h-4" /> Users
              </span>
            </div>
            <div className="flex gap-3">
              {config.users.map((user, idx) => {
                const Icon = getIcon(user.icon);
                return (
                  <motion.div
                    key={user.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br ${user.color} text-white shadow-lg`}
                    variants={scaleIn}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{user.label}</span>
                  </motion.div>
                );
              })}
            </div>
            <motion.div
              className="flex-1 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <ArrowRight className="w-6 h-6 text-slate-400 animate-pulse" />
            </motion.div>
          </motion.div>

          {/* Layer 2: Applications */}
          <motion.div
            className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200 relative overflow-hidden"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3 }}
          >
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500" />

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Boxes className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Applications</h3>
                <p className="text-xs text-slate-500">One Codebase / Monorepo</p>
              </div>
            </div>

            {/* Member/Advisor Facing Row */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Member & Advisor Facing</p>
              <div className="flex gap-3">
                {config.memberApps.map((app, idx) => {
                  const Icon = getIcon(app.icon);
                  return (
                    <motion.div
                      key={app.id}
                      className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 hover:shadow-md transition-all"
                      whileHover={{ scale: 1.02 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{app.label}</p>
                        {app.sublabel && <p className="text-xs text-slate-500">{app.sublabel}</p>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Internal Tools Row */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Operations & Internal Tools</p>
              <div className="grid grid-cols-4 gap-2">
                {config.internalApps.map((app, idx) => {
                  const Icon = getIcon(app.icon);
                  return (
                    <motion.div
                      key={app.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all"
                      whileHover={{ scale: 1.02 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + idx * 0.05 }}
                    >
                      <Icon className="w-4 h-4 text-slate-600" />
                      <div>
                        <p className="font-medium text-slate-700 text-xs">{app.label}</p>
                        {app.sublabel && <p className="text-[10px] text-emerald-600 font-semibold">{app.sublabel}</p>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <p className="text-center text-xs text-slate-500 mt-3 italic">
              Different experiences — same platform and data
            </p>
          </motion.div>

          {/* Animated Arrow */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex flex-col items-center">
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <ArrowRight className="w-6 h-6 text-blue-500 rotate-90" />
              </motion.div>
            </div>
          </motion.div>

          {/* Layer 3: Shared Platform Services */}
          <motion.div
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 shadow-xl relative overflow-hidden"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.6 }}
          >
            {/* Animated glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 animate-pulse" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Shared Platform Services</h3>
                  <p className="text-xs text-slate-400">Reusable Components</p>
                </div>
                <div className="ml-auto">
                  <PulsingDot color="bg-emerald-400" />
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {config.services.map((service, idx) => {
                  const Icon = getIcon(service.icon);
                  return (
                    <motion.div
                      key={service.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur border border-white/10 hover:bg-white/20 transition-all"
                      whileHover={{ scale: 1.05 }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + idx * 0.05 }}
                    >
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <div>
                        <p className="font-medium text-white text-[10px] leading-tight">{service.label}</p>
                        <p className="text-[9px] text-slate-400">{service.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <p className="text-center text-xs text-cyan-400 mt-3 font-medium">
                Build once. Reuse everywhere. Govern centrally.
              </p>
            </div>
          </motion.div>

          {/* Animated Arrow */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
            >
              <ArrowRight className="w-6 h-6 text-blue-500 rotate-90" />
            </motion.div>
          </motion.div>

          {/* Layer 4: Database */}
          <motion.div
            className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-5 shadow-xl relative overflow-hidden"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.8 }}
          >
            {/* Animated data particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/30 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2 + Math.random() * 2,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            <div className="relative flex items-center gap-4">
              <motion.div
                className="p-4 rounded-2xl bg-white/20 backdrop-blur"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
              >
                <Database className="w-10 h-10 text-white" />
              </motion.div>
              <div>
                <h3 className="font-bold text-white text-xl">MPB Database</h3>
                <p className="text-cyan-200 font-medium">Single Source of Truth</p>
                <p className="text-xs text-blue-200 mt-1">
                  One member record • One eligibility status • One enrollment history • One billing ledger
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <PulsingDot color="bg-emerald-400" />
                <span className="text-xs text-emerald-300 font-medium">Live</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: External Partners */}
        <motion.div
          className="w-56 bg-white rounded-2xl p-4 shadow-lg border border-slate-200 flex flex-col"
          variants={slideIn}
          initial="initial"
          animate="animate"
          transition={{ delay: 1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Network className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">External Partners</h3>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            {config.partners.map((partner, idx) => (
              <motion.div
                key={idx}
                className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 + idx * 0.1 }}
                whileHover={{ x: 4 }}
              >
                {partner}
              </motion.div>
            ))}
          </div>

          {/* Connection indicator */}
          <motion.div
            className="mt-4 p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">Eligibility Transfer</span>
            </div>
            <p className="text-[10px] text-slate-600">
              Validated, logged, automated transfers
            </p>
            <div className="flex items-center gap-1 mt-2">
              <PulsingDot color="bg-emerald-500" />
              <span className="text-[10px] text-emerald-600">Active</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer Takeaways */}
      <motion.div
        className="absolute bottom-4 left-8 right-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <div className="flex gap-4 justify-center">
          {config.takeaways.map((item, idx) => {
            const Icon = getIcon(item.icon);
            return (
              <motion.div
                key={item.id}
                className="flex items-center gap-3 px-5 py-2 rounded-xl bg-white shadow-md border border-slate-200"
                whileHover={{ scale: 1.05, y: -2 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + idx * 0.1 }}
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Slide 2: Data Hub Visualization
function DataHubSlide({
  isActive,
  config,
  isEditMode,
}: {
  isActive: boolean;
  config: PresentationConfig['dataHub'];
  isEditMode: boolean;
}) {
  return (
    <motion.div
      className={`relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 overflow-hidden ${
        isEditMode ? 'ring-4 ring-blue-400 ring-inset' : ''
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated Background Grid */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }} />
        {/* Radial glow from center */}
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/20 via-transparent to-transparent"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)'
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 3 + Math.random() * 3,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Title */}
      <motion.div
        className="text-center mb-4 relative z-10"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Data Hub Architecture
        </h1>
        <p className="text-lg text-slate-400 mt-1 font-medium">
          Database as Central Nervous System
        </p>
      </motion.div>

      <div className="flex h-[calc(100%-140px)] gap-6 relative z-10">
        {/* Left Panel - Data Flows */}
        <motion.div
          className="w-64 bg-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/10 flex flex-col overflow-hidden"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4 flex-shrink-0">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-white">Data Flows</h3>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {config.dataFlows.map((flow, idx) => (
              <motion.div
                key={flow.id}
                className="p-3 rounded-xl bg-white/5 border border-white/10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-semibold text-sm ${flow.color}`}>{flow.label}</span>
                  <motion.div
                    className="flex items-center gap-1"
                    animate={{ x: flow.direction === 'outbound' ? [0, 3, 0] : flow.direction === 'inbound' ? [3, 0, 3] : [0, 2, 0, -2, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    {flow.direction === 'bidirectional' ? (
                      <ArrowLeftRight className={`w-4 h-4 ${flow.color}`} />
                    ) : flow.direction === 'outbound' ? (
                      <ArrowRight className={`w-4 h-4 ${flow.color}`} />
                    ) : (
                      <ArrowRight className={`w-4 h-4 ${flow.color} rotate-180`} />
                    )}
                  </motion.div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${flow.color.replace('text-', 'bg-')}`}
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        delay: idx * 0.3,
                        ease: 'linear'
                      }}
                    />
                  </div>
                  <PulsingDot color={flow.color.replace('text-', 'bg-')} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <motion.div
            className="mt-4 p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex-shrink-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{config.stats.dataConsistency}</p>
              <p className="text-xs text-emerald-400">Data Consistency</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <p className="text-lg font-bold text-cyan-400">{config.stats.tables}</p>
                <p className="text-[10px] text-slate-400">Tables</p>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <p className="text-lg font-bold text-purple-400">{config.stats.records}</p>
                <p className="text-[10px] text-slate-400">Records</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Center - Hub Visualization */}
        <div className="flex-1 relative flex items-center justify-center">
          {/* Connection Lines from Hub to Platforms */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
                <stop offset="100%" stopColor="rgba(6, 182, 212, 0.3)" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {config.platforms.map((platform, idx) => {
              const centerX = '50%';
              const centerY = '50%';
              const angleRad = (platform.angle * Math.PI) / 180;
              // Scale to percentage - aim for endpoints at about 35% from center (within SVG bounds)
              const endX = 50 + 35 * Math.cos(angleRad);
              const endY = 50 + 35 * Math.sin(angleRad);

              return (
                <motion.line
                  key={idx}
                  x1={centerX}
                  y1={centerY}
                  x2={`${endX}%`}
                  y2={`${endY}%`}
                  stroke="url(#lineGradient)"
                  strokeWidth="2"
                  filter="url(#glow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                />
              );
            })}
          </svg>

          {/* Orbital Rings */}
          <motion.div
            className="absolute w-[200px] h-[200px] border border-blue-500/30 rounded-full z-0"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
          <motion.div
            className="absolute w-[380px] h-[380px] border border-cyan-500/20 rounded-full z-0"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: 360 }}
            transition={{ duration: 0.8, delay: 0.3, rotate: { duration: 60, repeat: Infinity, ease: 'linear' } }}
          />
          <motion.div
            className="absolute w-[520px] h-[520px] border border-purple-500/15 rounded-full z-0"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: -360 }}
            transition={{ duration: 0.8, delay: 0.4, rotate: { duration: 90, repeat: Infinity, ease: 'linear' } }}
          />

          {/* Central Database Hub */}
          <motion.div
            className="relative z-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute -inset-8 rounded-full bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-purple-500/30 blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ repeat: Infinity, duration: 3 }}
            />

            {/* Inner glow ring */}
            <motion.div
              className="absolute -inset-4 rounded-full bg-gradient-to-r from-blue-400/40 to-cyan-400/40 blur-md"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
            />

            {/* Main hub */}
            <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center shadow-2xl border-4 border-blue-400/50">
              {/* Animated ring inside */}
              <motion.div
                className="absolute inset-2 rounded-full border-2 border-cyan-400/50"
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              />

              <div className="text-center z-10">
                <motion.div
                  animate={{
                    y: [0, -3, 0],
                    rotateY: [0, 10, 0, -10, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 4 }}
                >
                  <Database className="w-12 h-12 text-white mx-auto mb-1" />
                </motion.div>
                <p className="text-white font-bold text-sm">MPB Database</p>
                <p className="text-cyan-300 text-[10px]">Source of Truth</p>
              </div>

              {/* Data pulse effect */}
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-cyan-400"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
              />
            </div>
          </motion.div>

          {/* Platform Nodes */}
          {config.platforms.map((platform, idx) => {
            const radius = 220;
            const angleRad = (platform.angle * Math.PI) / 180;
            const x = radius * Math.cos(angleRad);
            const y = radius * Math.sin(angleRad);
            const Icon = getIcon(platform.icon);

            return (
              <motion.div
                key={platform.id}
                className="absolute z-20"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + idx * 0.1, type: 'spring' }}
                whileHover={{ scale: 1.15, zIndex: 30 }}
              >
                {/* Data flow indicator */}
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(59, 130, 246, 0)',
                      '0 0 20px 5px rgba(59, 130, 246, 0.3)',
                      '0 0 0 0 rgba(59, 130, 246, 0)',
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 2, delay: idx * 0.2 }}
                />

                <div className={`relative px-4 py-3 rounded-xl bg-gradient-to-br ${platform.color} shadow-lg border border-white/20`}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-white" />
                    <div>
                      <p className="text-white font-semibold text-xs">{platform.label}</p>
                      <p className="text-white/70 text-[10px]">{platform.sublabel}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Animated data packets flowing to center */}
          {[...Array(8)].map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            const startRadius = 260;
            const endRadius = 80;

            return (
              <motion.div
                key={`packet-${i}`}
                className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50"
                style={{
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  x: [
                    startRadius * Math.cos(angle),
                    endRadius * Math.cos(angle),
                  ],
                  y: [
                    startRadius * Math.sin(angle),
                    endRadius * Math.sin(angle),
                  ],
                  opacity: [0, 1, 1, 0],
                  scale: [0.5, 1, 1, 0.5],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  delay: i * 0.25,
                  ease: 'easeInOut',
                }}
              />
            );
          })}
        </div>

        {/* Right Panel - Vendor File Transfers */}
        <motion.div
          className="w-72 bg-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/10 flex flex-col overflow-hidden"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4 flex-shrink-0">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Vendor Transfers</h3>
              <p className="text-xs text-slate-400">Eligibility & Claims</p>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {config.vendors.map((vendor, idx) => (
              <motion.div
                key={vendor.id}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
                whileHover={{ x: 5 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{vendor.name}</p>
                      <p className="text-slate-500 text-[10px]">{vendor.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-medium">
                      {vendor.fileType}
                    </span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: idx * 0.2 }}
                    >
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                    </motion.div>
                  </div>
                </div>

                {/* Transfer progress animation */}
                <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
                    initial={{ width: '0%', x: '-100%' }}
                    animate={{ width: '100%', x: '100%' }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      delay: idx * 0.3,
                      ease: 'linear',
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Transfer Status */}
          <motion.div
            className="mt-4 p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex-shrink-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-400 font-semibold text-sm">Transfer Status</span>
              <PulsingDot color="bg-emerald-400" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-white/5 rounded-lg">
                <p className="text-lg font-bold text-white">{config.stats.dailyFiles}</p>
                <p className="text-[9px] text-slate-400">Daily Files</p>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <p className="text-lg font-bold text-emerald-400">{config.stats.successRate}</p>
                <p className="text-[9px] text-slate-400">Success Rate</p>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <p className="text-lg font-bold text-cyan-400">{config.stats.avgTime}</p>
                <p className="text-[9px] text-slate-400">Avg Time</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Callouts */}
      <motion.div
        className="absolute bottom-4 left-8 right-8 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <div className="flex gap-4 justify-center">
          {config.callouts.map((item, idx) => {
            const Icon = getIcon(item.icon);
            return (
              <motion.div
                key={item.id}
                className="flex items-center gap-3 px-5 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/10"
                whileHover={{ scale: 1.05, y: -2 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 + idx * 0.1 }}
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Slide 3: Evolution Roadmap
function EvolutionSlide({
  isActive,
  config,
  isEditMode,
}: {
  isActive: boolean;
  config: PresentationConfig['evolution'];
  isEditMode: boolean;
}) {
  return (
    <motion.div
      className={`relative w-full h-full bg-gradient-to-br from-slate-50 via-white to-blue-50 p-8 overflow-hidden ${
        isEditMode ? 'ring-4 ring-blue-400 ring-inset' : ''
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(30, 58, 138, 0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Title */}
      <motion.div
        className="text-center mb-6"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800 bg-clip-text text-transparent">
          Platform Evolution
        </h1>
        <p className="text-lg text-slate-600 mt-1 font-medium">
          Today → Transition → Target State
        </p>
      </motion.div>

      {/* Three Columns */}
      <div className="flex gap-4 h-[calc(100%-180px)]">
        {config.columns.map((column, colIdx) => {
          const Icon = getIcon(column.icon);
          return (
            <motion.div
              key={column.id}
              className={`flex-1 bg-gradient-to-br ${column.bgColor} rounded-2xl p-5 shadow-lg border ${column.borderColor} flex flex-col relative overflow-hidden`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: colIdx * 0.2 }}
            >
              {/* Header gradient bar */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${column.color}`} />

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${column.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{column.title}</h3>
                  <p className="text-xs text-slate-500">{column.subtitle}</p>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto">
                {column.items && (
                  <div className="space-y-2">
                    {column.items.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        className={`flex items-start gap-2 px-3 py-2 rounded-lg ${
                          item.highlight
                            ? 'bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-300'
                            : 'bg-white/60 border border-slate-200'
                        }`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + colIdx * 0.2 + idx * 0.05 }}
                      >
                        {item.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
                        {item.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />}
                        {item.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                        <span className={`text-xs ${item.highlight ? 'font-semibold text-emerald-800' : 'text-slate-700'}`}>
                          {item.text}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}

                {column.sections && (
                  <div className="space-y-3">
                    {column.sections.map((section, sIdx) => (
                      <motion.div
                        key={section.id}
                        className="bg-white/60 rounded-lg p-3 border border-blue-200"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + colIdx * 0.2 + sIdx * 0.1 }}
                      >
                        <p className="text-xs font-bold text-blue-700 mb-2">{section.label}</p>
                        <div className="space-y-1">
                          {section.items.map((item, iIdx) => (
                            <div key={iIdx} className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-blue-400" />
                              <span className="text-[11px] text-slate-600">{item}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Callout */}
              {column.callout && (
                <motion.div
                  className={`mt-3 p-3 rounded-lg ${
                    column.callout.type === 'error' ? 'bg-red-100 border border-red-300' :
                    column.callout.type === 'info' ? 'bg-blue-100 border border-blue-300' :
                    'bg-emerald-100 border border-emerald-300'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + colIdx * 0.2 }}
                >
                  <p className={`text-xs font-semibold ${
                    column.callout.type === 'error' ? 'text-red-800' :
                    column.callout.type === 'info' ? 'text-blue-800' :
                    'text-emerald-800'
                  }`}>
                    {column.callout.text}
                  </p>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Migration Path Arrow */}
      <motion.div
        className="mt-6 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {/* Arrow background */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-400 via-blue-500 to-emerald-500 rounded-full h-2 top-1/2 -translate-y-1/2 opacity-20" />

        {/* Animated progress line */}
        <motion.div
          className="absolute left-0 bg-gradient-to-r from-slate-500 via-blue-500 to-emerald-500 rounded-full h-2 top-1/2 -translate-y-1/2"
          initial={{ width: '0%' }}
          animate={{ width: '40%' }}
          transition={{ duration: 2, ease: 'easeOut', delay: 1.2 }}
        />

        {/* Timeline steps */}
        <div className="flex justify-between items-center relative px-8">
          {config.timeline.map((step, idx) => (
            <motion.div
              key={step.id}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + idx * 0.15 }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.status === 'complete' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
                step.status === 'current' ? 'bg-gradient-to-br from-blue-400 to-blue-600 animate-pulse' :
                'bg-slate-300'
              }`}>
                {step.status === 'complete' ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : step.status === 'current' ? (
                  <RefreshCw className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Clock className="w-4 h-4 text-white" />
                )}
              </div>
              <p className={`text-xs font-medium mt-2 ${
                step.status === 'complete' ? 'text-emerald-700' :
                step.status === 'current' ? 'text-blue-700' :
                'text-slate-500'
              }`}>
                {step.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Migration label */}
        <motion.p
          className="text-center text-sm font-semibold text-slate-700 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          {config.migrationLabel}
        </motion.p>

        {/* Cutover marker */}
        <motion.div
          className="absolute right-1/3 top-0 transform -translate-y-8"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2 }}
        >
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            Cutover Moment
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Main Presentation Component
export function PlatformPresentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Use the presentation editor hook
  const {
    config,
    isEditMode,
    hasChanges,
    toggleEditMode,
    setEditMode,
    updateArchitectureSection,
    updateDataHubSection,
    updateEvolutionSection,
    updatePartners,
    saveConfig,
    resetToDefault,
  } = usePresentationEditor();

  const slides = [
    { id: 'architecture', title: 'Architecture Overview' },
    { id: 'datahub', title: 'Data Hub' },
    { id: 'evolution', title: 'Platform Evolution' },
  ];

  // Auto-advance slides
  useEffect(() => {
    if (isPlaying && !isEditMode) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 15000); // 15 seconds per slide
      return () => clearInterval(timer);
    }
  }, [isPlaying, slides.length, isEditMode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keyboard shortcuts when editing in modal
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ' ') {
        if (!isEditMode) {
          setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
        }
      } else if (e.key === 'ArrowLeft') {
        if (!isEditMode) {
          setCurrentSlide((prev) => Math.max(prev - 1, 0));
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (!isEditMode) {
          toggleFullscreen();
        }
      } else if (e.key === 'Escape') {
        if (isEditMode) {
          setEditMode(false);
        } else {
          setIsFullscreen(false);
        }
      } else if (e.key === 'e' || e.key === 'E') {
        toggleEditMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, isEditMode, toggleEditMode, setEditMode]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const renderCurrentSlide = () => {
    switch (currentSlide) {
      case 0:
        return <ArchitectureSlide isActive={true} config={config.architecture} isEditMode={isEditMode} />;
      case 1:
        return <DataHubSlide isActive={true} config={config.dataHub} isEditMode={isEditMode} />;
      case 2:
        return <EvolutionSlide isActive={true} config={config.evolution} isEditMode={isEditMode} />;
      default:
        return null;
    }
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'} flex flex-col bg-slate-900 rounded-2xl md:rounded-3xl overflow-hidden`}>
      {/* Header Controls */}
      <motion.div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-slate-800/90 backdrop-blur-sm border-b border-slate-700/50 gap-2 sm:gap-0 rounded-t-2xl md:rounded-t-3xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm sm:text-base md:text-lg">MPB Platform Presentation</h1>
              <p className="text-slate-400 text-[10px] sm:text-xs hidden xs:block">Board Executive Overview</p>
            </div>
          </div>
          {/* Mobile slide counter */}
          <div className="sm:hidden text-slate-400 text-xs font-medium bg-slate-700/50 px-2 py-1 rounded-lg">
            {currentSlide + 1} / {slides.length}
          </div>
        </div>

        {/* Slide indicators - scrollable on mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                currentSlide === idx
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-slate-700/70 text-slate-300 hover:bg-slate-600/80'
              }`}
            >
              {slide.title}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center sm:justify-end">
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
            disabled={currentSlide === 0}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-700/70 text-white hover:bg-slate-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1.5 sm:p-2 rounded-xl transition-all ${
              isPlaying ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25' : 'bg-slate-700/70 text-white hover:bg-slate-600/80'
            }`}
            title={isPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
          >
            {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <button
            onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))}
            disabled={currentSlide === slides.length - 1}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-700/70 text-white hover:bg-slate-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Next Slide"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="hidden sm:block w-px h-6 bg-slate-600/50 mx-1 sm:mx-2" />

          {/* Edit Mode Toggle */}
          <button
            onClick={toggleEditMode}
            className={`p-1.5 sm:p-2 rounded-xl transition-all flex items-center gap-1 sm:gap-2 ${
              isEditMode
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-slate-700/70 text-white hover:bg-slate-600/80'
            }`}
            title="Toggle Edit Mode (E)"
          >
            <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs font-medium hidden xs:inline">{isEditMode ? 'Done' : 'Edit'}</span>
          </button>

          <div className="hidden sm:block w-px h-6 bg-slate-600/50 mx-1 sm:mx-2" />

          <button
            onClick={toggleFullscreen}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-700/70 text-white hover:bg-slate-600/80 transition-all hidden sm:flex"
            title="Toggle Fullscreen (F)"
          >
            <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="hidden sm:block ml-2 sm:ml-4 text-slate-400 text-xs sm:text-sm font-medium">
            {currentSlide + 1} / {slides.length}
          </div>
        </div>
      </motion.div>

      {/* Slide Content */}
      <div className={`flex-1 relative overflow-hidden ${isEditMode ? 'md:mr-80' : ''}`}>
        <AnimatePresence mode="wait">
          {renderCurrentSlide()}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-3 sm:px-4 md:px-6 py-2 bg-slate-800/90 backdrop-blur-sm border-t border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-0 rounded-b-2xl md:rounded-b-3xl">
        <p className="text-slate-500 text-[10px] sm:text-xs text-center sm:text-left hidden md:block">
          Press <kbd className="px-1 sm:px-1.5 py-0.5 bg-slate-700/70 rounded-lg text-slate-300">←</kbd> <kbd className="px-1 sm:px-1.5 py-0.5 bg-slate-700/70 rounded-lg text-slate-300">→</kbd> to navigate • <kbd className="px-1 sm:px-1.5 py-0.5 bg-slate-700/70 rounded-lg text-slate-300">F</kbd> for fullscreen • <kbd className="px-1 sm:px-1.5 py-0.5 bg-slate-700/70 rounded-lg text-slate-300">E</kbd> for edit mode
        </p>
        <p className="text-slate-500 text-[10px] sm:text-xs text-center sm:text-right">
          MPB Health Technology Team • {new Date().getFullYear()}
          {hasChanges && <span className="ml-2 text-amber-400 font-medium">(Unsaved changes)</span>}
        </p>
      </div>

      {/* Edit Sidebar */}
      <AnimatePresence>
        {isEditMode && (
          <PresentationEditor
            config={config}
            onUpdateArchitecture={updateArchitectureSection}
            onUpdateDataHub={updateDataHubSection}
            onUpdateEvolution={updateEvolutionSection}
            onUpdatePartners={updatePartners}
            onSave={saveConfig}
            onReset={resetToDefault}
            onClose={() => setEditMode(false)}
            hasChanges={hasChanges}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default PlatformPresentation;
