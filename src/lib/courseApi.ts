import { supabase } from "@/integrations/supabase/client";
import type { Course, Module, Submodule, Lesson } from "@/types/course";

export const fetchAllCourses = async (): Promise<Course[]> => {
  const [coursesRes, modulesRes, submodulesRes, lessonsRes] = await Promise.all([
    supabase.from("courses").select("*").order("position").order("created_at"),
    supabase.from("modules").select("*").order("position").order("created_at"),
    supabase.from("submodules").select("*").order("position").order("created_at"),
    supabase.from("lessons").select("*").order("position").order("created_at"),
  ]);

  if (coursesRes.error) throw coursesRes.error;
  if (modulesRes.error) throw modulesRes.error;
  if (submodulesRes.error) throw submodulesRes.error;
  if (lessonsRes.error) throw lessonsRes.error;

  const lessonsBySub = new Map<string, Lesson[]>();
  for (const l of lessonsRes.data ?? []) {
    const arr = lessonsBySub.get(l.submodule_id) ?? [];
    arr.push(l as Lesson);
    lessonsBySub.set(l.submodule_id, arr);
  }

  const subsByModule = new Map<string, Submodule[]>();
  for (const s of submodulesRes.data ?? []) {
    const arr = subsByModule.get(s.module_id) ?? [];
    arr.push({ ...s, lessons: lessonsBySub.get(s.id) ?? [] });
    subsByModule.set(s.module_id, arr);
  }

  const modulesByCourse = new Map<string, Module[]>();
  for (const m of modulesRes.data ?? []) {
    const arr = modulesByCourse.get(m.course_id) ?? [];
    arr.push({ ...m, submodules: subsByModule.get(m.id) ?? [] });
    modulesByCourse.set(m.course_id, arr);
  }

  return (coursesRes.data ?? []).map((c) => ({
    ...c,
    modules: modulesByCourse.get(c.id) ?? [],
  }));
};

// ---- Courses ----
export const createCourse = async (name: string, position: number) => {
  const { error } = await supabase.from("courses").insert({ name, position });
  if (error) throw error;
};

export const deleteCourse = async (id: string) => {
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw error;
};

export const renameCourse = async (id: string, name: string) => {
  const { error } = await supabase.from("courses").update({ name }).eq("id", id);
  if (error) throw error;
};

// ---- Modules ----
export const createModule = async (
  course_id: string,
  name: string,
  position: number,
) => {
  const { data, error } = await supabase
    .from("modules")
    .insert({ course_id, name, position })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateModule = async (
  id: string,
  patch: Partial<Pick<Module, "name" | "caricato">>,
) => {
  const { error } = await supabase.from("modules").update(patch).eq("id", id);
  if (error) throw error;
};

export const deleteModule = async (id: string) => {
  const { error } = await supabase.from("modules").delete().eq("id", id);
  if (error) throw error;
};

// ---- Submodules ----
export const createSubmodule = async (
  module_id: string,
  name: string,
  position: number,
) => {
  const { data, error } = await supabase
    .from("submodules")
    .insert({ module_id, name, position })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateSubmodule = async (id: string, name: string) => {
  const { error } = await supabase.from("submodules").update({ name }).eq("id", id);
  if (error) throw error;
};

export const deleteSubmodule = async (id: string) => {
  const { error } = await supabase.from("submodules").delete().eq("id", id);
  if (error) throw error;
};

// ---- Lessons ----
export const createLesson = async (
  submodule_id: string,
  name: string,
  position: number,
) => {
  const { error } = await supabase
    .from("lessons")
    .insert({ submodule_id, name, position });
  if (error) throw error;
};

export const updateLesson = async (
  id: string,
  patch: Partial<Pick<Lesson, "name" | "fatto">>,
) => {
  const { error } = await supabase.from("lessons").update(patch).eq("id", id);
  if (error) throw error;
};

export const deleteLesson = async (id: string) => {
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) throw error;
};

// ---- Bulk paste ----
// Parses indented text (tabs or 2+ spaces) into a 3-level tree:
// level 0 = module, level 1 = submodule, level 2 = lesson.
// Lines with bullets/dashes are stripped.
export type ParsedTree = {
  name: string;
  children: { name: string; lessons: string[] }[];
}[];

export const parseBulkText = (text: string): ParsedTree => {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const result: ParsedTree = [];
  let currentMod: ParsedTree[number] | null = null;
  let currentSub: { name: string; lessons: string[] } | null = null;

  const cleanName = (s: string) =>
    s.replace(/^[\s•·\-\*\+◦▪►▸→]+/, "").trim();

  for (const raw of lines) {
    const match = raw.match(/^(\s*)/);
    const indent = match ? match[1].replace(/\t/g, "  ").length : 0;
    const name = cleanName(raw);
    if (!name) continue;

    if (indent < 2) {
      currentMod = { name, children: [] };
      result.push(currentMod);
      currentSub = null;
    } else if (indent < 4) {
      if (!currentMod) {
        currentMod = { name: "Modulo 1", children: [] };
        result.push(currentMod);
      }
      currentSub = { name, lessons: [] };
      currentMod.children.push(currentSub);
    } else {
      if (!currentMod) {
        currentMod = { name: "Modulo 1", children: [] };
        result.push(currentMod);
      }
      if (!currentSub) {
        currentSub = { name: "Sottomodulo 1", lessons: [] };
        currentMod.children.push(currentSub);
      }
      currentSub.lessons.push(name);
    }
  }
  return result;
};

export const insertParsedTree = async (
  course_id: string,
  tree: ParsedTree,
  startPosition: number,
) => {
  for (let i = 0; i < tree.length; i++) {
    const mod = tree[i];
    const insertedMod = await createModule(course_id, mod.name, startPosition + i);
    for (let j = 0; j < mod.children.length; j++) {
      const sub = mod.children[j];
      const insertedSub = await createSubmodule(insertedMod.id, sub.name, j);
      for (let k = 0; k < sub.lessons.length; k++) {
        await createLesson(insertedSub.id, sub.lessons[k], k);
      }
    }
  }
};
