import getClient from "./pgClient";

type documentType = "material" | "lesson";

const typeTables = {
  material: "materials",
  lesson: "documents",
};

const typeModels = {
  material: "Lcms::Engine::Material",
  lesson: "Lcms::Engine::Document",
};

export async function findDocumentIdByOdellId(odellId: number) {
  const client = await getClient();

  try {
    const result = await client.query(
      `SELECT file_id FROM documents WHERE id = $1`,
      [odellId]
    );
    return result.rows[0].file_id;
  } catch (err) {
    return null;
  } finally {
    client.release();
  }
}

async function findOdellIdByDocumentId(documentId: string, type: documentType) {
  const client = await getClient();

  try {
    const result = await client.query(
      `SELECT id FROM ${typeTables[type]} WHERE file_id = $1::text`,
      [documentId]
    );
    return result.rows[0].id;
  } catch (err) {
    return null;
  } finally {
    client.release();
  }
}

export async function writeOcxDocument(
  documentId: string,
  type: documentType,
  path: string,
  document: any,
  html: string
) {
  const client = await getClient();
  const targetId = await findOdellIdByDocumentId(documentId, type);
  const targetType = typeModels[type];
  const query = `
    INSERT INTO
      ocx_documents (path, document_type, target_id, target_type, document, html, created_at, updated_at)
    VALUES (
      $1, $2, $3, $4, $5, $6, current_timestamp, current_timestamp
    )
    ON CONFLICT (path)
    DO
      UPDATE SET document_type = $2,
                 target_id = $3,
                 target_type = $4,
                 document = $5,
                 html = $6,
                 updated_at = current_timestamp
  `;

  try {
    await client.query(query, [
      path,
      type,
      targetId,
      targetType,
      document,
      html,
    ]);
  } finally {
    client.release();
  }
}

export async function findDocumentIds() {
  const client = await getClient();

  try {
    const result = await client.query(`SELECT file_id FROM documents`);
    return result.rows.map((row) => row.file_id);
  } catch (err) {
    return [];
  } finally {
    client.release();
  }
}

export async function findDocumentId(materialId: string) {
  materialId = materialId.toLocaleLowerCase();

  const client = await getClient();

  try {
    const result = await client.query(
      `SELECT file_id FROM materials WHERE identifier = $1::text`,
      [materialId]
    );
    return result.rows[0].file_id;
  } catch (err) {
    return null;
  } finally {
    client.release();
  }
}
