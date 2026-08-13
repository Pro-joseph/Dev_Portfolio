import { IconType } from "react-icons";
import {
  FaAws,
  FaBolt,
  FaCertificate,
  FaClipboardCheck,
  FaCloud,
  FaCode,
  FaCubes,
  FaDatabase,
  FaDocker,
  FaEnvelope,
  FaGit,
  FaGitlab,
  FaGlobe,
  FaGithub,
  FaGraduationCap,
  FaInstagram,
  FaJenkins,
  FaLaptopCode,
  FaLinkedin,
  FaLock,
  FaNetworkWired,
  FaNodeJs,
  FaPython,
  FaReact,
  FaRocket,
  FaServer,
  FaShieldAlt,
  FaTerminal,
  FaTwitter,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";

const KEYWORD_ICONS: [string, IconType][] = [
  ["aws", FaAws],
  ["amazon", FaAws],
  ["docker", FaDocker],
  ["kubernetes", FaCubes],
  ["k8s", FaCubes],
  ["react", FaReact],
  ["python", FaPython],
  ["node", FaNodeJs],
  ["javascript", FaCode],
  ["typescript", FaCode],
  ["express", FaCode],
  ["jenkins", FaJenkins],
  ["gitlab", FaGitlab],
  ["git", FaGit],
  ["postgres", FaDatabase],
  ["mysql", FaDatabase],
  ["database", FaDatabase],
  ["sql", FaDatabase],
  ["redis", FaBolt],
  ["frontend", FaLaptopCode],
  ["web", FaLaptopCode],
  ["backend", FaServer],
  ["linux", FaServer],
  ["server", FaServer],
  ["cloud", FaCloud],
  ["security", FaShieldAlt],
  ["cyber", FaShieldAlt],
  ["shield", FaShieldAlt],
  ["network", FaNetworkWired],
  ["terminal", FaTerminal],
  ["api", FaRocket],
];

export function iconFromText(text: string, fallback: IconType = FaCode): IconType {
  const lower = text.toLowerCase();
  for (const [keyword, icon] of KEYWORD_ICONS) {
    if (lower.includes(keyword)) return icon;
  }
  return fallback;
}

/** Icon for a skill by its name. */
export function skillIcon(name: string): IconType {
  return iconFromText(name, FaCode);
}

/** Icon for a skill category by its name. */
export function categoryIcon(category: string): IconType {
  return iconFromText(category, FaServer);
}

/** Icon for a certification derived from its title and issuer. */
export function certIcon(title: string, issuer = ""): IconType {
  const text = `${title} ${issuer}`;
  if (/aws|amazon web/i.test(text)) return FaAws;
  if (/kubernetes|k8s|container|orchestration/i.test(text)) return FaCubes;
  if (/postgres|mysql|mongo|database|sql|data/i.test(text)) return FaDatabase;
  if (/security|cyber|shield|iso|27001|compliance/i.test(text)) return FaShieldAlt;
  if (/pmp|project management/i.test(text)) return FaClipboardCheck;
  if (/docker|devops|ci\/?cd/i.test(text)) return FaDocker;
  if (/university|degree|bachelor|master|school|engineering/i.test(text)) return FaGraduationCap;
  return FaCertificate;
}

/** Icon for a social platform by its name. */
export function socialIcon(platform: string): IconType {
  const p = platform.toLowerCase();
  if (p.includes("github")) return FaGithub;
  if (p.includes("linkedin")) return FaLinkedin;
  if (p.includes("twitter") || p === "x") return FaTwitter;
  if (p.includes("whatsapp")) return FaWhatsapp;
  if (p.includes("instagram")) return FaInstagram;
  if (p.includes("youtube")) return FaYoutube;
  if (p.includes("mail") || p.includes("email")) return FaEnvelope;
  if (p.includes("lock") || p.includes("privacy")) return FaLock;
  return FaGlobe;
}