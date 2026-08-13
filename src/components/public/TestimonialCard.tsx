import { Testimonial } from "@/lib/types";
import Image from "next/image";
import { FaQuoteLeft } from "react-icons/fa";

export default function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="min-w-[400px] bg-elevated p-10 rounded-jumbo snap-center relative ring-1 ring-line/60">
      <FaQuoteLeft className="text-accent/20 text-4xl mb-6" />
      <p className="text-xl mb-8 leading-relaxed font-heading">&ldquo;{testimonial.quote}&rdquo;</p>
      <div className="flex items-center gap-4">
        {testimonial.avatar?.url ? (
          <Image
            src={testimonial.avatar.url}
            alt={testimonial.author}
            width={64}
            height={64}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-accent/30"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xl ring-4 ring-accent/15">
            {testimonial.author.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-bold font-heading">{testimonial.author}</p>
          <p className="text-secondary text-sm">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
}