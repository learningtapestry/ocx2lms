import type { ClassroomData, CourseWorkAssignment, CourseWorkMaterial } from "src/types";
import { Container, Box, Heading, Text, Badge } from "@chakra-ui/react";
import CourseWorkItem from "components/CourseWorkItem";

interface IProps {
  data: ClassroomData;
}

const DataPreview = (props: IProps) => {
  if (!props.data) return null;

  let { course, courseworks } = props.data;
  let lastIndex = courseworks.length - 1;

  return (
    <Container w="xl" centerContent>
      <Box padding="4" bg="teal.700" w="100%">
        <Heading as="h2" size="md" color="white">
          {course.name}
          <Badge size="sm" variant="subtle" colorScheme="teal" ml="4">
            {course.type}
          </Badge>
        </Heading>
        <Text color="white">{course.description}</Text>
      </Box>
      {courseworks.map((c: CourseWorkMaterial | CourseWorkMaterial, i: number) => (
        <CourseWorkItem key={`${i}--${c.id}`} coursework={c} last={i === lastIndex} />
      ))}
    </Container>
  );
};

export default DataPreview;
