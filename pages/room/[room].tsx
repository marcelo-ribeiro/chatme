import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { generateLightColorHsl } from "services/random-colors";
import styles from "../../styles/Home.module.css";

interface User {
  id: number;
  name: string;
  color: string;
}
interface Message {
  id: string;
  created: Date;
  message: string;
  user: User;
}

const colors = [
  "#FF0000",
  "#FFFF00",
  "#FF00FF",
  "#00FF00",
  "#00FFFF",
  "#0000FF",
];

export const isBrowser = typeof window !== "undefined";

// Get username
let cachedUser: User, cachedUsername: string;
if (isBrowser) {
  const sessionUser = sessionStorage["mychat:user"];
  if (sessionUser) {
    cachedUser = JSON.parse(sessionUser);
    cachedUsername = cachedUser.name;
  } else cachedUsername = prompt("Qual o seu apelido?") || "Anônimo";
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>();
  const [user, setUser] = useState<User | null>(cachedUser || null);
  const [username, setUsername] = useState(cachedUsername);
  const [isReady, setIsReady] = useState(false);
  const socket = useRef<WebSocket | null>(null);
  const scrollContainer = useRef<HTMLDivElement | null>(null);
  const inputMessage = useRef<HTMLInputElement | null>(null);

  // Scrool to bottom on new messages
  useEffect(() => {
    scrollContainer.current?.scrollTo({
      top: scrollContainer.current!.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Send message
  const sendMessage = useCallback(
    (message: string) => {
      let messageData: any = { user, message };
      if (socket.current?.bufferedAmount === 0) {
        socket.current?.send(JSON.stringify(messageData));
      }
    },
    [user]
  );

  // Create new user
  const addUser = useCallback(() => {
    const data = {
      type: "newUser",
      username: username,
      color: generateLightColorHsl(),
    };

    if (socket.current?.bufferedAmount === 0) {
      socket.current?.send(JSON.stringify(data));
    }
  }, [username]);

  // Connect to WebsocketServer and listen for events
  useEffect(() => {
    if (!!username && !socket.current) {
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
        (close) => {
          console.log({ close });
          // if (
          //   confirm(
          //     "Sua conexão com o servidor foi interrompida. Deseja tentar novamente?"
          //   )
          // )
          //   window.location.reload();
          // else router.replace("/");
        },
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
  }, [username, room, addUser]);

  // Listen for messages received from WebsocketServer
  const onMessage = (messageEvent: MessageEvent) => {
    console.log({ messageEvent });
    console.log(messageEvent.target === socket.current);

    const data = JSON.parse(messageEvent.data);

    switch (data.type) {
      case "updateUsers":
        setUsers(data.users);
        break;
      case "newUser":
        setUser(data.user);
        sessionStorage["mychat:user"] = JSON.stringify(data.user);
        break;
      case "message":
      default:
        handleMessages(data);
    }
  };

  const handleMessages = (message: any) => {
    setMessages((messages) => [...messages, message]);
  };

  // Handle form Submit and send message to WebsocketServer
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    sendMessage(inputMessage.current!.value);
    inputMessage.current!.value = "";
    inputMessage.current!.focus();
  };

  // Check if is author of message
  const isAuthorMessage = (messageData: Message) => {
    return user!.id === messageData.user.id;
  };

  const logout = () => {
    sessionStorage.removeItem("mychat:user");
    setUser(null);
    setUsername("");
    router.replace("/");
  };

  return (
    <div className={styles.page} ref={scrollContainer}>
      <header className={styles.header}>
        <h1 onClick={logout}>Darkchat</h1>
      </header>

      <main className={styles.main}>
        {messages?.map((message: Message) => (
          <div
            className={`chat__message ${
              isAuthorMessage(message)
                ? "chat__message--me"
                : "chat__message--other"
            }`}
            key={message.id}
          >
            <div>
              <strong
                style={{
                  color: `hsl(${message.user.color} 60% 60%)`,
                }}
              >
                {message.user.name}
              </strong>{" "}
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
