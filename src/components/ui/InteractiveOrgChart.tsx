import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UndoRedo } from '../../utils/undoRedoState';
import { 
  Building2, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Target,
  DollarSign,
  TrendingUp,
  Edit,
  Plus,
  Maximize2,
  Minimize2,
  Undo,
  Redo,
  LayoutGrid,
  Save,
  AlertTriangle,
  RefreshCw,
  X
} from 'lucide-react';
import { Department, EmployeeProfile, DepartmentRelationship, OrgChartPosition } from '../../hooks/useOrganizationalData';

interface InteractiveOrgChartProps {
  departments: Department[];
  employees: EmployeeProfile[];
  relationships: DepartmentRelationship[];
  positions: OrgChartPosition[];
  onPositionUpdate: (departmentId: string, x: number, y: number) => void;
  searchTerm: string;
  isEditMode: boolean;
  onSaveLayout: () => Promise<void>;
  onResetLayout: () => Promise<void>;
  onDepartmentSelect?: (departmentId: string) => void;
}

interface DragState {
  isDragging: boolean;
  departmentId: string | null;
  offset: { x: number; y: number };
}

export default function InteractiveOrgChart({
  departments,
  employees,
  relationships,
  positions,
  onPositionUpdate,
  searchTerm,
  isEditMode,
  onSaveLayout,
  onResetLayout
  ,onDepartmentSelect
}: InteractiveOrgChartProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>({ isDragging: false, departmentId: null, offset: { x: 0, y: 0 } });
  const [zoom, setZoom] = useState(1);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1200, height: 800 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const undoRedoRef = useRef(new UndoRedo<Record<string, {x: number, y: number}>>(10));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  // Initialize undo/redo state with current positions
  useEffect(() => {
    const positionsMap = positions.reduce((acc, pos) => {
      acc[pos.department_id] = { x: pos.x_position, y: pos.y_position };
      return acc;
    }, {} as Record<string, {x: number, y: number}>);
    
    undoRedoRef.current.push(positionsMap);
    updateUndoRedoState();
  }, []);
  
  const updateUndoRedoState = () => {
    setCanUndo(undoRedoRef.current.canUndo());
    setCanRedo(undoRedoRef.current.canRedo());
  };

  // Filter departments based on search term
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  // Get position for a department
  const getDepartmentPosition = (departmentId: string) => {
    const position = positions.find(p => p.department_id === departmentId);
    return position ? { x: position.x_position, y: position.y_position } : { x: 100 + Math.random() * 800, y: 100 + Math.random() * 500 };
  };

  // Get department employees count
  const getDepartmentEmployeeCount = (departmentId: string) => {
    return employees.filter(emp => emp.primary_department_id === departmentId).length;
  };

  // Get department lead
  const getDepartmentLead = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    if (!dept?.department_lead_id) return null;
    return employees.find(emp => emp.user_id === dept.department_lead_id);
  };

  // Handle mouse down on department node
  const handleMouseDown = useCallback((e: React.MouseEvent, departmentId: string) => {
    e.preventDefault();
    if (!isEditMode) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const position = getDepartmentPosition(departmentId);
    setDragState({
      isDragging: true,
      departmentId,
      offset: {
        x: (e.clientX - rect.left) / zoom - position.x,
        y: (e.clientY - rect.top) / zoom - position.y
      }
    });
  }, [zoom, isEditMode]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.departmentId) return;
    if (!isEditMode) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newX = (e.clientX - rect.left) / zoom - dragState.offset.x;
    const newY = (e.clientY - rect.top) / zoom - dragState.offset.y;

    // Apply snapping if enabled
    let finalX = newX;
    let finalY = newY;
    if (snapEnabled) {
      const gridSize = 20; // Snap to 20px grid
      finalX = Math.round(newX / gridSize) * gridSize;
      finalY = Math.round(newY / gridSize) * gridSize;
    }

    // Update position optimistically
    onPositionUpdate(dragState.departmentId, finalX, finalY);
  }, [dragState, zoom, onPositionUpdate, isEditMode, snapEnabled]);

  // Track if we need to save positions to undo history
  const [shouldSaveToHistory, setShouldSaveToHistory] = useState(false);
  
  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragState({ isDragging: false, departmentId: null, offset: { x: 0, y: 0 } });
    
    // Save current positions to undo history
    if (shouldSaveToHistory) {
      const positionsMap = positions?.reduce((acc, pos) => {
        acc[pos.department_id] = { x: pos.x_position, y: pos.y_position };
        return acc;
      }, {} as Record<string, {x: number, y: number}>) || {};
      
      undoRedoRef.current.push(positionsMap);
      updateUndoRedoState();
      setShouldSaveToHistory(false);
    }
  }, []);
  
  // When drag starts, we should save to history on next mouseup
  useEffect(() => {
    if (dragState.isDragging) {
      setShouldSaveToHistory(true);
    }
  }, [dragState.isDragging]);

  // Handle zoom
  const handleZoom = (direction: 'in' | 'out') => {
    const newZoom = direction === 'in' ? Math.min(zoom * 1.2, 3) : Math.max(zoom / 1.2, 0.3);
    setZoom(newZoom);
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  // Handle undo
  const handleUndo = () => {
    const prevState = undoRedoRef.current.undo();
    if (prevState) {
      // Apply previous positions
      Object.entries(prevState).forEach(([departmentId, position]) => {
        onPositionUpdate(departmentId, position.x, position.y);
      });
      updateUndoRedoState();
    }
  };
  
  // Handle redo
  const handleRedo = () => {
    const nextState = undoRedoRef.current.redo();
    if (nextState) {
      // Apply next positions
      Object.entries(nextState).forEach(([departmentId, position]) => {
        onPositionUpdate(departmentId, position.x, position.y);
      });
      updateUndoRedoState();
    }
  };
  
  // Handle save layout
  const handleSaveLayout = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSaveLayout();
      setIsSaving(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save layout');
      setIsSaving(false);
    }
  };

  // Render connection lines between departments
  const renderConnections = () => {
    return relationships.map(rel => {
      const source = getDepartmentPosition(rel.source_department_id);
      const target = getDepartmentPosition(rel.target_department_id);
      
      // Calculate connection points (center of nodes)
      const sourceX = source.x + 100; // Half of node width
      const sourceY = source.y + 50;  // Half of node height
      const targetX = target.x + 100;
      const targetY = target.y + 50;

      // Different line styles for different relationship types
      const getLineStyle = (type: string) => {
        switch (type) {
          case 'reports_to':
            return { stroke: '#3B82F6', strokeWidth: 2, strokeDasharray: 'none' };
          case 'collaborates_with':
            return { stroke: '#10B981', strokeWidth: 1.5, strokeDasharray: '5,5' };
          case 'supports':
            return { stroke: '#F59E0B', strokeWidth: 1, strokeDasharray: '3,3' };
          default:
            return { stroke: '#6B7280', strokeWidth: 1, strokeDasharray: 'none' };
        }
      };

      const lineStyle = getLineStyle(rel.relationship_type);

      return (
        <g key={rel.id}>
          <line
            x1={sourceX}
            y1={sourceY}
            x2={targetX}
            y2={targetY}
            {...lineStyle}
            opacity={0.7}
          />
          {/* Arrow head for reports_to relationships */}
          {rel.relationship_type === 'reports_to' && (
            <polygon
              points={`${targetX-8},${targetY-4} ${targetX},${targetY} ${targetX-8},${targetY+4}`}
              fill={lineStyle.stroke}
              opacity={0.7}
            />
          )}
        </g>
      );
    });
  };

  // Render department node
  const renderDepartmentNode = (department: Department) => {
    const position = getDepartmentPosition(department.id);
    const employeeCount = getDepartmentEmployeeCount(department.id);
    const departmentLead = getDepartmentLead(department.id);
    const isSelected = selectedDepartment === department.id;
    const isHighlighted = searchTerm && department.name.toLowerCase().includes(searchTerm.toLowerCase());

    return (
      <g
        key={department.id}
        transform={`translate(${position.x}, ${position.y})`}
        style={{ cursor: dragState.isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Department node background */}
        <motion.rect
          width={200}
          height={100}
          rx={12}
          fill={isSelected ? '#3B82F6' : isHighlighted ? '#10B981' : '#FFFFFF'}
          stroke={isSelected ? '#1E40AF' : isHighlighted ? '#059669' : '#E2E8F0'}
          strokeWidth={isSelected || isHighlighted ? 3 : 2}
          onMouseDown={(e) => handleMouseDown(e, department.id)}
          onClick={() => setSelectedDepartment(isSelected ? null : department.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="drop-shadow-md"
         onClick={(e) => {
           if (!dragState.isDragging) {
             setSelectedDepartment(isSelected ? null : department.id);
             if (onDepartmentSelect) onDepartmentSelect(department.id);
           }
           if (onDepartmentSelect) onDepartmentSelect(department.id);
         }}
        />

        {/* Department icon */}
        <foreignObject x={10} y={10} width={24} height={24}>
          <Building2 
            className={`w-6 h-6 ${isSelected ? 'text-white' : isHighlighted ? 'text-white' : 'text-indigo-600'}`}
          />
        </foreignObject>

        {/* Department name */}
        <text
          x={45}
          y={25}
          fontSize={14}
          fontWeight="bold"
          fill={isSelected || isHighlighted ? '#FFFFFF' : '#1F2937'}
          className="pointer-events-none select-none"
        >
          {department.name}
        </text>

        {/* Employee count */}
        <foreignObject x={10} y={35} width={16} height={16}>
          <Users className={`w-4 h-4 ${isSelected ? 'text-white' : isHighlighted ? 'text-white' : 'text-slate-600'}`} />
        </foreignObject>
        <text
          x={30}
          y={46}
          fontSize={12}
          fill={isSelected || isHighlighted ? '#FFFFFF' : '#64748B'}
          className="pointer-events-none select-none"
        >
          {employeeCount} employees
        </text>

        {/* Department lead */}
        {departmentLead && (
          <>
            <text
              x={10}
              y={65}
              fontSize={10}
              fill={isSelected || isHighlighted ? '#FFFFFF' : '#64748B'}
              className="pointer-events-none select-none"
            >
              Lead:
            </text>
            <text
              x={35}
              y={65}
              fontSize={10}
              fontWeight="medium"
              fill={isSelected || isHighlighted ? '#FFFFFF' : '#374151'}
              className="pointer-events-none select-none"
            >
              {`${departmentLead.first_name} ${departmentLead.last_name}`}
            </text>
          </>
        )}

        {/* Budget indicator */}
        {department.budget_allocated && (
          <>
            <foreignObject x={10} y={75} width={12} height={12}>
              <DollarSign className={`w-3 h-3 ${isSelected ? 'text-white' : isHighlighted ? 'text-white' : 'text-green-600'}`} />
            </foreignObject>
            <text
              x={25}
              y={83}
              fontSize={9}
              fill={isSelected || isHighlighted ? '#FFFFFF' : '#059669'}
              className="pointer-events-none select-none"
            >
              ${(department.budget_allocated / 1000).toFixed(0)}K
            </text>
          </>
        )}

        {/* Edit button (visible on hover) */}
        <foreignObject x={170} y={10} width={20} height={20} className="opacity-0 hover:opacity-100 transition-opacity">
          <button className="w-5 h-5 bg-white rounded shadow-md flex items-center justify-center hover:bg-slate-50">
            <Edit className="w-3 h-3 text-slate-600" />
          </button>
        </foreignObject>
      </g>
    );
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-96 border border-slate-200 rounded-lg overflow-hidden'}`}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        <div className="bg-white shadow-md rounded-lg p-2 flex items-center space-x-1">
          <button
            onClick={() => handleZoom('out')}
            className="p-1 hover:bg-slate-100 rounded"
            title="Zoom Out"
          >
            <Minimize2 className="w-4 h-4 text-slate-600" />
          </button>
          <span className="text-xs text-slate-600 px-2">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => handleZoom('in')}
            className="p-1 hover:bg-slate-100 rounded"
            title="Zoom In"
          >
            <Plus className="w-4 h-4 text-slate-600" />
          </button>
        </div>
        
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`bg-white shadow-md rounded-lg p-2 hover:bg-slate-50 ${showGrid ? 'text-indigo-600' : 'text-slate-600'}`}
          title="Toggle Grid"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => setSnapEnabled(!snapEnabled)}
          className={`bg-white shadow-md rounded-lg p-2 hover:bg-slate-50 ${snapEnabled ? 'text-indigo-600' : 'text-slate-600'}`}
          title={snapEnabled ? "Snapping Enabled" : "Snapping Disabled"}
        >
          <Target className="w-4 h-4" />
        </button>
        
        <button
          onClick={toggleFullscreen}
          className="bg-white shadow-md rounded-lg p-2 hover:bg-slate-50"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          <Maximize2 className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Edit Mode Controls */}
      {isEditMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center space-x-2 bg-white shadow-md rounded-lg p-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="p-2 hover:bg-slate-100 rounded text-slate-600 disabled:text-slate-300 disabled:hover:bg-transparent"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="p-2 hover:bg-slate-100 rounded text-slate-600 disabled:text-slate-300 disabled:hover:bg-transparent"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-slate-200"></div>
          <button
            onClick={handleSaveLayout}
            disabled={isSaving}
            className="p-2 hover:bg-indigo-50 rounded text-indigo-600 flex items-center space-x-1"
            title="Save Layout"
          >
            {isSaving ? 
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> :
              <Save className="w-4 h-4" />
            }
            <span className="text-xs font-medium">Save Layout</span>
          </button>
          <button
            onClick={onResetLayout}
            className="p-2 hover:bg-red-50 rounded text-red-600 flex items-center space-x-1"
            title="Reset Layout"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-xs font-medium">Reset</span>
          </button>
        </div>
      )}
      
      {/* Save Error Message */}
      {saveError && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10 bg-red-50 border border-red-200 rounded-lg p-2 flex items-center space-x-2 text-sm text-red-600">
          <AlertTriangle className="w-4 h-4" />
          <span>{saveError}</span>
          <button 
            onClick={() => setSaveError(null)} 
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 bg-white shadow-md rounded-lg p-3">
        <h4 className="text-xs font-semibold text-slate-700 mb-2">Relationships</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span className="text-slate-600">Reports to</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-emerald-500" style={{ backgroundImage: 'repeating-linear-gradient(to right, #10B981 0, #10B981 3px, transparent 3px, transparent 8px)' }}></div>
            <span className="text-slate-600">Collaborates</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-amber-500" style={{ backgroundImage: 'repeating-linear-gradient(to right, #F59E0B 0, #F59E0B 2px, transparent 2px, transparent 5px)' }}></div>
            <span className="text-slate-600">Supports</span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
      >
        {/* Grid background */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke={showGrid ? "#F1F5F9" : "transparent"} strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Render connections */}
        {renderConnections()}

        {/* Render department nodes */}
        {filteredDepartments.map(department => renderDepartmentNode(department))}
      </svg>

      {/* Department Details Panel */}
      {selectedDepartment && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl border-l border-slate-200 overflow-y-auto"
        >
          {(() => {
            const dept = departments.find(d => d.id === selectedDepartment);
            if (!dept) return null;

            const deptEmployees = employees.filter(emp => emp.primary_department_id === dept.id);
            const deptLead = getDepartmentLead(dept.id);

            return (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">{dept.name}</h3>
                  <button
                    onClick={() => setSelectedDepartment(null)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <Plus className="w-4 h-4 text-slate-400 transform rotate-45" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Description</h4>
                    <p className="text-sm text-slate-600">{dept.description || 'No description available'}</p>
                  </div>

                  {dept.strategic_purpose && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Strategic Purpose</h4>
                      <p className="text-sm text-slate-600">{dept.strategic_purpose}</p>
                    </div>
                  )}

                  {/* Department Lead */}
                  {deptLead && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Department Lead</h4>
                      <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">
                            {deptLead.first_name[0]}{deptLead.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {deptLead.first_name} {deptLead.last_name}
                          </p>
                          <p className="text-xs text-slate-600">{deptLead.title}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Metrics */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Metrics</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <Users className="w-4 h-4 text-slate-600" />
                          <span className="text-xs text-slate-600">Employees</span>
                        </div>
                        <p className="text-lg font-semibold text-slate-900">{deptEmployees.length}</p>
                      </div>
                      
                      {dept.budget_allocated && (
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <DollarSign className="w-4 h-4 text-slate-600" />
                            <span className="text-xs text-slate-600">Budget</span>
                          </div>
                          <p className="text-lg font-semibold text-slate-900">
                            ${(dept.budget_allocated / 1000).toFixed(0)}K
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Team Members */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Team Members</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {deptEmployees.map((employee) => (
                        <div key={employee.id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-slate-600">
                              {employee.first_name[0]}{employee.last_name[0]}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">
                              {employee.first_name} {employee.last_name}
                            </p>
                            <p className="text-xs text-slate-600">{employee.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contact Info */}
                  {dept.contact_email && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Contact</h4>
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Mail className="w-4 h-4" />
                        <span>{dept.contact_email}</span>
                      </div>
                    </div>
                  )}

                  {dept.location && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4" />
                      <span>{dept.location}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors">
                      Edit Department
                    </button>
                    <button className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
}