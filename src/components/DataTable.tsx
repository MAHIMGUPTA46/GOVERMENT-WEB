import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Upload,
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  SlidersHorizontal,
  CheckSquare,
  Square,
  ExternalLink,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { Project, RiskLevel, ProjectStatus } from '../types';
import { RiskBadge } from './RiskBadge';
import { StatusBadge } from './StatusBadge';
import { DataQualityBadge } from './DataQualityBadge';
import { MINISTRIES, SECTORS } from '../data/mockData';

interface DataTableProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onExportCSV: (selectedOnly?: boolean) => void;
  onOpenCsvIngest?: () => void;
  onOpenGoogleSheets?: () => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onClearSelection: () => void;
}

type SortField = 
  | 'projectCode' 
  | 'name' 
  | 'revisedCost' 
  | 'delayMonths' 
  | 'costOverrunPct' 
  | 'riskScore' 
  | 'physicalProgress' 
  | 'financialProgress' 
  | 'dataQualityScore'
  | 'lastUpdated';

export const DataTable: React.FC<DataTableProps> = ({
  projects,
  onSelectProject,
  onExportCSV,
  onOpenCsvIngest,
  onOpenGoogleSheets,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMinistry, setSelectedMinistry] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [costFilter, setCostFilter] = useState('all'); // all, <1000, 1000-10000, >10000
  const [dataQualityFilter, setDataQualityFilter] = useState<'all' | 'flagged' | 'high' | 'poor'>('all');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('riskScore');
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Column visibility
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    name: true,
    ministry: true,
    sector: true,
    costs: true,
    progress: true,
    delay: true,
    risk: true,
    status: true,
    dataQuality: true,
    lastUpdated: true,
  });

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Search
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const match =
          p.name.toLowerCase().includes(query) ||
          p.projectCode.toLowerCase().includes(query) ||
          p.implementingAgency.toLowerCase().includes(query) ||
          p.state.toLowerCase().includes(query) ||
          p.ministry.toLowerCase().includes(query);
        if (!match) return false;
      }

      // Ministry
      if (selectedMinistry !== 'all' && p.ministry !== selectedMinistry) {
        return false;
      }

      // Sector
      if (selectedSector !== 'all' && p.sector !== selectedSector) {
        return false;
      }

      // Risk
      if (selectedRisk !== 'all' && p.riskLevel !== selectedRisk) {
        return false;
      }

      // Status
      if (selectedStatus !== 'all' && p.projectStatus !== selectedStatus) {
        return false;
      }

      // Cost
      if (costFilter === '<5000' && p.revisedCost >= 5000) return false;
      if (costFilter === '5000-25000' && (p.revisedCost < 5000 || p.revisedCost > 25000)) return false;
      if (costFilter === '>25000' && p.revisedCost <= 25000) return false;

      // Data Quality Audit
      if (dataQualityFilter === 'flagged') {
        const isFlagged = p.missingMandatoryFields && p.missingMandatoryFields.length > 0;
        if (!isFlagged) return false;
      } else if (dataQualityFilter === 'high') {
        if ((p.dataQualityScore ?? 100) < 90) return false;
      } else if (dataQualityFilter === 'poor') {
        if ((p.dataQualityScore ?? 100) >= 75) return false;
      }

      return true;
    });
  }, [projects, searchTerm, selectedMinistry, selectedSector, selectedRisk, selectedStatus, costFilter, dataQualityFilter]);

  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [filteredProjects, sortField, sortAsc]);

  // Paginated
  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / pageSize));
  const paginatedProjects = sortedProjects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default desc for numbers
    }
  };

  const isAllPageSelected =
    paginatedProjects.length > 0 &&
    paginatedProjects.every((p) => selectedIds.includes(p.id));

  const handleSelectPage = () => {
    if (isAllPageSelected) {
      const pageIds = new Set(paginatedProjects.map((p) => p.id));
      onSelectAll(selectedIds.filter((id) => !pageIds.has(id)));
    } else {
      const newIds = Array.from(
        new Set([...selectedIds, ...paginatedProjects.map((p) => p.id)])
      );
      onSelectAll(newIds);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedMinistry('all');
    setSelectedSector('all');
    setSelectedRisk('all');
    setSelectedStatus('all');
    setCostFilter('all');
    setDataQualityFilter('all');
    setCurrentPage(1);
  };

  // Flagged projects count
  const flaggedProjectsCount = useMemo(() => {
    return projects.filter((p) => p.missingMandatoryFields && p.missingMandatoryFields.length > 0).length;
  }, [projects]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Filter Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by Project Name, ID, Agency, or State..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            />
          </div>

          {/* Action Buttons: Export & Column Toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.length > 0 && (
              <span className="text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-1 rounded-md">
                {selectedIds.length} Selected
              </span>
            )}

            {/* Ingest CSV Button */}
            {onOpenCsvIngest && (
              <button
                onClick={onOpenCsvIngest}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 hover:border-blue-300 text-blue-800 hover:bg-blue-100/70 font-semibold text-xs rounded-lg transition-colors shadow-xs"
                title="Bulk ingest projects dataset from CSV file"
              >
                <Upload className="w-3.5 h-3.5 text-blue-700" />
                <span>Ingest CSV</span>
              </button>
            )}

            {/* Export CSV Button */}
            <button
              onClick={() => onExportCSV(selectedIds.length > 0)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium text-xs rounded-lg transition-colors shadow-xs"
              title="Export displayed project dataset to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            {/* Google Sheets Sync / Export Button */}
            {onOpenGoogleSheets && (
              <button
                type="button"
                onClick={onOpenGoogleSheets}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 hover:border-emerald-300 text-emerald-800 hover:bg-emerald-100/70 font-semibold text-xs rounded-lg transition-colors shadow-xs"
                title="Synchronize, import, or export projects with Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Google Sheets</span>
              </button>
            )}

            {/* Column Control Menu */}
            <div className="relative">
              <button
                onClick={() => setShowColumnsMenu(!showColumnsMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium text-xs rounded-lg transition-colors shadow-xs"
                aria-label="Toggle visible table columns"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Columns</span>
              </button>

              {showColumnsMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 text-xs divide-y divide-slate-100">
                  <div className="px-2 py-1 font-bold text-slate-900 text-[11px]">
                    Customize Table Columns
                  </div>
                  <div className="py-1 space-y-1">
                    {Object.entries(visibleColumns).map(([key, isVis]) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer capitalize text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={isVis}
                          onChange={() => toggleColumn(key as any)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reset Filters */}
            <button
              onClick={resetFilters}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Reset all search filters"
              aria-label="Reset all search filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Multi-Filter Dropdown Row */}
        {flaggedProjectsCount > 0 && (
          <div className="bg-amber-50/90 border border-amber-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0 border border-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-900">
                  Data Quality Alert: {flaggedProjectsCount} project{flaggedProjectsCount > 1 ? 's' : ''} flagged with missing statutory mandatory fields
                </p>
                <p className="text-[11px] text-amber-800">
                  Mandatory parameter <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-mono text-[10px]">original_completion_date</code> is unrecorded, hindering schedule slippage and delay attribution analysis.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setDataQualityFilter(dataQualityFilter === 'flagged' ? 'all' : 'flagged');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors shrink-0 shadow-xs ${
                dataQualityFilter === 'flagged'
                  ? 'bg-amber-800 text-white hover:bg-amber-900'
                  : 'bg-amber-200/90 text-amber-900 hover:bg-amber-300'
              }`}
            >
              {dataQualityFilter === 'flagged' ? 'Show All Projects' : `Filter ${flaggedProjectsCount} Flagged Projects`}
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          {/* Ministry Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Ministry
            </label>
            <select
              value={selectedMinistry}
              onChange={(e) => {
                setSelectedMinistry(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Ministries (17)</option>
              {MINISTRIES.map((m) => (
                <option key={m} value={m}>
                  {m.split('(')[0].trim()}
                </option>
              ))}
            </select>
          </div>

          {/* Sector Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Sector
            </label>
            <select
              value={selectedSector}
              onChange={(e) => {
                setSelectedSector(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Sectors (22)</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Risk Category
            </label>
            <select
              value={selectedRisk}
              onChange={(e) => {
                setSelectedRisk(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical (75–100)</option>
              <option value="high">High (50–74)</option>
              <option value="moderate">Moderate (25–49)</option>
              <option value="low">Low (0–24)</option>
            </select>
          </div>

          {/* Project Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Statuses</option>
              <option value="Delayed">Delayed</option>
              <option value="On Schedule">On Schedule</option>
              <option value="Ahead of Schedule">Ahead of Schedule</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Cost Outlay Range */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Cost Outlay
            </label>
            <select
              value={costFilter}
              onChange={(e) => {
                setCostFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Outlay Tiers</option>
              <option value="<5000">&lt; ₹5,000 Cr</option>
              <option value="5000-25000">₹5,000 – ₹25,000 Cr</option>
              <option value=">25000">&gt; ₹25,000 Cr (Mega)</option>
            </select>
          </div>

          {/* Data Quality Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Data Quality
            </label>
            <select
              value={dataQualityFilter}
              onChange={(e) => {
                setDataQualityFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className={`w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium ${
                dataQualityFilter === 'flagged'
                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="all">All Data Quality</option>
              <option value="flagged">⚠️ Flagged (Missing Fields)</option>
              <option value="high">Verified High (≥90%)</option>
              <option value="poor">Needs Audit (&lt;75%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table View (Desktop) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-[#0B1F3A] text-slate-200 uppercase text-[10px] tracking-wider font-semibold sticky top-0 z-10 select-none">
            <tr>
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllPageSelected}
                  onChange={handleSelectPage}
                  className="rounded text-blue-500 focus:ring-blue-400 w-3.5 h-3.5"
                  aria-label="Select all projects on this page"
                />
              </th>
              {visibleColumns.code && (
                <th
                  onClick={() => handleSort('projectCode')}
                  className="p-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              )}
              {visibleColumns.name && (
                <th
                  onClick={() => handleSort('name')}
                  className="p-3 cursor-pointer hover:text-white transition-colors min-w-56"
                >
                  <div className="flex items-center gap-1">
                    <span>Project Name & Agency</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              )}
              {visibleColumns.ministry && (
                <th className="p-3 hidden md:table-cell">Ministry / Sector</th>
              )}
              {visibleColumns.costs && (
                <th
                  onClick={() => handleSort('revisedCost')}
                  className="p-3 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Revised (₹ Cr)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              )}
              {visibleColumns.progress && (
                <th
                  onClick={() => handleSort('physicalProgress')}
                  className="p-3 text-center cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Progress (%)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              )}
              {visibleColumns.delay && (
                <th
                  onClick={() => handleSort('delayMonths')}
                  className="p-3 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Delay</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              )}
              {visibleColumns.risk && (
                <th
                  onClick={() => handleSort('riskScore')}
                  className="p-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Risk Level</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              )}
              {visibleColumns.status && (
                <th className="p-3 hidden sm:table-cell">Status</th>
              )}
              {visibleColumns.dataQuality && (
                <th
                  onClick={() => handleSort('dataQualityScore')}
                  className="p-3 cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                  title="Sort by statutory Data Quality score"
                >
                  <div className="flex items-center gap-1">
                    <span>Data Quality</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              )}
              <th className="p-3 text-right pr-4">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {paginatedProjects.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="font-semibold text-slate-700">No projects match selected filter criteria</p>
                    <p className="text-xs text-slate-400">Try adjusting your keyword query or resetting sector and ministry filters.</p>
                    <button
                      onClick={resetFilters}
                      className="mt-2 px-3 py-1.5 bg-blue-50 text-blue-700 font-medium text-xs rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedProjects.map((proj) => {
                const isSelected = selectedIds.includes(proj.id);

                return (
                  <tr
                    key={proj.id}
                    className={`hover:bg-blue-50/40 transition-colors group cursor-pointer ${
                      isSelected ? 'bg-blue-50/70' : ''
                    }`}
                    onClick={() => onSelectProject(proj.id)}
                  >
                    {/* Checkbox */}
                    <td
                      className="p-3 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(proj.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(proj.id)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                        aria-label={`Select project ${proj.projectCode}`}
                      />
                    </td>

                    {/* Code */}
                    {visibleColumns.code && (
                      <td className="p-3 font-mono font-bold text-blue-800 whitespace-nowrap">
                        {proj.projectCode}
                      </td>
                    )}

                    {/* Name & Agency */}
                    {visibleColumns.name && (
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1">
                            {proj.name}
                          </span>
                          {proj.missingMandatoryFields && proj.missingMandatoryFields.length > 0 && (
                            <DataQualityBadge
                              score={proj.dataQualityScore}
                              missingMandatoryFields={proj.missingMandatoryFields}
                              issues={proj.dataQualityIssues}
                              size="xs"
                            />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {proj.implementingAgency} · {proj.state}
                        </div>
                      </td>
                    )}

                    {/* Ministry / Sector */}
                    {visibleColumns.ministry && (
                      <td className="p-3 hidden md:table-cell text-slate-600">
                        <div className="font-medium text-slate-800 truncate max-w-[180px]">
                          {proj.sector}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                          {proj.ministry.replace('Ministry of ', '').replace('Department of ', '')}
                        </div>
                      </td>
                    )}

                    {/* Costs */}
                    {visibleColumns.costs && (
                      <td className="p-3 text-right">
                        <div className="font-mono font-bold text-slate-900">
                          ₹{proj.revisedCost.toLocaleString()}
                        </div>
                        <div className={`text-[10px] font-mono ${
                          proj.costOverrunPct > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'
                        }`}>
                          {proj.costOverrunPct > 0 ? `+${proj.costOverrunPct.toFixed(1)}%` : '0%'}
                        </div>
                      </td>
                    )}

                    {/* Progress */}
                    {visibleColumns.progress && (
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-mono text-[11px] font-bold text-slate-800">
                          <span>{proj.physicalProgress}%</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-slate-500 text-[10px]">{proj.financialProgress}% fin</span>
                        </div>
                        <div className="w-16 mx-auto bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${proj.physicalProgress}%` }}
                          />
                        </div>
                      </td>
                    )}

                    {/* Delay */}
                    {visibleColumns.delay && (
                      <td className="p-3 text-right font-mono">
                        {proj.delayMonths > 0 ? (
                          <span className="text-amber-800 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[11px]">
                            {proj.delayMonths} mos
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-[11px]">On Time</span>
                        )}
                      </td>
                    )}

                    {/* Risk Level */}
                    {visibleColumns.risk && (
                      <td className="p-3">
                        <RiskBadge level={proj.riskLevel} score={proj.riskScore} size="sm" />
                      </td>
                    )}

                    {/* Status */}
                    {visibleColumns.status && (
                      <td className="p-3 hidden sm:table-cell">
                        <StatusBadge status={proj.projectStatus} size="sm" />
                      </td>
                    )}

                    {/* Data Quality */}
                    {visibleColumns.dataQuality && (
                      <td className="p-3 whitespace-nowrap">
                        <DataQualityBadge
                          score={proj.dataQualityScore}
                          missingMandatoryFields={proj.missingMandatoryFields}
                          issues={proj.dataQualityIssues}
                          size="sm"
                        />
                      </td>
                    )}

                    {/* Actions */}
                    <td className="p-3 text-right pr-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProject(proj.id);
                        }}
                        className="p-1 text-blue-700 hover:text-blue-900 hover:bg-blue-100 rounded transition-colors inline-flex items-center gap-1 text-xs font-medium"
                        title="Open full analytical dossier"
                        aria-label={`Open dossier for ${proj.projectCode}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Dossier</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <span>
            Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong>{Math.min(sortedProjects.length, currentPage * pageSize)}</strong> of{' '}
            <strong>{sortedProjects.length}</strong> filtered records (out of 1,981)
          </span>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-medium text-slate-700"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono font-medium text-slate-800">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
