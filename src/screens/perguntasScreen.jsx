import React, { useEffect, useRef, useState } from "react";
import PerguntaCard from "../components/PerguntaCard";
import RespostaButton from "../components/RespostaButton";

function TelaJogo({
  pontos,
  jogadorSelecionado,
  setJogadorSelecionado,
  perguntaAtual,
  indice,
  perguntas,
  responder,
  proximaPergunta,
  usbConnected,
  usbError,
  usbLog,
  usbLastCommand,
  usbAction,
  setUsbAction,
  button1Low,
  button2Low,
  conectarUsb,
  desconectarUsb,
  enviarComandoUsb,
}) {
  const [exibirRespostas, setExibirRespostas] = useState(false);
  const [perguntaRespondida, setPerguntaRespondida] = useState(false);
  const [respostaSelecionada, setRespostaSelecionada] = useState(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [timerIniciado, setTimerIniciado] = useState(false);
  const [usbAcusacao, setUsbAcusacao] = useState("");

  const timerEndedRef = useRef(false);

  const jogadorButtonStyle = (jogador) => ({
    padding: "15px 30px",
    borderRadius: 20,
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    width: "100%",
    background: jogadorSelecionado === jogador ? "#222" : "#fff",
    color: jogadorSelecionado === jogador ? "#fff" : "#222",
    transition: "0.15s",
  });

  const jogadorPanelStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    padding: 18,
    borderRadius: 28,
    background: "rgba(255, 236, 176, 0.95)",
    border: "1px solid rgba(255, 236, 176, 0.8)",
    height: "100%",
    flex: "0 0 12%",
    maxWidth: "12%",
    width: "12%",
    boxSizing: "border-box",
  };

  const jogadorInfoStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  };

  const usbButtonContainerStyle = {
    marginTop: "auto",
    width: "100%",
  };

  const centralWrapperStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: "1 1 0",
    minWidth: 0,
    height: "100%",
    gap: 30,
    boxSizing: "border-box",
    cursor: exibirRespostas ? "default" : "pointer",
  };

  useEffect(() => {
    resetQuestionState();
  }, [perguntaAtual]);

  const botoesEmZero = button1Low && button2Low;

  useEffect(() => {
    if (!usbAction) return;

    if (usbAction.type === "early") {
      const offender = usbAction.player;
      const otherPlayer = offender === "jogador1" ? "jogador2" : "jogador1";
      const offenderLabel = offender === "jogador1" ? "1" : "2";
      const otherLabel = otherPlayer === "jogador1" ? "1" : "2";

      if (exibirRespostas && timerIniciado && !timerEndedRef.current && !perguntaRespondida) {
        setJogadorSelecionado(otherPlayer);
        setUsbAcusacao(
          `Jogador ${offenderLabel} pressionou antes do fim do timer. Vez passada para o jogador ${otherLabel}.`
        );
      }
    }

    if (usbAction.type === "select") {
      const selectedLabel = usbAction.player === "jogador1" ? "1" : "2";
      setJogadorSelecionado(usbAction.player);
      setUsbAcusacao(`Jogador ${selectedLabel} selecionado.`);
    }
  }, [usbAction, exibirRespostas, timerIniciado, perguntaRespondida, setJogadorSelecionado]);

  useEffect(() => {
    function handleKey(e) {
      const tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "a" || e.key === "A") {
        setJogadorSelecionado("jogador1");
      }

      if (e.key === "b" || e.key === "B") {
        setJogadorSelecionado("jogador2");
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (!exibirRespostas) {
          iniciarPergunta();
          return;
        }

        if (perguntaRespondida) {
          proximaPergunta();
        }
      }

      if (!exibirRespostas || perguntaRespondida) return;

      const responseKey = ["1", "2", "3", "4", "5", "6"].includes(e.key)
        ? parseInt(e.key, 10) - 1
        : e.code.startsWith("Numpad")
        ? parseInt(e.code.replace("Numpad", ""), 10) - 1
        : null;

      if (responseKey !== null) {
        const resposta = perguntaAtual.respostas[responseKey];
        if (resposta) {
          handleResposta(resposta);
        }
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [exibirRespostas, perguntaRespondida, perguntaAtual, proximaPergunta, responder, setJogadorSelecionado]);

  const timerRestante = Math.max(0, Math.ceil((4000 - timerElapsed) / 1000));

  useEffect(() => {
    if (!timerIniciado) return;

    const interval = window.setInterval(() => {
      setTimerElapsed((prev) => {
        const next = Math.min(4000, prev + 50);

        if (next >= 4000 && !timerEndedRef.current) {
          timerEndedRef.current = true;
          enviarSinalUsb();
        }

        return next;
      });
    }, 50);

    return () => window.clearInterval(interval);
  }, [timerIniciado]);

  function resetQuestionState() {
    setExibirRespostas(false);
    setPerguntaRespondida(false);
    setRespostaSelecionada(null);
    setTimerElapsed(0);
    setTimerIniciado(false);
    setUsbAcusacao("");
    setJogadorSelecionado(null);
    setUsbAction?.(null);
    timerEndedRef.current = true;
    enviarComandoUsb("LED_OFF");
  }

  function iniciarPergunta() {
    if (exibirRespostas) return;
    setExibirRespostas(true);
    setTimerIniciado(true);
    setTimerElapsed(0);
    setUsbAcusacao("");
    timerEndedRef.current = false;
    enviarComandoUsb("TIMER_START");
  }

  async function enviarSinalUsb() {
    await enviarComandoUsb("TIMER_END");
  }

  function handleResposta(resposta) {
    if (!exibirRespostas || perguntaRespondida) return;

    const resultado = responder(resposta);
    if (!resultado) return;

    setRespostaSelecionada(resposta);
    setPerguntaRespondida(true);
    setJogadorSelecionado(null);
    enviarComandoUsb("LED_OFF");
  }

  function handleCentralClick() {
    if (!exibirRespostas) {
      iniciarPergunta();
    }
  }

  const centralButtonAreaStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    width: "100%",
  };

  const footerActionsStyle = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    width: "100%",
  };

  const actionButtonStyle = {
    padding: "14px 24px",
    borderRadius: 24,
    border: "none",
    fontSize: 18,
    fontWeight: "bold",
    cursor: "pointer",
    background: "#222",
    color: "#fff",
    transition: "0.2s",
  };

  return (
    <div
      id="Central"
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "rgb(234, 166, 51)",
        padding: 20,
        color: "#fff",
        fontFamily: "Arial",
        display: "flex",
        justifyContent: "center",
        alignItems: "stretch",
        gap: 20,
        boxSizing: "border-box",
      }}
    >
      <div style={jogadorPanelStyle}>
        <button
          onClick={() => setJogadorSelecionado("jogador1")}
          style={jogadorButtonStyle("jogador1")}
        >
          Jogador 1
        </button>
        <div
          style={{
            fontSize: 28,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          {pontos.jogador1}
        </div>
      </div>

      <div style={centralWrapperStyle} onClick={handleCentralClick}>
        <PerguntaCard
          pergunta={perguntaAtual.pergunta}
          indice={indice}
          total={perguntas.length}
        />

        {usbAcusacao ? (
          <div
            style={{
              maxWidth: 760,
              background: "rgba(255,255,255,0.95)",
              color: "#222",
              borderRadius: 20,
              padding: "14px 18px",
              fontSize: 18,
              fontWeight: 700,
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            {usbAcusacao}
          </div>
        ) : null}

        {!exibirRespostas ? (
          <div
            style={{
              padding: "18px 24px",
              borderRadius: 24,
              background: "rgba(255,255,255,0.18)",
              color: "#222",
              fontSize: 20,
              textAlign: "center",
              maxWidth: 760,
            }}
          >
            Pressione a barra de espaço ou clique nesta área para iniciar o evento, exibir as respostas e iniciar o timer.
          </div>
        ) : (
          <>
            <div style={{ width: "100%", maxWidth: 760 }}>
              <div
                style={{
                  height: 32,
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.35)",
                  overflow: "hidden",
                  position: "relative",
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, (timerElapsed / 4000) * 100)}%`,
                    height: "100%",
                    background: "#2ecc71",
                    transition: "width 0.05s linear",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#222",
                    fontWeight: "700",
                    pointerEvents: "none",
                  }}
                >
                  {`${timerRestante}s`}
                </div>
              </div>
            </div>

            <div style={centralButtonAreaStyle}>
              {perguntaAtual.respostas.map((r, i) => {
                let status = "default";
                if (perguntaRespondida) {
                  if (r === perguntaAtual.correta) {
                    status = "correct";
                  } else if (r === respostaSelecionada) {
                    status = "wrong";
                  }
                }

                return (
                  <RespostaButton
                    key={i}
                    resposta={`${i + 1}. ${r}`}
                    onClick={() => handleResposta(r)}
                    status={status}
                    disabled={timerRestante > 0 || perguntaRespondida}
                  />
                );
              })}
            </div>
          </>
        )}

        <div style={footerActionsStyle}>
          <button
            onClick={proximaPergunta}
            disabled={!perguntaRespondida || !botoesEmZero}
            style={{
              ...actionButtonStyle,
              opacity: perguntaRespondida && botoesEmZero ? 1 : 0.35,
              cursor: perguntaRespondida && botoesEmZero ? "pointer" : "not-allowed",
            }}
          >
            Próxima pergunta
          </button>
        </div>

        {usbError ? (
          <div
            style={{
              marginTop: 10,
              color: "#ffdddd",
              background: "rgba(0,0,0,0.16)",
              borderRadius: 16,
              padding: "12px 14px",
              width: "100%",
              textAlign: "center",
            }}
          >
            {usbError}
          </div>
        ) : null}

        {!botoesEmZero ? (
          <div
            style={{
              marginTop: 10,
              color: "#222",
              background: "rgba(255,255,255,0.9)",
              borderRadius: 16,
              padding: "12px 14px",
              width: "100%",
              textAlign: "center",
            }}
          >
            Aguarde que os botões de seleção voltem para nível lógico 0 antes de avançar.
          </div>
        ) : null}

        <div
          style={{
            marginTop: 16,
            padding: 18,
            borderRadius: 24,
            background: "rgba(255,255,255,0.18)",
            color: "#222",
            width: "100%",
            maxWidth: 760,
            boxSizing: "border-box",
          }}
        >
          <div style={{ marginBottom: 12, fontWeight: "700", fontSize: 18 }}>
            Debug USB Serial
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ flex: "1 1 200px" }}>
              <strong>Status:</strong> {usbConnected ? "Conectado" : "Desconectado"}
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <strong>Último comando:</strong> {usbLastCommand || "Nenhum"}
            </div>
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto", background: "#fff", borderRadius: 16, padding: 12, color: "#222" }}>
            {usbLog.length === 0 ? (
              <div style={{ opacity: 0.7 }}>Logs de serial aparecerão aqui.</div>
            ) : (
              usbLog.map((item, index) => (
                <div key={index} style={{ marginBottom: 8, fontSize: 14 }}>
                  {item}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={jogadorPanelStyle}>
        <div style={jogadorInfoStyle}>
          <button
            onClick={() => setJogadorSelecionado("jogador2")}
            style={jogadorButtonStyle("jogador2")}
          >
            Jogador 2
          </button>
          <div
            style={{
              fontSize: 28,
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            {pontos.jogador2}
          </div>
        </div>
        <div style={usbButtonContainerStyle}>
          <button
            onClick={usbConnected ? desconectarUsb : conectarUsb}
            style={{
              ...actionButtonStyle,
              width: "100%",
            }}
          >
            {usbConnected ? "Desconectar USB" : "Conectar USB"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TelaJogo;
