import { contentExtractionService } from "../src/features/processing/services/content-extraction.service";
import { UnsupportedDocumentTypeError, CorruptDocumentError } from "../src/features/processing/errors/extraction-errors";
import fs from "fs";

async function runTests() {
  console.log("Running Extraction Tests...");

  // 1. Empty TXT
  try {
    const emptyBuffer = Buffer.from("");
    const result = await contentExtractionService.extract(emptyBuffer, "text/plain", "test.txt");
    if (result.text !== "") throw new Error("Empty TXT failed");
    console.log("✅ Empty TXT test passed.");
  } catch (err) {
    console.error("❌ Empty TXT test failed:", err);
  }

  // 2. Unicode TXT
  try {
    const unicodeText = "Hello world! 🌍🚀 こんにちは";
    const unicodeBuffer = Buffer.from(unicodeText, "utf-8");
    const result = await contentExtractionService.extract(unicodeBuffer, "text/plain", "test.txt");
    if (result.text !== unicodeText) throw new Error("Unicode TXT failed");
    console.log("✅ Unicode TXT test passed.");
  } catch (err) {
    console.error("❌ Unicode TXT test failed:", err);
  }

  // 3. Markdown
  try {
    const mdText = "# Title\n\nSome **bold** text.";
    const mdBuffer = Buffer.from(mdText, "utf-8");
    const result = await contentExtractionService.extract(mdBuffer, "text/markdown", "test.md");
    if (result.text !== mdText) throw new Error("Markdown failed");
    console.log("✅ Markdown test passed.");
  } catch (err) {
    console.error("❌ Markdown test failed:", err);
  }

  // 4. Unsupported Document
  try {
    const imageBuffer = Buffer.from("fake image data");
    await contentExtractionService.extract(imageBuffer, "image/jpeg", "test.jpg");
    console.error("❌ Unsupported test failed (did not throw).");
  } catch (err) {
    if (err instanceof UnsupportedDocumentTypeError) {
      console.log("✅ Unsupported document test passed.");
    } else {
      console.error("❌ Unsupported test failed (wrong error):", err);
    }
  }

  // 5. Corrupt PDF
  try {
    const corruptBuffer = Buffer.from("this is not a valid pdf file");
    await contentExtractionService.extract(corruptBuffer, "application/pdf", "test.pdf");
    console.error("❌ Corrupt PDF test failed (did not throw).");
  } catch (err) {
    if (err instanceof CorruptDocumentError) {
      console.log("✅ Corrupt PDF test passed.");
    } else {
      console.error("❌ Corrupt PDF test failed (wrong error):", err);
    }
  }
}

runTests().catch(console.error);
