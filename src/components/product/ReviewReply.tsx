import { formatDate } from "@/lib/format";
import styles from "./ReviewReply.module.css";

export default function ReviewReply({ text, repliedAt }: { text?: string | null; repliedAt?: string | null }) {
  if (!text) return null;
  const validDate = repliedAt && Number.isFinite(new Date(repliedAt).getTime());
  return <div className={styles.reply}><div className={styles.heading}><strong>Відповідь TREBA</strong>{validDate && <time dateTime={repliedAt}>{formatDate(repliedAt)}</time>}</div><p>{text}</p></div>;
}
