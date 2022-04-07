import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import styles from "../../styles/Home.module.css";

export const isBrowser = typeof window !== "undefined";
// console.log({ isBrowser });
// const socket = isBrowser
//   ? new WebSocket(`ws://${location.host}`, sessionStorage.getItem("room"))
//   : null;
// console.log({ socket });

export default function Room() {
  const router = useRouter();
  const { room } = router.query;
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState();
  const [isReady, setIsReady] = useState();
  const socket = useRef();
  const scrollContainer = useRef();
  const inputMessage = useRef();

  useEffect(() => {
    let user;
    if (sessionStorage["mychat:user"]) {
      user = JSON.parse(sessionStorage["mychat:user"]);
    } else {
      let username = prompt("Qual o seu apelido?");
      username = username || "Anônimo";

      user = { id: uuid(), username };
      sessionStorage["mychat:user"] = JSON.stringify(user);
    }
    setUser(user);
  }, []);

  useEffect(() => {
    scrollContainer.current.scrollTop = scrollContainer.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    (async () => {
      console.log("Fetching");
      try {
        await fetch("/api/socket", {
          method: "POST",
          body: JSON.stringify(user),
          signal: controller.signal,
        });
        console.log("Fetched");
        setIsReady(true);
      } catch (error) {
        console.log({ error });
      }
    })();
    return () => {
      console.log("unmount");
      controller?.abort();
    };
  }, [user]);

  const sendMessage = useCallback((message, user) => {
    socket?.current?.send(
      JSON.stringify({
        id: uuid(),
        created: new Date(),
        user,
        message,
      })
    );
    setMessage("");
  }, []);

  useEffect(() => {
    console.count("useEffect");

    if (!!isReady && !socket.current) {
      console.log("socket.current is null");
      socket.current = new WebSocket(`wss://${location.host}`, room);
      console.log({ socket: socket.current });

      socket?.current?.addEventListener("message", onMessage);
      socket?.current?.addEventListener(
        "open",
        () => sendMessage("Usuário conectado", user),
        { once: true }
      );
      // socket?.current?.addEventListener(
      //   "open",
      //   (open) => console.log({ open }),
      //   {
      //     once: true,
      //   }
      // );
      // socket?.current?.addEventListener(
      //   "close",
      //   (close) => console.log({ close }),
      //   { once: true }
      // );
      // socket?.current?.addEventListener(
      //   "error",
      //   (error) => console.log({ error }),
      //   { once: true }
      // );
    }

    return () => {
      console.log("unmount");
      if (socket?.current?.readyState !== WebSocket.OPEN) {
        // socket?.current?.close();
        // socket?.current?.removeEventListener("message", onMessage);
      }
    };
  }, [user, sendMessage, room, isReady]);

  const onMessage = (messageEvent) => {
    console.log({ messageEvent });
    if (messageEvent.type === "message") {
      const message = JSON.parse(messageEvent.data);
      console.log({ message });
      setMessages((messages) => [...messages, message]);
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    inputMessage.current.focus();
    sendMessage(message, user);
  };

  const isAuthorMessage = (messageData) =>
    user?.username === messageData.user.username;

  return (
    <div className={styles.page} ref={scrollContainer}>
      <header className={styles.header}>
        <h1>
          <Link href="/" replace>
            <a>chat.me</a>
          </Link>
        </h1>
      </header>

      <main className={styles.main}>
        {!!user &&
          messages.map((message) => (
            <div
              className={`chat__message ${
                isAuthorMessage(message)
                  ? "chat__message--me"
                  : "chat__message--other"
              }`}
              key={message.id}
            >
              <div>
                <strong>{message.user.username}</strong>{" "}
                <time>{new Date(message.created).toLocaleTimeString()}</time>
              </div>
              {message.message}
            </div>
          ))}
      </main>

      <footer className={styles.footer}>
        <form onSubmit={onSubmit}>
          <input
            ref={inputMessage}
            type="text"
            className="input--text"
            name="message"
            required
            value={message}
            placeholder="Digite sua mensagem"
            onChange={(e) => setMessage(e.target.value)}
          />
          <button className="button--icon" type="submit">
            <svg
              className="icon icon-send"
              height="24"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
}
