import type { Metadata } from "next";
import { getCertificationsData } from "@/lib/resources";
import { Certification } from "@/lib/types";
import SubNav from "@/components/public/SubNav";
import { certIcon } from "@/lib/icons";
import { FaAward, FaExternalLinkAlt, FaGraduationCap } from "react-icons/fa";

export const metadata: Metadata = {
  title: "Certifications & Education",
  description: "Formal credentials and continuous professional development in software engineering and systems architecture.",
};

export const revalidate = 60;

function certIconFor(cert: Certification) {
  return certIcon(cert.title, cert.issuer ?? "");
}

export default async function CertificationsPage() {
  const data = await getCertificationsData();

  const education = data.filter((c) => c.type === "education");
  const certifications = data.filter((c) => c.type === "certification");

  return (
    <>
      <SubNav />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <header className="mb-20 text-center">
            <p className="text-accent text-xs font-mono font-bold uppercase tracking-[0.2em] mb-4">
              ACADEMIC &amp; PROFESSIONAL RECORDS
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Certifications &amp; Education</h1>
            <p className="text-lg md:text-xl text-secondary max-w-2xl mx-auto leading-relaxed">
              Formal credentials and continuous professional development in software engineering
              and systems architecture.
            </p>
          </header>

          {education.length > 0 && (
            <section className="mb-24">
              <div className="flex items-center gap-4 mb-12">
                <FaGraduationCap className="text-accent text-2xl" />
                <h2 className="text-3xl font-bold">Academic Background</h2>
                <div className="flex-1 h-px bg-line" />
              </div>
              <div className="space-y-12">
                {education.map((degree) => (
                  <div key={degree.id} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start group">
                    <div className="md:col-span-3">
                      <span className="text-secondary font-mono text-sm uppercase tracking-wider">
                        {degree.period ?? degree.issued_on}
                      </span>
                    </div>
                    <div className="md:col-span-9">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                        <div>
                          <h3 className="text-2xl font-bold group-hover:text-accent transition-colors">{degree.title}</h3>
                          <p className="text-lg font-medium text-secondary">{degree.issuer}</p>
                        </div>
                        {degree.credential_id && (
                          <div className="bg-card px-4 py-1.5 rounded-full border border-line text-xs font-mono font-bold">
                            {degree.credential_id}
                          </div>
                        )}
                      </div>
                      {degree.description && (
                        <p className="text-secondary leading-relaxed mb-6">{degree.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {certifications.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-12">
                <FaAward className="text-accent text-2xl" />
                <h2 className="text-3xl font-bold">Professional Certifications</h2>
                <div className="flex-1 h-px bg-line" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {certifications.map((cert) => {
                  const Icon = certIconFor(cert);
                  return (
                    <div
                      key={cert.id}
                      className="p-8 bg-white border border-line rounded-jumbo shadow-sm hover:shadow-xl transition-all duration-300 group"
                    >
                      <div className="flex justify-between items-start mb-8">
                        <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-accent text-2xl group-hover:bg-accent group-hover:text-white transition-colors">
                          <Icon />
                        </div>
                        {cert.credential_id && (
                          <span className="text-xs font-mono text-secondary">{cert.credential_id}</span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-2">{cert.title}</h3>
                      {cert.issuer && (
                        <p className="text-secondary text-sm mb-6 uppercase font-bold tracking-widest">{cert.issuer}</p>
                      )}
                      {cert.description && (
                        <p className="text-secondary text-sm leading-relaxed mb-8">{cert.description}</p>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono font-bold text-secondary">
                          ISSUED: {cert.issued_on ? new Date(cert.issued_on + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase() : "—"}
                        </span>
                        {cert.verify_url && (
                          <a href={cert.verify_url} target="_blank" rel="noreferrer" className="text-xs font-bold uppercase tracking-widest text-accent hover:underline inline-flex items-center gap-1">
                            Verify Badge <FaExternalLinkAlt className="text-[9px]" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
