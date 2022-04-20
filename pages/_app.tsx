import { AppProps } from "next/app";
import Head from "next/head";
import "../styles/globals.css";
import "../styles/Home.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>talk2you</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
