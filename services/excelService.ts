import { read, utils, writeFile } from 'xlsx';
import { ONTRecord, ONTStatus } from '../types';

// Helper to assign a random status for demo purposes.
// MODIFIED: Removed 'critical' from random generation to reserve it strictly for ALCL records
const getRandomStatus = (): ONTStatus => {
  const rand = Math.random();
  if (rand > 0.7) return 'isolated';
  if (rand > 0.4) return 'active';
  return 'operational';
};

/**
 * Robustly finds a value in a row object by checking multiple potential header aliases.
 */
const findColumnValue = (row: any, possibleHeaders: string[]): string => {
  const rowKeys = Object.keys(row);
  
  // 1. Exact match
  for (const header of possibleHeaders) {
    if (row[header] !== undefined && row[header] !== null) {
      return String(row[header]).trim();
    }
  }

  // 2. Case-insensitive match
  for (const header of possibleHeaders) {
    const foundKey = rowKeys.find(k => k.toLowerCase() === header.toLowerCase());
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
      return String(row[foundKey]).trim();
    }
  }

  // 3. Partial/Fuzzy match
  for (const header of possibleHeaders) {
    const foundKey = rowKeys.find(k => k.toLowerCase().includes(header.toLowerCase()));
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
      return String(row[foundKey]).trim();
    }
  }

  return '';
};

// --- NOKIA / ALCATEL PARSER ---
export const parseNokiaFile = (file: File, onProgress?: (progress: number) => void): Promise<{ records: ONTRecord[], saveTime: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    if (onProgress) {
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          // File reading is up to 30% of the progress
          const percent = Math.round((e.loaded / e.total) * 30);
          onProgress(percent);
        }
      };
    }

    reader.onload = (e) => {
      try {
        if (onProgress) onProgress(40); // Reading done, starting parse
        
        const data = e.target?.result;
        if (!data) {
          reject("No data read");
          return;
        }

        // Use setTimeout to allow the UI to update the progress to 40% before blocking
        setTimeout(() => {
          try {
            const workbook = read(data, { type: 'binary' });
            if (onProgress) onProgress(60); // Workbook parsed
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Read as array of arrays to handle raw text lines
            const rawRows = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            if (onProgress) onProgress(70); // Rows extracted
        
        // VALIDATION: Check for 'New ONT Discovered,' signature
        // Prompt requirement: "si les 19 caractères de la fin de la ligne ne contient pas 'New ONT Discovered,'"
        // Implementation: Check if any row contains this signature, implying validity.
        const hasSignature = rawRows.some(row => {
            const rowStr = row.map(cell => String(cell)).join(' ').trim();
            return rowStr.includes('New ONT Discovered,');
        });

        const records: ONTRecord[] = [];
        const saveTime = new Date().toLocaleString(); // Nokia files might not have the same header timestamp, use current

        if (hasSignature) {
            // REGEX DEFINITIONS based on specific prompt requirements:
            
            // 1. "ONT New:" ... until ":" -> MSAN
            // Capture text between "ONT New:" and the next ":"
            const regexMsan = /ONT New\s*:\s*([^:]+?)(?=\s*:)/i;
            
            // 2. "LT" ... digit before "." -> SLOT
            const regexSlot = /LT\s*(\d+)\./i;
            
            // 3. "PON" ... digit before "." -> PORT (Changed from PONT to PON as requested)
            const regexPort = /PON\s*(\d+)\./i;
            
            // 4. "SERNUM =" ... text before "," -> SN ASCII
            const regexSnAscii = /SERNUM\s*=\s*([^,]+)/i;

            rawRows.forEach((row, index) => {
                 // Convert row to a single string for searching
                 const rowString = row.map(cell => String(cell)).join(' ');
                 
                 // Check if this row looks like a Nokia Log line (must have SERNUM or ONT New)
                 if (!rowString.includes('ONT New') && !rowString.includes('SERNUM')) {
                     return;
                 }

                 const matchMsan = rowString.match(regexMsan);
                 const matchSlot = rowString.match(regexSlot);
                 const matchPort = rowString.match(regexPort);
                 const matchSnAscii = rowString.match(regexSnAscii);

                 // Proceed only if we found the SN (Critical identifier)
                 if (matchSnAscii) {
                     const snAscii = matchSnAscii[1].trim();
                     
                     // Extraction based on groups
                     const msan = matchMsan ? matchMsan[1].trim() : 'Unknown MSAN';
                     const slot = matchSlot ? matchSlot[1].trim() : '0';
                     const port = matchPort ? matchPort[1].trim() : '0';
                     
                     // Construct Emplacement: "Frame:1/Slot:'SLOT'/Port:'PORT'"
                     const location = `Frame:1/Slot:${slot}/Port:${port}`;

                     // Construct SN EN HÉXA
                     // Rule: '414C434C' + 8 chars after 'ALCL'
                     let snHex = snAscii;
                     if (snAscii.toUpperCase().startsWith('ALCL')) {
                         const suffix = snAscii.substring(4, 12); // Get 8 chars starting from index 4
                         snHex = '414C434C' + suffix;
                     }

                     records.push({
                         id: `nok-${index}-${Date.now()}`,
                         msan: msan,
                         location: location,
                         sn: snHex,        // Mapped to SN EN HÉXA (Main SN)
                         version: snAscii, // Mapped to SN EN ASCII (Secondary/Version field)
                         vendorId: 'ALCL',
                         status: 'critical'
                     });
                 }
            });
        } else {
            // Try to parse as CSV/Excel with headers
            let headerRowIndex = -1;
            for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
              const row = rawRows[i];
              if (!row || !Array.isArray(row)) continue;
              const rowStr = row.map(cell => String(cell).toLowerCase()).join(' ');
              if (rowStr.includes('serial') || rowStr.includes('sn') || rowStr.includes('sernum') || rowStr.includes('ont')) {
                headerRowIndex = i;
                break;
              }
            }

            if (headerRowIndex === -1) {
                reject("INVALID_FORMAT_NOKIA");
                return;
            }

            const jsonData = utils.sheet_to_json<any>(worksheet, { 
              range: headerRowIndex,
              defval: "" 
            });

            jsonData.forEach((row, index) => {
              const msan = findColumnValue(row, ['Node', 'Device Name', 'Nom MSAN', 'MSAN', 'Nom', 'Name', 'Device', 'NE Name']);
              
              // Location might be split into Rack, Shelf, Slot, Port
              let location = findColumnValue(row, ['Location', 'Emplacement', 'Position', 'Loc', 'Ville']);
              if (!location) {
                  const rack = findColumnValue(row, ['Rack']);
                  const shelf = findColumnValue(row, ['Shelf']);
                  const slot = findColumnValue(row, ['Slot', 'LT']);
                  const port = findColumnValue(row, ['Port', 'PON']);
                  if (slot || port) {
                      location = `Frame:1/Slot:${slot || '0'}/Port:${port || '0'}`;
                  } else {
                      location = 'Unknown Location';
                  }
              }

              let rawSn = findColumnValue(row, ['Serial Number', 'SN', 'S/N', 'Serial', 'ONT ID', 'SERNUM', 'ONT']);
              let version = findColumnValue(row, ['Software Version', 'SoftwareVersion', 'SoftVer', 'Version', 'Ver', 'V', 'Software', 'Hardware', 'Equipment ID']);
              const vendorId = findColumnValue(row, ['Vendor ID', 'VendorID', 'Vendor', 'V_ID', 'Vendor Id']);

              if (!rawSn) return;

              let snHex = rawSn;
              let snAscii = version; // Default to version column if no split happens

              // User Request: Split SN at '('
              // "insérer sur position 'SN EN HÉXA' la chaine de caractère jusque '('"
              // "et partir de '(' insérer dans la position 'SN en ASCII' la chaine de caractère jusqu'à ')'"
              if (rawSn.includes('(')) {
                  const parts = rawSn.split('(');
                  snHex = parts[0].trim(); // Before '('
                  
                  if (parts.length > 1) {
                      // Extract content up to ')'
                      const asciiPart = parts[1].split(')')[0].trim();
                      snAscii = asciiPart;
                  }
              } else {
                  // Fallback if no parenthesis (Original Logic)
                  if (rawSn.toUpperCase().startsWith('ALCL')) {
                      const suffix = rawSn.substring(4, 12);
                      snHex = '414C434C' + suffix;
                      snAscii = rawSn;
                  } else {
                      snHex = rawSn;
                      // If no version found, use rawSn as ascii or keep empty/version
                      if (!snAscii) snAscii = rawSn;
                  }
              }

              records.push({
                  id: `nok-csv-${index}-${Date.now()}`,
                  msan: msan || 'Unknown MSAN',
                  location: location,
                  sn: snHex,        // SN EN HÉXA
                  version: snAscii, // SN EN ASCII
                  vendorId: vendorId || 'ALCL',
                  status: 'critical' // Default status
              });
            });

            if (records.length === 0) {
                reject("INVALID_FORMAT_NOKIA");
                return;
            }
        }

        resolve({ records, saveTime });
          } catch (error) {
            reject(error);
          }
        }, 50);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

// --- STANDARD PARSER ---
export const parseExcelFile = (file: File, onProgress?: (progress: number) => void): Promise<{ records: ONTRecord[], saveTime: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    if (onProgress) {
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 30);
          onProgress(percent);
        }
      };
    }

    reader.onload = (e) => {
      try {
        if (onProgress) onProgress(40);
        const data = e.target?.result;
        if (!data) {
          reject("No data read");
          return;
        }

        setTimeout(() => {
          try {
            const workbook = read(data, { type: 'binary' });
            if (onProgress) onProgress(60);
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Read raw rows to find metadata and header
            const rawRows = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            if (onProgress) onProgress(70);
        
        // VALIDATION: Check Row 1 for 'GPON ONU Report'
        if (rawRows.length > 0) {
            const firstRow = rawRows[0];
            const firstRowStr = Array.isArray(firstRow) ? firstRow.join(' ') : String(firstRow || '');
            if (!firstRowStr.includes('GPON ONU Report')) {
                reject("INVALID_FORMAT_HUAWEI");
                return;
            }
        } else {
            reject("INVALID_FORMAT_HUAWEI");
            return;
        }

        // --- STEP 0: Extract Save Time from 2nd line (index 1) ---
        let saveTime = "";
        if (rawRows.length > 1) {
            const secondRow = rawRows[1];
            if (Array.isArray(secondRow)) {
                // Join contents of the second row to use as "save time"
                const rawTime = secondRow
                    .filter(c => c !== null && c !== undefined && String(c).trim() !== '')
                    .map(String)
                    .join(' ')
                    .trim();

                // Replace 'Save Time' with 'ExportÉ'
                saveTime = rawTime.replace(/Save\s*Time/gi, 'ExportÉ');
            }
        }

        // --- STEP 1: Detect Header Row ---
        let headerRowIndex = 0;
        const searchTerms = ['Device Name', 'SN', 'Location', 'Nom MSAN', 'Emplacement', 'Vendor ID', 'Software Version'];
        
        for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
          const row = rawRows[i];
          if (!row || !Array.isArray(row)) continue;
          
          const rowStr = row.map(cell => String(cell).toLowerCase()).join(' ');
          
          if (searchTerms.some(term => rowStr.includes(term.toLowerCase()))) {
            headerRowIndex = i;
            break;
          }
        }

        // --- STEP 2: Parse Data ---
        const jsonData = utils.sheet_to_json<any>(worksheet, { 
          range: headerRowIndex,
          defval: "" 
        });

        // OPTIMIZATION: Map headers once
        if (jsonData.length > 0) {
            const firstRow = jsonData[0];
            const keys = Object.keys(firstRow);
            
            // Helper to find key for a specific field
            const findKey = (possibleHeaders: string[]) => {
                // 1. Exact match
                for (const header of possibleHeaders) {
                    if (keys.includes(header)) return header;
                }
                // 2. Case-insensitive
                for (const header of possibleHeaders) {
                    const found = keys.find(k => k.toLowerCase() === header.toLowerCase());
                    if (found) return found;
                }
                // 3. Partial
                for (const header of possibleHeaders) {
                    const found = keys.find(k => k.toLowerCase().includes(header.toLowerCase()));
                    if (found) return found;
                }
                return null;
            };

            const keyMap = {
                msan: findKey(['Device Name', 'Nom MSAN', 'MSAN', 'Nom', 'Name', 'Device']),
                location: findKey(['Location', 'Emplacement', 'Position', 'Loc', 'Ville']),
                slot: findKey(['Slot']),
                port: findKey(['Port']),
                onuId: findKey(['ONU ID', 'ONU', 'ONUID']),
                sn: findKey(['SN', 'Serial Number', 'S/N', 'Serial', 'ONT ID']),
                version: findKey(['Software Version', 'SoftwareVersion', 'SoftVer', 'Version', 'Ver', 'V', 'Software', 'Hardware']),
                vendorId: findKey(['Vendor ID', 'VendorID', 'Vendor', 'V_ID', 'Vendor Id'])
            };

            // --- STEP 3: Map Data using pre-calculated keys ---
            const mappedData: ONTRecord[] = [];
            
            for (let index = 0; index < jsonData.length; index++) {
                const row = jsonData[index];
                
                const msan = keyMap.msan ? String(row[keyMap.msan] || '').trim() : '';
                let location = keyMap.location ? String(row[keyMap.location] || '').trim() : '';
                const slot = keyMap.slot ? String(row[keyMap.slot] || '').trim() : '';
                const port = keyMap.port ? String(row[keyMap.port] || '').trim() : '';
                const onuId = keyMap.onuId ? String(row[keyMap.onuId] || '').trim() : '';
                
                // User Request: "sur onglet 'Inventaire FTTH' remplacer 'RACH 0/SHELF 0/SLOT 18/PORT 7/ONU ID 2' par 'RACH 0 SHELF 0 SLOT 18 PORT 7 ONT 2'"
                if (slot || port || onuId) {
                    location = `RACH 0 SHELF 0 SLOT ${slot || '0'} PORT ${port || '0'} ONT ${onuId || '0'}`;
                }

                let sn = keyMap.sn ? String(row[keyMap.sn] || '').trim() : '';
                let version = keyMap.version ? String(row[keyMap.version] || '').trim() : '';
                const vendorId = keyMap.vendorId ? String(row[keyMap.vendorId] || '').trim() : '';

                if (!msan && !sn) continue;

                if (sn && sn.includes('(')) {
                    const match = sn.match(/^(.*?)\s*\((.*?)\)/);
                    if (match) {
                        const snPrefix = match[1].trim();
                        const versionContent = match[2].trim();
                        if (snPrefix && versionContent) {
                            sn = snPrefix;
                            version = versionContent;
                        }
                    }
                }

                const isVendorALCL = vendorId.toUpperCase().includes('ALCL');
                const isVersionALCL = version.toUpperCase().startsWith('ALCL');
                const isALCL = isVendorALCL || isVersionALCL;

                mappedData.push({
                    id: `row-${index}-${Date.now()}`,
                    msan: msan || 'Unknown MSAN',
                    location: location || '--/--/--',
                    sn: sn || 'Unknown SN', 
                    version: version || '--',
                    vendorId: vendorId || '',
                    status: isALCL ? 'critical' : getRandomStatus(), 
                });
            }

            resolve({ records: mappedData, saveTime });
        } else {
            resolve({ records: [], saveTime });
        }
          } catch (error) {
            reject(error);
          }
        }, 50);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const exportToExcel = (data: ONTRecord[], filename: string, isMatrixMode: boolean = false) => {
  const exportData = data.map(record => {
      const displayStatus = record.status === 'isolated' ? 'Non visible' : record.status;
      
      if (isMatrixMode) {
          // Explicit mapping for Massive Search Mode
          // ORDER: CMD NETO, SN, NOM MSAN, Emplacement, VENDEUR, Statut
          return {
            'CMD NETO': record.msan,
            'SN': record.version,
            'NOM MSAN': record.sn,
            'Emplacement': record.location,
            'VENDEUR': record.vendorId,
            'Statut': displayStatus
          };
      }
      
      // Standard Mode Mapping
      let location = record.location;
      let msan = record.msan;
      const isNokia = (record.vendorId || '').toUpperCase().includes('ALCL') || (record.version || '').toUpperCase().startsWith('ALCL');
      if (!isMatrixMode && isNokia && msan && msan.includes(':')) {
          const colonIndex = msan.indexOf(':');
          const locStr = msan.substring(colonIndex);
          msan = msan.substring(0, colonIndex);
          
          const rMatch = locStr.match(/R(\d+)/i);
          const sMatch = locStr.match(/S(\d+)/i);
          const ltMatch = locStr.match(/LT(\d+)/i);
          const ponMatch = locStr.match(/PON(\d+)/i);
          
          if (rMatch && sMatch && ltMatch && ponMatch) {
              location = `Frame:${rMatch[1]}/Shelf:${sMatch[1]}/Slot:${ltMatch[1]}/Port:${ponMatch[1]}`;
          } else {
              location = locStr;
          }
      }

      let finalStatus = displayStatus;
      if (!isMatrixMode && location && location !== '---') {
          finalStatus = 'active';
      }

      return {
        'Nom MSAN': msan,
        'Emplacement': location,
        'SN': record.sn,
        'Version': record.version,
        'VENDEUR': record.vendorId,
        'Statut': finalStatus
      };
  });
  
  const worksheet = utils.json_to_sheet(exportData);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Export ONT");
  writeFile(workbook, filename);
};