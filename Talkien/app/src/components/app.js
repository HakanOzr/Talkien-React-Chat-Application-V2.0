import React, {Component} from 'react'
import Store from '../store'
import Messenger from './messenger'

export default class App extends Component {

    constructor(props) {
        super(props);

        this.state = {

            depo: new Store(this), // app demek oluyor

        }

    }

    render() {

        const {depo} = this.state;
        return <div className="app-wrapper">
            <Messenger depo={depo}/>
        </div>

    }
}