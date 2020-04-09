import React from 'react';
import ReactDOM from 'react-dom';
import Panel from './Panel';
import Login from './Login';
import Cookies from 'universal-cookie';


function HANDLEERROR(err){
    console.error("Propably logged out, redirecting to login page, but here is the error", err);
    changePage();//propably got logged out!
}


//TODO add onerror everywhere to handle connection problems 

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ )
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    return result;
 }

const cookies = new Cookies();

const adress = "https://"+window.location.hostname+"/api/";
var notificationID = makeid(8);
var actNotID = {msg:0, player:0, playlist:0};

function getUserData(cb, errCb){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"login/data/", cb!=null); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));//add here a cookie
    if(cb!=null)
        xmlHttp.onload = ()=>{
            cb(xmlHttp.responseText);
        }
    if(errCb!=null){
        xmlHttp.onerror = errCb;
        xmlHttp.ontimeout = errCb;
    }
    xmlHttp.send(null);
    if(cb==null)
        return xmlHttp.responseText;
}//TODO getStatusData(i propably meant amplifier status)


function login(response, cb){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"login", cb!=null ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    if(cb!=null){
        xmlHttp.onload = ()=>{
            if(xmlHttp.status !== 200){
                cb(false); return;
            }
            cookies.set('accessToken',  JSON.parse(xmlHttp.responseText).token, { Expires: new Date(new Date().getTime()+3600000).toUTCString() });
            changePage();
            cb(true);
        }
        xmlHttp.onerror = ()=>{
            cb(-1);
        }
        xmlHttp.ontimeout = ()=>{
            cb(-1);
        }
    }
    try{
        xmlHttp.send("accessToken="+response.accessToken);
    }catch(err){
        return -1;
    }
    if(cb==null){
        if(xmlHttp.status === 200){
            cookies.set('accessToken',  JSON.parse(xmlHttp.responseText).token, { Expires: new Date(new Date().getTime()+3600000).toUTCString() });
            changePage();
            return true;
        }
        return false;
    }
}

function downloadSong(ytUrl){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"player/download");
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));//add here a cookie
    xmlHttp.onerror = HANDLEERROR;
    xmlHttp.onload = ()=>{ 
        if(xmlHttp.status !== 200)
            HANDLEERROR(xmlHttp.responseText);
     }
    xmlHttp.send('{"url": "'+ytUrl+'"}');
    return false;
}
function playSong(fileName, songName, length){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"player/play");
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));//add here a cookie
    xmlHttp.onerror = HANDLEERROR;
    xmlHttp.onload = ()=>{ 
        if(xmlHttp.status !== 200)
            HANDLEERROR(xmlHttp.responseText);
     }
    xmlHttp.send(JSON.stringify({fileName:fileName, songName:songName, length:length}));
    return false;
}
function switchShuffle(play){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"player/play");
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));//add here a cookie
    xmlHttp.onerror = HANDLEERROR;
    xmlHttp.onload = ()=>{ 
        if(xmlHttp.status !== 200)
            HANDLEERROR(xmlHttp.responseText);
     }
    if(play)
        xmlHttp.send('{"shufflePlay": true}');
    else
        xmlHttp.send('{"shuffleSwitch": true}');
    return false;
}
function stopSong(fileName){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"player/stop");
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));//add here a cookie
    xmlHttp.onerror = HANDLEERROR;
    xmlHttp.onload = ()=>{ 
        if(xmlHttp.status !== 200)
            HANDLEERROR(xmlHttp.responseText);
     }
    xmlHttp.send(null);
    return false;
}
function findSong(songData, cb){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"player/list", cb!=null ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));//add here a cookie
    if(cb!=null)
        xmlHttp.onload = ()=>{
            var resp = JSON.parse(xmlHttp.responseText);
            cb(resp.result, resp.totalNum);
        };
    xmlHttp.send(JSON.stringify(songData));
    if(cb==null)
        return JSON.parse(xmlHttp.responseText).result;
}

function changePage(){
    getUserData((userData)=>{
        try{
            userData = JSON.parse(userData);
            ReactDOM.unmountComponentAtNode(document.getElementById('root'));
            if(!userData.loggedIn){
                ReactDOM.render(<Login />, document.getElementById('root'));
            }else if(userData.isAdmin){
                ReactDOM.render(<Panel userData={JSON.stringify(userData)}/>, document.getElementById('root'));
            }
        }catch(err){
            ReactDOM.render(<Login />, document.getElementById('root'));
            return;
        }
    }, (err)=>{
        ReactDOM.render(<Login />, document.getElementById('root'));
        return;
    })
}

function getPlayerData(cb){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"player/data/", cb!=null ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));

    if(cb != null)
        xmlHttp.onload = ()=>{ cb(JSON.parse(xmlHttp.responseText)); }

    xmlHttp.send(null);
    if(cb == null)
        return JSON.parse(xmlHttp.responseText);
}
function getPlaylistData(date, cb){
    if(typeof(date) === "function") { cb = date; date = null; }
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", adress+"player/getplaylist/", cb!=null);
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));

    if(cb!=null)
        xmlHttp.onload = ()=>{ cb(JSON.parse(xmlHttp.responseText)) };

    xmlHttp.send(JSON.stringify({date: date}));
    if(cb==null)
        return JSON.parse(xmlHttp.responseText);
}
function sendPlaylistData(data){
    if(data.date instanceof Date) data.date = data.date.getTime()
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", adress+"player/playlist/");
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));
    xmlHttp.send(JSON.stringify({entry: data}));
    return false;
}
function sendScheduleData(date){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", adress+"player/schedule/");
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));//add here a cookie
    xmlHttp.send(JSON.stringify({schedule: date}));
    return false;
}
function notificationHandler(callbackMsg, callbackPlayer, callbackPlaylist){
    setTimeout(()=>{
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "POST", adress+"notification/");
        xmlHttp.setRequestHeader("Content-Type", "application/json");
        xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));
        xmlHttp.timeout = 30000;
        xmlHttp.onload = function () {
            if(xmlHttp.status !== 200){
                HANDLEERROR(xmlHttp.responseText);
                return;
            }
            notificationHandler(callbackMsg, callbackPlayer, callbackPlaylist);
            try{
                const res = JSON.parse(xmlHttp.responseText);
                if(res.msg && res.notID >= actNotID.msg){
                    callbackMsg(res.msg);
                    actNotID.msg = res.notID;
                }
                if(res.player && res.notID >= actNotID.player){
                    callbackPlayer(res.player);
                    actNotID.player = res.notID;
                }
                if((res.playlist || res.amplifier) && res.notID >= actNotID.playlist){
                    callbackPlaylist(res.playlist, res.amplifier);
                    actNotID.playlist = res.notID;
                }
            }catch(e){
                console.error(xmlHttp.statusText);
            }
          };
        xmlHttp.onerror = HANDLEERROR;
        
        xmlHttp.ontimeout = function (e) {
            notificationHandler(callbackMsg, callbackPlayer, callbackPlaylist);
        };
        xmlHttp.send(JSON.stringify({id:notificationID}));
    }, 0);
}

export {getUserData, changePage, login as apiLogin, findSong, downloadSong, playSong, switchShuffle, stopSong, notificationHandler, getPlaylistData, getPlayerData, sendPlaylistData, sendScheduleData};