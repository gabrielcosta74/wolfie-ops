"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTeacher, promoteTeacher } from "./actions";
import { idleState, type TeacherActionState } from "./state";

type TeacherRow = {
  id: string;
  email: string;
  name: string;
  createdAt: string | null;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--surface-raised)",
  color: "var(--fg)",
  padding: "12px 14px",
  fontSize: "0.95rem",
};

const primaryButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 999,
  background: "var(--accent)",
  color: "#06131f",
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 999,
  background: "transparent",
  color: "var(--fg)",
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

function ActionFeedback({ state }: { state: TeacherActionState }) {
  if (state.status === "idle" || !state.message) return null;

  return (
    <div
      style={{
        marginTop: 12,
        borderRadius: 12,
        padding: "12px 14px",
        border:
          state.status === "error"
            ? "1px solid rgba(239, 68, 68, 0.35)"
            : "1px solid rgba(34, 197, 94, 0.35)",
        background:
          state.status === "error"
            ? "rgba(239, 68, 68, 0.12)"
            : "rgba(34, 197, 94, 0.12)",
        color: state.status === "error" ? "#fecaca" : "#bbf7d0",
      }}
    >
      {state.message}
    </div>
  );
}

export function TeacherAccessManager({ teachers }: { teachers: TeacherRow[] }) {
  const router = useRouter();
  const [createState, createAction] = useActionState(createTeacher, idleState);
  const [promoteState, promoteAction] = useActionState(promoteTeacher, idleState);

  useEffect(() => {
    if (createState.status === "success" || promoteState.status === "success") {
      router.refresh();
    }
  }, [createState.status, promoteState.status, router]);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
        <section className="panel pad">
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>Criar login de professor</h2>
          <p style={{ marginTop: 0, color: "var(--muted)", lineHeight: 1.6 }}>
            Cria uma conta autenticável imediatamente e atribui o role
            <code style={{ marginLeft: 6 }}>teacher</code>.
          </p>

          <form action={createAction} style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <label htmlFor="teacher-name" style={{ fontWeight: 600 }}>
                Nome
              </label>
              <input
                id="teacher-name"
                name="name"
                style={inputStyle}
                placeholder="Nome do professor"
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label htmlFor="teacher-email" style={{ fontWeight: 600 }}>
                Email
              </label>
              <input
                id="teacher-email"
                name="email"
                type="email"
                style={inputStyle}
                placeholder="professor@escola.pt"
                required
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label htmlFor="teacher-password" style={{ fontWeight: 600 }}>
                Password inicial
              </label>
              <input
                id="teacher-password"
                name="password"
                type="password"
                style={inputStyle}
                placeholder="Min. 8 caracteres"
                minLength={8}
                required
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <button type="submit" style={primaryButtonStyle}>
                Criar professor
              </button>
            </div>

            <ActionFeedback state={createState} />
          </form>
        </section>

        <section className="panel pad">
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>Promover conta existente</h2>
          <p style={{ marginTop: 0, color: "var(--muted)", lineHeight: 1.6 }}>
            Se a conta já existe no Auth, basta promover por email.
          </p>

          <form action={promoteAction} style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <label htmlFor="existing-email" style={{ fontWeight: 600 }}>
                Email da conta
              </label>
              <input
                id="existing-email"
                name="email"
                type="email"
                style={inputStyle}
                placeholder="conta.existente@escola.pt"
                required
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <button type="submit" style={secondaryButtonStyle}>
                Dar acesso teacher
              </button>
            </div>

            <ActionFeedback state={promoteState} />
          </form>
        </section>
      </div>

      <section className="panel pad">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Professores ativos</h2>
            <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
              Contas com <code>profiles.role = 'teacher'</code>.
            </p>
          </div>
          <div style={{ fontWeight: 700, fontSize: "1.6rem" }}>{teachers.length}</div>
        </div>

        {!teachers.length ? (
          <div className="empty-state" style={{ padding: 24 }}>
            <p>Ainda não existem professores configurados.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Criado em</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td>{teacher.name || "Sem nome"}</td>
                    <td>{teacher.email || "Sem email"}</td>
                    <td>
                      {teacher.createdAt
                        ? new Date(teacher.createdAt).toLocaleDateString("pt-PT")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
