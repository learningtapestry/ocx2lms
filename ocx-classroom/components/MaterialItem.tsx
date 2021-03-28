import { Badge, Flex, Link } from "@chakra-ui/react";

const MaterialItem = ({ material }) => {
  let type: string, url: string;
  if (material.link) {
    type = "link";
    url = material.link.url;
  } else if (material.driveFile) {
    type = `GDrive : ${material.driveFile.shareMode.toLowerCase()}`;
    url = material.driveFile.driveFile.id;
  } else if (material.youtubeVideo) {
    type = "Youtube";
    url = material.youtubeVideo.id;
  }
  return (
    <Flex alignItems="baseline" mt="3">
      <Badge size="sm" variant="subtle" colorScheme="blackAlpha" mr="4">
        {type}
      </Badge>
      <Link href={url} target="_blank" color="teal.700" flex="1" wordBreak="break-all">
        {url}
      </Link>
    </Flex>
  );
};

export default MaterialItem;
