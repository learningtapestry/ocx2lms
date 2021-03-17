import React, { useState } from "react";
import { GetServerSidePropsContext } from "next";
import { useSession } from "next-auth/client";
import { Course } from "src/types";
import { getRequest, postRequest } from "src/xhr";
import { Box, Button } from "@chakra-ui/react";

export default function Home({ course, courseId }) {
  const [session, _loading] = useSession();
  const [courses, setCourses] = useState(null);

  if (!session) return null;

  const onList = async () => {
    const { courses } = await getRequest("/api/list-courses");
    setCourses(courses);
  };

  const onCreate = async () => {
    // TODO: we are just getting a static sample course for now
    //       later we'll get from parsed ocx data
    const data = await postRequest("/api/create-course", course);
    setCourses([...courses, data]);
  };

  const onAssignment = async () => {
    const data = await postRequest("/api/assignments", { courseId });
    console.log(data);
  };

  console.log(course);

  return (
    <Box py="4">
      <Box align="center" mb="4">
        <Button onClick={onList} mr="1">
          List courses
        </Button>
        <Button onClick={onCreate} mr="1">
          Create course
        </Button>
        <Button onClick={onAssignment} mr="1">
          List assignments
        </Button>
      </Box>
      <Box>
        <ul>
          {courses?.length &&
            courses.map((course: Course, i: number) => (
              <li key={`course-${i}`}>
                {course.id} - {course.name}
              </li>
            ))}
        </ul>
      </Box>
    </Box>
  );
}

export const getServerSideProps = async (_context: GetServerSidePropsContext) => {
  const res = await getRequest(`${process.env.SAMPLES_URL}/course-01.json`);
  const course = res;
  const courseId = "278166926877"; // temp just for testing
  return { props: { course, courseId } };
};
