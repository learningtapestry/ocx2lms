import _ from "lodash";
import type {
  GenericObject,
  ClassroomData,
  CourseWorkMaterial,
  CourseWorkAssignment,
  Course,
  Material
} from "src/types";

const jsonldSel = 'script[type="application/ld+json"]';
const gdocIdRE = /docs.google.com\/\w+\/d\/([-\w]+)\/?.*/;
const youtubeIdRE = /youtube.com\/watch\?v=([-\w]+)&?.*/;

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
    let content = this.doc.querySelector(jsonldSel).innerHTML;
    try {
      this.ocx = JSON.parse(content);
    } catch (err) {
      console.log(err);
      this.ocx = {};
    }
  }

  parse(): ClassroomData {
    let materials = materialsList(this.ocx).map((m) => {
      return this.buildCourseWorkMaterial(m);
    });
    let assignments = assignmentsList(this.ocx).map((a) => {
      return this.buildCourseWorkAssignment(a);
    });
    return {
      course: this.buildCourse(),
      courseworks: [...materials, ...assignments]
    };
  }

  private buildCourse(): Course {
    let course: Course = {
      type: this.ocx.learningResourceType
    };

    let id = this.ocx.courseCode || this.ocx.identifier;
    if (id) {
      // course.id = `p:${id}`;
      // OBS: reusing the id for the project can cause unexpected behaviour,
      //      like unarchibing an old course and duplicating all materials
    }

    course.name = this.ocx.name || this.ocx.alternateName;
    if (this.ocx.name?.length > 0) {
      course.section = this.ocx.alternateName;
    }

    let desc = this.ocx.description || this.ocx.about;
    course.description = _.trim(desc);

    return course;
  }

  private buildCourseWorkMaterial(ocx: GenericObject): CourseWorkMaterial {
    let cwMaterial: CourseWorkMaterial = {
      type: "CourseWorkMaterial",
      id: ocx.identifier,
      materials: []
    };

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
    return cwMaterial;
  }

  private buildCourseWorkAssignment(ocx: GenericObject): CourseWorkAssignment {
    let cwAssignment: CourseWorkAssignment = {
      type: "CourseWorkAssignment",
      id: ocx.identifier,
      workType: "ASSIGNMENT", // or SHORT_ANSWER_QUESTION | MULTIPLE_CHOICE_QUESTION
      materials: []
    };

    let title = ocx.name;
    if (!title || _.isEmpty(title)) {
      let el = this.doc.getElementById(ocx.identifier);
      if (el) {
        title = (el.querySelector("h1") || el.querySelector("h2"))?.textContent;
      }
    }
    cwAssignment.title = title;

    let desc = ocx.description;
    if (!desc || _.isEmpty(desc)) {
      let el = this.doc.getElementById(ocx.identifier);
      if (el) {
        desc = (el.querySelector("article") || el.querySelector("p"))?.textContent;
      }
    }
    cwAssignment.description = _.trim(desc);

    let material = this.buildMaterial(ocx);
    if (material) {
      cwAssignment.materials.push(material);
    }

    materialsList(ocx).forEach((m) => {
      let material = this.buildMaterial(m);
      if (material) {
        cwAssignment.materials.push(material);
      }
    });

    if (ocx.totalPoints) {
      cwAssignment.maxPoints = parseInt(ocx.totalPoints, 10);
    } else if (_.lowerCase(ocx.assignmentOutcome) === "graded") {
      cwAssignment.maxPoints = 100;
    }

    cwAssignment.state = "PUBLISHED";
    // TODO: dueDate and dueTime
    // TODO: submissionModificationMode

    return cwAssignment;
  }

  private buildMaterial(m: GenericObject): Material | null {
    let url = m.link;
    if ((!url || _.isEmpty(url)) && !_.includes(m.id, m.url)) {
      url = m.url;
    }
    if (!url || _.isEmpty(url)) return null;

    if (_.includes(url, "youtube")) {
      let youtubeId = youtubeIdRE.exec(url)?.[1];
      return { youtubeVideo: { id: youtubeId } };
    } else if (_.includes(url, "docs.google")) {
      let docId = gdocIdRE.exec(url)?.[1];
      let shareMode = "VIEW"; // => VIEW | EDIT | STUDENT_COPY
      if (_.lowerCase(m.assigneeMode) === "independent") {
        shareMode = "STUDENT_COPY";
      }
      return { driveFile: { driveFile: { id: docId }, shareMode } };
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

function assignmentsList(ocx: GenericObject): GenericObject[] {
  return (ocx.hasPart || []).filter((o) => hasOcxType(o, "ocx:Activity"));
}

function hasOcxType(ocx: GenericObject, type: string): boolean {
  if (_.isArray(ocx["@type"])) {
    return ocx["@type"].some((o) => _.includes(o, type));
  } else {
    return _.includes(ocx["@type"], type);
  }
}
