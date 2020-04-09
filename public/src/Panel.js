import React, {createRef} from 'react';
import './Panel.css';

import Toolbar from './MusicToolbar';
import AddMenu from "./AddMenu";
import ScheduleMenu from "./ScheduleMenu";
import Library from "./Library";
import Playlist from "./Playlist"; 
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
            tab: 0,
            notifications: [],
            notificationsTimeout: 5000,
            playerData: {song:{}},
            settingsOpen: false,
            actSite: "Library",
            actWindow: "",
            playlistRef: createRef(),
            scheduleRef: createRef(),
            librarySelectCallback: ()=>{}
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
        }, (data, data2)=>{
            this.state.playlistRef.current.updateData();
            if(data2)
                this.state.scheduleRef.current.updateData();
        });
        getPlayerData((res)=>{
            this.setState({playerData: res});
        });
    }
    changePlaying(){
        this.setState({isPlaying: !this.state.isPlaying});
    }
    addWindowSwitch(){
        this.setState({actWindow: "addMenu"});
    }
    scheduleMenuSwitch(){
        this.setState({actWindow: "scheduleMenu"});
    }
    libraryWindowSwitch(cb){
        this.setState({actWindow: "libraryMenu", librarySelectCallback: cb});
    }
    closeWindows(){
        this.setState({actWindow: ""});
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
        let site = "";
        if(this.state.actSite === "Library")
            site = (<Library/>);
        if(this.state.actSite === "Playlist")
            site = (<Playlist scheduleMenuSwitch={()=>{this.scheduleMenuSwitch()}} ref={this.state.playlistRef}/>);
        let window = "";
        if(this.state.actWindow === "addMenu")
            window = (<AddMenu close={()=>{this.closeWindows()}}/>);
        if(this.state.actWindow === "scheduleMenu")
            window = (<ScheduleMenu ref={this.state.scheduleRef} libraryShow={(cb)=>this.libraryWindowSwitch(cb)} close={()=>{this.closeWindows()}}/>);
        if(this.state.actWindow === "libraryMenu")
            window = (<Library isWindowed={true} selectCallback={this.state.librarySelectCallback}/>);
        return (
            <React.Fragment>
                {site}{window}
                <Notifications notifications={this.state.notifications}/>
                <Toolbar playerData={this.state.playerData} addWindowSwitch={()=>{this.addWindowSwitch()}} toggleSettings={()=>this.toggleSettings()}/>
                <Settings open={this.state.settingsOpen} close={()=>this.toggleSettings()} 
                    openLibrary={()=>this.openLibrary()} openPlaylist={()=>this.openPlaylist()}/>
            </React.Fragment>
        );
    }
}