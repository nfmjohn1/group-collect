# Google Apps Script Setup

This folder contains the Google Apps Script code that acts as middleware between the Chrome extension and Google Sheets.

## Quick Setup (5 minutes)

### 1. Create a New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it "Group Collect - Member Data" (or any name you prefer)

### 2. Open Apps Script Editor

1. In your Google Sheet, click **Extensions > Apps Script**
2. This opens the Apps Script editor in a new tab

### 3. Add the Script Code

1. Delete any existing code in the editor
2. Copy all code from [`Code.gs`](./Code.gs)
3. Paste it into the Apps Script editor
4. Click the save icon (💾) or press `Ctrl+S` / `Cmd+S`
5. Name your project "Group Collect API" (optional)

### 4. Deploy as Web App

1. Click **Deploy > New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure the deployment:
   - **Description**: "Group Collect API v1" (or leave blank)
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone**
5. Click **Deploy**
6. You may need to authorize the script:
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** if you see a warning
   - Click "Go to [Project Name] (unsafe)"
   - Click **Allow**
7. **Copy the Web App URL** - it looks like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

### 5. Configure the Extension

1. Open the Group Collect extension popup
2. Go to the **Settings** tab
3. Paste the Web App URL into the "Google Sheet URL" field
4. Click **Save Settings**

### 6. Test the Connection

1. Go to your Facebook group's member requests page
2. Capture some members (or use test data)
3. Open the extension popup
4. Click **Push to Sheet** button
5. Check your Google Sheet - the data should appear!

## How It Works

```
Chrome Extension
    ↓ (POST request with member data)
Google Apps Script Web App
    ↓ (appends rows)
Google Sheet
```

The Apps Script acts as a secure middleman that:
- Receives member data from the extension
- Validates the data format
- Creates headers if needed
- Appends new rows to the sheet
- Returns success/error response

## Troubleshooting

### "Authorization required" error

**Solution**: Redeploy the script:
1. Go to **Deploy > Manage deployments**
2. Click **Archive** on the old deployment
3. Create a new deployment (steps 4-7 above)
4. Use the new Web App URL in the extension

### "Script not found" error

**Solution**: Check the URL:
- Make sure you copied the **Web App URL**, not the script editor URL
- The URL should end with `/exec`
- Make sure "Who has access" is set to "Anyone"

### Data not appearing in sheet

**Solution**: Check the sheet:
- Make sure you're looking at the correct sheet
- Try clicking **Extensions > Apps Script > Run > testImport** to test
- Check if the extension is sending data (open browser console)

### "Invalid data format" error

**Solution**:
- Make sure you're using the latest version of the extension
- Try clearing and recapturing member data
- Check the browser console for error details

## Security Notes

⚠️ **Important Security Information**:

- The Web App URL is essentially an API endpoint that anyone can POST to
- Only share this URL with trusted people
- The script runs with **your** Google account permissions
- The script can only write to the sheet it's attached to
- Consider creating a dedicated Google account for this if you're concerned about security

## Advanced: Multiple Sheets

To use the same script with multiple sheets:

1. Duplicate your Google Sheet
2. The duplicated sheet will have the same script
3. Deploy a new Web App from the duplicated sheet's script
4. Each deployment gets a unique URL
5. Configure different browser profiles or extensions with different URLs

## Script Modifications

### Change Header Names

Edit the `ensureHeaders` function in `Code.gs`:

```javascript
const headers = [
  'Date',           // Changed from 'Timestamp'
  'First',          // Changed from 'First Name'
  // ... etc
];
```

### Add Custom Columns

1. Add to headers array in `ensureHeaders`
2. Add to row array in `formatMemberRow`
3. Redeploy the script

### Change Sheet Formatting

Edit the `ensureHeaders` function to customize:
- Background color: `.setBackground('#00c805')`
- Text color: `.setFontColor('#000000')`
- Font weight: `.setFontWeight('bold')`

## Support

If you encounter issues:
1. Check the Apps Script logs: **Executions** tab in the editor
2. Run the `testImport()` function manually to test
3. Verify your deployment settings
4. Make sure the sheet isn't protected or locked
