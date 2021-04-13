import { snakeCase } from "lodash";
import { LessonDocument, MaterialReference } from "./odellTypes";

export function unitPath(
  lesson: LessonDocument,
  prefix: string = null,
  extension: string = ".html"
) {
  let path = `units/${lesson.metadata.grade}/${lesson.metadata.guidebook_type}`;
  if (extension) {
    path += extension;
  }
  return prefix ? `${prefix}/${path}` : path;
}

export function lessonPath(
  lesson: LessonDocument,
  prefix: string = null,
  extension: string = ".html"
) {
  let path = `lessons/${lesson.metadata.grade}/${lesson.metadata.guidebook_type}/${lesson.metadata.lesson}`;
  if (extension) {
    path += extension;
  }
  return prefix ? `${prefix}/${path}` : path;
}

export function materialPath(
  material: MaterialReference,
  prefix: string = null,
  extension: string = ".html"
) {
  let path = `materials/${snakeCase(material.id.toLocaleLowerCase())}`;
  if (extension) {
    path += extension;
  }
  return prefix ? `${prefix}/${path}` : path;
}
