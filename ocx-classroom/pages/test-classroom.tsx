import React, { useState } from "react";
import { GetServerSidePropsContext } from "next";
import { useSession } from "next-auth/client";
import { Course } from "src/types";
import { getRequest, postRequest } from "src/xhr";
import { Box, Button } from "@chakra-ui/react";

export default function Home({ course, courseId }) {
  let [session, _loading] = useSession();
  let [courses, setCourses] = useState(null);

  if (!session) return null;

  let onList = async () => {
    let { courses } = await getRequest("/api/list-courses");
    setCourses(courses);
  };

  let onCreate = async () => {
    // TODO: we are just getting a static sample course for now
    //       later we'll get from parsed ocx data
    let data = await postRequest("/api/create-course", course);
    setCourses([...courses, data]);
  };

  let onAssignment = async () => {
    let data = await postRequest("/api/assignments", { courseId });
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

export let getServerSideProps = async (_context: GetServerSidePropsContext) => {
  let res = await getRequest(`${process.env.SAMPLES_URL}/course-01.json`);
  let course = res;
  let courseId = "278166926877"; // temp just for testing
  return { props: { course, courseId } };
};
