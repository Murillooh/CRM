import { redirect } from "next/navigation";

export default function Home() {
  // Redireciona a raiz para o roteador de workspaces
  redirect("/app");
}
