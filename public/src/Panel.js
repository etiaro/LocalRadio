import React from 'react';
import './Panel.css';

import Toolbar from './Toolbar';
import AddMenu from './addMenu';

export default class Login extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            waiting: false,
            userData: JSON.parse(this.props.userData),
            isPlaying: false,
            isAddWindowVisible: false
        };
    }

    componentWillMount(){
        document.body.style.background = "#FFFFFF";
    }
    changePlaying(){
        this.setState({isPlaying: !this.state.isPlaying});
    }
    addWindowSwitch(){
        this.setState({isAddWindowVisible: !this.state.isAddWindowVisible});
    }

    render(){
        const s = {
            display: "none"
        }
        if(this.state.isAddWindowVisible)
            s.display ="block";
        return (
            <React.Fragment>
                <AddMenu isVisible={this.state.isAddWindowVisible} close={()=>{this.setState({isAddWindowVisible:false})}}/>
                <Toolbar changePlaying={()=>this.changePlaying()} isPlaying={this.state.isPlaying} addWindowSwitch={()=>{this.addWindowSwitch()}}/>
            </React.Fragment>
        );
    }
}