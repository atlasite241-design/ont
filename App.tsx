import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Database, SearchX, Search, Upload, Download, ShieldCheck, ListFilter, AlertTriangle, Activity, Settings, ClipboardList, Archive, Copy, Hourglass, Play, LayoutGrid, Repeat, ShieldAlert, Ban } from 'lucide-react';
import { User, ONTRecord, ONTStatus, FilterState, KPIStats, Theme, ConnectionLog } from './types';
import { dbService } from './services/dbService';
import { soundService } from './services/soundService';
import { parseNokiaFile, parseExcelFile, exportToExcel } from './services/excelService';
import { extractNokiaDataFromImage } from './services/ocrService';
import LoginForm from './components/LoginForm';
import SettingsPanel from './components/SettingsPanel';
import DataTable from './components/DataTable';
import LoadingOverlay from './components/LoadingOverlay';
import SearchDialog from './components/SearchDialog';
import AboutDialog from './components/AboutDialog';
import ReadmeDialog from './components/ReadmeDialog';
import LisezMoiDialog from './components/LisezMoiDialog';
import MessageDialog from './components/MessageDialog';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SectionHeader from './components/SectionHeader';
import StatsGrid from './components/StatsGrid';
import MassiveSearch from './components/MassiveSearch';
import ActionBar from './components/ActionBar';
import ActiveFilters from './components/ActiveFilters';
import TechStatsDialog from './components/TechStatsDialog'; // IMPORT NEW DIALOG
import AdminPanel from './components/AdminPanel'; // IMPORT ADMIN PANEL
import PasswordDialog from './components/PasswordDialog'; // IMPORT PASSWORD DIALOG
import LogsDialog from './components/LogsDialog';
import { DigitalDisplay } from './components/DigitalDisplay';

const DEMO_DATA: ONTRecord[] = [
    //{ id: 'demo-1', msan: '100737066', version: '26ABID', location: '1321/1 OMO HAS2', sn: 'ALCLB46C99A4', vendorId: 'ALCL', status: 'critical' },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme>(localStorage.getItem('theme') as Theme || 'midnight');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const [data, setData] = useState<ONTRecord[]>([]);
  const [data2, setData2] = useState<ONTRecord[]>([]); // NEW: Data for Recherche simple 2
  const [recapData, setRecapData] = useState<ONTRecord[]>([]); // New Recap State
  const [archiveData, setArchiveData] = useState<ONTRecord[]>([]); // New Archive State
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<number | undefined>(undefined);
  const [lastImportDate, setLastImportDate] = useState<string | null>(null);
  const [lastImportDate2, setLastImportDate2] = useState<string | null>(null); // NEW: Import date for dashboard2
  const [modalConfig, setModalConfig] = useState<{ results: ONTRecord[], title: string } | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showReadme, setShowReadme] = useState(false);
  const [showLisezMoi, setShowLisezMoi] = useState(false);
  const [showRepeatedInfo, setShowRepeatedInfo] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ isOpen: boolean, title: string, message: string } | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [connectionLogs, setConnectionLogs] = useState<ConnectionLog[]>([]);
  const [showAdminPasswordDialog, setShowAdminPasswordDialog] = useState(false); // NEW: Admin Password Dialog State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false); // NEW: Admin Unlock State
  
  // Tech Stats State
  const [showTechStats, setShowTechStats] = useState(false);
  const [techStats, setTechStats] = useState({ total: 0, huawei: 0, nokia: 0, others: 0, found: 0, rack0: 0, rack1: 0 });

  // Sidebar state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarToggleTrigger, setSidebarToggleTrigger] = useState(0);

  // Animation key for StatsGrid
  const [statsKey, setStatsKey] = useState(0);
  
  // New State for Archiving Duplicates Count
  const [lastRepeatedCount, setLastRepeatedCount] = useState(0);
  const [repeatedRecords, setRepeatedRecords] = useState<ONTRecord[]>([]); // Store actual duplicates
  const [massiveRepeatedCount, setMassiveRepeatedCount] = useState(0); // Store count of duplicates found in massive search
  const [massiveRepeatedRecords, setMassiveRepeatedRecords] = useState<ONTRecord[]>([]); // Store actual duplicates from massive search

  const [filters, setFilters] = useState<FilterState>({
    sn: '',
    location: '', 
    msan: '',
    status: null,
    showRepeated: false,
    massiveSns: []
  });

  const [filters2, setFilters2] = useState<FilterState>({ // NEW: Filters for Recherche simple 2
    sn: '',
    location: '', 
    msan: '',
    status: null,
    showRepeated: false,
    massiveSns: []
  });

  // INITIALIZATION: Load session and saved data
  useEffect(() => {
    const savedUser = dbService.getCurrentUser();
    if (savedUser) setUser(savedUser);

    const loadData = async () => {
      const savedData = await dbService.getONTData();
      if (savedData.records.length > 0) {
        const hasDemoData = savedData.records.some(r => r.sn === 'ALCLB46C99A4');
        if (!hasDemoData) {
            const mergedData = [...DEMO_DATA, ...savedData.records];
            setData(mergedData);
        } else {
            setData(savedData.records);
        }

        if (savedData.lastUpdated) {
          setLastImportDate(savedData.lastUpdated);
        }
      } else {
          setData(DEMO_DATA);
          await dbService.saveONTData(DEMO_DATA);
      }
    };
    
    loadData();
  }, []);

  // NEW: Polling for block status
  const [isBlockedLive, setIsBlockedLive] = useState(false);
  useEffect(() => {
    if (!user) return;
    
    const checkStatus = async () => {
      try {
        const url = `${import.meta.env.VITE_API_URL || ''}/api/auth/status/${encodeURIComponent(user.username)}`;
        console.log("Checking status for:", user.username, "URL:", url);
        const res = await fetch(url);
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const data = await res.json();
          if (data.is_blocked) {
            setIsBlockedLive(true);
            setTimeout(() => {
              dbService.setCurrentUser(null);
              setUser(null);
              setIsBlockedLive(false);
            }, 5000);
          } else if (!data.is_approved && user.username !== 'admin' && user.role !== 'Super Admin' && user.role !== 'PROPRIÉTAIRE/PDG') {
            dbService.setCurrentUser(null);
            setUser(null);
          }
        }
      } catch (e) {
        console.error("Failed to check block status", e);
      }
    };

    // Check immediately
    checkStatus();

    // Then check every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Compute SN counts map for duplicate detection
  const snCounts = useMemo(() => {
    const counts = new Map<string, number>();
    data.forEach(r => {
        const s = r.sn?.trim().toUpperCase();
        if(s) counts.set(s, (counts.get(s) || 0) + 1);
    });
    return counts;
  }, [data]);

  const snCounts2 = useMemo(() => {
    const counts = new Map<string, number>();
    data2.forEach(r => {
        const s = r.sn?.trim().toUpperCase();
        if(s) counts.set(s, (counts.get(s) || 0) + 1);
    });
    return counts;
  }, [data2]);

  // Check if Nokia data has already been imported
  const hasNokiaData = useMemo(() => {
      return data.some(r => r.id.startsWith('nok-'));
  }, [data]);

  // Helper to determine Critical status based on new rules
  const checkCritical = useCallback((r: ONTRecord) => {
      // MATRIX MODE ADAPTATION:
      // If ID starts with 'gen-', it's a matrix record.
      // Matrix Record Mapping:
      // r.msan -> CMD NETO (Input)
      // r.sn -> NOM MSAN (Result)
      // r.version -> SN (Input)
      
      const isMatrix = r.id.startsWith('gen-');
      
      // Determine the REAL Serial Number for logic
      const realSn = isMatrix ? (r.version || '') : (r.sn || '');
      // Determine the REAL Version (Matrix has no version field usually, so default empty)
      const realVersion = isMatrix ? '' : (r.version || '');
      
      const snUpper = realSn.trim().toUpperCase();
      const versionUpper = realVersion.trim().toUpperCase();
      const vendorUpper = (r.vendorId || '').toUpperCase();
      const locUpper = (r.location || '').toUpperCase().replace(/\s/g, '');
      
      // Logic adaptation for Nokia/Huawei detection
      const isNokia = vendorUpper.includes('ALCL') || versionUpper.startsWith('ALCL') || snUpper.startsWith('ALCL');
      const isHuawei = vendorUpper.includes('HWTC') || vendorUpper.includes('HUAWEI') || snUpper.startsWith('4857') || snUpper.startsWith('HWT') || vendorUpper === 'HUAWEI';

      let rack = '0';
      let shelf = '0';

      const fsspMatch = locUpper.match(/FRAME:(\d+)\/SHELF:(\d+)/);
      const fspMatch = locUpper.match(/FRAME:(\d+)\/SLOT:(\d+)/); 

      if (fsspMatch) {
          rack = fsspMatch[1];
          shelf = fsspMatch[2];
      } else if (fspMatch) {
          rack = fspMatch[1];
          shelf = '0';
      } else {
          const parts = r.location.split('/').map(s => s.trim());
          if (parts.length >= 3 && parts.every(p => /^\d+$/.test(p))) {
              rack = parts[0];
              if (parts.length >= 4) {
                  shelf = parts[1];
              }
          }
      }

      if (rack === '1' && shelf === '0') {
          shelf = '1';
      }

      let effectiveStatus = r.status;
      if (effectiveStatus === 'isolated' && isNokia) {
          effectiveStatus = 'critical';
      }

      let isNewCriticalRule = false;
      if (snUpper.startsWith('HWT')) {
          isNewCriticalRule = true;
      } else if (snUpper.startsWith('414C') || versionUpper.startsWith('ALCL')) {
          if (rack === '0') {
              isNewCriticalRule = true;
          }
      }

      // Exception Logic: If Rack 1 and Status is 'active', do NOT treat as critical
      const isRack1Active = rack === '1' && effectiveStatus === 'active';

      const isHuaweiRack1 = isHuawei && rack === '1';
      
      // Blue Condition (Not applied if Huawei Rack 1, unless overruled?)
      const isBlueCondition = ((isHuawei && rack === '0') || (isNokia && rack === '1')) && !isHuaweiRack1;
      
      // Red Condition (Critical)
      const isRedCondition = ((isNokia && rack === '0') || (isHuaweiRack1 && !isRack1Active));

      // Force Critical to False if Rack 1 and Active
      if (isRack1Active) return false;

      // NEW: Simple Search Override (User Request: Location + Active + Nokia -> Not Critical)
      // Actually applies to any vendor if Location is present and Active in Simple Search
      const isSimpleMode = activeTab === 'dashboard' || activeTab === 'dashboard2';
      const hasValidLocation = r.location && r.location !== '---';
      
      if (isSimpleMode && hasValidLocation) {
          return false;
      }

      return (effectiveStatus === 'critical' || isNewCriticalRule || isRedCondition) && !isBlueCondition;
  }, [activeTab]);

  // Helper to generate massive data records
  const generateRecordsFromSns = useCallback((sns: string[], currentData: ONTRecord[]) => {
      if (!sns || sns.length === 0) return [];
      
      const records: ONTRecord[] = [];
      const snMap = new Map<string, ONTRecord>();
      
      currentData.forEach(r => {
           if (r.sn) snMap.set(r.sn.trim().toUpperCase(), r);
      });

      for (let i = 0; i < sns.length; i += 4) {
           if (sns[i]) {
                 const inputLine1 = sns[i] || ''; // CMD NETO (Input Line 1)
                 const inputLine3 = sns[i+2] || ''; 
                 const inputLine4 = sns[i+3] || ''; // SN (Input Line 4)

                 const searchKey = inputLine4.trim().toUpperCase();
                 let foundRecord = snMap.get(searchKey);

                 if (!foundRecord && searchKey.startsWith('ALCL')) {
                     const hexKey = '414C434C' + searchKey.substring(4);
                     foundRecord = snMap.get(hexKey);
                 }
                 
                 const resultNomMsan = foundRecord ? foundRecord.msan : (inputLine3 || 'NON TROUVÉ');
                 const resultLocation = foundRecord ? foundRecord.location : '---';
                 
                 let vendorId = foundRecord ? foundRecord.vendorId : '';
                 if (inputLine4.trim().toUpperCase().startsWith('ALCL')) {
                     vendorId = 'ALCL';
                 }

                 let status: ONTStatus = 'isolated'; 

                 if (foundRecord) {
                    status = foundRecord.status;
                    let rack = '0';
                    if (resultLocation && resultLocation !== '---' && resultLocation !== '--/--/--') {
                        const locUpper = resultLocation.toUpperCase().replace(/\s/g, '');
                        const fsspMatch = locUpper.match(/FRAME:(\d+)\/SHELF:(\d+)/);
                        const fspMatch = locUpper.match(/FRAME:(\d+)\/SLOT:(\d+)/);
                        if (fsspMatch) rack = fsspMatch[1];
                        else if (fspMatch) rack = fspMatch[1];
                        else {
                            const parts = resultLocation.split('/').map(s => s.trim());
                            if (parts.length >= 3 && parts.every(p => /^\d+$/.test(p))) rack = parts[0];
                        }

                        const v = vendorId.toUpperCase();
                        const isSupported = v.includes('HWTC') || v.includes('HUAWEI') || v.includes('ALCL') || searchKey.startsWith('4857') || searchKey.startsWith('ALCL');

                        if (isSupported) {
                            if (rack === '1') status = 'active';
                            else if (status !== 'critical') status = 'active';
                        }
                    }
                 } else {
                    status = 'isolated';
                 }

                 records.push({
                     id: `gen-${i}-${Date.now()}`,
                     msan: inputLine1,               
                     location: resultLocation,       
                     sn: resultNomMsan,              
                     version: inputLine4,            
                     vendorId: vendorId,
                     status: status
                 });
           }
      }
      return records;
  }, []);

  // 1. GENERATE MASSIVE DATA (Unfiltered)
  const generatedMassiveData = useMemo(() => {
      return generateRecordsFromSns(filters.massiveSns, data);
  }, [filters.massiveSns, data, generateRecordsFromSns]);

  // Intersection logic for ONT RÉPÉTÉS (Duplicates between Recherche simple and Inventaire FTTH)
  const intersectionSns = useMemo(() => {
    if (data.length === 0 || data2.length === 0) return new Set<string>();
    const snSet2 = new Set(data2.map(r => r.sn?.trim().toUpperCase()).filter(Boolean));
    const result = new Set<string>();
    data.forEach(item => {
      const s = item.sn?.trim().toUpperCase();
      if (s && snSet2.has(s)) {
        const vendorUpper = (item.vendorId || '').toUpperCase();
        const snUpper = s;
        const versionUpper = (item.version || '').toUpperCase();
        const isNokia = vendorUpper.includes('ALCL') || versionUpper.startsWith('ALCL') || snUpper.startsWith('ALCL') || snUpper.startsWith('414C');
        const isHuawei = vendorUpper.includes('HWTC') || vendorUpper.includes('HUAWEI') || snUpper.startsWith('4857') || snUpper.startsWith('HWT') || vendorUpper === 'HUAWEI';
        if (isNokia || isHuawei) result.add(s);
      }
    });
    return result;
  }, [data, data2]);

  const intersectionCount = useMemo(() => {
    let count = 0;
    data.forEach(item => {
      const s = item.sn?.trim().toUpperCase();
      if (s && intersectionSns.has(s)) count++;
    });
    return count;
  }, [data, intersectionSns]);

  const filteredData = useMemo(() => {
    const matchStatus = (item: ONTRecord) => {
        if (!filters.status) return true;
        
        let isCrit = checkCritical(item);
        let isSpecialIsolated = false;

        const isMatrixMode = activeTab === 'matrix' || activeTab === 'workflow';
        if (isMatrixMode) {
             const isCmdNetoPresent = item.msan && item.msan !== '---';
             const isEmplacementMissing = !item.location || item.location === '---';
             
             // If it matches the special rule (Yellow Row), treat as ISOLATED, NOT CRITICAL
             if (isCrit && isCmdNetoPresent && isEmplacementMissing) {
                 isSpecialIsolated = true;
                 isCrit = false; 
             }
        }

        if (filters.status === 'critical') return isCrit;
        if (isCrit) return false;
        
        if (filters.status === 'isolated') {
            return isSpecialIsolated || item.status === 'isolated';
        }
        
        return item.status === filters.status;
    };

    const matchRepeated = (item: ONTRecord) => {
        if (!filters.showRepeated && activeTab !== 'duplicates') return true;
        const s = item.sn?.trim().toUpperCase();
        return s ? intersectionSns.has(s) : false;
    };

    if (activeTab === 'archive') {
        return archiveData;
    }

    if (activeTab === 'dashboard2') {
        return data2.filter(item => {
          const cleanSnFilter = filters2.sn.trim().toLowerCase();
          
          let matchSN = true;
          if (cleanSnFilter) {
              matchSN = item.sn.toLowerCase().includes(cleanSnFilter);
          }

          const cleanMsanTextFilter = filters2.location.trim().toLowerCase();
          const matchMsanText = !cleanMsanTextFilter || item.msan.toLowerCase().includes(cleanMsanTextFilter);
          const matchMsanStrict = filters2.msan ? item.msan === filters2.msan : true;

          // Status Match Logic for Dashboard 2
          const matchStatus2 = (item: ONTRecord) => {
                if (!filters2.status) return true;
                let isCrit = checkCritical(item);
                if (filters2.status === 'critical') return isCrit;
                if (isCrit) return false;
                if (filters2.status === 'isolated') return item.status === 'isolated';
                return item.status === filters2.status;
          };

          return matchSN && matchMsanText && matchMsanStrict && matchStatus2(item);
        });
    }

    if (activeTab === 'duplicates') {
        return data.filter(item => {
             const s = item.sn?.trim().toUpperCase();
             return s && intersectionSns.has(s);
        });
    }

    // SPECIAL CASE: If main data is empty (after reset), show duplicates found against archive if showRepeated is on
    if (data.length === 0 && filters.showRepeated) {
        return repeatedRecords;
    }

    if (activeTab === 'matrix' || activeTab === 'workflow') {
        // Handle showing stored duplicates if data is empty (Reset context in Matrix/Workflow)
        if (data.length === 0 && filters.showRepeated && repeatedRecords.length > 0) {
            return repeatedRecords;
        }

        const cleanSnFilter = filters.sn.trim().toLowerCase();
        const cleanMsanTextFilter = filters.location.trim().toLowerCase();

        return generatedMassiveData.filter(item => {
             // In Matrix Mode, 'NOM MSAN' corresponds to `item.sn` (resultNomMsan).
             // 'SN' corresponds to `item.version`.
             
             let matchSN = true;
             if (cleanSnFilter) {
                 matchSN = item.version.toLowerCase().includes(cleanSnFilter);
             }

             const matchMsanText = !cleanMsanTextFilter || item.sn.toLowerCase().includes(cleanMsanTextFilter);
             const matchMsanStrict = filters.msan ? item.sn === filters.msan : true;

             return matchSN && matchMsanText && matchMsanStrict && matchStatus(item);
        });
    }

    return data.filter(item => {
      const cleanSnFilter = filters.sn.trim().toLowerCase();
      
      let matchSN = true;
      if (cleanSnFilter) {
          matchSN = item.sn.toLowerCase().includes(cleanSnFilter);
      }

      const cleanMsanTextFilter = filters.location.trim().toLowerCase();
      const matchMsanText = !cleanMsanTextFilter || item.msan.toLowerCase().includes(cleanMsanTextFilter);
      const matchMsanStrict = filters.msan ? item.msan === filters.msan : true;

      return matchSN && matchMsanText && matchMsanStrict && matchStatus(item) && matchRepeated(item);
    });
  }, [data, data2, filters, filters2, activeTab, snCounts, checkCritical, generatedMassiveData, archiveData, repeatedRecords]);

  const stats: KPIStats = useMemo(() => {
    const isMatrixMode = activeTab === 'matrix' || activeTab === 'workflow';

    if (isMatrixMode) {
        let activeCount = 0;
        let isolatedCount = 0;
        let criticalCount = 0;
        let workflowIsolatedCount = 0; // NEW: Count for special yellow rows
        
        filteredData.forEach(r => {
             const isCrit = checkCritical(r);
             
             // Workflow Special Rule Check
             const isCmdNetoPresent = r.msan && r.msan !== '---';
             const isEmplacementMissing = !r.location || r.location === '---';
             
             if ((isCrit || r.status === 'isolated') && isCmdNetoPresent && isEmplacementMissing) {
                 workflowIsolatedCount++;
                 isolatedCount++; 
             } else if (isCrit) {
                 criticalCount++;
             } else {
                 let effectiveStatus = r.status;
                 if (effectiveStatus === 'active') activeCount++;
                 else if (effectiveStatus === 'isolated') isolatedCount++;
             }
        });

        return {
            searched: activeCount, 
            total: filteredData.length,
            isolated: isolatedCount, 
            critical: criticalCount,
            repeated: intersectionCount 
        };
    }

    const hasActiveFilters = 
        (activeTab === 'dashboard2' ? filters2 : filters).sn.trim() !== '' || 
        (activeTab === 'dashboard2' ? filters2 : filters).location.trim() !== '' || 
        (activeTab === 'dashboard2' ? filters2 : filters).msan !== '' || 
        (activeTab === 'dashboard2' ? filters2 : filters).status !== null || 
        (activeTab === 'dashboard2' ? filters2 : filters).showRepeated;

    // Determine which dataset to use for global counts
    let baseDataForStats = data;
    if (activeTab === 'dashboard2') baseDataForStats = data2;
    if (activeTab === 'archive') baseDataForStats = archiveData;
    if (activeTab === 'recap') baseDataForStats = recapData;
    if (activeTab === 'duplicates') baseDataForStats = filteredData;

    let globalIsolated = 0;
    let globalCritical = 0;
    let globalRepeated = 0;
    let huaweiCount = 0;
    let nokiaCount = 0;

    baseDataForStats.forEach(r => {
        if (checkCritical(r)) {
            globalCritical++;
        } else {
            if (r.status === 'isolated') globalIsolated++;
        }
        const s = (r.id.startsWith('gen-') ? r.version : r.sn)?.trim().toUpperCase();
        if (activeTab !== 'archive' && activeTab !== 'recap') {
            const currentSnCounts = activeTab === 'dashboard2' ? snCounts2 : snCounts;
            if ((currentSnCounts.get(s) || 0) > 1) {
                globalRepeated++;
            }
        }
        
        let isNokia = false;
        let isHuawei = false;
        
        if (r.id.startsWith('nok-')) {
            isNokia = true;
        } else if (r.id.startsWith('row-')) {
            isHuawei = true;
        } else {
            const vendorUpper = (r.vendorId || '').toUpperCase();
            const versionUpper = (r.version || '').toUpperCase();
            const snUpper = (r.sn || '').toUpperCase();
            isNokia = vendorUpper.includes('ALCL') || versionUpper.startsWith('ALCL') || snUpper.startsWith('ALCL') || snUpper.startsWith('414C');
            isHuawei = vendorUpper.includes('HWTC') || vendorUpper.includes('HUAWEI') || snUpper.startsWith('4857') || snUpper.startsWith('HWT') || vendorUpper === 'HUAWEI';
        }
        
        if (isNokia) nokiaCount++;
        if (isHuawei) huaweiCount++;
    });

    return {
      searched: activeTab === 'recap' 
        ? recapData.filter(item => item.status === 'active' && (!filters.msan || item.msan === filters.msan)).length 
        : (activeTab === 'archive' || activeTab === 'duplicates' ? filteredData.length : (hasActiveFilters ? filteredData.length : 0)),
      total: baseDataForStats.length,
      isolated: globalIsolated,
      critical: activeTab === 'recap' ? 0 : globalCritical,
      repeated: activeTab === 'duplicates' 
        ? filteredData.length 
        : intersectionCount,
      huaweiCount,
      nokiaCount
    };
  }, [data, data2, filteredData, filters, filters2, activeTab, snCounts, snCounts2, checkCritical, generatedMassiveData, lastRepeatedCount, massiveRepeatedCount, recapData, archiveData, repeatedRecords, massiveRepeatedRecords, intersectionSns, intersectionCount]);

  const activeRecapData = useMemo(() => {
    const cleanSnFilter = filters.sn.trim().toLowerCase();
    const cleanMsanTextFilter = filters.location.trim().toLowerCase();

    return recapData.filter(item => {
        if (item.status !== 'active') return false;
        
        // Apply SN Search
        let matchSN = true;
        if (cleanSnFilter) {
            // In recap mode (massive data), SN is in .version
            matchSN = (item.version || '').toLowerCase().includes(cleanSnFilter);
        }

        // Apply MSAN Text Search (NOM MSAN)
        // In recap mode, NOM MSAN is in .sn
        const matchMsanText = !cleanMsanTextFilter || (item.sn || '').toLowerCase().includes(cleanMsanTextFilter);

        // Apply MSAN Strict Search (Combo Box)
        const matchMsanStrict = filters.msan ? item.msan === filters.msan : true;

        return matchSN && matchMsanText && matchMsanStrict;
    });
  }, [recapData, filters.sn, filters.location, filters.msan]);

  const msanOptions = useMemo(() => {
    if (activeTab === 'recap') {
        const unique = new Set(recapData.filter(d => d.status === 'active').map(d => d.msan));
        return Array.from(unique).filter(s => s && s !== '---').sort();
    }
    if (activeTab === 'matrix' || activeTab === 'workflow') {
        // Return unique "NOM MSAN" (mapped to .sn in matrix records)
        const unique = new Set(generatedMassiveData.map(d => d.sn));
        // Filter out placeholders if desired, but user might want to see 'NON TROUVÉ' groups
        return Array.from(unique).filter(s => s && s !== 'NON TROUVÉ').sort();
    }
    const targetData = activeTab === 'dashboard2' ? data2 : data;
    const uniqueMsans = new Set(targetData.map(d => d.msan));
    return Array.from(uniqueMsans).sort();
  }, [data, data2, activeTab, generatedMassiveData, recapData]);

  const handleImport = useCallback(async (file: File, type: 'standard' | 'nokia' = 'standard') => {
    setIsLoading(true);
    setLastRepeatedCount(0); // Reset archive stats
    setRepeatedRecords([]);  // Reset repeated records for new import
    try {
      await new Promise(r => setTimeout(r, 800)); 
      
      let records: ONTRecord[] = [];
      let saveTime = '';

      if (type === 'nokia') {
          if (file.type.startsWith('image/')) {
              records = await extractNokiaDataFromImage(file);
              saveTime = new Date().toLocaleString();
          } else {
              const result = await parseNokiaFile(file, setImportProgress);
              records = result.records;
              saveTime = result.saveTime;
          }
      } else {
          const result = await parseExcelFile(file, setImportProgress);
          records = result.records;
          saveTime = result.saveTime;
      }
      
      setImportProgress(100);
      
      // NEW: If importing Huawei in "Recherche simple", check against "Inventaire FTTH" (data2)
      if (type === 'standard' && activeTab === 'search') {
          const importedSNs = new Set(records.map(r => r.sn?.trim().toUpperCase()).filter(Boolean));
          const matchedRecords = data2.filter(d => {
              const s = d.sn?.trim().toUpperCase();
              return s && importedSNs.has(s);
          });
          
          if (matchedRecords.length > 0) {
              setRepeatedRecords(matchedRecords);
              setTimeout(() => alert(`${matchedRecords.length} ONTs trouvés dans l'Inventaire FTTH. Voir l'onglet 'ONT RÉPÉTÉS'.`), 100);
          }
      }
      
      let finalMergedRecords: ONTRecord[] = [];
      const isDashboard2 = activeTab === 'dashboard2';
      const setTargetData = isDashboard2 ? setData2 : setData;
      let finalDate = isDashboard2 ? lastImportDate2 : lastImportDate;

      setTargetData(prevData => {
          const realPrevData = prevData.filter(d => !d.id.startsWith('demo-'));
          let mergedRecords: ONTRecord[] = [];

          if (type === 'nokia') {
              mergedRecords = [...realPrevData, ...records];
          } 
          else {
              let shouldMerge = false;
              if (realPrevData.length > 0 && realPrevData.length < 50000) { 
                  const confirmMerge = window.confirm(
                      "Des données existent déjà. Voulez-vous FUSIONNER avec l'existant pour détecter les ONTs RÉPÉTÉS (Doublons) ?\n\nOK = Fusionner (Détecter doublons)\nAnnuler = Remplacer (Nouvelle liste)"
                  );
                  shouldMerge = confirmMerge;
              }

              if (shouldMerge) {
                  mergedRecords = [...realPrevData, ...records];
                  const existingSNs = new Set(realPrevData.map(d => d.sn?.trim().toUpperCase()));
                  const duplicates = records.filter(r => existingSNs.has(r.sn?.trim().toUpperCase())).length;
                  if (duplicates > 0) {
                      setTimeout(() => alert(`${duplicates} SN existants trouvés. Voir le compteur 'ONT RÉPÉTÉ'.`), 100);
                  }
              } else {
                  mergedRecords = [...records];
              }
          }

          if (type === 'standard' || type === 'nokia') {
              finalDate = saveTime || new Date().toLocaleString();
              if (isDashboard2) {
                  setLastImportDate2(finalDate);
              } else {
                  setLastImportDate(finalDate);
              }
          }

          finalMergedRecords = mergedRecords;
          return mergedRecords;
      });
      
      if (!isDashboard2) {
          await dbService.saveONTData(finalMergedRecords);
      }
      
      /* 
      if (type === 'nokia') {
          exportToExcel(records, 'ONT_NOKIA_Converti.xlsx', false);
      }
      */
      
      if (isDashboard2) {
          setFilters2({ sn: '', location: '', msan: '', status: null, showRepeated: false, massiveSns: [] });
      } else {
          setFilters({ sn: '', location: '', msan: '', status: null, showRepeated: false, massiveSns: [] });
      }
      setIsLoading(false);
      setTimeout(() => setImportProgress(undefined), 300); // Wait for fade out
      soundService.playSuccess();
    } catch (error) {
      console.error("Failed to import", error);
      setIsLoading(false);
      setTimeout(() => setImportProgress(undefined), 300);
      soundService.playError();
      if (error === "INVALID_FORMAT_HUAWEI" || error === "INVALID_FORMAT_NOKIA") {
          setErrorDialog({
              isOpen: true,
              title: "Importation Impossible",
              message: "Les données que vous venez d'importer sont incorrecte , merci de vérifier"
          });
      } else {
          alert("Erreur lors de l'importation. Vérifiez le format du fichier.");
      }
    }
  }, [lastImportDate, lastImportDate2, activeTab, data2]);

  const handleExport = useCallback(() => {
    const dataToExport = activeTab === 'recap' ? activeRecapData : (activeTab === 'archive' ? archiveData : filteredData);
    if (dataToExport.length === 0) return;
    soundService.playClick();
    const fileName = `ONT_Finder_Export_${new Date().toISOString().slice(0,10)}.xlsx`;
    exportToExcel(dataToExport, fileName, activeTab === 'matrix' || activeTab === 'workflow' || activeTab === 'recap' || activeTab === 'archive');
    soundService.playSuccess();
  }, [filteredData, activeRecapData, archiveData, activeTab]);

  const handleArchiveExport = useCallback((type: 'nokia' | 'huawei') => {
    if (archiveData.length === 0) return;
    soundService.playClick();
    const isNokia = type === 'nokia';
    const dataToExport = archiveData.filter(r => {
        const isALCL = r.vendorId.toUpperCase().includes('ALCL') || r.version.toUpperCase().startsWith('ALCL');
        return isNokia ? isALCL : !isALCL;
    });
    
    if (dataToExport.length === 0) {
        alert(`Aucune donnée ${type.toUpperCase()} à exporter.`);
        return;
    }
    
    const fileName = `Archive_${type.toUpperCase()}_${new Date().toISOString().slice(0,10)}.xlsx`;
    exportToExcel(dataToExport, fileName, true);
    soundService.playSuccess();
  }, [archiveData]);

  const handleResetFilters = useCallback(() => {
    setFilters(prev => {
        if (activeTab === 'matrix' || activeTab === 'workflow') {
             return { ...prev, sn: '', location: '', msan: '', status: null, showRepeated: false };
        }
        return { sn: '', location: '', msan: '', status: null, showRepeated: false, massiveSns: [] };
    });
    soundService.playClick();
  }, [activeTab]);

  const handleFullReset = useCallback(() => {
      // User Request: sur onglet 'Recherche simple' (dashboard) si je click sur bouton 'VIDER' vider la table data.
      if (activeTab === 'dashboard' || activeTab === 'search') {
          setData([]);
          setFilters({ sn: '', location: '', msan: '', status: null, showRepeated: false, massiveSns: [] });
          setRepeatedRecords([]); // Also clear repeated records found for this data
          setLastImportDate(null);
          dbService.clearAllData();
          setStatsKey(prev => prev + 1); // Initialize stats grid labels (animation)
          soundService.playClick();
          return;
      }

      if (activeTab === 'dashboard2') {
          setData2([]);
          setFilters2({ sn: '', location: '', msan: '', status: null, showRepeated: false, massiveSns: [] });
          setLastImportDate2(null);
          soundService.playClick();
          return;
      }

      if (activeTab === 'recap') {
          setRecapData([]);
          soundService.playClick();
          return;
      }

      let recordsToArchive: ONTRecord[] = [];
      
      // Determine which dataset to archive
      if (generatedMassiveData && generatedMassiveData.length > 0) {
          recordsToArchive = generatedMassiveData;
      } else if (data.length > 0) {
          recordsToArchive = data;
      }
  
      if (recordsToArchive.length > 0) {
          const getSn = (r: ONTRecord) => r.id.startsWith('gen-') ? (r.version || '') : (r.sn || '');

          // 1. Identify Internal Duplicates
          const internalSnCounts = new Map<string, number>();
          recordsToArchive.forEach(r => {
              const sn = getSn(r).trim().toUpperCase();
              if (sn) internalSnCounts.set(sn, (internalSnCounts.get(sn) || 0) + 1);
          });

          // 2. Identify Duplicates vs Archive
          const archiveSnSet = new Set(archiveData.map(r => getSn(r).trim().toUpperCase()));
          
          const allDuplicatesToSave: ONTRecord[] = [];
          
          recordsToArchive.forEach(r => {
               const sn = getSn(r).trim().toUpperCase();
               const isInternalDup = (internalSnCounts.get(sn) || 0) > 1;
               const isArchiveDup = sn && archiveSnSet.has(sn);

               if (isInternalDup || isArchiveDup) {
                   allDuplicatesToSave.push(r);
               }
          });
          
          if (allDuplicatesToSave.length > 0) {
              setRepeatedRecords(prev => [...prev, ...allDuplicatesToSave]);
              setLastRepeatedCount(prev => prev + allDuplicatesToSave.length); 
          }
  
          // 3. Archive (preventing MSAN duplicates in Archive)
          setArchiveData(prev => {
              const existingMsans = new Set(prev.map(r => r.msan.trim().toUpperCase()));
              const uniqueNew = recordsToArchive.filter(r => !existingMsans.has(r.msan.trim().toUpperCase()));
              return [...prev, ...uniqueNew];
          });
      } 

      setFilters({ sn: '', location: '', msan: '', status: null, showRepeated: false, massiveSns: [] });
      setData([]);
      setRecapData([]); // Added back as per user request
      setLastImportDate(null);
      dbService.clearAllData();
      soundService.playClick();
  }, [data, generatedMassiveData, archiveData]);

  const handleClearArchive = useCallback(() => {
    setArchiveData([]);
    setLastRepeatedCount(0);
    setMassiveRepeatedCount(0);
    setMassiveRepeatedRecords([]);
    soundService.playSuccess();
  }, []);

  const handleClearDuplicates = useCallback(() => {
      setMassiveRepeatedRecords([]);
      setMassiveRepeatedCount(0);
      setRepeatedRecords([]);
      setLastRepeatedCount(0);
      soundService.playClick();
  }, []);

  const handleMassiveSearch = useCallback((sns: string[]) => {
      setFilters(prev => ({ ...prev, massiveSns: sns }));
      
      // Generate records from SNs
      const allNewRecords = generateRecordsFromSns(sns, data);
      
      // LOGIC TO FILTER DUPLICATES AND COUNT THEM
      const existingSns = new Set(recapData.map(r => (r.id.startsWith('gen-') ? r.version : r.sn)?.trim().toUpperCase()));
      
      const uniqueNewRecords: ONTRecord[] = [];
      const currentSearchDuplicates: ONTRecord[] = [];
      let internalDupCount = 0;
      const seenInCurrentSearch = new Set<string>();

      allNewRecords.forEach(r => {
          const snVal = (r.id.startsWith('gen-') ? r.version : r.sn)?.trim().toUpperCase();
          if (!snVal) {
              uniqueNewRecords.push(r);
              return;
          }

          if (existingSns.has(snVal) || seenInCurrentSearch.has(snVal)) {
              internalDupCount++;
              currentSearchDuplicates.push(r);
          } else {
              uniqueNewRecords.push(r);
              seenInCurrentSearch.add(snVal);
          }
      });

      // Copy unique records to Recap Data (Append mode)
      setRecapData(prev => [...prev, ...uniqueNewRecords]);

      // LOGIC TO COUNT DUPLICATES VS ARCHIVE (Existing logic)
      let archiveDupCount = 0;
      const archiveDuplicates: ONTRecord[] = [];
      if (archiveData.length > 0) {
          const archiveSet = new Set<string>();
          archiveData.forEach(r => {
              const snVal = r.id.startsWith('gen-') ? r.version : r.sn;
              if (snVal) archiveSet.add(snVal.trim().toUpperCase());
          });

          // Check input SNs (every 4th item in sns array: 3, 7, 11...)
          for (let i = 0; i < allNewRecords.length; i++) {
              const r = allNewRecords[i];
              const snVal = (r.id.startsWith('gen-') ? r.version : r.sn)?.trim().toUpperCase();
              if (snVal && archiveSet.has(snVal)) {
                  archiveDupCount++;
                  archiveDuplicates.push(r);
              }
          }
      }
      
      // Total repeated count for this search session
      setMassiveRepeatedCount(internalDupCount + archiveDupCount);
      setMassiveRepeatedRecords([...currentSearchDuplicates, ...archiveDuplicates]);

      // Switch to workflow tab to show results
      setActiveTab('workflow');
  }, [archiveData, data, generateRecordsFromSns, recapData]);

  const handleMassiveReset = useCallback(() => {
      setFilters(prev => ({ ...prev, massiveSns: [] }));
      setMassiveRepeatedCount(0); // Reset count
  }, []);

  const handleArchiveClearConfirm = useCallback(() => {
      setArchiveData([]);
      soundService.playSuccess();
  }, []);

  // NEW: Handle calculation and display of Tech Stats
  const handleShowTechStats = useCallback(() => {
      if (filteredData.length === 0) return;
      
      let huaweiCount = 0;
      let nokiaCount = 0;
      let otherCount = 0;
      let foundCount = 0;
      let rack0Count = 0;
      let rack1Count = 0;

      filteredData.forEach(r => {
          const vendorUpper = (r.vendorId || '').toUpperCase();
          // Simplified Vendor Logic for Stats
          const isHuawei = vendorUpper.includes('HWTC') || vendorUpper.includes('HUAWEI') || (r.version || '').toUpperCase().startsWith('4857');
          const isNokia = vendorUpper.includes('ALCL') || (r.version || '').toUpperCase().startsWith('ALCL');

          if (isHuawei) huaweiCount++;
          else if (isNokia) nokiaCount++;
          else otherCount++;

          // Check if "found" in Simple Search DB
          // In Matrix mode, 'location' is populated from DB if found, otherwise it's '---' or '--/--/--'
          if (r.location && r.location !== '---' && r.location !== '--/--/--') {
              foundCount++;

              // Parse Rack Information for special stats
              let rack = '';
              const locUpper = r.location.toUpperCase().replace(/\s/g, '');
              const fsspMatch = locUpper.match(/FRAME:(\d+)\/SHELF:(\d+)/);
              const fspMatch = locUpper.match(/FRAME:(\d+)\/SLOT:(\d+)/); 

              if (fsspMatch) {
                  rack = fsspMatch[1];
              } else if (fspMatch) {
                  rack = fspMatch[1];
              } else {
                  const parts = r.location.split('/').map(s => s.trim());
                  if (parts.length >= 3 && parts.every(p => /^\d+$/.test(p))) {
                      rack = parts[0];
                  }
              }

              if (rack === '0') rack0Count++;
              if (rack === '1') rack1Count++;
          }
      });

      setTechStats({
          total: filteredData.length,
          huawei: huaweiCount,
          nokia: nokiaCount,
          others: otherCount,
          found: foundCount,
          rack0: rack0Count,
          rack1: rack1Count
      });
      setShowTechStats(true);
  }, [filteredData]);

  const handleLogin = useCallback((loggedInUser: User) => {
      setUser(loggedInUser);
      dbService.setCurrentUser(loggedInUser);
      setData([]);
      setRecapData([]); // Clear recap on login
      setFilters({ sn: '', location: '', msan: '', status: null, showRepeated: false, massiveSns: [] });
      setLastImportDate(null);
      dbService.clearAllData();
      setActiveTab('dashboard');
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    dbService.setCurrentUser(null);
    soundService.playClick();
  }, []);

  const handleShowLogsDialog = async () => {
    setIsLoading(true);
    try {
      const logs = await dbService.getLogs();
      setConnectionLogs(logs);
      setShowLogsDialog(true);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatClick = useCallback((status: ONTStatus | 'total' | 'searched' | 'repeated') => {
    soundService.playClick();
    if (status === 'searched') {
        if (activeTab === 'matrix' || activeTab === 'workflow') {
             setFilters(prev => ({ ...prev, status: prev.status === 'active' ? null : 'active' }));
        } else {
             setModalConfig({ results: filteredData, title: filters.sn || 'Résultats actuels' });
        }
    } else if (status === 'total') {
        setFilters(prev => ({ ...prev, status: null, showRepeated: false }));
        if (activeTab === 'duplicates') setActiveTab('dashboard');
    } else if (status === 'repeated') {
        if (stats.repeated > 0) {
             setActiveTab('duplicates');
        }
    } else {
        setFilters(prev => ({ ...prev, status: prev.status === status ? null : status, showRepeated: false }));
        if (activeTab === 'duplicates') setActiveTab('dashboard');
    }
  }, [filteredData, filters.sn, activeTab, stats]);

  const handleRowClick = useCallback((row: ONTRecord) => {
    setModalConfig({ results: [row], title: row.sn });
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    // Admin Tab Protection - Always ask for password on click
    if (tab === 'admin') {
        setShowAdminPasswordDialog(true);
        return;
    }

    // Lock admin if navigating away
    if (activeTab === 'admin' && tab !== 'admin') {
        setIsAdminUnlocked(false);
    }

    setActiveTab(tab);
    // Modified: Don't reset massiveSns when switching tabs.
    // Preserves 'FILE DE TRAVAIL' data even if user navigates to other menus (Dashboard, Search, etc.)
    setFilters(prev => ({ 
        ...prev, 
        sn: '', 
        msan: '', 
        location: '', 
        status: null, 
        showRepeated: false,
        massiveSns: prev.massiveSns // Keep massive data persisted
    }));
    
    if (tab === 'dashboard') {
        setStatsKey(prev => prev + 1);
    }
    if (tab === 'alerts') {
        setFilters(prev => ({ ...prev, status: 'critical' }));
    } 
  }, [isAdminUnlocked]);

  const handleAdminUnlock = () => {
      setIsAdminUnlocked(true);
      setShowAdminPasswordDialog(false);
      setActiveTab('admin');
      soundService.playSuccess();
  };

  const handleLogoClick = useCallback(() => {
    soundService.playHover();
    setSidebarToggleTrigger(prev => prev + 1);
  }, []);

  const getSectionTitle = () => {
    switch (activeTab) {
      case 'matrix': return 'TABLEAU DE BORD';
      case 'search': return 'TABLEAU DE BORD';
      case 'multiple': return 'RECHERCHE AVANCÉE'; // New title for Multiple Search
      case 'workflow': return 'ESPACE DE TRAVAIL';
      case 'recap': return 'RÉCAPITULATIF';
      case 'archive': return 'ARCHIVE';
      case 'alerts': return 'TABLEAU DE BORD';
      case 'duplicates': return 'ONT RÉPÉTÉS';
      case 'settings': return 'PARAMÉTRAGE SYSTÈME';
      case 'admin': return 'ADMINISTRATION';
      case 'dashboard':
      default: return 'TABLEAU DE BORD';
    }
  };

  const getBadgeLabel = () => {
    switch (activeTab) {
      case 'dashboard': return 'RECHERCHE SIMPLE';
      case 'matrix': return "File d'insertion";
      case 'search': return 'RECHERCHE AVANCÉE';
      case 'multiple': return 'RECHERCHE MULTIPLE'; // New Badge
      case 'workflow': return 'FILE DE TRAVAIL';
      case 'recap': return 'FILE RECAP';
      case 'archive1': return 'ARCHIVE';
      case 'queue': return "FILE D'ATTENTE"; 
      case 'archive': return 'ARCHIVES';
      case 'alerts': return "CENTRE D'ALERTES";
      case 'duplicates': return 'ONT RÉPÉTÉS';
      case 'settings': return "PARAMÉTRAGE";
      default: return 'STATUT OPÉRATIONNEL';
    }
  };

  const getBadgeIcon = () => {
     switch (activeTab) {
        case 'dashboard': return <LayoutGrid className="w-3.5 h-3.5 text-cyan-400 animate-scale-pulse" />;
        case 'matrix': return <Database className="w-3.5 h-3.5 text-cyan-400 animate-scale-pulse" />;
        case 'search': return <ListFilter className="w-3.5 h-3.5 text-cyan-400 animate-scale-pulse" />;
        case 'multiple': return <ListFilter className="w-3.5 h-3.5 text-cyan-400 animate-scale-pulse" />; // Reusing ListFilter for now
        case 'workflow': return <ClipboardList className="w-3.5 h-3.5 text-cyan-400 animate-scale-pulse" />;
        case 'recap': return <Repeat className="w-3.5 h-3.5 text-cyan-400 animate-scale-pulse" />;
        case 'queue': return <Hourglass className="w-3.5 h-3.5 text-cyan-400 animate-scale-pulse" />; 
        case 'archive': return <Archive className="w-3.5 h-3.5 text-cyan-400 animate-scale-pulse" />;
        case 'alerts': return <AlertTriangle className="w-3.5 h-3.5 text-cyan-400 animate-scale-pulse" />;
        case 'duplicates': return <Copy className="w-3.5 h-3.5 text-cyan-400 animate-scale-pulse" />;
        case 'settings': return <Settings className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />;
        default: return <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 animate-pulse-soft" />;
     }
  };

  if (!user) {
      return (
          <div className="h-screen bg-transparent font-sans text-slate-200">
             <LoginForm onLogin={handleLogin} />
          </div>
      );
  }

  const renderMainContent = () => {
    if (activeTab === 'settings') {
        return <SettingsPanel theme={theme} setTheme={setTheme} />;
    }

    if (activeTab === 'admin') {
        if (user?.role !== 'Super Admin' && user?.role !== 'PROPRIÉTAIRE/PDG') {
             return (
                <div className="flex-grow flex flex-col items-center justify-center animate-fade-in-up">
                    <div className="p-6 rounded-full bg-rose-900/20 border border-rose-500/20 mb-4 shadow-xl">
                        <ShieldAlert className="w-12 h-12 text-rose-500" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Accès Refusé</h3>
                    <p className="text-xs text-slate-500 font-mono">Vous n'avez pas les droits nécessaires pour accéder à cette section.</p>
                </div>
             );
        }
        return <AdminPanel currentUser={user} />;
    }

    if (activeTab === 'recap') {
        return (
            <div className="flex-grow flex flex-col h-full animate-fade-in-up">
                {recapData.length > 0 ? (
                    <>
                        <div className="flex items-center justify-between px-6 py-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                Données Récapitulatives (Actifs)
                                <DigitalDisplay value={activeRecapData.length} color="blue" size="sm" />
                            </span>
                            <button 
                                onClick={() => { 
                                    soundService.playClick(); 
                                    if (window.confirm('Êtes-vous certain de vouloir supprimer les données enregistrées dans la file RECAP ?')) {
                                        setRecapData([]); 
                                        soundService.playSuccess(); 
                                    }
                                }}
                                className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest border border-red-500/20 bg-red-500/5 px-3 py-1.5 rounded-lg transition-all"
                            >
                                Vider la file RECAP
                            </button>
                        </div>
                        <DataTable 
                            data={activeRecapData} 
                            searchTerm={filters.sn || "MASSIVE"} 
                            onRowClick={handleRowClick}
                            lastImportDate={lastImportDate}
                            activeTab={activeTab}
                        />
                    </>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center opacity-70 select-none">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full"></div>
                            <Repeat className="w-24 h-24 text-slate-600 relative z-10 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-black text-slate-500 uppercase tracking-[0.1em] mb-2 text-center max-w-lg leading-relaxed">
                            File RECAP
                        </h3>
                        <p className="text-sm font-medium text-slate-600 text-center max-w-md">
                            Aucune donnée analysée pour le moment.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    if (activeTab === 'multiple') {
        return (
            <div className="flex-grow flex flex-col items-center justify-center opacity-70 select-none animate-fade-in-up">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full"></div>
                    <ListFilter className="w-24 h-24 text-slate-600 relative z-10 animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-slate-500 uppercase tracking-[0.1em] mb-2 text-center max-w-lg leading-relaxed">
                    Recherche Multiple
                </h3>
                <p className="text-xs text-slate-600 font-mono">Module de recherche multicritères en construction...</p>
            </div>
        );
    }

    if (activeTab === 'queue') {
        return (
            <div className="flex-grow flex flex-col items-center justify-center opacity-70 select-none animate-fade-in-up">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-pink-500/10 blur-xl rounded-full"></div>
                    <Hourglass className="w-24 h-24 text-slate-600 relative z-10 animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-slate-500 uppercase tracking-[0.1em] mb-4 text-center max-w-lg leading-relaxed">
                    File d'attente
                </h3>
                
                {/* Styled Button matching image request */}
                <button 
                    onClick={() => soundService.playClick()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-950 border border-cyan-500/30 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.15)] group hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all cursor-pointer active:scale-95"
                >
                    <Hourglass className="w-4 h-4 text-cyan-400 animate-scale-pulse" />
                    <span className="text-[10px] font-bold text-cyan-400 tracking-[0.2em] uppercase">
                        FILE D'ATTENTE
                    </span>
                </button>
                
                <p className="text-xs text-slate-600 font-mono mt-4">Module de gestion de file en cours de construction...</p>
            </div>
        );
    }

    if (activeTab === 'archive') {
        if (archiveData.length === 0) {
            return (
                <div className="flex-grow flex flex-col items-center justify-center opacity-70 select-none animate-fade-in-up">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full"></div>
                        <Archive className="w-24 h-24 text-slate-600 relative z-10" />
                    </div>
                    <h3 className="text-xl font-black text-slate-500 uppercase tracking-[0.1em] mb-2 text-center max-w-lg leading-relaxed">
                        Archives Vides
                    </h3>
                    <p className="text-xs text-slate-600 font-mono">Videz une recherche simple pour archiver les données ici.</p>
                </div>
            );
        }
        return (
            <div className="flex-grow flex flex-col h-full overflow-hidden animate-fade-in-up">
                 <div className="flex items-center justify-between px-6 py-2">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                         Données Archivées 
                         <DigitalDisplay value={archiveData.length} color="blue" size="sm" />
                     </span>
                 </div>
                 <DataTable 
                    data={archiveData} 
                    searchTerm="MASSIVE" // Use Massive format for archive to show CMD NETO in first column if possible
                    onBannerClick={() => {}}
                    onRowClick={handleRowClick}
                    isSimpleMode={false} // Use matrix/massive display mode
                    lastImportDate={lastImportDate}
                    activeTab={activeTab}
                />
            </div>
        );
    }

    if (activeTab === 'workflow') {
        // Check if we have massive search data populated
        if (filters.massiveSns && filters.massiveSns.length > 0) {
             if (filteredData.length === 0) {
                 return (
                    <div className="flex-grow flex flex-col items-center justify-center animate-fade-in-up">
                        <div className="p-6 rounded-full bg-slate-900/50 border border-white/5 mb-4 shadow-xl">
                             <SearchX className="w-12 h-12 text-slate-600" />
                        </div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Aucune donnée trouvée</p>
                        <p className="text-[10px] text-slate-600 mt-2 font-mono">Vérifiez vos filtres</p>
                    </div>
                );
             }
             return (
                <DataTable 
                    data={filteredData} 
                    searchTerm={filters.sn || 'MASSIVE'} 
                    msanFilter={filters.msan}
                    onBannerClick={() => setModalConfig({ results: filteredData, title: (filters.sn || filters.msan) || 'Tous' })}
                    onRowClick={handleRowClick}
                    onClearFilter={handleResetFilters}
                    lastImportDate={lastImportDate}
                    activeTab={activeTab}
                />
            );
        }

        return (
            <div className="flex-grow flex flex-col items-center justify-center opacity-70 select-none animate-fade-in-up">
                <h3 className="text-xl font-black text-slate-500 uppercase tracking-[0.1em] mb-2 text-center max-w-lg leading-relaxed">
                    File de travail
                </h3>
                <p className="text-xs text-slate-600 font-mono">En attente des données de l'analyse massive...</p>
            </div>
        );
    }

    if (activeTab === 'matrix') {
        if (data.length === 0) {
            return (
                <div className="flex-grow flex flex-col items-center justify-center opacity-70 select-none animate-fade-in-up">
                    {/* BUTTON MOVED ABOVE THE ICON/TEXT BLOCK */}
                    <button 
                        onClick={() => { soundService.playClick(); handleTabChange('dashboard'); }}
                        className="mb-12 relative group overflow-hidden rounded-xl bg-slate-900 border border-white/5 pr-12 pl-4 py-4 flex items-center gap-4 transition-all hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] active:scale-95 cursor-pointer"
                    >
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-cyan-500"></div>
                        <LayoutGrid className="w-5 h-5 text-white" />
                        <span className="text-lg font-bold text-white tracking-tight">Recherche simple</span>
                        <div className="absolute right-4 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse"></div>
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-amber-500/10 blur-xl rounded-full"></div>
                        <Upload className="w-24 h-24 text-slate-600 relative z-10 animate-bounce" />
                    </div>
                    <h3 className="text-xl font-black text-slate-500 uppercase tracking-[0.1em] mb-2 text-center max-w-lg leading-relaxed">
                        Il faut tout d'abord extraire les données
                    </h3>
                </div>
            );
        }

        if (!filters.massiveSns || filters.massiveSns.length === 0) {
            return (
                <div className="flex-grow flex flex-col items-center justify-center opacity-30 select-none pointer-events-none animate-fade-in-up">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full"></div>
                        <Database className="w-24 h-24 text-slate-700 relative z-10" />
                    </div>
                    <h3 className="text-xl font-black text-slate-700 uppercase tracking-[0.3em] mb-2">Zone de Résultats</h3>
                    <p className="text-xs text-slate-600 font-mono">Les données apparaîtront dans "FILE DE TRAVAIL" et "FILE RECAP"</p>
                </div>
            );
        }
        
        // In Matrix tab now, if search triggered, we redirect. 
        // But if user clicks back to Matrix, show empty state or waiting state.
        return (
             <div className="flex-grow flex flex-col items-center justify-center opacity-30 select-none pointer-events-none animate-fade-in-up">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full"></div>
                    <Database className="w-24 h-24 text-slate-700 relative z-10" />
                </div>
                <h3 className="text-xl font-black text-slate-700 uppercase tracking-[0.3em] mb-2">Analyse Terminée</h3>
                <p className="text-xs text-slate-600 font-mono">Voir les résultats dans "FILE DE TRAVAIL" et "FILE RECAP"</p>
            </div>
        );
    }

    if (activeTab === 'duplicates') {
        if (filteredData.length === 0) {
            return (
               <div className="flex-grow flex flex-col items-center justify-center opacity-70 select-none animate-fade-in-up">
                   <div className="relative mb-6">
                       <div className="absolute inset-0 bg-orange-500/10 blur-xl rounded-full"></div>
                       <Copy className="w-24 h-24 text-slate-600 relative z-10" />
                   </div>
                   <h3 className="text-xl font-black text-slate-500 uppercase tracking-[0.1em] mb-2 text-center max-w-lg leading-relaxed">
                       Aucun doublon
                   </h3>
                   <p className="text-xs text-slate-600 font-mono">Tous les numéros de série sont uniques.</p>
               </div>
           );
        }
        return (
            <div className="flex-grow flex flex-col h-full overflow-hidden animate-fade-in-up">
                 <div className="flex items-center justify-between px-6 py-2">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                         ONT RÉPÉTÉS DÉTECTÉS
                         <DigitalDisplay value={filteredData.length} color="orange" size="sm" />
                     </span>
                     <button 
                        onClick={() => { soundService.playClick(); handleClearDuplicates(); }}
                        className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest border border-red-500/20 bg-red-500/5 px-3 py-1.5 rounded-lg transition-all"
                     >
                         Vider la file
                     </button>
                 </div>
                 <DataTable 
                    data={filteredData} 
                    searchTerm={filters.sn} 
                    onBannerClick={() => {}}
                    onRowClick={handleRowClick}
                    isSimpleMode={false}
                    lastImportDate={lastImportDate}
                    activeTab={activeTab}
                />
            </div>
        );
    }

    // If data is empty AND we are NOT in duplicates mode with available repeated records
    const currentData = activeTab === 'dashboard2' ? data2 : data;
    if (currentData.length === 0 && !(activeTab === 'duplicates' && repeatedRecords.length > 0)) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center opacity-30 select-none pointer-events-none animate-fade-in-up">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full"></div>
                    <Search className="w-24 h-24 text-slate-800 relative z-10" />
                </div>
                <h3 className="text-xl font-black text-slate-700 uppercase tracking-[0.3em] mb-2">Base de données vide</h3>
                <p className="text-xs text-slate-600 font-mono">Importez un fichier pour visualiser les données</p>
            </div>
        );
    }

    if (filteredData.length === 0) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center animate-fade-in-up">
                <div className="p-6 rounded-full bg-slate-900/50 border border-white/5 mb-4 shadow-xl">
                        <SearchX className="w-12 h-12 text-slate-600" />
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Aucun résultat trouvé</p>
                <p className="text-[10px] text-slate-600 mt-2 font-mono">Essayez de modifier vos critères de recherche</p>
            </div>
        );
    }

    const currentFilters = activeTab === 'dashboard2' ? filters2 : filters;

    return (
        <DataTable 
            data={filteredData} 
            searchTerm={(activeTab === 'workflow' && filters.massiveSns && filters.massiveSns.length > 0) ? 'MASSIVE' : currentFilters.sn} 
            msanFilter={currentFilters.msan}
            locationFilter={currentFilters.location}
            onBannerClick={() => setModalConfig({ results: filteredData, title: (currentFilters.sn || currentFilters.msan) || 'Tous' })}
            onRowClick={handleRowClick}
            onClearFilter={handleResetFilters}
            isAlertsMode={activeTab === 'alerts'}
            isSimpleMode={activeTab === 'dashboard' || activeTab === 'search' || activeTab === 'dashboard2'}
            lastImportDate={activeTab === 'dashboard2' ? null : lastImportDate}
            activeTab={activeTab}
        />
    );
  };

  return (
    <div className="h-screen bg-transparent font-sans text-slate-200 flex overflow-hidden border-none">
      {isBlockedLive && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-red-950/90 backdrop-blur-xl animate-fade-in overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
          <div className="relative z-10 flex flex-col items-center text-center p-8 max-w-md">
            <div className="w-24 h-24 mb-6 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.5)] animate-bounce">
              <Ban className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-widest mb-4 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
              Accès Refusé
            </h1>
            <p className="text-red-200 text-lg font-medium mb-8">
              Votre compte a été bloqué par un administrateur.
            </p>
            <div className="w-full h-1 bg-red-900/50 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 animate-[shimmer_5s_linear_infinite] w-full origin-left"></div>
            </div>
            <p className="mt-4 text-xs text-red-400/70 font-mono uppercase tracking-widest">
              Déconnexion en cours...
            </p>
          </div>
        </div>
      )}

      <LoadingOverlay isVisible={isLoading} progress={importProgress} activeTab={activeTab} />
      
      <SearchDialog 
        isOpen={!!modalConfig} 
        onClose={() => setModalConfig(null)}
        results={modalConfig?.results || []}
        searchTerm={modalConfig?.title || ''}
        activeTab={activeTab}
      />
      
      {/* Tech Stats Modal */}
      <TechStatsDialog 
        isOpen={showTechStats} 
        onClose={() => setShowTechStats(false)} 
        stats={techStats} 
      />

      <PasswordDialog 
        isOpen={showPasswordDialog} 
        onClose={() => setShowPasswordDialog(false)} 
        onConfirm={handleArchiveClearConfirm} 
      />

      {/* Admin Unlock Dialog */}
      <PasswordDialog 
        isOpen={showAdminPasswordDialog} 
        onClose={() => setShowAdminPasswordDialog(false)} 
        onConfirm={handleAdminUnlock} 
      />

      <AboutDialog isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <ReadmeDialog isOpen={showReadme} onClose={() => setShowReadme(false)} />
      <LisezMoiDialog isOpen={showLisezMoi} onClose={() => setShowLisezMoi(false)} />
      
      <LogsDialog 
        isOpen={showLogsDialog} 
        onClose={() => setShowLogsDialog(false)} 
        logs={connectionLogs} 
      />
      
      <MessageDialog 
        isOpen={showRepeatedInfo} onClose={() => setShowRepeatedInfo(false)}
        title="RESTRICTION SYSTÈME"
        message="En raison des restrictions de sécurité imposées par les navigateurs modernes, toute modification directe au sein d’un fichier d’archive est pour le moment impossible."
      />
      
      <MessageDialog 
        isOpen={!!errorDialog} onClose={() => setErrorDialog(null)}
        title={errorDialog?.title || ''} message={errorDialog?.message || ''}
        type="error" hideTechNote={true}
      />

      <Sidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        toggleTrigger={sidebarToggleTrigger}
        onLogout={handleLogout}
        user={user}
        onAboutClick={() => setShowAbout(true)}
        onReadmeClick={() => setShowReadme(true)}
        onLisezMoiClick={() => setShowLisezMoi(true)}
        onLogsClick={handleShowLogsDialog}
        totalOntCount={stats.total}
        criticalOntCount={stats.critical}
        activeOntCount={stats.searched}
        archiveCount={archiveData.length} // PASS ARCHIVE COUNT
        duplicateCount={stats.repeated} // PASS DUPLICATE COUNT
        isSnFound={filters.sn.trim() !== '' && filteredData.length > 0}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300">
        <Header user={user} isSidebarCollapsed={isSidebarCollapsed} onLogoClick={handleLogoClick} />
        
        <main className="flex-1 flex flex-col max-w-[1920px] w-full mx-auto px-4 pt-1 pb-3 min-h-0">
          <>
            {activeTab !== 'settings' && activeTab !== 'admin' && (
                <>
                    <div className="shrink-0 z-10 relative">
                        <SectionHeader 
                            title={getSectionTitle()}
                            searchTerm={filters.sn} 
                            msanFilter={filters.msan}
                            locationFilter={filters.location}
                            onClearFilter={handleResetFilters}
                            isDataLoaded={activeTab === 'recap' ? recapData.length > 0 : (activeTab === 'archive' ? archiveData.length > 0 : (activeTab === 'duplicates' ? filteredData.length > 0 : data.length > 0))}
                            isMassiveSearchEmpty={activeTab === 'matrix' && (!filters.massiveSns || filters.massiveSns.length === 0)}
                        />
                    </div>
                    <div className="shrink-0 z-10 relative">
                    <StatsGrid 
                        key={statsKey}
                        stats={stats} 
                        selectedStatus={filters.status} 
                        showRepeated={filters.showRepeated || activeTab === 'duplicates'}
                        onStatClick={handleStatClick}
                        isMatrixMode={activeTab === 'matrix' || activeTab === 'workflow'}
                        activeTab={activeTab}
                    />
                    </div>
                </>
            )}

{/* Badge removed */}

            {activeTab === 'matrix' ? (
              <div className="shrink-0 z-10 relative">
                 <MassiveSearch 
                    onSearch={handleMassiveSearch} 
                    onClear={handleMassiveReset}
                    onExport={handleExport}
                    onShowStats={handleShowTechStats}
                    currentCount={filteredData.length}
                    totalDataCount={data.length}
                    msanOptions={msanOptions}
                    selectedMsan={filters.msan}
                    onMsanChange={(val) => setFilters(prev => ({ ...prev, msan: val }))}
                    hasActiveSearch={filters.massiveSns && filters.massiveSns.length > 0}
                 />
              </div>
            ) : activeTab === 'workflow' ? (
               // If in workflow mode and we have massive data, we show ActionBar for exports/reset
               (filters.massiveSns && filters.massiveSns.length > 0) ? (
                  <div className="shrink-0 z-10 relative">
                      <ActionBar 
                      filters={filters}
                      msanOptions={msanOptions}
                      onFilterChange={(f) => setFilters(f)}
                      onImport={handleImport}
                      onExport={handleExport}
                      onReset={handleFullReset}
                      onOpenSearch={() => setModalConfig({ results: filteredData, title: filters.sn || 'Recherche' })}
                      isLoading={isLoading}
                      lastImportDate={lastImportDate}
                      isDataLoaded={data.length > 0}
                      simpleMode={false}
                      hasNokiaData={hasNokiaData}
                      activeTab={activeTab}
                      />
                  </div>
               ) : null
            ) : activeTab !== 'settings' && activeTab !== 'archive' && activeTab !== 'admin' && activeTab !== 'duplicates' && (activeTab !== 'search' || data.length > 0) && (activeTab !== 'recap' || data.length > 0) && (activeTab !== 'alerts' || data.length > 0) ? (
              <div className="shrink-0 z-10 relative">
                  <ActionBar 
                  filters={activeTab === 'dashboard2' ? filters2 : filters}
                  msanOptions={msanOptions}
                  onFilterChange={(f) => activeTab === 'dashboard2' ? setFilters2(f) : setFilters(f)}
                  onImport={handleImport}
                  onExport={handleExport}
                  onReset={handleFullReset}
                  onOpenSearch={() => setModalConfig({ results: filteredData, title: (activeTab === 'dashboard2' ? filters2 : filters).sn || 'Recherche' })}
                  isLoading={isLoading}
                  lastImportDate={activeTab === 'dashboard2' ? null : lastImportDate}
                  isDataLoaded={activeTab === 'recap' ? recapData.length > 0 : (activeTab === 'dashboard2' ? data2.length > 0 : data.length > 0)}
                  simpleMode={activeTab === 'dashboard' || activeTab === 'dashboard2'}
                  hasNokiaData={hasNokiaData}
                  activeTab={activeTab}
                  />
              </div>
            ) : null}

            {activeTab !== 'settings' && activeTab !== 'archive' && activeTab !== 'admin' && activeTab !== 'duplicates' && (
                <div className="shrink-0 z-10 relative">
                    <ActiveFilters 
                        searchTerm={(activeTab === 'dashboard2' ? filters2 : filters).sn} 
                        msanFilter={(activeTab === 'dashboard2' ? filters2 : filters).msan}
                        locationFilter={(activeTab === 'dashboard2' ? filters2 : filters).location}
                        status={(activeTab === 'dashboard2' ? filters2 : filters).status}
                        onClearFilter={handleResetFilters}
                        isDataLoaded={activeTab === 'recap' ? recapData.length > 0 : (activeTab === 'dashboard2' ? data2.length > 0 : data.length > 0)}
                        activeTab={activeTab}
                    />
                </div>
            )}

            <div className="flex-grow overflow-hidden flex flex-col min-h-0 relative z-0">
                {renderMainContent()}
            </div>
          </>
        </main>
        
        <footer className="w-full text-center py-2 mt-auto border-t border-white/5 bg-slate-900/20 backdrop-blur-sm shrink-0 z-10">
          <div className="flex justify-center items-center gap-4">
              <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase opacity-70">
                  © 2026 • <span className="text-white font-bold">ONT Finder</span> <span className="text-primary font-bold">Pro</span> • Tous droits réservés
              </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;