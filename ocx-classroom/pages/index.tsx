import React, { useState } from "react";
import { useSession } from "next-auth/client";
import { Course } from "src/types";
import { getRequest, postRequest } from "src/xhr";

const SAMPLE_COURSE = {
  name: "10th Grade Biology",
  section: "Period 2",
  descriptionHeading: "Welcome to 10th Grade Biology",
  description:
    "We'll be learning about about the structure of living creatures from a combination of textbooks, guest lectures, and lab work. Expect to be excited!",
  room: "301",
  ownerId: "me",
  courseState: "PROVISIONED"
};

export default function Home() {
  const [session, _loading] = useSession();
  const [courses, setCourses] = useState(null);

  if (!session) return null;

  const onList = async () => {
    const { courses } = await getRequest("/api/list-courses");
    setCourses(courses);
  };

  const onCreate = async () => {
    var course = SAMPLE_COURSE;
    const data = await postRequest("/api/create-course", course);
    setCourses([...courses, data]);
  };

  const btn = { marginRight: "1em" };
  return (
    <div>
      <p>
        <button onClick={onList} style={btn}>
          List courses
        </button>
        <button onClick={onCreate} style={btn}>
          Create course
        </button>
      </p>
      <ul>
        {courses?.length &&
          courses.map((course: Course, i: number) => (
            <li key={`course-${i}`}>
              {course.id} - {course.name}
            </li>
          ))}
      </ul>
    </div>
  );
}
