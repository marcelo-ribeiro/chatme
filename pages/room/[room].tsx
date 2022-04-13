import { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import styles from "../../styles/Home.module.css";

// export const isBrowser = typeof window !== "undefined";

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (!context.params?.room) {
    return {
      notFound: true,
    };
  }

  const response = await fetch(
    `http://localhost:3000/api/socket?room=${context.params.room}`
  );

  if (!response.ok) {
    return {
      notFound: true,
    };
  }

  return {
    props: {}, // will be passed to the page component as props
  };
};

export default function Room() {
  const router = useRouter();
  const { room } = router.query;
  const [messages, setMessages] = useState<object[]>([]);
  const [users, setUsers] = useState();
  const [user, setUser] = useState<any>();
  const [isReady, setIsReady] = useState(false);
  const socket = useRef<WebSocket | null>(null);
  const scrollContainer = useRef<HTMLDivElement | null>(null);
  const inputMessage = useRef<HTMLInputElement | null>(null);

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
    scrollContainer.current?.scrollTo({
      top: scrollContainer.current!.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Fetch WebsocketServer
  // useEffect(() => {
  //   if (!user || !room) return;
  //   const controller = new AbortController();
  //   (async () => {
  //     try {
  //       const response = await fetch(`/api/socket?room=${room}`, {
  //         method: "GET",
  //         signal: controller.signal,
  //       });
  //       console.log({ response });

  //       if (!response.ok) {
  //         const data = await response.json();
  //         throw new Error(data.message);
  //       }
  //       setIsReady(true);
  //     } catch (error: any) {
  //       console.dir({ error });
  //       alert(error.message);
  //     }
  //   })();
  //   return () => {
  //     controller?.abort();
  //   };
  // }, [user, room]);

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
    if (!!user && !socket.current) {
      socket.current = new WebSocket(
        `${location.protocol === "http:" ? "ws" : "wss"}://${location.host}`,
        room
      );

      socket.current?.addEventListener("message", onMessage);
      socket.current?.addEventListener(
        "open",
        () => {
          addUser();
          setIsReady(true);
        },
        { once: true }
      );
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
        socket.current = null;
      }
    };
  }, [user, room, addUser]);

  // Listen for messages received from WebsocketServer
  const onMessage = (messageEvent: MessageEvent) => {
    const message = JSON.parse(messageEvent.data);

    switch (message.type) {
      case "updateUsers":
        setUsers(message.users);
        break;
      // case "newUser":
      //   setUser(message.user);
      //   break;
      case "message":
      default:
        setMessages((messages: any) => [...messages, message]);
    }
  };

  // Handle form Submit and send message to WebsocketServer
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    sendMessage(inputMessage.current!.value);
    inputMessage.current!.value = "";
    inputMessage.current!.focus();
  };

  // Check if is author of message
  const isAuthorMessage = (messageData: any) => {
    return user?.username === messageData.user.username;
  };

  return (
    <div className={styles.page} ref={scrollContainer}>
      <header className={styles.header}>
        <h1>
          <Link href="/" replace>
            <a>Darkchat</a>
          </Link>
        </h1>
      </header>

      <main className={styles.main}>
        {messages?.map((message: any) => (
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

      {isReady && (
        <footer className={styles.footer}>
          <form onSubmit={onSubmit}>
            <input
              ref={inputMessage}
              type="text"
              className="input--text chat__input"
              name={`message-${room}`}
              required
              placeholder="Digite sua mensagem"
              autoFocus
            />
            <button className="button button--icon chat__button" type="submit">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-send"
                viewBox="0 0 512 512"
              >
                <title>Send</title>
                <path
                  d="M470.3 271.15L43.16 447.31a7.83 7.83 0 01-11.16-7V327a8 8 0 016.51-7.86l247.62-47c17.36-3.29 17.36-28.15 0-31.44l-247.63-47a8 8 0 01-6.5-7.85V72.59c0-5.74 5.88-10.26 11.16-8L470.3 241.76a16 16 0 010 29.39z"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="32"
                />
              </svg>
            </button>
          </form>
        </footer>
      )}
    </div>
  );
}
