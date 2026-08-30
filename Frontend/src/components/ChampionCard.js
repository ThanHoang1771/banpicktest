import React from "react";

function ChampionCard({ champ, onClick }) {
  return (
    <div
      style={{
        border: "1px solid black",
        margin: "5px",
        padding: "10px",
        cursor: "pointer"
      }}
      onClick={onClick}
    >
      {champ}
    </div>
  );
}

export default ChampionCard;
