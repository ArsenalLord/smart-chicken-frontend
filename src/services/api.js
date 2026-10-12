
const API_URL = "https://smart-chicken-backend-production.up.railway.app";

export async function buscarSensores() {
  const resposta = await fetch(`${API_URL}/api/sensores`);

  if (!resposta.ok) {
    throw new Error("Não foi possível consultar os sensores.");
  }

  return resposta.json();
}

export async function buscarHistorico() {
  const resposta = await fetch(`${API_URL}/api/sensores/historico`);

  if (!resposta.ok) {
    throw new Error("Não foi possível consultar o histórico.");
  }

  return resposta.json();
}

export async function buscarCenarios() {
  const resposta = await fetch(`${API_URL}/api/cenarios`);

  if (!resposta.ok) {
    throw new Error("Não foi possível consultar os cenários.");
  }

  return resposta.json();
}

export async function ativarCenario(cenario) {
  const resposta = await fetch(`${API_URL}/api/cenarios/ativar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cenario }),
  });

  if (!resposta.ok) {
    throw new Error("Não foi possível ativar o cenário.");
  }

  return resposta.json();
}
