import Link from "next/link";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  const createRoom = () => {
    (async () => {
      try {
        const response = await fetch("/api/socket", {
          method: "POST",
        });
        const { room, success } = await response.json();
        if (!response.ok || !success)
          throw new Error("Não foi possível criar a sala");
        router.push("/room/[room]", `/room/${room}`);
      } catch (error) {
        console.log("Error: ", error);
      }
    })();
  };

  return (
    <div className="page">
      <header className="header">
        <h1>
          <Link href="/">
            <a>talk2you</a>
          </Link>
        </h1>
      </header>

      <main className="main">
        <div className="main__container" style={{ alignContent: "center" }}>
          <button className="button button--room" onClick={createRoom}>
            Criar nova sala
          </button>
        </div>
      </main>
    </div>
  );
}
