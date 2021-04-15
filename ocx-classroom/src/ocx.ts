import _ from "lodash";
import type {
  GenericObject,
  ClassroomData,
  CourseWorkMaterial,
  CourseWorkAssignment,
  Course,
  Material,
  Topic,
  CourseWork
} from "src/types";

const jsonldSel = 'script[type="application/ld+json"]';
const oerTypeRE = /oer:(.*)/;
const gdocIdRE = /docs.google.com\/\w+\/d\/([-\w]+)\/?.*/;
const youtubeIdRE = /youtube.com\/watch\?v=([-\w]+)&?.*/;

export class OcxToClassroomParser {
  ocx: GenericObject;
  doc: HTMLDocument;

  private url: string;
  private isLesson: boolean;

  constructor(url: string) {
    this.url = url.indexOf("http://") === -1 ? "http://" + url : url;
  }

  async fetchAndParse(): Promise<ClassroomData> {
    await this.fetchOcx();
    return await this.parse();
  }

  async fetchOcx(): Promise<void> {
    let parser = new DOMParser();

    let response = await fetch(this.url + `?_ts=${Date.now()}`);
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

  async parse(): Promise<ClassroomData> {
    let course = this.buildCourse();
    this.isLesson = course.type === "Lesson";

    let materials = materialsList(this.ocx).map((m) => {
      return this.buildCourseWorkMaterial(m);
    });
    let assignments = assignmentsList(this.ocx).map((a) => {
      return this.buildCourseWorkAssignment(a);
    });

    let courseworks = [...materials, ...assignments];
    let topics = _.chain(courseworks)
      .map((c) => this.buildTopic(c))
      .filter(Boolean)
      .uniqBy("name")
      .value();

    let subResources = await Promise.all(
      subResourcesList(this.ocx).map(async (url) => {
        let parser = new OcxToClassroomParser(url);
        let data = await parser.fetchAndParse();
        return data;
      })
    );
    subResources.forEach((d) => {
      if (d.courseworks?.length) {
        courseworks.push(...d.courseworks);
      }
      if (d.topics?.length) {
        topics.push(...d.topics);
      }
    });
    return { course, courseworks, topics };
  }

  private buildCourse(): Course {
    let course: Course = {
      type: this.ocx["@type"]?.match(oerTypeRE)?.[1]
    };

    let id = this.ocx.courseCode || ocxIdentifier(this.ocx);
    if (id) {
      // course.id = `p:${id}`;
      // OBS: reusing the id for the project can cause unexpected behaviour,
      //      like unarchiving an old course and duplicating all materials
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
      type: "Material",
      id: ocxIdentifier(ocx),
      state: "DRAFT",
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
        desc = (el.querySelector("article") || el)?.textContent;
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

    cwMaterial.topic = this.getTopicName(ocx);
    return cwMaterial;
  }

  private buildCourseWorkAssignment(ocx: GenericObject): CourseWorkAssignment {
    let cwAssignment: CourseWorkAssignment = {
      type: "Assignment",
      id: ocxIdentifier(ocx),
      workType: "ASSIGNMENT", // or SHORT_ANSWER_QUESTION | MULTIPLE_CHOICE_QUESTION
      state: "DRAFT",
      materials: []
    };

    let id = ocxIdentifier(ocx);
    let title = ocx.name;
    if (!title || _.isEmpty(title)) {
      let el = this.doc.getElementById(id);
      if (el) {
        title = (el.querySelector("h1") || el.querySelector("h2"))?.textContent;
      }
    }
    cwAssignment.title = title;

    let desc = ocx.description;
    if (!desc || _.isEmpty(desc)) {
      let el = this.doc.getElementById(id);
      if (el) {
        desc = (el.querySelector("article") || el)?.textContent;
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

    // TODO: dueDate and dueTime

    cwAssignment.topic = this.getTopicName(ocx);

    return cwAssignment;
  }

  private buildMaterial(m: GenericObject): Material | null {
    let url = m.link;
    if ((!url || _.isEmpty(url)) && !_.includes(m.id, m.url)) {
      url = m.url;
    }
    if (!url || _.isEmpty(url)) return null;

    if (_.includes(url, "youtube")) {
      return youtubeMaterial(url);
    } else if (_.includes(url, "docs.google")) {
      return gdocMaterial(url, m);
    } else if (_.includes(url, "forms.google")) {
      return { form: { formUrl: url } };
    } else {
      return { link: { url: url } };
    }
  }

  private buildTopic(coursework: CourseWork): Topic | null {
    if (coursework.topic?.length > 0) {
      return { name: coursework.topic };
    }
    return null;
  }

  private getTopicName(ocx: GenericObject): string | null {
    if (this.isLesson) {
      // TODO: calc Week
      return "Week 1";
    }

    if (_.includes(ocx.educationalUse, "progressive")) {
      return "Progressive Assignments";
    } else if (_.includes(ocx.educationalUse, "overview")) {
      return "Overview";
    } else if (_.includes(ocx.educationalUse, "text")) {
      return "Texts";
    }
    return null;
  }
}

function ocxIdentifier(ocx: GenericObject): string {
  if (ocx.identifier) return ocx.identifier;

  let _id: string = ocx["@id"] || "";

  if (_id.startsWith("#")) return _id.substr(1);
  if (_id.startsWith("http")) return _.last(_id.split("/"));

  return _id;
}

function materialsList(ocx: GenericObject): GenericObject[] {
  let parts = (ocx.hasPart || []).filter((o) => hasOcxType(o, "Material"));
  let materials = ocx["ocx:material"] || [];
  return parts.concat(materials);
}

function assignmentsList(ocx: GenericObject): GenericObject[] {
  return (ocx.hasPart || []).filter((o) => hasOcxType(o, "Activity"));
}

function subResourcesList(ocx: GenericObject): string[] {
  const keys = ["name", "hasPart", "ocx:material", "educationalUse"];
  return (ocx.hasPart || [])
    .filter((o) => {
      let anyData = keys.some((k) => o[k]);
      return o["@id"]?.startsWith("http") && !anyData;
    })
    .map((o) => o["@id"]);
}

function youtubeMaterial(url: string): Material {
  let youtubeId = youtubeIdRE.exec(url)?.[1];
  return { youtubeVideo: { id: youtubeId } };
}

function gdocMaterial(url: string, m: GenericObject): Material {
  let docId = gdocIdRE.exec(url)?.[1];
  let shareMode: string;
  if (_.includes(m.educationalUse, "individual-submission")) {
    shareMode = "STUDENT_COPY";
  } else if (_.includes(m.educationalUse, "shared-submission")) {
    shareMode = "EDIT";
  } else {
    shareMode = "VIEW";
  }
  return { driveFile: { driveFile: { id: docId }, shareMode } };
}

function hasOcxType(ocx: GenericObject, type: string): boolean {
  return _.includes(ocx["@type"], type);
}
