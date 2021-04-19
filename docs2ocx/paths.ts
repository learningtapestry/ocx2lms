import { snakeCase } from "lodash";
import {
  OdellDocument,
  MaterialDocument,
  MaterialReference,
} from "./odellTypes";

export function unitPath(
  document: OdellDocument | MaterialDocument,
  prefix: string = null,
  extension: string = ".html"
) {
  let path = `units/${document.metadata.grade}/${document.metadata.guidebook_type}`;
  if (extension) {
    path += extension;
  }
  return prefix ? `${prefix}/${path}` : path;
}

export function lessonPath(
  lesson: OdellDocument,
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
