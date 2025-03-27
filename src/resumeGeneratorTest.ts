import {
  getAuthClient,
  copyTemplate,
  replaceStructuredPlaceholders,
  shareDocument,
  getDocumentUrl,
} from "./googleDocsResumeGenerator.ts";
import { sampleResumeData } from "./sampleResumeData.ts";
import winston from "winston";

// Setup logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: "resume-generator-test" },
  transports: [new winston.transports.Console()],
});

/**
 * Run resume generator test
 */
async function testResumeGenerator() {
  try {
    logger.info("Starting resume generator test");

    // Template document ID
    const templateId = "1UXHdPU1gYm-QIaGd_CKmkdiFFrgGoYXH0x_WasGkNss";

    // Test recipient email address
    const userEmail = "yu.mabuchi@newmarty.com";

    // Initialize auth client
    const auth = await getAuthClient();
    logger.info("Auth client initialized");

    // Generate new document title
    const newTitle = `Resume - ${
      sampleResumeData.basicInfo.name
    } - ${new Date().toISOString()}`;
    logger.info(`Creating new document with title: ${newTitle}`);

    // Copy template to new document
    const newDocumentId = await copyTemplate(auth, templateId, newTitle);
    logger.info(`New document created with ID: ${newDocumentId}`);

    // Replace placeholders using structured data
    logger.info("Replacing placeholders with structured sample data");
    await replaceStructuredPlaceholders(auth, newDocumentId, sampleResumeData);
    logger.info("Placeholders replaced successfully");

    // Share document with user
    logger.info(`Sharing document with user: ${userEmail}`);
    await shareDocument(auth, newDocumentId, userEmail, "writer");
    logger.info("Document shared successfully");

    // Display result URL
    const documentUrl = getDocumentUrl(newDocumentId);
    logger.info(`Test completed successfully. Document URL: ${documentUrl}`);
    console.log(`Generated resume is available at: ${documentUrl}`);

    return {
      success: true,
      documentId: newDocumentId,
      documentUrl: documentUrl,
    };
  } catch (error) {
    logger.error("Test failed with error:", error);
    console.error("Test failed:", error);
    return {
      success: false,
      error: error,
    };
  }
}

// Execute test
testResumeGenerator().then((result) => {
  if (result.success) {
    console.log("Test completed successfully");
  } else {
    console.error("Test failed");
  }
});
