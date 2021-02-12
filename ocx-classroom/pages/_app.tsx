import { AppProps } from "next/app";
import { Provider } from "next-auth/client";
import "styles/globals.css";

function App({ Component, pageProps }: AppProps) {
  return (
    <Provider session={pageProps.session}>
      <Component {...pageProps} />
    </Provider>
  );
}

export default App;
