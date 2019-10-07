import React from 'react';
import './Panel.css';

import Toolbar from './MusicToolbar';
import AddMenu from "./AddMenu";
import Library from "./Library";
import Notifications from "./Notifications";
import Settings from "./Settings";

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
            playerData: getPlayerData(),
            settingsOpen: false,
            actSite: "Library"
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
    toggleSettings(state){
        if(state)    
            this.setState({settingsOpen: state});
        else
            this.setState({settingsOpen: !this.state.settingsOpen});
    }
    openLibrary(){
        this.setState({actSite: "Library"});
        this.toggleSettings(false);
    }
    openPlaylist(){
        this.setState({actSite: "Playlist"});
        this.toggleSettings(false);
    }

    render(){
        const s = {
            display: "none"
        }
        if(this.state.isAddWindowVisible)
            s.display ="block";

        let site = "";
        if(this.state.actSite == "Library")
            site = (<Library/>);
        if(this.state.actSite == "Playlist")
            site = "";
        return (
            <React.Fragment>
                {site}
                <Notifications notifications={this.state.notifications}/>
                <AddMenu isVisible={this.state.isAddWindowVisible} close={()=>{this.setState({isAddWindowVisible:false})}}/>
                <Toolbar playerData={this.state.playerData} addWindowSwitch={()=>{this.addWindowSwitch()}} toggleSettings={()=>this.toggleSettings()}/>
                <Settings open={this.state.settingsOpen} close={()=>this.toggleSettings()} 
                    openLibrary={()=>this.openLibrary()} openPlaylist={()=>this.openPlaylist()}/>
            </React.Fragment>
        );
    }
}