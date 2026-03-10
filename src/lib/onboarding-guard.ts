import type { Project } from "@/lib/projects";
import { isProjectOnboardingComplete } from "@/lib/projects";

export function assertProjectOnboardingComplete(project: Project) {
  if (!isProjectOnboardingComplete(project)) {
    throw new Error("onboarding_incomplete");
  }
}
