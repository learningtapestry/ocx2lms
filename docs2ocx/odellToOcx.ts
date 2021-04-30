import { snakeCase, sortBy } from "lodash";
import { lessonPath, materialPath, rubricPath, unitPath } from "./paths";
import {
  Activity,
  OdellDocument,
  MaterialReference,
  AssignmentOutcomeTypes,
  RubricReference,
} from "./odellTypes";
import config from "./config";
import { dasherize, splitCommaSepValues } from "./util";
import { findUnitLessons } from "./lcmsQueries";

const buildGraph = (elements: any[]): Record<string, any> => {
  const jsonLd = {};

  jsonLd["@context"] = [
    "http://schema.org/",
    {
      oer: "http://oerschema.org/",
      ocx: "https://github.com/K12OCX/k12ocx-specs/",
      asn: "http://purl.org/ASN/schema/core/",
    },
  ];

  return {
    ...jsonLd,
    "@graph": elements,
  };
};

const buildJsonLd = (
  type: string | Array<string>,
  mergeProperties = {},
  includeContext = true
): Record<string, any> => {
  const jsonLd = {};

  if (includeContext) {
    jsonLd["@context"] = [
      "http://schema.org/",
      {
        oer: "http://oerschema.org/",
        ocx: "https://github.com/K12OCX/k12ocx-specs/",
        asn: "http://purl.org/ASN/schema/core/",
      },
    ];
  }

  return {
    ...jsonLd,
    "@type": type,
    ...mergeProperties,
  };
};

const lessonName = (lesson: OdellDocument) =>
  `S${lesson.metadata.section}_L${lesson.metadata.lesson}`;

const unitName = (unit: OdellDocument) =>
  `${unit.metadata.guidebook_title.toLocaleUpperCase()}: ${
    unit.metadata.guidebook_title
  }`;

const activityName = (document: OdellDocument, activity: Activity) => {
  let title = "";

  if (document.metadata.type == "unit") {
    if (activity.metadata.activity_type == "optional") {
      title += "(OPTIONAL) ";
    }
    title += activity.metadata.activity_title;
  } else {
    title += `S${document.metadata.section}_L${document.metadata.lesson}_A${activity.metadata.activity}:`;
    if (activity.metadata.activity_type == "optional") {
      title += " (OPTIONAL)";
    }
    title += ` ${activity.metadata.activity_title}`;
  }

  return title;
};

const materialName = (material: MaterialReference) =>
  material.resolvedMaterial.metadata.title;

const buildActivity = (
  lesson: OdellDocument,
  activity: Activity,
  index: number,
  includeContext = false
) => {
  const type =
    activity.metadata.activity_type == "assessment"
      ? "oer:Assessment"
      : "oer:Activity";
  const activityJson = buildJsonLd(
    type,
    {
      "@id": `#Activity_${index}`,
      name: activityName(lesson, activity),
      educationalUse: activity.metadata.activity_type.toLocaleLowerCase(),
      "ocx:assignmentModality": dasherize(
        activity.metadata.assignment_modality
      ),
      "ocx:collaborationType": dasherize(activity.metadata.assignment_method),
    },
    includeContext
  );
  if (activity.metadata.pacing) {
    activityJson.timeRequired = `PT${activity.metadata.pacing}M`;
  }
  const materials = [];
  for (const material of activity.materials) {
    materials.push(materialToOcx(material, false));
  }
  activityJson["ocx:material"] = materials;

  const alignments = splitCommaSepValues(activity.metadata.alignment);
  if (alignments.length) {
    activityJson.educationalAlignment = alignments.map((alignmentName) => ({
      "@type": "AlignmentObject",
      targetName: alignmentName,
      educationFramework: "CommonCoreStandard",
    }));
  }

  if (activity.metadata.total_points) {
    activityJson["ocx:points"] = parseInt(activity.metadata.total_points);
  }

  const asgOutcome: AssignmentOutcomeTypes = activity.metadata.assignment_outcome?.toLocaleLowerCase() as AssignmentOutcomeTypes;

  if (asgOutcome == "completed" || asgOutcome == "submitted") {
    activityJson["oer:gradingFormat"] = {
      "@type": "oer:CompletionGradeFormat",
    };
  } else if (asgOutcome == "graded") {
    activityJson["oer:gradingFormat"] = {
      "@type": "oer:PointGradeFormat",
    };
  } else if (asgOutcome == "rubric") {
    const rubricId = dasherize(activity.metadata.rubric_id);
    if (rubricId) {
      const url = unitPath(
        lesson,
        config.baseOcxPath,
        `_rubric_${rubricId}.html`
      );
      activityJson["oer:gradingFormat"] = {
        "@type": ["asn:Rubric", "Thing"],
        "@id": activity.metadata.rubric_id,
        url: url,
      };
    }
  }

  return activityJson;
};

export function materialToOcx(
  material: MaterialReference,
  includeContext = true
) {
  const id = `Material_${snakeCase(material.id.toLocaleLowerCase())}`;
  const referenceId = includeContext
    ? `#${id}`
    : materialPath(material, config.baseOcxPath);

  const materialJson = buildJsonLd(
    "oer:SupportingMaterial",
    {
      "@id": referenceId,
      educationalUse: material?.resolvedMaterial?.metadata?.material_type,
    },
    includeContext
  );

  const accessType = material?.accessType?.toLocaleLowerCase()?.trim();
  if (["individual-submission", "shared-submission"].includes(accessType)) {
    materialJson["ocx:collaborationType"] = accessType;
  }

  if (material.resolvedMaterial) {
    materialJson.name = materialName(material);

    if (accessType == "link") {
      materialJson.url = material.resolvedMaterial.metadata.link;
    } else if (!includeContext) {
      materialJson.url = referenceId;
    }

    if (includeContext) {
      materialJson.isPartOf = {
        "@type": "oer:Unit",
        "@id": unitPath(material.resolvedMaterial, config.baseOcxPath),
      };
    }
  }

  return materialJson;
}

export const rubricToOcx = (
  rubricRef: RubricReference,
  includeContext = true
) => {
  return buildJsonLd(
    ["asn:Rubric", "Thing"],
    {
      "@id": rubricRef.rubric_id,
      name: rubricRef.resolvedRubric.title,
      "asn:hasCriterion": rubricRef.resolvedRubric.criterions.map(
        (criterion) => {
          const criterionId = `${rubricRef.rubric_id}_${criterion.title}`;
          return buildJsonLd(
            ["asn:RubricCriterion", "Thing"],
            {
              "@id": criterionId,
              name: criterion.title,
              description: criterion.description,
              "asn:hasLevel": criterion.levels.map((level) =>
                buildJsonLd(
                  ["asn:CriterionLevel", "Thing"],
                  {
                    "@id": `${criterionId}_${level.points}`,
                    "asn:benchmark": level.title,
                    "asn:score": level.points,
                    description: level.description,
                  },
                  false
                )
              ),
            },
            false
          );
        }
      ),
    },
    includeContext
  );
};

const buildUnit = async (document: OdellDocument) => {
  const json = buildJsonLd("oer:Unit", {
    "@id": unitPath(document, config.baseOcxPath),
  });
  if (document.metadata.grade) {
    json.educationalAlignment = {
      "@type": "AlignmentObject",
      alignmentType: "Educational level",
      educationalFramework: "US Grade Levels",
      targetName: document.metadata.grade,
      targetUrl: {
        "@id": `http://purl.org/ASN/scheme/ASNEducationLevel/${document.metadata.grade}`,
      },
    };
  }

  let description = document.metadata.description;

  if (document.metadata.look_fors) {
    description += `<br />${document.metadata.lesson_look_fors}`;
  }

  if (description) {
    json.description = description;
  }

  if (document.metadata.lesson_type == "optional") {
    json["ocx:optionality"] = "optional";
  }

  json.name = unitName(document);

  const activities = [];
  let i = 0;
  for (const activity of document.activities) {
    activities.push(buildActivity(document, activity, ++i));
  }

  const unitLessons = await findUnitLessons(
    document.metadata.grade,
    document.metadata.guidebook_type
  );

  const lessonUrls = sortBy(
    unitLessons.map((lesson) => {
      const url = lessonPath(
        {
          metadata: {
            grade: document.metadata.grade,
            guidebook_type: document.metadata.guidebook_type,
            lesson,
          },
        },
        config.baseOcxPath
      );
      return {
        "@type": "oer:Lesson",
        "@id": url,
        url,
        position: parseInt(lesson),
      };
    }),
    [(l) => l.position]
  );

  json.hasPart = activities.concat(lessonUrls);

  if (document.metadata.rubrics) {
    json["ocx:rubric"] = document.metadata.rubrics.rubrics.map((r) => ({
      "@type": ["asn:Rubric", "Thing"],
      "@id": r.rubric_id,
      url: rubricPath(document, r, config.baseOcxPath),
    }));
  }

  return json;
};

const buildLesson = (lesson: OdellDocument) => {
  const lessonJson = buildJsonLd("oer:Lesson", {
    "@id": lessonPath(lesson, config.baseOcxPath),
  });
  if (lesson.metadata.grade) {
    lessonJson.educationalAlignment = {
      "@type": "AlignmentObject",
      alignmentType: "Educational level",
      educationalFramework: "US Grade Levels",
      targetName: lesson.metadata.grade,
      targetUrl: {
        "@id": `http://purl.org/ASN/scheme/ASNEducationLevel/${lesson.metadata.grade}`,
      },
    };
  }
  const partOf = [];
  if (lesson.metadata.guidebook_type) {
    partOf.push({
      "@type": "oer:Unit",
      "@id": unitPath(lesson, config.baseOcxPath),
      name: lesson.metadata.guidebook_title,
    });
  }
  lessonJson.isPartOf = partOf;

  let description = lesson.metadata.lesson_description;

  if (lesson.metadata.lesson_look_fors) {
    description += `<br />${lesson.metadata.lesson_look_fors}`;
  }

  if (description) {
    lessonJson.description = description;
  }

  if (lesson.metadata.lesson_type == "optional") {
    lessonJson["ocx:optionality"] = "optional";
  }

  lessonJson.name = lessonName(lesson);

  const activities = [];
  let i = 0;
  for (const activity of lesson.activities) {
    activities.push(buildActivity(lesson, activity, ++i));
  }
  lessonJson.hasPart = activities;

  return lessonJson;
};

export async function documentToOcx(document: OdellDocument) {
  const docType = document.metadata.type;
  if (docType == "unit") {
    return buildUnit(document);
  } else if (docType == "lesson") {
    return buildLesson(document);
  }

  throw new Error(`Unknown document type: ${document.metadata.type}`);
}
