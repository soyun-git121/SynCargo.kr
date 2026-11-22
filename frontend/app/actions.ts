"use server";

import { search } from "@syncargo/backend/data";

/** 상단 검색 (클라이언트 → 서버). 실무자는 내 건만, 대표는 회사 전체. */
export async function searchAction(query: string, scope: "mine" | "company" = "mine") {
  return search(query, scope);
}
