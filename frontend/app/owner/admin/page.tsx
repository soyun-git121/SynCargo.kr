import { redirect } from "next/navigation";

/** 관리자 모드 첫 화면 = 메일 연결 범위 (R-10) */
export default function AdminIndex() {
  redirect("/owner/admin/mail");
}
