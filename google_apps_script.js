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
}
