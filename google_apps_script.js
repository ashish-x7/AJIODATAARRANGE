/**
 * Google Apps Script Web App for DataFlow Sync (Robust Version with Vendor Management)
 * 
 * Instructions:
 * 1. Open your Google Sheet ("AJIO DATA").
 * 2. Click "Extensions" -> "Apps Script" in the top menu.
 * 3. Delete any default code in the editor.
 * 4. Paste this code and click Save (disk icon).
 * 5. Click "Deploy" -> "Manage deployments" (or New deployment).
 * 6. Under "Select type", choose "Web App".
 * 7. Set "Execute as" to "Me" (your email).
 * 8. Set "Who has access" to "Anyone".
 * 9. Click "Deploy" / "New version", authorize access, and copy/confirm the Web App URL.
 */

function doGet(e) {
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
  
  if (action === "getTrackedErrors") {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("ERROR TRACKING");
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({status: "success", errors: []}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      var data = sheet.getDataRange().getValues();
      var header = data[0];
      var now = new Date().getTime();
      var THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      var rowsToKeep = [header];
      var errors = [];
      
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        if (row.length < 9) continue;
        var createdDateStr = row[6];
        var createdTime = new Date(createdDateStr).getTime();
        
        if (now - createdTime >= THIRTY_DAYS_MS) {
          continue;
        }
        
        rowsToKeep.push(row);
        errors.push({
          id: String(row[0]),
          type: String(row[1]),
          fileName: String(row[2]),
          partyOrWh: String(row[3]),
          errorType: String(row[4]),
          rowsCount: Number(row[5]),
          createdDate: String(row[6]),
          solved: row[7] === true || String(row[7]).toLowerCase() === "true",
          solvedDate: String(row[8])
        });
      }
      
      if (rowsToKeep.length < data.length) {
        sheet.clearContents();
        sheet.getRange(1, 1, rowsToKeep.length, rowsToKeep[0].length).setValues(rowsToKeep);
      }
      
      return ContentService.createTextOutput(JSON.stringify({status: "success", errors: errors}))
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
    
    // Action: Add Tracked Error
    if (action === "addTrackedError") {
      var sheet = getSheetRobust("ERROR TRACKING");
      if (!sheet) {
        sheet = ss.insertSheet("ERROR TRACKING");
        sheet.appendRow(["ID", "TYPE", "FILENAME", "PARTY_OR_WH", "ERROR_TYPE", "ROWS_COUNT", "CREATED_DATE", "SOLVED", "SOLVED_DATE"]);
      }
      sheet.appendRow([
        json.id,
        json.type,
        json.fileName,
        json.partyOrWh,
        json.errorType,
        json.rowsCount,
        json.createdDate,
        json.solved,
        json.solvedDate
      ]);
      return ContentService.createTextOutput(JSON.stringify({status: "success"}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Action: Solve Tracked Error
    if (action === "solveTrackedError") {
      var sheet = getSheetRobust("ERROR TRACKING");
      if (!sheet) {
        throw new Error("ERROR TRACKING sheet not found");
      }
      var data = sheet.getDataRange().getValues();
      var updated = false;
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === String(json.id).trim()) {
          sheet.getRange(i + 1, 8).setValue(true);
          sheet.getRange(i + 1, 9).setValue(json.solvedDate);
          updated = true;
          break;
        }
      }
      if (!updated) {
        throw new Error("Tracked error with ID " + json.id + " not found");
      }
      return ContentService.createTextOutput(JSON.stringify({status: "success"}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Action: Clear Tracked Errors
    if (action === "clearTrackedErrors") {
      var sheet = getSheetRobust("ERROR TRACKING");
      if (sheet) {
        sheet.clearContents();
        sheet.appendRow(["ID", "TYPE", "FILENAME", "PARTY_OR_WH", "ERROR_TYPE", "ROWS_COUNT", "CREATED_DATE", "SOLVED", "SOLVED_DATE"]);
      }
      return ContentService.createTextOutput(JSON.stringify({status: "success"}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Action: Delete Tracked Error
    if (action === "deleteTrackedError") {
      var sheet = getSheetRobust("ERROR TRACKING");
      if (!sheet) {
        throw new Error("ERROR TRACKING sheet not found");
      }
      var data = sheet.getDataRange().getValues();
      var deleted = false;
      for (var i = data.length - 1; i >= 1; i--) {
        if (String(data[i][0]).trim() === String(json.id).trim()) {
          sheet.deleteRow(i + 1);
          deleted = true;
        }
      }
      if (!deleted) {
        throw new Error("Tracked error with ID " + json.id + " not found");
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
}
