import React, { useState } from "react";
import { useSession } from "next-auth/client";
import { Box, Button, Flex, FormControl, Input } from "@chakra-ui/react";
import { getOCXjsonld } from "src/ocxUtils";

export default function Home({}) {
  let [session, _loading] = useSession();
  let [url, setUrl] = useState("");
  let [data, setData] = useState(null);

  if (!session) return null;

  let onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let data = await getOCXjsonld(url);
    console.log(data);
    setData(data);
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
          <Button colorScheme="teal" ml="2" type="submit">
            &raquo;
          </Button>
        </Flex>
      </form>
      <Box>{data && JSON.stringify(data, null, 2)}</Box>
    </Box>
  );
}
