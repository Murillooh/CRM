"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Fraunces, Manrope } from "next/font/google";
import styles from "./login.module.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

function BrandMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 17V7l8 6 8-6v10" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<"login" | "register" | null>(null);
  const [note, setNote] = useState<{ text: string; isError: boolean } | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setNote(null);
    setLoading("login");
    const { data, error } = await authClient.signIn.email({ email, password });
    if (data) {
      router.push("/app");
    } else {
      setNote({ text: error?.message || "Erro ao fazer login", isError: true });
    }
    setLoading(null);
  };

  const handleRegister = async () => {
    setNote(null);
    setLoading("register");
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name: email.split("@")[0],
    });
    if (data) {
      router.push("/app");
    } else {
      setNote({ text: error?.message || "Erro ao registrar", isError: true });
    }
    setLoading(null);
  };

  const isLoading = loading !== null;

  return (
    <div className={`${styles.page} ${fraunces.variable} ${manrope.variable}`}>
      <div className={styles.grain} />

      <div className={styles.screen}>
        {/* ================= LEFT PANEL ================= */}
        <section className={styles.side} aria-hidden="true">
          <span className={styles.sideBg} />
          <span className={styles.sideGrid} />

          <div className={styles.sideContent}>
            <div className={styles.wordmark}>
              <span className={styles.mark}>
                <BrandMark />
              </span>
              <span className={styles.name}>
                Nova<em>Lead</em>
              </span>
            </div>

            <div className={styles.scene}>
              <div className={`${styles.glassCard} ${styles.cardDeal}`}>
                <div className={styles.cardTop}>
                  <span className={styles.avatar}>CA</span>
                  <div className={styles.cardId}>
                    <strong>Construtora Aurora</strong>
                    <span className={styles.tag}>Proposta enviada</span>
                  </div>
                </div>
                <div className={styles.cardBottom}>
                  <span className={styles.value}>R$ 52.400</span>
                  <div className={styles.bar}>
                    <i />
                  </div>
                </div>
              </div>

              <div className={`${styles.glassCard} ${styles.cardTask}`}>
                <span className={styles.chk}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <div className={styles.cardId}>
                  <strong>Ligar para Marina Duarte</strong>
                  <span className={styles.mutedSm}>Vence hoje · 15:00</span>
                </div>
              </div>

              <div className={`${styles.glassCard} ${styles.cardStat}`}>
                <span className={styles.statIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </span>
                <span className={styles.mutedSm}>
                  <strong className={styles.accentGold}>+18%</strong> de fechamentos este mês
                </span>
              </div>
            </div>

            <div className={styles.pitch}>
              <h1>
                Organize seus clientes com <em>facilidade</em>.
              </h1>
              <p>Acompanhe negociações, tarefas e resultados em um só lugar — sem planilhas, sem bagunça.</p>
            </div>
          </div>
        </section>

        {/* ================= RIGHT PANEL ================= */}
        <section className={styles.main}>
          <div className={styles.mainInner}>
            <div className={styles.mobileWordmark}>
              <span className={styles.mark}>
                <BrandMark />
              </span>
              <span className={styles.name}>
                Nova<em>Lead</em>
              </span>
            </div>

            <div className={styles.head}>
              <h2>Bem-vindo de volta</h2>
              <p>Entre com sua conta para continuar gerenciando seus clientes.</p>
            </div>

            <form onSubmit={handleLogin} noValidate>
              <div className={styles.field}>
                <label htmlFor="email">E-mail</label>
                <div className={styles.control}>
                  <svg className={styles.li} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seuemail@empresa.com"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="password">Senha</label>
                <div className={styles.control}>
                  <svg className={styles.li} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className={styles.toggleVisibility}
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className={styles.fieldMeta}>
                <button
                  type="button"
                  className={styles.linkMuted}
                  onClick={() => setNote({ text: "Recuperação de senha ainda não disponível. Fale com o suporte.", isError: false })}
                >
                  Esqueceu a senha?
                </button>
              </div>

              <button type="submit" className={styles.btnPrimary} disabled={isLoading}>
                {loading === "login" && <span className={styles.spinner} />}
                <span>{loading === "login" ? "Entrando..." : "Entrar"}</span>
              </button>

              <p className={`${styles.formNote} ${note ? styles.show : ""} ${note?.isError ? styles.isError : ""}`} role="status" aria-live="polite">
                {note?.text}
              </p>
            </form>

            <p className={styles.altAction}>
              Ainda não tem conta?{" "}
              <button type="button" onClick={handleRegister} disabled={isLoading}>
                {loading === "register" ? "Criando..." : "Criar conta gratuita"}
              </button>
            </p>
            <p className={styles.fineprint}>
              Protegido por autenticação segura · <a href="#">Termos</a> e <a href="#">Privacidade</a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
