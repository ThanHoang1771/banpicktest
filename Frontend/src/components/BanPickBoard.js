import React from "react";
import ChampionCard from "./ChampionCard";

function BanPickBoard({ state, order, onBanPick }) {
  return (
    <div>
      <h2>Current Step: {order[state.step]}</h2>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {["Ahri", "Yasuo", "Lee Sin", "Lux", "Zed"].map((champ) => (
          <ChampionCard key={champ} champ={champ} onClick={() => onBanPick(champ)} />
        ))}
      </div>
      <h3>Actions:</h3>
      <ul>
        {state.actions.map((a, i) => (
          <li key={i}>{a.step}: {a.champion}</li>
        ))}
      </ul>
    </div>
  );
}

export default BanPickBoard;
