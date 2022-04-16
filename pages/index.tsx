import Link from "next/link";
import { useRouter } from "next/router";
import { v4 as uuid } from "uuid";
import styles from "../styles/Home.module.css";

const roomId = uuid();

export default function Home() {
  const router = useRouter();

  const createRoom = () => {
    (async () => {
      try {
        const response = await fetch("/api/socket", {
          method: "POST",
        });
        const { room, success } = await response.json();
        if (!response.ok || !success) {
          throw new Error("Não foi possível criar a sala");
        }
        router.push(`/room/${room}`);
      } catch (error) {
        console.log("Error: ", error);
      }
    })();
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>
          <Link href="/">
            <a>tchat</a>
          </Link>
        </h1>
      </header>

      <main className={styles.main} style={{ alignContent: "center" }}>
        <button className="button button--room" onClick={createRoom}>
          Criar nova sala
        </button>
      </main>
    </div>
  );
}
