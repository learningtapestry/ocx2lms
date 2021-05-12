import React, { useState } from "react";
import { useSession } from "next-auth/client";
import { Box, Button, Flex, FormControl, FormLabel, Input, useToast } from "@chakra-ui/react";
import { OcxToClassroomParser } from "src/ocx";
import DataPreview from "components/DataPreview";

export default function Home({}) {
  let [session, _loading] = useSession();
  let [url, setUrl] = useState("");
  let [weeklyPace, setWeeklyPace] = useState(5 * 45);
  let [defaultTime, setDefaultTime] = useState(15);
  let [data, setData] = useState(null);
  let toast = useToast();

  if (!session) return null;

  let onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let options = { weeklyPace, defaultTime };
    let parser = new OcxToClassroomParser(url, options);
    try {
      let newData = await parser.fetchAndParse();
      setData(newData);
    } catch (e) {
      console.error(e);
      toast({
        title: "Invalid OCX.",
        status: "error",
        duration: 5000,
        isClosable: true
      });
    }
  };

  return (
    <Box py="4">
      <form action="#" onSubmit={onSubmit}>
        <Box width="75%" mx="auto">
          <Flex mb="4">
            <Box flex="1">
              <FormControl id="course-url" width="100%" mb="2" isRequired>
                <Input
                  placeholder="OCX URL"
                  variant="outline"
                  focusBorderColor="teal.500"
                  colorScheme="teal"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </FormControl>
              <Flex mb="4">
                <FormControl id="weekly-pace" width="48%" mr="4%">
                  <FormLabel fontSize="xs" mb="0" ml="1">
                    Weekly Pace
                  </FormLabel>
                  <Input
                    placeholder="Weekly pace"
                    variant="outline"
                    focusBorderColor="teal.500"
                    colorScheme="teal"
                    value={weeklyPace}
                    onChange={(e) => setWeeklyPace(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormControl id="default-time" width="48%">
                  <FormLabel fontSize="xs" mb="0" ml="1">
                    Default time required
                  </FormLabel>
                  <Input
                    placeholder="Default time required"
                    variant="outline"
                    focusBorderColor="teal.500"
                    colorScheme="teal"
                    value={defaultTime}
                    onChange={(e) => setDefaultTime(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
              </Flex>
            </Box>
            <Button colorScheme="teal" backgroundColor="teal.700" ml="2" type="submit">
              &raquo;
            </Button>
          </Flex>
        </Box>
      </form>
      <DataPreview data={data} />
    </Box>
  );
}
