import React, { useState } from "react";
import { useSession } from "next-auth/client";
import { Box, Button, Flex, FormControl, Input } from "@chakra-ui/react";

export default function Home({}) {
  const [session, _loading] = useSession();

  if (!session) return null;

  const getCourseInfo = () => {
    console.log("GET COURSE INFO");
  };

  return (
    <Box py="4">
      <Flex mb="4" justifyContent="center">
        <FormControl id="course-url" w="60%" isRequired>
          <Input
            placeholder="Course URL"
            variant="outline"
            focusBorderColor="teal.500"
            colorScheme="teal"
          />
        </FormControl>
        <Button colorScheme="teal" ml="2" onClick={getCourseInfo}>
          &raquo;
        </Button>
      </Flex>
      <Box></Box>
    </Box>
  );
}
