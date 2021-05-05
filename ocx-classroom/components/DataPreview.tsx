import type { ClassroomData, CourseWork, Rubric } from "src/types";
import { useState } from "react";
import {
  Container,
  Box,
  Heading,
  Text,
  Badge,
  Flex,
  Button,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  Link,
  useToast
} from "@chakra-ui/react";
import CourseWorkItem from "components/CourseWorkItem";
import RubricItem from "components/RubricItem";
import { postRequest } from "src/xhr";

interface IProps {
  data: ClassroomData;
}

const DataPreview = (props: IProps) => {
  let toast = useToast();
  let [syncing, setSyncing] = useState(false);
  let [courseUrl, setCourseUrl] = useState(null);
  if (!props.data) return null;

  let onSync = async (_e: React.MouseEvent<HTMLButtonElement>) => {
    setSyncing(true);
    try {
      let resp = await postRequest("/api/sync-classroom", props.data);
      if (resp.error) {
        throw { message: resp.error };
      }
      setCourseUrl(resp.alternateLink);
      toast({
        title: "Sync successfull.",
        description: `Visit your course on ${resp.alternateLink}.`,
        status: "success",
        duration: 5000,
        isClosable: true
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Something went wrong.",
        description: e.message,
        status: "error",
        duration: 5000,
        isClosable: true
      });
    } finally {
      setSyncing(false);
    }
  };

  let { course, courseworks, rubrics } = props.data;

  return (
    <>
      <Container w="xl" centerContent>
        {courseUrl && (
          <Box textAlign="center" py="4" mb="4" w="100%" backgroundColor="blackAlpha.100">
            <Link href={courseUrl} target="_blank" color="teal.700">
              {courseUrl}
            </Link>
          </Box>
        )}
        <Flex padding="4" bg="teal.700" w="100%">
          <Box flex="1">
            <Badge size="sm" variant="subtle" colorScheme="teal">
              {course.type}
            </Badge>
            <Badge size="sm" variant="subtle" colorScheme="teal" ml="1">
              {course.id}
            </Badge>
            <Heading as="h2" size="md" color="white">
              {course.name}
            </Heading>
            <Text color="whiteAlpha.700">{course.section}</Text>
          </Box>
          <Button colorScheme="teal" onClick={onSync} size="xs" mt="5px" disabled={syncing}>
            Sync to Classroom
          </Button>
        </Flex>
        <Text color="white">{course.description}</Text>
        {courseworks.map((c: CourseWork, i: number) => (
          <CourseWorkItem
            key={`${i}--${c.id}`}
            coursework={c}
            last={i === courseworks.length - 1 && !rubrics.length}
          />
        ))}
        {rubrics.map((r: Rubric, i: number) => (
          <RubricItem key={`${i}--${r["@id"]}`} rubric={r} last={i === rubrics.length - 1} />
        ))}
      </Container>
      <Modal isOpen={syncing} onClose={() => {}}>
        <ModalOverlay />
        <ModalContent>
          <Container centerContent>
            <Heading as="h2" size="md" color="teal.700" mt="10" mb="5">
              Synchronizing with Google Classroom
            </Heading>
            <Text color="teal.700">Please wait and don't close the page</Text>
            <Spinner color="teal.700" size="xl" my="10" />
          </Container>
        </ModalContent>
      </Modal>
    </>
  );
};

export default DataPreview;
