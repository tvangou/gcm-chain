import React from 'react';
// Render allows us to insert React components into the HTML
import { render } from 'react-dom';
import { Router, Switch, Route, Redirect, Link } from 'react-router-dom';
import history from './history';
// Importing app
import App from './components/App';
import Blocks from './components/Blocks';
import ConductTransaction from './components/ConductTransaction';
import TransactionPool from './components/TransactionPool';
import Login from './components/Login';
import LoginBox from './components/LoginBox';
import Test from './components/Test';
import './index.css';
import './loginSty.scss';


// React Router - to create multiple pages using history
// Route Path = Pages. Page1=App, Page2=Blocks, Page3=ConductTransaction, Page4=TransactionPool
render(
    <Router history={history}>
        <Switch>
            <Route path='/login' component={Login} />
            <Route exact path='/' component={App} />
            <Route path='/blocks' component={Blocks} />
            <Route path='/conduct-transaction' component={ConductTransaction} />
            <Route path='/transaction-pool' component={TransactionPool} />
            <Route path='/test' component={Test} />
        </Switch>
    </Router>,
    document.getElementById('root')
);