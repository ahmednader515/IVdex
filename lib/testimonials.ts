/** Real learner feedback — copy sourced from screenshots in /public/comments. */

export type Testimonial = {
  name: string;
  role?: string;
  quote: string;
  /** Exact filename under public/comments */
  imageFile: string;
  /** Optional CSS object-position (e.g. center 40%) to crop tall screenshots */
  imageObjectPosition?: string;
};

export const COMMENT_IMAGES_FOLDER = "/comments";

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Manar Mostafa",
    quote:
      "I've learned so much from you—both practically and personally. May God bless you, Khaled. We will truly miss you.",
    imageFile: "WhatsApp Image 2026-04-02 at 8.49.26 AM.jpeg",
  },
  {
    name: "Salma Zaki",
    quote:
      "You're one of the best instructors. We gained a lot from the course and never felt the material was too heavy—you made everything clear and approachable.",
    imageFile: "WhatsApp Image 2026-04-02 at 8.49.26 AM (1).jpeg",
  },
  {
    name: "Nourhan Adel",
    quote: "One of the most skilled instructors I've learned from throughout the training. Wishing you continued success.",
    imageFile: "WhatsApp Image 2026-04-02 at 8.49.26 AM (2).jpeg",
  },
  {
    name: "Jana A. Masoud",
    quote:
      "God bless you, Dr. Khaled—we benefited greatly from you. May you be rewarded, and we hope to learn with you again.",
    imageFile: "WhatsApp Image 2026-04-02 at 8.49.27 AM.jpeg",
  },
  {
    name: "Roqaya Bahaa",
    quote:
      "Thank you, Dr. Khaled, for your effort and encouragement. You are truly our biggest supporter.",
    imageFile: "WhatsApp Image 2026-04-02 at 8.49.27 AM (1).jpeg",
  },
  {
    name: "Yasmin Ahmed",
    quote:
      "We're the lucky ones to learn from a brother and teacher like you, Dr. Khaled. May God reward you. I'm deeply grateful—thank you.",
    imageFile: "WhatsApp Image 2026-04-02 at 8.49.27 AM (2).jpeg",
  },
  {
    name: "Ereeny Gabballa",
    quote:
      "You exemplify respect, clarity, and scientific teaching. You worked incredibly hard so we understood every step in every session.",
    imageFile: "WhatsApp Image 2026-04-02 at 8.49.27 AM (2).jpeg",
  },
  {
    name: "Learner from Iraq",
    role: "YouTube",
    quote: "From Iraq—thank you so much for your amazing effort.",
    imageFile: "WhatsApp Image 2026-04-02 at 8.49.28 AM.jpeg",
  },
  {
    name: "Noor",
    role: "YouTube",
    quote:
      "Creative teaching in the truest sense. I finally understood this experiment through your explanation. May God bless you and make your knowledge a benefit to others.",
    imageFile: "WhatsApp Image 2026-04-02 at 8.49.28 AM (1).jpeg",
  },
  {
    name: "Mohammed Osama",
    role: "Pharmacy student",
    quote:
      "I'm a pharmacy student and I benefited a lot from this course. I hope you can suggest other courses that would help me in my field—thank you.",
    imageFile: "WhatsApp Image 2026-04-02 at 8.49.29 AM.jpeg",
  },
  {
    name: "Zorki",
    role: "YouTube",
    quote:
      "Your explanation is outstanding. I have an exam tomorrow and had been avoiding this experiment—you made it simple. Keep going; may God reward you.",
    imageFile: "WhatsApp Image 2026-04-02 at 8.49.29 AM (1).jpeg",
  },
  {
    name: "Hanan Hisham",
    role: "YouTube",
    quote:
      "I felt lost and couldn't find useful material on other platforms in this field. Thank you for the clear structure and organization.",
    imageFile: "WhatsApp Image 2026-04-02 at 8.49.29 AM (2).jpeg",
  },
  {
    name: "Zhour",
    role: "YouTube",
    quote:
      "Wonderful, smooth explanations and delivery. Many concepts finally clicked—even things I had misunderstood completely—from the very first video. After this course I'm confident in choosing this path.",
    imageFile: "WhatsApp Image 2026-04-02 at 8.49.30 AM.jpeg",
    // Crop status bar / header; anchor lower so the comment is centered in the frame
    imageObjectPosition: "center 12%",
  },
];

export function testimonialImageSrc(imageFile: string): string {
  return `${COMMENT_IMAGES_FOLDER}/${encodeURIComponent(imageFile)}`;
}
