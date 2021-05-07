import _ from "lodash";
import type {
  GenericObject,
  ClassroomData,
  CourseWorkMaterial,
  CourseWorkAssignment,
  Course,
  Material,
  Topic,
  Rubric,
  CourseWork
} from "src/types";

const jsonldSel = 'script[type="application/ld+json"]';
const oerTypeRE = /oer:(.*)/;
const gdocIdRE = /docs.google.com\/\w+\/d\/([-\w]+)\/?.*/;
const youtubeIdRE = /youtube.com\/watch\?v=([-\w]+)&?.*/;

const DEFAULTS = {
  weeklyPace: 5 * 45,
  defaultTime: 15
};

interface Opts {
  weeklyPace: number;
  defaultTime: number;
}
export class OcxToClassroomParser {
  ocx: GenericObject;
  doc: HTMLDocument;

  private url: string;
  private isLesson: boolean;
  private level: number;
  private options: Opts;

  constructor(url: string, options: Opts = DEFAULTS, level: number = 0) {
    this.url = url.indexOf("http") !== 0 ? "http://" + url : url;
    this.level = level;
    this.options = options;
    console.log(this.options);
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
    let content = this.doc.querySelector(jsonldSel)?.innerHTML;
    try {
      this.ocx = content ? JSON.parse(content) : {};
    } catch (err) {
      console.log(err);
      this.ocx = {};
    }
  }

  async parse(): Promise<ClassroomData> {
    if (_.isEmpty(this.ocx)) {
      return { course: null, courseworks: [], topics: [], rubrics: [] };
    }

    let course = this.buildCourse();
    this.isLesson = course.type === "Lesson";

    let materials = await Promise.all(
      materialsList(this.ocx).map(async (m) => {
        return await this.buildCourseWorkMaterial(m);
      })
    );
    let assignments = await Promise.all(
      assignmentsList(this.ocx).map(async (a) => {
        return await this.buildCourseWorkAssignment(a);
      })
    );

    let courseworks = [...materials, ...assignments];
    let topics = _.chain(courseworks)
      .map((c) => this.buildTopic(c))
      .filter(Boolean)
      .uniqBy("name")
      .value();

    let rubrics = await Promise.all(
      rubricsList(this.ocx).map(async (r) => {
        return await this.buildRubric(r);
      })
    );

    // recur on subresources
    let subResources = await Promise.all(
      subResourcesList(this.ocx).map(async (url) => {
        if (this.level >= 2) return null;

        let parser = new OcxToClassroomParser(url, this.options, this.level + 1);
        let data = await parser.fetchAndParse();
        return data;
      })
    );
    subResources.forEach((d) => {
      if (!d) return;

      if (d.courseworks?.length) {
        courseworks.push(...d.courseworks);
      }
      if (d.topics?.length) {
        topics.push(...d.topics);
      }
      if (d.rubrics?.length) {
        rubrics.push(...d.rubrics);
      }
    });

    // add Week topics to lessons
    if (this.level === 0) {
      let totalTime = 0;
      courseworks.forEach((cw) => {
        if ((cw as CourseWorkAssignment).lessonActivity && !cw.topic) {
          totalTime += (cw as CourseWorkAssignment).timeRequired;
          let weekNumber = Math.floor(totalTime / this.options.weeklyPace) + 1;
          let name = `Week ${weekNumber}`;
          cw.topic = name;
          if (!topics.find((t) => t.name === name)) topics.push({ name });
        }
      });
    }

    return { course, courseworks, topics, rubrics };
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

  private async buildCourseWorkMaterial(ocx: GenericObject): Promise<CourseWorkMaterial> {
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

    let material = await this.buildMaterial(ocx);
    if (material) {
      cwMaterial.materials.push(material);
    }

    await Promise.all(
      materialsList(ocx).map(async (m) => {
        let material = await this.buildMaterial(m);
        if (material) {
          cwMaterial.materials.push(material);
        }
      })
    );

    cwMaterial.topic = this.getTopicName(ocx);
    return cwMaterial;
  }

  private async buildCourseWorkAssignment(ocx: GenericObject): Promise<CourseWorkAssignment> {
    let cwAssignment: CourseWorkAssignment = {
      type: "Assignment",
      id: ocxIdentifier(ocx),
      workType: "ASSIGNMENT",
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

    let material = await this.buildMaterial(ocx);
    if (material) {
      cwAssignment.materials.push(material);
    }

    await Promise.all(
      materialsList(ocx).map(async (m) => {
        let material = await this.buildMaterial(m);
        if (material) {
          cwAssignment.materials.push(material);
        }
      })
    );

    if (ocx["ocx:points"]) {
      cwAssignment.maxPoints = parseInt(ocx["ocx:points"], 10);
    } else {
      let gradingFormat = _.lowerCase(ocx["oer:gradingFormat"]?.["@type"]);
      if (gradingFormat === "oer:CompletionGradeFormat") {
        cwAssignment.maxPoints = 0;
      } else if (gradingFormat === "oer:PointGradeFormat") {
        cwAssignment.maxPoints = 100;
      }
    }
    cwAssignment.timeRequired =
      parseInt(ocx.timeRequired?.match(/(\d+)/)?.[1]) || this.options.defaultTime;
    cwAssignment.lessonActivity = this.isLesson;

    // TODO: dueDate and dueTime

    cwAssignment.topic = this.getTopicName(ocx);

    return cwAssignment;
  }

  private async buildMaterial(m: GenericObject): Promise<Material | null> {
    if (_.includes(m["ocx:collaborationType"], "submission")) {
      return await this.buildOcxGdoc(m);
    }

    let url = m.link;
    if ((!url || _.isEmpty(url)) && !_.includes(m["@id"], m.url)) {
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

  private async buildOcxGdoc(m: GenericObject): Promise<GenericObject> {
    if (m["@id"]?.startsWith("http")) {
      let parser = new OcxToClassroomParser(m["@id"], this.options, this.level + 1);
      await parser.fetchOcx();
      return parser.ocx ? await parser.buildOcxGdoc(parser.ocx) : null;
    } else if (m["@id"]?.startsWith("#")) {
      let shareMode = gdocShareMode(m);
      let node =
        this.doc.getElementById(ocxIdentifier(m)) ||
        this.doc.getElementById(m["@id"].replace("#Material_", ""));
      if (node) {
        return { ocxGdoc: { content: node?.innerHTML, id: null, shareMode } };
      }
    }
    return null;
  }

  private buildTopic(coursework: CourseWork): Topic | null {
    if (coursework.topic?.length > 0) {
      return { name: coursework.topic };
    }
    return null;
  }

  private getTopicName(ocx: GenericObject): string | null {
    if (_.includes(ocx.educationalUse, "progressive")) {
      return "Progressive Assignments";
    } else if (_.includes(ocx.educationalUse, "overview")) {
      return "Overview";
    } else if (_.includes(ocx.educationalUse, "text")) {
      return "Texts";
    }
    return null;
  }

  private async buildRubric(ocx: GenericObject): Promise<Rubric> {
    if (!_.includes(ocx["@type"], "asn:Rubric")) return null;
    if (!ocx.url?.startsWith("http")) return null;
    let parser = new OcxToClassroomParser(ocx.url, this.options, this.level + 1);
    await parser.fetchOcx();

    if (_.isEmpty(parser.ocx)) return null;
    return parser.ocx;
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

function rubricsList(ocx: GenericObject): GenericObject[] {
  return ocx["ocx:rubric"] || [];
}

function subResourcesList(ocx: GenericObject): string[] {
  const keys = ["name", "hasPart", "ocx:material"];
  return _.chain(ocx.hasPart || [])
    .filter((o) => {
      let anyData = keys.some((k) => o[k]);
      return o["@id"]?.startsWith("http") && !anyData;
    })
    .map((o) => o["@id"])
    .uniq()
    .value();
}

function youtubeMaterial(url: string): Material {
  let youtubeId = youtubeIdRE.exec(url)?.[1];
  return { youtubeVideo: { id: youtubeId } };
}

function gdocShareMode(m: GenericObject): string {
  if (_.includes(m["ocx:collaborationType"], "individual-submission")) {
    return "STUDENT_COPY";
  } else if (_.includes(m["ocx:collaborationType"], "shared-submission")) {
    return "EDIT";
  } else {
    return "VIEW";
  }
}

function gdocMaterial(url: string, m: GenericObject): Material {
  let docId = gdocIdRE.exec(url)?.[1];
  let shareMode = gdocShareMode(m);
  return { driveFile: { driveFile: { id: docId }, shareMode } };
}

function hasOcxType(ocx: GenericObject, type: string): boolean {
  return _.includes(ocx["@type"], type);
}
