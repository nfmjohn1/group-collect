# Privacy Policy for Group Collect

**Last Updated:** January 13, 2026  
**Effective Date:** January 13, 2026

## Introduction

Welcome to Group Collect ("we," "our," or "us"). We are committed to protecting your privacy and handling your data in an open and transparent manner. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Chrome extension.

By using Group Collect, you agree to the collection and use of information in accordance with this policy.

---

## 1. Information We Collect

### 1.1 Information You Provide Directly

**Account Information:**
- Email address (for account creation and authentication)
- Password (encrypted and stored securely via Supabase Auth)
- Google account information (if you choose to sign in with Google)

**Extension Settings:**
- Google Sheets URL (if you choose to connect a spreadsheet)
- Selected Facebook group ID
- Message templates and automation preferences
- Auto-decline rules and configurations

### 1.2 Information Collected Automatically

**Facebook Group Data:**
When you use our extension on Facebook, we collect information about pending group member requests from groups you manage:
- Member names and Facebook usernames
- Join request dates
- Answers to membership questions
- Email addresses (if provided in membership questions)
- Location information (city/country, if provided)
- Member status (pending, approved, declined)

**Usage Information:**
- Timestamps of actions taken within the extension
- Error logs (for debugging purposes only)
- Feature usage statistics (locally stored only)

### 1.3 Information We Do NOT Collect

We want to be clear about what we DON'T collect:
- ❌ Your Facebook password
- ❌ Your browsing history
- ❌ Private messages or conversations
- ❌ Data from Facebook groups you don't manage
- ❌ Personal information beyond what's visible in group requests
- ❌ Financial or payment information
- ❌ Location data (beyond what Facebook users provide in requests)
- ❌ Device information or IP addresses

---

## 2. How We Use Your Information

We use the collected information for the following purposes:

### 2.1 Core Functionality
- **Authentication:** To create and manage your account
- **Data Management:** To store and organize Facebook group member requests
- **Automation:** To enable welcome messages and auto-decline features you configure
- **Synchronization:** To export data to your Google Sheets (only if you provide a Sheet URL)
- **Dashboard:** To display collected member data in an organized interface

### 2.2 Service Improvement
- **Bug Fixes:** To diagnose and fix technical issues
- **Feature Development:** To understand which features are used and improve them
- **User Support:** To respond to your inquiries and provide assistance

### 2.3 Legal Compliance
- To comply with applicable laws and regulations
- To enforce our Terms of Service
- To protect our rights and the safety of our users

---

## 3. How We Store Your Information

### 3.1 Storage Locations

**Local Storage (Chrome Extension):**
- Data is stored on your device using Chrome's storage API
- This includes member data, settings, and cached information
- Local storage is NOT encrypted by default
- You can clear this data at any time using the "Clear Data" feature

**Cloud Storage (Supabase):**
- Your account information is stored on Supabase's secure servers
- Database is located in [Supabase Region] with encryption at rest
- All data is protected by Row-Level Security (RLS)
- You can only access your own data

**Your Google Sheets (Optional):**
- If you choose to sync data to Google Sheets, data is stored in your personal Google Drive
- We do not have access to your Google Sheets
- You control who can access your sheets

### 3.2 Data Security Measures

We implement industry-standard security measures:
- ✅ HTTPS/TLS encryption for all data transmission
- ✅ Bcrypt password hashing
- ✅ JWT token-based authentication
- ✅ Row-Level Security in database
- ✅ Regular security audits
- ✅ No third-party analytics or trackers

---

## 4. How We Share Your Information

### 4.1 Third-Party Services

We use the following third-party services to provide our functionality:

**Supabase (Backend & Authentication):**
- Purpose: User authentication and data storage
- Data Shared: Email, encrypted password, member data
- Privacy Policy: https://supabase.com/privacy

**Google (OAuth & Sheets API):**
- Purpose: Google Sign-In and Sheets synchronization (optional)
- Data Shared: Email address, spreadsheet access (if you authorize)
- Privacy Policy: https://policies.google.com/privacy

### 4.2 Data NOT Shared

We do NOT:
- ❌ Sell your data to anyone
- ❌ Share data with advertisers
- ❌ Use your data for marketing purposes (beyond our own product)
- ❌ Provide data to data brokers
- ❌ Share data with Facebook (we only read publicly accessible group data)

### 4.3 Legal Disclosures

We may disclose your information if required by law:
- In response to legal process (subpoenas, court orders)
- To protect the rights and safety of Group Collect, our users, or the public
- In connection with a business transfer (merger, acquisition, bankruptcy)

---

## 5. Your Privacy Rights

### 5.1 Access and Control

You have the following rights regarding your data:

**Right to Access:**
- View all your collected data in the Dashboard
- Export your data as CSV

**Right to Rectification:**
- Update your email or settings at any time
- Modify or delete member records

**Right to Erasure (Right to be Forgotten):**
- Delete all collected member data using "Clear Data" button
- Delete your account (contact support)

**Right to Data Portability:**
- Download your data in CSV format
- Export to Google Sheets

**Right to Restrict Processing:**
- Disable automation features (messages, auto-decline)
- Stop data collection by not using the extension

**Right to Object:**
- Uninstall the extension at any time
- All local data will be removed

### 5.2 How to Exercise Your Rights

To exercise any of these rights:
1. Use the in-app controls (Settings, Dashboard)
2. Email us at: privacy@groupcollect.com
3. We will respond within 30 days

---

## 6. Data Retention

### 6.1 How Long We Keep Your Data

**Active Accounts:**
- We retain your data as long as your account is active
- Member data is kept until you manually delete it

**Inactive Accounts:**
- Accounts inactive for 2 years may be automatically deleted
- We will notify you 30 days before deletion

**After Account Deletion:**
- All personal data is permanently deleted within 30 days
- Some anonymized usage statistics may be retained for analytics

### 6.2 You Control Your Data

You can delete your data at any time:
- **Member Data:** Click "Clear Data" in Dashboard
- **Account:** Contact support to delete account
- **Local Extension Data:** Uninstall the extension

---

## 7. Children's Privacy

Group Collect is not intended for users under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at privacy@groupcollect.com.

---

## 8. International Data Transfers

Our service is hosted on servers that may be located outside your country of residence. By using Group Collect, you consent to the transfer of your information to countries that may have different data protection laws than your country.

**For EU Users:**
- We comply with GDPR requirements
- Data transfers are protected by appropriate safeguards
- You have the right to lodge a complaint with your supervisory authority

**For California Users:**
- We comply with CCPA requirements
- See "California Privacy Rights" section below

---

## 9. California Privacy Rights (CCPA)

If you are a California resident, you have additional rights:

### 9.1 Right to Know
You can request:
- Categories of personal information collected
- Sources of the personal information
- Purpose for collecting the information
- Categories of third parties we share data with

### 9.2 Right to Delete
You can request deletion of your personal information (with certain exceptions).

### 9.3 Right to Opt-Out
We do NOT sell personal information. If we ever do, you will have the right to opt out.

### 9.4 Right to Non-Discrimination
We will not discriminate against you for exercising your CCPA rights.

**To exercise CCPA rights:** Email privacy@groupcollect.com

---

## 10. European Privacy Rights (GDPR)

If you are in the European Economic Area (EEA), you have rights under GDPR:

### 10.1 Legal Basis for Processing
We process your data based on:
- **Consent:** You explicitly agree to use our extension
- **Contract:** To provide the service you requested
- **Legitimate Interest:** To improve our service and prevent fraud

### 10.2 Your GDPR Rights
- Right of access
- Right to rectification
- Right to erasure
- Right to restrict processing
- Right to data portability
- Right to object
- Rights related to automated decision making

### 10.3 Data Protection Officer
For GDPR inquiries: dpo@groupcollect.com

### 10.4 Supervisory Authority
You have the right to lodge a complaint with your national data protection authority.

---

## 11. Cookies and Tracking

### 11.1 Cookies We Use
Group Collect uses minimal cookies and tracking:

**Essential Cookies:**
- Authentication tokens (required for login)
- Session management

**We Do NOT Use:**
- ❌ Analytics cookies
- ❌ Advertising cookies
- ❌ Third-party tracking pixels
- ❌ Social media tracking

### 11.2 Browser Storage
We use Chrome's local storage API to:
- Save your settings
- Cache member data
- Store authentication state

You can clear this storage by:
1. Using our "Clear Data" button
2. Clearing browser data in Chrome settings
3. Uninstalling the extension

---

## 12. Security

### 12.1 How We Protect Your Data

**Technical Measures:**
- HTTPS/TLS encryption for all communications
- Bcrypt password hashing
- JWT token authentication
- Row-Level Security in database
- Content Security Policy (CSP)
- Regular security audits

**Organizational Measures:**
- Limited employee access to data
- Security training for team members
- Incident response plan
- Regular backups

### 12.2 Your Responsibility

Please help keep your account secure:
- Use a strong, unique password
- Don't share your login credentials
- Sign out after using shared computers
- Keep your browser and extension updated

### 12.3 Data Breach Notification

In the event of a data breach:
- We will notify affected users within 72 hours
- We will describe the nature of the breach
- We will explain steps we're taking to address it

---

## 13. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. When we do:
- We will update the "Last Updated" date at the top
- We will notify you of significant changes via:
  - Extension notification
  - Email (if we have your address)
  - Prominent notice in the extension
- Continued use after changes constitutes acceptance

**Review History:**
- Version 1.0 - January 13, 2026 - Initial policy

---

## 14. Third-Party Links

Group Collect may contain links to third-party websites or services (e.g., Facebook, Google Sheets). We are not responsible for the privacy practices of these third parties. Please review their privacy policies.

**Third-Party Services:**
- Facebook: https://www.facebook.com/privacy/policy
- Google: https://policies.google.com/privacy
- Supabase: https://supabase.com/privacy

---

## 15. Contact Us

If you have questions or concerns about this Privacy Policy:

**Email:** privacy@groupcollect.com  
**Support:** support@groupcollect.com  
**Website:** [Your website URL]

**Mailing Address:**
[Your Company Name]
[Street Address]
[City, State, ZIP]
[Country]

---

## 16. Transparency Commitment

We believe in transparency. Here's what makes us different:

✅ **No Hidden Data Collection** - We only collect what we describe here  
✅ **No Data Selling** - We will never sell your data  
✅ **No Ads** - No advertising trackers or networks  
✅ **Open Source Option** - [If applicable] Our code is open for audit  
✅ **User Control** - You can delete your data anytime  
✅ **Regular Audits** - We conduct annual security and privacy audits  

---

## 17. Consent

By using Group Collect, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.

**For Facebook Group Data:**
- You confirm you have the right to collect data from your Facebook groups
- You understand that you are responsible for complying with Facebook's Terms of Service
- You acknowledge that Facebook group members' data should be used responsibly

**For Email Collection:**
- If collecting emails from membership questions, ensure you have proper consent to contact those individuals
- Comply with anti-spam laws (CAN-SPAM, GDPR)
- Provide unsubscribe options in any emails you send

---

## 18. Glossary

**Personal Information:** Information that can identify you as an individual (email, name).

**Chrome Storage API:** Browser storage provided by Google Chrome for extensions.

**Row-Level Security (RLS):** Database security feature that restricts data access per user.

**JWT Token:** JSON Web Token used for secure authentication.

**HTTPS/TLS:** Secure protocols for encrypted data transmission.

**Supabase:** Our backend service provider for authentication and database.

**OAuth:** Open standard for secure authorization (used for Google Sign-In).

---

**Thank you for trusting Group Collect with your data!**

We're committed to protecting your privacy while providing a valuable service for managing your Facebook groups.

If you have any questions, we're here to help: support@groupcollect.com
