// Motion behaviour: index-based stagger,
// in-view triggers and a pointer tilt. Skipped entirely for reduced motion.
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ENTER = ".hero__handle, .hero__title, .hero__roles, .hero__intro, .hero__cta, .hero__visual";
const LISTS = ".plans, .svc-grid, .problem-grid, .steps, .points, .about__facts, .facts, .journey, .faq__list";

function setIndex(nodes) {
  nodes.forEach((el, i) => el.style.setProperty("--i", String(i)));
}

function initEnter() {
  const nodes = [...document.querySelectorAll(ENTER)];
  setIndex(nodes);
  nodes.forEach((el) => el.classList.add("m-enter"));
}

function initStagger() {
  const lists = document.querySelectorAll(LISTS);
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -12% 0px" }
  );
  lists.forEach((list) => {
    setIndex([...list.children]);
    list.classList.add("m-stagger");
    observer.observe(list);
  });
}

function initTilt() {
  const card = document.querySelector(".hero__photo, .hero__visual picture, .hero__visual img");
  if (!card || !window.matchMedia("(pointer: fine)").matches) return;
  const MAX_DEG = 6;
  card.classList.add("m-tilt");
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.setProperty("--rx", `${x * MAX_DEG * 2}deg`);
    card.style.setProperty("--ry", `${-y * MAX_DEG * 2}deg`);
  });
  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  });
}

if (!reduce) {
  initEnter();
  if ("IntersectionObserver" in window) initStagger();
  initTilt();
}
