import _ from "lodash";
import { GenericObject } from "src/types";

const JSON_LD_SELECTOR = 'script[type="application/ld+json"]';

export const getOCXjsonld = async (url: string): Promise<[GenericObject, HTMLDocument]> => {
  let parser = new DOMParser();

  let _url = url.indexOf("http://") === -1 ? "http://" + url : url;
  let response = await fetch(_url);
  let html = await response.text();

  let doc = parser.parseFromString(html, "text/html");
  let content = doc.querySelector(JSON_LD_SELECTOR).innerHTML;
  let data: GenericObject;
  try {
    data = JSON.parse(content);
  } catch (err) {
    console.log(err);
    data = {};
  }
  return [data, doc];
};

interface OCXData {
  course?: OCXCourse;
  materials?: OCXMaterial[];
}

interface OCXCourse {
  type?: string;
  title?: string;
  description?: string;
}

interface OCXMaterial {
  id?: string;
  title?: string;
  description?: string;
  url?: string;
  materials?: OCXMaterial[];
}

export const parseOCXData = async (ocx: GenericObject, doc: HTMLDocument): Promise<OCXData> => {
  return {
    course: buildCourse(ocx),
    materials: ocx.hasPart?.map((o) => buildMaterial(o, doc))
  };
};

const buildCourse = (ocx: GenericObject): OCXCourse => {
  let course: OCXCourse = {};
  course.type = ocx.learningResourceType;
  if (_.lowerCase(course.type) === "class") {
    course.title = ocx.name || "";
  } else if (_.lowerCase(course.type) === "unit") {
    course.title = ocx.name || `Unit - ${ocx.identifier}`;
  }
  course.description = _.trim(ocx.description);
  return course;
};

const buildMaterial = (ocx: GenericObject, doc: HTMLDocument): OCXMaterial => {
  let material: OCXMaterial = {};
  material.id = ocx.identifier;

  let title = ocx.name;
  if (!title || _.isEmpty(title)) {
    let el = doc.getElementById(ocx.identifier);
    if (el) {
      title = (el.querySelector("h1") || el.querySelector("h2"))?.textContent;
    }
  }
  material.title = title;

  let desc = ocx.description;
  if (!desc || _.isEmpty(desc)) {
    let el = doc.getElementById(ocx.identifier);
    if (el) {
      desc = (el.querySelector("article") || el.querySelector("p"))?.textContent;
    }
  }
  material.description = _.trim(desc);

  let url = ocx.link;
  if ((!url || _.isEmpty(url)) && !_.includes(ocx.id, ocx.url)) {
    url = ocx.url;
  }
  material.url = url;

  if (!_.isEmpty(ocx["ocx:material"])) {
    material.materials = ocx["ocx:material"].map((o) => buildMaterial(o, doc));
  }

  return material;
};
