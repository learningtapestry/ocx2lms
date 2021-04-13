import type { CourseWork } from "src/types";
import { Box, Heading, Text, Badge, Divider } from "@chakra-ui/react";
import MaterialItem from "./MaterialItem";

interface IProps {
  coursework: CourseWork;
  last: boolean;
  sub?: boolean;
}

const CourseWorkItem = (props: IProps) => {
  let { coursework, last, sub = false } = props;

  let { id, title, description, materials, type, topic } = coursework;
  let dividerColor = sub ? "gray" : "teal";

  return (
    <Box padding="4" bg={sub ? "gray.200" : "gray.100"} w="100%">
      {title && (
        <>
          <Badge size="sm" variant="subtle" colorScheme="blue" mb="1" mr="1">
            {type}
          </Badge>
          {topic && (
            <Badge size="sm" variant="subtle" colorScheme="green" mb="1" mr="1">
              {topic}
            </Badge>
          )}
          <Badge size="sm" variant="subtle" colorScheme="teal" mb="1" mr="1">
            {id}
          </Badge>
          <Heading as="h2" size="md" mb="4">
            {title}
          </Heading>
        </>
      )}
      {description && <Text mt="1">{description}</Text>}
      {materials?.map((m, i) => (
        <MaterialItem key={`${id}--m${i}}`} material={m} />
      ))}
      {!last && <Divider borderBottomColor={dividerColor} mt="4" />}
    </Box>
  );
};

export default CourseWorkItem;
