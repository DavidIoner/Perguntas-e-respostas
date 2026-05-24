import caramelinho from "../assets/caramelinho_1.png";

function PerguntaCard({
  pergunta,
  indice,
  total,
}) {
  return (
 
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 24,

    background: "rgb(253, 185, 4)",

    padding: 30,
    borderRadius: 32,

    width: "100%",
    boxSizing: "border-box",

    
  }}
>
  <img
    src={caramelinho}
    alt="Caramelinho"
    style={{
      width: 140,
      height: 140,
      objectFit: "contain",
      flexShrink: 0,
    }}
  />

  <div style={{ flex: 1 }}>
    <h2
      style={{
        margin: 0,
        fontSize: 24,
        opacity: 0.8,
      }}
    >
      Pergunta {indice + 1} / {total}
    </h2>

    <h1
      style={{
        fontSize: 42,
        marginTop: 14,
        marginBottom: 0,
        lineHeight: 1.2,
      }}
    >
      {pergunta}
    </h1>
  </div>
</div>
  );
}

export default PerguntaCard;