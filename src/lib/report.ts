const REPO = "https://github.com/tuyisengeaurele/questions-and-answers";

/** A pre-filled GitHub issue for a question that looks wrong. */
export function reportUrl(q: { id: number; num: number; text: string }): string {
  const title = `Question ${q.num}: something looks wrong`;
  const stem = q.text.length > 160 ? `${q.text.slice(0, 157)}...` : q.text;
  const body = `Question ${q.num} (id ${q.id})\n\n> ${stem}\n\nWhat is wrong (text, answer, or picture)?\n`;
  const params = new URLSearchParams({ title, body });
  return `${REPO}/issues/new?${params.toString()}`;
}
