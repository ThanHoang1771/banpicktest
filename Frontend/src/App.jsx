import React, { useEffect, useState } from "react";
import socket from "./socket";
import BanPickBoard from "./components/BanPickBoard";

function App() {
  const [state, setState] = useState({ step: 0, actions: [] });
  const [order, setOrder] = useState([]);

  useEffect(() => {
    socket.on("init", (data) => {
      setState(data.state);
      setOrder(data.order);
    });

    socket.on("update", (newState) => {
      setState(newState);
    });

    return () => {
      socket.off("init");
      socket.off("update");
    };
  }, []);

  const handleBanPick = (champion) => {
    socket.emit("banpick", { champion });
  };

  const handleReset = () => {
    socket.emit("reset");
  };

  return (
    <div>
      <h1>FVPL Summer 2026 Ban/Pick</h1>
      <BanPickBoard state={state} order={order} onBanPick={handleBanPick} />
      <button onClick={handleReset}>Reset</button>
    </div>
  );
}

export default App;
