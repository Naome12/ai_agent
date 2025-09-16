import dotenv from "dotenv";
dotenv.config();

import OpenAi from "openai";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

type SimilarityMetrics = "dot_product" | "cosine" | "euclidean";

// Env variables
const ASTRA_DB_ENDPOINT = process.env.ASTRA_DB_ENDPOINT!;
const ASTRA_DB_COLLECTION = process.env.ASTRA_DB_COLLECTION!;
const ASTRA_DB_NAMESPACE = process.env.ASTRA_DB_NAMESPACE!;
const ASTRA_DB_APPLICATION_TOKEN = process.env.ASTRA_DB_APPLICATION_TOKEN!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

// OpenAI client
const openai = new OpenAi({ apiKey: OPENAI_API_KEY });

// Async main wrapper
(async () => {
  try {
    // Load PDFs
    const pdfLoader1 = new PDFLoader("public/docs/Kozi_Client_Guidelines.pdf");
    const pdfLoader2 = new PDFLoader("public/docs/kozi_compressed.pdf");

    const docs1 = await pdfLoader1.load();
    const docs2 = await pdfLoader2.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const splitDocs1 = await splitter.splitDocuments(docs1);
    const splitDocs2 = await splitter.splitDocuments(docs2);

    const koziData = [...splitDocs1, ...splitDocs2];

    console.log("✅ PDF data loaded, total chunks:", koziData.length);

    // Astra DB client
    const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
    const db = client.db(ASTRA_DB_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

    // Create collection
    const createCollection = async (
      similarityMetric: SimilarityMetrics = "dot_product"
    ) => {
      try {
        const res = await db.createCollection(ASTRA_DB_COLLECTION, {
          vector: { dimension: 1536, metric: similarityMetric },
        });
        console.log("Collection created:", res);
      } catch (err: any) {
        if (err.name === "CollectionAlreadyExistsError") {
          console.log(
            `Collection '${ASTRA_DB_COLLECTION}' already exists. Skipping creation.`
          );
        } else {
          throw err;
        }
      }
    };

    // Insert data
    const loadSampleData = async () => {
      const collection = await db.collection(ASTRA_DB_COLLECTION);

      for (const doc of koziData) {
        const chunkText = doc.pageContent; // already extracted
        const embeddingRes = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: chunkText,
          encoding_format: "float",
        });

        const vector = embeddingRes.data[0].embedding;

        const res = await collection.insertOne({
          $vector: vector,
          text: chunkText,
        });

        console.log("Inserted:", res);
      }
    };

    // Run
    await createCollection();
    await loadSampleData();
    console.log("✅ All data loaded into Astra DB");
  } catch (err) {
    console.error("❌ Error in script:", err);
    process.exit(1);
  }
})();
