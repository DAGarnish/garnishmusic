import "../../app/modern-globals.css";
import Link from "next/link";
import ModernHeader from "./ModernHeader";
import ModernHero from "./ModernHero";
import ModernFooter from "./ModernFooter";
import ModernPartners from "./ModernPartners";
import ModernTestimonialCarousel from "./ModernTestimonialCarousel";
import { PARTNER_LOGOS_RED } from "../../lib/modern-partner-logos";
import { getCityName, getCityAbbr } from "../../lib/modern-site-meta";
import { MODERN_SITE_ROUTES } from "../../lib/modern-site-routes";
import type { TestimonialItem } from "../../scripts/wp-shortcode-render";
import type { MenuNode } from "../menu-html";

// ny's real homepage, hand-rebuilt in the modern design system - every
// value below (copy, images, testimonials, course cards) was transcribed
// directly off ny.garnishmusicproduction.com (confirmed live, 2026-09-04),
// not extracted from its wpRawContent - unlike every previous "staging"
// build (edu included), this one deliberately carries none of ny's own
// WPBakery shortcode markup or Payload page docs forward, per explicit
// request to leave all of that behind on ny itself. Same reason this file
// hardcodes real values as plain data below rather than importing
// lib/modern-course-content.ts's extractors - there is no raw HTML here for
// those to run on.

// ny's own real "Free 15-Minute Consultation" bullet list (the network-wide
// popup - see components/ConsultationPopup.tsx - covers the popup itself;
// this is a separate, ny-specific list that sits on its real homepage) -
// doubles as ModernHero's "01-04" stats bar, unlike most other modern sites
// whose stats come from a hero-sliders doc ny has none of.
const HERO_STATS = [
  "Learn how to produce the quality music you love in New York City",
  "New York facilities in Brooklyn and Manhattan",
  "Over 360 class hours which can be taken from 18-weeks to two years",
  "Shorter 120-hour Producer Programs in Ableton Live or Logic Pro",
];

// ny's real hero background video (WordPress.com-hosted, not migrated to
// S3 - left as its own external URL rather than re-hosting it, same as any
// other real, working asset elsewhere in this network).
const HERO_VIDEO =
  "https://videos.files.wordpress.com/x8iGhQEB/y2mate.com-garnish-music-production-school-worldclass-programs-in-brooklyn-new-york-worldwide-online_360p.mp4";

// ny's real course-card grid ("Shorter Music Production Classes") - the
// same 12 real /courses/* pages ny's own nav already links to, each with
// its own real featuredImage (queried directly by slug, 2026-09-04 - see
// scripts/dump-ny-homepage-data.ts).
const COURSE_CARDS: { title: string; href: string; imageUrl: string }[] = [
  {
    title: "Ableton Live",
    href: "/courses/ableton",
    imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Ableton-Live-10-short-10.jpg",
  },
  {
    title: "Logic Pro",
    href: "/courses/logic-pro",
    imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Logic-Pro-Music-Production-Course-803.jpg",
  },
  {
    title: "Mixing/Mixdown",
    href: "/courses/mixing-mastering",
    imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Mixing-17.jpg",
  },
  {
    title: "Electronic Music DJ Class",
    href: "/courses/electronic-dj-course",
    imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Electronic-DJ-courses-10.jpg",
  },
  {
    title: "Dance Music DJ Class",
    href: "/courses/underground-dj-course",
    imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/underground-DJ-courses-10.jpg",
  },
  {
    title: "Hit Songwriting",
    href: "/courses/songwriting-course",
    imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Songwriting-Course-807.jpg",
  },
  {
    title: "Summer Camps",
    href: "/courses/summer-camp-school",
    imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/KSD_2017.06_Garnish_015-1.jpg",
  },
  {
    title: "Hip-Hop Production",
    href: "/courses/hip-hop-production-course",
    imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Hip-Hop-Production-Course-7.jpg",
  },
  {
    title: "Sampling, Sound Design & Synthesis in Ableton Live",
    href: "/courses/sound-design-synthesis-ableton",
    imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Ableton-Live-10-music-course.jpg",
  },
  {
    title: "Vocal Production",
    href: "/courses/vocal-production",
    imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Vocal-Production-cubed-9.jpg",
  },
  {
    title: "Rhythm Section Programming",
    href: "/courses/rhythm-section-programming",
    imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Rhythm-Section-Pro-cubed-9.jpg",
  },
  {
    title: "Singing Lessons & Vocal Coaching",
    href: "/courses/singing-lessons-vocal-coaching",
    imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Vocal-Coach.jpeg",
  },
];

// ny's own real "famous-testimonials" (site id 14, same category the
// network-wide homepage carousel widget already filters to elsewhere -
// see lib/modern-course-content.ts's own testimonialCategorySlugs
// handling) - transcribed verbatim, 2026-09-04.
const TESTIMONIALS: TestimonialItem[] = [
  { author: "Stefan Olsdal (Placebo)", text: "I wouldn't change anything about any of the courses I did." },
  {
    author: "Aluna (George) Francis",
    text:
      "I love learning in an intimate focused environment from dedicated teachers and Garnish had everything I needed to take me to the next phase. I loved each module and am already putting what I learnt into practice with my new live show and upcoming projects",
  },
  { author: "Jamie Jones", text: "I needed to brush up on something, so I called Garnish, as they have the best instructors." },
  {
    author: "Mark Jenkyns",
    text: "It was really useful to fully understand the principles after all this time. I highly recommend Garnish",
  },
  {
    author: "Mandi Perkins",
    text: "Taking this course was probably one of the best decisions I have made in my career thus far",
  },
  { author: "J-Dog (Hollywood Undead)", text: "I took the Garnish class and it opened up my eyes to the fundamentals of production." },
  { author: "Rui Da Silva", text: "I learnt so many things I did not know about before. I recommend Garnish for all levels" },
  { author: "Robert Owens", text: "My logic course was paced perfectly. I've never learnt so much in six weeks before." },
  {
    author: "Toby Tobias",
    text: "I can't believe how much better my mixes sound now I've done the mixing & mastering course",
  },
  {
    author: "Audiofly",
    text: "Your SDP course is awesome. Perfect for DJs who want to take that all-important leap to produce their own music",
  },
  {
    author: "Melvo Baptiste (Defected/Glitterbox)",
    text: "I did the course at Garnish after a friend recommended it. It was brilliant - the instructors are amazing.",
  },
];

export default function ModernNYHomePage({ site }: { site: any }) {
  const cityName = getCityName(site);
  const cityAbbr = getCityAbbr(site);
  const contactSlug = MODERN_SITE_ROUTES[site.slug]?.contactSlug;

  return (
    <div className="gmpm-root min-h-screen">
      <ModernHeader menu={site.mainMenu as MenuNode[] | null} cityAbbr={cityAbbr} siteSlug={site.slug} />

      <ModernHero
        // Same real photo edu's own homepage header uses (its own real
        // /why-us/ page's titleBackgroundImage, "whychooseus-10.png") -
        // user request (2026-09-04) - with the small "LAB" door sign near
        // the top erased, and the banner's real "us.garnishmusicproduction.com"
        // text changed to "edu." (own copy, so edu's own /why-us/ page
        // keeps the original, unedited photo).
        heroImageUrl="https://s3.us-east-2.amazonaws.com/garnishmusic-media/ny-homepage-hero-us-to-edu-v2.png"
        // ny's hero section is much taller than edu's own header (this
        // stats grid included) - object-cover on a full-height image
        // scales/crops it tighter than the same photo gets on edu's
        // shorter header, reading as "zoomed in". Capped to roughly
        // edu's own header height instead (see ModernHero's own comment).
        imageMaxHeightClassName="h-[420px] md:h-[600px]"
        cityName={cityName}
        stats={HERO_STATS}
        contactHref={contactSlug ? `/${contactSlug}` : undefined}
      />

      <section className="w-full">
        {/* Full brightness, no dimming gradient - matches how every other
            modern homepage's own real hero video plays (see
            ModernHomePage's identical treatment). */}
        <video src={HERO_VIDEO} autoPlay muted loop playsInline className="w-full h-auto block" />
      </section>

      <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 md:py-12 border-t border-[var(--gmpm-line)]">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div className="gmpm-corner border border-[var(--gmpm-line)] aspect-[4/5] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://s3.us-east-2.amazonaws.com/garnishmusic-media/Music-Production-Private-Tuition-Studio-1.jpg"
              alt="360° Music Production Academy"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="gmpm-display font-bold text-2xl md:text-3xl mb-6">360° Music Production Academy</h3>
            <p className="text-[var(--gmpm-text-dim)] leading-relaxed mb-6">
              Start producing the electronic music you love at a quality level in our intimate class setting. From
              diving into top music production software, to mastering and completing your own project. This
              boutique-style program in small class sizes serves as a comprehensive and hands-on experience. Gain
              invaluable tips and techniques from our superior roster of instructors, who are invested in your
              progress.
            </p>
            <Link href="/academy-program" className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)]">
              See More →
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-12">
        <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)]">Certified Music Producer Programs</div>
      </div>

      <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 md:py-12 border-t border-[var(--gmpm-line)]">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div className="gmpm-corner border border-[var(--gmpm-line)] aspect-[4/5] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://s3.us-east-2.amazonaws.com/garnishmusic-media/Ableton-Live-10-production-course-8.jpg"
              alt="Electronic Music Producer Program"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="gmpm-display font-bold text-2xl md:text-3xl mb-6">Electronic Music Producer Program</h3>
            <p className="text-[var(--gmpm-text-dim)] leading-relaxed mb-6">
              Our Electronic Music Producer Program is designed for the next generation of electronic music
              producers, who are ready to get serious with their beats using Ableton Live, and take them from zero
              to music producing hero in no fewer than 120 hours of top-notch training and mentoring in Ableton Live
              Suite, in a broad selection of schedules.
            </p>
            <Link href="/programs/ableton-producer-program" className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)]">
              See More →
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 md:py-12 border-t border-[var(--gmpm-line)]">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div className="gmpm-corner border border-[var(--gmpm-line)] aspect-[4/5] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://s3.us-east-2.amazonaws.com/garnishmusic-media/Logic-Producer-Program-10.png"
              alt="Live Music Producer Program"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="gmpm-display font-bold text-2xl md:text-3xl mb-6">Live Music Producer Program</h3>
            <p className="text-[var(--gmpm-text-dim)] leading-relaxed mb-6">
              Designed for the aspiring Live Music Producer to take them from fiddling around in Garage Band to
              producing professional sounding songs of popular genres of music in Logic Pro. The total course length
              is 120 hours, and is a combination of hands-on learning, and mentoring.
            </p>
            <Link href="/programs/logic-producer-program" className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)]">
              See More →
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24 border-t border-[var(--gmpm-line)]">
        <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-3">Classes</div>
        <h2 className="gmpm-display font-bold text-3xl md:text-5xl max-w-2xl mb-4">
          Shorter Music Production Classes.
        </h2>
        <p className="text-[var(--gmpm-text-dim)] max-w-2xl mb-12">
          Our featured music production, DJ &amp; audio engineering courses below.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {COURSE_CARDS.map((item, i) => (
            <a key={i} href={item.href} className="group block">
              <div className="gmpm-corner border border-[var(--gmpm-line)] aspect-[4/5] overflow-hidden mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="gmpm-display font-bold text-lg group-hover:text-[var(--gmpm-accent)] transition-colors">
                {item.title}
              </h3>
            </a>
          ))}
        </div>
      </section>

      <section className="max-w-[900px] mx-auto px-6 md:px-10 py-16 md:py-24 border-t border-[var(--gmpm-line)]">
        <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-3">Testimonials</div>
        <h2 className="gmpm-display font-bold text-3xl md:text-4xl max-w-2xl">Featured student stories.</h2>
        <ModernTestimonialCarousel items={TESTIMONIALS} />
      </section>

      <ModernPartners logos={PARTNER_LOGOS_RED} />

      <ModernFooter siteName={site.name} cityName={cityName} siteSlug={site.slug} />
    </div>
  );
}
