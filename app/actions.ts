"use server";

import { search } from "@/lib/data";

/** 상단 검색 (클라이언트 → 서버). 데이터는 lib/data.ts 경유. */
export async function searchAction(query: string) {
  return search(query);
}
