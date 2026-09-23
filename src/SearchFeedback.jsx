export default function SearchFeedback({ query, count, noun = "result" }) {
  return (
    <span role="status" aria-live="polite" aria-atomic="true" className={query.trim() ? `search-feedback ${count ? "found" : "search-feedback-empty"}` : "search-feedback-idle"}>
      {query.trim() ? (count ? `${count} ${noun}${count === 1 ? "" : "s"} found below.` : "No searched record found.") : ""}
    </span>
  );
}
