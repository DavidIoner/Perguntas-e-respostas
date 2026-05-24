import React, { useState, useRef, useEffect } from "react";

import perguntasJson from "./data/perguntas.json";
import PergutasScreen from "./screens/perguntasScreen";
import Placar from "./components/Placar";


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
  const [usbLog, setUsbLog] = useState([]);
  const [usbLastCommand, setUsbLastCommand] = useState("");
  const [usbAction, setUsbAction] = useState(null);
  const [button1Low, setButton1Low] = useState(true);
  const [button2Low, setButton2Low] = useState(true);

  const usbPortRef = useRef(null);
  const usbWriterRef = useRef(null);
  const usbReaderRef = useRef(null);
  const usbPortIdRef = useRef(null);
  const serialBufferRef = useRef("");

  const pushUsbLog = (message) => {
    setUsbLog((prev) => [
      `${new Date().toLocaleTimeString()}: ${message}`,
      ...prev.slice(0, 19),
    ]);
  };

  const processUsbLine = (line) => {
    const command = line.trim().toUpperCase();

    if (command === "PLAYER1_EARLY") {
      setUsbAction({ type: "early", player: "jogador1", original: line });
    } else if (command === "PLAYER2_EARLY") {
      setUsbAction({ type: "early", player: "jogador2", original: line });
    } else if (command === "PLAYER1_PRESS" || command === "PLAYER1_PRESSED") {
      setUsbAction({ type: "select", player: "jogador1", original: line });
      setButton1Low(false);
    } else if (command === "PLAYER2_PRESS" || command === "PLAYER2_PRESSED") {
      setUsbAction({ type: "select", player: "jogador2", original: line });
      setButton2Low(false);
    } else if (command === "PLAYER1_RELEASE" || command === "PLAYER1_LOW") {
      setButton1Low(true);
    } else if (command === "PLAYER2_RELEASE" || command === "PLAYER2_LOW") {
      setButton2Low(true);
    }
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
            pushUsbLog(`Recebido: ${trimmed}`);
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
      setUsbLastCommand(command);
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

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "rgb(250, 242, 225)",
          padding: 30,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <h1 style={{ margin: 0 }}>Fim do jogo!</h1>

        <div
          style={{
            background: "rgba(0,0,0,0.18)",
            borderRadius: 24,
            padding: 28,
            minWidth: 320,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: "900",
              marginBottom: 16,
            }}
          >
            {resultadoTexto}
          </div>
          <Placar pontos={pontos} />
          <button
            onClick={reiniciarJogo}
            style={{
              marginTop: 20,
              padding: "14px 28px",
              borderRadius: 20,
              border: "none",
              background: "#222",
              color: "#fff",
              fontSize: 18,
              cursor: "pointer",
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
      usbLog={usbLog}
      usbLastCommand={usbLastCommand}
      usbAction={usbAction}
      button1Low={button1Low}
      button2Low={button2Low}
      conectarUsb={conectarUsb}
      desconectarUsb={desconectarUsb}
      enviarComandoUsb={enviarComandoUsb}
    />
  );
}

export default App;