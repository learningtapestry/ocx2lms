import { snakeCase, uniq } from "lodash";
import { lessonPath, materialPath, unitPath } from "./paths";
import { Activity, LessonDocument, MaterialReference } from "./odellTypes";
import config from "./config";

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
      },
    ];
  }

  return {
    ...jsonLd,
    "@type": type,
    ...mergeProperties,
  };
};

const buildLesson = (lesson: LessonDocument) => {
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
    lessonJson.educationalUse = "optional";
  }

  const activities = [];
  let i = 0;
  for (const activity of lesson.activities) {
    activities.push(buildActivity(lesson, activity, ++i));
  }
  lessonJson.hasPart = activities;

  return lessonJson;
};

const buildActivity = (
  lesson: LessonDocument,
  activity: Activity,
  index: number,
  includeContext = false
) => {
  const uses = uniq(
    [
      activity.metadata.activity_type.toLocaleLowerCase(),
      activity.metadata.progressive_assignment_group?.length
        ? "progressive"
        : null,
    ].filter((u) => u)
  );
  const activityJson = buildJsonLd(
    "oer:Activity",
    {
      "@id": `#Activity_${index}`,
      name: activity.metadata.activity_title,
      educationalUse: uses,
    },
    includeContext
  );
  if (activity.metadata.pacing) {
    activityJson.timeRequired = `PT${activity.metadata.pacing}M`;
  }
  const materials = [];
  for (const material of activity.materials) {
    materials.push(materialToOer(material, false));
  }
  activityJson["ocx:material"] = materials;

  return activityJson;
};

export function materialToOer(
  material: MaterialReference,
  includeContext = true
) {
  const uses = uniq(
    [
      material.accessType.toLocaleLowerCase(),
      material?.resolvedMaterial?.metadata?.material_type,
    ].filter((m) => m)
  );

  const id = `Material_${snakeCase(material.id.toLocaleLowerCase())}`;
  const referenceId = includeContext
    ? `#${id}`
    : materialPath(material, config.baseOcxPath);

  const materialJson = buildJsonLd(
    "oer:SupportingMaterial",
    {
      "@id": referenceId,
      educationalUse: uses,
    },
    includeContext
  );

  if (material.accessType == "link" && material.resolvedMaterial) {
    materialJson.url = material.resolvedMaterial.metadata.link;
  }

  return materialJson;
}

export function lessonToOer(lesson: LessonDocument) {
  return buildLesson(lesson);
}
