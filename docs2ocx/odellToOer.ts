import { snakeCase, uniq } from "lodash";
import { lessonPath, materialPath, unitPath } from "./paths";
import { Activity, OdellDocument, MaterialReference } from "./odellTypes";
import config from "./config";
import { dasherize, splitCommaSepValues } from "./util";

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
  const uses = uniq(
    [
      activity.metadata.activity_type.toLocaleLowerCase(),
      activity.metadata.progressive_assignment_group?.length
        ? "progressive"
        : null,
      dasherize(activity.metadata.assignment_modality),
    ].filter((u) => u)
  );
  const activityJson = buildJsonLd(
    "oer:Activity",
    {
      "@id": `#Activity_${index}`,
      name: activityName(lesson, activity),
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

  const alignments = splitCommaSepValues(activity.metadata.alignment);
  if (alignments.length) {
    activityJson.educationalAlignment = alignments.map((alignmentName) => ({
      "@type": "AlignmentObject",
      targetName: alignmentName,
      educationFramework: "CommonCoreStandard",
    }));
  }

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

  if (material.resolvedMaterial) {
    materialJson.name = materialName(material);

    if (material.accessType == "link") {
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

const buildUnit = (document: OdellDocument) => {
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
    json.educationalUse = "optional";
  }

  json.name = unitName(document);

  const activities = [];
  let i = 0;
  for (const activity of document.activities) {
    activities.push(buildActivity(document, activity, ++i));
  }
  json.hasPart = activities;

  return json;
};

const buildProgressiveAssignments = (document: OdellDocument) => {
  const unitRef = {
    "@type": "oer:Unit",
    "@id": unitPath(document, config.baseOcxPath),
    name: document.metadata.guidebook_title,
  };
  const activities = [];
  let i = 0;
  for (const activity of document.activities) {
    const activityJson = buildActivity(document, activity, ++i);
    activityJson.isPartOf = unitRef;
    activities.push(activityJson);
  }
  return buildGraph(activities);
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
    lessonJson.educationalUse = "optional";
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

export function documentToOer(document: OdellDocument) {
  const docType = document.metadata.type;
  if (docType == "unit") {
    return buildUnit(document);
  } else if (docType == "lesson") {
    return buildLesson(document);
  }

  throw new Error(`Unknown document type: ${document.metadata.type}`);
}
