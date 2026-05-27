import { useEffect, useRef, useState } from "react";
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
  usbAction,
  setUsbAction,
  button1Low,
  button2Low,
  conectarUsb,
  desconectarUsb,
  enviarComandoUsb,
  clearUsbLock,
  clearSelectionLock,
  usbLocked,
}) {
  const [exibirRespostas, setExibirRespostas] = useState(false);
  const [perguntaRespondida, setPerguntaRespondida] = useState(false);
  const [respostaSelecionada, setRespostaSelecionada] = useState(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [timerIniciado, setTimerIniciado] = useState(false);
  const [usbAcusacao, setUsbAcusacao] = useState("");

  const timerEndedRef = useRef(false);
  const earlyHandledRef = useRef(false);
  const lastUsbActionIdRef = useRef(0);
  const selectionLockedForThisQuestionRef = useRef(false);

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
    background: "rgba(228, 179, 18, 0.67)",
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

  const jogadorColumnStyle = {
    display: "flex",
    flexDirection: "column",
    alignSelf: "stretch",
    minHeight: "calc(100vh - 40px)",
    flex: "0 0 12%",
    maxWidth: "12%",
    width: "12%",
    boxSizing: "border-box",
  };

  const jogadorPanelInternoStyle = {
    ...jogadorPanelStyle,
    flex: "0 0 auto",
    maxWidth: "100%",
    width: "100%",
    height: "auto",
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

  function selecionarJogador(jogador, mensagem) {
    if (selectionLockedForThisQuestionRef.current || perguntaRespondida) return false;

    setJogadorSelecionado(jogador);
    selectionLockedForThisQuestionRef.current = true;

    if (mensagem) {
      setUsbAcusacao(mensagem);
    }

    return true;
  }

  useEffect(() => {
    if (!usbAction) return;

    console.log("TelaJogo: usbAction recebido ->", usbAction);
    console.log("TelaJogo: estado ->", { usbLocked, earlyHandled: earlyHandledRef.current, lastUsbActionId: lastUsbActionIdRef.current, timerEnded: timerEndedRef.current, selectionLockedThisQuestion: selectionLockedForThisQuestionRef.current });

    // Ignore actions that happened before the most recent reset
    if (usbAction.id && usbAction.id <= lastUsbActionIdRef.current) {
      console.log("TelaJogo: ignorando usbAction antiga ->", usbAction);
      return;
    }

    // Ignore selects if already selected in this question
    if (usbAction.type === "select" && selectionLockedForThisQuestionRef.current) {
      console.log("TelaJogo: ignorando select porque já bloqueado nesta pergunta ->", usbAction);
      return;
    }

    // Ignore selects if already handled early in this question
    if (usbAction.type === "select" && earlyHandledRef.current) {
      console.log("TelaJogo: ignorando select porque early já tratado ->", usbAction);
      return;
    }

    if (usbAction.type === "early") {
      const offender = usbAction.player;
      const otherPlayer = offender === "jogador1" ? "jogador2" : "jogador1";
      const offenderLabel = offender === "jogador1" ? "1" : "2";
      const otherLabel = otherPlayer === "jogador1" ? "1" : "2";

      if (exibirRespostas && timerIniciado && !timerEndedRef.current && !perguntaRespondida) {
        selecionarJogador(
          otherPlayer,
          `Jogador ${offenderLabel} pressionou antes do fim do timer. Vez passada para o jogador ${otherLabel}.`
        );
        earlyHandledRef.current = true;
      }
    }

    if (usbAction.type === "select") {
      // If a select arrives while timer is running, treat as early press
      if (exibirRespostas && timerIniciado && !timerEndedRef.current && !perguntaRespondida) {
        const offender = usbAction.player;
        const otherPlayer = offender === "jogador1" ? "jogador2" : "jogador1";
        const offenderLabel = offender === "jogador1" ? "1" : "2";
        const otherLabel = otherPlayer === "jogador1" ? "1" : "2";

        selecionarJogador(
          otherPlayer,
          `Jogador ${offenderLabel} pressionou antes do fim do timer. Vez passada para o jogador ${otherLabel}.`
        );
        earlyHandledRef.current = true;
        console.log("TelaJogo: select durante timer tratado como early ->", usbAction);
        return;
      }

      // After timer ends, normal select is allowed (but only once, protected by selectionLockedForThisQuestionRef)
      const selectedLabel = usbAction.player === "jogador1" ? "1" : "2";
      selecionarJogador(usbAction.player, `Jogador ${selectedLabel} selecionado.`);
    }
  }, [usbAction, exibirRespostas, timerIniciado, perguntaRespondida, setJogadorSelecionado]);

  useEffect(() => {
    function handleKey(e) {
      const tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "a" || e.key === "A") {
        selecionarJogador("jogador1");
      }

      if (e.key === "b" || e.key === "B") {
        selecionarJogador("jogador2");
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (!exibirRespostas) {
          iniciarPergunta();
          return;
        }

        if (perguntaRespondida && botoesEmZero) {
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
  }, [exibirRespostas, perguntaRespondida, perguntaAtual, proximaPergunta, responder, setJogadorSelecionado, botoesEmZero]);

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
    // prevent replay/late usb actions from affecting the new question
    lastUsbActionIdRef.current = Date.now();
    earlyHandledRef.current = false;
    selectionLockedForThisQuestionRef.current = false;
    clearUsbLock?.();
    clearSelectionLock?.();
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
          onClick={() => selecionarJogador("jogador1")}
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

      </div>

      <div style={jogadorColumnStyle}>
        <div style={jogadorPanelInternoStyle}>
          <div style={jogadorInfoStyle}>
            <button
              onClick={() => selecionarJogador("jogador2")}
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
