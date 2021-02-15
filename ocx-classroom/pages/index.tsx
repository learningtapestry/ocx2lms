import React, { useState } from "react";
import { useSession } from "next-auth/client";
import { Course } from "src/types";

export default function Home() {
  const [session, _loading] = useSession();
  const [courses, setCourses] = useState(null);

  if (!session) return null;

  const onClick = async () => {
    const response = await fetch("/api/courses");
    const res = await response.json();
    setCourses(res.courses);
  };

  return (
    <div>
      <p>
        <button onClick={onClick}>List courses</button>
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
