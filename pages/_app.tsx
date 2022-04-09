import { AppProps } from "next/app";
import Head from "next/head";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>chat.me</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, user-scalable=no"
        />
        <meta name="description" content="Private Chat Online" />
        <meta name="keywords" content="chat online private" />
        <meta name="theme-color" content="#99cc33" />
        <link rel="icon" href="/icons/favicon.ico" sizes="any" />
        {/* <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/icons/apple-touch-icon.png"
          />
          <link rel="manifest" href="/manifest.json" />
          <link
            href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap"
            rel="stylesheet"
          /> */}
      </Head>
      <Component {...pageProps} />
    </>
  );
}
