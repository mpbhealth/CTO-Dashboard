import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Save,
  RotateCcw,
  X,
  Users,
  Smartphone,
  Layers,
  Network,
  Building2,
  Database,
  Activity,
  Upload,
  Target,
  Clock,
  GripVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type {
  PresentationConfig,
  UserItem,
  AppItem,
  ServiceItem,
  TakeawayItem,
  PlatformNode,
  VendorItem,
  DataFlowItem,
  DataHubCallout,
  EvolutionItem,
  TimelineStep,
  generateId,
} from '@/config/presentationData';
import { EditItemModal, EditItemType } from './EditItemModal';

type SlideTab = 'architecture' | 'dataHub' | 'evolution';

interface PresentationEditorProps {
  config: PresentationConfig;
  onUpdateArchitecture: <K extends keyof PresentationConfig['architecture']>(
    section: K,
    items: PresentationConfig['architecture'][K]
  ) => void;
  onUpdateDataHub: <K extends keyof PresentationConfig['dataHub']>(
    section: K,
    items: PresentationConfig['dataHub'][K]
  ) => void;
  onUpdateEvolution: <K extends keyof PresentationConfig['evolution']>(
    section: K,
    items: PresentationConfig['evolution'][K]
  ) => void;
  onUpdatePartners: (partners: string[]) => void;
  onSave: () => void;
  onReset: () => void;
  onClose: () => void;
  hasChanges: boolean;
}

/**
 * Presentation Editor Sidebar
 * Provides drag-and-drop reordering and item editing for all three slides
 */
export function PresentationEditor({
  config,
  onUpdateArchitecture,
  onUpdateDataHub,
  onUpdateEvolution,
  onUpdatePartners,
  onSave,
  onReset,
  onClose,
  hasChanges,
}: PresentationEditorProps) {
  const [activeTab, setActiveTab] = useState<SlideTab>('architecture');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    users: true,
    memberApps: false,
    internalApps: false,
    services: false,
    partners: false,
    takeaways: false,
    platforms: true,
    dataFlows: false,
    vendors: false,
    callouts: false,
    columns: true,
    timeline: false,
  });

  // Modal state
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    itemType: EditItemType;
    section: string;
    data: Record<string, unknown>;
    isNew: boolean;
  }>({
    isOpen: false,
    itemType: 'user',
    section: '',
    data: {},
    isNew: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Handle drag end for architecture sections
  const handleArchitectureDragEnd = (section: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const items = config.architecture[section as keyof typeof config.architecture];
    if (!Array.isArray(items)) return;

    const oldIndex = items.findIndex((item: { id?: string }, i: number) =>
      item.id ? item.id === active.id : `partner-${i}` === active.id
    );
    const newIndex = items.findIndex((item: { id?: string }, i: number) =>
      item.id ? item.id === over.id : `partner-${i}` === over.id
    );

    if (section === 'partners') {
      onUpdatePartners(arrayMove(items as string[], oldIndex, newIndex));
    } else {
      onUpdateArchitecture(
        section as keyof PresentationConfig['architecture'],
        arrayMove(items, oldIndex, newIndex) as never
      );
    }
  };

  // Handle drag end for data hub sections
  const handleDataHubDragEnd = (section: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const items = config.dataHub[section as keyof typeof config.dataHub];
    if (!Array.isArray(items)) return;

    const oldIndex = items.findIndex((item: { id: string }) => item.id === active.id);
    const newIndex = items.findIndex((item: { id: string }) => item.id === over.id);

    onUpdateDataHub(
      section as keyof PresentationConfig['dataHub'],
      arrayMove(items, oldIndex, newIndex) as never
    );
  };

  // Handle drag end for evolution sections
  const handleEvolutionDragEnd = (section: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const items = config.evolution[section as keyof typeof config.evolution];
    if (!Array.isArray(items)) return;

    const oldIndex = items.findIndex((item: { id: string }) => item.id === active.id);
    const newIndex = items.findIndex((item: { id: string }) => item.id === over.id);

    onUpdateEvolution(
      section as keyof PresentationConfig['evolution'],
      arrayMove(items, oldIndex, newIndex) as never
    );
  };

  // Open edit modal
  const openEditModal = (
    itemType: EditItemType,
    section: string,
    data: Record<string, unknown> = {},
    isNew = false
  ) => {
    setEditModal({ isOpen: true, itemType, section, data, isNew });
  };

  // Handle save from modal
  const handleModalSave = (data: Record<string, unknown>) => {
    const { itemType, section, isNew } = editModal;

    // Generate ID for new items
    if (isNew && !data.id) {
      data.id = `${section}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    if (activeTab === 'architecture') {
      if (section === 'partners') {
        if (isNew) {
          onUpdatePartners([...config.architecture.partners, data.name as string]);
        } else {
          const partners = [...config.architecture.partners];
          const index = partners.findIndex((_, i) => `partner-${i}` === data.id);
          if (index >= 0) partners[index] = data.name as string;
          onUpdatePartners(partners);
        }
      } else {
        const items = [...(config.architecture[section as keyof typeof config.architecture] as unknown[])];
        if (isNew) {
          items.push(data);
        } else {
          const index = items.findIndex((item: unknown) => (item as { id: string }).id === data.id);
          if (index >= 0) items[index] = data;
        }
        onUpdateArchitecture(section as keyof PresentationConfig['architecture'], items as never);
      }
    } else if (activeTab === 'dataHub') {
      const items = [...(config.dataHub[section as keyof typeof config.dataHub] as unknown[])];
      if (isNew) {
        items.push(data);
      } else {
        const index = items.findIndex((item: unknown) => (item as { id: string }).id === data.id);
        if (index >= 0) items[index] = data;
      }
      onUpdateDataHub(section as keyof PresentationConfig['dataHub'], items as never);
    } else if (activeTab === 'evolution') {
      const items = [...(config.evolution[section as keyof typeof config.evolution] as unknown[])];
      if (isNew) {
        items.push(data);
      } else {
        const index = items.findIndex((item: unknown) => (item as { id: string }).id === data.id);
        if (index >= 0) items[index] = data;
      }
      onUpdateEvolution(section as keyof PresentationConfig['evolution'], items as never);
    }

    setEditModal({ ...editModal, isOpen: false });
  };

  // Handle delete
  const handleDelete = (section: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    if (activeTab === 'architecture') {
      if (section === 'partners') {
        const index = parseInt(id.replace('partner-', ''));
        const partners = config.architecture.partners.filter((_, i) => i !== index);
        onUpdatePartners(partners);
      } else {
        const items = (config.architecture[section as keyof typeof config.architecture] as { id: string }[])
          .filter((item) => item.id !== id);
        onUpdateArchitecture(section as keyof PresentationConfig['architecture'], items as never);
      }
    } else if (activeTab === 'dataHub') {
      const items = (config.dataHub[section as keyof typeof config.dataHub] as { id: string }[])
        .filter((item) => item.id !== id);
      onUpdateDataHub(section as keyof PresentationConfig['dataHub'], items as never);
    } else if (activeTab === 'evolution') {
      const items = (config.evolution[section as keyof typeof config.evolution] as { id: string }[])
        .filter((item) => item.id !== id);
      onUpdateEvolution(section as keyof PresentationConfig['evolution'], items as never);
    }
  };

  return (
    <>
      <motion.div
        className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-900 shadow-2xl z-40 flex flex-col"
        initial={{ x: 320 }}
        animate={{ x: 0 }}
        exit={{ x: 320 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Edit Presentation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {[
            { id: 'architecture', label: 'Architecture', icon: Layers },
            { id: 'dataHub', label: 'Data Hub', icon: Database },
            { id: 'evolution', label: 'Evolution', icon: Target },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SlideTab)}
              className={`flex-1 px-2 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeTab === 'architecture' && (
            <>
              <EditorSection
                title="Users"
                icon={Users}
                count={config.architecture.users.length}
                isExpanded={expandedSections.users}
                onToggle={() => toggleSection('users')}
                onAdd={() => openEditModal('user', 'users', {}, true)}
              >
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleArchitectureDragEnd('users')}>
                  <SortableContext items={config.architecture.users.map((u) => u.id)} strategy={verticalListSortingStrategy}>
                    {config.architecture.users.map((user) => (
                      <SortableEditorItem
                        key={user.id}
                        id={user.id}
                        label={user.label}
                        onEdit={() => openEditModal('user', 'users', user)}
                        onDelete={() => handleDelete('users', user.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </EditorSection>

              <EditorSection
                title="Member Apps"
                icon={Smartphone}
                count={config.architecture.memberApps.length}
                isExpanded={expandedSections.memberApps}
                onToggle={() => toggleSection('memberApps')}
                onAdd={() => openEditModal('app', 'memberApps', {}, true)}
              >
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleArchitectureDragEnd('memberApps')}>
                  <SortableContext items={config.architecture.memberApps.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                    {config.architecture.memberApps.map((app) => (
                      <SortableEditorItem
                        key={app.id}
                        id={app.id}
                        label={app.label}
                        sublabel={app.sublabel}
                        onEdit={() => openEditModal('app', 'memberApps', app)}
                        onDelete={() => handleDelete('memberApps', app.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </EditorSection>

              <EditorSection
                title="Internal Apps"
                icon={Layers}
                count={config.architecture.internalApps.length}
                isExpanded={expandedSections.internalApps}
                onToggle={() => toggleSection('internalApps')}
                onAdd={() => openEditModal('app', 'internalApps', {}, true)}
              >
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleArchitectureDragEnd('internalApps')}>
                  <SortableContext items={config.architecture.internalApps.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                    {config.architecture.internalApps.map((app) => (
                      <SortableEditorItem
                        key={app.id}
                        id={app.id}
                        label={app.label}
                        sublabel={app.sublabel}
                        onEdit={() => openEditModal('app', 'internalApps', app)}
                        onDelete={() => handleDelete('internalApps', app.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </EditorSection>

              <EditorSection
                title="Platform Services"
                icon={Layers}
                count={config.architecture.services.length}
                isExpanded={expandedSections.services}
                onToggle={() => toggleSection('services')}
                onAdd={() => openEditModal('service', 'services', {}, true)}
              >
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleArchitectureDragEnd('services')}>
                  <SortableContext items={config.architecture.services.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    {config.architecture.services.map((service) => (
                      <SortableEditorItem
                        key={service.id}
                        id={service.id}
                        label={service.label}
                        sublabel={service.desc}
                        onEdit={() => openEditModal('service', 'services', service)}
                        onDelete={() => handleDelete('services', service.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </EditorSection>

              <EditorSection
                title="External Partners"
                icon={Network}
                count={config.architecture.partners.length}
                isExpanded={expandedSections.partners}
                onToggle={() => toggleSection('partners')}
                onAdd={() => openEditModal('partner', 'partners', {}, true)}
              >
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleArchitectureDragEnd('partners')}>
                  <SortableContext items={config.architecture.partners.map((_, i) => `partner-${i}`)} strategy={verticalListSortingStrategy}>
                    {config.architecture.partners.map((partner, i) => (
                      <SortableEditorItem
                        key={`partner-${i}`}
                        id={`partner-${i}`}
                        label={partner}
                        onEdit={() => openEditModal('partner', 'partners', { id: `partner-${i}`, name: partner })}
                        onDelete={() => handleDelete('partners', `partner-${i}`)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </EditorSection>

              <EditorSection
                title="Footer Takeaways"
                icon={Target}
                count={config.architecture.takeaways.length}
                isExpanded={expandedSections.takeaways}
                onToggle={() => toggleSection('takeaways')}
                onAdd={() => openEditModal('takeaway', 'takeaways', {}, true)}
              >
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleArchitectureDragEnd('takeaways')}>
                  <SortableContext items={config.architecture.takeaways.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {config.architecture.takeaways.map((takeaway) => (
                      <SortableEditorItem
                        key={takeaway.id}
                        id={takeaway.id}
                        label={takeaway.label}
                        sublabel={takeaway.desc}
                        onEdit={() => openEditModal('takeaway', 'takeaways', takeaway)}
                        onDelete={() => handleDelete('takeaways', takeaway.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </EditorSection>
            </>
          )}

          {activeTab === 'dataHub' && (
            <>
              <EditorSection
                title="Platform Nodes"
                icon={Database}
                count={config.dataHub.platforms.length}
                isExpanded={expandedSections.platforms}
                onToggle={() => toggleSection('platforms')}
                onAdd={() => openEditModal('platform', 'platforms', { angle: 0 }, true)}
              >
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDataHubDragEnd('platforms')}>
                  <SortableContext items={config.dataHub.platforms.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                    {config.dataHub.platforms.map((platform) => (
                      <SortableEditorItem
                        key={platform.id}
                        id={platform.id}
                        label={platform.label}
                        sublabel={`${platform.sublabel} (${platform.angle}°)`}
                        onEdit={() => openEditModal('platform', 'platforms', platform)}
                        onDelete={() => handleDelete('platforms', platform.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </EditorSection>

              <EditorSection
                title="Data Flows"
                icon={Activity}
                count={config.dataHub.dataFlows.length}
                isExpanded={expandedSections.dataFlows}
                onToggle={() => toggleSection('dataFlows')}
                onAdd={() => openEditModal('dataFlow', 'dataFlows', { direction: 'bidirectional' }, true)}
              >
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDataHubDragEnd('dataFlows')}>
                  <SortableContext items={config.dataHub.dataFlows.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                    {config.dataHub.dataFlows.map((flow) => (
                      <SortableEditorItem
                        key={flow.id}
                        id={flow.id}
                        label={flow.label}
                        sublabel={flow.direction}
                        onEdit={() => openEditModal('dataFlow', 'dataFlows', flow)}
                        onDelete={() => handleDelete('dataFlows', flow.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </EditorSection>

              <EditorSection
                title="Vendors"
                icon={Building2}
                count={config.dataHub.vendors.length}
                isExpanded={expandedSections.vendors}
                onToggle={() => toggleSection('vendors')}
                onAdd={() => openEditModal('vendor', 'vendors', {}, true)}
              >
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDataHubDragEnd('vendors')}>
                  <SortableContext items={config.dataHub.vendors.map((v) => v.id)} strategy={verticalListSortingStrategy}>
                    {config.dataHub.vendors.map((vendor) => (
                      <SortableEditorItem
                        key={vendor.id}
                        id={vendor.id}
                        label={vendor.name}
                        sublabel={`${vendor.type} - ${vendor.fileType}`}
                        onEdit={() => openEditModal('vendor', 'vendors', vendor)}
                        onDelete={() => handleDelete('vendors', vendor.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </EditorSection>

              <EditorSection
                title="Bottom Callouts"
                icon={Target}
                count={config.dataHub.callouts.length}
                isExpanded={expandedSections.callouts}
                onToggle={() => toggleSection('callouts')}
                onAdd={() => openEditModal('callout', 'callouts', {}, true)}
              >
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDataHubDragEnd('callouts')}>
                  <SortableContext items={config.dataHub.callouts.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                    {config.dataHub.callouts.map((callout) => (
                      <SortableEditorItem
                        key={callout.id}
                        id={callout.id}
                        label={callout.label}
                        sublabel={callout.desc}
                        onEdit={() => openEditModal('callout', 'callouts', callout)}
                        onDelete={() => handleDelete('callouts', callout.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </EditorSection>
            </>
          )}

          {activeTab === 'evolution' && (
            <>
              {config.evolution.columns.map((column, colIndex) => (
                <EditorSection
                  key={column.id}
                  title={column.title}
                  icon={colIndex === 0 ? Clock : colIndex === 1 ? Activity : Target}
                  count={column.items?.length || column.sections?.length || 0}
                  isExpanded={expandedSections[`col-${colIndex}`] ?? colIndex === 0}
                  onToggle={() => toggleSection(`col-${colIndex}`)}
                  onAdd={column.items ? () => openEditModal('evolutionItem', `column-${colIndex}`, {}, true) : undefined}
                >
                  {column.items && (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => {
                        const { active, over } = event;
                        if (!over || active.id === over.id) return;
                        const items = [...column.items!];
                        const oldIndex = items.findIndex((i) => i.id === active.id);
                        const newIndex = items.findIndex((i) => i.id === over.id);
                        const newColumns = [...config.evolution.columns];
                        newColumns[colIndex] = { ...column, items: arrayMove(items, oldIndex, newIndex) };
                        onUpdateEvolution('columns', newColumns);
                      }}
                    >
                      <SortableContext items={column.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                        {column.items.map((item) => (
                          <SortableEditorItem
                            key={item.id}
                            id={item.id}
                            label={item.text}
                            sublabel={item.status}
                            onEdit={() => {
                              setEditModal({
                                isOpen: true,
                                itemType: 'evolutionItem',
                                section: `column-${colIndex}`,
                                data: item,
                                isNew: false,
                              });
                            }}
                            onDelete={() => {
                              const newItems = column.items!.filter((i) => i.id !== item.id);
                              const newColumns = [...config.evolution.columns];
                              newColumns[colIndex] = { ...column, items: newItems };
                              onUpdateEvolution('columns', newColumns);
                            }}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  )}
                  {column.sections && (
                    <div className="space-y-2 text-xs text-slate-500 italic">
                      {column.sections.map((section) => (
                        <div key={section.id} className="pl-2 border-l-2 border-blue-200">
                          <p className="font-medium text-blue-600">{section.label}</p>
                          <ul className="list-disc list-inside">
                            {section.items.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      <p className="text-[10px] text-slate-400">(Transition sections are not editable)</p>
                    </div>
                  )}
                </EditorSection>
              ))}

              <EditorSection
                title="Timeline Steps"
                icon={Clock}
                count={config.evolution.timeline.length}
                isExpanded={expandedSections.timeline}
                onToggle={() => toggleSection('timeline')}
                onAdd={() => openEditModal('timelineStep', 'timeline', { status: 'upcoming' }, true)}
              >
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEvolutionDragEnd('timeline')}>
                  <SortableContext items={config.evolution.timeline.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {config.evolution.timeline.map((step) => (
                      <SortableEditorItem
                        key={step.id}
                        id={step.id}
                        label={step.label}
                        sublabel={step.status}
                        onEdit={() => openEditModal('timelineStep', 'timeline', step)}
                        onDelete={() => handleDelete('timeline', step.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </EditorSection>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800">
          <div className="flex gap-2">
            <button
              onClick={onReset}
              className="flex-1 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={onSave}
              disabled={!hasChanges}
              className={`flex-1 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                hasChanges
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </motion.div>

      {/* Edit Modal */}
      <EditItemModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ ...editModal, isOpen: false })}
        onSave={handleModalSave}
        itemType={editModal.itemType}
        initialData={editModal.data}
        title={editModal.isNew ? `Add ${editModal.itemType}` : `Edit ${editModal.itemType}`}
      />
    </>
  );
}

// Helper components

interface EditorSectionProps {
  title: string;
  icon: React.ElementType;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  onAdd?: () => void;
  children: React.ReactNode;
}

function EditorSection({
  title,
  icon: Icon,
  count,
  isExpanded,
  onToggle,
  onAdd,
  children,
}: EditorSectionProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
          <Icon className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</span>
        </div>
        <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
          {count}
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-1">
              {children}
              {onAdd && (
                <button
                  onClick={onAdd}
                  className="w-full px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Item
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SortableEditorItemProps {
  id: string;
  label: string;
  sublabel?: string;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableEditorItem({
  id,
  label,
  sublabel,
  onEdit,
  onDelete,
}: SortableEditorItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="group flex items-center gap-1 px-2 py-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
    >
      <button
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
      >
        <GripVertical className="w-3 h-3 text-slate-400" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{label}</p>
        {sublabel && (
          <p className="text-[10px] text-slate-500 truncate">{sublabel}</p>
        )}
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-slate-400 hover:text-blue-500"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-slate-400 hover:text-red-500"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
