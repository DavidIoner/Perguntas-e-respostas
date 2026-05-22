import Placar from "../components/Placar";
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
}) {
  return (
    <div
      id="Central"
      style={{
        minHeight: "100vh",
        background: "rgb(234, 166, 51)",
        padding: 20,
        color: "#fff",
        fontFamily: "Arial",
      }}
    >
      <Placar pontos={pontos} />

      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 30,
        }}
      >
        <button
          onClick={() =>
            setJogadorSelecionado("jogador1")
          }
          style={{
            padding: "15px 30px",
            borderRadius: 20,
            border: "none",
            fontSize: 18,
            cursor: "pointer",
            background:
              jogadorSelecionado === "jogador1"
                ? "#222"
                : "#fff",
            color:
              jogadorSelecionado === "jogador1"
                ? "#fff"
                : "#222",
          }}
        >
          Jogador 1
        </button>

        <button
          onClick={() =>
            setJogadorSelecionado("jogador2")
          }
          style={{
            padding: "15px 30px",
            borderRadius: 20,
            border: "none",
            fontSize: 18,
            cursor: "pointer",
            background:
              jogadorSelecionado === "jogador2"
                ? "#222"
                : "#fff",
            color:
              jogadorSelecionado === "jogador2"
                ? "#fff"
                : "#222",
          }}
        >
          Jogador 2
        </button>
      </div>

      <PerguntaCard
        pergunta={perguntaAtual.pergunta}
        indice={indice}
        total={perguntas.length}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          marginTop: 30,
        }}
      >
        {perguntaAtual.respostas.map((r, i) => (
          <RespostaButton
            key={i}
            resposta={r}
            onClick={() => responder(r)}
          />
        ))}
      </div>
    </div>
  );
}

export default TelaJogo;