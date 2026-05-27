import { useState, useRef, useEffect } from "react";

import abelhinha from "./assets/abelhinha.png";
import logoNuape from "./assets/logo nuape.png";
import perguntasJson from "./data/perguntas.json";
import PergutasScreen from "./screens/perguntasScreen";


function embaralhar(array) {
  const novoArray = [...array];

  for (let i = novoArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [novoArray[i], novoArray[j]] = [
      novoArray[j],
      novoArray[i],
    ];
  }

  return novoArray;
}

function App() {
  const gerarPerguntas = () => {
    const convertido = Object.entries(perguntasJson).map(
      ([pergunta, respostas]) => ({
        pergunta,
        correta: respostas[0],
        respostas: embaralhar(respostas),
      })
    );

    return embaralhar(convertido).slice(0, 5);
  };

  const [perguntas, setPerguntas] = useState(gerarPerguntas);
  const [indice, setIndice] = useState(0);

  const [pontos, setPontos] = useState({
    jogador1: 0,
    jogador2: 0,
  });

  const [jogadorSelecionado, setJogadorSelecionado] =
    useState(null);

  const [fim, setFim] = useState(false);

  const [usbConnected, setUsbConnected] = useState(false);
  const [usbError, setUsbError] = useState("");
  const [usbAction, setUsbAction] = useState(null);
  const [button1Low, setButton1Low] = useState(true);
  const [button2Low, setButton2Low] = useState(true);
  const [usbLocked, setUsbLocked] = useState(false);
  const [selectionLocked, setSelectionLocked] = useState(false);

  const button1LowRef = useRef(true);
  const button2LowRef = useRef(true);
  const recentSelectRef = useRef({ jogador1: 0, jogador2: 0 });
  const selectionLockedRef = useRef(false);
  const usbLockedRef = useRef(false);

  const usbPortRef = useRef(null);
  const usbWriterRef = useRef(null);
  const usbReaderRef = useRef(null);
  const usbPortIdRef = useRef(null);
  const serialBufferRef = useRef("");

  const pushUsbLog = (message) => {
    console.log(`[USB] ${message}`);
  };

  const processUsbLine = (line) => {
    const command = line.trim().toUpperCase();
    // Attach a small unique id so identical repeated commands still update state
    const actionId = Date.now();

    const now = Date.now();
    const emitSelectIfAllowed = (playerKey, playerLabel) => {
      // debounce selects to avoid duplicates (800 ms)
      if (now - recentSelectRef.current[playerKey] < 800) {
        pushUsbLog(`[DEBOUNCE] ${line} select ${playerLabel}: last=${recentSelectRef.current[playerKey]} now=${now}`);
        return false;
      }
      recentSelectRef.current[playerKey] = now;

      if (!usbLockedRef.current) {
        setUsbAction({ id: actionId, type: "select", player: playerKey, original: line });
        // Clear both players' debounce timers to prevent bypass
        recentSelectRef.current.jogador1 = now;
        recentSelectRef.current.jogador2 = now;
        pushUsbLog(`[ACEITO] ${line} select ${playerLabel}`);
      } else {
        pushUsbLog(`[BLOQUEADO-EARLY] ${line} select ${playerLabel} por usbLocked`);
      }
      return true;
    };

    if (command === "PLAYER1_EARLY") {
      setButton1Low(false);
      button1LowRef.current = false;
      setUsbAction({ id: actionId, type: "early", player: "jogador1", original: line });
      setUsbLocked(true);
      usbLockedRef.current = true;
      pushUsbLog(`Processado: ${line} -> early jogador1`);
    } else if (command === "PLAYER2_EARLY") {
      setButton2Low(false);
      button2LowRef.current = false;
      setUsbAction({ id: actionId, type: "early", player: "jogador2", original: line });
      setUsbLocked(true);
      usbLockedRef.current = true;
      pushUsbLog(`Processado: ${line} -> early jogador2`);
    } else if (command === "PLAYER1_PRESS" || command === "PLAYER1_PRESSED") {
      setButton1Low(false);
      button1LowRef.current = false;
      // prefer select on press, but debounce protects duplicates
      emitSelectIfAllowed("jogador1", "1");
    } else if (command === "PLAYER2_PRESS" || command === "PLAYER2_PRESSED") {
      setButton2Low(false);
      button2LowRef.current = false;
      emitSelectIfAllowed("jogador2", "2");
    } else if (command === "PLAYER1_RELEASE" || command === "PLAYER1_LOW") {
      setButton1Low(true);
      button1LowRef.current = true;
      pushUsbLog(`Processado: ${line} -> release jogador1`);
    } else if (command === "PLAYER2_RELEASE" || command === "PLAYER2_LOW") {
      setButton2Low(true);
      button2LowRef.current = true;
      pushUsbLog(`Processado: ${line} -> release jogador2`);
    } else if (command === "PLAYER1_IGNORED") {
      setButton1Low(false);
      button1LowRef.current = false;
      pushUsbLog(`Processado: ${line} -> pressionamento ignorado jogador1`);
      emitSelectIfAllowed("jogador1", "1");
    } else if (command === "PLAYER2_IGNORED") {
      setButton2Low(false);
      button2LowRef.current = false;
      pushUsbLog(`Processado: ${line} -> pressionamento ignorado jogador2`);
      emitSelectIfAllowed("jogador2", "2");
    } else if (command === "NEXT_ALLOWED") {
      setButton1Low(true);
      setButton2Low(true);
      button1LowRef.current = true;
      button2LowRef.current = true;
      pushUsbLog(`Processado: ${line} -> ambos os botões aliviados`);
    }
  };

  const clearUsbLock = () => {
    setUsbLocked(false);
    usbLockedRef.current = false;
  };
  const clearSelectionLock = () => {
    setSelectionLocked(false);
    selectionLockedRef.current = false;
  };

  const resetQuestionLocks = () => {
    clearUsbLock();
    clearSelectionLock();
    setUsbAction(null);
    recentSelectRef.current = { jogador1: 0, jogador2: 0 };
  };

  const readUsbPort = async (port) => {
    if (!port.readable) {
      pushUsbLog("Porta aberta, mas não há leitura disponível.");
      return;
    }

    const reader = port.readable.getReader();
    usbReaderRef.current = reader;

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          const text = new TextDecoder().decode(value);
          serialBufferRef.current += text;

          const lines = serialBufferRef.current.split(/\r?\n/);
          serialBufferRef.current = lines.pop();

          lines.forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed) return;
            processUsbLine(trimmed);
          });
        }
      }
    } catch (error) {
      console.error("Erro de leitura USB:", error);
      pushUsbLog(`Erro de leitura USB: ${error.message || error}`);
      setUsbError("Erro ao ler dados da porta USB.");
    } finally {
      reader.releaseLock();
      usbReaderRef.current = null;
    }
  };

  const conectarUsb = async () => {
    if (!window.navigator.serial) {
      alert("Web Serial não é suportado neste navegador.");
      return;
    }

    try {
      const port = await window.navigator.serial.requestPort({ filters: [] });
      usbPortIdRef.current = port;
      await port.open({ baudRate: 115200 });
      usbPortRef.current = port;
      usbWriterRef.current = port.writable.getWriter();
      setUsbConnected(true);
      setUsbError("");
      pushUsbLog("Conectado à porta USB.");
      readUsbPort(port);
    } catch (error) {
      console.error(error);
      setUsbError("Não foi possível conectar ao dispositivo USB.");
      pushUsbLog(`Erro ao conectar: ${error.message || error}`);
    }
  };

  const desconectarUsb = async () => {
    try {
      if (usbReaderRef.current) {
        await usbReaderRef.current.cancel();
        usbReaderRef.current.releaseLock();
        usbReaderRef.current = null;
      }
      if (usbWriterRef.current) {
        usbWriterRef.current.releaseLock?.();
        usbWriterRef.current = null;
      }
      if (usbPortRef.current) {
        await usbPortRef.current.close();
        usbPortRef.current = null;
      }
      pushUsbLog("Desconectado da porta USB.");
    } catch (error) {
      console.error("Erro ao desconectar USB:", error);
      pushUsbLog(`Erro ao desconectar USB: ${error.message || error}`);
    }
    setUsbConnected(false);
  };

  const enviarComandoUsb = async (command) => {
    if (!usbWriterRef.current) {
      pushUsbLog(`Tentativa de enviar comando USB sem conexão: ${command}`);
      return;
    }

    try {
      const dados = new TextEncoder().encode(`${command}\n`);
      await usbWriterRef.current.write(dados);
      pushUsbLog(`Enviado: ${command}`);
    } catch (error) {
      console.error("Falha ao enviar sinal USB:", error);
      setUsbError("Falha ao enviar sinal USB");
      pushUsbLog(`Erro ao enviar comando: ${error.message || error}`);
    }
  };

  useEffect(() => {
    const tentarReconectar = async () => {
      if (usbPortIdRef.current && !usbConnected) {
        try {
          const port = usbPortIdRef.current;
          if (!port.readable) {
            await port.open({ baudRate: 115200 });
          }
          usbPortRef.current = port;
          usbWriterRef.current = port.writable.getWriter();
          setUsbConnected(true);
          setUsbError("");
          pushUsbLog("Reconectado à porta USB.");
          readUsbPort(port);
        } catch (error) {
          console.error("Erro ao reconectar:", error);
          pushUsbLog(`Erro ao reconectar: ${error.message || error}`);
        }
      }
    };

    tentarReconectar();
  }, []);

  useEffect(() => {
    if (!fim && usbPortIdRef.current && !usbConnected) {
      const timer = setTimeout(async () => {
        try {
          const port = usbPortIdRef.current;
          if (!port.readable) {
            await port.open({ baudRate: 115200 });
          }
          usbPortRef.current = port;
          usbWriterRef.current = port.writable.getWriter();
          setUsbConnected(true);
          setUsbError("");
          pushUsbLog("Reconectado automaticamente à porta USB.");
          readUsbPort(port);
        } catch (error) {
          console.error("Erro ao reconectar:", error);
          pushUsbLog(`Erro ao reconectar: ${error.message || error}`);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [fim]);

  const perguntaAtual = perguntas[indice];

  function responder(resposta) {
    if (!jogadorSelecionado) {
      alert("Selecione o jogador primeiro");
      return false;
    }

    if (resposta === perguntaAtual.correta) {
      setPontos((anterior) => ({
        ...anterior,
        [jogadorSelecionado]:
          anterior[jogadorSelecionado] + 1,
      }));
    }

    setJogadorSelecionado(null);
    return true;
  }

  function proximaPergunta() {
    resetQuestionLocks();
    setJogadorSelecionado(null);

    if (indice + 1 >= perguntas.length) {
      setFim(true);
      return;
    }

    setIndice((i) => i + 1);
  }

  const calcularVencedor = () => {
    if (pontos.jogador1 > pontos.jogador2) {
      return "Jogador 1";
    }
    if (pontos.jogador2 > pontos.jogador1) {
      return "Jogador 2";
    }
    return null;
  };

  const reiniciarJogo = () => {
    resetQuestionLocks();
    setPontos({ jogador1: 0, jogador2: 0 });
    setIndice(0);
    setFim(false);
    setJogadorSelecionado(null);
    setPerguntas(gerarPerguntas());
  };

  if (fim) {
    const vencedor = calcularVencedor();
    const resultadoTexto = vencedor
      ? `${vencedor} venceu!`
      : "Empate!";
    const placarFinal = [
      { nome: "Jogador 1", pontos: pontos.jogador1 },
      { nome: "Jogador 2", pontos: pontos.jogador2 },
    ];

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "rgb(234, 166, 51)",
          padding: 24,
          color: "#222",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            width: "min(920px, 100%)",
            background: "rgba(250, 242, 225, 1)",
            borderRadius: 28,
            padding: "34px 38px",
            textAlign: "center",
            boxShadow: "0 18px 45px rgba(91, 54, 12, 0.22)",
            border: "1px solid rgba(255,255,255,0.7)",
            boxSizing: "border-box",
          }}
        >
          <img
            src={logoNuape}
            alt="NUAPE"
            style={{
              width: "min(260px, 78vw)",
              height: "auto",
              objectFit: "contain",
              marginBottom: 20,
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            <img
              src={abelhinha}
              alt=""
              style={{
                width: 92,
                height: 92,
                objectFit: "contain",
              }}
            />
            <h1
              style={{
                margin: 0,
                fontSize: 48,
                lineHeight: 1,
                color: "#2f2a1d",
              }}
            >
              Fim do jogo!
            </h1>
          </div>

          <div
            style={{
              fontSize: 34,
              fontWeight: "900",
              marginBottom: 26,
              color: "#8f4f00",
            }}
          >
            {resultadoTexto}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 18,
              marginBottom: 30,
            }}
          >
            {placarFinal.map((item) => (
              <div
                key={item.nome}
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  padding: "22px 18px",
                  border: "2px solid rgba(234, 166, 51, 0.45)",
                  boxShadow: "0 8px 20px rgba(91, 54, 12, 0.08)",
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: "800",
                    marginBottom: 10,
                    color: "#53462c",
                  }}
                >
                  {item.nome}
                </div>
                <div
                  style={{
                    fontSize: 52,
                    lineHeight: 1,
                    fontWeight: "900",
                    color: "#222",
                  }}
                >
                  {item.pontos}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={reiniciarJogo}
            style={{
              padding: "16px 34px",
              borderRadius: 20,
              border: "none",
              background: "#222",
              color: "#fff",
              fontSize: 20,
              fontWeight: "800",
              cursor: "pointer",
              boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
            }}
          >
            Novo jogo
          </button>
        </div>
      </div>
    );
  }

  if (!perguntaAtual) {
    return <h1>Nenhuma pergunta encontrada.</h1>;
  }

  return (
    <PergutasScreen
      pontos={pontos}
      jogadorSelecionado={jogadorSelecionado}
      setJogadorSelecionado={setJogadorSelecionado}
      perguntaAtual={perguntaAtual}
      indice={indice}
      perguntas={perguntas}
      responder={responder}
      proximaPergunta={proximaPergunta}
      usbConnected={usbConnected}
      usbError={usbError}
      usbAction={usbAction}
      setUsbAction={setUsbAction}
      button1Low={button1Low}
      button2Low={button2Low}
      conectarUsb={conectarUsb}
      desconectarUsb={desconectarUsb}
      enviarComandoUsb={enviarComandoUsb}
      clearUsbLock={clearUsbLock}
      clearSelectionLock={clearSelectionLock}
      usbLocked={usbLocked}
      selectionLocked={selectionLocked}
    />
  );
}

export default App;
