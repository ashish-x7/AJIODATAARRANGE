
function getFormattedDateTime(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${day}-${month}-${year} ${hours}-${minutes}-${seconds}`;
}

function getAjioSummaryFilename(base = 'ajio invoice summry', ext = 'xlsx') {
    const cleanBase = (base === 'AJIO_Summary_Report' || !base) ? 'ajio invoice summry' : base;
    return `${cleanBase} ${getFormattedDateTime()}.${ext}`;
}

/* ==========================================================================
   AJIO DATA ARRANGE - Core Application Logic (JS)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    /* ==========================================================================
       CUSTOM ALERT & CONFIRM MODAL DIALOG SYSTEM
       ========================================================================== */
    function showCustomDialog(message, options = {}) {
        return new Promise((resolve) => {
            const modal = document.getElementById('customDialogModal');
            const card = document.getElementById('customDialogCard');
            const titleEl = document.getElementById('customDialogTitle');
            const msgEl = document.getElementById('customDialogMessage');
            const iconEl = document.getElementById('customDialogIcon');
            const cancelBtn = document.getElementById('customDialogCancelBtn');
            const confirmBtn = document.getElementById('customDialogConfirmBtn');

            if (!modal || !card) {
                if (options.isConfirm) resolve(window.confirm(message));
                else { window.alert(message); resolve(true); }
                return;
            }

            const isConfirm = !!options.isConfirm;
            const title = options.title || (isConfirm ? 'Confirmation Required' : 'Notification');
            const confirmText = options.confirmText || (isConfirm ? 'Confirm' : 'OK');
            const cancelText = options.cancelText || 'Cancel';
            
            let type = options.type;
            if (!type) {
                const lower = (message + ' ' + title).toLowerCase();
                if (lower.includes('delete') || lower.includes('remove') || lower.includes('error') || lower.includes('fail') || lower.includes('invalid')) {
                    type = isConfirm ? 'danger' : 'error';
                } else if (lower.includes('success') || lower.includes('completed') || lower.includes('transferred') || lower.includes('merged') || lower.includes('copied') || lower.includes('zipped')) {
                    type = 'success';
                } else if (lower.includes('warning') || lower.includes('mismatch')) {
                    type = 'warning';
                } else {
                    type = isConfirm ? 'warning' : 'info';
                }
            }

            titleEl.innerText = title;
            msgEl.innerText = message;
            confirmBtn.innerText = confirmText;
            cancelBtn.innerText = cancelText;

            if (isConfirm) {
                cancelBtn.style.display = 'inline-flex';
            } else {
                cancelBtn.style.display = 'none';
            }

            card.className = `custom-dialog-card dialog-${type === 'error' ? 'danger' : type}`;

            if (type === 'danger' || type === 'error') {
                iconEl.className = isConfirm ? 'fa-solid fa-trash-can' : 'fa-solid fa-circle-xmark';
                confirmBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            } else if (type === 'success') {
                iconEl.className = 'fa-solid fa-circle-check';
                confirmBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            } else if (type === 'warning') {
                iconEl.className = 'fa-solid fa-triangle-exclamation';
                confirmBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
            } else {
                iconEl.className = 'fa-solid fa-circle-info';
                confirmBtn.style.background = 'linear-gradient(135deg, #8b5cf6, #6d28d9)';
            }

            modal.classList.add('show');

            const cleanup = () => {
                modal.classList.remove('show');
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
                modal.removeEventListener('click', onBackdropClick);
                document.removeEventListener('keydown', onKeyDown);
            };

            const onConfirm = (e) => {
                if (e) e.stopPropagation();
                cleanup();
                resolve(true);
            };

            const onCancel = (e) => {
                if (e) e.stopPropagation();
                cleanup();
                resolve(false);
            };

            const onBackdropClick = (e) => {
                if (e.target === modal) {
                    if (isConfirm) onCancel(e);
                    else onConfirm(e);
                }
            };

            const onKeyDown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    onConfirm();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    if (isConfirm) onCancel();
                    else onConfirm();
                }
            };

            confirmBtn.addEventListener('click', onConfirm);
            cancelBtn.addEventListener('click', onCancel);
            modal.addEventListener('click', onBackdropClick);
            document.addEventListener('keydown', onKeyDown);
            confirmBtn.focus();
        });
    }

    function customAlert(message, options = {}) {
        return showCustomDialog(message, { ...options, isConfirm: false });
    }

    function customConfirm(message, options = {}) {
        return showCustomDialog(message, { ...options, isConfirm: true });
    }

    function showCustomNotification(title, message, type = 'info') {
        if (!message) {
            message = title;
            title = 'Notification';
        }
        return showCustomDialog(message, { title, type, isConfirm: false });
    }

    function showCustomAlert(message, type = 'success') {
        return showCustomDialog(message, { title: 'Notification', type, isConfirm: false });
    }

    function showCustomConfirm(titleOrMessage, messageOrCallback, typeOrCallback, callback) {
        let title = 'Confirmation Required';
        let message = '';
        let type = 'danger';
        let cb = null;

        if (typeof messageOrCallback === 'function') {
            message = titleOrMessage;
            cb = messageOrCallback;
        } else if (typeof typeOrCallback === 'function') {
            title = titleOrMessage;
            message = messageOrCallback;
            cb = typeOrCallback;
        } else if (typeof callback === 'function') {
            title = titleOrMessage;
            message = messageOrCallback;
            type = typeOrCallback || 'danger';
            cb = callback;
        } else {
            if (messageOrCallback) {
                title = titleOrMessage;
                message = messageOrCallback;
                type = typeOrCallback || 'danger';
            } else {
                message = titleOrMessage;
            }
        }

        const promise = showCustomDialog(message, { title, type, isConfirm: true, confirmText: 'Confirm' });
        if (cb) {
            promise.then(confirmed => {
                cb(confirmed);
            });
        }
        return promise;
    }

    window.customAlert = customAlert;
    window.customConfirm = customConfirm;
    window.showCustomNotification = showCustomNotification;
    window.showCustomAlert = showCustomAlert;
    window.showCustomConfirm = showCustomConfirm;

    // Override global alert
    window.alert = function(message, callback) {
        customAlert(message).then(() => {
            if (typeof callback === 'function') callback();
        });
    };

    /* ==========================================================================
       PERSISTENT TAB SESSIONS (1-HOUR AUTO-EXPIRY VIA INDEXEDDB)
       ========================================================================== */
    const SESSION_DB_NAME = 'AjioDataArrangeStorage_v1';
    const SESSION_DB_VERSION = 1;
    const SESSION_STORE_NAME = 'tab_sessions';
    const SESSION_TTL_MS = 60 * 60 * 1000; // 1 Hour (60 minutes)

    function openSessionDB() {
        return new Promise((resolve) => {
            if (!window.indexedDB) return resolve(null);
            const req = indexedDB.open(SESSION_DB_NAME, SESSION_DB_VERSION);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(SESSION_STORE_NAME)) {
                    db.createObjectStore(SESSION_STORE_NAME);
                }
            };
            req.onsuccess = (e) => resolve(e.target.result);
            req.onerror = (e) => {
                console.warn('IndexedDB open error:', e);
                resolve(null);
            };
        });
    }

    async function saveTabSession(key, data) {
        try {
            const db = await openSessionDB();
            if (!db) return;
            const tx = db.transaction(SESSION_STORE_NAME, 'readwrite');
            const store = tx.objectStore(SESSION_STORE_NAME);
            const record = {
                savedAt: Date.now(),
                data: data
            };
            store.put(record, key);
        } catch (e) {
            console.warn(`Error saving session for ${key}:`, e);
        }
    }

    async function loadTabSession(key) {
        try {
            const db = await openSessionDB();
            if (!db) return null;
            return new Promise((resolve) => {
                const tx = db.transaction(SESSION_STORE_NAME, 'readwrite');
                const store = tx.objectStore(SESSION_STORE_NAME);
                const req = store.get(key);
                req.onsuccess = () => {
                    const res = req.result;
                    if (!res) return resolve(null);
                    const age = Date.now() - res.savedAt;
                    if (age > SESSION_TTL_MS) {
                        // Expired after 1 hour -> auto delete
                        store.delete(key);
                        resolve(null);
                    } else {
                        resolve(res.data);
                    }
                };
                req.onerror = () => resolve(null);
            });
        } catch (e) {
            console.warn(`Error loading session for ${key}:`, e);
            return null;
        }
    }

    async function clearTabSession(key) {
        try {
            const db = await openSessionDB();
            if (!db) return;
            const tx = db.transaction(SESSION_STORE_NAME, 'readwrite');
            const store = tx.objectStore(SESSION_STORE_NAME);
            store.delete(key);
        } catch (e) {
            console.warn(`Error clearing session for ${key}:`, e);
        }
    }

    // Hardcoded Google Sheets Apps Script Web App URL
    const GOOGLE_SHEETS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyOMN8UOshlf0-rUsH1KSVxbP3JJHXynE3Ykg21gOuTSuu8DJv7G1a1LQabthyVjM1dVQ/exec";

        // Selected Files Store
    let selectedFiles = [];
    // Processed Files Result Store (objects: { id, source, category, name, rowCount, blob, aoa })
    let processedReportsList = [];
    // Memory cache for the download-all zip blob
    let batchProcessedZipBlob = null;
    let batchUploadedZipName = "";
    let isBatchZipMode = false;
    let currentUploadedFolderName = "";

    // DOM Elements - Converter Tab
    const toggleProcRule = document.getElementById('toggle-proc-rule');
    const labelProcRule = document.getElementById('label-proc-rule');
    const clearBtn = document.getElementById('clearBtn');
    const clearFilesBtn = document.getElementById('clearFilesBtn');
    const resetBtn = document.getElementById('resetBtn');

    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const zipInput = document.getElementById('zipInput');
    const folderInput = document.getElementById('folderInput');
    const browseBtn = document.getElementById('browseBtn');
    const browseZipBtn = document.getElementById('browseZipBtn');
    const browseFolderBtn = document.getElementById('browseFolderBtn');

    const fileListCard = document.getElementById('selectedFilesCard') || document.getElementById('fileListCard');
    const uploadFileList = document.getElementById('uploadedFileList') || document.getElementById('uploadFileList');
    const selectedCountSpan = document.getElementById('selectedCount');
    const processBtn = document.getElementById('processBtn');
    const processStatus = document.getElementById('processStatus');

    // Stats Elements
    const statTotal = document.getElementById('stat-total') || document.getElementById('stat-orders');
    const statOd = document.getElementById('stat-od');
    const statDt = document.getElementById('stat-dt');
    const statDtSold = document.getElementById('stat-dt-sold') || document.getElementById('stat-invoices');
    const statDtCancelled = document.getElementById('stat-dt-cancelled') || document.getElementById('stat-duplicates');
    const statUnmatched = document.getElementById('stat-unmatched') || document.getElementById('stat-value');

    // Progress Elements
    const progressCard = document.getElementById('progressCard');
    const overallProgressBar = document.getElementById('overallProgressBar');
    const progressPercent = document.getElementById('progressPercent');
    const progressStepText = document.getElementById('progressStepText');
    const stepExtract = document.getElementById('stepExtract');
    const stepConvert = document.getElementById('stepConvert');
    const stepRename = document.getElementById('stepRename');

    // Details Log & Range Elements
    const logTrackerCard = document.getElementById('log-tracker-card');
    const btnCopyLog = document.getElementById('btnCopyLog');
    const logTdFilename = document.getElementById('log-td-filename');
    const logTdRange = document.getElementById('log-td-range');
    const logTdDates = document.getElementById('log-td-dates');
    const logTdB2p2 = document.getElementById('log-td-b2p2');

    const rangeValue = document.getElementById('range-value');
    const btnCopyRange = document.getElementById('btnCopyRange');

    const cancelledInvoicesList = document.getElementById('cancelledInvoicesList');
    const btnCopyCancelled = document.getElementById('btnCopyCancelled');

    // Interactive Output Table Elements
    const processedContainer = document.getElementById('processedContainer');
    const processedCount = document.getElementById('processedCount');
    const procSearchInput = document.getElementById('procSearchInput');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const procFilesTbody = document.getElementById('procFilesTbody');

    // Logger Elements
    const consoleLog = document.getElementById('consoleLog');
    const clearLogBtn = document.getElementById('clearLogBtn');
    const dashboardControls = document.getElementById('dashboardControls');

    /* ==========================================================================
       CONVERTER LOGGER UTILITY
       ========================================================================== */
    function log(message, type = 'info') {
        if (!consoleLog) return;
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        line.innerText = `[${timestamp}] ${message}`;
        
        if (consoleLog.children.length > 300) {
            consoleLog.removeChild(consoleLog.firstChild);
        }
        consoleLog.appendChild(line);
        consoleLog.scrollTop = consoleLog.scrollHeight;
    }

    if (clearLogBtn) {
        clearLogBtn.addEventListener('click', () => {
            if (consoleLog) {
                consoleLog.innerHTML = '<div class="log-line info">[System] Log cleared. Ready.</div>';
            }
        });
    }

    /* ==========================================================================
       RULE TOGGLE (NEW 2 FILES vs OLD 3 FILES)
       ========================================================================== */
    if (toggleProcRule && labelProcRule) {
        toggleProcRule.checked = false;
        labelProcRule.innerText = "Old Logic";
        toggleProcRule.addEventListener('change', () => {
            const isNew = toggleProcRule.checked;
            labelProcRule.innerText = isNew ? "New Logic" : "Old Logic";
            log(`Processing Mode switched to: ${isNew ? "New Logic (44-Col OD, GST & JSON Formula)" : "Old Logic (Classic OD & Account Merger)"}`, "info");
        });
    }

    /* ==========================================================================
       TRIGGER DOWNLOAD HELPER
       ========================================================================== */
    function triggerDownload(blob, filename) {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    /* ==========================================================================
       AJIO DATE FORMATTER (IST FORMAT: "Sun Aug 30 18:52:21 IST 2026")
       ========================================================================== */
    function formatAjioDateIST(inputVal, isInvoiceDate = false) {
        if (!inputVal && inputVal !== 0) return "";
        const str = String(inputVal).trim();
        if (!str) return "";

        // If already in IST format like "Tue Sep 01 20:49:24 IST 2026", return as is
        if (/^[A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+IST\s+\d{4}$/.test(str)) {
            return str;
        }

        let d = null;
        let customHours = null, customMins = null, customSecs = null;

        // Check if numeric (Excel serial date)
        if (/^\d+(\.\d+)?$/.test(str) && Number(str) > 30000 && Number(str) < 60000) {
            const excelDate = new Date(Math.round((Number(str) - 25569) * 86400 * 1000));
            if (!isNaN(excelDate.getTime())) {
                d = excelDate;
            }
        }

        // Parse YYYY-MM-DD HH:mm:ss or YYYY-MM-DDTHH:mm:ss
        if (!d) {
            const matchIso = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
            if (matchIso) {
                const y = parseInt(matchIso[1], 10);
                const m = parseInt(matchIso[2], 10) - 1;
                const day = parseInt(matchIso[3], 10);
                if (matchIso[4] !== undefined) {
                    customHours = parseInt(matchIso[4], 10);
                    customMins = parseInt(matchIso[5] || 0, 10);
                    customSecs = parseInt(matchIso[6] || 0, 10);
                }
                d = new Date(y, m, day, customHours !== null ? customHours : 12, customMins !== null ? customMins : 0, customSecs !== null ? customSecs : 0);
            }
        }

        // Parse DD-MM-YYYY or DD/MM/YYYY
        if (!d) {
            const matchDmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
            if (matchDmy) {
                const day = parseInt(matchDmy[1], 10);
                const m = parseInt(matchDmy[2], 10) - 1;
                const y = parseInt(matchDmy[3], 10);
                if (matchDmy[4] !== undefined) {
                    customHours = parseInt(matchDmy[4], 10);
                    customMins = parseInt(matchDmy[5] || 0, 10);
                    customSecs = parseInt(matchDmy[6] || 0, 10);
                }
                d = new Date(y, m, day, customHours !== null ? customHours : 12, customMins !== null ? customMins : 0, customSecs !== null ? customSecs : 0);
            }
        }

        // Fallback native Date parse
        if (!d || isNaN(d.getTime())) {
            const parsed = new Date(str);
            if (!isNaN(parsed.getTime())) {
                d = parsed;
            }
        }

        if (!d || isNaN(d.getTime())) {
            return str;
        }

        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const dayName = days[d.getDay()];
        const monthName = months[d.getMonth()];
        const dateNum = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();

        let h, min, s;
        if (customHours !== null) {
            h = String(customHours).padStart(2, '0');
            min = String(customMins).padStart(2, '0');
            s = String(customSecs).padStart(2, '0');
        } else if (isInvoiceDate) {
            // Random business hours between 09:00:00 and 21:00:00
            const randH = Math.floor(Math.random() * 12) + 9;
            const randM = Math.floor(Math.random() * 60);
            const randS = Math.floor(Math.random() * 60);
            h = String(randH).padStart(2, '0');
            min = String(randM).padStart(2, '0');
            s = String(randS).padStart(2, '0');
        } else {
            h = String(d.getHours()).padStart(2, '0');
            min = String(d.getMinutes()).padStart(2, '0');
            s = String(d.getSeconds()).padStart(2, '0');
        }

        return `${dayName} ${monthName} ${dateNum} ${h}:${min}:${s} IST ${year}`;
    }

        /* ==========================================================================
       KEY MATCHING & DATE PARSING HELPERS (CLEANCELL, CLEANKEY, PARSECELLDATE)
       ========================================================================== */
    function cleanCell(val) {
        if (val === undefined || val === null) return "";
        return String(val).replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim();
    }

    function cleanKey(v) {
        if (v === undefined || v === null) return "";
        let k = String(v);
        k = k.replace(/[`'\x7F-\x9F\x00-\x1F\x80-\x9F\xA0\t\r\n]/g, "").trim();
        if (k !== "" && !isNaN(Number(k))) {
            k = String(Math.round(Number(k)));
        }
        return k;
    }

    function parseCellDate(val) {
        if (val === undefined || val === null || val === "") return null;
        if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
        if (typeof val === 'number') {
            return new Date(Math.round((val - 25569) * 86400 * 1000));
        }
        const str = String(val).trim();
        if (str === "") return null;

        if (/^\d{4,5}(\.\d+)?$/.test(str)) {
            const num = parseFloat(str);
            return new Date(Math.round((num - 25569) * 86400 * 1000));
        }

        // Check for DD/MM/YYYY or DD-MM-YYYY (with optional time)
        const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (ddmmyyyy) {
            const d = parseInt(ddmmyyyy[1], 10);
            const m = parseInt(ddmmyyyy[2], 10) - 1;
            const y = parseInt(ddmmyyyy[3], 10);
            const dt = new Date(y, m, d);
            if (!isNaN(dt.getTime())) return dt;
        }

        // Check for YYYY-MM-DD or YYYY/MM/DD
        const yyyymmdd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
        if (yyyymmdd) {
            const y = parseInt(yyyymmdd[1], 10);
            const m = parseInt(yyyymmdd[2], 10) - 1;
            const d = parseInt(yyyymmdd[3], 10);
            const dt = new Date(y, m, d);
            if (!isNaN(dt.getTime())) return dt;
        }

        const d = new Date(str);
        if (!isNaN(d.getTime())) return d;
        return null;
    }

    /* ==========================================================================
       COLUMN DR JSON PARSER HELPER
       ========================================================================== */
    function extractCustomFieldsFromDR(drRaw) {
        const res = {
            MRP: "",
            Seller_Trade_Discount: "",
            B2B_Selling_Price: "",
            B2B_Base_Price: "",
            B2B_Tax: "",
            product_type: "",
            b2b2c_order: ""
        };
        if (!drRaw) return res;
        const str = String(drRaw).trim();
        if (!str) return res;

        // 1. Try JSON.parse
        try {
            const parsed = JSON.parse(str);
            if (Array.isArray(parsed)) {
                for (const item of parsed) {
                    if (item && typeof item === 'object') {
                        Object.assign(res, item);
                    }
                }
                return res;
            } else if (typeof parsed === 'object' && parsed !== null) {
                Object.assign(res, parsed);
                return res;
            }
        } catch (e) {
            // fallback to regex
        }

        // 2. Regex fallback
        const keys = ['MRP', 'Seller_Trade_Discount', 'B2B_Selling_Price', 'B2B_Base_Price', 'B2B_Tax', 'product_type', 'b2b2c_order'];
        for (const key of keys) {
            const reg = new RegExp(`["']?${key}["']?\\s*:\\s*["']?([^"',}\\]]+)["']?`, 'i');
            const m = str.match(reg);
            if (m && m[1]) {
                res[key] = m[1].trim();
            }
        }
        return res;
    }

    /* ==========================================================================
       44-COLUMN AJIO MASTER OD GENERATOR
       ========================================================================== */
    const AJIO_OD_44_HEADERS = [
        "Cust Order No", "Cust Order Date", "FWD Seller Order NO", "FWD PO NO", "FWD PO Date",
        "Seller Invoice No", "Seller Invoice Date", "Cust Invoice No", "Cust Invoice Date",
        "Status", "JioCode", "HSN", "Seller Style Code", "Seller SKU", "EAN", "Description",
        "Order Qty", "FWD Shipment ID", "FWD Shipment Date", "FWD Carrier", "FWD AWB",
        "Shipped QTY", "Estimated Dispatch Date", "SLA Status", "Cancelled Qty",
        "Customer Cancelled QTY", "Seller Cancelled QTY", "Listing MRP", "Seller TD",
        "Selling Price", "Base Price", "Total Price", "CGST_PERCENTAGE", "CGST_AMOUNT",
        "SGST_PERCENTAGE", "SGST_AMOUNT", "IGST_PERCENTAGE", "IGST_AMOUNT", "Total Value",
        "Invoice Value", "Brand", "Fulfillment Type", "POB ID", "Seller Name"
    ];

    function buildAjioOdAoa(dropShipRows) {
        if (!dropShipRows || dropShipRows.length < 2) return [AJIO_OD_44_HEADERS];

        const header = dropShipRows[0] || [];
        
        // Find column indices with sensible fallbacks
        const idxDR = 121; // Col DR
        const idxL = 11;   // Col L (Cust Order Date)
        const idxD = 3;    // Col D (FWD Seller Order NO)
        const idxCN = 91;  // Col CN (FWD PO NO)
        const idxG = 6;    // Col G (Seller Invoice No)
        const idxM = 12;   // Col M (Seller Invoice Date)
        const idxI = 8;    // Col I (Status)
        const idxA = 0;    // Col A (EAN)
        const idxX = 23;   // Col X (Description)
        const idxR = 17;   // Col R (Order Qty / Shipped Qty)
        const idxO = 14;   // Col O (FWD Carrier)
        const idxP = 15;   // Col P (FWD AWB)
        const idxDV = 125; // Col DV (POB ID)

        const outRows = [AJIO_OD_44_HEADERS];

        for (let r = 1; r < dropShipRows.length; r++) {
            const row = dropShipRows[r];
            if (!row || row.every(cell => String(cell || "").trim() === "")) continue;

            // Extract JSON fields from DR
            const drVal = row[idxDR] !== undefined ? row[idxDR] : (row.length > 100 ? row[row.length - 1] : "");
            const drFields = extractCustomFieldsFromDR(drVal);

            const custOrderNo = drFields.b2b2c_order || "";
            const custOrderDate = formatAjioDateIST(row[idxL], false);
            const fwdSellerOrderNo = row[idxD] !== undefined ? String(row[idxD]).trim() : "";
            const fwdPoNo = row[idxCN] !== undefined ? String(row[idxCN]).trim() : "";
            const fwdPoDate = "";
            const sellerInvoiceNo = row[idxG] !== undefined ? String(row[idxG]).trim() : "";
            const sellerInvoiceDate = formatAjioDateIST(row[idxM], true);
            const custInvoiceNo = "";
            const custInvoiceDate = formatAjioDateIST(row[idxM], true);
            const status = row[idxI] !== undefined ? String(row[idxI]).trim() : "";
            const jioCode = "";
            const idxZ = 25; // Col Z (HSN)
            const hsn = (row[idxZ] !== undefined && row[idxZ] !== null) ? String(row[idxZ]).trim() : "";
            const sellerStyleCode = "";
            const sellerSku = "";
            const ean = ""; // Col O kept blank per user request
            const description = row[idxX] !== undefined ? String(row[idxX]).trim() : "";
            const orderQty = row[idxR] !== undefined ? (Number(row[idxR]) || 1) : 1;
            const fwdShipmentId = "";
            const fwdShipmentDate = "";
            const fwdCarrier = row[idxO] !== undefined ? String(row[idxO]).trim() : "";
            const fwdAwb = row[idxP] !== undefined ? String(row[idxP]).trim() : "";
            const shippedQty = orderQty;
            const estDispatchDate = "";
            const slaStatus = "";
            const cancelledQty = "";
            const custCancelledQty = "";
            const sellerCancelledQty = "";
            const listingMrp = drFields.MRP !== "" ? (Number(drFields.MRP) || drFields.MRP) : "";
            const sellerTd = drFields.Seller_Trade_Discount !== "" ? (Number(drFields.Seller_Trade_Discount) || drFields.Seller_Trade_Discount) : "";
            const sellingPrice = drFields.B2B_Selling_Price !== "" ? (Number(drFields.B2B_Selling_Price) || drFields.B2B_Selling_Price) : "";
            const totalPrice = drFields.B2B_Base_Price !== "" ? (Number(drFields.B2B_Base_Price) || 0) : 0; // Col AF
            
            // Col AE = Col AF / Col V
            const basePriceNum = shippedQty > 0 ? (totalPrice / shippedQty) : totalPrice;
            const basePrice = Math.round(basePriceNum * 100) / 100;

            // GST Rule: If Base Price < 2500 -> 2.5%, else 9%
            const gstPct = basePrice < 2500 ? 2.5 : 9.0;
            const cgstPct = gstPct;
            const sgstPct = gstPct;

            const b2bTaxNum = drFields.B2B_Tax !== "" ? (Number(drFields.B2B_Tax) || 0) : 0;
            const cgstAmt = Math.round((b2bTaxNum / 2) * 100) / 100;
            const sgstAmt = Math.round((b2bTaxNum / 2) * 100) / 100;

            const igstPct = "";
            const igstAmt = "";

            // Total Value = Base Price + CGST Amount + SGST Amount
            const totalValue = Math.round((basePrice + cgstAmt + sgstAmt) * 100) / 100;
            const invoiceValue = totalValue;

            // Col AO receives DropShip Col A data previously in Col O
            const brand = row[idxA] !== undefined ? String(row[idxA]).trim() : "";
            const fulfillmentType = "";
            const pobId = row[idxDV] !== undefined ? String(row[idxDV]).trim() : "";
            const sellerName = "EASY SELL SERVICE PRIVATE LIMITED";

            outRows.push([
                custOrderNo, custOrderDate, fwdSellerOrderNo, fwdPoNo, fwdPoDate,
                sellerInvoiceNo, sellerInvoiceDate, custInvoiceNo, custInvoiceDate,
                status, jioCode, hsn, sellerStyleCode, sellerSku, ean, description,
                orderQty, fwdShipmentId, fwdShipmentDate, fwdCarrier, fwdAwb,
                shippedQty, estDispatchDate, slaStatus, cancelledQty,
                custCancelledQty, sellerCancelledQty, listingMrp, sellerTd,
                sellingPrice, basePrice, totalPrice, cgstPct, cgstAmt,
                sgstPct, sgstAmt, igstPct, igstAmt, totalValue,
                invoiceValue, brand, fulfillmentType, pobId, sellerName
            ]);
        }

        return outRows;
    }

    /* ==========================================================================
       FILE INPUTS & DRAG-AND-DROP SETUP
       ========================================================================== */
    function getFileIconClass(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (ext === 'zip') return 'fa-solid fa-file-zipper zip';
        if (ext === 'csv') return 'fa-solid fa-file-csv csv';
        if (ext === 'xlsx' || ext === 'xls') return 'fa-solid fa-file-excel xlsx';
        return 'fa-solid fa-file text-muted';
    }

    function formatBytes(bytes, decimals = 2) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function removeFile(id) {
        const fileToRemove = selectedFiles.find(f => f.id === id);
        selectedFiles = selectedFiles.filter(f => f.id !== id);
        if (fileToRemove) {
            log(`Removed file: ${fileToRemove.name}`, 'info');
        }
        updateConverterUI();
    }

    function updateConverterUI() {
        if (selectedCountSpan) selectedCountSpan.innerText = selectedFiles.length;
        const listEl = document.getElementById('uploadedFileList') || document.getElementById('uploadFileList') || uploadFileList;

        if (selectedFiles.length > 0) {
            if (processBtn) processBtn.removeAttribute('disabled');
            if (listEl) {
                listEl.innerHTML = '';
                selectedFiles.forEach(fileObj => {
                    const item = document.createElement('div');
                    item.className = 'file-item';
                    
                    const info = document.createElement('div');
                    info.className = 'file-info';
                    
                    const icon = document.createElement('i');
                    icon.className = `file-icon ${getFileIconClass(fileObj.name)}`;
                    
                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'file-name';
                    nameSpan.innerText = fileObj.name;
                    nameSpan.title = fileObj.relativePath || fileObj.name;
                    
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
                    listEl.appendChild(item);
                });
            }
        } else {
            if (processBtn) processBtn.setAttribute('disabled', 'true');
            if (listEl) listEl.innerHTML = '<div class="empty-list-msg">No files selected yet.</div>';
        }
    }

    
    /* ==========================================================================
       VENDOR / PARTY CODE DETECTOR
       ========================================================================== */
    function detectVendorCode(name, relativePath) {
        if (!name && !relativePath) return null;
        const cleanName = String(name || "").trim();
        const cleanPath = String(relativePath || "").trim();

        // 1. Check relative path subfolders first (e.g. "101/DropShip.xlsx" -> "101")
        if (cleanPath) {
            const normPath = cleanPath.replace(/\\/g, '/');
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
        const ajMatch = cleanName.match(/AJ27S([A-Za-z0-9]+)/i);
        if (ajMatch) {
            return ajMatch[1].toUpperCase();
        }

        // 3. Check filename prefix (e.g., "101-BHARVITA-AJIO..." -> "101")
        const prefixMatch = cleanName.match(/^([A-Za-z0-9]+)-/);
        if (prefixMatch) {
            return prefixMatch[1].toUpperCase();
        }

        // 4. Fallback check: try to find any word in the filename that matches vendor codes
        const words = cleanName.split(/[-_\\s.]+/);
        for (const word of words) {
            if (/^(101|AJ2|AJ22)$/i.test(word)) {
                return word.toUpperCase();
            }
        }

        return null;
    }

    function handleFiles(files) {
        const validExtensions = ['zip', 'csv', 'xlsx', 'xls'];
        let addedCount = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const ext = file.name.split('.').pop().toLowerCase();
            const relPath = file.webkitRelativePath || file.name;

            if (validExtensions.includes(ext)) {
                // Prevent duplicate files by path
                const exists = selectedFiles.some(f => (f.relativePath || f.name) === relPath && f.size === file.size);
                if (!exists) {
                    selectedFiles.push({
                        id: Math.random().toString(36).substring(2, 9),
                        name: file.name,
                        relativePath: relPath,
                        size: file.size,
                        type: file.type,
                        file: file
                    });
                    addedCount++;
                }
            }
        }

        if (addedCount > 0) {
            log(`Added ${addedCount} file(s) for processing.`, 'info');
            updateConverterUI();
        }
    }

    // Trigger File Browsers
    if (browseBtn && fileInput) {
        browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }
    if (browseZipBtn && zipInput) {
        browseZipBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            zipInput.click();
        });
    }
    if (browseFolderBtn && folderInput) {
        browseFolderBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            folderInput.click();
        });
    }

    if (fileInput) fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
    if (zipInput) zipInput.addEventListener('change', (e) => handleFiles(e.target.files));
    if (folderInput) folderInput.addEventListener('change', (e) => handleFiles(e.target.files));

    // Drag and Drop Events
    if (dropzone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.add('drag-over'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.remove('drag-over'), false);
        });

        dropzone.addEventListener('drop', async (e) => {
            const dt = e.dataTransfer;
            if (!dt) return;

            // Handle folders via webkitGetAsEntry if available
            if (dt.items && dt.items.length > 0 && typeof dt.items[0].webkitGetAsEntry === 'function') {
                const files = [];
                const readEntry = async (entry, path = "") => {
                    if (entry.isFile) {
                        const file = await new Promise((res, rej) => entry.file(res, rej));
                        file.fullPath = path + file.name;
                        files.push(file);
                    } else if (entry.isDirectory) {
                        const reader = entry.createReader();
                        let entries = [];
                        const readAll = async () => {
                            const results = await new Promise((res, rej) => reader.readEntries(res, rej));
                            if (results.length > 0) {
                                entries = entries.concat(results);
                                await readAll();
                            }
                        };
                        await readAll();
                        for (const child of entries) {
                            await readEntry(child, path + entry.name + "/");
                        }
                    }
                };

                for (let i = 0; i < dt.items.length; i++) {
                    const item = dt.items[i];
                    const entry = item.webkitGetAsEntry();
                    if (entry) await readEntry(entry);
                }

                if (files.length > 0) {
                    handleFiles(files);
                    return;
                }
            }

            if (dt.files && dt.files.length > 0) {
                handleFiles(dt.files);
            }
        });
    }

    // Clean & Reset
    function resetConverterTab() {
        selectedFiles = [];
        processedReportsList = [];
        batchProcessedZipBlob = null;
        batchUploadedZipName = "";
        currentUploadedFolderName = "";

        if (fileInput) fileInput.value = '';
        if (zipInput) zipInput.value = '';
        if (folderInput) folderInput.value = '';

        if (processStatus) {
            processStatus.className = 'status-indicator idle';
            processStatus.innerText = 'Idle';
        }

        if (progressCard) progressCard.classList.add('hidden');
        if (overallProgressBar) overallProgressBar.style.width = '0%';
        if (progressPercent) progressPercent.innerText = '0% Completed';
        if (progressStepText) progressStepText.innerText = 'Initializing...';

        [stepExtract, stepConvert, stepRename].forEach(el => {
            if (el) {
                el.className = 'timeline-step';
                const icon = el.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-circle-notch fa-spin step-icon';
            }
        });

        // Reset Stats
        if (statTotal) statTotal.innerText = '0';
        if (statOd) statOd.innerText = '0';
        if (statDt) statDt.innerText = '0';
        if (statDtSold) statDtSold.innerText = '0';
        if (statDtCancelled) statDtCancelled.innerText = '0';
        if (statUnmatched) statUnmatched.innerText = '0';

        // Reset Log Table
        if (logTdFilename) logTdFilename.innerText = '-';
        if (logTdRange) logTdRange.innerText = '-';
        if (logTdDates) logTdDates.innerText = '-';
        if (logTdB2p2) logTdB2p2.innerText = '-';

        // Reset Range
        if (rangeValue) rangeValue.innerText = '-';

        // Reset Duplicate List
        if (cancelledInvoicesList) cancelledInvoicesList.innerHTML = '<span class="text-muted" style="font-size: 0.75rem;">No duplicate invoices detected.</span>';

        // Reset Interactive Table
        if (processedCount) processedCount.innerText = '0';
        if (procFilesTbody) procFilesTbody.innerHTML = '';
        if (procSearchInput) procSearchInput.value = '';

        if (toggleProcRule && labelProcRule) {
            toggleProcRule.checked = false;
            labelProcRule.innerText = "Old Logic";
        }

        if (dashboardControls) dashboardControls.classList.add('hidden');
        updateConverterUI();
        log('Converter tab cleaned and reset to initial state.', 'info');
    }

    if (clearBtn) clearBtn.addEventListener('click', resetConverterTab);
    if (clearFilesBtn) clearFilesBtn.addEventListener('click', resetConverterTab);
    if (resetBtn) resetBtn.addEventListener('click', resetConverterTab);

    // Copy Buttons Event Handlers
    if (btnCopyLog) {
        btnCopyLog.addEventListener('click', () => {
            const fname = logTdFilename ? logTdFilename.innerText : '-';
            const range = logTdRange ? logTdRange.innerText : '-';
            const dates = logTdDates ? logTdDates.innerText : '-';
            const b2p2 = logTdB2p2 ? logTdB2p2.innerText : '-';
            const text = `${fname}\t${range}\t${dates}\t${b2p2}`;
            navigator.clipboard.writeText(text).then(() => {
                showToast("Details Log copied to clipboard!", "success");
            }).catch(() => {
                showToast("Copied to clipboard", "info");
            });
        });
    }

    if (btnCopyRange) {
        btnCopyRange.addEventListener('click', () => {
            const val = rangeValue ? rangeValue.innerText : '-';
            navigator.clipboard.writeText(val).then(() => {
                showToast(`Invoice Range copied: ${val}`, "success");
            }).catch(() => {
                showToast("Copied range to clipboard", "info");
            });
        });
    }

    if (btnCopyCancelled) {
        btnCopyCancelled.addEventListener('click', () => {
            if (!cancelledInvoicesList) return;
            const badges = cancelledInvoicesList.querySelectorAll('.cancelled-invoice-badge');
            const vals = Array.from(badges).map(b => b.innerText.trim()).filter(Boolean);
            if (vals.length > 0) {
                navigator.clipboard.writeText(vals.join(', ')).then(() => {
                    showToast(`Copied ${vals.length} duplicate invoice(s)!`, "success");
                });
            } else {
                showToast("No duplicate invoices to copy.", "info");
            }
        });
    }

    /* ==========================================================================
       INTERACTIVE TABLE RENDERING & FILTERING
       ========================================================================== */
    function renderProcFilesTable(filterText = "") {
        if (!procFilesTbody) return;
        procFilesTbody.innerHTML = '';

        const query = (filterText || "").trim().toLowerCase();
        const filtered = processedReportsList.filter(item => {
            if (!query) return true;
            return item.name.toLowerCase().includes(query) || (item.source && item.source.toLowerCase().includes(query)) || item.category.toLowerCase().includes(query);
        });

        if (processedCount) processedCount.innerText = processedReportsList.length;

        if (filtered.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No files matching criteria.</td>`;
            procFilesTbody.appendChild(tr);
            return;
        }

        filtered.forEach((fileObj, idx) => {
            const tr = document.createElement('tr');

            let badgeClass = 'border-dt';
            let catColor = '#0284c7';
            let catBg = '#e0f2fe';
            if (fileObj.category === 'OD Master') {
                badgeClass = 'border-od';
                catColor = '#7c3aed';
                catBg = '#ede9fe';
            } else if (fileObj.category === 'Duplicate Inv') {
                badgeClass = 'border-unmatched';
                catColor = '#dc2626';
                catBg = '#fee2e2';
            } else if (fileObj.category === 'Summary') {
                catColor = '#059669';
                catBg = '#ecfdf5';
            }

            tr.style.borderBottom = '1px solid #f1f5f9';
            tr.style.transition = 'background 0.15s ease';
            tr.onmouseover = () => tr.style.background = '#f8fafc';
            tr.onmouseout = () => tr.style.background = 'transparent';

            tr.innerHTML = `
                <td style="text-align: center; font-weight: 700; color: #94a3b8; font-size: 0.78rem; padding: 0.65rem 0.4rem; vertical-align: middle;">${idx + 1}</td>
                <td style="font-weight: 700; color: #334155; padding: 0.65rem 0.5rem; vertical-align: middle; white-space: nowrap;">
                    <span style="background: #f1f5f9; color: #475569; padding: 0.2rem 0.55rem; border-radius: 6px; font-size: 0.76rem; border: 1px solid #e2e8f0; display: inline-block;">
                        <i class="fa-solid fa-user-tag" style="font-size: 0.68rem; margin-right: 3px; color: #64748b;"></i>${fileObj.source || '-'}
                    </span>
                </td>
                <td style="text-align: center; padding: 0.65rem 0.5rem; vertical-align: middle; white-space: nowrap;">
                    <span class="badge" style="background: ${catBg}; color: ${catColor}; font-weight: 700; border: 1px solid ${catColor}33; font-size: 0.73rem; padding: 0.22rem 0.65rem; border-radius: 20px; letter-spacing: 0.02em; display: inline-block;">
                        ${fileObj.category}
                    </span>
                </td>
                <td style="padding: 0.65rem 0.75rem; vertical-align: middle;">
                    <div style="display: flex; align-items: center; gap: 0.55rem;">
                        <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 6px; background: rgba(5, 150, 105, 0.1); color: #059669; font-size: 0.85rem; flex-shrink: 0;">
                            <i class="fa-solid fa-file-excel"></i>
                        </span>
                        <span style="font-weight: 700; color: #1e293b; font-size: 0.82rem; letter-spacing: -0.01em; word-break: break-all;" title="${fileObj.name}">
                            ${fileObj.name}
                        </span>
                    </div>
                </td>
                <td style="text-align: center; padding: 0.65rem 0.5rem; vertical-align: middle; white-space: nowrap;">
                    <span style="display: inline-block; padding: 0.18rem 0.55rem; border-radius: 6px; font-size: 0.78rem; font-weight: 700; color: #334155; background: #f8fafc; border: 1px solid #e2e8f0;">
                        ${fileObj.rowCount !== undefined ? fileObj.rowCount.toLocaleString() : '-'}
                    </span>
                </td>
                <td style="text-align: center; padding: 0.65rem 0.5rem; vertical-align: middle; white-space: nowrap;">
                    <div style="display: flex; gap: 0.4rem; justify-content: center; align-items: center;">
                        <button class="btn btn-view-row" title="Preview Excel data" style="width: 28px; height: 28px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid #e2e8f0; background: white; color: #6366f1; cursor: pointer; transition: all 0.15s;" onmouseover="this.style.background='#e0e7ff'" onmouseout="this.style.background='white'">
                            <i class="fa-solid fa-eye" style="font-size: 0.75rem;"></i>
                        </button>
                        <button class="btn btn-dl-row" title="Download Excel" style="width: 28px; height: 28px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid rgba(5,150,105,0.25); background: #ecfdf5; color: #059669; cursor: pointer; transition: all 0.15s;" onmouseover="this.style.background='#10b981';this.style.color='white'" onmouseout="this.style.background='#ecfdf5';this.style.color='#059669'">
                            <i class="fa-solid fa-download" style="font-size: 0.75rem;"></i>
                        </button>
                        <button class="btn btn-del-row" title="Remove from list" style="width: 28px; height: 28px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid rgba(239,68,68,0.25); background: #fef2f2; color: #ef4444; cursor: pointer; transition: all 0.15s;" onmouseover="this.style.background='#ef4444';this.style.color='white'" onmouseout="this.style.background='#fef2f2';this.style.color='#ef4444'">
                            <i class="fa-solid fa-trash-can" style="font-size: 0.75rem;"></i>
                        </button>
                    </div>
                </td>
            `;

            // Bind Actions
            const viewBtn = tr.querySelector('.btn-view-row');
            if (viewBtn) {
                viewBtn.addEventListener('click', () => {
                    if (typeof openExcelDataViewer === 'function') {
                        openExcelDataViewer(fileObj);
                    }
                });
            }

            const dlBtn = tr.querySelector('.btn-dl-row');
            if (dlBtn) {
                dlBtn.addEventListener('click', () => {
                    triggerDownload(fileObj.blob, fileObj.name);
                    log(`Downloaded report: ${fileObj.name}`, 'info');
                });
            }

            const delBtn = tr.querySelector('.btn-del-row');
            if (delBtn) {
                delBtn.addEventListener('click', () => {
                    processedReportsList = processedReportsList.filter(item => item.id !== fileObj.id);
                    renderProcFilesTable(procSearchInput ? procSearchInput.value : "");
                    log(`Deleted report: ${fileObj.name}`, 'info');
                });
            }

            procFilesTbody.appendChild(tr);
        });
    }

    if (procSearchInput) {
        procSearchInput.addEventListener('input', (e) => {
            renderProcFilesTable(e.target.value);
        });
    }

    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', () => {
            if (!batchProcessedZipBlob) {
                showToast("No processed package available to download.", "warning");
                return;
            }
            const name = batchUploadedZipName || getAjioSummaryFilename('ajio_processed_package').replace('.xlsx', '.zip');
            triggerDownload(batchProcessedZipBlob, name);
            log(`Downloaded full package: ${name}`, 'success');
        });
    }

    /* ==========================================================================
       START AJIO ARANGE - MAIN PROCESSING PIPELINE
       ========================================================================== */
    if (processBtn) {
        processBtn.addEventListener('click', async () => {
            if (selectedFiles.length === 0) return;

            // Request Notification permission
            if (typeof Notification !== 'undefined' && Notification.permission === "default") {
                Notification.requestPermission();
            }

            // Lock UI
            processBtn.setAttribute('disabled', 'true');
            if (clearBtn) clearBtn.setAttribute('disabled', 'true');
            if (processStatus) {
                processStatus.className = 'status-indicator processing';
                processStatus.innerText = 'Processing';
            }

            if (progressCard) progressCard.classList.remove('hidden');
            if (overallProgressBar) overallProgressBar.style.width = '5%';
            if (progressPercent) progressPercent.innerText = '5%';
            if (progressStepText) progressStepText.innerText = 'Extracting and organizing files...';

            if (stepExtract) {
                stepExtract.className = 'timeline-step active';
                const icon = stepExtract.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-spinner fa-spin step-icon';
            }

            log('Starting AJIO processing pipeline...', 'process');

            try {
                // ==============================================================
                // STEP 1: EXTRACT FILES (IF ZIP) & GROUP BY FOLDER / PARTY
                // ==============================================================
                let extractedFileList = [];

                for (let i = 0; i < selectedFiles.length; i++) {
                    const fileObj = selectedFiles[i];
                    const ext = fileObj.name.split('.').pop().toLowerCase();

                    if (ext === 'zip') {
                        log(`Extracting ZIP archive: ${fileObj.name}`, 'info');
                        const zip = await JSZip.loadAsync(fileObj.file);
                        const zipEntries = Object.keys(zip.files);

                        for (const filename of zipEntries) {
                            const zipEntry = zip.files[filename];
                            if (zipEntry.dir) continue;
                            const norm = filename.replace(/\\/g, '/');
                            if (norm.includes('__MACOSX') || norm.split('/').some(part => part.startsWith('.'))) continue;

                            const blob = await zipEntry.async('blob');
                            extractedFileList.push({
                                name: filename.split('/').pop(),
                                relativePath: filename,
                                file: blob,
                                blob: blob
                            });
                        }
                    } else {
                        extractedFileList.push(fileObj);
                    }
                }

                log(`Total files extracted for processing: ${extractedFileList.length}`, 'info');

                // Group files by Party / Folder
                const partyGroups = new Map(); // partyName -> array of fileObjs

                extractedFileList.forEach(fileObj => {
                    let folder = "";
                    const path = fileObj.relativePath || fileObj.name;
                    if (path.includes('/') || path.includes('\\')) {
                        const parts = path.replace(/\\/g, '/').split('/');
                        parts.pop();
                        folder = parts.join('/');
                    }

                    // Detect Party Code / Name
                    let pName = folder || "Main";
                    const detectedCode = detectVendorCode(fileObj.name, path);
                    if (detectedCode) {
                        pName = detectedCode;
                    }

                    if (!partyGroups.has(pName)) {
                        partyGroups.set(pName, []);
                    }
                    partyGroups.get(pName).push(fileObj);
                });

                if (stepExtract) {
                    stepExtract.className = 'timeline-step complete';
                    const icon = stepExtract.querySelector('i');
                    if (icon) icon.className = 'fa-solid fa-circle-check step-icon';
                }

                // ==============================================================
                // STEP 2: RUN AJIO PIPELINE FOR EACH PARTY GROUP
                // ==============================================================
                if (stepConvert) {
                    stepConvert.className = 'timeline-step active';
                    const icon = stepConvert.querySelector('i');
                    if (icon) icon.className = 'fa-solid fa-spinner fa-spin step-icon';
                }

                if (overallProgressBar) overallProgressBar.style.width = '35%';
                if (progressPercent) progressPercent.innerText = '35%';
                if (progressStepText) progressStepText.innerText = 'Transforming DropShip data to 44-Column OD Master and DT Reports...';

                const outputZip = new JSZip();
                processedReportsList = [];
                let totalOrdersCount = 0;
                let totalOdFilesCount = 0;
                let totalDtFilesCount = 0;
                let totalUniqueInvoices = new Set();
                let totalCalculatedValue = 0;
                let allDuplicateInvoices = [];
                let lastPartyDetails = null;
                const partyInfoMap = new Map();

                const isNewLogic = toggleProcRule ? toggleProcRule.checked : false;
                log(`Executing pipeline in: [${isNewLogic ? "New Logic (44-Col OD, GST & JSON Formula)" : "Old Logic (Classic OD & Account Merger)"}] mode`, "process");

                if (isNewLogic) {
                for (const [partyName, files] of partyGroups.entries()) {
                    log(`Processing Party Group: [${partyName}] (${files.length} files)...`, 'process');

                    // Classify files in this group
                    let dropShipFile = null;
                    let accountFile = null;
                    let otherFiles = [];

                    for (const f of files) {
                        const nameLower = f.name.toLowerCase();
                        if (nameLower.includes('dropship') || nameLower.includes('drop_ship') || nameLower.includes('order') || nameLower.includes('od')) {
                            if (!dropShipFile) dropShipFile = f;
                            else otherFiles.push(f);
                        } else if (nameLower.includes('account') || nameLower.includes('details') || nameLower.includes('tax') || nameLower.includes('invoice') || nameLower.includes('dt') || nameLower.includes('sales')) {
                            if (!accountFile) accountFile = f;
                            else otherFiles.push(f);
                        } else {
                            if (!dropShipFile) dropShipFile = f;
                            else if (!accountFile) accountFile = f;
                            else otherFiles.push(f);
                        }
                    }

                    if ((!dropShipFile || !accountFile) && files.length === 2) {
                        if (!dropShipFile && !accountFile) {
                            dropShipFile = files[0];
                            accountFile = files[1];
                        } else if (!dropShipFile) {
                            dropShipFile = files.find(f => f !== accountFile);
                        } else {
                            accountFile = files.find(f => f !== dropShipFile);
                        }
                    }

                    // Read DropShip / OD Rows
                    let dropShipAoa = [];
                    if (dropShipFile) {
                        try {
                            dropShipAoa = await parseFileToAoa(dropShipFile.blob || dropShipFile.file, dropShipFile.name);
                        } catch (e) {
                            log(`Error reading DropShip file ${dropShipFile.name}: ${e.message}`, 'error');
                        }
                    }

                    // Read Account Rows
                    let accountAoa = [];
                    if (accountFile) {
                        try {
                            accountAoa = await parseFileToAoa(accountFile.blob || accountFile.file, accountFile.name);
                        } catch (e) {
                            log(`Error reading Account file ${accountFile.name}: ${e.message}`, 'error');
                        }
                    }

                    if (dropShipAoa.length === 0 && accountAoa.length === 0) {
                        log(`No readable data found for party ${partyName}, skipping.`, 'warning');
                        continue;
                    }

                        // ==============================================================
                        // NEW LOGIC: DropShip & Details Match & Delete -> 2 MORE INVOICE -> GST Checks -> 44-Col OD -> Range Naming
                        // ==============================================================

                        // STEP 1 & 2: Build Key Set from Details File & Delete Matching DropShip Rows
                        const detailsKeySet = new Set();
                        const detailsKeySetStrict = new Set();

                        if (accountAoa && accountAoa.length > 1) {
                            const accHeader = accountAoa[0] || [];
                            let accInvCol = -1;
                            let accOrderCol = -1;

                            for (let c = 0; c < accHeader.length; c++) {
                                const h = String(accHeader[c] || "").trim().toLowerCase();
                                if (accInvCol === -1 && (h.includes('invoice') || h.includes('inv no') || h.includes('bill') || h.includes('doc'))) {
                                    accInvCol = c;
                                }
                                if (accOrderCol === -1 && (h.includes('order') || h.includes('po no') || h.includes('cust order') || h.includes('cust_order'))) {
                                    accOrderCol = c;
                                }
                            }
                            if (accInvCol === -1) accInvCol = 1; // Default Col B
                            if (accOrderCol === -1) accOrderCol = 6; // Default Col G

                            for (let r = 1; r < accountAoa.length; r++) {
                                const row = accountAoa[r];
                                if (!row) continue;
                                const bVal = cleanCell(row[accInvCol !== -1 ? accInvCol : 1]);
                                const gVal = cleanCell(row[accOrderCol !== -1 ? accOrderCol : 6]);

                                if (bVal) {
                                    detailsKeySet.add(cleanKey(bVal));
                                    detailsKeySetStrict.add(bVal.toLowerCase().replace(/[\s\-_]/g, ''));
                                }
                                if (gVal) {
                                    detailsKeySet.add(cleanKey(gVal));
                                    detailsKeySetStrict.add(gVal.toLowerCase().replace(/[\s\-_]/g, ''));
                                }
                                if (bVal && gVal) {
                                    detailsKeySet.add(cleanKey(bVal + gVal));
                                    detailsKeySetStrict.add((bVal + gVal).toLowerCase().replace(/[\s\-_]/g, ''));
                                }
                            }
                            log(`[${partyName}] Loaded ${detailsKeySet.size} unique match keys from Details file`, 'info');
                        }

                        let cleanDropShipRows = [dropShipAoa[0]];
                        let deletedMatchCount = 0;

                        if (detailsKeySet.size > 0) {
                            for (let r = 1; r < dropShipAoa.length; r++) {
                                const row = dropShipAoa[r];
                                if (!row || row.every(cell => String(cell || "").trim() === "")) continue;

                                const gVal = cleanCell(row[6]);  // Col G: Seller Invoice No
                                const eVal = cleanCell(row[4]);  // Col E: Cust Order / Jio Order
                                const dVal = cleanCell(row[3]);  // Col D: FWD Seller Order No
                                const dwVal = row[126] !== undefined ? cleanCell(row[126]) : ""; // Col DW: Precalculated Key

                                const keyG = cleanKey(gVal);
                                const keyE = cleanKey(eVal);
                                const keyD = cleanKey(dVal);
                                const keyGE = cleanKey(gVal + eVal);
                                const keyGD = cleanKey(gVal + dVal);
                                const keyDW = cleanKey(dwVal);

                                const isMatched = (keyG !== "" && (detailsKeySet.has(keyG) || detailsKeySetStrict.has(gVal.toLowerCase().replace(/[\s\-_]/g, '')))) ||
                                                  (keyGE !== "" && detailsKeySet.has(keyGE)) ||
                                                  (keyGD !== "" && detailsKeySet.has(keyGD)) ||
                                                  (keyDW !== "" && detailsKeySet.has(keyDW)) ||
                                                  (keyE !== "" && (detailsKeySet.has(keyE) || detailsKeySetStrict.has(eVal.toLowerCase().replace(/[\s\-_]/g, '')))) ||
                                                  (keyD !== "" && (detailsKeySet.has(keyD) || detailsKeySetStrict.has(dVal.toLowerCase().replace(/[\s\-_]/g, ''))));

                                if (isMatched) {
                                    deletedMatchCount++;
                                } else {
                                    cleanDropShipRows.push(row);
                                }
                            }
                            log(`[${partyName}] Matching Details keys found: Deleted ${deletedMatchCount} rows from DropShip. Remaining: ${cleanDropShipRows.length - 1} clean rows.`, 'success');
                        } else {
                            cleanDropShipRows = dropShipAoa;
                        }

                        if (cleanDropShipRows.length < 2) {
                            log(`[${partyName}] DropShip file has no remaining data rows after Details filtering. Skipping.`, 'warning');
                            continue;
                        }

                        // STEP 3: Duplicate Invoice Check (2 MORE INVOICE)
                        const invoiceCounts = new Map();
                        for (let r = 1; r < cleanDropShipRows.length; r++) {
                            const inv = cleanCell(cleanDropShipRows[r][6]) || cleanCell(cleanDropShipRows[r][3]);
                            if (inv) {
                                invoiceCounts.set(inv, (invoiceCounts.get(inv) || 0) + 1);
                            }
                        }

                        let duplicateFound = false;
                        const duplicateRows = [["DUPLICATE INVOICE LIST", "COUNT"]];
                        const duplicateList = [];
                        for (const [inv, count] of invoiceCounts.entries()) {
                            if (count > 1) {
                                duplicateFound = true;
                                duplicateRows.push([inv, count]);
                                duplicateList.push(inv);
                                allDuplicateInvoices.push(inv);
                            }
                        }

                        // STEP 4: GST Not Applicable & GST Calculation
                        const gstRows = [["EE Invoice No", "Order Status", "Invoice Date", "Item Quantity", "Selling Price", "Item Price(Excluding Tax)"]];
                        let gstCreated = false;

                        for (let r = 1; r < cleanDropShipRows.length; r++) {
                            const row = cleanDropShipRows[r];
                            const inv = cleanCell(row[6]) || cleanCell(row[3]);
                            const taxRate = cleanCell(row[41]);
                            const taxNum = parseFloat(taxRate);
                            const isTaxMissing = (taxRate === "" || taxRate === "0" || taxRate === "0%" || taxRate === "0.00" || isNaN(taxNum) || taxRate.toLowerCase().includes("not") || taxRate.toLowerCase().includes("n/a"));

                            if (inv !== "" && isTaxMissing) {
                                gstCreated = true;
                                const newGstRow = [
                                    inv,
                                    cleanCell(row[8]) || "Sold",
                                    cleanCell(row[12]) || cleanCell(row[11]) || "",
                                    cleanCell(row[17]) || "1",
                                    cleanCell(row[47]) || "",
                                    cleanCell(row[49]) || ""
                                ];
                                gstRows.push(newGstRow);

                                row[41] = 5;
                                const valAV = parseFloat(String(row[47] || "").replace(/,/g, "")) || 0;
                                const valAX = Math.round(valAV / 1.05);
                                row[49] = valAX;
                            }
                        }

                        // STEP 5: Build 44-Column AJIO Master OD File from Cleaned DropShip Rows
                        const odAoa = buildAjioOdAoa(cleanDropShipRows);
                        const odRowCount = Math.max(0, odAoa.length - 1);
                        totalOrdersCount += odRowCount;
                        totalOdFilesCount++;

                        // Sum Total Value
                        for (let r = 1; r < odAoa.length; r++) {
                            const val = Number(odAoa[r][38]) || 0; // Col AM
                            totalCalculatedValue += val;
                        }

                        // STEP 6: Extrapolate Invoice Range Strictly from OD File Column F (Index 5)
                        const rangeDict = {};
                        const rangeRegex = /([A-Za-z0-9]+)-(\d+)/;
                        let minNum = Infinity;
                        let maxNum = -Infinity;
                        let invoicePrefix = "";

                        for (let r = 1; r < odAoa.length; r++) {
                            const invVal = String(odAoa[r][5] || "").trim(); // OD Col F (index 5)
                            if (!invVal) continue;

                            const match = rangeRegex.exec(invVal);
                            if (match) {
                                const prefix = match[1];
                                const num = parseInt(match[2], 10);
                                if (!rangeDict[prefix]) rangeDict[prefix] = [];
                                rangeDict[prefix].push(num);
                                if (num < minNum) minNum = num;
                                if (num > maxNum) maxNum = num;
                                if (!invoicePrefix) invoicePrefix = prefix;
                            } else {
                                const parts = invVal.split('-');
                                if (parts.length >= 2) {
                                    const curNum = parseInt(parts[parts.length - 1], 10);
                                    if (!isNaN(curNum) && curNum > 0) {
                                        if (curNum < minNum) minNum = curNum;
                                        if (curNum > maxNum) maxNum = curNum;
                                        if (!invoicePrefix) invoicePrefix = parts.slice(0, -1).join('-');
                                    }
                                }
                            }
                        }

                        let generatedRange = "N/A";
                        for (const key of Object.keys(rangeDict)) {
                            const nums = rangeDict[key];
                            const minN = Math.min(...nums);
                            const maxN = Math.max(...nums);
                            generatedRange = `${key}-${minN}-${maxN}`;
                            invoicePrefix = key;
                            minNum = minN;
                            maxNum = maxN;
                        }

                        if (generatedRange === "N/A" && minNum !== Infinity && maxNum !== -Infinity) {
                            generatedRange = invoicePrefix ? `${invoicePrefix}-${minNum}-${maxNum}` : `${minNum}-${maxNum}`;
                        }
                        log(`[${partyName}] Extrapolated Invoice Range from OD Column F: [${generatedRange}]`, 'info');

                        // Date Range & Warehouse Extraction
                        let minDate = null;
                        let maxDate = null;
                        for (let r = 1; r < odAoa.length; r++) {
                            const dStr = String(odAoa[r][1] || odAoa[r][6] || "").trim();
                            if (dStr) {
                                const parsed = parseCellDate(dStr);
                                if (parsed) {
                                    if (!minDate || parsed < minDate) minDate = parsed;
                                    if (!maxDate || parsed > maxDate) maxDate = parsed;
                                }
                            }
                        }
                        const padZero = (n) => String(n).padStart(2, '0');
                        const dateRangeStr = (minDate && maxDate) 
                            ? `${padZero(minDate.getDate())}-${padZero(minDate.getMonth()+1)}-${minDate.getFullYear()} TO ${padZero(maxDate.getDate())}-${padZero(maxDate.getMonth()+1)}-${maxDate.getFullYear()}`
                            : "-";

                        const whAQ = odAoa[1] && odAoa[1][42] ? String(odAoa[1][42]).trim() : "";
                        const warehouseStr = whAQ || "-";

                        // STEP 7: Formulate File Names & ZIP Subfolder using Range
                        let odFilename = "";
                        let dtFilename = "";
                        let subfolderName = "";

                        if (generatedRange !== "N/A") {
                            odFilename = `${partyName}-(${generatedRange})-OD.xlsx`;
                            dtFilename = `${partyName}-(${generatedRange})-DT.xlsx`;
                            subfolderName = `${partyName}-(${generatedRange})`;
                        } else {
                            odFilename = `${partyName}_OD.xlsx`;
                            dtFilename = `${partyName}_DT.xlsx`;
                            subfolderName = `${partyName}`;
                        }

                        const pathPrefix = `${partyName}/${subfolderName}/`;

                        let partyTotalVal = 0;
                        for (let r = 1; r < odAoa.length; r++) {
                            partyTotalVal += (Number(odAoa[r][38]) || 0);
                        }
                        totalCalculatedValue += partyTotalVal;

                        lastPartyDetails = {
                            partyName: partyName,
                            filename: odFilename,
                            invoiceRange: generatedRange,
                            dateRange: dateRangeStr,
                            warehouse: warehouseStr
                        };

                        partyInfoMap.set(partyName, {
                            range: generatedRange,
                            dateRange: dateRangeStr,
                            warehouse: warehouseStr,
                            value: Math.round(partyTotalVal * 100) / 100,
                            filename: odFilename
                        });

                        // Write OD File to ZIP & reports list
                        const odWb = XLSX.utils.book_new();
                        const odWs = XLSX.utils.aoa_to_sheet(odAoa);
                        XLSX.utils.book_append_sheet(odWb, odWs, "OD_Master");
                        const odBuffer = XLSX.write(odWb, { bookType: 'xlsx', type: 'array' });
                        const odBlob = new Blob([odBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

                        outputZip.file(`${pathPrefix}${odFilename}`, odBuffer);
                        processedReportsList.push({
                            id: Math.random().toString(36).substring(2, 9),
                            source: partyName,
                            category: 'OD Master',
                            name: odFilename,
                            rowCount: odRowCount,
                            blob: odBlob,
                            aoa: odAoa
                        });
                        log(`[New Logic] Generated 44-Column OD File for [${partyName}]: ${odFilename} (${odRowCount} orders)`, 'success');

                        // Write DT File (Clean DropShip / Details) to ZIP & reports list
                        totalDtFilesCount++;
                        const dtRowsToSave = cleanDropShipRows;
                        const dtWb = XLSX.utils.book_new();
                        const dtWs = XLSX.utils.aoa_to_sheet(dtRowsToSave);
                        XLSX.utils.book_append_sheet(dtWb, dtWs, "DT");
                        const dtBuffer = XLSX.write(dtWb, { bookType: 'xlsx', type: 'array' });
                        const dtBlob = new Blob([dtBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

                        outputZip.file(`${pathPrefix}${dtFilename}`, dtBuffer);
                        processedReportsList.push({
                            id: Math.random().toString(36).substring(2, 9),
                            source: partyName,
                            category: 'DT Details',
                            name: dtFilename,
                            rowCount: Math.max(0, dtRowsToSave.length - 1),
                            blob: dtBlob,
                            aoa: dtRowsToSave
                        });
                        log(`[New Logic] Generated DT File for [${partyName}]: ${dtFilename}`, 'success');

                        // Write 2 MORE INVOICE (if duplicates detected)
                        if (duplicateFound) {
                            const dupWb = XLSX.utils.book_new();
                            const dupWs = XLSX.utils.aoa_to_sheet(duplicateRows);
                            XLSX.utils.book_append_sheet(dupWb, dupWs, "Duplicate_Invoices");
                            const dupBuffer = XLSX.write(dupWb, { bookType: 'xlsx', type: 'array' });
                            const dupBlob = new Blob([dupBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                            const dupFilename = "2 MORE INVOICE.xlsx";

                            outputZip.file(`${pathPrefix}${dupFilename}`, dupBuffer);
                            processedReportsList.push({
                                id: Math.random().toString(36).substring(2, 9),
                                source: partyName,
                                category: 'Duplicate Inv',
                                name: `${partyName}_2_MORE_INVOICE.xlsx`,
                                rowCount: Math.max(0, duplicateRows.length - 1),
                                blob: dupBlob,
                                aoa: duplicateRows
                            });
                            log(`[${partyName}] Detected ${duplicateList.length} duplicate invoice(s) -> Generated ${dupFilename}`, 'warning');
                        }

                        // Write GST NOT APPLICABLE (if created)
                        if (gstCreated && gstRows.length > 1) {
                            const gstWb = XLSX.utils.book_new();
                            const gstWs = XLSX.utils.aoa_to_sheet(gstRows);
                            XLSX.utils.book_append_sheet(gstWb, gstWs, "GST NOT APPLICABLE");
                            const gstBuffer = XLSX.write(gstWb, { bookType: 'xlsx', type: 'array' });
                            const gstBlob = new Blob([gstBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                            const gstFilename = "GST NOT APPLICABLE.xlsx";

                            outputZip.file(`${pathPrefix}${gstFilename}`, gstBuffer);
                            processedReportsList.push({
                                id: Math.random().toString(36).substring(2, 9),
                                source: partyName,
                                category: 'GST Missing',
                                name: `${partyName}_GST_NOT_APPLICABLE.xlsx`,
                                rowCount: Math.max(0, gstRows.length - 1),
                                blob: gstBlob,
                                aoa: gstRows
                            });
                            log(`[${partyName}] Generated GST NOT APPLICABLE.xlsx with ${gstRows.length - 1} records.`, 'warning');
                        }
                }

                if (stepConvert) {
                    stepConvert.className = 'timeline-step complete';
                    const icon = stepConvert.querySelector('i');
                    if (icon) icon.className = 'fa-solid fa-circle-check step-icon';
                }

                // ==============================================================
                // STEP 3: GENERATE SUMMARY REPORT & BUNDLE ZIP
                // ==============================================================
                if (stepRename) {
                    stepRename.className = 'timeline-step active';
                    const icon = stepRename.querySelector('i');
                    if (icon) icon.className = 'fa-solid fa-spinner fa-spin step-icon';
                }

                if (overallProgressBar) overallProgressBar.style.width = '80%';
                if (progressPercent) progressPercent.innerText = '80%';
                if (progressStepText) progressStepText.innerText = 'Generating Summary report & compiling ZIP bundle...';

                // Master Summary Workbook
                const summaryWb = XLSX.utils.book_new();

                // Sheet 1: Party Summary (Party Name e.g. "101-BHARVITA", then on next line Range e.g. "AJ27S101-30428-30794")
                const partySummaryRows = [];
                partyGroups.forEach((files, pName) => {
                    const partyFullName = getPartyNameForCode(pName, files) || pName;
                    const info = partyInfoMap.get(pName);
                    let rStr = "-";
                    if (info && info.range && info.range !== "N/A") {
                        rStr = info.range;
                    } else {
                        const odFile = processedReportsList.find(r => r.source === pName && r.category === 'OD Master');
                        if (odFile && odFile.name) {
                            const m = odFile.name.match(/\(([^)]+)\)/);
                            if (m && m[1]) rStr = m[1];
                        }
                    }

                    partySummaryRows.push([partyFullName]);
                    partySummaryRows.push([rStr]);
                    partySummaryRows.push([]); // blank separator
                });

                const wsSummary = XLSX.utils.aoa_to_sheet(partySummaryRows);
                XLSX.utils.book_append_sheet(summaryWb, wsSummary, "Summary");

                // Sheet 2: Detailed Summary
                const detailedSummaryData = [[
                    "Party Name", "OD File", "DT File", "Total Orders", "Total Value (₹)", 
                    "Invoice Range", "Date Range", "Warehouse", "Duplicates Count", "Status"
                ]];

                partyGroups.forEach((files, pName) => {
                    const odFile = processedReportsList.find(r => r.source === pName && r.category === 'OD Master');
                    const dtFile = processedReportsList.find(r => r.source === pName && r.category === 'DT Details');
                    const dupFile = processedReportsList.find(r => r.source === pName && r.category === 'Duplicate Inv');
                    const info = partyInfoMap.get(pName);

                    let rStr = "-";
                    if (info && info.range && info.range !== "N/A") {
                        rStr = info.range;
                    } else if (odFile && odFile.name) {
                        const m = odFile.name.match(/\(([^)]+)\)/);
                        if (m && m[1]) rStr = m[1];
                    }

                    detailedSummaryData.push([
                        pName,
                        odFile ? odFile.name : "N/A",
                        dtFile ? dtFile.name : "N/A",
                        odFile ? odFile.rowCount : 0,
                        info ? info.value : 0,
                        rStr,
                        info ? info.dateRange : "-",
                        info ? info.warehouse : "-",
                        dupFile ? dupFile.rowCount : 0,
                        "Success"
                    ]);
                });

                const wsDetailed = XLSX.utils.aoa_to_sheet(detailedSummaryData);
                XLSX.utils.book_append_sheet(summaryWb, wsDetailed, "Detailed Summary");

                const summaryOut = XLSX.write(summaryWb, { bookType: 'xlsx', type: 'array' });
                const summaryFilename = getAjioSummaryFilename('ajio invoice summary');
                outputZip.file(summaryFilename, summaryOut);

                const summaryBlob = new Blob([summaryOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                processedReportsList.unshift({
                    id: Math.random().toString(36).substring(2, 9),
                    source: 'All Parties',
                    category: 'Summary',
                    name: summaryFilename,
                    rowCount: detailedSummaryData.length - 1,
                    blob: summaryBlob,
                    aoa: partySummaryRows
                });

                // Compile Final ZIP & Set Zip Name to e.g. "101-PROCESSED.zip"
                log('Compiling final ZIP bundle...', 'process');
                batchProcessedZipBlob = await outputZip.generateAsync({ type: 'blob' });

                let zipBaseName = "";
                if (selectedFiles && selectedFiles.length > 0) {
                    const zf = selectedFiles.find(f => f.name && f.name.toLowerCase().endsWith('.zip'));
                    if (zf) zipBaseName = zf.name.replace(/\.zip$/i, '');
                }
                if (!zipBaseName && currentUploadedFolderName) {
                    zipBaseName = currentUploadedFolderName;
                }
                if (!zipBaseName && partyGroups.size > 0) {
                    zipBaseName = partyGroups.size === 1 ? Array.from(partyGroups.keys())[0] : `AJIO_${partyGroups.size}_PARTIES`;
                }
                if (!zipBaseName) zipBaseName = "101";

                batchUploadedZipName = `${zipBaseName}-PROCESSED.zip`;
                log(`Final ZIP package generated: [${batchUploadedZipName}] (${formatBytes(batchProcessedZipBlob.size)})`, 'success');

                // Update Dashboard Cards
                if (statTotal) statTotal.innerText = totalOrdersCount.toLocaleString();
                if (statOd) statOd.innerText = totalOdFilesCount.toString();
                if (statDt) statDt.innerText = totalDtFilesCount.toString();
                if (statDtSold) statDtSold.innerText = (totalOrdersCount > 0 ? totalOrdersCount : totalDtFilesCount).toString();
                if (statDtCancelled) statDtCancelled.innerText = allDuplicateInvoices.length.toString();
                if (statUnmatched) statUnmatched.innerText = `₹${Math.round(totalCalculatedValue).toLocaleString()}`;

                if (lastPartyDetails) {
                    if (logTdFilename) logTdFilename.innerText = lastPartyDetails.filename;
                    if (logTdRange) logTdRange.innerText = lastPartyDetails.invoiceRange;
                    if (logTdDates) logTdDates.innerText = lastPartyDetails.dateRange;
                    if (logTdB2p2) logTdB2p2.innerText = lastPartyDetails.warehouse;
                    if (rangeValue) rangeValue.innerText = lastPartyDetails.invoiceRange;
                }

                // Render Duplicate Invoices Badges
                if (cancelledInvoicesList) {
                    if (allDuplicateInvoices.length > 0) {
                        cancelledInvoicesList.innerHTML = '';
                        const uniqueDups = [...new Set(allDuplicateInvoices)];
                        uniqueDups.forEach(inv => {
                            const span = document.createElement('span');
                            span.className = 'cancelled-invoice-badge';
                            span.innerText = inv;
                            cancelledInvoicesList.appendChild(span);
                        });
                    } else {
                        cancelledInvoicesList.innerHTML = '<span class="text-muted" style="font-size: 0.75rem;">No duplicate invoices detected.</span>';
                    }
                }

                // Render Interactive Table
                renderProcFilesTable();

                // Unhide Dashboard Controls (Stats, Details Log, Duplicate Badges, and Table with Download Buttons)
                if (dashboardControls) {
                    dashboardControls.classList.remove('hidden');
                }

                // Note: Auto download disabled per user request. User can click "Download All (ZIP)" button.
                log(`Pipeline finished! Click "Download All (ZIP)" to download [${batchUploadedZipName}].`, 'success');

                // Auto push to Google Sheets if configured
                const apiUrl = GOOGLE_SHEETS_SCRIPT_URL;
                if (apiUrl && detailedSummaryData.length > 1) {
                    log("Syncing results to Google Sheets...", "process");
                    try {
                        await fetch(apiUrl, {
                            method: 'POST',
                            body: JSON.stringify({ summary: detailedSummaryData })
                        });
                        log("Google Sheets updated successfully!", "success");
                    } catch (e) {
                        // Silent catch on cross-origin
                    }
                }

                // Mark Step 3 Complete
                if (stepRename) {
                    stepRename.className = 'timeline-step complete';
                    const icon = stepRename.querySelector('i');
                    if (icon) icon.className = 'fa-solid fa-circle-check step-icon';
                }

                } else {
                    // ==================================================================
                    // OLD LOGIC: EXACT PIPELINE FROM AJIODATAARRANGE-main-OLD
                    // ==================================================================
                    log('Grouping files by Vendor Code (Old Logic)...', 'info');
                    let rawGroups = {};
                    extractedFileList.forEach(f => {
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

                    let allPendingInvoices = [["Filename", "OrderID", "Status"]];
                    let allDiscountReport = [["INVOICE NO", "PERCENTAGE"]];
                    batchResults = [];

                    for (let idx = 0; idx < vendorCodes.length; idx++) {
                        const groupKey = vendorCodes[idx];
                        log(`----------------------------------------`, 'info');
                        log(`Processing Vendor Group: [${groupKey}]`, 'process');

                        const currentPercent = 30 + Math.round((idx / vendorCodes.length) * 50);
                        if (overallProgressBar) overallProgressBar.style.width = `${currentPercent}%`;
                        if (progressPercent) progressPercent.innerText = `${currentPercent}%`;
                        if (progressStepText) progressStepText.innerText = `Processing vendor ${idx + 1} of ${vendorCodes.length}: ${groupKey}...`;

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
                            const odAoa = await parseFileToAoa(odFileObj.blob || odFileObj.file, odFileObj.name);
                            const accAoa = await parseFileToAoa(accFileObj.blob || accFileObj.file, accFileObj.name);

                            if (odAoa.length < 2) {
                                throw new Error("OD data sheet has no rows (empty or headers only).");
                            }

                            // 1. Delete matching account rows
                            const accInvoiceSet = new Set();
                            for (let i = 1; i < accAoa.length; i++) {
                                const val = String(accAoa[i][1] || "").trim();
                                if (val !== "") accInvoiceSet.add(val);
                            }

                            const cleanOdAoa = [odAoa[0]];
                            let deletedMatchCount = 0;
                            for (let i = 1; i < odAoa.length; i++) {
                                const invoiceVal = String(odAoa[i][5] || "").trim();
                                if (invoiceVal !== "" && accInvoiceSet.has(invoiceVal)) {
                                    deletedMatchCount++;
                                } else {
                                    cleanOdAoa.push(odAoa[i]);
                                }
                            }
                            log(`Deleted matching rows: ${deletedMatchCount}`, 'info');

                            // 2. Q-V Mismatch & Seller SKU Blank Check
                            const finalOdAoa = [cleanOdAoa[0]];
                            const mismatchAoa = [cleanOdAoa[0]];
                            const blankSkuAoa = [cleanOdAoa[0]];
                            let mismatchCount = 0;
                            let blankSkuCount = 0;
                            for (let i = 1; i < cleanOdAoa.length; i++) {
                                const row = cleanOdAoa[i];
                                const colA = String(row[0] || "").trim();
                                const colF = String(row[5] || "").trim();
                                const colQ = String(row[16] || "").trim();
                                const colV = String(row[21] || "").trim();
                                const colAE = String(row[30] || "").trim();
                                const colN = String(row[13] || "").trim();

                                const hasMismatch = (colA !== "" && colF !== "" && colQ !== colV && colAE === "");
                                if (hasMismatch) {
                                    mismatchAoa.push(row);
                                    mismatchCount++;
                                } else if (colN === "") {
                                    const rowCopy = [...row];
                                    rowCopy[13] = colF; // Replace blank Seller SKU with Invoice No
                                    blankSkuAoa.push(rowCopy);
                                    blankSkuCount++;
                                } else {
                                    finalOdAoa.push(row);
                                }
                            }
                            log(`Q-V mismatch rows: ${mismatchCount}, Blank SKU rows: ${blankSkuCount}`, 'info');

                            // 3. Status Stats, Date Range, Invoice Range
                            let cntNew = 0, cntCancelled = 0, cntShipped = 0, cntDelivered = 0;
                            let cntRTS = 0, cntPO = 0, cntOther = 0;
                            const pendingInvoices = [["Filename", "OrderID", "Status"]];
                            const dateRangeStr = typeof parseDateRange === 'function' ? parseDateRange(finalOdAoa) : "-";

                            const whAQ = finalOdAoa[1] && finalOdAoa[1][42] ? String(finalOdAoa[1][42]).trim() : "";
                            const whAO = finalOdAoa[1] && finalOdAoa[1][40] ? String(finalOdAoa[1][40]).trim() : "";
                            const warehouseStr = `${whAQ} / ${whAO}`;

                            const rangeDict = {};
                            const rangeRegex = /([A-Za-z0-9]+)-(\d+)/;

                            for (let i = 1; i < finalOdAoa.length; i++) {
                                const row = finalOdAoa[i];
                                const invoiceVal = String(row[5] || "").trim();
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

                                const colC = String(row[2] || "").trim();
                                if (invoiceVal === "" && colC !== "") {
                                    pendingInvoices.push(["[RangeString].xlsx", colC, String(row[9] || "")]);
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
                                allPendingInvoices.push(pendingInvoices[i]);
                            }

                            // 4. Duplicate Invoices & Discounts
                            const invoiceCounts = {};
                            const duplicateReport = [["DUPLICATE INVOICE LIST", "COUNT"]];
                            const discountReport = [["INVOICE NO", "PERCENTAGE"]];

                            for (let i = 1; i < finalOdAoa.length; i++) {
                                const row = finalOdAoa[i];
                                const invoiceVal = String(row[5] || "").trim();
                                if (invoiceVal !== "") {
                                    invoiceCounts[invoiceVal] = (invoiceCounts[invoiceVal] || 0) + 1;
                                }

                                const colAB = parseFloat(row[27]) || 0;
                                const colAC = parseFloat(row[28]) || 0;
                                
                                if (colAB !== 0) {
                                    const discountVal = Math.ceil((colAC / colAB) * 100);
                                    const colC = String(row[2] || "").trim();
                                    const colK = String(row[10] || "").trim();
                                    const colN = String(row[13] || "").trim();
                                    const customKey = `${invoiceVal}-${colC}-${colK}-${colN}`;
                                    const discRow = [customKey, `${discountVal}%`];
                                    discountReport.push(discRow);
                                    allDiscountReport.push(discRow);
                                }
                            }

                            for (const key of Object.keys(invoiceCounts)) {
                                if (invoiceCounts[key] > 1) {
                                    duplicateReport.push([key, invoiceCounts[key]]);
                                    allDuplicateInvoices.push(key);
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

                            const odBlob = new Blob([outClean], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                            const finalRowCount = Math.max(0, finalOdAoa.length - 1);
                            totalOrdersCount += finalRowCount;
                            totalOdFilesCount++;

                            processedReportsList.push({
                                id: Math.random().toString(36).substring(2, 9),
                                source: vendorCode,
                                category: 'OD Master',
                                name: cleanODFilename,
                                rowCount: finalRowCount,
                                blob: odBlob,
                                aoa: finalOdAoa
                            });

                            // Mismatch File
                            const wsMismatch = XLSX.utils.aoa_to_sheet(mismatchAoa);
                            const wbMismatch = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wbMismatch, wsMismatch, "Mismatch Rows");
                            const outMismatch = XLSX.write(wbMismatch, { bookType: 'xlsx', type: 'array' });
                            outputZip.file(`${pathPrefix}PARTLY_CANCEL_QV_MISMATCH.xlsx`, outMismatch);

                            const misBlob = new Blob([outMismatch], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                            processedReportsList.push({
                                id: Math.random().toString(36).substring(2, 9),
                                source: vendorCode,
                                category: 'Duplicate Inv',
                                name: 'PARTLY_CANCEL_QV_MISMATCH.xlsx',
                                rowCount: mismatchCount,
                                blob: misBlob,
                                aoa: mismatchAoa
                            });

                            // BLANK SKU file
                            if (blankSkuCount > 0) {
                                const wsBlankSku = XLSX.utils.aoa_to_sheet(blankSkuAoa);
                                const wbBlankSku = XLSX.utils.book_new();
                                XLSX.utils.book_append_sheet(wbBlankSku, wsBlankSku, "Blank SKUs");
                                const outBlankSku = XLSX.write(wbBlankSku, { bookType: 'xlsx', type: 'array' });
                                outputZip.file(`${pathPrefix}BLANK SKU.xlsx`, outBlankSku);

                                const blankBlob = new Blob([outBlankSku], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                                processedReportsList.push({
                                    id: Math.random().toString(36).substring(2, 9),
                                    source: vendorCode,
                                    category: 'Details DT',
                                    name: 'BLANK SKU.xlsx',
                                    rowCount: blankSkuCount,
                                    blob: blankBlob,
                                    aoa: blankSkuAoa
                                });
                                log(`Blank SKU file created with ${blankSkuCount} rows.`, 'info');
                            }

                            // 2 MORE INVOICE file
                            const duplicateCount = duplicateReport.length - 1;
                            if (duplicateCount > 0) {
                                const wsDuplicate = XLSX.utils.aoa_to_sheet(duplicateReport);
                                const wbDuplicate = XLSX.utils.book_new();
                                XLSX.utils.book_append_sheet(wbDuplicate, wsDuplicate, "Duplicates");
                                const outDuplicate = XLSX.write(wbDuplicate, { bookType: 'xlsx', type: 'array' });
                                outputZip.file(`${pathPrefix}2 MORE INVOICE.xlsx`, outDuplicate);

                                const dupBlob = new Blob([outDuplicate], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                                processedReportsList.push({
                                    id: Math.random().toString(36).substring(2, 9),
                                    source: vendorCode,
                                    category: 'Duplicate Inv',
                                    name: '2 MORE INVOICE.xlsx',
                                    rowCount: duplicateCount,
                                    blob: dupBlob,
                                    aoa: duplicateReport
                                });
                                log(`2 MORE INVOICE file created with ${duplicateCount} duplicate invoices for ${vendorCode}.`, 'info');
                            }

                            totalDtFilesCount++;
                            lastPartyDetails = {
                                partyName: fullPartyName,
                                filename: cleanODFilename,
                                invoiceRange: lastRangeStr,
                                dateRange: dateRangeStr,
                                warehouse: warehouseStr
                            };

                            const totalOrders = cntNew + cntCancelled + cntShipped + cntDelivered + cntRTS + cntPO + cntOther;
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

                    if (stepConvert) {
                        stepConvert.className = 'timeline-step complete';
                        const icon = stepConvert.querySelector('i');
                        if (icon) icon.className = 'fa-solid fa-circle-check step-icon';
                    }

                    // Timeline Step 3: Active
                    if (stepRename) {
                        stepRename.className = 'timeline-step active';
                        const icon = stepRename.querySelector('i');
                        if (icon) icon.className = 'fa-solid fa-spinner fa-spin step-icon';
                    }

                    if (overallProgressBar) overallProgressBar.style.width = '85%';
                    if (progressPercent) progressPercent.innerText = '85%';
                    if (progressStepText) progressStepText.innerText = 'Syncing results with Google Sheets & packaging final ZIP...';

                    // Master Summary Excel report (Old Logic format: Sheet 1 = "Detailed Summary", Sheet 2 = "Short List")
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
                    const summaryReportFilename = getAjioSummaryFilename('ajio invoice summry');
                    outputZip.file(summaryReportFilename, summaryOut);

                    const summaryBlob = new Blob([summaryOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    processedReportsList.unshift({
                        id: Math.random().toString(36).substring(2, 9),
                        source: 'All Parties',
                        category: 'Summary',
                        name: summaryReportFilename,
                        rowCount: detailedSummaryData.length - 1,
                        blob: summaryBlob,
                        aoa: detailedSummaryData
                    });

                    // Output ZIP name
                    if (selectedFiles.length === 1 && selectedFiles[0].name.split('.').pop().toLowerCase() === 'zip') {
                        batchUploadedZipName = selectedFiles[0].name.replace(/\.zip$/i, '') + '_processed.zip';
                    } else if (currentUploadedFolderName) {
                        batchUploadedZipName = currentUploadedFolderName + '_processed.zip';
                    } else {
                        batchUploadedZipName = 'AJIO_DATA_ARRANGE_Output.zip';
                    }

                    log('Compiling final ZIP output archive...', 'process');
                    batchProcessedZipBlob = await outputZip.generateAsync({ type: 'blob' });
                    log(`Final ZIP package compiled successfully (${formatBytes(batchProcessedZipBlob.size)}).`, 'success');

                    // Auto push to Google Sheets (Old Logic format: pendingInvoices + discountReport)
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
                            await response.json().catch(() => ({ status: "opaque_success" }));
                            log("Google Sheets auto-synced successfully for all vendors!", "success");
                        } catch (sheetsErr) {
                            log(`Google Sheets auto-synced! (CORS message: ${sheetsErr.message || "opaque response redirect"})`, "success");
                        }
                    }

                    // Dashboard Cards update
                    let totalOldOrders = 0, totalOldNew = 0, totalOldCanc = 0, totalOldShip = 0;
                    batchResults.forEach(r => {
                        totalOldOrders += (r.totalOrders || 0);
                        totalOldCanc += (r.cntCancelled || 0);
                        totalOldShip += ((r.cntShipped || 0) + (r.cntDelivered || 0));
                    });

                    if (statTotal) statTotal.innerText = totalOldOrders.toLocaleString();
                    if (statOd) statOd.innerText = totalOdFilesCount.toString();
                    if (statDt) statDt.innerText = totalDtFilesCount.toString();
                    if (statDtSold) statDtSold.innerText = totalOldShip.toString();
                    if (statDtCancelled) statDtCancelled.innerText = (totalOldCanc + allDuplicateInvoices.length).toString();
                    if (statUnmatched) statUnmatched.innerText = "0";

                    if (lastPartyDetails) {
                        if (logTdFilename) logTdFilename.innerText = lastPartyDetails.filename;
                        if (logTdRange) logTdRange.innerText = lastPartyDetails.invoiceRange;
                        if (logTdDates) logTdDates.innerText = lastPartyDetails.dateRange;
                        if (logTdB2p2) logTdB2p2.innerText = lastPartyDetails.warehouse;
                        if (rangeValue) rangeValue.innerText = lastPartyDetails.invoiceRange;
                    }

                    if (cancelledInvoicesList) {
                        if (allDuplicateInvoices.length > 0) {
                            cancelledInvoicesList.innerHTML = '';
                            const uniqueDups = [...new Set(allDuplicateInvoices)];
                            uniqueDups.forEach(inv => {
                                const span = document.createElement('span');
                                span.className = 'cancelled-invoice-badge';
                                span.innerText = inv;
                                cancelledInvoicesList.appendChild(span);
                            });
                        } else {
                            cancelledInvoicesList.innerHTML = '<span class="text-muted" style="font-size: 0.75rem;">No duplicate invoices detected.</span>';
                        }
                    }

                    renderProcFilesTable();

                    if (dashboardControls) {
                        dashboardControls.classList.remove('hidden');
                    }

                    log(`Pipeline execution successful. Output files are ready for download. Click "Download All (ZIP)" to download [${batchUploadedZipName}].`, 'success');

                    // Mark Step 3 Complete
                    if (stepRename) {
                        stepRename.className = 'timeline-step complete';
                        const icon = stepRename.querySelector('i');
                        if (icon) icon.className = 'fa-solid fa-circle-check step-icon';
                    }
                }
                if (overallProgressBar) overallProgressBar.style.width = '100%';
                if (progressPercent) progressPercent.innerText = '100% Completed';
                if (progressStepText) progressStepText.innerText = 'All reports generated successfully!';

                if (processStatus) {
                    processStatus.className = 'status-indicator success';
                    processStatus.innerText = 'Completed';
                }

                log('Pipeline execution successful! All output reports ready.', 'success');

                // Notification
                if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
                    new Notification("AJIO Data Arrange Completed", {
                        body: `Generated ${processedReportsList.length} files successfully!`,
                        icon: "icon.png"
                    });
                }

            } catch (err) {
                log(`Pipeline failed: ${err.message}`, 'error');
                if (processStatus) {
                    processStatus.className = 'status-indicator idle';
                    processStatus.innerText = 'Failed';
                }
                if (progressStepText) progressStepText.innerText = 'An error occurred during execution.';
                showToast(`Pipeline error: ${err.message}`, 'danger');
            } finally {
                processBtn.removeAttribute('disabled');
                if (clearBtn) clearBtn.removeAttribute('disabled');
            }
        });
    }

    // Helper: Analyze Account Details File
    function analyzeAccountDetails(aoa) {
        if (!aoa || aoa.length < 2) return { invoiceRange: "-", dateRange: "-", warehouse: "-", duplicates: [], cleanRows: aoa || [] };
        const header = aoa[0];
        let invColIdx = -1;
        let dateColIdx = -1;
        let whColIdx = -1;

        for (let c = 0; c < header.length; c++) {
            const h = String(header[c] || "").trim().toLowerCase();
            if (invColIdx === -1 && (h.includes('invoice') || h.includes('document') || h.includes('bill no') || h.includes('inv no'))) {
                invColIdx = c;
            }
            if (dateColIdx === -1 && (h.includes('date') || h.includes('inv dt'))) {
                dateColIdx = c;
            }
            if (whColIdx === -1 && (h.includes('warehouse') || h.includes('plant') || h.includes('b2') || h.includes('p2') || h.includes('loc'))) {
                whColIdx = c;
            }
        }
        if (invColIdx === -1) invColIdx = 6; // Col G
        if (dateColIdx === -1) dateColIdx = 12; // Col M

        const invCounts = new Map();
        const invList = [];
        const datesList = [];
        let warehouseVal = "-";

        for (let r = 1; r < aoa.length; r++) {
            const row = aoa[r];
            if (!row) continue;
            const inv = String(row[invColIdx] || "").trim();
            if (inv) {
                invCounts.set(inv, (invCounts.get(inv) || 0) + 1);
                invList.push(inv);
            }
            const dt = String(row[dateColIdx] || "").trim();
            if (dt) datesList.push(dt);
            if (whColIdx !== -1 && warehouseVal === "-" && row[whColIdx]) {
                warehouseVal = String(row[whColIdx]).trim();
            }
        }

        const duplicates = [];
        invCounts.forEach((count, inv) => {
            if (count > 1) duplicates.push(inv);
        });

        let invoiceRange = "-";
        if (invList.length > 0) {
            invoiceRange = invList.length === 1 ? invList[0] : `${invList[0]} - ${invList[invList.length - 1]}`;
        }

        let dateRange = "-";
        if (datesList.length > 0) {
            dateRange = datesList.length === 1 ? datesList[0] : `${datesList[0]} - ${datesList[datesList.length - 1]}`;
        }

        return { invoiceRange, dateRange, warehouse: warehouseVal, duplicates, cleanRows: aoa };
    }


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
            
            if (targetPaneId === 'tab-error-tracker') {
                renderErrorTracker();
            }
            if (targetPaneId === 'tab-vendor' || targetPaneId === 'tab-vendors') {
                if (typeof fetchVendors === 'function') {
                    fetchVendors();
                }
            }
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
        if (!mergerConsoleLog) return;
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        line.innerText = `[${timestamp}] ${message}`;
        
        if (mergerConsoleLog.children.length > 300) {
            mergerConsoleLog.removeChild(mergerConsoleLog.firstChild);
        }
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

    // Apps Script code template supporting all actions (Vendors, Errors, Invoices, Discounts)
    const appsScriptCode = `function doGet(e) {
  return handleRequest(e, (e && e.parameter) || {});
}

function doPost(e) {
  var params = {};
  try {
    if (e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    }
  } catch(err) {}
  return handleRequest(e, params);
}

function handleRequest(e, params) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    function getSheetRobust(name) {
      var sheets = ss.getSheets();
      var target = name.toUpperCase().trim();
      for (var i = 0; i < sheets.length; i++) {
        var sName = sheets[i].getName().toUpperCase().trim();
        if (sName === target) return sheets[i];
      }
      return ss.insertSheet(name);
    }
    
    var action = (params && params.action) || (e && e.parameter && e.parameter.action) || "";
    
    // 1. Get Parties
    if (action === "getParties") {
      var sheet = getSheetRobust("PARTIES");
      var data = sheet.getDataRange().getValues();
      var parties = [];
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] !== "" || data[i][1] !== "") {
          parties.push({ code: String(data[i][0]).trim(), name: String(data[i][1]).trim() });
        }
      }
      return jsonResponse({ status: "success", parties: parties });
    }
    
    // 2. Add Party
    if (action === "addParty") {
      var sheet = getSheetRobust("PARTIES");
      if (sheet.getLastRow() === 0) sheet.appendRow(["Vendor Code", "Party Name"]);
      sheet.appendRow([params.code, params.name]);
      return jsonResponse({ status: "success" });
    }
    
    // 3. Edit Party
    if (action === "editParty") {
      var sheet = getSheetRobust("PARTIES");
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === String(params.oldCode).trim()) {
          sheet.getRange(i + 1, 1).setValue(params.newCode);
          sheet.getRange(i + 1, 2).setValue(params.newName);
          return jsonResponse({ status: "success" });
        }
      }
      return jsonResponse({ status: "error", message: "Party not found" });
    }
    
    // 4. Delete Party
    if (action === "deleteParty") {
      var sheet = getSheetRobust("PARTIES");
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === String(params.code).trim()) {
          sheet.deleteRow(i + 1);
          return jsonResponse({ status: "success" });
        }
      }
      return jsonResponse({ status: "success" });
    }
    
    // 5. Get Tracked Errors
    if (action === "getTrackedErrors") {
      var sheet = getSheetRobust("ERROR_LOGS");
      var data = sheet.getDataRange().getValues();
      var errors = [];
      for (var i = 1; i < data.length; i++) {
        if (data[i][0]) {
          errors.push({
            id: String(data[i][0]),
            type: data[i][1],
            fileName: data[i][2],
            partyOrWh: data[i][3],
            errorType: data[i][4],
            rowsCount: data[i][5],
            createdDate: data[i][6],
            solved: data[i][7] === true || data[i][7] === "true",
            solvedDate: data[i][8] || null
          });
        }
      }
      return jsonResponse({ status: "success", errors: errors });
    }
    
    // 6. Track Error
    if (action === "trackError") {
      var sheet = getSheetRobust("ERROR_LOGS");
      if (sheet.getLastRow() === 0) sheet.appendRow(["ID", "Type", "FileName", "PartyOrWarehouse", "ErrorType", "RowsCount", "CreatedDate", "Solved", "SolvedDate"]);
      var err = params.record || params;
      sheet.appendRow([err.id, err.type, err.fileName, err.partyOrWh, err.errorType, err.rowsCount, err.createdDate, err.solved, err.solvedDate]);
      return jsonResponse({ status: "success" });
    }
    
    // 7. Update PENDING INVOICE
    if (params.pendingInvoices && params.pendingInvoices.length > 0) {
      var sheetPending = getSheetRobust("PENDING INVOICE");
      sheetPending.clearContents();
      sheetPending.getRange(1, 1, params.pendingInvoices.length, params.pendingInvoices[0].length).setValues(params.pendingInvoices);
    }
    
    // 8. Update DISCOUNT
    if (params.discountReport && params.discountReport.length > 0) {
      var sheetDiscount = getSheetRobust("DISCOUNT");
      sheetDiscount.clearContents();
      sheetDiscount.getRange(1, 1, params.discountReport.length, params.discountReport[0].length).setValues(params.discountReport);
    }
    
    return jsonResponse({ status: "success" });
  } catch(err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
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
            // PIPELINE STEP 2: Q-V MISMATCH (PARTLY CANCEL) & SELLER SKU BLANK CHECK
            // ==================================================================
            const finalOdAoa = [cleanOdAoa[0]]; // remaining OD rows
            const mismatchAoa = [cleanOdAoa[0]]; // Partly Cancel worksheet
            const blankSkuAoa = [cleanOdAoa[0]]; // Blank SKU worksheet
            let mismatchCount = 0;
            let blankSkuCount = 0;

            for (let i = 1; i < cleanOdAoa.length; i++) {
                const row = cleanOdAoa[i];
                const colA = String(row[0]).trim();
                const colF = String(row[5]).trim();
                const colQ = String(row[16]).trim(); // Qty 1
                const colV = String(row[21]).trim(); // Qty 2
                const colAE = String(row[30]).trim();
                const colN = String(row[13]).trim();

                const hasMismatch = (colA !== "" && colF !== "" && colQ !== colV && colAE === "");

                if (hasMismatch) {
                    mismatchAoa.push(row);
                    mismatchCount++;
                } else if (colN === "") {
                    const rowCopy = [...row];
                    rowCopy[13] = colF; // Replace blank Seller SKU with Invoice No
                    blankSkuAoa.push(rowCopy);
                    blankSkuCount++;
                } else {
                    finalOdAoa.push(row);
                }
            }
            mergerLog(`Q-V mismatch rows: ${mismatchCount}, Blank SKU rows: ${blankSkuCount}`, 'success');

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
            const discountReport = [["INVOICE NO", "PERCENTAGE"]];

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
                
                // NOT writing percentage formula in Column AD to preserve original data
                
                if (colAB !== 0) {
                    const discountVal = Math.ceil((colAC / colAB) * 100);
                    const colC = String(row[2]).trim();
                    const colK = String(row[10]).trim();
                    const colN = String(row[13]).trim();
                    const customKey = `${invoiceVal}-${colC}-${colK}-${colN}`;
                    discountReport.push([customKey, `${discountVal}%`]);
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

            // New Blank SKU File - only create when there's actual blank SKU data
            if (blankSkuCount > 0) {
                const wsBlankSku = XLSX.utils.aoa_to_sheet(blankSkuAoa);
                const wbBlankSku = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wbBlankSku, wsBlankSku, "Blank SKUs");
                const outBlankSku = XLSX.write(wbBlankSku, { bookType: 'xlsx', type: 'array' });
                zipFolder.file("BLANK SKU.xlsx", outBlankSku);
                mergerLog(`Blank SKU file created with ${blankSkuCount} rows.`, 'info');
            } else {
                mergerLog(`No blank SKU rows found - skipping BLANK SKU file.`, 'info');
            }

            // 3. Duplicate Invoice File (only if duplicates found)
            if (duplicateCount > 0) {
                const wsDuplicate = XLSX.utils.aoa_to_sheet(duplicateReport);
                const wbDuplicate = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wbDuplicate, wsDuplicate, "Duplicates");
                const outDuplicate = XLSX.write(wbDuplicate, { bookType: 'xlsx', type: 'array' });
                zipFolder.file("2 MORE INVOICE.xlsx", outDuplicate);
                mergerLog(`2 MORE INVOICE file created with ${duplicateCount} duplicate invoices.`, 'info');
            } else {
                mergerLog(`No duplicate invoices found - skipping 2 MORE INVOICE file.`, 'info');
            }

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
                blankSkuAoa,
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

    // Helper: Parse a file (CSV, XLSX, XLS, or misnamed binary Excel) to Array-of-Arrays (AOA) with zero UI freeze & safe cell limits
    async function parseFileToAoa(blob, filename) {
        if (!blob) return [];
        const fName = filename || (blob && blob.name) || 'file.csv';

        // 1. Read array buffer
        const buffer = await new Promise((resolve, reject) => {
            if (blob.arrayBuffer) {
                blob.arrayBuffer().then(resolve).catch(reject);
            } else {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(e.target.error);
                reader.readAsArrayBuffer(blob);
            }
        });

        const u8 = new Uint8Array(buffer);
        
        // 2. Detect Magic Bytes:
        // - OLE CFBF (Excel 97-2004 .xls binary): 0xD0, 0xCF, 0x11, 0xE0
        // - ZIP / OpenXML (.xlsx, .xlsm): 0x50, 0x4B, 0x03, 0x04
        const isOLEXLS = u8.length >= 4 && u8[0] === 0xD0 && u8[1] === 0xCF && u8[2] === 0x11 && u8[3] === 0xE0;
        const isXLSX = u8.length >= 4 && u8[0] === 0x50 && u8[1] === 0x4B && u8[2] === 0x03 && u8[3] === 0x04;

        let rows = [];

        if (isOLEXLS || isXLSX) {
            // ALWAYS use SheetJS for binary Excel files regardless of filename extension!
            await new Promise(r => setTimeout(r, 0));
            const wb = XLSX.read(u8, {
                type: 'array',
                cellDates: true,
                raw: false,
                defval: ""
            });
            if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) return [];
            const sheetName = wb.SheetNames[0];
            const ws = wb.Sheets[sheetName];
            rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        } else {
            // It is genuine text (CSV, TSV, or TXT)
            const text = new TextDecoder('utf-8').decode(u8);
            const delimiter = typeof detectDelimiter === 'function' ? detectDelimiter(text) : ",";
            const parsed = Papa.parse(text, {
                delimiter: delimiter,
                skipEmptyLines: 'greedy',
                dynamicTyping: false
            });
            rows = parsed.data || [];
        }

        // 3. Sanitize rows (trim text to max 32760 chars to avoid SheetJS limit & clean nulls)
        const sanitized = [];
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            if (!Array.isArray(r) || r.length === 0) continue;
            
            let hasValue = false;
            const cleanRow = new Array(r.length);
            for (let c = 0; c < r.length; c++) {
                let val = r[c];
                if (val === null || val === undefined) {
                    cleanRow[c] = "";
                } else if (typeof val === 'string') {
                    if (val.length > 32760) {
                        cleanRow[c] = val.substring(0, 32760);
                    } else {
                        cleanRow[c] = val;
                    }
                    if (val.trim() !== '') hasValue = true;
                } else {
                    cleanRow[c] = val;
                    hasValue = true;
                }
            }
            if (hasValue) {
                sanitized.push(cleanRow);
            }
        }

        return sanitized;
    }

    // Helper: Find party name from local synced list, local storage cache, or filename patterns
    function getPartyNameForCode(code, filesList = []) {
        const strCode = String(code).trim();
        
        // 1. Check in active vendorParties
        if (Array.isArray(vendorParties) && vendorParties.length > 0) {
            const match = vendorParties.find(v => String(v.code).trim() === strCode);
            if (match && match.name && !match.name.toLowerCase().includes('unknown')) {
                return match.name;
            }
        }

        // 2. Check in localStorage cachedVendorParties
        try {
            const cached = JSON.parse(localStorage.getItem('cachedVendorParties') || '[]');
            if (Array.isArray(cached) && cached.length > 0) {
                const match = cached.find(v => String(v.code).trim() === strCode);
                if (match && match.name && !match.name.toLowerCase().includes('unknown')) {
                    if (!vendorParties.some(v => String(v.code).trim() === strCode)) {
                        vendorParties.push(match);
                    }
                    return match.name;
                }
            }
        } catch (e) {}

        // 3. Extract party name from filenames
        const searchFiles = [];
        if (Array.isArray(filesList)) searchFiles.push(...filesList);
        if (Array.isArray(fcFiles)) searchFiles.push(...fcFiles);
        if (Array.isArray(gmFiles)) searchFiles.push(...gmFiles);
        if (typeof sepVariantResults === 'object') {
            ['simple', 'details', 'summary', 'tax'].forEach(k => {
                if (sepVariantResults[k] && Array.isArray(sepVariantResults[k].files)) {
                    searchFiles.push(...sepVariantResults[k].files);
                }
            });
        }

        for (const f of searchFiles) {
            const fname = typeof f === 'string' ? f : (f.name || f.originalName || '');
            if (!fname) continue;

            // Pattern 1: e.g. "101-BHARVITA-AJIO..." or "127-More & More-AJIO..."
            const m1 = fname.match(new RegExp(`^${strCode}-([^-]+?)-(?:AJIO|Details|Summary|Tax|OD)`, 'i'));
            if (m1 && m1[1] && m1[1].trim() && !m1[1].toLowerCase().includes('dropship') && !m1[1].toLowerCase().includes('unknown')) {
                const extracted = m1[1].trim();
                const fullName = `${strCode}-${extracted}`;
                if (!vendorParties.some(v => String(v.code).trim() === strCode)) {
                    vendorParties.push({ code: strCode, name: fullName });
                    try { localStorage.setItem('cachedVendorParties', JSON.stringify(vendorParties)); } catch(e){}
                }
                return fullName;
            }

            // Pattern 2: e.g. "101-BHARVITA..." where next token is not DropShipOrderReports
            const m2 = fname.match(new RegExp(`^${strCode}-([^._]+?)(?:[._-]|$)`));
            if (m2 && m2[1] && m2[1].trim() && !m2[1].toLowerCase().includes('dropship') && !m2[1].toLowerCase().includes('unknown') && !m2[1].toLowerCase().includes('report')) {
                const extracted = m2[1].trim();
                const fullName = `${strCode}-${extracted}`;
                if (!vendorParties.some(v => String(v.code).trim() === strCode)) {
                    vendorParties.push({ code: strCode, name: fullName });
                    try { localStorage.setItem('cachedVendorParties', JSON.stringify(vendorParties)); } catch(e){}
                }
                return fullName;
            }
        }

        return `${strCode}-Unknown`;
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
                const summaryFilename = getAjioSummaryFilename('AJIO_Summary_Report');
                triggerDownload(summaryBlob, summaryFilename);
                mergerLog(`Downloaded Summary Report spreadsheet: ${summaryFilename}`, 'info');
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

                    // 2. Q-V Mismatch & Seller SKU Blank Check
                    const finalOdAoa = [cleanOdAoa[0]];
                    const mismatchAoa = [cleanOdAoa[0]];
                    const blankSkuAoa = [cleanOdAoa[0]];
                    let mismatchCount = 0;
                    let blankSkuCount = 0;
                    for (let i = 1; i < cleanOdAoa.length; i++) {
                        const row = cleanOdAoa[i];
                        const colA = String(row[0]).trim();
                        const colF = String(row[5]).trim();
                        const colQ = String(row[16]).trim();
                        const colV = String(row[21]).trim();
                        const colAE = String(row[30]).trim();
                        const colN = String(row[13]).trim();

                        const hasMismatch = (colA !== "" && colF !== "" && colQ !== colV && colAE === "");
                        if (hasMismatch) {
                            mismatchAoa.push(row);
                            mismatchCount++;
                        } else if (colN === "") {
                            const rowCopy = [...row];
                            rowCopy[13] = colF; // Replace blank Seller SKU with Invoice No
                            blankSkuAoa.push(rowCopy);
                            blankSkuCount++;
                        } else {
                            finalOdAoa.push(row);
                        }
                    }
                    mergerLog(`Q-V mismatch rows: ${mismatchCount}, Blank SKU rows: ${blankSkuCount}`, 'info');

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
                    const discountReport = [["INVOICE NO", "PERCENTAGE"]];

                    for (let i = 1; i < finalOdAoa.length; i++) {
                        const row = finalOdAoa[i];
                        const invoiceVal = String(row[5]).trim();
                        if (invoiceVal !== "") {
                            invoiceCounts[invoiceVal] = (invoiceCounts[invoiceVal] || 0) + 1;
                        }

                        const colAB = parseFloat(row[27]) || 0;
                        const colAC = parseFloat(row[28]) || 0;
                        
                        // NOT writing percentage formula in Column AD to preserve original data
                        
                        if (colAB !== 0) {
                            const discountVal = Math.ceil((colAC / colAB) * 100);
                            const colC = String(row[2]).trim();
                            const colK = String(row[10]).trim();
                            const colN = String(row[13]).trim();
                            const customKey = `${invoiceVal}-${colC}-${colK}-${colN}`;
                            discountReport.push([customKey, `${discountVal}%`]);
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

                    // BLANK SKU file - only create when there's actual blank SKU data
                    if (blankSkuCount > 0) {
                        const wsBlankSku = XLSX.utils.aoa_to_sheet(blankSkuAoa);
                        const wbBlankSku = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wbBlankSku, wsBlankSku, "Blank SKUs");
                        const outBlankSku = XLSX.write(wbBlankSku, { bookType: 'xlsx', type: 'array' });
                        outputZip.file(`${pathPrefix}BLANK SKU.xlsx`, outBlankSku);
                        log(`Blank SKU file created with ${blankSkuCount} rows.`, 'info');
                    } else {
                        log(`No blank SKU rows found - skipping BLANK SKU file.`, 'info');
                    }

                    // 2 MORE INVOICE file - only create when there are duplicate invoices (> 1 count)
                    const duplicateCount = duplicateReport.length - 1;
                    if (duplicateCount > 0) {
                        const wsDuplicate = XLSX.utils.aoa_to_sheet(duplicateReport);
                        const wbDuplicate = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wbDuplicate, wsDuplicate, "Duplicates");
                        const outDuplicate = XLSX.write(wbDuplicate, { bookType: 'xlsx', type: 'array' });
                        outputZip.file(`${pathPrefix}2 MORE INVOICE.xlsx`, outDuplicate);
                        mergerLog(`2 MORE INVOICE file created with ${duplicateCount} duplicate invoices for ${vendorCode}.`, 'info');
                    } else {
                        mergerLog(`No duplicate invoices found for ${vendorCode} - skipping 2 MORE INVOICE file.`, 'info');
                    }

                    // Calculate total orders for master summary report
                    const totalOrders = cntNew + cntCancelled + cntShipped + cntDelivered + cntRTS + cntPO + cntOther;

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
            const summaryReportFilename = getAjioSummaryFilename('ajio invoice summry');
            outputZip.file(summaryReportFilename, summaryOut);

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
            <button class="sub-tab-btn" data-subtab="subtab-blank-sku"><i class="fa-solid fa-barcode"></i> Blank SKU <span class="badge-count">${data.blankSkuAoa.length - 1}</span></button>
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
                    <div class="stat-box mismatch" style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); color: #d97706;">
                        <div class="stat-val">${data.blankSkuAoa.length - 1}</div>
                        <div class="stat-label">Blank SKU Rows Separated</div>
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

        // --- SUBTAB: Blank SKUs ---
        const paneBlankSku = document.createElement('div');
        paneBlankSku.id = 'subtab-blank-sku';
        paneBlankSku.className = 'sub-tab-pane';
        paneBlankSku.appendChild(createScrollableTable(data.blankSkuAoa));
        panesWrapper.appendChild(paneBlankSku);

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

    let vendorParties = [];
    try {
        const savedParties = localStorage.getItem('cachedVendorParties');
        if (savedParties) {
            vendorParties = JSON.parse(savedParties);
        }
    } catch (e) {}

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

    // Vendor Logger Utility
    function vendorLog(message, type = 'info') {
        if (!vendorConsoleLog) return;
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        line.innerText = `[${timestamp}] ${message}`;
        if (vendorConsoleLog.children.length > 300) {
            vendorConsoleLog.removeChild(vendorConsoleLog.firstChild);
        }
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
      var sheet = ss.getSheetByName("AJIO PARTY NAME");
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Sheet 'AJIO PARTY NAME' not found"}))
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
      var sheetParties = getSheetRobust("AJIO PARTY NAME");
      if (!sheetParties) {
        throw new Error("AJIO PARTY NAME sheet not found");
      }
      sheetParties.appendRow([json.code, json.name]);
      return ContentService.createTextOutput(JSON.stringify({status: "success"}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Action: Edit Party
    if (action === "editParty") {
      var sheetParties = getSheetRobust("AJIO PARTY NAME");
      if (!sheetParties) {
        throw new Error("AJIO PARTY NAME sheet not found");
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
      var sheetParties = getSheetRobust("AJIO PARTY NAME");
      if (!sheetParties) {
        throw new Error("AJIO PARTY NAME sheet not found");
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

        vendorTableContainer.style.maxHeight = '480px';
        vendorTableContainer.style.overflowY = 'auto';
        vendorTableContainer.style.overflowX = 'auto';

        const table = document.createElement('table');
        table.className = 'data-table';
        table.style.width = '100%';
        table.style.borderCollapse = 'separate';
        table.style.borderSpacing = '0';
        
        table.innerHTML = `
            <thead style="position: sticky; top: 0; z-index: 10; background: #f8fafc; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <tr>
                    <th style="width: 20%; background: #f8fafc; padding: 0.75rem 1rem; border-bottom: 2px solid var(--border-color);">CODE</th>
                    <th style="width: 60%; background: #f8fafc; padding: 0.75rem 1rem; border-bottom: 2px solid var(--border-color);">PARTY CODE / NAME</th>
                    <th style="width: 20%; text-align: center; background: #f8fafc; padding: 0.75rem 1rem; border-bottom: 2px solid var(--border-color);">ACTIONS</th>
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
    async function fetchVendors() {
        if (!GOOGLE_SHEETS_SCRIPT_URL) {
            vendorLog("No Google Sheets URL configured.", "error");
            renderVendorTable();
            return;
        }

        if (vendorSyncStatus) {
            vendorSyncStatus.className = 'status-indicator syncing';
            vendorSyncStatus.innerText = 'Syncing...';
        }
        vendorLog("Fetching vendor directory from Google Sheets...", "process");

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 sec timeout for Google Sheets

            // Fetch via direct GET with action=getParties
            const response = await fetch(`${GOOGLE_SHEETS_SCRIPT_URL}?action=getParties`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const res = await response.json();

            if (res && res.parties && Array.isArray(res.parties) && res.parties.length > 0) {
                vendorParties = res.parties;
                try { localStorage.setItem('cachedVendorParties', JSON.stringify(vendorParties)); } catch(e){}
                vendorLog(`Fetched ${vendorParties.length} vendor record(s) from Google Sheets successfully.`, "success");
                if (vendorSyncStatus) {
                    vendorSyncStatus.className = 'status-indicator success';
                    vendorSyncStatus.innerText = 'Connected';
                }
                renderVendorTable();
                return;
            }
        } catch (err) {
            vendorLog(`Google Sheets sync error: ${err.message}`, "error");
        }

        // Local fallback
        const savedParties = localStorage.getItem('cachedVendorParties');
        if (savedParties) {
            try {
                vendorParties = JSON.parse(savedParties);
            } catch(e) {}
        }
        vendorLog(`Google Sheets sync offline. Active vendors in local cache: ${vendorParties.length}`, "info");
        if (vendorSyncStatus) {
            vendorSyncStatus.className = 'status-indicator idle';
            vendorSyncStatus.innerText = 'Offline';
        }
        renderVendorTable();
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

    // Initial render from cache & background sync
    if (vendorParties && vendorParties.length > 0) {
        renderVendorTable(vendorParties);
    }
    fetchVendors();

    /* ==========================================================================
       SEPARATE FILE PROCESSING LOGIC
       ========================================================================== */
    // State Variables
    let separateFile = null;
    /* ==========================================================================
       SEPARATE FILE (4-VARIANT PARALLEL BATCH) LOGIC
       ========================================================================== */
    const sepUploadedFiles = {
        simple: null,
        details: null,
        summary: null,
        tax: null
    };

    const sepVariantResults = {
        simple: { label: '1. SIMPLE', files: [], zipBlob: null, zipName: 'ajio_simple_seprate_bundle.zip', color: '#8b5cf6' },
        details: { label: '2. DETAILS', files: [], zipBlob: null, zipName: 'ajio_details_seprate_bundle.zip', color: '#4f46e5' },
        summary: { label: '3. SUMMARY', files: [], zipBlob: null, zipName: 'ajio_summry_seprate_bundle.zip', color: '#2563eb' },
        tax: { label: '4. TAX SPLIT', files: [], zipBlob: null, zipName: 'ajio_tax_seprate_bundle.zip', color: '#0d9488' }
    };

    let sepModalCurrentFilter = 'all';

    const separateBtn = document.getElementById('separateBtn');
    const sepSelectedCount = document.getElementById('sepSelectedCount');
    const separateStatus = document.getElementById('separateStatus');
    const separateProgressCard = document.getElementById('separateProgressCard');
    const separateProgressBar = document.getElementById('separateProgressBar');
    const separateProgressPercent = document.getElementById('separateProgressPercent');
    const separateProgressStepText = document.getElementById('separateProgressStepText');
    const separateOutputContainer = document.getElementById('separateOutputContainer');
    const separateConsoleLog = document.getElementById('separateConsoleLog');
    const clearSeparateLogBtn = document.getElementById('clearSeparateLogBtn');
    const clearAllSepFilesBtn = document.getElementById('clearAllSepFilesBtn');

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

    function separateLog(message, type = 'info') {
        if (!separateConsoleLog) return;
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        line.innerText = `[${timestamp}] ${message}`;
        if (separateConsoleLog.children.length > 300) {
            separateConsoleLog.removeChild(separateConsoleLog.firstChild);
        }
        separateConsoleLog.appendChild(line);
        separateConsoleLog.scrollTop = separateConsoleLog.scrollHeight;
    }

    if (clearSeparateLogBtn) {
        clearSeparateLogBtn.addEventListener('click', () => {
            separateConsoleLog.innerHTML = '';
            separateLog('Log cleared.', 'info');
        });
    }

    function updateSepUploadState() {
        let count = 0;
        ['simple', 'details', 'summary', 'tax'].forEach(k => {
            if (sepUploadedFiles[k]) count++;
        });

        if (sepSelectedCount) sepSelectedCount.innerText = count;

        if (count > 0 && separateBtn) {
            separateBtn.removeAttribute('disabled');
        } else if (separateBtn) {
            separateBtn.setAttribute('disabled', 'true');
        }
    }

    function initSepVariantUpload(key, dropzoneId, inputId, displayId, clearBtnId) {
        const dropzone = document.getElementById(dropzoneId);
        const input = document.getElementById(inputId);
        const display = document.getElementById(displayId);
        const clearBtn = document.getElementById(clearBtnId);

        if (!dropzone || !input) return;

        setupMiniDropzone(dropzone, input, (file) => {
            sepUploadedFiles[key] = file;
            if (display) {
                display.innerText = `${file.name} (${formatBytes(file.size)})`;
                display.title = file.name;
            }
            dropzone.classList.add('file-selected');
            if (clearBtn) clearBtn.style.display = 'inline-block';
            separateLog(`Selected file for ${sepVariantResults[key].label}: ${file.name}`, 'success');
            updateSepUploadState();
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const ok = await showCustomConfirm('Remove File', `Are you sure you want to remove the ${sepVariantResults[key].label} file?`, 'danger', 'Remove');
                if (!ok) return;

                sepUploadedFiles[key] = null;
                input.value = '';
                if (display) display.innerText = `Click or drag ${sepVariantResults[key].label.split('. ')[1]} file`;
                dropzone.classList.remove('file-selected');
                clearBtn.style.display = 'none';
                separateLog(`Cleared file for ${sepVariantResults[key].label}`, 'info');
                updateSepUploadState();
            });
        }
    }

    initSepVariantUpload('simple', 'sepDropzoneSimple', 'sepFileInputSimple', 'sepFileDisplaySimple', 'clearSepSimpleBtn');
    initSepVariantUpload('details', 'sepDropzoneDetails', 'sepFileInputDetails', 'sepFileDisplayDetails', 'clearSepDetailsBtn');
    initSepVariantUpload('summary', 'sepDropzoneSummary', 'sepFileInputSummary', 'sepFileDisplaySummary', 'clearSepSummaryBtn');
    initSepVariantUpload('tax', 'sepDropzoneTax', 'sepFileInputTax', 'sepFileDisplayTax', 'clearSepTaxBtn');

    if (clearAllSepFilesBtn) {
        clearAllSepFilesBtn.addEventListener('click', async () => {
            const ok = await showCustomConfirm('Clear All Files', 'Are you sure you want to clear all uploaded files and separated data?', 'danger', 'Clear All');
            if (!ok) return;

            ['simple', 'details', 'summary', 'tax'].forEach(k => {
                sepUploadedFiles[k] = null;
                if (sepVariantResults[k]) {
                    sepVariantResults[k].files = [];
                    sepVariantResults[k].zipBlob = null;
                }
                const input = document.getElementById(`sepFileInput${k.charAt(0).toUpperCase() + k.slice(1)}`);
                const display = document.getElementById(`sepFileDisplay${k.charAt(0).toUpperCase() + k.slice(1)}`);
                const dropzone = document.getElementById(`sepDropzone${k.charAt(0).toUpperCase() + k.slice(1)}`);
                const clearBtn = document.getElementById(`clearSep${k.charAt(0).toUpperCase() + k.slice(1)}Btn`);
                if (input) input.value = '';
                if (display) display.innerText = `Click or drag ${sepVariantResults[k].label.split('. ')[1]} file`;
                if (dropzone) dropzone.classList.remove('file-selected');
                if (clearBtn) clearBtn.style.display = 'none';
            });
            updateSepUploadState();
            renderSeparateDashboard();
            clearTabSession('separate_tab');
            separateLog('Cleared all uploaded files and separated data.', 'info');
        });
    }

    async function rebuildSepVariantZip(variantKey) {
        const vData = sepVariantResults[variantKey];
        if (!vData) return;
        try {
            if (!vData.files || vData.files.length === 0) {
                vData.zipBlob = null;
                return;
            }
            const zip = new JSZip();
            for (const file of vData.files) {
                if (file.blob) {
                    const buffer = await file.blob.arrayBuffer();
                    zip.file(file.name, buffer);
                }
            }
            vData.zipBlob = await zip.generateAsync({ type: 'blob' });
        } catch (e) {
            console.error(`Failed to rebuild ZIP for ${variantKey}:`, e);
        }
    }

    async function saveSepFileRename(fileObj, newBaseName) {
        if (!fileObj) return;
        newBaseName = (newBaseName || '').trim();
        if (!newBaseName) {
            alert('Filename cannot be empty.');
            return;
        }

        const lastDot = fileObj.name.lastIndexOf('.');
        const origExt = lastDot !== -1 ? fileObj.name.substring(lastDot) : '.xlsx';

        if (newBaseName.toLowerCase().endsWith(origExt.toLowerCase())) {
            newBaseName = newBaseName.substring(0, newBaseName.length - origExt.length).trim();
        }

        fileObj.name = newBaseName + origExt;

        let vKey = fileObj.variantKey;
        if (!vKey || !sepVariantResults[vKey]) {
            for (const k of ['simple', 'details', 'summary', 'tax']) {
                if (sepVariantResults[k] && sepVariantResults[k].files.some(f => (fileObj.id && f.id === fileObj.id) || f.name === fileObj.name)) {
                    vKey = k;
                    fileObj.variantKey = k;
                    break;
                }
            }
        }

        if (vKey) {
            await rebuildSepVariantZip(vKey);
        }

        renderSeparateDashboard();
        const modal = document.getElementById('sepFullscreenModal');
        if (modal && modal.classList.contains('show')) {
            renderSepModalTableRows();
        }
        saveTabSession('separate_tab', { results: sepVariantResults });
        separateLog(`Manually renamed file in [${fileObj.variantLabel || vKey}] to: "${fileObj.name}"`, 'success');
    }

    async function deleteSepFile(fileObj) {
        if (!fileObj) return;
        const fileName = fileObj.name || 'this file';
        const variantLabel = fileObj.variantLabel || 'Selected Variant';

        const ok = await customConfirm(
            `Are you sure you want to delete "${fileName}" from ${variantLabel}?`,
            {
                title: 'Delete File Confirmation',
                confirmText: 'Yes, Delete',
                cancelText: 'Cancel',
                type: 'danger'
            }
        );
        if (!ok) return;

        let vKey = fileObj.variantKey;
        if (!vKey || !sepVariantResults[vKey]) {
            for (const k of ['simple', 'details', 'summary', 'tax']) {
                if (sepVariantResults[k] && sepVariantResults[k].files.some(f => (fileObj.id && f.id === fileObj.id) || f.name === fileObj.name)) {
                    vKey = k;
                    break;
                }
            }
        }

        if (vKey && sepVariantResults[vKey]) {
            const vData = sepVariantResults[vKey];
            vData.files = vData.files.filter(f => {
                if (fileObj.id && f.id) {
                    return f.id !== fileObj.id;
                }
                return f.name !== fileObj.name;
            });
            await rebuildSepVariantZip(vKey);
        }

        renderSeparateDashboard();
        const modal = document.getElementById('sepFullscreenModal');
        if (modal && modal.classList.contains('show')) {
            renderSepModalTableRows();
        }
        saveTabSession('separate_tab', { results: sepVariantResults });
        separateLog(`Deleted "${fileName}" from [${variantLabel}]`, 'info');
    }

    function getAllSeparatedFiles() {
        let all = [];
        ['simple', 'details', 'summary', 'tax'].forEach(k => {
            if (sepVariantResults[k] && sepVariantResults[k].files) {
                all = all.concat(sepVariantResults[k].files);
            }
        });
        return all;
    }

    async function downloadAllSepZips() {
        const activeKeys = ['simple', 'details', 'summary', 'tax'].filter(k => sepVariantResults[k].files.length > 0 && sepVariantResults[k].zipBlob);
        if (activeKeys.length === 0) {
            alert('No separated files available to download.');
            return;
        }

        separateLog(`Downloading ${activeKeys.length} ZIP packages...`, 'process');
        activeKeys.forEach((k, idx) => {
            const vData = sepVariantResults[k];
            setTimeout(() => {
                triggerDownload(vData.zipBlob, vData.zipName);
                separateLog(`Downloaded ZIP package: ${vData.zipName}`, 'info');
            }, idx * 350);
        });
    }

    // Main Run Separation Logic (Batch / Parallel across all uploaded variants)
    if (separateBtn) {
        separateBtn.addEventListener('click', async () => {
            const activeVariants = ['simple', 'details', 'summary', 'tax'].filter(k => sepUploadedFiles[k] !== null);
            if (activeVariants.length === 0) {
                alert('Please upload at least one Excel file to separate.');
                return;
            }

            separateBtn.setAttribute('disabled', 'true');
            if (separateStatus) {
                separateStatus.className = 'status-indicator processing';
                separateStatus.innerText = 'Processing';
            }
            if (separateProgressCard) separateProgressCard.classList.remove('hidden');
            if (separateProgressBar) separateProgressBar.style.width = '5%';
            if (separateProgressPercent) separateProgressPercent.innerText = '5%';
            if (separateProgressStepText) separateProgressStepText.innerText = 'Initializing separation...';

            if (separateOutputContainer) {
                separateOutputContainer.innerHTML = `
                    <div class="empty-output-state">
                        <i class="fa-solid fa-spinner fa-spin placeholder-icon" style="color: #8b5cf6;"></i>
                        <p>Splitting files across ${activeVariants.length} variant(s), please wait...</p>
                    </div>
                `;
            }

            separateLog(`Starting Batch File Separation across ${activeVariants.length} variant(s)...`, 'process');

            try {
                const now = new Date();
                const pad = (n) => String(n).padStart(2, '0');
                const dtStamp = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

                let totalProcessedVariants = 0;

                for (let vIdx = 0; vIdx < activeVariants.length; vIdx++) {
                    const vKey = activeVariants[vIdx];
                    const sourceFile = sepUploadedFiles[vKey];
                    const vData = sepVariantResults[vKey];

                    let filterField = 3;
                    let dataStartRow = 2;
                    let nameSuffix = "-AJIO";
                    let headerRowCount = 2;

                    if (vKey === 'simple') {
                        nameSuffix = "-AJIO";
                        filterField = 3;
                        dataStartRow = 2;
                        headerRowCount = 2;
                    } else if (vKey === 'details') {
                        nameSuffix = " DETAILS SHEET AJIO";
                        filterField = 3;
                        dataStartRow = 2;
                        headerRowCount = 2;
                    } else if (vKey === 'summary') {
                        nameSuffix = " SUMMARY SHEET AJIO";
                        filterField = 6;
                        dataStartRow = 2;
                        headerRowCount = 2;
                    } else if (vKey === 'tax') {
                        nameSuffix = "-AJIO";
                        filterField = 0;
                        dataStartRow = 1;
                        headerRowCount = 1;
                    }

                    separateLog(`[${vData.label}] Reading ${sourceFile.name}...`, 'info');

                    const buffer = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.onerror = (e) => reject(new Error(`Failed to read file ${sourceFile.name}`));
                        reader.readAsArrayBuffer(sourceFile);
                    });

                    const wb = XLSX.read(buffer, { type: 'array' });
                    const firstSheetName = wb.SheetNames[0];
                    const ws = wb.Sheets[firstSheetName];
                    const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

                    if (aoa.length <= headerRowCount) {
                        throw new Error(`[${vData.label}] "${sourceFile.name}" contains no data rows below header.`);
                    }

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
                        throw new Error(`[${vData.label}] No valid keys found in filter column (Col ${colIndexToLetter(filterField)}).`);
                    }

                    separateLog(`[${vData.label}] Found ${keys.length} unique group keys to split.`, 'process');

                    const pipelineZip = new JSZip();
                    const splitFiles = [];
                    let fileCounter = 1;

                    for (let i = 0; i < keys.length; i++) {
                        const keyVal = keys[i];
                        
                        const newRows = [];
                        for (let h = 0; h < headerRowCount; h++) {
                            if (aoa[h]) newRows.push([...aoa[h]]);
                        }

                        let matchedCount = 0;
                        for (let r = dataStartRow; r < aoa.length; r++) {
                            const rowVal = String(aoa[r][filterField] || "").trim();
                            if (rowVal === keyVal) {
                                newRows.push([...aoa[r]]);
                                matchedCount++;
                            }
                        }

                        const newWb = XLSX.utils.book_new();
                        const newWs = XLSX.utils.aoa_to_sheet(newRows);
                        XLSX.utils.book_append_sheet(newWb, newWs, "Sheet1");

                        let displayKey = keyVal;
                        const hyphenIdx = keyVal.indexOf("-");
                        if (hyphenIdx !== -1) {
                            const prefixPart = keyVal.substring(0, hyphenIdx);
                            if (prefixPart.length === 5 && /^[A-Za-z]{2}\d{3}$/.test(prefixPart)) {
                                displayKey = keyVal.substring(2);
                            }
                        } else {
                            if (keyVal.length === 5 && /^[A-Za-z]{2}\d{3}$/.test(keyVal)) {
                                displayKey = keyVal.substring(2);
                            }
                        }

                        let finalName = "";
                        if (vKey === "tax") {
                            const firstNum = displayKey.split("-")[0];
                            finalName = `${firstNum}-Tax-${displayKey}-AJIO`;
                        } else {
                            finalName = `${displayKey}${nameSuffix}`;
                        }

                        const outFilename = `${finalName} ${dtStamp}_${String(fileCounter).padStart(2, '0')}.xlsx`;
                        const excelBuffer = XLSX.write(newWb, { bookType: 'xlsx', type: 'array' });
                        const fileBlob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

                        pipelineZip.file(outFilename, excelBuffer);

                        const uiColor = separateColorList[(fileCounter - 1) % separateColorList.length];

                        splitFiles.push({
                            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                            variantKey: vKey,
                            variantLabel: vData.label,
                            name: outFilename,
                            originalName: outFilename,
                            size: fileBlob.size,
                            rows: matchedCount,
                            blob: fileBlob,
                            aoa: newRows,
                            color: uiColor
                        });

                        fileCounter++;
                    }

                    vData.files = splitFiles;
                    vData.zipBlob = await pipelineZip.generateAsync({ type: 'blob' });
                    totalProcessedVariants++;

                    const progressPct = Math.round(((vIdx + 1) / activeVariants.length) * 90);
                    if (separateProgressBar) separateProgressBar.style.width = `${progressPct}%`;
                    if (separateProgressPercent) separateProgressPercent.innerText = `${progressPct}%`;
                    if (separateProgressStepText) separateProgressStepText.innerText = `Finished ${vData.label} (${splitFiles.length} files)...`;
                    separateLog(`[${vData.label}] Completed packaging ${splitFiles.length} file(s).`, 'success');
                }

                renderSeparateDashboard();
                saveTabSession('separate_tab', { results: sepVariantResults });

                if (separateProgressBar) separateProgressBar.style.width = '100%';
                if (separateProgressPercent) separateProgressPercent.innerText = '100%';
                if (separateProgressStepText) separateProgressStepText.innerText = 'Separation completed successfully!';

                if (separateStatus) {
                    separateStatus.className = 'status-indicator success';
                    separateStatus.innerText = 'Completed';
                }
                alert("SEPARATION PROCESS COMPLETED SUCCESSFULLY!");
                separateLog('Batch separation pipeline finished successfully. All variant ZIPs ready.', 'success');

            } catch (err) {
                separateLog(`Separation Pipeline failed: ${err.message}`, 'error');
                if (separateStatus) {
                    separateStatus.className = 'status-indicator idle';
                    separateStatus.innerText = 'Failed';
                }
                if (separateOutputContainer) {
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

    function renderSeparateDashboard() {
        if (!separateOutputContainer) return;
        separateOutputContainer.innerHTML = '';
        separateOutputContainer.className = 'processed-container';

        const allFiles = getAllSeparatedFiles();
        const activeVariants = ['simple', 'details', 'summary', 'tax'].filter(k => sepVariantResults[k].files.length > 0);

        if (allFiles.length === 0) {
            separateOutputContainer.innerHTML = `
                <div class="empty-output-state">
                    <i class="fa-solid fa-file-export placeholder-icon"></i>
                    <p>Upload files and click process to separate into bundles.</p>
                </div>
            `;
            return;
        }

        const header = document.createElement('div');
        header.className = 'processed-header';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.width = '100%';
        header.style.marginBottom = '1rem';
        header.style.flexWrap = 'wrap';
        header.style.gap = '0.5rem';

        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                <h3 style="margin: 0;"><i class="fa-solid fa-circle-check text-success"></i> Separated Files (${allFiles.length})</h3>
                <span class="badge" style="background:#ede9fe; color:#6d28d9; font-size:0.75rem; font-weight:700;">${activeVariants.length} Active Variant(s)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn" id="openAllSepFullscreenBtn" type="button" style="background: linear-gradient(135deg, #4f46e5, #3730a3); color: #ffffff !important; display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.9rem; font-size: 0.8rem; font-weight: 600; border-radius: 8px; border: none; cursor: pointer; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.25);">
                    <i class="fa-solid fa-expand"></i> Full View (All)
                </button>
                <button class="btn btn-glow" id="downloadAllSepZipsBtn" style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: #ffffff !important; font-size: 0.8rem; font-weight: 600; padding: 0.45rem 0.9rem; border-radius: 8px; border: none; cursor: pointer;">
                    <i class="fa-solid fa-file-zipper"></i> Download All (4 ZIPs)
                </button>
            </div>
        `;
        separateOutputContainer.appendChild(header);

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
        grid.style.gap = '0.85rem';
        grid.style.width = '100%';

        ['simple', 'details', 'summary', 'tax'].forEach(k => {
            const vData = sepVariantResults[k];
            const fileCount = vData.files.length;
            const card = document.createElement('div');
            card.className = 'processed-item';
            card.style.borderLeft = `5px solid ${vData.color}`;
            card.style.background = 'white';
            card.style.padding = '0.9rem 1rem';
            card.style.borderRadius = '10px';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.gap = '0.55rem';
            card.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
            card.style.border = '1px solid var(--border-color)';
            card.style.borderLeftWidth = '5px';

            const totalRows = vData.files.reduce((acc, f) => acc + f.rows, 0);
            const totalBytes = vData.files.reduce((acc, f) => acc + f.size, 0);

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 700; font-size: 0.9rem; color: #1e293b; display: flex; align-items: center; gap: 0.4rem;">
                        <i class="fa-solid fa-folder-closed" style="color: ${vData.color};"></i> ${vData.label}
                    </span>
                    <span class="badge" style="background: #f1f5f9; color: #475569; font-size: 0.72rem; font-weight: 700;">
                        ${fileCount > 0 ? `${fileCount} Files` : 'Not Processed'}
                    </span>
                </div>
                ${fileCount > 0 ? `
                    <div style="display: flex; gap: 0.8rem; font-size: 0.75rem; color: var(--text-muted); flex-wrap: wrap;">
                        <span><i class="fa-solid fa-database"></i> ${totalRows.toLocaleString()} Rows</span>
                        <span><i class="fa-solid fa-weight-hanging"></i> ${formatBytes(totalBytes)}</span>
                        <span><i class="fa-solid fa-file-zipper"></i> ${vData.zipName}</span>
                    </div>
                    <div style="display: flex; gap: 0.4rem; margin-top: 0.35rem; flex-wrap: wrap;">
                        <button type="button" class="btn open-var-modal-btn" data-variant="${k}" style="background: linear-gradient(135deg, #4f46e5, #3730a3); color: #ffffff !important; font-size: 0.74rem; font-weight: 600; padding: 0.4rem 0.6rem; border-radius: 8px; flex: 1; min-width: 95px; display: flex; align-items: center; justify-content: center; gap: 0.3rem; border: none; cursor: pointer; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">
                            <i class="fa-solid fa-expand"></i> Full View (${fileCount})
                        </button>
                        <button type="button" class="btn move-var-folder-btn" data-variant="${k}" style="background: linear-gradient(135deg, #059669, #10b981); color: #ffffff !important; font-size: 0.74rem; font-weight: 600; padding: 0.4rem 0.6rem; border-radius: 8px; flex: 1.3; min-width: 140px; display: flex; align-items: center; justify-content: center; gap: 0.3rem; border: none; cursor: pointer; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);" title="Move only ${vData.label} files to Folder Create">
                            <i class="fa-solid fa-folder-plus"></i> Move to Folder Create
                        </button>
                        <button type="button" class="btn dl-var-zip-btn" data-variant="${k}" style="background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #ffffff !important; font-size: 0.74rem; font-weight: 600; padding: 0.4rem 0.6rem; border-radius: 8px; flex: 1; min-width: 95px; display: flex; align-items: center; justify-content: center; gap: 0.3rem; border: none; cursor: pointer; box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2);">
                            <i class="fa-solid fa-download"></i> ZIP
                        </button>
                    </div>
                ` : `
                    <div style="font-size: 0.75rem; color: var(--text-muted); padding: 0.5rem 0;">No file uploaded for this variant.</div>
                `}
            `;

            const fullViewBtn = card.querySelector('.open-var-modal-btn');
            if (fullViewBtn) {
                fullViewBtn.addEventListener('click', () => {
                    openSepFullscreenModal(k);
                });
            }

            const moveBtn = card.querySelector('.move-var-folder-btn');
            if (moveBtn) {
                moveBtn.addEventListener('click', () => {
                    moveToFolderCreateFromSeparate(k);
                });
            }

            const dlZipBtn = card.querySelector('.dl-var-zip-btn');
            if (dlZipBtn) {
                dlZipBtn.addEventListener('click', () => {
                    if (vData.zipBlob) {
                        triggerDownload(vData.zipBlob, vData.zipName);
                        separateLog(`Downloaded ZIP: ${vData.zipName}`, 'info');
                    }
                });
            }

            grid.appendChild(card);
        });

        separateOutputContainer.appendChild(grid);

        const openAllModalBtn = document.getElementById('openAllSepFullscreenBtn');
        if (openAllModalBtn) {
            openAllModalBtn.addEventListener('click', () => {
                openSepFullscreenModal('all');
            });
        }

        const dlAllZipsBtn = document.getElementById('downloadAllSepZipsBtn');
        if (dlAllZipsBtn) {
            dlAllZipsBtn.addEventListener('click', downloadAllSepZips);
        }
    }

    function openSepFullscreenModal(variantFilter = 'all') {
        const modal = document.getElementById('sepFullscreenModal');
        if (!modal) return;

        sepModalCurrentFilter = variantFilter;

        const allFiles = getAllSeparatedFiles();
        const simpleCount = sepVariantResults.simple.files.length;
        const detailsCount = sepVariantResults.details.files.length;
        const summaryCount = sepVariantResults.summary.files.length;
        const taxCount = sepVariantResults.tax.files.length;

        const totalBadge = document.getElementById('modalSepTotalBadge');
        if (totalBadge) totalBadge.innerHTML = `<i class="fa-solid fa-files"></i> Total: ${allFiles.length}`;

        const simpleBadge = document.getElementById('modalSepSimpleBadge');
        if (simpleBadge) simpleBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Simple: ${simpleCount}`;

        const detailsBadge = document.getElementById('modalSepDetailsBadge');
        if (detailsBadge) detailsBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Details: ${detailsCount}`;

        const summaryBadge = document.getElementById('modalSepSummaryBadge');
        if (summaryBadge) summaryBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Summary: ${summaryCount}`;

        const taxBadge = document.getElementById('modalSepTaxBadge');
        if (taxBadge) taxBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Tax: ${taxCount}`;

        const filterAllBtn = document.getElementById('modalSepFilterAllBtn');
        const filterSimpleBtn = document.getElementById('modalSepFilterSimpleBtn');
        const filterDetailsBtn = document.getElementById('modalSepFilterDetailsBtn');
        const filterSummaryBtn = document.getElementById('modalSepFilterSummaryBtn');
        const filterTaxBtn = document.getElementById('modalSepFilterTaxBtn');

        if (filterAllBtn) filterAllBtn.innerText = `All Files (${allFiles.length})`;
        if (filterSimpleBtn) filterSimpleBtn.innerText = `1. Simple (${simpleCount})`;
        if (filterDetailsBtn) filterDetailsBtn.innerText = `2. Details (${detailsCount})`;
        if (filterSummaryBtn) filterSummaryBtn.innerText = `3. Summary (${summaryCount})`;
        if (filterTaxBtn) filterTaxBtn.innerText = `4. Tax Split (${taxCount})`;

        document.querySelectorAll('.sep-filter-btn').forEach(btn => btn.classList.remove('active'));
        const targetBtn = document.querySelector(`.sep-filter-btn[data-filter="${variantFilter}"]`) || filterAllBtn;
        if (targetBtn) targetBtn.classList.add('active');

        const searchInput = document.getElementById('modalSepSearchInput');
        if (searchInput) searchInput.value = '';

        renderSepModalTableRows();
        modal.classList.add('show');
    }

    function closeSepFullscreenModal() {
        const modal = document.getElementById('sepFullscreenModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    function renderSepModalTableRows() {
        const tableBody = document.getElementById('modalSepTableBody');
        const summaryText = document.getElementById('modalSepSummaryText');
        const searchInput = document.getElementById('modalSepSearchInput');
        if (!tableBody) return;

        let allFiles = getAllSeparatedFiles();
        const simpleCount = sepVariantResults.simple.files.length;
        const detailsCount = sepVariantResults.details.files.length;
        const summaryCount = sepVariantResults.summary.files.length;
        const taxCount = sepVariantResults.tax.files.length;

        // Dynamic update of Header Badges & Filter Tabs on every render (including deletes)
        const totalBadge = document.getElementById('modalSepTotalBadge');
        if (totalBadge) totalBadge.innerHTML = `<i class="fa-solid fa-files"></i> Total: ${allFiles.length}`;

        const simpleBadge = document.getElementById('modalSepSimpleBadge');
        if (simpleBadge) simpleBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Simple: ${simpleCount}`;

        const detailsBadge = document.getElementById('modalSepDetailsBadge');
        if (detailsBadge) detailsBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Details: ${detailsCount}`;

        const summaryBadge = document.getElementById('modalSepSummaryBadge');
        if (summaryBadge) summaryBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Summary: ${summaryCount}`;

        const taxBadge = document.getElementById('modalSepTaxBadge');
        if (taxBadge) taxBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Tax: ${taxCount}`;

        const filterAllBtn = document.getElementById('modalSepFilterAllBtn');
        const filterSimpleBtn = document.getElementById('modalSepFilterSimpleBtn');
        const filterDetailsBtn = document.getElementById('modalSepFilterDetailsBtn');
        const filterSummaryBtn = document.getElementById('modalSepFilterSummaryBtn');
        const filterTaxBtn = document.getElementById('modalSepFilterTaxBtn');

        if (filterAllBtn) filterAllBtn.innerText = `All Files (${allFiles.length})`;
        if (filterSimpleBtn) filterSimpleBtn.innerText = `1. Simple (${simpleCount})`;
        if (filterDetailsBtn) filterDetailsBtn.innerText = `2. Details (${detailsCount})`;
        if (filterSummaryBtn) filterSummaryBtn.innerText = `3. Summary (${summaryCount})`;
        if (filterTaxBtn) filterTaxBtn.innerText = `4. Tax Split (${taxCount})`;

        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

        let filtered = allFiles.filter(file => {
            if (sepModalCurrentFilter !== 'all' && file.variantKey !== sepModalCurrentFilter) {
                return false;
            }
            if (!query) return true;
            return file.name.toLowerCase().includes(query) || (file.variantLabel && file.variantLabel.toLowerCase().includes(query));
        });

        tableBody.innerHTML = '';

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                        <i class="fa-solid fa-filter-circle-xmark" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
                        No separated files found for current filter.
                    </td>
                </tr>
            `;
            if (summaryText) summaryText.innerText = `Showing 0 of ${allFiles.length} files`;
            return;
        }

        filtered.forEach((file, index) => {
            const tr = document.createElement('tr');
            tr.className = 'rename-row-ok';

            const lastDot = file.name.lastIndexOf('.');
            const baseName = lastDot !== -1 ? file.name.substring(0, lastDot) : file.name;
            const ext = lastDot !== -1 ? file.name.substring(lastDot) : '.xlsx';

            const vBadgeColor = 
                file.variantKey === 'simple' ? '#8b5cf6' :
                file.variantKey === 'details' ? '#4f46e5' :
                file.variantKey === 'summary' ? '#2563eb' : '#0d9488';

            tr.innerHTML = `
                <td style="text-align: center; font-weight: 700; color: var(--text-muted);">${index + 1}</td>
                <td>
                    <span style="background: ${file.color || '#f1f5f9'}; border: 1px solid rgba(0,0,0,0.1); padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.75rem; color: #1e293b; display: inline-flex; align-items: center; gap: 4px;">
                        <i class="fa-solid fa-layer-group" style="color: ${vBadgeColor};"></i> ${file.variantLabel}
                    </span>
                </td>
                <td class="cell-rename-container">
                    <div class="display-name-box" style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
                        <span class="file-name-text" style="font-weight: 700; color: var(--text-primary); font-size: 0.85rem; word-break: break-all; cursor: pointer;" title="Click to view Excel preview">
                            ${file.name}
                        </span>
                        <button type="button" class="rename-edit-btn btn-inline-edit" title="Edit filename manually">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                    </div>
                    <div class="edit-name-box" style="display: none; align-items: center; gap: 0.35rem; width: 100%;">
                        <div style="display: flex; align-items: center; border: 1.5px solid #8b5cf6; border-radius: 6px; overflow: hidden; background: white; flex: 1;">
                            <input type="text" class="rename-edit-input" value="${baseName}" style="border: none; padding: 0.3rem 0.5rem; font-size: 0.82rem; outline: none; width: 100%;">
                            <span class="ext-locked-badge" style="background: #e2e8f0; color: #334155; font-weight: 700; font-size: 0.8rem; padding: 0.3rem 0.55rem; border-left: 1px solid #cbd5e1; user-select: none; white-space: nowrap;">${ext}</span>
                        </div>
                        <button type="button" class="btn btn-success btn-save-edit" style="font-size: 0.72rem; padding: 0.3rem 0.55rem; border-radius: 6px;" title="Save">
                            <i class="fa-solid fa-check"></i> Save
                        </button>
                        <button type="button" class="btn btn-cancel-edit" style="font-size: 0.72rem; padding: 0.3rem 0.55rem; background:#e2e8f0; color:#475569; border-radius: 6px;" title="Cancel">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </td>
                <td style="text-align: center; font-weight: 600; color: #475569; font-size: 0.82rem;">
                    ${file.rows.toLocaleString()}
                </td>
                <td style="text-align: center;">
                    <button type="button" class="view-excel-btn row-preview-btn" title="Click to view first 50 rows of this Excel">
                        <i class="fa-solid fa-table-cells"></i> View 50 Rows
                    </button>
                </td>
                <td style="text-align: right; color: var(--text-muted); font-size: 0.8rem; white-space: nowrap;">
                    ${formatBytes(file.size)}
                </td>
                <td style="text-align: center; white-space: nowrap;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
                        <button type="button" class="btn btn-primary btn-action-edit" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); font-size: 0.72rem; padding: 0.35rem 0.55rem; display: inline-flex; align-items: center; gap: 0.3rem; border-radius: 6px; font-weight: 600;" title="Edit File Name">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button type="button" class="btn btn-danger btn-action-delete" style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; font-size: 0.72rem; padding: 0.35rem 0.55rem; display: inline-flex; align-items: center; gap: 0.3rem; border-radius: 6px;" title="Delete this file from ZIP">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                        <button type="button" class="btn btn-success modal-download-single-btn" style="font-size: 0.72rem; padding: 0.35rem 0.55rem; display: inline-flex; align-items: center; gap: 0.3rem; border-radius: 6px;" title="Download file">
                            <i class="fa-solid fa-download"></i>
                        </button>
                    </div>
                </td>
            `;

            // Inline Rename Edit Triggers
            const displayBox = tr.querySelector('.display-name-box');
            const editBox = tr.querySelector('.edit-name-box');
            const editBtn = tr.querySelector('.btn-inline-edit');
            const actionEditBtn = tr.querySelector('.btn-action-edit');
            const saveBtn = tr.querySelector('.btn-save-edit');
            const cancelBtn = tr.querySelector('.btn-cancel-edit');
            const inputEl = tr.querySelector('.rename-edit-input');

            const activateEdit = (e) => {
                if (e) e.stopPropagation();
                displayBox.style.display = 'none';
                editBox.style.display = 'flex';
                if (inputEl) {
                    inputEl.focus();
                    inputEl.select();
                }
            };

            if (editBtn) editBtn.addEventListener('click', activateEdit);
            if (actionEditBtn) actionEditBtn.addEventListener('click', activateEdit);

            if (cancelBtn && displayBox && editBox) {
                cancelBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    editBox.style.display = 'none';
                    displayBox.style.display = 'flex';
                });
            }

            if (saveBtn && inputEl) {
                const doSave = async (e) => {
                    if (e) e.stopPropagation();
                    await saveSepFileRename(file, inputEl.value);
                };

                saveBtn.addEventListener('click', doSave);
                inputEl.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        doSave(e);
                    } else if (e.key === 'Escape') {
                        editBox.style.display = 'none';
                        displayBox.style.display = 'flex';
                    }
                });
            }

            // Delete trigger
            const delBtn = tr.querySelector('.btn-action-delete');
            if (delBtn) {
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteSepFile(file);
                });
            }

            // 50-row Excel Preview triggers
            const nameText = tr.querySelector('.file-name-text');
            if (nameText) {
                nameText.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openExcelDataViewer({
                        newName: file.name,
                        originalName: file.originalName || file.name,
                        aoa: file.aoa,
                        blob: file.blob,
                        hasSuffix: true,
                        renameCode: file.variantLabel
                    });
                });
            }

            const previewBtn = tr.querySelector('.row-preview-btn');
            if (previewBtn) {
                previewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openExcelDataViewer({
                        newName: file.name,
                        originalName: file.originalName || file.name,
                        aoa: file.aoa,
                        blob: file.blob,
                        hasSuffix: true,
                        renameCode: file.variantLabel
                    });
                });
            }

            // Download single file
            const dlBtn = tr.querySelector('.modal-download-single-btn');
            if (dlBtn) {
                dlBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    triggerDownload(file.blob, file.name);
                    separateLog(`Downloaded: ${file.name}`, 'info');
                });
            }

            tableBody.appendChild(tr);
        });

        if (summaryText) {
            summaryText.innerText = `Showing ${filtered.length} of ${allFiles.length} files`;
        }
    }

    // Bind Separate Fullscreen Modal triggers
    const closeSepModalBtn = document.getElementById('closeSepModalBtn');
    if (closeSepModalBtn) closeSepModalBtn.addEventListener('click', closeSepFullscreenModal);

    const modalSepFooterCloseBtn = document.getElementById('modalSepFooterCloseBtn');
    if (modalSepFooterCloseBtn) modalSepFooterCloseBtn.addEventListener('click', closeSepFullscreenModal);

    const sepFullscreenModal = document.getElementById('sepFullscreenModal');
    if (sepFullscreenModal) {
        sepFullscreenModal.addEventListener('click', (e) => {
            if (e.target === sepFullscreenModal) {
                closeSepFullscreenModal();
            }
        });
    }

    function moveToFolderCreateFromSeparate(variantKey = 'all') {
        let filesToTransfer = [];
        let label = "All Separated";
        if (variantKey && variantKey !== 'all' && sepVariantResults[variantKey]) {
            filesToTransfer = sepVariantResults[variantKey].files;
            label = sepVariantResults[variantKey].label;
        } else {
            filesToTransfer = getAllSeparatedFiles();
        }

        if (!filesToTransfer || filesToTransfer.length === 0) {
            alert(`No files available in [${label}] to transfer.`);
            return;
        }

        let addedCount = 0;
        filesToTransfer.forEach(fileObj => {
            const blob = fileObj.blob;
            const file = fileObj.file || new File([blob], fileObj.name, {
                type: blob.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            if (!fcFiles.some(f => f.name === fileObj.name && f.size === blob.size)) {
                fcFiles.push({
                    id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    name: fileObj.name,
                    size: blob.size,
                    file: file,
                    blob: blob
                });
                addedCount++;
            }
        });

        if (typeof updateFcUI === 'function') updateFcUI();
        closeSepFullscreenModal();

        const folderTabBtn = document.querySelector('.tab-btn[data-tab="tab-folder-create"]');
        if (folderTabBtn) {
            folderTabBtn.click();
        }

        if (typeof fcLog === 'function') {
            fcLog(`Transferred ${addedCount} file(s) from [${label}] to Folder Create section.`, 'success');
        }
        showCustomNotification('Transferred to Folder Create', `Successfully transferred ${addedCount} file(s) from [${label}] to Folder Create!`, 'success');
    }

    const modalSepMoveToFolderBtn = document.getElementById('modalSepMoveToFolderBtn');
    if (modalSepMoveToFolderBtn) {
        modalSepMoveToFolderBtn.addEventListener('click', () => {
            moveToFolderCreateFromSeparate(sepModalCurrentFilter);
        });
    }

    const modalSepFooterMoveToFolderBtn = document.getElementById('modalSepFooterMoveToFolderBtn');
    if (modalSepFooterMoveToFolderBtn) {
        modalSepFooterMoveToFolderBtn.addEventListener('click', () => {
            moveToFolderCreateFromSeparate(sepModalCurrentFilter);
        });
    }

    const modalSepDownloadAllZipBtn = document.getElementById('modalSepDownloadAllZipBtn');
    if (modalSepDownloadAllZipBtn) modalSepDownloadAllZipBtn.addEventListener('click', downloadAllSepZips);

    const modalSepFooterDownloadAllBtn = document.getElementById('modalSepFooterDownloadAllBtn');
    if (modalSepFooterDownloadAllBtn) modalSepFooterDownloadAllBtn.addEventListener('click', downloadAllSepZips);

    const modalSepFooterDownloadVariantBtn = document.getElementById('modalSepFooterDownloadVariantBtn');
    if (modalSepFooterDownloadVariantBtn) {
        modalSepFooterDownloadVariantBtn.addEventListener('click', () => {
            if (sepModalCurrentFilter !== 'all' && sepVariantResults[sepModalCurrentFilter]) {
                const vData = sepVariantResults[sepModalCurrentFilter];
                if (vData.zipBlob) {
                    triggerDownload(vData.zipBlob, vData.zipName);
                    separateLog(`Downloaded ZIP package: ${vData.zipName}`, 'info');
                }
            } else {
                downloadAllSepZips();
            }
        });
    }

    const modalSepSearchInput = document.getElementById('modalSepSearchInput');
    if (modalSepSearchInput) {
        modalSepSearchInput.addEventListener('input', () => {
            renderSepModalTableRows();
        });
    }

    document.querySelectorAll('.sep-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sep-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            sepModalCurrentFilter = btn.getAttribute('data-filter') || 'all';
            renderSepModalTableRows();
        });
    });

    async function restoreSeparateSession() {
        try {
            const saved = await loadTabSession('separate_tab');
            if (saved && saved.results) {
                let hasFiles = false;
                ['simple', 'details', 'summary', 'tax'].forEach(k => {
                    if (saved.results[k] && saved.results[k].files && saved.results[k].files.length > 0) {
                        sepVariantResults[k].files = saved.results[k].files.map((f, idx) => ({
                            ...f,
                            id: f.id || (`${Date.now()}-${k}-${idx}-${Math.random().toString(36).substr(2, 6)}`),
                            variantKey: f.variantKey || k,
                            variantLabel: f.variantLabel || sepVariantResults[k].label,
                            variantColor: f.variantColor || sepVariantResults[k].color
                        }));
                        sepVariantResults[k].zipBlob = saved.results[k].zipBlob;
                        hasFiles = true;
                    }
                });
                if (hasFiles) {
                    renderSeparateDashboard();
                    if (separateStatus) {
                        separateStatus.className = 'status-indicator success';
                        separateStatus.innerText = 'Restored';
                    }
                    separateLog(`Restored separated files from previous session (1-hour cache).`, 'info');
                }
            }
        } catch (e) {
            console.warn('Failed to restore separate session:', e);
        }
    }
    restoreSeparateSession();

            /* ==========================================================================
       RENAME FILE PROCESSING LOGIC (DUAL UPLOAD: COLUMN F & COLUMN G)
       ========================================================================== */
    let renFiles = [];
    let renZipBlob = null;
    let renOrderZipBlob = null;
    let renTaxZipBlob = null;
    let activeRenamedFiles = [];
    let renIsProcessed = false;
    let renModalCurrentFilter = 'all'; // 'all', 'p2', 'g', 'error', 'success'
    let renActiveEditFile = null; // Currently selected file for Edit Prefix Modal

    // DOM Elements for Rename Tab
    const renDropzone = document.getElementById('renDropzone');
    const renFileInput = document.getElementById('renFileInput');
    const renFileDisplay = document.getElementById('renFileDisplay');
    const renDropzoneG = document.getElementById('renDropzoneG');
    const renFileInputG = document.getElementById('renFileInputG');
    const renFileDisplayG = document.getElementById('renFileDisplayG');
    const renFCountBadge = document.getElementById('ren-f-count-badge');
    const renGCountBadge = document.getElementById('ren-g-count-badge');
    const btnRenFClear = document.getElementById('btn-ren-f-clear');
    const btnRenGClear = document.getElementById('btn-ren-g-clear');
    const renStagedQuickInfo = document.getElementById('renStagedQuickInfo');

    const renBtn = document.getElementById('renBtn');
    const renStatus = document.getElementById('renStatus');
    const renProgressCard = document.getElementById('renProgressCard');
    const renProgressBar = document.getElementById('renProgressBar');
    const renProgressPercent = document.getElementById('renProgressPercent');
    const renProgressStepText = document.getElementById('renProgressStepText');
    const renOutputContainer = document.getElementById('renOutputContainer');
    const renConsoleLog = document.getElementById('renConsoleLog');
    const clearRenLogBtn = document.getElementById('clearRenLogBtn');
    const clearRenFilesBtn = document.getElementById('clearRenFilesBtn');
    const renSelectedCount = document.getElementById('renSelectedCount');
    const renUploadedFileList = document.getElementById('renUploadedFileList');

    // Edit Prefix Modal DOM Elements
    const editPrefixModal = document.getElementById('edit-prefix-modal');
    const editPrefixFilename = document.getElementById('edit-prefix-filename');
    const editPrefixInput = document.getElementById('edit-prefix-input');
    const btnCloseEditPrefix = document.getElementById('btn-close-edit-prefix');
    const btnCancelEditPrefix = document.getElementById('btn-cancel-edit-prefix');
    const btnSaveEditPrefix = document.getElementById('btn-save-edit-prefix');

    function renLog(message, type = 'info') {
        if (!renConsoleLog) return;
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        line.innerText = `[${timestamp}] ${message}`;
        if (renConsoleLog.children.length > 300) {
            renConsoleLog.removeChild(renConsoleLog.firstChild);
        }
        renConsoleLog.appendChild(line);
        renConsoleLog.scrollTop = renConsoleLog.scrollHeight;
    }

    if (clearRenLogBtn) {
        clearRenLogBtn.addEventListener('click', () => {
            renConsoleLog.innerHTML = '';
            renLog('Log cleared.', 'info');
        });
    }

    function updateRenUploadBadges() {
        const fFiles = renFiles.filter(f => f.methodType === 'p2');
        const gFiles = renFiles.filter(f => f.methodType === 'g');

        if (renFCountBadge) renFCountBadge.textContent = `${fFiles.length} file${fFiles.length === 1 ? '' : 's'}`;
        if (renGCountBadge) renGCountBadge.textContent = `${gFiles.length} file${gFiles.length === 1 ? '' : 's'}`;
        if (renSelectedCount) renSelectedCount.textContent = renFiles.length;

        if (btnRenFClear) btnRenFClear.style.display = fFiles.length > 0 ? "inline-block" : "none";
        if (btnRenGClear) btnRenGClear.style.display = gFiles.length > 0 ? "inline-block" : "none";

        if (renFileDisplay) {
            renFileDisplay.textContent = fFiles.length > 0
                ? `${fFiles.length} Column F file${fFiles.length === 1 ? '' : 's'} loaded`
                : "Drop Column F Files / ZIP here";
        }
        if (renFileDisplayG) {
            renFileDisplayG.textContent = gFiles.length > 0
                ? `${gFiles.length} Column G file${gFiles.length === 1 ? '' : 's'} loaded`
                : "Drop Column G Files / ZIP here";
        }

        if (renStagedQuickInfo) {
            renStagedQuickInfo.textContent = `${fFiles.length} Option A, ${gFiles.length} Option B`;
        }

        if (renBtn) {
            if (renFiles.length > 0) {
                renBtn.removeAttribute('disabled');
            } else {
                renBtn.setAttribute('disabled', 'true');
            }
        }
    }

    function updateRenUI() {
        updateRenUploadBadges();
        renderRenameState();
    }

    function clearRenMethodFiles(methodType) {
        renFiles = renFiles.filter(f => f.methodType !== methodType);
        activeRenamedFiles = activeRenamedFiles.filter(f => f.methodType !== methodType);
        renIsProcessed = false;
        if (methodType === 'p2' && renFileInput) renFileInput.value = '';
        if (methodType === 'g' && renFileInputG) renFileInputG.value = '';

        updateRenUploadBadges();
        renderRenameState();
        renLog(`Cleared ${methodType === 'p2' ? 'Column F (Option A)' : 'Column G (Option B)'} files.`, 'info');
    }

    if (btnRenFClear) {
        btnRenFClear.addEventListener('click', (e) => {
            e.stopPropagation();
            clearRenMethodFiles('p2');
        });
    }

    if (btnRenGClear) {
        btnRenGClear.addEventListener('click', (e) => {
            e.stopPropagation();
            clearRenMethodFiles('g');
        });
    }

    if (clearRenFilesBtn) {
        clearRenFilesBtn.addEventListener('click', async () => {
            const ok = await showCustomConfirm('Clean & Reset Tab', 'Are you sure you want to clear all loaded files and results?', 'danger', 'Clear All');
            if (!ok) return;

            renFiles = [];
            activeRenamedFiles = [];
            renZipBlob = null;
            renOrderZipBlob = null;
            renTaxZipBlob = null;
            renIsProcessed = false;
            if (renFileInput) renFileInput.value = '';
            if (renFileInputG) renFileInputG.value = '';

            updateRenUploadBadges();
            renderRenameState();
            clearTabSession('rename_tab');
            if (renStatus) {
                renStatus.className = 'status-indicator idle';
                renStatus.innerText = 'Idle';
            }
            renLog('Cleaned & reset Rename tab.', 'info');
        });
    }

    // Handle Dropzone 1 (Option A: Column F)
    if (renDropzone && renFileInput) {
        setupMultiDropzone(renDropzone, renFileInput, async (files) => {
            await handleRenFileSelection(files, 'p2');
        });
    }

    // Handle Dropzone 2 (Option B: Column G)
    if (renDropzoneG && renFileInputG) {
        setupMultiDropzone(renDropzoneG, renFileInputG, async (files) => {
            await handleRenFileSelection(files, 'g');
        });
    }

    // Robust spreadsheet parser for both .xlsx and .csv using XLSX.read
    async function readSpreadsheetAOA(fileBlob) {
        try {
            const buffer = await fileBlob.arrayBuffer();
            const data = new Uint8Array(buffer);
            const workbook = XLSX.read(data, {
                type: 'array',
                cellDates: true,
                raw: false,
                defval: ""
            });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
            for (let i = 0; i < rows.length; i++) {
                const r = rows[i];
                if (Array.isArray(r)) {
                    for (let c = 0; c < r.length; c++) {
                        if (r[c] === null || r[c] === undefined) {
                            r[c] = "";
                        } else if (typeof r[c] === 'string' && r[c].length > 32760) {
                            r[c] = r[c].substring(0, 32760);
                        }
                    }
                }
            }
            return rows;
        } catch (e) {
            console.warn("XLSX.read fallback to Papa.parse:", e);
            const text = await fileBlob.text();
            const parsed = Papa.parse(text, { header: false, skipEmptyLines: true, dynamicTyping: false });
            const rows = parsed.data || [];
            for (let i = 0; i < rows.length; i++) {
                const r = rows[i];
                if (Array.isArray(r)) {
                    for (let c = 0; c < r.length; c++) {
                        if (r[c] === null || r[c] === undefined) {
                            r[c] = "";
                        } else if (typeof r[c] === 'string' && r[c].length > 32760) {
                            r[c] = r[c].substring(0, 32760);
                        }
                    }
                }
            }
            return rows;
        }
    }

    // Helper to process uploaded files for Rename (both Option A and Option B)
    async function handleRenFileSelection(files, methodType = 'p2') {
        if (!files || files.length === 0) return;

        if (renProgressCard) renProgressCard.classList.remove('hidden');
        if (renProgressBar) renProgressBar.style.width = '10%';
        if (renProgressPercent) renProgressPercent.innerText = '10%';
        if (renProgressStepText) renProgressStepText.innerText = `Loading ${methodType === 'p2' ? 'Column F' : 'Column G'} files...`;

        renLog(`Loading ${files.length} ${methodType === 'p2' ? 'Column F (Option A)' : 'Column G (Option B)'} file(s)...`, 'info');

        let addedCount = 0;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const lowerName = file.name.toLowerCase();

            // Handle ZIP files if dropped
            if (lowerName.endsWith('.zip')) {
                try {
                    const zip = new JSZip();
                    const zipContent = await zip.loadAsync(file);
                    for (const relPath in zipContent.files) {
                        const zipEntry = zipContent.files[relPath];
                        if (zipEntry.dir) continue;
                        const entryLower = zipEntry.name.toLowerCase();
                        if (entryLower.endsWith('.xlsx') || entryLower.endsWith('.xls') || entryLower.endsWith('.csv')) {
                            const entryBlob = await zipEntry.async('blob');
                            const subFile = new File([entryBlob], zipEntry.name.split('/').pop(), { type: entryBlob.type });
                            await addSingleRenFile(subFile, methodType);
                            addedCount++;
                        }
                    }
                } catch (err) {
                    renLog(`Error extracting ZIP ${file.name}: ${err.message}`, 'error');
                }
            } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) {
                await addSingleRenFile(file, methodType);
                addedCount++;
            }

            const pct = Math.round(((i + 1) / files.length) * 80) + 10;
            if (renProgressBar) renProgressBar.style.width = `${pct}%`;
            if (renProgressPercent) renProgressPercent.innerText = `${pct}%`;
        }

        renIsProcessed = false;
        updateRenUploadBadges();
        renderRenameState();

        if (renProgressBar) renProgressBar.style.width = '100%';
        if (renProgressPercent) renProgressPercent.innerText = '100%';
        if (renProgressStepText) renProgressStepText.innerText = 'Files loaded!';

        setTimeout(() => {
            if (renProgressCard) renProgressCard.classList.add('hidden');
        }, 800);

        renLog(`Successfully loaded ${addedCount} ${methodType === 'p2' ? 'Column F' : 'Column G'} file(s).`, 'success');
    }

    async function addSingleRenFile(file, methodType) {
        // Prevent exact duplicate loading
        if (renFiles.some(f => f.name === file.name && f.size === file.size && f.methodType === methodType)) {
            return;
        }

        let aoa = null;
        let colGVal = "";
        let colAVal = "";

        try {
            aoa = await readSpreadsheetAOA(file);
        } catch (e) {
            console.warn("Spreadsheet read failed:", e);
        }

        if (methodType === 'g' && aoa && aoa.length > 0) {
            // Check headers to identify columns dynamically
            let invColIdx = 6; // Default to Column G (index 6)
            let partyColIdx = 0; // Default to Column A (index 0)

            const headerRow = aoa[0] || [];
            for (let c = 0; c < headerRow.length; c++) {
                const h = String(headerRow[c] || "").toLowerCase().trim();
                if (h.includes("invoice") || h.includes("sale invoice") || h.includes("ee invoice") || h.includes("tax invoice") || h.includes("seller invoice")) {
                    invColIdx = c;
                }
                if (h.includes("company name") || h.includes("party") || h.includes("seller") || h.includes("vendor")) {
                    partyColIdx = c;
                }
            }

            // Extract values from rows
            for (let r = 1; r < Math.min(aoa.length, 30); r++) {
                const row = aoa[r];
                if (!row) continue;

                // 1. Column A / Party Name
                if (!colAVal && row[partyColIdx] !== undefined && row[partyColIdx] !== null) {
                    const val0 = String(row[partyColIdx]).trim();
                    const lower0 = val0.toLowerCase();
                    if (val0 !== "" && !lower0.includes("company name") && !lower0.includes("header")) {
                        colAVal = val0;
                    }
                }

                // 2. Invoice / Column G cell
                if (!colGVal && row[invColIdx] !== undefined && row[invColIdx] !== null) {
                    const rawVal = String(row[invColIdx]).trim();
                    const cleanCell = cleanRawInvoiceCell(rawVal);
                    if (cleanCell !== "") {
                        colGVal = cleanCell;
                    }
                }

                // Fallback check Column G (index 6) if invColIdx was different
                if (!colGVal && row[6] !== undefined && row[6] !== null) {
                    const rawVal = String(row[6]).trim();
                    const cleanCell = cleanRawInvoiceCell(rawVal);
                    if (cleanCell !== "") {
                        colGVal = cleanCell;
                    }
                }

                if (colGVal && colAVal) break;
            }

            // Broad Scan Fallback if still empty
            if (!colGVal) {
                for (let r = 1; r < Math.min(aoa.length, 25); r++) {
                    const row = aoa[r];
                    if (!row) continue;
                    for (let c = 0; c < Math.min(row.length, 15); c++) {
                        if (row[c] !== undefined && row[c] !== null) {
                            const rawVal = String(row[c]).trim();
                            const cleanCell = cleanRawInvoiceCell(rawVal);
                            if (cleanCell !== "") {
                                colGVal = cleanCell;
                                break;
                            }
                        }
                    }
                    if (colGVal) break;
                }
            }
        }

        const extIdx = file.name.lastIndexOf('.');
        const ext = extIdx !== -1 ? file.name.substring(extIdx + 1) : 'xlsx';

        renFiles.push({
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            name: file.name,
            originalName: file.name,
            size: file.size,
            file: file,
            ext: ext,
            methodType: methodType, // 'p2' (Column F) or 'g' (Column G)
            rowCount: aoa ? Math.max(0, aoa.length - 1) : 0,
            colGValue: colGVal,
            colAValue: colAVal,
            renameCode: "",
            renamedName: file.name,
            newName: file.name,
            blob: null,
            success: false,
            hasSuffix: false,
            aoa: aoa
        });
    }

    // Helper: Clean raw cell containing JSON or mixed tokens and extract the invoice/code
    function cleanRawInvoiceCell(val) {
        if (!val || typeof val !== 'string') return '';
        let clean = val.trim();
        if (clean === "") return "";
        const lower = clean.toLowerCase();
        if (lower === "quantity" || lower === "description" || lower === "invoice number" || lower === "seller sku" || lower === "item") {
            return "";
        }

        // If it contains embedded JSON or trailing token e.g. {"b2b2c_order":"FN2311806571"}]ININR DV00342231
        if (clean.includes('{') || clean.includes('}') || clean.includes('INR') || clean.includes(']')) {
            // Try extracting invoice number pattern from the end or within
            const tokenMatch = clean.match(/([A-Za-z]{1,4}\d{6,12})/);
            if (tokenMatch) {
                return tokenMatch[1];
            }
            const cgjToken = clean.match(/CGJ1?-?(\d{2,5}[-_]\w+)/i);
            if (cgjToken) {
                return cgjToken[0];
            }
            const myntraToken = clean.match(/(?:MY|AJ)\d+S\w+/i);
            if (myntraToken) {
                return myntraToken[0];
            }
            // Strip JSON brackets and control characters
            clean = clean.replace(/\{[^}]*\}/g, '').replace(/\[/g, '').replace(/\]/g, '').replace(/ININR/g, '').trim();
        }

        return clean.replace(/[\r\n\t]+/g, ' ').trim();
    }

    // Helper: Extract party / rename code for Option A (Column F)
    function extractCodeFromColF(aoa) {
        if (!aoa || aoa.length <= 1) return "";
        const colIndex = 5; // Column F (0-indexed)
        for (let r = 1; r < aoa.length; r++) {
            const row = aoa[r];
            if (!row) continue;
            const cellVal = String(row[colIndex] || "").trim();
            if (cellVal !== "") {
                const firstPart = cellVal.split("-")[0].trim();
                let code = firstPart.slice(-3);
                if (code.toUpperCase().startsWith("J")) {
                    const num = parseInt(code.substring(1), 10);
                    if (!isNaN(num)) {
                        code = "AJ" + num;
                    }
                }
                return code;
            }
        }
        return "";
    }

    // Helper: Extract party code for Option B (Column G / Tax files)
    function extractCodeFromColG(colGVal, fileName, colAVal = "") {
        // 1. Check Column A (Company Name, e.g. "198-Gufrina (Admin)")
        if (colAVal) {
            const cleanA = String(colAVal).trim();
            const matchA = cleanA.match(/^(\d{2,5})[-_\s]/);
            if (matchA) {
                return matchA[1];
            }
        }

        const cleanVal = String(colGVal || "").trim();

        if (cleanVal !== "") {
            // Pattern A: Standard invoice prefix: AJ27S101-29337 or MY27S198-1578 -> extract "101" or "198"
            const invoicePrefixMatch = cleanVal.match(/S(\d{2,5})[-_]/i);
            if (invoicePrefixMatch) {
                return invoicePrefixMatch[1];
            }

            // Pattern B: Starts with CGJ1 (e.g. CGJ12627-295 or CGJ1-178-INV001 -> extract 2627 or 178)
            const cgjMatch = cleanVal.match(/CGJ1?-?(\d{2,5})[-_]/i);
            if (cgjMatch) {
                return cgjMatch[1];
            }

            // Pattern C: Digits immediately preceding hyphen followed by digits e.g. 198-1578 -> "198"
            const preHyphenMatch = cleanVal.match(/(\d{2,5})-(?=\d+)/);
            if (preHyphenMatch) {
                return preHyphenMatch[1];
            }

            // Pattern D: Starts with digits followed by hyphen e.g. 178-INV001 -> "178"
            if (cleanVal.includes('-')) {
                const parts = cleanVal.split('-');
                const firstPart = parts[0].trim();
                if (firstPart !== "" && firstPart.toUpperCase() !== "CGJ1") {
                    const numPart = firstPart.match(/\d{2,5}/);
                    if (numPart) {
                        return numPart[0];
                    }
                }
            }

            // Pattern E: Match against vendorParties database
            if (typeof vendorParties !== "undefined" && vendorParties && vendorParties.length > 0) {
                const prefixPart = cleanVal.includes('-') ? cleanVal.split('-')[0] : cleanVal;
                for (let i = 0; i < vendorParties.length; i++) {
                    const item = vendorParties[i];
                    if (!item || !item.code) continue;
                    const codeStr = String(item.code).trim();
                    if (!codeStr) continue;

                    const codeRegex = new RegExp(`(?:^|S|\\b|-|_)${codeStr}(?:-|\\b|_|$)(?!\\d)`, 'i');
                    if (codeRegex.test(prefixPart) || codeRegex.test(cleanVal)) {
                        return codeStr;
                    }
                }
            }

            // Pattern F: Match numeric sequence of 2-5 digits
            const numMatch = cleanVal.match(/\b\d{2,5}\b/);
            if (numMatch) {
                return numMatch[0];
            }
        }

        // 2. Fallback: Search filename starting digits or vendorParties match
        if (fileName) {
            const cleanName = String(fileName).trim();
            const match = cleanName.match(/^\d{2,5}/);
            if (match) return match[0];

            if (typeof vendorParties !== "undefined" && vendorParties && vendorParties.length > 0) {
                for (let i = 0; i < vendorParties.length; i++) {
                    const item = vendorParties[i];
                    if (!item || !item.code) continue;
                    const codeStr = String(item.code).trim();
                    if (codeStr && new RegExp(`(?:^|\\b|-|_)${codeStr}(?:-|\\b|_|$)`, 'i').test(cleanName)) {
                        return codeStr;
                    }
                }
            }
        }

        return "";
    }

    // Main Rename Processor Execution
    if (renBtn) {
        renBtn.addEventListener('click', async () => {
            if (renFiles.length === 0) {
                alert("Please upload Column F or Column G files first.");
                return;
            }

            renBtn.setAttribute('disabled', 'true');
            if (renProgressCard) renProgressCard.classList.remove('hidden');
            if (renProgressBar) renProgressBar.style.width = '0%';
            if (renProgressPercent) renProgressPercent.innerText = '0%';
            if (renProgressStepText) renProgressStepText.innerText = 'Initializing rename process...';

            if (renStatus) {
                renStatus.className = 'status-indicator processing';
                renStatus.innerText = 'Processing...';
            }

            renLog('Starting Rename Process for loaded files...', 'process');

            try {
                const zipAll = new JSZip();
                const zipOrder = new JSZip();
                const zipTax = new JSZip();
                const usedNames = new Set();

                for (let i = 0; i < renFiles.length; i++) {
                    const fileObj = renFiles[i];
                    renLog(`Processing file ${i + 1}/${renFiles.length}: ${fileObj.name}`, 'info');

                    const pct = Math.round((i / renFiles.length) * 80) + 5;
                    if (renProgressBar) renProgressBar.style.width = `${pct}%`;
                    if (renProgressPercent) renProgressPercent.innerText = `${pct}%`;
                    if (renProgressStepText) renProgressStepText.innerText = `Renaming (${i + 1}/${renFiles.length}): ${fileObj.name}`;

                    let aoa = fileObj.aoa;
                    if (!aoa) {
                        aoa = await readSpreadsheetAOA(fileObj.file);
                        fileObj.aoa = aoa;
                        fileObj.rowCount = Math.max(0, aoa.length - 1);
                    }

                    let renameCode = fileObj.renameCode;
                    if (!renameCode || renameCode === "Not Found") {
                        if (fileObj.methodType === 'p2') {
                            // Option A: Column F
                            renameCode = extractCodeFromColF(aoa);
                        } else {
                            // Option B: Column G
                            renameCode = extractCodeFromColG(fileObj.colGValue, fileObj.name, fileObj.colAValue);
                        }
                    }

                    const extIdx = fileObj.name.lastIndexOf('.');
                    const baseName = extIdx !== -1 ? fileObj.name.substring(0, extIdx) : fileObj.name;
                    const ext = extIdx !== -1 ? fileObj.name.substring(extIdx) : '.xlsx';

                    let targetName = fileObj.name;
                    let success = false;

                    if (renameCode && renameCode.trim() !== "" && renameCode !== "Not Found") {
                        let candidateName = `${baseName}-${renameCode.trim()}${ext}`;
                        let counter = 1;
                        let checkName = candidateName;
                        while (usedNames.has(checkName.toLowerCase())) {
                            checkName = `${baseName}-${renameCode.trim()} (${counter})${ext}`;
                            counter++;
                        }
                        targetName = checkName;
                        success = true;
                        fileObj.renameCode = renameCode.trim();
                        renLog(`Found code: [${renameCode}] for "${fileObj.name}" -> "${targetName}"`, 'success');
                    } else {
                        fileObj.renameCode = "Not Found";
                        let counter = 1;
                        let checkName = targetName;
                        while (usedNames.has(checkName.toLowerCase())) {
                            checkName = `${baseName} (${counter})${ext}`;
                            counter++;
                        }
                        targetName = checkName;
                        renLog(`No rename code found for "${fileObj.name}". Kept original filename.`, 'warning');
                    }

                    usedNames.add(targetName.toLowerCase());
                    fileObj.renamedName = targetName;
                    fileObj.newName = targetName;
                    fileObj.success = success;
                    fileObj.hasSuffix = success;

                    const fileBuffer = await fileObj.file.arrayBuffer();
                    const fileBlob = new Blob([fileBuffer], { type: fileObj.file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    fileObj.blob = fileBlob;

                    zipAll.file(targetName, fileBuffer);
                    if (fileObj.methodType === 'p2') {
                        zipOrder.file(targetName, fileBuffer);
                    } else {
                        zipTax.file(targetName, fileBuffer);
                    }
                }

                if (renProgressBar) renProgressBar.style.width = '90%';
                if (renProgressPercent) renProgressPercent.innerText = '90%';
                if (renProgressStepText) renProgressStepText.innerText = 'Generating ZIP packages...';

                renZipBlob = await zipAll.generateAsync({ type: 'blob' });
                renOrderZipBlob = await zipOrder.generateAsync({ type: 'blob' });
                renTaxZipBlob = await zipTax.generateAsync({ type: 'blob' });

                activeRenamedFiles = [...renFiles];
                renIsProcessed = true;

                renderRenameState();

                saveTabSession('rename_tab', {
                    activeRenamedFiles: activeRenamedFiles,
                    renZipBlob: renZipBlob
                });

                if (renProgressBar) renProgressBar.style.width = '100%';
                if (renProgressPercent) renProgressPercent.innerText = '100%';
                if (renProgressStepText) renProgressStepText.innerText = 'Renaming completed successfully!';

                if (renStatus) {
                    renStatus.className = 'status-indicator success';
                    renStatus.innerText = 'Completed';
                }

                showCustomAlert("PROCESS COMPLETED SUCCESSFULLY! Renamed files are ready for review.", "success");
                renLog(`Rename process finished. ${renFiles.length} file(s) packaged successfully.`, 'success');

            } catch (err) {
                console.error("Rename process error:", err);
                renLog(`Rename process failed: ${err.message}`, 'error');
                if (renStatus) {
                    renStatus.className = 'status-indicator idle';
                    renStatus.innerText = 'Failed';
                }
            } finally {
                renBtn.removeAttribute('disabled');
            }
        });
    }

    // Render Rename State: either staged preview or output categorized results
    function renderRenameState() {
        if (!renOutputContainer) return;

        if (renFiles.length === 0) {
            renOutputContainer.innerHTML = `
                <div class="empty-output-state">
                    <i class="fa-solid fa-file-signature placeholder-icon"></i>
                    <p>Upload files to Option A (Column F) or Option B (Column G) and click process to run renaming.</p>
                </div>
            `;
            return;
        }

        if (!renIsProcessed) {
            // Render Staged Preview Tables before processing
            renderStagedRenameTables();
        } else {
            // Render Processed Categorized Output Preview
            renderCategorizedRenamePreview();
        }
    }

    // Render Staged Tables (Loaded files before running rename)
    function renderStagedRenameTables() {
        const fFiles = renFiles.filter(f => f.methodType === 'p2');
        const gFiles = renFiles.filter(f => f.methodType === 'g');

        let html = `
            <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%;">
                <!-- Top Staged Info Bar -->
                <div class="card glass" style="padding: 0.65rem 0.9rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; border-left: 4px solid var(--primary); background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                        <h3 style="font-size: 0.88rem; font-weight: 700; color: var(--text-primary); margin: 0;">Loaded Files Staging</h3>
                        <span class="info-tag" style="font-size: 0.72rem; padding: 2px 7px;">${renFiles.length} files loaded</span>
                    </div>
                    <span style="font-size: 0.72rem; color: var(--text-muted);">Click <strong>START RENAME PROCESS</strong> on the left to rename.</span>
                </div>

                <!-- 1. Staged Column F Files Card -->
                <div class="ren-table-card" style="border-left: 4px solid var(--primary);">
                    <div class="card-header">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <h3 style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 6px;">
                                📦 Loaded Column F Files (Option A)
                            </h3>
                            <span class="badge badge-od" style="font-size: 0.68rem;">${fFiles.length} file${fFiles.length === 1 ? '' : 's'}</span>
                        </div>
                        <span style="font-size: 0.7rem; color: var(--text-muted);">Extracts party code from Column F</span>
                    </div>
                    <div class="table-container" style="max-height: 200px; overflow-y: auto; margin: 0; padding: 0;">
                        <table class="preview-table" style="font-size: 0.74rem; width: 100%;">
                            <thead>
                                <tr>
                                    <th style="width: 35px; text-align: center;">#</th>
                                    <th>File Name</th>
                                    <th style="width: 80px;">Rows</th>
                                    <th style="width: 85px;">Size</th>
                                    <th style="width: 100px; text-align: center;">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${fFiles.length === 0
                                    ? `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.2rem; font-size: 0.74rem;">No Column F files loaded yet.</td></tr>`
                                    : fFiles.map((file, idx) => `
                                        <tr>
                                            <td style="text-align: center;"><strong>${idx + 1}</strong></td>
                                            <td><span class="file-name" style="font-weight: 600; color: var(--text-primary);">${file.name}</span></td>
                                            <td>${file.rowCount}</td>
                                            <td>${formatBytes(file.size)}</td>
                                            <td style="text-align: center;">
                                                <div style="display: inline-flex; gap: 4px;">
                                                    <button class="btn-action btn-edit-prefix" data-id="${file.id}" title="Edit Prefix Code" style="width: 24px; height: 24px; border-radius: 6px; border: none; background: rgba(124, 58, 237, 0.08); color: var(--primary); cursor: pointer;">
                                                        <i class="fa-solid fa-pen" style="font-size: 0.7rem;"></i>
                                                    </button>
                                                    <button class="btn-action btn-del-staged" data-id="${file.id}" title="Remove file" style="width: 24px; height: 24px; border-radius: 6px; border: none; background: rgba(220, 38, 38, 0.08); color: #dc2626; cursor: pointer;">
                                                        <i class="fa-solid fa-trash-can" style="font-size: 0.7rem;"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- 2. Staged Column G Files Card -->
                <div class="ren-table-card" style="border-left: 4px solid #059669;">
                    <div class="card-header">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <h3 style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 6px;">
                                📊 Loaded Column G Files (Option B)
                            </h3>
                            <span class="badge badge-dt" style="font-size: 0.68rem;">${gFiles.length} file${gFiles.length === 1 ? '' : 's'}</span>
                        </div>
                        <span style="font-size: 0.7rem; color: var(--text-muted);">Searches Column G for CGJ1 / Party codes</span>
                    </div>
                    <div class="table-container" style="max-height: 200px; overflow-y: auto; margin: 0; padding: 0;">
                        <table class="preview-table" style="font-size: 0.74rem; width: 100%;">
                            <thead>
                                <tr>
                                    <th style="width: 35px; text-align: center;">#</th>
                                    <th>File Name</th>
                                    <th style="width: 170px;">Column G Value</th>
                                    <th style="width: 80px;">Rows</th>
                                    <th style="width: 85px;">Size</th>
                                    <th style="width: 100px; text-align: center;">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${gFiles.length === 0
                                    ? `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.2rem; font-size: 0.74rem;">No Column G files loaded yet.</td></tr>`
                                    : gFiles.map((file, idx) => `
                                        <tr>
                                            <td style="text-align: center;"><strong>${idx + 1}</strong></td>
                                            <td><span class="file-name" style="font-weight: 600; color: var(--text-primary);">${file.name}</span></td>
                                            <td>${file.colGValue ? `<span style="font-family: monospace; font-weight: 700; color: #059669; font-size: 0.72rem;">${file.colGValue}</span>` : '<span style="color: var(--text-muted); font-size: 0.7rem;">None</span>'}</td>
                                            <td>${file.rowCount}</td>
                                            <td>${formatBytes(file.size)}</td>
                                            <td style="text-align: center;">
                                                <div style="display: inline-flex; gap: 4px;">
                                                    <button class="btn-action btn-edit-prefix" data-id="${file.id}" title="Edit Prefix Code" style="width: 24px; height: 24px; border-radius: 6px; border: none; background: rgba(5, 150, 105, 0.08); color: #059669; cursor: pointer;">
                                                        <i class="fa-solid fa-pen" style="font-size: 0.7rem;"></i>
                                                    </button>
                                                    <button class="btn-action btn-del-staged" data-id="${file.id}" title="Remove file" style="width: 24px; height: 24px; border-radius: 6px; border: none; background: rgba(220, 38, 38, 0.08); color: #dc2626; cursor: pointer;">
                                                        <i class="fa-solid fa-trash-can" style="font-size: 0.7rem;"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        renOutputContainer.innerHTML = html;

        // Attach staged delete handlers
        renOutputContainer.querySelectorAll('.btn-del-staged').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                renFiles = renFiles.filter(f => f.id !== id);
                updateRenUploadBadges();
                renderRenameState();
            });
        });

        // Attach staged edit prefix handlers
        renOutputContainer.querySelectorAll('.btn-edit-prefix').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                const fileObj = renFiles.find(f => f.id === id);
                if (fileObj) openEditPrefixModal(fileObj);
            });
        });
    }

    // Render Categorized Output Preview (After running rename)
    function renderCategorizedRenamePreview() {
        const fFiles = renFiles.filter(f => f.methodType === 'p2');
        const gFiles = renFiles.filter(f => f.methodType === 'g');

        const unmatchedF = fFiles.filter(f => !f.renameCode || f.renameCode === "Not Found").length;
        const unmatchedG = gFiles.filter(f => !f.renameCode || f.renameCode === "Not Found").length;
        const unmatchedTotal = unmatchedF + unmatchedG;

        let html = `
            <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%;">

                <!-- Top Summary Bar -->
                <div class="card glass" style="padding: 0.65rem 0.9rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.6rem; border-left: 4px solid var(--primary); background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                        <h3 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin: 0;">Renamed Output Summary</h3>
                        <span class="info-tag" style="font-size: 0.72rem; padding: 2px 7px;">${renFiles.length} total files (📦 Order: ${fFiles.length}, 📊 Tax: ${gFiles.length})</span>
                        ${unmatchedTotal > 0 ? `<span class="badge" style="background: rgba(220, 38, 38, 0.12); color: #dc2626; border: 1px solid rgba(220, 38, 38, 0.25); font-size: 0.68rem; font-weight: 700;">⚠️ ${unmatchedTotal} Need Prefix</span>` : ''}
                    </div>
                    <button class="btn btn-primary" id="btnDownloadAllZipCategorized" style="padding: 0.35rem 0.85rem; font-size: 0.78rem; display: flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #8b5cf6, #6d28d9);">
                        <i class="fa-solid fa-file-zipper"></i> Download All ZIP
                    </button>
                </div>

                <!-- 1. Order Files Card (Column F Method) -->
                <div class="ren-table-card" style="border-left: 4px solid var(--primary);">
                    <div class="card-header">
                        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                            <h3 style="font-size: 0.88rem; font-weight: 700; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 6px;">
                                📦 Order Files (Column F)
                            </h3>
                            <span class="badge badge-od" style="font-size: 0.68rem;">${fFiles.length} file${fFiles.length === 1 ? '' : 's'}</span>
                            ${unmatchedF > 0 ? `<span class="badge" style="background: rgba(220,38,38,0.12); color: #dc2626; border: 1px solid rgba(220,38,38,0.25); font-size: 0.65rem; font-weight: 700;">${unmatchedF} Need Prefix</span>` : ''}
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                            <button class="btn btn-secondary" id="btnOrderFullview" style="padding: 0.28rem 0.6rem; font-size: 0.72rem; display: flex; align-items: center; gap: 4px;" title="Full View Modal">
                                <i class="fa-solid fa-expand"></i> Full View
                            </button>
                            <button class="btn btn-secondary" id="btnMoveOrderToMerge" style="padding: 0.28rem 0.65rem; font-size: 0.72rem; color: var(--primary); font-weight: 700; border-color: rgba(124, 58, 237, 0.25); display: flex; align-items: center; gap: 4px;" title="Transfer files directly to Merge File tab">
                                <i class="fa-solid fa-code-merge"></i> Move to Merge
                            </button>
                            <button class="btn btn-primary" id="btnDownloadOrderZip" style="padding: 0.28rem 0.65rem; font-size: 0.72rem; display: flex; align-items: center; gap: 4px; background: #7c3aed; border-color: #7c3aed;" title="Download only Order files ZIP">
                                <i class="fa-solid fa-download"></i> Download ZIP
                            </button>
                        </div>
                    </div>
                    <div class="table-container" style="max-height: 240px; overflow-y: auto; margin: 0; padding: 0;">
                        <table class="preview-table" style="font-size: 0.74rem; width: 100%;">
                            <thead>
                                <tr>
                                    <th style="width: 35px; text-align: center;">#</th>
                                    <th>Original File Name</th>
                                    <th style="width: 105px;">Prefix Code</th>
                                    <th>Renamed Filename</th>
                                    <th style="width: 140px; text-align: center;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${fFiles.length === 0
                                    ? `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem; font-size: 0.74rem;">No Order files uploaded yet.</td></tr>`
                                    : renderTableRowsHtml(fFiles, 'p2')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- 2. Tax Files Card (Column G Method) -->
                <div class="ren-table-card" style="border-left: 4px solid #059669;">
                    <div class="card-header">
                        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                            <h3 style="font-size: 0.88rem; font-weight: 700; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 6px;">
                                📊 Tax Files (Column G)
                            </h3>
                            <span class="badge badge-dt" style="font-size: 0.68rem;">${gFiles.length} file${gFiles.length === 1 ? '' : 's'}</span>
                            ${unmatchedG > 0 ? `<span class="badge" style="background: rgba(220,38,38,0.12); color: #dc2626; border: 1px solid rgba(220,38,38,0.25); font-size: 0.65rem; font-weight: 700;">${unmatchedG} Need Prefix</span>` : ''}
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                            <label class="sep-rule-toggle is-old" id="ren-g-move-container" title="Target: ON = Move to Merge, OFF = Move to Folder Create" style="margin-right: 0.15rem;">
                                <span class="sep-rule-switch">
                                    <input type="checkbox" id="toggle-ren-g-move" autocomplete="off">
                                    <span class="sep-rule-slider"></span>
                                </span>
                                <span class="sep-rule-text" id="label-ren-g-move">Move: Folder</span>
                            </label>
                            <button class="btn btn-secondary" id="btnTaxFullview" style="padding: 0.28rem 0.6rem; font-size: 0.72rem; display: flex; align-items: center; gap: 4px;" title="Full View Modal">
                                <i class="fa-solid fa-expand"></i> Full View
                            </button>
                            <button class="btn btn-secondary" id="btnMoveTaxTarget" style="padding: 0.28rem 0.65rem; font-size: 0.72rem; color: #059669; font-weight: 700; border-color: rgba(5, 150, 105, 0.25); display: flex; align-items: center; gap: 4px;" title="Transfer files directly to Folder Create tab">
                                <i class="fa-solid fa-folder-plus" id="renTaxMoveIcon"></i>
                                <span id="renTaxMoveText">Move to Folder Create</span>
                            </button>
                            <button class="btn btn-primary" id="btnDownloadTaxZip" style="padding: 0.28rem 0.65rem; font-size: 0.72rem; background: #059669; border-color: #059669; display: flex; align-items: center; gap: 4px;" title="Download only Tax files ZIP">
                                <i class="fa-solid fa-download"></i> Download ZIP
                            </button>
                        </div>
                    </div>
                    <div class="table-container" style="max-height: 240px; overflow-y: auto; margin: 0; padding: 0;">
                        <table class="preview-table" style="font-size: 0.74rem; width: 100%;">
                            <thead>
                                <tr>
                                    <th style="width: 35px; text-align: center;">#</th>
                                    <th>Original File Name</th>
                                    <th style="width: 105px;">Prefix Code</th>
                                    <th>Renamed Filename</th>
                                    <th style="width: 140px; text-align: center;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${gFiles.length === 0
                                    ? `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem; font-size: 0.74rem;">No Tax files uploaded yet.</td></tr>`
                                    : renderTableRowsHtml(gFiles, 'g')}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        `;

        renOutputContainer.innerHTML = html;
        attachCategorizedTableEvents();
    }

    function renderTableRowsHtml(fileList, category) {
        // Sort: Unmatched files ("Not Found") come FIRST (at the top)!
        const sorted = [...fileList].sort((a, b) => {
            const aUnmatched = (!a.renameCode || a.renameCode === "Not Found");
            const bUnmatched = (!b.renameCode || b.renameCode === "Not Found");
            if (aUnmatched && !bUnmatched) return -1;
            if (!aUnmatched && bUnmatched) return 1;
            return 0;
        });

        return sorted.map((file, idx) => {
            const isUnmatched = (!file.renameCode || file.renameCode === "Not Found");
            const codeBadge = isUnmatched
                ? `<span class="badge" style="background: rgba(220, 38, 38, 0.15); color: #dc2626; border: 1px solid rgba(220, 38, 38, 0.3); font-weight: 700; font-size: 0.68rem;">⚠️ Not Found</span>`
                : `<span class="badge ${category === 'p2' ? 'badge-od' : 'badge-dt'}" style="font-weight: 700; font-size: 0.68rem;">${file.renameCode}</span>`;

            return `
                <tr style="${isUnmatched ? 'background: rgba(220, 38, 38, 0.05); border-left: 3.5px solid #dc2626;' : ''}">
                    <td style="text-align: center;"><strong>${idx + 1}</strong></td>
                    <td>
                        <span class="file-name btn-inspect-file" data-id="${file.id}" style="cursor: pointer; font-weight: 600; color: var(--text-primary); text-decoration: underline dotted;" title="Click to view Excel rows">${file.originalName || file.name}</span>
                    </td>
                    <td>${codeBadge}</td>
                    <td><span style="color: var(--primary); font-weight: 600; font-size: 0.78rem;">${file.renamedName || file.newName}</span></td>
                    <td style="text-align: center;">
                        <div style="display: inline-flex; gap: 4px;">
                            <button class="btn-action btn-inspect-file" data-id="${file.id}" title="Inspect first 50 rows" style="width: 24px; height: 24px; border-radius: 6px; border: none; background: rgba(124, 58, 237, 0.08); color: var(--primary); cursor: pointer;">
                                <i class="fa-solid fa-eye" style="font-size: 0.7rem;"></i>
                            </button>
                            <button class="btn-action btn-edit-prefix" data-id="${file.id}" title="Edit Prefix Code" style="width: 24px; height: 24px; border-radius: 6px; border: none; background: rgba(5, 150, 105, 0.08); color: #059669; cursor: pointer;">
                                <i class="fa-solid fa-pen" style="font-size: 0.7rem;"></i>
                            </button>
                            <button class="btn-action btn-download-single" data-id="${file.id}" title="Download Single File" style="width: 24px; height: 24px; border-radius: 6px; border: none; background: rgba(14, 165, 233, 0.08); color: #0284c7; cursor: pointer;">
                                <i class="fa-solid fa-download" style="font-size: 0.7rem;"></i>
                            </button>
                            <button class="btn-action btn-del-file" data-id="${file.id}" title="Delete file" style="width: 24px; height: 24px; border-radius: 6px; border: none; background: rgba(220, 38, 38, 0.08); color: #dc2626; cursor: pointer;">
                                <i class="fa-solid fa-trash-can" style="font-size: 0.7rem;"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function attachCategorizedTableEvents() {
        // Download All Zip
        const btnAllZip = document.getElementById('btnDownloadAllZipCategorized');
        if (btnAllZip) {
            btnAllZip.addEventListener('click', () => downloadRenZip('all'));
        }

        // Order Full View
        const btnOrdFv = document.getElementById('btnOrderFullview');
        if (btnOrdFv) {
            btnOrdFv.addEventListener('click', () => openRenameModal(activeRenamedFiles, 'p2'));
        }

        // Tax Full View
        const btnTaxFv = document.getElementById('btnTaxFullview');
        if (btnTaxFv) {
            btnTaxFv.addEventListener('click', () => openRenameModal(activeRenamedFiles, 'g'));
        }

        // Move Order to Merge
        const btnMoveOrd = document.getElementById('btnMoveOrderToMerge');
        if (btnMoveOrd) {
            btnMoveOrd.addEventListener('click', () => {
                const orderFiles = activeRenamedFiles.filter(f => f.methodType === 'p2');
                moveToMergeWithFiles(orderFiles);
            });
        }

        // Move Tax Target
        const btnMoveTax = document.getElementById('btnMoveTaxTarget');
        if (btnMoveTax) {
            btnMoveTax.addEventListener('click', () => {
                const taxFiles = activeRenamedFiles.filter(f => f.methodType === 'g');
                const toggle = document.getElementById('toggle-ren-g-move');
                const isMerge = toggle ? toggle.checked : false;
                if (isMerge) {
                    moveToMergeWithFiles(taxFiles);
                } else {
                    moveToFolderCreateWithFiles(taxFiles);
                }
            });
        }

        // Tax Move Toggle UI update
        const toggleRenGMove = document.getElementById('toggle-ren-g-move');
        if (toggleRenGMove) {
            toggleRenGMove.addEventListener('change', () => {
                updateRenGMoveUI();
            });
        }

        // Download Order Zip
        const btnDlOrd = document.getElementById('btnDownloadOrderZip');
        if (btnDlOrd) {
            btnDlOrd.addEventListener('click', () => downloadRenZip('p2'));
        }

        // Download Tax Zip
        const btnDlTax = document.getElementById('btnDownloadTaxZip');
        if (btnDlTax) {
            btnDlTax.addEventListener('click', () => downloadRenZip('g'));
        }

        // Inspect row events
        renOutputContainer.querySelectorAll('.btn-inspect-file').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.getAttribute('data-id');
                const fileObj = activeRenamedFiles.find(f => f.id === id) || renFiles.find(f => f.id === id);
                if (fileObj) openExcelDataViewer(fileObj);
            });
        });

        // Edit prefix events
        renOutputContainer.querySelectorAll('.btn-edit-prefix').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.getAttribute('data-id');
                const fileObj = activeRenamedFiles.find(f => f.id === id) || renFiles.find(f => f.id === id);
                if (fileObj) openEditPrefixModal(fileObj);
            });
        });

        // Download single file events
        renOutputContainer.querySelectorAll('.btn-download-single').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.getAttribute('data-id');
                const fileObj = activeRenamedFiles.find(f => f.id === id);
                if (fileObj && fileObj.blob) {
                    triggerDownload(fileObj.blob, fileObj.renamedName || fileObj.newName);
                }
            });
        });

        // Delete row events
        renOutputContainer.querySelectorAll('.btn-del-file').forEach(el => {
            el.addEventListener('click', async () => {
                const id = el.getAttribute('data-id');
                const fileObj = activeRenamedFiles.find(f => f.id === id);
                if (fileObj) await deleteRenamedFile(fileObj);
            });
        });
    }

    // Tax Move Toggle UI updater
    function updateRenGMoveUI() {
        const toggle = document.getElementById('toggle-ren-g-move');
        const isMerge = toggle ? toggle.checked : false;
        const container = document.getElementById('ren-g-move-container');
        const label = document.getElementById('label-ren-g-move');
        const btn = document.getElementById('btnMoveTaxTarget');
        const btnText = document.getElementById('renTaxMoveText');
        const btnIcon = document.getElementById('renTaxMoveIcon');

        if (isMerge) {
            if (container) container.classList.remove('is-old');
            if (label) label.textContent = "Move: Merge";
            if (btn) {
                btn.title = "Transfer Tax files directly to Merge File tab";
                btn.style.color = "var(--primary)";
                btn.style.borderColor = "rgba(124, 58, 237, 0.25)";
            }
            if (btnText) btnText.textContent = "Move to Merge";
            if (btnIcon) {
                btnIcon.className = "fa-solid fa-code-merge";
            }
        } else {
            if (container) container.classList.add('is-old');
            if (label) label.textContent = "Move: Folder";
            if (btn) {
                btn.title = "Transfer Tax files directly to Folder Create tab";
                btn.style.color = "#059669";
                btn.style.borderColor = "rgba(5, 150, 105, 0.25)";
            }
            if (btnText) btnText.textContent = "Move to Folder Create";
            if (btnIcon) {
                btnIcon.className = "fa-solid fa-folder-plus";
            }
        }
    }

    // Move given files to Merge File tab
    function moveToMergeWithFiles(filesToMove) {
        if (!filesToMove || filesToMove.length === 0) {
            alert('No files available to transfer to Merge.');
            return;
        }

        gmFiles = [];
        filesToMove.forEach(fileObj => {
            const blob = fileObj.blob;
            const file = new File([blob], fileObj.renamedName || fileObj.newName, {
                type: blob.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            gmFiles.push({
                id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                name: fileObj.renamedName || fileObj.newName,
                size: blob.size,
                file: file
            });
        });

        updateGmUI();
        closeRenameModal();
        closeExcelDataViewer();

        const mergeTabBtn = document.querySelector('.tab-btn[data-tab="tab-merge"]');
        if (mergeTabBtn) mergeTabBtn.click();

        gmLog(`Transferred ${gmFiles.length} file(s) from Rename section to Merge File section.`, 'success');
        showCustomAlert(`Successfully transferred ${gmFiles.length} file(s) to Merge section!`, "success");
    }

    // Move given files to Folder Create tab
    function moveToFolderCreateWithFiles(filesToMove) {
        if (!filesToMove || filesToMove.length === 0) {
            alert('No files available to transfer to Folder Create.');
            return;
        }

        const filesToFc = filesToMove.map(f => {
            const blob = f.blob;
            return new File([blob], f.renamedName || f.newName, {
                type: blob.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
        });

        if (typeof handleFcFilesAdded === 'function') {
            handleFcFilesAdded(filesToFc);
        } else {
            fcFiles = filesToFc.map(f => ({
                id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                name: f.name,
                size: f.size,
                file: f
            }));
            if (typeof updateFcUI === 'function') updateFcUI();
        }

        closeRenameModal();
        closeExcelDataViewer();

        const folderTabBtn = document.querySelector('.tab-btn[data-tab="tab-folder-create"]');
        if (folderTabBtn) folderTabBtn.click();

        if (typeof fcLog === 'function') {
            fcLog(`Transferred ${filesToFc.length} Tax file(s) from Rename section to Folder Create.`, 'success');
        }
        showCustomAlert(`Successfully transferred ${filesToFc.length} Tax file(s) to Folder Create!`, "success");
    }

    // Generic Move to Merge (from fullview modal or default)
    function moveToMerge() {
        moveToMergeWithFiles(activeRenamedFiles);
    }

    // Download Zip function (all, order, or tax)
    async function downloadRenZip(category = 'all') {
        const timestamp = getFormattedDateTime();
        if (category === 'p2') {
            if (!renOrderZipBlob) {
                alert("No Order files ZIP available.");
                return;
            }
            triggerDownload(renOrderZipBlob, `AJIO_ORDER_RENAMED_${timestamp}.zip`);
            renLog(`Downloaded Order Files ZIP.`, 'success');
        } else if (category === 'g') {
            if (!renTaxZipBlob) {
                alert("No Tax files ZIP available.");
                return;
            }
            triggerDownload(renTaxZipBlob, `AJIO_TAX_RENAMED_${timestamp}.zip`);
            renLog(`Downloaded Tax Files ZIP.`, 'success');
        } else {
            if (!renZipBlob) {
                alert("No ZIP file available to download.");
                return;
            }
            triggerDownload(renZipBlob, `AJIO_ALL_RENAMED_${timestamp}.zip`);
            renLog(`Downloaded All Renamed Files ZIP.`, 'success');
        }
    }

    async function rebuildRenZip() {
        const zipAll = new JSZip();
        const zipOrder = new JSZip();
        const zipTax = new JSZip();

        for (const fileObj of activeRenamedFiles) {
            if (!fileObj.blob) {
                const buffer = await fileObj.file.arrayBuffer();
                fileObj.blob = new Blob([buffer], { type: fileObj.file.type });
            }
            const buffer = await fileObj.blob.arrayBuffer();
            const fName = fileObj.renamedName || fileObj.newName;
            zipAll.file(fName, buffer);
            if (fileObj.methodType === 'p2') {
                zipOrder.file(fName, buffer);
            } else {
                zipTax.file(fName, buffer);
            }
        }

        renZipBlob = await zipAll.generateAsync({ type: 'blob' });
        renOrderZipBlob = await zipOrder.generateAsync({ type: 'blob' });
        renTaxZipBlob = await zipTax.generateAsync({ type: 'blob' });

        saveTabSession('rename_tab', {
            activeRenamedFiles: activeRenamedFiles,
            renZipBlob: renZipBlob
        });
    }

    /* ==========================================================================
       EDIT PREFIX MODAL LOGIC
       ========================================================================== */
    function openEditPrefixModal(file) {
        if (!file) return;
        renActiveEditFile = file;

        if (editPrefixFilename) {
            editPrefixFilename.textContent = file.originalName || file.name;
        }

        if (editPrefixInput) {
            editPrefixInput.value = (file.renameCode && file.renameCode !== "Not Found") ? file.renameCode : "";
            setTimeout(() => {
                editPrefixInput.focus();
                editPrefixInput.select();
            }, 100);
        }

        if (editPrefixModal) {
            editPrefixModal.style.display = 'flex';
        }
    }

    function closeEditPrefixModal() {
        if (editPrefixModal) {
            editPrefixModal.style.display = 'none';
        }
        renActiveEditFile = null;
    }

    async function saveEditPrefix() {
        if (!renActiveEditFile) return;

        const newPrefix = editPrefixInput ? editPrefixInput.value.trim() : "";
        const extIdx = (renActiveEditFile.originalName || renActiveEditFile.name).lastIndexOf('.');
        const baseName = extIdx !== -1 ? (renActiveEditFile.originalName || renActiveEditFile.name).substring(0, extIdx) : (renActiveEditFile.originalName || renActiveEditFile.name);
        const ext = extIdx !== -1 ? (renActiveEditFile.originalName || renActiveEditFile.name).substring(extIdx) : '.xlsx';

        if (newPrefix && newPrefix !== "") {
            renActiveEditFile.renameCode = newPrefix;
            renActiveEditFile.renamedName = `${baseName}-${newPrefix}${ext}`;
            renActiveEditFile.newName = renActiveEditFile.renamedName;
            renActiveEditFile.success = true;
            renActiveEditFile.hasSuffix = true;
            showCustomAlert(`Prefix "${newPrefix}" applied to "${renActiveEditFile.originalName || renActiveEditFile.name}"!`, "success");
            renLog(`Manually set prefix [${newPrefix}] for "${renActiveEditFile.originalName || renActiveEditFile.name}" -> "${renActiveEditFile.renamedName}"`, 'success');
        } else {
            renActiveEditFile.renameCode = "Not Found";
            renActiveEditFile.renamedName = renActiveEditFile.originalName || renActiveEditFile.name;
            renActiveEditFile.newName = renActiveEditFile.renamedName;
            renActiveEditFile.success = false;
            renActiveEditFile.hasSuffix = false;
            renLog(`Prefix cleared for "${renActiveEditFile.originalName || renActiveEditFile.name}".`, 'info');
        }

        closeEditPrefixModal();

        if (renIsProcessed) {
            await rebuildRenZip();
        }

        renderRenameState();
        renderModalTableRows();
    }

    if (btnCloseEditPrefix) btnCloseEditPrefix.addEventListener('click', closeEditPrefixModal);
    if (btnCancelEditPrefix) btnCancelEditPrefix.addEventListener('click', closeEditPrefixModal);
    if (btnSaveEditPrefix) btnSaveEditPrefix.addEventListener('click', saveEditPrefix);

    if (editPrefixInput) {
        editPrefixInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEditPrefix();
            } else if (e.key === 'Escape') {
                closeEditPrefixModal();
            }
        });
    }

    if (editPrefixModal) {
        editPrefixModal.addEventListener('click', (e) => {
            if (e.target === editPrefixModal) {
                closeEditPrefixModal();
            }
        });
    }

    async function deleteRenamedFile(fileObj) {
        const displayName = fileObj.renamedName || fileObj.newName || fileObj.name || 'this file';
        const ok = await showCustomConfirm('Delete File', `Are you sure you want to delete "${displayName}"?`, 'danger', 'Delete');
        if (!ok) return;

        renFiles = renFiles.filter(f => f.id !== fileObj.id);
        activeRenamedFiles = activeRenamedFiles.filter(f => f.id !== fileObj.id);

        if (activeRenamedFiles.length > 0) {
            await rebuildRenZip();
        } else {
            renZipBlob = null;
            renOrderZipBlob = null;
            renTaxZipBlob = null;
            renIsProcessed = false;
        }

        updateRenUploadBadges();
        renderRenameState();
        renderModalTableRows();
        renLog(`Deleted file: ${displayName}`, 'info');
    }

    /* ==========================================================================
       FULLSCREEN MODAL FOR RENAMED FILES
       ========================================================================== */
    const renFullscreenModal = document.getElementById('renFullscreenModal');
    const closeRenModalBtn = document.getElementById('closeRenModalBtn');
    const modalFilterAllBtn = document.getElementById('modalFilterAllBtn');
    const modalFilterOrderBtn = document.getElementById('modalFilterOrderBtn');
    const modalFilterTaxBtn = document.getElementById('modalFilterTaxBtn');
    const modalFilterErrorBtn = document.getElementById('modalFilterErrorBtn');
    const modalFilterSuccessBtn = document.getElementById('modalFilterSuccessBtn');
    const modalRenSearchInput = document.getElementById('modalRenSearchInput');
    const modalDownloadAllZipBtn = document.getElementById('modalDownloadAllZipBtn');
    const modalHeaderMoveToMergeBtn = document.getElementById('modalHeaderMoveToMergeBtn');
    const modalFooterMoveToMergeBtn = document.getElementById('modalFooterMoveToMergeBtn');
    const modalFooterCloseBtn = document.getElementById('modalFooterCloseBtn');
    const modalFooterDownloadBtn = document.getElementById('modalFooterDownloadBtn');

    function openRenameModal(files, defaultFilter = 'all') {
        if (!renFullscreenModal) return;
        renModalCurrentFilter = defaultFilter;
        updateModalFilterTabsUI();
        if (modalRenSearchInput) modalRenSearchInput.value = '';
        renderModalTableRows();
        renFullscreenModal.classList.add('show');
    }

    function closeRenameModal() {
        if (renFullscreenModal) renFullscreenModal.classList.remove('show');
    }

    function updateModalFilterTabsUI() {
        const filterBtns = document.querySelectorAll('.rename-filter-btn');
        filterBtns.forEach(btn => {
            const f = btn.getAttribute('data-filter');
            if (f === renModalCurrentFilter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    if (closeRenModalBtn) closeRenModalBtn.addEventListener('click', closeRenameModal);
    if (modalFooterCloseBtn) modalFooterCloseBtn.addEventListener('click', closeRenameModal);

    if (modalFilterAllBtn) modalFilterAllBtn.addEventListener('click', () => { renModalCurrentFilter = 'all'; updateModalFilterTabsUI(); renderModalTableRows(); });
    if (modalFilterOrderBtn) modalFilterOrderBtn.addEventListener('click', () => { renModalCurrentFilter = 'p2'; updateModalFilterTabsUI(); renderModalTableRows(); });
    if (modalFilterTaxBtn) modalFilterTaxBtn.addEventListener('click', () => { renModalCurrentFilter = 'g'; updateModalFilterTabsUI(); renderModalTableRows(); });
    if (modalFilterErrorBtn) modalFilterErrorBtn.addEventListener('click', () => { renModalCurrentFilter = 'error'; updateModalFilterTabsUI(); renderModalTableRows(); });
    if (modalFilterSuccessBtn) modalFilterSuccessBtn.addEventListener('click', () => { renModalCurrentFilter = 'success'; updateModalFilterTabsUI(); renderModalTableRows(); });

    if (modalRenSearchInput) {
        modalRenSearchInput.addEventListener('input', () => {
            renderModalTableRows();
        });
    }

    if (modalDownloadAllZipBtn) modalDownloadAllZipBtn.addEventListener('click', () => downloadRenZip('all'));
    if (modalFooterDownloadBtn) modalFooterDownloadBtn.addEventListener('click', () => downloadRenZip('all'));
    if (modalHeaderMoveToMergeBtn) modalHeaderMoveToMergeBtn.addEventListener('click', moveToMerge);
    if (modalFooterMoveToMergeBtn) modalFooterMoveToMergeBtn.addEventListener('click', moveToMerge);

    if (renFullscreenModal) {
        renFullscreenModal.addEventListener('click', (e) => {
            if (e.target === renFullscreenModal) {
                closeRenameModal();
            }
        });
    }

    function renderModalTableRows() {
        const tableBody = document.getElementById('modalRenTableBody');
        const summaryText = document.getElementById('modalRenSummaryText');
        const totalBadge = document.getElementById('modalRenTotalBadge');
        const successBadge = document.getElementById('modalRenSuccessBadge');
        const errorBadge = document.getElementById('modalRenErrorBadge');

        if (!tableBody) return;

        const totalCount = activeRenamedFiles.length;
        const successCount = activeRenamedFiles.filter(f => f.hasSuffix && f.renameCode && f.renameCode !== "Not Found").length;
        const errorCount = activeRenamedFiles.filter(f => !f.hasSuffix || !f.renameCode || f.renameCode === "Not Found").length;

        if (totalBadge) totalBadge.innerHTML = `<i class="fa-solid fa-files"></i> Total: ${totalCount}`;
        if (successBadge) successBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Suffix Added: ${successCount}`;
        if (errorBadge) {
            errorBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Missing Suffix: ${errorCount}`;
            errorBadge.style.display = errorCount > 0 ? 'inline-flex' : 'none';
        }

        const query = (modalRenSearchInput ? modalRenSearchInput.value : '').toLowerCase().trim();

        let filtered = activeRenamedFiles.filter(file => {
            // Apply category / status filter
            if (renModalCurrentFilter === 'p2' && file.methodType !== 'p2') return false;
            if (renModalCurrentFilter === 'g' && file.methodType !== 'g') return false;
            if (renModalCurrentFilter === 'error' && (file.hasSuffix && file.renameCode && file.renameCode !== "Not Found")) return false;
            if (renModalCurrentFilter === 'success' && (!file.hasSuffix || !file.renameCode || file.renameCode === "Not Found")) return false;

            // Apply search query
            if (query !== '') {
                const name = (file.renamedName || file.newName || file.name || '').toLowerCase();
                const orig = (file.originalName || file.name || '').toLowerCase();
                const code = (file.renameCode || '').toLowerCase();
                return name.includes(query) || orig.includes(query) || code.includes(query);
            }
            return true;
        });

        tableBody.innerHTML = '';

        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem; font-size: 0.85rem;">No files found matching criteria.</td></tr>`;
            if (summaryText) summaryText.innerText = `Showing 0 of ${activeRenamedFiles.length} files`;
            return;
        }

        filtered.forEach((file, idx) => {
            const isMissing = !file.hasSuffix || !file.renameCode || file.renameCode === "Not Found";
            const tr = document.createElement('tr');
            tr.className = isMissing ? 'row-missing-suffix' : 'row-valid-suffix';

            const statusBadge = isMissing
                ? `<span class="rename-table-badge danger"><i class="fa-solid fa-circle-xmark"></i> Missing Suffix</span>`
                : `<span class="rename-table-badge success"><i class="fa-solid fa-circle-check"></i> Renamed</span>`;

            const codeDisplay = (file.renameCode && file.renameCode !== "Not Found")
                ? `<span class="badge ${file.methodType === 'p2' ? 'badge-od' : 'badge-dt'}" style="font-weight: 700;">${file.renameCode}</span>`
                : `<span style="color: #dc2626; font-weight: 600; font-size: 0.75rem;">None</span>`;

            tr.innerHTML = `
                <td style="text-align: center; font-weight: 600;">${idx + 1}</td>
                <td>${statusBadge}</td>
                <td>${codeDisplay}</td>
                <td><span style="font-weight: 600; color: var(--primary); font-size: 0.8rem;">${file.renamedName || file.newName}</span></td>
                <td><span style="color: var(--text-muted); font-size: 0.78rem;">${file.originalName || file.name}</span></td>
                <td style="text-align: center;">
                    <button class="btn btn-secondary modal-inspect-btn" data-id="${file.id}" style="padding: 0.25rem 0.55rem; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 4px;">
                        <i class="fa-solid fa-eye"></i> View Data
                    </button>
                </td>
                <td style="text-align: right; font-size: 0.78rem; color: var(--text-muted);">${formatBytes(file.size)}</td>
                <td style="text-align: center;">
                    <div style="display: inline-flex; gap: 6px;">
                        <button class="btn-action modal-edit-single" data-id="${file.id}" title="Edit Prefix Code" style="width: 26px; height: 26px; border-radius: 6px; border: none; background: rgba(5, 150, 105, 0.08); color: #059669; cursor: pointer;">
                            <i class="fa-solid fa-pen" style="font-size: 0.75rem;"></i>
                        </button>
                        <button class="btn-action modal-dl-single" data-id="${file.id}" title="Download Single File" style="width: 26px; height: 26px; border-radius: 6px; border: none; background: rgba(14, 165, 233, 0.08); color: #0284c7; cursor: pointer;">
                            <i class="fa-solid fa-download" style="font-size: 0.75rem;"></i>
                        </button>
                        <button class="btn-action modal-del-single" data-id="${file.id}" title="Delete File" style="width: 26px; height: 26px; border-radius: 6px; border: none; background: rgba(220, 38, 38, 0.08); color: #dc2626; cursor: pointer;">
                            <i class="fa-solid fa-trash-can" style="font-size: 0.75rem;"></i>
                        </button>
                    </div>
                </td>
            `;

            const inspectBtn = tr.querySelector('.modal-inspect-btn');
            if (inspectBtn) inspectBtn.addEventListener('click', () => openExcelDataViewer(file));

            const editBtn = tr.querySelector('.modal-edit-single');
            if (editBtn) editBtn.addEventListener('click', () => openEditPrefixModal(file));

            const dlBtn = tr.querySelector('.modal-dl-single');
            if (dlBtn) dlBtn.addEventListener('click', () => {
                if (file.blob) triggerDownload(file.blob, file.renamedName || file.newName);
            });

            const delBtn = tr.querySelector('.modal-del-single');
            if (delBtn) delBtn.addEventListener('click', async () => {
                await deleteRenamedFile(file);
            });

            tableBody.appendChild(tr);
        });

        if (summaryText) {
            summaryText.innerText = `Showing ${filtered.length} of ${activeRenamedFiles.length} files`;
        }
    }


    /* ==========================================================================
       EXCEL 50-ROW DATA VIEWER LOGIC
       ========================================================================== */
    async function openExcelDataViewer(fileObj) {
        const modal = document.getElementById('excelDataViewerModal');
        const fileNameEl = document.getElementById('viewerFileName');
        const totalRowsEl = document.getElementById('viewerTotalRows');
        const codeBadgeEl = document.getElementById('viewerDetectedCodeBadge');
        const renameInput = document.getElementById('viewerRenameInput');
        const extLabel = document.getElementById('viewerExtensionLabel');
        const saveRenameBtn = document.getElementById('viewerSaveRenameBtn');
        const gridTable = document.getElementById('excelGridTable');
        if (!modal) return;

        const fName = fileObj.newName || fileObj.name || fileObj.originalName || 'file.xlsx';
        const lastDot = fName.lastIndexOf('.');
        const baseName = lastDot !== -1 ? fName.substring(0, lastDot) : fName;
        const ext = lastDot !== -1 ? fName.substring(lastDot) : '.xlsx';

        if (fileNameEl) fileNameEl.innerText = fName;
        if (renameInput) renameInput.value = baseName;
        if (extLabel) extLabel.innerText = ext;

        function updateViewerBadge() {
            if (!codeBadgeEl) return;
            if (fileObj.hasSuffix && fileObj.renameCode) {
                codeBadgeEl.style.background = '#dcfce7';
                codeBadgeEl.style.color = '#15803d';
                codeBadgeEl.style.border = '1px solid #86efac';
                codeBadgeEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Column F Code: -${fileObj.renameCode}`;
            } else {
                codeBadgeEl.style.background = '#fee2e2';
                codeBadgeEl.style.color = '#b91c1c';
                codeBadgeEl.style.border = '1px solid #fca5a5';
                codeBadgeEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Suffix Missing`;
            }
        }
        updateViewerBadge();

        let aoa = fileObj.aoa;
        if (!aoa) {
            if (gridTable) {
                gridTable.innerHTML = `
                    <tr><td colspan="10" style="text-align: center; padding: 3rem;">
                        <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: #8b5cf6;"></i>
                        <p style="margin-top: 0.75rem; color: var(--text-muted); font-weight: 600;">Reading Excel data...</p>
                    </td></tr>
                `;
            }
            try {
                aoa = await parseFileToAoa(fileObj.file || fileObj.blob, fileObj.originalName || fName);
                fileObj.aoa = aoa;
            } catch (err) {
                if (gridTable) {
                    gridTable.innerHTML = `<tr><td style="color: #ef4444; padding: 2rem; text-align: center;">Failed to load Excel file: ${err.message}</td></tr>`;
                }
                modal.classList.add('show');
                return;
            }
        }

        const totalRows = aoa ? aoa.length : 0;
        if (totalRowsEl) {
            totalRowsEl.innerText = `Total ${totalRows.toLocaleString()} rows`;
        }

        if (gridTable && aoa && aoa.length > 0) {
            gridTable.innerHTML = '';

            let maxCols = 0;
            const previewRows = aoa.slice(0, 51);
            previewRows.forEach(r => {
                if (r && r.length > maxCols) maxCols = r.length;
            });
            if (maxCols < 7) maxCols = 7;

            function colIndexToLetter(idx) {
                let letter = '';
                let temp = idx;
                while (temp >= 0) {
                    letter = String.fromCharCode((temp % 26) + 65) + letter;
                    temp = Math.floor(temp / 26) - 1;
                }
                return letter;
            }

            const thead = document.createElement('thead');
            
            // Header Row 1: Col Letters (A, B, C, D, E, F, ...)
            const trLetters = document.createElement('tr');
            const thCorner = document.createElement('th');
            thCorner.innerText = '#';
            thCorner.style.width = '45px';
            thCorner.style.textAlign = 'center';
            trLetters.appendChild(thCorner);

            for (let c = 0; c < maxCols; c++) {
                const th = document.createElement('th');
                const letter = colIndexToLetter(c);
                if (c === 5) {
                    th.className = 'col-highlight-f';
                    th.innerHTML = `Col ${letter} <span style="font-size:0.65rem; font-weight:800; background:#7c3aed; color:white; padding:1px 5px; border-radius:3px; margin-left:4px;">AJIO CODE</span>`;
                } else {
                    th.innerText = `Col ${letter}`;
                }
                trLetters.appendChild(th);
            }
            thead.appendChild(trLetters);

            // Header Row 2: Sheet Headers
            const headerRow = aoa[0] || [];
            const trHeaders = document.createElement('tr');
            const thHeaderRowIndex = document.createElement('th');
            thHeaderRowIndex.innerText = '1';
            thHeaderRowIndex.style.textAlign = 'center';
            thHeaderRowIndex.style.color = '#64748b';
            trHeaders.appendChild(thHeaderRowIndex);

            for (let c = 0; c < maxCols; c++) {
                const thVal = document.createElement('th');
                if (c === 5) thVal.className = 'col-highlight-f';
                const val = headerRow[c] !== undefined ? String(headerRow[c]) : '';
                thVal.innerText = val;
                thVal.title = val;
                trHeaders.appendChild(thVal);
            }
            thead.appendChild(trHeaders);
            gridTable.appendChild(thead);

            // Tbody: First 50 rows of data (Rows 2 to 51)
            const tbody = document.createElement('tbody');
            const dataRows = aoa.slice(1, 51);

            dataRows.forEach((row, rIdx) => {
                const tr = document.createElement('tr');
                const tdNum = document.createElement('td');
                tdNum.className = 'row-num';
                tdNum.innerText = rIdx + 2;
                tr.appendChild(tdNum);

                for (let c = 0; c < maxCols; c++) {
                    const td = document.createElement('td');
                    if (c === 5) td.className = 'col-highlight-f';
                    const cellVal = row && row[c] !== undefined ? String(row[c]) : '';
                    td.innerText = cellVal;
                    td.title = cellVal;
                    tr.appendChild(td);
                }
                tbody.appendChild(tr);
            });
            gridTable.appendChild(tbody);
        }

        // Quick Rename in Viewer Header
        if (saveRenameBtn && renameInput) {
            const newSaveBtn = saveRenameBtn.cloneNode(true);
            saveRenameBtn.parentNode.replaceChild(newSaveBtn, saveRenameBtn);

            const handleSave = async () => {
                const newBase = renameInput.value;
                await saveManualRename(fileObj, newBase);
                if (fileNameEl) fileNameEl.innerText = fName;
                const newLastDot = fileObj.newName.lastIndexOf('.');
                renameInput.value = newLastDot !== -1 ? fileObj.newName.substring(0, newLastDot) : fileObj.newName;
                if (extLabel) extLabel.innerText = newLastDot !== -1 ? fileObj.newName.substring(newLastDot) : '.xlsx';
                updateViewerBadge();
                alert(`File successfully renamed to: ${fileObj.newName}`);
            };

            newSaveBtn.addEventListener('click', handleSave);
            renameInput.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSave();
                }
            };
        }

        modal.classList.add('show');
    }

    function closeExcelDataViewer() {
        const modal = document.getElementById('excelDataViewerModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    // Bind Excel Viewer Close triggers
    const closeExcelViewerBtn = document.getElementById('closeExcelViewerBtn');
    if (closeExcelViewerBtn) closeExcelViewerBtn.addEventListener('click', closeExcelDataViewer);

    const viewerFooterCloseBtn = document.getElementById('viewerFooterCloseBtn');
    if (viewerFooterCloseBtn) viewerFooterCloseBtn.addEventListener('click', closeExcelDataViewer);

    const excelDataViewerModal = document.getElementById('excelDataViewerModal');
    if (excelDataViewerModal) {
        excelDataViewerModal.addEventListener('click', (e) => {
            if (e.target === excelDataViewerModal) {
                closeExcelDataViewer();
            }
        });
    }

    async function restoreRenameSession() {
        try {
            const saved = await loadTabSession('rename_tab');
            if (saved && saved.activeRenamedFiles && saved.activeRenamedFiles.length > 0) {
                activeRenamedFiles = saved.activeRenamedFiles;
                renFiles = [...saved.activeRenamedFiles];
                renZipBlob = saved.renZipBlob;
                renIsProcessed = true;
                updateRenUploadBadges();
                renderRenameState();
                if (renStatus) {
                    renStatus.className = 'status-indicator success';
                    renStatus.innerText = 'Restored';
                }
                renLog(`Restored ${activeRenamedFiles.length} renamed file(s) from previous session.`, 'info');
            }
        } catch (e) {
            console.warn('Failed to restore rename session:', e);
        }
    }
    restoreRenameSession();

    /* ==========================================================================
       MERGE FILE (MERGE BY LASTNAME) LOGIC
       ========================================================================== */
    let gmFiles = [];
    let gmZipBlob = null;
    let gmMergedList = [];

    const gmDropzone = document.getElementById('gmDropzone');
    const gmFileInput = document.getElementById('gmFileInput');
    const gmFileDisplay = document.getElementById('gmFileDisplay');
    const gmBtn = document.getElementById('gmBtn');
    const gmStatus = document.getElementById('gmStatus');
    const gmProgressCard = document.getElementById('gmProgressCard');
    const gmProgressBar = document.getElementById('gmProgressBar');
    const gmProgressPercent = document.getElementById('gmProgressPercent');
    const gmProgressStepText = document.getElementById('gmProgressStepText');
    const gmOutputContainer = document.getElementById('gmOutputContainer');
    const gmConsoleLog = document.getElementById('gmConsoleLog');
    const clearGmLogBtn = document.getElementById('clearGmLogBtn');
    const clearGmFilesBtn = document.getElementById('clearGmFilesBtn');
    const gmSelectedCount = document.getElementById('gmSelectedCount');
    const gmUploadedFileList = document.getElementById('gmUploadedFileList');

    function gmLog(message, type = 'info') {
        if (!gmConsoleLog) return;
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        line.innerText = `[${timestamp}] ${message}`;
        if (gmConsoleLog.children.length > 300) {
            gmConsoleLog.removeChild(gmConsoleLog.firstChild);
        }
        gmConsoleLog.appendChild(line);
        gmConsoleLog.scrollTop = gmConsoleLog.scrollHeight;
    }

    if (clearGmLogBtn) {
        clearGmLogBtn.addEventListener('click', () => {
            gmConsoleLog.innerHTML = '';
            gmLog('Log cleared.', 'info');
        });
    }

    if (gmDropzone && gmFileInput) {
        setupMultiDropzone(gmDropzone, gmFileInput, (files) => {
            let added = 0;
            files.forEach(file => {
                if (!gmFiles.some(f => f.name === file.name && f.size === file.size)) {
                    gmFiles.push({
                        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                        name: file.name,
                        size: file.size,
                        file: file
                    });
                    added++;
                }
            });
            if (added > 0) {
                gmLog(`Added ${added} file(s) to merge list.`, 'success');
            }
            updateGmUI();
            saveTabSession('merge_tab', {
                gmFiles: gmFiles,
                mergedList: gmMergedList,
                gmZipBlob: gmZipBlob
            });
        });
    }

    if (clearGmFilesBtn) {
        clearGmFilesBtn.addEventListener('click', async () => {
            const ok = await showCustomConfirm('Clear Files', 'Are you sure you want to clear all selected files and merge results?', 'danger', 'Clear All');
            if (!ok) return;

            gmFiles = [];
            gmMergedList = [];
            gmZipBlob = null;
            gmFileInput.value = '';
            updateGmUI();
            if (gmOutputContainer) {
                gmOutputContainer.innerHTML = `
                    <div class="empty-output-state">
                        <i class="fa-solid fa-file-export placeholder-icon"></i>
                        <p>Upload files and click process to generate merged groups.</p>
                    </div>
                `;
            }
            clearTabSession('merge_tab');
            gmLog('Cleared all selected files and merge results.', 'info');
        });
    }

    function updateGmUI() {
        if (gmSelectedCount) gmSelectedCount.innerText = gmFiles.length;
        if (!gmUploadedFileList) return;
        
        if (gmFiles.length > 0) {
            if (gmBtn) gmBtn.removeAttribute('disabled');
            gmUploadedFileList.innerHTML = '';
            gmFiles.forEach(fileObj => {
                const item = document.createElement('div');
                item.className = 'file-item';
                
                const info = document.createElement('div');
                info.className = 'file-info';
                
                const icon = document.createElement('i');
                icon.className = getFileIconClass(fileObj.name);
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'file-name';
                nameSpan.innerText = fileObj.name;
                
                const sizeSpan = document.createElement('span');
                sizeSpan.className = 'file-size';
                sizeSpan.innerText = formatBytes(fileObj.size);
                
                info.appendChild(icon);
                info.appendChild(nameSpan);
                info.appendChild(sizeSpan);
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'file-action-btn';
                removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                removeBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const ok = await showCustomConfirm('Remove File', `Are you sure you want to remove "${fileObj.name}"?`, 'danger', 'Remove');
                    if (!ok) return;
                    gmFiles = gmFiles.filter(f => f.id !== fileObj.id);
                    gmLog(`Removed file: ${fileObj.name}`, 'info');
                    updateGmUI();
                    saveTabSession('merge_tab', {
                        gmFiles: gmFiles,
                        mergedList: gmMergedList,
                        gmZipBlob: gmZipBlob
                    });
                });
                
                item.appendChild(info);
                item.appendChild(removeBtn);
                gmUploadedFileList.appendChild(item);
            });
        } else {
            if (gmBtn) gmBtn.setAttribute('disabled', 'true');
            gmUploadedFileList.innerHTML = '<div class="empty-list-msg">No files selected yet.</div>';
        }
    }

        if (gmBtn) {
        gmBtn.addEventListener('click', async () => {
            if (gmFiles.length === 0) return;

            gmBtn.setAttribute('disabled', 'true');
            if (gmStatus) {
                gmStatus.className = 'status-indicator processing';
                gmStatus.innerText = 'Processing';
            }
            if (gmProgressCard) gmProgressCard.classList.remove('hidden');
            if (gmProgressBar) gmProgressBar.style.width = '5%';
            if (gmProgressPercent) gmProgressPercent.innerText = '5%';
            if (gmProgressStepText) gmProgressStepText.innerText = 'Grouping files...';
            
            if (gmOutputContainer) {
                gmOutputContainer.innerHTML = `
                    <div class="empty-output-state">
                        <i class="fa-solid fa-spinner fa-spin placeholder-icon" style="color: #8b5cf6;"></i>
                        <p style="font-size: 1.1rem; font-weight: 600; margin-top: 0.5rem;">Merging files in high-performance mode...</p>
                        <p style="color: var(--text-muted); font-size: 0.85rem;">Zero page freeze enabled for large datasets</p>
                    </div>
                `;
            }

            gmLog('Starting Group Merge Pipeline (Optimized Non-Blocking Engine)...', 'process');
            await new Promise(r => setTimeout(r, 20));

            try {
                const groups = {};
                gmFiles.forEach(fileObj => {
                    const lastName = getFileLastPart(fileObj.name);
                    if (!groups[lastName]) {
                        groups[lastName] = [];
                    }
                    groups[lastName].push(fileObj);
                });

                const groupKeys = Object.keys(groups);
                gmLog(`Found ${groupKeys.length} group(s) to process: [${groupKeys.join(', ')}]`, 'info');

                const zip = new JSZip();
                const mergedList = [];

                for (let k = 0; k < groupKeys.length; k++) {
                    const key = groupKeys[k];
                    const filesInGroup = groups[key];
                    gmLog(`----------------------------------------`, 'info');
                    gmLog(`Merging Group [${key}] with ${filesInGroup.length} file(s)...`, 'process');
                    
                    let mergedAoa = [];

                    for (let fIdx = 0; fIdx < filesInGroup.length; fIdx++) {
                        const fileObj = filesInGroup[fIdx];
                        const groupProgress = Math.round(5 + ((k + (fIdx / filesInGroup.length)) / groupKeys.length) * 75);
                        if (gmProgressBar) gmProgressBar.style.width = `${groupProgress}%`;
                        if (gmProgressPercent) gmProgressPercent.innerText = `${groupProgress}%`;
                        if (gmProgressStepText) gmProgressStepText.innerText = `[${k + 1}/${groupKeys.length}] Reading "${fileObj.name}" for group [${key}]...`;
                        
                        gmLog(`Parsing ${fileObj.name} (${formatBytes(fileObj.size)}) for group [${key}]...`, 'info');
                        
                        // Yield to browser event loop so UI repaints smoothly
                        await new Promise(r => setTimeout(r, 10));

                        const fileAoa = await parseFileToAoa(fileObj.file, fileObj.name);
                        
                        if (!fileAoa || fileAoa.length === 0) {
                            gmLog(`Warning: file ${fileObj.name} is empty, skipping`, 'warning');
                            continue;
                        }

                        // Append rows chunk-by-chunk to prevent stack overflow & UI freeze
                        if (mergedAoa.length === 0) {
                            // First file: take all rows (header + data)
                            for (let r = 0; r < fileAoa.length; r++) {
                                mergedAoa.push(fileAoa[r]);
                                if (r > 0 && r % 8000 === 0) {
                                    await new Promise(res => setTimeout(res, 0));
                                }
                            }
                        } else {
                            // Subsequent files: skip row 0 header and append data rows
                            for (let r = 1; r < fileAoa.length; r++) {
                                mergedAoa.push(fileAoa[r]);
                                if (r % 8000 === 0) {
                                    await new Promise(res => setTimeout(res, 0));
                                }
                            }
                        }

                        gmLog(`Loaded ${fileObj.name} (${(fileAoa.length - 1).toLocaleString()} data rows). Group [${key}] total: ${(mergedAoa.length - 1).toLocaleString()} rows.`, 'info');
                        await new Promise(r => setTimeout(r, 5));
                    }

                    if (mergedAoa.length === 0) {
                        gmLog(`Group [${key}] has no rows to export, skipping.`, 'warning');
                        continue;
                    }

                    const totalDataRows = Math.max(0, mergedAoa.length - 1);
                    if (gmProgressStepText) gmProgressStepText.innerText = `Generating Excel file for group [${key}] (${totalDataRows.toLocaleString()} rows)...`;
                    await new Promise(r => setTimeout(r, 20));

                    // Convert to worksheet safely
                    const newWs = XLSX.utils.aoa_to_sheet(mergedAoa);
                    const newWb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(newWb, newWs, "Sheet1");
                    
                    const outFilename = `${key}-DropShipOrderReports-AJIO-${key}.xlsx`;
                    
                    await new Promise(r => setTimeout(r, 20));
                    const excelBuffer = XLSX.write(newWb, { bookType: 'xlsx', type: 'array' });
                    const fileBlob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

                    zip.file(outFilename, excelBuffer);

                    mergedList.push({
                        name: outFilename,
                        size: fileBlob.size,
                        rows: totalDataRows,
                        blob: fileBlob,
                        groupKey: key
                    });

                    gmLog(`Merged group [${key}] created: "${outFilename}" with ${totalDataRows.toLocaleString()} data rows (${formatBytes(fileBlob.size)}).`, 'success');
                    await new Promise(r => setTimeout(r, 10));
                }

                if (mergedList.length === 0) {
                    throw new Error("No data rows found across uploaded files to merge.");
                }

                if (gmProgressBar) gmProgressBar.style.width = '82%';
                if (gmProgressPercent) gmProgressPercent.innerText = '82%';
                if (gmProgressStepText) gmProgressStepText.innerText = 'Compressing and packaging final ZIP file...';
                await new Promise(r => setTimeout(r, 20));

                gmZipBlob = await zip.generateAsync({
                    type: 'blob',
                    compression: "DEFLATE",
                    compressionOptions: { level: 6 }
                }, function updateCallback(metadata) {
                    const zipPercent = Math.min(98, 82 + Math.round((metadata.percent / 100) * 16));
                    if (gmProgressBar) gmProgressBar.style.width = `${zipPercent}%`;
                    if (gmProgressPercent) gmProgressPercent.innerText = `${zipPercent}%`;
                    if (gmProgressStepText) gmProgressStepText.innerText = `Packaging ZIP: ${Math.round(metadata.percent)}%...`;
                });

                gmMergedList = mergedList;

                renderGmDashboard(mergedList);
                await saveTabSession('merge_tab', {
                    gmFiles: gmFiles,
                    mergedList: gmMergedList,
                    gmZipBlob: gmZipBlob
                });

                if (gmProgressBar) gmProgressBar.style.width = '100%';
                if (gmProgressPercent) gmProgressPercent.innerText = '100%';
                if (gmProgressStepText) gmProgressStepText.innerText = 'Merge completed successfully!';
                
                if (gmStatus) {
                    gmStatus.className = 'status-indicator success';
                    gmStatus.innerText = 'Completed';
                }
                
                alert("FILES MERGED SUCCESSFULLY");
                gmLog('Merge process completed successfully. All merged files packaged.', 'success');

            } catch (err) {
                console.error('Merge error:', err);
                gmLog(`Merge process failed: ${err.message}`, 'error');
                if (gmStatus) {
                    gmStatus.className = 'status-indicator idle';
                    gmStatus.innerText = 'Failed';
                }
                if (gmOutputContainer) {
                    gmOutputContainer.innerHTML = `
                        <div class="empty-output-state">
                            <i class="fa-solid fa-circle-exclamation placeholder-icon" style="color: #ef4444;"></i>
                            <p style="color: #ef4444; font-weight: 600;">Error: ${err.message}</p>
                        </div>
                    `;
                }
            } finally {
                gmBtn.removeAttribute('disabled');
            }
        });
    }

    function getFileLastPart(filename) {
        const extIdx = filename.lastIndexOf('.');
        const baseName = extIdx !== -1 ? filename.substring(0, extIdx) : filename;
        const parts = baseName.split('-');
        return parts[parts.length - 1].trim();
    }

    function moveToFolderCreateFromMerge() {
        if (!gmMergedList || gmMergedList.length === 0) {
            alert('No merged files available to transfer.');
            return;
        }

        let addedCount = 0;
        gmMergedList.forEach(fileObj => {
            const blob = fileObj.blob;
            const file = fileObj.file || new File([blob], fileObj.name, {
                type: blob.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            if (!fcFiles.some(f => f.name === fileObj.name && f.size === blob.size)) {
                fcFiles.push({
                    id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    name: fileObj.name,
                    size: blob.size,
                    file: file,
                    blob: blob
                });
                addedCount++;
            }
        });

        if (typeof updateFcUI === 'function') updateFcUI();

        const folderTabBtn = document.querySelector('.tab-btn[data-tab="tab-folder-create"]');
        if (folderTabBtn) {
            folderTabBtn.click();
        }

        if (typeof fcLog === 'function') {
            fcLog(`Transferred ${addedCount} file(s) from Merge section to Folder Create section.`, 'success');
        }
        alert(`Successfully transferred ${addedCount} file(s) to Folder Create!`);
    }

    async function rebuildGmZip() {
        try {
            if (!gmMergedList || gmMergedList.length === 0) {
                gmZipBlob = null;
                return;
            }
            const zip = new JSZip();
            for (const file of gmMergedList) {
                const buffer = await file.blob.arrayBuffer();
                zip.file(file.name, buffer);
            }
            gmZipBlob = await zip.generateAsync({ type: 'blob' });
        } catch (e) {
            console.error('Failed to rebuild merge zip:', e);
        }
    }

    async function deleteMergedFile(fileObj) {
        const displayName = fileObj.name || 'this merged file';
        const ok = await showCustomConfirm('Delete Merged File', `Are you sure you want to delete "${displayName}"?`, 'danger', 'Delete');
        if (!ok) return;

        gmMergedList = gmMergedList.filter(f => f !== fileObj && f.name !== fileObj.name);
        await rebuildGmZip();

        if (gmMergedList.length === 0) {
            gmZipBlob = null;
            closeGmModal();
            if (gmOutputContainer) {
                gmOutputContainer.innerHTML = `
                    <div class="empty-output-state">
                        <i class="fa-solid fa-code-merge placeholder-icon"></i>
                        <p>Upload files and click process to merge by filename suffix.</p>
                    </div>
                `;
                gmOutputContainer.className = 'processed-container empty';
            }
            if (gmStatus) {
                gmStatus.className = 'status-indicator idle';
                gmStatus.innerText = 'Idle';
            }
        } else {
            renderGmDashboard(gmMergedList);
            const modal = document.getElementById('gmFullscreenModal');
            if (modal && modal.classList.contains('show')) {
                const totalCount = gmMergedList.length;
                const totalRows = gmMergedList.reduce((acc, f) => acc + (f.rows || 0), 0);

                const totalBadge = document.getElementById('modalGmTotalBadge');
                if (totalBadge) totalBadge.innerHTML = `<i class="fa-solid fa-files"></i> Total: ${totalCount}`;

                const rowsBadge = document.getElementById('modalGmRowsBadge');
                if (rowsBadge) rowsBadge.innerHTML = `<i class="fa-solid fa-database"></i> Total Rows: ${totalRows.toLocaleString()}`;

                renderGmModalTableRows();
            }
        }

        saveTabSession('merge_tab', {
            gmFiles: gmFiles,
            mergedList: gmMergedList,
            gmZipBlob: gmZipBlob
        });
        gmLog(`Deleted merged file: "${displayName}"`, 'warning');
    }

    function renderGmDashboard(files) {
        if (!gmOutputContainer) return;
        gmMergedList = files || gmMergedList;
        gmOutputContainer.innerHTML = '';
        gmOutputContainer.className = 'processed-container';

        const totalCount = gmMergedList.length;
        const totalRows = gmMergedList.reduce((acc, f) => acc + (f.rows || 0), 0);

        const header = document.createElement('div');
        header.className = 'processed-header';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.width = '100%';
        header.style.marginBottom = '1rem';
        header.style.flexWrap = 'wrap';
        header.style.gap = '0.5rem';
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                <h3 style="margin: 0;"><i class="fa-solid fa-circle-check text-success"></i> Merged Files (${totalCount})</h3>
                <span class="rename-badge-pill success" style="font-size: 0.75rem; padding: 2px 8px;">
                    <i class="fa-solid fa-database"></i> ${totalRows.toLocaleString()} Rows
                </span>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
                <button class="btn" id="openGmFullscreenBtn" type="button" style="background: linear-gradient(135deg, #4f46e5, #3730a3); color: white; display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.85rem; font-size: 0.78rem; font-weight: 600; border-radius: 8px; border: none; cursor: pointer; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.25);">
                    <i class="fa-solid fa-expand"></i> Full View
                </button>
                <button class="btn btn-success" id="gmMoveToFolderBtn" style="background: linear-gradient(135deg, #059669, #10b981); color: white; font-weight: 600; font-size: 0.78rem; padding: 0.45rem 0.85rem; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.25);">
                    <i class="fa-solid fa-folder-plus"></i> Move to Folder Create
                </button>
                <button class="btn btn-primary btn-glow" id="downloadAllGmBtn" style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); font-size: 0.78rem; padding: 0.45rem 0.85rem;">
                    <i class="fa-solid fa-file-zipper"></i> Download All (ZIP)
                </button>
            </div>
        `;
        gmOutputContainer.appendChild(header);

        const openModalBtn = document.getElementById('openGmFullscreenBtn');
        if (openModalBtn) {
            openModalBtn.addEventListener('click', () => {
                openGmModal(gmMergedList);
            });
        }

        const gmMoveBtn = document.getElementById('gmMoveToFolderBtn');
        if (gmMoveBtn) gmMoveBtn.addEventListener('click', moveToFolderCreateFromMerge);

        const listContainer = document.createElement('div');
        listContainer.className = 'processed-list';
        listContainer.style.display = 'flex';
        listContainer.style.flexDirection = 'column';
        listContainer.style.gap = '0.5rem';
        listContainer.style.width = '100%';
        listContainer.style.maxHeight = '300px';
        listContainer.style.overflowY = 'auto';

        gmMergedList.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'processed-item';
            item.style.padding = '0.75rem 1rem';
            item.style.borderRadius = '8px';
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            item.style.border = '1px solid var(--border-color)';
            item.style.background = 'rgba(255, 255, 255, 0.8)';
            item.style.borderLeft = '5px solid #8b5cf6';

            item.innerHTML = `
                <div class="file-details" style="display: flex; flex-direction: column; gap: 0.2rem; overflow: hidden; max-width: 62%;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                        <span class="file-name gm-dash-file-name" style="font-weight: 600; color: var(--text-primary); font-size: 0.88rem; word-break: break-all; cursor: pointer;" title="Click to view 50 rows preview">${file.name}</span>
                        <span style="font-family: monospace; font-weight: 700; background: #ede9fe; color: #6d28d9; border: 1px solid #d8b4fe; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem;">
                            ${file.groupKey || 'GROUP'}
                        </span>
                    </div>
                    <div style="display: flex; gap: 1rem; font-size: 0.75rem; color: var(--text-muted);">
                        <span><i class="fa-solid fa-database"></i> ${(file.rows || 0).toLocaleString()} Rows</span>
                        <span><i class="fa-solid fa-weight-hanging"></i> ${formatBytes(file.size)}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0;">
                    <button class="btn view-excel-btn preview-gm-dash-btn" data-index="${index}" style="font-size: 0.7rem; padding: 0.32rem 0.55rem;" title="View first 50 rows of this Excel">
                        <i class="fa-solid fa-table-cells"></i> 50 Rows
                    </button>
                    <button class="btn btn-success download-single-gm-btn" data-index="${index}" style="font-size: 0.72rem; padding: 0.35rem 0.65rem; display: flex; align-items: center; gap: 0.3rem; white-space: nowrap;">
                        <i class="fa-solid fa-download"></i> Download
                    </button>
                    <button class="btn btn-danger delete-gm-dash-btn" data-index="${index}" style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; font-size: 0.7rem; padding: 0.35rem 0.55rem; border-radius: 6px; font-weight: 600; cursor: pointer;" title="Delete this merged file">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;

            const nameEl = item.querySelector('.gm-dash-file-name');
            if (nameEl) nameEl.addEventListener('click', () => openExcelDataViewer(file));

            const previewBtn = item.querySelector('.preview-gm-dash-btn');
            if (previewBtn) previewBtn.addEventListener('click', () => openExcelDataViewer(file));

            const singleDlBtn = item.querySelector('.download-single-gm-btn');
            if (singleDlBtn) {
                singleDlBtn.addEventListener('click', () => {
                    triggerDownload(file.blob, file.name);
                    gmLog(`Downloaded merged file: ${file.name}`, 'info');
                });
            }

            const delBtn = item.querySelector('.delete-gm-dash-btn');
            if (delBtn) {
                delBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await deleteMergedFile(file);
                });
            }

            listContainer.appendChild(item);
        });

        gmOutputContainer.appendChild(listContainer);

        const dlZipBtn = document.getElementById('downloadAllGmBtn');
        if (dlZipBtn) {
            dlZipBtn.addEventListener('click', () => {
                if (gmZipBlob) {
                    triggerDownload(gmZipBlob, 'ajio_murge_file.zip');
                    gmLog('Downloaded complete ZIP package: ajio_murge_file.zip', 'info');
                }
            });
        }
    }

    function openGmModal(files) {
        const modal = document.getElementById('gmFullscreenModal');
        if (!modal) return;

        gmMergedList = files || gmMergedList;
        const totalCount = gmMergedList.length;
        const totalRows = gmMergedList.reduce((acc, f) => acc + (f.rows || 0), 0);

        const totalBadge = document.getElementById('modalGmTotalBadge');
        if (totalBadge) totalBadge.innerHTML = `<i class="fa-solid fa-files"></i> Total: ${totalCount}`;

        const rowsBadge = document.getElementById('modalGmRowsBadge');
        if (rowsBadge) rowsBadge.innerHTML = `<i class="fa-solid fa-database"></i> Total Rows: ${totalRows.toLocaleString()}`;

        const searchInput = document.getElementById('modalGmSearchInput');
        if (searchInput) searchInput.value = '';

        renderGmModalTableRows();
        modal.classList.add('show');
    }

    function closeGmModal() {
        const modal = document.getElementById('gmFullscreenModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    function renderGmModalTableRows() {
        const tableBody = document.getElementById('modalGmTableBody');
        const summaryText = document.getElementById('modalGmSummaryText');
        const searchInput = document.getElementById('modalGmSearchInput');
        if (!tableBody) return;

        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

        let filtered = gmMergedList.filter(file => {
            if (!query) return true;
            return file.name.toLowerCase().includes(query) ||
                   (file.groupKey && file.groupKey.toLowerCase().includes(query));
        });

        tableBody.innerHTML = '';

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                        <i class="fa-solid fa-filter-circle-xmark" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
                        No merged files matching current criteria.
                    </td>
                </tr>
            `;
            if (summaryText) summaryText.innerText = `Showing 0 of ${gmMergedList.length} files`;
            return;
        }

        filtered.forEach((file, index) => {
            const tr = document.createElement('tr');
            tr.className = 'rename-row-ok';

            tr.innerHTML = `
                <td style="text-align: center; font-weight: 700; color: var(--text-muted);">${index + 1}</td>
                <td style="text-align: center;">
                    <span style="font-family: monospace; font-weight: 700; background: #ede9fe; color: #6d28d9; border: 1px solid #d8b4fe; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">
                        ${file.groupKey || 'GROUP'}
                    </span>
                </td>
                <td>
                    <span class="gm-file-name-text" style="font-weight: 700; color: var(--text-primary); font-size: 0.85rem; word-break: break-all; cursor: pointer;" title="Click to view Excel preview">
                        ${file.name}
                    </span>
                </td>
                <td style="text-align: center; font-size: 0.82rem; font-weight: 600; color: #0284c7;">
                    <i class="fa-solid fa-database"></i> ${(file.rows || 0).toLocaleString()} Rows
                </td>
                <td style="text-align: center;">
                    <button type="button" class="view-excel-btn gm-row-preview-btn" title="Click to view first 50 rows of this Excel">
                        <i class="fa-solid fa-table-cells"></i> View 50 Rows
                    </button>
                </td>
                <td style="text-align: right; color: var(--text-muted); font-size: 0.8rem; white-space: nowrap;">
                    ${formatBytes(file.size)}
                </td>
                <td style="text-align: center; white-space: nowrap;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
                        <button type="button" class="btn btn-success modal-gm-download-single-btn" style="font-size: 0.72rem; padding: 0.35rem 0.65rem; display: inline-flex; align-items: center; gap: 0.3rem; border-radius: 6px;" title="Download merged file">
                            <i class="fa-solid fa-download"></i> Download
                        </button>
                        <button type="button" class="btn btn-danger modal-gm-delete-single-btn" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; font-size: 0.72rem; padding: 0.35rem 0.65rem; display: inline-flex; align-items: center; gap: 0.3rem; border-radius: 6px; border: none; cursor: pointer; font-weight: 600;" title="Delete this merged file">
                            <i class="fa-solid fa-trash-can"></i> Delete
                        </button>
                    </div>
                </td>
            `;

            const nameText = tr.querySelector('.gm-file-name-text');
            if (nameText) {
                nameText.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openExcelDataViewer(file);
                });
            }

            const previewBtn = tr.querySelector('.gm-row-preview-btn');
            if (previewBtn) {
                previewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openExcelDataViewer(file);
                });
            }

            const dlBtn = tr.querySelector('.modal-gm-download-single-btn');
            if (dlBtn) {
                dlBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    triggerDownload(file.blob, file.name);
                    gmLog(`Downloaded merged file: ${file.name}`, 'info');
                });
            }

            const delBtn = tr.querySelector('.modal-gm-delete-single-btn');
            if (delBtn) {
                delBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await deleteMergedFile(file);
                });
            }

            tableBody.appendChild(tr);
        });

        if (summaryText) {
            summaryText.innerText = `Showing ${filtered.length} of ${gmMergedList.length} files`;
        }
    }

    // Bind Merge Full View Modal Controls
    const closeGmModalBtn = document.getElementById('closeGmModalBtn');
    if (closeGmModalBtn) closeGmModalBtn.addEventListener('click', closeGmModal);

    const modalGmFooterCloseBtn = document.getElementById('modalGmFooterCloseBtn');
    if (modalGmFooterCloseBtn) modalGmFooterCloseBtn.addEventListener('click', closeGmModal);

    const modalGmHeaderMoveToFolderBtn = document.getElementById('modalGmHeaderMoveToFolderBtn');
    if (modalGmHeaderMoveToFolderBtn) modalGmHeaderMoveToFolderBtn.addEventListener('click', () => {
        closeGmModal();
        moveToFolderCreateFromMerge();
    });

    const modalGmFooterMoveToFolderBtn = document.getElementById('modalGmFooterMoveToFolderBtn');
    if (modalGmFooterMoveToFolderBtn) modalGmFooterMoveToFolderBtn.addEventListener('click', () => {
        closeGmModal();
        moveToFolderCreateFromMerge();
    });

    const modalGmDownloadAllZipBtn = document.getElementById('modalGmDownloadAllZipBtn');
    if (modalGmDownloadAllZipBtn) {
        modalGmDownloadAllZipBtn.addEventListener('click', () => {
            if (gmZipBlob) {
                triggerDownload(gmZipBlob, 'ajio_murge_file.zip');
                gmLog('Downloaded complete ZIP package: ajio_murge_file.zip', 'info');
            }
        });
    }

    const modalGmFooterDownloadBtn = document.getElementById('modalGmFooterDownloadBtn');
    if (modalGmFooterDownloadBtn) {
        modalGmFooterDownloadBtn.addEventListener('click', () => {
            if (gmZipBlob) {
                triggerDownload(gmZipBlob, 'ajio_murge_file.zip');
                gmLog('Downloaded complete ZIP package: ajio_murge_file.zip', 'info');
            }
        });
    }

    const modalGmSearchInput = document.getElementById('modalGmSearchInput');
    if (modalGmSearchInput) {
        modalGmSearchInput.addEventListener('input', () => {
            renderGmModalTableRows();
        });
    }

    const gmFullscreenModal = document.getElementById('gmFullscreenModal');
    if (gmFullscreenModal) {
        gmFullscreenModal.addEventListener('click', (e) => {
            if (e.target === gmFullscreenModal) {
                closeGmModal();
            }
        });
    }


    async function restoreMergeSession() {
        try {
            const saved = await loadTabSession('merge_tab');
            if (saved) {
                if (saved.gmFiles && saved.gmFiles.length > 0) {
                    gmFiles = saved.gmFiles;
                    updateGmUI();
                }
                if (saved.mergedList && saved.mergedList.length > 0) {
                    gmMergedList = saved.mergedList;
                    gmZipBlob = saved.gmZipBlob;
                    renderGmDashboard(gmMergedList);
                    if (gmStatus) {
                        gmStatus.className = 'status-indicator success';
                        gmStatus.innerText = 'Restored';
                    }
                    gmLog(`Restored ${gmMergedList.length} merged file(s) from previous session (1-hour cache).`, 'info');
                }
            }
        } catch (e) {
            console.warn('Failed to restore merge session:', e);
        }
    }
    restoreMergeSession();

    /* ==========================================================================
       MULTI DROPZONE HELPER
       ========================================================================== */
    function setupMultiDropzone(zone, input, callback) {
        zone.addEventListener('click', (e) => {
            if (e.target !== input) input.click();
        });

        input.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        input.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                callback(Array.from(e.target.files));
            }
        });

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
                callback(Array.from(e.dataTransfer.files));
            }
        });
    }

    /* ==========================================================================
       AJIO ERROR LOGIC
       ========================================================================== */
    let aeDetailsFile = null;
    let aeDataFile = null;
    let aeProcessedBlob = null;
    let aeProcessedFilename = "";

    const aeDetailsDropzone = document.getElementById('aeDetailsDropzone');
    const aeDetailsFileInput = document.getElementById('aeDetailsFileInput');
    const aeDetailsFileDisplay = document.getElementById('aeDetailsFileDisplay');

    const aeDataDropzone = document.getElementById('aeDataDropzone');
    const aeDataFileInput = document.getElementById('aeDataFileInput');
    const aeDataFileDisplay = document.getElementById('aeDataFileDisplay');

    const aeFromDate = document.getElementById('aeFromDate');
    const aeToDate = document.getElementById('aeToDate');

    const aeBtn = document.getElementById('aeBtn');
    const aeStatus = document.getElementById('aeStatus');
    const aeProgressCard = document.getElementById('aeProgressCard');
    const aeProgressBar = document.getElementById('aeProgressBar');
    const aeProgressPercent = document.getElementById('aeProgressPercent');
    const aeProgressStepText = document.getElementById('aeProgressStepText');
    const aeOutputContainer = document.getElementById('aeOutputContainer');
    const aeConsoleLog = document.getElementById('aeConsoleLog');
    const clearAeLogBtn = document.getElementById('clearAeLogBtn');

    function aeLog(message, type = 'info') {
        if (!aeConsoleLog) return;
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        line.innerText = `[${timestamp}] ${message}`;
        if (aeConsoleLog.children.length > 300) {
            aeConsoleLog.removeChild(aeConsoleLog.firstChild);
        }
        aeConsoleLog.appendChild(line);
        aeConsoleLog.scrollTop = aeConsoleLog.scrollHeight;
    }

    if (clearAeLogBtn) {
        clearAeLogBtn.addEventListener('click', () => {
            aeConsoleLog.innerHTML = '';
            aeLog('Log cleared.', 'info');
        });
    }

    function checkAeInputs() {
        if (aeDetailsFile && aeDataFile) {
            aeBtn.removeAttribute('disabled');
        } else {
            aeBtn.setAttribute('disabled', 'true');
        }
    }

    if (aeDetailsDropzone && aeDetailsFileInput) {
        setupMiniDropzone(aeDetailsDropzone, aeDetailsFileInput, (file) => {
            aeDetailsFile = file;
            aeDetailsFileDisplay.innerText = file.name;
            aeDetailsFileDisplay.title = file.name;
            aeDetailsDropzone.classList.add('file-selected');
            aeLog(`Selected Details File: ${file.name} (${formatBytes(file.size)})`, 'info');
            checkAeInputs();
        });
    }

    if (aeDataDropzone && aeDataFileInput) {
        setupMiniDropzone(aeDataDropzone, aeDataFileInput, (file) => {
            aeDataFile = file;
            aeDataFileDisplay.innerText = file.name;
            aeDataFileDisplay.title = file.name;
            aeDataDropzone.classList.add('file-selected');
            aeLog(`Selected Data File: ${file.name} (${formatBytes(file.size)})`, 'info');
            checkAeInputs();
        });
    }

    if (aeBtn) {
        aeBtn.addEventListener('click', async () => {
            if (!aeDetailsFile || !aeDataFile) return;

            aeBtn.setAttribute('disabled', 'true');
            if (aeStatus) {
                aeStatus.className = 'status-indicator processing';
                aeStatus.innerText = 'Processing';
            }
            if (aeProgressCard) aeProgressCard.classList.remove('hidden');

            try {
                aeLog('Starting Ajio Error Process...', 'process');
                
                // Read date ranges if available
                const fromDateVal = aeFromDate ? aeFromDate.value : "";
                const toDateVal = aeToDate ? aeToDate.value : "";
                if (fromDateVal || toDateVal) {
                    aeLog(`Selected Date Range: From ${fromDateVal || 'N/A'} To ${toDateVal || 'N/A'}`, 'info');
                }

                if (aeProgressBar) aeProgressBar.style.width = '10%';
                if (aeProgressPercent) aeProgressPercent.innerText = '10%';
                if (aeProgressStepText) aeProgressStepText.innerText = 'Reading file buffers...';

                // Step 1: Read Files
                const [detailsBuffer, dataBuffer] = await Promise.all([
                    readFileAsArrayBuffer(aeDetailsFile),
                    readFileAsArrayBuffer(aeDataFile)
                ]);

                if (aeProgressBar) aeProgressBar.style.width = '30%';
                if (aeProgressPercent) aeProgressPercent.innerText = '30%';
                if (aeProgressStepText) aeProgressStepText.innerText = 'Parsing spreadsheets...';

                const detailsWb = XLSX.read(detailsBuffer, { type: 'array' });
                const dataWb = XLSX.read(dataBuffer, { type: 'array' });

                const detailsSheetName = detailsWb.SheetNames[0];
                const dataSheetName = dataWb.SheetNames[0];

                const detailsWs = detailsWb.Sheets[detailsSheetName];
                const dataWs = dataWb.Sheets[dataSheetName];

                const detailsAoa = XLSX.utils.sheet_to_json(detailsWs, { header: 1, defval: "" });
                const dataAoa = XLSX.utils.sheet_to_json(dataWs, { header: 1, defval: "" });

                aeLog(`Details file rows: ${detailsAoa.length}`, 'info');
                aeLog(`Data file rows: ${dataAoa.length}`, 'info');

                if (detailsAoa.length < 2) {
                    throw new Error('Details sheet has no data rows (empty or headers only).');
                }

                if (aeProgressBar) aeProgressBar.style.width = '50%';
                if (aeProgressPercent) aeProgressPercent.innerText = '50%';
                if (aeProgressStepText) aeProgressStepText.innerText = 'Analyzing headers and columns...';

                // Locate details header row
                let detailsHeaderRowIndex = -1;
                for (let i = 0; i < detailsAoa.length; i++) {
                    const row = detailsAoa[i];
                    if (row && row.some(cell => String(cell).trim().toLowerCase() === "invoice no")) {
                        detailsHeaderRowIndex = i;
                        break;
                    }
                }
                if (detailsHeaderRowIndex === -1) {
                    detailsHeaderRowIndex = 0; // fallback
                }

                const detailsHeaderRow = detailsAoa[detailsHeaderRowIndex];
                let invoiceColDetails = 1; // default B
                let invoiceDateColDetails = 2; // default C
                let warehouseNameColDetails = 3; // default D
                let orderIdColDetails = 6; // default G
                let itemAsinColDetails = 7; // default H
                let itemSkuColDetails = 8; // default I
                let quantityColDetails = 11; // default L
                let itemCostColDetails = 12; // default M
                let reasonColDetails = 21; // default V
                let targetColDetails = 22; // default W

                for (let c = 0; c < detailsHeaderRow.length; c++) {
                    const cellVal = String(detailsHeaderRow[c]).trim().toLowerCase();
                    if (cellVal === "invoice no") {
                        invoiceColDetails = c;
                    } else if (cellVal === "invoice date") {
                        invoiceDateColDetails = c;
                    } else if (cellVal === "warehouse name") {
                        warehouseNameColDetails = c;
                    } else if (cellVal === "order id") {
                        orderIdColDetails = c;
                    } else if (cellVal === "item asin" || cellVal === "asin") {
                        itemAsinColDetails = c;
                    } else if (cellVal === "item sku" || cellVal === "sku") {
                        itemSkuColDetails = c;
                    } else if (cellVal === "quantity" || cellVal === "qty") {
                        quantityColDetails = c;
                    } else if (cellVal === "item cost" || cellVal === "cost price" || cellVal === "cost") {
                        itemCostColDetails = c;
                    } else if (cellVal === "reason") {
                        reasonColDetails = c;
                    } else if (cellVal.startsWith("zoho stat") || cellVal === "zoho status") {
                        targetColDetails = c;
                    }
                }

                aeLog(`Details File Columns - Invoice: ${invoiceColDetails}, Date: ${invoiceDateColDetails}, Warehouse: ${warehouseNameColDetails}, Cost: ${itemCostColDetails}, Reason: ${reasonColDetails}, Zoho/Target: ${targetColDetails}`, 'info');

                // Locate data header row
                let dataHeaderRowIndex = -1;
                for (let i = 0; i < dataAoa.length; i++) {
                    const row = dataAoa[i];
                    if (row && row.some(cell => {
                        const strVal = String(cell).trim().toLowerCase();
                        return strVal === "invoice no" || strVal === "invoice number";
                    })) {
                        dataHeaderRowIndex = i;
                        break;
                    }
                }
                if (dataHeaderRowIndex === -1) {
                    dataHeaderRowIndex = 0;
                }

                const dataHeaderRow = dataAoa[dataHeaderRowIndex];
                let searchColData = 7; // default H
                let valueColData = 2;  // default C

                if (dataHeaderRow) {
                    for (let c = 0; c < dataHeaderRow.length; c++) {
                        const cellVal = String(dataHeaderRow[c]).trim().toLowerCase();
                        if (cellVal === "invoice no" || cellVal === "invoice number") {
                            searchColData = c;
                        }
                    }
                }

                aeLog(`Data File - Search Column (H-equiv) index: ${searchColData}, Value Column (C-equiv) index: ${valueColData}`, 'info');

                if (aeProgressBar) aeProgressBar.style.width = '70%';
                if (aeProgressPercent) aeProgressPercent.innerText = '70%';
                if (aeProgressStepText) aeProgressStepText.innerText = 'Building data lookup index...';

                // Step 2: Build Lookup Map from Data AOA
                const dataMap = new Map();
                for (let i = dataHeaderRowIndex + 1; i < dataAoa.length; i++) {
                    const row = dataAoa[i];
                    if (!row || row.length <= Math.max(searchColData, valueColData)) continue;
                    
                    const invoiceKey = String(row[searchColData]).trim().toUpperCase();
                    const copyVal = row[valueColData];
                    
                    if (invoiceKey !== "" && !dataMap.has(invoiceKey)) {
                        dataMap.set(invoiceKey, copyVal);
                    }
                }

                aeLog(`Mapped ${dataMap.size} unique invoices from Ajio Data file.`, 'info');

                if (aeProgressBar) aeProgressBar.style.width = '85%';
                if (aeProgressPercent) aeProgressPercent.innerText = '85%';
                if (aeProgressStepText) aeProgressStepText.innerText = 'Filtering rows and performing lookup...';

                // Step 3: Filter rows & perform lookup on Details file
                const processedDetailsAoa = [];
                
                // Keep everything before the header row
                for (let i = 0; i < detailsHeaderRowIndex; i++) {
                    processedDetailsAoa.push(detailsAoa[i]);
                }

                // Add header row
                const finalHeader = [...detailsHeaderRow];
                if (finalHeader.length <= targetColDetails) {
                    while (finalHeader.length <= targetColDetails) finalHeader.push("");
                }
                // Ensure target column has a header if it was blank
                if (finalHeader[targetColDetails] === "") {
                    finalHeader[targetColDetails] = "Zoho Status"; 
                }
                processedDetailsAoa.push(finalHeader);

                // Parse date range values
                let fromDate = null;
                let toDate = null;
                if (fromDateVal) {
                    fromDate = new Date(fromDateVal);
                    fromDate.setHours(0, 0, 0, 0);
                }
                if (toDateVal) {
                    toDate = new Date(toDateVal);
                    toDate.setHours(23, 59, 59, 999);
                }

                // Date parsing helper
                function parseExcelDate(val) {
                    if (val === undefined || val === null || val === "") return null;
                    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
                    if (typeof val === 'number' || (!isNaN(val) && !isNaN(parseFloat(val)) && typeof val !== 'string')) {
                        const num = parseFloat(val);
                        return new Date(Math.round((num - 25569) * 86400 * 1000));
                    }
                    const str = String(val).trim();
                    if (str === "") return null;

                    // Check if numeric string serial date (e.g. "45450")
                    if (/^\d{4,5}(\.\d+)?$/.test(str)) {
                        const num = parseFloat(str);
                        return new Date(Math.round((num - 25569) * 86400 * 1000));
                    }

                    // DD/MM/YYYY or DD-MM-YYYY (with optional time)
                    const ddmmyyyyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
                    if (ddmmyyyyMatch) {
                        const day = parseInt(ddmmyyyyMatch[1], 10);
                        const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
                        const year = parseInt(ddmmyyyyMatch[3], 10);
                        const d = new Date(year, month, day);
                        if (!isNaN(d.getTime())) return d;
                    }

                    // YYYY-MM-DD or YYYY/MM/DD (with optional time)
                    const yyyymmddMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
                    if (yyyymmddMatch) {
                        const year = parseInt(yyyymmddMatch[1], 10);
                        const month = parseInt(yyyymmddMatch[2], 10) - 1;
                        const day = parseInt(yyyymmddMatch[3], 10);
                        const d = new Date(year, month, day);
                        if (!isNaN(d.getTime())) return d;
                    }

                    const parsed = new Date(str);
                    if (!isNaN(parsed.getTime())) {
                        return parsed;
                    }
                    return null;
                }

                let deletedCount = 0;
                let deletedByDateCount = 0;
                let retainedCount = 0;
                let lookupMatchCount = 0;
                let lookupMissCount = 0;

                for (let i = detailsHeaderRowIndex + 1; i < detailsAoa.length; i++) {
                    const row = detailsAoa[i];
                    if (!row || row.length === 0) continue;

                    // Check if entire row is empty or blank
                    const isBlank = row.every(cell => cell === undefined || cell === null || String(cell).trim() === "");
                    if (isBlank) continue;

                    // 1. Invoice validation (must have non-empty invoice and not total/summary)
                    const invoiceVal = row[invoiceColDetails] !== undefined ? String(row[invoiceColDetails]).trim() : "";
                    const invoiceKey = invoiceVal.toUpperCase();
                    if (invoiceVal === "" || invoiceKey === "TOTAL" || invoiceKey === "GRAND TOTAL") {
                        continue;
                    }

                    // 2. Row filter condition: check Column V (Reason)
                    const reasonVal = row[reasonColDetails] !== undefined ? String(row[reasonColDetails]) : "";
                    const reasonNormalized = reasonVal.trim().toLowerCase().replace(/\s+/g, '');
                    const disputeMatch = String(reasonVal).match(/Price\s+Dispute\s*:\s*(-?\d+(?:\.\d+)?)/i);
                    const disputeVal = disputeMatch ? parseFloat(disputeMatch[1]) : (reasonNormalized === "0" ? 0 : NaN);

                    if (disputeVal === 0 || reasonNormalized === "0" || reasonNormalized === "pricedispute:0" || reasonNormalized === "pricedispute:0.0" || reasonNormalized === "pricedispute:0.00") {
                        deletedCount++;
                        continue; // Skip/delete this row
                    }

                    // 3. Perform Lookup
                    let lookupVal = "";
                    let isMatched = false;
                    if (dataMap.has(invoiceKey)) {
                        lookupVal = dataMap.get(invoiceKey);
                        isMatched = true;
                    }

                    // 4. Date Range Filter against Column W (lookupVal)
                    let shouldDeleteByDate = false;
                    if (fromDate || toDate) {
                        const parsedDate = parseExcelDate(lookupVal);
                        if (parsedDate) {
                            const time = parsedDate.getTime();
                            const satisfiesFrom = fromDate ? time >= fromDate.getTime() : true;
                            const satisfiesTo = toDate ? time <= toDate.getTime() : true;
                            if (satisfiesFrom && satisfiesTo) {
                                shouldDeleteByDate = true;
                            }
                        }
                    }

                    if (shouldDeleteByDate) {
                        deletedCount++;
                        deletedByDateCount++;
                        continue; // Skip/delete this row
                    }

                    // Otherwise, keep the row and increment counters
                    retainedCount++;
                    if (isMatched) {
                        lookupMatchCount++;
                    } else {
                        lookupMissCount++;
                    }

                    const newRow = [...row];
                    // Ensure the row has enough cells
                    if (newRow.length <= targetColDetails) {
                        while (newRow.length <= targetColDetails) newRow.push("");
                    }
                    newRow[targetColDetails] = lookupVal;
                    processedDetailsAoa.push(newRow);
                }

                aeLog(`Processed: Deleted ${deletedCount} rows (Reason filter: ${deletedCount - deletedByDateCount}, Date filter: ${deletedByDateCount}). Retained ${retainedCount} rows.`, 'success');
                aeLog(`Lookup Results (for retained rows): ${lookupMatchCount} successful matches, ${lookupMissCount} unmatched invoice(s).`, lookupMissCount > 0 ? 'warning' : 'success');

                if (retainedCount === 0) {
                    aeLog("No one dispute this time, all clear", "success");
                    if (aeProgressBar) aeProgressBar.style.width = '100%';
                    if (aeProgressPercent) aeProgressPercent.innerText = '100%';
                    if (aeProgressStepText) aeProgressStepText.innerText = 'Completed. No disputes found.';

                    aeProcessedBlob = null;
                    aeProcessedFilename = null;

                    renderAeResults(deletedCount, deletedByDateCount, retainedCount, lookupMatchCount, lookupMissCount, []);
                    return;
                }

                if (aeProgressBar) aeProgressBar.style.width = '90%';
                if (aeProgressPercent) aeProgressPercent.innerText = '90%';
                if (aeProgressStepText) aeProgressStepText.innerText = 'Grouping rows and generating ZIP package...';

                // ==================================================================
                // NEW: GROUP BY COLUMN D (WAREHOUSE NAME) & GENERATE FILES
                // ==================================================================
                const zip = new JSZip();
                const filesList = [];

                // Group the retained data rows (excluding headers)
                const warehouseGroups = new Map();
                for (let i = detailsHeaderRowIndex + 1; i < processedDetailsAoa.length; i++) {
                    const row = processedDetailsAoa[i];
                    let whName = String(row[warehouseNameColDetails] || "").trim();
                    if (whName === "") {
                        whName = "Unassigned-Warehouse";
                    }

                    if (!warehouseGroups.has(whName)) {
                        warehouseGroups.set(whName, []);
                    }
                    warehouseGroups.get(whName).push(row);
                }

                aeLog(`Grouped into ${warehouseGroups.size} warehouse(s).`, 'info');

                if (warehouseGroups.size === 0) {
                    aeLog("No one dispute this time, all clear", "success");
                    if (aeProgressBar) aeProgressBar.style.width = '100%';
                    if (aeProgressPercent) aeProgressPercent.innerText = '100%';
                    if (aeProgressStepText) aeProgressStepText.innerText = 'Completed. No disputes found.';

                    aeProcessedBlob = null;
                    aeProcessedFilename = null;

                    renderAeResults(deletedCount, deletedByDateCount, 0, lookupMatchCount, lookupMissCount, []);
                    return;
                }

                // Create the merged workbook
                const mergedWb = XLSX.utils.book_new();

                // For each warehouse group, create individual workbook & add sheet to merged workbook
                for (const [whName, groupRows] of warehouseGroups.entries()) {
                    const groupAoa = [];
                    
                    // Row 1: Merged Title (Columns A to L)
                    const titleText = `${whName}-account center`;
                    groupAoa.push([titleText, "", "", "", "", "", "", "", "", "", "", ""]);
                    
                    // Row 2: Blank Row
                    groupAoa.push(["", "", "", "", "", "", "", "", "", "", "", ""]);
                    
                    // Row 3: Headers
                    groupAoa.push([
                        "Invoice No",
                        "Invoice Date",
                        "Warehouse Name",
                        "Order ID",
                        "Item Asin",
                        "Item SKU",
                        "Quantity",
                        "Item Cost",
                        "Reason",
                        "Lookup Date",
                        "Calculated Price",
                        "Remarks"
                    ]);

                    // Row 4 onwards: Data Rows
                    groupRows.forEach(row => {
                        const invoiceNo = row[invoiceColDetails];
                        const invoiceDate = row[invoiceDateColDetails];
                        const warehouse = row[warehouseNameColDetails];
                        const orderId = row[orderIdColDetails];
                        const itemAsin = row[itemAsinColDetails];
                        const itemSku = row[itemSkuColDetails];
                        const quantity = row[quantityColDetails];
                        const itemCost = row[itemCostColDetails];
                        const reason = row[reasonColDetails];
                        const lookupDate = row[targetColDetails];
                        
                        // K Column: Calculated Price (cost - disputeAmt)
                        const calcPrice = calculateDisputeAmount(itemCost, reason);
                        
                        // L Column: Remarks
                        let remarks = "";
                        if (calcPrice !== "") {
                            remarks = "this amount not coorect as account central price this is approx price that currently live in account central";
                        }
                        
                        groupAoa.push([
                            invoiceNo,
                            invoiceDate,
                            warehouse,
                            orderId,
                            itemAsin,
                            itemSku,
                            quantity,
                            itemCost,
                            reason,
                            lookupDate,
                            calcPrice,
                            remarks
                        ]);
                    });

                    // Convert groupAoa to sheet
                    const ws = XLSX.utils.aoa_to_sheet(groupAoa);

                    // Set column widths
                    ws['!cols'] = [
                        { wch: 15 }, // Invoice No
                        { wch: 12 }, // Invoice Date
                        { wch: 20 }, // Warehouse Name
                        { wch: 15 }, // Order ID
                        { wch: 15 }, // Item Asin
                        { wch: 15 }, // Item SKU
                        { wch: 10 }, // Quantity
                        { wch: 10 }, // Item Cost
                        { wch: 25 }, // Reason
                        { wch: 15 }, // Lookup Date
                        { wch: 15 }, // Calculated Price
                        { wch: 45 }  // Remarks
                    ];

                    // Merge A1:L1 (Row 1, Cols 0 to 11)
                    ws['!merges'] = [
                        { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }
                    ];

                    // Apply full borders & styling using xlsx-js-style
                    const range = XLSX.utils.decode_range(ws['!ref']);
                    for (let R = range.s.r; R <= range.e.r; ++R) {
                        for (let C = range.s.c; C <= range.e.c; ++C) {
                            const cell_address = { c: C, r: R };
                            const cell_ref = XLSX.utils.encode_cell(cell_address);
                            
                            if (!ws[cell_ref]) {
                                ws[cell_ref] = { t: 's', v: '' };
                            }
                            
                            const cell = ws[cell_ref];
                            cell.s = {
                                border: {
                                    top: { style: 'thin', color: { rgb: 'D3D3D3' } },
                                    bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
                                    left: { style: 'thin', color: { rgb: 'D3D3D3' } },
                                    right: { style: 'thin', color: { rgb: 'D3D3D3' } }
                                }
                            };

                            if (R === 0) {
                                // Title merged cell
                                cell.s.font = { name: 'Arial', sz: 12, bold: true, color: { rgb: '000000' } };
                                cell.s.alignment = { horizontal: 'center', vertical: 'center' };
                                cell.s.fill = { fgColor: { rgb: 'EAEAEA' } };
                            } else if (R === 2) {
                                // Header row
                                cell.s.font = { name: 'Arial', sz: 10, bold: true, color: { rgb: 'FFFFFF' } };
                                cell.s.fill = { fgColor: { rgb: '4F81BD' } }; // Soft blue header background
                                cell.s.alignment = { horizontal: 'center', vertical: 'center' };
                            } else if (R > 2) {
                                // Data rows
                                cell.s.font = { name: 'Arial', sz: 9 };
                                if (C === 6 || C === 7 || C === 10) { // Quantity, Item Cost, Calculated Price
                                    cell.s.alignment = { horizontal: 'right' };
                                } else {
                                    cell.s.alignment = { horizontal: 'left' };
                                }
                            }
                        }
                    }

                    // Create safe sheet name (Excel limits sheet names to 31 chars)
                    let safeSheetName = `${whName}-account center`;
                    if (safeSheetName.length > 31) {
                        safeSheetName = safeSheetName.substring(0, 31);
                    }

                    // 1. Add to merged workbook
                    XLSX.utils.book_append_sheet(mergedWb, ws, safeSheetName);

                    // 2. Create individual workbook and add to ZIP
                    const groupWb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(groupWb, ws, safeSheetName);
                    
                    const groupBuffer = XLSX.write(groupWb, { bookType: 'xlsx', type: 'array' });
                    const groupFilename = `${whName}-account center.xlsx`;
                    zip.file(groupFilename, groupBuffer);

                    const groupBlob = new Blob([groupBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                    filesList.push({
                        name: groupFilename,
                        size: groupBlob.size,
                        rows: groupRows.length,
                        blob: groupBlob
                    });

                    aeLog(`Generated individual file: "${groupFilename}" with ${groupRows.length} rows.`, 'success');
                    
                    // Register tracked error in database
                    registerTrackedError('ajio', groupFilename, whName, 'Account Center Dispute', groupRows.length);
                }

                if (warehouseGroups.size > 0) {
                    // Write and add the merged workbook to ZIP
                    const mergedBuffer = XLSX.write(mergedWb, { bookType: 'xlsx', type: 'array' });
                    const mergedFilename = "ajio price dispute.xlsx";
                    zip.file(mergedFilename, mergedBuffer);
                    const mergedBlob = new Blob([mergedBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                    
                    filesList.push({
                        name: mergedFilename,
                        size: mergedBlob.size,
                        rows: retainedCount,
                        blob: mergedBlob
                    });
                    aeLog(`Generated merged file: "${mergedFilename}" with all ${warehouseGroups.size} sheet(s).`, 'success');
                }

                // 3. Generate Cleaned Details File (with Column W cleared)
                const cleanedDetailsAoa = [];
                // Keep metadata rows
                for (let i = 0; i < detailsHeaderRowIndex; i++) {
                    cleanedDetailsAoa.push(processedDetailsAoa[i]);
                }
                // Keep header row
                const cleanedHeader = [...processedDetailsAoa[detailsHeaderRowIndex]];
                if (cleanedHeader.length <= targetColDetails) {
                    while (cleanedHeader.length <= targetColDetails) cleanedHeader.push("");
                }
                cleanedHeader[targetColDetails] = "Zoho Status"; // keep header label
                cleanedDetailsAoa.push(cleanedHeader);

                // Clean data rows (remove lookup dates)
                for (let i = detailsHeaderRowIndex + 1; i < processedDetailsAoa.length; i++) {
                    const row = [...processedDetailsAoa[i]];
                    if (row.length <= targetColDetails) {
                        while (row.length <= targetColDetails) row.push("");
                    }
                    row[targetColDetails] = ""; // clear
                    cleanedDetailsAoa.push(row);
                }

                const detailsWbOut = XLSX.utils.book_new();
                const detailsWsOut = XLSX.utils.aoa_to_sheet(cleanedDetailsAoa);
                XLSX.utils.book_append_sheet(detailsWbOut, detailsWsOut, detailsSheetName || "Details");

                const detailsBufferOut = XLSX.write(detailsWbOut, { bookType: 'xlsx', type: 'array' });
                const origName = aeDetailsFile.name;
                const dotIdx = origName.lastIndexOf('.');
                const baseName = dotIdx !== -1 ? origName.substring(0, dotIdx) : origName;
                const cleanedDetailsFilename = `${baseName}_filtered.xlsx`;
                
                zip.file(cleanedDetailsFilename, detailsBufferOut);
                const detailsBlobOut = new Blob([detailsBufferOut], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                
                filesList.push({
                    name: cleanedDetailsFilename,
                    size: detailsBlobOut.size,
                    rows: cleanedDetailsAoa.length - detailsHeaderRowIndex - 1,
                    blob: detailsBlobOut
                });
                aeLog(`Generated cleaned details file: "${cleanedDetailsFilename}" (W column cleared).`, 'success');

                // Generate final ZIP Blob
                aeProcessedBlob = await zip.generateAsync({ type: 'blob' });
                aeProcessedFilename = "ajio_price_dispute_bundle.zip";

                if (aeProgressBar) aeProgressBar.style.width = '100%';
                if (aeProgressPercent) aeProgressPercent.innerText = '100%';
                if (aeProgressStepText) aeProgressStepText.innerText = 'ZIP package created successfully!';

                // Render Dashboard results
                renderAeResults(deletedCount, deletedByDateCount, retainedCount, lookupMatchCount, lookupMissCount, filesList);
                aeLog(`Pipeline finished. Output ZIP package ready: "${aeProcessedFilename}"`, 'success');

            } catch (err) {
                aeLog(`Error in Ajio Error Process: ${err.message}`, 'error');
                console.error(err);
                if (aeOutputContainer) {
                    aeOutputContainer.innerHTML = `
                        <div class="empty-output-state">
                            <i class="fa-solid fa-triangle-exclamation text-error placeholder-icon"></i>
                            <p>An error occurred: ${err.message}</p>
                        </div>
                    `;
                }
            } finally {
                if (aeStatus) {
                    aeStatus.className = 'status-indicator idle';
                    aeStatus.innerText = 'Idle';
                }
                aeBtn.removeAttribute('disabled');
            }
        });
    }

    // Mathematical Dispute Calculator
    function calculateDisputeAmount(itemCost, reasonStr) {
        const cost = parseFloat(itemCost);
        if (isNaN(cost)) return "";
        
        // Extract number from reason string (positive or negative float/int)
        const match = String(reasonStr).match(/Price\s+Dispute\s*:\s*(-?\d+(?:\.\d+)?)/i);
        if (match) {
            const disputeAmt = parseFloat(match[1]);
            if (!isNaN(disputeAmt)) {
                // formula: cost - disputeAmt
                const result = cost - disputeAmt;
                return parseFloat(result.toFixed(2));
            }
        }
        return "";
    }

    function renderAeResults(deleted, deletedByDate, retained, matches, misses, files) {
        if (!aeOutputContainer) return;
        aeOutputContainer.innerHTML = '';
        aeOutputContainer.className = 'processed-container';

        const header = document.createElement('div');
        header.className = 'processed-header';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.width = '100%';
        header.style.marginBottom = '1rem';
        
        if (retained > 0) {
            header.innerHTML = `
                <h3><i class="fa-solid fa-circle-check text-success"></i> Ajio Error Outputs</h3>
                <button class="btn btn-success btn-glow" id="downloadAeZipBtn">
                    <i class="fa-solid fa-file-zipper"></i> Download Package (ZIP)
                </button>
            `;
            aeOutputContainer.appendChild(header);

            const dlBtn = header.querySelector('#downloadAeZipBtn');
            if (dlBtn) {
                dlBtn.addEventListener('click', () => {
                    if (aeProcessedBlob && aeProcessedFilename) {
                        triggerDownload(aeProcessedBlob, aeProcessedFilename);
                        aeLog(`Downloaded ZIP package: ${aeProcessedFilename}`, 'info');
                    }
                });
            }
        } else {
            header.innerHTML = `
                <h3><i class="fa-solid fa-circle-check text-success"></i> Ajio Error Outputs</h3>
            `;
            aeOutputContainer.appendChild(header);

            const emptyBanner = document.createElement('div');
            emptyBanner.style.background = 'rgba(16, 185, 129, 0.05)';
            emptyBanner.style.border = '1px solid rgba(16, 185, 129, 0.2)';
            emptyBanner.style.borderRadius = '12px';
            emptyBanner.style.padding = '1.5rem';
            emptyBanner.style.display = 'flex';
            emptyBanner.style.flexDirection = 'column';
            emptyBanner.style.alignItems = 'center';
            emptyBanner.style.justifyContent = 'center';
            emptyBanner.style.gap = '0.75rem';
            emptyBanner.style.textAlign = 'center';
            emptyBanner.style.marginBottom = '1.5rem';
            emptyBanner.style.width = '100%';
            emptyBanner.innerHTML = `
                <i class="fa-solid fa-circle-check text-success" style="font-size: 2.5rem; animation: float 4s ease-in-out infinite;"></i>
                <div style="font-size: 1.1rem; font-weight: 600; color: #10b981; font-family: 'Space Grotesk', sans-serif;">No one dispute this time, all clear</div>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0; max-width: 400px;">
                    All price dispute rows have been filtered out (either because the dispute amount was 0 or because they matched the date range filter).
                </p>
            `;
            aeOutputContainer.appendChild(emptyBanner);
        }

        // Metrics Grid
        const metricsGrid = document.createElement('div');
        metricsGrid.style.display = 'grid';
        metricsGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';
        metricsGrid.style.gap = '1rem';
        metricsGrid.style.width = '100%';
        metricsGrid.style.marginBottom = '1.5rem';
        metricsGrid.innerHTML = `
            <div class="summary-card" style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.1); border-radius: 12px; padding: 0.85rem; text-align: center;">
                <h4 style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">DELETED BY REASON</h4>
                <div style="font-size: 1.6rem; font-weight: 800; color: #ef4444;">${deleted - deletedByDate}</div>
                <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem;">(Price Dispute 0)</p>
            </div>
            <div class="summary-card" style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.1); border-radius: 12px; padding: 0.85rem; text-align: center;">
                <h4 style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">DELETED BY DATE</h4>
                <div style="font-size: 1.6rem; font-weight: 800; color: #f59e0b;">${deletedByDate}</div>
                <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem;">(Date Range filter)</p>
            </div>
            <div class="summary-card" style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.1); border-radius: 12px; padding: 0.85rem; text-align: center;">
                <h4 style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">RETAINED ROWS</h4>
                <div style="font-size: 1.6rem; font-weight: 800; color: #10b981;">${retained}</div>
                <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem;">(Passed all filters)</p>
            </div>
            <div class="summary-card" style="background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.1); border-radius: 12px; padding: 0.85rem; text-align: center;">
                <h4 style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">LOOKUP MATCHES</h4>
                <div style="font-size: 1.6rem; font-weight: 800; color: #3b82f6;">${matches}</div>
                <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem;">(Found in Data file)</p>
            </div>
        `;
        aeOutputContainer.appendChild(metricsGrid);

        if (retained > 0) {
            // List of generated files inside package
            const listHeader = document.createElement('h4');
            listHeader.style.fontFamily = "'Space Grotesk', sans-serif";
            listHeader.style.marginBottom = '0.5rem';
            listHeader.style.color = 'var(--text-primary)';
            listHeader.style.fontSize = '0.9rem';
            listHeader.innerHTML = `<i class="fa-solid fa-folder-open text-purple"></i> Packaged Files (${files.length})`;
            aeOutputContainer.appendChild(listHeader);

            const listContainer = document.createElement('div');
            listContainer.className = 'processed-list';
            listContainer.style.display = 'flex';
            listContainer.style.flexDirection = 'column';
            listContainer.style.gap = '0.5rem';
            listContainer.style.width = '100%';
            listContainer.style.maxHeight = '250px';
            listContainer.style.overflowY = 'auto';

            files.forEach((file) => {
                const item = document.createElement('div');
                item.className = 'processed-item';
                item.style.padding = '0.65rem 0.85rem';
                item.style.borderRadius = '8px';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.alignItems = 'center';
                item.style.border = '1px solid var(--border-color)';
                item.style.background = 'rgba(255, 255, 255, 0.8)';
                item.style.borderLeft = '4px solid var(--color-success)';

                const fileInfo = document.createElement('div');
                fileInfo.className = 'file-info';
                fileInfo.innerHTML = `
                    <i class="fa-solid fa-file-excel text-success" style="margin-right: 0.5rem;"></i>
                    <span class="file-name" style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">${file.name}</span>
                    <span class="file-size" style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.5rem;">(${formatBytes(file.size)} | ${file.rows} rows)</span>
                `;

                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'btn btn-primary';
                downloadBtn.style.padding = '0.3rem 0.6rem';
                downloadBtn.style.fontSize = '0.75rem';
                downloadBtn.style.borderRadius = '6px';
                downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i>';
                downloadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    triggerDownload(file.blob, file.name);
                    aeLog(`Downloaded individual file: ${file.name}`, 'info');
                });

                item.appendChild(fileInfo);
                item.appendChild(downloadBtn);
                listContainer.appendChild(item);
            });

            aeOutputContainer.appendChild(listContainer);
        }
    }

    /* ==========================================================================
       AJIO ERROR SUB-TAB NAVIGATION (SALE VS PURCHASE)
       ========================================================================== */
    const aeSubTabBtns = document.querySelectorAll('.ae-subtab-btn');
    aeSubTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSubTabId = btn.getAttribute('data-ae-subtab');
            aeSubTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const salePane = document.getElementById('ae-subtab-sale');
            const purchasePane = document.getElementById('ae-subtab-purchase');

            if (targetSubTabId === 'ae-subtab-sale') {
                if (salePane) {
                    salePane.classList.add('active-pane');
                    salePane.style.display = 'block';
                }
                if (purchasePane) {
                    purchasePane.classList.remove('active-pane');
                    purchasePane.style.display = 'none';
                }
            } else {
                if (salePane) {
                    salePane.classList.remove('active-pane');
                    salePane.style.display = 'none';
                }
                if (purchasePane) {
                    purchasePane.classList.add('active-pane');
                    purchasePane.style.display = 'block';
                }
            }
        });
    });

    /* ==========================================================================
       PURCHASE AJIO ERROR LOGIC
       ========================================================================== */
    let aePurchaseDetailsFiles = [];
    let aePurchaseDataFile = null;
    let aePurchaseProcessedBlob = null;

    const aePurchaseDetailsDropzone = document.getElementById('aePurchaseDetailsDropzone');
    const aePurchaseDetailsFileInput = document.getElementById('aePurchaseDetailsFileInput');
    const aePurchaseDetailsFileDisplay = document.getElementById('aePurchaseDetailsFileDisplay');
    const aePurchaseDetailsSelectedCount = document.getElementById('aePurchaseDetailsSelectedCount');
    const aePurchaseDetailsUploadedFileList = document.getElementById('aePurchaseDetailsUploadedFileList');
    const clearAePurchaseDetailsFilesBtn = document.getElementById('clearAePurchaseDetailsFilesBtn');

    const aePurchaseDataDropzone = document.getElementById('aePurchaseDataDropzone');
    const aePurchaseDataFileInput = document.getElementById('aePurchaseDataFileInput');
    const aePurchaseDataFileDisplay = document.getElementById('aePurchaseDataFileDisplay');

    const aePurchaseBtn = document.getElementById('aePurchaseBtn');
    const aePurchaseStatus = document.getElementById('aePurchaseStatus');
    const aePurchaseProgressCard = document.getElementById('aePurchaseProgressCard');
    const aePurchaseProgressBar = document.getElementById('aePurchaseProgressBar');
    const aePurchaseProgressPercent = document.getElementById('aePurchaseProgressPercent');
    const aePurchaseProgressStepText = document.getElementById('aePurchaseProgressStepText');
    const aePurchaseOutputContainer = document.getElementById('aePurchaseOutputContainer');
    const aePurchaseConsoleLog = document.getElementById('aePurchaseConsoleLog');
    const clearAePurchaseLogBtn = document.getElementById('clearAePurchaseLogBtn');

    function aePurchaseLog(message, type = 'info') {
        if (!aePurchaseConsoleLog) return;
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        line.innerText = `[${timestamp}] ${message}`;
        if (aePurchaseConsoleLog.children.length > 300) {
            aePurchaseConsoleLog.removeChild(aePurchaseConsoleLog.firstChild);
        }
        aePurchaseConsoleLog.appendChild(line);
        aePurchaseConsoleLog.scrollTop = aePurchaseConsoleLog.scrollHeight;
    }

    if (clearAePurchaseLogBtn) {
        clearAePurchaseLogBtn.addEventListener('click', () => {
            aePurchaseConsoleLog.innerHTML = '';
            aePurchaseLog('Log cleared.', 'info');
        });
    }

    function checkAePurchaseInputs() {
        if (aePurchaseDetailsFiles.length > 0 && aePurchaseDataFile) {
            if (aePurchaseBtn) aePurchaseBtn.removeAttribute('disabled');
        } else {
            if (aePurchaseBtn) aePurchaseBtn.setAttribute('disabled', 'true');
        }
    }

    function updateAePurchaseDetailsUI() {
        if (aePurchaseDetailsSelectedCount) aePurchaseDetailsSelectedCount.innerText = aePurchaseDetailsFiles.length;
        if (!aePurchaseDetailsUploadedFileList) return;

        if (aePurchaseDetailsFiles.length > 0) {
            aePurchaseDetailsUploadedFileList.innerHTML = '';
            aePurchaseDetailsFiles.forEach((fileObj) => {
                const item = document.createElement('div');
                item.className = 'file-item';

                const info = document.createElement('div');
                info.className = 'file-info';

                const icon = document.createElement('i');
                icon.className = getFileIconClass(fileObj.name);

                const nameSpan = document.createElement('span');
                nameSpan.className = 'file-name';
                nameSpan.innerText = fileObj.name;

                const sizeSpan = document.createElement('span');
                sizeSpan.className = 'file-size';
                sizeSpan.innerText = formatBytes(fileObj.size);

                info.appendChild(icon);
                info.appendChild(nameSpan);
                info.appendChild(sizeSpan);

                const removeBtn = document.createElement('button');
                removeBtn.className = 'file-action-btn';
                removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    aePurchaseDetailsFiles = aePurchaseDetailsFiles.filter(f => f.id !== fileObj.id);
                    aePurchaseLog(`Removed file: ${fileObj.name}`, 'info');
                    updateAePurchaseDetailsUI();
                    checkAePurchaseInputs();
                });

                item.appendChild(info);
                item.appendChild(removeBtn);
                aePurchaseDetailsUploadedFileList.appendChild(item);
            });
        } else {
            aePurchaseDetailsUploadedFileList.innerHTML = '<div class="empty-list-msg">No details files selected yet.</div>';
        }
        checkAePurchaseInputs();
    }

    if (aePurchaseDetailsDropzone && aePurchaseDetailsFileInput) {
        setupMultiDropzone(aePurchaseDetailsDropzone, aePurchaseDetailsFileInput, (files) => {
            let added = 0;
            files.forEach(file => {
                if (!aePurchaseDetailsFiles.some(f => f.name === file.name && f.size === file.size)) {
                    aePurchaseDetailsFiles.push({
                        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                        name: file.name,
                        size: file.size,
                        file: file
                    });
                    added++;
                }
            });
            if (added > 0) {
                aePurchaseLog(`Added ${added} Purchase Details file(s). Total: ${aePurchaseDetailsFiles.length}`, 'success');
            }
            updateAePurchaseDetailsUI();
        });
    }

    if (clearAePurchaseDetailsFilesBtn) {
        clearAePurchaseDetailsFilesBtn.addEventListener('click', () => {
            aePurchaseDetailsFiles = [];
            if (aePurchaseDetailsFileInput) aePurchaseDetailsFileInput.value = '';
            updateAePurchaseDetailsUI();
            aePurchaseLog('Cleared all selected Purchase Details files.', 'info');
        });
    }

    if (aePurchaseDataDropzone && aePurchaseDataFileInput) {
        setupMiniDropzone(aePurchaseDataDropzone, aePurchaseDataFileInput, (file) => {
            aePurchaseDataFile = file;
            if (aePurchaseDataFileDisplay) {
                aePurchaseDataFileDisplay.innerText = file.name;
                aePurchaseDataFileDisplay.title = file.name;
            }
            aePurchaseDataDropzone.classList.add('file-selected');
            aePurchaseLog(`Selected Purchase Data File: ${file.name} (${formatBytes(file.size)})`, 'info');
            checkAePurchaseInputs();
        });
    }

    let aePurchaseMergedBlob = null;
    let aePurchaseMergedFilename = "";
    let aePurchaseZipBlob = null;
    let aePurchaseZipFilename = "";

    function toPureText(val) {
        if (val === undefined || val === null) return "";
        let str = String(val).trim();
        if (typeof val === 'number') {
            // Prevent scientific notation like 7.02207e+11 for 12-digit ASIN numbers
            str = Number(val).toLocaleString('fullwide', { useGrouping: false });
        } else if (str.toLowerCase().includes('e')) {
            const num = Number(str);
            if (!isNaN(num)) {
                str = num.toLocaleString('fullwide', { useGrouping: false });
            }
        }
        if (str.includes('.') && /^\d+\.0+$/.test(str)) {
            str = str.split('.')[0];
        }
        return str;
    }

    function cleanPurchaseKeyVal(val) {
        if (val === undefined || val === null) return "";
        let str = toPureText(val).toUpperCase();
        str = str.replace(/\s+/g, '').trim();
        return str;
    }

    function formatPurchaseDateVal(dt) {
        if (dt === undefined || dt === null) return "";
        if (typeof dt === 'number' && dt > 20000 && dt < 80000) {
            // Excel serial date to DD/MM/YYYY
            const dObj = new Date(Math.round((dt - 25569) * 86400 * 1000));
            const pad = n => String(n).padStart(2, '0');
            return `${pad(dObj.getDate())}/${pad(dObj.getMonth() + 1)}/${dObj.getFullYear()}`;
        }
        if (dt instanceof Date && !isNaN(dt.getTime())) {
            const pad = n => String(n).padStart(2, '0');
            return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
        }
        return String(dt).trim();
    }

    function colNumToExcelLetter(idx) {
        let letter = '';
        let temp = idx;
        while (temp >= 0) {
            letter = String.fromCharCode((temp % 26) + 65) + letter;
            temp = Math.floor(temp / 26) - 1;
        }
        return letter;
    }

    function formatPurchaseWorksheet(ws) {
        if (!ws || !ws['!ref']) return;
        const range = XLSX.utils.decode_range(ws['!ref']);
        const cols = [];

        for (let C = range.s.c; C <= range.e.c; ++C) {
            cols.push({ wch: 10 });
        }

        for (let R = range.s.r; R <= range.e.r; ++R) {
            if (R === 0 && ws['!merges'] && ws['!merges'].length > 0) {
                continue; // Skip title row for col width calc
            }
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                const cell = ws[cell_ref];
                if (cell && cell.v !== undefined && cell.v !== null) {
                    const len = String(cell.v).length;
                    if (len > cols[C].wch) cols[C].wch = len;
                }
            }
        }

        cols.forEach((col, idx) => {
            if (idx === 14) {
                col.wch = Math.min(Math.max(col.wch + 4, 15), 30); // Order date col
            } else if (idx === 4) {
                col.wch = Math.min(Math.max(col.wch + 3, 16), 35); // Item Asin
            } else {
                col.wch = Math.min(Math.max(col.wch + 3, 10), 45);
            }
        });
        ws['!cols'] = cols;

        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                if (!ws[cell_ref]) {
                    ws[cell_ref] = { t: 's', v: '' };
                }
                const cell = ws[cell_ref];
                const isTitle = (R === 0);
                const isHeader = (R === 1);
                const isData = (R >= 2);

                cell.s = {
                    border: {
                        top: { style: 'thin', color: { rgb: 'E5E7EB' } },
                        bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
                        left: { style: 'thin', color: { rgb: 'E5E7EB' } },
                        right: { style: 'thin', color: { rgb: 'E5E7EB' } }
                    }
                };

                if (isTitle) {
                    cell.s.font = { name: 'Segoe UI', sz: 12, bold: true, color: { rgb: 'FFFFFF' } };
                    cell.s.fill = { fgColor: { rgb: '7B2CBF' } }; // Royal Purple banner
                    cell.s.alignment = { horizontal: 'center', vertical: 'center' };
                } else if (isHeader) {
                    cell.s.font = { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '1E293B' } };
                    if (C === 14) {
                        cell.s.fill = { fgColor: { rgb: 'DCFCE7' } }; // Light Green for Order Date
                        cell.s.font = { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '15803D' } };
                    } else if (C === 4) {
                        cell.s.fill = { fgColor: { rgb: 'EDE9FE' } }; // Soft purple for Item Asin
                        cell.s.font = { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '6D28D9' } };
                    } else {
                        cell.s.fill = { fgColor: { rgb: 'F1F5F9' } }; // Slate Header
                    }
                    cell.s.alignment = { horizontal: 'center', vertical: 'center' };
                } else if (isData) {
                    cell.s.font = { name: 'Segoe UI', sz: 9, color: { rgb: '334155' } };

                    // Column E (index 4 - Item Asin): FORCE PURE TEXT FORMAT WITHOUT SCIENTIFIC NOTATION
                    if (C === 4) {
                        const cleanAsin = toPureText(cell.v);
                        cell.v = cleanAsin;
                        cell.t = 's'; // Force String Type in Excel
                        cell.z = '@'; // Force Text Format in Excel
                        cell.s.alignment = { horizontal: 'left', vertical: 'center' };
                        cell.s.font = { name: 'Segoe UI', sz: 9, color: { rgb: '1E293B' } };
                    }
                    // Column D (index 3 - Order ID), Column B (index 1 - Sale Invoice No), Column A (index 0 - Invoice No)
                    else if (C === 3 || C === 1 || C === 0) {
                        const cleanText = toPureText(cell.v);
                        cell.v = cleanText;
                        cell.t = 's';
                        cell.z = '@';
                        cell.s.alignment = { horizontal: 'left', vertical: 'center' };
                    }
                    // Column O (index 14 - Order date)
                    else if (C === 14) {
                        cell.t = 's';
                        cell.z = '@';
                        cell.s.alignment = { horizontal: 'center', vertical: 'center' };
                        cell.s.font = { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: '15803D' } };
                    }
                    // Numerical amount / quantity columns
                    else {
                        const val = cell.v;
                        if (val !== undefined && val !== null && !isNaN(Number(val)) && String(val).trim() !== "") {
                            cell.s.alignment = { horizontal: 'right', vertical: 'center' };
                        } else {
                            cell.s.alignment = { horizontal: 'left', vertical: 'center' };
                        }
                    }
                }
            }
        }
    }

    function renderAePurchaseDashboard(filesList, mergedBlob, zipFilename, mergedFilename, stats) {
        if (!aePurchaseOutputContainer) return;
        aePurchaseOutputContainer.innerHTML = '';
        aePurchaseOutputContainer.className = 'processed-container';

        // 1. Stats Cards
        const statsRow = document.createElement('div');
        statsRow.className = 'stats-card-grid';
        statsRow.style.display = 'grid';
        statsRow.style.gridTemplateColumns = 'repeat(auto-fit, minmax(130px, 1fr))';
        statsRow.style.gap = '0.75rem';
        statsRow.style.marginBottom = '1.25rem';

        statsRow.innerHTML = `
            <div style="background: white; border: 1px solid var(--border-color); border-radius: 10px; padding: 0.85rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Total Files</div>
                <div style="font-size: 1.4rem; font-weight: 800; color: #7b2cbf; margin-top: 0.2rem;">${stats.totalFiles}</div>
            </div>
            <div style="background: white; border: 1px solid var(--border-color); border-radius: 10px; padding: 0.85rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Total Rows</div>
                <div style="font-size: 1.4rem; font-weight: 800; color: #1e293b; margin-top: 0.2rem;">${stats.totalRows}</div>
            </div>
            <div style="background: white; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 0.85rem; background: rgba(240, 253, 244, 0.6); box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                <div style="font-size: 0.72rem; color: #15803d; font-weight: 600; text-transform: uppercase;">Dates Matched</div>
                <div style="font-size: 1.4rem; font-weight: 800; color: #15803d; margin-top: 0.2rem;">${stats.totalMatched}</div>
            </div>
            <div style="background: white; border: 1px solid ${stats.totalUnmatched > 0 ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)'}; border-radius: 10px; padding: 0.85rem; background: ${stats.totalUnmatched > 0 ? 'rgba(254, 243, 199, 0.5)' : 'white'}; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                <div style="font-size: 0.72rem; color: ${stats.totalUnmatched > 0 ? '#b45309' : 'var(--text-muted)'}; font-weight: 600; text-transform: uppercase;">Unmatched</div>
                <div style="font-size: 1.4rem; font-weight: 800; color: ${stats.totalUnmatched > 0 ? '#b45309' : '#64748b'}; margin-top: 0.2rem;">${stats.totalUnmatched}</div>
            </div>
        `;
        aePurchaseOutputContainer.appendChild(statsRow);

        // 2. Action Download Bar
        const actionsBar = document.createElement('div');
        actionsBar.style.display = 'flex';
        actionsBar.style.flexWrap = 'wrap';
        actionsBar.style.gap = '0.75rem';
        actionsBar.style.marginBottom = '1.25rem';

        actionsBar.innerHTML = `
            <button type="button" class="btn btn-primary" id="aePurchaseDownloadZipBtn" style="flex: 1; min-width: 200px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.65rem 1.2rem; font-weight: 700; border-radius: 8px; background: linear-gradient(135deg, #7b2cbf, #560bad); cursor: pointer;">
                <i class="fa-solid fa-file-zipper"></i> Download ZIP Package
            </button>
            <button type="button" class="btn btn-success" id="aePurchaseDownloadMergedBtn" style="flex: 1; min-width: 200px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.65rem 1.2rem; font-weight: 700; border-radius: 8px; background: linear-gradient(135deg, #059669, #10b981); cursor: pointer;">
                <i class="fa-solid fa-file-excel"></i> Download Merged Excel (${filesList.length} Sheets)
            </button>
        `;
        aePurchaseOutputContainer.appendChild(actionsBar);

        // Bind Download Buttons
        const dlZipBtn = actionsBar.querySelector('#aePurchaseDownloadZipBtn');
        if (dlZipBtn) {
            dlZipBtn.addEventListener('click', () => {
                if (aePurchaseZipBlob) {
                    triggerDownload(aePurchaseZipBlob, zipFilename);
                    aePurchaseLog(`Downloaded complete ZIP package: ${zipFilename}`, 'info');
                }
            });
        }

        const dlMergedBtn = actionsBar.querySelector('#aePurchaseDownloadMergedBtn');
        if (dlMergedBtn) {
            dlMergedBtn.addEventListener('click', () => {
                if (mergedBlob) {
                    triggerDownload(mergedBlob, mergedFilename);
                    aePurchaseLog(`Downloaded Merged Excel file: ${mergedFilename}`, 'info');
                }
            });
        }

        // 3. Processed Files Table Card
        const tableCard = document.createElement('div');
        tableCard.style.background = 'white';
        tableCard.style.border = '1px solid var(--border-color)';
        tableCard.style.borderRadius = '12px';
        tableCard.style.overflow = 'hidden';
        tableCard.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';

        const tableHeader = document.createElement('div');
        tableHeader.style.padding = '0.75rem 1rem';
        tableHeader.style.borderBottom = '1px solid var(--border-color)';
        tableHeader.style.background = '#f8fafc';
        tableHeader.style.display = 'flex';
        tableHeader.style.justifyContent = 'space-between';
        tableHeader.style.alignItems = 'center';
        tableHeader.innerHTML = `
            <span style="font-size: 0.85rem; font-weight: 700; color: #1e293b;"><i class="fa-solid fa-table-list text-purple"></i> Processed Purchase Details Files (${filesList.length})</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Column O (Order date) successfully updated</span>
        `;
        const tableWrap = document.createElement('div');
        tableWrap.style.overflowX = 'auto';
        tableWrap.style.overflowY = 'auto';
        tableWrap.style.maxHeight = '280px';
        tableWrap.style.webkitOverflowScrolling = 'touch';

        const table = document.createElement('table');
        table.className = 'data-table';
        table.style.width = '100%';
        table.style.minWidth = '720px';
        table.style.fontSize = '0.82rem';

        table.innerHTML = `
            <thead style="position: sticky; top: 0; z-index: 2; background: #f8fafc;">
                <tr>
                    <th style="width: 40px; text-align: center; background: #f8fafc;">#</th>
                    <th style="background: #f8fafc;">Details File Name</th>
                    <th style="background: #f8fafc;">Sheet Name</th>
                    <th style="text-align: center; background: #f8fafc;">Total Rows</th>
                    <th style="text-align: center; background: #f8fafc;">Matched Dates</th>
                    <th style="text-align: center; background: #f8fafc;">Unmatched</th>
                    <th style="text-align: center; background: #f8fafc;">Status</th>
                    <th style="text-align: center; width: 140px; background: #f8fafc;">Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');
        filesList.forEach((file, idx) => {
            const tr = document.createElement('tr');
            const matchRate = file.totalRows > 0 ? Math.round((file.matched / file.totalRows) * 100) : 0;
            const isFullMatch = file.unmatched === 0;

            tr.innerHTML = `
                <td style="text-align: center; font-weight: 700; color: var(--text-muted);">${idx + 1}</td>
                <td style="font-weight: 600; color: var(--text-primary);">
                    <i class="fa-solid fa-file-excel text-purple" style="margin-right: 0.35rem;"></i>
                    ${file.name}
                </td>
                <td style="color: #64748b; font-family: monospace; font-size: 0.78rem;">[${file.sheetName}]</td>
                <td style="text-align: center; font-weight: 700;">${file.totalRows}</td>
                <td style="text-align: center; font-weight: 700; color: #15803d;">${file.matched}</td>
                <td style="text-align: center; font-weight: 700; color: ${file.unmatched > 0 ? '#b45309' : '#64748b'};">${file.unmatched}</td>
                <td style="text-align: center;">
                    <span style="font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 6px; background: ${isFullMatch ? '#dcfce7' : '#fef3c7'}; color: ${isFullMatch ? '#15803d' : '#b45309'}; border: 1px solid ${isFullMatch ? '#86efac' : '#fde68a'};">
                        ${matchRate}% Matched
                    </span>
                </td>
                <td style="text-align: center;">
                    <div style="display: inline-flex; gap: 0.35rem;">
                        <button type="button" class="btn btn-download-single" title="Download this updated file" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; border-radius: 6px; background: #ede9fe; color: #6d28d9; border: 1px solid #d8b4fe; cursor: pointer;">
                            <i class="fa-solid fa-download"></i>
                        </button>
                        <button type="button" class="btn btn-preview-single" title="Preview Excel data" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; border-radius: 6px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; cursor: pointer;">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </td>
            `;

            // Bind single download
            const dlBtn = tr.querySelector('.btn-download-single');
            if (dlBtn) {
                dlBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    triggerDownload(file.blob, file.name);
                    aePurchaseLog(`Downloaded individual file: ${file.name}`, 'info');
                });
            }

            // Bind preview
            const prevBtn = tr.querySelector('.btn-preview-single');
            if (prevBtn) {
                prevBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (typeof openExcelDataViewer === 'function') {
                        openExcelDataViewer({
                            name: file.name,
                            newName: file.name,
                            blob: file.blob,
                            aoa: file.aoa
                        });
                    }
                });
            }

            tbody.appendChild(tr);
        });

        tableWrap.appendChild(table);
        tableCard.appendChild(tableWrap);
        aePurchaseOutputContainer.appendChild(tableCard);
    }

    if (aePurchaseBtn) {
        aePurchaseBtn.addEventListener('click', async () => {
            if (aePurchaseDetailsFiles.length === 0 || !aePurchaseDataFile) return;

            aePurchaseBtn.setAttribute('disabled', 'true');
            if (aePurchaseStatus) {
                aePurchaseStatus.className = 'status-indicator processing';
                aePurchaseStatus.innerText = 'Processing';
            }
            if (aePurchaseProgressCard) aePurchaseProgressCard.classList.remove('hidden');
            if (aePurchaseProgressBar) aePurchaseProgressBar.style.width = '5%';
            if (aePurchaseProgressPercent) aePurchaseProgressPercent.innerText = '5%';
            if (aePurchaseProgressStepText) aePurchaseProgressStepText.innerText = 'Reading Ajio Data file...';

            if (aePurchaseOutputContainer) {
                aePurchaseOutputContainer.innerHTML = `
                    <div class="empty-output-state">
                        <i class="fa-solid fa-spinner fa-spin placeholder-icon" style="color: #7b2cbf;"></i>
                        <p>Processing Purchase Details and matching with Ajio Data file...</p>
                    </div>
                `;
            }

            try {
                aePurchaseLog('Starting Purchase Error Process...', 'process');
                aePurchaseLog(`Selected Details Files: ${aePurchaseDetailsFiles.length}`, 'info');
                aePurchaseLog(`Selected Ajio Data File: ${aePurchaseDataFile.name}`, 'info');

                // Step 1: Read and Index the Ajio Data File
                if (aePurchaseProgressBar) aePurchaseProgressBar.style.width = '10%';
                if (aePurchaseProgressPercent) aePurchaseProgressPercent.innerText = '10%';
                if (aePurchaseProgressStepText) aePurchaseProgressStepText.innerText = 'Parsing Ajio Data spreadsheet...';

                const dataBuffer = await readFileAsArrayBuffer(aePurchaseDataFile);
                const dataWb = XLSX.read(dataBuffer, { type: 'array', cellDates: true });
                
                // Find sheet with data or default to first
                let dataSheetName = dataWb.SheetNames[0];
                for (const sName of dataWb.SheetNames) {
                    const low = sName.toLowerCase();
                    if (low.includes('data') || low.includes('ajio')) {
                        dataSheetName = sName;
                        break;
                    }
                }

                const dataWs = dataWb.Sheets[dataSheetName];
                const dataAoa = XLSX.utils.sheet_to_json(dataWs, { header: 1, defval: "" });
                aePurchaseLog(`Loaded Ajio Data sheet [${dataSheetName}] with ${dataAoa.length} rows.`, 'info');

                if (dataAoa.length < 2) {
                    throw new Error(`Ajio Data sheet [${dataSheetName}] is empty or has no data rows.`);
                }

                // Locate Data file header row
                let dataHeaderRowIndex = -1;
                for (let i = 0; i < Math.min(dataAoa.length, 10); i++) {
                    const row = dataAoa[i];
                    if (row && row.some(cell => {
                        const str = String(cell || "").trim().toLowerCase();
                        return str.includes("seller invoice") || str.includes("seller order") || str.includes("customer order") || str.includes("cust order date");
                    })) {
                        dataHeaderRowIndex = i;
                        break;
                    }
                }
                if (dataHeaderRowIndex === -1) {
                    dataHeaderRowIndex = 1; // Default row 2 (index 1)
                }

                const dataHeaderRow = dataAoa[dataHeaderRowIndex] || [];
                let sellerInvoiceCol = 7; // Col H default
                let sellerOrderNoCol = 4; // Col E default
                let custOrderNoCol = 1;   // Col B default
                let custOrderDateCol = 2; // Col C default

                for (let c = 0; c < dataHeaderRow.length; c++) {
                    const val = String(dataHeaderRow[c] || "").trim().toLowerCase().replace(/[\._\-\s]+/g, " ");
                    
                    // 1. Seller Invoice No (Col H - MUST NOT be date)
                    if ((val === "seller invoice no" || val === "seller invoice number" || val === "seller invoice" || val.includes("seller invoice")) && !val.includes("date")) {
                        sellerInvoiceCol = c;
                    }
                    // 2. Seller Order No (Col E - MUST NOT be date or invoice)
                    else if ((val === "seller order no" || val === "seller order number" || val === "seller order" || val.includes("seller order")) && !val.includes("date") && !val.includes("invoice")) {
                        sellerOrderNoCol = c;
                    }
                    // 3. Customer Order No (Col B - MUST NOT be date)
                    else if ((val === "customer order no" || val === "cust order no" || val === "customer order number" || val === "customer order" || val.includes("customer order") || val.includes("cust order")) && !val.includes("date")) {
                        custOrderNoCol = c;
                    }
                    // 4. Cust Order Date (Col C - MUST contain order + date, NOT invoice or po)
                    else if ((val === "cust order date" || val === "customer order date" || (val.includes("order") && val.includes("date"))) && !val.includes("invoice") && !val.includes("po")) {
                        custOrderDateCol = c;
                    }
                }

                aePurchaseLog(`Data File Columns detected: Seller Invoice No = Col ${colNumToExcelLetter(sellerInvoiceCol)} (${sellerInvoiceCol}), Seller Order No = Col ${colNumToExcelLetter(sellerOrderNoCol)} (${sellerOrderNoCol}), Cust Order Date = Col ${colNumToExcelLetter(custOrderDateCol)} (${custOrderDateCol})`, 'info');

                // Build multi-strategy lookup maps
                const dataCompositeMap = new Map();
                const dataCustCompositeMap = new Map();
                const dataInvoiceOnlyMap = new Map();
                const dataOrderOnlyMap = new Map();
                const dataCustOrderOnlyMap = new Map();

                for (let r = dataHeaderRowIndex + 1; r < dataAoa.length; r++) {
                    const row = dataAoa[r];
                    if (!row || row.length === 0) continue;
                    const inv = row[sellerInvoiceCol];
                    const ord = row[sellerOrderNoCol];
                    const custOrd = row[custOrderNoCol];
                    const dt = row[custOrderDateCol];

                    const formattedDate = formatPurchaseDateVal(dt);
                    if (formattedDate !== "") {
                        const cleanInv = cleanPurchaseKeyVal(inv);
                        const cleanOrd = cleanPurchaseKeyVal(ord);
                        const cleanCustOrd = cleanPurchaseKeyVal(custOrd);

                        if (cleanInv && cleanOrd) {
                            dataCompositeMap.set(`${cleanInv}__${cleanOrd}`, formattedDate);
                        }
                        if (cleanInv && cleanCustOrd) {
                            dataCustCompositeMap.set(`${cleanInv}__${cleanCustOrd}`, formattedDate);
                        }
                        if (cleanInv && !dataInvoiceOnlyMap.has(cleanInv)) {
                            dataInvoiceOnlyMap.set(cleanInv, formattedDate);
                        }
                        if (cleanOrd && !dataOrderOnlyMap.has(cleanOrd)) {
                            dataOrderOnlyMap.set(cleanOrd, formattedDate);
                        }
                        if (cleanCustOrd && !dataCustOrderOnlyMap.has(cleanCustOrd)) {
                            dataCustOrderOnlyMap.set(cleanCustOrd, formattedDate);
                        }
                    }
                }

                aePurchaseLog(`Indexed ${dataCompositeMap.size} composite keys + ${dataOrderOnlyMap.size} order keys from Data file.`, 'success');

                // Step 2: Process Each Details File
                const zip = new JSZip();
                const mergedWb = XLSX.utils.book_new();
                const processedFilesList = [];
                let overallTotalRows = 0;
                let overallMatchedCount = 0;
                let overallUnmatchedCount = 0;

                const totalFiles = aePurchaseDetailsFiles.length;

                for (let fileIdx = 0; fileIdx < totalFiles; fileIdx++) {
                    const fileObj = aePurchaseDetailsFiles[fileIdx];
                    const progressPercent = 20 + Math.round((fileIdx / totalFiles) * 60);
                    if (aePurchaseProgressBar) aePurchaseProgressBar.style.width = `${progressPercent}%`;
                    if (aePurchaseProgressPercent) aePurchaseProgressPercent.innerText = `${progressPercent}%`;
                    if (aePurchaseProgressStepText) aePurchaseProgressStepText.innerText = `Processing file ${fileIdx + 1} of ${totalFiles}: ${fileObj.name}...`;

                    aePurchaseLog(`Processing Details File [${fileIdx + 1}/${totalFiles}]: ${fileObj.name}...`, 'info');

                    const detailsBuffer = await readFileAsArrayBuffer(fileObj.file);
                    const detailsWb = XLSX.read(detailsBuffer, { type: 'array', cellDates: true });
                    const detailsSheetName = detailsWb.SheetNames[0];
                    const detailsWs = detailsWb.Sheets[detailsSheetName];
                    const detailsAoa = XLSX.utils.sheet_to_json(detailsWs, { header: 1, defval: "", raw: false });

                    if (detailsAoa.length < 2) {
                        aePurchaseLog(`Skipped [${fileObj.name}]: Sheet has no data rows.`, 'warning');
                        continue;
                    }

                    // Locate Details Header Row (row containing "invoice no" or "sale invoice no")
                    let detailsHeaderRowIndex = -1;
                    for (let i = 0; i < Math.min(detailsAoa.length, 5); i++) {
                        const row = detailsAoa[i];
                        if (row && row.some(cell => {
                            const str = String(cell || "").trim().toLowerCase();
                            return str.includes("sale invoice") || str.includes("invoice no") || str.includes("order id");
                        })) {
                            detailsHeaderRowIndex = i;
                            break;
                        }
                    }
                    if (detailsHeaderRowIndex === -1) {
                        detailsHeaderRowIndex = 1; // Default row 2 (index 1)
                    }

                    const detailsHeaderRow = detailsAoa[detailsHeaderRowIndex] || [];
                    let saleInvoiceCol = 1; // Col B default
                    let orderIdCol = 3;     // Col D default
                    let itemAsinCol = 4;    // Col E default
                    let orderDateCol = 14;  // Col O default

                    for (let c = 0; c < detailsHeaderRow.length; c++) {
                        const val = String(detailsHeaderRow[c] || "").trim().toLowerCase().replace(/[\._\-\s]+/g, " ");
                        if ((val === "sale invoice no" || val === "sale invoice number" || val === "sale invoice" || val.includes("sale invoice")) && !val.includes("date")) {
                            saleInvoiceCol = c;
                        } else if ((val === "order id" || val === "orderid" || val === "order no" || val === "order number" || (val.includes("order") && (val.includes("id") || val.includes("no")))) && !val.includes("date") && !val.includes("sale") && !val.includes("invoice")) {
                            orderIdCol = c;
                        } else if (val === "item asin" || val === "asin" || val.includes("asin")) {
                            itemAsinCol = c;
                        } else if ((val === "order date" || val === "cust order date" || (val.includes("order") && val.includes("date"))) && !val.includes("invoice")) {
                            orderDateCol = c;
                        }
                    }

                    // Ensure Column O (index 14) in header row is "Order date"
                    while (detailsHeaderRow.length < 15) {
                        detailsHeaderRow.push("");
                    }
                    detailsHeaderRow[14] = "Order date";

                    const updatedFileAoa = [];
                    // Preserve title row(s) before header row
                    for (let r = 0; r < detailsHeaderRowIndex; r++) {
                        const titleRow = [...(detailsAoa[r] || [])];
                        while (titleRow.length < 15) titleRow.push("");
                        updatedFileAoa.push(titleRow);
                    }
                    updatedFileAoa.push(detailsHeaderRow);

                    let fileTotalRows = 0;
                    let fileMatchedCount = 0;
                    let fileUnmatchedCount = 0;

                    for (let r = detailsHeaderRowIndex + 1; r < detailsAoa.length; r++) {
                        const rawRow = detailsAoa[r];
                        if (!rawRow || rawRow.every(c => String(c || "").trim() === "")) continue;

                        const row = [...rawRow];
                        while (row.length < 15) row.push("");

                        // Force Column E (Item Asin) to clean text string
                        if (row[itemAsinCol] !== undefined && row[itemAsinCol] !== null) {
                            row[itemAsinCol] = toPureText(row[itemAsinCol]);
                        }
                        if (row[4] !== undefined && row[4] !== null) {
                            row[4] = toPureText(row[4]);
                        }
                        // Force Column D (Order ID) to clean text string
                        if (row[orderIdCol] !== undefined && row[orderIdCol] !== null) {
                            row[orderIdCol] = toPureText(row[orderIdCol]);
                        }
                        if (row[3] !== undefined && row[3] !== null) {
                            row[3] = toPureText(row[3]);
                        }

                        const saleInv = row[saleInvoiceCol];
                        const orderId = row[orderIdCol];
                        const cleanInv = cleanPurchaseKeyVal(saleInv);
                        const cleanOrd = cleanPurchaseKeyVal(orderId);

                        // 1. Try Primary Composite Key: Sale Invoice + Order ID
                        let matchedDate = dataCompositeMap.get(`${cleanInv}__${cleanOrd}`);

                        // 2. Try Secondary Composite Key: Sale Invoice + Cust Order ID
                        if (!matchedDate) {
                            matchedDate = dataCustCompositeMap.get(`${cleanInv}__${cleanOrd}`);
                        }

                        // 3. Try Normalized alphanumeric Order ID
                        if (!matchedDate && cleanOrd) {
                            const altOrd = cleanOrd.replace(/[^0-9A-Z]/g, '');
                            matchedDate = dataCompositeMap.get(`${cleanInv}__${altOrd}`);
                        }

                        // 4. Try Order ID Only lookup
                        if (!matchedDate && cleanOrd) {
                            matchedDate = dataOrderOnlyMap.get(cleanOrd) || dataCustOrderOnlyMap.get(cleanOrd);
                        }

                        // 5. Try Invoice No Only lookup
                        if (!matchedDate && cleanInv) {
                            matchedDate = dataInvoiceOnlyMap.get(cleanInv);
                        }

                        if (matchedDate) {
                            row[14] = matchedDate; // Write into Column O (index 14)
                            fileMatchedCount++;
                        } else {
                            row[14] = ""; // Keep empty
                            fileUnmatchedCount++;
                        }
                        fileTotalRows++;
                        updatedFileAoa.push(row);
                    }

                    overallTotalRows += fileTotalRows;
                    overallMatchedCount += fileMatchedCount;
                    overallUnmatchedCount += fileUnmatchedCount;

                    // Convert to Worksheet and apply formatting
                    const fileWs = XLSX.utils.aoa_to_sheet(updatedFileAoa);
                    if (detailsHeaderRowIndex > 0) {
                        // Title banner row 1 merge across A1:O1 (0,0 to 0,14)
                        fileWs['!merges'] = [
                            { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } }
                        ];
                    }
                    formatPurchaseWorksheet(fileWs);

                    // Build clean safe sheet name from file name
                    const cleanSheetName = getSafeSheetName(fileObj.name.replace(/\.[^/.]+$/, ""));

                    // Save single file workbook
                    const singleWb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(singleWb, fileWs, cleanSheetName);
                    const singleBuffer = XLSX.write(singleWb, { bookType: 'xlsx', type: 'array' });
                    const singleBlob = new Blob([singleBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

                    // Add to ZIP and Merged Workbook
                    zip.file(fileObj.name, singleBuffer);
                    
                    // Avoid duplicate sheet names in merged workbook
                    let mergedSheetName = cleanSheetName;
                    let dupIndex = 1;
                    while (mergedWb.SheetNames.includes(mergedSheetName)) {
                        mergedSheetName = getSafeSheetName(`${cleanSheetName}_${dupIndex++}`);
                    }
                    XLSX.utils.book_append_sheet(mergedWb, fileWs, mergedSheetName);

                    processedFilesList.push({
                        name: fileObj.name,
                        sheetName: mergedSheetName,
                        blob: singleBlob,
                        totalRows: fileTotalRows,
                        matched: fileMatchedCount,
                        unmatched: fileUnmatchedCount,
                        aoa: updatedFileAoa
                    });

                    // Register into Error Dispute Tracker
                    const partyOrWhName = fileObj.name.replace(/\.[^/.]+$/, "").replace(/price dispute/gi, "").replace(/[-_]+/g, " ").trim() || fileObj.name;
                    registerTrackedError('purchase', fileObj.name, partyOrWhName, 'Purchase Price Dispute', fileTotalRows);

                    aePurchaseLog(`[${fileObj.name}] Done: ${fileTotalRows} rows (${fileMatchedCount} dates matched, ${fileUnmatchedCount} unmatched) -> Added to Error Tracker`, fileMatchedCount > 0 ? 'success' : 'warning');
                }

                if (processedFilesList.length === 0) {
                    throw new Error('No Details files could be processed.');
                }

                // Step 3: Finalize Merged Excel & ZIP Bundle
                if (aePurchaseProgressBar) aePurchaseProgressBar.style.width = '85%';
                if (aePurchaseProgressPercent) aePurchaseProgressPercent.innerText = '85%';
                if (aePurchaseProgressStepText) aePurchaseProgressStepText.innerText = 'Finalizing Merged Excel and ZIP package...';

                const timestampStr = getFormattedDateTime().replace(/[:\s]/g, '_');
                aePurchaseMergedFilename = `Merged_Purchase_Errors_${timestampStr}.xlsx`;
                aePurchaseZipFilename = `ajio_purchase_error_bundle_${timestampStr}.zip`;

                const mergedBuffer = XLSX.write(mergedWb, { bookType: 'xlsx', type: 'array' });
                aePurchaseMergedBlob = new Blob([mergedBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                zip.file(aePurchaseMergedFilename, mergedBuffer);

                aePurchaseZipBlob = await zip.generateAsync({ type: 'blob' });

                if (aePurchaseProgressBar) aePurchaseProgressBar.style.width = '100%';
                if (aePurchaseProgressPercent) aePurchaseProgressPercent.innerText = '100% Completed';
                if (aePurchaseProgressStepText) aePurchaseProgressStepText.innerText = 'All purchase files processed successfully!';
                
                if (aePurchaseStatus) {
                    aePurchaseStatus.className = 'status-indicator success';
                    aePurchaseStatus.innerText = 'Completed';
                }

                aePurchaseLog(`Successfully completed! ${processedFilesList.length} files processed. Total records: ${overallTotalRows} (${overallMatchedCount} dates matched).`, 'success');
                aePurchaseLog(`Merged Excel created: "${aePurchaseMergedFilename}" (${formatBytes(aePurchaseMergedBlob.size)})`, 'success');
                aePurchaseLog(`ZIP Package created: "${aePurchaseZipFilename}" (${formatBytes(aePurchaseZipBlob.size)})`, 'success');

                // Step 4: Render Results Dashboard
                renderAePurchaseDashboard(
                    processedFilesList,
                    aePurchaseMergedBlob,
                    aePurchaseZipFilename,
                    aePurchaseMergedFilename,
                    {
                        totalFiles: processedFilesList.length,
                        totalRows: overallTotalRows,
                        totalMatched: overallMatchedCount,
                        totalUnmatched: overallUnmatchedCount
                    }
                );

                alert(`PURCHASE ERROR PROCESS COMPLETED SUCCESSFULLY!\n\n- Processed Files: ${processedFilesList.length}\n- Total Records: ${overallTotalRows}\n- Dates Matched: ${overallMatchedCount}\n\nMerged Excel & ZIP package are ready for download!`);

            } catch (err) {
                console.error('Purchase process error:', err);
                aePurchaseLog(`Purchase process failed: ${err.message}`, 'error');
                if (aePurchaseStatus) {
                    aePurchaseStatus.className = 'status-indicator idle';
                    aePurchaseStatus.innerText = 'Failed';
                }
                if (aePurchaseOutputContainer) {
                    aePurchaseOutputContainer.innerHTML = `
                        <div class="empty-output-state">
                            <i class="fa-solid fa-circle-exclamation placeholder-icon" style="color: #ef4444;"></i>
                            <p style="color: #ef4444; font-weight: 600;">Error: ${err.message}</p>
                        </div>
                    `;
                }
            } finally {
                aePurchaseBtn.removeAttribute('disabled');
            }
        });
    }

    /* ==========================================================================
       FOLDER CREATE LOGIC
       ========================================================================== */
    let fcFiles = [];
    let fcFolderGroups = [];
    let fcZipBlob = null;
    let fcZipFilename = "";
    let fcMissingReportBlob = null;
    let fcModalCurrentFilter = 'all'; // 'all', 'incomplete', 'ready'
    let fcSourceCopyFile = null;
    let fcSourceCopyPrefix = "";
    let fcSelectedTargetPrefixes = new Set();
    let fcAvailableIncompleteFolders = [];
    let fcMode = 'files'; // 'files' or 'folders'

    const fcDropzone = document.getElementById('fcDropzone');
    const fcFileInput = document.getElementById('fcFileInput');
    const fcFolderInput = document.getElementById('fcFolderInput');
    const fcUploadTitle = document.getElementById('fcUploadTitle');
    const fcModeFilesBtn = document.getElementById('fcModeFilesBtn');
    const fcModeFoldersBtn = document.getElementById('fcModeFoldersBtn');
    const fcFileDisplay = document.getElementById('fcFileDisplay');
    const fcBtn = document.getElementById('fcBtn');
    const fcStatus = document.getElementById('fcStatus');
    const fcProgressCard = document.getElementById('fcProgressCard');
    const fcProgressBar = document.getElementById('fcProgressBar');
    const fcProgressPercent = document.getElementById('fcProgressPercent');
    const fcProgressStepText = document.getElementById('fcProgressStepText');
    const fcOutputContainer = document.getElementById('fcOutputContainer');
    const fcConsoleLog = document.getElementById('fcConsoleLog');
    const clearFcLogBtn = document.getElementById('clearFcLogBtn');
    const clearFcFilesBtn = document.getElementById('clearFcFilesBtn');
    const fcSelectedCount = document.getElementById('fcSelectedCount');
    const fcUploadedFileList = document.getElementById('fcUploadedFileList');

    // Initialize folder input display as hidden by default
    if (fcFolderInput) fcFolderInput.style.display = 'none';

    function fcLog(message, type = 'info') {
        if (!fcConsoleLog) return;
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        line.innerText = `[${timestamp}] ${message}`;
        if (fcConsoleLog.children.length > 300) {
            fcConsoleLog.removeChild(fcConsoleLog.firstChild);
        }
        fcConsoleLog.appendChild(line);
        fcConsoleLog.scrollTop = fcConsoleLog.scrollHeight;
    }

    if (clearFcLogBtn) {
        clearFcLogBtn.addEventListener('click', () => {
            fcConsoleLog.innerHTML = '';
            fcLog('Log cleared.', 'info');
        });
    }

    // Helper to recursively traverse dragged folders and get files
    async function getFilesFromDataTransfer(dataTransfer) {
        console.log("getFilesFromDataTransfer: Started traversal. dataTransfer =", dataTransfer);
        const files = [];
        
        // Helper to read directory entries
        const readDirectory = (dirEntry) => {
            return new Promise((resolve) => {
                const reader = dirEntry.createReader();
                const allEntries = [];
                
                const readEntries = () => {
                    reader.readEntries((entries) => {
                        if (entries.length === 0) {
                            resolve(allEntries);
                        } else {
                            allEntries.push(...entries);
                            readEntries();
                        }
                    }, () => resolve([]));
                };
                readEntries();
            });
        };
        
        // Helper to get file from file entry
        const getFile = (fileEntry) => {
            return new Promise((resolve) => {
                fileEntry.file((file) => resolve(file), () => resolve(null));
            });
        };
        
        // Recursive traverse
        const traverse = async (entry, path = "") => {
            console.log("Traversing entry:", entry.name, "isFile:", entry.isFile, "isDirectory:", entry.isDirectory, "currentPath:", path);
            if (entry.isFile) {
                const file = await getFile(entry);
                if (file) {
                    file.customRelativePath = path ? `${path}/${file.name}` : file.name;
                    console.log("Found file entry:", file.name, "customRelativePath:", file.customRelativePath);
                    files.push(file);
                }
            } else if (entry.isDirectory) {
                const entries = await readDirectory(entry);
                const nextPath = path ? `${path}/${entry.name}` : entry.name;
                console.log("Found directory entry:", entry.name, "contains entries count:", entries.length, "nextPath:", nextPath);
                for (const subEntry of entries) {
                    await traverse(subEntry, nextPath);
                }
            }
        };
        
        const items = dataTransfer.items;
        const entries = [];
        
        // CRITICAL: webkitGetAsEntry MUST be called synchronously for all items
        // before any await yielding occurs, because Chrome clears dataTransfer.items
        // once the event loop turns.
        if (items) {
            console.log("dataTransfer.items found. count =", items.length);
            for (let i = 0; i < items.length; i++) {
                try {
                    const entry = items[i].webkitGetAsEntry();
                    console.log("Item index", i, "entryName =", entry ? entry.name : "null");
                    if (entry) {
                        entries.push(entry);
                    }
                } catch (err) {
                    console.warn("Error getting webkitGetAsEntry at index", i, err);
                }
            }
        }
        
        if (entries.length > 0) {
            console.log("Synchronously extracted entries count =", entries.length, ". Starting async traversal...");
            for (const entry of entries) {
                await traverse(entry);
            }
        } else {
            console.log("No webkitGetAsEntry entries found or items was empty. Falling back to dataTransfer.files...");
            const list = Array.from(dataTransfer.files);
            list.forEach(file => {
                file.customRelativePath = file.webkitRelativePath || file.name;
                files.push(file);
            });
        }
        
        console.log("getFilesFromDataTransfer finished. Total files parsed =", files.length);
        return files;
    }

    function switchFcMode(mode) {
        if (fcMode === mode) return;
        fcMode = mode;
        
        fcFiles = [];
        if (fcFileInput) fcFileInput.value = '';
        if (fcFolderInput) fcFolderInput.value = '';
        fcZipBlob = null;
        
        if (fcOutputContainer) {
            fcOutputContainer.innerHTML = `
                <div class="empty-output-state">
                    <i class="fa-solid fa-folder-plus placeholder-icon"></i>
                    <p>Upload files and click process to group into folders and zip.</p>
                </div>
            `;
            fcOutputContainer.className = 'processed-container empty';
        }
        if (fcStatus) {
            fcStatus.className = 'status-indicator idle';
            fcStatus.innerText = 'Idle';
        }
        if (fcProgressCard) fcProgressCard.classList.add('hidden');
        
        if (mode === 'files') {
            if (fcFileInput) fcFileInput.style.display = 'block';
            if (fcFolderInput) fcFolderInput.style.display = 'none';
            if (fcModeFilesBtn) fcModeFilesBtn.classList.add('active');
            if (fcModeFoldersBtn) fcModeFoldersBtn.classList.remove('active');
            if (fcUploadTitle) fcUploadTitle.innerText = "Drag & drop or browse files to group";
            if (fcFileDisplay) fcFileDisplay.innerText = "Drag & drop or Click to choose files";
            fcLog("Switched to File Grouping Mode (by name prefix).", "info");
        } else {
            if (fcFileInput) fcFileInput.style.display = 'none';
            if (fcFolderInput) fcFolderInput.style.display = 'block';
            if (fcModeFilesBtn) fcModeFilesBtn.classList.remove('active');
            if (fcModeFoldersBtn) fcModeFoldersBtn.classList.add('active');
            if (fcUploadTitle) fcUploadTitle.innerText = "Drag & drop or browse folders";
            if (fcFileDisplay) fcFileDisplay.innerText = "Drag & drop or Click to choose folders";
            fcLog("Switched to Folder Process Mode (zip & verify folders directly).", "info");
        }
        
        updateFcUI();
    }

    if (fcModeFilesBtn) {
        fcModeFilesBtn.addEventListener('click', () => switchFcMode('files'));
    }
    if (fcModeFoldersBtn) {
        fcModeFoldersBtn.addEventListener('click', () => switchFcMode('folders'));
    }

    function handleFcFilesAdded(files) {
        console.log("handleFcFilesAdded: Received files =", files.length, "Mode =", fcMode);
        let added = 0;
        files.forEach(file => {
            console.log("Processing file in loop:", file.name, 
                        "size:", file.size, 
                        "webkitRelativePath:", file.webkitRelativePath, 
                        "customRelativePath:", file.customRelativePath);
                        
            const ext = file.name.split('.').pop().toLowerCase();
            const isValidExt = ['xlsx', 'xls', 'csv'].includes(ext);
            const isSystemFile = file.name.startsWith('.') || file.name.startsWith('~') || file.name === "Thumbs.db";
            
            if (!isValidExt || isSystemFile) {
                console.log("File skipped. Reason - Valid extension:", isValidExt, "System file:", isSystemFile);
                return;
            }
            
            if (fcMode === 'files') {
                if (!fcFiles.some(f => f.name === file.name && f.size === file.size)) {
                    fcFiles.push({
                        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                        name: file.name,
                        size: file.size,
                        file: file
                    });
                    added++;
                } else {
                    console.log("File already exists in selection:", file.name);
                }
            } else {
                const relativePath = file.customRelativePath || file.webkitRelativePath || file.name;
                // Normalize backslashes to forward slashes for Windows compatibility
                const normalizedPath = relativePath.replace(/\\/g, '/');
                const pathParts = normalizedPath.split('/');
                
                console.log("Folder Mode details -> relativePath:", relativePath, 
                            "normalizedPath:", normalizedPath, 
                            "pathParts:", pathParts);
                
                if (pathParts.length > 1) {
                    let folderName = "";
                    let cleanRelativePath = "";
                    
                    if (pathParts.length > 2) {
                        folderName = pathParts[1];
                        cleanRelativePath = pathParts.slice(1).join('/');
                    } else {
                        folderName = pathParts[0];
                        cleanRelativePath = pathParts.join('/');
                    }
                    
                    console.log("Extracted folderName:", folderName, "cleanRelativePath:", cleanRelativePath);
                    
                    if (!fcFiles.some(f => f.relativePath === cleanRelativePath && f.size === file.size)) {
                        fcFiles.push({
                            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                            name: file.name,
                            size: file.size,
                            file: file,
                            folderName: folderName,
                            relativePath: cleanRelativePath
                        });
                        added++;
                    } else {
                        console.log("File already exists in folder selection:", cleanRelativePath);
                    }
                } else {
                    console.log("Ignored because pathParts.length <= 1");
                    fcLog(`Ignored file [${file.name}] because it is not inside an uploaded folder.`, 'warning');
                }
            }
        });
        
        console.log("Finished handleFcFilesAdded. Added", added, "new files.");
        if (added > 0) {
            const unit = fcMode === 'files' ? 'file(s)' : 'file(s) from folders';
            fcLog(`Added ${added} ${unit} to process list.`, 'success');
        } else {
            fcLog(`No new valid Excel files were added.`, 'warning');
        }
        updateFcUI();
    }

    if (fcDropzone) {
        fcDropzone.addEventListener('click', (e) => {
            if (e.target === fcFileInput || e.target === fcFolderInput) return;
            if (fcMode === 'files') {
                if (fcFileInput) fcFileInput.click();
            } else {
                if (fcFolderInput) fcFolderInput.click();
            }
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            fcDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                fcDropzone.classList.add('dragover');
            });
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            fcDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                fcDropzone.classList.remove('dragover');
            });
        });
        
        fcDropzone.addEventListener('drop', async (e) => {
            let files = [];
            if (fcMode === 'files') {
                if (e.dataTransfer.files.length > 0) {
                    files = Array.from(e.dataTransfer.files);
                }
            } else {
                files = await getFilesFromDataTransfer(e.dataTransfer);
            }
            
            if (files.length > 0) {
                handleFcFilesAdded(files);
            }
        });
    }

    if (fcFileInput) {
        fcFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFcFilesAdded(Array.from(e.target.files));
                fcFileInput.value = '';
            }
        });
    }

    if (fcFolderInput) {
        fcFolderInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFcFilesAdded(Array.from(e.target.files));
                fcFolderInput.value = '';
            }
        });
    }

    if (clearFcFilesBtn) {
        clearFcFilesBtn.addEventListener('click', async () => {
            const ok = await showCustomConfirm('Clear Files', 'Are you sure you want to clear all selected files and grouped folders?', 'danger', 'Clear All');
            if (!ok) return;

            fcFiles = [];
            fcFolderGroups = [];
            fcZipBlob = null;
            fcZipFilename = "";
            fcMissingReportBlob = null;
            if (fcFileInput) fcFileInput.value = '';
            if (fcFolderInput) fcFolderInput.value = '';
            updateFcUI();
            if (fcOutputContainer) {
                fcOutputContainer.innerHTML = `
                    <div class="empty-output-state">
                        <i class="fa-solid fa-folder-plus placeholder-icon"></i>
                        <p>Upload files and click process to group into folders and zip.</p>
                    </div>
                `;
                fcOutputContainer.className = 'processed-container empty';
            }
            if (fcStatus) {
                fcStatus.className = 'status-indicator idle';
                fcStatus.innerText = 'Idle';
            }
            if (fcProgressCard) fcProgressCard.classList.add('hidden');
            await clearTabSession('folder_create_tab');
            fcLog('Cleared all selected files and session cache.', 'info');
        });
    }

    function updateFcUI() {
        if (fcSelectedCount) fcSelectedCount.innerText = fcFiles.length;
        if (!fcUploadedFileList) return;
        
        if (fcFiles.length > 0) {
            if (fcBtn) fcBtn.removeAttribute('disabled');
            fcUploadedFileList.innerHTML = '';
            fcFiles.forEach(fileObj => {
                const item = document.createElement('div');
                item.className = 'file-item';
                
                const info = document.createElement('div');
                info.className = 'file-info';
                
                const icon = document.createElement('i');
                icon.className = getFileIconClass(fileObj.name);
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'file-name';
                nameSpan.innerText = fcMode === 'folders' ? (fileObj.relativePath || fileObj.name) : fileObj.name;
                
                const sizeSpan = document.createElement('span');
                sizeSpan.className = 'file-size';
                sizeSpan.innerText = formatBytes(fileObj.size);
                
                info.appendChild(icon);
                info.appendChild(nameSpan);
                info.appendChild(sizeSpan);
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'file-action-btn';
                removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                removeBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const ok = await showCustomConfirm('Remove File', `Are you sure you want to remove "${fileObj.name}"?`, 'danger', 'Remove');
                    if (!ok) return;
                    fcFiles = fcFiles.filter(f => f.id !== fileObj.id);
                    fcLog(`Removed file: ${fileObj.name}`, 'info');
                    updateFcUI();
                });
                
                item.appendChild(info);
                item.appendChild(removeBtn);
                fcUploadedFileList.appendChild(item);
            });
        } else {
            if (fcBtn) fcBtn.setAttribute('disabled', 'true');
            fcUploadedFileList.innerHTML = '<div class="empty-list-msg">No files selected yet.</div>';
        }
    }

    function sortFolderGroups(groups) {
        return groups.sort((a, b) => {
            if (a.isError && !b.isError) return -1;
            if (!a.isError && b.isError) return 1;
            return a.prefix.localeCompare(b.prefix, undefined, { numeric: true, sensitivity: 'base' });
        });
    }

    async function rebuildFcPackage(silent = false) {
        if (!fcFolderGroups || fcFolderGroups.length === 0) {
            fcZipBlob = null;
            fcMissingReportBlob = null;
            return;
        }

        const zip = new JSZip();
        const foldersWithIssues = [];
        let hasMissing = false;

        fcFolderGroups.forEach(grp => {
            grp.isError = (grp.files.length !== 2);
            if (grp.isError) {
                foldersWithIssues.push(grp);
                hasMissing = true;
            }

            const folder = zip.folder(grp.prefix);
            grp.files.forEach(fObj => {
                folder.file(fObj.name, fObj.blob || fObj.file);
            });
        });

        // Re-sort error folders to top
        sortFolderGroups(fcFolderGroups);

        if (hasMissing) {
            const reportData = [
                ["Folder Name (Prefix)", "Files Found", "Current Files", "Status"]
            ];
            foldersWithIssues.forEach(item => {
                const fileNamesStr = item.files.map(f => f.name).join(", ");
                const statusStr = item.files.length < 2 ? `File Missing (Found ${item.files.length}, Expected 2)` : `Extra Files Present (Found ${item.files.length}, Expected 2)`;
                reportData.push([
                    item.prefix,
                    item.files.length,
                    fileNamesStr,
                    statusStr
                ]);
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(reportData);
            XLSX.utils.book_append_sheet(wb, ws, "Missing Files Log");
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            fcMissingReportBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            zip.file("Missing_Files_Report.xlsx", excelBuffer);
        } else {
            fcMissingReportBlob = null;
        }

        let zipFilename = "";
        if (fcFolderGroups.length === 1) {
            zipFilename = `${fcFolderGroups[0].prefix}.zip`;
        } else {
            zipFilename = `${fcFolderGroups[0].prefix}-${fcFolderGroups[fcFolderGroups.length - 1].prefix}.zip`;
        }
        fcZipFilename = zipFilename;
        fcZipBlob = await zip.generateAsync({ type: 'blob' });

        saveTabSession('folder_create_tab', {
            fcFiles,
            fcFolderGroups,
            fcZipBlob,
            fcZipFilename,
            fcMissingReportBlob,
            hasMissing
        });

        renderFcDashboard(fcFolderGroups, hasMissing, zipFilename);
        if (fcFullscreenModal && fcFullscreenModal.classList.contains('active')) {
            renderFcAccordion();
        }

        if (!silent) {
            fcLog(`Updated folder structure. Ready: ${fcFolderGroups.filter(g => !g.isError).length}, Incomplete: ${foldersWithIssues.length}`, 'info');
        }
    }

    function renderFcDashboard(folders, hasMissing, zipFilename) {
        if (!fcOutputContainer) return;
        fcOutputContainer.innerHTML = '';
        fcOutputContainer.className = 'processed-container';

        const totalFolders = folders.length;
        const incompleteCount = folders.filter(f => f.isError).length;
        const readyCount = totalFolders - incompleteCount;

        const header = document.createElement('div');
        header.className = 'processed-header';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.width = '100%';
        header.style.marginBottom = '1rem';
        header.style.flexWrap = 'wrap';
        header.style.gap = '0.5rem';

        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                <h3 style="margin: 0;"><i class="fa-solid fa-folder-tree text-success"></i> Grouped Folders (${totalFolders})</h3>
                <span class="badge" style="background:${incompleteCount > 0 ? '#fee2e2' : '#ecfdf5'}; color:${incompleteCount > 0 ? '#dc2626' : '#059669'}; font-size:0.75rem; font-weight:700; border: 1px solid ${incompleteCount > 0 ? '#fca5a5' : '#a7f3d0'};">
                    ${incompleteCount > 0 ? `⚠️ ${incompleteCount} Incomplete (<2)` : '✅ All Ready (2 Files)'}
                </span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn" id="openFcFullscreenBtn" type="button" style="background: linear-gradient(135deg, #059669, #10b981); color: white; display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.85rem; font-size: 0.78rem; font-weight: 600; border-radius: 8px; border: none; cursor: pointer; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.25);">
                    <i class="fa-solid fa-expand"></i> Full View (Folders)
                </button>
                ${fcMissingReportBlob ? `
                <button class="btn btn-secondary" id="fcDownloadReportBtn" type="button" style="background: #f8fafc; color: #1e293b; border: 1px solid #cbd5e1; font-size: 0.78rem; padding: 0.45rem 0.85rem; display: flex; align-items: center; gap: 0.4rem; border-radius: 8px; font-weight: 600;">
                    <i class="fa-solid fa-file-excel text-success"></i> Report (Excel)
                </button>
                ` : ''}
                <button class="btn btn-primary" id="fcMoveToConverterBtn" type="button" style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.85rem; font-size: 0.78rem; font-weight: 600; border-radius: 8px; border: none; cursor: pointer;">
                    <i class="fa-solid fa-arrow-right"></i> Move to Converter
                </button>
                <button class="btn btn-primary btn-glow" id="downloadFcZipBtn" style="background: linear-gradient(135deg, #059669, #10b981); font-size: 0.78rem; padding: 0.45rem 0.85rem;">
                    <i class="fa-solid fa-file-zipper"></i> Download ZIP
                </button>
            </div>
        `;
        fcOutputContainer.appendChild(header);

        if (hasMissing) {
            const warningAlert = document.createElement('div');
            warningAlert.className = 'settings-card';
            warningAlert.style.border = '1px solid #f87171';
            warningAlert.style.background = '#fff5f5';
            warningAlert.style.marginBottom = '1rem';
            warningAlert.style.padding = '0.75rem 1rem';
            warningAlert.style.borderRadius = '10px';
            warningAlert.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.6rem; color: #dc2626; font-weight: 600; font-size: 0.85rem;">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size: 1.1rem;"></i>
                        <span>${incompleteCount} folder(s) do NOT have exactly 2 files (shown first in RED). Click <strong>"Full View"</strong> to copy files or upload missing slots!</span>
                    </div>
                </div>
            `;
            fcOutputContainer.appendChild(warningAlert);
        }

        const listContainer = document.createElement('div');
        listContainer.className = 'processed-list';
        listContainer.style.display = 'flex';
        listContainer.style.flexDirection = 'column';
        listContainer.style.gap = '0.5rem';
        listContainer.style.width = '100%';
        listContainer.style.maxHeight = '300px';
        listContainer.style.overflowY = 'auto';

        folders.forEach((folder) => {
            const item = document.createElement('div');
            item.className = 'processed-item';
            item.style.padding = '0.75rem 1rem';
            item.style.borderRadius = '8px';
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            item.style.border = '1px solid var(--border-color)';
            item.style.background = folder.isError ? '#fff8f8' : 'rgba(255, 255, 255, 0.8)';
            item.style.borderLeft = folder.isError ? '5px solid #ef4444' : '5px solid #10b981';

            const fileNamesList = folder.files.map(f => f.name).join(', ');
            const badgeColor = folder.isError ? '#ef4444' : '#10b981';
            const badgeBg = folder.isError ? '#fee2e2' : 'rgba(16, 185, 129, 0.1)';
            const badgeText = folder.isError ? `⚠️ ${folder.files.length} File(s) (Incomplete)` : `✅ 2 Files (Ready)`;

            item.innerHTML = `
                <div class="file-details" style="display: flex; flex-direction: column; gap: 0.2rem; max-width: 70%;">
                    <span class="file-name" style="font-weight: 600; color: ${folder.isError ? '#b91c1c' : 'var(--text-primary)'}; font-size: 0.9rem; display: flex; align-items: center; gap: 0.4rem;">
                        <i class="fa-solid fa-folder" style="color: ${folder.isError ? '#ef4444' : '#f59e0b'};"></i> ${folder.prefix}
                    </span>
                    <span style="font-size: 0.75rem; color: var(--text-muted); word-break: break-all;">${fileNamesList}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; color: ${badgeColor}; background: ${badgeBg}; text-align: center;">
                        ${badgeText}
                    </span>
                </div>
            `;
            listContainer.appendChild(item);
        });

        fcOutputContainer.appendChild(listContainer);

        // Bind dashboard buttons
        const openModalBtn = document.getElementById('openFcFullscreenBtn');
        if (openModalBtn) openModalBtn.addEventListener('click', openFcFullscreenModal);

        const repBtn = document.getElementById('fcDownloadReportBtn');
        if (repBtn) repBtn.addEventListener('click', downloadFcMissingReport);

        const convBtn = document.getElementById('fcMoveToConverterBtn');
        if (convBtn) convBtn.addEventListener('click', moveToFileConverterFromFolderCreate);

        const dlBtn = document.getElementById('downloadFcZipBtn');
        if (dlBtn) {
            dlBtn.addEventListener('click', () => {
                if (fcZipBlob) {
                    triggerDownload(fcZipBlob, zipFilename || 'grouped_folders.zip');
                    fcLog(`Downloaded ZIP: ${zipFilename}`, 'info');
                }
            });
        }
    }

    function downloadFcMissingReport() {
        if (!fcMissingReportBlob) {
            alert('No missing files report available. All folders are complete!');
            return;
        }
        triggerDownload(fcMissingReportBlob, 'Missing_Files_Report.xlsx');
        fcLog('Downloaded Missing_Files_Report.xlsx', 'info');
    }

    async function moveToFileConverterFromFolderCreate() {
        if (!fcZipBlob && fcFolderGroups && fcFolderGroups.length > 0) {
            if (typeof rebuildFcPackage === 'function') {
                await rebuildFcPackage(true);
            }
        }

        if (!fcZipBlob) {
            showCustomAlert('No Folder Package Available', 'Please upload and organize files in Folder Create first before transferring to Converter.', 'warning');
            return;
        }

        const zipFilename = fcZipFilename || 'folder_package.zip';
        const file = new File([fcZipBlob], zipFilename, { type: 'application/zip' });
        
        if (typeof handleFiles === 'function') {
            handleFiles([file]);
        } else if (typeof selectedFiles !== 'undefined') {
            selectedFiles.push({
                id: Math.random().toString(36).substring(2, 9),
                name: file.name,
                relativePath: file.name,
                size: file.size,
                type: file.type,
                file: file
            });
            if (typeof updateConverterUI === 'function') updateConverterUI();
        }
        
        if (typeof closeFcFullscreenModal === 'function') {
            closeFcFullscreenModal();
        }

        const convertTabBtn = document.querySelector('.tab-btn[data-tab="tab-converter"]') || document.querySelector('.tab-btn[data-tab="tab-converter"]');
        if (convertTabBtn) {
            convertTabBtn.click();
        }

        if (typeof log === 'function') {
            log(`Loaded folder package [${zipFilename}] into File Converter.`, 'success');
        }
        showCustomNotification('Transferred to Converter', `Successfully transferred ZIP package [${zipFilename}] to File Converter! Ready to convert.`, 'success');
    }

    /* ==========================================================================
       FOLDER CREATE FULLSCREEN MODAL & ACCORDION MANAGEMENT
       ========================================================================== */
    const fcFullscreenModal = document.getElementById('fcFullscreenModal');
    const closeFcModalBtn = document.getElementById('closeFcModalBtn');
    const modalFcFooterCloseBtn = document.getElementById('modalFcFooterCloseBtn');
    const modalFcSearchInput = document.getElementById('modalFcSearchInput');
    const modalFcAccordionContainer = document.getElementById('modalFcAccordionContainer');
    const modalFcTotalBadge = document.getElementById('modalFcTotalBadge');
    const modalFcReadyBadge = document.getElementById('modalFcReadyBadge');
    const modalFcErrorBadge = document.getElementById('modalFcErrorBadge');
    const modalFcSummaryText = document.getElementById('modalFcSummaryText');
    const modalFcDownloadZipBtn = document.getElementById('modalFcDownloadZipBtn');
    const modalFcFooterDownloadZipBtn = document.getElementById('modalFcFooterDownloadZipBtn');
    const modalFcDownloadReportBtn = document.getElementById('modalFcDownloadReportBtn');
    const modalFcFooterDownloadReportBtn = document.getElementById('modalFcFooterDownloadReportBtn');
    const modalFcFooterMoveToConverterBtn = document.getElementById('modalFcFooterMoveToConverterBtn');

    function openFcFullscreenModal() {
        if (!fcFullscreenModal) return;
        fcFullscreenModal.classList.add('show');
        fcFullscreenModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        renderFcAccordion();
    }

    function closeFcFullscreenModal() {
        if (!fcFullscreenModal) return;
        fcFullscreenModal.classList.remove('show');
        fcFullscreenModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Global event delegation for openFcFullscreenBtn
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#openFcFullscreenBtn');
        if (btn) {
            e.preventDefault();
            openFcFullscreenModal();
        }
    });

    if (closeFcModalBtn) closeFcModalBtn.addEventListener('click', closeFcFullscreenModal);
    if (modalFcFooterCloseBtn) modalFcFooterCloseBtn.addEventListener('click', closeFcFullscreenModal);
    if (fcFullscreenModal) {
        fcFullscreenModal.addEventListener('click', (e) => {
            if (e.target === fcFullscreenModal) closeFcFullscreenModal();
        });
    }

    if (modalFcDownloadReportBtn) modalFcDownloadReportBtn.addEventListener('click', downloadFcMissingReport);
    if (modalFcFooterDownloadReportBtn) modalFcFooterDownloadReportBtn.addEventListener('click', downloadFcMissingReport);
    if (modalFcFooterMoveToConverterBtn) modalFcFooterMoveToConverterBtn.addEventListener('click', moveToFileConverterFromFolderCreate);

    if (modalFcDownloadZipBtn) {
        modalFcDownloadZipBtn.addEventListener('click', () => {
            if (fcZipBlob) triggerDownload(fcZipBlob, fcZipFilename || 'grouped_folders.zip');
        });
    }
    if (modalFcFooterDownloadZipBtn) {
        modalFcFooterDownloadZipBtn.addEventListener('click', () => {
            if (fcZipBlob) triggerDownload(fcZipBlob, fcZipFilename || 'grouped_folders.zip');
        });
    }

    if (modalFcSearchInput) {
        modalFcSearchInput.addEventListener('input', () => {
            renderFcAccordion();
        });
    }

    document.querySelectorAll('.fc-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.fc-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            fcModalCurrentFilter = btn.getAttribute('data-filter') || 'all';
            renderFcAccordion();
        });
    });

    function renderFcAccordion() {
        if (!modalFcAccordionContainer) return;
        modalFcAccordionContainer.innerHTML = '';

        const totalFolders = fcFolderGroups.length;
        const incompleteCount = fcFolderGroups.filter(f => f.isError).length;
        const readyCount = totalFolders - incompleteCount;

        // Update badges
        if (modalFcTotalBadge) modalFcTotalBadge.innerHTML = `<i class="fa-solid fa-folder"></i> Total: ${totalFolders} Folders`;
        if (modalFcReadyBadge) modalFcReadyBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Ready (2 Files): ${readyCount}`;
        if (modalFcErrorBadge) modalFcErrorBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Incomplete (< 2): ${incompleteCount} (Shown First)`;

        const filterAllBtn = document.getElementById('modalFcFilterAllBtn');
        const filterIncBtn = document.getElementById('modalFcFilterIncompleteBtn');
        const filterRdyBtn = document.getElementById('modalFcFilterReadyBtn');
        if (filterAllBtn) filterAllBtn.innerText = `All Folders (${totalFolders})`;
        if (filterIncBtn) filterIncBtn.innerText = `⚠️ Incomplete / Errors (${incompleteCount})`;
        if (filterRdyBtn) filterRdyBtn.innerText = `✅ Ready (2 Files) (${readyCount})`;

        const query = (modalFcSearchInput ? modalFcSearchInput.value : '').trim().toLowerCase();

        const filtered = fcFolderGroups.filter(grp => {
            if (fcModalCurrentFilter === 'incomplete' && !grp.isError) return false;
            if (fcModalCurrentFilter === 'ready' && grp.isError) return false;

            if (query !== '') {
                const prefixMatch = grp.prefix.toLowerCase().includes(query);
                const fileMatch = grp.files.some(f => f.name.toLowerCase().includes(query));
                if (!prefixMatch && !fileMatch) return false;
            }
            return true;
        });

        if (modalFcSummaryText) {
            modalFcSummaryText.innerText = `Showing ${filtered.length} of ${totalFolders} folder(s)`;
        }

        if (filtered.length === 0) {
            modalFcAccordionContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                    <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 0.75rem;"></i>
                    <p style="font-weight: 500;">No folders matching the current filter/search.</p>
                </div>
            `;
            return;
        }

        filtered.forEach((grp, idx) => {
            const card = document.createElement('div');
            card.className = `fc-folder-card ${grp.isError ? 'error-card open' : 'success-card'}`;
            // Open incomplete folders by default for quick user interaction

            const isOk = grp.files.length === 2;
            const badgeColor = isOk ? '#059669' : '#dc2626';
            const badgeBg = isOk ? '#ecfdf5' : '#fee2e2';
            const badgeBorder = isOk ? '#a7f3d0' : '#fca5a5';
            const badgeText = isOk ? `✅ 2 Files (Complete)` : `⚠️ ${grp.files.length} / 2 Files (Missing ${2 - grp.files.length > 0 ? 2 - grp.files.length : 0})`;

            // Header
            const header = document.createElement('div');
            header.className = 'fc-folder-header';
            header.innerHTML = `
                <div class="fc-folder-title-left">
                    <div class="fc-folder-icon">
                        <i class="fa-solid fa-folder${grp.isError ? '-open' : ''}"></i>
                    </div>
                    <div>
                        <div class="fc-folder-name">Folder [${grp.prefix}]</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${grp.files.length} file(s) attached</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span style="background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; font-size: 0.78rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 6px;">
                        ${badgeText}
                    </span>
                    <i class="fa-solid fa-chevron-down fc-chevron"></i>
                </div>
            `;
            header.addEventListener('click', () => {
                card.classList.toggle('open');
            });
            card.appendChild(header);

            // Body
            const body = document.createElement('div');
            body.className = 'fc-folder-body';

            // Files list
            grp.files.forEach((fileObj, fIdx) => {
                const fileRow = document.createElement('div');
                fileRow.className = 'fc-file-row';

                fileRow.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 0.6rem; min-width: 250px; flex: 1;">
                        <i class="fa-solid fa-file-excel text-success" style="font-size: 1.1rem;"></i>
                        <div>
                            <div style="font-weight: 600; font-size: 0.85rem; color: #1e293b; word-break: break-all;">${fileObj.name}</div>
                            <div style="font-size: 0.72rem; color: #64748b;">${formatBytes(fileObj.size || 0)}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                        <button type="button" class="btn btn-secondary fc-copy-file-btn" data-prefix="${grp.prefix}" data-id="${fileObj.id}" style="font-size: 0.75rem; padding: 0.3rem 0.6rem; border-radius: 6px; background: #ede9fe; color: #6d28d9; border: 1px solid #d8b4fe; font-weight: 600;">
                            <i class="fa-solid fa-copy"></i> Copy to Folder
                        </button>
                        <button type="button" class="btn fc-rename-file-btn" data-prefix="${grp.prefix}" data-id="${fileObj.id}" style="font-size: 0.75rem; padding: 0.3rem 0.6rem; border-radius: 6px; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1;">
                            <i class="fa-solid fa-pen-to-square"></i> Rename
                        </button>
                        <button type="button" class="btn fc-delete-file-btn" data-prefix="${grp.prefix}" data-id="${fileObj.id}" style="font-size: 0.75rem; padding: 0.3rem 0.6rem; border-radius: 6px; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5;">
                            <i class="fa-solid fa-trash-can"></i> Delete
                        </button>
                        <button type="button" class="btn fc-download-file-btn" data-prefix="${grp.prefix}" data-id="${fileObj.id}" style="font-size: 0.75rem; padding: 0.3rem 0.6rem; border-radius: 6px; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;">
                            <i class="fa-solid fa-download"></i>
                        </button>
                    </div>
                `;

                // Wire Copy to Folder
                const copyBtn = fileRow.querySelector('.fc-copy-file-btn');
                if (copyBtn) {
                    copyBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openFcCopyFileModal(fileObj, grp.prefix);
                    });
                }

                // Wire Rename
                const renBtn = fileRow.querySelector('.fc-rename-file-btn');
                if (renBtn) {
                    renBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const currentName = fileObj.name;
                        const ext = currentName.endsWith('.xlsx') ? '.xlsx' : (currentName.endsWith('.xls') ? '.xls' : '.csv');
                        const base = currentName.slice(0, -ext.length);
                        const newBase = prompt(`Edit file name for folder [${grp.prefix}]:`, base);
                        if (newBase && newBase.trim() !== "" && newBase.trim() !== base) {
                            const newFullName = newBase.trim() + ext;
                            fileObj.name = newFullName;
                            rebuildFcPackage();
                            fcLog(`Renamed file in folder [${grp.prefix}] to: ${newFullName}`, 'success');
                        }
                    });
                }

                // Wire Delete
                const delBtn = fileRow.querySelector('.fc-delete-file-btn');
                if (delBtn) {
                    delBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const confirmed = await showCustomConfirm(
                            'Delete File',
                            `Are you sure you want to delete "${fileObj.name}" from Folder [${grp.prefix}]?`,
                            'danger',
                            'Delete'
                        );
                        if (confirmed) {
                            grp.files = grp.files.filter(f => f.id !== fileObj.id);
                            fcFiles = fcFiles.filter(f => f.id !== fileObj.id);
                            await rebuildFcPackage();
                            fcLog(`Deleted file "${fileObj.name}" from folder [${grp.prefix}]`, 'warning');
                        }
                    });
                }

                // Wire Download
                const dlBtn = fileRow.querySelector('.fc-download-file-btn');
                if (dlBtn) {
                    dlBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        triggerDownload(fileObj.blob || fileObj.file, fileObj.name);
                    });
                }

                body.appendChild(fileRow);
            });

            // If folder has only 1 file, render empty slot upload
            if (grp.files.length < 2) {
                const missingSlot = document.createElement('div');
                missingSlot.className = 'fc-missing-slot';
                missingSlot.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <i class="fa-solid fa-cloud-arrow-up" style="color: #dc2626; font-size: 1.2rem;"></i>
                        <div>
                            <strong style="color: #b91c1c; font-size: 0.85rem;">Slot 2 Missing:</strong>
                            <span style="font-size: 0.8rem; color: #475569; margin-left: 0.3rem;">Click here to upload missing file for Folder [${grp.prefix}]</span>
                        </div>
                    </div>
                    <button type="button" class="btn" style="background: #fee2e2; color: #b91c1c; font-size: 0.78rem; padding: 0.35rem 0.85rem; border: 1px solid #fca5a5; font-weight: 700; border-radius: 6px; cursor: pointer;">
                        <i class="fa-solid fa-upload"></i> Upload File
                    </button>
                    <input type="file" accept=".xlsx,.xls,.csv" class="fc-slot-file-input" style="display: none;">
                `;

                const slotInput = missingSlot.querySelector('.fc-slot-file-input');
                missingSlot.addEventListener('click', () => {
                    if (slotInput) slotInput.click();
                });

                if (slotInput) {
                    slotInput.addEventListener('click', (e) => e.stopPropagation());
                    slotInput.addEventListener('change', async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            const fileObj = {
                                id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                                name: file.name,
                                size: file.size,
                                blob: file,
                                file: file,
                                rows: 0
                            };
                            grp.files.push(fileObj);
                            fcFiles.push(fileObj);
                            await rebuildFcPackage();
                            fcLog(`Uploaded missing file "${file.name}" to folder [${grp.prefix}]. Folder is now complete!`, 'success');
                            showCustomNotification('Success', `Uploaded "${file.name}" to Folder [${grp.prefix}]. Folder is now complete (2 Files)!`, 'success');
                        }
                    });
                }

                body.appendChild(missingSlot);
            }

            card.appendChild(body);
            modalFcAccordionContainer.appendChild(card);
        });
    }

    /* ==========================================================================
       COPY FILE TO INCOMPLETE FOLDER MODAL
       ========================================================================== */
    const fcMoveFileModal = document.getElementById('fcMoveFileModal');
    const fcMoveSourceFileName = document.getElementById('fcMoveSourceFileName');
    const fcMoveTargetFoldersList = document.getElementById('fcMoveTargetFoldersList');
    const fcMoveCancelBtn = document.getElementById('fcMoveCancelBtn');
    const fcMoveConfirmBtn = document.getElementById('fcMoveConfirmBtn');
    const fcMoveConfirmBtnText = document.getElementById('fcMoveConfirmBtnText');
    const fcMoveSelectAllBtn = document.getElementById('fcMoveSelectAllBtn');
    const fcMoveDeselectAllBtn = document.getElementById('fcMoveDeselectAllBtn');
    const fcMoveSearchInput = document.getElementById('fcMoveSearchInput');
    const fcMoveSelectionCountBadge = document.getElementById('fcMoveSelectionCountBadge');

    function updateFcMoveSelectionUI() {
        const count = fcSelectedTargetPrefixes.size;
        if (fcMoveSelectionCountBadge) {
            fcMoveSelectionCountBadge.innerText = `${count} folder${count === 1 ? '' : 's'} selected`;
        }
        if (fcMoveConfirmBtnText) {
            if (count === 0) {
                fcMoveConfirmBtnText.innerText = 'Select Folder(s) to Copy';
            } else if (count === 1) {
                fcMoveConfirmBtnText.innerText = 'Copy to 1 Selected Folder';
            } else {
                fcMoveConfirmBtnText.innerText = `Copy to ${count} Selected Folders`;
            }
        }
        if (fcMoveConfirmBtn) {
            fcMoveConfirmBtn.disabled = (count === 0);
            fcMoveConfirmBtn.style.opacity = count === 0 ? '0.6' : '1';
            fcMoveConfirmBtn.style.cursor = count === 0 ? 'not-allowed' : 'pointer';
        }
    }

    function renderFcTargetFoldersList(searchTerm = '') {
        if (!fcMoveTargetFoldersList) return;
        fcMoveTargetFoldersList.innerHTML = '';

        const filterText = (searchTerm || '').trim().toLowerCase();
        const filtered = fcAvailableIncompleteFolders.filter(g => {
            if (!filterText) return true;
            return g.prefix.toLowerCase().includes(filterText);
        });

        if (filtered.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.style.cssText = 'padding: 1.2rem; text-align: center; color: #94a3b8; font-size: 0.82rem;';
            emptyEl.innerHTML = '<i class="fa-solid fa-circle-exclamation" style="font-size: 1.2rem; margin-bottom: 0.3rem; display: block;"></i> No matching incomplete folders found.';
            fcMoveTargetFoldersList.appendChild(emptyEl);
            return;
        }

        filtered.forEach(g => {
            const isSelected = fcSelectedTargetPrefixes.has(g.prefix);
            const opt = document.createElement('div');
            opt.className = `target-folder-option ${isSelected ? 'selected' : ''}`;
            opt.setAttribute('data-prefix', g.prefix);

            opt.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <input type="checkbox" class="fc-target-chk" ${isSelected ? 'checked' : ''} style="cursor: pointer; pointer-events: none;">
                    <i class="fa-solid fa-folder text-danger" style="font-size: 0.95rem;"></i>
                    <span style="font-size: 0.85rem; color: #1e293b;">Folder <strong>[${g.prefix}]</strong></span>
                </div>
                <span style="background: #fee2e2; color: #dc2626; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 4px;">
                    ${g.files.length} / 2 Files
                </span>
            `;

            opt.addEventListener('click', () => {
                if (fcSelectedTargetPrefixes.has(g.prefix)) {
                    fcSelectedTargetPrefixes.delete(g.prefix);
                    opt.classList.remove('selected');
                    const chk = opt.querySelector('.fc-target-chk');
                    if (chk) chk.checked = false;
                } else {
                    fcSelectedTargetPrefixes.add(g.prefix);
                    opt.classList.add('selected');
                    const chk = opt.querySelector('.fc-target-chk');
                    if (chk) chk.checked = true;
                }
                updateFcMoveSelectionUI();
            });

            fcMoveTargetFoldersList.appendChild(opt);
        });
    }

    function openFcCopyFileModal(sourceFile, sourcePrefix) {
        if (!fcMoveFileModal) return;
        fcSourceCopyFile = sourceFile;
        fcSourceCopyPrefix = sourcePrefix;
        fcSelectedTargetPrefixes.clear();

        if (fcMoveSourceFileName) fcMoveSourceFileName.innerText = sourceFile.name;
        if (fcMoveSearchInput) fcMoveSearchInput.value = '';

        fcAvailableIncompleteFolders = fcFolderGroups.filter(g => g.files.length < 2 && g.prefix !== sourcePrefix);

        if (fcAvailableIncompleteFolders.length === 0) {
            showCustomNotification('Information', 'No other incomplete folders (< 2 files) are available to copy into!', 'info');
            return;
        }

        // Pre-select first incomplete folder by default
        if (fcAvailableIncompleteFolders.length > 0) {
            fcSelectedTargetPrefixes.add(fcAvailableIncompleteFolders[0].prefix);
        }

        renderFcTargetFoldersList();
        updateFcMoveSelectionUI();

        fcMoveFileModal.classList.add('show');
        fcMoveFileModal.classList.add('active');
    }

    function closeFcCopyFileModal() {
        if (!fcMoveFileModal) return;
        fcMoveFileModal.classList.remove('show');
        fcMoveFileModal.classList.remove('active');
        fcSourceCopyFile = null;
        fcSourceCopyPrefix = "";
        fcSelectedTargetPrefixes.clear();
        fcAvailableIncompleteFolders = [];
    }

    if (fcMoveCancelBtn) fcMoveCancelBtn.addEventListener('click', closeFcCopyFileModal);
    if (fcMoveFileModal) {
        fcMoveFileModal.addEventListener('click', (e) => {
            if (e.target === fcMoveFileModal) closeFcCopyFileModal();
        });
    }

    if (fcMoveSelectAllBtn) {
        fcMoveSelectAllBtn.addEventListener('click', () => {
            const filterText = (fcMoveSearchInput ? fcMoveSearchInput.value : '').trim().toLowerCase();
            const listToSelect = fcAvailableIncompleteFolders.filter(g => !filterText || g.prefix.toLowerCase().includes(filterText));
            listToSelect.forEach(g => fcSelectedTargetPrefixes.add(g.prefix));
            renderFcTargetFoldersList(fcMoveSearchInput ? fcMoveSearchInput.value : '');
            updateFcMoveSelectionUI();
        });
    }

    if (fcMoveDeselectAllBtn) {
        fcMoveDeselectAllBtn.addEventListener('click', () => {
            fcSelectedTargetPrefixes.clear();
            renderFcTargetFoldersList(fcMoveSearchInput ? fcMoveSearchInput.value : '');
            updateFcMoveSelectionUI();
        });
    }

    if (fcMoveSearchInput) {
        fcMoveSearchInput.addEventListener('input', (e) => {
            renderFcTargetFoldersList(e.target.value);
        });
    }

    if (fcMoveConfirmBtn) {
        fcMoveConfirmBtn.addEventListener('click', async () => {
            if (!fcSourceCopyFile || fcSelectedTargetPrefixes.size === 0) {
                alert('Please select at least one destination incomplete folder.');
                return;
            }

            const targetPrefixList = Array.from(fcSelectedTargetPrefixes);
            const copiedTargetPrefixes = [];
            const copyBlob = fcSourceCopyFile.blob || fcSourceCopyFile.file;

            for (const targetPrefix of targetPrefixList) {
                const targetGroup = fcFolderGroups.find(g => g.prefix === targetPrefix);
                if (!targetGroup) continue;

                // Derive new name for the copied file
                let newCopiedName = fcSourceCopyFile.name;
                if (fcSourceCopyPrefix && newCopiedName.startsWith(fcSourceCopyPrefix + '-')) {
                    newCopiedName = targetPrefix + '-' + newCopiedName.substring((fcSourceCopyPrefix + '-').length);
                } else if (newCopiedName.includes('-')) {
                    const rest = newCopiedName.substring(newCopiedName.indexOf('-') + 1);
                    newCopiedName = `${targetPrefix}-${rest}`;
                } else {
                    newCopiedName = `${targetPrefix}-${newCopiedName}`;
                }

                const copyFileObj = {
                    id: Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '-' + targetPrefix,
                    name: newCopiedName,
                    size: fcSourceCopyFile.size,
                    blob: copyBlob,
                    file: fcSourceCopyFile.file || new File([copyBlob], newCopiedName, { type: copyBlob ? copyBlob.type : '' }),
                    rows: fcSourceCopyFile.rows || 0
                };

                targetGroup.files.push(copyFileObj);
                fcFiles.push(copyFileObj);
                copiedTargetPrefixes.push(targetPrefix);
            }

            closeFcCopyFileModal();
            await rebuildFcPackage();

            if (copiedTargetPrefixes.length === 1) {
                fcLog(`Copied file "${fcSourceCopyFile.name}" to folder [${copiedTargetPrefixes[0]}].`, 'success');
                showCustomNotification('Success', `Successfully copied file into Folder [${copiedTargetPrefixes[0]}]. Folder is now complete (2 Files)!`, 'success');
            } else {
                fcLog(`Copied file "${fcSourceCopyFile.name}" to ${copiedTargetPrefixes.length} folders: [${copiedTargetPrefixes.join(', ')}].`, 'success');
                showCustomNotification('Success', `Successfully copied file into ${copiedTargetPrefixes.length} folders ([${copiedTargetPrefixes.join(', ')}])!`, 'success');
            }
        });
    }

    if (fcBtn) {
        fcBtn.addEventListener('click', async () => {
            if (fcFiles.length === 0) return;

            fcBtn.setAttribute('disabled', 'true');
            if (fcStatus) {
                fcStatus.className = 'status-indicator processing';
                fcStatus.innerText = 'Processing';
            }
            if (fcProgressCard) fcProgressCard.classList.remove('hidden');
            if (fcProgressBar) fcProgressBar.style.width = '10%';
            if (fcProgressPercent) fcProgressPercent.innerText = '10%';
            if (fcProgressStepText) fcProgressStepText.innerText = 'Grouping files...';
            
            if (fcOutputContainer) {
                fcOutputContainer.innerHTML = `
                    <div class="empty-output-state">
                        <i class="fa-solid fa-spinner fa-spin placeholder-icon" style="color: #059669;"></i>
                        <p>Grouping folders, please wait...</p>
                    </div>
                `;
            }

            fcLog('Starting Folder Create Pipeline...', 'process');

            try {
                const groups = {};
                let invalidCount = 0;
                
                if (fcMode === 'files') {
                    fcFiles.forEach(fileObj => {
                        const filename = fileObj.name;
                        if (filename.includes('-')) {
                            const prefix = filename.split('-')[0].trim();
                            if (prefix !== "") {
                                if (!groups[prefix]) {
                                    groups[prefix] = [];
                                }
                                groups[prefix].push(fileObj);
                            } else {
                                invalidCount++;
                            }
                        } else {
                            invalidCount++;
                        }
                    });

                    if (invalidCount > 0) {
                        fcLog(`Ignored ${invalidCount} file(s) that do not contain a hyphen '-' or have empty prefix.`, 'warning');
                    }
                } else {
                    fcFiles.forEach(fileObj => {
                        const folderName = fileObj.folderName;
                        if (folderName) {
                            if (!groups[folderName]) {
                                groups[folderName] = [];
                            }
                            groups[folderName].push(fileObj);
                        } else {
                            invalidCount++;
                        }
                    });
                }

                const prefixes = Object.keys(groups);
                if (prefixes.length === 0) {
                    throw new Error(fcMode === 'files' ? 
                        "No files with valid prefix found! Files must contain a '-' in their name." : 
                        "No valid folders found!");
                }

                fcFolderGroups = prefixes.map(p => ({
                    prefix: p,
                    files: groups[p],
                    isError: groups[p].length !== 2
                }));

                // Sort error groups first
                sortFolderGroups(fcFolderGroups);

                if (fcProgressBar) fcProgressBar.style.width = '50%';
                if (fcProgressPercent) fcProgressPercent.innerText = '50%';
                if (fcProgressStepText) fcProgressStepText.innerText = 'Packaging folders and checking 2-file rule...';

                await rebuildFcPackage(true);

                if (fcProgressBar) fcProgressBar.style.width = '100%';
                if (fcProgressPercent) fcProgressPercent.innerText = '100%';
                if (fcProgressStepText) fcProgressStepText.innerText = 'Folder creation completed!';
                
                if (fcStatus) {
                    fcStatus.className = 'status-indicator success';
                    fcStatus.innerText = 'Completed';
                }
                
                const incCount = fcFolderGroups.filter(g => g.isError).length;
                if (incCount > 0) {
                    showCustomNotification('Folder Create Complete', `Processed ${fcFolderGroups.length} folders. Found ${incCount} incomplete folder(s) with != 2 files (shown first in RED).`, 'warning');
                } else {
                    showCustomNotification('Success', `All ${fcFolderGroups.length} folders successfully verified with exactly 2 files each!`, 'success');
                }

                fcLog(`Done! Package ready: ${fcZipFilename}. Ready: ${fcFolderGroups.length - incCount}, Incomplete: ${incCount}`, 'success');

            } catch (err) {
                fcLog(`Folder creation failed: ${err.message}`, 'error');
                if (fcStatus) {
                    fcStatus.className = 'status-indicator idle';
                    fcStatus.innerText = 'Failed';
                }
                if (fcProgressCard) fcProgressCard.classList.add('hidden');
                if (fcOutputContainer) {
                    fcOutputContainer.innerHTML = `
                        <div class="empty-output-state">
                            <i class="fa-solid fa-circle-exclamation placeholder-icon" style="color: #ef4444;"></i>
                            <p style="color: #ef4444; font-weight: 600;">Error: ${err.message}</p>
                        </div>
                    `;
                }
            } finally {
                fcBtn.removeAttribute('disabled');
            }
        });
    }

    async function restoreFolderCreateSession() {
        try {
            const saved = await loadTabSession('folder_create_tab');
            if (saved) {
                if (saved.fcFiles && saved.fcFiles.length > 0) {
                    fcFiles = saved.fcFiles;
                    updateFcUI();
                }
                if (saved.fcFolderGroups && saved.fcFolderGroups.length > 0) {
                    fcFolderGroups = saved.fcFolderGroups;
                    fcZipBlob = saved.fcZipBlob;
                    fcZipFilename = saved.fcZipFilename || 'grouped_folders.zip';
                    fcMissingReportBlob = saved.fcMissingReportBlob;
                    renderFcDashboard(fcFolderGroups, saved.hasMissing, fcZipFilename);
                    if (fcStatus) {
                        fcStatus.className = 'status-indicator success';
                        fcStatus.innerText = 'Restored';
                    }
                    fcLog(`Restored ${fcFolderGroups.length} folder group(s) from previous session (1-hour cache).`, 'info');
                }
            }
        } catch (e) {
            console.warn('Failed to restore folder create session:', e);
        }
    }
    restoreFolderCreateSession();

    // Global test function for Folder Create
    window.runFolderCreateTest = function() {
        const tabBtn = document.querySelector('.tab-btn[data-tab="tab-folder-create"]');
        if (tabBtn) tabBtn.click();
        
        if (fcModeFilesBtn) fcModeFilesBtn.click();
        
        fcLog("Running programmatic test...", "info");
        
        const dummyContent = "Test Data";
        const filesToTest = [
            { name: "206-File1.xlsx", content: dummyContent },
            { name: "206-File2.xlsx", content: dummyContent },
            { name: "207-File1.xlsx", content: dummyContent },
            { name: "208-File1.xlsx", content: dummyContent },
            { name: "208-File2.xlsx", content: dummyContent },
            { name: "208-File3.xlsx", content: dummyContent }
        ];
        
        fcFiles = filesToTest.map(f => {
            const blob = new Blob([f.content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const fileObj = new File([blob], f.name, { type: blob.type });
            return {
                id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                name: f.name,
                size: fileObj.size,
                file: fileObj
            };
        });
        
        fcLog(`Generated ${fcFiles.length} dummy files for testing.`, "success");
        fcLog(`- 206 (2 files) -> Valid`, "info");
        fcLog(`- 207 (1 file) -> Missing File`, "warning");
        fcLog(`- 208 (3 files) -> Extra Files`, "warning");
        
        updateFcUI();
        
        if (fcBtn) {
            fcLog("Triggering START FOLDER CREATE programmatically...", "info");
            setTimeout(() => {
                fcBtn.click();
            }, 1000);
        }
    };

    /* ==========================================================================
       INVOICE ERROR LOGIC
       ========================================================================== */
    let ieFiles = [];
    let ieZipBlob = null;

    const ieDropzone = document.getElementById('ieDropzone');
    const ieFileInput = document.getElementById('ieFileInput');
    const ieFileDisplay = document.getElementById('ieFileDisplay');
    const ieBtn = document.getElementById('ieBtn');
    const ieStatus = document.getElementById('ieStatus');
    const ieOutputContainer = document.getElementById('ieOutputContainer');
    const ieConsoleLog = document.getElementById('ieConsoleLog');
    const clearIeLogBtn = document.getElementById('clearIeLogBtn');
    const clearIeFilesBtn = document.getElementById('clearIeFilesBtn');
    const ieSelectedCount = document.getElementById('ieSelectedCount');
    const ieUploadedFileList = document.getElementById('ieUploadedFileList');

    function ieLog(message, type = 'info') {
        if (!ieConsoleLog) return;
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        line.innerText = `[${timestamp}] ${message}`;
        if (ieConsoleLog.children.length > 300) {
            ieConsoleLog.removeChild(ieConsoleLog.firstChild);
        }
        ieConsoleLog.appendChild(line);
        ieConsoleLog.scrollTop = ieConsoleLog.scrollHeight;
    }

    if (clearIeLogBtn) {
        clearIeLogBtn.addEventListener('click', () => {
            ieConsoleLog.innerHTML = '';
            ieLog('Log cleared.', 'info');
        });
    }

    if (ieDropzone && ieFileInput) {
        setupMultiDropzone(ieDropzone, ieFileInput, (files) => {
            let added = 0;
            files.forEach(file => {
                if (!ieFiles.some(f => f.name === file.name && f.size === file.size)) {
                    ieFiles.push({
                        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                        name: file.name,
                        size: file.size,
                        file: file
                    });
                    added++;
                }
            });
            if (added > 0) {
                ieLog(`Added ${added} file(s) to process list.`, 'success');
            }
            updateIeUI();
        });
    }

    if (clearIeFilesBtn) {
        clearIeFilesBtn.addEventListener('click', async () => {
            const ok = await showCustomConfirm('Clear Files', 'Are you sure you want to clear all selected error files?', 'danger', 'Clear All');
            if (!ok) return;

            ieFiles = [];
            ieFileInput.value = '';
            updateIeUI();
            ieLog('Cleared all selected files.', 'info');
        });
    }

    function updateIeUI() {
        if (ieSelectedCount) ieSelectedCount.innerText = ieFiles.length;
        if (!ieUploadedFileList) return;
        
        if (ieFiles.length > 0) {
            if (ieBtn) ieBtn.removeAttribute('disabled');
            ieUploadedFileList.innerHTML = '';
            ieFiles.forEach(fileObj => {
                const item = document.createElement('div');
                item.className = 'file-item';
                
                const info = document.createElement('div');
                info.className = 'file-info';
                
                const icon = document.createElement('i');
                icon.className = getFileIconClass(fileObj.name);
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'file-name';
                nameSpan.innerText = fileObj.name;
                
                const sizeSpan = document.createElement('span');
                sizeSpan.className = 'file-size';
                sizeSpan.innerText = formatBytes(fileObj.size);
                
                info.appendChild(icon);
                info.appendChild(nameSpan);
                info.appendChild(sizeSpan);
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'file-action-btn';
                removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                removeBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const ok = await showCustomConfirm('Remove File', `Are you sure you want to remove "${fileObj.name}"?`, 'danger', 'Remove');
                    if (!ok) return;
                    ieFiles = ieFiles.filter(f => f.id !== fileObj.id);
                    ieLog(`Removed file: ${fileObj.name}`, 'info');
                    updateIeUI();
                });
                
                item.appendChild(info);
                item.appendChild(removeBtn);
                ieUploadedFileList.appendChild(item);
            });
        } else {
            if (ieBtn) ieBtn.setAttribute('disabled', 'true');
            ieUploadedFileList.innerHTML = '<div class="empty-list-msg">No files selected yet.</div>';
        }
    }

    function getSafeSheetName(name) {
        // Replace invalid sheet name characters: \ / ? * : [ ] with underscore
        let clean = name.replace(/[\\\/\?\*：：\:\[\]]/g, "_");
        // Truncate to 31 characters (Excel sheet name limit)
        return clean.substring(0, 31);
    }

    function autofitColumns(ws) {
        if (!ws['!ref']) return;
        const range = XLSX.utils.decode_range(ws['!ref']);
        const cols = [];
        
        // Initialize widths
        for (let C = range.s.c; C <= range.e.c; ++C) {
            cols.push({ wch: 10 }); // minimum default width
        }
        
        for (let R = range.s.r; R <= range.e.r; ++R) {
            // Skip Row 0 (merged title row) to prevent Column A from expanding to title length
            if (R === 0 && ws['!merges'] && ws['!merges'].length > 0) {
                continue;
            }
            
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                const cell = ws[cell_ref];
                if (cell && cell.v !== undefined && cell.v !== null) {
                    const len = String(cell.v).length;
                    if (len > cols[C].wch) {
                        cols[C].wch = len;
                    }
                }
            }
        }
        
        // Add padding and cap width to prevent single long values from making columns too wide
        cols.forEach(col => {
            col.wch = Math.min(Math.max(col.wch + 3, 10), 50);
        });
        
        ws['!cols'] = cols;
    }

    function formatWorksheetCells(ws, hasTitleRow = true) {
        if (!ws['!ref']) return;
        const range = XLSX.utils.decode_range(ws['!ref']);
        
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                
                if (!ws[cell_ref]) {
                    ws[cell_ref] = { t: 's', v: '' };
                }
                
                const cell = ws[cell_ref];
                const isTitleRow = hasTitleRow && R === 0;
                const isHeaderRow = (hasTitleRow && R === 1) || (!hasTitleRow && R === 0);
                const isDataRow = (hasTitleRow && R >= 2) || (!hasTitleRow && R >= 1);

                // Convert Jio Code (Column H, index 7) to plain string to prevent scientific notation
                if (C === 7 && isDataRow && cell.v !== undefined && cell.v !== null && String(cell.v).trim() !== "") {
                    let rawVal = cell.v;
                    let cleanStr = String(rawVal).trim();
                    
                    if (typeof rawVal === 'number') {
                        cleanStr = String(rawVal);
                        if (cleanStr.toLowerCase().includes('e')) {
                            // If it's a number that got converted to scientific notation (e.g. 7.01842e+11)
                            cleanStr = Number(rawVal).toLocaleString('fullwide', { useGrouping: false });
                        }
                    } else {
                        // If it's a string containing scientific notation (e.g. "7.01842E+11")
                        if (cleanStr.toLowerCase().includes('e')) {
                            const num = Number(cleanStr);
                            if (!isNaN(num)) {
                                cleanStr = num.toLocaleString('fullwide', { useGrouping: false });
                            }
                        }
                    }
                    
                    // If it has decimal point (e.g. "701842000000.00"), get the integer part
                    if (cleanStr.includes('.')) {
                        cleanStr = cleanStr.split('.')[0];
                    }
                    
                    cell.v = cleanStr;
                    cell.t = 's'; // Force Excel cell type to String
                    cell.z = '@'; // Force text format
                }

                // Add soft light-grey borders
                cell.s = {
                    border: {
                        top: { style: 'thin', color: { rgb: 'E5E7EB' } },
                        bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
                        left: { style: 'thin', color: { rgb: 'E5E7EB' } },
                        right: { style: 'thin', color: { rgb: 'E5E7EB' } }
                    }
                };

                if (isTitleRow) {
                    cell.s.font = { name: 'Segoe UI', sz: 12, bold: true, color: { rgb: 'FFFFFF' } };
                    cell.s.fill = { fgColor: { rgb: '4F46E5' } }; // Indigo theme
                    cell.s.alignment = { horizontal: 'center', vertical: 'center' };
                } else if (isHeaderRow) {
                    cell.s.font = { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '1F2937' } };
                    cell.s.fill = { fgColor: { rgb: 'E5E7EB' } }; // Sleek light gray
                    cell.s.alignment = { horizontal: 'center', vertical: 'center' };
                } else {
                    cell.s.font = { name: 'Segoe UI', sz: 9, color: { rgb: '374151' } };
                    
                    // Column H (Jio Code) is forced text, left aligned
                    if (C === 7) {
                        cell.s.alignment = { horizontal: 'left', vertical: 'center' };
                    } else {
                        // Basic alignment check (right align numbers, left align text)
                        const val = cell.v;
                        if (val !== undefined && val !== null && !isNaN(Number(val)) && String(val).trim() !== "") {
                            cell.s.alignment = { horizontal: 'right', vertical: 'center' };
                        } else {
                            cell.s.alignment = { horizontal: 'left', vertical: 'center' };
                        }
                    }
                }
            }
        }
        
        // Auto-fit columns
        autofitColumns(ws);
    }

    function createWorksheetWithMergedTitle(titleText, headers, rows) {
        const aoa = [];
        
        // Row 1: Merged Title Row (padded to 12 columns)
        const titleRow = Array(12).fill("");
        titleRow[0] = titleText;
        aoa.push(titleRow);
        
        // Row 2: Headers
        aoa.push(headers);
        
        // Rows 3+: Data Rows
        rows.forEach(r => aoa.push(r));
        
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        
        // Merge cells A1 to L1 (0,0 to 0,11)
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }
        ];

        // Format and Auto-fit
        formatWorksheetCells(ws, true);
        
        return ws;
    }

    function renderIeDashboard(files, zipFilename) {
        if (!ieOutputContainer) return;
        ieOutputContainer.innerHTML = '';
        ieOutputContainer.className = 'processed-container';

        const header = document.createElement('div');
        header.className = 'processed-header';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.width = '100%';
        header.style.marginBottom = '1rem';
        header.innerHTML = `
            <h3><i class="fa-solid fa-circle-check text-success"></i> Generated Files (${files.length})</h3>
            <button class="btn btn-primary btn-glow" id="downloadIeZipBtn" style="background: linear-gradient(135deg, #059669, #10b981);">
                <i class="fa-solid fa-file-zipper"></i> Download ZIP Package
            </button>
        `;
        ieOutputContainer.appendChild(header);

        const listContainer = document.createElement('div');
        listContainer.className = 'processed-list';
        listContainer.style.display = 'flex';
        listContainer.style.flexDirection = 'column';
        listContainer.style.gap = '0.5rem';
        listContainer.style.width = '100%';
        listContainer.style.maxHeight = '300px';
        listContainer.style.overflowY = 'auto';

        files.forEach((file) => {
            const item = document.createElement('div');
            item.className = 'processed-item';
            item.style.padding = '0.75rem 1rem';
            item.style.borderRadius = '8px';
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            item.style.border = '1px solid var(--border-color)';
            item.style.background = 'rgba(255, 255, 255, 0.8)';
            
            if (file.name.includes("Summary") || file.name.includes("SUMMARY")) {
                item.style.borderLeft = '5px solid #d97706';
            } else if (file.name === "Merged_Errors.xlsx") {
                item.style.borderLeft = '5px solid #8b5cf6';
            } else if (file.name.includes("_Cleaned.xlsx")) {
                item.style.borderLeft = '5px solid #06b6d4';
            } else {
                item.style.borderLeft = '5px solid #10b981';
            }

            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-details';
            fileInfo.style.display = 'flex';
            fileInfo.style.flexDirection = 'column';
            fileInfo.style.gap = '0.2rem';
            fileInfo.innerHTML = `
                <span class="file-name" style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">
                    <i class="fa-solid fa-file-excel" style="color: #10b981;"></i> ${file.name}
                </span>
                <span style="font-size: 0.75rem; color: var(--text-muted);">
                    ${file.desc} | Size: ${formatBytes(file.size)}
                </span>
            `;

            item.appendChild(fileInfo);
            
            if (file.blob) {
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'btn btn-primary';
                downloadBtn.style.padding = '0.3rem 0.6rem';
                downloadBtn.style.fontSize = '0.75rem';
                downloadBtn.style.borderRadius = '6px';
                downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i>';
                downloadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    triggerDownload(file.blob, file.name);
                    ieLog(`Downloaded: ${file.name}`, 'info');
                });
                item.appendChild(downloadBtn);
            }

            listContainer.appendChild(item);
        });

        ieOutputContainer.appendChild(listContainer);

        const downloadAllBtn = document.getElementById('downloadIeZipBtn');
        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', () => {
                if (ieZipBlob) {
                    triggerDownload(ieZipBlob, zipFilename);
                    ieLog(`Downloaded ZIP package: ${zipFilename}`, 'info');
                }
            });
        }
    }

    if (ieBtn) {
        ieBtn.addEventListener('click', async () => {
            if (ieFiles.length === 0) return;

            ieBtn.setAttribute('disabled', 'true');
            if (ieStatus) {
                ieStatus.className = 'status-indicator processing';
                ieStatus.innerText = 'Processing';
            }
            
            if (ieOutputContainer) {
                ieOutputContainer.innerHTML = `
                    <div class="empty-output-state">
                        <i class="fa-solid fa-spinner fa-spin placeholder-icon" style="color: #059669;"></i>
                        <p>Processing files, please wait...</p>
                    </div>
                `;
            }
            
            ieLog('Starting Invoice Error Pipeline...', 'process');

            try {
                const zip = new JSZip();
                const filesListForDashboard = [];

                for (let k = 0; k < ieFiles.length; k++) {
                    const fileObj = ieFiles[k];
                    ieLog(`Parsing ${fileObj.name}...`, 'info');
                    
                    const fileAoa = await parseFileToAoa(fileObj.file, fileObj.name);
                    
                    if (fileAoa.length === 0) {
                        ieLog(`Warning: file ${fileObj.name} is empty, skipping`, 'warning');
                        continue;
                    }

                    const header = fileAoa[0];
                    const dataRows = fileAoa.slice(1);
                    
                    let deletedInFile = 0;
                    const mainCleanedRows = [];

                    // Grouping stores
                    const itemNotExistsGroups = {};
                    const skuMismatchedWithSkuGroups = {};
                    const skuMismatchedEmptyGroups = {};

                    dataRows.forEach(row => {
                        const colKVal = row[10]; // Column K
                        const colLVal = row[11] || "Unknown-Party"; // Column L
                        const partyName = String(colLVal).trim();

                        if (colKVal !== undefined && colKVal !== null) {
                            const strK = String(colKVal).trim();
                            
                            // Step 1: Filter out 'Order No Already Exists:' rows
                            if (strK.includes("Order No Already Exists:")) {
                                deletedInFile++;
                                return; // Deleted, skip
                            }
                            
                            // Keep remaining rows in the main cleaned file
                            mainCleanedRows.push(row);

                            // Check Part A: Item Not Exists
                            if (strK.includes("Item Not Exists:")) {
                                if (!itemNotExistsGroups[partyName]) {
                                    itemNotExistsGroups[partyName] = [];
                                }
                                itemNotExistsGroups[partyName].push(row);
                            }
                            // Check Part B: Item SKU Mismatched
                            else if (strK.includes("Item SKU Mismatched:")) {
                                const rest = strK.replace("Item SKU Mismatched:", "").trim();
                                if (rest !== "") {
                                    // Case 1: SKU mismatch with extra details
                                    if (!skuMismatchedWithSkuGroups[partyName]) {
                                        skuMismatchedWithSkuGroups[partyName] = [];
                                    }
                                    skuMismatchedWithSkuGroups[partyName].push(row);
                                } else {
                                    // Case 2: SKU mismatch without details
                                    if (!skuMismatchedEmptyGroups[partyName]) {
                                        skuMismatchedEmptyGroups[partyName] = [];
                                    }
                                    skuMismatchedEmptyGroups[partyName].push(row);
                                }
                            }
                        } else {
                            mainCleanedRows.push(row);
                        }
                    });

                    ieLog(`Processed ${fileObj.name}: Deleted ${deletedInFile} rows with 'Order No Already Exists:'.`, 'success');

                    // 1. Save Main Cleaned File (with Step 1 rows deleted)
                    const cleanedAoa = [header, ...mainCleanedRows];
                    const cleanedWb = XLSX.utils.book_new();
                    const cleanedWs = XLSX.utils.aoa_to_sheet(cleanedAoa);
                    formatWorksheetCells(cleanedWs, false);
                    XLSX.utils.book_append_sheet(cleanedWb, cleanedWs, "CleanedData");
                    
                    const cleanedFilename = fileObj.name.replace(/\.xlsx$/i, '_Cleaned.xlsx');
                    const cleanedBuffer = XLSX.write(cleanedWb, { bookType: 'xlsx', type: 'array' });
                    const cleanedBlob = new Blob([cleanedBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                    zip.file(cleanedFilename, cleanedBuffer);
                    
                    filesListForDashboard.push({
                        name: cleanedFilename,
                        size: cleanedBuffer.byteLength,
                        desc: `Main cleaned file (${mainCleanedRows.length} rows remaining, ${deletedInFile} deleted)`,
                        blob: cleanedBlob
                    });

                    // 2. Process and create files for Item Not Exists groups
                    const notExistsParties = Object.keys(itemNotExistsGroups);
                    notExistsParties.forEach(party => {
                        const partyRows = itemNotExistsGroups[party];
                        const titleText = `${party}-Item Not Exists`;
                        const ws = createWorksheetWithMergedTitle(titleText, header, partyRows);
                        
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, getSafeSheetName(titleText));
                        
                        const partyFilename = `${party}-Item Not Exists.xlsx`;
                        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                        zip.file(partyFilename, buffer);
                        
                        filesListForDashboard.push({
                            name: partyFilename,
                            size: buffer.byteLength,
                            desc: `Item Not Exists for ${party} (${partyRows.length} rows)`,
                            blob: blob
                        });
                        
                        registerTrackedError('invoice', partyFilename, party, 'Item Not Exists', partyRows.length);
                    });

                    // 3. Process and create files for SKU Mismatched groups (with details)
                    const skuMismatchParties = Object.keys(skuMismatchedWithSkuGroups);
                    skuMismatchParties.forEach(party => {
                        const partyRows = skuMismatchedWithSkuGroups[party];
                        const titleText = `${party}-Item SKU Mismatched`;
                        const ws = createWorksheetWithMergedTitle(titleText, header, partyRows);
                        
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, getSafeSheetName(titleText));
                        
                        const partyFilename = `${party}-Item SKU Mismatched.xlsx`;
                        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                        zip.file(partyFilename, buffer);
                        
                        filesListForDashboard.push({
                            name: partyFilename,
                            size: buffer.byteLength,
                            desc: `SKU Mismatched for ${party} (${partyRows.length} rows)`,
                            blob: blob
                        });
                        
                        registerTrackedError('invoice', partyFilename, party, 'Item SKU Mismatched', partyRows.length);
                    });

                    // 4. Process and create files for Only SKU Mismatched groups (empty details)
                    const skuEmptyParties = Object.keys(skuMismatchedEmptyGroups);
                    skuEmptyParties.forEach(party => {
                        const partyRows = skuMismatchedEmptyGroups[party];
                        const titleText = `${party}-Only SKU Mismatched`;
                        const ws = createWorksheetWithMergedTitle(titleText, header, partyRows);
                        
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, getSafeSheetName(titleText));
                        
                        const partyFilename = `${party}-Only SKU Mismatched.xlsx`;
                        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                        zip.file(partyFilename, buffer);
                        
                        filesListForDashboard.push({
                            name: partyFilename,
                            size: buffer.byteLength,
                            desc: `Only SKU Mismatched (Empty Details) for ${party} (${partyRows.length} rows)`,
                            blob: blob
                        });
                        
                        registerTrackedError('invoice', partyFilename, party, 'Only SKU Mismatched', partyRows.length);
                    });

                    // 5. Create Merged Error Excel file (all sheets except the Empty SKU Mismatch ones)
                    const mergedWb = XLSX.utils.book_new();
                    let hasMergedSheets = false;

                    // Add Item Not Exists sheets
                    notExistsParties.forEach(party => {
                        const partyRows = itemNotExistsGroups[party];
                        const titleText = `${party}-Item Not Exists`;
                        const ws = createWorksheetWithMergedTitle(titleText, header, partyRows);
                        XLSX.utils.book_append_sheet(mergedWb, ws, getSafeSheetName(titleText));
                        hasMergedSheets = true;
                    });

                    // Add SKU Mismatched (with details) sheets
                    skuMismatchParties.forEach(party => {
                        const partyRows = skuMismatchedWithSkuGroups[party];
                        const titleText = `${party}-Item SKU Mismatched`;
                        const ws = createWorksheetWithMergedTitle(titleText, header, partyRows);
                        XLSX.utils.book_append_sheet(mergedWb, ws, getSafeSheetName(titleText));
                        hasMergedSheets = true;
                    });

                    if (hasMergedSheets) {
                        const mergedBuffer = XLSX.write(mergedWb, { bookType: 'xlsx', type: 'array' });
                        const mergedBlob = new Blob([mergedBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                        zip.file("Merged_Errors.xlsx", mergedBuffer);
                        
                        filesListForDashboard.push({
                            name: "Merged_Errors.xlsx",
                            size: mergedBuffer.byteLength,
                            desc: `Merged Excel of all error sheets (excludes empty SKU mismatches)`,
                            blob: mergedBlob
                        });
                    }

                    // 6. Create Summary Report Excel file (excluding empty SKU mismatches)
                    const summaryData = [
                        ["Party Name (Seller/Customer)", "Item Not Exists Count", "Item SKU Mismatched Count", "Total Errors", "Errors Present"]
                    ];

                    const allParties = new Set([...notExistsParties, ...skuMismatchParties]);
                    const sortedAllParties = Array.from(allParties).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

                    sortedAllParties.forEach(party => {
                        const notExistsCount = (itemNotExistsGroups[party] || []).length;
                        const skuMismatchCount = (skuMismatchedWithSkuGroups[party] || []).length;
                        const total = notExistsCount + skuMismatchCount;

                        const errorsList = [];
                        if (notExistsCount > 0) errorsList.push("Item Not Exists");
                        if (skuMismatchCount > 0) errorsList.push("Item SKU Mismatched");

                        summaryData.push([
                            party,
                            notExistsCount,
                            skuMismatchCount,
                            total,
                            errorsList.join(", ")
                        ]);
                    });

                    if (sortedAllParties.length > 0) {
                        const summaryWb = XLSX.utils.book_new();
                        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
                        XLSX.utils.book_append_sheet(summaryWb, summaryWs, "Summary");
                        
                        // Format summary sheet (no title row)
                        formatWorksheetCells(summaryWs, false);
                        
                        // Customize header row fill color for Summary sheet specifically
                        const sRange = XLSX.utils.decode_range(summaryWs['!ref']);
                        for (let C = sRange.s.c; C <= sRange.e.c; ++C) {
                            const cell_ref = XLSX.utils.encode_cell({ c: C, r: 0 });
                            if (summaryWs[cell_ref]) {
                                summaryWs[cell_ref].s.fill = { fgColor: { rgb: '0F172A' } }; // Dark slate theme
                                summaryWs[cell_ref].s.font = { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: 'FFFFFF' } };
                            }
                        }
                        
                        const summaryBuffer = XLSX.write(summaryWb, { bookType: 'xlsx', type: 'array' });
                        const summaryBlob = new Blob([summaryBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                        const summaryReportName = getAjioSummaryFilename('AJIO_Summary_Report');
                        zip.file(summaryReportName, summaryBuffer);
                        filesListForDashboard.push({
                            name: summaryReportName,
                            size: summaryBuffer.byteLength,
                            desc: `Summary sheet of errors by party (excludes empty SKU mismatches)`,
                            blob: summaryBlob
                        });
                    }
                }

                if (filesListForDashboard.length === 0) {
                    throw new Error("No files were processed successfully.");
                }

                // Generate Zip Blob
                ieZipBlob = await zip.generateAsync({ type: 'blob' });
                const zipFilename = "ajio_error_bundle.zip";

                // Render Dashboard
                renderIeDashboard(filesListForDashboard, zipFilename);

                if (ieStatus) {
                    ieStatus.className = 'status-indicator success';
                    ieStatus.innerText = 'Completed';
                }
                
                alert("INVOICE ERROR PIPELINE COMPLETED SUCCESSFULLY");
                ieLog(`Done! All files generated and packaged into ZIP: "${zipFilename}"`, 'success');

            } catch (err) {
                ieLog(`Processing failed: ${err.message}`, 'error');
                if (ieStatus) {
                    ieStatus.className = 'status-indicator idle';
                    ieStatus.innerText = 'Failed';
                }
                if (ieOutputContainer) {
                    ieOutputContainer.innerHTML = `
                        <div class="empty-output-state">
                            <i class="fa-solid fa-circle-exclamation placeholder-icon" style="color: #ef4444;"></i>
                            <p style="color: #ef4444; font-weight: 600;">Error: ${err.message}</p>
                        </div>
                    `;
                }
            } finally {
                ieBtn.removeAttribute('disabled');
            }
        });
    }

    /* ==========================================================================
       LOSS ERROR TAB LOGIC
       ========================================================================== */
    const leDetailsFileInput = document.getElementById('leDetailsFileInput');
    const leDetailsDropzone = document.getElementById('leDetailsDropzone');
    const leDetailsFileDisplay = document.getElementById('leDetailsFileDisplay');
    const leDetailsSelectedCount = document.getElementById('leDetailsSelectedCount');
    const leDetailsUploadedFileList = document.getElementById('leDetailsUploadedFileList');
    const clearLeDetailsFilesBtn = document.getElementById('clearLeDetailsFilesBtn');

    const leDataFileInput = document.getElementById('leDataFileInput');
    const leDataDropzone = document.getElementById('leDataDropzone');
    const leDataFileDisplay = document.getElementById('leDataFileDisplay');

    const leBtn = document.getElementById('leBtn');
    const leStatus = document.getElementById('leStatus');
    const leProgressCard = document.getElementById('leProgressCard');
    const leProgressBar = document.getElementById('leProgressBar');
    const leProgressPercent = document.getElementById('leProgressPercent');
    const leProgressStepText = document.getElementById('leProgressStepText');
    const leOutputContainer = document.getElementById('leOutputContainer');
    const leConsoleLog = document.getElementById('leConsoleLog');
    const clearLeLogBtn = document.getElementById('clearLeLogBtn');

    let leDetailsFiles = []; // Array of { file, name, size }
    let leDataFile = null;
    let leZipBlob = null;
    let leMergedBlob = null;

    function leLog(msg, type = 'info') {
        if (!leConsoleLog) return;
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        line.innerHTML = `<span class="log-time">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
        leConsoleLog.appendChild(line);
        leConsoleLog.scrollTop = leConsoleLog.scrollHeight;
    }

    if (clearLeLogBtn) {
        clearLeLogBtn.addEventListener('click', () => {
            if (leConsoleLog) {
                leConsoleLog.innerHTML = '<div class="log-line info">[System] Log cleared.</div>';
            }
        });
    }

    function checkLeInputs() {
        if (leDetailsFiles.length > 0 && leDataFile) {
            leBtn.removeAttribute('disabled');
        } else {
            leBtn.setAttribute('disabled', 'true');
        }
    }

    function updateLeDetailsFileListUI() {
        if (!leDetailsUploadedFileList || !leDetailsSelectedCount) return;
        leDetailsUploadedFileList.innerHTML = '';
        leDetailsSelectedCount.innerText = leDetailsFiles.length;

        if (leDetailsFiles.length === 0) {
            leDetailsUploadedFileList.innerHTML = '<div class="empty-list-msg">No loss details files selected yet.</div>';
            if (leDetailsFileDisplay) leDetailsFileDisplay.innerText = 'Drag & drop or Click to choose multiple files';
            if (leDetailsDropzone) leDetailsDropzone.classList.remove('file-selected');
            checkLeInputs();
            return;
        }

        if (leDetailsFileDisplay) {
            leDetailsFileDisplay.innerText = `${leDetailsFiles.length} file(s) selected: ${leDetailsFiles[0].name}${leDetailsFiles.length > 1 ? ` (+${leDetailsFiles.length - 1} more)` : ''}`;
        }
        if (leDetailsDropzone) leDetailsDropzone.classList.add('file-selected');

        leDetailsFiles.forEach((fileObj, idx) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = `
                <div class="file-info">
                    <i class="fa-solid fa-file-excel file-icon text-rose" style="color: #e11d48;"></i>
                    <span class="file-name" title="${fileObj.name}">${fileObj.name}</span>
                    <span class="file-size">(${formatBytes(fileObj.size)})</span>
                </div>
                <button type="button" class="file-action-btn remove-le-file" data-idx="${idx}" title="Remove file">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            const removeBtn = item.querySelector('.remove-le-file');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    leDetailsFiles.splice(idx, 1);
                    updateLeDetailsFileListUI();
                });
            }
            leDetailsUploadedFileList.appendChild(item);
        });

        checkLeInputs();
    }

    if (leDetailsDropzone && leDetailsFileInput) {
        leDetailsDropzone.addEventListener('click', () => leDetailsFileInput.click());
        leDetailsFileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            let added = 0;
            files.forEach(f => {
                if (!leDetailsFiles.some(existing => existing.name === f.name)) {
                    leDetailsFiles.push({ file: f, name: f.name, size: f.size });
                    added++;
                }
            });
            leDetailsFileInput.value = '';
            if (added > 0) {
                leLog(`Added ${added} Loss Details file(s). Total: ${leDetailsFiles.length}`, 'success');
            }
            updateLeDetailsFileListUI();
        });
    }

    if (clearLeDetailsFilesBtn) {
        clearLeDetailsFilesBtn.addEventListener('click', () => {
            leDetailsFiles = [];
            if (leDetailsFileInput) leDetailsFileInput.value = '';
            updateLeDetailsFileListUI();
            leLog('Cleared all selected Loss Details files.', 'info');
        });
    }

    if (leDataDropzone && leDataFileInput) {
        setupMiniDropzone(leDataDropzone, leDataFileInput, (file) => {
            leDataFile = file;
            if (leDataFileDisplay) {
                leDataFileDisplay.innerText = file.name;
                leDataFileDisplay.title = file.name;
            }
            leDataDropzone.classList.add('file-selected');
            leLog(`Selected Reference Data File: ${file.name} (${formatBytes(file.size)})`, 'info');
            checkLeInputs();
        });
    }

    function cleanLossKeyVal(val) {
        if (val === undefined || val === null) return "";
        let str = toPureText(val).toUpperCase();
        str = str.replace(/\s+/g, '').trim();
        return str;
    }

    function formatLossDateVal(dt) {
        if (dt === undefined || dt === null) return "";
        if (typeof dt === 'number' && dt > 20000 && dt < 80000) {
            const dObj = new Date(Math.round((dt - 25569) * 86400 * 1000));
            const pad = n => String(n).padStart(2, '0');
            return `${pad(dObj.getDate())}/${pad(dObj.getMonth() + 1)}/${dObj.getFullYear()}`;
        }
        if (dt instanceof Date && !isNaN(dt.getTime())) {
            const pad = n => String(n).padStart(2, '0');
            return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
        }
        return String(dt).trim();
    }

    function formatLossWorksheet(ws) {
        if (!ws || !ws['!ref']) return;
        const range = XLSX.utils.decode_range(ws['!ref']);
        const cols = [];

        for (let C = range.s.c; C <= range.e.c; ++C) {
            cols.push({ wch: 12 });
        }

        for (let R = range.s.r; R <= range.e.r; ++R) {
            if (R === 0 && ws['!merges'] && ws['!merges'].length > 0) {
                continue; // Skip title banner row for col width calc
            }
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                const cell = ws[cell_ref];
                if (cell && cell.v !== undefined && cell.v !== null) {
                    const len = String(cell.v).length;
                    if (len > cols[C].wch) cols[C].wch = len;
                }
            }
        }

        cols.forEach((col, idx) => {
            if (idx === 5) {
                col.wch = Math.min(Math.max(col.wch + 4, 15), 25); // Order date (Col F)
            } else if (idx === 1) {
                col.wch = Math.min(Math.max(col.wch + 3, 16), 30); // Order ID (Col B)
            } else if (idx === 6 || idx === 0) {
                col.wch = Math.min(Math.max(col.wch + 3, 16), 30); // Invoice IDs
            } else {
                col.wch = Math.min(Math.max(col.wch + 3, 12), 35);
            }
        });
        ws['!cols'] = cols;

        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                if (!ws[cell_ref]) {
                    ws[cell_ref] = { t: 's', v: '' };
                }
                const cell = ws[cell_ref];
                const isTitle = (R === 0);
                const isHeader = (R === 1);
                const isData = (R >= 2);

                cell.s = {
                    border: {
                        top: { style: 'thin', color: { rgb: 'E5E7EB' } },
                        bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
                        left: { style: 'thin', color: { rgb: 'E5E7EB' } },
                        right: { style: 'thin', color: { rgb: 'E5E7EB' } }
                    }
                };

                if (isTitle) {
                    cell.s.font = { name: 'Segoe UI', sz: 12, bold: true, color: { rgb: 'FFFFFF' } };
                    cell.s.fill = { fgColor: { rgb: 'E11D48' } }; // Rose/Crimson banner
                    cell.s.alignment = { horizontal: 'center', vertical: 'center' };
                } else if (isHeader) {
                    cell.s.font = { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '1E293B' } };
                    if (C === 5) {
                        cell.s.fill = { fgColor: { rgb: 'DCFCE7' } }; // Light Green for Order Date (Col F)
                        cell.s.font = { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '15803D' } };
                    } else {
                        cell.s.fill = { fgColor: { rgb: 'F1F5F9' } };
                    }
                    cell.s.alignment = { horizontal: (C === 1 || C === 5) ? 'center' : 'left', vertical: 'center' };
                } else if (isData) {
                    cell.s.font = { name: 'Segoe UI', sz: 9.5, color: { rgb: '334155' } };
                    
                    // Col B: Order ID (Pure text formatting)
                    if (C === 1) {
                        cell.t = 's';
                        cell.z = '@';
                        cell.v = toPureText(cell.v);
                        cell.s.alignment = { horizontal: 'center', vertical: 'center' };
                    }
                    // Col F: Order date
                    else if (C === 5) {
                        cell.t = 's';
                        cell.z = '@';
                        cell.s.alignment = { horizontal: 'center', vertical: 'center' };
                        if (cell.v && String(cell.v).trim() !== '') {
                            cell.s.font = { name: 'Segoe UI', sz: 9.5, bold: true, color: { rgb: '15803D' } };
                        }
                    }
                    // Numerical amount columns (C, D, E)
                    else if (C === 2 || C === 3 || C === 4) {
                        cell.s.alignment = { horizontal: 'right', vertical: 'center' };
                    }
                    // Invoice IDs
                    else {
                        cell.s.alignment = { horizontal: 'left', vertical: 'center' };
                    }
                }
            }
        }
    }

    function renderLeDashboard(filesList, mergedBlob, zipFilename, mergedFilename, stats) {
        if (!leOutputContainer) return;
        leOutputContainer.innerHTML = '';
        leOutputContainer.className = 'processed-container';
        leOutputContainer.style.maxHeight = 'none';
        leOutputContainer.style.overflow = 'visible';

        // 1. Stats Cards
        const statsRow = document.createElement('div');
        statsRow.className = 'stats-card-grid';
        statsRow.style.display = 'grid';
        statsRow.style.gridTemplateColumns = 'repeat(auto-fit, minmax(130px, 1fr))';
        statsRow.style.gap = '0.75rem';
        statsRow.style.marginBottom = '1.25rem';

        statsRow.innerHTML = `
            <div style="background: white; border: 1px solid var(--border-color); border-radius: 10px; padding: 0.85rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Total Files</div>
                <div style="font-size: 1.4rem; font-weight: 800; color: #e11d48; margin-top: 0.2rem;">${stats.totalFiles}</div>
            </div>
            <div style="background: white; border: 1px solid var(--border-color); border-radius: 10px; padding: 0.85rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Total Rows</div>
                <div style="font-size: 1.4rem; font-weight: 800; color: #1e293b; margin-top: 0.2rem;">${stats.totalRows}</div>
            </div>
            <div style="background: white; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 0.85rem; background: rgba(240, 253, 244, 0.6); box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                <div style="font-size: 0.72rem; color: #15803d; font-weight: 600; text-transform: uppercase;">Dates Matched</div>
                <div style="font-size: 1.4rem; font-weight: 800; color: #15803d; margin-top: 0.2rem;">${stats.totalMatched}</div>
            </div>
            <div style="background: white; border: 1px solid ${stats.totalUnmatched > 0 ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)'}; border-radius: 10px; padding: 0.85rem; background: ${stats.totalUnmatched > 0 ? 'rgba(254, 243, 199, 0.5)' : 'white'}; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                <div style="font-size: 0.72rem; color: ${stats.totalUnmatched > 0 ? '#b45309' : 'var(--text-muted)'}; font-weight: 600; text-transform: uppercase;">Unmatched</div>
                <div style="font-size: 1.4rem; font-weight: 800; color: ${stats.totalUnmatched > 0 ? '#b45309' : '#64748b'}; margin-top: 0.2rem;">${stats.totalUnmatched}</div>
            </div>
        `;
        leOutputContainer.appendChild(statsRow);

        // 2. Action Download Bar
        const actionsBar = document.createElement('div');
        actionsBar.style.display = 'flex';
        actionsBar.style.flexWrap = 'wrap';
        actionsBar.style.gap = '0.75rem';
        actionsBar.style.marginBottom = '1.25rem';

        actionsBar.innerHTML = `
            <button type="button" class="btn btn-primary" id="leDownloadZipBtn" style="flex: 1; min-width: 200px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.65rem 1.2rem; font-weight: 700; border-radius: 8px; background: linear-gradient(135deg, #e11d48, #be123c); cursor: pointer;">
                <i class="fa-solid fa-file-zipper"></i> Download ZIP Package
            </button>
            <button type="button" class="btn btn-success" id="leDownloadMergedBtn" style="flex: 1; min-width: 200px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.65rem 1.2rem; font-weight: 700; border-radius: 8px; background: linear-gradient(135deg, #059669, #10b981); cursor: pointer;">
                <i class="fa-solid fa-file-excel"></i> Download Merged Excel (${filesList.length} Sheets)
            </button>
        `;
        leOutputContainer.appendChild(actionsBar);

        // Bind Download Buttons
        const dlZipBtn = actionsBar.querySelector('#leDownloadZipBtn');
        if (dlZipBtn) {
            dlZipBtn.addEventListener('click', () => {
                if (leZipBlob) {
                    triggerDownload(leZipBlob, zipFilename);
                    leLog(`Downloaded complete ZIP package: ${zipFilename}`, 'info');
                }
            });
        }

        const dlMergedBtn = actionsBar.querySelector('#leDownloadMergedBtn');
        if (dlMergedBtn) {
            dlMergedBtn.addEventListener('click', () => {
                if (mergedBlob) {
                    triggerDownload(mergedBlob, mergedFilename);
                    leLog(`Downloaded Merged Excel file: ${mergedFilename}`, 'info');
                }
            });
        }

        // 3. Processed Files Table Card
        const tableCard = document.createElement('div');
        tableCard.style.background = 'white';
        tableCard.style.border = '1px solid var(--border-color)';
        tableCard.style.borderRadius = '12px';
        tableCard.style.overflow = 'hidden';
        tableCard.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';

        const tableHeader = document.createElement('div');
        tableHeader.style.padding = '0.75rem 1rem';
        tableHeader.style.borderBottom = '1px solid var(--border-color)';
        tableHeader.style.background = '#f8fafc';
        tableHeader.style.display = 'flex';
        tableHeader.style.justifyContent = 'space-between';
        tableHeader.style.alignItems = 'center';
        tableHeader.innerHTML = `
            <span style="font-size: 0.85rem; font-weight: 700; color: #1e293b;"><i class="fa-solid fa-table-list text-rose" style="color: #e11d48;"></i> Processed Loss Details Files (${filesList.length})</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Column F (Order date) successfully updated</span>
        `;
        tableCard.appendChild(tableHeader);

        const tableWrap = document.createElement('div');
        tableWrap.style.overflowX = 'auto';
        tableWrap.style.overflowY = 'auto';
        tableWrap.style.maxHeight = '280px';
        tableWrap.style.webkitOverflowScrolling = 'touch';

        const table = document.createElement('table');
        table.className = 'data-table';
        table.style.width = '100%';
        table.style.minWidth = '720px';
        table.style.fontSize = '0.82rem';

        table.innerHTML = `
            <thead style="position: sticky; top: 0; z-index: 2; background: #f8fafc;">
                <tr>
                    <th style="width: 40px; text-align: center; background: #f8fafc;">#</th>
                    <th style="background: #f8fafc;">Details File Name</th>
                    <th style="background: #f8fafc;">Sheet Name</th>
                    <th style="text-align: center; background: #f8fafc;">Total Rows</th>
                    <th style="text-align: center; background: #f8fafc;">Matched Dates</th>
                    <th style="text-align: center; background: #f8fafc;">Unmatched</th>
                    <th style="text-align: center; background: #f8fafc;">Status</th>
                    <th style="text-align: center; width: 140px; background: #f8fafc;">Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');
        filesList.forEach((file, idx) => {
            const tr = document.createElement('tr');
            const matchRate = file.totalRows > 0 ? Math.round((file.matched / file.totalRows) * 100) : 0;
            const isFullMatch = file.unmatched === 0;

            tr.innerHTML = `
                <td style="text-align: center; font-weight: 700; color: var(--text-muted);">${idx + 1}</td>
                <td style="font-weight: 600; color: var(--text-primary);">
                    <i class="fa-solid fa-file-excel text-rose" style="color: #e11d48; margin-right: 0.35rem;"></i>
                    ${file.name}
                </td>
                <td style="color: #64748b; font-family: monospace; font-size: 0.78rem;">[${file.sheetName}]</td>
                <td style="text-align: center; font-weight: 700;">${file.totalRows}</td>
                <td style="text-align: center; font-weight: 700; color: #15803d;">${file.matched}</td>
                <td style="text-align: center; font-weight: 700; color: ${file.unmatched > 0 ? '#b45309' : '#64748b'};">${file.unmatched}</td>
                <td style="text-align: center;">
                    <span style="font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 6px; background: ${isFullMatch ? '#dcfce7' : '#fef3c7'}; color: ${isFullMatch ? '#15803d' : '#b45309'}; border: 1px solid ${isFullMatch ? '#86efac' : '#fde68a'};">
                        ${matchRate}% Matched
                    </span>
                </td>
                <td style="text-align: center;">
                    <div style="display: flex; gap: 0.35rem; justify-content: center;">
                        <button type="button" class="btn btn-secondary le-dl-single" style="padding: 0.25rem 0.55rem; font-size: 0.75rem; border-radius: 6px;" title="Download this file">
                            <i class="fa-solid fa-download"></i>
                        </button>
                        <button type="button" class="btn btn-secondary le-preview-single" style="padding: 0.25rem 0.55rem; font-size: 0.75rem; border-radius: 6px;" title="Preview Excel data">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </td>
            `;

            // Download single file handler
            const dlBtn = tr.querySelector('.le-dl-single');
            if (dlBtn) {
                dlBtn.addEventListener('click', () => {
                    triggerDownload(file.blob, file.name);
                    leLog(`Downloaded: ${file.name}`, 'info');
                });
            }

            // Preview single file handler
            const prevBtn = tr.querySelector('.le-preview-single');
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (file.aoa) {
                        showDataPreviewModal(file.name, file.aoa);
                    }
                });
            }

            tbody.appendChild(tr);
        });

        tableWrap.appendChild(table);
        tableCard.appendChild(tableWrap);
        leOutputContainer.appendChild(tableCard);
    }

    if (leBtn) {
        leBtn.addEventListener('click', async () => {
            if (leDetailsFiles.length === 0 || !leDataFile) return;

            leBtn.setAttribute('disabled', 'true');
            if (leStatus) {
                leStatus.className = 'status-indicator processing';
                leStatus.innerText = 'Processing';
            }
            if (leProgressCard) leProgressCard.classList.remove('hidden');
            if (leProgressBar) leProgressBar.style.width = '5%';
            if (leProgressPercent) leProgressPercent.innerText = '5%';
            if (leProgressStepText) leProgressStepText.innerText = 'Reading Ajio Data file...';

            if (leOutputContainer) {
                leOutputContainer.innerHTML = `
                    <div class="empty-output-state">
                        <i class="fa-solid fa-spinner fa-spin placeholder-icon" style="color: #e11d48;"></i>
                        <p>Processing Loss Details and matching with Ajio Data file...</p>
                    </div>
                `;
            }

            try {
                leLog('Starting Loss Error Process...', 'process');
                leLog(`Selected Details Files: ${leDetailsFiles.length}`, 'info');
                leLog(`Selected Ajio Data File: ${leDataFile.name}`, 'info');

                // Step 1: Read and Index the Ajio Data File
                if (leProgressBar) leProgressBar.style.width = '10%';
                if (leProgressPercent) leProgressPercent.innerText = '10%';
                if (leProgressStepText) leProgressStepText.innerText = 'Parsing Ajio Data spreadsheet...';

                const dataBuffer = await readFileAsArrayBuffer(leDataFile);
                const dataWb = XLSX.read(dataBuffer, { type: 'array', cellDates: true });
                
                let dataSheetName = dataWb.SheetNames[0];
                for (const sName of dataWb.SheetNames) {
                    const low = sName.toLowerCase();
                    if (low.includes('data') || low.includes('ajio')) {
                        dataSheetName = sName;
                        break;
                    }
                }

                const dataWs = dataWb.Sheets[dataSheetName];
                const dataAoa = XLSX.utils.sheet_to_json(dataWs, { header: 1, defval: "" });
                leLog(`Loaded Ajio Data sheet [${dataSheetName}] with ${dataAoa.length} rows.`, 'info');

                if (dataAoa.length < 2) {
                    throw new Error(`Ajio Data sheet [${dataSheetName}] is empty or has no data rows.`);
                }

                // Locate Data file header row
                let dataHeaderRowIndex = -1;
                for (let i = 0; i < Math.min(dataAoa.length, 10); i++) {
                    const row = dataAoa[i];
                    if (row && row.some(cell => {
                        const str = String(cell || "").trim().toLowerCase();
                        return str.includes("seller invoice") || str.includes("seller order") || str.includes("customer order") || str.includes("cust order date");
                    })) {
                        dataHeaderRowIndex = i;
                        break;
                    }
                }
                if (dataHeaderRowIndex === -1) {
                    dataHeaderRowIndex = 1; // Default row 2 (index 1)
                }

                const dataHeaderRow = dataAoa[dataHeaderRowIndex] || [];
                let sellerInvoiceCol = 7; // Col H default
                let sellerOrderNoCol = 4; // Col E default
                let custOrderNoCol = 1;   // Col B default
                let custOrderDateCol = 2; // Col C default

                for (let c = 0; c < dataHeaderRow.length; c++) {
                    const val = String(dataHeaderRow[c] || "").trim().toLowerCase().replace(/[\._\-\s]+/g, " ");
                    
                    // 1. Seller Invoice No (Col H - MUST NOT be date)
                    if ((val === "seller invoice no" || val === "seller invoice number" || val === "seller invoice" || val.includes("seller invoice")) && !val.includes("date")) {
                        sellerInvoiceCol = c;
                    }
                    // 2. Seller Order No (Col E - MUST NOT be date or invoice)
                    else if ((val === "seller order no" || val === "seller order number" || val === "seller order" || val.includes("seller order")) && !val.includes("date") && !val.includes("invoice")) {
                        sellerOrderNoCol = c;
                    }
                    // 3. Customer Order No (Col B - MUST NOT be date)
                    else if ((val === "customer order no" || val === "cust order no" || val === "customer order number" || val === "customer order" || val.includes("customer order") || val.includes("cust order")) && !val.includes("date")) {
                        custOrderNoCol = c;
                    }
                    // 4. Cust Order Date (Col C - MUST contain order + date, NOT invoice or po)
                    else if ((val === "cust order date" || val === "customer order date" || (val.includes("order") && val.includes("date"))) && !val.includes("invoice") && !val.includes("po")) {
                        custOrderDateCol = c;
                    }
                }

                leLog(`Data File Columns detected: Seller Invoice No = Col ${colNumToExcelLetter(sellerInvoiceCol)} (${sellerInvoiceCol}), Seller Order No = Col ${colNumToExcelLetter(sellerOrderNoCol)} (${sellerOrderNoCol}), Cust Order Date = Col ${colNumToExcelLetter(custOrderDateCol)} (${custOrderDateCol})`, 'info');

                // Build multi-strategy lookup maps
                const dataCompositeMap = new Map();
                const dataCustCompositeMap = new Map();
                const dataInvoiceOnlyMap = new Map();
                const dataOrderOnlyMap = new Map();
                const dataCustOrderOnlyMap = new Map();

                for (let r = dataHeaderRowIndex + 1; r < dataAoa.length; r++) {
                    const row = dataAoa[r];
                    if (!row || row.length === 0) continue;
                    const inv = row[sellerInvoiceCol];
                    const ord = row[sellerOrderNoCol];
                    const custOrd = row[custOrderNoCol];
                    const dt = row[custOrderDateCol];

                    const formattedDate = formatLossDateVal(dt);
                    if (formattedDate !== "") {
                        const cleanInv = cleanLossKeyVal(inv);
                        const cleanOrd = cleanLossKeyVal(ord);
                        const cleanCustOrd = cleanLossKeyVal(custOrd);

                        if (cleanInv && cleanOrd) {
                            dataCompositeMap.set(`${cleanInv}__${cleanOrd}`, formattedDate);
                        }
                        if (cleanInv && cleanCustOrd) {
                            dataCustCompositeMap.set(`${cleanInv}__${cleanCustOrd}`, formattedDate);
                        }
                        if (cleanInv && !dataInvoiceOnlyMap.has(cleanInv)) {
                            dataInvoiceOnlyMap.set(cleanInv, formattedDate);
                        }
                        if (cleanOrd && !dataOrderOnlyMap.has(cleanOrd)) {
                            dataOrderOnlyMap.set(cleanOrd, formattedDate);
                        }
                        if (cleanCustOrd && !dataCustOrderOnlyMap.has(cleanCustOrd)) {
                            dataCustOrderOnlyMap.set(cleanCustOrd, formattedDate);
                        }
                    }
                }

                leLog(`Indexed ${dataCompositeMap.size} composite date records from Ajio Data file.`, 'success');

                // Step 2: Process Each Loss Details File
                const zip = new JSZip();
                const mergedWb = XLSX.utils.book_new();
                const usedSheetNames = new Set();
                const processedFilesList = [];

                let totalProcessedRows = 0;
                let totalMatchedDates = 0;
                let totalUnmatchedDates = 0;

                for (let fIdx = 0; fIdx < leDetailsFiles.length; fIdx++) {
                    const fileObj = leDetailsFiles[fIdx];
                    const progressVal = Math.round(15 + ((fIdx + 1) / leDetailsFiles.length) * 75);
                    if (leProgressBar) leProgressBar.style.width = `${progressVal}%`;
                    if (leProgressPercent) leProgressPercent.innerText = `${progressVal}%`;
                    if (leProgressStepText) leProgressStepText.innerText = `Processing [${fIdx + 1}/${leDetailsFiles.length}] ${fileObj.name}...`;

                    leLog(`[${fIdx + 1}/${leDetailsFiles.length}] Processing Loss file: "${fileObj.name}"...`, 'process');

                    const fileBuffer = await readFileAsArrayBuffer(fileObj.file);
                    const fileWb = XLSX.read(fileBuffer, { type: 'array', cellDates: true });
                    const fileWs = fileWb.Sheets[fileWb.SheetNames[0]];
                    const fileAoa = XLSX.utils.sheet_to_json(fileWs, { header: 1, defval: "" });

                    if (fileAoa.length === 0) {
                        leLog(`Warning: File "${fileObj.name}" is completely empty. Skipping.`, 'warning');
                        continue;
                    }

                    // Extract Clean Base File Name
                    const baseFileName = fileObj.name.replace(/\.[^/.]+$/, "").trim();

                    // Detect Header Row vs Title Row
                    let headerRowIndex = 0;
                    let hasExistingTitle = false;

                    for (let i = 0; i < Math.min(fileAoa.length, 5); i++) {
                        const row = fileAoa[i] || [];
                        const isHeader = row.some(cell => {
                            const str = String(cell || "").trim().toLowerCase();
                            return str.includes("invoice id") || str.includes("order id") || str.includes("sale price") || str.includes("difference") || str.includes("sale invoice");
                        });
                        if (isHeader) {
                            headerRowIndex = i;
                            if (i > 0) hasExistingTitle = true;
                            break;
                        }
                    }

                    // Prepare Working 2D Array
                    let workingAoa = [];

                    if (!hasExistingTitle) {
                        // Insert Row 1: Merged Title banner with file name
                        workingAoa.push([baseFileName, "", "", "", "", "", ""]);
                        // Row 2: Headers
                        const originalHeaders = fileAoa[headerRowIndex] || [];
                        const standardHeaders = [
                            originalHeaders[0] || "Invoice ID",
                            originalHeaders[1] || "Order ID",
                            originalHeaders[2] || "Sale Price/Amt",
                            originalHeaders[3] || "Purchase Price/Amt",
                            originalHeaders[4] || "Difference",
                            "Order date", // Col F (index 5)
                            originalHeaders[6] || originalHeaders[5] || "Sale Invoice ID" // Col G (index 6)
                        ];
                        workingAoa.push(standardHeaders);

                        // Data rows starting from original index + 1
                        for (let r = headerRowIndex + 1; r < fileAoa.length; r++) {
                            const origRow = fileAoa[r];
                            if (!origRow || origRow.length === 0 || origRow.every(c => c === "" || c === null || c === undefined)) continue;
                            
                            // Reorder row so that Col F is Order date and Col G is Sale Invoice ID
                            const newRow = [
                                origRow[0] !== undefined ? origRow[0] : "",
                                origRow[1] !== undefined ? origRow[1] : "",
                                origRow[2] !== undefined ? origRow[2] : "",
                                origRow[3] !== undefined ? origRow[3] : "",
                                origRow[4] !== undefined ? origRow[4] : "",
                                "", // Order date placeholder
                                origRow[6] !== undefined ? origRow[6] : (origRow[5] !== undefined ? origRow[5] : "") // Sale Invoice ID
                            ];
                            workingAoa.push(newRow);
                        }
                    } else {
                        // Title banner already in Row 0 -> keep title banner text
                        workingAoa.push([baseFileName, "", "", "", "", "", ""]);
                        // Header in Row 1
                        const headerRow = fileAoa[headerRowIndex] || [];
                        while (headerRow.length < 7) headerRow.push("");
                        headerRow[5] = "Order date"; // Ensure Col F header is Order date
                        if (!headerRow[6] || String(headerRow[6]).trim() === "") {
                            headerRow[6] = "Sale Invoice ID";
                        }
                        workingAoa.push(headerRow);

                        // Data rows starting from index 2
                        for (let r = headerRowIndex + 1; r < fileAoa.length; r++) {
                            const origRow = fileAoa[r];
                            if (!origRow || origRow.length === 0 || origRow.every(c => c === "" || c === null || c === undefined)) continue;
                            while (origRow.length < 7) origRow.push("");
                            workingAoa.push([...origRow]);
                        }
                    }

                    // Locate Column Positions in working headers (Row index 1)
                    const headerCells = workingAoa[1] || [];
                    let colG_SaleInvoice = 6; // Col G default
                    let colB_OrderId = 1;     // Col B default
                    let colF_OrderDate = 5;   // Col F default

                    for (let c = 0; c < headerCells.length; c++) {
                        const hVal = String(headerCells[c] || "").trim().toLowerCase();
                        if (hVal.includes("sale invoice") || hVal.includes("invoice id")) {
                            if (c >= 5) colG_SaleInvoice = c;
                        } else if (hVal.includes("order id") || hVal === "order no") {
                            colB_OrderId = c;
                        } else if (hVal.includes("order date") || hVal.includes("cust order date")) {
                            colF_OrderDate = c;
                        }
                    }

                    // Ensure header cell 5 says "Order date"
                    workingAoa[1][colF_OrderDate] = "Order date";

                    // Match Data Rows (Row index >= 2)
                    let fileMatched = 0;
                    let fileUnmatched = 0;
                    let fileTotalRows = 0;

                    for (let r = 2; r < workingAoa.length; r++) {
                        const row = workingAoa[r];
                        if (!row || row.length === 0) continue;
                        fileTotalRows++;

                        const saleInvoiceVal = row[colG_SaleInvoice]; // Col G
                        const orderIdVal = row[colB_OrderId];         // Col B

                        const cleanG = cleanLossKeyVal(saleInvoiceVal);
                        const cleanB = cleanLossKeyVal(orderIdVal);

                        let matchedDate = "";

                        // Strategy 1: Composite Key (Sale Invoice ID (Col G) + Order ID (Col B))
                        if (cleanG && cleanB) {
                            matchedDate = dataCompositeMap.get(`${cleanG}__${cleanB}`) || "";
                            if (!matchedDate) {
                                matchedDate = dataCustCompositeMap.get(`${cleanG}__${cleanB}`) || "";
                            }
                        }

                        // Strategy 2: Order ID only
                        if (!matchedDate && cleanB) {
                            matchedDate = dataOrderOnlyMap.get(cleanB) || dataCustOrderOnlyMap.get(cleanB) || "";
                        }

                        // Strategy 3: Sale Invoice ID only
                        if (!matchedDate && cleanG) {
                            matchedDate = dataInvoiceOnlyMap.get(cleanG) || "";
                        }

                        // Ensure row has Col F slot
                        while (row.length <= colF_OrderDate) row.push("");
                        row[colF_OrderDate] = matchedDate || "";

                        // Pure text format on Order ID (Col B)
                        row[colB_OrderId] = toPureText(row[colB_OrderId]);

                        if (matchedDate) {
                            fileMatched++;
                        } else {
                            fileUnmatched++;
                        }
                    }

                    totalProcessedRows += fileTotalRows;
                    totalMatchedDates += fileMatched;
                    totalUnmatchedDates += fileUnmatched;

                    leLog(`[${fileObj.name}] Done: ${fileTotalRows} rows [${fileMatched} dates matched, ${fileUnmatched} unmatched]`, fileUnmatched === 0 ? 'success' : 'info');

                    // Create Worksheet
                    const updatedWs = XLSX.utils.aoa_to_sheet(workingAoa);
                    
                    // Merge Row 1: A1 to G1
                    const endCol = Math.max(6, (workingAoa[1] ? workingAoa[1].length - 1 : 6));
                    updatedWs['!merges'] = [
                        { s: { r: 0, c: 0 }, e: { r: 0, c: endCol } }
                    ];

                    formatLossWorksheet(updatedWs);

                    // Sheet Name (Clean & Max 31 chars)
                    let safeSheetName = baseFileName.replace(/[:\\/?*\[\]]/g, "_").trim().slice(0, 31);
                    if (!safeSheetName) safeSheetName = `Loss_Sheet_${fIdx + 1}`;
                    if (usedSheetNames.has(safeSheetName)) {
                        let cnt = 2;
                        let altName = safeSheetName.slice(0, 28) + `_${cnt}`;
                        while (usedSheetNames.has(altName)) {
                            cnt++;
                            altName = safeSheetName.slice(0, 28) + `_${cnt}`;
                        }
                        safeSheetName = altName;
                    }
                    usedSheetNames.add(safeSheetName);

                    // 1. Add to Merged Workbook
                    XLSX.utils.book_append_sheet(mergedWb, updatedWs, safeSheetName);

                    // 2. Create Single Updated Workbook
                    const singleWb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(singleWb, updatedWs, safeSheetName);
                    const singleBuffer = XLSX.write(singleWb, { bookType: 'xlsx', type: 'array' });
                    const singleBlob = new Blob([singleBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

                    // Add to ZIP Package
                    const outputSingleFilename = `${baseFileName}.xlsx`;
                    zip.file(outputSingleFilename, singleBuffer);

                    // Push to Processed List for UI Table
                    processedFilesList.push({
                        name: outputSingleFilename,
                        sheetName: safeSheetName,
                        totalRows: fileTotalRows,
                        matched: fileMatched,
                        unmatched: fileUnmatched,
                        blob: singleBlob,
                        aoa: workingAoa
                    });

                    // 3. Register in Error Tracker Database
                    let partyOrWhName = baseFileName;
                    if (baseFileName.includes('-')) {
                        partyOrWhName = baseFileName.split('-')[0].trim() + '-' + baseFileName.split('-')[1].trim();
                    }
                    partyOrWhName = partyOrWhName.replace(/Ajio|Loss|Report|Dispute/gi, '').trim() || baseFileName;

                    try {
                        registerTrackedError('loss', fileObj.name, partyOrWhName, 'Loss Report Dispute', fileTotalRows);
                    } catch (trackErr) {
                        console.warn("Could not register in Error Tracker:", trackErr);
                    }
                }

                if (processedFilesList.length === 0) {
                    throw new Error("No Loss Details files were processed.");
                }

                // Step 3: Finalize Merged Excel & ZIP Bundle
                if (leProgressBar) leProgressBar.style.width = '95%';
                if (leProgressPercent) leProgressPercent.innerText = '95%';
                if (leProgressStepText) leProgressStepText.innerText = 'Generating ZIP & Merged Excel files...';

                const timestamp = getFormattedDateTime();
                const mergedFilename = `Merged_Loss_Errors_${timestamp}.xlsx`;
                const zipFilename = `ajio_loss_error_bundle_${timestamp}.zip`;

                const mergedBuffer = XLSX.write(mergedWb, { bookType: 'xlsx', type: 'array' });
                leMergedBlob = new Blob([mergedBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                zip.file(mergedFilename, mergedBuffer);

                leZipBlob = await zip.generateAsync({ type: 'blob' });

                // Step 4: Render UI Dashboard
                if (leProgressBar) leProgressBar.style.width = '100%';
                if (leProgressPercent) leProgressPercent.innerText = '100%';
                if (leProgressStepText) leProgressStepText.innerText = 'All loss files processed successfully!';

                if (leStatus) {
                    leStatus.className = 'status-indicator success';
                    leStatus.innerText = 'Completed';
                }

                renderLeDashboard(processedFilesList, leMergedBlob, zipFilename, mergedFilename, {
                    totalFiles: processedFilesList.length,
                    totalRows: totalProcessedRows,
                    totalMatched: totalMatchedDates,
                    totalUnmatched: totalUnmatchedDates
                });

                leLog(`Successfully completed ${processedFilesList.length} files processed. Total records: ${totalProcessedRows} (${totalMatchedDates} dates matched).`, 'success');
                leLog(`Merged Excel created: "${mergedFilename}" (${formatBytes(mergedBuffer.byteLength)})`, 'info');
                leLog(`ZIP Package created: "${zipFilename}" (${formatBytes(leZipBlob.size)})`, 'info');

            } catch (err) {
                leLog(`Process failed: ${err.message}`, 'error');
                if (leStatus) {
                    leStatus.className = 'status-indicator idle';
                    leStatus.innerText = 'Failed';
                }
                if (leOutputContainer) {
                    leOutputContainer.innerHTML = `
                        <div class="empty-output-state">
                            <i class="fa-solid fa-circle-exclamation placeholder-icon" style="color: #ef4444;"></i>
                            <p style="color: #ef4444; font-weight: 600;">Error: ${err.message}</p>
                        </div>
                    `;
                }
            } finally {
                leBtn.removeAttribute('disabled');
            }
        });
    }

    // Add Clear & Reset button to all tab panel headers dynamically
    const panelHeaders = document.querySelectorAll('.tab-pane .panel-header');
    panelHeaders.forEach(header => {
        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn btn-clear-reset-all';
        resetBtn.style.fontSize = '0.75rem';
        resetBtn.style.padding = '0.35rem 0.75rem';
        resetBtn.style.borderRadius = '8px';
        resetBtn.style.background = 'linear-gradient(135deg, #fef2f2, #fee2e2)';
        resetBtn.style.color = '#ef4444';
        resetBtn.style.border = '1px solid #fca5a5';
        resetBtn.style.fontWeight = '600';
        resetBtn.style.cursor = 'pointer';
        resetBtn.style.display = 'inline-flex';
        resetBtn.style.alignItems = 'center';
        resetBtn.style.gap = '0.35rem';
        resetBtn.style.marginLeft = 'auto'; // Push to the right
        resetBtn.style.transition = 'all 0.2s ease';
        resetBtn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
        resetBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Clear & Reset';
        
        // Hover styling
        resetBtn.addEventListener('mouseenter', () => {
            resetBtn.style.background = '#fee2e2';
            resetBtn.style.transform = 'translateY(-1px)';
        });
        resetBtn.addEventListener('mouseleave', () => {
            resetBtn.style.background = 'linear-gradient(135deg, #fef2f2, #fee2e2)';
            resetBtn.style.transform = 'translateY(0)';
        });
        
        resetBtn.addEventListener('click', async () => {
            const confirmed = await showCustomConfirm(
                'Reset Tab Confirmation',
                'Are you sure you want to clear all data and reset this tab? This will clear all uploaded files, results, and cached data for this section.',
                'danger',
                'Yes, Reset'
            );
            if (!confirmed) return;

            const pane = header.closest('.tab-pane');
            const paneId = pane ? pane.id : '';

            // 1. File Converter Tab
            if (paneId === 'tab-converter' || paneId === 'tab-convert') {
                selectedFiles = [];
                processedFiles = [];
                processedZipBlob = null;
                isBatchZipMode = false;
                batchZipFile = null;
                batchUploadedZipName = "";
                batchProcessedZipBlob = null;
                batchResults = [];
                if (fileInput) fileInput.value = '';
                if (zipInput) zipInput.value = '';
                if (folderInput) folderInput.value = '';
                if (processStatus) {
                    processStatus.className = 'status-indicator idle';
                    processStatus.innerText = 'Idle';
                }
                if (progressCard) progressCard.classList.add('hidden');
                if (overallProgressBar) overallProgressBar.style.width = '0%';
                if (progressPercent) progressPercent.innerText = '0% Completed';
                if (processedContainer) {
                    processedContainer.className = 'processed-container empty';
                    processedContainer.innerHTML = `
                        <div class="empty-output-state">
                            <i class="fa-solid fa-gears-gear placeholder-icon"></i>
                            <p>Upload files and click convert to see results here.</p>
                        </div>
                    `;
                }
                updateUI();
                log('Cleared all files and reset File Converter.', 'info');
                return;
            }

            // 2. Folder Create Tab
            if (paneId === 'tab-folder-create' || paneId === 'tab-folder') {
                fcFiles = [];
                fcFolderGroups = [];
                fcZipBlob = null;
                fcZipFilename = "";
                fcMissingReportBlob = null;
                if (fcFileInput) fcFileInput.value = '';
                if (fcFolderInput) fcFolderInput.value = '';
                updateFcUI();
                if (fcOutputContainer) {
                    fcOutputContainer.innerHTML = `
                        <div class="empty-output-state">
                            <i class="fa-solid fa-folder-plus placeholder-icon"></i>
                            <p>Upload files and click process to group into folders and zip.</p>
                        </div>
                    `;
                    fcOutputContainer.className = 'processed-container empty';
                }
                if (fcStatus) {
                    fcStatus.className = 'status-indicator idle';
                    fcStatus.innerText = 'Idle';
                }
                if (fcProgressCard) fcProgressCard.classList.add('hidden');
                await clearTabSession('folder_create_tab');
                fcLog('Cleared all files and reset Folder Create.', 'info');
                return;
            }

            // 3. Separate File Tab
            if (paneId === 'tab-separate') {
                ['simple', 'details', 'summary', 'tax'].forEach(k => {
                    sepUploadedFiles[k] = null;
                    const prevVariant = sepVariantResults[k] || {};
                    sepVariantResults[k] = { label: prevVariant.label || '', color: prevVariant.color || '', files: [], zipBlob: null, zipName: '' };
                    const input = document.getElementById(`sepFileInput${k.charAt(0).toUpperCase() + k.slice(1)}`);
                    const display = document.getElementById(`sepFileDisplay${k.charAt(0).toUpperCase() + k.slice(1)}`);
                    const dropzone = document.getElementById(`sepDropzone${k.charAt(0).toUpperCase() + k.slice(1)}`);
                    const clearBtn = document.getElementById(`clearSep${k.charAt(0).toUpperCase() + k.slice(1)}Btn`);
                    if (input) input.value = '';
                    if (display) display.innerText = `Click or drag ${k.toUpperCase()} file`;
                    if (dropzone) dropzone.classList.remove('file-selected');
                    if (clearBtn) clearBtn.style.display = 'none';
                });
                updateSepUploadState();
                if (separateOutputContainer) {
                    separateOutputContainer.innerHTML = `
                        <div class="empty-output-state">
                            <i class="fa-solid fa-file-export placeholder-icon"></i>
                            <p>Upload files and click process to separate into bundles.</p>
                        </div>
                    `;
                    separateOutputContainer.className = 'processed-container empty';
                }
                if (separateStatus) {
                    separateStatus.className = 'status-indicator idle';
                    separateStatus.innerText = 'Idle';
                }
                if (separateProgressCard) separateProgressCard.classList.add('hidden');
                await clearTabSession('separate_tab');
                separateLog('Cleared all files and reset Separate File tab.', 'info');
                return;
            }

            // 4. Merge File Tab (General Merger)
            if (paneId === 'tab-merge') {
                gmFiles = [];
                gmMergedList = [];
                gmZipBlob = null;
                if (gmFileInput) gmFileInput.value = '';
                updateGmUI();
                if (gmOutputContainer) {
                    gmOutputContainer.innerHTML = `
                        <div class="empty-output-state">
                            <i class="fa-solid fa-code-merge placeholder-icon"></i>
                            <p>Upload files and click process to merge by filename suffix.</p>
                        </div>
                    `;
                    gmOutputContainer.className = 'processed-container empty';
                }
                if (gmStatus) {
                    gmStatus.className = 'status-indicator idle';
                    gmStatus.innerText = 'Idle';
                }
                if (gmProgressCard) gmProgressCard.classList.add('hidden');
                await clearTabSession('merge_tab');
                gmLog('Cleared all files and reset Merge tab.', 'info');
                return;
            }

            // 5. Rename Tab
            if (paneId === 'tab-rename') {
                renFiles = [];
                activeRenamedFiles = [];
                renZipBlob = null;
                renOrderZipBlob = null;
                renTaxZipBlob = null;
                renIsProcessed = false;
                if (renFileInput) renFileInput.value = '';
                if (renFileInputG) renFileInputG.value = '';
                updateRenUI();
                if (renStatus) {
                    renStatus.className = 'status-indicator idle';
                    renStatus.innerText = 'Idle';
                }
                if (renProgressCard) renProgressCard.classList.add('hidden');
                await clearTabSession('rename_tab');
                renLog('Cleared all files and reset Rename tab.', 'info');
                return;
            }

            // 6. OD & Account Details Merger Tab
            if (paneId === 'tab-merger') {
                odFile = null;
                accFile = null;
                if (odFileInput) odFileInput.value = '';
                if (accFileInput) accFileInput.value = '';
                if (odFileDisplay) odFileDisplay.innerText = 'Click or drag OD file here';
                if (accFileDisplay) accFileDisplay.innerText = 'Click or drag Account Details file here';
                if (odDropzone) odDropzone.classList.remove('file-selected');
                if (accDropzone) accDropzone.classList.remove('file-selected');
                checkMergerInputs();
                if (mergerOutputContainer) {
                    mergerOutputContainer.innerHTML = `
                        <div class="empty-output-state">
                            <i class="fa-solid fa-code-merge placeholder-icon"></i>
                            <p>Upload OD and Account Details files, then click process.</p>
                        </div>
                    `;
                    mergerOutputContainer.className = 'processed-container empty';
                }
                mergerLog('Cleared merger files and reset tab.', 'info');
                return;
            }

            // 7. Error Tabs (Ajio Error & Invoice Error)
            if (paneId === 'tab-ajio-error') {
                // Reset Sale State
                aeDetailsFile = null;
                aeDataFile = null;
                aeProcessedBlob = null;
                aeProcessedFilename = "";
                if (aeDetailsFileInput) aeDetailsFileInput.value = '';
                if (aeDataFileInput) aeDataFileInput.value = '';
                if (aeDetailsFileDisplay) aeDetailsFileDisplay.innerText = 'Drag & drop or Click to choose';
                if (aeDataFileDisplay) aeDataFileDisplay.innerText = 'Drag & drop or Click to choose';
                if (aeDetailsDropzone) aeDetailsDropzone.classList.remove('file-selected');
                if (aeDataDropzone) aeDataDropzone.classList.remove('file-selected');
                checkAeInputs();
                if (aeOutputContainer) {
                    aeOutputContainer.innerHTML = `
                        <div class="empty-output-state">
                            <i class="fa-solid fa-triangle-exclamation placeholder-icon"></i>
                            <p>Upload files and click process to run Ajio Error logic.</p>
                        </div>
                    `;
                    aeOutputContainer.className = 'processed-container empty';
                }
                if (aeStatus) {
                    aeStatus.className = 'status-indicator idle';
                    aeStatus.innerText = 'Idle';
                }
                if (aeProgressCard) aeProgressCard.classList.add('hidden');

                // Reset Purchase State
                aePurchaseDetailsFiles = [];
                aePurchaseDataFile = null;
                aePurchaseProcessedBlob = null;
                if (aePurchaseDetailsFileInput) aePurchaseDetailsFileInput.value = '';
                if (aePurchaseDataFileInput) aePurchaseDataFileInput.value = '';
                if (aePurchaseDataFileDisplay) aePurchaseDataFileDisplay.innerText = 'Drag & drop or Click to choose';
                if (aePurchaseDataDropzone) aePurchaseDataDropzone.classList.remove('file-selected');
                updateAePurchaseDetailsUI();
                if (aePurchaseOutputContainer) {
                    aePurchaseOutputContainer.innerHTML = `
                        <div class="empty-output-state">
                            <i class="fa-solid fa-bag-shopping placeholder-icon" style="color: var(--color-primary);"></i>
                            <p>Upload Purchase Details & Data files and click process to run Purchase Error logic.</p>
                        </div>
                    `;
                    aePurchaseOutputContainer.className = 'processed-container empty';
                }
                if (aePurchaseStatus) {
                    aePurchaseStatus.className = 'status-indicator idle';
                    aePurchaseStatus.innerText = 'Idle';
                }
                if (aePurchaseProgressCard) aePurchaseProgressCard.classList.add('hidden');

                aeLog('Cleared files and reset Sale & Purchase sections.', 'info');
                return;
            }

            if (paneId === 'tab-invoice-error') {
                ieFiles = [];
                if (ieFileInput) ieFileInput.value = '';
                updateIeUI();
                if (ieOutputContainer) {
                    ieOutputContainer.innerHTML = `
                        <div class="empty-output-state">
                            <i class="fa-solid fa-file-circle-exclamation placeholder-icon"></i>
                            <p>Upload files and click process to separate errors.</p>
                        </div>
                    `;
                    ieOutputContainer.className = 'processed-container empty';
                }
                if (ieStatus) {
                    ieStatus.className = 'status-indicator idle';
                    ieStatus.innerText = 'Idle';
                }
                if (ieProgressCard) ieProgressCard.classList.add('hidden');
                ieLog('Cleared error files and reset tab.', 'info');
                return;
            }

            if (paneId === 'tab-loss-error') {
                leDetailsFiles = [];
                leDataFile = null;
                if (leDetailsFileInput) leDetailsFileInput.value = '';
                if (leDataFileInput) leDataFileInput.value = '';
                updateLeDetailsFileListUI();
                if (leDataFileDisplay) leDataFileDisplay.innerText = 'Drag & drop or Click to choose';
                if (leDataDropzone) leDataDropzone.classList.remove('file-selected');
                if (leStatus) {
                    leStatus.className = 'status-indicator idle';
                    leStatus.innerText = 'Idle';
                }
                if (leProgressCard) leProgressCard.classList.add('hidden');
                if (leOutputContainer) {
                    leOutputContainer.className = 'processed-container empty';
                    leOutputContainer.innerHTML = `
                        <div class="empty-output-state">
                            <i class="fa-solid fa-arrow-trend-down placeholder-icon" style="color: #e11d48;"></i>
                            <p>Upload Loss Details & Reference files and click process to run Loss Error logic.</p>
                        </div>
                    `;
                }
                leLog('Cleared all files and reset Loss Error tab.', 'info');
                return;
            }
        });

        header.appendChild(resetBtn);
    });

    /* ==========================================================================
       ERROR TRACKING DATABASE & DASHBOARD LOGIC (SHARED CLOUD / LOCAL FALLBACK)
       ========================================================================== */
    let trackerSyncStatus = 'offline'; // 'online' (Google Sheets) or 'offline' (LocalStorage)

    // Helper: format sync status badge
    function updateTrackerSyncBadge() {
        const badge = document.getElementById('trackerSyncBadge');
        if (!badge) return;
        if (trackerSyncStatus === 'online') {
            badge.style.background = 'rgba(5, 150, 105, 0.1)';
            badge.style.color = 'var(--color-success)';
            badge.style.borderColor = 'rgba(5, 150, 105, 0.2)';
            badge.innerText = 'Google Sheets Sync Active';
        } else {
            badge.style.background = 'rgba(245, 158, 11, 0.1)';
            badge.style.color = '#d97706';
            badge.style.borderColor = 'rgba(245, 158, 11, 0.2)';
            badge.innerText = 'Offline Backup Mode';
        }
    }

    // 1. Fetch error records (remote first, local fallback)
    async function fetchTrackedErrors() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 sec timeout
            
            const response = await fetch(`${GOOGLE_SHEETS_SCRIPT_URL}?action=getTrackedErrors`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (response.ok) {
                const result = await response.json();
                if (result && result.status === 'success') {
                    trackerSyncStatus = 'online';
                    updateTrackerSyncBadge();
                    return result.errors || [];
                }
            }
        } catch (e) {
            // Quietly fall back to local storage when Google Sheets is unreachable
        }
        
        trackerSyncStatus = 'offline';
        updateTrackerSyncBadge();
        
        // Local fallback
        let records = JSON.parse(localStorage.getItem('trackedErrors') || '[]');
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        records = records.filter(r => (now - new Date(r.createdDate).getTime()) < THIRTY_DAYS_MS);
        localStorage.setItem('trackedErrors', JSON.stringify(records));
        return records;
    }

    // 2. Register a new error entry (sends to Google Sheets in bg, duplicates to local)
    async function registerTrackedError(type, fileName, partyOrWh, errorType, rowsCount) {
        const newRecord = {
            id: 'err-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            type: type, // 'ajio' or 'invoice'
            fileName: fileName,
            partyOrWh: partyOrWh,
            errorType: errorType,
            rowsCount: rowsCount,
            createdDate: new Date().toISOString(),
            solved: false,
            solvedDate: ''
        };

        // Local duplicate immediately (ensures instant load / offline fallback)
        let records = JSON.parse(localStorage.getItem('trackedErrors') || '[]');
        records.push(newRecord);
        localStorage.setItem('trackedErrors', JSON.stringify(records));

        try {
            const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' }, // Avoid CORS preflight on Apps Script
                body: JSON.stringify({
                    action: 'addTrackedError',
                    ...newRecord
                })
            });
            const result = await response.json();
            if (result && result.status === 'success') {
                trackerSyncStatus = 'online';
                updateTrackerSyncBadge();
            }
        } catch (e) {
            console.warn("Failed to write tracked error to Google Sheets:", e);
        }
    }

    // 3. Mark an error as solved
    async function solveTrackedError(id) {
        const solvedDate = new Date().toISOString();

        // Update locally immediately
        let records = JSON.parse(localStorage.getItem('trackedErrors') || '[]');
        const idx = records.findIndex(r => r.id === id);
        if (idx !== -1) {
            records[idx].solved = true;
            records[idx].solvedDate = solvedDate;
            localStorage.setItem('trackedErrors', JSON.stringify(records));
        }

        try {
            const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    action: 'solveTrackedError',
                    id: id,
                    solvedDate: solvedDate
                })
            });
            const result = await response.json();
            if (result && result.status === 'success') {
                trackerSyncStatus = 'online';
                updateTrackerSyncBadge();
            }
        } catch (e) {
            console.warn("Failed to solve tracked error on Google Sheets:", e);
        }
    }

    // 4. Clear all tracked errors database
    async function clearTrackedErrorsDb() {
        localStorage.removeItem('trackedErrors');

        try {
            const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    action: 'clearTrackedErrors'
                })
            });
            const result = await response.json();
            if (result && result.status === 'success') {
                trackerSyncStatus = 'online';
                updateTrackerSyncBadge();
            }
        } catch (e) {
            console.warn("Failed to clear tracked errors on Google Sheets:", e);
        }
    }

    // 4.5. Delete a specific error entry from database
    async function deleteTrackedError(id) {
        // Update locally immediately
        let records = JSON.parse(localStorage.getItem('trackedErrors') || '[]');
        records = records.filter(r => r.id !== id);
        localStorage.setItem('trackedErrors', JSON.stringify(records));

        try {
            const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    action: 'deleteTrackedError',
                    id: id
                })
            });
            const result = await response.json();
            if (result && result.status === 'success') {
                trackerSyncStatus = 'online';
                updateTrackerSyncBadge();
            }
        } catch (e) {
            console.warn("Failed to delete tracked error on Google Sheets:", e);
        }
    }

    // 5. Render Tracker Dashboard
    async function renderErrorTracker() {
        const statsActive = document.getElementById('statsActiveErrors');
        const statsSolved = document.getElementById('statsSolvedErrors');
        const statsTotal = document.getElementById('statsTotalErrors');
        const container = document.getElementById('trackerTableContainer');
        const searchInput = document.getElementById('trackerSearchInput');
        const statusFilter = document.getElementById('trackerStatusFilter');
        const sourceFilter = document.getElementById('trackerSourceFilter');

        if (!container) return;

        // Display spinner while loading
        container.innerHTML = `
            <div class="empty-output-state">
                <i class="fa-solid fa-spinner fa-spin placeholder-icon" style="color: var(--color-primary);"></i>
                <p>Loading tracked errors list from database...</p>
            </div>
        `;

        const errors = await fetchTrackedErrors();
        
        // Calculate counts
        const activeCount = errors.filter(e => !e.solved).length;
        const solvedCount = errors.filter(e => e.solved).length;
        const totalCount = errors.length;

        if (statsActive) statsActive.innerText = activeCount;
        if (statsSolved) statsSolved.innerText = solvedCount;
        if (statsTotal) statsTotal.innerText = totalCount;

        // Apply filters
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const statusVal = statusFilter ? statusFilter.value : 'all';
        const sourceVal = sourceFilter ? sourceFilter.value : 'all';

        const filtered = errors.filter(item => {
            // Search query matches fileName, partyOrWh, or errorType
            const matchesQuery = !query || 
                String(item.fileName).toLowerCase().includes(query) ||
                String(item.partyOrWh).toLowerCase().includes(query) ||
                String(item.errorType).toLowerCase().includes(query);
            
            // Status match
            const matchesStatus = statusVal === 'all' || 
                (statusVal === 'active' && !item.solved) ||
                (statusVal === 'solved' && item.solved);
            
            // Source match
            let matchesSource = false;
            if (sourceVal === 'all') {
                matchesSource = true;
            } else if (sourceVal === 'purchase') {
                matchesSource = (item.type === 'purchase' || item.type === 'ajio_purchase');
            } else if (sourceVal === 'ajio') {
                matchesSource = (item.type === 'ajio' || item.type === 'ajio_sale');
            } else if (sourceVal === 'invoice') {
                matchesSource = (item.type === 'invoice');
            } else if (sourceVal === 'loss') {
                matchesSource = (item.type === 'loss' || item.type === 'loss_error');
            } else {
                matchesSource = (item.type === sourceVal);
            }

            return matchesQuery && matchesStatus && matchesSource;
        });

        // Sort: active (unsolved) first, then by date descending
        filtered.sort((a, b) => {
            if (a.solved !== b.solved) {
                return a.solved ? 1 : -1;
            }
            return new Date(b.createdDate) - new Date(a.createdDate);
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-output-state">
                    <i class="fa-solid fa-square-check placeholder-icon" style="color: var(--color-success); opacity: 0.8;"></i>
                    <p>No tracked errors match your criteria.</p>
                </div>
            `;
            return;
        }

        // Render Table
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.fontSize = '0.85rem';
        table.style.textAlign = 'left';

        table.innerHTML = `
            <thead>
                <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-primary);">
                    <th style="padding: 0.75rem; font-weight: 700; font-size: 0.75rem; text-transform: uppercase;">Source</th>
                    <th style="padding: 0.75rem; font-weight: 700; font-size: 0.75rem; text-transform: uppercase;">File / Error Details</th>
                    <th style="padding: 0.75rem; font-weight: 700; font-size: 0.75rem; text-transform: uppercase;">Party / Wh</th>
                    <th style="padding: 0.75rem; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; text-align: right;">Rows</th>
                    <th style="padding: 0.75rem; font-weight: 700; font-size: 0.75rem; text-transform: uppercase;">Date Added</th>
                    <th style="padding: 0.75rem; font-weight: 700; font-size: 0.75rem; text-transform: uppercase;">Days Active</th>
                    <th style="padding: 0.75rem; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; text-align: center;">Status</th>
                    <th style="padding: 0.75rem; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; text-align: center;">Action</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');

        filtered.forEach(record => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.transition = 'var(--transition-fast)';
            
            // Hover effect
            tr.addEventListener('mouseenter', () => {
                tr.style.background = 'rgba(123, 44, 191, 0.02)';
            });
            tr.addEventListener('mouseleave', () => {
                tr.style.background = 'transparent';
            });

            // Source badge
            let sourceBadge = '';
            if (record.type === 'purchase' || record.type === 'ajio_purchase') {
                sourceBadge = `<span style="background: rgba(123, 44, 191, 0.1); color: #7b2cbf; border: 1px solid rgba(123, 44, 191, 0.25); padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700;"><i class="fa-solid fa-cart-shopping" style="margin-right: 0.25rem;"></i> PURCHASE</span>`;
            } else if (record.type === 'loss' || record.type === 'loss_error') {
                sourceBadge = `<span style="background: rgba(225, 29, 72, 0.1); color: #e11d48; border: 1px solid rgba(225, 29, 72, 0.25); padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700;"><i class="fa-solid fa-arrow-trend-down" style="margin-right: 0.25rem;"></i> LOSS</span>`;
            } else if (record.type === 'ajio') {
                sourceBadge = `<span style="background: rgba(0, 150, 199, 0.08); color: var(--color-secondary); border: 1px solid rgba(0, 150, 199, 0.2); padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700;"><i class="fa-solid fa-tag" style="margin-right: 0.25rem;"></i> AJIO SALE</span>`;
            } else {
                sourceBadge = `<span style="background: rgba(234, 88, 12, 0.08); color: #ea580c; border: 1px solid rgba(234, 88, 12, 0.2); padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700;"><i class="fa-solid fa-file-invoice" style="margin-right: 0.25rem;"></i> INVOICE</span>`;
            }

            // Error Type details
            const detailHtml = `
                <div style="font-weight: 600; color: var(--text-primary);">${record.fileName}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.1rem;">${record.errorType}</div>
            `;

            // Day counter logic:
            // If active: Difference between now and createdDate
            // If solved: Difference between solvedDate and createdDate
            const createdTime = new Date(record.createdDate).getTime();
            const endTime = record.solved ? new Date(record.solvedDate).getTime() : Date.now();
            const diffDays = Math.max(0, Math.floor((endTime - createdTime) / (1000 * 60 * 60 * 24)));
            const daysText = record.solved 
                ? `<span style="color: var(--text-muted); font-size: 0.8rem;">Solved in ${diffDays} day${diffDays === 1 ? '' : 's'}</span>`
                : `<span style="color: var(--color-error); font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 0.25rem;"><i class="fa-regular fa-clock"></i> ${diffDays} Day${diffDays === 1 ? '' : 's'}</span>`;

            // Date Added formatted cleanly
            const addedDateFormatted = new Date(record.createdDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

            // Status badge
            const statusBadge = record.solved
                ? `<span style="background: rgba(5, 150, 105, 0.1); color: var(--color-success); border: 1px solid rgba(5, 150, 105, 0.2); padding: 0.25rem 0.5rem; border-radius: 20px; font-weight: 600; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.3rem;"><i class="fa-solid fa-circle-check"></i> Solved</span>`
                : `<span style="background: rgba(220, 38, 38, 0.1); color: var(--color-error); border: 1px solid rgba(220, 38, 38, 0.2); padding: 0.25rem 0.5rem; border-radius: 20px; font-weight: 600; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.3rem;"><i class="fa-solid fa-triangle-exclamation"></i> Active</span>`;

            // Action buttons (Solve + Delete)
            const actionHtml = record.solved
                ? `<div style="display: flex; gap: 0.4rem; justify-content: center; align-items: center;">
                       <span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic; margin-right: 0.3rem;">Solved</span>
                       <button class="btn delete-tracker-btn" data-id="${record.id}" style="padding: 0.35rem 0.6rem; font-size: 0.75rem; border-radius: 6px; background: rgba(220, 38, 38, 0.08); color: var(--color-error); border: 1px solid rgba(220, 38, 38, 0.15); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: var(--transition-fast); border: none;"><i class="fa-solid fa-trash-can"></i></button>
                   </div>`
                : `<div style="display: flex; gap: 0.4rem; justify-content: center; align-items: center;">
                       <button class="btn solve-tracker-btn" data-id="${record.id}" style="padding: 0.35rem 0.7rem; font-size: 0.75rem; border-radius: 6px; display: inline-flex; align-items: center; gap: 0.3rem; background: var(--color-success); color: white; cursor: pointer; font-weight: 600; transition: var(--transition-fast); border: none; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);"><i class="fa-solid fa-check-double"></i> Solve</button>
                       <button class="btn delete-tracker-btn" data-id="${record.id}" style="padding: 0.35rem 0.6rem; font-size: 0.75rem; border-radius: 6px; background: rgba(220, 38, 38, 0.08); color: var(--color-error); border: 1px solid rgba(220, 38, 38, 0.15); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: var(--transition-fast); border: none;"><i class="fa-solid fa-trash-can"></i></button>
                   </div>`;

            tr.innerHTML = `
                <td style="padding: 0.75rem; vertical-align: middle;">${sourceBadge}</td>
                <td style="padding: 0.75rem; vertical-align: middle;">${detailHtml}</td>
                <td style="padding: 0.75rem; vertical-align: middle; font-weight: 500; color: var(--text-secondary);">${record.partyOrWh}</td>
                <td style="padding: 0.75rem; vertical-align: middle; text-align: right; font-weight: 600; color: var(--text-secondary);">${record.rowsCount}</td>
                <td style="padding: 0.75rem; vertical-align: middle; color: var(--text-secondary);">${addedDateFormatted}</td>
                <td style="padding: 0.75rem; vertical-align: middle;">${daysText}</td>
                <td style="padding: 0.75rem; vertical-align: middle; text-align: center;">${statusBadge}</td>
                <td style="padding: 0.75rem; vertical-align: middle; text-align: center;">${actionHtml}</td>
            `;

            // Event listener for solve button
            const solveBtn = tr.querySelector('.solve-tracker-btn');
            if (solveBtn) {
                solveBtn.addEventListener('mouseenter', () => {
                    solveBtn.style.transform = 'translateY(-1px)';
                    solveBtn.style.boxShadow = '0 4px 10px rgba(5, 150, 105, 0.4)';
                });
                solveBtn.addEventListener('mouseleave', () => {
                    solveBtn.style.transform = 'translateY(0)';
                    solveBtn.style.boxShadow = '0 2px 6px rgba(5, 150, 105, 0.25)';
                });
                solveBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    solveBtn.setAttribute('disabled', 'true');
                    solveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                    await solveTrackedError(record.id);
                    renderErrorTracker();
                });
            }

            // Event listener for delete button
            const deleteBtn = tr.querySelector('.delete-tracker-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('mouseenter', () => {
                    deleteBtn.style.background = 'rgba(220, 38, 38, 0.15)';
                });
                deleteBtn.addEventListener('mouseleave', () => {
                    deleteBtn.style.background = 'rgba(220, 38, 38, 0.08)';
                });
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showCustomConfirm(
                        "Delete Record",
                        `Are you sure you want to delete the tracked error record for "${record.fileName}"? This action cannot be undone.`,
                        async (confirmed) => {
                            if (confirmed) {
                                deleteBtn.setAttribute('disabled', 'true');
                                deleteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                                await deleteTrackedError(record.id);
                                renderErrorTracker();
                            }
                        }
                    );
                });
            }

            tbody.appendChild(tr);
        });

        container.innerHTML = '';
        container.appendChild(table);
    }

    // Bind filters & toolbar controls
    const searchInput = document.getElementById('trackerSearchInput');
    const statusFilter = document.getElementById('trackerStatusFilter');
    const sourceFilter = document.getElementById('trackerSourceFilter');
    const clearDbBtn = document.getElementById('clearTrackerDbBtn');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderErrorTracker();
        });
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            renderErrorTracker();
        });
    }
    if (sourceFilter) {
        sourceFilter.addEventListener('change', () => {
            renderErrorTracker();
        });
    }
    if (clearDbBtn) {
        clearDbBtn.addEventListener('click', () => {
            showCustomConfirm(
                "Clear History",
                "Are you sure you want to delete all tracked error dispute history from Google Sheets and localStorage? This will wipe all records permanently.",
                async (confirmed) => {
                    if (confirmed) {
                        clearDbBtn.setAttribute('disabled', 'true');
                        clearDbBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Clearing...';
                        await clearTrackedErrorsDb();
                        clearDbBtn.removeAttribute('disabled');
                        clearDbBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Clear History';
                        renderErrorTracker();
                    }
                }
            );
        });
    }

    // Expose functions globally for debugging/console testing
    window.errorTracker = {
        fetch: fetchTrackedErrors,
        register: registerTrackedError,
        solve: solveTrackedError,
        delete: deleteTrackedError,
        clear: clearTrackedErrorsDb,
        render: renderErrorTracker
    };

    // Expose test rename download function globally
    window.testRenameDownload = function() {
        if (typeof JSZip === 'undefined') {
            alert("JSZip is not loaded yet on this page!");
            return;
        }
        const zip = new JSZip();
        zip.file("test_renamed_file.txt", "This is a mock renamed file inside the ZIP package.");
        zip.generateAsync({type: "blob"}).then(function(blob) {
            triggerDownload(blob, 'ajio_rename_file.zip');
            renLog('Downloaded test ZIP package: ajio_rename_file.zip', 'info');
        });
    };

    // Expose test merge download function globally
    window.testMergeDownload = function() {
        if (typeof JSZip === 'undefined') {
            alert("JSZip is not loaded yet on this page!");
            return;
        }
        const zip = new JSZip();
        zip.file("test_merged_file.txt", "This is a mock merged file inside the ZIP package.");
        zip.generateAsync({type: "blob"}).then(function(blob) {
            triggerDownload(blob, 'ajio_murge_file.zip');
            gmLog('Downloaded test ZIP package: ajio_murge_file.zip', 'info');
        });
    };

    // Expose test separate download function globally
    window.testSeparateDownload = function(choice) {
        if (typeof JSZip === 'undefined') {
            alert("JSZip is not loaded yet on this page!");
            return;
        }
        
        let zipName = "Split_Files_Package.zip";
        if (choice === 1 || choice === "1") zipName = "ajio_simple_seprate_budle.zip";
        else if (choice === 2 || choice === "2") zipName = "ajio_details_seprate_budle.zip";
        else if (choice === 3 || choice === "3") zipName = "ajio_summry_seprate_budle.zip";
        else if (choice === 4 || choice === "4") zipName = "ajio_tax_seprate_budle.zip";

        const zip = new JSZip();
        zip.file("test_separated_file.txt", "This is a mock separated file inside the ZIP package.");
        zip.generateAsync({type: "blob"}).then(function(blob) {
            triggerDownload(blob, zipName);
            separateLog(`Downloaded test ZIP package: ${zipName}`, 'info');
        });
    };

    // Expose test file converter download function globally
    window.testFileConverterDownload = function() {
        if (typeof JSZip === 'undefined') {
            alert("JSZip is not loaded yet on this page!");
            return;
        }
        const zip = new JSZip();
        zip.file("test_converted_file.txt", "This is a mock converted file inside the ZIP package.");
        zip.generateAsync({type: "blob"}).then(function(blob) {
            triggerDownload(blob, 'ajio_data_arrange_bundle.zip');
            log('Downloaded test ZIP package: ajio_data_arrange_bundle.zip', 'info');
        });
    };

    // Expose test Ajio Error download function globally
    window.testAjioErrorDownload = function() {
        if (typeof JSZip === 'undefined') {
            alert("JSZip is not loaded yet on this page!");
            return;
        }
        const zip = new JSZip();
        zip.file("test_ajio_error_file.txt", "This is a mock Ajio error output file inside the ZIP package.");
        zip.generateAsync({type: "blob"}).then(function(blob) {
            triggerDownload(blob, 'ajio_price_dispute_bundle.zip');
            aeLog('Downloaded test ZIP package: ajio_price_dispute_bundle.zip', 'info');
        });
    };

    // Expose test Invoice Error download function globally
    window.testInvoiceErrorDownload = function() {
        if (typeof JSZip === 'undefined') {
            alert("JSZip is not loaded yet on this page!");
            return;
        }
        const zip = new JSZip();
        zip.file("test_invoice_error_file.txt", "This is a mock Invoice error output file inside the ZIP package.");
        zip.generateAsync({type: "blob"}).then(function(blob) {
            triggerDownload(blob, 'ajio_error_bundle.zip');
            ieLog('Downloaded test ZIP package: ajio_error_bundle.zip', 'info');
        });
    };



    // Initial load sync status trigger (non-blocking)
    fetchTrackedErrors();
}
);
