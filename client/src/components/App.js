import React, { Component } from 'react';
import { 
    BrowserRouter as Router,
    Route,
    Redirect,
    Link 
} from 'react-router-dom';
import logo from '../assets/bmo.png';
import * as ReactBootStrap from 'react-bootstrap';
import { useTable } from 'react-table';


// The core App component to house the main React components
class App extends Component {
    state = { walletInfo: {} };

    componentDidMount() {
        fetch(`${document.location.origin}/api/wallet-info`)
            .then(response => response.json())
            .then(json => this.setState({ walletInfo: json }));
    }

    render() { 
        // Pulling address and balance
        const { address, balance } = this.state.walletInfo;
        
        {/* const nostros = [
            {account: "CHI", address: {address}, balance: {balance}},
        ]

        const renderNostro = (nostro, index) => {
            return(
                <tr key={index}>
                    <td>{nostro.account}</td>
                    <td>{nostro.address}</td>
                    <td>{nostro.balance}</td>
                </tr>
            )
        } */}

        return (
            <div className='App'>
                <img className='logo' src={logo}></img>
                <br />
                <div>
                    GCM Chain: GCTS on the Chain
                </div>
                <br />
                <div><Link to='/blocks'>Blocks</Link></div>
                <div><Link to='/conduct-transaction'>Conduct a Transaction</Link></div>
                <div><Link to='/transaction-pool'>Transaction Pool</Link></div>
                <div><Link to='/login'>Login</Link></div>
                <div><Link to='/test'>Test</Link></div>
                <br />
                <ReactBootStrap.Table className='dash' bordered>
                    <thead>
                        <tr>
                        <th>Account</th>
                        <th>Address</th>
                        <th>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>CHI</td>
                            <td>
                                <div className='WalletInfo'>
                                    {address}
                                </div>
                            </td>
                            <td>{new 
                                Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                                }).format(balance)}
                            </td>
                        </tr>
                    </tbody>
                </ReactBootStrap.Table>


                {/* <div className='WalletInfo'>
                    <div>Address: {address}</div>
                    <div> Balance: {new 
                        Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(balance)}
                    </div>
                    {/* <div>Balance: {balance}</div> --
                </div> */}

            </div>
        );
    }
}

export default App;