import React, { useState } from "react";
import { useSession } from "next-auth/client";
import { Box, Button, Flex, FormControl, Input } from "@chakra-ui/react";
import { OcxToClassroomParser } from "src/ocx";
import DataPreview from "components/DataPreview";

export default function Home({}) {
  let [session, _loading] = useSession();
  let [url, setUrl] = useState("");
  let [data, setData] = useState(null);

  if (!session) return null;

  let onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let parser = new OcxToClassroomParser(url);
    let newData = await parser.fetchAndParse();
    setData(newData);
  };

  return (
    <Box py="4">
      <form action="#" onSubmit={onSubmit}>
        <Flex mb="4" justifyContent="center">
          <FormControl id="course-url" w="60%" isRequired>
            <Input
              placeholder="OCX URL"
              variant="outline"
              focusBorderColor="teal.500"
              colorScheme="teal"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </FormControl>
          <Button colorScheme="teal" backgroundColor="teal.700" ml="2" type="submit">
            &raquo;
          </Button>
        </Flex>
      </form>
      <DataPreview data={data} />
    </Box>
  );
}
