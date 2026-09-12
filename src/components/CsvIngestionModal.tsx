import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Download, 
  ArrowRight, 
  Database, 
  CloudUpload,
  RefreshCw,
  Info,
  Layers,
  ChevronDown,
  Table as TableIcon
} from 'lucide-react';
import { Project } from '../types';
import { 
  parseProjectsCSV, 
  generateSampleProjectsCsv, 
  downloadFile,
  CsvProjectParseResult 
} from '../utils/csvParser';
import { RiskBadge } from './RiskBadge';
import { StatusBadge } from './StatusBadge';
import { DataQualityBadge } from './DataQualityBadge';
import { auth } from '../lib/firebase';
import { seedFirestoreDatabase } from '../services/firestoreProjects';

interface CsvIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestProjects: (projects: Project[], mode: 'append' | 'upsert') => void;
  existingProjectsCount: number;
}

export const CsvIngestionModal: React.FC<CsvIngestionModalProps> = ({
  isOpen,
  onClose,
  onIngestProjects,
  existingProjectsCount,
}) => {
  const [activeStep, setActiveStep] = useState<'upload' | 'preview' | 'completed'>('upload');
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [parseResult, setParseResult] = useState<CsvProjectParseResult | null>(null);
  const [ingestMode, setIngestMode] = useState<'append' | 'upsert'>('upsert');
  const [syncToCloud, setSyncToCloud] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [ingestedCount, setIngestedCount] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      alert('Please upload a valid CSV file (.csv).');
      return;
    }

    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);
      const result = parseProjectsCSV(text);
      setParseResult(result);
      if (result.validProjects.length > 0) {
        setActiveStep('preview');
      }
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSampleData = () => {
    const sample = generateSampleProjectsCsv();
    setFileName('MoSPI_IPMD_Central_Sector_Sample.csv');
    setFileSize('1.4 KB');
    setCsvContent(sample);
    const result = parseProjectsCSV(sample);
    setParseResult(result);
    setActiveStep('preview');
  };

  const handleDownloadTemplate = () => {
    const template = generateSampleProjectsCsv();
    downloadFile(template, 'MoSPI_Project_Ingest_Template.csv');
  };

  const handleConfirmIngest = async () => {
    if (!parseResult || parseResult.validProjects.length === 0) return;

    setIsProcessing(true);
    const projectsToIngest = parseResult.validProjects;

    try {
      // 1. Update client application state
      onIngestProjects(projectsToIngest, ingestMode);
      setIngestedCount(projectsToIngest.length);

      // 2. Optionally sync into Cloud Firestore if signed in
      if (syncToCloud && auth.currentUser) {
        try {
          await seedFirestoreDatabase(
            projectsToIngest,
            [],
            [],
            [],
            () => {}
          );
        } catch (cloudErr) {
          console.warn('[CsvIngestion] Firestore sync bypassed or offline:', cloudErr);
        }
      }

      setActiveStep('completed');
    } catch (err) {
      console.error('[CsvIngestion] Ingestion failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setActiveStep('upload');
    setCsvContent('');
    setFileName('');
    setFileSize('');
    setParseResult(null);
    setIngestedCount(0);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-ingest-title"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#0F294A] text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-300 border border-blue-400/20">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <h2 id="csv-ingest-title" className="text-base font-bold text-white flex items-center gap-2">
                Ingest Project Register Dataset (CSV)
              </h2>
              <p className="text-xs text-blue-200/80">
                Bulk upload central sector infrastructure projects (MoSPI / IPMD / OCMS schema)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close CSV Ingestion Dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Navigation */}
        <div className="flex items-center border-b border-slate-100 bg-slate-50 px-6 py-2.5 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              activeStep === 'upload' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              1
            </span>
            <span className={activeStep === 'upload' ? 'text-blue-900 font-semibold' : 'text-slate-600'}>
              File Upload
            </span>
          </div>

          <div className="w-8 h-px bg-slate-300 mx-3"></div>

          <div className="flex items-center gap-2 font-medium">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              activeStep === 'preview' ? 'bg-blue-600 text-white' : activeStep === 'completed' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              2
            </span>
            <span className={activeStep === 'preview' ? 'text-blue-900 font-semibold' : 'text-slate-600'}>
              Validation & Schema Preview
            </span>
          </div>

          <div className="w-8 h-px bg-slate-300 mx-3"></div>

          <div className="flex items-center gap-2 font-medium">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              activeStep === 'completed' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              3
            </span>
            <span className={activeStep === 'completed' ? 'text-emerald-900 font-semibold' : 'text-slate-600'}>
              Ingestion Complete
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeStep === 'upload' && (
            <div className="space-y-6">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragging 
                    ? 'border-blue-600 bg-blue-50/50 scale-[0.99]' 
                    : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-100/60 flex items-center justify-center text-blue-700">
                  <Upload className="w-7 h-7" />
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Drag and drop your project CSV here, or <span className="text-blue-600 underline">browse files</span>
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  Supports official MoSPI / IPMD appraisal formats with columns for Project Code, Costs, Physical & Financial progress, and delays.
                </p>

                <div className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Accepts .csv up to 25 MB</span>
                </div>
              </div>

              {/* Template & Sample Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-start gap-3">
                  <div className="p-2 bg-blue-50 text-blue-700 rounded-lg shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-1">Download Standard Template</h4>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Get a pre-formatted CSV template with all 16 required and optional MoSPI project attributes.
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Download Template (.csv)</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50/60 transition-colors flex items-start gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-1">Load Demo Dataset</h4>
                    <p className="text-[11px] text-slate-600 mb-2">
                      Immediately preview and ingest 5 high-priority central sector projects (Railways, Highways, Power).
                    </p>
                    <button
                      type="button"
                      onClick={handleLoadSampleData}
                      className="text-xs font-semibold text-blue-800 hover:text-blue-900 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Load Sample Data</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Schema Hint */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900 text-xs">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Expected Key Attributes in CSV</span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {['Project Code', 'Project Name', 'Ministry', 'Sector', 'Original Cost', 'Revised Cost', 'Physical %', 'Financial %', 'Delay Months', 'Status'].map((col) => (
                    <span key={col} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-mono">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeStep === 'preview' && parseResult && (
            <div className="space-y-6">
              {/* Parse Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
                    Total Rows Parsed
                  </span>
                  <div className="text-xl font-bold text-slate-900">{parseResult.totalRowsParsed}</div>
                  <span className="text-[10px] text-slate-400 truncate block mt-0.5">{fileName} ({fileSize})</span>
                </div>

                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider block mb-1">
                    Valid Projects
                  </span>
                  <div className="text-xl font-bold text-emerald-700">{parseResult.validProjects.length}</div>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">Ready for ingestion</span>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  parseResult.invalidRows.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[11px] font-medium uppercase tracking-wider block mb-1 ${
                    parseResult.invalidRows.length > 0 ? 'text-rose-800' : 'text-slate-500'
                  }`}>
                    Invalid Rows
                  </span>
                  <div className={`text-xl font-bold ${
                    parseResult.invalidRows.length > 0 ? 'text-rose-700' : 'text-slate-700'
                  }`}>
                    {parseResult.invalidRows.length}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {parseResult.invalidRows.length > 0 ? 'Skipped due to errors' : 'No validation errors'}
                  </span>
                </div>

                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-[11px] font-medium text-blue-800 uppercase tracking-wider block mb-1">
                    Existing In Register
                  </span>
                  <div className="text-xl font-bold text-blue-900">{existingProjectsCount}</div>
                  <span className="text-[10px] text-blue-700 block mt-0.5">Prior to ingestion</span>
                </div>
              </div>

              {/* Ingestion Settings */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Ingestion Configuration
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Ingestion Mode */}
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      Duplicate Handling Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIngestMode('upsert')}
                        className={`px-3 py-2 text-xs rounded-lg border font-medium text-left transition-colors ${
                          ingestMode === 'upsert'
                            ? 'bg-blue-50 border-blue-600 text-blue-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div>Upsert / Overwrite</div>
                        <div className="text-[10px] text-slate-500 font-normal">Update existing by Project Code</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIngestMode('append')}
                        className={`px-3 py-2 text-xs rounded-lg border font-medium text-left transition-colors ${
                          ingestMode === 'append'
                            ? 'bg-blue-50 border-blue-600 text-blue-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div>Append All</div>
                        <div className="text-[10px] text-slate-500 font-normal">Add as new unique records</div>
                      </button>
                    </div>
                  </div>

                  {/* Cloud Sync Option */}
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      Cloud Persistence
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-slate-300">
                      <input
                        type="checkbox"
                        checked={syncToCloud}
                        onChange={(e) => setSyncToCloud(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <div className="text-xs text-slate-800 font-medium">
                        Sync to Cloud Firestore Database
                        <span className="block text-[10px] text-slate-500 font-normal">
                          Persists records across monitoring officer sessions
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Data Quality Notice */}
              {parseResult.validProjects.some(p => p.missingMandatoryFields && p.missingMandatoryFields.length > 0) && (
                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Data Quality Audit Flag:</span>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      {parseResult.validProjects.filter(p => p.missingMandatoryFields && p.missingMandatoryFields.length > 0).length} of {parseResult.validProjects.length} parsed records are missing statutory mandatory fields (such as <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-mono text-[10px]">original_completion_date</code>). These records will be tagged with a warning badge in the project list.
                    </p>
                  </div>
                </div>
              )}

              {/* Warnings List */}
              {parseResult.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold">Schema Notes:</span>
                    {parseResult.warnings.map((w, idx) => (
                      <p key={idx} className="text-amber-800">{w}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <TableIcon className="w-4 h-4 text-slate-500" />
                    <span>Parsed Records Preview (Showing first {Math.min(5, parseResult.validProjects.length)})</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {parseResult.validProjects.length} total ready to commit
                  </span>
                </div>

                <div className="overflow-x-auto max-h-60">
                  <table className="w-full text-left text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Code</th>
                        <th className="px-3 py-2">Project Name</th>
                        <th className="px-3 py-2">Ministry & Sector</th>
                        <th className="px-3 py-2 text-right">Cost (₹ Cr)</th>
                        <th className="px-3 py-2 text-center">Progress (Phy/Fin)</th>
                        <th className="px-3 py-2 text-center">Delay</th>
                        <th className="px-3 py-2 text-center">Risk Score</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2 text-center">Data Quality</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {parseResult.validProjects.slice(0, 5).map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-mono font-bold text-blue-900 whitespace-nowrap">
                            {p.projectCode}
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-900 max-w-xs truncate" title={p.name}>
                            <div className="flex items-center gap-1.5">
                              <span className="truncate">{p.name}</span>
                              {p.missingMandatoryFields && p.missingMandatoryFields.length > 0 && (
                                <DataQualityBadge
                                  score={p.dataQualityScore}
                                  missingMandatoryFields={p.missingMandatoryFields}
                                  issues={p.dataQualityIssues}
                                  size="xs"
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                            <span className="font-medium text-slate-800">{p.sector}</span>
                            <span className="block text-[10px] text-slate-400 truncate max-w-[140px]">{p.ministry}</span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-slate-900 whitespace-nowrap">
                            ₹{p.revisedCost.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap font-mono">
                            {p.physicalProgress}% / {p.financialProgress}%
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            {p.delayMonths > 0 ? (
                              <span className="text-amber-700 font-medium">+{p.delayMonths} mo</span>
                            ) : (
                              <span className="text-emerald-700">0 mo</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <RiskBadge level={p.riskLevel} score={p.riskScore} />
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <StatusBadge status={p.projectStatus} />
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <DataQualityBadge
                              score={p.dataQualityScore}
                              missingMandatoryFields={p.missingMandatoryFields}
                              issues={p.dataQualityIssues}
                              size="xs"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeStep === 'completed' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  CSV Ingestion Completed Successfully
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                  Ingested <span className="font-bold text-emerald-700">{ingestedCount}</span> project records into the Central Sector Infrastructure Register.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-sm mx-auto text-left text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Ingested Records:</span>
                  <span className="font-bold text-slate-900">{ingestedCount}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Duplicate Policy:</span>
                  <span className="font-semibold text-slate-800 capitalize">{ingestMode}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Active Projects:</span>
                  <span className="font-bold text-blue-900">
                    {ingestMode === 'append' ? existingProjectsCount + ingestedCount : Math.max(existingProjectsCount, ingestedCount)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {activeStep === 'upload' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Select CSV File</span>
              </button>
            </>
          )}

          {activeStep === 'preview' && (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Back to Upload
              </button>

              <button
                type="button"
                onClick={handleConfirmIngest}
                disabled={isProcessing || !parseResult || parseResult.validProjects.length === 0}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Ingestion...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Ingest {parseResult?.validProjects.length} Projects</span>
                  </>
                )}
              </button>
            </>
          )}

          {activeStep === 'completed' && (
            <div className="w-full flex justify-end gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Ingest Another File
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-sm"
              >
                Done & View Projects
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
