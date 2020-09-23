import React, {createRef} from 'react';
import {BrowserRouter as Router,Switch,Route, Redirect} from "react-router-dom";
import './Panel.css';

import Toolbar from './MusicToolbar';
import AddMenu from "./AddMenu";
import ScheduleMenu from "./ScheduleMenu";
import Library from "./Library";
import Playlist from "./Playlist"; 
import History from "./History";
import Suggestions from './Suggestions';
import Notifications from "./Notifications";
import Settings from "./Settings";

import {notificationHandler, getPlayerData, sendAmpMode, sendVolume} from './ApiConnection';

export default class Panel extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            userData: this.props.userData,
            notifications: [],
            notificationsTimeout: 5000,
            playerData: {song:{}, amplifierMode:"0" },
            settingsOpen: false,
            actSite: "Library",
            actWindow: "",
            volume: 100,
            playlistRef: createRef(),
            scheduleRef: createRef(),
            librarySelectCallback: ()=>{},
            addCallback: ()=>{}
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
            data.amplifierMode = data.amplifierMode.toString()
            this.setState({playerData:data, volume: data.volume});
        }, (data, data2)=>{
            if(this.state.playlistRef.current)
                this.state.playlistRef.current.updateData();
            if(data2 && this.state.scheduleRef.current)
                this.state.scheduleRef.current.updateData();
        });
        getPlayerData((res)=>{
            res.amplifierMode = res.amplifierMode.toString()
            this.setState({playerData: res, volume: res.volume});
        });
    }
    addWindowSwitch(downloadCallback, addUrl){
        if(!downloadCallback) downloadCallback = ()=>{};
        this.setState({actWindow: "addMenu", addUrl: addUrl, addCallback: downloadCallback});
    }
    setAmpMode(e){
        var playerData = this.state.playerData;
        playerData.amplifierMode = e.target.value;
        this.setState({playerData: playerData})
        sendAmpMode(e.target.value)
    }
    setVolume(e,v, send){
        this.setState({volume: v})
        if(send)
            sendVolume(v)
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
    openHistory(){
        this.setState({actSite: "History"});
        this.toggleSettings(false);
    }
    openSuggestions(){
        this.setState({actSite: "SuggestionsMenu"});
        this.toggleSettings(false);
    }

    render(){
        let window = "";
        if(this.state.actWindow === "addMenu")
            window = (<AddMenu close={()=>{this.closeWindows()}} url={this.state.addUrl} addCallback={()=>this.state.addCallback()}/>);
        if(this.state.actWindow === "scheduleMenu")
            window = (<ScheduleMenu ref={this.state.scheduleRef} close={()=>{this.closeWindows()}}/>);
        if(this.state.actWindow === "libraryMenu")
            window = (<Library isWindowed={true} selectCallback={this.state.librarySelectCallback} close={()=>{this.closeWindows()}}/>);

        return (
            <Router>
                <Switch>
                    <Route path="/library">
                        <Library />
                    </Route>
                    <Route path="/playlist">
                        <Playlist isAdmin={this.state.userData.isAdmin} libraryShow={(cb)=>this.libraryWindowSwitch(cb)} scheduleMenuSwitch={()=>{this.scheduleMenuSwitch()}} ref={this.state.playlistRef}/>
                    </Route>
                    <Route path="/history">
                        <History />
                    </Route>
                    <Route path="/suggestions">
                        <Suggestions isAdmin={this.state.userData.isAdmin} openAddMenu={(cb, url)=>this.addWindowSwitch(cb, url)}/>
                    </Route>
                    <Route path="/">
                        <Redirect to="/library" />
                    </Route>
                </Switch>
                {window}
                <Notifications notifications={this.state.notifications}/>
                <Toolbar isAdmin={this.state.userData.isAdmin} playerData={this.state.playerData} addWindowSwitch={()=>{this.addWindowSwitch()}} toggleSettings={()=>this.toggleSettings()}/>
                <Settings amplifierMode={this.state.playerData.amplifierMode} setAmpMode={(e)=>this.setAmpMode(e)}
                    volume={this.state.volume} setVolume={(e, v)=>this.setVolume(e, v, true)} setVolumeTemp={(e, v)=>this.setVolume(e, v)}
                    open={this.state.settingsOpen} close={()=>this.toggleSettings()} 
                    openLibrary={()=>this.openLibrary()} openPlaylist={()=>this.openPlaylist()} openHistory={()=>this.openHistory()} openSuggestions={()=>this.openSuggestions()}/>
            </Router>
        );
    }
}