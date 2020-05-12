import React from 'react';

// Reuseable transaction component
// Formating transaction amounts and wallet balances ($USD)
// Old: Balance: {input.amount}, Sent: {outputmap[recipient]}
const Transaction = ({ transaction }) => {
    const { input, outputMap } = transaction;
    const recipients = Object.keys(outputMap);

    return (
        <div className='Transaction'>
            <div>From: {`${input.address.substring(0, 20)}...`} | Balance: {new 
                        Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(input.amount)}
            </div>
            {
                recipients.map(recipient => (
                    <div key={recipient}>
                        To: {`${recipient.substring(0,20)}...`} | Sent: {new 
                            Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            }).format(outputMap[recipient])}
                    </div>
                ))
            }
        </div>
    );
}

export default Transaction;