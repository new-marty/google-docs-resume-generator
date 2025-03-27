import { google } from "googleapis";
import { docs_v1 } from "googleapis";
import * as fs from "fs";
import * as path from "path";
import winston from "winston";
import { OAuth2Client } from "google-auth-library";
import type { ResumeData, FlattenedResumeData } from "./types";

/**
 * Maps resume section headings to their corresponding data fields
 * Used to determine which sections to include and to preserve spacing
 */
const RESUME_SECTIONS = {
  EXPERIENCE: {
    heading: "EXPERIENCE",
    dataCheck: (data: ResumeData) => data.experience.length > 0,
  },
  PROJECTS: {
    heading: "PROJECTS",
    dataCheck: (data: ResumeData) => data.projects.length > 0,
  },
  EDUCATION: {
    heading: "EDUCATION",
    dataCheck: (data: ResumeData) => data.education.length > 0,
  },
  LANGUAGE_SKILLS: {
    heading: "LANGUAGE SKILLS",
    dataCheck: (data: ResumeData) => data.languageSkills.content.trim() !== "",
  },
  TECHNICAL_SKILLS: {
    heading: "TECHNICAL SKILLS",
    dataCheck: (data: ResumeData) => data.technicalSkills.content.trim() !== "",
  },
};

/**
 * Get list of all possible headings in the template
 *
 * @returns Array of heading strings
 */
const getAllHeadings = (): string[] => {
  return Object.values(RESUME_SECTIONS).map((section) => section.heading);
};

/**
 * Dynamically determine which headings should appear based on the data.
 *
 * @param data - The structured resume data
 * @returns Array of heading strings that should be included in the document
 */
const buildHeadingsListFromData = (data: ResumeData): string[] => {
  return Object.values(RESUME_SECTIONS)
    .filter((section) => section.dataCheck(data))
    .map((section) => section.heading);
};

const logger = winston.createLogger({
  level: "debug", // set to 'debug' to capture all logs
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: "resume-generator" },
  transports: [new winston.transports.Console({ level: "debug" })],
});

/**
 * Configure service account authentication
 *
 * @returns Promise resolving to an authenticated OAuth2Client
 * @throws Error if authentication fails
 */
export const getAuthClient = async (): Promise<OAuth2Client> => {
  logger.debug("Initializing Auth Client...");
  if (process.env.NODE_ENV !== "production") {
    // Local environment
    try {
      const credentials = JSON.parse(
        await fs.promises.readFile(
          path.join(process.cwd(), "credentials.json"),
          "utf8"
        )
      );
      let client_id, client_secret, redirect_uris;
      if (credentials.installed || credentials.web) {
        const source = credentials.installed || credentials.web;
        client_id = source.client_id;
        client_secret = source.client_secret;
        redirect_uris = source.redirect_uris;
      } else {
        client_id = credentials.client_id;
        client_secret = credentials.client_secret;
        redirect_uris = credentials.redirect_uris;
      }
      const oauth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        Array.isArray(redirect_uris) ? redirect_uris[0] : redirect_uris
      );
      try {
        const token = JSON.parse(
          await fs.promises.readFile(
            path.join(process.cwd(), "token.json"),
            "utf8"
          )
        );
        oauth2Client.setCredentials(token);
        logger.debug("Auth client initialized with local token.");
        return oauth2Client;
      } catch (err) {
        logger.error("Local token.json not found. Run `node auth.ts` first.");
        throw err;
      }
    } catch (err) {
      logger.error("Failed to load credentials.json:", err);
      throw err;
    }
  } else {
    // Production: ADC/WIF
    logger.debug("Using default ADC/WIF in production.");
    const auth = new google.auth.GoogleAuth({
      scopes: [
        "https://www.googleapis.com/auth/documents",
        "https://www.googleapis.com/auth/drive",
      ],
    });
    const client = (await auth.getClient()) as OAuth2Client;
    return client;
  }
};

/**
 * Copy a template document to create a new document
 *
 * @param auth - Authenticated OAuth2Client
 * @param templateId - ID of the template document to copy
 * @param newTitle - Title for the new document
 * @returns Promise resolving to the ID of the new document
 * @throws Error if copying fails
 */
export const copyTemplate = async (
  auth: OAuth2Client,
  templateId: string,
  newTitle: string
): Promise<string> => {
  logger.debug(
    `Copying template ${templateId} to new doc titled "${newTitle}"...`
  );
  try {
    const drive = google.drive({ version: "v3", auth });
    const response = await drive.files.copy({
      fileId: templateId,
      requestBody: { name: newTitle },
    });
    if (!response.data.id)
      throw new Error("No ID returned from copy operation.");
    logger.info(`Template copied successfully: ${response.data.id}`);
    return response.data.id;
  } catch (err) {
    logger.error("Error copying template:", err);
    throw err;
  }
};

/**
 * Replace placeholders with structured data in a document
 *
 * @param auth - Authenticated OAuth2Client
 * @param documentId - ID of the document to update
 * @param data - Structured resume data
 * @returns Promise that resolves when replacements are complete
 */
export const replaceStructuredPlaceholders = async (
  auth: OAuth2Client,
  documentId: string,
  data: ResumeData
): Promise<void> => {
  logger.debug("Building headings from data...");
  const headingsList = buildHeadingsListFromData(data);
  logger.debug(`Headings that should appear: ${JSON.stringify(headingsList)}`);

  logger.debug("Flattening structured data to placeholders...");
  const flatData = flattenStructuredData(data);

  logger.debug("Calling main pipeline replacePlaceholders()...");
  await replacePlaceholders(auth, documentId, flatData, data, headingsList);
};

/**
 * Main pipeline for replacing placeholders in a document
 *
 * 1) Remove entire sections if empty
 * 2) Replace placeholders
 * 3) Apply the marker-based bold approach
 * 4) Remove lines with "##EMPTY_LINE_TO_REMOVE##"
 * 5) Remove empty/bar lines
 * 6) Fix company bars
 *
 * @param auth - Authenticated OAuth2Client
 * @param documentId - ID of the document to update
 * @param data - Key-value pairs of placeholders and their replacements
 * @param structuredData - Optional structured resume data for section removal
 * @param headingsList - Optional list of headings to preserve
 * @returns Promise that resolves when all replacements are complete
 */
export const replacePlaceholders = async (
  auth: OAuth2Client,
  documentId: string,
  data: FlattenedResumeData,
  structuredData?: ResumeData,
  headingsList?: string[]
): Promise<void> => {
  const docs = google.docs({ version: "v1", auth });
  logger.debug("replacePlaceholders: start");

  // 1) remove entire sections if empty
  if (structuredData) {
    await removeEmptySections(docs, documentId, structuredData);
  }

  // 2) replace placeholders
  await doReplacePlaceholders(docs, documentId, data);

  // 3) apply bold by scanning for the unique markers:
  //    e.g. @@BOLD-xxx@@some text@@BOLD-xxx-END@@
  await applyBoldMarkers(docs, documentId);

  // 4) remove lines with "##EMPTY_LINE_TO_REMOVE##"
  await removeEmptyMarkers(docs, documentId);

  // 5) remove empty or bar lines in descending order, skip adjacency
  if (headingsList) {
    await removeEmptyBarLinesOneByOne(docs, documentId, headingsList);
  }

  // 6) fix company bars
  await fixCompanyLocationBars(docs, documentId, data);

  logger.info("Finished placeholders pipeline!");
};

/**
 * Flatten the structured data into key-value placeholder pairs
 *
 * @param data - Structured resume data
 * @returns Flattened key-value pairs for placeholder replacement
 */
export const flattenStructuredData = (
  data: ResumeData
): FlattenedResumeData => {
  const flat: FlattenedResumeData = {};

  flat["name"] = data.basicInfo.name;
  flat["phone"] = data.basicInfo.phone;
  flat["location"] = data.basicInfo.location;
  flat["email"] = data.basicInfo.email;
  flat["link"] = data.basicInfo.link;

  data.experience.forEach((exp, i) => {
    const idx = i + 1;
    flat[`company_${idx}`] = exp.company;
    flat[`company_location_${idx}`] = exp.companyLocation;
    flat[`experience_date_${idx}`] = exp.date;
    flat[`position_${idx}`] = exp.position;
    (exp.points || []).forEach((p, pIdx) => {
      flat[`experience_point_${idx}_${pIdx + 1}`] = p;
    });
    for (let j = exp.points.length + 1; j <= 5; j++) {
      flat[`experience_point_${idx}_${j}`] = "";
    }
  });
  // fill up to 5
  for (let i = data.experience.length + 1; i <= 5; i++) {
    flat[`company_${i}`] = "";
    flat[`company_location_${i}`] = "";
    flat[`experience_date_${i}`] = "";
    flat[`position_${i}`] = "";
    for (let j = 1; j <= 5; j++) {
      flat[`experience_point_${i}_${j}`] = "";
    }
  }

  data.projects.forEach((proj, i) => {
    const idx = i + 1;
    flat[`project_${idx}`] = proj.name;
    (proj.points || []).forEach((pt, ptIdx) => {
      flat[`project_point_${idx}_${ptIdx + 1}`] = pt;
    });
    for (let j = proj.points.length + 1; j <= 5; j++) {
      flat[`project_point_${idx}_${j}`] = "";
    }
  });
  for (let i = data.projects.length + 1; i <= 3; i++) {
    flat[`project_${i}`] = "";
    for (let j = 1; j <= 5; j++) {
      flat[`project_point_${i}_${j}`] = "";
    }
  }

  data.education.forEach((edu, i) => {
    const idx = i + 1;
    flat[`institution_${idx}`] = edu.institution;
    flat[`degree_${idx}`] = edu.degree;
    flat[`education_date_${idx}`] = edu.date;
  });
  for (let i = data.education.length + 1; i <= 5; i++) {
    flat[`institution_${i}`] = "";
    flat[`degree_${i}`] = "";
    flat[`education_date_${i}`] = "";
  }

  flat["language_skills"] = data.languageSkills.content;
  flat["technical_skills"] = data.technicalSkills.content;

  logger.debug("Flattened data: " + JSON.stringify(flat, null, 2));
  return flat;
};

/**
 * Remove entire sections if data is empty
 *
 * @param docs - Google Docs API client
 * @param documentId - ID of the document to update
 * @param data - Structured resume data
 */
const removeEmptySections = async (
  docs: docs_v1.Docs,
  documentId: string,
  data: ResumeData
) => {
  for (const section of Object.values(RESUME_SECTIONS)) {
    if (!section.dataCheck(data)) {
      await removeSection(docs, documentId, section.heading);
    }
  }
};

/**
 * Remove a section from the document by heading name
 *
 * @param docs - Google Docs API client
 * @param documentId - ID of the document to update
 * @param heading - Heading text of the section to remove
 */
const removeSection = async (
  docs: docs_v1.Docs,
  documentId: string,
  heading: string
) => {
  logger.debug(`removeSection(${heading})...`);
  const docRes = await docs.documents.get({ documentId });
  const doc = docRes.data;
  if (!doc.body?.content) {
    logger.debug("No doc.body.content. Exiting removeSection early.");
    return;
  }

  // find the heading line
  let startIdx = -1;
  for (let i = 0; i < doc.body.content.length; i++) {
    const lineText = getParagraphText(doc.body.content[i]).trim().toUpperCase();
    if (lineText === heading.toUpperCase()) {
      startIdx = i;
      break;
    }
  }
  if (startIdx < 0) {
    logger.debug(`Heading "${heading}" not found. Nothing to remove.`);
    return;
  }

  // find next heading or doc end
  let endIdx = doc.body.content.length - 1;
  for (let j = startIdx + 1; j < doc.body.content.length; j++) {
    const lineText = getParagraphText(doc.body.content[j]).trim().toUpperCase();
    if (
      getAllHeadings().includes(lineText) &&
      lineText !== heading.toUpperCase()
    ) {
      endIdx = j - 1;
      break;
    }
  }

  const startItem = doc.body.content[startIdx];
  const endItem = doc.body.content[endIdx];
  if (!startItem?.startIndex || !endItem?.endIndex) {
    logger.debug(`Cannot remove section ${heading} - invalid range.`);
    return;
  }

  logger.debug(
    `Deleting from startIndex=${startItem.startIndex} to endIndex=${endItem.endIndex} for section ${heading}.`
  );
  try {
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            deleteContentRange: {
              range: {
                startIndex: startItem.startIndex,
                endIndex: endItem.endIndex,
              },
            },
          },
        ],
      },
    });
    await wait(300);
    logger.info(`Removed entire section: ${heading}`);
  } catch (err) {
    logger.warn(`Failed removing section ${heading}: ${err}`);
  }
};

/**
 * Replace placeholders with their values
 * Empty bullet points are marked with "##EMPTY_LINE_TO_REMOVE##" for later removal
 *
 * @param docs - Google Docs API client
 * @param documentId - ID of the document to update
 * @param data - Key-value pairs of placeholders and their replacements
 */
const doReplacePlaceholders = async (
  docs: docs_v1.Docs,
  documentId: string,
  data: Record<string, string>
) => {
  logger.debug("doReplacePlaceholders()...");
  const docRes = await docs.documents.get({ documentId });
  const doc = docRes.data;
  if (!doc.body?.content) return;

  const placeholderRegex = /{{([^{}]+)}}/g;
  const placeholders = new Set<string>();

  for (const item of doc.body.content) {
    if (item.paragraph?.elements) {
      for (const el of item.paragraph.elements) {
        if (el.textRun?.content) {
          const found = el.textRun.content.match(placeholderRegex);
          if (found) found.forEach((m) => placeholders.add(m));
        }
      }
    }
  }

  logger.debug(
    "Found placeholders in doc: " + JSON.stringify([...placeholders])
  );
  const requests: docs_v1.Schema$Request[] = [];

  for (const placeholder of placeholders) {
    const key = placeholder.replace(/[{}]/g, "").trim();
    const value = data[key] || "";
    logger.debug(`Placeholder: ${placeholder}, key=${key}, value="${value}"`);

    // Check if bullet is empty
    const isEmptyPoint =
      (key.includes("experience_point_") || key.includes("project_point_")) &&
      !value;
    if (isEmptyPoint) {
      logger.debug(`--> Marking line for removal (##EMPTY_LINE_TO_REMOVE##).`);
      requests.push({
        replaceAllText: {
          containsText: { text: placeholder, matchCase: true },
          replaceText: "##EMPTY_LINE_TO_REMOVE##",
        },
      });
    } else if (key === "technical_skills" || key === "language_skills") {
      logger.debug(`--> Skills placeholder, keep bars as is: "${value}"`);
      requests.push({
        replaceAllText: {
          containsText: { text: placeholder, matchCase: true },
          replaceText: value,
        },
      });
    } else {
      // remove "**" but keep text
      const stripped = value.replace(/\*\*(.*?)\*\*/g, "$1");
      logger.debug(`--> Replacing with stripped text: "${stripped}"`);
      requests.push({
        replaceAllText: {
          containsText: { text: placeholder, matchCase: true },
          replaceText: stripped,
        },
      });
    }
  }
  if (requests.length) {
    logger.debug(`Sending ${requests.length} placeholder replace requests...`);
    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests },
    });
    await wait(300);
  }
  logger.debug("doReplacePlaceholders() done.");
};

/**
 * Apply bold formatting to text marked with special markers
 * Finds patterns like `@@BOLD-xyz@@some text@@BOLD-xyz-END@@`, removes markers, and bolds "some text"
 *
 * @param docs - Google Docs API client
 * @param documentId - ID of the document to update
 */
const applyBoldMarkers = async (docs: docs_v1.Docs, documentId: string) => {
  logger.debug("applyBoldMarkers: scanning doc for marker => bold text...");
  // repeated passes:
  let doc = (await docs.documents.get({ documentId })).data;
  if (!doc.body?.content) return;

  const markerRegex = /@@BOLD-([a-z0-9]+)@@([^]+?)@@BOLD-\1-END@@/;

  let passCount = 0;
  let foundAny = true;

  while (foundAny && passCount < 50) {
    passCount++;
    foundAny = false;

    if (!doc.body?.content) break;

    // find first occurrence in any paragraph
    const requests: docs_v1.Schema$Request[] = [];

    for (let i = 0; i < doc.body.content.length; i++) {
      const pText = getParagraphText(doc.body.content[i]);
      const match = pText.match(markerRegex);
      if (match) {
        foundAny = true;
        const entire = match[0];
        const boldText = match[2]; // the text we want to bold
        logger.debug(
          `applyBoldMarkers pass #${passCount}: Found marker in paragraph #${i}, text="${boldText}"`
        );
        // remove the entire marker, keep only boldText
        requests.push({
          replaceAllText: {
            containsText: { text: entire, matchCase: true },
            replaceText: boldText,
          },
        });
        break;
      }
    }

    if (!requests.length) break; // no markers found

    // do these replacements
    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests },
    });
    await wait(200);

    // re-fetch
    doc = (await docs.documents.get({ documentId })).data;
    if (!doc.body?.content) break;

    // now we find the boldText again in the same paragraph, highlight it
    const textWeInserted = requests[0].replaceAllText?.replaceText || "";
    if (!textWeInserted.trim()) continue;

    // naive approach: search the entire doc for `textWeInserted`, bold all occurrences
    // re-check paragraphs
    const boldRequests: docs_v1.Schema$Request[] = [];
    for (const item of doc.body.content) {
      if (item.paragraph?.elements) {
        const parTxt = getParagraphText(item);
        if (parTxt.includes(textWeInserted)) {
          // gather all sub-ranges
          for (const el of item.paragraph.elements) {
            if (el.textRun?.content && el.startIndex != null) {
              let c = el.textRun.content;
              let pos = c.indexOf(textWeInserted);
              while (pos !== -1) {
                const globalStart = el.startIndex + pos;
                const globalEnd = globalStart + textWeInserted.length;
                boldRequests.push({
                  updateTextStyle: {
                    range: { startIndex: globalStart, endIndex: globalEnd },
                    textStyle: { bold: true },
                    fields: "bold",
                  },
                });
                pos = c.indexOf(textWeInserted, pos + textWeInserted.length);
              }
            }
          }
        }
      }
    }

    if (boldRequests.length) {
      // do them in small chunks
      const BATCH_SIZE = 10;
      for (let i = 0; i < boldRequests.length; i += BATCH_SIZE) {
        const chunk = boldRequests.slice(i, i + BATCH_SIZE);
        try {
          await docs.documents.batchUpdate({
            documentId,
            requestBody: { requests: chunk },
          });
          await wait(100);
        } catch (err) {
          logger.warn("applyBoldMarkers: failed a bold chunk: " + err);
        }
      }
      // re-fetch
      doc = (await docs.documents.get({ documentId })).data;
    }
  }

  logger.debug(
    "applyBoldMarkers done. No more marker matches or pass limit reached."
  );
};

/**
 * Remove lines containing "##EMPTY_LINE_TO_REMOVE##" marker
 *
 * @param docs - Google Docs API client
 * @param documentId - ID of the document to update
 */
const removeEmptyMarkers = async (docs: docs_v1.Docs, documentId: string) => {
  logger.debug("removeEmptyMarkers()...");
  try {
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            replaceAllText: {
              containsText: {
                text: "##EMPTY_LINE_TO_REMOVE##",
                matchCase: true,
              },
              replaceText: "",
            },
          },
        ],
      },
    });
    await wait(300);
    logger.debug("removeEmptyMarkers() done.");
  } catch (err) {
    logger.warn("Failed removing '##EMPTY_LINE_TO_REMOVE##': " + err);
  }
};

/**
 * Remove lines that are empty or only contain '|' characters
 * Processes one line at a time in descending order
 * Preserves blank lines after or before headings
 *
 * @param docs - Google Docs API client
 * @param documentId - ID of the document to update
 * @param headingsList - List of headings to check for adjacency
 */
const removeEmptyBarLinesOneByOne = async (
  docs: docs_v1.Docs,
  documentId: string,
  headingsList: string[]
) => {
  logger.debug("removeEmptyBarLinesOneByOne()...");
  let docResponse = await docs.documents.get({ documentId });
  let doc = docResponse.data;
  if (!doc.body?.content) {
    logger.debug("No content. Exiting early.");
    return;
  }

  // Collect paragraphs in descending order
  const paragraphs: { startIndex: number; endIndex: number }[] = [];
  for (let i = 0; i < doc.body.content.length; i++) {
    const item = doc.body.content[i];
    if (
      item.paragraph?.elements &&
      item.startIndex !== undefined &&
      item.endIndex !== undefined &&
      item.startIndex !== null &&
      item.endIndex !== null
    ) {
      paragraphs.push({ startIndex: item.startIndex, endIndex: item.endIndex });
    }
  }
  paragraphs.sort((a, b) => b.startIndex - a.startIndex);

  logger.debug(
    `Found ${paragraphs.length} paragraphs. Starting one-by-one removal in descending order...`
  );

  for (let idx = 0; idx < paragraphs.length; idx++) {
    // Re-fetch each time
    docResponse = await docs.documents.get({ documentId });
    doc = docResponse.data;
    if (!doc.body?.content) break;

    const { startIndex, endIndex } = paragraphs[idx];
    logger.debug(
      `Checking paragraph #${idx} with range [${startIndex}, ${endIndex}] in descending list...`
    );

    const match = findParagraphByRange(doc, startIndex, endIndex);
    if (!match) {
      logger.debug(
        "--> No matching paragraph found (maybe deleted already). Skipping."
      );
      continue;
    }

    const text = getParagraphText(match).trim();
    logger.debug(`Paragraph text (trimmed): "${text}"`);
    const isBar = ["|", "| ", " |", " | "].includes(text);
    const isEmpty = text === "";

    if (!isEmpty && !isBar) {
      logger.debug("--> Not empty, not bar => keep it.");
      continue;
    }

    // Check adjacency: if it's immediately after a heading or immediately before a heading => skip removal
    if (isImmediatelyAfterHeading(doc, match, headingsList)) {
      logger.debug(
        "--> This line is after a heading => skip removal to keep spacing after heading."
      );
      continue;
    }
    if (isImmediatelyBeforeHeading(doc, match, headingsList)) {
      logger.debug(
        "--> This line is before a heading => skip removal to keep spacing before heading."
      );
      continue;
    }

    // If we get here, we remove it
    logger.debug("--> Removing this empty/bar paragraph line now...");
    try {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [
            {
              deleteContentRange: {
                range: {
                  startIndex: match.startIndex ?? 0,
                  endIndex: match.endIndex ?? 0,
                },
              },
            },
          ],
        },
      });
      await wait(200);
      logger.info(
        `Removed paragraph line [${match.startIndex}, ${match.endIndex}]: "${text}"`
      );
    } catch (err) {
      logger.warn(
        `Failed to remove paragraph [${match.startIndex}, ${match.endIndex}]: ${err}`
      );
    }
  }
  logger.debug("removeEmptyBarLinesOneByOne() done.");
};

/**
 * Check if a paragraph is immediately after a heading
 *
 * @param doc - Document object
 * @param paragraph - Paragraph to check
 * @param headingsList - List of headings to check against
 * @returns True if paragraph is immediately after a heading
 */
const isImmediatelyAfterHeading = (
  doc: docs_v1.Schema$Document,
  paragraph: docs_v1.Schema$StructuralElement,
  headingsList: string[]
): boolean => {
  if (!doc.body?.content) return false;
  const idx = doc.body.content.findIndex(
    (x) => x.startIndex === paragraph.startIndex
  );
  if (idx <= 0) return false;

  const prevItem = doc.body.content[idx - 1];
  const prevText = getParagraphText(prevItem).trim().toUpperCase();
  return headingsList.some((h) => h.toUpperCase() === prevText);
};

/**
 * Check if a paragraph is immediately before a heading
 *
 * @param doc - Document object
 * @param paragraph - Paragraph to check
 * @param headingsList - List of headings to check against
 * @returns True if paragraph is immediately before a heading
 */
const isImmediatelyBeforeHeading = (
  doc: docs_v1.Schema$Document,
  paragraph: docs_v1.Schema$StructuralElement,
  headingsList: string[]
): boolean => {
  if (!doc.body?.content) return false;
  const idx = doc.body.content.findIndex(
    (x) => x.startIndex === paragraph.startIndex
  );
  if (idx < 0 || idx >= doc.body.content.length - 1) return false;

  const nextItem = doc.body.content[idx + 1];
  if (!nextItem) return false;
  const nextText = getParagraphText(nextItem).trim().toUpperCase();
  return headingsList.some((h) => h.toUpperCase() === nextText);
};

/**
 * Fix formatting of company and location pairs
 * Converts "Company City" to "Company | City" format
 *
 * @param docs - Google Docs API client
 * @param documentId - ID of the document to update
 * @param data - Key-value pairs of placeholders and their replacements
 */
const fixCompanyLocationBars = async (
  docs: docs_v1.Docs,
  documentId: string,
  data: Record<string, string>
) => {
  logger.debug("fixCompanyLocationBars()...");
  const requests: docs_v1.Schema$Request[] = [];

  for (let i = 1; i <= 5; i++) {
    const c = data[`company_${i}`];
    const loc = data[`company_location_${i}`];
    if (c && loc) {
      requests.push({
        replaceAllText: {
          containsText: { text: `${c} ${loc}`, matchCase: true },
          replaceText: `${c} | ${loc}`,
        },
      });
    }
  }
  for (let i = 1; i <= 5; i++) {
    const inst = data[`institution_${i}`];
    const deg = data[`degree_${i}`];
    if (inst && deg) {
      requests.push({
        replaceAllText: {
          containsText: { text: `${inst} ${deg}`, matchCase: true },
          replaceText: `${inst} | ${deg}`,
        },
      });
    }
  }

  if (requests.length) {
    logger.debug(`Sending ${requests.length} requests to fix bars...`);
    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests },
    });
  }
  logger.debug("fixCompanyLocationBars() done.");
};

/**
 * Extract text content from a paragraph element
 *
 * @param item - Structural element containing a paragraph
 * @returns Text content of the paragraph
 */
const getParagraphText = (item: docs_v1.Schema$StructuralElement): string => {
  let text = "";
  if (item?.paragraph?.elements) {
    for (const el of item.paragraph.elements) {
      if (el.textRun?.content) {
        text += el.textRun.content;
      }
    }
  }
  return text;
};

/**
 * Find the paragraph that best matches the given range
 *
 * @param doc - Document object
 * @param startIndex - Target start index
 * @param endIndex - Target end index
 * @returns The best matching paragraph or null if none found
 */
const findParagraphByRange = (
  doc: docs_v1.Schema$Document,
  startIndex: number,
  endIndex: number
): docs_v1.Schema$StructuralElement | null => {
  if (!doc.body?.content) return null;
  let best: docs_v1.Schema$StructuralElement | null = null;
  let bestDelta = Infinity;
  for (const item of doc.body.content) {
    if (item.paragraph && item.startIndex != null && item.endIndex != null) {
      const delta = Math.abs(item.startIndex - startIndex);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = item;
      }
    }
  }
  return best;
};

/**
 * Promise-based delay function
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the specified delay
 */
const wait = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Share a document with a user
 *
 * @param auth - Authenticated OAuth2Client
 * @param documentId - ID of the document to share
 * @param email - Email address of the user to share with
 * @param role - Permission role to grant (reader, writer, or commenter)
 * @throws Error if sharing fails
 */
export const shareDocument = async (
  auth: OAuth2Client,
  documentId: string,
  email: string,
  role: "reader" | "writer" | "commenter" = "reader"
) => {
  logger.debug(`Sharing doc ${documentId} with ${email}, role=${role}...`);
  try {
    const drive = google.drive({ version: "v3", auth });
    await drive.permissions.create({
      fileId: documentId,
      requestBody: { type: "user", role, emailAddress: email },
    });
    logger.info(`Document shared with ${email} as ${role}`);
  } catch (err) {
    logger.error(`Error sharing document with ${email}:`, err);
    throw err;
  }
};

/**
 * Get the URL for a Google Doc
 *
 * @param documentId - ID of the document
 * @returns URL to access the document
 */
export const getDocumentUrl = (documentId: string): string => {
  return `https://docs.google.com/document/d/${documentId}/edit`;
};
