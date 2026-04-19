export type Lesson = {
  id: string;
  submodule_id: string;
  name: string;
  position: number;
  fatto: boolean;
};

export type Submodule = {
  id: string;
  module_id: string;
  name: string;
  position: number;
  lessons: Lesson[];
};

export type Module = {
  id: string;
  course_id: string;
  name: string;
  position: number;
  caricato: boolean;
  submodules: Submodule[];
};

export type Course = {
  id: string;
  name: string;
  position: number;
  modules: Module[];
};

export type CourseStats = {
  totalLessons: number;
  doneLessons: number;
  loadedLessons: number; // lessons in modules marked caricato
};

export const computeStats = (course: Course): CourseStats => {
  let totalLessons = 0;
  let doneLessons = 0;
  let loadedLessons = 0;
  for (const m of course.modules) {
    for (const s of m.submodules) {
      for (const l of s.lessons) {
        totalLessons++;
        if (l.fatto) doneLessons++;
        if (m.caricato) loadedLessons++;
      }
    }
  }
  return { totalLessons, doneLessons, loadedLessons };
};

export const moduleStats = (m: Module) => {
  let total = 0;
  let done = 0;
  for (const s of m.submodules) {
    for (const l of s.lessons) {
      total++;
      if (l.fatto) done++;
    }
  }
  return { total, done };
};

export const submoduleStats = (s: Submodule) => {
  const total = s.lessons.length;
  const done = s.lessons.filter((l) => l.fatto).length;
  return { total, done };
};
