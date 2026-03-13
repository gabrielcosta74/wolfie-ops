export type TeacherActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const idleState: TeacherActionState = { status: "idle" };
