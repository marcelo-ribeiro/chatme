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
          content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover"
        />
        <meta name="description" content="Private Chat Online" />
        <meta name="keywords" content="chat online private" />
        <meta name="theme-color" content="#000" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="manifest" href="/manifest.json" />
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="crossorigin"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
