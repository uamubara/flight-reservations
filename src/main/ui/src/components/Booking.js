import React, { useState } from 'react';
import { Box, Button } from '@material-ui/core';
import Locate from './Locate';
import Flight from './Flight';
import Confirm from './Confirm';
import Order from './Order';

export default function App() {
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [flight, setFlight] = useState(null);
    const [confirmation, setConfirmation] = useState(null);
    const [order, setOrder] = useState(null);

    const handleOriginChoice = (choice) => {
        setOrigin(choice);
    };

    const handleDestinationChoice = (choice) => {
        setDestination(choice);
    };

    const handleFlightSelection = (flightData) => {
        setFlight(flightData);
    };

    const handleConfirmation = (confirmationData) => {
        setConfirmation(confirmationData);
    };

    const handleOrder = (orderData) => {
        setOrder(orderData);
    };

    return (
        <Box display="flex" flexDirection="column" alignItems="center">
            <Locate handleChoice={handleOriginChoice} display="Origin" />
            <Locate handleChoice={handleDestinationChoice} display="Destination" />
            {origin && destination && (
                <Flight origin={origin} destination={destination} setFlight={handleFlightSelection} />
            )}
            {flight && <Confirm flight={flight} setConfirmation={handleConfirmation} />}
            {confirmation && (
                <Box display="flex" flexDirection="column" alignItems="center">
                    <Order confirmation={confirmation} order={order} setOrder={handleOrder} />
                    <Button variant="contained" color="primary" onClick={() => alert('Flight Booked!')}>
                        Place Order
                    </Button>
                </Box>
            )}
        </Box>
    );
}

