import { redirect } from "next/navigation";

// TODO(W-00): 로그인 화면이 생기면 /login 으로 변경
export default function Root() {
  redirect("/home");
}
