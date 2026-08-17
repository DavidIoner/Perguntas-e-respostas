function Indicador({ label, ativo, corAtivo = "#2ecc71", corInativo = "#e74c3c" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: ativo ? corAtivo : corInativo,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      <span>{label}</span>
    </div>
  );
}

function TelaDebug({
  visivel,
  usbConnected,
  usbError,
  button1Low,
  button2Low,
  usbLocked,
  selectionLocked,
  usbAction,
  logs,
}) {
  if (!visivel) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        width: 360,
        maxHeight: "90vh",
        background: "rgba(20, 20, 20, 0.92)",
        color: "#eee",
        borderRadius: 14,
        padding: 16,
        fontFamily: "monospace",
        fontSize: 12,
        boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: "bold" }}>
        Debug Serial (F2 para ocultar)
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Indicador label={`USB conectado: ${usbConnected}`} ativo={usbConnected} />
        <Indicador
          label={`Botão 1 pressionado: ${!button1Low}`}
          ativo={!button1Low}
          corAtivo="#f1c40f"
        />
        <Indicador
          label={`Botão 2 pressionado: ${!button2Low}`}
          ativo={!button2Low}
          corAtivo="#f1c40f"
        />
        <Indicador label={`usbLocked: ${usbLocked}`} ativo={usbLocked} corAtivo="#e67e22" />
        <Indicador
          label={`selectionLocked: ${selectionLocked}`}
          ativo={selectionLocked}
          corAtivo="#e67e22"
        />
      </div>

      {usbError ? (
        <div style={{ color: "#ff8080" }}>Erro: {usbError}</div>
      ) : null}

      <div>
        <div style={{ opacity: 0.7, marginBottom: 4 }}>Última ação:</div>
        <div>{usbAction ? JSON.stringify(usbAction) : "(nenhuma)"}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ opacity: 0.7, marginBottom: 4 }}>Log serial:</div>
        <div
          style={{
            overflowY: "auto",
            maxHeight: 260,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {logs.length === 0 ? (
            <div style={{ opacity: 0.5 }}>(sem mensagens ainda)</div>
          ) : (
            logs.map((entrada, i) => (
              <div key={i}>
                <span style={{ opacity: 0.6 }}>{entrada.hora}</span>{" "}
                {entrada.mensagem}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default TelaDebug;
