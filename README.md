# Google Docs Resume Generator

This project automatically generates professional-looking resumes as Google Docs documents by populating a template with structured data. It leverages the Google Docs API and Google Drive API to create, modify, and share documents.

## Features

*   **Template-Based:** Uses a Google Docs template for consistent formatting.
*   **Data-Driven:** Populates the resume using structured TypeScript data.
*   **Dynamic Sections:** Automatically removes sections (Experience, Projects, etc.) if no corresponding data is provided.
*   **Placeholder Replacement:** Replaces placeholders like `{{name}}`, `{{company_1}}`, etc., with actual data.
*   **Formatting:**
    *   Applies bold formatting to specific text sections using custom markers (`@@BOLD-...@@`).
    *   Cleans up empty lines and formatting artifacts.
    *   Adjusts spacing around section headings.
*   **Google Drive Integration:**
    *   Copies the template to create a new document for each generation.
    *   Shares the generated document with a specified email address.
*   **Authentication:** Supports OAuth 2.0 for interacting with Google APIs. Handles token storage and refresh for local development.
*   **Logging:** Uses Winston for detailed logging of the generation process.

## Prerequisites

*   **Node.js:** Version 18 or higher recommended.
*   **pnpm:** Used for package management. Install via `npm install -g pnpm`.
*   **Google Cloud Project:** You need a Google Cloud project to enable APIs and obtain credentials.
*   **Google Account:** To authenticate and own the generated documents.

## Setup

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```

2.  **Install Dependencies:**
    ```bash
    pnpm install
    ```

3.  **Google Cloud Setup:**
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new project or select an existing one.
    *   **Enable APIs:**
        *   Navigate to "APIs & Services" > "Library".
        *   Search for and enable the **Google Docs API**.
        *   Search for and enable the **Google Drive API**.
    *   **Create OAuth 2.0 Credentials:**
        *   Navigate to "APIs & Services" > "Credentials".
        *   Click "+ CREATE CREDENTIALS" > "OAuth client ID".
        *   If prompted, configure the OAuth consent screen (User Type: External, fill in required app info).
        *   Choose "Desktop app" or "Web application" as the Application type.
            *   If "Web application", add `http://localhost` to the "Authorized redirect URIs".
        *   Click "Create".
    *   **Download Credentials:**
        *   After creating the client ID, click the "Download JSON" button.
        *   Rename the downloaded file to `credentials.json` and place it in the root directory of this project.

    **IMPORTANT SECURITY NOTE:** The `credentials.json` file contains sensitive information. **DO NOT** commit it to version control. Add it to your `.gitignore` file:
    ```gitignore:.gitignore
    # Google OAuth Credentials
    credentials.json
    token.json
    ```

4.  **Create a Google Docs Template:**
    *   Create a new Google Doc that will serve as your resume template.
    *   Use placeholders in the format `{{placeholder_key}}` where you want data to be inserted (e.g., `{{name}}`, `{{email}}`, `{{company_1}}`, `{{experience_point_1_1}}`). Refer to `src/testData/sampleResumeData.ts` and `src/googleDocsResumeGenerator.ts` (specifically `flattenStructuredData`) for the expected placeholder keys based on the `ResumeData` structure.
    *   Include section headings exactly as defined in `RESUME_SECTIONS` within `src/googleDocsResumeGenerator.ts` (e.g., `EXPERIENCE`, `PROJECTS`). These headings are used to dynamically remove sections if data is missing.
    *   Format the template as desired (fonts, margins, styles). The generator preserves the template's styling.
    *   **Get the Template ID:** The ID is the long string in the document's URL: `https://docs.google.com/document/d/<TEMPLATE_ID>/edit`. Copy this ID.

5.  **Initial Authorization:**
    *   Run the authentication script to obtain an initial `token.json` file. This script will open a browser window for you to authorize the application.
    ```bash
    pnpm exec ts-node auth.ts
    ```
    *   Follow the prompts in the console: Copy the authorization URL into your browser, grant access, and paste the resulting code back into the console.
    *   This will create a `token.json` file in the root directory, containing your access and refresh tokens.

    **IMPORTANT SECURITY NOTE:** The `token.json` file allows access to your Google account (specifically the scopes requested). **DO NOT** commit it to version control. Ensure it is listed in your `.gitignore`.

## Usage

1.  **Configure the Test Script:**
    *   Open `src/resumeGeneratorTest.ts`.
    *   Update the `templateId` variable with the ID of the Google Docs template you created in the setup steps.
    *   Update the `userEmail` variable to the email address you want the generated resume to be shared with (likely your own email for testing).
    *   Modify or select the sample data (`sampleResumeData`, `sampleResumeData_minimal`, etc.) imported from `src/testData/sampleResumeData.ts` to control the content of the generated resume. You can add your own data structures conforming to the `ResumeData` type defined in `src/types.ts`.

2.  **Run the Generator:**
    ```bash
    pnpm exec ts-node src/resumeGeneratorTest.ts
    ```

3.  **Check the Output:**
    *   The script will output logs to the console, including the URL of the newly generated Google Doc.
    *   Check the Google Drive account associated with the authentication and the specified `userEmail`'s inbox/Google Drive for the shared document.
    *   Review the generated document for correctness.

## How it Works

1.  **Authentication:** The script first obtains an authenticated Google API client using the credentials (`credentials.json`) and stored tokens (`token.json`) via `auth.ts`. For production environments (detected by `NODE_ENV=production`), it can use Application Default Credentials (ADC) / Workload Identity Federation (WIF).
2.  **Copy Template:** It uses the Google Drive API to make a copy of the specified `templateId`, giving it a new title (`googleDocsResumeGenerator.ts` -> `copyTemplate`).
3.  **Data Preparation:** The structured `ResumeData` (from `sampleResumeData.ts` or custom input) is flattened into a key-value object suitable for placeholder replacement (`flattenStructuredData`).
4.  **Section Removal:** Before replacing text, it checks the `ResumeData` against the `RESUME_SECTIONS` configuration. If data for a section (e.g., `projects`) is empty, the entire corresponding section (from its heading to the next heading or end of the document) is removed from the copied document (`removeEmptySections`).
5.  **Placeholder Replacement:** The script iterates through the copied document, replacing placeholders (`{{key}}`) with the corresponding values from the flattened data (`doReplacePlaceholders`). Empty list items (like project/experience points) are marked for later removal.
6.  **Bold Formatting:** Text intended to be bold should be wrapped in markers within the `ResumeData` strings (e.g., `"Employed **Jenkins** for CI/CD"`). The script first replaces placeholders with the *unmarked* text. Then, a separate step (`applyBoldMarkers`) looks for special markers inserted during data flattening (`@@BOLD-xyz@@text@@BOLD-xyz-END@@`, although the current `flattenStructuredData` doesn't seem to add these markers explicitly, it relies on replacing the original `**text**` placeholders and then applying bold later. *Correction: The `flattenStructuredData` removes `**` and the current `applyBoldMarkers` logic looks for `@@BOLD...@@` markers which are not being generated. The bolding likely relies on template styling or needs adjustment.* The code has a mechanism `applyBoldMarkers` designed for this, but the data preparation (`flattenStructuredData`) currently strips markdown `**` instead of converting it to the expected `@@BOLD...@@` markers. This might need alignment.
7.  **Cleanup:**
    *   Lines marked as empty during placeholder replacement are removed (`removeEmptyMarkers`).
    *   Paragraphs containing only whitespace or the `|` character (often used as separators in the template) are removed, carefully preserving spacing around section headings (`removeEmptyBarLinesOneByOne`).
    *   Specific formatting fixes, like ensuring "Company | Location" format, are applied (`fixCompanyLocationBars`).
8.  **Sharing:** The final document is shared with the specified `userEmail` using the Google Drive API (`shareDocument`).
9.  **URL Output:** The script logs the direct URL to the generated Google Doc.

## Key Files

*   `auth.ts`: Handles Google OAuth 2.0 authentication flow and token management.
*   `src/googleDocsResumeGenerator.ts`: Contains the core logic for copying, populating, formatting, and sharing the resume document.
*   `src/resumeGeneratorTest.ts`: Example script to run the generation process with sample data. **Configure this file before running.**
*   `src/types.ts`: Defines the TypeScript data structures (`ResumeData`, `ExperienceEntry`, etc.).
*   `src/testData/sampleResumeData.ts`: Provides example `ResumeData` objects for testing.
*   `credentials.json` (You create this): Stores your Google Cloud OAuth Client ID credentials. **(Keep private)**
*   `token.json` (Auto-generated): Stores the user's OAuth tokens. **(Keep private)**
*   `README.md` (This file): Project documentation.

## Customization

*   **Template:** Modify your Google Docs template file to change the layout, fonts, and static text. Ensure placeholders match the keys generated by `flattenStructuredData`.
*   **Data Structure:** Modify the interfaces in `src/types.ts` and update `flattenStructuredData` in `src/googleDocsResumeGenerator.ts` accordingly if you need different resume sections or fields.
*   **Placeholder Logic:** Adjust the replacement logic in `src/googleDocsResumeGenerator.ts` (e.g., `doReplacePlaceholders`, `applyBoldMarkers`, `removeEmptyBarLinesOneByOne`) for different formatting or cleanup needs.
*   **Section Handling:** Update `RESUME_SECTIONS` in `src/googleDocsResumeGenerator.ts` if you add, remove, or rename major sections in your template and data structure.

## Dependencies

*   `googleapis`: Google APIs Node.js client library.
*   `google-auth-library`: Google authentication library for Node.js.
*   `open`: Opens URLs, used in the auth flow.
*   `winston`: Logging library.
*   `typescript`: Language superset for JavaScript.
*   `ts-node`: Executes TypeScript files directly.

## License

This project is licensed under the ISC License. See the `package.json` file for details. 