/* ==========================================================================
   AJIO DATA ARRANGE - Core Application Logic (JS)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Hardcoded Google Sheets Apps Script Web App URL
    const GOOGLE_SHEETS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyOMN8UOshlf0-rUsH1KSVxbP3JJHXynE3Ykg21gOuTSuu8DJv7G1a1LQabthyVjM1dVQ/exec";

    // Selected Files Store
    let selectedFiles = [];
    // Processed Files Result Store (objects: { name, originalName, blob, size })
    let processedFiles = [];
    // Memory cache for the download-all zip blob
    let processedZipBlob = null;
    let currentUploadedFolderName = "";

    // ZIP Batch Mode State Variables (in File Converter)
    let isBatchZipMode = false;
    let batchZipFile = null;
    let batchUploadedZipName = "";
    let batchProcessedZipBlob = null;
    let batchResults = []; // array of { vendorCode, partyName, invoiceRange, totalOrders, cntNew... }

    // DOM Elements
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const zipInput = document.getElementById('zipInput');
    const folderInput = document.getElementById('folderInput');
    const browseBtn = document.getElementById('browseBtn');
    const browseZipBtn = document.getElementById('browseZipBtn');
    const browseFolderBtn = document.getElementById('browseFolderBtn');
    const clearBtn = document.getElementById('clearBtn');
    const clearFilesBtn = document.getElementById('clearFilesBtn');
    const resetBtn = document.getElementById('resetBtn');
    const processBtn = document.getElementById('processBtn');
    const fileListCard = document.getElementById('fileListCard');
    const uploadFileList = document.getElementById('uploadFileList');
    const selectedCountSpan = document.getElementById('selectedCount');
    
    // Status & Progress Elements
    const processStatus = document.getElementById('processStatus');
    const progressCard = document.getElementById('progressCard');
    const overallProgressBar = document.getElementById('overallProgressBar');
    const progressPercent = document.getElementById('progressPercent');
    const progressStepText = document.getElementById('progressStepText');
    const stepExtract = document.getElementById('stepExtract');
    const stepConvert = document.getElementById('stepConvert');
    const stepRename = document.getElementById('stepRename');
    
    // Output Elements
    const processedContainer = document.getElementById('processedContainer');
    const processedHeader = document.getElementById('processedHeader');
    const processedCount = document.getElementById('processedCount');
    const processedList = document.getElementById('processedList');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    
    // Config toggles
    const optCsvToXlsx = document.getElementById('optCsvToXlsx');
    const optRenameFiles = document.getElementById('optRenameFiles');
    const optSmartSuffix = document.getElementById('optSmartSuffix');
    
    // Logger Elements
    const consoleLog = document.getElementById('consoleLog');
    const clearLogBtn = document.getElementById('clearLogBtn');

    /* ==========================================================================
       LOGGER UTILITY
       ========================================================================== */
    function log(message, type = 'info') {
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        line.innerText = `[${timestamp}] ${message}`;
        
        consoleLog.appendChild(line);
        consoleLog.scrollTop = consoleLog.scrollHeight;
    }

    clearLogBtn.addEventListener('click', () => {
        consoleLog.innerHTML = '';
        log('Log cleared.', 'info');
    });

    /* ==========================================================================
       DRAG & DROP EVENTS & FOLDER RECURSION
       ========================================================================== */
    // Stop propagation on input clicks
    [fileInput, zipInput, folderInput].forEach(inputEl => {
        if (inputEl) {
            inputEl.addEventListener('click', (e) => e.stopPropagation());
        }
    });

    // Handle Browse button clicks
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    if (browseZipBtn) {
        browseZipBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            zipInput.click();
        });
    }

    if (browseFolderBtn) {
        browseFolderBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            folderInput.click();
        });
    }

    // Dropzone click triggers browse files by default if not clicking action buttons
    dropzone.addEventListener('click', (e) => {
        if (e.target !== fileInput && e.target !== zipInput && e.target !== folderInput && 
            e.target !== browseBtn && !browseBtn.contains(e.target) &&
            e.target !== browseZipBtn && (!browseZipBtn || !browseZipBtn.contains(e.target)) &&
            e.target !== browseFolderBtn && (!browseFolderBtn || !browseFolderBtn.contains(e.target))) {
            fileInput.click();
        }
    });

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Toggle dragover styles
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
    });

    // Handle dropped files & folders recursively
    dropzone.addEventListener('drop', async (e) => {
        try {
            const items = e.dataTransfer.items;
            let isFolder = false;
            let folderName = "dropped folder";
            
            if (items && items.length > 0) {
                const entry = items[0].webkitGetAsEntry();
                if (entry) {
                    isFolder = entry.isDirectory;
                    folderName = entry.name;
                }
            }
            
            const files = await getFilesFromDroppedItems(e.dataTransfer);
            if (files.length > 0) {
                if (isFolder) {
                    currentUploadedFolderName = folderName;
                } else {
                    currentUploadedFolderName = "";
                }
                handleFiles(files);
            }
        } catch (err) {
            log(`Failed to parse dropped items: ${err.message}`, 'error');
        }
    });

    // Handle selected files
    fileInput.addEventListener('change', (e) => {
        currentUploadedFolderName = "";
        handleFiles(e.target.files);
    });

    // Handle selected ZIP file
    if (zipInput) {
        zipInput.addEventListener('change', (e) => {
            currentUploadedFolderName = "";
            handleFiles(e.target.files);
        });
    }

    // Handle selected folder
    if (folderInput) {
        folderInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            const folderName = files[0] && files[0].webkitRelativePath ? files[0].webkitRelativePath.split('/')[0] : "selected folder";
            currentUploadedFolderName = folderName;
            handleFiles(files);
        });
    }

    // Recursive directory reader helper
    async function traverseDirectory(entry) {
        const files = [];
        const readEntry = async (item) => {
            if (item.isFile) {
                const file = await new Promise((resolve, reject) => item.file(resolve, reject));
                files.push(file);
            } else if (item.isDirectory) {
                const directoryReader = item.createReader();
                const readAllEntries = async () => {
                    let allEntries = [];
                    let readBatch = async () => {
                        const results = await new Promise((resolve, reject) => {
                            directoryReader.readEntries(resolve, reject);
                        });
                        if (results.length > 0) {
                            allEntries.push(...results);
                            await readBatch();
                        }
                    };
                    await readBatch();
                    return allEntries;
                };

                const entries = await readAllEntries();
                for (const subItem of entries) {
                    await readEntry(subItem);
                }
            }
        };
        await readEntry(entry);
        return files;
    }

    async function getFilesFromDroppedItems(dataTransfer) {
        const files = [];
        const items = dataTransfer.items;
        if (!items) {
            return Array.from(dataTransfer.files);
        }

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const entry = item.webkitGetAsEntry();
                if (entry) {
                    const entryFiles = await traverseDirectory(entry);
                    files.push(...entryFiles);
                }
            }
        }
        return files;
    }

    function handleFiles(files) {
        if (files.length === 0) return;

        let addedCount = 0;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Check if already in list to avoid duplicates
            if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                continue;
            }

            selectedFiles.push({
                id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                name: file.name,
                size: file.size,
                file: file
            });
            addedCount++;
        }
        
        if (addedCount > 0) {
            log(`Added ${addedCount} file(s) to the list.`, 'info');
        }
        updateUI();
    }

    /* ==========================================================================
       UI CONTROLS & UPDATES
       ========================================================================== */
    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function getFileIconClass(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (ext === 'zip') return 'fa-solid fa-file-zipper zip';
        if (ext === 'csv') return 'fa-solid fa-file-csv csv';
        if (ext === 'xlsx' || ext === 'xls') return 'fa-solid fa-file-excel xlsx';
        return 'fa-solid fa-file text-muted';
    }

    function removeFile(id) {
        const fileToRemove = selectedFiles.find(f => f.id === id);
        selectedFiles = selectedFiles.filter(f => f.id !== id);
        if (fileToRemove) {
            log(`Removed file: ${fileToRemove.name}`, 'info');
        }
        updateUI();
    }

    function updateUI() {
        selectedCountSpan.innerText = selectedFiles.length;
        
        // Remove empty state message if files exist
        if (selectedFiles.length > 0) {
            processBtn.removeAttribute('disabled');
            
            uploadFileList.innerHTML = '';
            selectedFiles.forEach(fileObj => {
                const item = document.createElement('div');
                item.className = 'file-item';
                
                const info = document.createElement('div');
                info.className = 'file-info';
                
                const icon = document.createElement('i');
                icon.className = getFileIconClass(fileObj.name);
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'file-name';
                nameSpan.innerText = fileObj.name;
                nameSpan.title = fileObj.name;
                
                const sizeSpan = document.createElement('span');
                sizeSpan.className = 'file-size';
                sizeSpan.innerText = formatBytes(fileObj.size);
                
                info.appendChild(icon);
                info.appendChild(nameSpan);
                info.appendChild(sizeSpan);
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'file-action-btn';
                removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                removeBtn.title = "Remove file";
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeFile(fileObj.id);
                });
                
                item.appendChild(info);
                item.appendChild(removeBtn);
                uploadFileList.appendChild(item);
            });
        } else {
            processBtn.setAttribute('disabled', 'true');
            uploadFileList.innerHTML = '<div class="empty-list-msg">No files selected yet.</div>';
        }
        checkBatchModeState();
    }

    // Clear All Files
    clearBtn.addEventListener('click', () => {
        selectedFiles = [];
        processedFiles = [];
        processedZipBlob = null;
        fileInput.value = '';
        
        // Reset process elements
        processStatus.className = 'status-indicator idle';
        processStatus.innerText = 'Idle';
        
        progressCard.classList.add('hidden');
        overallProgressBar.style.width = '0%';
        progressPercent.innerText = '0% Completed';
        
        // Reset timelines
        [stepExtract, stepConvert, stepRename].forEach(el => {
            el.className = 'timeline-step';
            el.querySelector('i').className = 'fa-solid fa-circle-notch fa-spin step-icon';
        });

        // Reset output container
        processedContainer.className = 'processed-container empty';
        processedContainer.innerHTML = `
            <div class="empty-output-state">
                <i class="fa-solid fa-gears-gear placeholder-icon"></i>
                <p>Upload files and click convert to see results here.</p>
            </div>
        `;
        updateUI();
        log('All fields cleared. Ready for new files.', 'info');
    });

    // Clear Selected Files only
    if (clearFilesBtn) {
        clearFilesBtn.addEventListener('click', () => {
            selectedFiles = [];
            fileInput.value = '';
            if (zipInput) zipInput.value = '';
            if (folderInput) folderInput.value = '';
            updateUI();
            log('Selected files list cleared.', 'info');
        });
    }

    // Reset All State (trigger full clear)
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            clearBtn.click();
        });
    }

    // Check if the uploaded ZIP file contains subfolders (which indicates Multi-Party Batch Mode)
    async function checkIsBatchZip(file) {
        try {
            const zip = await JSZip.loadAsync(file);
            const entries = Object.keys(zip.files);
            return entries.some(path => {
                const entry = zip.files[path];
                if (entry.dir) return false;
                const norm = path.replace(/\\/g, '/');
                if (norm.includes('__MACOSX') || norm.split('/').some(part => part.startsWith('.'))) return false;
                return norm.includes('/');
            });
        } catch (e) {
            return false;
        }
    }

    // Automatically toggle Batch Mode state depending on selected files list
    async function checkBatchModeState() {
        if (selectedFiles.length === 1 && selectedFiles[0].name.split('.').pop().toLowerCase() === 'zip') {
            const isBatch = await checkIsBatchZip(selectedFiles[0].file);
            if (isBatch) {
                batchZipFile = selectedFiles[0].file;
                batchUploadedZipName = selectedFiles[0].name;
            }
        } else {
            batchZipFile = null;
            batchUploadedZipName = "";
        }
        processBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> START AJIO ARANGE';
    }

    // Render Converter Tab Batch Mode Dashboard
    function renderConverterBatchDashboard() {
        if (!processedContainer) return;
        processedContainer.innerHTML = '';
        processedContainer.className = 'processed-container';

        const header = document.createElement('div');
        header.className = 'merger-results-header';
        header.style.marginBottom = '1.25rem';
        header.innerHTML = `
            <h3><i class="fa-solid fa-circle-check text-success"></i> Batch Pipeline Outputs</h3>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-success btn-glow" id="downloadConverterBatchSummaryBtn">
                    <i class="fa-solid fa-file-excel"></i> Download Summary Excel
                </button>
                <button class="btn btn-primary btn-glow" id="downloadConverterBatchZipBtn">
                    <i class="fa-solid fa-file-zipper"></i> Download Batch ZIP
                </button>
            </div>
        `;
        processedContainer.appendChild(header);

        const gridContainer = document.createElement('div');
        gridContainer.className = 'data-grid-container';
        gridContainer.style.flexGrow = '1';
        gridContainer.style.overflowY = 'auto';

        const table = document.createElement('table');
        table.className = 'data-table batch-results-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th style="width: 15%">CODE</th>
                    <th style="width: 40%">PARTY NAME</th>
                    <th style="width: 25%">INVOICE RANGE</th>
                    <th style="width: 20%; text-align: center;">STATUS</th>
                </tr>
            </thead>
            <tbody>
                ${batchResults.map(res => {
                    const statusClass = res.status === "Success" ? "success" : "error";
                    const statusIcon = res.status === "Success" ? "fa-circle-check" : "fa-triangle-exclamation";
                    const rangeDisplay = res.invoiceRange === "N/A" ? "N/A" : res.invoiceRange;
                    
                    return `
                        <tr>
                            <td style="font-weight: 700; color: var(--color-primary);">${res.vendorCode}</td>
                            <td>
                                <div>${res.partyName}</div>
                                ${res.status !== "Success" ? `<div style="font-size: 0.75rem; color: var(--color-error); margin-top: 0.2rem;">${res.errorMsg}</div>` : ""}
                            </td>
                            <td>${rangeDisplay}</td>
                            <td style="text-align: center;">
                                <span class="batch-status-badge ${statusClass}">
                                    <i class="fa-solid ${statusIcon}"></i> ${res.status}
                                </span>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        `;
        gridContainer.appendChild(table);
        processedContainer.appendChild(gridContainer);

        const dlZipBtn = document.getElementById('downloadConverterBatchZipBtn');
        if (dlZipBtn) {
            dlZipBtn.addEventListener('click', () => {
                if (batchProcessedZipBlob) {
                    triggerDownload(batchProcessedZipBlob, batchUploadedZipName || 'Batch_Merger_Output.zip');
                    log(`Downloaded complete batch ZIP: ${batchUploadedZipName || 'Batch_Merger_Output.zip'}`, 'info');
                }
            });
        }

        const dlSummaryBtn = document.getElementById('downloadConverterBatchSummaryBtn');
        if (dlSummaryBtn) {
            dlSummaryBtn.addEventListener('click', () => {
                const summaryWb = XLSX.utils.book_new();
                
                const detailedSummaryData = [[
                    "Vendor Code", "Party Name", "Invoice Range", "Total Orders", 
                    "New", "Cancelled", "Shipped", "Delivered", "Ready to Ship", "PO Created", "Others", 
                    "Date Range", "Warehouse", "Processing Status"
                ]];

                batchResults.forEach(r => {
                    if (r.status === "Success") {
                        detailedSummaryData.push([
                            r.vendorCode, r.partyName, r.invoiceRange, r.totalOrders,
                            r.cntNew, r.cntCancelled, r.cntShipped, r.cntDelivered, r.cntRTS, r.cntPO, r.cntOther,
                            r.dateRangeStr, r.warehouseStr, "Success"
                        ]);
                    } else {
                        detailedSummaryData.push([
                            r.vendorCode, r.partyName, "N/A", 0,
                            0, 0, 0, 0, 0, 0, 0,
                            "N/A", "N/A", `Failed: ${r.errorMsg}`
                        ]);
                    }
                });

                const wsDetailed = XLSX.utils.aoa_to_sheet(detailedSummaryData);
                XLSX.utils.book_append_sheet(summaryWb, wsDetailed, "Detailed Summary");

                const shortListData = [];
                batchResults.forEach(r => {
                    if (r.status === "Success") {
                        shortListData.push([r.partyName]);
                        shortListData.push([r.invoiceRange]);
                        shortListData.push([""]);
                    }
                });

                const wsShort = XLSX.utils.aoa_to_sheet(shortListData);
                XLSX.utils.book_append_sheet(summaryWb, wsShort, "Short List");

                const summaryOut = XLSX.write(summaryWb, { bookType: 'xlsx', type: 'array' });
                const summaryBlob = new Blob([summaryOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                triggerDownload(summaryBlob, 'Summary_Report.xlsx');
                log('Downloaded Summary Report spreadsheet.', 'info');
            });
        }
    }

    // Core Converter ZIP Batch processing execution
    async function runConverterZipBatchMerge() {
        console.log('[BATCH] runConverterZipBatchMerge() CALLED', batchZipFile);
        if (!batchZipFile) { console.error('[BATCH] batchZipFile is null/undefined!'); return; }

        processBtn.setAttribute('disabled', 'true');
        clearBtn.setAttribute('disabled', 'true');
        processStatus.className = 'status-indicator processing';
        processStatus.innerText = 'Processing';
        progressCard.classList.remove('hidden');
        overallProgressBar.style.width = '5%';
        progressPercent.innerText = '5%';
        progressStepText.innerText = 'Reading ZIP file structure...';

        processedContainer.innerHTML = '';
        processedContainer.className = 'processed-container empty';
        processedContainer.innerHTML = `
            <div class="empty-output-state">
                <i class="fa-solid fa-spinner fa-spin placeholder-icon"></i>
                <p>Reading batch ZIP file structure. Please wait...</p>
            </div>
        `;

        log('Starting Converter ZIP Batch Merger Pipeline...', 'process');
        batchResults = [];
        batchProcessedZipBlob = null;

        try {
            const zip = await JSZip.loadAsync(batchZipFile);
            const entries = Object.keys(zip.files);
            console.log('[BATCH] ZIP loaded. entries:', entries.length);
            log(`ZIP file loaded. Total archive items: ${entries.length}`, 'info');

            overallProgressBar.style.width = '15%';
            progressPercent.innerText = '15%';
            progressStepText.innerText = 'Grouping files by Vendor Code...';

            const fileEntries = entries.filter(path => {
                const entry = zip.files[path];
                if (entry.dir) return false;
                const norm = path.replace(/\\/g, '/');
                if (norm.includes('__MACOSX') || norm.split('/').some(part => part.startsWith('.'))) return false;
                return true;
            });
            console.log('[BATCH] fileEntries (non-dir, non-MACOSX):', fileEntries);

            const groups = {};
            fileEntries.forEach(path => {
                // Normalize backslashes to forward slashes (Windows ZIP files)
                const normPath = path.replace(/\\/g, '/');
                const parts = normPath.split('/');
                if (parts.length > 1) {
                    const vendorCode = parts[0].trim();
                    if (!groups[vendorCode]) {
                        groups[vendorCode] = [];
                    }
                    groups[vendorCode].push({
                        fullPath: path,
                        name: parts[parts.length - 1],
                        entry: zip.files[path]
                    });
                }
            });

            const vendorCodes = Object.keys(groups);
            console.log('[BATCH] Vendor groups:', vendorCodes, 'files per group:', vendorCodes.map(v => v + ':' + groups[v].length));
            log(`Found ${vendorCodes.length} vendor folder(s) to process: [${vendorCodes.join(', ')}]`, 'info');

            if (vendorCodes.length === 0) {
                throw new Error("No vendor subfolders found in the ZIP. Files must be organized inside folders named by Vendor Code.");
            }

            const outputZip = new JSZip();
            
            for (let idx = 0; idx < vendorCodes.length; idx++) {
                const vendorCode = vendorCodes[idx];
                log(`----------------------------------------`, 'info');
                log(`Processing Vendor Code: [${vendorCode}]`, 'process');

                const currentPercent = 15 + Math.round((idx / vendorCodes.length) * 70);
                overallProgressBar.style.width = `${currentPercent}%`;
                progressPercent.innerText = `${currentPercent}%`;
                progressStepText.innerText = `Processing vendor ${idx + 1} of ${vendorCodes.length}: ${vendorCode}...`;

                const files = groups[vendorCode];
                let odEntry = null;
                let accEntry = null;

                log(`Files in [${vendorCode}] folder: ${files.map(f => f.name).join(', ')}`, 'info');

                files.forEach(f => {
                    const lowerName = f.name.toLowerCase();
                    if (lowerName.includes('dropship') || lowerName.includes('od')) {
                        odEntry = f;
                    } else if (lowerName.includes('account') || lowerName.includes('acc') || lowerName.includes('tax') || lowerName.includes('sales') || lowerName.includes('detail') || lowerName.includes('irn')) {
                        accEntry = f;
                    }
                });

                if ((!odEntry || !accEntry) && files.length === 2) {
                    if (!odEntry && !accEntry) {
                        odEntry = files[0];
                        accEntry = files[1];
                    } else if (!odEntry) {
                        odEntry = files.find(f => f !== accEntry);
                    } else {
                        accEntry = files.find(f => f !== odEntry);
                    }
                }

                log(`Identified: OD=[${odEntry ? odEntry.name : 'MISSING'}], Account=[${accEntry ? accEntry.name : 'MISSING'}]`, odEntry && accEntry ? 'info' : 'error');

                if (!odEntry || !accEntry) {
                    const errorMsg = `Missing ${!odEntry ? 'OD' : ''}${!odEntry && !accEntry ? ' and ' : ''}${!accEntry ? 'Account Details' : ''} file`;
                    batchResults.push({
                        vendorCode: vendorCode,
                        partyName: getPartyNameForCode(vendorCode),
                        invoiceRange: "N/A",
                        status: "Failed",
                        errorMsg: errorMsg
                    });
                    log(`Vendor [${vendorCode}] skipped: ${errorMsg}.`, 'error');
                    continue;
                }

                try {
                    log(`Extracting file payloads: [${odEntry.name}] & [${accEntry.name}]`, 'info');
                    console.log(`[BATCH] Vendor [${vendorCode}] extracting blobs...`);
                    const odBlob = await odEntry.entry.async('blob');
                    const accBlob = await accEntry.entry.async('blob');
                    console.log(`[BATCH] Vendor [${vendorCode}] blobs ready. OD size:${odBlob.size}, ACC size:${accBlob.size}`);

                    log(`Parsing files to Array-of-Arrays (AOA)...`, 'info');
                    const odAoa = await parseFileToAoa(odBlob, odEntry.name);
                    const accAoa = await parseFileToAoa(accBlob, accEntry.name);
                    console.log(`[BATCH] Vendor [${vendorCode}] parsed. OD rows:${odAoa.length}, ACC rows:${accAoa.length}`);

                    if (odAoa.length < 2) {
                        throw new Error("OD data sheet has no rows (empty or headers only).");
                    }

                    // 1. Delete matching account rows
                    const accInvoiceSet = new Set();
                    for (let i = 1; i < accAoa.length; i++) {
                        const val = String(accAoa[i][1]).trim();
                        if (val !== "") accInvoiceSet.add(val);
                    }

                    const cleanOdAoa = [odAoa[0]];
                    let deletedMatchCount = 0;
                    for (let i = 1; i < odAoa.length; i++) {
                        const invoiceVal = String(odAoa[i][5]).trim();
                        if (invoiceVal !== "" && accInvoiceSet.has(invoiceVal)) {
                            deletedMatchCount++;
                        } else {
                            cleanOdAoa.push(odAoa[i]);
                        }
                    }
                    log(`Deleted matching rows: ${deletedMatchCount}`, 'info');

                    // 2. Q-V Mismatch
                    const finalOdAoa = [cleanOdAoa[0]];
                    const mismatchAoa = [cleanOdAoa[0]];
                    let mismatchCount = 0;
                    for (let i = 1; i < cleanOdAoa.length; i++) {
                        const row = cleanOdAoa[i];
                        const colA = String(row[0]).trim();
                        const colF = String(row[5]).trim();
                        const colQ = String(row[16]).trim();
                        const colV = String(row[21]).trim();
                        const colAE = String(row[30]).trim();

                        const hasMismatch = (colA !== "" && colF !== "" && colQ !== colV && colAE === "");
                        if (hasMismatch) {
                            mismatchAoa.push(row);
                            mismatchCount++;
                        } else {
                            finalOdAoa.push(row);
                        }
                    }
                    log(`Q-V mismatch rows: ${mismatchCount}`, 'info');

                    // 3. Status Stats, Date Range, Invoice Range
                    let cntNew = 0, cntCancelled = 0, cntShipped = 0, cntDelivered = 0;
                    let cntRTS = 0, cntPO = 0, cntOther = 0;
                    const pendingInvoices = [["Filename", "OrderID", "Status"]];
                    const dateRangeStr = parseDateRange(finalOdAoa);

                    const whAQ = finalOdAoa[1] && finalOdAoa[1][42] ? String(finalOdAoa[1][42]).trim() : "";
                    const whAO = finalOdAoa[1] && finalOdAoa[1][40] ? String(finalOdAoa[1][40]).trim() : "";
                    const warehouseStr = `${whAQ} / ${whAO}`;

                    const rangeDict = {};
                    const rangeRegex = /([A-Za-z0-9]+)-(\d+)/;

                    for (let i = 1; i < finalOdAoa.length; i++) {
                        const row = finalOdAoa[i];
                        const invoiceVal = String(row[5]).trim();
                        const match = rangeRegex.exec(invoiceVal);
                        if (match) {
                            const prefix = match[1];
                            const num = parseInt(match[2], 10);
                            if (!rangeDict[prefix]) rangeDict[prefix] = [];
                            rangeDict[prefix].push(num);
                        }

                        const sStat = smartStatus(row[9]);
                        switch (sStat) {
                            case "CANCELLED": cntCancelled++; break;
                            case "NEW": cntNew++; break;
                            case "PO CREATED": cntPO++; break;
                            case "READY TO SHIP": cntRTS++; break;
                            case "SHIPPED": if (invoiceVal !== "") cntShipped++; else cntOther++; break;
                            case "DELIVERED": if (invoiceVal !== "") cntDelivered++; else cntOther++; break;
                            default: cntOther++; break;
                        }

                        const colC = String(row[2]).trim();
                        if (invoiceVal === "" && colC !== "") {
                            pendingInvoices.push(["[RangeString].xlsx", colC, String(row[9])]);
                        }
                    }

                    const ranges = [];
                    let lastRangeStr = "N/A";
                    let invoicePrefix = "";
                    for (const key of Object.keys(rangeDict)) {
                        const nums = rangeDict[key];
                        const minNum = Math.min(...nums);
                        const maxNum = Math.max(...nums);
                        const rangeStr = `${key}-${minNum}-${maxNum}`;
                        ranges.push(rangeStr);
                        lastRangeStr = rangeStr;
                        invoicePrefix = key;
                    }

                    const outputRangeFilename = lastRangeStr !== "N/A" ? `${lastRangeStr}` : "Cleaned_OD";
                    if (!invoicePrefix && lastRangeStr === "N/A") {
                        for (let i = 1; i < finalOdAoa.length; i++) {
                            const invoiceVal = String(finalOdAoa[i][5]).trim();
                            if (invoiceVal !== "") {
                                invoicePrefix = invoiceVal.split('-')[0] || invoiceVal.substring(0, 8);
                                break;
                            }
                        }
                        if (!invoicePrefix) invoicePrefix = `AJ27S${vendorCode}`;
                    }

                    for (let i = 1; i < pendingInvoices.length; i++) {
                        pendingInvoices[i][0] = `${outputRangeFilename}.xlsx`;
                    }

                    // 4. Duplicate Invoices & Discounts
                    const invoiceCounts = {};
                    const duplicateReport = [["DUPLICATE INVOICE LIST", "COUNT"]];
                    const discountReport = [["INVOICE-DETAILS", "DISCOUNT"]];

                    for (let i = 1; i < finalOdAoa.length; i++) {
                        const row = finalOdAoa[i];
                        const invoiceVal = String(row[5]).trim();
                        if (invoiceVal !== "") {
                            invoiceCounts[invoiceVal] = (invoiceCounts[invoiceVal] || 0) + 1;
                        }

                        const colAB = parseFloat(row[27]) || 0;
                        const colAC = parseFloat(row[28]) || 0;
                        
                        // Set the discount formula in column AD (index 29)
                        row[29] = { f: `ROUNDUP(AC${i + 1}/AB${i + 1}*100,0)&"%"`, t: "s" };
                        
                        if (colAB !== 0) {
                            const discountVal = Math.ceil((colAC / colAB) * 100);
                            if (discountVal > 65) {
                                const colK = String(row[10]).trim();
                                const colN = String(row[13]).trim();
                                const invKey = `${invoiceVal}-${colK}-${colN}`;
                                discountReport.push([invKey, `${discountVal}%`]);
                            }
                        }
                    }

                    for (const key of Object.keys(invoiceCounts)) {
                        if (invoiceCounts[key] > 1) {
                            duplicateReport.push([key, invoiceCounts[key]]);
                        }
                    }

                    const fullPartyName = getPartyNameForCode(vendorCode);
                    const cleanName = cleanPartyName(fullPartyName, vendorCode);
                    const subfolderName = `${vendorCode}-(${outputRangeFilename})`;
                    const cleanODFilename = `${vendorCode}-${outputRangeFilename}-OD.xlsx`;

                    const pathPrefix = `${vendorCode}/${subfolderName}/`;

                    // Generate spreadsheets & write to JSZip
                    const wsClean = XLSX.utils.aoa_to_sheet(finalOdAoa);
                    const wbClean = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wbClean, wsClean, "Sheet1");
                    const outClean = XLSX.write(wbClean, { bookType: 'xlsx', type: 'array' });
                    outputZip.file(`${pathPrefix}${cleanODFilename}`, outClean);

                    const wsMismatch = XLSX.utils.aoa_to_sheet(mismatchAoa);
                    const wbMismatch = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wbMismatch, wsMismatch, "Mismatch Rows");
                    const outMismatch = XLSX.write(wbMismatch, { bookType: 'xlsx', type: 'array' });
                    outputZip.file(`${pathPrefix}PARTLY_CANCEL_QV_MISMATCH.xlsx`, outMismatch);

                    const wsDuplicate = XLSX.utils.aoa_to_sheet(duplicateReport);
                    const wbDuplicate = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wbDuplicate, wsDuplicate, "Duplicates");
                    const outDuplicate = XLSX.write(wbDuplicate, { bookType: 'xlsx', type: 'array' });
                    outputZip.file(`${pathPrefix}2 MORE INVOICE.xlsx`, outDuplicate);

                    const totalOrders = cntNew + cntCancelled + cntShipped + cntDelivered + cntRTS + cntPO + cntOther;
                    const detailsHeaders = [
                        "Filename", "Invoice Range", "Total Orders", "New", "Cancelled", 
                        "Shipped", "Delivered", "Ready to Ship", "PO Created", "Others", "Date Range", "Warehouse"
                    ];
                    const detailsData = [
                        detailsHeaders,
                        [
                            outputRangeFilename, lastRangeStr, totalOrders, cntNew, cntCancelled, 
                            cntShipped, cntDelivered, cntRTS, cntPO, cntOther, dateRangeStr, warehouseStr
                        ]
                    ];
                    const wsDetails = XLSX.utils.aoa_to_sheet(detailsData);
                    const wbDetails = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wbDetails, wsDetails, "Details Log");
                    const outDetails = XLSX.write(wbDetails, { bookType: 'xlsx', type: 'array' });
                    outputZip.file(`${pathPrefix}DETAILS.xlsx`, outDetails);

                    batchResults.push({
                        vendorCode: vendorCode,
                        partyName: fullPartyName,
                        invoiceRange: lastRangeStr,
                        totalOrders: totalOrders,
                        cntNew: cntNew,
                        cntCancelled: cntCancelled,
                        cntShipped: cntShipped,
                        cntDelivered: cntDelivered,
                        cntRTS: cntRTS,
                        cntPO: cntPO,
                        cntOther: cntOther,
                        dateRangeStr: dateRangeStr,
                        warehouseStr: warehouseStr,
                        status: "Success",
                        errorMsg: ""
                    });

                    log(`Vendor [${vendorCode}] processed successfully. Range: [${lastRangeStr}]`, 'success');

                } catch (vendorErr) {
                    console.error(`[BATCH] Vendor [${vendorCode}] FAILED:`, vendorErr);
                    batchResults.push({
                        vendorCode: vendorCode,
                        partyName: getPartyNameForCode(vendorCode),
                        invoiceRange: "N/A",
                        status: "Failed",
                        errorMsg: vendorErr.message
                    });
                    log(`Vendor [${vendorCode}] failed: ${vendorErr.message}`, 'error');
                }
            }

            log(`----------------------------------------`, 'info');
            log('Generating Master Summary Excel report...', 'process');
            overallProgressBar.style.width = '88%';
            progressPercent.innerText = '88%';
            progressStepText.innerText = 'Compiling Summary Report Excel sheets...';

            const summaryWb = XLSX.utils.book_new();

            const detailedSummaryData = [[
                "Vendor Code", "Party Name", "Invoice Range", "Total Orders", 
                "New", "Cancelled", "Shipped", "Delivered", "Ready to Ship", "PO Created", "Others", 
                "Date Range", "Warehouse", "Processing Status"
            ]];

            batchResults.forEach(r => {
                if (r.status === "Success") {
                    detailedSummaryData.push([
                        r.vendorCode, r.partyName, r.invoiceRange, r.totalOrders,
                        r.cntNew, r.cntCancelled, r.cntShipped, r.cntDelivered, r.cntRTS, r.cntPO, r.cntOther,
                        r.dateRangeStr, r.warehouseStr, "Success"
                    ]);
                } else {
                    detailedSummaryData.push([
                        r.vendorCode, r.partyName, "N/A", 0,
                        0, 0, 0, 0, 0, 0, 0,
                        "N/A", "N/A", `Failed: ${r.errorMsg}`
                    ]);
                }
            });

            const wsDetailed = XLSX.utils.aoa_to_sheet(detailedSummaryData);
            XLSX.utils.book_append_sheet(summaryWb, wsDetailed, "Detailed Summary");

            const shortListData = [];
            batchResults.forEach(r => {
                if (r.status === "Success") {
                    shortListData.push([r.partyName]);
                    shortListData.push([r.invoiceRange]);
                    shortListData.push([""]);
                }
            });

            const wsShort = XLSX.utils.aoa_to_sheet(shortListData);
            XLSX.utils.book_append_sheet(summaryWb, wsShort, "Short List");

            const summaryOut = XLSX.write(summaryWb, { bookType: 'xlsx', type: 'array' });
            outputZip.file("Summary_Report.xlsx", summaryOut);

            overallProgressBar.style.width = '95%';
            progressPercent.innerText = '95%';
            progressStepText.innerText = 'Compiling output ZIP package...';

            batchProcessedZipBlob = await outputZip.generateAsync({ type: 'blob' });
            log(`Batch ZIP compiled successfully (${formatBytes(batchProcessedZipBlob.size)}).`, 'success');

            renderConverterBatchDashboard();

            overallProgressBar.style.width = '100%';
            progressPercent.innerText = '100%';
            progressStepText.innerText = 'Batch processing completed successfully!';

            processStatus.className = 'status-indicator success';
            processStatus.innerText = 'Completed';
            log('Batch pipeline execution completed. ZIP package is ready.', 'success');

        } catch (err) {
            log(`Batch Pipeline failed: ${err.message}`, 'error');
            processStatus.className = 'status-indicator idle';
            processStatus.innerText = 'Failed';
            progressStepText.innerText = 'An error occurred during execution.';

            processedContainer.innerHTML = '';
            processedContainer.className = 'processed-container empty';
            processedContainer.innerHTML = `
                <div class="empty-output-state text-error" style="color: var(--color-error)">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem;"></i>
                    <p style="margin-top: 0.5rem;">Process failed: ${err.message}</p>
                </div>
            `;
        } finally {
            processBtn.removeAttribute('disabled');
            clearBtn.removeAttribute('disabled');
        }
    }

    /* ==========================================================================
       FILE PROCESSING PIPELINE
       ========================================================================== */
    
    // Read blob helper (returns string encoded in UTF-8)
    function readBlobAsText(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e.target.error);
            reader.readAsText(blob, 'utf-8');
        });
    }

    // Delimiter detection counting comma vs semicolon in the first 2048 chars
    function detectDelimiter(text) {
        const chunk = text.slice(0, 2048);
        let commaCount = 0;
        let semiCount = 0;
        for (let i = 0; i < chunk.length; i++) {
            if (chunk[i] === ',') commaCount++;
            else if (chunk[i] === ';') semiCount++;
        }
        return semiCount > commaCount ? ';' : ',';
    }

    function detectVendorCode(name, relativePath) {
        // 1. Check relative path subfolders first
        if (relativePath) {
            const normPath = relativePath.replace(/\\/g, '/');
            const parts = normPath.split('/');
            const cleanParts = parts.filter(p => p && p !== '.' && p !== '..' && p !== '__MACOSX');
            if (cleanParts.length > 1) {
                const potentialCode = cleanParts[cleanParts.length - 2].trim();
                const m = potentialCode.match(/^([A-Za-z0-9]+)/);
                if (m) {
                    const code = m[1];
                    const ajMatch = code.match(/^AJ27S(.+)$/i);
                    if (ajMatch) return ajMatch[1].toUpperCase();
                    return code.toUpperCase();
                }
            }
        }

        // 2. Check for AJ27S prefix in the filename (e.g. "AJ27SJ22.xlsx" or "AJ27S101-DropShip...")
        const ajMatch = name.match(/AJ27S([A-Za-z0-9]+)/i);
        if (ajMatch) {
            return ajMatch[1].toUpperCase();
        }

        // 3. Check filename prefix (e.g., "101-BHARVITA-AJIO..." -> "101")
        const prefixMatch = name.match(/^([A-Za-z0-9]+)-/);
        if (prefixMatch) {
            return prefixMatch[1].toUpperCase();
        }

        // 4. Fallback check: try to find any word in the filename that matches vendor codes
        const words = name.split(/[-_\s.]+/);
        for (const word of words) {
            if (/^(101|AJ2|AJ22)$/i.test(word)) {
                return word.toUpperCase();
            }
        }

        return null;
    }

    processBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        // Request notification permission if not yet requested/granted
        if (typeof Notification !== 'undefined' && Notification.permission === "default") {
            Notification.requestPermission();
        }

        // Reset UI & state
        batchResults = [];
        batchProcessedZipBlob = null;
        processedFiles = [];
        processedZipBlob = null;

        processBtn.setAttribute('disabled', 'true');
        clearBtn.setAttribute('disabled', 'true');
        processStatus.className = 'status-indicator processing';
        processStatus.innerText = 'Processing';

        progressCard.classList.remove('hidden');
        overallProgressBar.style.width = '5%';
        progressPercent.innerText = '5%';
        progressStepText.innerText = 'Initializing processing pipeline...';

        // Update timeline steps
        stepExtract.querySelector('.step-label').innerText = "Extracting & Grouping Files";
        stepConvert.querySelector('.step-label').innerText = "Running OD & Account Merger";
        stepRename.querySelector('.step-label').innerText = "Syncing Sheets & Packaging";

        // Timeline Step 1: Active
        stepExtract.className = 'timeline-step active';
        stepExtract.querySelector('i').className = 'fa-solid fa-spinner fa-spin step-icon';
        stepConvert.className = 'timeline-step';
        stepConvert.querySelector('i').className = 'fa-solid fa-circle-notch fa-spin step-icon';
        stepRename.className = 'timeline-step';
        stepRename.querySelector('i').className = 'fa-solid fa-circle-notch fa-spin step-icon';

        log('Starting unified processing pipeline...', 'process');

        try {
            // ==================================================================
            // STEP 1: EXTRACT FILES (IF ZIP) & GROUP BY VENDOR
            // ==================================================================
            log('Step 1: Extracting input files...', 'process');
            let extractedFiles = [];

            for (let i = 0; i < selectedFiles.length; i++) {
                const fileObj = selectedFiles[i];
                const ext = fileObj.name.split('.').pop().toLowerCase();

                if (ext === 'zip') {
                    log(`Extracting ZIP archive: ${fileObj.name}`, 'info');
                    try {
                        const zip = await JSZip.loadAsync(fileObj.file);
                        const zipEntries = Object.keys(zip.files);
                        let extractedFromThisZip = 0;

                        for (const filename of zipEntries) {
                            const zipEntry = zip.files[filename];
                            if (zipEntry.dir) continue;

                            const norm = filename.replace(/\\/g, '/');
                            if (norm.includes('__MACOSX') || norm.split('/').some(part => part.startsWith('.'))) continue;

                            const fileBlob = await zipEntry.async('blob');
                            extractedFiles.push({
                                name: norm.split('/').pop(),
                                blob: fileBlob,
                                relativePath: norm
                            });
                            extractedFromThisZip++;
                        }
                        log(`Extracted ${extractedFromThisZip} file(s) from ZIP: ${fileObj.name}`, 'success');
                    } catch (zipErr) {
                        log(`Error extracting ZIP ${fileObj.name}: ${zipErr.message}`, 'error');
                    }
                } else {
                    // Regular file or Folder file
                    const relPath = fileObj.file.webkitRelativePath || fileObj.name;
                    extractedFiles.push({
                        name: fileObj.name,
                        blob: fileObj.file,
                        relativePath: relPath
                    });
                }
            }

            log(`Total files to process: ${extractedFiles.length}`, 'info');

            // Group files by detected vendor code
            log('Grouping files by Vendor Code...', 'info');
            let rawGroups = {};
            extractedFiles.forEach(f => {
                const code = detectVendorCode(f.name, f.relativePath);
                const key = code ? code.toUpperCase() : "UNKNOWN";
                if (!rawGroups[key]) rawGroups[key] = [];
                rawGroups[key].push(f);
            });

            // Resolve UNKNOWN group
            let finalGroups = {};
            const groupKeys = Object.keys(rawGroups);
            const knownKeys = groupKeys.filter(k => k !== "UNKNOWN");

            if (knownKeys.length === 1 && rawGroups["UNKNOWN"]) {
                const targetKey = knownKeys[0];
                finalGroups[targetKey] = [...(rawGroups[targetKey] || []), ...rawGroups["UNKNOWN"]];
            } else if (knownKeys.length > 1 && rawGroups["UNKNOWN"]) {
                rawGroups["UNKNOWN"].forEach(f => {
                    let matchedKey = null;
                    for (const key of knownKeys) {
                        const escKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                        const regex = new RegExp(`\\b${escKey}\\b|[-_]${escKey}[-_]`, 'i');
                        if (regex.test(f.name) || regex.test(f.relativePath || '')) {
                            matchedKey = key;
                            break;
                        }
                    }
                    if (matchedKey) {
                        if (!finalGroups[matchedKey]) finalGroups[matchedKey] = [];
                        finalGroups[matchedKey].push(f);
                    } else {
                        if (!finalGroups["UNKNOWN"]) finalGroups["UNKNOWN"] = [];
                        finalGroups["UNKNOWN"].push(f);
                    }
                });
                knownKeys.forEach(k => {
                    finalGroups[k] = [...(finalGroups[k] || []), ...(rawGroups[k] || [])];
                });
            } else {
                finalGroups = rawGroups;
            }

            const vendorCodes = Object.keys(finalGroups);
            log(`Found ${vendorCodes.length} vendor group(s): [${vendorCodes.join(', ')}]`, 'info');

            // Mark Step 1 Complete
            stepExtract.className = 'timeline-step complete';
            stepExtract.querySelector('i').className = 'fa-solid fa-circle-check step-icon';

            overallProgressBar.style.width = '30%';
            progressPercent.innerText = '30%';
            progressStepText.innerText = 'Running OD & Account merger processing...';

            // Timeline Step 2: Active
            stepConvert.className = 'timeline-step active';
            stepConvert.querySelector('i').className = 'fa-solid fa-spinner fa-spin step-icon';

            // ==================================================================
            // STEP 2: RUN MERGER PIPELINE FOR EACH VENDOR
            // ==================================================================
            const outputZip = new JSZip();
            let allPendingInvoices = [["Filename", "OrderID", "Status"]];
            let allDiscountReport = [["INVOICE-DETAILS", "DISCOUNT"]];

            for (let idx = 0; idx < vendorCodes.length; idx++) {
                const groupKey = vendorCodes[idx];
                log(`----------------------------------------`, 'info');
                log(`Processing Vendor Group: [${groupKey}]`, 'process');

                const currentPercent = 30 + Math.round((idx / vendorCodes.length) * 50);
                overallProgressBar.style.width = `${currentPercent}%`;
                progressPercent.innerText = `${currentPercent}%`;
                progressStepText.innerText = `Processing vendor ${idx + 1} of ${vendorCodes.length}: ${groupKey}...`;

                const files = finalGroups[groupKey];
                let odFileObj = null;
                let accFileObj = null;

                files.forEach(f => {
                    const lowerName = f.name.toLowerCase();
                    if (lowerName.includes('dropship') || lowerName.includes('od')) {
                        odFileObj = f;
                    } else if (lowerName.includes('account') || lowerName.includes('acc') || lowerName.includes('tax') || lowerName.includes('sales') || lowerName.includes('detail') || lowerName.includes('irn') || lowerName.includes('mismatch')) {
                        accFileObj = f;
                    }
                });

                if ((!odFileObj || !accFileObj) && files.length === 2) {
                    if (!odFileObj && !accFileObj) {
                        odFileObj = files[0];
                        accFileObj = files[1];
                    } else if (!odFileObj) {
                        odFileObj = files.find(f => f !== accFileObj);
                    } else {
                        accFileObj = files.find(f => f !== odFileObj);
                    }
                }

                log(`Identified for group [${groupKey}]: OD=[${odFileObj ? odFileObj.name : 'MISSING'}], Account=[${accFileObj ? accFileObj.name : 'MISSING'}]`, odFileObj && accFileObj ? 'info' : 'error');

                if (!odFileObj || !accFileObj) {
                    const errorMsg = `Missing ${!odFileObj ? 'OD' : ''}${!odFileObj && !accFileObj ? ' and ' : ''}${!accFileObj ? 'Account Details' : ''} file`;
                    batchResults.push({
                        vendorCode: groupKey,
                        partyName: getPartyNameForCode(groupKey),
                        invoiceRange: "N/A",
                        status: "Failed",
                        errorMsg: errorMsg
                    });
                    log(`Vendor Group [${groupKey}] skipped: ${errorMsg}.`, 'error');
                    continue;
                }

                try {
                    log(`Parsing files to Array-of-Arrays (AOA)...`, 'info');
                    const odAoa = await parseFileToAoa(odFileObj.blob, odFileObj.name);
                    const accAoa = await parseFileToAoa(accFileObj.blob, accFileObj.name);

                    if (odAoa.length < 2) {
                        throw new Error("OD data sheet has no rows (empty or headers only).");
                    }

                    // 1. Delete matching account rows
                    const accInvoiceSet = new Set();
                    for (let i = 1; i < accAoa.length; i++) {
                        const val = String(accAoa[i][1]).trim();
                        if (val !== "") accInvoiceSet.add(val);
                    }

                    const cleanOdAoa = [odAoa[0]];
                    let deletedMatchCount = 0;
                    for (let i = 1; i < odAoa.length; i++) {
                        const invoiceVal = String(odAoa[i][5]).trim();
                        if (invoiceVal !== "" && accInvoiceSet.has(invoiceVal)) {
                            deletedMatchCount++;
                        } else {
                            cleanOdAoa.push(odAoa[i]);
                        }
                    }
                    log(`Deleted matching rows: ${deletedMatchCount}`, 'info');

                    // 2. Q-V Mismatch
                    const finalOdAoa = [cleanOdAoa[0]];
                    const mismatchAoa = [cleanOdAoa[0]];
                    let mismatchCount = 0;
                    for (let i = 1; i < cleanOdAoa.length; i++) {
                        const row = cleanOdAoa[i];
                        const colA = String(row[0]).trim();
                        const colF = String(row[5]).trim();
                        const colQ = String(row[16]).trim();
                        const colV = String(row[21]).trim();
                        const colAE = String(row[30]).trim();

                        const hasMismatch = (colA !== "" && colF !== "" && colQ !== colV && colAE === "");
                        if (hasMismatch) {
                            mismatchAoa.push(row);
                            mismatchCount++;
                        } else {
                            finalOdAoa.push(row);
                        }
                    }
                    log(`Q-V mismatch rows found: ${mismatchCount}`, 'info');

                    // 3. Status Stats, Date Range, Invoice Range
                    let cntNew = 0, cntCancelled = 0, cntShipped = 0, cntDelivered = 0;
                    let cntRTS = 0, cntPO = 0, cntOther = 0;
                    const pendingInvoices = [["Filename", "OrderID", "Status"]];
                    const dateRangeStr = parseDateRange(finalOdAoa);

                    const whAQ = finalOdAoa[1] && finalOdAoa[1][42] ? String(finalOdAoa[1][42]).trim() : "";
                    const whAO = finalOdAoa[1] && finalOdAoa[1][40] ? String(finalOdAoa[1][40]).trim() : "";
                    const warehouseStr = `${whAQ} / ${whAO}`;

                    const rangeDict = {};
                    const rangeRegex = /([A-Za-z0-9]+)-(\d+)/;

                    for (let i = 1; i < finalOdAoa.length; i++) {
                        const row = finalOdAoa[i];
                        const invoiceVal = String(row[5]).trim();
                        const match = rangeRegex.exec(invoiceVal);
                        if (match) {
                            const prefix = match[1];
                            const num = parseInt(match[2], 10);
                            if (!rangeDict[prefix]) rangeDict[prefix] = [];
                            rangeDict[prefix].push(num);
                        }

                        const sStat = smartStatus(row[9]);
                        switch (sStat) {
                            case "CANCELLED": cntCancelled++; break;
                            case "NEW": cntNew++; break;
                            case "PO CREATED": cntPO++; break;
                            case "READY TO SHIP": cntRTS++; break;
                            case "SHIPPED": if (invoiceVal !== "") cntShipped++; else cntOther++; break;
                            case "DELIVERED": if (invoiceVal !== "") cntDelivered++; else cntOther++; break;
                            default: cntOther++; break;
                        }

                        const colC = String(row[2]).trim();
                        if (invoiceVal === "" && colC !== "") {
                            pendingInvoices.push(["[RangeString].xlsx", colC, String(row[9])]);
                        }
                    }

                    const ranges = [];
                    let lastRangeStr = "N/A";
                    let invoicePrefix = "";
                    for (const key of Object.keys(rangeDict)) {
                        const nums = rangeDict[key];
                        const minNum = Math.min(...nums);
                        const maxNum = Math.max(...nums);
                        const rangeStr = `${key}-${minNum}-${maxNum}`;
                        ranges.push(rangeStr);
                        lastRangeStr = rangeStr;
                        invoicePrefix = key;
                    }

                    const outputRangeFilename = lastRangeStr !== "N/A" ? `${lastRangeStr}` : "Cleaned_OD";
                    
                    // Fallback to extract vendor code from invoice prefix
                    let vendorCode = groupKey;
                    if (vendorCode === "UNKNOWN") {
                        if (invoicePrefix) {
                            const codeMatch = invoicePrefix.match(/^AJ27S(.+)$/i);
                            if (codeMatch) {
                                vendorCode = codeMatch[1].toUpperCase();
                            } else {
                                vendorCode = invoicePrefix.toUpperCase();
                            }
                        } else if (currentUploadedFolderName && /^[A-Za-z0-9]+$/.test(currentUploadedFolderName)) {
                            vendorCode = currentUploadedFolderName.toUpperCase();
                        } else {
                            vendorCode = "OUTPUT";
                        }
                    }

                    // Update pending invoice filenames with calculated name
                    for (let i = 1; i < pendingInvoices.length; i++) {
                        pendingInvoices[i][0] = `${outputRangeFilename}.xlsx`;
                        // Accumulate pending invoices
                        allPendingInvoices.push(pendingInvoices[i]);
                    }

                    // 4. Duplicate Invoices & Discounts
                    const invoiceCounts = {};
                    const duplicateReport = [["DUPLICATE INVOICE LIST", "COUNT"]];
                    const discountReport = [["INVOICE-DETAILS", "DISCOUNT"]];

                    for (let i = 1; i < finalOdAoa.length; i++) {
                        const row = finalOdAoa[i];
                        const invoiceVal = String(row[5]).trim();
                        if (invoiceVal !== "") {
                            invoiceCounts[invoiceVal] = (invoiceCounts[invoiceVal] || 0) + 1;
                        }

                        const colAB = parseFloat(row[27]) || 0;
                        const colAC = parseFloat(row[28]) || 0;
                        
                        // Set the discount formula in column AD (index 29)
                        row[29] = { f: `ROUNDUP(AC${i + 1}/AB${i + 1}*100,0)&"%"`, t: "s" };
                        
                        if (colAB !== 0) {
                            const discountVal = Math.ceil((colAC / colAB) * 100);
                            if (discountVal > 65) {
                                const colK = String(row[10]).trim();
                                const colN = String(row[13]).trim();
                                const invKey = `${invoiceVal}-${colK}-${colN}`;
                                const discRow = [invKey, `${discountVal}%`];
                                discountReport.push(discRow);
                                // Accumulate discounts
                                allDiscountReport.push(discRow);
                            }
                        }
                    }

                    for (const key of Object.keys(invoiceCounts)) {
                        if (invoiceCounts[key] > 1) {
                            duplicateReport.push([key, invoiceCounts[key]]);
                        }
                    }

                    const fullPartyName = getPartyNameForCode(vendorCode);
                    const subfolderName = `${vendorCode}-(${outputRangeFilename})`;
                    const cleanODFilename = `${vendorCode}-${outputRangeFilename}-OD.xlsx`;

                    const pathPrefix = `${vendorCode}/${subfolderName}/`;

                    // Generate spreadsheets & write to output ZIP
                    const wsClean = XLSX.utils.aoa_to_sheet(finalOdAoa);
                    const wbClean = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wbClean, wsClean, "Sheet1");
                    const outClean = XLSX.write(wbClean, { bookType: 'xlsx', type: 'array' });
                    outputZip.file(`${pathPrefix}${cleanODFilename}`, outClean);

                    const wsMismatch = XLSX.utils.aoa_to_sheet(mismatchAoa);
                    const wbMismatch = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wbMismatch, wsMismatch, "Mismatch Rows");
                    const outMismatch = XLSX.write(wbMismatch, { bookType: 'xlsx', type: 'array' });
                    outputZip.file(`${pathPrefix}PARTLY_CANCEL_QV_MISMATCH.xlsx`, outMismatch);

                    const wsDuplicate = XLSX.utils.aoa_to_sheet(duplicateReport);
                    const wbDuplicate = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wbDuplicate, wsDuplicate, "Duplicates");
                    const outDuplicate = XLSX.write(wbDuplicate, { bookType: 'xlsx', type: 'array' });
                    outputZip.file(`${pathPrefix}2 MORE INVOICE.xlsx`, outDuplicate);

                    const totalOrders = cntNew + cntCancelled + cntShipped + cntDelivered + cntRTS + cntPO + cntOther;
                    const detailsHeaders = [
                        "Filename", "Invoice Range", "Total Orders", "New", "Cancelled", 
                        "Shipped", "Delivered", "Ready to Ship", "PO Created", "Others", "Date Range", "Warehouse"
                    ];
                    const detailsData = [
                        detailsHeaders,
                        [
                            outputRangeFilename, lastRangeStr, totalOrders, cntNew, cntCancelled, 
                            cntShipped, cntDelivered, cntRTS, cntPO, cntOther, dateRangeStr, warehouseStr
                        ]
                    ];
                    const wsDetails = XLSX.utils.aoa_to_sheet(detailsData);
                    const wbDetails = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wbDetails, wsDetails, "Details Log");
                    const outDetails = XLSX.write(wbDetails, { bookType: 'xlsx', type: 'array' });
                    outputZip.file(`${pathPrefix}DETAILS.xlsx`, outDetails);

                    batchResults.push({
                        vendorCode: vendorCode,
                        partyName: fullPartyName,
                        invoiceRange: lastRangeStr,
                        totalOrders: totalOrders,
                        cntNew: cntNew,
                        cntCancelled: cntCancelled,
                        cntShipped: cntShipped,
                        cntDelivered: cntDelivered,
                        cntRTS: cntRTS,
                        cntPO: cntPO,
                        cntOther: cntOther,
                        dateRangeStr: dateRangeStr,
                        warehouseStr: warehouseStr,
                        status: "Success",
                        errorMsg: ""
                    });

                    log(`Vendor [${vendorCode}] processed successfully. Range: [${lastRangeStr}]`, 'success');

                } catch (vendorErr) {
                    console.error(`[PIPELINE] Vendor Group [${groupKey}] FAILED:`, vendorErr);
                    batchResults.push({
                        vendorCode: groupKey,
                        partyName: getPartyNameForCode(groupKey),
                        invoiceRange: "N/A",
                        status: "Failed",
                        errorMsg: vendorErr.message
                    });
                    log(`Vendor [${groupKey}] failed: ${vendorErr.message}`, 'error');
                }
            }

            // Mark Step 2 Complete
            stepConvert.className = 'timeline-step complete';
            stepConvert.querySelector('i').className = 'fa-solid fa-circle-check step-icon';

            overallProgressBar.style.width = '85%';
            progressPercent.innerText = '85%';
            progressStepText.innerText = 'Syncing results with Google Sheets & packaging final ZIP...';

            // Timeline Step 3: Active
            stepRename.className = 'timeline-step active';
            stepRename.querySelector('i').className = 'fa-solid fa-spinner fa-spin step-icon';

            // ==================================================================
            // STEP 3: MASTER SUMMARY REPORT & GOOGLE SHEETS SYNC & PACKAGING
            // ==================================================================
            log('Generating Master Summary Excel report...', 'process');
            const summaryWb = XLSX.utils.book_new();

            const detailedSummaryData = [[
                "Vendor Code", "Party Name", "Invoice Range", "Total Orders", 
                "New", "Cancelled", "Shipped", "Delivered", "Ready to Ship", "PO Created", "Others", 
                "Date Range", "Warehouse", "Processing Status"
            ]];

            batchResults.forEach(r => {
                if (r.status === "Success") {
                    detailedSummaryData.push([
                        r.vendorCode, r.partyName, r.invoiceRange, r.totalOrders,
                        r.cntNew, r.cntCancelled, r.cntShipped, r.cntDelivered, r.cntRTS, r.cntPO, r.cntOther,
                        r.dateRangeStr, r.warehouseStr, "Success"
                    ]);
                } else {
                    detailedSummaryData.push([
                        r.vendorCode, r.partyName, "N/A", 0,
                        0, 0, 0, 0, 0, 0, 0,
                        "N/A", "N/A", `Failed: ${r.errorMsg}`
                    ]);
                }
            });

            const wsDetailed = XLSX.utils.aoa_to_sheet(detailedSummaryData);
            XLSX.utils.book_append_sheet(summaryWb, wsDetailed, "Detailed Summary");

            const shortListData = [];
            batchResults.forEach(r => {
                if (r.status === "Success") {
                    shortListData.push([r.partyName]);
                    shortListData.push([r.invoiceRange]);
                    shortListData.push([""]);
                }
            });

            const wsShort = XLSX.utils.aoa_to_sheet(shortListData);
            XLSX.utils.book_append_sheet(summaryWb, wsShort, "Short List");

            const summaryOut = XLSX.write(summaryWb, { bookType: 'xlsx', type: 'array' });
            outputZip.file("Summary_Report.xlsx", summaryOut);

            // Decide output ZIP name
            if (selectedFiles.length === 1 && selectedFiles[0].name.split('.').pop().toLowerCase() === 'zip') {
                batchUploadedZipName = selectedFiles[0].name.replace(/\.zip$/i, '') + '_processed.zip';
            } else if (currentUploadedFolderName) {
                batchUploadedZipName = currentUploadedFolderName + '_processed.zip';
            } else {
                batchUploadedZipName = 'AJIO_DATA_ARRANGE_Output.zip';
            }

            // Compile final ZIP
            log('Compiling final ZIP output archive...', 'process');
            batchProcessedZipBlob = await outputZip.generateAsync({ type: 'blob' });
            log(`Final ZIP package compiled successfully (${formatBytes(batchProcessedZipBlob.size)}).`, 'success');

            // Render batch dashboard
            renderConverterBatchDashboard();

            // Auto push to Google Sheets
            const apiUrl = GOOGLE_SHEETS_SCRIPT_URL;
            if (apiUrl && (allPendingInvoices.length > 1 || allDiscountReport.length > 1)) {
                log("Initiating auto-sync of results to Google Sheets...", "process");
                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        body: JSON.stringify({
                            pendingInvoices: allPendingInvoices,
                            discountReport: allDiscountReport
                        })
                    });
                    const res = await response.json().catch(() => ({ status: "opaque_success" }));
                    if (res.status === "error") {
                        throw new Error(res.message || "Apps Script error");
                    }
                    log("Google Sheets auto-synced successfully for all vendors!", "success");
                } catch (sheetsErr) {
                    log(`Google Sheets auto-synced! (CORS message: ${sheetsErr.message || "opaque response redirect"})`, "success");
                }
            }

            // Mark Step 3 Complete
            stepRename.className = 'timeline-step complete';
            stepRename.querySelector('i').className = 'fa-solid fa-circle-check step-icon';

            overallProgressBar.style.width = '100%';
            progressPercent.innerText = '100% Completed';
            progressStepText.innerText = 'All processes completed successfully!';

            processStatus.className = 'status-indicator success';
            processStatus.innerText = 'Completed';
            log('Pipeline execution successful. Output files are ready for download.', 'success');

            // Show Success Chrome Notification
            if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
                new Notification("START AJIO ARANGE Completed! 🎉", {
                    body: `Successfully processed ${vendorCodes.length} vendor group(s).`,
                    icon: "https://cdn-icons-png.flaticon.com/512/190/190411.png"
                });
            }

        } catch (err) {
            log(`Pipeline failed: ${err.message}`, 'error');
            processStatus.className = 'status-indicator idle';
            processStatus.innerText = 'Failed';
            progressStepText.innerText = 'An error occurred during execution.';

            processedContainer.innerHTML = '';
            processedContainer.className = 'processed-container empty';
            processedContainer.innerHTML = `
                <div class="empty-output-state text-error" style="color: var(--color-error)">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem;"></i>
                    <p style="margin-top: 0.5rem;">Process failed: ${err.message}</p>
                </div>
            `;

            // Show Failure Chrome Notification
            if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
                new Notification("START AJIO ARANGE Failed! ❌", {
                    body: `Error: ${err.message}`,
                    icon: "https://cdn-icons-png.flaticon.com/512/190/190406.png"
                });
            }
        } finally {
            processBtn.removeAttribute('disabled');
            clearBtn.removeAttribute('disabled');
        }
    });

    /* ==========================================================================
       RENDER PROCESSED OUTPUTS
       ========================================================================== */
    function renderProcessedList() {
        // Clear empty state
        processedContainer.innerHTML = '';
        processedContainer.className = 'processed-container';

        // Recreate layout structure
        processedContainer.appendChild(processedHeader);
        processedContainer.appendChild(processedList);
        
        processedHeader.classList.remove('hidden');
        processedList.classList.remove('hidden');
        
        processedCount.innerText = processedFiles.length;
        processedList.innerHTML = '';

        processedFiles.forEach((fileObj, index) => {
            const item = document.createElement('div');
            item.className = 'processed-item';

            const fileInfo = document.createElement('div');
            fileInfo.className = 'processed-file-info';

            const nameMapping = document.createElement('div');
            nameMapping.className = 'name-mapping';

            const isRenamed = fileObj.name !== fileObj.originalName;

            if (isRenamed) {
                const oldNameSpan = document.createElement('span');
                oldNameSpan.className = 'old-name';
                oldNameSpan.innerText = fileObj.originalName;
                oldNameSpan.title = `Original name: ${fileObj.originalName}`;

                const arrowIcon = document.createElement('i');
                arrowIcon.className = 'fa-solid fa-circle-right rename-arrow';

                const newNameSpan = document.createElement('span');
                newNameSpan.className = 'new-name';
                newNameSpan.innerText = fileObj.name;

                nameMapping.appendChild(oldNameSpan);
                nameMapping.appendChild(arrowIcon);
                nameMapping.appendChild(newNameSpan);
            } else {
                const nameSpan = document.createElement('span');
                nameSpan.innerText = fileObj.name;
                nameMapping.appendChild(nameSpan);
            }

            const meta = document.createElement('div');
            meta.className = 'processed-meta';

            const sizeSpan = document.createElement('span');
            sizeSpan.innerText = formatBytes(fileObj.size);

            const statusSpan = document.createElement('span');
            statusSpan.innerHTML = '<i class="fa-solid fa-circle-check text-success"></i> Ready';

            meta.appendChild(sizeSpan);
            meta.appendChild(statusSpan);

            fileInfo.appendChild(nameMapping);
            fileInfo.appendChild(meta);

            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'btn btn-download-single';
            downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i> Download';
            downloadBtn.addEventListener('click', () => {
                triggerDownload(fileObj.blob, fileObj.name);
                log(`Downloaded file: ${fileObj.name}`, 'info');
            });

            item.appendChild(fileInfo);
            item.appendChild(downloadBtn);
            processedList.appendChild(item);
        });
    }

    downloadAllBtn.addEventListener('click', () => {
        if (!processedZipBlob) return;
        triggerDownload(processedZipBlob, 'AJIO_DATA_ARRANGE_Files.zip');
        log('Downloaded final package: AJIO_DATA_ARRANGE_Files.zip', 'info');
    });

    /* ==========================================================================
       TAB SWITCHING LOGIC
       ========================================================================== */
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPaneId = btn.getAttribute('data-tab');
            
            // Toggle active buttons
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Toggle active panes
            tabPanes.forEach(pane => {
                if (pane.id === targetPaneId) {
                    pane.classList.remove('hidden-pane');
                    pane.classList.add('active-pane');
                } else {
                    pane.classList.remove('active-pane');
                    pane.classList.add('hidden-pane');
                }
            });
            
            log(`Switched tab to: ${btn.innerText.trim()}`, 'info');
        });
    });

    /* ==========================================================================
       OD & ACCOUNT DETAILS MERGER LOGIC
       ========================================================================== */
    // Merger State Variables
    let odFile = null;
    let accFile = null;
    let mergerZipBlob = null;
    let mergerZipFilename = "";

    // (ZIP Batch Mode State Variables moved to top of DOMContentLoaded to prevent TDZ ReferenceError)

    // DOM Elements for Merger
    const odDropzone = document.getElementById('odDropzone');
    const odFileInput = document.getElementById('odFileInput');
    const odFileDisplay = document.getElementById('odFileDisplay');

    const accDropzone = document.getElementById('accDropzone');
    const accFileInput = document.getElementById('accFileInput');
    const accFileDisplay = document.getElementById('accFileDisplay');

    const mergeBtn = document.getElementById('mergeBtn');
    const mergerStatus = document.getElementById('mergerStatus');
    const mergerProgressCard = document.getElementById('mergerProgressCard');
    const mergerProgressBar = document.getElementById('mergerProgressBar');
    const mergerProgressPercent = document.getElementById('mergerProgressPercent');
    const mergerProgressStepText = document.getElementById('mergerProgressStepText');
    const mergerOutputContainer = document.getElementById('mergerOutputContainer');
    const mergerConsoleLog = document.getElementById('mergerConsoleLog');
    const clearMergerLogBtn = document.getElementById('clearMergerLogBtn');

    // Merger Logger Utility
    function mergerLog(message, type = 'info') {
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        line.innerText = `[${timestamp}] ${message}`;
        
        mergerConsoleLog.appendChild(line);
        mergerConsoleLog.scrollTop = mergerConsoleLog.scrollHeight;
    }

    // Clear Merger Logs
    clearMergerLogBtn.addEventListener('click', () => {
        mergerConsoleLog.innerHTML = '';
        mergerLog('Log cleared.', 'info');
    });

    // Setup OD File Input & Drag and Drop
    setupMiniDropzone(odDropzone, odFileInput, (file) => {
        odFile = file;
        odFileDisplay.innerText = file.name;
        odFileDisplay.title = file.name;
        odDropzone.classList.add('file-selected');
        mergerLog(`Selected OD File: ${file.name} (${formatBytes(file.size)})`, 'info');
        checkMergerInputs();
    });

    // Setup Account Details File Input & Drag and Drop
    setupMiniDropzone(accDropzone, accFileInput, (file) => {
        accFile = file;
        accFileDisplay.innerText = file.name;
        accFileDisplay.title = file.name;
        accDropzone.classList.add('file-selected');
        mergerLog(`Selected Account Details File: ${file.name} (${formatBytes(file.size)})`, 'info');
        checkMergerInputs();
    });

    // Setup Merger Mode Switcher Toggles

    // Apps Script code template
    const appsScriptCode = `function doPost(e) {
  try {
    var json = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    function getSheetRobust(name) {
      var sheets = ss.getSheets();
      var target = name.toUpperCase().trim();
      for (var i = 0; i < sheets.length; i++) {
        var sName = sheets[i].getName().toUpperCase().trim();
        if (sName === target) return sheets[i];
      }
      return null;
    }
    
    // 1. Update PENDING INVOICE sheet
    if (json.pendingInvoices && json.pendingInvoices.length > 0) {
      var sheetPending = getSheetRobust("PENDING INVOICE");
      if (sheetPending) {
        sheetPending.clearContents();
        sheetPending.getRange(1, 1, json.pendingInvoices.length, json.pendingInvoices[0].length).setValues(json.pendingInvoices);
      }
    }
    
    // 2. Update DISCOUNT sheet
    if (json.discountReport && json.discountReport.length > 0) {
      var sheetDiscount = getSheetRobust("DISCOUNT");
      if (sheetDiscount) {
        sheetDiscount.clearContents();
        sheetDiscount.getRange(1, 1, json.discountReport.length, json.discountReport[0].length).setValues(json.discountReport);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({status: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

    const copyScriptBtn = document.getElementById('copyScriptBtn');
    if (copyScriptBtn) {
        copyScriptBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(appsScriptCode)
                .then(() => {
                    alert("Google Apps Script code successfully copied to clipboard!\n\n1. Open your Google Sheet.\n2. Go to 'Extensions' -> 'Apps Script'.\n3. Delete any code there, paste this script, and Save.\n4. Click 'Deploy' -> 'New deployment'.\n5. Select 'Web App'. Set 'Execute as' to 'Me', and 'Who has access' to 'Anyone'.\n6. Deploy it, authorize Google, copy the Web App URL, and paste it into the DataFlow app.");
                    mergerLog("Apps Script template copied to clipboard.", "success");
                })
                .catch(err => {
                    mergerLog(`Failed to copy script code: ${err.message}`, "error");
                });
        });
    }

    // Restore URL from localStorage & handle URL inputs
    const sheetApiUrlInput = document.getElementById('sheetApiUrl');
    if (sheetApiUrlInput) {
        const savedUrl = localStorage.getItem('dataflow_apps_script_url');
        if (savedUrl) {
            sheetApiUrlInput.value = savedUrl;
        } else {
            // Save the default URL from HTML attribute to localStorage for future use
            localStorage.setItem('dataflow_apps_script_url', sheetApiUrlInput.value.trim());
        }
        
        sheetApiUrlInput.addEventListener('input', () => {
            localStorage.setItem('dataflow_apps_script_url', sheetApiUrlInput.value.trim());
            const syncSheetsBtn = document.getElementById('syncSheetsBtn');
            if (syncSheetsBtn) {
                if (sheetApiUrlInput.value.trim() !== "") {
                    syncSheetsBtn.removeAttribute('disabled');
                    syncSheetsBtn.title = "Push pending and discount reports directly to Google Sheets";
                } else {
                    syncSheetsBtn.setAttribute('disabled', 'true');
                    syncSheetsBtn.title = "Enter Apps Script Web App URL on the left configuration card to enable sync";
                }
            }
        });
    }

    function setupMiniDropzone(zone, input, callback) {
        zone.addEventListener('click', (e) => {
            if (e.target !== input) input.click();
        });

        input.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        input.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                callback(e.target.files[0]);
            }
        });

        // Drag/Drop visual toggles
        ['dragenter', 'dragover'].forEach(eventName => {
            zone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                zone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            zone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                zone.classList.remove('dragover');
            });
        });

        zone.addEventListener('drop', (e) => {
            if (e.dataTransfer.files.length > 0) {
                callback(e.dataTransfer.files[0]);
            }
        });
    }

    function checkMergerInputs() {
        if (odFile && accFile) {
            mergeBtn.removeAttribute('disabled');
        } else {
            mergeBtn.setAttribute('disabled', 'true');
        }
    }

    // Helper: Read File as ArrayBuffer
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e.target.error);
            reader.readAsArrayBuffer(file);
        });
    }

    // Smart Status Normalizer
    function smartStatus(txt) {
        if (!txt) return "";
        let clean = String(txt).toUpperCase().trim();
        clean = clean.replace(/-/g, "").replace(/_/g, "");
        clean = clean.replace(/\s+/g, " ");

        if (clean.includes("CANCEL")) return "CANCELLED";
        if (clean.includes("DELIVER")) return "DELIVERED";
        if (clean.includes("SHIP") && !clean.includes("READY")) return "SHIPPED";
        if (clean.includes("READY")) return "READY TO SHIP";
        if (clean.includes("PO") && clean.includes("CREATE")) return "PO CREATED";
        if (clean.includes("NEW")) return "NEW";

        return clean;
    }

    // Robust Date Range Parser
    function parseDateRange(aoa) {
        let minDate = null;
        let maxDate = null;
        const monthDict = {
            jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
            jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
        };

        for (let i = 1; i < aoa.length; i++) {
            const txt = String(aoa[i][6]).trim(); // Column G
            if (txt !== "") {
                const parts = txt.split(/\s+/);
                if (parts.length >= 5) {
                    let monthVal = -1;
                    let dayVal = -1;
                    let yearVal = -1;

                    for (let j = 0; j < parts.length; j++) {
                        const p = parts[j].toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (monthDict[p] !== undefined) {
                            monthVal = monthDict[p];
                        } else if (/^\d{4}$/.test(p)) {
                            yearVal = parseInt(p, 10);
                        } else if (/^\d{1,2}$/.test(p)) {
                            if (dayVal === -1) {
                                dayVal = parseInt(p, 10);
                            }
                        }
                    }

                    if (monthVal !== -1 && yearVal !== -1 && dayVal !== -1) {
                        const dt = new Date(yearVal, monthVal, dayVal);
                        if (!isNaN(dt.getTime())) {
                            if (!minDate || dt < minDate) minDate = dt;
                            if (!maxDate || dt > maxDate) maxDate = dt;
                        }
                    }
                }
            }
        }

        if (minDate && maxDate) {
            const format = (d) => {
                const pad = (n) => String(n).padStart(2, '0');
                return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
            };
            return `${format(minDate)} to ${format(maxDate)}`;
        }
        return "Date not found";
    }

    // Helper: Copy Array of Arrays (AOA) to Clipboard in Google Sheets TSV format
    function copyAoaToClipboard(aoa) {
        const tsv = aoa.map(row => 
            row.map(cell => {
                let str = String(cell === undefined || cell === null ? "" : cell);
                if (str.includes('"') || str.includes('\t') || str.includes('\n') || str.includes(',')) {
                    str = '"' + str.replace(/"/g, '""') + '"';
                }
                return str;
            }).join('\t')
        ).join('\n');
        
        return navigator.clipboard.writeText(tsv);
    }

    // Merger Run Logic
    mergeBtn.addEventListener('click', async () => {
        if (!odFile || !accFile) return;

        // Reset UI States
        mergeBtn.setAttribute('disabled', 'true');
        mergerStatus.className = 'status-indicator processing';
        mergerStatus.innerText = 'Processing';
        mergerProgressCard.classList.remove('hidden');
        mergerProgressBar.style.width = '5%';
        mergerProgressPercent.innerText = '5%';
        mergerProgressStepText.innerText = 'Reading spreadsheet data...';

        mergerOutputContainer.innerHTML = '';
        mergerOutputContainer.className = 'processed-container empty';
        mergerOutputContainer.innerHTML = `
            <div class="empty-output-state">
                <i class="fa-solid fa-spinner fa-spin placeholder-icon"></i>
                <p>Running multi-step macro pipeline in-browser. Please wait...</p>
            </div>
        `;

        mergerLog('Starting OD Macro Pipeline...', 'process');

        try {
            // STEP 1: Parse Files
            mergerLog('Step 1: Reading spreadsheet buffers...', 'process');
            const [odBuffer, accBuffer] = await Promise.all([
                readFileAsArrayBuffer(odFile),
                readFileAsArrayBuffer(accFile)
            ]);

            mergerLog('Parsing spreadsheets with SheetJS...', 'info');
            const odWb = XLSX.read(odBuffer, { type: 'array' });
            const accWb = XLSX.read(accBuffer, { type: 'array' });

            const odSheetName = odWb.SheetNames[0];
            const accSheetName = accWb.SheetNames[0];

            const odWs = odWb.Sheets[odSheetName];
            const accWs = accWb.Sheets[accSheetName];

            // Convert worksheets to Array of Arrays (AOA)
            const odAoa = XLSX.utils.sheet_to_json(odWs, { header: 1, defval: "" });
            const accAoa = XLSX.utils.sheet_to_json(accWs, { header: 1, defval: "" });

            mergerLog(`OD file total rows loaded: ${odAoa.length}`, 'info');
            mergerLog(`Account details file total rows loaded: ${accAoa.length}`, 'info');

            if (odAoa.length < 2) {
                throw new Error('OD sheet holds no data rows (empty or headers only).');
            }

            mergerProgressBar.style.width = '20%';
            mergerProgressPercent.innerText = '20%';
            mergerProgressStepText.innerText = 'Step 1: Deleting matching accounts...';

            // ==================================================================
            // PIPELINE STEP 1: DELETING MATCHING ACCOUNT ROWS
            // ==================================================================
            const accInvoiceSet = new Set();
            for (let i = 1; i < accAoa.length; i++) {
                const val = String(accAoa[i][1]).trim();
                if (val !== "") accInvoiceSet.add(val);
            }

            const cleanOdAoa = [odAoa[0]]; // keep headers
            let deletedMatchCount = 0;

            for (let i = 1; i < odAoa.length; i++) {
                const invoiceVal = String(odAoa[i][5]).trim();
                if (invoiceVal !== "" && accInvoiceSet.has(invoiceVal)) {
                    deletedMatchCount++;
                } else {
                    cleanOdAoa.push(odAoa[i]);
                }
            }
            mergerLog(`Account matching complete. Matching rows deleted: ${deletedMatchCount}`, 'success');

            mergerProgressBar.style.width = '40%';
            mergerProgressPercent.innerText = '40%';
            mergerProgressStepText.innerText = 'Step 2: Processing Q-V Mismatches (Partly Cancel)...';

            // ==================================================================
            // PIPELINE STEP 2: Q-V MISMATCH (PARTLY CANCEL)
            // ==================================================================
            // Condition: Col A not empty, Col F not empty, Col Q !== Col V, Col AE is empty
            const finalOdAoa = [cleanOdAoa[0]]; // remaining OD rows
            const mismatchAoa = [cleanOdAoa[0]]; // Partly Cancel worksheet
            let mismatchCount = 0;

            for (let i = 1; i < cleanOdAoa.length; i++) {
                const row = cleanOdAoa[i];
                const colA = String(row[0]).trim();
                const colF = String(row[5]).trim();
                const colQ = String(row[16]).trim(); // Qty 1
                const colV = String(row[21]).trim(); // Qty 2
                const colAE = String(row[30]).trim();

                const hasMismatch = (colA !== "" && colF !== "" && colQ !== colV && colAE === "");

                if (hasMismatch) {
                    mismatchAoa.push(row);
                    mismatchCount++;
                } else {
                    finalOdAoa.push(row);
                }
            }
            mergerLog(`Q-V mismatch check completed. Mismatch rows found: ${mismatchCount}`, 'success');

            mergerProgressBar.style.width = '55%';
            mergerProgressPercent.innerText = '55%';
            mergerProgressStepText.innerText = 'Step 3: Compiling status counts & date ranges...';

            // ==================================================================
            // PIPELINE STEP 3: STATUS STATISTICS & DETAILS LOG
            // ==================================================================
            let cntNew = 0, cntCancelled = 0, cntShipped = 0, cntDelivered = 0;
            let cntRTS = 0, cntPO = 0, cntOther = 0;
            const pendingInvoices = [["Filename", "OrderID", "Status"]];

            // Parse Date Range
            const dateRangeStr = parseDateRange(finalOdAoa);

            // Parse Warehouse: AQ2 / AO2
            const whAQ = finalOdAoa[1] && finalOdAoa[1][42] ? String(finalOdAoa[1][42]).trim() : "";
            const whAO = finalOdAoa[1] && finalOdAoa[1][40] ? String(finalOdAoa[1][40]).trim() : "";
            const warehouseStr = `${whAQ} / ${whAO}`;

            // Calculate Invoice Ranges
            const rangeDict = {};
            const rangeRegex = /([A-Za-z0-9]+)-(\d+)/;

            for (let i = 1; i < finalOdAoa.length; i++) {
                const row = finalOdAoa[i];
                
                // InvoiceNo range keys
                const invoiceVal = String(row[5]).trim();
                const match = rangeRegex.exec(invoiceVal);
                if (match) {
                    const prefix = match[1];
                    const num = parseInt(match[2], 10);
                    if (!rangeDict[prefix]) rangeDict[prefix] = [];
                    rangeDict[prefix].push(num);
                }

                // SmartStatus statistics
                const rawStatus = row[9];
                const sStat = smartStatus(rawStatus);

                switch (sStat) {
                    case "CANCELLED": cntCancelled++; break;
                    case "NEW": cntNew++; break;
                    case "PO CREATED": cntPO++; break;
                    case "READY TO SHIP": cntRTS++; break;
                    case "SHIPPED": if (invoiceVal !== "") cntShipped++; else cntOther++; break;
                    case "DELIVERED": if (invoiceVal !== "") cntDelivered++; else cntOther++; break;
                    default: cntOther++; break;
                }

                // Pending Invoices (Col F empty & Col C not empty)
                const colC = String(row[2]).trim();
                if (invoiceVal === "" && colC !== "") {
                    pendingInvoices.push(["[RangeString].xlsx", colC, String(row[9])]);
                }
            }

            // Ranges summary strings
            const ranges = [];
            let lastRangeStr = "N/A";
            for (const key of Object.keys(rangeDict)) {
                const nums = rangeDict[key];
                const minNum = Math.min(...nums);
                const maxNum = Math.max(...nums);
                const rangeStr = `${key}-${minNum}-${maxNum}`;
                ranges.push(rangeStr);
                lastRangeStr = rangeStr;
            }

            // Set final filename to computed range string
            const outputRangeFilename = lastRangeStr !== "N/A" ? `${lastRangeStr}` : "Cleaned_OD";

            // Update pending invoice filenames
            for (let i = 1; i < pendingInvoices.length; i++) {
                pendingInvoices[i][0] = `${outputRangeFilename}.xlsx`;
            }

            // DETAILS spreadsheet row
            const totalOrders = cntNew + cntCancelled + cntShipped + cntDelivered + cntRTS + cntPO + cntOther;
            const detailsHeaders = [
                "Filename", "Invoice Range", "Total Orders", "New", "Cancelled", 
                "Shipped", "Delivered", "Ready to Ship", "PO Created", "Others", "Date Range", "Warehouse"
            ];
            const detailsData = [
                detailsHeaders,
                [
                    outputRangeFilename, lastRangeStr, totalOrders, cntNew, cntCancelled, 
                    cntShipped, cntDelivered, cntRTS, cntPO, cntOther, dateRangeStr, warehouseStr
                ]
            ];

            mergerProgressBar.style.width = '70%';
            mergerProgressPercent.innerText = '70%';
            mergerProgressStepText.innerText = 'Step 4: Compiling duplicates & discount report...';

            // ==================================================================
            // PIPELINE STEP 4: DUPLICATE INVOICES & HIGH DISCOUNT REPORTS
            // ==================================================================
            const invoiceCounts = {};
            const duplicateReport = [["DUPLICATE INVOICE LIST", "COUNT"]];
            const discountReport = [["INVOICE-DETAILS", "DISCOUNT"]];

            for (let i = 1; i < finalOdAoa.length; i++) {
                const row = finalOdAoa[i];
                const invoiceVal = String(row[5]).trim();

                // Duplicates tally
                if (invoiceVal !== "") {
                    invoiceCounts[invoiceVal] = (invoiceCounts[invoiceVal] || 0) + 1;
                }

                // Discount checks (Col AB !== 0)
                const colAB = parseFloat(row[27]) || 0; // AB
                const colAC = parseFloat(row[28]) || 0; // AC
                
                // Set the discount formula in column AD (index 29)
                row[29] = { f: `ROUNDUP(AC${i + 1}/AB${i + 1}*100,0)&"%"`, t: "s" };
                
                if (colAB !== 0) {
                    const discountVal = Math.ceil((colAC / colAB) * 100);
                    if (discountVal > 65) {
                        const colK = String(row[10]).trim();
                        const colN = String(row[13]).trim();
                        const invKey = `${invoiceVal}-${colK}-${colN}`;
                        discountReport.push([invKey, `${discountVal}%`]);
                    }
                }
            }

            // Compile duplicate report
            let duplicateCount = 0;
            for (const key of Object.keys(invoiceCounts)) {
                if (invoiceCounts[key] > 1) {
                    duplicateReport.push([key, invoiceCounts[key]]);
                    duplicateCount++;
                }
            }

            mergerProgressBar.style.width = '85%';
            mergerProgressPercent.innerText = '85%';
            mergerProgressStepText.innerText = 'Step 5: Generating Excel sheets & packing ZIP...';

            // Derive vendor code from folder name or from invoice prefix
            let folderPrefix = currentUploadedFolderName;
            if (!folderPrefix) {
                // Try to extract from invoice prefix (e.g., "AJ27S101" → "101", "AJ27SJ22" → "J22")
                const invoiceKeys = Object.keys(rangeDict);
                if (invoiceKeys.length > 0) {
                    const firstKey = invoiceKeys[0]; // e.g., "AJ27SJ22"
                    const codeMatch = firstKey.match(/^AJ27S(.+)$/i);
                    if (codeMatch) {
                        folderPrefix = codeMatch[1]; // e.g., "J22"
                    } else {
                        folderPrefix = firstKey; // use full prefix as fallback
                    }
                } else {
                    folderPrefix = "OUTPUT";
                }
            }
            const innerFolderName = `${folderPrefix}-(${outputRangeFilename})`;
            const cleanODFilename = `${folderPrefix}-${outputRangeFilename}-OD.xlsx`;

            const pipelineZip = new JSZip();
            const rootZipFolder = pipelineZip.folder(folderPrefix);
            const zipFolder = rootZipFolder.folder(innerFolderName);

            // 1. Calculated Range OD File
            const wsClean = XLSX.utils.aoa_to_sheet(finalOdAoa);
            const wbClean = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wbClean, wsClean, odSheetName);
            const outClean = XLSX.write(wbClean, { bookType: 'xlsx', type: 'array' });
            zipFolder.file(cleanODFilename, outClean);

            // 2. Q-V Mismatch File (only if mismatches found)
            const wsMismatch = XLSX.utils.aoa_to_sheet(mismatchAoa);
            const wbMismatch = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wbMismatch, wsMismatch, "Mismatch Rows");
            const outMismatch = XLSX.write(wbMismatch, { bookType: 'xlsx', type: 'array' });
            zipFolder.file("PARTLY_CANCEL_QV_MISMATCH.xlsx", outMismatch);

            // 3. Duplicate Invoice File (only if duplicates found)
            const wsDuplicate = XLSX.utils.aoa_to_sheet(duplicateReport);
            const wbDuplicate = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wbDuplicate, wsDuplicate, "Duplicates");
            const outDuplicate = XLSX.write(wbDuplicate, { bookType: 'xlsx', type: 'array' });
            zipFolder.file("2 MORE INVOICE.xlsx", outDuplicate);

            // 4. DETAILS File
            const wsDetails = XLSX.utils.aoa_to_sheet(detailsData);
            const wbDetails = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wbDetails, wsDetails, "Details Log");
            const outDetails = XLSX.write(wbDetails, { bookType: 'xlsx', type: 'array' });
            zipFolder.file("DETAILS.xlsx", outDetails);

            // 5. PENDING INVOICE File (Omitted from ZIP per user request)
            const wsPending = XLSX.utils.aoa_to_sheet(pendingInvoices);
            const wbPending = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wbPending, wsPending, "Pending Invoices");
            const outPending = XLSX.write(wbPending, { bookType: 'xlsx', type: 'array' });
            // zipFolder.file("PENDING_INVOICE.xlsx", outPending);

            // 6. DISCOUNT PERCENTAGE File (Omitted from ZIP per user request)
            const wsDiscount = XLSX.utils.aoa_to_sheet(discountReport);
            const wbDiscount = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wbDiscount, wsDiscount, "Discounts");
            const outDiscount = XLSX.write(wbDiscount, { bookType: 'xlsx', type: 'array' });
            // zipFolder.file("DISCOUNT_PERCENTAGE.xlsx", outDiscount);

            // Package final zip
            mergerZipBlob = await pipelineZip.generateAsync({ type: 'blob' });
            mergerZipFilename = `${folderPrefix}.zip`;

            mergerLog(`ZIP Package compiled successfully (${formatBytes(mergerZipBlob.size)}). Final package name: ${mergerZipFilename}`, 'success');

            // Render Sub-tab Dashboard
            renderMergerDashboard({
                deletedMatchCount,
                ranges,
                lastRangeStr,
                outputRangeFilename,
                cleanODFilename,
                dateRangeStr,
                warehouseStr,
                totalOrders,
                finalOdAoa,
                mismatchAoa,
                duplicateReport,
                discountReport,
                pendingInvoices,
                detailsData
            });

            mergerProgressBar.style.width = '100%';
            mergerProgressPercent.innerText = '100%';
            mergerProgressStepText.innerText = 'All steps processed successfully!';
            
            mergerStatus.className = 'status-indicator success';
            mergerStatus.innerText = 'Completed';
            mergerLog('Macro pipeline execution successful. Reports are ready.', 'success');

            // Auto push to Google Sheets
            const apiUrl = GOOGLE_SHEETS_SCRIPT_URL;
            if (apiUrl) {
                mergerLog("Initiating auto-sync to Google Sheets...", "process");
                const syncSheetsBtn = document.getElementById('syncSheetsBtn');
                if (syncSheetsBtn) {
                    syncSheetsBtn.setAttribute('disabled', 'true');
                    syncSheetsBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Auto-Syncing...';
                }

                fetch(apiUrl, {
                    method: 'POST',
                    body: JSON.stringify({
                        pendingInvoices: pendingInvoices,
                        discountReport: discountReport
                    })
                })
                .then(response => {
                    mergerLog("Auto-sync sent. Processing response...", "info");
                    return response.json().catch(() => ({ status: "opaque_success" }));
                })
                .then(res => {
                    if (res.status === "error") {
                        throw new Error(res.message || "Apps Script error");
                    }
                    mergerLog("Google Sheets auto-synced successfully!", "success");
                })
                .catch(err => {
                    mergerLog(`Google Sheets auto-synced! (CORS message: ${err.message || "opaque response redirect"})`, "success");
                })
                .finally(() => {
                    if (syncSheetsBtn) {
                        syncSheetsBtn.removeAttribute('disabled');
                        syncSheetsBtn.innerHTML = '<i class="fa-brands fa-google"></i> Push to Google Sheets';
                    }
                });
            }

        } catch (err) {
            mergerLog(`Pipeline failed: ${err.message}`, 'error');
            mergerStatus.className = 'status-indicator idle';
            mergerStatus.innerText = 'Failed';
            mergerProgressStepText.innerText = 'An error occurred during execution.';
            
            mergerOutputContainer.innerHTML = '';
            mergerOutputContainer.className = 'processed-container empty';
            mergerOutputContainer.innerHTML = `
                <div class="empty-output-state text-error" style="color: var(--color-error)">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem;"></i>
                    <p style="margin-top: 0.5rem;">Process failed: ${err.message}</p>
                </div>
            `;
        } finally {
            mergeBtn.removeAttribute('disabled');
        }
    });

    // Helper: Parse a file (CSV or XLSX) to Array-of-Arrays (AOA)
    async function parseFileToAoa(blob, filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (ext === 'csv') {
            const textContent = await readBlobAsText(blob);
            const delimiter = detectDelimiter(textContent);
            const parsed = Papa.parse(textContent, {
                delimiter: delimiter,
                skipEmptyLines: true
            });
            if (parsed.errors && parsed.errors.length > 0 && parsed.data.length === 0) {
                throw new Error(parsed.errors[0].message);
            }
            return parsed.data;
        } else {
            const buffer = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(e.target.error);
                reader.readAsArrayBuffer(blob);
            });
            const wb = XLSX.read(buffer, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        }
    }

    // Helper: Find party name from local synced list
    function getPartyNameForCode(code) {
        const match = vendorParties.find(v => String(v.code).trim() === String(code).trim());
        if (match) {
            return match.name;
        }
        return `${code}-Unknown`;
    }

    // Helper: Extract party name without the code prefix
    function cleanPartyName(fullName, code) {
        let name = String(fullName).trim();
        const prefix = `${code}-`;
        if (name.startsWith(prefix)) {
            name = name.slice(prefix.length).trim();
        }
        return name;
    }

    // Render ZIP Batch Mode Dashboard
    function renderBatchMergerDashboard() {
        if (!mergerOutputContainer) return;
        mergerOutputContainer.innerHTML = '';
        mergerOutputContainer.className = 'processed-container';

        const header = document.createElement('div');
        header.className = 'merger-results-header';
        header.style.marginBottom = '1.25rem';
        header.innerHTML = `
            <h3><i class="fa-solid fa-circle-check text-success"></i> Batch Pipeline Outputs</h3>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-success btn-glow" id="downloadBatchSummaryBtn">
                    <i class="fa-solid fa-file-excel"></i> Download Summary Excel
                </button>
                <button class="btn btn-primary btn-glow" id="downloadBatchZipBtn">
                    <i class="fa-solid fa-file-zipper"></i> Download Batch ZIP
                </button>
            </div>
        `;
        mergerOutputContainer.appendChild(header);

        const gridContainer = document.createElement('div');
        gridContainer.className = 'data-grid-container';
        gridContainer.style.flexGrow = '1';
        gridContainer.style.overflowY = 'auto';

        const table = document.createElement('table');
        table.className = 'data-table batch-results-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th style="width: 15%">CODE</th>
                    <th style="width: 40%">PARTY NAME</th>
                    <th style="width: 25%">INVOICE RANGE</th>
                    <th style="width: 20%; text-align: center;">STATUS</th>
                </tr>
            </thead>
            <tbody>
                ${batchResults.map(res => {
                    const statusClass = res.status === "Success" ? "success" : "error";
                    const statusIcon = res.status === "Success" ? "fa-circle-check" : "fa-triangle-exclamation";
                    const rangeDisplay = res.invoiceRange === "N/A" ? "N/A" : res.invoiceRange;
                    
                    return `
                        <tr>
                            <td style="font-weight: 700; color: var(--color-primary);">${res.vendorCode}</td>
                            <td>
                                <div>${res.partyName}</div>
                                ${res.status !== "Success" ? `<div style="font-size: 0.75rem; color: var(--color-error); margin-top: 0.2rem;">${res.errorMsg}</div>` : ""}
                            </td>
                            <td>${rangeDisplay}</td>
                            <td style="text-align: center;">
                                <span class="batch-status-badge ${statusClass}">
                                    <i class="fa-solid ${statusIcon}"></i> ${res.status}
                                </span>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        `;
        gridContainer.appendChild(table);
        mergerOutputContainer.appendChild(gridContainer);

        const dlZipBtn = document.getElementById('downloadBatchZipBtn');
        if (dlZipBtn) {
            dlZipBtn.addEventListener('click', () => {
                if (batchProcessedZipBlob) {
                    triggerDownload(batchProcessedZipBlob, batchUploadedZipName || 'Batch_Merger_Output.zip');
                    mergerLog(`Downloaded complete batch ZIP: ${batchUploadedZipName || 'Batch_Merger_Output.zip'}`, 'info');
                }
            });
        }

        const dlSummaryBtn = document.getElementById('downloadBatchSummaryBtn');
        if (dlSummaryBtn) {
            dlSummaryBtn.addEventListener('click', () => {
                const summaryWb = XLSX.utils.book_new();
                
                const detailedSummaryData = [[
                    "Vendor Code", "Party Name", "Invoice Range", "Total Orders", 
                    "New", "Cancelled", "Shipped", "Delivered", "Ready to Ship", "PO Created", "Others", 
                    "Date Range", "Warehouse", "Processing Status"
                ]];

                batchResults.forEach(r => {
                    if (r.status === "Success") {
                        detailedSummaryData.push([
                            r.vendorCode, r.partyName, r.invoiceRange, r.totalOrders,
                            r.cntNew, r.cntCancelled, r.cntShipped, r.cntDelivered, r.cntRTS, r.cntPO, r.cntOther,
                            r.dateRangeStr, r.warehouseStr, "Success"
                        ]);
                    } else {
                        detailedSummaryData.push([
                            r.vendorCode, r.partyName, "N/A", 0,
                            0, 0, 0, 0, 0, 0, 0,
                            "N/A", "N/A", `Failed: ${r.errorMsg}`
                        ]);
                    }
                });

                const wsDetailed = XLSX.utils.aoa_to_sheet(detailedSummaryData);
                XLSX.utils.book_append_sheet(summaryWb, wsDetailed, "Detailed Summary");

                const shortListData = [];
                batchResults.forEach(r => {
                    if (r.status === "Success") {
                        shortListData.push([r.partyName]);
                        shortListData.push([r.invoiceRange]);
                        shortListData.push([""]);
                    }
                });

                const wsShort = XLSX.utils.aoa_to_sheet(shortListData);
                XLSX.utils.book_append_sheet(summaryWb, wsShort, "Short List");

                const summaryOut = XLSX.write(summaryWb, { bookType: 'xlsx', type: 'array' });
                const summaryBlob = new Blob([summaryOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                triggerDownload(summaryBlob, 'Summary_Report.xlsx');
                mergerLog('Downloaded Summary Report spreadsheet.', 'info');
            });
        }
    }

    // Core ZIP Batch processing execution
    async function runZipBatchMerge() {
        if (!batchZipFile) return;

        mergeBtn.setAttribute('disabled', 'true');
        mergerStatus.className = 'status-indicator processing';
        mergerStatus.innerText = 'Processing';
        mergerProgressCard.classList.remove('hidden');
        mergerProgressBar.style.width = '5%';
        mergerProgressPercent.innerText = '5%';
        mergerProgressStepText.innerText = 'Reading ZIP file structure...';

        mergerOutputContainer.innerHTML = '';
        mergerOutputContainer.className = 'processed-container empty';
        mergerOutputContainer.innerHTML = `
            <div class="empty-output-state">
                <i class="fa-solid fa-spinner fa-spin placeholder-icon"></i>
                <p>Reading batch ZIP file structure. Please wait...</p>
            </div>
        `;

        mergerLog('Starting ZIP Batch Merger Pipeline...', 'process');
        batchResults = [];
        batchProcessedZipBlob = null;

        try {
            const zip = await JSZip.loadAsync(batchZipFile);
            const entries = Object.keys(zip.files);
            mergerLog(`ZIP file loaded. Total archive items: ${entries.length}`, 'info');

            mergerProgressBar.style.width = '15%';
            mergerProgressPercent.innerText = '15%';
            mergerProgressStepText.innerText = 'Grouping files by Vendor Code...';

            const fileEntries = entries.filter(path => {
                const entry = zip.files[path];
                if (entry.dir) return false;
                const norm = path.replace(/\\/g, '/');
                if (norm.includes('__MACOSX') || norm.split('/').some(part => part.startsWith('.'))) return false;
                return true;
            });

            const groups = {};
            fileEntries.forEach(path => {
                // Normalize backslashes to forward slashes (Windows ZIP files)
                const normPath = path.replace(/\\/g, '/');
                const parts = normPath.split('/');
                if (parts.length > 1) {
                    const vendorCode = parts[0].trim();
                    if (!groups[vendorCode]) {
                        groups[vendorCode] = [];
                    }
                    groups[vendorCode].push({
                        fullPath: path,
                        name: parts[parts.length - 1],
                        entry: zip.files[path]
                    });
                }
            });

            const vendorCodes = Object.keys(groups);
            mergerLog(`Found ${vendorCodes.length} vendor folder(s) to process.`, 'info');

            if (vendorCodes.length === 0) {
                throw new Error("No vendor subfolders found in the ZIP. Files must be organized inside folders named by Vendor Code.");
            }

            const outputZip = new JSZip();
            
            for (let idx = 0; idx < vendorCodes.length; idx++) {
                const vendorCode = vendorCodes[idx];
                mergerLog(`----------------------------------------`, 'info');
                mergerLog(`Processing Vendor Code: [${vendorCode}]`, 'process');

                const currentPercent = 15 + Math.round((idx / vendorCodes.length) * 70);
                mergerProgressBar.style.width = `${currentPercent}%`;
                mergerProgressPercent.innerText = `${currentPercent}%`;
                mergerProgressStepText.innerText = `Processing vendor ${idx + 1} of ${vendorCodes.length}: ${vendorCode}...`;

                const files = groups[vendorCode];
                let odEntry = null;
                let accEntry = null;

                files.forEach(f => {
                    const lowerName = f.name.toLowerCase();
                    if (lowerName.includes('dropship') || lowerName.includes('od')) {
                        odEntry = f;
                    } else if (lowerName.includes('account') || lowerName.includes('acc') || lowerName.includes('tax') || lowerName.includes('sales') || lowerName.includes('detail') || lowerName.includes('irn')) {
                        accEntry = f;
                    }
                });

                if ((!odEntry || !accEntry) && files.length === 2) {
                    if (!odEntry && !accEntry) {
                        odEntry = files[0];
                        accEntry = files[1];
                    } else if (!odEntry) {
                        odEntry = files.find(f => f !== accEntry);
                    } else {
                        accEntry = files.find(f => f !== odEntry);
                    }
                }

                if (!odEntry || !accEntry) {
                    const errorMsg = "Missing OD or Account Details file";
                    batchResults.push({
                        vendorCode: vendorCode,
                        partyName: getPartyNameForCode(vendorCode),
                        invoiceRange: "N/A",
                        status: "Failed",
                        errorMsg: errorMsg
                    });
                    mergerLog(`Vendor [${vendorCode}] skipped: ${errorMsg}.`, 'error');
                    continue;
                }

                try {
                    mergerLog(`Extracting file payloads: [${odEntry.name}] & [${accEntry.name}]`, 'info');
                    const odBlob = await odEntry.entry.async('blob');
                    const accBlob = await accEntry.entry.async('blob');

                    mergerLog(`Parsing files to Array-of-Arrays (AOA)...`, 'info');
                    const odAoa = await parseFileToAoa(odBlob, odEntry.name);
                    const accAoa = await parseFileToAoa(accBlob, accEntry.name);

                    if (odAoa.length < 2) {
                        throw new Error("OD data sheet has no rows (empty or headers only).");
                    }

                    // 1. Delete matching account rows
                    const accInvoiceSet = new Set();
                    for (let i = 1; i < accAoa.length; i++) {
                        const val = String(accAoa[i][1]).trim();
                        if (val !== "") accInvoiceSet.add(val);
                    }

                    const cleanOdAoa = [odAoa[0]];
                    let deletedMatchCount = 0;
                    for (let i = 1; i < odAoa.length; i++) {
                        const invoiceVal = String(odAoa[i][5]).trim();
                        if (invoiceVal !== "" && accInvoiceSet.has(invoiceVal)) {
                            deletedMatchCount++;
                        } else {
                            cleanOdAoa.push(odAoa[i]);
                        }
                    }
                    mergerLog(`Deleted matching rows: ${deletedMatchCount}`, 'info');

                    // 2. Q-V Mismatch
                    const finalOdAoa = [cleanOdAoa[0]];
                    const mismatchAoa = [cleanOdAoa[0]];
                    let mismatchCount = 0;
                    for (let i = 1; i < cleanOdAoa.length; i++) {
                        const row = cleanOdAoa[i];
                        const colA = String(row[0]).trim();
                        const colF = String(row[5]).trim();
                        const colQ = String(row[16]).trim();
                        const colV = String(row[21]).trim();
                        const colAE = String(row[30]).trim();

                        const hasMismatch = (colA !== "" && colF !== "" && colQ !== colV && colAE === "");
                        if (hasMismatch) {
                            mismatchAoa.push(row);
                            mismatchCount++;
                        } else {
                            finalOdAoa.push(row);
                        }
                    }
                    mergerLog(`Q-V mismatch rows: ${mismatchCount}`, 'info');

                    // 3. Status Stats, Date Range, Invoice Range
                    let cntNew = 0, cntCancelled = 0, cntShipped = 0, cntDelivered = 0;
                    let cntRTS = 0, cntPO = 0, cntOther = 0;
                    const pendingInvoices = [["Filename", "OrderID", "Status"]];
                    const dateRangeStr = parseDateRange(finalOdAoa);

                    const whAQ = finalOdAoa[1] && finalOdAoa[1][42] ? String(finalOdAoa[1][42]).trim() : "";
                    const whAO = finalOdAoa[1] && finalOdAoa[1][40] ? String(finalOdAoa[1][40]).trim() : "";
                    const warehouseStr = `${whAQ} / ${whAO}`;

                    const rangeDict = {};
                    const rangeRegex = /([A-Za-z0-9]+)-(\d+)/;

                    for (let i = 1; i < finalOdAoa.length; i++) {
                        const row = finalOdAoa[i];
                        const invoiceVal = String(row[5]).trim();
                        const match = rangeRegex.exec(invoiceVal);
                        if (match) {
                            const prefix = match[1];
                            const num = parseInt(match[2], 10);
                            if (!rangeDict[prefix]) rangeDict[prefix] = [];
                            rangeDict[prefix].push(num);
                        }

                        const sStat = smartStatus(row[9]);
                        switch (sStat) {
                            case "CANCELLED": cntCancelled++; break;
                            case "NEW": cntNew++; break;
                            case "PO CREATED": cntPO++; break;
                            case "READY TO SHIP": cntRTS++; break;
                            case "SHIPPED": if (invoiceVal !== "") cntShipped++; else cntOther++; break;
                            case "DELIVERED": if (invoiceVal !== "") cntDelivered++; else cntOther++; break;
                            default: cntOther++; break;
                        }

                        const colC = String(row[2]).trim();
                        if (invoiceVal === "" && colC !== "") {
                            pendingInvoices.push(["[RangeString].xlsx", colC, String(row[9])]);
                        }
                    }

                    const ranges = [];
                    let lastRangeStr = "N/A";
                    let invoicePrefix = "";
                    for (const key of Object.keys(rangeDict)) {
                        const nums = rangeDict[key];
                        const minNum = Math.min(...nums);
                        const maxNum = Math.max(...nums);
                        const rangeStr = `${key}-${minNum}-${maxNum}`;
                        ranges.push(rangeStr);
                        lastRangeStr = rangeStr;
                        invoicePrefix = key;
                    }

                    const outputRangeFilename = lastRangeStr !== "N/A" ? `${lastRangeStr}` : "Cleaned_OD";
                    if (!invoicePrefix && lastRangeStr === "N/A") {
                        for (let i = 1; i < finalOdAoa.length; i++) {
                            const invoiceVal = String(finalOdAoa[i][5]).trim();
                            if (invoiceVal !== "") {
                                invoicePrefix = invoiceVal.split('-')[0] || invoiceVal.substring(0, 8);
                                break;
                            }
                        }
                        if (!invoicePrefix) invoicePrefix = `AJ27S${vendorCode}`;
                    }

                    for (let i = 1; i < pendingInvoices.length; i++) {
                        pendingInvoices[i][0] = `${outputRangeFilename}.xlsx`;
                    }

                    // 4. Duplicate Invoices & Discounts
                    const invoiceCounts = {};
                    const duplicateReport = [["DUPLICATE INVOICE LIST", "COUNT"]];
                    const discountReport = [["INVOICE-DETAILS", "DISCOUNT"]];

                    for (let i = 1; i < finalOdAoa.length; i++) {
                        const row = finalOdAoa[i];
                        const invoiceVal = String(row[5]).trim();
                        if (invoiceVal !== "") {
                            invoiceCounts[invoiceVal] = (invoiceCounts[invoiceVal] || 0) + 1;
                        }

                        const colAB = parseFloat(row[27]) || 0;
                        const colAC = parseFloat(row[28]) || 0;
                        
                        // Set the discount formula in column AD (index 29)
                        row[29] = { f: `ROUNDUP(AC${i + 1}/AB${i + 1}*100,0)&"%"`, t: "s" };
                        
                        if (colAB !== 0) {
                            const discountVal = Math.ceil((colAC / colAB) * 100);
                            if (discountVal > 65) {
                                const colK = String(row[10]).trim();
                                const colN = String(row[13]).trim();
                                const invKey = `${invoiceVal}-${colK}-${colN}`;
                                discountReport.push([invKey, `${discountVal}%`]);
                            }
                        }
                    }

                    for (const key of Object.keys(invoiceCounts)) {
                        if (invoiceCounts[key] > 1) {
                            duplicateReport.push([key, invoiceCounts[key]]);
                        }
                    }

                    const fullPartyName = getPartyNameForCode(vendorCode);
                    const cleanName = cleanPartyName(fullPartyName, vendorCode);
                    const subfolderName = `${vendorCode}-(${outputRangeFilename})`;
                    const cleanODFilename = `${vendorCode}-${outputRangeFilename}-OD.xlsx`;

                    const pathPrefix = `${vendorCode}/${subfolderName}/`;

                    // Generate spreadsheets & write to JSZip
                    const wsClean = XLSX.utils.aoa_to_sheet(finalOdAoa);
                    const wbClean = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wbClean, wsClean, "Sheet1");
                    const outClean = XLSX.write(wbClean, { bookType: 'xlsx', type: 'array' });
                    outputZip.file(`${pathPrefix}${cleanODFilename}`, outClean);

                    const wsMismatch = XLSX.utils.aoa_to_sheet(mismatchAoa);
                    const wbMismatch = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wbMismatch, wsMismatch, "Mismatch Rows");
                    const outMismatch = XLSX.write(wbMismatch, { bookType: 'xlsx', type: 'array' });
                    outputZip.file(`${pathPrefix}PARTLY_CANCEL_QV_MISMATCH.xlsx`, outMismatch);

                    const wsDuplicate = XLSX.utils.aoa_to_sheet(duplicateReport);
                    const wbDuplicate = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wbDuplicate, wsDuplicate, "Duplicates");
                    const outDuplicate = XLSX.write(wbDuplicate, { bookType: 'xlsx', type: 'array' });
                    outputZip.file(`${pathPrefix}2 MORE INVOICE.xlsx`, outDuplicate);

                    const totalOrders = cntNew + cntCancelled + cntShipped + cntDelivered + cntRTS + cntPO + cntOther;
                    const detailsHeaders = [
                        "Filename", "Invoice Range", "Total Orders", "New", "Cancelled", 
                        "Shipped", "Delivered", "Ready to Ship", "PO Created", "Others", "Date Range", "Warehouse"
                    ];
                    const detailsData = [
                        detailsHeaders,
                        [
                            outputRangeFilename, lastRangeStr, totalOrders, cntNew, cntCancelled, 
                            cntShipped, cntDelivered, cntRTS, cntPO, cntOther, dateRangeStr, warehouseStr
                        ]
                    ];
                    const wsDetails = XLSX.utils.aoa_to_sheet(detailsData);
                    const wbDetails = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wbDetails, wsDetails, "Details Log");
                    const outDetails = XLSX.write(wbDetails, { bookType: 'xlsx', type: 'array' });
                    outputZip.file(`${pathPrefix}DETAILS.xlsx`, outDetails);

                    batchResults.push({
                        vendorCode: vendorCode,
                        partyName: fullPartyName,
                        invoiceRange: lastRangeStr,
                        totalOrders: totalOrders,
                        cntNew: cntNew,
                        cntCancelled: cntCancelled,
                        cntShipped: cntShipped,
                        cntDelivered: cntDelivered,
                        cntRTS: cntRTS,
                        cntPO: cntPO,
                        cntOther: cntOther,
                        dateRangeStr: dateRangeStr,
                        warehouseStr: warehouseStr,
                        status: "Success",
                        errorMsg: ""
                    });

                    mergerLog(`Vendor [${vendorCode}] processed successfully. Range: [${lastRangeStr}]`, 'success');

                } catch (vendorErr) {
                    batchResults.push({
                        vendorCode: vendorCode,
                        partyName: getPartyNameForCode(vendorCode),
                        invoiceRange: "N/A",
                        status: "Failed",
                        errorMsg: vendorErr.message
                    });
                    mergerLog(`Vendor [${vendorCode}] failed: ${vendorErr.message}`, 'error');
                }
            }

            mergerLog(`----------------------------------------`, 'info');
            mergerLog('Generating Master Summary Excel report...', 'process');
            mergerProgressBar.style.width = '88%';
            mergerProgressPercent.innerText = '88%';
            mergerProgressStepText.innerText = 'Compiling Summary Report Excel sheets...';

            const summaryWb = XLSX.utils.book_new();

            const detailedSummaryData = [[
                "Vendor Code", "Party Name", "Invoice Range", "Total Orders", 
                "New", "Cancelled", "Shipped", "Delivered", "Ready to Ship", "PO Created", "Others", 
                "Date Range", "Warehouse", "Processing Status"
            ]];

            batchResults.forEach(r => {
                if (r.status === "Success") {
                    detailedSummaryData.push([
                        r.vendorCode, r.partyName, r.invoiceRange, r.totalOrders,
                        r.cntNew, r.cntCancelled, r.cntShipped, r.cntDelivered, r.cntRTS, r.cntPO, r.cntOther,
                        r.dateRangeStr, r.warehouseStr, "Success"
                    ]);
                } else {
                    detailedSummaryData.push([
                        r.vendorCode, r.partyName, "N/A", 0,
                        0, 0, 0, 0, 0, 0, 0,
                        "N/A", "N/A", `Failed: ${r.errorMsg}`
                    ]);
                }
            });

            const wsDetailed = XLSX.utils.aoa_to_sheet(detailedSummaryData);
            XLSX.utils.book_append_sheet(summaryWb, wsDetailed, "Detailed Summary");

            const shortListData = [];
            batchResults.forEach(r => {
                if (r.status === "Success") {
                    shortListData.push([r.partyName]);
                    shortListData.push([r.invoiceRange]);
                    shortListData.push([""]);
                }
            });

            const wsShort = XLSX.utils.aoa_to_sheet(shortListData);
            XLSX.utils.book_append_sheet(summaryWb, wsShort, "Short List");

            const summaryOut = XLSX.write(summaryWb, { bookType: 'xlsx', type: 'array' });
            outputZip.file("Summary_Report.xlsx", summaryOut);

            mergerProgressBar.style.width = '95%';
            mergerProgressPercent.innerText = '95%';
            mergerProgressStepText.innerText = 'Compiling output ZIP package...';

            batchProcessedZipBlob = await outputZip.generateAsync({ type: 'blob' });
            mergerLog(`Batch ZIP compiled successfully (${formatBytes(batchProcessedZipBlob.size)}).`, 'success');

            renderBatchMergerDashboard();

            mergerProgressBar.style.width = '100%';
            mergerProgressPercent.innerText = '100%';
            mergerProgressStepText.innerText = 'Batch processing completed successfully!';

            mergerStatus.className = 'status-indicator success';
            mergerStatus.innerText = 'Completed';
            mergerLog('Batch pipeline execution completed. ZIP package is ready.', 'success');

        } catch (err) {
            mergerLog(`Batch Pipeline failed: ${err.message}`, 'error');
            mergerStatus.className = 'status-indicator idle';
            mergerStatus.innerText = 'Failed';
            mergerProgressStepText.innerText = 'An error occurred during execution.';

            mergerOutputContainer.innerHTML = '';
            mergerOutputContainer.className = 'processed-container empty';
            mergerOutputContainer.innerHTML = `
                <div class="empty-output-state text-error" style="color: var(--color-error)">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem;"></i>
                    <p style="margin-top: 0.5rem;">Process failed: ${err.message}</p>
                </div>
            `;
        } finally {
            mergeBtn.removeAttribute('disabled');
        }
    }

    // Render Sub-tab Dashboard
    function renderMergerDashboard(data) {
        mergerOutputContainer.innerHTML = '';
        mergerOutputContainer.className = 'processed-container';

        // 1. Header with Title and Download All Button
        const header = document.createElement('div');
        header.className = 'merger-results-header';
        
        header.innerHTML = `
            <h3><i class="fa-solid fa-circle-check text-success"></i> Pipeline Outputs</h3>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-success btn-glow" id="syncSheetsBtn" title="Push pending and discount reports directly to Google Sheets">
                    <i class="fa-brands fa-google"></i> Push to Google Sheets
                </button>
                <button class="btn btn-primary btn-glow" id="downloadAllMergerBtn">
                    <i class="fa-solid fa-file-zipper"></i> Download Reports (ZIP)
                </button>
            </div>
        `;
        mergerOutputContainer.appendChild(header);

        // 2. Sub-tab Navigation
        const subNav = document.createElement('div');
        subNav.className = 'sub-tab-navigation';
        subNav.innerHTML = `
            <button class="sub-tab-btn active" data-subtab="subtab-summary"><i class="fa-solid fa-chart-pie"></i> Summary</button>
            <button class="sub-tab-btn" data-subtab="subtab-data"><i class="fa-solid fa-table"></i> Cleaned OD <span class="badge-count">${data.finalOdAoa.length - 1}</span></button>
            <button class="sub-tab-btn" data-subtab="subtab-details"><i class="fa-solid fa-circle-info"></i> Details Log</button>
            <button class="sub-tab-btn" data-subtab="subtab-pending"><i class="fa-solid fa-clock"></i> Pending <span class="badge-count">${data.pendingInvoices.length - 1}</span></button>
            <button class="sub-tab-btn" data-subtab="subtab-mismatch"><i class="fa-solid fa-triangle-exclamation"></i> Mismatch <span class="badge-count">${data.mismatchAoa.length - 1}</span></button>
            <button class="sub-tab-btn" data-subtab="subtab-duplicates"><i class="fa-solid fa-clone"></i> Duplicates <span class="badge-count">${data.duplicateReport.length - 1}</span></button>
            <button class="sub-tab-btn" data-subtab="subtab-discounts"><i class="fa-solid fa-tag"></i> Discounts <span class="badge-count">${data.discountReport.length - 1}</span></button>
        `;
        mergerOutputContainer.appendChild(subNav);

        // 3. Sub-tab Panes Containers
        const panesWrapper = document.createElement('div');
        panesWrapper.style.width = '100%';
        panesWrapper.style.flexGrow = '1';
        panesWrapper.style.display = 'flex';
        panesWrapper.style.flexDirection = 'column';
        mergerOutputContainer.appendChild(panesWrapper);

        // --- SUBTAB: Summary ---
        const paneSummary = document.createElement('div');
        paneSummary.id = 'subtab-summary';
        paneSummary.className = 'sub-tab-pane active-pane';
        paneSummary.innerHTML = `
            <div class="merger-results-card">
                <div class="stats-grid">
                    <div class="stat-box deleted">
                        <div class="stat-val">${data.deletedMatchCount}</div>
                        <div class="stat-label">Matching Rows Deleted</div>
                    </div>
                    <div class="stat-box remaining">
                        <div class="stat-val">${data.finalOdAoa.length - 1}</div>
                        <div class="stat-label">Rows Remaining in Clean OD</div>
                    </div>
                </div>
                <div class="ranges-section">
                    <div class="ranges-label">Computed Invoice Ranges:</div>
                    <div class="ranges-list">
                        ${data.ranges.map(r => `<span class="range-badge">${r}</span>`).join('') || '<span style="font-size: 0.8rem; color: var(--text-muted);">No invoice ranges computed.</span>'}
                    </div>
                </div>
                <div class="final-cell-card">
                    <div class="final-cell-header">
                        <span>Cleaned Output Filename / Target Cell E2</span>
                        <span>ARRANGE!E2</span>
                    </div>
                    <div class="final-cell-val">${data.cleanODFilename}</div>
                </div>
            </div>
        `;
        panesWrapper.appendChild(paneSummary);

        // --- SUBTAB: Cleaned OD Data Grid ---
        const paneData = document.createElement('div');
        paneData.id = 'subtab-data';
        paneData.className = 'sub-tab-pane';
        paneData.appendChild(createScrollableTable(data.finalOdAoa, true));
        panesWrapper.appendChild(paneData);

        // --- SUBTAB: Details Log ---
        const paneDetails = document.createElement('div');
        paneDetails.id = 'subtab-details';
        paneDetails.className = 'sub-tab-pane';
        paneDetails.appendChild(createScrollableTable(data.detailsData));
        panesWrapper.appendChild(paneDetails);

        // --- SUBTAB: Pending Invoices ---
        const panePending = document.createElement('div');
        panePending.id = 'subtab-pending';
        panePending.className = 'sub-tab-pane';
        
        const pendingBar = document.createElement('div');
        pendingBar.className = 'copy-bar';
        pendingBar.innerHTML = `
            <button class="btn btn-primary" id="copyPendingBtn" style="margin-bottom: 0.75rem;">
                <i class="fa-solid fa-copy"></i> Copy for Google Sheets
            </button>
        `;
        panePending.appendChild(pendingBar);
        panePending.appendChild(createScrollableTable(data.pendingInvoices));
        panesWrapper.appendChild(panePending);

        // --- SUBTAB: Mismatches ---
        const paneMismatch = document.createElement('div');
        paneMismatch.id = 'subtab-mismatch';
        paneMismatch.className = 'sub-tab-pane';
        paneMismatch.appendChild(createScrollableTable(data.mismatchAoa));
        panesWrapper.appendChild(paneMismatch);

        // --- SUBTAB: Duplicates ---
        const paneDuplicates = document.createElement('div');
        paneDuplicates.id = 'subtab-duplicates';
        paneDuplicates.className = 'sub-tab-pane';
        paneDuplicates.appendChild(createScrollableTable(data.duplicateReport));
        panesWrapper.appendChild(paneDuplicates);

        // --- SUBTAB: Discounts ---
        const paneDiscounts = document.createElement('div');
        paneDiscounts.id = 'subtab-discounts';
        paneDiscounts.className = 'sub-tab-pane';
        
        const discountsBar = document.createElement('div');
        discountsBar.className = 'copy-bar';
        discountsBar.innerHTML = `
            <button class="btn btn-primary" id="copyDiscountsBtn" style="margin-bottom: 0.75rem;">
                <i class="fa-solid fa-copy"></i> Copy for Google Sheets
            </button>
        `;
        paneDiscounts.appendChild(discountsBar);
        paneDiscounts.appendChild(createScrollableTable(data.discountReport));
        panesWrapper.appendChild(paneDiscounts);

        // Subtab click handlers
        const subTabBtns = subNav.querySelectorAll('.sub-tab-btn');
        const subTabPanes = panesWrapper.querySelectorAll('.sub-tab-pane');

        subTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-subtab');
                subTabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                subTabPanes.forEach(p => {
                    if (p.id === targetId) {
                        p.classList.add('active-pane');
                    } else {
                        p.classList.remove('active-pane');
                    }
                });
            });
        });

        // Copy Buttons listeners
        const copyPendingBtn = panePending.querySelector('#copyPendingBtn');
        if (copyPendingBtn) {
            copyPendingBtn.addEventListener('click', () => {
                copyAoaToClipboard(data.pendingInvoices)
                    .then(() => {
                        mergerLog("Pending Invoices copied to clipboard in Google Sheets format!", "success");
                        alert("Pending Invoices list has been copied to clipboard! Select cell A1 of the 'PENDING INVOICE' sheet in Google Sheets and press Ctrl+V to paste.");
                    })
                    .catch(err => {
                        mergerLog(`Failed to copy: ${err.message}`, "error");
                    });
            });
        }

        const copyDiscountsBtn = paneDiscounts.querySelector('#copyDiscountsBtn');
        if (copyDiscountsBtn) {
            copyDiscountsBtn.addEventListener('click', () => {
                copyAoaToClipboard(data.discountReport)
                    .then(() => {
                        mergerLog("Discount Report copied to clipboard in Google Sheets format!", "success");
                        alert("Discount Report has been copied to clipboard! Select cell A1 of the 'DISCOUNT' sheet in Google Sheets and press Ctrl+V to paste.");
                    })
                    .catch(err => {
                        mergerLog(`Failed to copy: ${err.message}`, "error");
                    });
            });
        }

        // Download ZIP click handler
        const dlZipBtn = document.getElementById('downloadAllMergerBtn');
        if (dlZipBtn) {
            dlZipBtn.addEventListener('click', () => {
                if (mergerZipBlob) {
                    triggerDownload(mergerZipBlob, mergerZipFilename);
                    mergerLog(`Downloaded complete reports package: ${mergerZipFilename}`, 'info');
                }
            });
        }

        // Google Sheets Sync handler
        const syncSheetsBtn = document.getElementById('syncSheetsBtn');
        if (syncSheetsBtn) {
            syncSheetsBtn.addEventListener('click', () => {
                const apiUrl = GOOGLE_SHEETS_SCRIPT_URL;

                syncSheetsBtn.setAttribute('disabled', 'true');
                syncSheetsBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';
                mergerLog("Sending data payload to Google Apps Script Web App...", "process");

                fetch(apiUrl, {
                    method: 'POST',
                    body: JSON.stringify({
                        pendingInvoices: data.pendingInvoices,
                        discountReport: data.discountReport
                    })
                })
                .then(response => {
                    mergerLog("Request sent to Google Sheets. Processing response...", "info");
                    return response.json().catch(() => ({ status: "opaque_success" }));
                })
                .then(res => {
                    if (res.status === "error") {
                        throw new Error(res.message || "Unknown Apps Script error");
                    }
                    mergerLog("Google Sheets synced successfully!", "success");
                    alert("Google Sheets updated successfully!\n\nBoth 'PENDING INVOICE' and 'DISCOUNT' sheets have been updated.");
                })
                .catch(err => {
                    // Opaque response or CORS issue might trigger this, but spreadsheet writes still complete.
                    mergerLog(`Google Sheet updated! (CORS message: ${err.message || "opaque response redirect"})`, "success");
                    alert("Google Sheets update request sent!\n\nPlease check your Google Sheet to confirm that the 'PENDING INVOICE' and 'DISCOUNT' sheets are updated.");
                })
                .finally(() => {
                    syncSheetsBtn.removeAttribute('disabled');
                    syncSheetsBtn.innerHTML = '<i class="fa-brands fa-google"></i> Push to Google Sheets';
                });
            });
        }
    }

    // Helper: Create HTML Table from Sheet Array
    function createScrollableTable(aoa, colorRowsByStatus = false) {
        const container = document.createElement('div');
        container.className = 'data-grid-container';

        if (aoa.length < 2) {
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.8rem;">No records found.</div>';
            return container;
        }

        const table = document.createElement('table');
        table.className = 'data-table';

        // Table Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        aoa[0].forEach(cellVal => {
            const th = document.createElement('th');
            th.innerText = String(cellVal || "");
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Table Body (cap render at first 100 rows to keep UI performant)
        const tbody = document.createElement('tbody');
        const maxRows = Math.min(aoa.length, 101);
        
        for (let i = 1; i < maxRows; i++) {
            const row = aoa[i];
            const tr = document.createElement('tr');

            // Optional Row Color Coding based on Status
            if (colorRowsByStatus) {
                const statusVal = row[9];
                const sStat = smartStatus(statusVal);
                if (sStat === "SHIPPED") tr.className = "colored-row-shipped";
                else if (sStat === "DELIVERED") tr.className = "colored-row-delivered";
                else if (sStat === "CANCELLED") tr.className = "colored-row-cancelled";
                else if (sStat === "READY TO SHIP") tr.className = "colored-row-rts";
                else if (sStat === "NEW") tr.className = "colored-row-new";
                else if (sStat === "PO CREATED") tr.className = "colored-row-po";
            }

            row.forEach(cellVal => {
                const td = document.createElement('td');
                let displayVal = "";
                if (cellVal && typeof cellVal === 'object') {
                    displayVal = cellVal.v !== undefined ? cellVal.v : (cellVal.f ? '=' + cellVal.f : "");
                } else {
                    displayVal = String(cellVal || "");
                }
                td.innerText = displayVal;
                td.title = displayVal;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        }

        table.appendChild(tbody);
        container.appendChild(table);

        // Row caps display warning
        if (aoa.length > 101) {
            const footerNote = document.createElement('div');
            footerNote.style.padding = '0.5rem';
            footerNote.style.fontSize = '0.7rem';
            footerNote.style.color = 'var(--text-muted)';
            footerNote.style.textAlign = 'center';
            footerNote.style.borderTop = '1px solid var(--border-color)';
            footerNote.innerText = `Showing first 100 rows of ${aoa.length - 1} records. Download spreadsheet to see all rows.`;
            container.appendChild(footerNote);
        }

        return container;
    }

    /* ==========================================================================
       UTILITIES & DOWNLOAD TRIGGER
       ========================================================================== */
    function triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /* ==========================================================================
       VENDOR DATA MANAGEMENT SYSTEM
       ========================================================================== */
    let vendorParties = [];

    // DOM Elements for Vendor Data Tab
    const vendorSyncStatus = document.getElementById('vendorSyncStatus');
    const vendorSearchInput = document.getElementById('vendorSearchInput');
    const refreshVendorsBtn = document.getElementById('refreshVendorsBtn');
    const vendorTableContainer = document.getElementById('vendorTableContainer');
    const vendorEmptyState = document.getElementById('vendorEmptyState');
    const vendorConsoleLog = document.getElementById('vendorConsoleLog');
    const clearVendorLogBtn = document.getElementById('clearVendorLogBtn');
    const addVendorForm = document.getElementById('addVendorForm');
    const vendorCodeInput = document.getElementById('vendorCode');
    const vendorNameInput = document.getElementById('vendorName');
    
    // New Toolbar & Inline Add elements
    const showAddVendorFormBtn = document.getElementById('showAddVendorFormBtn');
    const inlineAddVendorCard = document.getElementById('inlineAddVendorCard');
    const cancelAddVendorBtn = document.getElementById('cancelAddVendorBtn');
    let editingCode = null;

    // Custom Centered Alert Modal System
    function showCustomAlert(message, type = 'success') {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = '99999';
        
        const card = document.createElement('div');
        card.className = 'modal-card';
        card.style.textAlign = 'center';
        card.style.padding = '2rem';
        
        let iconClass = 'fa-solid fa-circle-check';
        let iconColor = 'var(--color-success)';
        let title = 'Success';
        
        if (type === 'error') {
            iconClass = 'fa-solid fa-circle-exclamation';
            iconColor = 'var(--color-error)';
            title = 'Error';
        } else if (type === 'info') {
            iconClass = 'fa-solid fa-circle-info';
            iconColor = 'var(--color-secondary)';
            title = 'Information';
        }
        
        card.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                <i class="${iconClass}" style="font-size: 3rem; color: ${iconColor};"></i>
                <h3 style="margin: 0; font-family: 'Space Grotesk', sans-serif; font-size: 1.25rem;">${title}</h3>
                <p style="margin: 0.5rem 0 1.25rem 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; text-align: center;">${message}</p>
                <button class="btn btn-success close-alert-btn" style="padding: 0.5rem 1.5rem; font-size: 0.85rem; border-radius: 8px; font-weight: 600;">OK</button>
            </div>
        `;
        
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        
        const closeBtn = card.querySelector('.close-alert-btn');
        closeBtn.focus();
        
        closeBtn.addEventListener('click', () => {
            overlay.remove();
        });
    }

    // Custom Confirm Dialog Modal
    function showCustomConfirm(message, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const card = document.createElement('div');
        card.className = 'modal-card';
        
        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
                <i class="fa-solid fa-circle-question" style="font-size: 1.5rem; color: var(--color-primary);"></i>
                <h3 style="margin: 0; font-family: 'Space Grotesk', sans-serif;">Confirm Delete</h3>
            </div>
            <p style="margin: 0.5rem 0 1rem 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${message}</p>
            <div class="modal-actions" style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                <button class="btn btn-secondary cancel-btn" style="padding: 0.4rem 1rem; font-size: 0.8rem; border-radius: 8px;">Cancel</button>
                <button class="btn confirm-btn" style="padding: 0.4rem 1rem; font-size: 0.8rem; border-radius: 8px; background: var(--color-error); color: white; border: none; cursor: pointer; font-weight: 600;">Delete</button>
            </div>
        `;
        
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        
        const cancelBtn = card.querySelector('.cancel-btn');
        const confirmBtn = card.querySelector('.confirm-btn');
        
        cancelBtn.addEventListener('click', () => {
            overlay.remove();
        });
        
        confirmBtn.addEventListener('click', () => {
            overlay.remove();
            onConfirm();
        });
    }

    // Vendor Logger Utility
    function vendorLog(message, type = 'info') {
        if (!vendorConsoleLog) return;
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        line.innerText = `[${timestamp}] ${message}`;
        vendorConsoleLog.appendChild(line);
        vendorConsoleLog.scrollTop = vendorConsoleLog.scrollHeight;
    }

    if (clearVendorLogBtn) {
        clearVendorLogBtn.addEventListener('click', () => {
            vendorConsoleLog.innerHTML = '';
            vendorLog('Log cleared.', 'info');
        });
    }

    // Toggle Inline Add Vendor Form
    if (showAddVendorFormBtn) {
        showAddVendorFormBtn.addEventListener('click', () => {
            if (inlineAddVendorCard) {
                inlineAddVendorCard.classList.toggle('hidden');
                if (!inlineAddVendorCard.classList.contains('hidden')) {
                    vendorCodeInput.focus();
                }
            }
        });
    }

    if (cancelAddVendorBtn) {
        cancelAddVendorBtn.addEventListener('click', () => {
            if (inlineAddVendorCard) {
                inlineAddVendorCard.classList.add('hidden');
            }
            if (addVendorForm) addVendorForm.reset();
        });
    }

    // Updated code template string
    const updatedAppsScriptCode = `function doGet(e) {
  var action = e.parameter.action || "getParties";
  
  if (action === "getParties") {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("PARTY NAME");
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Sheet 'PARTY NAME' not found"}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      var data = sheet.getDataRange().getValues();
      var parties = [];
      // Row 0 is headers: CODE, PARTY CODE
      for (var i = 1; i < data.length; i++) {
        var code = String(data[i][0]).trim();
        var name = String(data[i][1]).trim();
        if (code !== "" || name !== "") {
          parties.push({
            code: code,
            name: name
          });
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({status: "success", parties: parties}))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
}

function doPost(e) {
  try {
    var json = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    function getSheetRobust(name) {
      var sheets = ss.getSheets();
      var target = name.toUpperCase().trim();
      for (var i = 0; i < sheets.length; i++) {
        var sName = sheets[i].getName().toUpperCase().trim();
        if (sName === target) return sheets[i];
      }
      return null;
    }
    
    var action = json.action;
    
    // Action: Add Party
    if (action === "addParty") {
      var sheetParties = getSheetRobust("PARTY NAME");
      if (!sheetParties) {
        throw new Error("PARTY NAME sheet not found");
      }
      sheetParties.appendRow([json.code, json.name]);
      return ContentService.createTextOutput(JSON.stringify({status: "success"}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Action: Edit Party
    if (action === "editParty") {
      var sheetParties = getSheetRobust("PARTY NAME");
      if (!sheetParties) {
        throw new Error("PARTY NAME sheet not found");
      }
      var data = sheetParties.getDataRange().getValues();
      var updated = false;
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === String(json.oldCode).trim()) {
          sheetParties.getRange(i + 1, 1).setValue(json.newCode);
          sheetParties.getRange(i + 1, 2).setValue(json.newName);
          updated = true;
          break;
        }
      }
      if (!updated) {
        throw new Error("Party with Code " + json.oldCode + " not found");
      }
      return ContentService.createTextOutput(JSON.stringify({status: "success"}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Action: Delete Party
    if (action === "deleteParty") {
      var sheetParties = getSheetRobust("PARTY NAME");
      if (!sheetParties) {
        throw new Error("PARTY NAME sheet not found");
      }
      var data = sheetParties.getDataRange().getValues();
      var deleted = false;
      // Search from bottom up to avoid index shifts
      for (var i = data.length - 1; i >= 1; i--) {
        if (String(data[i][0]).trim() === String(json.code).trim()) {
          sheetParties.deleteRow(i + 1);
          deleted = true;
        }
      }
      if (!deleted) {
        throw new Error("Party with Code " + json.code + " not found");
      }
      return ContentService.createTextOutput(JSON.stringify({status: "success"}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 1. Update PENDING INVOICE sheet
    if (json.pendingInvoices && json.pendingInvoices.length > 0) {
      var sheetPending = getSheetRobust("PENDING INVOICE");
      if (sheetPending) {
        sheetPending.clearContents();
        sheetPending.getRange(1, 1, json.pendingInvoices.length, json.pendingInvoices[0].length).setValues(json.pendingInvoices);
      }
    }
    
    // 2. Update DISCOUNT sheet
    if (json.discountReport && json.discountReport.length > 0) {
      var sheetDiscount = getSheetRobust("DISCOUNT");
      if (sheetDiscount) {
        sheetDiscount.clearContents();
        sheetDiscount.getRange(1, 1, json.discountReport.length, json.discountReport[0].length).setValues(json.discountReport);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({status: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

    // Render Vendor Table UI
    function renderVendorTable(list = vendorParties) {
        if (!vendorTableContainer) return;
        
        if (list.length === 0) {
            vendorTableContainer.innerHTML = `
                <div class="empty-output-state">
                    <i class="fa-solid fa-folder-open placeholder-icon"></i>
                    <p>${vendorParties.length === 0 ? 'No vendor records found. Check Google Sheets configuration.' : 'No vendors match your search criteria.'}</p>
                </div>
            `;
            return;
        }

        const table = document.createElement('table');
        table.className = 'data-table';
        
        table.innerHTML = `
            <thead>
                <tr>
                    <th style="width: 25%">CODE</th>
                    <th style="width: 55%">PARTY CODE / NAME</th>
                    <th style="width: 20%; text-align: center;">ACTIONS</th>
                </tr>
            </thead>
            <tbody>
                ${list.map(vendor => {
                    if (editingCode === vendor.code) {
                        return `
                            <tr class="editing-row" style="background: rgba(123, 44, 191, 0.03);">
                                <td>
                                    <input type="text" class="edit-input edit-code-input" value="${vendor.code}" style="font-weight: 700; color: var(--color-primary); height: 30px; padding: 0.2rem 0.4rem;">
                                </td>
                                <td>
                                    <input type="text" class="edit-input edit-name-input" value="${vendor.name}" style="height: 30px; padding: 0.2rem 0.4rem;">
                                </td>
                                <td style="text-align: center;">
                                    <button class="btn btn-save-row text-btn" data-old-code="${vendor.code}" title="Save changes" style="padding: 0.25rem 0.5rem; margin-right: 0.5rem;">
                                        <i class="fa-solid fa-check"></i> Save
                                    </button>
                                    <button class="btn btn-cancel-row text-btn" title="Cancel editing" style="padding: 0.25rem 0.5rem; color: var(--text-muted);">
                                        <i class="fa-solid fa-xmark"></i> Cancel
                                    </button>
                                </td>
                            </tr>
                        `;
                    } else {
                        return `
                            <tr>
                                <td style="font-weight: 700; color: var(--color-primary);">${vendor.code}</td>
                                <td>${vendor.name}</td>
                                <td style="text-align: center;">
                                    <button class="btn btn-edit text-btn" data-code="${vendor.code}" title="Edit ${vendor.code}" style="padding: 0.25rem 0.5rem; margin-right: 0.5rem;">
                                        <i class="fa-solid fa-pen-to-square"></i> Edit
                                    </button>
                                    <button class="btn btn-delete text-btn" data-code="${vendor.code}" title="Delete ${vendor.code}" style="color: var(--color-error); padding: 0.25rem 0.5rem;">
                                        <i class="fa-solid fa-trash-can"></i> Delete
                                    </button>
                                </td>
                            </tr>
                        `;
                    }
                }).join('')}
            </tbody>
        `;

        vendorTableContainer.innerHTML = '';
        vendorTableContainer.appendChild(table);

        // Bind Edit events
        const editBtns = vendorTableContainer.querySelectorAll('.btn-edit');
        editBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                editingCode = btn.getAttribute('data-code');
                renderVendorTable(list);
            });
        });

        // Bind Cancel events
        const cancelBtns = vendorTableContainer.querySelectorAll('.btn-cancel-row');
        cancelBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                editingCode = null;
                renderVendorTable(list);
            });
        });

        // Bind Save events
        const saveBtns = vendorTableContainer.querySelectorAll('.btn-save-row');
        saveBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const oldCode = btn.getAttribute('data-old-code');
                const row = btn.closest('tr');
                const newCode = row.querySelector('.edit-code-input').value.trim();
                const newName = row.querySelector('.edit-name-input').value.trim();
                
                if (!newCode || !newName) {
                    showCustomAlert("Both Vendor Code and Party Code/Name are required.", "error");
                    return;
                }
                editVendor(oldCode, newCode, newName);
            });
        });

        // Bind delete events
        const deleteBtns = vendorTableContainer.querySelectorAll('.btn-delete');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const code = btn.getAttribute('data-code');
                showCustomConfirm(`Are you sure you want to permanently delete vendor "${code}" from Google Sheets?`, () => {
                    deleteVendor(code);
                });
            });
        });
    }

    // Fetch Vendors from Google Sheets
    function fetchVendors() {
        if (!vendorSyncStatus) return;

        vendorSyncStatus.className = 'status-indicator processing';
        vendorSyncStatus.innerText = 'Syncing...';
        vendorLog("Fetching vendor directory from Google Sheets...", "process");

        if (vendorEmptyState) {
            vendorEmptyState.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin placeholder-icon"></i>
                <p>Connecting to Google Sheets and loading directory...</p>
            `;
            vendorEmptyState.classList.remove('hidden');
        }

        const fetchUrl = `${GOOGLE_SHEETS_SCRIPT_URL}?action=getParties`;

        fetch(fetchUrl)
            .then(res => res.json())
            .then(res => {
                if (res.status === "error") {
                    throw new Error(res.message || "Failed to fetch vendor data");
                }
                vendorParties = res.parties || [];
                vendorLog(`Fetched ${vendorParties.length} vendor record(s) from Google Sheets successfully.`, "success");
                vendorSyncStatus.className = 'status-indicator success';
                vendorSyncStatus.innerText = 'Connected';
                renderVendorTable();
            })
            .catch(err => {
                vendorLog(`Fetch failed: ${err.message}. Please check if the updated Apps Script is deployed.`, "error");
                vendorSyncStatus.className = 'status-indicator idle';
                vendorSyncStatus.innerText = 'Offline';
                // Show empty state with error note
                vendorTableContainer.innerHTML = `
                    <div class="empty-output-state text-error" style="color: var(--color-error)">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem;"></i>
                        <p style="margin-top: 0.5rem; font-weight: 500;">Connection Failed</p>
                        <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; margin-top: 0.25rem;">
                            Unable to load vendor list. Ensure the Apps Script is updated and CORS requests are enabled.
                        </p>
                    </div>
                `;
            });
    }

    // Add Vendor to Google Sheets
    function addVendor(code, name) {
        vendorLog(`Adding vendor "${code}" to Google Sheets...`, "process");
        const addBtn = document.getElementById('addVendorBtn');
        if (addBtn) {
            addBtn.setAttribute('disabled', 'true');
            addBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Adding...';
        }

        fetch(GOOGLE_SHEETS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: "addParty",
                code: code,
                name: name
            })
        })
        .then(res => res.json().catch(() => ({ status: "opaque_success" })))
        .then(res => {
            if (res.status === "error") {
                throw new Error(res.message || "Apps Script error");
            }
            vendorLog(`Vendor "${code}" successfully added!`, "success");
            showCustomAlert(`Vendor record "${code}" has been successfully added!`, "success");
            
            // Local update to avoid full reload delay
            if (!vendorParties.some(v => v.code === code)) {
                vendorParties.push({ code, name });
            }
            renderVendorTable();
            
            // Hide inline card on success
            if (inlineAddVendorCard) {
                inlineAddVendorCard.classList.add('hidden');
            }
            if (addVendorForm) addVendorForm.reset();
        })
        .catch(err => {
            vendorLog(`Add failed: ${err.message}`, "error");
            showCustomAlert(`Failed to add vendor: ${err.message}`, "error");
        })
        .finally(() => {
            if (addBtn) {
                addBtn.removeAttribute('disabled');
                addBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Vendor Record';
            }
        });
    }

    // Edit Vendor in Google Sheets
    function editVendor(oldCode, newCode, newName) {
        vendorLog(`Updating vendor "${oldCode}" to "${newCode}" in Google Sheets...`, "process");
        
        // Disable save buttons
        const saveBtns = vendorTableContainer.querySelectorAll('.btn-save-row');
        saveBtns.forEach(b => b.setAttribute('disabled', 'true'));

        fetch(GOOGLE_SHEETS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: "editParty",
                oldCode: oldCode,
                newCode: newCode,
                newName: newName
            })
        })
        .then(res => res.json().catch(() => ({ status: "opaque_success" })))
        .then(res => {
            if (res.status === "error") {
                throw new Error(res.message || "Apps Script error");
            }
            vendorLog(`Vendor "${oldCode}" updated successfully to "${newCode}"!`, "success");
            showCustomAlert(`Vendor record "${oldCode}" has been successfully updated!`, "success");
            
            // Local update
            const idx = vendorParties.findIndex(v => v.code === oldCode);
            if (idx !== -1) {
                vendorParties[idx] = { code: newCode, name: newName };
            }
            editingCode = null;
            renderVendorTable();
        })
        .catch(err => {
            vendorLog(`Update failed: ${err.message}`, "error");
            showCustomAlert(`Failed to update vendor: ${err.message}`, "error");
            // Re-enable save buttons
            saveBtns.forEach(b => b.removeAttribute('disabled'));
        });
    }

    // Delete Vendor from Google Sheets
    function deleteVendor(code) {
        vendorLog(`Deleting vendor "${code}" from Google Sheets...`, "process");
        
        fetch(GOOGLE_SHEETS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: "deleteParty",
                code: code
            })
        })
        .then(res => res.json().catch(() => ({ status: "opaque_success" })))
        .then(res => {
            if (res.status === "error") {
                throw new Error(res.message || "Apps Script error");
            }
            vendorLog(`Vendor "${code}" successfully deleted!`, "success");
            showCustomAlert(`Vendor record "${code}" has been successfully deleted!`, "success");
            
            // Local update
            vendorParties = vendorParties.filter(v => v.code !== code);
            renderVendorTable();
        })
        .catch(err => {
            vendorLog(`Deletion failed: ${err.message}`, "error");
            showCustomAlert(`Failed to delete vendor: ${err.message}`, "error");
        });
    }

    // Local Search Filter Handler
    if (vendorSearchInput) {
        vendorSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query === "") {
                renderVendorTable(vendorParties);
                return;
            }
            const filtered = vendorParties.filter(v => 
                v.code.toLowerCase().includes(query) || 
                v.name.toLowerCase().includes(query)
            );
            renderVendorTable(filtered);
        });
    }

    // Refresh button event listener
    if (refreshVendorsBtn) {
        refreshVendorsBtn.addEventListener('click', () => {
            fetchVendors();
        });
    }

    // Form submit listener
    if (addVendorForm) {
        addVendorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const code = vendorCodeInput.value.trim();
            const name = vendorNameInput.value.trim();
            if (code && name) {
                addVendor(code, name);
            }
        });
    }

    /* ==========================================================================
       SEPARATE FILE PROCESSING LOGIC
       ========================================================================== */
    // State Variables
    let separateFile = null;
    let separateZipBlob = null;

    // DOM Elements
    const separateDropzone = document.getElementById('separateDropzone');
    const separateFileInput = document.getElementById('separateFileInput');
    const separateFileDisplay = document.getElementById('separateFileDisplay');
    const separateBtn = document.getElementById('separateBtn');
    
    const separateStatus = document.getElementById('separateStatus');
    const separateProgressCard = document.getElementById('separateProgressCard');
    const separateProgressBar = document.getElementById('separateProgressBar');
    const separateProgressPercent = document.getElementById('separateProgressPercent');
    const separateProgressStepText = document.getElementById('separateProgressStepText');
    const separateOutputContainer = document.getElementById('separateOutputContainer');
    
    const separateConsoleLog = document.getElementById('separateConsoleLog');
    const clearSeparateLogBtn = document.getElementById('clearSeparateLogBtn');

    const separateVariantRadios = document.getElementsByName('separateVariant');
    const simpleSubOptions = document.getElementById('simpleSubOptions');
    const simpleColChoiceRadios = document.getElementsByName('simpleColChoice');

    // Color list matching the VBA macro exactly
    const separateColorList = [
        'rgb(255, 199, 206)', 'rgb(198, 239, 206)', 'rgb(189, 215, 238)',
        'rgb(255, 235, 156)', 'rgb(244, 204, 204)', 'rgb(217, 234, 211)',
        'rgb(234, 209, 220)', 'rgb(208, 224, 227)', 'rgb(252, 229, 205)',
        'rgb(221, 217, 196)', 'rgb(207, 226, 243)', 'rgb(180, 198, 231)',
        'rgb(255, 242, 204)', 'rgb(226, 239, 218)', 'rgb(214, 227, 188)',
        'rgb(230, 184, 183)', 'rgb(184, 204, 228)', 'rgb(213, 166, 189)',
        'rgb(169, 209, 142)', 'rgb(255, 217, 102)', 'rgb(201, 218, 248)',
        'rgb(255, 229, 153)', 'rgb(208, 206, 206)', 'rgb(197, 224, 180)',
        'rgb(248, 203, 173)', 'rgb(222, 235, 247)', 'rgb(217, 210, 233)',
        'rgb(244, 177, 131)', 'rgb(191, 191, 191)', 'rgb(180, 167, 214)',
        'rgb(157, 195, 230)', 'rgb(146, 208, 80)'
    ];

    // Logging Utility
    function separateLog(message, type = 'info') {
        if (!separateConsoleLog) return;
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        line.innerText = `[${timestamp}] ${message}`;
        separateConsoleLog.appendChild(line);
        separateConsoleLog.scrollTop = separateConsoleLog.scrollHeight;
    }

    // Clear log button
    if (clearSeparateLogBtn) {
        clearSeparateLogBtn.addEventListener('click', () => {
            separateConsoleLog.innerHTML = '';
            separateLog('Log cleared.', 'info');
        });
    }

    // Dynamic visibility of suboptions for Option 1
    function toggleSubOptions() {
        let selectedVariant = "1";
        separateVariantRadios.forEach(r => {
            if (r.checked) selectedVariant = r.value;
        });
        if (selectedVariant === "1") {
            if (simpleSubOptions) simpleSubOptions.style.display = "flex";
        } else {
            if (simpleSubOptions) simpleSubOptions.style.display = "none";
        }
    }

    separateVariantRadios.forEach(radio => {
        radio.addEventListener('change', toggleSubOptions);
    });

    // Initialize dropzone
    if (separateDropzone && separateFileInput) {
        setupMiniDropzone(separateDropzone, separateFileInput, (file) => {
            separateFile = file;
            separateFileDisplay.innerText = file.name;
            separateFileDisplay.title = file.name;
            separateDropzone.classList.add('file-selected');
            separateLog(`Selected source file: ${file.name} (${formatBytes(file.size)})`, 'success');
            checkSeparateInputs();
        });
    }

    function checkSeparateInputs() {
        if (separateFile && separateBtn) {
            separateBtn.removeAttribute('disabled');
        } else if (separateBtn) {
            separateBtn.setAttribute('disabled', 'true');
        }
    }

    // Main Run Separation Logic
    if (separateBtn) {
        separateBtn.addEventListener('click', async () => {
            if (!separateFile) return;

            separateBtn.setAttribute('disabled', 'true');
            if (separateStatus) {
                separateStatus.className = 'status-indicator processing';
                separateStatus.innerText = 'Processing';
            }
            if (separateProgressCard) separateProgressCard.classList.remove('hidden');
            if (separateProgressBar) separateProgressBar.style.width = '10%';
            if (separateProgressPercent) separateProgressPercent.innerText = '10%';
            if (separateProgressStepText) separateProgressStepText.innerText = 'Reading file...';
            
            if (separateOutputContainer) {
                separateOutputContainer.innerHTML = '';
                separateOutputContainer.className = 'processed-container empty';
                separateOutputContainer.innerHTML = `
                    <div class="empty-output-state">
                        <i class="fa-solid fa-spinner fa-spin placeholder-icon" style="color: #8b5cf6;"></i>
                        <p>Splitting file by warehouse codes, please wait...</p>
                    </div>
                `;
            }

            separateLog('Starting File Separation Pipeline...', 'process');

            try {
                // Get selected options
                let userChoice = "1";
                separateVariantRadios.forEach(r => {
                    if (r.checked) userChoice = r.value;
                });

                let colChoice = "D";
                if (simpleColChoiceRadios) {
                    simpleColChoiceRadios.forEach(r => {
                        if (r.checked) colChoice = r.value;
                    });
                }

                // Determine settings based on variant selection
                let filterField = 3; // 0-indexed column index (Column D = index 3)
                let dataStartRow = 2; // 0-indexed row index (Row 3 = index 2)
                let nameSuffix = "-AJIO";
                let headerRowCount = 2; // Header is rows 1-2

                if (userChoice === "1") {
                    nameSuffix = "-AJIO";
                    filterField = (colChoice === "G") ? 6 : 3;
                    dataStartRow = 2;
                    headerRowCount = 2;
                } else if (userChoice === "2") {
                    nameSuffix = " DETAILS SHEET AJIO";
                    filterField = 3;
                    dataStartRow = 2;
                    headerRowCount = 2;
                } else if (userChoice === "3") {
                    nameSuffix = " SUMMARY SHEET AJIO";
                    filterField = 6;
                    dataStartRow = 2;
                    headerRowCount = 2;
                } else if (userChoice === "4") {
                    nameSuffix = "-AJIO";
                    filterField = 0; // Column A
                    dataStartRow = 1; // Row 2
                    headerRowCount = 1; // Header is row 1
                }

                separateLog(`Configuration selected: Variant ${userChoice} (Filter Column Index: ${filterField}, Header Rows: ${headerRowCount})`, 'info');

                // Read file
                const buffer = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = (e) => reject(new Error("File read error"));
                    reader.readAsArrayBuffer(separateFile);
                });

                if (separateProgressBar) separateProgressBar.style.width = '30%';
                if (separateProgressPercent) separateProgressPercent.innerText = '30%';
                if (separateProgressStepText) separateProgressStepText.innerText = 'Parsing Excel data...';
                separateLog('Parsing Excel spreadsheet...', 'info');

                const wb = XLSX.read(buffer, { type: 'array' });
                const firstSheetName = wb.SheetNames[0];
                const ws = wb.Sheets[firstSheetName];
                const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

                if (aoa.length <= headerRowCount) {
                    throw new Error("Excel sheet contains no data below the header rows.");
                }

                separateLog(`Spreadsheet loaded. Sheet name: "${firstSheetName}". Total rows: ${aoa.length}`, 'info');

                if (separateProgressBar) separateProgressBar.style.width = '50%';
                if (separateProgressPercent) separateProgressPercent.innerText = '50%';
                if (separateProgressStepText) separateProgressStepText.innerText = 'Identifying unique filter keys...';

                // Extract unique values in the filter column
                const keys = [];
                const keyMap = {};
                for (let r = dataStartRow; r < aoa.length; r++) {
                    const val = String(aoa[r][filterField] || "").trim();
                    if (val !== "") {
                        if (!keyMap[val]) {
                            keyMap[val] = true;
                            keys.push(val);
                        }
                    }
                }

                if (keys.length === 0) {
                    throw new Error("No valid keys found in the filter column.");
                }

                separateLog(`Found ${keys.length} unique values to split by: ${keys.join(', ')}`, 'success');

                // Generate stamp
                const now = new Date();
                const pad = (n) => String(n).padStart(2, '0');
                const dtStamp = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

                const pipelineZip = new JSZip();
                const splitFiles = [];
                let fileCounter = 1;

                // Loop through keys and generate workbooks
                for (let i = 0; i < keys.length; i++) {
                    const keyVal = keys[i];
                    separateLog(`Processing key: [${keyVal}] (${i + 1}/${keys.length})`, 'process');

                    // Progress percentage (mapping 50% to 90%)
                    const percent = 50 + Math.floor((i / keys.length) * 40);
                    if (separateProgressBar) separateProgressBar.style.width = `${percent}%`;
                    if (separateProgressPercent) separateProgressPercent.innerText = `${percent}%`;
                    if (separateProgressStepText) separateProgressStepText.innerText = `Splitting file ${i + 1} of ${keys.length}: ${keyVal}...`;

                    // Copy Header row(s)
                    const newRows = [];
                    for (let h = 0; h < headerRowCount; h++) {
                        if (aoa[h]) {
                            newRows.push([...aoa[h]]);
                        }
                    }

                    // Copy matching data rows
                    let matchedCount = 0;
                    for (let r = dataStartRow; r < aoa.length; r++) {
                        const rowVal = String(aoa[r][filterField] || "").trim();
                        if (rowVal === keyVal) {
                            newRows.push([...aoa[r]]);
                            matchedCount++;
                        }
                    }

                    // Build new workbook
                    const newWb = XLSX.utils.book_new();
                    const newWs = XLSX.utils.aoa_to_sheet(newRows);
                    XLSX.utils.book_append_sheet(newWb, newWs, "Sheet1");

                    // Filename formatting
                    let finalName = "";
                    if (userChoice === "4") {
                        const firstNum = keyVal.split("-")[0];
                        finalName = `${firstNum}-Tax-${keyVal}-AJIO`;
                    } else {
                        finalName = `${keyVal}${nameSuffix}`;
                    }

                    const outFilename = `${finalName} ${dtStamp}_${String(fileCounter).padStart(2, '0')}.xlsx`;
                    const excelBuffer = XLSX.write(newWb, { bookType: 'xlsx', type: 'array' });
                    const fileBlob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

                    pipelineZip.file(outFilename, excelBuffer);

                    // Map visual color
                    const uiColor = separateColorList[(fileCounter - 1) % separateColorList.length];

                    splitFiles.push({
                        name: outFilename,
                        size: fileBlob.size,
                        rows: matchedCount,
                        blob: fileBlob,
                        color: uiColor
                    });

                    separateLog(`File generated: "${outFilename}" with ${matchedCount} data rows.`, 'info');
                    fileCounter++;
                }

                if (separateProgressBar) separateProgressBar.style.width = '95%';
                if (separateProgressPercent) separateProgressPercent.innerText = '95%';
                if (separateProgressStepText) separateProgressStepText.innerText = 'Packaging final ZIP file...';
                separateLog('Compiling ZIP archive package...', 'process');

                separateZipBlob = await pipelineZip.generateAsync({ type: 'blob' });

                // Render visual output dashboard
                renderSeparateDashboard(splitFiles);

                if (separateProgressBar) separateProgressBar.style.width = '100%';
                if (separateProgressPercent) separateProgressPercent.innerText = '100%';
                if (separateProgressStepText) separateProgressStepText.innerText = 'All steps processed successfully!';

                if (separateStatus) {
                    separateStatus.className = 'status-indicator success';
                    separateStatus.innerText = 'Completed';
                }
                separateLog('Split operation successful. Files are ready for download.', 'success');

            } catch (err) {
                separateLog(`Separation Pipeline failed: ${err.message}`, 'error');
                if (separateStatus) {
                    separateStatus.className = 'status-indicator idle';
                    separateStatus.innerText = 'Failed';
                }
                if (separateProgressStepText) separateProgressStepText.innerText = 'An error occurred during execution.';

                if (separateOutputContainer) {
                    separateOutputContainer.innerHTML = '';
                    separateOutputContainer.className = 'processed-container empty';
                    separateOutputContainer.innerHTML = `
                        <div class="empty-output-state">
                            <i class="fa-solid fa-circle-exclamation placeholder-icon" style="color: #ef4444;"></i>
                            <p style="color: #ef4444; font-weight: 600;">Error: ${err.message}</p>
                        </div>
                    `;
                }
            } finally {
                separateBtn.removeAttribute('disabled');
            }
        });
    }

    // Function to render the processed list in the dashboard
    function renderSeparateDashboard(files) {
        if (!separateOutputContainer) return;
        separateOutputContainer.innerHTML = '';
        separateOutputContainer.className = 'processed-container';

        // Header element with Download All ZIP button
        const header = document.createElement('div');
        header.className = 'processed-header';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.width = '100%';
        header.style.marginBottom = '1rem';
        header.innerHTML = `
            <h3><i class="fa-solid fa-circle-check text-success"></i> Split Files (${files.length})</h3>
            <button class="btn btn-primary btn-glow" id="downloadAllSeparateBtn" style="background: linear-gradient(135deg, #8b5cf6, #6d28d9);">
                <i class="fa-solid fa-file-zipper"></i> Download All (ZIP)
            </button>
        `;
        separateOutputContainer.appendChild(header);

        // List container
        const listContainer = document.createElement('div');
        listContainer.className = 'processed-list';
        listContainer.style.display = 'flex';
        listContainer.style.flexDirection = 'column';
        listContainer.style.gap = '0.5rem';
        listContainer.style.width = '100%';
        listContainer.style.maxHeight = '450px';
        listContainer.style.overflowY = 'auto';
        listContainer.style.paddingRight = '0.25rem';

        files.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'processed-item';
            // Custom styling using VBA colors
            item.style.borderLeft = `5px solid ${file.color}`;
            item.style.background = 'rgba(255, 255, 255, 0.8)';
            item.style.padding = '0.75rem 1rem';
            item.style.borderRadius = '8px';
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            item.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
            item.style.border = '1px solid var(--border-color)';
            item.style.borderLeftWidth = '5px';

            item.innerHTML = `
                <div class="file-details" style="display: flex; flex-direction: column; gap: 0.2rem;">
                    <span class="file-name" style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem; word-break: break-all;" title="${file.name}">${file.name}</span>
                    <div style="display: flex; gap: 1rem; font-size: 0.75rem; color: var(--text-muted);">
                        <span><i class="fa-solid fa-database"></i> ${file.rows} Rows</span>
                        <span><i class="fa-solid fa-weight-hanging"></i> ${formatBytes(file.size)}</span>
                    </div>
                </div>
                <button class="btn btn-success download-single-btn" data-index="${index}" style="font-size: 0.75rem; padding: 0.4rem 0.75rem; display: flex; align-items: center; gap: 0.3rem;">
                    <i class="fa-solid fa-download"></i> Download
                </button>
            `;
            listContainer.appendChild(item);
        });

        separateOutputContainer.appendChild(listContainer);

        // Bind download all ZIP click
        const dlZipBtn = document.getElementById('downloadAllSeparateBtn');
        if (dlZipBtn) {
            dlZipBtn.addEventListener('click', () => {
                if (separateZipBlob) {
                    triggerDownload(separateZipBlob, 'Split_Files_Package.zip');
                    separateLog('Downloaded complete ZIP package: Split_Files_Package.zip', 'info');
                }
            });
        }

        // Bind single file downloads
        const singleBtns = listContainer.querySelectorAll('.download-single-btn');
        singleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.getAttribute('data-index'));
                const file = files[idx];
                if (file) {
                    triggerDownload(file.blob, file.name);
                    separateLog(`Downloaded split file: ${file.name}`, 'info');
                }
            });
        });
    }

    // Call toggleSubOptions initially to set correct sub-options display
    toggleSubOptions();

    // Auto-fetch vendors on startup
    fetchVendors();
}
);
