import type { GenericObject, Rubric } from "src/types";
import {
  Box,
  Badge,
  Button,
  Heading,
  Divider,
  Text,
  Modal,
  ModalOverlay,
  ModalCloseButton,
  ModalContent,
  ModalBody,
  useDisclosure
} from "@chakra-ui/react";

interface IProps {
  rubric: Rubric;
  last: boolean;
}

const RubricItem = (props: IProps) => {
  let { rubric, last } = props;

  return (
    <Box padding="4" bg="gray.100" w="100%">
      <Badge size="sm" variant="subtle" colorScheme="blue" mb="1" mr="1">
        Rubric
      </Badge>
      <Badge size="sm" variant="subtle" colorScheme="teal" mb="1" mr="1">
        {rubric["@id"]}
      </Badge>
      <Heading as="h2" size="md" mb="4">
        {rubric.name}
      </Heading>
      {rubric.description && <Text mt="1">{rubric.description}</Text>}
      <SheetModal rubric={rubric} />
      {!last && <Divider borderBottomColor="teal" mt="4" />}
    </Box>
  );
};

const SheetModal = ({ rubric }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <Button size="sm" onClick={onOpen} colorScheme="teal">
        preview
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody>
            <Box my="10">
              {rubric["asn:hasCriterion"]?.map((c: GenericObject, i: number) => (
                <Box key={`${rubric["@id"]}--${i}`} mb="4">
                  <Heading as="h4" size="md" mb="2">
                    {i + 1}) {c.name}
                  </Heading>
                  <Text mt="1">{c.description}</Text>
                </Box>
              ))}
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
export default RubricItem;
