function RespostaButton({
  resposta,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: 20,

        borderRadius: 25,

        border: "none",

        background: "#ffffff",

        color: "#222",

        fontSize: 22,

        fontWeight: "bold",

        cursor: "pointer",

        transition: "0.2s",
      }}
    >
      {resposta}
    </button>
  );
}

export default RespostaButton;