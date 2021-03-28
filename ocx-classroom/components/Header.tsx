import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/client";
import { Box, Flex, Text, Button } from "@chakra-ui/react";
import { GenericObject } from "src/types";

const Header = ({ title }) => {
  const [session, _loading] = useSession();

  const onSignIn = () => signIn("google");

  const onSignOut = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    signOut().then(() => location.reload());
  };

  return (
    <Flex as="nav" bg="teal.700" color="white" px="5" py="2">
      <Box fontWeight="bold">
        <Link href="/">{title}</Link>
      </Box>
      <Box flex="1"></Box>
      <Box>
        {session ? (
          <>
            <Text as="span">Welcome, {session.user?.name}</Text>
            <HeaderBtn onClick={onSignOut} label="Sign Out" />
          </>
        ) : (
          <HeaderBtn onClick={onSignIn} label="Sign In" />
        )}
      </Box>
    </Flex>
  );
};

const HeaderBtn = (props: GenericObject) => (
  <Button as="a" size="sm" colorScheme="blackAlpha" ml="5" {...props}>
    {props.label}
  </Button>
);

export default Header;
