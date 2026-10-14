import { useState } from "react";
import "./Login.css";

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrar, setLembrar] = useState(false);
  const [erro, setErro] = useState("");

  function entrar(event) {
    event.preventDefault();

    // Credenciais de demonstração: não usar como proteção real em produção.
    const usuarioValido = "admin";
    const senhaValida = "smart123";

    if (
      usuario.trim().toLowerCase() === usuarioValido &&
      senha === senhaValida
    ) {
      setErro("");
      onLogin({ usuario: "admin", lembrar });
    } else {
      setErro("Usuário ou senha incorretos.");
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-form-side">
          <div className="login-brand">
            <span className="login-logo">🐓</span>
            <span>SMART CHICKEN</span>
          </div>

          <p className="login-tagline">Mais tecnologia. Mais produtividade.</p>

          <h1>Bem-vindo de volta!</h1>
          <p className="login-subtitle">Acesse de forma rápida e segura</p>

          <form onSubmit={entrar}>
            <label htmlFor="usuario">Usuário</label>
            <input
              id="usuario"
              type="text"
              placeholder="admin"
              value={usuario}
              onChange={(event) => setUsuario(event.target.value)}
              autoComplete="username"
              required
            />

            <label htmlFor="senha">Senha</label>
            <div className="login-password">
              <input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                placeholder="Digite sua senha"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-toggle-password"
                onClick={() => setMostrarSenha((visivel) => !visivel)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            <div className="login-options">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={lembrar}
                  onChange={(event) => setLembrar(event.target.checked)}
                />
                Lembrar de mim
              </label>
              <span className="login-help">Acesso de demonstração</span>
            </div>

            {erro && <p className="login-error" role="alert">{erro}</p>}

            <button type="submit" className="login-submit">
              Entrar
            </button>
          </form>

          <p className="login-footer">
            Smart Chicken · Monitoramento inteligente do galinheiro
          </p>
        </div>

        <aside className="login-image-side">
          <div className="login-image-overlay">
            <h2>SMART CHICKEN</h2>
            <p>
              Monitoramento inteligente para um galinheiro mais seguro e produtivo
            </p>
            <ul>
              <li>✓ Mais produtividade</li>
              <li>✓ Mais bem-estar</li>
              <li>✓ Mais controle</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
