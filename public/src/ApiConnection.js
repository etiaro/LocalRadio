import React from 'react';
import ReactDOM from 'react-dom';
import Panel from './Panel';
import UserHome from './UserHome';
import Login, {DemoAlert, DemoLogin, Progress} from './Login';
import Cookies from 'universal-cookie';
import crypto from 'crypto-js';


function HANDLEERROR(err){
    console.error("Propably logged out, redirecting to login page, but here is the error", err);
    changePage();//propably got logged out!
}



function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ )
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    return result;
 }

const cookies = new Cookies();
var loginToken = cookies.get('accessToken');

const adress = "/api/";
var notificationID = makeid(8);
var actNotID = {player:0, playlist:0};

function getUserData(cb, errCb){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"login/data/", cb!=null); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xmlHttp.setRequestHeader("x-access-token", loginToken);
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
}


function login(response, cb){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"login", cb!=null ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    if(cb!=null){
        xmlHttp.onload = ()=>{
            if(xmlHttp.status !== 200){
                cb(false); return;
            }
            cookies.set('accessToken',  JSON.parse(xmlHttp.responseText).token, { Expires: new Date(new Date().getTime()+3600000).toUTCString(), path:"/" });
            loginToken = JSON.parse(xmlHttp.responseText).token;
            changePage(window.location.pathname.indexOf("password") !== -1 ? 1 : null);
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
        if(response.accessToken)
            xmlHttp.send("accessToken="+response.accessToken);
        else
            xmlHttp.send("password="+crypto.MD5(response.password));
    }catch(err){
        return -1;
    }

    if(cb==null){
        if(xmlHttp.status === 200){
            cookies.set('accessToken',  JSON.parse(xmlHttp.responseText).token, { Expires: new Date(new Date().getTime()+3600000).toUTCString(), path:"/" });
            loginToken = JSON.parse(xmlHttp.responseText).token;
            changePage(window.location.pathname.indexOf("password") !== -1 ? 1 : null);
            return true;
        }
        return false;
    }
}
function logout(){
    cookies.remove('accessToken',{path:"/"});
    loginToken = "";
    document.location.reload();
}

function downloadSong(ytUrl){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"player/download");
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", loginToken);//add here a cookie
    xmlHttp.onerror = HANDLEERROR;
    xmlHttp.onload = ()=>{ 
        if(xmlHttp.status !== 200)
            HANDLEERROR(xmlHttp.responseText);
     }
    xmlHttp.send('{"url": "'+ytUrl+'"}');
    return false;
}
function deleteSong(ytid){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"player/delete");
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", loginToken);//add here a cookie
    xmlHttp.onerror = HANDLEERROR;
    xmlHttp.onload = ()=>{ 
        if(xmlHttp.status !== 200)
            HANDLEERROR(xmlHttp.responseText);
     }
    xmlHttp.send(JSON.stringify({ytid:ytid}));
    return false;
}
function playSong(fileName, songName, length, ytid){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"player/play");
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", loginToken);//add here a cookie
    xmlHttp.onerror = HANDLEERROR;
    xmlHttp.onload = ()=>{ 
        if(xmlHttp.status !== 200)
            HANDLEERROR(xmlHttp.responseText);
     }
    xmlHttp.send(JSON.stringify({fileName:fileName, songName:songName, length:length, ytid:ytid}));
    return false;
}
function switchShuffle(play){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"player/play");
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", loginToken);//add here a cookie
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
function stopSong(){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"player/stop");
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", loginToken);//add here a cookie
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
    xmlHttp.setRequestHeader("x-access-token", loginToken);//add here a cookie
    if(cb!=null){
        xmlHttp.onload = ()=>{
            var resp = JSON.parse(xmlHttp.responseText);
            cb(resp.result, resp.totalNum);
        };
        xmlHttp.onerror = HANDLEERROR;
    }
    xmlHttp.send(JSON.stringify(songData));
    if(cb==null)
        return JSON.parse(xmlHttp.responseText).result;
}
function getHistory(date, site, cb){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"player/history", cb!=null ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", loginToken);//add here a cookie
    if(cb!=null){
        xmlHttp.onload = ()=>{
            var resp = JSON.parse(xmlHttp.responseText);
            cb(resp.result, resp.totalNum);
        };
        xmlHttp.onerror = HANDLEERROR;
    }
    xmlHttp.send(JSON.stringify({date:date, site:site}));
    if(cb==null)
        return JSON.parse(xmlHttp.responseText).result;
}
function suggest(data, cb){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"player/suggest", cb!=null ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", loginToken);//add here a cookie
    if(cb!=null){
        xmlHttp.onload = ()=>{
            var resp = JSON.parse(xmlHttp.responseText);
            cb(resp.result);
        };
        xmlHttp.onerror = HANDLEERROR;
    }
    xmlHttp.send(JSON.stringify({data:data}));
    if(cb==null)
        return JSON.parse(xmlHttp.responseText).result;
}
function getSuggestions(settings, cb){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"player/suggestions", cb!=null ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", loginToken);//add here a cookie
    if(cb!=null){
        xmlHttp.onload = ()=>{
            var resp = JSON.parse(xmlHttp.responseText);
            cb(resp.result, resp.totalNum);
        };
        xmlHttp.onerror = HANDLEERROR;
    }
    xmlHttp.send(JSON.stringify({data:settings}));
    if(cb==null)
        return JSON.parse(xmlHttp.responseText).result;
}
var Communicate = 0;
function changePage(to){
    ReactDOM.render(<Progress />, document.getElementById('root'));
    if(process.env.REACT_APP_DEMO){
        if(Communicate === 0){
            Communicate = 1;
            ReactDOM.render(<DemoAlert />, document.getElementById('root'));
        }else{
            if(to === 1) ReactDOM.render(<Panel userData={{id: "1", isAdmin: true}}/>, document.getElementById('root'));
            else if(to === 2) ReactDOM.render(<UserHome userData={{id: "1", isAdmin: false}}/>, document.getElementById('root'));
            else ReactDOM.render(<DemoLogin />, document.getElementById('root'));
        }
        return;
    }
    if(window.location.pathname.indexOf('password') !== -1 && !to){
        ReactDOM.render(<Login />, document.getElementById('root'));
        return;
    }
    
    getUserData((userData)=>{
        try{
            userData = JSON.parse(userData);
            ReactDOM.unmountComponentAtNode(document.getElementById('root'));
            if(userData.demo){
                if(Communicate === 0){
                    Communicate = 1;
                    ReactDOM.render(<DemoAlert />, document.getElementById('root'));
                }else{
                    if(to === 1) ReactDOM.render(<Panel userData={{id: "1", isAdmin: true}}/>, document.getElementById('root'));
                    else if(to === 2) ReactDOM.render(<UserHome userData={{id: "1", isAdmin: false}}/>, document.getElementById('root'));
                    else ReactDOM.render(<DemoLogin />, document.getElementById('root'));
                }
                return;
            }
            if(!userData.loggedIn){
                ReactDOM.render(<Login facebook={userData.useFacebook}/>, document.getElementById('root'));
            }else if(userData.isAdmin){
                ReactDOM.render(<Panel userData={userData}/>, document.getElementById('root'));
            }else{
                ReactDOM.render(<UserHome userData={userData}/>, document.getElementById('root'));
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
    xmlHttp.setRequestHeader("x-access-token", loginToken);

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
    xmlHttp.setRequestHeader("x-access-token", loginToken);

    if(cb!=null)
        xmlHttp.onload = ()=>{ cb(JSON.parse(xmlHttp.responseText)) };

    xmlHttp.send(JSON.stringify({date: date}));
    if(cb==null)
        return JSON.parse(xmlHttp.responseText);
}
function sendPlaylistData(data, cb){
    if(data.date instanceof Date) data.date = data.date.getTime()
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", adress+"player/playlist/");
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", loginToken);
    if(cb){
        xmlHttp.onload = ()=>{
            cb(JSON.parse(xmlHttp.responseText))
        }
    }
    xmlHttp.send(JSON.stringify({entry: data}));
    return false;
}
function sendScheduleData(date){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", adress+"player/schedule/");
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", loginToken);//add here a cookie
    xmlHttp.send(JSON.stringify({schedule: date}));
    return false;
}
function sendAmpMode(mode){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", adress+"player/amplifier/");
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", loginToken);//add here a cookie
    xmlHttp.send(JSON.stringify({mode: mode}));
    return false;
}
function sendVolume(vol){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", adress+"player/volume/");
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", loginToken);//add here a cookie
    xmlHttp.send(JSON.stringify({volume: vol}));
    return false;
}
function notificationHandler(callbackMsg, callbackPlayer, callbackPlaylist, callbackLibrary){
    setTimeout(()=>{
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "POST", adress+"notification/");
        xmlHttp.setRequestHeader("Content-Type", "application/json");
        xmlHttp.setRequestHeader("x-access-token", loginToken);
        xmlHttp.timeout = 30000;
        xmlHttp.onload = function () {
            if(xmlHttp.status !== 200){
                HANDLEERROR(xmlHttp.responseText);
                return;
            }
            notificationHandler(callbackMsg, callbackPlayer, callbackPlaylist, callbackLibrary);
            try{
                const res = JSON.parse(xmlHttp.responseText);
                if(res.msg){
                    callbackMsg(res.msg);
                }
                if(res.player && res.notID >= actNotID.player){
                    callbackPlayer(res.player);
                    actNotID.player = res.notID % 200000008;
                }
                if((res.playlist || res.amplifier) && res.notID >= actNotID.playlist){
                    callbackPlaylist(res.playlist, res.amplifier);
                    actNotID.playlist = res.notID % 200000008;
                }
                if(res.newSong || res.deletedSong){
                    callbackLibrary(res.newSong);
                }
            }catch(e){
                console.error(e);
            }
          };
        xmlHttp.onerror = HANDLEERROR;
        
        xmlHttp.ontimeout = function (e) {
            notificationHandler(callbackMsg, callbackPlayer, callbackPlaylist, callbackLibrary);
        };
        xmlHttp.send(JSON.stringify({id:notificationID}));
    }, 0);
}

export {getUserData, changePage, login as apiLogin, logout, findSong, getHistory, getSuggestions, suggest, downloadSong,deleteSong, playSong, switchShuffle, stopSong, notificationHandler, getPlaylistData, getPlayerData, sendPlaylistData, sendScheduleData, sendAmpMode, sendVolume};