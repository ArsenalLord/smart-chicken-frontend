

import { useCallback, useEffect, useState } from "react";

import {

  buscarSensores,

  buscarHistorico,

  ativarCenario,

} from "./services/api";

import {

  ResponsiveContainer,

  LineChart,

  Line,

  XAxis,

  YAxis,

  CartesianGrid,

  Tooltip,

  Legend,

} from "recharts";



const CENARIOS = [

  { id: "normal", nome: "Normal", descricao: "Funcionamento normal" },

  { id: "calor", nome: "Calor", descricao: "Temperatura elevada" },

  { id: "intruso", nome: "Intruso", descricao: "Movimento detectado" },

];



const cores = {

  fundo: "#f4f7f5",

  texto: "#18352b",

  verde: "#237a50",

  borda: "#e1e9e3",

};



function formatarNumero(valor, casas = 1) {

  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {

    return "--";

  }

  return Number(valor).toFixed(casas);

}



function App() {

  const [sensores, setSensores] = useState(null);

  const [historico, setHistorico] = useState([]);

  const [filtroCenario, setFiltroCenario] = useState("todos");

  const [limiteHistorico, setLimiteHistorico] = useState(10);

  const [erro, setErro] = useState("");

  const [carregando, setCarregando] = useState(true);

  const [cenarioSelecionado, setCenarioSelecionado] = useState("");

  const [alterandoCenario, setAlterandoCenario] = useState(false);

  const [pagina, setPagina] = useState("dashboard");




  const atualizarSensores = useCallback(async () => {

    try {

      const dados = await buscarSensores();

      setSensores(dados);

      setCenarioSelecionado(dados.cenario || "");

      setErro("");

    } catch (e) {

      setErro(e.message || "Não foi possível conectar à API.");

    } finally {

      setCarregando(false);

    }

  }, []);



const atualizarHistorico = useCallback(async () => {

  try {

    const dados = await buscarHistorico();





    const leituras = Array.isArray(dados)

      ? dados

      : Array.isArray(dados.leituras)

        ? dados.leituras

        : Array.isArray(dados.historico)

          ? dados.historico

          : [];







setHistorico(

  leituras

    .slice()

    .sort(

      (a, b) =>

        new Date(a.timestamp).getTime() -

        new Date(b.timestamp).getTime()

    )

    .map((leitura) => ({

      ...leitura,

      horario: leitura.timestamp

        ? new Date(leitura.timestamp).toLocaleTimeString("pt-BR", {

            hour: "2-digit",

            minute: "2-digit",

          })

        : "--:--",

    }))

);





  } catch (e) {

    console.error("Erro ao carregar histórico:", e);

  }

}, []);



useEffect(() => {

  atualizarSensores();

  atualizarHistorico();



  const intervalo = setInterval(() => {

    atualizarSensores();

    atualizarHistorico();

  }, 10000);



  return () => clearInterval(intervalo);

}, [atualizarSensores, atualizarHistorico]);





  async function trocarCenario(cenario) {

    setAlterandoCenario(true);

    setErro("");



    try {

      await ativarCenario(cenario);

      setCenarioSelecionado(cenario);

      await atualizarSensores();

    } catch (e) {

      setErro(e.message || "Não foi possível trocar o cenário.");

    } finally {

      setAlterandoCenario(false);

    }

  }



  const alertas = Array.isArray(sensores?.alertas)

    ? sensores.alertas

    : [];



  const historicoFiltrado = historico

  .filter((leitura) =>

    filtroCenario === "todos" || leitura.cenario === filtroCenario

  )

  .slice(-limiteHistorico)

  .reverse();





  const itens = [

    {

      titulo: "Temperatura",

      valor: formatarNumero(sensores?.temperatura),

      unidade: "°C",

      detalhe: "Temperatura do galinheiro",

      simbolo: "🌡️",

      alerta: Number(sensores?.temperatura) > 25,

    },

    {

      titulo: "Umidade",

      valor: formatarNumero(sensores?.umidade, 0),

      unidade: "%",

      detalhe: "Umidade do ambiente",

      simbolo: "💧",

      alerta: Number(sensores?.umidade) < 50,

    },

    {

      titulo: "Luminosidade",

      valor: formatarNumero(sensores?.luminosidade, 0),

      unidade: "",

      detalhe: "Nível de iluminação",

      simbolo: "☀️",

      alerta: Number(sensores?.luminosidade) < 500,

    },

    {

      titulo: "Distância",

      valor: formatarNumero(sensores?.distancia, 0),

      unidade: "cm",

      detalhe: "Distância detectada pelo sensor",

      simbolo: "📡",

      alerta: Boolean(sensores?.movimento),

    },

  ];



  // Previsão demonstrativa: estimativas simuladas a partir da leitura atual.
  const previsao = Array.from({ length: 7 }, (_, indice) => {
    const temperaturaAtual = Number(sensores?.temperatura ?? 24);
    const umidadeAtual = Number(sensores?.umidade ?? 60);
    const variacaoTemperatura = [0, 0.4, 0.8, 1.1, 0.6, 0.1, -0.3][indice];
    const variacaoUmidade = [0, -1, -2, -3, -1, 1, 2][indice];
    const agora = new Date();
    agora.setHours(agora.getHours() + indice);

    return {
      horario: indice === 0 ? "Agora" : agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      temperatura: Number((temperaturaAtual + variacaoTemperatura).toFixed(1)),
      umidade: Math.max(0, Math.min(100, Math.round(umidadeAtual + variacaoUmidade))),
    };
  });

  const temperaturaPrevistaMaxima = Math.max(...previsao.map((item) => item.temperatura));
  const umidadePrevistaMinima = Math.min(...previsao.map((item) => item.umidade));
  const recomendacoesPrevisao = [
    temperaturaPrevistaMaxima > 25
      ? { titulo: "Atenção à temperatura", texto: "A simulação indica temperatura acima de 25 °C. Verifique a ventilação e observe o comportamento das aves.", nivel: "atencao" }
      : { titulo: "Temperatura dentro da faixa", texto: "A temperatura simulada permanece até 25 °C. Continue acompanhando as leituras.", nivel: "normal" },
    umidadePrevistaMinima < 50
      ? { titulo: "Atenção à umidade", texto: "A umidade simulada pode ficar abaixo de 50%. Confira a ventilação e se a cama do galinheiro está adequada.", nivel: "atencao" }
      : { titulo: "Umidade estável", texto: "A umidade simulada permanece em 50% ou mais. Continue monitorando o ambiente.", nivel: "normal" },
  ];

  const cartao = {

    background: "#ffffff",

    border: `1px solid ${cores.borda}`,

    borderRadius: 16,

    padding: 22,

    boxShadow: "0 3px 12px rgba(24,53,43,0.04)",

  };



  return (

    <div style={{

      minHeight: "100vh",

      background: cores.fundo,

      color: cores.texto,

      fontFamily: "Inter, Arial, sans-serif",

    }}>

      <header style={{

        background: "#ffffff",

        borderBottom: `1px solid ${cores.borda}`,

        padding: "18px 5%",

        display: "flex",

        alignItems: "center",

        justifyContent: "space-between",

        gap: 16,

        flexWrap: "wrap",

      }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

          <div style={{

            background: "#e5f3e9",

            borderRadius: 12,

            padding: 10,

            fontSize: 26,

          }}>🐔</div>

          <div>

            <h1 style={{ margin: 0, fontSize: 23 }}>Smart Chicken</h1>

            <span style={{ color: "#6b8175", fontSize: 13 }}>

              Monitoramento inteligente do galinheiro

            </span>

          </div>

        </div>



        <div style={{

          color: "#237a50",

          background: "#e5f3e9",

          padding: "9px 13px",

          borderRadius: 30,

          fontSize: 13,

          fontWeight: 600,

        }}>

          ● {erro ? "Conexão com problema" : sensores ? "Sistema conectado" : "Conectando..."}

        </div>

      </header>



<nav

  style={{

    display: "flex",

    justifyContent: "center",

    gap: 12,

    padding: "14px 5%",

    background: "#ffffff",

    borderBottom: `1px solid ${cores.borda}`,

    flexWrap: "wrap",

  }}

>

  {[

    { id: "dashboard", nome: "Dashboard" },

    { id: "historico", nome: "Histórico" },

    { id: "alertas", nome: "Alertas" },

    { id: "simulacao", nome: "Simulação" },

    { id: "previsao", nome: "Previsão" },

  ].map((item) => (

    <button

      key={item.id}

      onClick={() => setPagina(item.id)}

      style={{

        padding: "10px 18px",

        borderRadius: 8,

        border: `1px solid ${cores.borda}`,

        background: pagina === item.id ? cores.verde : "#ffffff",

        color: pagina === item.id ? "#ffffff" : cores.texto,

        cursor: "pointer",

        fontWeight: 600,

      }}

    >

      {item.nome}

    </button>

  ))}

</nav>



      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "30px 5%" }}>

      {pagina === "dashboard" && (

        <>

        <section style={{

          display: "flex",

          justifyContent: "space-between",

          alignItems: "center",

          gap: 16,

          flexWrap: "wrap",

          marginBottom: 24,

        }}>

          <div>

            <h2 style={{ margin: "0 0 8px", fontSize: 27 }}>

              Visão geral

            </h2>

            <p style={{ margin: 0, color: "#6b8175" }}>

              Acompanhe as condições do ambiente em tempo real.

            </p>

          </div>



          <button

            onClick={atualizarSensores}

            disabled={carregando}

            style={{

              background: "#ffffff",

              border: `1px solid ${cores.borda}`,

              color: cores.texto,

              borderRadius: 10,

              padding: "11px 16px",

              cursor: "pointer",

              fontWeight: 600,

            }}

          >

            ↻ Atualizar leituras

          </button>

        </section>



        {erro && (

          <div role="alert" style={{

            background: "#fff0ee",

            color: "#a52d25",

            border: "1px solid #f3c7c2",

            borderRadius: 12,

            padding: 15,

            marginBottom: 20,

          }}>

            <strong>Não foi possível atualizar os dados.</strong>

            <p style={{ margin: "6px 0 0" }}>{erro}</p>

          </div>

        )}



        {carregando && !sensores && (

          <div style={{ ...cartao, marginBottom: 22 }}>

            Carregando os dados dos sensores...

          </div>

        )}



        <section style={{

          display: "grid",

          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",

          gap: 16,

          marginBottom: 26,

        }}>

          {itens.map((item) => (

            <article key={item.titulo} style={cartao}>

              <div style={{

                display: "flex",

                justifyContent: "space-between",

                alignItems: "center",

              }}>

                <span style={{ color: "#60766a", fontWeight: 600, fontSize: 14 }}>

                  {item.titulo}

                </span>

                <span style={{ fontSize: 24 }}>{item.simbolo}</span>

              </div>



              <div style={{

                display: "flex",

                alignItems: "baseline",

                gap: 5,

                margin: "22px 0 8px",

              }}>

                <strong style={{ fontSize: 34, letterSpacing: -1 }}>

                  {item.valor}

                </strong>

                <span style={{ color: "#60766a" }}>{item.unidade}</span>

              </div>



              <div style={{ color: "#7b8e83", fontSize: 13 }}>

                {item.detalhe}

              </div>



              <div style={{

                marginTop: 17,

                color: item.alerta ? "#a65c13" : cores.verde,

                fontSize: 12,

                fontWeight: 600,

              }}>

                ● {item.alerta ? "Verificar condição" : "Leitura recebida"}

              </div>

              </article>

          ))}

        </section>



        <section style={{

          display: "grid",

          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",

          gap: 20,

          marginBottom: 24,

        }}>

          <article style={cartao}>

            <h3 style={{ margin: "0 0 6px", fontSize: 19 }}>

              Equipamentos

            </h3>

            <p style={{ color: "#7b8e83", fontSize: 13, marginTop: 0 }}>

              Estado atual do sistema

            </p>



            <div style={{

              display: "flex",

              justifyContent: "space-between",

              padding: "16px 0",

              borderBottom: `1px solid ${cores.borda}`,

            }}>

              <span>Ventilador</span>

              <strong style={{

                color: sensores?.ventilador ? cores.verde : "#758278",

              }}>

                {sensores?.ventilador ? "● Ligado" : "● Desligado"}

              </strong>

            </div>



            <div style={{

              display: "flex",

              justifyContent: "space-between",

              padding: "16px 0",

            }}>

              <span>Movimento</span>

              <strong style={{

                color: sensores?.movimento ? "#c43d32" : cores.verde,

              }}>

                {sensores?.movimento ? "● Detectado" : "● Não detectado"}

              </strong>

            </div>

          </article>





        </section>

<section

  style={{

    display: "grid",

    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",

    width: "100%",

    gap: 16,

    marginBottom: 24,

  }}

>

  <article style={cartao}>

    <h3 style={{ margin: "0 0 6px", fontSize: 19 }}>

      Histórico de temperatura

    </h3>

    <p style={{ color: "#7b8e83", fontSize: 13 }}>

      Evolução das leituras em °C

    </p>



    {historico.length > 0 ? (

      <ResponsiveContainer width="100%" height={250}>

        <LineChart data={historico}>

          <CartesianGrid strokeDasharray="3 3" stroke="#e1e9e3" />

          <XAxis dataKey="horario" tick={{ fontSize: 11 }} />

          <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />





<Tooltip

  labelFormatter={(valor, payload) => {

    const registro = payload?.[0]?.payload;

    const timestamp = registro?.timestamp;



    if (!timestamp) {

      return "Horário indisponível";

    }



    const data = new Date(timestamp);



    if (Number.isNaN(data.getTime())) {

      return "Horário indisponível";

    }



    return data.toLocaleTimeString("pt-BR", {

      hour: "2-digit",

      minute: "2-digit",

    });

  }}

  formatter={(valor) => [

    `${valor} °C`,

    "Temperatura",

  ]}

/>





          <Legend />

          <Line

            type="monotone"

            dataKey="temperatura"

            name="Temperatura (°C)"

            stroke="#e07835"

            strokeWidth={2}

            dot={false}

          />

        </LineChart>

      </ResponsiveContainer>

    ) : (

      <p style={{ color: "#7b8e83" }}>Carregando histórico...</p>

    )}

  </article>



  <article style={cartao}>

    <h3 style={{ margin: "0 0 6px", fontSize: 19 }}>

      Histórico de umidade

    </h3>

    <p style={{ color: "#7b8e83", fontSize: 13 }}>

      Evolução das leituras em %

    </p>



    {historico.length > 0 ? (

      <ResponsiveContainer width="100%" height={250}>

        <LineChart data={historico}>

          <CartesianGrid strokeDasharray="3 3" stroke="#e1e9e3" />

          <XAxis dataKey="horario" tick={{ fontSize: 11 }} />

          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />



<Tooltip

  labelFormatter={(valor, payload) => {

    const registro = payload?.[0]?.payload;

    const timestamp = registro?.timestamp;



    if (!timestamp) {

      return "Horário indisponível";

    }



    const data = new Date(timestamp);



    if (Number.isNaN(data.getTime())) {

      return "Horário indisponível";

    }



    return data.toLocaleTimeString("pt-BR", {

      hour: "2-digit",

      minute: "2-digit",

    });

  }}

  formatter={(valor) => [

    `${valor}%`,

    "Umidade",

  ]}

/>



          <Legend />

          <Line

            type="monotone"

            dataKey="umidade"

            name="Umidade (%)"

            stroke="#3989d4"

            strokeWidth={2}

            dot={false}

          />

        </LineChart>

      </ResponsiveContainer>

    ) : (

      <p style={{ color: "#7b8e83" }}>Carregando histórico...</p>

    )}

  </article>



<article style={cartao}>

  <h3 style={{ margin: "0 0 6px", fontSize: 19 }}>

    Histórico de luminosidade

  </h3>

  <p style={{ color: "#7b8e83", fontSize: 13 }}>

    Evolução das leituras de iluminação

  </p>



  {historico.length > 0 ? (

    <ResponsiveContainer width="100%" height={250}>

      <LineChart data={historico}>

        <CartesianGrid strokeDasharray="3 3" />



<XAxis

  dataKey="horario"

  tick={{ fontSize: 9 }}

  interval="preserveStartEnd"

  minTickGap={20}

/>



        <YAxis />





<Tooltip

  labelFormatter={(valor, payload) => {

    const registro = payload?.[0]?.payload;

    const timestamp = registro?.timestamp;



    if (!timestamp) {

      return "Horário indisponível";

    }



    const data = new Date(timestamp);



    if (Number.isNaN(data.getTime())) {

      return "Horário indisponível";

    }



    return data.toLocaleTimeString("pt-BR", {

      hour: "2-digit",

      minute: "2-digit",

    });

  }}

  formatter={(valor) => [

    `${valor}`,

    "Luminosidade",

  ]}

/>





        <Legend />

        <Line

          type="monotone"

          dataKey="luminosidade"

          name="Luminosidade"

          stroke="#e9a23b"

          strokeWidth={2}

          dot={false}

        />

      </LineChart>

    </ResponsiveContainer>

  ) : (

    <p style={{ color: "#7b8e83" }}>Carregando histórico...</p>

    )}

</article>

</section>

        </>

      )}



{pagina === "historico" && (

<section style={{ ...cartao, marginBottom: 24 }}>

  <div style={{

    display: "flex",

    justifyContent: "space-between",

    alignItems: "center",

    gap: 12,

    flexWrap: "wrap",

    marginBottom: 18,

  }}>

    <div>

      <h3 style={{ margin: "0 0 6px", fontSize: 19 }}>

        Últimas leituras

      </h3>

      <p style={{ color: "#7b8e83", fontSize: 13, margin: 0 }}>

        Registros armazenados no histórico do sistema.

      </p>

    </div>



<div style={{

  display: "flex",

  gap: 12,

  flexWrap: "wrap",

  marginBottom: 18,

}}>

  <label style={{ fontSize: 13, color: "#60766a" }}>

    Cenário

    <select

      value={filtroCenario}

      onChange={(e) => setFiltroCenario(e.target.value)}

      style={{

        display: "block",

        marginTop: 6,

        padding: "9px 12px",

        border: `1px solid ${cores.borda}`,

        borderRadius: 8,

        background: "#fff",

        color: cores.texto,

      }}

    >

      <option value="todos">Todos os cenários</option>

      <option value="normal">Normal</option>

      <option value="calor">Calor</option>

      <option value="intruso">Intruso</option>

    </select>

  </label>



  <label style={{ fontSize: 13, color: "#60766a" }}>

    Quantidade

    <select

      value={limiteHistorico}

      onChange={(e) => setLimiteHistorico(Number(e.target.value))}

      style={{

        display: "block",

        marginTop: 6,

        padding: "9px 12px",

        border: `1px solid ${cores.borda}`,

        borderRadius: 8,

        background: "#fff",

        color: cores.texto,

      }}

    >

      <option value={10}>10 registros</option>

      <option value={25}>25 registros</option>

      <option value={50}>50 registros</option>

    </select>

  </label>

</div>



    <span style={{

      background: "#eaf5ed",

      color: "#237a50",

      padding: "7px 12px",

      borderRadius: 20,

      fontSize: 12,

      fontWeight: 700,

    }}>

      {historico.length} registros carregados

    </span>

  </div>



  {historico.length === 0 ? (

    <p style={{ color: "#7b8e83" }}>

      Nenhuma leitura histórica disponível.

    </p>

  ) : (

    <div style={{ overflowX: "auto" }}>

      <table style={{

        width: "100%",

        minWidth: 760,

        borderCollapse: "collapse",

        fontSize: 13,

        textAlign: "left",

      }}>

        <thead>

          <tr style={{

            background: "#f4f7f5",

            color: "#60766a",

          }}>

            {[

              "Data e hora",

              "Cenário",

              "Temperatura",

              "Umidade",

              "Luminosidade",

              "Distância",

              "Ventilador",

            ].map((titulo) => (

              <th key={titulo} style={{

                padding: "12px 10px",

                borderBottom: `1px solid ${cores.borda}`,

                whiteSpace: "nowrap",

              }}>

                {titulo}

              </th>

            ))}

          </tr>

        </thead>



        <tbody>



        {historicoFiltrado.map((leitura, indice) => (



            <tr

              key={leitura.id ?? `${leitura.timestamp}-${indice}`}

              style={{ borderBottom: `1px solid ${cores.borda}` }}

            >

              <td style={{ padding: "13px 10px", whiteSpace: "nowrap" }}>

                {leitura.timestamp

                  ? new Date(leitura.timestamp).toLocaleString("pt-BR")

                  : "--"}

              </td>



              <td style={{ padding: "13px 10px" }}>

                {leitura.cenario || "--"}

              </td>



              <td style={{ padding: "13px 10px" }}>

                {formatarNumero(leitura.temperatura)} °C

              </td>



              <td style={{ padding: "13px 10px" }}>

                {formatarNumero(leitura.umidade, 0)}%

              </td>



              <td style={{ padding: "13px 10px" }}>

                {formatarNumero(leitura.luminosidade, 0)}

              </td>



              <td style={{ padding: "13px 10px" }}>

                {formatarNumero(leitura.distancia, 0)} cm

              </td>



              <td style={{ padding: "13px 10px" }}>

                <span style={{

                  color: leitura.ventilador ? "#237a50" : "#758278",

                  fontWeight: 600,

                }}>

                  {leitura.ventilador ? "Ligado" : "Desligado"}

                </span>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )}

</section>)}

{pagina === "simulacao" && (

  <section style={cartao}>

    <h2 style={{ marginTop: 0 }}>Simulação do galinheiro</h2>

    <p style={{ color: "#7b8e83" }}>

      Escolha um cenário para testar o comportamento do sistema.

    </p>



    <div style={{

      display: "grid",

      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",

      gap: 16,

      marginTop: 20,

    }}>

      {CENARIOS.map((cenario) => {

        const ativo = cenarioSelecionado === cenario.id;



        return (

          <button

            key={cenario.id}

            onClick={() => trocarCenario(cenario.id)}

            disabled={alterandoCenario}

            style={{

              padding: 20,

              borderRadius: 12,

              border: `1px solid ${ativo ? cores.verde : cores.borda}`,

              background: ativo ? "#eaf5ed" : "#ffffff",

              color: cores.texto,

              cursor: alterandoCenario ? "wait" : "pointer",

              textAlign: "left",

            }}

          >

            <strong style={{ display: "block", marginBottom: 8 }}>

              {cenario.nome}

            </strong>



            <span style={{ fontSize: 13, color: "#718478" }}>

              {cenario.descricao}

            </span>



            <p style={{

              marginBottom: 0,

              color: ativo ? cores.verde : "#87958b",

              fontWeight: 700,

              fontSize: 12,

            }}>

              {ativo ? "CENÁRIO ATIVO" : "SELECIONAR"}

            </p>

          </button>

        );

      })}

    </div>



    {alterandoCenario && (

      <p style={{ color: "#60766a" }}>Alterando cenário...</p>

    )}

  </section>

)}

        {pagina === "alertas" && (

        <section style={cartao}>

          <div style={{

            display: "flex",

            justifyContent: "space-between",

            alignItems: "center",

            gap: 12,

            flexWrap: "wrap",

          }}>

            <div>

              <h3 style={{ margin: "0 0 6px", fontSize: 19 }}>

                Alertas do ambiente

              </h3>

              <p style={{ color: "#7b8e83", fontSize: 13, margin: 0 }}>

                Avisos recebidos da API.

              </p>

            </div>

            <span style={{

              background: alertas.length ? "#fff0e0" : "#e5f3e9",

              color: alertas.length ? "#a65c13" : cores.verde,

              borderRadius: 20,

              padding: "7px 12px",

              fontSize: 12,

              fontWeight: 700,

            }}>

              {alertas.length} {alertas.length === 1 ? "alerta" : "alertas"}

            </span>

          </div>



          {alertas.length === 0 ? (

            <p style={{ color: "#60766a", marginTop: 22 }}>

              {sensores ? "Nenhum alerta ativo no momento." : "Aguardando dados dos sensores..."}

            </p>

          ) : (

            <div style={{ display: "grid", gap: 10, marginTop: 20 }}>

              {alertas.map((alerta, indice) => (

                <div key={`${alerta.tipo || "alerta"}-${indice}`} style={{

                  background: alerta.nivel === "crítico" ? "#fff0ee" : "#fff8e9",

                  borderRadius: 10,

                  padding: 14,

                  borderLeft: `4px solid ${alerta.nivel === "crítico" ? "#c43d32" : "#d99a2b"}`,

                }}>

                  <strong style={{ display: "block", marginBottom: 5 }}>

                    {alerta.tipo || "Alerta"} — {alerta.nivel || "Atenção"}

                  </strong>

                  <span style={{ fontSize: 14 }}>

                    {alerta.mensagem || "Verifique as condições do galinheiro."}

                  </span>

                </div>

              ))}

            </div>

          )}



          {sensores?.timestamp && (

            <p style={{

              color: "#829187",

              fontSize: 12,

              marginTop: 20,

              marginBottom: 0,

            }}>

              Última leitura recebida:{" "}

              {new Date(sensores.timestamp).toLocaleString("pt-BR")}

            </p>

                 )}

        </section>



        )}

        {pagina === "previsao" && (
          <section>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 27 }}>Previsão e condições do galinheiro</h2>
              <p style={{ margin: 0, color: "#6b8175", lineHeight: 1.6 }}>
                Tendência demonstrativa para as próximas 6 horas, calculada com dados simulados a partir das leituras atuais.
              </p>
              <p style={{ margin: "8px 0 0", color: "#829187", fontSize: 12 }}>
                Esta tela é uma simulação educativa; não representa uma previsão meteorológica real.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 22 }}>
              <article style={cartao}>
                <div style={{ color: "#60766a", fontSize: 14, fontWeight: 600 }}>Temperatura estimada máxima</div>
                <div style={{ fontSize: 34, fontWeight: 700, margin: "14px 0 6px" }}>{formatarNumero(temperaturaPrevistaMaxima)} °C</div>
                <div style={{ color: temperaturaPrevistaMaxima > 25 ? "#a65c13" : cores.verde, fontSize: 13 }}>
                  {temperaturaPrevistaMaxima > 25 ? "Atenção: acima de 25 °C" : "Dentro do limite demonstrativo"}
                </div>
              </article>
              <article style={cartao}>
                <div style={{ color: "#60766a", fontSize: 14, fontWeight: 600 }}>Umidade estimada mínima</div>
                <div style={{ fontSize: 34, fontWeight: 700, margin: "14px 0 6px" }}>{umidadePrevistaMinima}%</div>
                <div style={{ color: umidadePrevistaMinima < 50 ? "#a65c13" : cores.verde, fontSize: 13 }}>
                  {umidadePrevistaMinima < 50 ? "Atenção: abaixo de 50%" : "Dentro do limite demonstrativo"}
                </div>
              </article>
              <article style={cartao}>
                <div style={{ color: "#60766a", fontSize: 14, fontWeight: 600 }}>Cenário atual</div>
                <div style={{ fontSize: 25, fontWeight: 700, margin: "14px 0 6px", textTransform: "capitalize" }}>{sensores?.cenario || cenarioSelecionado || "Normal"}</div>
                <div style={{ color: "#7b8e83", fontSize: 13 }}>Baseado no cenário da simulação</div>
              </article>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 22 }}>
              <article style={cartao}>
                <h3 style={{ margin: "0 0 6px", fontSize: 19 }}>Tendência de temperatura</h3>
                <p style={{ color: "#7b8e83", fontSize: 13 }}>Estimativa simulada em °C</p>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={previsao}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e1e9e3" />
                    <XAxis dataKey="horario" tick={{ fontSize: 11 }} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(valor) => [`${valor} °C`, "Temperatura"]} />
                    <Line type="monotone" dataKey="temperatura" name="Temperatura" stroke="#e07835" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </article>
              <article style={cartao}>
                <h3 style={{ margin: "0 0 6px", fontSize: 19 }}>Tendência de umidade</h3>
                <p style={{ color: "#7b8e83", fontSize: 13 }}>Estimativa simulada em %</p>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={previsao}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e1e9e3" />
                    <XAxis dataKey="horario" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(valor) => [`${valor}%`, "Umidade"]} />
                    <Line type="monotone" dataKey="umidade" name="Umidade" stroke="#3989d4" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </article>
            </div>

            <article style={cartao}>
              <h3 style={{ margin: "0 0 6px", fontSize: 19 }}>Recomendações informativas</h3>
              <p style={{ color: "#7b8e83", fontSize: 13, marginTop: 0 }}>Orientações geradas a partir dos valores simulados.</p>
              <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                {recomendacoesPrevisao.map((recomendacao) => (
                  <div key={recomendacao.titulo} style={{ background: recomendacao.nivel === "atencao" ? "#fff8e9" : "#eaf5ed", borderRadius: 10, padding: 15, borderLeft: `4px solid ${recomendacao.nivel === "atencao" ? "#d99a2b" : cores.verde}` }}>
                    <strong style={{ display: "block", marginBottom: 5 }}>{recomendacao.titulo}</strong>
                    <span style={{ fontSize: 14, lineHeight: 1.6 }}>{recomendacao.texto}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        <footer style={{

          textAlign: "center",

          color: "#829187",

          fontSize: 12,

          padding: "28px 0 8px",

        }}>

          Smart Chicken · Monitoramento inteligente do galinheiro

        </footer>

      </main>

    </div>

  );

}



export default App;
