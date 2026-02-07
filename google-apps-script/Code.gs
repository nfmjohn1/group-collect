/**
 * Group Collect - Google Apps Script Web App
 *
 * This script receives member data from the Chrome extension and appends it to the sheet.
 *
 * DEPLOYMENT INSTRUCTIONS:
 * 1. In your Google Sheet, go to Extensions > Apps Script
 * 2. Replace all code with this file's contents
 * 3. Click Deploy > New deployment
 * 4. Select type: Web app
 * 5. Execute as: Me
 * 6. Who has access: Anyone
 * 7. Click Deploy
 * 8. Copy the Web App URL and paste it in the extension settings
 */

/**
 * Handle GET requests - returns info about the sheet
 */
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    sheetName: sheet.getName(),
    rowCount: sheet.getLastRow(),
    message: 'Group Collect is connected to this sheet'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests - appends member data to the sheet
 */
function doPost(e) {
  try {
    // Parse incoming data
    const data = JSON.parse(e.postData.contents);

    // Validate data
    if (!data.members || !Array.isArray(data.members)) {
      throw new Error('Invalid data format: members array required');
    }

    if (data.members.length === 0) {
      return createResponse(true, 'No members to add', 0);
    }

    // Get active sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Append each member (headers are expected to already exist in the template)
    let addedCount = 0;
    data.members.forEach(member => {
      const row = formatMemberRow(member);
      sheet.appendRow(row);
      addedCount++;
    });

    // Return success response
    return createResponse(true, `Added ${addedCount} members`, addedCount);

  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return createResponse(false, error.toString(), 0);
  }
}

/**
 * Format member data into a row array
 */
function formatMemberRow(member) {
  return [
    member.groupName || '',
    member.userId || '',
    member.fullName || '',
    member.joinedFacebook || '',
    member.question1 || '',
    member.answer1 || '',
    member.question2 || '',
    member.answer2 || '',
    member.question3 || '',
    member.answer3 || '',
    member.timestamp || new Date().toISOString(),
    member.firstName || '',
    member.lastName || '',
    member.city || ''
  ];
}

/**
 * Create a JSON response
 */
function createResponse(success, message, count) {
  const response = {
    success: success,
    message: message,
    count: count,
    timestamp: new Date().toISOString()
  };

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function - can be run manually to test the script
 */
function testImport() {
  const testData = {
    members: [
      {
        timestamp: new Date().toISOString(),
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        profileUrl: 'https://facebook.com/test',
        userId: 'test',
        email: 'test@example.com',
        question1: 'What is your email?',
        answer1: 'test@example.com',
        question2: 'Why do you want to join?',
        answer2: 'I love fly fishing!',
        groupName: 'Test Group',
        joinedFacebook: '',
        city: ''
      }
    ]
  };

  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };

  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}
