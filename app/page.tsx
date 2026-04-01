"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Star,
  Users,
  BookOpen,
  Award,
  Atom,
  Dna,
  FlaskConical,
  Microscope,
  Leaf,
  Orbit,
  GraduationCap,
  Play,
  Youtube,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { ScrollProgress } from "@/components/scroll-progress";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const HERO_STATS = [
  { kind: "subscribers" as const, value: "10K+", label: "مشترك على يوتيوب" },
  { kind: "youtube" as const, value: "300K+", label: "مشاهدة على يوتيوب" },
  { kind: "tiktok" as const, value: "20M+", label: "مشاهدة على تيك توك" },
  { kind: "courses" as const, value: "10+", label: "دورة تدريبية" },
  { kind: "videos" as const, value: "350+", label: "فيديو" },
];

function TikTokGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

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
        className="relative flex h-[100vh] max-h-[100vh] min-h-0 flex-col overflow-hidden bg-[#050505] text-white pt-20"
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

        <div className="relative z-10 container mx-auto flex min-h-0 flex-1 flex-col px-4 pb-2 pt-3 md:pb-3 md:pt-5">
          {/* RTL col1 = visual right: copy + CTAs. Col2 = image (row-span 2). Stats under copy only on md+; mobile: below image */}
          <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[auto_auto_auto] gap-4 md:grid-cols-2 md:grid-rows-[minmax(0,1fr)_auto] md:items-stretch md:gap-6 lg:gap-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
              className="row-start-1 flex min-h-0 flex-col items-center justify-center text-center md:col-start-1 md:row-start-1 md:max-w-xl md:items-start md:justify-center md:pr-1 md:text-right lg:max-w-xl"
            >
              <h1 className="mb-2 text-xl font-bold leading-tight tracking-tight text-white md:mb-3 md:text-3xl lg:text-4xl">
                مرحبًا، أنا <span className="text-sky-400">خالد خليفة</span>
              </h1>
              <div className="mx-auto mb-4 max-w-xl space-y-2 text-xs leading-relaxed text-white/85 md:mx-0 md:text-sm">
                <p>
                  بكالوريوس التكنولوجيا الحيوية والهندسة الوراثية — كلية الزراعة، جامعة عين شمس{" "}
                  <span className="whitespace-nowrap">(2023)</span>. أتخصص في الأحياء الجزيئية والدقيقة، بخبرة مخبرية
                  أكاديمية وصناعية.
                </p>
                <p>
                  تطبيقات ميدانية وتدريب في ‎PCR والتشخيص (REME-D)، بحث وتطوير وتعليم مخبري (CEB)، وزراعة أنسجة. محتوى عربي
                  على يوتيوب (+10 دورات، +300 ألف مشاهدة، +10 آلاف مشترك). معتمد{" "}
                  <span className="font-medium text-white">TOT</span>.
                </p>
              </div>
              <p className="mb-3 w-full max-w-xl text-xs font-medium tracking-wide text-sky-300/95 md:text-sm">
                إعداد / خالد ج. خليفة
              </p>
              <div className="flex w-full max-w-xl flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-start md:items-start">
                <Button
                  size="lg"
                  asChild
                  className="w-full rounded-full border-0 bg-brand px-6 text-white shadow-[0_0_28px_-6px_rgba(56,189,248,0.55)] hover:bg-brand/90 sm:w-auto"
                >
                  <Link href="/sign-up">
                    ابدأ الآن <ArrowRight className="mr-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full rounded-full border-sky-400/40 bg-transparent px-6 text-white hover:bg-sky-500/10 hover:text-white sm:w-auto"
                  onClick={scrollToCourses}
                  type="button"
                >
                  استكشف الكورسات
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08 }}
              className="row-start-2 flex min-h-0 w-full items-end justify-center md:col-start-2 md:row-span-2 md:row-start-1 md:justify-start"
            >
              <Image
                src="/teacher-image.png"
                alt="خالد ج. خليفة"
                width={720}
                height={900}
                priority
                className="h-auto w-auto max-h-[min(42vh,400px)] max-w-[min(100vw-2rem,420px)] object-contain object-bottom md:max-h-[min(72vh,760px)] md:max-w-[min(48vw,640px)]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="row-start-3 w-full max-w-xl md:col-start-1 md:row-start-2 md:justify-self-start"
            >
              <div className="rounded-2xl border border-sky-400/25 bg-zinc-950/85 px-2 py-2.5 shadow-[0_0_28px_-8px_rgba(56,189,248,0.35)] backdrop-blur-md md:rounded-[1.75rem] md:px-4 md:py-3">
                <div className="grid grid-cols-2 gap-2 gap-y-3 sm:grid-cols-3 md:grid-cols-5 md:gap-1.5">
                  {HERO_STATS.map((item) => (
                    <div key={item.kind} className="flex flex-col items-center text-center">
                      <div className="mb-0.5 flex h-7 w-7 items-center justify-center text-sky-400 md:h-8 md:w-8">
                        {item.kind === "subscribers" && <Users className="h-4 w-4 md:h-[1.05rem] md:w-[1.05rem]" strokeWidth={1.5} />}
                        {item.kind === "youtube" && <Youtube className="h-4 w-4 md:h-[1.05rem] md:w-[1.05rem]" strokeWidth={1.35} />}
                        {item.kind === "tiktok" && <TikTokGlyph className="h-4 w-4 md:h-[1.05rem] md:w-[1.05rem]" />}
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
            <h2 className="text-3xl font-bold mb-4">الكورسات المتاحة</h2>
            <p className="text-muted-foreground">اكتشف مجموعة متنوعة من الكورسات التعليمية المميزة</p>
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
                    <h3 className="text-lg font-semibold mb-2">لا توجد كورسات متاحة حالياً</h3>
                    <p className="text-muted-foreground mb-4">
                      سيتم إضافة الكورسات قريباً. تحقق من هذه الصفحة لاحقاً للاطلاع على أحدث الكورسات التعليمية.
                    </p>
                    <Button 
                      variant="outline" 
                      asChild
                      className="bg-brand hover:bg-brand/90 text-white border-brand"
                    >
                      <Link href="/sign-up">
                        سجل الآن للوصول المبكر
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
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <BookOpen className="h-4 w-4" />
                        <span>
                          {course.chapters?.length || 0} {course.chapters?.length === 1 ? "درس" : "دروس"}
                          {course.quizzes && course.quizzes.length > 0 && (
                            <span className="mr-2">، {course.quizzes.length} {course.quizzes.length === 1 ? "اختبار" : "اختبارات"}</span>
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
                        {course.progress === 100 ? "عرض الكورس" : "عرض الكورس"}
                      </Button>
                    </div>
                  </motion.div>
                ))
              )
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">آراء الطلاب</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              آراء من يتابعون منصة IVDex ودورات التكنولوجيا الحيوية بالعربية مع أ. خالد خليفة
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "نورا خالد",
                grade: "طالبة قسم أحياء — كلية العلوم",
                testimonial:
                  "شرح PCR والاستخلاص والمفاهيم المخبرية كان واضحًا جدًا بالعربي. IVDex وفرت عليّ البحث في مصادر متفرقة؛ المحتوى عملي وقريب من الواقع المخبري.",
              },
              {
                name: "يوسف إبراهيم",
                grade: "خريج تكنولوجيا حيوية — يستعد لسوق العمل",
                testimonial:
                  "الدورات تغطي أساسيات علم الأحياء الجزيئي والأحياء الدقيقة بطريقة مرتبة. بعد ما تابعت القناة والمنصة، حسّنت فهمي لسير العمل في المختبر التشخيصي.",
              },
              {
                name: "سارة محمود",
                grade: "باحثة مبتدئة — مختبر أبحاث",
                testimonial:
                  "أهم ما في المنصة إن اللغة عربية والتطبيقات من تجربة حقيقية في المختبر. التدريبات والشرح يساعدون أي حد يشتغل أو يدرس في مجال الأحياء الدقيقة يثبت المعلومة.",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card rounded-lg p-6 shadow-lg"
              >
                <div className="flex items-center mb-4">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden">
                    <Image
                      src="/male.png"
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="mr-4">
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.grade}</p>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  &ldquo;{testimonial.testimonial}&rdquo;
                </p>
                <div className="flex mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
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
            <h2 className="text-3xl font-bold mb-4">مميزات المنصة</h2>
            <p className="text-muted-foreground">اكتشف ما يجعل منصتنا مميزة</p>
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
                <Star className="h-6 w-6 text-brand" />
              </div>
              <h3 className="text-xl font-semibold mb-2">جودة عالية</h3>
              <p className="text-muted-foreground">أفضل منصة متخصصة للكورسات</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-brand" />
              </div>
              <h3 className="text-xl font-semibold mb-2">مجتمع نشط</h3>
              <p className="text-muted-foreground">انضم إلى مجتمع من الطلاب النشطين والمتفوقين والأوائل</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-6 w-6 text-brand" />
              </div>
              <h3 className="text-xl font-semibold mb-2">شهادات تقدير</h3>
              <p className="text-muted-foreground">احصل على شهادات تقدير عند إكمال الكورسات</p>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">ابدأ رحلة التعلم معنا</h2>
            <p className="text-muted-foreground mb-8">
              انضم إلينا اليوم وابدأ رحلة النجاح
            </p>
            <Button size="lg" asChild className="bg-brand hover:bg-brand/90 text-white">
              <Link href="/sign-up">
                سجل الآن <ArrowRight className="mr-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      </div>
  );
} 