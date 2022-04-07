import Link from "next/link";
import { v4 as uuid } from "uuid";
import styles from "../styles/Home.module.css";

const roomId = uuid();

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>
          <Link href="/">
            <a>chat.me</a>
          </Link>
        </h1>
      </header>

      <main className={styles.main} style={{ alignContent: "center" }}>
        <Link href={`/room/${encodeURIComponent(roomId)}`}>
          <a className="button button--room">Criar nova sala</a>
        </Link>
      </main>
    </div>
  );
}
