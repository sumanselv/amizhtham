"use client";

export default function DeleteButton({ title }: { title: string }) {
  return (
    <button
      type="submit"
      className="btn btn-danger"
      onClick={(e) => {
        if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) e.preventDefault();
      }}
    >
      Delete
    </button>
  );
}
