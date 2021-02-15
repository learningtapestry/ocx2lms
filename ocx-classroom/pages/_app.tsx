import { AppProps } from "next/app";
import Head from "next/head";
import { Provider } from "next-auth/client";
import "modern-normalize/modern-normalize.css";
import "styles/globals.css";
import styles from "styles/App.module.css";
import Header from "components/Header";

function App({ Component, pageProps }: AppProps) {
  const title = "OCX - Classroom";
  return (
    <Provider session={pageProps.session}>
      <Head>
        <title>{title}</title>
      </Head>
      <Header title={title} {...pageProps} />
      <div className={styles.container}>
        <main className={styles.main}>
          <Component {...pageProps} />
        </main>
      </div>
    </Provider>
  );
}

export default App;
