import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

export default function SubNav({ label = "Back to Portfolio" }: { label?: string }) {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-surface/80 backdrop-blur-md border-b border-line">
      <div className="flex items-center gap-2">
        <Link href="/" className="font-bold text-lg tracking-tight">
          Youssef Jdira
        </Link>
        <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors"
      >
        <FaArrowLeft className="text-xs" /> {label}
      </Link>
    </nav>
  );
}
