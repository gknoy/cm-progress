/*
 * CM Gold Progress Lookup
 *
 * NOT YET IMPLEMENTED:
 * - Reads sheets to get (realm + name) of characters
 * - Loads CM progress for each character from the WoW API
 *   e.g: http://us.battle.net/api/wow/character/realmname/charname?fields=challenge
 *   (Note that order of CM results appears to be arbitrary)
 * - Writes columns, sorted by CM name
 * - Apply custom colors based on gold/silver/bronze/none
 *
 * Requires underscoreGS library (MiC3qjLYVUjCCUQpMqPPTWUF7jOZt2NQ8), added as '_'
 */


// GK: Can I declare this directly, or must I inject it in onLoad?
// -- from http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format/4673436#4673436
if (!String.prototype.format) {
  String.prototype.format = function () {
    "use strict";
    var args = arguments;
    return this.replace(/\{(\d+)\}/g, function (match, number) {
      return typeof args[number] !== 'undefined' ? args[number] : match;
    });
  };
};


//function debug(range, text) {
//  // TODO: given a row, look up the cell ourself to make it more convenient
//  range.offset(0,0, 1, 1).setValue(text);
//};


// --------------------------
// Data retrieval
// --------------------------

// From pre-generated example:
// /**
//  * Retrieves all the rows in the active spreadsheet that contain data and logs the
//  * values for each row.
//  * https://developers.google.com/apps-script/service_spreadsheet
//  */
// function example__readRows() {
//   var sheet = SpreadsheetApp.getActiveSheet();
//   var rows = sheet.getDataRange();
//   var numRows = rows.getNumRows();
//   var values = rows.getValues();
//   for (var i = 0; i <= numRows - 1; i++) {
//     var row = values[i];
//     Logger.log(row);
//   }
// };


/**
 *
 */
function fetchAllCMProgress() {
  // TODO: Find user rows
  // For each user row, get (realm/name),
  // c.f. https://developers.google.com/apps-script/guides/services/external
  //

  var sheet = SpreadsheetApp.getActiveSheet();
  var rows = sheet.getDataRange();
  var maxRowIndex = rows.getLastRow();

  // rows/cols are 1-indexed?
  var startRow = 4 // first characters to look at
  var realmCol = 1;
  var nameCol = 2;
  var debugCol = 14;

  for (var i = startRow; i <= maxRowIndex; i++) {
    var realm = rows.getCell(i, realmCol).getValue();
    var character = rows.getCell(i, nameCol).getValue();

    if (("string" === (typeof realm)) && (0 < realm.length) &&
      ("string" === (typeof character)) && (0 < realm.length))
      {
        var msg = "TODO: fetch {0}/{1}".format(realm, character);
        Logger.log(msg);
        // rows.getCell(i, debugCol).setValue(msg);
        fetchCMProgress(rows.offset(i-1, 3, 1, 11),
                        realm, character,
                        renderCMProgress  // callback
                       );
      }
  }

  // TODO: Iterate rows. If we have realm + character, fetchCMProgress.
};

/**
 * Fetches CM progress
 * :param row: row object
 * :param realm: realm name
 * :param character: character name
 * :param callback: e.g. ref to renderer(row, progress) function
 */
function fetchCMProgress(row, realm, character, callback) {
  if (("string" === (typeof realm)) && (0 < realm.length) &&
    ("string" === (typeof character)) && (0 < realm.length))
    {
      // Call Blizzard API to get CM data
      var url = "http://us.battle.net/api/wow/character/{0}/{1}?fields=challenge".format(realm, character);

      var response = UrlFetchApp.fetch(url);
      var result = JSON.parse(response.getContentText());

      // Logger.log(result);

      if (callback) {
        callback(row, result.challenge);
      }
    }
};

/**
 * Fetches CM progress
 * :param row: row object
 * :param data: JSON data of progress
 */
function renderCMProgress(row, data) {
  var startCol = 4; // D
  var nChallenges = data.goldCount;
  var records = data.records.sort(function (a, b) {
    return a.map.name.localeCompare(b.map.name);
  });

  var names = _._map(records, function (o) { return o.map.name; });
  var medals = _._map(records, function (o) { return o.bestMedal.toLowerCase(); });

  // Logger.log(names);
  // Logger.log(medals);
  for( var i=0; i<9; i++) {
    // Must use offset(rows, cols, nrows, ncols) or else we duplicate for as many cells as our range has
    row.offset(0, i, 1, 1).setValue(medals[i]);
  }
  row.offset(0, 10, 1, 1).setValue("'{0}/9 gold".format(nChallenges));

  // TODO: Update col headers in row
  updateColumnHeaders(names);
};

/**
 * Update column headers to be sorted names of CM dungeons
 */
function updateColumnHeaders(names) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  // Logger.log(names);
  // var header = spreadsheet.getRange("D3:L3").setValues([ names ]);
};

// --------------------------
// Menu hooks
// --------------------------

/**
 * Adds a custom menu to the active spreadsheet, containing a single menu item
 * for invoking the other functions.
 * The onOpen() function, when defined, is automatically invoked whenever the
 * spreadsheet is opened.
 * For more information on using the Spreadsheet API, see
 * https://developers.google.com/apps-script/service_spreadsheet
 *
 * GK: We could likely auto-re-fetch these whenever the spreadsheet is opened,
 *     but for now I would rather invoke manually.
 */
function onOpen() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var entries = [{
	name : "Challenge Mode Progress",
    functionName : "fetchAllCMProgress"
  }];
  spreadsheet.addMenu("Fetch Armory Data", entries);

};
