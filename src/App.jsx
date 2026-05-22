import React, { useMemo, useState } from "react";

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
  const perguntas = useMemo(() => {
    const convertido = Object.entries(perguntasJson).map(
      ([pergunta, respostas]) => ({
        pergunta,
        correta: respostas[0],
        respostas: embaralhar(respostas),
      })
    );

    return embaralhar(convertido).slice(0, 5);
  }, []);

  const [indice, setIndice] = useState(0);

  const [pontos, setPontos] = useState({
    jogador1: 0,
    jogador2: 0,
  });

  const [jogadorSelecionado, setJogadorSelecionado] =
    useState(null);

  const [fim, setFim] = useState(false);

  const perguntaAtual = perguntas[indice];

  function responder(resposta) {
    if (!jogadorSelecionado) {
      alert("Selecione o jogador primeiro");
      return;
    }

    if (resposta === perguntaAtual.correta) {
      setPontos((anterior) => ({
        ...anterior,
        [jogadorSelecionado]:
          anterior[jogadorSelecionado] + 1,
      }));
    }

    setJogadorSelecionado(null);

    if (indice + 1 >= perguntas.length) {
      setFim(true);
    } else {
      setIndice((i) => i + 1);
    }
  }

  if (fim) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "rgb(250, 242, 225)",
          padding: 30,
          color: "#fff",
        }}
      >
        <h1>Fim do jogo!</h1>

        <Placar pontos={pontos} />
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
  />
  );
}

export default App;