import React from "react";
import Flight from "./Flight";

export default function FlightSelect({ results = [], hidden }) {
    if (hidden) return null;
    return (
        <div>
            {results.map((offer, i) => (
                <Flight key={i} offer={offer} />
            ))}
        </div>
    );
}
