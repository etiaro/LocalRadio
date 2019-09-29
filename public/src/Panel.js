import React from 'react';
import './Panel.css';

import Toolbar from './MusicToolbar';
import AddMenu from "./AddMenu";
import Library from "./Library";
import Notifications from "./Notifications";


import {notificationHandler, getPlayerData} from './ApiConnection';

export default class Panel extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            waiting: false,
            userData: JSON.parse(this.props.userData),
            isPlaying: false,
            isAddWindowVisible: false,
            tab: 0,
            notifications: [],
            notificationsTimeout: 5000,
            playerData: getPlayerData()
        };
    }

    componentDidMount(){
        document.body.style.background = "#FFFFFF";
        notificationHandler((data)=>{
            var tmp = this.state.notifications;
            tmp.push(data);
            this.setState({notifications:tmp});
            setTimeout(()=>{
                var tmp = this.state.notifications;
                tmp.shift();
                this.setState({});
            }, this.state.notificationsTimeout)
        }, (data)=>{
            this.setState({playerData:data});
        });
    }
    changePlaying(){
        this.setState({isPlaying: !this.state.isPlaying});
    }
    addWindowSwitch(){
        this.setState({isAddWindowVisible: !this.state.isAddWindowVisible});
    }
    handleTabChange(ev, newVal){
        this.setState({tab: newVal});
    }

    render(){
        const s = {
            display: "none"
        }
        if(this.state.isAddWindowVisible)
            s.display ="block";
        return (
            <React.Fragment>
                <Library />
                <Notifications notifications={this.state.notifications}/>
                <AddMenu isVisible={this.state.isAddWindowVisible} close={()=>{this.setState({isAddWindowVisible:false})}}/>
                <Toolbar playerData={this.state.playerData} addWindowSwitch={()=>{this.addWindowSwitch()}}/>
            </React.Fragment>
        );
    }
}