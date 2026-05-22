function Placar({ pontos }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 30,
        marginBottom: 30,
        fontSize: 24,
        fontWeight: "bold",
      }}
    >
      <div>
        Jogador 1: {pontos.jogador1}
      </div>

      <div>
        Jogador 2: {pontos.jogador2}
      </div>
    </div>
  );
}

export default Placar;