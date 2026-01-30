import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import type { IconName } from '@/config/presentationData';

// Icon options for the picker
const iconOptions: IconName[] = [
  'Users', 'Briefcase', 'UserCog', 'Building2', 'Globe', 'Smartphone',
  'LayoutDashboard', 'Ticket', 'FileText', 'Stethoscope', 'Monitor',
  'ClipboardList', 'CreditCard', 'Lock', 'Cpu', 'Mail', 'CalendarCheck',
  'FileKey', 'Workflow', 'Activity', 'Link2', 'Database', 'RefreshCw',
  'Shield', 'Zap', 'CheckCircle2', 'Clock', 'AlertTriangle', 'Target',
  'Upload', 'ArrowLeftRight', 'ArrowRight', 'Network', 'Layers', 'Boxes',
];

// Color presets for gradient selections
const colorPresets = [
  { label: 'Blue', value: 'from-blue-500 to-blue-600' },
  { label: 'Purple', value: 'from-purple-500 to-purple-600' },
  { label: 'Emerald', value: 'from-emerald-500 to-emerald-600' },
  { label: 'Amber', value: 'from-amber-500 to-amber-600' },
  { label: 'Blue Cyan', value: 'from-blue-500 to-cyan-500' },
  { label: 'Purple Pink', value: 'from-purple-500 to-pink-500' },
  { label: 'Emerald Teal', value: 'from-emerald-500 to-teal-500' },
  { label: 'Amber Orange', value: 'from-amber-500 to-orange-500' },
  { label: 'Indigo Purple', value: 'from-indigo-500 to-purple-500' },
  { label: 'Rose Pink', value: 'from-rose-500 to-pink-500' },
  { label: 'Green Emerald', value: 'from-green-500 to-emerald-500' },
  { label: 'Sky Blue', value: 'from-sky-500 to-blue-500' },
  { label: 'Slate', value: 'from-slate-500 to-slate-600' },
];

// Text color presets
const textColorPresets = [
  { label: 'Blue', value: 'text-blue-400' },
  { label: 'Emerald', value: 'text-emerald-400' },
  { label: 'Purple', value: 'text-purple-400' },
  { label: 'Amber', value: 'text-amber-400' },
  { label: 'Cyan', value: 'text-cyan-400' },
  { label: 'Pink', value: 'text-pink-400' },
  { label: 'Red', value: 'text-red-400' },
];

// Direction options for data flows
const directionOptions = [
  { label: 'Bidirectional', value: 'bidirectional' },
  { label: 'Inbound', value: 'inbound' },
  { label: 'Outbound', value: 'outbound' },
];

// Status options for evolution items and timeline
const statusOptions = [
  { label: 'Success', value: 'success' },
  { label: 'Warning', value: 'warning' },
  { label: 'Error', value: 'error' },
];

const timelineStatusOptions = [
  { label: 'Complete', value: 'complete' },
  { label: 'Current', value: 'current' },
  { label: 'Upcoming', value: 'upcoming' },
];

// Item type determines which fields to show
export type EditItemType =
  | 'user'
  | 'app'
  | 'service'
  | 'takeaway'
  | 'platform'
  | 'vendor'
  | 'dataFlow'
  | 'callout'
  | 'evolutionItem'
  | 'timelineStep'
  | 'partner';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
  itemType: EditItemType;
  initialData?: Record<string, unknown>;
  title?: string;
}

/**
 * Modal for editing individual presentation items
 */
export function EditItemModal({
  isOpen,
  onClose,
  onSave,
  itemType,
  initialData = {},
  title = 'Edit Item',
}: EditItemModalProps) {
  // Form state
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);

  // Reset form when modal opens with new data
  useEffect(() => {
    setFormData(initialData);
  }, [initialData, isOpen]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  const renderFields = () => {
    switch (itemType) {
      case 'user':
        return (
          <>
            <FormField label="Label" required>
              <input
                type="text"
                value={(formData.label as string) || ''}
                onChange={(e) => handleChange('label', e.target.value)}
                className="form-input"
                placeholder="e.g., Members"
              />
            </FormField>
            <FormField label="Icon">
              <IconPicker
                value={(formData.icon as IconName) || 'Users'}
                onChange={(v) => handleChange('icon', v)}
              />
            </FormField>
            <FormField label="Color">
              <ColorPicker
                value={(formData.color as string) || 'from-blue-500 to-blue-600'}
                onChange={(v) => handleChange('color', v)}
              />
            </FormField>
          </>
        );

      case 'app':
        return (
          <>
            <FormField label="Label" required>
              <input
                type="text"
                value={(formData.label as string) || ''}
                onChange={(e) => handleChange('label', e.target.value)}
                className="form-input"
                placeholder="e.g., CRM"
              />
            </FormField>
            <FormField label="Sublabel">
              <input
                type="text"
                value={(formData.sublabel as string) || ''}
                onChange={(e) => handleChange('sublabel', e.target.value)}
                className="form-input"
                placeholder="e.g., Sales & Support"
              />
            </FormField>
            <FormField label="Icon">
              <IconPicker
                value={(formData.icon as IconName) || 'LayoutDashboard'}
                onChange={(v) => handleChange('icon', v)}
              />
            </FormField>
          </>
        );

      case 'service':
        return (
          <>
            <FormField label="Label" required>
              <input
                type="text"
                value={(formData.label as string) || ''}
                onChange={(e) => handleChange('label', e.target.value)}
                className="form-input"
                placeholder="e.g., Unified API"
              />
            </FormField>
            <FormField label="Description" required>
              <input
                type="text"
                value={(formData.desc as string) || ''}
                onChange={(e) => handleChange('desc', e.target.value)}
                className="form-input"
                placeholder="e.g., Business Rules"
              />
            </FormField>
            <FormField label="Icon">
              <IconPicker
                value={(formData.icon as IconName) || 'Cpu'}
                onChange={(v) => handleChange('icon', v)}
              />
            </FormField>
          </>
        );

      case 'takeaway':
        return (
          <>
            <FormField label="Label" required>
              <input
                type="text"
                value={(formData.label as string) || ''}
                onChange={(e) => handleChange('label', e.target.value)}
                className="form-input"
                placeholder="e.g., Consistency"
              />
            </FormField>
            <FormField label="Description" required>
              <input
                type="text"
                value={(formData.desc as string) || ''}
                onChange={(e) => handleChange('desc', e.target.value)}
                className="form-input"
                placeholder="e.g., One truth across all systems"
              />
            </FormField>
            <FormField label="Icon">
              <IconPicker
                value={(formData.icon as IconName) || 'CheckCircle2'}
                onChange={(v) => handleChange('icon', v)}
              />
            </FormField>
            <FormField label="Color">
              <ColorPicker
                value={(formData.color as string) || 'from-blue-500 to-blue-600'}
                onChange={(v) => handleChange('color', v)}
              />
            </FormField>
          </>
        );

      case 'platform':
        return (
          <>
            <FormField label="Label" required>
              <input
                type="text"
                value={(formData.label as string) || ''}
                onChange={(e) => handleChange('label', e.target.value)}
                className="form-input"
                placeholder="e.g., MPB Website"
              />
            </FormField>
            <FormField label="Sublabel" required>
              <input
                type="text"
                value={(formData.sublabel as string) || ''}
                onChange={(e) => handleChange('sublabel', e.target.value)}
                className="form-input"
                placeholder="e.g., Member Portal"
              />
            </FormField>
            <FormField label="Icon">
              <IconPicker
                value={(formData.icon as IconName) || 'Globe'}
                onChange={(v) => handleChange('icon', v)}
              />
            </FormField>
            <FormField label="Color">
              <ColorPicker
                value={(formData.color as string) || 'from-blue-500 to-cyan-500'}
                onChange={(v) => handleChange('color', v)}
              />
            </FormField>
            <FormField label="Angle (degrees)">
              <input
                type="number"
                value={(formData.angle as number) || 0}
                onChange={(e) => handleChange('angle', parseInt(e.target.value) || 0)}
                className="form-input"
                min="0"
                max="360"
                step="15"
              />
              <p className="text-xs text-slate-500 mt-1">Position around the hub (0-360)</p>
            </FormField>
          </>
        );

      case 'vendor':
        return (
          <>
            <FormField label="Name" required>
              <input
                type="text"
                value={(formData.name as string) || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="form-input"
                placeholder="e.g., Zion Health"
              />
            </FormField>
            <FormField label="Type" required>
              <input
                type="text"
                value={(formData.type as string) || ''}
                onChange={(e) => handleChange('type', e.target.value)}
                className="form-input"
                placeholder="e.g., HealthShare"
              />
            </FormField>
            <FormField label="File Type" required>
              <select
                value={(formData.fileType as string) || 'API'}
                onChange={(e) => handleChange('fileType', e.target.value)}
                className="form-input"
              >
                <option value="API">API</option>
                <option value="SFTP">SFTP</option>
                <option value="CSV">CSV</option>
                <option value="EDI 834">EDI 834</option>
                <option value="Webhook">Webhook</option>
              </select>
            </FormField>
          </>
        );

      case 'dataFlow':
        return (
          <>
            <FormField label="Label" required>
              <input
                type="text"
                value={(formData.label as string) || ''}
                onChange={(e) => handleChange('label', e.target.value)}
                className="form-input"
                placeholder="e.g., Member Profiles"
              />
            </FormField>
            <FormField label="Direction">
              <select
                value={(formData.direction as string) || 'bidirectional'}
                onChange={(e) => handleChange('direction', e.target.value)}
                className="form-input"
              >
                {directionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Color">
              <select
                value={(formData.color as string) || 'text-blue-400'}
                onChange={(e) => handleChange('color', e.target.value)}
                className="form-input"
              >
                {textColorPresets.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </FormField>
          </>
        );

      case 'callout':
        return (
          <>
            <FormField label="Label" required>
              <input
                type="text"
                value={(formData.label as string) || ''}
                onChange={(e) => handleChange('label', e.target.value)}
                className="form-input"
                placeholder="e.g., Single Source"
              />
            </FormField>
            <FormField label="Description" required>
              <input
                type="text"
                value={(formData.desc as string) || ''}
                onChange={(e) => handleChange('desc', e.target.value)}
                className="form-input"
                placeholder="e.g., One database, all platforms"
              />
            </FormField>
            <FormField label="Icon">
              <IconPicker
                value={(formData.icon as IconName) || 'Database'}
                onChange={(v) => handleChange('icon', v)}
              />
            </FormField>
            <FormField label="Color">
              <ColorPicker
                value={(formData.color as string) || 'from-blue-500 to-cyan-500'}
                onChange={(v) => handleChange('color', v)}
              />
            </FormField>
          </>
        );

      case 'evolutionItem':
        return (
          <>
            <FormField label="Text" required>
              <input
                type="text"
                value={(formData.text as string) || ''}
                onChange={(e) => handleChange('text', e.target.value)}
                className="form-input"
                placeholder="e.g., E123 replaced by MPB Enrollment System"
              />
            </FormField>
            <FormField label="Status">
              <select
                value={(formData.status as string) || 'warning'}
                onChange={(e) => handleChange('status', e.target.value)}
                className="form-input"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Highlight">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(formData.highlight as boolean) || false}
                  onChange={(e) => handleChange('highlight', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-600">Highlight this item</span>
              </label>
            </FormField>
          </>
        );

      case 'timelineStep':
        return (
          <>
            <FormField label="Label" required>
              <input
                type="text"
                value={(formData.label as string) || ''}
                onChange={(e) => handleChange('label', e.target.value)}
                className="form-input"
                placeholder="e.g., Foundation"
              />
            </FormField>
            <FormField label="Status">
              <select
                value={(formData.status as string) || 'upcoming'}
                onChange={(e) => handleChange('status', e.target.value)}
                className="form-input"
              >
                {timelineStatusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>
          </>
        );

      case 'partner':
        return (
          <>
            <FormField label="Partner Name" required>
              <input
                type="text"
                value={(formData.name as string) || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="form-input"
                placeholder="e.g., Vendors"
              />
            </FormField>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {renderFields()}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Helper components

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function FormField({ label, required, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

interface IconPickerProps {
  value: IconName;
  onChange: (value: IconName) => void;
}

function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as IconName)}
      className="form-input"
    >
      {iconOptions.map((icon) => (
        <option key={icon} value={icon}>{icon}</option>
      ))}
    </select>
  );
}

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-input"
      >
        {colorPresets.map((color) => (
          <option key={color.value} value={color.value}>{color.label}</option>
        ))}
      </select>
      <div className={`h-6 rounded-lg bg-gradient-to-r ${value}`} />
    </div>
  );
}

// Styles for form inputs
const formInputStyles = `
  .form-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
    background-color: white;
    font-size: 0.875rem;
    transition: all 0.2s;
  }
  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  .dark .form-input {
    background-color: #1e293b;
    border-color: #475569;
    color: #f1f5f9;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = formInputStyles;
  if (!document.querySelector('style[data-edit-modal]')) {
    styleEl.setAttribute('data-edit-modal', 'true');
    document.head.appendChild(styleEl);
  }
}
