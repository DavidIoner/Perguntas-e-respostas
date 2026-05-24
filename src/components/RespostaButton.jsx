function RespostaButton({
  resposta,
  onClick,
  status = "default",
  disabled = false,
}) {
  const background =
    status === "correct"
      ? "#2ecc71"
      : status === "wrong"
      ? "#e74c3c"
      : "#ffffff";

  const color = status === "correct" || status === "wrong" ? "#ffffff" : "#222";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: 20,
        borderRadius: 25,
        border: "none",
        background,
        color,
        fontSize: 22,
        fontWeight: "bold",
        cursor: disabled ? "default" : "pointer",
        transition: "0.2s",
        opacity: disabled ? 0.85 : 1,
        textAlign: "left",
      }}
    >
      {resposta}
    </button>
  );
}

export default RespostaButton;
