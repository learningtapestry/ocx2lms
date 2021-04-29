import {
  Box,
  Badge,
  Flex,
  Link,
  Button,
  Modal,
  ModalOverlay,
  ModalCloseButton,
  ModalContent,
  ModalBody,
  useDisclosure
} from "@chakra-ui/react";

const MaterialItem = ({ material }) => {
  let type: string, url: string, shareMode;
  if (material.link) {
    type = "link";
    url = material.link.url;
  } else if (material.driveFile) {
    type = `GDrive : ${material.driveFile.shareMode.toLowerCase()}`;
    url = material.driveFile.driveFile.id;
  } else if (material.youtubeVideo) {
    type = "Youtube";
    url = material.youtubeVideo.id;
  } else if (material.ocxGdoc) {
    type = `gen GDoc`;
  }

  return (
    <Flex alignItems="baseline" mt="3">
      <Badge size="sm" variant="subtle" colorScheme="blackAlpha" mr="4">
        {type}
      </Badge>
      {material.ocxGdoc ? (
        <GDocModal material={material.ocxGdoc} />
      ) : (
        <Link href={url} target="_blank" color="teal.700" flex="1" wordBreak="break-all">
          {url}
        </Link>
      )}
    </Flex>
  );
};

const GDocModal = ({ material }) => {
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
              <Badge size="sm" variant="subtle" colorScheme="blackAlpha" mr="4" mb="5">
                {material.shareMode}
              </Badge>

              <div dangerouslySetInnerHTML={{ __html: material.content }} />
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default MaterialItem;
