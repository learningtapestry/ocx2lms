import React, { useState } from "react";
import { GetServerSidePropsContext } from "next";
import { useSession } from "next-auth/client";
import { Course } from "src/types";
import { getRequest, postRequest } from "src/xhr";
import { Box, Button } from "@chakra-ui/react";

// server side props
import fs from "fs";
import util from "util";
const readFile = util.promisify(fs.readFile);

export default function Home(props) {
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
    const course = props.course;
    const data = await postRequest("/api/create-course", course);
    setCourses([...courses, data]);
  };

  const onAssignment = async () => {
    const courseId = props.courseId;
    const data = await postRequest("/api/assignments", { courseId });
    console.log(data);
  };

  const btn = { marginRight: "1em" };
  return (
    <Box py="4">
      <Box align="center" mb="4">
        <Button onClick={onList} style={btn}>
          List courses
        </Button>
        <Button onClick={onCreate} style={btn}>
          Create course
        </Button>
        <Button onClick={onAssignment} style={btn}>
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
  const content = await readFile("data/samples/course-01.json", "utf-8");
  const course = JSON.parse(content);
  const courseId = "278166926877"; // temp just for testing
  return { props: { course, courseId } };
};
