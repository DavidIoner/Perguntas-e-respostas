import abelhinha from "../assets/abelhinha.png";
import logoNuape from "../assets/logo nuape.png";
import logoUtfpr from "../assets/utfpr logo.png";

function TelaFimJogo({ pontos, reiniciarJogo }) {
  const calcularVencedor = () => {
    if (pontos.jogador1 > pontos.jogador2) {
      return "Jogador 1";
    }
    if (pontos.jogador2 > pontos.jogador1) {
      return "Jogador 2";
    }
    return null;
  };

  const vencedor = calcularVencedor();
  const resultadoTexto = vencedor ? `${vencedor} venceu!` : "Empate!";
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
            marginBottom: 20,
          }}
        >
          <img
            src={logoUtfpr}
            alt="UTFPR"
            style={{
              width: "min(200px, 30vw)",
              height: "auto",
              objectFit: "contain",
            }}
          />

          <img
            src={logoNuape}
            alt="NUAPE"
            style={{
              width: "min(220px, 30vw)",
              height: "auto",
              objectFit: "contain",
            }}
          />
        </div>

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

export default TelaFimJogo;
