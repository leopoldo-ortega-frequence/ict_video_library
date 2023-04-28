// require function to create web application. Must have an HTML file named "index" to work
function doGet() {
  var template = HtmlService.createTemplateFromFile('index');
  template.data = getIndividualSheetData(CONFIG.sheet_id, CONFIG.sheet_name);
  return template.evaluate();
}

// custom function to include HTML 'components' onto HTML application
function include(fileName) {
  return HtmlService.createTemplateFromFile(fileName).evaluate().getContent();
}

function test() {
  Logger.log(CONFIG);
  getIndividualSheetData(CONFIG.sheet_id, CONFIG.sheet_name);
  Logger.log(getIndividualSheetData(CONFIG.sheet_id, CONFIG.sheet_name));
}

function getIndividualSheetData(sheetID, sheetName) {
  var ss = SpreadsheetApp.openById(sheetID).getSheetByName(sheetName);
  // Get the data range of the sheet
  const range = ss.getDataRange();
  // Get the values of the data range
  let values = range.getValues();
  // skip over rows if needed to reach actual headers
  values = values.slice(CONFIG.skip);
  // if we want to use custom keys, modify header names
  if (CONFIG.use_keys) {
    let new_headers = [];
    values[0].forEach((header) => {
      new_headers.push(CONFIG.custom_keys[header]);
    });
    values[0] = new_headers;
  }
  return parse_sheet(values);
}

// Gets all data from your sheet and formats it to a JS friendly format
function parse_sheet(data) {
  // the goal will be to convert into an array of objects.
  // grab header names
  var header_name = data[0];
  // we will store parsed data in this array
  var formatted_data = [];
  // start at index 1 to skip sheet Headers
  for (var i = 1; i < data.length; i++) {
    var row_data = data[i];
    // create an object for current 'row'
    var new_object = {};
    for (var j = 0; j < row_data.length; j++) {
      var value = row_data[j];
      // cannot send Sheet Date to client, must format to string and parse in application
      if (value instanceof Date) {
        value = value.toLocaleDateString('en-US');
      }
      // checking if we need to round numbers with large decimal places
      if (typeof value === 'number') {
        var stringed = String(value);
        if (stringed.length > 4) {
          value = Math.round(value * 100) / 100;
        }
      }
      new_object[header_name[j]] = value;
    }
    // add newly parsed object to formatted array
    formatted_data.push(new_object);
  }
  return formatted_data;
}