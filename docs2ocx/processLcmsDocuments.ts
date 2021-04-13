import getPgClient from "./pgClient";

export default async function processLcmsDocuments() {
  const client = await getPgClient();
}
