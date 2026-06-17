import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { ErrorBox } from "../components/Card";
import { Input } from "../components/Field";
import { Logo } from "../components/Logo";
import { Mascot } from "../components/Mascot";

const PASSWORD_DEMO = "papaws123";

const usuariosDemo = [
  { email: "admin@papaws.com", etiqueta: "Administrador" },
  { email: "consultas@papaws.com", etiqueta: "Enc. de consultas" },
  { email: "rescatistas@papaws.com", etiqueta: "Enc. de rescatistas" },
];

export function Login() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ email, password });
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message ?? "No se pudo iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-moss-700 via-moss-700 to-moss-800 p-5 paw-confetti">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-card border border-moss-100 overflow-hidden">
        <div className="px-8 pt-8 pb-6 text-center relative">
          <div className="flex justify-center mb-2">
            <Logo size={44} />
          </div>
          <p className="font-display text-3xl text-moss-800 leading-none">
            Papaws
          </p>
          <p className="font-hand text-xl text-clay-500 mt-1">
            refugio &amp; cuidado
          </p>
          <div className="flex justify-center -mb-2 mt-2">
            <Mascot size={96} />
          </div>
        </div>

        <div className="px-8 pb-8">
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Correo"
              type="email"
              required
              placeholder="tu@papaws.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Contraseña"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <ErrorBox message={error} />}

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
              icon={<LogIn size={16} />}
            >
              {submitting ? "Entrando…" : "Iniciar sesión"}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-moss-100">
            <p className="text-[11px] uppercase tracking-wider font-bold text-moss-700 mb-2 text-center">
              Acceso rápido (demo)
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {usuariosDemo.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => {
                    setEmail(u.email);
                    setPassword(PASSWORD_DEMO);
                  }}
                  className="text-xs font-semibold text-moss-700 bg-moss-50 hover:bg-moss-100 rounded-full px-3 py-1.5 transition-colors"
                >
                  {u.etiqueta}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-ink-400 text-center mt-2 font-mono">
              contraseña: {PASSWORD_DEMO}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
