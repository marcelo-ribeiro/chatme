import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import styles from "../../styles/Home.module.css";

// export const isBrowser = typeof window !== "undefined";

export default function Room() {
  const router = useRouter();
  const { room } = router.query;
  const [messages, setMessages] = useState<object[]>([]);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState();
  const [user, setUser] = useState<any>();
  const [isReady, setIsReady] = useState(false);
  const socket = useRef<WebSocket>();
  const scrollContainer = useRef<HTMLDivElement>(null);
  const inputMessage = useRef<HTMLInputElement>(null);

  // Get username
  useEffect(() => {
    let user: any;
    const sessionUser = sessionStorage["mychat:user"];
    if (sessionUser) {
      user = JSON.parse(sessionUser);
    } else {
      const username = prompt("Qual o seu apelido?") || "Anônimo";
      user = { id: uuid(), username };
      sessionStorage["mychat:user"] = JSON.stringify(user);
    }
    setUser(user);
  }, []);

  // Scrool to bottom on new messages
  useEffect(() => {
    scrollContainer.current!.scrollTop = scrollContainer.current!.scrollHeight;
  }, [messages]);

  // Fetch WebsocketServer
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    (async () => {
      try {
        await fetch("/api/socket", {
          method: "POST",
          body: JSON.stringify(user),
          signal: controller.signal,
        });
        setIsReady(true);
      } catch (error) {
        console.log({ error });
      }
    })();
    return () => {
      controller?.abort();
    };
  }, [user]);

  // Send message
  const sendMessage = useCallback(
    (message: string) => {
      let messageData: any = {
        type: "message",
        user,
        message,
      };
      const messageDataString = JSON.stringify(messageData);
      if (socket.current?.bufferedAmount === 0) {
        socket.current?.send(messageDataString);
      }
      setMessage("");
    },
    [user]
  );

  // Create new user
  const addUser = useCallback(() => {
    const data = {
      type: "newUser",
      message: "Usuário conectado",
      user,
    };
    if (socket.current?.bufferedAmount === 0) {
      socket.current?.send(JSON.stringify(data));
    }
  }, [user]);

  // Connect to WebsocketServer and listen for events
  useEffect(() => {
    if (!!isReady && !socket.current) {
      socket.current = new WebSocket(
        `${location.protocol === "http:" ? "ws" : "wss"}://${location.host}`,
        room
      );

      socket.current?.addEventListener("message", onMessage);
      socket.current?.addEventListener("open", addUser, { once: true });
      socket.current?.addEventListener(
        "close",
        (close) => console.log({ close }),
        { once: true }
      );
      socket.current?.addEventListener(
        "error",
        (error) => console.log({ error }),
        { once: true }
      );
    }

    return () => {
      if (socket.current?.readyState !== WebSocket.OPEN) {
        socket.current?.close();
        socket.current?.removeEventListener("message", onMessage);
      }
    };
  }, [user, room, isReady, addUser]);

  // Listen for messages received from WebsocketServer
  const onMessage = (messageEvent: MessageEvent) => {
    const message = JSON.parse(messageEvent.data);

    switch (message.type) {
      case "updateUsers":
        setUsers(message.users);
        break;
      default:
        setMessages((messages: any) => [...messages, message]);
    }
  };

  // Handle form Submit and send message to WebsocketServer
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    inputMessage.current!.focus();
    sendMessage(message);
  };

  // Check if is author of message
  const isAuthorMessage = (messageData: any) =>
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
          messages?.map((message: any) => (
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
