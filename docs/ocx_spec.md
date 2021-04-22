# ocx2lms - OCX spec for LMS integrations

This document describes a subset of OCX that is meant for publishing curriculum content on learning management systems (LMSs). Tools that support `ocx2lms` will be able to consistently import and export data as long as implementations conform to the spec.

## Encoding format

OCX documents combine metadata and textual content. The standard format is an HTML file with a `<script />` tag that embeds JSON-LD metadata. Relevant textual content in the HTML is identified by `@id` tags on the metadata.

## Conventions

- `ocx2lms` are preferably encoded in HTML and JSON-LD.
- The `@context` property is required.
  - The following namespaces are required for referencing OCX types (they may be omitted when not needed):
    - https://schema.org/
    - oer - http://oerschema.org/
    - ocx - https://github.com/K12OCX/k12ocx-specs/
    - asn - http://purl.org/ASN/schema/core/
- The `@type` property is required when referencing entities of various types.]
- Multiple values are allowed for every property where they may be needed, such as `educationalUse`.
- Additional descriptions for each property can be found in the respective [schema.org](https://schema.org/CreativeWork) definitions.

The following sections describe the OCX entities and properties that are used to construct OCX documents.

## Entities

### Unit

The `oer:Unit` type describes a grouping of lessons.

- `@id`

  **Required**. Unique identifier for the unit. If there's text content associated with the unit, the value must end in `#[id]`, where `[id]` references the HTML id for the element where content is stored.

- `@type`

  **Required**. Must have the value `oer:Unit`.

- `educationalLevel`

  Used for specifying the grade for a unit. Grades are constructed as `DefinedTerm` objects that reference ASN URLs.

  ```json
  "educationalLevel": {
    "@type": "DefinedTerm",
    "inDefinedTermSet": "US Grade Levels",
    "name": "2",
    "url": "http://purl.org/ASN/scheme/ASNEducationLevel/2"
  },
  ```

- `name`

  The name for the unit.

- `description`

  A description for the unit.

- `educationalUse`

  Describes the unit's role in the curriculum.

- `isPartOf`

  Used for defining a relationship between the lesson and a higher level entity, like a module.

  ```json
  {
    "@id": "...",
    "@type": "oer:Module",
    "name": "..."
  }
  ```

- `hasPart`

  Items contained in the unit, such as activities.

- `position`

  When the unit is part of a grouping of units, it can have a position.

- `oer:forTopic`

  References a topic, a thematic grouping, if the unit is attached to one.

- `ocx:material`

  References matterials attached to the unit.

- `ocx:optionality`

  Whether the unit is optional.

  Special values: `optional`

### Lesson

The `oer:Lesson` type describes a lesson in the curriculum.

- `@id`

  **Required**. Unique identifier for the lesson. If there's text content associated with the lesson, the value must end in `#[id]`, where `[id]` references the HTML id for the element where content is stored.

- `@type`

  **Required**. Must have the value `oer:Lesson`.

- `educationalLevel`

  Used for specifying the grade for a lesson. Grades are constructed as `DefinedTerm` objects that reference ASN URLs.

  ```json
  "educationalLevel": {
    "@type": "DefinedTerm",
    "inDefinedTermSet": "US Grade Levels",
    "name": "2",
    "url": "http://purl.org/ASN/scheme/ASNEducationLevel/2"
  },
  ```

- `name`

  The name for the lesson.

- `description`

  A description for the lesson.

- `educationalUse`

  Describes the lesson's role in the curriculum.

- `isPartOf`

  Used for defining a relationship between the lesson and a higher level entity, like an unit.

  ```json
  {
    "@id": "...",
    "@type": "oer:Unit",
    "name": "..."
  }
  ```

- `hasPart`

  Items contained in the lesson, such as activities.

- `position`

  When the lesson is part of a grouping of lessons, it can have a position.

- `oer:forTopic`

  References a topic, a thematic grouping, if the lesson is attached to one.

- `ocx:material`

  References matterials attached to the lesson.

- `ocx:optionality`

  Whether the unit is optional.

  Special values: `optional`

### Activity | Assessment

The `oer:Activity` type represents an educational activity - classwork for a lesson.

The `oer:Assessment` type shares the same properties as the `oer:Activity`.

- `@id`

  **Required**. Unique identifier for the activity. If there's text content associated with the activity, the value must end in `#[id]`, where `[id]` references the HTML id for the element where content is stored.

- `@type`

  **Required**. Must have the value `oer:Activity`.

- `name`

  The name for the activity.

- `description`

  A description for the activity.

- `educationalUse`

  Describes the lesson's role in the curriculum.

  Special values:

  - `progressive`: the activity is worked on throughout the class, and not as a one-off task.
  - `texts`: the activity is a reference text.

- `timeRequired`

  How much time the activity takes to be completed.

- `oer:gradingFormat`

  How the activity should be graded.

  Must always be a `oer:GradeFormat`. May reference one by ID.

- `oer:forTopic`

  References a topic, a thematic grouping, if the activity is attached to one.

- `ocx:optionality`

  Whether the activity is optional.

  Special values: `optional`

- `ocx:totalPoints`

  How many points the activity is worth when grading.

- `ocx:material`

  References matterials attached to the activity.

- `ocx:assignmentModality`

  Describes the way an assignment is presented.

  Special values: `read-listen`, `annotation`, `discussion`, `graphic `organizer`, `short `answer`, `essay`, `presentation`, `multiple choice`

- `ocx:collaborationType`

  Describes how an activity is collaborated on.

  Special values:

  - `independent`: the activity is worked on individually by a student.
  - `pair`: the activity is worked on by a pair of students.
  - `group`: the activity is worked on by a group of students.
  - `class`: the activity is worked on by the entire class.

### Topic

`oer:Topic` describes a thematic grouping of educational resources.

- `@id`

  **Required**. Unique identifier for the topic.

- `@type`

  **Required**. Must be a subtype of `oer:Topic`.

- `name`

  The name for the topic.

- `description`

  A description for the topic.

- `ocx:material`

  References matterials attached to the grouping.

### Material

The `oer:AssociatedMaterial` type represents a material associated with an educational resource. May be a text or video, for example.

- `@id`

  **Required**. Unique identifier for the material. If there's text content associated with the material, the value must end in `#[id]`, where `[id]` references the HTML id for the element where content is stored.

- `@type`

  **Required**. Must be a subtype of `oer:AssociatedMaterial`.

- `name`

  The name for the activity.

- `description`

  A description for the activity.

- `educationalUse`

  Describes the lesson's role in the curriculum.

  Special values:

  - `assignment`: the material is an assignment template.
  - `progressive`: the material is worked on throughout the class, and not as a one-off task.
  - `assessment`: the material is an assessment.
  - `link`: the material is a link to an external resource.
  - `text`: the material is a reference text.

- `ocx:collaborationType`

  Describes how the material is collaborated on.

  - `individual-submission`: the assignment will be submitted by a single student.
  - `shared-submission`: the assignment is worked on by more than one student.

- `url`

  When the material links to an external resource, use this property to indicate the resource's location.

### Grade Format

`oer:GradeFormat` describes a format or pattern for grading activities.

- `@id`

  **Required**. Unique identifier.

- `@type`

  **Required**. Must be a subtype of `oer:GradeFormat`. May optionally extend a schema.org type such as `Thing`.

  Subclasses for `oer:GradeFormat` include `CompletionGradeFormat`, `LetterGradeFormat`, `PercentGradeFormat` and `PointGradeFormat`.

  The grading format may also extend the type `asn:Rubric` to configure a rubric (see below).

- `name`

  The name for the format.

- `description`

  A description for the format.

### Grade Format - Rubric

`asn:Rubric` Describes a grading rubric.

- `@id`

  **Required**. Unique identifier for the material. If there's text content associated with the material, the value must end in `#[id]`, where `[id]` references the HTML id for the element where content is stored.

- `@type`

  **Required**. Must be a subtype of `oer:GradeFormat` as well as a `asn:Rubric`. May optionally extend a schema.org type such as `Thing` (needed for `name`, `description`, `position`).

- `name`

  The name for the rubric.

- `description`

  A description for the rubric.

- `asn:hasCriterion`

  Criterions for the rubric. Must be `asn:RubricCriterion`.

#### Rubric Criterion

`asn:RubricCriterion` describes a criterion for a rubric.

- `@id`

  **Required**. Unique identifier.

- `@type`

  **Required**. Must be a `asn:RubricCriterion`. May optionally extend a schema.org type such as `Thing` (needed for `name`, `description`, `position`).

- `name`

  The name for the criterion.

- `description`

  A description for the criterion.

- `position`

  The position for the level in the criterion.

- `asn:hasLevel`

  Outcome levels for the rubric. Must be `asn:CriterionLevel`.

#### Criterion Level

`asn:CriterionLevel` describes a rubric criterion level.

- `@id`

  **Required**. Unique identifier.

- `@type`

  **Required**. Must be a `asn:CriterionLevel`. May optionally extend a schema.org type such as `Thing` (needed for `name`, `description`, `position`).

- `name`

  The name for the level.

- `description`

  A description for the level.

- `position`

  The position for the level in the criterion.

- `asn:qualityLabel`

  Description for the achievement described by the level.

- `asn:score`

  Points awarded for achieving this level.
