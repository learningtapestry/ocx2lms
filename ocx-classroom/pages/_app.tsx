import { AppProps } from "next/app";
import Head from "next/head";
import { Provider } from "next-auth/client";
import { ChakraProvider, extendTheme, Container } from "@chakra-ui/react";
import theme from "src/theme";
import Header from "components/Header";

const chakraTheme = extendTheme(theme);

function App({ Component, pageProps }: AppProps) {
  const title = "OCX - Classroom";
  return (
    <Provider session={pageProps.session}>
      <ChakraProvider theme={chakraTheme}>
        <Head>
          <title>{title}</title>
        </Head>
        <Header title={title} {...pageProps} />
        <Container as="main" maxW="container.md">
          <Component {...pageProps} />
        </Container>
      </ChakraProvider>
    </Provider>
  );
}

export default App;
