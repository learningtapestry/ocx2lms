import { generateDocument } from "./generateOcxDocument";
import { findDocumentIdByOdellId } from "./lcmsQueries";

const generateByOdellDocumentId = async (odellId: number) => {
  const docId = await findDocumentIdByOdellId(odellId);
  await generateDocument(docId);
};

process.on("unhandledRejection", (error: Error) => {
  console.log(error.message);
  console.log(error.stack);
  process.exit(1);
});

const args = process.argv.slice(2);
generateByOdellDocumentId(parseInt(args[0]));
