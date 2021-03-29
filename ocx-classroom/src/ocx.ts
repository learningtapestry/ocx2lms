import _ from "lodash";
import type { GenericObject, ClassroomData, CourseWorkMaterial, Course, Material } from "src/types";

const jsonld_sel = 'script[type="application/ld+json"]';

export class OcxToClassroomParser {
  ocx: GenericObject;
  doc: HTMLDocument;

  private url: string;

  constructor(url: string) {
    this.url = url.indexOf("http://") === -1 ? "http://" + url : url;
  }

  async fetchAndParse(): Promise<ClassroomData> {
    await this.fetchOcx();
    return this.parse();
  }

  async fetchOcx(): Promise<void> {
    let parser = new DOMParser();

    let response = await fetch(this.url);
    let html = await response.text();

    this.doc = parser.parseFromString(html, "text/html");
    let content = this.doc.querySelector(jsonld_sel).innerHTML;
    try {
      this.ocx = JSON.parse(content);
    } catch (err) {
      console.log(err);
      this.ocx = {};
    }
  }

  parse(): ClassroomData {
    let materials = materialsList(this.ocx).map((m) => this.buildCourseWorkMaterial(m));
    let assignments = [];
    return {
      course: this.buildCourse(),
      courseworks: [...materials, ...assignments]
    };
  }

  private buildCourse(): Course {
    let course: Course = {};
    if (this.ocx.identifier) {
      course.id = `p:${this.ocx.identifier}`;
    }
    course.type = this.ocx.learningResourceType;

    if (_.lowerCase(course.type) === "class") {
      course.name = this.ocx.name || "";
    } else if (_.lowerCase(course.type) === "unit") {
      course.name = this.ocx.name || `Unit - ${this.ocx.identifier}`;
    }
    course.description = _.trim(this.ocx.description);
    return course;
  }

  private buildCourseWorkMaterial(ocx: GenericObject): CourseWorkMaterial {
    let cwMaterial: CourseWorkMaterial = { materials: [] };
    cwMaterial.id = ocx.identifier; // TODO (alias?)

    let title = ocx.name;
    if (!title || _.isEmpty(title)) {
      let el = this.doc.getElementById(ocx.identifier);
      if (el) {
        title = (el.querySelector("h1") || el.querySelector("h2"))?.textContent;
      }
    }
    cwMaterial.title = title;

    let desc = ocx.description;
    if (!desc || _.isEmpty(desc)) {
      let el = this.doc.getElementById(ocx.identifier);
      if (el) {
        desc = (el.querySelector("article") || el.querySelector("p"))?.textContent;
      }
    }
    cwMaterial.description = _.trim(desc);

    let material = this.buildMaterial(ocx);
    if (material) {
      cwMaterial.materials.push(material);
    }

    materialsList(ocx).forEach((m) => {
      let material = this.buildMaterial(m);
      if (material) {
        cwMaterial.materials.push(material);
      }
    });

    cwMaterial.state = "PUBLISHED";
    // TODO: dueDate and dueTime

    return cwMaterial;
  }

  private buildMaterial(m: GenericObject): Material | null {
    let url = m.link;
    if ((!url || _.isEmpty(url)) && !_.includes(m.id, m.url)) {
      url = m.url;
    }
    if (!url || _.isEmpty(url)) return null;

    if (_.includes(url, "youtube")) {
      // TODO: parse id from url ?
      return { youtubeVideo: { id: url } };
    } else if (_.includes(url, "docs.google")) {
      // TODO: figure out share mode => VIEW | EDIT | STUDENT_COPY
      // TODO: parse id from url ?
      return { driveFile: { driveFile: { id: url }, shareMode: "VIEW" } };
    } else if (_.includes(url, "forms.google")) {
      return { form: { formUrl: url } };
    } else {
      return { link: { url: url } };
    }
  }
}

function materialsList(ocx: GenericObject): GenericObject[] {
  let parts = (ocx.hasPart || []).filter((o) => hasOcxType(o, "Material"));
  let materials = ocx["ocx:material"] || [];
  return parts.concat(materials);
}

function hasOcxType(ocx: GenericObject, type: string): boolean {
  if (_.isArray(ocx["@type"])) {
    return ocx["@type"].some((o) => _.includes(o, type));
  } else {
    return _.includes(ocx["@type"], type);
  }
}
