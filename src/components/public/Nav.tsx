import Link from "next/link";

export default function Nav({ resumeUrl }: { resumeUrl?: string | null }) {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-surface/85 backdrop-blur-md border-b border-line/70">
      <div className="flex items-center gap-2">
        <Link href="/" className="font-heading text-lg tracking-tight font-bold">
          Youssef Jdira
        </Link>
        <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
      </div>
      <div className="hidden md:flex gap-8 text-sm font-medium tracking-wider uppercase">
        <a href="#projects" className="relative nav-link">Projects</a>
        <a href="#skills" className="relative nav-link">Skills</a>
        <a href="#contact" className="relative nav-link">Contact</a>
      </div>
      {resumeUrl ? (
        <a
          href={resumeUrl}
          target="_blank"
          rel="noreferrer"
          className="group relative overflow-hidden bg-primary text-white px-6 py-2 rounded-full text-xs font-bold tracking-widest hover:bg-gray-800 transition-colors"
        >
          Download Resume
        </a>
      ) : (
        <Link
          href="/#contact"
          className="group relative overflow-hidden bg-primary text-white px-6 py-2 rounded-full text-xs font-bold tracking-widest hover:bg-gray-800 transition-colors"
        >
          Get In Touch
        </Link>
      )}
    </nav>
  );
}