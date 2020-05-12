import React, { Component } from 'react';
import { FormGroup, FormControl, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import history from '../history';
import Block from './Block';

// Creating the component for Conducting Transactions
// Figures entered on the front-end sends a post request to the backend
class Test extends Component {
    state = { recipient: '', amount: 0, knownAddresses: [], walletInfo: {} };

    // fetching known addresses
    componentDidMount() {
        fetch(`${document.location.origin}/api/known-addresses`)
            .then(response => response.json())
            .then(json => this.setState({ knownAddresses: json }));

        fetch(`${document.location.origin}/api/wallet-info`)
            .then(response => response.json())
            .then(json => this.setState({ walletInfo: json }));
    }

    updateRecipient = event => {
        this.setState({ recipient: event.target.value });
    }

    updateAmount = event => {
        this.setState({ amount: Number(event.target.value) });
    }

    // Posting the transaction request to the backend - recipient and amount in this.state
    // Responding with the transaction result (error or success)
    Test = () => {
        const { recipient, amount } = this.state;

        fetch(`${document.location.origin}/api/transact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient, amount })
        }).then(response => response.json())
          .then(json => {
            alert(json.message || json.type);
            // After transaction, routed to the transaction pool page
            history.push('/transaction-pool');
          });
    }

    // Front-end
    render() {

        return (
            <div className='Test'>
                <Link to='/'>Home</Link>
                <h3>Testing</h3>
                <br />
                <h4>Known Addresses</h4>
                {
                    this.state.knownAddresses.map(knownAddress => {
                        return (
                            <div key={knownAddress}>
                                <div>{knownAddress}</div>
                                <br />
                            </div>
                        );
                    })
                }
                <br />
                {/* Recipient box */}
                <FormGroup>
                    <FormControl 
                        input='text'
                        placeholder='recipient'
                        value={this.state.recipient}
                        onChange={this.updateRecipient}
                    />
                </FormGroup>
                {/* Amount box */}
                <FormGroup>
                    <FormControl 
                        input='number'
                        placeholder='amount'
                        value={this.state.amount}
                        onChange={this.updateAmount}
                    />
                </FormGroup>
                {/* Button to submit transaction */}
                <div>
                    <Button
                        bsstyle="danger"
                        onClick={this.Test}
                    >
                        Submit
                    </Button>
                </div>
            </div>
        )
    }
};

export default Test;