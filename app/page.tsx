"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Star,
  Users,
  BookOpen,
  Atom,
  Dna,
  FlaskConical,
  Microscope,
  Leaf,
  Orbit,
  GraduationCap,
  Play,
  Youtube,
  BadgeCheck,
  Layers,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { ScrollProgress } from "@/components/scroll-progress";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TESTIMONIALS, testimonialImageSrc } from "@/lib/testimonials";

const HERO_STATS = [
  { kind: "subscribers" as const, value: "10K+", label: "YouTube subscribers" },
  { kind: "youtube" as const, value: "300K+", label: "YouTube views" },
  { kind: "courses" as const, value: "10+", label: "Training courses" },
  { kind: "videos" as const, value: "350+", label: "Videos" },
];

// Define types based on Prisma schema
type Course = {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type Purchase = {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type CourseWithProgress = Course & {
  chapters: { id: string }[];
  quizzes: { id: string }[];
  purchases: Purchase[];
  progress: number;
};

export default function HomePage() {
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        // Fetch courses from public API endpoint
        const response = await fetch("/api/courses/public");
        
        if (!response.ok) {
          console.error("Failed to fetch courses:", response.status, response.statusText);
          return;
        }
        
        const data = await response.json();
        console.log("Fetched courses:", data); // Debug log
        setCourses(data);

      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const scrollToCourses = () => {
    const coursesSection = document.getElementById('courses-section');
    if (coursesSection) {
      const offset = coursesSection.offsetTop - 80; // Adjust for navbar height
      window.scrollTo({
        top: offset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="h-full w-full bg-background">
        <Navbar />
        <ScrollProgress />
      {/* Hero — dark backdrop, cyan motif layer; capped at viewport height */}
      <section
        id="hero-section"
        className="relative flex min-h-[100svh] flex-col bg-[#050505] pt-20 text-white max-md:overflow-x-hidden max-md:overflow-y-auto md:h-[100vh] md:max-h-[100vh] md:min-h-0 md:overflow-hidden"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(56,189,248,0.12),transparent)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 overflow-hidden text-sky-400/[0.14]" aria-hidden>
          <Atom className="absolute top-[10%] right-[6%] h-14 w-14 md:h-20 md:w-20" strokeWidth={1.15} />
          <Orbit className="absolute top-[22%] left-[10%] h-12 w-12 md:h-16 md:w-16" strokeWidth={1.15} />
          <Dna className="absolute bottom-[38%] right-[12%] h-16 w-16 md:h-24 md:w-24" strokeWidth={1.1} />
          <FlaskConical className="absolute top-[40%] right-[22%] h-10 w-10 md:h-14 md:w-14" strokeWidth={1.15} />
          <Microscope className="absolute bottom-[28%] left-[8%] h-12 w-12 md:h-[3.25rem] md:w-[3.25rem]" strokeWidth={1.1} />
          <Leaf className="absolute top-[55%] left-[18%] h-11 w-11 md:h-16 md:w-16" strokeWidth={1.1} />
          <Atom className="absolute bottom-[12%] right-[30%] h-10 w-10 opacity-70" strokeWidth={1} />
        </div>

        <div className="relative z-10 container mx-auto flex w-full max-w-full flex-col px-4 pb-6 pt-3 md:min-h-0 md:flex-1 md:px-6 md:pb-3 md:pt-5 lg:px-8">
          {/*
            Mobile: single-column flow in DOM order — image → copy → stats (no overlapping rows).
            md+: 2-col grid; col1 = text+stats, col2 = image spanning both rows.
          */}
          <div className="grid w-full grid-cols-1 gap-4 max-md:content-start md:min-h-0 md:flex-1 md:grid-cols-2 md:grid-rows-[minmax(0,1fr)_auto] md:items-stretch md:gap-6 lg:gap-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.06 }}
              className="relative z-10 flex w-full shrink-0 justify-center pt-1 md:col-start-2 md:row-span-2 md:row-start-1 md:h-full md:items-end md:justify-start md:pt-0"
            >
              <Image
                src="/teacher-image.png"
                alt="Khaled G. Khalifa"
                width={720}
                height={900}
                priority
                sizes="(max-width: 768px) 100vw, 48vw"
                className="h-auto w-auto max-h-[min(38vh,360px)] max-w-[min(100vw-2rem,400px)] object-contain object-bottom md:max-h-[min(72vh,760px)] md:max-w-[min(48vw,640px)]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
              className="relative z-10 flex min-h-0 w-full shrink-0 flex-col items-center justify-start text-center max-md:pb-1 md:col-start-1 md:row-start-1 md:max-w-xl md:items-start md:justify-center md:pl-1 md:pr-10 md:text-left lg:max-w-xl lg:pr-14 xl:pr-16"
            >
              <h1 className="mb-2 text-xl font-bold leading-tight tracking-tight text-white md:mb-3 md:text-3xl lg:text-4xl">
                Hello, I&apos;m <span className="text-sky-400">Khaled Khalifa</span>
              </h1>
              <div className="mx-auto mb-4 max-w-xl space-y-2 text-xs leading-relaxed text-white/85 md:mx-0 md:text-sm">
                <p>Bachelor&apos;s degree in Biotechnology and Genetic Engineering</p>
                <p>
                  Specialized in Molecular Biology and Microbiology with strong academic and industrial laboratory
                  experience.
                </p>
                <p>
                  Performed 1000+ PCR analyses with hands-on expertise in molecular diagnostics workflows.
                </p>
                <p>Experience in Research &amp; Development, Technical Support, and laboratory teaching.</p>
                <p>
                  Passionate about simplifying complex scientific concepts and delivering practical, real-world knowledge
                  in molecular biology and biotechnology.
                </p>
                <p className="font-semibold text-white">TOT Certificated</p>
              </div>
              <p className="mb-3 w-full max-w-xl text-xs font-medium tracking-wide text-sky-300/95 md:text-sm">
                By Khaled G. Khalifa
              </p>
              <div className="flex w-full max-w-xl flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-start md:items-start">
                <Button
                  size="lg"
                  asChild
                  className="w-full rounded-full border-0 bg-brand px-6 text-white shadow-[0_0_28px_-6px_rgba(56,189,248,0.55)] hover:bg-brand/90 sm:w-auto"
                >
                  <Link href="/sign-up">
                    Start now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full rounded-full border-sky-400/40 bg-transparent px-6 text-white hover:bg-sky-500/10 hover:text-white sm:w-auto"
                  onClick={scrollToCourses}
                  type="button"
                >
                  Explore courses
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="relative z-10 w-full max-w-xl shrink-0 justify-self-center max-md:mt-1 md:col-start-1 md:row-start-2 md:justify-self-start md:pr-10 lg:pr-14 xl:pr-16"
            >
              <div className="rounded-2xl border border-sky-400/25 bg-zinc-950/85 px-2 py-2.5 shadow-[0_0_28px_-8px_rgba(56,189,248,0.35)] backdrop-blur-md md:rounded-[1.75rem] md:px-4 md:py-3">
                <div className="grid grid-cols-2 gap-2 gap-y-3 sm:grid-cols-2 md:grid-cols-4 md:gap-1.5">
                  {HERO_STATS.map((item) => (
                    <div key={item.kind} className="flex flex-col items-center text-center">
                      <div className="mb-0.5 flex h-7 w-7 items-center justify-center text-sky-400 md:h-8 md:w-8">
                        {item.kind === "subscribers" && <Users className="h-4 w-4 md:h-[1.05rem] md:w-[1.05rem]" strokeWidth={1.5} />}
                        {item.kind === "youtube" && <Youtube className="h-4 w-4 md:h-[1.05rem] md:w-[1.05rem]" strokeWidth={1.35} />}
                        {item.kind === "courses" && (
                          <GraduationCap className="h-4 w-4 md:h-[1.05rem] md:w-[1.05rem]" strokeWidth={1.35} />
                        )}
                        {item.kind === "videos" && <Play className="h-4 w-4 md:h-[1.05rem] md:w-[1.05rem]" strokeWidth={1.5} />}
                      </div>
                      <p className="text-sm font-bold tabular-nums text-white md:text-base">{item.value}</p>
                      <p className="mt-0.5 max-w-[10rem] text-[10px] leading-tight text-white/75 md:max-w-[11rem] md:text-[11px]">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses-section" className="py-20 bg-muted/50">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 italic">Explore Molecular Biology &amp; Biotechnology Courses</h2>
            <p className="text-muted-foreground">
              Practical, career-focused training designed for real lab applications.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6"
          >
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="w-full sm:w-80 md:w-72 lg:w-80 bg-card rounded-xl overflow-hidden border shadow-sm animate-pulse"
                >
                  <div className="w-full aspect-video bg-muted" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="space-y-1.5">
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-5/6" />
                    </div>
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : (
              courses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No courses available yet</h3>
                    <p className="text-muted-foreground mb-4">
                      New courses are coming soon. Check back for hands-on molecular biology and biotechnology training.
                    </p>
                    <Button 
                      variant="outline" 
                      asChild
                      className="bg-brand hover:bg-brand/90 text-white border-brand"
                    >
                      <Link href="/sign-up">
                        Sign up for early access
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                courses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group w-full sm:w-80 md:w-72 lg:w-80 bg-card rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="relative w-full aspect-video">
                      <Image
                        src={course.imageUrl || "/placeholder.png"}
                        alt={course.title}
                        fill
                        className="object-cover rounded-t-xl"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                        {course.title}
                      </h3>
                      {course.description?.trim() ? (
                        <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                          {course.description.trim()}
                        </p>
                      ) : null}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <BookOpen className="h-4 w-4" />
                        <span>
                          {course.chapters?.length || 0}{" "}
                          {course.chapters?.length === 1 ? "lesson" : "lessons"}
                          {course.quizzes && course.quizzes.length > 0 && (
                            <span className="ml-2">
                              · {course.quizzes.length} {course.quizzes.length === 1 ? "quiz" : "quizzes"}
                            </span>
                          )}
                        </span>
                      </div>
                      <Button 
                        className="w-full bg-brand hover:bg-brand/90 text-white" 
                        variant="default"
                        onClick={() => {
                          if (!session?.user) {
                            router.push("/sign-in");
                            return;
                          }
                          const courseUrl = course.chapters && course.chapters.length > 0 
                            ? `/courses/${course.id}/chapters/${course.chapters[0].id}` 
                            : `/courses/${course.id}`;
                          router.push(courseUrl);
                        }}
                      >
                        View course
                      </Button>
                    </div>
                  </motion.div>
                ))
              )
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Testimonials — real comments from /public/comments (English summaries) */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Learner testimonials</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real feedback from students and viewers. Each card links the English summary to the original screenshot you
              shared.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, index) => (
              <motion.div
                key={`${t.name}-${t.imageFile}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4) }}
                viewport={{ once: true }}
                className="bg-card rounded-xl overflow-hidden border shadow-lg flex flex-col"
              >
                <div className="relative h-44 w-full bg-muted shrink-0">
                  <Image
                    src={testimonialImageSrc(t.imageFile)}
                    alt={`Original comment screenshot — ${t.name}`}
                    fill
                    className="object-cover"
                    style={{
                      objectPosition: t.imageObjectPosition ?? "center top",
                    }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    unoptimized
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h4 className="font-semibold text-lg">{t.name}</h4>
                  {t.role ? <p className="text-sm text-muted-foreground mb-2">{t.role}</p> : null}
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex mt-4 pt-3 border-t border-border/60">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 italic">Why This Platform Stands Out</h2>
            <p className="text-muted-foreground">Built for real-world molecular biology skills, not just theory.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BadgeCheck className="h-6 w-6 text-brand" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Free Certificate</h3>
              <p className="text-muted-foreground">
                Earn a verified certificate at no cost after successfully passing course assessments.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Microscope className="h-6 w-6 text-brand" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real Lab Experience</h3>
              <p className="text-muted-foreground">
                Learn protocols, troubleshooting, and workflows used in actual molecular labs.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers className="h-6 w-6 text-brand" />
              </div>
              <h3 className="text-xl font-semibold mb-2">From Basics to Advanced</h3>
              <p className="text-muted-foreground">
                Structured learning path covering fundamentals to professional-level applications.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 italic">
              Start Building Your Molecular Biology Expertise
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join now and gain the skills you need for real laboratory work and diagnostics.
            </p>
            <Button size="lg" asChild className="bg-brand hover:bg-brand/90 text-white">
              <Link href="/sign-up">
                Sign up <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      </div>
  );
} 